
import React, { useState } from 'react';
import { Cliente, Regimen } from '../../types';
import { formatCurrency } from '../../utils';
import { 
    TrashIcon, CheckCircleIcon, Loader2Icon, WalletIcon, 
    ShieldCheckIcon, KeyIcon, ArrowRightIcon, 
    ClockIcon, SparklesIcon, UserPlusIcon, CheckBadgeIcon
} from '../Icons';
import { type CartItem } from '../../hooks/useOrder';

interface OrderSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: [string, CartItem][];
    orderTotal: number;
    client: Cliente | null;
    tempClient?: { nombre: string, telefono: string, cedula?: string, regimen?: Regimen };
    setTempClient?: (data: { nombre: string, telefono: string, cedula?: string, regimen?: Regimen }) => void;
    abono: number;
    setAbono: (val: number) => void;
    prioridad?: 'Normal' | 'Urgente';
    setPrioridad?: (val: 'Normal' | 'Urgente') => void;
    tiempoEntrega?: '24h' | '48h';
    setTiempoEntrega?: (val: '24h' | '48h') => void;
    onUpdateQuantity: (id: string, qty: number) => void;
    onUpdateNotes?: (id: string, notes: string) => void;
    onUpdatePrice?: (id: string, price: number) => void;
    onRemoveItem: (id: string) => void;
    onSaveItem?: (id: string) => void;
    onFinalize: () => void;
    isLoading: boolean;
    sriData: any;
    setSriData: (data: any) => void;
    imprimirClave: boolean;
    setImprimirClave: (val: boolean) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
    cartItems, orderTotal, client, tempClient, setTempClient, abono, setAbono, 
    prioridad = 'Normal', setPrioridad,
    tiempoEntrega = '48h', setTiempoEntrega,
    onUpdateQuantity, onUpdateNotes, onUpdatePrice, onRemoveItem, onSaveItem, onFinalize, isLoading,
    sriData, setSriData
}) => {
    const [copied, setCopied] = useState(false);
    const saldo = Math.max(0, orderTotal - abono);

    const suggestAbono = (percent: number) => {
        setAbono(Math.ceil(orderTotal * percent));
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
                {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                        <div className="p-8 bg-white/5 rounded-full mb-6 border border-white/5">
                            <WalletIcon className="w-16 h-16 text-slate-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Bolsa de pedido vacía</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Resumen de Producción</span>
                             <div className="flex gap-2">
                                {setPrioridad && (
                                    <button 
                                        onClick={() => setPrioridad(prioridad === 'Normal' ? 'Urgente' : 'Normal')}
                                        className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase transition-all flex items-center gap-2 border ${prioridad === 'Urgente' ? 'bg-brand-red/20 border-brand-red text-brand-red animate-pulse' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${prioridad === 'Urgente' ? 'bg-brand-red' : 'bg-slate-600'}`}></div>
                                        {prioridad === 'Urgente' ? 'Prioridad Alta' : 'Urgencia'}
                                    </button>
                                )}
                             </div>
                        </div>

                        <div className="space-y-3">
                            {cartItems.map(([id, item]) => (
                                <div key={id} className="group relative flex flex-col p-5 glass-card-luxury">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="min-w-0 flex-grow pr-4">
                                            <p className="text-[12px] font-black uppercase tracking-tight text-white mb-1">{item.producto.nombre}</p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.cantidad} UNID.</span>
                                                <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                                                <span className="text-[9px] font-bold text-liquid-gold/80 uppercase tracking-widest">{formatCurrency(item.producto.precio + (item.surcharge || 0))}</span>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            {onUpdatePrice ? (
                                                <div className="relative group">
                                                    <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-liquid-gold/50 font-black">$</span>
                                                    <input 
                                                        type="number" 
                                                        value={item.customPrice !== undefined ? item.customPrice : (item.producto.precio + (item.surcharge || 0))}
                                                        onChange={(e) => onUpdatePrice(id, parseFloat(e.target.value) || 0)}
                                                        className="w-20 bg-white/5 border border-white/5 rounded-lg px-3 py-1 text-right font-black text-sm text-white focus:border-liquid-gold/50 outline-none transition-all tabular-nums"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="font-black text-sm text-white tabular-nums">{formatCurrency((item.producto.precio + (item.surcharge || 0)) * item.cantidad)}</span>
                                            )}
                                            <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Subtotal: {formatCurrency((item.customPrice !== undefined ? item.customPrice : (item.producto.precio + (item.surcharge || 0))) * item.cantidad)}</span>
                                        </div>
                                    </div>

                                    {onUpdateNotes && (
                                        <div className="mb-3">
                                                <textarea 
                                                placeholder="Notas de personalización (ej. Tinta, papel, detalles...)"
                                                value={item.notas || ''}
                                                onChange={(e) => onUpdateNotes(id, e.target.value)}
                                                className="w-full sticky-note resize-none h-20 placeholder-[#a69c8b]/70 outline-none"
                                                translate="no"
                                            />
                                        </div>
                                    )}
                                    
                                    <div className="flex justify-between items-center pt-3 border-t border-white/5 mt-1">
                                        <div className="flex gap-1">
                                            {onSaveItem && (
                                                <button 
                                                    onClick={() => onSaveItem(id)}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-liquid-gold/10 text-liquid-gold rounded-lg text-[8px] font-black uppercase tracking-tighter hover:bg-liquid-gold/20 transition-colors"
                                                    title="Guardar como producto predeterminado"
                                                >
                                                    <SparklesIcon className="w-3 h-3"/> Memorizar
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center bg-white/5 rounded-lg border border-white/5 p-0.5">
                                                <button onClick={() => onUpdateQuantity(id, Math.max(1, item.cantidad - 1))} className="px-2 py-0.5 text-slate-500 hover:text-white">-</button>
                                                <span className="px-2 text-[10px] font-black text-white">{item.cantidad}</span>
                                                <button onClick={() => onUpdateQuantity(id, item.cantidad + 1)} className="px-2 py-0.5 text-slate-500 hover:text-white">+</button>
                                            </div>
                                            <button onClick={() => onRemoveItem(id)} className="p-2 text-slate-600 hover:text-brand-red transition-all bg-white/5 rounded-lg border border-white/5">
                                                <TrashIcon className="w-3 h-3"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!client && (
                            <div className="bg-gradient-to-br from-brand-blue/20 to-transparent p-6 rounded-[2.5rem] border border-brand-blue/30 space-y-5 shadow-2xl animate-slide-in-up">
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black text-brand-blue uppercase tracking-[0.3em] flex items-center gap-3">
                                        <UserPlusIcon className="w-4 h-4"/> Identidad Express
                                    </p>
                                    <div className="h-2 w-2 rounded-full bg-brand-blue animate-pulse"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            placeholder="NOMBRE DEL CLIENTE..."
                                            value={tempClient?.nombre || ''}
                                            onChange={(e) => setTempClient?.({ 
                                                nombre: '', telefono: '', cedula: '', regimen: Regimen.GENERAL, // Default baseline
                                                ...tempClient, 
                                                nombre: e.target.value.toUpperCase() 
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder-slate-600 font-black tracking-wider focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <input 
                                            type="tel" 
                                            placeholder="WHATSAPP / CELULAR..."
                                            value={tempClient?.telefono || ''}
                                            onChange={(e) => setTempClient?.({ 
                                                nombre: '', telefono: '', cedula: '', regimen: Regimen.GENERAL, // Default baseline
                                                ...tempClient, 
                                                telefono: e.target.value 
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder-slate-600 font-black tracking-wider focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-mono"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            placeholder="CÉDULA O RUC..."
                                            value={tempClient?.cedula || ''}
                                            onChange={(e) => setTempClient?.({ 
                                                nombre: '', telefono: '', cedula: '', regimen: Regimen.GENERAL, // Default baseline
                                                ...tempClient, 
                                                cedula: e.target.value 
                                            })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white placeholder-slate-600 font-black tracking-wider focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/5 transition-all outline-none font-mono"
                                        />
                                    </div>
                                </div>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center">Aviso automático vía whatsapp al finalizar</p>
                            </div>
                        )}

                        <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5 space-y-4 shadow-sm">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <ClockIcon className="w-4 h-4"/> Cronograma de Entrega
                             </p>
                             <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setTiempoEntrega?.('24h')}
                                    className={`relative group overflow-hidden py-4 rounded-2xl text-[9px] font-black uppercase transition-all border ${tiempoEntrega === '24h' ? 'bg-liquid-gold border-liquid-gold text-brand-dark shadow-gold-glow' : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'}`}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {tiempoEntrega === '24h' && <CheckBadgeIcon className="w-4 h-4" />}
                                        Prioritario / 24h
                                    </span>
                                </button>
                                <button 
                                    onClick={() => setTiempoEntrega?.('48h')}
                                    className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all border ${tiempoEntrega === '48h' ? 'bg-liquid-gold border-liquid-gold text-brand-dark shadow-gold-glow' : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'}`}
                                >
                                    Estandar / 48h
                                </button>
                             </div>
                        </div>

                        {client && (
                             <div className="bg-slate-950/80 backdrop-blur-xl p-6 rounded-[2.5rem] space-y-4 border border-white/5 shadow-2xl relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 p-4 opacity-[0.02] transition-transform duration-1000 group-hover:scale-110"><ShieldCheckIcon className="w-40 h-40" /></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <KeyIcon className="w-4 h-4"/> Seguridad Fiscal
                                    </span>
                                    <span className={`text-[8px] font-black px-3 py-1 rounded-full ${sriData.estadoClave === 'LISTA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'} uppercase tracking-tighter`}>{sriData.estadoClave}</span>
                                </div>
                                <div className="flex gap-3 relative z-10">
                                    <input 
                                        type="text" 
                                        value={sriData.claveAcceso} 
                                        onChange={e => setSriData({...sriData, claveAcceso: e.target.value})} 
                                        placeholder="CLAVE DE ACCESO..." 
                                        className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-slate-700 focus:border-blue-500/50 outline-none transition-all" 
                                    />
                                    <button 
                                        onClick={() => { navigator.clipboard.writeText(sriData.claveAcceso); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} 
                                        className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-brand-blue text-white active:scale-95'}`}
                                    >
                                        {copied ? <CheckCircleIcon className="w-5 h-5"/> : <ShieldCheckIcon className="w-5 h-5"/>}
                                    </button>
                                </div>
                             </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-8 bg-brand-dark/90 backdrop-blur-3xl border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-1">Total Inversión</span>
                            <span className="text-5xl font-black tracking-tighter text-white tabular-nums drop-shadow-luxury">{formatCurrency(orderTotal)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-brand-blue uppercase tracking-[0.3em]">Abono en Efectivo/Transferencia</label>
                            {abono > 0 && <span className="text-[10px] font-black text-emerald-400">✓</span>}
                         </div>
                         <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-blue font-black text-xl">$</span>
                            <input 
                                type="number" 
                                value={abono || ''} 
                                onChange={e => setAbono(parseFloat(e.target.value) || 0)} 
                                className="w-full pl-10 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-black text-3xl text-brand-blue outline-none focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 transition-all tabular-nums" 
                                placeholder="0.00" 
                            />
                         </div>
                         <div className="grid grid-cols-3 gap-3">
                             <button onClick={() => suggestAbono(0.5)} className="py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-black text-[9px] uppercase hover:bg-white/10 hover:text-white transition-all">Sugerir 50%</button>
                             <button onClick={() => suggestAbono(1)} className="py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-[9px] uppercase hover:bg-emerald-500 hover:text-white transition-all">Sugerir 100%</button>
                             <button onClick={() => setAbono(0)} className="py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-600 font-black text-[9px] uppercase hover:text-brand-red transition-all">Limpiar</button>
                         </div>
                    </div>

                    <div className={`flex justify-between items-center p-6 rounded-[2.5rem] border transition-all duration-700 ${saldo === 0 && orderTotal > 0 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-brand-red/10 border-brand-red/30 text-brand-red opacity-100'}`}>
                        <div>
                            <span className="text-[9px] font-black uppercase opacity-60 block tracking-[0.3em] mb-1">Saldo a Liquidar</span>
                            <span className="text-3xl font-black tracking-tighter tabular-nums">{formatCurrency(saldo)}</span>
                        </div>
                        {saldo === 0 && orderTotal > 0 ? (
                            <div className="bg-emerald-500 text-white p-2 rounded-full shadow-emerald-glow animate-bounce">
                                <CheckCircleIcon className="w-8 h-8" />
                            </div>
                        ) : (
                            <div className="bg-brand-red/20 p-2 rounded-full">
                                <ArrowRightIcon className="w-8 h-8 opacity-40" />
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={onFinalize} 
                        disabled={isLoading || cartItems.length === 0} 
                        className="btn-luxury w-full py-6 disabled:opacity-20 disabled:cursor-not-allowed group"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-4 text-brand-dark">
                            {isLoading ? <Loader2Icon className="animate-spin w-6 h-6"/> : <>Confirmar Producción <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform"/></>}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;
