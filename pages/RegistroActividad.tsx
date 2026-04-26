import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getActivityLog, getLogStats, purgeOldEntries, exportLogAsCSV, ActivityEntry, ActivityAction, logActivity } from '../services/activityLogService';
import { 
    ClockIcon, SearchIcon, ArrowDownTrayIcon, TrashIcon, ShieldCheckIcon, 
    Loader2Icon, ExclamationTriangleIcon, CheckCircleIcon, UsersIcon,
    DocumentIcon, BoxIcon, CpuIcon, BoltIcon, ActivityIcon,
    SparklesIcon, LockIcon, CircleStackIcon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const ACTION_LABELS: Record<ActivityAction, { label: string; color: string; icon: any }> = {
    LOGIN: { label: 'Auth Success', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', icon: ShieldCheckIcon },
    LOGOUT: { label: 'Session End', color: 'text-slate-400 border-white/10 bg-white/5', icon: LockIcon },
    CREAR_ORDEN: { label: 'Mission Created', color: 'text-liquid-gold border-liquid-gold/20 bg-liquid-gold/5', icon: BoxIcon },
    EDITAR_ORDEN: { label: 'Asset Updated', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5', icon: CpuIcon },
    CAMBIO_ESTADO: { label: 'Status Shift', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5', icon: ActivityIcon },
    RETIRO_PROCESADO: { label: 'Dispatch Flux', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', icon: BoltIcon },
    CREAR_CLIENTE: { label: 'Entity Registered', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5', icon: UsersIcon },
    EDITAR_CLIENTE: { label: 'Entity Modified', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5', icon: UsersIcon },
    CREAR_USUARIO: { label: 'Identity Created', color: 'text-violet-400 border-violet-500/20 bg-violet-500/5', icon: SparklesIcon },
    EDITAR_USUARIO: { label: 'Identity Updated', color: 'text-violet-400 border-violet-500/20 bg-violet-500/5', icon: SparklesIcon },
    TOGGLE_USUARIO: { label: 'Access Toggle', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5', icon: ShieldCheckIcon },
    CAMBIO_CONFIG: { label: 'Core Adjustment', color: 'text-rose-400 border-rose-500/20 bg-rose-500/5', icon: CpuIcon },
    SYNC_CLOUD: { label: 'Neural Sync', color: 'text-sky-400 border-sky-500/20 bg-sky-500/5', icon: CircleStackIcon },
    SEED_CATALOGO: { label: 'Matrix Loaded', color: 'text-lime-400 border-lime-500/20 bg-lime-500/5', icon: DocumentIcon },
    EXPORTAR_PDF: { label: 'Artifact Export', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5', icon: DocumentIcon },
    ENVIAR_WHATSAPP: { label: 'Comms Uplink', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', icon: BoltIcon },
    ABONO_REGISTRADO: { label: 'Credit Flux', color: 'text-green-400 border-green-500/20 bg-green-500/5', icon: BoltIcon },
    ARTE_APROBADO: { label: 'Visual Approval', color: 'text-pink-400 border-pink-500/20 bg-pink-500/5', icon: SparklesIcon },
    FOTO_CAPTURADA: { label: 'Optical Scan', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5', icon: SparklesIcon },
    ACCESO_MODULO: { label: 'Module Access', color: 'text-slate-400 border-white/10 bg-white/5', icon: ShieldCheckIcon },
    CREAR_PROVEEDOR: { label: 'Supplier Created', color: 'text-teal-400 border-teal-500/20 bg-teal-500/5', icon: UsersIcon },
    EDITAR_PROVEEDOR: { label: 'Supplier Updated', color: 'text-teal-400 border-teal-500/20 bg-teal-500/5', icon: UsersIcon },
    BORRAR_PROVEEDOR: { label: 'Supplier Removed', color: 'text-red-400 border-red-500/20 bg-red-500/5', icon: ExclamationTriangleIcon },
    AGENDAR_TAREA: { label: 'Task Scheduled', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5', icon: ClockIcon },
    COMPLETAR_TAREA: { label: 'Task Completed', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', icon: CheckCircleIcon },
};

const RegistroActividadPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: any }>();
    const [log, setLog] = useState<ActivityEntry[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState<string>('');
    const [filterUser, setFilterUser] = useState<string>('');
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 40;

    const refreshData = async () => {
        setLoading(true);
        try {
            await purgeOldEntries();
            const allLog = await getActivityLog();
            setLog(allLog);
            const logStats = await getLogStats();
            setStats(logStats);
        } catch (error) {
            console.error('[RegistroActividad] Error refreshing data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refreshData(); }, []);

    const uniqueUsers = useMemo(() => [...new Set(log.map(e => e.usuario))].sort(), [log]);
    const uniqueActions = useMemo(() => [...new Set(log.map(e => e.accion))].sort(), [log]);

    const filtered = useMemo(() => {
        let result = log;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(e => 
                e.detalle.toLowerCase().includes(lower) || 
                e.usuario.toLowerCase().includes(lower) ||
                e.hash.includes(lower)
            );
        }
        if (filterAction) result = result.filter(e => e.accion === filterAction);
        if (filterUser) result = result.filter(e => e.usuario === filterUser);
        return result;
    }, [log, searchTerm, filterAction, filterUser]);

    const paginated = useMemo(() => {
        const start = page * ITEMS_PER_PAGE;
        return filtered.slice(start, start + ITEMS_PER_PAGE);
    }, [filtered, page]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    const handleExportCSV = () => {
        const csv = exportLogAsCSV(log);
        logActivity(currentUser.nombre, currentUser.rol || 'Administrador', 'EXPORTAR_PDF', 'Exportación de log a CSV realizada', 'Auditoría');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ledger_activity_${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatTimestamp = (ts: string) => {
        const d = new Date(ts);
        return {
            date: d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }),
            time: d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-16 pb-40 px-6 sm:px-14 pt-10">
            {/* --- CINEMATIC HEADER --- */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.01] backdrop-blur-3xl p-14 lg:p-20 rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-liquid-gold/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-liquid-gold/10"></div>
                
                <div className="flex flex-col lg:flex-row justify-between items-end gap-12 relative z-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <span className="bg-liquid-gold/20 text-liquid-gold text-[10px] font-black px-6 py-2 rounded-full border border-liquid-gold/30 uppercase tracking-[0.5em] italic shadow-gold-glow-soft">Immutable Ledger System</span>
                            <div className="h-[1px] w-24 bg-white/10"></div>
                        </div>
                        <h1 className="text-6xl lg:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">Activity <span className="text-gold-gradient">Command Monitor</span></h1>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.3em] italic max-w-2xl">High-fidelity cryptographic audit trail across all production sectors. Purge protocol active: 90 cycles.</p>
                    </div>
                    
                    <button onClick={handleExportCSV} className="group/btn flex items-center gap-6 px-14 py-8 bg-white text-black rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-luxury hover:bg-liquid-gold transition-all duration-700 active:scale-95">
                        <ArrowDownTrayIcon className="w-6 h-6 group-hover/btn:translate-y-1 transition-transform" /> Export Artifact (CSV)
                    </button>
                </div>
            </motion.div>

            {/* --- KPIS GRID --- */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-6">
                    {[
                        { label: 'Total Cycles', value: stats.totalEntries, color: 'text-white' },
                        { label: 'Current Flux (Cycle)', value: stats.todayEntries, color: 'text-liquid-gold' },
                        { label: 'Active Identity Nodes', value: stats.uniqueUsers, color: 'text-white' },
                        { label: 'Memory Allocation', value: `${stats.storageUsedKB} KB`, color: 'text-white' }
                    ].map((st, i) => (
                        <motion.div 
                            key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                            className="bg-white/[0.01] backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/5 shadow-xl group hover:border-white/10 transition-all duration-700"
                        >
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic mb-4">{st.label}</p>
                            <p className={`text-5xl font-black ${st.color} italic tracking-tighter transition-all group-hover:scale-105 duration-1000 origin-left`}>{st.value}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* --- CONTROL TERMINAL --- */}
            <div className="bg-white/[0.01] backdrop-blur-2xl p-10 rounded-[3rem] border border-white/5 shadow-inner flex flex-wrap gap-8 items-center">
                <div className="relative flex-grow max-w-xl">
                    <SearchIcon className="absolute left-10 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="INPUT SEARCH QUERY: HASH / USER / DETAIL..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-20 pr-10 py-7 bg-black/40 border-2 border-white/5 focus:border-liquid-gold/30 rounded-[2rem] text-[12px] font-black text-white uppercase tracking-[0.3em] placeholder:text-slate-700 outline-none transition-all duration-700 italic" 
                    />
                </div>
                
                <div className="flex gap-6 h-full items-center">
                    <select 
                        value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(0); }}
                        className="px-10 py-7 bg-white/5 border-2 border-white/5 rounded-[1.8rem] text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.3em] outline-none focus:border-liquid-gold/30 transition-all cursor-pointer appearance-none italic"
                    >
                        <option value="" className="bg-brand-dark">Filter: All Sectors</option>
                        {uniqueActions.map(a => (
                            <option key={a} value={a} className="bg-brand-dark">{ACTION_LABELS[a]?.label || a}</option>
                        ))}
                    </select>

                    <select 
                        value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(0); }}
                        className="px-10 py-7 bg-white/5 border-2 border-white/5 rounded-[1.8rem] text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.3em] outline-none focus:border-liquid-gold/30 transition-all cursor-pointer appearance-none italic"
                    >
                        <option value="" className="bg-brand-dark">Filter: All Nodes</option>
                        {uniqueUsers.map(u => (
                            <option key={u} value={u} className="bg-brand-dark">{u}</option>
                        ))}
                    </select>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-4 ml-6 p-2 bg-white/5 rounded-2xl border border-white/5">
                            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-6 py-4 rounded-xl text-[10px] font-black text-white uppercase tracking-widest disabled:opacity-20 hover:bg-white/5 transition-all">Prev</button>
                            <span className="text-[10px] font-black text-liquid-gold/40 uppercase tracking-[0.4em] px-4 italic">{page + 1} / {totalPages}</span>
                            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-6 py-4 rounded-xl text-[10px] font-black text-white uppercase tracking-widest disabled:opacity-20 hover:bg-white/5 transition-all">Next</button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- LEDGER TIMELINE --- */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div key="loader" className="py-40 text-center space-y-8">
                            <Loader2Icon className="animate-spin w-20 h-20 text-liquid-gold/20 mx-auto" />
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[1em] italic">Synthesizing Ledger</p>
                        </div>
                    ) : paginated.length > 0 ? paginated.map((entry, idx) => {
                        const actionMeta = ACTION_LABELS[entry.accion] || { label: entry.accion, color: 'text-slate-400 border-white/10 bg-white/5', icon: ActivityIcon };
                        const { date, time } = formatTimestamp(entry.timestamp);

                        return (
                            <motion.div 
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (idx % 10) * 0.05 }}
                                className="group bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-liquid-gold/20 rounded-[2.5rem] p-8 transition-all duration-700 flex flex-col md:flex-row items-center gap-10 shadow-inner relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]"></div>
                                
                                {/* TIMESTAMP */}
                                <div className="flex flex-col items-center md:items-start min-w-[120px] relative z-10">
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] italic">{date}</span>
                                    <span className="text-xl font-black text-white italic tracking-tighter">{time}</span>
                                </div>

                                {/* CYBER BADGE */}
                                <div className="relative z-10">
                                    <div className={`p-6 rounded-[1.8rem] border-2 flex items-center justify-center transition-all duration-700 group-hover:scale-110 ${actionMeta.color} shadow-inner`}>
                                        <actionMeta.icon className="w-8 h-8" />
                                    </div>
                                </div>

                                {/* CONTENT */}
                                <div className="flex-1 min-w-0 space-y-3 relative z-10 text-center md:text-left">
                                    <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.5em] italic px-6 py-2 rounded-full border ${actionMeta.color}`}>
                                            {actionMeta.label}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">{entry.usuario} // Sector: {entry.modulo}</p>
                                        </div>
                                    </div>
                                    <p className="text-[18px] font-black text-white italic tracking-tight group-hover:text-liquid-gold transition-colors duration-500 uppercase truncate">{entry.detalle}</p>
                                </div>

                                {/* CRYPTO HASH */}
                                <div className="hidden xl:flex flex-col items-end gap-3 relative z-10 opacity-40 group-hover:opacity-100 transition-all duration-1000">
                                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest leading-none">Ledger Certificate</p>
                                    <code className="text-[10px] font-mono text-liquid-gold/40 border border-liquid-gold/10 px-4 py-2 rounded-xl bg-black/40 shadow-inner">
                                        #{entry.hash.toUpperCase()}
                                    </code>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div className="py-40 bg-white/[0.01] rounded-[5rem] border-4 border-dashed border-white/5 text-center flex flex-col items-center">
                            <ShieldCheckIcon className="w-32 h-32 text-slate-900 mb-10" />
                            <h3 className="text-3xl font-black text-slate-600 uppercase tracking-tighter italic">Ledger Null</h3>
                            <p className="text-slate-700 text-[11px] font-black uppercase tracking-[0.6em] mt-4 italic">No activity detected within the specified query parameters.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RegistroActividadPage;
