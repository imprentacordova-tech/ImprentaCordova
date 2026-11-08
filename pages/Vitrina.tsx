import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import {
    WhatsAppIcon, Sparkles, ArrowRight, Clock, Search,
} from '../components/Icons';

const WA = (msg: string) => `https://wa.me/593993083943?text=${encodeURIComponent(msg)}`;
const IMG = (n: string) => `/images/landing/${n}`;

type Item = {
    cat: string;
    img: string;
    tag: string;
    label: string;
    desc: string;
    eta: string;
    fast?: boolean;
    specs: { k: string; v: string }[];
};

const ITEMS: Item[] = [
    {
        cat: 'SRI',
        img: 'talonarios.png',
        tag: 'SRI 001-001',
        label: 'Facturas Impresas Autocopiativas',
        desc: 'Para Régimen General y RIMPE Emprendedor con numeración secuencial autorizada por el SRI en papel químico de copia nítida.',
        eta: '24 h',
        fast: true,
        specs: [{ k: 'Mínimo', v: '100 juegos (1 block)' }, { k: 'Papel', v: 'Químico 2 o 3 partes' }, { k: 'Numeración', v: 'Correlativa exacta' }]
    },
    {
        cat: 'SRI',
        img: 'talonarios.png',
        tag: 'RIMPE Popular',
        label: 'Notas de Venta Simplificadas',
        desc: 'Formato simplificado aprobado para negocios populares bajo el régimen RIMPE sin desglose de tarifa IVA.',
        eta: '24 h',
        fast: true,
        specs: [{ k: 'Mínimo', v: '100 notas' }, { k: 'Papel', v: 'Químico o bond 75g' }, { k: 'Entrega', v: '24 horas garantizada' }]
    },
    {
        cat: 'SRI',
        img: 'printer_gold.png',
        tag: 'Autocopiativo',
        label: 'Guías de Remisión',
        desc: 'Comprobantes para el traslado legal de mercadería interprovincial con original y copias autocopiativas de alta legibilidad.',
        eta: '24–48 h',
        specs: [{ k: 'Mínimo', v: '50 juegos' }, { k: 'Formato', v: 'A5 / Media Carta' }, { k: 'Validez', v: 'Legal SRI' }]
    },
    {
        cat: 'SRI',
        img: 'printer_gold.png',
        tag: 'Autocopiativo',
        label: 'Comprobantes de Retención',
        desc: 'Documentos oficiales para retenciones en la fuente y de IVA bajo estricta normativa técnica del SRI.',
        eta: '24–48 h',
        specs: [{ k: 'Mínimo', v: '50 juegos' }, { k: 'Copias', v: 'Original + 2 copias' }, { k: 'Pie de imprenta', v: 'Autorizado 001-001' }]
    },
    {
        cat: 'Comercial',
        img: 'business_cards.png',
        tag: 'Offset Pro',
        label: 'Tarjetas de Presentación Ejecutivas',
        desc: 'Couché 300g con esquinas rectas o redondeadas. Laminado Soft Touch aterciopelado o brillo UV selectivo para máxima presencia.',
        eta: '48 h',
        specs: [{ k: 'Mínimo', v: '100 unidades' }, { k: 'Gramaje', v: 'Couché 300g grueso' }, { k: 'Acabados', v: 'Soft touch / UV' }]
    },
    {
        cat: 'Comercial',
        img: 'branding.png',
        tag: 'Papelería Pro',
        label: 'Carpetas & Hojas Membretadas',
        desc: 'Identidad corporativa de alto nivel: carpetas institucionales con bolsillo porta-tarjetas y hojas A4 de fibra bond 90g.',
        eta: '48–72 h',
        specs: [{ k: 'Mínimo', v: '50 unidades' }, { k: 'Papel', v: 'Bond 90g / Cartulina' }, { k: 'Bolsillo', v: 'Troquelado incluido' }]
    },
    {
        cat: 'Comercial',
        img: 'branding.png',
        tag: 'Troquel Láser',
        label: 'Etiquetas & Adhesivos en Pliego',
        desc: 'Vinil adhesivo o papel adhesivo brillante con medio corte troquelado a la medida exacta de tu envase o producto.',
        eta: '48 h',
        specs: [{ k: 'Mínimo', v: '1 pliego' }, { k: 'Material', v: 'Adhesivo brillante/mate' }, { k: 'Corte', v: 'Personalizado' }]
    },
    {
        cat: 'Sellos',
        img: 'printer_gold.png',
        tag: 'Mismo Día',
        label: 'Sellos Automáticos Láser',
        desc: 'Mecanismo Trodat / Shiny retráctil con almohadilla de tinta recargable y grabado micro-definido por láser de alta precisión.',
        eta: 'Mismo día (2h)',
        fast: true,
        specs: [{ k: 'Mínimo', v: '1 unidad' }, { k: 'Modelos', v: 'Bolsillo / Escritorio' }, { k: 'Colores', v: 'Negro, Azul, Rojo' }]
    },
    {
        cat: 'Gran formato',
        img: 'gigantografia.png',
        tag: '1440 DPI HD',
        label: 'Gigantografía & Lonas para Exterior',
        desc: 'Lona front 13oz pesada con tintas eco-solventes resistentes a lluvia y sol para letreros comerciales y banners enrollables.',
        eta: '24 h',
        fast: true,
        specs: [{ k: 'Mínimo', v: '1 metro²' }, { k: 'Material', v: 'Lona 13oz con ojalillos' }, { k: 'Resolución', v: '1440 dpi fotográfica' }]
    },
];

