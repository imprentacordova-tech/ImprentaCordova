
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useOrder, CartItem } from '../hooks/useOrder';
import ClientSelector from '../components/orders/ClientSelector';
import ProductGrid from '../components/orders/ProductGrid';
import OrderSummary from '../components/orders/OrderSummary';
import { User, Producto, Regimen, TrabajoEstado, TrabajoTipo } from '../types';
import { CloseIcon, ShoppingCartIcon, UserPlusIcon, ShieldCheckIcon, WalletIcon, CheckCircleIcon, ExclamationTriangleIcon, KeyIcon, SparklesIcon, CordovaLogo, LayersIcon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { getTrabajos } from '../services/mockApi';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();
    const { 
        selectedCliente, cartItems, jobType, abono, 
        orderTotal, isLoading, sriData, imprimirClave,
        setSelectedCliente, setJobType, setAbono, setSriData, setImprimirClave,
        addProduct, removeProduct, updateQuantity, finalizeOrder, resetOrder
    } = useOrder(currentUser.nombre);

    const [selectedActivity, setSelectedActivity] = useState<string>('');
    const [clientDebt, setClientDebt] = useState(0);

    // Parseamos las actividades guardadas como etiquetas
    const clientActivities = useMemo(() => {
        if (!selectedCliente?.actividades) return [];
        return selectedCliente.actividades.split('|').filter(a => a.length > 0);
    }, [selectedCliente]);

    // Al seleccionar cliente, marcamos la primera actividad por defecto
    useEffect(() => {
        if (clientActivities.length > 0) {
            setSelectedActivity(clientActivities[0]);
        }
    }, [clientActivities]);

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

    const handleFinalize = async () => {
        // En un caso real, pasaríamos selectedActivity a finalizeOrder para que se guarde en el historial del trabajo
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
                
                <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 flex-shrink-0 transition-all duration-300 ${selectedCliente ? 'p-4' : 'p-8'}`}>
                    {!selectedCliente ? (
                        <div className="max-w-2xl mx-auto w-full">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheckIcon className="w-8 h-8 text-brand-blue" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nueva Orden de Trabajo</h2>
                                <p className="text-slate-500 mt-2">Busca un contribuyente registrado o escanea un nuevo RUC.</p>
                            </div>
                            <ClientSelector onSelectClient={setSelectedCliente} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-brand-blue text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg relative">
                                        {selectedCliente.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase leading-none mb-1">{selectedCliente.nombre}</h2>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${selectedCliente.regimen === Regimen.NEGOCIO_POPULAR ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {selectedCliente.regimen}
                                            </span>
                                            {clientDebt > 0 && <span className="bg-red-50 text-red-600 text-[9px] font-black px-2 py-0.5 rounded border border-red-100 uppercase tracking-widest">DEUDA: {formatCurrency(clientDebt)}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={resetOrder} className="px-4 py-2 text-[10px] font-black text-slate-400 hover:text-brand-red uppercase tracking-widest transition-colors">Cambiar Cliente</button>
                                </div>
                            </div>

                            {/* SELECCIÓN DE ACTIVIDAD PARA SRI */}
                            {jobType === TrabajoTipo.SRI && clientActivities.length > 0 && (
                                <div className="bg-slate-950 p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4 animate-slide-in-up">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <LayersIcon className="w-4 h-4 text-brand-red" />
                                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Actividad para este documento:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 flex-grow">
                                        {clientActivities.map(act => (
                                            <button 
                                                key={act} 
                                                onClick={() => setSelectedActivity(act)}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedActivity === act ? 'bg-brand-red text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                            >
                                                {act}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {selectedCliente && (
                    <div className="flex-grow bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden flex flex-col">
                        <ProductGrid 
                            onProductAction={(action, p) => addProduct(p)} 
                            productsInCart={new Map()}
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
