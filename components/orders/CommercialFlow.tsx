import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircleIcon, SparklesIcon, PrinterIcon, 
    ArrowRightIcon, ArrowLeftIcon, CreditCardIcon, UserIcon,
    ExclamationTriangleIcon, SearchIcon, BoltIcon, Loader2Icon
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
                className={`group relative bg-[#0a0a0a] backdrop-blur-2xl rounded-[2rem] border transition-all duration-700 overflow-hidden cursor-pointer h-full ${
                    isHovered 
                        ? isExpress ? 'border-blue-500/50 shadow-blue-glow scale-[1.01]' : 'border-liquid-gold/50 shadow-luxury-gold scale-[1.01]' 
                        : 'border-white/5 shadow-2xl'
                }`}
                onClick={onSelect}
            >
                {/* HUD Decorative Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/5 rounded-tl-[2rem] group-hover:border-liquid-gold/40 transition-colors duration-700" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/5 rounded-tr-[2rem] group-hover:border-liquid-gold/40 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/5 rounded-bl-[2rem] group-hover:border-liquid-gold/40 transition-colors duration-700" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/5 rounded-br-[2rem] group-hover:border-liquid-gold/40 transition-colors duration-700" />

                {/* Scanning Line Animation */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div 
                            initial={{ top: '-10%' }}
                            animate={{ top: '110%' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className={`absolute left-0 right-0 h-[2px] z-20 pointer-events-none blur-[1px] ${isExpress ? 'bg-blue-400 shadow-blue-glow' : 'bg-liquid-gold shadow-gold-glow'}`}
                        />
                    )}
                </AnimatePresence>

                {/* Blueprint Overlay (Elite Effect) */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] pointer-events-none transition-opacity duration-1000 z-0" 
                     style={{ backgroundImage: 'repeating-linear-gradient(45deg, #d4af37 0, #d4af37 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />

                <div className="p-8 md:p-10 space-y-8 relative z-10">
                    <div className="flex justify-between items-start">
                        <div className={`p-5 rounded-2xl transition-all duration-1000 ${
                            isHovered 
                                ? isExpress ? 'bg-blue-600 text-white rotate-[360deg]' : 'bg-liquid-gold text-black rotate-[360deg] scale-110' 
                                : 'bg-white/5 text-liquid-gold'
                        }`}>
                            {isExpress ? <BoltIcon className="w-7 h-7" /> : <PrinterIcon className="w-7 h-7" />}
                        </div>
                        <div className="text-right space-y-1">
                            <div className="flex items-center justify-end gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isHovered ? 'bg-green-400 animate-pulse' : 'bg-slate-700'}`} />
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">ESTADO: OK</span>
                            </div>
                            <span className={`text-3xl md:text-4xl font-black italic tracking-tighter block leading-none drop-shadow-2xl ${isExpress ? 'text-blue-400' : 'text-white'}`}>
                                ${(p.precio || 0).toFixed(2)}
                            </span>
                            <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] block">UNIT_INVESTMENT</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {isExpress && (
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full uppercase tracking-widest italic animate-pulse">
                                    Turbo_Protocol_v5
                                </span>
                                <div className="h-px flex-1 bg-blue-500/10" />
                            </div>
                        )}
                        <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight italic leading-tight group-hover:text-liquid-gold transition-colors duration-500">
                            {p.nombre}
                        </h3>
                        
                        <div className="flex items-center gap-4">
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.3em] border-l-2 border-liquid-gold/30 pl-3">
                                {p.categoria || 'GENERAL'}
                            </p>
                            <div className="h-1 w-1 rounded-full bg-slate-800" />
                            <p className="text-[7px] text-slate-700 font-black uppercase tracking-widest">
                                UNIT_ID: {p.id?.substring(0, 4)}
                            </p>
                        </div>
                    </div>

                    {/* Telemetry Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5 opacity-40 group-hover:opacity-100 transition-opacity duration-700">
                        <div className="space-y-1">
                            <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest block">LATENCY_SYNC</span>
                            <span className="text-[9px] font-black text-white italic">0.02ms</span>
                        </div>
                        <div className="space-y-1 text-right">
                            <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest block">SECURITY_LAYER</span>
                            <span className="text-[9px] font-black text-liquid-gold italic">AES-256</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDetails(!showDetails);
                            }}
                            className="text-[8px] font-black text-slate-500 hover:text-white uppercase tracking-[0.4em] transition-colors flex items-center gap-3 group/btn"
                        >
                            <SparklesIcon className="w-4 h-4 text-liquid-gold group-hover/btn:rotate-90 transition-transform" /> 
                            {showDetails ? 'CLOSE_X' : 'SPECS_DATA'}
                        </button>
                        <div className={`p-3 rounded-xl transition-all duration-500 ${isHovered ? 'bg-liquid-gold text-black scale-110 shadow-gold-glow' : 'bg-white/5 text-white/20'}`}>
                            <ArrowRightIcon className="w-5 h-5" />
                        </div>
                    </div>

                    <AnimatePresence>
                        {showDetails && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-6 p-6 bg-black/80 rounded-3xl border border-liquid-gold/20 space-y-4 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-liquid-gold/5 blur-2xl rounded-full" />
                                    <p className="text-[10px] text-slate-400 italic leading-relaxed relative z-10 font-medium">
                                        {p.descripcion || 'Suministro industrial de alta fidelidad. Procesado bajo normas internacionales de manufactura premium.'}
                                    </p>
                                    <div className="flex justify-between items-center pt-4 border-t border-white/5 relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">Protocol</span>
                                            <span className="text-[10px] font-black text-liquid-gold uppercase italic tracking-widest">v5.0_ELITE</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">Cert</span>
                                            <span className="text-[10px] font-black text-white uppercase italic tracking-widest">ISO_9001</span>
                                        </div>
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        let base = selectedProduct.precio * (cantidad / 100); 
        if (acabado !== 'Ninguno') base += (5 * (cantidad / 100));
        return base > 0 ? base : selectedProduct.precio;
    }, [selectedProduct, cantidad, acabado, precioCustom]);

    const handleConfirm = async (directProduct?: Producto) => {
        const product = directProduct || selectedProduct;
        if (!product) {
            console.error("[CommercialFlow] Failure: No diagnostic product targeted.");
            return;
        }

        setIsSubmitting(true);
        console.log("[CommercialFlow] Initiating Protocol for:", product.nombre);

        try {
            const finalPrice = directProduct ? product.precio : precioFinal;
            
            const nuevoTrabajo: Partial<Trabajo> = {
                orden: Math.floor(100000 + Math.random() * 900000),
                clienteId: selectedClientId || 'cliente_express_comercial',
                titular: clienteNombre.trim() || 'Consumidor Final',
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

            console.log("[CommercialFlow] Mission Payload:", nuevoTrabajo);

            await onComplete({
                trabajo: nuevoTrabajo,
                clienteNombre: (clienteNombre.trim() || 'Consumidor Final'),
                clienteTelefono: clienteTelefono.trim(),
                clienteId: selectedClientId
            });
        } catch (error) {
            console.error("[CommercialFlow] Mission Critical Error:", error);
        } finally {
            setIsSubmitting(false);
        }
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
                        <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                            {step === 1 && <>Protocolo de <span className="text-gold-gradient">Suministros.</span></>}
                            {step === 2 && <>Configuración <span className="text-gold-gradient">Industrial.</span></>}
                            {step === 3 && <>Finalizar <span className="text-gold-gradient">Orden.</span></>}
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
                        {/* Unified Diagnostic Header */}
                        <div className="bg-black/60 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                            
                            <div className="p-4 md:p-6 flex flex-col lg:flex-row items-center gap-6">
                                {/* Search Terminal */}
                                <div className="flex-1 relative group w-full">
                                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-liquid-gold transition-colors z-20" />
                                    <input 
                                        type="text" 
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)} 
                                        placeholder="FILTRAR MATRIZ DE PRODUCTOS..." 
                                        className="w-full pl-16 pr-8 py-5 bg-black/40 border border-white/5 rounded-2xl text-lg font-black text-white focus:border-liquid-gold/20 transition-all placeholder:text-slate-800 italic outline-none relative z-10 uppercase tracking-tighter" 
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse" />
                                        <span className="text-[7px] font-black text-liquid-gold/40 uppercase tracking-[0.4em]">SYNC_ACTIVE</span>
                                    </div>
                                </div>

                                {/* Dynamic Filter Array */}
                                <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar w-full lg:w-auto">
                                    {commercialCategories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] transition-all relative whitespace-nowrap ${
                                                activeCategory === cat ? 'text-black bg-liquid-gold shadow-gold-glow-sm' : 'text-slate-500 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="relative z-10 italic">{cat}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Telemetry Bar (Bottom of HUD) */}
                            <div className="bg-liquid-gold/[0.02] border-t border-white/5 px-8 py-2 flex justify-between items-center">
                                <div className="flex gap-6">
                                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-blue-500" /> DATABASE_LOCAL: CONNECTED
                                    </span>
                                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500" /> ENCRYPTION: AES_256
                                    </span>
                                </div>
                                <span className="text-[7px] font-black text-liquid-gold/40 uppercase tracking-widest italic">
                                    LOG_STREAMING_v5.0.4
                                </span>
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
                            <div className="lg:col-span-8">
                                <div className="bg-black/60 border border-white/5 p-10 rounded-[3rem] space-y-12 shadow-inner relative overflow-hidden group/config">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    
                                    <div className="space-y-6">
                                         <div className="flex items-center gap-3">
                                             <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold shadow-gold-glow animate-pulse" />
                                             <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Volumen de Manufactura</label>
                                         </div>
                                         <div className="flex flex-col md:flex-row gap-10 items-stretch md:items-center">
                                             <div className="relative group">
                                                 <input 
                                                     type="number" 
                                                     value={cantidad} 
                                                     onChange={e => setCantidad(Number(e.target.value))} 
                                                     className="bg-black/80 border-2 border-white/10 w-full md:w-56 p-8 rounded-3xl text-5xl font-black text-white italic outline-none focus:border-liquid-gold/50 transition-all text-center tracking-tighter shadow-luxury-gold-sm" 
                                                 />
                                                 <div className="absolute -right-4 -top-4 px-3 py-1 bg-liquid-gold text-black text-[8px] font-black uppercase italic rounded-lg shadow-gold-glow">UNITS_READY</div>
                                             </div>
                                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                                                 {[100, 500, 1000, 5000].map(q => (
                                                     <button 
                                                         key={q} 
                                                         onClick={() => setCantidad(q)} 
                                                         className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${cantidad === q ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow scale-105' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/20'}`}
                                                     >
                                                         {q}
                                                     </button>
                                                 ))}
                                             </div>
                                         </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-blue-glow" />
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Dimensiones de Corte</label>
                                            </div>
                                            <div className="relative">
                                                <input type="text" value={tamano} onChange={e => setTamano(e.target.value)} className="w-full bg-black/80 border-2 border-white/10 p-6 rounded-2xl text-xl font-black text-white outline-none focus:border-blue-500/30 transition-all shadow-inner uppercase italic" placeholder="Ej: 10x15cm" />
                                                <div className="flex gap-2 mt-4">
                                                    {['A4', 'A5', 'Oficio', 'Tarjetas'].map(t => (
                                                        <button key={t} onClick={() => setTamano(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tamano === t ? 'bg-blue-600 text-white shadow-blue-glow' : 'bg-white/5 text-slate-700 hover:text-slate-400'}`}>{t}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-emerald-glow" />
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Procesamiento de Acabado</label>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Ninguno', 'Brillante', 'Mate', 'Uv_Selective'].map(a => (
                                                    <button 
                                                        key={a} 
                                                        onClick={() => setAcabado(a)} 
                                                        className={`px-4 py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${acabado === a ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-emerald-glow' : 'bg-white/5 border-white/5 text-slate-600 hover:text-slate-400'}`}
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
                                        <button 
                                            onClick={() => setStep(3)}
                                            className="mt-12 w-full py-6 bg-liquid-gold text-black rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-gold-glow flex items-center justify-center gap-4 group italic text-xs"
                                        >
                                            PROCEDER <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* PASO 3: FINALIZACION (IDENTIDAD Y CAPITAL) */}
                {step === 3 && selectedProduct && (
                    <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Identidad del Cliente & Liquidación (8/12) */}
                            <div className="lg:col-span-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Identidad del Cliente */}
                                    <div className="bg-black/40 border border-white/5 p-10 rounded-[3rem] space-y-8 shadow-inner relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
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
                                    <div className="bg-black/60 border border-liquid-gold/10 p-10 rounded-[3rem] space-y-8 shadow-luxury-gold relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
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
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button onClick={() => setStep(2)} className="px-8 py-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-white/10 text-[10px] flex items-center gap-3">
                                        <ArrowLeftIcon className="w-4 h-4" /> VOLVER
                                    </button>
                                    <button 
                                        onClick={() => handleConfirm()} 
                                        disabled={isSubmitting}
                                        className="flex-1 py-6 bg-liquid-gold text-black rounded-2xl font-black uppercase tracking-[0.4em] hover:scale-[1.02] active:scale-95 transition-all shadow-gold-glow-strong italic text-xs flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        {isSubmitting ? 'INICIANDO PROTOCOLO...' : 'INICIAR PROTOCOLO'} 
                                        {isSubmitting ? <Loader2Icon className="w-6 h-6 animate-spin" /> : <CheckCircleIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                                    </button>
                                </div>
                            </div>

                            {/* Tactical Telemetry HUD (4/12) - Filling the gap */}
                            <div className="lg:col-span-4">
                                <div className="bg-black/80 border border-white/5 rounded-[3rem] p-8 h-full flex flex-col gap-8 shadow-luxury relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                    
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] italic">Status de Operación</span>
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-green-glow" />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-1">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Misión Actual</p>
                                                <p className="text-sm font-black text-white italic uppercase tracking-tighter">COMERCIAL_ORDER_{Math.floor(Math.random() * 999)}</p>
                                            </div>
                                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-1">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Protocolo de Carga</p>
                                                <p className="text-sm font-black text-liquid-gold italic uppercase tracking-tighter">v5.0_ELITE_TERMINAL</p>
                                            </div>
                                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-1">
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fase de Despliegue</p>
                                                <p className="text-sm font-black text-white italic uppercase tracking-tighter">FINAL_AUTHORIZATION</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-end space-y-6">
                                        <div className="h-px bg-white/5 w-full" />
                                        <div className="space-y-4">
                                            <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] italic">Live_Telemetry_Stream</p>
                                            <div className="space-y-2 font-mono text-[9px]">
                                                <p className="text-emerald-500/60">[OK] SYSTEM_READY_V5.0</p>
                                                <p className="text-slate-600">[LOG] MISSION_INIT: COMERCIAL</p>
                                                <p className="text-slate-600">[LOG] PHASE_STEP_3_ACTIVE</p>
                                                <p className="text-liquid-gold animate-pulse">_WAITING_FOR_FINAL_AUTH...</p>
                                            </div>
                                        </div>
                                        <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-xl text-[8px] font-black uppercase tracking-[0.3em] transition-all border border-white/5 italic">
                                            MINIMIZAR TELEMETRÍA
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyboard Shortcuts Legend (Tactical HUD) */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-3 bg-black/60 backdrop-blur-xl border border-white/5 rounded-full shadow-2xl z-50 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white/10 rounded text-[8px] font-black text-liquid-gold border border-white/10">S</kbd>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">SEARCH_TERMINAL</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white/10 rounded text-[8px] font-black text-liquid-gold border border-white/10">C</kbd>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">CATEGORIES</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white/10 rounded text-[8px] font-black text-liquid-gold border border-white/10">ESC</kbd>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">CANCEL_MISSION</span>
                </div>
            </div>

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
