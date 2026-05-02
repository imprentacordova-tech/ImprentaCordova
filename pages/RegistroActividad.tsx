import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { getActivityLog, getLogStats, purgeOldEntries, exportLogAsCSV, ActivityEntry, logActivity } from '../services/activityLogService';
import { 
    HomeIcon, ArrowDownTrayIcon, SearchIcon, Loader2Icon, 
    ShieldCheckIcon, LockIcon, BoxIcon, CpuIcon, ActivityIcon, 
    BoltIcon, UsersIcon, SparklesIcon, CheckCircleIcon, RocketLaunchIcon, 
    ShieldExclamationIcon, FingerPrintIcon, ClockIcon, DocumentIcon,
    ExclamationTriangleIcon, ChevronRightIcon, ChevronLeftIcon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const ACTION_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    LOGIN: { label: 'Auth Success', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: ShieldCheckIcon },
    LOGOUT: { label: 'Session End', color: 'text-slate-600 bg-slate-50 border-slate-100', icon: LockIcon },
    CREAR_ORDEN: { label: 'Mission Created', color: 'text-brand-blue bg-sky-50 border-sky-100', icon: BoxIcon },
    EDITAR_ORDEN: { label: 'Asset Updated', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: CpuIcon },
    CAMBIO_ESTADO: { label: 'Status Shift', color: 'text-purple-600 bg-purple-50 border-purple-100', icon: ActivityIcon },
    RETIRO_PROCESADO: { label: 'Dispatch Flux', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: BoltIcon },
    CREAR_CLIENTE: { label: 'Entity Registered', color: 'text-cyan-600 bg-cyan-50 border-cyan-100', icon: UsersIcon },
    EDITAR_CLIENTE: { label: 'Entity Modified', color: 'text-cyan-600 bg-cyan-50 border-cyan-100', icon: UsersIcon },
    CREAR_USUARIO: { label: 'Identity Created', color: 'text-violet-600 bg-violet-50 border-violet-100', icon: SparklesIcon },
    EDITAR_USUARIO: { label: 'Identity Updated', color: 'text-violet-600 bg-violet-50 border-violet-100', icon: SparklesIcon },
    TOGGLE_USUARIO: { label: 'Access Toggle', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: ShieldCheckIcon },
    CAMBIO_CONFIG: { label: 'Core Adjustment', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: CpuIcon },
    SYNC_CLOUD: { label: 'Neural Sync', color: 'text-sky-600 bg-sky-50 border-sky-100', icon: SparklesIcon },
    SEED_CATALOGO: { label: 'Matrix Loaded', color: 'text-lime-600 bg-lime-50 border-lime-100', icon: DocumentIcon },
    EXPORTAR_PDF: { label: 'Artifact Export', color: 'text-orange-600 bg-orange-50 border-orange-100', icon: DocumentIcon },
    ENVIAR_WHATSAPP: { label: 'Comms Uplink', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: BoltIcon },
    ABONO_REGISTRADO: { label: 'Credit Flux', color: 'text-green-600 bg-green-50 border-green-100', icon: BoltIcon },
    ARTE_APROBADO: { label: 'Visual Approval', color: 'text-pink-600 bg-pink-50 border-pink-100', icon: SparklesIcon },
    FOTO_CAPTURADA: { label: 'Optical Scan', color: 'text-indigo-600 bg-indigo-50 border-indigo-100', icon: SparklesIcon },
    ACCESO_MODULO: { label: 'Module Access', color: 'text-slate-600 bg-slate-50 border-slate-100', icon: ShieldCheckIcon },
    CREAR_PROVEEDOR: { label: 'Supplier Created', color: 'text-teal-600 bg-teal-50 border-teal-100', icon: UsersIcon },
    EDITAR_PROVEEDOR: { label: 'Supplier Updated', color: 'text-teal-600 bg-teal-50 border-teal-100', icon: UsersIcon },
    BORRAR_PROVEEDOR: { label: 'Supplier Removed', color: 'text-red-600 bg-red-50 border-red-100', icon: ExclamationTriangleIcon },
    AGENDAR_TAREA: { label: 'Task Scheduled', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: ClockIcon },
    COMPLETAR_TAREA: { label: 'Task Completed', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircleIcon },
    FINALIZADO_DIRECTO: { label: 'Direct Finish', color: 'text-orange-600 bg-orange-50 border-orange-100', icon: RocketLaunchIcon },
    INVENTARIO_MODIFICADO: { label: 'Asset Mutation', color: 'text-cyan-600 bg-cyan-50 border-cyan-100', icon: BoxIcon },
    ALERTA_STOCK: { label: 'System Alert', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: ShieldExclamationIcon },
};

