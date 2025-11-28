
import React, { useState, useEffect } from 'react';
import { NavLink, useOutletContext } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Kpi, Trabajo, TrabajoEstado, User } from '../types';
import { SolidDollarIcon, SolidFinanceIcon, SolidClockIcon, SolidBoxIcon, KdsIcon, AddIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

interface KpiCardProps {
  kpi: Kpi;
}

const KpiCard: React.FC<KpiCardProps> = ({ kpi }) => {
    const variants = {
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-300' },
        green: { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-300' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-300' },
        red: { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300' },
        gray: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-800 dark:text-gray-300' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-800 dark:text-orange-300' },
    };

    const style = variants[kpi.variant];

    return (
        <div className={`p-6 rounded-2xl shadow-sm ${style.bg} flex items-start justify-between`}>
            <div>
                <p className={`text-sm font-bold ${style.text}`}>{kpi.title}</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{kpi.metric}</p>
                {kpi.tag && (
                    <span className={`mt-3 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-white/50`}>
                        {kpi.tag}
                    </span>
                )}
            </div>
            <div className={`p-3 rounded-full bg-white/60`}>
                <kpi.icon className={`h-6 w-6 ${style.text}`} />
            </div>
        </div>
    );
};

// Tarjeta rediseñada para ser más compacta y visualmente atractiva en móviles y escritorio
const QuickAccessCard: React.FC<{ to: string; icon: React.ComponentType<{className?: string}>; label: string; description: string; colorClass?: string }> = ({ to, icon: Icon, label, description, colorClass = "text-brand-blue" }) => {
    return (
         <NavLink 
            to={to} 
            className="group bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-brand-blue hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-between"
        >
            <div>
                <div className={`p-3 bg-gray-50 dark:bg-gray-700/50 w-fit rounded-xl mb-3 group-hover:bg-brand-blue transition-colors duration-300`}>
                    <Icon className={`h-6 w-6 ${colorClass} group-hover:text-white transition-colors duration-300`} />
                </div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1 leading-tight">{label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{description}</p>
            </div>
        </NavLink>
    )
}

const DashboardPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const [kpis, setKpis] = useState<Kpi[]>([]);
    const [recentJobs, setRecentJobs] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<any>({});

    useEffect(() => {
        const fetchData = async () => {
            const [trabajos, clientesData] = await Promise.all([getTrabajos(), getClientes()]);
            
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const trabajosHoy = trabajos.filter(t => new Date(t.fechaEntrada) >= today);

            const ingresosHoy = trabajosHoy.reduce((sum, t) => sum + t.abono, 0);
            const pedidosHoy = trabajosHoy.length;
            
            const saldosPendientes = trabajos
                .filter(t => t.saldo > 0 && t.estado !== TrabajoEstado.ENTREGADO)
                .reduce((sum, t) => sum + t.saldo, 0);

            setKpis([
                { title: 'Ingresos de Hoy', metric: formatCurrency(ingresosHoy), icon: SolidDollarIcon, variant: 'blue' },
                { title: 'Pedidos de Hoy', metric: String(pedidosHoy), icon: SolidBoxIcon, variant: 'green' },
                { title: 'Saldos Pendientes', metric: formatCurrency(saldosPendientes), icon: SolidClockIcon, variant: 'red' },
            ]);

            const clientesMap = clientesData.reduce((acc, cliente) => {
                acc[cliente.id] = cliente.nombre;
                return acc;
            }, {} as Record<string, string>);
            setClientes(clientesMap);

            const sortedJobs = [...trabajos].sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime());
            setRecentJobs(sortedJobs.slice(0, 5));
        };
        fetchData();
    }, []);
    
    const getStatusBadge = (status: TrabajoEstado) => {
        const styles = {
            [TrabajoEstado.PENDIENTE]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800",
            [TrabajoEstado.PROCESO]: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
            [TrabajoEstado.VITRINA]: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
            [TrabajoEstado.ENTREGADO]: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800",
        };
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>
    }

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Bienvenido, {currentUser.nombre} 👋</h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400 text-sm md:text-base">Resumen de actividad de Imprenta Córdova.</p>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {kpis.map(kpi => <KpiCard key={kpi.title} kpi={kpi} />)}
            </div>
            
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Recent Activity (Takes 2 columns on desktop) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 h-fit">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Actividad Reciente</h2>
                        <NavLink to="/trabajos" className="text-sm font-semibold text-brand-blue hover:underline">Ver todo</NavLink>
                    </div>
                    <div className="space-y-3">
                        {recentJobs.length > 0 ? recentJobs.map(job => (
                            <NavLink to={`/trabajos/${job.id}`} key={job.id} className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-brand-blue font-bold text-xs">
                                            #{job.orden}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white text-sm">{clientes[job.clienteId] || 'Cliente'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{job.subtipo}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(job.total)}</p>
                                        {getStatusBadge(job.estado)}
                                    </div>
                                </div>
                            </NavLink>
                        )) : <p className="text-center text-gray-500 py-8 text-sm">No hay trabajos recientes.</p>}
                    </div>
                </div>

                {/* Quick Access (Takes 1 column on desktop, but adjusts on mobile) */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white px-1">Accesos Rápidos</h2>
                    {/* Grid de 2 columnas en móvil, 1 columna en desktop */}
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                        <QuickAccessCard 
                            to="/nuevo" 
                            icon={AddIcon} 
                            label="Nuevo Pedido" 
                            description="Crear orden de trabajo" 
                            colorClass="text-brand-blue"
                        />
                        <QuickAccessCard 
                            to="/kds" 
                            icon={KdsIcon} 
                            label="Taller (KDS)" 
                            description="Ver flujo de producción"
                            colorClass="text-orange-500"
                        />
                        <QuickAccessCard 
                            to="/finanzas" 
                            icon={SolidFinanceIcon} 
                            label="Reportes" 
                            description="Ver resumen financiero"
                            colorClass="text-green-600"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
