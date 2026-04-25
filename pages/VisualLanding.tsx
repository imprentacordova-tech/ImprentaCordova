
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { 
    ShieldCheckIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CheckCircleIcon, ArrowRightIcon, MapPinIcon, 
    CordovaLogo, StarIcon, PrinterIcon, CheckBadgeIcon,
    SparklesIcon, MessageCircleIcon, ChevronRightIcon,
    WhatsAppIcon, PaletteIcon, InfoIcon, UploadIcon, LockIcon,
    LayersIcon, HandRaisedIcon, CpuIcon, ActivityIcon,
    SearchIcon, LayoutIcon, FileTextIcon, ScissorsIcon
} from '../components/Icons';
import { generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import Navbar from '../components/Navbar';

// --- COMPONENTES DE ÉLITE ---

const FloatingDoc: React.FC<{ delay?: number; x?: number; y?: number; rotate?: number; scale?: number; color?: string }> = ({ 
    delay = 0, x = 0, y = 0, rotate = 0, scale = 1, color = "bg-white"
}) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8, x, y, rotate }}
        animate={{ 
            opacity: [0, 1, 1, 0],
            y: [y, y - 120],
            rotate: [rotate, rotate + 20],
            x: [x, x + (Math.random() * 50 - 25)]
        }}
        transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut", 
            delay,
        }}
        className="absolute pointer-events-none"
        style={{ zIndex: 5 }}
    >
        <div 
            className={`w-28 h-36 ${color} shadow-2xl rounded-sm border border-slate-100 flex flex-col p-3 gap-2 origin-center`}
            style={{ transform: `scale(${scale})` }}
        >
            <div className="w-full h-1.5 bg-slate-100 rounded-full" />
            <div className="w-3/4 h-1 bg-slate-50 rounded-full" />
            <div className="w-1/2 h-1 bg-slate-50 rounded-full" />
            <div className="mt-auto flex justify-between items-center">
                <div className="w-6 h-6 rounded-full border border-dashed border-slate-100" />
                <div className="w-8 h-2 bg-blue-600/10 rounded-full" />
            </div>
        </div>
    </motion.div>
);

const ServiceCardPremium: React.FC<{ title: string; desc: string; icon: any; color: string; href: string }> = ({ title, desc, icon: Icon, color, href }) => {
    const navigate = useNavigate();
    return (
        <motion.div 
            whileHover={{ y: -8 }}
            onClick={() => navigate(href)}
            className="group cursor-pointer relative bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
        >
            <div className={`absolute -right-4 -top-4 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${color}`}>
                <Icon className="w-full h-full transform rotate-12" />
            </div>
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${color.replace('text-', 'bg-').replace('600', '50')} ${color}`}>
                <Icon className="w-7 h-7" />
            </div>
            
            <h3 className="text-2xl font-display font-black tracking-tight text-slate-900 mb-2 uppercase italic">{title}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{desc}</p>
            
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                Ver Detalles <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
        </motion.div>
    );
};

const StepElite: React.FC<{ number: string; title: string; text: string; color: string }> = ({ number, title, text, color }) => (
    <div className="relative group">
        <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg transform group-hover:rotate-12 transition-transform duration-500`}>
            <span className="text-white font-display font-black text-xl italic">{number}</span>
        </div>
        <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-900 mb-3">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">{text}</p>
    </div>
);

// --- VISTA PRINCIPAL ---

