
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useOrder, CartItem } from '../hooks/useOrder';
import ClientSelector from '../components/orders/ClientSelector';
import ProductGrid from '../components/orders/ProductGrid';
import OrderSummary from '../components/orders/OrderSummary';
import { User, Producto, Regimen, TrabajoEstado, TrabajoTipo } from '../types';
import { CloseIcon, ShoppingCartIcon, UserPlusIcon, ShieldCheckIcon, WalletIcon, CheckCircleIcon, ExclamationTriangleIcon, KeyIcon, SparklesIcon, CordovaLogo } from '../components/Icons';
import { formatCurrency } from '../utils';
import { getTrabajos } from '../services/mockApi';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();
    const { 
        selectedCliente, cartItems, jobType, titular, abono, 
        orderTotal, isLoading, sriData, imprimirClave,
        setSelectedCliente, setJobType, setAbono, setSriData, setImprimirClave,
        addProduct, removeProduct, updateQuantity, finalizeOrder, resetOrder
    } = useOrder(currentUser.nombre);

    const [clientDebt, setClientDebt] = useState(0);

    useEffect(() => {
        if (selectedCliente) {
            getTrabajos().then(trabajos => {
                const totalDebt = trabajos
                    .filter(t => t.clienteId === selectedCliente.id && t.estado !== TrabajoEstado.ENTREGADO)
                    .reduce((sum, t) => sum + t.saldo, 0);
                setClientDebt(totalDebt);
            });
        }
    }, [selectedCliente]);

    const productsInCart = useMemo(() => {
        return new Map(cartItems.map((item: CartItem) => [item.producto.id, item]));
    }, [cartItems]);

    const handleFinalize = async () => {
        const newJob = await finalizeOrder();
        if (newJob) {
            if (newJob.tipo === TrabajoTipo.SRI) {
                navigate(`/solicitud-impresion/${newJob.id}`);
            } else {
                navigate('/kds');
            }
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden animate-fade-in pb-4">
            <div className="flex-1 flex flex-col gap-4 overflow-hidden rounded-3xl bg-slate-50 dark:bg-gray-900/50 p-4 border border-slate-200 dark:border-gray-800 shadow-inner">
                
                {/* Cabecera de Selección / Estado SRI */}
                <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 flex-shrink-0 transition-all duration-300 ${selectedCliente ? 'p-4' : 'p-8'}`}>
                    {!selectedCliente ? (
                        <div className="max-w-2xl mx-auto w-full">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheckIcon className="w-8 h-8 text-brand-blue" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nueva Orden SRI</h2>
                                <p className="text-slate-500 mt-2">Los productos SRI están activados por defecto. Busca un cliente para empezar.</p>
                            </div>
                            <ClientSelector onSelectClient={setSelectedCliente} />
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-brand-blue text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg relative">
                                    {selectedCliente.nombre.charAt(0)}
                                    {sriData.hasKey && (
                                        <span className="absolute -top-1 -right-1 bg-emerald-500 border-2 border-white rounded-full p-1 shadow-md">
                                            <KeyIcon className="w-3 h-3 text-white" />
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase leading-none mb-1">{selectedCliente.nombre}</h2>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${selectedCliente.regimen === Regimen.NEGOCIO_POPULAR ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {selectedCliente.regimen}
                                        </span>
                                        {sriData.hasKey && (
                                            <span className={`flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-100`}>
                                                <KeyIcon className="w-3 h-3"/> CLAVE DETECTADA
                                            </span>
                                        )}
                                        {clientDebt > 0 && (
                                            <span className="bg-red-50 text-red-600 text-[9px] font-black px-2 py-0.5 rounded border border-red-100">
                                                DEUDA: {formatCurrency(clientDebt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {jobType === TrabajoTipo.SRI && (
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-gray-700">
                                    <div className="flex flex-col px-3 border-r border-slate-200">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Estab - P.Emi</span>
                                        <div className="flex items-center gap-1 font-mono font-bold text-sm">
                                            <input type="text" maxLength={3} value={sriData.establecimiento} onChange={e => setSriData({...sriData, establecimiento: e.target.value})} className="w-9 bg-transparent outline-none text-brand-red text-center" />
                                            <span>-</span>
                                            <input type="text" maxLength={3} value={sriData.puntoEmision} onChange={e => setSriData({...sriData, puntoEmision: e.target.value})} className="w-9 bg-transparent outline-none text-brand-red text-center" />
                                        </div>
                                    </div>
                                    <button onClick={resetOrder} className="px-4 py-2 text-xs font-black text-slate-400 hover:text-brand-red uppercase tracking-widest transition-colors">Cancelar</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {selectedCliente && (
                    <div className="flex-grow bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col">
                        <ProductGrid 
                            onProductAction={(action, p) => addProduct(p)} 
                            productsInCart={productsInCart}
                            jobType={jobType}
                            clientRegimen={selectedCliente.regimen}
                            onSetJobType={setJobType}
                        />
                    </div>
                )}
            </div>

            <div className="hidden xl:flex w-[400px] flex-col bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-gray-700 overflow-hidden">
                <div className="p-8 border-b border-slate-50 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                    <h3 className="font-black text-xl tracking-tighter flex items-center gap-3 uppercase">
                        <ShoppingCartIcon className="w-6 h-6 text-brand-red"/> Carrito
                    </h3>
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
                        // SRI Props
                        sriData={sriData}
                        setSriData={setSriData}
                        imprimirClave={imprimirClave}
                        setImprimirClave={setImprimirClave}
                    />
                </div>
            </div>
        </div>
    );
};

export default NuevoPedidoPage;
