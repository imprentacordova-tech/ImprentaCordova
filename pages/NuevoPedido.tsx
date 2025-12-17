
import React, { useState, useEffect, useMemo } from 'react';
import { getClientes, getProductos, createTrabajo } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoEstado, TrabajoTipo, Regimen, Producto, User } from '../types';
import { formatCurrency } from '../utils';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CloseIcon, SearchIcon, CheckCircleIcon, UserPlusIcon, PrinterIcon, KdsIcon, TrashIcon, ShieldCheckIcon, DocumentIcon, FolderIcon, ArrowLeftIcon, ArrowRightIcon, ShoppingCartIcon } from '../components/Icons';
import ClientSelector from '../components/orders/ClientSelector';
import ProductGrid from '../components/orders/ProductGrid';
import OrderSummary from '../components/orders/OrderSummary';

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

interface CartItem {
    producto: Producto;
    cantidad: number;
}

type Step = 'cliente' | 'productos' | 'resumen';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();

    // State
    const [step, setStep] = useState<Step>('cliente');
    const [isLoading, setIsLoading] = useState(false);
    const [createdTrabajo, setCreatedTrabajo] = useState<Trabajo | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    // Order State
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [selectedProductos, setSelectedProductos] = useState<Map<string, CartItem>>(new Map());
    const [jobType, setJobType] = useState<TrabajoTipo>(TrabajoTipo.GENERAL);
    const [titular, setTitular] = useState('');
    const [abono, setAbono] = useState(0);

    // Memos
    const cartItemsList = useMemo(() => Array.from(selectedProductos.values()), [selectedProductos]);
    
    const orderTotal = useMemo(() => {
        return cartItemsList.reduce((total: number, item: CartItem) => total + (item.producto.precio * item.cantidad), 0);
    }, [cartItemsList]);

    const totalItemsInCart = useMemo(() => {
        return cartItemsList.reduce((total: number, item: CartItem) => total + item.cantidad, 0);
    }, [cartItemsList]);

    // Handlers
    const resetOrderState = () => {
        setStep('cliente');
        setSelectedCliente(null);
        setSelectedProductos(new Map());
        setTitular('');
        setAbono(0);
        setCreatedTrabajo(null);
        setJobType(TrabajoTipo.GENERAL);
    };
    
    const handleSelectClient = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setTitular(cliente.nombre);
        setStep('productos');
    };

    const handleProductAction = (action: 'add' | 'remove' | 'update', producto: Producto, cantidad?: number) => {
        setSelectedProductos(prev => {
            const newMap = new Map<string, CartItem>(prev);
            const existing = newMap.get(producto.id);
            switch (action) {
                case 'add':
                    newMap.set(producto.id, { producto, cantidad: (existing?.cantidad || 0) + 1 });
                    break;
                case 'remove':
                    newMap.delete(producto.id);
                    break;
                case 'update':
                    if (existing && cantidad && cantidad >= 1) newMap.set(producto.id, { producto: existing.producto, cantidad: cantidad });
                    break;
            }
            return newMap;
        });
    };

    const handleFinalizeOrder = async () => {
        if (!selectedCliente || selectedProductos.size === 0) return;
        setIsLoading(true);
        const items = cartItemsList;
        
        try {
            const newTrabajo = await createTrabajo({
                clienteId: selectedCliente.id,
                titular: titular || selectedCliente.nombre,
                tipo: jobType,
                subtipo: items.map((i) => `${i.cantidad}x ${i.producto.nombre}`).join(', '),
                cantidad: items.reduce((sum, i) => sum + i.cantidad, 0),
                tamano: 'Varios',
                total: orderTotal,
                abono,
                estado: TrabajoEstado.PENDIENTE,
                // Add SRI logic here if needed (omitted for brevity in visual update)
            }, currentUser.nombre);
            
            if (jobType === TrabajoTipo.SRI) {
                navigate(`/solicitud-impresion/${newTrabajo.id}`);
            } else {
                setCreatedTrabajo(newTrabajo);
            }
        } catch (error) {
            console.error("Error creating order", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Logic ---

    if (createdTrabajo) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 animate-fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 max-w-md text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce-in">
                        <CheckCircleIcon className="h-12 w-12 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">¡Pedido Exitoso!</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">Orden <span className="font-bold text-brand-blue">#{createdTrabajo.orden}</span> creada.</p>
                    
                    <div className="space-y-3">
                        {createdTrabajo.abono > 0 && (
                            <button onClick={() => window.open(`/#/recibo-abono/${createdTrabajo.id}`, '_blank')} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 hover:scale-105 transition-all">
                                <PrinterIcon className="h-5 w-5" /> Imprimir Recibo
                            </button>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={resetOrderState} className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Nuevo Pedido</button>
                            <button onClick={() => navigate('/kds')} className="px-4 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"><KdsIcon className="w-4 h-4"/> Taller</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // Progress Steps
    const StepIndicator = () => (
        <div className="flex justify-center mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-full p-1.5 shadow-sm border border-gray-200 dark:border-gray-700 inline-flex">
                <button onClick={() => setStep('cliente')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step === 'cliente' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>1. Cliente</button>
                <button onClick={() => selectedCliente && setStep('productos')} disabled={!selectedCliente} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step === 'productos' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 disabled:opacity-50'}`}>2. Productos</button>
                <button onClick={() => selectedProductos.size > 0 && setStep('resumen')} disabled={selectedProductos.size === 0} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${step === 'resumen' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 disabled:opacity-50'}`}>3. Pago</button>
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <StepIndicator />
            
            <div className="flex-grow flex gap-6 overflow-hidden">
                {/* --- MAIN AREA --- */}
                <div className={`flex-grow bg-gray-50 dark:bg-gray-900/50 rounded-3xl p-2 sm:p-4 border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col relative transition-all duration-500 ${isSummaryOpen ? 'mr-[400px]' : ''}`}>
                    
                    {/* STEP 1: CLIENT */}
                    {step === 'cliente' && (
                        <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">¿Quién es el cliente?</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-lg">Busca por nombre, cédula o crea uno nuevo.</p>
                            </div>
                            <ClientSelector onSelectClient={handleSelectClient} />
                        </div>
                    )}

                    {/* STEP 2: PRODUCTS */}
                    {step === 'productos' && (
                        <div className="flex flex-col h-full animate-slide-in-right">
                            {/* Selected Client Bar */}
                            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm mb-4 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-blue-600 text-white flex items-center justify-center font-bold">
                                        {selectedCliente?.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white leading-none">{selectedCliente?.nombre}</p>
                                        <p className="text-xs text-gray-500 mt-1">{selectedCliente?.ruc || selectedCliente?.cedula}</p>
                                    </div>
                                </div>
                                <button onClick={() => setStep('cliente')} className="text-xs font-bold text-gray-400 hover:text-brand-blue uppercase tracking-wide">Cambiar</button>
                            </div>

                            {/* Product Grid */}
                            <ProductGrid 
                                onProductAction={handleProductAction}
                                productsInCart={selectedProductos as any} // Typing loose for now
                                jobType={jobType}
                                clientRegimen={selectedCliente?.regimen}
                                onSetJobType={setJobType}
                            />
                        </div>
                    )}

                    {/* STEP 3: SUMMARY (Full View Mobile/Desktop) */}
                    {step === 'resumen' && (
                        <div className="flex flex-col h-full animate-slide-in-right max-w-2xl mx-auto w-full">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 text-center">Confirmar Orden</h2>
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 flex-grow flex flex-col">
                                <OrderSummary 
                                    isOpen={true} 
                                    onClose={() => {}}
                                    cartItems={cartItemsList}
                                    orderTotal={orderTotal}
                                    client={selectedCliente}
                                    abono={abono}
                                    setAbono={setAbono}
                                    onUpdateQuantity={(id, qty) => handleProductAction('update', { id } as Producto, qty)}
                                    onRemoveItem={(id) => handleProductAction('remove', { id } as Producto)}
                                    onFinalize={handleFinalizeOrder}
                                    isLoading={isLoading}
                                />
                            </div>
                            <button onClick={() => setStep('productos')} className="mt-4 mx-auto text-gray-500 hover:text-gray-800 font-bold flex items-center gap-2">
                                <ArrowLeftIcon className="w-4 h-4"/> Volver a Productos
                            </button>
                        </div>
                    )}
                </div>

                {/* --- SIDEBAR CART (Desktop only, visible in products step) --- */}
                {step === 'productos' && (
                    <div className="hidden xl:flex w-[380px] flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full fixed right-6 top-[100px] bottom-6 z-20 animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                            <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="bg-brand-blue text-white p-1.5 rounded-lg"><ShoppingCartIcon className="w-4 h-4"/></div>
                                Orden Actual
                            </h3>
                        </div>
                        <div className="flex-grow overflow-hidden relative">
                            <OrderSummary 
                                isOpen={true} 
                                onClose={() => {}} 
                                cartItems={cartItemsList}
                                orderTotal={orderTotal}
                                client={selectedCliente}
                                abono={abono}
                                setAbono={setAbono}
                                onUpdateQuantity={(id, qty) => handleProductAction('update', { id } as Producto, qty)}
                                onRemoveItem={(id) => handleProductAction('remove', { id } as Producto)}
                                onFinalize={() => setStep('resumen')} // In sidebar, finalize goes to summary step
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Floating Cart Button */}
            {step === 'productos' && totalItemsInCart > 0 && (
                <button 
                    onClick={() => setStep('resumen')}
                    className="xl:hidden fixed bottom-6 right-6 bg-brand-blue text-white px-6 py-4 rounded-full shadow-2xl shadow-blue-600/40 flex items-center gap-3 z-50 animate-bounce-in"
                >
                    <div className="relative">
                        <ShoppingCartIcon className="w-6 h-6" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-brand-blue">
                            {totalItemsInCart}
                        </span>
                    </div>
                    <span className="font-bold text-lg">{formatCurrency(orderTotal)}</span>
                    <ArrowRightIcon className="w-5 h-5 ml-1" />
                </button>
            )}
        </div>
    );
};

export default NuevoPedidoPage;
