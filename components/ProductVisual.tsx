import React from 'react';

/**
 * ProductVisual — Ilustración dinámica de productos de imprenta (v2 premium).
 * =====================================================================
 * Cada producto se dibuja con una ilustración SVG vectorial coherente con la
 * marca "Marino & Oro", sin depender de URLs externas (nunca se rompe).
 *
 * Caso estrella: el TALONARIO, dibujado como un cuaderno con "pasta café"
 * (cubierta de cartón marrón), lomo cosido, abanico de hojas cuyo GROSOR crece
 * con la cantidad de hojas, y N cuadernos cuando se piden N blocks.
 *
 * El resto de categorías (tarjetas, sellos, lonas, etiquetas, packaging, merch,
 * publicidad) tienen su propia ilustración, para que ninguna ficha quede genérica.
 */

/* ── Paleta ─────────────────────────────────────────────────────────── */
const CAFE = '#7C4A2A';
const CAFE_DARK = '#4E2E15';
const CAFE_LIGHT = '#9A6A42';
const PAGE = '#FFF7EA';
const PAGE_EDGE = '#EAD9BE';
const GOLD = '#FFC61A';
const NAVY = '#0A1140';
const ROYAL = '#16309B';
const CREAM = '#F7F3EC';

/* ── Detección de tipo ──────────────────────────────────────────────── */
const ES_TALONARIO = /(talonario|bloc|facturero|comprobante|recibo|nota de venta|notas de venta|factura|liquidaci[oó]n|gu[ií]a de remisi|retenci[oó]n|vale|memorando|rifa|boleto|bingo|cart[oó]n de bingo)/i;

export const esProductoTalonario = (nombre: string | null | undefined): boolean =>
    !!nombre && ES_TALONARIO.test(nombre);

type CategoriaVisual =
    | 'tarjeta' | 'sello' | 'lona' | 'etiqueta' | 'caja'
    | 'merch' | 'publicidad' | 'talonario' | 'generico';

const detectarCategoria = (nombre?: string, categoria?: string): CategoriaVisual => {
    if (esProductoTalonario(nombre)) return 'talonario';
    const t = `${nombre || ''} ${categoria || ''}`.toLowerCase();
    if (/(tarjeta|business card)/.test(t)) return 'tarjeta';
    if (/(sello|estamp)/.test(t)) return 'sello';
    if (/(gran formato|lona|banner|roll|gigantogra|letrero|vinil|backlight|caja de luz)/.test(t)) return 'lona';
    if (/(etiqueta|label|sticker|adhesivo)/.test(t)) return 'etiqueta';
    if (/(packaging|caja|bolsa|empaque|joyer)/.test(t)) return 'caja';
    if (/(merch|jarro|taza|bol[ií]grafo|llavero|agenda|termico|termo)/.test(t)) return 'merch';
    if (/(publicidad|volante|folleto|afiche|flyer|d[ií]ptico|tr[ií]ptico|revista|sobre|membretad|hoja)/.test(t)) return 'publicidad';
    return 'generico';
};

const rotuloCorto = (nombre?: string): string => {
    const n = (nombre || '').toUpperCase().trim();
    if (!n) return 'TALONARIO';
    if (n.includes('NOTA DE VENTA')) return 'NOTA DE VENTA';
    if (n.includes('FACTURA')) return 'FACTURA';
    if (n.includes('LIQUIDACI')) return 'LIQUIDACIÓN';
    if (n.includes('GUÍA') || n.includes('GUIA')) return 'GUÍA REMISIÓN';
    if (n.includes('RETENCI')) return 'RETENCIÓN';
    if (n.includes('RECIBO')) return 'RECIBO';
    if (n.includes('RIFA')) return 'RIFA';
    if (n.includes('BINGO')) return 'BINGO';
    if (n.includes('VALE')) return 'VALE';
    return n.length > 15 ? n.slice(0, 14) + '…' : n;
};

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

/* ── Talonario (cuaderno con pasta café) ───────────────────────────── */
interface TalonarioArtProps {
    bloques?: number;
    hojas?: number;
    etiqueta?: string;
    esSRI?: boolean;
    width?: number;
}

