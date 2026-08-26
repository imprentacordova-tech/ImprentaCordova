import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Cliente, Trabajo, TrabajoEstado, User, Regimen } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { 
    CloseIcon, ClockIcon, SearchIcon, LayersIcon, 
    CheckBadgeIcon, ActivityIcon, CpuIcon,
    BoltIcon, HistoryIcon, BoxIcon, CameraIcon, InfoIcon, ArrowRightIcon,
    ShieldCheckIcon, PrinterIcon, HomeIcon
} from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '../components/BottomSheet';
import { SEO } from '../components/SEO';

const PrecisionClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="flex flex-col items-end">
            <span className="text-[10px] text-brand-blue/60 tracking-[0.3em] font-black uppercase">SYSTEM_TIME</span>
            <span className="text-sm text-white font-black tracking-tighter">
                {time.toLocaleTimeString('es-EC', { hour12: false })}
            </span>
        </div>
    );
};

// --- UTILIDADES ---
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
    critical: { 
        border: 'border-l-rose-500', 
        bg: 'bg-rose-500/10', 
        text: 'text-rose-500', 
        label: 'CRITICAL_URGENCY', 
        glow: 'shadow-[0_0_25px_rgba(244,63,94,0.15)]',
        animate: 'animate-pulse'
    },
    warning: { 
        border: 'border-l-amber-500', 
        bg: 'bg-amber-500/10', 
        text: 'text-amber-500', 
        label: 'HIGH_PRIORITY', 
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]',
        animate: ''
    },
    safe: { 
        border: 'border-l-slate-200', 
        bg: 'bg-white/[0.04]', 
        text: 'text-slate-400', 
        label: 'STATUS_STABLE', 
        glow: '',
        animate: ''
    },
};

// --- COMPONENTES ---