const VisualLanding: React.FC = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });
    
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
    const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
    const heroScale = useTransform(smoothProgress, [0, 0.15], [1, 0.95]);

    // Gestión de Mouse para Parallax suave
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        mouseX.set((clientX / innerWidth) - 0.5);
        mouseY.set((clientY / innerHeight) - 0.5);
    };

    const xMove = useTransform(mouseX, [-0.5, 0.5], [15, -15]);
    const yMove = useTransform(mouseY, [-0.5, 0.5], [15, -15]);

    return (
        <div ref={containerRef} onMouseMove={handleMouseMove} className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
            <SEO 
                title="Imprenta Córdova | Excelencia en Impresión y Documentos SRI"
                description="Líderes en documentos autorizados por el SRI y papelería corporativa premium en Ecuador. Tecnología de punta y acabados de lujo."
            />
            <Navbar />

            {/* --- HERO: SPLIT FLOW EXPERIENCE --- */}
            <section className="relative min-h-[100vh] lg:h-screen flex flex-col lg:flex-row pt-20 lg:pt-0">
                
                {/* LADO IZQUIERDO: SRI (Autoridad y Confianza) */}
                <motion.div 
                    style={{ opacity: heroOpacity, scale: heroScale }}
                    className="flex-1 relative group overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-center"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,85,255,0.03)_0%,transparent_50%)]" />
                    
                    <div className="relative z-10 px-8 lg:px-20 py-16 text-center lg:text-left space-y-8">
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            className="inline-flex items-center gap-3 px-5 py-2 bg-blue-50 rounded-full text-blue-600"
                        >
                            <ShieldCheckIcon className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Documentos Autorizados SRI</span>
                        </motion.div>
                        
                        <h1 className="text-6xl lg:text-[7rem] font-display font-black italic tracking-tighter leading-[0.85] uppercase text-slate-900">
                            GESTIÓN <br/> <span className="text-blue-600">OFICIAL.</span>
                        </h1>
                        
                        <p className="text-slate-500 font-medium text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                            Emisión de factureros, notas de venta y retenciones con papel químico de alta transferencia. Seguridad y validez garantizada.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <motion.button 
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/catalog?cat=sri')}
                                className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl flex items-center justify-center gap-4 group"
                            >
                                <span>Solicitar Talonarios</span>
                                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Animación de Talonarios en Movimiento */}
                    <div className="absolute inset-0 pointer-events-none hidden lg:block">
                        <FloatingDoc delay={0} x={450} y={500} rotate={-15} scale={0.8} />
                        <FloatingDoc delay={2} x={550} y={300} rotate={10} scale={1.1} />
                        <FloatingDoc delay={4} x={400} y={150} rotate={-5} scale={0.7} color="bg-blue-50" />
                    </div>
                </motion.div>

                {/* LADO DERECHO: IMPRENTA GENERAL (Creatividad e Impacto) */}
                <motion.div 
                    style={{ opacity: heroOpacity, scale: heroScale }}
                    className="flex-1 relative group overflow-hidden bg-slate-50/50 flex flex-col justify-center"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(225,29,72,0.03)_0%,transparent_50%)]" />
                    
                    <div className="relative z-10 px-8 lg:px-20 py-16 text-center lg:text-left space-y-8">
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            className="inline-flex items-center gap-3 px-5 py-2 bg-red-50 rounded-full text-red-600"
                        >
                            <PaletteIcon className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Artes Gráficas & Branding</span>
                        </motion.div>
                        
                        <h2 className="text-6xl lg:text-[7rem] font-display font-black italic tracking-tighter leading-[0.85] uppercase text-slate-900">
                            IMPACTO <br/> <span className="text-red-600">VISUAL.</span>
                        </h2>
                        
                        <p className="text-slate-500 font-medium text-lg max-w-md mx-auto lg:mx-0 leading-relaxed">
                            Tarjetas de presentación premium, volantes, sellos automáticos y banners de gran formato con resolución cinematográfica.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <motion.button 
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/catalog?cat=general')}
                                className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-4 group"
                            >
                                <span>Explorar Catálogo</span>
                                <SparklesIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Elementos Flotantes de Diseño */}
                    <div className="absolute inset-0 pointer-events-none hidden lg:block">
                        <FloatingDoc delay={1} x={50} y={450} rotate={20} scale={0.9} color="bg-yellow-50" />
                        <FloatingDoc delay={3} x={150} y={200} rotate={-10} scale={1.2} />
                        <FloatingDoc delay={5} x={80} y={600} rotate={5} scale={0.6} />
                    </div>
                </motion.div>

                {/* Indicador de Scroll */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3"
                >
                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-300">Deslizar</span>
                    <div className="w-px h-10 bg-gradient-to-b from-slate-200 to-transparent" />
                </motion.div>
            </section>

            {/* --- SECCIÓN: PRODUCTOS DESTACADOS (Visualización Realista) --- */}
            <section className="py-32 lg:py-48 bg-white overflow-hidden">
                <div className="container mx-auto px-8">
                    {/* SRI Product Focus */}
                    <div className="flex flex-col lg:flex-row gap-20 items-center mb-40">
                        <motion.div 
                            initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            className="flex-1 relative"
                        >
                            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.08)] border-8 border-white group">
                                <img src="/sri_talonario_ecuador_premium_1777154472827.png" alt="Talonarios SRI Premium" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-[3s]" />
                                <div className="absolute inset-0 bg-blue-600/5 mix-blend-multiply" />
                            </div>
                            <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow-400/20 blur-[80px] rounded-full" />
                        </motion.div>
                        
                        <div className="flex-1 space-y-8">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] italic">Estándar de Calidad SRI</span>
                            <h3 className="text-5xl lg:text-7xl font-display font-black italic tracking-tighter uppercase text-slate-900 leading-tight">
                                PAPEL QUÍMICO <br/> <span className="text-blue-600">DE ALTA GAMA.</span>
                            </h3>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">
                                Nuestros talonarios utilizan tecnología de transferencia por presión sin carbón, garantizando copias nítidas y duraderas. Ideales para facturas, retenciones y guías de remisión autorizadas.
                            </p>
                            <ul className="space-y-4 pt-4">
                                {['Autorización inmediata ante el SRI', 'Papel químico de 60g original y copias', 'Numeración secuencial garantizada', 'Entrega Express en 24-48 horas'].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-sm font-bold text-slate-700">
                                        <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* General Printing Focus */}
                    <div className="flex flex-col lg:flex-row-reverse gap-20 items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            className="flex-1 relative"
                        >
                            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.08)] border-8 border-white group">
                                <img src="/branding_premium_imprenta_1777154630939.png" alt="Branding Premium" className="w-full h-auto transform group-hover:scale-105 transition-transform duration-[3s]" />
                                <div className="absolute inset-0 bg-red-600/5 mix-blend-multiply" />
                            </div>
                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-red-400/10 blur-[80px] rounded-full" />
                        </motion.div>
                        
                        <div className="flex-1 space-y-8 lg:text-right lg:flex lg:flex-col lg:items-end">
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.5em] italic">Branding de Élite</span>
                            <h3 className="text-5xl lg:text-7xl font-display font-black italic tracking-tighter uppercase text-slate-900 leading-tight">
                                DISEÑO QUE <br/> <span className="text-red-600">VENDE.</span>
                            </h3>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">
                                Desde tarjetas personales con acabados mate hasta banners publicitarios que dominan la mirada. Convertimos tu marca en una experiencia táctil y visual inolvidable.
                            </p>
                            <div className="flex wrap gap-4 pt-6 lg:justify-end">
                                {['Laminado Mate', 'Brillo UV', 'Troquelado', 'Papel Fino'].map((tag, i) => (
                                    <span key={i} className="px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN: SERVICIOS INTERACTIVOS (Minimalismo Elegante) --- */}
            <section className="py-32 bg-slate-50">
                <div className="container mx-auto px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
                        <h2 className="text-5xl lg:text-8xl font-display font-black italic tracking-tighter uppercase text-slate-900">
                            NUESTRO <span className="text-slate-300">TALLER.</span>
                        </h2>
                        <div className="h-1.5 w-24 bg-yellow-400 mx-auto rounded-full" />
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.4em]">Soluciones integrales de impresión profesional</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <ServiceCardPremium 
                            title="Talonarios" desc="Facturas, retenciones y guías autorizadas con copias químicas de alta definición." 
                            icon={FileTextIcon} color="text-blue-600" href="/catalog?q=talonario" 
                        />
                        <ServiceCardPremium 
                            title="Tarjetas" desc="Presentación impecable con acabados especiales, texturas y gramajes premium." 
                            icon={HandRaisedIcon} color="text-yellow-600" href="/catalog?q=tarjeta" 
                        />
                        <ServiceCardPremium 
                            title="Sellos" desc="Sellos automáticos y de madera con entintado perfecto y larga durabilidad." 
                            icon={CheckBadgeIcon} color="text-red-600" href="/catalog?q=sello" 
                        />
                        <ServiceCardPremium 
                            title="Publicidad" desc="Banners, volantes y afiches diseñados para capturar la atención en segundos." 
                            icon={ActivityIcon} color="text-slate-600" href="/catalog?q=publicidad" 
                        />
                        <ServiceCardPremium 
                            title="Diseño" desc="Creación de identidad visual, logotipos y diagramación editorial profesional." 
                            icon={PaletteIcon} color="text-blue-600" href="/catalog?q=diseno" 
                        />
                        <ServiceCardPremium 
                            title="Papelería" desc="Hojas membretadas, carpetas corporativas y sobres con acabados de lujo." 
                            icon={LayersIcon} color="text-red-600" href="/catalog?q=papeleria" 
                        />
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN: EL PROCESO (Paso a Paso) --- */}
            <section className="py-32 lg:py-48 bg-white border-y border-slate-100">
                <div className="container mx-auto px-8">
                    <div className="flex flex-col lg:flex-row gap-24">
                        <div className="lg:w-1/3 space-y-10">
                            <h2 className="text-6xl lg:text-7xl font-display font-black italic tracking-tighter uppercase text-slate-900 leading-[0.85]">
                                EFICIENCIA <br/> <span className="text-blue-600">SIN PAUSA.</span>
                            </h2>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed">
                                Hemos simplificado el proceso para que te enfoques en tu negocio mientras nosotros nos encargamos de tu imagen.
                            </p>
                            
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="p-8 bg-slate-950 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <WhatsAppIcon className="w-6 h-6 text-emerald-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Atención Directa</span>
                                    </div>
                                    <p className="text-xl font-bold italic leading-tight">"Gestionamos tu RUC ante el SRI de forma integral y rápida."</p>
                                    <a 
                                        href={generateWhatsAppLink("Hola Imprenta Córdova, necesito cotizar unos trabajos de impresión.")}
                                        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors"
                                    >
                                        Chatear Ahora <ArrowRightIcon className="w-4 h-4" />
                                    </a>
                                </div>
                            </motion.div>
                        </div>
                        
                        <div className="lg:w-2/3 grid md:grid-cols-2 gap-16">
                            <div className="space-y-16">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-slate-100" />
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">FLUJO SRI</span>
                                </div>
                                <StepElite number="01" title="Datos" text="Envíanos tu RUC y establecimiento vía WhatsApp o formulario." color="bg-blue-600" />
                                <StepElite number="02" title="Trámite" text="Realizamos la solicitud de autorización en el portal del SRI." color="bg-blue-600" />
                                <StepElite number="03" title="Entrega" text="Producción inmediata y entrega en tu local o domicilio." color="bg-blue-600" />
                            </div>
                            
                            <div className="space-y-16">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-slate-100" />
                                    <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">FLUJO DISEÑO</span>
                                </div>
                                <StepElite number="01" title="Idea" text="Cuéntanos tu visión o envíanos tus archivos para revisión." color="bg-red-600" />
                                <StepElite number="02" title="Muestra" text="Te enviamos un diseño digital para tu aprobación final." color="bg-red-600" />
                                <StepElite number="03" title="Acabado" text="Impresión con materiales de lujo y control de calidad." color="bg-red-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL: ELEVACIÓN --- */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-8">
                    <motion.div 
                        whileHover={{ scale: 1.01 }}
                        className="bg-blue-600 rounded-[4rem] p-12 lg:p-24 text-center relative overflow-hidden group shadow-[0_60px_100px_rgba(0,85,255,0.2)]"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
                        
                        <div className="relative z-10 max-w-4xl mx-auto space-y-12">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black text-blue-100 uppercase tracking-[0.6em] block">Presencia que Perdura</span>
                                <h2 className="text-5xl lg:text-8xl font-display font-black italic tracking-tighter uppercase text-white leading-tight">
                                    TU MARCA, <br/> <span className="text-yellow-400">IMPECABLE.</span>
                                </h2>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    className="w-full sm:w-auto px-12 py-6 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-slate-900 hover:text-white transition-all"
                                >
                                    Cotizar Mi Proyecto
                                </motion.button>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    className="w-full sm:w-auto px-12 py-6 bg-transparent border-2 border-white/30 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                                >
                                    Hablar con un Experto
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- FOOTER: MINIMALISTA ÉLITE --- */}
            <footer className="py-24 border-t border-slate-100 bg-white">
                <div className="container mx-auto px-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-16">
                        <div className="space-y-6 max-w-sm">
                            <div className="flex items-center gap-3">
                                <CordovaLogo className="w-10 h-10 text-blue-600" />
                                <span className="text-3xl font-display font-black italic tracking-tighter uppercase text-slate-900">CÓRDOVA</span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Excelencia gráfica y soluciones oficiales SRI. Elevamos el estándar de la industria del papel en Pasaje y toda la provincia de El Oro desde hace décadas.
                            </p>
                            <div className="flex gap-5">
                                <WhatsAppIcon className="w-5 h-5 text-slate-300 hover:text-blue-600 transition-colors cursor-pointer" />
                                <MessageCircleIcon className="w-5 h-5 text-slate-300 hover:text-blue-600 transition-colors cursor-pointer" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Oficina Central</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Av. Municipalidad y Juan Montalvo<br/>
                                    Pasaje, El Oro · Ecuador
                                </p>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Contacto Directo</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    099 308 3943<br/>
                                    info@imprentacordova.net
                                </p>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Horarios</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Lunes a Viernes: 08:30 - 18:30<br/>
                                    Sábado: 09:00 - 13:00
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-24 pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 Imprenta Córdova · El Taller de las Ideas</p>
                        <div className="flex gap-8">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors">Términos</span>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors">Privacidad</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default VisualLanding;
