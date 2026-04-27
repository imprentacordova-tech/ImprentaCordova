import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircleIcon, SparklesIcon, PrinterIcon, 
    ArrowRightIcon, ArrowLeftIcon, CreditCardIcon, UserIcon,
    ExclamationTriangleIcon
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
            tipo: TrabajoTipo.GENERAL,
            subtipo: selectedProduct.nombre,
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
        <div className="bg-black/20 backdrop-blur-3xl p-6 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden">
            {/* Header / Steps */}
            <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-8">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em]">FLUJO COMERCIAL</p>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                        {step === 1 && 'Selección de Producto'}
                        {step === 2 && 'Detalles y Precio'}
                        {step === 3 && 'Datos y Comprobante'}
                    </h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`w-3 h-3 rounded-full ${step >= s ? 'bg-liquid-gold shadow-gold-glow' : 'bg-white/10'}`} />
                        ))}
                    </div>
                    <button 
                        onClick={onCancel}
                        className="p-3 bg-white/5 hover:bg-brand-red/20 text-white/40 hover:text-brand-red rounded-xl transition-all border border-white/5 hover:border-brand-red/30"
                        title="Cancelar y volver"
                    >
                        <ExclamationTriangleIcon className="w-5 h-5 rotate-180" />
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* PASO 1: SELECCION DE PRODUCTO */}
                {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                        <div className="flex gap-4">
                            <div className="relative flex-1 group">
                                <input 
                                    type="text" 
                                    placeholder="Buscar producto comercial... ej. Tarjetas, Volantes" 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full bg-black/40 border-2 border-white/10 p-6 pl-14 rounded-3xl text-white text-xl outline-none focus:border-liquid-gold/50 transition-all placeholder:text-white/20"
                                />
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-liquid-gold transition-colors">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        {/* Pestañas de Categorías */}
                        <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar">
                            {commercialCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                        activeCategory === cat 
                                        ? 'bg-liquid-gold text-black border-liquid-gold shadow-gold-glow-sm' 
                                        : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {commercialProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1">
                                {commercialProducts.map(p => (
                                    <div 
                                        key={p.id}
                                        className="group relative bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-liquid-gold/40 rounded-[2rem] transition-all overflow-hidden flex flex-col"
                                    >
                                        <div 
                                            onClick={() => { setSelectedProduct(p); setStep(2); }}
                                            className="cursor-pointer p-6 space-y-4"
                                        >
                                            <div className="w-14 h-14 bg-white/5 group-hover:bg-liquid-gold/20 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-liquid-gold transition-all group-hover:scale-110">
                                                <PrinterIcon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-white uppercase tracking-tighter text-xl leading-tight group-hover:text-liquid-gold transition-colors">{p.nombre}</h3>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{p.categoria}</p>
                                            </div>
                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-lg font-black text-white/60 italic">${p.precio.toFixed(2)}</span>
                                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-liquid-gold group-hover:text-black transition-all">
                                                    <ArrowRightIcon className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Botón de Detalles */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setShowDetails(showDetails === p.id ? null : p.id); }}
                                            className="absolute top-4 right-4 text-[8px] font-black text-slate-600 hover:text-liquid-gold uppercase tracking-widest z-20"
                                        >
                                            {showDetails === p.id ? 'Cerrar' : 'Info'}
                                        </button>

                                        <AnimatePresence>
                                            {showDetails === p.id && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="bg-black/60 backdrop-blur-md px-6 py-4 border-t border-white/10 overflow-hidden"
                                                >
                                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                                        {p.descripcion || 'Sin descripción detallada para este producto industrial.'}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-white/5 border-dashed">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <SparklesIcon className="w-10 h-10 text-slate-700" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest italic">Sin Resultados</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Intente con otro término o categoría comercial.</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* PASO 2: DETALLES Y PRECIO */}
                {step === 2 && selectedProduct && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <div className="bg-liquid-gold/10 border border-liquid-gold/30 p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/5 to-transparent"></div>
                            <div className="relative z-10 text-center md:text-left">
                                <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] mb-1">MISION CONFIGURABLE</p>
                                <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic">{selectedProduct.nombre}</h3>
                            </div>
                            <button onClick={() => setStep(1)} className="relative z-10 px-6 py-3 bg-black/40 hover:bg-black text-liquid-gold hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-liquid-gold/20 flex items-center gap-2 group">
                                <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Cambiar Producto
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Volumen Industrial</label>
                                        <span className="text-liquid-gold font-black text-[10px] uppercase">Unidades</span>
                                    </div>
                                    <div className="relative group">
                                        <input type="number" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} className="w-full bg-black/40 border-2 border-white/5 p-6 rounded-2xl text-white text-3xl font-black italic outline-none focus:border-liquid-gold/30 transition-all text-center" />
                                        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
                                            {[100, 500, 1000, 5000].map(q => (
                                                <button key={q} onClick={() => setCantidad(q)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${cantidad === q ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow-sm' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'}`}>{q} un</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Dimensión Estratégica</label>
                                    <div className="relative group">
                                        <input type="text" value={tamano} onChange={e => setTamano(e.target.value)} className="w-full bg-black/40 border-2 border-white/5 p-6 rounded-2xl text-white text-xl font-bold outline-none focus:border-liquid-gold/30 transition-all" />
                                        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
                                            {['A4', 'A5', '1/4 Oficio', 'Tarjetas', 'Giga'].map(t => (
                                                <button key={t} onClick={() => setTamano(t)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${tamano === t ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow-sm' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'}`}>{t}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic ml-2">Acabado de Calidad</label>
                                    <select value={acabado} onChange={e => setAcabado(e.target.value)} className="w-full bg-black/40 border-2 border-white/5 p-6 rounded-2xl text-white text-lg font-bold outline-none focus:border-liquid-gold/30 transition-all appearance-none cursor-pointer">
                                        <option value="Ninguno">Producción Estándar (Sin Acabado)</option>
                                        <option value="Plastificado Brillante">Efecto Cristal (Laminado Brillante)</option>
                                        <option value="Plastificado Mate">Textura Velvet (Laminado Mate)</option>
                                        <option value="Troquelado">Corte Especial (Troquelado)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="bg-black/40 border-2 border-white/5 p-10 rounded-[3rem] flex flex-col justify-center items-center text-center relative overflow-hidden group shadow-luxury">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[80px] -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-red/5 rounded-full blur-[80px] -ml-32 -mb-32 transition-opacity group-hover:opacity-100 opacity-30"></div>
                                
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 z-10 italic">Inversión Final Proyectada</p>
                                <motion.h4 
                                    key={precioFinal}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-7xl font-black text-white italic tracking-tighter mb-8 z-10 shadow-gold-glow-sm"
                                >
                                    {formatCurrency(precioFinal)}
                                </motion.h4>
                                
                                <div className="w-full space-y-4 z-10">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="h-[1px] flex-1 bg-white/5"></div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ajuste Manual</label>
                                        <div className="h-[1px] flex-1 bg-white/5"></div>
                                    </div>
                                    <div className="relative group">
                                        <input 
                                            type="number" 
                                            placeholder="0.00" 
                                            value={precioCustom || ''} 
                                            onChange={e => setPrecioCustom(Number(e.target.value))}
                                            className="w-full bg-white/5 border-2 border-white/5 p-5 rounded-2xl text-center text-white text-2xl font-black outline-none focus:border-liquid-gold/30 transition-all placeholder:text-white/10 italic"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-liquid-gold/20 font-black italic">$</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-10 border-t border-white/5">
                            <button onClick={() => setStep(1)} className="px-8 py-5 bg-white/5 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-4 border border-white/5"><ArrowLeftIcon className="w-5 h-5"/> Retroceder</button>
                            <button onClick={() => setStep(3)} className="px-12 py-5 bg-liquid-gold text-black rounded-[1.5rem] font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center gap-4 shadow-gold-glow italic group">
                                Siguiente Fase <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* PASO 3: DATOS DEL CLIENTE Y ABONO */}
                {step === 3 && selectedProduct && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="flex items-center gap-5 border-b border-white/5 pb-6">
                                    <div className="w-12 h-12 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold">
                                        <UserIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Identidad del Cliente</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Nombre o Razón Social</label>
                                        <div className="relative">
                                            <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} className="w-full bg-black/40 border-2 border-white/5 p-6 rounded-2xl text-white text-xl font-bold outline-none focus:border-liquid-gold/30 transition-all" placeholder="Escriba para buscar o crear..." />
                                            {clienteNombre.length > 2 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-brand-dark/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto no-scrollbar">
                                                    {clientes.filter(c => c.nombre.toLowerCase().includes(clienteNombre.toLowerCase())).map(c => (
                                                        <button 
                                                            key={c.id} 
                                                            onClick={() => { 
                                                                setClienteNombre(c.nombre); 
                                                                setClienteTelefono(c.telefono[0] || '');
                                                                setSelectedClientId(c.id);
                                                            }}
                                                            className="w-full p-4 text-left hover:bg-liquid-gold/10 text-white font-bold text-sm border-b border-white/5 flex justify-between items-center group"
                                                        >
                                                            <span>{c.nombre}</span>
                                                            <span className="text-[9px] text-slate-500 group-hover:text-liquid-gold">{c.telefono[0] || 'Sin Tel.'}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Teléfono de Contacto</label>
                                        <input type="text" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} className="w-full bg-black/40 border-2 border-white/5 p-6 rounded-2xl text-white text-xl font-bold outline-none focus:border-liquid-gold/30 transition-all" placeholder="099-000-0000" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-5 border-b border-white/5 pb-6">
                                    <div className="w-12 h-12 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold">
                                        <CreditCardIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Liquidación de Capital</h3>
                                </div>
                                
                                <div className="bg-white/[0.02] p-10 rounded-[3rem] border-2 border-white/5 space-y-6 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Monto Total</span>
                                        <span className="text-3xl font-black text-white italic tracking-tighter">{formatCurrency(precioFinal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-black/40 p-6 rounded-3xl border border-white/5 relative z-10">
                                        <span className="text-[12px] font-black text-liquid-gold uppercase tracking-[0.2em] italic">Abono Inicial</span>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={abono || ''} 
                                                onChange={e => setAbono(Number(e.target.value))}
                                                className="w-40 bg-transparent border-b-2 border-liquid-gold/30 py-2 text-right text-liquid-gold font-black text-3xl outline-none focus:border-liquid-gold transition-all"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute -left-4 top-1/2 -translate-y-1/2 text-liquid-gold/40 font-black italic">$</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 relative z-10">
                                        <span className="text-[12px] font-black text-brand-red/60 uppercase tracking-[0.2em] italic">Saldo Pendiente</span>
                                        <span className="text-2xl font-black text-white italic tracking-tighter">{formatCurrency(precioFinal - abono)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 pt-10 border-t border-white/5">
                            <button onClick={() => setStep(2)} className="px-10 py-6 bg-white/5 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-4 border border-white/5">
                                <ArrowLeftIcon className="w-5 h-5"/> Corregir Datos
                            </button>
                            <button onClick={handleConfirm} className="flex-1 py-6 bg-liquid-gold text-black rounded-[2rem] font-black uppercase tracking-[0.3em] hover:bg-white transition-all flex items-center justify-center gap-5 shadow-gold-glow text-lg italic active:scale-95 transform">
                                <PrinterIcon className="w-7 h-7" /> Desplegar Orden Industrial
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(212, 175, 55, 0.3); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212, 175, 55, 0.6); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};
