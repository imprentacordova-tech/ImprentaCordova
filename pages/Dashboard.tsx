
import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TrabajoEstado, User } from '../types';
import { 
    SolidBoxIcon, AddIcon, Loader2Icon, 
    ArrowRightIcon, PaletteIcon, PrinterIcon, CheckCircleIcon,
    SparklesIcon, UserPlusIcon, MonitorIcon, MessageCircleIcon, EyeIcon, GlobeAltIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { CreateClientModal } from '../components/orders/ClientSelector';

const HealthGauge: React.FC<{ label: string; value: number; color: string; icon: any }> = ({ label, value, color, icon: Icon }) => (
    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center group hover:border-liquid-gold/30 hover:shadow-gold-glow transition-all duration-700">
        <div className="relative w-24 h-24 lg:w-28 lg:h-28 mb-5">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={301.6} strokeDashoffset={301.6 - (301.6 * value) / 100} className="text-liquid-gold transition-all duration-[1.5s] ease-out drop-shadow-[0_0_10px_rgba(229,196,139,0.5)]" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-7 h-7 lg:w-8 lg:h-8 text-liquid-gold/50 group-hover:text-liquid-gold transition-colors duration-500" />
            </div>
        </div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-tight">{label}</p>
        <div className="flex items-baseline gap-1 mt-2">
            <p className="text-3xl font-black text-white italic">{value}</p>
            <span className="text-xs font-bold text-liquid-gold/50">%</span>
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, loading, refreshData } = useData();
    const navigate = useNavigate();
    
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    
    const stats = useMemo(() => {
        if (loading) return null;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        const tHoy = trabajos.filter(t => new Date(t.fechaEntrada).getTime() >= startOfToday);
        const activeJobs = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO);
        const designJobs = activeJobs.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado));
        const productionJobs = activeJobs.filter(t => t.estado === TrabajoEstado.PROCESO);
        
        // New Metric: Web Orders Pending
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
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
            <Loader2Icon className="animate-spin h-12 w-12 text-brand-blue" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Iniciando Cerebro Córdova...</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* HERO ATELIER ADMIN */}
            <div className="relative overflow-hidden rounded-[4rem] bg-brand-dark border border-white/5 shadow-luxury">
                {/* Mesh Gradient Background */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-liquid-gold/10 rounded-full blur-[140px] -mr-64 -mt-64"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-dark rounded-full blur-[120px] -ml-32 -mb-32"></div>
                </div>
                
                <div className="relative z-10 p-12 lg:p-20">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-16">
                        <div className="space-y-8 max-w-2xl">
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="bg-liquid-gold/10 text-liquid-gold text-[9px] font-black px-4 py-1.5 rounded-full border border-liquid-gold/20 uppercase tracking-[0.3em]">
                                    NIVEL: {currentUser.rol === 'Admin' ? 'ADMINISTRADOR' : currentUser.rol.toUpperCase()}
                                </span>
                                <div className="h-4 w-[1px] bg-white/10 hidden sm:block"></div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                                    Nube Sincronizada
                                </span>
                            </div>
                            
                            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-white leading-none tracking-tighter">
                                HOLA, <span className="text-gold-gradient italic">{currentUser.nombre.toUpperCase()}</span>
                            </h1>
                            
                            <p className="text-lg lg:text-xl text-slate-400 font-medium leading-relaxed max-w-lg">
                                El sistema Córdova está bajo tu mando. Hay <span className="text-white font-bold">{stats.totalActivos} trabajos activos</span> en producción.
                            </p>

                            {/* WEB ORDER ALERT LUXURY */}
                            {stats.webOrders.length > 0 && (
                                <div className="bg-white/5 border border-liquid-gold/20 p-6 rounded-3xl flex items-center gap-6 animate-float backdrop-blur-md">
                                    <div className="p-4 bg-liquid-gold rounded-2xl text-brand-dark shadow-gold-glow">
                                        <GlobeAltIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-black uppercase text-sm tracking-widest">Nuevos Pedidos Web</p>
                                        <p className="text-slate-500 text-xs mt-1 font-bold">Hay {stats.webOrders.length} pedidos web esperando revisión.</p>
                                    </div>
                                    <button onClick={() => navigate('/trabajos')} className="px-6 py-3 bg-white text-brand-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-liquid-gold transition-all duration-500">
                                        Revisar
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-6 pt-6">
                                <button onClick={() => navigate('/nuevo')} className="group relative px-10 py-5 bg-white text-brand-dark rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] overflow-hidden transition-all duration-500 hover:shadow-gold-glow">
                                    <div className="absolute inset-0 bg-liquid-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                    <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
                                        <AddIcon className="w-5 h-5"/> Crear Nueva Orden
                                    </span>
                                </button>
                                <button onClick={() => setIsClientModalOpen(true)} className="btn-atelier px-10 py-5">
                                    <UserPlusIcon className="w-5 h-5"/> Cliente RUC
                                </button>
                            </div>
                        </div>

                        {stats.priorityJob && (
                            <div className="w-full lg:w-[400px] bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3.5rem] shadow-luxury relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
                                    <SparklesIcon className="w-32 h-32 text-liquid-gold" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                                        <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.4em]">Alerta Prioritaria</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Orden Prioritaria #{stats.priorityJob.orden}</p>
                                        <h3 className="text-3xl font-black text-white leading-tight uppercase truncate tracking-tighter">{stats.priorityJob.titular}</h3>
                                    </div>
                                    <div className="pt-4">
                                        <button onClick={() => navigate(`/trabajos/${stats.priorityJob?.id}`)} className="w-full py-5 bg-liquid-gold/10 text-liquid-gold border border-liquid-gold/20 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-liquid-gold hover:text-brand-dark transition-all duration-700">
                                            Gestionar Prioridad
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <HealthGauge label="Carga Diseño" value={stats.designLoad} color="text-indigo-400" icon={PaletteIcon} />
                <HealthGauge label="Carga Taller" value={stats.productionLoad} color="text-blue-400" icon={PrinterIcon} />
                <div className="bg-white/5 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group overflow-hidden relative hover:border-emerald-500/20 transition-all duration-700">
                    <div className="absolute bottom-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <SolidBoxIcon className="w-20 h-20 lg:w-24 lg:h-24 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-tight">Ingresos Hoy</p>
                        <p className="text-4xl lg:text-5xl font-black text-emerald-500 mt-3 italic tracking-tighter">{formatCurrency(stats.ingresosHoy).split(',')[0]}<span className="text-lg lg:text-xl opacity-50">,00</span></p>
                    </div>
                    <div className="mt-6">
                        <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-3/4 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000 delay-500"></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group overflow-hidden relative hover:border-liquid-gold/20 transition-all duration-700">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-liquid-gold/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none"></div>
                    <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-tight">Listos para Entrega</p>
                        <p className="text-5xl lg:text-6xl font-black text-white mt-3 tracking-tighter italic">{stats.enVitrina}</p>
                        <p className="text-[9px] font-bold text-liquid-gold uppercase tracking-[0.2em] mt-2">Vitrina</p>
                    </div>
                    <button onClick={() => navigate('/retiros')} className="btn-atelier w-full py-4 mt-6">
                        Despachar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 bg-white/5 backdrop-blur-xl rounded-[3rem] lg:rounded-[3.5rem] p-8 lg:p-12 border border-white/5">
                    <div className="flex justify-between items-center mb-8 lg:mb-12">
                        <div>
                            <h3 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tighter leading-tight">Clientes Recientes</h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Contactar para re-captación con IA</p>
                        </div>
                        <div className="p-3 lg:p-4 bg-liquid-gold/10 text-liquid-gold rounded-2xl border border-liquid-gold/20">
                            <SparklesIcon className="w-5 h-5 lg:w-6 lg:h-6 animate-pulse"/>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {clientes.slice(0, 4).map(c => (
                            <div key={c.id} className="flex flex-col sm:flex-row items-center justify-between p-6 lg:p-8 bg-brand-dark rounded-2xl lg:rounded-3xl border border-white/5 hover:border-liquid-gold/30 transition-all duration-500 gap-6 group">
                                <div className="flex items-center gap-5 w-full min-w-0">
                                    <div className="w-12 h-12 lg:w-14 lg:h-14 flex-shrink-0 bg-white/5 rounded-xl lg:rounded-2xl flex items-center justify-center font-black text-liquid-gold text-lg border border-white/5 group-hover:bg-liquid-gold group-hover:text-brand-dark transition-all duration-700">{c.nombre.charAt(0)}</div>
                                    <div className="min-w-0">
                                        <h4 className="font-black text-white uppercase tracking-tight text-sm lg:text-base leading-tight truncate">{c.nombre}</h4>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-[0.2em]">{c.regimen}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto flex-shrink-0">
                                    <button onClick={() => navigate(`/clientes?reengage=${c.id}`)} className="flex-1 sm:flex-none px-6 lg:px-8 py-3.5 bg-liquid-gold text-brand-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-xl lg:rounded-2xl shadow-luxury hover:bg-white hover:-translate-y-0.5 transition-all duration-500 flex items-center justify-center gap-2">
                                        <MessageCircleIcon className="w-4 h-4"/> Re-Captar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-gradient-to-br from-brand-dark to-slate-900 rounded-[3.5rem] p-12 text-white shadow-luxury border border-white/5 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 transition-opacity group-hover:opacity-10">
                        <MonitorIcon className="w-48 h-48 text-liquid-gold" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter mb-4 italic text-gold-gradient leading-tight">TALLER KDS</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-[220px]">Control del taller de producción en tiempo real.</p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                                <div className="w-2 h-2 rounded-full bg-liquid-gold shadow-gold-glow"></div> 
                                Lista de cortes
                            </li>
                            <li className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                                <div className="w-2 h-2 rounded-full bg-liquid-gold shadow-gold-glow"></div> 
                                Alertas SRI
                            </li>
                            <li className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                                <div className="w-2 h-2 rounded-full bg-liquid-gold shadow-gold-glow"></div> 
                                Seguimiento de órdenes
                            </li>
                        </ul>
                    </div>
                    <button onClick={() => navigate('/kds')} className="w-full py-5 bg-white text-brand-dark font-black text-[10px] uppercase tracking-[0.4em] rounded-2xl shadow-luxury hover:bg-liquid-gold hover:text-white transition-all duration-700 flex items-center justify-center gap-4 group">
                        MONITORIZAR <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform"/>
                    </button>
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
