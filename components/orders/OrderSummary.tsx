
import React, { useState } from 'react';
import { Cliente } from '../../types';
import { formatCurrency } from '../../utils';
import { TrashIcon, CheckCircleIcon, Loader2Icon, WalletIcon, ExclamationTriangleIcon, SparklesIcon, ArrowRightIcon, KeyIcon, Copy, ShieldCheckIcon } from '../Icons';
import { CartItem } from '../../hooks/useOrder';

interface OrderSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    orderTotal: number;
    client: Cliente | null;
    abono: number;
    setAbono: (val: number) => void;
    onUpdateQuantity: (id: string, qty: number) => void;
    onRemoveItem: (id: string) => void;
    onFinalize: () => void;
    isLoading: boolean;
    // Props para Claves SRI
    sriData: any;
    setSriData: (data: any) => void;
    imprimirClave: boolean;
    setImprimirClave: (val: boolean) => void;
}

const quickAmounts = [5, 10, 20];

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
    cartItems, orderTotal, client, 
    abono, setAbono, onUpdateQuantity, onRemoveItem, onFinalize, isLoading,
    sriData, setSriData, imprimirClave, setImprimirClave
}) => {
    const [copied, setCopied] = useState(false);
    const saldo = orderTotal - abono;
    const minAbonoSugerido = orderTotal * 0.5;
    const isUnderPolicy = abono < minAbonoSugerido && abono > 0;
    const isFullyPaid = abono >= orderTotal;

    const handleCopy = () => {
        if (!sriData.claveAcceso) return;
        navigator.clipboard.writeText(sriData.claveAcceso);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4 opacity-60">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <WalletIcon className="w-8 h-8" />
                        </div>
                        <p className="font-black uppercase text-[10px] tracking-widest">El carrito está vacío</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle de Orden</span>
                                <div className="h-px bg-slate-100 dark:bg-slate-700 flex-grow"></div>
                            </div>
                            {cartItems.map(({ producto, cantidad }) => (
                                <div key={producto.id} className="group flex items-start gap-4 p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 border border-transparent hover:border-brand-blue/20 transition-all">
                                    <div className="flex flex-col items-center bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-700">
                                        <button onClick={() => onUpdateQuantity(producto.id, cantidad + 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand-blue transition-colors">▲</button>
                                        <span className="font-black text-xs text-brand-blue py-1">{cantidad}</span>
                                        <button onClick={() => onUpdateQuantity(producto.id, Math.max(1, cantidad - 1))} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-brand-red transition-colors">▼</button>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-black text-xs text-slate-800 dark:text-white uppercase leading-tight truncate">{producto.nombre}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{formatCurrency(producto.precio)} unit.</p>
                                        <p className="text-sm font-black text-brand-blue mt-2">{formatCurrency(producto.precio * cantidad)}</p>
                                    </div>
                                    <button onClick={() => onRemoveItem(producto.id)} className="text-slate-200 hover:text-brand-red transition-colors p-2"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            ))}
                        </div>

                        {/* SECCIÓN DE CLAVE SRI MAESTRA - OPTIMIZADA */}
                        {client && (
                            <div className="bg-slate-950 text-white rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden group border border-white/5">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <ShieldCheckIcon className="w-32 h-32" />
                                </div>
                                
                                <div className="flex justify-between items-center relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${sriData.hasKey ? 'bg-emerald-500' : 'bg-amber-500'} shadow-lg`}>
                                            <KeyIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 block">Portal SRI</span>
                                            <span className="text-xs font-black uppercase text-white tracking-tighter">Seguridad Maestra</span>
                                        </div>
                                    </div>
                                    <select 
                                        value={sriData.estadoClave} 
                                        onChange={e => setSriData({...sriData, estadoClave: e.target.value})}
                                        className={`text-[8px] font-black px-3 py-1.5 rounded-full border-none outline-none shadow-xl transition-colors cursor-pointer ${sriData.estadoClave === 'LISTA' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}
                                    >
                                        <option value="LISTA">PROBADA ✓</option>
                                        <option value="PENDIENTE">PENDIENTE ⏳</option>
                                        <option value="ERROR">ERROR ✖</option>
                                    </select>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={sriData.claveAcceso} 
                                            onChange={e => setSriData({...sriData, claveAcceso: e.target.value})}
                                            placeholder="Introduce clave..."
                                            className="flex-grow bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-sm font-mono placeholder:text-white/20 outline-none focus:bg-white/20 focus:ring-2 focus:ring-brand-blue transition-all"
                                        />
                                        <button 
                                            onClick={handleCopy}
                                            disabled={!sriData.claveAcceso}
                                            className={`px-4 py-3 rounded-2xl transition-all shadow-xl flex items-center justify-center ${copied ? 'bg-emerald-500 text-white scale-105' : 'bg-brand-blue text-white hover:bg-blue-600 active:scale-95'}`}
                                            title="Copiar para el portal del SRI"
                                        >
                                            {copied ? <CheckCircleIcon className="w-5 h-5 animate-bounce"/> : <Copy className="w-5 h-5"/>}
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between px-2">
                                        <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                            <div className="relative">
                                                <input type="checkbox" checked={imprimirClave} onChange={e => setImprimirClave(e.target.checked)} className="sr-only peer" />
                                                <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                                                <div className="absolute top-1 left-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover/toggle:text-white transition-colors">¿Imprimir en Solicitud?</span>
                                        </label>
                                        
                                        {sriData.autoFilled && (
                                            <span className="text-[8px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded-md animate-fade-in">Auto-detectada</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* SECCIÓN DE PAGOS */}
            <div className="p-8 bg-white dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700 shadow-[0_-20px_50px_rgba(0,0,0,0.04)] relative z-20">
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Inversión</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(orderTotal)}</span>
                            </div>
                        </div>
                        {isUnderPolicy && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 px-3 py-1.5 rounded-xl border border-amber-100 flex items-center gap-2 animate-pulse">
                                <ExclamationTriangleIcon className="w-4 h-4"/>
                                <span className="text-[9px] font-black uppercase tracking-widest">50% min.</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                        {quickAmounts.map(amount => (
                            <button key={amount} onClick={() => setAbono(amount)} className={`py-3 rounded-xl font-black text-[10px] border-2 transition-all ${abono === amount ? 'bg-brand-blue border-brand-blue text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 text-slate-500'}`}>${amount}</button>
                        ))}
                        <button onClick={() => setAbono(minAbonoSugerido)} className={`py-3 rounded-xl font-black text-[10px] border-2 transition-all ${abono === minAbonoSugerido ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-600'}`}>50%</button>
                        <button onClick={() => setAbono(orderTotal)} className={`py-3 rounded-xl font-black text-[10px] border-2 transition-all ${abono === orderTotal ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-emerald-50 text-emerald-600'}`}>100%</button>
                    </div>

                    <div className="flex justify-between items-center py-4 px-6 rounded-3xl bg-slate-900 text-white relative">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Saldo</span>
                        <span className={`text-2xl font-black tracking-tighter ${isFullyPaid ? 'text-emerald-400' : 'text-brand-red'}`}>{isFullyPaid ? 'PAGADO ✓' : formatCurrency(saldo)}</span>
                    </div>

                    <button 
                        onClick={onFinalize} 
                        disabled={isLoading || cartItems.length === 0} 
                        className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-4 ${isLoading || cartItems.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-brand-red text-white hover:bg-slate-950 shadow-red-900/20'}`}
                    >
                        {isLoading ? <Loader2Icon className="animate-spin w-5 h-5"/> : (
                            <>Generar Orden <ArrowRightIcon className="w-5 h-5"/></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;
