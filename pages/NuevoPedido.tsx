
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useOrder, CartItem } from '../hooks/useOrder';
import ClientSelector from '../components/orders/ClientSelector';
import ProductGrid from '../components/orders/ProductGrid';
import OrderSummary from '../components/orders/OrderSummary';
import { User, Producto, Regimen, Trabajo, TrabajoEstado } from '../types';
import { CloseIcon, ShoppingCartIcon, UserPlusIcon, ShieldCheckIcon, WalletIcon, CheckCircleIcon, ExclamationTriangleIcon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { getTrabajos } from '../services/mockApi';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();
    const { 
        selectedCliente, cartItems, jobType, titular, abono, 
        orderTotal, isLoading, 
        setSelectedCliente, setJobType, setAbono, 
        addProduct, removeProduct, updateQuantity, finalizeOrder, resetOrder
    } = useOrder(currentUser.nombre);

    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [clientDebt, setClientDebt] = useState(0);

    // Calcular deuda histórica del cliente al seleccionarlo
    useEffect(() => {
        if (selectedCliente) {
            getTrabajos().then(trabajos => {
                const totalDebt = trabajos
                    .filter(t => t.clienteId === selectedCliente.id && t.estado !== TrabajoEstado.ENTREGADO)
                    .reduce((sum, t) => sum + t.saldo, 0);
                setClientDebt(totalDebt);
            });
        } else {
            setClientDebt(0);
        }
    }, [selectedCliente]);

    const productsInCart = useMemo(() => {
        return new Map(cartItems.map((item: CartItem) => [item.producto.id, item]));
    }, [cartItems]);

    const handleProductAction = (action: 'add', product: Producto) => {
        if (action === 'add') addProduct(product);
    };

    const handleFinalize = async () => {
        const newJob = await finalizeOrder();
        if (newJob) {
            if (newJob.tipo === 'sri') {
                navigate(`/solicitud-impresion/${newJob.id}`);
            } else {
                navigate('/kds');
            }
        }
    };

    const totalItems = cartItems.reduce((acc: number, item: CartItem) => acc + item.cantidad, 0);

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden animate-fade-in pb-4">
            <div className="flex-1 flex flex-col gap-4 overflow-hidden rounded-3xl bg-slate-50 dark:bg-gray-900/50 p-2 sm:p-4 border border-slate-200 dark:border-gray-800 shadow-inner">
                
                {/* Cabecera de Cliente e Info de Deuda */}
                <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 flex-shrink-0 transition-all duration-300 ${selectedCliente ? 'p-4' : 'p-6'}`}>
                    {selectedCliente ? (
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-brand-blue text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                                    {selectedCliente.nombre.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase leading-none mb-1">{selectedCliente.nombre}</h2>
                                    <div className="flex gap-2 items-center">
                                        <span className="text-[10px] font-black bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded text-slate-500">{selectedCliente.ruc || selectedCliente.cedula}</span>
                                        {clientDebt > 0 && (
                                            <span className="flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-black px-2 py-0.5 rounded border border-red-100 animate-pulse">
                                                <ExclamationTriangleIcon className="w-3 h-3"/> DEUDA: {formatCurrency(clientDebt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={resetOrder} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-brand-red uppercase tracking-widest transition-colors">Cambiar Cliente</button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto w-full py-10">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserPlusIcon className="w-8 h-8 text-brand-blue" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900">Nueva Orden</h2>
                                <p className="text-slate-500">Inicia seleccionando un cliente para el pedido.</p>
                            </div>
                            <ClientSelector onSelectClient={setSelectedCliente} />
                        </div>
                    )}
                </div>

                {/* Grid de Productos */}
                {selectedCliente && (
                    <div className="flex-grow bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col">
                        <ProductGrid 
                            onProductAction={handleProductAction} 
                            productsInCart={productsInCart}
                            jobType={jobType}
                            clientRegimen={selectedCliente.regimen}
                            onSetJobType={setJobType}
                        />
                    </div>
                )}
            </div>

            {/* Resumen Derecho */}
            <div className="hidden xl:flex w-[400px] flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-black text-xl flex items-center gap-2">
                        <ShoppingCartIcon className="w-6 h-6 text-brand-blue"/> PEDIDO
                    </h3>
                    <span className="bg-brand-red text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{totalItems} ÍTEMS</span>
                </div>
                <div className="flex-grow overflow-hidden">
                    <OrderSummary 
                        isOpen={true} 
                        onClose={() => {}} 
                        cartItems={cartItems}
                        orderTotal={orderTotal}
                        client={selectedCliente}
                        abono={abono}
                        setAbono={setAbono}
                        onUpdateQuantity={updateQuantity}
                        onRemoveItem={removeProduct}
                        onFinalize={handleFinalize}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default NuevoPedidoPage;
