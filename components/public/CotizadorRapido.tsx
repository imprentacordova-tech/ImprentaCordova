import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateWhatsAppLink } from '../../utils';
import { WhatsAppIcon, Sparkles, Check, Clock, Layers, ShieldCheck, ArrowRight } from '../Icons';

interface ProductOption {
    id: string;
    name: string;
    category: 'SRI' | 'Comercial' | 'Sellos' | 'Gran Formato';
    badge: string;
    desc: string;
    quantities: number[];
    unitLabel: string;
    basePrice: number;
    pricePerExtraUnit: number;
    eta: string;
    finishes: { id: string; name: string; multiplier: number }[];
}

const PRODUCTS: ProductOption[] = [
    {
        id: 'facturas-sri',
        name: 'Facturas SRI Autocopiativas',
        category: 'SRI',
        badge: 'SRI Autorizado',
        desc: 'Papel químico autocopiativo con numeración secuencial y pie de imprenta legal.',
        quantities: [100, 200, 500, 1000],
        unitLabel: 'juegos',
        basePrice: 12.00,
        pricePerExtraUnit: 0.06,
        eta: '24 horas',
        finishes: [
            { id: 'orig-1copia', name: 'Original + 1 Copia (2 partes)', multiplier: 1.0 },
            { id: 'orig-2copias', name: 'Original + 2 Copias (3 partes)', multiplier: 1.25 },
        ]
    },
    {
        id: 'notas-venta',
        name: 'Notas de Venta RIMPE',
        category: 'SRI',
        badge: 'RIMPE Popular',
        desc: 'Para negocios populares con diseño simplificado, formato reglamentario SRI.',
        quantities: [100, 200, 500, 1000],
        unitLabel: 'juegos',
        basePrice: 10.00,
        pricePerExtraUnit: 0.05,
        eta: '24 horas',
        finishes: [
            { id: 'orig-1copia', name: 'Original + 1 Copia', multiplier: 1.0 },
            { id: 'orig-2copias', name: 'Original + 2 Copias', multiplier: 1.22 },
        ]
    },
    {
        id: 'tarjetas-presentacion',
        name: 'Tarjetas de Presentación',
        category: 'Comercial',
        badge: 'Acabado Pro',
        desc: 'Cartulina couché 300g con esquinas rectas o redondeadas y laminado.',
        quantities: [100, 250, 500, 1000],
        unitLabel: 'unidades',
        basePrice: 12.00,
        pricePerExtraUnit: 0.03,
        eta: '48 horas',
        finishes: [
            { id: 'brillante', name: 'Brillo UV total', multiplier: 1.0 },
            { id: 'mate', name: 'Laminado Mate Elegante', multiplier: 1.15 },
            { id: 'soft-touch', name: 'Soft Touch Velvet + UV Sectorizado', multiplier: 1.40 },
        ]
    },
    {
        id: 'talonarios-recibos',
        name: 'Recibos & Comprobantes Comerciales',
        category: 'SRI',
        badge: 'Uso Interno',
        desc: 'Talonarios para cobros, abonos, ingresos, egresos y control de caja.',
        quantities: [100, 200, 500, 1000],
        unitLabel: 'hojas/juegos',
        basePrice: 9.00,
        pricePerExtraUnit: 0.045,
        eta: '24 horas',
        finishes: [
            { id: 'simple-bond', name: 'Bond 75g estándar', multiplier: 0.9 },
            { id: 'quimico-copia', name: 'Químico autocopiativo', multiplier: 1.0 },
        ]
    },
    {
        id: 'sellos-automaticos',
        name: 'Sellos Automáticos Láser',
        category: 'Sellos',
        badge: 'Mismo Día',
        desc: 'Aparato Trodat / Shiny con almohadilla de tinta recargable y grabado láser HD.',
        quantities: [1, 2, 3, 5],
        unitLabel: 'sellos',
        basePrice: 14.00,
        pricePerExtraUnit: 11.00,
        eta: 'Mismo día (2 horas)',
        finishes: [
            { id: 'negro', name: 'Tinta Negra Estándar', multiplier: 1.0 },
            { id: 'azul', name: 'Tinta Azul Notarial', multiplier: 1.0 },
            { id: 'rojo', name: 'Tinta Roja Urgente / Cancelado', multiplier: 1.0 },
        ]
    },
    {
        id: 'gigantografia',
        name: 'Gigantografía & Lonas HD',
        category: 'Gran Formato',
        badge: '1440 DPI',
        desc: 'Lona eco-solvente de 13oz con ojalillos perimetrales para exteriores.',
        quantities: [1, 2, 4, 8],
        unitLabel: 'metros²',
        basePrice: 10.00,
        pricePerExtraUnit: 7.50,
        eta: '24 horas',
        finishes: [
            { id: 'lona-ojales', name: 'Lona front 13oz con ojalillos', multiplier: 1.0 },
            { id: 'lona-tubos', name: 'Lona con tubos para colgar', multiplier: 1.18 },
            { id: 'adhesivo-hd', name: 'Vinil adhesivo brillante', multiplier: 1.25 },
        ]
    }
];

