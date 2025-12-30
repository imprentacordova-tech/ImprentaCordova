
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, CheckCircleIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, PrinterIcon, CheckBadgeIcon, ClockIcon,
    SearchIcon, SparklesIcon
} from '../components/Icons';
import { getProductos, createPublicPedido } from '../services/mockApi';
import { Producto } from '../types';
import { formatCurrency } from '../utils';

const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
    }
};

const LandingPage: React.FC = () => {
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'info' | 'success'>('cart');
    const [clientData, setClientData] = useState({ nombre: '', telefono: '', email: '' });

    useEffect(() => {
        getProductos().then(data => {
            setProductos(data.slice(0, 8));
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

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        await createPublicPedido(clientData, cartItems);
        setCheckoutStep('success');
        setCartItems([]);
    };

    const total = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    const cartCount = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 py-4 px-6">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <CordovaLogo className="h-10 w-auto" />
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imprenta</span>
                            <span className="text-xl font-black text-brand-blue uppercase tracking-tighter">Córdova</span>
                        </div>
                    </div>
                    <div className="hidden md:flex gap-8 items-center text-xs font-black uppercase tracking-widest text-slate-600">
                        <a href="#home" onClick={(e) => scrollToSection(e, 'home')} className="hover:text-brand-blue transition-colors">Inicio</a>
                        <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="hover:text-brand-blue transition-colors">Catálogo</a>
                        <Link to="/tracking" className="text-brand-red hover:text-red-700 transition-colors">Seguimiento</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-all">
                            <ShoppingCartIcon className="w-6 h-6 text-brand-blue" />
                            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{cartCount}</span>}
                        </button>
                        <Link to="/login" className="bg-brand-blue text-white px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-brand-navy transition-all shadow-lg">Acceso</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section id="home" className="pt-40 pb-24 bg-gradient-to-br from-brand-blue to-indigo-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -mr-64 -mt-64"></div>
                <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left space-y-8">
                        <span className="inline-block bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Pasaje • El Oro • Ecuador</span>
                        <h1 className="text-5xl lg:text-8xl font-black leading-none tracking-tighter uppercase italic">Tu Marca en <br/><span className="text-brand-red">Alta Definición</span></h1>
                        <p className="text-xl text-blue-100 font-light max-w-xl">Especialistas en gigantografías HD, facturación autorizada SRI y material publicitario que hace destacar tu negocio.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link to="/tracking" className="bg-white text-brand-blue px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                                <ClockIcon className="w-5 h-5"/> Rastrear mi pedido
                            </Link>
                            <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="bg-brand-red text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-3">
                                <BoxIcon className="w-5 h-5"/> Ver Catálogo
                            </a>
                        </div>
                    </div>
                    <div className="hidden lg:block relative">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-3xl animate-float">
                            <img src="https://i.imgur.com/kzhXFkE.png" className="w-full h-auto brightness-0 invert opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" alt="" />
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><ShieldCheckIcon className="w-6 h-6 text-white"/></div>
                                    <p className="font-bold text-lg uppercase tracking-tight">Garantía SRI 100%</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><PrinterIcon className="w-6 h-6 text-white"/></div>
                                    <p className="font-bold text-lg uppercase tracking-tight">Tecnología Roland HD</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><CheckBadgeIcon className="w-6 h-6 text-white"/></div>
                                    <p className="font-bold text-lg uppercase tracking-tight">Entrega Express</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Catalog */}
            <section id="catalog" className="py-24 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div>
                            <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-4 block">Catálogo Online</span>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Nuestros <span className="text-brand-blue">Servicios</span></h2>
                        </div>
                        <div className="relative w-full md:w-80">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input type="text" placeholder="Buscar producto..." className="w-full pl-12 pr-6 py-4 bg-white border-none rounded-2xl shadow-sm text-sm font-bold focus:ring-2 focus:ring-brand-blue transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? [...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl h-80 animate-pulse border border-slate-100"></div>
                        )) : productos.map(p => (
                            <div key={p.id} className="group bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                <div className="h-48 bg-slate-100 relative overflow-hidden">
                                    {p.imagenUrl ? <img src={p.imagenUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.nombre}/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><BoxIcon className="w-16 h-16"/></div>}
                                    <div className="absolute inset-0 bg-brand-blue/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => handleAddToCart(p)} className="bg-white text-brand-blue px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Agregar al Carrito</button>
                                    </div>
                                    {p.esSRI && <span className="absolute top-4 left-4 bg-white text-brand-blue text-[8px] font-black px-2 py-1 rounded shadow-sm tracking-widest uppercase">SRI</span>}
                                </div>
                                <div className="p-6">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.categoria}</p>
                                    <h3 className="font-black text-slate-800 uppercase text-sm truncate mb-4 group-hover:text-brand-blue transition-colors">{p.nombre}</h3>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                        <span className="text-xl font-black text-slate-900">{formatCurrency(p.precio)}</span>
                                        <button onClick={() => handleAddToCart(p)} className="p-2 bg-slate-50 text-slate-400 hover:text-brand-red transition-colors rounded-lg"><AddIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Cart Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex justify-end p-4 animate-fade-in" onClick={() => setIsCartOpen(false)}>
                    <div className="bg-white h-full w-full max-w-md rounded-[2.5rem] shadow-3xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-brand-blue uppercase tracking-tighter flex items-center gap-3"><ShoppingCartIcon className="w-7 h-7"/> Mi Pedido</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><CloseIcon className="w-6 h-6 text-slate-400"/></button>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto p-8 space-y-4 custom-scrollbar">
                            {checkoutStep === 'success' ? (
                                <div className="text-center py-20 space-y-6">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"><CheckCircleIcon className="w-10 h-10 text-green-500"/></div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900">¡Pedido Recibido!</h3>
                                    <p className="text-slate-500 text-sm font-medium">Gracias <b>{clientData.nombre}</b>. Procesaremos tu cotización y te contactaremos al <b>{clientData.telefono}</b> en minutos.</p>
                                    <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} className="w-full py-4 bg-brand-blue text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px]">Cerrar</button>
                                </div>
                            ) : checkoutStep === 'info' ? (
                                <form onSubmit={handleCheckout} className="space-y-6">
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre Completo</label><input required value={clientData.nombre} onChange={e => setClientData({...clientData, nombre: e.target.value.toUpperCase()})} type="text" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-brand-blue" /></div>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Celular / WhatsApp</label><input required value={clientData.telefono} onChange={e => setClientData({...clientData, telefono: e.target.value})} type="tel" className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-brand-blue" placeholder="099..." /></div>
                                    <button type="submit" className="w-full py-5 bg-brand-red text-white font-black rounded-2xl shadow-xl uppercase tracking-[0.2em] text-[10px]">Confirmar Cotización</button>
                                </form>
                            ) : cartItems.length === 0 ? (
                                <div className="text-center py-20 opacity-30"><BoxIcon className="w-20 h-20 mx-auto mb-4"/><p className="font-black uppercase text-xs tracking-widest">El carrito está vacío</p></div>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.producto.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                        <div className="min-w-0 flex-grow pr-4">
                                            <p className="font-black text-xs uppercase truncate text-slate-900">{item.producto.nombre}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.cantidad} x {formatCurrency(item.producto.precio)}</p>
                                        </div>
                                        <button onClick={() => setCartItems(cartItems.filter(i => i.producto.id !== item.producto.id))} className="text-slate-300 hover:text-brand-red"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                ))
                            )}
                        </div>

                        {checkoutStep === 'cart' && cartItems.length > 0 && (
                            <div className="p-8 border-t border-slate-50 space-y-6">
                                <div className="flex justify-between items-end"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Estimado</span><span className="text-3xl font-black text-brand-blue tracking-tighter">{formatCurrency(total)}</span></div>
                                <button onClick={() => setCheckoutStep('info')} className="w-full py-5 bg-brand-blue text-white font-black rounded-2xl shadow-xl uppercase tracking-[0.2em] text-[10px] hover:bg-brand-navy transition-all">Continuar a Facturación</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <footer className="bg-slate-950 text-white py-20 border-t border-white/5">
                <div className="container mx-auto px-6 text-center space-y-8">
                    <div className="flex justify-center items-center gap-3">
                        <CordovaLogo className="h-12 w-auto brightness-0 invert" />
                        <span className="text-3xl font-black tracking-tighter uppercase italic">IMPRENTA <span className="text-brand-red">CÓRDOVA</span></span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto pt-10">
                        <div className="space-y-3"><MapPinIcon className="w-8 h-8 text-brand-red mx-auto"/><p className="text-xs font-bold uppercase tracking-widest">Colón E/ Sucre y Rocafuerte <br/> Pasaje, El Oro</p></div>
                        <div className="space-y-3"><PhoneIcon className="w-8 h-8 text-brand-blue mx-auto"/><p className="text-xs font-bold uppercase tracking-widest">099 308 3943</p></div>
                        <div className="space-y-3"><EnvelopeIcon className="w-8 h-8 text-green-500 mx-auto"/><p className="text-xs font-bold uppercase tracking-widest">imprentacordova@gmail.com</p></div>
                    </div>
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] pt-20">Imprenta Córdova &copy; 2025 • Todos los derechos reservados</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
