
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { 
    ShieldCheckIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, CheckCircleIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, PrinterIcon, CheckBadgeIcon, ClockIcon,
    SparklesIcon, MessageCircleIcon, ChevronRightIcon,
    Loader2Icon, WhatsAppIcon, PaletteIcon, InfoIcon, UploadIcon, LockIcon,
    LayersIcon, QrCodeIcon, HandRaisedIcon, CpuIcon, ActivityIcon
} from '../components/Icons';
import { useData } from '../contexts/DataContext';
import { Producto, Trabajo } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import Navbar from '../components/Navbar';

// --- ATELIER PREMIUM COMPONENTS ---

const FloatingPaper: React.FC<{ delay?: number; x?: number; y?: number; rotate?: number; scale?: number }> = ({ 
    delay = 0, x = 0, y = 0, rotate = 0, scale = 1 
}) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8, x, y, rotate }}
        animate={{ 
            opacity: [0, 1, 1, 0],
            y: [y, y - 100],
            rotate: [rotate, rotate + 15],
            x: [x, x + (Math.random() * 40 - 20)]
        }}
        transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear", 
            delay,
        }}
        className="absolute pointer-events-none"
        style={{ zIndex: 5 }}
    >
        <div 
            className="w-32 h-40 bg-white shadow-2xl rounded-sm border border-slate-100 flex flex-col p-3 gap-2 origin-center"
            style={{ transform: `scale(${scale})` }}
        >
            <div className="w-full h-2 bg-blue-600/10 rounded-full" />
            <div className="w-2/3 h-1.5 bg-slate-100 rounded-full" />
            <div className="w-1/2 h-1.5 bg-slate-100 rounded-full" />
            <div className="mt-auto flex justify-between items-center">
                <div className="w-8 h-8 rounded-full border border-dashed border-slate-200" />
                <div className="w-10 h-3 bg-yellow-400/20 rounded-full" />
            </div>
        </div>
    </motion.div>
);

const ServiceCard: React.FC<{ title: string; subtitle: string; icon: any; color: string; href: string }> = ({ title, subtitle, icon: Icon, color, href }) => (
    <motion.div 
        whileHover={{ y: -10 }}
        className="group relative bg-white border border-slate-100 p-10 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all duration-700 overflow-hidden"
    >
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity ${color}`}>
            <Icon className="w-full h-full transform translate-x-10 -translate-y-10" />
        </div>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${color.replace('text-', 'bg-').replace('600', '50')} ${color}`}>
            <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-3xl font-display font-black italic tracking-tighter uppercase text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-400 font-editorial font-medium uppercase tracking-widest text-[10px] mb-8">{subtitle}</p>
        <Link to={href} className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 group-hover:text-blue-600 transition-colors">
            Explorar <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
        </Link>
    </motion.div>
);

const ProcessStep: React.FC<{ num: string; title: string; desc: string; isLast?: boolean }> = ({ num, title, desc, isLast }) => (
    <div className="flex gap-10 relative">
        {!isLast && <div className="absolute left-[23px] top-12 bottom-[-40px] w-px bg-slate-100" />}
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-lg flex items-center justify-center shrink-0 z-10 font-display font-black italic text-blue-600">
            {num}
        </div>
        <div className="pb-12">
            <h4 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 mb-2">{title}</h4>
            <p className="text-slate-500 font-editorial text-sm leading-relaxed max-w-sm">{desc}</p>
        </div>
    </div>
);

// --- MAIN LANDING ---

