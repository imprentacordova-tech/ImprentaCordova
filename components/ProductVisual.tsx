import React from 'react';

/**
 * ProductVisual — Ilustración dinámica de productos de imprenta.
 * =====================================================================
 * Reemplaza la foto estática por una ilustración SVG que reacciona a las
 * especificaciones del pedido. El caso estrella es el TALONARIO: se dibuja
 * como un cuaderno con "pasta café" (cubierta de cartón marrón), un bloque
 * central de hojas cuyo GROSOR crece con la cantidad de hojas, y N cuadernos
 * uno al lado del otro cuando se piden N blocks.
 *
 * Se usa en:
 *   - components/orders/ServiceSelector.tsx (tarjetas del catálogo)
 *   - pages/Productos.tsx (vista previa sin foto)
 *
 * No depende de la red ni de Supabase: es 100% vectorial y local, así que
 * nunca se rompe por una URL caída (imgur, etc.).
 */

/** "Pasta café" — cartón marrón de la cubierta del talonario. */
const CAFE = '#7C4A2A';
const CAFE_DARK = '#5A3317';
const CAFE_LIGHT = '#9A6A42';
/** Hojas crema (papel químico / bond). */
const PAGE = '#FFF7EA';
const PAGE_LINE = '#E8D9C0';
/** Oro de marca y azul marino (design_manifest §2). */
const GOLD = '#FFC61A';
const NAVY = '#0A1140';

interface TalonarioArtProps {
  /** Número de blocks (cuadernos) del pedido. Se dibujan uno al lado del otro. */
  bloques?: number;
  /** Hojas por block. Más hojas → bloque central más grueso. */
  hojas?: number;
  /** Rótulo corto que va impreso en la cubierta. */
  etiqueta?: string;
  /** ¿Es comprobante autorizado por el SRI? Muestra la píldora dorada SRI. */
  esSRI?: boolean;
  /** Ancho total de la ilustración (px). El alto se deriva de la proporción. */
  width?: number;
}

/** Palabras que identifican a un producto tipo "talonario / block / comprobante". */
const ES_TALONARIO = /(talonario|bloc|facturero|comprobante|recibo|nota de venta|notas de venta|factura|liquidaci[oó]n|gu[ií]a de remisi|retenci[oó]n|vale|memorando)/i;

/** Devuelve true si el producto debe dibujarse como talonario/cuaderno. */
export const esProductoTalonario = (nombre: string | null | undefined): boolean =>
    !!nombre && ES_TALONARIO.test(nombre);

/** Rótulo corto para la cubierta, derivado del nombre si no se pasa uno. */
const rotuloCorto = (nombre?: string): string => {
    const n = (nombre || '').toUpperCase().trim();
    if (!n) return 'TALONARIO';
    if (n.includes('NOTA DE VENTA')) return 'NOTA DE VENTA';
    if (n.includes('FACTURA')) return 'FACTURA';
    if (n.includes('LIQUIDACI')) return 'LIQUIDACIÓN';
    if (n.includes('GUÍA') || n.includes('GUIA')) return 'GUÍA REMISIÓN';
    if (n.includes('RETENCI')) return 'RETENCIÓN';
    if (n.includes('RECIBO')) return 'RECIBO';
    if (n.includes('VALE')) return 'VALE';
    return n.length > 16 ? n.slice(0, 15) + '…' : n;
};

/** Una línea de separación dentro del bloque de hojas, para insinuar el taco. */
const LineaHoja: React.FC<{ y: number }> = ({ y }) => (
    <line x1={16} y1={y} x2={84} y2={y} stroke={PAGE_LINE} strokeWidth={0.8} strokeDasharray="4 3" />
);

