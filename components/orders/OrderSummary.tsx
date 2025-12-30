
import React, { useState } from 'react';
import { Cliente } from '../../types';
import { formatCurrency } from '../../utils';
import { 
    TrashIcon, CheckCircleIcon, Loader2Icon, WalletIcon, 
    ExclamationTriangleIcon, SparklesIcon, ArrowRightIcon, 
    KeyIcon, Copy, ShieldCheckIcon, DollarIcon 
} from '../Icons';
import { CartItem } from '../../hooks/useOrder';

interface OrderSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: [string, CartItem][];
    orderTotal: number;
    client: Cliente | null;
    abono: number;
    setAbono: (val: number) => void;
    onUpdateQuantity: (id: string, qty: number) => void;
    onRemoveItem: (id: string) => void;
    onFinalize: () => void;
    isLoading: boolean;
    sriData: any;
    setSriData: (data: any) => void;
    imprimirClave: boolean;
    setImprimirClave: (val: boolean) => void;
}

const quickAmounts = [1, 5, 10, 20];

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
    cartItems, orderTotal, client, 
    abono, setAbono, onUpdateQuantity, onRemoveItem, onFinalize, isLoading,
    sriData, setSriData, imprimirClave, setImprimirClave
}) => {
    const [copied, setCopied] = useState(false);
    const saldo = Math.max(0, orderTotal - abono);
    
    // REDONDEO SOLICITADO: Si es $9, la mitad es $4.50, redondeamos a $5.00
    const minAbonoSugerido = Math.ceil(orderTotal * 0.5);
    
    const isFullyPaid = abono >= orderTotal && orderTotal > 0;

    const handleCopy = () => {
        if (!sriData.claveAcceso) return;
        navigator.clipboard.writeText(sriData.claveAcceso);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            {/* LISTA DE PRODUCTOS */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4 opacity-60">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <WalletIcon className="w-8 h-8" />
                        </div>
                        <p className="font-black uppercase text-[10px] tracking-widest">Carrito Vacío</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ítems Seleccionados</span>
                                <div className="h-px bg-slate-100 dark:bg-slate-700 flex-grow"></div>
                            </div>
                            {cartItems.map(([uniqueId, item]) => {
                                const { producto, cantidad, surcharge, surchargeLabel } = item;
                                const itemTotal = (producto.precio + (surcharge || 0)) * cantidad;

                                return (
                                    <div key={uniqueId} className="group flex items-center gap-4 p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-transparent hover:border-brand-blue/20 transition-all">
                                        <div className="flex flex-col items-center bg-white dark:bg-slate-800 rounded-xl p-0.5 shadow-sm border border-slate-100 dark:border-slate-700">
                                            <button onClick={() => onUpdateQuantity(uniqueId, cantidad + 1)} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-brand-blue text-xs">▲</button>
                                            <span className="font-black text-[11px] text-brand-blue leading-none">{cantidad}</span>
                                            <button onClick={() => onUpdateQuantity(uniqueId, Math.max(1, cantidad - 1))} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-brand-red text-xs">▼</button>
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="font-bold text-[10px] text-slate-800 dark:text-white uppercase leading-tight truncate">{producto.nombre}</p>
                                            {surchargeLabel && <p className="text-[8px] font-black text-amber-600 uppercase tracking-tighter mt-0.5">{surchargeLabel}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(itemTotal)}</p>
                                        </div>
                                        <button onClick={() => onRemoveItem(uniqueId)} className="text-slate-200 hover:text-brand-red transition-colors p-1"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* SECCIÓN SRI DINÁMICA */}
                        {client && (
                            <div className="bg-slate-950 text-white rounded-[2rem] p-6 space-y-4 shadow-2xl relative overflow-hidden group border border-white/5">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <ShieldCheckIcon className="w-24 h-24" />
                                </div>
                                
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${sriData.hasKey ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                            <KeyIcon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Clave SRI</span>
                                    </div>
                                    <select 
                                        value={sriData.estadoClave} 
                                        onChange={e => setSriData({...sriData, estadoClave: e.target.value})}
                                        className={`text-[8px] font-black px-2 py-1 rounded-full border-none outline-none cursor-pointer ${sriData.estadoClave === 'LISTA' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    >
                                        <option value="LISTA">OK ✓</option>
                                        <option value="PENDIENTE">...</option>
                                        <option value="ERROR">ERR</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 relative z-10">
                                    <input 
                                        type="text" 
                                        value={sriData.claveAcceso} 
                                        onChange={e => setSriData({...sriData, claveAcceso: e.target.value})}
                                        placeholder="Clave del portal..."
                                        className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono placeholder:text-white/20 outline-none focus:bg-white/10 transition-all"
                                    />
                                    <button 
                                        onClick={handleCopy}
                                        disabled={!sriData.claveAcceso}
                                        className={`px-3 py-2 rounded-xl transition-all ${copied ? 'bg-emerald-500' : 'bg-brand-blue hover:bg-blue-600'}`}
                                    >
                                        {copied ? <CheckCircleIcon className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                                    </button>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer relative z-10">
                                    <input type="checkbox" checked={imprimirClave} onChange={e => setImprimirClave(e.target.checked)} className="sr-only peer" />
                                    <div className="w-7 h-4 bg-white/10 rounded-full peer-checked:bg-emerald-500 transition-colors relative">
                                        <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full peer-checked:translate-x-3 transition-transform"></div>
                                    </div>
                                    <span className="text-[8px] font-black uppercase text-white/40">Imprimir Clave en Orden</span>
                                </label>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* TOTALES Y ABONO */}
            <div className="p-8 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-gray-700 shadow-[0_-15px_40px_rgba(0,0,0,0.05)]">
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Orden</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">{formatCurrency(orderTotal)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Abono Recibido ($)</label>
                            {isFullyPaid && <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Saldado</span>}
                        </div>
                        
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black">$</div>
                            <input 
                                type="number" 
                                value={abono || ''} 
                                onChange={e => setAbono(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-4 bg-white dark:bg-gray-700 border-2 border-slate-200 dark:border-gray-600 rounded-2xl font-black text-2xl text-brand-blue outline-none focus:border-brand-blue transition-all shadow-inner"
                            />
                        </div>

                        <div className="grid grid-cols-6 gap-2">
                            {quickAmounts.map(amount => (
                                <button 
                                    key={amount} 
                                    onClick={() => setAbono(amount)} 
                                    className={`py-2.5 rounded-xl font-black text-[10px] border-2 transition-all ${abono === amount ? 'bg-brand-blue border-brand-blue text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-500 hover:border-brand-blue/30'}`}
                                >
                                    ${amount}
                                </button>
                            ))}
                            <button 
                                onClick={() => setAbono(minAbonoSugerido)} 
                                className={`col-span-1 py-2.5 rounded-xl font-black text-[9px] border-2 transition-all flex flex-col items-center justify-center leading-none ${abono === minAbonoSugerido ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}
                                title={`50% redondeado a: $${minAbonoSugerido}`}
                            >
                                <span>50%</span>
                                <span className="text-[7px] mt-0.5 opacity-60">${minAbonoSugerido}</span>
                            </button>
                            <button 
                                onClick={() => setAbono(orderTotal)} 
                                className={`col-span-1 py-2.5 rounded-xl font-black text-[9px] border-2 transition-all flex flex-col items-center justify-center leading-none ${abono === orderTotal ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}
                            >
                                <span>100%</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center py-4 px-6 rounded-3xl bg-slate-950 text-white relative overflow-hidden">
                        <div className="relative z-10 flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Saldo Restante</span>
                            <span className={`text-2xl font-black tracking-tighter ${isFullyPaid ? 'text-emerald-400' : 'text-brand-red'}`}>
                                {isFullyPaid ? 'SIN DEUDA ✓' : formatCurrency(saldo)}
                            </span>
                        </div>
                        <DollarIcon className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-16 h-16 opacity-5 rotate-12" />
                    </div>

                    <button 
                        onClick={onFinalize} 
                        disabled={isLoading || cartItems.length === 0} 
                        className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-4 ${isLoading || cartItems.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-brand-red text-white hover:bg-slate-950 shadow-red-900/20'}`}
                    >
                        {isLoading ? <Loader2Icon className="animate-spin w-5 h-5"/> : (
                            <>Crear Orden de Trabajo <ArrowRightIcon className="w-5 h-5"/></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;
