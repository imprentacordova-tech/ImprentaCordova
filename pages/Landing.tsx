
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, CheckBadgeIcon, ClockIcon, SparklesIcon, CalculatorIcon, WalletIcon, CheckCircleIcon
} from '../components/Icons';
import { getProductos, createPublicPedido } from '../services/mockApi';
import { Producto } from '../types';
import { formatCurrency } from '../utils';
import AIHelper from '../components/AIHelper';
import QuickQuoteCalculator from '../components/QuickQuoteCalculator';

// --- UTILIDADES ---
const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};

// --- COMPONENTES UI ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title?: string }> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-in-up border border-white/20" onClick={e => e.stopPropagation()}>
                {title && (
                    <div className="absolute top-4 left-6 z-10">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
                    </div>
                )}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 z-20 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                {children}
            </div>
        </div>
    );
};

const Header: React.FC<{ cartCount: number, onOpenCart: () => void, onOpenQuote: () => void }> = ({ cartCount, onOpenCart, onOpenQuote }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header 
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
                scrolled 
                ? 'bg-white/80 backdrop-blur-lg shadow-sm py-3' 
                : 'bg-transparent py-6'
            }`}
        >
            <div className="container mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className={`transition-transform duration-500 ${scrolled ? 'scale-90' : 'scale-100'}`}>
                        <CordovaLogo className={`h-10 w-auto object-contain transition-all ${scrolled ? 'brightness-100' : 'brightness-0 invert'}`} />
                    </div>
                    <div className={`flex flex-col leading-none transition-colors duration-300 ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                        <span className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-80">Imprenta</span>
                        <span className="text-xl font-black tracking-widest uppercase">CÓRDOVA</span>
                    </div>
                </Link>
                
                <div className="flex items-center gap-6">
                    <nav className={`hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                        <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')} className="hover:text-brand-blue transition-colors">Servicios</a>
                        <a href="#ai-helper" onClick={(e) => scrollToSection(e, 'ai-helper')} className="hover:text-purple-400 transition-colors flex items-center gap-1"><SparklesIcon className="w-3 h-3"/> IA Creativa</a>
                        <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="hover:text-brand-blue transition-colors">Catálogo</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onOpenQuote}
                            className={`hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all shadow-lg hover:-translate-y-0.5 ${
                                scrolled 
                                ? 'bg-gradient-to-r from-brand-blue to-blue-700 text-white' 
                                : 'bg-white text-brand-blue hover:bg-blue-50'
                            }`}
                        >
                            <CalculatorIcon className="w-4 h-4" />
                            Cotizador IA
                        </button>

                        <button onClick={onOpenCart} className="relative group p-2">
                            <div className={`p-2 rounded-full transition-colors ${scrolled ? 'bg-gray-100 hover:bg-gray-200 text-slate-700' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
                                <ShoppingCartIcon className="w-5 h-5" />
                            </div>
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm animate-bounce">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const HeroSection: React.FC<{ onOpenQuote: () => void }> = ({ onOpenQuote }) => (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-900">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-900/80 to-slate-900 z-10"></div>
            <img 
                src="https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&q=80&w=2000" 
                alt="Imprenta Background" 
                className="w-full h-full object-cover opacity-40 animate-pulse-slow scale-105"
            />
        </div>

        {/* Decorative Light Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-blue/20 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>

        <div className="container mx-auto px-6 relative z-20 pt-20">
            <div className="max-w-4xl mx-auto text-center space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-white tracking-widest uppercase">Tecnología Roland &bull; Pasaje, El Oro</span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight drop-shadow-2xl animate-fade-in-up animation-delay-300">
                    IMPRESIÓN <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200">
                        SIN LÍMITES
                    </span>
                </h1>

                <p className="text-lg md:text-2xl text-slate-300 font-light max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-500">
                    Elevamos tu marca con impresiones de <span className="text-white font-medium">alta definición</span> y acabados premium. Desde tarjetas personales hasta gigantografías monumentales.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8 animate-fade-in-up animation-delay-700">
                    <button 
                        onClick={onOpenQuote}
                        className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-purple-600" />
                            Cotizar con IA
                        </span>
                    </button>
                    
                    <a 
                        href="#catalog" 
                        onClick={(e) => scrollToSection(e, 'catalog')}
                        className="px-8 py-4 bg-white/5 border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur-sm flex items-center justify-center gap-2"
                    >
                        Ver Catálogo <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
                <div className="w-1 h-2 bg-white rounded-full"></div>
            </div>
        </div>
    </section>
);

const ServiceCard: React.FC<{ title: string; desc: string; icon: React.FC<any>; delay: number }> = ({ title, desc, icon: Icon, delay }) => (
    <div 
        className="group p-8 bg-white rounded-3xl border border-slate-100 hover:border-blue-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700"></div>
        
        <div className="relative z-10">
            <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-brand-blue group-hover:border-brand-blue transition-colors duration-300">
                <Icon className="w-7 h-7 text-slate-700 group-hover:text-white transition-colors duration-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-500 leading-relaxed text-sm font-medium">{desc}</p>
        </div>
    </div>
);

const ServicesSection: React.FC = () => {
    const services = [
        { title: "Gigantografías HD", desc: "Gran formato con tecnología Roland. Colores vibrantes y durabilidad garantizada para exteriores.", icon: MapPinIcon },
        { title: "Imprenta Autorizada", desc: "Facturación electrónica y física autorizada por el SRI. Cumplimos con todas las normativas.", icon: ShieldCheckIcon },
        { title: "Marketing Impreso", desc: "Volantes, trípticos y material POP que vende. Diseño estratégico incluido.", icon: UsersIcon },
        { title: "Personalización", desc: "Merchandising corporativo: Tazas, gorras, camisetas con tu marca.", icon: BoxIcon },
        { title: "Acabados de Lujo", desc: "Troquelados, barniz UV, laminados mate y brillante para destacar.", icon: StarIcon },
        { title: "Entrega Express", desc: "Respetamos tu tiempo. Procesos optimizados para entregas puntuales.", icon: ClockIcon },
    ];

    return (
        <section id="servicios" className="py-32 bg-slate-50">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <span className="text-brand-blue font-black tracking-widest uppercase text-xs mb-2 block">Nuestra Excelencia</span>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Soluciones Integrales</h2>
                    <p className="text-slate-500 mt-6 text-lg">
                        Más que una imprenta, somos tu socio estratégico en comunicación visual. Calidad que se ve y se siente.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((s, i) => (
                        <ServiceCard key={i} {...s} delay={i * 100} />
                    ))}
                </div>
            </div>
        </section>
    );
};

const CatalogSection: React.FC<{ onAddToCart: (p: Producto) => void }> = ({ onAddToCart }) => {
    const [productos, setProductos] = useState<Producto[]>([]);

    useEffect(() => {
        getProductos().then(data => setProductos(data.slice(0, 8))); 
    }, []);

    return (
        <section id="catalog" className="py-32 bg-white relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Catálogo Premium</h2>
                        <p className="text-slate-500">Selección de nuestros productos más solicitados.</p>
                    </div>
                    <Link to="/login" className="text-brand-blue font-bold hover:text-blue-800 transition-colors flex items-center gap-2">
                        Ver Lista Completa <ArrowRightIcon className="w-5 h-5"/>
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {productos.map((p) => (
                        <div key={p.id} className="group bg-white rounded-3xl border border-slate-100 hover:border-slate-200 hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer">
                            <div className="relative h-64 overflow-hidden bg-slate-50">
                                {p.imagenUrl ? (
                                    <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                                        <BoxIcon className="w-20 h-20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                                    <button 
                                        onClick={() => onAddToCart(p)}
                                        className="bg-white text-brand-blue font-bold py-3 px-6 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl flex items-center gap-2 hover:bg-brand-blue hover:text-white"
                                    >
                                        <AddIcon className="w-5 h-5"/> Agregar
                                    </button>
                                </div>
                                {p.esSRI && (
                                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur text-brand-blue text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                        SRI
                                    </span>
                                )}
                            </div>
                            <div className="p-6">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{p.categoria}</p>
                                <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">{p.nombre}</h3>
                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                                    <span className="text-xl font-black text-slate-800">{formatCurrency(p.precio)}</span>
                                    <button onClick={() => onAddToCart(p)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-brand-blue hover:text-white transition-colors">
                                        <ArrowRightIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Reusing existing CartModal logic exactly as is
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-white/10" onClick={e => e.stopPropagation()}>
                {step === 'cart' && (
                    <>
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <ShoppingCartIcon className="w-6 h-6 text-brand-blue" /> Tu Pedido
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 transition-colors"><CloseIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-grow space-y-4 bg-gray-50 dark:bg-slate-950/50">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <BoxIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Tu carrito está vacío.</p>
                                </div>
                            ) : (
                                cartItems.map(item => (
                                    <div key={item.producto.id} className="flex justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                                        <div className="flex-grow">
                                            <p className="font-bold text-sm text-slate-800 dark:text-white">{item.producto.nombre}</p>
                                            <p className="text-xs text-gray-500">{formatCurrency(item.producto.precio)} c/u</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                                                <button onClick={() => onUpdateQuantity(item.producto.id, -1)} className="w-7 h-7 flex items-center justify-center font-bold hover:bg-white dark:hover:bg-slate-600 rounded-md text-gray-600 dark:text-gray-300 transition-all">-</button>
                                                <span className="text-sm font-bold w-6 text-center text-slate-800 dark:text-white">{item.cantidad}</span>
                                                <button onClick={() => onUpdateQuantity(item.producto.id, 1)} className="w-7 h-7 flex items-center justify-center font-bold hover:bg-white dark:hover:bg-slate-600 rounded-md text-gray-600 dark:text-gray-300 transition-all">+</button>
                                            </div>
                                            <button onClick={() => onRemoveItem(item.producto.id)} className="text-red-300 hover:text-red-500 transition-colors p-1" title="Eliminar"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cartItems.length > 0 && (
                            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-bold text-gray-500 text-xs uppercase tracking-wider">Total Estimado</span>
                                    <span className="text-3xl font-black text-brand-blue">{formatCurrency(total)}</span>
                                </div>
                                <button onClick={() => setStep('info')} className="w-full py-4 bg-brand-red text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all transform active:scale-95 flex justify-center items-center gap-2 uppercase tracking-wide">
                                    Continuar
                                </button>
                            </div>
                        )}
                    </>
                )}

                {step === 'info' && (
                    <>
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-900">
                            <button onClick={() => setStep('cart')} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500"><ArrowRightIcon className="w-5 h-5 transform rotate-180" /></button>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Datos de Facturación</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-y-auto bg-gray-50 dark:bg-slate-950/30">
                            <div className="p-6 space-y-5">
                                <div className="flex bg-gray-200 dark:bg-slate-800 p-1 rounded-xl mb-2">
                                    <button type="button" onClick={() => setTipoDocumento('Recibo')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${tipoDocumento === 'Recibo' ? 'bg-white dark:bg-slate-600 text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                                        Recibo Simple
                                    </button>
                                    <button type="button" onClick={() => setTipoDocumento('SRI')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${tipoDocumento === 'SRI' ? 'bg-white dark:bg-slate-600 text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>
                                        Factura SRI
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase tracking-wide ml-1">Nombre / Razón Social</label>
                                    <input required type="text" className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all" value={clientData.nombre} onChange={e => setClientData({...clientData, nombre: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase tracking-wide ml-1">Teléfono / WhatsApp</label>
                                    <input required type="tel" className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all" value={clientData.telefono} onChange={e => setClientData({...clientData, telefono: e.target.value})} maxLength={10} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase tracking-wide ml-1">Email {tipoDocumento === 'Recibo' && '(Opcional)'}</label>
                                    <input type={tipoDocumento === 'SRI' ? "email" : "text"} required={tipoDocumento === 'SRI'} className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all" value={clientData.email} onChange={e => setClientData({...clientData, email: e.target.value})} />
                                </div>

                                {tipoDocumento === 'SRI' && (
                                    <div className="space-y-5 pt-4 border-t border-gray-200 dark:border-slate-800 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase tracking-wide ml-1">RUC / Cédula</label>
                                                <input required type="text" className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all" value={clientData.ruc} onChange={e => setClientData({...clientData, ruc: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase tracking-wide ml-1">Régimen</label>
                                                <select className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm transition-all" value={clientData.regimen} onChange={e => setClientData({...clientData, regimen: e.target.value})}>
                                                    <option value="General">General</option>
                                                    <option value="Rimpe Negocio Popular">Negocio Popular</option>
                                                    <option value="Rimpe Emprendedor">Emprendedor</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1.5 text-gray-500 uppercase tracking-wide ml-1">Dirección</label>
                                            <input required type="text" className="w-full p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all" value={clientData.direccion} onChange={e => setClientData({...clientData, direccion: e.target.value})} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                                <button type="submit" className="w-full py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide">
                                    <CheckCircleIcon className="w-6 h-6"/>
                                    Confirmar Pedido
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {step === 'success' && (
                    <div className="p-10 text-center flex flex-col items-center justify-center h-full bg-white dark:bg-slate-900">
                        <div className="w-28 h-28 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce shadow-sm">
                            <CheckCircleIcon className="w-14 h-14 text-green-500" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">¡LISTO!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-xs mx-auto text-lg leading-relaxed">
                            Gracias <strong>{clientData.nombre}</strong>.<br/>
                            Tu pedido ha sido enviado al taller. Te contactaremos pronto.
                        </p>
                        <button onClick={onClose} className="px-10 py-4 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-800 transition-all shadow-xl hover:-translate-y-1 uppercase tracking-wider">
                            Cerrar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const Footer: React.FC = () => (
    <footer className="bg-slate-900 text-white py-20 border-t border-white/5">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="bg-white p-1 rounded-lg">
                            <CordovaLogo className="h-8 w-auto object-contain" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-widest text-white">CÓRDOVA</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-sm">
                        Excelencia gráfica y tecnología de vanguardia al servicio de tu marca. Más de 15 años de experiencia en Pasaje.
                    </p>
                </div>
                
                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Servicios</h4>
                    <ul className="space-y-3 text-slate-400 text-sm">
                        <li className="hover:text-white transition-colors cursor-pointer">Gigantografías</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Imprenta Offset</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Facturación SRI</li>
                        <li className="hover:text-white transition-colors cursor-pointer">Merchandising</li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Contacto</h4>
                    <ul className="space-y-4 text-slate-400 text-sm">
                        <li className="flex items-center gap-3">
                            <PhoneIcon className="w-4 h-4 text-brand-blue"/> 099 308 3943
                        </li>
                        <li className="flex items-center gap-3">
                            <EnvelopeIcon className="w-4 h-4 text-brand-blue"/> imprentacordova@gmail.com
                        </li>
                        <li className="flex items-start gap-3">
                            <MapPinIcon className="w-4 h-4 text-brand-blue mt-1"/> Colón e/ Sucre y Rocafuerte, Pasaje.
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Horario</h4>
                    <ul className="space-y-2 text-slate-400 text-sm">
                        <li className="flex justify-between"><span>Lun - Vie</span> <span className="text-white">08:30 - 18:30</span></li>
                        <li className="flex justify-between"><span>Sábados</span> <span className="text-white">09:00 - 13:00</span></li>
                        <li className="flex justify-between text-slate-600"><span>Domingos</span> <span>Cerrado</span></li>
                    </ul>
                </div>
            </div>
            
            <div className="border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600">
                <p>&copy; 2025 Imprenta Córdova. Todos los derechos reservados.</p>
                <div className="flex gap-4 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                    <a href="#" className="hover:text-white transition-colors">Términos</a>
                </div>
            </div>
        </div>
    </footer>
);

const LandingPage: React.FC = () => {
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);

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
        setCartItems([]);
    };

    const cartCount = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 scroll-smooth selection:bg-brand-blue selection:text-white">
            <Header cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} onOpenQuote={() => setIsQuoteOpen(true)} />
            
            <main>
                <HeroSection onOpenQuote={() => setIsQuoteOpen(true)} />
                <ServicesSection />
                <AIHelper />
                <CatalogSection onAddToCart={handleAddToCart} />
            </main>
            
            <Footer />

            {/* Floating Action Button for Calculator (Mobile/Tablet) */}
            <div className="fixed bottom-24 right-6 z-40 lg:hidden">
                <button 
                    onClick={() => setIsQuoteOpen(true)}
                    className="bg-brand-blue text-white p-4 rounded-full shadow-2xl shadow-blue-500/40 hover:scale-110 transition-transform active:scale-95"
                >
                    <CalculatorIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Floating Action Button for Cart */}
            <div className="fixed bottom-6 right-6 z-40">
                <button 
                    onClick={() => setIsCartOpen(true)} 
                    className="bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 border border-white/10"
                >
                    <ShoppingCartIcon className="w-6 h-6" />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>
            
            {/* Modals */}
            <CartModal 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onCheckout={handleCheckout}
            />

            <Modal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)}>
                <QuickQuoteCalculator />
            </Modal>
        </div>
    );
};

export default LandingPage;
