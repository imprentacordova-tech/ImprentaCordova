import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
    ChevronRightIcon, WhatsAppIcon, PaletteIcon, 
    ShieldCheckIcon, ClockIcon, CheckCircleIcon,
    FileTextIcon, SearchIcon, LayoutIcon, ActivityIcon,
    LayersIcon, StarIcon, CheckBadgeIcon,
    ZapIcon, RocketLaunchIcon, CpuIcon, BoltIcon,
    HomeIcon
} from '../components/Icons';
import { generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import Navbar from '../components/Navbar';

const VisualLanding: React.FC = () => {
    const { scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    
    // Transformaciones para el fondo dinámico
    const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
    const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 1.2]);
    const heroY = useTransform(smoothProgress, [0, 0.2], ["0%", "15%"]);
    const textBlur = useTransform(smoothProgress, [0, 0.1], ["blur(0px)", "blur(10px)"]);
    
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Lógica para cambio de imágenes con el scroll
    const images = [
        'https://i.imgur.com/bKbCyj2.png', // Logo / Identidad
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80', // Digital Design
        'https://images.unsplash.com/photo-1562654501-a0ccc0af3fb1?auto=format&fit=crop&q=80'  // Industrial Precision
    ];
    
    const imageIndex = useTransform(smoothProgress, [0.1, 0.4, 0.7, 1], [0, 1, 2, 2]);
    const imageY = useTransform(smoothProgress, [0.1, 1], ["0%", "-15%"]);

    return (
        <div className="min-h-screen bg-printing-gray text-printing-dark font-sans selection:bg-printing-cyan selection:text-white overflow-x-hidden relative">
            <SEO 
                title="Imprenta Córdova | Soluciones Industriales & Branding Elite"
                description="Liderando la manufactura gráfica en Ecuador. Autorizados por el SRI. Tecnología de punta para marcas que exigen perfección."
            />
            
            {/* --- CINEMATIC OVERLAY (GRAIN & NOISE) --- */}
            <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.04] bg-noise mix-blend-overlay" />
            
            {/* --- INDUSTRIAL INK PARTICLES --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -100, 0],
                            x: [0, Math.random() * 50 - 25, 0],
                            opacity: [0.1, 0.3, 0.1],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5
                        }}
                        className="absolute w-1 h-1 bg-printing-cyan rounded-full blur-[1px]"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>

            {/* --- DYNAMIC SCANNER (MOUSE INTERACTION) --- */}
            <div 
                className="fixed w-[400px] h-[400px] pointer-events-none z-[60] border-[0.5px] border-printing-blue/30 rounded-full hidden lg:block transition-transform duration-300 ease-out"
                style={{ 
                    left: mousePosition.x - 200,
                    top: mousePosition.y - 200,
                    background: 'radial-gradient(circle, rgba(0,71,171,0.05) 0%, transparent 70%)',
                    boxShadow: 'inset 0 0 40px rgba(0,71,171,0.05)'
                }}
            >
                <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-printing-blue/40 animate-scan-slow" />
                <div className="absolute top-0 left-1/2 w-[0.5px] h-full bg-printing-blue/40 animate-scan-slow" />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 font-mono text-[7px] text-printing-blue/60 tracking-[0.4em] uppercase">
                    SCAN_PROXIMITY_COORD: {Math.round(mousePosition.x)},{Math.round(mousePosition.y)}
                </div>
            </div>

            {/* --- GLOBAL ELITE BACKGROUND --- */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(circle, var(--printing-blue) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
            
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-printing-blue/5 blur-[180px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[1200px] h-[1200px] bg-printing-magenta/5 blur-[200px] rounded-full" />
            </div>

            {/* --- VERTICAL GUIDES --- */}
            <div className="fixed top-0 left-[8%] w-[1px] h-full bg-gradient-to-b from-transparent via-slate-200 to-transparent z-0 hidden lg:block" />
            <div className="fixed top-0 right-[8%] w-[1px] h-full bg-gradient-to-b from-transparent via-slate-200 to-transparent z-0 hidden lg:block" />

            <Navbar />

            {/* --- HERO: THE MONOLITH --- */}
            <header className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
                <motion.div 
                    style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-printing-gray/80 to-printing-gray z-10" />
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.05, 1],
                            opacity: [0.3, 0.4, 0.3]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-full"
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80" 
                            alt="Industrial Luxury" 
                            className="w-full h-full object-cover grayscale opacity-20"
                        />
                    </motion.div>
                </motion.div>

                {/* Telemetry HUD */}
                <div className="absolute top-1/3 left-[4%] hidden 2xl:flex flex-col gap-6 text-[9px] font-mono tracking-[0.6em] uppercase vertical-text">
                    <span className="flex items-center gap-2 text-printing-blue">
                        <div className="w-2 h-2 rounded-full bg-printing-blue" /> IMPRENTA_CÓRDOVA_SYSTEMS
                    </span>
                    <span className="flex items-center gap-2 text-printing-yellow">
                        <div className="w-2 h-2 rounded-full bg-printing-yellow" /> ANALYTICS_ACTIVE
                    </span>
                    <span className="flex items-center gap-2 text-printing-red">
                        <div className="w-2 h-2 rounded-full bg-printing-red" /> PROD_READY
                    </span>
                    <div className="w-[1px] h-32 bg-gradient-to-b from-printing-blue/20 via-printing-blue/40 to-transparent mx-auto mt-6" />
                </div>

                <div className="absolute top-1/3 right-[4%] hidden 2xl:flex flex-col gap-8 text-[8px] font-mono text-white/20 tracking-[0.4em] uppercase">
                    <div className="space-y-2 border-l border-white/5 pl-4">
                        <p>PROD_LOAD: 92%</p>
                        <p>STABILITY: NOMINAL</p>
                        <p>UPTIME: 99.98%</p>
                    </div>
                    <div className="space-y-2 border-l border-white/5 pl-4">
                        <p>LOC: 2°08′S 79°59′W</p>
                        <p>TZ: GMT-5</p>
                    </div>
                </div>

                <div className="relative z-20 text-center space-y-16 max-w-[100rem] px-6 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-8"
                        style={{ filter: textBlur }}
                    >
                        <div className="inline-flex items-center gap-6 px-8 py-3 border border-printing-blue/20 bg-printing-blue/5 rounded-full mb-10 backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-printing-blue animate-pulse shadow-[0_0_15px_rgba(0,71,171,0.4)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.8em] text-printing-blue italic">
                                ESTÁNDAR INDUSTRIAL PREMIUM
                            </span>
                        </div>
                        
                        <h1 className="text-6xl sm:text-7xl md:text-[10rem] font-black leading-[0.8] tracking-[-0.06em] text-printing-dark italic uppercase select-none relative group/hero">
                            <span className="block overflow-hidden">
                                <motion.span 
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    className="block hover:text-printing-blue transition-colors duration-700"
                                >
                                    IMPRENTA
                                </motion.span>
                            </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-br from-printing-blue via-printing-cyan to-printing-blue not-italic block mt-4">
                                <motion.span 
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                    className="block drop-shadow-[0_0_40px_rgba(0,71,171,0.2)] hover:drop-shadow-[0_0_60px_rgba(0,71,171,0.4)] transition-all duration-700 tracking-[-0.08em]"
                                >
                                    CÓRDOVA.
                                </motion.span>
                            </span>
                        </h1>
                        
                        <p className="text-slate-600 font-medium text-xl md:text-2xl max-w-4xl mx-auto tracking-wide mt-12 leading-relaxed">
                            Ingeniería visual para marcas que dominan su industria.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, delay: 0.8 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-10"
                    >
                        <motion.a
                            href={generateWhatsAppLink("593993083943", "Solicitud de protocolo de impresión industrial.")}
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:w-auto relative group overflow-hidden bg-printing-blue text-white px-8 md:px-16 py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-[12px] shadow-xl flex items-center justify-center gap-6 md:gap-8 italic transition-all duration-500"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out" />
                            <span className="relative z-10">INICIAR MISIÓN</span> 
                            <ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6 relative z-10 group-hover:translate-x-4 transition-transform duration-500" />
                        </motion.a>

                        <motion.button
                            onClick={() => document.getElementById('vision')?.scrollIntoView({ behavior: 'smooth' })}
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:w-auto bg-white backdrop-blur-2xl text-printing-dark px-8 md:px-16 py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-[12px] flex items-center justify-center gap-6 md:gap-8 group border border-slate-200 hover:border-printing-blue/30 hover:bg-slate-50 transition-all duration-700 italic"
                        >
                            EXPLORAR ARSENAL <LayoutIcon className="w-5 h-5 md:w-6 md:h-6 opacity-40 group-hover:rotate-45 transition-transform duration-500" />
                        </motion.button>
                    </motion.div>
                </div>
                
                {/* Scroll Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 2 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
                >
                    <div className="w-[1px] h-20 bg-gradient-to-b from-printing-blue via-printing-blue/20 to-transparent relative">
                        <motion.div 
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute left-1/2 -translate-x-1/2 w-1 h-4 bg-printing-blue rounded-full shadow-lg shadow-printing-blue/40"
                        />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 tracking-[0.6em] uppercase">Desplazar</span>
                </motion.div>
            </header>

            {/* --- SECTION: THE VISION (DYNAMIC SHOWCASE) --- */}
            <section id="vision" className="relative py-48 lg:py-72 bg-white">
                <div className="max-w-[100rem] mx-auto px-8 lg:px-20 grid lg:grid-cols-[1fr_1.3fr] gap-32 items-start">
                    
                    {/* Fixed Monolith Preview */}
                    <div className="sticky top-40 h-[70vh] rounded-[4rem] overflow-hidden shadow-2xl border border-slate-100 bg-printing-gray relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-printing-blue/5 to-printing-blue/10 z-10" />
                        
                        {/* Interactive Scan Effect */}
                        <motion.div 
                            animate={{ top: ['-10%', '110%'] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 w-full h-[1px] bg-printing-blue/40 shadow-[0_0_20px_rgba(0,71,171,0.3)] z-20 pointer-events-none"
                        />
                        
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={Math.round(imageIndex.get())}
                                src={images[Math.min(Math.round(imageIndex.get()), 2)]}
                                style={{ y: imageY }}
                                initial={{ opacity: 0, scale: 1.2, filter: "brightness(1) blur(20px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "brightness(1) blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.9, filter: "brightness(1) blur(20px)" }}
                                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 transition-all duration-1000"
                            />
                        </AnimatePresence>

                        {/* HUD Elements */}
                        <div className="absolute top-12 left-12 z-20 font-mono text-[9px] text-printing-dark/40 tracking-[0.4em]">
                            <p>PREVIEW_NODE: 0x{Math.round(imageIndex.get()) + 1}</p>
                            <p>RESOLUTION: 8K_NATIVE</p>
                        </div>

                        <div className="absolute bottom-16 left-16 z-30 space-y-6 text-printing-dark">
                            <motion.div 
                                key={`label-${Math.round(imageIndex.get())}`}
                                initial={{ x: -40, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="flex flex-col gap-4"
                            >
                                <span className="text-[10px] font-black text-printing-blue uppercase tracking-[0.8em] italic">Capacidad Activa</span>
                                <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-[-0.04em] leading-none">
                                    {Math.round(imageIndex.get()) === 0 ? 'LOGÍSTICA SRI' : 
                                     Math.round(imageIndex.get()) === 1 ? 'ALTA ESTAMPACIÓN' : 'DIMENSIÓN INDUSTRIAL'}
                                </h3>
                            </motion.div>
                        </div>
                    </div>

                    {/* Scrolling Narrative Content */}
                    <div className="space-y-64 py-20 relative">
                        {/* CENTRAL_FISCAL */}
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ margin: "-20%" }}
                            className="space-y-10 pl-4 border-l-[2px] border-printing-blue/20"
                        >
                            <div className="flex items-center gap-6">
                                <span className="text-[14px] font-black uppercase tracking-[1em] text-printing-blue italic">01_FISCAL</span>
                                <div className="flex-1 h-[1px] bg-slate-200" />
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black tracking-[-0.04em] text-printing-dark italic uppercase leading-[0.85]">
                                PODER <br/> <span className="text-printing-blue not-italic">LEGAL.</span>
                            </h2>
                            <p className="text-slate-600 font-medium text-lg md:text-xl leading-relaxed max-w-2xl">
                                Manufactura certificada de comprobantes físicos bajo normativas estrictas del SRI. Seguridad total en cada folio impreso.
                            </p>
                            <div className="flex gap-4">
                                <div className="px-6 py-4 bg-printing-gray border border-slate-100 rounded-2xl">
                                    <span className="text-2xl font-black text-printing-dark italic">+1M</span>
                                    <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-1">Folios Emitidos</p>
                                </div>
                                <div className="px-6 py-4 bg-printing-gray border border-slate-100 rounded-2xl">
                                    <span className="text-2xl font-black text-printing-dark italic">100%</span>
                                    <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-1">Garantía SRI</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* ELITE_BRANDING */}
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ margin: "-20%" }}
                            className="space-y-10 pl-4 border-l-[2px] border-printing-magenta/20"
                        >
                            <div className="flex items-center gap-6">
                                <span className="text-[14px] font-black uppercase tracking-[1em] text-printing-magenta italic">02_ATELIER</span>
                                <div className="flex-1 h-[1px] bg-slate-200" />
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black tracking-[-0.04em] text-printing-dark italic uppercase leading-[0.85]">
                                DISEÑO <br/> <span className="text-printing-magenta not-italic">SUPREMO.</span>
                            </h2>
                            <p className="text-slate-600 font-medium text-lg md:text-xl leading-relaxed max-w-2xl">
                                Acabados que desafían lo convencional. Sectorizado UV, laminados Soft-Touch y panelería de alta gramaje para marcas de lujo.
                            </p>
                            <motion.a 
                                href={generateWhatsAppLink("593993083943", "Consulta para branding premium.")}
                                whileHover={{ x: 20 }}
                                className="inline-flex items-center gap-6 text-printing-magenta font-black uppercase tracking-widest text-xs group"
                            >
                                Ver Muestrario Elite <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                            </motion.a>
                        </motion.div>

                        {/* MASSIVE_INDUSTRIAL */}
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ margin: "-20%" }}
                            className="space-y-10 pl-4 border-l-[2px] border-printing-red/20"
                        >
                            <div className="flex items-center gap-6">
                                <span className="text-[14px] font-black uppercase tracking-[1em] text-printing-red italic">03_FACTORY</span>
                                <div className="flex-1 h-[1px] bg-slate-200" />
                            </div>
                            <h2 className="text-5xl md:text-7xl font-black tracking-[-0.04em] text-printing-dark italic uppercase leading-[0.85]">
                                ESCALA <br/> <span className="text-printing-red not-italic">ABSOLUTA.</span>
                            </h2>
                            <p className="text-slate-600 font-medium text-lg md:text-xl leading-relaxed max-w-2xl">
                                Gran formato con precisión microscópica. Vallas, lonas y señalética industrial con tintas eco-solventes de máxima duración.
                            </p>
                            <div className="pt-10">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    className="px-12 py-6 border-2 border-printing-red/30 text-printing-red rounded-[2rem] font-black uppercase tracking-widest text-[11px] hover:bg-printing-red hover:text-white hover:border-printing-red transition-all flex items-center gap-4 italic"
                                >
                                    <ZapIcon className="w-6 h-6" /> Cotizar Producción Masiva
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- SECTION: CONTROL CENTER (TRACKING) --- */}
            <section className="py-60 bg-printing-gray relative overflow-hidden">
                {/* Decorative Background Grid */}
                <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#0047ab 1px, transparent 1px), linear-gradient(90deg, #0047ab 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
                
                <div className="max-w-[100rem] mx-auto px-8 relative z-10">
                    <div className="bg-white border border-slate-200 rounded-[5rem] p-16 lg:p-32 grid xl:grid-cols-2 gap-32 items-center shadow-2xl relative overflow-hidden">
                        {/* Glow Spots */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-printing-blue/5 blur-[150px] -z-10" />
                        
                        <div className="space-y-16">
                            <div className="space-y-10">
                                <div className="inline-flex items-center gap-4 px-6 py-2 bg-printing-blue/5 border border-printing-blue/10 rounded-xl">
                                    <ActivityIcon className="w-5 h-5 text-printing-blue" />
                                    <span className="text-[10px] font-mono text-printing-blue tracking-[0.6em] uppercase">SISTEMA_DE_RASTREO_v4</span>
                                </div>
                                <h3 className="text-6xl lg:text-8xl font-black text-printing-dark italic uppercase tracking-[-0.04em] leading-[0.85]">
                                    CENTRO DE <br/> <span className="text-printing-blue not-italic">CONTROL.</span>
                                </h3>
                                <p className="text-slate-600 font-medium text-lg md:text-xl max-w-2xl leading-relaxed">
                                    Seguimiento en tiempo real de cada fase de producción. Transparencia total desde la aprobación del arte hasta la entrega final.
                                </p>
                            </div>
                            
                            <motion.a 
                                href="#/tracking"
                                whileHover={{ scale: 1.05, x: 20 }}
                                className="inline-flex bg-printing-blue text-white px-10 md:px-16 py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-[12px] shadow-xl items-center gap-6 md:gap-8 italic transition-all"
                            >
                                <RocketLaunchIcon className="w-6 h-6 md:w-8 md:h-8" /> ENTRAR A CONSOLA
                            </motion.a>
                        </div>

                        {/* Terminal UI Mockup (More Advanced) */}
                        <div className="bg-printing-gray border border-slate-200 rounded-[4rem] p-12 font-mono text-xs space-y-10 shadow-inner relative">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                                <div className="flex gap-3">
                                    <div className="w-3 h-3 rounded-full bg-printing-red shadow-[0_0_10px_rgba(225,29,72,0.4)]" />
                                    <div className="w-3 h-3 rounded-full bg-printing-yellow shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                                </div>
                                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">NODE_STATUS: ONLINE</span>
                            </div>
                            
                            <div className="space-y-6 text-printing-blue">
                                <p className="flex gap-4"><span className="text-slate-400">CMD</span> <span className="text-printing-blue/40">{">"}</span> QUERYING_DB_CLIENT: PASAJE_01...</p>
                                <p className="flex gap-4"><span className="text-slate-400">SYS</span> <span className="text-printing-blue/40">{">"}</span> ORDER_ID_FOUND: #COR-992</p>
                                <p className="flex gap-4"><span className="text-slate-400">PRC</span> <span className="text-printing-blue/40">{">"}</span> STATE: <span className="bg-printing-blue text-white px-3 py-0.5 rounded font-black italic text-[10px]">PRODUCCIÓN_ACTIVA</span></p>
                                
                                <div className="mt-16 p-10 bg-white border border-slate-200 rounded-3xl space-y-8 relative overflow-hidden group shadow-sm">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-printing-blue/10 animate-scan pointer-events-none" />
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-2">
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Progreso de Manufactura</p>
                                            <p className="text-2xl font-black text-printing-dark italic tracking-[-0.04em] uppercase">96.8% COMPLETE</p>
                                        </div>
                                        <div className="w-16 h-16 rounded-full border-4 border-printing-blue/10 border-t-printing-blue animate-spin" />
                                    </div>
                                    <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200 p-1">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '96.8%' }}
                                            transition={{ duration: 3, ease: "circOut" }}
                                            className="h-full bg-gradient-to-r from-printing-blue/80 to-printing-blue rounded-full shadow-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ELITE FOOTER --- */}
            <footer className="py-40 bg-white border-t border-slate-100 relative overflow-hidden">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[400px] bg-printing-blue/5 blur-[200px] pointer-events-none" />
                
                <div className="max-w-[100rem] mx-auto px-8 space-y-24 relative z-10 text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="space-y-10"
                    >
                        <h2 className="text-6xl md:text-9xl font-black text-slate-100 italic uppercase tracking-[-0.06em] select-none">
                            IMPRENTA CÓRDOVA
                        </h2>
                        
                        <div className="flex flex-wrap justify-center gap-16 md:gap-24">
                            {[
                                { icon: <WhatsAppIcon/>, label: "Ventas Directas", href: generateWhatsAppLink("593993083943", "Hola!") },
                                { icon: <ShieldCheckIcon/>, label: "Portal Interno", href: "#/login" },
                                { icon: <ActivityIcon/>, label: "Centro de Control", href: "#/tracking" },
                                { icon: <HomeIcon/>, label: "Ubicación Matriz", href: "https://maps.google.com" }
                            ].map((item, idx) => (
                                <motion.a 
                                    key={idx}
                                    href={item.href} 
                                    whileHover={{ y: -10, color: '#0047ab' }} 
                                    className="text-slate-400 font-black uppercase text-[11px] tracking-[0.5em] transition-all duration-500 flex flex-col items-center gap-4 group"
                                >
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-printing-gray border border-slate-100 flex items-center justify-center group-hover:border-printing-blue/50 group-hover:bg-printing-blue/10 transition-all duration-500">
                                        <div className="w-7 h-7">{item.icon}</div>
                                    </div>
                                    {item.label}
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>
                    
                    <div className="pt-20 border-t border-slate-100 flex flex-col items-center gap-10">
                        <div className="flex gap-4">
                            <div className="w-10 h-[1px] bg-slate-200 my-auto" />
                            <div className="w-12 h-12 rounded-2xl bg-printing-gray border border-slate-100 flex items-center justify-center">
                                <CpuIcon className="w-6 h-6 text-slate-300" />
                            </div>
                            <div className="w-10 h-[1px] bg-slate-200 my-auto" />
                        </div>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[1em] italic">
                            DISEÑADO EN MACHALA, EC • IMPULSOR INDUSTRIAL V4.2
                        </p>
                    </div>
                </div>
            </footer>

            {/* --- FLOATING ACTION (CANAL ELITE) --- */}
            <AnimatePresence>
                <motion.a 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05, rotate: -2 }}
                    whileTap={{ scale: 0.95 }}
                    href={generateWhatsAppLink("593993083943", "Protocolo de atención inmediata.")}
                    className="fixed bottom-12 right-12 z-50 flex items-center gap-6 bg-white/90 backdrop-blur-2xl border border-slate-200 p-6 rounded-[2.5rem] shadow-2xl hover:shadow-printing-blue/20 transition-all duration-700 group"
                >
                    <div className="w-14 h-14 bg-printing-blue rounded-full flex items-center justify-center text-white shadow-xl">
                        <WhatsAppIcon className="w-8 h-8" />
                    </div>
                    <div className="hidden md:block pr-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-printing-blue italic">Atención VIP</p>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-printing-dark">Canal Industrial</p>
                    </div>
                </motion.a>
            </AnimatePresence>
        </div>
    );
};

export default VisualLanding;

