
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo, TrabajoEstado, User } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { DocumentIcon, CloseIcon, CameraIcon, ArrowUpIcon, ArrowDownIcon, ReceiptIcon, ClockIcon, FilterIcon, PhotoIcon, SearchIcon } from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';
import { logActivity } from '../services/activityLogService';

// --- HELPERS ---

type UrgencyLevel = 'critical' | 'warning' | 'safe';

const getUrgencyLevel = (dateStr?: string): UrgencyLevel => {
    if (!dateStr) return 'safe';
    const now = new Date().getTime();
    const target = new Date(dateStr).getTime();
    const diffDays = (target - now) / (1000 * 3600 * 24);

    if (diffDays < 1) return 'critical'; // Less than 24h or passed
    if (diffDays < 3) return 'warning';
    return 'safe';
};

const urgencyConfig = {
    critical: { border: 'border-l-red-500', bg: 'bg-red-500/10', text: 'text-red-400', label: 'CRÍTICO' },
    warning: { border: 'border-l-liquid-gold', bg: 'bg-liquid-gold/10', text: 'text-liquid-gold', label: 'PRIORIDAD' },
    safe: { border: 'border-l-slate-700', bg: 'bg-white/5', text: 'text-slate-400', label: 'ESTÁNDAR' },
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
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("trabajoId", trabajo.id);
                e.currentTarget.classList.add('opacity-50', 'scale-95');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('opacity-50', 'scale-95');
            }}
            onDoubleClick={() => onCardDoubleClick(trabajo)}
            className={`
                relative group glass-card-luxury mb-4 cursor-grab active:cursor-grabbing 
                border-l-4 ${style.border} border-t border-r border-b border-white/5
                transition-all duration-700 ease-in-out hover:-translate-y-2 hover:border-white/20
                overflow-hidden p-6
            `}
        >
            {/* Header: Order ID & Urgency */}
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">
                    ORD-{trabajo.orden}
                </span>
                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${style.bg} ${style.text} border border-white/5`}>
                    {style.label}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex gap-5">
                <div className="flex-grow">
                    <h4 className="text-lg font-black text-white italic tracking-tight leading-none mb-1 group-hover:text-liquid-gold transition-colors">
                        {cliente?.nombre || 'ANÓNIMO'}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-4 opacity-80 line-clamp-1">{trabajo.subtipo}</p>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-[10px] font-black text-liquid-gold/80 bg-liquid-gold/5 px-2 py-1 rounded-lg">
                            <span className="opacity-60">{trabajo.cantidad}</span>
                            <span className="uppercase tracking-tighter">unidades</span>
                        </div>
                        {targetDate && (
                            <div className={`flex items-center gap-1.5 text-[10px] font-bold ${style.text}`}>
                                <ClockIcon className="w-3.5 h-3.5" />
                                <span>{formatDate(targetDate).toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Thumbnail Preview with Bokeh effect */}
                {trabajo.fotoOriginalUrl && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border border-white/10 relative group/img shadow-2xl">
                        <img 
                            src={trabajo.fotoOriginalUrl} 
                            alt="Referencia" 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-125" 
                        />
                        <div className="absolute inset-0 bg-brand-dark/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 backdrop-blur-sm">
                            <PhotoIcon className="w-6 h-6 text-white drop-shadow-luxury" />
                        </div>
                    </div>
                )}
            </div>

            {/* Finance Status Mini Badge */}
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-700 -translate-y-2 group-hover:translate-y-0">
                {trabajo.saldo > 0 ? (
                    <div className="flex items-center gap-1 bg-red-500/10 text-red-400 text-[8px] font-black px-2 py-1 rounded-full border border-red-500/20">
                        PENDIENTE
                    </div>
                ) : (
                    <div className="flex items-center gap-1 bg-white/5 text-slate-300 text-[8px] font-black px-2 py-1 rounded-full border border-white/10 uppercase">
                        Liquido
                    </div>
                )}
            </div>

            {/* Progress Bar (Visual Indicator of Time Elapsed) */}
            {targetDate && (
                <div className="absolute bottom-0 left-0 h-[3px] bg-white/5 w-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out ${
                            urgency === 'critical' ? 'bg-gradient-to-r from-red-600 to-red-400' : 
                            urgency === 'warning' ? 'bg-gradient-to-r from-liquid-gold to-white' : 'bg-slate-600'
                        }`} 
                        style={{ width: `${getProgress()}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};

// --- MODALS (Kept minimal for this file context) ---

const TrabajoDetalleModal: React.FC<{ trabajo: Trabajo; cliente?: Cliente; onClose: () => void }> = ({ trabajo, cliente, onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-brand-dark/95 backdrop-blur-xl rounded-[2.5rem] shadow-luxury w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div>
                    <h2 className="text-3xl font-editorial font-bold text-liquid-gold uppercase tracking-tight italic">Orden #{trabajo.orden}</h2>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Detalle de producción</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><CloseIcon className="w-5 h-5 text-slate-400"/></button>
            </div>
            <div className="p-8 space-y-6">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center font-black text-liquid-gold text-xl">
                        {cliente?.nombre.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-black text-white text-lg uppercase tracking-tight">{cliente?.nombre}</h3>
                        <p className="text-slate-500 text-xs font-bold mt-0.5">{cliente?.ruc || cliente?.cedula}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                    <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Producto</p>
                        <p className="font-bold text-white text-sm mt-1">{trabajo.subtipo}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Cantidad</p>
                        <p className="font-bold text-white text-sm mt-1">{trabajo.cantidad}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Total</p>
                        <p className="font-black text-liquid-gold text-sm mt-1">{formatCurrency(trabajo.total)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em]">Saldo</p>
                        <p className={`font-black text-sm mt-1 ${trabajo.saldo > 0 ? 'text-red-400' : 'text-white'}`}>{formatCurrency(trabajo.saldo)}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Notas de Producción</label>
                    <textarea className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-sm font-bold text-white outline-none focus:ring-1 focus:ring-liquid-gold/30 resize-none placeholder:text-slate-700" rows={3} placeholder="Instrucciones para taller..."></textarea>
                </div>
            </div>
            <div className="p-6 bg-white/5 flex justify-end border-t border-white/5">
                <button onClick={onClose} className="px-8 py-3 bg-liquid-gold text-brand-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-gold-glow hover:bg-white transition-all duration-500">Cerrar</button>
            </div>
        </div>
    </div>
);

const CameraModal: React.FC<{ trabajo: Trabajo; onClose: () => void; onCapture: (data: string) => void }> = ({ trabajo, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
            setStream(s);
            if (videoRef.current) videoRef.current.srcObject = s;
        }).catch(console.error);
        return () => { stream?.getTracks().forEach(t => t.stop()); };
    }, []);

    const capture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg'));
    };

    return (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col justify-center items-center animate-fade-in">
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg h-auto rounded-2xl mb-6 border border-white/10 shadow-luxury" />
            <div className="flex gap-4">
                <button onClick={capture} className="px-10 py-4 bg-white text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-gold-glow hover:bg-liquid-gold transition-all duration-500">Capturar</button>
                <button onClick={onClose} className="px-10 py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white/20 transition-all duration-500">Cancelar</button>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

type FilterTag = 'Todos' | 'Urgentes' | 'Diseño' | 'Impresión';

const KDSPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, updateTrabajoStatus, updateTrabajoPhoto } = useData();
    
    const [filterTerm, setFilterTerm] = useState('');
    const [activeTag, setActiveTag] = useState<FilterTag>('Todos');
    const [draggedOverColumn, setDraggedOverColumn] = useState<TrabajoEstado | null>(null);
    
    // Modal States
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [cameraTarget, setCameraTarget] = useState<Trabajo | null>(null);

    // Initial Load - Removed manual fetch, handled by useData

    // Filter Logic
    const filteredTrabajos = useMemo(() => {
        let filtered = trabajos.filter(t => t.estado !== TrabajoEstado.ENTREGADO); // Archive delivered
        
        // Text Filter
        if (filterTerm) {
            const lower = filterTerm.toLowerCase();
            filtered = filtered.filter(t => 
                t.subtipo.toLowerCase().includes(lower) || 
                String(t.orden).includes(lower) || 
                clientes.find(c => c.id === t.clienteId)?.nombre.toLowerCase().includes(lower)
            );
        }

        // Tag Filter
        switch (activeTag) {
            case 'Urgentes':
                filtered = filtered.filter(t => getUrgencyLevel(t.fechaEntrega || t.fechaVencimiento) !== 'safe');
                break;
            case 'Diseño':
                filtered = filtered.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado));
                break;
            case 'Impresión':
                filtered = filtered.filter(t => [TrabajoEstado.PROCESO, TrabajoEstado.VITRINA].includes(t.estado));
                break;
        }

        return filtered;
    }, [trabajos, filterTerm, activeTag, clientes]);

    // Group by Columns
    const columns = useMemo(() => {
        const cols: Record<string, Trabajo[]> = {};
        KANBAN_COLUMNS.forEach(col => {
            if (col !== TrabajoEstado.ENTREGADO) { // Hide delivered from main board
                cols[col] = filteredTrabajos.filter(t => t.estado === col);
            }
        });
        return cols;
    }, [filteredTrabajos]);

    // Drag & Drop Handlers
    const handleDrop = async (e: React.DragEvent, newStatus: TrabajoEstado) => {
        e.preventDefault();
        setDraggedOverColumn(null);
        const id = e.dataTransfer.getData("trabajoId");
        if (!id) return;
        
        // API Call
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
        <div className="flex flex-col h-full overflow-hidden bg-brand-dark relative">
            {/* Ambient Background Glow */}
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-liquid-gold/5 rounded-full blur-[150px] -ml-64 -mb-64 pointer-events-none"></div>

            {/* --- HEADER & FILTERS --- */}
            <div className="flex-shrink-0 p-8 sm:p-10 relative z-10">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                    
                    {/* Title & Search */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 w-full xl:w-auto">
                        <div>
                            <h1 className="text-5xl lg:text-6xl font-editorial font-bold text-white tracking-tight uppercase italic leading-none">
                                Taller <span className="text-gold-gradient">Monitor</span>
                            </h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3 ml-1">Flujo de Producción & KDS</p>
                        </div>

                        <div className="relative flex-grow sm:w-80 group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                            <input 
                                type="text" 
                                value={filterTerm}
                                onChange={e => setFilterTerm(e.target.value)}
                                placeholder="LOCALIZAR ORDEN O CLIENTE..." 
                                className="w-full pl-12 pr-6 py-4 bg-white/5 border-white/5 focus:bg-white/10 border-2 focus:border-liquid-gold/30 rounded-2xl transition-all duration-500 text-[11px] font-black tracking-widest text-white uppercase placeholder:text-slate-600 outline-none"
                            />
                        </div>
                    </div>

                    {/* Quick Filters (Tags) */}
                    <div className="flex gap-4 overflow-x-auto w-full xl:w-auto pb-4 xl:pb-0 scrollbar-hide">
                        {(['Todos', 'Urgentes', 'Diseño', 'Impresión'] as FilterTag[]).map(tag => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag)}
                                className={`
                                    px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-500 border
                                    ${activeTag === tag 
                                        ? 'bg-white text-brand-dark border-white shadow-gold-glow scale-105' 
                                        : 'bg-transparent text-slate-500 border-white/5 hover:border-white/20 hover:text-white'}
                                `}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- KANBAN BOARD --- */}
            <div className="flex-grow overflow-x-auto overflow-y-hidden px-8 sm:px-10 pb-10">
                <div className="flex h-full gap-8 min-w-[1200px]">
                    {Object.keys(columns).map((status) => {
                        const colStatus = status as TrabajoEstado;
                        const isDragOver = draggedOverColumn === colStatus;
                        
                        return (
                            <div 
                                key={status}
                                className={`
                                    flex-1 min-w-[320px] flex flex-col rounded-[2.5rem] transition-all duration-700
                                    ${isDragOver ? 'bg-liquid-gold/10 ring-2 ring-liquid-gold/30 scale-[1.02]' : 'bg-white/5 backdrop-blur-sm border border-white/5'}
                                `}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnter={() => setDraggedOverColumn(colStatus)}
                                onDrop={(e) => handleDrop(e, colStatus)}
                            >
                                {/* Column Header */}
                                <div className="p-8 flex justify-between items-center border-b border-white/5">
                                    <h3 className="font-black text-white uppercase tracking-[0.3em] text-[10px] flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full shadow-gold-glow ${
                                            status === 'Pendiente' ? 'bg-white/40' :
                                            status === 'En Diseño' ? 'bg-liquid-gold/50' :
                                            status === 'En Proceso' ? 'bg-liquid-gold' : 'bg-liquid-gold shadow-gold-glow'
                                        }`}></div>
                                        {status}
                                    </h3>
                                    <span className="bg-white/5 px-3 py-1 rounded-lg text-[10px] font-black text-liquid-gold/60 border border-white/5">
                                        {columns[status].length}
                                    </span>
                                </div>

                                {/* Cards Container */}
                                <div className="flex-grow overflow-y-auto p-6 space-y-2 custom-scrollbar">
                                    {columns[status].map(trabajo => (
                                        <KanbanCard 
                                            key={trabajo.id} 
                                            trabajo={trabajo} 
                                            cliente={clientes.find(c => c.id === trabajo.clienteId)}
                                            onCardDoubleClick={setSelectedTrabajo}
                                            onTakePhotoClick={setCameraTarget}
                                        />
                                    ))}
                                    {columns[status].length === 0 && (
                                        <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2rem] opacity-30 grayscale italic scale-95 transition-all">
                                            <div className="w-12 h-12 rounded-full border border-white/20 mb-4 flex items-center justify-center">
                                                <ClockIcon className="w-5 h-5" />
                                            </div>
                                            <p className="text-[10px] font-black tracking-widest uppercase">Sin órdenes</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- MODALS --- */}
            {selectedTrabajo && (
                <TrabajoDetalleModal 
                    trabajo={selectedTrabajo} 
                    cliente={clientes.find(c => c.id === selectedTrabajo.clienteId)} 
                    onClose={() => setSelectedTrabajo(null)} 
                />
            )}
            {cameraTarget && (
                <CameraModal 
                    trabajo={cameraTarget} 
                    onClose={() => setCameraTarget(null)} 
                    onCapture={handlePhotoSave} 
                />
            )}
        </div>
    );
};

export default KDSPage;
