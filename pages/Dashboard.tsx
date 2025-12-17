
import React, { useState, useEffect } from 'react';
import { NavLink, useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, User } from '../types';
import { 
    SolidDollarIcon, SolidBoxIcon, KdsIcon, AddIcon, ReceiptIcon, Loader2Icon, 
    ArrowRightIcon, PaletteIcon, PrinterIcon, CheckCircleIcon, DocumentIcon,
    SolidClockIcon, SolidFinanceIcon, CalendarDaysIcon, WrenchScrewdriverIcon, ArrowDownIcon, ArrowUpIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';

// --- Components ---

const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ComponentType<{ className?: string }>; 
    trend?: string;
    trendValue?: number; 
    inverseTrend?: boolean;
    variant: 'blue' | 'green' | 'red' | 'indigo';
    to: string;
}> = ({ title, value, icon: Icon, trend, trendValue, inverseTrend, variant, to }) => {
    
    // Gradientes sutiles para fondo
    const gradients = {
        blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-100 dark:border-blue-800',
        green: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-100 dark:border-emerald-800',
        red: 'from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 border-rose-100 dark:border-rose-800',
        indigo: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-100 dark:border-indigo-800',
    };

    const iconColors = {
        blue: 'text-brand-blue bg-white',
        green: 'text-emerald-600 bg-white',
        red: 'text-rose-600 bg-white',
        indigo: 'text-indigo-600 bg-white',
    };

    let trendColor = 'text-gray-400';
    let TrendIcon = null;

    if (trendValue !== undefined && trendValue !== 0) {
        const isPositiveChange = trendValue > 0;
        const isGood = inverseTrend ? !isPositiveChange : isPositiveChange;
        trendColor = isGood ? 'text-emerald-600' : 'text-rose-600';
        TrendIcon = isPositiveChange ? ArrowUpIcon : ArrowDownIcon;
    }

    return (
        <NavLink 
            to={to}
            className={`
                relative overflow-hidden rounded-3xl p-6 border shadow-sm transition-all duration-500 
                hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br ${gradients[variant]}
            `}
        >
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{value}</h3>
                    
                    <div className="flex items-center mt-3 gap-2">
                        {TrendIcon && (
                            <span className={`flex items-center text-xs font-bold ${trendColor} bg-white/60 dark:bg-gray-800/50 px-2 py-1 rounded-lg backdrop-blur-sm`}>
                                <TrendIcon className="w-3 h-3 mr-1" />
                                {Math.abs(trendValue || 0).toFixed(1)}%
                            </span>
                        )}
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{trend || 'vs mes anterior'}</span>
                    </div>
                </div>
                
                <div className={`p-3 rounded-2xl shadow-sm ${iconColors[variant]} group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            
            {/* Decorative Shine */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/40 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        </NavLink>
    );
};

const ActionButton: React.FC<{
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    desc: string;
    color: 'blue' | 'orange' | 'green' | 'purple';
}> = ({ to, icon: Icon, label, desc, color }) => {
    
    const colors = {
        blue: 'hover:border-blue-200 hover:bg-blue-50/50',
        orange: 'hover:border-orange-200 hover:bg-orange-50/50',
        green: 'hover:border-emerald-200 hover:bg-emerald-50/50',
        purple: 'hover:border-purple-200 hover:bg-purple-50/50',
    };

    const iconBg = {
        blue: 'bg-blue-100 text-blue-600',
        orange: 'bg-orange-100 text-orange-600',
        green: 'bg-emerald-100 text-emerald-600',
        purple: 'bg-purple-100 text-purple-600',
    };

    return (
        <NavLink 
            to={to} 
            className={`
                group flex items-center p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 
                shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-x-1
                ${colors[color]}
            `}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-transform group-hover:scale-110 ${iconBg[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-white text-base group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
            
            <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
        </NavLink>
    );
};

const ProductionStatusCard: React.FC<{
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    color: 'indigo' | 'blue' | 'emerald';
    to: string;
}> = ({ label, count, icon: Icon, color, to }) => {
    const s = {
        indigo: { text: 'text-indigo-600', bar: 'bg-indigo-500' },
        blue: { text: 'text-blue-600', bar: 'bg-blue-500' },
        emerald: { text: 'text-emerald-600', bar: 'bg-emerald-500' },
    };
    const c = s[color];

    return (
        <NavLink 
            to={to}
            className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
        >
            <div className="flex justify-between items-center mb-4">
                <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700 ${c.text}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-gray-800 dark:text-white group-hover:scale-110 transition-transform origin-right">
                    {count}
                </span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{label}</p>
            
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${c.bar} rounded-full w-1/3 group-hover:w-full transition-all duration-1000 ease-out`}></div>
            </div>
        </NavLink>
    );
};

const DashboardPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, loading, refreshData } = useData();
    const navigate = useNavigate();
    
    const [stats, setStats] = useState({
        ingresosHoy: 0,
        pedidosHoy: 0,
        saldosPendientes: 0,
        diseno: 0,
        produccion: 0,
        vitrina: 0,
        velocidadPromedio: 0,
        velocidadDiff: 0
    });
    const [recentJobs, setRecentJobs] = useState<Trabajo[]>([]);

    useEffect(() => {
        if (loading) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const trabajosHoy = trabajos.filter(t => new Date(t.fechaEntrada) >= today);
        const ingresosHoy = trabajosHoy.reduce((sum, t) => sum + t.abono, 0);
        
        const saldos = trabajos
            .filter(t => t.saldo > 0 && t.estado !== TrabajoEstado.ENTREGADO)
            .reduce((sum, t) => sum + t.saldo, 0);

        const calculateAvgHours = (startDate: Date, endDate: Date) => {
            const completedJobs = trabajos.filter(t => {
                const entryDate = new Date(t.fechaEntrada);
                return entryDate >= startDate && 
                       entryDate <= endDate && 
                       (t.estado === TrabajoEstado.VITRINA || t.estado === TrabajoEstado.ENTREGADO) &&
                       t.fechaEntrega;
            });

            if (completedJobs.length === 0) return 0;

            const totalHours = completedJobs.reduce((acc, t) => {
                const start = new Date(t.fechaEntrada).getTime();
                const end = new Date(t.fechaEntrega!).getTime();
                const diffHours = (end - start) / (1000 * 60 * 60);
                return acc + Math.max(0, diffHours);
            }, 0);

            return totalHours / completedJobs.length;
        };

        const avgHoursCurrentMonth = calculateAvgHours(startOfMonth, now);
        const avgHoursLastMonth = calculateAvgHours(startOfLastMonth, endOfLastMonth);
        const avgDaysDisplay = avgHoursCurrentMonth / 24;
        let speedDiff = 0;
        if (avgHoursLastMonth > 0) {
            speedDiff = ((avgHoursCurrentMonth - avgHoursLastMonth) / avgHoursLastMonth) * 100;
        }

        setStats({
            ingresosHoy,
            pedidosHoy: trabajosHoy.length,
            saldosPendientes: saldos,
            diseno: trabajos.filter(t => t.estado === TrabajoEstado.PENDIENTE || t.estado === TrabajoEstado.EN_DISENO).length,
            produccion: trabajos.filter(t => t.estado === TrabajoEstado.PROCESO).length,
            vitrina: trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length,
            velocidadPromedio: avgDaysDisplay,
            velocidadDiff: speedDiff
        });

        setRecentJobs(
            [...trabajos]
                .sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime())
                .slice(0, 5)
        );

    }, [trabajos, loading]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const formatSpeed = (days: number) => {
        if (days < 1) return `${(days * 24).toFixed(1)}h`;
        return `${days.toFixed(1)}d`;
    };

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-brand-blue rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Sincronizando Sistema...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in">
            
            {/* HERO WELCOME SECTION */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white shadow-2xl p-8 md:p-12 border border-slate-800">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-brand-blue rounded-full opacity-20 blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/10 text-xs font-bold uppercase tracking-widest text-blue-200">
                            <CalendarDaysIcon className="w-3 h-3" />
                            {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                            {getGreeting()}, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 animate-gradient-x">
                                {currentUser.nombre}
                            </span>
                        </h1>
                        <p className="text-slate-400 max-w-md text-lg leading-relaxed">
                            Resumen operativo en tiempo real.
                            Tienes <strong className="text-white border-b-2 border-brand-blue">{stats.diseno} trabajos</strong> esperando en diseño.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                        <button 
                            onClick={() => refreshData()} 
                            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-md transition-all text-white border border-white/10 hover:border-white/20 group"
                            title="Actualizar Datos"
                        >
                            <Loader2Icon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                        </button>
                        <NavLink 
                            to="/nuevo"
                            className="flex-1 lg:flex-none px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 group"
                        >
                            <div className="bg-brand-blue/10 p-1.5 rounded-full group-hover:bg-brand-blue/20 transition-colors">
                                <AddIcon className="w-5 h-5 text-brand-blue" />
                            </div>
                            <span>Nuevo Pedido</span>
                        </NavLink>
                    </div>
                </div>
            </div>

            {/* PIPELINE & STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Workflow Status */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Producción en Vivo</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <ProductionStatusCard label="En Diseño" count={stats.diseno} icon={PaletteIcon} color="indigo" to="/diseno" />
                        <ProductionStatusCard label="En Taller" count={stats.produccion} icon={PrinterIcon} color="blue" to="/kds" />
                        <ProductionStatusCard label="Listos / Vitrina" count={stats.vitrina} icon={CheckCircleIcon} color="emerald" to="/retiros" />
                    </div>
                </div>

                {/* Right: Financial & Metrics */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <SolidFinanceIcon className="w-5 h-5 text-gray-400" />
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Métricas Clave</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <StatCard 
                            title="Ingresos Hoy" 
                            value={formatCurrency(stats.ingresosHoy)} 
                            icon={SolidDollarIcon} 
                            variant="blue" 
                            trend="Ver reporte"
                            to="/finanzas"
                        />
                        <StatCard 
                            title="Pedidos Nuevos" 
                            value={String(stats.pedidosHoy)} 
                            icon={SolidBoxIcon} 
                            variant="green"
                            trend="Ir al historial"
                            to="/trabajos"
                        />
                        <StatCard 
                            title="Saldo por Cobrar" 
                            value={formatCurrency(stats.saldosPendientes)} 
                            icon={ReceiptIcon} 
                            variant="red"
                            trend="Gestionar cobros"
                            to="/retiros"
                        />
                        <StatCard 
                            title="Tiempo Promedio" 
                            value={formatSpeed(stats.velocidadPromedio)} 
                            icon={SolidClockIcon} 
                            variant="indigo"
                            trend="vs mes anterior"
                            trendValue={stats.velocidadDiff}
                            inverseTrend={true} 
                            to="/kds"
                        />
                    </div>
                </div>
            </div>

            {/* BOTTOM: RECENT ACTIVITY & SHORTCUTS */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Recent Jobs Table */}
                <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <SolidClockIcon className="w-6 h-6 text-gray-300" />
                            Última Actividad
                        </h2>
                        <NavLink to="/trabajos" className="text-xs font-bold text-brand-blue hover:text-white hover:bg-brand-blue border border-blue-100 px-4 py-2 rounded-full transition-all">
                            Ver Todo
                        </NavLink>
                    </div>
                    <div className="flex-grow">
                        {recentJobs.length > 0 ? recentJobs.map((job, idx) => (
                            <div 
                                key={job.id} 
                                onClick={() => navigate(`/trabajos/${job.id}`)}
                                className={`
                                    p-5 hover:bg-blue-50/50 dark:hover:bg-gray-700/30 transition-all cursor-pointer group flex items-center justify-between
                                    ${idx !== recentJobs.length - 1 ? 'border-b border-gray-50 dark:border-gray-700/50' : ''}
                                `}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md transform group-hover:rotate-6 transition-transform duration-300
                                        ${job.estado === TrabajoEstado.ENTREGADO ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'}
                                    `}>
                                        {job.titular.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-base group-hover:text-brand-blue transition-colors">
                                            {job.titular}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                                            Orden #{job.orden} • {job.subtipo}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(job.total)}</p>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider opacity-80 ${
                                        job.estado === TrabajoEstado.PENDIENTE ? 'text-yellow-600' : 
                                        job.estado === TrabajoEstado.VITRINA ? 'text-purple-600' :
                                        job.estado === TrabajoEstado.ENTREGADO ? 'text-emerald-600' : 
                                        'text-blue-600'
                                    }`}>
                                        {job.estado}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-16 text-center text-gray-400 flex flex-col items-center">
                                <DocumentIcon className="w-16 h-16 mb-4 opacity-10" />
                                <p>No hay actividad reciente.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 px-2">
                        <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Accesos Rápidos</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        <ActionButton 
                            to="/nuevo" 
                            icon={AddIcon} 
                            label="Crear Pedido" 
                            desc="Iniciar nueva orden"
                            color="blue"
                        />
                        <ActionButton 
                            to="/kds" 
                            icon={KdsIcon} 
                            label="Taller KDS" 
                            desc="Gestión de producción"
                            color="orange"
                        />
                        <ActionButton 
                            to="/retiros" 
                            icon={ReceiptIcon} 
                            label="Entregas" 
                            desc="Cobros y despachos"
                            color="green"
                        />
                        <ActionButton 
                            to="/finanzas" 
                            icon={SolidFinanceIcon} 
                            label="Finanzas" 
                            desc="Reportes y métricas"
                            color="purple"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
