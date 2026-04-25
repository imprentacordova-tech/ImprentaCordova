import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo, TrabajoEstado, User, Regimen } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { 
    CloseIcon, ClockIcon, SearchIcon, LayersIcon, 
    CheckBadgeIcon, ActivityIcon, CpuIcon,
    BoltIcon, HistoryIcon, BoxIcon, CameraIcon, InfoIcon, ArrowRightIcon,
    ShieldCheckIcon, PrinterIcon
} from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '../components/BottomSheet';

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
    critical: { border: 'border-l-rose-600', bg: 'bg-rose-600/10', text: 'text-rose-500', label: 'ENTREGA INMEDIATA', glow: 'shadow-[0_0_15px_rgba(225,29,72,0.2)]' },
    warning: { border: 'border-l-liquid-gold', bg: 'bg-liquid-gold/10', text: 'text-liquid-gold', label: 'PRIORIDAD ALTA', glow: 'shadow-[0_0_15px_rgba(212,175,55,0.2)]' },
    safe: { border: 'border-l-slate-800', bg: 'bg-white/5', text: 'text-slate-500', label: 'EN TIEMPO', glow: '' },
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
            onDragStart={(e) => {
                e.dataTransfer.setData("trabajoId", trabajo.id);
                e.currentTarget.classList.add('opacity-40');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('opacity-40');
            }}
            onClick={() => onCardClick(trabajo)}
            className={`
                relative group kds-card mb-5 cursor-pointer
                border-l-2 ${style.border} border-t border-r border-b border-slate-200/50 dark:border-white/5
                transition-all duration-500 rounded-3xl overflow-hidden p-6 md:p-8
                hover:border-white/10 hover:shadow-2xl hover:shadow-black/50
            `}
        >
            {/* Header info */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-700 tracking-[0.3em] uppercase italic">
                        ORD-{String(trabajo.orden).padStart(5, '0')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest italic ${style.bg} ${style.text} border border-white/5 backdrop-blur-md`}>
                        {style.label}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex gap-6 relative z-10">
                <div className="flex-grow min-w-0 space-y-4">
                    <div>
                        <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white italic tracking-tighter leading-none mb-2 group-hover:text-liquid-gold transition-colors truncate uppercase">
                            {cliente?.nombre || 'Consumidor Final'}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                             <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                             <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest opacity-80 italic truncate max-w-[200px]">{trabajo.subtipo}</p>
                             {trabajo.tipo === 'sri' && (
                                 <span className="px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest bg-brand-red/10 text-brand-red border border-brand-red/20 animate-pulse">SRI</span>
                             )}
                             {cliente?.regimen === Regimen.NEGOCIO_POPULAR && (
                                 <span className="px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">RIMPE N.P.</span>
                             )}
                             {cliente?.regimen === Regimen.EMPRENDEDOR && (
                                 <span className="px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20">EMPREND.</span>
                             )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 text-[10px] font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-white/[0.03] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/5 uppercase tracking-widest italic">
                            <LayersIcon className="w-3.5 h-3.5 text-liquid-gold/60" />
                            <span>{trabajo.cantidad} <span className="text-slate-500 dark:text-slate-600">UNID.</span></span>
                        </div>
                        {trabajo.tamano && (
                            <div className="text-[9px] font-black text-slate-400 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/5 uppercase tracking-widest italic">
                                {trabajo.tamano}
                            </div>
                        )}
                        {targetDate && (
                            <div className={`flex items-center gap-2.5 text-[10px] font-black ${style.text} uppercase tracking-widest italic`}>
                                <ClockIcon className="w-3.5 h-3.5 opacity-50" />
                                <span>{formatDate(targetDate)}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex-shrink-0">
                    {trabajo.fotoOriginalUrl ? (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5 relative group/img bg-black transition-all group-hover:border-liquid-gold/20 shadow-xl">
                            <img 
                                src={trabajo.fotoOriginalUrl} 
                                alt="Referencia" 
                                className="w-full h-full object-cover grayscale opacity-30 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100" 
                            />
                        </div>
                    ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onTakePhotoClick(trabajo); }}
                            className="w-16 h-16 rounded-2xl border border-dashed border-white/5 flex items-center justify-center hover:border-liquid-gold/20 hover:bg-liquid-gold/5 transition-all text-slate-800 hover:text-liquid-gold group/cam"
                        >
                            <CameraIcon className="w-7 h-7 group-hover/cam:scale-110 transition-transform" />
                        </button>
                    )}
                </div>
            </div>

            {/* Footer info & Quick Action */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-3">
                    {trabajo.saldo > 0 ? (
                        <div className="flex items-center gap-2 text-rose-500 text-[8px] font-black uppercase tracking-widest italic bg-rose-500/5 px-3 py-1 rounded-lg border border-rose-500/10">
                           <BoltIcon className="w-3 h-3 animate-pulse" /> {formatCurrency(trabajo.saldo)}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-500 text-[8px] font-black uppercase tracking-widest italic bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/10">
                            <CheckBadgeIcon className="w-3 h-3" /> Liquidado
                        </div>
                    )}
                </div>

                {/* Mobile Quick Status Switcher */}
                <div className="lg:hidden flex items-center gap-2">
                    {nextStatus && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.navigator.vibrate) window.navigator.vibrate(50);
                                onStatusChange(trabajo.id, nextStatus);
                            }}
                            className="flex items-center gap-2 bg-liquid-gold text-brand-dark px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-lg active:scale-90 transition-all"
                        >
                            <ArrowRightIcon className="w-3 h-3" /> {nextStatus}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress line */}
            {targetDate && (
                <div className="absolute bottom-0 left-0 h-1 bg-white/[0.01] w-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgress()}%` }}
                        transition={{ duration: 2, ease: "circOut" }}
                        className={`h-full ${
                            urgency === 'critical' ? 'bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.5)]' : 
                            urgency === 'warning' ? 'bg-liquid-gold shadow-gold-glow' : 'bg-slate-800'
                        }`} 
                    />
                </div>
            )}
        </motion.div>
    );
};

