
import React, { useState, useEffect } from 'react';
import { NavLink, useOutletContext } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Kpi, Trabajo, TrabajoEstado, User } from '../types';
import { SolidDollarIcon, SolidFinanceIcon, SolidClockIcon, SolidBoxIcon, KdsIcon, AddIcon } from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';

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

const QuickAccessCard: React.FC<{ to: string; icon: React.ComponentType<{className?: string}>; label: string; description: string; }> = ({ to, icon: Icon, label, description }) => {
    return (
         <NavLink 
            to={to} 
            className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:border-brand-blue hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
        >
            <Icon className="h-10 w-10 mb-4 text-brand-blue transition-transform duration-300 group-hover:scale-110" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{label}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
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
        <div className="space-y-10 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bienvenido de nuevo, {currentUser.nombre} 👋</h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">Aquí tienes un resumen de la actividad de tu imprenta.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {kpis.map(kpi => <KpiCard key={kpi.title} kpi={kpi} />)}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-5">Actividad Reciente</h2>
                    <div className="space-y-4">
                        {recentJobs.length > 0 ? recentJobs.map(job => (
                            <NavLink to={`/trabajos/${job.id}`} key={job.id} className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-lg transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white">#{job.orden} - {clientes[job.clienteId] || 'N/A'}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{job.subtipo}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(job.total)}</p>
                                        {getStatusBadge(job.estado)}
                                    </div>
                                </div>
                            </NavLink>
                        )) : <p className="text-center text-gray-500 py-8">No hay trabajos recientes.</p>}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Accesos Rápidos</h2>
                    <QuickAccessCard to="/nuevo" icon={AddIcon} label="Nuevo Pedido" description="Crea una nueva orden de trabajo."/>
                    <QuickAccessCard to="/kds" icon={KdsIcon} label="Taller (KDS)" description="Visualiza el flujo de producción."/>
                    <QuickAccessCard to="/finanzas" icon={SolidFinanceIcon} label="Reportes" description="Analiza tus finanzas."/>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
