
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheckIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    CordovaLogo, StarIcon, CheckBadgeIcon, ClockIcon, 
    SparklesIcon, PrinterIcon, MessageCircleIcon, SendIcon, GlobeAltIcon, 
    FileTextIcon, BuildingStorefrontIcon, SearchIcon, MonitorIcon, CheckCircleIcon,
    /* Added missing CalculatorIcon import */
    CalculatorIcon
} from '../components/Icons';
import { getProductos } from '../services/mockApi';
import { Producto } from '../types';
import { formatCurrency } from '../utils';

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
};

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
        return 22.00; // Oficio base
    }, [size, qty]);

    return (
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-8 rounded-[2.5rem] shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-brand-red p-2 rounded-xl shadow-lg shadow-brand-red/20"><CalculatorIcon className="w-5 h-5 text-white"/></div>
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Cotizador Instantáneo</h3>
            </div>
            
            <div className="space-y-6">
                <div>
                    <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest block mb-3">1. Selecciona Tamaño</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['1/4', '1/2', 'oficio'] as const).map(s => (
                            <button key={s} onClick={() => setSize(s)} className={`py-2 text-[10px] font-black uppercase rounded-xl transition-all border ${size === s ? 'bg-white text-brand-blue border-white shadow-xl' : 'bg-white/5 text-blue-100/50 border-white/10 hover:bg-white/10'}`}>
                                {s} Oficio
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest block mb-3">2. Cantidad de Juegos</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['50', '100', '200'] as const).map(q => (
                            <button key={q} onClick={() => setQty(q)} className={`py-2 text-[10px] font-black uppercase rounded-xl transition-all border ${qty === q ? 'bg-brand-red text-white border-brand-red shadow-xl' : 'bg-white/5 text-blue-100/50 border-white/10 hover:bg-white/10'}`}>
                                {q === '200' ? '2 Blocks' : q + ' Juegos'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10 mt-6 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-blue-300/50 uppercase tracking-widest">Inversión Estimada</p>
                        <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(price)}</p>
                    </div>
                    <a 
                        href={`https://wa.me/593993083943?text=Hola%20Imprenta%20C%C3%B3rdova%21%20Quisiera%20cotizar%20${qty}%20juegos%20en%20tama%C3%B1o%20${size}%20oficio.`}
                        target="_blank"
                        className="bg-white text-brand-blue px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all shadow-xl active:scale-95"
                    >
                        Pedir YA
                    </a>
                </div>
            </div>
        </div>
    );
};

