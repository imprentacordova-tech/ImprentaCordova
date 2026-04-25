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
    ExclamationTriangleIcon, LayoutDashboardIcon, BookOpenIcon, ZapIcon
} from '../components/Icons';
import ClientSelector from '../components/orders/ClientSelector';
import ServiceSelector from '../components/orders/ServiceSelector';
import ProductConfigurator from '../components/orders/ProductConfigurator';
import PhotoCapture from '../components/orders/PhotoCapture';
import PriceCalculatorDisplay from '../components/orders/PriceCalculatorDisplay';
import { motion, AnimatePresence } from 'framer-motion';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { refreshData, addTrabajo, addCliente } = useData();
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

    // Auto-scroll logic
    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTo(0, 0);
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
        return () => clearTimeout(timer);
    }, [step, servicio, orderMode]);

    // SRI specific states
    const [isSriOrder, setIsSriOrder] = useState(false);
    const [sriMode, setSriMode] = useState<'NUEVO' | 'RENOVACION'>('RENOVACION');
    const [sriClave, setSriClave] = useState('');
    const [sriActividad, setSriActividad] = useState('');
    const [taxStatus, setTaxStatus] = useState<'AL_DIA' | 'PENDIENTE' | 'DESCONOCIDO'>('DESCONOCIDO');
    const [quickName, setQuickName] = useState('');

    const canAdvance = () => {
        if (step === 1) return missionCategory !== null;
        if (step === 2) {
            if (isSriOrder) return !!cliente;
            return true;
        }
        if (step === 3) {
            if (orderMode === 'EXPRESS') return !!detalle.trim();
            if (orderMode === 'CATALOG') return !!configuracion;
            return false;
        }
        if (step === 4) return precio > 0;
        return true;
    };

    const handleCreateOrder = async () => {
        setLoading(true);
        setError(null);
        try {
            let finalCliente = cliente;
            if (!finalCliente) {
                finalCliente = await addCliente({
                    nombre: (quickName || 'CONSUMIDOR FINAL').toUpperCase(),
                    cedula: '9999999999',
                    regimen: 'General',
                    direccion: 'Pasaje, El Oro'
                });
            }

            const result = await addTrabajo({
                titular: finalCliente.nombre,
                clienteId: finalCliente.id || '',
                servicio: servicio?.nombre || 'Servicio General',
                detalle: isSriOrder 
                    ? `[SRI ${sriMode}] ${sriActividad} | ${detalle}${configuracion ? ` | SPECS: ${JSON.stringify(configuracion.especificaciones)}` : ''}` 
                    : `${detalle}${configuracion ? ` | SPECS: ${JSON.stringify(configuracion.especificaciones)}` : ''}`,
                precio,
                abono,
                saldo: precio - abono,
                prioridad,
                estado: TrabajoEstado.PENDIENTE,
                fechaEntrada: new Date().toISOString(),
                responsable: currentUser.nombre,
                origen: 'Local',
                es_sri: isSriOrder,
                estado_clave: isSriOrder ? (sriClave ? 'ENTREGADA' : 'PENDIENTE') : null,
                actividad_seleccionada: isSriOrder ? sriActividad : null
            }, currentUser.nombre, imageFile);

            logActivity(
                currentUser.nombre, 
                currentUser.rol || 'Administrador', 
                'CREAR_ORDEN', 
                `Misión desplegada: Orden #${result.orden} para ${finalCliente.nombre}`, 
                'Ventas'
            ).catch(() => {});
            
            refreshData().catch(() => {});
            setCreatedTrabajoId(result.id);
            setStep(5); 
        } catch (err: any) {
            console.error('[NuevoPedido] Error:', err);
            setError(err.message || 'Error al desplegar la misión.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, label: 'Categoría', icon: LayoutDashboardIcon },
        { id: 2, label: 'Identidad', icon: UserIcon },
        { id: 3, label: 'Especificación', icon: CpuIcon },
        { id: 4, label: 'Capital', icon: CreditCardIcon },
        { id: 5, label: 'Despliegue', icon: RocketLaunchIcon }
    ];

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
            {/* --- TRANSLUCENT STEPPER --- */}
            <div className="flex justify-between items-center bg-white/[0.01] backdrop-blur-3xl p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group no-scrollbar overflow-x-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/[0.03] via-transparent to-liquid-gold/[0.03]"></div>
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3 md:gap-4 relative z-10 flex-shrink-0">
                            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-700 border-2 ${
                                step >= s.id ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow' : 'bg-white/5 border-white/10 text-slate-600'
                            } ${step === s.id ? 'scale-110' : ''}`}>
                                <s.icon className={`w-4 h-4 md:w-6 md:h-6 ${step === s.id ? 'animate-pulse' : ''}`} />
                            </div>
                            <span className={`text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] italic ${step >= s.id ? 'text-white' : 'text-slate-700'}`}>{s.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
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
                <div className="lg:col-span-8 space-y-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-6 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                <div className="space-y-4 mb-12 text-center">
                                    <p className="text-[9px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] md:tracking-[0.8em] italic">Step 01</p>
                                    <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Categoría de <span className="text-gold-gradient">Producción</span></h2>
                                    <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest italic">Seleccione la arquitectura de trabajo.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Botón SRI */}
                                    <motion.button 
                                        whileHover={{ y: -10, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelectCategory('SRI')}
                                        className="group relative h-72 bg-brand-dark/50 backdrop-blur-3xl rounded-[2.5rem] border border-brand-red/30 hover:border-brand-red transition-all overflow-hidden p-8 text-left shadow-luxury"
                                    >
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-red/10 rounded-full blur-[60px] -mr-24 -mt-24 transition-opacity group-hover:opacity-100 opacity-50"></div>
                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div className="w-14 h-14 bg-brand-red rounded-xl flex items-center justify-center text-white shadow-red-glow">
                                                <ShieldCheckIcon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none mb-2">Trámites<br/><span className="text-brand-red">SRI</span></h3>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Facturas, Notas de Venta, Guías. Exige RUC.</p>
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* Botón Comercial */}
                                    <motion.button 
                                        whileHover={{ y: -10, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelectCategory('COMERCIAL')}
                                        className="group relative h-72 bg-brand-dark/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 hover:border-liquid-gold/50 transition-all overflow-hidden p-8 text-left shadow-luxury"
                                    >
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-liquid-gold/5 rounded-full blur-[60px] -mr-24 -mt-24 transition-opacity group-hover:opacity-100 opacity-50"></div>
                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div className="w-14 h-14 bg-liquid-gold rounded-xl flex items-center justify-center text-black shadow-gold-glow">
                                                <BookOpenIcon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none mb-2">Trabajos<br/><span className="text-liquid-gold">Comerciales</span></h3>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Volantes, Tarjetas, Gigantografías, etc.</p>
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* Botón Express */}
                                    <motion.button 
                                        whileHover={{ y: -10, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelectCategory('EXPRESS')}
                                        className="group relative h-72 bg-brand-dark/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 hover:border-blue-500/50 transition-all overflow-hidden p-8 text-left shadow-luxury"
                                    >
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] -mr-24 -mt-24 transition-opacity group-hover:opacity-100 opacity-50"></div>
                                        <div className="relative z-10 h-full flex flex-col justify-between">
                                            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                                                <BoltIcon className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none mb-2">Servicios<br/><span className="text-blue-400">Rápidos</span></h3>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Copias, Anillados, Diseños y extras.</p>
                                            </div>
                                        </div>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-6 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-12">
                                    <div className="space-y-4 text-center sm:text-left">
                                        <p className="text-[9px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] md:tracking-[0.8em] italic">Step 02</p>
                                        <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Protocolo de <span className="text-gold-gradient">Identidad</span></h2>
                                        <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest italic">Localice al titular de la misión.</p>
                                    </div>
                                    <div className="flex flex-col items-center sm:items-end gap-4">
                                        {isSriOrder && (
                                            <div className="px-8 py-4 bg-brand-red/20 border border-brand-red text-brand-red rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                                <ShieldCheckIcon className="w-5 h-5" />
                                                TRÁMITE OFICIAL SRI
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-black/40 p-4 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 shadow-inner space-y-8">
                                    <ClientSelector 
                                        onSelect={(c) => { setCliente(c); if(c) setStep(3); }} 
                                        selectedId={cliente?.id} 
                                        onSkip={() => setStep(3)}
                                        hideQuickButtons={isSriOrder}
                                    />
                                    {!isSriOrder && (
                                        <div className="flex justify-center pt-4">
                                            <button 
                                                onClick={() => setStep(3)}
                                                className="px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[9px] font-black text-slate-500 hover:text-liquid-gold transition-all uppercase tracking-[0.4em] italic"
                                            >
                                                Continuar como Consumidor Final →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* --- STEP 03: ESPECIFICACIÓN --- */}
                        {step === 3 && (
                            <motion.div 
                                key="step3" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-6 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                <div className="space-y-4 mb-10 md:mb-14">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                                        <div>
                                            <p className="text-[9px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] md:tracking-[0.8em] italic">Step 03</p>
                                            <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Matriz de <span className="text-gold-gradient">Especificación</span></h2>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-8 md:gap-12">
                                    <AnimatePresence mode="wait">
                                        {orderMode === 'CATALOG' && !servicio ? (
                                            <motion.div
                                                key="selector"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                            >
                                                <ServiceSelector onSelect={setServicio} selectedId={servicio?.id} />
                                            </motion.div>
                                        ) : orderMode === 'CATALOG' && servicio ? (
                                            <motion.div
                                                key="configurator"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                            >
                                                <ProductConfigurator 
                                                    product={servicio} 
                                                    onCancel={() => setServicio(null)}
                                                    onComplete={(config) => {
                                                        setConfiguracion(config);
                                                        setPrecio(config.precioFinal);
                                                        setStep(4);
                                                    }}
                                                />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="express"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="space-y-10"
                                            >
                                                <div className="space-y-6">
                                                    <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Memorándum del Proyecto</label>
                                                    <textarea 
                                                        value={detalle} 
                                                        onChange={e => setDetalle(e.target.value)}
                                                        placeholder="Describa los parámetros cuánticos del pedido..."
                                                        className="w-full h-48 p-10 bg-black/60 border-2 border-white/5 focus:border-liquid-gold/30 rounded-[2.5rem] text-lg font-bold text-white placeholder:text-slate-700 outline-none transition-all duration-700 shadow-inner resize-none"
                                                    />
                                                </div>
                                                <div className="flex justify-center">
                                                    <button 
                                                        onClick={() => setStep(4)}
                                                        className="px-20 py-6 bg-white text-black rounded-2xl font-black uppercase tracking-[0.4em] hover:bg-liquid-gold transition-all"
                                                    >
                                                        Confirmar Parámetros →
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    {isSriOrder && (orderMode === 'EXPRESS' || (orderMode === 'CATALOG' && !servicio)) && (
                                        <div className="bg-brand-red/5 p-10 rounded-[3rem] border border-brand-red/20 space-y-10 animate-fade-in">
                                            <div className="flex items-center gap-6">
                                                <ShieldCheckIcon className="w-8 h-8 text-brand-red" />
                                                <h3 className="text-lg font-black text-white uppercase tracking-widest italic">Validación Tributaria Obligatoria</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Tipo de Trámite</label>
                                                    <div className="flex gap-4 p-1.5 bg-black/40 rounded-2xl border border-white/5">
                                                        {['NUEVO', 'RENOVACION'].map(m => (
                                                            <button 
                                                                key={m} onClick={() => setSriMode(m as any)}
                                                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sriMode === m ? 'bg-brand-red text-white shadow-luxury' : 'text-slate-600 hover:text-white'}`}
                                                            >
                                                                {m}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Clave SRI (Acceso)</label>
                                                    <input 
                                                        type="text" value={sriClave} onChange={e => setSriClave(e.target.value)}
                                                        placeholder="Contraseña del contribuyente..."
                                                        className="w-full px-8 py-4 bg-black/60 border border-white/5 rounded-2xl text-white font-bold text-sm outline-none focus:border-brand-red/30 transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Actividad a Imprimir en Talonario</label>
                                                <select 
                                                    value={sriActividad} 
                                                    onChange={e => setSriActividad(e.target.value)}
                                                    className="w-full px-8 py-4 bg-black/60 border border-white/5 rounded-2xl text-white font-bold text-sm outline-none focus:border-brand-red/30 transition-all appearance-none"
                                                >
                                                    <option value="">Seleccione actividad...</option>
                                                    {cliente?.actividades ? cliente.actividades.split('|').map((a, i) => (
                                                        <option key={i} value={a}>{a}</option>
                                                    )) : (
                                                        <>
                                                            <option value="SERVICIOS PROFESIONALES">SERVICIOS PROFESIONALES</option>
                                                            <option value="VENTA AL POR MENOR">VENTA AL POR MENOR</option>
                                                            <option value="ACTIVIDADES DE CONSTRUCCIÓN">ACTIVIDADES DE CONSTRUCCIÓN</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {orderMode === 'CATALOG' && !servicio && (
                                        <div className="flex flex-col gap-6">
                                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Índice de Prioridad</label>
                                            <div className="flex gap-6 p-2 bg-black/40 rounded-[2rem] border border-white/5 w-fit">
                                                {['Normal', 'Urgente'].map(p => (
                                                    <button 
                                                        key={p} onClick={() => setPrioridad(p as any)}
                                                        className={`px-12 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.4em] italic transition-all duration-700 ${
                                                            prioridad === p ? 'bg-liquid-gold text-black shadow-gold-glow' : 'text-slate-600 hover:text-white'
                                                        }`}
                                                    >
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* --- STEP 04: CAPITAL --- */}
                        {step === 4 && (
                            <motion.div 
                                key="step4" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-6 sm:p-14 lg:p-20 rounded-[2.5rem] sm:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                <div className="space-y-4 mb-8 md:mb-14">
                                    <p className="text-[9px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] md:tracking-[0.8em] italic">Step 04</p>
                                    <h2 className="text-3xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Asignación <span className="text-gold-gradient">Financiera</span></h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-12">
                                        {!cliente && (
                                            <div className="bg-liquid-gold/10 p-10 rounded-[2.5rem] border border-liquid-gold/20 space-y-6">
                                                <label className="text-[10px] text-liquid-gold font-black uppercase tracking-[0.4em] ml-4 italic">Identidad para el Recibo</label>
                                                <input 
                                                    type="text" 
                                                    value={quickName} 
                                                    onChange={e => setQuickName(e.target.value)}
                                                    placeholder="Nombre del cliente..."
                                                    className="w-full px-8 py-5 bg-black/60 border-2 border-liquid-gold/30 rounded-2xl text-xl font-black text-white outline-none placeholder:text-slate-700 shadow-luxury"
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-6">
                                            <label className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Motor de Cotización Inteligente</label>
                                            <div className="bg-black/60 border border-white/10 rounded-[3rem] p-10 shadow-luxury">
                                                <PriceCalculatorDisplay onSelectPrice={setPrecio} />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <label className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Abono Inicial (Flujo de Entrada)</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-6 md:left-10 flex items-center text-emerald-500 text-2xl md:text-4xl font-black italic">$</div>
                                                <input 
                                                    type="number" value={abono} onChange={e => setAbono(Number(e.target.value))}
                                                    className="w-full pl-14 md:pl-20 pr-6 md:pr-10 py-6 md:py-10 bg-black/60 border-2 border-white/5 focus:border-emerald-500/30 rounded-[2rem] md:rounded-[2.5rem] text-3xl md:text-5xl font-black text-emerald-500 outline-none transition-all duration-700 shadow-inner italic"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-10 bg-liquid-gold/[0.04] border border-liquid-gold/10 rounded-[3rem] flex items-center gap-8">
                                            <div className="w-16 h-16 bg-liquid-gold rounded-2xl flex items-center justify-center text-black shadow-gold-glow">
                                                <BoltIcon className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] italic mb-1">Balance de Saldo</p>
                                                <p className="text-4xl font-black text-white italic tracking-tighter">${Math.max(0, precio - abono).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Captura de Archivo / Testigo Visual</label>
                                        <div className="bg-black/40 p-4 rounded-[3rem] border border-white/5 shadow-inner min-h-[350px]">
                                            <PhotoCapture onImageCaptured={setImageFile} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* --- STEP 05: DESPLIEGUE --- */}
                        {step === 5 && (
                            <motion.div 
                                key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/5 backdrop-blur-3xl p-10 md:p-24 rounded-[3rem] md:rounded-[5rem] border border-emerald-500/20 text-center space-y-8 md:space-y-12 shadow-luxury relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-noise opacity-[0.05]"></div>
                                <div className="w-32 h-32 md:w-48 md:h-48 bg-emerald-500 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center mx-auto shadow-glow shadow-emerald-500/40 relative z-10">
                                    <RocketLaunchIcon className="w-16 h-16 md:w-24 md:h-24 text-black animate-float" />
                                </div>
                                <div className="space-y-4 md:space-y-6 relative z-10">
                                    <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">Misión <span className="text-emerald-500">Desplegada</span></h2>
                                    <p className="text-sm md:text-xl text-slate-400 font-medium max-w-lg mx-auto tracking-tight leading-relaxed">El pedido ha sido sincronizado con el KDS y el núcleo central de producción.</p>
                                </div>
                                <div className="flex flex-col md:flex-row justify-center items-center gap-6 mt-8 relative z-10">
                                    {createdTrabajoId && (
                                        <>
                                            <button 
                                                onClick={() => window.open(`/#/recibo/${createdTrabajoId}`, '_blank')}
                                                className="px-10 py-6 bg-liquid-gold text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-gold-glow hover:scale-105 transition-all duration-500 active:scale-95 flex items-center gap-3"
                                            >
                                                <PrinterIcon className="w-5 h-5" /> Recibo Térmico
                                            </button>
                                            <button 
                                                onClick={() => window.open(`/#/recibo-epson/${createdTrabajoId}`, '_blank')}
                                                className="px-10 py-6 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-luxury hover:bg-slate-200 transition-all duration-500 active:scale-95 flex items-center gap-3"
                                            >
                                                <PrinterIcon className="w-5 h-5" /> Recibo Epson
                                            </button>
                                        </>
                                    )}
                                    <button 
                                        onClick={() => {
                                            if (!cliente) return;
                                            const msg = `Hola *${cliente.nombre}*, necesito su confirmación para el diseño de su pedido. ¿Podría revisarlo?`;
                                            window.open(`https://wa.me/${cliente.telefono?.[0] || ''}?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                        className="px-10 py-6 bg-green-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-luxury hover:bg-green-500 transition-all duration-500 active:scale-95 flex items-center gap-3"
                                    >
                                        WhatsApp Diseño
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setMissionCategory(null);
                                            setStep(1);
                                            setCliente(null);
                                            setServicio(null);
                                            setDetalle('');
                                            setPrecio(0);
                                            setAbono(0);
                                            setImageFile(null);
                                            setCreatedTrabajoId(null);
                                            setConfiguracion(null);
                                            setOrderMode(null);
                                        }}
                                        className="px-10 py-6 bg-transparent border-2 border-white/20 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-white/10 transition-all duration-500 active:scale-95"
                                    >
                                        Nueva Orden
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* --- NAVIGATION CONTROLS --- */}
                    {step < 4 && (
                        <div className="flex justify-between items-center px-10">
                            <button 
                                disabled={step === 1}
                                onClick={() => setStep(s => s - 1)}
                                className="flex items-center gap-6 px-12 py-7 rounded-[2rem] text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] italic hover:text-white transition-all disabled:opacity-20"
                            >
                                <ArrowRightIcon className="w-6 h-6 rotate-180" /> Protocolo Previo
                            </button>
                            
                            <div className="flex items-center gap-8">
                                {error && (
                                    <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest italic animate-pulse flex items-center gap-3">
                                        <ExclamationTriangleIcon className="w-5 h-5" /> {error}
                                    </p>
                                )}
                                
                                {step === 2 ? (
                                    <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] italic animate-pulse">Seleccione un protocolo de producción para continuar</div>
                                ) : step < 4 ? (
                                    <button 
                                        disabled={!canAdvance()}
                                        onClick={() => {
                                            if (step === 1 && !cliente && !quickName) setQuickName('CONSUMIDOR FINAL');
                                            setStep(s => s + 1);
                                        }}
                                        className="bg-white text-black px-16 py-7 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.6em] shadow-luxury hover:bg-liquid-gold transition-all duration-700 active:scale-95 disabled:opacity-20 flex items-center gap-5 group"
                                    >
                                        Continuar <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                                    </button>
                                ) : (
                                    <button 
                                        disabled={!canAdvance() || loading}
                                        onClick={handleCreateOrder}
                                        className="bg-liquid-gold text-black px-20 py-8 rounded-[3rem] text-[12px] font-black uppercase tracking-[0.8em] shadow-gold-glow-strong hover:scale-105 active:scale-95 transition-all duration-1000 flex items-center gap-6"
                                    >
                                        {loading ? <Loader2Icon className="animate-spin w-6 h-6" /> : <RocketLaunchIcon className="w-7 h-7" />}
                                        {loading ? 'Sincronizando...' : 'Lanzar Misión'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- REAL-TIME INTEL SIDEBAR --- */}
                <div className="lg:col-span-4 space-y-10 sticky top-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0a0a0a] rounded-[4rem] p-16 border border-white/10 shadow-gold-glow-strong relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-10 transition-all duration-1000 scale-150">
                            <ShoppingCartIcon className="w-64 h-64 text-liquid-gold" />
                        </div>
                        
                        <div className="relative z-10 space-y-12">
                            <div className="flex items-center gap-6">
                                <span className="bg-liquid-gold text-black text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest italic">Live Summary</span>
                                <div className="h-[1px] flex-1 bg-white/10"></div>
                            </div>

                            <div className="space-y-12">
                                <div className="space-y-3">
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] italic leading-none">Titular Asignado</p>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tight italic group-hover:text-liquid-gold transition-colors duration-500">
                                        {cliente?.nombre || quickName || <span className="text-slate-800 opacity-40 italic">Cotización Anónima...</span>}
                                    </h3>
                                    {isSriOrder && <span className="inline-block bg-brand-red/20 text-brand-red text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter mt-2 border border-brand-red/10 animate-pulse">✓ FLUJO OFICIAL SRI</span>}
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] italic leading-none">Configuración de Flujo</p>
                                    {servicio ? (
                                        <div className="flex flex-col gap-3">
                                            <span className="text-2xl font-black text-white italic uppercase tracking-tighter">{servicio.nombre}</span>
                                            {configuracion && (
                                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                                                    <p className="text-[9px] font-black text-liquid-gold uppercase tracking-widest">Especificaciones Elite</p>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                        <span className="text-[8px] text-slate-500 uppercase">Tam: {configuracion.especificaciones.tamano}</span>
                                                        <span className="text-[8px] text-slate-500 uppercase">Cant: {configuracion.cantidad}</span>
                                                        <span className="text-[8px] text-slate-500 uppercase">Pap: {configuracion.especificaciones.tipoPapel}</span>
                                                        <span className="text-[8px] text-slate-500 uppercase">Cop: {configuracion.especificaciones.copias}</span>
                                                        {configuracion.especificaciones.numerado !== 'No' && <span className="text-[8px] text-liquid-gold uppercase">Num: {configuracion.especificaciones.numerado}</span>}
                                                        {configuracion.especificaciones.perforado !== 'No' && <span className="text-[8px] text-liquid-gold uppercase">Perf: SI</span>}
                                                    </div>
                                                </div>
                                            )}
                                            {isSriOrder && <p className="text-brand-red text-[10px] font-black uppercase tracking-widest italic">Actividad: {sriActividad || 'PENDIENTE'}</p>}
                                            {detalle && <p className="text-slate-500 text-[13px] font-bold italic line-clamp-3 leading-relaxed uppercase">{detalle}</p>}
                                        </div>
                                    ) : (
                                        <p className="text-slate-800 opacity-40 italic font-black uppercase text-2xl tracking-tighter">Sin Especificación</p>
                                    )}
                                </div>

                                <div className="pt-10 border-t border-white/5 space-y-6">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] italic">Monto de Inversión</span>
                                        <span className="text-4xl font-black text-white italic tracking-tighter">${precio.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.4em] italic">Entrada de Capital</span>
                                        <span className="text-3xl font-black text-emerald-500 italic tracking-tighter">-${abono.toFixed(2)}</span>
                                    </div>
                                    <div className="h-[2px] bg-white/5 rounded-full"></div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[11px] text-liquid-gold font-black uppercase tracking-[0.6em] italic">Saldo Técnico</span>
                                        <span className="text-5xl font-black text-liquid-gold italic tracking-tighter text-glow-gold drop-shadow-gold">${(precio - abono).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* SMART CALCULATOR WIDGET */}
                    <div className="bg-white/[0.01] backdrop-blur-3xl rounded-[3rem] p-10 border border-white/5 shadow-2xl space-y-8">
                        <div className="flex items-center gap-6">
                            <SparklesIcon className="w-6 h-6 text-liquid-gold" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] italic">Asistente de Cotización</h4>
                        </div>
                        <PriceCalculatorDisplay onSelectPrice={setPrecio} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NuevoPedidoPage;
