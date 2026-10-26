import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo } from '../types';
import { 
    PrinterIcon, ArrowDownTrayIcon, ArrowLeftIcon, 
    Loader2Icon, HomeIcon, AlertTriangleIcon
} from '../components/Icons';
import { supabase } from '../services/supabase';
import html2pdf from 'html2pdf.js';
import { MODELOS, TRAMITES_SRI, marcadoTramite, resolverModelo, resolverTramite, type TramiteSri } from '../services/printModels';
// El mapeo de la fila vive en UN solo lugar (contexts/TrabajosContext.tsx). Antes había una
// copia local acá que se desincronizaba en silencio.
import { mapDBTrabajo } from '../contexts/TrabajosContext';
import {
    CALIBRACION_CERO,
    PASO_MM,
    cargarCalibracion,
    describirCalibracion,
    esCalibracionCero,
    guardarCalibracion,
    moverCalibracion,
    transformCalibracion,
    type Calibracion,
} from '../services/registroImpresion';

/* ============================================================================
 * MEDIO OFICIO 160 × 220 mm — geometría MEDIDA del formulario SRI
 * ============================================================================
 *
 * De dónde salen estos números (no son estimaciones de diseño):
 * se midió el preimpreso real `formatos/medio oficio.jpeg`. La foto viene girada
 * 90° antihorario, así que primero se enderezó; después se detectó, píxel a píxel,
 * el recuadro navy del propio formulario (fila y columna a fila y columna) y se
 * tomó ESA caja como 0–100 %, que es lo que corrige la perspectiva de la foto.
 * Sobre esa caja se midieron las líneas punteadas de llenado, los bordes de las
 * 13 casillas del RUC, los separadores de la tabla de 7 columnas, los recuadros
 * blancos del pie y las bandas de arte. Las bandas grandes coinciden con la tabla
 * "Estructura" de `formatos/ESPECIFICACIONES.md` §1 (cabecera 0–11,8 %; faja del
 * título 11,8–14,4 %; banda "SOLICITO…" 39,5–42 %; tabla 42,2–66,7 %; NOTA
 * IMPORTANTE 74,1–80,9 %; pie 94,8–100 %).
 *
 * TODO está en PORCENTAJE del ancho (x) y del alto (y) del papel, porque el
 * documento se imprime a 160 × 220 mm y el porcentaje no depende de la resolución.
 *
 * Dos formas de anclar el texto, que son las dos del formulario real:
 *   'linea'  el valor va SOBRE la línea punteada (su base toca la línea)
 *   'centro' el valor se centra dentro de la casilla impresa
 * ========================================================================== */
const GEO_SRI160 = {
  cuerpo: {
    y: {
      apellidos: 17.6,
      razonSocial: 20.5,
      actividad: 23.2,
      // Tira del RUC: 24,5 % arriba – 27,0 % abajo (borde a borde de las casillas).
      rucArriba: 24.5,
      rucAbajo: 27.0,
      clave: 26.9,
      // Hora, Fecha y los dos juegos L M M J V S comparten banda: 30,3 – 31,8 %.
      hora: 31.7,
      fechaArriba: 30.3,
      fechaAbajo: 31.8,
      /** Arranque de las cabeceras navy DÍA/MES/AÑO y L M M J V S (28,8 %). */
      fechaCabeceraArriba: 28.8,
      telef: 35.0,
      correo: 38.4,
    },
    x: {
      /** Margen izquierdo de las etiquetas impresas del cuerpo. */
      etiqueta: 2.5,
      /** Hasta dónde llegan las líneas punteadas de llenado. */
      margenDer: 96.0,
      apellidos: 21.5,
      razonSocial: 16.5,
      actividad: 16.2,
      /** 13 casillas iguales: borde izquierdo del RUC y ancho de cada una. */
      rucIzq: 12.16,
      rucAncho: 3.353,
      rucCasillas: 13,
      /** Las 3 últimas casillas ya vienen impresas con "0 0 1": no se vuelven a llenar. */
      rucPreimpresas: 3,
      claveEtiqueta: 57.8,
      clave: 65.4,
      hora: 9.3,
      horaFin: 14.8,
      fechaEtiqueta: 16.3,
      /** Cortes de las 3 casillas DÍA | MES | AÑO (AÑO es más ancha, como en el formato). */
      fecha: [23.29, 28.14, 33.56, 40.97],
      entregaEtiqueta: 59.1,
      entrega: 76.0,
      entregaFin: 81.0,
      /** 6 casillas L M M J V S — cortes medidos (juego de la fecha y juego de la entrega). */
      lmmjvsFecha: [41.54, 44.34, 47.2, 50.05, 52.9, 55.75, 58.6],
      lmmjvsEntrega: [81.32, 84.08, 86.84, 89.59, 92.4, 95.2, 97.96],
      telef: 32.9,
      correo: 18.1,
    },
    /**
     * Casillas de marcado de la fila del teléfono (Aument. / Cambiar. / Mismo.).
     *
     * La geometría se leyó a ojo de la foto (no salió del perfil de columnas, como el
     * resto). El rectángulo es arte del formulario, pero la casilla SÍ lleva dato: en el
     * sobre preimpreso las tres casillas ya vienen impresas y la capa de datos sólo pone
     * el til de la elegida.
     *
     * Va llaveado por trámite y no por posición: así agregar o reordenar una casilla no
     * puede marcar la equivocada. El rótulo lo pone `TRAMITES_SRI` (una sola fuente), y
     * el `Record<TramiteSri, …>` obliga a que los tres trámites tengan geometría.
     */
    marcado: {
      AUMENTO: { xEtiqueta: 8.1, x: 13.1, ancho: 2.9 },
      CAMBIO: { xEtiqueta: 16.4, x: 21.5, ancho: 3.0 },
      MISMO: { xEtiqueta: 25.5, x: 29.5, ancho: 2.6 },
    } satisfies Record<TramiteSri, { xEtiqueta: number; x: number; ancho: number }>,
  },
  tabla: {
    /** 8 líneas horizontales = cabecera + 6 filas de datos (medidas). */
    y: [42.7, 45.45, 48.8, 52.5, 56.1, 59.5, 62.8, 66.2],
    /** 8 cortes verticales = 7 columnas (medidos con el perfil de columnas). */
    x: [0.6, 8.89, 37.98, 51.76, 63.02, 74.76, 86.88, 99.6],
    cabecera: ['TAMAÑO', 'TIPO DE DOCUMENTO', 'PAPEL', 'ESTABLEC.', 'PUNTO EMISION', 'CANTIDAD', 'PRECIO'],
    /** Filas rotuladas del preimpreso. La 6.ª va en blanco para escribir a mano. */
    filas: [
      'Nota de Venta',
      'Guía de Remisión',
      'Nota de Crédito',
      'Liquidación de Compras o Prestación de Servicios',
      'RECIBOS',
      '',
    ],
    /** Columna del papel: 2 casillas (Químico | Bond) por fila. */
    papel: 2,
  },
  /** Pie navy: 3 recuadros blancos medidos, con el valor centrado dentro. */
  pie: {
    y: 97.0,
    bandaArriba: 94.3,
    cajas: [
      { x0: 12.93, x1: 29.09 },
      { x0: 45.91, x1: 63.78 },
      { x0: 77.76, x1: 97.62 },
    ],
    etiquetas: ['Valor $', 'Abona $', 'Saldo $'],
  },
  /** Bloques del arte completo (la variante sobre hoja en blanco). */
  arte: {
    cabeceraAlto: 11.8,
    fajaTituloAlto: 2.6,
    solicitoArriba: 39.6,
    solicitoAlto: 2.3,
    detallesEtiquetaY: 68.9,
    detallesLineas: [70.2, 71.6],
    notaArriba: 73.5,
    notaAbajo: 80.9,
    notaDivisorX: 40.0,
    firmaArriba: 82.2,
    firmaAbajo: 94.3,
    firmaDivisorX: 39.6,
    declaracion: { x0: 1.5, x1: 39.0, arriba: 81.9, abajo: 88.6 },
    notaTerceroY: 89.6,
    firmaLineaY: 86.6,
    firmaLineaX0: 62.0,
    firmaLineaX1: 95.0,
    firmaTextoY: 87.7,
    razonSocialLineaY: 90.8,
    ciLineaY: 93.4,
  },
  /** Leyendas fijas del formulario (texto literal del preimpreso). */
  leyendas: {
    titulo: 'SOLICITUD DE AUTORIZACION DE IMPRESIÓN SRI',
    solicito: 'SOLICITO LA ELABORACIÓN DE LOS DOCUMENTOS DETALLADOS A CONTINUACIÓN:',
    notaImportante: 'NOTA IMPORTANTE:',
    notaRetiro:
      'PASADO EL MES DE NO HABER RETIRADO SUS DOCUMENTOS (FACTURAS, RETENCIONES, GUÍAS, ETC.) NO NOS HACEMOS RESPONSABLES DE SU ABONO Y TODO RECLAMO QUEDA ANULADO.',
    sinRecibo: 'SIN RECIBO PIERDE EL DERECHO A RETIRAR SU TRABAJO Y SU DINERO',
    declaracion:
      'Declaro que los datos proporcionados en esta solicitud son exactos y verdaderos, por lo que asumo la responsabilidad sobre su presentación.',
    notaTercero:
      'Nota: En caso de que el tramite sea realizado por un tercero deberá adjuntar poder especial o general.',
  },
} as const;

/** Tipografía de las etiquetas del formulario: negrita cursiva serif, como el preimpreso. */
const FUENTE_ETIQUETA = '"Times New Roman", Times, serif';

/**
 * Un valor suelto, posicionado en porcentaje.
 *
 * No lleva fondo, ni borde, ni etiqueta: en la variante sobre preimpreso el sistema
 * sólo aporta tinta donde van los datos. En la variante de arte completo el mismo
 * valor cae sobre las casillas que dibuja `renderArteFormulario`.
 */
const Valor: React.FC<{
  x: number;
  y: number;
  ancho?: number;
  anclaje?: 'linea' | 'centro';
  alineacion?: 'left' | 'center' | 'right';
  tamanoMm?: number;
  mono?: boolean;
  children: React.ReactNode;
}> = ({ x, y, ancho, anclaje = 'linea', alineacion = 'left', tamanoMm = 2.7, mono = false, children }) => (
  <div
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      width: ancho === undefined ? undefined : `${ancho}%`,
      transform: anclaje === 'centro' ? 'translateY(-50%)' : 'translateY(-100%)',
      textAlign: alineacion,
      fontSize: `${tamanoMm}mm`,
      lineHeight: 1,
      fontWeight: 700,
      color: '#0A1A46',
      fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : undefined,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      letterSpacing: '0.01em',
    }}
  >
    {children}
  </div>
);

/** Etiqueta impresa del formulario (sólo en el arte completo). */
const EtiquetaFormulario: React.FC<{
  x: number;
  y: number;
  anclaje?: 'linea' | 'centro';
  tamanoMm?: number;
  children: React.ReactNode;
}> = ({ x, y, anclaje = 'linea', tamanoMm = 2.5, children }) => (
  <div
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      transform: anclaje === 'centro' ? 'translateY(-50%)' : 'translateY(-100%)',
      fontSize: `${tamanoMm}mm`,
      lineHeight: 1,
      fontWeight: 700,
      fontStyle: 'italic',
      fontFamily: FUENTE_ETIQUETA,
      color: '#0A1A46',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </div>
);

/** Línea punteada de llenado del formulario (sólo en el arte completo). */
const LineaLlenado: React.FC<{ x0: number; x1: number; y: number }> = ({ x0, x1, y }) => (
  <div
    style={{
      position: 'absolute',
      left: `${x0}%`,
      top: `${y}%`,
      width: `${x1 - x0}%`,
      borderBottom: '0.3mm dotted #0A1A46',
    }}
  />
);

