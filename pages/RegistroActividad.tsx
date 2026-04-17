import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getActivityLog, getLogStats, purgeOldEntries, exportLogAsCSV, ActivityEntry, ActivityAction, logActivity } from '../services/activityLogService';
import { 
    ClockIcon, SearchIcon, ArrowDownTrayIcon, TrashIcon, ShieldCheckIcon, 
    Loader2Icon, ExclamationTriangleIcon, CheckCircleIcon, UsersIcon,
    DocumentIcon, BoxIcon
} from '../components/Icons';

const ACTION_LABELS: Record<ActivityAction, { label: string; color: string }> = {
    LOGIN: { label: 'Inicio de Sesión', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    LOGOUT: { label: 'Cierre de Sesión', color: 'text-slate-400 bg-white/5 border-white/10' },
    CREAR_ORDEN: { label: 'Orden Creada', color: 'text-liquid-gold bg-liquid-gold/10 border-liquid-gold/20' },
    EDITAR_ORDEN: { label: 'Orden Editada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    CAMBIO_ESTADO: { label: 'Cambio de Estado', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    RETIRO_PROCESADO: { label: 'Retiro Procesado', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    CREAR_CLIENTE: { label: 'Cliente Creado', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    EDITAR_CLIENTE: { label: 'Cliente Editado', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    CREAR_USUARIO: { label: 'Usuario Creado', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    EDITAR_USUARIO: { label: 'Usuario Editado', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    TOGGLE_USUARIO: { label: 'Estado de Usuario', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    CAMBIO_CONFIG: { label: 'Cambio de Config.', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    SYNC_CLOUD: { label: 'Sincronización', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    SEED_CATALOGO: { label: 'Carga de Catálogo', color: 'text-lime-400 bg-lime-500/10 border-lime-500/20' },
    EXPORTAR_PDF: { label: 'Exportar PDF', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    ENVIAR_WHATSAPP: { label: 'Envío WhatsApp', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    ABONO_REGISTRADO: { label: 'Abono Registrado', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    ARTE_APROBADO: { label: 'Arte Aprobado', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    FOTO_CAPTURADA: { label: 'Foto Capturada', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    ACCESO_MODULO: { label: 'Acceso a Módulo', color: 'text-slate-400 bg-white/5 border-white/10' },
};

const RegistroActividadPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: any }>();
    const [log, setLog] = useState<ActivityEntry[]>([]);
    const [stats, setStats] = useState<ReturnType<typeof getLogStats> | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState<string>('');
    const [filterUser, setFilterUser] = useState<string>('');
    const [page, setPage] = useState(0);
    const ITEMS_PER_PAGE = 50;

    const refreshData = () => {
        setLoading(true);
        const purged = purgeOldEntries(); // Auto-purga al entrar
        const allLog = getActivityLog();
        setLog(allLog.reverse()); // Más recientes primero
        setStats(getLogStats());
        setLoading(false);
        if (purged > 0) {
            console.log(`[RegistroActividad] Se purgaron ${purged} registros antiguos.`);
        }
    };

    useEffect(() => { refreshData(); }, []);

    const uniqueUsers = useMemo(() => {
        return [...new Set(log.map(e => e.usuario))].sort();
    }, [log]);

    const uniqueActions = useMemo(() => {
        return [...new Set(log.map(e => e.accion))].sort();
    }, [log]);

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
        if (filterAction) {
            result = result.filter(e => e.accion === filterAction);
        }
        if (filterUser) {
            result = result.filter(e => e.usuario === filterUser);
        }
        return result;
    }, [log, searchTerm, filterAction, filterUser]);

    const paginated = useMemo(() => {
        const start = page * ITEMS_PER_PAGE;
        return filtered.slice(start, start + ITEMS_PER_PAGE);
    }, [filtered, page]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    const handleExportCSV = () => {
        const csv = exportLogAsCSV();
        logActivity(currentUser.nombre, currentUser.rol || 'Administrador', 'SYNC_CLOUD', 'Exportación de log a CSV realizada', 'Auditoría');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registro_actividad_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatTimestamp = (ts: string) => {
        const d = new Date(ts);
        return {
            date: d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="p-6 lg:p-8 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] shadow-luxury relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
                <div className="flex flex-wrap justify-between items-end gap-6 relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Auditoría</p>
                        <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-tight">Registro de <span className="text-gold-gradient italic">Actividad</span></h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Sistema de trazabilidad tipo blockchain • Auto-purga: 90 días</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all duration-500">
                            <ArrowDownTrayIcon className="w-4 h-4" /> Exportar CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats KPIs */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-luxury">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Total Registros</p>
                        <p className="text-3xl font-black text-white mt-2">{stats.totalEntries.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-luxury">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Hoy</p>
                        <p className="text-3xl font-black text-liquid-gold mt-2">{stats.todayEntries}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-luxury">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Usuarios Únicos</p>
                        <p className="text-3xl font-black text-white mt-2">{stats.uniqueUsers}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-luxury">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Almacenamiento</p>
                        <p className="text-3xl font-black text-white mt-2">{stats.storageUsedKB} <span className="text-sm text-slate-500">KB</span></p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-grow max-w-md">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="BUSCAR POR DETALLE, USUARIO O HASH..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-12 pr-6 py-4 bg-white/5 border-2 border-white/5 focus:border-liquid-gold/30 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest placeholder:text-slate-600 outline-none focus:bg-white/10 transition-all duration-500" 
                    />
                </div>
                <select 
                    value={filterAction} 
                    onChange={e => { setFilterAction(e.target.value); setPage(0); }}
                    className="px-5 py-4 bg-white/5 border-2 border-white/5 rounded-2xl text-[11px] font-black text-white uppercase tracking-wider outline-none focus:border-liquid-gold/30 transition-all cursor-pointer appearance-none"
                >
                    <option value="" className="bg-brand-dark">Todas las Acciones</option>
                    {uniqueActions.map(a => (
                        <option key={a} value={a} className="bg-brand-dark">{ACTION_LABELS[a]?.label || a}</option>
                    ))}
                </select>
                <select 
                    value={filterUser} 
                    onChange={e => { setFilterUser(e.target.value); setPage(0); }}
                    className="px-5 py-4 bg-white/5 border-2 border-white/5 rounded-2xl text-[11px] font-black text-white uppercase tracking-wider outline-none focus:border-liquid-gold/30 transition-all cursor-pointer appearance-none"
                >
                    <option value="" className="bg-brand-dark">Todos los Usuarios</option>
                    {uniqueUsers.map(u => (
                        <option key={u} value={u} className="bg-brand-dark">{u}</option>
                    ))}
                </select>
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {filtered.length} registros encontrados
                    {(filterAction || filterUser || searchTerm) && (
                        <button onClick={() => { setSearchTerm(''); setFilterAction(''); setFilterUser(''); setPage(0); }} className="ml-4 text-red-400 hover:text-red-300 transition-colors">
                            Limpiar filtros
                        </button>
                    )}
                </p>
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-white uppercase disabled:opacity-30 hover:bg-white/10 transition-all">Anterior</button>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{page + 1} / {totalPages}</span>
                        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-white uppercase disabled:opacity-30 hover:bg-white/10 transition-all">Siguiente</button>
                    </div>
                )}
            </div>

            {/* Activity Timeline */}
            <div className="space-y-2">
                {loading ? (
                    <div className="py-20 text-center"><Loader2Icon className="animate-spin w-10 h-10 text-liquid-gold mx-auto" /></div>
                ) : paginated.length > 0 ? paginated.map((entry, idx) => {
                    const actionMeta = ACTION_LABELS[entry.accion] || { label: entry.accion, color: 'text-slate-400 bg-white/5 border-white/10' };
                    const { date, time } = formatTimestamp(entry.timestamp);

                    return (
                        <div key={entry.id} className="group bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-liquid-gold/10 rounded-2xl p-5 transition-all duration-500 flex items-center gap-5">
                            {/* Chain indicator */}
                            <div className="hidden md:flex flex-col items-center gap-1 min-w-[60px]">
                                <div className="w-2 h-2 rounded-full bg-liquid-gold/40 group-hover:bg-liquid-gold transition-all"></div>
                                {idx < paginated.length - 1 && <div className="w-[1px] h-6 bg-white/5"></div>}
                            </div>

                            {/* Timestamp */}
                            <div className="min-w-[100px] hidden lg:block">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{date}</p>
                                <p className="text-xs font-black text-white mt-0.5">{time}</p>
                            </div>

                            {/* User */}
                            <div className="min-w-[90px]">
                                <div className="w-8 h-8 rounded-lg bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center font-black text-liquid-gold text-xs">
                                    {entry.usuario.charAt(0)}
                                </div>
                            </div>

                            {/* Action Badge */}
                            <div className="min-w-[150px]">
                                <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${actionMeta.color}`}>
                                    {actionMeta.label}
                                </span>
                            </div>

                            {/* Detail */}
                            <div className="flex-grow min-w-0">
                                <p className="text-xs font-bold text-white truncate">{entry.detalle}</p>
                                <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">
                                    {entry.usuario} • {entry.modulo}
                                    <span className="lg:hidden ml-2">{date} {time}</span>
                                </p>
                            </div>

                            {/* Hash */}
                            <div className="hidden xl:block min-w-[80px] text-right">
                                <code className="text-[9px] font-mono text-slate-600 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                    #{entry.hash}
                                </code>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-32 bg-white/5 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-white/5 text-center flex flex-col items-center">
                        <ShieldCheckIcon className="w-20 h-20 text-slate-700 mb-6" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Sin Registros</h3>
                        <p className="text-slate-600 text-xs font-bold uppercase mt-2">No se encontraron actividades con los filtros seleccionados.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegistroActividadPage;
