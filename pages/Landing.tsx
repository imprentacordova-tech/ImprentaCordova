
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, CheckCircleIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, PrinterIcon, CheckBadgeIcon, ClockIcon,
    SearchIcon, SparklesIcon, MonitorIcon, MessageCircleIcon, ChevronRightIcon,
    Loader2Icon, WalletIcon, ExclamationTriangleIcon, LayersIcon, WhatsAppIcon,
    PaletteIcon, ReceiptIcon, InfoIcon, UploadIcon, MicIcon
} from '../components/Icons';
import { useData } from '../contexts/DataContext';
import { analyzeImageQualityForPrint } from '../services/geminiService';
import { Producto, TrabajoEstado, TrabajoTipo, Regimen } from '../types';
import { formatCurrency } from '../utils';
import { useScroll, useTransform } from 'framer-motion';

// --- ANIMATION VARIANTS ---
const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: "easeOut" as any }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

// --- COMPONENTES AUXILIARES ---

const StatCard: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
    <motion.div 
        variants={fadeInUp}
        className="text-center p-8 bg-white/[0.02] backdrop-blur-3xl rounded-[2.5rem] border border-white/5 group hover:border-liquid-gold/30 hover:bg-liquid-gold/5 transition-all duration-700 relative overflow-hidden box-border shadow-luxury"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] mb-4 relative z-10 group-hover:text-liquid-gold/80 transition-colors">{label}</p>
        <p className="text-5xl lg:text-7xl font-display font-black text-white tracking-tighter mb-2 group-hover:scale-105 transition-transform duration-700 relative z-10 italic drop-shadow-2xl">{value}</p>
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em] relative z-10">{sub}</p>
    </motion.div>
);

