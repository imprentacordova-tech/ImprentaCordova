
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TrabajoEstado, User, Regimen } from '../types';
import { 
    SolidBoxIcon, AddIcon, Loader2Icon, 
    ArrowRightIcon, PaletteIcon, PrinterIcon,
    SparklesIcon, UserPlusIcon, MonitorIcon, MessageCircleIcon, GlobeAltIcon,
    TrendingUpIcon, ClockIcon, ActivityIcon,
    CpuIcon, RocketLaunchIcon, CircleStackIcon,
    BoltIcon, AdjustmentsHorizontalIcon, CubeTransparentIcon,
    BookOpenIcon, UsersIcon, ReceiptIcon, DocumentIcon,
    ChevronRightIcon, PlusIcon, GlobeIcon, TerminalIcon,
    ServerIcon, ShieldCheckIcon as ShieldIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductionPulse, AreaLoad, LiveLogs } from '../components/dashboard/TelemetryModule';
import { getActivityLog, ActivityEntry } from '../services/activityLogService';

// --- ACCIÓN PRINCIPAL (BOTONES DEL DASHBOARD) ---
const MainActionButton: React.FC<{ 
    label: string; 
    sub: string; 
    icon: any; 
    onClick: () => void; 
    color: 'blue' | 'yellow' | 'red' | 'brand-blue';
    delay?: number;
}> = ({ label, sub, icon: Icon, onClick, color, delay = 0 }) => {
    const colorMap = {
        blue: 'from-blue-50/50 to-white border-blue-100 text-blue-600',
        yellow: 'from-amber-50/50 to-white border-amber-100 text-amber-600',
        red: 'from-red-50/50 to-white border-red-100 text-red-600',
        'brand-blue': 'from-brand-blue/5 to-white border-brand-blue/20 text-brand-blue'
    };

    const iconBgMap = {
        blue: 'bg-blue-100/50 border-blue-200',
        yellow: 'bg-amber-100/50 border-amber-200',
        red: 'bg-red-100/50 border-red-200',
        'brand-blue': 'bg-brand-blue/10 border-brand-blue/20 shadow-blue-glow-sm'
    };

    return (
        <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClick}
            className={`group relative flex flex-col items-start p-8 rounded-[2.5rem] border bg-gradient-to-br ${colorMap[color]} backdrop-blur-xl transition-all duration-700 hover:scale-[1.03] active:scale-[0.97] shadow-xl hover:shadow-2xl overflow-hidden h-72 border-white/50`}
        >
            {/* Animated Laser Scan Effect */}
            <div className="absolute inset-x-0 h-[2px] bg-brand-blue/10 -top-full group-hover:top-full transition-all duration-[1.5s] ease-linear pointer-events-none z-20" />
            
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)]" />

            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12 text-slate-900">
                <Icon className="w-56 h-56" />
            </div>
            
            <div className={`w-16 h-16 rounded-2xl ${iconBgMap[color]} flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-700 border relative z-10 overflow-hidden shadow-sm`}>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className="w-8 h-8 relative z-10" />
            </div>
            
            <div className="mt-auto space-y-3 relative z-10 text-left w-full">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-current opacity-40 rounded-full" />
                    <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.4em] group-hover:opacity-100 transition-opacity">{sub}</p>
                </div>
                <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none transition-all">{label}</h3>
            </div>

            <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-white border border-slate-100 flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-blue-glow-sm">
                <ChevronRightIcon className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-0.5" />
            </div>
        </motion.button>
    );
};

