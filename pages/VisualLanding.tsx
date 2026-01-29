
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, CheckCircleIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, PrinterIcon, CheckBadgeIcon, ClockIcon,
    SearchIcon, SparklesIcon, MonitorIcon, MessageCircleIcon, ChevronRightIcon,
    Loader2Icon, WalletIcon, ExclamationTriangleIcon, LayersIcon, WhatsAppIcon,
    PaletteIcon, ReceiptIcon, InfoIcon, UploadIcon
} from '../components/Icons';
import { getProductos, createPublicPedido } from '../services/mockApi';
import { analyzeImageQualityForPrint } from '../services/geminiService';
import { Producto, Trabajo, TrabajoEstado } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';

const StatCard: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
    <div className="text-center p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 group hover:bg-white/10 transition-all duration-500 hover:-translate-y-2">
        <p className="text-[10px] font-bold text-brand-red uppercase tracking-[0.3em] mb-3">{label}</p>
        <p className="text-5xl lg:text-6xl font-display font-black text-white tracking-tighter mb-2 group-hover:scale-105 transition-transform">{value}</p>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{sub}</p>
    </div>
);

const ServiceCard: React.FC<{ title: string; desc: string; icon: any; color: string }> = ({ title, desc, icon: Icon, color }) => (
    <div className="group bg-white dark:bg-surface-dark p-10 rounded-[2.5rem] shadow-soft hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-white/5 hover:-translate-y-2">
        <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-8 shadow-lg group-hover:rotate-6 transition-transform duration-500`}>
            <Icon className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-4 leading-tight">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{desc}</p>
        <div className="mt-8 flex items-center gap-2 text-brand-blue font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
            Explorar <ArrowRightIcon className="w-4 h-4" />
        </div>
    </div>
);

const VisualLanding: React.FC = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [trackingId, setTrackingId] = useState('');
    
    // Checkout States
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<Trabajo | null>(null);

    // IA Quality Tester State
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cotizador Rápido State
    const [calcQty, setCalcQty] = useState(1);
    const [calcPrice, setCalcPrice] = useState(15);

    useEffect(() => {
        getProductos().then(data => {
            setProductos(data);
            setLoading(false);
        });
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
            const newOrder = await createPublicPedido(
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

    const handleQuickTrack = (e: React.FormEvent) => {
        e.preventDefault();
        if (trackingId.trim()) {
            navigate('/tracking'); 
        }
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);

    return (
        <div className="min-h-screen bg-surface-light dark:bg-brand-dark font-sans selection:bg-brand-red selection:text-white transition-colors duration-500">
            
            {/* --- NAVEGACIÓN PRO --- */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/70 dark:bg-brand-dark/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 py-4 transition-all duration-300">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="bg-brand-blue text-white p-1.5 rounded-lg shadow-lg group-hover:rotate-6 transition-transform">
                            <CordovaLogo className="h-6 w-auto brightness-0 invert" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Pasaje</span>
                            <span className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">CÓRDOVA</span>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        <a href="#servicios" className="hover:text-brand-blue dark:hover:text-white transition-colors">Servicios</a>
                        <a href="#promociones" className="text-brand-red animate-pulse">Ofertas</a>
                        <a href="#catalog" className="hover:text-brand-blue dark:hover:text-white transition-colors">Catálogo</a>
                        <Link to="/tracking" className="hover:text-brand-blue dark:hover:text-white transition-colors">Rastrear</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => { setIsCartOpen(true); setIsCheckingOut(false); setCompletedOrder(null); }} className="relative p-3 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-brand-blue hover:text-white transition-all group">
                            <ShoppingCartIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-brand-dark">{cartItems.length}</span>}
                        </button>
                        <Link to="/login" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-brand-dark rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:-translate-y-0.5 transition-all">
                            Acceso
                        </Link>
                    </div>
                </div>
            </nav>

            {/* --- HERO IMPONENTE --- */}
            <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden bg-brand-dark">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/20 rounded-full blur-[120px] -mr-32 -mt-32 mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-red/10 rounded-full blur-[100px] -ml-32 -mb-32 mix-blend-screen"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-7 space-y-10 animate-fade-in">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-brand-red backdrop-blur-md shadow-glow">
                                <SparklesIcon className="w-4 h-4 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Excelencia Gráfica El Oro</span>
                            </div>
                            
                            <h1 className="text-6xl md:text-8xl font-display font-black text-white leading-[0.9] tracking-tight">
                                IMPRESIÓN <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-500">DE ÉLITE</span>
                            </h1>

                            <p className="text-xl text-slate-400 font-light max-w-2xl leading-relaxed">
                                Combinamos artesanía tradicional con tecnología <span className="text-white font-medium">Roland HD</span> para elevar la imagen de tu negocio en Pasaje.
                            </p>

                            {/* BARRA DE RASTREO RÁPIDO */}
                            <form onSubmit={handleQuickTrack} className="bg-white/5 border border-white/10 p-2 rounded-2xl max-w-md flex items-center gap-2 backdrop-blur-md shadow-2xl hover:border-white/20 transition-all">
                                <input 
                                    type="text" 
                                    value={trackingId}
                                    onChange={e => setTrackingId(e.target.value)}
                                    placeholder="Rastrea tu pedido (Nro Orden)..." 
                                    className="bg-transparent border-none text-white placeholder-slate-400 font-bold text-sm px-4 flex-grow focus:ring-0 outline-none"
                                />
                                <button type="submit" className="bg-brand-blue text-white p-3 rounded-xl hover:bg-white hover:text-brand-blue transition-all">
                                    <SearchIcon className="w-5 h-5"/>
                                </button>
                            </form>

                            <div className="flex flex-col sm:flex-row gap-5 pt-4">
                                <a href="https://wa.me/593993083943" className="px-8 py-4 bg-brand-red text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-red/20 hover:bg-white hover:text-brand-red transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3">
                                    <WhatsAppIcon className="w-5 h-5"/> Cotizar Ahora
                                </a>
                                <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                                    <MonitorIcon className="w-5 h-5"/> Validar Diseño
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileTest} />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/5">
                                <StatCard label="Años" value="15+" sub="Experiencia" />
                                <StatCard label="Clientes" value="10k" sub="Satisfechos" />
                                <StatCard label="Calidad" value="HD" sub="Roland Tech" />
                                <StatCard label="Sede" value="07" sub="Pasaje" />
                            </div>
                        </div>

                        {/* --- WIDGET IA DINÁMICO --- */}
                        <div className="lg:col-span-5 relative group animate-slide-up" style={{animationDelay: '200ms'}}>
                            <div className="absolute -inset-1 bg-gradient-to-tr from-brand-blue to-purple-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-50 transition-opacity duration-700"></div>
                            
                            <div className="relative bg-surface-dark/90 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border border-white/10">
                                {isTesting ? (
                                    <div className="py-20 text-center space-y-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-brand-blue/20 blur-xl rounded-full"></div>
                                            <Loader2Icon className="w-16 h-16 animate-spin mx-auto text-brand-blue relative z-10" />
                                        </div>
                                        <h3 className="text-xl font-display font-bold uppercase tracking-widest text-white">Córdova Vision</h3>
                                        <p className="text-sm text-slate-400">Analizando resolución y perfil de color...</p>
                                    </div>
                                ) : testResult ? (
                                    <div className="animate-fade-in space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-brand-blue p-3 rounded-xl text-white shadow-lg"><SparklesIcon className="w-6 h-6"/></div>
                                            <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                                        </div>
                                        <h3 className="text-3xl font-display font-black uppercase tracking-tight leading-none text-white">{testResult.veredicto}</h3>
                                        <div className="p-6 bg-white/5 rounded-2xl space-y-4 border border-white/5">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diagnóstico Técnico:</p>
                                            <p className="text-lg font-medium italic text-slate-200">"{testResult.calidad}"</p>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {testResult.advertencias.map((adv: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-red-500/10 text-red-400 text-[9px] font-black uppercase rounded-lg border border-red-500/20">{adv}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-white text-brand-dark rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-colors">Subir otro archivo</button>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-brand-blue/20 rounded-xl text-brand-blue border border-brand-blue/20"><SparklesIcon className="w-6 h-6"/></div>
                                            <div>
                                                <h3 className="text-lg font-display font-bold uppercase tracking-tight text-white">Vision AI</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Análisis de Archivos Gratuito</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <p className="text-slate-400 text-sm leading-relaxed">Sube tu diseño y nuestra IA determinará si tiene la resolución adecuada para una **Gigantografía HD** o impresión offset.</p>
                                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-10 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-brand-blue hover:bg-brand-blue/5 transition-all group">
                                                <UploadIcon className="w-10 h-10 text-slate-500 group-hover:text-brand-blue transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">Seleccionar Archivo</span>
                                            </button>
                                        </div>

                                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                            <div className="flex -space-x-2">
                                                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800" />)}
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Validado por expertos</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN PROMOCIONES (Estilo Boutique) --- */}
            <section id="promociones" className="py-24 bg-brand-red relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="text-white space-y-6 md:w-1/2">
                            <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">Oferta Limitada</span>
                            <h2 className="text-5xl lg:text-7xl font-display font-black uppercase tracking-tighter leading-none">
                                1000 Tarjetas <br/> Premium
                            </h2>
                            <p className="text-white/80 text-lg max-w-md font-light">Papel Couché 300g, Laminado Mate y Diseño Básico incluido. La mejor carta de presentación.</p>
                            <div className="flex items-end gap-3">
                                <span className="text-7xl font-display font-black tracking-tighter">$35</span>
                                <span className="text-sm font-bold opacity-80 uppercase pb-2">Final <br/> con IVA</span>
                            </div>
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 md:w-1/2 max-w-md">
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="p-4 bg-yellow-50 rounded-full"><SparklesIcon className="w-8 h-8 text-yellow-500" /></div>
                                <h3 className="text-2xl font-display font-black text-slate-900 uppercase tracking-tight">Pack Emprendedor</h3>
                                <div className="space-y-3 w-full">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500"/> <span className="text-sm font-bold text-slate-700">1000 Tarjetas</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500"/> <span className="text-sm font-bold text-slate-700">1000 Volantes A6</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500"/> <span className="text-sm font-bold text-slate-700">Diseño de Logotipo</span>
                                    </div>
                                </div>
                                <button onClick={() => window.open('https://wa.me/593993083943?text=Me%20interesa%20el%20Pack%20Emprendedor')} className="w-full py-4 bg-brand-dark text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-blue transition-colors shadow-lg">
                                    Solicitar por $80
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN SERVICIOS --- */}
            <section id="servicios" className="py-32 bg-surface-light dark:bg-brand-dark scroll-mt-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mb-24">
                        <span className="text-brand-red font-bold text-xs uppercase tracking-widest mb-4 block">Soluciones de Élite</span>
                        <h2 className="text-5xl lg:text-6xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-6">
                            Tu Imagen <br/> <span className="text-slate-400">Nuestra Pasión</span>
                        </h2>
                        <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">Impresión industrial con acabado artesanal. Desde gigantografías hasta papelería corporativa.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ServiceCard 
                            title="Gigantografías" 
                            desc="Impresión en lona, vinilos y microperforados. Colores vibrantes y resistencia exterior." 
                            icon={PrinterIcon} 
                            color="bg-blue-100 dark:bg-blue-900/30 text-brand-blue" 
                        />
                        <ServiceCard 
                            title="SRI Autorizado" 
                            desc="Facturas, Notas de Venta y Retenciones. Cumplimos con todas las normativas vigentes." 
                            icon={ShieldCheckIcon} 
                            color="bg-red-100 dark:bg-red-900/30 text-brand-red" 
                        />
                        <ServiceCard 
                            title="Branding" 
                            desc="Diseño de identidad visual, logotipos y material publicitario de alto impacto." 
                            icon={PaletteIcon} 
                            color="bg-purple-100 dark:bg-purple-900/30 text-purple-600" 
                        />
                    </div>
                </div>
            </section>

            {/* --- CATÁLOGO PREMIUM --- */}
            <section id="catalog" className="py-32 bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-white/5">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div>
                            <h2 className="text-4xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter">Catálogo</h2>
                            <p className="text-slate-500 mt-2 font-medium">Los favoritos de nuestros clientes.</p>
                        </div>
                        <button className="px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-colors">Ver Todo</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-slate-50 dark:bg-white/5 rounded-[2rem] h-[400px] animate-pulse"></div>
                        )) : productos.slice(0, 8).map(p => (
                            <article key={p.id} className="group bg-surface-light dark:bg-brand-dark rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 dark:border-white/5 p-4 flex flex-col hover:-translate-y-2">
                                <div className="h-56 rounded-[2rem] overflow-hidden relative mb-6 bg-white dark:bg-white/5">
                                    {p.imagenUrl ? <img src={p.imagenUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.nombre}/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><BoxIcon className="w-12 h-12"/></div>}
                                    <button onClick={() => handleAddToCart(p)} className="absolute bottom-4 right-4 w-12 h-12 bg-white text-brand-blue rounded-full flex items-center justify-center shadow-lg hover:bg-brand-blue hover:text-white transition-all transform scale-0 group-hover:scale-100 duration-300">
                                        <AddIcon className="w-6 h-6"/>
                                    </button>
                                    {p.esSRI && <span className="absolute top-4 left-4 bg-brand-red text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-md tracking-widest uppercase">SRI</span>}
                                </div>
                                <div className="px-2 pb-2 flex flex-col flex-grow">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.categoria}</p>
                                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg leading-tight mb-4 group-hover:text-brand-blue transition-colors line-clamp-2">{p.nombre}</h3>
                                    <div className="mt-auto flex justify-between items-end border-t border-slate-200 dark:border-white/5 pt-4">
                                        <div>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">Desde</span>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(p.precio)}</p>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER MAESTRO --- */}
            <footer className="bg-brand-dark text-white pt-32 pb-12 relative overflow-hidden">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-20 mb-20">
                        <div className="lg:col-span-5 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="bg-white text-brand-dark p-2 rounded-lg">
                                    <CordovaLogo className="h-8 w-auto" />
                                </div>
                                <span className="text-2xl font-display font-black tracking-tighter uppercase text-white">CÓRDOVA</span>
                            </div>
                            <p className="text-slate-400 text-lg font-light leading-relaxed max-w-sm">"Calidad que perdura. La imprenta de confianza para los grandes negocios de El Oro."</p>
                            <div className="flex gap-4">
                                {[MessageCircleIcon, PaletteIcon, UsersIcon].map((Icon, i) => (
                                    <a key={i} href="#" className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-brand-blue transition-all border border-white/5 group">
                                        <Icon className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-12 text-sm">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Ubicación</h4>
                                <p className="font-medium text-slate-300 flex flex-col gap-1">
                                    <span>Pasaje, El Oro</span>
                                    <span>Calle Colón e/ Sucre y Rocafuerte</span>
                                    <span className="text-xs text-slate-500 mt-2">Diagonal al Parque Central</span>
                                </p>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Contacto</h4>
                                <p className="font-medium text-slate-300 flex flex-col gap-2">
                                    <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><PhoneIcon className="w-4 h-4"/> 099 308 3943</span>
                                    <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><EnvelopeIcon className="w-4 h-4"/> ventas@imprentacordova.com</span>
                                </p>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Horarios</h4>
                                <p className="font-medium text-slate-300">
                                    Lunes a Sábado <br/>
                                    <span className="text-white font-bold">08:00 AM - 07:00 PM</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                        <p>&copy; 2025 Imprenta Córdova. Todos los derechos reservados.</p>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-white transition-colors">Términos</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* --- CARRITO FLOTANTE (ESTILO BOUTIQUE) --- */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl z-[200] flex justify-end animate-fade-in" onClick={() => { setIsCartOpen(false); setIsCheckingOut(false); setCompletedOrder(null); }}>
                    <div className="bg-white dark:bg-surface-dark h-full w-full max-w-md shadow-2xl flex flex-col overflow-hidden border-l border-white/5" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-brand-dark">
                            <h2 className="text-xl font-display font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tu Proyecto</h2>
                            <button onClick={() => { setIsCartOpen(false); setIsCheckingOut(false); setCompletedOrder(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all"><CloseIcon className="w-5 h-5 text-slate-400"/></button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-transparent">
                            {completedOrder ? (
                                <div className="text-center space-y-6 py-10">
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                                        <CheckBadgeIcon className="w-10 h-10 text-green-600 dark:text-green-400"/>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase text-slate-900 dark:text-white tracking-tight">¡Orden Recibida!</h3>
                                        <p className="text-slate-500 font-medium mt-2 text-sm">Tu código de rastreo:</p>
                                    </div>
                                    <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                                        <p className="text-4xl font-mono font-black text-brand-blue tracking-tighter">#{completedOrder.orden}</p>
                                    </div>
                                    <button 
                                        onClick={() => window.open(generateWhatsAppLink('0993083943', `Hola Imprenta Córdova, acabo de generar el pedido #${completedOrder.orden} desde la web.`), '_blank')}
                                        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <WhatsAppIcon className="w-5 h-5"/> Enviar Comprobante
                                    </button>
                                </div>
                            ) : cartItems.length === 0 ? (
                                <div className="text-center py-32 opacity-30 flex flex-col items-center">
                                    <BoxIcon className="w-16 h-16 mb-4"/>
                                    <p className="font-bold uppercase tracking-widest text-xs">Tu bolsa está vacía</p>
                                </div>
                            ) : (
                                <>
                                    {cartItems.map(item => (
                                        <div key={item.producto.id} className="flex justify-between items-center p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm group">
                                            <div className="min-w-0 flex-grow pr-4">
                                                <p className="font-bold text-sm uppercase text-slate-900 dark:text-white group-hover:text-brand-blue transition-colors truncate">{item.producto.nombre}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{item.cantidad} x {formatCurrency(item.producto.precio)}</p>
                                            </div>
                                            <button onClick={() => setCartItems(cartItems.filter(i => i.producto.id !== item.producto.id))} className="text-slate-300 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    ))}
                                    
                                    {isCheckingOut && (
                                        <form onSubmit={handlePlaceOrder} className="animate-slide-up pt-4 space-y-4">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Tu Nombre</label>
                                                    <input 
                                                        type="text" 
                                                        required 
                                                        value={clientName}
                                                        onChange={e => setClientName(e.target.value)}
                                                        className="w-full p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                                                        placeholder="Ej: Juan Pérez"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">WhatsApp</label>
                                                    <input 
                                                        type="tel" 
                                                        required 
                                                        value={clientPhone}
                                                        onChange={e => setClientPhone(e.target.value)}
                                                        className="w-full p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                                                        placeholder="099..."
                                                    />
                                                </div>
                                            </div>
                                        </form>
                                    )}
                                </>
                            )}
                        </div>

                        {!completedOrder && cartItems.length > 0 && (
                            <div className="p-8 bg-white dark:bg-brand-dark border-t border-slate-100 dark:border-white/5 space-y-6">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Estimado</span>
                                    <span className="text-4xl font-display font-black tracking-tighter text-brand-blue dark:text-white">{formatCurrency(subtotal)}</span>
                                </div>
                                {isCheckingOut ? (
                                    <div className="flex gap-3">
                                        <button onClick={() => setIsCheckingOut(false)} className="px-6 py-4 bg-slate-100 dark:bg-white/10 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 dark:hover:bg-white/20 transition-all text-slate-600 dark:text-white">Atrás</button>
                                        <button onClick={handlePlaceOrder} disabled={isPlacingOrder || !clientName || !clientPhone} className="flex-grow py-4 bg-brand-red text-white font-bold rounded-xl shadow-lg uppercase tracking-widest text-xs hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                            {isPlacingOrder ? <Loader2Icon className="animate-spin w-4 h-4"/> : 'Confirmar'}
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsCheckingOut(true)} className="w-full py-5 bg-brand-blue text-white font-bold rounded-xl shadow-lg uppercase tracking-widest text-xs hover:bg-blue-800 transition-all flex items-center justify-center gap-3 group">
                                        Continuar <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualLanding;
