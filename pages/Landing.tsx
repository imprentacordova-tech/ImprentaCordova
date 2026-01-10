
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, CheckCircleIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, PrinterIcon, CheckBadgeIcon, ClockIcon,
    SearchIcon, SparklesIcon, MonitorIcon, MessageCircleIcon, ChevronRightIcon,
    Loader2Icon, WalletIcon, ExclamationTriangleIcon, LayersIcon, WhatsAppIcon,
    PaletteIcon, ReceiptIcon, InfoIcon, FileTextIcon, HeartIcon, CameraIcon, UploadIcon
} from '../components/Icons';
import { getProductos, createPublicPedido, getTrabajos } from '../services/mockApi';
import { analyzeImageQualityForPrint } from '../services/geminiService';
import { Producto, TrabajoEstado, TrabajoTipo } from '../types';
import { formatCurrency } from '../utils';

// --- COMPONENTE DE ACORDEÓN SEO ---
const FAQItem: React.FC<{ question: string, answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <article className="border-b border-slate-100 dark:border-white/5 last:border-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full py-6 flex justify-between items-center text-left group" aria-expanded={isOpen}>
                <h4 className={`text-lg font-bold transition-colors ${isOpen ? 'text-brand-blue' : 'text-slate-700 dark:text-slate-300'}`}>{question}</h4>
                <div className={`p-2 rounded-full transition-all ${isOpen ? 'bg-brand-blue text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}><ChevronRightIcon className="w-5 h-5 transform rotate-90" /></div>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-8' : 'max-h-0'}`}><p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base">{answer}</p></div>
        </article>
    );
};

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    
    // MAESTRO: Cotizador Interactivo
    const [calcQty, setCalcQty] = useState(1);
    const [calcType, setCalcType] = useState<'Factura' | 'Nota'>('Factura');
    const [calcPrice, setCalcPrice] = useState(15);

    // MAESTRO: AI Quality Scanner
    const [isQualityLoading, setIsQualityLoading] = useState(false);
    const [qualityResult, setQualityResult] = useState<any>(null);
    const qualityInputRef = useRef<HTMLInputElement>(null);

    // Quick Tracking
    const [trackOrder, setTrackOrder] = useState('');
    const [trackingResult, setTrackingResult] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        getProductos().then(data => {
            setProductos(data);
            setLoading(false);
        });
    }, []);

    // Lógica de cálculo interactivo de precios (Simulada para preventa)
    useEffect(() => {
        let base = calcType === 'Factura' ? 15 : 10;
        if (calcQty >= 2) base = base * 0.9 * calcQty; // 10% desc por cantidad
        setCalcPrice(base);
    }, [calcQty, calcType]);

    const handleAddToCart = (p: Producto) => {
        setCartItems(prev => {
            const exists = prev.find(item => item.producto.id === p.id);
            if (exists) return prev.map(item => item.producto.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            return [...prev, { producto: p, cantidad: 1 }];
        });
        setIsCartOpen(true);
    };

    const handleQualityScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsQualityLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            const result = await analyzeImageQualityForPrint(base64);
            setQualityResult(result);
            setIsQualityLoading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleQuickTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackOrder) return;
        setIsTracking(true);
        const trabajos = await getTrabajos();
        const found = trabajos.find(t => String(t.orden) === trackOrder);
        setTimeout(() => {
            setTrackingResult(found || "NOT_FOUND");
            setIsTracking(false);
        }, 800);
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth selection:bg-brand-red selection:text-white">
            {/* Nav con Glassmorphism */}
            <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-[100] bg-white/70 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] py-4 px-8 shadow-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <CordovaLogo className="h-10 w-auto" alt="Logo Córdova" />
                    <span className="hidden sm:block text-xl font-black text-brand-blue uppercase tracking-tighter">Córdova</span>
                </div>
                <div className="hidden md:flex gap-10 items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <a href="#maestro" className="text-brand-red animate-pulse">Escaner IA</a>
                    <a href="#precios" className="hover:text-brand-blue transition-colors">Cotizador</a>
                    <a href="#catalog" className="hover:text-brand-blue transition-colors">Productos</a>
                    <a href="#tracking" className="bg-brand-blue text-white px-5 py-2 rounded-full hover:bg-slate-950 transition-all shadow-xl">Rastreo</a>
                </div>
                <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-white/50 rounded-2xl hover:bg-brand-blue hover:text-white transition-all shadow-sm">
                    <ShoppingCartIcon className="w-5 h-5" />
                    {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartItems.length}</span>}
                </button>
            </nav>

            {/* Hero Premium */}
            <section className="pt-48 pb-24 relative overflow-hidden bg-slate-50">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-20 items-center relative z-10">
                    <div className="lg:col-span-7 space-y-10">
                        <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-100 rounded-full text-brand-blue shadow-inner">
                            <SparklesIcon className="w-4 h-4 animate-spin-slow" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tecnología Roland HD 2025</span>
                        </div>
                        <h1 className="text-7xl lg:text-9xl font-black text-slate-950 leading-[0.85] tracking-tighter uppercase italic">
                            Imprenta <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red via-orange-500 to-yellow-500">Imbatible</span>
                        </h1>
                        <p className="text-2xl text-slate-500 font-light max-w-xl leading-relaxed">
                            En Pasaje, somos la única imprenta que combina <b>Inteligencia Artificial</b> con la robustez de la impresión offset autorizada por el <b>SRI</b>.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5">
                            <a href="#precios" className="px-12 py-6 bg-brand-blue text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-3xl hover:bg-slate-950 transition-all transform hover:scale-105 flex items-center justify-center gap-3">
                                Cotizar en Vivo <ArrowRightIcon className="w-5 h-5"/>
                            </a>
                            <button onClick={() => qualityInputRef.current?.click()} className="px-12 py-6 bg-white border-2 border-slate-100 text-brand-red rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-xl">
                                <UploadIcon className="w-5 h-5"/> Validar Mi Logo
                            </button>
                        </div>
                    </div>

                    {/* MAESTRO FEATURE: AI QUALITY SCANNER UI */}
                    <div className="lg:col-span-5 relative group" id="maestro">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-brand-blue to-purple-500 rounded-[4rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-10 rounded-[3.5rem] shadow-4xl overflow-hidden">
                            {isQualityLoading ? (
                                <div className="py-20 text-center space-y-6">
                                    <div className="relative w-24 h-24 mx-auto">
                                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-brand-blue rounded-full border-t-transparent animate-spin"></div>
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-widest text-brand-blue">Analizando Arte...</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Verificando Resolución y Gama CMYK</p>
                                </div>
                            ) : qualityResult ? (
                                <div className="animate-fade-in space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-brand-blue p-4 rounded-2xl text-white shadow-xl"><ShieldCheckIcon className="w-8 h-8"/></div>
                                        <button onClick={() => setQualityResult(null)} className="p-2 text-slate-300 hover:text-slate-900"><CloseIcon className="w-6 h-6"/></button>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Veredicto IA Córdova</span>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter">{qualityResult.veredicto}</h3>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-blue transition-all duration-1000" style={{ width: `${qualityResult.porcentaje_exito}%` }}></div>
                                        </div>
                                    </div>
                                    <ul className="space-y-4">
                                        {qualityResult.advertencias.map((adv: string, i: number) => (
                                            <li key={i} className="flex gap-3 text-sm text-slate-600 font-medium">
                                                <div className="w-1.5 h-1.5 bg-brand-red rounded-full mt-1.5 shrink-0"></div>
                                                {adv}
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => window.open('https://wa.me/593993083943')} className="w-full py-4 bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-brand-blue transition-all">Enviar a un diseñador</button>
                                </div>
                            ) : (
                                <div className="text-center space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter italic text-brand-red">¿Tu logo sirve?</h3>
                                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Sube tu logo y la IA te dirá si se verá borroso o nítido en tu gigantografía.</p>
                                    </div>
                                    <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 group-hover:border-brand-blue transition-all cursor-pointer" onClick={() => qualityInputRef.current?.click()}>
                                        <UploadIcon className="w-16 h-16 mx-auto text-slate-300 group-hover:text-brand-blue transition-all" />
                                        <p className="mt-4 font-black text-[10px] uppercase text-slate-400 group-hover:text-slate-600">Click para subir diseño</p>
                                    </div>
                                    <input type="file" ref={qualityInputRef} className="hidden" accept="image/*" onChange={handleQualityScan} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* MAESTRO FEATURE: COTIZADOR INTERACTIVO */}
            <section id="precios" className="py-32 bg-white relative">
                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
                    <div className="space-y-8">
                        <div>
                            <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-4 block italic">Precios Directos 2025</span>
                            <h2 className="text-5xl font-black text-slate-950 uppercase tracking-tighter leading-[0.95] italic">Calcula tu <br/> <span className="text-brand-blue">Inversión SRI</span></h2>
                        </div>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed">Ajusta la cantidad y el tipo de documento para obtener un presupuesto exacto en segundos.</p>
                        
                        <div className="space-y-10 pt-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-slate-400">Tipo de Documento</label> <span className="text-xs font-bold text-brand-blue">{calcType} Autorizado</span></div>
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 shadow-inner">
                                    <button onClick={() => setCalcType('Factura')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${calcType === 'Factura' ? 'bg-white shadow-xl text-brand-blue' : 'text-slate-400'}`}>Facturas (RIMPE)</button>
                                    <button onClick={() => setCalcType('Nota')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${calcType === 'Nota' ? 'bg-white shadow-xl text-brand-blue' : 'text-slate-400'}`}>Notas de Venta</button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-slate-400">Cantidad de Talonarios</label> <span className="text-2xl font-black text-brand-blue tracking-tighter">{calcQty} Units</span></div>
                                <input type="range" min="1" max="50" value={calcQty} onChange={e => setCalcQty(parseInt(e.target.value))} className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-blue" />
                                <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest"><span>1 Talonario</span> <span>25 Talonarios</span> <span>50+ Mayorista</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-950 rounded-[4rem] p-16 text-white shadow-[0_50px_100px_-20px_rgba(11,66,167,0.4)] relative overflow-hidden text-center group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue opacity-10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4">Total Neto Estimado</p>
                        <h3 className="text-8xl font-black tracking-tighter italic mb-4 transition-all group-hover:scale-110">{formatCurrency(calcPrice)}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mb-12">+ IVA e Impresión Autorizada</p>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-12">
                            <div className="text-left">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Precio Unitario</p>
                                <p className="text-xl font-black">{formatCurrency(calcPrice / calcQty)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Tiempo Entrega</p>
                                <p className="text-xl font-black text-brand-red italic">24h - 48h</p>
                            </div>
                        </div>
                        <button onClick={() => window.open('https://wa.me/593993083943')} className="mt-12 w-full py-6 bg-brand-blue rounded-3xl font-black text-xs uppercase tracking-[0.4em] hover:bg-white hover:text-brand-blue transition-all shadow-2xl">Confirmar Pedido</button>
                    </div>
                </div>
            </section>

            {/* Catálogo Maestro */}
            <section id="catalog" className="py-32 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div>
                            <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-4 block italic">Lo más vendido en Pasaje</span>
                            <h2 className="text-5xl font-black text-slate-950 uppercase tracking-tighter italic leading-none">Explora el <br/><span className="text-brand-blue">Taller Virtual</span></h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-[3.5rem] h-[500px] animate-pulse"></div>
                        )) : productos.slice(0, 8).map(p => (
                            <article key={p.id} className="group bg-white rounded-[3.5rem] shadow-xl border border-white p-4 transition-all duration-500 hover:-translate-y-4 hover:shadow-4xl">
                                <div className="h-64 rounded-[2.5rem] overflow-hidden relative">
                                    {p.imagenUrl ? <img src={p.imagenUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={p.nombre}/> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><BoxIcon className="w-20 h-20"/></div>}
                                    <div className="absolute inset-0 bg-brand-blue/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                                        <p className="text-white text-xs font-bold leading-relaxed mb-6 uppercase tracking-wider italic">{p.descripcion}</p>
                                        <button onClick={() => handleAddToCart(p)} className="bg-white text-brand-blue px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-110 transition-all">Cotizar YA</button>
                                    </div>
                                    {p.esSRI && <span className="absolute top-6 left-6 bg-brand-red text-white text-[8px] font-black px-3 py-1.5 rounded-xl shadow-2xl tracking-[0.2em]">SRI AUTORIZADO</span>}
                                </div>
                                <div className="p-8">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{p.categoria}</p>
                                    <h3 className="font-black text-slate-900 text-lg uppercase leading-tight mb-6 group-hover:text-brand-blue transition-colors">{p.nombre}</h3>
                                    <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                                        <span className="text-3xl font-black text-slate-950 tracking-tighter">{formatCurrency(p.precio)}</span>
                                        <button onClick={() => handleAddToCart(p)} className="w-14 h-14 bg-slate-950 text-white rounded-2xl hover:bg-brand-red transition-all flex items-center justify-center shadow-2xl"><AddIcon className="w-6 h-6"/></button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer Maestro */}
            <footer className="bg-slate-950 text-white py-32 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-red opacity-5 rounded-full blur-[120px] -mb-64 -mr-64"></div>
                <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-20 relative z-10">
                    <div className="lg:col-span-5 space-y-10">
                        <div className="flex items-center gap-4">
                            <CordovaLogo className="h-16 w-auto brightness-0 invert" />
                            <div className="flex flex-col leading-none">
                                <span className="text-2xl font-black tracking-tighter uppercase italic text-brand-red">CÓRDOVA</span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">Imprenta & Publicidad</span>
                            </div>
                        </div>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-sm italic">"Donde la calidad técnica se encuentra con la precisión digital. Sirviendo a Pasaje desde 2008."</p>
                        <div className="flex gap-4">
                            <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-brand-blue transition-all border border-white/5 shadow-2xl"><MessageCircleIcon className="w-5 h-5"/></a>
                            <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-brand-blue transition-all border border-white/5 shadow-2xl"><PaletteIcon className="w-5 h-5"/></a>
                            <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-brand-blue transition-all border border-white/5 shadow-2xl"><UsersIcon className="w-5 h-5"/></a>
                        </div>
                    </div>
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-12">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Sede Central</h4>
                            <p className="text-sm font-bold flex items-start gap-4 leading-relaxed"><MapPinIcon className="w-6 h-6 text-brand-red shrink-0"/> Calle Colón e/ Sucre y Rocafuerte.<br/>Pasaje, El Oro - EC</p>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Conectividad</h4>
                            <p className="text-sm font-bold flex items-center gap-4"><PhoneIcon className="w-6 h-6 text-brand-blue shrink-0"/> 099 308 3943</p>
                            <p className="text-sm font-bold flex items-center gap-4"><EnvelopeIcon className="w-6 h-6 text-emerald-500 shrink-0"/> imprentacordova@gmail.com</p>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Atención Maestra</h4>
                            <p className="text-sm font-bold flex items-center gap-4"><ClockIcon className="w-6 h-6 text-orange-500 shrink-0"/> Lun - Sáb <br/> 08:00 AM - 07:00 PM</p>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-6 pt-24 border-t border-white/5 mt-24 text-center">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">Vision V2 Engine • Pedro Córdova • 2025</p>
                </div>
            </footer>

            {/* Carrito Modal Premium */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex justify-end p-4 animate-fade-in" onClick={() => setIsCartOpen(false)}>
                    <div className="bg-white h-full w-full max-w-md rounded-[3.5rem] shadow-4xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-2xl font-black text-brand-blue uppercase tracking-tighter italic">Resumen Pedido</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-4 hover:bg-white rounded-2xl shadow-xl transition-all"><CloseIcon className="w-6 h-6 text-slate-400"/></button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-12 space-y-10 custom-scrollbar">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-32 opacity-20"><BoxIcon className="w-24 h-24 mx-auto mb-8"/><p className="font-black uppercase tracking-widest text-xs">Tu bolsa está vacía</p></div>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.producto.id} className="flex justify-between items-center group">
                                        <div className="min-w-0 flex-grow pr-8">
                                            <p className="font-black text-xs uppercase text-slate-950 group-hover:text-brand-blue transition-colors truncate">{item.producto.nombre}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">{item.cantidad} x {formatCurrency(item.producto.precio)}</p>
                                        </div>
                                        <button onClick={() => setCartItems(cartItems.filter(i => i.producto.id !== item.producto.id))} className="w-12 h-12 rounded-2xl bg-red-50 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-inner"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                ))
                            )}
                        </div>
                        {cartItems.length > 0 && (
                            <div className="p-12 bg-slate-950 text-white space-y-10 rounded-t-[4rem] shadow-4xl">
                                <div className="flex justify-between items-end">
                                    <div><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Inversión Final</p><span className="text-5xl font-black tracking-tighter italic">{formatCurrency(cartItems.reduce((acc, i) => acc + (i.producto.precio * i.cantidad), 0))}</span></div>
                                    <span className="text-[8px] font-black text-brand-red uppercase tracking-widest animate-pulse">Precios Directos</span>
                                </div>
                                <button onClick={() => window.open('https://wa.me/593993083943')} className="w-full py-7 bg-brand-blue text-white font-black rounded-3xl shadow-xl uppercase tracking-[0.3em] text-xs hover:bg-white hover:text-brand-blue transition-all flex items-center justify-center gap-4">Finalizar en WhatsApp <WhatsAppIcon className="w-6 h-6"/></button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