export const CotizadorRapido: React.FC = () => {
    const [selectedProductId, setSelectedProductId] = useState<string>('facturas-sri');
    const product = useMemo(() => PRODUCTS.find(p => p.id === selectedProductId) || PRODUCTS[0], [selectedProductId]);
    
    const [quantity, setQuantity] = useState<number>(product.quantities[0]);
    const [finishId, setFinishId] = useState<string>(product.finishes[0].id);

    // Actualizar cantidad y acabado cuando cambia de producto
    const handleProductChange = (prodId: string) => {
        const nextProd = PRODUCTS.find(p => p.id === prodId) || PRODUCTS[0];
        setSelectedProductId(prodId);
        setQuantity(nextProd.quantities[0]);
        setFinishId(nextProd.finishes[0].id);
    };

    const finish = useMemo(() => product.finishes.find(f => f.id === finishId) || product.finishes[0], [product, finishId]);

    // Cálculo dinámico de precio
    const estimatedPrice = useMemo(() => {
        let base = product.basePrice;
        if (product.id === 'sellos-automaticos') {
            base = product.basePrice + (quantity - 1) * product.pricePerExtraUnit;
        } else if (product.id === 'gigantografia') {
            base = quantity * product.basePrice * (quantity >= 4 ? 0.85 : 1.0);
        } else {
            // Talonarios y tarjetas
            const extraUnits = Math.max(0, quantity - product.quantities[0]);
            base = product.basePrice + (extraUnits * product.pricePerExtraUnit);
            // Descuento por volumen
            if (quantity >= 1000) base *= 0.88;
            else if (quantity >= 500) base *= 0.92;
        }
        return Math.max(product.basePrice, base * finish.multiplier);
    }, [product, quantity, finish]);

    const whatsappMessage = `Hola Imprenta Córdova, coticé en su página web y deseo encargar:
• Producto: ${product.name} (${product.badge})
• Cantidad: ${quantity} ${product.unitLabel}
• Acabado: ${finish.name}
• Tiempo estimado: ${product.eta}
• Presupuesto aprox: $${estimatedPrice.toFixed(2)}

¿Me pueden ayudar con el diseño y la orden? Mi RUC o datos son:`;

    const whatsappUrl = generateWhatsAppLink('593993083943', whatsappMessage);

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-paper to-paper rounded-3xl border border-hairline shadow-2xl p-6 md:p-10">
            {/* Elemento de iluminación decorativa */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-gold/20 via-royal/10 to-transparent blur-3xl pointer-events-none" />

            {/* Cabecera del Cotizador */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-hairline">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-xs font-bold text-gold-ink uppercase tracking-widest mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-gold-deep animate-spin" style={{ animationDuration: '6s' }} />
                        Cotizador Rápido en Vivo
                    </div>
                    <h3 className="font-heading text-2xl md:text-3xl font-bold text-ink tracking-tight">
                        Calcula tu inversión en <span className="text-brand-blue">3 clics</span>
                    </h3>
                    <p className="text-sm text-muted mt-1">
                        Selecciona el tipo de trabajo, la cantidad deseada y recíbelo con prueba digital incluida.
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-success/5 border border-success/25 rounded-2xl text-success text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-success-dot animate-ping" />
                    <span>Diseño & Diagramación Gratis</span>
                </div>
            </div>

            {/* Paso 1: Selector de Producto en Carrusel / Chips */}
            <div className="mt-7">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-3">
                    1. Selecciona el Tipo de Trabajo:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {PRODUCTS.map(p => {
                        const isSelected = p.id === selectedProductId;
                        return (
                            <button
                                key={p.id}
                                onClick={() => handleProductChange(p.id)}
                                className={`relative p-3 rounded-2xl text-left transition-all duration-300 flex flex-col justify-between min-h-[92px] ${
                                    isSelected
                                        ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30 scale-[1.02] ring-2 ring-brand-blue/40'
                                        : 'bg-white hover:bg-soft text-body border border-hairline shadow-sm'
                                }`}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="activeProductPill"
                                        className="absolute inset-0 bg-brand-blue rounded-2xl -z-10"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md w-max ${
                                    isSelected ? 'bg-gold text-ink' : 'bg-soft text-muted'
                                }`}>
                                    {p.badge}
                                </span>
                                <span className="font-heading font-bold text-xs leading-tight mt-1 line-clamp-2">
                                    {p.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Paso 2 y 3: Cantidad y Acabado */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cantidad */}
                <div className="bg-white/80 p-5 rounded-2xl border border-hairline shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-body flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-brand-blue" />
                            2. Cantidad requerida:
                        </label>
                        <span className="text-xs font-mono font-bold text-brand-blue bg-paper px-2 py-0.5 rounded-lg border border-hairline">
                            {quantity} {product.unitLabel}
                        </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {product.quantities.map(q => {
                            const isQtySelected = q === quantity;
                            return (
                                <button
                                    key={q}
                                    onClick={() => setQuantity(q)}
                                    className={`py-3 px-2 rounded-xl text-center font-mono font-bold text-sm transition-all duration-200 ${
                                        isQtySelected
                                            ? 'bg-ink text-gold shadow-md ring-2 ring-ink'
                                            : 'bg-paper hover:bg-soft text-body border border-hairline'
                                    }`}
                                >
                                    {q}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[11px] text-faint mt-2.5">
                        {product.id === 'facturas-sri' && quantity >= 500
                            ? '⭐ Descuento especial por volumen aplicado a partir de 500 juegos.'
                            : 'Numeración secuencial exacta sin saltos.'}
                    </p>
                </div>

                {/* Acabado */}
                <div className="bg-white/80 p-5 rounded-2xl border border-hairline shadow-sm">
                    <label className="block text-xs font-bold uppercase tracking-wider text-body mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-gold-deep" />
                        3. Especificación o acabado:
                    </label>

                    <div className="flex flex-col gap-2">
                        {product.finishes.map(f => {
                            const isFinishSelected = f.id === finishId;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setFinishId(f.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl text-left text-xs font-medium transition-all ${
                                        isFinishSelected
                                            ? 'bg-paper border-2 border-brand-blue text-brand-blue font-bold shadow-sm'
                                            : 'bg-paper hover:bg-soft border border-hairline text-body'
                                    }`}
                                >
                                    <span>{f.name}</span>
                                    {isFinishSelected ? (
                                        <Check className="w-4 h-4 text-brand-blue" />
                                    ) : (
                                        <span className="w-3.5 h-3.5 rounded-full border border-hairline-strong" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tarjeta de Resumen y Acción de WhatsApp */}
            <motion.div
                layout
                className="mt-8 bg-ink text-white rounded-2xl p-6 md:p-7 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6"
            >
                <div className="flex-1 w-full text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                        <span className="text-xs uppercase font-mono tracking-widest text-gold font-bold bg-gold/10 px-2.5 py-1 rounded-md border border-gold/20">
                            Presupuesto Aproximado
                        </span>
                        <span className="flex items-center gap-1 text-xs text-onink">
                            <Clock className="w-3.5 h-3.5 text-royal" />
                            Entrega: <strong className="text-white">{product.eta}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-onink">
                            <ShieldCheck className="w-3.5 h-3.5 text-onink-success" />
                            Garantía de Impresión
                        </span>
                    </div>

                    <div className="mt-3 flex items-baseline justify-center lg:justify-start gap-2">
                        <span className="text-sm font-semibold text-faint">Desde aprox.</span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={estimatedPrice}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="font-heading font-extrabold text-4xl md:text-5xl text-gold"
                            >
                                ${estimatedPrice.toFixed(2)}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-xs text-faint">USD</span>
                    </div>
                    <p className="text-xs text-faint mt-1.5 max-w-lg">
                        Incluye diagramación, prueba digital para aprobación en tu teléfono y retiro en taller o entrega en Machala.
                    </p>
                </div>

                <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
                    <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-success-dot hover:bg-success text-white font-bold text-sm rounded-xl shadow-lg shadow-success-dot/30 transition-colors"
                    >
                        <WhatsAppIcon className="w-5 h-5" />
                        <span>Confirmar y Pedir por WhatsApp</span>
                        <ArrowRight className="w-4 h-4" />
                    </motion.a>
                </div>
            </motion.div>
        </div>
    );
};
