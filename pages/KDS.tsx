import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo, TrabajoEstado, User } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { 
    CloseIcon, ClockIcon, PhotoIcon, SearchIcon, LayersIcon, 
    CheckCircleIcon, SparklesIcon, ActivityIcon, CpuIcon,
    ShieldCheckIcon, ZapIcon, ScanIcon, CameraIcon, InfoIcon,
    ArrowRightIcon, BoltIcon, GlobeAltIcon, HistoryIcon, BoxIcon
} from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';

// --- UTILS & HELPERS ---
type UrgencyLevel = 'critical' | 'warning' | 'safe';

const getUrgencyLevel = (dateStr?: string): UrgencyLevel => {
    if (!dateStr) return 'safe';
    const now = new Date().getTime();
    const target = new Date(dateStr).getTime();
    const diffDays = (target - now) / (1000 * 3600 * 24);

    if (diffDays < 1) return 'critical'; 
    if (diffDays < 3) return 'warning';
    return 'safe';
};

const urgencyConfig = {
    critical: { border: 'border-l-rose-600', bg: 'bg-rose-600/10', text: 'text-rose-500', label: 'CRITICAL PULSE', glow: 'shadow-glow-rose' },
    warning: { border: 'border-l-liquid-gold', bg: 'bg-liquid-gold/10', text: 'text-liquid-gold', label: 'PRIORITY FLOW', glow: 'shadow-gold-glow-sm' },
    safe: { border: 'border-l-slate-800', bg: 'bg-white/5', text: 'text-slate-600', label: 'NOMINAL SYNC', glow: '' },
};

// --- COMPONENTS ---

