/**
 * Solicitudes en línea — el cliente pide sus comprobantes desde /solicitar y el
 * operador las convierte en orden desde la bandeja "Solicitudes web".
 *
 * La tabla se crea con `supabase/PRODUCCION_solicitudes_web.sql`. La lógica pura
 * (validación, código, URL hacia Nueva Orden) está separada de Supabase para
 * poder probarla sin red: `__tests__/services/solicitudesWeb.test.ts`.
 */
import { supabase } from './supabase';

export type EstadoSolicitud = 'NUEVA' | 'EN_PROCESO' | 'CONVERTIDA' | 'DESCARTADA';
export type TramiteSolicitud = 'NUEVO' | 'MISMO' | 'CAMBIO' | 'AUMENTO';

/**
 * Documentos que se piden. `docType` es el código que entiende Nueva Orden y la
 * extensión (0 factura, 1 nota de venta, 5 guía); los demás viajan por nombre.
 */
export const DOCUMENTOS_SRI = [
    { id: 'factura', nombre: 'Factura', docType: '0', ayuda: 'Régimen General y RIMPE Emprendedor' },
    { id: 'nota-venta', nombre: 'Nota de Venta', docType: '1', ayuda: 'RIMPE Negocio Popular' },
    { id: 'liquidacion', nombre: 'Liquidación de Compra', docType: '', ayuda: 'Compras a personas sin RUC' },
    { id: 'guia', nombre: 'Guía de Remisión', docType: '5', ayuda: 'Traslado de mercadería' },
    { id: 'retencion', nombre: 'Comprobante de Retención', docType: '', ayuda: 'Agentes de retención' },
    { id: 'nota-credito', nombre: 'Nota de Crédito', docType: '', ayuda: 'Devoluciones y descuentos' },
    { id: 'nota-debito', nombre: 'Nota de Débito', docType: '', ayuda: 'Cargos adicionales' },
] as const;

/** Hojas por pedido. Coinciden con los talonarios del catálogo (1, 2, 5 y 10 blocks de 100). */
export const CANTIDADES = [100, 200, 500, 1000];
export const COPIAS = ['Original + 1 copia', 'Original + 2 copias'];
export const TAMANOS = ['1/4 Oficio', 'Medio Oficio', 'A4'];
export const TRAMITES: { id: TramiteSolicitud; label: string; ayuda: string }[] = [
    { id: 'NUEVO', label: 'Primera vez', ayuda: 'Nunca imprimí estos comprobantes' },
    { id: 'MISMO', label: 'Reimpresión igual', ayuda: 'Mismos datos que la vez anterior' },
    { id: 'CAMBIO', label: 'Reimpresión con cambios', ayuda: 'Cambió dirección, nombre o logo' },
    { id: 'AUMENTO', label: 'Aumentar cantidad', ayuda: 'Necesito más que la última vez' },
];
export const ENTREGAS = ['Retiro en el taller', 'Envío a domicilio'];

export interface SolicitudWebInput {
    ruc: string;
    razonSocial: string;
    nombreComercial?: string;
    telefono: string;
    email?: string;
    direccion?: string;
    actividad?: string;
    regimen?: string;
    documento: string;
    cantidad: number;
    copias?: string;
    tamano?: string;
    establecimiento?: string;
    puntoEmision?: string;
    tramite?: TramiteSolicitud;
    entrega?: string;
    notas?: string;
    aceptaDatos: boolean;
}

export interface SolicitudWeb extends SolicitudWebInput {
    id: string;
    codigo: string;
    createdAt: string;
    estado: EstadoSolicitud;
    trabajoId?: string | null;
    atendidoPor?: string | null;
    notaInterna?: string | null;
}

// ── Lógica pura ──────────────────────────────────────────────────────────────

export const soloDigitos = (s: string | undefined | null) => String(s ?? '').replace(/\D/g, '');

/** Teléfono a formato local: 09XXXXXXXX. Acepta +593 9…, 593 9…, 9… */
export const normalizarTelefono = (raw: string): string => {
    let d = soloDigitos(raw);
    if (d.startsWith('593')) d = '0' + d.slice(3);
    if (d.length === 9 && d.startsWith('9')) d = '0' + d;
    return d;
};

const tresDigitos = (s: string | undefined, porDefecto = '001') => {
    const d = soloDigitos(s);
    return d ? d.padStart(3, '0').slice(-3) : porDefecto;
};

