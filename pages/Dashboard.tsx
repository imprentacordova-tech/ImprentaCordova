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

// --- MINIMALIST PREMIUM GAUGE ---
const StatGauge: React.FC<{ label: string; value: number; icon: any; delay?: number; color?: string }> = ({ 
    label, value, icon: Icon, delay = 0, color = 'text-liquid-gold' 
}) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.6 }}
        whileHover={{ y: -5, borderColor: 'rgba(212, 175, 55, 0.2)' }}
        className="bg-white/[0.02] backdrop-blur-xl p-8 rounded-3xl border border-white/5 transition-all duration-500 shadow-xl flex flex-col items-center justify-center text-center group"
    >
        <div className="relative w-28 h-28 mb-6">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                <motion.circle 
                    initial={{ strokeDashoffset: 282 }}
                    animate={{ strokeDashoffset: 282 - (282 * value) / 100 }}
                    transition={{ delay: delay + 0.3, duration: 1.5, ease: "easeOut" }}
                    cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="6" fill="transparent" 
                    strokeDasharray={282} className={`${color} stroke-round`} 
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <Icon className={`w-8 h-8 ${color} opacity-80 group-hover:scale-110 transition-transform duration-500`} />
            </div>
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">{label}</p>
        <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white tracking-tighter">{value}</span>
            <span className={`text-xs font-bold ${color} opacity-50`}>%</span>
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
        const designJobs = activeJobs.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado));
        const productionJobs = activeJobs.filter(t => t.estado === TrabajoEstado.PROCESO);
        const webOrders = activeJobs.filter(t => t.origen === 'Web' && t.estado === TrabajoEstado.PENDIENTE);

        const designLoad = Math.min(100, Math.round((designJobs.length / 15) * 100));
        const productionLoad = Math.min(100, Math.round((productionJobs.length / 20) * 100));
        const priorityJob = activeJobs.sort((a, b) => (a.prioridad === 'Urgente' ? -1 : 1))[0];

        return {
            ingresosHoy: tHoy.reduce((sum, t) => sum + t.abono, 0),
            designLoad,
            productionLoad,
            priorityJob,
            totalActivos: activeJobs.length,
            enVitrina: activeJobs.filter(t => t.estado === TrabajoEstado.VITRINA).length,
            webOrders
        };
    }, [trabajos, loading]);

    if (loading || !stats) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-8 bg-brand-dark">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="w-20 h-20 border-2 border-white/5 rounded-full relative p-2"
            >
                <div className="absolute inset-0 border-t-2 border-liquid-gold rounded-full shadow-gold-glow"></div>
                <div className="w-full h-full bg-white/5 rounded-full backdrop-blur-xl flex items-center justify-center border border-white/5">
                    <Loader2Icon className="w-8 h-8 text-liquid-gold animate-spin" />
                </div>
            </motion.div>
            <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-liquid-gold">Sincronizando Datos</p>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Actualizando flujos de trabajo...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-20">
            
            {/* --- TOP BAR / QUICK ACTIONS --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                            Bienvenido, <span className="text-gold-gradient">{currentUser.nombre.split(' ')[0]}</span>
                        </h1>
                        <span className="px-3 py-1 bg-liquid-gold/10 text-liquid-gold text-[9px] font-black rounded-lg border border-liquid-gold/20 uppercase tracking-widest italic">
                            {currentUser.rol}
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium tracking-tight">
                        Hay <span className="text-white font-bold">{stats.totalActivos} trabajos activos</span> en el flujo de producción hoy.
                    </p>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => navigate('/nuevo')} 
                        className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-liquid-gold transition-all duration-500 shadow-xl active:scale-95"
                    >
                        <AddIcon className="w-4 h-4" />
                        Nueva Orden
                    </button>
                    <button 
                        onClick={() => setIsClientModalOpen(true)} 
                        className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all duration-500 active:scale-95"
                    >
                        <UserPlusIcon className="w-4 h-4 text-liquid-gold" />
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- MAIN DASHBOARD AREA --- */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* WEB ORDERS ALERT */}
                    <AnimatePresence>
                        {stats.webOrders.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex items-center justify-between backdrop-blur-xl shadow-lg relative overflow-hidden"
                            >
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="p-4 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                                        <GlobeAltIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-white font-black uppercase text-[10px] tracking-widest">Pedidos Web Pendientes</p>
                                        <p className="text-blue-200/60 text-xs font-medium mt-1">Tienes {stats.webOrders.length} solicitudes nuevas desde la página pública.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate('/trabajos')} 
                                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-400 transition-all shadow-md"
                                >
                                    Ver Solicitudes
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* METRICS GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatGauge label="Carga de Diseño" value={stats.designLoad} icon={PaletteIcon} delay={0.1} />
                        <StatGauge label="Carga de Producción" value={stats.productionLoad} icon={PrinterIcon} delay={0.2} color="text-blue-400" />
                        
                        {/* FINANCIAL QUICK VIEW */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="bg-white/[0.02] border border-white/5 p-8 rounded-3xl flex flex-col justify-between group relative overflow-hidden shadow-xl"
                        >
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Ingresos Hoy</p>
                                <div className="space-y-1">
                                    <p className="text-5xl font-black text-emerald-400 italic tracking-tighter">
                                        {formatCurrency(stats.ingresosHoy)}
                                    </p>
                                    <p className="text-[9px] font-bold text-emerald-500/40 uppercase tracking-widest flex items-center gap-2">
                                        <TrendingUpIcon className="w-3 h-3" /> Rendimiento Óptimo
                                    </p>
                                </div>
                            </div>
                            <div className="mt-8">
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ delay: 1, duration: 1.5 }}
                                        className="h-full bg-emerald-500" 
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* RECENT CLIENTS */}
                    <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2.5rem] shadow-xl">
                        <div className="flex justify-between items-center mb-8">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Clientes Recientes</h3>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Base de Datos de Clientes</p>
                            </div>
                            <button onClick={() => navigate('/clientes')} className="text-[10px] font-black text-liquid-gold uppercase tracking-widest hover:underline">Ver Todos</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clientes.slice(0, 4).map((c, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + (i * 0.05) }}
                                    key={c.id} 
                                    className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-liquid-gold/20 hover:bg-white/[0.04] transition-all group shadow-sm"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 flex-shrink-0 bg-liquid-gold/10 rounded-xl flex items-center justify-center font-black text-liquid-gold text-lg border border-liquid-gold/20 group-hover:bg-liquid-gold group-hover:text-black transition-all">
                                            {c.nombre.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black text-white uppercase tracking-tight text-sm truncate">{c.nombre}</h4>
                                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest">{c.regimen}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/clientes?id=${c.id}`)} 
                                        className="p-3 text-slate-500 hover:text-liquid-gold transition-colors"
                                    >
                                        <MessageCircleIcon className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- SIDEBAR AREA --- */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* CRITICAL PRIORITY JOB */}
                    {stats.priorityJob && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-[1px] bg-gradient-to-br from-rose-500/30 to-transparent rounded-[2.5rem]"
                        >
                            <div className="bg-[#0c0c0c] p-8 rounded-[2.4rem] border border-white/5 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] scale-150">
                                    <ActivityIcon className="w-32 h-32 text-rose-500" />
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] italic">Prioridad Urgente</span>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Orden #{stats.priorityJob.orden}</p>
                                    <h3 className="text-4xl font-black text-white leading-none uppercase tracking-tighter italic">{stats.priorityJob.titular}</h3>
                                </div>

                                <button 
                                    onClick={() => navigate(`/trabajos/${stats.priorityJob?.id}`)} 
                                    className="w-full py-5 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                >
                                    Gestionar Trabajo
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* WORKFLOW MONITOR */}
                    <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
                        <div className="space-y-1 relative z-10">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Panel de Producción</h3>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Estado del flujo en vivo</p>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-liquid-gold/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-liquid-gold transition-colors">
                                        <SolidBoxIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">En Vitrina</p>
                                        <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">{stats.enVitrina} Trabajos Listos</p>
                                    </div>
                                </div>
                                <button onClick={() => navigate('/retiros')} className="text-liquid-gold">
                                    <ArrowRightIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                {[ 
                                    { label: 'Flujo de Trabajo', icon: AdjustmentsHorizontalIcon, status: 'Activo' },
                                    { label: 'Cumplimiento Tributario', icon: ShieldCheckIcon, status: 'Verificado' },
                                    { label: 'Supervisión por IA', icon: RocketLaunchIcon, status: 'Online' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 px-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold shadow-gold-glow"></div> 
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex-1 italic">{item.label}</span>
                                        <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => navigate('/kds')} 
                            className="w-full py-6 bg-liquid-gold text-brand-dark rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-lg hover:bg-white transition-all flex items-center justify-center gap-4 group"
                        >
                            Ver Producción <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
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
