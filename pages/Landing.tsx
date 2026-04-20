
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
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
import { Producto, TrabajoEstado, TrabajoTipo, Regimen } from '../types';
import { formatCurrency } from '../utils';

// --- COMPONENTES AUXILIARES ---

const StatCard: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
    <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 group hover:border-liquid-gold/30 hover:bg-liquid-gold/5 transition-all duration-500">
        <p className="text-[10px] font-black text-liquid-gold/70 uppercase tracking-[0.3em] mb-2">{label}</p>
        <p className="text-4xl lg:text-5xl font-editorial font-bold text-white tracking-tight mb-1 group-hover:scale-110 transition-transform italic">{value}</p>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{sub}</p>
    </div>
);

const ServiceCard: React.FC<{ title: string; desc: string; icon: any }> = ({ title, desc, icon: Icon }) => (
    <div className="group bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/5 hover:border-liquid-gold/30 transition-all duration-700 hover:-translate-y-2 hover:bg-white/8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/5 rounded-full blur-2xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="w-16 h-16 rounded-2xl bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center mb-8 group-hover:bg-liquid-gold/20 transition-all">
            <Icon className="w-8 h-8 text-liquid-gold" />
        </div>
        <h3 className="text-xl font-editorial font-bold text-white uppercase tracking-tight mb-4 leading-none italic">{title}</h3>
        <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
        <div className="mt-8 flex items-center gap-2 text-liquid-gold/60 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Saber más <ArrowRightIcon className="w-4 h-4" />
        </div>
    </div>
);

