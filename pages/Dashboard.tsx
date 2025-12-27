
import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, User, Cliente, Regimen } from '../types';
import { 
    SolidDollarIcon, SolidBoxIcon, KdsIcon, AddIcon, ReceiptIcon, Loader2Icon, 
    ArrowRightIcon, PaletteIcon, PrinterIcon, CheckCircleIcon, DocumentIcon,
    SolidClockIcon, SolidFinanceIcon, CalendarDaysIcon, WrenchScrewdriverIcon, SparklesIcon, UserPlusIcon,
    ShieldCheckIcon, DocumentTextIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { CreateClientModal } from '../components/orders/ClientSelector';

const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ComponentType<{ className?: string }>; 
    trend?: string;
    variant: 'blue' | 'green' | 'red';
    to: string;
}> = ({ title, value, icon: Icon, trend, variant, to }) => {
    const styles = {
        blue: { bg: 'bg-white dark:bg-gray-800', iconBg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-brand-blue' },
        green: { bg: 'bg-white dark:bg-gray-800', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
        red: { bg: 'bg-white dark:bg-gray-800', iconBg: 'bg-rose-50 dark:bg-rose-900/30', iconColor: 'text-rose-600' },
    };
    const s = styles[variant];

    return (
        <NavLink to={to} className={`relative overflow-hidden rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group ${s.bg}`}>
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{title}</p>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</h3>
                    {trend && <div className="flex items-center mt-2 text-xs font-medium text-gray-400 gap-1">{trend}</div>}
                </div>
                <div className={`p-3 rounded-xl ${s.iconBg} transition-transform group-hover:scale-110`}><Icon className={`w-6 h-6 ${s.iconColor}`} /></div>
            </div>
        </NavLink>
    );
};

const DashboardPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, loading, refreshData } = useData();
    const navigate = useNavigate();
    
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    
    const stats = useMemo(() => {
        if (loading) return null;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tHoy = trabajos.filter(t => new Date(t.fechaEntrada) >= today);
        
        // Conteo por régimen
        const popularCount = clientes.filter(c => c.regimen === Regimen.NEGOCIO_POPULAR).length;
        const generalCount = clientes.filter(c => c.regimen === Regimen.GENERAL || c.regimen === Regimen.EMPRENDEDOR).length;

        return {
            ingresosHoy: tHoy.reduce((sum, t) => sum + t.abono, 0),
            pedidosHoy: tHoy.length,
            saldosPendientes: trabajos.filter(t => t.saldo > 0 && t.estado !== TrabajoEstado.ENTREGADO).reduce((sum, t) => sum + t.saldo, 0),
            diseno: trabajos.filter(t => t.estado === TrabajoEstado.PENDIENTE || t.estado === TrabajoEstado.EN_DISENO).length,
            produccion: trabajos.filter(t => t.estado === TrabajoEstado.PROCESO).length,
            vitrina: trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length,
            popularCount,
            generalCount,
            eficienciaIA: 94
        };
    }, [trabajos, clientes, loading]);

    const handleClientCreated = (client: Cliente) => {
        setIsClientModalOpen(false);
        refreshData();
    };

    if (loading || !stats) return <div className="h-screen flex items-center justify-center"><Loader2Icon className="animate-spin h-10 w-10 text-brand-blue" /></div>;

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-2 pb-10">
            {/* Cabecera Premium */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 text-white shadow-2xl p-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-6">
                            <SparklesIcon className="w-4 h-4 text-orange-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Imprenta Córdova v2.5</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none">
                            {currentUser.nombre}, <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-white">tu taller está al {stats.eficienciaIA}%</span>
                        </h1>
                        
                        {/* Widget de Regímenes Rápidos */}
                        <div className="flex gap-6 mt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                    <ReceiptIcon className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rimpe Popular</p>
                                    <p className="text-xl font-black text-white">{stats.popularCount}</p>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-white/10"></div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                    <DocumentTextIcon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Régimen General</p>
                                    <p className="text-xl font-black text-white">{stats.generalCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <button 
                            onClick={() => setIsClientModalOpen(true)}
                            className="px-8 py-5 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-xl border border-white/10 transition-all text-white font-black text-sm flex items-center justify-center gap-3 group"
                        >
                            <UserPlusIcon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" /> NUEVO CLIENTE
                        </button>
                        <NavLink to="/nuevo" className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-3">
                            <AddIcon className="w-5 h-5 text-brand-red" /> NUEVA ORDEN
                        </NavLink>
                    </div>
                </div>
            </div>

            {/* Grid de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Ventas Hoy" value={formatCurrency(stats.ingresosHoy)} icon={SolidDollarIcon} variant="blue" trend="↑ 12% vs ayer" to="/finanzas" />
                <StatCard title="Pedidos" value={String(stats.pedidosHoy)} icon={SolidBoxIcon} variant="green" trend="Últimas 24h" to="/trabajos" />
                <StatCard title="Por Cobrar" value={formatCurrency(stats.saldosPendientes)} icon={SolidClockIcon} variant="red" trend="Acción requerida" to="/retiros" />
            </div>

            {/* Producción en Vivo */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 border border-slate-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Flujo de Producción</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                    {[
                        { label: 'En Diseño', val: stats.diseno, color: 'indigo', icon: PaletteIcon, to: '/diseno' },
                        { label: 'En Máquina', val: stats.produccion, color: 'blue', icon: PrinterIcon, to: '/kds' },
                        { label: 'En Vitrina', val: stats.vitrina, color: 'emerald', icon: CheckCircleIcon, to: '/retiros' }
                    ].map(st => (
                        <NavLink key={st.label} to={st.to} className="group flex flex-col items-center p-6 rounded-3xl hover:bg-slate-50 dark:hover:bg-gray-900/50 transition-colors">
                            <div className={`w-16 h-16 rounded-2xl bg-${st.color}-100 dark:bg-${st.color}-900/20 text-${st.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <st.icon className="w-8 h-8" />
                            </div>
                            <p className="text-4xl font-black text-slate-900 dark:text-white mb-1">{st.val}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{st.label}</p>
                        </NavLink>
                    ))}
                </div>
            </div>

            <CreateClientModal 
                isOpen={isClientModalOpen} 
                onClose={() => setIsClientModalOpen(false)} 
                onClientCreated={handleClientCreated} 
            />
        </div>
    );
};

export default DashboardPage;