/** Un solo cuaderno (talonario) en vista frontal con su taco de hojas. */
const Cuaderno: React.FC<{
    bloques: number;
    hojas: number;
    etiqueta: string;
    esSRI: boolean;
    ancho: number;
}> = ({ bloques, hojas, etiqueta, esSRI, ancho }) => {
    // Grosor del taco central: crece con las hojas, con tope para no deformarse.
    const stackH = Math.max(12, Math.min(78, 12 + Math.round(hojas * 0.25)));
    const coverY = 8;
    const coverH = 58;
    const stackY = coverY + coverH;
    const backY = stackY + stackH;
    const alto = backY + 22;
    const lineas = [1, 2, 3, 4].map(i => stackY + (stackH * i) / 5);

    return (
        <svg
            viewBox={`0 0 100 ${alto}`}
            width={ancho}
            height={Math.round(ancho * (alto / 100))}
            role="img"
            aria-label={`${etiqueta} · ${hojas} hojas · ${bloques} block(s)`}
            style={{ display: 'block', flexShrink: 0 }}
        >
            <defs>
                <linearGradient id={`cafe-${ancho}-${bloques}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={CAFE_LIGHT} />
                    <stop offset="0.5" stopColor={CAFE} />
                    <stop offset="1" stopColor={CAFE_DARK} />
                </linearGradient>
            </defs>

            {/* Cubierta trasera (asoma por detrás del taco) */}
            <rect x={11} y={stackY - 3} width={78} height={stackH + 16} rx={6} fill={CAFE_DARK} />
            <rect x={11} y={stackY - 3} width={78} height={stackH + 16} rx={6} fill="none" stroke={CAFE_DARK} strokeWidth={1} />

            {/* Taco central de hojas */}
            <rect x={14} y={stackY} width={72} height={stackH} fill={PAGE} />
            {lineas.map((y, i) => (
                <LineaHoja key={i} y={y} />
            ))}
            {/* Filo lateral del taco (sensación de grosor) */}
            <rect x={14} y={stackY} width={72} height={stackH} fill="none" stroke={PAGE_LINE} strokeWidth={1} />

            {/* Cubierta frontal (pasta café) */}
            <rect x={10} y={coverY} width={80} height={coverH} rx={7} fill={`url(#cafe-${ancho}-${bloques})`} />
            <rect x={10} y={coverY} width={80} height={coverH} rx={7} fill="none" stroke={CAFE_DARK} strokeWidth={1.2} />
            {/* Brillo de cartón */}
            <rect x={13} y={coverY + 3} width={74} height={10} rx={5} fill="rgba(255,255,255,.14)" />

            {/* Rótulo de la cubierta */}
            <text
                x={50}
                y={coverY + 34}
                textAnchor="middle"
                fontFamily="'Outfit',system-ui,sans-serif"
                fontSize={etiqueta.length > 12 ? 8.5 : 10.5}
                fontWeight={700}
                letterSpacing="0.5"
                fill="#F5E9D6"
            >
                {etiqueta}
            </text>
            <text
                x={50}
                y={coverY + 47}
                textAnchor="middle"
                fontFamily="'JetBrains Mono',monospace"
                fontSize={7.5}
                letterSpacing="1.5"
                fill="rgba(245,233,214,.72)"
            >
                {esSRI ? 'IMPRENTA CÓRDOVA' : 'TALONARIO'}
            </text>

            {/* Píldora SRI (solo comprobantes autorizados) */}
            {esSRI ? (
                <g>
                    <rect x={28} y={coverY + 44} width={44} height={13} rx={6.5} fill={GOLD} />
                    <text
                        x={50}
                        y={coverY + 53.5}
                        textAnchor="middle"
                        fontFamily="'Inter',system-ui,sans-serif"
                        fontSize={7.5}
                        fontWeight={800}
                        fill={NAVY}
                    >
                        SRI · TAX
                    </text>
                </g>
            ) : (
                <text
                    x={50}
                    y={coverY + 52}
                    textAnchor="middle"
                    fontFamily="'Inter',system-ui,sans-serif"
                    fontSize={6.5}
                    fontWeight={700}
                    fill="rgba(245,233,214,.55)"
                >
                    BLOCK ENCOLADO
                </text>
            )}
        </svg>
    );
};

/** Ilustración dinámica de talonarios: N cuadernos según el número de blocks. */
export const TalonarioArt: React.FC<TalonarioArtProps> = ({
    bloques = 1,
    hojas = 100,
    etiqueta,
    esSRI = false,
    width = 200,
}) => {
    const n = Math.max(1, Math.round(bloques));
    const visibles = Math.min(n, 4);
    const hueco = 8;
    const anchoCuaderno = Math.max(30, Math.round((width - hueco * (visibles - 1)) / visibles));
    const rotulo = etiqueta || 'TALONARIO';

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: hueco,
                width,
                maxWidth: '100%',
                padding: '2px 0',
            }}
        >
            {Array.from({ length: visibles }).map((_, i) => (
                <Cuaderno
                    key={i}
                    bloques={n}
                    hojas={hojas}
                    etiqueta={rotulo}
                    esSRI={esSRI}
                    ancho={anchoCuaderno}
                />
            ))}
            {n > visibles && (
                <span
                    style={{
                        alignSelf: 'center',
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 11,
                        fontWeight: 800,
                        color: CAFE,
                        background: '#F6EEE3',
                        border: '1px solid #E0D3C0',
                        borderRadius: 99,
                        padding: '2px 8px',
                    }}
                >
                    +{n - visibles}
                </span>
            )}
        </div>
    );
};

