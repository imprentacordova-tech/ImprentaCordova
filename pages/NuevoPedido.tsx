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
    ChevronRightIcon
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
    const [configuracion, setConfiguracion] = useState<any>(null);
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
    const [quickName, setQuickName] = useState('');
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);

    // Initial state setup
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    // Validation logic for current step
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
                // Primero intentamos buscar si ya existe el Consumidor Final (9999999999)
                const existingCF = clientes.find(c => c.cedula === '9999999999');
                if (existingCF) {
                    finalCliente = existingCF;
                } else {
                    finalCliente = await addCliente({
                        nombre: (quickName || 'CONSUMIDOR FINAL').toUpperCase(),
                        cedula: '9999999999',
                        regimen: 'General',
                        direccion: 'Pasaje, El Oro'
                    });
                }
            }

            if (!finalCliente) throw new Error("No se pudo establecer un cliente para el pedido.");

            // Create multiple jobs for divided orders
            const results = await Promise.all(finalItems.map(async (item, index) => {
                return await addTrabajo({
                    titular: finalCliente!.nombre,
                    clienteId: finalCliente!.id ? finalCliente!.id : undefined,
                    servicio: item.nombre || 'Servicio General',
                    detalle: isSriOrder 
                        ? `${item.cantidad || 1}x ${item.nombre || 'DOCUMENTO SRI'} (${item.especificaciones?.tamano || 'ESTÁNDAR'})` 
                        : `${item.descripcion || ''} | ESPECIFICACIONES: ${JSON.stringify(item.especificaciones)}`,
                    cantidad: item.cantidad || 1,
                    precio: item.precioFinal || (item as any).total || 0,
                    abono: index === 0 ? abono : 0,
                    saldo: item.precioFinal - (index === 0 ? abono : 0),
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

            logActivity(
                currentUser.nombre, 
                currentUser.rol || 'Administrador', 
                'CREAR_ORDEN', 
                `Pedido (${finalItems.length} ítems) creado para ${finalCliente.nombre}`, 
                'Ventas'
            ).catch(() => {});
            
            refreshData().catch(() => {});
            setCreatedTrabajoId(results[0].id); // Use first job ID for receipts
            setStep(6); 
        } catch (err: any) {
            console.error('[NuevoPedido] Error:', err);
            setError(err.message || 'Error al procesar la orden.');
        } finally {
            setLoading(false);
        }
    };

    // --- DYNAMIC STEPS LABELS ---
    const getSteps = () => {
        if (missionCategory === 'SRI') {
            return [
                { id: 1, label: 'CATEGORÍA', icon: LayoutDashboardIcon, code: '01' },
                { id: 2, label: 'IDENTIDAD', icon: UserIcon, code: '02' },
                { id: 3, label: 'TRÁMITES', icon: ShieldCheckIcon, code: '03' },
                { id: 4, label: 'SERVICIOS', icon: BookOpenIcon, code: '04' },
                { id: 5, label: 'CAPITAL', icon: CreditCardIcon, code: '05' },
                { id: 6, label: 'DESPLIEGUE', icon: RocketLaunchIcon, code: '06' }
            ];
        }

        return [
            { id: 1, label: 'CATEGORÍA', icon: LayoutDashboardIcon, code: '01' },
            { id: 2, label: 'CATÁLOGO', icon: BookOpenIcon, code: '02' },
            { id: 3, label: 'IDENTIDAD', icon: UserIcon, code: '03' },
            { id: 4, label: 'CAPITAL', icon: CreditCardIcon, code: '04' },
            { id: 5, label: 'DESPLIEGUE', icon: RocketLaunchIcon, code: '05' }
        ];
    };

    const handleSelectCategory = (category: 'SRI' | 'COMERCIAL') => {
        setMissionCategory(category);
        setIsSidebarMinimized(false); // Expand sidebar when mission starts
        if (category === 'SRI') {
            setIsSriOrder(true);
            setOrderMode('CATALOG');
        } else if (category === 'COMERCIAL') {
            setIsSriOrder(false);
            setOrderMode('CATALOG');
        }
        setStep(2);
    };

    // --- TELEMETRY SIDEBAR COMPONENT ---
    const TelemetrySidebar = () => {
        const [logs] = useState<string[]>([]); // Added dummy logs for now or connect to a log provider

        return (
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-4 sticky top-10 space-y-4"
            >
                <div className="bg-[#050505]/95 backdrop-blur-2xl p-6 rounded-[2rem] border border-liquid-gold/20 shadow-gold-glow-soft relative overflow-hidden group">
                    {/* Scanner pulse overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-liquid-gold/5 via-transparent to-transparent opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none" />
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Status de Operación</h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-liquid-gold/50 uppercase tracking-[0.2em] mb-1">Misión</p>
                                    <p className="text-xl font-black text-white italic uppercase tracking-tighter">{missionCategory || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-liquid-gold/50 uppercase tracking-[0.2em] mb-1">Fase Actual</p>
                                    <p className="text-xl font-black text-gold-gradient italic uppercase tracking-tighter">
                                        {getSteps().find(s => s.id === step)?.label || 'IDENTIDAD'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-liquid-gold/50 uppercase tracking-[0.2em] mb-1">Protocolo</p>
                                    <p className="text-[11px] font-mono text-white/40 tracking-widest">v5.1.0_ELITE</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 text-right">
                            <div>
                                <p className="text-[9px] font-black text-liquid-gold/50 uppercase tracking-[0.2em] mb-1">Valuación Real-Time</p>
                                <p className="text-4xl font-black text-white tracking-tighter leading-none">${precio.toFixed(2)}<span className="text-xs ml-1 text-slate-500">USD</span></p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-black text-slate-500 uppercase">Ítems</p>
                                    <p className="text-xs font-black text-white">{items.length}</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                    <p className="text-[8px] font-black text-slate-500 uppercase">Abono</p>
                                    <p className="text-xs font-black text-white">${abono.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="bg-liquid-gold/10 p-3 rounded-2xl border border-liquid-gold/20 flex justify-between items-center">
                                <span className="text-[8px] font-black text-liquid-gold uppercase tracking-widest italic">Saldo Restante</span>
                                <span className="text-sm font-black text-white">${(precio - abono).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-emerald-500/50" />
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Live_Telemetry</h4>
                        </div>
                        
                        <div className="bg-black/40 rounded-2xl p-4 font-mono text-[9px] text-emerald-400/80 space-y-1 border border-white/5 h-40 overflow-y-auto custom-scrollbar">
                            <p className="text-emerald-400">[OK] SYSTEM_READY_V5.1_ELITE</p>
                            <p className="opacity-50">[LOG] MISSION_INIT: {missionCategory}</p>
                            <p className="opacity-50">[LOG] PHASE_{step}_ACTIVE</p>
                            <p className="animate-pulse">_WAITING_FOR_INPUT...</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsSidebarMinimized(true)}
                        className="w-full mt-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest transition-all"
                    >
                        Minimizar Telemetría
                    </button>
                </div>
            </motion.div>
        );
    };

    const showSidebar = !isSidebarMinimized && missionCategory && step < 5;

    return (
        <div className="elite-terminal">
            <div className="elite-viewport px-3 sm:px-6 lg:px-10 py-4">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 pb-20">
                    <div className={`space-y-4 md:space-y-8 transition-all duration-500 ${showSidebar ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
            {/* --- ELITE COMPACT STEPPER --- */}
            <div className="sticky top-0 z-[60] -mx-3 sm:mx-0 bg-black/80 backdrop-blur-3xl border-b border-white/5 py-3 md:py-4 px-4 md:px-10 flex items-center justify-between gap-6 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 md:gap-3 flex-1">
                    {getSteps().map((s, idx) => {
                        const isActive = step === s.id;
                        const isPast = step > s.id;
                        return (
                            <React.Fragment key={s.id}>
                                <div 
                                    onClick={() => isPast && setStep(s.id)}
                                    className={`flex items-center gap-2 md:gap-3 cursor-pointer group/step transition-all ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                                >
                                    <div className={`w-8 h-8 md:w-11 md:h-11 rounded-lg flex items-center justify-center transition-all duration-500 border relative overflow-hidden ${
                                        isActive ? 'bg-liquid-gold border-liquid-gold shadow-gold-glow scale-110' : isPast ? 'bg-white/10 border-liquid-gold/30 text-liquid-gold' : 'bg-white/5 border-white/10 text-slate-700'
                                    }`}>
                                        <s.icon className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isActive ? 'text-black' : isPast ? 'text-liquid-gold' : 'text-slate-800'}`} />
                                        {isActive && (
                                            <motion.div 
                                                animate={{ x: [-50, 50] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-1/2 pointer-events-none"
                                            />
                                        )}
                                    </div>
                                    <div className="hidden sm:flex flex-col">
                                        <span className={`text-[8px] font-black tracking-widest uppercase italic leading-none ${isActive ? 'text-liquid-gold' : 'text-slate-800'}`}>Step_0{s.id}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-tighter italic ${isActive ? 'text-white' : 'text-slate-600'}`}>{s.label}</span>
                                    </div>
                                </div>
                                {idx < getSteps().length - 1 && (
                                    <div className={`h-[1px] flex-1 min-w-[10px] max-w-[40px] transition-all duration-1000 ${isPast ? 'bg-liquid-gold/40' : 'bg-white/5'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
                <div className="flex items-center gap-4 border-l border-white/10 pl-6 h-10">
                    <div className="hidden lg:flex flex-col text-right">
                        <span className="text-[7px] font-mono text-slate-500 tracking-[0.3em]">SYSTEM_VERSION</span>
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest text-glow-gold">v5.1.0_ELITE</span>
                    </div>
                    <button 
                        onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 text-slate-600 hover:text-liquid-gold rounded-lg transition-all border border-white/10 flex items-center justify-center active:scale-90"
                    >
                        <SparklesIcon className={`w-5 h-5 transition-transform duration-700 ${isSidebarMinimized ? '' : 'rotate-180'}`} />
                    </button>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-start relative">
                <div className={isSidebarMinimized ? "lg:col-span-12 space-y-6 md:space-y-12 transition-all duration-500" : "lg:col-span-8 space-y-6 md:space-y-12 transition-all duration-500"}>
                    <AnimatePresence mode="wait">
                        
                        {/* Floating Telemetry Toggle (Optimized for mobile) */}
                        {isSidebarMinimized && missionCategory && step < 5 && (
                            <motion.button 
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                onClick={() => setIsSidebarMinimized(false)}
                                className="fixed right-4 bottom-24 md:right-10 md:bottom-32 z-50 p-4 md:p-6 bg-liquid-gold text-black rounded-full shadow-[0_10px_40px_rgba(212,175,55,0.4)] group overflow-hidden border-2 border-white/20 active:scale-90 transition-transform"
                            >
                                <div className="absolute inset-0 bg-white/40 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <LayoutDashboardIcon className="w-6 h-6 md:w-8 md:h-8 relative z-10" />
                                <div className="absolute -top-10 -left-10 w-20 h-20 bg-white/20 blur-2xl rounded-full" />
                            </motion.button>
                        )}
                        
                        {/* PASO 1: CATEGORÍA (Arquitectura Táctica de Alta Densidad) */}
                        {step === 1 && (
                            <motion.div 
                                key="step1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                                className="bg-black/40 backdrop-blur-[40px] p-6 sm:p-10 lg:p-16 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group/modal"
                            >
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                                
                                <div className="space-y-4 mb-10 text-center relative z-10">
                                    <div className="flex items-center justify-center gap-4 mb-1">
                                        <div className="h-px w-8 bg-gradient-to-r from-transparent to-liquid-gold/40" />
                                        <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.5em] italic">MODALIDAD_OPERATIVA_V5</p>
                                        <div className="h-px w-8 bg-gradient-to-l from-transparent to-liquid-gold/40" />
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-[-0.04em] italic leading-none">Tipo de <span className="text-gold-gradient">Misión</span></h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
                                    {/* VECTOR SRI */}
                                    <motion.button 
                                        whileHover="hover"
                                        onClick={() => handleSelectCategory('SRI')}
                                        className="group/pilar relative p-8 md:p-12 rounded-[2rem] bg-liquid-gold/5 border border-liquid-gold/10 flex flex-col items-center gap-6 transition-all duration-500 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-liquid-gold/5 opacity-0 group-hover/pilar:opacity-100 transition-opacity" />
                                        <div className="w-20 h-20 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold group-hover/pilar:bg-liquid-gold group-hover/pilar:text-black transition-all shadow-xl group-hover/pilar:shadow-gold-glow">
                                            <ShieldCheckIcon className="w-10 h-10" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl md:text-4xl font-black text-white uppercase italic leading-none">Vector <span className="text-liquid-gold">SRI</span></h3>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest max-w-[200px] mx-auto">Emisión fiscal con validación oficial en tiempo real.</p>
                                        </div>
                                        <div className="py-3 px-8 rounded-xl border border-liquid-gold/20 bg-liquid-gold/5 text-[10px] font-black text-liquid-gold group-hover/pilar:bg-liquid-gold group-hover/pilar:text-black tracking-[0.2em] uppercase transition-all italic">
                                            INICIAR PROTOCOLO
                                        </div>
                                    </motion.button>

                                    {/* VECTOR COMERCIAL */}
                                    <motion.button 
                                        whileHover="hover"
                                        onClick={() => handleSelectCategory('COMERCIAL')}
                                        className="group/pilar relative p-8 md:p-12 rounded-[2rem] bg-liquid-gold/5 border border-liquid-gold/10 flex flex-col items-center gap-6 transition-all duration-500 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-liquid-gold/5 opacity-0 group-hover/pilar:opacity-100 transition-opacity" />
                                        <div className="w-20 h-20 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold group-hover/pilar:bg-liquid-gold group-hover/pilar:text-black transition-all shadow-xl group-hover/pilar:shadow-gold-glow">
                                            <BookOpenIcon className="w-10 h-10" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <h3 className="text-2xl md:text-4xl font-black text-white uppercase italic leading-none">Artes <span className="text-liquid-gold">Comerciales</span></h3>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest max-w-[200px] mx-auto">Ventas rápidas, branding industrial y catálogo elite.</p>
                                        </div>
                                        <div className="py-3 px-8 rounded-xl border border-liquid-gold/20 bg-liquid-gold/5 text-[10px] font-black text-liquid-gold group-hover/pilar:bg-liquid-gold group-hover/pilar:text-black tracking-[0.2em] uppercase transition-all italic">
                                            DESPLEGAR CATÁLOGO
                                        </div>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* PASO 2: IDENTIDAD (SRI) o ESPECIFICACIÓN (COMERCIAL) */}
                        {step === 2 && (
                            <motion.div 
                                key="step2" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className={`${missionCategory === 'COMERCIAL' ? 'bg-transparent border-none p-0 shadow-none' : 'bg-white/[0.01] backdrop-blur-3xl p-4 sm:p-8 lg:p-10 rounded-2xl md:rounded-[3rem] border border-white/10 shadow-luxury'} relative overflow-hidden`}
                            >
                                {missionCategory === 'SRI' ? (
                                    <div className="space-y-12">
                                        <div className="space-y-4">
                                            <p className="text-[9px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] md:tracking-[0.8em] italic">ETAPA FISCAL</p>
                                            <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-[-0.04em] italic leading-none">Identidad del <span className="text-gold-gradient">Contribuyente</span></h2>
                                            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest italic">Búsqueda inteligente: Base Local → Padrón SRI → PDF → Manual</p>
                                        </div>
                                        <ClientSelector 
                                            onSelect={(c) => { 
                                                if(!c) return;
                                                setCliente(c);
                                                if (c.establecimientoPredeterminado) setSriEstablecimiento(c.establecimientoPredeterminado);
                                                if (c.puntoEmisionPredeterminado) setSriPuntoEmision(c.puntoEmisionPredeterminado);
                                                if (c.actividades) setSriActividad(c.actividades);
                                                setStep(3);
                                            }} 
                                            onCancel={() => { setStep(1); setMissionCategory(null); }}
                                            hideQuickButtons={true}
                                        />
                                    </div>
                                ) : missionCategory === 'COMERCIAL' ? (
                                    <div className="space-y-12">
                                        <CommercialFlow 
                                            onComplete={async ({ trabajo, clienteNombre, clienteTelefono, clienteId }) => {
                                                setLoading(true);
                                                try {
                                                    let finalCliente = cliente;
                                                    
                                                    // Si CommercialFlow pasó un ID, buscamos ese cliente
                                                    if (clienteId && !finalCliente) {
                                                        const found = clientes.find(c => c.id === clienteId);
                                                        if (found) finalCliente = found;
                                                    }

                                                    if (!finalCliente) {
                                                        // Intentar buscar por cédula si es Consumidor Final
                                                        const existingCF = clientes.find(c => c.cedula === '9999999999');
                                                        if (existingCF) {
                                                            finalCliente = existingCF;
                                                        } else {
                                                            finalCliente = await addCliente({
                                                                nombre: (clienteNombre || 'CONSUMIDOR FINAL').toUpperCase(),
                                                                cedula: '9999999999',
                                                                telefono: [clienteTelefono],
                                                                regimen: 'General',
                                                                direccion: 'Local'
                                                            });
                                                        }
                                                    }

                                                    setCliente(finalCliente);
                                                    
                                                    // Normalizar el trabajo comercial como un ítem de la orden
                                                    const newItem = {
                                                        nombre: trabajo.tipo || 'Servicio Comercial',
                                                        cantidad: trabajo.cantidad || 1,
                                                        precioFinal: trabajo.total || 0,
                                                        descripcion: trabajo.detalle || '',
                                                        especificaciones: {
                                                            subtipo: trabajo.subtipo,
                                                            tamano: trabajo.tamano
                                                        }
                                                    };
                                                    
                                                    setItems([newItem]);
                                                    setPrecio(trabajo.total || 0);
                                                    setAbono(trabajo.abono || 0);
                                                    setIsSriOrder(false);
                                                    setStep(5); // Ir al resumen para revisión final elite
                                                } catch (e: any) {
                                                    setError(e.message);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            onCancel={() => setStep(1)}
                                        />
                                        {error && (
                                            <div className="mt-6 text-center">
                                                <span className="text-liquid-gold text-[12px] font-black uppercase tracking-widest animate-pulse border border-liquid-gold/30 bg-liquid-gold/10 px-6 py-3 rounded-xl inline-block shadow-gold-glow">
                                                    {error}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-fade-in">
                                        <div className="space-y-12">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-4">Manifiesto de Misión</label>
                                                    <textarea 
                                                        value={detalle} onChange={e => setDetalle(e.target.value)}
                                                        placeholder="Ej: 10 Copias a color, 2 anillados..."
                                                        className="w-full h-48 p-8 bg-black/60 border-2 border-white/5 rounded-[2.5rem] text-white text-xl font-bold outline-none focus:border-liquid-gold/50 transition-all placeholder:text-slate-800 italic"
                                                    />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-4">Valor Industrial Total</label>
                                                    <div className="relative h-48 bg-black/60 border-2 border-white/5 rounded-[2.5rem] flex items-center justify-center group focus-within:border-liquid-gold/50 transition-all">
                                                        <span className="text-4xl font-black text-liquid-gold italic mr-4">$</span>
                                                        <input 
                                                            type="number" 
                                                            value={precio || ''} 
                                                            onChange={e => setPrecio(Number(e.target.value))}
                                                            placeholder="0.00"
                                                            className="bg-transparent text-6xl font-black text-white outline-none w-48 text-center placeholder:text-slate-900 italic"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                disabled={!detalle.trim() || precio <= 0}
                                                onClick={() => setStep(4)} 
                                                className="w-full py-8 bg-liquid-gold text-black font-black uppercase tracking-[0.3em] rounded-3xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-6 shadow-gold-glow disabled:opacity-20 italic"
                                            >
                                                Sincronizar con Caja <ArrowRightIcon className="w-6 h-6"/>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* PASO 3: SOLICITUD (SRI) o ESPECIFICACIÓN (OTRO) */}
                        {step === 3 && (
                            <motion.div 
                                key="step3" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-4 sm:p-8 lg:p-10 rounded-2xl md:rounded-[3rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                {missionCategory === 'SRI' ? (
                                    cliente && (
                                        <SriSolicitudStep 
                                            cliente={cliente}
                                            initialData={{
                                                actividad: sriActividad,
                                                modo: sriMode,
                                                clave: sriClave,
                                                establecimiento: sriEstablecimiento,
                                                puntoEmision: sriPuntoEmision
                                            }}
                                            onBack={() => setStep(2)}
                                            onComplete={(data) => {
                                                setSriActividad(data.actividad);
                                                setSriMode(data.modo);
                                                setSriClave(data.clave);
                                                setSriEstablecimiento(data.establecimiento);
                                                setSriPuntoEmision(data.puntoEmision);
                                                setStep(4);
                                            }}
                                        />
                                    )
                                ) : (
                                    <div className="space-y-12">
                                        <div className="space-y-4">
                                            <p className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.8em] italic">ESPECIFICACIÓN COMERCIAL</p>
                                            <h2 className="text-6xl font-black text-white uppercase tracking-[-0.04em] italic leading-none">Detalles del <span className="text-gold-gradient">Trabajo</span></h2>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                            <div className="space-y-8">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-2">¿Qué estamos fabricando?</label>
                                                    <textarea 
                                                        value={detalle}
                                                        onChange={e => setDetalle(e.target.value)}
                                                        placeholder="Describe las especificaciones técnicas..."
                                                        className="w-full h-48 bg-black/40 border-2 border-white/10 rounded-[2rem] p-8 text-white font-bold outline-none focus:border-liquid-gold transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-8">
                                                <PriceCalculatorDisplay onSelectPrice={setPrecio} currentPrice={precio} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div 
                                key="step4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-4 sm:p-8 lg:p-10 rounded-2xl md:rounded-[3rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                                {missionCategory === 'SRI' ? (
                                    <div className="space-y-12">
                                        {(isAddingItem || items.length === 0) ? (
                                            !servicio ? (
                                                <ServiceSelector 
                                                    onSelect={setServicio} 
                                                    selectedId={servicio?.id} 
                                                    regimen={cliente?.regimen} 
                                                    forcedCategory="SRI"
                                                />
                                            ) : (
                                                <ProductConfigurator 
                                                    product={servicio} 
                                                    onCancel={() => {setServicio(null); setIsAddingItem(false);}}
                                                    regimen={cliente?.regimen}
                                                    onComplete={(config) => {
                                                        setItems(prev => [...prev, config]);
                                                        setPrecio(prev => prev + config.precioFinal);
                                                        setServicio(null);
                                                        setIsAddingItem(false);
                                                    }}
                                                />
                                            )
                                        ) : (
                                            <div className="space-y-10">
                                                <div className="grid grid-cols-1 gap-6">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="bg-black/60 p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group/item hover:border-liquid-gold/30 transition-all">
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-14 h-14 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold border border-liquid-gold/20 font-black italic relative overflow-hidden">
                                                                    <div className="absolute inset-0 bg-liquid-gold/5 animate-pulse" />
                                                                    <span className="relative z-10">{idx + 1}</span>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-[13px] font-black uppercase tracking-tight italic text-white group-hover:text-liquid-gold transition-colors">{item.nombre}</h4>
                                                                    <div className="flex gap-4 mt-1">
                                                                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">QTY: {item.cantidad}</span>
                                                                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">SPEC: {item.especificaciones.tamano}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-10">
                                                                <div className="text-right">
                                                                    <p className="text-[8px] text-slate-700 font-black uppercase tracking-widest mb-1">Valuación</p>
                                                                    <span className="text-2xl font-black text-white italic tracking-tighter">${item.precioFinal.toFixed(2)}</span>
                                                                </div>
                                                                <button onClick={() => {
                                                                    setItems(prev => prev.filter((_, i) => i !== idx));
                                                                    setPrecio(prev => prev - item.precioFinal);
                                                                }} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-700 hover:bg-orange-950 hover:text-white transition-all transform hover:rotate-90">
                                                                    <SolidBoxIcon className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button 
                                                    onClick={() => setIsAddingItem(true)}
                                                    className="w-full py-6 border-2 border-dashed border-liquid-gold/10 rounded-3xl text-slate-600 font-black uppercase tracking-[0.4em] hover:border-liquid-gold/30 hover:text-liquid-gold transition-all italic flex items-center justify-center gap-4 group"
                                                >
                                                    <SparklesIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                                    Agregar Otro Producto Fiscal
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* COBRO (EXPRESS/COMERCIAL) */
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-10">
                                            <div className="space-y-4 mb-10">
                                                <p className="text-[9px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] md:tracking-[0.8em] italic">ETAPA FINANCIERA</p>
                                                <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Cierre de <span className="text-gold-gradient">Caja</span></h2>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-2">Abono Inicial</label>
                                                <div className="relative">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 text-3xl font-black italic">$</span>
                                                    <input type="number" value={abono} onChange={e => setAbono(Number(e.target.value))} className="w-full bg-black/60 border-2 border-white/5 pl-14 py-8 rounded-[2rem] text-4xl font-black text-emerald-500 outline-none focus:border-emerald-500/30 italic" />
                                                </div>
                                            </div>
                                            <div className="bg-liquid-gold/10 p-8 rounded-[2.5rem] flex justify-between items-center border border-liquid-gold/20">
                                                <span className="text-[10px] text-liquid-gold font-black uppercase tracking-widest">Saldo Pendiente</span>
                                                <span className="text-4xl font-black text-white italic tracking-tighter">${Math.max(0, precio - abono).toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-2">Referencia Visual</label>
                                            <PhotoCapture onImageCaptured={setImageFile} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* PASO 5: COBRO / RESUMEN ELITE */}
                        {step === 5 && (
                            <OrderSummary
                                isOpen={true}
                                onClose={() => setStep(step - 1)}
                                items={items}
                                total={precio}
                                abono={abono}
                                setAbono={setAbono}
                                client={cliente}
                                onDeploy={handleCreateOrder}
                                isLoading={loading}
                                sriData={{
                                    claveAcceso: sriClave,
                                    actividadSeleccionada: sriActividad,
                                    establecimiento: sriEstablecimiento,
                                    puntoEmision: sriPuntoEmision,
                                    estadoClave: sriClave ? 'LISTA' : 'PENDIENTE'
                                }}
                                setSriData={(data: any) => {
                                    if (data.claveAcceso !== undefined) setSriClave(data.claveAcceso);
                                    if (data.actividadSeleccionada !== undefined) setSriActividad(data.actividadSeleccionada);
                                    if (data.establecimiento !== undefined) setSriEstablecimiento(data.establecimiento);
                                    if (data.puntoEmision !== undefined) setSriPuntoEmision(data.puntoEmision);
                                }}
                                imprimirClave={imprimirClave}
                                setImprimirClave={setImprimirClave}
                            />
                        )}

                        {/* PASO 6: FINALIZADO - ELITE MISSION COMPLETE */}
                        {step === 6 && (
                            <motion.div 
                                key="step6_final" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-950/20 backdrop-blur-3xl p-8 md:p-20 rounded-[3rem] md:rounded-[4rem] border border-emerald-500/10 text-center space-y-10 md:space-y-12 shadow-luxury relative overflow-hidden"
                            >
                                {/* Scanning Beam Success */}
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/20 animate-scan pointer-events-none" />
                                
                                <div className="relative z-10 space-y-8">
                                    <div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)] mb-4 relative">
                                        <CheckCircleIcon className="w-12 h-12 md:w-16 md:h-16 text-white" />
                                        <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping"></div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <p className="text-emerald-400 font-black uppercase tracking-[0.6em] text-[10px] italic">MISIÓN_EJECUTADA_SATISFACTORIAMENTE</p>
                                        <h2 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none">Despliegue <span className="text-emerald-500">Exitoso</span></h2>
                                        <div className="flex items-center justify-center gap-4 text-slate-400">
                                            <div className="h-[1px] w-12 bg-white/10"></div>
                                            <p className="text-sm md:text-lg font-mono tracking-widest text-emerald-500/60 uppercase">Protocolo #{createdTrabajoId?.substring(0, 8)}</p>
                                            <div className="h-[1px] w-12 bg-white/10"></div>
                                        </div>
                                    </div>

                                    {/* Mission Summary Cards (Elite Style) */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                                        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl md:rounded-[2rem] text-left space-y-2 group hover:border-emerald-500/20 transition-all">
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">TITULAR_REGISTRADO</p>
                                            <p className="text-white font-black uppercase italic truncate">{cliente?.nombre || 'CONSUMIDOR FINAL'}</p>
                                            <p className="text-[10px] text-emerald-500/40 font-mono">STATUS: SYNCED</p>
                                        </div>
                                        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl md:rounded-[2rem] text-left space-y-2 group hover:border-emerald-500/20 transition-all">
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">INVERSIÓN_FINAL</p>
                                            <p className="text-liquid-gold font-black text-2xl italic tabular-nums">{formatCurrency(items.reduce((acc, it) => acc + it.precioFinal, 0))}</p>
                                            <p className="text-[10px] text-emerald-500/40 font-mono">PAYMENT: CAPTURED</p>
                                        </div>
                                        <div className="bg-black/40 border border-white/5 p-6 rounded-2xl md:rounded-[2rem] text-left space-y-2 group hover:border-emerald-500/20 transition-all">
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">CRONOGRAMA</p>
                                            <p className="text-white font-black uppercase italic">{prioridad === 'Urgente' ? 'Prioridad 24H' : 'Estándar 48H'}</p>
                                            <p className="text-[10px] text-emerald-500/40 font-mono">LOGISTICS: READY</p>
                                        </div>
                                    </div>

                                    {/* Conditional Print Actions */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto pt-6">
                                        {createdTrabajoId && (
                                            missionCategory === 'SRI' ? (
                                                <>
                                                    <button 
                                                        onClick={() => window.open(`/#/solicitud-impresion/${createdTrabajoId}?format=a5`, '_blank')} 
                                                        className="px-8 py-6 bg-liquid-gold text-black rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-gold-glow hover:scale-105 active:scale-95 transition-all italic"
                                                    >
                                                        <PrinterIcon className="w-5 h-5" /> SRI (A5 DOBLE)
                                                    </button>
                                                    <button 
                                                        onClick={() => window.open(`/#/solicitud-impresion/${createdTrabajoId}?format=a4`, '_blank')} 
                                                        className="px-8 py-6 bg-white/5 text-white border-2 border-liquid-gold/30 rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-liquid-gold/20 active:scale-95 transition-all italic"
                                                    >
                                                        <PrinterIcon className="w-5 h-5" /> SRI (A4 FULL)
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => window.open(`/#/recibo-epson/${createdTrabajoId}`, '_blank')} 
                                                    className="col-span-2 px-10 py-6 bg-white text-black rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-luxury hover:scale-105 active:scale-95 transition-all italic"
                                                >
                                                    <PrinterIcon className="w-5 h-5" /> Imprimir Recibo Térmico
                                                </button>
                                            )
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-white/5">
                                        <button onClick={() => navigate('/dashboard')} className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all italic text-[10px]">Ir al Centro de Mando</button>
                                        <button onClick={() => window.location.reload()} className="px-10 py-5 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all italic text-[10px]">Nueva Orden de Manufactura</button>
                                    </div>
                                    </div>
                                </motion.div>
                        )}
                    </AnimatePresence>

                    {/* CONTROLES DE NAVEGACIÓN - ELITE TACTICAL */}
                    {missionCategory !== 'COMERCIAL' && ((missionCategory === 'SRI' && step < 6) || (missionCategory !== 'SRI' && step < 5)) && (
                        <div className="flex justify-between items-center px-4 md:px-10 mt-6 md:mt-10 border-t border-white/5 pt-8">
                            <button 
                                disabled={step === 1}
                                onClick={() => {
                                    if (orderMode === 'EXPRESS' && step === 4) setStep(2);
                                    else if (missionCategory === 'SRI' && step === 5) setStep(4);
                                    else setStep(s => s - 1);
                                }}
                                className="flex items-center gap-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-white disabled:opacity-0 transition-all italic"
                            >
                                <ArrowRightIcon className="w-4 h-4 rotate-180" /> REGRESAR
                            </button>
                            
                            <div className="flex items-center gap-6">
                                {error && (
                                    <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                        <span className="text-red-500 text-[8px] font-black uppercase tracking-widest animate-pulse">ALERTA: {error}</span>
                                    </div>
                                )}
                                {((missionCategory === 'SRI' && step < 5) || (orderMode === 'EXPRESS' && step < 2)) ? (
                                    <button 
                                        disabled={!canAdvance()}
                                        onClick={() => {
                                            if (orderMode === 'EXPRESS' && step === 2) setStep(4);
                                            else setStep(s => s + 1);
                                        }}
                                        className="bg-white text-black px-12 md:px-16 py-5 md:py-6 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-liquid-gold transition-all disabled:opacity-20 flex items-center gap-4 group italic shadow-luxury"
                                    >
                                        Siguiente Fase <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </button>
                                ) : (step === 4 && missionCategory !== 'SRI') || (step === 5 && missionCategory === 'SRI') ? (
                                    <button 
                                        disabled={!canAdvance() || loading}
                                        onClick={handleCreateOrder}
                                        className="bg-liquid-gold text-black px-16 md:px-20 py-6 md:py-7 rounded-2xl md:rounded-3xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] shadow-gold-glow-strong hover:scale-105 transition-all flex items-center gap-5 italic"
                                    >
                                        {loading ? <Loader2Icon className="animate-spin w-5 h-5" /> : <RocketLaunchIcon className="w-6 h-6" />}
                                        {loading ? 'DESPLEGANDO...' : 'EJECUTAR MISIÓN'}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    )}
                    </div>

                    {/* --- SIDEBAR TELEMETRÍA ELITE --- */}
                    {showSidebar && (
                        <TelemetrySidebar />
                    )}
                </div>
            </div>
        </div>
    </div>
</div>
    );
};

export default NuevoPedidoPage;
