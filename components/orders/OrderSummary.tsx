
import React, { useState } from 'react';
import { Producto, Cliente } from '../../types';
import { formatCurrency } from '../../utils';
import { ShoppingCartIcon, CloseIcon, TrashIcon, CheckCircleIcon, Loader2Icon } from '../Icons';
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
    isOpen, onClose, cartItems, orderTotal, client, 
    abono, setAbono, onUpdateQuantity, onRemoveItem, onFinalize, isLoading 
}) => {
    
    // Floating Button Logic inside the main layout
    if (!isOpen && cartItems.length > 0) {
        return (
            <button onClick={onClose} className="fixed bottom-8 right-8 z-40 bg-brand-red text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 hover:bg-red-700 transition-all hover:scale-105 hover:-translate-y-1 animate-bounce-in">
                <ShoppingCartIcon className="h-6 w-6"/>
                <div className="flex flex-col items-start leading-none">
                    <span className="text-xs font-bold opacity-90">{cartItems.reduce((acc, i) => acc + i.cantidad, 0)} items</span>
                    <span className="font-extrabold text-sm">{formatCurrency(orderTotal)}</span>
                </div>
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            
            {/* Slide-over Panel */}
            <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <ShoppingCartIcon className="h-6 w-6 text-brand-blue"/> Resumen del Pedido
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500"><CloseIcon className="w-6 h-6"/></button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-5 space-y-4">
                    {client && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="text-xs font-bold text-blue-500 uppercase">Cliente</p>
                            <p className="font-bold text-gray-900 dark:text-white">{client.nombre}</p>
                            <p className="text-sm text-gray-500">{client.cedula}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {cartItems.map(({ producto, cantidad }) => (
                            <div key={producto.id} className="flex items-center gap-3 bg-white dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                                <div className="flex flex-col items-center gap-1">
                                    <input 
                                        type="number" 
                                        value={cantidad} 
                                        onChange={(e) => onUpdateQuantity(producto.id, parseInt(e.target.value) || 1)} 
                                        className="w-12 h-8 text-center font-bold border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-200 dark:border-gray-500 focus:ring-brand-blue focus:border-brand-blue text-sm"
                                    />
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="font-bold text-sm truncate text-gray-800 dark:text-gray-200">{producto.nombre}</p>
                                    <p className="text-xs text-brand-blue font-semibold">{formatCurrency(producto.precio * cantidad)}</p>
                                </div>
                                <button onClick={() => onRemoveItem(producto.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                                    <TrashIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        ))}
                        {cartItems.length === 0 && <p className="text-center text-gray-400 py-10">El carrito está vacío</p>}
                    </div>
                </div>

                {/* Footer / Calculations */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-lg">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Total</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(orderTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="font-semibold text-gray-700 dark:text-gray-300">Abono Inicial</label>
                            <div className="relative w-32">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                <input 
                                    type="number" 
                                    value={abono} 
                                    onChange={e => setAbono(parseFloat(e.target.value) || 0)} 
                                    className="w-full pl-6 pr-2 py-1.5 border rounded-lg text-right font-bold text-lg focus:ring-2 focus:ring-brand-blue outline-none dark:bg-gray-700 dark:border-gray-600"
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                            <span className="font-bold text-gray-500 uppercase text-xs">Saldo Pendiente</span>
                            <span className={`text-xl font-black ${orderTotal - abono > 0 ? 'text-brand-red' : 'text-green-500'}`}>
                                {formatCurrency(orderTotal - abono)}
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={onFinalize} 
                        disabled={isLoading || cartItems.length === 0} 
                        className="w-full py-4 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                    >
                        {isLoading ? <Loader2Icon className="animate-spin w-5 h-5"/> : <CheckCircleIcon className="w-5 h-5"/>}
                        {isLoading ? 'Procesando...' : 'Confirmar Pedido'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default OrderSummary;
