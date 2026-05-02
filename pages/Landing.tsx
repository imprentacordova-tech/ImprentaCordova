import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, CheckCircleIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, PrinterIcon, CheckBadgeIcon, ClockIcon,
    SearchIcon, SparklesIcon, MonitorIcon, MessageCircleIcon, ChevronRightIcon,
    Loader2Icon, WalletIcon, ExclamationTriangleIcon, LayersIcon, WhatsAppIcon,
    PaletteIcon, ReceiptIcon, InfoIcon, UploadIcon, MicIcon,
    ActivityIcon, CpuIcon, LayoutIcon, RocketLaunchIcon, HomeIcon, BoltIcon, ZapIcon, FileTextIcon,
    BarChartIcon, ToolIcon, GlobeIcon, MenuIcon, FingerPrintIcon, AlertTriangleIcon,
    TerminalIcon
} from '../components/Icons';
import { ProductionWorkflow } from '../components/ProductionWorkflow';
import { TelemetryNav } from '../components/TelemetryNav';
import { SystemMonitor } from '../components/SystemMonitor';
import { MagneticButton } from '../components/MagneticButton';
import { PerspectiveCard } from '../components/PerspectiveCard';
import { CursorHUD } from '../components/CursorHUD';
import { useData } from '../contexts/DataContext';
import { analyzeImageQualityForPrint } from '../services/geminiService';
import { Producto, TrabajoEstado, TrabajoTipo, Regimen } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { useScroll, useTransform, useSpring } from 'framer-motion';
import { SEO } from '../components/SEO';

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

// --- COMPONENTES AUXILIARES ELITE ---

const StatCard: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
    <motion.div 
        variants={fadeInUp}
        className="text-center p-6 md:p-10 bg-white/40 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] border border-slate-200 group hover:border-brand-blue/30 hover:bg-white/80 transition-all duration-1000 relative overflow-hidden box-border shadow-sm hover:shadow-blue-glow"
    >
        <div className="absolute inset-0 bg-architect-grid opacity-[0.05] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] md:tracking-[0.6em] mb-3 md:mb-5 relative z-10 group-hover:text-brand-blue transition-colors">{label}</p>
        <p className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter mb-1 md:mb-2 group-hover:scale-105 transition-transform duration-1000 relative z-10 drop-shadow-sm">{value}</p>
        <p className="text-[9px] md:text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] relative z-10">{sub}</p>
    </motion.div>
);

