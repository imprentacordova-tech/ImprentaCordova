
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
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center group">
        <div className="relative w-24 h-24 mb-4">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * value) / 100} className={`${color} transition-all duration-1000 ease-out`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <Icon className={`w-8 h-8 ${color.replace('stroke-', 'text-')}`} />
            </div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{value}%</p>
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
        <div className="space-y-10 animate-fade-in pb-12">
            <div className="relative overflow-hidden rounded-[3.5rem] bg-slate-950 border border-white/5 shadow-3xl">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/10 rounded-full blur-[140px] -mr-64 -mt-64"></div>
                
                <div className="relative z-10 p-10 lg:p-16">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
                        <div className="space-y-6 max-w-xl">
                            <div className="flex items-center gap-3">
                                <span className="bg-brand-red text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">MODO: {currentUser.rol.toUpperCase()}</span>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronización Cloud Activa</p>
                            </div>
                            
                            <h1 className="text-5xl lg:text-7xl font-black text-white leading-none tracking-tighter">
                                HOLA, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">{currentUser.nombre.toUpperCase()}</span>
                            </h1>
                            
                            <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                El sistema Córdova V2 está listo. Tienes <span className="text-white font-bold">{stats.totalActivos} trabajos activos</span> fluyendo en el taller y guardados en la nube.
                            </p>

                            {/* WEB ORDER ALERT */}
                            {stats.webOrders.length > 0 && (
                                <div className="bg-indigo-600/20 border border-indigo-500/30 p-4 rounded-2xl flex items-center gap-4 animate-bounce-in">
                                    <div className="p-2 bg-indigo-500 rounded-xl text-white"><GlobeAltIcon className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-white font-black uppercase text-sm">¡Atención! {stats.webOrders.length} Pedidos Web Nuevos</p>
                                        <p className="text-indigo-200 text-xs">Revisar solicitudes entrantes desde la página pública.</p>
                                    </div>
                                    <button onClick={() => navigate('/trabajos')} className="ml-auto px-4 py-2 bg-white text-indigo-900 font-black text-[9px] uppercase rounded-xl hover:bg-indigo-50">Ver</button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-4 pt-4">
                                <button onClick={() => navigate('/nuevo')} className="bg-brand-red text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-white hover:text-brand-red transition-all flex items-center gap-3">
                                    <AddIcon className="w-5 h-5"/> Nueva Orden
                                </button>
                                <button onClick={() => setIsClientModalOpen(true)} className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 backdrop-blur-md">
                                    <UserPlusIcon className="w-5 h-5"/> Cliente RUC
                                </button>
                            </div>
                        </div>

                        {stats.priorityJob && (
                            <div className="w-full lg:w-96 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[3rem] shadow-2xl animate-float">
                                <div className="flex items-center gap-3 mb-6">
                                    <SparklesIcon className="w-5 h-5 text-yellow-400 animate-pulse" />
                                    <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">IA Priority Detected</span>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Orden #{stats.priorityJob.orden}</p>
                                    <h3 className="text-2xl font-black text-white leading-tight uppercase truncate">{stats.priorityJob.titular}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1 bg-brand-red/20 text-brand-red text-[10px] font-black rounded-lg border border-brand-red/30 uppercase">CRÍTICO</span>
                                    </div>
                                    <button onClick={() => navigate(`/trabajos/${stats.priorityJob?.id}`)} className="w-full py-4 mt-4 bg-white text-brand-blue font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-brand-blue hover:text-white transition-all">
                                        Gestionar Ahora
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <HealthGauge label="Carga Diseño" value={stats.designLoad} color="stroke-indigo-500" icon={PaletteIcon} />
                <HealthGauge label="Carga Taller" value={stats.productionLoad} color="stroke-brand-blue" icon={PrinterIcon} />
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caja (Hoy)</p>
                        <p className="text-4xl font-black text-emerald-500 mt-2">{formatCurrency(stats.ingresosHoy)}</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-emerald-500 w-3/4 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    </div>
                </div>
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Listos para Retiro</p>
                        <p className="text-5xl font-black mt-2 tracking-tighter">{stats.enVitrina}</p>
                        <p className="text-[9px] font-bold text-brand-red uppercase tracking-widest mt-2">Vitrina de Pasaje</p>
                    </div>
                    <button onClick={() => navigate('/retiros')} className="w-full py-3 bg-white/10 hover:bg-white hover:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mt-4">Entregar Productos</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Oportunidades de Venta</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Clientes estratégicos para re-captación</p>
                        </div>
                        <div className="p-3 bg-blue-50 text-brand-blue rounded-2xl"><SparklesIcon className="w-6 h-6 animate-pulse"/></div>
                    </div>

                    <div className="space-y-4">
                        {clientes.slice(0, 3).map(c => (
                            <div key={c.id} className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-transparent hover:border-brand-blue/20 transition-all gap-6">
                                <div className="flex items-center gap-5 w-full">
                                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-brand-blue shadow-sm">{c.nombre.charAt(0)}</div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase leading-none">{c.nombre}</h4>
                                        <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-wider">{c.regimen}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button onClick={() => navigate(`/clientes?reengage=${c.id}`)} className="flex-1 sm:flex-none px-6 py-3 bg-brand-blue text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20 hover:bg-slate-950 transition-all flex items-center justify-center gap-2">
                                        <MessageCircleIcon className="w-4 h-4"/> IA PROMO
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4 bg-gradient-to-br from-brand-blue to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <MonitorIcon className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">TV MONITOR</h3>
                        <p className="text-blue-100/60 text-sm leading-relaxed mb-8">Visualiza el avance de las máquinas en tiempo real.</p>
                        <ul className="space-y-4 mb-10">
                            <li className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest"><CheckCircleIcon className="w-4 h-4 text-emerald-400"/> Lista de cortes</li>
                            <li className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest"><CheckCircleIcon className="w-4 h-4 text-emerald-400"/> Alertas SRI</li>
                        </ul>
                    </div>
                    <button onClick={() => navigate('/kds')} className="w-full py-5 bg-white text-brand-blue font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3">
                        ABRIR KDS <ArrowRightIcon className="w-5 h-5"/>
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
