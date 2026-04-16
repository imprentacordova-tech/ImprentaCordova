
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
        selectedCliente, tempClient, cartItems, jobType, abono, titular,
        orderTotal, isLoading, sriData, imprimirClave, actividadSeleccionada,
        setSelectedCliente, setTempClient, setJobType, setAbono, setSriData, setImprimirClave, setActividadSeleccionada, setTitular,
        addProduct, removeProduct, updateQuantity, saveItemAsProduct, finalizeOrder, resetOrder
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
        const newJob = await finalizeOrder(selectedCliente ? undefined : tempClient);
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
        <div className="flex xl:flex-row flex-col xl:h-[calc(100vh-100px)] gap-10 xl:overflow-hidden animate-fade-in pb-4 px-2">
            {/* PANEL IZQUIERDO: SELECCIÓN DE PRODUCTOS (PRIMERO) */}
            <div className="flex-1 flex flex-col gap-8 overflow-hidden">
                
                {/* CABECERA DINÁMICA */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 glass-card-luxury p-10 rounded-[2.5rem]">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-[#dce1fb] uppercase tracking-tighter mb-2 leading-tight">
                            {jobType === TrabajoTipo.SRI ? 'Emisión SRI' : 'Producción'}
                        </h2>
                        <p className="text-liquid-gold font-bold tracking-[0.3em] text-[10px] uppercase opacity-80">Selección de catálogo · Obsidian & Gold</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setJobType(jobType === TrabajoTipo.SRI ? TrabajoTipo.GENERAL : TrabajoTipo.SRI)}
                            className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${jobType === TrabajoTipo.SRI ? 'bg-brand-red border-brand-red text-white shadow-red-glow' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                        >
                            {jobType === TrabajoTipo.SRI ? 'MODO SRI ACTIVO' : 'MODO PRODUCCIÓN'}
                        </button>
                    </div>
                </div>

                {/* GRILLA DE PRODUCTOS - SIEMPRE VISIBLE */}
                <div className="flex-grow bg-brand-dark/30 backdrop-blur-xl p-10 rounded-[4rem] shadow-luxury border border-white/5 overflow-hidden flex flex-col">
                    <ProductGrid 
                        onProductAction={(action, p) => addProduct(p)} 
                        productsInCart={new Map()}
                        jobType={jobType}
                        clientRegimen={selectedCliente?.regimen || Regimen.GENERAL}
                        onSetJobType={setJobType}
                    />
                </div>
            </div>

            {/* PANEL DERECHO: CLIENTE Y RESUMEN (STICKY) */}
            <div id="cart-panel" className="flex xl:w-[500px] w-full flex-col gap-6 relative pb-28 xl:pb-0">
                
                {/* IDENTIFICACIÓN DE CLIENTE (COMPACTO) */}
                <div className="bg-brand-dark/80 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/5 via-transparent to-transparent opacity-50"></div>
                    
                    {!selectedCliente ? (
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:border-liquid-gold/30 transition-colors">
                                    <UserPlusIcon className="w-6 h-6 text-liquid-gold" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black text-sm uppercase tracking-wider">Identificación</h4>
                                    <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">Requerido para el recibo</p>
                                </div>
                            </div>
                            <ClientSelector onSelectClient={setSelectedCliente} />
                        </div>
                    ) : (
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="bg-liquid-gold/20 border border-liquid-gold/30 text-liquid-gold w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-gold-glow">
                                    {selectedCliente.nombre.charAt(0)}
                                </div>
                                <div className="max-w-[220px]">
                                    <h2 className="text-lg font-black text-white uppercase truncate">{selectedCliente.nombre}</h2>
                                    <p className="text-[9px] font-bold text-liquid-gold tracking-widest uppercase">{selectedCliente.ruc || selectedCliente.cedula}</p>
                                </div>
                            </div>
                            <button onClick={resetOrder} className="p-3 bg-white/5 hover:bg-brand-red/10 border border-white/10 hover:border-brand-red/30 rounded-xl text-slate-500 hover:text-brand-red transition-all">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* RESUMEN DE ORDEN */}
                <div className="flex-grow flex flex-col bg-brand-dark/80 backdrop-blur-2xl rounded-[3.5rem] shadow-2xl border border-white/10 overflow-hidden">
                    <div className="p-8 border-b border-white/5 bg-transparent flex justify-between items-center">
                        <h3 className="font-black text-xl tracking-tighter flex items-center gap-4 uppercase text-white">
                            <ShoppingCartIcon className="w-7 h-7 text-liquid-gold"/> Tu Pedido
                        </h3>
                        {cartItems.length > 0 && <span className="bg-liquid-gold text-brand-dark px-3 py-1 rounded-full text-[10px] font-black">{cartItems.length} ITEMS</span>}
                    </div>
                    
                    <div className="flex-grow overflow-hidden relative">
                        <OrderSummary 
                            isOpen={true} 
                            onClose={() => {}} 
                            cartItems={cartItems}
                            orderTotal={orderTotal}
                            client={selectedCliente}
                            tempClient={tempClient}
                            setTempClient={setTempClient}
                            abono={abono}
                            setAbono={setAbono}
                            onUpdateQuantity={updateQuantity}
                            onUpdateNotes={updateItemNotes}
                            onUpdatePrice={updateItemPrice}
                            onRemoveItem={removeProduct}
                            onSaveItem={saveItemAsProduct}
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

            {/* STICKY BOTTOM BAR MÓVIL */}
            {cartItems.length > 0 && (
                <div className="xl:hidden fixed bottom-4 left-4 right-4 glass-card-luxury p-4 z-50 flex justify-between items-center animate-slide-up shadow-luxury">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Estimado</span>
                        <span className="text-2xl font-black text-white">{formatCurrency(orderTotal)}</span>
                    </div>
                    <button onClick={() => {
                        document.getElementById('cart-panel')?.scrollIntoView({ behavior: 'smooth' });
                    }} className="btn-luxury py-3 px-6 !rounded-xl">
                        Ver Resumen
                    </button>
                </div>
            )}
        </div>
    );
};

export default NuevoPedidoPage;
