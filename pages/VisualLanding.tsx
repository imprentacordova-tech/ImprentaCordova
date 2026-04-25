
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
    ShieldCheckIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, CheckCircleIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, PrinterIcon, CheckBadgeIcon, ClockIcon,
    SparklesIcon, MessageCircleIcon, ChevronRightIcon,
    Loader2Icon, WhatsAppIcon, PaletteIcon, InfoIcon, UploadIcon, LockIcon
} from '../components/Icons';
import { useData } from '../contexts/DataContext';
import { analyzeImageQualityForPrint } from '../services/geminiService';
import { Producto, Trabajo } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';

// --- ATELIER COMPONENTS ---

const StatCard: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
    <div className="text-center p-8 transition-all duration-700 bg-white/[0.01] hover:bg-white/[0.03] group rounded-[2rem] border border-transparent hover:border-white/5">
        <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.5em] mb-4 opacity-50 group-hover:opacity-100 transition-opacity">{label}</p>
        <p className="text-5xl md:text-7xl font-display italic font-black text-white tracking-tighter mb-2 group-hover:scale-105 transition-transform duration-1000 group-hover:text-yellow-400 leading-none">{value}</p>
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">{sub}</p>
    </div>
);

const BentoCard: React.FC<{ title: string; desc: string; icon: any; className?: string; image?: string; dark?: boolean }> = ({ title, desc, icon: Icon, className = "", image, dark }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`group relative overflow-hidden rounded-[2.5rem] transition-all duration-1000 hover:shadow-luxury ${className} ${dark ? 'bg-[#002b80] text-white' : 'bg-white text-[#001f5c]'}`}
    >
        {image && <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-50 transition-all duration-1000 scale-110 group-hover:scale-100"><img src={image} className="w-full h-full object-cover grayscale mix-blend-overlay" alt="" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-[#001f5c] via-transparent to-transparent z-0 pointer-events-none opacity-60"></div>
        <div className="relative z-10 p-8 md:p-12 h-full flex flex-col justify-end">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 ${dark ? 'bg-white/5 border border-white/10' : 'bg-[#001f5c]/5 border border-[#001f5c]/10'}`}>
                <Icon className={`w-6 h-6 ${dark ? 'text-yellow-400' : 'text-[#001f5c]'}`} />
            </div>
            <h3 className={`text-4xl md:text-5xl font-display italic font-black mb-4 leading-none tracking-tighter ${dark ? 'text-white' : 'text-[#001f5c]'}`}>{title}</h3>
            <p className={`text-sm font-light leading-relaxed max-w-sm ${dark ? 'text-white/60' : 'text-[#001f5c]/60'}`}>{desc}</p>
            <div className="mt-8 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-[-20px] group-hover:translate-x-0 text-yellow-400">
                <span>VER DETALLES</span> <ArrowRightIcon className="w-4 h-4" />
            </div>
        </div>
    </motion.div>
);

const ServiceItem: React.FC<{ title: string; desc: string; icon: any; index: string }> = ({ title, desc, icon: Icon, index }) => (
    <div className="group py-12 md:py-20 flex flex-col md:flex-row gap-8 md:gap-16 items-start hover:bg-white/[0.02] px-6 md:px-12 transition-all duration-1000 relative overflow-hidden rounded-[3rem] border border-transparent hover:border-white/5">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-24 w-1 bg-yellow-400 scale-y-0 group-hover:scale-y-100 transition-transform duration-700 origin-center"></div>
        <span className="text-5xl md:text-7xl font-display italic font-black text-white/5 group-hover:text-yellow-400/10 transition-colors duration-1000 w-24 leading-none">{index}</span>
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/[0.03] flex items-center justify-center text-yellow-400 transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 shadow-2xl backdrop-blur-3xl border border-white/5">
            <Icon className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <div className="flex-grow space-y-4">
            <h3 className="text-3xl md:text-5xl font-display italic font-black text-white tracking-tighter uppercase leading-none">{title}</h3>
            <p className="text-base font-light text-white/40 max-w-2xl leading-relaxed">{desc}</p>
        </div>
        <button className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-white/5 text-white/20 group-hover:text-yellow-400 transition-all duration-700 hover:bg-yellow-400 hover:text-[#001f5c] hover:scale-110 group-hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] active:scale-90">
            <ArrowRightIcon className="w-6 h-6 -rotate-45 group-hover:rotate-0 transition-transform duration-700" />
        </button>
    </div>
);

// --- MAIN ATELIER PAGE ---

const VisualLanding: React.FC = () => {
    const navigate = useNavigate();
    const { createPublicOrder, productos: allProductos, loading: dataLoading } = useData();
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<Trabajo | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    const { scrollYProgress } = useScroll();
    const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

    useEffect(() => {
        const handleScroll = () => {
            const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
            const currentScroll = window.pageYOffset;
            setScrollProgress((currentScroll / totalScroll) * 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleAddToCart = (p: Producto) => {
        setCartItems(prev => {
            const exists = prev.find(item => item.producto.id === p.id);
            if (exists) return prev.map(item => item.producto.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            return [...prev, { producto: p, cantidad: 1 }];
        });
        setIsCartOpen(true);
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientName || !clientPhone) return;
        setIsPlacingOrder(true);
        try {
            const newOrder = await createPublicOrder({ nombre: clientName, telefono: clientPhone }, cartItems);
            setCompletedOrder(newOrder);
            setCartItems([]);
        } catch (error) {
            alert("Error al procesar el pedido. Intente por WhatsApp.");
        } finally {
            setIsPlacingOrder(false);
        }
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
        <div className="relative min-h-screen bg-[#001f5c] font-sans selection:bg-cordova-yellow selection:text-brand-dark transition-colors duration-500 overflow-x-hidden">
            <SEO 
                title="Imprenta Córdova | Alta Relojería Gráfica"
                description="Transformamos visiones en piezas maestras utilizando tecnología Roland High-Fidelity. Servicios de gigantografías, facturas SRI y diseño de autor."
            />

            {/* Cinematic Noise & Scanline */}
            <div className="fixed inset-0 pointer-events-none z-[200] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
            <div className="fixed inset-0 pointer-events-none z-[150] opacity-[0.05]">
                <div className="w-full h-[2px] bg-yellow-400 absolute animate-scan shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>
            </div>

            {/* Progress Track */}
            <div className="fixed top-0 left-0 w-full h-[2px] bg-white/5 z-[250]">
                <motion.div 
                    className="h-full bg-gradient-to-r from-yellow-400 via-white to-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>
            
            {/* Premium Header */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#001f5c]/60 backdrop-blur-3xl border-b border-white/5 py-4 lg:py-6">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="bg-white p-2 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.3)] group-hover:rotate-[360deg] transition-all duration-[1.5s]">
                            <CordovaLogo className="h-7 w-auto text-[#001f5c]" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl lg:text-3xl font-display italic font-black text-white tracking-tighter uppercase leading-none">CÓRDOVA</h1>
                            <span className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.5em] mt-1">Atelier de Autor</span>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-10 text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
                        <a href="#experiencia" className="hover:text-white transition-colors">Experiencia</a>
                        <a href="#atelier" className="hover:text-white transition-colors">El Atelier</a>
                        <a href="#catalog" className="hover:text-white transition-colors">Curaduría</a>
                        <a href="#sri" className="text-red-500 hover:text-red-400 transition-colors">Protocolo SRI</a>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-8">
                        <button onClick={() => { setIsCartOpen(true); setIsCheckingOut(false); setCompletedOrder(null); }} className="relative p-2 text-white/50 hover:text-yellow-400 transition-all group">
                            <ShoppingCartIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-[#001f5c]">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                        <Link to="/login" className="hidden md:flex px-8 py-3 bg-white/5 border border-white/10 hover:border-yellow-400/50 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all hover:bg-yellow-400 hover:text-[#001f5c] shadow-xl active:scale-95 group">
                            <LockIcon className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                            <span>Privado</span>
                        </Link>
                        <button className="lg:hidden p-2 text-white/50" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                            <div className="w-6 h-5 flex flex-col justify-between">
                                <span className={`h-0.5 w-full bg-current transition-all ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                                <span className={`h-0.5 w-full bg-current transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                                <span className={`h-0.5 w-full bg-current transition-all ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-0 z-[1000] bg-[#001f5c] flex flex-col p-10"
                    >
                        <div className="flex justify-between items-center mb-20">
                             <CordovaLogo className="h-10 w-auto text-white" />
                             <button onClick={() => setIsMobileMenuOpen(false)} className="p-4 bg-white/5 rounded-full">
                                <CloseIcon className="w-8 h-8 text-white" />
                             </button>
                        </div>
                        <div className="flex flex-col gap-10 text-center">
                            {['experiencia', 'atelier', 'catalog', 'sri'].map((item) => (
                                <a 
                                    key={item} 
                                    href={`#${item}`} 
                                    onClick={() => setIsMobileMenuOpen(false)} 
                                    className="text-5xl font-display font-black text-white hover:text-yellow-400 transition-colors uppercase italic tracking-tighter"
                                >
                                    {item}
                                </a>
                            ))}
                            <Link to="/tracking" onClick={() => setIsMobileMenuOpen(false)} className="text-5xl font-display font-black text-white uppercase italic tracking-tighter">Tracking</Link>
                        </div>
                        <div className="mt-auto pt-10 border-t border-white/5 flex flex-col gap-6">
                            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-6 bg-yellow-400 text-[#001f5c] text-center font-black uppercase tracking-widest rounded-2xl">Terminal Privado</Link>
                            <p className="text-[8px] font-black text-white/20 text-center uppercase tracking-[0.5em]">v2.6 Hyperion Atelier Engine</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- HERO SECTION: THE MASTERPIECE --- */}
            <section className="relative min-h-[110vh] flex items-center justify-center overflow-hidden pt-20">
                <motion.div style={{ y: backgroundY }} className="absolute inset-0 z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1626014303757-636611689443?q=80&w=2574&auto=format&fit=crop" 
                      alt="Cinematic printing mesh"
                      className="w-full h-full object-cover opacity-[0.1] mix-blend-luminosity scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#001f5c]/0 via-[#001f5c]/40 to-[#001f5c]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-400/5 blur-[150px] rounded-full animate-pulse"></div>
                </motion.div>
                
                <div className="container mx-auto px-8 relative z-10 text-center space-y-12">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-flex items-center gap-4 px-6 py-2 bg-white/[0.03] rounded-full border border-white/10 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)] backdrop-blur-3xl"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] leading-none">The Printing Revolution 2026</span>
                    </motion.div>
                    
                    <div className="space-y-4">
                        <motion.h1 
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            className="text-[15vw] md:text-[12vw] lg:text-[10vw] font-display font-black italic text-white leading-[0.8] tracking-tighter uppercase"
                        >
                            ALTA <br/>
                            <span className="text-yellow-400 not-italic font-editorial font-normal tracking-normal">GRÁFICA.</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            transition={{ duration: 2, delay: 0.5 }}
                            className="text-lg md:text-2xl text-white/60 font-light max-w-4xl mx-auto leading-relaxed tracking-tight"
                        >
                            Elevamos la identidad de su marca mediante precisión nanométrica <span className="text-white font-medium">Hyper-Fidelity</span> y acabados que definen el lujo industrial.
                        </motion.p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="flex flex-col sm:flex-row gap-6 items-center justify-center pt-8"
                    >
                        <a href="#catalog" className="w-full sm:w-auto px-12 py-6 bg-yellow-400 text-[#001f5c] rounded-full font-black uppercase tracking-[0.3em] transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] text-[10px] shadow-2xl active:scale-95">
                            Explorar Curaduría
                        </a>
                        <a href="#sri" className="w-full sm:w-auto px-12 py-6 bg-white/[0.05] border border-white/10 text-white rounded-full font-black uppercase tracking-[0.3em] transition-all duration-500 hover:bg-white hover:text-brand-dark hover:scale-105 text-[10px] flex items-center justify-center gap-3 active:scale-95 group">
                            <span>Protocolo S.R.I.</span>
                            <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </a>
                    </motion.div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10 pt-24 border-t border-white/5 max-w-6xl mx-auto opacity-80">
                        <StatCard label="TRAYECTORIA" value="15" sub="AÑOS DE HISTORIA" />
                        <StatCard label="RESOLUCIÓN" value="12K" sub="DPI DE PRECISIÓN" />
                        <StatCard label="COBERTURA" value="100%" sub="GAMUT CROMÁTICO" />
                        <StatCard label="ATENCIÓN" value="24/7" sub="SOPORTE CRÍTICO" />
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-10 left-10 hidden xl:flex items-center gap-6 opacity-30">
                    <div className="h-20 w-[1px] bg-gradient-to-t from-yellow-400 to-transparent"></div>
                    <p className="text-[8px] font-black text-white uppercase tracking-[0.8em] vertical-text">SECURE TERMINAL ACTIVE</p>
                </div>
            </section>

            {/* --- BENTO GRID: ATELIER HIGHLIGHTS --- */}
            <section id="experiencia" className="py-32 relative z-10 bg-[#001f5c]">
                <div className="container mx-auto px-8">
                    <div className="mb-20 flex flex-col md:flex-row justify-between items-end gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px w-10 bg-yellow-400"></div>
                                <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.5em]">Portfolio de Excelencia</p>
                            </div>
                            <h2 className="text-6xl md:text-8xl font-display font-black text-white tracking-tighter uppercase leading-none">
                                LEGADO <br/> <span className="text-white/20">VISUAL</span>
                            </h2>
                        </div>
                        <p className="text-white/40 max-w-sm text-right font-light italic text-xl border-r-2 border-yellow-400/20 pr-10">
                            Donde la tecnología de vanguardia Roland converge con la maestría artesanal para crear piezas de valor incalculable.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-8">
                        <BentoCard 
                            title="Atelier Pasaje"
                            desc="Nuestro showroom de experiencia inmersiva. Un entorno diseñado para la materialización de conceptos gráficos complejos."
                            icon={MapPinIcon}
                            className="md:col-span-4 lg:col-span-8 lg:row-span-2 min-h-[600px]"
                            image="https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?q=80&w=2070&auto=format&fit=crop"
                            dark
                        />
                        <BentoCard 
                            title="Elite Finish"
                            desc="Acabados en Foil de Oro, Laminados Mate y Troquelado Digital."
                            icon={SparklesIcon}
                            className="md:col-span-2 lg:col-span-4 min-h-[400px] bg-gradient-to-br from-[#002b80] to-[#001f5c]"
                            dark
                        />
                        <BentoCard 
                            title="Logística 24/7"
                            desc="Seguimiento en tiempo real de cada micra de su proyecto."
                            icon={ClockIcon}
                            className="md:col-span-2 lg:col-span-4 min-h-[400px]"
                            image="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
                            dark
                        />
                    </div>
                </div>
            </section>

            {/* --- AI DIAGNOSTIC SECTION --- */}
            <section className="py-40 bg-[#001f5c] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                <div className="container mx-auto px-8">
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <h2 className="text-5xl md:text-8xl font-display font-black text-white leading-none tracking-tighter uppercase">
                                    DIAGNÓSTICO <br/> <span className="text-yellow-400">CRYSTAL-A.I.</span>
                                </h2>
                                <p className="text-xl text-white/60 font-light leading-relaxed max-w-xl">
                                    Nuestro algoritmo propietario analiza su archivo en busca de aberraciones cromáticas y densidad de píxeles para garantizar una impresión de nivel museográfico.
                                </p>
                            </div>
                            
                            <div className="space-y-8">
                                {[
                                    { t: "Análisis de Espacio de Color", d: "Validación automática de perfiles ICC y gama CMYK." },
                                    { t: "Auditoría de Resolución", d: "Detección de interpolación y pérdida de detalle." },
                                    { t: "Certificación de Trazos", d: "Verificación de vectores y sobreimpresiones." }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-6 group">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-yellow-400 group-hover:bg-yellow-400 group-hover:text-brand-dark transition-all duration-500">
                                            <CheckBadgeIcon className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-white font-black uppercase text-[10px] tracking-widest">{item.t}</h4>
                                            <p className="text-white/40 text-sm font-light">{item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-10 bg-yellow-400/5 rounded-full blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <div className="relative glass-card border-white/10 p-8 md:p-14 shadow-luxury overflow-hidden min-h-[500px] flex flex-col justify-center">
                                {isTesting && <div className="absolute top-0 left-0 w-full h-[2px] bg-yellow-400 animate-scan z-20 shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>}
                                
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileTest} accept="image/*" />
                                
                                {isTesting ? (
                                    <div className="text-center space-y-10 animate-pulse">
                                        <Loader2Icon className="w-20 h-20 animate-spin mx-auto text-yellow-400" />
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-display font-black text-white uppercase tracking-widest italic">CALIBRANDO...</h3>
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.4em]">Handshake con el Núcleo Gráfico</p>
                                        </div>
                                    </div>
                                ) : testResult ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                                        <div className="flex justify-between items-center">
                                            <span className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest rounded-full">Reporte Alpha Generado</span>
                                            <button onClick={() => setTestResult(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><CloseIcon className="w-6 h-6 text-white/40"/></button>
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-4xl md:text-5xl font-display font-black text-white leading-tight tracking-tighter uppercase italic">{testResult.veredicto}</h3>
                                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-3xl">
                                                <p className="text-lg text-white/60 font-light italic leading-relaxed">"{testResult.calidad}"</p>
                                            </div>
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-yellow-400 hover:text-brand-dark transition-all duration-500 active:scale-95 shadow-xl">
                                            Nueva Auditoría
                                        </button>
                                    </motion.div>
                                ) : (
                                    <div className="space-y-12 text-center">
                                        <div className="space-y-4">
                                            <h3 className="text-5xl font-display font-black text-white tracking-tighter uppercase italic">AUDITORÍA <br/> <span className="text-white/20">REMOTA</span></h3>
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Garantía de Fidelidad Roland</p>
                                        </div>
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="group/upload relative p-20 bg-white/[0.015] rounded-[3rem] border-2 border-dashed border-white/5 hover:border-yellow-400/30 transition-all duration-1000 cursor-pointer flex flex-col items-center gap-6"
                                        >
                                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center group-hover/upload:rotate-[360deg] transition-all duration-[1.5s]">
                                                <UploadIcon className="w-8 h-8 text-yellow-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-display font-black text-white mb-2 uppercase italic tracking-tight">Cargar Archivo</p>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">JPG, PNG o PDF de Alta Resolución</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CATALOG: PIECES OF EXHIBITION --- */}
            <section id="catalog" className="py-40 bg-[#001f5c] relative">
                <div className="container mx-auto px-8">
                    <div className="flex flex-col lg:flex-row justify-between items-end mb-32 gap-16">
                        <div className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="h-[2px] w-16 bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_15px_rgba(250,204,21,0.3)]"></div>
                                <h2 className="text-[11px] font-black text-yellow-400 tracking-[0.6em] uppercase">Selección de Curaduría</h2>
                            </div>
                            <h3 className="text-[12vw] lg:text-[8vw] font-display italic font-black text-white tracking-tighter leading-[0.8] uppercase">
                                OBRA <br/> <span className="text-white/20 not-italic font-editorial font-normal">GRÁFICA</span>
                            </h3>
                        </div>
                        <div className="max-w-md space-y-6 text-right pb-4">
                            <p className="text-xl text-white/40 font-light italic leading-relaxed border-r-2 border-yellow-400/20 pr-10">
                                Cada pieza fabricada en nuestro atelier es tratada como una obra de arte, sometida a estrictos protocolos de secado y curado.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                        {allProductos.map((p, idx) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ delay: idx * 0.1, duration: 1 }}
                                className="group relative flex flex-col h-full"
                            >
                                <div className="aspect-[4/5] relative overflow-hidden rounded-[3rem] bg-[#002b80] border border-white/5 shadow-2xl transition-all duration-1000 group-hover:shadow-[0_0_30px_rgba(250,204,21,0.2)]">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#001f5c] via-transparent to-transparent z-10 opacity-60"></div>
                                    <img 
                                        src={p.imagenUrl || 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=800&auto=format&fit=crop'} 
                                        className="w-full h-full object-cover transform scale-110 group-hover:scale-100 transition-transform duration-[3s] ease-out grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100" 
                                        alt={p.nombre} 
                                    />
                                    
                                    <div className="absolute top-8 right-8 z-20">
                                        <button 
                                            onClick={() => handleAddToCart(p)}
                                            className="w-16 h-16 rounded-[2rem] bg-[#001f5c]/60 backdrop-blur-3xl border border-white/10 flex items-center justify-center text-white/50 hover:bg-yellow-400 hover:text-[#001f5c] transition-all duration-500 shadow-2xl active:scale-90"
                                        >
                                            <AddIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                    
                                    <div className="absolute bottom-10 left-10 right-10 z-20 space-y-2">
                                        <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em]">CATEGORÍA: {p.categoria || 'PREMIUM'}</p>
                                        <h4 className="text-4xl font-display font-black italic text-white tracking-tighter uppercase leading-none group-hover:text-yellow-400 transition-colors duration-700">{p.nombre}</h4>
                                    </div>
                                </div>
                                
                                <div className="py-10 px-4 flex flex-col flex-grow">
                                    <p className="text-white/40 font-light text-sm italic mb-10 line-clamp-2 leading-relaxed">"{p.descripcion}"</p>
                                    <div className="mt-auto flex items-center justify-between pt-8 border-t border-white/5">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block">Inversión Sugerida</span>
                                            <span className="text-3xl font-display font-black text-white">{formatCurrency(p.precio)}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleAddToCart(p)}
                                            className="px-8 py-4 bg-white/5 hover:bg-white text-white hover:text-brand-dark rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 active:scale-95"
                                        >
                                            RESERVAR
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- SRI PROTOCOL SECTION --- */}
            <section id="sri" className="py-40 bg-[#001f5c] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 blur-[150px] rounded-full pointer-events-none"></div>
                <div className="container mx-auto px-8 relative z-10">
                    <div className="max-w-6xl mx-auto bg-gradient-to-br from-white/[0.03] to-transparent rounded-[4rem] border border-white/10 p-10 md:p-24 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-10 md:p-20 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
                            <ShieldCheckIcon className="w-64 h-64 text-red-600" />
                        </div>
                        
                        <div className="grid lg:grid-cols-2 gap-20 relative z-10">
                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-4 px-5 py-2 bg-red-600/10 border border-red-600/20 rounded-full text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                                        <ShieldCheckIcon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Protocolo Gubernamental</span>
                                    </div>
                                    <h2 className="text-6xl md:text-[7rem] font-display font-black text-white leading-[0.8] tracking-tighter uppercase italic">
                                        SERVICIO <br/> <span className="text-red-600">S.R.I.</span>
                                    </h2>
                                    <p className="text-xl text-white/60 font-light leading-relaxed">
                                        Gestión autorizada de documentos pre-impresos con certificación de seguridad absoluta. Procesamos sus comprobantes con validez legal inmediata.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <a href="https://wa.me/593" className="px-10 py-6 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all shadow-xl hover:shadow-[0_0_40px_rgba(220,38,38,0.4)]">Iniciar Trámite</a>
                                    <Link to="/tracking" className="px-10 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-brand-dark transition-all">Ver Estado de Autorización</Link>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 items-center">
                                {[
                                    { t: "Facturas", v: "Autorizado" },
                                    { t: "Retenciones", v: "Validado" },
                                    { t: "Notas de Venta", v: "Sincronizado" },
                                    { t: "Guías de Remisión", v: "Certificado" }
                                ].map((item, i) => (
                                    <div key={i} className="p-8 bg-black/40 border border-white/5 rounded-3xl space-y-2 backdrop-blur-xl group hover:border-red-600/30 transition-all">
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">{item.t}</p>
                                        <p className="text-xl font-display font-black text-white italic tracking-tighter uppercase">{item.v}</p>
                                        <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                                            <div className="h-full bg-red-600/50 w-full animate-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ATELIER FOOTER --- */}
            <footer className="bg-[#001f5c] text-white pt-48 pb-20 relative border-t border-white/5">
                <div className="container mx-auto px-8 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-24 mb-32">
                        <div className="lg:col-span-6 space-y-16">
                            <div className="flex flex-col lg:flex-row items-center gap-8 text-center lg:text-left">
                                <div className="w-24 h-24 bg-white flex items-center justify-center rounded-[2rem] shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                    <CordovaLogo className="h-12 w-auto text-[#001f5c]" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-5xl font-display font-black tracking-tighter uppercase text-white leading-none italic">CÓRDOVA</h2>
                                    <p className="text-[11px] font-black tracking-[0.8em] text-yellow-400 uppercase opacity-80">Excelencia Tradicional</p>
                                </div>
                            </div>
                            <h3 className="text-4xl md:text-[5rem] font-display font-black text-white/90 leading-[0.85] tracking-tighter uppercase italic max-w-2xl">
                                DEFINIENDO EL <span className="text-yellow-400">ESTÁNDAR</span> DEL DISEÑO INDUSTRIAL.
                            </h3>
                            <div className="flex gap-8 justify-center lg:justify-start">
                                {[WhatsAppIcon, MessageCircleIcon, StarIcon].map((Icon, i) => (
                                    <button key={i} className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-yellow-400 hover:border-yellow-400 transition-all duration-500">
                                        <Icon className="w-6 h-6" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Localización</h4>
                                    <div className="text-xl font-light text-white/60 space-y-2 italic">
                                        <p>Pasaje, El Oro — Ecuador</p>
                                        <p className="text-white font-black uppercase tracking-tight">Calle Colón e/ Sucre y Rocafuerte</p>
                                        <p className="text-sm opacity-50 uppercase tracking-widest">Diagonal al Parque Central</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Canales de Enlace</h4>
                                    <div className="text-2xl font-display font-black text-white space-y-4">
                                        <p className="flex items-center gap-4 hover:text-yellow-400 cursor-pointer transition-colors">
                                            <PhoneIcon className="w-6 h-6 text-yellow-400"/> 
                                            <span>099 308 3943</span>
                                        </p>
                                        <p className="flex items-center gap-4 hover:text-yellow-400 cursor-pointer transition-colors">
                                            <EnvelopeIcon className="w-6 h-6 text-yellow-400"/>
                                            <span className="text-base lowercase tracking-normal font-editorial font-normal">ventas@imprentacordova.com</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/[0.02] p-12 rounded-[3rem] border border-white/5 space-y-12">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-yellow-400 text-center">Protocolo de Atención</h4>
                                <div className="space-y-10">
                                    <div className="space-y-2 text-center">
                                        <p className="text-[9px] text-white/20 uppercase tracking-widest font-black">Ciclo Operativo</p>
                                        <p className="text-3xl font-display font-black text-white italic tracking-tighter uppercase">08:00 — 19:00</p>
                                        <p className="text-[8px] text-white/10 uppercase tracking-widest">LUNES A VIERNES</p>
                                    </div>
                                    <div className="space-y-2 text-center">
                                        <p className="text-[9px] text-white/20 uppercase tracking-widest font-black">Fase Intensiva</p>
                                        <p className="text-3xl font-display font-black text-white italic tracking-tighter uppercase">09:00 — 14:00</p>
                                        <p className="text-[8px] text-white/10 uppercase tracking-widest">SÁBADOS</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
                        <p>&copy; 2026 IMPRENTA CÓRDOVA ATELIER. ALL RIGHTS RESERVED.</p>
                        <div className="flex gap-10">
                            <a href="#" className="hover:text-white transition-colors">LEGAL</a>
                            <a href="#" className="hover:text-white transition-colors">PRIVACY</a>
                            <a href="#" className="hover:text-white transition-colors">TERMS</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* --- ATELIER CART DRAWER --- */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-[500] flex justify-end">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative bg-[#001f5c] h-full w-full max-w-xl shadow-luxury flex flex-col overflow-hidden border-l border-white/10"
                        >
                            <div className="p-10 md:p-14 border-b border-white/5 flex justify-between items-center">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-display font-black text-white italic tracking-tighter uppercase leading-none">Curaduría</h2>
                                    <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.4em]">Selección Personalizada</p>
                                </div>
                                <button onClick={() => setIsCartOpen(false)} className="p-4 hover:bg-white/5 rounded-full transition-all">
                                    <CloseIcon className="w-8 h-8 text-white" />
                                </button>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto p-10 md:p-14 space-y-12 no-scrollbar">
                                {completedOrder ? (
                                    <div className="text-center space-y-12 py-20 animate-fade-in">
                                        <div className="relative inline-block">
                                            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
                                            <div className="relative w-28 h-28 bg-white/5 flex items-center justify-center rounded-[2.5rem] border border-white/10">
                                                <CheckBadgeIcon className="w-14 h-14 text-yellow-400"/>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-5xl font-display font-black uppercase text-white tracking-tighter italic">REGISTRADA</h3>
                                            <p className="text-white/60 font-light text-xl leading-relaxed">Su solicitud ha sido ingresada al flujo de producción del atelier.</p>
                                        </div>
                                        <div className="bg-white/[0.02] p-12 rounded-[3rem] border border-white/5 flex flex-col items-center gap-4">
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">ORDEN DE PRODUCCIÓN</p>
                                            <p className="text-7xl font-display font-black text-white tracking-tighter">#{completedOrder.orden}</p>
                                        </div>
                                        <button 
                                            onClick={() => window.open(generateWhatsAppLink('0993083943', `Hola Imprenta Córdova, acabo de generar el pedido #${completedOrder.orden} desde la web.`), '_blank')}
                                            className="w-full py-8 bg-yellow-400 text-[#001f5c] font-black text-[10px] uppercase tracking-[0.5em] hover:bg-white transition-all flex items-center justify-center gap-4 shadow-luxury rounded-2xl active:scale-95"
                                        >
                                            SINCRONIZAR POR WHATSAPP <WhatsAppIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ) : cartItems.length === 0 ? (
                                    <div className="text-center py-40 flex flex-col items-center space-y-10 opacity-10">
                                        <div className="w-32 h-32 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                                            <BoxIcon className="w-12 h-12 text-white stroke-[1]"/>
                                        </div>
                                        <p className="font-display text-4xl italic font-black uppercase tracking-tighter text-white">Galería Vacía</p>
                                    </div>
                                ) : (
                                    <div className="space-y-12">
                                        {cartItems.map(item => (
                                            <div key={item.producto.id} className="flex gap-8 group relative">
                                                <div className="w-24 h-32 md:w-32 md:h-40 bg-[#002b80] overflow-hidden flex-shrink-0 rounded-3xl border border-white/10">
                                                    <img src={item.producto.imagenUrl || 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=400&auto=format&fit=crop'} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                                                </div>
                                                <div className="flex-grow flex flex-col justify-center space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-2xl font-display font-black text-white italic tracking-tighter uppercase leading-none">{item.producto.nombre}</h4>
                                                        <button onClick={() => setCartItems(cartItems.filter(i => i.producto.id !== item.producto.id))} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                                                            <TrashIcon className="w-5 h-5"/>
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{item.cantidad} UNIDADES</span>
                                                        <div className="h-px w-8 bg-white/10"></div>
                                                        <span className="text-2xl font-display font-black text-white">{formatCurrency(item.producto.precio * item.cantidad)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {isCheckingOut && (
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-10 space-y-12">
                                                <div className="h-px bg-white/5"></div>
                                                <div className="space-y-4 text-center">
                                                    <h3 className="text-3xl font-display font-black text-white italic tracking-tighter uppercase">Identificación de Cliente</h3>
                                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Protocolo de Reserva</p>
                                                </div>
                                                <div className="space-y-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-6">Titular de la Obra</label>
                                                        <input 
                                                            type="text" 
                                                            required 
                                                            value={clientName}
                                                            onChange={e => setClientName(e.target.value)}
                                                            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-8 py-6 text-white text-lg font-light outline-none focus:border-yellow-400/40 transition-colors placeholder:text-white/20"
                                                            placeholder="Ingrese su nombre completo..."
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-6">WhatsApp de Enlace Directo</label>
                                                        <input 
                                                            type="tel" 
                                                            required 
                                                            value={clientPhone}
                                                            onChange={e => setClientPhone(e.target.value)}
                                                            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-8 py-6 text-white text-lg font-light outline-none focus:border-yellow-400/40 transition-colors placeholder:text-white/20"
                                                            placeholder="Ej: 0993083943"
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!completedOrder && cartItems.length > 0 && (
                                <div className="p-10 md:p-14 bg-white/[0.01] border-t border-white/10 space-y-10">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Inversión Curada</p>
                                            <p className="text-5xl font-display font-black text-white tracking-tighter leading-none">{formatCurrency(subtotal)}</p>
                                        </div>
                                        <p className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-black pb-1">IVA no incluido</p>
                                    </div>
                                    
                                    {isCheckingOut ? (
                                        <div className="flex gap-4">
                                            <button onClick={() => setIsCheckingOut(false)} className="px-10 py-6 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-all">Atrás</button>
                                            <button 
                                                onClick={handlePlaceOrder} 
                                                disabled={isPlacingOrder || !clientName || !clientPhone} 
                                                className="flex-grow py-6 bg-yellow-400 text-[#001f5c] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white transition-all disabled:opacity-20 rounded-2xl shadow-luxury active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                {isPlacingOrder ? <Loader2Icon className="animate-spin w-5 h-5"/> : 'Finalizar Curaduría'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsCheckingOut(true)} className="w-full py-8 bg-yellow-400 text-[#001f5c] font-black text-[10px] uppercase tracking-[0.5em] hover:bg-white transition-all rounded-2xl shadow-luxury active:scale-95 flex items-center justify-center gap-4 group">
                                            RESERVAR ATELIER <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VisualLanding;
