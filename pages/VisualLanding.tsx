import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import { RucValidatorWidget } from '../components/public/RucValidatorWidget';
import { CotizadorRapido } from '../components/public/CotizadorRapido';
import {
    WhatsAppIcon, Sparkles, Check, ArrowRight, Clock,
    Phone,
} from '../components/Icons';

const WA = (msg: string) => generateWhatsAppLink('593993083943', msg);
const IMG = (n: string) => `/images/landing/${n}`;

const TICKER = [
    '⭐ SRI Establecimiento Gráfico N° 001-001',
    '⚡ Entrega Estándar en 24 Horas',
    '🎨 Diseño & Diagramación Incluidos',
    '🚚 Envíos a todo El Oro (Pasaje, Santa Rosa, Huaquillas)',
    '📍 Taller en Machala: Av. Las Palmeras y Calle 4ta',
];

const FACTS = [
    { value: '2 400+', label: 'Trabajos Entregados', desc: 'Comprobantes y papelería' },
    { value: '24 h', label: 'Entrega Estándar', desc: 'Récord en trabajos SRI' },
    { value: '800+', label: 'Empresas Atendidas', desc: 'Pymes y profesionales' },
    { value: '99 %', label: 'Entregas a Tiempo', desc: 'Compromiso de puntualidad' },
];

type Item = {
    cat: string;
    img: string;
    tag: string;
    label: string;
    desc: string;
    eta: string;
    highlight?: boolean;
    specs: string[];
};

const ITEMS: Item[] = [
    {
        cat: 'SRI',
        img: 'talonarios.png',
        tag: 'SRI Autorizado',
        label: 'Facturas Impresas Autocopiativas',
        desc: 'Para Régimen General y RIMPE Emprendedor. Numeración secuencial exacta en papel químico autocopiativo sin papel carbón.',
        eta: '24 h',
        highlight: true,
        specs: ['100 juegos por block', 'Original + 1 o 2 copias', 'Validación previa SRI']
    },
    {
        cat: 'SRI',
        img: 'talonarios.png',
        tag: 'RIMPE Popular',
        label: 'Notas de Venta Simplificadas',
        desc: 'Formato reglamentario aprobado para contribuyentes RIMPE Negocio Popular sin desglose de IVA.',
        eta: '24 h',
        highlight: true,
        specs: ['100 notas por block', 'Papel químico o bond', 'Entrega exprés']
    },
    {
        cat: 'SRI',
        img: 'printer_gold.png',
        tag: 'Autocopiativo',
        label: 'Guías de Remisión & Retenciones',
        desc: 'Comprobantes para traslado de mercaderías y retenciones autorizadas bajo estricta normativa del SRI.',
        eta: '24–48 h',
        specs: ['Secuencia garantizada', 'Copias personalizadas', 'Encuadernación cosida']
    },
    {
        cat: 'Comercial',
        img: 'business_cards.png',
        tag: 'Offset Pro',
        label: 'Tarjetas de Presentación Ejecutivas',
        desc: 'Cartulina couché 300g con laminado Soft Touch aterciopelado o brillo UV selectivo para causar una primera impresión imborrable.',
        eta: '48 h',
        specs: ['Couché pesado 300g', 'Laminado mate o brillante', 'Corte de precisión']
    },
    {
        cat: 'Comercial',
        img: 'branding.png',
        tag: 'Identidad Corporativa',
        label: 'Carpetas & Hojas Membretadas',
        desc: 'Papelería corporativa institucional: carpetas con bolsillo troquelado, sobres membretados y hojas bond 90g con impresión nítida.',
        eta: '48–72 h',
        specs: ['Bolsillo porta tarjetas', 'Colores pantone fieles', 'Acabado institucional']
    },
    {
        cat: 'Gran formato',
        img: 'gigantografia.png',
        tag: '1440 DPI',
        label: 'Gigantografía & Lonas Exteriores',
        desc: 'Impresión eco-solvente resistente a la intemperie y rayos UV para letreros, vallas, rótulos comerciales y banners tipo araña.',
        eta: '24 h',
        specs: ['Lona front 13oz', 'Ojalillos metálicos reforzados', 'Colores de alto impacto']
    },
    {
        cat: 'Sellos',
        img: 'printer_gold.png',
        tag: 'Mismo Día',
        label: 'Sellos Automáticos Láser',
        desc: 'Aparatos Trodat y Shiny con caucho polímero grabado en láser de alta definición para médicos, abogados, contadores y comercios.',
        eta: 'Mismo día (2h)',
        specs: ['Tinta recargable', 'Miles de impresiones limpias', 'Entrega ultra rápida']
    }
];

