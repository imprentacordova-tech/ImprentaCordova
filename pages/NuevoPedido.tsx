import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
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
import { SriIdentityFlow } from '../components/orders/SriIdentityFlow';
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

    // Auto-scroll logic
    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTo(0, 0);
    }, [step, servicio, missionCategory]);

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
                    precio: item.precioFinal,
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
            setStep(isSriOrder ? 6 : 5); 
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
    const TelemetrySidebar = () => (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 sticky top-10 space-y-6"
        >
            {/* Mission Identity Card */}
            <div className="bg-black/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                    <CpuIcon className="w-8 h-8 text-liquid-gold animate-pulse" />
                </div>
                
                <div className="space-y-6 relative z-10">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-liquid-gold uppercase tracking-[0.3em] italic opacity-60">Status de Operación</p>
                        <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">Misión: <span className="text-liquid-gold">{missionCategory || 'PENDIENTE'}</span></h4>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-liquid-gold/20 via-transparent to-transparent" />

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fase Actual</span>
                            <span className="text-[10px] font-black text-white uppercase italic bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{getSteps().find(s => s.id === step)?.label || 'IDENTIDAD'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Protocolo</span>
                            <span className="text-[10px] font-black text-liquid-gold uppercase italic">v5.0_ELITE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Telemetry */}
            <div className="bg-liquid-gold/5 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-liquid-gold/10 shadow-gold-glow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="space-y-6 relative z-10">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-liquid-gold uppercase tracking-[0.3em] italic opacity-60">Valuación Real-Time</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white italic tracking-tighter">${precio.toFixed(2)}</span>
                                <span className="text-[10px] font-black text-liquid-gold/60 uppercase italic">USD</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ítems</p>
                            <span className="text-xl font-black text-white italic">{items.length || (missionCategory === 'EXPRESS' ? '1' : '0')}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <span>Abono</span>
                            <span className="text-emerald-500">${abono.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: precio > 0 ? `${Math.min(100, (abono/precio)*100)}%` : '0%' }}
                                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <span>Saldo Restante</span>
                            <span className="text-white">${Math.max(0, precio - abono).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Manifiesto de Ítems */}
            {items.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6"
                >
                    <div className="flex justify-between items-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Manifiesto de Ítems</p>
                        <span className="text-[9px] font-mono text-liquid-gold/40">SEC_LOG_0x{items.length}</span>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {items.map((item, idx) => (
                            <div key={idx} className="bg-black/40 p-4 rounded-2xl border border-white/5 group hover:border-liquid-gold/20 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="text-[10px] font-black text-white uppercase italic tracking-tight">{item.nombre}</h5>
                                    <span className="text-[8px] font-black text-liquid-gold bg-liquid-gold/10 px-2 py-0.5 rounded">x{item.cantidad}</span>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <span className="text-[7px] text-slate-600 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">SPEC: {item.especificaciones?.tamano || 'N/A'}</span>
                                    <div className="h-px flex-1 bg-white/5" />
                                    <span className="text-[10px] font-black text-white/80 italic">${item.precioFinal.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Total Sincronizado</span>
                        <span className="text-xl font-black text-liquid-gold italic">${precio.toFixed(2)}</span>
                    </div>
                </motion.div>
            )}

            {/* Entity Context */}
            {cliente && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-black/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/10 shadow-luxury space-y-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/5 blur-3xl pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                            <UserIcon className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Titular del Protocolo</p>
                            <p className="text-sm font-black text-white uppercase italic tracking-tighter truncate w-full">{cliente.nombre}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[7px] text-slate-600 font-black uppercase tracking-widest mb-1">Identificación</p>
                            <p className="text-[10px] font-mono font-black text-liquid-gold">{cliente.cedula || cliente.ruc}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[7px] text-slate-600 font-black uppercase tracking-widest mb-1">Régimen</p>
                            <p className="text-[10px] font-black text-emerald-500 uppercase italic">{cliente.regimen || 'GENERAL'}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Mini Terminal Logs */}
            <div className="bg-black/60 p-6 rounded-[2rem] border border-white/5 font-mono text-[8px] space-y-2 max-h-[150px] overflow-hidden opacity-40 hover:opacity-100 transition-opacity cursor-default group">
                <div className="flex items-center gap-2 mb-4 text-liquid-gold/40 group-hover:text-liquid-gold transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse" />
                    <span className="font-black uppercase tracking-[0.2em]">Live_Telemetry</span>
                </div>
                <div className="space-y-1.5">
                    <p className="text-emerald-500/80">[OK] SYSTEM_READY_V5.0</p>
                    {missionCategory && <p className="text-white/60">[LOG] MISSION_INIT: {missionCategory}</p>}
                    {step > 1 && <p className="text-white/60">[LOG] PHASE_STEP_{step}_ACTIVE</p>}
                    {cliente && <p className="text-liquid-gold/60">[LOG] ENTITY_BIND: {cliente.id.substring(0,8)}</p>}
                    {items.length > 0 && <p className="text-white/60">[LOG] ASSET_APPEND: {items.length} units</p>}
                    <motion.p 
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-white/20"
                    >
                        _WAITING_FOR_INPUT...
                    </motion.p>
                </div>
            </div>

            {/* Minimize Toggle */}
            <button 
                onClick={() => setIsSidebarMinimized(true)}
                className="w-full py-4 text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-white transition-colors"
            >
                [ MINIMIZAR TELEMETRÍA ]
            </button>
        </motion.div>
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-16 pb-40 px-3 sm:px-8 lg:px-14 pt-4 md:pt-10">            {/* --- INDICADOR DE PASOS (OPTIMIZADO PARA MÓVIL) --- */}
            <div className="flex justify-between items-center bg-black/40 backdrop-blur-3xl p-3 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group no-scrollbar overflow-x-auto sticky top-0 z-[60] -mx-1 sm:mx-0">
                <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/[0.05] via-transparent to-liquid-gold/[0.05] pointer-events-none"></div>
                {getSteps().map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div 
                            onClick={() => step > s.id && setStep(s.id)}
                            className={`flex flex-col items-center gap-1.5 md:gap-3 relative z-10 flex-shrink-0 group/step cursor-pointer transition-all ${step === s.id ? 'opacity-100 scale-105' : 'opacity-40 hover:opacity-100'}`}
                        >
                            <div className="relative">
                                {step === s.id && (
                                    <motion.div 
                                        layoutId="stepGlow"
                                        className="absolute -inset-2 bg-liquid-gold/20 blur-lg rounded-full"
                                    />
                                )}
                                
                                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-500 border relative overflow-hidden ${
                                    step >= s.id 
                                        ? 'bg-black border-liquid-gold shadow-gold-glow-sm' 
                                        : 'bg-white/5 border-white/10 text-slate-700'
                                } ${step === s.id ? 'scale-110 shadow-gold-glow ring-2 ring-liquid-gold/20' : ''}`}>
                                    {step === s.id && (
                                        <motion.div 
                                            animate={{ y: [-40, 40] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 bg-gradient-to-b from-transparent via-liquid-gold/15 to-transparent w-full h-1/2 pointer-events-none"
                                        />
                                    )}
                                    <s.icon className={`w-4 h-4 md:w-6 md:h-6 transition-colors duration-500 ${step >= s.id ? 'text-liquid-gold' : 'text-slate-700'}`} />
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-0">
                                <span className={`text-[6px] md:text-[8px] font-black tracking-widest ${step >= s.id ? 'text-liquid-gold/80' : 'text-slate-800'}`}>{(s as any).code}</span>
                                <span className={`text-[8px] md:text-[11px] font-black uppercase tracking-tighter italic transition-all ${
                                    step >= s.id ? 'text-white' : 'text-slate-700'
                                } ${step === s.id ? 'text-liquid-gold font-black' : ''} whitespace-nowrap`}>{s.label}</span>
                            </div>
                        </div>

                        {idx < getSteps().length - 1 && (
                            <div className="flex-1 min-w-[15px] md:min-w-[40px] h-[1px] md:h-[2px] bg-white/5 mx-1 md:mx-4 relative overflow-hidden rounded-full self-center mb-4 md:mb-6">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: step > s.id ? '100%' : '0%' }}
                                    className="absolute inset-0 bg-liquid-gold shadow-gold-glow"
                                />
                            </div>
                        )}
                    </React.Fragment>
                ))}
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
                        
                        {/* PASO 1: CATEGORÍA (Arquitectura de 3 Pilares Elite) */}
                        {step === 1 && (
                            <motion.div 
                                key="step1" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                                className="bg-black/40 backdrop-blur-[40px] p-6 sm:p-16 lg:p-24 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden group/modal"
                            >
                                {/* Grid de Fondo Técnico */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
                                
                                <div className="space-y-4 md:space-y-6 mb-12 md:mb-20 text-center relative z-10">
                                    <div className="flex items-center justify-center gap-4 mb-2">
                                        <div className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent to-liquid-gold/40" />
                                        <p className="text-[9px] md:text-[12px] font-black text-liquid-gold uppercase tracking-[0.5em] md:tracking-[1em] italic">MODALIDAD_DE_INGRESO_V5.0</p>
                                        <div className="h-px w-8 md:w-12 bg-gradient-to-l from-transparent to-liquid-gold/40" />
                                    </div>
                                    <h2 className="text-3xl md:text-8xl font-black text-white uppercase tracking-tighter italic leading-none">Tipo de <span className="text-gold-gradient drop-shadow-gold">Misión</span></h2>
                                    <p className="text-slate-500 text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] italic opacity-60">Seleccione el vector de despliegue industrial requerido</p>
                                </div>

                                <div className="flex flex-col md:flex-row md:min-h-[650px] relative gap-4 md:gap-0">
                                    
                                    {/* --- LASER SEPARATOR 1 --- */}
                                    <div className="hidden md:block absolute left-[50%] inset-y-0 w-px z-20 pointer-events-none">
                                        <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                                        <motion.div 
                                            animate={{ top: ['-20%', '120%'] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="absolute w-[2px] h-40 -left-[0.5px] bg-gradient-to-b from-transparent via-liquid-gold to-transparent blur-[2px]"
                                        />
                                        <div className="absolute top-[50%] -left-1 w-2 h-2 rounded-full bg-liquid-gold/20 blur-sm" />
                                    </div>

                                    {/* PILAR 01: SRI */}
                                    <motion.button 
                                        whileHover="hover"
                                        onClick={() => handleSelectCategory('SRI')}
                                        className="flex-1 group/pilar relative p-12 lg:p-20 text-center flex flex-col items-center justify-center gap-14 transition-all duration-700 z-10 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-liquid-gold/[0.02] opacity-0 group-hover/pilar:opacity-100 transition-opacity duration-700" />
                                        
                                        {/* Telemetría Lateral Pilar */}
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-8 opacity-0 group-hover/pilar:opacity-100 transition-all duration-700 translate-x-4 group-hover/pilar:translate-x-0">
                                            {['SYS_AUTH', 'TR_ENCRYPT', 'FISCAL_V3'].map(t => (
                                                <span key={t} className="[writing-mode:vertical-lr] text-[7px] font-black tracking-[0.5em] text-liquid-gold/40 uppercase italic">{t}</span>
                                            ))}
                                        </div>

                                        <div className="relative">
                                            <div className="w-32 h-32 md:w-40 md:h-40 bg-liquid-gold/5 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center text-liquid-gold border border-liquid-gold/10 group-hover/pilar:scale-110 group-hover/pilar:bg-liquid-gold group-hover/pilar:text-black transition-all duration-700 shadow-2xl group-hover/pilar:shadow-gold-glow relative overflow-hidden">
                                                <motion.div 
                                                    animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                                    className="absolute inset-0 border border-dashed border-white/10 rounded-full scale-150 opacity-0 group-hover/pilar:opacity-20"
                                                />
                                                <ShieldCheckIcon className="w-16 h-16 md:w-20 md:h-20 relative z-10" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 bg-black border border-liquid-gold/20 px-2 md:px-3 py-1 rounded-lg text-[7px] md:text-[8px] font-black text-liquid-gold tracking-widest uppercase italic">0x_FISCAL</div>
                                        </div>

                                        <div className="space-y-4 md:space-y-8 relative z-10">
                                            <div className="space-y-2">
                                                <p className="text-[9px] md:text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] italic opacity-40 group-hover/pilar:opacity-100 transition-opacity">Protocolo Certificado</p>
                                                <h3 className="text-4xl lg:text-7xl font-black text-white uppercase tracking-tighter italic leading-[0.9]">Vector<br/><span className="text-liquid-gold">SRI</span></h3>
                                            </div>
                                            <div className="h-[2px] w-12 md:w-16 bg-liquid-gold/20 mx-auto group-hover/pilar:w-40 transition-all duration-700 shadow-gold-glow" />
                                            <p className="text-[10px] md:text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto opacity-60 group-hover/pilar:opacity-100 transition-opacity">Emisión de documentos tributarios con validación en tiempo real.</p>
                                        </div>

                                        <div className="mt-4 py-4 px-10 rounded-2xl border border-liquid-gold/20 bg-liquid-gold/5 flex items-center gap-4 text-[11px] font-black text-liquid-gold group-hover/pilar:bg-liquid-gold group-hover/pilar:text-black tracking-[0.5em] uppercase transition-all duration-500 italic shadow-lg">
                                            <span>AUTORIZAR</span>
                                            <ArrowRightIcon className="w-5 h-5 translate-x-0 group-hover/pilar:translate-x-2 transition-transform" />
                                        </div>
                                    </motion.button>

                                    {/* PILAR 02: COMERCIAL */}
                                    <motion.button 
                                        whileHover="hover"
                                        onClick={() => handleSelectCategory('COMERCIAL')}
                                        className="flex-1 group/pilar relative p-12 lg:p-20 text-center flex flex-col items-center justify-center gap-14 transition-all duration-700 z-10 overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-liquid-gold/[0.02] opacity-0 group-hover/pilar:opacity-100 transition-opacity duration-700" />
                                        
                                        <div className="relative">
                                            <div className="w-32 h-32 md:w-40 md:h-40 bg-liquid-gold/5 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center text-liquid-gold border border-liquid-gold/10 group-hover/pilar:scale-110 group-hover/pilar:bg-liquid-gold group-hover/pilar:text-black transition-all duration-700 shadow-2xl group-hover/pilar:shadow-gold-glow relative overflow-hidden">
                                                <motion.div 
                                                    animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                                    className="absolute inset-0 border border-dashed border-black/10 rounded-full scale-150 opacity-0 group-hover/pilar:opacity-20"
                                                />
                                                <BookOpenIcon className="w-16 h-16 md:w-20 md:h-20 relative z-10" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 bg-black border border-liquid-gold/20 px-2 md:px-3 py-1 rounded-lg text-[7px] md:text-[8px] font-black text-liquid-gold tracking-widest uppercase italic">0x_ELITE</div>
                                        </div>

                                        <div className="space-y-4 md:space-y-8 relative z-10">
                                            <div className="space-y-2">
                                                <p className="text-[9px] md:text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] italic opacity-40 group-hover/pilar:opacity-100 transition-opacity">Branding Industrial</p>
                                                <h3 className="text-4xl lg:text-7xl font-black text-white uppercase tracking-tighter italic leading-[0.9]">Artes<br/><span className="text-liquid-gold">Comercial</span></h3>
                                            </div>
                                            <div className="h-[2px] w-12 md:w-16 bg-liquid-gold/20 mx-auto group-hover/pilar:w-40 transition-all duration-700 shadow-gold-glow" />
                                            <p className="text-[10px] md:text-[11px] text-slate-500 font-bold uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto opacity-60 group-hover/pilar:opacity-100 transition-opacity">Tarjetas, sellos, brochures y ventas rápidas de mostrador.</p>
                                        </div>

                                        <div className="mt-4 py-4 px-10 rounded-2xl border border-liquid-gold/20 bg-liquid-gold/5 flex items-center gap-4 text-[11px] font-black text-liquid-gold group-hover/pilar:bg-liquid-gold group-hover/pilar:text-black tracking-[0.5em] uppercase transition-all duration-500 italic shadow-lg">
                                            <span>CONFIGURAR</span>
                                            <ArrowRightIcon className="w-5 h-5 translate-x-0 group-hover/pilar:translate-x-2 transition-transform" />
                                        </div>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {/* PASO 2: IDENTIDAD (SRI) o ESPECIFICACIÓN (COMERCIAL) */}
                        {step === 2 && (
                            <motion.div 
                                key="step2" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-6 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                {missionCategory === 'SRI' ? (
                                    <div className="space-y-12">
                                        <div className="space-y-4">
                                            <p className="text-[9px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] md:tracking-[0.8em] italic">ETAPA FISCAL</p>
                                            <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Identidad del <span className="text-gold-gradient">Contribuyente</span></h2>
                                            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest italic">Búsqueda inteligente: Base Local → Padrón SRI → PDF → Manual</p>
                                        </div>
                                        <SriIdentityFlow 
                                            onComplete={(c) => { 
                                                setCliente(c);
                                                // Auto-fill SRI fields from client data if available
                                                if (c.establecimientoPredeterminado) setSriEstablecimiento(c.establecimientoPredeterminado);
                                                if (c.puntoEmisionPredeterminado) setSriPuntoEmision(c.puntoEmisionPredeterminado);
                                                if (c.actividades) setSriActividad(c.actividades);
                                                setStep(3);
                                            }} 
                                            onCancel={() => { setStep(1); setMissionCategory(null); }}
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
                                className="bg-white/[0.01] backdrop-blur-3xl p-6 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
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
                                            <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Detalles del <span className="text-gold-gradient">Trabajo</span></h2>
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

                        {/* PASO 4: PRODUCTOS (SRI) o COBRO (OTRO) */}
                        {step === 4 && (
                            <motion.div 
                                key="step4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-6 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
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

                        {/* PASO 6: FINALIZADO */}
                        {step === 6 && (
                            <motion.div 
                                key="step6_final" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/5 backdrop-blur-3xl p-8 md:p-24 rounded-[3rem] md:rounded-[5rem] border border-emerald-500/20 text-center space-y-8 md:space-y-16 shadow-luxury relative overflow-hidden"
                            >
                                {/* Celebratory Background Elements */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-emerald-500/20 to-transparent" />
                                    <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-emerald-500/20 to-transparent" />
                                </div>
                                
                                <div className="relative z-10 space-y-10">
                                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-emerald-500 shadow-emerald-500/50 shadow-2xl mb-8">
                                        <CheckCircleIcon className="w-16 h-16 text-white" />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <p className="text-emerald-500 font-black uppercase tracking-[0.5em] text-xs">Misión Completada</p>
                                        <h2 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none">Despliegue <span className="text-emerald-500">Exitoso</span></h2>
                                        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">El protocolo industrial ha sido ejecutado. El pedido #{createdTrabajoId?.substring(0, 8)} ya está en el sistema.</p>
                                    </div>

                                    {/* Botones de Impresión Condicionales */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto px-4 relative z-10">
                                        {createdTrabajoId && (
                                            missionCategory === 'SRI' ? (
                                                <>
                                                    <button 
                                                        onClick={() => window.open(`/#/solicitud-sri/${createdTrabajoId}?format=a5`, '_blank')} 
                                                        className="px-8 py-7 bg-liquid-gold text-black rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-gold-glow hover:scale-105 active:scale-95 transition-all"
                                                    >
                                                        <PrinterIcon className="w-5 h-5 md:w-7 md:h-7" /> SRI (A5 DOBLE)
                                                    </button>
                                                    <button 
                                                        onClick={() => window.open(`/#/solicitud-sri/${createdTrabajoId}?format=a4`, '_blank')} 
                                                        className="px-8 py-7 bg-white/5 text-white border border-liquid-gold/30 rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-liquid-gold/20 active:scale-95 transition-all"
                                                    >
                                                        <PrinterIcon className="w-5 h-5 md:w-7 md:h-7" /> SRI (A4 COMPLETO)
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => window.open(`/#/recibo-epson/${createdTrabajoId}`, '_blank')} 
                                                    className="col-span-2 px-10 py-6 bg-white text-black rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-4 shadow-luxury hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    <PrinterIcon className="w-5 h-5 md:w-6 md:h-6" /> Imprimir Recibo
                                                </button>
                                            )
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
                                        <button onClick={() => navigate('/dashboard')} className="px-12 py-6 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all italic">Panel de Control</button>
                                        <button onClick={() => window.location.reload()} className="px-12 py-6 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-105 transition-all italic">Nueva Misión</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* CONTROLES DE NAVEGACIÓN */}
                    {missionCategory !== 'COMERCIAL' && ((missionCategory === 'SRI' && step < 6) || (missionCategory !== 'SRI' && step < 5)) && (
                        <div className="flex justify-between items-center px-10 mt-10">
                            <button 
                                disabled={step === 1}
                                onClick={() => {
                                    if (missionCategory === 'EXPRESS' && step === 4) setStep(2);
                                    else if (missionCategory === 'SRI' && step === 5) setStep(4);
                                    else setStep(s => s - 1);
                                }}
                                className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white disabled:opacity-0 transition-all"
                            >
                                <ArrowRightIcon className="w-5 h-5 rotate-180" /> Paso Anterior
                            </button>
                            
                            <div className="flex items-center gap-6">
                                {error && <span className="text-liquid-gold text-[10px] font-black uppercase tracking-widest animate-pulse">{error}</span>}
                                {((missionCategory === 'SRI' && step < 5) || (missionCategory === 'EXPRESS' && step < 4)) ? (
                                    <button 
                                        disabled={!canAdvance()}
                                        onClick={() => {
                                            if (missionCategory === 'EXPRESS' && step === 2) setStep(4);
                                            else setStep(s => s + 1);
                                        }}
                                        className="bg-white text-black px-16 py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-liquid-gold transition-all disabled:opacity-20 flex items-center gap-4 group"
                                    >
                                        Continuar <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </button>
                                ) : (step === 4 && missionCategory !== 'SRI') || (step === 5 && missionCategory === 'SRI') ? (
                                    <button 
                                        disabled={!canAdvance() || loading}
                                        onClick={handleCreateOrder}
                                        className="bg-liquid-gold text-black px-20 py-7 rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] shadow-gold-glow-strong hover:scale-105 transition-all flex items-center gap-5"
                                    >
                                        {loading ? <Loader2Icon className="animate-spin w-5 h-5" /> : <RocketLaunchIcon className="w-6 h-6" />}
                                        {loading ? 'Procesando...' : 'Finalizar Pedido'}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- SIDEBAR TELEMETRÍA ELITE --- */}
                {!isSidebarMinimized && missionCategory && step < 5 && (
                    <TelemetrySidebar />
                )}
            </div>
        </div>
    );
};

export default NuevoPedidoPage;
