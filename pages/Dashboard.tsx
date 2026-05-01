import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TrabajoEstado, User, Regimen } from '../types';
import { 
    SolidBoxIcon, AddIcon, Loader2Icon, 
    ArrowRightIcon, PaletteIcon, PrinterIcon,
    SparklesIcon, UserPlusIcon, MonitorIcon, MessageCircleIcon, GlobeAltIcon,
    TrendingUpIcon, ShieldCheckIcon, ClockIcon, ActivityIcon,
    CpuIcon, RocketLaunchIcon, CircleStackIcon,
    BoltIcon, AdjustmentsHorizontalIcon, CubeTransparentIcon,
    BookOpenIcon, UsersIcon, ReceiptIcon, DocumentIcon,
    ChevronRightIcon, PlusIcon
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
    color: 'blue' | 'yellow' | 'red' | 'gold';
    delay?: number;
}> = ({ label, sub, icon: Icon, onClick, color, delay = 0 }) => {
    const colorMap = {
        blue: 'from-blue-600/20 to-blue-900/40 border-blue-500/30 text-blue-400',
        yellow: 'from-yellow-600/20 to-yellow-900/40 border-yellow-500/30 text-yellow-400',
        red: 'from-brand-red/20 to-brand-red/40 border-brand-red/30 text-brand-red',
        gold: 'from-liquid-gold/20 to-liquid-gold/40 border-liquid-gold/30 text-liquid-gold'
    };

    const iconBgMap = {
        blue: 'bg-blue-500/20',
        yellow: 'bg-yellow-500/20',
        red: 'bg-brand-red/20',
        gold: 'bg-liquid-gold/20'
    };

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            onClick={onClick}
            className={`group relative flex flex-col items-start p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border bg-gradient-to-br ${colorMap[color]} backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-2xl overflow-hidden h-40 sm:h-56`}
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s] ease-in-out" />
            </div>

            <div className="absolute left-0 w-full h-[1px] bg-white/10 top-0 group-hover:top-full transition-all duration-[3s] ease-linear pointer-events-none" />

            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:scale-125 group-hover:rotate-6">
                <Icon className="w-32 h-32" />
            </div>
            
            <div className={`w-12 h-12 rounded-2xl ${iconBgMap[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 border border-white/5 relative z-10`}>
                <Icon className="w-6 h-6" />
            </div>
            
            <div className="mt-auto space-y-1 relative z-10 text-left">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-[-0.04em] italic">{label}</h3>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em]">{sub}</p>
            </div>

            <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all group-hover:scale-110">
                <ChevronRightIcon className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>
        </motion.button>
    );
};

