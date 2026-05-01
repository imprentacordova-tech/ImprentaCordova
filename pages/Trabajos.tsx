import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado, TrabajoTipo } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { 
    AddIcon, SearchIcon, FilterIcon, 
    SparklesIcon, ActivityIcon, CheckCircleIcon,
    ClockIcon, PaletteIcon, PrinterIcon, MonitorIcon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

// --- STYLES & ASSETS ---

const statusMeta: { [key in TrabajoEstado]: { label: string; icon: any; color: string; border: string; glow: string } } = {
    [TrabajoEstado.PENDIENTE]: { 
        label: 'PENDIENTE', icon: ClockIcon, 
        color: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' 
    },
    [TrabajoEstado.EN_DISENO]: { 
        label: 'DISEÑO', icon: PaletteIcon, 
        color: 'text-indigo-400', border: 'border-indigo-500/20', glow: 'shadow-indigo-500/10' 
    },
    [TrabajoEstado.PROCESO]: { 
        label: 'PROCESO', icon: PrinterIcon, 
        color: 'text-sky-400', border: 'border-sky-500/20', glow: 'shadow-sky-500/10' 
    },
    [TrabajoEstado.VITRINA]: { 
        label: 'VITRINA', icon: MonitorIcon, 
        color: 'text-liquid-gold', border: 'border-liquid-gold/20', glow: 'shadow-gold-glow-sm' 
    },
    [TrabajoEstado.ENTREGADO]: { 
        label: 'ENTREGADO', icon: CheckCircleIcon, 
        color: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' 
    },
};

const getTipoStyle = (t: Trabajo) => {
    if (t.esSRI) return 'border-blue-500/20 text-blue-400 bg-blue-500/10';
    return 'border-white/10 text-white/40 bg-white/5';
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
        <div className="max-w-7xl mx-auto space-y-10 sm:space-y-16 pb-40 px-4 sm:px-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none"></div>

            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 relative z-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)] animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-printing-blue italic">Telemetría de Producción</span>
                    </div>
                    <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="text-5xl sm:text-7xl font-black text-white tracking-[-0.04em] uppercase italic leading-none">
                        FLUJO DE <span className="text-gold-gradient drop-shadow-gold">TRABAJOS</span>
                    </motion.h1>
                    <div className="flex items-center gap-6">
                        <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em] flex items-center gap-4">
                            <span className="w-12 h-[1px] bg-liquid-gold/30"></span> IMPRENTA CÓRDOVA ALPHA
                        </p>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <ActivityIcon className="w-3 h-3 text-emerald-400 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">Live Stream</span>
                        </div>
                    </div>
                </div>
                <Link 
                    to="/nuevo" 
                    className="btn-luxury px-8 py-4 sm:px-12 sm:py-6 text-xs sm:text-sm flex items-center justify-center w-full xl:w-auto gap-4 group"
                >
                    <AddIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-500" />
                    <span>Initialize Mission</span>
                </Link>
            </div>

            {/* --- QUICK STATS / TABS --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 relative z-10">
                <button 
                    onClick={() => setEstadoFilter('Todos')}
                    className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all text-center flex flex-col items-center gap-2 ${estadoFilter === 'Todos' ? 'glass-card-luxury border-liquid-gold/30 shadow-gold-glow-sm' : 'bg-white/5 border-white/5 opacity-50 hover:opacity-100'}`}
                >
                    <SparklesIcon className={`w-5 h-5 ${estadoFilter === 'Todos' ? 'text-liquid-gold' : 'text-slate-500'}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">TODOS</span>
                </button>
                {Object.entries(statusMeta).map(([status, meta]) => (
                    <button 
                        key={status}
                        onClick={() => setEstadoFilter(status as TrabajoEstado)}
                        className={`p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border transition-all text-center flex flex-col items-center gap-2 ${estadoFilter === status ? `glass-card-luxury ${meta.border} ${meta.glow}` : 'bg-white/5 border-white/5 opacity-50 hover:opacity-100'}`}
                    >
                        <meta.icon className={`w-5 h-5 ${estadoFilter === status ? meta.color : 'text-slate-500'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{meta.label}</span>
                    </button>
                ))}
            </div>

            {/* --- CONTROLS --- */}
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="relative group flex-grow">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                    <input 
                        type="text" placeholder="TRACK BY CLIENT, MISSION ID OR DETAIL..." value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="input-atelier w-full pl-16 text-[10px] font-black uppercase tracking-widest"
                    />
                </div>
                <select 
                    value={tipoFilter} 
                    onChange={e => setTipoFilter(e.target.value as 'Todos' | 'SRI' | 'GENERAL')}
                    className="input-atelier md:w-64 appearance-none text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer"
                >
                    <option value="Todos" className="bg-brand-dark">Logic: Comprehensive</option>
                    <option value="SRI" className="bg-brand-dark">Logic: S.R.I. Protocol</option>
                    <option value="GENERAL" className="bg-brand-dark">Logic: General Craft</option>
                </select>
            </div>

            {/* --- MISSION LIST --- */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card-luxury overflow-hidden relative z-10"
            >
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.03] text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-white/5">
                                <th className="px-10 py-6">Mission ID</th>
                                <th className="px-10 py-6">Agent / Client</th>
                                <th className="px-10 py-6">Protocol</th>
                                <th className="px-10 py-6">Current Phase</th>
                                <th className="px-10 py-6">Budget</th>
                                <th className="px-10 py-6">Initiation</th>
                                <th className="px-10 py-6 text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={7} className="py-40 text-center"><div className="w-12 h-12 border-4 border-liquid-gold/20 border-t-liquid-gold rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : filteredTrabajos.length === 0 ? (
                                <tr><td colSpan={7} className="py-40 text-center opacity-20 grayscale uppercase text-[10px] font-black tracking-widest italic">Stream Offline</td></tr>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredTrabajos.map((trabajo, idx) => {
                                        const cliente = clientes.find(c => c.id === trabajo.clienteId);
                                        const meta = statusMeta[trabajo.estado];
                                        return (
                                            <motion.tr 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.02 }}
                                                key={trabajo.id} 
                                                className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                onClick={() => navigate(`/trabajos/${trabajo.id}`)}
                                            >
                                                <td className="px-10 py-8">
                                                    <span className="text-2xl font-black text-white italic tracking-tighter group-hover:text-liquid-gold transition-colors block">
                                                        #{String(trabajo.orden).padStart(5, '0')}
                                                    </span>
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Ref Alpha-9</span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <p className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[180px]">{cliente?.nombre || 'UNLINKED'}</p>
                                                    <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-widest">{cliente?.regimen || 'GENERAL'}</p>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getTipoStyle(trabajo)}`}>
                                                        {trabajo.tipo}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-xl transition-all ${meta.color} ${meta.border} group-hover:shadow-gold-glow-sm`}>
                                                            <meta.icon className="w-4 h-4" />
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${meta.color}`}>{meta.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <p className="text-xl font-black text-white italic tracking-tighter">{formatCurrency(trabajo.total)}</p>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatDate(trabajo.fechaEntrada)}</p>
                                                    <p className="text-[9px] font-black text-slate-600 mt-1 uppercase tracking-widest">by {trabajo.creadoPor}</p>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button className="p-3 bg-white/5 hover:bg-liquid-gold text-slate-400 hover:text-black rounded-xl transition-all duration-500 border border-white/10 group-hover:border-liquid-gold/30 shadow-luxury">
                                                        <ActivityIcon className="w-5 h-5" />
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

            {/* --- FOOTER INSIGHT --- */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-6 p-10 bg-white/[0.01] rounded-3xl border border-dashed border-white/5 opacity-30"
            >
                <SparklesIcon className="w-5 h-5 text-liquid-gold" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">Sincronización de datos vía NÚCLEO DE INTEGRIDAD IMPRENTA CÓRDOVA</p>
            </motion.div>
        </div>
    );
};

export default TrabajosPage;