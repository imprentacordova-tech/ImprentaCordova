
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheckIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    CordovaLogo, StarIcon, CheckBadgeIcon, ClockIcon, 
    SparklesIcon, PrinterIcon, MessageCircleIcon, SendIcon, GlobeAltIcon, 
    FileTextIcon, BuildingStorefrontIcon, SearchIcon, MonitorIcon
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
                        
                        {/* Animated Glows */}
                        <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-brand-red/10 rounded-full blur-[160px] animate-blob"></div>
                        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10 pt-24 lg:pt-0">
                        <div className="grid lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:col-span-7 space-y-10 animate-fade-in-up">
                                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                                    <ShieldCheckIcon className="w-4 h-4 text-brand-red" />
                                    <span className="text-[10px] font-black text-blue-100 tracking-[0.4em] uppercase">Imprenta Autorizada por el SRI</span>
                                </div>
                                
                                <h1 className="text-6xl md:text-7xl lg:text-[100px] font-black text-white leading-[0.85] tracking-tighter">
                                    IMPRESIÓN <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-rose-400 drop-shadow-[0_0_30px_rgba(217,0,0,0.4)]">DE ÉLITE.</span>
                                </h1>
                                
                                <p className="text-xl lg:text-3xl text-blue-100/70 font-light max-w-2xl leading-tight">
                                    Potenciamos la imagen de tu negocio con <span className="text-white font-bold italic">Gigantografías Roland HD</span> y gestión tributaria profesional en el corazón de Pasaje.
                                </p>

                                <div className="flex flex-wrap gap-6 pt-4">
                                    <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="group px-12 py-6 bg-brand-red text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-brand-red/40 hover:bg-white hover:text-brand-red transition-all transform hover:-translate-y-1 flex items-center gap-4">
                                        Explorar Catálogo <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform"/>
                                    </a>
                                    <Link to="/tracking" className="px-12 py-6 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl hover:bg-white/10 transition-all backdrop-blur-md flex items-center gap-4 group">
                                        Rastreo de Pedido <ClockIcon className="w-5 h-5 text-brand-red group-hover:rotate-12 transition-transform" />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-3 gap-10 pt-10 border-t border-white/5 max-w-lg">
                                    <div>
                                        <p className="text-4xl font-black text-white leading-none mb-2">15+</p>
                                        <p className="text-[9px] font-bold text-blue-300/50 uppercase tracking-widest leading-tight">Años liderando <br/>el mercado</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black text-white leading-none mb-2">1.4k</p>
                                        <p className="text-[9px] font-bold text-blue-300/50 uppercase tracking-widest leading-tight">Puntos de <br/>resolución HD</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black text-white leading-none mb-2">24h</p>
                                        <p className="text-[9px] font-bold text-blue-300/50 uppercase tracking-widest leading-tight">Entrega express <br/>disponible</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="lg:col-span-5 relative hidden lg:block animate-float">
                                <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-8 border-white/5 aspect-[4/5] group bg-slate-900">
                                    <img src="https://i.imgur.com/AUvl1wF.png" alt="Producción Córdova" className="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all duration-1000 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-brand-navy/20"></div>
                                    
                                    <div className="absolute bottom-12 left-0 right-0 px-10">
                                        <div className="bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="bg-brand-red p-3 rounded-2xl"><PrinterIcon className="text-white w-6 h-6"/></div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Calidad Roland</h3>
                                                    <p className="text-xs text-blue-300 font-bold uppercase tracking-widest">Tecnología Japonesa</p>
                                                </div>
                                            </div>
                                            <p className="text-blue-100/60 text-sm leading-relaxed italic">"Garantizamos colores vibrantes y durabilidad extrema en exteriores por más de 3 años."</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Floating Badge */}
                                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white dark:bg-slate-800 rounded-[3rem] shadow-3xl flex flex-col items-center justify-center border-4 border-brand-blue/20 z-20 animate-pulse">
                                    <StarIcon className="w-10 h-10 text-orange-400 fill-orange-400 mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Calidad <br/>Certificada</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TRUST INFRASTRUCTURE */}
                <section id="servicios" className="py-24 bg-white dark:bg-slate-950">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                            {[
                                { icon: ShieldCheckIcon, title: "Autorizado SRI", desc: "Talonarios con validez legal inmediata y asesoría en régimen RIMPE." },
                                { icon: BuildingStorefrontIcon, title: "Imagen Corporativa", desc: "Creamos la identidad visual que tu negocio necesita para escalar." },
                                { icon: ClockIcon, title: "Tiempo Récord", desc: "Optimización de procesos para entregas el mismo día en papelería." },
                                { icon: MapPinIcon, title: "Punto Estratégico", desc: "Ubicación céntrica en Pasaje para tu mayor comodidad y retiro rápido." }
                            ].map((s, i) => (
                                <div key={i} className="group p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 transition-all hover:bg-brand-blue hover:scale-105 hover:shadow-2xl">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 text-brand-blue rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:text-brand-red group-hover:scale-110 transition-all">
                                        <s.icon className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-3 group-hover:text-white transition-colors">{s.title}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed group-hover:text-blue-100 transition-colors">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CATALOG EXPERIENCE */}
                <section id="catalog" className="py-32 bg-slate-50 dark:bg-slate-900/50">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
                            <div className="space-y-4">
                                <span className="text-brand-red font-black tracking-[0.4em] uppercase text-[10px]">Showroom Digital</span>
                                <h2 className="text-5xl lg:text-6xl font-black text-brand-navy dark:text-white uppercase tracking-tighter italic leading-none">
                                    NUESTROS <span className="text-brand-red">PRODUCTOS</span>
                                </h2>
                                <div className="h-2 w-32 bg-brand-red rounded-full"></div>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium italic leading-relaxed">
                                Selecciona tus productos y obtén una proforma instantánea vía WhatsApp con uno de nuestros asesores expertos.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                            {productos.map(p => (
                                <div key={p.id} className="bg-white dark:bg-slate-800 rounded-[3rem] p-7 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-white/5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col">
                                    <div className="relative aspect-square rounded-[2.2rem] overflow-hidden bg-slate-100 dark:bg-slate-950 mb-8 border border-slate-50 dark:border-white/5">
                                        {p.imagenUrl ? (
                                            <img src={p.imagenUrl} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-10">
                                                <BoxIcon className="w-24 h-24 text-brand-blue"/>
                                            </div>
                                        )}
                                        {p.esSRI && (
                                            <div className="absolute top-4 left-4 bg-brand-blue/90 backdrop-blur-md text-white text-[8px] font-black px-3 py-1.5 rounded-lg shadow-xl uppercase tracking-widest border border-white/20">
                                                SRI Autorizado
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[3px]">
                                            <button onClick={() => handleAddToCart(p)} className="p-6 bg-brand-red text-white rounded-3xl shadow-2xl hover:scale-110 active:scale-95 transition-all">
                                                <AddIcon className="w-8 h-8 font-black"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-[9px] font-black text-brand-blue dark:text-blue-400 uppercase tracking-[0.3em] mb-2">{p.categoria}</p>
                                        <h3 className="font-black text-xl text-slate-950 dark:text-white leading-tight uppercase line-clamp-2 min-h-[3rem] tracking-tight group-hover:text-brand-red transition-colors">
                                            {p.nombre}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic leading-relaxed">{p.descripcion}</p>
                                    </div>
                                    <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-50 dark:border-white/5">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Inversión Desde</p>
                                            <span className="text-3xl font-black text-brand-navy dark:text-blue-300 tracking-tighter">{formatCurrency(p.precio)}</span>
                                        </div>
                                        <button onClick={() => handleAddToCart(p)} className="w-14 h-14 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-brand-red hover:text-white transition-all rounded-2xl flex items-center justify-center shadow-inner group/btn">
                                            <ShoppingCartIcon className="w-7 h-7 group-hover/btn:scale-110 transition-transform"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* AI MARKETING ENGINE SECTION */}
                <section className="py-32 bg-slate-950 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')]"></div>
                    <div className="container mx-auto px-6 relative z-10">
                        <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-600/10 to-brand-blue/5 border border-white/10 rounded-[4rem] p-12 lg:p-20 shadow-3xl text-center backdrop-blur-3xl">
                            <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-white/20 animate-pulse">
                                <SparklesIcon className="w-12 h-12 text-blue-400" />
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
                                ¿Sin ideas para tu <span className="text-brand-red">Marketing?</span>
                            </h2>
                            <p className="text-xl text-blue-200/70 font-light mb-12 leading-relaxed">
                                Nuestra IA exclusiva basada en **Google Gemini** genera eslóganes, copys y conceptos de diseño ganadores para tu negocio en segundos. Totalmente gratis para nuestros clientes.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                <Link to="/tracking" className="px-12 py-5 bg-white text-slate-950 font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-brand-red hover:text-white transition-all shadow-2xl">
                                    Probar Asistente IA
                                </Link>
                                <a href="https://wa.me/593993083943" className="px-12 py-5 bg-brand-red/10 border border-brand-red/30 text-white font-black text-xs uppercase tracking-widest rounded-3xl hover:bg-brand-red transition-all">
                                    Asesoría Humana
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* LOCATION & CONTACT GRID */}
                <section id="contact" className="py-32 bg-white dark:bg-slate-950 border-t dark:border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div className="space-y-12">
                                <div>
                                    <span className="text-brand-red font-black tracking-[0.4em] uppercase text-[10px] mb-4 block">Contacto Directo</span>
                                    <h2 className="text-5xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none">
                                        VISÍTANOS EN <br/> <span className="text-brand-red">PASAJE.</span>
                                    </h2>
                                </div>
                                
                                <div className="space-y-8">
                                    <div className="flex items-start gap-6 group">
                                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-brand-blue group-hover:text-white transition-all">
                                            <MapPinIcon className="w-6 h-6 text-brand-blue group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dirección Matriz</p>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white">Calle Colón entre Sucre y Rocafuerte</p>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">Pasaje, El Oro, Ecuador (Diagonal al Parque)</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-6 group">
                                        <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-green-600 group-hover:text-white transition-all">
                                            <PhoneIcon className="w-6 h-6 text-green-600 group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp Ventas</p>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white">099 308 3943</p>
                                            <a href="https://wa.me/593993083943" target="_blank" className="text-brand-blue font-bold hover:underline">Iniciar chat de cotización</a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-6 group">
                                        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-brand-red group-hover:text-white transition-all">
                                            <ClockIcon className="w-6 h-6 text-brand-red group-hover:text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Horario Comercial</p>
                                            <p className="text-lg font-bold text-slate-800 dark:text-white">Lun - Vie: 08:30 a 18:30</p>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium">Sábados: 09:00 a 13:00</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <div className="absolute -inset-4 bg-brand-navy rounded-[3rem] blur-2xl opacity-10"></div>
                                <div className="relative rounded-[3rem] overflow-hidden shadow-3xl border-8 border-white dark:border-slate-800 aspect-square lg:aspect-video xl:aspect-square bg-slate-200">
                                    <iframe 
                                        title="Localización Imprenta Córdova"
                                        src="https://maps.google.com/maps?q=-3.3281355388981613,-79.80962191989809&hl=es&z=18&output=embed"
                                        width="100%" 
                                        height="100%" 
                                        style={{ border: 0 }} 
                                        allowFullScreen={true} 
                                        loading="lazy" 
                                        className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-brand-navy text-white pt-32 pb-16 relative overflow-hidden">
                <div className="container mx-auto px-6 text-center md:text-left">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-24 mb-32">
                        <div className="col-span-1 md:col-span-2 space-y-10">
                            <div className="flex items-center justify-center md:justify-start gap-5">
                                <CordovaLogo className="h-16 w-auto brightness-0 invert" />
                                <span className="text-5xl font-black tracking-tighter uppercase text-white">CÓRDOVA</span>
                            </div>
                            <p className="text-blue-100/60 max-w-md text-xl leading-relaxed font-light italic">"Construyendo marcas potentes desde 2010. Tu éxito impreso comienza aquí."</p>
                            <div className="flex justify-center md:justify-start gap-6">
                                {['FB', 'IG', 'WA'].map(social => (
                                    <div key={social} className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-brand-red transition-all cursor-pointer font-black text-xs hover:scale-110">
                                        {social}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-8">
                            <h4 className="font-black text-xs uppercase tracking-[0.5em] text-brand-red">Legales</h4>
                            <ul className="space-y-4 text-blue-100/40 text-sm font-bold uppercase tracking-widest">
                                <li><a href="#" className="hover:text-white transition-colors">Términos de Servicio</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">RUC Emisor</a></li>
                            </ul>
                        </div>
                        <div className="space-y-8">
                            <h4 className="font-black text-xs uppercase tracking-[0.5em] text-brand-red">Portal Externo</h4>
                            <div className="space-y-6">
                                <Link to="/tracking" className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                                    <div className="bg-brand-blue p-2 rounded-xl group-hover:bg-brand-red transition-colors"><SearchIcon className="w-4 h-4"/></div>
                                    <span className="text-xs font-black uppercase tracking-widest">Rastrear Pedido</span>
                                </Link>
                                <a href="https://wa.me/593993083943" className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                                    <div className="bg-green-600 p-2 rounded-xl"><MessageCircleIcon className="w-4 h-4"/></div>
                                    <span className="text-xs font-black uppercase tracking-widest">WhatsApp SOS</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 text-[10px] font-black text-blue-100/30 uppercase tracking-[0.5em]">
                        <p>&copy; 2025 IMPRENTA CÓRDOVA. PASAJE - EL ORO - ECUADOR.</p>
                        <p className="flex items-center gap-2">
                             ENGINEERED BY <span className="text-blue-100/60 font-black">GEMINI VISION PRO</span>
                        </p>
                    </div>
                </div>
            </footer>

            {/* SHOPPING CART OVERLAY PRO */}
            <div className={`fixed inset-0 z-[120] transition-all duration-700 ${isCartOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="absolute inset-0 bg-brand-navy/80 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
                <div className={`absolute top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-3xl transform transition-transform duration-700 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex flex-col h-full">
                        <div className="p-12 border-b dark:border-white/5 flex justify-between items-center bg-brand-blue text-white">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter">Mi Pedido</h2>
                                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.3em] mt-2 italic">Añade productos para cotizar</p>
                            </div>
                            <button onClick={() => setIsCartOpen(false)} className="p-4 hover:bg-white/10 rounded-full transition-colors"><CloseIcon className="w-10 h-10"/></button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-12 space-y-8 custom-scrollbar">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-24 opacity-20">
                                    <BoxIcon className="w-32 h-32 mx-auto mb-6 text-brand-blue"/>
                                    <p className="font-black uppercase text-2xl tracking-widest">Carrito Vacío</p>
                                </div>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.producto.id} className="flex gap-8 p-8 rounded-[3rem] bg-slate-50 dark:bg-white/5 border border-white dark:border-white/5 group hover:border-brand-red transition-all duration-300">
                                        <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-white shadow-inner flex-shrink-0">
                                            {item.producto.imagenUrl && <img src={item.producto.imagenUrl} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-grow flex flex-col justify-center min-w-0">
                                            <h4 className="font-black text-xl text-brand-blue dark:text-white uppercase leading-tight line-clamp-1 tracking-tight">{item.producto.nombre}</h4>
                                            <p className="text-sm font-bold text-brand-red mt-2">{formatCurrency(item.producto.precio)} x {item.cantidad}</p>
                                        </div>
                                        <button onClick={() => setCartItems(prev => prev.filter(i => i.producto.id !== item.producto.id))} className="text-slate-300 hover:text-brand-red transition-colors self-center"><TrashIcon className="w-8 h-8"/></button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-12 border-t dark:border-white/5 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex justify-between items-center mb-12">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Total Estimado</span>
                                <span className="text-5xl font-black text-brand-blue dark:text-blue-300 tracking-tighter">
                                    {formatCurrency(cartItems.reduce((a, b) => a + (b.producto.precio * b.cantidad), 0))}
                                </span>
                            </div>
                            <a 
                                href={`https://wa.me/593993083943?text=Hola%20Imprenta%20C%C3%B3rdova%21%20Quisiera%20cotizar%3A%20${encodeURIComponent(cartItems.map(i => `${i.cantidad}x ${i.producto.nombre}`).join(', '))}`}
                                target="_blank"
                                className="w-full py-7 bg-brand-red text-white font-black rounded-[2rem] shadow-3xl shadow-brand-red/40 flex justify-center items-center gap-5 uppercase tracking-[0.3em] hover:bg-brand-navy transition-all transform active:scale-95 text-xs"
                            >
                                <MessageCircleIcon className="w-7 h-7" /> Cotizar vía WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
