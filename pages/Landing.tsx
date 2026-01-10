
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ShieldCheckIcon, UsersIcon, BoxIcon, PhoneIcon, ShoppingCartIcon, 
    CloseIcon, TrashIcon, CheckCircleIcon, AddIcon, ArrowRightIcon, MapPinIcon, 
    EnvelopeIcon, CordovaLogo, StarIcon, PrinterIcon, CheckBadgeIcon, ClockIcon,
    SearchIcon, SparklesIcon, MonitorIcon, MessageCircleIcon, ChevronRightIcon,
    Loader2Icon, WalletIcon, ExclamationTriangleIcon, LayersIcon, WhatsAppIcon,
    PaletteIcon, ReceiptIcon, InfoIcon, FileTextIcon
} from '../components/Icons';
import { getProductos, createPublicPedido, getTrabajos } from '../services/mockApi';
import { Producto, TrabajoEstado, TrabajoTipo } from '../types';
import { formatCurrency } from '../utils';

// --- COMPONENTE DE ACORDEÓN SEO (Optimizado para Búsquedas) ---
const FAQItem: React.FC<{ question: string, answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-100 dark:border-white/5 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex justify-between items-center text-left group"
            >
                <h4 className={`text-lg font-bold transition-colors ${isOpen ? 'text-brand-blue' : 'text-slate-700 dark:text-slate-300'}`}>
                    {question}
                </h4>
                <div className={`p-2 rounded-full transition-all ${isOpen ? 'bg-brand-blue text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                    <ChevronRightIcon className="w-5 h-5 transform rotate-90" />
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-8' : 'max-h-0'}`}>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm md:text-base">
                    {answer}
                </p>
            </div>
        </div>
    );
};

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<{ producto: Producto; cantidad: number }[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'info' | 'success'>('cart');
    const [clientData, setClientData] = useState({ nombre: '', telefono: '', email: '' });
    
    // Quick Tracking State
    const [trackOrder, setTrackOrder] = useState('');
    const [trackingResult, setTrackingResult] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        getProductos().then(data => {
            setProductos(data);
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

    const handleQuickTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackOrder) return;
        setIsTracking(true);
        const trabajos = await getTrabajos();
        const found = trabajos.find(t => String(t.orden) === trackOrder);
        setTimeout(() => {
            setTrackingResult(found || "NOT_FOUND");
            setIsTracking(false);
        }, 800);
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        await createPublicPedido(clientData, cartItems);
        setCheckoutStep('success');
        setCartItems([]);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    const iva = subtotal * 0.15; 
    const total = subtotal + iva;
    const cartCount = cartItems.reduce((acc, item) => acc + item.cantidad, 0);

    const TrackingStepper: React.FC<{ currentStatus: TrabajoEstado }> = ({ currentStatus }) => {
        const steps = [
            { label: 'Recibido', value: TrabajoEstado.PENDIENTE, icon: ClockIcon },
            { label: 'Diseño', value: TrabajoEstado.EN_DISENO, icon: PaletteIcon },
            { label: 'Taller', value: TrabajoEstado.PROCESO, icon: PrinterIcon },
            { label: '¡Listo!', value: TrabajoEstado.VITRINA, icon: CheckCircleIcon }
        ];
        const activeIdx = steps.findIndex(s => s.value === currentStatus);
        return (
            <div className="flex justify-between items-center w-full mt-6 relative pb-4">
                <div className="absolute top-[22px] left-0 right-0 h-1 bg-slate-100 dark:bg-white/10 z-0"></div>
                <div className="absolute top-[22px] left-0 h-1 bg-brand-blue transition-all duration-1000 z-0" style={{ width: `${(activeIdx / (steps.length - 1)) * 100}%` }}></div>
                {steps.map((step, idx) => {
                    const isDone = idx <= activeIdx;
                    const Icon = step.icon;
                    return (
                        <div key={idx} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isDone ? 'bg-brand-blue text-white shadow-lg scale-110' : 'bg-slate-50 text-slate-300'}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${isDone ? 'text-brand-blue' : 'text-slate-400'}`}>{step.label}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth selection:bg-brand-red selection:text-white">
            {/* Nav */}
            <nav className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-[100] bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] py-4 px-8 shadow-2xl flex justify-between items-center" role="navigation">
                <div className="flex items-center gap-3">
                    <CordovaLogo className="h-10 w-auto" alt="Logo Imprenta Córdova" />
                    <div className="hidden sm:flex flex-col leading-none">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pasaje • El Oro</span>
                        <span className="text-xl font-black text-brand-blue uppercase tracking-tighter">Córdova</span>
                    </div>
                </div>
                
                <div className="hidden md:flex gap-8 items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <a href="#servicios" className="hover:text-brand-blue transition-colors">Servicios</a>
                    <a href="#catalog" className="hover:text-brand-blue transition-colors">Catálogo</a>
                    <a href="#ayuda" className="hover:text-brand-blue transition-colors font-bold text-brand-red">Información SRI</a>
                    <a href="#tracking" className="bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-brand-blue transition-all">Rastrear</a>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-slate-100 rounded-2xl hover:bg-brand-blue hover:text-white transition-all group outline-none">
                        <ShoppingCartIcon className="w-5 h-5" />
                        {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{cartCount}</span>}
                    </button>
                    <Link to="/login" className="hidden sm:block text-slate-400 hover:text-brand-blue transition-colors">
                        <UsersIcon className="w-6 h-6"/>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 overflow-hidden relative bg-slate-50">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-7 space-y-10 animate-fade-in">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-blue"></span>
                            </span>
                            <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Abierto en Pasaje: Calle Colón</span>
                        </div>
                        
                        <h1 className="text-6xl lg:text-8xl font-black text-slate-900 leading-none tracking-tighter uppercase italic">
                            Imprenta <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-orange-600">Autorizada</span>
                        </h1>

                        <p className="text-xl text-slate-500 font-light max-w-2xl leading-relaxed">
                            Más de 15 años liderando en <b>Pasaje, El Oro</b>. Especialistas en talonarios de facturas, notas de venta RIMPE y gigantografías de alta resolución.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <a href="#catalog" className="bg-brand-red text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                                <BoxIcon className="w-5 h-5"/> Ver Catálogo
                            </a>
                            <a href="https://wa.me/593993083943" target="_blank" rel="noopener noreferrer" className="bg-white border-2 border-slate-100 text-slate-900 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-xl">
                                <WhatsAppIcon className="w-5 h-5 text-green-500"/> WhatsApp
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-5 relative hidden lg:block">
                        <div className="relative z-10 bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-3xl border border-white/10">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><CordovaLogo className="w-40 h-40 brightness-0 invert"/></div>
                            <h3 className="text-2xl font-black mb-8 uppercase tracking-tighter italic text-brand-red">Excelencia Córdova</h3>
                            <ul className="space-y-6">
                                <li className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-red transition-all"><ShieldCheckIcon className="w-6 h-6"/></div>
                                    <div><p className="font-black text-sm uppercase">SRI 100% Legal</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Documentación al día</p></div>
                                </li>
                                <li className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-blue transition-all"><PrinterIcon className="w-6 h-6"/></div>
                                    <div><p className="font-black text-sm uppercase">Acabado Premium</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tecnología Roland HD</p></div>
                                </li>
                                <li className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 transition-all"><ClockIcon className="w-6 h-6"/></div>
                                    <div><p className="font-black text-sm uppercase">Entrega Rápida</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">24h - 48h hábiles</p></div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN SEO: CENTRO DE INFORMACIÓN Y BÚSQUEDAS FRECUENTES */}
            <section id="ayuda" className="py-24 bg-white scroll-mt-24">
                <div className="container mx-auto px-6 grid lg:grid-cols-12 gap-16 items-start">
                    
                    {/* Contenido Texto SEO */}
                    <div className="lg:col-span-5 space-y-8">
                        <div>
                            <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-4 block">Lo que necesitas saber</span>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-tight italic">
                                Guía para tus <br/>
                                <span className="text-brand-blue">Talonarios en Pasaje</span>
                            </h2>
                        </div>
                        <p className="text-slate-500 leading-relaxed text-lg">
                            Imprimir tus documentos legales no tiene por qué ser complicado. En <b>Imprenta Córdova</b>, nos encargamos de todo el proceso técnico y legal ante el <b>SRI</b>.
                        </p>
                        
                        {/* Bloque de Búsquedas Populares (Keyword Cluster para Google) */}
                        <div className="pt-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Lo más buscado en nuestra página:</h3>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "Imprentas en Pasaje El Oro", "Precio talonario notas de venta 2025", "Facturas autorizadas SRI Pasaje", 
                                    "Requisitos RIMPE Negocio Popular", "Gigantografías en Pasaje", "Imprenta autorizada SRI cerca de mí",
                                    "Impresión de facturas urgente", "Talonarios duplicados precio"
                                ].map((tag, i) => (
                                    <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-wide hover:bg-brand-blue/5 hover:text-brand-blue transition-colors cursor-default">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Acordeón de FAQs SEO */}
                    <div className="lg:col-span-7 bg-slate-50/50 rounded-[3rem] p-8 lg:p-12 border border-slate-100 shadow-inner">
                        <div className="divide-y divide-slate-200">
                            <FAQItem 
                                question="¿Qué necesito para imprimir mis Facturas o Notas de Venta?"
                                answer="Solo requerimos tu número de RUC activo y tu Cédula de Identidad. En el caso de Facturas, necesitamos que tengas una clave de acceso al SRI vigente para generar la autorización de impresión electrónica o física. Nosotros realizamos el trámite por ti en segundos."
                            />
                            <FAQItem 
                                question="Diferencia entre Nota de Venta y Factura (RIMPE)"
                                answer="Las Notas de Venta son exclusivas para contribuyentes en el régimen RIMPE - Negocio Popular (ventas hasta $20,000 anuales). Las Facturas son obligatorias para el régimen RIMPE - Emprendedor o Régimen General. Si no sabes cuál te corresponde, tráenos tu RUC y te asesoramos sin costo."
                            />
                            <FAQItem 
                                question="¿Cuánto demora la entrega de mis talonarios?"
                                answer="En Imprenta Córdova Pasaje manejamos tiempos récord. Los pedidos estándar de talonarios SRI se entregan en un plazo de 24 a 48 horas laborables. Si es un pedido urgente, pregunta por nuestro servicio express."
                            />
                            <FAQItem 
                                question="¿Las gigantografías son resistentes al sol de El Oro?"
                                answer="Totalmente. Utilizamos tintas eco-solventes de alta gama y tecnología Roland HD. Nuestras lonas y vinilos están garantizados para resistir el clima de la provincia, manteniendo colores vivos por mucho más tiempo."
                            />
                            <FAQItem 
                                question="¿Realizan envíos fuera de la ciudad de Pasaje?"
                                answer="Sí, realizamos entregas en Machala, El Guabo, Santa Rosa y toda la provincia de El Oro previo acuerdo. Contáctanos por WhatsApp para coordinar el envío de tus trabajos de imprenta."
                            />
                        </div>

                        {/* CTA de Ayuda Directa */}
                        <div className="mt-12 p-8 bg-brand-blue rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-900/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <InfoIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-black text-sm uppercase tracking-widest">¿Tienes dudas con el SRI?</p>
                                    <p className="text-blue-100 text-xs opacity-80 uppercase font-bold mt-0.5">Escríbenos, somos expertos.</p>
                                </div>
                            </div>
                            <a href="https://wa.me/593993083943" className="px-8 py-3 bg-white text-brand-blue font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-950 hover:text-white transition-all">
                                Consultar Gratis
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Catalog */}
            <section id="catalog" className="py-24 bg-slate-50 scroll-mt-24">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div>
                            <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-4 block font-mono">Nuestros Precios</span>
                            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">Catálogo de <span className="text-brand-blue">Servicios</span></h2>
                        </div>
                        <div className="relative w-full md:w-80 group">
                            <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-brand-blue transition-colors" />
                            <input type="text" placeholder="¿Qué buscas imprimir?" className="w-full pl-12 pr-6 py-4 bg-white border-none rounded-2xl shadow-xl text-sm font-bold focus:ring-4 focus:ring-brand-blue/10 transition-all outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-[2.5rem] h-96 animate-pulse shadow-sm"></div>
                        )) : productos.slice(0, 8).map(p => (
                            <div key={p.id} className="group bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
                                <div className="h-56 bg-slate-100 relative overflow-hidden">
                                    {p.imagenUrl ? <img src={p.imagenUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.nombre}/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><BoxIcon className="w-16 h-16"/></div>}
                                    <div className="absolute inset-0 bg-brand-blue/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <button onClick={() => handleAddToCart(p)} className="bg-white text-brand-blue px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-110 transition-all">Pedir Ahora</button>
                                    </div>
                                    {p.esSRI && <span className="absolute top-4 left-4 bg-brand-red text-white text-[8px] font-black px-2 py-1 rounded-md shadow-lg tracking-widest uppercase">SRI</span>}
                                </div>
                                <div className="p-8 flex-grow flex flex-col">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{p.categoria}</p>
                                    <h3 className="font-black text-slate-900 uppercase text-sm mb-2 group-hover:text-brand-blue transition-colors leading-tight">{p.nombre}</h3>
                                    <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-50">
                                        <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(p.precio)}</span>
                                        <button onClick={() => handleAddToCart(p)} className="w-12 h-12 bg-blue-50 text-brand-blue hover:bg-brand-blue hover:text-white transition-all rounded-2xl flex items-center justify-center shadow-inner">
                                            <AddIcon className="w-6 h-6"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick Track */}
            <section id="tracking" className="py-20 bg-slate-900 text-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 lg:p-16 border border-white/10 shadow-3xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Rastreo de <span className="text-brand-red">Pedido</span></h2>
                            <p className="text-slate-400 mt-2 text-sm uppercase tracking-widest font-bold">Consulta el estado de tu orden en tiempo real</p>
                        </div>
                        <form onSubmit={handleQuickTrack} className="flex flex-col md:flex-row gap-4 mb-10">
                            <div className="flex-grow relative">
                                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="text" value={trackOrder} onChange={e => setTrackOrder(e.target.value)} placeholder="Nro. de Orden (Ej: 1024)" className="w-full pl-16 pr-8 py-5 bg-white/10 border-none rounded-2xl text-xl font-bold focus:ring-4 focus:ring-brand-blue/30 outline-none" />
                            </div>
                            <button disabled={isTracking} type="submit" className="px-10 py-5 bg-brand-blue text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
                                {isTracking ? <Loader2Icon className="animate-spin w-5 h-5"/> : 'Buscar Orden'}
                            </button>
                        </form>
                        {trackingResult && trackingResult !== "NOT_FOUND" && (
                            <div className="bg-white rounded-[2.5rem] p-10 text-slate-900 animate-slide-in-up flex flex-col items-center text-center border-l-[12px] border-brand-red">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orden #{trackingResult.orden}</span>
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-brand-blue mt-1 leading-none">{trackingResult.titular}</h3>
                                <TrackingStepper currentStatus={trackingResult.estado} />
                                <div className="mt-8 p-6 bg-slate-950 text-white rounded-2xl w-full">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo a Pagar</p>
                                    <p className="text-2xl font-black text-brand-red tracking-tighter">{formatCurrency(trackingResult.saldo)}</p>
                                </div>
                            </div>
                        )}
                        {trackingResult === "NOT_FOUND" && (
                            <div className="text-center p-12 bg-red-500/10 rounded-[2.5rem] border border-red-500/20">
                                <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4"/>
                                <p className="font-black uppercase text-sm tracking-widest text-red-200">No encontramos esa orden.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-white py-24">
                <div className="container mx-auto px-6 grid md:grid-cols-12 gap-16">
                    <div className="md:col-span-4 space-y-8">
                        <div className="flex items-center gap-4">
                            <CordovaLogo className="h-16 w-auto brightness-0 invert" />
                            <div className="flex flex-col leading-none">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Imprenta & Publicidad</span>
                                <span className="text-3xl font-black tracking-tighter uppercase italic text-brand-red">CÓRDOVA</span>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">Dando vida a la identidad comercial de Pasaje y El Oro por más de una década. Calidad técnica garantizada.</p>
                    </div>
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-12">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-4">Ubicación</h4>
                            <p className="text-sm font-bold flex items-start gap-3"><MapPinIcon className="w-5 h-5 text-brand-red shrink-0"/> Calle Colón <br/> Pasaje, El Oro - Ecuador</p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-4">Contacto</h4>
                            <p className="text-sm font-bold flex items-center gap-3"><PhoneIcon className="w-5 h-5 text-brand-blue shrink-0"/> 099 308 3943</p>
                            <p className="text-sm font-bold flex items-center gap-3"><EnvelopeIcon className="w-5 h-5 text-emerald-500 shrink-0"/> imprentacordova@gmail.com</p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b border-white/10 pb-4">Horario</h4>
                            <p className="text-sm font-bold flex items-center gap-3"><ClockIcon className="w-5 h-5 text-orange-500 shrink-0"/> Lun - Sáb <br/> 08:00 AM - 07:00 PM</p>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto px-6 pt-20 border-t border-white/5 mt-20 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">
                    <p>Imprenta Córdova &copy; 2025 • Pasaje, Ecuador</p>
                    <p className="flex items-center gap-2">Vision V2 Engine</p>
                </div>
            </footer>

            {/* Cart Modal */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex justify-end p-4 animate-fade-in" onClick={() => setIsCartOpen(false)}>
                    <div className="bg-white h-full w-full max-w-md rounded-[3rem] shadow-3xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-2xl font-black text-brand-blue uppercase tracking-tighter flex items-center gap-4"><ShoppingCartIcon className="w-8 h-8 text-brand-red"/> Carrito</h2>
                            <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-white rounded-2xl shadow-sm transition-all"><CloseIcon className="w-6 h-6 text-slate-400"/></button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-10 space-y-8 custom-scrollbar">
                            {checkoutStep === 'success' ? (
                                <div className="text-center py-20 space-y-8 animate-slide-in-up">
                                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircleIcon className="w-12 h-12 text-green-500"/></div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900">¡Pedido Enviado!</h3>
                                    <p className="text-slate-500 mt-4 font-medium leading-relaxed">Gracias <b>{clientData.nombre}</b>. Recibimos tu cotización. Te contactaremos al <b>{clientData.telefono}</b> para coordinar.</p>
                                    <button onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }} className="w-full py-5 bg-brand-blue text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px]">Cerrar</button>
                                </div>
                            ) : checkoutStep === 'info' ? (
                                <form onSubmit={handleCheckout} className="space-y-8 animate-fade-in">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Nombre Completo</label>
                                            <input required value={clientData.nombre} onChange={e => setClientData({...clientData, nombre: e.target.value.toUpperCase()})} type="text" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold outline-none" placeholder="EJ. JUAN PÉREZ" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">WhatsApp</label>
                                            <input required value={clientData.telefono} onChange={e => setClientData({...clientData, telefono: e.target.value})} type="tel" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold outline-none" placeholder="099..." />
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 space-y-4">
                                        <div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-brand-red">Total Estimado</span> <span className="text-3xl font-black">{formatCurrency(total)}</span></div>
                                    </div>
                                    <button type="submit" className="w-full py-6 bg-brand-red text-white font-black rounded-[2rem] shadow-2xl uppercase tracking-[0.3em] text-[10px] hover:bg-slate-950 transition-all">CONFIRMAR PEDIDO</button>
                                </form>
                            ) : cartItems.length === 0 ? (
                                <div className="text-center py-24 opacity-20 flex flex-col items-center">
                                    <BoxIcon className="w-20 h-20 mb-6"/>
                                    <p className="font-black uppercase text-[10px] tracking-[0.3em]">Carrito Vacío</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cartItems.map(item => (
                                        <div key={item.producto.id} className="flex justify-between items-center bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                                            <div className="min-w-0 flex-grow pr-4">
                                                <p className="font-black text-[11px] uppercase truncate text-slate-900 group-hover:text-brand-blue transition-colors">{item.producto.nombre}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{item.cantidad} x {formatCurrency(item.producto.precio)}</p>
                                            </div>
                                            <button onClick={() => setCartItems(cartItems.filter(i => i.producto.id !== item.producto.id))} className="w-10 h-10 rounded-xl bg-red-50 text-red-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {checkoutStep === 'cart' && cartItems.length > 0 && (
                            <div className="p-10 bg-slate-950 text-white space-y-8 rounded-t-[3.5rem] shadow-2xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Estimado</span>
                                        <span className="text-4xl font-black tracking-tighter">{formatCurrency(total)}</span>
                                    </div>
                                    <span className="text-[8px] font-black text-brand-red uppercase tracking-widest animate-pulse">Precios Directos</span>
                                </div>
                                <button onClick={() => setCheckoutStep('info')} className="w-full py-6 bg-brand-blue text-white font-black rounded-[2rem] shadow-xl uppercase tracking-[0.2em] text-[10px] hover:bg-white hover:text-brand-blue transition-all flex items-center justify-center gap-4">
                                    CONTINUAR A DATOS <ArrowRightIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
