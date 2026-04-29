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
    BoltIcon, AdjustmentsHorizontalIcon, CubeTransparentIcon,
    BookOpenIcon, UsersIcon, ReceiptIcon, DocumentIcon,
    ChevronRightIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';

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
            className={`group relative flex flex-col items-start p-6 rounded-[2rem] border bg-gradient-to-br ${colorMap[color]} backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-2xl overflow-hidden h-56`}
        >
            {/* Holographic Sheen Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s] ease-in-out" />
            </div>

            {/* Industrial Internal Scanline */}
            <div className="absolute left-0 w-full h-[1px] bg-white/10 top-0 group-hover:top-full transition-all duration-[3s] ease-linear pointer-events-none" />

            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-all duration-700 group-hover:scale-125 group-hover:rotate-6">
                <Icon className="w-32 h-32" />
            </div>
            
            <div className={`w-12 h-12 rounded-2xl ${iconBgMap[color]} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 border border-white/5 relative z-10`}>
                <Icon className="w-6 h-6" />
                <div className="absolute inset-0 rounded-2xl bg-white/20 scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-0 transition-all duration-700" />
            </div>
            
            <div className="mt-auto space-y-1 relative z-10">
                <h3 className="text-xl font-black text-white uppercase tracking-[-0.04em] italic text-left">{label}</h3>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em] text-left">{sub}</p>
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
    const { trabajos, clientes, loading } = useData();
    const navigate = useNavigate();
    
    const stats = useMemo(() => {
        if (loading || !trabajos) return null;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        const activeJobs = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO);
        const sriClients = clientes.filter(c => c.regimen?.toLowerCase().includes('sri') || c.ruc).length;
        
        return {
            totalActivos: activeJobs.length,
            clientesSri: sriClients,
            pendientes: activeJobs.filter(t => t.estado === TrabajoEstado.PENDIENTE).length,
            enProduccion: activeJobs.filter(t => t.estado === TrabajoEstado.PROCESO).length
        };
    }, [trabajos, clientes, loading]);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/5 pb-12">
                <div className="flex gap-10">
                    <div className="w-[1px] h-32 bg-gradient-to-b from-transparent via-liquid-gold/40 to-transparent hidden md:block"></div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)] animate-pulse" style={{ animationDelay: '0.2s' }} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" style={{ animationDelay: '0.4s' }} />
                                </div>
                                <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em]">Estado del Sistema • v5.0</span>
                            </div>
                             <h1 className="text-5xl sm:text-6xl font-black text-white tracking-[-0.04em] uppercase italic leading-none">
                                IMPRENTA CÓRDOVA <span className="text-gold-gradient">Elite</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 text-lg font-light tracking-tight italic">
                            Sincronización Maestra para <span className="text-white font-bold">{currentUser.nombre.split(' ')[0]}</span>.
                        </p>
                    </div>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-[2.5rem] p-8 flex items-center gap-10 backdrop-blur-3xl shadow-luxury relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>
                    <div className="text-center relative z-10">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Manifiestos en Curso</p>
                        <p className="text-4xl font-black text-white italic tracking-tighter group-hover:scale-110 transition-transform">{stats.totalActivos}</p>
                    </div>
                    <div className="w-[1px] h-12 bg-white/10 relative z-10"></div>
                    <div className="text-center relative z-10">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Fase de Despliegue</p>
                        <p className="text-4xl font-black text-blue-400 italic tracking-tighter group-hover:scale-110 transition-transform">{stats.enProduccion}</p>
                    </div>
                    {/* Tiny animated signal */}
                    <div className="absolute top-4 right-4 flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-75"></div>
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-150"></div>
                    </div>
                </div>
            </div>

            {/* --- ACCIONES OPERATIVAS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <MainActionButton 
                    label="Catálogo" 
                    sub="Bóveda de Activos Gráficos" 
                    icon={BookOpenIcon} 
                    onClick={() => navigate('/productos')} 
                    color="blue" 
                    delay={0.1}
                />
                <MainActionButton 
                    label="Clientes SRI" 
                    sub="Soberanía Fiscal" 
                    icon={ShieldCheckIcon} 
                    onClick={() => navigate('/clientes')} 
                    color="red" 
                    delay={0.2}
                />
                <MainActionButton 
                    label="Nuevo Pedido" 
                    sub="Protocolo de Manufactura" 
                    icon={RocketLaunchIcon} 
                    onClick={() => navigate('/nuevo')} 
                    color="gold" 
                    delay={0.3}
                />
                <MainActionButton 
                    label="Manifiestos" 
                    sub="Estado Patrimonial" 
                    icon={ReceiptIcon} 
                    onClick={() => navigate('/trabajos')} 
                    color="yellow" 
                    delay={0.4}
                />
            </div>

            {/* --- SECCIÓN INFERIOR: TELEMETRÍA & NÚCLEO --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-5 transition-opacity duration-1000">
                        <MonitorIcon className="w-64 h-64 text-white" />
                    </div>
                    
                    <div className="relative z-10 space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black text-white uppercase tracking-[-0.04em] italic">Telemetría Central</h3>
                            <button onClick={() => navigate('/registro')} className="text-[10px] font-black text-liquid-gold uppercase tracking-widest hover:underline italic">Ver Registro Histórico</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                        <ShieldCheckIcon className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Cumplimiento Tributario SRI</p>
                                </div>
                                <p className="text-xs text-slate-400 font-light leading-relaxed italic uppercase tracking-wider">
                                    Sincronización activa con servidores oficiales. Los trámites institucionales están validados.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Enlace Activo</span>
                                </div>
                            </div>

                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                        <CpuIcon className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Algoritmo de Precisión</p>
                                </div>
                                <p className="text-xs text-slate-400 font-light leading-relaxed italic uppercase tracking-wider">
                                    Algoritmos de precisión calibrados según el mercado de sustratos y tintas actual.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Máxima Precisión</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between shadow-gold-glow-soft relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="space-y-6 relative z-10">
                        <div className="w-12 h-12 bg-liquid-gold rounded-2xl flex items-center justify-center text-black shadow-gold-glow">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-[-0.04em] italic">Córdova Nucleus <span className="text-liquid-gold">v3.0</span></h4>
                        <p className="text-sm text-slate-500 font-light leading-relaxed italic uppercase tracking-wider">
                            Arquitectura de gestión industrial para la elite de la producción gráfica regional.
                        </p>
                    </div>

                    <div className="pt-10 space-y-4 border-t border-white/5 relative z-10">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                            <span>Enlace Técnico</span>
                            <span className="text-liquid-gold">Maestro</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                            <span>Núcleo de Datos</span>
                            <span className="text-emerald-500">Cifrado</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;

