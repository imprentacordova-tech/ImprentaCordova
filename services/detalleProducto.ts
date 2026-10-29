/**
 * Perfiles de detalle por tipo de producto — Imprenta Córdova
 * =====================================================================
 * El Paso 2 de Nueva Orden NO debe pedir lo mismo a todo. Un sello no tiene
 * hojas ni papel químico ni clave del SRI; una impresión láser/sublimación sí
 * pide diseño, color, papel, numeración y copias. Este módulo define, por
 * perfil, QUÉ campos se preguntan y CUÁNTO suma cada opción.
 *
 * `perfilDe(item)` resuelve el perfil por `esSRI`, categoría y nombre. Los
 * ítems viejos (sin perfil guardado) caen igual al perfil correcto.
 */

export type TipoCampo = 'chips' | 'texto' | 'textarea';

export interface OpcionCampo {
    valor: string;
    label: string;
    /** Modificador de precio unitario del ítem (USD). */
    delta?: number;
}

export interface CampoDetalle {
    key: string;
    label: string;
    tipo: TipoCampo;
    opciones?: OpcionCampo[];
    placeholder?: string;
    default?: string;
    ayuda?: string;
    icono?: string;
}

export interface PerfilDetalle {
    id: string;
    label: string;
    /** Unidad que se muestra junto al stepper de cantidad. */
    unidadCantidad: string;
    /** ¿El perfil maneja hojas/talonarios? (solo SRI). */
    manejaHojas?: boolean;
    campos: CampoDetalle[];
}

const COPIAS_SRI: OpcionCampo[] = [
    { valor: 'Original (50 hojas)', label: 'Original (50 hojas)', delta: -1.5 },
    { valor: 'Original + 1 Copia (Duplicado 100h)', label: 'Original + 1 Copia (Duplicado 100h)', delta: 0 },
    { valor: 'Original + 2 Copias (Triplicado 150h)', label: 'Original + 2 Copias (Triplicado 150h)', delta: 3.5 },
    { valor: 'Original + 3 Copias (Cuadruplicado 200h)', label: 'Original + 3 Copias (Cuadruplicado 200h)', delta: 7 },
];

