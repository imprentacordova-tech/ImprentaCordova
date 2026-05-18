import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { useData } from '../contexts/DataContext';
import { logActivity } from '../services/activityLogService';
import { Cliente, User, TrabajoEstado } from '../types';
import { 
    CheckCircleIcon, Loader2Icon, SolidBoxIcon, 
    ArrowRightIcon, ShoppingCartIcon, ShieldCheckIcon,
    SparklesIcon, CpuIcon, CreditCardIcon, UserIcon,
    PrinterIcon, ClockIcon, BoltIcon, RocketLaunchIcon,
    ExclamationTriangleIcon, LayoutDashboardIcon, BookOpenIcon, ZapIcon,
    ChevronRightIcon, ChevronLeftIcon
} from '../components/Icons';
import ClientSelector from '../components/orders/ClientSelector';
import ServiceSelector from '../components/orders/ServiceSelector';
import ProductConfigurator from '../components/orders/ProductConfigurator';
import PhotoCapture from '../components/orders/PhotoCapture';
import PriceCalculatorDisplay from '../components/orders/PriceCalculatorDisplay';
import { CommercialFlow } from '../components/orders/CommercialFlow';
import SriSolicitudStep from '../components/orders/SriSolicitudStep';
import OrderSummary from '../components/orders/OrderSummary';
import { motion, AnimatePresence } from 'framer-motion';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { refreshData, addTrabajo, addCliente, clientes } = useData();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [missionCategory, setMissionCategory] = useState<'SRI' | 'COMERCIAL' | null>(null);
    const [orderMode, setOrderMode] = useState<'CATALOG' | 'EXPRESS' | null>(null);
    const [loading, setLoading] = useState(false);
    const [cliente, setCliente] = useState<Cliente | null>(null);
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
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
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
            let finalCliente = cliente;
            if (!finalCliente) {
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
                    responsable: currentUser.nombre,
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
                }, currentUser.nombre, imageFile);
            }));

            logActivity(currentUser.nombre, currentUser.rol || 'Administrador', 'CREAR_ORDEN', `Pedido (${finalItems.length} ítems) creado para ${finalCliente.nombre}`, 'Ventas').catch(() => {});
            refreshData().catch(() => {});
            setCreatedTrabajoId(results[0].id);
            setStep(6); 
            
            if (isSriOrder) {
                setTimeout(() => window.open(`/#/solicitud-impresion/${results[0].id}?format=a5`, '_blank'), 800);
            } else {
                setTimeout(() => window.open(`/#/recibo-epson/${results[0].id}`, '_blank'), 800);
            }
        } catch (err: any) {
            console.error('[NuevoPedido] Error:', err);
            setError(err.message || 'Error al procesar la orden.');
        } finally {
            setLoading(false);
        }
    };

    const getSteps = () => {
        if (missionCategory === 'SRI') {
            return [
                { id: 1, label: 'CATEGORÍA', icon: LayoutDashboardIcon },
                { id: 2, label: 'IDENTIDAD', icon: UserIcon },
                { id: 3, label: 'TRÁMITES', icon: ShieldCheckIcon },
                { id: 4, label: 'SERVICIOS', icon: BookOpenIcon },
                { id: 5, label: 'CAPITAL', icon: CreditCardIcon },
                { id: 6, label: 'DESPLIEGUE', icon: RocketLaunchIcon }
            ];
        }
        return [
            { id: 1, label: 'CATEGORÍA', icon: LayoutDashboardIcon },
            { id: 2, label: 'CATÁLOGO', icon: BookOpenIcon },
            { id: 3, label: 'IDENTIDAD', icon: UserIcon },
            { id: 4, label: 'CAPITAL', icon: CreditCardIcon },
            { id: 5, label: 'DESPLIEGUE', icon: RocketLaunchIcon }
        ];
    };

    const handleSelectCategory = (category: 'SRI' | 'COMERCIAL') => {
        setMissionCategory(category);
        setIsSidebarMinimized(false);
        setIsSriOrder(category === 'SRI');
        setOrderMode('CATALOG');
        setStep(2);
    };

    const TelemetrySidebar = () => (
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 sticky top-10 space-y-6">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-slate-50/50 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-brand-blue/20" />
                
                <div className="space-y-8 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse shadow-lg shadow-brand-blue/20" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">RESUMEN DE ORDEN</h3>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-500 tracking-wider">SISTEMA EN LÍNEA</span>
                    </div>
                    
                    <div className="space-y-12">
                        <div className="relative">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">TIPO DE SOLICITUD</p>
                            <p className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none flex items-center gap-4">
                                <span className="w-1 h-8 bg-brand-blue rounded-full" />
                                {missionCategory === 'COMERCIAL' ? 'COMERCIAL' : (missionCategory || 'EN ESPERA')}
                            </p>
                        </div>
                        
                        <div className="pt-8 border-t border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">MONTO TOTAL</p>
                            <div className="flex items-baseline gap-4">
                                <span className="text-6xl font-black text-brand-blue tracking-tight leading-none tabular-nums">${precio.toFixed(2)}</span>
                                <span className="text-lg font-bold text-slate-400 uppercase">USD</span>
                            </div>
                            <div className="flex items-center gap-4 mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <CreditCardIcon className="w-4 h-4 text-slate-500" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Saldo Pendiente: ${(precio - abono).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-10 border-t border-slate-100">
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 transition-all">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">PRODUCTOS</p>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-slate-900 leading-none">{items.length}</p>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ÍTEMS</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 transition-all">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">ABONO INICIAL</p>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-emerald-600 leading-none">${abono.toFixed(0)}</p>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PAGADO</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 space-y-5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ESTADO DEL PROCESO</h4>
                            <div className="flex gap-1">
                                {[1,2,3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${step >= i*2 ? 'bg-brand-blue' : 'bg-slate-200'}`} />)}
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-[2rem] p-6 text-[11px] font-bold text-slate-500 space-y-3 border border-slate-100">
                            <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                                <span>Orden Iniciada</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {missionCategory ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full" />}
                                <span>Categoría Seleccionada</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {items.length > 0 ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full" />}
                                <span>Productos Agregados</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {step >= 5 ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <div className="w-4 h-4 border-2 border-slate-300 rounded-full" />}
                                <span>Confirmación Final</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsSidebarMinimized(true)} 
                        className="w-full mt-6 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-all hover:text-brand-blue"
                    >
                        OCULTAR RESUMEN
                    </button>
                </div>
            </div>
        </motion.div>
    );

    const showSidebar = !isSidebarMinimized && missionCategory && step < 5;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="px-4 sm:px-8 lg:px-12 py-10">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className={`space-y-10 transition-all duration-700 ${showSidebar ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                        {/* --- STEPPER ELITE --- */}
                        <div className="sticky top-4 z-[100] bg-white/90 backdrop-blur-3xl border border-slate-200 rounded-[2.5rem] py-5 px-10 flex items-center justify-between gap-10 shadow-xl overflow-hidden">
                            <div className="absolute inset-0 bg-brand-blue/5 opacity-10 pointer-events-none" />
                            <div className="flex items-center gap-4 flex-1">
                                {getSteps().map((s, idx) => {
                                    const isActive = step === s.id;
                                    const isPast = step > s.id;
                                    return (
                                        <React.Fragment key={s.id}>
                                            <div onClick={() => isPast && setStep(s.id)} className={`flex items-center gap-4 cursor-pointer transition-all ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 border-2 relative ${
                                                    isActive ? 'bg-brand-blue border-brand-blue shadow-lg shadow-brand-blue/20 scale-110' : isPast ? 'bg-brand-blue/5 border-brand-blue/20 text-brand-blue' : 'bg-slate-50 border-slate-200 text-slate-300'
                                                }`}>
                                                    <s.icon className={`w-6 h-6 ${isActive ? 'text-white' : isPast ? 'text-brand-blue' : 'text-slate-400'}`} />
                                                    {isActive && <motion.div animate={{ x: [-60, 60] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 bg-white/30 w-1/3 -skew-x-12" />}
                                                </div>
                                                <div className="hidden xl:flex flex-col">
                                                    <span className={`text-[8px] font-black tracking-widest uppercase ${isActive ? 'text-brand-blue' : 'text-slate-400'}`}>PASO 0{s.id}</span>
                                                    <span className={`text-[11px] font-bold uppercase tracking-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                                                </div>
                                            </div>
                                            {idx < getSteps().length - 1 && <div className={`h-[2px] flex-1 min-w-[10px] max-w-[40px] rounded-full transition-all duration-1000 ${isPast ? 'bg-brand-blue/30' : 'bg-slate-100'}`} />}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-8 border-l border-slate-100 pl-10">
                                <button onClick={() => setIsSidebarMinimized(!isSidebarMinimized)} className="w-14 h-14 bg-slate-50 hover:bg-brand-blue hover:text-white rounded-2xl transition-all border border-slate-200 flex items-center justify-center group active:scale-90">
                                    <SparklesIcon className={`w-7 h-7 transition-transform duration-700 ${isSidebarMinimized ? '' : 'rotate-180'}`} />
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="s1" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white p-12 md:p-32 rounded-[5rem] border border-slate-200 shadow-luxury text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-brand-blue/5 opacity-5 pointer-events-none" />
                                    <div className="space-y-8 mb-24 relative z-10">
                                        <div className="flex items-center justify-center gap-6">
                                            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-brand-blue/30" />
                                            <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">NUEVO PEDIDO</p>
                                            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-brand-blue/30" />
                                        </div>
                                        <h2 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tight leading-none">TIPO DE <span className="text-brand-blue">ORDEN</span></h2>
                                        <p className="text-slate-500 font-medium text-sm uppercase tracking-widest">Seleccione el flujo de trabajo correspondiente</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-7xl mx-auto relative z-10">
                                        {[
                                            { id: 'SRI', label: 'Facturación SRI', desc: 'Documentos fiscales autorizados por el SRI', icon: ShieldCheckIcon, color: 'bg-blue-600' },
                                            { id: 'COMERCIAL', label: 'Trabajos Comerciales', desc: 'Diseño, gigantografías, sellos y afines', icon: BookOpenIcon, color: 'bg-indigo-600' }
                                        ].map((cat) => (
                                            <div 
                                                key={cat.id}
                                                onClick={() => handleSelectCategory(cat.id as any)}
                                                className="group relative bg-white p-12 rounded-[3.5rem] border border-slate-200 hover:border-brand-blue transition-all duration-700 cursor-pointer overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-brand-blue/10"
                                            >
                                                <div className={`absolute top-0 right-0 w-40 h-40 ${cat.color} opacity-[0.03] blur-[80px] group-hover:opacity-[0.15] transition-opacity`} />
                                                <div className="relative z-10 space-y-10">
                                                    <div className={`w-24 h-24 rounded-3xl ${cat.color} flex items-center justify-center text-white shadow-2xl transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6`}>
                                                        <cat.icon className="w-12 h-12" />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{cat.label}</h3>
                                                        <p className="text-slate-500 font-medium text-sm">{cat.desc}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-brand-blue uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                                        INICIAR PROCESO <ArrowRightIcon className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && missionCategory === 'SRI' && (
                                <motion.div key="s2sri" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-xl space-y-12">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">INFORMACIÓN DEL CLIENTE</p>
                                        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Perfil del Contribuyente</h2>
                                    </div>
                                    <ClientSelector onSelect={c => { setCliente(c); if(c){setSriEstablecimiento(c.establecimientoPredeterminado || '001'); setSriPuntoEmision(c.puntoEmisionPredeterminado || '001'); setSriActividad(c.actividades || ''); setStep(3);} }} onCancel={() => setStep(1)} hideQuickButtons />
                                </motion.div>
                            )}

                            {step === 2 && missionCategory === 'COMERCIAL' && (
                                <motion.div key="s2com" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
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

                            {step === 3 && missionCategory === 'SRI' && cliente && (
                                <motion.div key="s3sri" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-xl">
                                    <SriSolicitudStep cliente={cliente} initialData={{ actividad: sriActividad, modo: sriMode, clave: sriClave, establecimiento: sriEstablecimiento, puntoEmision: sriPuntoEmision }} onBack={() => setStep(2)} onComplete={d => { setSriActividad(d.actividad); setSriMode(d.modo); setSriClave(d.clave); setSriEstablecimiento(d.establecimiento); setSriPuntoEmision(d.puntoEmision); setStep(4); }} />
                                </motion.div>
                            )}

                            {step === 4 && missionCategory === 'SRI' && (
                                <motion.div key="s4sri" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-xl space-y-12">
                                    {(isAddingItem || items.length === 0) ? (
                                        !servicio ? <ServiceSelector onSelect={setServicio} regimen={cliente?.regimen} forcedCategory="SRI" /> : 
                                        <ProductConfigurator product={servicio} regimen={cliente?.regimen} onCancel={() => setServicio(null)} onComplete={c => { setItems(p => [...p, c]); setPrecio(p => p + c.precioFinal); setServicio(null); setIsAddingItem(false); }} />
                                    ) : (
                                        <div className="space-y-10">
                                            <div className="space-y-4">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 flex items-center justify-between group hover:border-brand-blue/30 transition-all">
                                                        <div className="flex items-center gap-8">
                                                            <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue font-black border border-brand-blue/20">{idx + 1}</div>
                                                            <div className="space-y-1">
                                                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{item.nombre}</h4>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.cantidad} UNID | {item.especificaciones.tamano}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-12">
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valuación</p>
                                                                <span className="text-3xl font-black text-slate-900 tabular-nums">${item.precioFinal.toFixed(2)}</span>
                                                            </div>
                                                            <button onClick={() => { setItems(p => p.filter((_, i) => i !== idx)); setPrecio(p => p - item.precioFinal); }} className="p-4 bg-slate-200/50 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><SolidBoxIcon className="w-5 h-5" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => setIsAddingItem(true)} className="w-full py-8 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-500 font-bold uppercase tracking-widest text-sm hover:text-brand-blue hover:border-brand-blue hover:bg-brand-blue/5 transition-all flex items-center justify-center gap-4 group">
                                                <SparklesIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" /> AGREGAR SERVICIO / PRODUCTO
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 5 && (
                                <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
                                    <OrderSummary isOpen items={items} total={precio} abono={abono} setAbono={setAbono} client={cliente} onDeploy={handleCreateOrder} isLoading={loading} sriData={{ claveAcceso: sriClave, estadoClave: sriClave ? 'LISTA' : 'PENDIENTE' }} setSriData={d => setSriClave(d.claveAcceso)} imprimirClave={imprimirClave} setImprimirClave={setImprimirClave} onClose={() => setStep(step - 1)} />
                                </motion.div>
                            )}

                            {step === 6 && (
                                <motion.div key="s6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-16 md:p-32 rounded-[5rem] border border-slate-200 shadow-2xl text-center space-y-16 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/20" />
                                    <div className="space-y-10 relative z-10">
                                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 mb-6"><CheckCircleIcon className="w-12 h-12 text-white" /></div>
                                        <div className="space-y-3">
                                            <p className="text-emerald-600 font-bold uppercase tracking-widest text-[11px]">PROCESO FINALIZADO</p>
                                            <h2 className="text-5xl md:text-7xl font-black text-slate-900 uppercase tracking-tight leading-none">ORDEN <span className="text-emerald-600">CONFIRMADA</span></h2>
                                            <p className="text-slate-500 font-medium text-sm uppercase tracking-widest mt-2">ID DE PEDIDO: {createdTrabajoId?.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-10 border-t border-slate-100">
                                        {missionCategory === 'SRI' ? (
                                            <>
                                                <button onClick={() => window.open(`/#/solicitud-impresion/${createdTrabajoId}?format=a5`, '_blank')} className="py-6 bg-brand-blue hover:bg-brand-blue-dark transition-colors text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-4 text-sm"><PrinterIcon className="w-5 h-5" /> IMPRIMIR A5 (DOBLE)</button>
                                                <button onClick={() => window.open(`/#/solicitud-impresion/${createdTrabajoId}?format=a4`, '_blank')} className="py-6 bg-white hover:bg-slate-50 transition-colors text-brand-blue border border-brand-blue/30 rounded-[2rem] font-bold uppercase tracking-widest flex items-center justify-center gap-4 text-sm"><PrinterIcon className="w-5 h-5" /> IMPRIMIR A4 (FULL)</button>
                                            </>
                                        ) : <button onClick={() => window.open(`/#/recibo-epson/${createdTrabajoId}`, '_blank')} className="col-span-2 py-6 bg-slate-900 hover:bg-black transition-colors text-white rounded-[2rem] font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-4 text-sm"><PrinterIcon className="w-5 h-5" /> IMPRIMIR RECIBO TÉRMICO</button>}
                                    </div>
                                    <div className="flex gap-6 justify-center pt-10">
                                        <button onClick={() => navigate('/dashboard')} className="px-10 py-5 bg-white hover:bg-slate-50 text-slate-500 font-bold uppercase tracking-widest text-sm rounded-2xl border border-slate-200 transition-all">VOLVER AL INICIO</button>
                                        <button onClick={() => window.location.reload()} className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition-all">NUEVO PEDIDO</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* NAVEGACIÓN GLOBAL */}
                        {step < 5 && step > 1 && (
                            <div className="flex justify-between items-center px-10 pt-10 border-t border-slate-100">
                                <button onClick={() => setStep(p => p - 1)} className="flex items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-brand-blue transition-all"><ChevronLeftIcon className="w-4 h-4" /> VOLVER</button>
                                {canAdvance() && (
                                    <button onClick={() => setStep(p => p + 1)} className="px-12 py-5 bg-brand-blue text-white rounded-[1.5rem] font-bold uppercase tracking-widest text-[12px] hover:bg-brand-blue-dark transition-all shadow-lg shadow-brand-blue/20 flex items-center gap-4 group">
                                        SIGUIENTE PASO <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
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
