
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheckIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    CordovaLogo, StarIcon, CheckBadgeIcon, ClockIcon, 
    SparklesIcon, PrinterIcon, MessageCircleIcon, SendIcon, GlobeAltIcon, 
    FileTextIcon, BuildingStorefrontIcon, SearchIcon, MonitorIcon, CheckCircleIcon,
    CalculatorIcon, UsersIcon, EnvelopeIcon, InfoIcon, PaletteIcon, DocumentTextIcon, ReceiptIcon
} from '../components/Icons';
import { getProductos, createPublicPedido } from '../services/mockApi';
import { Producto, Regimen } from '../types';
import { formatCurrency } from '../utils';

const LOGO_URL = "https://i.imgur.com/kzhXFkE.png";

// Scroll Suave
const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        window.scrollTo({
            top: element.offsetTop - 80,
            behavior: 'smooth'
        });
    }
};

// --- COMPONENTES DE APOYO ---

const QuickQuote: React.FC = () => {
    const [size, setSize] = useState<'1/4' | '1/2' | 'oficio'>('1/4');
    const [qty, setQty] = useState<'50' | '100' | '200'>('50');

    const price = useMemo(() => {
        if (size === '1/4') {
            if (qty === '50') return 10.00;
            if (qty === '100') return 13.00;
            if (qty === '200') return 20.00;
        }
        if (size === '1/2') {
            if (qty === '50') return 15.00;
            if (qty === '100') return 22.00;
            if (qty === '200') return 28.00;
        }
        return 22.00; 
    }, [size, qty]);

    return (
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-brand-red/20 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="bg-brand-red p-2 rounded-xl shadow-lg shadow-brand-red/20"><CalculatorIcon className="w-5 h-5 text-white"/></div>
                <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Cotizador SRI Instantáneo</h3>
            </div>
            
            <div className="space-y-6 relative z-10">
                <div>
                    <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest block mb-3">1. Selecciona Tamaño</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['1/4', '1/2', 'oficio'] as const).map(s => (
                            <button key={s} onClick={() => setSize(s)} className={`py-2 text-[9px] font-black uppercase rounded-xl transition-all border ${size === s ? 'bg-white text-brand-blue border-white shadow-xl' : 'bg-white/5 text-blue-100/50 border-white/10 hover:bg-white/10'}`}>
                                {s} Oficio
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[9px] font-black text-blue-200 uppercase tracking-widest block mb-3">2. Cantidad de Juegos</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['50', '100', '200'] as const).map(q => (
                            <button key={q} onClick={() => setQty(q)} className={`py-2 text-[9px] font-black uppercase rounded-xl transition-all border ${qty === q ? 'bg-brand-red text-white border-brand-red shadow-xl' : 'bg-white/5 text-blue-100/50 border-white/10 hover:bg-white/10'}`}>
                                {q === '200' ? '2 Blocks' : q + ' Juegos'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10 mt-6 flex justify-between items-center">
                    <div>
                        <p className="text-[9px] font-black text-blue-300/50 uppercase tracking-widest">Inversión Estimada</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(price)}</p>
                    </div>
                    <a 
                        href={`https://wa.me/593993083943?text=Hola%20Imprenta%20C%C3%B3rdova%21%20Quisiera%20cotizar%20${qty}%20juegos%20en%20tama%C3%B1o%20${size}%20oficio.`}
                        target="_blank"
                        className="bg-white text-brand-blue px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all shadow-xl active:scale-95"
                    >
                        Pedir YA
                    </a>
                </div>
            </div>
        </div>
    );
};

