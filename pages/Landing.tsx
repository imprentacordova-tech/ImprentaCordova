
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
import { Producto, TrabajoEstado, TrabajoTipo, Regimen } from '../types';
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
    
    // MAESTRO: Cotizador Interactivo de Alta Conversión
    const [calcQty, setCalcQty] = useState(1);
    const [calcType, setCalcType] = useState<'Factura' | 'Nota'>('Factura');
    const [calcPrice, setCalcPrice] = useState(15);

    // MAESTRO: AI Quality Scanner
    const [isQualityLoading, setIsQualityLoading] = useState(false);
    const [qualityResult, setQualityResult] = useState<any>(null);
    const qualityInputRef = useRef<HTMLInputElement>(null);

    // INYECCIÓN DE DATOS ESTRUCTURADOS (JSON-LD) PARA GOOGLE
    useEffect(() => {
        const schema = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Imprenta Córdova Pasaje",
            "image": "https://i.imgur.com/kzhXFkE.png",
            "@id": "https://imprentacordova.com",
            "url": "https://imprentacordova.com",
            "telephone": "+593993083943",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Calle Colón entre Sucre y Rocafuerte",
                "addressLocality": "Pasaje",
                "addressRegion": "El Oro",
                "postalCode": "071150",
                "addressCountry": "EC"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": -3.328135,
                "longitude": -79.809622
            },
            "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "opens": "08:00",
                "closes": "19:00"
            },
            "sameAs": [
                "https://www.facebook.com/imprentacordovapasaje",
                "https://www.instagram.com/imprentacordova"
            ]
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        document.head.appendChild(script);

        getProductos().then(data => {
            setProductos(data);
            setLoading(false);
        });

        return () => { document.head.removeChild(script); };
    }, []);

    // Lógica de cálculo interactivo optimizada
    useEffect(() => {
        let base = calcType === 'Factura' ? 15 : 10;
        if (calcQty >= 5) base = base * 0.85 * calcQty;
        else if (calcQty >= 2) base = base * 0.92 * calcQty;
        else base = base * calcQty;
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

    const subtotal = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth selection:bg-brand-red selection:text-white">
            {/* Nav Maestro con Glassmorphism */}
            <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-[100] bg-white/70 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] py-4 px-8 shadow-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <CordovaLogo className="h-10 w-auto" alt="Imprenta Córdova Pasaje" />
                    <div className="hidden sm:flex flex-col leading-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pasaje • El Oro</span>
                        <span className="text-xl font-black text-brand-blue uppercase tracking-tighter">Córdova</span>
                    </div>
                </div>
                
                <div className="hidden md:flex gap-10 items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <a href="#servicios" className="hover:text-brand-blue transition-colors">Servicios</a>
                    <a href="#maestro" className="text-brand-red animate-pulse">Escaner IA</a>
                    <a href="#catalog" className="hover:text-brand-blue transition-colors">Catálogo</a>
                    <a href="#ayuda" className="hover:text-brand-blue transition-colors">Ayuda SRI</a>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-white/50 rounded-2xl hover:bg-brand-blue hover:text-white transition-all shadow-sm">
                        <ShoppingCartIcon className="w-5 h-5" />
                        {cartItems.length > 0 && <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartItems.length}</span>}
                    </button>
                    <Link to="/login" className="hidden sm:block text-slate-400 hover:text-brand-blue transition-colors">
                        <UsersIcon className="w-6 h-6"/>
                    </Link>
                </div>
            </nav>

            {/* Hero Section: Dominio 'Imprenta Pasaje' */}
            <section className="pt-48 pb-24 relative overflow-hidden bg-slate-50">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/5 rounded-full blur-[140px] -mr-64 -mt-64"></div>
                <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-7 space-y-10 animate-fade-in">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-100 rounded-full text-brand-blue shadow-inner">
                            <SparklesIcon className="w-4 h-4 animate-spin-slow" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">La Imprenta #1 en Pasaje El Oro</span>
                        </div>
                        
                        <h1 className="text-6xl lg:text-9xl font-black text-slate-900 leading-[0.85] tracking-tighter uppercase italic">
                            Imprenta <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-600">Autorizada</span>
                        </h1>

                        <p className="text-2xl text-slate-500 font-light max-w-2xl leading-relaxed">
                            Especialistas en <b>Pasaje</b> para talonarios SRI, publicidad en gran formato Roland y diseño de marcas imbatibles. ¡Entrega Express!
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5">
                            <a href="https://wa.me/593993083943" className="px-12 py-6 bg-brand-red text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-3xl hover:bg-slate-950 transition-all transform hover:scale-105 flex items-center justify-center gap-3">
                                <WhatsAppIcon className="w-6 h-6"/> Cotizar por WhatsApp
                            </a>
                            <button onClick={() => qualityInputRef.current?.click()} className="px-12 py-6 bg-white border-2 border-slate-100 text-brand-blue rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-xl">
                                <CameraIcon className="w-5 h-5"/> Validar mi Logo
                            </button>
                            <input type="file" ref={qualityInputRef} className="hidden" accept="image/*" onChange={handleQualityScan} />
                        </div>
                    </div>

                    <div className="lg:col-span-5 relative group" id="maestro">
                         {isQualityLoading ? (
                            <div className="bg-slate-900 rounded-[3.5rem] p-20 text-center text-white shadow-4xl animate-pulse">
                                <Loader2Icon className="w-16 h-16 animate-spin mx-auto mb-6 text-brand-blue" />
                                <h3 className="text-xl font-black uppercase tracking-widest text-brand-blue">IA ANALIZANDO...</h3>
                                <p className="text-xs text-slate-400 mt-2">Verificando resolución técnica</p>
                            </div>
                        ) : qualityResult ? (
                            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 shadow-4xl border-4 border-brand-blue animate-bounce-in relative">
                                <button onClick={() => setQualityResult(null)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900"><CloseIcon className="w-6 h-6"/></button>
                                <div className="flex items-center gap-3 mb-6">
                                    <SparklesIcon className="w-6 h-6 text-brand-blue animate-pulse"/>
                                    <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Resultado Córdova Vision AI</span>
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">{qualityResult.veredicto}</h3>
                                <div className="space-y-4 text-sm text-slate-600 mb-8">
                                    <p><b>Calidad:</b> {qualityResult.calidad}</p>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-blue" style={{ width: `${qualityResult.porcentaje_exito}%` }}></div>
                                    </div>
                                    <ul className="space-y-2">
                                        {qualityResult.advertencias.map((adv: string, i: number) => (
                                            <li key={i} className="flex gap-2 text-xs font-bold text-slate-500"><CheckCircleIcon className="w-4 h-4 text-brand-red shrink-0"/> {adv}</li>
                                        ))}
                                    </ul>
                                </div>
                                <a href="https://wa.me/593993083943" className="w-full py-4 bg-brand-red text-white font-black text-center rounded-2xl block uppercase tracking-widest text-[10px]">Hablar con un Experto</a>
                            </div>
                        ) : (
                            <div className="bg-slate-950 rounded-[4rem] p-12 text-white shadow-4xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><CordovaLogo className="w-40 h-40 brightness-0 invert"/></div>
                                <h3 className="text-3xl font-black mb-8 uppercase tracking-tighter italic text-brand-red">Garantía Córdova</h3>
                                <ul className="space-y-8">
                                    <li className="flex items-center gap-6 group">
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-red transition-all shadow-inner"><ShieldCheckIcon className="w-8 h-8"/></div>
                                        <div><p className="font-black text-lg uppercase">SRI 100% Legal</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Autorización Inmediata</p></div>
                                    </li>
                                    <li className="flex items-center gap-6 group">
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-blue transition-all shadow-inner"><PrinterIcon className="w-8 h-8"/></div>
                                        <div><p className="font-black text-lg uppercase">Resolución Roland</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Colores Vivos en Lona HD</p></div>
                                    </li>
                                    <li className="flex items-center gap-6 group">
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-all shadow-inner"><ClockIcon className="w-8 h-8"/></div>
                                        <div><p className="font-black text-lg uppercase">Soporte Local</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Calle Colón, Pasaje Centro</p></div>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* SECCIÓN SEO: COTIZADOR EN VIVO */}
            <section id="precios" className="py-32 bg-white relative">
                <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-24 items-center">
                    <div className="space-y-8">
                        <div>
                            <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-4 block italic">Precios Directos de Imprenta</span>
                            <h2 className="text-5xl font-black text-slate-950 uppercase tracking-tighter leading-[0.95] italic">Calcula tu <br/> <span className="text-brand-blue">Inversión</span></h2>
                        </div>
                        <p className="text-xl text-slate-500 font-medium leading-relaxed">Transparencia total. Sin costos ocultos para contribuyentes de <b>Pasaje, El Oro</b>.</p>
                        
                        <div className="space-y-10 pt-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Tipo de Documento</label> <span className="text-xs font-bold text-brand-blue uppercase tracking-widest">{calcType} Autorizado</span></div>
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 shadow-inner">
                                    <button onClick={() => setCalcType('Factura')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${calcType === 'Factura' ? 'bg-white shadow-xl text-brand-blue' : 'text-slate-400'}`}>Facturas (Rimpe)</button>
                                    <button onClick={() => setCalcType('Nota')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${calcType === 'Nota' ? 'bg-white shadow-xl text-brand-blue' : 'text-slate-400'}`}>Notas de Venta</button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">2. Cantidad de Talonarios</label> <span className="text-3xl font-black text-brand-blue tracking-tighter">{calcQty} Uds</span></div>
                                <input type="range" min="1" max="50" value={calcQty} onChange={e => setCalcQty(parseInt(e.target.value))} className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-blue" />
                                <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-widest"><span>1 Talonario</span> <span>25 Mayorista</span> <span>50+ Distribuidor</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[4rem] p-16 text-white shadow-[0_50px_100px_-20px_rgba(11,66,167,0.4)] relative overflow-hidden text-center group border border-white/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue opacity-10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-4">Inversión Neta Estimada</p>
                        <h3 className="text-9xl font-black tracking-tighter italic mb-4 transition-all group-hover:scale-110">{formatCurrency(calcPrice)}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] mb-12">Impuestos de ley no incluidos</p>
                        
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-12">
                            <div className="text-left">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">PVP Unitario</p>
                                <p className="text-2xl font-black">{formatCurrency(calcPrice / calcQty)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Entrega Pasaje</p>
                                <p className="text-2xl font-black text-brand-red italic">En 24 Horas</p>
                            </div>
                        </div>
                        <a href="https://wa.me/593993083943" className="mt-12 w-full py-6 bg-brand-blue rounded-3xl font-black text-xs uppercase tracking-[0.4em] hover:bg-white hover:text-brand-blue transition-all shadow-2xl block text-center">Confirmar Pedido Ahora</a>
                    </div>
                </div>
            </section>

            {/* SECCIÓN SEO: GUÍA MAESTRA (KNOWLEDGE BASE) */}
            <section id="ayuda" className="py-24 bg-slate-50 scroll-mt-24">
                <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-16 items-start">
                    
                    <div className="lg:col-span-5 space-y-8">
                        <div>
                            <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-4 block">Autoridad en Pasaje</span>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight italic">
                                Guía Maestra de <br/>
                                <span className="text-brand-blue">Imprenta y SRI</span>
                            </h2>
                        </div>
                        <p className="text-slate-500 leading-relaxed text-lg">
                            No solo imprimimos, asesoramos. En <b>Imprenta Córdova Pasaje</b> nos aseguramos de que tu negocio cumpla con todas las normativas del SRI.
                        </p>
                        
                        <div className="pt-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Lo que los clientes buscan en El Oro:</h3>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "imprentas en pasaje centro", "facturas rimpe pasaje", "gigantografias en el oro", 
                                    "requisitos notas de venta sri", "diseño grafico pasaje", "imprenta pedro cordova",
                                    "impresion de volantes baratas", "sellos automaticos pasaje"
                                ].map((tag, i) => (
                                    <span key={i} className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-wide hover:bg-brand-blue/5 hover:text-brand-blue transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-brand-blue rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <InfoIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase tracking-widest">¿Necesitas asesoría?</p>
                                    <p className="text-blue-100 text-[10px] opacity-80 uppercase font-bold mt-0.5">Visítanos en la Calle Colón</p>
                                </div>
                            </div>
                            <a href="https://wa.me/593993083943" className="px-8 py-3 bg-white text-brand-blue font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all relative z-10 shadow-lg">
                                WhatsApp Directo
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-7 bg-white rounded-[3rem] p-8 lg:p-12 border border-slate-100 shadow-sm">
                        <div className="divide-y divide-slate-100">
                            <FAQItem 
                                question="¿Qué documentos necesito para facturas SRI?"
                                answer="Solo requerimos tu número de RUC activo y tu clave del portal SRI. Si eres Negocio Popular (RIMPE), emitimos Notas de Venta simplificadas. Nosotros hacemos todo el trámite de autorización en el acto."
                            />
                            <FAQItem 
                                question="¿En cuánto tiempo entregan una gigantografía?"
                                answer="Si traes el diseño listo, la entrega es en 24 horas. Contamos con tecnología Roland HD que nos permite imprimir a alta velocidad sin perder la calidad de color que caracteriza a los negocios de Pasaje."
                            />
                            <FAQItem 
                                question="¿Hacen envíos a Machala o Santa Rosa?"
                                answer="Sí, aunque nuestra sede principal está en Pasaje, cubrimos toda la provincia de El Oro. Para pedidos mayores a $50 el envío es gratuito en zonas céntricas de ciudades vecinas."
                            />
                            <FAQItem 
                                question="¿Cuáles son sus horarios de atención?"
                                answer="Estamos abiertos de Lunes a Sábado, de 8:00 AM a 7:00 PM. Ubícanos en la Calle Colón entre Sucre y Rocafuerte, diagonal al parque principal."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Catalog Grid Premium */}
            <section id="catalog" className="py-32 bg-white scroll-mt-24">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
                        <div>
                            <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-4 block italic">Soluciones para tu Marca</span>
                            <h2 className="text-5xl font-black text-slate-950 uppercase tracking-tighter italic leading-none">Nuestros <br/><span className="text-brand-blue">Productos Estrella</span></h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-slate-50 rounded-[3.5rem] h-[500px] animate-pulse"></div>
                        )) : productos.slice(0, 8).map(p => (
                            <article key={p.id} className="group bg-white rounded-[3.5rem] shadow-xl border border-slate-50 p-4 transition-all duration-500 hover:-translate-y-4 hover:shadow-4xl">
                                <div className="h-64 rounded-[2.5rem] overflow-hidden relative">
                                    {p.imagenUrl ? <img src={p.imagenUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={p.nombre}/> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><BoxIcon className="w-20 h-20"/></div>}
                                    <div className="absolute inset-0 bg-brand-blue/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                                        <p className="text-white text-xs font-bold leading-relaxed mb-6 uppercase tracking-wider italic">{p.descripcion}</p>
                                        <button onClick={() => handleAddToCart(p)} className="bg-white text-brand-blue px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-110 transition-all">Pedir Cotización</button>
                                    </div>
                                    {p.esSRI && <span className="absolute top-6 left-6 bg-brand-red text-white text-[8px] font-black px-3 py-1.5 rounded-xl shadow-2xl tracking-[0.2em]">DOCUMENTO SRI</span>}
                                </div>
                                <div className="p-8">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{p.categoria}</p>
                                    <h3 className="font-black text-slate-900 text-lg uppercase leading-tight mb-6 group-hover:text-brand-blue transition-colors truncate">{p.nombre}</h3>
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
            <footer className="bg-slate-950 text-white py-32 relative overflow-hidden border-t border-white/5">
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-red opacity-5 rounded-full blur-[120px] -mb-64 -mr-64"></div>
                <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-20 relative z-10">
                    <div className="lg:col-span-5 space-y-10">
                        <div className="flex items-center gap-4">
                            <CordovaLogo className="h-16 w-auto brightness-0 invert" />
                            <div className="flex flex-col leading-none">
                                <span className="text-2xl font-black tracking-tighter uppercase italic text-brand-red">CÓRDOVA</span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">Imprenta & Publicidad Pasaje</span>
                            </div>
                        </div>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-sm italic">"Donde la calidad técnica se encuentra con la precisión digital. Sirviendo a Pasaje y El Oro desde hace más de 15 años."</p>
                        <div className="flex gap-4">
                            {[
                                { icon: MessageCircleIcon, label: "WhatsApp" },
                                { icon: PaletteIcon, label: "Instagram" },
                                { icon: UsersIcon, label: "Facebook" }
                            ].map((social, i) => (
                                <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-brand-blue transition-all border border-white/5 shadow-2xl group" title={social.label}>
                                    <social.icon className="w-5 h-5 group-hover:scale-110 transition-transform"/>
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-12">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Ubicación Pasaje</h4>
                            <p className="text-sm font-bold flex items-start gap-4 leading-relaxed"><MapPinIcon className="w-6 h-6 text-brand-red shrink-0"/> Calle Colón entre <br/> Sucre y Rocafuerte.<br/>Pasaje, El Oro - EC</p>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Contacto</h4>
                            <p className="text-sm font-bold flex items-center gap-4"><PhoneIcon className="w-6 h-6 text-brand-blue shrink-0"/> 099 308 3943</p>
                            <p className="text-sm font-bold flex items-center gap-4 text-xs truncate"><EnvelopeIcon className="w-6 h-6 text-emerald-500 shrink-0"/> imprentacordova@gmail.com</p>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-4">Horarios</h4>
                            <p className="text-sm font-bold flex items-center gap-4"><ClockIcon className="w-6 h-6 text-orange-500 shrink-0"/> Lun - Sáb <br/> 08:00 AM - 07:00 PM</p>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-6 pt-24 border-t border-white/5 mt-24 text-center">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">Imprenta Córdova &copy; 2025 • Pasaje, Ecuador • SEO Optimizado</p>
                </div>
            </footer>

            {/* Carrito Maestro */}
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
