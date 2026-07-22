import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { useData } from '../contexts/DataContext';
import { logActivity } from '../services/activityLogService';
import { Cliente, User, TrabajoEstado } from '../types';
import { 
    CheckCircleIcon, Loader2Icon, SolidBoxIcon, 
    ArrowRightIcon, ShoppingCartIcon, ShieldCheckIcon,
    SparklesIcon, CreditCardIcon, UserIcon,
    PrinterIcon, ClockIcon, BoltIcon, RocketLaunchIcon,
    ExclamationTriangleIcon, LayoutDashboardIcon, BookOpenIcon,
    ChevronRightIcon, ChevronLeftIcon
} from '../components/Icons';
import ClientSelector from '../components/orders/ClientSelector';
import ServiceSelector from '../components/orders/ServiceSelector';
import ProductConfigurator from '../components/orders/ProductConfigurator';
import { CommercialFlow } from '../components/orders/CommercialFlow';
import SriSolicitudStep from '../components/orders/SriSolicitudStep';
import OrderSummary from '../components/orders/OrderSummary';
import { motion, AnimatePresence } from 'framer-motion';

const NuevoPedidoPage: React.FC = () => {
    const outletCtx = useOutletContext<{ currentUser?: User }>();
    const currentUser = outletCtx?.currentUser || { nombre: 'Pedro Córdova', rol: 'Administrador' };
    const { refreshData, addTrabajo, addCliente, clientes } = useData();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [missionCategory, setMissionCategory] = useState<'SRI' | 'COMERCIAL' | null>(null);
    const [orderMode, setOrderMode] = useState<'CATALOG' | 'EXPRESS' | null>(null);
    const [loading, setLoading] = useState(false);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [tempClient, setTempClient] = useState({ nombre: '', telefono: '', cedula: '', regimen: 'General' });
    const [servicio, setServicio] = useState<any>(null);
    const [detalle, setDetalle] = useState('');
    const [precio, setPrecio] = useState(0);
    const [abono, setAbono] = useState(0);
    const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>('Normal');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [createdTrabajoId, setCreatedTrabajoId] = useState<string | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [isAddingItem, setIsAddingItem] = useState(false);

    // SRI specific states
    const [isSriOrder, setIsSriOrder] = useState(false);
    const [sriMode, setSriMode] = useState<'NUEVO' | 'RENOVACION'>('RENOVACION');
    const [sriClave, setSriClave] = useState('');
    const [sriActividad, setSriActividad] = useState('');
    const [sriEstablecimiento, setSriEstablecimiento] = useState('001');
    const [sriPuntoEmision, setSriPuntoEmision] = useState('001');
    const [imprimirClave, setImprimirClave] = useState(false);
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'auto';
    }, []);

    const canAdvance = () => {
        if (step === 1) return !!missionCategory;
        if (missionCategory === 'SRI') {
            if (step === 2) return !!cliente;
            if (step === 3) return !!sriActividad; 
            if (step === 4) return items.length > 0;
            if (step === 5) return true;
        } else if (missionCategory === 'COMERCIAL') {
            if (step === 2) return items.length > 0;
            if (step === 3) return !!cliente;
            if (step === 4) return Math.abs(precio) > 0;
        }
        return false;
    };

    const handleCreateOrder = async () => {
        let finalItems = [...items];
        if (finalItems.length === 0) {
            setError("Debe agregar al menos un ítem al pedido.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const userName = currentUser?.nombre || 'Pedro Córdova';
            const userRol = currentUser?.rol || 'Administrador';

            let finalCliente = cliente;
            if (!finalCliente) {
                if (tempClient?.cedula || tempClient?.nombre) {
                    const cleanCed = (tempClient.cedula || '').replace(/\D/g, '');
                    const existing = clientes.find(c => c.cedula === cleanCed || c.ruc === cleanCed);
                    if (existing) {
                        finalCliente = existing;
                    } else {
                        finalCliente = await addCliente({
                            nombre: (tempClient.nombre || 'CONSUMIDOR FINAL').toUpperCase(),
                            cedula: cleanCed || '9999999999',
                            telefono: tempClient.telefono ? [tempClient.telefono] : [],
                            regimen: tempClient.regimen || 'General',
                            direccion: 'Local'
                        });
                    }
                } else {
                    const existingCF = clientes.find(c => c.cedula === '9999999999');
                    if (existingCF) {
                        finalCliente = existingCF;
                    } else {
                        finalCliente = await addCliente({
                            nombre: 'CONSUMIDOR FINAL',
                            cedula: '9999999999',
                            regimen: 'General',
                            direccion: 'Local'
                        });
                    }
                }
            }

            if (!finalCliente) throw new Error("No se pudo establecer un cliente para el pedido.");

            const results = await Promise.all(finalItems.map(async (item, index) => {
                return await addTrabajo({
                    titular: finalCliente!.nombre,
                    clienteId: finalCliente!.id ? finalCliente!.id : undefined,
                    servicio: item.nombre || 'Servicio General',
                    detalle: isSriOrder 
                        ? `${item.cantidad || 1}x ${item.nombre || 'DOCUMENTO SRI'} (${item.especificaciones?.tamano || 'ESTÁNDAR'})` 
                        : `${item.descripcion || ''}`,
                    cantidad: item.cantidad || 1,
                    precio: item.precioFinal || 0,
                    abono: index === 0 ? abono : 0,
                    saldo: (item.precioFinal || 0) - (index === 0 ? abono : 0),
                    prioridad,
                    estado: TrabajoEstado.PENDIENTE,
                    fechaEntrada: new Date().toISOString(),
                    responsable: userName,
                    origen: 'Local',
                    esSRI: isSriOrder,
                    establecimiento: isSriOrder ? sriEstablecimiento : undefined,
                    puntoEmision: isSriOrder ? sriPuntoEmision : undefined,
                    tamano: item.especificaciones?.tamano || undefined,
                    estadoClave: isSriOrder ? (sriClave ? 'LISTA' : 'PENDIENTE') : 'LISTA',
                    claveAcceso: isSriOrder ? sriClave : undefined,
                    esRenovacion: isSriOrder ? (sriMode === 'RENOVACION') : undefined,
                    actividadSeleccionada: isSriOrder ? sriActividad : null,
                    imprimirClave: isSriOrder ? imprimirClave : false,
                    numeracion: item.especificaciones?.numerado,
                    autorizacion_sri: item.especificaciones?.sri?.autorizacion,
                    fechaVencimiento: item.especificaciones?.sri?.vencimiento
                }, userName, imageFile);
            }));

            logActivity(userName, userRol, 'CREAR_ORDEN', `Pedido (${finalItems.length} ítems) creado para ${finalCliente.nombre}`, 'Ventas').catch(() => {});
            refreshData().catch(() => {});
            setCreatedTrabajoId(results[0].id);
            setStep(6); 
            
            if (isSriOrder) {
                setTimeout(() => window.open(`/#/solicitud-impresion/${results[0].id}?format=a5`, '_blank'), 800);
            } else {
                setTimeout(() => window.open(`/#/recibo-epson/${results[0].id}`, '_blank'), 800);
            }
        } catch (err: any) {
            console.error('[NuevoPedido] Error al crear orden:', err);
            setError(err.message || 'Error al procesar la orden de producción.');
        } finally {
            setLoading(false);
        }
    };

    const getSteps = () => {
        if (missionCategory === 'SRI') {
            return [
                { id: 1, label: 'Categoría', icon: LayoutDashboardIcon },
                { id: 2, label: 'Cliente', icon: UserIcon },
                { id: 3, label: 'Datos SRI', icon: ShieldCheckIcon },
                { id: 4, label: 'Servicios', icon: BookOpenIcon },
                { id: 5, label: 'Pago', icon: CreditCardIcon },
                { id: 6, label: 'Confirmado', icon: RocketLaunchIcon }
            ];
        }
        return [
            { id: 1, label: 'Categoría', icon: LayoutDashboardIcon },
            { id: 2, label: 'Catálogo', icon: BookOpenIcon },
            { id: 3, label: 'Cliente', icon: UserIcon },
            { id: 4, label: 'Pago', icon: CreditCardIcon },
            { id: 5, label: 'Confirmado', icon: RocketLaunchIcon }
        ];
    };

    const handleSelectCategory = (category: 'SRI' | 'COMERCIAL') => {
        setMissionCategory(category);
        setIsSriOrder(category === 'SRI');
        setOrderMode('CATALOG');
        setStep(2);
    };

    const TelemetrySidebar = () => (
        <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="lg:col-span-4 sticky top-6 space-y-4"
        >
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-blue" />
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Resumen de Orden</h3>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        En Línea
                    </span>
                </div>

                <div className="space-y-4">
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                            Tipo de Solicitud
                        </span>
                        <div className="text-xl font-black text-slate-900 uppercase">
                            {missionCategory === 'SRI' ? 'Facturación Fiscal SRI' : (missionCategory === 'COMERCIAL' ? 'Trabajo Comercial' : 'Sin Selección')}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        <div className="flex justify-between items-baseline">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Monto Total</span>
                            <span className="text-2xl font-black text-brand-blue">{formatCurrency(precio)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600 pt-2 border-t border-slate-200">
                            <span>Abono Ingresado:</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(abono)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-600">
                            <span>Saldo Pendiente:</span>
                            <span className="font-bold text-red-500">{formatCurrency(precio - abono)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Ítems</span>
                            <span className="text-lg font-black text-slate-800">{items.length}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Prioridad</span>
                            <span className={`text-xs font-black uppercase ${prioridad === 'Urgente' ? 'text-red-500' : 'text-slate-800'}`}>
                                {prioridad}
                            </span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setIsSidebarMinimized(true)} 
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider transition-all"
                >
                    Ocultar Resumen
                </button>
            </div>
        </motion.div>
    );

    const showSidebar = !isSidebarMinimized && missionCategory && step < 5;

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-[1440px] mx-auto space-y-6">

                {/* ── STEPPER HEADER ────────────────────────────────────────── */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between overflow-x-auto gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        {getSteps().map((s, idx) => {
                            const isActive = step === s.id;
                            const isPast = step > s.id;
                            return (
                                <React.Fragment key={s.id}>
                                    <button
                                        type="button"
                                        disabled={!isPast && !isActive}
                                        onClick={() => isPast && setStep(s.id)}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
                                            isActive
                                                ? 'bg-brand-blue text-white shadow-blue-glow-sm font-bold'
                                                : isPast
                                                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold'
                                                : 'text-slate-400 opacity-60'
                                        }`}
                                    >
                                        <s.icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                                        <span className="text-[11px] uppercase tracking-wider whitespace-nowrap">
                                            {s.id}. {s.label}
                                        </span>
                                    </button>
                                    {idx < getSteps().length - 1 && (
                                        <div className={`h-0.5 w-6 rounded-full shrink-0 ${isPast ? 'bg-brand-blue/30' : 'bg-slate-200'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {missionCategory && isSidebarMinimized && (
                        <button
                            onClick={() => setIsSidebarMinimized(false)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase shrink-0 transition-colors"
                        >
                            Ver Resumen
                        </button>
                    )}
                </div>

                {/* ── CONTENIDO PRINCIPAL Y SIDEBAR ───────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className={`space-y-6 ${showSidebar ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                        <AnimatePresence mode="wait">

                            {/* PASO 1: SELECCIÓN DE CATEGORÍA */}
                            {step === 1 && (
                                <motion.div
                                    key="s1"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    className="bg-white p-8 lg:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-8 text-center"
                                >
                                    <div className="space-y-2 max-w-xl mx-auto">
                                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.3em]">RECEPCIÓN DE TRABAJOS</span>
                                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                                            Selecciona el Tipo de Orden
                                        </h2>
                                        <p className="text-[12px] text-slate-500 font-medium">
                                            Elige el flujo de trabajo correspondiente para configurar los parámetros del pedido.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
                                        {/* Card SRI */}
                                        <div
                                            onClick={() => handleSelectCategory('SRI')}
                                            className="group bg-white p-8 rounded-2xl border-2 border-slate-200 hover:border-brand-blue transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md space-y-6"
                                        >
                                            <div className="w-14 h-14 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center group-hover:scale-105 transition-transform">
                                                <ShieldCheckIcon className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black text-slate-900 uppercase">Facturación SRI</h3>
                                                <p className="text-[12px] text-slate-500">
                                                    Documentos fiscales autorizados (Facturas, Notas de Venta, Retenciones, Guías de Remisión).
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-brand-blue uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                                Iniciar Flujo SRI <ArrowRightIcon className="w-4 h-4" />
                                            </div>
                                        </div>

                                        {/* Card Comercial */}
                                        <div
                                            onClick={() => handleSelectCategory('COMERCIAL')}
                                            className="group bg-white p-8 rounded-2xl border-2 border-slate-200 hover:border-purple-600 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md space-y-6"
                                        >
                                            <div className="w-14 h-14 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                <BookOpenIcon className="w-8 h-8" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black text-slate-900 uppercase">Trabajos Comerciales</h3>
                                                <p className="text-[12px] text-slate-500">
                                                    Impresión publicitaria, gigantografías, sellos, merchandising, tarjetas y diseño gráfico.
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                                Iniciar Flujo Comercial <ArrowRightIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* PASO 2: CLIENTE (SRI) */}
                            {step === 2 && missionCategory === 'SRI' && (
                                <motion.div key="s2sri" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                    <div className="space-y-1 border-b border-slate-100 pb-4">
                                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-wider">Paso 2 — Identificación</span>
                                        <h2 className="text-2xl font-black text-slate-900 uppercase">Seleccionar o Registrar Cliente SRI</h2>
                                    </div>
                                    <ClientSelector onSelect={c => { setCliente(c); if(c){setSriEstablecimiento(c.establecimientoPredeterminado || '001'); setSriPuntoEmision(c.puntoEmisionPredeterminado || '001'); setSriActividad(c.actividades || ''); setStep(3);} }} onCancel={() => setStep(1)} hideQuickButtons />
                                </motion.div>
                            )}

                            {/* PASO 2: COMERCIAL */}
                            {step === 2 && missionCategory === 'COMERCIAL' && (
                                <motion.div key="s2com" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <CommercialFlow onComplete={async data => {
                                        setLoading(true);
                                        const finalCliente = clientes.find(c => c.id === data.clienteId) || (await addCliente({ nombre: data.clienteNombre.toUpperCase(), cedula: '9999999999', regimen: 'General', direccion: 'Local' }));
                                        setCliente(finalCliente);
                                        setItems([{ nombre: data.trabajo.tipo, cantidad: data.trabajo.cantidad, precioFinal: data.trabajo.total, especificaciones: { tamano: data.trabajo.tamano } }]);
                                        setPrecio(data.trabajo.total);
                                        setAbono(data.trabajo.abono || 0);
                                        setStep(5);
                                        setLoading(false);
                                    }} onCancel={() => setStep(1)} />
                                </motion.div>
                            )}

                            {/* PASO 3: TRÁMITES SRI */}
                            {step === 3 && missionCategory === 'SRI' && cliente && (
                                <motion.div key="s3sri" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
                                    <SriSolicitudStep cliente={cliente} initialData={{ actividad: sriActividad, modo: sriMode, clave: sriClave, establecimiento: sriEstablecimiento, puntoEmision: sriPuntoEmision }} onBack={() => setStep(2)} onComplete={d => { setSriActividad(d.actividad); setSriMode(d.modo); setSriClave(d.clave); setSriEstablecimiento(d.establecimiento); setSriPuntoEmision(d.puntoEmision); setStep(4); }} />
                                </motion.div>
                            )}

                            {/* PASO 4: SERVICIOS Y PRODUCTOS (SRI) */}
                            {step === 4 && missionCategory === 'SRI' && (
                                <motion.div key="s4sri" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                    {(isAddingItem || items.length === 0) ? (
                                        !servicio ? <ServiceSelector onSelect={setServicio} regimen={cliente?.regimen} forcedCategory="SRI" /> : 
                                        <ProductConfigurator product={servicio} regimen={cliente?.regimen} onCancel={() => setServicio(null)} onComplete={c => { setItems(p => [...p, c]); setPrecio(p => p + c.precioFinal); setServicio(null); setIsAddingItem(false); }} />
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-lg flex items-center justify-center font-black">
                                                                {idx + 1}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-base font-black text-slate-900 uppercase">{item.nombre}</h4>
                                                                <p className="text-[10px] text-slate-500 font-bold uppercase">{item.cantidad} UNID | {item.especificaciones?.tamano || 'Estándar'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Subtotal</span>
                                                                <span className="text-lg font-black text-slate-900">{formatCurrency(item.precioFinal)}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => { setItems(p => p.filter((_, i) => i !== idx)); setPrecio(p => p - item.precioFinal); }}
                                                                className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setIsAddingItem(true)}
                                                className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-brand-blue rounded-xl text-slate-600 font-bold uppercase text-[11px] tracking-wider hover:bg-brand-blue/5 transition-all flex items-center justify-center gap-2"
                                            >
                                                <SparklesIcon className="w-4 h-4 text-brand-blue" /> Agregar Otro Ítem
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* PASO 5: RESUMEN Y PAGO */}
                            {step === 5 && (
                                <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full space-y-4">
                                    {error && (
                                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                                            <ExclamationTriangleIcon className="w-5 h-5 text-rose-500 shrink-0" />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                    <OrderSummary 
                                        isOpen 
                                        items={items} 
                                        total={precio} 
                                        abono={abono} 
                                        setAbono={setAbono} 
                                        client={cliente} 
                                        tempClient={tempClient}
                                        setTempClient={setTempClient}
                                        onDeploy={handleCreateOrder} 
                                        isLoading={loading} 
                                        sriData={{ claveAcceso: sriClave, estadoClave: sriClave ? 'LISTA' : 'PENDIENTE' }} 
                                        setSriData={d => setSriClave(d.claveAcceso)} 
                                        imprimirClave={imprimirClave} 
                                        setImprimirClave={setImprimirClave} 
                                        onClose={() => setStep(step - 1)} 
                                    />
                                </motion.div>
                            )}

                            {/* PASO 6: ORDEN CONFIRMADA */}
                            {step === 6 && (
                                <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 lg:p-16 rounded-2xl border border-slate-200 shadow-sm text-center space-y-8">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                                        <CheckCircleIcon className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Orden Creada Correctamente</span>
                                        <h2 className="text-3xl font-black text-slate-900 uppercase">Orden #{createdTrabajoId?.substring(0, 8)}</h2>
                                    </div>

                                    <div className="flex flex-wrap gap-4 justify-center pt-4">
                                        <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase transition-all">
                                            Ir al Dashboard
                                        </button>
                                        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-brand-blue text-white rounded-xl text-[11px] font-black uppercase transition-all shadow-blue-glow-sm">
                                            Nueva Orden
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                        </AnimatePresence>

                        {/* NAVEGACIÓN ENTRE PASOS */}
                        {step < 5 && step > 1 && (
                            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setStep(p => p - 1)}
                                    className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors"
                                >
                                    <ChevronLeftIcon className="w-4 h-4" /> Atrás
                                </button>
                                {canAdvance() && (
                                    <button
                                        onClick={() => setStep(p => p + 1)}
                                        className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-brand-blue/90 transition-all shadow-blue-glow-sm"
                                    >
                                        Siguiente Paso <ChevronRightIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {showSidebar && <TelemetrySidebar />}
                </div>

            </div>
        </div>
    );
};

export default NuevoPedidoPage;