// --- TACTICAL STATUS COMPONENT ---
const TacticalStatus: React.FC = () => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
                { label: 'CORE_UPTIME', value: '99.99%', sub: 'NUCLEO_ESTABLE', icon: ShieldIcon, color: 'text-emerald-500', glow: 'shadow-emerald-500/10' },
                { label: 'NEURAL_LINK', value: '12ms', sub: 'SYNC_REALTIME', icon: BoltIcon, color: 'text-blue-500', glow: 'shadow-blue-500/10' },
                { label: 'DATA_DENSITY', value: '1.4GB', sub: 'OPTIMIZADO', icon: CircleStackIcon, color: 'text-brand-blue', glow: 'shadow-blue-glow-sm' },
                { label: 'ACTIVE_NODES', value: '5 GLOBAL', sub: 'RED_INDUSTRIAL', icon: GlobeIcon, color: 'text-slate-600', glow: 'shadow-slate-500/10' }
            ].map((stat, i) => (
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    key={i} 
                    className="p-6 bg-white/60 backdrop-blur-xl rounded-[2rem] relative overflow-hidden group hover:border-brand-blue/20 transition-all duration-500 border border-slate-100 shadow-sm"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-all duration-700">
                        <stat.icon className="w-12 h-12 text-slate-900" />
                    </div>
                    <div className="relative z-10 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`w-1 h-3 rounded-full ${stat.color.replace('text-', 'bg-')} ${stat.glow}`} />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">{stat.label}</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black ${stat.color} tracking-tighter leading-none drop-shadow-sm group-hover:scale-105 transition-transform origin-left`}>{stat.value}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="h-[1px] flex-1 bg-slate-100 group-hover:bg-brand-blue/10 transition-colors" />
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.3em]">{stat.sub}</span>
                        </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent group-hover:via-brand-blue/20 transition-all duration-700" />
                </motion.div>
            ))}
        </div>
    );
};

const DashboardPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, loading, addCliente } = useData();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<ActivityEntry[]>([]);

    useEffect(() => {
        const fetchLogs = async () => {
            const data = await getActivityLog(20);
            setLogs(data);
        };
        fetchLogs();
        const interval = setInterval(fetchLogs, 30000); 
        return () => clearInterval(interval);
    }, []);
    
    const stats = useMemo(() => {
        if (loading || !trabajos) return null;
        const activeJobs = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO);
        const sriClients = clientes.filter(c => c.regimen?.toLowerCase().includes('sri') || c.ruc).length;
        
        return {
            totalActivos: activeJobs.length,
            clientesSri: sriClients,
            pendientes: activeJobs.filter(t => t.estado === TrabajoEstado.PENDIENTE).length,
            enProduccion: activeJobs.filter(t => t.estado === TrabajoEstado.PROCESO).length
        };
    }, [trabajos, clientes, loading]);

    const handleQuickAddClient = () => {
        navigate('/clientes?action=new');
    };

    if (loading || !stats) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-12 bg-brand-light">
            <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-brand-blue/20 animate-ping absolute inset-0" />
                <Loader2Icon className="animate-spin w-24 h-24 text-brand-blue relative z-10" />
            </div>
            <div className="text-center space-y-4">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-[0.4em] animate-pulse">Sincronizando Core</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">Enlace seguro con Supabase Realtime...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-light tactical-grid relative overflow-hidden">
            {/* Decoration Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-blue/5 blur-[100px] rounded-full -ml-20 -mb-20 pointer-events-none" />

            <div className="max-w-[1500px] mx-auto space-y-16 pb-20 px-6 md:px-12 pt-16 relative z-10">
                <TacticalStatus />
                
                {/* --- CABECERA CINEMÁTICA --- */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-slate-200 pb-16 relative">
                    <div className="flex gap-12 w-full xl:w-auto items-center">
                        <div className="w-[2px] h-40 bg-gradient-to-b from-transparent via-brand-blue/40 to-transparent hidden md:block shadow-blue-glow"></div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-5">
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-lg animate-pulse" />
                                    <div className="w-2 h-2 rounded-full bg-brand-blue shadow-lg animate-pulse" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-300 shadow-lg animate-pulse" style={{ animationDelay: '0.4s' }} />
                                </div>
                                <span className="text-[11px] font-black text-brand-blue uppercase tracking-[0.8em] opacity-80">ESTADO_ACTUAL_OPERATIVO • V5.2_PRECISION</span>
                            </div>
                            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black text-slate-900 tracking-[-0.05em] uppercase leading-[0.85] drop-shadow-sm">
                                IMPRENTA CÓRDOVA<br/>
                                <span className="text-brand-blue drop-shadow-blue-glow-sm">PRECISION CENTER</span>
                            </h1>
                            <p className="text-slate-500 text-xl font-light tracking-tight max-w-2xl">
                                Sincronización Maestra Activa para <span className="text-slate-900 font-black underline decoration-brand-blue/40 underline-offset-8">{currentUser.nombre}</span>. 
                                <span className="text-[10px] ml-4 font-mono text-brand-blue/40 tracking-[0.2em]">ACCESS: LEVEL_OVERLORD</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-start xl:items-end gap-8 w-full xl:w-auto">
                        <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] p-8 flex flex-wrap sm:flex-nowrap items-center gap-12 shadow-xl relative overflow-hidden group w-full xl:w-auto border border-slate-100">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            
                            <div className="text-center sm:text-left relative z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Manifiestos_Hoy</p>
                                <div className="flex items-end gap-2">
                                    <p className="text-5xl font-black text-slate-900 tracking-tighter group-hover:scale-110 transition-transform origin-left">{stats.totalActivos}</p>
                                    <p className="text-xs font-black text-slate-300 mb-2">UNIDADES</p>
                                </div>
                            </div>
                            
                            <div className="hidden sm:block w-[1px] h-16 bg-slate-100 relative z-10"></div>
                            
                            <div className="text-center sm:text-left relative z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Protocolo_Carga</p>
                                <div className="flex items-end gap-2">
                                    <p className="text-5xl font-black text-brand-blue tracking-tighter group-hover:scale-110 transition-transform origin-left">{stats.enProduccion}</p>
                                    <p className="text-xs font-black text-slate-300 mb-2">ACTIVO</p>
                                </div>
                            </div>
                            
                            <div className="absolute top-6 right-8">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-50"></div>
                                </div>
                            </div>
                        </div>
                        
                        <motion.button 
                            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(14, 165, 233, 0.2)' }} 
                            whileTap={{ scale: 0.98 }}
                            onClick={handleQuickAddClient}
                            className="flex items-center justify-center w-full xl:w-auto gap-5 bg-brand-blue text-white px-12 py-6 rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-blue-glow transition-all"
                        >
                            <UserPlusIcon className="w-6 h-6" />
                            Initialize_Client_Link
                        </motion.button>
                    </div>
                </div>

            {/* --- ACCIONES OPERATIVAS --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                <MainActionButton 
                    label="Catálogo" sub="Bóveda de Activos Gráficos" icon={BookOpenIcon} 
                    onClick={() => navigate('/productos')} color="blue" delay={0.1}
                />
                <MainActionButton 
                    label="Clientes SRI" sub="Soberanía Fiscal" icon={ShieldIcon} 
                    onClick={() => navigate('/clientes')} color="red" delay={0.2}
                />
                <MainActionButton 
                    label="Nuevo Pedido" sub="Protocolo de Manufactura" icon={RocketLaunchIcon} 
                    onClick={() => navigate('/nuevo')} color="brand-blue" delay={0.3}
                />
                <MainActionButton 
                    label="Manifiestos" sub="Estado Patrimonial" icon={ReceiptIcon} 
                    onClick={() => navigate('/trabajos')} color="yellow" delay={0.4}
                />
            </div>

            {/* --- SECCIÓN INFERIOR: TELEMETRÍA AVANZADA --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 bg-white/50 border border-slate-100 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-white/80 transition-colors shadow-sm">
                    <ProductionPulse trabajos={trabajos} />
                </div>

                <div className="lg:col-span-4 bg-white/50 border border-slate-100 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-white/80 transition-colors shadow-sm">
                    <AreaLoad trabajos={trabajos} />
                </div>

                <div className="lg:col-span-4 bg-white/80 border border-slate-200 rounded-[2.5rem] p-8 h-[300px] relative overflow-hidden group shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <LiveLogs logs={logs} />
                </div>
            </div>

            {/* --- FOOTER INFO --- */}
            <div className="pt-16 flex flex-col md:flex-row justify-between items-center gap-10 border-t border-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-14 h-14 bg-brand-blue rounded-[1.25rem] flex items-center justify-center text-white shadow-blue-glow group cursor-pointer hover:scale-110 transition-transform duration-500">
                        <SparklesIcon className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Córdova Nucleus <span className="text-brand-blue drop-shadow-blue-glow-sm">V5.2_PRECISION</span></h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Protocolo de Gestión Industrial de Alta Precisión</p>
                    </div>
                </div>

                <div className="flex gap-12 relative z-10">
                    <div className="text-right space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Seguridad_Core</p>
                        <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.1)]">CIFRADO_MILITAR_AES</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Estado_Red</p>
                        <p className="text-[11px] font-black text-brand-blue uppercase tracking-widest drop-shadow-blue-glow-sm">NODO_PRECISION_ONLINE</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
