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
            className={`group relative flex flex-col items-start p-8 rounded-[2.5rem] border bg-gradient-to-br ${colorMap[color]} backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] shadow-2xl overflow-hidden h-64`}
        >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                <Icon className="w-40 h-40" />
            </div>
            
            <div className={`w-14 h-14 rounded-2xl ${iconBgMap[color]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-white/5`}>
                <Icon className="w-7 h-7" />
            </div>
            
            <div className="mt-auto space-y-1">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic text-left">{label}</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] text-left">{sub}</p>
            </div>

            <div className="absolute bottom-6 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <ChevronRightIcon className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
            </div>
        </motion.button>
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
        <div className="max-w-[1400px] mx-auto space-y-16 pb-20 px-4 md:px-0 pt-10">
            
            {/* --- CABECERA --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-5">
                        <div className="h-1 w-12 bg-liquid-gold rounded-full"></div>
                        <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.5em] italic">Panel Administrativo</p>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
                        ¡Hola, <span className="text-gold-gradient">{currentUser.nombre.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-slate-500 text-lg font-light tracking-tight italic">
                        Bienvenido al núcleo de control de <span className="text-white font-bold">Imprenta Córdova</span>.
                    </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center gap-8 backdrop-blur-xl">
                    <div className="text-center">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Trabajos Activos</p>
                        <p className="text-3xl font-black text-white italic">{stats.totalActivos}</p>
                    </div>
                    <div className="w-px h-10 bg-white/5"></div>
                    <div className="text-center">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">En Producción</p>
                        <p className="text-3xl font-black text-blue-400 italic">{stats.enProduccion}</p>
                    </div>
                </div>
            </div>

            {/* --- ACCIONES PRINCIPALES (BOTONES SOLICITADOS) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <MainActionButton 
                    label="Catálogo" 
                    sub="Explorar Servicios" 
                    icon={BookOpenIcon} 
                    onClick={() => navigate('/productos')} 
                    color="blue" 
                    delay={0.1}
                />
                <MainActionButton 
                    label="Clientes SRI" 
                    sub="Gestión Tributaria" 
                    icon={ShieldCheckIcon} 
                    onClick={() => navigate('/clientes')} 
                    color="red" 
                    delay={0.2}
                />
                <MainActionButton 
                    label="Nuevo Pedido" 
                    sub="Lanzar Producción" 
                    icon={RocketLaunchIcon} 
                    onClick={() => navigate('/nuevo')} 
                    color="gold" 
                    delay={0.3}
                />
                <MainActionButton 
                    label="Historial" 
                    sub="Archivo de Órdenes" 
                    icon={ReceiptIcon} 
                    onClick={() => navigate('/trabajos')} 
                    color="yellow" 
                    delay={0.4}
                />
            </div>

            {/* --- SECCIÓN INFERIOR: ESTADO DEL SISTEMA & NOTAS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-5 transition-opacity duration-1000">
                        <MonitorIcon className="w-64 h-64 text-white" />
                    </div>
                    
                    <div className="relative z-10 space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Resumen de Actividad</h3>
                            <button onClick={() => navigate('/registro')} className="text-[10px] font-black text-liquid-gold uppercase tracking-widest hover:underline italic">Ver Bitácora</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                                        <ShieldCheckIcon className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Estado SRI</p>
                                </div>
                                <p className="text-xs text-slate-400 font-light leading-relaxed italic">
                                    Sincronización activa con servidores oficiales. Los trámites de hoy están al día.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">En Línea</span>
                                </div>
                            </div>

                            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                        <CpuIcon className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Motor de Cálculo</p>
                                </div>
                                <p className="text-xs text-slate-400 font-light leading-relaxed italic">
                                    Calculadora de precios industrial calibrada según costos de materiales actuales.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Optimizado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 flex flex-col justify-between shadow-gold-glow-soft">
                    <div className="space-y-6">
                        <div className="w-12 h-12 bg-liquid-gold rounded-2xl flex items-center justify-center text-black">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">Córdova Vision <span className="text-liquid-gold">v2.0</span></h4>
                        <p className="text-sm text-slate-500 font-light leading-relaxed italic">
                            Sistema de gestión industrial optimizado para la eficiencia en diseño y producción gráfica.
                        </p>
                    </div>

                    <div className="pt-10 space-y-4 border-t border-white/5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                            <span>Soporte Técnico</span>
                            <span className="text-liquid-gold">Activo</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                            <span>Base de Datos</span>
                            <span className="text-emerald-500">Segura</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;

