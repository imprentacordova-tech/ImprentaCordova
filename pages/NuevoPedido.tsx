
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useOrder, CartItem } from '../hooks/useOrder';
import ClientSelector from '../components/orders/ClientSelector';
import ProductGrid from '../components/orders/ProductGrid';
import OrderSummary from '../components/orders/OrderSummary';
import { User, Producto, Regimen, TrabajoEstado, TrabajoTipo } from '../types';
import { CloseIcon, ShoppingCartIcon, UserPlusIcon, ShieldCheckIcon, WalletIcon, CheckCircleIcon, ExclamationTriangleIcon, KeyIcon, SparklesIcon, CordovaLogo, LayersIcon, ArrowRightIcon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { getTrabajos } from '../services/mockApi';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();
    const { 
        selectedCliente, cartItems, jobType, abono, titular,
        orderTotal, isLoading, sriData, imprimirClave, actividadSeleccionada,
        setSelectedCliente, setJobType, setAbono, setSriData, setImprimirClave, setActividadSeleccionada, setTitular,
        addProduct, removeProduct, updateQuantity, finalizeOrder, resetOrder
    } = useOrder(currentUser.nombre);

    const [clientDebt, setClientDebt] = useState(0);

    const clientActivities = useMemo(() => {
        if (!selectedCliente?.actividades) return [];
        return selectedCliente.actividades.split('|').filter(a => a.length > 0);
    }, [selectedCliente]);

    useEffect(() => {
        if (selectedCliente) {
            getTrabajos().then(trabajos => {
                const totalDebt = trabajos
                    .filter(t => t.clienteId === selectedCliente.id && t.estado !== TrabajoEstado.ENTREGADO)
                    .reduce((sum, t) => sum + t.saldo, 0);
                setClientDebt(totalDebt);
            });
            // Auto-seleccionar la primera actividad si existe para evitar nulos
            if (selectedCliente.actividades) {
                const firstAct = selectedCliente.actividades.split('|')[0];
                if (firstAct) setActividadSeleccionada(firstAct);
            }
        }
    }, [selectedCliente]);

    const handleFinalize = async () => {
        const newJob = await finalizeOrder();
        if (newJob) {
            // --- ENRUTAMIENTO INTELIGENTE ---
            if (newJob.tipo === TrabajoTipo.SRI) {
                // Flujo SRI: Prioridad es la Solicitud de Autorización firmada
                navigate(`/solicitud-impresion/${newJob.id}`);
            } else {
                // Flujo General: Prioridad es el Recibo/Comprobante para el cliente
                navigate(`/recibo-abono/${newJob.id}`);
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
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nueva Orden</h2>
                                <p className="text-slate-500 mt-2 tracking-tight">Busca un contribuyente o escanea su RUC para iniciar.</p>
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
                                            <span className="text-[10px] font-bold text-slate-400">{selectedCliente.ruc || selectedCliente.cedula}</span>
                                            {clientDebt > 0 && <span className="bg-red-50 text-red-600 text-[9px] font-black px-2 py-0.5 rounded border border-red-100 uppercase tracking-widest">DEUDA: {formatCurrency(clientDebt)}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={resetOrder} className="px-4 py-2 text-[10px] font-black text-slate-400 hover:text-brand-red uppercase tracking-widest transition-colors">Cambiar Cliente</button>
                                </div>
                            </div>

                            {/* SELECTOR DE ACTIVIDAD PARA SRI (CRÍTICO PARA SOLICITUD) */}
                            {jobType === TrabajoTipo.SRI && (
                                <div className="bg-slate-950 p-4 rounded-2xl flex flex-col items-start gap-3 animate-slide-in-up border border-white/5">
                                    <div className="flex items-center gap-2 w-full">
                                        <div className="p-1.5 bg-brand-red rounded-lg"><LayersIcon className="w-3.5 h-3.5 text-white" /></div>
                                        <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] flex-grow">Actividad para Autorización SRI:</span>
                                    </div>
                                    
                                    {clientActivities.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 w-full">
                                            {clientActivities.map(act => (
                                                <button 
                                                    key={act} 
                                                    onClick={() => setActividadSeleccionada(act)}
                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-normal text-left max-w-full border ${actividadSeleccionada === act ? 'bg-brand-red border-brand-red text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    {act}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="w-full flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Escriba la actividad económica principal..."
                                                value={actividadSeleccionada}
                                                onChange={(e) => setActividadSeleccionada(e.target.value.toUpperCase())}
                                                className="w-full bg-white/10 border-none rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 font-bold focus:ring-1 focus:ring-brand-red uppercase"
                                            />
                                        </div>
                                    )}
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
