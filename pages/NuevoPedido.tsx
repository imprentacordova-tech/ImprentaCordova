import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useOrder, CartItem } from '../hooks/useOrder';
import ClientSelector from '../components/orders/ClientSelector';
import ProductGrid from '../components/orders/ProductGrid';
import OrderSummary from '../components/orders/OrderSummary';
import { User, Producto } from '../types';
import { CloseIcon, ShoppingCartIcon, UserPlusIcon } from '../components/Icons';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();
    const { 
        selectedCliente, cartItems, jobType, titular, abono, 
        orderTotal, isLoading, 
        setSelectedCliente, setJobType, setTitular, setAbono, 
        addProduct, removeProduct, updateQuantity, finalizeOrder 
    } = useOrder(currentUser.nombre);

    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    // Mapeo para el ProductGrid
    const productsInCart = new Map(cartItems.map((item: CartItem) => [item.producto.id, item]));

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

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden">
            {/* LEFT COLUMN: POS Area (Client + Products) */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-900/50 p-2">
                
                {/* 1. Client Bar (Always visible at top) */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0">
                    {selectedCliente ? (
                        <div className="flex justify-between items-center animate-fade-in">
                            <div className="flex items-center gap-3">
                                <div className="bg-brand-blue text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                                    {selectedCliente.nombre.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{selectedCliente.nombre}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">{selectedCliente.ruc || selectedCliente.cedula}</span>
                                        <span className="hidden sm:inline">• {selectedCliente.telefono[0]}</span>
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedCliente(null)} 
                                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                title="Cambiar Cliente"
                            >
                                <CloseIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-2 mb-2">
                                <UserPlusIcon className="w-5 h-5 text-brand-blue" />
                                <span className="font-bold text-gray-700 dark:text-gray-300">Cliente</span>
                            </div>
                            <ClientSelector onSelectClient={setSelectedCliente} />
                        </div>
                    )}
                </div>

                {/* 2. Product Grid (Scrollable area) */}
                {selectedCliente ? (
                    <div className="flex-grow bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col animate-slide-in-up">
                        <ProductGrid 
                            onProductAction={handleProductAction} 
                            productsInCart={productsInCart}
                            jobType={jobType}
                            clientRegimen={selectedCliente.regimen}
                            onSetJobType={setJobType}
                        />
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <UserPlusIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Selecciona un cliente para comenzar</p>
                    </div>
                )}
            </div>

            {/* RIGHT COLUMN: Summary / Cart */}
            <div className="hidden lg:flex w-[380px] flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-white">
                        <ShoppingCartIcon className="w-5 h-5 text-brand-blue"/> Orden Actual
                    </h3>
                    <span className="bg-brand-blue text-white text-xs font-bold px-2 py-1 rounded-full">
                        {cartItems.reduce((acc: number, i: CartItem) => acc + i.cantidad, 0)} items
                    </span>
                </div>
                
                <div className="flex-grow overflow-hidden relative">
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

            {/* Mobile Cart Button */}
            <div className="lg:hidden">
                <OrderSummary 
                    isOpen={isSummaryOpen} 
                    onClose={() => setIsSummaryOpen(false)}
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
    );
};

export default NuevoPedidoPage;