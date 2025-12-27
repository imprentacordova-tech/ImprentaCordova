
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheckIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    CordovaLogo, StarIcon, CheckBadgeIcon, ClockIcon, 
    SparklesIcon, PrinterIcon, MessageCircleIcon, SendIcon, GlobeAltIcon, 
    FileTextIcon, BuildingStorefrontIcon
} from '../components/Icons';
import { getProductos } from '../services/mockApi';
import { Producto, ChatMessage } from '../types';
import { formatCurrency } from '../utils';
import { chatWithCustomer } from '../services/geminiService';

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${scrolled ? 'bg-brand-blue/95 backdrop-blur-xl shadow-2xl py-3 border-b border-white/10' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-4 group">
                    <div className="relative">
                        <div className="absolute -inset-2 bg-brand-red/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CordovaLogo className="h-12 w-auto object-contain brightness-0 invert" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className={`text-[10px] font-black tracking-[0.4em] uppercase ${scrolled ? 'text-blue-200' : 'text-slate-300'}`}>Imprenta</span>
                        <span className="text-2xl font-black tracking-tighter uppercase text-white">CÓRDOVA</span>
                    </div>
                </Link>
                
                <div className="flex items-center gap-10">
                    <nav className="hidden lg:flex gap-12 text-[11px] font-black uppercase tracking-[0.2em] text-white/80">
                        <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')} className="hover:text-brand-red transition-colors cursor-pointer relative group">
                            Servicios
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-red transition-all duration-300 group-hover:w-full"></span>
                        </a>
                        <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="hover:text-brand-red transition-colors cursor-pointer relative group">
                            Productos
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-red transition-all duration-300 group-hover:w-full"></span>
                        </a>
                        <Link to="/tracking" className="hover:text-brand-red transition-colors relative group">Seguimiento</Link>
                    </nav>

                    <div className="flex items-center gap-6">
                        <button onClick={onOpenCart} className="relative group">
                            <div className="p-3 rounded-2xl bg-white/10 border border-white/20 group-hover:bg-brand-red group-hover:border-brand-red transition-all duration-300">
                                <ShoppingCartIcon className="w-6 h-6 text-white" />
                            </div>
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-brand-blue">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <Link to="/login" className="hidden sm:flex items-center gap-2 px-8 py-3 bg-white text-brand-blue text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-red hover:text-white transition-all shadow-xl">
                            Acceso
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
        <div className="min-h-screen bg-white dark:bg-neutral-dark font-sans text-slate-900 dark:text-white selection:bg-brand-red selection:text-white">
            <LandingHeader cartCount={cartItems.reduce((a, b) => a + b.cantidad, 0)} onOpenCart={() => setIsCartOpen(true)} />
            
            <main>
                {/* HERO SECTION - PREMIUM BLUE & RED */}
                <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-blue">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-brand-blue to-brand-navy"></div>
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        {/* Glows */}
                        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[120px] animate-blob"></div>
                        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-brand-red/10 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10 pt-20">
                        <div className="grid lg:grid-cols-2 gap-20 items-center">
                            <div className="space-y-12 animate-fade-in-up">
                                <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                                    <span className="flex h-3 w-3 rounded-full bg-brand-red animate-pulse"></span>
                                    <span className="text-[10px] font-black text-white tracking-[0.4em] uppercase">Pasaje • El Oro • Ecuador</span>
                                </div>
                                <h1 className="text-7xl lg:text-[90px] font-black text-white leading-[0.85] tracking-tighter">
                                    IMPULSA TU <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-rose-400 drop-shadow-[0_0_30px_rgba(217,0,0,0.3)]">NEGOCIO.</span>
                                </h1>
                                <p className="text-xl lg:text-2xl text-blue-100/70 font-medium max-w-xl leading-relaxed italic">
                                    Especialistas en <span className="text-white underline decoration-brand-red underline-offset-8">Documentos SRI</span>, Gigantografías HD y Publicidad de alto impacto.
                                </p>
                                <div className="flex flex-wrap gap-6 pt-6">
                                    <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="px-12 py-6 bg-brand-red text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-brand-red/30 hover:scale-105 hover:bg-white hover:text-brand-red transition-all transform flex items-center gap-4">
                                        <ShoppingCartIcon className="w-5 h-5"/> Ver Catálogo
                                    </a>
                                    <Link to="/tracking" className="px-12 py-6 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl hover:bg-white/10 transition-all backdrop-blur-md flex items-center gap-4">
                                        Rastrear Orden <ArrowRightIcon className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                            
                            <div className="relative hidden lg:block animate-float">
                                <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-3xl border-8 border-white/5 bg-slate-900 aspect-square group">
                                    <img src="https://i.imgur.com/AUvl1wF.png" alt="Producción Roland" className="w-full h-full object-cover opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-transparent"></div>
                                    <div className="absolute bottom-12 left-12 right-12">
                                        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
                                            <h3 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                                                <PrinterIcon className="text-brand-red" /> Roland HD
                                            </h3>
                                            <p className="text-blue-100 text-sm font-medium italic">Máxima resolución en cada centímetro impreso.</p>
                                        </div>
                                    </div>
                                </div>
                                {/* Floating Experience Badge */}
                                <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-brand-red rounded-[3.5rem] shadow-3xl flex flex-col items-center justify-center text-white z-20 border-[12px] border-brand-navy">
                                    <span className="text-7xl font-black mb-1">15+</span>
                                    <p className="font-black text-[10px] uppercase tracking-[0.3em] text-center leading-relaxed">Años de <br/> experiencia</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TRUST SECTION */}
                <section className="py-24 bg-white dark:bg-neutral-dark border-b dark:border-white/5">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 text-center">
                            {[
                                { icon: ShieldCheckIcon, title: "Autorizado SRI", desc: "Facturas y notas de venta con validez legal." },
                                { icon: BuildingStorefrontIcon, title: "Tu Marca Pro", desc: "Personalizamos la imagen de tu negocio." },
                                { icon: ClockIcon, title: "Entrega Flash", desc: "Tiempos récord en trabajos de oficina." },
                                { icon: MapPinIcon, title: "Cerca de ti", desc: "Ubicados en el centro comercial de Pasaje." }
                            ].map((s, i) => (
                                <div key={i} className="space-y-6 group">
                                    <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 text-brand-blue rounded-[2.5rem] flex items-center justify-center mx-auto transition-all group-hover:scale-110 group-hover:bg-brand-red group-hover:text-white shadow-sm border border-slate-100 dark:border-white/5">
                                        <s.icon className="w-12 h-12" />
                                    </div>
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-xs">{s.title}</h4>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CATALOG SECTION */}
                <section id="catalog" className="py-32 bg-slate-50 dark:bg-slate-900/50">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
                            <div className="text-center md:text-left space-y-4">
                                <span className="text-brand-red font-black tracking-[0.4em] uppercase text-xs">Catálogo de Soluciones</span>
                                <h2 className="text-6xl font-black text-brand-blue dark:text-white uppercase tracking-tighter italic">Nuestros <span className="text-brand-red">Servicios</span></h2>
                                <div className="h-2 w-32 bg-brand-red rounded-full mx-auto md:mx-0"></div>
                            </div>
                            <p className="text-slate-500 max-w-sm font-medium italic">Selecciona los productos y solicita tu cotización vía WhatsApp. Asesoría inmediata.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                            {productos.map(p => (
                                <div key={p.id} className="bg-white dark:bg-slate-800 rounded-[3rem] p-7 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-white/5 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col">
                                    <div className="relative aspect-square rounded-[2.2rem] overflow-hidden bg-slate-100 dark:bg-slate-950 mb-8 border border-slate-50 dark:border-white/5">
                                        {p.imagenUrl ? <img src={p.imagenUrl} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><BoxIcon className="w-24 h-24"/></div>}
                                        <div className="absolute inset-0 bg-brand-blue/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <button onClick={() => handleAddToCart(p)} className="p-6 bg-brand-red text-white rounded-[1.8rem] shadow-2xl hover:scale-110 active:scale-95 transition-all"><AddIcon className="w-10 h-10 font-black"/></button>
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start mb-3">
                                            <p className="text-[10px] font-black text-brand-blue dark:text-blue-400 uppercase tracking-[0.2em]">{p.categoria}</p>
                                            {p.esSRI && <ShieldCheckIcon className="w-4 h-4 text-green-500"/>}
                                        </div>
                                        <h3 className="font-black text-xl text-slate-950 dark:text-white leading-tight uppercase line-clamp-2 min-h-[3rem] tracking-tight">{p.nombre}</h3>
                                        <p className="text-xs text-slate-400 mt-2 italic">{p.descripcion}</p>
                                    </div>
                                    <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-50 dark:border-white/5">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Precio Referencial</p>
                                            <span className="text-3xl font-black text-brand-blue dark:text-blue-300 tracking-tighter">{formatCurrency(p.price || p.precio)}</span>
                                        </div>
                                        <button onClick={() => handleAddToCart(p)} className="w-14 h-14 bg-brand-navy text-white hover:bg-brand-red transition-all rounded-2xl flex items-center justify-center shadow-lg"><ShoppingCartIcon className="w-7 h-7"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-brand-navy text-white pt-32 pb-16">
                <div className="container mx-auto px-6 text-center md:text-left">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-24 mb-32">
                        <div className="col-span-1 md:col-span-2 space-y-10">
                            <Link to="/" className="flex items-center justify-center md:justify-start gap-5">
                                <CordovaLogo className="h-16 w-auto brightness-0 invert" />
                                <span className="text-5xl font-black tracking-tighter uppercase text-white">CÓRDOVA</span>
                            </Link>
                            <p className="text-blue-100/60 max-w-md text-xl leading-relaxed font-medium italic">"Excelencia en cada impresión, compromiso en cada entrega para el crecimiento de tu negocio."</p>
                            <div className="flex justify-center md:justify-start gap-6">
                                <a href="https://wa.me/593993083943" className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-brand-red transition-all shadow-xl hover:-translate-y-1"><PhoneIcon className="w-8 h-8"/></a>
                                <a href="#" className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-brand-red transition-all shadow-xl hover:-translate-y-1"><GlobeAltIcon className="w-8 h-8"/></a>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <h4 className="font-black text-xs uppercase tracking-[0.5em] text-brand-red">Sede Central</h4>
                            <div className="space-y-4">
                                <p className="text-white font-black text-lg">Pasaje, El Oro</p>
                                <p className="text-blue-100/40 text-sm leading-relaxed">Calle Colón entre Sucre y Rocafuerte.<br/>Diagonal al Parque Central.</p>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <h4 className="font-black text-xs uppercase tracking-[0.5em] text-brand-red">Horarios</h4>
                            <div className="space-y-4 text-sm font-bold">
                                <div className="flex justify-between border-b border-white/5 pb-2"><span>Lun - Vie:</span> <span className="text-white">08:30 - 18:30</span></div>
                                <div className="flex justify-between border-b border-white/5 pb-2"><span>Sábados:</span> <span className="text-white">09:00 - 13:00</span></div>
                                <p className="text-[10px] text-blue-100 font-black uppercase tracking-widest pt-2 italic">Atención personalizada SRI</p>
                            </div>
                        </div>
                    </div>
                    <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 text-[10px] font-black text-blue-100/30 uppercase tracking-[0.5em]">
                        <p>&copy; 2025 Imprenta Córdova. El Oro - Ecuador.</p>
                        <p>Diseño & Calidad Roland HD</p>
                    </div>
                </div>
            </footer>

            {/* CARRITO - SLIDE RED & BLUE */}
            <div className={`fixed inset-0 z-[120] transition-all duration-700 ${isCartOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="absolute inset-0 bg-brand-navy/80 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
                <div className={`absolute top-0 right-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 shadow-3xl transform transition-transform duration-700 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex flex-col h-full">
                        <div className="p-12 border-b dark:border-white/5 flex justify-between items-center bg-brand-blue text-white">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter">Mi Pedido</h2>
                                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.3em] mt-2 italic">Cotización al instante</p>
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
                                            <p className="text-sm font-bold text-brand-red mt-2">{formatCurrency(item.producto.price || item.producto.precio)} x {item.cantidad}</p>
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
                                    {formatCurrency(cartItems.reduce((a, b) => a + ((b.producto.price || b.producto.precio) * b.cantidad), 0))}
                                </span>
                            </div>
                            <a 
                                href={`https://wa.me/593993083943?text=Hola%20Imprenta%20C%C3%B3rdova%21%20Quisiera%20cotizar%3A%20${encodeURIComponent(cartItems.map(i => `${i.cantidad}x ${i.producto.nombre}`).join(', '))}`}
                                target="_blank"
                                className="w-full py-7 bg-brand-red text-white font-black rounded-[2rem] shadow-3xl shadow-brand-red/20 flex justify-center items-center gap-5 uppercase tracking-[0.3em] hover:bg-brand-navy transition-all transform active:scale-95 text-xs"
                            >
                                <MessageCircleIcon className="w-7 h-7" /> Enviar Pedido por WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
