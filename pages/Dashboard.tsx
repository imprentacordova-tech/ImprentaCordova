
import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext, useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { TrabajoEstado, User } from '../types';
import {
    SparklesIcon, ArrowRightIcon, ActivityIcon,
    WalletIcon, UsersIcon, RocketLaunchIcon,
    MonitorIcon, ChevronRightIcon,
    CheckCircleIcon, ExclamationTriangleIcon, BoltIcon,
    PlusIcon, ReceiptIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { motion } from 'framer-motion';
import { ProductionPulse, AreaLoad, LiveLogs } from '../components/dashboard/TelemetryModule';
import { getActivityLog, ActivityEntry } from '../services/activityLogService';

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────
const ESTADO_CONFIG: Record<TrabajoEstado, { label: string; dot: string; bg: string; text: string }> = {
    [TrabajoEstado.PENDIENTE]:  { label: 'Pendiente',   dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-400' },
    [TrabajoEstado.EN_DISENO]:  { label: 'En Diseño',   dot: 'bg-purple-400',  bg: 'bg-purple-500/10',  text: 'text-purple-400' },
    [TrabajoEstado.PROCESO]:    { label: 'En Prensa',   dot: 'bg-blue-400',    bg: 'bg-brand-blue/10',  text: 'text-brand-blue' },
    [TrabajoEstado.VITRINA]:    { label: 'Listo',       dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    [TrabajoEstado.ENTREGADO]:  { label: 'Entregado',   dot: 'bg-slate-300',   bg: 'bg-white/[0.04]',   text: 'text-slate-400' },
};

// ─── KPI CARD ─────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
    label: string;
    value: string | number;
    sub: string;
    icon: React.ElementType;
    accent: string;
    iconBg: string;
    onClick?: () => void;
    delay?: number;
}> = ({ label, value, sub, icon: Icon, accent, iconBg, onClick, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        onClick={onClick}
        className={`group bg-obsidian-card border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/[0.08] hover:shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${accent}`} />
            </div>
            {onClick && (
                <ChevronRightIcon className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            )}
        </div>
        <div>
            <div className={`text-3xl font-black tracking-tighter ${accent}`}>{value}</div>
            <div className="text-[11px] font-bold text-white mt-0.5">{label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>
        </div>
    </motion.div>
);

// ─── ORDER ROW ─────────────────────────────────────────────────────────────
const OrderRow: React.FC<{ t: any; onClick: () => void; idx: number }> = ({ t, onClick, idx }) => {
    const cfg = ESTADO_CONFIG[t.estado as TrabajoEstado] ?? ESTADO_CONFIG[TrabajoEstado.PENDIENTE];
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.4 }}
            onClick={onClick}
            className="group flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.04] rounded-xl transition-all cursor-pointer border border-transparent hover:border-white/[0.06]"
        >
            {/* Status dot */}
            <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

            {/* Order info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 font-mono">#{String(t.orden).padStart(4, '0')}</span>
                    <span className="text-[12px] font-bold text-white truncate">{t.titular}</span>
                    {t.prioridad === 'Urgente' && (
                        <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-brand-red/10 text-brand-red border border-brand-red/20 rounded-full shrink-0">
                            Urgente
                        </span>
                    )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">{t.tipo} · {t.subtipo}</div>
            </div>

            {/* Status badge */}
            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 hidden sm:block
                ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
            </span>

            {/* Amount */}
            <div className="text-right shrink-0">
                <div className="text-[12px] font-black text-white">{formatCurrency(t.total)}</div>
                {t.saldo > 0 && (
                    <div className="text-[9px] font-bold text-red-500">−{formatCurrency(t.saldo)}</div>
                )}
            </div>

            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors" />
        </motion.div>
    );
};

// ─── QUICK ACTION BUTTON ────────────────────────────────────────────────────
const QuickAction: React.FC<{
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
}> = ({ label, icon: Icon, onClick, variant = 'secondary' }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all active:scale-95 ${
            variant === 'primary'
                ? 'bg-brand-blue text-white hover:bg-brand-blue/90 shadow-blue-glow-sm'
                : 'bg-obsidian-card text-slate-200 border border-white/[0.06] hover:border-brand-blue/30 hover:text-brand-blue'
        }`}
    >
        <Icon className="w-3.5 h-3.5" />
        {label}
    </button>
);

// ─── DASHBOARD PAGE ─────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, loading } = useData();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<ActivityEntry[]>([]);

    useEffect(() => {
        getActivityLog(20).then(setLogs);
        const i = setInterval(() => getActivityLog(20).then(setLogs), 30000);
        return () => clearInterval(i);
    }, []);

    // ── Real KPIs from Supabase data ──────────────────────────────────────
    const kpis = useMemo(() => {
        if (!trabajos || !clientes) return null;
        const today = new Date().toISOString().slice(0, 10);
        const activos = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO);
        const entregadosHoy = trabajos.filter(t =>
            t.estado === TrabajoEstado.ENTREGADO &&
            (t.fechaEntrega ?? '').startsWith(today)
        );
        const porCobrar = activos.filter(t => t.saldo > 0);
        const totalCobrar = porCobrar.reduce((s, t) => s + t.saldo, 0);
        const urgentes = activos.filter(t => t.prioridad === 'Urgente');
        const enProduccion = activos.filter(t =>
            t.estado === TrabajoEstado.PROCESO || t.estado === TrabajoEstado.EN_DISENO
        );

        return {
            activos: activos.length,
            enProduccion: enProduccion.length,
            porCobrar: porCobrar.length,
            totalCobrar,
            entregadosHoy: entregadosHoy.length,
            urgentes: urgentes.length,
            totalClientes: clientes.length,
        };
    }, [trabajos, clientes]);

    // ── Recent orders (last 8, excluding delivered) ───────────────────────
    const recentOrders = useMemo(() => {
        if (!trabajos) return [];
        return [...trabajos]
            .filter(t => t.estado !== TrabajoEstado.ENTREGADO)
            .sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime())
            .slice(0, 8);
    }, [trabajos]);

    // ─── Loading state ─────────────────────────────────────────────────────
    if (loading || !kpis) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-10 h-10 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin mx-auto" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cargando datos…</p>
            </div>
        </div>
    );

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <div className="p-5 lg:p-8 pb-24 lg:pb-10 space-y-8 max-w-[1440px] mx-auto">

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.35em]">
                        {greeting}, {currentUser.nombre.split(' ')[0]}
                    </p>
                    <h1 className="text-2xl font-black text-white tracking-tighter mt-0.5">
                        Panel de Control
                    </h1>
                </div>

                <div className="flex flex-wrap gap-2">
                    <QuickAction label="Nueva Orden" icon={SparklesIcon} onClick={() => navigate('/nuevo')} variant="primary" />
                    <QuickAction label="Ver Taller" icon={MonitorIcon} onClick={() => navigate('/kds')} />
                    <QuickAction label="Cobrar" icon={WalletIcon} onClick={() => navigate('/cuentas')} />
                </div>
            </div>

            {/* ── ALERT BANNER (urgentes) ─────────────────────────────────── */}
            {kpis.urgentes > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 px-5 py-3.5 bg-brand-red/10 border border-brand-red/20 rounded-xl cursor-pointer hover:bg-brand-red/15 transition-colors"
                    onClick={() => navigate('/trabajos')}
                >
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-[11px] font-black text-brand-red uppercase tracking-wider">
                        {kpis.urgentes} {kpis.urgentes === 1 ? 'orden urgente pendiente' : 'órdenes urgentes pendientes'}
                    </span>
                    <ChevronRightIcon className="w-3.5 h-3.5 text-red-400 ml-auto" />
                </motion.div>
            )}

            {/* ── KPI GRID ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Órdenes Activas"
                    value={kpis.activos}
                    sub="Sin entregar"
                    icon={ActivityIcon}
                    accent="text-brand-blue"
                    iconBg="bg-brand-blue/8"
                    onClick={() => navigate('/trabajos')}
                    delay={0.05}
                />
                <KpiCard
                    label="En Producción"
                    value={kpis.enProduccion}
                    sub="Diseño + Prensa"
                    icon={BoltIcon}
                    accent="text-purple-600"
                    iconBg="bg-purple-500/10"
                    onClick={() => navigate('/kds')}
                    delay={0.1}
                />
                <KpiCard
                    label="Por Cobrar"
                    value={formatCurrency(kpis.totalCobrar)}
                    sub={`${kpis.porCobrar} órdenes con saldo`}
                    icon={WalletIcon}
                    accent="text-amber-600"
                    iconBg="bg-amber-50"
                    onClick={() => navigate('/cuentas')}
                    delay={0.15}
                />
                <KpiCard
                    label="Entregados Hoy"
                    value={kpis.entregadosHoy}
                    sub="Trabajos completados"
                    icon={CheckCircleIcon}
                    accent="text-emerald-600"
                    iconBg="bg-emerald-50"
                    delay={0.2}
                />
            </div>

            {/* ── MAIN CONTENT GRID ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Left: Orders list */}
                <div className="xl:col-span-8 bg-obsidian-card border border-white/[0.06] rounded-2xl overflow-hidden">
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                        <div>
                            <h2 className="text-[13px] font-black text-white">Órdenes Activas</h2>
                            <p className="text-[10px] text-slate-400 mt-0.5">{kpis.activos} trabajos en curso</p>
                        </div>
                        <Link
                            to="/trabajos"
                            className="flex items-center gap-1.5 text-[10px] font-black text-brand-blue hover:text-brand-blue/70 uppercase tracking-wider transition-colors"
                        >
                            Ver todas <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                    </div>

                    {/* Orders */}
                    <div className="p-3 space-y-0.5">
                        {recentOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircleIcon className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                                <p className="text-[12px] font-bold text-slate-300">Sin órdenes activas.</p>
                                <button
                                    onClick={() => navigate('/nuevo')}
                                    className="mt-4 flex items-center gap-2 mx-auto text-[10px] font-black text-brand-blue uppercase tracking-wider hover:text-brand-blue/70 transition-colors"
                                >
                                    <PlusIcon className="w-3.5 h-3.5" /> Crear primera orden
                                </button>
                            </div>
                        ) : (
                            recentOrders.map((t, idx) => (
                                <OrderRow
                                    key={t.id}
                                    t={t}
                                    idx={idx}
                                    onClick={() => navigate(`/trabajos/${t.id}`)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Charts + Activity */}
                <div className="xl:col-span-4 space-y-5">

                    {/* Production chart */}
                    <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl p-5 h-[200px]">
                        <ProductionPulse trabajos={trabajos} />
                    </div>

                    {/* Area load chart */}
                    <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl p-5 h-[200px]">
                        <AreaLoad trabajos={trabajos} />
                    </div>

                    {/* Quick stats bar */}
                    <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl p-5">
                        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Resumen</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Total clientes',  value: kpis.totalClientes,            icon: UsersIcon,  color: 'text-brand-blue' },
                                { label: 'Órdenes activas', value: kpis.activos,                  icon: ActivityIcon, color: 'text-purple-600' },
                                { label: 'Con saldo',       value: kpis.porCobrar,                icon: ReceiptIcon,  color: 'text-amber-600' },
                                { label: 'Entregados hoy',  value: kpis.entregadosHoy,            icon: CheckCircleIcon, color: 'text-emerald-600' },
                            ].map(item => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                                    <span className="text-[11px] font-medium text-slate-300 flex-1">{item.label}</span>
                                    <span className={`text-[13px] font-black ${item.color}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── ACTIVITY LOG ───────────────────────────────────────────── */}
            <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-[13px] font-black text-white">Actividad Reciente</h2>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <Link to="/registro" className="text-[10px] font-black text-brand-blue hover:text-brand-blue/70 uppercase tracking-wider transition-colors flex items-center gap-1">
                        Ver todo <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                </div>
                <div className="p-5 h-[200px]">
                    <LiveLogs logs={logs} />
                </div>
            </div>

        </div>
    );
};

export default DashboardPage;
