import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
    ChevronRightIcon, WhatsAppIcon, PaletteIcon, 
    ShieldCheckIcon, ClockIcon, CheckCircleIcon,
    FileTextIcon, SearchIcon, LayoutIcon, ActivityIcon,
    LayersIcon, HandRaisedIcon, StarIcon, CheckBadgeIcon,
    ZapIcon, RocketLaunchIcon, CpuIcon, BoltIcon
} from '../components/Icons';
import { generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import Navbar from '../components/Navbar';

const VisualLanding: React.FC = () => {
    const { scrollYProgress } = useScroll();
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
    
    // Transformaciones para el fondo dinámico
    const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);
    const heroScale = useTransform(smoothProgress, [0, 0.2], [1, 1.1]);
    const heroY = useTransform(smoothProgress, [0, 0.2], ["0%", "20%"]);
    
    // Lógica para cambio de imágenes con el scroll
    const images = [
        'https://i.imgur.com/bKbCyj2.png', // Logo / Identidad
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80', // Digital Design
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80'  // Industrial Precision
    ];
    
    // Determinamos qué imagen mostrar basada en el progreso del scroll
    const imageIndex = useTransform(smoothProgress, [0.1, 0.4, 0.7, 1], [0, 1, 2, 2]);
    const imageY = useTransform(smoothProgress, [0.1, 1], ["0%", "-10%"]); // Parallax sutil

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-liquid-gold selection:text-black overflow-x-hidden relative">
            <SEO 
                title="Imprenta Córdova | Soluciones SRI y Artes Gráficas Premium"
                description="Imprenta autorizada por el SRI en Ecuador. Especialistas en talonarios, facturas y branding empresarial de alta gama."
            />
            
            {/* --- GLOBAL ELITE BACKGROUND --- */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #d4af37 1.5px, transparent 1.5px)', backgroundSize: '48px 48px' }} />
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-liquid-gold/5 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[10%] right-[10%] w-[800px] h-[800px] bg-brand-red/5 blur-[150px] rounded-full mix-blend-screen" />
            </div>

            {/* --- VERTICAL LASER GUIDES --- */}
            <div className="fixed top-0 left-[5%] w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent z-0 hidden lg:block" />
            <div className="fixed top-0 right-[5%] w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent z-0 hidden lg:block" />

            <Navbar />

            {/* --- SECCIÓN 1: HERO IMPACTO (TERMINAL AESTHETIC) --- */}
            <header className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
                <motion.div 
                    style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black z-10" />
                    <img 
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80" 
                        alt="Hero Background" 
                        className="w-full h-full object-cover opacity-30 grayscale mix-blend-luminosity"
                    />
                </motion.div>

                {/* Decorative Telemetry HUD */}
                <div className="absolute top-1/4 left-[8%] hidden 2xl:flex flex-col gap-4 text-[8px] font-mono text-liquid-gold/40 tracking-[0.4em] uppercase">
                    <span>SYS.ONLINE // 99.9%</span>
                    <span>AUTH: SRI_VALID</span>
                    <span>PROTOCOLO: ELITE_V4</span>
                    <div className="w-[1px] h-20 bg-liquid-gold/20 mt-4" />
                </div>

                <div className="absolute bottom-1/4 right-[8%] hidden 2xl:flex flex-col items-end gap-4 text-[8px] font-mono text-brand-red/40 tracking-[0.4em] uppercase text-right">
                    <span>SECURE_PRINT</span>
                    <span>LATENCY: 12MS</span>
                    <span>CORE: ACTIVE</span>
                    <div className="w-[1px] h-20 bg-brand-red/20 mt-4" />
                </div>

                <div className="relative z-20 text-center space-y-12 max-w-[90rem] px-6 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-4 px-6 py-2 border border-liquid-gold/20 bg-liquid-gold/5 rounded-full mb-6">
                            <div className="w-2 h-2 rounded-full bg-liquid-gold animate-pulse shadow-gold-glow" />
                            <span className="text-[9px] font-black uppercase tracking-[0.8em] text-liquid-gold italic">
                                Sistema Industrial Autorizado
                            </span>
                        </div>
                        
                        <h1 className="text-[5rem] sm:text-[7rem] md:text-[10rem] lg:text-[13rem] font-black leading-[0.75] tracking-tighter text-white italic uppercase select-none relative group">
                            IMPRENTA <br/> 
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-liquid-gold via-yellow-200 to-liquid-gold not-italic relative z-10 drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                                CÓRDOVA.
                            </span>
                            {/* Glow effect behind text */}
                            <div className="absolute inset-0 bg-liquid-gold/10 blur-[100px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        </h1>
                        
                        <p className="text-slate-400 font-medium text-lg md:text-2xl max-w-3xl mx-auto tracking-wide mt-8">
                            Manufactura de precisión para corporaciones exigentes.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-16"
                    >
                        <motion.a
                            href={generateWhatsAppLink("593993083943", "Hola, necesito iniciar una misión de impresión.")}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:w-auto relative group overflow-hidden bg-liquid-gold text-black px-14 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[12px] shadow-gold-glow-strong flex items-center justify-center gap-6 italic"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                            <span className="relative z-10">Iniciar Protocolo</span> 
                            <ChevronRightIcon className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform" />
                        </motion.a>

                        <motion.button
                            onClick={() => document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:w-auto bg-white/5 backdrop-blur-xl text-white px-14 py-8 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[12px] flex items-center justify-center gap-6 group border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all italic"
                        >
                            Explorar Capacidades <LayoutIcon className="w-5 h-5 opacity-50 group-hover:rotate-12 transition-transform" />
                        </motion.button>
                    </motion.div>
                </div>
                
                {/* Scroll Indicator */}
                <motion.div 
                    animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                    <span className="text-[8px] font-mono text-slate-500 tracking-[0.5em] uppercase">Scroll</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-white/30 to-transparent" />
                </motion.div>
            </header>

            {/* --- SECCIÓN 2: SHOWCASE DINÁMICO (3 PILARES NARRATIVOS) --- */}
            <section id="showcase" className="relative py-40 md:py-60 bg-black">
                <div className="max-w-[90rem] mx-auto px-6 lg:px-12 grid lg:grid-cols-[1fr_1.2fr] gap-20 lg:gap-32 items-center">
                    
                    {/* Contenedor de Imagen Fija que cambia (HUD Style) */}
                    <div className="sticky top-40 h-[60vh] md:h-[80vh] rounded-[3rem] overflow-hidden shadow-gold-glow border border-white/10 bg-black/80 backdrop-blur-3xl group">
                        {/* Scanning Beam */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-liquid-gold/50 shadow-[0_0_20px_#d4af37] animate-scan pointer-events-none z-20" />
                        
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={Math.round(imageIndex.get())}
                                src={images[Math.min(Math.round(imageIndex.get()), 2)]}
                                style={{ y: imageY }}
                                initial={{ opacity: 0, scale: 1.15, filter: "blur(20px)" }}
                                animate={{ opacity: 0.6, scale: 1.05, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
                                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full h-full object-cover mix-blend-screen"
                            />
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />
                        
                        {/* Target Crosshairs */}
                        <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-white/20 z-20" />
                        <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-white/20 z-20" />
                        <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-white/20 z-20" />
                        <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-white/20 z-20" />

                        {/* Indicador de Categoría sobre la imagen */}
                        <div className="absolute bottom-12 left-12 z-30 space-y-4">
                            <motion.div 
                                key={`badge-${Math.round(imageIndex.get())}`}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="flex items-center gap-4"
                            >
                                <div className="w-12 h-12 bg-liquid-gold/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-liquid-gold/30 text-liquid-gold">
                                    {Math.round(imageIndex.get()) === 0 ? <ShieldCheckIcon className="w-6 h-6"/> : 
                                     Math.round(imageIndex.get()) === 1 ? <PaletteIcon className="w-6 h-6"/> : <LayoutIcon className="w-6 h-6"/>}
                                </div>
                                <div>
                                    <p className="text-[8px] font-mono text-liquid-gold uppercase tracking-[0.4em]">Sector Activo</p>
                                    <p className="text-xl font-black text-white tracking-widest uppercase italic">
                                        {Math.round(imageIndex.get()) === 0 ? 'Documentación SRI' : 
                                         Math.round(imageIndex.get()) === 1 ? 'Branding Corp' : 'Gran Formato'}
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Texto que acompaña al scroll (3 PILARES) */}
                    <div className="space-y-40 py-20 relative">
                        {/* Línea conectora */}
                        <div className="absolute left-0 top-0 w-[1px] h-full bg-white/5 hidden lg:block" />

                        {/* 0x_FISCAL */}
                        <motion.div 
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ margin: "-20%" }}
                            className="space-y-8 lg:pl-16 relative"
                        >
                            <div className="absolute top-0 -left-[1.5px] w-[3px] h-32 bg-liquid-gold hidden lg:block shadow-gold-glow" />
                            <div className="flex items-center gap-6">
                                <span className="text-[12px] font-black uppercase tracking-[0.8em] text-liquid-gold italic">0x_FISCAL</span>
                                <div className="flex-1 h-[1px] bg-white/5" />
                            </div>
                            <h2 className="text-5xl md:text-7xl lg:text-[6rem] font-black tracking-tighter text-white italic uppercase leading-[0.85]">
                                AUTORIDAD <br/> <span className="text-liquid-gold not-italic">TRIBUTARIA.</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-xl leading-relaxed">
                                Manufactura certificada de comprobantes físicos bajo normativas estrictas del SRI. Utilizamos papel químico de alta transferencia (original y copias) con numeración de seguridad infalible.
                            </p>
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <span className="block text-3xl font-black text-white italic mb-2">10+</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Años de Autorización</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <span className="block text-3xl font-black text-white italic mb-2">100%</span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Cumplimiento Legal</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* 0x_ELITE */}
                        <motion.div 
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ margin: "-20%" }}
                            className="space-y-8 lg:pl-16 relative"
                        >
                            <div className="absolute top-0 -left-[1.5px] w-[3px] h-32 bg-emerald-500 hidden lg:block shadow-emerald-glow" />
                            <div className="flex items-center gap-6">
                                <span className="text-[12px] font-black uppercase tracking-[0.8em] text-emerald-500 italic">0x_ELITE</span>
                                <div className="flex-1 h-[1px] bg-white/5" />
                            </div>
                            <h2 className="text-5xl md:text-7xl lg:text-[6rem] font-black tracking-tighter text-white italic uppercase leading-[0.85]">
                                BRANDING <br/> <span className="text-emerald-500 not-italic">PREMIUM.</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-xl leading-relaxed">
                                Eleve la percepción de su marca. Ofrecemos tarjetas de presentación con laminado mate, sectorizado UV, panfletos de alto gramaje y papelería corporativa que domina el mercado.
                            </p>
                            <ul className="space-y-4 pt-4">
                                {['Acabados UV Sectorizado', 'Laminados Especiales', 'Troquelado de Precisión'].map(item => (
                                    <li key={item} className="flex items-center gap-4 text-sm font-bold text-slate-300 uppercase tracking-widest">
                                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" /> {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* 0x_MASSIVE */}
                        <motion.div 
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ margin: "-20%" }}
                            className="space-y-8 lg:pl-16 relative"
                        >
                            <div className="absolute top-0 -left-[1.5px] w-[3px] h-32 bg-brand-red hidden lg:block shadow-red-glow" />
                            <div className="flex items-center gap-6">
                                <span className="text-[12px] font-black uppercase tracking-[0.8em] text-brand-red italic">0x_MASSIVE</span>
                                <div className="flex-1 h-[1px] bg-white/5" />
                            </div>
                            <h2 className="text-5xl md:text-7xl lg:text-[6rem] font-black tracking-tighter text-white italic uppercase leading-[0.85]">
                                ESCALA <br/> <span className="text-brand-red not-italic">TOTAL.</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-xl leading-relaxed">
                                Conquiste el espacio público. Gigantografías, vinilos adhesivos, microperforados y señalética industrial. Utilizamos tintas eco-solventes de máxima resistencia a la intemperie.
                            </p>
                            <motion.a 
                                href={generateWhatsAppLink("593993083943", "Cotizar trabajo en gran formato.")}
                                whileHover={{ scale: 1.05 }}
                                className="inline-flex px-10 py-5 border-2 border-brand-red/30 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-brand-red hover:border-brand-red transition-all items-center gap-4"
                            >
                                <ZapIcon className="w-5 h-5" /> Cotizar Gran Formato
                            </motion.a>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 3: RASTREO (CENTRO DE CONTROL / HUD) --- */}
            <section className="py-32 md:py-48 bg-[#020617] relative overflow-hidden border-t border-white/10">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[50%] -right-[20%] w-[120%] h-[120%] border-[2px] border-dashed border-liquid-gold/5 rounded-full"
                    />
                </div>

                <div className="max-w-[90rem] mx-auto px-6 relative z-10">
                    <div className="bg-black/60 backdrop-blur-3xl border border-liquid-gold/20 rounded-[4rem] p-10 md:p-20 grid xl:grid-cols-2 gap-20 shadow-[0_0_100px_rgba(212,175,55,0.05)] overflow-hidden relative">
                        {/* Ambient Glow inside the card */}
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-liquid-gold/10 to-transparent pointer-events-none" />
                        
                        <div className="space-y-12 relative z-10">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                                    <ActivityIcon className="w-4 h-4 text-liquid-gold" />
                                    <span className="text-[10px] font-mono text-liquid-gold tracking-[0.5em] uppercase">Módulo de Telemetría</span>
                                </div>
                                <h3 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                                    RASTREO <br/> <span className="text-liquid-gold not-italic">SATELITAL.</span>
                                </h3>
                                <p className="text-slate-400 font-medium text-xl max-w-xl">
                                    Eliminamos la incertidumbre. Supervise el estado de su orden en tiempo real a través de nuestro Centro de Control, desde la pre-prensa hasta el despacho.
                                </p>
                            </div>
                            
                            <motion.a 
                                href="#/tracking"
                                whileHover={{ scale: 1.05, x: 10 }}
                                className="inline-flex bg-liquid-gold text-black px-14 py-8 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[12px] shadow-gold-glow-strong items-center gap-6 italic"
                            >
                                <RocketLaunchIcon className="w-6 h-6" /> Abrir Consola
                            </motion.a>
                        </div>

                        {/* Terminal UI Mockup */}
                        <div className="bg-[#050505] border border-white/10 rounded-[2.5rem] p-8 font-mono text-[11px] md:text-xs space-y-6 shadow-2xl relative z-10 flex flex-col justify-center">
                            <div className="flex gap-2 mb-4 border-b border-white/5 pb-6">
                                <div className="w-3 h-3 rounded-full bg-brand-red/50 shadow-[0_0_10px_#ef4444]" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50 shadow-[0_0_10px_#eab308]" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/50 shadow-[0_0_10px_#10b981]" />
                                <span className="ml-auto text-slate-600 font-black tracking-widest uppercase">TRACKING_NODE_v1.0</span>
                            </div>
                            
                            <div className="space-y-4 text-liquid-gold/80 flex-1">
                                <p className="flex items-center gap-4"><span className="text-white/20 w-8">01</span> <span className="text-emerald-500">{">"}</span> INITIALIZING_QUERY_ENGINE...</p>
                                <p className="flex items-center gap-4"><span className="text-white/20 w-8">02</span> <span className="text-emerald-500">{">"}</span> ORDEN_ENCONTRADA: #CMD-89X</p>
                                <p className="flex items-center gap-4"><span className="text-white/20 w-8">03</span> <span className="text-emerald-500">{">"}</span> ESTADO_ACTUAL: <span className="bg-liquid-gold text-black px-2 rounded font-bold">PRODUCCIÓN</span></p>
                                <p className="flex items-center gap-4 opacity-50"><span className="text-white/20 w-8">04</span> <span className="text-emerald-500">{">"}</span> FASE_SIGUIENTE: ACABADOS_FINALES</p>
                                
                                <div className="mt-10 p-6 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-liquid-gold/30 animate-scan pointer-events-none" />
                                    <div className="flex justify-between text-[10px] mb-4 text-white font-bold tracking-widest">
                                        <span>PROGRESO_MISION</span>
                                        <span className="text-liquid-gold">92%</span>
                                    </div>
                                    <div className="w-full bg-black h-3 rounded-full overflow-hidden border border-white/10">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '92%' }}
                                            transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                                            className="h-full bg-gradient-to-r from-liquid-gold/50 to-liquid-gold shadow-gold-glow relative"
                                        >
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdHRlcm4gaWQ9ImIiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMTBoMTBWMEgweiIgZmlsbD0icmdiYSgyNTUsIDI1NSLCAyNTUsIDAuMSkiLz48L3BhdHRlcm4+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJ1cmwoI2IpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-20" />
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ELITE FOOTER --- */}
            <footer className="py-24 text-center bg-black border-t border-white/10 relative overflow-hidden">
                {/* Footer Glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-liquid-gold/5 blur-[150px] pointer-events-none" />
                
                <div className="max-w-[90rem] mx-auto px-6 space-y-16 relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter opacity-20">IMPRENTA CÓRDOVA</h2>
                    
                    <div className="flex flex-wrap justify-center gap-10 md:gap-20">
                        <motion.a href={generateWhatsAppLink("593993083943", "Hola!")} whileHover={{ y: -5 }} className="text-liquid-gold font-black uppercase text-[11px] tracking-[0.4em] transition-all flex items-center gap-3 hover:text-white"><WhatsAppIcon className="w-5 h-5"/> Contacto Directo</motion.a>
                        <motion.a href="#/login" whileHover={{ y: -5 }} className="text-slate-500 font-black uppercase text-[11px] tracking-[0.4em] hover:text-white transition-all flex items-center gap-3"><ShieldCheckIcon className="w-5 h-5"/> Intranet Auth</motion.a>
                        <motion.a href="#/tracking" whileHover={{ y: -5 }} className="text-slate-500 font-black uppercase text-[11px] tracking-[0.4em] hover:text-white transition-all flex items-center gap-3"><ActivityIcon className="w-5 h-5"/> Telemetría</motion.a>
                    </div>
                    
                    <div className="pt-10 border-t border-white/5 flex flex-col items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center opacity-50">
                            <CpuIcon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-slate-600 font-black uppercase text-[9px] tracking-[0.8em]">
                            Diseñado en Machala, EC • Motor Industrial V4.0
                        </p>
                    </div>
                </div>
            </footer>

            {/* --- FLOATING ACTION (ELITE WHATSAPP) --- */}
            <motion.a 
                href={generateWhatsAppLink("593993083943", "Hola Imprenta Córdova! Necesito de sus servicios.")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-10 right-10 z-50 bg-black/80 backdrop-blur-xl border border-[#25D366]/30 text-[#25D366] p-4 pr-6 rounded-full shadow-[0_0_30px_rgba(37,211,102,0.2)] hover:shadow-[0_0_40px_rgba(37,211,102,0.4)] hover:bg-[#25D366]/10 flex items-center justify-center gap-4 transition-all group"
            >
                <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center text-black">
                    <WhatsAppIcon className="w-7 h-7" />
                </div>
                <span className="font-black uppercase tracking-widest text-[10px] hidden md:block">Canal de Ventas</span>
            </motion.a>
        </div>
    );
};

export default VisualLanding;
