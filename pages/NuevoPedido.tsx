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

    const canAdvance = () => {
        if (step === 1) return !!cliente;
        if (step === 2) return !!servicio && !!detalle;
        if (step === 3) return precio > 0 && abono >= 0;
        return true;
    };

    const handleCreateOrder = async () => {
        if (!cliente || !servicio) return;
        setLoading(true);
        setError(null);
        try {
            const result = await addTrabajo({
                titular: cliente.nombre,
                clienteId: cliente.id || '',
                servicio: servicio.nombre,
                detalle,
                precio,
                abono,
                saldo: precio - abono,
                prioridad,
                estado: TrabajoEstado.PENDIENTE,
                fechaEntrada: new Date().toISOString(),
                responsable: currentUser.nombre,
                origen: 'Local'
            }, currentUser.nombre, imageFile);

            await logActivity(
                currentUser.nombre, 
                currentUser.rol || 'Administrador', 
                'CREAR_ORDEN', 
                `Misión desplegada: Orden #${result.orden} para ${cliente.nombre}`, 
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
        <div className="max-w-[1400px] mx-auto space-y-16 pb-40 px-6 sm:px-14 pt-10">
            {/* --- TRANSLUCENT STEPPER --- */}
            <div className="flex justify-between items-center bg-white/[0.01] backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/[0.03] via-transparent to-liquid-gold/[0.03]"></div>
                {steps.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <div className="flex flex-col items-center gap-4 relative z-10">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 border-2 ${
                                step >= s.id ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow' : 'bg-white/5 border-white/10 text-slate-600'
                            } ${step === s.id ? 'scale-110' : ''}`}>
                                <s.icon className={`w-7 h-7 ${step === s.id ? 'animate-pulse' : ''}`} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-[0.4em] italic ${step >= s.id ? 'text-white' : 'text-slate-700'}`}>{s.label}</span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className="flex-1 h-[1px] bg-white/5 mx-10 relative">
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
                                className="bg-white/[0.01] backdrop-blur-3xl p-14 lg:p-20 rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                                <div className="space-y-4 mb-14">
                                    <p className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.8em] italic">Step 01</p>
                                    <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">Protocolo de <span className="text-gold-gradient">Identidad</span></h2>
                                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest italic">Seleccione el titular para la nueva misión de producción.</p>
                                </div>
                                <div className="bg-black/40 p-2 rounded-[2.5rem] border border-white/5 shadow-inner">
                                    <ClientSelector onSelect={setCliente} selectedId={cliente?.id} />
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div 
                                key="step2" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                                className="bg-white/[0.01] backdrop-blur-3xl p-14 lg:p-20 rounded-[4rem] border border-white/10 shadow-luxury relative overflow-hidden"
                            >
                                <div className="space-y-4 mb-14">
                                    <p className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.8em] italic">Step 02</p>
                                    <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">Arquitectura del <span className="text-gold-gradient">Servicio</span></h2>
                                </div>
                                <div className="grid grid-cols-1 gap-12">
                                    <ServiceSelector onSelect={setServicio} selectedId={servicio?.id} />
                                    
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
                                        {cliente?.nombre || <span className="text-slate-800 opacity-40 italic">Esperando Identidad...</span>}
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] italic leading-none">Configuración de Flujo</p>
                                    {servicio ? (
                                        <div className="flex flex-col gap-3">
                                            <span className="text-2xl font-black text-white italic uppercase tracking-tighter">{servicio.nombre}</span>
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
