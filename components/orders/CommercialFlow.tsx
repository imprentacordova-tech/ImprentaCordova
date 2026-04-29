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

interface CommercialFlowProps {
    onComplete: (data: {
        trabajo: Partial<Trabajo>, 
        clienteNombre: string, 
        clienteTelefono: string,
        clienteId?: string
    }) => void;
    onCancel: () => void;
}

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
            {/* Background Industrial Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #d4af37 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            {/* Header / Steps Navigation (Optimized) */}
            <div className="bg-brand-dark/95 backdrop-blur-3xl p-6 md:p-12 border-b border-white/5 relative overflow-hidden -mx-6 md:-mx-10 -mt-6 md:-mt-10 mb-8 md:mb-16">
                {/* Industrial Grid Background */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                     style={{ backgroundImage: 'linear-gradient(var(--printing-blue) 1px, transparent 1px), linear-gradient(90deg, var(--printing-blue) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-printing-blue/20 border border-printing-blue/40 rounded-md">
                                <span className="text-[8px] font-mono text-printing-blue tracking-[0.4em] uppercase">SYSTEM: ACTIVE</span>
                            </div>
                            <span className="text-[8px] font-mono text-slate-500 tracking-[0.4em] uppercase">ELITE_WORKFLOW_v4.2</span>
                        </div>
                        <div className="flex items-center gap-4 md:gap-8">
                            <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                                {step === 1 && <>Suministros <span className="text-gold-gradient">Industriales.</span></>}
                                {step === 2 && <>Configuración <span className="text-gold-gradient">Elite.</span></>}
                                {step === 3 && <>Despliegue <span className="text-gold-gradient">Final.</span></>}
                            </h2>
                        </div>
                    </div>
                
                <div className="flex items-center gap-2 md:gap-6 w-full md:w-auto">
                    <div className="flex-1 md:flex-none flex items-center gap-3 bg-black/40 p-2 md:p-3 rounded-2xl border border-white/10 shadow-inner overflow-x-auto no-scrollbar">
                        {/* Turbo Mode Toggle - Larger for mobile */}
                        <button 
                            onClick={() => setIsExpressMode(!isExpressMode)}
                            className={`flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl transition-all duration-700 border flex-shrink-0 active:scale-95 ${
                                isExpressMode 
                                    ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                            }`}
                        >
                            <BoltIcon className={`w-4 h-4 md:w-5 md:h-5 ${isExpressMode ? 'animate-pulse' : ''}`} />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">TURBO</span>
                                <span className="text-[6px] md:text-[8px] font-bold opacity-60 uppercase">{isExpressMode ? 'ACTIVADO' : 'OFF'}</span>
                            </div>
                        </button>

                        <div className="flex gap-2 md:gap-4 px-2">
                            {[1, 2, 3].map(s => (
                                <div key={s} className="flex flex-col items-center gap-1.5">
                                    <div className={`h-1.5 md:h-2 transition-all duration-700 rounded-full ${step === s ? 'w-6 md:w-12 bg-liquid-gold shadow-gold-glow' : step > s ? 'w-3 md:w-6 bg-liquid-gold/40' : 'w-2 md:w-4 bg-white/10'}`} />
                                    <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${step === s ? 'text-liquid-gold' : 'text-slate-800'}`}>PH_{s}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={onCancel}
                        className="w-12 h-12 md:w-16 md:h-16 bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-2xl transition-all border border-white/10 flex items-center justify-center group flex-shrink-0 active:scale-90"
                    >
                        <ExclamationTriangleIcon className="w-5 h-5 md:w-7 md:h-7 transition-transform group-hover:rotate-12" />
                    </button>
                </div>
            </div>
        </div>
            
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-12" />

            <AnimatePresence mode="wait">
                {/* PASO 1: SELECCION DE PRODUCTO (ESTILO SERVICE SELECTOR) */}
                {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 md:space-y-12">
                        <div className="space-y-4 md:space-y-8 bg-black/40 p-4 md:p-10 rounded-2xl md:rounded-[3rem] border border-white/10 shadow-inner relative overflow-hidden group">
                            {/* Scanning Beam */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-liquid-gold/10 animate-scan pointer-events-none" />
                            
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-100 md:scale-150 rotate-12 transition-transform group-hover:scale-[1.7] hidden md:block"><PrinterIcon className="w-64 h-64 text-liquid-gold" /></div>
                            
                            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-10 relative z-10">
                                <div className="space-y-3 md:space-y-4 flex-grow max-w-2xl w-full">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-[9px] md:text-[11px] text-slate-600 font-black uppercase tracking-widest italic">Búsqueda Técnica</label>
                                        <span className="text-[6px] md:text-[9px] text-liquid-gold/30 font-mono tracking-tighter">SEARCH_REDUX_ACTIVE</span>
                                    </div>
                                    <div className="relative group">
                                        <SearchIcon className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-7 md:w-7 text-slate-600 group-focus-within:text-liquid-gold transition-colors" />
                                        <input 
                                            type="text" 
                                            value={search} 
                                            onChange={e => setSearch(e.target.value)} 
                                            placeholder="Buscar protocolo comercial..." 
                                            className="w-full pl-11 md:pl-16 pr-4 md:pr-8 py-3 md:py-7 bg-black/40 border-2 border-white/5 rounded-xl md:rounded-[2.5rem] text-sm md:text-2xl font-black text-white focus:border-liquid-gold/30 transition-all placeholder:text-slate-800 italic shadow-inner outline-none" 
                                        />
                                    </div>
                                </div>

                                <div className="flex-shrink-0 w-full lg:w-auto">
                                    <label className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-widest ml-2 md:ml-4 mb-2 md:mb-4 block italic text-center lg:text-left">Categorías Estratégicas</label>
                                    <div className="flex flex-nowrap justify-start gap-1.5 md:gap-2 bg-black/60 p-1 md:p-2 rounded-xl md:rounded-[2.5rem] border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar max-w-full">
                                        {commercialCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveCategory(cat)}
                                                className={`px-3 md:px-6 py-2 md:py-4 rounded-lg md:rounded-[2rem] text-[7px] md:text-[9px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap relative flex items-center gap-1.5 md:gap-2 group/tab ${
                                                    activeCategory === cat 
                                                        ? 'text-black z-10' 
                                                        : 'text-slate-500 hover:text-white'
                                                }`}
                                            >
                                                {activeCategory === cat && (
                                                    <motion.div 
                                                        layoutId="activeTab"
                                                        className="absolute inset-0 bg-liquid-gold rounded-lg md:rounded-[2rem] shadow-gold-glow -z-10"
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                                <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full transition-all ${activeCategory === cat ? 'bg-black' : 'bg-slate-800 group-hover/tab:bg-liquid-gold'}`}></div>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
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
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 md:space-y-12">
                        <div className="bg-white/[0.03] border border-white/5 p-4 md:p-10 rounded-2xl md:rounded-[3.5rem] flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8 relative overflow-hidden group shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/[0.03] via-transparent to-transparent"></div>
                            <div className="relative z-10 flex items-center gap-3 md:gap-6 w-full">
                                <div className="w-12 h-12 md:w-20 md:h-20 bg-liquid-gold text-black rounded-xl md:rounded-[2rem] flex items-center justify-center shadow-gold-glow flex-shrink-0">
                                    <PrinterIcon className="w-6 h-6 md:w-10 md:h-10" />
                                </div>
                                <div className="space-y-0.5 md:space-y-1 overflow-hidden">
                                    <p className="text-[7px] md:text-[10px] font-black text-liquid-gold uppercase tracking-[0.2em] md:tracking-[0.4em] italic">Protocolo Maestro:</p>
                                    <h3 className="text-lg md:text-4xl font-black text-white uppercase tracking-[-0.04em] italic leading-none truncate">{selectedProduct.nombre}</h3>
                                </div>
                            </div>
                            <button onClick={() => setStep(1)} className="relative z-10 w-full md:w-auto px-4 py-2.5 md:px-8 md:py-4 bg-white/5 hover:bg-white/10 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-lg md:rounded-2xl transition-all border border-white/5 flex items-center justify-center gap-2 group active:scale-95">
                                <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Cambiar
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                            <div className="space-y-6 md:space-y-10">
                                <div className="space-y-3 md:space-y-5">
                                    <div className="flex justify-between items-center px-1 md:px-4">
                                        <label className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                                            <SparklesIcon className="w-3 h-3 text-liquid-gold"/> Volumen Industrial
                                        </label>
                                        <span className="text-[7px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest">Dinámico</span>
                                    </div>
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="relative group">
                                            <input 
                                                type="number" 
                                                value={cantidad} 
                                                onChange={e => setCantidad(Number(e.target.value))} 
                                                className="w-full bg-black/40 border-2 border-white/5 p-5 md:p-8 rounded-2xl md:rounded-3xl text-white text-3xl md:text-5xl font-black italic outline-none focus:border-liquid-gold/30 transition-all text-center tracking-tighter shadow-inner" 
                                            />
                                            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-slate-700 font-black italic text-sm md:text-xl uppercase">un</div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 md:gap-3 justify-center md:justify-start">
                                            {[100, 500, 1000, 2500, 5000].map(q => (
                                                <button 
                                                    key={q} 
                                                    onClick={() => setCantidad(q)} 
                                                    className={`px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border active:scale-95 ${cantidad === q ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow-sm scale-105' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/20'}`}
                                                >
                                                    {q} un
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                                    <div className="space-y-2 md:space-y-4">
                                        <label className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest italic ml-1 md:ml-4">Dimensión Técnica</label>
                                        <div className="relative group">
                                            <input type="text" value={tamano} onChange={e => setTamano(e.target.value)} className="w-full bg-black/40 border-2 border-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl text-white text-sm md:text-lg font-bold outline-none focus:border-liquid-gold/30 transition-all placeholder:text-slate-800" placeholder="Ej: 10x15cm" />
                                            <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-1">
                                                {['A4', 'A5', 'Oficio', 'Tarjetas'].map(t => (
                                                    <button key={t} onClick={() => setTamano(t)} className={`px-2.5 py-1.5 rounded-lg text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap active:scale-95 ${tamano === t ? 'bg-white/10 text-white border border-white/10' : 'text-slate-600 hover:text-slate-400'}`}>{t}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:space-y-4">
                                        <label className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest italic ml-1 md:ml-4">Finalizado Estético</label>
                                        <select 
                                            value={acabado} 
                                            onChange={e => setAcabado(e.target.value)} 
                                            className="w-full bg-black/40 border-2 border-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl text-white text-xs md:text-base font-bold outline-none focus:border-liquid-gold/30 transition-all appearance-none cursor-pointer shadow-inner"
                                        >
                                            <option value="Ninguno">Producción Estándar</option>
                                            <option value="Plastificado Brillante">Efecto Cristal (Brillante)</option>
                                            <option value="Plastificado Mate">Textura Velvet (Mate)</option>
                                            <option value="Troquelado">Corte Especial (Troquel) </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/[0.01] border-2 border-white/5 p-6 md:p-12 rounded-3xl md:rounded-[4rem] flex flex-col justify-center items-center text-center relative overflow-hidden group shadow-luxury min-h-[250px] md:min-h-0">
                                <div className="absolute top-0 right-0 w-40 h-40 md:w-80 md:h-80 bg-liquid-gold/5 rounded-full blur-[60px] md:blur-[100px] -mr-20 -mt-20 md:-mr-40 md:-mt-40 transition-opacity group-hover:opacity-100 opacity-40"></div>
                                
                                <p className="text-[8px] md:text-[12px] font-black text-slate-600 uppercase tracking-[0.2em] md:tracking-[0.5em] mb-4 md:mb-10 z-10 italic">Inversión Industrial</p>
                                <motion.div 
                                    key={precioFinal}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative z-10 space-y-1 mb-6 md:mb-12"
                                >
                                    <span className="text-4xl md:text-8xl font-black text-white italic tracking-[-0.04em] leading-none block drop-shadow-2xl">
                                        {formatCurrency(precioFinal)}
                                    </span>
                                    <span className="text-[7px] md:text-[10px] font-black text-liquid-gold uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-60">Sincronización de Costos</span>
                                </motion.div>
                                
                                <div className="w-full space-y-3 md:space-y-6 z-10">
                                    <div className="flex items-center gap-3 md:gap-6">
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5"></div>
                                        <label className="text-[8px] md:text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] md:tracking-[0.3em]">Ajuste Manual</label>
                                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5"></div>
                                    </div>
                                    <div className="relative max-w-[150px] md:max-w-[300px] mx-auto">
                                        <input 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={precioCustom || ''} 
                                            onChange={e => setPrecioCustom(Number(e.target.value))}
                                            className="w-full bg-white/5 border-2 border-white/5 p-3 md:p-6 rounded-xl md:rounded-3xl text-center text-white text-xl md:text-3xl font-black outline-none focus:border-liquid-gold/30 transition-all placeholder:text-slate-800 italic shadow-inner"
                                        />
                                        <div className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 text-liquid-gold/20 font-black italic text-lg md:text-2xl">$</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between gap-3 md:gap-6 pt-6 md:pt-12 border-t border-white/5">
                            <button onClick={() => setStep(1)} className="w-full sm:w-auto order-2 sm:order-1 px-6 md:px-12 py-3.5 md:py-6 bg-white/5 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 md:gap-4 border border-white/5 active:scale-95">
                                <ArrowLeftIcon className="w-3.5 h-3.5 md:w-5 md:h-5"/> Retroceder
                            </button>
                            <button onClick={() => setStep(3)} className="w-full sm:w-auto order-1 sm:order-2 px-8 md:px-16 py-4 md:py-6 bg-liquid-gold text-black rounded-xl md:rounded-3xl font-black uppercase tracking-[0.15em] md:tracking-[0.3em] hover:bg-white transition-all flex items-center justify-center gap-3 md:gap-4 shadow-gold-glow italic group sm:scale-105 active:scale-95">
                                Siguiente <ArrowRightIcon className="w-4 h-4 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform"/>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* PASO 3: FINALIZACION (IDENTIDAD Y CAPITAL) */}
                {step === 3 && selectedProduct && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 md:space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
                            <div className="space-y-6 md:space-y-10">
                                <div className="flex items-center gap-3 md:gap-6 border-b border-white/5 pb-4 md:pb-8">
                                    <div className="w-10 h-10 md:w-16 md:h-16 bg-liquid-gold/10 rounded-xl md:rounded-[1.8rem] flex items-center justify-center text-liquid-gold shadow-inner">
                                        <UserIcon className="w-5 h-5 md:w-8 md:h-8" />
                                    </div>
                                    <div className="space-y-0.5 md:space-y-1">
                                        <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-[-0.04em] italic">Identidad Industrial</h3>
                                        <p className="text-[7px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Asignación de Titular</p>
                                    </div>
                                </div>
                                <div className="space-y-4 md:space-y-8">
                                    <div className="space-y-2 md:space-y-4">
                                        <label className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest italic ml-1 md:ml-4">Nombre / Razón Social</label>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={clienteNombre} 
                                                onChange={e => setClienteNombre(e.target.value.toUpperCase())} 
                                                className="w-full bg-black/40 border-2 border-white/5 p-4 md:p-7 rounded-xl md:rounded-[2rem] text-sm md:text-xl font-bold outline-none focus:border-liquid-gold/30 transition-all placeholder:text-slate-800 shadow-inner" 
                                                placeholder="BUSCAR O CREAR PERFIL..." 
                                            />
                                            <AnimatePresence>
                                                {clienteNombre.length > 2 && !selectedClientId && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 mt-1 md:mt-4 bg-brand-dark/95 backdrop-blur-2xl border border-white/10 rounded-xl md:rounded-[2rem] shadow-luxury z-50 max-h-56 md:max-h-64 overflow-y-auto custom-scrollbar overflow-hidden"
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
                                                                    className="w-full p-3 md:p-6 text-left hover:bg-liquid-gold/10 text-white font-black text-[10px] md:text-sm border-b border-white/5 flex justify-between items-center group transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                                                                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-liquid-gold/20 flex items-center justify-center text-liquid-gold text-[8px] md:text-[10px] flex-shrink-0">{c.nombre.charAt(0)}</div>
                                                                        <span className="uppercase italic tracking-tight truncate">{c.nombre}</span>
                                                                    </div>
                                                                    <span className="text-[6px] md:text-[9px] text-slate-600 group-hover:text-liquid-gold transition-colors font-bold uppercase tracking-widest flex-shrink-0">{c.telefono[0] || 'SIN TELÉFONO'}</span>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 md:p-8 text-center space-y-1 md:space-y-2">
                                                                <p className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-widest">No se encontraron perfiles</p>
                                                                <p className="text-[7px] md:text-[8px] text-liquid-gold font-bold uppercase tracking-[0.2em] md:tracking-[0.4em]">Se creará como Consumidor Final</p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:space-y-4">
                                        <label className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest italic ml-1 md:ml-4">WhatsApp</label>
                                        <div className="relative">
                                            <input type="text" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} className="w-full bg-black/40 border-2 border-white/5 p-4 md:p-7 rounded-xl md:rounded-[2rem] text-sm md:text-xl font-bold outline-none focus:border-liquid-gold/30 transition-all shadow-inner" placeholder="099-000-0000" />
                                            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-liquid-gold/20"><PrinterIcon className="w-5 h-5 md:w-6 md:h-6" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 md:space-y-10">
                                <div className="flex items-center gap-3 md:gap-6 border-b border-white/5 pb-4 md:pb-8">
                                    <div className="w-10 h-10 md:w-16 md:h-16 bg-liquid-gold/10 rounded-xl md:rounded-[1.8rem] flex items-center justify-center text-liquid-gold shadow-inner">
                                        <CreditCardIcon className="w-5 h-5 md:w-8 md:h-8" />
                                    </div>
                                    <div className="space-y-0.5 md:space-y-1">
                                        <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-[-0.04em] italic">Liquidación Maestra</h3>
                                        <p className="text-[7px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Reserva de Cupo</p>
                                    </div>
                                </div>
                                
                                <div className="bg-white/[0.02] p-5 md:p-12 rounded-3xl md:rounded-[3.5rem] border-2 border-white/5 space-y-5 md:space-y-10 relative overflow-hidden group shadow-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-3 md:pb-8">
                                        <div className="space-y-0.5 md:space-y-1">
                                            <span className="text-[10px] md:text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] italic">Inversión</span>
                                            <p className="text-[6px] md:text-[8px] text-slate-700 font-black uppercase tracking-widest hidden sm:block">I.V.A. e Impuestos Incluidos</p>
                                        </div>
                                        <span className="text-2xl md:text-5xl font-black text-white italic tracking-[-0.04em] shadow-gold-glow-sm">{formatCurrency(precioFinal)}</span>
                                    </div>

                                    <div className="bg-black/40 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/5 relative z-10 space-y-2 md:space-y-4 group/abono hover:border-liquid-gold/30 transition-all shadow-inner">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                            <span className="text-[10px] md:text-[12px] font-black text-liquid-gold uppercase tracking-[0.2em] md:tracking-[0.3em] italic flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse"></div> Abono
                                            </span>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={abono || ''} 
                                                    onChange={e => setAbono(Number(e.target.value))}
                                                    className="w-full sm:w-40 bg-transparent border-b-2 border-liquid-gold/30 py-1.5 text-right text-liquid-gold font-black text-xl md:text-4xl outline-none focus:border-liquid-gold transition-all"
                                                    placeholder="0.00"
                                                />
                                                <span className="absolute -left-4 md:left-[-1.5rem] top-1/2 -translate-y-1/2 text-liquid-gold/40 font-black italic text-lg md:text-2xl">$</span>
                                            </div>
                                        </div>
                                        <p className="text-[6px] md:text-[8px] text-slate-700 font-bold uppercase text-right tracking-[0.1em] md:tracking-[0.2em]">Mínimo sugerido: 50%</p>
                                    </div>

                                    <div className="flex justify-between items-center pt-1 md:pt-4 relative z-10 px-1 md:px-4">
                                        <span className="text-[10px] md:text-[12px] font-black text-liquid-gold/60 uppercase tracking-[0.2em] md:tracking-[0.3em] italic">Saldo</span>
                                        <span className="text-lg md:text-3xl font-black text-white italic tracking-[-0.04em]">{formatCurrency(precioFinal - abono)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 md:gap-8 pt-6 md:pt-12 border-t border-white/5">
                            <button onClick={() => setStep(2)} className="w-full sm:w-auto order-2 sm:order-1 px-6 md:px-12 py-3.5 md:py-7 bg-white/5 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 md:gap-4 border border-white/5 active:scale-95">
                                <ArrowLeftIcon className="w-4 h-4 md:w-6 md:h-6"/> Corregir
                            </button>
                            <button 
                                onClick={() => handleConfirm()} 
                                className="flex-1 order-1 sm:order-2 py-4 md:py-7 bg-liquid-gold text-black rounded-xl md:rounded-[2.5rem] font-black uppercase tracking-[0.15em] md:tracking-[0.4em] hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 md:gap-6 shadow-gold-glow text-base md:text-xl italic active:scale-95 transform sm:scale-105"
                            >
                                <PrinterIcon className="w-5 h-5 md:w-8 md:h-8" /> Desplegar
                            </button>
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

const CommercialProductCard: React.FC<{ p: Producto; isExpress: boolean; onSelect: () => void }> = ({ p, isExpress, onSelect }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group relative bg-white/[0.01] backdrop-blur-3xl rounded-[2rem] md:rounded-[2.5rem] border transition-all duration-500 overflow-hidden cursor-pointer ${
                isHovered 
                    ? isExpress ? 'border-blue-500/30 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'border-liquid-gold/30 bg-liquid-gold/5 shadow-gold-glow-sm' 
                    : 'border-white/5 hover:border-white/10'
            }`}
            onClick={onSelect}
        >
            <div className="p-5 md:p-8 space-y-4 md:space-y-6 relative z-10">
                {/* Animated Scan Line on Hover */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div 
                            initial={{ top: '-10%' }}
                            animate={{ top: '110%' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            className={`absolute left-0 right-0 h-[1px] z-20 pointer-events-none ${isExpress ? 'bg-blue-400/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-liquid-gold/30 shadow-gold-glow-sm'}`}
                        />
                    )}
                </AnimatePresence>

                <div className="flex justify-between items-start relative z-30">
                    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-700 ${
                        isHovered 
                            ? isExpress ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-liquid-gold text-black shadow-gold-glow scale-110' 
                            : 'bg-white/5 text-liquid-gold'
                    }`}>
                        {isExpress ? <BoltIcon className="w-5 h-5 md:w-6 md:h-6" /> : <PrinterIcon className="w-5 h-5 md:w-6 md:h-6" />}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className={`text-xl md:text-2xl font-black italic tracking-tighter transition-transform group-hover:scale-110 ${isExpress ? 'text-blue-400' : 'text-white'}`}>
                            ${(p.precio || 0).toFixed(2)}
                        </span>
                        <span className="text-[6px] md:text-[7px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">Inversión Base</span>
                    </div>
                </div>

                <div className="space-y-1.5 md:space-y-2 relative z-30">
                    {isExpress && (
                        <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <span className="text-[6px] md:text-[7px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md tracking-widest italic animate-pulse">VENTA_TURBO_ACTIVA</span>
                        </div>
                    )}
                    <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight italic truncate leading-none">
                        {p.nombre}
                    </h3>
                    <p className="text-[8px] md:text-[9px] text-slate-600 font-bold uppercase tracking-widest truncate">
                        {p.categoria || 'Suministro General'}
                    </p>
                </div>

                <div className="pt-4 md:pt-6 border-t border-white/5 flex justify-between items-center relative z-30">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDetails(!showDetails);
                        }}
                        className="text-[7px] md:text-[8px] font-black text-slate-600 hover:text-liquid-gold uppercase tracking-[0.2em] transition-colors flex items-center gap-1.5 md:gap-2 active:scale-90"
                    >
                        <SparklesIcon className="w-3 h-3" /> {showDetails ? 'Cerrar' : 'Ficha'}
                    </button>
                    {isExpress ? (
                        <div className="flex items-center gap-1.5 md:gap-2 text-[7px] md:text-[8px] font-black text-blue-400 animate-bounce">
                            <span>VENTA RÁPIDA</span>
                            <ArrowRightIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </div>
                    ) : (
                        <ArrowRightIcon className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-500 ${isHovered ? 'text-liquid-gold translate-x-1' : 'text-white/5'}`} />
                    )}
                </div>

                <AnimatePresence>
                    {showDetails && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 md:mt-4 p-4 md:p-6 bg-black/60 rounded-2xl md:rounded-3xl border border-white/10 space-y-3 md:space-y-4">
                                <p className="text-[9px] md:text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <SparklesIcon className="w-3 h-3 text-liquid-gold" /> Especificaciones Técnicas
                                </p>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-medium italic leading-relaxed">
                                    {p.descripcion || 'Servicio de manufactura personalizada con estándares de calidad industrial Córdova.'}
                                </p>
                                <div className="grid grid-cols-2 gap-2 md:gap-3 pt-3 md:pt-4 border-t border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[6px] md:text-[7px] text-slate-600 font-black uppercase">Entrega Est.</p>
                                        <p className="text-[8px] md:text-[9px] text-white font-bold">24-48 Horas</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[6px] md:text-[7px] text-slate-600 font-black uppercase">Protocolo</p>
                                        <p className="text-[8px] md:text-[9px] text-liquid-gold font-bold uppercase">Elite</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
