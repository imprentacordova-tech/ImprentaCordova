
import React, { useState, useEffect } from 'react';
import { Cliente } from '../../types';
import { formatCurrency } from '../../utils';
import { 
    TrashIcon, CheckCircleIcon, Loader2Icon, WalletIcon, 
    ShieldCheckIcon, KeyIcon, Copy, ArrowRightIcon, ExclamationTriangleIcon,
    ClockIcon
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
    prioridad?: 'Normal' | 'Urgente';
    setPrioridad?: (val: 'Normal' | 'Urgente') => void;
    tiempoEntrega?: '24h' | '48h';
    setTiempoEntrega?: (val: '24h' | '48h') => void;
    onUpdateQuantity: (id: string, qty: number) => void;
    onRemoveItem: (id: string) => void;
    onFinalize: () => void;
    isLoading: boolean;
    sriData: any;
    setSriData: (data: any) => void;
    imprimirClave: boolean;
    setImprimirClave: (val: boolean) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
    cartItems, orderTotal, client, abono, setAbono, 
    prioridad = 'Normal', setPrioridad,
    tiempoEntrega = '48h', setTiempoEntrega,
    onUpdateQuantity, onRemoveItem, onFinalize, isLoading,
    sriData, setSriData, imprimirClave, setImprimirClave
}) => {
    const [copied, setCopied] = useState(false);
    const saldo = Math.max(0, orderTotal - abono);

    const suggestAbono = (percent: number) => {
        setAbono(Math.ceil(orderTotal * percent));
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <WalletIcon className="w-12 h-12 mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Pedido Vacío</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle</span>
                             <div className="flex gap-2">
                                {setPrioridad && (
                                    <button 
                                        onClick={() => setPrioridad(prioridad === 'Normal' ? 'Urgente' : 'Normal')}
                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${prioridad === 'Urgente' ? 'bg-brand-red text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                        {prioridad === 'Urgente' ? '🔥 URGENTE' : 'Prioridad'}
                                    </button>
                                )}
                             </div>
                        </div>
                        {cartItems.map(([id, item]) => (
                            <div key={id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-transparent hover:border-brand-blue/20">
                                <div className="min-w-0 flex-grow">
                                    <p className="text-[10px] font-black uppercase truncate text-slate-800 dark:text-white">{item.producto.nombre}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">{item.cantidad} unidades • {formatCurrency(item.producto.precio + (item.surcharge || 0))} c/u</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-xs">{formatCurrency((item.producto.precio + (item.surcharge || 0)) * item.cantidad)}</span>
                                    <button onClick={() => onRemoveItem(id)} className="text-slate-300 hover:text-brand-red"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}

                        {/* SELECTOR DE TIEMPO DE ENTREGA */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100">
                             <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ClockIcon className="w-3 h-3"/> Promesa de Entrega
                             </p>
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => setTiempoEntrega?.('24h')}
                                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${tiempoEntrega === '24h' ? 'bg-brand-blue border-brand-blue text-white shadow-md' : 'bg-white text-slate-400 border-transparent'}`}
                                >
                                    24 Horas
                                </button>
                                <button 
                                    onClick={() => setTiempoEntrega?.('48h')}
                                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${tiempoEntrega === '48h' ? 'bg-brand-blue border-brand-blue text-white shadow-md' : 'bg-white text-slate-400 border-transparent'}`}
                                >
                                    48 Horas
                                </button>
                             </div>
                        </div>

                        {client && (
                             <div className="bg-slate-950 p-6 rounded-[2rem] space-y-4 border border-white/5 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheckIcon className="w-20 h-20" /></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Credenciales SRI</span>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${sriData.estadoClave === 'LISTA' ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>{sriData.estadoClave}</span>
                                </div>
                                <div className="flex gap-2 relative z-10">
                                    <input type="text" value={sriData.claveAcceso} onChange={e => setSriData({...sriData, claveAcceso: e.target.value})} placeholder="Clave..." className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white" />
                                    <button onClick={() => { navigator.clipboard.writeText(sriData.claveAcceso); setCopied(true); setTimeout(()=>setCopied(false), 2000); }} className="p-2 bg-brand-blue rounded-xl">{copied ? <CheckCircleIcon className="w-4 h-4 text-white"/> : <KeyIcon className="w-4 h-4 text-white"/>}</button>
                                </div>
                             </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-gray-700">
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Inversión Total</span>
                            <span className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">{formatCurrency(orderTotal)}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                         <div className="flex justify-between items-center"><label className="text-[10px] font-black text-brand-blue uppercase">Abono Realizado ($)</label></div>
                         <input type="number" value={abono || ''} onChange={e => setAbono(parseFloat(e.target.value) || 0)} className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-700 rounded-2xl font-black text-2xl text-brand-blue outline-none focus:border-brand-blue" placeholder="0.00" />
                         <div className="grid grid-cols-3 gap-2">
                             <button onClick={() => suggestAbono(0.5)} className="py-2.5 rounded-xl border-2 border-indigo-100 text-indigo-600 font-black text-[10px] uppercase hover:bg-indigo-50">Sugerir 50%</button>
                             <button onClick={() => suggestAbono(1)} className="py-2.5 rounded-xl border-2 border-emerald-100 text-emerald-600 font-black text-[10px] uppercase hover:bg-emerald-50">Sugerir 100%</button>
                             <button onClick={() => setAbono(0)} className="py-2.5 rounded-xl border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase hover:bg-slate-50">Limpiar</button>
                         </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-slate-950 text-white rounded-3xl relative overflow-hidden">
                        <div className="z-10"><span className="text-[8px] font-black uppercase opacity-40 block">Saldo en Entrega</span><span className="text-2xl font-black tracking-tighter text-brand-red">{formatCurrency(saldo)}</span></div>
                        {saldo === 0 && orderTotal > 0 && <CheckCircleIcon className="w-8 h-8 text-emerald-500 z-10" />}
                    </div>

                    <button onClick={onFinalize} disabled={isLoading || cartItems.length === 0} className="w-full py-6 bg-brand-red text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-slate-950 transition-all flex items-center justify-center gap-3">
                        {isLoading ? <Loader2Icon className="animate-spin w-5 h-5"/> : <>Confirmar Pedido <ArrowRightIcon className="w-5 h-5"/></>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;