const LandingHeader: React.FC<{ cartCount: number, onOpenCart: () => void }> = ({ cartCount, onOpenCart }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${scrolled ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl py-3 border-b border-brand-blue/10' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-4 group">
                    <div className="relative">
                        <div className="absolute -inset-2 bg-brand-red/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CordovaLogo className={`h-12 w-auto object-contain transition-all duration-300 ${scrolled ? 'brightness-100' : 'brightness-0 invert'}`} />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className={`text-[10px] font-black tracking-[0.4em] uppercase transition-colors ${scrolled ? 'text-brand-blue' : 'text-slate-300'}`}>Imprenta</span>
                        <span className={`text-2xl font-black tracking-tighter uppercase transition-colors ${scrolled ? 'text-slate-900 dark:text-white' : 'text-white'}`}>CÓRDOVA</span>
                    </div>
                </Link>
                
                <div className="flex items-center gap-10">
                    <nav className={`hidden lg:flex gap-12 text-[11px] font-black uppercase tracking-[0.2em] ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                        <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')} className="hover:text-brand-red transition-colors cursor-pointer relative group">
                            Servicios
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-red transition-all duration-300 group-hover:w-full"></span>
                        </a>
                        <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="hover:text-brand-red transition-colors cursor-pointer relative group">
                            Catálogo
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-red transition-all duration-300 group-hover:w-full"></span>
                        </a>
                        <Link to="/tracking" className="hover:text-brand-red transition-colors relative group">
                            Seguimiento
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-red transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                    </nav>

                    <div className="flex items-center gap-6">
                        <button onClick={onOpenCart} className="relative group">
                            <div className={`p-3 rounded-2xl border transition-all duration-300 ${scrolled ? 'bg-slate-100 border-slate-200 text-slate-900 group-hover:bg-brand-red group-hover:text-white' : 'bg-white/10 border-white/20 text-white group-hover:bg-brand-red group-hover:border-brand-red'}`}>
                                <ShoppingCartIcon className="w-6 h-6" />
                            </div>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <Link to="/login" className={`hidden sm:flex items-center gap-2 px-8 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl ${scrolled ? 'bg-brand-blue text-white hover:bg-slate-900' : 'bg-white text-brand-blue hover:bg-brand-red hover:text-white'}`}>
                            Intranet
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default function LandingPage() {
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [productos, setProductos] = useState<Producto[]>([]);

    useEffect(() => { getProductos().then(setProductos); }, []);

    const handleAddToCart = (p: Producto) => {
        setCartItems(prev => {
            const exists = prev.find(i => i.producto.id === p.id);
            if (exists) return prev.map(i => i.producto.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
            return [...prev, { producto: p, cantidad: 1 }];
        });
        setIsCartOpen(true);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-white selection:bg-brand-red selection:text-white overflow-x-hidden">
            <LandingHeader cartCount={cartItems.reduce((a, b) => a + b.cantidad, 0)} onOpenCart={() => setIsCartOpen(true)} />
            
            <main>
                {/* HERO MASTER SECTION */}
                <section className="relative min-h-screen flex items-center bg-brand-navy overflow-hidden">
                    {/* Visual Background Engine */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-blue/40 via-brand-navy to-brand-navy"></div>
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-brand-red/10 rounded-full blur-[160px] animate-blob"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10 pt-32 lg:pt-0">
                        <div className="grid lg:grid-cols-12 gap-16 items-center">
                            <div className="lg:col-span-7 space-y-10 animate-fade-in-up">
                                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                                    <ShieldCheckIcon className="w-4 h-4 text-brand-red" />
                                    <span className="text-[10px] font-black text-blue-100 tracking-[0.4em] uppercase">Imprenta Autorizada SRI - Pasaje</span>
                                </div>
                                
                                <h1 className="text-6xl md:text-7xl lg:text-[110px] font-black text-white leading-[0.82] tracking-tighter">
                                    TU MARCA <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-rose-400 drop-shadow-[0_0_30px_rgba(217,0,0,0.4)] italic">SIN LÍMITES.</span>
                                </h1>
                                
                                <p className="text-xl lg:text-3xl text-blue-100/70 font-light max-w-2xl leading-tight">
                                    Expertos en Gigantografías HD y Gestión Tributaria RIMPE. <span className="text-white font-bold italic">Imprimimos tu éxito hoy mismo.</span>
                                </p>

                                <div className="flex flex-wrap gap-6 pt-4">
                                    <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="group px-12 py-6 bg-brand-red text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-brand-red/40 hover:bg-white hover:text-brand-red transition-all transform hover:-translate-y-1 flex items-center gap-4">
                                        Explorar Catálogo <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform"/>
                                    </a>
                                    <Link to="/tracking" className="px-12 py-6 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl hover:bg-white/10 transition-all backdrop-blur-md flex items-center gap-4 group">
                                        Estado de mi Pedido <ClockIcon className="w-5 h-5 text-brand-red group-hover:rotate-12 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="lg:col-span-5 relative">
                                <QuickQuote />
                                {/* Badge de Confianza Flotante */}
                                <div className="absolute -bottom-10 -right-10 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-3xl border-4 border-brand-blue hidden xl:block animate-float">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-green-500 p-3 rounded-2xl shadow-lg shadow-green-500/20"><CheckCircleIcon className="w-6 h-6 text-white"/></div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">ENTREGA 24H</p>
                                            <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mt-1">Servicio Express Disponible</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PROMOS SRI - DISEÑO FINTECH */}
                <section className="py-24 bg-slate-50 dark:bg-slate-950">
                    <div className="container mx-auto px-6 text-center">
                        <div className="mb-16">
                            <span className="text-brand-red font-black tracking-[0.4em] uppercase text-[10px] mb-4 block">Ofertas de Temporada</span>
                            <h2 className="text-5xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none italic">PAQUETES <span className="text-brand-red">EMPRENDEDOR</span></h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "Dúo Básico", price: "$10.00", desc: "1 Block 1/4 Oficio (50 juegos)", icon: FileTextIcon, tag: "Ideal RIMPE Popular" },
                                { title: "Block Pro", price: "$13.00", desc: "1 Block 1/4 Oficio (100 juegos)", icon: ShieldCheckIcon, tag: "Más solicitado" },
                                { title: "Pack Negocio", price: "$20.00", desc: "2 Blocks 1/4 Oficio (200 hojas total)", icon: BuildingStorefrontIcon, tag: "Mejor Valor" }
                            ].map((promo, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-xl border border-slate-100 dark:border-white/5 group hover:bg-brand-blue hover:-translate-y-4 transition-all duration-500 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/5 rounded-full -mr-16 -mt-16 group-hover:bg-white/10"></div>
                                    <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 text-brand-blue rounded-2xl flex items-center justify-center mb-8 mx-auto group-hover:bg-white group-hover:text-brand-red transition-all">
                                        <promo.icon className="w-8 h-8" />
                                    </div>
                                    <p className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-2 group-hover:text-white/60">{promo.tag}</p>
                                    <h3 className="text-2xl font-black text-brand-navy dark:text-white uppercase group-hover:text-white">{promo.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm group-hover:text-blue-100 mb-6">{promo.desc}</p>
                                    <p className="text-5xl font-black text-brand-blue dark:text-blue-300 tracking-tighter group-hover:text-white">{promo.price}</p>
                                    <div className="mt-8 border-t border-slate-50 dark:border-white/5 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a href="https://wa.me/593993083943" className="bg-white text-brand-blue font-black text-[10px] px-8 py-3 rounded-xl uppercase tracking-widest hover:scale-105 transition-transform inline-block shadow-2xl">Pedir en WhatsApp</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CATALOG & AI STUDIO INTEGRATION */}
                <section id="catalog" className="py-32 bg-white dark:bg-slate-900/50">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
                            <div className="space-y-4">
                                <span className="text-brand-red font-black tracking-[0.4em] uppercase text-[10px]">Showroom Digital</span>
                                <h2 className="text-5xl lg:text-6xl font-black text-brand-navy dark:text-white uppercase tracking-tighter italic leading-none">
                                    NUESTROS <span className="text-brand-red">PRODUCTOS</span>
                                </h2>
                                <div className="h-2 w-32 bg-brand-red rounded-full"></div>
                            </div>
                            <div className="flex items-center gap-6 bg-brand-blue/5 p-4 rounded-[2rem] border border-brand-blue/10">
                                <div className="p-3 bg-brand-blue text-white rounded-2xl"><SparklesIcon className="w-5 h-5 animate-pulse"/></div>
                                <div>
                                    <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest leading-none mb-1">Diseño con IA</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">"Te ayudamos a crear el eslogan perfecto"</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                            {productos.map(p => (
                                <div key={p.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-xl border border-slate-50 dark:border-white/5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                                    <div className="relative aspect-square rounded-[1.8rem] overflow-hidden bg-slate-100 dark:bg-slate-950 mb-6">
                                        {p.imagenUrl ? (
                                            <img src={p.imagenUrl} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-10"><BoxIcon className="w-16 h-16"/></div>
                                        )}
                                        {p.esSRI && <div className="absolute top-4 left-4 bg-brand-navy/90 backdrop-blur-md text-white text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">SRI Autorizado</div>}
                                        <div className="absolute inset-0 bg-brand-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <button onClick={() => handleAddToCart(p)} className="p-4 bg-white text-brand-red rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all"><AddIcon className="w-6 h-6"/></button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[8px] font-black text-brand-blue dark:text-blue-400 uppercase tracking-widest">{p.categoria}</p>
                                        <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase leading-tight line-clamp-1">{p.nombre}</h3>
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-white/5">
                                            <span className="text-2xl font-black text-brand-navy dark:text-blue-300 tracking-tighter">{formatCurrency(p.precio)}</span>
                                            <button onClick={() => handleAddToCart(p)} className="w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-brand-red hover:text-white transition-all rounded-xl flex items-center justify-center shadow-inner"><ShoppingCartIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* LOCATION & CONTACT GRID */}
                <section id="contact" className="py-32 bg-white dark:bg-slate-950 border-t dark:border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div className="space-y-12">
                                <div>
                                    <span className="text-brand-red font-black tracking-[0.4em] uppercase text-[10px] mb-4 block">Contacto Matriz</span>
                                    <h2 className="text-5xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none">VISÍTANOS EN <br/> <span className="text-brand-red">PASAJE.</span></h2>
                                </div>
                                <div className="space-y-8">
                                    <div className="flex items-start gap-6 group">
                                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-all"><MapPinIcon className="w-6 h-6 text-brand-blue group-hover:text-white" /></div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dirección Exacta</p>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">Calle Colón entre Sucre y Rocafuerte</p>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">Diagonal al Parque Central - Pasaje, El Oro</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-6 group">
                                        <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-green-600 group-hover:text-white transition-all"><PhoneIcon className="w-6 h-6 text-green-600 group-hover:text-white" /></div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp Ventas Directas</p>
                                            <p className="text-xl font-black text-slate-800 dark:text-white">099 308 3943</p>
                                            <a href="https://wa.me/593993083943" target="_blank" className="text-brand-blue font-bold hover:underline text-sm">¿Deseas una proforma ahora?</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative rounded-[3rem] overflow-hidden shadow-3xl border-8 border-white dark:border-slate-800 aspect-square lg:aspect-video xl:aspect-square bg-slate-200">
                                <iframe 
                                    title="Localización Imprenta Córdova"
                                    src="https://maps.google.com/maps?q=-3.3281355388981613,-79.80962191989809&hl=es&z=18&output=embed"
                                    width="100%" height="100%" style={{ border: 0 }} allowFullScreen={true} loading="lazy" className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-brand-navy text-white pt-24 pb-12 relative overflow-hidden">
                <div className="container mx-auto px-6 text-center">
                    <div className="flex flex-col items-center gap-10 mb-20">
                        <div className="flex items-center gap-4">
                            <CordovaLogo className="h-14 w-auto brightness-0 invert" />
                            <span className="text-4xl font-black tracking-tighter uppercase text-white">CÓRDOVA</span>
                        </div>
                        <p className="text-blue-100/40 max-w-xl text-lg leading-relaxed font-light italic">"Liderando la industria gráfica de Pasaje con tecnología de punta y el mejor servicio al cliente de la provincia."</p>
                    </div>
                    <div className="pt-10 border-t border-white/5 text-[9px] font-black text-blue-100/20 uppercase tracking-[0.5em]">
                        <p>&copy; 2025 IMPRENTA CÓRDOVA - ECUADOR - POWERED BY GEMINI VISION</p>
                    </div>
                </div>
            </footer>

            {/* SHOPPING CART OVERLAY */}
            <div className={`fixed inset-0 z-[120] transition-all duration-700 ${isCartOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="absolute inset-0 bg-brand-navy/80 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
                <div className={`absolute top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-3xl transform transition-transform duration-700 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex flex-col h-full">
                        <div className="p-10 border-b dark:border-white/5 flex justify-between items-center bg-brand-blue text-white">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">Mi Pedido</h2>
                                <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest mt-1">Listo para cotización WhatsApp</p>
                            </div>
                            <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><CloseIcon className="w-8 h-8"/></button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-10 space-y-6 custom-scrollbar">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-20 opacity-20"><BoxIcon className="w-24 h-24 mx-auto mb-6 text-brand-blue"/><p className="font-black uppercase text-xl">Sin Productos</p></div>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.producto.id} className="flex gap-6 p-6 rounded-[2rem] bg-slate-50 dark:bg-white/5 border border-white dark:border-white/5 group hover:border-brand-red transition-all">
                                        <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden bg-white shadow-inner shrink-0">{item.producto.imagenUrl && <img src={item.producto.imagenUrl} className="w-full h-full object-cover" />}</div>
                                        <div className="flex-grow">
                                            <h4 className="font-black text-sm text-brand-navy dark:text-white uppercase leading-tight">{item.producto.nombre}</h4>
                                            <p className="text-xs font-bold text-brand-red mt-1">{formatCurrency(item.producto.precio)} x {item.cantidad}</p>
                                        </div>
                                        <button onClick={() => setCartItems(prev => prev.filter(i => i.producto.id !== item.producto.id))} className="text-slate-300 hover:text-brand-red transition-colors self-center"><TrashIcon className="w-6 h-6"/></button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-10 border-t dark:border-white/5 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex justify-between items-center mb-10">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimado</span>
                                <span className="text-5xl font-black text-brand-blue dark:text-blue-300 tracking-tighter">
                                    {formatCurrency(cartItems.reduce((a, b) => a + (b.producto.precio * b.cantidad), 0))}
                                </span>
                            </div>
                            <a 
                                href={`https://wa.me/593993083943?text=Hola%20Imprenta%20C%C3%B3rdova%21%20Quisiera%20cotizar%3A%20${encodeURIComponent(cartItems.map(i => `${i.cantidad}x ${i.producto.nombre}`).join(', '))}`}
                                target="_blank"
                                className="w-full py-6 bg-brand-red text-white font-black rounded-2xl shadow-3xl shadow-brand-red/40 flex justify-center items-center gap-4 uppercase tracking-[0.2em] hover:bg-brand-navy transition-all active:scale-95 text-xs"
                            >
                                <MessageCircleIcon className="w-6 h-6" /> Cotizar vía WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