const CATS = ['Todo', 'SRI', 'Comercial', 'Sellos', 'Gran formato'];
const ETAS = ['Cualquiera', 'Mismo día / 24 h', '48 h o más'];

export const Vitrina: React.FC = () => {
    const [cat, setCat] = useState('Todo');
    const [eta, setEta] = useState('Cualquiera');
    const [query, setQuery] = useState('');

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        return ITEMS.filter(i => {
            if (cat !== 'Todo' && i.cat !== cat) return false;
            if (eta === 'Mismo día / 24 h' && !i.fast) return false;
            if (eta === '48 h o más' && i.fast) return false;
            if (q && !(i.label + ' ' + i.desc + ' ' + i.tag).toLowerCase().includes(q)) return false;
            return true;
        });
    }, [cat, eta, query]);

    return (
        <div className="bg-slate-50/60 min-h-screen text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950 flex flex-col justify-between">
            <SEO
                title="Catálogo & Precios · Imprenta Córdova Machala"
                description="Catálogo de impresión gráfica: facturas autorizadas SRI, notas de venta, talonarios autocopiativos, sellos, tarjetas y gigantografía en Machala."
            />
            <PublicNavbar />

            {/* Cabecera Hero */}
            <section className="bg-gradient-to-b from-blue-50/50 via-white to-slate-50/60 border-b border-slate-200/80 py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumbs */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-3"
                    >
                        <a href="/" className="hover:text-brand-blue">Inicio</a>
                        <span>/</span>
                        <span className="text-slate-700">Catálogo de Productos</span>
                    </motion.div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-blue bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200/70">
                                Establecimiento Gráfico N° 001-001
                            </span>
                            <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mt-3">
                                Catálogo & Formatos de Impresión
                            </h1>
                            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
                                Todos los trabajos incluyen diseño, diagramación y prueba digital para aprobación por WhatsApp antes de prensa.
                            </p>
                        </motion.div>

                        <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs text-slate-600 font-semibold">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>{matches.length} productos disponibles</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Layout Principal: Filtros + Grid de Productos */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Barra Lateral de Filtros (Desktop) */}
                    <aside className="lg:col-span-3 space-y-6">
                        {/* Buscador Rápido */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
                            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                                Buscar Formato
                            </label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Factura, sello, lona..."
                                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                />
                                {query && (
                                    <button
                                        onClick={() => setQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Categorías */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
                            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
                                Categoría
                            </label>
                            <div className="space-y-1">
                                {CATS.map(c => {
                                    const isSelected = cat === c;
                                    const count = c === 'Todo' ? ITEMS.length : ITEMS.filter(i => i.cat === c).length;
                                    return (
                                        <button
                                            key={c}
                                            onClick={() => setCat(c)}
                                            className={`relative w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between text-left ${
                                                isSelected
                                                    ? 'text-white'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {isSelected && (
                                                <motion.div
                                                    layoutId="activeVitrinaCat"
                                                    className="absolute inset-0 bg-brand-blue rounded-xl shadow-md shadow-brand-blue/20"
                                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                />
                                            )}
                                            <span className="relative z-10">{c}</span>
                                            <span className={`relative z-10 text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                                isSelected ? 'bg-amber-400 text-slate-950 font-extrabold' : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tiempo de Entrega */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm">
                            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
                                Tiempo de Entrega
                            </label>
                            <div className="flex flex-col gap-1.5">
                                {ETAS.map(e => {
                                    const isSelected = eta === e;
                                    return (
                                        <button
                                            key={e}
                                            onClick={() => setEta(e)}
                                            className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                                                isSelected
                                                    ? 'bg-blue-50 border border-brand-blue text-brand-blue font-bold'
                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-transparent'
                                            }`}
                                        >
                                            {e}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tarjeta de Formato a Medida */}
                        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block mb-1">
                                ¿No encuentras tu formato?
                            </span>
                            <h4 className="font-heading font-bold text-base text-white">
                                Imprimimos a Medida
                            </h4>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                                Si tienes un modelo especial, medida personalizada o necesitas pliegos específicos, te cotizamos de inmediato.
                            </p>
                            <a
                                href={WA('Hola Imprenta Córdova, tengo un trabajo con especificaciones personalizadas y deseo cotizarlo.')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
                            >
                                <WhatsAppIcon className="w-4 h-4" />
                                <span>Cotizar por WhatsApp</span>
                            </a>
                        </div>
                    </aside>

                    {/* Grid de Productos (Desktop & Mobile) */}
                    <div className="lg:col-span-9">
                        {matches.length === 0 ? (
                            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                <h3 className="font-heading font-bold text-lg text-slate-800">
                                    No se encontraron productos con esos filtros
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    Intenta buscar con otros términos o selecciona "Todo" en la categoría para ver todos los formatos.
                                </p>
                                <button
                                    onClick={() => { setCat('Todo'); setEta('Cualquiera'); setQuery(''); }}
                                    className="mt-4 px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold"
                                >
                                    Restablecer Filtros
                                </button>
                            </div>
                        ) : (
                            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {matches.map((it, idx) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 16, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            whileHover={{ y: -6 }}
                                            transition={{ type: "spring", stiffness: 350, damping: 25, delay: (idx % 6) * 0.05 }}
                                            key={it.label + it.tag}
                                            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
                                        >
                                            <div>
                                                {/* Imagen con Badge Flotante */}
                                                <div className="h-48 relative overflow-hidden bg-slate-100">
                                                    <img
                                                        src={IMG(it.img)}
                                                        alt={it.label}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-brand-blue shadow-sm">
                                                        {it.tag}
                                                    </span>
                                                </div>

                                                {/* Contenido */}
                                                <div className="p-5 sm:p-6">
                                                    <h3 className="font-heading font-bold text-lg text-slate-950 group-hover:text-brand-blue transition-colors">
                                                        {it.label}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                                        {it.desc}
                                                    </p>

                                                    {/* Especificaciones */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                                                        {it.specs.map(sp => (
                                                            <div key={sp.k} className="flex items-center justify-between text-xs">
                                                                <span className="text-slate-400">{sp.k}</span>
                                                                <span className="font-semibold text-slate-700">{sp.v}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer de Tarjeta con Acción */}
                                            <div className="p-5 sm:p-6 pt-0">
                                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                        Entrega: {it.eta}
                                                    </span>
                                                    <motion.a
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        href={WA(`Hola Imprenta Córdova, quiero cotizar: ${it.label} (${it.tag}).`)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-blue/20 transition-all"
                                                    >
                                                        <span>Cotizar</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </motion.a>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>

            {/* Banner de Muestras Físicas en Taller */}
            <section className="bg-gradient-to-r from-brand-blue via-blue-900 to-slate-950 text-white py-14 border-t border-blue-900/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                            Atención Personalizada
                        </span>
                        <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white mt-1">
                            Pide muestras físicas en nuestro taller
                        </h3>
                        <p className="text-xs sm:text-sm text-blue-100 mt-1">
                            Av. Las Palmeras y Calle 4ta · Machala · Lun–Vie 8:00–18:00 · Sáb 8:00–14:00
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <a
                            href={WA('Hola Imprenta Córdova, deseo coordinar una visita al taller para ver muestras de papel y acabados.')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
                        >
                            <WhatsAppIcon className="w-4 h-4" />
                            <span>Coordinar Muestras</span>
                        </a>
                        <a
                            href="/tracking"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                        >
                            <span>Rastrear Pedido</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                        <img src="/LOGO.png" alt="Imprenta Córdova" className="h-7 w-auto" />
                        <span>© 2026 Imprenta Córdova · SRI Autorizado 001-001 · Machala</span>
                    </div>
                    <div className="flex gap-4 font-semibold">
                        <a href="/" className="hover:text-brand-blue">Inicio</a>
                        <a href="/tracking" className="hover:text-brand-blue">Rastrear Pedido</a>
                        <a href="tel:+593993083943" className="hover:text-brand-blue">+593 99 308 3943</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Vitrina;