/**
 * En qué fila de la tabla cae el documento de esta orden.
 *
 * Ojo con el preimpreso: sus 6 filas son Nota de Venta, Guía de Remisión, Nota de
 * Crédito, Liquidación de Compras, RECIBOS y una fila en blanco. NO hay fila de
 * Factura, así que una factura se declara en la fila en blanco (y ahí sí se imprime
 * el nombre del documento, porque el preimpreso no lo trae).
 *
 * Devuelve -1 si el tipo no se reconoce: en ese caso no se imprime NADA en la tabla.
 * Declarar el documento en la fila equivocada es peor que dejar la fila vacía.
 *
 * Ojo con el plural: 'NOTAS DE VENTA' no contiene 'NOTA DE VENTA'.
 */
const filaDocumento = (tipo: string): number => {
  const t = (tipo || '').toLowerCase();
  if (t.includes('credito') || t.includes('crédito')) return 2;
  if (t.includes('liquid')) return 3;
  if (t.includes('recibo')) return 4;
  if (t.includes('guia') || t.includes('guía')) return 1;
  if (t.includes('nota') || t.includes('venta')) return 0;
  if (t.includes('factura')) return 5;
  return -1;
};

/** Texto seguro para imprimir: nunca deja pasar `undefined` ni `NaN`. */
const texto = (valor: unknown, respaldo = ''): string => {
  if (valor === null || valor === undefined) return respaldo;
  const s = String(valor).trim();
  return s.length > 0 ? s : respaldo;
};

/** Número seguro para imprimir: `NaN` e `Infinity` caen al respaldo. */
const numero = (valor: unknown, respaldo = 0): number => {
  const n = typeof valor === 'number' ? valor : parseFloat(String(valor ?? ''));
  return Number.isFinite(n) ? n : respaldo;
};

/** Botón de las flechas de calibración de registro. */
const BTN_REGISTRO: React.CSSProperties = {
    width: 34, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    background: '#FFFFFF', border: '1px solid #D7DDF0', borderRadius: 8,
    fontSize: 14, fontWeight: 700, color: '#16309B', cursor: 'pointer', fontFamily: 'inherit',
};

const SolicitudImpresionPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const format = queryParams.get('format') || 'a5';
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);

    /*
     * Variante de producción del talonario. Esta página SIEMPRE es una solicitud SRI, así
     * que un `?mode=` comercial se rechaza solo.
     *
     * Precedencia: `?mode=` (override explícito) > el modelo GUARDADO en la orden > default.
     * Que la orden mande es lo que hace que la extensión de Chrome y esta página impriman la
     * misma variante sin depender de la URL.
     */
    const [modelo, setModelo] = useState<ModeloImpresion>(() =>
        resolverModelo(null, queryParams.get('mode'), true)
    );
    const [mostrarGuiaVisual, setMostrarGuiaVisual] = useState<boolean>(true);
    const descriptorModelo = MODELOS[modelo] || MODELOS['sri-sobre-preimpreso'];

    useEffect(() => {
        if (trabajo?.modeloImpresion && !queryParams.get('mode')) {
            setModelo(resolverModelo(trabajo.modeloImpresion, null, true));
        }
    }, [trabajo?.modeloImpresion]);

    /*
     * Calibración de registro. Las variantes que van sobre un formulario YA impreso necesitan
     * que la hoja entre siempre en la misma posición, y eso depende de la impresora, no del
     * sistema. Acá se corre el contenido en milímetros hasta que los datos caigan en las
     * casillas. Se guarda POR MODELO: el medio oficio y el recibo cargan distinto.
     *
     * Sólo aplica a las variantes de talonario: la versión PC (A4) no necesita registro.
     */
    const [calibracion, setCalibracion] = useState<Calibracion>(CALIBRACION_CERO);
    useEffect(() => { setCalibracion(cargarCalibracion(modelo)); }, [modelo]);

    const moverRegistro = (dxMm: number, dyMm: number) => {
        const siguiente = moverCalibracion(calibracion, dxMm, dyMm);
        setCalibracion(siguiente);
        guardarCalibracion(modelo, siguiente);
    };

    const restablecerRegistro = () => {
        setCalibracion(CALIBRACION_CERO);
        guardarCalibracion(modelo, CALIBRACION_CERO);
    };
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

    useEffect(() => {
        const rucParam = queryParams.get('ruc') || '';
        const nameParam = queryParams.get('name') || queryParams.get('nombre') || '';

        // Soporte directo para solicitudes abiertas desde la extensión de Chrome con query params
        if (trabajoId === 'directo' || (rucParam && (!trabajoId || trabajoId === 'nuevo' || !trabajos.some(t => t.id === trabajoId)))) {
            const fallbackTotal = parseFloat(queryParams.get('total') || '13.00');
            const fallbackAbono = parseFloat(queryParams.get('abono') || '0.00');
            const fallbackSaldo = Math.max(0, fallbackTotal - fallbackAbono);
            const fallbackQty = parseInt(queryParams.get('blocks') || queryParams.get('qty') || '100', 10);
            const fallbackDoc = queryParams.get('doc') || queryParams.get('docType') || 'Nota de Venta';
            const fallbackSize = queryParams.get('docSize') || queryParams.get('tamano') || '1/4 Oficio';
            const fallbackActividad = (queryParams.get('activity') || queryParams.get('actividad') || 'COMERCIO / SERVICIOS GENERAL').toUpperCase();

            setTrabajo({
                id: 'directo',
                orden: queryParams.get('orden') || 'SRI-' + Math.floor(100000 + Math.random() * 900000),
                clienteId: 'directo',
                titular: (nameParam || 'CONTRIBUYENTE SRI').toUpperCase(),
                tipo: fallbackDoc,
                subtipo: `${fallbackQty} Hojas (${fallbackSize})`,
                tamano: fallbackSize,
                cantidad: fallbackQty,
                establecimiento: queryParams.get('est') || '001',
                puntoEmision: queryParams.get('pto') || '001',
                secuenciaInicio: queryParams.get('desde') || '0000001',
                secuenciaFin: queryParams.get('hasta') || '0000100',
                total: fallbackTotal,
                abono: fallbackAbono,
                saldo: fallbackSaldo,
                tramiteSri: (queryParams.get('tramite') as any) || 'MISMO',
                actividadSeleccionada: fallbackActividad,
                fechaEntrada: new Date().toISOString(),
                fechaEntrega: new Date(Date.now() + 86400000).toISOString(),
                estado: 'ENTREGADO',
            });

            setCliente({
                id: 'directo',
                nombre: (nameParam || 'CONTRIBUYENTE SRI').toUpperCase(),
                nombreComercial: (queryParams.get('nombreComercial') || nameParam || 'CONTRIBUYENTE SRI').toUpperCase(),
                ruc: rucParam || '0700000000001',
                cedula: rucParam || '0700000000001',
                telefono: queryParams.get('phone') ? [queryParams.get('phone')!] : ['0993083943'],
                email: queryParams.get('email') || '',
                actividades: fallbackActividad,
            });
            setIsRetrying(false);
            return;
        }

        if (!trabajoId) return;

        const fetchDirectly = async () => {
            setIsRetrying(true);
            try {
                const { data: tData, error: tError } = await supabase
                    .from('trabajos')
                    .select('*')
                    .eq('id', trabajoId)
                    .single();
                
                if (tError) throw tError;
                if (tData) {
                    const mappedT = mapDBTrabajo(tData);
                    setTrabajo(mappedT);
                    
                    const { data: cData, error: cError } = await supabase
                        .from('clientes')
                        .select('*')
                        .eq('id', mappedT.clienteId)
                        .single();
                    
                    if (!cError && cData) {
                        setCliente(cData);
                    }
                }
            } catch (err) {
                console.error("[SolicitudImpresion] Error en fetch directo:", err);
                setError("Documento no encontrado en la base de datos.");
            } finally {
                setIsRetrying(false);
            }
        };

        if (dataLoading) return;

        const currentTrabajo = trabajos.find(t => t.id === trabajoId);
        if (currentTrabajo) {
            setTrabajo(currentTrabajo);
            const foundCliente = clientes.find(c => c.id === currentTrabajo.clienteId) || null;
            if (foundCliente) {
                setCliente(foundCliente);
            } else {
                fetchDirectly();
            }
        } else {
            fetchDirectly();
        }
    }, [trabajoId, trabajos, clientes, dataLoading]);

    const config = {
        direccion: cloudConfig?.direccion || 'Colón e/. Sucre y Av. Rocafuerte',
        telefono: cloudConfig?.imprentaTelefono || '0993083943 • 0962585172',
        ruc: cloudConfig?.emisorRuc || cloudConfig?.imprentaRuc || '0702065319001',
        autorizacion: cloudConfig?.imprentaAutorizacion || '8634',
        email: 'imprentacordova@gmail.com',
    };

    const handleDownloadPdf = () => {
        const element = document.getElementById('documento-maestro-sri');
        if (!element || !trabajo) return;

        /*
         * El PDF tiene que salir del TAMAÑO DEL MODELO, no en A4 fijo.
         *
         * Antes estaba hardcodeado `format: 'a4'`: una hoja de 160×220 mm (medio oficio) salía
         * dentro de una página A4, con margen en blanco alrededor y a una escala que NO sirve
         * para pasarla sobre el preimpreso — el registro se va al diablo. Y en la variante
         * "solo datos" el PDF es justamente lo que se usa para tirar sobre el formulario.
         */
        const { anchoMm, altoMm, orientacion } = descriptorModelo.papel;
        const opt = {
            margin: 0,
            filename: `Solicitud-SRI-${trabajo.orden || trabajo.id}-${cliente?.ruc || cliente?.cedula}.pdf`,
            image: { type: 'jpeg' as const, quality: 1 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
            jsPDF: {
                unit: 'mm',
                // Array explícito [ancho, alto]: jsPDF respeta las medidas reales del papel.
                format: [anchoMm, altoMm] as [number, number],
                orientation: orientacion === 'horizontal' ? ('landscape' as const) : ('portrait' as const),
            }
        };
        html2pdf().from(element).set(opt).save();
    };

    const handleShareWhatsApp = () => {
        if (!cliente || !trabajo) return;
        const phone = (cliente.telefono?.[0] || '').replace(/\D/g, '');
        const trackingUrl = `https://www.imprentacordova.net/tracking?orden=${trabajo.orden || trabajo.id}`;
        const msg = `*IMPRENTA CÓRDOVA · SOLICITUD DE IMPRESIÓN SRI*\n\n` +
            `Estimado/a *${cliente.nombre}*,\n` +
            `Hemos registrado su Solicitud de Autorización de Impresión del SRI:\n` +
            `📄 *Documento:* ${trabajo.tipo || 'Comprobante SRI'}\n` +
            `🔢 *Orden N°:* ${String(trabajo.orden || trabajo.id).padStart(6, '0')}\n` +
            `💵 *Total:* $${Number(trabajo.total || 0).toFixed(2)} | *Abono:* $${Number(trabajo.abono || 0).toFixed(2)} | *Saldo:* $${Number(trabajo.saldo || 0).toFixed(2)}\n\n` +
            `🔍 *Rastree el estado de su orden en vivo aquí:*\n${trackingUrl}\n\n` +
            `📍 Colón e/. Sucre y Av. Rocafuerte · Machala, El Oro`;

        if (phone) {
            window.open(`https://wa.me/593${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            navigator.clipboard.writeText(msg);
            setCopiedWhatsApp(true);
            setTimeout(() => setCopiedWhatsApp(false), 2500);
        }
    };

    if (dataLoading || isRetrying) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A1140]">
            <div className="flex flex-col items-center gap-4">
                <Loader2Icon className="w-10 h-10 text-[#FFC61A] animate-spin" />
                <span className="text-[#FFC61A] font-mono text-xs uppercase tracking-widest animate-pulse font-bold">Cargando Solicitud SRI Oficial...</span>
            </div>
        </div>
    );

    if (error || !trabajo || !cliente) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FF] p-6 text-center">
            <div className="p-8 rounded-3xl bg-red-50 border border-red-200 mb-8 max-w-md">
                <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="font-bold text-sm uppercase tracking-widest text-[#0A1140] mb-2">SOLICITUD NO ENCONTRADA</h2>
                <p className="text-slate-600 text-xs leading-relaxed">
                    {error || "El registro no está disponible en la base de datos."}
                </p>
            </div>
            <button 
                onClick={() => navigate('/nuevo-pedido')}
                className="px-8 py-3 bg-[#16309B] rounded-xl text-xs font-black text-white uppercase tracking-widest hover:bg-[#0F2280] transition-all shadow-md"
            >
                Volver a Nueva Orden
            </button>
        </div>
    );

    const fechaHoy = new Date(trabajo.fechaEntrada || Date.now());
    const dia = fechaHoy.getDate().toString().padStart(2, '0');
    const mes = (fechaHoy.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaHoy.getFullYear().toString().slice(-2);
    const hora = fechaHoy.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

    const fechaEntrega = trabajo.fechaEntrega ? new Date(trabajo.fechaEntrega) : new Date(Date.now() + 86400000);
    const horaEntrega = fechaEntrega.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

    const rawSubtipo = trabajo.subtipo || '';
    const docSize = trabajo.tamano || '1/4 Oficio';
    const isQuimico = !rawSubtipo.toLowerCase().includes('bond');

    const totalVal = parseFloat(String(trabajo.total || 0)) || 13.00;
    const abonoVal = parseFloat(String(trabajo.abono || 0)) || 0.00;
    const saldoVal = Math.max(0, totalVal - abonoVal);

    const docName = trabajo.tipo || 'Nota de Venta';
    const docQty = trabajo.cantidad ? (trabajo.cantidad > 10 ? trabajo.cantidad : (trabajo.cantidad * 100)) : 100;

    const rucRaw = (cliente.ruc || cliente.cedula || '0700000000001').padStart(13, '0');
    const rucArray = rucRaw.split('').slice(0, 13);
    while (rucArray.length < 13) rucArray.push('');

    const renderTicketA5 = (variant: 'cliente' | 'imprenta') => {
        const isOperator = variant === 'imprenta';
        
        return (
            <div data-modelo={modelo} className="w-full h-full bg-white text-[#0A1140] font-sans p-3 box-border flex flex-col justify-between select-none relative" style={{ height: '143mm' }}>
                
                {/* CABECERA OFICIAL AZUL MARINO */}
                <div className="border border-[#0A1140] rounded-t-md overflow-hidden">
                    <div className="bg-[#0A1140] text-white px-3 py-1.5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-[#FFC61A] text-[#0A1140] font-black text-xs flex items-center justify-center border border-[#0A1140] shadow-sm">
                                IC
                            </div>
                            <div>
                                <h1 className="text-sm font-black tracking-wider uppercase leading-none m-0 font-['Outfit']">IMPRENTA CORDOVA</h1>
                            </div>
                        </div>
                        <div className="text-right text-[7px] leading-tight text-slate-200">
                            <div>Direc.: {config.direccion} &nbsp; 📞 {config.telefono}</div>
                            <div>RUC: <span className="font-mono font-bold text-[#FFC61A]">{config.ruc}</span> • AUT. SRI: <span className="font-mono font-bold">{config.autorizacion}</span></div>
                        </div>
                    </div>

                    {/* TÍTULO SOLICITUD */}
                    <div className="bg-white px-3 py-1 flex justify-between items-center border-t border-[#0A1140]">
                        <div className="text-[10.5px] font-black uppercase tracking-wider text-[#0A1140] flex items-center gap-2">
                            SOLICITUD DE AUTORIZACIÓN DE IMPRESIÓN <span className="bg-[#16309B] text-white px-1.5 py-0.2 rounded font-black text-[9px]">SRI</span>
                            <span className="bg-[#FFC61A] text-[#0A1140] px-1.5 py-0.2 rounded font-black text-[8px] uppercase">{descriptorModelo.label}</span>
                            {isOperator && <span className="text-[8px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold ml-2">COPIA IMPRENTA / TALLER</span>}
                        </div>
                        <div className="text-[9px] font-black text-[#0A1140]">
                            ORDEN N°: <span className="font-mono font-bold text-[#16309B]">{String(trabajo.orden || trabajo.id).padStart(8, '0')}</span>
                        </div>
                    </div>
                </div>

                {/* FORMULARIO DATOS DEL CLIENTE */}
                <div className="border-x border-b border-[#0A1140] p-2 text-[8px] flex flex-col gap-1">
                    <div className="flex items-baseline gap-1">
                        <span className="font-bold whitespace-nowrap">Apellidos y Nombres:</span>
                        <span className="flex-1 border-b border-dotted border-slate-400 font-bold uppercase text-[8.5px] truncate pl-1">{cliente.nombre}</span>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="font-bold whitespace-nowrap">Razón Social:</span>
                        <span className="flex-1 border-b border-dotted border-slate-400 font-semibold uppercase truncate pl-1">{cliente.nombreComercial || cliente.nombre}</span>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="font-bold whitespace-nowrap">Actividad Ec.:</span>
                        <span className="flex-1 border-b border-dotted border-slate-400 font-semibold uppercase truncate pl-1">{trabajo.actividadSeleccionada || cliente.actividades || 'Comercio / Servicios General'}</span>
                    </div>

                    {/* RUC 13 CASILLAS Y CLAVE */}
                    <div className="flex items-center gap-3 pt-0.5">
                        <div className="flex items-center gap-1">
                            <span className="font-bold">RUC:</span>
                            <div className="flex gap-[1px]">
                                {rucArray.map((digit, idx) => (
                                    <span key={idx} className="w-3 h-3.5 border border-[#0A1140] bg-slate-50 flex items-center justify-center font-mono font-bold text-[8px] leading-none">
                                        {digit}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 flex-1">
                            <span className="font-bold">Clave / Estab.:</span>
                            <span className="flex-1 border-b border-dotted border-slate-400 font-mono font-bold text-center">{trabajo.establecimiento || '001'}</span>
                        </div>
                    </div>

                    {/* FECHA, HORAS Y DÍAS */}
                    <div className="flex items-center justify-between text-[7.5px] pt-0.5">
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Hora:</span>
                            <span className="border-b border-dotted border-slate-400 font-mono px-1">{hora}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Fecha:</span>
                            <span className="font-mono font-bold bg-slate-100 border border-[#0A1140] px-1.5 py-0.5 rounded-[2px]">{dia} | {mes} | {anio}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Entrega:</span>
                            <span className="border-b border-dotted border-slate-400 font-mono px-1 font-bold text-[#16309B]">{horaEntrega}</span>
                        </div>
                    </div>

                    {/* TELÉFONO Y CORREO */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Telef:</span>
                            {/* Marcado del trámite, declarado por el operador al tomar el pedido.
                                Antes estaba hardcodeado: ver services/printModels.ts → marcadoTramite(). */}
                            <span className="text-[7px] text-slate-600">{marcadoTramite(trabajo.tramiteSri)}</span>
                            <span className="border-b border-dotted border-slate-400 font-mono font-bold px-1">{cliente.telefono?.[0] || 'Dictado'}</span>
                        </div>
                        <div className="flex items-baseline gap-1 flex-1">
                            <span className="font-bold">Email:</span>
                            <span className="flex-1 border-b border-dotted border-slate-400 text-slate-600 truncate pl-1">{cliente.email || 'imprentacordova@gmail.com'}</span>
                        </div>
                    </div>
                </div>

                {/* TABLA DE COMPROBANTES DETALLADOS */}
                <div className="border border-[#0A1140] rounded-md overflow-hidden mt-1">
                    <div className="bg-[#0A1140] text-white text-center font-black text-[7.5px] py-0.5 tracking-wider uppercase">
                        SOLICITO LA ELABORACIÓN DE LOS DOCUMENTOS DETALLADOS A CONTINUACIÓN:
                    </div>
                    <table className="w-full text-center text-[7.5px] border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-[#0A1140] border-b border-[#0A1140] font-bold">
                                <th className="py-0.5 px-1 border-r border-[#0A1140] w-[14%]">TAMAÑO</th>
                                <th className="py-0.5 px-2 border-r border-[#0A1140] text-left w-[36%]">TIPO DE DOCUMENTO</th>
                                <th className="py-0.5 px-1 border-r border-[#0A1140] w-[16%]">PAPEL<br/><span className="text-[6px]">(Químico | Bond)</span></th>
                                <th className="py-0.5 px-1 border-r border-[#0A1140] w-[9%]">ESTABLEC.</th>
                                <th className="py-0.5 px-1 border-r border-[#0A1140] w-[9%]">PTO. EMISIÓN</th>
                                <th className="py-0.5 px-1 border-r border-[#0A1140] w-[8%]">CANTIDAD</th>
                                <th className="py-0.5 px-1 w-[8%]">PRECIO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {/* NOTA DE VENTA */}
                            <tr className={docName.toLowerCase().includes('nota') ? 'font-bold bg-amber-50/40' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('nota') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left font-bold">Nota de Venta</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">
                                    {docName.toLowerCase().includes('nota') ? (isQuimico ? '( [✓] [ ] )' : '( [ ] [✓] )') : '( [ ] [ ] )'}
                                </td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('nota') ? (trabajo.establecimiento || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('nota') ? (trabajo.puntoEmision || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono font-bold">{docName.toLowerCase().includes('nota') ? docQty : ''}</td>
                                <td className="py-0.5 font-mono font-bold">{docName.toLowerCase().includes('nota') ? `$${totalVal.toFixed(2)}` : ''}</td>
                            </tr>

                            {/* FACTURA */}
                            <tr className={docName.toLowerCase().includes('factura') ? 'font-bold bg-amber-50/40' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('factura') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left font-bold">Factura Autorizada</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">
                                    {docName.toLowerCase().includes('factura') ? (isQuimico ? '( [✓] [ ] )' : '( [ ] [✓] )') : '( [ ] [ ] )'}
                                </td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('factura') ? (trabajo.establecimiento || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('factura') ? (trabajo.puntoEmision || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono font-bold">{docName.toLowerCase().includes('factura') ? docQty : ''}</td>
                                <td className="py-0.5 font-mono font-bold">{docName.toLowerCase().includes('factura') ? `$${totalVal.toFixed(2)}` : ''}</td>
                            </tr>

                            {/* GUÍA DE REMISIÓN */}
                            <tr className={docName.toLowerCase().includes('guía') ? 'font-bold bg-amber-50/40' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('guía') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left font-bold">Guía de Remisión</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">
                                    {docName.toLowerCase().includes('guía') ? (isQuimico ? '( [✓] [ ] )' : '( [ ] [✓] )') : '( [ ] [ ] )'}
                                </td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('guía') ? (trabajo.establecimiento || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('guía') ? (trabajo.puntoEmision || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono font-bold">{docName.toLowerCase().includes('guía') ? docQty : ''}</td>
                                <td className="py-0.5 font-mono font-bold">{docName.toLowerCase().includes('guía') ? `$${totalVal.toFixed(2)}` : ''}</td>
                            </tr>

                            {/* LIQUIDACIÓN DE COMPRAS */}
                            <tr className={docName.toLowerCase().includes('liquid') ? 'font-bold bg-amber-50/40' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('liquid') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left text-[6.5px]">Liquidación de Compras</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">( [ ] [ ] )</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 font-mono"></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div className="p-1 text-[7px] flex items-baseline gap-1 border-t border-slate-300 bg-slate-50">
                        <span className="font-bold">Detalles / Numeración:</span>
                        <span className="border-b border-dotted border-slate-400 flex-1 truncate font-mono">{trabajo.numeracion || trabajo.detalle || '0000001 - 0000100'}</span>
                    </div>
                </div>

                {/* AVISO IMPORTANTE */}
                <div className="bg-[#0A1140] text-white text-center rounded py-1 px-2 mt-1">
                    <div className="font-black text-[7.5px] uppercase tracking-wider text-[#FFC61A]">
                        NOTA IMPORTANTE: SIN ESTE COMPROBANTE NO SE ENTREGA EL TRABAJO
                    </div>
                    <div className="text-[6px] text-slate-300 font-medium leading-tight mt-0.5">
                        PASADO EL MES DE NO HABER RETIRADO SUS COMPROBANTES FÍSICOS NO NOS HACEMOS RESPONSABLES DE SU ABONO.
                    </div>
                </div>

                {/* DECLARACIÓN LEGAL, QR Y FIRMA */}
                <div className="grid grid-cols-12 gap-2 text-[7px] text-slate-700 mt-1 items-center">
                    <div className="col-span-6 leading-tight">
                        <p className="font-medium">Declaro que los datos proporcionados en esta solicitud son exactos y verdaderos, asumiendo total responsabilidad sobre su presentación.</p>
                    </div>
                    <div className="col-span-2 flex flex-col items-center justify-center">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://www.imprentacordova.net/tracking?orden=${trabajo.orden || trabajo.id}`)}`} 
                            alt="QR Tracking" 
                            className="w-10 h-10 border border-slate-300 rounded p-[1px] bg-white shadow-xs"
                        />
                        <span className="text-[5.5px] font-black text-[#0A1140] mt-0.5 uppercase tracking-tighter">Rastrear en Línea</span>
                    </div>
                    <div className="col-span-4 text-center">
                        <div className="border-b border-dotted border-slate-500 w-full mb-1"></div>
                        <div className="font-black text-[7.5px] text-[#0A1140] uppercase">Firma del Solicitante</div>
                        <div className="text-[6.5px] text-slate-600 truncate font-bold">{cliente.nombre}</div>
                        <div className="text-[6.5px] text-slate-500 font-mono">C.I./RUC: {cliente.ruc || cliente.cedula}</div>
                    </div>
                </div>

                {/* BARRA FINANCIERA INFERIOR AZUL */}
                <div className="bg-[#0A1140] text-white rounded-md p-1 flex justify-between items-center gap-2 mt-1">
                    <div className="flex-1 bg-white text-[#0A1140] rounded px-2 py-0.5 flex justify-between items-center font-bold text-[8.5px]">
                        <span>Total $</span>
                        <span className="font-mono text-[9.5px]">{totalVal.toFixed(2)}</span>
                    </div>
                    <div className="flex-1 bg-white text-[#0A1140] rounded px-2 py-0.5 flex justify-between items-center font-bold text-[8.5px]">
                        <span>Abono $</span>
                        <span className="font-mono text-[9.5px] text-emerald-700 font-black">{abonoVal.toFixed(2)}</span>
                    </div>
                    <div className="flex-1 bg-[#EEF1FC] text-[#16309B] border border-white/40 rounded px-2 py-0.5 flex justify-between items-center font-black text-[8.5px]">
                        <span>Saldo $</span>
                        <span className="font-mono text-[10.5px] text-[#16309B]">{saldoVal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    };

    /* ────────────────────────────────────────────────────────────────────────
     * Datos del formulario de medio oficio (160 × 220 mm)
     *
     * Todo pasa por `texto()` / `numero()`: en un documento que va al SRI no puede
     * salir impreso un `undefined` ni un `NaN`.
     * ──────────────────────────────────────────────────────────────────────── */
    const nombreSolicitante = texto(cliente.nombre, texto(trabajo.titular, '')).toUpperCase();
    const razonSocialSolicitante = texto(
        cliente.nombreComercial,
        texto(cliente.nombre, texto(trabajo.titular, '')),
    ).toUpperCase();
    const actividadSolicitante = texto(
        trabajo.actividadSeleccionada,
        texto(cliente.actividades, 'COMERCIO / SERVICIOS'),
    ).toUpperCase();
    const telefonoSolicitante = texto(cliente.telefono?.[0]);
    const correoSolicitante = texto(cliente.email);
    const claveSolicitante = texto(trabajo.establecimiento, '001');
    const establecimientoSolicitante = texto(trabajo.establecimiento, '001');
    const puntoEmisionSolicitante = texto(trabajo.puntoEmision, '001');
    const tamanoSolicitante = texto(trabajo.tamano, '1/4 Oficio').toUpperCase();
    const totalMedioOficio = numero(trabajo.total, 0);
    const abonoMedioOficio = numero(trabajo.abono, 0);
    const saldoMedioOficio = Math.max(0, numero(trabajo.saldo, totalMedioOficio - abonoMedioOficio));

    /**
     * RUC en la tira de 13 casillas. Sólo se llenan las 10 primeras: el preimpreso ya
     * trae "0 0 1" impreso en las 3 últimas.
     *
     * Si el cliente no tiene RUC ni cédula se dejan las 10 casillas EN BLANCO. La copia
     * A5 usa un RUC de relleno (`0700000000001`), pero acá ese número no es un dato: es
     * un número falso impreso sobre un formulario que se firma y se presenta al SRI.
     */
    const rucDigitosMedioOficio: string[] = (() => {
        const limpio = (cliente.ruc || cliente.cedula || '').replace(/\D/g, '');
        return limpio ? limpio.padStart(13, '0').slice(0, 13).split('') : [];
    })();

    /** Fila de la tabla que le toca a este documento (-1 = no se imprime nada). */
    const filaDocumentoTabla = filaDocumento(docName);
    const centroFilaTabla = (i: number) =>
        (GEO_SRI160.tabla.y[i + 1] + GEO_SRI160.tabla.y[i + 2]) / 2;
    /**
     * Celda de la tabla: la caja arranca en el borde izquierdo de la columna y mide el
     * ancho de la columna, y el valor se centra adentro. Pasar el CENTRO como borde
     * izquierdo corre el valor media columna a la derecha (y lo saca de la hoja).
     */
    const celdaTabla = (i: number) => ({
        x: GEO_SRI160.tabla.x[i],
        ancho: GEO_SRI160.tabla.x[i + 1] - GEO_SRI160.tabla.x[i],
    });

    /**
     * CAPA DE DATOS — lo único que se imprime sobre el preimpreso.
     *
     * Cada valor cae en su casilla o sobre su línea. Va sin fondo, sin borde y sin
     * etiqueta: el preimpreso ya trae las etiquetas, los marcos y las líneas, y
     * redibujarlos duplicaría el arte sobre el papel.
     *
     * La usan las DOS variantes de medio oficio: en `sri-arte-completo` el arte se
     * dibuja debajo con estas mismas coordenadas, así que los datos caen exactos.
     */
    const renderCapaDatosMedioOficio = () => {
        const C = GEO_SRI160.cuerpo;
        const P = GEO_SRI160.pie;
        const centroRuc = (C.y.rucArriba + C.y.rucAbajo) / 2;
        const centroFecha = (C.y.fechaArriba + C.y.fechaAbajo) / 2;

        return (
            <>
                {/* Apellidos y Nombres · Razón Social · Actividad Ec. */}
                <Valor x={C.x.apellidos} y={C.y.apellidos}>{nombreSolicitante}</Valor>
                <Valor x={C.x.razonSocial} y={C.y.razonSocial}>{razonSocialSolicitante}</Valor>
                <Valor x={C.x.actividad} y={C.y.actividad}>{actividadSolicitante}</Valor>

                {/* RUC: un dígito por casilla, centrado en cada una */}
                {rucDigitosMedioOficio
                    .slice(0, C.x.rucCasillas - C.x.rucPreimpresas)
                    .map((digito, i) => (
                        <Valor
                            key={`ruc-${i}`}
                            x={C.x.rucIzq + C.x.rucAncho * i}
                            ancho={C.x.rucAncho}
                            y={centroRuc}
                            anclaje="centro"
                            alineacion="center"
                            tamanoMm={2.5}
                            mono
                        >
                            {digito}
                        </Valor>
                    ))}

                {/* Clave del establecimiento, sobre su línea */}
                <Valor x={C.x.clave} y={C.y.clave}>{claveSolicitante}</Valor>

                {/* Hora, sobre su línea punteada corta */}
                <Valor
                    x={C.x.hora}
                    ancho={C.x.horaFin - C.x.hora}
                    y={C.y.hora}
                    alineacion="center"
                    tamanoMm={2.4}
                    mono
                >
                    {hora}
                </Valor>

                {/* Fecha en sus 3 casillas: DÍA | MES | AÑO */}
                {[dia, mes, anio].map((parte, i) => (
                    <Valor
                        key={`fecha-${i}`}
                        x={C.x.fecha[i]}
                        ancho={C.x.fecha[i + 1] - C.x.fecha[i]}
                        y={centroFecha}
                        anclaje="centro"
                        alineacion="center"
                        tamanoMm={2.6}
                        mono
                    >
                        {texto(parte, '--')}
                    </Valor>
                ))}

                {/* Teléfono y correo */}
                <Valor x={C.x.telef} y={C.y.telef}>{telefonoSolicitante}</Valor>
                <Valor x={C.x.correo} y={C.y.correo}>{correoSolicitante}</Valor>

                {/*
                 * Til del trámite SRI (Aument. / Cambiar. / Mismo.).
                 *
                 * El preimpreso ya trae impresas las tres etiquetas y sus casillas, así que
                 * acá sólo se pone la marca en la elegida; en la variante de arte completo
                 * las casillas vacías las dibuja `renderArteFormularioMedioOficio` y este
                 * mismo til cae encima. Sin esto el operador elegía el trámite en Nuevo
                 * Pedido y el dato se guardaba, pero el papel salía sin marcar.
                 *
                 * La casilla del arte va de (y.telef − 1.3) a y.telef, de ahí el −0.65
                 * para centrar la marca. `resolverTramite` nunca devuelve vacío: cae a
                 * 'MISMO', que es lo que el sistema imprimía antes del cambio.
                 */}
                {(() => {
                    const casilla = C.marcado[resolverTramite(trabajo?.tramiteSri)];
                    return (
                        <Valor
                            x={casilla.x}
                            ancho={casilla.ancho}
                            y={C.y.telef - 0.65}
                            anclaje="centro"
                            alineacion="center"
                            tamanoMm={2.1}
                            mono
                        >
                            ✓
                        </Valor>
                    );
                })()}

                {/* Tabla: sólo las columnas de llenado, en la fila que corresponde */}
                {filaDocumentoTabla >= 0 && (
                    <>
                        <Valor
                            {...celdaTabla(0)}
                            y={centroFilaTabla(filaDocumentoTabla)}
                            anclaje="centro"
                            alineacion="center"
                            tamanoMm={1.9}
                        >
                            {tamanoSolicitante}
                        </Valor>
                        <Valor
                            {...celdaTabla(3)}
                            y={centroFilaTabla(filaDocumentoTabla)}
                            anclaje="centro"
                            alineacion="center"
                            tamanoMm={2.2}
                            mono
                        >
                            {establecimientoSolicitante}
                        </Valor>
                        <Valor
                            {...celdaTabla(4)}
                            y={centroFilaTabla(filaDocumentoTabla)}
                            anclaje="centro"
                            alineacion="center"
                            tamanoMm={2.2}
                            mono
                        >
                            {puntoEmisionSolicitante}
                        </Valor>
                        <Valor
                            {...celdaTabla(5)}
                            y={centroFilaTabla(filaDocumentoTabla)}
                            anclaje="centro"
                            alineacion="center"
                            tamanoMm={2.2}
                            mono
                        >
                            {docQty}
                        </Valor>
                        <Valor
                            {...celdaTabla(6)}
                            y={centroFilaTabla(filaDocumentoTabla)}
                            anclaje="centro"
                            alineacion="center"
                            tamanoMm={2.2}
                            mono
                        >
                            {`$${totalMedioOficio.toFixed(2)}`}
                        </Valor>
                        {/* La 6.ª fila del preimpreso va en blanco: si el documento es una
                            factura hay que escribir su nombre, porque no está impreso. */}
                        {filaDocumentoTabla === 5 && (
                            <Valor
                                {...celdaTabla(1)}
                                y={centroFilaTabla(5)}
                                anclaje="centro"
                                alineacion="center"
                                tamanoMm={2.1}
                            >
                                FACTURA
                            </Valor>
                        )}
                    </>
                )}

                {/* Pie: Valor $ / Abona $ / Saldo $ dentro de sus 3 recuadros blancos */}
                {[totalMedioOficio, abonoMedioOficio, saldoMedioOficio].map((monto, i) => (
                    <Valor
                        key={`pie-${i}`}
                        x={P.cajas[i].x0}
                        ancho={P.cajas[i].x1 - P.cajas[i].x0}
                        y={P.y}
                        anclaje="centro"
                        alineacion="center"
                        tamanoMm={3.2}
                        mono
                    >
                        {monto.toFixed(2)}
                    </Valor>
                ))}
            </>
        );
    };

    /**
     * CAPA DE ARTE — el formulario dibujado completo, para hoja en blanco.
     *
     * Sólo se usa en `sri-arte-completo`. Las casillas y las líneas se dibujan con las
     * MISMAS coordenadas que la capa de datos, así que lo que se imprime cae exacto
     * dentro de lo dibujado.
     */
    const renderArteFormularioMedioOficio = () => {
        const C = GEO_SRI160.cuerpo;
        const T = GEO_SRI160.tabla;
        const A = GEO_SRI160.arte;
        const L = GEO_SRI160.leyendas;

        /** Convierte un y absoluto del papel al % interno de un bloque. */
        const dentro = (y: number, arriba: number, abajo: number) =>
            ((y - arriba) / (abajo - arriba)) * 100;

        /** Etiquetas del cuerpo que llevan línea punteada de llenado. */
        const filasLinea = [
            { etiqueta: 'Apellidos y Nombres:', y: C.y.apellidos, xEtiqueta: C.x.etiqueta, x0: C.x.apellidos, x1: C.x.margenDer },
            { etiqueta: 'Razón Social:', y: C.y.razonSocial, xEtiqueta: C.x.etiqueta, x0: C.x.razonSocial, x1: C.x.margenDer },
            { etiqueta: 'Actividad Ec.:', y: C.y.actividad, xEtiqueta: C.x.etiqueta, x0: C.x.actividad, x1: C.x.margenDer },
            { etiqueta: 'Clave:', y: C.y.clave, xEtiqueta: C.x.claveEtiqueta, x0: C.x.clave, x1: C.x.margenDer },
            { etiqueta: 'Hora:', y: C.y.hora, xEtiqueta: C.x.etiqueta, x0: C.x.hora, x1: C.x.horaFin },
            { etiqueta: 'Hora y Entrega:', y: C.y.hora, xEtiqueta: C.x.entregaEtiqueta, x0: C.x.entrega, x1: C.x.entregaFin },
            { etiqueta: 'Telef.:', y: C.y.telef, xEtiqueta: C.x.etiqueta, x0: C.x.telef, x1: C.x.margenDer },
            { etiqueta: 'Correo Electronico:', y: C.y.correo, xEtiqueta: C.x.etiqueta, x0: C.x.correo, x1: C.x.margenDer },
        ];

        /** Cabeceras navy de las casillas del RUC, la fecha y los días. */
        const anchoTabla = T.x[T.x.length - 1] - T.x[0];
        const altoTabla = T.y[T.y.length - 1] - T.y[0];
        const anchosColumna = Array.from(
            { length: T.x.length - 1 },
            (_, i) => ((T.x[i + 1] - T.x[i]) / anchoTabla) * 100,
        );

        /** Casillas con cabecera navy encima (DÍA/MES/AÑO y L M M J V S). */
        const grupoCasillas = (
            cortes: readonly number[],
            cabeceras: readonly string[],
            arriba: number,
            abajo: number,
            llave: string,
        ) => {
            const altoCabecera = (abajo - arriba) * 0.42;
            return (
                <>
                    {cabeceras.map((titulo, i) => (
                        <div
                            key={`${llave}-cab-${i}`}
                            style={{
                                position: 'absolute',
                                left: `${cortes[i]}%`,
                                top: `${arriba}%`,
                                width: `${cortes[i + 1] - cortes[i]}%`,
                                height: `${altoCabecera}%`,
                                backgroundColor: '#0A1A46',
                                color: '#FFFFFF',
                                fontSize: '1.7mm',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {titulo}
                        </div>
                    ))}
                    {cabeceras.map((_, i) => (
                        <div
                            key={`${llave}-caja-${i}`}
                            style={{
                                position: 'absolute',
                                left: `${cortes[i]}%`,
                                top: `${arriba + altoCabecera + (abajo - arriba) * 0.08}%`,
                                width: `${cortes[i + 1] - cortes[i]}%`,
                                height: `${(abajo - arriba) * 0.5}%`,
                                border: '0.25mm solid #0A1A46',
                            }}
                        />
                    ))}
                </>
            );
        };

        return (
            <>
                {/* 1. Cabecera navy con el logotipo */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: `${A.cabeceraAlto}%`,
                        backgroundColor: '#0A1A46',
                        color: '#FFFFFF',
                        borderRadius: '1.2mm',
                        padding: '1.3mm 2.2mm',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                        <div
                            style={{
                                width: '9mm',
                                height: '7.5mm',
                                border: '0.35mm solid #FFFFFF',
                                borderRadius: '1mm',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '4.4mm',
                                fontWeight: 900,
                                letterSpacing: '0.02em',
                            }}
                        >
                            IC
                        </div>
                        <div style={{ fontSize: '5.2mm', fontWeight: 900, letterSpacing: '0.03em' }}>
                            IMPRENTA CORDOVA
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '2.1mm' }}>
                        <span>Direc.: {config.direccion}</span>
                        <span>Tel.: {config.telefono}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '2.1mm' }}>
                        <span>
                            RUC: {config.ruc} • CODIGO AUT SRI: {config.autorizacion}
                        </span>
                        <span>Email: {config.email}</span>
                    </div>
                </div>

                {/* 2. Faja punteada con el título */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: `${A.cabeceraAlto}%`,
                        width: '100%',
                        height: `${A.fajaTituloAlto}%`,
                        backgroundColor: '#0A1A46',
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.45) 0.3mm, transparent 0.3mm)',
                        backgroundSize: '1.1mm 1.1mm',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3.2mm',
                        fontWeight: 900,
                        letterSpacing: '0.05em',
                        textAlign: 'center',
                    }}
                >
                    {L.titulo}
                </div>

                {/* 3. Cuerpo: etiquetas del solicitante con su línea punteada */}
                {filasLinea.map(fila => (
                    <React.Fragment key={fila.etiqueta}>
                        <LineaLlenado x0={fila.x0} x1={fila.x1} y={fila.y} />
                        <EtiquetaFormulario x={fila.xEtiqueta} y={fila.y} tamanoMm={2.3}>
                            {fila.etiqueta}
                        </EtiquetaFormulario>
                    </React.Fragment>
                ))}

                {/* Etiqueta del RUC + sus 13 casillas (las 3 últimas con "0 0 1" impreso) */}
                <EtiquetaFormulario x={C.x.etiqueta} y={C.y.rucAbajo} tamanoMm={2.4}>
                    RUC:
                </EtiquetaFormulario>
                {Array.from({ length: C.x.rucCasillas }, (_, i) => {
                    const preimpreso = ['0', '0', '1'];
                    const indicePreimpreso = i - (C.x.rucCasillas - C.x.rucPreimpresas);
                    return (
                        <div
                            key={`ruc-caja-${i}`}
                            style={{
                                position: 'absolute',
                                left: `${C.x.rucIzq + C.x.rucAncho * i}%`,
                                top: `${C.y.rucArriba}%`,
                                width: `${C.x.rucAncho}%`,
                                height: `${C.y.rucAbajo - C.y.rucArriba}%`,
                                border: '0.25mm solid #0A1A46',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.4mm',
                                fontWeight: 700,
                            }}
                        >
                            {indicePreimpreso >= 0 ? preimpreso[indicePreimpreso] : ''}
                        </div>
                    );
                })}

                {/* Etiqueta de la fecha + casillas DÍA | MES | AÑO y los días de la semana */}
                <EtiquetaFormulario x={C.x.fechaEtiqueta} y={C.y.fechaAbajo} tamanoMm={2.4}>
                    Fecha:
                </EtiquetaFormulario>
                {grupoCasillas(C.x.fecha, ['DÍA', 'MES', 'AÑO'], C.y.fechaCabeceraArriba, C.y.fechaAbajo, 'fecha')}
                {grupoCasillas(C.x.lmmjvsFecha, ['L', 'M', 'M', 'J', 'V', 'S'], C.y.fechaCabeceraArriba, C.y.fechaAbajo, 'dias1')}
                {grupoCasillas(C.x.lmmjvsEntrega, ['L', 'M', 'M', 'J', 'V', 'S'], C.y.fechaCabeceraArriba, C.y.fechaAbajo, 'dias2')}

                {/* Casillas de marcado de la fila del teléfono */}
                {TRAMITES_SRI.map(tramite => {
                    const casilla = C.marcado[tramite.id];
                    return (
                        <React.Fragment key={tramite.id}>
                            <EtiquetaFormulario x={casilla.xEtiqueta} y={C.y.telef} tamanoMm={1.9}>
                                {tramite.label}
                            </EtiquetaFormulario>
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${casilla.x}%`,
                                    top: `${C.y.telef - 1.3}%`,
                                    width: `${casilla.ancho}%`,
                                    height: '1.3%',
                                    border: '0.25mm solid #0A1A46',
                                    borderRadius: '0.4mm',
                                }}
                            />
                        </React.Fragment>
                    );
                })}

                {/* 4. Banda "SOLICITO LA ELABORACIÓN…" */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: `${A.solicitoArriba}%`,
                        width: '100%',
                        height: `${A.solicitoAlto}%`,
                        backgroundColor: '#0A1A46',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.4mm',
                        fontWeight: 900,
                        letterSpacing: '0.03em',
                        textAlign: 'center',
                    }}
                >
                    {L.solicito}
                </div>

                {/* 5. Tabla de documentos: 7 columnas, cabecera + 6 filas */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${T.x[0]}%`,
                        top: `${T.y[0]}%`,
                        width: `${anchoTabla}%`,
                        height: `${altoTabla}%`,
                        border: '0.3mm solid #0A1A46',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: `${((T.y[1] - T.y[0]) / altoTabla) * 100}%`,
                            display: 'flex',
                            backgroundColor: '#EEF1FC',
                        }}
                    >
                        {T.cabecera.map((titulo, i) => (
                            <div
                                key={`cab-tabla-${titulo}`}
                                style={{
                                    width: `${anchosColumna[i]}%`,
                                    borderRight: i < T.cabecera.length - 1 ? '0.25mm solid #0A1A46' : undefined,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.9mm',
                                    fontWeight: 800,
                                    lineHeight: 1.05,
                                    textAlign: 'center',
                                }}
                            >
                                <span>{titulo}</span>
                                {i === T.papel && (
                                    <span style={{ fontSize: '1.5mm', fontWeight: 700 }}>Químico Bond</span>
                                )}
                            </div>
                        ))}
                    </div>

                    {T.filas.map((fila, f) => (
                        <div
                            key={`fila-tabla-${f}`}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: `${((T.y[f + 1] - T.y[0]) / altoTabla) * 100}%`,
                                width: '100%',
                                height: `${((T.y[f + 2] - T.y[f + 1]) / altoTabla) * 100}%`,
                                display: 'flex',
                                borderTop: '0.25mm solid #0A1A46',
                            }}
                        >
                            {T.cabecera.map((_, c) => (
                                <div
                                    key={`celda-${f}-${c}`}
                                    style={{
                                        width: `${anchosColumna[c]}%`,
                                        borderRight: c < T.cabecera.length - 1 ? '0.25mm solid #0A1A46' : undefined,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.8mm',
                                    }}
                                >
                                    {c === 1 && fila && (
                                        <span
                                            style={{
                                                fontFamily: FUENTE_ETIQUETA,
                                                fontStyle: 'italic',
                                                fontWeight: 700,
                                                fontSize: '1.9mm',
                                                lineHeight: 1,
                                                textAlign: 'center',
                                            }}
                                        >
                                            {fila}
                                        </span>
                                    )}
                                    {c === T.papel && (
                                        <>
                                            <span
                                                style={{
                                                    width: '1.5mm',
                                                    height: '1.5mm',
                                                    border: '0.25mm solid #0A1A46',
                                                    borderRadius: '0.4mm',
                                                }}
                                            />
                                            <span
                                                style={{
                                                    width: '1.5mm',
                                                    height: '1.5mm',
                                                    border: '0.25mm solid #0A1A46',
                                                    borderRadius: '0.4mm',
                                                }}
                                            />
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* 6. Detalles adicionales */}
                <EtiquetaFormulario x={2.2} y={A.detallesEtiquetaY + 0.4} tamanoMm={2.4}>
                    Detalles adicionales:
                </EtiquetaFormulario>
                <LineaLlenado x0={21.5} x1={C.x.margenDer} y={A.detallesEtiquetaY + 0.4} />
                <LineaLlenado x0={C.x.etiqueta} x1={C.x.margenDer} y={A.detallesLineas[1]} />

                {/* 7. NOTA IMPORTANTE */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: `${A.notaArriba}%`,
                        width: '100%',
                        height: `${A.notaAbajo - A.notaArriba}%`,
                        backgroundColor: '#0A1A46',
                        color: '#FFFFFF',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            left: `${A.notaDivisorX}%`,
                            top: 0,
                            bottom: 0,
                            borderLeft: '0.4mm solid #FFFFFF',
                        }}
                    />
                    <div style={{ position: 'absolute', left: '2.5%', top: '9%', width: `${A.notaDivisorX - 5}%` }}>
                        <div style={{ fontSize: '3.2mm', fontWeight: 900 }}>{L.notaImportante}</div>
                        <div style={{ fontSize: '1.75mm', lineHeight: 1.25, marginTop: '0.8mm', textAlign: 'justify' }}>
                            {L.notaRetiro}
                        </div>
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            left: `${A.notaDivisorX + 2.5}%`,
                            right: '2%',
                            top: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '3.4mm',
                            fontWeight: 900,
                            lineHeight: 1.1,
                        }}
                    >
                        {L.sinRecibo}
                    </div>
                </div>

                {/* 8. Declaración legal + bloque de firma */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: `${A.firmaArriba}%`,
                        width: '100%',
                        height: `${A.firmaAbajo - A.firmaArriba}%`,
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            left: `${A.firmaDivisorX}%`,
                            top: 0,
                            bottom: 0,
                            borderLeft: '0.3mm solid #0A1A46',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: `${A.declaracion.x0}%`,
                            width: `${A.declaracion.x1 - A.declaracion.x0}%`,
                            top: `${dentro(A.declaracion.arriba, A.firmaArriba, A.firmaAbajo)}%`,
                            height: `${dentro(A.declaracion.abajo, A.firmaArriba, A.firmaAbajo) - dentro(A.declaracion.arriba, A.firmaArriba, A.firmaAbajo)}%`,
                            border: '0.25mm solid #0A1A46',
                            padding: '1mm',
                            fontSize: '2mm',
                            lineHeight: 1.3,
                            textAlign: 'justify',
                        }}
                    >
                        {L.declaracion}
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            left: `${A.declaracion.x0}%`,
                            width: '56%',
                            top: `${dentro(A.notaTerceroY, A.firmaArriba, A.firmaAbajo)}%`,
                            fontSize: '1.9mm',
                            lineHeight: 1.25,
                        }}
                    >
                        {L.notaTercero}
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            left: `${A.firmaLineaX0}%`,
                            width: `${A.firmaLineaX1 - A.firmaLineaX0}%`,
                            top: `${dentro(A.firmaLineaY, A.firmaArriba, A.firmaAbajo)}%`,
                            borderBottom: '0.3mm dotted #0A1A46',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: `${A.firmaDivisorX}%`,
                            width: `${100 - A.firmaDivisorX}%`,
                            top: `${dentro(A.firmaTextoY, A.firmaArriba, A.firmaAbajo)}%`,
                            textAlign: 'center',
                            fontSize: '2.2mm',
                            fontWeight: 800,
                        }}
                    >
                        Firma del Solicitante
                    </div>
                    <LineaLlenado x0={A.firmaDivisorX + 1.5} x1={C.x.margenDer} y={A.razonSocialLineaY} />
                    <EtiquetaFormulario x={A.firmaDivisorX + 1.5} y={A.razonSocialLineaY + 1.2} tamanoMm={1.7}>
                        Razón social/Apellidos y nombres:
                    </EtiquetaFormulario>
                    <EtiquetaFormulario x={A.firmaDivisorX + 1.5} y={A.ciLineaY} tamanoMm={1.7}>
                        C.I.:
                    </EtiquetaFormulario>
                    <LineaLlenado x0={A.firmaDivisorX + 5} x1={C.x.margenDer} y={A.ciLineaY} />
                </div>

                {/* 9. Pie navy con Valor $ / Abona $ / Saldo $ y sus 3 recuadros */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: `${GEO_SRI160.pie.bandaArriba}%`,
                        width: '100%',
                        height: `${100 - GEO_SRI160.pie.bandaArriba}%`,
                        backgroundColor: '#0A1A46',
                        color: '#FFFFFF',
                        borderRadius: '1.2mm',
                    }}
                >
                    {GEO_SRI160.pie.cajas.map((caja, i) => (
                        <React.Fragment key={`pie-parte-${i}`}>
                            <div
                                style={{
                                    position: 'absolute',
                                    right: `${100 - caja.x0}%`,
                                    top: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingRight: '1mm',
                                    fontSize: '2.6mm',
                                    fontWeight: 800,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {GEO_SRI160.pie.etiquetas[i]}
                            </div>
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${caja.x0}%`,
                                    width: `${caja.x1 - caja.x0}%`,
                                    top: '22%',
                                    height: '56%',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '0.6mm',
                                }}
                            />
                        </React.Fragment>
                    ))}
                </div>
            </>
        );
    };

    /**
     * VERSIÓN 3: EVOLUCIÓN MODERNA FULL PRO (MEDIO OFICIO 160 × 220 mm)
     * =================================================================
     * Diseño editorial suizo, minimalista, elegante y de alta costura tipográfica.
     * Incluye código QR dinámico de validación digital, badges fiscales oficiales,
     * desglose nítido de comprobantes y bloque de liquidación financiera premium.
     */
    const renderArteModernoMedioOficio = () => {
        const trackingUrl = `https://www.imprentacordova.net/tracking?orden=${trabajo.orden || trabajo.id}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(trackingUrl)}`;
        const tramiteActual = resolverTramite(trabajo?.tramiteSri);
        const tramiteObj = TRAMITES_SRI.find(t => t.id === tramiteActual) || TRAMITES_SRI[2];
        const numOrden = String(trabajo.orden || trabajo.id).padStart(6, '0');
        const numRango = trabajo.secuenciaInicio && trabajo.secuenciaFin 
            ? `${trabajo.secuenciaInicio} AL ${trabajo.secuenciaFin}`
            : (trabajo.numeracion || '0000001 - 0000100');

        return (
            <div className="w-full h-full bg-white text-[#0A1A46] font-sans box-border flex flex-col justify-between p-[4.5mm] select-none relative overflow-hidden" style={{ height: '220mm', width: '160mm' }}>
                {/* LÍNEA DECORATIVA SUPERIOR DORADA & NAVY */}
                <div className="absolute top-0 left-0 right-0 h-[3mm] bg-gradient-to-r from-[#0A1A46] via-[#D4AF37] to-[#0A1A46]" />

                {/* 1. CABECERA ATELIER PROFESIONAL */}
                <div className="flex justify-between items-start pt-[1mm] pb-[2mm] border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                        <div className="w-[10.5mm] h-[10.5mm] rounded-lg bg-[#0A1A46] text-[#D4AF37] border border-[#D4AF37] flex flex-col items-center justify-center shadow-xs">
                            <span className="font-['Outfit'] font-black text-[4.8mm] leading-none">IC</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h1 className="text-[4.2mm] font-black tracking-wider text-[#0A1A46] uppercase leading-none font-['Outfit'] m-0">
                                    IMPRENTA CÓRDOVA
                                </h1>
                                <span className="bg-[#D4AF37]/15 text-[#926c05] border border-[#D4AF37]/40 text-[1.8mm] px-1 py-0.2 rounded font-extrabold uppercase tracking-wide">
                                    TALLER GRÁFICO
                                </span>
                            </div>
                            <div className="text-[2.2mm] text-slate-500 font-medium leading-tight mt-1 flex flex-col gap-0.5">
                                <span>📍 {config.direccion} · Pasaje, El Oro</span>
                                <span>📞 {config.telefono} · ✉ {config.email}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="bg-[#0A1A46] text-white px-2.5 py-1 rounded-md border border-[#D4AF37]/50 shadow-xs flex flex-col items-end">
                            <span className="text-[1.8mm] font-bold text-[#D4AF37] uppercase tracking-wider">ESTABLECIMIENTO AUTORIZADO</span>
                            <span className="text-[2.6mm] font-mono font-black tracking-wide">AUT. SRI: {config.autorizacion}</span>
                            <span className="text-[1.9mm] text-slate-300 font-mono">RUC: {config.ruc}</span>
                        </div>
                        <div className="bg-slate-100 text-[#0A1A46] px-2 py-0.5 rounded text-[2.2mm] font-mono font-bold border border-slate-200">
                            ORDEN #{numOrden}
                        </div>
                    </div>
                </div>

                {/* 2. FAJA TÍTULO & MODALIDAD DE TRÁMITE */}
                <div className="bg-gradient-to-r from-[#0A1A46] via-[#10255c] to-[#0A1A46] text-white px-3 py-1.5 rounded-lg flex justify-between items-center shadow-xs my-[1mm]">
                    <div className="flex items-center gap-2">
                        <span className="bg-[#D4AF37] text-[#0A1A46] w-4 h-4 rounded-full flex items-center justify-center font-black text-[2.5mm]">✓</span>
                        <div>
                            <div className="text-[2.7mm] font-black uppercase tracking-wider font-['Outfit'] text-white">
                                SOLICITUD DE AUTORIZACIÓN DE IMPRESIÓN SRI
                            </div>
                            <div className="text-[1.7mm] text-slate-300">
                                EMISIÓN Y AUTORIZACIÓN OFICIAL DE DOCUMENTOS TRIBUTARIOS
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[1.9mm] text-slate-300 uppercase tracking-wide">TRÁMITE:</span>
                        <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-2 py-0.5 rounded text-[2.1mm] font-black text-[#D4AF37] uppercase tracking-wider">
                            [✓] {tramiteObj.label} ({tramiteObj.id})
                        </div>
                    </div>
                </div>

                {/* 3. FICHA DEL CONTRIBUYENTE (DATOS DEL SOLICITANTE) */}
                <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 shadow-2xs my-[1mm]">
                    <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-slate-200/80">
                        <span className="text-[2.1mm] font-black uppercase text-[#0A1A46] tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16309B]"></span>
                            1. DATOS DEL CONTRIBUYENTE / TITULAR
                        </span>
                        <span className="text-[2mm] text-slate-500 font-mono">
                            Fecha: <strong className="text-[#0A1A46]">{dia}/{mes}/20{anio} ({hora})</strong>
                        </span>
                    </div>

                    <div className="grid grid-cols-12 gap-2 text-[2.3mm]">
                        <div className="col-span-8 flex flex-col">
                            <span className="text-[1.9mm] font-bold text-slate-500 uppercase">Razón Social / Nombres y Apellidos:</span>
                            <span className="font-black text-[#0A1A46] text-[2.8mm] truncate">{nombreSolicitante}</span>
                            {razonSocialSolicitante !== nombreSolicitante && (
                                <span className="text-[2mm] text-slate-600 truncate">({razonSocialSolicitante})</span>
                            )}
                        </div>

                        <div className="col-span-4 flex flex-col items-end">
                            <span className="text-[1.9mm] font-bold text-slate-500 uppercase">Fecha de Entrega:</span>
                            <span className="font-black text-[#16309B] text-[2.7mm] font-mono">{horaEntrega}</span>
                        </div>

                        <div className="col-span-8 flex flex-col mt-0.5">
                            <span className="text-[1.9mm] font-bold text-slate-500 uppercase">Actividad Económica:</span>
                            <span className="font-semibold text-slate-800 text-[2.3mm] truncate">{actividadSolicitante}</span>
                        </div>

                        <div className="col-span-4 flex flex-col items-end mt-0.5">
                            <span className="text-[1.9mm] font-bold text-slate-500 uppercase">Contacto:</span>
                            <span className="font-mono font-bold text-[#0A1A46] text-[2.3mm]">{telefonoSolicitante || 'Dictado'}</span>
                            <span className="text-[1.8mm] text-slate-500 truncate max-w-[45mm]">{correoSolicitante || config.email}</span>
                        </div>

                        {/* RUC CASILLAS MODERNAS */}
                        <div className="col-span-12 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[2.1mm] font-bold text-[#0A1A46]">RUC:</span>
                                <div className="flex gap-[1.2px]">
                                    {rucArray.map((digit, idx) => {
                                        const isLast3 = idx >= 10;
                                        return (
                                            <div 
                                                key={idx} 
                                                className={`w-[4mm] h-[4.8mm] rounded-[2px] flex items-center justify-center font-mono font-black text-[2.6mm] border ${
                                                    isLast3 
                                                        ? 'bg-amber-50 border-amber-300 text-amber-900' 
                                                        : 'bg-white border-slate-300 text-[#0A1A46]'
                                                }`}
                                            >
                                                {digit}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-[2.2mm]">
                                <div>Estab: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 text-[#0A1A46]">{establecimientoSolicitante}</strong></div>
                                <div>Pto. Emisión: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 text-[#0A1A46]">{puntoEmisionSolicitante}</strong></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. TABLA EDITORIAL DE COMPROBANTES SOLICITADOS */}
                <div className="border border-slate-200 rounded-lg overflow-hidden my-[1mm] shadow-2xs">
                    <div className="bg-[#0A1A46] text-white px-3 py-1 flex justify-between items-center">
                        <span className="text-[2.1mm] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"></span>
                            2. ESPECIFICACIONES DE IMPRESIÓN Y COMPROBANTES
                        </span>
                        <span className="text-[1.8mm] text-slate-300 uppercase font-mono">RESOLUCIÓN NAC-DGERCGC</span>
                    </div>

                    <table className="w-full text-center text-[2.2mm] border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-[#0A1A46] border-b border-slate-200 font-black text-[2mm]">
                                <th className="py-1 px-1.5 text-left w-[30%]">DOCUMENTO AUTORIZADO</th>
                                <th className="py-1 px-1 border-x border-slate-200 w-[14%]">FORMATO</th>
                                <th className="py-1 px-1 border-r border-slate-200 w-[20%]">PAPEL / SUSTRATO</th>
                                <th className="py-1 px-1 border-r border-slate-200 w-[8%]">EST.</th>
                                <th className="py-1 px-1 border-r border-slate-200 w-[8%]">PTO.</th>
                                <th className="py-1 px-1 border-r border-slate-200 w-[10%]">CANTIDAD</th>
                                <th className="py-1 px-1 w-[10%]">VALOR</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr className="bg-amber-50/50 font-bold">
                                <td className="py-1.5 px-2 text-left">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        <span className="font-black text-[#0A1A46] text-[2.5mm]">{docName}</span>
                                    </div>
                                    <span className="text-[1.8mm] text-slate-500 font-mono">Secuencia: {numRango}</span>
                                </td>
                                <td className="py-1.5 border-x border-slate-200 font-mono text-[2.2mm] font-bold text-slate-700">
                                    {docSize}
                                </td>
                                <td className="py-1.5 px-1 border-r border-slate-200">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[1.9mm] font-bold ${
                                        isQuimico 
                                            ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    }`}>
                                        {isQuimico ? 'Químico Autocopiante (1x1)' : 'Papel Bond Blanco 75g'}
                                    </span>
                                </td>
                                <td className="py-1.5 border-r border-slate-200 font-mono font-bold">{establecimientoSolicitante}</td>
                                <td className="py-1.5 border-r border-slate-200 font-mono font-bold">{puntoEmisionSolicitante}</td>
                                <td className="py-1.5 border-r border-slate-200 font-mono font-black text-[#0A1A46] text-[2.5mm]">
                                    {docQty} <span className="text-[1.7mm] font-normal text-slate-500">uds</span>
                                </td>
                                <td className="py-1.5 font-mono font-black text-[#0A1A46] text-[2.6mm]">
                                    ${totalVal.toFixed(2)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="bg-slate-50 p-1.5 border-t border-slate-200 flex justify-between items-center text-[1.9mm] text-slate-600">
                        <div>
                            <strong>Acabados de taller:</strong> Impresión Offset/Digital certificada · Engrapado y perforación de desglosable · Tapa envolvente protectora.
                        </div>
                        <div className="font-mono font-bold text-[#0A1A46]">
                            Talonarios: {Math.ceil(docQty / 100)} Block(s) de 100 hojas
                        </div>
                    </div>
                </div>

                {/* 5. PROTOCOLO LEGAL, QR CODE Y FIRMA */}
                <div className="border border-slate-200 rounded-lg p-2.5 bg-white my-[1mm] grid grid-cols-12 gap-3 items-center">
                    {/* QR Dinámico */}
                    <div className="col-span-3 flex flex-col items-center justify-center p-1 border-r border-slate-200">
                        <img 
                            src={qrUrl} 
                            alt="QR Validación" 
                            className="w-[18mm] h-[18mm] border border-slate-300 rounded p-[1px] bg-white shadow-2xs"
                        />
                        <span className="text-[1.7mm] font-black text-[#0A1A46] mt-1 uppercase tracking-tight text-center leading-tight">
                            VALIDACIÓN DIGITAL<br/>
                            <span className="text-slate-500 font-normal">imprentacordova.net</span>
                        </span>
                    </div>

                    {/* Leyenda Legal */}
                    <div className="col-span-5 flex flex-col justify-between text-[2mm] text-slate-600 leading-tight">
                        <div className="font-bold text-[#0A1A46] text-[2.1mm] mb-1">DECLARACIÓN DE CONFORMIDAD:</div>
                        <p className="text-justify mb-1">
                            {GEO_SRI160.leyendas.declaracion}
                        </p>
                        <p className="text-[1.7mm] text-slate-500 italic">
                            {GEO_SRI160.leyendas.notaTercero}
                        </p>
                        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded p-1 mt-1 text-[1.7mm] leading-snug">
                            <strong>Aviso importante:</strong> Para el retiro de sus comprobantes físicos en mostrador, presente este documento o el número de orden asignado.
                        </div>
                    </div>

                    {/* Firma Solicitante */}
                    <div className="col-span-4 flex flex-col items-center justify-center text-center pl-1">
                        <div className="w-full border-b border-slate-400 mb-1.5 h-[10mm] flex items-end justify-center">
                            <span className="text-[1.8mm] text-slate-300 italic select-none">Firma autógrafa / sello</span>
                        </div>
                        <div className="font-black text-[2.2mm] text-[#0A1A46] uppercase">
                            FIRMA DEL SOLICITANTE
                        </div>
                        <div className="text-[1.9mm] text-slate-700 font-semibold truncate max-w-full">
                            {nombreSolicitante}
                        </div>
                        <div className="text-[1.9mm] text-slate-500 font-mono">
                            C.I. / RUC: {cliente.ruc || cliente.cedula}
                        </div>
                    </div>
                </div>

                {/* 6. BARRA FINANCIERA DE LIQUIDACIÓN MODERNA */}
                <div className="bg-[#0A1A46] text-white rounded-lg p-2 flex justify-between items-center gap-2 mt-[1mm] shadow-xs">
                    <div className="flex-1 bg-white text-[#0A1A46] rounded-md px-2.5 py-1 flex justify-between items-center border border-slate-200">
                        <span className="text-[2.1mm] font-bold text-slate-600 uppercase">VALOR TOTAL</span>
                        <span className="font-mono font-black text-[3.2mm]">${totalVal.toFixed(2)}</span>
                    </div>

                    <div className="flex-1 bg-white text-[#0A1A46] rounded-md px-2.5 py-1 flex justify-between items-center border border-slate-200">
                        <span className="text-[2.1mm] font-bold text-slate-600 uppercase">ABONO</span>
                        <span className="font-mono font-black text-[3.2mm] text-emerald-700">${abonoVal.toFixed(2)}</span>
                    </div>

                    <div className="flex-1 bg-gradient-to-r from-[#16309B] to-[#0A1A46] text-[#FFC61A] rounded-md px-2.5 py-1 flex justify-between items-center border border-[#FFC61A]/40 shadow-xs">
                        <span className="text-[2.1mm] font-black uppercase text-white">SALDO PENDIENTE</span>
                        <span className="font-mono font-black text-[3.5mm] text-[#FFC61A]">${saldoVal.toFixed(2)}</span>
                    </div>
                </div>

                {/* PIE DE PÁGINA MICRO */}
                <div className="flex justify-between items-center text-[1.7mm] text-slate-400 pt-1">
                    <span>IMPRENTA CÓRDOVA · AUTORIZACIÓN N° 8634 · RASTREO ONLINE DISPONIBLE</span>
                    <span className="font-mono">VERSIÓN 3.0 ÉLITE INDUSTRIAL</span>
                </div>
            </div>
        );
    };

    return (
        <div className={`bg-[#F7F9FF] min-h-screen py-8 flex flex-col items-center overflow-y-auto font-sans relative ${modelo === 'sri-pc' ? '' : 'solicitud-medio-oficio'}`}>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .guia-fondo-preimpreso { display: none !important; }
                    body { background: white !important; margin: 0 !important; }
                    .page-container { 
                        box-shadow: none !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        width: 210mm !important;
                        height: 297mm !important;
                    }
                    /* Las variantes de medio oficio cambian de hoja (160 × 220 mm). Se
                       eligen por data-modelo, así que la versión PC sigue saliendo en A4
                       exactamente como antes. */
                    .page-container[data-modelo="sri-sobre-preimpreso"],
                    .page-container[data-modelo="sri-arte-completo"],
                    .page-container[data-modelo="sri-moderno"] {
                        width: 160mm !important;
                        height: 220mm !important;
                    }
                    /* En el talonario la hoja arranca en el borde del papel: el aire de
                       la pantalla correría los datos fuera de las casillas del preimpreso. */
                    .solicitud-medio-oficio { padding: 0 !important; }
                }
                .page-container {
                    width: 210mm;
                    height: 297mm;
                    background: white;
                    position: relative;
                    box-sizing: border-box;
                }
                /* Hoja de medio oficio 160 × 220 mm (medio oficio vertical). */
                .hoja-medio-oficio {
                    width: 160mm;
                    height: 220mm;
                    padding: 0;
                    display: block;
                }
                .web-shadow {
                    box-shadow: 0 10px 30px -10px rgba(10,17,64,0.15);
                }
            `}</style>
            {/* El tamaño de la página impresa no se puede condicionar desde CSS: se
                inyecta sólo cuando la variante NO es la versión PC, que va en A4. */}
            {modelo !== 'sri-pc' && <style>{`@page { size: 160mm 220mm; margin: 0; }`}</style>}

            {/* BARRA SUPERIOR DE CONTROL PREMIUM CON SELECTOR DE FORMATOS */}
            <div className={`w-full ${modelo === 'sri-pc' ? 'max-w-[210mm]' : 'max-w-[175mm]'} flex flex-col gap-3 mb-6 no-print px-5 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm relative z-50`}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex gap-3 items-center">
                        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-600 font-bold text-xs hover:text-[#16309B] transition-all">
                            <HomeIcon className="w-4 h-4" /> Dashboard
                        </button>
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 font-bold text-xs hover:text-[#16309B] transition-all">
                            <ArrowLeftIcon className="w-4 h-4" /> Volver
                        </button>
                    </div>
                    
                    <div className="flex gap-2.5 items-center flex-wrap">
                        <button 
                            onClick={handleShareWhatsApp} 
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
                        >
                            <span>{copiedWhatsApp ? '✓' : '📱'}</span>
                            <span>{copiedWhatsApp ? 'Copiado' : 'WhatsApp'}</span>
                        </button>

                        <button 
                            onClick={handleDownloadPdf} 
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" /> PDF 300DPI
                        </button>
                        
                        <button 
                            onClick={() => window.print()} 
                            className="bg-[#16309B] text-white hover:bg-[#0F2280] px-5 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                        >
                            <PrinterIcon className="w-4 h-4"/> Imprimir Solicitud
                        </button>
                    </div>
                </div>

                {/* SELECTOR DE LAS 3 VERSIONES SRI Y VERSIÓN PC */}
                <div className="w-full flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                            Versión SRI:
                        </span>
                        <button
                            type="button"
                            onClick={() => setModelo('sri-sobre-preimpreso')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                modelo === 'sri-sobre-preimpreso'
                                    ? 'bg-[#0A1A46] text-white shadow-sm ring-2 ring-[#0A1A46]/20'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title="Gasta los 10 blocks preimpresos (1000 hojas). Imprime SOLO datos alineados al offset."
                        >
                            <span>📦</span> 1. Sobre Preimpreso (10 Blocks)
                        </button>

                        <button
                            type="button"
                            onClick={() => setModelo('sri-arte-completo')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                modelo === 'sri-arte-completo'
                                    ? 'bg-[#16309B] text-white shadow-sm ring-2 ring-[#16309B]/20'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title="Formato clásico oficial idéntico al block para hoja medio oficio en blanco."
                        >
                            <span>📄</span> 2. Clásico Completo
                        </button>

                        <button
                            type="button"
                            onClick={() => setModelo('sri-moderno')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                                modelo === 'sri-moderno'
                                    ? 'bg-gradient-to-r from-[#0A1A46] via-[#10255c] to-[#0A1A46] text-[#FFC61A] border border-[#FFC61A]/50 shadow-md ring-2 ring-[#FFC61A]/30'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title="Evolución moderna minimalista elegante full pro con código QR y diseño editorial."
                        >
                            <span>✨</span> 3. Evolución Moderna (Full Pro)
                        </button>

                        <button
                            type="button"
                            onClick={() => setModelo('sri-pc')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                                modelo === 'sri-pc'
                                    ? 'bg-slate-800 text-white shadow-sm'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                            }`}
                            title="Versión PC A4 de 2 tickets (Cliente + Taller)"
                        >
                            <span>💻</span> PC (A4)
                        </button>
                    </div>

                    {modelo === 'sri-sobre-preimpreso' && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setMostrarGuiaVisual(!mostrarGuiaVisual)}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 border ${
                                    mostrarGuiaVisual 
                                        ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs' 
                                        : 'bg-slate-50 border-slate-300 text-slate-500'
                                }`}
                                title="Muestra u oculta la plantilla offset de fondo en pantalla (nunca se imprime en papel)"
                            >
                                <span>{mostrarGuiaVisual ? '👁️' : '🙈'}</span>
                                <span>Guía Fondo: <strong>{mostrarGuiaVisual ? 'ON' : 'OFF'}</strong></span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/*
              * ── CALIBRACIÓN DE REGISTRO (no se imprime) ────────────────────────────────
              * Las variantes que van sobre un formulario YA impreso necesitan que la hoja
              * entre siempre en la misma posición, y eso depende de la impresora, no del
              * sistema. Acá se corre el contenido en milímetros mirando una hoja de prueba
              * hasta que los datos caigan en las casillas. El valor queda guardado por modelo.
              */}
            <div className="no-print" style={{
                width: '100%', maxWidth: modelo === 'sri-pc' ? '210mm' : '175mm', margin: '0 auto 14px', padding: '12px 16px',
                background: esCalibracionCero(calibracion) ? '#FFFFFF' : '#FFFBEB',
                border: `1px solid ${esCalibracionCero(calibracion) ? '#E4E8F4' : '#F4E3A8'}`,
                borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
                <div style={{ minWidth: 148 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: '#8A93AE' }}>Registro</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0A1140', marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>
                        {describirCalibracion(calibracion)}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#6B7590' }}>Horizontal</span>
                    <button type="button" onClick={() => moverRegistro(-PASO_MM, 0)} title={`Mover ${PASO_MM} mm a la izquierda`} style={BTN_REGISTRO}>←</button>
                    <button type="button" onClick={() => moverRegistro(PASO_MM, 0)} title={`Mover ${PASO_MM} mm a la derecha`} style={BTN_REGISTRO}>→</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#6B7590' }}>Vertical</span>
                    <button type="button" onClick={() => moverRegistro(0, -PASO_MM)} title={`Mover ${PASO_MM} mm hacia arriba`} style={BTN_REGISTRO}>↑</button>
                    <button type="button" onClick={() => moverRegistro(0, PASO_MM)} title={`Mover ${PASO_MM} mm hacia abajo`} style={BTN_REGISTRO}>↓</button>
                </div>

                <button
                    type="button"
                    onClick={restablecerRegistro}
                    disabled={esCalibracionCero(calibracion)}
                    style={{
                        padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                        background: '#FFFFFF', border: '1px solid #D7DDF0',
                        color: esCalibracionCero(calibracion) ? '#A6AFC8' : '#16309B',
                        cursor: esCalibracionCero(calibracion) ? 'default' : 'pointer',
                    }}
                >Restablecer</button>

                <span style={{ fontSize: 11, color: '#6B7590', flex: 1, minWidth: 220 }}>
                    Calibración de ajuste fino de a {PASO_MM} mm.
                    {' '}Guardado para <strong style={{ color: '#0A1140' }}>{descriptorModelo.label}</strong>.
                </span>
            </div>

            {/* CONTENEDOR EXACTO A4 (2x A5 CON CORTE INDUSTRIAL) */}
            {modelo === 'sri-pc' ? (
            <div id="documento-maestro-sri" data-modelo={modelo} style={{ transform: transformCalibracion(calibracion) }} className="page-container web-shadow rounded-sm relative z-10 flex flex-col justify-between p-2">
                {/* COPIA 1: ORIGINAL CLIENTE (A5 SUPERIOR) */}
                <div className="h-[143mm] overflow-hidden">
                    {renderTicketA5('cliente')}
                </div>

                {/* LÍNEA DE CORTE CENTRAL INDUSTRIAL */}
                <div className="w-full flex items-center justify-center my-1 relative z-20">
                    <div className="w-full border-t border-dashed border-slate-400"></div>
                    <div className="absolute bg-white px-4 py-0.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border border-slate-300 rounded-full shadow-sm">
                        <span>✂</span> CORTAR AQUÍ (COPIA IMPRENTA / TALLER)
                    </div>
                </div>

                {/* COPIA 2: COPIA TALLER (A5 INFERIOR) */}
                <div className="h-[143mm] overflow-hidden">
                    {renderTicketA5('imprenta')}
                </div>
            </div>
            ) : modelo === 'sri-moderno' ? (
            /*
             * VERSIÓN 3: EVOLUCIÓN MODERNA FULL PRO (MEDIO OFICIO 160 × 220 mm)
             * Diseño minimalista, elegante, editorial suizo con QR dinámico y badges oficiales.
             */
            <div id="documento-maestro-sri" data-modelo={modelo} style={{ transform: transformCalibracion(calibracion) }} className="page-container hoja-medio-oficio web-shadow rounded-sm relative z-10 overflow-hidden bg-white">
                {renderArteModernoMedioOficio()}
            </div>
            ) : (
            /*
             * MEDIO OFICIO 160 × 220 mm:
             * - `sri-sobre-preimpreso`: Imprime SOLO los datos (y muestra guía tenue en pantalla si mostrarGuiaVisual=true)
             * - `sri-arte-completo`: Imprime el arte clásico completo + los datos para hoja en blanco
             */
            <div id="documento-maestro-sri" data-modelo={modelo} style={{ transform: transformCalibracion(calibracion) }} className="page-container hoja-medio-oficio web-shadow rounded-sm relative z-10 overflow-hidden bg-white">
                {modelo === 'sri-arte-completo' && renderArteFormularioMedioOficio()}
                {modelo === 'sri-sobre-preimpreso' && mostrarGuiaVisual && (
                    <div className="guia-fondo-preimpreso no-print pointer-events-none absolute inset-0 opacity-40 select-none z-0">
                        {renderArteFormularioMedioOficio()}
                        <div className="absolute top-2 right-2 bg-amber-500 text-slate-950 text-[7px] font-mono font-black px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
                            Guía Visual Offset (No se imprime)
                        </div>
                    </div>
                )}
                <div className="relative z-10 w-full h-full">
                    {renderCapaDatosMedioOficio()}
                </div>
            </div>
            )}
        </div>
    );
};

export default SolicitudImpresionPage;