/** Devuelve el primer problema encontrado, o null si la solicitud es válida. */
export const validarSolicitud = (s: SolicitudWebInput): string | null => {
    const ruc = soloDigitos(s.ruc);
    if (ruc.length !== 13 && ruc.length !== 10) return 'El RUC debe tener 13 dígitos (o 10 si es cédula).';
    if (ruc.length === 13 && !/^\d{10}00[1-9]$/.test(ruc)) return 'Revisá el RUC: los 3 últimos dígitos suelen ser 001.';
    if ((s.razonSocial || '').trim().length < 2) return 'Escribí la razón social o tu nombre completo.';
    const tel = normalizarTelefono(s.telefono);
    if (!/^0\d{8,9}$/.test(tel)) return 'Escribí un celular válido, por ejemplo 0991234567.';
    if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) return 'El correo no parece válido.';
    if (!s.documento) return 'Elegí qué comprobante necesitás.';
    if (!Number.isFinite(s.cantidad) || s.cantidad < 1) return 'Elegí la cantidad.';
    if (!s.aceptaDatos) return 'Necesitamos tu autorización para usar los datos en el trámite.';
    return null;
};

/** Código corto para que el cliente lo cite por WhatsApp. Sin letras confundibles (0/O, 1/I). */
export const generarCodigo = (rand: () => number = Math.random): string => {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let c = '';
    for (let i = 0; i < 6; i++) c += abc[Math.floor(rand() * abc.length)];
    return `SW-${c}`;
};

export const docTypeDe = (documento: string): string =>
    DOCUMENTOS_SRI.find(d => d.nombre === documento)?.docType ?? '';

/**
 * Link a Nueva Orden con la solicitud precargada. Usa los mismos parámetros que
 * ya entiende `applySriPayload` (los que manda la extensión), más `solicitud`
 * para vincular la orden creada con la solicitud.
 */
export const urlNuevaOrdenDesde = (s: SolicitudWeb): string => {
    const p = new URLSearchParams();
    p.set('mode', 'sri-sobre-preimpreso');
    p.set('ruc', soloDigitos(s.ruc));
    p.set('name', s.razonSocial.trim());
    p.set('phone', normalizarTelefono(s.telefono));
    if (s.email) p.set('email', s.email.trim());
    if (s.direccion) p.set('direccion', s.direccion.trim());
    if (s.actividad) p.set('activity', s.actividad.trim());
    const docType = docTypeDe(s.documento);
    // Sin código conocido se manda 'otro' para que no caiga en el default "Nota de Venta".
    p.set('docType', docType || 'otro');
    p.set('doc', s.documento);
    p.set('blocks', String(s.cantidad));
    if (s.tamano) p.set('tamano', s.tamano);
    p.set('est', tresDigitos(s.establecimiento));
    p.set('pto', tresDigitos(s.puntoEmision));
    if (s.tramite && s.tramite !== 'NUEVO') p.set('tramite', s.tramite);
    p.set('solicitud', s.id);
    return `/nuevo?${p.toString()}`;
};

/**
 * Texto para WhatsApp con TODA la solicitud: respaldo cuando no se puede guardar
 * (sin conexión, tabla aún no creada). El pedido no se pierde.
 */
export const mensajeWhatsAppSolicitud = (s: SolicitudWebInput): string => {
    const tramite = TRAMITES.find(t => t.id === s.tramite)?.label;
    return [
        'Hola Imprenta Córdova, quiero pedir mis comprobantes:',
        `• RUC: ${soloDigitos(s.ruc)}`,
        `• Razón social: ${s.razonSocial.trim()}`,
        s.nombreComercial ? `• Nombre comercial: ${s.nombreComercial.trim()}` : '',
        `• Documento: ${s.documento} · ${s.cantidad} hojas`,
        [s.copias, s.tamano].filter(Boolean).length ? `• ${[s.copias, s.tamano].filter(Boolean).join(' · ')}` : '',
        `• Establecimiento: ${tresDigitos(s.establecimiento)}-${tresDigitos(s.puntoEmision)}`,
        tramite ? `• Trámite: ${tramite}` : '',
        s.direccion ? `• Dirección: ${s.direccion.trim()}` : '',
        s.entrega ? `• Entrega: ${s.entrega}` : '',
        s.notas ? `• Indicaciones: ${s.notas.trim()}` : '',
        `• Celular: ${normalizarTelefono(s.telefono)}`,
    ].filter(Boolean).join('\n');
};

