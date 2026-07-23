import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    WhatsAppIcon, ShieldCheckIcon, ActivityIcon,
    SparklesIcon, CpuIcon, FileTextIcon, BoxIcon,
    CheckCircleIcon, ArrowRightIcon, ChevronDownIcon, ClockIcon, LocationIcon
} from '../components/Icons';
import { generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import { RucValidatorWidget } from '../components/public/RucValidatorWidget';
import { PreflightScanner } from '../components/public/PreflightScanner';

// ─── ANIMATED COUNTER ─────────────────────────────────────────────
const AnimatedCounter: React.FC<{ target: number; suffix?: string; duration?: number }> = ({
    target, suffix = '', duration = 2000
}) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const hasStarted = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !hasStarted.current) {
                hasStarted.current = true;
                const steps = 60;
                const increment = target / steps;
                let current = 0;
                const interval = setInterval(() => {
                    current += increment;
                    if (current >= target) { setCount(target); clearInterval(interval); }
                    else setCount(Math.floor(current));
                }, duration / steps);
            }
        }, { threshold: 0.5 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [target, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ─── INSTANT PRICE CALCULATOR CONFIG ────────────────────────────────
const QUOTE_PRODUCTS = [
    {
        id: 'facturas',
        label: 'Facturas SRI',
        unitPrice: 0.12,
        minQty: 100,
        turnaround: '24 horas',
        type: 'Comprobante Fiscal SRI'
    },
    {
        id: 'notas',
        label: 'Notas de Venta',
        unitPrice: 0.08,
        minQty: 100,
        turnaround: '24 horas',
        type: 'RIMPE Negocio Popular'
    },
    {
        id: 'talonarios',
        label: 'Talonarios Autocopiativos',
        unitPrice: 0.15,
        minQty: 50,
        turnaround: '24-48 horas',
        type: 'Original + 1/2 Copias'
    },
    {
        id: 'sellos',
        label: 'Sellos Automáticos',
        unitPrice: 12.00,
        minQty: 1,
        turnaround: 'Impresión Mismo Día',
        type: 'Caucho Trodat / Shiny'
    },
    {
        id: 'giganto',
        label: 'Gigantografía HD',
        unitPrice: 8.50,
        minQty: 1,
        turnaround: '24 horas',
        type: 'Lona Eco-Solvente Roland'
    }
];

// ─── SERVICE DATA ──────────────────────────────────────────────────
const SERVICES = [
    {
        icon: FileTextIcon,
        label: 'Facturas Impresas',
        desc: 'Autorizadas por el SRI para Régimen General y RIMPE-Emprendedor. Numeración secuencial y papel químico premium.',
        tag: 'SRI Autorizado',
        eta: '24 Horas',
        highlight: 'Diseño Incluido'
    },
    {
        icon: FileTextIcon,
        label: 'Notas de Venta',
        desc: 'Formato físico simplificado aprobado por el SRI para contribuyentes en Régimen RIMPE Negocio Popular.',
        tag: 'Negocio Popular',
        eta: '24 Horas',
        highlight: 'Validez Legal'
    },
    {
        icon: BoxIcon,
        label: 'Talonarios & Recibos',
        desc: 'Talonarios de pedidos, guías de remisión, comprobantes de retención, recibos de caja y vales con copia autocopiativa.',
        tag: 'Documentación Interna',
        eta: '24–48 Horas',
        highlight: 'Autocopiativo'
    },
    {
        icon: SparklesIcon,
        label: 'Sellos de Caucho',
        desc: 'Sellos automáticos (Trodat/Shiny) y de madera manuales para profesionales, empresas e instituciones.',
        tag: 'Alta Precisión',
        eta: 'Mismo Día',
        highlight: 'Tinta Reponible'
    },
    {
        icon: CpuIcon,
        label: 'Etiquetas & Packaging',
        desc: 'Adhesivos personalizados en hojas o papel brillante para empaques de productos, marcas de agua y envíos.',
        tag: 'Identidad Comercial',
        eta: '48 Horas',
        highlight: 'Troquel Personalizado'
    },
    {
        icon: SparklesIcon,
        label: 'Branding & Editorial',
        desc: 'Tarjetas de presentación offset tacto seda, carpetas corporativas, afiches, empastados de tesis y folletos.',
        tag: 'Atelier Gráfico',
        eta: '48–72 Horas',
        highlight: 'Acabados Lujo'
    },
];

// ─── FINISHES / MUESTRARIO ─────────────────────────────────────────
const FINISHES = [
    {
        id: 'quimico',
        name: 'Papel Químico Autocopiativo',
        tag: 'Especialidad SRI',
        desc: 'Copia instantánea sin necesidad de papel carbón. Colores nítidos (Original Blanco, Copia Amarillo/Rosa).',
        previewColor: 'from-amber-400/20 to-yellow-600/10'
    },
    {
        id: 'foil',
        name: 'Stamping Foil Dorado 3D',
        tag: 'Lujo Supremo',
        desc: 'Relieve metálico brillante en logotipos o detalles seleccionados sobre cartulina mate de alto gramaje.',
        previewColor: 'from-yellow-400/30 to-amber-700/20'
    },
    {
        id: 'seda',
        name: 'Laminado Soft Touch Tacto Seda',
        tag: 'Textura Velvet',
        desc: 'Acabado suave antirrayaduras que otorga presencia ejecutiva a tarjetas de presentación y carpetas.',
        previewColor: 'from-[#0A0F1E] to-[#12192E]'
    },
    {
        id: 'sello',
        name: 'Caucho Polímero Láser',
        tag: 'Nitidez Micrométrica',
        desc: 'Grabado micro-definido para sellos con textos pequeños, logos corporativos y firmas escaneadas.',
        previewColor: 'from-blue-600/20 to-indigo-900/20'
    }
];

// ─── TRUST POINTS ─────────────────────────────────────────────────
const TRUST = [
    { label: 'Autorización SRI', detail: 'Establecimiento de Gráficas Nº 001-001 Machala' },
    { label: 'Numeración Garantizada', detail: 'Impresión bajo normativa SRI sin margen de error' },
    { label: 'Revisión Técnica IA', detail: 'Verificación de resolución y sangrado previa' },
    { label: 'Despacho & Retiro', detail: 'Entrega en taller Machala o envío a todo El Oro' },
];

// ─── STATS ────────────────────────────────────────────────────────
const STATS = [
    { value: 2400, suffix: '+', label: 'Trabajos Entregados' },
    { value: 15,   suffix: '+', label: 'Años en Machala' },
    { value: 99,   suffix: '%', label: 'Entrega a Tiempo' },
    { value: 800,  suffix: '+', label: 'Empresas Atendidas' },
];

// ─── FAQS ─────────────────────────────────────────────────────────
const FAQS = [
    {
        q: '¿Qué documentos necesito presentar para mandar a imprimir facturas?',
        a: 'Para comprobantes SRI únicamente requerimos su número de RUC activo o copia de la autorización emitida por el SRI. Nosotros validamos la numeración y datos en el padrón oficial.'
    },
    {
        q: '¿El diseño gráfico de los talonarios o notas de venta está incluido?',
        a: '¡Sí! Todos los trabajos de imprenta autorizada o comercial incluyen la diagramación y diseño gráfico profesional sin costos adicionales.'
    },
    {
        q: '¿Cuánto tiempo tarda la confección de los talonarios autorizados?',
        a: 'El tiempo estándar de entrega es de 24 a 48 horas laborables. Si requiere un trabajo urgente, contamos con servicio express previa coordinación.'
    },
    {
        q: '¿Realizan envíos a otros cantones de la provincia de El Oro?',
        a: 'Sí, despachamos pedidos a Pasaje, Santa Rosa, Arenillas, Huaquillas, Piñas, Zaruma y todo el Ecuador a través de transporte seguro.'
    }
];

// ─── COMPONENT MAIN ───────────────────────────────────────────────
const VisualLanding: React.FC = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [selectedProduct, setSelectedProduct] = useState(QUOTE_PRODUCTS[0]);
    const [quantity, setQuantity] = useState(100);
    const [activeTerminalTab, setActiveTerminalTab] = useState<'ruc' | 'scanner'>('ruc');
    const [selectedFinish, setSelectedFinish] = useState(FINISHES[0]);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const heroRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
    const springY = useSpring(heroY, { stiffness: 80, damping: 20 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const estimatedTotal = selectedProduct.id === 'sellos' || selectedProduct.id === 'giganto'
        ? selectedProduct.unitPrice * quantity
        : Math.max(12, Math.round(selectedProduct.unitPrice * quantity));

    const staggerContainer = {
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] } },
    };

    return (
        <div className="min-h-screen bg-[#03060E] text-white font-sans selection:bg-liquid-gold/20 overflow-x-hidden relative">
            <SEO
                title="IMPRENTA CÓRDOVA | Facturas · Sellos · Talonarios SRI — Machala, El Oro"
                description="Imprenta autorizada SRI N° 001-001 en Machala. Facturas físicas, notas de venta, talonarios autocopiativos y sellos con diseño profesional incluido. Entregas en 24h."
            />

            <PublicNavbar />

            {/* ── AMBIENT BACKGROUND SYSTEM ── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Radial gold glow top right */}
                <div
                    className="absolute -top-[25%] -right-[15%] w-[1000px] h-[1000px] rounded-full opacity-60"
                    style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 65%)' }}
                />
                {/* Radial blue glow bottom left */}
                <div
                    className="absolute -bottom-[25%] -left-[15%] w-[1100px] h-[1100px] rounded-full opacity-40"
                    style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 60%)' }}
                />
                {/* Architect grid */}
                <div className="absolute inset-0 bg-architect-grid opacity-100" />
                {/* Noise */}
                <div
                    className="absolute inset-0 opacity-[0.03] animate-grain pointer-events-none"
                    style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                        backgroundRepeat: 'repeat',
                        backgroundSize: '256px 256px'
                    }}
                />
            </div>

            {/* ── CURSOR HALO ── */}
            <div
                className="fixed w-[500px] h-[500px] pointer-events-none z-[60] hidden lg:block"
                style={{
                    left: mousePosition.x - 250,
                    top: mousePosition.y - 250,
                    background: 'radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 65%)',
                    transition: 'left 0.8s cubic-bezier(0.23,1,0.32,1), top 0.8s cubic-bezier(0.23,1,0.32,1)',
                }}
            >
                <div className="absolute top-1/2 left-0 w-full h-px bg-liquid-gold/10" />
                <div className="absolute top-0 left-1/2 w-px h-full bg-liquid-gold/10" />
            </div>

            <main className="relative z-10">

                {/* ═══════════════════════════════════════════════════
                    01 — HERO ULTRALUXURY
                ═══════════════════════════════════════════════════ */}
                <header ref={heroRef} className="relative pt-36 pb-24 overflow-hidden min-h-[90vh] flex items-center">
                    <motion.div style={{ y: springY, opacity: heroOpacity }} className="w-full">
                        <div className="container mx-auto px-6 lg:px-14">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                                {/* Left Hero Copy */}
                                <motion.div
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="show"
                                    className="lg:col-span-7 space-y-8 text-left"
                                >
                                    {/* Badge */}
                                    <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-liquid-gold/10 border border-liquid-gold/25 shadow-gold-glow-soft">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-liquid-gold opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-liquid-gold" />
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-liquid-gold">
                                            Establecimiento Autorizado SRI N° 001-001
                                        </span>
                                    </motion.div>

                                    {/* Main Headline */}
                                    <motion.div variants={fadeUp} className="space-y-2">
                                        <h1 className="text-[clamp(3.2rem,7vw,6.5rem)] font-black leading-[0.88] tracking-[-0.03em] font-display">
                                            <span className="block text-white">IMPRENTA</span>
                                            <span className="block text-gold-gradient">CÓRDOVA<span className="text-white">.</span></span>
                                        </h1>
                                        <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed pt-2">
                                            Facturas físicas, notas de venta, talonarios autocopiativos y sellos con validez legal. <span className="text-champagne font-bold">Diseño incluido y entregas en 24h.</span>
                                        </p>
                                    </motion.div>

                                    {/* CTAs */}
                                    <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 pt-2">
                                        <a
                                            href={generateWhatsAppLink('593993083943', 'Hola, quiero cotizar la impresión de mis documentos.')}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn-gold shadow-gold-ultra !py-4.5 !px-8 text-[10px]"
                                        >
                                            <WhatsAppIcon className="w-4 h-4 text-slate-950" />
                                            Cotizar por WhatsApp
                                        </a>
                                        <Link to="/vitrina" className="btn-ghost !py-4.5 !px-8 text-[10px]">
                                            <BoxIcon className="w-4 h-4 text-liquid-gold/80" />
                                            Ver Catálogo
                                        </Link>
                                    </motion.div>

                                    {/* Trust micro pills */}
                                    <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-6 pt-4 text-slate-400 text-xs font-mono">
                                        <div className="flex items-center gap-2">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                                            <span>Validación SRI Instantánea</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                                            <span>Retiro en Machala o Envíos</span>
                                        </div>
                                    </motion.div>
                                </motion.div>

                                {/* Right Hero Interactive Quick Quote Ribbon */}
                                <motion.div
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="lg:col-span-5"
                                >
                                    <div className="bg-gradient-to-b from-[#0A0F1E]/95 to-[#050810]/95 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-luxury relative overflow-hidden group">
                                        {/* Ambient accent inside card */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/10 blur-2xl pointer-events-none" />

                                        <div className="space-y-6 relative z-10">
                                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center text-liquid-gold">
                                                        <SparklesIcon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-white uppercase tracking-tight font-display">Estimador Relámpago</h3>
                                                        <p className="text-[8px] font-mono text-liquid-gold/70 uppercase tracking-widest">Cotización Directa</p>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] font-mono font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                                                    Diseño Gratis
                                                </span>
                                            </div>

                                            {/* Product Select */}
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ml-1">
                                                    Seleccione Producto
                                                </label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {QUOTE_PRODUCTS.map(prod => (
                                                        <button
                                                            key={prod.id}
                                                            onClick={() => {
                                                                setSelectedProduct(prod);
                                                                setQuantity(prod.minQty);
                                                            }}
                                                            className={`p-3 rounded-xl border text-left transition-all ${
                                                                selectedProduct.id === prod.id
                                                                    ? 'bg-liquid-gold/15 border-liquid-gold text-white shadow-gold-glow-soft'
                                                                    : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                                                            }`}
                                                        >
                                                            <div className="text-[10px] font-black uppercase tracking-tight">{prod.label}</div>
                                                            <div className="text-[8px] font-mono text-slate-400 mt-0.5">{prod.type}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Quantity selector */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                                                    <span>Cantidad Requerida</span>
                                                    <span className="text-liquid-gold font-mono font-bold text-xs">{quantity} {selectedProduct.id === 'sellos' ? 'Unidades' : 'Hojas/Juegos'}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min={selectedProduct.minQty}
                                                    max={selectedProduct.id === 'sellos' ? 10 : 2000}
                                                    step={selectedProduct.id === 'sellos' ? 1 : 50}
                                                    value={quantity}
                                                    onChange={e => setQuantity(Number(e.target.value))}
                                                    className="w-full accent-liquid-gold bg-black/40 cursor-pointer h-2 rounded-lg"
                                                />
                                            </div>

                                            {/* Result Box */}
                                            <div className="bg-black/50 border border-white/10 p-4.5 rounded-2xl flex items-center justify-between">
                                                <div>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Estimado Base</span>
                                                    <div className="text-2xl font-black text-white font-mono tracking-tight">
                                                        ${estimatedTotal.toFixed(2)} <span className="text-xs font-sans text-slate-500 font-normal">+IVA</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 block">Tiempo Entrega</span>
                                                    <span className="text-xs font-bold text-slate-300">{selectedProduct.turnaround}</span>
                                                </div>
                                            </div>

                                            {/* WhatsApp action */}
                                            <a
                                                href={generateWhatsAppLink('593993083943', `Hola, me interesa cotizar ${quantity} unidades de ${selectedProduct.label} (Precio estimado: $${estimatedTotal.toFixed(2)}).`)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full py-4 bg-liquid-gold hover:bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-gold-glow flex items-center justify-center gap-3 transition-all cursor-pointer"
                                            >
                                                <WhatsAppIcon className="w-4 h-4" /> Solicitar este Trabajo
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </header>

                {/* ═══════════════════════════════════════════════════
                    02 — STATS BAR
                ═══════════════════════════════════════════════════ */}
                <section className="stats-bar py-10">
                    <div className="container mx-auto px-6 lg:px-14">
                        <div className="flex flex-wrap items-center justify-center gap-0">
                            {STATS.map((stat, idx) => (
                                <React.Fragment key={stat.label}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.1, duration: 0.6 }}
                                        className="text-center px-10 py-4"
                                    >
                                        <div className="text-3xl md:text-4xl font-black text-gold-gradient leading-none tracking-tighter">
                                            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                                        </div>
                                        <div className="text-[8px] font-black uppercase tracking-[0.35em] text-slate-500 mt-2">
                                            {stat.label}
                                        </div>
                                    </motion.div>
                                    {idx < STATS.length - 1 && <div className="stats-divider hidden md:block" />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    03 — SERVICES SPOTLIGHT GRID
                ═══════════════════════════════════════════════════ */}
                <section className="py-32 relative">
                    <div className="container mx-auto px-6 lg:px-14">
                        {/* Section header */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="text-center max-w-2xl mx-auto mb-20 space-y-4"
                        >
                            <span className="section-eyebrow">Catálogo de Impresión</span>
                            <h2 className="section-title text-white">
                                Servicios de Imprenta
                                <br />
                                <span className="text-gold-gradient">Autorizada & Comercial.</span>
                            </h2>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                                Documentación legal validada por el SRI y soluciones de diseño gráfico impreso para potenciar la marca de su negocio.
                            </p>
                        </motion.div>

                        {/* Grid */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.15 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {SERVICES.map((svc, idx) => (
                                <motion.div
                                    key={svc.label}
                                    variants={fadeUp}
                                    className="spotlight-card group p-8 relative flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center text-liquid-gold shadow-gold-glow-soft">
                                                <svc.icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-liquid-gold/70 border border-liquid-gold/20 px-3 py-1 rounded-full bg-black/40">
                                                {svc.tag}
                                            </span>
                                        </div>
                                        <div className="text-[9px] font-mono font-black uppercase tracking-[0.4em] text-slate-500 mb-2">
                                            0{idx + 1} &mdash; {svc.highlight}
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3 font-display">
                                            {svc.label}
                                        </h3>
                                        <p className="text-slate-400 text-xs leading-relaxed font-medium">
                                            {svc.desc}
                                        </p>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                                        <span className="text-[9px] font-mono text-emerald-400 font-bold">⏱️ Entrega: {svc.eta}</span>
                                        <a
                                            href={generateWhatsAppLink('593993083943', `Hola, solicito información sobre ${svc.label}.`)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-liquid-gold hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest"
                                        >
                                            <span>Cotizar</span>
                                            <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    04 — MUESTRARIO DIGITAL DE ACABADOS
                ═══════════════════════════════════════════════════ */}
                <section className="py-28 bg-[#050914] border-y border-white/5 relative overflow-hidden">
                    <div className="container mx-auto px-6 lg:px-14">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                            {/* Left Text */}
                            <div className="lg:col-span-5 space-y-6">
                                <span className="section-eyebrow">Atelier de Acabados</span>
                                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-display">
                                    Muestrario Tacto &{' '}
                                    <span className="text-gold-gradient">Calidad de Material.</span>
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                    Utilizamos materias primas certificadas y tecnología de impresión japonesa para asegurar máxima nitidez y durabilidad en cada hoja.
                                </p>

                                {/* Selector list */}
                                <div className="space-y-3 pt-2">
                                    {FINISHES.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedFinish(item)}
                                            className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                                                selectedFinish.id === item.id
                                                    ? 'bg-liquid-gold/15 border-liquid-gold text-white shadow-gold-glow-soft'
                                                    : 'bg-black/20 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                                            }`}
                                        >
                                            <div>
                                                <div className="text-xs font-black uppercase tracking-tight">{item.name}</div>
                                                <div className="text-[9px] text-liquid-gold/80 font-mono mt-0.5">{item.tag}</div>
                                            </div>
                                            <ArrowRightIcon className={`w-4 h-4 transition-transform ${selectedFinish.id === item.id ? 'translate-x-1 text-liquid-gold' : 'text-slate-600'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right Dynamic Preview Box */}
                            <div className="lg:col-span-7">
                                <motion.div
                                    key={selectedFinish.id}
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className={`bg-gradient-to-br ${selectedFinish.previewColor} border border-white/10 p-10 rounded-[2.5rem] shadow-luxury space-y-8 relative overflow-hidden`}
                                >
                                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                        <span className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-liquid-gold">
                                            {selectedFinish.tag}
                                        </span>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                            Muestra Física Disponible en Taller
                                        </span>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight font-display">
                                            {selectedFinish.name}
                                        </h3>
                                        <p className="text-slate-300 text-sm md:text-base leading-relaxed font-medium">
                                            {selectedFinish.desc}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                                            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                                            <span>Recomendado para documentos autorizados y comercial</span>
                                        </div>
                                        <a
                                            href={generateWhatsAppLink('593993083943', `Hola, quiero ver muestras físicas de ${selectedFinish.name}.`)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all"
                                        >
                                            Consultar Muestras
                                        </a>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    05 — TERMINAL DE DIAGNÓSTICO & HERRAMIENTAS SRI
                ═══════════════════════════════════════════════════ */}
                <section className="py-36 relative">
                    <div className="container mx-auto px-6 lg:px-14 relative z-10">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="text-center max-w-3xl mx-auto mb-16 space-y-4"
                        >
                            <span className="section-eyebrow">Consola de Verificación</span>
                            <h2 className="section-title text-white">
                                Diagnóstico Tributario &{' '}
                                <span className="text-gold-gradient">Escáner de Archivos</span>
                            </h2>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium max-w-2xl mx-auto">
                                Herramientas técnicas para consultar su régimen ante el SRI y verificar que sus archivos de imagen cumplan con la resolución adecuada para impresión.
                            </p>
                        </motion.div>

                        {/* Terminal Tab Navigation */}
                        <div className="flex justify-center mb-8">
                            <div className="inline-flex p-1.5 bg-black/60 border border-white/10 rounded-2xl gap-2">
                                <button
                                    onClick={() => setActiveTerminalTab('ruc')}
                                    className={`px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.25em] transition-all flex items-center gap-2 ${
                                        activeTerminalTab === 'ruc'
                                            ? 'bg-liquid-gold text-slate-950 shadow-gold-glow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <ShieldCheckIcon className="w-4 h-4" />
                                    Validador RUC SRI
                                </button>
                                <button
                                    onClick={() => setActiveTerminalTab('scanner')}
                                    className={`px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.25em] transition-all flex items-center gap-2 ${
                                        activeTerminalTab === 'scanner'
                                            ? 'bg-liquid-gold text-slate-950 shadow-gold-glow'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    <SparklesIcon className="w-4 h-4" />
                                    Escáner Pre-Vuelo IA
                                </button>
                            </div>
                        </div>

                        {/* Widgets Container */}
                        <div className="max-w-4xl mx-auto">
                            <AnimatePresence mode="wait">
                                {activeTerminalTab === 'ruc' ? (
                                    <motion.div
                                        key="ruc-tab"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <RucValidatorWidget />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="scanner-tab"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <PreflightScanner />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    06 — PROCESO DE TRABAJO 3 PASOS
                ═══════════════════════════════════════════════════ */}
                <section className="py-28 border-t border-white/5 relative bg-[#040712]">
                    <div className="container mx-auto px-6 lg:px-14">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="text-center max-w-xl mx-auto mb-20 space-y-4"
                        >
                            <span className="section-eyebrow">Flujo Transparente</span>
                            <h2 className="section-title text-white">
                                Tres pasos para{' '}
                                <span className="text-gold-gradient">recibir su pedido.</span>
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {[
                                {
                                    step: '01',
                                    title: 'Solicitud & Datos SRI',
                                    desc: 'Envíe sus requerimientos o datos de RUC por WhatsApp. Nosotros preparamos el arte preliminar.',
                                    color: 'rgba(212,175,55,0.15)',
                                },
                                {
                                    step: '02',
                                    title: 'Aprobación & Diagramación',
                                    desc: 'Reciba el boceto digital para su revisión previa a impresión física con secuencias numéricas.',
                                    color: 'rgba(14,165,233,0.15)',
                                },
                                {
                                    step: '03',
                                    title: 'Producción & Entrega',
                                    desc: 'Impresión de alta resolución, empaste y retiro en taller o envío a domicilio con rastreo en tiempo real.',
                                    color: 'rgba(16,185,129,0.15)',
                                },
                            ].map((item, idx) => (
                                <motion.div
                                    key={item.step}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.12, duration: 0.7 }}
                                    whileHover={{ y: -6 }}
                                    className="spotlight-card p-10 relative"
                                >
                                    <div
                                        className="absolute top-6 right-6 text-7xl font-black leading-none select-none pointer-events-none font-display"
                                        style={{ color: item.color }}
                                    >
                                        {item.step}
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-liquid-gold mb-3 font-mono">
                                            Fase {item.step}
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3 font-display">
                                            {item.title}
                                        </h3>
                                        <p className="text-slate-400 text-xs leading-relaxed font-medium">
                                            {item.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <Link to="/tracking" className="btn-ghost inline-flex text-[9px]">
                                <ActivityIcon className="w-4 h-4 text-liquid-gold" />
                                Rastrear mi pedido existente
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    07 — PREGUNTAS FRECUENTES (FAQS)
                ═══════════════════════════════════════════════════ */}
                <section className="py-28 relative">
                    <div className="container mx-auto px-6 lg:px-14 max-w-4xl">
                        <div className="text-center mb-16 space-y-4">
                            <span className="section-eyebrow">Preguntas Frecuentes</span>
                            <h2 className="section-title text-white">
                                Respuestas Claras a{' '}
                                <span className="text-gold-gradient">sus Dudas.</span>
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {FAQS.map((faq, idx) => (
                                <div
                                    key={idx}
                                    className="bg-[#0A0F1E]/80 border border-white/10 rounded-2xl overflow-hidden transition-all"
                                >
                                    <button
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                        className="w-full p-6 text-left flex items-center justify-between gap-4 font-black uppercase text-sm tracking-tight text-white font-display"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDownIcon className={`w-5 h-5 text-liquid-gold transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {openFaq === idx && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="px-6 pb-6 text-xs text-slate-400 font-medium leading-relaxed border-t border-white/5 pt-4"
                                            >
                                                {faq.a}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    08 — CTA FINAL DRAMÁTICO
                ═══════════════════════════════════════════════════ */}
                <section className="py-36 relative overflow-hidden bg-[#020409]">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-liquid-gold/30 to-transparent" />
                    </div>

                    <div className="container mx-auto px-6 lg:px-14 relative z-10">
                        <div className="max-w-4xl mx-auto text-center space-y-10">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="space-y-6"
                            >
                                <span className="section-eyebrow">Atención Directa en Machala</span>
                                <h2 className="text-5xl md:text-7xl font-black leading-[0.85] tracking-tighter uppercase font-display">
                                    <span className="text-white">¿LISTO PARA IMPRIMIR</span>
                                    <br />
                                    <span className="text-gold-gradient">SUS DOCUMENTOS?</span>
                                </h2>
                                <p className="text-slate-400 text-base md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
                                    Cotice directamente con nuestro equipo técnico y reciba asesoría legal SRI sin costo.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                            >
                                <a
                                    href={generateWhatsAppLink('593993083943', 'Hola, visité su web y quiero solicitar un pedido.')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-gold shadow-gold-ultra text-base !py-5 !px-10"
                                >
                                    <WhatsAppIcon className="w-5 h-5 text-slate-950" />
                                    Escribir por WhatsApp
                                </a>
                                <Link to="/vitrina" className="btn-ghost !py-5 !px-10">
                                    Ver Catálogo Completo
                                </Link>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 }}
                                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] border border-white/[0.08]"
                            >
                                <LocationIcon className="w-4 h-4 text-liquid-gold" />
                                <span className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-slate-300">
                                    Av. Las Palmeras y Calle 4ta · Machala · Lun–Vie 8–18h · Sáb 8–14h
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </section>

            </main>

            {/* ═══════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════ */}
            <footer className="border-t border-white/5 bg-[#020307] relative z-10">
                <div className="container mx-auto px-6 lg:px-14 py-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                        <div className="space-y-4">
                            <div className="flex flex-col leading-none">
                                <span className="font-black text-2xl text-white tracking-tighter uppercase font-display">
                                    CÓRDOVA<span className="text-liquid-gold">.</span>
                                </span>
                                <span className="font-mono text-[8px] text-slate-500 tracking-[0.4em] uppercase mt-1">
                                    Atelier Gráfico · Est. 2009
                                </span>
                            </div>
                            <p className="text-slate-500 text-xs leading-relaxed font-medium max-w-xs">
                                Imprenta autorizada SRI N° 001-001 en Machala, El Oro. Especialistas en comprobantes fiscales y diseño impreso.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-liquid-gold/80 mb-6 font-mono">
                                Navegación
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Inicio', href: '/' },
                                    { label: 'Catálogo Capacidades', href: '/vitrina' },
                                    { label: 'Rastreo de Pedidos', href: '/tracking' },
                                    { label: 'Acceso Operador', href: '/login' },
                                ].map(link => (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        className="block text-xs font-bold text-slate-400 hover:text-liquid-gold transition-colors uppercase tracking-wider"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-liquid-gold/80 mb-6 font-mono">
                                Contacto Directo
                            </div>
                            <div className="space-y-3 text-xs text-slate-400 font-medium">
                                <div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Ubicación Taller</div>
                                    <div>Machala · El Oro · Ecuador</div>
                                </div>
                                <div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Atención Telefónica</div>
                                    <a href="https://wa.me/593993083943" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
                                        +593 99 308 3943
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[9px] font-mono font-black uppercase tracking-[0.4em] text-slate-600">
                            © {new Date().getFullYear()} Imprenta Córdova &mdash; Todos los derechos reservados
                        </p>
                        <div className="flex items-center gap-6">
                            <span className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-slate-500">
                                SRI Autorizado N° 001-001
                            </span>
                            <ShieldCheckIcon className="w-4 h-4 text-liquid-gold/40" />
                        </div>
                    </div>
                </div>
            </footer>

            {/* ── FLOATING WHATSAPP BUTTON ── */}
            <motion.a
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: 'spring', stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                href={generateWhatsAppLink('593993083943', 'Hola, solicito atención inmediata.')}
                target="_blank"
                rel="noreferrer"
                className="fixed bottom-8 right-8 z-[200] flex items-center justify-center shadow-gold-ultra cursor-pointer"
                style={{
                    width: 60,
                    height: 60,
                    background: 'linear-gradient(135deg, #D4AF37 0%, #f2ca50 100%)',
                    borderRadius: '20px',
                }}
            >
                <span className="absolute inset-0 rounded-[20px] border-2 border-liquid-gold/50 animate-ping" />
                <WhatsAppIcon className="w-7 h-7 text-slate-950 relative z-10" />
            </motion.a>
        </div>
    );
};

export default VisualLanding;
