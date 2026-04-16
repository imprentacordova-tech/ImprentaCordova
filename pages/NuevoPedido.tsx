
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useOrder, CartItem } from '../hooks/useOrder';
import ClientSelector from '../components/orders/ClientSelector';
import ProductGrid from '../components/orders/ProductGrid';
import OrderSummary from '../components/orders/OrderSummary';
import { User, Producto, Regimen, TrabajoEstado, TrabajoTipo } from '../types';
import { CloseIcon, ShoppingCartIcon, UserPlusIcon, ShieldCheckIcon, WalletIcon, CheckCircleIcon, ExclamationTriangleIcon, KeyIcon, SparklesIcon, CordovaLogo, LayersIcon, ArrowRightIcon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { useData } from '../contexts/DataContext';
import { User, Producto, Regimen, TrabajoEstado, TrabajoTipo } from '../types';
import { CloseIcon, ShoppingCartIcon, UserPlusIcon, ShieldCheckIcon, WalletIcon, CheckCircleIcon, ExclamationTriangleIcon, KeyIcon, SparklesIcon, CordovaLogo, LayersIcon, ArrowRightIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { getClientDebt } = useData();
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
            setClientDebt(getClientDebt(selectedCliente.id));
            
            // Auto-seleccionar la primera actividad si existe para evitar nulos
            if (selectedCliente.actividades) {
                const firstAct = selectedCliente.actividades.split('|')[0];
                if (firstAct) setActividadSeleccionada(firstAct);
            }
        }
    }, [selectedCliente, getClientDebt]);

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
        <div className="flex xl:flex-row flex-col h-[calc(100vh-100px)] gap-6 overflow-hidden animate-fade-in pb-4">
            <div className="flex-1 flex flex-col gap-6 overflow-hidden rounded-[3rem] bg-brand-dark/20 p-2 border border-white/5 shadow-luxury">
                
                <div className={`bg-brand-dark/50 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/5 flex-shrink-0 transition-all duration-300 ${selectedCliente ? 'p-6' : 'p-12'}`}>
                    {!selectedCliente ? (
                        <div className="max-w-2xl mx-auto w-full">
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 bg-liquid-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-gold-glow">
                                    <ShieldCheckIcon className="w-10 h-10 text-liquid-gold" />
                                </div>
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Nueva Obra</h2>
                                <p className="text-slate-400 mt-2 tracking-widest text-[10px] uppercase font-bold">Identifica al contribuyente o escanea su RUC para iniciar la creación.</p>
                            </div>
                            <ClientSelector onSelectClient={setSelectedCliente} />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="bg-liquid-gold/20 border border-liquid-gold/30 text-liquid-gold w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-gold-glow relative">
                                        {selectedCliente.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase leading-none mb-2">{selectedCliente.nombre}</h2>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${selectedCliente.regimen === Regimen.NEGOCIO_POPULAR ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                                                {selectedCliente.regimen}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 tracking-wider"><span className="text-slate-600">ID /</span> {selectedCliente.ruc || selectedCliente.cedula}</span>
                                            {clientDebt > 0 && <span className="bg-brand-red/10 text-brand-red text-[9px] font-black px-3 py-1 rounded border border-brand-red/30 uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.2)]">DEUDA VIGENTE: {formatCurrency(clientDebt)}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={resetOrder} className="px-5 py-2.5 text-[9px] font-black text-slate-500 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl uppercase tracking-widest transition-all">Cambiar Coleccionista</button>
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
                    <div className="flex-grow bg-brand-dark/50 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-luxury border border-white/5 overflow-hidden flex flex-col">
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

            <div className="hidden xl:flex w-[450px] flex-col bg-brand-dark/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-liquid-gold/5 to-transparent pointer-events-none"></div>
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-transparent relative z-10">
                    <h3 className="font-black text-2xl tracking-tighter flex items-center gap-4 uppercase text-white">
                        <ShoppingCartIcon className="w-8 h-8 text-liquid-gold"/> Detalle de Obra
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
