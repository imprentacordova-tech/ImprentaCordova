
import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, User, Cliente, Regimen } from '../types';
import { 
    SolidDollarIcon, SolidBoxIcon, KdsIcon, AddIcon, ReceiptIcon, Loader2Icon, 
    ArrowRightIcon, PaletteIcon, PrinterIcon, CheckCircleIcon, DocumentIcon,
    /* Added UsersIcon to fixed ReferenceError on line 187 */
    SolidClockIcon, SolidFinanceIcon, CalendarDaysIcon, WrenchScrewdriverIcon, SparklesIcon, UserPlusIcon, UsersIcon,
    ShieldCheckIcon, DocumentTextIcon, CalculatorIcon, MonitorIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { CreateClientModal } from '../components/orders/ClientSelector';

const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    icon: React.ComponentType<{ className?: string }>; 
    trend?: string;
    trendColor?: string;
    variant: 'blue' | 'green' | 'red' | 'navy';
    to: string;
}> = ({ title, value, icon: Icon, trend, trendColor = "text-emerald-500", variant, to }) => {
    const styles = {
        blue: { bg: 'bg-white dark:bg-slate-900', iconBg: 'bg-blue-50 dark:bg-blue-500/10', iconColor: 'text-brand-blue' },
        green: { bg: 'bg-white dark:bg-slate-900', iconBg: 'bg-emerald-50 dark:bg-emerald-500/10', iconColor: 'text-emerald-600' },
        red: { bg: 'bg-white dark:bg-slate-900', iconBg: 'bg-rose-50 dark:bg-rose-500/10', iconColor: 'text-rose-600' },
        navy: { bg: 'bg-white dark:bg-slate-900', iconBg: 'bg-slate-100 dark:bg-white/5', iconColor: 'text-slate-600' },
    };
    const s = styles[variant];

    return (
        <NavLink to={to} className={`relative overflow-hidden rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:border-brand-blue/30 hover:shadow-2xl hover:shadow-brand-blue/5 group ${s.bg}`}>
            <div className="flex justify-between items-start z-10 relative">
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
                    {trend && (
                        <div className={`flex items-center text-[10px] font-bold uppercase tracking-widest ${trendColor}`}>
                           {trend}
                        </div>
                    )}
                </div>
                <div className={`p-4 rounded-2xl ${s.iconBg} transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>
            </div>
            {/* Decoración sutil de fondo */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${s.iconColor.replace('text-', 'bg-')}`}></div>
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
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        const tHoy = trabajos.filter(t => new Date(t.fechaEntrada).getTime() >= startOfToday);
        const tEntregadosHoy = tHoy.filter(t => t.estado === TrabajoEstado.ENTREGADO);
        const popularCount = clientes.filter(c => c.regimen === Regimen.NEGOCIO_POPULAR).length;

        const totalCaja = tHoy.reduce((sum, t) => sum + t.abono, 0);
        const pendingValue = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO).reduce((sum, t) => sum + t.saldo, 0);

        return {
            ingresosHoy: totalCaja,
            pedidosHoy: tHoy.length,
            entregadosHoy: tEntregadosHoy.length,
            saldosPendientes: pendingValue,
            enDiseno: trabajos.filter(t => t.estado === TrabajoEstado.PENDIENTE || t.estado === TrabajoEstado.EN_DISENO).length,
            enProduccion: trabajos.filter(t => t.estado === TrabajoEstado.PROCESO).length,
            enVitrina: trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length,
            popularCount,
            totalClientes: clientes.length,
            performance: 92
        };
    }, [trabajos, clientes, loading]);

    if (loading || !stats) return (
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
            <Loader2Icon className="animate-spin h-12 w-12 text-brand-blue" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Sincronizando Sistema...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-fade-in pb-12">
            
            {/* 1. SECTOR DE ESTADO MAESTRO (GLASSMORPHISM) */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 border border-white/5 shadow-3xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[140px] -mr-64 -mt-64 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-red/10 rounded-full blur-[100px] -ml-48 -mb-48 opacity-50"></div>
                
                <div className="relative z-10 p-10 md:p-14">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
                        <div className="space-y-6 max-w-2xl">
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Sistema Activo</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pasaje, El Oro</span>
                            </div>
                            
                            <h1 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter">
                                BUENOS DÍAS, <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-white italic">{currentUser.nombre.toUpperCase()}</span>
                            </h1>
                            
                            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-lg">
                                El taller reporta un <span className="text-white font-bold">{stats.performance}% de eficiencia</span> operativa hoy. Tienes <span className="text-brand-red font-bold underline decoration-2 underline-offset-4">{stats.enDiseno} artes</span> esperando aprobación.
                            </p>
                        </div>

                        {/* Widget de Métricas Rápidas en Hero */}
                        <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                <p className="text-[9px] font-black text-blue-300 uppercase tracking-[0.2em] mb-2">Ingresos Hoy</p>
                                <p className="text-3xl font-black text-white">{formatCurrency(stats.ingresosHoy)}</p>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                                <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mb-2">Entregas</p>
                                <p className="text-3xl font-black text-white">{stats.entregadosHoy}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. BARRA DE ACCIONES CRÍTICAS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Nueva Orden', icon: AddIcon, to: '/nuevo', color: 'bg-brand-red', text: 'text-white' },
                    { label: 'Registrar Cliente', icon: UserPlusIcon, onClick: () => setIsClientModalOpen(true), color: 'bg-white dark:bg-slate-900', text: 'text-slate-900 dark:text-white' },
                    { label: 'Calcular Offset', icon: CalculatorIcon, to: '/calculadora', color: 'bg-white dark:bg-slate-900', text: 'text-slate-900 dark:text-white' },
                    { label: 'Taller (KDS)', icon: MonitorIcon, to: '/kds', color: 'bg-slate-900', text: 'text-white' },
                ].map((action, i) => (
                    action.to ? (
                        <NavLink key={i} to={action.to} className={`${action.color} ${action.text} p-5 rounded-3xl flex items-center justify-center gap-4 font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all border border-transparent hover:border-brand-blue/20`}>
                            <action.icon className="w-5 h-5" /> {action.label}
                        </NavLink>
                    ) : (
                        <button key={i} onClick={action.onClick} className={`${action.color} ${action.text} p-5 rounded-3xl flex items-center justify-center gap-4 font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all border border-slate-100 dark:border-slate-800`}>
                            <action.icon className="w-5 h-5" /> {action.label}
                        </button>
                    )
                ))}
            </div>

            {/* 3. GRILLA DE INDICADORES FINANCIEROS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Balance de Caja" 
                    value={formatCurrency(stats.ingresosHoy)} 
                    icon={SolidDollarIcon} 
                    variant="green" 
                    trend="Flujo diario" 
                    to="/finanzas" 
                />
                <StatCard 
                    title="Cartera Pendiente" 
                    value={formatCurrency(stats.saldosPendientes)} 
                    icon={SolidClockIcon} 
                    variant="red" 
                    trend="Cuentas por cobrar" 
                    to="/retiros" 
                />
                <StatCard 
                    title="Órdenes Nuevas" 
                    value={String(stats.pedidosHoy)} 
                    icon={SolidBoxIcon} 
                    variant="blue" 
                    trend="Últimas 24 horas" 
                    to="/trabajos" 
                />
                <StatCard 
                    title="Base Clientes" 
                    value={String(stats.totalClientes)} 
                    icon={UsersIcon} 
                    variant="navy" 
                    trend={`${stats.popularCount} son populares`} 
                    to="/clientes" 
                />
            </div>

            {/* 4. SECCIÓN DE PRODUCCIÓN Y ACTIVIDAD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Flujo de Trabajo */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Estado de Línea</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Carga de trabajo por estación</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl">
                             <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">En Tiempo Real</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { label: 'DISEÑO', val: stats.enDiseno, color: 'indigo', icon: PaletteIcon, desc: 'Esperando arte' },
                            { label: 'PROCESO', val: stats.enProduccion, color: 'blue', icon: PrinterIcon, desc: 'En máquinas' },
                            { label: 'VITRINA', val: stats.enVitrina, color: 'emerald', icon: CheckCircleIcon, desc: 'Listo p/retiro' }
                        ].map(st => (
                            <div key={st.label} className="relative group p-8 rounded-[2.5rem] bg-slate-50 dark:bg-white/5 border border-transparent hover:border-brand-blue/20 transition-all">
                                <div className={`w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 text-${st.color}-500 shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <st.icon className="w-7 h-7" />
                                </div>
                                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{st.val}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{st.label}</p>
                                <p className="text-[9px] font-bold text-brand-blue uppercase mt-3 opacity-60">{st.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recientes / Alertas */}
                <div className="bg-slate-900 text-white rounded-[3rem] p-10 flex flex-col border border-white/5">
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-8">Alertas SRI</h3>
                    <div className="space-y-6 flex-grow">
                        {trabajos.filter(t => t.tipo === 'sri' && t.estado !== TrabajoEstado.ENTREGADO).slice(0, 4).map(t => (
                            <div key={t.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                                    <ShieldCheckIcon className="w-5 h-5 text-orange-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black uppercase truncate">{t.titular}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Orden #{t.orden} — {t.estado}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => navigate('/trabajos')} className="mt-10 w-full py-4 bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all">Ver Toda la Producción</button>
                </div>
            </div>

            <CreateClientModal 
                isOpen={isClientModalOpen} 
                onClose={() => setIsClientModalOpen(false)} 
                onClientCreated={(c) => { setIsClientModalOpen(false); refreshData(); }} 
            />
        </div>
    );
};

export default DashboardPage;