const KpiCard: React.FC<{ 
    label: string, 
    value: string | number, 
    icon: any,
    color?: string 
}> = ({ label, value, icon: Icon, color = "text-brand-blue" }) => (
    <motion.div 
        whileHover={{ y: -4, transition: { duration: 0.3 } }}
        className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group"
    >
        <div className="flex flex-col gap-4 relative z-10">
            <div className={`w-12 h-12 rounded-2xl ${color.replace('text-', 'bg-').replace('600', '50')} flex items-center justify-center ${color} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">{value}</p>
            </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <Icon className="w-24 h-24" />
        </div>
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
            console.error('[RegistroActividad] Error:', error);
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
        <div className="max-w-[1400px] mx-auto space-y-12 pb-40 pt-6 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-14 h-14 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center transition-all shadow-sm group"
                    >
                        <HomeIcon className="w-5 h-5 text-slate-400 group-hover:text-brand-blue" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 bg-brand-blue rounded-full"></span>
                            <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest">Auditoría Operativa</p>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Monitor de <span className="text-brand-blue">Actividad</span></h1>
                    </div>
                </div>

                <button 
                    onClick={handleExportCSV}
                    className="h-14 px-8 bg-brand-blue text-white font-bold rounded-2xl shadow-lg shadow-sky-100 flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Exportar Datos
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard label="Registros Totales" value={stats.totalEntries} icon={FingerPrintIcon} color="text-slate-600" />
                    <KpiCard label="Flujo Hoy" value={stats.todayEntries} icon={ActivityIcon} color="text-brand-blue" />
                    <KpiCard label="Nodos Activos" value={stats.uniqueUsers} icon={UsersIcon} color="text-indigo-600" />
                    <KpiCard label="Carga de Memoria" value={`${stats.storageUsedKB} KB`} icon={CpuIcon} color="text-emerald-600" />
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input 
                            type="text" 
                            placeholder="Buscar en el registro (Hash, Usuario, Detalle)..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:bg-white focus:border-brand-blue/30 transition-all"
                        />
                    </div>
                    
                    <div className="flex gap-4">
                        <select 
                            value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(0); }}
                            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:bg-white transition-all"
                        >
                            <option value="">Todas las acciones</option>
                            {uniqueActions.map(a => (
                                <option key={a} value={a}>{ACTION_LABELS[a]?.label || a}</option>
                            ))}
                        </select>

                        <select 
                            value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(0); }}
                            className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-600 outline-none cursor-pointer hover:bg-white transition-all"
                        >
                            <option value="">Todos los usuarios</option>
                            {uniqueUsers.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Segmento <span className="text-brand-blue">{page + 1} de {totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 0} 
                                onClick={() => setPage(p => p - 1)} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <button 
                                disabled={page >= totalPages - 1} 
                                onClick={() => setPage(p => p + 1)} 
                                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-6 bg-white rounded-[3rem] border border-slate-100">
                            <Loader2Icon className="w-12 h-12 text-brand-blue animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Sincronizando Historial...</p>
                        </div>
                    ) : paginated.length > 0 ? (
                        paginated.map((entry, idx) => {
                            const actionMeta = ACTION_LABELS[entry.accion] || { label: entry.accion, color: 'text-slate-600 bg-slate-50 border-slate-100', icon: ActivityIcon };
                            const { date, time } = formatTimestamp(entry.timestamp);

                            return (
                                <motion.div 
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (idx % 20) * 0.02 }}
                                    className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-blue/10 transition-all group flex flex-col sm:flex-row items-center gap-8"
                                >
                                    {/* Time */}
                                    <div className="flex flex-col items-center sm:items-start shrink-0 min-w-[100px]">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{date}</span>
                                        <span className="text-xl font-black text-slate-900 tracking-tight">{time}</span>
                                    </div>

                                    {/* Action Icon */}
                                    <div className={`w-16 h-16 rounded-2xl shrink-0 border-2 flex items-center justify-center transition-all duration-500 group-hover:scale-110 ${actionMeta.color}`}>
                                        <actionMeta.icon className="w-8 h-8" />
                                    </div>

                                    {/* Detail */}
                                    <div className="flex-1 min-w-0 text-center sm:text-left">
                                        <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start mb-2">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${actionMeta.color}`}>
                                                {actionMeta.label}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                {entry.usuario} • {entry.modulo}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-brand-blue transition-colors">{entry.detalle}</h3>
                                    </div>

                                    {/* Integrity Hash */}
                                    <div className="shrink-0 text-right hidden lg:block">
                                        <div className="flex items-center justify-end gap-2 mb-1">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Hash de Integridad</span>
                                            <FingerPrintIcon className="w-3 h-3 text-slate-200" />
                                        </div>
                                        <code className="text-[9px] font-mono text-slate-400 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                            #{entry.hash.substring(0, 12).toUpperCase()}
                                        </code>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="py-40 bg-white rounded-[3rem] border border-slate-100 text-center">
                            <ShieldExclamationIcon className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                            <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Registro Vacío</h3>
                            <p className="text-[10px] font-bold text-slate-200 uppercase mt-2 tracking-widest">No se detectaron registros en este segmento</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RegistroActividadPage;
