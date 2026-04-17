
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
    <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 group hover:bg-brand-red/10 transition-all duration-500">
        <p className="text-[10px] font-black text-brand-red uppercase tracking-[0.3em] mb-2">{label}</p>
        <p className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-1 group-hover:scale-110 transition-transform">{value}</p>
        <p className="text-xs text-slate-400 font-bold uppercase">{sub}</p>
    </div>
);

const ServiceCard: React.FC<{ title: string; desc: string; icon: any; color: string }> = ({ title, desc, icon: Icon, color }) => (
    <div className="group bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-xl hover:shadow-4xl transition-all duration-500 border border-slate-50 dark:border-white/5 hover:-translate-y-4">
        <div className={`w-20 h-20 rounded-[2rem] ${color} flex items-center justify-center mb-8 shadow-2xl group-hover:rotate-12 transition-transform`}>
            <Icon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 leading-none">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm lg:text-base">{desc}</p>
        <div className="mt-8 flex items-center gap-2 text-brand-blue font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Saber más <ArrowRightIcon className="w-4 h-4" />
        </div>
    </div>
);

const LandingPage: React.FC = () => {
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { productos, loading } = useData();
    
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
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-brand-red selection:text-white">
            
            {/* --- NAVEGACIÓN PRO --- */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 py-4">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <CordovaLogo className="h-10 w-auto group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Pasaje • Ecuador</span>
                            <span className="text-xl font-black text-brand-blue dark:text-white uppercase tracking-tighter">Córdova</span>
                        </div>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        <a href="#servicios" className="hover:text-brand-blue transition-colors">Servicios</a>
                        <a href="#catalog" className="hover:text-brand-blue transition-colors">Catálogo</a>
                        <a href="#proceso" className="hover:text-brand-blue transition-colors">Tecnología</a>
                        <Link to="/tracking" className="text-brand-red animate-pulse">Rastrear Pedido</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-brand-blue hover:text-white transition-all">
                            <ShoppingCartIcon className="w-6 h-6" />
                            {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartItems.length}</span>}
                        </button>
                        <Link to="/login" className="hidden sm:flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-blue-900/20">
                            Acceso Personal
                        </Link>
                    </div>
                </div>
            </nav>

            {/* --- HERO IMPONENTE --- */}
            <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden bg-slate-950">
                <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-brand-blue/10 rounded-full blur-[160px] -mr-64 -mt-64"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-red/5 rounded-full blur-[140px] -ml-32 -mb-32"></div>
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-16 items-center">
                        <div className="lg:col-span-7 space-y-10 animate-fade-in-up">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-brand-red backdrop-blur-md">
                                <SparklesIcon className="w-4 h-4 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Líderes en Calidad Gráfica Pasaje</span>
                            </div>
                            
                            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white leading-[0.85] tracking-tighter uppercase italic">
                                Calidad <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-500">Imbatible</span>
                            </h1>

                            <p className="text-xl lg:text-2xl text-slate-400 font-light max-w-2xl leading-relaxed">
                                Expertos en <span className="text-white font-bold">Gigantografías Roland</span>, Talonarios SRI y Publicidad que hace crecer tu marca en <span className="text-white font-bold italic">Pasaje, El Oro</span>.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 pt-4">
                                <a href="https://wa.me/593993083943" className="px-12 py-6 bg-brand-red text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-white hover:text-brand-red transition-all transform hover:scale-105 flex items-center justify-center gap-3">
                                    <WhatsAppIcon className="w-6 h-6"/> Cotización Directa
                                </a>
                                <button onClick={() => fileInputRef.current?.click()} className="px-12 py-6 bg-white/5 border border-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                    <MonitorIcon className="w-6 h-6"/> Validar mi Diseño
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileTest} />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
                                <StatCard label="Experiencia" value="+15" sub="Años Líderes" />
                                <StatCard label="Satisfacción" value="10k" sub="Clientes Felices" />
                                <StatCard label="Tecnología" value="HD" sub="Resolución Roland" />
                                <StatCard label="Ubicación" value="07" sub="Pasaje Centro" />
                            </div>
                        </div>

                        {/* --- WIDGET IA DINÁMICO --- */}
                        <div className="lg:col-span-5 relative group">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-blue to-purple-600 rounded-[4rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            
                            <div className="relative bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 shadow-4xl border border-white/5">
                                {isTesting ? (
                                    <div className="py-20 text-center space-y-6">
                                        <Loader2Icon className="w-16 h-16 animate-spin mx-auto text-brand-blue" />
                                        <h3 className="text-xl font-black uppercase tracking-widest">Córdova Vision IA</h3>
                                        <p className="text-sm text-slate-500">Analizando resolución y perfil de color...</p>
                                    </div>
                                ) : testResult ? (
                                    <div className="animate-fade-in space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-brand-blue p-4 rounded-3xl text-white shadow-xl"><SparklesIcon className="w-8 h-8"/></div>
                                            <button onClick={() => setTestResult(null)} className="text-slate-400"><CloseIcon className="w-6 h-6"/></button>
                                        </div>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{testResult.veredicto}</h3>
                                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl space-y-4">
                                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Diagnóstico Técnico:</p>
                                            <p className="text-lg font-medium italic">"{testResult.calidad}"</p>
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {testResult.advertencias.map((adv: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded-lg border border-red-100">{adv}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Subir otro archivo</button>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-50 dark:bg-brand-blue/20 rounded-2xl text-brand-blue"><SparklesIcon className="w-6 h-6"/></div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tighter">Córdova Vision</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inteligencia Artificial Aplicada</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Sube tu diseño y nuestra IA determinará si tiene la resolución adecuada para una **Gigantografía HD** o impresión offset.</p>
                                            <button onClick={() => fileInputRef.current?.click()} className="w-full py-10 border-4 border-dashed border-slate-100 dark:border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-brand-blue hover:bg-blue-50/50 transition-all group">
                                                {/* Fixed: Added missing UploadIcon import */}
                                                <UploadIcon className="w-12 h-12 text-slate-300 group-hover:text-brand-blue transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Seleccionar Archivo</span>
                                            </button>
                                        </div>

                                        <div className="pt-8 border-t dark:border-white/5 flex items-center justify-between">
                                            <div className="flex -space-x-3">
                                                {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-900" />)}
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validado por expertos</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN SERVICIOS (DOMINIO SEO) --- */}
            <section id="servicios" className="py-32 bg-white dark:bg-slate-950 scroll-mt-24">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mb-24">
                        <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-4 block italic">Servicios de Élite</span>
                        <h2 className="text-5xl lg:text-7xl font-black text-slate-950 dark:text-white uppercase tracking-tighter leading-none italic mb-8">
                            POTENCIAMOS <br/> <span className="text-brand-blue">TU NEGOCIO</span>
                        </h2>
                        <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">Combinamos la tradición de la imprenta clásica con las máquinas más veloces de Pasaje para resultados industriales en tiempos récord.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        <ServiceCard 
                            title="Gigantografías HD" 
                            desc="Impresión en lona brillante, mate y vinilos adhesivos con tecnología Roland Eco-Solvente de alta durabilidad." 
                            icon={PrinterIcon} 
                            color="bg-brand-blue" 
                        />
                        <ServiceCard 
                            title="Talonarios SRI" 
                            desc="Imprenta Autorizada para Facturas, Notas de Venta y Retenciones. Todo bajo normativas RIMPE y Régimen General." 
                            icon={ShieldCheckIcon} 
                            color="bg-brand-red" 
                        />
                        <ServiceCard 
                            title="Marketing & Branding" 
                            desc="Diseño de logotipos imponentes, volantes de alto impacto y tarjetas de presentación con acabados premium." 
                            icon={PaletteIcon} 
                            color="bg-indigo-600" 
                        />
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN COTIZADOR (INTERACTIVO PROFESIONAL) --- */}
            <section className="py-32 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
                 <div className="container mx-auto px-6 flex flex-col lg:flex-row gap-20 items-center">
                    <div className="lg:w-1/2 space-y-8">
                        <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">
                            PROYECTA TU <br/> <span className="text-brand-red">INVERSIÓN</span>
                        </h2>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            No pierdas tiempo esperando correos. Calcula el valor aproximado de tus talonarios autorizados ahora mismo.
                        </p>
                        
                        <div className="space-y-10 pt-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. ¿Cuántos Talonarios necesitas?</label> <span className="text-2xl font-black text-brand-blue">{calcQty} Uds</span></div>
                                <input type="range" min="1" max="50" value={calcQty} onChange={e => {
                                    const qty = parseInt(e.target.value);
                                    setCalcQty(qty);
                                    // Lógica simple de volumen
                                    if(qty >= 10) setCalcPrice(qty * 11);
                                    else if(qty >= 5) setCalcPrice(qty * 13);
                                    else setCalcPrice(qty * 15);
                                }} className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-blue" />
                            </div>

                            <div className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión Neta Estimada</p>
                                    <p className="text-5xl font-black text-brand-blue tracking-tighter">{formatCurrency(calcPrice)}</p>
                                </div>
                                <a href={`https://wa.me/593993083943?text=Hola,%20quiero%20cotizar%20${calcQty}%20talonarios`} className="w-16 h-16 bg-brand-red text-white rounded-2xl flex items-center justify-center shadow-xl hover:rotate-12 transition-transform">
                                    <WhatsAppIcon className="w-8 h-8" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-1/2 relative group">
                        <div className="aspect-square bg-slate-950 rounded-[4rem] overflow-hidden shadow-4xl border-8 border-white dark:border-slate-800 relative">
                             <img src="https://i.imgur.com/AUvl1wF.png" className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700" alt="Máquina Roland" />
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-12">
                                <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20">
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Garantía de Color Roland</h4>
                                    <p className="text-sm text-slate-300">Nuestros equipos se calibran semanalmente para asegurar que el color de tu pantalla sea el que sale impreso.</p>
                                </div>
                             </div>
                        </div>
                    </div>
                 </div>
            </section>

            {/* --- CATÁLOGO PREMIUM --- */}
            <section id="catalog" className="py-32 bg-white dark:bg-slate-950">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                        <div>
                            <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-4 block italic">Stock & Soluciones</span>
                            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">NUESTROS <span className="text-brand-blue">IMPRESCINDIBLES</span></h2>
                        </div>
                        <div className="flex gap-4">
                             <button className="px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-xl font-bold text-[10px] uppercase tracking-widest text-slate-500">Filtrar por categoría</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-slate-50 rounded-[3rem] h-[500px] animate-pulse"></div>
                        )) : productos.slice(0, 8).map(p => (
                            <article key={p.id} className="group bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-xl overflow-hidden hover:shadow-4xl transition-all duration-500 border border-slate-50 dark:border-white/5 p-4 flex flex-col">
                                <div className="h-64 rounded-[2.5rem] overflow-hidden relative mb-8">
                                    {p.imagenUrl ? <img src={p.imagenUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={p.nombre}/> : <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300"><BoxIcon className="w-16 h-16"/></div>}
                                    <div className="absolute inset-0 bg-brand-blue/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                                        <p className="text-white text-xs font-bold leading-relaxed mb-6 italic">{p.descripcion}</p>
                                        <button onClick={() => handleAddToCart(p)} className="bg-white text-brand-blue px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-110 transition-all">Cotizar Proyecto</button>
                                    </div>
                                    {p.esSRI && <span className="absolute top-6 left-6 bg-brand-red text-white text-[8px] font-black px-3 py-1.5 rounded-xl shadow-2xl tracking-[0.2em]">AUTORIZADO SRI</span>}
                                </div>
                                <div className="px-4 pb-4 flex flex-col flex-grow">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{p.categoria}</p>
                                    <h3 className="font-black text-slate-900 dark:text-white text-xl uppercase leading-tight mb-8 group-hover:text-brand-blue transition-colors">{p.nombre}</h3>
                                    <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-50 dark:border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">Referencial</span>
                                            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(p.precio)}</span>
                                        </div>
                                        <button onClick={() => handleAddToCart(p)} className="w-14 h-14 bg-brand-blue text-white rounded-2xl hover:bg-brand-red transition-all flex items-center justify-center shadow-xl shadow-blue-900/10">
                                            <AddIcon className="w-6 h-6"/>
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER MAESTRO --- */}
            <footer className="bg-slate-950 text-white pt-32 pb-16 relative overflow-hidden border-t border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-[120px] -mr-32 -mt-32"></div>
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-12 gap-20 mb-24">
                        <div className="lg:col-span-5 space-y-10">
                            <div className="flex items-center gap-4">
                                <CordovaLogo className="h-16 w-auto brightness-0 invert" />
                                <div className="flex flex-col leading-none">
                                    <span className="text-2xl font-black tracking-tighter uppercase italic text-brand-red">CÓRDOVA</span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">Imprenta & Publicidad</span>
                                </div>
                            </div>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-sm italic">"Donde la calidad técnica se encuentra con la precisión digital. Sirviendo a Pasaje y El Oro desde 2010."</p>
                            <div className="flex gap-4">
                                {[MessageCircleIcon, PaletteIcon, UsersIcon].map((Icon, i) => (
                                    <a key={i} href="#" className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-brand-blue transition-all border border-white/5 group">
                                        <Icon className="w-6 h-6 group-hover:scale-110 transition-transform"/>
                                    </a>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-12">
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Nuestra Sede</h4>
                                <p className="text-sm font-bold flex items-start gap-4 leading-relaxed"><MapPinIcon className="w-6 h-6 text-brand-red shrink-0"/> Calle Colón entre <br/> Sucre y Rocafuerte.<br/>Pasaje, El Oro - EC</p>
                            </div>
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Contacto Directo</h4>
                                <p className="text-sm font-bold flex items-center gap-4"><PhoneIcon className="w-6 h-6 text-brand-blue shrink-0"/> 099 308 3943</p>
                                <p className="text-sm font-bold flex items-center gap-4 text-xs truncate"><EnvelopeIcon className="w-6 h-6 text-brand-blue shrink-0"/> imprentacordova@gmail.com</p>
                            </div>
                            <div className="space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Horarios</h4>
                                <p className="text-sm font-bold flex items-center gap-4"><ClockIcon className="w-6 h-6 text-orange-500 shrink-0"/> Lun - Sáb <br/> 08:00 AM - 07:00 PM</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">
                        <p>&copy; 2025 Imprenta Córdova. Excelencia Gráfica.</p>
                        <div className="flex gap-10">
                            <a href="#" className="hover:text-white transition-colors">Términos</a>
                            <a href="#" className="hover:text-white transition-colors">SRI Legal</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* --- CARRITO FLOTANTE (ESTILO BOUTIQUE) --- */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex justify-end p-4 animate-fade-in" onClick={() => setIsCartOpen(false)}>
                    <div className="bg-white dark:bg-slate-900 h-full w-full max-w-md rounded-[3.5rem] shadow-4xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-12 border-b dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                            <h2 className="text-2xl font-black text-brand-blue dark:text-white uppercase tracking-tighter italic">Resumen del Pedido</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-4 hover:bg-white dark:hover:bg-slate-800 rounded-2xl shadow-xl transition-all"><CloseIcon className="w-6 h-6 text-slate-400"/></button>
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
                                            <p className="font-black text-xs uppercase text-slate-950 dark:text-white group-hover:text-brand-blue transition-colors truncate">{item.producto.nombre}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{item.cantidad} x {formatCurrency(item.producto.precio)}</p>
                                        </div>
                                        <button onClick={() => setCartItems(cartItems.filter(i => i.producto.id !== item.producto.id))} className="w-12 h-12 rounded-2xl bg-red-50 text-red-300 hover:bg-brand-red hover:text-white transition-all flex items-center justify-center shadow-inner"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                ))
                            )}
                        </div>
                        {cartItems.length > 0 && (
                            <div className="p-12 bg-slate-950 text-white space-y-10 rounded-t-[4rem] shadow-4xl">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Inversión</p>
                                        <span className="text-5xl font-black tracking-tighter italic">{formatCurrency(subtotal)}</span>
                                    </div>
                                    <span className="text-[8px] font-black text-brand-red uppercase tracking-widest animate-pulse">Confirmar por WhatsApp</span>
                                </div>
                                <button onClick={() => window.open(`https://wa.me/593993083943?text=Hola,%20quiero%20cotizar%20estos%20servicios`)} className="w-full py-7 bg-brand-blue text-white font-black rounded-3xl shadow-xl uppercase tracking-[0.3em] text-xs hover:bg-white hover:text-brand-blue transition-all flex items-center justify-center gap-4 group">
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
