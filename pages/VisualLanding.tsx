import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { 
    ChevronRightIcon, WhatsAppIcon, PaletteIcon, 
    ShieldCheckIcon, ClockIcon, CheckCircleIcon,
    FileTextIcon, SearchIcon, LayoutIcon, ActivityIcon,
    LayersIcon, HandRaisedIcon, StarIcon, CheckBadgeIcon,
    ZapIcon, RocketLaunchIcon
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
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-liquid-gold selection:text-brand-dark overflow-x-hidden">
            <SEO 
                title="Imprenta Córdova | Soluciones SRI y Artes Gráficas Premium"
                description="Imprenta autorizada por el SRI en Ecuador. Especialistas en talonarios, facturas y branding empresarial de alta gama."
            />
            <Navbar />

            {/* --- SECCIÓN 1: HERO IMPACTO --- */}
            <header className="relative h-[100vh] flex items-center justify-center overflow-hidden bg-[#020617]">
                <motion.div 
                    style={{ opacity: heroOpacity, scale: heroScale }}
                    className="absolute inset-0 z-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] z-10" />
                    <img 
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80" 
                        alt="Hero Background" 
                        className="w-full h-full object-cover opacity-20 grayscale"
                    />
                </motion.div>

                <div className="relative z-20 text-center space-y-8 max-w-7xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="space-y-4"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[1em] text-liquid-gold block mb-4">
                            Autorización SRI • Estándar Elite
                        </span>
                        <h1 className="text-6xl md:text-9xl lg:text-[12rem] font-black leading-[0.8] tracking-tighter text-white italic uppercase select-none">
                            IMPRENTA <br/> 
                            <span className="text-liquid-gold not-italic">CÓRDOVA.</span>
                        </h1>
                    </motion.div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12">
                        <motion.a
                            href={generateWhatsAppLink("593993083943", "Hola, necesito solicitar talonarios autorizados por el SRI.")}
                            whileHover={{ scale: 1.05, y: -5, boxShadow: "0px 30px 60px rgba(212, 175, 55, 0.25)" }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto bg-liquid-gold text-brand-dark px-12 py-7 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-4 group"
                        >
                            Talonarios SRI <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </motion.a>

                        <motion.a
                            href="#showcase"
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto bg-white/5 backdrop-blur-xl text-white px-12 py-7 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-4 group border border-white/10"
                        >
                            Explorar <LayoutIcon className="w-5 h-5 opacity-50 group-hover:rotate-12 transition-transform" />
                        </motion.a>
                    </div>
                </div>
            </header>

            {/* --- SECCIÓN 2: SHOWCASE DINÁMICO (Cambio de imágenes con scroll) --- */}
            <section id="showcase" className="relative py-40 md:py-60 bg-[#020617]">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-20 items-center">
                    
                    {/* Contenedor de Imagen Fija que cambia */}
                    <div className="sticky top-40 h-[60vh] md:h-[80vh] rounded-[4rem] overflow-hidden shadow-gold-glow-sm border-[1px] border-white/10 bg-black/40 backdrop-blur-3xl">
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={Math.round(imageIndex.get())}
                                src={images[Math.min(Math.round(imageIndex.get()), 2)]}
                                style={{ y: imageY }}
                                initial={{ opacity: 0, scale: 1.15, filter: "blur(10px)" }}
                                animate={{ opacity: 1, scale: 1.05, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full h-full object-cover"
                            />
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#001f3f]/40 to-transparent pointer-events-none" />
                        
                        {/* Indicador de Categoría sobre la imagen */}
                        <div className="absolute bottom-10 left-10 z-10">
                            <motion.span 
                                key={Math.round(imageIndex.get())}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="px-6 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-[#001f3f]"
                            >
                                {Math.round(imageIndex.get()) === 0 ? 'Documentación SRI' : 
                                 Math.round(imageIndex.get()) === 1 ? 'Branding Corporativo' : 'Gran Formato'}
                            </motion.span>
                        </div>
                    </div>

                    {/* Texto que acompaña al scroll */}
                    <div className="space-y-32 py-20">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.8em] text-liquid-gold">Infraestructura Legal</span>
                            <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-none">
                                PODER <br/> <span className="text-liquid-gold not-italic">SRI.</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-lg md:text-xl leading-relaxed">
                                Autorizados para emitir toda la gama de comprobantes físicos. Papel químico de alta transferencia y acabados de seguridad para la protección de sus datos fiscales.
                            </p>
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                className="px-8 py-4 bg-white/5 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-liquid-gold hover:text-brand-dark transition-all border border-white/10"
                            >
                                Ver Requisitos
                            </motion.button>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.8em] text-emerald-500">Identidad Visual</span>
                            <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-none">
                                DISEÑO <br/> <span className="text-emerald-500 not-italic">ELITE.</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-lg md:text-xl leading-relaxed">
                                Tarjetas de presentación con acabados especiales, volantes de alta definición y papelería corporativa que proyecta la seriedad de su marca.
                            </p>
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                className="px-8 py-4 bg-white/5 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-500 hover:text-black transition-all border border-white/10"
                            >
                                Portafolio Branding
                            </motion.button>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.8em] text-blue-500">Impacto Masivo</span>
                            <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white italic uppercase leading-none">
                                ESCALA <br/> <span className="text-blue-500 not-italic">TOTAL.</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-lg md:text-xl leading-relaxed">
                                Impresión en gran formato, gigantografías, vinilos y señalética industrial con tintas resistentes a la intemperie y máxima fidelidad de color.
                            </p>
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                className="px-8 py-4 bg-white/5 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-500 hover:text-white transition-all border border-white/10"
                            >
                                Cotizar Gran Formato
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 3: RASTREO (CENTRO DE CONTROL) --- */}
            <section className="py-24 md:py-40 bg-brand-dark relative overflow-hidden border-t border-white/5">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-liquid-gold/5 mix-blend-overlay" />
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-[20%] -right-[10%] w-[80%] h-[80%] border border-liquid-gold/5 rounded-full"
                    />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8 text-center lg:text-left">
                        <h3 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                            RASTREO <br/> <span className="text-liquid-gold not-italic">SATELITAL.</span>
                        </h3>
                        <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl">
                            Transparencia total en el proceso de manufactura. Verifique el estado de su orden mediante nuestro Centro de Control de Telemetría.
                        </p>
                        <div className="flex justify-center lg:justify-start">
                            <motion.a 
                                href="#/tracking"
                                whileHover={{ scale: 1.05, x: 10 }}
                                className="bg-liquid-gold text-brand-dark px-12 py-6 rounded-full font-black uppercase tracking-widest text-[11px] shadow-gold-glow flex items-center gap-4"
                            >
                                Abrir Panel de Control <ActivityIcon className="w-5 h-5" />
                            </motion.a>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 font-mono text-[11px] space-y-6 shadow-gold-glow-sm">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/30" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/30" />
                            <div className="w-3 h-3 rounded-full bg-green-500/30" />
                        </div>
                        <div className="space-y-4 text-liquid-gold/70">
                            <p className="flex items-center gap-3"><span className="text-white/10">01</span> {">"} CONEXIÓN_ESTABLECIDA_CON_PRODUCCIÓN...</p>
                            <p className="flex items-center gap-3"><span className="text-white/10">02</span> {">"} ESTADO: PROCESANDO_ACABADOS_FINALES</p>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-6">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '92%' }}
                                    transition={{ duration: 3, ease: "easeOut" }}
                                    className="h-full bg-liquid-gold shadow-[0_0_20px_rgba(212,175,55,0.6)]"
                                />
                            </div>
                            <p className="text-liquid-gold font-bold tracking-[0.3em] pt-4 animate-pulse uppercase">Progreso: 92% - Listo para Despacho</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 text-center bg-[#020617] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 space-y-12">
                    <div className="flex justify-center gap-12">
                        <motion.a href={generateWhatsAppLink("593993083943", "Hola!")} whileHover={{ y: -5, textShadow: "0 0 10px rgba(212,175,55,0.5)" }} className="text-liquid-gold font-black uppercase text-[10px] tracking-widest transition-all">WhatsApp</motion.a>
                        <motion.a href="#/login" whileHover={{ y: -5 }} className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Intranet</motion.a>
                        <motion.a href="#/tracking" whileHover={{ y: -5 }} className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Rastreo</motion.a>
                    </div>
                    <p className="text-slate-700 font-bold uppercase text-[9px] tracking-[1em]">Imprenta Córdova • Ecuador</p>
                </div>
            </footer>

            {/* Floating Action */}
            <motion.a 
                href={generateWhatsAppLink("593993083943", "Hola Imprenta Córdova!")}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-10 right-10 z-50 bg-[#25D366] text-white p-6 rounded-full shadow-gold-glow flex items-center justify-center"
            >
                <WhatsAppIcon className="w-8 h-8" />
            </motion.a>

        </div>
    );
};

export default VisualLanding;
