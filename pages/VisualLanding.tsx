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
        <div className="min-h-screen bg-white text-printing-dark font-sans selection:bg-printing-blue selection:text-white overflow-x-hidden relative">
            <SEO 
                title="IMPRENTA CÓRDOVA | Ingeniería Gráfica & Branding Industrial"
                description="Liderando la manufactura gráfica en Ecuador. Autorizados por el SRI. Tecnología de punta para marcas que exigen perfección absoluta."
            />
            
            {/* --- CINEMATIC OVERLAY (GRAIN & NOISE) --- */}
            <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />
            
            {/* --- INDUSTRIAL INK PARTICLES --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -120, 0],
                            x: [0, Math.random() * 40 - 20, 0],
                            opacity: [0.05, 0.2, 0.05],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            duration: 12 + Math.random() * 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5
                        }}
                        className="absolute w-1.5 h-1.5 bg-printing-blue rounded-full blur-[1.5px]"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>

            {/* --- DYNAMIC SCANNER (MOUSE INTERACTION) --- */}
            <div 
                className="fixed w-[350px] h-[350px] pointer-events-none z-[60] border-[0.5px] border-printing-blue/20 rounded-full hidden lg:block transition-transform duration-500 ease-out"
                style={{ 
                    left: mousePosition.x - 175,
                    top: mousePosition.y - 175,
                    background: 'radial-gradient(circle, rgba(0,71,171,0.03) 0%, transparent 75%)',
                }}
            >
                <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-printing-blue/30 animate-scan-slow" />
                <div className="absolute top-0 left-1/2 w-[0.5px] h-full bg-printing-blue/30 animate-scan-slow" />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 font-mono text-[6px] text-printing-blue/50 tracking-[0.6em] uppercase whitespace-nowrap">
                    CORDOVA_AXIS_COORD: {Math.round(mousePosition.x)},{Math.round(mousePosition.y)}
                </div>
            </div>

            {/* --- GLOBAL ELITE BACKGROUND --- */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle, var(--printing-blue) 0.5px, transparent 0.5px)', backgroundSize: '64px 64px' }} />
            
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-15%] right-[-10%] w-[1100px] h-[1100px] bg-printing-blue/5 blur-[220px] rounded-full" />
                <div className="absolute bottom-[-15%] left-[-10%] w-[1300px] h-[1300px] bg-printing-blue/3 blur-[250px] rounded-full" />
            </div>

            {/* --- VERTICAL GUIDES --- */}
            <div className="fixed top-0 left-[6%] w-[1px] h-full bg-gradient-to-b from-transparent via-slate-100 to-transparent z-0 hidden lg:block" />
            <div className="fixed top-0 right-[6%] w-[1px] h-full bg-gradient-to-b from-transparent via-slate-100 to-transparent z-0 hidden lg:block" />

            <Navbar />

            {/* --- HERO: THE MONOLITH --- */}
            <header className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-24">
                <motion.div 
                    style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/80 to-white z-10" />
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.03, 1],
                            opacity: [0.2, 0.3, 0.2]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-full"
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80" 
                            alt="Industrial Precision" 
                            className="w-full h-full object-cover grayscale opacity-25"
                        />
                    </motion.div>
                </motion.div>

                {/* Telemetry HUD */}
                <div className="absolute top-1/3 left-[3%] hidden 2xl:flex flex-col gap-8 text-[8px] font-mono tracking-[0.8em] uppercase vertical-text opacity-40">
                    <span className="flex items-center gap-3 text-printing-blue">
                        <div className="w-1.5 h-1.5 rounded-full bg-printing-blue" /> IMPRENTA_CORDOVA_V4
                    </span>
                    <span className="flex items-center gap-3 text-printing-yellow">
                        <div className="w-1.5 h-1.5 rounded-full bg-printing-yellow" /> TRIBUTARIO_ACTIVE
                    </span>
                    <span className="flex items-center gap-3 text-printing-red">
                        <div className="w-1.5 h-1.5 rounded-full bg-printing-red" /> INDUSTRIAL_CORE
                    </span>
                    <div className="w-[1px] h-40 bg-gradient-to-b from-printing-blue/40 via-printing-blue/10 to-transparent mx-auto mt-8" />
                </div>

                <div className="absolute top-1/3 right-[3%] hidden 2xl:flex flex-col gap-10 text-[7px] font-mono text-printing-dark/20 tracking-[0.5em] uppercase">
                    <div className="space-y-3 border-l border-printing-blue/10 pl-6">
                        <p>QUALITY: ATELIER_GRADE</p>
                        <p>SYSTEM: NOMINAL</p>
                        <p>PRECISION: 0.001MM</p>
                    </div>
                    <div className="space-y-3 border-l border-printing-blue/10 pl-6">
                        <p>LAT: -2.1388</p>
                        <p>LON: -79.9833</p>
                    </div>
                </div>

                <div className="relative z-20 text-center space-y-12 max-w-[90rem] px-6 w-full">
                 {/* --- HERO SECTION: CINEMATIC INDUSTRIAL --- */}
                    <div className="relative pt-32 pb-40 px-6 overflow-hidden">
                        {/* Background Technical Elements */}
                        <div className="absolute inset-0 z-0">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#1e293b_0%,_transparent_70%)] opacity-50" />
                            <div className="absolute inset-0" 
                                 style={{ 
                                     backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`, 
                                     backgroundSize: '40px 40px',
                                     opacity: 0.15 
                                 }} 
                            />
                            {/* Animated Scanner Line */}
                            <motion.div 
                                animate={{ top: ["-10%", "110%"] }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-printing-blue/20 to-transparent z-10"
                            />
                        </div>

                        <div className="relative z-10 max-w-7xl mx-auto text-center">
                            {/* Industrial Badge */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="inline-flex items-center gap-4 px-5 py-2.5 rounded-full bg-printing-dark/40 backdrop-blur-md border border-white/5 mb-12 shadow-2xl"
                            >
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-printing-cyan animate-pulse" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-printing-magenta animate-pulse delay-75" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-printing-yellow animate-pulse delay-150" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 italic">
                                    ESTÁNDAR INDUSTRIAL CÓRDOVA
                                </span>
                            </motion.div>

                            {/* Main Nomenclature */}
                            <div className="relative mb-12 group">
                                <h1 className="flex flex-col items-center gap-2 select-none">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                        className="relative"
                                    >
                                        <span className="text-6xl sm:text-8xl md:text-9xl lg:text-[11rem] font-black leading-[0.8] tracking-[-0.04em] text-printing-dark italic uppercase">
                                            IMPRENTA
                                        </span>
                                        {/* Decorative Technical Line */}
                                        <div className="absolute -right-4 -top-4 w-12 h-12 border-t-2 border-r-2 border-printing-blue/20 rounded-tr-xl" />
                                        <div className="absolute -left-4 -bottom-4 w-12 h-12 border-b-2 border-l-2 border-printing-blue/20 rounded-bl-xl" />
                                    </motion.div>

                                    <motion.span 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                        className="text-gold-gradient text-5xl sm:text-7xl md:text-8xl lg:text-[8rem] font-black leading-none tracking-tight drop-shadow-2xl"
                                    >
                                        CÓRDOVA.
                                    </motion.span>
                                </h1>
                                
                                {/* Micro telemetry details */}
                                <div className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-32 text-left opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                                    <p className="font-mono text-[8px] uppercase tracking-widest text-slate-400 leading-relaxed">
                                        precision_index: 0.9997<br />
                                        ink_viscosity: stable<br />
                                        matrix_alignment: optimal<br />
                                        cordoba_arts_coord: 1827.55A
                                    </p>
                                </div>
                            </div>
                            
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 0.8, duration: 1 }}
                                className="text-slate-400 font-medium text-lg md:text-xl max-w-2xl mx-auto tracking-wide mb-16 leading-relaxed"
                            >
                                Ingeniería visual y manufactura de precisión para marcas que lideran la industria global.
                            </motion.p>

                            {/* Actions */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, delay: 0.9 }}
                                className="flex flex-col sm:flex-row items-center justify-center gap-10"
                            >
                                <motion.a
                                    href={generateWhatsAppLink("593993083943", "Solicitud de protocolo industrial IMPRENTA CORDOVA.")}
                                    whileHover={{ scale: 1.05, y: -4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full sm:w-auto relative group overflow-hidden bg-printing-blue text-white px-8 sm:px-16 py-5 sm:py-7 rounded-2xl font-black uppercase tracking-[0.5em] text-[10px] sm:text-[11px] shadow-[0_20px_50px_rgba(0,71,171,0.3)] flex items-center justify-center gap-6 italic transition-all duration-700"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out" />
                                    <span className="relative z-10">INICIAR PROYECTO</span> 
                                    <ChevronRightIcon className="w-5 h-5 relative z-10 group-hover:translate-x-3 transition-transform duration-700" />
                                </motion.a>

                                <motion.button
                                    onClick={() => document.getElementById('vision')?.scrollIntoView({ behavior: 'smooth' })}
                                    whileHover={{ scale: 1.05, y: -4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full sm:w-auto bg-printing-dark/5 backdrop-blur-3xl text-printing-dark px-8 sm:px-16 py-5 sm:py-7 rounded-2xl font-black uppercase tracking-[0.5em] text-[10px] sm:text-[11px] flex items-center justify-center gap-6 group border border-printing-dark/10 hover:border-printing-blue/40 hover:bg-white transition-all duration-700 italic"
                                >
                                    EXPLORAR CAPACIDADES <LayoutIcon className="w-5 h-5 opacity-40 group-hover:rotate-45 transition-transform duration-700" />
                                </motion.button>
                            </motion.div>
                        </div>
                        
                        {/* Scroll Indicator */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1.5 }}
                            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
                        >
                            <div className="w-[1px] h-20 bg-gradient-to-b from-printing-blue/60 via-printing-blue/10 to-transparent relative">
                                <motion.div 
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute left-1/2 -translate-x-1/2 w-1.5 h-4 bg-printing-blue rounded-full shadow-[0_0_15px_rgba(0,71,171,0.5)]"
                                />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 tracking-[1em] uppercase italic">Desplazar</span>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* --- SECTION: THE VISION (DYNAMIC SHOWCASE) --- */}
            <section id="vision" className="relative py-32 lg:py-60 bg-white">
                <div className="max-w-[90rem] mx-auto px-6 lg:px-16 grid lg:grid-cols-[1fr_1.2fr] gap-16 lg:gap-24 items-start">
                    
                    {/* Fixed Monolith Preview */}
                    <div className="sticky top-20 lg:top-32 h-[45vh] lg:h-[75vh] rounded-[2rem] lg:rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 bg-slate-50 relative group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-printing-blue/5 to-printing-blue/10 z-10" />
                        
                        {/* Interactive Scan Effect */}
                        <motion.div 
                            animate={{ top: ['-10%', '110%'] }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 w-full h-[1px] bg-printing-blue/30 shadow-[0_0_15px_rgba(0,71,171,0.2)] z-20 pointer-events-none"
                        />
                        
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={Math.round(imageIndex.get())}
                                src={images[Math.min(Math.round(imageIndex.get()), 2)]}
                                style={{ y: imageY }}
                                initial={{ opacity: 0, scale: 1.15, filter: "brightness(1) blur(15px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "brightness(1) blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.95, filter: "brightness(1) blur(15px)" }}
                                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000"
                            />
                        </AnimatePresence>

                        {/* HUD Elements */}
                        <div className="absolute top-10 left-10 z-20 font-mono text-[8px] text-printing-dark/30 tracking-[0.4em]">
                            <p>SOURCE: CORDOVA_STATION_0x{Math.round(imageIndex.get()) + 1}</p>
                            <p>SIGNAL: OPTIMAL</p>
                        </div>

                        <div className="absolute bottom-12 left-12 z-30 space-y-4 text-printing-dark">
                            <motion.div 
                                key={`label-${Math.round(imageIndex.get())}`}
                                initial={{ x: -30, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="flex flex-col gap-3"
                            >
                                <span className="text-[9px] font-black text-printing-blue uppercase tracking-[0.8em] italic">Capacidad Activa</span>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-[-0.04em] leading-none">
                                    {Math.round(imageIndex.get()) === 0 ? 'LOGÍSTICA SRI' : 
                                     Math.round(imageIndex.get()) === 1 ? 'ALTA ESTAMPACIÓN' : 'DIMENSIÓN INDUSTRIAL'}
                                </h3>
                            </motion.div>
                        </div>
                    </div>

                    {/* Scrolling Narrative Content */}
                    <div className="space-y-24 lg:space-y-48 py-10 relative">
                        {/* CENTRAL_FISCAL */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ margin: "-25%" }}
                            className="space-y-8 pl-6 border-l-2 border-printing-blue/10"
                        >
                            <div className="flex items-center gap-6">
                                <span className="text-[12px] font-black uppercase tracking-[0.8em] text-printing-blue italic">01_FISCAL</span>
                                <div className="flex-1 h-[1px] bg-slate-100" />
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black tracking-[-0.04em] text-printing-dark italic uppercase leading-[0.9]">
                                AUTORIDAD <br/> <span className="text-printing-blue not-italic">TRIBUTARIA.</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                                Manufactura certificada de comprobantes físicos bajo normativas estrictas del SRI. Seguridad absoluta en la gestión de sus documentos legales.
                            </p>
                            <div className="flex gap-4">
                                <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <span className="text-xl font-black text-printing-dark italic">+1M</span>
                                    <p className="text-[7px] text-slate-400 uppercase tracking-widest mt-1">Folios Emitidos</p>
                                </div>
                                <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                    <span className="text-xl font-black text-printing-dark italic">100%</span>
                                    <p className="text-[7px] text-slate-400 uppercase tracking-widest mt-1">Legalidad SRI</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* ELITE_BRANDING */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ margin: "-25%" }}
                            className="space-y-8 pl-6 border-l-2 border-printing-magenta/10"
                        >
                            <div className="flex items-center gap-6">
                                <span className="text-[12px] font-black uppercase tracking-[0.8em] text-printing-magenta italic">02_ATELIER</span>
                                <div className="flex-1 h-[1px] bg-slate-100" />
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black tracking-[-0.04em] text-printing-dark italic uppercase leading-[0.9]">
                                IDENTIDAD <br/> <span className="text-printing-magenta not-italic">SUPREMA.</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                                Acabados de lujo para marcas que no aceptan menos que la perfección. Sectorizado UV, laminados premium y troquelados de alta precisión.
                            </p>
                            <motion.a 
                                href={generateWhatsAppLink("593993083943", "Consulta para branding premium CÓRDOVA.")}
                                whileHover={{ x: 15 }}
                                className="inline-flex items-center gap-5 text-printing-magenta font-black uppercase tracking-widest text-[10px] group"
                            >
                                Ver Muestrario Elite <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                            </motion.a>
                        </motion.div>

                        {/* MASSIVE_INDUSTRIAL */}
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ margin: "-25%" }}
                            className="space-y-8 pl-6 border-l-2 border-printing-yellow/20"
                        >
                            <div className="flex items-center gap-6">
                                <span className="text-[12px] font-black uppercase tracking-[0.8em] text-printing-yellow italic">03_FACTORY</span>
                                <div className="flex-1 h-[1px] bg-slate-100" />
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black tracking-[-0.04em] text-printing-dark italic uppercase leading-[0.9]">
                                ESCALA <br/> <span className="text-printing-yellow not-italic">INDUSTRIAL.</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                                Gran formato con durabilidad extrema. Señalética, vallas y publicidad exterior con tintas de alta resistencia y colores vibrantes.
                            </p>
                            <div className="pt-6">
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    className="px-10 py-5 border border-printing-yellow/30 text-printing-yellow rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-printing-yellow hover:text-white transition-all flex items-center gap-4 italic"
                                >
                                    <RocketLaunchIcon className="w-5 h-5" /> Cotizar Gran Formato
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- SECTION: CONTROL CENTER (TRACKING) --- */}
            <section className="py-40 lg:py-60 bg-printing-gray relative overflow-hidden">
                {/* Decorative Background Grid */}
                <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#0047ab 1px, transparent 1px), linear-gradient(90deg, #0047ab 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
                
                <div className="max-w-[100rem] mx-auto px-6 lg:px-8 relative z-10">
                    <div className="bg-white border border-slate-200 rounded-[2rem] md:rounded-[5rem] p-8 md:p-16 lg:p-32 grid xl:grid-cols-2 gap-16 xl:gap-32 items-center shadow-2xl relative overflow-hidden">
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
                        <h2 className="text-5xl md:text-9xl font-black text-slate-100 italic uppercase tracking-[-0.06em] select-none">
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