// --- PÁGINA PRINCIPAL ---

const KDSPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
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
            case 'Órdenes Urgentes':
                filtered = filtered.filter(t => getUrgencyLevel(t.fechaEntrega || t.fechaVencimiento) !== 'safe');
                break;
            case 'En Diseño':
                filtered = filtered.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado));
                break;
            case 'En Producción':
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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#050505] relative select-none overflow-hidden">
            
            {/* --- CABECERA --- */}
            <div className="flex-shrink-0 p-8 lg:p-12 relative z-10 border-b border-slate-200 dark:border-white/5 bg-white/40 dark:bg-black/40 backdrop-blur-xl">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold shadow-gold-glow"></div>
                            <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.5em]">Taller de Producción Digital</span>
                        </div>
                        <h1 className="text-5xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
                            Control de <span className="text-gold-gradient">Flujo</span>
                        </h1>
                    </div>

                    <div className="flex flex-col md:flex-row gap-5 w-full xl:w-auto items-center">
                        <div className="relative group w-full md:w-[400px]">
                            <div className="absolute left-6 top-1/2 -translate-y-1/2">
                                <SearchIcon className="h-4 w-4 text-slate-600 group-focus-within:text-liquid-gold transition-colors" />
                            </div>
                            <input 
                                type="text" 
                                value={filterTerm}
                                onChange={e => setFilterTerm(e.target.value)}
                                placeholder="BUSCAR POR ORDEN O CLIENTE..." 
                                className="w-full bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl py-5 pl-14 pr-6 text-[11px] font-bold uppercase tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:border-liquid-gold/20 outline-none transition-all italic backdrop-blur-md"
                            />
                        </div>

                        <div className="flex gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar backdrop-blur-md">
                            {['Vista General', 'Prioridad Alta', 'En Diseño', 'En Proceso'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setActiveTag(tag)}
                                    className={`
                                        px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap italic
                                        ${activeTag === tag 
                                            ? 'bg-liquid-gold text-brand-dark shadow-gold-glow' 
                                            : 'text-slate-500 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Tab Selector */}
                <div className="lg:hidden mt-8 flex gap-2 bg-white/5 p-1.5 rounded-2xl overflow-x-auto no-scrollbar border border-white/5">
                    {KANBAN_COLUMNS.map((status) => (
                        <button
                            key={status}
                            onClick={() => setActiveMobileTab(status as TrabajoEstado)}
                            className={`
                                px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap italic flex items-center gap-3
                                ${activeMobileTab === status 
                                    ? 'bg-liquid-gold text-brand-dark shadow-gold-glow' 
                                    : 'text-slate-500 bg-white/50 dark:bg-white/5'}
                            `}
                        >
                            {status}
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] ${activeMobileTab === status ? 'bg-brand-dark/20' : 'bg-white/10'}`}>
                                {columns[status]?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- TABLERO KANBAN --- */}
            <div className="flex-grow overflow-x-auto lg:overflow-x-auto overflow-y-hidden p-4 lg:p-10 custom-scrollbar-h relative z-10">
                <div className="flex h-full gap-6 lg:min-w-[1400px] w-full">
                    <AnimatePresence mode="popLayout">
                        {KANBAN_COLUMNS.filter(s => s !== TrabajoEstado.ENTREGADO).map((status, index) => {
                            const colStatus = status as TrabajoEstado;
                            
                            // On mobile, only show the active tab
                            const isVisibleOnMobile = activeMobileTab === colStatus;
                            
                            return (
                                <motion.div 
                                    key={status}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`
                                        flex-1 min-w-full lg:min-w-[360px] flex flex-col bg-white/[0.01] backdrop-blur-md transition-all duration-500 border border-white/5 rounded-[2.5rem] overflow-hidden
                                        ${draggedOverColumn === colStatus ? 'bg-liquid-gold/[0.02] border-liquid-gold/10' : ''}
                                        ${!isVisibleOnMobile ? 'hidden lg:flex' : 'flex'}
                                    `}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={() => setDraggedOverColumn(colStatus)}
                                    onDrop={(e) => handleDrop(e, colStatus)}
                                >
                                    {/* Cabecera de Columna */}
                                    <div className="p-8 flex justify-between items-center border-b border-white/5 bg-white/[0.01]">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                status === 'Pendiente' ? 'bg-slate-700' :
                                                status === 'En Diseño' ? 'bg-blue-500' :
                                                status === 'En Proceso' ? 'bg-liquid-gold shadow-gold-glow' : 'bg-emerald-500'
                                            }`} />
                                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[12px] italic">
                                                {status}
                                            </h3>
                                        </div>
                                        <div className="bg-white/5 px-3 py-1 rounded-xl text-[10px] font-black text-slate-500 border border-white/5 italic">
                                            {columns[status].length}
                                        </div>
                                    </div>

                                    {/* Contenedor de Tarjetas */}
                                    <div className="flex-grow overflow-y-auto p-6 space-y-2 custom-scrollbar">
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
                                            <div className="h-full flex flex-col items-center justify-center opacity-10 py-24 gap-5">
                                                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
                                                    <BoxIcon className="w-6 h-6 text-white" />
                                                </div>
                                                <p className="text-[10px] font-black tracking-[0.3em] uppercase italic">Sin órdenes activas</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* --- MODAL DE DETALLE (BOTTOM SHEET EN MÓVIL) --- */}
            <BottomSheet 
                isOpen={!!selectedTrabajo} 
                onClose={() => setSelectedTrabajo(null)} 
                title={`ORD-${selectedTrabajo?.orden || ''}`}
            >
                {selectedTrabajo && (() => {
                    const selCliente = clientes.find(c => c.id === selectedTrabajo.clienteId);
                    return (
                    <div className="space-y-8 pb-10">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-liquid-gold text-brand-dark flex items-center justify-center font-black text-2xl italic shadow-gold-glow">
                                {selCliente?.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 dark:text-white text-2xl uppercase tracking-tighter italic leading-none">
                                    {selCliente?.nombre}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-liquid-gold text-[9px] font-black tracking-[0.3em] uppercase italic">Socio Comercial Activo</p>
                                    {selectedTrabajo.tipo === 'sri' && (
                                        <span className="px-2 py-0.5 rounded-md text-[7px] font-black uppercase bg-brand-red/10 text-brand-red border border-brand-red/20">SRI</span>
                                    )}
                                    {selCliente?.regimen === Regimen.NEGOCIO_POPULAR && (
                                        <span className="px-2 py-0.5 rounded-md text-[7px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">RIMPE N.P.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl">
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1 italic">Servicio</p>
                                <p className="font-black text-slate-900 dark:text-white text-sm uppercase italic truncate">{selectedTrabajo.subtipo}</p>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl">
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1 italic">Cantidad</p>
                                <p className="font-black text-slate-900 dark:text-white text-sm italic">{selectedTrabajo.cantidad} UNID.</p>
                            </div>
                        </div>

                        {selectedTrabajo.tamano && (
                            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl flex items-center gap-3">
                                <CpuIcon className="w-4 h-4 text-liquid-gold/60" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Formato:</span>
                                <span className="text-sm font-black text-white uppercase italic">{selectedTrabajo.tamano}</span>
                            </div>
                        )}

                        <div className="p-6 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-3xl space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Inversión Total</span>
                                <span className="text-xl font-black text-slate-900 dark:text-white italic">{formatCurrency(selectedTrabajo.total)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-white/5">
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">Saldo Pendiente</span>
                                <span className={`text-xl font-black italic ${selectedTrabajo.saldo > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {formatCurrency(selectedTrabajo.saldo)}
                                </span>
                            </div>
                        </div>

                        {selectedTrabajo.actividadSeleccionada && (
                            <div className="p-4 bg-brand-red/5 border border-brand-red/10 rounded-2xl flex items-center gap-3">
                                <ShieldCheckIcon className="w-4 h-4 text-brand-red" />
                                <span className="text-[9px] font-black text-brand-red uppercase tracking-widest italic">Actividad SRI:</span>
                                <span className="text-xs font-black text-white uppercase italic truncate">{selectedTrabajo.actividadSeleccionada}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] ml-1 italic flex items-center gap-2">
                                <InfoIcon className="w-3 h-3 text-liquid-gold"/> Especificaciones de Taller
                            </label>
                            <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic min-h-[80px]">
                                {selectedTrabajo.observaciones || selectedTrabajo.subtipo || "Sin especificaciones técnicas adicionales."}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {selectedTrabajo.tipo === 'sri' && (
                                <button 
                                    onClick={() => {
                                        setSelectedTrabajo(null);
                                        navigate(`/solicitud-impresion/${selectedTrabajo.id}`);
                                    }} 
                                    className="bg-white/5 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest italic border border-white/10 hover:border-liquid-gold/30 transition-all flex items-center justify-center gap-2 col-span-2"
                                >
                                    <PrinterIcon className="w-4 h-4" /> Imprimir Solicitud A4
                                </button>
                            )}
                            {selCliente?.telefono?.[0] && (
                                <button 
                                    onClick={() => {
                                        const msg = `Hola *${selCliente.nombre}*, su pedido ORD-${String(selectedTrabajo.orden).padStart(5, '0')} está en producción. Le enviaremos el diseño para su aprobación.`;
                                        window.open(`https://wa.me/${selCliente.telefono[0]}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                    className="bg-green-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest italic hover:bg-green-500 transition-all flex items-center justify-center gap-2"
                                >
                                    WhatsApp Arte
                                </button>
                            )}
                             <button 
                                onClick={() => setSelectedTrabajo(null)} 
                                className="bg-slate-100 dark:bg-white/5 text-slate-500 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest italic"
                            >
                                Regresar
                            </button>
                        </div>
                    </div>
                    );
                })()}
            </BottomSheet>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.2); }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

export default KDSPage;
