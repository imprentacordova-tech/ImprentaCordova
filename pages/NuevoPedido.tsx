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
    ExclamationTriangleIcon
} from '../components/Icons';
import ClientSelector from '../components/orders/ClientSelector';
import ServiceSelector from '../components/orders/ServiceSelector';
import PhotoCapture from '../components/orders/PhotoCapture';
import PriceCalculatorDisplay from '../components/orders/PriceCalculatorDisplay';
import { motion, AnimatePresence } from 'framer-motion';

const NuevoPedidoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { refreshData, addTrabajo } = useData();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [servicio, setServicio] = useState<any>(null);
    const [detalle, setDetalle] = useState('');
    const [precio, setPrecio] = useState(0);
    const [abono, setAbono] = useState(0);
    const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>('Normal');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    // SRI specific states
    const [isSriOrder, setIsSriOrder] = useState(false);
    const [sriMode, setSriMode] = useState<'NUEVO' | 'RENOVACION'>('RENOVACION');
    const [sriClave, setSriClave] = useState('');
    const [sriActividad, setSriActividad] = useState('');
    const [taxStatus, setTaxStatus] = useState<'AL_DIA' | 'PENDIENTE' | 'DESCONOCIDO'>('DESCONOCIDO');
    const [quickName, setQuickName] = useState(''); // Para cuando saltan el cliente

    const canAdvance = () => {
        if (step === 1) return true; // Permitimos avanzar siempre (identidad opcional inicialmente)
        if (step === 2) {
            if (!servicio || !detalle) return false;
            if (isSriOrder) {
                if (sriMode === 'RENOVACION' && !sriClave) return false;
                if (!sriActividad) return false;
            }
            return true;
        }
        if (step === 3) {
            // En el último paso, si no hay cliente, DEBEMOS tener al menos un nombre rápido
            if (!cliente && !quickName) return false;
            return precio > 0 && abono >= 0;
        }
        return true;
    };

    const handleCreateOrder = async () => {
        setLoading(true);
        setError(null);
        try {
            let finalCliente = cliente;
            
            // Si no hay cliente, crear uno Express al vuelo
            if (!finalCliente) {
                finalCliente = await addCliente({
                    nombre: quickName.toUpperCase(),
                    cedula: '9999999999',
                    regimen: 'General',
                    direccion: 'Pasaje, El Oro'
                });
            }

            const result = await addTrabajo({
                titular: finalCliente.nombre,
                clienteId: finalCliente.id || '',
                servicio: servicio.nombre,
                detalle: isSriOrder 
                    ? `[SRI ${sriMode}] ${sriActividad} | ${detalle}` 
                    : detalle,
                precio,
                abono,
                saldo: precio - abono,
                prioridad,
                estado: TrabajoEstado.PENDIENTE,
                fechaEntrada: new Date().toISOString(),
                responsable: currentUser.nombre,
                origen: 'Local',
                // Metadata SRI
                es_sri: isSriOrder,
                estado_clave: isSriOrder ? (sriClave ? 'ENTREGADA' : 'PENDIENTE') : null,
                actividad_seleccionada: isSriOrder ? sriActividad : null
            }, currentUser.nombre, imageFile);

            await logActivity(
                currentUser.nombre, 
                currentUser.rol || 'Administrador', 
                'CREAR_ORDEN', 
                `Misión desplegada: Orden #${result.orden} para ${finalCliente.nombre}`, 
                'Ventas'
            );
            
            await refreshData();
            setStep(4); // Success step
        } catch (err: any) {
            setError(err.message || 'Error al desplegar la misión.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, label: 'Identidad', icon: UserIcon },
        { id: 2, label: 'Especificación', icon: CpuIcon },
        { id: 3, label: 'Capital', icon: CreditCardIcon },
        { id: 4, label: 'Despliegue', icon: RocketLaunchIcon }
    ];

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 md:space-y-16 pb-40 px-4 sm:px-8 lg:px-14 pt-6 md:pt-10">
            {/* --- TRANSLUCENT STEPPER --- */}
            <div className="flex justify-between items-center bg-white/[0.01] backdrop-blur-3xl p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group no-scrollbar overflow-x-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/[0.03] via-transparent to-liquid-gold/[0.03]"></div>
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-3 md:gap-4 relative z-10 flex-shrink-0">
                            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-700 border-2 ${
                                step >= s.id ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow' : 'bg-white/5 border-white/10 text-slate-600'
                            } ${step === s.id ? 'scale-110' : ''}`}>
                                <s.icon className={`w-5 h-5 md:w-7 md:h-7 ${step === s.id ? 'animate-pulse' : ''}`} />
                            </div>
                            <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] italic ${step >= s.id ? 'text-white' : 'text-slate-700'}`}>{s.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 min-w-[20px] h-[1px] bg-white/5 mx-4 md:mx-10 relative">
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
                {/* --- MAIN CONFIGURATION PANEL --- */}
                <div className="lg:col-span-8 space-y-10">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div 
                                key="step1" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-8 md:p-14 lg:p-20 rounded-[3rem] md:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                                <div className="space-y-4 mb-10 md:mb-14">
                                    <p className="text-[10px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.8em] italic">Step 01</p>
                                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Protocolo de <span className="text-gold-gradient">Identidad</span></h2>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest italic">Seleccione el titular o salte directamente a la cotización.</p>
                                </div>
                                <div className="bg-black/40 p-2 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-inner">
                                    <ClientSelector 
                                        onSelect={(c) => { setCliente(c); if(c) setStep(2); }} 
                                        selectedId={cliente?.id} 
                                        onSkip={() => setStep(2)}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-8 md:p-14 lg:p-20 rounded-[3rem] md:rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                <div className="space-y-4 mb-10 md:mb-14">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                                        <div>
                                            <p className="text-[10px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.8em] italic">Step 02</p>
                                            <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Arquitectura del <span className="text-gold-gradient">Servicio</span></h2>
                                        </div>
                                        <button 
                                            onClick={() => setIsSriOrder(!isSriOrder)}
                                            className={`w-full sm:w-auto px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${isSriOrder ? 'bg-brand-red border-brand-red text-white shadow-red-glow' : 'border-white/10 text-slate-500 hover:text-white'} tap-none`}
                                        >
                                            {isSriOrder ? '✓ TRABAJO SRI' : 'MODO SRI?'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-12">
                                    <ServiceSelector onSelect={setServicio} selectedId={servicio?.id} />
                                    
                                    {isSriOrder && (
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

                                                {sriMode === 'RENOVACION' && (
                                                    <div className="space-y-6">
                                                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Clave SRI (Acceso)</label>
                                                        <input 
                                                            type="text" value={sriClave} onChange={e => setSriClave(e.target.value)}
                                                            placeholder="Contraseña del contribuyente..."
                                                            className="w-full px-8 py-4 bg-black/60 border border-white/5 rounded-2xl text-white font-bold text-sm outline-none focus:border-brand-red/30 transition-all"
                                                        />
                                                    </div>
                                                )}
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

                                            <div className="flex items-center gap-6 p-6 bg-black/40 rounded-2xl border border-white/5">
                                                <div className="flex-1">
                                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Estado de Impuesto a la Renta</p>
                                                    <p className="text-xs font-black text-white italic">{taxStatus === 'AL_DIA' ? '✓ AL DÍA CON EL FISCO' : taxStatus === 'PENDIENTE' ? '⚠ REQUIERE REGULARIZACIÓN' : 'CONSULTA PENDIENTE'}</p>
                                                </div>
                                                <button 
                                                    onClick={() => setTaxStatus('AL_DIA')}
                                                    className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase text-slate-400 transition-all"
                                                >
                                                    Verificar Ahora
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Memorándum del Proyecto</label>
                                        <textarea 
                                            value={detalle} 
                                            onChange={e => setDetalle(e.target.value)}
                                            placeholder="Describa los parámetros cuánticos del pedido..."
                                            className="w-full h-48 p-10 bg-black/60 border-2 border-white/5 focus:border-liquid-gold/30 rounded-[2.5rem] text-lg font-bold text-white placeholder:text-slate-700 outline-none transition-all duration-700 shadow-inner resize-none"
                                        />
                                    </div>
                                    
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
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div 
                                key="step3" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-14 lg:p-20 rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                <div className="space-y-4 mb-14">
                                    <p className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.8em] italic">Step 03</p>
                                    <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">Asignación <span className="text-gold-gradient">Financiera</span></h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-12">
                                        {!cliente && (
                                            <div className="bg-liquid-gold/10 p-10 rounded-[2.5rem] border border-liquid-gold/20 space-y-6 animate-pulse-slow">
                                                <label className="text-[10px] text-liquid-gold font-black uppercase tracking-[0.4em] ml-4 italic">Identidad para el Recibo</label>
                                                <input 
                                                    type="text" 
                                                    value={quickName} 
                                                    onChange={e => setQuickName(e.target.value)}
                                                    placeholder="Nombre del cliente..."
                                                    className="w-full px-8 py-5 bg-black/60 border-2 border-liquid-gold/30 rounded-2xl text-xl font-black text-white outline-none placeholder:text-slate-700 shadow-luxury"
                                                />
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Se creará un perfil Express automáticamente con este nombre.</p>
                                            </div>
                                        )}

                                        <div className="space-y-6">
                                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Valor Total de Misión</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-10 flex items-center text-liquid-gold text-4xl font-black italic">$</div>
                                                <input 
                                                    type="number" value={precio} onChange={e => setPrecio(Number(e.target.value))}
                                                    className="w-full pl-20 pr-10 py-10 bg-black/60 border-2 border-white/5 focus:border-liquid-gold/30 rounded-[2.5rem] text-5xl font-black text-white outline-none transition-all duration-700 shadow-inner italic"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            <label className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] ml-4 italic">Abono Inicial (Flujo de Entrada)</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-10 flex items-center text-emerald-500 text-4xl font-black italic">$</div>
                                                <input 
                                                    type="number" value={abono} onChange={e => setAbono(Number(e.target.value))}
                                                    className="w-full pl-20 pr-10 py-10 bg-black/60 border-2 border-white/5 focus:border-emerald-500/30 rounded-[2.5rem] text-5xl font-black text-emerald-500 outline-none transition-all duration-700 shadow-inner italic"
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

                        {step === 4 && (
                            <motion.div 
                                key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/5 backdrop-blur-3xl p-24 rounded-[5rem] border border-emerald-500/20 text-center space-y-12 shadow-luxury relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-noise opacity-[0.05]"></div>
                                <div className="w-48 h-48 bg-emerald-500 rounded-[3.5rem] flex items-center justify-center mx-auto shadow-glow shadow-emerald-500/40 relative z-10">
                                    <RocketLaunchIcon className="w-24 h-24 text-black animate-float" />
                                </div>
                                <div className="space-y-6 relative z-10">
                                    <h2 className="text-7xl font-black text-white uppercase tracking-tighter italic">Misión <span className="text-emerald-500">Desplegada</span></h2>
                                    <p className="text-xl text-slate-400 font-medium max-w-lg mx-auto tracking-tight">El pedido ha sido sincronizado con el KDS y el núcleo central de producción.</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="px-20 py-8 bg-white text-black rounded-[2.5rem] font-black text-sm uppercase tracking-[0.8em] shadow-luxury hover:bg-emerald-500 transition-all duration-1000 active:scale-95 relative z-10"
                                >
                                    Retornar al Comando
                                </button>
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
                                
                                {step < 3 ? (
                                    <button 
                                        disabled={!canAdvance()}
                                        onClick={() => setStep(s => s + 1)}
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