interface KanbanCardProps {
  trabajo: Trabajo;
  cliente?: Cliente;
  onCardDoubleClick: (trabajo: Trabajo) => void;
  onTakePhotoClick: (trabajo: Trabajo) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ trabajo, cliente, onCardDoubleClick, onTakePhotoClick }) => {
    const targetDate = trabajo.fechaEntrega || trabajo.fechaVencimiento;
    const urgency = getUrgencyLevel(targetDate);
    const style = urgencyConfig[urgency];
    
    const getProgress = () => {
        if(!targetDate) return 0;
        const start = new Date(trabajo.fechaEntrada).getTime();
        const end = new Date(targetDate).getTime();
        const now = new Date().getTime();
        const total = end - start;
        const elapsed = now - start;
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -5, transition: { duration: 0.4 } }}
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("trabajoId", trabajo.id);
                e.currentTarget.classList.add('opacity-30');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('opacity-30');
            }}
            onDoubleClick={() => onCardDoubleClick(trabajo)}
            className={`
                relative group bg-[#080808]/60 backdrop-blur-3xl mb-5 cursor-grab active:cursor-grabbing 
                border-l-4 ${style.border} border-t border-r border-b border-white/5
                transition-all duration-700 ease-out
                overflow-hidden p-7 rounded-[2.5rem] shadow-2xl
            `}
        >
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ${
                urgency === 'critical' ? 'bg-rose-600/10' : 'bg-liquid-gold/10'
            }`}></div>
            
            <div className="flex justify-between items-center mb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full animate-pulse transition-all duration-500 ${
                        urgency === 'critical' ? 'bg-rose-500 shadow-glow-rose' : 'bg-liquid-gold shadow-gold-glow'
                    }`}></div>
                    <span className="text-[9px] font-black text-slate-500 tracking-[0.5em] uppercase italic">
                        ORD-{String(trabajo.orden).padStart(5, '0')}
                    </span>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.3em] italic ${style.bg} ${style.text} border border-white/5 ${style.glow}`}>
                    {style.label}
                </div>
            </div>

            <div className="flex gap-6 relative z-10">
                <div className="flex-grow min-w-0 space-y-4">
                    <div>
                        <h4 className="text-xl font-black text-white italic tracking-tighter leading-none mb-2 group-hover:text-liquid-gold transition-colors duration-700 truncate">
                            {cliente?.nombre || 'UNIDENTIFIED ENTITY'}
                        </h4>
                        <div className="flex items-center gap-2">
                             <div className="w-4 h-[1px] bg-white/10 group-hover:w-8 group-hover:bg-liquid-gold transition-all duration-700"></div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] opacity-80 line-clamp-1 italic">{trabajo.subtipo}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 text-[10px] font-black text-white bg-white/[0.03] px-5 py-2.5 rounded-2xl border border-white/10 uppercase tracking-widest italic group-hover:border-white/20 transition-all">
                            <LayersIcon className="w-4 h-4 text-liquid-gold" />
                            <span>{trabajo.cantidad} units</span>
                        </div>
                        {targetDate && (
                            <div className={`flex items-center gap-2 text-[10px] font-black ${style.text} uppercase tracking-widest italic`}>
                                <ClockIcon className="w-4 h-4" />
                                <span>{formatDate(targetDate)}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex-shrink-0 relative group/photo">
                    {trabajo.fotoOriginalUrl ? (
                        <div className="w-18 h-18 rounded-[1.8rem] overflow-hidden border border-white/10 relative group/img shadow-2xl bg-black transition-all duration-1000 group-hover:border-liquid-gold/40">
                            <img 
                                src={trabajo.fotoOriginalUrl} 
                                alt="Reference" 
                                className="w-full h-full object-cover transition-transform duration-[2s] group-hover/img:scale-125 grayscale group-hover/img:grayscale-0 opacity-40 group-hover/img:opacity-100" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover/img:opacity-0 transition-opacity"></div>
                        </div>
                    ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onTakePhotoClick(trabajo); }}
                            className="w-18 h-18 rounded-[1.8rem] border-2 border-dashed border-white/5 flex items-center justify-center hover:border-liquid-gold/30 hover:bg-liquid-gold/5 transition-all text-slate-800 hover:text-liquid-gold group/cam"
                        >
                            <CameraIcon className="w-8 h-8 group-hover/cam:scale-110 transition-transform" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-3">
                    <HistoryIcon className="w-4 h-4 text-slate-800 group-hover:text-liquid-gold transition-colors" />
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic transition-colors">Audit trail active</span>
                </div>
                {trabajo.saldo > 0 ? (
                    <div className="flex items-center gap-3 bg-rose-500/5 text-rose-500 text-[8px] font-black px-4 py-2 rounded-full border border-rose-500/10 uppercase tracking-widest italic">
                       <BoltIcon className="w-3 h-3 animate-pulse" /> Asset pending
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-4 py-2 rounded-full border border-emerald-500/20 uppercase tracking-widest italic">
                        <CheckBadgeIcon className="w-3 h-3" /> Fully Vested
                    </div>
                )}
            </div>

            {targetDate && (
                <div className="absolute bottom-0 left-0 h-1.5 bg-white/[0.02] w-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgress()}%` }}
                        transition={{ duration: 2, ease: "circOut" }}
                        className={`h-full shadow-2xl ${
                            urgency === 'critical' ? 'bg-gradient-to-r from-rose-700 to-rose-400 shadow-glow-rose' : 
                            urgency === 'warning' ? 'bg-gradient-to-r from-liquid-gold to-white shadow-gold-glow' : 'bg-slate-800'
                        }`} 
                    />
                </div>
            )}
        </motion.div>
    );
};

// --- MAIN PAGE ---

const KDSPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, updateTrabajoStatus, updateTrabajoPhoto } = useData();
    
    const [filterTerm, setFilterTerm] = useState('');
    const [activeTag, setActiveTag] = useState('Global Stream');
    const [draggedOverColumn, setDraggedOverColumn] = useState<TrabajoEstado | null>(null);
    
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [cameraTarget, setCameraTarget] = useState<Trabajo | null>(null);

    const filteredTrabajos = useMemo(() => {
        let filtered = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO); 
        
        if (filterTerm) {
            const lower = filterTerm.toLowerCase();
            filtered = filtered.filter(t => 
                t.subtipo.toLowerCase().includes(lower) || 
                String(t.orden).includes(lower) || 
                clientes.find(c => c.id === t.clienteId)?.nombre.toLowerCase().includes(lower)
            );
        }

        switch (activeTag) {
            case 'Urgent Pulses':
                filtered = filtered.filter(t => getUrgencyLevel(t.fechaEntrega || t.fechaVencimiento) !== 'safe');
                break;
            case 'Design Phase':
                filtered = filtered.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado));
                break;
            case 'Production Sync':
                filtered = filtered.filter(t => [TrabajoEstado.PROCESO, TrabajoEstado.VITRINA].includes(t.estado));
                break;
        }

        return filtered;
    }, [trabajos, filterTerm, activeTag, clientes]);

    const columns = useMemo(() => {
        const cols: Record<string, Trabajo[]> = {};
        KANBAN_COLUMNS.forEach(col => {
            if (col !== TrabajoEstado.ENTREGADO) { 
                cols[col] = filteredTrabajos.filter(t => t.estado === col);
            }
        });
        return cols;
    }, [filteredTrabajos]);

    const handleDrop = async (e: React.DragEvent, newStatus: TrabajoEstado) => {
        e.preventDefault();
        setDraggedOverColumn(null);
        const id = e.dataTransfer.getData("trabajoId");
        if (!id) return;
        
        await updateTrabajoStatus(id, newStatus, currentUser.nombre);
        logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CAMBIO_ESTADO', `Orden ${id} movida a estado: ${newStatus}`, 'KDS');
    };

    const handlePhotoSave = async (data: string) => {
        if (!cameraTarget) return;
        await updateTrabajoPhoto(cameraTarget.id, data);
        logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'FOTO_CAPTURADA', `Referencia capturada para Orden ${cameraTarget.orden}`, 'KDS');
        setCameraTarget(null);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#050505] relative select-none">
            <div className="absolute inset-0 bg-noise opacity-[0.05] pointer-events-none z-[100]"></div>
            
            {/* Cinematic HUD Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-liquid-gold/[0.02] blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-0 left-[10%] w-[40%] h-[40%] bg-brand-red/[0.01] blur-[150px]"></div>
            </div>

            {/* --- HEADER --- */}
            <div className="flex-shrink-0 p-8 lg:p-12 relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold shadow-gold-glow animate-ping"></div>
                            <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.8em] italic">Neural Production Bridge v.26</span>
                        </div>
                        <h1 className="text-6xl lg:text-8xl font-black text-white tracking-tighter uppercase italic leading-none group">
                            Engine <span className="text-gold-gradient group-hover:text-white transition-all duration-1000">Stream</span>
                        </h1>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 w-full xl:w-auto items-center">
                        <div className="relative group w-full md:w-[400px]">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-slate-800 group-focus-within:text-liquid-gold transition-all duration-500" />
                            </div>
                            <input 
                                type="text" 
                                value={filterTerm}
                                onChange={e => setFilterTerm(e.target.value)}
                                placeholder="IDENTIFY SIGNATURE..." 
                                className="w-full bg-white/[0.02] border border-white/10 rounded-[1.8rem] py-8 pl-16 pr-6 text-[11px] font-black uppercase tracking-[0.5em] text-white placeholder:text-slate-900 focus:border-liquid-gold/40 focus:bg-white/[0.05] outline-none transition-all shadow-inner italic"
                            />
                        </div>

                        <div className="flex gap-2 bg-black/80 p-2 rounded-[2rem] border border-white/10 shadow-luxury overflow-x-auto no-scrollbar max-w-full">
                            {['Global Stream', 'Urgent Pulses', 'Design Phase', 'Production Sync'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setActiveTag(tag)}
                                    className={`
                                        px-6 py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-1000 whitespace-nowrap italic
                                        ${activeTag === tag 
                                            ? 'bg-white text-black shadow-gold-glow-strong scale-105' 
                                            : 'text-slate-700 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- KANBAN BOARD --- */}
            <div className="flex-grow overflow-x-auto overflow-y-hidden p-8 lg:p-12 custom-scrollbar-h relative z-10">
                <div className="flex h-full gap-8 min-w-[1500px]">
                    <AnimatePresence mode="popLayout">
                        {Object.keys(columns).map((status, index) => {
                            const colStatus = status as TrabajoEstado;
                            const isDragOver = draggedOverColumn === colStatus;
                            
                            return (
                                <motion.div 
                                    key={status}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.12, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                    className={`
                                        flex-1 min-w-[360px] flex flex-col bg-black/40 backdrop-blur-3xl transition-all duration-1000 border border-white/5 rounded-[3.5rem] overflow-hidden
                                        ${isDragOver ? 'bg-liquid-gold/[0.03] border-liquid-gold/40 scale-[1.01] shadow-gold-glow-strong' : ''}
                                    `}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={() => setDraggedOverColumn(colStatus)}
                                    onDrop={(e) => handleDrop(e, colStatus)}
                                >
                                    {/* Column Header */}
                                    <div className="p-10 flex justify-between items-center border-b border-white/5 bg-white/[0.01] relative group/col">
                                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/10 to-transparent group-hover/col:via-liquid-gold/40 transition-all duration-1000"></div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2.5 h-2.5 rounded-full shadow-2xl transition-all duration-1000 ${
                                                    status === 'Pendiente' ? 'bg-slate-700' :
                                                    status === 'En Diseño' ? 'bg-indigo-500' :
                                                    status === 'En Proceso' ? 'bg-liquid-gold animate-pulse' : 'bg-white'
                                                }`} />
                                                <h3 className="font-black text-white uppercase tracking-[0.6em] text-[12px] italic">
                                                    {status}
                                                </h3>
                                            </div>
                                            <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] ml-6 italic">Flux Unit {index + 1}</p>
                                        </div>
                                        <div className="bg-black/60 px-5 py-3 rounded-2xl text-[11px] font-black text-liquid-gold border border-white/10 shadow-inner italic group-hover:scale-110 transition-transform">
                                            {columns[status].length}
                                        </div>
                                    </div>

                                    {/* Cards Scrollbox */}
                                    <div className="flex-grow overflow-y-auto p-7 space-y-2 custom-scrollbar mask-fade-b">
                                        <AnimatePresence>
                                            {columns[status].map(trabajo => (
                                                <KanbanCard 
                                                    key={trabajo.id} 
                                                    trabajo={trabajo} 
                                                    cliente={clientes.find(c => c.id === trabajo.clienteId)}
                                                    onCardDoubleClick={setSelectedTrabajo}
                                                    onTakePhotoClick={setCameraTarget}
                                                />
                                            ))}
                                        </AnimatePresence>
                                        
                                        {columns[status].length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale py-40 gap-8">
                                                <div className="relative">
                                                    <BoxIcon className="w-24 h-24 text-white" />
                                                    <div className="absolute inset-0 bg-white blur-3xl opacity-20"></div>
                                                </div>
                                                <p className="text-[10px] font-black tracking-[1em] uppercase italic text-center">Unit Idle • Awaiting Stream</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Column Footer Detail */}
                                    <div className="p-6 bg-white/[0.01] border-t border-white/5 flex justify-center">
                                        <div className="w-12 h-1 bg-white/5 rounded-full"></div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {selectedTrabajo && (
                    <div className="fixed inset-0 z-[500] flex justify-center items-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-black/95 backdrop-blur-3xl" 
                            onClick={() => setSelectedTrabajo(null)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-[#0a0a0a] w-full max-w-2xl overflow-hidden relative z-10 border border-white/10 shadow-gold-glow-strong rounded-[4rem]" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <CpuIcon className="w-5 h-5 text-liquid-gold animate-pulse" />
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Phase <span className="text-liquid-gold">Dossier</span></h2>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em] italic">Accessing Artifact Signature • ORD-{selectedTrabajo.orden}</p>
                                </div>
                                <button onClick={() => setSelectedTrabajo(null)} className="p-4 bg-white/5 hover:bg-rose-600 text-slate-500 hover:text-white rounded-2xl transition-all duration-700 shadow-luxury"><CloseIcon className="w-6 h-6"/></button>
                            </div>
                            
                            <div className="p-12 space-y-12">
                                <div className="flex items-center gap-8">
                                    <div className="w-20 h-20 rounded-[2.2rem] bg-white text-black flex items-center justify-center font-black text-3xl shadow-luxury italic">
                                        {clientes.find(c => c.id === selectedTrabajo.clienteId)?.nombre.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-white text-3xl uppercase tracking-tighter italic">{clientes.find(c => c.id === selectedTrabajo.clienteId)?.nombre}</h3>
                                        <div className="flex items-center gap-4">
                                            <span className="text-liquid-gold/60 text-[10px] font-black tracking-[0.5em] uppercase italic">Trusted Participant</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 p-10 rounded-[3rem] bg-white/[0.02] border border-white/10 relative overflow-hidden group/m">
                                    <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent"></div>
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] text-slate-700 uppercase font-black tracking-[0.4em] mb-2 italic">Specifications</p>
                                            <p className="font-black text-white text-xl uppercase tracking-tighter italic">{selectedTrabajo.subtipo}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-700 uppercase font-black tracking-[0.4em] mb-2 italic">Volume</p>
                                            <p className="font-black text-white text-xl tracking-tighter italic">{selectedTrabajo.cantidad} units</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6 text-right">
                                        <div>
                                            <p className="text-[10px] text-slate-700 uppercase font-black tracking-[0.4em] mb-2 italic">Asset Value</p>
                                            <p className="font-black text-liquid-gold text-4xl tracking-tighter italic drop-shadow-gold">{formatCurrency(selectedTrabajo.total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-700 uppercase font-black tracking-[0.4em] mb-2 italic">Status</p>
                                            <p className={`font-black text-[13px] tracking-[0.3em] uppercase italic ${selectedTrabajo.saldo > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                                                {selectedTrabajo.saldo > 0 ? `DEBT: ${formatCurrency(selectedTrabajo.saldo)}` : 'SETTLED'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-[0.8em] flex items-center gap-4 ml-2 italic">
                                        <InfoIcon className="w-5 h-5 text-liquid-gold"/> Technical Dossier
                                    </label>
                                    <div className="relative">
                                        <textarea 
                                            readOnly
                                            className="w-full min-h-[140px] bg-black/60 border-2 border-white/5 rounded-[2.5rem] p-10 text-[14px] font-bold text-slate-400 leading-relaxed outline-none custom-scrollbar italic" 
                                            value={selectedTrabajo.observaciones || "No technical specifications provided for this artifact."}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-white/[0.03] flex justify-center border-t border-white/5">
                                <button onClick={() => setSelectedTrabajo(null)} className="w-full bg-white text-black py-8 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.6em] shadow-luxury transition-all hover:bg-liquid-gold active:scale-95 italic">DISENGAGE DOSSIER</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Camera Overlay */}
            {cameraTarget && (
                <div className="fixed inset-0 bg-black/98 z-[1000] flex flex-col justify-center items-center p-8 backdrop-blur-3xl">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-4xl aspect-[16/10] rounded-[4rem] overflow-hidden border border-white/10 shadow-gold-glow-strong bg-black"
                    >
                         <div className="flex flex-col items-center justify-center h-full gap-8">
                             <div className="w-32 h-32 rounded-full border-4 border-liquid-gold border-t-transparent animate-spin"></div>
                             <p className="text-[12px] font-black text-liquid-gold uppercase tracking-[1em] italic">Initializing Optic Link...</p>
                             <button onClick={() => setCameraTarget(null)} className="mt-12 text-slate-500 uppercase font-black text-[10px] tracking-widest hover:text-white transition-colors italic">[ ABORT CAPTURE ]</button>
                         </div>
                         {/* This would be the real CameraModal logic but we simplify for the demonstration if hardware isn't available */}
                    </motion.div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.2); }
                .mask-fade-b { mask-image: linear-gradient(to bottom, black 85%, transparent 100%); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .shadow-glow-rose { box-shadow: 0 0 25px rgba(225,29,72,0.3); }
            `}</style>
        </div>
    );
};

export default KDSPage;