interface KanbanCardProps {
  trabajo: Trabajo;
  cliente?: Cliente;
  onCardClick: (trabajo: Trabajo) => void;
  onTakePhotoClick: (trabajo: Trabajo) => void;
  onStatusChange: (id: string, newStatus: TrabajoEstado) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ trabajo, cliente, onCardClick, onTakePhotoClick, onStatusChange }) => {
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

    const getTimeInStage = () => {
        const updatedAt = trabajo.updated_at || trabajo.fechaEntrada;
        const diff = new Date().getTime() - new Date(updatedAt).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const statusFlow = [
        TrabajoEstado.PENDIENTE,
        TrabajoEstado.EN_DISENO,
        TrabajoEstado.PROCESO,
        TrabajoEstado.VITRINA,
        TrabajoEstado.ENTREGADO
    ];

    const nextStatus = statusFlow[statusFlow.indexOf(trabajo.estado) + 1];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4 }}
            draggable
            onDragStart={(e: any) => {
                if (e.dataTransfer) e.dataTransfer.setData("trabajoId", trabajo.id);
                if (e.currentTarget && e.currentTarget.classList) e.currentTarget.classList.add('opacity-40');
            }}
            onDragEnd={(e: any) => {
                if (e.currentTarget && e.currentTarget.classList) e.currentTarget.classList.remove('opacity-40');
            }}
            onClick={() => onCardClick(trabajo)}
            className={`
                relative group kds-card mb-5 cursor-pointer
                border-l-4 ${style.border} border-t border-r border-b border-white/[0.06]
                transition-all duration-500 rounded-[2.5rem] overflow-hidden p-8
                ${style.glow} ${style.animate}
                bg-obsidian-card/60 backdrop-blur-xl hover:shadow-xl hover:border-brand-blue/20
            `}
        >
            {/* Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Header info */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${
                            trabajo.estado === TrabajoEstado.PENDIENTE ? 'bg-slate-400' :
                            trabajo.estado === TrabajoEstado.EN_DISENO ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]' :
                            trabajo.estado === TrabajoEstado.PROCESO ? 'bg-brand-blue shadow-[0_0_10px_rgba(14,165,233,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                        }`} />
                        <span className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">
                            ORD-{String(trabajo.orden).padStart(5, '0')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                        <ActivityIcon className="w-3 h-3 text-brand-blue/40" />
                        {getTimeInStage()}
                    </div>
                    <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] italic ${style.bg} ${style.text} border border-white/[0.06] backdrop-blur-md transition-all group-hover:scale-105`}>
                        {style.label}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex gap-8 relative z-10">
                <div className="flex-grow min-w-0 space-y-5">
                    <div>
                        <h4 className="text-2xl font-black text-white italic tracking-tighter leading-none mb-2 group-hover:text-brand-blue transition-all duration-500 truncate uppercase">
                            {cliente?.nombre || 'Consumidor Final'}
                        </h4>
                        <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] italic truncate max-w-[250px]">{trabajo.tipo} — {(trabajo.subtipo || '').split('|')[0]}</p>
                             {trabajo.esSRI && (
                                 <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] bg-brand-blue/10 text-brand-blue border border-brand-blue/20">SRI_VERIFIED</span>
                             )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-3 text-[11px] font-black text-white bg-white/[0.04] px-4 py-2 rounded-2xl border border-white/[0.06] uppercase tracking-widest italic transition-colors group-hover:border-brand-blue/30">
                            <LayersIcon className="w-4 h-4 text-brand-blue/60" />
                            <span>{trabajo.cantidad} <span className="text-slate-400">UNID</span></span>
                        </div>
                        {trabajo.tamano && (
                            <div className="text-[10px] font-black text-slate-400 bg-white/[0.04] px-3 py-2 rounded-xl border border-white/[0.06] uppercase tracking-widest italic">
                                {trabajo.tamano}
                            </div>
                        )}
                        {targetDate && (
                            <div className={`flex items-center gap-3 text-[11px] font-black ${style.text} uppercase tracking-widest italic`}>
                                <ClockIcon className="w-4 h-4 opacity-50" />
                                <span>{formatDate(targetDate)}</span>
                            </div>
                        )}
                    </div>

                    {/* Industrial Progress Bar */}
                    <div className="pt-2 space-y-2">
                        <div className="flex justify-between items-center text-[8px] font-black tracking-[0.3em] text-slate-400 uppercase italic">
                            <span>TIMELINE_DEPLOYMENT</span>
                            <span className="text-brand-blue">{Math.round(getProgress())}%</span>
                        </div>
                        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06] relative">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${getProgress()}%` }}
                                transition={{ duration: 1, ease: "circOut" }}
                                className="h-full bg-brand-blue relative"
                            >
                                <motion.div 
                                    animate={{ opacity: [0, 1, 0], x: ['0%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-white/40"
                                />
                            </motion.div>
                        </div>
                    </div>
                </div>
                
                <div className="flex-shrink-0">
                    {trabajo.fotoOriginalUrl ? (
                        <div className="w-24 h-24 rounded-[2rem] overflow-hidden border border-white/[0.06] relative group/img bg-white/[0.04] transition-all group-hover:border-brand-blue/40 shadow-lg">
                            <img 
                                src={trabajo.fotoOriginalUrl} 
                                alt="Referencia" 
                                className="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" 
                            />
                            <motion.div 
                                animate={{ y: ['-100%', '200%'] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-brand-blue/10 to-transparent pointer-events-none"
                            />
                        </div>
                    ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onTakePhotoClick(trabajo); }}
                            className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-white/[0.06] flex items-center justify-center hover:border-brand-blue/40 hover:bg-brand-blue/5 transition-all text-slate-400 hover:text-brand-blue group/cam relative overflow-hidden"
                        >
                            <CameraIcon className="w-8 h-8 group-hover/cam:scale-110 transition-transform relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover/cam:opacity-100 transition-opacity" />
                        </button>
                    )}
                </div>
            </div>

            {/* Footer info & Quick Action */}
            <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/[0.06] relative z-10">
                <div className="flex items-center gap-4">
                    {trabajo.saldo > 0 ? (
                        <div className="flex items-center gap-2 text-brand-blue text-[10px] font-black uppercase tracking-[0.2em] italic bg-brand-blue/5 px-4 py-2 rounded-xl border border-brand-blue/10">
                           <BoltIcon className="w-4 h-4 animate-pulse" /> {formatCurrency(trabajo.saldo)}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] italic bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10">
                            <CheckBadgeIcon className="w-4 h-4" /> COMPLETED
                        </div>
                    )}
                </div>

                {/* Mobile Quick Status Switcher */}
                <div className="lg:hidden flex items-center gap-2">
                    {nextStatus && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.navigator.vibrate) window.navigator.vibrate([20, 40, 20]);
                                onStatusChange(trabajo.id, nextStatus);
                            }}
                            className="flex items-center gap-4 bg-brand-blue text-white px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] italic shadow-lg shadow-brand-blue/20 active:scale-95 transition-all"
                        >
                            <span className="opacity-60 text-[9px]">NEXT_STAGE:</span>
                            {nextStatus}
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// --- PÁGINA PRINCIPAL ---

const KDSPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { trabajos, clientes, updateTrabajoStatus, updateTrabajoPhoto } = useData();
    const navigate = useNavigate();
    
    const [filterTerm, setFilterTerm] = useState('');
    const [activeTag, setActiveTag] = useState('Vista General');
    const [draggedOverColumn, setDraggedOverColumn] = useState<TrabajoEstado | null>(null);
    const [activeMobileTab, setActiveMobileTab] = useState<TrabajoEstado>(TrabajoEstado.PENDIENTE);
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [cameraTarget, setCameraTarget] = useState<Trabajo | null>(null);

    const filteredTrabajos = useMemo(() => {
        let filtered = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO); 
        
        if (filterTerm) {
            const lower = filterTerm.toLowerCase();
            filtered = filtered.filter(t => 
                (t.subtipo || '').toLowerCase().includes(lower) || 
                String(t.orden).includes(lower) || 
                (clientes.find(c => c.id === t.clienteId)?.nombre || '').toLowerCase().includes(lower)
            );
        }

        switch (activeTag) {
            case 'Prioridad Crítica':
                filtered = filtered.filter(t => getUrgencyLevel(t.fechaEntrega || t.fechaVencimiento) === 'critical');
                break;
            case 'En Diseño':
                filtered = filtered.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado));
                break;
            case 'Producción Activa':
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

    const handleStatusChange = useCallback(async (id: string, newStatus: TrabajoEstado) => {
        if (!currentUser) return;
        try {
            await updateTrabajoStatus(id, newStatus, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CAMBIO_ESTADO', `Orden ${id} cambiada a: ${newStatus}`, 'Producción');
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }, [updateTrabajoStatus, currentUser]);

    const handleDrop = useCallback(async (e: React.DragEvent, newStatus: TrabajoEstado) => {
        e.preventDefault();
        setDraggedOverColumn(null);
        const id = e.dataTransfer.getData("trabajoId");
        if (!id) return;
        
        await handleStatusChange(id, newStatus);
    }, [handleStatusChange]);

    const handlePhotoSave = async (data: string) => {
        if (!cameraTarget) return;
        await updateTrabajoPhoto(cameraTarget.id, data);
        logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'FOTO_CAPTURADA', `Referencia visual para Orden ${cameraTarget.orden}`, 'Producción');
        setCameraTarget(null);
    };

    return (
        <div className="flex flex-col h-full relative select-none overflow-hidden font-display">
            <SEO title="KDS | Núcleo de Control" description="Terminal de operaciones industriales y control de producción en tiempo real." />
            
            {/* --- CABECERA --- */}
            <div className="flex-shrink-0 p-10 lg:p-16 relative z-10 border-b border-white/[0.06] bg-obsidian-card/60 backdrop-blur-3xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-blue to-cyan-500 opacity-20" />
                
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 relative z-10">
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-5">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="p-4 bg-obsidian-card hover:bg-white/[0.04] border border-white/[0.06] rounded-2xl transition-all group shadow-sm"
                            >
                                <HomeIcon className="w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors" />
                            </button>
                            <div className="w-[1px] h-10 bg-white/[0.06]" />
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-brand-blue shadow-[0_0_10px_rgba(14,165,233,0.4)] animate-pulse" />
                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.5em]">PRODUCTION_CONTROL_HUB</span>
                            </div>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight uppercase">
                            Pantalla de Taller <span className="text-brand-blue font-bold">• KDS</span>
                        </h1>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 w-full xl:w-auto items-center">
                        <div className="flex items-center gap-8 bg-obsidian-card/80 p-6 rounded-[2rem] border border-white/[0.06] shadow-sm backdrop-blur-xl">
                            <div className="flex flex-col items-end border-r border-white/[0.06] pr-8">
                                <span className="text-[9px] text-slate-400 font-black tracking-[0.4em] uppercase">OPERADOR</span>
                                <span className="text-sm font-black text-white uppercase">{currentUser?.nombre || 'GUEST_01'}</span>
                            </div>
                            <PrecisionClock />
                        </div>

                        <div className="relative group w-full md:w-[450px]">
                            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
                            <input 
                                type="text" 
                                value={filterTerm}
                                onChange={e => setFilterTerm(e.target.value)}
                                placeholder="RASTREAR ORDEN O CLIENTE..." 
                                className="w-full bg-obsidian-card border border-white/[0.06] rounded-2xl py-6 pl-16 pr-8 text-[12px] font-bold uppercase tracking-widest text-white placeholder:text-slate-500 focus:border-brand-blue/30 outline-none transition-all shadow-sm focus:ring-4 focus:ring-brand-blue/5"
                            />
                        </div>
                    </div>
                </div>

                {/* Tactical Stats Section */}
                <div className="flex gap-6 lg:gap-10 mt-12 px-2 overflow-x-auto no-scrollbar">
                    {[
                        { label: 'Órdenes Activas', value: filteredTrabajos.length, icon: BoxIcon, color: 'text-white' },
                        { label: 'Prioridad Crítica', value: filteredTrabajos.filter(t => getUrgencyLevel(t.fechaEntrega || t.fechaVencimiento) === 'critical').length, icon: BoltIcon, color: 'text-rose-500' },
                        { label: 'Valor en Taller', value: formatCurrency(filteredTrabajos.reduce((acc, t) => acc + t.total, 0)), icon: ActivityIcon, color: 'text-brand-blue' },
                    ].map((stat, i) => (
                        <div key={i} className="flex items-center gap-5 bg-obsidian-card/80 backdrop-blur-xl border border-white/[0.06] px-8 py-5 rounded-[2rem] min-w-[260px] shadow-sm">
                            <div className={`p-3 rounded-2xl bg-white/[0.04] ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                <span className={`text-lg font-black ${stat.color}`}>{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter Tags */}
                <div className="flex gap-2 mt-10 overflow-x-auto no-scrollbar pb-2">
                    {['Vista General', 'Prioridad Crítica', 'En Diseño', 'Producción Activa'].map(tag => (
                        <button
                            key={tag}
                            onClick={() => setActiveTag(tag)}
                            className={`
                                px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border
                                ${activeTag === tag
                                    ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20 border-brand-blue' 
                                    : 'bg-obsidian-card text-slate-400 border-white/[0.06] hover:border-brand-blue/30 hover:text-brand-blue'}
                            `}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Column Selector */}
            <div className="lg:hidden p-6 bg-obsidian-card/40 border-b border-white/[0.06]">
                <div className="flex gap-2 bg-white/[0.04] p-2 rounded-[2rem] overflow-x-auto no-scrollbar border border-white/[0.06]">
                    {KANBAN_COLUMNS.filter(s => s !== TrabajoEstado.ENTREGADO).map((status) => {
                        const isActive = activeMobileTab === status;
                        return (
                            <button
                                key={status}
                                onClick={() => setActiveMobileTab(status as TrabajoEstado)}
                                className={`
                                    relative px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap flex items-center gap-3
                                    ${isActive ? 'text-white' : 'text-slate-400'}
                                `}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeKdsTab"
                                        className="absolute inset-0 bg-brand-blue rounded-[1.5rem] -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">{status}</span>
                                <span className={`
                                    relative z-10 px-2.5 py-1 rounded-lg text-[9px] font-mono
                                    ${isActive ? 'bg-white/20 text-white' : 'bg-obsidian-card text-slate-400 border border-white/[0.06]'}
                                `}>
                                    {columns[status]?.length || 0}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- TABLERO KANBAN --- */}
            <div className="flex-grow overflow-x-auto p-6 lg:p-12 custom-scrollbar-h relative z-10">
                <div className="flex h-full gap-8 lg:min-w-[1500px] w-full">
                    <AnimatePresence mode="popLayout">
                        {KANBAN_COLUMNS.filter(s => s !== TrabajoEstado.ENTREGADO).map((status, index) => {
                            const colStatus = status as TrabajoEstado;
                            const isVisibleOnMobile = activeMobileTab === colStatus;
                            
                            return (
                                <motion.div 
                                    key={status}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`
                                        flex-1 min-w-full lg:min-w-[400px] flex flex-col bg-obsidian-card/30 backdrop-blur-xl transition-all duration-500 border border-white/[0.06] rounded-[3rem] overflow-hidden
                                        ${draggedOverColumn === colStatus ? 'bg-brand-blue/[0.03] border-brand-blue/30 ring-4 ring-brand-blue/5' : ''}
                                        ${!isVisibleOnMobile ? 'hidden lg:flex' : 'flex'}
                                    `}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={() => setDraggedOverColumn(colStatus)}
                                    onDrop={(e) => handleDrop(e, colStatus)}
                                >
                                    {/* Cabecera de Columna */}
                                    <div className="p-10 flex justify-between items-center border-b border-white/[0.06] bg-white/[0.04]">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2.5 h-2.5 rounded-full ${
                                                    status === TrabajoEstado.PENDIENTE ? 'bg-slate-300' :
                                                    status === TrabajoEstado.EN_DISENO ? 'bg-cyan-500' :
                                                    status === TrabajoEstado.PROCESO ? 'bg-brand-blue shadow-[0_0_10px_rgba(14,165,233,0.3)]' : 'bg-emerald-500'
                                                }`} />
                                                <h3 className="font-black text-white uppercase tracking-[0.3em] text-[13px]">
                                                    {status}
                                                </h3>
                                            </div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest pl-6 uppercase">
                                                VOLUME: {formatCurrency(columns[status].reduce((acc, curr) => acc + curr.total, 0))}
                                            </span>
                                        </div>
                                        <div className="bg-obsidian-card px-4 py-2 rounded-2xl text-[11px] font-black text-brand-blue border border-white/[0.06] shadow-sm">
                                            {columns[status].length}
                                        </div>
                                    </div>

                                    {/* Contenedor de Tarjetas */}
                                    <div className="flex-grow overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                        <AnimatePresence>
                                            {columns[status].map(trabajo => (
                                                <KanbanCard 
                                                    key={trabajo.id} 
                                                    trabajo={trabajo} 
                                                    cliente={clientes.find(c => c.id === trabajo.clienteId)}
                                                    onCardClick={setSelectedTrabajo}
                                                    onTakePhotoClick={setCameraTarget}
                                                    onStatusChange={handleStatusChange}
                                                />
                                            ))}
                                        </AnimatePresence>
                                        
                                        {columns[status].length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center opacity-30 py-32 gap-6">
                                                <div className="w-20 h-20 rounded-[2rem] border-2 border-dashed border-white/[0.06] flex items-center justify-center">
                                                    <BoxIcon className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-400">NO_ACTIVE_LOAD_DETECTED</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- MODAL DE DETALLE --- */}
            <BottomSheet 
                isOpen={!!selectedTrabajo} 
                onClose={() => setSelectedTrabajo(null)} 
                title={`ORD-${selectedTrabajo?.orden || ''}`}
            >
                {selectedTrabajo && (() => {
                    const selCliente = clientes.find(c => c.id === selectedTrabajo.clienteId);
                    return (
                    <div className="space-y-10 pb-12 pt-4">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-brand-blue text-white flex items-center justify-center font-black text-3xl shadow-lg shadow-brand-blue/20">
                                {selCliente?.nombre.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-white text-3xl uppercase tracking-tighter leading-none">
                                    {selCliente?.nombre || 'Consumidor Final'}
                                </h3>
                                <div className="flex items-center gap-3">
                                    <p className="text-brand-blue text-[10px] font-black tracking-[0.4em] uppercase">IDENTIDAD_VERIFICADA</p>
                                    {selectedTrabajo.esSRI && (
                                        <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">REG_SRI</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-white/[0.04] border border-white/[0.06] rounded-[2.5rem]">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em] mb-2">Especificación de Servicio</p>
                                <p className="font-black text-white text-lg uppercase leading-tight">{selectedTrabajo.subtipo}</p>
                            </div>
                            <div className="p-8 bg-white/[0.04] border border-white/[0.06] rounded-[2.5rem]">
                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em] mb-2">Carga de Producción</p>
                                <p className="font-black text-white text-lg">{selectedTrabajo.cantidad} UNIDADES</p>
                            </div>
                        </div>

                        {selectedTrabajo.tamano && (
                            <div className="p-6 bg-brand-blue/5 border border-brand-blue/10 rounded-[2rem] flex items-center gap-4">
                                <CpuIcon className="w-5 h-5 text-brand-blue" />
                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.3em]">Formato Industrial:</span>
                                <span className="text-sm font-black text-white uppercase">{selectedTrabajo.tamano}</span>
                            </div>
                        )}

                        <div className="p-10 bg-obsidian-card border border-white/[0.06] rounded-[3rem] space-y-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.2] pointer-events-none" />
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Deuda Pendiente</span>
                                <span className={`text-3xl font-black tracking-tighter ${selectedTrabajo.saldo > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {formatCurrency(selectedTrabajo.saldo)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] ml-2 flex items-center gap-3">
                                <InfoIcon className="w-4 h-4 text-brand-blue"/> LOG_ESPECIFICACIONES
                            </label>
                            <div className="bg-white/[0.04] border border-white/[0.06] rounded-[2.5rem] p-8 text-base font-bold text-slate-300 leading-relaxed min-h-[120px]">
                                {selectedTrabajo.observaciones || "Sin especificaciones técnicas adicionales detectadas."}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {selectedTrabajo.esSRI && (
                                <button 
                                    onClick={() => {
                                        setSelectedTrabajo(null);
                                        navigate(`/solicitud-impresion/${selectedTrabajo.id}`);
                                    }} 
                                    className="bg-obsidian-card text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-widest border border-white/[0.06] hover:border-brand-blue/40 transition-all flex items-center justify-center gap-3 shadow-sm"
                                >
                                    <PrinterIcon className="w-5 h-5 text-brand-blue" /> PRINT_SOLICITUD_A4
                                </button>
                            )}
                            {selCliente?.telefono?.[0] && (
                                <button 
                                    onClick={() => {
                                        const msg = `Protocolo Industrial ORD-${String(selectedTrabajo.orden).padStart(5, '0')}\nEstado: Fase de Diseño/Aprobación.\n\nHola ${selCliente.nombre}, adjuntamos el arte para su validación final.`;
                                        window.open(`https://wa.me/593${selCliente.telefono[0].substring(selCliente.telefono[0].length - 9)}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                    className="bg-emerald-500 text-white py-6 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
                                >
                                    WHATSAPP_UPLINK
                                </button>
                            )}
                             <button 
                                onClick={() => setSelectedTrabajo(null)} 
                                className="bg-white/[0.04] text-slate-400 py-6 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white/[0.08] transition-all"
                            >
                                CLOSE_PORTAL
                            </button>
                        </div>
                    </div>
                    );
                })()}
            </BottomSheet>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(14,165,233,0.3); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                
                .custom-scrollbar-h::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar-h::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); }
                .custom-scrollbar-h::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default KDSPage;