const ServiceCard: React.FC<{ title: string; desc: string; icon: any; index: number; activeIndex: number }> = ({ title, desc, icon: Icon, index, activeIndex }) => (
    <motion.div 
        variants={fadeInUp}
        className={`group bg-white/[0.02] backdrop-blur-3xl p-12 rounded-[3.5rem] border transition-all duration-1000 hover:-translate-y-4 relative overflow-hidden ${
            index === activeIndex ? 'border-liquid-gold/40 bg-white/[0.05] shadow-gold-glow-soft' : 'border-white/5 hover:border-liquid-gold/30 hover:bg-white/[0.04]'
        }`}
    >
        <div className="absolute top-0 right-0 w-48 h-48 bg-liquid-gold/5 rounded-full blur-3xl -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className={`w-24 h-24 rounded-[2.5rem] bg-brand-dark border flex items-center justify-center mb-12 transition-all duration-1000 ${
            index === activeIndex ? 'border-liquid-gold/40 shadow-gold-glow-soft scale-110' : 'border-white/10 group-hover:shadow-gold-glow-soft group-hover:border-liquid-gold/40 group-hover:scale-105'
        }`}>
            <Icon className="w-12 h-12 text-liquid-gold" />
        </div>
        <h3 className="text-3xl font-display font-black text-white uppercase tracking-tighter mb-6 leading-[0.9] transition-colors group-hover:text-gold-gradient italic">{title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm font-medium italic">{desc}</p>
        <div className="mt-12 flex items-center gap-4 text-liquid-gold font-black text-[9px] uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700">
            Consultar Ingeniería <ArrowRightIcon className="w-4 h-4" />
        </div>
    </motion.div>
);


const LandingPage: React.FC = () => {
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { productos, loading } = useData();
    const [calcQty, setCalcQty] = useState(5);
    const [calcPrice, setCalcPrice] = useState(65);
    const [activeServiceIndex, setActiveServiceIndex] = useState(0);

    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start end", "end start"]
    });

    const imageOpacity = useTransform(scrollYProgress, [0, 0.3, 0.6, 0.9], [0.1, 1, 1, 0.1]);
    const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.1, 0.8]);

    // IA Quality Tester State
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAddToCart = (p: Producto) => {
        setCartItems(prev => {
            const exists = prev.find(item => item.producto.id === p.id);
            if (exists) return prev.map(item => item.producto.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            return [...prev, { producto: p, cantidad: 1 }];
        });
        setIsCartOpen(true);
    };

    const handleFileTest = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsTesting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            const result = await analyzeImageQualityForPrint(base64);
            setTestResult(result);
            setIsTesting(false);
        };
        reader.readAsDataURL(file);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);

    return (
        <div className="min-h-screen bg-brand-dark font-sans selection:bg-liquid-gold selection:text-brand-dark overflow-x-hidden relative">
            {/* Cinematic Overlay Effects */}
            <div className="fixed inset-0 bg-mesh opacity-40 pointer-events-none z-0" />
            <div className="fixed inset-0 bg-noise pointer-events-none z-[100]" />
            
            {/* --- NAVEGACIÓN OBSIDIAN --- */}
            <div className="fixed top-8 left-0 right-0 z-[100] px-6">
                <motion.nav 
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="container mx-auto max-w-6xl bg-brand-dark/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-4 px-8 shadow-2xl flex justify-between items-center relative overflow-hidden"
                >
                    {/* Subtle Navigation Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/5 via-transparent to-liquid-gold/5 opacity-50" />
                    
                    <div className="flex items-center gap-6 group cursor-pointer relative z-10">
                        <div className="relative">
                            <CordovaLogo className="h-10 w-auto group-hover:scale-110 transition-all duration-700 brightness-0 invert" />
                            <div className="absolute -inset-2 bg-liquid-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em] mb-1">Pasaje • Ec</span>
                            <span className="text-xl font-display font-black text-white uppercase tracking-tight group-hover:text-gold-gradient transition-colors italic">Córdova</span>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-12 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 relative z-10">
                        <a href="#servicios" className="hover:text-liquid-gold transition-colors relative group py-2">
                            Servicios
                            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-liquid-gold transition-all duration-500 group-hover:w-full" />
                        </a>
                        <a href="#catalog" className="hover:text-liquid-gold transition-colors relative group py-2">
                            Catálogo
                            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-liquid-gold transition-all duration-500 group-hover:w-full" />
                        </a>
                        <a href="#cotizador" className="hover:text-liquid-gold transition-colors relative group py-2">
                            Cotizador
                            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-liquid-gold transition-all duration-500 group-hover:w-full" />
                        </a>
                        <Link to="/tracking" className="px-6 py-2.5 bg-liquid-gold/10 border border-liquid-gold/20 text-liquid-gold rounded-full hover:bg-liquid-gold hover:text-brand-dark transition-all duration-700 box-border shadow-gold-glow-soft">
                            Rastreo
                        </Link>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <button onClick={() => setIsCartOpen(true)} className="relative p-3.5 bg-white/[0.03] rounded-2xl hover:bg-liquid-gold/10 hover:border-liquid-gold/30 border border-white/5 transition-all text-slate-400 hover:text-liquid-gold group">
                            <ShoppingCartIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <AnimatePresence>
                                {cartItems.length > 0 && (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="absolute -top-1 -right-1 bg-liquid-gold text-brand-dark text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-gold-glow"
                                    >
                                        {cartItems.length}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                        <Link to="/login" className="hidden sm:flex items-center gap-3 px-7 py-3.5 bg-white text-brand-dark rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-gold-gradient transition-all duration-700 shadow-luxury active:scale-95">
                            Elite Hub
                        </Link>
                    </div>
                </motion.nav>
            </div>

            {/* --- HERO OBSIDIAN & GOLD --- */}
            <section className="relative pt-48 pb-20 lg:pt-64 lg:pb-40 overflow-hidden">
                {/* Hero Accents */}
                <div className="absolute top-0 right-0 w-[1200px] h-[1200px] bg-liquid-gold/5 rounded-full blur-[180px] -mr-80 -mt-80 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[160px] -ml-40 -mb-40 pointer-events-none" />
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-20 items-center">
                        <motion.div 
                            initial="initial"
                            animate="animate"
                            variants={staggerContainer}
                            className="lg:col-span-7 space-y-12"
                        >
                            <motion.div variants={fadeInUp} className="inline-flex items-center gap-4 px-6 py-2.5 bg-white/[0.03] border border-white/10 rounded-full text-slate-400 backdrop-blur-md">
                                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                                    Pasión por la excelencia gráfica. Innovación y compromiso en cada impresión para elevar la identidad de tu marca.
                                </p>
                            </motion.div>
                            
                            <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl lg:text-[11rem] font-display font-black text-white leading-[0.75] tracking-tighter uppercase italic">
                                Ingeniería <br/>
                                <span className="text-gold-gradient text-glow">Gráfica</span>
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="text-xl lg:text-3xl text-slate-500 font-medium max-w-2xl leading-relaxed tracking-tight italic">
                                Elevando el estándar industrial a <span className="text-white font-black">arte tangible</span>. Líderes en acabados de lujo y gigantografías HD.
                            </motion.p>

                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 pt-6">
                                <a href="https://wa.me/593993083943" className="group px-14 py-7 bg-white text-brand-dark rounded-2xl font-black text-[11px] uppercase tracking-[0.35em] shadow-luxury hover:bg-gold-gradient transition-all duration-700 flex items-center justify-center gap-4 active:scale-95">
                                    <WhatsAppIcon className="w-6 h-6 group-hover:scale-125 transition-transform duration-500"/> Apertura de Proyecto
                                </a>
                                <button onClick={() => fileInputRef.current?.click()} className="px-14 py-7 bg-white/[0.03] border border-white/5 text-slate-300 rounded-2xl font-black text-[11px] uppercase tracking-[0.35em] hover:border-liquid-gold/30 hover:bg-liquid-gold/5 transition-all duration-700 flex items-center justify-center gap-4 active:scale-95 group">
                                    <MonitorIcon className="w-6 h-6 group-hover:text-liquid-gold transition-colors"/> Analizador de Manifiesto
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileTest} />
                            </motion.div>

                            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16">
                                <StatCard label="TRAYECTORIA" value="Vanguardia" sub="Innovación" />
                                <StatCard label="PRECISIÓN" value="HD" sub="Roland Tech" />
                                <StatCard label="PORTAFOLIO" value="10k" sub="Proyectos" />
                                <StatCard label="LATITUD" value="07" sub="Pasaje Centro" />
                            </motion.div>
                        </motion.div>

                        {/* --- WIDGET IA DINÁMICO --- */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, x: 50 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="lg:col-span-5 relative group"
                        >
                            <div className="absolute -inset-6 bg-liquid-gold/5 rounded-[4.5rem] blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            
                            <div className="relative bg-white/[0.02] backdrop-blur-3xl rounded-[4rem] p-1 shadow-2xl border border-white/10 group-hover:border-liquid-gold/20 transition-all duration-1000 overflow-hidden">
                                <div className="p-12 space-y-10">
                                    <AnimatePresence mode="wait">
                                        {isTesting ? (
                                            <motion.div 
                                                key="testing"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="py-24 text-center space-y-8 relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10">
                                                    <CordovaLogo className="w-64 h-64 grayscale animate-pulse" />
                                                </div>
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <div className="w-24 h-24 mb-6 relative">
                                                        <Loader2Icon className="w-full h-full animate-spin text-liquid-gold" />
                                                        <div className="absolute inset-0 border-4 border-liquid-gold/20 rounded-full" />
                                                    </div>
                                                    <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest italic group-hover:text-gold-gradient transition-colors">Analizador Óptico</h3>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3">Sincronizando Perfil de Color</p>
                                                </div>
                                                <div className="absolute top-0 left-0 w-full h-[2px] bg-liquid-gold shadow-gold-glow animate-scan z-20" />
                                            </motion.div>
                                        ) : testResult ? (
                                            <motion.div 
                                                key="result"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-8"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="bg-liquid-gold/10 border border-liquid-gold/30 p-5 rounded-[1.5rem] text-liquid-gold shadow-gold-glow-soft">
                                                        <SparklesIcon className="w-8 h-8"/>
                                                    </div>
                                                    <button onClick={() => setTestResult(null)} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors border border-white/5">
                                                        <CloseIcon className="w-5 h-5"/>
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Veredicto Profesional</p>
                                                    <h3 className="text-4xl font-display font-black text-white uppercase tracking-tighter leading-none italic">{testResult.veredicto}</h3>
                                                </div>
                                                <div className="p-8 bg-brand-dark/50 rounded-[2.5rem] space-y-6 border border-white/5 relative overflow-hidden group/result">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/5 via-transparent to-transparent opacity-0 group-hover/result:opacity-100 transition-opacity duration-700" />
                                                    <p className="text-lg font-medium italic text-slate-300 relative z-10 leading-relaxed">"{testResult.calidad}"</p>
                                                    <div className="flex flex-wrap gap-3 pt-2 relative z-10">
                                                        {testResult.advertencias.map((adv: string, i: number) => (
                                                            <span key={i} className="px-4 py-2 bg-red-500/10 text-red-400 text-[9px] font-black uppercase rounded-xl border border-red-500/20 shadow-sm">{adv}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button onClick={() => fileInputRef.current?.click()} className="w-full py-6 bg-white/[0.03] border border-white/10 text-slate-400 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:border-liquid-gold/40 hover:text-white transition-all shadow-xl">
                                                    Subir nueva versión
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <motion.div 
                                                key="idle"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-12"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="p-4 bg-liquid-gold/10 border border-liquid-gold/20 rounded-[1.5rem] text-liquid-gold shadow-gold-glow-soft">
                                                        <SparklesIcon className="w-7 h-7"/>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight italic">Vision IA</h3>
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Ingeniería Gráfica</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-8">
                                                    <p className="text-slate-400 text-lg font-medium leading-relaxed tracking-tight">Carga tu arte para un diagnóstico instantáneo de <strong className="text-white">viabilidad de impresión HD</strong>.</p>
                                                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-14 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center gap-5 hover:border-liquid-gold/40 hover:bg-liquid-gold/5 transition-all group/upload relative overflow-hidden">
                                                        <div className="p-5 bg-white/5 rounded-2xl group-hover/upload:scale-110 transition-transform duration-500">
                                                            <UploadIcon className="w-12 h-12 text-slate-500 group-hover/upload:text-liquid-gold transition-colors" />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 group-hover/upload:text-liquid-gold transition-colors">Analizar mi Diseño</span>
                                                        <div className="absolute inset-0 bg-gradient-to-t from-liquid-gold/[0.02] to-transparent opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                                                    </button>
                                                </div>

                                                <div className="pt-10 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex -space-x-3">
                                                        {[1,2,3,4].map(i => <div key={i} className="w-9 h-9 rounded-full bg-slate-800 border-2 border-brand-dark relative overflow-hidden"><div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/20 to-transparent" /></div>)}
                                                    </div>
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Soporte Técnico Roland</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN SERVICIOS --- */}
            <section id="servicios" className="py-32 lg:py-48 scroll-mt-24 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <motion.div 
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="max-w-4xl mb-24"
                    >
                        <motion.span variants={fadeInUp} className="text-liquid-gold font-black text-[10px] uppercase tracking-[0.5em] mb-6 block italic">Atelier de Soluciones</motion.span>
                        <motion.h2 variants={fadeInUp} className="text-6xl lg:text-8xl font-display font-black text-white uppercase tracking-tighter leading-none italic mb-10">
                            PULIENDO TU <br/> <span className="text-gold-gradient text-glow">VISIÓN DIGITAL</span>
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-xl lg:text-2xl text-slate-500 max-w-3xl leading-relaxed tracking-tight font-medium">Fusión de artesanía clásica y vanguardia tecnológica. Cada proyecto es una pieza única de ingeniería visual.</motion.p>
                    </motion.div>

                    <motion.div 
                        ref={targetRef}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
                    >
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            <div onMouseEnter={() => setActiveServiceIndex(0)}>
                                <ServiceCard title="Gigantografías HD" desc="Impresión en lona brillante, mate y vinilos adhesivos con tecnología Roland Eco-Solvente de 1440dpi." icon={PrinterIcon} index={0} activeIndex={activeServiceIndex} />
                            </div>
                            <div onMouseEnter={() => setActiveServiceIndex(1)}>
                                <ServiceCard title="Talonarios SRI" desc="Imprenta Autorizada. Facturas, Notas de Venta y Retenciones bajo normativas RIMPE con papel químico premium." icon={ShieldCheckIcon} index={1} activeIndex={activeServiceIndex} />
                            </div>
                            <div onMouseEnter={() => setActiveServiceIndex(2)}>
                                <ServiceCard title="Marketing de Lujo" desc="Diseño de branding imponente que posiciona tu marca en la cima del mercado local y regional." icon={PaletteIcon} index={2} activeIndex={activeServiceIndex} />
                            </div>
                        </div>

                        <div className="lg:col-span-4 h-[600px] relative rounded-[4rem] overflow-hidden border border-white/10 shadow-luxury group">
                            <motion.img 
                                key={activeServiceIndex}
                                initial={{ opacity: 0, scale: 1.2 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1 }}
                                src={
                                    activeServiceIndex === 0 
                                    ? "/images/landing/printer_gold.png"
                                    : activeServiceIndex === 1
                                    ? "/images/landing/talonarios.png"
                                    : "/images/landing/branding.png"
                                }
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-60" />
                            <motion.div 
                                style={{ opacity: imageOpacity, scale: imageScale }}
                                className="absolute inset-0 flex items-center justify-center p-12 pointer-events-none"
                            >
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.8em] mb-4">Precision Tech</p>
                                    <h3 className="text-5xl font-display font-black text-white uppercase italic tracking-tighter leading-none">Calidad<br/>Córdova</h3>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- SECCIÓN GALERÍA INMERSIVA --- */}
            <section className="py-20 overflow-hidden bg-brand-dark/50">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col gap-32">
                        <motion.div 
                            style={{ scale: imageScale, opacity: imageOpacity }}
                            className="relative h-[80vh] rounded-[5rem] overflow-hidden border border-white/10 shadow-luxury group"
                        >
                            <img 
                                src="/images/landing/business_cards.png" 
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[3s] scale-110 group-hover:scale-100" 
                                alt="Industrial Detail"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-brand-dark/20" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10">
                                <motion.span 
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    className="text-liquid-gold font-black text-[12px] uppercase tracking-[1em] mb-8"
                                >
                                    Artesanía Tecnológica
                                </motion.span>
                                <motion.h2 
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    className="text-6xl md:text-9xl font-display font-black text-white uppercase italic leading-none tracking-tighter"
                                >
                                    EL ESTÁNDAR <br/> <span className="text-gold-gradient">CÓRDOVA</span>
                                </motion.h2>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- COTIZADOR RÁPIDO --- */}
            <section id="cotizador" className="py-32 lg:py-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.01]" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                
                <div className="container mx-auto px-6 flex flex-col lg:flex-row gap-24 items-center relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2 space-y-12"
                    >
                        <div className="space-y-4">
                            <span className="text-liquid-gold font-black text-[10px] uppercase tracking-[0.4em] italic">Calculadora de Inversión</span>
                            <h2 className="text-5xl lg:text-7xl font-display font-black text-white uppercase tracking-tighter leading-none italic">
                                PROYECTA TU <br/> <span className="text-gold-gradient">ÉXITO</span>
                            </h2>
                        </div>
                        
                        <div className="space-y-14 pt-8">
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">1. Volumen de Producción</label>
                                    <motion.span 
                                        key={calcQty}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-3xl font-display font-black text-liquid-gold italic"
                                    >
                                        {calcQty} Uds
                                    </motion.span>
                                </div>
                                <div className="relative group/slider">
                                    <input type="range" min="1" max="100" value={calcQty} onChange={e => {
                                        const qty = parseInt(e.target.value);
                                        setCalcQty(qty);
                                        if(qty >= 10) setCalcPrice(qty * 11);
                                        else if(qty >= 5) setCalcPrice(qty * 13);
                                        else setCalcPrice(qty * 15);
                                    }} className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-liquid-gold group-hover/slider:bg-white/20 transition-all" />
                                    <div className="absolute -top-1 left-0 h-3 bg-liquid-gold rounded-full pointer-events-none" style={{ width: `${calcQty}%` }} />
                                </div>
                            </div>

                            <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="p-10 bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] border border-white/10 hover:border-liquid-gold/30 transition-all flex items-center justify-between shadow-2xl relative overflow-hidden group/quote"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/5 via-transparent to-transparent opacity-0 group-hover/quote:opacity-100 transition-opacity duration-700" />
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Inversión Estimada</p>
                                    <motion.p 
                                        key={calcPrice}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-6xl font-display font-black text-white tracking-tighter italic text-glow"
                                    >
                                        {formatCurrency(calcPrice)}
                                    </motion.p>
                                </div>
                                <a href={`https://wa.me/593993083943?text=Hola,%20quiero%20confirmar%20mi%20cotización%20de%20${calcQty}%20unidades`} className="w-20 h-20 bg-white text-brand-dark rounded-3xl flex items-center justify-center shadow-gold-glow hover:bg-liquid-gold hover:scale-110 transition-all duration-500 relative z-10 active:scale-95">
                                    <WhatsAppIcon className="w-10 h-10" />
                                </a>
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, x: 50 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2 relative group"
                    >
                        <div className="aspect-[4/5] bg-brand-dark rounded-[4.5rem] overflow-hidden border border-white/10 group-hover:border-liquid-gold/30 transition-all duration-1000 relative shadow-luxury">
                             <img src="/images/landing/printer_gold.png" className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-60 group-hover:scale-110 transition-all duration-[2s]" alt="Roland Machine" />
                             <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/20 to-transparent flex flex-col justify-end p-16">
                                <motion.div 
                                    whileHover={{ y: -5 }}
                                    className="bg-white/[0.03] backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 hover:border-liquid-gold/20 transition-all"
                                >
                                    <h4 className="text-3xl font-display font-black text-white uppercase tracking-tight mb-4 italic text-glow">Protocolo Roland Elite</h4>
                                    <p className="text-sm font-medium text-slate-400 leading-relaxed italic">Calibración micrométrica de cabezales y perfiles de color cinemáticos para cada sustrato industrial.</p>
                                </motion.div>
                             </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- CATÁLOGO PREMIUM --- */}
            <section id="catalog" className="py-32 lg:py-56 relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="text-liquid-gold font-black text-[10px] uppercase tracking-[0.5em] mb-6 block italic">Colección Exclusiva</span>
                            <h2 className="text-6xl lg:text-8xl font-display font-black text-white uppercase tracking-tighter italic">
                                EL MUESTRARIO <br/> <span className="text-gold-gradient text-glow">DEFINITIVO</span>
                            </h2>
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex gap-4">
                            <button className="px-8 py-4 bg-white/[0.03] border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 hover:border-liquid-gold/40 hover:text-white transition-all shadow-xl">
                                Filtrar Colecciones
                            </button>
                        </motion.div>
                    </div>

                    <motion.div 
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10"
                    >
                        {loading ? [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white/[0.03] rounded-[4rem] h-[550px] animate-pulse border border-white/5" />
                        )) : productos.filter(p => p.esActivo !== false && p.visiblePublico !== false).slice(0, 8).map(p => (
                            <motion.article 
                                key={p.id} 
                                variants={fadeInUp}
                                whileHover={{ y: -15 }}
                                className="group bg-white/[0.02] backdrop-blur-2xl rounded-[4rem] border border-white/5 hover:border-liquid-gold/30 overflow-hidden transition-all duration-1000 p-5 flex flex-col shadow-2xl relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="h-72 rounded-[3rem] overflow-hidden relative mb-10 shadow-inner">
                                    {p.imagenUrl ? (
                                        <img src={p.imagenUrl} className="w-full h-full object-cover transition-transform duration-[2.5s] group-hover:scale-125" alt={p.nombre}/>
                                    ) : (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-700">
                                            <BoxIcon className="w-20 h-20 opacity-20"/>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-brand-dark/90 opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col items-center justify-center p-10 text-center backdrop-blur-md">
                                        <p className="text-white text-sm font-medium leading-relaxed mb-8 italic tracking-tight">{p.descripcion}</p>
                                        <button 
                                            onClick={() => handleAddToCart(p)} 
                                            className="bg-white text-brand-dark px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-luxury hover:bg-gold-gradient transition-all active:scale-95"
                                        >
                                            Solicitar Proyecto
                                        </button>
                                    </div>
                                    {p.esSRI && (
                                        <div className="absolute top-6 left-6 flex items-center gap-2 bg-brand-dark/80 backdrop-blur-md border border-liquid-gold/40 px-4 py-2 rounded-full shadow-gold-glow-soft">
                                            <ShieldCheckIcon className="w-3 h-3 text-liquid-gold" />
                                            <span className="text-liquid-gold text-[8px] font-black tracking-[0.2em] uppercase">Validación SRI</span>
                                        </div>
                                    )}
                                </div>
                                <div className="px-5 pb-5 flex flex-col flex-grow relative z-10">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-3">{p.categoria}</p>
                                    <h3 className="font-display font-black text-white text-2xl uppercase leading-[0.9] mb-10 group-hover:text-gold-gradient transitionColors italic transition-all duration-700 tracking-tighter">{p.nombre}</h3>
                                    <div className="mt-auto flex justify-between items-center pt-8 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.2em]">Honorario Base</span>
                                            <span className="text-4xl font-display font-black text-white tracking-tighter italic text-glow">{formatCurrency(p.precio)}</span>
                                        </div>
                                        <motion.button 
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleAddToCart(p)} 
                                            className="w-16 h-16 bg-white/[0.05] border border-white/10 text-white rounded-3xl hover:bg-white hover:text-brand-dark transition-all flex items-center justify-center shadow-luxury"
                                        >
                                            <AddIcon className="w-7 h-7"/>
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* --- FOOTER OBSIDIAN --- */}
            <footer className="bg-brand-dark text-white pt-48 pb-16 relative overflow-hidden border-t border-white/10">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-liquid-gold/5 rounded-full blur-[200px] -mr-40 -mt-40 pointer-events-none" />
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-24 mb-32">
                        <div className="lg:col-span-5 space-y-12">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <CordovaLogo className="h-20 w-auto brightness-0 invert relative z-10" />
                                    <div className="absolute -inset-4 bg-liquid-gold/20 rounded-full blur-2xl animate-pulse" />
                                </div>
                                <div className="flex flex-col leading-none">
                                    <span className="text-4xl font-display font-black tracking-tighter uppercase italic text-gold-gradient">CÓRDOVA</span>
                                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600 mt-2">Boutique Gráfica</span>
                                </div>
                            </div>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-md italic tracking-tight italic">"Excelencia técnica en Pasaje, El Oro. La imprenta de confianza para líderes y empresas resilientes."</p>
                            <div className="flex gap-6">
                                {[MessageCircleIcon, PaletteIcon, UsersIcon].map((Icon, i) => (
                                    <motion.a 
                                        key={i} 
                                        href="#" 
                                        whileHover={{ y: -5, scale: 1.1 }}
                                        className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center hover:border-liquid-gold/40 hover:bg-liquid-gold/10 transition-all border border-white/10 group text-slate-500 hover:text-liquid-gold shadow-xl"
                                    >
                                        <Icon className="w-7 h-7 group-hover:animate-pulse"/>
                                    </motion.a>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-16">
                            <div className="space-y-10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 border-b border-white/5 pb-5">Atelier Sede</h4>
                                <p className="text-sm font-bold flex items-start gap-5 leading-relaxed text-slate-400 italic"><MapPinIcon className="w-7 h-7 text-liquid-gold shrink-0 opacity-60"/> Calle Colón entre <br/> Sucre y Rocafuerte.<br/>Pasaje, El Oro - EC</p>
                            </div>
                            <div className="space-y-10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 border-b border-white/5 pb-5">Concierge Directo</h4>
                                <p className="text-sm font-bold flex items-center gap-5 text-slate-400 italic"><PhoneIcon className="w-7 h-7 text-liquid-gold shrink-0 opacity-60"/> 099 308 3943</p>
                                <p className="text-sm font-bold flex items-center gap-5 text-xs truncate text-slate-400 italic"><EnvelopeIcon className="w-7 h-7 text-liquid-gold shrink-0 opacity-60"/> imprentacordova@gmail.com</p>
                            </div>
                            <div className="space-y-10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 border-b border-white/5 pb-5">Operaciones</h4>
                                <p className="text-sm font-bold flex items-start gap-5 text-slate-400 italic leading-relaxed"><ClockIcon className="w-7 h-7 text-liquid-gold shrink-0 opacity-60"/> Lunes a Sábado <br/> 08:00 AM — 07:00 PM</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">
                        <p>Imprenta Córdova · Estándar Industrial</p>
                        <div className="flex gap-14">
                            <a href="#" className="hover:text-liquid-gold transition-colors">Compliance</a>
                            <a href="#" className="hover:text-liquid-gold transition-colors">SRI Legal</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* --- CARRITO FLOTANTE (BOUTIQUE OSCURO) --- */}
            <AnimatePresence>
                {isCartOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-brand-dark/95 backdrop-blur-2xl z-[200] flex justify-end p-5" 
                        onClick={() => setIsCartOpen(false)}
                    >
                        <motion.div 
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-brand-dark border border-white/10 h-full w-full max-w-xl rounded-[4rem] shadow-heavy flex flex-col overflow-hidden box-border relative" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
                            
                            <div className="p-16 border-b border-white/10 flex justify-between items-center bg-white/[0.02] relative z-10">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-display font-black text-white uppercase tracking-tighter italic">Tu Portfolio</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Resumen de Proyectos Seleccionados</p>
                                </div>
                                <button onClick={() => setIsCartOpen(false)} className="w-16 h-16 flex items-center justify-center hover:bg-white/5 rounded-3xl border border-white/10 transition-all text-slate-400 hover:text-white">
                                    <CloseIcon className="w-8 h-8"/>
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-16 space-y-12 custom-scrollbar relative z-10">
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-32 opacity-10 flex flex-col items-center">
                                        <BoxIcon className="w-32 h-32 mb-10"/>
                                        <p className="font-black uppercase tracking-[0.5em] text-xs">No hay piezas en tu colección</p>
                                    </div>
                                ) : (
                                    cartItems.map(item => (
                                        <motion.div 
                                            key={item.producto.id} 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex justify-between items-center group"
                                        >
                                            <div className="min-w-0 flex-grow pr-12">
                                                <p className="text-2xl font-display font-black text-white group-hover:text-gold-gradient transition-all truncate italic uppercase">{item.producto.nombre}</p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.cantidad} UNIDAD(ES)</span>
                                                    <span className="text-[10px] font-bold text-liquid-gold uppercase tracking-[0.2em]">{formatCurrency(item.producto.precio)} C/U</span>
                                                </div>
                                            </div>
                                            <button onClick={() => setCartItems(cartItems.filter(i => i.producto.id !== item.producto.id))} className="w-16 h-16 rounded-[1.5rem] bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/10 shadow-lg">
                                                <TrashIcon className="w-6 h-6"/>
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {cartItems.length > 0 && (
                                <div className="p-16 bg-white/[0.02] border-t border-white/10 space-y-12 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Total Inversión Proyectada</p>
                                            <motion.span 
                                                key={subtotal}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-7xl font-display font-black text-white tracking-tighter italic text-glow"
                                            >
                                                {formatCurrency(subtotal)}
                                            </motion.span>
                                        </div>
                                    </div>
                                    <button onClick={() => window.open(`https://wa.me/593993083943?text=Hola,%20solicito%20concierge%20para%20los%20siguientes%20proyectos`)} className="w-full py-9 bg-white text-brand-dark font-black rounded-[2.5rem] shadow-gold-glow uppercase tracking-[0.4em] text-xs hover:bg-gold-gradient hover:-translate-y-1 transition-all duration-700 flex items-center justify-center gap-5 group active:scale-[0.98]">
                                        FORMALIZAR PROYECTO <WhatsAppIcon className="w-8 h-8 group-hover:scale-125 transition-transform duration-500"/>
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandingPage;