// --- TACTICAL STATUS COMPONENT ---
const TacticalStatus: React.FC = () => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
                { label: 'Uptime', value: '99.98%', sub: 'SISTEMA ESTABLE', icon: ShieldCheckIcon, color: 'text-emerald-400' },
                { label: 'Latencia', value: '14ms', sub: 'SYNC REALTIME', icon: BoltIcon, color: 'text-blue-400' },
                { label: 'Memoria', value: '1.2GB', sub: 'OPTIMIZADO', icon: CircleStackIcon, color: 'text-liquid-gold' },
                { label: 'Nodos', value: '3 Active', sub: 'RED INDUSTRIAL', icon: GlobeAltIcon, color: 'text-purple-400' }
            ].map((stat, i) => (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-all">
                        <stat.icon className="w-8 h-8" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{stat.label}</span>
                        <span className={`text-xl font-black ${stat.color} tracking-tighter italic`}>{stat.value}</span>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${stat.color.replace('text-', 'bg-')}`} />
                            <span className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">{stat.sub}</span>
                        </div>
                    </div>
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
        // En un escenario real, esto abriría un modal de creación rápida.
        // Por ahora, navegamos a clientes con un flag.
        navigate('/clientes?action=new');
    };

    if (loading || !stats) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-12 bg-brand-dark">
            <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-liquid-gold/20 animate-ping absolute inset-0" />
                <Loader2Icon className="animate-spin w-24 h-24 text-liquid-gold relative z-10" />
            </div>
            <div className="text-center space-y-4">
                <h3 className="text-2xl font-black text-white uppercase tracking-[0.4em] animate-pulse">Sincronizando Core</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest text-center">Estableciendo enlace seguro con Supabase Realtime...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-16 pb-20 px-4 md:px-0 pt-10">
            <TacticalStatus />
            
            {/* --- CABECERA --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-white/5 pb-12">
                <div className="flex gap-10 w-full xl:w-auto">
                    <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-liquid-gold/40 to-transparent hidden md:block"></div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)] animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                            <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em]">Estado del Sistema • v5.0</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-[-0.04em] uppercase italic leading-none">
                            IMPRENTA CÓRDOVA <span className="text-gold-gradient">Elite</span>
                        </h1>
                        <p className="text-slate-500 text-lg font-light tracking-tight italic">
                            Sincronización Maestra para <span className="text-white font-bold">{currentUser.nombre.split(' ')[0]}</span>.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-start xl:items-end gap-6 w-full xl:w-auto mt-6 xl:mt-0">
                    <div className="bg-black/60 border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-wrap sm:flex-nowrap items-center gap-6 sm:gap-10 backdrop-blur-3xl shadow-luxury relative overflow-hidden group w-full xl:w-auto justify-between sm:justify-start">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
                        <div className="text-center sm:text-left relative z-10 flex-1 sm:flex-none">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Manifiestos en Curso</p>
                            <p className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter group-hover:scale-110 transition-transform origin-left">{stats.totalActivos}</p>
                        </div>
                        <div className="hidden sm:block w-[1px] h-12 bg-white/10 relative z-10"></div>
                        <div className="text-center sm:text-left relative z-10 flex-1 sm:flex-none">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Fase de Despliegue</p>
                            <p className="text-3xl sm:text-4xl font-black text-blue-400 italic tracking-tighter group-hover:scale-110 transition-transform origin-left">{stats.enProduccion}</p>
                        </div>
                        <div className="absolute top-4 right-4 flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-75"></div>
                        </div>
                    </div>
                    
                    <motion.button 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={handleQuickAddClient}
                        className="flex items-center justify-center w-full xl:w-auto gap-4 bg-liquid-gold text-brand-blue px-8 py-4 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-gold-glow italic"
                    >
                        <UserPlusIcon className="w-5 h-5" />
                        Vincular Nuevo Cliente
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
                    label="Clientes SRI" sub="Soberanía Fiscal" icon={ShieldCheckIcon} 
                    onClick={() => navigate('/clientes')} color="red" delay={0.2}
                />
                <MainActionButton 
                    label="Nuevo Pedido" sub="Protocolo de Manufactura" icon={RocketLaunchIcon} 
                    onClick={() => navigate('/nuevo')} color="gold" delay={0.3}
                />
                <MainActionButton 
                    label="Manifiestos" sub="Estado Patrimonial" icon={ReceiptIcon} 
                    onClick={() => navigate('/trabajos')} color="yellow" delay={0.4}
                />
            </div>

            {/* --- SECCIÓN INFERIOR: TELEMETRÍA AVANZADA --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-white/[0.02] transition-colors">
                    <ProductionPulse trabajos={trabajos} />
                </div>

                <div className="lg:col-span-4 bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:bg-white/[0.02] transition-colors">
                    <AreaLoad trabajos={trabajos} />
                </div>

                <div className="lg:col-span-4 bg-black/40 border border-white/10 rounded-[2.5rem] p-8 h-[300px] relative overflow-hidden group shadow-gold-glow-soft">
                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <LiveLogs logs={logs} />
                </div>
            </div>

            {/* --- FOOTER INFO --- */}
            <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-white/5 opacity-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-liquid-gold rounded-xl flex items-center justify-center text-black shadow-gold-glow">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-white uppercase tracking-widest italic">Córdova Nucleus <span className="text-liquid-gold">v5.0</span></h4>
                        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Arquitectura de gestión industrial para la elite</p>
                    </div>
                </div>
                <div className="flex gap-8">
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Núcleo de Datos</p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest italic">Cifrado AES-256</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Enlace Técnico</p>
                        <p className="text-[10px] font-bold text-liquid-gold uppercase tracking-widest italic">Maestro Sincronizado</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
