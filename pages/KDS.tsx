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
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
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
                relative group bg-[#080808] mb-4 cursor-grab active:cursor-grabbing 
                border-l-4 ${style.border} border-t border-r border-b border-white/5
                transition-all duration-300 rounded-2xl overflow-hidden p-6
            `}
        >
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                        urgency === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-liquid-gold'
                    }`}></div>
                    <span className="text-[8px] font-bold text-slate-500 tracking-widest uppercase italic">
                        ORD-{String(trabajo.orden).padStart(5, '0')}
                    </span>
                </div>
                <div className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest italic ${style.bg} ${style.text} border border-white/5`}>
                    {style.label}
                </div>
            </div>

            <div className="flex gap-4 relative z-10">
                <div className="flex-grow min-w-0 space-y-3">
                    <div>
                        <h4 className="text-lg font-black text-white italic tracking-tight leading-none mb-1 group-hover:text-liquid-gold transition-colors truncate">
                            {cliente?.nombre || 'CLIENTE NO IDENTIFICADO'}
                        </h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-70 line-clamp-1 italic">{trabajo.subtipo}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest italic">
                            <LayersIcon className="w-3 h-3 text-liquid-gold" />
                            <span>{trabajo.cantidad} unid.</span>
                        </div>
                        {targetDate && (
                            <div className={`flex items-center gap-2 text-[9px] font-bold ${style.text} uppercase tracking-widest italic`}>
                                <ClockIcon className="w-3 h-3" />
                                <span>{formatDate(targetDate)}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex-shrink-0">
                    {trabajo.fotoOriginalUrl ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 relative group/img bg-black transition-all group-hover:border-liquid-gold/40">
                            <img 
                                src={trabajo.fotoOriginalUrl} 
                                alt="Referencia" 
                                className="w-full h-full object-cover grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 transition-all" 
                            />
                        </div>
                    ) : (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onTakePhotoClick(trabajo); }}
                            className="w-14 h-14 rounded-xl border border-dashed border-white/10 flex items-center justify-center hover:border-liquid-gold/30 hover:bg-liquid-gold/5 transition-all text-slate-700 hover:text-liquid-gold"
                        >
                            <CameraIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-2">
                    <HistoryIcon className="w-3 h-3 text-slate-700" />
                    <span className="text-[8px] font-bold text-slate-700 uppercase tracking-widest italic">Historial Activo</span>
                </div>
                {trabajo.saldo > 0 ? (
                    <div className="flex items-center gap-2 text-rose-500 text-[7px] font-black uppercase tracking-widest italic">
                       <BoltIcon className="w-2.5 h-2.5 animate-pulse" /> Saldo: {formatCurrency(trabajo.saldo)}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-emerald-500 text-[7px] font-black uppercase tracking-widest italic">
                        <CheckBadgeIcon className="w-2.5 h-2.5" /> Pagado
                    </div>
                )}
            </div>

            {targetDate && (
                <div className="absolute bottom-0 left-0 h-1 bg-white/[0.02] w-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgress()}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={`h-full ${
                            urgency === 'critical' ? 'bg-rose-500' : 
                            urgency === 'warning' ? 'bg-liquid-gold' : 'bg-slate-800'
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
            <div className="flex-shrink-0 p-8 lg:p-10 relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8">
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse"></div>
                            <span className="text-[10px] font-bold text-liquid-gold uppercase tracking-[0.6em]">Control de Flujo de Trabajo</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
                            Panel de <span className="text-gold-gradient">Producción</span>
                        </h1>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-center">
                        <div className="relative group w-full md:w-[350px]">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                <SearchIcon className="h-4 w-4 text-slate-600 group-focus-within:text-liquid-gold transition-colors" />
                            </div>
                            <input 
                                type="text" 
                                value={filterTerm}
                                onChange={e => setFilterTerm(e.target.value)}
                                placeholder="BUSCAR ORDEN O CLIENTE..." 
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-[10px] font-bold uppercase tracking-widest text-white placeholder:text-slate-700 focus:border-liquid-gold/40 outline-none transition-all italic"
                            />
                        </div>

                        <div className="flex gap-1 bg-black/60 p-1.5 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
                            {['Vista General', 'Órdenes Urgentes', 'En Diseño', 'En Producción'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setActiveTag(tag)}
                                    className={`
                                        px-5 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap italic
                                        ${activeTag === tag 
                                            ? 'bg-white text-black' 
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
                                        flex-1 min-w-[340px] flex flex-col bg-black/20 backdrop-blur-sm transition-all duration-300 border border-white/5 rounded-[2rem] overflow-hidden
                                        ${isDragOver ? 'bg-liquid-gold/[0.02] border-liquid-gold/30' : ''}
                                    `}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={() => setDraggedOverColumn(colStatus)}
                                    onDrop={(e) => handleDrop(e, colStatus)}
                                >
                                    {/* Cabecera de Columna */}
                                    <div className="p-6 flex justify-between items-center border-b border-white/5 bg-white/[0.01]">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${
                                                status === 'Pendiente' ? 'bg-slate-600' :
                                                status === 'En Diseño' ? 'bg-blue-500' :
                                                status === 'En Proceso' ? 'bg-liquid-gold animate-pulse' : 'bg-emerald-500'
                                            }`} />
                                            <h3 className="font-black text-white uppercase tracking-widest text-[11px] italic">
                                                {status}
                                            </h3>
                                        </div>
                                        <div className="bg-white/5 px-3 py-1 rounded-lg text-[10px] font-black text-slate-400 border border-white/5 italic">
                                            {columns[status].length}
                                        </div>
                                    </div>

                                    {/* Contenedor de Tarjetas */}
                                    <div className="flex-grow overflow-y-auto p-5 space-y-1 custom-scrollbar">
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
                                            <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 gap-4">
                                                <BoxIcon className="w-12 h-12 text-white" />
                                                <p className="text-[9px] font-bold tracking-widest uppercase italic">Sin tareas</p>
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
                            className="absolute inset-0 bg-black/90 backdrop-blur-md" 
                            onClick={() => setSelectedTrabajo(null)} 
                        />
                        <motion.div 
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.98, opacity: 0 }}
                            className="bg-[#0a0a0a] w-full max-w-xl overflow-hidden relative z-10 border border-white/10 shadow-2xl rounded-[2.5rem]" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <CpuIcon className="w-4 h-4 text-liquid-gold" />
                                        <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Detalle de <span className="text-liquid-gold">Producción</span></h2>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Orden ORD-{selectedTrabajo.orden}</p>
                                </div>
                                <button onClick={() => setSelectedTrabajo(null)} className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"><CloseIcon className="w-5 h-5"/></button>
                            </div>
                            
                            <div className="p-8 space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center font-black text-2xl italic">
                                        {clientes.find(c => c.id === selectedTrabajo.clienteId)?.nombre.charAt(0)}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-white text-2xl uppercase tracking-tight italic">{clientes.find(c => c.id === selectedTrabajo.clienteId)?.nombre}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-liquid-gold/60 text-[9px] font-bold tracking-widest uppercase italic">Cliente Registrado</span>
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-glow animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1 italic">Especificaciones</p>
                                            <p className="font-bold text-white text-lg uppercase italic leading-tight">{selectedTrabajo.subtipo}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1 italic">Cantidad</p>
                                            <p className="font-bold text-white text-lg italic">{selectedTrabajo.cantidad} unidades</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-right">
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1 italic">Valor Total</p>
                                            <p className="font-black text-liquid-gold text-3xl italic">{formatCurrency(selectedTrabajo.total)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1 italic">Estado de Pago</p>
                                            <p className={`font-black text-[11px] tracking-widest uppercase italic ${selectedTrabajo.saldo > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                                                {selectedTrabajo.saldo > 0 ? `Saldo: ${formatCurrency(selectedTrabajo.saldo)}` : 'CANCELADO'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3 ml-1 italic">
                                        <InfoIcon className="w-4 h-4 text-liquid-gold"/> Observaciones Técnicas
                                    </label>
                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-[13px] font-medium text-slate-400 leading-relaxed italic min-h-[100px]">
                                        {selectedTrabajo.observaciones || "No se han registrado especificaciones técnicas para este trabajo."}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-white/[0.02] border-t border-white/5">
                                <button onClick={() => setSelectedTrabajo(null)} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-liquid-gold transition-all active:scale-95 italic">Cerrar Detalle</button>
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
