import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { 
    AddIcon, SearchIcon, FilterIcon, 
    SparklesIcon, ActivityIcon, CheckCircleIcon,
    ClockIcon, PaletteIcon, PrinterIcon, MonitorIcon,
    ChevronRightIcon, ArrowRightIcon, PlusIcon,
    ReceiptIcon, ShieldCheckIcon, RocketLaunchIcon, Loader2Icon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';

const statusMeta: Record<TrabajoEstado, { label: string; icon: any; color: string; bg: string; dot: string }> = {
    [TrabajoEstado.PENDIENTE]: { 
        label: 'Pendiente', icon: ClockIcon, 
        color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' 
    },
    [TrabajoEstado.EN_DISENO]: { 
        label: 'En Diseño', icon: PaletteIcon, 
        color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' 
    },
    [TrabajoEstado.PROCESO]: { 
        label: 'En Prensa', icon: PrinterIcon, 
        color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' 
    },
    [TrabajoEstado.VITRINA]: { 
        label: 'Listo / Vitrina', icon: MonitorIcon, 
        color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' 
    },
    [TrabajoEstado.ENTREGADO]: { 
        label: 'Entregado', icon: CheckCircleIcon, 
        color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', dot: 'bg-slate-400' 
    },
};

const TrabajosPage: React.FC = () => {
    const { trabajos, clientes, loading } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState<'Todos' | 'SRI' | 'GENERAL'>('Todos');
    const [estadoFilter, setEstadoFilter] = useState<TrabajoEstado | 'Todos'>('Todos');

    const counts = useMemo(() => {
        if (!trabajos) return { total: 0, [TrabajoEstado.PENDIENTE]: 0, [TrabajoEstado.EN_DISENO]: 0, [TrabajoEstado.PROCESO]: 0, [TrabajoEstado.VITRINA]: 0, [TrabajoEstado.ENTREGADO]: 0 };
        return {
            total: trabajos.length,
            [TrabajoEstado.PENDIENTE]: trabajos.filter(t => t.estado === TrabajoEstado.PENDIENTE).length,
            [TrabajoEstado.EN_DISENO]: trabajos.filter(t => t.estado === TrabajoEstado.EN_DISENO).length,
            [TrabajoEstado.PROCESO]: trabajos.filter(t => t.estado === TrabajoEstado.PROCESO).length,
            [TrabajoEstado.VITRINA]: trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length,
            [TrabajoEstado.ENTREGADO]: trabajos.filter(t => t.estado === TrabajoEstado.ENTREGADO).length,
        };
    }, [trabajos]);

    const filteredTrabajos = useMemo(() => {
        const lower = searchTerm.toLowerCase().trim();
        return trabajos.filter(t => {
            const clienteObj = clientes.find(c => c.id === t.clienteId);
            const clienteNombre = clienteObj ? clienteObj.nombre.toLowerCase() : t.titular.toLowerCase();
            
            const searchMatch = lower === '' ||
                clienteNombre.includes(lower) ||
                String(t.orden).includes(lower) ||
                (t.tipo || '').toLowerCase().includes(lower) ||
                (t.subtipo || '').toLowerCase().includes(lower);

            const tipoMatch = tipoFilter === 'Todos' || 
                (tipoFilter === 'SRI' ? t.esSRI : !t.esSRI);
            
            const estadoMatch = estadoFilter === 'Todos' || t.estado === estadoFilter;
            
            return searchMatch && tipoMatch && estadoMatch;
        });
    }, [trabajos, clientes, searchTerm, tipoFilter, estadoFilter]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 space-y-6 max-w-[1440px] mx-auto">
            <SEO title="Gestión de Órdenes · Imprenta Córdova" />

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">
                            Control de Producción ({trabajos.length} órdenes)
                        </span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter uppercase mt-0.5">
                        Gestión de Órdenes
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/nuevo')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-brand-blue text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-brand-blue/90 shadow-blue-glow-sm transition-all"
                    >
                        <SparklesIcon className="w-4 h-4" /> Nueva Orden
                    </button>
                </div>
            </div>

            {/* ── BÚSQUEDA Y FILTROS TIPO TRÁMITE ──────────────────────────── */}
            <div className="flex flex-col md:flex-row gap-3">
                {/* Input Búsqueda */}
                <div className="relative flex-1">
                    <SearchIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, N° orden, producto o tipo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-[12px] font-medium outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
                    />
                </div>

                {/* Filtro Tipo (Todos / SRI / Comercial) */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                    <button
                        onClick={() => setTipoFilter('Todos')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                            tipoFilter === 'Todos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setTipoFilter('SRI')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                            tipoFilter === 'SRI' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        SRI Fiscal
                    </button>
                    <button
                        onClick={() => setTipoFilter('GENERAL')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                            tipoFilter === 'GENERAL' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Comercial
                    </button>
                </div>
            </div>

            {/* ── TABS FILTRO POR ESTADO CON BADGE COUNTERS ─────────────────── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => setEstadoFilter('Todos')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all border ${
                        estadoFilter === 'Todos'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    <span>Todas las Órdenes</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                        estadoFilter === 'Todos' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                        {counts.total}
                    </span>
                </button>

                {Object.entries(statusMeta).map(([statusKey, meta]) => {
                    const st = statusKey as TrabajoEstado;
                    const count = counts[st] || 0;
                    const isSelected = estadoFilter === st;

                    return (
                        <button
                            key={st}
                            onClick={() => setEstadoFilter(st)}
                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all border ${
                                isSelected
                                    ? `${meta.bg} ${meta.color} font-black shadow-sm`
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            <span>{meta.label}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                                isSelected ? 'bg-black/10' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── LISTADO DESKTOP & TABLET / CARDS MOBILE ──────────────────── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center space-y-3">
                        <Loader2Icon className="w-8 h-8 text-brand-blue animate-spin mx-auto" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cargando órdenes de producción...</p>
                    </div>
                ) : filteredTrabajos.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <ActivityIcon className="w-10 h-10 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider">No se encontraron órdenes</h3>
                        <p className="text-[11px] text-slate-400">Intenta cambiando el filtro de búsqueda o estado.</p>
                    </div>
                ) : (
                    <>
                        {/* Vista Tabla Desktop / Tablet */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="p-4">N° Orden / Fecha</th>
                                        <th className="p-4">Cliente / Titular</th>
                                        <th className="p-4">Servicio / Producto</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4">Total / Saldo</th>
                                        <th className="p-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-700">
                                    {filteredTrabajos.map((t) => {
                                        const clienteObj = clientes.find(c => c.id === t.clienteId);
                                        const meta = statusMeta[t.estado] || statusMeta[TrabajoEstado.PENDIENTE];
                                        const hasBalance = t.saldo > 0;

                                        return (
                                            <tr
                                                key={t.id}
                                                onClick={() => navigate(`/trabajos/${t.id}`)}
                                                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                            >
                                                <td className="p-4">
                                                    <div className="font-black text-slate-900 font-mono text-sm group-hover:text-brand-blue transition-colors">
                                                        #{String(t.orden).padStart(4, '0')}
                                                    </div>
                                                    <div className="text-[9px] font-mono text-slate-400">
                                                        {formatDate(t.fechaEntrada).split(' ')[0]}
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    <div className="font-bold text-slate-900 truncate max-w-[220px]">
                                                        {clienteObj ? clienteObj.nombre : t.titular}
                                                    </div>
                                                    <div className="text-[9px] text-slate-400 uppercase font-mono">
                                                        {t.esSRI ? 'RUC SRI' : 'Consumidor Local'}
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                                            t.esSRI ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' : 'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                            {t.tipo}
                                                        </span>
                                                        <span className="text-[11px] text-slate-700 font-bold truncate max-w-[180px]">
                                                            {t.subtipo || t.detalle || 'Trabajo General'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${meta.bg} ${meta.color}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                                        {meta.label}
                                                    </span>
                                                </td>

                                                <td className="p-4">
                                                    <div className="font-black text-slate-900 text-sm">
                                                        {formatCurrency(t.total)}
                                                    </div>
                                                    {hasBalance ? (
                                                        <div className="text-[9px] font-bold text-red-500">
                                                            Saldo: {formatCurrency(t.saldo)}
                                                        </div>
                                                    ) : (
                                                        <div className="text-[9px] font-bold text-emerald-600">
                                                            Pagado
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="p-4 text-right">
                                                    <button className="p-2 bg-slate-100 group-hover:bg-brand-blue group-hover:text-white rounded-lg text-slate-500 transition-colors">
                                                        <ChevronRightIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Vista Cards Móvil */}
                        <div className="sm:hidden divide-y divide-slate-100">
                            {filteredTrabajos.map((t) => {
                                const clienteObj = clientes.find(c => c.id === t.clienteId);
                                const meta = statusMeta[t.estado] || statusMeta[TrabajoEstado.PENDIENTE];
                                const hasBalance = t.saldo > 0;

                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => navigate(`/trabajos/${t.id}`)}
                                        className="p-4 space-y-3 active:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-slate-900 font-mono text-sm">
                                                #{String(t.orden).padStart(4, '0')}
                                            </span>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${meta.bg} ${meta.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                                {meta.label}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm">
                                                {clienteObj ? clienteObj.nombre : t.titular}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {t.tipo} {t.subtipo ? '· ' + t.subtipo : ''}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                            <div>
                                                <span className="text-sm font-black text-slate-900">{formatCurrency(t.total)}</span>
                                                {hasBalance && (
                                                    <span className="text-[10px] font-bold text-red-500 ml-2">Saldo: {formatCurrency(t.saldo)}</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-black text-brand-blue uppercase flex items-center gap-1">
                                                Ver Detalle <ChevronRightIcon className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TrabajosPage;