const LandingPage: React.FC = () => {
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { productos, loading } = useData();
    const [calcQty, setCalcQty] = useState(5);
    const [calcPrice, setCalcPrice] = useState(65);

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
        <div className="min-h-screen bg-brand-dark font-sans selection:bg-liquid-gold selection:text-brand-dark">
            
            {/* --- NAVEGACIÓN OBSIDIAN --- */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-brand-dark/80 backdrop-blur-xl border-b border-white/5 py-4">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <CordovaLogo className="h-10 w-auto group-hover:scale-110 transition-transform brightness-0 invert" />
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Pasaje • Ecuador</span>
                            <span className="text-xl font-editorial font-bold text-white uppercase tracking-tight italic">Córdova</span>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <a href="#servicios" className="hover:text-liquid-gold transition-colors">Servicios</a>
                        <a href="#catalog" className="hover:text-liquid-gold transition-colors">Catálogo</a>
                        <a href="#proceso" className="hover:text-liquid-gold transition-colors">Tecnología</a>
                        <Link to="/tracking" className="text-liquid-gold animate-pulse">Rastrear Pedido</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-white/5 rounded-2xl hover:bg-liquid-gold/10 hover:border-liquid-gold/30 border border-white/5 transition-all text-slate-400 hover:text-liquid-gold">
                            <ShoppingCartIcon className="w-6 h-6" />
                            {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-liquid-gold text-brand-dark text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartItems.length}</span>}
                        </button>
                        <Link to="/login" className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white text-brand-dark rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-liquid-gold transition-all shadow-luxury">
                            Acceso Personal
                        </Link>
                    </div>
                </div>
            </nav>

            {/* --- HERO OBSIDIAN & GOLD --- */}
            <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-liquid-gold/5 rounded-full blur-[160px] -mr-64 -mt-64 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-liquid-gold/3 rounded-full blur-[140px] -ml-32 -mb-32 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-7 space-y-10 animate-fade-in-up">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-liquid-gold/10 border border-liquid-gold/20 rounded-full text-liquid-gold backdrop-blur-md">
                                <SparklesIcon className="w-4 h-4 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Líderes en Calidad Gráfica • Pasaje, El Oro</span>
                            </div>
                            
                            <h1 className="text-6xl md:text-8xl lg:text-9xl font-editorial font-bold text-white leading-[0.85] tracking-tight uppercase italic">
                                Calidad <br/>
                                <span className="text-gold-gradient">Imbatible</span>
                            </h1>

                            <p className="text-xl lg:text-2xl text-slate-400 font-light max-w-2xl leading-relaxed">
                                Expertos en <span className="text-white font-bold">Gigantografías Roland</span>, Talonarios SRI y Publicidad que hace crecer tu marca en <span className="text-liquid-gold font-bold italic">Pasaje, El Oro</span>.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 pt-4">
                                <a href="https://wa.me/593993083943" className="group px-12 py-6 bg-white text-brand-dark rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-luxury hover:bg-liquid-gold transition-all duration-700 flex items-center justify-center gap-3">
                                    <WhatsAppIcon className="w-6 h-6 group-hover:scale-110 transition-transform"/> Cotización Directa
                                </a>
                                <button onClick={() => fileInputRef.current?.click()} className="px-12 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:border-liquid-gold/30 hover:bg-liquid-gold/5 transition-all flex items-center justify-center gap-3">
                                    <MonitorIcon className="w-6 h-6"/> Validar mi Diseño
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileTest} />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12">
                                <StatCard label="Experiencia" value="+15" sub="Años Líderes" />
                                <StatCard label="Satisfacción" value="10k" sub="Clientes Felices" />
                                <StatCard label="Tecnología" value="HD" sub="Resolución Roland" />
                                <StatCard label="Ubicación" value="07" sub="Pasaje Centro" />
                            </div>
                        </div>

                        {/* --- WIDGET IA DINÁMICO --- */}
                        <div className="lg:col-span-5 relative group">
                            <div className="absolute -inset-4 bg-liquid-gold/10 rounded-[4rem] blur-2xl opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
                            
                            <div className="relative bg-white/5 backdrop-blur-xl rounded-[3.5rem] p-12 border border-white/10 hover:border-liquid-gold/20 transition-all duration-700">
                                {isTesting ? (
                                    <div className="py-20 text-center space-y-6">
                                        <Loader2Icon className="w-16 h-16 animate-spin mx-auto text-liquid-gold" />
                                        <h3 className="text-xl font-editorial font-bold text-white uppercase tracking-wide italic">Córdova Vision IA</h3>
                                        <p className="text-sm text-slate-500">Analizando resolución y perfil de color...</p>
                                    </div>
                                ) : testResult ? (
                                    <div className="animate-fade-in space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-liquid-gold/20 border border-liquid-gold/30 p-4 rounded-3xl text-liquid-gold shadow-gold-glow">
                                                <SparklesIcon className="w-8 h-8"/>
                                            </div>
                                            <button onClick={() => setTestResult(null)} className="text-slate-500 hover:text-white transition-colors">
                                                <CloseIcon className="w-6 h-6"/>
                                            </button>
                                        </div>
                                        <h3 className="text-3xl font-editorial font-bold text-white uppercase tracking-tight leading-none italic">{testResult.veredicto}</h3>
                                        <div className="p-6 bg-white/5 rounded-3xl space-y-4 border border-white/5">
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Diagnóstico Técnico:</p>
                                            <p className="text-lg font-medium italic text-slate-300">"{testResult.calidad}"</p>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {testResult.advertencias.map((adv: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-red-500/10 text-red-400 text-[9px] font-black uppercase rounded-lg border border-red-500/20">{adv}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:border-liquid-gold/30 transition-all">
                                            Subir otro archivo
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-liquid-gold/10 border border-liquid-gold/20 rounded-2xl text-liquid-gold">
                                                <SparklesIcon className="w-6 h-6"/>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-editorial font-bold text-white uppercase tracking-tight italic">Córdova Vision</h3>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inteligencia Artificial Aplicada</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <p className="text-slate-400 text-sm leading-relaxed">Sube tu diseño y nuestra IA determinará si tiene la resolución adecuada para una <strong className="text-white">Gigantografía HD</strong> o impresión offset.</p>
                                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-10 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-liquid-gold/30 hover:bg-liquid-gold/5 transition-all group">
                                                <UploadIcon className="w-12 h-12 text-slate-600 group-hover:text-liquid-gold transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-liquid-gold transition-colors">Seleccionar Archivo</span>
                                            </button>
                                        </div>

                                        <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex -space-x-3">
                                                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-liquid-gold/20 border-2 border-brand-dark" />)}
                                            </div>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Validado por expertos</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN SERVICIOS --- */}
            <section id="servicios" className="py-32 scroll-mt-24 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-dark/95 to-brand-dark pointer-events-none" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-4xl mb-24">
                        <span className="text-liquid-gold/70 font-black text-[10px] uppercase tracking-[0.4em] mb-4 block italic">Servicios de Élite</span>
                        <h2 className="text-5xl lg:text-7xl font-editorial font-bold text-white uppercase tracking-tight leading-none italic mb-8">
                            POTENCIAMOS <br/> <span className="text-gold-gradient">TU NEGOCIO</span>
                        </h2>
                        <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">Combinamos la tradición de la imprenta clásica con las máquinas más veloces de Pasaje para resultados industriales en tiempos récord.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <ServiceCard title="Gigantografías HD" desc="Impresión en lona brillante, mate y vinilos adhesivos con tecnología Roland Eco-Solvente de alta durabilidad." icon={PrinterIcon} />
                        <ServiceCard title="Talonarios SRI" desc="Imprenta Autorizada para Facturas, Notas de Venta y Retenciones. Todo bajo normativas RIMPE y Régimen General." icon={ShieldCheckIcon} />
                        <ServiceCard title="Marketing & Branding" desc="Diseño de logotipos imponentes, volantes de alto impacto y tarjetas de presentación con acabados premium." icon={PaletteIcon} />
                    </div>
                </div>
            </section>

            {/* --- COTIZADOR RÁPIDO --- */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/3" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                <div className="container mx-auto px-6 flex flex-col lg:flex-row gap-20 items-center relative z-10">
                    <div className="lg:w-1/2 space-y-8">
                        <h2 className="text-5xl font-editorial font-bold text-white uppercase tracking-tight leading-none italic">
                            PROYECTA TU <br/> <span className="text-gold-gradient">INVERSIÓN</span>
                        </h2>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            No pierdas tiempo esperando correos. Calcula el valor aproximado de tus talonarios autorizados ahora mismo.
                        </p>
                        
                        <div className="space-y-10 pt-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">1. ¿Cuántos Talonarios necesitas?</label>
                                    <span className="text-2xl font-editorial font-bold text-liquid-gold italic">{calcQty} Uds</span>
                                </div>
                                <input type="range" min="1" max="50" value={calcQty} onChange={e => {
                                    const qty = parseInt(e.target.value);
                                    setCalcQty(qty);
                                    if(qty >= 10) setCalcPrice(qty * 11);
                                    else if(qty >= 5) setCalcPrice(qty * 13);
                                    else setCalcPrice(qty * 15);
                                }} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-liquid-gold" />
                            </div>

                            <div className="p-8 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 hover:border-liquid-gold/20 transition-all flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inversión Neta Estimada</p>
                                    <p className="text-5xl font-editorial font-bold text-white tracking-tight italic">{formatCurrency(calcPrice)}</p>
                                </div>
                                <a href={`https://wa.me/593993083943?text=Hola,%20quiero%20cotizar%20${calcQty}%20talonarios`} className="w-16 h-16 bg-white text-brand-dark rounded-2xl flex items-center justify-center shadow-luxury hover:bg-liquid-gold hover:shadow-gold-glow transition-all duration-500">
                                    <WhatsAppIcon className="w-8 h-8" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 relative group">
                        <div className="aspect-square bg-white/3 rounded-[4rem] overflow-hidden border border-white/10 hover:border-liquid-gold/20 transition-all duration-700 relative shadow-luxury">
                             <img src="https://i.imgur.com/AUvl1wF.png" className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-70 transition-all duration-1000" alt="Máquina Roland" />
                             <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent flex flex-col justify-end p-12">
                                <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-liquid-gold/20 transition-all">
                                    <h4 className="text-2xl font-editorial font-bold text-white uppercase tracking-tight mb-2 italic">Garantía de Color Roland</h4>
                                    <p className="text-sm text-slate-400">Nuestros equipos se calibran semanalmente para asegurar que el color de tu pantalla sea el que sale impreso.</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CATÁLOGO PREMIUM --- */}
            <section id="catalog" className="py-32">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div>
                            <span className="text-liquid-gold/70 font-black text-[10px] uppercase tracking-[0.4em] mb-4 block italic">Stock & Soluciones</span>
                            <h2 className="text-5xl lg:text-7xl font-editorial font-bold text-white uppercase tracking-tight italic">
                                NUESTROS <span className="text-gold-gradient">IMPRESCINDIBLES</span>
                            </h2>
                        </div>
                        <div className="flex gap-4">
                            <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:border-liquid-gold/30 transition-all">
                                Filtrar por categoría
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white/5 rounded-[3rem] h-[500px] animate-pulse" />
                        )) : productos.slice(0, 8).map(p => (
                            <article key={p.id} className="group bg-white/5 backdrop-blur-xl rounded-[3.5rem] border border-white/5 hover:border-liquid-gold/20 overflow-hidden transition-all duration-700 p-4 flex flex-col hover:-translate-y-2 hover:shadow-luxury">
                                <div className="h-64 rounded-[2.5rem] overflow-hidden relative mb-8">
                                    {p.imagenUrl ? <img src={p.imagenUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={p.nombre}/> : <div className="w-full h-full bg-white/5 flex items-center justify-center text-slate-600"><BoxIcon className="w-16 h-16"/></div>}
                                    <div className="absolute inset-0 bg-brand-dark/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                                        <p className="text-white text-xs font-bold leading-relaxed mb-6 italic">{p.descripcion}</p>
                                        <button onClick={() => handleAddToCart(p)} className="bg-white text-brand-dark px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-luxury hover:bg-liquid-gold transition-all">Cotizar Proyecto</button>
                                    </div>
                                    {p.esSRI && <span className="absolute top-6 left-6 bg-liquid-gold text-brand-dark text-[8px] font-black px-3 py-1.5 rounded-xl shadow-gold-glow tracking-[0.2em]">AUTORIZADO SRI</span>}
                                </div>
                                <div className="px-4 pb-4 flex flex-col flex-grow">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">{p.categoria}</p>
                                    <h3 className="font-editorial font-bold text-white text-xl uppercase leading-tight mb-8 group-hover:text-liquid-gold transition-colors italic">{p.nombre}</h3>
                                    <div className="mt-auto flex justify-between items-center pt-6 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold text-slate-600 uppercase">Referencial</span>
                                            <span className="text-3xl font-editorial font-bold text-white tracking-tight italic">{formatCurrency(p.precio)}</span>
                                        </div>
                                        <button onClick={() => handleAddToCart(p)} className="w-14 h-14 bg-white text-brand-dark rounded-2xl hover:bg-liquid-gold hover:shadow-gold-glow transition-all flex items-center justify-center shadow-luxury">
                                            <AddIcon className="w-6 h-6"/>
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER OSCURO --- */}
            <footer className="bg-brand-dark text-white pt-32 pb-16 relative overflow-hidden border-t border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-liquid-gold/5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-20 mb-24">
                        <div className="lg:col-span-5 space-y-10">
                            <div className="flex items-center gap-4">
                                <CordovaLogo className="h-16 w-auto brightness-0 invert" />
                                <div className="flex flex-col leading-none">
                                    <span className="text-2xl font-editorial font-bold tracking-tight uppercase italic text-liquid-gold">CÓRDOVA</span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-600">Imprenta & Publicidad</span>
                                </div>
                            </div>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-sm italic">"Donde la calidad técnica se encuentra con la precisión digital. Sirviendo a Pasaje y El Oro desde 2010."</p>
                            <div className="flex gap-4">
                                {[MessageCircleIcon, PaletteIcon, UsersIcon].map((Icon, i) => (
                                    <a key={i} href="#" className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-liquid-gold/10 hover:border-liquid-gold/30 transition-all border border-white/5 group text-slate-500 hover:text-liquid-gold">
                                        <Icon className="w-6 h-6 group-hover:scale-110 transition-transform"/>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-12">
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 pb-4">Nuestra Sede</h4>
                                <p className="text-sm font-bold flex items-start gap-4 leading-relaxed text-slate-300"><MapPinIcon className="w-6 h-6 text-liquid-gold/60 shrink-0"/> Calle Colón entre <br/> Sucre y Rocafuerte.<br/>Pasaje, El Oro - EC</p>
                            </div>
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 pb-4">Contacto Directo</h4>
                                <p className="text-sm font-bold flex items-center gap-4 text-slate-300"><PhoneIcon className="w-6 h-6 text-liquid-gold/60 shrink-0"/> 099 308 3943</p>
                                <p className="text-sm font-bold flex items-center gap-4 text-xs truncate text-slate-300"><EnvelopeIcon className="w-6 h-6 text-liquid-gold/60 shrink-0"/> imprentacordova@gmail.com</p>
                            </div>
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 pb-4">Horarios</h4>
                                <p className="text-sm font-bold flex items-center gap-4 text-slate-300"><ClockIcon className="w-6 h-6 text-liquid-gold/60 shrink-0"/> Lun - Sáb <br/> 08:00 AM - 07:00 PM</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">
                        <p>&copy; 2025 Imprenta Córdova. Excelencia Gráfica.</p>
                        <div className="flex gap-10">
                            <a href="#" className="hover:text-liquid-gold transition-colors">Términos</a>
                            <a href="#" className="hover:text-liquid-gold transition-colors">SRI Legal</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* --- CARRITO FLOTANTE (BOUTIQUE OSCURO) --- */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-brand-dark/95 backdrop-blur-xl z-[200] flex justify-end p-4 animate-fade-in" onClick={() => setIsCartOpen(false)}>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 h-full w-full max-w-md rounded-[3.5rem] shadow-luxury flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/3">
                            <h2 className="text-2xl font-editorial font-bold text-white uppercase tracking-tight italic">Resumen del Pedido</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-4 hover:bg-liquid-gold/10 rounded-2xl border border-transparent hover:border-liquid-gold/20 transition-all">
                                <CloseIcon className="w-6 h-6 text-slate-400"/>
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-12 space-y-10 custom-scrollbar">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-32 opacity-20 flex flex-col items-center">
                                    <BoxIcon className="w-24 h-24 mb-6"/>
                                    <p className="font-black uppercase tracking-widest text-xs">Tu bolsa de proyectos está vacía</p>
                                </div>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.producto.id} className="flex justify-between items-center group">
                                        <div className="min-w-0 flex-grow pr-8">
                                            <p className="font-black text-xs uppercase text-white group-hover:text-liquid-gold transition-colors truncate">{item.producto.nombre}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase mt-2 tracking-widest">{item.cantidad} x {formatCurrency(item.producto.precio)}</p>
                                        </div>
                                        <button onClick={() => setCartItems(cartItems.filter(i => i.producto.id !== item.producto.id))} className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                        {cartItems.length > 0 && (
                            <div className="p-12 bg-white/5 border-t border-white/5 space-y-10">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Inversión</p>
                                        <span className="text-5xl font-editorial font-bold text-white tracking-tight italic">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <span className="text-[8px] font-black text-liquid-gold uppercase tracking-widest animate-pulse">Confirmar por WhatsApp</span>
                                </div>
                                <button onClick={() => window.open(`https://wa.me/593993083943?text=Hola,%20quiero%20cotizar%20estos%20servicios`)} className="w-full py-7 bg-white text-brand-dark font-black rounded-3xl shadow-luxury uppercase tracking-[0.3em] text-xs hover:bg-liquid-gold hover:shadow-gold-glow transition-all duration-700 flex items-center justify-center gap-4 group">
                                    ENVIAR PROYECTO <WhatsAppIcon className="w-6 h-6 group-hover:scale-125 transition-transform"/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
