import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    WhatsAppIcon, ShieldCheckIcon, ActivityIcon,
    SparklesIcon, CpuIcon, FileTextIcon, BoxIcon,
    CheckCircleIcon, ArrowRightIcon
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

// ─── SERVICE DATA ──────────────────────────────────────────────────
const SERVICES = [
    {
        icon: FileTextIcon,
        label: 'Facturas',
        desc: 'Autorizadas por el SRI para Régimen General y RIMPE-Emprendedor.',
        tag: 'Comprobante Fiscal',
    },
    {
        icon: FileTextIcon,
        label: 'Notas de Venta',
        desc: 'Para negocios populares. Formato simplificado aprobado por el SRI.',
        tag: 'Negocio Popular',
    },
    {
        icon: BoxIcon,
        label: 'Talonarios',
        desc: 'Recibos, pedidos, vales y documentos internos personalizados.',
        tag: 'Documentos Internos',
    },
    {
        icon: SparklesIcon,
        label: 'Sellos',
        desc: 'Sellos de caucho automáticos y manuales con diseño profesional.',
        tag: 'Identidad Corporativa',
    },
    {
        icon: CpuIcon,
        label: 'Etiquetas',
        desc: 'Adhesivas, en rollo o hoja. Para productos, precios y envíos.',
        tag: 'Packaging',
    },
    {
        icon: SparklesIcon,
        label: 'Diseño Gráfico',
        desc: 'Logotipos, tarjetas, flyers y branding completo incluido en pedidos.',
        tag: 'Branding',
    },
];

// ─── TRUST POINTS ─────────────────────────────────────────────────
const TRUST = [
    { label: 'SRI Autorizado', detail: 'Establecimiento de Gráficas Nº 001-001' },
    { label: 'Numeración Legal', detail: 'Todos los comprobantes con numeración SRI válida' },
    { label: 'Control de Calidad', detail: 'Revisión técnica previa a impresión' },
    { label: 'Entrega Garantizada', detail: 'Confirmación digital de cada pedido' },
];

// ─── STATS ────────────────────────────────────────────────────────
const STATS = [
    { value: 2400, suffix: '+', label: 'Trabajos Entregados' },
    { value: 15,   suffix: '+', label: 'Años de Experiencia' },
    { value: 99,   suffix: '%', label: 'Entrega Puntual' },
    { value: 800,  suffix: '+', label: 'Clientes Activos' },
];

