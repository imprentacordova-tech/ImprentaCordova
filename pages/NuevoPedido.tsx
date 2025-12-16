import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useOrder, CartItem } from '../hooks/useOrder';
import ClientSelector from '../components/orders/ClientSelector';
import ProductGrid from '../components/orders/ProductGrid';
import OrderSummary from '../components/orders/OrderSummary';
import { User, Producto } from '../types';
import { CloseIcon, ShoppingCartIcon } from '../components/Icons';

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
        <div className="flex h-full gap-6 overflow-hidden">
            {/* Area Principal: Selección de Cliente y Productos */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-24">
                
                {/* Bloque 1: Selector de Cliente */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    {selectedCliente ? (
                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 animate-fade-in">
                            <div>
                                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Cliente Seleccionado</p>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCliente.nombre}</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{selectedCliente.ruc || selectedCliente.cedula} • {selectedCliente.telefono[0]}</p>
                            </div>
                            <button onClick={() => setSelectedCliente(null)} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:text-red-500 transition-colors">
                                <CloseIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    ) : (
                        <ClientSelector onSelectClient={setSelectedCliente} />
                    )}
                </div>

                {/* Bloque 2: Grilla de Productos */}
                {selectedCliente && (
                    <div className="flex-grow bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col min-h-[500px] animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Catálogo de Productos</h2>
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

            {/* Sidebar / Resumen Flotante */}
            {selectedCliente && (
                <>
                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block w-[350px] flex-shrink-0 animate-slide-in-up">
                        <div className="bg-white dark:bg-gray-800 h-full rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
                            <div className="p-5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                                    <ShoppingCartIcon className="w-5 h-5 text-brand-blue"/> Resumen
                                </h3>
                            </div>
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

                    {/* Mobile Floating Button & Modal */}
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
                        {!isSummaryOpen && cartItems.length > 0 && (
                            <button 
                                onClick={() => setIsSummaryOpen(true)} 
                                className="fixed bottom-20 right-6 bg-brand-red text-white p-4 rounded-full shadow-2xl z-50 animate-bounce-in"
                            >
                                <ShoppingCartIcon className="w-6 h-6" />
                                <span className="absolute -top-2 -right-2 bg-white text-brand-red text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border border-red-100">
                                    {cartItems.reduce((acc, i: CartItem) => acc + i.cantidad, 0)}
                                </span>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NuevoPedidoPage;