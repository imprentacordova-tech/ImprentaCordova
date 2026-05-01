import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircleIcon, SparklesIcon, PrinterIcon, 
    ArrowRightIcon, ArrowLeftIcon, CreditCardIcon, UserIcon,
    ExclamationTriangleIcon, SearchIcon, BoltIcon
} from '../Icons';
import { Producto, Trabajo, TrabajoEstado, TrabajoTipo } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';
import { PerspectiveCard } from '../PerspectiveCard';

interface CommercialFlowProps {
    onComplete: (data: {
        trabajo: Partial<Trabajo>, 
        clienteNombre: string, 
        clienteTelefono: string,
        clienteId?: string
    }) => void;
    onCancel: () => void;
}

const CommercialProductCard: React.FC<{ p: Producto; isExpress: boolean; onSelect: () => void }> = ({ p, isExpress, onSelect }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    return (
        <PerspectiveCard>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`group relative bg-black/40 backdrop-blur-xl rounded-[2rem] border transition-all duration-500 overflow-hidden cursor-pointer h-full ${
                    isHovered 
                        ? isExpress ? 'border-blue-500/40 shadow-blue-glow' : 'border-liquid-gold/40 shadow-luxury-gold' 
                        : 'border-white/5'
                }`}
                onClick={onSelect}
            >
                {/* Subtle Gradient Glow */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${isExpress ? 'bg-blue-500' : 'bg-liquid-gold'}`} />

                <div className="p-6 md:p-10 space-y-6 relative z-10">
                    <div className="flex justify-between items-start">
                        <div className={`p-4 rounded-2xl transition-all duration-700 ${
                            isHovered 
                                ? isExpress ? 'bg-blue-600 text-white' : 'bg-liquid-gold text-black scale-110' 
                                : 'bg-white/5 text-liquid-gold'
                        }`}>
                            {isExpress ? <BoltIcon className="w-6 h-6" /> : <PrinterIcon className="w-6 h-6" />}
                        </div>
                        <div className="text-right">
                            <span className={`text-2xl md:text-3xl font-black italic tracking-tighter block leading-none ${isExpress ? 'text-blue-400' : 'text-white'}`}>
                                ${(p.precio || 0).toFixed(2)}
                            </span>
                            <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1 block">PRECIO_BASE</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {isExpress && (
                            <span className="inline-block text-[8px] font-black bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded uppercase tracking-widest italic animate-pulse mb-1">
                                Express_Protocol
                            </span>
                        )}
                        <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight italic leading-tight group-hover:text-liquid-gold transition-colors">
                            {p.nombre}
                        </h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                            {p.categoria || 'GENERAL'}
                        </p>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDetails(!showDetails);
                            }}
                            className="text-[8px] font-black text-slate-500 hover:text-white uppercase tracking-[0.3em] transition-colors flex items-center gap-2"
                        >
                            <SparklesIcon className="w-3 h-3 text-liquid-gold" /> {showDetails ? 'OCULTAR' : 'DETALLES'}
                        </button>
                        <ArrowRightIcon className={`w-5 h-5 transition-all duration-500 ${isHovered ? 'text-liquid-gold translate-x-2' : 'text-white/10'}`} />
                    </div>

                    <AnimatePresence>
                        {showDetails && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden pt-4"
                            >
                                <div className="p-5 bg-black/60 rounded-2xl border border-white/5 space-y-3">
                                    <p className="text-[10px] text-slate-400 italic leading-relaxed">
                                        {p.descripcion || 'Servicio de manufactura de alta precisión bajo estándares de calidad Córdova.'}
                                    </p>
                                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Protocolo</span>
                                        <span className="text-[9px] font-black text-liquid-gold uppercase italic tracking-widest">v5.0_ELITE</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </PerspectiveCard>
    );
};

export const CommercialFlow: React.FC<CommercialFlowProps> = ({ onComplete, onCancel }) => {
    const { productos, clientes } = useData();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
    // Step 1: Producto
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Todas');
    const [showDetails, setShowDetails] = useState<string | null>(null);

    // Step 2: Detalles
    const [cantidad, setCantidad] = useState(100);
    const [tamano, setTamano] = useState('Estandar');
    const [acabado, setAcabado] = useState('Ninguno');
    const [precioCustom, setPrecioCustom] = useState<number>(0);

    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteTelefono, setClienteTelefono] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
    const [abono, setAbono] = useState<number>(0);

    // Express Mode State
    const [isExpressMode, setIsExpressMode] = useState(false);

    // Categorías comerciales
    const commercialCategories = useMemo(() => {
        const cats = new Set(productos.filter(p => !p.esSRI).map(p => p.categoria || 'General'));
        return ['Todas', ...Array.from(cats)];
    }, [productos]);

    // Filtrar solo productos NO SRI
    const commercialProducts = useMemo(() => {
        return productos.filter(p => {
            if (p.esSRI || p.esActivo === false) return false;
            const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === 'Todas' || (p.categoria || 'General') === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [productos, search, activeCategory]);

    // Calcular precio
    const precioFinal = useMemo(() => {
        if (precioCustom > 0) return precioCustom;
        if (!selectedProduct) return 0;
        let base = selectedProduct.precio * (cantidad / 100); // asumiendo precio por 100
        if (acabado !== 'Ninguno') base += (5 * (cantidad / 100));
        return base > 0 ? base : selectedProduct.precio;
    }, [selectedProduct, cantidad, acabado, precioCustom]);
    const handleConfirm = (directProduct?: Producto) => {
        const product = directProduct || selectedProduct;
        if (!product) return;
        
        const finalPrice = directProduct ? directProduct.precio : precioFinal;

        const nuevoTrabajo: Partial<Trabajo> = {
            orden: Math.floor(100000 + Math.random() * 900000),
            clienteId: selectedClientId || 'cliente_express_comercial',
            titular: clienteNombre || 'Consumidor Final',
            tipo: product.nombre,
            subtipo: directProduct ? 'PEDIDO EXPRESS' : `${cantidad} x ${tamano} - ${acabado}`,
            cantidad: directProduct ? 1 : cantidad,
            tamano: directProduct ? 'Estandar' : tamano,
            estado: TrabajoEstado.PENDIENTE,
            fechaEntrada: new Date().toISOString(),
            fechaEntrega: new Date(Date.now() + 86400000 * 2).toISOString(),
            total: finalPrice,
            abono: directProduct ? finalPrice : abono,
            saldo: directProduct ? 0 : finalPrice - abono,
            prioridad: directProduct ? 'Urgente' : 'Normal',
            detalle: directProduct ? 'VENTA RÁPIDA DE MOSTRADOR' : `${cantidad} x ${tamano} - ${acabado}`,
            caduco: false,
            estadoClave: 'PENDIENTE',
            imprimirClave: false,
        };

        onComplete({
            trabajo: nuevoTrabajo,
            clienteNombre: clienteNombre || 'Consumidor Final',
            clienteTelefono,
            clienteId: selectedClientId
        });
    };


    return (
        <>
            {/* Background Industrial Layers */}
            <div className="absolute inset-0 bg-obsidian-mesh opacity-90 pointer-events-none" />
            <div className="absolute inset-0 noise-overlay opacity-[0.03] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #d4af37 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            {/* Header / Steps Navigation (Minimalist) */}
            <div className="bg-black/80 backdrop-blur-3xl p-8 md:p-14 border-b border-white/10 relative overflow-hidden -mx-6 md:-mx-10 -mt-6 md:-mt-10 mb-12">
                <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <span className="text-[9px] font-black text-liquid-gold uppercase tracking-[0.6em] italic">CATÁLOGO_ELITE</span>
                            <div className="h-px w-12 bg-liquid-gold/20" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                            {step === 1 && <>Suministros <span className="text-gold-gradient">Premium.</span></>}
                            {step === 2 && <>Configuración <span className="text-gold-gradient">Tactical.</span></>}
                            {step === 3 && <>Finalizar <span className="text-gold-gradient">Despliegue.</span></>}
                        </h2>
                    </div>
                
                    <div className="flex items-center gap-6">
                        <div className="bg-white/5 p-2 rounded-2xl border border-white/10 flex items-center gap-3">
                            <button 
                                onClick={() => setIsExpressMode(!isExpressMode)}
                                className={`px-6 py-3 rounded-xl transition-all duration-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 ${
                                    isExpressMode 
                                        ? 'bg-blue-600 text-white shadow-blue-glow' 
                                        : 'bg-transparent text-slate-600 hover:text-white'
                                }`}
                            >
                                <BoltIcon className="w-4 h-4" /> TURBO_MODE
                            </button>
                            <div className="w-px h-6 bg-white/10" />
                            <div className="flex gap-3 px-4">
                                {[1, 2, 3].map(s => (
                                    <div key={s} className={`w-3 h-3 rounded-full transition-all duration-700 ${step === s ? 'bg-liquid-gold shadow-gold-glow scale-125' : step > s ? 'bg-liquid-gold/40' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={onCancel}
                            className="w-14 h-14 bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-2xl transition-all border border-white/10 flex items-center justify-center group active:scale-90"
                        >
                            <ExclamationTriangleIcon className="w-6 h-6 transition-transform group-hover:rotate-12" />
                        </button>
                    </div>
                </div>
            </div>
            
    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-12" />

            <AnimatePresence mode="wait">
                {/* PASO 1: SELECCION DE PRODUCTO */}
                {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                        {/* Search & Filter Bar */}
                        <div className="flex flex-col lg:flex-row items-stretch gap-6">
                            <div className="flex-1 relative group">
                                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-600 group-focus-within:text-liquid-gold transition-colors" />
                                <input 
                                    type="text" 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)} 
                                    placeholder="Buscar producto..." 
                                    className="w-full pl-16 pr-8 py-6 bg-black/60 border border-white/10 rounded-3xl text-xl font-black text-white focus:border-liquid-gold/30 transition-all placeholder:text-slate-800 italic outline-none shadow-luxury" 
                                />
                            </div>

                            <div className="flex gap-2 p-2 bg-black/40 rounded-3xl border border-white/5 overflow-x-auto no-scrollbar">
                                {commercialCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-8 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all relative flex items-center gap-3 whitespace-nowrap ${
                                            activeCategory === cat ? 'text-black' : 'text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        {activeCategory === cat && (
                                            <motion.div layoutId="catTab" className="absolute inset-0 bg-liquid-gold rounded-2xl shadow-gold-glow" />
                                        )}
                                        <span className="relative z-10">{cat}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {commercialProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-8 max-h-[60vh] md:max-h-[600px] overflow-y-auto pr-2 md:pr-4 custom-scrollbar pb-10">
                                {commercialProducts.map(p => (
                                    <CommercialProductCard 
                                        key={p.id} 
                                        p={p} 
                                        isExpress={isExpressMode}
                                        onSelect={() => { 
                                            if (isExpressMode) {
                                                handleConfirm(p);
                                            } else {
                                                setSelectedProduct(p); 
                                                setStep(2); 
                                            }
                                        }} 
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="col-span-full py-20 md:py-40 text-center space-y-6 md:space-y-8 bg-white/[0.01] rounded-[2rem] md:rounded-[4rem] border border-white/5 border-dashed">
                                <PrinterIcon className="w-16 h-16 md:w-24 md:h-24 mx-auto text-slate-800 opacity-30" />
                                <div className="space-y-2 px-4">
                                    <p className="text-base md:text-xl font-black text-slate-700 uppercase tracking-widest italic">Protocolo No Localizado</p>
                                    <p className="text-[8px] md:text-[10px] text-slate-800 font-black uppercase tracking-[0.4em]">Ajuste los filtros o use el buscador</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* PASO 2: DETALLES Y PRECIO (CONFIGURACION PREMIUM) */}
                {step === 2 && selectedProduct && (
                    <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                        {/* Header Compacto */}
                        <div className="bg-black/60 border border-white/10 p-6 rounded-3xl flex justify-between items-center gap-6 shadow-luxury">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-liquid-gold text-black rounded-2xl flex items-center justify-center shadow-gold-glow">
                                    <PrinterIcon className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.3em] italic">Protocolo Seleccionado</p>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">{selectedProduct.nombre}</h3>
                                </div>
                            </div>
                            <button onClick={() => setStep(1)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10 flex items-center gap-3 group">
                                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> CAMBIAR
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Columna de Configuración (8/12) */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="bg-black/40 border border-white/5 p-10 rounded-[3rem] space-y-10 shadow-inner">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic ml-2">Volumen de Manufactura</label>
                                        <div className="flex gap-8 items-center">
                                            <div className="relative group">
                                                <input 
                                                    type="number" 
                                                    value={cantidad} 
                                                    onChange={e => setCantidad(Number(e.target.value))} 
                                                    className="bg-black/60 border border-white/10 w-48 p-6 rounded-2xl text-4xl font-black text-white italic outline-none focus:border-liquid-gold/30 transition-all text-center tracking-tighter shadow-luxury" 
                                                />
                                                <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-slate-800 font-black italic text-xs uppercase tracking-widest">UNITS</div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {[100, 500, 1000, 5000].map(q => (
                                                    <button 
                                                        key={q} 
                                                        onClick={() => setCantidad(q)} 
                                                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${cantidad === q ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                                                    >
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic ml-2">Dimensiones</label>
                                            <input type="text" value={tamano} onChange={e => setTamano(e.target.value)} className="w-full bg-black/60 border border-white/10 p-6 rounded-2xl text-lg font-black text-white outline-none focus:border-liquid-gold/30 transition-all shadow-luxury" placeholder="Ej: 10x15cm" />
                                            <div className="flex gap-2">
                                                {['A4', 'A5', 'Oficio', 'Tarjetas'].map(t => (
                                                    <button key={t} onClick={() => setTamano(t)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${tamano === t ? 'bg-white/10 text-white shadow-luxury' : 'text-slate-700 hover:text-slate-400'}`}>{t}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic ml-2">Acabado Elite</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {['Ninguno', 'Brillante', 'Mate', 'Uv_Selective'].map(a => (
                                                    <button 
                                                        key={a} 
                                                        onClick={() => setAcabado(a)} 
                                                        className={`px-4 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${acabado === a ? 'bg-liquid-gold/20 border-liquid-gold text-liquid-gold shadow-gold-glow-sm' : 'bg-white/5 border-white/5 text-slate-600 hover:text-slate-400'}`}
                                                    >
                                                        {a}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna de Valuación (4/12) */}
                            <div className="lg:col-span-4">
                                <div className="bg-black/60 border border-liquid-gold/20 p-8 rounded-[3rem] h-full flex flex-col justify-between shadow-luxury-gold relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform">
                                        <SparklesIcon className="w-32 h-32 text-liquid-gold" />
                                    </div>
                                    
                                    <div className="space-y-6 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-liquid-gold animate-pulse" />
                                            <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] italic">Valuación Real-Time</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-slate-600 font-black text-[10px] uppercase tracking-widest italic">
                                                <span>Inversión Base</span>
                                                <span>{formatCurrency(selectedProduct.precio)}</span>
                                            </div>
                                            <div className="flex justify-between text-slate-600 font-black text-[10px] uppercase tracking-widest italic">
                                                <span>Escalado Vol.</span>
                                                <span>x{cantidad/100}</span>
                                            </div>
                                            <div className="h-px bg-white/5 my-4" />
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Total Estimado</span>
                                                <div className="text-6xl font-black text-white italic tracking-tighter leading-none">
                                                    {formatCurrency(precioFinal)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setStep(3)}
                                        className="mt-12 w-full py-6 bg-liquid-gold text-black rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-gold-glow flex items-center justify-center gap-4 group italic text-xs"
                                    >
                                        PROCEDER <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* PASO 3: FINALIZACION (IDENTIDAD Y CAPITAL) */}
                {/* PASO 3: DESPLIEGUE FINAL */}
                {step === 3 && selectedProduct && (
                    <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Identidad del Cliente */}
                            <div className="bg-black/40 border border-white/5 p-10 rounded-[3rem] space-y-8 shadow-inner">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold shadow-luxury">
                                        <UserIcon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Identidad_Cliente</h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Vínculo de Operación</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic ml-2">Nombre o Razón Social</label>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={clienteNombre} 
                                                onChange={e => setClienteNombre(e.target.value.toUpperCase())} 
                                                className="w-full bg-black/60 border border-white/10 p-5 rounded-2xl text-lg font-black text-white italic outline-none focus:border-liquid-gold/30 transition-all placeholder:text-slate-800 shadow-luxury" 
                                                placeholder="BUSCAR CLIENTE..." 
                                            />
                                            <AnimatePresence>
                                                {clienteNombre.length > 1 && !selectedClientId && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-brand-dark border border-white/10 rounded-2xl shadow-luxury-gold z-50 max-h-64 overflow-y-auto no-scrollbar overflow-hidden"
                                                    >
                                                        {clientes.filter(c => c.nombre.toLowerCase().includes(clienteNombre.toLowerCase())).length > 0 ? (
                                                            clientes.filter(c => c.nombre.toLowerCase().includes(clienteNombre.toLowerCase())).map(c => (
                                                                <button 
                                                                    key={c.id} 
                                                                    onClick={() => { 
                                                                        setClienteNombre(c.nombre); 
                                                                        setClienteTelefono(c.telefono[0] || '');
                                                                        setSelectedClientId(c.id);
                                                                    }}
                                                                    className="w-full p-5 text-left hover:bg-white/5 border-b border-white/5 flex justify-between items-center transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-8 h-8 rounded-xl bg-liquid-gold/20 flex items-center justify-center text-liquid-gold font-black">{c.nombre.charAt(0)}</div>
                                                                        <span className="text-sm font-black text-white uppercase italic">{c.nombre}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-slate-600 tracking-widest">{c.telefono[0] || 'NO_PHONE'}</span>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-6 text-center">
                                                                <p className="text-[10px] text-liquid-gold font-black uppercase tracking-[0.4em]">Creando Nuevo Perfil</p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic ml-2">Canal WhatsApp</label>
                                        <div className="relative">
                                            <input type="text" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} className="w-full bg-black/60 border border-white/10 p-5 rounded-2xl text-lg font-black text-white italic outline-none focus:border-liquid-gold/30 transition-all shadow-luxury" placeholder="099-000-0000" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Liquidación de Pago */}
                            <div className="bg-black/60 border border-liquid-gold/10 p-10 rounded-[3rem] space-y-8 shadow-luxury-gold">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold shadow-luxury">
                                        <CreditCardIcon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Liquidación</h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Aseguramiento de Capital</p>
                                    </div>
                                </div>

                                <div className="space-y-8 bg-black/40 p-8 rounded-3xl border border-white/5 shadow-inner">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Total Misión</span>
                                        <span className="text-5xl font-black text-white italic tracking-tighter">{formatCurrency(precioFinal)}</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-liquid-gold">
                                            <span className="text-[11px] font-black uppercase tracking-[0.4em] italic">Abono Inicial</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black italic">$</span>
                                                <input 
                                                    type="number" 
                                                    value={abono || ''} 
                                                    onChange={e => setAbono(Number(e.target.value))}
                                                    className="w-32 bg-transparent border-b border-liquid-gold text-right text-3xl font-black italic outline-none py-1"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-500">
                                            <span className="text-[11px] font-black uppercase tracking-[0.4em] italic">Saldo Pendiente</span>
                                            <span className="text-2xl font-black italic">{formatCurrency(precioFinal - abono)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button onClick={() => setStep(2)} className="px-8 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-white/10 text-[10px] flex items-center gap-3">
                                        <ArrowLeftIcon className="w-4 h-4" /> VOLVER
                                    </button>
                                    <button 
                                        onClick={() => handleConfirm()} 
                                        className="flex-1 py-5 bg-liquid-gold text-black rounded-2xl font-black uppercase tracking-[0.4em] hover:scale-[1.02] transition-all shadow-gold-glow-strong italic text-xs flex items-center justify-center gap-4"
                                    >
                                        EJECUTAR MISIÓN <CheckCircleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.01); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.2); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.5); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </>
    );
};