const filaAInsert = (s: SolicitudWebInput, codigo: string) => ({
    codigo,
    estado: 'NUEVA',
    ruc: soloDigitos(s.ruc),
    razon_social: s.razonSocial.trim().toUpperCase(),
    nombre_comercial: s.nombreComercial?.trim() || null,
    telefono: normalizarTelefono(s.telefono),
    email: s.email?.trim().toLowerCase() || null,
    direccion: s.direccion?.trim() || null,
    actividad: s.actividad?.trim() || null,
    regimen: s.regimen?.trim() || null,
    documento: s.documento,
    cantidad: Math.round(s.cantidad),
    copias: s.copias || null,
    tamano: s.tamano || null,
    establecimiento: tresDigitos(s.establecimiento),
    punto_emision: tresDigitos(s.puntoEmision),
    tramite: s.tramite || null,
    entrega: s.entrega || null,
    notas: s.notas?.trim().slice(0, 1000) || null,
    acepta_datos: s.aceptaDatos,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const filaASolicitud = (r: any): SolicitudWeb => ({
    id: r.id,
    codigo: r.codigo,
    createdAt: r.created_at,
    estado: r.estado,
    ruc: r.ruc,
    razonSocial: r.razon_social,
    nombreComercial: r.nombre_comercial ?? undefined,
    telefono: r.telefono,
    email: r.email ?? undefined,
    direccion: r.direccion ?? undefined,
    actividad: r.actividad ?? undefined,
    regimen: r.regimen ?? undefined,
    documento: r.documento,
    cantidad: Number(r.cantidad) || 0,
    copias: r.copias ?? undefined,
    tamano: r.tamano ?? undefined,
    establecimiento: r.establecimiento ?? undefined,
    puntoEmision: r.punto_emision ?? undefined,
    tramite: r.tramite ?? undefined,
    entrega: r.entrega ?? undefined,
    notas: r.notas ?? undefined,
    aceptaDatos: !!r.acepta_datos,
    trabajoId: r.trabajo_id,
    atendidoPor: r.atendido_por,
    notaInterna: r.nota_interna,
});

// ── Acceso a datos ───────────────────────────────────────────────────────────

const errorTabla = (msg: string) =>
    /does not exist|schema cache|relation/i.test(msg)
        ? 'Falta crear la tabla de solicitudes (supabase/PRODUCCION_solicitudes_web.sql).'
        : /failed to fetch|network/i.test(msg)
            ? 'Sin conexión con la base de datos. Revisá el internet e intentá de nuevo.'
            : msg;

export const solicitudesWebService = {
    /** Crea la solicitud. Reintenta si el código aleatorio choca con uno existente. */
    async crear(input: SolicitudWebInput): Promise<{ codigo: string }> {
        const problema = validarSolicitud(input);
        if (problema) throw new Error(problema);
        for (let intento = 0; intento < 3; intento++) {
            const codigo = generarCodigo();
            // Sin `.select()`: el público solo tiene permiso de INSERT.
            const { error } = await supabase.from('solicitudes_web').insert(filaAInsert(input, codigo));
            if (!error) return { codigo };
            if (error.code !== '23505') throw new Error(errorTabla(error.message));
        }
        throw new Error('No se pudo generar el código de la solicitud. Intentá de nuevo.');
    },

    async listar(): Promise<SolicitudWeb[]> {
        const { data, error } = await supabase
            .from('solicitudes_web')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(300);
        if (error) throw new Error(errorTabla(error.message));
        return (data || []).map(filaASolicitud);
    },

    /** Cantidad de solicitudes sin atender (para el contador del menú). 0 si la tabla no existe. */
    async contarNuevas(): Promise<number> {
        const { count, error } = await supabase
            .from('solicitudes_web')
            .select('id', { count: 'exact', head: true })
            .eq('estado', 'NUEVA');
        return error ? 0 : count || 0;
    },

    async cambiarEstado(id: string, estado: EstadoSolicitud, usuario: string, notaInterna?: string): Promise<void> {
        const cambios: Record<string, unknown> = { estado, atendido_por: usuario, updated_at: new Date().toISOString() };
        if (notaInterna !== undefined) cambios.nota_interna = notaInterna;
        const { error } = await supabase.from('solicitudes_web').update(cambios).eq('id', id);
        if (error) throw new Error(errorTabla(error.message));
    },

    async vincularOrden(id: string, trabajoId: string, usuario: string): Promise<void> {
        const { error } = await supabase
            .from('solicitudes_web')
            .update({ estado: 'CONVERTIDA', trabajo_id: trabajoId, atendido_por: usuario, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw new Error(errorTabla(error.message));
    },
};
