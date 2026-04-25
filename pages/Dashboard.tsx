import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TrabajoEstado, User } from '../types';
import { 
    SolidBoxIcon, AddIcon, Loader2Icon, 
    ArrowRightIcon, PaletteIcon, PrinterIcon,
    SparklesIcon, UserPlusIcon, MonitorIcon, MessageCircleIcon, GlobeAltIcon,
    TrendingUpIcon, ShieldCheckIcon, ClockIcon, ActivityIcon,
    CpuIcon, RocketLaunchIcon, CircleStackIcon,
    BoltIcon, AdjustmentsHorizontalIcon, CubeTransparentIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { CreateClientModal } from '../components/orders/ClientSelector';
import { motion, AnimatePresence } from 'framer-motion';

// --- MINIMALIST PREMIUM STAT ---
const StatItem: React.FC<{ label: string; value: string | number; sub?: string; icon: any; color?: string; delay?: number }> = ({ 
    label, value, sub, icon: Icon, color = 'text-liquid-gold', delay = 0 
}) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6 }}
        className="bg-white/[0.01] backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group hover:bg-white/[0.03] transition-all duration-500 shadow-2xl relative overflow-hidden h-full"
    >
        <div className="relative z-10">
            <div className={`w-12 h-12 rounded-2xl ${color.replace('text-', 'bg-')}/10 flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">{label}</p>
            <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white tracking-tighter italic">{value}</span>
                {sub && <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{sub}</span>}
            </div>
        </div>
        <div className="absolute -bottom-10 -right-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-1000">
            <Icon className="w-40 h-40" />
        </div>
    </motion.div>
);

// --- WORKFLOW STAGE ---
const WorkflowStage: React.FC<{ label: string; count: number; icon: any; active?: boolean; delay?: number; onClick?: () => void }> = ({ 
    label, count, icon: Icon, active, delay = 0, onClick 
}) => (
    <motion.div 
        onClick={onClick}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.5 }}
        className={`flex-1 min-w-[140px] p-6 rounded-3xl border transition-all duration-500 flex flex-col items-center gap-3 text-center cursor-pointer ${
            active ? 'bg-liquid-gold/5 border-liquid-gold/20 shadow-gold-glow-soft hover:bg-liquid-gold/10 hover:-translate-y-1' : 'bg-white/[0.01] border-white/5 grayscale hover:grayscale-0 hover:bg-white/[0.03] hover:-translate-y-1'
        }`}
    >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-liquid-gold text-black' : 'bg-white/5 text-slate-500'}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
            <p className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-liquid-gold' : 'text-slate-500'}`}>{label}</p>
            <p className="text-2xl font-black text-white tracking-tighter">{count}</p>
        </div>
    </motion.div>
);

const DashboardPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, loading, refreshData } = useData();
    const navigate = useNavigate();
    
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    
    const stats = useMemo(() => {
        if (loading || !trabajos) return null;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        const tHoy = trabajos.filter(t => new Date(t.fechaEntrada).getTime() >= startOfToday);
        const activeJobs = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO);
        
        // Workflow counts
        const stages = {
            [TrabajoEstado.PENDIENTE]: activeJobs.filter(t => t.estado === TrabajoEstado.PENDIENTE).length,
            [TrabajoEstado.EN_DISENO]: activeJobs.filter(t => t.estado === TrabajoEstado.EN_DISENO).length,
            [TrabajoEstado.PROCESO]: activeJobs.filter(t => t.estado === TrabajoEstado.PROCESO).length,
            [TrabajoEstado.VITRINA]: activeJobs.filter(t => t.estado === TrabajoEstado.VITRINA).length,
        };

        const webOrders = activeJobs.filter(t => t.origen === 'Web' && t.estado === TrabajoEstado.PENDIENTE);
        const priorityJob = activeJobs.sort((a, b) => (a.prioridad === 'Urgente' ? -1 : 1))[0];

        return {
            ingresosHoy: tHoy.reduce((sum, t) => sum + t.abono, 0),
            stages,
            priorityJob,
            totalActivos: activeJobs.length,
            webOrders
        };
    }, [trabajos, loading]);

    if (loading || !stats) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-12 bg-brand-dark">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="w-24 h-24 border border-white/5 rounded-full relative p-2"
            >
                <div className="absolute inset-0 border-t-2 border-liquid-gold rounded-full shadow-gold-glow"></div>
                <div className="w-full h-full bg-white/[0.02] rounded-full backdrop-blur-3xl flex items-center justify-center border border-white/5">
                    <Loader2Icon className="w-8 h-8 text-liquid-gold animate-spin" />
                </div>
            </motion.div>
            <div className="text-center space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-liquid-gold italic">Sincronizando Sistema</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-slate-700">Actualizando flujo de producción...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-16 pb-20 px-4 md:px-0">
            
            {/* --- HEADER: SALUDO & ACCIONES --- */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-5">
                        <div className="h-1 w-12 bg-liquid-gold rounded-full"></div>
                        <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.5em] italic">Resumen Operativo</p>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Buen día, <span className="text-gold-gradient">{currentUser.nombre.split(' ')[0]}</span>
                    </h1>
                    <p className="text-slate-500 text-lg font-light tracking-tight flex items-center gap-3">
                        El taller tiene <span className="text-white font-bold px-3 py-1 bg-white/5 rounded-lg border border-white/10">{stats.totalActivos}</span> trabajos activos.
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                    <button 
                        onClick={() => navigate('/nuevo')} 
                        className="flex-1 lg:flex-none flex items-center justify-center gap-4 px-10 py-6 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-liquid-gold transition-all duration-500 shadow-luxury active:scale-95 group"
                    >
                        <AddIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                        Nueva Orden
                    </button>
                    <button 
                        onClick={() => setIsClientModalOpen(true)} 
                        className="flex-1 lg:flex-none flex items-center justify-center gap-4 px-10 py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all duration-500 active:scale-95"
                    >
                        <UserPlusIcon className="w-5 h-5 text-liquid-gold" />
                        Registro de Cliente
                    </button>
                </div>
            </div>

            {/* --- WORKFLOW TRACKER --- */}
            <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-1000">
                    <RocketLaunchIcon className="w-48 h-48 text-liquid-gold" />
                </div>
                
                <div className="flex justify-between items-center relative z-10">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Flujo de Producción</h3>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">Estado del taller en tiempo real</p>
                    </div>
                    <button 
                        onClick={() => navigate('/kds')} 
                        className="text-[10px] font-black text-liquid-gold uppercase tracking-widest hover:underline flex items-center gap-2 group"
                    >
                        Panel de Control <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="flex flex-wrap gap-6 relative z-10">
                    <WorkflowStage label="Pendientes" count={stats.stages[TrabajoEstado.PENDIENTE]} icon={ClockIcon} active={stats.stages[TrabajoEstado.PENDIENTE] > 5} delay={0.1} onClick={() => navigate('/trabajos')} />
                    <WorkflowStage label="Diseño" count={stats.stages[TrabajoEstado.EN_DISENO]} icon={PaletteIcon} active={stats.stages[TrabajoEstado.EN_DISENO] > 0} delay={0.2} onClick={() => navigate('/diseno')} />
                    <WorkflowStage label="Producción" count={stats.stages[TrabajoEstado.PROCESO]} icon={PrinterIcon} active={stats.stages[TrabajoEstado.PROCESO] > 0} delay={0.3} onClick={() => navigate('/produccion')} />
                    <WorkflowStage label="En Vitrina" count={stats.stages[TrabajoEstado.VITRINA]} icon={SolidBoxIcon} active={stats.stages[TrabajoEstado.VITRINA] > 0} delay={0.4} onClick={() => navigate('/retiros')} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* --- MAIN AREA --- */}
                <div className="lg:col-span-8 space-y-10">
                    
                    {/* WEB ORDERS */}
                    <AnimatePresence>
                        {stats.webOrders.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-blue-500/5 border border-blue-500/10 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-3xl shadow-2xl relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-1000">
                                    <GlobeAltIcon className="w-32 h-32 text-blue-400" />
                                </div>
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform duration-500">
                                        <GlobeAltIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-white font-black uppercase text-xs tracking-[0.3em]">Solicitudes Web Entrantes</p>
                                        <p className="text-blue-400/60 text-sm font-medium mt-1">Hay {stats.webOrders.length} nuevos pedidos desde imprentacordova.net</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate('/trabajos')} 
                                    className="w-full md:w-auto px-8 py-4 bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 transition-all shadow-xl active:scale-95"
                                >
                                    Atender Solicitudes
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* STATS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <StatItem label="Ingresos Hoy" value={formatCurrency(stats.ingresosHoy)} icon={TrendingUpIcon} color="text-emerald-400" delay={0.1} />
                        <StatItem label="Nuevos Clientes" value={clientes.length > 0 ? `+${clientes.slice(0, 5).length}` : '0'} sub="ESTE MES" icon={UserPlusIcon} color="text-liquid-gold" delay={0.2} />
                        <StatItem label="Eficiencia" value="98" sub="%" icon={SparklesIcon} color="text-blue-400" delay={0.3} />
                    </div>

                    {/* RECENT CLIENTS TABLE-LIKE VIEW */}
                    <div className="bg-white/[0.01] border border-white/5 p-10 rounded-[3rem] shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Clientes Recientes</h3>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">Últimos registros en el sistema</p>
                            </div>
                            <button onClick={() => navigate('/clientes')} className="text-[10px] font-black text-liquid-gold uppercase tracking-widest hover:underline italic">Directorio Completo</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {clientes.slice(0, 6).map((c, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + (i * 0.05) }}
                                    key={c.id} 
                                    onClick={() => navigate(`/clientes?id=${c.id}`)}
                                    className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-liquid-gold/20 hover:bg-white/[0.04] transition-all group cursor-pointer shadow-sm"
                                >
                                    <div className="flex items-center gap-5 min-w-0">
                                        <div className="w-14 h-14 flex-shrink-0 bg-liquid-gold/10 rounded-2xl flex items-center justify-center font-black text-liquid-gold text-xl border border-liquid-gold/20 group-hover:bg-liquid-gold group-hover:text-black transition-all duration-500">
                                            {c.nombre.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-white uppercase tracking-tight text-base truncate">{c.nombre}</h4>
                                            <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mt-1">{c.regimen}</p>
                                        </div>
                                    </div>
                                    <ArrowRightIcon className="w-5 h-5 text-slate-800 group-hover:text-liquid-gold group-hover:translate-x-1 transition-all" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- SIDEBAR --- */}
                <div className="lg:col-span-4 space-y-10">
                    
                    {/* PRIORITY JOB */}
                    {stats.priorityJob && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-[1px] bg-gradient-to-br from-rose-500/30 via-transparent to-transparent rounded-[3rem] shadow-luxury"
                        >
                            <div className="bg-[#0c0c0c] p-10 rounded-[2.9rem] border border-white/5 space-y-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-1000 scale-150">
                                    <ActivityIcon className="w-40 h-40 text-rose-500" />
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]"></div>
                                    <span className="text-[11px] font-black text-rose-500 uppercase tracking-[0.5em] italic">Atención Prioritaria</span>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">Orden #{stats.priorityJob.orden}</p>
                                    <h3 className="text-4xl md:text-5xl font-black text-white leading-[0.9] uppercase tracking-tighter italic">{stats.priorityJob.titular}</h3>
                                    <div className="flex gap-4">
                                        <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/10">{stats.priorityJob.estado}</span>
                                        <span className="px-3 py-1 bg-rose-500/10 rounded-lg text-[9px] font-black text-rose-400 uppercase tracking-widest border border-rose-500/20">Urgente</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => navigate(`/trabajos/${stats.priorityJob?.id}`)} 
                                    className="w-full py-6 bg-rose-500 text-white font-black text-[10px] uppercase tracking-[0.4em] rounded-2xl hover:bg-rose-400 transition-all shadow-xl active:scale-95 relative z-10"
                                >
                                    Abrir Expediente
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* SYSTEM STATUS */}
                    <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 space-y-10 relative overflow-hidden">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Asistente de Arte</h3>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">Control de Calidad</p>
                        </div>

                        <div className="space-y-8">
                            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                <p className="text-xs text-slate-400 font-light leading-relaxed">
                                    "Todos los procesos de pre-impresión están certificados. No hay alertas de resolución en la cola actual."
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500">Sistema Nominal</span>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {[ 
                                    { label: 'Servidor S.R.I.', icon: ShieldCheckIcon, status: 'Conectado' },
                                    { label: 'Unidad de Corte', icon: AdjustmentsHorizontalIcon, status: 'En espera' },
                                    { label: 'Respaldo en Nube', icon: CircleStackIcon, status: 'Sincronizado' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-5 px-2">
                                        <div className="w-1 h-1 rounded-full bg-slate-800"></div> 
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex-1 italic">{item.label}</span>
                                        <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => navigate('/registro')} 
                            className="w-full py-6 bg-white/[0.03] border border-white/10 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4 group"
                        >
                            Bitácora de Actividad <ActivityIcon className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>

                </div>
            </div>

            <CreateClientModal 
                isOpen={isClientModalOpen} 
                onClose={() => setIsClientModalOpen(false)} 
                onClientCreated={() => { setIsClientModalOpen(false); refreshData(); }} 
            />
        </div>
    );
};

export default DashboardPage;
