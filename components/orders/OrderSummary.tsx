
import React from 'react';
import { Cliente } from '../../types';
import { formatCurrency } from '../../utils';
import { TrashIcon, CheckCircleIcon, Loader2Icon, WalletIcon } from '../Icons';
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
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
    cartItems, orderTotal, client, 
    abono, setAbono, onUpdateQuantity, onRemoveItem, onFinalize, isLoading 
}) => {
    
    const saldo = orderTotal - abono;
    const isFullyPaid = saldo <= 0;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4 opacity-60">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <WalletIcon className="w-8 h-8" />
                        </div>
                        <p className="font-medium">El carrito está vacío</p>
                        <p className="text-xs max-w-[200px]">Agrega productos del panel izquierdo para comenzar.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cartItems.map(({ producto, cantidad }) => (
                            <div key={producto.id} className="group flex items-start gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600 h-full">
                                    <button onClick={() => onUpdateQuantity(producto.id, cantidad + 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-blue hover:bg-white rounded text-xs transition-colors">▲</button>
                                    <span className="font-bold text-sm text-gray-800 dark:text-white py-1">{cantidad}</span>
                                    <button onClick={() => onUpdateQuantity(producto.id, cantidad - 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white rounded text-xs transition-colors">▼</button>
                                </div>

                                <div className="flex-grow min-w-0 py-1">
                                    <p className="font-bold text-sm text-gray-800 dark:text-white leading-tight mb-1 line-clamp-2">{producto.nombre}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(producto.precio)} unit.</p>
                                </div>

                                <div className="flex flex-col items-end justify-between h-full py-1">
                                    <p className="text-sm font-black text-brand-blue">{formatCurrency(producto.precio * cantidad)}</p>
                                    <button onClick={() => onRemoveItem(producto.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Eliminar"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] relative z-20">
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-end">
                        <span className="text-gray-500 dark:text-gray-400 font-medium text-sm">Total a Pagar</span>
                        <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(orderTotal)}</span>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex justify-between items-center group focus-within:ring-2 focus-within:ring-brand-blue focus-within:border-transparent transition-all">
                        <label htmlFor="abonoInput" className="font-bold text-gray-600 dark:text-gray-300 text-sm flex items-center gap-2 cursor-pointer">
                            <WalletIcon className="w-5 h-5 text-gray-400 group-focus-within:text-brand-blue" />
                            Abono / Pago
                        </label>
                        <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 font-bold ml-2">$</span>
                            <input 
                                id="abonoInput"
                                type="number" 
                                value={abono} 
                                onChange={e => setAbono(parseFloat(e.target.value) || 0)} 
                                className="w-32 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-6 pr-3 text-right font-black text-lg focus:outline-none transition-all"
                                onFocus={(e) => e.target.select()}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saldo Pendiente</span>
                        {isFullyPaid ? (
                            <span className="text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full flex items-center gap-1">
                                <CheckCircleIcon className="w-4 h-4" /> Pagado
                            </span>
                        ) : (
                            <span className="text-xl font-black text-brand-red">{formatCurrency(saldo)}</span>
                        )}
                    </div>
                </div>

                <button 
                    onClick={onFinalize} 
                    disabled={isLoading || cartItems.length === 0} 
                    className={`
                        w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95
                        ${isLoading || cartItems.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-brand-blue to-blue-700 text-white hover:shadow-blue-500/30 hover:-translate-y-1'}
                    `}
                >
                    {isLoading ? <><Loader2Icon className="animate-spin w-6 h-6"/> Procesando...</> : <><CheckCircleIcon className="w-6 h-6"/> Confirmar Pedido</>}
                </button>
            </div>
        </div>
    );
};

export default OrderSummary;
