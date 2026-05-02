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
            <div className="glass-panel-obsidian p-10 rounded-[3.5rem] border-liquid-gold/20 shadow-gold-glow-soft relative overflow-hidden group tactical-border">
                <div className="absolute inset-0 bg-architect-grid opacity-10 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/50 to-transparent animate-scan" />
                
                <div className="space-y-8 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse shadow-gold-glow" />
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">TELEMETRÍA_ELITE_v9.4</h3>
                        </div>
                        <span className="text-[8px] font-mono text-liquid-gold/40 tracking-[0.2em]">NODE_SYNC: 100%</span>
                    </div>
                    
                    <div className="space-y-12">
                        <div className="relative">
                            <p className="text-[9px] font-black text-liquid-gold/40 uppercase tracking-[0.4em] mb-3 italic">Protocolo_Activo</p>
                            <p className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none flex items-center gap-4">
                                <span className="w-2 h-10 bg-liquid-gold shadow-gold-glow" />
                                {missionCategory || 'IDLE_MODE'}
                            </p>
                        </div>
                        
                        <div className="pt-8 border-t border-white/5">
                            <p className="text-[9px] font-black text-liquid-gold/40 uppercase tracking-[0.4em] mb-4 italic">Valuación_en_Tiempo_Real</p>
                            <div className="flex items-baseline gap-4">
                                <span className="text-7xl font-black text-white tracking-[-0.05em] leading-none italic drop-shadow-gold tabular-nums">${precio.toFixed(2)}</span>
                                <span className="text-xl font-black text-slate-800 uppercase italic">USD</span>
                            </div>
                            <div className="flex items-center gap-4 mt-6 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                <ZapIcon className="w-4 h-4 text-emerald-500" />
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] italic">Diferencial_Saldo: ${(precio - abono).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
                        <div className="bg-white/[0.03] p-8 rounded-[2rem] border border-white/5 group-hover:border-white/10 transition-all">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] italic mb-3">Unidades</p>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-white italic leading-none">{items.length}</p>
                                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">SKU</span>
                            </div>
                        </div>
                        <div className="bg-white/[0.03] p-8 rounded-[2rem] border border-white/5 group-hover:border-white/10 transition-all">
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] italic mb-3">Capital_IN</p>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-emerald-500 italic leading-none">${abono.toFixed(0)}</p>
                                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest mb-1">PRE</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 space-y-5">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] italic">DIAGNÓSTICO_NÚCLEO</h4>
                            <div className="flex gap-1">
                                {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-emerald-glow" />)}
                            </div>
                        </div>
                        <div className="bg-[#030303] rounded-[2.5rem] p-8 font-mono text-[10px] text-emerald-500/60 space-y-3 border border-white/5 h-48 overflow-y-auto custom-scrollbar italic shadow-inner">
                            <p className="text-emerald-400">[SYSTEM] KERNEL_INIT: OK</p>
                            <p className="opacity-50">[THREAD] LOADING_MISSION_PARAMS...</p>
                            <p className="text-liquid-gold/80">[EVENT] SECTOR: {missionCategory || 'STANDBY'}</p>
                            <p className="text-emerald-400/80">[EVENT] PHASE: 0{step} OF 0{getSteps().length}</p>
                            <p className="opacity-40">[DATA] SYNCING_WITH_NODE_ALPHA...</p>
                            <p className="animate-pulse text-emerald-400/100 mt-4">_LISTO_PARA_DESPLIEGUE...</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsSidebarMinimized(true)} 
                        className="w-full mt-8 py-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] transition-all italic hover:text-liquid-gold active:scale-90"
                    >
                        MINIMIZAR_HUD
                    </button>
                </div>
            </div>
        </motion.div>
    );

    const showSidebar = !isSidebarMinimized && missionCategory && step < 5;

    return (
        <div className="elite-terminal min-h-screen bg-black">
            <div className="elite-viewport px-4 sm:px-8 lg:px-12 py-6">
                <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className={`space-y-10 transition-all duration-700 ${showSidebar ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                        {/* --- STEPPER ELITE --- */}
                        <div className="sticky top-4 z-[100] bg-black/90 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] py-5 px-10 flex items-center justify-between gap-10 shadow-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-liquid-gold/5 opacity-10 pointer-events-none" />
                            <div className="flex items-center gap-4 flex-1">
                                {getSteps().map((s, idx) => {
                                    const isActive = step === s.id;
                                    const isPast = step > s.id;
                                    return (
                                        <React.Fragment key={s.id}>
                                            <div onClick={() => isPast && setStep(s.id)} className={`flex items-center gap-4 cursor-pointer transition-all ${isActive ? 'opacity-100' : 'opacity-30 hover:opacity-100'}`}>
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 border-2 relative ${
                                                    isActive ? 'bg-liquid-gold border-liquid-gold shadow-gold-glow scale-110' : isPast ? 'bg-white/10 border-liquid-gold/30 text-liquid-gold' : 'bg-white/5 border-white/10 text-slate-700'
                                                }`}>
                                                    <s.icon className={`w-6 h-6 ${isActive ? 'text-black' : isPast ? 'text-liquid-gold' : 'text-slate-800'}`} />
                                                    {isActive && <motion.div animate={{ x: [-60, 60] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute inset-0 bg-white/30 w-1/3 -skew-x-12" />}
                                                </div>
                                                <div className="hidden xl:flex flex-col">
                                                    <span className={`text-[8px] font-black tracking-[0.3em] uppercase italic ${isActive ? 'text-liquid-gold' : 'text-slate-800'}`}>PHASE_0{s.id}</span>
                                                    <span className={`text-[11px] font-black uppercase tracking-tighter italic ${isActive ? 'text-white' : 'text-slate-600'}`}>{s.label}</span>
                                                </div>
                                            </div>
                                            {idx < getSteps().length - 1 && <div className={`h-[2px] flex-1 min-w-[10px] max-w-[40px] rounded-full transition-all duration-1000 ${isPast ? 'bg-liquid-gold/40 shadow-gold-glow-sm' : 'bg-white/5'}`} />}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                            <div className="flex items-center gap-8 border-l border-white/10 pl-10">
                                <button onClick={() => setIsSidebarMinimized(!isSidebarMinimized)} className="w-14 h-14 bg-white/5 hover:bg-liquid-gold hover:text-black rounded-2xl transition-all border border-white/10 flex items-center justify-center group active:scale-90">
                                    <SparklesIcon className={`w-7 h-7 transition-transform duration-700 ${isSidebarMinimized ? '' : 'rotate-180'}`} />
                                </button>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="s1" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="glass-panel-obsidian p-12 md:p-32 rounded-[5rem] tactical-border text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-liquid-gold/5 opacity-5 pointer-events-none" />
                                    <div className="space-y-8 mb-24 relative z-10">
                                        <div className="flex items-center justify-center gap-8">
                                            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-liquid-gold" />
                                            <p className="text-[12px] font-black text-liquid-gold uppercase tracking-[1.2em] italic">MODALIDAD_DE_OPERACIÓN</p>
                                            <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-liquid-gold" />
                                        </div>
                                        <h2 className="text-6xl md:text-9xl font-black text-white uppercase italic tracking-tighter leading-none">SECTOR_DE <span className="text-gold-gradient">MISIÓN</span></h2>
                                        <p className="text-slate-600 font-bold uppercase tracking-[0.5em] italic">Seleccione el vector de despliegue industrial</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-7xl mx-auto relative z-10">
                                        {[
                                            { id: 'SRI', label: 'Sector SRI', icon: ShieldCheckIcon, desc: 'Manufactura fiscal con validación gubernamental síncrona.', color: 'text-liquid-gold', glow: 'shadow-gold-glow' },
                                            { id: 'COMERCIAL', label: 'Artes Craft', icon: BookOpenIcon, desc: 'Branding comercial y despliegue de artes gráficas alta velocidad.', color: 'text-sky-400', glow: 'shadow-sky-glow' }
                                        ].map(v => (
                                            <motion.button 
                                                key={v.id} 
                                                whileHover={{ scale: 1.02, y: -10 }} 
                                                whileTap={{ scale: 0.98 }} 
                                                onClick={() => handleSelectCategory(v.id as any)} 
                                                className="group relative p-16 rounded-[4rem] bg-black/40 border-2 border-white/5 flex flex-col items-center gap-10 hover:border-liquid-gold/40 transition-all duration-700 shadow-luxury overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-architect-grid opacity-5 pointer-events-none" />
                                                <div className="absolute -inset-10 bg-gradient-to-tr from-liquid-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                                
                                                <div className={`w-36 h-36 bg-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-500 group-hover:bg-liquid-gold group-hover:text-black transition-all duration-700 shadow-2xl relative z-10 ${v.glow}-soft`}>
                                                    <v.icon className="w-20 h-20 relative z-10 group-hover:scale-110 transition-transform duration-700" />
                                                </div>
                                                
                                                <div className="text-center space-y-6 relative z-10">
                                                    <h3 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter group-hover:text-liquid-gold transition-colors leading-none">{v.label}</h3>
                                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] italic max-w-sm mx-auto leading-relaxed group-hover:text-white transition-colors">{v.desc}</p>
                                                </div>

                                                <div className="absolute bottom-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-5 group-hover:translate-y-0">
                                                    <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.5em] italic">INICIAR_PROTOCOLO_X_0{v.id === 'SRI' ? '1' : '2'}</span>
                                                    <ArrowRightIcon className="w-4 h-4 text-liquid-gold" />
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && missionCategory === 'SRI' && (
                                <motion.div key="s2sri" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="glass-panel-obsidian p-12 rounded-[4rem] tactical-border space-y-12">
                                    <div className="space-y-4">
                                        <p className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.8em] italic">IDENTIDAD_DE_ENLACE</p>
                                        <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Perfil del <span className="text-gold-gradient">Contribuyente</span></h2>
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
                                <motion.div key="s3sri" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="glass-panel-obsidian p-12 rounded-[4rem] tactical-border">
                                    <SriSolicitudStep cliente={cliente} initialData={{ actividad: sriActividad, modo: sriMode, clave: sriClave, establecimiento: sriEstablecimiento, puntoEmision: sriPuntoEmision }} onBack={() => setStep(2)} onComplete={d => { setSriActividad(d.actividad); setSriMode(d.modo); setSriClave(d.clave); setSriEstablecimiento(d.establecimiento); setSriPuntoEmision(d.puntoEmision); setStep(4); }} />
                                </motion.div>
                            )}

                            {step === 4 && missionCategory === 'SRI' && (
                                <motion.div key="s4sri" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="glass-panel-obsidian p-12 rounded-[4rem] tactical-border space-y-12">
                                    {(isAddingItem || items.length === 0) ? (
                                        !servicio ? <ServiceSelector onSelect={setServicio} regimen={cliente?.regimen} forcedCategory="SRI" /> : 
                                        <ProductConfigurator product={servicio} regimen={cliente?.regimen} onCancel={() => setServicio(null)} onComplete={c => { setItems(p => [...p, c]); setPrecio(p => p + c.precioFinal); setServicio(null); setIsAddingItem(false); }} />
                                    ) : (
                                        <div className="space-y-10">
                                            <div className="space-y-4">
                                                {items.map((item, idx) => (
                                                    <div key={idx} className="elite-hud-card p-8 flex items-center justify-between group hover:border-liquid-gold/30 transition-all">
                                                        <div className="flex items-center gap-8">
                                                            <div className="w-16 h-16 bg-liquid-gold/10 rounded-2xl flex items-center justify-center text-liquid-gold font-black italic border border-liquid-gold/20">{idx + 1}</div>
                                                            <div className="space-y-1">
                                                                <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">{item.nombre}</h4>
                                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.cantidad} UNID | {item.especificaciones.tamano}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-12">
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mb-1">Valuación</p>
                                                                <span className="text-3xl font-black text-white italic tabular-nums">${item.precioFinal.toFixed(2)}</span>
                                                            </div>
                                                            <button onClick={() => { setItems(p => p.filter((_, i) => i !== idx)); setPrecio(p => p - item.precioFinal); }} className="p-4 bg-white/5 rounded-xl text-slate-700 hover:text-brand-red transition-all"><SolidBoxIcon className="w-5 h-5" /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => setIsAddingItem(true)} className="w-full py-10 border-2 border-dashed border-liquid-gold/20 rounded-[2.5rem] text-slate-600 font-black uppercase tracking-[0.5em] hover:text-liquid-gold hover:border-liquid-gold transition-all italic flex items-center justify-center gap-6 group">
                                                <SparklesIcon className="w-6 h-6 group-hover:rotate-12 transition-transform" /> AGREGAR_NUEVO_ACTIVO_FISCAL
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
                                <motion.div key="s6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel-obsidian p-16 md:p-32 rounded-[5rem] tactical-border text-center space-y-16 relative overflow-hidden bg-emerald-950/10">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/20 animate-scan" />
                                    <div className="space-y-10 relative z-10">
                                        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-emerald-500 shadow-emerald-glow mb-8"><CheckCircleIcon className="w-16 h-16 text-white" /></div>
                                        <div className="space-y-4">
                                            <p className="text-emerald-500 font-black uppercase tracking-[1em] text-[12px] italic">MISIÓN_COMPLETADA</p>
                                            <h2 className="text-7xl md:text-9xl font-black text-white uppercase italic tracking-tighter leading-none">DESPLIEGUE <span className="text-emerald-500">EXITOSO</span></h2>
                                            <p className="text-slate-500 font-mono tracking-widest text-lg uppercase">PROTOCOLO_ID: {createdTrabajoId?.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-10 border-t border-white/5">
                                        {missionCategory === 'SRI' ? (
                                            <>
                                                <button onClick={() => window.open(`/#/solicitud-impresion/${createdTrabajoId}?format=a5`, '_blank')} className="py-8 bg-liquid-gold text-black rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-gold-glow flex items-center justify-center gap-6 italic"><PrinterIcon className="w-6 h-6" /> SRI (A5_DUO)</button>
                                                <button onClick={() => window.open(`/#/solicitud-impresion/${createdTrabajoId}?format=a4`, '_blank')} className="py-8 bg-white/5 text-white border-2 border-liquid-gold/30 rounded-[2.5rem] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-6 italic"><PrinterIcon className="w-6 h-6" /> SRI (A4_FULL)</button>
                                            </>
                                        ) : <button onClick={() => window.open(`/#/recibo-epson/${createdTrabajoId}`, '_blank')} className="col-span-2 py-8 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-luxury flex items-center justify-center gap-6 italic"><PrinterIcon className="w-6 h-6" /> IMPRIMIR_RECIBO_TÉRMICO</button>}
                                    </div>
                                    <div className="flex gap-6 justify-center pt-10">
                                        <button onClick={() => navigate('/dashboard')} className="px-12 py-6 bg-white/5 hover:bg-white/10 text-slate-500 font-black uppercase tracking-widest rounded-3xl border border-white/10 transition-all italic">CENTRO_DE_MANDO</button>
                                        <button onClick={() => window.location.reload()} className="px-12 py-6 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-3xl shadow-emerald-glow hover:scale-105 transition-all italic">NUEVA_MISIÓN</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* NAVEGACIÓN GLOBAL */}
                        {step < 5 && step > 1 && (
                            <div className="flex justify-between items-center px-10 pt-10 border-t border-white/5">
                                <button onClick={() => setStep(p => p - 1)} className="flex items-center gap-4 text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] hover:text-white transition-all italic"><ChevronLeftIcon className="w-5 h-5" /> REGRESAR_FASE</button>
                                {canAdvance() && (
                                    <button onClick={() => setStep(p => p + 1)} className="px-16 py-7 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-liquid-gold transition-all shadow-luxury flex items-center gap-6 italic group">
                                        CONTINUAR_MISIÓN <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
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
