import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { getActivityLog, getLogStats, purgeOldEntries, exportLogAsCSV, ActivityEntry, ActivityAction, logActivity } from '../services/activityLogService';
import { 
    ClockIcon, SearchIcon, ArrowDownTrayIcon, TrashIcon, ShieldCheckIcon, 
    Loader2Icon, ExclamationTriangleIcon, CheckCircleIcon, UsersIcon,
    DocumentIcon, BoxIcon, CpuIcon, BoltIcon, ActivityIcon,
    SparklesIcon, LockIcon, CircleStackIcon, RocketLaunchIcon, HomeIcon,
    ArrowRightIcon, AlertTriangleIcon, TerminalIcon, ShieldExclamationIcon, FingerPrintIcon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const ACTION_LABELS: Record<string, { label: string; color: string; icon: any }> = {
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
    FINALIZADO_DIRECTO: { label: 'Direct Finish', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5', icon: RocketLaunchIcon },
    INVENTARIO_MODIFICADO: { label: 'Asset Mutation', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5', icon: BoxIcon },
    ALERTA_STOCK: { label: 'System Alert', color: 'text-rose-500 border-rose-500/20 bg-rose-500/5', icon: ShieldExclamationIcon },
};

const MetricCard: React.FC<{ 
    label: string, 
    value: string | number, 
    colorClass?: string,
    subValue?: string
}> = ({ label, value, colorClass = "text-white", subValue }) => (
    <motion.div 
        whileHover={{ y: -5, transition: { duration: 0.4 } }}
        className="bg-white/[0.02] backdrop-blur-3xl p-10 relative group overflow-hidden border border-white/5 rounded-[2.5rem] shadow-2xl"
    >
        <div className="absolute inset-0 bg-architect-grid opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-1 h-3 bg-liquid-gold/40 rounded-full" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">{label}</span>
            </div>
            <p className={`text-4xl font-black tracking-tighter italic leading-none ${colorClass}`}>
                {value}
            </p>
            {subValue && (
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">{subValue}</p>
            )}
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-liquid-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    </motion.div>
);

const RegistroActividadPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: any }>();
    const navigate = useNavigate();
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
        <div className="max-w-[1600px] mx-auto space-y-16 pb-40 pt-10 px-4 sm:px-14 animate-fade-in">
            {/* --- CABECERA ELITE --- */}
            <div className="flex flex-col gap-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="flex items-center gap-10">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] transition-all group shadow-2xl backdrop-blur-xl"
                        >
                            <HomeIcon className="w-6 h-6 text-slate-500 group-hover:text-liquid-gold transition-colors" />
                        </button>
                        <div className="w-[1px] h-28 bg-gradient-to-b from-transparent via-liquid-gold/40 to-transparent hidden md:block"></div>
                        <div className="space-y-5">
                            <div className="flex items-center gap-6">
                                <div className="h-[2px] w-16 bg-liquid-gold rounded-full shadow-gold-glow"></div>
                                <p className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] italic">REGISTRO DE TELEMETRÍA FORENSE</p>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
                                ACTIVITY <span className="text-gold-gradient">MONITOR</span>
                            </h1>
                        </div>
                    </div>

                    <button 
                        onClick={handleExportCSV} 
                        className="flex items-center justify-center gap-6 px-14 py-7 bg-white text-brand-dark font-black rounded-[2rem] shadow-luxury uppercase text-[11px] tracking-[0.4em] group hover:bg-liquid-gold transition-all duration-700 italic active:scale-95"
                    >
                        <ArrowDownTrayIcon className="w-6 h-6 group-hover:translate-y-1 transition-transform duration-500" />
                        <span>EXPORT_CSV_ARTIFACT</span>
                    </button>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <MetricCard label="Cycles Logged" value={stats.totalEntries} subValue="TOTAL IMMUTABLE RECORDS" />
                        <MetricCard label="Current Flux" value={stats.todayEntries} colorClass="text-liquid-gold" subValue="RECORDS REGISTERED TODAY" />
                        <MetricCard label="Active Nodes" value={stats.uniqueUsers} subValue="UNIQUE IDENTITY ENTITIES" />
                        <MetricCard label="Memory Load" value={`${stats.storageUsedKB} KB`} subValue="LOCAL STORAGE ALLOCATION" />
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8 items-stretch lg:items-center">
                    <div className="relative group flex-grow">
                        <div className="absolute inset-0 bg-liquid-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-liquid-gold/40 group-focus-within:text-liquid-gold transition-colors" />
                        <input 
                            type="text" 
                            placeholder="INPUT QUERY: HASH // USER // DETALLE..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full pl-20 pr-10 py-8 bg-white/[0.02] border border-white/10 focus:border-liquid-gold/40 rounded-[2.5rem] text-[14px] font-black text-white uppercase tracking-[0.3em] placeholder:text-slate-800 outline-none focus:bg-white/[0.05] transition-all duration-700 backdrop-blur-md shadow-inner italic"
                        />
                    </div>
                    
                    <div className="flex flex-wrap sm:flex-nowrap gap-5">
                        <div className="relative group flex-grow sm:flex-grow-0">
                            <select 
                                value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(0); }}
                                className="w-full sm:w-64 pl-8 pr-12 py-8 bg-white/[0.02] border border-white/10 rounded-[2rem] text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.3em] outline-none focus:border-liquid-gold/30 transition-all cursor-pointer appearance-none italic"
                            >
                                <option value="" className="bg-slate-900">FILTER: ALL_SECTORS</option>
                                {uniqueActions.map(a => (
                                    <option key={a} value={a} className="bg-slate-900">{ACTION_LABELS[a]?.label || a}</option>
                                ))}
                            </select>
                            <ArrowRightIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 rotate-90 pointer-events-none" />
                        </div>

                        <div className="relative group flex-grow sm:flex-grow-0">
                            <select 
                                value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(0); }}
                                className="w-full sm:w-64 pl-8 pr-12 py-8 bg-white/[0.02] border border-white/10 rounded-[2rem] text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.3em] outline-none focus:border-liquid-gold/30 transition-all cursor-pointer appearance-none italic"
                            >
                                <option value="" className="bg-slate-900">FILTER: ALL_NODES</option>
                                {uniqueUsers.map(u => (
                                    <option key={u} value={u} className="bg-slate-900">{u}</option>
                                ))}
                            </select>
                            <ArrowRightIcon className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700 rotate-90 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-8 bg-white/[0.01] rounded-[2.5rem] border border-white/5">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Current Segment: <span className="text-liquid-gold">{page + 1} / {totalPages}</span></p>
                        <div className="flex items-center gap-4">
                            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-8 py-4 rounded-2xl bg-white/5 text-[10px] font-black text-white uppercase tracking-[0.4em] disabled:opacity-20 hover:bg-white/10 transition-all italic">PREVIOUS_SEGMENT</button>
                            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-8 py-4 rounded-2xl bg-white/5 text-[10px] font-black text-white uppercase tracking-[0.4em] disabled:opacity-20 hover:bg-white/10 transition-all italic">NEXT_SEGMENT</button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- TIMELINE FORENSE --- */}
            <div className="space-y-6 relative">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-liquid-gold/20 via-white/5 to-transparent hidden xl:block" />
                
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div key="loader" className="py-60 text-center space-y-10 bg-white/[0.01] rounded-[4rem] border-2 border-dashed border-white/5">
                            <div className="relative mx-auto w-24 h-24">
                                <Loader2Icon className="animate-spin w-24 h-24 text-liquid-gold/20" />
                                <div className="absolute inset-0 blur-2xl bg-liquid-gold/10 animate-pulse" />
                            </div>
                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-[1em] italic">SYNTHESIZING_LEDGER_RECORDS...</p>
                        </div>
                    ) : paginated.length > 0 ? paginated.map((entry, idx) => {
                        const actionMeta = ACTION_LABELS[entry.accion] || { label: entry.accion, color: 'text-slate-400 border-white/10 bg-white/5', icon: ActivityIcon };
                        const { date, time } = formatTimestamp(entry.timestamp);

                        return (
                            <motion.div 
                                key={entry.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: (idx % 10) * 0.05, duration: 0.6 }}
                                className="group relative"
                            >
                                <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 hover:border-liquid-gold/20 rounded-[3rem] p-10 transition-all duration-700 flex flex-col xl:flex-row items-center gap-12 shadow-luxury relative overflow-hidden group-hover:bg-white/[0.05]">
                                    <div className="absolute inset-0 bg-architect-grid opacity-[0.02] pointer-events-none" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-liquid-gold/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2s]" />
                                    
                                    {/* TIMESTAMP */}
                                    <div className="flex flex-col items-center xl:items-start min-w-[140px] relative z-10 shrink-0">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic mb-1">{date}</span>
                                        <span className="text-3xl font-black text-white italic tracking-tighter leading-none">{time}</span>
                                    </div>

                                    {/* BADGE DE ACCIÓN */}
                                    <div className="relative z-10 shrink-0">
                                        <div className={`w-20 h-20 rounded-[1.8rem] border-2 flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 ${actionMeta.color} shadow-2xl relative`}>
                                            <actionMeta.icon className="w-10 h-10" />
                                            <div className="absolute -inset-2 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity bg-current" />
                                        </div>
                                    </div>

                                    {/* CONTENIDO PRINCIPAL */}
                                    <div className="flex-1 min-w-0 space-y-5 relative z-10 text-center xl:text-left w-full">
                                        <div className="flex flex-wrap items-center gap-5 justify-center xl:justify-start">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.5em] italic px-6 py-2.5 rounded-full border ${actionMeta.color} shadow-lg`}>
                                                {actionMeta.label}
                                            </span>
                                            <div className="h-1 w-1 rounded-full bg-slate-800" />
                                            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">{entry.usuario} <span className="mx-2 opacity-20">//</span> SECTOR: {entry.modulo}</p>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter group-hover:text-liquid-gold transition-all duration-500 uppercase leading-tight line-clamp-2">{entry.detalle}</h3>
                                    </div>

                                    {/* HASH DE INTEGRIDAD */}
                                    <div className="flex flex-col items-center xl:items-end gap-3 relative z-10 shrink-0 bg-black/40 xl:bg-transparent p-6 xl:p-0 rounded-2xl border xl:border-0 border-white/5 w-full xl:w-auto">
                                        <div className="flex items-center gap-3">
                                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] leading-none italic">Ledger Integrity Hash</p>
                                            <FingerPrintIcon className="w-3 h-3 text-slate-800" />
                                        </div>
                                        <code className="text-[10px] font-mono text-liquid-gold/30 px-6 py-3 rounded-xl border border-liquid-gold/10 bg-black/60 shadow-inner group-hover:text-liquid-gold/60 group-hover:border-liquid-gold/30 transition-all duration-700">
                                            #{entry.hash.toUpperCase()}
                                        </code>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div className="py-60 bg-white/[0.01] backdrop-blur-xl border-4 border-dashed border-white/5 rounded-[5rem] text-center flex flex-col items-center justify-center">
                            <ShieldExclamationIcon className="w-32 h-32 text-slate-900 mb-12" />
                            <h3 className="text-4xl font-black text-slate-800 uppercase tracking-[0.6em] italic">LEDGER_EMPTY</h3>
                            <p className="text-slate-900 text-xs font-black uppercase mt-6 tracking-[1em] italic opacity-30">NO_ACTIVITY_TELEMETRY_DETECTED_IN_THIS_SEGMENT</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RegistroActividadPage;