// ─── COMPONENT ────────────────────────────────────────────────────
const VisualLanding: React.FC = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const heroRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const heroY    = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
    const springY  = useSpring(heroY, { stiffness: 80, damping: 20 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // container variants for staggered children
    const staggerContainer = {
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
    };
    const fadeUp = {
        hidden: { opacity: 0, y: 30 },
        show:   { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] } },
    };

    return (
        <div className="min-h-screen bg-[#050810] text-white font-sans selection:bg-liquid-gold/20 overflow-x-hidden relative">
            <SEO
                title="IMPRENTA CÓRDOVA | Facturas · Sellos · Talonarios — Machala, El Oro"
                description="Imprenta autorizada por el SRI en Machala. Facturas, notas de venta, talonarios, sellos y etiquetas con diseño profesional incluido. +2,400 trabajos entregados."
            />

            <PublicNavbar />

            {/* ═══════════════════════════════════════════════════════
                AMBIENT BACKGROUND SYSTEM
            ═══════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* Radial glow top-right */}
                <div className="absolute -top-[20%] -right-[15%] w-[900px] h-[900px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 65%)' }} />
                {/* Radial glow bottom-left */}
                <div className="absolute -bottom-[20%] -left-[15%] w-[1100px] h-[1100px] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 60%)' }} />
                {/* Architect grid */}
                <div className="absolute inset-0 bg-architect-grid opacity-100" />
                {/* Grain */}
                <div className="absolute inset-0 opacity-[0.025] animate-grain"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundRepeat: 'repeat', backgroundSize: '256px 256px' }} />
            </div>

            {/* ── CURSOR HALO ── */}
            <div
                className="fixed w-[480px] h-[480px] pointer-events-none z-[60] hidden lg:block"
                style={{
                    left: mousePosition.x - 240,
                    top:  mousePosition.y - 240,
                    background: 'radial-gradient(circle, rgba(212,175,55,0.025) 0%, transparent 65%)',
                    transition: 'left 0.8s cubic-bezier(0.23,1,0.32,1), top 0.8s cubic-bezier(0.23,1,0.32,1)',
                }}
            >
                <div className="absolute top-1/2 left-0 w-full h-px bg-liquid-gold/8" />
                <div className="absolute top-0 left-1/2 w-px h-full bg-liquid-gold/8" />
            </div>

            <main className="relative z-10">

                {/* ═══════════════════════════════════════════════════
                    01 — HERO
                ═══════════════════════════════════════════════════ */}
                <header ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32">
                    <motion.div style={{ y: springY, opacity: heroOpacity }} className="w-full">
                        <div className="container mx-auto px-6 lg:px-14 text-center">
                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                animate="show"
                                className="space-y-10"
                            >
                                {/* Badge */}
                                <motion.div variants={fadeUp} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-liquid-gold/8 border border-liquid-gold/20">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-liquid-gold opacity-50" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-liquid-gold" />
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.45em] text-liquid-gold/80">
                                        Machala · El Oro · Ecuador
                                    </span>
                                    <span className="text-liquid-gold/30 text-xs">·</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.45em] text-slate-500">
                                        Est. 2009
                                    </span>
                                </motion.div>

                                {/* Headline */}
                                <motion.div variants={fadeUp} className="space-y-3">
                                    <h1 className="text-[clamp(3.5rem,14vw,12rem)] font-black leading-[0.82] tracking-[-0.04em] font-display">
                                        <span className="block text-white/90">IMPRENTA</span>
                                        <span className="block text-gold-gradient">CÓRDOVA.</span>
                                    </h1>
                                </motion.div>

                                {/* Subheading */}
                                <motion.p
                                    variants={fadeUp}
                                    className="text-slate-400 font-medium text-lg md:text-xl max-w-xl mx-auto leading-relaxed"
                                >
                                    Facturas, Notas de Venta, Talonarios y Sellos con autorización SRI.{' '}
                                    <span className="text-champagne font-semibold">Diseño incluido. Entrega garantizada.</span>
                                </motion.p>

                                {/* CTAs */}
                                <motion.div
                                    variants={fadeUp}
                                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                                >
                                    <Link to="/vitrina" className="btn-gold shadow-gold-ultra">
                                        <BoxIcon className="w-4 h-4" />
                                        Ver Catálogo
                                    </Link>
                                    <a
                                        href={generateWhatsAppLink('593993083943', 'Hola, visité su web y quiero cotizar un trabajo.')}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-ghost"
                                    >
                                        <WhatsAppIcon className="w-4 h-4 text-emerald-400" />
                                        Cotizar por WhatsApp
                                    </a>
                                </motion.div>

                                {/* Scroll cue */}
                                <motion.div
                                    variants={fadeUp}
                                    className="flex flex-col items-center gap-2 pt-8 opacity-30"
                                >
                                    <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">Explorar</span>
                                    <motion.div
                                        animate={{ y: [0, 8, 0] }}
                                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                        className="w-px h-10 bg-gradient-to-b from-liquid-gold/60 to-transparent"
                                    />
                                </motion.div>
                            </motion.div>
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
                    03 — SERVICES GRID
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
                            <span className="section-eyebrow">Nuestros Servicios</span>
                            <h2 className="section-title text-white/90">
                                Todo lo que necesita
                                <br />
                                <span className="text-gold-gradient">para operar.</span>
                            </h2>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                                Documentos con validez legal, producidos con tecnología de punta y entregados con la rapidez que su negocio exige.
                            </p>
                        </motion.div>

                        {/* Grid */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, amount: 0.15 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                        >
                            {SERVICES.map((svc, idx) => (
                                <motion.div
                                    key={svc.label}
                                    variants={fadeUp}
                                    className="service-card group gold-corner"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-11 h-11 rounded-xl bg-liquid-gold/8 border border-liquid-gold/15 flex items-center justify-center">
                                            <svc.icon className="w-5 h-5 text-liquid-gold/80" />
                                        </div>
                                        <span className="text-[7px] font-black uppercase tracking-[0.4em] text-liquid-gold/40 border border-liquid-gold/10 px-2.5 py-1 rounded-full">
                                            {svc.tag}
                                        </span>
                                    </div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.5em] text-liquid-gold/40 mb-2">
                                        0{idx + 1}
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">
                                        {svc.label}
                                    </h3>
                                    <p className="text-slate-400 text-xs leading-relaxed font-medium">
                                        {svc.desc}
                                    </p>
                                    <div className="mt-6 flex items-center gap-2 text-liquid-gold/40 group-hover:text-liquid-gold/70 transition-colors">
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Cotizar</span>
                                        <ArrowRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    04 — TRUST / GARANTÍAS
                ═══════════════════════════════════════════════════ */}
                <section className="py-20 border-y border-white/[0.04] bg-white/[0.01] relative overflow-hidden">
                    {/* Faint bg accent */}
                    <div className="absolute inset-0 bg-architect-grid opacity-40" />
                    <div className="container mx-auto px-6 lg:px-14 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {TRUST.map((item, idx) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.08, duration: 0.6 }}
                                    className="flex items-start gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:border-liquid-gold/15 transition-colors duration-300"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black text-white uppercase tracking-tight mb-1">
                                            {item.label}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                            {item.detail}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    05 — HERRAMIENTAS INTERACTIVAS (WIDGETS)
                ═══════════════════════════════════════════════════ */}
                <section className="py-36 relative">
                    {/* Ambient glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)' }} />

                    <div className="container mx-auto px-6 lg:px-14 relative z-10">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="text-center max-w-3xl mx-auto mb-24 space-y-4"
                        >
                            <span className="section-eyebrow">Sistemas Interactivos</span>
                            <h2 className="section-title">
                                Diagnóstico &{' '}
                                <span className="text-gold-gradient">Cumplimiento</span>
                            </h2>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium max-w-2xl mx-auto">
                                Herramientas técnicas gratuitas para verificar su régimen tributario ante el SRI y evaluar la calidad de sus archivos antes de imprimir.
                            </p>
                        </motion.div>

                        {/* Widgets */}
                        <div className="space-y-16 max-w-3xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <RucValidatorWidget />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <PreflightScanner />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    06 — PROCESS / WORKFLOW
                ═══════════════════════════════════════════════════ */}
                <section className="py-32 border-t border-white/[0.04] relative">
                    <div className="container mx-auto px-6 lg:px-14">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                            className="text-center max-w-xl mx-auto mb-20 space-y-4"
                        >
                            <span className="section-eyebrow">Flujo de Trabajo</span>
                            <h2 className="section-title">
                                Simple &{' '}
                                <span className="text-gold-gradient">sin complicaciones.</span>
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {[
                                {
                                    step: '01',
                                    title: 'Solicitud',
                                    desc: 'Envíe sus datos y requerimientos por WhatsApp o cotice directamente en nuestro catálogo digital.',
                                    color: 'rgba(212,175,55,0.12)',
                                },
                                {
                                    step: '02',
                                    title: 'Producción',
                                    desc: 'Su pedido entra al flujo de diseño e impresión. Recibirá una confirmación con su número de orden.',
                                    color: 'rgba(14,165,233,0.10)',
                                },
                                {
                                    step: '03',
                                    title: 'Entrega',
                                    desc: 'Retiro en tienda o envío a domicilio. Seguimiento en tiempo real desde nuestra plataforma.',
                                    color: 'rgba(52,211,153,0.10)',
                                },
                            ].map((item, idx) => (
                                <motion.div
                                    key={item.step}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.12, duration: 0.7 }}
                                    whileHover={{ y: -6 }}
                                    className="obsidian-card p-10 relative"
                                >
                                    {/* Step number watermark */}
                                    <div
                                        className="absolute top-6 right-6 text-7xl font-black leading-none select-none pointer-events-none"
                                        style={{ color: item.color }}
                                    >
                                        {item.step}
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-[9px] font-black uppercase tracking-[0.5em] text-liquid-gold/40 mb-4">
                                            Paso {item.step}
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                                            {item.title}
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                            {item.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Tracking CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4, duration: 0.7 }}
                            className="text-center mt-12"
                        >
                            <Link to="/tracking" className="btn-ghost inline-flex">
                                <ActivityIcon className="w-4 h-4 text-liquid-gold" />
                                Rastrear mi pedido
                            </Link>
                        </motion.div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════════
                    07 — CTA FINAL
                ═══════════════════════════════════════════════════ */}
                <section className="py-40 relative overflow-hidden">
                    {/* Dramatic gold gradient bg */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0"
                            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                    </div>

                    <div className="container mx-auto px-6 lg:px-14 relative z-10">
                        <div className="max-w-4xl mx-auto text-center space-y-10">
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.9 }}
                                className="space-y-6"
                            >
                                <span className="section-eyebrow">Canal Directo</span>
                                <h2 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.85] tracking-tighter">
                                    <span className="text-white/90">¿LISTO PARA</span>
                                    <br />
                                    <span className="text-gold-gradient">COMENZAR?</span>
                                </h2>
                                <p className="text-slate-400 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
                                    Nuestro equipo está listo para atender su solicitud de forma inmediata.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.7 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                            >
                                <a
                                    href={generateWhatsAppLink('593993083943', 'Hola, visité su web y quiero iniciar un pedido.')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-gold shadow-gold-ultra text-base !py-5 !px-10"
                                >
                                    <WhatsAppIcon className="w-5 h-5" />
                                    Escribir por WhatsApp
                                </a>
                                <Link to="/vitrina" className="btn-ghost !py-5 !px-10">
                                    Ver Catálogo Completo
                                </Link>
                            </motion.div>

                            {/* Location pill */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4, duration: 0.7 }}
                                className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06]"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">
                                    Machala · Av. Las Palmeras y calle 4ta · Lun–Vie 8-18h · Sáb 8-14h
                                </span>
                            </motion.div>
                        </div>
                    </div>
                </section>

            </main>

            {/* ═══════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════ */}
            <footer className="border-t border-white/[0.04] bg-[#030508] relative z-10">
                <div className="container mx-auto px-6 lg:px-14 py-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                        {/* Brand */}
                        <div className="space-y-4">
                            <div className="flex flex-col leading-none">
                                <span className="font-black text-2xl text-white tracking-tighter uppercase">
                                    CÓRDOVA<span className="text-liquid-gold">.</span>
                                </span>
                                <span className="font-mono text-[8px] text-slate-500 tracking-[0.4em] uppercase mt-1">
                                    Atelier Gráfico · Est. 2009
                                </span>
                            </div>
                            <p className="text-slate-500 text-xs leading-relaxed font-medium max-w-xs">
                                Imprenta autorizada por el SRI en Machala, El Oro. Especializados en documentos tributarios y diseño gráfico de alto estándar.
                            </p>
                        </div>

                        {/* Links */}
                        <div className="space-y-4">
                            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-liquid-gold/60 mb-6">
                                Navegación
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Inicio', href: '/' },
                                    { label: 'Catálogo Digital', href: '/vitrina' },
                                    { label: 'Rastreo de Pedidos', href: '/tracking' },
                                    { label: 'Acceso Operador', href: '/login' },
                                ].map(link => (
                                    <Link
                                        key={link.href}
                                        to={link.href}
                                        className="block text-xs font-bold text-slate-500 hover:text-liquid-gold transition-colors uppercase tracking-wider"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="space-y-4">
                            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-liquid-gold/60 mb-6">
                                Contacto
                            </div>
                            <div className="space-y-3 text-xs text-slate-500 font-medium">
                                <div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Dirección</div>
                                    <div>Machala · El Oro · Ecuador</div>
                                </div>
                                <div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Horario</div>
                                    <div>Lun–Vie: 8:00 – 18:00</div>
                                    <div>Sáb: 8:00 – 14:00</div>
                                </div>
                                <a
                                    href="https://wa.me/593993083943"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-emerald-400/70 hover:text-emerald-400 transition-colors"
                                >
                                    <WhatsAppIcon className="w-3.5 h-3.5" />
                                    +593 99 308 3943
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-600">
                            © {new Date().getFullYear()} Imprenta Córdova — Todos los derechos reservados
                        </p>
                        <div className="flex items-center gap-6">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">
                                SRI Autorizado · RUC Verificado
                            </span>
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon className="w-3.5 h-3.5 text-liquid-gold/30" />
                                <CpuIcon className="w-3.5 h-3.5 text-liquid-gold/30" />
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            {/* ─── FLOATING WHATSAPP ─── */}
            <motion.a
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, type: 'spring', stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                href={generateWhatsAppLink('593993083943', 'Hola, necesito atención inmediata.')}
                target="_blank"
                rel="noreferrer"
                className="fixed bottom-8 right-8 z-[200] flex items-center justify-center shadow-gold-ultra cursor-pointer"
                style={{
                    width: 60,
                    height: 60,
                    background: 'linear-gradient(135deg, #D4AF37 0%, #f2ca50 100%)',
                    borderRadius: '18px',
                }}
            >
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-[18px] border-2 border-liquid-gold/40 animate-ping" />
                <WhatsAppIcon className="w-7 h-7 text-slate-950 relative z-10" />
            </motion.a>
        </div>
    );
};

export default VisualLanding;