const Cuaderno: React.FC<{
    hojas: number;
    etiqueta: string;
    esSRI: boolean;
    ancho: number;
    id: string;
}> = ({ hojas, etiqueta, esSRI, ancho, id }) => {
    const stackH = Math.max(14, Math.min(80, 14 + Math.round(hojas * 0.26)));
    const coverY = 8;
    const coverH = 56;
    const stackY = coverY + coverH;
    const alto = stackY + stackH + 20;
    const lineas = [1, 2, 3, 4, 5].map(i => stackY + (stackH * i) / 6);

    return (
        <svg
            viewBox={`0 0 100 ${alto}`}
            width={ancho}
            height={Math.round(ancho * (alto / 100))}
            role="img"
            aria-label={`${etiqueta} · ${hojas} hojas`}
            style={{ display: 'block', flexShrink: 0, filter: 'drop-shadow(0 6px 10px rgba(10,17,64,0.14))' }}
        >
            <defs>
                <linearGradient id={`cover-${id}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor={CAFE_LIGHT} />
                    <stop offset="0.45" stopColor={CAFE} />
                    <stop offset="1" stopColor={CAFE_DARK} />
                </linearGradient>
            </defs>

            {/* Cubierta trasera (asoma por detrás del taco) */}
            <rect x={11} y={stackY - 3} width={78} height={stackH + 14} rx={6} fill={CAFE_DARK} />

            {/* Taco de hojas con abanico */}
            <rect x={14} y={stackY} width={72} height={stackH} fill={PAGE} />
            {lineas.map((y, i) => (
                <line key={i} x1={16} y1={y} x2={84} y2={y} stroke={PAGE_EDGE} strokeWidth={0.8} strokeDasharray="3 3" />
            ))}
            {/* Filo inferior del taco: abanico de esquinas */}
            <rect x={14} y={stackY + stackH - 3} width={72} height={3} fill={PAGE_EDGE} />
            <path d={`M14 ${stackY + stackH} h72 l-4 3 h-64 Z`} fill="#E2D2B4" />

            {/* Cubierta frontal (pasta café) */}
            <rect x={10} y={coverY} width={80} height={coverH} rx={7} fill={`url(#cover-${id})`} stroke={CAFE_DARK} strokeWidth={1.1} />
            {/* Veta de cuero (brillo) */}
            <path d={`M14 ${coverY + 5} Q50 ${coverY + 2} 86 ${coverY + 5}`} stroke="rgba(255,255,255,.28)" strokeWidth={2} fill="none" />
            {/* Lomo cosido (izquierda) */}
            <line x1={12} y1={coverY + 10} x2={12} y2={coverY + coverH - 6} stroke="rgba(0,0,0,.18)" strokeWidth={1.4} />
            {[0, 1, 2].map(i => (
                <circle key={i} cx={12} cy={coverY + 14 + i * 15} r={1} fill="rgba(255,255,255,.5)" />
            ))}

            {/* Marco de etiqueta dorado */}
            <rect x={23} y={coverY + 8} width={54} height={38} rx={3} fill="none" stroke="rgba(255,198,26,.6)" strokeWidth={0.9} />

            {/* Rótulo */}
            <text
                x={50}
                y={coverY + 24}
                textAnchor="middle"
                fontFamily="'Outfit',system-ui,sans-serif"
                fontSize={etiqueta.length > 12 ? 7.5 : 9.5}
                fontWeight={700}
                letterSpacing="0.4"
                fill="#F6EBD9"
            >
                {etiqueta}
            </text>
            <text
                x={50}
                y={coverY + 36}
                textAnchor="middle"
                fontFamily="'JetBrains Mono',monospace"
                fontSize={6.5}
                letterSpacing="1.4"
                fill="rgba(246,235,217,.72)"
            >
                IMPRENTA CÓRDOVA
            </text>

            {/* Píldora SRI / comercial */}
            {esSRI ? (
                <g>
                    <rect x={31} y={coverY + 41} width={38} height={12} rx={6} fill={GOLD} />
                    <text x={50} y={coverY + 49.5} textAnchor="middle" fontFamily="'Inter',sans-serif" fontSize={7} fontWeight={800} fill={NAVY}>
                        SRI · TAX
                    </text>
                </g>
            ) : (
                <text x={50} y={coverY + 49.5} textAnchor="middle" fontFamily="'Inter',sans-serif" fontSize={6} fontWeight={700} fill="rgba(246,235,217,.6)">
                    BLOCK ENCOLADO
                </text>
            )}
        </svg>
    );
};

export const TalonarioArt: React.FC<TalonarioArtProps> = ({
    bloques = 1,
    hojas = 100,
    etiqueta,
    esSRI = false,
    width = 200,
}) => {
    const n = Math.max(1, Math.round(bloques));
    const visibles = Math.min(n, 4);
    const hueco = 10;
    const anchoCuaderno = Math.max(34, Math.round((width - hueco * (visibles - 1)) / visibles));
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
                padding: '4px 0',
            }}
        >
            {Array.from({ length: visibles }).map((_, i) => (
                <Cuaderno
                    key={i}
                    hojas={hojas}
                    etiqueta={rotulo}
                    esSRI={esSRI}
                    ancho={anchoCuaderno}
                    id={`${n}-${hojas}-${i}`}
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
                        background: CREAM,
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

/* ── Ilustraciones por categoría (marco común claro) ──────────────── */
const Marco: React.FC<{ children: React.ReactNode; width: number; alto?: number }> = ({ children, width }) => (
    <svg viewBox="0 0 120 90" width={width} height={Math.round(width * (90 / 120))} style={{ display: 'block', maxWidth: '100%' }}>
        {children}
    </svg>
);

const TarjetaArt: React.FC<{ width: number }> = ({ width }) => (
    <Marco width={width}>
        {[0, 1, 2].map(i => (
            <rect key={i} x={34 - i * 4} y={16 + i * 4} width={60} height={38} rx={5}
                fill={i === 2 ? '#FFFFFF' : '#EEF1FC'} stroke={i === 2 ? ROYAL : '#D7DDF0'} strokeWidth={1} />
        ))}
        <circle cx={62} cy={35} r={6} fill={ROYAL} opacity={0.85} />
        <line x1={44} y1={46} x2={80} y2={46} stroke={ROYAL} strokeWidth={2.5} />
        <line x1={44} y1={53} x2={72} y2={53} stroke="#C2CAE6" strokeWidth={2} />
    </Marco>
);

const SelloArt: React.FC<{ width: number }> = ({ width }) => (
    <Marco width={width}>
        <rect x={52} y={14} width={16} height={10} rx={2} fill="#5B6480" />
        <rect x={54} y={24} width={12} height={6} fill="#8A93AE" />
        <rect x={34} y={30} width={52} height={40} rx={4} fill="#F2F4FA" stroke="#D7DDF0" strokeWidth={1.2} />
        <circle cx={60} cy={46} r={11} fill="none" stroke={ROYAL} strokeWidth={2} />
        <text x={60} y={49} textAnchor="middle" fontFamily="'Outfit',sans-serif" fontSize={8} fontWeight={700} fill={ROYAL}>IC</text>
        <rect x={34} y={70} width={52} height={8} rx={3} fill={ROYAL} />
    </Marco>
);

const LonaArt: React.FC<{ width: number }> = ({ width }) => (
    <Marco width={width}>
        <rect x={58} y={10} width={8} height={70} fill="#3C4763" rx={2} />
        <rect x={66} y={18} width={14} height={64} fill="#FFFFFF" stroke="#D7DDF0" strokeWidth={1} />
        <circle cx={62} cy={10} r={4} fill="#5B6480" />
        <rect x={70} y={26} width={7} height={7} rx={1.5} fill={ROYAL} />
        <rect x={70} y={38} width={7} height={7} rx={1.5} fill={GOLD} />
        <rect x={70} y={50} width={7} height={7} rx={1.5} fill="#1B8A4B" />
    </Marco>
);

const EtiquetaArt: React.FC<{ width: number }> = ({ width }) => (
    <Marco width={width}>
        <circle cx={60} cy={46} r={26} fill="none" stroke="#E4E8F4" strokeWidth={1} />
        <path d="M34 34 A26 26 0 0 1 86 34 L86 52 Q86 60 60 66 Q34 60 34 52 Z" fill="#FFFFFF" stroke="#D7DDF0" strokeWidth={1} />
        <circle cx={60} cy={40} r={4} fill={GOLD} />
        <rect x={46} y={46} width={28} height={6} rx={2} fill={ROYAL} />
    </Marco>
);

const CajaArt: React.FC<{ width: number }> = ({ width }) => (
    <Marco width={width}>
        <rect x={30} y={30} width={46} height={40} rx={3} fill="#FFFFFF" stroke="#D7DDF0" strokeWidth={1.2} />
        <path d="M30 30 L53 20 L76 30" fill="none" stroke="#C2CAE6" strokeWidth={1.2} />
        <path d="M53 20 L53 40" stroke="#C2CAE6" strokeWidth={1} />
        <circle cx={53} cy={30} r={3} fill={GOLD} />
        <rect x={76} y={34} width={14} height={3} rx={1.5} fill={ROYAL} />
    </Marco>
);

const MerchArt: React.FC<{ width: number }> = ({ width }) => (
    <Marco width={width}>
        <path d="M40 26 h30 l4 30 q-1 24 -19 24 q-18 0 -19 -24 Z" fill="#FFFFFF" stroke="#D7DDF0" strokeWidth={1.2} />
        <path d="M46 20 q-2 -8 8 -8 h8 q8 0 8 8" fill="none" stroke={ROYAL} strokeWidth={2.5} />
        <rect x={48} y={34} width={24} height={5} rx={2} fill={ROYAL} opacity={0.85} />
    </Marco>
);

const PublicidadArt: React.FC<{ width: number }> = ({ width }) => (
    <Marco width={width}>
        <rect x={30} y={16} width={52} height={60} rx={3} fill="#FFFFFF" stroke="#D7DDF0" strokeWidth={1} />
        <line x1={56} y1={16} x2={56} y2={76} stroke="#E4E8F4" strokeWidth={1.2} />
        <rect x={36} y={24} width={14} height={9} rx={1.5} fill={ROYAL} />
        <line x1={36} y1={40} x2={50} y2={40} stroke="#C2CAE6" strokeWidth={2} />
        <line x1={36} y1={46} x2={46} y2={46} stroke="#D7DDF0" strokeWidth={2} />
        <rect x={62} y={24} width={14} height={9} rx={1.5} fill={GOLD} />
        <line x1={62} y1={40} x2={76} y2={40} stroke="#C2CAE6" strokeWidth={2} />
        <line x1={62} y1={46} x2={72} y2={46} stroke="#D7DDF0" strokeWidth={2} />
    </Marco>
);

const GenericoArt: React.FC<{ nombre?: string; categoria?: string; width: number }> = ({ nombre, categoria, width }) => {
    const inicial = (categoria || nombre || 'P').trim().charAt(0).toUpperCase();
    return (
        <div
            style={{
                width,
                maxWidth: '100%',
                aspectRatio: '4 / 3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 6,
                background: 'linear-gradient(135deg,#EEF1FC 0%,#F7F9FF 100%)',
                border: '1px solid #D7DDF0',
                borderRadius: 12,
                color: ROYAL,
            }}
        >
            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 700 }}>{inicial}</span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '.12em', color: '#8A93AE', textTransform: 'uppercase' }}>
                {categoria || 'Producto'}
            </span>
        </div>
    );
};