// --- FAQ COMPONENT ---
const FAQSection: React.FC = () => {
    const faqs = [
        { q: "¿En qué formato debo enviar mi diseño?", a: "Para resultados óptimos, pedimos archivos en PDF, AI (Illustrator) o imágenes JPG/PNG en alta resolución (300 DPI). Si no tienes diseño, ¡nuestra IA y equipo te ayudan!" },
        { q: "¿Cuánto tiempo demora la entrega?", a: "Los documentos SRI urgentes pueden estar listos en 24h. Gigantografías y publicidad suelen tomar entre 48h a 72h dependiendo del volumen." },
        { q: "¿Hacen envíos fuera de Pasaje?", a: "Sí, realizamos envíos a Machala, El Guabo, Santa Rosa y toda la provincia del Oro mediante cooperativas de transporte." },
        { q: "¿Puedo imprimir solo un block de facturas?", a: "¡Claro! Atendemos desde un block de 25 juegos hasta millares para grandes empresas." }
    ];

    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <section className="py-32 bg-slate-50 dark:bg-slate-900/30">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <span className="text-brand-red font-black tracking-[0.4em] uppercase text-[10px] mb-4 block">Centro de Ayuda</span>
                    <h2 className="text-4xl lg:text-5xl font-black text-brand-navy dark:text-white uppercase tracking-tighter italic">PREGUNTAS <span className="text-brand-red">FRECUENTES</span></h2>
                </div>
                <div className="space-y-4">
                    {faqs.map((faq, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-white/5 overflow-hidden transition-all shadow-sm">
                            <button 
                                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                                className="w-full flex items-center justify-between p-6 text-left"
                            >
                                <span className="font-bold text-slate-800 dark:text-white uppercase tracking-tight text-sm">{faq.q}</span>
                                <div className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-transform ${openIdx === i ? 'rotate-180' : ''}`}>
                                    <ArrowRightIcon className="w-4 h-4 text-slate-500 transform rotate-90" />
                                </div>
                            </button>
                            {openIdx === i && (
                                <div className="p-6 pt-0 text-slate-500 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-50 dark:border-white/5 animate-fade-in">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// --- SECCIONES PRINCIPALES ---

const Header: React.FC<{ cartCount: number, onOpenCart: () => void }> = ({ cartCount, onOpenCart }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl py-2' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-4 group">
                    <img src={LOGO_URL} alt="Imprenta Córdova" className={`h-12 w-auto object-contain transition-all duration-300 ${scrolled ? 'brightness-100' : 'brightness-0 invert'}`} />
                    <div className="flex flex-col leading-none">
                        <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${scrolled ? 'text-brand-blue' : 'text-blue-100'}`}>Imprenta</span>
                        <span className={`text-2xl font-black tracking-tighter uppercase ${scrolled ? 'text-slate-900 dark:text-white' : 'text-white'}`}>CÓRDOVA</span>
                    </div>
                </Link>
                
                <div className="flex items-center gap-8">
                    <nav className={`hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                        <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')} className="hover:text-brand-red transition-all cursor-pointer">Servicios</a>
                        <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="hover:text-brand-red transition-all cursor-pointer">Catálogo</a>
                        <Link to="/tracking" className="hover:text-brand-red transition-all">Seguimiento</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <button onClick={onOpenCart} className="relative group p-2">
                            <ShoppingCartIcon className={`w-6 h-6 transition-all ${scrolled ? 'text-slate-700 group-hover:text-brand-red' : 'text-white group-hover:text-brand-red'}`} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <Link to="/login" className={`hidden sm:inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-md hover:shadow-xl transform hover:-translate-y-0.5 ${scrolled ? 'bg-brand-blue text-white' : 'bg-white text-brand-blue hover:bg-brand-red hover:text-white'}`}>
                            <UsersIcon className="w-4 h-4" /> Acceso
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

const HeroSection: React.FC = () => (
    <section className="relative min-h-screen bg-brand-navy flex items-center overflow-hidden pt-20">
        {/* Visual Engine */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/30 via-brand-navy to-black"></div>
            <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-brand-red/10 rounded-full blur-[140px] animate-blob"></div>
            <div className="absolute bottom-0 -left-1/4 w-[600px] h-[600px] bg-brand-blue/10 rounded-full blur-[140px] animate-blob animation-delay-2000"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-12 gap-16 items-center">
                
                {/* Left: Content */}
                <div className="lg:col-span-7 space-y-10 animate-fade-in-up">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                            <ShieldCheckIcon className="w-4 h-4 text-brand-red" />
                            <span className="text-[9px] font-black text-blue-100 tracking-[0.3em] uppercase">Imprenta Autorizada SRI</span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-red/10 border border-brand-red/20 backdrop-blur-xl">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                            <span className="text-[9px] font-black text-orange-200 tracking-[0.3em] uppercase">Servicio Express Pasaje</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <img src={LOGO_URL} alt="Logo Hero" className="h-32 w-auto mb-8 drop-shadow-2xl brightness-110 filter" />
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.85] tracking-tighter">
                            TU MARCA <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-400 drop-shadow-[0_0_30px_rgba(217,0,0,0.3)] italic">SIN LÍMITES.</span>
                        </h1>
                        <p className="text-xl lg:text-2xl text-blue-100/60 font-light max-w-xl leading-relaxed italic">
                            Desde gigantografías de alto impacto hasta facturación legal. <span className="text-white font-bold">Imprimimos tu éxito hoy mismo.</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-5 pt-4">
                        <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="group px-10 py-5 bg-brand-red text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-brand-red/40 hover:bg-white hover:text-brand-red transition-all transform hover:-translate-y-1 flex items-center gap-3">
                            Ver Catálogo <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                        </a>
                        <Link to="/tracking" className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all backdrop-blur-md flex items-center gap-3 group">
                            <ClockIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Rastrear Pedido
                        </Link>
                    </div>
                </div>

                {/* Right: QuickQuote & Visuals */}
                <div className="lg:col-span-5 relative">
                    <QuickQuote />
                    
                    {/* Floating Info Box */}
                    <div className="absolute -bottom-10 -right-10 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-3xl border-4 border-brand-blue hidden xl:block animate-float">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-500 p-3 rounded-2xl shadow-lg shadow-green-500/20"><CheckCircleIcon className="w-6 h-6 text-white"/></div>
                            <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">ENTREGA 24H</p>
                                <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mt-1">Garantía Córdova</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const TrustCarrusel: React.FC = () => {
    const clients = ["COOP. PASAJE", "FARMACIAS MIA", "MUNICIPIO PASAJE", "COLEGIO OCHOA", "CLÍNICA ORO"];
    return (
        <div className="bg-white dark:bg-slate-950 py-10 border-b dark:border-white/5 overflow-hidden">
            <div className="container mx-auto px-6">
                <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 italic">Aliados Estratégicos que Confían en Nosotros</p>
                <div className="flex justify-around items-center gap-12 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                    {clients.map(c => (
                        <span key={c} className="text-xl font-black text-slate-400 tracking-tighter uppercase whitespace-nowrap">{c}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ServicesSection: React.FC = () => {
    const services = [
        { title: "Gigantografías HD", desc: "Lonas y Vinilos en alta resolución con tecnología Roland.", icon: <MonitorIcon className="w-8 h-8 text-blue-600"/>, bg: "bg-blue-50" },
        { title: "Imprenta SRI", desc: "Facturas, Notas de Venta y Retenciones autorizadas.", icon: <ShieldCheckIcon className="w-8 h-8 text-red-600"/>, bg: "bg-red-50" },
        { title: "Publicidad", desc: "Volantes, Trípticos y Afiches full color para tu marca.", icon: <FileTextIcon className="w-8 h-8 text-yellow-600"/>, bg: "bg-yellow-50" },
        { title: "Sublimación", desc: "Tazas, Gorras y Camisetas personalizadas al instante.", icon: <BoxIcon className="w-8 h-8 text-purple-600"/>, bg: "bg-purple-50" },
        { title: "Imprenta Offset", desc: "Grandes volúmenes con la mejor calidad y bajo costo.", icon: <PrinterIcon className="w-8 h-8 text-green-600"/>, bg: "bg-green-50" },
        { title: "Acabados", desc: "Troquelados, Laminados, UV y Empastados profesionales.", icon: <StarIcon className="w-8 h-8 text-orange-600"/>, bg: "bg-orange-50" },
    ];

    return (
        <section id="servicios" className="py-32 bg-white dark:bg-slate-950 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col items-center text-center mb-24">
                    <span className="text-brand-red font-black tracking-[0.4em] uppercase text-[10px] mb-4">Lo que hacemos mejor</span>
                    <h2 className="text-5xl lg:text-6xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none mb-6 italic">SOLUCIONES <span className="text-brand-red">INTEGRALES</span></h2>
                    <div className="h-1.5 w-24 bg-brand-red rounded-full mb-8"></div>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">Combinamos maestría artesanal con la tecnología de impresión más avanzada para destacar tu marca en el mercado.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {services.map((s, i) => (
                        <div key={i} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-10 rounded-[3rem] shadow-xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-bl-[100%] transition-all group-hover:scale-110"></div>
                            <div className={`${s.bg} dark:bg-slate-800 w-20 h-20 rounded-[1.8rem] flex items-center justify-center mb-10 transform group-hover:rotate-12 transition-all shadow-lg`}>
                                {s.icon}
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-brand-blue transition-colors uppercase tracking-tight">{s.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CatalogPreview: React.FC<{ onAddToCart: (p: Producto) => void }> = ({ onAddToCart }) => {
    const [productos, setProductos] = useState<Producto[]>([]);

    useEffect(() => {
        getProductos().then(data => setProductos(data.slice(0, 8))); 
    }, []);

    return (
        <section id="catalog" className="py-32 bg-slate-50 dark:bg-slate-900/50 relative">
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
                    <div className="space-y-4">
                        <span className="text-brand-red font-black tracking-[0.4em] uppercase text-[10px]">Showroom Digital</span>
                        <h2 className="text-5xl lg:text-6xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none italic">CATÁLOGO <span className="text-brand-red">ONLINE</span></h2>
                    </div>
                    <div className="flex items-center gap-6 bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl">
                        <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-2xl"><SparklesIcon className="w-6 h-6 animate-pulse"/></div>
                        <div>
                            <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest leading-none mb-1">Precios Actualizados</p>
                            <p className="text-xs text-slate-400 italic">"Garantía de precio justo en Pasaje"</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {productos.map((p) => (
                        <div key={p.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-xl border border-slate-50 dark:border-white/5 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 group flex flex-col h-full">
                            <div className="relative aspect-square rounded-[1.8rem] overflow-hidden bg-slate-100 dark:bg-slate-950 mb-8">
                                {p.imagenUrl ? (
                                    <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <BoxIcon className="w-20 h-20 opacity-20" />
                                    </div>
                                )}
                                {p.esSRI && (
                                    <span className="absolute top-4 left-4 bg-brand-navy/90 backdrop-blur-md text-white text-[8px] font-black px-3 py-1.5 rounded-lg shadow-sm tracking-[0.2em] uppercase">SRI Autorizado</span>
                                )}
                                <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                    <button onClick={() => onAddToCart(p)} className="bg-white text-brand-red font-black text-[10px] px-8 py-3 rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 hover:scale-110 shadow-2xl flex items-center gap-2 uppercase tracking-widest">
                                        <AddIcon className="w-5 h-5"/> Agregar
                                    </button>
                                </div>
                            </div>
                            <div className="flex-grow space-y-3">
                                <div className="text-[9px] font-black text-brand-blue dark:text-blue-400 uppercase tracking-[0.3em] mb-1">{p.categoria}</div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase leading-tight tracking-tight line-clamp-2">{p.nombre}</h3>
                                <div className="pt-4 border-t border-slate-50 dark:border-white/5 flex justify-between items-center">
                                    <span className="text-3xl font-black text-brand-navy dark:text-blue-300 tracking-tighter">{formatCurrency(p.precio)}</span>
                                    <button onClick={() => onAddToCart(p)} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:bg-brand-red hover:text-white transition-all shadow-inner">
                                        <ShoppingCartIcon className="w-6 h-6"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-20 text-center">
                     <button className="px-16 py-6 bg-brand-blue text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-3xl shadow-2xl hover:bg-slate-900 transition-all transform hover:-translate-y-1">Ver Catálogo Completo</button>
                </div>
            </div>
        </section>
    );
};

const Footer: React.FC = () => (
    <footer className="bg-brand-navy text-white pt-32 pb-16 relative overflow-hidden border-t border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
        
        <div className="container mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
                <div className="lg:col-span-2 space-y-10">
                    <Link to="/" className="flex items-center gap-5">
                        <img src={LOGO_URL} alt="Logo Footer" className="h-16 w-auto brightness-0 invert filter" />
                        <span className="text-4xl font-black tracking-tighter uppercase">CÓRDOVA</span>
                    </Link>
                    <p className="text-blue-100/40 text-lg font-light leading-relaxed max-w-lg italic">
                        "Liderando la industria gráfica de Pasaje con tecnología de punta y el mejor servicio al cliente de la provincia."
                    </p>
                    <div className="flex gap-6">
                        {['Facebook', 'Instagram', 'WhatsApp'].map((s) => (
                            <a key={s} href="#" className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-brand-red hover:border-brand-red transition-all shadow-xl group">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-100/60 group-hover:text-white">{s}</span>
                            </a>
                        ))}
                    </div>
                </div>
                
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red mb-10">Navegación</h4>
                    <ul className="space-y-4 text-blue-100/60 text-sm font-bold uppercase tracking-widest">
                        <li><a href="#" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span> Inicio</a></li>
                        <li><a href="#servicios" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span> Servicios</a></li>
                        <li><a href="#catalog" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span> Catálogo</a></li>
                        <li><Link to="/tracking" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span> Rastrear Pedido</Link></li>
                        <li><Link to="/login" className="hover:text-white transition-colors flex items-center gap-3"><span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span> Intranet</Link></li>
                    </ul>
                </div>
                
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-red mb-10">Contactos</h4>
                    <ul className="space-y-8 text-blue-100/60">
                        <li className="flex items-start gap-5">
                            <MapPinIcon className="w-6 h-6 text-brand-red shrink-0 mt-1"/>
                            <div className="text-sm font-bold tracking-wide uppercase">
                                Calle Colón E/ Sucre y Rocafuerte.<br/>Pasaje, El Oro, Ecuador.
                            </div>
                        </li>
                        <li className="flex items-center gap-5">
                            <PhoneIcon className="w-6 h-6 text-brand-blue shrink-0"/>
                            <span className="text-xl font-black text-white">099 308 3943</span>
                        </li>
                        <li className="flex items-center gap-5">
                            <EnvelopeIcon className="w-6 h-6 text-green-500 shrink-0"/>
                            <span className="text-sm font-bold lowercase">imprentacordova@gmail.com</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.4em] text-blue-100/20">
                <p>&copy; 2025 IMPRENTA CÓRDOVA. TODOS LOS DERECHOS RESERVADOS.</p>
                <div className="mt-4 md:mt-0 flex items-center gap-6">
                    <span className="flex items-center gap-2"><GlobeAltIcon className="w-4 h-4"/> Pasaje, El Oro</span>
                    <span className="flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4"/> SRI Autorizado</span>
                </div>
            </div>
        </div>
    </footer>
);

// --- MODAL DE CARRITO ---

const CartModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    cartItems: { producto: Producto; cantidad: number }[];
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemoveItem: (id: string) => void;
    onCheckout: (clientData: any) => void;
}> = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }) => {
    const [clientData, setClientData] = useState({ nombre: '', telefono: '', email: '', ruc: '', direccion: '', regimen: 'General' });
    const [tipoDocumento, setTipoDocumento] = useState<'SRI' | 'Recibo'>('Recibo');
    const [step, setStep] = useState<'cart' | 'info' | 'success'>('cart');

    const total = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);

    useEffect(() => {
        if (isOpen) {
            setStep('cart');
            setClientData({ nombre: '', telefono: '', email: '', ruc: '', direccion: '', regimen: 'General' });
            setTipoDocumento('Recibo');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCheckout({ ...clientData, tipoDocumento });
        setStep('success');
    };

    return (
        <div className="fixed inset-0 bg-brand-navy/80 backdrop-blur-md z-[200] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-white/10" onClick={e => e.stopPropagation()}>
                {step === 'cart' && (
                    <>
                        <div className="p-10 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-brand-blue text-white">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                                    <ShoppingCartIcon className="w-8 h-8" /> Mi Pedido
                                </h2>
                                <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">Listo para cotización WhatsApp</p>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all"><CloseIcon className="w-8 h-8" /></button>
                        </div>
                        <div className="p-10 overflow-y-auto flex-grow space-y-6 custom-scrollbar bg-slate-50 dark:bg-slate-950/50">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-20 opacity-20">
                                    <BoxIcon className="w-24 h-24 mx-auto mb-6 text-brand-blue" />
                                    <p className="font-black uppercase text-xl">Sin Productos</p>
                                </div>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.producto.id} className="flex gap-6 p-6 rounded-[2.5rem] bg-white dark:bg-slate-800 shadow-xl border border-white dark:border-white/5 group hover:border-brand-red transition-all">
                                        <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-100 shrink-0 shadow-inner">
                                            {item.producto.imagenUrl && <img src={item.producto.imagenUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-grow flex flex-col justify-center">
                                            <h4 className="font-black text-sm text-brand-navy dark:text-white uppercase leading-tight">{item.producto.nombre}</h4>
                                            <p className="text-xs font-bold text-brand-red mt-1">{formatCurrency(item.producto.precio)} x {item.cantidad}</p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                                                <button onClick={() => onUpdateQuantity(item.producto.id, -1)} className="w-8 h-8 flex items-center justify-center font-black hover:bg-white rounded-lg transition-all">-</button>
                                                <span className="w-8 text-center font-black text-xs">{item.cantidad}</span>
                                                <button onClick={() => onUpdateQuantity(item.producto.id, 1)} className="w-8 h-8 flex items-center justify-center font-black hover:bg-white rounded-lg transition-all">+</button>
                                            </div>
                                            <button onClick={() => onRemoveItem(item.producto.id)} className="text-slate-300 hover:text-brand-red transition-colors"><TrashIcon className="w-6 h-6" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cartItems.length > 0 && (
                            <div className="p-10 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <div className="flex justify-between items-center mb-10">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimado</span>
                                    <span className="text-5xl font-black text-brand-blue dark:text-blue-300 tracking-tighter">{formatCurrency(total)}</span>
                                </div>
                                <button onClick={() => setStep('info')} className="w-full py-6 bg-brand-red text-white font-black rounded-3xl shadow-3xl shadow-brand-red/30 hover:bg-slate-950 transition-all transform active:scale-95 flex justify-center items-center gap-4 uppercase tracking-[0.2em] text-xs">
                                    Continuar Pedido
                                </button>
                            </div>
                        )}
                    </>
                )}

                {step === 'info' && (
                    <>
                        <div className="p-10 border-b border-gray-100 dark:border-slate-800 flex items-center gap-6 bg-brand-blue text-white">
                            <button onClick={() => setStep('cart')} className="p-3 hover:bg-white/10 rounded-full transition-all"><ArrowRightIcon className="w-6 h-6 transform rotate-180" /></button>
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Mis Datos</h2>
                                <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">Garantiza tu reserva en Pasaje</p>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-y-auto bg-slate-50 dark:bg-slate-950/30">
                            <div className="p-10 space-y-6">
                                <div className="flex bg-slate-200 dark:bg-slate-800 p-1.5 rounded-2xl mb-4">
                                    <button type="button" onClick={() => setTipoDocumento('Recibo')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tipoDocumento === 'Recibo' ? 'bg-white dark:bg-slate-700 text-brand-blue shadow-lg' : 'text-slate-500'}`}>
                                        Recibo Simple
                                    </button>
                                    <button type="button" onClick={() => setTipoDocumento('SRI')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tipoDocumento === 'SRI' ? 'bg-white dark:bg-slate-700 text-brand-blue shadow-lg' : 'text-slate-500'}`}>
                                        Factura SRI
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-5">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Razón Social</label>
                                        <input required type="text" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all font-bold" value={clientData.nombre} onChange={e => setClientData({...clientData, nombre: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Celular WhatsApp</label>
                                            <input required type="tel" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all font-bold" value={clientData.telefono} onChange={e => setClientData({...clientData, telefono: e.target.value})} maxLength={10} />
                                        </div>
                                        {tipoDocumento === 'SRI' && (
                                            <div>
                                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">RUC / Cédula</label>
                                                <input required type="text" className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all font-bold" value={clientData.ruc} onChange={e => setClientData({...clientData, ruc: e.target.value})} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <button type="submit" className="w-full py-6 bg-green-500 text-white font-black rounded-3xl shadow-3xl shadow-green-500/30 hover:bg-green-600 transition-all transform active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs">
                                    <CheckCircleIcon className="w-6 h-6"/> Confirmar mi Pedido
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {step === 'success' && (
                    <div className="p-16 text-center flex flex-col items-center justify-center h-full bg-white dark:bg-slate-900">
                        <div className="w-32 h-32 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 animate-bounce shadow-inner">
                            <CheckCircleIcon className="w-16 h-16 text-green-500" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6 tracking-tight uppercase">¡PEDIDO ENVIADO!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-xs mx-auto text-lg leading-relaxed font-medium">
                            Gracias <strong>{clientData.nombre}</strong>.<br/>
                            Nuestros asesores te contactarán en WhatsApp para coordinar el arte y entrega.
                        </p>
                        <a 
                            href={`https://wa.me/593993083943?text=Hola%21%20Soy%20${clientData.nombre}%20y%20acabo%20de%20hacer%20un%20pedido%20en%20la%20web%20por%20${formatCurrency(total)}.`}
                            target="_blank"
                            className="px-12 py-6 bg-brand-blue text-white font-black rounded-3xl hover:bg-brand-navy transition-all shadow-3xl shadow-blue-900/20 uppercase tracking-[0.3em] text-xs"
                        >
                            Chatear Ahora
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

const VisualLanding: React.FC = () => {
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const handleAddToCart = (producto: Producto) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.producto.id === producto.id);
            if (existing) {
                return prev.map(item => item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            }
            return [...prev, { producto, cantidad: 1 }];
        });
        setIsCartOpen(true);
    };

    const handleUpdateQuantity = (id: string, delta: number) => {
        setCartItems(prev => prev.map(item => {
            if (item.producto.id === id) {
                return { ...item, cantidad: Math.max(1, item.cantidad + delta) };
            }
            return item;
        }));
    };

    const handleRemoveItem = (id: string) => {
        setCartItems(prev => prev.filter(item => item.producto.id !== id));
    };

    const handleCheckout = async (clientData: any) => {
        await createPublicPedido(clientData, cartItems);
        // Reseteo diferido para UX
    };

    const cartCount = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-white scroll-smooth selection:bg-brand-red selection:text-white overflow-x-hidden">
            <Header cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />
            <main>
                <HeroSection />
                <TrustCarrusel />
                <ServicesSection />
                <CatalogPreview onAddToCart={handleAddToCart} />
                <FAQSection />
                
                {/* Maps & Trust Section */}
                <section className="py-32 bg-white dark:bg-slate-950 border-t dark:border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div className="space-y-12">
                                <div>
                                    <span className="text-brand-red font-black tracking-[0.4em] uppercase text-[10px] mb-4 block">Contacto Estratégico</span>
                                    <h2 className="text-5xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none italic">ENCUÉNTRANOS EN <br/> <span className="text-brand-red">PASAJE.</span></h2>
                                </div>
                                <div className="space-y-8">
                                    <div className="flex items-start gap-8 group">
                                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-all shadow-xl"><MapPinIcon className="w-8 h-8 text-brand-blue group-hover:text-white" /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Matriz Central</p>
                                            <p className="text-xl font-black text-slate-800 dark:text-white leading-tight uppercase tracking-tight">Calle Colón entre Sucre y Rocafuerte</p>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mt-1 italic">Pasaje, El Oro - Ecuador</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-8 group">
                                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-green-600 group-hover:text-white transition-all shadow-xl"><MessageCircleIcon className="w-8 h-8 text-green-600 group-hover:text-white" /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp 24/7</p>
                                            <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">099 308 3943</p>
                                            <a href="https://wa.me/593993083943" target="_blank" className="text-brand-blue dark:text-blue-400 font-black uppercase text-[10px] tracking-widest mt-2 block hover:underline">Iniciar Chat Ahora</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative rounded-[4rem] overflow-hidden shadow-3xl border-8 border-white dark:border-slate-800 aspect-square lg:aspect-video xl:aspect-square bg-slate-200">
                                <iframe 
                                    title="Ubicación Córdova"
                                    src="https://maps.google.com/maps?q=-3.3281355388981613,-79.80962191989809&hl=es&z=18&output=embed"
                                    width="100%" height="100%" style={{ border: 0 }} allowFullScreen={true} loading="lazy" className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1000"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
            
            {/* Floating Quick Action */}
            <div className="fixed bottom-10 right-10 z-[150] flex flex-col gap-4">
                <a href="https://wa.me/593993083943" target="_blank" className="bg-green-500 text-white p-5 rounded-[1.8rem] shadow-[0_20px_50px_rgba(34,197,94,0.4)] hover:scale-110 transition-all hover:bg-green-600 active:scale-95 group">
                    <MessageCircleIcon className="w-8 h-8" />
                    <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-100">¿Necesitas ayuda?</span>
                </a>
                <button 
                    onClick={() => setIsCartOpen(true)} 
                    className="bg-brand-red text-white p-5 rounded-[1.8rem] shadow-[0_20px_50px_rgba(217,0,0,0.4)] hover:scale-110 transition-all hover:bg-slate-950 active:scale-95 relative"
                >
                    <ShoppingCartIcon className="w-8 h-8" />
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-white text-brand-red text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-brand-red">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>
            
            <CartModal 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
            />
        </div>
    );
};

export default VisualLanding;
