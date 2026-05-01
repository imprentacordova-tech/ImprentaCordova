import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircleIcon, SparklesIcon, PrinterIcon, 
    ArrowRightIcon, ArrowLeftIcon, CreditCardIcon, UserIcon,
    BoltIcon, Loader2Icon, SearchIcon
} from '../Icons';
import { Producto, Trabajo, TrabajoEstado } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';
import PerspectiveCard from '../PerspectiveCard';

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
        <PerspectiveCard className="h-full">
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`group relative bg-[#050505]/80 backdrop-blur-2xl rounded-[2rem] border transition-all duration-700 overflow-hidden cursor-pointer h-full flex flex-col justify-between p-8 ${
                    isHovered 
                        ? isExpress ? 'border-blue-500/50 shadow-blue-glow scale-[1.01]' : 'border-liquid-gold/50 shadow-gold-glow scale-[1.01]' 
                        : 'border-white/5 shadow-2xl'
                }`}
                onClick={onSelect}
            >
                {/* HUD Decorative Corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/5 rounded-tl-[2rem] group-hover:border-liquid-gold/40 transition-colors duration-700" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/5 rounded-tr-[2rem] group-hover:border-liquid-gold/40 transition-colors duration-700" />
                
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

                <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-start">
                        <div className={`p-4 rounded-xl transition-all duration-1000 ${
                            isHovered 
                                ? isExpress ? 'bg-blue-600 text-white rotate-[360deg]' : 'bg-liquid-gold text-black rotate-[360deg] scale-110' 
                                : 'bg-white/5 text-liquid-gold'
                        }`}>
                            {isExpress ? <BoltIcon className="w-6 h-6" /> : <PrinterIcon className="w-6 h-6" />}
                        </div>
                        <div className="text-right">
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mb-1">UNIT_INVESTMENT</p>
                            <span className={`text-2xl font-black italic tracking-tighter block leading-none ${isExpress ? 'text-blue-400' : 'text-white'}`}>
                                {formatCurrency(p.precio)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic leading-tight group-hover:text-liquid-gold transition-colors duration-500">
                            {p.nombre}
                        </h3>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                            {p.categoria || 'GENERAL_OPS'}
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-green-glow" />
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">READY</span>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSelect(); }} 
                        className="px-5 py-2 bg-white/5 hover:bg-liquid-gold text-white hover:text-black rounded-lg font-black text-[9px] uppercase tracking-widest transition-all italic"
                    >
                        {isExpress ? 'EXPRESS_BOOT' : 'CONFIGURE'}
                    </button>
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
        if (!product) return;

        setIsSubmitting(true);
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
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {/* PASO 1: SELECCION DE PRODUCTO */}
                {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 h-full flex flex-col">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="bg-black/60 border border-white/5 p-1.5 rounded-full inline-flex items-center gap-1 shadow-luxury overflow-x-auto no-scrollbar max-w-full">
                                {commercialCategories.map(cat => (
                                    <button 
                                        key={cat} 
                                        onClick={() => setActiveCategory(cat)} 
                                        className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-500 whitespace-nowrap ${
                                            activeCategory === cat 
                                                ? 'bg-liquid-gold text-black shadow-gold-glow-sm italic scale-105 z-10' 
                                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="relative group w-full md:w-72">
                                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    value={search} 
                                    onChange={e => setSearch(e.target.value)} 
                                    placeholder="FILTRAR CATÁLOGO..." 
                                    className="w-full bg-white/5 border border-white/5 rounded-full pl-12 pr-6 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-liquid-gold/30 transition-all"
                                />
                            </div>
                        </div>

                        {/* High-Density Product Grid */}
                        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar max-h-[calc(100vh-320px)]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                                {commercialProducts.map(p => (
                                    <CommercialProductCard 
                                        key={p.id} 
                                        p={p} 
                                        isExpress={p.precio < 20} // Just a heuristic for express items
                                        onSelect={() => { setSelectedProduct(p); setStep(2); }}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* PASO 2: DETALLES Y CONFIGURACIÓN */}
                {step === 2 && selectedProduct && (
                    <motion.div key="s2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-8">
                                <div className="bg-[#050505]/90 border border-white/5 p-8 rounded-[2.5rem] space-y-10 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                                    
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold border border-liquid-gold/20 shadow-gold-glow-sm">
                                            <SparklesIcon className="w-8 h-8" />
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedProduct.nombre}</h2>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">CONFIGURACIÓN_INDUSTRIAL_v5.1</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                         <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] italic block ml-2">Volumen de Manufactura</label>
                                         <div className="flex flex-col md:flex-row gap-8 items-center">
                                             <div className="relative group w-full md:w-auto">
                                                 <input 
                                                     type="number" 
                                                     value={cantidad} 
                                                     onChange={e => setCantidad(Number(e.target.value))} 
                                                     className="bg-black/60 border-2 border-white/5 w-full md:w-56 p-6 rounded-3xl text-5xl font-black text-white italic outline-none focus:border-liquid-gold/30 transition-all text-center tracking-tighter" 
                                                 />
                                                 <div className="absolute -right-4 -top-4 px-3 py-1 bg-liquid-gold text-black text-[8px] font-black uppercase italic rounded-lg shadow-gold-glow">QUANTITY_SYNC</div>
                                             </div>
                                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 w-full">
                                                 {[100, 500, 1000, 5000].map(q => (
                                                     <button key={q} onClick={() => setCantidad(q)} className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${cantidad === q ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow-sm scale-105' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}>{q}</button>
                                                 ))}
                                             </div>
                                         </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] italic block ml-2">Dimensiones</label>
                                            <input type="text" value={tamano} onChange={e => setTamano(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-lg font-black text-white outline-none focus:border-liquid-gold/30 transition-all italic" placeholder="Ej: 10x15cm" />
                                            <div className="flex flex-wrap gap-2">
                                                {['A4', 'A5', 'Oficio', 'Tarjetas'].map(t => (
                                                    <button key={t} onClick={() => setTamano(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tamano === t ? 'bg-liquid-gold text-black italic' : 'bg-white/5 text-slate-500 hover:text-white'}`}>{t}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] italic block ml-2">Acabado</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['Ninguno', 'Brillante', 'Mate', 'UV_Laca'].map(a => (
                                                    <button key={a} onClick={() => setAcabado(a)} className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${acabado === a ? 'bg-liquid-gold/10 border-liquid-gold text-liquid-gold italic' : 'bg-white/5 border-white/5 text-slate-600 hover:text-white'}`}>{a}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-4 flex flex-col gap-4">
                                <div className="bg-liquid-gold p-8 rounded-[2.5rem] flex flex-col justify-between shadow-gold-glow relative overflow-hidden flex-1">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <BoltIcon className="w-32 h-32 text-black" />
                                    </div>
                                    <div className="space-y-4 relative z-10">
                                        <p className="text-[10px] font-black text-black/60 uppercase tracking-[0.4em] italic">Valuación_Misión</p>
                                        <div className="text-6xl font-black text-black italic tracking-tighter leading-none">{formatCurrency(precioFinal)}</div>
                                        <div className="pt-6 space-y-2 border-t border-black/10">
                                            <div className="flex justify-between text-[9px] font-black text-black/60 uppercase tracking-widest italic"><span>Escalado Vol.</span><span>x{cantidad/100}</span></div>
                                            <div className="flex justify-between text-[9px] font-black text-black/60 uppercase tracking-widest italic"><span>Base Ops</span><span>{formatCurrency(selectedProduct.precio)}</span></div>
                                        </div>
                                    </div>
                                    <button onClick={() => setStep(3)} className="mt-10 w-full py-6 bg-black text-white rounded-2xl font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl italic text-[11px] flex items-center justify-center gap-4">
                                        PROCEDER <ArrowRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <button onClick={() => setStep(1)} className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest transition-all italic">
                                    ELEGIR_OTRO_PRODUCTO
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* PASO 3: FINALIZACIÓN */}
                {step === 3 && selectedProduct && (
                    <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Identidad del Cliente */}
                            <div className="bg-[#050505]/90 border border-white/5 p-10 rounded-[3rem] space-y-8 shadow-inner relative overflow-hidden group">
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
                                                className="w-full bg-black/60 border border-white/10 p-5 rounded-2xl text-lg font-black text-white italic outline-none focus:border-liquid-gold/30 transition-all placeholder:text-slate-800" 
                                                placeholder="BUSCAR CLIENTE..." 
                                            />
                                            <AnimatePresence>
                                                {clienteNombre.length > 1 && !selectedClientId && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 mt-2 bg-brand-dark border border-white/10 rounded-2xl shadow-luxury-gold z-50 max-h-64 overflow-y-auto no-scrollbar"
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
                                                            <div className="p-6 text-center text-[10px] text-liquid-gold font-black uppercase tracking-[0.4em]">Perfiles No Hallados</div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic ml-2">Canal WhatsApp</label>
                                        <input type="text" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} className="w-full bg-black/60 border border-white/10 p-5 rounded-2xl text-lg font-black text-white italic outline-none focus:border-liquid-gold/30 transition-all" placeholder="099-000-0000" />
                                    </div>
                                </div>
                            </div>

                            {/* Liquidación de Pago */}
                            <div className="bg-[#050505]/90 border border-liquid-gold/10 p-10 rounded-[3rem] space-y-8 shadow-luxury-gold relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold shadow-luxury">
                                        <CreditCardIcon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Liquidación</h3>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Capital Asegurado</p>
                                    </div>
                                </div>

                                <div className="space-y-8 bg-black/40 p-8 rounded-3xl border border-white/5 shadow-inner">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Inversión Final</span>
                                        <span className="text-5xl font-black text-white italic tracking-tighter">{formatCurrency(precioFinal)}</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-liquid-gold">
                                            <span className="text-[11px] font-black uppercase tracking-[0.4em] italic">Abono</span>
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
                                        <div className="flex justify-between items-center text-slate-500 pt-2 border-t border-white/5">
                                            <span className="text-[11px] font-black uppercase tracking-[0.4em] italic">Saldo Pendiente</span>
                                            <span className="text-2xl font-black italic">{formatCurrency(precioFinal - abono)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setStep(2)} className="px-8 py-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-white/10 text-[10px] flex items-center gap-3 italic">
                                <ArrowLeftIcon className="w-4 h-4" /> RECONFIGURAR
                            </button>
                            <button 
                                onClick={() => handleConfirm()} 
                                disabled={isSubmitting}
                                className="flex-1 py-6 bg-liquid-gold text-black rounded-2xl font-black uppercase tracking-[0.4em] hover:scale-[1.01] transition-all shadow-gold-glow italic text-xs flex items-center justify-center gap-4 group disabled:opacity-50"
                            >
                                {isSubmitting ? 'SINCRONIZANDO...' : 'INICIAR PROTOCOLO DE PRODUCCIÓN'} 
                                {isSubmitting ? <Loader2Icon className="w-5 h-5 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.01); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.3); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