/* ── Punto de entrada ──────────────────────────────────────────────── */
export interface ProductVisualProps {
    nombre?: string;
    categoria?: string;
    esSRI?: boolean;
    hojas?: number;
    bloques?: number;
    width?: number;
}

export const ProductVisual: React.FC<ProductVisualProps> = ({
    nombre,
    categoria,
    esSRI,
    hojas,
    bloques,
    width = 200,
}) => {
    const tipo = detectarCategoria(nombre, categoria);
    switch (tipo) {
        case 'talonario': {
            const d = derivarCantidades(nombre);
            return (
                <TalonarioArt
                    bloques={bloques ?? d.bloques}
                    hojas={hojas ?? d.hojas}
                    etiqueta={rotuloCorto(nombre)}
                    esSRI={!!esSRI}
                    width={width}
                />
            );
        }
        case 'tarjeta': return <TarjetaArt width={width} />;
        case 'sello': return <SelloArt width={width} />;
        case 'lona': return <LonaArt width={width} />;
        case 'etiqueta': return <EtiquetaArt width={width} />;
        case 'caja': return <CajaArt width={width} />;
        case 'merch': return <MerchArt width={width} />;
        case 'publicidad': return <PublicidadArt width={width} />;
        default: return <GenericoArt nombre={nombre} categoria={categoria} width={width} />;
    }
};

export default ProductVisual;
