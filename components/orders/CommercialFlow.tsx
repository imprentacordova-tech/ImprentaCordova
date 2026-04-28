import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircleIcon, SparklesIcon, PrinterIcon, 
    ArrowRightIcon, ArrowLeftIcon, CreditCardIcon, UserIcon,
    ExclamationTriangleIcon, SearchIcon
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

    // Step 3: Cliente y Pago
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteTelefono, setClienteTelefono] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
    const [abono, setAbono] = useState<number>(0);

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

    const handleConfirm = () => {
        if (!selectedProduct) return;
        
        const nuevoTrabajo: Partial<Trabajo> = {
            orden: Math.floor(100000 + Math.random() * 900000),
            clienteId: selectedClientId || 'cliente_express_comercial',
            titular: clienteNombre || 'Consumidor Final',
            tipo: selectedProduct.nombre,
            subtipo: `${cantidad} x ${tamano} - ${acabado}`,
            cantidad,
            tamano,
            estado: TrabajoEstado.PENDIENTE,
            fechaEntrada: new Date().toISOString(),
            fechaEntrega: new Date(Date.now() + 86400000 * 2).toISOString(),
            total: precioFinal,
            abono: abono,
            saldo: precioFinal - abono,
            prioridad: 'Normal',
            detalle: `${cantidad} x ${tamano} - ${acabado}`,
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
            
            {/* Header / Steps Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8 border-b border-white/10 pb-10 relative z-10">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-liquid-gold animate-pulse shadow-gold-glow"></div>
                        <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.5em] italic">Misión Comercial de Respuesta Rápida</p>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                        {step === 1 && <span className="flex items-center gap-4">SUMINISTROS <span className="text-sm font-mono text-liquid-gold/20 tracking-tighter hidden sm:inline">TYPE_COMMERCIAL_A1</span></span>}
                        {step === 2 && <span className="flex items-center gap-4">CONFIGURACIÓN <span className="text-sm font-mono text-liquid-gold/20 tracking-tighter hidden sm:inline">SPEC_LAYER_V2</span></span>}
                        {step === 3 && <span className="flex items-center gap-4">FINALIZACIÓN <span className="text-sm font-mono text-liquid-gold/20 tracking-tighter hidden sm:inline">DEPLOY_READY</span></span>}
                    </h2>
                </div>
                <div className="flex items-center gap-8 bg-black/60 p-5 rounded-[2.5rem] border border-white/10 shadow-inner">
                    <div className="flex gap-4 px-4">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex flex-col items-center gap-2">
                                <div className={`h-1.5 transition-all duration-700 rounded-full ${step === s ? 'w-12 bg-liquid-gold shadow-gold-glow' : step > s ? 'w-6 bg-liquid-gold/40' : 'w-4 bg-white/10'}`} />
                                <span className={`text-[7px] font-black uppercase tracking-widest ${step === s ? 'text-liquid-gold' : 'text-slate-700'}`}>PH_{s}</span>
                            </div>
                        ))}
                    </div>
                    <div className="w-[1px] h-10 bg-white/10 mx-2"></div>
                    <button 
                        onClick={onCancel}
                        className="w-12 h-12 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl transition-all border border-white/10 flex items-center justify-center group"
                    >
                        <ExclamationTriangleIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* PASO 1: SELECCION DE PRODUCTO (ESTILO SERVICE SELECTOR) */}
                {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                        <div className="space-y-8 bg-black/40 p-10 rounded-[3rem] border border-white/10 shadow-inner relative overflow-hidden group">
                            {/* Scanning Beam */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-liquid-gold/10 animate-scan pointer-events-none" />
                            
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-150 rotate-12 transition-transform group-hover:scale-[1.7]"><PrinterIcon className="w-64 h-64 text-liquid-gold" /></div>
                            
                            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10">
                                <div className="space-y-4 flex-grow max-w-2xl">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest ml-4 italic">Búsqueda Técnica</label>
                                        <span className="text-[8px] text-liquid-gold/30 font-mono">SEARCH_REDUX_ACTIVE</span>
                                    </div>
                                    <div className="relative group">
                                        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-600 group-focus-within:text-liquid-gold transition-colors" />
                                        <input 
                                            type="text" 
                                            value={search} 
                                            onChange={e => setSearch(e.target.value)} 
                                            placeholder="Buscar protocolo comercial..." 
                                            className="w-full pl-16 pr-8 py-7 bg-black/40 border-2 border-white/5 rounded-3xl text-xl font-bold text-white focus:border-liquid-gold/30 transition-all placeholder:text-slate-800 italic shadow-inner" 
                                        />
                                    </div>
                                </div>

                                <div className="flex-shrink-0 w-full lg:w-auto">
                                    <label className="text-[10px] text-slate-600 font-black uppercase tracking-widest ml-4 mb-4 block italic text-center lg:text-left">Categorías Estratégicas</label>
                                    <div className="flex flex-wrap lg:flex-nowrap justify-center lg:justify-start gap-2 bg-black/60 p-2.5 rounded-[2.5rem] border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar max-w-full">
                                        {commercialCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveCategory(cat)}
                                                className={`px-6 py-4 rounded-[2rem] text-[9px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap relative flex items-center gap-2 group/tab ${
                                                    activeCategory === cat 
                                                        ? 'text-black z-10' 
                                                        : 'text-slate-500 hover:text-white'
                                                }`}
                                            >
                                                {activeCategory === cat && (
                                                    <motion.div 
                                                        layoutId="activeTab"
                                                        className="absolute inset-0 bg-liquid-gold rounded-[2rem] shadow-gold-glow -z-10"
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                                <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeCategory === cat ? 'bg-black' : 'bg-slate-800 group-hover/tab:bg-liquid-gold'}`}></div>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {commercialProducts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar pb-10">
                                {commercialProducts.map(p => (
                                    <CommercialProductCard 
                                        key={p.id} 
                                        p={p} 
                                        onSelect={() => { setSelectedProduct(p); setStep(2); }} 
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="col-span-full py-40 text-center space-y-8 bg-white/[0.01] rounded-[4rem] border border-white/5 border-dashed">
                                <PrinterIcon className="w-24 h-24 mx-auto text-slate-800 opacity-30" />
                                <div className="space-y-2">
                                    <p className="text-xl font-black text-slate-700 uppercase tracking-widest italic">Protocolo No Localizado</p>
                                    <p className="text-[10px] text-slate-800 font-black uppercase tracking-[0.4em]">Ajuste los filtros o use el buscador</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* PASO 2: DETALLES Y PRECIO (CONFIGURACION PREMIUM) */}
                {step === 2 && selectedProduct && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                        <div className="bg-white/[0.03] border border-white/5 p-10 rounded-[3.5rem] flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/[0.03] via-transparent to-transparent"></div>
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="w-20 h-20 bg-liquid-gold text-black rounded-[2rem] flex items-center justify-center shadow-gold-glow">
                                    <PrinterIcon className="w-10 h-10" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] italic">Configurando Protocolo:</p>
                                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">{selectedProduct.nombre}</h3>
                                </div>
                            </div>
                            <button onClick={() => setStep(1)} className="relative z-10 px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/5 flex items-center gap-3 group">
                                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Cambiar Producto
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-10">
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center px-4">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                                            <SparklesIcon className="w-3 h-3 text-liquid-gold"/> Volumen Industrial
                                        </label>
                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Calculadora Dinámica</span>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="relative group">
                                            <input 
                                                type="number" 
                                                value={cantidad} 
                                                onChange={e => setCantidad(Number(e.target.value))} 
                                                className="w-full bg-black/40 border-2 border-white/5 p-8 rounded-3xl text-white text-5xl font-black italic outline-none focus:border-liquid-gold/30 transition-all text-center tracking-tighter shadow-inner" 
                                            />
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-700 font-black italic text-xl uppercase">un</div>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {[100, 500, 1000, 2500, 5000].map(q => (
                                                <button 
                                                    key={q} 
                                                    onClick={() => setCantidad(q)} 
                                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${cantidad === q ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow-sm scale-105' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/20'}`}
                                                >
                                                    {q} un
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic ml-4">Dimensión Técnica</label>
                                        <div className="relative group">
                                            <input type="text" value={tamano} onChange={e => setTamano(e.target.value)} className="w-full bg-black/40 border-2 border-white/5 p-6 rounded-2xl text-white text-lg font-bold outline-none focus:border-liquid-gold/30 transition-all placeholder:text-slate-800" placeholder="Ej: 10x15cm" />
                                            <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
                                                {['A4', 'A5', 'Oficio', 'Tarjetas'].map(t => (
                                                    <button key={t} onClick={() => setTamano(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tamano === t ? 'bg-white/10 text-white border border-white/10' : 'text-slate-600 hover:text-slate-400'}`}>{t}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic ml-4">Finalizado Estético</label>
                                        <select 
                                            value={acabado} 
                                            onChange={e => setAcabado(e.target.value)} 
                                            className="w-full bg-black/40 border-2 border-white/5 p-6 rounded-2xl text-white text-base font-bold outline-none focus:border-liquid-gold/30 transition-all appearance-none cursor-pointer shadow-inner"
                                        >
                                            <option value="Ninguno">Producción Estándar</option>
                                            <option value="Plastificado Brillante">Efecto Cristal (Brillante)</option>
                                            <option value="Plastificado Mate">Textura Velvet (Mate)</option>
                                            <option value="Troquelado">Corte Especial (Troquel) </option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/[0.01] border-2 border-white/5 p-12 rounded-[4rem] flex flex-col justify-center items-center text-center relative overflow-hidden group shadow-luxury">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-liquid-gold/5 rounded-full blur-[100px] -mr-40 -mt-40 transition-opacity group-hover:opacity-100 opacity-40"></div>
                                
                                <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.5em] mb-10 z-10 italic">Inversión Industrial Final</p>
                                <motion.div 
                                    key={precioFinal}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="relative z-10 space-y-2 mb-12"
                                >
                                    <span className="text-8xl font-black text-white italic tracking-tighter leading-none block drop-shadow-2xl">
                                        {formatCurrency(precioFinal)}
                                    </span>
                                    <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] opacity-60">Sincronización de Costos en Tiempo Real</span>
                                </motion.div>
                                
                                <div className="w-full space-y-6 z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5"></div>
                                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Ajuste Estratégico</label>
                                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/5"></div>
                                    </div>
                                    <div className="relative max-w-[300px] mx-auto">
                                        <input 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={precioCustom || ''} 
                                            onChange={e => setPrecioCustom(Number(e.target.value))}
                                            className="w-full bg-white/5 border-2 border-white/5 p-6 rounded-3xl text-center text-white text-3xl font-black outline-none focus:border-liquid-gold/30 transition-all placeholder:text-slate-800 italic shadow-inner"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-liquid-gold/20 font-black italic text-2xl">$</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between gap-6 pt-12 border-t border-white/5">
                            <button onClick={() => setStep(1)} className="px-12 py-6 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-4 border border-white/5">
                                <ArrowLeftIcon className="w-5 h-5"/> Retroceder Fase
                            </button>
                            <button onClick={() => setStep(3)} className="px-16 py-6 bg-liquid-gold text-black rounded-3xl font-black uppercase tracking-[0.3em] hover:bg-white transition-all flex items-center justify-center gap-4 shadow-gold-glow italic group scale-105">
                                Siguiente Proceso <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform"/>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* PASO 3: FINALIZACION (IDENTIDAD Y CAPITAL) */}
                {step === 3 && selectedProduct && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            <div className="space-y-10">
                                <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                                    <div className="w-16 h-16 bg-liquid-gold/10 rounded-[1.8rem] flex items-center justify-center text-liquid-gold shadow-inner">
                                        <UserIcon className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Identidad de Misión</h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Asignación de Titular Comercial</p>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic ml-4">Nombre / Razón Social</label>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={clienteNombre} 
                                                onChange={e => setClienteNombre(e.target.value.toUpperCase())} 
                                                className="w-full bg-black/40 border-2 border-white/5 p-7 rounded-[2rem] text-white text-xl font-bold outline-none focus:border-liquid-gold/30 transition-all placeholder:text-slate-800 shadow-inner" 
                                                placeholder="BUSCAR O CREAR PERFIL..." 
                                            />
                                            <AnimatePresence>
                                                {clienteNombre.length > 2 && !selectedClientId && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 mt-4 bg-brand-dark/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-luxury z-50 max-h-64 overflow-y-auto custom-scrollbar overflow-hidden"
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
                                                                    className="w-full p-6 text-left hover:bg-liquid-gold/10 text-white font-black text-sm border-b border-white/5 flex justify-between items-center group transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-8 h-8 rounded-lg bg-liquid-gold/20 flex items-center justify-center text-liquid-gold text-[10px]">{c.nombre.charAt(0)}</div>
                                                                        <span className="uppercase italic tracking-tight">{c.nombre}</span>
                                                                    </div>
                                                                    <span className="text-[9px] text-slate-600 group-hover:text-liquid-gold transition-colors font-bold uppercase tracking-widest">{c.telefono[0] || 'SIN TELÉFONO'}</span>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="p-8 text-center space-y-2">
                                                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">No se encontraron perfiles</p>
                                                                <p className="text-[8px] text-liquid-gold font-bold uppercase tracking-[0.4em]">Se creará como Consumidor Final Express</p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic ml-4">Canal de Comunicación (WhatsApp)</label>
                                        <div className="relative">
                                            <input type="text" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} className="w-full bg-black/40 border-2 border-white/5 p-7 rounded-[2rem] text-white text-xl font-bold outline-none focus:border-liquid-gold/30 transition-all shadow-inner" placeholder="099-000-0000" />
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-liquid-gold/20"><PrinterIcon className="w-6 h-6" /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="flex items-center gap-6 border-b border-white/5 pb-8">
                                    <div className="w-16 h-16 bg-liquid-gold/10 rounded-[1.8rem] flex items-center justify-center text-liquid-gold shadow-inner">
                                        <CreditCardIcon className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Capital Estratégico</h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Liquidación y Reserva de Cupo</p>
                                    </div>
                                </div>
                                
                                <div className="bg-white/[0.02] p-12 rounded-[3.5rem] border-2 border-white/5 space-y-10 relative overflow-hidden group shadow-2xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex justify-between items-center relative z-10 border-b border-white/5 pb-8">
                                        <div className="space-y-1">
                                            <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Monto de Inversión</span>
                                            <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest">I.V.A. e Impuestos Aplicables Incluidos</p>
                                        </div>
                                        <span className="text-5xl font-black text-white italic tracking-tighter shadow-gold-glow-sm">{formatCurrency(precioFinal)}</span>
                                    </div>

                                    <div className="bg-black/40 p-8 rounded-[2.5rem] border border-white/5 relative z-10 space-y-4 group/abono hover:border-liquid-gold/30 transition-all shadow-inner">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[12px] font-black text-liquid-gold uppercase tracking-[0.3em] italic flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse"></div> Abono de Seguridad
                                            </span>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={abono || ''} 
                                                    onChange={e => setAbono(Number(e.target.value))}
                                                    className="w-48 bg-transparent border-b-2 border-liquid-gold/30 py-3 text-right text-liquid-gold font-black text-4xl outline-none focus:border-liquid-gold transition-all"
                                                    placeholder="0.00"
                                                />
                                                <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-liquid-gold/40 font-black italic text-2xl">$</span>
                                            </div>
                                        </div>
                                        <p className="text-[8px] text-slate-700 font-bold uppercase text-right tracking-[0.2em]">Mínimo sugerido: 50% de la inversión</p>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 relative z-10 px-4">
                                        <span className="text-[12px] font-black text-liquid-gold/60 uppercase tracking-[0.3em] italic">Saldo en Despliegue</span>
                                        <span className="text-3xl font-black text-white italic tracking-tighter">{formatCurrency(precioFinal - abono)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 pt-12 border-t border-white/5">
                            <button onClick={() => setStep(2)} className="px-12 py-7 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-4 border border-white/5">
                                <ArrowLeftIcon className="w-6 h-6"/> Corregir Configuración
                            </button>
                            <button 
                                onClick={handleConfirm} 
                                className="flex-1 py-7 bg-liquid-gold text-black rounded-[2.5rem] font-black uppercase tracking-[0.4em] hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-6 shadow-gold-glow text-xl italic active:scale-95 transform scale-105"
                            >
                                <PrinterIcon className="w-8 h-8" /> Desplegar Protocolo Industrial
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

const CommercialProductCard: React.FC<{ p: Producto; onSelect: () => void }> = ({ p, onSelect }) => {
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
            className={`group relative bg-white/[0.01] backdrop-blur-3xl rounded-[2.5rem] border transition-all duration-500 overflow-hidden cursor-pointer ${
                isHovered ? 'border-liquid-gold/30 bg-liquid-gold/5 shadow-gold-glow-sm' : 'border-white/5 hover:border-white/10'
            }`}
            onClick={onSelect}
        >
            <div className="p-8 space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                    <div className={`p-4 rounded-2xl transition-all duration-700 ${isHovered ? 'bg-liquid-gold text-black shadow-gold-glow scale-110' : 'bg-white/5 text-liquid-gold'}`}>
                        <PrinterIcon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl font-black text-white italic tracking-tighter transition-transform group-hover:scale-110">
                            ${(p.precio || 0).toFixed(2)}
                        </span>
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">Inversión Base</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight italic truncate leading-none">
                        {p.nombre}
                    </h3>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest truncate">
                        {p.categoria || 'Suministro General'}
                    </p>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDetails(!showDetails);
                        }}
                        className="text-[8px] font-black text-slate-600 hover:text-liquid-gold uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
                    >
                        <SparklesIcon className="w-3 h-3" /> {showDetails ? 'Cerrar' : 'Ficha'}
                    </button>
                    <ArrowRightIcon className={`w-5 h-5 transition-all duration-500 ${isHovered ? 'text-liquid-gold translate-x-1' : 'text-white/5'}`} />
                </div>

                <AnimatePresence>
                    {showDetails && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 p-6 bg-black/60 rounded-3xl border border-white/10 space-y-4">
                                <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center gap-2">
                                    <SparklesIcon className="w-3 h-3 text-liquid-gold" /> Especificaciones Técnicas
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed">
                                    {p.descripcion || 'Servicio de manufactura personalizada con estándares de calidad industrial Córdova.'}
                                </p>
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[7px] text-slate-600 font-black uppercase">Entrega Est.</p>
                                        <p className="text-[9px] text-white font-bold">24-48 Horas</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[7px] text-slate-600 font-black uppercase">Protocolo</p>
                                        <p className="text-[9px] text-liquid-gold font-bold uppercase">Calidad Elite</p>
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