const VisualLanding: React.FC = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });
    
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
    
    // Parallax values
    const leftX = useTransform(smoothProgress, [0, 0.2], [0, -100]);
    const rightX = useTransform(smoothProgress, [0, 0.2], [0, 100]);
    const connectorScale = useTransform(smoothProgress, [0, 0.1], [1, 0]);
    const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);

    // Mouse movement for hero depth
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        mouseX.set((clientX / innerWidth) - 0.5);
        mouseY.set((clientY / innerHeight) - 0.5);
    };

    const xLeft = useTransform(mouseX, [-0.5, 0.5], [20, -20]);
    const yLeft = useTransform(mouseY, [-0.5, 0.5], [20, -20]);
    const xRight = useTransform(mouseX, [-0.5, 0.5], [-20, 20]);
    const yRight = useTransform(mouseY, [-0.5, 0.5], [-20, 20]);

    return (
        <div ref={containerRef} onMouseMove={handleMouseMove} className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
            <SEO 
                title="Imprenta Córdova | Alta Gama en Impresión"
                description="Líderes en documentos SRI y papelería corporativa de lujo en Ecuador. Pasaje, El Oro."
            />
            <Navbar />

            {/* --- HERO: THE DUAL FLOW SPLIT --- */}
            <section className="relative h-screen flex flex-col lg:flex-row overflow-hidden">
                
                {/* Background Decor (Parallax) */}
                <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] border-[100px] border-slate-900 rounded-full" />
                </motion.div>

                {/* FLOW 1: DOCUMENTOS SRI (Blue Focus) */}
                <motion.div 
                    style={{ x: leftX }}
                    className="flex-1 relative group overflow-hidden border-r border-slate-50"
                >
                    <motion.div style={{ x: xLeft, y: yLeft }} className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-transparent z-0 group-hover:opacity-100 opacity-0 transition-opacity duration-1000" />
                    
                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 lg:p-24 text-center space-y-10">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            className="inline-flex items-center gap-3 px-6 py-2 bg-blue-600/5 border border-blue-600/10 rounded-full text-blue-600"
                        >
                            <ShieldCheckIcon className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Gestión SRI Autorizada</span>
                        </motion.div>
                        
                        <h2 className="text-7xl lg:text-[9rem] font-display font-black italic tracking-tighter leading-[0.75] uppercase text-slate-900">
                            DOCK <br/> <span className="text-blue-600">S.R.I.</span>
                        </h2>
                        
                        <p className="text-slate-400 font-editorial font-light text-lg max-w-sm mx-auto leading-relaxed">
                            Facturación física y autorizaciones oficiales con papel químico de transferencia garantizada.
                        </p>
                        
                        <motion.button 
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(37, 99, 235, 0.2)" }} whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/catalog?cat=sri')}
                            className="px-14 py-7 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all flex items-center gap-6 group/btn"
                        >
                            <span>Comenzar Trámite</span>
                            <ArrowRightIcon className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                        </motion.button>
                        
                        {/* Floating Paper Elements (SRI Path) */}
                        <div className="absolute inset-0 pointer-events-none">
                            <FloatingPaper delay={0} x={100} y={400} rotate={-10} scale={0.7} />
                            <FloatingPaper delay={3} x={400} y={200} rotate={15} scale={0.9} />
                            <FloatingPaper delay={5} x={50} y={600} rotate={5} scale={0.6} />
                        </div>
                    </div>
                </motion.div>

                {/* FLOW 2: IMPRENTA GENERAL (Yellow/Red Focus) */}
                <motion.div 
                    style={{ x: rightX }}
                    className="flex-1 relative group overflow-hidden bg-[#FFFBEB]/30" 
                >
                    <motion.div style={{ x: xRight, y: yRight }} className="absolute inset-0 bg-gradient-to-bl from-yellow-100/30 via-transparent to-transparent z-0 group-hover:opacity-100 opacity-0 transition-opacity duration-1000" />
                    
                    <div className="relative z-10 h-full flex flex-col items-center justify-center p-12 lg:p-24 text-center space-y-10">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-3 px-6 py-2 bg-red-600/5 border border-red-600/10 rounded-full text-red-600"
                        >
                            <PaletteIcon className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Diseño & Branding</span>
                        </motion.div>
                        
                        <h2 className="text-7xl lg:text-[9rem] font-display font-black italic tracking-tighter leading-[0.75] uppercase text-slate-900">
                            ATELIER <br/> <span className="text-red-600">BRAND</span>
                        </h2>
                        
                        <p className="text-slate-400 font-editorial font-light text-lg max-w-sm mx-auto leading-relaxed">
                            Tarjetas de presentación de lujo, branding corporativo y acabados especiales para marcas elite.
                        </p>
                        
                        <motion.button 
                            whileHover={{ scale: 1.05, backgroundColor: "#0f172a", color: "#ffffff" }} whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/catalog?cat=general')}
                            className="px-14 py-7 bg-white border-2 border-slate-900 text-slate-900 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] transition-all flex items-center gap-6 group/btn shadow-xl"
                        >
                            <span>Explorar Catálogo</span>
                            <SparklesIcon className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                        </motion.button>

                        {/* Floating Paper Elements (Brand Path) */}
                        <div className="absolute inset-0 pointer-events-none">
                            <FloatingPaper delay={1} x={200} y={500} rotate={20} scale={0.8} />
                            <FloatingPaper delay={4} x={350} y={150} rotate={-5} scale={1.1} />
                        </div>
                    </div>
                </motion.div>

                {/* Central Visual Connector (Atelier Shield) */}
                <motion.div 
                    style={{ scale: connectorScale, opacity: heroOpacity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:block"
                >
                    <div className="w-36 h-36 bg-white rounded-full border border-slate-100 shadow-2xl flex items-center justify-center p-8 group cursor-pointer hover:scale-110 transition-transform relative">
                        <div className="absolute inset-0 bg-blue-600/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                        <CordovaLogo className="w-full h-full text-slate-900 group-hover:text-blue-600 transition-colors relative z-10" />
                    </div>
                </motion.div>

                {/* Scroll Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4"
                >
                    <span className="text-[8px] font-black uppercase tracking-[0.6em] text-slate-300">Scroll Down</span>
                    <div className="w-px h-12 bg-gradient-to-b from-slate-200 to-transparent" />
                </motion.div>
            </section>

            {/* --- PRODUCTS: REALISTIC VISUALIZATION (Yellow Accent) --- */}
            <section className="py-48 bg-[#FFFBEB]/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent" />
                
                <div className="container mx-auto px-8">
                    <div className="flex flex-col lg:flex-row gap-24 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="flex-1 relative"
                        >
                            <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.12)] border-[12px] border-white group">
                                <img src="/assets/sri-portfolio.png" className="w-full h-auto transform group-hover:scale-110 transition-transform duration-[4s] ease-out" alt="Premium SRI Mockup" />
                                <div className="absolute inset-0 bg-blue-600/5 mix-blend-overlay" />
                            </div>
                            <div className="absolute -top-16 -right-16 w-64 h-64 bg-yellow-400 rounded-full blur-[100px] opacity-20 animate-pulse" />
                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-10" />
                        </motion.div>
                        
                        <div className="flex-1 space-y-12">
                            <div className="space-y-6">
                                <motion.span 
                                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                                    className="text-[10px] font-black text-blue-600 uppercase tracking-[0.6em] italic block"
                                >
                                    Artesanía Industrial
                                </motion.span>
                                <h3 className="text-6xl lg:text-8xl font-display font-black italic tracking-tighter uppercase text-slate-900 leading-[0.85]">
                                    PAPEL QUE <br/> <span className="text-blue-600">INSPIRA</span> <br/> RESPETO.
                                </h3>
                            </div>
                            
                            <p className="text-xl text-slate-500 font-editorial font-light leading-relaxed max-w-lg">
                                En la era digital, lo físico es el mayor diferenciador. Cada documento que sale de nuestro Atelier es una declaración de intenciones: calidad, orden y prestigio para su negocio en Ecuador.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-10 pt-12 border-t border-slate-200">
                                <div className="group">
                                    <p className="text-4xl font-display font-black italic text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">99.9%</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 group-hover:text-slate-600 transition-colors">Precisión de Color ISO</p>
                                </div>
                                <div className="group">
                                    <p className="text-4xl font-display font-black italic text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">Ultra-HD</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 group-hover:text-slate-600 transition-colors">Impresión de Micro-Texto</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- INTERACTIVE SERVICES GRID (Minimalist White) --- */}
            <section className="py-40 bg-white relative">
                <div className="container mx-auto px-8">
                    <div className="text-center max-w-4xl mx-auto mb-28 space-y-8">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                            className="text-6xl lg:text-9xl font-display font-black italic tracking-tighter uppercase text-slate-900"
                        >
                            PORTFOLIO <span className="text-slate-200">SELECTO</span>
                        </motion.h2>
                        <div className="h-1.5 w-32 bg-yellow-400 mx-auto rounded-full" />
                        <p className="text-slate-400 font-editorial uppercase tracking-[0.3em] text-[10px]">Especialistas en soluciones gráficas de alto impacto</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <ServiceCard 
                            title="Talonarios" 
                            subtitle="Facturación & Control" 
                            icon={CheckBadgeIcon} 
                            color="text-blue-600" 
                            href="/catalog?q=talonario" 
                        />
                        <ServiceCard 
                            title="Tarjetas" 
                            subtitle="Red de Contactos" 
                            icon={StarIcon} 
                            color="text-yellow-600" 
                            href="/catalog?q=tarjetas" 
                        />
                        <ServiceCard 
                            title="Sellos" 
                            subtitle="Validación Instantánea" 
                            icon={CheckCircleIcon} 
                            color="text-red-600" 
                            href="/catalog?q=sellos" 
                        />
                        <ServiceCard 
                            title="Banners" 
                            subtitle="Presencia Visual" 
                            icon={PrinterIcon} 
                            color="text-slate-600" 
                            href="/catalog?q=banners" 
                        />
                        <ServiceCard 
                            title="Diseño" 
                            subtitle="Identidad Visual" 
                            icon={PaletteIcon} 
                            color="text-blue-600" 
                            href="/catalog?q=diseno" 
                        />
                        <ServiceCard 
                            title="Papelería" 
                            subtitle="Insumos Premium" 
                            icon={ShoppingCartIcon} 
                            color="text-red-600" 
                            href="/catalog?q=papeleria" 
                        />
                    </div>
                </div>
            </section>

            {/* --- PROCESS: THE STEPS (Split Flow Deep Dive) --- */}
            <section className="py-48 bg-slate-50 relative overflow-hidden">
                {/* Background Shapes */}
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-100/20 rounded-full blur-[100px]" />

                <div className="container mx-auto px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row gap-24">
                        <div className="lg:w-1/3 space-y-12">
                            <h2 className="text-7xl font-display font-black italic tracking-tighter uppercase text-slate-900 leading-[0.8]">
                                TU ÉXITO <br/> <span className="text-blue-600">EN PASOS.</span>
                            </h2>
                            <p className="text-slate-500 font-editorial font-light text-lg">Hemos refinado nuestra logística para que recibas tus impresos con la mayor velocidad del mercado.</p>
                            
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="p-10 bg-slate-900 text-white rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.2)] relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-6 text-blue-400">Atención Personalizada</p>
                                    <p className="text-2xl font-bold mb-8 italic leading-tight">"Gestionamos tu RUC ante el SRI de forma integral."</p>
                                    <a href={generateWhatsAppLink("Hola, necesito gestionar mis talonarios SRI.")} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] group/link">
                                        WhatsApp Directo <ArrowRightIcon className="w-5 h-5 group-hover/link:translate-x-2 transition-transform" />
                                    </a>
                                </div>
                            </motion.div>
                        </div>
                        
                        <div className="lg:w-2/3 grid md:grid-cols-2 gap-24">
                            <div className="space-y-16">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.6em] block">FLUJO DOCUMENTAL</span>
                                </div>
                                <ProcessStep num="01" title="Envío de RUC" desc="Contáctanos vía WhatsApp con tu número de RUC y tipo de documento." />
                                <ProcessStep num="02" title="Autorización" desc="Validamos y generamos la autorización del SRI en tiempo real." />
                                <ProcessStep num="03" title="Producción 24h" desc="Impresión inmediata con papel químico de alta calidad." isLast />
                            </div>
                            <div className="space-y-16">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.6em] block">FLUJO CREATIVO</span>
                                </div>
                                <ProcessStep num="01" title="Briefing" desc="Cuéntanos tu idea o envíanos tu logo para empezar el diseño." />
                                <ProcessStep num="02" title="Aprobación" desc="Revisa los mockups digitales y ajustamos cada detalle visual." />
                                <ProcessStep num="03" title="Acabados Luxe" desc="Corte de precisión, laminado y entrega final impecable." isLast />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL: ELEVATION --- */}
            <section className="py-32 bg-white">
                <div className="container mx-auto px-8">
                    <motion.div 
                        whileHover={{ scale: 1.01 }}
                        className="bg-slate-900 rounded-[5rem] p-16 lg:p-32 text-center relative overflow-hidden group shadow-[0_80px_150px_rgba(0,0,0,0.25)]"
                    >
                        {/* Animated Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="relative z-10 max-w-5xl mx-auto space-y-16">
                            <div className="space-y-6">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.8em] block">Impulsa tu Marca Hoy</span>
                                <h2 className="text-6xl lg:text-[9rem] font-display font-black italic tracking-tighter uppercase text-white leading-[0.8] mb-4">
                                    EL FUTURO ES <br/> <span className="text-blue-500">IMPRESO.</span>
                                </h2>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    className="w-full sm:w-auto px-16 py-8 bg-blue-600 text-white rounded-full font-black uppercase tracking-[0.4em] text-[11px] hover:bg-white hover:text-slate-900 transition-all shadow-2xl"
                                >
                                    Iniciar Proyecto
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    className="w-full sm:w-auto px-16 py-8 bg-transparent border border-white/20 text-white rounded-full font-black uppercase tracking-[0.4em] text-[11px] hover:bg-white/10 transition-all"
                                >
                                    Consultar Stock
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Minimalista Elite */}
            <footer className="py-32 border-t border-slate-100 bg-white">
                <div className="container mx-auto px-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-20">
                        <div className="space-y-8 max-w-xs">
                            <div className="flex items-center gap-4">
                                <CordovaLogo className="w-10 h-10 text-slate-900" />
                                <span className="text-2xl font-display font-black italic tracking-tighter uppercase">CÓRDOVA</span>
                            </div>
                            <p className="text-sm text-slate-400 font-editorial leading-relaxed">Excelencia gráfica y autorizaciones SRI. Elevando el estándar de impresión en Pasaje y todo El Oro.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-900">Ubicación</h4>
                                <p className="text-sm text-slate-500 font-editorial">Av. Municipalidad y Juan Montalvo<br/>Pasaje, El Oro</p>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-900">Contacto</h4>
                                <p className="text-sm text-slate-500 font-editorial">099 308 3943<br/>info@imprentacordova.net</p>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-900">Social</h4>
                                <div className="flex gap-6">
                                    <WhatsAppIcon className="w-6 h-6 text-slate-300 hover:text-blue-600 cursor-pointer transition-colors" />
                                    <MessageCircleIcon className="w-6 h-6 text-slate-300 hover:text-blue-600 cursor-pointer transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-32 pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">© 2026 Imprenta Córdova · Atelier de Papel</p>
                        <div className="flex gap-10">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors">Privacidad</span>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors">Términos</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default VisualLanding;
