
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, CheckBadgeIcon, ClockIcon, CheckCircleIcon, SparklesIcon
} from '../components/Icons';
import { getProductos, createPublicPedido } from '../services/mockApi';
import { Producto } from '../types';
import { formatCurrency } from '../utils';
import AIHelper from '../components/AIHelper';
import QuickQuoteCalculator from '../components/QuickQuoteCalculator';

// --- UTILIDADES DE INTERFAZ ---

// Scroll Suave
const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
};

// --- SECCIONES ---

const Header: React.FC<{ cartCount: number, onOpenCart: () => void }> = ({ cartCount, onOpenCart }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header 
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
                scrolled 
                ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-100 py-2' 
                : 'bg-transparent py-6'
            }`}
        >
            <nav className="container mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className={`p-1 rounded-lg transition-colors duration-300 ${scrolled ? 'bg-transparent' : 'bg-white/20 backdrop-blur-sm'}`}>
                        <CordovaLogo className="h-12 w-auto object-contain" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className={`text-xs font-bold tracking-[0.3em] uppercase mb-0.5 ${scrolled ? 'text-slate-500' : 'text-blue-100'}`}>
                            Imprenta
                        </span>
                        <span className={`text-2xl font-black tracking-tighter uppercase ${scrolled ? 'text-brand-blue' : 'text-white'}`}>
                            CÓRDOVA
                        </span>
                    </div>
                </Link>
                
                <div className="flex items-center gap-8">
                    <nav className="hidden md:flex gap-8 text-sm font-bold uppercase tracking-wide">
                        <a 
                            href="#servicios" 
                            onClick={(e) => scrollToSection(e, 'servicios')} 
                            className={`transition-all duration-300 relative group ${scrolled ? 'text-slate-600 hover:text-brand-blue' : 'text-slate-200 hover:text-white'}`}
                        >
                            Servicios
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-red transition-all duration-300 group-hover:w-full"></span>
                        </a>
                        <a 
                            href="#ai-helper" 
                            onClick={(e) => scrollToSection(e, 'ai-helper')} 
                            className={`transition-all duration-300 relative group flex items-center gap-1 ${scrolled ? 'text-purple-600 hover:text-purple-800' : 'text-purple-200 hover:text-white'}`}
                        >
                            <SparklesIcon className="w-3 h-3" />
                            IA Creativa
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full"></span>
                        </a>
                        <a 
                            href="#catalog" 
                            onClick={(e) => scrollToSection(e, 'catalog')} 
                            className={`transition-all duration-300 relative group ${scrolled ? 'text-slate-600 hover:text-brand-blue' : 'text-slate-200 hover:text-white'}`}
                        >
                            Catálogo
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-red transition-all duration-300 group-hover:w-full"></span>
                        </a>
                    </nav>

                    <div className="flex items-center gap-4">
                        <button onClick={onOpenCart} className="relative group p-2">
                            <ShoppingCartIcon className={`w-6 h-6 transition-colors ${scrolled ? 'text-slate-700 group-hover:text-brand-blue' : 'text-white group-hover:text-brand-blue'}`} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm animate-pulse">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <Link 
                            to="/login" 
                            className={`hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                                scrolled 
                                ? 'bg-brand-blue text-white hover:bg-blue-800' 
                                : 'bg-white text-brand-blue hover:bg-blue-50'
                            }`}
                        >
                            <UsersIcon className="w-4 h-4" />
                            Gestión Interna
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
};

const HeroSection: React.FC = () => (
    <section className="relative bg-brand-blue pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden min-h-[85vh] flex items-center">
        {/* Background Gradients & Texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-brand-blue to-blue-800"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        {/* Decorative Shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-red/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

        <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                
                {/* Left Column: Content */}
                <div className="space-y-8 text-center lg:text-left animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-sm mx-auto lg:mx-0">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        <span className="text-xs font-bold text-white tracking-widest uppercase">Servicio Express en Pasaje</span>
                    </div>

                    <div>
                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight drop-shadow-2xl mb-4">
                            IMPRENTA <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">CÓRDOVA</span>
                        </h1>
                        
                        <p className="text-2xl md:text-3xl font-bold text-blue-200 tracking-wide border-l-4 border-orange-500 pl-4">
                            TU MARCA MERECE BRILLAR
                        </p>
                    </div>

                    <p className="text-lg sm:text-xl text-blue-100 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed">
                        Desde gigantografías de alto impacto hasta facturación SRI. 
                        Combinamos <span className="font-bold text-white">tecnología Roland</span> con acabados artesanales de primera.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                        <a href="#contact" className="group relative px-8 py-4 bg-brand-red overflow-hidden rounded-xl font-bold text-white tracking-wider shadow-lg shadow-red-900/30 transition-all hover:shadow-xl hover:scale-105 hover:bg-red-700 flex items-center justify-center gap-3">
                            <PhoneIcon className="w-5 h-5"/> COTIZAR AHORA
                        </a>
                        <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="px-8 py-4 bg-white/10 border border-white/30 text-white font-bold rounded-xl hover:bg-white hover:text-brand-blue transition-all shadow-lg flex items-center justify-center gap-2 backdrop-blur-sm">
                            VER CATÁLOGO <ArrowRightIcon className="w-5 h-5"/>
                        </a>
                    </div>

                    <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 opacity-80">
                        <div className="flex items-center gap-2">
                            <CheckBadgeIcon className="w-5 h-5 text-green-400" />
                            <span className="text-sm font-medium text-blue-100">Autorizado SRI</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckBadgeIcon className="w-5 h-5 text-green-400" />
                            <span className="text-sm font-medium text-blue-100">Calidad HD</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckBadgeIcon className="w-5 h-5 text-green-400" />
                            <span className="text-sm font-medium text-blue-100">Entrega Puntual</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Calculator (Replacing static image for better conversion) */}
                <div className="relative hidden lg:block">
                    <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                        <QuickQuoteCalculator />
                    </div>
                    {/* Decorative Blob behind calculator */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/5 rounded-full blur-3xl -z-0"></div>
                </div>
            </div>
        </div>
    </section>
);

const ServicesSection: React.FC = () => {
    const services = [
        { title: "Gigantografías", desc: "Lonas y Vinilos en alta resolución Roland.", icon: <MapPinIcon className="w-8 h-8 text-blue-600"/>, bg: "bg-blue-50" },
        { title: "Facturación SRI", desc: "Facturas, Notas de Venta y Retenciones.", icon: <ShieldCheckIcon className="w-8 h-8 text-red-600"/>, bg: "bg-red-50" },
        { title: "Publicidad", desc: "Volantes, Trípticos y Afiches full color.", icon: <UsersIcon className="w-8 h-8 text-yellow-600"/>, bg: "bg-yellow-50" },
        { title: "Sublimación", desc: "Tazas, Gorras y Camisetas personalizadas.", icon: <BoxIcon className="w-8 h-8 text-purple-600"/>, bg: "bg-purple-50" },
        { title: "Imprenta Offset", desc: "Grandes volúmenes a bajo costo.", icon: <ClockIcon className="w-8 h-8 text-green-600"/>, bg: "bg-green-50" },
        { title: "Acabados", desc: "Troquelados, Laminados y Barniz UV.", icon: <StarIcon className="w-8 h-8 text-orange-600"/>, bg: "bg-orange-50" },
    ];

    return (
        <section id="servicios" className="py-24 bg-white relative">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-brand-red font-bold tracking-widest uppercase text-xs bg-red-50 px-3 py-1 rounded-full">Nuestros Servicios</span>
                    <h2 className="text-4xl font-black text-slate-900 mt-4">SOLUCIONES INTEGRALES</h2>
                    <p className="text-slate-500 mt-2 text-lg">Todo lo que tu empresa necesita para destacar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((s, i) => (
                        <div key={i} className="group bg-white border border-slate-100 p-8 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
                            <div className={`${s.bg} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform group-hover:rotate-6 transition-transform duration-300`}>
                                {s.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-brand-blue transition-colors">{s.title}</h3>
                            <p className="text-slate-600 leading-relaxed">{s.desc}</p>
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
        getProductos().then(data => setProductos(data.slice(0, 6))); 
    }, []);

    return (
        <section id="catalog" className="py-24 bg-slate-50 relative">
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900">CATÁLOGO ONLINE</h2>
                        <p className="text-slate-500 mt-2">Precios directos de imprenta. Haz tu pedido ahora.</p>
                    </div>
                    <a href="#catalog" className="px-6 py-3 bg-white border border-slate-200 text-brand-blue font-bold rounded-lg hover:bg-brand-blue hover:text-white transition-all shadow-sm flex items-center gap-2">
                        VER TODO <ArrowRightIcon className="w-4 h-4"/>
                    </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {productos.map((p) => (
                        <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-300 border border-slate-100">
                            <div className="relative h-64 bg-slate-100 overflow-hidden">
                                {p.imagenUrl ? (
                                    <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <BoxIcon className="w-16 h-16" />
                                    </div>
                                )}
                                {p.esSRI && (
                                    <span className="absolute top-4 left-4 bg-brand-blue text-white text-[10px] font-bold px-3 py-1 rounded-md shadow-sm">AUTORIZADO SRI</span>
                                )}
                                <div className="absolute inset-0 bg-brand-blue/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                    <button onClick={() => onAddToCart(p)} className="bg-white text-brand-blue font-bold py-3 px-8 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-brand-red hover:text-white shadow-xl flex items-center gap-2">
                                        <AddIcon className="w-5 h-5"/> AGREGAR
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{p.categoria}</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-3 truncate group-hover:text-brand-blue transition-colors">{p.nombre}</h3>
                                <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-0.5">Precio Unitario</p>
                                        <span className="text-2xl font-black text-slate-800">{formatCurrency(p.precio)}</span>
                                    </div>
                                    <button onClick={() => onAddToCart(p)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-brand-blue hover:text-white transition-colors">
                                        <ShoppingCartIcon className="w-5 h-5"/>
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

const Footer: React.FC = () => (
    <footer className="bg-slate-900 text-white pt-20 pb-10">
        <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-1 md:col-span-2">
                    <Link to="/" className="flex items-center gap-2 mb-6">
                        <div className="bg-white p-1 rounded-lg">
                            <CordovaLogo className="h-10 w-auto object-contain" />
                        </div>
                        <span className="text-2xl font-black uppercase tracking-tighter">Imprenta Córdova</span>
                    </Link>
                    <p className="text-slate-400 max-w-sm mb-6 font-light leading-relaxed">
                        Más de 15 años brindando soluciones de impresión de calidad en Pasaje. Tecnología moderna y atención personalizada.
                    </p>
                    <div className="flex gap-4">
                        {['Facebook', 'Instagram', 'WhatsApp'].map((s) => (
                            <div key={s} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-brand-blue hover:border-brand-blue transition-all cursor-pointer text-xs font-bold uppercase tracking-wider">
                                {s}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs border-b border-slate-700 pb-2 inline-block">Enlaces Rápidos</h4>
                    <ul className="space-y-3 text-slate-400 text-sm">
                        <li><a href="#" className="hover:text-brand-blue transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-brand-red rounded-full"></span>Inicio</a></li>
                        <li><a href="#servicios" className="hover:text-brand-blue transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-brand-red rounded-full"></span>Servicios</a></li>
                        <li><a href="#catalog" className="hover:text-brand-blue transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-brand-red rounded-full"></span>Catálogo</a></li>
                        <li><Link to="/login" className="hover:text-brand-blue transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-brand-red rounded-full"></span>Acceso Personal</Link></li>
                    </ul>
                </div>
                
                <div>
                    <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs border-b border-slate-700 pb-2 inline-block">Contáctanos</h4>
                    <ul className="space-y-4 text-slate-400 text-sm">
                        <li className="flex items-start gap-3">
                            <MapPinIcon className="w-5 h-5 text-brand-red mt-0.5 flex-shrink-0"/>
                            <span>Colón E/ Sucre y Rocafuerte.<br/>Pasaje, El Oro, Ecuador.</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <PhoneIcon className="w-5 h-5 text-brand-blue flex-shrink-0"/>
                            <span className="font-bold text-white">099 308 3943</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <EnvelopeIcon className="w-5 h-5 text-green-500 flex-shrink-0"/>
                            imprentacordova@gmail.com
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
                <p>&copy; 2025 Imprenta Córdova. Todos los derechos reservados.</p>
                <p className="mt-2 md:mt-0 flex items-center gap-1">Desarrollado con tecnología <span className="text-brand-blue font-bold">React</span> & <span className="text-brand-blue font-bold">Gemini AI</span>.</p>
            </div>
        </div>
    </footer>
);

// --- MAIN COMPONENT ---

// Reusing the existing CartModal logic
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
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
                                            <button onClick={() => onRemoveItem(item.producto.id)} className="text-red-300 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5" /></button>
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

const LandingPage: React.FC = () => {
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
        setCartItems([]);
    };

    const cartCount = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth">
            <Header cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />
            <main>
                <HeroSection />
                <ServicesSection />
                {/* Adding Quick Quote Calculator here */}
                <div className="relative py-16 bg-slate-50">
                    <div className="container mx-auto px-6 relative z-10 flex justify-center">
                        <div className="w-full max-w-4xl transform hover:scale-[1.01] transition-transform duration-500">
                            <QuickQuoteCalculator />
                        </div>
                    </div>
                </div>
                <AIHelper />
                <CatalogPreview onAddToCart={handleAddToCart} />
            </main>
            <Footer />
            <div className="fixed bottom-8 right-8 z-40">
                <button 
                    onClick={() => setIsCartOpen(true)} 
                    className="bg-brand-red text-white p-4 rounded-full shadow-[0_10px_30px_rgba(217,0,0,0.4)] hover:scale-110 transition-transform hover:shadow-[0_15px_40px_rgba(217,0,0,0.5)]"
                >
                    <ShoppingCartIcon className="w-8 h-8" />
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-white text-brand-red text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md border border-red-100">
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

export default LandingPage;
