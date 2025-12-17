
import React, { useState, useEffect } from 'react';
import { NavLink, useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, User } from '../types';
import { 
    SolidDollarIcon, SolidBoxIcon, KdsIcon, AddIcon, ReceiptIcon, Loader2Icon, 
    ArrowRightIcon, PaletteIcon, PrinterIcon, CheckCircleIcon, DocumentIcon,
    SolidClockIcon, SolidFinanceIcon, CalendarDaysIcon, WrenchScrewdriverIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';

// --- Components ---

const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ComponentType<{ className?: string }>; 
    trend?: string;
    variant: 'blue' | 'green' | 'red';
    to: string;
}> = ({ title, value, icon: Icon, trend, variant, to }) => {
    const styles = {
        blue: { 
            bg: 'bg-white dark:bg-gray-800', 
            iconBg: 'bg-blue-50 dark:bg-blue-900/30', 
            iconColor: 'text-brand-blue',
            border: 'hover:border-blue-300 dark:hover:border-blue-700'
        },
        green: { 
            bg: 'bg-white dark:bg-gray-800', 
            iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', 
            iconColor: 'text-emerald-600',
            border: 'hover:border-emerald-300 dark:hover:border-emerald-700'
        },
        red: { 
            bg: 'bg-white dark:bg-gray-800', 
            iconBg: 'bg-rose-50 dark:bg-rose-900/30', 
            iconColor: 'text-rose-600',
            border: 'hover:border-rose-300 dark:hover:border-rose-700'
        },
    };
    const s = styles[variant];

    return (
        <NavLink 
            to={to}
            className={`
                relative overflow-hidden rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 
                transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group cursor-pointer
                ${s.bg} ${s.border}
            `}
        >
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{title}</p>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{value}</h3>
                    {trend && (
                        <div className="flex items-center mt-2 text-xs font-medium text-gray-400 gap-1">
                            <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-300">Info</span>
                            {trend}
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${s.iconBg} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>
            </div>
            {/* Decorative background blur */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${s.iconBg.replace('bg-', 'bg-')}`}></div>
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
    
    const gradients = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-200 dark:shadow-none',
        orange: 'from-orange-400 to-orange-600 shadow-orange-200 dark:shadow-none',
        green: 'from-emerald-400 to-emerald-600 shadow-emerald-200 dark:shadow-none',
        purple: 'from-purple-500 to-purple-600 shadow-purple-200 dark:shadow-none',
    };

    return (
        <NavLink 
            to={to} 
            className="group relative flex items-center p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-transparent transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
        >
            {/* Hover Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${gradients[color]} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm transition-all duration-300
                bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300
                group-hover:text-white group-hover:scale-110 group-hover:shadow-md
                ${color === 'blue' ? 'group-hover:bg-blue-500' : ''}
                ${color === 'orange' ? 'group-hover:bg-orange-500' : ''}
                ${color === 'green' ? 'group-hover:bg-emerald-500' : ''}
                ${color === 'purple' ? 'group-hover:bg-purple-500' : ''}
            `}>
                <Icon className="w-6 h-6" />
            </div>
            
            <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-base group-hover:text-brand-blue dark:group-hover:text-blue-300 transition-colors">{label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{desc}</p>
            </div>
            
            <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <ArrowRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
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
    const colors = {
        indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-100 hover:border-indigo-300' },
        blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-100 hover:border-blue-300' },
        emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100 hover:border-emerald-300' },
    };
    const s = colors[color];

    return (
        <NavLink 
            to={to}
            className={`
                flex flex-col p-4 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-sm
                transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer group
                ${s.border}
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${s.bg} bg-opacity-10 text-${color}-600 dark:text-${color}-400 group-hover:bg-opacity-20 transition-all`}>
                    <Icon className={`w-5 h-5 ${s.text} dark:text-white`} />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">
                    <ArrowRightIcon className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white transition-colors" />
                </div>
            </div>
            
            <div>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-1 group-hover:scale-105 transition-transform origin-left">{count}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">{label}</p>
            </div>
            
            {/* Progress bar visual */}
            <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 mt-3 rounded-full overflow-hidden">
                <div className={`h-full ${s.bg} opacity-60 w-1/3 group-hover:w-2/3 transition-all duration-700 ease-out`}></div>
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
        vitrina: 0
    });
    const [recentJobs, setRecentJobs] = useState<Trabajo[]>([]);

    useEffect(() => {
        if (loading) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const trabajosHoy = trabajos.filter(t => new Date(t.fechaEntrada) >= today);
        const ingresosHoy = trabajosHoy.reduce((sum, t) => sum + t.abono, 0);
        
        // Calcular saldo total pendiente de todos los trabajos activos (no entregados) + entregados con deuda (raro pero posible)
        const saldos = trabajos
            .filter(t => t.saldo > 0 && t.estado !== TrabajoEstado.ENTREGADO)
            .reduce((sum, t) => sum + t.saldo, 0);

        setStats({
            ingresosHoy,
            pedidosHoy: trabajosHoy.length,
            saldosPendientes: saldos,
            diseno: trabajos.filter(t => t.estado === TrabajoEstado.PENDIENTE || t.estado === TrabajoEstado.EN_DISENO).length,
            produccion: trabajos.filter(t => t.estado === TrabajoEstado.PROCESO).length,
            vitrina: trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length
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

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
                <Loader2Icon className="h-12 w-12 text-brand-blue animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Sincronizando panel...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-12 max-w-7xl mx-auto px-2">
            
            {/* Header Section Premium */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl p-8 sm:p-10">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-brand-blue rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-2">
                            <CalendarDaysIcon className="w-4 h-4" />
                            {new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
                            {getGreeting()}, <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">{currentUser.nombre}</span>
                        </h1>
                        <p className="text-slate-400 max-w-lg text-sm md:text-base leading-relaxed">
                            Resumen operativo en tiempo real. Tienes <strong className="text-white">{stats.diseno} trabajos</strong> esperando diseño.
                        </p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => refreshData()} 
                            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-md transition-all text-white border border-white/10 hover:border-white/20 group"
                            title="Actualizar Datos"
                        >
                            <Loader2Icon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                        </button>
                        <NavLink 
                            to="/nuevo"
                            className="flex-1 md:flex-none px-8 py-4 bg-gradient-to-r from-brand-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/50 transition-all transform hover:-translate-y-1 hover:shadow-blue-500/30 flex items-center justify-center gap-3"
                        >
                            <div className="bg-white/20 p-1 rounded-full"><AddIcon className="w-4 h-4" /></div>
                            Nuevo Pedido
                        </NavLink>
                    </div>
                </div>
            </div>

            {/* Production Status Pulse (Interactive) */}
            <div>
                <div className="flex items-center gap-2 mb-4 px-1">
                    <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Flujo de Trabajo</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <ProductionStatusCard label="En Diseño" count={stats.diseno} icon={PaletteIcon} color="indigo" to="/diseno" />
                    <ProductionStatusCard label="En Producción" count={stats.produccion} icon={PrinterIcon} color="blue" to="/kds" />
                    <ProductionStatusCard label="Listos / Vitrina" count={stats.vitrina} icon={CheckCircleIcon} color="emerald" to="/retiros" />
                </div>
            </div>

            {/* Main Stats Row (Interactive) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Ingresos (Hoy)" 
                    value={formatCurrency(stats.ingresosHoy)} 
                    icon={SolidDollarIcon} 
                    variant="blue" 
                    trend="Ver reporte financiero"
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
                    icon={SolidClockIcon} 
                    variant="red"
                    trend="Gestionar cobros"
                    to="/retiros"
                />
            </div>

            {/* Split Content */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left: Recent Activity List */}
                <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <SolidClockIcon className="w-5 h-5 text-gray-400" />
                            Últimos Movimientos
                        </h2>
                        <NavLink to="/trabajos" className="text-xs font-bold text-brand-blue hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full transition-colors">
                            Ver historial completo
                        </NavLink>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50 flex-grow">
                        {recentJobs.length > 0 ? recentJobs.map((job) => (
                            <div 
                                key={job.id} 
                                onClick={() => navigate(`/trabajos/${job.id}`)}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all cursor-pointer group flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-sm transition-transform group-hover:scale-110
                                        ${job.estado === TrabajoEstado.ENTREGADO ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'}
                                    `}>
                                        {job.titular.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-brand-blue transition-colors mb-0.5">
                                            {job.titular}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <span className="font-mono font-medium text-gray-400">#{job.orden}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                            <span className="truncate max-w-[150px] sm:max-w-[200px]">{job.subtipo}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(job.total)}</p>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block 
                                        ${job.estado === TrabajoEstado.PENDIENTE ? 'bg-yellow-100 text-yellow-700' : 
                                          job.estado === TrabajoEstado.VITRINA ? 'bg-purple-100 text-purple-700' :
                                          job.estado === TrabajoEstado.ENTREGADO ? 'bg-green-100 text-green-700' : 
                                          'bg-blue-100 text-blue-700'}`}>
                                        {job.estado}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                                <DocumentIcon className="w-16 h-16 mb-4 opacity-10" />
                                <p>No hay actividad reciente registrada.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Quick Actions Grid */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Accesos Directos</h2>
                    <div className="flex flex-col gap-3">
                        <ActionButton 
                            to="/nuevo" 
                            icon={AddIcon} 
                            label="Crear Pedido" 
                            desc="Nueva orden de trabajo."
                            color="blue"
                        />
                        <ActionButton 
                            to="/kds" 
                            icon={KdsIcon} 
                            label="Producción KDS" 
                            desc="Gestión de taller."
                            color="orange"
                        />
                        <ActionButton 
                            to="/retiros" 
                            icon={ReceiptIcon} 
                            label="Caja y Entregas" 
                            desc="Cobros y despachos."
                            color="green"
                        />
                        <ActionButton 
                            to="/finanzas" 
                            icon={SolidFinanceIcon} 
                            label="Reportes" 
                            desc="Métricas financieras."
                            color="purple"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
