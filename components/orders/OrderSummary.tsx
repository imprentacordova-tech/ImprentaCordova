
import React, { useState } from 'react';
import { Cliente, Regimen } from '../../types';
import { formatCurrency } from '../../utils';
import { 
    TrashIcon, CheckCircleIcon, Loader2Icon, WalletIcon, 
    ShieldCheckIcon, KeyIcon, ArrowRightIcon, 
    ClockIcon, SparklesIcon, UserPlusIcon, CheckBadgeIcon,
    ChevronRightIcon, InfoIcon
} from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { type CartItem } from '../../hooks/useOrder';

export interface OrderItem {
    nombre: string;
    cantidad: number;
    precioFinal: number;
    descripcion?: string;
    especificaciones?: any;
}

interface OrderSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems?: [string, CartItem][];
    items?: OrderItem[];
    orderTotal?: number;
    total?: number;
    client: Cliente | null;
    tempClient?: { nombre: string, telefono: string, cedula?: string, regimen?: Regimen };
    setTempClient?: (data: { nombre: string, telefono: string, cedula?: string, regimen?: Regimen }) => void;
    abono: number;
    setAbono: (val: number) => void;
    prioridad?: 'Normal' | 'Urgente';
    setPrioridad?: (val: 'Normal' | 'Urgente') => void;
    tiempoEntrega?: '24h' | '48h';
    setTiempoEntrega?: (val: '24h' | '48h') => void;
    onUpdateQuantity?: (id: string, qty: number) => void;
    onUpdateNotes?: (id: string, notes: string) => void;
    onUpdatePrice?: (id: string, price: number) => void;
    onRemoveItem?: (id: string) => void;
    onSaveItem?: (id: string) => void;
    onFinalize?: () => void;
    onDeploy?: () => void;
    isLoading: boolean;
    sriData: any;
    setSriData: (data: any) => void;
    imprimirClave: boolean;
    setImprimirClave: (val: boolean) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
    cartItems = [], items = [], orderTotal, total, client, tempClient, setTempClient, abono, setAbono, 
    prioridad = 'Normal', setPrioridad,
    tiempoEntrega = '48h', setTiempoEntrega,
    onUpdateQuantity, onUpdateNotes, onUpdatePrice, onRemoveItem, onSaveItem, onFinalize, onDeploy, isLoading,
    sriData, setSriData, imprimirClave, setImprimirClave
}) => {
    const [copied, setCopied] = useState(false);
    const [showClave, setShowClave] = useState(false);
    const finalTotal = total ?? orderTotal ?? 0;
    const saldo = Math.max(0, finalTotal - abono);

    const displayItems = items.length > 0 
        ? items.map((it, idx) => ({ id: idx.toString(), nombre: it.nombre, cantidad: it.cantidad, precio: it.precioFinal, specs: it.especificaciones }))
        : cartItems.map(([id, it]) => ({ id, nombre: it.producto.nombre, cantidad: it.cantidad, precio: it.producto.precio + (it.surcharge || 0), specs: undefined }));

    const handleFinalize = onDeploy || onFinalize || (() => {});

    const suggestAbono = (percent: number) => {
        const val = percent === 1 ? finalTotal : Math.ceil(finalTotal * percent);
        setAbono(val);
        if ('vibrate' in navigator) navigator.vibrate(15);
    };

    return (
        <div className="flex flex-col h-full bg-white relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-slate-50/50 pointer-events-none" />
            
            {/* --- HEADER TÁCTICO --- */}
            <header className="p-8 md:p-12 border-b border-slate-100 relative z-10 flex justify-between items-end">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand-blue shadow-blue-glow animate-pulse" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">MANIFIESTO_RESUMEN_v5.2</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                        BRIEFING DE <span className="text-brand-blue">MISIÓN</span>
                    </h2>
                </div>
                {setPrioridad && (
                    <button 
                        onClick={() => setPrioridad(prioridad === 'Normal' ? 'Urgente' : 'Normal')}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-2 ${
                            prioridad === 'Urgente' 
                            ? 'bg-rose-50 border-rose-500 text-rose-500 shadow-rose-500/20 animate-pulse' 
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                    >
                        <div className={`w-2 h-2 rounded-full ${prioridad === 'Urgente' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-slate-300'}`} />
                        {prioridad === 'Urgente' ? 'ESTADO_URGENTE' : 'ESTADO_NORMAL'}
                    </button>
                )}
            </header>

            {/* --- CUERPO DE DATOS --- */}
            <div className="flex-grow overflow-y-auto p-10 md:p-12 space-y-12 custom-scrollbar pb-64">
                {displayItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                        <div className="p-12 bg-slate-50 rounded-full mb-8 border border-slate-100">
                            <WalletIcon className="w-24 h-24 text-slate-300" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.5em] text-slate-400">CARGA_VACÍA_STANDBY</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* LISTA DE ITEMS */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 ml-2">Vectores de Producción</p>
                            {displayItems.map((item) => (
                                <motion.div 
                                    key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                    className="bg-slate-50 p-8 group hover:border-brand-blue/20 transition-all duration-500 rounded-3xl border border-slate-100 shadow-luxury"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-4 flex-grow pr-8">
                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{item.nombre}</h4>
                                            <div className="flex flex-wrap gap-4">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200">
                                                    <span className="text-[10px] font-black text-brand-blue">{item.cantidad}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">UNID</span>
                                                </div>
                                                {item.specs && (
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.specs.tamano || 'Estándar'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VALUACIÓN_NETA</p>
                                            <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{formatCurrency(item.precio)}</p>
                                        </div>
                                    </div>
                                    
                                    {onRemoveItem && (
                                        <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => onRemoveItem(item.id)} className="flex items-center gap-2 text-[10px] font-black text-rose-500/60 hover:text-rose-500 uppercase tracking-widest transition-colors">
                                                <TrashIcon className="w-4 h-4" /> Eliminar_Vector
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* SECCIÓN CLIENTE */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 ml-2">Protocolo de Identidad</p>
                            <div className="bg-slate-50 p-10 bg-gradient-to-br from-brand-blue/[0.03] to-transparent rounded-3xl border border-slate-100 shadow-luxury relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 transition-transform duration-1000 group-hover:scale-125">
                                    <UserPlusIcon className="w-24 h-24 text-brand-blue" />
                                </div>
                                
                                {client ? (
                                    <div className="flex items-center gap-8 relative z-10">
                                        <div className="w-20 h-20 rounded-[2rem] bg-brand-blue/10 flex items-center justify-center border-2 border-brand-blue/20 shadow-blue-glow-sm">
                                            <CheckBadgeIcon className="w-10 h-10 text-brand-blue" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{client.nombre}</h4>
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                                                <span>ID: {client.cedula}</span>
                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                <span>TEL: {client.telefono}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8 relative z-10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre_Titular</label>
                                                <input 
                                                    type="text" value={tempClient?.nombre || ''}
                                                    onChange={e => setTempClient?.({ ...tempClient!, nombre: e.target.value.toUpperCase() })}
                                                    placeholder="RAZÓN SOCIAL..."
                                                    className="w-full py-5 bg-white border border-slate-200 px-6 rounded-2xl text-slate-900 font-black uppercase tracking-widest outline-none focus:border-brand-blue/30 transition-all placeholder:text-slate-200"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Protocolo_WhatsApp</label>
                                                <input 
                                                    type="tel" value={tempClient?.telefono || ''}
                                                    onChange={e => setTempClient?.({ ...tempClient!, telefono: e.target.value })}
                                                    placeholder="09..."
                                                    className="w-full py-5 bg-white border border-slate-200 px-6 rounded-2xl text-slate-900 font-black tracking-widest outline-none focus:border-brand-blue/30 transition-all placeholder:text-slate-200 font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
                                            <InfoIcon className="w-4 h-4 text-brand-blue/40" />
                                            <p className="text-[9px] font-bold text-brand-blue/60 uppercase tracking-widest">Aviso: El cliente será registrado automáticamente al finalizar la misión.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CRONOGRAMA */}
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 ml-2">Cronograma de Entrega</p>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { id: '24h', label: 'PRIORIDAD_24H', sub: 'Protocolo de Emergencia', icon: SparklesIcon },
                                    { id: '48h', label: 'ESTÁNDAR_48H', sub: 'Protocolo de Producción', icon: ClockIcon }
                                ].map(opt => (
                                    <button 
                                        key={opt.id} onClick={() => setTiempoEntrega?.(opt.id as any)}
                                        className={`p-8 rounded-[2.5rem] border-2 transition-all duration-700 text-left relative overflow-hidden group ${
                                            tiempoEntrega === opt.id 
                                            ? 'bg-brand-blue/10 border-brand-blue/40 shadow-blue-glow' 
                                            : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className={`absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity ${tiempoEntrega === opt.id ? 'text-brand-blue opacity-20' : ''}`}>
                                            <opt.icon className="w-12 h-12" />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 block ${tiempoEntrega === opt.id ? 'text-brand-blue' : 'text-slate-400'}`}>{opt.label}</span>
                                        <span className={`text-xl font-black tracking-tighter ${tiempoEntrega === opt.id ? 'text-slate-900' : 'text-slate-300'}`}>{opt.sub}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* PROTOCOLO SRI */}
                        {client && (
                             <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 ml-2">Protocolo Fiscal SRI</p>
                                <div className="bg-slate-50 p-10 rounded-3xl border border-slate-100 shadow-luxury space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <ShieldCheckIcon className="w-6 h-6 text-brand-blue" />
                                            <span className="text-[11px] font-black text-brand-blue uppercase tracking-[0.4em]">Validación_de_Acceso</span>
                                        </div>
                                        <button 
                                            onClick={() => setImprimirClave(!imprimirClave)}
                                            className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                imprimirClave ? 'bg-brand-blue text-white shadow-blue-glow-sm' : 'bg-white text-slate-400 border-slate-200'
                                            }`}
                                        >
                                            {imprimirClave ? 'IMPRIMIR_CLAVE_ACTIVO' : 'IMPRIMIR_CLAVE_OFF'}
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <input 
                                            type={showClave ? 'text' : 'password'}
                                            value={sriData?.claveAcceso || ''}
                                            onChange={e => setSriData({ ...sriData, claveAcceso: e.target.value })}
                                            placeholder="INTRODUCIR CLAVE DE ACCESO FISCAL..."
                                            className="w-full py-6 pl-8 pr-20 bg-white border border-slate-200 rounded-2xl text-slate-900 font-black tracking-widest outline-none focus:border-brand-blue/30 transition-all font-mono"
                                        />
                                        <button 
                                            onClick={() => setShowClave(!showClave)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-blue transition-colors"
                                        >
                                            <KeyIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- PANEL DE DESPLIEGUE (FOOTER) --- */}
            <div className="absolute bottom-0 left-0 w-full p-10 md:p-14 bg-white/95 backdrop-blur-3xl border-t border-slate-100 z-50 shadow-luxury">
                <div className="max-w-7xl mx-auto space-y-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                        {/* Telemetría Financiera */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue shadow-blue-glow animate-pulse" />
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">INVERSIÓN_FINAL_CONSOLIDADA</span>
                            </div>
                            <div className="flex items-baseline gap-4">
                                <span className="text-7xl md:text-9xl font-black text-slate-900 tracking-tighter leading-none tabular-nums">
                                    <span className="text-4xl md:text-5xl text-brand-blue/40 mr-4">$</span>
                                    {finalTotal.toFixed(2)}
                                </span>
                                <div className="space-y-1 pb-4">
                                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">SALDO: {formatCurrency(saldo)}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">IVA_15%_INCLUIDO</p>
                                </div>
                            </div>
                        </div>

                        {/* Control de Abono */}
                        <div className="w-full md:w-[450px] space-y-6">
                            <div className="relative group">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-brand-blue font-black">$</span>
                                <input 
                                    type="number" value={abono || ''}
                                    onChange={e => setAbono(parseFloat(e.target.value) || 0)}
                                    placeholder="REGISTRAR ABONO..."
                                    className="w-full py-8 pl-14 pr-8 text-3xl tracking-tighter tabular-nums bg-slate-50 border border-brand-blue/20 rounded-3xl text-slate-900 font-black outline-none focus:border-brand-blue/50 transition-all placeholder:text-slate-200"
                                />
                                <div className="absolute right-4 top-[-10px] flex gap-2">
                                    <button onClick={() => suggestAbono(0.5)} className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-400 hover:text-brand-blue transition-all uppercase tracking-widest">Reserva_50%</button>
                                    <button onClick={() => suggestAbono(1)} className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-400 hover:text-emerald-500 transition-all uppercase tracking-widest">Total_100%</button>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleFinalize}
                                disabled={isLoading || displayItems.length === 0}
                                className={`w-full py-10 rounded-[3rem] font-black uppercase tracking-[0.5em] text-sm flex items-center justify-center gap-8 group transition-all duration-700 border-2 ${
                                    saldo === 0 && finalTotal > 0
                                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_10px_40px_rgba(16,185,129,0.3)]'
                                    : 'bg-brand-blue border-brand-blue text-white shadow-blue-glow'
                                }`}
                            >
                                {isLoading ? (
                                    <Loader2Icon className="w-8 h-8 animate-spin" />
                                ) : (
                                    <>
                                        {saldo === 0 ? 'DESPLEGAR_SISTEMA_COMPLETO' : 'INICIAR_ORDEN_DE_MISIÓN'}
                                        <ArrowRightIcon className="w-8 h-8 group-hover:translate-x-4 transition-transform duration-500" />
                                    </>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;
