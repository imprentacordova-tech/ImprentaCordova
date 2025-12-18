
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, CheckBadgeIcon, ClockIcon, 
    SparklesIcon, CalculatorIcon, WalletIcon, CheckCircleIcon, PrinterIcon, 
    PaletteIcon, MessageCircleIcon, SendIcon, Loader2Icon
} from '../components/Icons';
import { getProductos, createPublicPedido } from '../services/mockApi';
import { Producto, ChatMessage } from '../types';
import { formatCurrency } from '../utils';
import AIHelper from '../components/AIHelper';
import { chatWithCustomer } from '../services/geminiService';

// --- UTILIDADES ---
const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// --- COMPONENTES UI ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title?: string }> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity"></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-bounce-in border border-white/20" onClick={e => e.stopPropagation()}>
                {title && (
                    <div className="absolute top-6 left-8 z-10">
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{title}</h3>
                    </div>
                )}
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 z-20 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
                <div className="pt-4">{children}</div>
            </div>
        </div>
    );
};

const Header: React.FC<{ cartCount: number, onOpenCart: () => void, onOpenQuote: () => void }> = ({ cartCount, onOpenCart, onOpenQuote }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 20;
            if (isScrolled !== scrolled) setScrolled(isScrolled);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolled]);

    return (
        <header 
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
                scrolled 
                ? 'bg-white/90 backdrop-blur-xl shadow-lg py-3' 
                : 'bg-transparent py-6'
            }`}
        >
            <div className="container mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className={`transition-transform duration-500 ${scrolled ? 'scale-90' : 'scale-110'}`}>
                        <CordovaLogo className={`h-10 w-auto object-contain transition-all ${scrolled ? 'brightness-100' : 'brightness-0 invert'}`} />
                    </div>
                    <div className={`flex flex-col leading-none transition-colors duration-300 ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                        <span className="text-[10px] font-black tracking-[0.5em] uppercase opacity-70">Imprenta</span>
                        <span className="text-xl font-black tracking-widest uppercase">CÓRDOVA</span>
                    </div>
                </Link>
                
                <div className="flex items-center gap-8">
                    <nav className={`hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                        <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')} className="hover:text-brand-blue transition-colors">Servicios</a>
                        <a href="#ai-helper" onClick={(e) => scrollToSection(e, 'ai-helper')} className="hover:text-purple-400 transition-colors flex items-center gap-1"><SparklesIcon className="w-3 h-3 animate-pulse"/> IA Creativa</a>
                        <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="hover:text-brand-blue transition-colors">Catálogo</a>
                        <Link to="/login" className={`px-3 py-1 rounded-full border transition-all ${scrolled ? 'border-brand-red text-brand-red hover:bg-brand-red hover:text-white' : 'border-white/40 text-white hover:bg-white hover:text-brand-blue'}`}>Acceso</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onOpenQuote}
                            className={`hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 ${
                                scrolled 
                                ? 'bg-brand-blue text-white' 
                                : 'bg-white text-brand-blue hover:bg-blue-50'
                            }`}
                        >
                            <CalculatorIcon className="w-4 h-4" /> Cotizar
                        </button>

                        <button onClick={onOpenCart} className="relative group p-2">
                            <div className={`p-2.5 rounded-full transition-all transform group-hover:scale-110 ${scrolled ? 'bg-brand-blue text-white shadow-lg' : 'bg-white/20 backdrop-blur-md text-white'}`}>
                                <ShoppingCartIcon className="w-6 h-6" />
                            </div>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
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

/* Fix: Added missing HeroSection component */
const HeroSection: React.FC<{ onOpenQuote: () => void }> = ({ onOpenQuote }) => (
    <section className="relative bg-brand-blue pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-brand-blue to-blue-800"></div>
        <div className="container mx-auto px-6 relative z-10 text-center lg:text-left">
            <h1 className="text-5xl lg:text-7xl font-black text-white mb-6">IMPRENTA CÓRDOVA</h1>
            <p className="text-xl text-blue-100 mb-8 max-w-xl">Líderes en artes gráficas y soluciones SRI en Pasaje.</p>
            <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={onOpenQuote} className="px-8 py-4 bg-brand-red text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all">SOLICITAR COTIZACIÓN</button>
                <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="px-8 py-4 bg-white/10 text-white border border-white/20 font-bold rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all">VER PRODUCTOS</a>
            </div>
        </div>
    </section>
);

/* Fix: Added missing ServicesSection component */
const ServicesSection: React.FC = () => (
    <section id="servicios" className="py-24 bg-white">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-slate-900">Nuestros Servicios</h2>
                <p className="text-slate-500 mt-2">Soluciones gráficas de alta calidad para su negocio.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { title: 'SRI', desc: 'Facturas y Notas de Venta autorizadas.', icon: <ShieldCheckIcon /> },
                    { title: 'Gigantografías', desc: 'Lonas y vinilos en HD.', icon: <PrinterIcon /> },
                    { title: 'Merchandising', desc: 'Tazas, gorras y más.', icon: <BoxIcon /> }
                ].map((s, i) => (
                    <div key={i} className="p-8 border border-slate-100 rounded-2xl hover:shadow-xl transition-all">
                        <div className="w-12 h-12 text-brand-blue mb-4">{s.icon}</div>
                        <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                        <p className="text-slate-600">{s.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

/* Fix: Added missing CatalogSection component */
const CatalogSection: React.FC<{ onAddToCart: (p: Producto) => void }> = ({ onAddToCart }) => {
    const [productos, setProductos] = useState<Producto[]>([]);
    useEffect(() => { getProductos().then(setProductos); }, []);
    return (
        <section id="catalog" className="py-24 bg-slate-50">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl font-black mb-12">Catálogo Destacado</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {productos.slice(0, 6).map(p => (
                        <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all">
                            <h3 className="font-bold text-lg mb-2">{p.nombre}</h3>
                            <p className="text-brand-blue font-black text-xl mb-4">{formatCurrency(p.precio)}</p>
                            <button onClick={() => onAddToCart(p)} className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-800 transition-colors">
                                <AddIcon className="w-5 h-5"/> Agregar al Carrito
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* Fix: Added missing LandingFooter component */
const LandingFooter: React.FC = () => (
    <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-6 text-center">
            <p>&copy; 2025 Imprenta Córdova. Pasaje, El Oro.</p>
        </div>
    </footer>
);

/* Fix: Added missing QuickQuoteCalculator component placeholder */
const QuickQuoteCalculator: React.FC = () => (
    <div className="text-center p-8">
        <CalculatorIcon className="w-16 h-16 text-brand-blue mx-auto mb-4" />
        <p className="text-lg font-bold">Cotizador Maestro</p>
        <p className="text-slate-500 mt-2">Próximamente disponible para autoservicio.</p>
    </div>
);

const AICustomerBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: '¡Hola! Soy Córdova-Bot. 👋 ¿Cómo va tu día? Estoy aquí para ayudarte con horarios, ubicación o información de tus trabajos.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, []);

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen, scrollToBottom]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const products = await getProductos();
            const context = products.slice(0, 10).map(p => `${p.nombre}: ${formatCurrency(p.precio)}`).join(', ');
            const response = await chatWithCustomer([...messages, { role: 'user', text: userMsg }], context);
            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-8 z-[90] flex flex-col items-end">
            {isOpen && (
                <div className="w-[350px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-bounce-in mb-4">
                    <div className="bg-slate-900 p-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue rounded-2xl flex items-center justify-center">
                            <SparklesIcon className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-sm uppercase tracking-widest">Córdova Bot</h4>
                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span> Online
                            </p>
                        </div>
                    </div>
                    
                    <div ref={scrollRef} className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50 custom-scrollbar">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${m.role === 'user' ? 'bg-brand-blue text-white rounded-tr-none' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-300"></span>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Escribe aquí..." 
                            className="flex-grow bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                        />
                        <button type="submit" disabled={loading} className="p-3 bg-brand-blue text-white rounded-2xl hover:bg-blue-800 transition-colors shadow-lg active:scale-90">
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </form>
                </div>
            )}
            
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`p-5 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-900' : 'bg-brand-blue'} text-white relative`}
            >
                {isOpen ? <CloseIcon className="w-8 h-8"/> : <MessageCircleIcon className="w-8 h-8"/>}
                {!isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-red rounded-full animate-ping"></span>}
            </button>
        </div>
    );
};

