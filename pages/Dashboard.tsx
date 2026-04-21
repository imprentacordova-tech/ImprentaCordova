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

// --- LUXURY GAUGE COMPONENT ---
const LuxuryGauge: React.FC<{ label: string; value: number; icon: any; delay?: number }> = ({ label, value, icon: Icon, delay = 0 }) => (
    <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -10, borderColor: 'rgba(212, 175, 55, 0.3)', backgroundColor: 'rgba(255,255,255,0.03)' }}
        className="bg-white/[0.01] backdrop-blur-3xl p-10 flex flex-col items-center text-center group relative overflow-hidden rounded-[2.5rem] border border-white/5 transition-all duration-700 shadow-2xl"
    >
        <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-10 transition-opacity duration-1000">
            <Icon className="w-32 h-32 text-liquid-gold" />
        </div>
        
        <div className="relative w-36 h-36 mb-10">
            <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                <motion.circle 
                    initial={{ strokeDashoffset: 301.6 }}
                    animate={{ strokeDashoffset: 301.6 - (301.6 * value) / 100 }}
                    transition={{ delay: delay + 0.5, duration: 2.5, ease: "circOut" }}
                    cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="8" fill="transparent" 
                    strokeDasharray={301.6} className="text-liquid-gold stroke-round shadow-gold-glow-sm" 
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 backdrop-blur-md p-5 rounded-full border border-white/10 shadow-gold-glow-soft">
                    <Icon className="w-10 h-10 text-liquid-gold group-hover:scale-110 transition-transform duration-700" />
                </div>
            </div>
            
            {/* Ambient Pulse */}
            <div className="absolute inset-0 border-2 border-liquid-gold/10 rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity" />
        </div>
        
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] mb-4 italic group-hover:text-liquid-gold transition-colors">{label}</p>
        <div className="flex items-baseline gap-2">
            <motion.p 
                key={value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-5xl font-black text-white italic tracking-tighter"
            >
                {value}
            </motion.p>
            <span className="text-sm font-black text-liquid-gold/40 uppercase tracking-widest">%</span>
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
        <div className="h-[90vh] flex flex-col items-center justify-center gap-10 relative overflow-hidden bg-brand-dark">
            <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/5 via-transparent to-transparent"></div>
            
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                className="w-32 h-32 border-2 border-white/5 rounded-full relative p-4"
            >
                <div className="absolute inset-0 border-t-2 border-liquid-gold rounded-full shadow-gold-glow animate-pulse"></div>
                <div className="w-full h-full bg-black/40 rounded-full backdrop-blur-xl flex items-center justify-center border border-white/5 shadow-inner">
                    <CpuIcon className="w-12 h-12 text-liquid-gold/40 animate-pulse" />
                </div>
            </motion.div>
            
            <div className="text-center space-y-3">
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    className="text-xs font-black uppercase tracking-[0.8em] text-liquid-gold italic"
                >
                    Neural Synchronization
                </motion.p>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Initializing Atelier Core Alpha-7</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-16 pb-40 px-6 sm:px-14 relative overflow-hidden pt-10">
            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none"></div>

            {/* --- HERO COMMAND CENTER --- */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="relative group"
            >
                {/* Dynamic Background Accents */}
                <div className="absolute top-0 right-0 w-[80%] h-full bg-liquid-gold/[0.03] blur-[180px] -mr-40 group-hover:bg-liquid-gold/[0.06] transition-all duration-1000 -z-10 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/[0.02] blur-[150px] -ml-40 pointer-events-none -z-10"></div>
                
                <div className="bg-white/[0.01] backdrop-blur-3xl p-14 lg:p-24 overflow-hidden border border-white/10 rounded-[4rem] shadow-gold-glow-strong relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent"></div>
                    
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-20 relative z-10">
                        <div className="space-y-14 max-w-3xl">
                            <motion.div 
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-wrap items-center gap-8"
                            >
                                <span className="bg-liquid-gold/20 text-liquid-gold text-[10px] font-black px-6 py-2.5 rounded-2xl border border-liquid-gold/30 uppercase tracking-[0.5em] italic shadow-gold-glow-soft">
                                    Command Level: {currentUser.rol.toUpperCase()}
                                </span>
                                <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow animate-pulse"></div>
                                    <span>Core Status: Optimal</span>
                                </div>
                            </motion.div>
                            
                            <div className="space-y-6">
                                <motion.h1 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-7xl md:text-8xl lg:text-[10rem] font-black text-white leading-[0.85] tracking-tighter uppercase italic"
                                >
                                    Hail, <br />
                                    <span className="text-gold-gradient drop-shadow-gold text-glow-gold">{currentUser.nombre.split(' ')[0]}</span>
                                </motion.h1>
                                
                                <motion.p 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-2xl lg:text-3xl text-slate-400 font-medium leading-relaxed max-w-2xl tracking-tight"
                                >
                                    Intelligence engine reports <span className="text-white font-black underline decoration-liquid-gold/40 decoration-4 underline-offset-[12px]">{stats.totalActivos} active missions</span> across the production floor.
                                </motion.p>
                            </div>

                            {/* ALERT PULSE */}
                            <AnimatePresence>
                                {stats.webOrders.length > 0 && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="bg-liquid-gold/[0.04] border border-liquid-gold/20 p-10 rounded-[3rem] flex items-center gap-10 backdrop-blur-3xl shadow-gold-glow relative group/alert overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/[0.05] via-transparent to-transparent"></div>
                                        <div className="p-6 bg-liquid-gold rounded-[1.8rem] text-brand-dark shadow-gold-glow animate-float relative z-10">
                                            <GlobeAltIcon className="w-10 h-10" />
                                        </div>
                                        <div className="flex-1 relative z-10">
                                            <p className="text-white font-black uppercase text-[11px] tracking-[0.5em] italic">Inbound Web Signal</p>
                                            <p className="text-slate-500 text-[12px] mt-2 font-bold uppercase tracking-[0.2em]">{stats.webOrders.length} Pending requests intercepted in transit.</p>
                                        </div>
                                        <button 
                                            onClick={() => navigate('/trabajos')} 
                                            className="px-10 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-luxury hover:bg-liquid-gold transition-all duration-700 active:scale-95 relative z-10"
                                        >
                                            Synchronize
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex flex-wrap gap-8 pt-10">
                                <button onClick={() => navigate('/nuevo')} className="bg-white text-black px-14 py-7 text-[12px] font-black uppercase tracking-[0.5em] rounded-[2.5rem] shadow-luxury transition-all hover:bg-liquid-gold hover:scale-105 active:scale-95 flex items-center gap-5 group/btn">
                                    <AddIcon className="w-6 h-6 group-hover/btn:rotate-90 transition-transform duration-700" />
                                    <span>Deploy Mission</span>
                                </button>
                                <button onClick={() => setIsClientModalOpen(true)} className="px-12 py-7 border-2 border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 rounded-[2.5rem] text-slate-400 hover:text-white transition-all font-black uppercase text-[11px] tracking-[0.4em] flex items-center gap-5 group">
                                    <UserPlusIcon className="w-6 h-6 group-hover:text-liquid-gold transition-colors duration-500" /> 
                                    Register Identity
                                </button>
                            </div>
                        </div>

                        {/* --- CRITICAL PRIORITY CARD --- */}
                        {stats.priorityJob && (
                            <motion.div 
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                className="w-full lg:w-[480px] p-[2px] bg-gradient-to-br from-rose-500/40 via-liquid-gold/50 to-transparent rounded-[4.5rem] group/priority h-full"
                            >
                                <div className="bg-[#0a0a0a] backdrop-blur-3xl p-16 rounded-[4.4rem] relative overflow-hidden h-full flex flex-col justify-center border border-white/5">
                                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover/priority:opacity-20 transition-all duration-1000 scale-150 group-hover/priority:scale-125">
                                        <ActivityIcon className="w-64 h-64 text-rose-500" />
                                    </div>
                                    <div className="relative z-10 space-y-12">
                                        <div className="flex items-center gap-6">
                                            <div className="w-4 h-4 rounded-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)] animate-pulse"></div>
                                            <span className="text-[12px] font-black text-rose-500 uppercase tracking-[0.8em] italic">Atmospheric Urgency</span>
                                        </div>
                                        <div className="space-y-6">
                                            <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.5em] italic leading-none">Asset ID: #{stats.priorityJob.orden}</p>
                                            <h3 className="text-6xl font-black text-white leading-[0.9] uppercase tracking-tighter group-hover/priority:text-glow-rose transition-all duration-700 italic">{stats.priorityJob.titular}</h3>
                                            <div className="flex items-center gap-4 pt-4">
                                                <div className="h-[2px] w-12 bg-rose-500/30"></div>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Critical Production Path</p>
                                            </div>
                                        </div>
                                        <div className="pt-10">
                                            <button 
                                                onClick={() => navigate(`/trabajos/${stats.priorityJob?.id}`)} 
                                                className="w-full py-7 bg-rose-500/10 text-rose-400 border-2 border-rose-500/30 font-black text-[11px] uppercase tracking-[0.5em] rounded-[2rem] hover:bg-rose-500 hover:text-white transition-all duration-1000 shadow-xl"
                                            >
                                                Initialize Fast-Track
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* --- PERFORMANCE GAUGES --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pt-10">
                <LuxuryGauge label="Design Bandwidth" value={stats.designLoad} icon={PaletteIcon} delay={0.2} />
                <LuxuryGauge label="Industrial Torque" value={stats.productionLoad} icon={PrinterIcon} delay={0.4} />
                
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
                    whileHover={{ y: -15, borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                    className="bg-white/[0.01] backdrop-blur-3xl border border-white/10 p-12 rounded-[3.5rem] flex flex-col justify-between group overflow-hidden relative shadow-2xl transition-all duration-700"
                >
                    <div className="absolute -bottom-10 -right-10 p-12 opacity-[0.02] group-hover:opacity-15 transition-all duration-1000 group-hover:scale-110">
                        <TrendingUpIcon className="w-48 h-48 text-emerald-500" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] mb-8 italic">Atelier Daily Yield</p>
                        <div className="space-y-2">
                             <p className="text-6xl lg:text-7xl font-black text-emerald-500 italic tracking-tighter text-glow drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                {formatCurrency(stats.ingresosHoy).split(',')[0]}<span className="text-2xl opacity-40">.00</span>
                            </p>
                            <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.4em] italic flex items-center gap-3">
                                <BoltIcon className="w-4 h-4" /> Live Performance
                            </p>
                        </div>
                    </div>
                    <div className="mt-14 relative z-10">
                        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden mb-4">
                            <motion.div 
                                initial={{ x: '-100%' }} animate={{ x: 0 }} transition={{ delay: 1.5, duration: 2.5, ease: "circOut" }}
                                className="h-full bg-emerald-500 w-[85%] shadow-glow-emerald" 
                            />
                        </div>
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest text-right">Synchronization Index: 92%</p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}
                    whileHover={{ y: -15, borderColor: 'rgba(212, 175, 55, 0.3)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                    className="bg-white/[0.01] backdrop-blur-3xl border border-white/10 p-12 rounded-[3.5rem] flex flex-col justify-between group overflow-hidden relative shadow-2xl transition-all duration-700"
                >
                    <div className="absolute -top-14 -right-14 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="relative z-10">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] mb-6 italic group-hover:text-liquid-gold transition-colors">Vault Allocation</p>
                        <div className="flex items-baseline gap-4">
                            <p className="text-8xl font-black text-white tracking-tighter italic text-glow-gold">{stats.enVitrina}</p>
                            <span className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic opacity-40">Assets</span>
                        </div>
                        <div className="flex items-center gap-4 mt-8 px-6 py-2 bg-liquid-gold/10 rounded-full border border-liquid-gold/20 w-fit">
                            <ShieldCheckIcon className="w-4 h-4 text-liquid-gold" />
                            <p className="text-[9px] font-black text-liquid-gold uppercase tracking-[0.4em]">Finalized Readiness</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/retiros')} className="group/btn w-full py-6 mt-12 bg-white text-black rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.5em] shadow-luxury transition-all hover:bg-liquid-gold active:scale-95 relative z-10">
                        Dispatch Protocol
                    </button>
                </motion.div>
            </div>

            {/* --- FEED SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-10">
                <motion.div 
                    initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 0.8 }}
                    className="lg:col-span-8 bg-white/[0.01] backdrop-blur-3xl p-14 lg:p-20 rounded-[4rem] border border-white/10 shadow-2xl relative group/feed overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[100px] -mr-32 -mt-32 opacity-0 group-hover/feed:opacity-100 transition-opacity duration-1000"></div>
                    
                    <div className="flex justify-between items-start mb-20 relative z-10">
                        <div className="space-y-4">
                            <h3 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">Dynamic <span className="text-gold-gradient">Identities</span></h3>
                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] italic">Neural re-engagement matrix</p>
                        </div>
                        <div className="p-6 bg-white/[0.03] border-2 border-white/5 rounded-3xl shadow-inner text-liquid-gold/30 group-hover/feed:text-liquid-gold transition-colors duration-1000 group-hover/feed:rotate-12">
                            <SparklesIcon className="w-10 h-10"/>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                        {clientes.slice(0, 4).map((c, i) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 + (i * 0.1), duration: 0.8 }}
                                key={c.id} 
                                className="flex items-center justify-between p-10 bg-black/40 rounded-[3rem] border border-white/5 hover:border-liquid-gold/30 hover:bg-black/60 transition-all duration-700 group/client shadow-inner"
                            >
                                <div className="flex items-center gap-8 min-w-0">
                                    <div className="w-20 h-20 flex-shrink-0 bg-white/[0.03] rounded-3xl flex items-center justify-center font-black text-liquid-gold text-3xl border-2 border-white/5 group-hover/client:border-liquid-gold/30 group-hover/client:bg-liquid-gold group-hover/client:text-black transition-all duration-1000 shadow-inner">
                                        {c.nombre.charAt(0)}
                                    </div>
                                    <div className="min-w-0 space-y-2">
                                        <h4 className="font-black text-white uppercase tracking-tight text-xl group-hover/client:text-liquid-gold transition-colors duration-700 truncate italic">{c.nombre}</h4>
                                        <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.4em] italic">{c.regimen}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => navigate(`/clientes?reengage=${c.id}`)} 
                                    className="p-5 bg-white/5 hover:bg-liquid-gold text-slate-600 hover:text-black rounded-[1.5rem] transition-all duration-700 shadow-luxury border border-white/10 group/btn-c"
                                >
                                    <MessageCircleIcon className="w-7 h-7 group-hover/btn-c:scale-125 transition-transform" />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4, duration: 0.8 }}
                    className="lg:col-span-4 bg-[#0a0a0a] rounded-[4rem] p-16 text-white shadow-gold-glow-strong border border-white/10 relative overflow-hidden flex flex-col justify-between group/monitor"
                >
                    <div className="absolute -top-10 -right-10 p-16 opacity-[0.03] group-hover/monitor:opacity-20 transition-all duration-[2s] group-hover/monitor:scale-125">
                        <MonitorIcon className="w-80 h-80 text-liquid-gold" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/[0.05] via-transparent to-transparent pointer-events-none"></div>
                    
                    <div className="relative z-10 space-y-12">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-[2px] bg-liquid-gold shadow-gold-glow"></div>
                            <span className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.8em] italic">Atelier Monitor</span>
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-6xl font-black uppercase tracking-tighter italic text-glow-gold leading-[0.9]">CORE <br /> <span className="text-white opacity-40">SYNC</span></h3>
                            <p className="text-slate-500 text-[13px] font-bold uppercase tracking-[0.35em] leading-loose max-w-[240px] italic">Atmospheric control of industrial production lines and robotic tirage protocols.</p>
                        </div>
                        
                        <div className="space-y-8 pt-6">
                            {[ 
                                { label: 'Flow Sequence', icon: AdjustmentsHorizontalIcon },
                                { label: 'SRI Vault Protocol', icon: ShieldCheckIcon },
                                { label: 'Mission Tracker', icon: RocketLaunchIcon }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-6 group/item cursor-crosshair">
                                    <div className="w-3 h-3 rounded-full bg-liquid-gold/20 border border-liquid-gold/40 group-hover/item:bg-liquid-gold transition-colors duration-500 shadow-gold-glow-sm"></div> 
                                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600 group-hover/item:text-white transition-colors italic">{item.label}</span>
                                    <item.icon className="w-5 h-5 text-slate-800 ml-auto opacity-0 group-hover/item:opacity-40 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/kds')} 
                        className="group/btn w-full py-8 mt-20 bg-white text-black rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.6em] shadow-luxury transition-all hover:bg-liquid-gold hover:scale-105 active:scale-95 flex items-center justify-center gap-8 relative z-10 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-[1.5s]"></div>
                        INITIALIZE <ArrowRightIcon className="w-8 h-8 group-hover/btn:translate-x-4 transition-transform duration-1000"/>
                    </button>
                </motion.div>
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
