import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado, TrabajoTipo } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { 
    AddIcon, SearchIcon, FilterIcon, 
    SparklesIcon, ActivityIcon, CheckCircleIcon,
    ClockIcon, PaletteIcon, PrinterIcon, MonitorIcon,
    TerminalIcon, ShieldCheckIcon as ShieldIcon, ChevronRightIcon,
    ArrowPathIcon, AdjustmentsHorizontalIcon, CubeTransparentIcon,
    HomeIcon, BoxIcon, RocketLaunchIcon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';

// --- STYLES & ASSETS (Updated for Precision Light) ---

const statusMeta: { [key in TrabajoEstado]: { label: string; icon: any; color: string; border: string; glow: string; bg: string } } = {
    [TrabajoEstado.PENDIENTE]: { 
        label: 'PENDIENTE', icon: ClockIcon, 
        color: 'text-amber-600', border: 'border-amber-200', glow: 'shadow-amber-500/10', bg: 'bg-amber-50' 
    },
    [TrabajoEstado.EN_DISENO]: { 
        label: 'DISEÑO', icon: PaletteIcon, 
        color: 'text-indigo-600', border: 'border-indigo-200', glow: 'shadow-indigo-500/10', bg: 'bg-indigo-50' 
    },
    [TrabajoEstado.PROCESO]: { 
        label: 'PROCESO', icon: PrinterIcon, 
        color: 'text-sky-600', border: 'border-sky-200', glow: 'shadow-sky-500/10', bg: 'bg-sky-50' 
    },
    [TrabajoEstado.VITRINA]: { 
        label: 'VITRINA', icon: MonitorIcon, 
        color: 'text-brand-blue', border: 'border-brand-blue/20', glow: 'shadow-blue-glow-sm', bg: 'bg-brand-blue/5' 
    },
    [TrabajoEstado.ENTREGADO]: { 
        label: 'ENTREGADO', icon: CheckCircleIcon, 
        color: 'text-emerald-600', border: 'border-emerald-200', glow: 'shadow-emerald-500/10', bg: 'bg-emerald-50' 
    },
};

const getTipoStyle = (t: Trabajo) => {
    if (t.esSRI) return 'border-brand-blue/30 text-brand-blue bg-brand-blue/5 shadow-blue-glow-sm';
    return 'border-slate-200 text-slate-500 bg-slate-50';
};

const TrabajosPage: React.FC = () => {
    const { trabajos, clientes, loading } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState<'Todos' | 'SRI' | 'GENERAL'>('Todos');
    const [estadoFilter, setEstadoFilter] = useState<TrabajoEstado | 'Todos'>('Todos');

    const filteredTrabajos = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return trabajos.filter(t => {
            const cliente = clientes.find(c => c.id === t.clienteId);
            const searchMatch = lower === '' ||
                cliente?.nombre.toLowerCase().includes(lower) ||
                String(t.orden).includes(lower) ||
                t.tipo.toLowerCase().includes(lower) ||
                t.subtipo.toLowerCase().includes(lower);
            const tipoMatch = tipoFilter === 'Todos' || 
                (tipoFilter === 'SRI' ? t.esSRI : !t.esSRI);
            const estadoMatch = estadoFilter === 'Todos' || t.estado === estadoFilter;
            return searchMatch && tipoMatch && estadoMatch;
        });
    }, [trabajos, clientes, searchTerm, tipoFilter, estadoFilter]);

    return (
        <div className="min-h-screen bg-brand-light relative overflow-hidden">
            <SEO title="Stream de Manufactura - Imprenta Córdova" description="Seguimiento de misiones activas y flujo de producción industrial." />
            
            {/* Global Decorative Grid */}
            <div className="absolute inset-0 bg-architect-grid opacity-[0.03] pointer-events-none z-0" />
            
            <div className="max-w-[1600px] mx-auto space-y-16 pb-40 px-6 md:px-12 pt-12 relative z-10">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-slate-200 pb-16 relative">
                    <div className="space-y-6">
                        <div className="flex items-center gap-5">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-blue shadow-lg animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-brand-blue/40 shadow-lg animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 rounded-full bg-slate-200 shadow-lg animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                            <span className="text-[11px] font-black text-brand-blue uppercase tracking-[0.8em] opacity-80">STREAM_DE_MANUFACTURA • V5.2_PRECISION</span>
                        </div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -50 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            className="text-5xl sm:text-7xl md:text-8xl font-black text-slate-900 tracking-[-0.05em] uppercase leading-[0.85] drop-shadow-sm"
                        >
                            FLUJO DE <span className="text-brand-blue drop-shadow-blue-glow-sm">TRABAJOS</span>
                        </motion.h1>
                        <div className="flex items-center gap-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] flex items-center gap-5">
                                <span className="w-16 h-[1px] bg-brand-blue/30"></span> 
                                NÚCLEO DE INTEGRIDAD CORDOVA
                            </p>
                            <div className="flex items-center gap-3 px-5 py-2 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm">
                                <ActivityIcon className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none">TELEMETRÍA_ACTIVA</span>
                            </div>
                        </div>
                    </div>
                    
                    <motion.button 
                        whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(14, 165, 233, 0.2)' }} 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/nuevo')}
                        className="flex items-center justify-center w-full xl:w-auto gap-5 bg-brand-blue text-white px-12 py-6 rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-blue-glow transition-all duration-500"
                    >
                        <RocketLaunchIcon className="w-6 h-6" />
                        INITIALIZE_NEW_MISSION
                    </motion.button>
                </div>

                {/* --- QUICK STATS / TABS --- */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
                    <button 
                        onClick={() => setEstadoFilter('Todos')}
                        className={`p-6 rounded-[2.5rem] border transition-all duration-500 text-center flex flex-col items-center gap-3 shadow-sm ${estadoFilter === 'Todos' ? 'bg-brand-blue text-white border-brand-blue shadow-blue-glow' : 'bg-white text-slate-400 border-slate-100 hover:border-brand-blue/30 hover:bg-slate-50'}`}
                    >
                        <SparklesIcon className={`w-6 h-6 ${estadoFilter === 'Todos' ? 'text-white' : 'text-slate-400'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${estadoFilter === 'Todos' ? 'text-white' : 'text-slate-400'}`}>TODAS_LAS_FASES</span>
                    </button>
                    {Object.entries(statusMeta).map(([status, meta]) => (
                        <button 
                            key={status}
                            onClick={() => setEstadoFilter(status as TrabajoEstado)}
                            className={`p-6 rounded-[2.5rem] border transition-all duration-500 text-center flex flex-col items-center gap-3 shadow-sm ${estadoFilter === status ? `bg-white border-brand-blue shadow-blue-glow-sm` : 'bg-white text-slate-400 border-slate-100 hover:border-brand-blue/30 hover:bg-slate-50'}`}
                        >
                            <meta.icon className={`w-6 h-6 ${estadoFilter === status ? meta.color : 'text-slate-300'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{meta.label}</span>
                        </button>
                    ))}
                </div>

                {/* --- CONTROLS --- */}
                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    <div className="relative group flex-grow">
                        <div className="absolute inset-0 bg-brand-blue/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
                        <input 
                            type="text" placeholder="TRACK BY CLIENT, MISSION ID OR PROTOCOL SPEC..." value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full bg-white border border-slate-200 rounded-[2.5rem] pl-20 pr-10 py-7 text-slate-900 text-[11px] font-black uppercase tracking-[0.4em] outline-none focus:border-brand-blue/40 transition-all placeholder:text-slate-200 shadow-sm"
                        />
                        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-20 group-focus-within:opacity-100 transition-opacity">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                            <span className="text-[8px] font-mono text-brand-blue uppercase tracking-widest">REALTIME_FILTER_ACTIVE</span>
                        </div>
                    </div>
                    <div className="relative md:w-96">
                        <AdjustmentsHorizontalIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-brand-blue" />
                        <select 
                            value={tipoFilter} 
                            onChange={e => setTipoFilter(e.target.value as 'Todos' | 'SRI' | 'GENERAL')}
                            className="w-full bg-white border border-slate-200 rounded-[2.5rem] pl-20 pr-10 py-7 text-slate-900 text-[11px] font-black uppercase tracking-[0.4em] outline-none focus:border-brand-blue/40 cursor-pointer appearance-none shadow-sm"
                        >
                            <option value="Todos">LOGIC: COMPREHENSIVE</option>
                            <option value="SRI">LOGIC: S.R.I. PROTOCOL</option>
                            <option value="GENERAL">LOGIC: GENERAL CRAFT</option>
                        </select>
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronRightIcon className="w-5 h-5 text-slate-300 rotate-90" />
                        </div>
                    </div>
                </div>

                {/* --- MISSION STREAM TABLE --- */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[3rem] overflow-hidden relative z-10 border border-slate-100 shadow-xl"
                >
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] border-b border-slate-100">
                                    <th className="px-12 py-10">ID_Protocol</th>
                                    <th className="px-12 py-10">Tactical_Entity</th>
                                    <th className="px-12 py-10">Vector_Type</th>
                                    <th className="px-12 py-10">Mission_Status</th>
                                    <th className="px-12 py-10 text-right">Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-60 text-center"><Loader2Icon className="w-16 h-16 text-brand-blue animate-spin mx-auto" /></td></tr>
                                ) : filteredTrabajos.length === 0 ? (
                                    <tr><td colSpan={5} className="py-60 text-center opacity-40 uppercase text-xs font-black tracking-[1em] text-slate-300">Stream_Offline</td></tr>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {filteredTrabajos.map((trabajo, idx) => {
                                            const cliente = clientes.find(c => c.id === trabajo.clienteId);
                                            const meta = statusMeta[trabajo.estado];
                                            return (
                                                <motion.tr 
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    transition={{ delay: idx * 0.03, duration: 0.5 }}
                                                    key={trabajo.id} 
                                                    className="group hover:bg-brand-blue/[0.02] transition-all duration-500 cursor-pointer relative"
                                                    onClick={() => navigate(`/trabajos/${trabajo.id}`)}
                                                >
                                                    <td className="px-12 py-12 relative overflow-hidden">
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-transparent group-hover:bg-brand-blue transition-all duration-700 rounded-r-full shadow-blue-glow" />
                                                        <span className="text-4xl font-black text-slate-900 tracking-tighter group-hover:text-brand-blue transition-all duration-500 flex items-end gap-3 leading-none">
                                                            <span className="text-[10px] text-slate-300 not-italic tracking-widest mb-1">#</span>
                                                            {String(trabajo.orden).padStart(5, '0')}
                                                        </span>
                                                        <div className="flex items-center gap-3 mt-4">
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none bg-slate-50 px-2 py-1 rounded">GEN: {formatDate(trabajo.fechaEntrada).split(' ')[0]}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none bg-slate-50 px-2 py-1 rounded">AGENT: {trabajo.creadoPor.split(' ')[0]}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-12">
                                                        <div className="space-y-3">
                                                            <p className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate max-w-[300px] leading-none group-hover:text-brand-blue transition-colors">{cliente?.nombre || 'UNLINKED_ENTITY'}</p>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{cliente?.regimen || 'GENERAL'}</span>
                                                                <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">VERIFIED</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-12">
                                                        <div className="space-y-4">
                                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border block w-fit ${getTipoStyle(trabajo)}`}>
                                                                {trabajo.tipo}
                                                            </span>
                                                            <div className="flex items-center gap-3">
                                                                <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(trabajo.total)}</p>
                                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">USD</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-12">
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-14 h-14 rounded-2xl transition-all duration-700 border flex items-center justify-center group-hover:scale-110 ${meta.color} ${meta.border} ${meta.bg} shadow-sm relative overflow-hidden group-hover:shadow-blue-glow-sm`}>
                                                                <meta.icon className="w-7 h-7 relative z-10" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <span className={`text-[12px] font-black uppercase tracking-[0.4em] block leading-none ${meta.color}`}>{meta.label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-1 h-1 rounded-full animate-pulse ${meta.color.replace('text-', 'bg-')}`} />
                                                                    <span className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em]">PHASE_LOCKED</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-12 text-right">
                                                        <button className="w-14 h-14 bg-white hover:bg-brand-blue text-slate-300 hover:text-white rounded-2xl transition-all duration-500 border border-slate-100 group-hover:border-brand-blue shadow-sm flex items-center justify-center active:scale-90">
                                                            <ChevronRightIcon className="w-6 h-6" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* --- FOOTER TELEMETRÍA --- */}
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-10 p-12 bg-white rounded-[3rem] border border-slate-100 shadow-lg"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-brand-blue/5 rounded-2xl flex items-center justify-center text-brand-blue border border-brand-blue/10">
                            <TerminalIcon className="w-7 h-7" />
                        </div>
                        <div>
                             <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-1">ALPHA_LINK_ESTABLISHED</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sincronización de manufactura vía NÚCLEO DE INTEGRIDAD CORDOVA</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-12">
                        <div className="text-right space-y-1">
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest opacity-60">LATENCIA_STREAM</p>
                             <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">12ms_STABLE</p>
                        </div>
                        <div className="text-right space-y-1">
                             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest opacity-60">PROTOCOLO_SYNC</p>
                             <p className="text-[11px] font-black text-brand-blue uppercase tracking-widest">ELITE_PRECISION_V5</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TrabajosPage;