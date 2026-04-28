
import React, { useState } from 'react';
import { Cliente, Regimen } from '../../types';
import { formatCurrency } from '../../utils';
import { 
    TrashIcon, CheckCircleIcon, Loader2Icon, WalletIcon, 
    ShieldCheckIcon, KeyIcon, ArrowRightIcon, 
    ClockIcon, SparklesIcon, UserPlusIcon, CheckBadgeIcon
} from '../Icons';
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
    items?: OrderItem[]; // For compatibility with NuevoPedido
    orderTotal?: number;
    total?: number; // Alias for orderTotal
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
    onDeploy?: () => void; // Alias for onFinalize
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
    const finalTotal = total ?? orderTotal ?? 0;
    const saldo = Math.max(0, finalTotal - abono);

    // Normalize display items
    const displayItems = items.length > 0 
        ? items.map((it, idx) => ({ id: idx.toString(), nombre: it.nombre, cantidad: it.cantidad, precio: it.precioFinal }))
        : cartItems.map(([id, it]) => ({ id, nombre: it.producto.nombre, cantidad: it.cantidad, precio: it.producto.precio + (it.surcharge || 0) }));

    const handleFinalize = onDeploy || onFinalize || (() => {});

    const suggestAbono = (percent: number) => {
        const val = percent === 1 ? finalTotal : Math.ceil(finalTotal * percent);
        setAbono(val);
        if ('vibrate' in navigator) navigator.vibrate(10);
    };

    return (
        <div className="flex flex-col h-full bg-black md:bg-transparent overflow-hidden font-sans">
            {/* Main Content Area */}
            <div className="flex-grow overflow-y-auto p-6 md:p-6 space-y-10 md:space-y-8 custom-scrollbar scroll-smooth pb-48 md:pb-6">
                {displayItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 py-32 md:py-20">
                        <div className="p-12 md:p-8 bg-white/5 rounded-full mb-10 md:mb-6 border border-white/5">
                            <WalletIcon className="w-24 h-24 md:w-16 md:h-16 text-slate-400" />
                        </div>
                        <p className="text-[12px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Bolsa de pedido vacía</p>
                    </div>
                ) : (
                    <div className="space-y-10 md:space-y-6">
                        {/* Section Header */}
                        <div className="flex justify-between items-center sticky top-0 z-20 bg-black/80 backdrop-blur-md py-4 md:relative md:bg-transparent md:py-0">
                             <span className="text-[10px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Resumen de Producción</span>
                             <div className="flex gap-3 md:gap-2">
                                {setPrioridad && (
                                    <button 
                                        onClick={() => setPrioridad(prioridad === 'Normal' ? 'Urgente' : 'Normal')}
                                        className={`px-6 py-2.5 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-[8px] font-black uppercase transition-all flex items-center gap-2 border ${prioridad === 'Urgente' ? 'bg-liquid-gold/20 border-liquid-gold text-liquid-gold animate-pulse shadow-gold-glow-sm' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                    >
                                        <div className={`w-2.5 h-2.5 md:w-1.5 md:h-1.5 rounded-full ${prioridad === 'Urgente' ? 'bg-liquid-gold shadow-gold-glow' : 'bg-slate-600'}`}></div>
                                        {prioridad === 'Urgente' ? 'Prioridad Alta' : 'Urgencia'}
                                    </button>
                                )}
                             </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-6 md:space-y-3">
                            {displayItems.map((item) => (
                                <div key={item.id} className="group relative flex flex-col p-6 md:p-5 glass-card-luxury">
                                    <div className="flex justify-between items-start mb-6 md:mb-3">
                                        <div className="min-w-0 flex-grow pr-4">
                                            <p className="text-[15px] md:text-[12px] font-black uppercase tracking-tight text-white mb-3 md:mb-1">{item.nombre}</p>
                                            <div className="flex items-center gap-4 md:gap-3">
                                                <span className="text-[11px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.cantidad} UNID.</span>
                                                <div className="w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-slate-700"></div>
                                                <span className="text-[11px] md:text-[9px] font-bold text-liquid-gold/80 uppercase tracking-widest">{formatCurrency(item.precio)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            {onUpdatePrice ? (
                                                <div className="relative group">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] md:text-[10px] text-liquid-gold/50 font-black">$</span>
                                                    <input 
                                                        type="number" 
                                                        value={item.precio}
                                                        onChange={(e) => onUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                                                        className="w-24 md:w-20 bg-white/5 border border-white/10 rounded-xl py-2 pl-6 pr-2 text-right text-[14px] md:text-xs font-black text-white focus:border-liquid-gold/50 outline-none transition-all"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-[16px] md:text-[13px] font-black text-white italic tracking-tighter">{formatCurrency(item.precio)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {onRemoveItem && (
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            <button 
                                                onClick={() => onRemoveItem(item.id)}
                                                className="p-3 md:p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                <TrashIcon className="w-5 h-5 md:w-3.5 md:h-3.5"/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Identity Section (Express) */}
                        {!client && (
                            <div className="bg-gradient-to-br from-brand-blue/10 to-transparent p-8 md:p-6 rounded-[3rem] md:rounded-[2.5rem] border border-brand-blue/20 space-y-6 md:space-y-5 shadow-2xl">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] md:text-[9px] font-black text-brand-blue uppercase tracking-[0.3em] flex items-center gap-4">
                                        <UserPlusIcon className="w-6 h-6 md:w-4 md:h-4"/> Identidad Express
                                    </p>
                                    <div className="h-3 w-3 md:h-2 md:w-2 rounded-full bg-brand-blue animate-pulse"></div>
                                </div>
                                <div className="space-y-5 md:space-y-3">
                                    <input 
                                        type="text" 
                                        placeholder="NOMBRE DEL CLIENTE..."
                                        value={tempClient?.nombre || ''}
                                        onChange={(e) => setTempClient?.({ 
                                            telefono: '', cedula: '', regimen: Regimen.GENERAL, 
                                            ...tempClient, 
                                            nombre: e.target.value.toUpperCase() 
                                        })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-7 py-6 md:px-5 md:py-4 text-[14px] md:text-xs text-white placeholder-slate-700 font-black tracking-wider focus:border-brand-blue/50 outline-none transition-all shadow-inner"
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-3">
                                        <input 
                                            type="tel" 
                                            placeholder="WHATSAPP..."
                                            value={tempClient?.telefono || ''}
                                            onChange={(e) => setTempClient?.({ 
                                                nombre: '', cedula: '', regimen: Regimen.GENERAL,
                                                ...tempClient, 
                                                telefono: e.target.value 
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-7 py-6 md:px-5 md:py-4 text-[14px] md:text-xs text-white placeholder-slate-700 font-black tracking-wider focus:border-brand-blue/50 outline-none transition-all font-mono shadow-inner"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="CÉDULA / RUC..."
                                            value={tempClient?.cedula || ''}
                                            onChange={(e) => setTempClient?.({ 
                                                nombre: '', telefono: '', regimen: Regimen.GENERAL,
                                                ...tempClient, 
                                                cedula: e.target.value 
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-7 py-6 md:px-5 md:py-4 text-[14px] md:text-xs text-white placeholder-slate-700 font-black tracking-wider focus:border-brand-blue/50 outline-none transition-all font-mono shadow-inner"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] md:text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center">Protocolo de aviso automático vía whatsapp</p>
                            </div>
                        )}

                        {/* Delivery Timeline */}
                        <div className="bg-white/5 p-8 md:p-6 rounded-[3rem] md:rounded-[2.5rem] border border-white/5 space-y-6 md:space-y-4 shadow-sm">
                             <p className="text-[11px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-4">
                                <ClockIcon className="w-6 h-6 md:w-4 md:h-4"/> Cronograma de Entrega
                             </p>
                             <div className="grid grid-cols-2 gap-5 md:gap-3">
                                <button 
                                    onClick={() => setTiempoEntrega?.('24h')}
                                    className={`relative group overflow-hidden py-6 md:py-4 rounded-2xl text-[11px] md:text-[9px] font-black uppercase transition-all border ${tiempoEntrega === '24h' ? 'bg-liquid-gold border-liquid-gold text-brand-dark shadow-gold-glow' : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'}`}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {tiempoEntrega === '24h' && <CheckBadgeIcon className="w-5 h-5 md:w-4 md:h-4" />}
                                        Urgente / 24h
                                    </span>
                                </button>
                                <button 
                                    onClick={() => setTiempoEntrega?.('48h')}
                                    className={`py-6 md:py-4 rounded-2xl text-[11px] md:text-[9px] font-black uppercase transition-all border ${tiempoEntrega === '48h' ? 'bg-liquid-gold border-liquid-gold text-brand-dark shadow-gold-glow' : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'}`}
                                >
                                    Estandar / 48h
                                </button>
                             </div>
                        </div>

                        {/* Security Fiscal (SRI) */}
                        {client && (
                             <div className="bg-slate-950/90 backdrop-blur-3xl p-8 md:p-6 rounded-[3rem] md:rounded-[2.5rem] space-y-6 md:space-y-4 border border-white/10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 p-4 opacity-[0.03] transition-transform duration-1000 group-hover:scale-110"><ShieldCheckIcon className="w-48 h-48" /></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <span className="text-[11px] md:text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-4">
                                        <KeyIcon className="w-6 h-6 md:w-4 md:h-4"/> Seguridad Fiscal
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                            <input 
                                                type="checkbox" 
                                                id="imprimirClave"
                                                checked={imprimirClave}
                                                onChange={(e) => setImprimirClave(e.target.checked)}
                                                className="w-4 h-4 accent-liquid-gold"
                                            />
                                            <label htmlFor="imprimirClave" className="text-[8px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">Imprimir</label>
                                        </div>
                                        <span className={`text-[10px] md:text-[8px] font-black px-5 py-2 md:px-3 md:py-1 rounded-full ${sriData?.estadoClave === 'LISTA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-glow-sm' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'} uppercase tracking-widest`}>{sriData?.estadoClave || 'PENDIENTE'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-5 md:gap-3 relative z-10">
                                    <input 
                                        type="text" 
                                        value={sriData?.claveAcceso || ''} 
                                        onChange={e => setSriData({...sriData, claveAcceso: e.target.value})} 
                                        placeholder="CLAVE DE ACCESO..." 
                                        className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-5 md:px-4 md:py-3 text-base md:text-xs font-mono text-white placeholder-slate-800 focus:border-blue-500/50 outline-none transition-all shadow-inner" 
                                    />
                                    <button 
                                        onClick={() => { navigator.clipboard.writeText(sriData?.claveAcceso || ''); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} 
                                        className={`p-5 md:p-3 rounded-2xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-brand-blue text-white active:scale-95 shadow-lg shadow-blue-500/20'}`}
                                    >
                                        {copied ? <CheckCircleIcon className="w-7 h-7 md:w-5 md:h-5"/> : <ShieldCheckIcon className="w-7 h-7 md:w-5 md:h-5"/>}
                                    </button>
                                </div>
                             </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sticky Financial Footer */}
            <div className="fixed bottom-0 left-0 w-full p-4 md:p-8 bg-black/95 backdrop-blur-3xl border-t border-white/10 shadow-[0_-25px_60px_rgba(0,0,0,0.9)] z-50 pb-safe">
                <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-[10px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block">Inversión Total</span>
                            <span className="text-4xl md:text-5xl font-black tracking-tighter text-white tabular-nums drop-shadow-luxury">{formatCurrency(finalTotal)}</span>
                        </div>
                        <div className="text-right">
                             <span className="text-[9px] font-black text-liquid-gold uppercase tracking-[0.3em] block mb-1">Saldo Remanente</span>
                             <span className={`text-xl md:text-2xl font-black tabular-nums transition-colors ${saldo === 0 ? 'text-emerald-500' : 'text-white/40'}`}>{formatCurrency(saldo)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-6">
                        <div className="space-y-4 md:space-y-4">
                            <div className="flex gap-3">
                                 <div className="relative flex-grow">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm text-liquid-gold font-black">$</span>
                                    <input 
                                        type="number" 
                                        placeholder="ABONO..."
                                        value={abono || ''}
                                        onChange={(e) => setAbono(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-10 py-5 text-lg font-black text-white focus:border-liquid-gold/50 outline-none transition-all tabular-nums shadow-inner"
                                    />
                                 </div>
                                 <button onClick={() => setAbono(0)} className="px-6 rounded-2xl bg-white/5 border border-white/10 text-slate-600 font-black text-[9px] uppercase hover:text-liquid-gold transition-all active:scale-95">Reset</button>
                             </div>

                             <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {[0.5, 1].map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => suggestAbono(p)}
                                        className={`flex-1 whitespace-nowrap px-6 py-4 rounded-xl border font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-90 ${
                                            abono === (p === 1 ? finalTotal : Math.ceil(finalTotal * p))
                                                ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow'
                                                : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        {p === 1 ? 'TOTAL' : '50%'}
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={() => {
                                    if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
                                    handleFinalize();
                                }} 
                                disabled={isLoading || displayItems.length === 0} 
                                className={`relative w-full py-6 disabled:opacity-20 disabled:cursor-not-allowed group rounded-2xl overflow-hidden transition-all duration-700 ${
                                    saldo === 0 && finalTotal > 0
                                        ? 'bg-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:bg-emerald-500'
                                        : 'bg-liquid-gold shadow-gold-glow-strong hover:bg-white'
                                }`}
                            >
                                <span className={`relative z-10 flex items-center justify-center gap-4 text-brand-dark text-xs font-black uppercase tracking-[0.3em] ${saldo === 0 ? 'text-white' : 'text-black'}`}>
                                    {isLoading ? <Loader2Icon className="animate-spin w-6 h-6"/> : (
                                        <>
                                            {saldo === 0 ? 'Liquidar y Desplegar' : 'Autorizar Despliegue'} 
                                            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-3 transition-transform"/>
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;