const ServiceCard: React.FC<{ title: string; desc: string; icon: any; index: number; activeIndex: number }> = ({ title, desc, icon: Icon, index, activeIndex }) => (
    <motion.div 
        variants={fadeInUp}
        className={`group bg-white/40 backdrop-blur-3xl p-10 md:p-14 rounded-[3rem] md:rounded-[4rem] border transition-all duration-1000 hover:-translate-y-4 relative overflow-hidden ${
            index === activeIndex ? 'border-brand-blue/40 bg-white/80 shadow-blue-glow' : 'border-slate-200 hover:border-brand-blue/30 hover:bg-white/60'
        }`}
    >
        <div className="absolute inset-0 bg-architect-grid opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className={`w-20 h-20 md:w-28 md:h-28 rounded-[2rem] md:rounded-[2.5rem] bg-slate-50 border flex items-center justify-center mb-10 md:mb-14 transition-all duration-1000 ${
            index === activeIndex ? 'border-brand-blue/40 shadow-blue-glow scale-110' : 'border-slate-200 group-hover:shadow-blue-glow group-hover:border-brand-blue/40 group-hover:scale-105'
        }`}>
            <Icon className={`w-10 h-10 md:w-14 md:h-14 transition-colors duration-1000 ${index === activeIndex ? 'text-brand-blue' : 'text-slate-400 group-hover:text-brand-blue'}`} />
        </div>
        
        <h3 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-5 md:mb-8 leading-[0.85] transition-colors group-hover:text-brand-blue">{title}</h3>
        <p className="text-slate-500 leading-relaxed text-sm md:text-base font-medium group-hover:text-slate-700 transition-colors">{desc}</p>
        
        <div className="mt-10 md:mt-16 flex items-center gap-5 text-brand-blue font-black text-[10px] md:text-[11px] uppercase tracking-[0.5em] opacity-0 group-hover:opacity-100 translate-y-6 group-hover:translate-y-0 transition-all duration-1000">
            INICIAR_PROYECTO <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
        </div>
    </motion.div>
);

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { productos, loading } = useData();
    const [calcQty, setCalcQty] = useState(5);
    const [calcPrice, setCalcPrice] = useState(65);
    const [activeServiceIndex, setActiveServiceIndex] = useState(0);

    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start end", "end start"]
    });
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    const imageOpacity = useTransform(smoothProgress, [0, 0.3, 0.6, 0.9], [0.1, 1, 1, 0.1]);
    const imageScale = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1.1, 0.8]);

    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
        <div className="min-h-screen bg-brand-light font-sans selection:bg-brand-blue/20 selection:text-brand-blue overflow-x-hidden relative">
            <SEO title="Imprenta Córdova - Ingeniería Gráfica de Precisión" description="Vanguardia tecnológica en gigantografías, talonarios SRI y branding estratégico en Pasaje, El Oro." />
            
            <div className="noise-overlay" />
            <CursorHUD />
            
            {/* --- NAVEGACIÓN TELEMETRÍA FONDO --- */}
            <div className="fixed inset-0 bg-brand-light pointer-events-none z-0" />
            <div className="fixed inset-0 bg-architect-grid pointer-events-none z-0 opacity-40" />
            <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.02] bg-noise mix-blend-overlay" />
            
            {/* --- INDUSTRIAL INK PARTICLES (BLUE EDITION) --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -200, 0],
                            x: [0, Math.random() * 100 - 50, 0],
                            opacity: [0.05, 0.2, 0.05],
                            scale: [1, 1.5, 1]
                        }}
                        transition={{
                            duration: 20 + Math.random() * 15,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 10
                        }}
                        className="absolute w-1.5 h-1.5 bg-brand-blue rounded-full blur-[3px]"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>

            {/* --- NAVEGACIÓN PRINCIPAL ELITE --- */}
            <div className="fixed top-0 left-0 right-0 z-[200] px-4 md:px-10 py-8 md:py-12 pointer-events-none">
                <div className="container mx-auto max-w-[1400px] flex justify-between items-center">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-6 pointer-events-auto group cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="relative">
                            <CordovaLogo className="h-10 md:h-14 w-auto group-hover:scale-110 transition-all duration-1000" />
                            <div className="absolute -inset-4 bg-brand-blue/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.6em] mb-1">Industrial • Hub</span>
                            <span className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter group-hover:text-brand-blue transition-colors">CÓRDOVA<span className="text-brand-blue opacity-50">.</span></span>
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-4 md:gap-8 pointer-events-auto">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-5 md:p-6 bg-white/60 backdrop-blur-3xl border border-slate-200 rounded-[1.8rem] md:rounded-[2.2rem] text-slate-900 hover:border-brand-blue/40 hover:text-brand-blue transition-all duration-500 group shadow-lg active:scale-90 lg:hidden"
                        >
                            <MenuIcon className="w-6 h-6 md:w-8 md:h-8 group-hover:rotate-180 transition-transform duration-700" />
                        </button>

                        <div className="hidden lg:flex items-center gap-14 bg-white/60 backdrop-blur-3xl border border-slate-200 rounded-full px-12 py-5 shadow-sm">
                            <a href="#servicios" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] hover:text-brand-blue transition-colors">SERVICIOS</a>
                            <a href="#catalog" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] hover:text-brand-blue transition-colors">CATÁLOGO</a>
                            <a href="#cotizador" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] hover:text-brand-blue transition-colors">COTIZADOR</a>
                            <Link to="/tracking" className="text-[10px] font-black text-brand-blue uppercase tracking-[0.5em] border-l border-slate-200 pl-14 hover:scale-110 transition-all">RASTREO_ID</Link>
                        </div>

                        <Link to="/login" className="hidden sm:flex items-center gap-5 px-10 py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] hover:bg-brand-blue transition-all duration-700 shadow-xl active:scale-95">
                            <FingerPrintIcon className="w-5 h-5" /> ELITE_HUB
                        </Link>
                    </div>
                </div>
            </div>

            {/* --- MENÚ MÓVIL FULL-SCREEN TERMINAL --- */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[300] bg-white/98 backdrop-blur-3xl p-10 flex flex-col justify-between"
                    >
                        <div className="absolute inset-0 bg-architect-grid opacity-[0.08] pointer-events-none" />
                        
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse shadow-blue-glow" />
                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.6em]">NAV_TERMINAL_V4</span>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-6 bg-slate-100 border border-slate-200 rounded-[2rem] text-slate-500">
                                <CloseIcon className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="space-y-12 relative z-10 mt-10">
                            {[
                                { label: 'SERVICIOS_NÚCLEO', href: '#servicios' },
                                { label: 'CATÁLOGO_INDUSTRIAL', href: '#catalog' },
                                { label: 'ESTRATEGIA_COTIZADOR', href: '#cotizador' },
                                { label: 'RASTREO_MISIÓN', href: '/tracking', isLink: true }
                            ].map((item, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                >
                                    {item.isLink ? (
                                        <Link 
                                            to={item.href} 
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter hover:text-brand-blue transition-colors block"
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <a 
                                            href={item.href} 
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter hover:text-brand-blue transition-colors block"
                                        >
                                            {item.label}
                                        </a>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        <div className="pt-10 border-t border-slate-200 relative z-10 space-y-8">
                            <Link 
                                to="/login" 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-full flex items-center justify-center gap-6 py-8 bg-brand-blue text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.5em] shadow-blue-glow-strong"
                            >
                                <FingerPrintIcon className="w-7 h-7" /> ACCEDER_ELITE_HUB
                            </Link>
                            <div className="flex justify-center gap-10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EST. PASAJE - EC</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VERSION: 4.2.0</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- HERO SECTION ELITE --- */}
            <section className="relative pt-44 pb-20 md:pt-64 lg:pt-80 lg:pb-52 overflow-hidden px-4 md:px-10">
                <div className="absolute top-0 right-0 w-[600px] md:w-[1400px] h-[600px] md:h-[1400px] bg-brand-blue/5 rounded-full blur-[120px] md:blur-[220px] -mr-40 md:-mr-80 -mt-40 md:-mt-80 pointer-events-none" />
                
                <div className="container mx-auto max-w-[1400px] relative z-10">
                    <div className="grid lg:grid-cols-12 gap-20 items-center">
                        <motion.div 
                            initial="initial"
                            animate="animate"
                            variants={staggerContainer}
                            className="lg:col-span-7 space-y-14 md:space-y-20"
                        >
                            <motion.div variants={fadeInUp} className="inline-flex items-center gap-4 md:gap-6 px-6 md:px-8 py-3 md:py-4 bg-white border border-slate-200 rounded-full text-slate-500 backdrop-blur-2xl shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse shadow-blue-glow shrink-0" />
                                <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-slate-500">
                                    ESTÁNDAR_INDUSTRIAL_DE_PRECISIÓN
                                </p>
                            </motion.div>
                            
                            <div className="relative">
                                <h1 className="flex flex-col items-start gap-2 md:gap-4 select-none relative group/title">
                                    <motion.div variants={fadeInUp} className="relative group">
                                        <span className="text-6xl sm:text-8xl md:text-[11rem] lg:text-[13rem] font-black leading-[0.75] tracking-tighter text-slate-900 uppercase drop-shadow-sm">
                                            IMPRENTA
                                        </span>
                                        <div className="absolute -right-6 md:-right-12 -top-6 md:-top-12 w-20 md:w-32 h-20 md:h-32 border-t-4 border-r-4 border-brand-blue/20 rounded-tr-[3rem] md:rounded-tr-[5rem] transition-all duration-1000 group-hover/title:border-brand-blue/40 group-hover/title:scale-110" />
                                    </motion.div>

                                    <motion.span 
                                        variants={fadeInUp}
                                        className="text-blue-gradient text-5xl sm:text-7xl md:text-[9rem] lg:text-[11rem] font-black leading-none tracking-tighter drop-shadow-sm uppercase"
                                    >
                                        CÓRDOVA<span className="text-slate-200 opacity-50">.</span>
                                    </motion.span>
                                    
                                    <motion.div 
                                        variants={fadeInUp}
                                        className="w-full mt-6 md:mt-10 flex items-center gap-6"
                                    >
                                        <div className="flex-grow h-[1px] bg-gradient-to-r from-brand-blue/40 via-brand-blue/10 to-transparent" />
                                        <span className="text-[8px] md:text-[10px] font-black text-brand-blue uppercase tracking-[0.8em] whitespace-nowrap">VANGUARDIA_GRÁFICA_2026</span>
                                        <div className="w-2 h-2 rounded-full bg-brand-blue/30 shadow-blue-glow" />
                                    </motion.div>
                                </h1>
                            </div>

                            <motion.p variants={fadeInUp} className="text-xl md:text-3xl lg:text-5xl text-slate-500 font-black max-w-4xl leading-[1.1] tracking-tighter uppercase">
                                Ingeniería visual y manufactura de <span className="text-slate-900">precisión absoluta</span> para marcas que dominan el mercado.
                            </motion.p>

                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 md:gap-8 pt-6">
                                <MagneticButton>
                                    <a href="https://wa.me/593993083943" className="group px-12 md:px-16 py-7 md:py-9 bg-slate-900 text-white rounded-[2.5rem] font-black text-[11px] md:text-[13px] uppercase tracking-[0.4em] shadow-2xl hover:bg-brand-blue transition-all duration-700 flex items-center justify-center gap-6 active:scale-95 touch-premium">
                                        <WhatsAppIcon className="w-7 h-7 group-hover:scale-125 transition-transform duration-500"/> APERTURA_PROYECTO
                                    </a>
                                </MagneticButton>
                                <MagneticButton>
                                    <button onClick={() => fileInputRef.current?.click()} className="px-12 md:px-16 py-7 md:py-9 bg-white border border-slate-200 text-slate-600 rounded-[2.5rem] font-black text-[11px] md:text-[13px] uppercase tracking-[0.4em] hover:border-brand-blue/30 hover:bg-slate-50 transition-all duration-700 flex items-center justify-center gap-6 active:scale-95 group touch-premium">
                                        <MonitorIcon className="w-7 h-7 group-hover:text-brand-blue transition-colors"/> ANALIZADOR_IA
                                    </button>
                                </MagneticButton>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileTest} />
                            </motion.div>

                            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 pt-16 md:pt-24">
                                <StatCard label="TRAYECTORIA" value="Premium" sub="ELITE_BRANDING" />
                                <StatCard label="PRECISIÓN" value="HD+" sub="ROLAND_TECHNOLOGY" />
                                <StatCard label="PORTAFOLIO" value="12K" sub="MISSION_SUCCESS" />
                                <StatCard label="UBICACIÓN" value="07" sub="PASAJE_CENTRO" />
                            </motion.div>
                        </motion.div>

                        {/* --- IA ANALYZER WIDGET ELITE --- */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, x: 50 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="lg:col-span-5 relative group hidden lg:block"
                        >
                            <div className="absolute -inset-10 bg-brand-blue/5 rounded-[6rem] blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            
                            <div className="relative bg-white/60 backdrop-blur-3xl rounded-[5rem] p-1 shadow-2xl border border-slate-200 group-hover:border-brand-blue/30 transition-all duration-1000 overflow-hidden">
                                <div className="absolute inset-0 bg-architect-grid opacity-[0.05] pointer-events-none" />
                                <div className="p-16 space-y-14">
                                    <AnimatePresence mode="wait">
                                        {isTesting ? (
                                            <motion.div 
                                                key="testing"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="py-32 text-center space-y-12 relative overflow-hidden"
                                            >
                                                <div className="relative z-10 flex flex-col items-center">
                                                    <div className="w-32 h-32 mb-10 relative">
                                                        <Loader2Icon className="w-full h-full animate-spin text-brand-blue opacity-30" />
                                                        <div className="absolute inset-0 border-4 border-brand-blue/20 rounded-full animate-pulse" />
                                                        <div className="absolute inset-4 border-2 border-slate-100 rounded-full" />
                                                    </div>
                                                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-widest group-hover:text-brand-blue transition-colors">ÓPTICA_CRÍTICA</h3>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mt-5">SINCRONIZANDO_PERFILES_DE_COLOR</p>
                                                </div>
                                                <div className="absolute top-0 left-0 w-full h-[3px] bg-brand-blue shadow-blue-glow animate-scan-y z-20" />
                                            </motion.div>
                                        ) : testResult ? (
                                            <motion.div 
                                                key="result"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-12"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="bg-brand-blue/10 border border-brand-blue/30 p-8 rounded-[2rem] text-brand-blue shadow-sm">
                                                        <SparklesIcon className="w-10 h-10"/>
                                                    </div>
                                                    <button onClick={() => setTestResult(null)} className="p-5 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors border border-slate-200 group">
                                                        <CloseIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500"/>
                                                    </button>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em]">VEREDICTO_SISTEMA_IA</p>
                                                    <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">{testResult.veredicto}</h3>
                                                </div>
                                                <div className="p-10 bg-slate-50 rounded-[3.5rem] space-y-8 border border-slate-100 relative overflow-hidden group/result shadow-inner">
                                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-brand-blue/20 animate-scan-y" />
                                                    <p className="text-xl font-black text-slate-600 relative z-10 leading-relaxed uppercase pr-10">"{testResult.calidad}"</p>
                                                    <div className="flex flex-wrap gap-4 pt-4 relative z-10">
                                                        {testResult.advertencias.map((adv: string, i: number) => (
                                                            <span key={i} className="px-5 py-2.5 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase rounded-xl border border-rose-500/20 shadow-sm tracking-widest">{adv}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <button onClick={() => fileInputRef.current?.click()} className="w-full py-8 bg-white border border-slate-200 text-slate-500 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] hover:border-brand-blue/40 hover:text-slate-900 transition-all shadow-sm active:scale-95">
                                                    RE_SCAN_ARTIFACT
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <motion.div 
                                                key="idle"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-16"
                                            >
                                                <div className="flex items-center gap-8">
                                                    <div className="p-6 bg-brand-blue/10 border border-brand-blue/30 rounded-[2rem] text-brand-blue shadow-sm">
                                                        <SparklesIcon className="w-10 h-10 animate-pulse"/>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">VANGUARDIA_IA</h3>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">INGENIERÍA_ÓPTICA_AVANZADA</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-12">
                                                    <p className="text-slate-500 text-2xl font-black leading-relaxed tracking-tighter uppercase pr-10">Carga tu arte para un diagnóstico instantáneo de <strong className="text-slate-900">viabilidad de impresión HD+</strong>.</p>
                                                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-20 border-4 border-dashed border-slate-200 rounded-[4rem] flex flex-col items-center justify-center gap-8 hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-all group/upload relative overflow-hidden active:scale-95">
                                                        <div className="p-8 bg-slate-50 rounded-3xl group-hover/upload:scale-110 transition-transform duration-700 shadow-sm border border-slate-100">
                                                            <UploadIcon className="w-14 h-14 text-slate-300 group-hover/upload:text-brand-blue transition-colors" />
                                                        </div>
                                                        <span className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-400 group-hover/upload:text-brand-blue transition-colors">SUBIR_RECURSO_GRÁFICO</span>
                                                        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/[0.03] to-transparent opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                                                    </button>
                                                </div>

                                                <div className="pt-12 border-t border-slate-100 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity duration-1000">
                                                    <div className="flex items-center gap-4">
                                                        <AlertTriangleIcon className="w-5 h-5 text-brand-blue" />
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">SECURE_DPI_VERIFICATION</p>
                                                    </div>
                                                    <div className="h-1 w-20 bg-slate-200 rounded-full" />
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

            {/* --- SECCIÓN SERVICIOS ELITE --- */}
            <section id="servicios" className="py-40 lg:py-64 scroll-mt-24 relative overflow-hidden px-4 md:px-10">
                <div className="container mx-auto max-w-[1400px] relative z-10">
                    <motion.div 
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="max-w-5xl mb-24 md:mb-32"
                    >
                        <motion.span variants={fadeInUp} className="text-brand-blue font-black text-[11px] md:text-[13px] uppercase tracking-[0.6em] mb-6 md:mb-8 block">ATELIER_DE_SOLUCIONES_AVANZADAS</motion.span>
                        <motion.h2 variants={fadeInUp} className="text-5xl md:text-8xl lg:text-[10rem] font-black text-slate-900 uppercase tracking-tighter leading-[0.75] mb-10 md:mb-14">
                            PULIENDO TU <br/> <span className="text-blue-gradient">VISIÓN_DIGITAL</span>
                        </motion.h2>
                        <motion.p variants={fadeInUp} className="text-xl md:text-3xl lg:text-4xl text-slate-500 max-w-4xl leading-tight tracking-tighter font-black uppercase">Fusión de artesanía clásica y vanguardia tecnológica. Cada proyecto es una pieza única de ingeniería visual.</motion.p>
                    </motion.div>

                    <motion.div 
                        ref={targetRef}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 items-center"
                    >
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14">
                            <div onMouseEnter={() => setActiveServiceIndex(0)}>
                                <ServiceCard title="Gigantografías HD+" desc="Impresión en lona brillante, mate y vinilos adhesivos con tecnología Roland Eco-Solvente de 1440dpi reales." icon={PrinterIcon} index={0} activeIndex={activeServiceIndex} />
                            </div>
                            <div onMouseEnter={() => setActiveServiceIndex(1)}>
                                <ServiceCard title="Talonarios SRI" desc="Imprenta Autorizada. Facturas y Retenciones bajo normativas RIMPE con papel químico premium autocopiativo." icon={ShieldCheckIcon} index={1} activeIndex={activeServiceIndex} />
                            </div>
                            <div onMouseEnter={() => setActiveServiceIndex(2)}>
                                <ServiceCard title="Branding Elite" desc="Diseño de identidad imponente que posiciona tu marca en la cima del mercado regional con acabados de lujo." icon={PaletteIcon} index={2} activeIndex={activeServiceIndex} />
                            </div>
                            <div onMouseEnter={() => setActiveServiceIndex(3)}>
                                <ServiceCard title="Instalación Pro" desc="Despliegue táctico de publicidad exterior con estructuras reforzadas y acabados de precisión arquitectónica." icon={ToolIcon} index={3} activeIndex={activeServiceIndex} />
                            </div>
                        </div>

                        <div className="lg:col-span-4 h-[700px] relative rounded-[4rem] md:rounded-[5rem] overflow-hidden border border-slate-200 shadow-2xl group">
                            <div className="absolute inset-0 bg-architect-grid opacity-[0.1] pointer-events-none" />
                            <motion.div 
                                animate={{ top: ["-10%", "110%"] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent z-20 pointer-events-none shadow-blue-glow"
                            />

                            <div className="absolute top-12 left-12 z-20 font-black text-[9px] text-slate-300 tracking-[0.5em] uppercase pointer-events-none group-hover:text-brand-blue transition-colors">
                                <p>SENSING_MODULE: ACTIVE</p>
                                <p>SPECTROMETRY: NOMINAL</p>
                                <p>DEPTH: 1440DPI_SCAN</p>
                            </div>

                            <motion.img 
                                key={activeServiceIndex}
                                initial={{ opacity: 0, scale: 1.3, filter: "blur(30px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                src={
                                    activeServiceIndex === 0 
                                    ? "/images/landing/printer_gold.png"
                                    : activeServiceIndex === 1
                                    ? "/images/landing/talonarios.png"
                                    : activeServiceIndex === 2
                                    ? "/images/landing/branding.png"
                                    : "/images/landing/installation.png"
                                }
                                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-[2s]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/40 opacity-80" />
                            <motion.div 
                                style={{ opacity: imageOpacity, scale: imageScale }}
                                className="absolute inset-0 flex items-center justify-center p-16 pointer-events-none"
                            >
                                <div className="text-center space-y-6">
                                    <div className="inline-block px-6 py-2 border border-brand-blue/30 rounded-full bg-white/40 backdrop-blur-md">
                                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.8em]">PRECISION_CORE</p>
                                    </div>
                                    <h3 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none drop-shadow-sm">CALIDAD<br/><span className="text-blue-gradient">CÓRDOVA</span></h3>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- SECCIÓN COTIZADOR ELITE --- */}
            <section id="cotizador" className="py-40 lg:py-64 relative overflow-hidden px-4 md:px-10">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                
                <div className="container mx-auto max-w-[1400px] flex flex-col lg:flex-row gap-24 md:gap-40 items-center relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:w-1/2 space-y-16 md:space-y-24"
                    >
                        <div className="space-y-6">
                            <span className="text-brand-blue font-black text-[11px] md:text-[13px] uppercase tracking-[0.5em]">SIMULADOR_DE_INVERSIÓN_ESTRATÉGICA</span>
                            <h2 className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 uppercase tracking-tighter leading-[0.8]">
                                PROYECTA TU <br/> <span className="text-blue-gradient">ÉXITO_PASAJE</span>
                            </h2>
                        </div>
                        
                        <div className="space-y-20">
                            <div className="space-y-10">
                                <div className="flex justify-between items-end">
                                    <label className="text-[12px] font-black uppercase text-slate-400 tracking-[0.4em]">01_VOLUMEN_DE_PRODUCCIÓN</label>
                                    <motion.span 
                                        key={calcQty}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-5xl font-black text-brand-blue tracking-tighter"
                                    >
                                        {calcQty} <span className="text-xl text-slate-400">UDS</span>
                                    </motion.span>
                                </div>
                                <div className="relative h-16 flex items-center group">
                                    <input type="range" min="1" max="100" value={calcQty} onChange={e => {
                                        const qty = parseInt(e.target.value);
                                        setCalcQty(qty);
                                        if(qty >= 10) setCalcPrice(qty * 11.5);
                                        else if(qty >= 5) setCalcPrice(qty * 13.5);
                                        else setCalcPrice(qty * 15.5);
                                    }} className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brand-blue group-hover:bg-slate-300 transition-all" />
                                    <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
                                        {[...Array(11)].map((_, i) => <div key={i} className="w-[1px] h-3 bg-slate-300 mt-6" />)}
                                    </div>
                                </div>
                            </div>

                            <motion.div 
                                whileHover={{ y: -10 }}
                                className="p-12 md:p-16 bg-white/60 backdrop-blur-3xl rounded-[4rem] border border-slate-200 hover:border-brand-blue/20 transition-all duration-1000 flex flex-col md:flex-row items-center justify-between shadow-xl relative overflow-hidden group/quote"
                            >
                                <div className="absolute inset-0 bg-architect-grid opacity-[0.05] pointer-events-none" />
                                <div className="space-y-4 relative z-10 text-center md:text-left mb-10 md:mb-0">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">INVERSIÓN_ESTIMADA_ELITE</p>
                                    <motion.p 
                                        key={calcPrice}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-7xl md:text-8xl font-black text-slate-900 tracking-tighter drop-shadow-sm"
                                    >
                                        {formatCurrency(calcPrice)}
                                    </motion.p>
                                </div>
                                <a 
                                    href={`https://wa.me/593993083943?text=Hola,%20solicito%20cotización%20formal%20para%20${calcQty}%20unidades%20bajo%20el%20Protocolo%20Elite.`} 
                                    className="w-28 h-28 md:w-36 md:h-36 bg-slate-900 text-white rounded-[3rem] flex items-center justify-center shadow-2xl hover:bg-brand-blue hover:scale-110 transition-all duration-700 relative z-10 active:scale-90 group/wa"
                                >
                                    <WhatsAppIcon className="w-12 h-12 md:w-16 md:h-16 group-hover/wa:rotate-12 transition-transform duration-500" />
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
                        <div className="aspect-square bg-slate-100 rounded-[5rem] overflow-hidden border border-slate-200 group-hover:border-brand-blue/40 transition-all duration-1000 relative shadow-2xl">
                             <div className="absolute inset-0 bg-architect-grid opacity-[0.1] pointer-events-none" />
                             <img src="/images/landing/printer_gold.png" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-all duration-[3s]" alt="Roland Engine" />
                             <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent flex flex-col justify-end p-16 md:p-24">
                                <motion.div 
                                    whileHover={{ y: -10 }}
                                    className="bg-white/60 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-slate-200 hover:border-brand-blue/30 transition-all duration-1000 shadow-sm"
                                >
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center border border-brand-blue/30">
                                            <ShieldCheckIcon className="w-6 h-6 text-brand-blue" />
                                        </div>
                                        <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tight">PROTOCOLO_ROLAND_V4</h4>
                                    </div>
                                    <p className="text-base font-medium text-slate-500 leading-relaxed uppercase tracking-tighter">Calibración micrométrica de cabezales y perfiles de color cinemáticos para cada sustrato industrial de alta resistencia.</p>
                                </motion.div>
                             </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- WORKFLOW Y OTROS COMPONENTES --- */}
            <ProductionWorkflow />
            <SystemMonitor />

            {/* --- FOOTER ELITE --- */}
            <footer className="py-24 border-t border-slate-200 px-4 md:px-10 bg-slate-50">
                <div className="container mx-auto max-w-[1400px]">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                        <div className="space-y-6">
                            <div className="flex items-center gap-6 justify-center md:justify-start">
                                <CordovaLogo className="h-10 w-auto brightness-0" />
                                <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase">CÓRDOVA<span className="text-brand-blue">.</span></span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">INGENIERÍA_GRÁFICA_DE_VANGUARDIA_DESDE_PASAJE</p>
                        </div>
                        
                        <div className="flex gap-14">
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">COORDENADAS</p>
                                <p className="text-xs font-black text-slate-600">Av. Jubones y Calle S/N <br/> Pasaje, El Oro, Ecuador</p>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">UPLINK_COMMS</p>
                                <p className="text-xs font-black text-slate-600">099 308 3943 <br/> info@imprentacordova.net</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                             <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:border-brand-blue/40 transition-colors cursor-pointer group shadow-sm">
                                <WhatsAppIcon className="w-6 h-6 text-slate-400 group-hover:text-brand-blue transition-colors" />
                             </div>
                             <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center hover:border-brand-blue/40 transition-colors cursor-pointer group shadow-sm">
                                <GlobeIcon className="w-6 h-6 text-slate-400 group-hover:text-brand-blue transition-colors" />
                             </div>
                        </div>
                    </div>
                    
                    <div className="mt-24 pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">© 2026 IMPRENTA CÓRDOVA - TODOS LOS DERECHOS RESERVADOS_</p>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">SYSTEM_STATUS: NOMINAL_100%</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;


export default LandingPage;
