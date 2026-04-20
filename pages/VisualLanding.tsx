import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, CheckCircleIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, PrinterIcon, CheckBadgeIcon, ClockIcon,
    SearchIcon, SparklesIcon, MonitorIcon, MessageCircleIcon, ChevronRightIcon,
    Loader2Icon, WalletIcon, ExclamationTriangleIcon, LayersIcon, WhatsAppIcon,
    PaletteIcon, ReceiptIcon, InfoIcon, UploadIcon
} from '../components/Icons';
import { useData } from '../contexts/DataContext';
import { analyzeImageQualityForPrint } from '../services/geminiService';
import { Producto, Trabajo } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';

// --- COMPONENTS ---

const StatCard: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
    <div className="text-center p-8 glass-card border-none group">
        <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] mb-4 opacity-70 group-hover:opacity-100 transition-opacity">{label}</p>
        <p className="text-6xl font-display font-black text-white tracking-tighter mb-2 group-hover:scale-110 transition-transform duration-700">{value}</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{sub}</p>
    </div>
);

const BentoCard: React.FC<{ title: string; desc: string; icon: any; className?: string; image?: string; dark?: boolean }> = ({ title, desc, icon: Icon, className = "", image, dark }) => (
    <div className={`group relative overflow-hidden rounded-[2.5rem] transition-all duration-700 hover:-translate-y-2 hover:shadow-luxury ${className} ${dark ? 'bg-brand-dark text-white' : 'bg-white text-slate-900 border border-slate-100'}`}>
        {image && <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 scale-105 group-hover:scale-100"><img src={image} className="w-full h-full object-cover" alt="" /></div>}
        <div className="relative z-10 p-10 h-full flex flex-col">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-10 shadow-lg group-hover:rotate-[10deg] transition-transform duration-500 ${dark ? 'bg-white/10' : 'bg-slate-50'}`}>
                <Icon className={`w-7 h-7 ${dark ? 'text-liquid-gold' : 'text-brand-blue'}`} />
            </div>
            <h3 className={`text-2xl font-black mb-4 leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
            <p className={`text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{desc}</p>
            <div className="mt-auto pt-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                Descubrir Excelencia <ChevronRightIcon className="w-4 h-4" />
            </div>
        </div>
    </div>
);

const ServiceItem: React.FC<{ title: string; desc: string; icon: any; index: string }> = ({ title, desc, icon: Icon, index }) => (
    <div className="group border-t border-white/5 py-12 flex flex-col md:flex-row gap-10 items-start hover:bg-white/[0.02] px-6 transition-colors duration-500">
        <span className="text-4xl font-display font-black text-white/5 group-hover:text-liquid-gold/20 transition-colors duration-700">{index}</span>
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-liquid-gold border border-white/5 group-hover:rotate-[15deg] transition-transform">
            <Icon className="w-6 h-6" />
        </div>
        <div className="flex-grow space-y-3">
            <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">{title}</h3>
            <p className="text-sm text-slate-500 max-w-xl leading-relaxed">{desc}</p>
        </div>
        <button className="hidden md:flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-white/30 group-hover:text-liquid-gold transition-all">
            Consultar <ChevronRightIcon className="w-4 h-4" />
        </button>
    </div>
);

// --- MAIN PAGE ---

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

    const [scrollProgress, setScrollProgress] = useState(0);

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
            const newOrder = await createPublicOrder(
                { nombre: clientName, telefono: clientPhone }, 
                cartItems
            );
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
        <div className="min-h-screen bg-brand-dark font-sans selection:bg-liquid-gold selection:text-brand-dark transition-colors duration-500">
            <SEO 
                title="Imprenta Córdova | Excelencia Gráfica y Publicidad"
                description="Elevamos la identidad de tu marca a través de tecnología Roland High-Fidelity. Servicios de gigantografías, encuadernación, facturas físicas y más."
            />
            {/* Scroll Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-[1px] bg-white/5 z-[250]">
                <div 
                    className="h-full bg-liquid-gold shadow-gold-glow transition-all duration-300 ease-out" 
                    style={{ width: `${scrollProgress}%` }}
                ></div>
            </div>
            
            {/* Premium Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-brand-dark/20 backdrop-blur-2xl border-b border-white/5 py-6">
                <div className="container mx-auto px-8 flex justify-between items-center">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        <div className="bg-white p-2 rounded-xl shadow-gold-glow group-hover:rotate-12 transition-transform duration-500">
                            <CordovaLogo className="h-7 w-auto text-brand-dark" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-display font-black text-white tracking-tighter uppercase leading-none">CÓRDOVA</span>
                            <span className="text-[8px] font-black text-liquid-gold uppercase tracking-[0.5em] mt-1">Atelier Gráfico</span>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-12 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                        <a href="#experiencia" className="hover:text-liquid-gold transition-colors">Experiencia</a>
                        <a href="#atelier" className="hover:text-liquid-gold transition-colors">El Atelier</a>
                        <a href="#sri" className="text-brand-red">Servicio SRI</a>
                        <Link to="/tracking" className="hover:text-liquid-gold transition-colors">Tracking</Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <button onClick={() => { setIsCartOpen(true); setIsCheckingOut(false); setCompletedOrder(null); }} className="relative p-2 text-white/70 hover:text-liquid-gold transition-colors group">
                            <ShoppingCartIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-liquid-gold text-brand-dark text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                        <Link to="/login" className="px-6 py-3 bg-white text-brand-dark rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-liquid-gold transition-all shadow-xl active:scale-95">
                            Privado
                        </Link>
                    </div>
                </div>
            </nav>

            {/* --- HERO SUPREMO --- */}
            <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-dark">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-liquid-gold/5 blur-[120px] rounded-full animate-pulse" />
                </div>
                
                <div className="container mx-auto px-8 relative z-10 pt-20">
                    <div className="grid lg:grid-cols-12 gap-20 items-center">
                        <div className="lg:col-span-12 xl:col-span-8 space-y-12 text-center xl:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                className="inline-flex items-center gap-4 px-5 py-2 glass-panel rounded-full border-white/10 text-liquid-gold shadow-gold-glow"
                            >
                                <SparklesIcon className="w-4 h-4 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Maestría Gráfica desde 2010</span>
                            </motion.div>
                            
                            <motion.h1 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1.5, delay: 0.2 }}
                                className="text-7xl md:text-9xl font-display font-black text-white leading-[0.85] tracking-tighter"
                            >
                                IMPRESIÓN <br/>
                                <span className="text-luxury-gradient italic">DE AUTOR</span>
                            </motion.h1>

                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className="text-2xl text-slate-400 font-light max-w-3xl mx-auto xl:mx-0 leading-relaxed"
                            >
                                Elevamos la identidad de tu marca a través de tecnología <span className="text-white font-medium border-b border-liquid-gold/30">Roland High-Fidelity</span> y acabados magistrales.
                            </motion.p>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, delay: 0.8 }}
                                className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-6 pt-6"
                            >
                                <a href="https://wa.me/593993083943" className="w-full sm:w-auto px-10 py-5 bg-white text-brand-dark rounded-2xl font-black text-xs uppercase tracking-widest shadow-luxury hover:bg-liquid-gold transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3">
                                    <WhatsAppIcon className="w-5 h-5"/> Concierge Comercial
                                </a>
                                <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto btn-luxury flex items-center justify-center gap-3">
                                    <MonitorIcon className="w-5 h-5"/> Atelier Vision AI
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileTest} />
                            </motion.div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-16 border-t border-white/5 opacity-80">
                                <StatCard label="Hitos" value="15Y" sub="Trayectoria" />
                                <StatCard label="Éxito" value="99%" sub="Satisfacción" />
                                <StatCard label="Tech" value="8K" sub="Resolución" />
                                <StatCard label="Origen" value="07" sub="Pasaje, EC" />
                            </div>
                        </div>

                        <div className="lg:col-span-12 xl:col-span-4 relative group">
                            <div className="absolute -inset-4 bg-liquid-gold/5 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            
                            <div className="relative glass-card border-white/10 p-10 shadow-2xl overflow-hidden min-h-[500px] flex flex-col justify-center">
                                {isTesting && <div className="absolute top-0 left-0 w-full h-[2px] bg-liquid-gold/50 shadow-gold-glow animate-scan z-20"></div>}
                                
                                {isTesting ? (
                                    <div className="text-center space-y-8 py-10">
                                        <div className="relative inline-block">
                                            <div className="absolute inset-0 bg-liquid-gold/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                                            <Loader2Icon className="w-20 h-20 animate-spin mx-auto text-liquid-gold relative z-10" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-display font-black text-white uppercase tracking-widest italic">Decrypting Alpha...</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Analizando densidad de pixeles y gama cromática</p>
                                        </div>
                                    </div>
                                ) : testResult ? (
                                    <div className="animate-fade-in space-y-8">
                                        <div className="flex justify-between items-center">
                                            <div className="px-4 py-1.5 bg-liquid-gold/10 border border-liquid-gold/20 rounded-full text-liquid-gold text-[8px] font-black uppercase tracking-widest">Analysis Alpha-7</div>
                                            <button onClick={() => setTestResult(null)} className="text-slate-500 hover:text-white transition-colors"><CloseIcon className="w-5 h-5"/></button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <h3 className="text-4xl font-display font-black text-white leading-none tracking-tight">{testResult.veredicto}</h3>
                                            <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Observación del Atelier:</p>
                                                <p className="text-lg font-medium text-slate-300 italic leading-relaxed">"{testResult.calidad}"</p>
                                            </div>
                                        </div>

                                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-white hover:text-brand-dark transition-all">
                                            Repetir Diagnóstico
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-10 text-center xl:text-left">
                                        <div className="flex flex-col xl:flex-row items-center gap-6">
                                            <div className="w-16 h-16 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold border border-liquid-gold/20 shadow-gold-glow">
                                                <SparklesIcon className="w-8 h-8"/>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-display font-black text-white uppercase tracking-tight">IA Vision</h3>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sube tu diseño para validar calidad</p>
                                            </div>
                                        </div>

                                        <div onClick={() => fileInputRef.current?.click()} className="group/drop relative p-12 border-2 border-dashed border-white/10 rounded-[2rem] hover:border-liquid-gold/30 transition-all cursor-pointer bg-white/[0.02]">
                                            <div className="absolute inset-0 bg-liquid-gold/5 opacity-0 group-hover/drop:opacity-100 transition-opacity rounded-[2rem]"></div>
                                            <div className="relative text-center space-y-4">
                                                <UploadIcon className="w-10 h-10 mx-auto text-slate-500 group-hover/drop:text-liquid-gold transition-colors" />
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover/drop:text-white transition-colors">Arrastrar archivo o clic para explorar</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN BENTO MÁSTER --- */}
            <section id="experiencia" className="py-24 bg-brand-dark relative">
                <div className="container mx-auto px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        <BentoCard 
                            title="Atelier Pasaje"
                            desc="Nuestro showroom principal donde la artesanía y la tecnología convergen en el corazón de El Oro."
                            icon={MapPinIcon}
                            className="md:col-span-4 lg:col-span-3 min-h-[400px]"
                            image="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop"
                            dark
                        />
                        <BentoCard 
                            title="Elite Prints"
                            desc="Acabados en Foil Oro, Plata y Laminados Premium para presentaciones impecables."
                            icon={SparklesIcon}
                            className="md:col-span-2 lg:col-span-3"
                        />
                    </div>
                </div>
            </section>

            {/* --- SERVICIOS REDEFINED --- */}
            <section id="atelier" className="py-40 bg-brand-dark">
                <div className="container mx-auto px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-24 border-l-2 border-liquid-gold pl-10">
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.5em]">Curated Services</p>
                            <h2 className="text-5xl md:text-8xl font-display font-black text-white leading-[0.8] tracking-tighter uppercase">
                                ARTE <br/> <span className="text-white/20">INDUSTRIAL</span>
                            </h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <ServiceItem index="01" title="Arquitectura Visual" desc="Diseño gráfico estratégico enfocado en la conversión y el posicionamiento de marca de alto nivel." icon={PaletteIcon} />
                        <ServiceItem index="02" title="Impresión Roland" desc="Gran formato y micro-detalle con calibración cromática certificada por laboratorios internacionales." icon={PrinterIcon} />
                        <ServiceItem index="03" title="Acabados de Lujo" desc="Troquelados láser, relieves 3D y foils metalizados que invitan al tacto y destilan exclusividad." icon={SparklesIcon} />
                    </div>
                </div>
            </section>

            {/* Interactive Catalog Section */}
            <section id="catalog" className="py-32 relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div>
                            <h2 className="text-sm font-bold text-liquid-gold tracking-[0.5em] uppercase mb-4">Nuestro Atelier</h2>
                            <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter">COLECCIÓN <span className="text-slate-500">2024</span></h3>
                        </div>
                        <p className="text-slate-400 max-w-md text-right font-light tracking-wide italic">
                            Cada pieza es fabricada bajo estrictos estándares de calidad, utilizando insumos certificados de alta gama.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {allProductos.map((p, idx) => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group glass-boutique overflow-hidden border-luxury"
                            >
                                <div className="aspect-[4/5] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-transparent transition-colors duration-700 z-10" />
                                    <img 
                                        src={p.imagenUrl || 'https://images.unsplash.com/photo-1586075010683-2350bcbc085c?q=80&w=600&auto=format&fit=crop'} 
                                        alt={p.nombre} 
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[2s] ease-out grayscale group-hover:grayscale-0"
                                    />
                                    <div className="absolute top-6 right-6 z-20">
                                        <div className="w-12 h-12 rounded-full glass-boutique flex items-center justify-center backdrop-blur-3xl group-hover:bg-liquid-gold group-hover:text-brand-dark transition-all duration-500 cursor-pointer" onClick={() => handleAddToCart(p)}>
                                            <ShoppingCartIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-6 z-20">
                                        <span className="text-[10px] font-bold text-white tracking-widest uppercase bg-brand-dark/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                            {p.categoria}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <h4 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-liquid-gold transition-colors">{p.nombre}</h4>
                                    <p className="text-slate-400 text-sm mb-8 font-light leading-relaxed line-clamp-2">{p.descripcion}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="text-3xl font-black text-white">
                                            <span className="text-xs font-bold text-slate-500 mr-1">Desde</span>
                                            {formatCurrency(p.precio)}
                                        </div>
                                        <button 
                                            onClick={() => handleAddToCart(p)}
                                            className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            RESERVAR <ArrowRightIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER ÉLITE --- */}
            <footer className="bg-brand-dark text-white pt-48 pb-20 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-liquid-gold/30 to-transparent"></div>
                
                <div className="container mx-auto px-8 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-24 mb-32">
                        <div className="lg:col-span-6 space-y-12 text-center lg:text-left">
                            <div className="flex flex-col lg:flex-row items-center gap-6">
                                <div className="w-20 h-20 bg-white flex items-center justify-center rounded-sm">
                                    <CordovaLogo className="h-10 w-auto text-brand-dark" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-4xl font-display font-black tracking-tighter uppercase text-white leading-none">CÓRDOVA</h2>
                                    <p className="text-[10px] font-black tracking-[0.6em] text-liquid-gold uppercase opacity-80">Heritage Excellence</p>
                                </div>
                            </div>
                            <h3 className="text-4xl md:text-6xl font-display font-black text-white/90 leading-[0.9] tracking-tighter uppercase">
                                TRANSFORMAMOS <span className="text-liquid-gold">VISIONES</span> EN REALIDAD TANGIBLE.
                            </h3>
                        </div>

                        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-16">
                            <div className="space-y-10">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Ubicación Central</h4>
                                    <div className="text-xl font-light text-slate-300 space-y-2">
                                        <p>Pasaje, El Oro</p>
                                        <p className="text-white font-medium">Calle Colón e/ Sucre y Rocafuerte</p>
                                        <p className="text-sm text-slate-500">Diagonal al Parque Central</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Atelier Privado</h4>
                                    <div className="text-xl font-light text-slate-300 space-y-4">
                                        <p className="flex items-center gap-4 group cursor-pointer justify-center lg:justify-start">
                                            <PhoneIcon className="w-5 h-5 text-liquid-gold"/> 
                                            <span className="group-hover:text-white transition-colors">099 308 3943</span>
                                        </p>
                                        <p className="flex items-center gap-4 group cursor-pointer justify-center lg:justify-start">
                                            <EnvelopeIcon className="w-5 h-5 text-liquid-gold"/>
                                            <span className="group-hover:text-white transition-colors text-base sm:text-lg">ventas@imprentacordova.com</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-10 bg-white/[0.03] p-10 border border-white/5">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-liquid-gold mb-6 text-center sm:text-left">Disponibilidad</h4>
                                <div className="space-y-8">
                                    <div className="space-y-2 text-center sm:text-left">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Semana Laboral</p>
                                        <p className="text-2xl font-display font-black text-white">08:00 — 19:00</p>
                                    </div>
                                    <div className="space-y-2 text-center sm:text-left">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Sábados</p>
                                        <p className="text-2xl font-display font-black text-white">09:00 — 14:00</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">
                        <p>&copy; 2025 IMPRENTA CÓRDOVA. ARCHIVE OF EXCELLENCE.</p>
                        <div className="flex gap-12">
                            <a href="#" className="hover:text-white transition-colors focus:outline-none">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors focus:outline-none">Terms of Service</a>
                            <a href="#" className="hover:text-white transition-colors focus:outline-none">Accessibility</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* --- CARRITO ÉLITE (BOUTIQUE DRAWER) --- */}
            <AnimatePresence>
                {isCartOpen && (
                    <div className="fixed inset-0 z-[300] flex justify-end">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setIsCartOpen(false); setIsCheckingOut(false); setCompletedOrder(null); }}
                            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative bg-white h-full w-full max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden" 
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header del Carrito */}
                            <div className="p-10 border-b border-slate-100 flex justify-between items-center">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-display font-black text-brand-dark uppercase tracking-tighter">Tu Selección</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Curated Cart</p>
                                </div>
                                <button onClick={() => { setIsCartOpen(false); setIsCheckingOut(false); setCompletedOrder(null); }} className="group p-4 hover:rotate-90 transition-transform duration-500">
                                    <CloseIcon className="w-6 h-6 text-slate-300 group-hover:text-brand-dark transition-colors"/>
                                </button>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto p-10 space-y-10 custom-scrollbar">
                                {completedOrder ? (
                                    <div className="text-center space-y-10 py-20 animate-slide-up">
                                        <div className="relative inline-block">
                                            <div className="absolute inset-0 bg-liquid-gold/20 rounded-full blur-2xl animate-pulse"></div>
                                            <div className="relative w-24 h-24 bg-brand-dark flex items-center justify-center rounded-sm">
                                                <CheckBadgeIcon className="w-12 h-12 text-liquid-gold"/>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-4xl font-display font-black uppercase text-brand-dark tracking-tighter">PROCESADO</h3>
                                            <p className="text-slate-500 font-light text-lg">Su orden ha sido registrada en nuestro atelier.</p>
                                        </div>
                                        <div className="bg-slate-50 p-8 border border-slate-100 flex flex-col items-center gap-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking ID</p>
                                            <p className="text-5xl font-display font-black text-brand-dark tracking-tighter">#{completedOrder.orden}</p>
                                        </div>
                                        <button 
                                            onClick={() => window.open(generateWhatsAppLink('0993083943', `Hola Imprenta Córdova, acabo de generar el pedido #${completedOrder.orden} desde la web.`), '_blank')}
                                            className="w-full py-6 bg-brand-dark text-white font-black text-[10px] uppercase tracking-[0.4em] hover:bg-liquid-gold hover:text-brand-dark transition-all flex items-center justify-center gap-4 group"
                                        >
                                            Sincronizar vía WhatsApp <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-2 transition-transform"/>
                                        </button>
                                    </div>
                                ) : cartItems.length === 0 ? (
                                    <div className="text-center py-40 flex flex-col items-center space-y-8 opacity-20">
                                        <BoxIcon className="w-20 h-20 stroke-[0.5]"/>
                                        <p className="font-display text-2xl uppercase tracking-tighter">Bolsa Vacía</p>
                                    </div>
                                ) : (
                                    <div className="space-y-12">
                                        {cartItems.map(item => (
                                            <div key={item.producto.id} className="flex gap-8 group">
                                                <div className="w-24 h-32 bg-slate-50 overflow-hidden flex-shrink-0">
                                                    {item.producto.imagenUrl ? (
                                                        <img src={item.producto.imagenUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                            <BoxIcon className="w-8 h-8 stroke-[0.5]"/>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-grow flex flex-col justify-center space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="text-lg font-display font-medium text-brand-dark uppercase tracking-tight">{item.producto.nombre}</h4>
                                                        <button onClick={() => setCartItems(cartItems.filter(i => i.producto.id !== item.producto.id))} className="text-slate-300 hover:text-red-500 transition-colors">
                                                            <TrashIcon className="w-4 h-4 text-slate-300 hover:text-brand-dark transition-colors"/>
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.cantidad} UNIDAD(ES)</p>
                                                    <p className="text-xl font-display font-black text-brand-dark">{formatCurrency(item.producto.precio)}</p>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {isCheckingOut && (
                                            <div className="pt-10 space-y-10 animate-slide-up">
                                                <div className="h-px bg-slate-100"></div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-display font-black text-brand-dark uppercase tracking-tighter">Identificación</h3>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Checkout</p>
                                                </div>
                                                <div className="space-y-6">
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Nombre Completo</label>
                                                        <input 
                                                            type="text" 
                                                            required 
                                                            value={clientName}
                                                            onChange={e => setClientName(e.target.value)}
                                                            className="w-full py-4 border-b border-slate-200 text-lg font-light outline-none focus:border-brand-dark transition-colors"
                                                            placeholder="Ingrese su nombre..."
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">WhatsApp de Enlace</label>
                                                        <input 
                                                            type="tel" 
                                                            required 
                                                            value={clientPhone}
                                                            onChange={e => setClientPhone(e.target.value)}
                                                            className="w-full py-4 border-b border-slate-200 text-lg font-light outline-none focus:border-brand-dark transition-colors"
                                                            placeholder="099..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!completedOrder && cartItems.length > 0 && (
                                <div className="p-10 bg-slate-50 space-y-8">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inversión Estimada</p>
                                            <p className="text-4xl font-display font-black text-brand-dark tracking-tighter leading-none">{formatCurrency(subtotal)}</p>
                                        </div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">IVA No Incluido</p>
                                    </div>
                                    
                                    {isCheckingOut ? (
                                        <div className="flex gap-4">
                                            <button onClick={() => setIsCheckingOut(false)} className="px-8 py-5 border border-slate-200 text-brand-dark font-black text-[9px] uppercase tracking-widest hover:bg-white transition-all">Atrás</button>
                                            <button 
                                                onClick={handlePlaceOrder} 
                                                disabled={isPlacingOrder || !clientName || !clientPhone} 
                                                className="flex-grow py-5 bg-liquid-gold text-brand-dark font-black text-[9px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                {isPlacingOrder ? <Loader2Icon className="animate-spin w-4 h-4"/> : 'Confirmar Pedido'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsCheckingOut(true)} className="w-full py-6 bg-brand-dark text-white font-black text-[10px] uppercase tracking-[0.4em] hover:bg-liquid-gold hover:text-brand-dark transition-all flex items-center justify-center gap-4 group">
                                            Avanzar al Atelier <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-2 transition-transform"/>
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