export const PERFILES: Record<string, PerfilDetalle> = {
    // ── Talonario autorizado por el SRI ──────────────────────────────
    sri: {
        id: 'sri',
        label: 'Talonario SRI',
        unidadCantidad: 'Talonarios',
        manejaHojas: true,
        campos: [
            {
                key: 'tamano', label: 'Tamaño de corte', tipo: 'chips', default: '1/4 Oficio', icono: '📐',
                opciones: [
                    { valor: '1/4 Oficio', label: '1/4 Oficio', delta: 0 },
                    { valor: '1/2 Oficio', label: '1/2 Oficio', delta: 4 },
                ],
            },
            {
                key: 'copias', label: 'Copias químicas / hojas por talonario', tipo: 'chips',
                default: 'Original + 1 Copia (Duplicado 100h)', icono: '📖', opciones: COPIAS_SRI,
            },
            {
                key: 'papel', label: 'Papel', tipo: 'chips', default: 'Químico Autocopia', icono: '📜',
                opciones: [{ valor: 'Químico Autocopia', label: 'Químico Autocopia', delta: 0 }],
            },
        ],
    },

    // ── Sello (caucho/polímero: nada de hojas ni papel) ──────────────
    sello: {
        id: 'sello',
        label: 'Sello',
        unidadCantidad: 'Unidades',
        campos: [
            {
                key: 'tipoSello', label: 'Tipo de sello', tipo: 'chips', default: 'Automático', icono: '🔖',
                opciones: [
                    { valor: 'Automático', label: 'Automático', delta: 0 },
                    { valor: 'Seco (relieve)', label: 'Seco (relieve)', delta: 25 },
                    { valor: 'Fechador', label: 'Fechador', delta: 8 },
                    { valor: 'De mano', label: 'De mano', delta: -5 },
                ],
            },
            {
                key: 'medidaSello', label: 'Medida (mm)', tipo: 'chips', default: '38×14 mm', icono: '📏',
                opciones: [
                    { valor: '38×14 mm', label: '38×14 mm', delta: 0 },
                    { valor: '47×18 mm', label: '47×18 mm', delta: 3 },
                    { valor: '52×35 mm', label: '52×35 mm', delta: 8 },
                    { valor: 'Personalizada', label: 'Personalizada', delta: 12 },
                ],
            },
            {
                key: 'colorTinta', label: 'Color de tinta', tipo: 'chips', default: 'Negro', icono: '🎨',
                opciones: [
                    { valor: 'Negro', label: 'Negro', delta: 0 },
                    { valor: 'Azul', label: 'Azul', delta: 0 },
                    { valor: 'Rojo', label: 'Rojo', delta: 0 },
                    { valor: 'Verde', label: 'Verde', delta: 0 },
                    { valor: 'Bicolor', label: 'Bicolor', delta: 5 },
                ],
            },
            {
                key: 'textoSello', label: 'Texto / líneas a grabar', tipo: 'textarea',
                placeholder: 'Nombre, RUC, dirección, teléfono…', default: '',
            },
            {
                key: 'diseno', label: 'Diseño', tipo: 'chips', default: 'Arte provisto', icono: '✏️',
                opciones: [
                    { valor: 'Arte provisto', label: 'Arte provisto', delta: 0 },
                    { valor: 'Diseño nuevo', label: 'Diseño nuevo', delta: 8 },
                ],
            },
        ],
    },

    // ── Impresión láser / sublimación (una sola impresión) ───────────
    laser: {
        id: 'laser',
        label: 'Impresión Láser / Sublimación',
        unidadCantidad: 'Unidades',
        campos: [
            {
                key: 'diseno', label: 'Diseño', tipo: 'chips', default: 'Arte provisto', icono: '✏️',
                opciones: [
                    { valor: 'Arte provisto', label: 'Arte provisto', delta: 0 },
                    { valor: 'Diseño básico', label: 'Diseño básico', delta: 3 },
                    { valor: 'Diseño creativo', label: 'Diseño creativo', delta: 8 },
                ],
            },
            {
                key: 'color', label: 'Color / Tinta', tipo: 'chips', default: 'Full color', icono: '🎨',
                opciones: [
                    { valor: 'Full color', label: 'Full color', delta: 0 },
                    { valor: '1 tinta', label: '1 tinta', delta: -1 },
                    { valor: 'Blanco y negro', label: 'Blanco y negro', delta: -2 },
                ],
            },
            {
                key: 'papel', label: 'Papel / Material', tipo: 'chips', default: 'Bond 75g', icono: '📄',
                opciones: [
                    { valor: 'Bond 75g', label: 'Bond 75g', delta: 0 },
                    { valor: 'Couché 150g', label: 'Couché 150g', delta: 1 },
                    { valor: 'Couché 300g', label: 'Couché 300g', delta: 2 },
                    { valor: 'Adhesivo / Vinil', label: 'Adhesivo / Vinil', delta: 3 },
                    { valor: 'Cerámica / Tela', label: 'Cerámica / Tela', delta: 2 },
                    { valor: 'Metal / Madera', label: 'Metal / Madera', delta: 3 },
                ],
            },
            { key: 'numeracion', label: 'Numeración (opcional)', tipo: 'texto', placeholder: 'Ej. 0001 - 0100', default: '' },
            {
                key: 'copias', label: 'Copias', tipo: 'chips', default: 'Original', icono: '📖',
                opciones: [
                    { valor: 'Original', label: 'Original', delta: 0 },
                    { valor: 'Original + 1 copia', label: 'Original + 1 copia', delta: 1 },
                    { valor: 'Original + 2 copias', label: 'Original + 2 copias', delta: 2 },
                ],
            },
        ],
    },

    // ── Gran formato (lona, roll-up, vinil) ──────────────────────────
    granFormato: {
        id: 'granFormato',
        label: 'Gran Formato',
        unidadCantidad: 'm² / unidades',
        campos: [
            {
                key: 'medidaGF', label: 'Medida', tipo: 'chips', default: '1 m²', icono: '📐',
                opciones: [
                    { valor: '1 m²', label: '1 m²', delta: 0 },
                    { valor: '2 m²', label: '2 m²', delta: 10 },
                    { valor: '4 m²', label: '4 m²', delta: 25 },
                    { valor: 'Personalizada', label: 'Personalizada', delta: 0 },
                ],
            },
            {
                key: 'materialGF', label: 'Material', tipo: 'chips', default: 'Lona 13oz', icono: '📄',
                opciones: [
                    { valor: 'Lona 13oz', label: 'Lona 13oz', delta: 0 },
                    { valor: 'Vinil', label: 'Vinil', delta: 2 },
                    { valor: 'Mesh', label: 'Mesh', delta: 3 },
                    { valor: 'Lona Backlight', label: 'Lona Backlight', delta: 5 },
                ],
            },
            {
                key: 'acabadoGF', label: 'Acabado', tipo: 'chips', default: 'Ojalillos', icono: '🔩',
                opciones: [
                    { valor: 'Ojalillos', label: 'Ojalillos', delta: 0 },
                    { valor: 'Dobladillo', label: 'Dobladillo', delta: 2 },
                    { valor: 'Estructura', label: 'Estructura', delta: 12 },
                ],
            },
        ],
    },

    // ── Empastado / encuadernación ───────────────────────────────────
    empastado: {
        id: 'empastado',
        label: 'Empastado',
        unidadCantidad: 'Unidades',
        campos: [
            {
                key: 'tapa', label: 'Tipo de tapa', tipo: 'chips', default: 'Dura', icono: '📚',
                opciones: [
                    { valor: 'Dura', label: 'Dura', delta: 0 },
                    { valor: 'Blanda', label: 'Blanda', delta: -4 },
                    { valor: 'Con lomo grabado', label: 'Con lomo grabado', delta: 6 },
                ],
            },
            {
                key: 'colorTapa', label: 'Color de tapa', tipo: 'chips', default: 'Negro', icono: '🎨',
                opciones: [
                    { valor: 'Negro', label: 'Negro', delta: 0 },
                    { valor: 'Azul', label: 'Azul', delta: 0 },
                    { valor: 'Vino', label: 'Vino', delta: 0 },
                    { valor: 'Personalizado', label: 'Personalizado', delta: 3 },
                ],
            },
            {
                key: 'tamanoEmp', label: 'Tamaño', tipo: 'chips', default: 'A4', icono: '📏',
                opciones: [
                    { valor: 'A4', label: 'A4', delta: 0 },
                    { valor: 'A5', label: 'A5', delta: -2 },
                    { valor: 'Carta', label: 'Carta', delta: 0 },
                ],
            },
        ],
    },
};