/**
 * Visual genérico para productos que NO son talonarios: una tarjeta con la
 * inicial de la categoría, para que ninguna ficha quede sin imagen.
 */
const VisualGenerico: React.FC<{ nombre?: string; categoria?: string; ancho: number }> = ({
    nombre,
    categoria,
    ancho,
}) => {
    const inicial = (categoria || nombre || 'P').trim().charAt(0).toUpperCase();
    return (
        <div
            style={{
                width: ancho,
                aspectRatio: '4 / 3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 6,
                background: 'linear-gradient(135deg,#EEF1FC 0%,#F7F9FF 100%)',
                border: '1px solid #D7DDF0',
                borderRadius: 12,
                color: '#16309B',
            }}
        >
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 700 }}>{inicial}</span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '.12em', color: '#8A93AE', textTransform: 'uppercase' }}>
                {categoria || 'Producto'}
            </span>
        </div>
    );
};

export interface ProductVisualProps {
    nombre?: string;
    categoria?: string;
    esSRI?: boolean;
    /** Hojas por block (grosor del taco) cuando aplica. */
    hojas?: number;
    /** Blocks / cuadernos cuando aplica. */
    bloques?: number;
    width?: number;
}

/**
 * Punto de entrada único: elige la ilustración según el tipo de producto.
 * Los talonarios/blocks/comprobantes usan `TalonarioArt`; el resto, genérico.
 */
/** Deriva blocks y hojas desde el nombre ("3x Blocs (50x2)" → 3 blocks, 50 hojas). */
const derivarCantidades = (nombre?: string): { bloques: number; hojas: number } => {
    if (!nombre) return { bloques: 1, hojas: 100 };
    let bloques = 1;
    const mBloc = nombre.match(/(\d+)\s*x\s*blocs?/i);
    if (mBloc) bloques = Math.max(1, parseInt(mBloc[1], 10));
    let hojas = 100;
    const mHojas = nombre.match(/\((\d+)\s*x\s*\d+\)/);
    if (mHojas) hojas = Math.max(1, parseInt(mHojas[1], 10));
    return { bloques, hojas };
};

export const ProductVisual: React.FC<ProductVisualProps> = ({
    nombre,
    categoria,
    esSRI,
    hojas,
    bloques,
    width = 200,
}) => {
    if (esProductoTalonario(nombre)) {
        const derivado = derivarCantidades(nombre);
        return (
            <TalonarioArt
                bloques={bloques ?? derivado.bloques}
                hojas={hojas ?? derivado.hojas}
                etiqueta={rotuloCorto(nombre)}
                esSRI={!!esSRI}
                width={width}
            />
        );
    }
    return <VisualGenerico nombre={nombre} categoria={categoria} ancho={width} />;
};

export default ProductVisual;
