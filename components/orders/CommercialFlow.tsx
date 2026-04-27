import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircleIcon, SparklesIcon, PrinterIcon, 
    ArrowRightIcon, ArrowLeftIcon, CreditCardIcon, UserIcon 
} from '../Icons';
import { Producto, Trabajo, TrabajoEstado, TrabajoTipo } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';

interface CommercialFlowProps {
    onComplete: (data: {
        trabajo: Partial<Trabajo>, 
        clienteNombre: string, 
        clienteTelefono: string
    }) => void;
    onCancel: () => void;
}

export const CommercialFlow: React.FC<CommercialFlowProps> = ({ onComplete, onCancel }) => {
    const { productos, clientes } = useData();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    
    // Step 1: Producto
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [search, setSearch] = useState('');

    // Step 2: Detalles
    const [cantidad, setCantidad] = useState(100);
    const [tamano, setTamano] = useState('Estandar');
    const [acabado, setAcabado] = useState('Ninguno');
    const [precioCustom, setPrecioCustom] = useState<number>(0);

    // Step 3: Cliente y Pago
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteTelefono, setClienteTelefono] = useState('');
    const [abono, setAbono] = useState<number>(0);

    // Filtrar solo productos NO SRI
    const commercialProducts = useMemo(() => {
        return productos.filter(p => !p.esSRI && p.esActivo !== false && p.nombre.toLowerCase().includes(search.toLowerCase()));
    }, [productos, search]);

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
            clienteId: 'cliente_express_comercial',
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
            clienteTelefono
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
                <div className="flex gap-2">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`w-3 h-3 rounded-full ${step >= s ? 'bg-liquid-gold shadow-gold-glow' : 'bg-white/10'}`} />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* PASO 1: SELECCION DE PRODUCTO */}
                {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                        <input 
                            type="text" 
                            placeholder="Buscar producto comercial... ej. Tarjetas, Volantes" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-black/40 border-2 border-white/10 p-6 rounded-3xl text-white text-xl outline-none focus:border-liquid-gold/50 transition-all placeholder:text-white/20"
                        />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {commercialProducts.map(p => (
                                <button 
                                    key={p.id}
                                    onClick={() => { setSelectedProduct(p); setStep(2); }}
                                    className="bg-white/5 hover:bg-liquid-gold/10 border border-white/10 hover:border-liquid-gold/50 p-6 rounded-3xl text-left transition-all group flex flex-col gap-4"
                                >
                                    <div className="w-12 h-12 bg-white/10 group-hover:bg-liquid-gold group-hover:text-black text-white rounded-xl flex items-center justify-center transition-colors">
                                        <SparklesIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-white uppercase tracking-tighter text-lg leading-tight">{p.nombre}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.categoria}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* PASO 2: DETALLES Y PRECIO */}
                {step === 2 && selectedProduct && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <div className="bg-liquid-gold/10 border border-liquid-gold/30 p-6 rounded-3xl flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em]">PRODUCTO SELECCIONADO</p>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedProduct.nombre}</h3>
                            </div>
                            <button onClick={() => setStep(1)} className="text-liquid-gold hover:text-white text-[10px] font-black uppercase tracking-widest underline">Cambiar</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cantidad (unidades)</label>
                                    <input type="number" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white text-xl outline-none focus:border-liquid-gold/50" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tamaño / Medida</label>
                                    <input type="text" value={tamano} onChange={e => setTamano(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white text-xl outline-none focus:border-liquid-gold/50" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Acabados (Opcional)</label>
                                    <select value={acabado} onChange={e => setAcabado(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white text-lg outline-none focus:border-liquid-gold/50">
                                        <option value="Ninguno">Ninguno</option>
                                        <option value="Plastificado Brillante">Plastificado Brillante</option>
                                        <option value="Plastificado Mate">Plastificado Mate</option>
                                        <option value="Troquelado">Troquelado Especial</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="bg-black/40 border border-white/10 p-8 rounded-3xl flex flex-col justify-center items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/10 rounded-full blur-3xl"></div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 z-10">Precio Calculado</p>
                                <h4 className="text-6xl font-black text-white italic tracking-tighter mb-6 z-10">{formatCurrency(precioFinal)}</h4>
                                
                                <div className="w-full space-y-3 z-10">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ajuste Manual de Precio (Opcional)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00" 
                                        value={precioCustom || ''} 
                                        onChange={e => setPrecioCustom(Number(e.target.value))}
                                        className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-center text-white text-xl outline-none focus:border-liquid-gold/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-6 border-t border-white/10">
                            <button onClick={() => setStep(1)} className="px-8 py-4 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"><ArrowLeftIcon className="w-5 h-5"/> Volver</button>
                            <button onClick={() => setStep(3)} className="px-10 py-4 bg-liquid-gold text-black rounded-2xl font-black uppercase tracking-widest hover:bg-white transition-all flex items-center gap-3 shadow-gold-glow">Continuar a Datos <ArrowRightIcon className="w-5 h-5"/></button>
                        </div>
                    </motion.div>
                )}

                {/* PASO 3: DATOS DEL CLIENTE Y ABONO */}
                {step === 3 && selectedProduct && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                                    <UserIcon className="w-6 h-6 text-liquid-gold" />
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Datos del Cliente</h3>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo o Empresa</label>
                                    <input type="text" value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white text-xl outline-none focus:border-liquid-gold/50" placeholder="Consumidor Final" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Teléfono / WhatsApp</label>
                                    <input type="text" value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-white text-xl outline-none focus:border-liquid-gold/50" placeholder="099..." />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                                    <CreditCardIcon className="w-6 h-6 text-liquid-gold" />
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Liquidación</h3>
                                </div>
                                
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total a Pagar</span>
                                        <span className="text-2xl font-black text-white tracking-tighter">{formatCurrency(precioFinal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-black text-liquid-gold uppercase tracking-widest">Abono Inicial</span>
                                        <input 
                                            type="number" 
                                            value={abono || ''} 
                                            onChange={e => setAbono(Number(e.target.value))}
                                            className="w-32 bg-black/60 border border-liquid-gold/30 p-2 rounded-xl text-center text-liquid-gold font-bold text-xl outline-none focus:border-liquid-gold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                        <span className="text-[11px] font-black text-brand-red uppercase tracking-widest">Saldo Pendiente</span>
                                        <span className="text-xl font-black text-white tracking-tighter">{formatCurrency(precioFinal - abono)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-white/10">
                            <button onClick={() => setStep(2)} className="px-8 py-5 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                <ArrowLeftIcon className="w-5 h-5"/> Volver
                            </button>
                            <button onClick={handleConfirm} className="flex-1 py-5 bg-liquid-gold text-black rounded-2xl font-black uppercase tracking-[0.3em] hover:bg-white transition-all flex items-center justify-center gap-4 shadow-gold-glow text-sm">
                                <PrinterIcon className="w-6 h-6" /> Confirmar & Emitir Recibo Epson
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
            `}</style>
        </div>
    );
};
