
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, CheckBadgeIcon, ClockIcon, 
    SparklesIcon, CalculatorIcon, WalletIcon, CheckCircleIcon, PrinterIcon, 
    PaletteIcon, MessageCircleIcon, SendIcon, Loader2Icon, GlobeAltIcon
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

// --- COMPONENTES UI REFINADOS ---

const TrustBadge: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-500 group">
        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform text-brand-blue dark:text-blue-300">
            {icon}
        </div>
        <h4 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider mb-1">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
);

const LandingHeader: React.FC<{ cartCount: number, onOpenCart: () => void }> = ({ cartCount, onOpenCart }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${scrolled ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl py-3' : 'bg-transparent py-6'}`}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="absolute -inset-2 bg-brand-red/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CordovaLogo className={`h-10 w-auto transition-all duration-500 ${scrolled ? 'brightness-100' : 'brightness-0 invert'}`} />
                    </div>
                    <div className={`flex flex-col leading-none ${scrolled ? 'text-slate-900 dark:text-white' : 'text-white'}`}>
                        <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-70">Imprenta</span>
                        <span className="text-xl font-black tracking-tighter uppercase">CÓRDOVA</span>
                    </div>
                </Link>
                
                <div className="flex items-center gap-6">
                    <nav className={`hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-[0.2em] ${scrolled ? 'text-slate-600 dark:text-slate-300' : 'text-white/80'}`}>
                        <a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')} className="hover:text-brand-red transition-colors">Servicios</a>
                        <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="hover:text-brand-red transition-colors">Tienda</a>
                        <Link to="/tracking" className={`px-4 py-1.5 rounded-full border transition-all ${scrolled ? 'border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white' : 'border-white/30 text-white hover:bg-white hover:text-brand-blue'}`}>Seguimiento</Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button onClick={onOpenCart} className="relative group p-2">
                            <div className={`p-2.5 rounded-2xl transition-all ${scrolled ? 'bg-brand-blue text-white shadow-lg' : 'bg-white/10 backdrop-blur-md text-white border border-white/20'}`}>
                                <ShoppingCartIcon className="w-5 h-5" />
                            </div>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 animate-bounce">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <Link to="/login" className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-red-900/20">
                            Acceso
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

const AIChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: '¡Hola! Soy Córdova AI. 🎨 ¿Tienes alguna duda sobre gigantografías, facturas SRI o tiempos de entrega?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        const msg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: msg }]);
        setLoading(true);
        try {
            const products = await getProductos();
            const ctx = products.slice(0, 5).map(p => `${p.nombre}: ${formatCurrency(p.precio)}`).join(', ');
            const res = await chatWithCustomer([...messages, { role: 'user', text: msg }], ctx);
            setMessages(prev => [...prev, { role: 'model', text: res }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
            {isOpen && (
                <div className="w-[350px] h-[500px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-bounce-in mb-4">
                    <div className="bg-brand-blue p-5 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <SparklesIcon className="w-6 h-6 text-white animate-pulse" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-sm uppercase tracking-widest">Córdova AI</h4>
                            <p className="text-[9px] text-blue-200 font-bold uppercase">Asesor Creativo Online</p>
                        </div>
                    </div>
                    <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-950/50">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium ${m.role === 'user' ? 'bg-brand-blue text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t dark:border-slate-800 flex gap-2">
                        <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="¿En qué puedo ayudarte?" className="flex-grow bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-brand-blue outline-none" />
                        <button type="submit" disabled={loading} className="p-2.5 bg-brand-blue text-white rounded-xl shadow-lg active:scale-90 transition-transform"><SendIcon className="w-4 h-4"/></button>
                    </form>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className={`p-4 rounded-2xl shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${isOpen ? 'bg-slate-900' : 'bg-brand-blue'} text-white relative`}>
                {isOpen ? <CloseIcon className="w-6 h-6"/> : <MessageCircleIcon className="w-6 h-6"/>}
                {!isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-red rounded-full animate-ping"></span>}
            </button>
        </div>
    );
};

/* Fix: Define missing Modal component for Landing Page */
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
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
        <div className="min-h-screen bg-white dark:bg-slate-900 font-sans text-slate-900 dark:text-white scroll-smooth selection:bg-brand-red selection:text-white">
            <LandingHeader cartCount={cartItems.reduce((a, b) => a + b.cantidad, 0)} onOpenCart={() => setIsCartOpen(true)} />
            
            <main>
                {/* HERO SECTION PREMIUM */}
                <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-brand-blue">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-brand-blue to-indigo-900 opacity-90"></div>
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-400/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
                    </div>

                    <div className="container mx-auto px-6 relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8 animate-fade-in-up">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md shadow-2xl">
                                    <span className="flex h-2 w-2 rounded-full bg-green-400 animate-ping"></span>
                                    <span className="text-[10px] font-black text-white tracking-[0.3em] uppercase">Estudio Gráfico Abierto</span>
                                </div>
                                <h1 className="text-6xl lg:text-8xl font-black text-white leading-none tracking-tighter">
                                    IMPRESIÓN <br/>
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-300">QUE IMPACTA.</span>
                                </h1>
                                <p className="text-xl text-blue-100 font-medium max-w-xl leading-relaxed opacity-80">
                                    Especialistas en Gigantografías HD, Facturación Autorizada SRI y Merchandising. Más de 15 años liderando las artes gráficas en Pasaje.
                                </p>
                                <div className="flex flex-wrap gap-4 pt-4">
                                    <a href="#catalog" onClick={(e) => scrollToSection(e, 'catalog')} className="px-10 py-5 bg-brand-red text-white font-black text-xs uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-red-900/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                                        <ShoppingCartIcon className="w-5 h-5"/> Empezar Pedido
                                    </a>
                                    <Link to="/tracking" className="px-10 py-5 bg-white/10 border border-white/20 text-white font-black text-xs uppercase tracking-widest rounded-[2rem] backdrop-blur-md hover:bg-white/20 transition-all">
                                        Rastrear Orden
                                    </Link>
                                </div>
                            </div>
                            <div className="relative hidden lg:block animate-float">
                                <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10 bg-slate-800 aspect-[4/3]">
                                    <img src="https://i.imgur.com/AUvl1wF.png" alt="Producción" className="w-full h-full object-cover opacity-90" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-10">
                                        <div>
                                            <p className="text-blue-300 font-black uppercase text-xs tracking-widest mb-2">Tecnología Roland</p>
                                            <h3 className="text-3xl font-black text-white">Gigantografías en Alta Resolución</h3>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-brand-red rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center text-white z-20 animate-bounce-slow">
                                    <CheckBadgeIcon className="w-12 h-12 mb-2" />
                                    <p className="font-black text-center text-[10px] uppercase leading-tight">Autorizado por el SRI</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* TRUST BADGES */}
                <section className="py-20 bg-slate-50 dark:bg-slate-950/50">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <TrustBadge icon={<ShieldCheckIcon className="w-8 h-8"/>} title="Garantía SRI" desc="Documentos 100% legales y autorizados." />
                            <TrustBadge icon={<PrinterIcon className="w-8 h-8"/>} title="Calidad HD" desc="Tintas originales y materiales premium." />
                            <TrustBadge icon={<ClockIcon className="w-8 h-8"/>} title="Entrega Veloz" desc="Respetamos tus tiempos de negocio." />
                            <TrustBadge icon={<MapPinIcon className="w-8 h-8"/>} title="Pasaje Local" desc="Atención física en el centro de Pasaje." />
                        </div>
                    </div>
                </section>

                {/* SERVICES SECTION */}
                <section id="servicios" className="py-24 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className="container mx-auto px-6 relative">
                        <div className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-6">Nuestras Especialidades</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-lg">Combinamos maquinaria industrial con diseño creativo para dar vida a tus ideas.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            {[
                                { title: 'Gigantografías', desc: 'Lonas, Vinilos y Banners resistentes al exterior.', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600' },
                                { title: 'Facturación SRI', desc: 'Facturas, Notas de Venta y Retenciones autorizadas.', img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600' },
                                { title: 'Merchandising', desc: 'Camisetas, Gorras y Tazas personalizadas.', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600' }
                            ].map((s, i) => (
                                <div key={i} className="group relative rounded-[2.5rem] overflow-hidden shadow-xl aspect-square">
                                    <img src={s.img} alt={s.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/90 via-transparent to-transparent opacity-90"></div>
                                    <div className="absolute bottom-0 left-0 p-8 text-white">
                                        <h4 className="text-2xl font-black mb-2">{s.title}</h4>
                                        <p className="text-sm opacity-80 leading-relaxed">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <AIHelper />

                {/* TIENDA / CATALOGO */}
                <section id="catalog" className="py-24 bg-slate-50 dark:bg-slate-950">
                    <div className="container mx-auto px-6">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tienda Online</h2>
                                <p className="text-slate-500 mt-2">Selecciona y solicita tu cotización al instante.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {productos.map(p => (
                                <div key={p.id} className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 group">
                                    <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-6">
                                        {p.imagenUrl ? <img src={p.imagenUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><BoxIcon className="w-16 h-16"/></div>}
                                        <div className="absolute inset-0 bg-brand-blue/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button onClick={() => handleAddToCart(p)} className="p-4 bg-white text-brand-blue rounded-full shadow-xl hover:scale-110 transition-transform"><AddIcon className="w-6 h-6"/></button>
                                        </div>
                                    </div>
                                    <div className="px-2 pb-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.categoria}</p>
                                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 line-clamp-1">{p.nombre}</h3>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-black text-brand-blue dark:text-blue-400">{formatCurrency(p.precio)}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Referencial</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-900 text-white py-20">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 border-b border-slate-800 pb-16">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <CordovaLogo className="h-12 w-auto brightness-0 invert" />
                            <p className="text-slate-400 max-w-sm text-sm leading-relaxed">Imprenta Córdova: Excelencia en artes gráficas, gigantografías y soluciones tributarias autorizadas en el corazón de El Oro.</p>
                            <div className="flex gap-4">
                                <a href="https://wa.me/593993083943" className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-brand-blue transition-colors"><PhoneIcon className="w-5 h-5"/></a>
                                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-brand-red transition-colors cursor-pointer"><GlobeAltIcon className="w-5 h-5"/></div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="font-black text-xs uppercase tracking-widest border-l-2 border-brand-red pl-4">Ubicación</h4>
                            <p className="text-slate-400 text-sm">Colón e/ Sucre y Rocafuerte.<br/>Pasaje, El Oro - Ecuador.</p>
                            <a href="https://maps.app.goo.gl/..." target="_blank" className="text-blue-400 text-xs font-bold hover:underline">Ver en Google Maps</a>
                        </div>
                        <div className="space-y-6">
                            <h4 className="font-black text-xs uppercase tracking-widest border-l-2 border-brand-red pl-4">Contacto</h4>
                            <p className="text-slate-400 text-sm">Cel: 099 308 3943<br/>Email: imprentacordova@gmail.com</p>
                        </div>
                    </div>
                    <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <p>&copy; 2025 Imprenta Córdova. Todos los derechos reservados.</p>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Desarrollado con Gemini AI
                        </div>
                    </div>
                </div>
            </footer>

            <AIChatBot />

            {/* CARRITO MODAL ESTILIZADO */}
            <Modal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} title="Mi Pedido">
                <div className="p-8">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-20">
                            <BoxIcon className="w-24 h-24 mx-auto mb-6 opacity-10" />
                            <p className="text-xl font-bold text-gray-400">Tu carrito está vacío</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                {cartItems.map(item => (
                                    <div key={item.producto.id} className="flex justify-between items-center bg-gray-50 dark:bg-slate-950/50 p-4 rounded-3xl border border-gray-100 dark:border-slate-800">
                                        <div className="flex-grow">
                                            <p className="font-black text-sm uppercase tracking-tight">{item.producto.nombre}</p>
                                            <p className="text-brand-blue font-bold text-xs">{formatCurrency(item.producto.precio)} c/u</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-lg">{item.cantidad}</span>
                                            <button onClick={() => setCartItems(prev => prev.filter(i => i.producto.id !== item.producto.id))} className="text-red-400 p-2"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-6 border-t dark:border-slate-800">
                                <div className="flex justify-between items-end mb-8">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inversión Estimada</span>
                                    <span className="text-5xl font-black text-brand-blue tracking-tighter">{formatCurrency(cartItems.reduce((a, b) => a + (b.producto.precio * b.cantidad), 0))}</span>
                                </div>
                                <a 
                                    href={`https://wa.me/593993083943?text=Hola,%20quisiera%20cotizar:%20${encodeURIComponent(cartItems.map(i => `${i.cantidad}x ${i.producto.nombre}`).join(', '))}`}
                                    target="_blank"
                                    className="w-full py-5 bg-brand-red text-white font-black rounded-2xl shadow-2xl flex justify-center items-center gap-3 uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all"
                                >
                                    <MessageCircleIcon className="w-6 h-6" /> Solicitar por WhatsApp
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
}