const CATS = ['Todo', 'SRI', 'Comercial', 'Sellos', 'Gran formato'];

const FINISHES = [
    {
        id: 'quimico',
        name: 'Papel Químico Autocopiativo',
        tag: 'Especialidad SRI',
        desc: 'Transferencia instantánea del trazo sin papel carbón sucio. Original blanco para el cliente, copia amarilla para contabilidad y copia rosa para emisor.',
        layers: ['Original Blanco (Emisor)', 'Copia 1 Amarilla (Cliente)', 'Copia 2 Rosa (Archivo)'],
        swatch: 'linear-gradient(135deg, #FFFDF2 0%, #FFF3C4 50%, #FFE0E6 100%)',
        accent: '#D97706'
    },
    {
        id: 'seda',
        name: 'Laminado Soft Touch Velvet',
        tag: 'Textura Sedosa',
        desc: 'Recubrimiento mate con acabado de piel de melocotón antirrayaduras. Confiere máxima elegancia y distinción a tarjetas corporativas y carpetas ejecutivas.',
        layers: ['Base Couché 300g', 'Polímero Soft Touch Mate', 'Refuerzo Antirrayaduras'],
        swatch: 'linear-gradient(135deg, #111A52 0%, #0A1140 60%, #1B2A70 100%)',
        accent: '#3B82F6'
    },
    {
        id: 'uv',
        name: 'Brillo UV Sectorizado',
        tag: 'Contraste Alto',
        desc: 'Barniz brillante de alto relieve aplicado estratégicamente sobre tu logotipo, nombre o isotipo, destacando sobre un fondo mate sobrio.',
        layers: ['Base Mate Fondo', 'Barniz UV Brillante Localizado', 'Relieve Táctil'],
        swatch: 'linear-gradient(135deg, #E9EEFB 0%, #C9D3F0 55%, #16309B 100%)',
        accent: '#8B5CF6'
    },
    {
        id: 'sello',
        name: 'Grabado Láser Micrométrico',
        tag: 'Nitidez Absoluta',
        desc: 'Fabricación de sellos mediante haz láser concentrado que esculpe trazos diminutos, líneas legales, firmas escaneadas y logotipos corporativos sin deformación.',
        layers: ['Caucho Polímero Láser', 'Almohadilla de Alta Densidad', 'Mecanismo Retráctil'],
        swatch: 'linear-gradient(135deg, #2A2F45 0%, #4A5470 55%, #DC2626 100%)',
        accent: '#EF4444'
    },
];

const SRI_POINTS = [
    {
        title: 'Validación en el Padrón SRI Oficial',
        detail: 'Revisamos estado del contribuyente, régimen tributario (RIMPE o General) y puntos de emisión autorizados antes de mandar a prensa.'
    },
    {
        title: 'Secuencia Correlativa Blindada',
        detail: 'Cero saltos de numeración ni duplicados. Tu pie de imprenta cumple estrictamente la Resolución del SRI vigente.'
    },
    {
        title: 'Prueba Digital Previa por WhatsApp',
        detail: 'Te enviamos el arte diagramado a tu teléfono para que revises y apruebes cada detalle con tranquilidad antes de imprimir.'
    },
    {
        title: 'Archivo Seguro para Reordenes Inmediatas',
        detail: 'Guardamos tus artes y numeraciones en nuestro sistema interno para que tu próxima reimpresión salga en minutos con un mensaje.'
    },
];

const TRACK_STEPS = [
    { label: 'Orden registrada en sistema', time: 'Paso 1', done: true },
    { label: 'RUC & numeración validada en SRI', time: 'Paso 2', done: true },
    { label: 'Prueba digital aprobada por WhatsApp', time: 'Paso 3', done: true },
    { label: 'En Prensa Offset & Tipográfica', time: 'Paso 4 (Ahora)', current: true },
    { label: 'Guillotinado & empaque protector', time: 'Paso 5' },
    { label: 'Listo para retiro en taller o despacho', time: 'Paso 6' },
];

