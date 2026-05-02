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
    ArrowPathIcon, AdjustmentsHorizontalIcon, CubeTransparentIcon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

// --- STYLES & ASSETS ---

const statusMeta: { [key in TrabajoEstado]: { label: string; icon: any; color: string; border: string; glow: string; bg: string } } = {
    [TrabajoEstado.PENDIENTE]: { 
        label: 'PENDIENTE', icon: ClockIcon, 
        color: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20', bg: 'bg-amber-500/5' 
    },
    [TrabajoEstado.EN_DISENO]: { 
        label: 'DISEÑO', icon: PaletteIcon, 
        color: 'text-indigo-400', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/20', bg: 'bg-indigo-500/5' 
    },
    [TrabajoEstado.PROCESO]: { 
        label: 'PROCESO', icon: PrinterIcon, 
        color: 'text-sky-400', border: 'border-sky-500/30', glow: 'shadow-sky-500/20', bg: 'bg-sky-500/5' 
    },
    [TrabajoEstado.VITRINA]: { 
        label: 'VITRINA', icon: MonitorIcon, 
        color: 'text-liquid-gold', border: 'border-liquid-gold/30', glow: 'shadow-gold-glow-sm', bg: 'bg-liquid-gold/5' 
    },
    [TrabajoEstado.ENTREGADO]: { 
        label: 'ENTREGADO', icon: CheckCircleIcon, 
        color: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20', bg: 'bg-emerald-500/5' 
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
        <div className="min-h-screen bg-[#020202] tactical-grid scanline-container">
            <div className="max-w-[1500px] mx-auto space-y-16 pb-40 px-6 md:px-12 pt-16 relative z-10">
                
                {/* --- HEADER CINEMÁTICO --- */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-white/5 pb-16 relative">
                    <div className="space-y-6">
                        <div className="flex items-center gap-5">
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-lg animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-liquid-gold shadow-lg animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-lg animate-pulse" style={{ animationDelay: '0.4s' }} />
                            </div>
                            <span className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.8em] italic opacity-80">STREAM_DE_MANUFACTURA • ALPHA_v9</span>
                        </div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -50 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-[-0.05em] uppercase italic leading-[0.85] drop-shadow-2xl"
                        >
                            FLUJO DE <span className="text-gold-gradient italic">TRABAJOS</span>
                        </motion.h1>
                        <div className="flex items-center gap-8">
                            <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em] flex items-center gap-5 italic">
                                <span className="w-16 h-[1px] bg-liquid-gold/30 shadow-gold-glow"></span> 
                                NÚCLEO DE INTEGRIDAD CORDOVA
                            </p>
                            <div className="flex items-center gap-3 px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                <ActivityIcon className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] leading-none">TELEMETRÍA_ACTIVA</span>
                            </div>
                        </div>
                    </div>
                    
                    <motion.button 
                        whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)' }} 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/nuevo')}
                        className="flex items-center justify-center w-full xl:w-auto gap-5 bg-liquid-gold text-black px-12 py-6 rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-gold-glow transition-all duration-500 italic"
                    >
                        <AddIcon className="w-6 h-6" />
                        Initialize_New_Mission
                    </motion.button>
                </div>

                {/* --- QUICK STATS / TABS TÁCTICOS --- */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
                    <button 
                        onClick={() => setEstadoFilter('Todos')}
                        className={`p-6 rounded-[2rem] border transition-all duration-500 text-center flex flex-col items-center gap-3 tactical-border ${estadoFilter === 'Todos' ? 'glass-panel-gold !border-liquid-gold/50 shadow-gold-glow' : 'glass-panel-obsidian opacity-40 hover:opacity-100 hover:border-white/10'}`}
                    >
                        <SparklesIcon className={`w-6 h-6 ${estadoFilter === 'Todos' ? 'text-black' : 'text-slate-500'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${estadoFilter === 'Todos' ? 'text-black' : 'text-slate-400'}`}>TODAS_LAS_FASES</span>
                    </button>
                    {Object.entries(statusMeta).map(([status, meta]) => (
                        <button 
                            key={status}
                            onClick={() => setEstadoFilter(status as TrabajoEstado)}
                            className={`p-6 rounded-[2rem] border transition-all duration-500 text-center flex flex-col items-center gap-3 tactical-border ${estadoFilter === status ? `glass-panel-obsidian !${meta.border} ${meta.glow} border-t-${meta.color.replace('text-', '')}` : 'glass-panel-obsidian opacity-40 hover:opacity-100 hover:border-white/10'}`}
                        >
                            <meta.icon className={`w-6 h-6 ${estadoFilter === status ? meta.color : 'text-slate-500'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{meta.label}</span>
                        </button>
                    ))}
                </div>

                {/* --- CONTROLS DE COMANDO --- */}
                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    <div className="relative group flex-grow">
                        <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 group-focus-within:text-liquid-gold transition-colors" />
                        <input 
                            type="text" placeholder="TRACK BY CLIENT, MISSION ID OR PROTOCOL SPEC..." value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full bg-[#050505] border-2 border-white/5 rounded-2xl md:rounded-[2.5rem] pl-20 pr-10 py-7 text-white text-[11px] font-black uppercase tracking-[0.4em] outline-none focus:border-liquid-gold/40 focus:bg-black transition-all placeholder:text-slate-800 shadow-2xl"
                        />
                        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-3 opacity-20 group-focus-within:opacity-100 transition-opacity">
                            <span className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse" />
                            <span className="text-[8px] font-mono text-liquid-gold uppercase tracking-widest">REALTIME_FILTER_ACTIVE</span>
                        </div>
                    </div>
                    <div className="relative md:w-96">
                        <AdjustmentsHorizontalIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 group-focus-within:text-liquid-gold" />
                        <select 
                            value={tipoFilter} 
                            onChange={e => setTipoFilter(e.target.value as 'Todos' | 'SRI' | 'GENERAL')}
                            className="w-full bg-[#050505] border-2 border-white/5 rounded-2xl md:rounded-[2.5rem] pl-20 pr-10 py-7 text-white text-[11px] font-black uppercase tracking-[0.4em] outline-none focus:border-liquid-gold/40 cursor-pointer appearance-none shadow-2xl"
                        >
                            <option value="Todos" className="bg-black">LOGIC: COMPREHENSIVE</option>
                            <option value="SRI" className="bg-black">LOGIC: S.R.I. PROTOCOL</option>
                            <option value="GENERAL" className="bg-black">LOGIC: GENERAL CRAFT</option>
                        </select>
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronRightIcon className="w-5 h-5 text-slate-700 rotate-90" />
                        </div>
                    </div>
                </div>

                {/* --- MISSION STREAM --- */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                    className="glass-panel-obsidian rounded-[3rem] overflow-hidden relative z-10 border-liquid-gold/5 shadow-2xl"
                >
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] border-b border-white/5 italic">
                                    <th className="px-12 py-10">ID_Protocol</th>
                                    <th className="px-12 py-10">Tactical_Entity</th>
                                    <th className="px-12 py-10">Vector_Type</th>
                                    <th className="px-12 py-10">Mission_Status</th>
                                    <th className="px-12 py-10 text-right">Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-60 text-center"><div className="w-16 h-16 border-4 border-liquid-gold/10 border-t-liquid-gold rounded-full animate-spin mx-auto shadow-gold-glow"></div></td></tr>
                                ) : filteredTrabajos.length === 0 ? (
                                    <tr><td colSpan={5} className="py-60 text-center opacity-20 grayscale uppercase text-xs font-black tracking-[1em] italic">Stream_Offline</td></tr>
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
                                                    className="group hover:bg-white/[0.03] transition-all duration-500 cursor-pointer relative"
                                                    onClick={() => navigate(`/trabajos/${trabajo.id}`)}
                                                >
                                                    <td className="px-12 py-12 relative overflow-hidden">
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-transparent group-hover:bg-liquid-gold transition-all duration-700 shadow-gold-glow" />
                                                        <span className="text-4xl font-black text-white italic tracking-tighter group-hover:text-gold-gradient transition-all duration-500 flex items-end gap-3 leading-none">
                                                            <span className="text-[10px] text-slate-700 not-italic tracking-widest mb-1">#</span>
                                                            {String(trabajo.orden).padStart(5, '0')}
                                                        </span>
                                                        <div className="flex items-center gap-3 mt-3">
                                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none">GEN: {formatDate(trabajo.fechaEntrada).split(' ')[0]}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-800" />
                                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none">AGENT: {trabajo.creadoPor.split(' ')[0]}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-12">
                                                        <div className="space-y-2">
                                                            <p className="text-xl font-black text-white uppercase italic tracking-tighter truncate max-w-[300px] leading-none">{cliente?.nombre || 'UNLINKED_ENTITY'}</p>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">{cliente?.regimen || 'GENERAL'}</span>
                                                                <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">VERIFIED_ID</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-12">
                                                        <div className="space-y-4">
                                                            <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] border shadow-sm block w-fit italic ${getTipoStyle(trabajo)}`}>
                                                                {trabajo.tipo}
                                                            </span>
                                                            <div className="flex items-center gap-4">
                                                                <p className="text-2xl font-black text-white italic tracking-tighter leading-none">{formatCurrency(trabajo.total)}</p>
                                                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">USD</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-12">
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-14 h-14 rounded-2xl transition-all duration-700 shadow-xl border flex items-center justify-center group-hover:scale-110 ${meta.color} ${meta.border} group-hover:shadow-gold-glow-sm bg-black/40 relative overflow-hidden`}>
                                                                <div className={`absolute inset-0 ${meta.bg} opacity-20`} />
                                                                <meta.icon className="w-7 h-7 relative z-10" />
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <span className={`text-[12px] font-black uppercase tracking-[0.4em] block italic leading-none ${meta.color}`}>{meta.label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-1 h-1 rounded-full animate-pulse ${meta.color.replace('text-', 'bg-')}`} />
                                                                    <span className="text-[7px] font-bold text-slate-600 uppercase tracking-[0.2em]">S_PHASE_LOCKED</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-12 py-12 text-right">
                                                        <button className="w-14 h-14 bg-white/5 hover:bg-liquid-gold text-slate-600 hover:text-black rounded-2xl transition-all duration-700 border border-white/5 group-hover:border-liquid-gold/30 shadow-2xl flex items-center justify-center group/btn active:scale-90">
                                                            <ChevronRightIcon className="w-6 h-6 transition-transform duration-500 group-hover/btn:translate-x-1" />
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
                    className="flex flex-col md:flex-row items-center justify-between gap-10 p-12 glass-panel-obsidian rounded-[3rem] border-dashed border-white/10 opacity-60"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-liquid-gold/10 rounded-[1.25rem] flex items-center justify-center text-liquid-gold border border-liquid-gold/20 shadow-gold-glow-sm">
                            <TerminalIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-white uppercase tracking-[0.4em] italic mb-1">Alpha_Link_Established</p>
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Sincronización de manufactura vía NÚCLEO DE INTEGRIDAD CORDOVA</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-10">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Latencia_Stream</p>
                            <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest italic">12ms_STABLE</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 italic">Protocolo_V</p>
                            <p className="text-[11px] font-black text-liquid-gold uppercase tracking-widest italic">ELITE_MOD_v9.4</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default TrabajosPage;