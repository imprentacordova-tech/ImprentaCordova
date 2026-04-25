
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

// --- ATELIER LIGHT COMPONENTS ---

const StatCard: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
    <div className="text-center p-8 transition-all duration-700 bg-slate-50 group rounded-[2rem] border border-slate-100 hover:border-blue-500/20 hover:bg-white hover:shadow-xl">
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] mb-4 opacity-50 group-hover:opacity-100 transition-opacity">{label}</p>
        <p className="text-5xl md:text-7xl font-display italic font-black text-slate-900 tracking-tighter mb-2 group-hover:scale-105 transition-transform duration-1000 group-hover:text-blue-600 leading-none">{value}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">{sub}</p>
    </div>
);

const BentoCard: React.FC<{ title: string; desc: string; icon: any; className?: string; image?: string; accent?: 'blue' | 'yellow' | 'red' }> = ({ title, desc, icon: Icon, className = "", image, accent = 'blue' }) => {
    const accentColors = {
        blue: 'from-blue-600 to-blue-900 text-white',
        yellow: 'from-yellow-400 to-yellow-600 text-slate-900',
        red: 'from-red-600 to-red-900 text-white'
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`group relative overflow-hidden rounded-[2.5rem] transition-all duration-1000 hover:shadow-2xl ${className} bg-slate-50`}
        >
            {image && (
                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-30 transition-all duration-1000 scale-110 group-hover:scale-100">
                    <img src={image} className="w-full h-full object-cover grayscale" alt="" />
                </div>
            )}
            <div className="relative z-10 p-8 md:p-12 h-full flex flex-col justify-end">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all duration-700 group-hover:rotate-[15deg] group-hover:scale-110 bg-white shadow-lg border border-slate-100`}>
                    <Icon className={`w-6 h-6 text-blue-600`} />
                </div>
                <h3 className={`text-4xl md:text-5xl font-display italic font-black mb-4 leading-none tracking-tighter text-slate-900`}>{title}</h3>
                <p className={`text-sm font-light leading-relaxed max-w-sm text-slate-500`}>{desc}</p>
                <div className="mt-8 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-x-[-20px] group-hover:translate-x-0 text-blue-600">
                    <span>EXPLORAR</span> <ArrowRightIcon className="w-4 h-4" />
                </div>
            </div>
        </motion.div>
    );
};

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
        <div className="relative min-h-screen bg-white font-sans selection:bg-yellow-400 selection:text-slate-900 transition-colors duration-500 overflow-x-hidden">
            <SEO 
                title="Imprenta Córdova | Atelier de Papel & Diseño"
                description="Expertos en talonarios, libretas y papelería corporativa en Ecuador. Calidad de autor con tecnología de precisión."
            />

            {/* Subtle Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none z-[10] opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-multiply"></div>
            
            {/* Progress Track */}
            <div className="fixed top-0 left-0 w-full h-[3px] bg-slate-100 z-[250]">
                <motion.div 
                    className="h-full bg-gradient-to-r from-blue-600 via-yellow-400 to-red-600" 
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>
            
            {/* Minimalist Header */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 py-4 lg:py-6">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="bg-slate-900 p-2 rounded-xl group-hover:rotate-[360deg] transition-all duration-[1.5s]">
                            <CordovaLogo className="h-7 w-auto text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-2xl lg:text-3xl font-display italic font-black text-slate-900 tracking-tighter uppercase leading-none">CÓRDOVA</h1>
                            <span className="text-[8px] font-black text-blue-600 uppercase tracking-[0.5em] mt-1">Atelier de Papel</span>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                        <a href="#experiencia" className="hover:text-blue-600 transition-colors">Experiencia</a>
                        <a href="#catalog" className="hover:text-blue-600 transition-colors">Talonarios</a>
                        <a href="#libretas" className="hover:text-blue-600 transition-colors">Libretas</a>
                        <a href="#sri" className="text-red-600 hover:text-red-500 transition-colors">S.R.I.</a>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-8">
                        <button onClick={() => { setIsCartOpen(true); setIsCheckingOut(false); setCompletedOrder(null); }} className="relative p-2 text-slate-400 hover:text-blue-600 transition-all group">
                            <ShoppingCartIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                        <Link to="/login" className="hidden md:flex px-8 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all hover:bg-blue-600 shadow-lg active:scale-95 group">
                            <LockIcon className="w-4 h-4 mr-2 group-hover:animate-bounce" />
                            <span>Terminal</span>
                        </Link>
                        <button className="lg:hidden p-2 text-slate-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
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
                        className="fixed inset-0 z-[1000] bg-white flex flex-col p-10"
                    >
                        <div className="flex justify-between items-center mb-20">
                             <CordovaLogo className="h-10 w-auto text-slate-900" />
                             <button onClick={() => setIsMobileMenuOpen(false)} className="p-4 bg-slate-100 rounded-full">
                                <CloseIcon className="w-8 h-8 text-slate-900" />
                             </button>
                        </div>
                        <div className="flex flex-col gap-10 text-center">
                            {['experiencia', 'catalog', 'libretas', 'sri'].map((item) => (
                                <a 
                                    key={item} 
                                    href={`#${item}`} 
                                    onClick={() => setIsMobileMenuOpen(false)} 
                                    className="text-5xl font-display font-black text-slate-900 hover:text-blue-600 transition-colors uppercase italic tracking-tighter"
                                >
                                    {item}
                                </a>
                            ))}
                        </div>
                        <div className="mt-auto pt-10 border-t border-slate-100 flex flex-col gap-6">
                            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-6 bg-blue-600 text-white text-center font-black uppercase tracking-widest rounded-2xl">Terminal Privado</Link>
                            <p className="text-[8px] font-black text-slate-300 text-center uppercase tracking-[0.5em]">v2.7 Pure Light Engine</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- HERO SECTION: PURE LIGHT --- */}
            <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
                <motion.div style={{ y: backgroundY }} className="absolute inset-0 z-0">
                    <img 
                      src="https://images.unsplash.com/photo-1586075010633-2448833948bf?q=80&w=2574&auto=format&fit=crop" 
                      alt="Premium paper texture"
                      className="w-full h-full object-cover opacity-10"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/40 to-white"></div>
                </motion.div>
                
                <div className="container mx-auto px-8 relative z-10 text-center space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-4 px-6 py-2 bg-slate-50 rounded-full border border-slate-100 text-blue-600 shadow-sm"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.6em] leading-none">Excelencia en Papelería 2026</span>
                    </motion.div>
                    
                    <div className="space-y-4">
                        <motion.h1 
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[15vw] md:text-[12vw] lg:text-[10vw] font-display font-black italic text-slate-900 leading-[0.8] tracking-tighter uppercase"
                        >
                            PURA <br/>
                            <span className="text-blue-600 not-italic font-sans font-black tracking-normal">IMPRESIÓN.</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-lg md:text-2xl text-slate-500 font-light max-w-4xl mx-auto leading-relaxed tracking-tight"
                        >
                            Talonarios, libretas y notas de venta con el acabado <span className="text-blue-600 font-medium italic">Elite</span> de Imprenta Córdova. El estándar del papel profesional en Pasaje.
                        </motion.p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row gap-6 items-center justify-center pt-8"
                    >
                        <a href="#catalog" className="w-full sm:w-auto px-12 py-6 bg-slate-900 text-white rounded-full font-black uppercase tracking-[0.3em] transition-all duration-500 hover:bg-blue-600 hover:scale-105 text-[10px] shadow-xl active:scale-95">
                            Ver Talonarios
                        </a>
                        <a href="#sri" className="w-full sm:w-auto px-12 py-6 bg-white border border-slate-200 text-slate-900 rounded-full font-black uppercase tracking-[0.3em] transition-all duration-500 hover:border-red-600 hover:text-red-600 hover:scale-105 text-[10px] flex items-center justify-center gap-3 active:scale-95 group">
                            <span>Tramitar S.R.I.</span>
                            <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                        </a>
                    </motion.div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10 pt-24 border-t border-slate-100 max-w-6xl mx-auto">
                        <StatCard label="TRAYECTORIA" value="15" sub="AÑOS LIDERANDO" />
                        <StatCard label="PUNTAJE" value="9.8" sub="CLIENTES SATISFECHOS" />
                        <StatCard label="ENTREGA" value="24h" sub="SERVICIO EXPRESS" />
                        <StatCard label="PAPELERÍA" value="100%" sub="CALIDAD PREMIUM" />
                    </div>
                </div>
            </section>

            {/* --- BENTO GRID: PRODUCT CATEGORIES --- */}
            <section id="experiencia" className="py-32 relative z-10 bg-white">
                <div className="container mx-auto px-8">
                    <div className="mb-20 flex flex-col md:flex-row justify-between items-end gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-px w-10 bg-blue-600"></div>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em]">Curaduría de Papel</p>
                            </div>
                            <h2 className="text-6xl md:text-8xl font-display font-black text-slate-900 tracking-tighter uppercase leading-none">
                                NUESTRO <br/> <span className="text-slate-200">ATELIER</span>
                            </h2>
                        </div>
                        <p className="text-slate-400 max-w-sm text-right font-light italic text-xl border-r-2 border-yellow-400 pr-10">
                            La experiencia de compra más intuitiva para sus herramientas de control diario.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-8">
                        <BentoCard 
                            title="Talonarios SRI"
                            desc="Facturas, retenciones y notas de venta autorizadas con papel autocopiativo de primera calidad."
                            icon={CheckBadgeIcon}
                            className="md:col-span-4 lg:col-span-8 lg:row-span-2 min-h-[600px]"
                            image="https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=2070&auto=format&fit=crop"
                        />
                        <BentoCard 
                            title="Libretas de Autor"
                            desc="Para sus ideas más brillantes. Encuadernación premium y acabados elegantes."
                            icon={SparklesIcon}
                            className="md:col-span-2 lg:col-span-4 min-h-[400px]"
                            accent="yellow"
                        />
                        <BentoCard 
                            title="Notas de Venta"
                            desc="El control que su negocio necesita con un toque de distinción."
                            icon={ShoppingCartIcon}
                            className="md:col-span-2 lg:col-span-4 min-h-[400px]"
                            accent="red"
                        />
                    </div>
                </div>
            </section>

            {/* --- CATALOG: STATIONERY PIECES --- */}
            <section id="catalog" className="py-40 bg-slate-50 relative">
                <div className="container mx-auto px-8">
                    <div className="flex flex-col lg:flex-row justify-between items-end mb-32 gap-16">
                        <div className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="h-[2px] w-16 bg-blue-600"></div>
                                <h2 className="text-[11px] font-black text-blue-600 tracking-[0.6em] uppercase">Artículos Imprescindibles</h2>
                            </div>
                            <h3 className="text-[12vw] lg:text-[8vw] font-display italic font-black text-slate-900 tracking-tighter leading-[0.8] uppercase">
                                PAPELERÍA <br/> <span className="text-slate-300 not-italic font-sans font-black">PROFESIONAL</span>
                            </h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
                        {allProductos.filter(p => p.categoria?.toLowerCase().includes('talonario') || p.categoria?.toLowerCase().includes('libreta') || true).map((p, idx) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ delay: idx * 0.1, duration: 1 }}
                                className="group relative flex flex-col h-full bg-white rounded-[3rem] border border-slate-100 p-6 transition-all duration-700 hover:shadow-2xl hover:-translate-y-2"
                            >
                                <div className="aspect-[4/5] relative overflow-hidden rounded-[2.5rem] bg-slate-100">
                                    <img 
                                        src={p.imagenUrl || 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=800&auto=format&fit=crop'} 
                                        className="w-full h-full object-cover transform scale-110 group-hover:scale-100 transition-transform duration-[2s] ease-out" 
                                        alt={p.nombre} 
                                    />
                                    <div className="absolute top-6 right-6">
                                        <button 
                                            onClick={() => handleAddToCart(p)}
                                            className="w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-xl shadow-lg flex items-center justify-center text-slate-900 hover:bg-blue-600 hover:text-white transition-all duration-500 active:scale-90"
                                        >
                                            <AddIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-8 left-8">
                                        <span className="px-4 py-2 bg-slate-900/10 backdrop-blur-md text-slate-900 text-[8px] font-black uppercase tracking-widest rounded-full">
                                            {p.categoria || 'PREMIUM'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="pt-8 space-y-4 px-4">
                                    <h4 className="text-3xl font-display font-black italic text-slate-900 tracking-tighter uppercase leading-none group-hover:text-blue-600 transition-colors duration-700">{p.nombre}</h4>
                                    <p className="text-slate-400 font-light text-sm line-clamp-2 leading-relaxed">{p.descripcion}</p>
                                    <div className="pt-6 flex items-center justify-between border-t border-slate-50">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block">Desde</span>
                                            <span className="text-3xl font-display font-black text-slate-900">{formatCurrency(p.precio)}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleAddToCart(p)}
                                            className="px-8 py-4 bg-slate-50 hover:bg-slate-900 text-slate-900 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 active:scale-95 shadow-sm"
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

            {/* --- SRI SECTION: THE RED TOUCH --- */}
            <section id="sri" className="py-40 bg-white relative overflow-hidden">
                <div className="container mx-auto px-8 relative z-10">
                    <div className="max-w-6xl mx-auto bg-slate-50 rounded-[4rem] border border-slate-100 p-10 md:p-24 overflow-hidden relative group">
                        <div className="grid lg:grid-cols-2 gap-20 relative z-10">
                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-4 px-5 py-2 bg-red-50 border border-red-100 rounded-full text-red-600">
                                        <ShieldCheckIcon className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Protocolo S.R.I.</span>
                                    </div>
                                    <h2 className="text-6xl md:text-[7rem] font-display font-black text-slate-900 leading-[0.8] tracking-tighter uppercase italic">
                                        TRÁMITE <br/> <span className="text-red-600">DIRECTO.</span>
                                    </h2>
                                    <p className="text-xl text-slate-500 font-light leading-relaxed">
                                        Somos imprenta autorizada. Gestionamos sus talonarios de facturación y retención con absoluta validez legal y rapidez garantizada.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <a href="https://wa.me/593" className="px-10 py-6 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all shadow-xl shadow-red-200">Iniciar Gestión</a>
                                    <Link to="/tracking" className="px-10 py-6 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:border-slate-900 transition-all">Ver Estado</Link>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6 items-center">
                                {['Facturas', 'Notas de Venta', 'Retenciones', 'Liquidaciones'].map((item, i) => (
                                    <div key={i} className="p-8 bg-white border border-slate-100 rounded-3xl space-y-2 group hover:border-red-600/30 transition-all shadow-sm hover:shadow-xl">
                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item}</p>
                                        <p className="text-xl font-display font-black text-slate-900 italic tracking-tighter uppercase">AUTORIZADO</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER: MINIMALIST --- */}
            <footer className="bg-white text-slate-900 pt-48 pb-20 relative border-t border-slate-100">
                <div className="container mx-auto px-8 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-24 mb-32">
                        <div className="lg:col-span-6 space-y-16">
                            <div className="flex flex-col lg:flex-row items-center gap-8 text-center lg:text-left">
                                <div className="w-24 h-24 bg-slate-900 flex items-center justify-center rounded-[2.5rem]">
                                    <CordovaLogo className="h-12 w-auto text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-5xl font-display font-black tracking-tighter uppercase text-slate-900 leading-none italic">CÓRDOVA</h2>
                                    <p className="text-[11px] font-black tracking-[0.8em] text-blue-600 uppercase opacity-80">Excelencia Tradicional</p>
                                </div>
                            </div>
                            <h3 className="text-4xl md:text-[5rem] font-display font-black text-slate-900 leading-[0.85] tracking-tighter uppercase italic max-w-2xl">
                                EL PAPEL QUE <span className="text-blue-600">IMPORTA</span> PARA SU NEGOCIO.
                            </h3>
                        </div>

                        <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">Localización</h4>
                                    <div className="text-xl font-light text-slate-600 space-y-2 italic">
                                        <p>Pasaje, El Oro — Ecuador</p>
                                        <p className="text-slate-900 font-black uppercase tracking-tight">Calle Colón e/ Sucre y Rocafuerte</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300">Enlace Directo</h4>
                                    <div className="text-2xl font-display font-black text-slate-900 space-y-4">
                                        <p className="hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-4">
                                            <WhatsAppIcon className="w-6 h-6 text-blue-600"/> 099 308 3943
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100 space-y-12">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 text-center">Horarios</h4>
                                <div className="space-y-10">
                                    <div className="text-center">
                                        <p className="text-3xl font-display font-black text-slate-900 italic tracking-tighter uppercase">08:00 — 19:00</p>
                                        <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-2">LUNES A VIERNES</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-display font-black text-slate-900 italic tracking-tighter uppercase">09:00 — 14:00</p>
                                        <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-2">SÁBADOS</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
                        <p>&copy; 2026 IMPRENTA CÓRDOVA. TODOS LOS DERECHOS RESERVADOS.</p>
                        <div className="flex gap-10">
                            <a href="#" className="hover:text-slate-900 transition-colors">LEGAL</a>
                            <a href="#" className="hover:text-slate-900 transition-colors">PRIVACIDAD</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* --- MINIMALIST CART DRAWER --- */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-[500] flex justify-end">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCartOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative bg-white h-full w-full max-w-xl shadow-2xl flex flex-col overflow-hidden border-l border-slate-100"
                        >
                            <div className="p-10 md:p-14 border-b border-slate-50 flex justify-between items-center">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-display font-black text-slate-900 italic tracking-tighter uppercase leading-none">Mi Selección</h2>
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.4em]">Atelier de Papel</p>
                                </div>
                                <button onClick={() => setIsCartOpen(false)} className="p-4 hover:bg-slate-50 rounded-full transition-all">
                                    <CloseIcon className="w-8 h-8 text-slate-900" />
                                </button>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto p-10 md:p-14 space-y-12 no-scrollbar">
                                {completedOrder ? (
                                    <div className="text-center space-y-12 py-20 animate-fade-in">
                                        <div className="relative inline-block">
                                            <div className="relative w-28 h-28 bg-slate-900 flex items-center justify-center rounded-[2.5rem]">
                                                <CheckBadgeIcon className="w-14 h-14 text-white"/>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <h3 className="text-5xl font-display font-black uppercase text-slate-900 tracking-tighter italic">RECIBIDO</h3>
                                            <p className="text-slate-500 font-light text-xl leading-relaxed">Su pedido ha sido registrado con éxito.</p>
                                        </div>
                                        <div className="bg-slate-50 p-12 rounded-[3rem] border border-slate-100 flex flex-col items-center gap-4">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">NÚMERO DE ORDEN</p>
                                            <p className="text-7xl font-display font-black text-slate-900 tracking-tighter">#{completedOrder.orden}</p>
                                        </div>
                                        <button 
                                            onClick={() => window.open(generateWhatsAppLink('0993083943', `Hola Imprenta Córdova, mi pedido es el #${completedOrder.orden}.`), '_blank')}
                                            className="w-full py-8 bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.5em] hover:bg-slate-900 transition-all flex items-center justify-center gap-4 rounded-2xl active:scale-95 shadow-xl shadow-blue-100"
                                        >
                                            CONFIRMAR POR WHATSAPP <WhatsAppIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ) : cartItems.length === 0 ? (
                                    <div className="text-center py-40 flex flex-col items-center space-y-10 opacity-20">
                                        <BoxIcon className="w-20 h-20 text-slate-900 stroke-[1]"/>
                                        <p className="font-display text-4xl italic font-black uppercase tracking-tighter text-slate-900">Bolsa Vacía</p>
                                    </div>
                                ) : (
                                    <div className="space-y-12">
                                        {cartItems.map(item => (
                                            <div key={item.producto.id} className="flex gap-8 group relative">
                                                <div className="w-24 h-32 bg-slate-100 overflow-hidden flex-shrink-0 rounded-3xl border border-slate-100">
                                                    <img src={item.producto.imagenUrl || 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=400&auto=format&fit=crop'} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                                                </div>
                                                <div className="flex-grow flex flex-col justify-center space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-2xl font-display font-black text-slate-900 italic tracking-tighter uppercase leading-none">{item.producto.nombre}</h4>
                                                        <button onClick={() => setCartItems(cartItems.filter(i => i.producto.id !== item.producto.id))} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                                                            <TrashIcon className="w-5 h-5"/>
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{item.cantidad} UNIDADES</span>
                                                        <span className="text-2xl font-display font-black text-slate-900">{formatCurrency(item.producto.precio * item.cantidad)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {isCheckingOut && (
                                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-10 space-y-12">
                                                <div className="h-px bg-slate-100"></div>
                                                <div className="space-y-4 text-center">
                                                    <h3 className="text-3xl font-display font-black text-slate-900 italic tracking-tighter uppercase">Datos de Enlace</h3>
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Identificación Necesaria</p>
                                                </div>
                                                <div className="space-y-6">
                                                    <input 
                                                        type="text" 
                                                        value={clientName}
                                                        onChange={e => setClientName(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-6 text-slate-900 text-lg font-light outline-none focus:border-blue-600/40 transition-colors placeholder:text-slate-300"
                                                        placeholder="Su nombre..."
                                                    />
                                                    <input 
                                                        type="tel" 
                                                        value={clientPhone}
                                                        onChange={e => setClientPhone(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-6 text-slate-900 text-lg font-light outline-none focus:border-blue-600/40 transition-colors placeholder:text-slate-300"
                                                        placeholder="Teléfono / WhatsApp..."
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!completedOrder && cartItems.length > 0 && (
                                <div className="p-10 md:p-14 bg-slate-50 border-t border-slate-100 space-y-10">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión Estimada</p>
                                            <p className="text-5xl font-display font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(subtotal)}</p>
                                        </div>
                                    </div>
                                    
                                    {isCheckingOut ? (
                                        <div className="flex gap-4">
                                            <button onClick={() => setIsCheckingOut(false)} className="px-10 py-6 border border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white transition-all">Atrás</button>
                                            <button 
                                                onClick={handlePlaceOrder} 
                                                disabled={isPlacingOrder || !clientName || !clientPhone} 
                                                className="flex-grow py-6 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.4em] hover:bg-blue-600 transition-all rounded-2xl shadow-xl active:scale-95 flex items-center justify-center gap-3"
                                            >
                                                {isPlacingOrder ? <Loader2Icon className="animate-spin w-5 h-5"/> : 'Finalizar Pedido'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsCheckingOut(true)} className="w-full py-8 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.5em] hover:bg-blue-600 transition-all rounded-2xl shadow-xl active:scale-95 flex items-center justify-center gap-4 group">
                                            RESERVAR AHORA <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
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