export const VisualLanding: React.FC = () => {
    const [filter, setFilter] = useState('Todo');
    const [finishId, setFinishId] = useState('quimico');
    const [trackingInput, setTrackingInput] = useState('');
    const navigate = useNavigate();

    const items = useMemo(() => ITEMS.filter(i => filter === 'Todo' || i.cat === filter), [filter]);
    const fin = FINISHES.find(f => f.id === finishId) || FINISHES[0];

    const buscarOrden = (e: React.FormEvent) => {
        e.preventDefault();
        const q = trackingInput.trim();
        navigate(q ? `/tracking?q=${encodeURIComponent(q)}` : '/tracking');
    };

    return (
        <div className="bg-paper text-body font-sans selection:bg-gold selection:text-ink overflow-x-hidden">
            <SEO
                title="Imprenta Córdova · Impresión SRI Autorizada en Machala"
                description="Establecimiento gráfico autorizado por el SRI N° 001-001 en Machala. Facturas, notas de venta, talonarios autocopiativos, sellos y tarjetas. Entrega en 24h."
            />

            {/* ── Marquee Ticker Superior ─────────────────────────────── */}
            <div className="bg-ink text-onink overflow-hidden py-2.5 border-b border-white/10">
                <div className="flex whitespace-nowrap animate-marquee">
                    {[...TICKER, ...TICKER].map((t, idx) => (
                        <span key={idx} className="flex-shrink-0 px-6 text-xs font-semibold tracking-wider uppercase text-onink">
                            {t}
                        </span>
                    ))}
                </div>
            </div>

            <PublicNavbar />

            {/* ── Hero Bento 3D Section con Framer Motion ─────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-b from-paper via-paper to-white pt-10 sm:pt-16 pb-20 border-b border-hairline">
                {/* Auras de luz ambiental */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-royal/25 via-gold/20 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header Central con Framer Motion */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 280, damping: 24 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        {/* Badge Oficial */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white border border-hairline-strong/80 rounded-full shadow-sm text-xs font-bold text-ink mb-6">
                            <span className="font-mono text-royal font-extrabold">SRI 001-001</span>
                            <span className="w-1 h-3 bg-hairline-strong rounded-full" />
                            <span>Establecimiento Gráfico Autorizado en Machala</span>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-dot opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-success-dot" />
                            </span>
                        </div>

                        {/* Titular Impactante */}
                        <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-ink leading-[1.05]">
                            Impresión seria para negocios que{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-royal via-royal to-gold-deep">
                                no improvisan.
                            </span>
                        </h1>

                        <p className="mt-6 text-lg sm:text-xl text-body max-w-2xl mx-auto leading-relaxed">
                            Facturas, notas de venta, talonarios autocopiativos y sellos con validez legal. Diseño incluido, prueba digital por WhatsApp y entrega garantizada en 24 horas.
                        </p>

                        {/* Botones de Acción */}
                        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                            <motion.a
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                href={WA('Hola Imprenta Córdova, quiero cotizar la impresión de mis documentos autorizados. Mi RUC es:')}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-royal hover:bg-royal-dark text-white font-bold text-sm rounded-2xl shadow-xl shadow-royal/30 transition-colors"
                            >
                                <WhatsAppIcon className="w-5 h-5 text-onink-success" />
                                <span>Enviar mi RUC por WhatsApp</span>
                                <ArrowRight className="w-4 h-4" />
                            </motion.a>

                            <motion.a
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                href="#cotizador"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-white hover:bg-paper text-ink font-bold text-sm rounded-2xl border border-hairline-strong/80 shadow-sm transition-colors"
                            >
                                <Sparkles className="w-4 h-4 text-gold-deep" />
                                <span>Calcular Presupuesto en Vivo</span>
                            </motion.a>
                        </div>
                    </motion.div>

                    {/* Bento Showcase 3D con Micro-Interacciones */}
                    <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        {/* Tarjeta Izquierda: Tarjetas Ejecutivas */}
                        <motion.div
                            whileHover={{ y: -8, scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="bg-white rounded-3xl border border-hairline/90 shadow-xl overflow-hidden group cursor-pointer"
                        >
                            <div className="h-56 relative overflow-hidden bg-soft">
                                <img
                                    src={IMG('business_cards.png')}
                                    alt="Tarjetas de presentación"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <span className="absolute top-3 left-3 bg-ink/85 backdrop-blur-md text-gold font-mono text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border border-white/15">
                                    Couché 300g Soft Touch
                                </span>
                            </div>
                            <div className="p-5">
                                <h3 className="font-heading font-bold text-lg text-ink">
                                    Tarjetas de Presentación
                                </h3>
                                <p className="text-xs text-muted mt-1">
                                    Laminado mate aterciopelado o brillo UV selectivo para causar una presencia impecable.
                                </p>
                            </div>
                        </motion.div>

                        {/* Tarjeta Central Elevada: Talonarios SRI (Hero Card) */}
                        <motion.div
                            whileHover={{ y: -10, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="bg-gradient-to-b from-white to-paper rounded-3xl border-2 border-royal shadow-2xl overflow-hidden relative group cursor-pointer"
                        >
                            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-gold text-ink rounded-full font-black text-xs uppercase tracking-wider shadow-md">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Más Pedido</span>
                            </div>

                            <div className="h-72 relative overflow-hidden bg-paper">
                                <img
                                    src={IMG('talonarios.png')}
                                    alt="Talonarios autocopiativos"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs uppercase font-bold text-royal bg-tint/70 px-2.5 py-0.5 rounded-md">
                                        SRI 001-001
                                    </span>
                                    <span className="text-xs text-muted">Entrega en 24h</span>
                                </div>
                                <h3 className="font-heading font-extrabold text-2xl text-ink">
                                    Talonarios Autocopiativos
                                </h3>
                                <p className="text-sm text-body mt-1.5">
                                    Facturas y notas de venta en papel químico de copia nítida (original + copias). Numeración exacta aprobada por el SRI.
                                </p>
                            </div>
                        </motion.div>

                        {/* Tarjeta Derecha: Gigantografía HD */}
                        <motion.div
                            whileHover={{ y: -8, scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="bg-white rounded-3xl border border-hairline/90 shadow-xl overflow-hidden group cursor-pointer"
                        >
                            <div className="h-56 relative overflow-hidden bg-soft">
                                <img
                                    src={IMG('gigantografia.png')}
                                    alt="Gigantografía HD"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <span className="absolute top-3 left-3 bg-ink/85 backdrop-blur-md text-onink-success font-mono text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border border-white/15">
                                    1440 DPI Exterior
                                </span>
                            </div>
                            <div className="p-5">
                                <h3 className="font-heading font-bold text-lg text-ink">
                                    Gigantografía & Lonas HD
                                </h3>
                                <p className="text-xs text-muted mt-1">
                                    Lona pesada eco-solvente de 13oz con ojalillos perimetrales para rótulos y letreros duraderos.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Cifras & Credenciales ───────────────────────────────── */}
            <section className="bg-white border-b border-hairline py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                        {FACTS.map((f, i) => (
                            <motion.div
                                key={f.label}
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center sm:text-left border-l-2 border-royal/30 pl-4"
                            >
                                <span className="font-heading font-black text-3xl sm:text-4xl text-royal tracking-tight">
                                    {f.value}
                                </span>
                                <h4 className="font-bold text-sm text-ink mt-1">
                                    {f.label}
                                </h4>
                                <p className="text-xs text-muted mt-0.5">
                                    {f.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Cotizador en Vivo (NUEVO) ───────────────────────────── */}
            <section id="cotizador" className="py-16 sm:py-24 bg-paper/70 border-b border-hairline">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <CotizadorRapido />
                </div>
            </section>

            {/* ── Catálogo con Filtros Animados con Framer Motion ──────── */}
            <section id="catalogo" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <span className="text-xs uppercase font-extrabold tracking-widest text-royal">
                            Catálogo Completo
                        </span>
                        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mt-2">
                            Todo lo que imprimimos en nuestro taller.
                        </h2>
                    </div>

                    {/* Chips de Categorías con Pill Deslizante Framer Motion */}
                    <div className="flex gap-2 flex-wrap bg-soft p-1.5 rounded-2xl border border-hairline">
                        {CATS.map(c => {
                            const isSelected = filter === c;
                            return (
                                <button
                                    key={c}
                                    onClick={() => setFilter(c)}
                                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                        isSelected ? 'text-white' : 'text-body hover:text-ink'
                                    }`}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="catalogFilterPill"
                                            className="absolute inset-0 bg-royal rounded-xl shadow-md shadow-royal/30"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10">{c}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Grid de Productos con AnimatePresence */}
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {items.map(it => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                key={it.label}
                                className="bg-white rounded-3xl border border-hairline overflow-hidden shadow-sm hover:shadow-xl transition-shadow flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="h-52 relative overflow-hidden bg-soft">
                                        <img
                                            src={IMG(it.img)}
                                            alt={it.label}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full font-bold text-xs text-royal shadow-sm">
                                            {it.tag}
                                        </span>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="font-heading font-bold text-xl text-ink">
                                            {it.label}
                                        </h3>
                                        <p className="text-xs text-muted mt-2 leading-relaxed">
                                            {it.desc}
                                        </p>

                                        {/* Specs rápidas */}
                                        <div className="mt-4 flex flex-col gap-1.5">
                                            {it.specs.map((sp, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-[11px] text-body">
                                                    <Check className="w-3.5 h-3.5 text-success flex-shrink-0" />
                                                    <span>{sp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 pt-0 mt-2">
                                    <div className="pt-4 border-t border-hairline flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-gold-deep" />
                                            Entrega: {it.eta}
                                        </span>
                                        <a
                                            href={WA(`Hola Imprenta Córdova, quiero cotizar: ${it.label}.`)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-royal hover:text-royal-dark transition-colors"
                                        >
                                            <span>Cotizar</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            key="ver-catalogo-completo"
                            className="rounded-3xl border-2 border-dashed border-royal/30 bg-royal/5 flex flex-col items-center justify-center text-center p-8 min-h-[22rem]"
                        >
                            <span className="text-xs uppercase font-extrabold tracking-widest text-royal">
                                Catálogo completo
                            </span>
                            <h3 className="font-heading font-bold text-xl text-ink mt-3">
                                ¿Buscás otro formato?
                            </h3>
                            <p className="text-xs text-muted mt-2 leading-relaxed max-w-[16rem]">
                                Vé el catálogo completo con precios, mínimos y filtros por tiempo de entrega.
                            </p>
                            <Link
                                to="/vitrina"
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-royal hover:bg-royal-dark transition-colors px-5 py-2.5 rounded-xl mt-5"
                            >
                                <span>Ver catálogo completo</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </section>

            {/* ── Documentos SRI & Validador RUC Oficial ──────────────── */}
            <section id="sri" className="bg-ink text-white py-20 relative overflow-hidden">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-royal/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Explicación de Garantías SRI */}
                        <div>
                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                                Garantía Gráfica SRI N° 001-001
                            </span>
                            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-4 leading-tight">
                                Tu numeración autorizada, revisada antes de prensa.
                            </h2>
                            <p className="mt-4 text-base text-onink leading-relaxed">
                                Validamos régimen, estado del contribuyente y secuencia autorizada en el padrón del SRI. Si algo no cuadra con el reglamento, te avisamos de inmediato antes de imprimir para evitar multas.
                            </p>

                            <div className="mt-8 space-y-4">
                                {SRI_POINTS.map((p, idx) => (
                                    <div key={idx} className="flex gap-3.5 items-start">
                                        <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold flex-shrink-0 mt-0.5">
                                            ✓
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-white">{p.title}</h4>
                                            <p className="text-xs text-faint mt-0.5 leading-relaxed">{p.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Widget de Validación con Framer Motion */}
                        <div>
                            <RucValidatorWidget />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Muestrario Háptico de Acabados ─────────────────────── */}
            <section id="acabados" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-xl mb-12">
                    <span className="text-xs uppercase font-extrabold tracking-widest text-royal">
                        Muestrario Háptico
                    </span>
                    <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mt-2">
                        Papel, gramaje y tacto elegidos a mano.
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Botones de Selección */}
                    <div className="lg:col-span-5 space-y-2.5">
                        {FINISHES.map(f => {
                            const isSelected = finishId === f.id;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setFinishId(f.id)}
                                    className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between border ${
                                        isSelected
                                            ? 'bg-tint border-royal shadow-md'
                                            : 'bg-white hover:bg-paper border-hairline'
                                    }`}
                                >
                                    <div>
                                        <span className="font-heading font-bold text-sm text-ink block">
                                            {f.name}
                                        </span>
                                        <span className="text-[11px] font-semibold text-muted block mt-0.5">
                                            {f.tag}
                                        </span>
                                    </div>
                                    <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-royal' : 'text-faint'}`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Visor de Acabado con Framer Motion */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={fin.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                className="bg-white rounded-3xl border border-hairline overflow-hidden shadow-xl"
                            >
                                <div
                                    className="h-64 relative flex items-center justify-center p-6"
                                    style={{ background: fin.swatch }}
                                >
                                    <div className="bg-ink/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-white max-w-sm text-center shadow-2xl">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-gold font-bold block mb-1">
                                            Capas del Material
                                        </span>
                                        <div className="flex flex-col gap-1 text-xs font-semibold">
                                            {fin.layers.map((l, i) => (
                                                <div key={i} className="flex items-center justify-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                                                    <span>{l}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <span className="text-xs uppercase font-mono font-bold tracking-wider text-royal">
                                        {fin.tag}
                                    </span>
                                    <h3 className="font-heading font-extrabold text-2xl text-ink mt-1">
                                        {fin.name}
                                    </h3>
                                    <p className="text-sm text-body mt-2.5 leading-relaxed">
                                        {fin.desc}
                                    </p>

                                    <div className="mt-6 pt-5 border-t border-hairline flex items-center justify-between flex-wrap gap-4">
                                        <a
                                            href={WA(`Hola Imprenta Córdova, deseo solicitar una muestra física en el taller de: ${fin.name}.`)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink hover:bg-royal text-white text-xs font-bold rounded-xl shadow-md transition-all"
                                        >
                                            <span>Pedir Muestra Física en Taller</span>
                                            <ArrowRight className="w-3.5 h-3.5 text-gold" />
                                        </a>
                                        <span className="text-xs text-faint">
                                            📍 Av. Las Palmeras y Calle 4ta
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            {/* ── Rastreo de Pedidos Interactivo ──────────────────────── */}
            <section id="rastreo" className="py-20 bg-paper border-y border-hairline">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-5">
                            <span className="text-xs uppercase font-extrabold tracking-widest text-royal">
                                Transparencia Total
                            </span>
                            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mt-2">
                                Rastrea tu trabajo en tiempo real.
                            </h2>
                            <p className="mt-3 text-sm text-body leading-relaxed">
                                Ingresa el número de orden que te enviamos por WhatsApp (ej: ORD-4821) para verificar en qué máquina o fase de acabado se encuentra tu pedido.
                            </p>

                            <form onSubmit={buscarOrden} className="mt-6 flex gap-2">
                                <input
                                    value={trackingInput}
                                    onChange={e => setTrackingInput(e.target.value)}
                                    placeholder="Ej: ORD-4821"
                                    className="flex-1 px-4 py-3 bg-white border border-hairline-strong rounded-xl font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-royal"
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-royal hover:bg-royal-dark text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
                                >
                                    Buscar
                                </button>
                            </form>
                        </div>

                        {/* Stepper de Demostración */}
                        <div className="lg:col-span-7 bg-white p-7 rounded-3xl border border-hairline shadow-xl">
                            <div className="flex items-center justify-between pb-4 border-b border-hairline mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-sm text-ink">ORD-4821</span>
                                    <span className="text-xs text-faint">· 5 Talonarios SRI</span>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-gold-hover/10 border border-gold-hover/20 text-gold-ink text-xs font-bold flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-gold-hover animate-pulse" />
                                    En Prensa
                                </span>
                            </div>

                            <div className="space-y-3">
                                {TRACK_STEPS.map((st, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs py-1.5">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                st.done
                                                    ? 'bg-success-dot text-white'
                                                    : st.current
                                                    ? 'bg-gold text-ink ring-4 ring-gold/20'
                                                    : 'bg-soft text-faint border border-hairline-strong'
                                            }`}>
                                                {st.done ? '✓' : i + 1}
                                            </span>
                                            <span className={st.done ? 'text-ink font-semibold' : st.current ? 'text-ink font-bold' : 'text-faint'}>
                                                {st.label}
                                            </span>
                                        </div>
                                        <span className="font-mono text-faint text-[11px]">{st.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Gran CTA Final ─────────────────────────────────────── */}
            {/* Corte diagonal en el borde superior: sin esto, el salto del fondo claro
                de #rastreo a este degradado oscuro se sentía como un corte seco. */}
            <section
                className="bg-gradient-to-r from-royal via-ink to-ink text-white pt-28 pb-20 sm:pt-32 sm:pb-24 -mt-10 relative overflow-hidden"
                style={{ clipPath: 'polygon(0 40px, 100% 0, 100% 100%, 0 100%)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-gold/20 border border-gold/30 rounded-full text-xs font-mono text-gold font-bold uppercase tracking-wider mb-4">
                        <Sparkles className="w-3.5 h-3.5" />
                        Puntualidad Absoluta
                    </span>
                    <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto">
                        Tu talonario o papelería puede estar listo mañana mismo.
                    </h2>
                    <p className="mt-4 text-base text-onink max-w-xl mx-auto">
                        Visítanos en Av. Las Palmeras y Calle 4ta (Machala) o envíanos tu RUC por WhatsApp para comenzar de inmediato con tu prueba digital.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <motion.a
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            href={WA('Hola Imprenta Córdova, quiero encargar un trabajo de impresión ahora.')}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto px-8 py-4 bg-success-dot hover:bg-success text-white font-bold text-sm rounded-2xl shadow-xl shadow-success-dot/30 transition-all flex items-center justify-center gap-2.5"
                        >
                            <WhatsAppIcon className="w-5 h-5" />
                            <span>Escribir por WhatsApp</span>
                        </motion.a>
                        <a
                            href="tel:+593993083943"
                            className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                            <Phone className="w-4 h-4" />
                            <span>Llamar al Taller: +593 99 308 3943</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* ── Footer Institucional ────────────────────────────────── */}
            <footer className="bg-white border-t border-hairline py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <img src="/LOGO.png" alt="Imprenta Córdova" className="h-9 w-auto" />
                            <span className="font-heading font-extrabold text-ink text-base">
                                Imprenta Córdova
                            </span>
                        </div>
                        <p className="text-xs text-muted mt-3 leading-relaxed">
                            Establecimiento gráfico autorizado por el Servicio de Rentas Internas N° 001-001. Machala, El Oro — Ecuador.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-mono uppercase font-bold text-faint tracking-wider mb-3">
                            Productos
                        </h4>
                        <div className="flex flex-col gap-2 text-xs font-semibold text-body">
                            <Link to="/vitrina" className="hover:text-royal">Facturas Autorizadas SRI</Link>
                            <Link to="/vitrina" className="hover:text-royal">Notas de Venta RIMPE</Link>
                            <Link to="/vitrina" className="hover:text-royal">Tarjetas de Presentación</Link>
                            <Link to="/vitrina" className="hover:text-royal">Sellos Automáticos</Link>
                            <Link to="/vitrina" className="hover:text-royal">Gigantografías</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-mono uppercase font-bold text-faint tracking-wider mb-3">
                            Servicios
                        </h4>
                        <div className="flex flex-col gap-2 text-xs font-semibold text-body">
                            <Link to="/tracking" className="hover:text-royal">Rastrear Mi Pedido</Link>
                            <a href="#sri" className="hover:text-royal">Consulta de RUC en Padrón</a>
                            <a href="#cotizador" className="hover:text-royal">Cotizador en Vivo</a>
                            <Link to="/login" className="hover:text-royal">Acceso Sistema Operador</Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-mono uppercase font-bold text-faint tracking-wider mb-3">
                            Ubicación & Contacto
                        </h4>
                        <div className="flex flex-col gap-2 text-xs text-body">
                            <span>Av. Las Palmeras y Calle 4ta</span>
                            <span>Machala, El Oro</span>
                            <a href="tel:+593993083943" className="font-bold text-ink hover:text-royal">
                                +593 99 308 3943
                            </a>
                            <span className="text-faint mt-1">Lun–Vie 8:00–18:00 · Sáb 8:00–14:00</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-hairline flex items-center justify-between text-xs text-faint flex-wrap gap-2">
                    <span>© 2026 Imprenta Córdova. Todos los derechos reservados.</span>
                    <span className="font-mono">SRI Autorización 001-001</span>
                </div>
            </footer>

            {/* ── Barra Móvil Fija de Conversión ("PEPA para el móvil") ─── */}
            <div className="md:hidden h-20" />
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 bg-white/95 backdrop-blur-xl border-t border-hairline/90 shadow-2xl flex items-center gap-2">
                <a
                    href={WA('Hola Imprenta Córdova, quiero cotizar la impresión de mis documentos. Mi RUC es:')}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-royal text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-royal/30 active:scale-95 transition-transform"
                >
                    <WhatsAppIcon className="w-4 h-4 text-onink-success" />
                    <span>Enviar RUC / Cotizar</span>
                </a>

                <a
                    href="tel:+593993083943"
                    className="w-12 h-12 rounded-2xl bg-soft border border-hairline flex items-center justify-center text-ink active:scale-95 transition-transform flex-shrink-0"
                    aria-label="Llamar al taller"
                >
                    <Phone className="w-5 h-5" />
                </a>
            </div>
        </div>
    );
};

export default VisualLanding;