/** Perfil genérico para cualquier producto que no encaje en otro. */
const PERFIL_GENERICO: PerfilDetalle = {
    id: 'generico',
    label: 'Trabajo de Imprenta',
    unidadCantidad: 'Unidades',
    campos: [
        { key: 'detalle', label: 'Detalle / Especificación libre', tipo: 'textarea', placeholder: 'Describí medidas, material, acabados…', default: '' },
    ],
};

export const PERFIL_GENERICO_ID = 'generico';

/** Resuelve el perfil de un ítem. Nunca lanza. */
export const perfilDe = (item: { esSRI?: boolean; categoria?: string; nombre?: string }): PerfilDetalle => {
    if (item.esSRI) return PERFILES.sri;
    const t = `${item.nombre || ''} ${item.categoria || ''}`.toLowerCase();
    if (/sello/.test(t)) return PERFILES.sello;
    if (/(lona|roll.?up|gigantogra|vinil|letrero|backlight|gran formato)/.test(t)) return PERFILES.granFormato;
    if (/empastado/.test(t)) return PERFILES.empastado;
    if (/(tarjeta|volante|d[ií]ptico|tr[ií]ptico|afiche|revista|carpeta|etiqueta|packaging|caja|bolsa|merch|jarro|taza|bol[ií]grafo|agenda|llavero|bingo|rifa|comprobante|recibo|nota|factura)/.test(t)) return PERFILES.laser;
    return PERFIL_GENERICO;
};

/** Suma los deltas de las opciones elegidas (chips) del perfil. */
export const calcularDelta = (perfil: PerfilDetalle, valores: Record<string, any>): number => {
    let delta = 0;
    for (const campo of perfil.campos) {
        if (campo.tipo !== 'chips' || !campo.opciones) continue;
        const val = valores[campo.key] ?? campo.default;
        const op = campo.opciones.find(o => o.valor === val);
        if (op?.delta) delta += op.delta;
    }
    return delta;
};

/** Especificaciones por defecto de un perfil. */
export const especificacionesPorDefecto = (perfil: PerfilDetalle): Record<string, any> => {
    const out: Record<string, any> = { perfil: perfil.id };
    for (const campo of perfil.campos) out[campo.key] = campo.default ?? (campo.tipo === 'chips' ? campo.opciones?.[0]?.valor : '');
    return out;
};

/** Resumen legible de los valores elegidos (para chips de vista previa). */
export const resumenPerfil = (perfil: PerfilDetalle, valores: Record<string, any>): Array<{ icono: string; texto: string }> => {
    const out: Array<{ icono: string; texto: string }> = [];
    for (const campo of perfil.campos) {
        if (campo.tipo === 'chips' && campo.opciones) {
            const val = valores[campo.key] ?? campo.default;
            if (val) out.push({ icono: campo.icono || '•', texto: String(val) });
        }
    }
    return out;
};
