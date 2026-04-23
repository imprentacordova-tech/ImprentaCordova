import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo, TrabajoEstado, User } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { 
    CloseIcon, ClockIcon, SearchIcon, LayersIcon, 
    CheckBadgeIcon, ActivityIcon, CpuIcon,
    BoltIcon, HistoryIcon, BoxIcon, CameraIcon, InfoIcon
} from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';

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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            whileHover={{ y: -4, transition: { duration: 0.3 } }}
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("trabajoId", trabajo.id);
                e.currentTarget.classList.add('opacity-40');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('opacity-40');
            }}
            onDoubleClick={() => onCardDoubleClick(trabajo)}
            className={`
                relative group bg-[#0A0A0A] mb-5 cursor-grab active:cursor-grabbing 
                border-l-2 ${style.border} border-t border-r border-b border-white/5
                transition-all duration-500 rounded-3xl overflow-hidden p-8
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
                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest italic ${style.bg} ${style.text} border border-white/5 backdrop-blur-md`}>
                    {style.label}
                </div>
            </div>

            {/* Content */}
            <div className="flex gap-6 relative z-10">
                <div className="flex-grow min-w-0 space-y-4">
                    <div>
                        <h4 className="text-xl font-black text-white italic tracking-tighter leading-none mb-2 group-hover:text-liquid-gold transition-colors truncate uppercase">
                            {cliente?.nombre || 'Consumidor Final'}
                        </h4>
                        <div className="flex items-center gap-2">
                             <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-80 italic">{trabajo.subtipo}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-5">
                        <div className="flex items-center gap-2.5 text-[10px] font-black text-white bg-white/[0.03] px-4 py-2 rounded-xl border border-white/5 uppercase tracking-widest italic">
                            <LayersIcon className="w-3.5 h-3.5 text-liquid-gold/60" />
                            <span>{trabajo.cantidad} <span className="text-slate-600">UNID.</span></span>
                        </div>
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

            {/* Footer info */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                    </div>
                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest italic">Expediente Activo</span>
                </div>
                {trabajo.saldo > 0 ? (
                    <div className="flex items-center gap-2 text-rose-500 text-[8px] font-black uppercase tracking-widest italic bg-rose-500/5 px-3 py-1 rounded-lg border border-rose-500/10">
                       <BoltIcon className="w-3 h-3 animate-pulse" /> Saldo: {formatCurrency(trabajo.saldo)}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-emerald-500 text-[8px] font-black uppercase tracking-widest italic bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/10">
                        <CheckBadgeIcon className="w-3 h-3" /> Liquidado
                    </div>
                )}
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
    
    const [filterTerm, setFilterTerm] = useState('');
    const [activeTag, setActiveTag] = useState('Vista General');
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

    const handleDrop = async (e: React.DragEvent, newStatus: TrabajoEstado) => {
        e.preventDefault();
        setDraggedOverColumn(null);
        const id = e.dataTransfer.getData("trabajoId");
        if (!id) return;
        
        await updateTrabajoStatus(id, newStatus, currentUser.nombre);
        logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CAMBIO_ESTADO', `Orden ${id} movida a: ${newStatus}`, 'Producción');
    };

    const handlePhotoSave = async (data: string) => {
        if (!cameraTarget) return;
        await updateTrabajoPhoto(cameraTarget.id, data);
        logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'FOTO_CAPTURADA', `Referencia visual para Orden ${cameraTarget.orden}`, 'Producción');
        setCameraTarget(null);
    };

    return (
        <div className="flex flex-col h-full bg-[#050505] relative select-none overflow-hidden">
            
            {/* --- CABECERA --- */}
            <div className="flex-shrink-0 p-8 lg:p-12 relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold shadow-gold-glow"></div>
                            <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.5em]">Taller de Producción Digital</span>
                        </div>
                        <h1 className="text-5xl lg:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
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
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-[11px] font-bold uppercase tracking-widest text-white placeholder:text-slate-700 focus:border-liquid-gold/20 outline-none transition-all italic backdrop-blur-md"
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
            </div>

            {/* --- TABLERO KANBAN --- */}
            <div className="flex-grow overflow-x-auto overflow-y-hidden p-8 lg:p-10 custom-scrollbar-h relative z-10">
                <div className="flex h-full gap-6 min-w-[1400px]">
                    <AnimatePresence mode="popLayout">
                        {Object.keys(columns).map((status, index) => {
                            const colStatus = status as TrabajoEstado;
                            const isDragOver = draggedOverColumn === colStatus;
                            
                            return (
                                <motion.div 
                                    key={status}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`
                                        flex-1 min-w-[360px] flex flex-col bg-white/[0.01] backdrop-blur-md transition-all duration-500 border border-white/5 rounded-[2.5rem] overflow-hidden
                                        ${isDragOver ? 'bg-liquid-gold/[0.02] border-liquid-gold/10' : ''}
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
                                            <h3 className="font-black text-white uppercase tracking-[0.2em] text-[12px] italic">
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
                                                    onCardDoubleClick={setSelectedTrabajo}
                                                    onTakePhotoClick={setCameraTarget}
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

            {/* --- MODAL DE DETALLE --- */}
            <AnimatePresence>
                {selectedTrabajo && (
                    <div className="fixed inset-0 z-[500] flex justify-center items-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-black/95 backdrop-blur-2xl" 
                            onClick={() => setSelectedTrabajo(null)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="bg-[#050505] w-full max-w-2xl overflow-hidden relative z-10 border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] rounded-[3rem]" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-liquid-gold/10 rounded-xl">
                                            <CpuIcon className="w-5 h-5 text-liquid-gold" />
                                        </div>
                                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Hoja de <span className="text-liquid-gold">Ruta</span></h2>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic ml-1">Protocolo de Producción ORD-{selectedTrabajo.orden}</p>
                                </div>
                                <button onClick={() => setSelectedTrabajo(null)} className="p-4 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl transition-all border border-white/5"><CloseIcon className="w-5 h-5"/></button>
                            </div>
                            
                            <div className="p-10 space-y-10">
                                <div className="flex items-center gap-8">
                                    <div className="w-20 h-20 rounded-[2rem] bg-white text-black flex items-center justify-center font-black text-3xl italic shadow-2xl">
                                        {clientes.find(c => c.id === selectedTrabajo.clienteId)?.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-black text-white text-3xl uppercase tracking-tighter italic leading-none">{clientes.find(c => c.id === selectedTrabajo.clienteId)?.nombre}</h3>
                                        <div className="flex items-center gap-4">
                                            <span className="text-liquid-gold text-[10px] font-black tracking-[0.3em] uppercase italic">Socio Comercial</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 p-10 rounded-[2.5rem] bg-white/[0.01] border border-white/5 backdrop-blur-md">
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] text-slate-700 uppercase font-black tracking-[0.3em] mb-2 italic">Especificación Técnica</p>
                                            <p className="font-black text-white text-xl uppercase italic leading-tight tracking-tight">{selectedTrabajo.subtipo}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-700 uppercase font-black tracking-[0.3em] mb-2 italic">Volumen de Orden</p>
                                            <p className="font-black text-white text-xl italic tracking-tight">{selectedTrabajo.cantidad} <span className="text-slate-600">UNIDADES</span></p>
                                        </div>
                                    </div>
                                    <div className="space-y-6 text-right">
                                        <div>
                                            <p className="text-[10px] text-slate-700 uppercase font-black tracking-[0.3em] mb-2 italic">Inversión Total</p>
                                            <p className="font-black text-liquid-gold text-4xl italic tracking-tighter">{formatCurrency(selectedTrabajo.total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-700 uppercase font-black tracking-[0.3em] mb-2 italic">Estado de Cartera</p>
                                            <p className={`font-black text-[12px] tracking-[0.2em] uppercase italic px-4 py-1.5 rounded-xl inline-block ${selectedTrabajo.saldo > 0 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                {selectedTrabajo.saldo > 0 ? `Pendiente: ${formatCurrency(selectedTrabajo.saldo)}` : 'LIQUIDADO'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] flex items-center gap-4 ml-1 italic">
                                        <InfoIcon className="w-4 h-4 text-liquid-gold"/> Notas de Taller
                                    </label>
                                    <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8 text-[14px] font-medium text-slate-400 leading-relaxed italic min-h-[120px] shadow-inner">
                                        {selectedTrabajo.observaciones || "Sin especificaciones adicionales registradas para este proyecto."}
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-white/[0.01] border-t border-white/5">
                                <button 
                                    onClick={() => setSelectedTrabajo(null)} 
                                    className="w-full bg-white text-black py-6 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.4em] hover:bg-liquid-gold transition-all active:scale-[0.98] italic shadow-2xl"
                                >
                                    Cerrar Expediente
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
