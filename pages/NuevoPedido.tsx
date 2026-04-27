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
import ServiceSelector from '../components/orders/ServiceSelector';
import ProductConfigurator from '../components/orders/ProductConfigurator';
import PhotoCapture from '../components/orders/PhotoCapture';
import PriceCalculatorDisplay from '../components/orders/PriceCalculatorDisplay';
import { CommercialFlow } from '../components/orders/CommercialFlow';
import SriSolicitudStep from '../components/orders/SriSolicitudStep';
import { motion, AnimatePresence } from 'framer-motion';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { refreshData, addTrabajo, addCliente, clientes } = useData();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [missionCategory, setMissionCategory] = useState<'SRI' | 'COMERCIAL' | 'EXPRESS' | null>(null);
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
    const [quickName, setQuickName] = useState('');

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
            if (step === 4) return precio > 0;
        } else if (missionCategory === 'EXPRESS') {
            if (step === 2) return !!detalle.trim() && precio > 0;
            if (step === 4) return true;
        }
        
        return false;
    };

    const handleCreateOrder = async () => {
        let finalItems = [...items];
        
        // Si es modo EXPRESS y no hay items, creamos un item virtual a partir del detalle
        if (missionCategory === 'EXPRESS' && finalItems.length === 0) {
            if (!detalle && !precio) {
                setError("Debe especificar el detalle o el precio del servicio express.");
                return;
            }
            finalItems = [{
                id: 'express_item_' + Date.now(),
                nombre: 'Servicio Express',
                descripcion: detalle,
                cantidad: 1,
                precioBase: precio,
                precioFinal: precio,
                especificaciones: { tamano: 'N/A', tipoPapel: 'N/A' }
            } as any];
        }

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
                    clienteId: finalCliente!.id,
                    servicio: item.nombre || 'Servicio General',
                    detalle: isSriOrder 
                        ? `[SRI ${sriMode}] ${sriActividad} | EST: ${sriEstablecimiento} | PTO: ${sriPuntoEmision} | CLAVE: ${sriClave || 'PENDIENTE'} | ${item.descripcion || ''} | ESPECIFICACIONES: ${JSON.stringify(item.especificaciones)}` 
                        : `${item.descripcion || ''} | ESPECIFICACIONES: ${JSON.stringify(item.especificaciones)}`,
                    precio: item.precioFinal,
                    abono: index === 0 ? abono : 0, // Only apply abono to the first job
                    saldo: item.precioFinal - (index === 0 ? abono : 0),
                    prioridad,
                    estado: TrabajoEstado.PENDIENTE,
                    fechaEntrada: new Date().toISOString(),
                    responsable: currentUser.nombre,
                    origen: 'Local',
                    esSRI: isSriOrder,
                    estadoClave: isSriOrder ? (sriClave ? 'ENTREGADA' : 'PENDIENTE') : null,
                    actividadSeleccionada: isSriOrder ? sriActividad : null
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
        if (missionCategory === 'EXPRESS') {
            return [
                { id: 1, label: 'Categoría', icon: LayoutDashboardIcon },
                { id: 2, label: 'Despliegue Rápido', icon: BoltIcon },
                { id: 4, label: 'Capital Rápido', icon: CreditCardIcon },
                { id: 5, label: 'Ticket', icon: RocketLaunchIcon }
            ];
        }

        if (missionCategory === 'SRI') {
            return [
                { id: 1, label: 'Categoría', icon: LayoutDashboardIcon },
                { id: 2, label: 'Identidad', icon: UserIcon },
                { id: 3, label: 'Trámites SRI', icon: ShieldCheckIcon },
                { id: 4, label: 'Servicios SRI', icon: BookOpenIcon },
                { id: 5, label: 'Capital', icon: CreditCardIcon },
                { id: 6, label: 'Despliegue', icon: RocketLaunchIcon }
            ];
        }

        return [
            { id: 1, label: 'Categoría', icon: LayoutDashboardIcon },
            { id: 2, label: 'Catálogo Comercial', icon: BookOpenIcon },
            { id: 3, label: 'Identidad', icon: UserIcon },
            { id: 4, label: 'Capital', icon: CreditCardIcon },
            { id: 5, label: 'Despliegue', icon: RocketLaunchIcon }
        ];
    };

    const handleSelectCategory = (category: 'SRI' | 'COMERCIAL' | 'EXPRESS') => {
        setMissionCategory(category);
        if (category === 'SRI') {
            setIsSriOrder(true);
            setOrderMode('CATALOG');
        } else if (category === 'COMERCIAL') {
            setIsSriOrder(false);
            setOrderMode('CATALOG');
        } else if (category === 'EXPRESS') {
            setIsSriOrder(false);
            setOrderMode('EXPRESS');
        }
        setStep(2);
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-16 pb-40 px-4 sm:px-8 lg:px-14 pt-6 md:pt-10">
            
            {/* --- INDICADOR DE PASOS --- */}
            <div className="flex justify-between items-center bg-white/[0.01] backdrop-blur-3xl p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group no-scrollbar overflow-x-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/[0.03] via-transparent to-liquid-gold/[0.03]"></div>
                {getSteps().map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3 md:gap-4 relative z-10 flex-shrink-0">
                            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-700 border-2 ${
                                step >= s.id ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow' : 'bg-white/5 border-white/10 text-slate-600'
                            } ${step === s.id ? 'scale-110' : ''}`}>
                                <s.icon className={`w-4 h-4 md:w-6 md:h-6 ${step === s.id ? 'animate-pulse' : ''}`} />
                            </div>
                            <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] italic ${step >= s.id ? 'text-white' : 'text-slate-700'}`}>{s.label}</span>
                        </div>
                        {idx < getSteps().length - 1 && (
                            <div className="flex-1 min-w-[15px] h-[1px] bg-white/5 mx-2 md:mx-6 relative">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: step > s.id ? '100%' : '0%' }}
                                    className="absolute inset-0 bg-liquid-gold/40 shadow-gold-glow-sm"
                                />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className={missionCategory === 'COMERCIAL' && step === 2 ? "lg:col-span-12 space-y-10" : "lg:col-span-8 space-y-10"}>
                    <AnimatePresence mode="wait">
                        
                        {/* PASO 1: CATEGORÍA */}
                        {step === 1 && (
                            <motion.div 
                                key="step1" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-6 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                <div className="space-y-4 mb-12 text-center">
                                    <p className="text-[9px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] md:tracking-[0.8em] italic">MODALIDAD DE INGRESO</p>
                                    <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Tipo de <span className="text-gold-gradient">Misión</span></h2>
                                    <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest italic">Seleccione el flujo de despliegue industrial adecuado.</p>
                                </div>

                                <div className="flex flex-col md:flex-row items-stretch justify-center gap-0 relative">
                                    {/* Línea Vertical 1 */}
                                    <div className="hidden md:block absolute left-[33.33%] inset-y-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent z-0"></div>
                                    <div className="hidden md:block absolute left-[33.33%] inset-y-20 w-[2px] bg-liquid-gold/10 -ml-[5px] blur-[1px] z-0"></div>
                                    
                                    {/* Línea Vertical 2 */}
                                    <div className="hidden md:block absolute right-[33.33%] inset-y-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent z-0"></div>
                                    <div className="hidden md:block absolute right-[33.33%] inset-y-20 w-[2px] bg-liquid-gold/10 -mr-[5px] blur-[1px] z-0"></div>

                                    {/* SRI */}
                                    <motion.button 
                                        whileHover={{ backgroundColor: 'rgba(225, 29, 72, 0.05)' }}
                                        onClick={() => handleSelectCategory('SRI')}
                                        className="flex-1 group relative p-12 lg:p-16 text-center flex flex-col items-center gap-10 transition-all duration-500 z-10 border-b md:border-b-0 md:border-r border-white/5 last:border-0"
                                    >
                                        <div className="w-24 h-24 bg-brand-red/10 rounded-3xl flex items-center justify-center text-brand-red border border-brand-red/20 group-hover:scale-110 group-hover:bg-brand-red group-hover:text-white transition-all duration-500 shadow-xl group-hover:shadow-red-glow">
                                            <ShieldCheckIcon className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Documentos<br/><span className="text-brand-red">SRI</span></h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto opacity-60 group-hover:opacity-100 transition-opacity">Protocolos autorizados y validez fiscal industrial.</p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-brand-red/40 group-hover:text-brand-red tracking-[0.4em] uppercase transition-colors italic">
                                            <span>Iniciar Expediente</span>
                                            <ArrowRightIcon className="w-3 h-3 translate-x-0 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </motion.button>

                                    {/* COMERCIAL */}
                                    <motion.button 
                                        whileHover={{ backgroundColor: 'rgba(212, 175, 55, 0.03)' }}
                                        onClick={() => handleSelectCategory('COMERCIAL')}
                                        className="flex-1 group relative p-12 lg:p-16 text-center flex flex-col items-center gap-10 transition-all duration-500 z-10 border-b md:border-b-0 md:border-r border-white/5 last:border-0"
                                    >
                                        <div className="w-24 h-24 bg-liquid-gold/10 rounded-3xl flex items-center justify-center text-liquid-gold border border-liquid-gold/20 group-hover:scale-110 group-hover:bg-liquid-gold group-hover:text-black transition-all duration-500 shadow-xl group-hover:shadow-gold-glow">
                                            <BookOpenIcon className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Flujo<br/><span className="text-liquid-gold">Comercial</span></h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto opacity-60 group-hover:opacity-100 transition-opacity">Tarjetas, publicidad y acabados gráficos de lujo.</p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-liquid-gold/40 group-hover:text-liquid-gold tracking-[0.4em] uppercase transition-colors italic">
                                            <span>Abrir Catálogo</span>
                                            <ArrowRightIcon className="w-3 h-3 translate-x-0 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </motion.button>

                                    {/* EXPRESS */}
                                    <motion.button 
                                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                                        onClick={() => handleSelectCategory('EXPRESS')}
                                        className="flex-1 group relative p-12 lg:p-16 text-center flex flex-col items-center gap-10 transition-all duration-500 z-10"
                                    >
                                        <div className="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-xl group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                            <BoltIcon className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Despliegue<br/><span className="text-blue-400">Inmediato</span></h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto opacity-60 group-hover:opacity-100 transition-opacity">Producción rápida para servicios de entrega al instante.</p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2 text-[8px] font-black text-blue-500/40 group-hover:text-blue-500 tracking-[0.4em] uppercase transition-colors italic">
                                            <span>Modo Turbo</span>
                                            <ArrowRightIcon className="w-3 h-3 translate-x-0 group-hover:translate-x-2 transition-transform" />
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
                                            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest italic">Validación obligatoria de datos tributarios para emisión autorizada.</p>
                                        </div>
                                        <ClientSelector 
                                            onSelect={(c) => { 
                                                setCliente(c); 
                                                if(c) {
                                                    if (missionCategory === 'SRI') setStep(3);
                                                    else setStep(3);
                                                } 
                                            }} 
                                            selectedId={cliente?.id} 
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
                                                    if (clienteId) {
                                                        const found = clientes.find(c => c.id === clienteId);
                                                        if (found) finalCliente = found;
                                                    }

                                                    if (!finalCliente) {
                                                        finalCliente = await addCliente({
                                                            nombre: clienteNombre || 'CONSUMIDOR FINAL',
                                                            cedula: '9999999999',
                                                            telefono: [clienteTelefono],
                                                            regimen: 'General',
                                                            direccion: 'Local'
                                                        });
                                                    }
                                                    const result = await addTrabajo({
                                                        titular: finalCliente.nombre,
                                                        clienteId: finalCliente.id || '',
                                                        servicio: trabajo.subtipo || 'Comercial',
                                                        detalle: trabajo.detalle || '',
                                                        precio: trabajo.total || 0,
                                                        abono: trabajo.abono || 0,
                                                        saldo: trabajo.saldo || 0,
                                                        prioridad: 'Normal',
                                                        estado: TrabajoEstado.PENDIENTE,
                                                        items: items,
                                                        esSRI: missionCategory === 'SRI',
                                                        sriModo: sriMode,
                                                        sriClave: sriClave,
                                                        sriActividad: sriActividad,
                                                        establecimiento: sriEstablecimiento,
                                                        puntoEmision: sriPuntoEmision,
                                                        responsable: currentUser.nombre,
                                                        origen: 'Local',
                                                        esSRI: false
                                                    }, currentUser.nombre);

                                                    setCreatedTrabajoId(result.id);
                                                    setStep(5);
                                                } catch (e: any) {
                                                    setError(e.message);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            onCancel={() => setStep(1)}
                                        />
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
                                                        <div key={idx} className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex justify-between items-center group/item">
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center text-brand-red border border-brand-red/20 font-black italic">{idx + 1}</div>
                                                                <div>
                                                                    <h4 className="text-white font-black uppercase tracking-tight italic">{item.nombre}</h4>
                                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">x{item.cantidad} • {item.especificaciones.tamano} • {item.especificaciones.tipoPapel}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-10">
                                                                <span className="text-xl font-black text-white italic tracking-tighter">${item.precioFinal.toFixed(2)}</span>
                                                                <button onClick={() => {
                                                                    setItems(prev => prev.filter((_, i) => i !== idx));
                                                                    setPrecio(prev => prev - item.precioFinal);
                                                                }} className="text-slate-700 hover:text-brand-red transition-colors"><SolidBoxIcon className="w-5 h-5 rotate-45" /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button 
                                                    onClick={() => setIsAddingItem(true)}
                                                    className="w-full py-6 border-2 border-dashed border-brand-red/10 rounded-3xl text-slate-600 font-black uppercase tracking-[0.4em] hover:border-brand-red/30 hover:text-brand-red transition-all italic flex items-center justify-center gap-4 group"
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

                        {/* PASO 5: COBRO (SRI) o FINALIZADO (OTRO) */}
                        {step === 5 && (
                            missionCategory === 'SRI' ? (
                                <motion.div 
                                    key="step5" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                    className="bg-white/[0.01] backdrop-blur-3xl p-6 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-10">
                                            <div className="space-y-4 mb-10">
                                                <p className="text-[9px] md:text-[11px] font-black text-emerald-500 uppercase tracking-[0.8em] italic">ETAPA FINANCIERA</p>
                                                <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Cierre de <span className="text-emerald-500">Protocolo</span></h2>
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
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="step5_final" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    className="bg-emerald-500/5 backdrop-blur-3xl p-10 md:p-24 rounded-[3rem] md:rounded-[5rem] border border-emerald-500/20 text-center space-y-12 shadow-luxury relative overflow-hidden"
                                >
                                    <div className="w-32 h-32 md:w-48 md:h-48 bg-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-glow shadow-emerald-500/40">
                                        <RocketLaunchIcon className="w-16 h-16 md:w-24 md:h-24 text-black animate-bounce" />
                                    </div>
                                    <div className="space-y-6">
                                        <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter italic">Pedido <span className="text-emerald-500">Ejecutado</span></h2>
                                        <p className="text-slate-400 font-medium max-w-lg mx-auto">El trabajo ha sido registrado exitosamente en el sistema de producción.</p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-6">
                                        {createdTrabajoId && (
                                            <button onClick={() => window.open(`/#/recibo-epson/${createdTrabajoId}`, '_blank')} className="px-10 py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-luxury hover:scale-105 transition-transform"><PrinterIcon className="w-5 h-5" /> Imprimir Recibo</button>
                                        )}
                                        <button onClick={() => window.location.reload()} className="px-10 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Nueva Orden</button>
                                    </div>
                                </motion.div>
                            )
                        )}

                        {/* PASO 6: FINALIZADO (SRI) */}
                        {step === 6 && missionCategory === 'SRI' && (
                            <motion.div 
                                key="step6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/5 backdrop-blur-3xl p-10 md:p-24 rounded-[3rem] md:rounded-[5rem] border border-emerald-500/20 text-center space-y-12 shadow-luxury relative overflow-hidden"
                            >
                                <div className="w-32 h-32 md:w-48 md:h-48 bg-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-glow shadow-emerald-500/40">
                                    <RocketLaunchIcon className="w-16 h-16 md:w-24 md:h-24 text-black animate-bounce" />
                                </div>
                                <div className="space-y-6">
                                    <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter italic">Protocolo <span className="text-emerald-500">Ejecutado</span></h2>
                                    <p className="text-slate-400 font-medium max-w-lg mx-auto">El manifiesto industrial ha sido sincronizado. El seguimiento de telemetría está activo.</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-6">
                                    {createdTrabajoId && (
                                        <div className="flex gap-4">
                                            <button onClick={() => window.open(`/#/solicitud-sri/${createdTrabajoId}?format=a5`, '_blank')} className="px-8 py-6 bg-brand-red text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-red-glow hover:scale-105 transition-transform"><PrinterIcon className="w-5 h-5" /> Solicitud SRI (A5 Doble)</button>
                                            <button onClick={() => window.open(`/#/solicitud-sri/${createdTrabajoId}?format=a4`, '_blank')} className="px-8 py-6 bg-white/10 text-white border border-brand-red/30 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-brand-red/20 transition-all"><PrinterIcon className="w-5 h-5" /> Solicitud SRI (A4 Completo)</button>
                                        </div>
                                    )}
                                    <button onClick={() => window.location.reload()} className="px-10 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Nueva Orden</button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* CONTROLES DE NAVEGACIÓN */}
                    {((missionCategory === 'SRI' && step < 6) || (missionCategory !== 'SRI' && step < 5)) && missionCategory !== 'COMERCIAL' && (
                        <div className="flex justify-between items-center px-10">
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
                                {error && <span className="text-brand-red text-[10px] font-black uppercase tracking-widest animate-pulse">{error}</span>}
                                {((missionCategory === 'SRI' && step < 5) || (missionCategory === 'EXPRESS' && step < 4) || (missionCategory === 'COMERCIAL' && step < 4)) ? (
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

                {/* SIDEBAR DE RESUMEN EN TIEMPO REAL */}
                {missionCategory !== 'COMERCIAL' && (
                    <div className="lg:col-span-4 space-y-10 sticky top-10">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0a0a0a] rounded-[3rem] p-12 border border-white/10 shadow-2xl relative overflow-hidden group"
                        >
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] scale-150"><ShoppingCartIcon className="w-64 h-64 text-liquid-gold" /></div>
                        <div className="relative z-10 space-y-10">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Hoja de <span className="text-liquid-gold">Ruta</span></h3>
                            
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Cliente</p>
                                    <p className="text-2xl font-black text-white italic truncate uppercase">{cliente?.nombre || quickName || '---'}</p>
                                    {isSriOrder && <span className="text-[8px] text-brand-red font-black border border-brand-red/30 px-2 py-0.5 rounded-full">SRI ACTIVO</span>}
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic">Manifiesto de Items</p>
                                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {items.length > 0 ? items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
                                                <span className="text-[10px] text-white font-black uppercase tracking-tighter truncate max-w-[150px] italic">{item.nombre}</span>
                                                <span className="text-xs font-black text-liquid-gold">${item.precioFinal.toFixed(2)}</span>
                                            </div>
                                        )) : <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic">Esperando Protocolo...</p>}
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">Total</span>
                                        <span className="text-3xl font-black text-white italic tracking-tighter">${precio.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest italic">Abono</span>
                                        <span className="text-2xl font-black text-emerald-500 italic tracking-tighter">-${abono.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-4 flex justify-between items-end border-t border-white/5">
                                        <span className="text-[11px] text-liquid-gold font-black uppercase tracking-widest italic">Saldo</span>
                                        <span className="text-5xl font-black text-liquid-gold italic tracking-tighter shadow-gold-glow-sm">${(precio - abono).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="bg-white/[0.02] p-10 rounded-[2.5rem] border border-white/5 space-y-6">
                        <div className="flex items-center gap-4 text-liquid-gold"><SparklesIcon className="w-5 h-5" /><h4 className="text-[10px] font-black uppercase tracking-widest italic">Cálculo Preciso</h4></div>
                        <PriceCalculatorDisplay onSelectPrice={setPrecio} />
                    </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NuevoPedidoPage;