export default function LandingPage() {
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

    const cartCount = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth selection:bg-brand-red selection:text-white relative overflow-x-hidden">
            <Header cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} onOpenQuote={() => setIsQuoteOpen(true)} />
            
            <main>
                <HeroSection onOpenQuote={() => setIsQuoteOpen(true)} />
                <ServicesSection />
                <AIHelper />
                <CatalogSection onAddToCart={handleAddToCart} />
            </main>
            
            <LandingFooter />
            <AICustomerBot />

            {/* Modals con prevención de scrolling de fondo */}
            <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Mi Carrito">
                <div className="p-8">
                     {cartItems.length === 0 ? (
                        <div className="text-center py-20">
                            <BoxIcon className="w-24 h-24 mx-auto mb-6 opacity-10" />
                            <p className="text-xl font-bold text-gray-400">Tu carrito está vacío</p>
                            <button onClick={() => setIsCartOpen(false)} className="mt-6 text-brand-blue font-black uppercase tracking-widest text-sm underline underline-offset-8">Volver a la tienda</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="max-h-[40vh] overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                                {cartItems.map(item => (
                                    <div key={item.producto.id} className="flex justify-between items-center bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100 group transition-all hover:bg-white hover:shadow-xl">
                                        <div>
                                            <p className="font-black text-lg text-slate-800 uppercase tracking-tight">{item.producto.nombre}</p>
                                            <p className="text-brand-blue font-bold">{formatCurrency(item.producto.precio)} c/u</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-3 bg-white shadow-inner p-1.5 rounded-xl border border-gray-200">
                                                <button onClick={() => handleUpdateQuantity(item.producto.id, -1)} className="w-10 h-10 flex items-center justify-center font-black hover:bg-gray-100 rounded-lg text-slate-400 transition-all">-</button>
                                                <span className="text-lg font-black w-8 text-center text-slate-800">{item.cantidad}</span>
                                                <button onClick={() => handleUpdateQuantity(item.producto.id, 1)} className="w-10 h-10 flex items-center justify-center font-black hover:bg-gray-100 rounded-lg text-slate-400 transition-all">+</button>
                                            </div>
                                            <button onClick={() => handleRemoveItem(item.producto.id)} className="text-red-300 hover:text-red-600 p-2 transition-colors"><TrashIcon className="w-6 h-6"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                                <div className="text-center md:text-left">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Inversión Estimada</p>
                                    <p className="text-5xl font-black text-brand-blue tracking-tighter">
                                        {formatCurrency(cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0))}
                                    </p>
                                </div>
                                <button onClick={() => {}} className="w-full md:w-auto px-12 py-5 bg-brand-red text-white font-black rounded-2xl shadow-2xl shadow-red-900/40 hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em]">
                                    Proceder al Pedido
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal isOpen={isQuoteOpen} onClose={() => setIsQuoteOpen(false)} title="Cotizador Maestro">
                <div className="p-8"><QuickQuoteCalculator /></div>
            </Modal>
        </div>
    );
}
