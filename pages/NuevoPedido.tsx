import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useOrder, CartItem } from '../hooks/useOrder';
import ClientSelector from '../components/orders/ClientSelector';
import ProductGrid from '../components/orders/ProductGrid';
import OrderSummary from '../components/orders/OrderSummary';
import { User, Producto, Regimen } from '../types';
import { CloseIcon, ShoppingCartIcon, UserPlusIcon, ShieldCheckIcon, WalletIcon, CheckCircleIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

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

    // Mapeo para el ProductGrid para saber cantidades actuales
    const productsInCart = useMemo(() => {
        return new Map(cartItems.map((item: CartItem) => [item.producto.id, item]));
    }, [cartItems]);

    const handleProductAction = (action: 'add', product: Producto) => {
        if (action === 'add') addProduct(product);
    };

    const handleFinalize = async () => {
        const newJob = await finalizeOrder();
        if (newJob) {
            // Resetear estado local si es necesario o navegar
            if (newJob.tipo === 'sri') {
                navigate(`/solicitud-impresion/${newJob.id}`);
            } else {
                navigate('/kds');
            }
        }
    };

    const totalItems = cartItems.reduce((acc: number, item: CartItem) => acc + item.cantidad, 0);

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden animate-fade-in">
            {/* LEFT COLUMN: POS Area (Client + Products) */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden rounded-3xl bg-gray-50 dark:bg-gray-900/50 p-2 sm:p-4 border border-gray-100 dark:border-gray-800 shadow-inner">
                
                {/* 1. Client Bar (Always visible at top) */}
                <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex-shrink-0 transition-all duration-300 ${selectedCliente ? 'p-4' : 'p-6'}`}>
                    {selectedCliente ? (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-in-up">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="bg-gradient-to-br from-brand-blue to-blue-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/30">
                                        {selectedCliente.nombre.charAt(0)}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-2">
                                        {selectedCliente.nombre}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                            {selectedCliente.ruc || selectedCliente.cedula}
                                        </span>
                                        
                                        {/* Regimen Badge */}
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide flex items-center gap-1
                                            ${selectedCliente.regimen === Regimen.NEGOCIO_POPULAR 
                                                ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                                : selectedCliente.regimen === Regimen.EMPRENDEDOR
                                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                : 'bg-blue-50 text-brand-blue border-blue-200'
                                            }`}>
                                            <ShieldCheckIcon className="w-3 h-3" />
                                            {selectedCliente.regimen}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => { 
                                    if(window.confirm('¿Cambiar de cliente reseteará el pedido actual?')) {
                                        resetOrder(); // O solo setSelectedCliente(null) si queremos mantener productos
                                    }
                                }} 
                                className="px-4 py-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors text-sm font-bold border border-transparent hover:border-red-100 flex items-center gap-2"
                            >
                                <CloseIcon className="w-4 h-4"/> Cambiar
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in max-w-2xl mx-auto w-full">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <UserPlusIcon className="w-8 h-8 text-brand-blue" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Iniciar Nuevo Pedido</h2>
                                <p className="text-gray-500 dark:text-gray-400">Busca un cliente existente o registra uno nuevo para comenzar.</p>
                            </div>
                            <ClientSelector onSelectClient={setSelectedCliente} />
                        </div>
                    )}
                </div>

                {/* 2. Product Grid (Scrollable area) */}
                {selectedCliente && (
                    <div className="flex-grow bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col animate-slide-in-up relative">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none"></div>
                        
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

            {/* RIGHT COLUMN: Summary / Cart */}
            <div className="hidden xl:flex w-[400px] flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full z-10">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center relative z-20">
                    <div>
                        <h3 className="font-black text-xl flex items-center gap-2 text-gray-900 dark:text-white">
                            <ShoppingCartIcon className="w-6 h-6 text-brand-blue"/> Resumen
                        </h3>
                        <p className="text-xs text-gray-500 font-medium ml-8">Orden de Trabajo</p>
                    </div>
                    <span className="bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-blue-500/30">
                        {totalItems} items
                    </span>
                </div>
                
                <div className="flex-grow overflow-hidden relative bg-gray-50 dark:bg-gray-900/50">
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
            <div className="xl:hidden">
                {!isSummaryOpen && (totalItems as number) > 0 && (
                    <button 
                        onClick={() => setIsSummaryOpen(true)}
                        className="fixed bottom-6 right-6 z-50 bg-brand-red text-white p-4 rounded-full shadow-2xl shadow-red-600/40 hover:scale-110 transition-transform animate-bounce-in flex items-center gap-2 pr-6"
                    >
                        <div className="relative">
                            <ShoppingCartIcon className="w-6 h-6" />
                            <span className="absolute -top-2 -right-2 bg-white text-brand-red text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">
                                {totalItems}
                            </span>
                        </div>
                        <span className="font-bold">{formatCurrency(orderTotal)}</span>
                    </button>
                )}

                <div className={`fixed inset-0 z-[60] transform transition-transform duration-300 ${isSummaryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSummaryOpen(false)}></div>
                    <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Tu Pedido</h2>
                            <button onClick={() => setIsSummaryOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><CloseIcon className="w-6 h-6"/></button>
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <OrderSummary 
                                isOpen={true} 
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
                </div>
            </div>
        </div>
    );
};

export default NuevoPedidoPage;