
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { getTrabajos, getClientes, updateTrabajoStatus, updateTrabajoPhoto } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoEstado, User } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { DocumentIcon, CloseIcon, CameraIcon, ArrowUpIcon, ArrowDownIcon, ReceiptIcon, ClockIcon, FilterIcon, PhotoIcon, SearchIcon } from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';

// --- HELPERS ---

type UrgencyLevel = 'critical' | 'warning' | 'safe';

const getUrgencyLevel = (dateStr?: string): UrgencyLevel => {
    if (!dateStr) return 'safe';
    const now = new Date().getTime();
    const target = new Date(dateStr).getTime();
    const diffDays = (target - now) / (1000 * 3600 * 24);

    if (diffDays < 2) return 'critical';
    if (diffDays < 5) return 'warning';
    return 'safe';
};

const urgencyConfig = {
    critical: { border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', label: 'Urgente' },
    warning: { border: 'border-l-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600', label: 'Atención' },
    safe: { border: 'border-l-green-500', bg: 'bg-white dark:bg-gray-800', text: 'text-gray-500', label: 'A tiempo' },
};

// --- COMPONENTS ---

interface KanbanCardProps {
  trabajo: Trabajo;
  cliente?: Cliente;
  onCardDoubleClick: (trabajo: Trabajo) => void;
  onTakePhotoClick: (trabajo: Trabajo) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ trabajo, cliente, onCardDoubleClick, onTakePhotoClick }) => {
    const urgency = getUrgencyLevel(trabajo.fechaVencimiento);
    const style = urgencyConfig[urgency];
    
    // Calculate progress if dates exist
    const getProgress = () => {
        if(!trabajo.fechaVencimiento) return 0;
        const start = new Date(trabajo.fechaEntrada).getTime();
        const end = new Date(trabajo.fechaVencimiento).getTime();
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
                relative group bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-3 cursor-grab active:cursor-grabbing 
                border-l-4 ${style.border} border-t border-r border-b border-gray-100 dark:border-gray-700
                transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 hover:border-gray-300 dark:hover:border-gray-600
                overflow-hidden
            `}
        >
            {/* Urgency Badge (Only if critical or warning) */}
            {urgency !== 'safe' && (
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${style.bg} ${style.text}`}>
                    {style.label}
                </div>
            )}

            <div className="p-4">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                        #{trabajo.orden}
                    </span>
                </div>

                {/* Content */}
                <div className="flex gap-3">
                    <div className="flex-grow">
                        <h4 className="font-bold text-gray-800 dark:text-white leading-tight mb-1">{cliente?.nombre || 'Cliente Desconocido'}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{trabajo.subtipo}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-bold bg-blue-50 dark:bg-blue-900/30 text-brand-blue px-2 py-0.5 rounded-md">
                                {trabajo.cantidad} uds
                            </span>
                            {trabajo.fechaVencimiento && (
                                <span className={`flex items-center gap-1 ${style.text}`}>
                                    <ClockIcon className="w-3 h-3" />
                                    {formatDate(trabajo.fechaVencimiento)}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Thumbnail Preview */}
                    {trabajo.fotoOriginalUrl && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 relative group/img">
                            <img 
                                src={trabajo.fotoOriginalUrl} 
                                alt="Referencia" 
                                className="w-full h-full object-cover transition-transform group-hover/img:scale-110" 
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <PhotoIcon className="w-6 h-6 text-white drop-shadow-md" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                        {trabajo.estado === TrabajoEstado.ENTREGADO ? (
                            <Link to={`/nota-de-venta/${trabajo.id}`} target="_blank" className="p-1.5 hover:bg-green-100 rounded-full text-green-600 transition-colors" title="Ver Nota">
                                <ReceiptIcon className="w-4 h-4" />
                            </Link>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); onTakePhotoClick(trabajo); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors" title="Adjuntar Foto">
                                <CameraIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    
                    {/* Financial Status */}
                    <div className="text-right">
                        {trabajo.saldo > 0 ? (
                            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                Pend: {formatCurrency(trabajo.saldo)}
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ReceiptIcon className="w-3 h-3" /> Pagado
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Progress Bar (Visual Indicator of Time Elapsed) */}
            {trabajo.fechaVencimiento && (
                <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
                    <div 
                        className={`h-full ${urgency === 'critical' ? 'bg-red-500' : urgency === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${getProgress()}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};

// --- MODALS (Kept minimal for this file context) ---

const TrabajoDetalleModal: React.FC<{ trabajo: Trabajo; cliente?: Cliente; onClose: () => void }> = ({ trabajo, cliente, onClose }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Orden #{trabajo.orden}</h2>
                <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500"/></button>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xl">
                        {cliente?.nombre.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{cliente?.nombre}</h3>
                        <p className="text-gray-500 text-sm">{cliente?.ruc || cliente?.cedula}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Producto</p>
                        <p className="font-medium">{trabajo.subtipo}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Cantidad</p>
                        <p className="font-medium">{trabajo.cantidad}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                        <p className="font-bold text-brand-blue">{formatCurrency(trabajo.total)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Saldo</p>
                        <p className={`font-bold ${trabajo.saldo > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(trabajo.saldo)}</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Notas de Producción</label>
                    <textarea className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 resize-none text-sm" rows={3} placeholder="Instrucciones para taller..."></textarea>
                </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-colors">Cerrar</button>
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
        <div className="fixed inset-0 bg-black z-[60] flex flex-col justify-center items-center">
            <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg h-auto rounded-lg mb-4" />
            <div className="flex gap-4">
                <button onClick={capture} className="px-8 py-4 bg-white rounded-full font-bold shadow-lg">Capturar</button>
                <button onClick={onClose} className="px-8 py-4 bg-gray-800 text-white rounded-full font-bold">Cancelar</button>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

type FilterTag = 'Todos' | 'Urgentes' | 'Diseño' | 'Impresión';

const KDSPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [filterTerm, setFilterTerm] = useState('');
    const [activeTag, setActiveTag] = useState<FilterTag>('Todos');
    const [draggedOverColumn, setDraggedOverColumn] = useState<TrabajoEstado | null>(null);
    
    // Modal States
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [cameraTarget, setCameraTarget] = useState<Trabajo | null>(null);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            const [t, c] = await Promise.all([getTrabajos(), getClientes()]);
            setTrabajos(t);
            setClientes(c);
        };
        load();
        const interval = setInterval(load, 30000); // Auto-refresh 30s
        return () => clearInterval(interval);
    }, []);

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
                filtered = filtered.filter(t => getUrgencyLevel(t.fechaVencimiento) !== 'safe');
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

        // Optimistic Update
        setTrabajos(prev => prev.map(t => t.id === id ? { ...t, estado: newStatus, actualizadoPor: currentUser.nombre } : t));
        
        // API Call
        await updateTrabajoStatus(id, newStatus, currentUser.nombre);
    };

    const handlePhotoSave = async (data: string) => {
        if (!cameraTarget) return;
        await updateTrabajoPhoto(cameraTarget.id, data);
        setTrabajos(prev => prev.map(t => t.id === cameraTarget.id ? { ...t, fotoOriginalUrl: data } : t));
        setCameraTarget(null);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900/50">
            {/* --- HEADER & FILTERS --- */}
            <div className="flex-shrink-0 p-4 sm:p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    
                    {/* Title & Search */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="text-brand-blue">KDS</span> Producción
                        </h1>
                        <div className="relative flex-grow sm:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                value={filterTerm}
                                onChange={e => setFilterTerm(e.target.value)}
                                placeholder="Buscar orden, cliente..." 
                                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-600 border focus:border-brand-blue rounded-lg transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Quick Filters (Tags) */}
                    <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 scrollbar-hide">
                        {(['Todos', 'Urgentes', 'Diseño', 'Impresión'] as FilterTag[]).map(tag => (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag)}
                                className={`
                                    px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all
                                    ${activeTag === tag 
                                        ? 'bg-brand-blue text-white shadow-md transform scale-105' 
                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50'}
                                `}
                            >
                                {tag === 'Urgentes' && '🔥 '}
                                {tag === 'Diseño' && '🎨 '}
                                {tag === 'Impresión' && '🖨️ '}
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- KANBAN BOARD --- */}
            <div className="flex-grow overflow-x-auto overflow-y-hidden p-4 sm:p-6">
                <div className="flex h-full gap-6 min-w-[1000px]">
                    {Object.keys(columns).map((status) => {
                        const colStatus = status as TrabajoEstado;
                        const isDragOver = draggedOverColumn === colStatus;
                        
                        return (
                            <div 
                                key={status}
                                className={`
                                    flex-1 min-w-[280px] flex flex-col rounded-2xl transition-colors duration-300
                                    ${isDragOver ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-brand-blue' : 'bg-gray-100 dark:bg-gray-800/50'}
                                `}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnter={() => setDraggedOverColumn(colStatus)}
                                onDrop={(e) => handleDrop(e, colStatus)}
                            >
                                {/* Column Header */}
                                <div className="p-4 flex justify-between items-center border-b border-gray-200/50 dark:border-gray-700/50">
                                    <h3 className="font-bold text-gray-700 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${
                                            status === 'Pendiente' ? 'bg-yellow-400' :
                                            status === 'En Diseño' ? 'bg-purple-400' :
                                            status === 'En Proceso' ? 'bg-blue-500' : 'bg-green-500'
                                        }`}></div>
                                        {status}
                                    </h3>
                                    <span className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-md text-xs font-bold text-gray-500 dark:text-gray-300 shadow-sm">
                                        {columns[status].length}
                                    </span>
                                </div>

                                {/* Cards Container */}
                                <div className="flex-grow overflow-y-auto p-3 custom-scrollbar">
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
                                        <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl m-2">
                                            <p className="text-gray-400 text-sm font-medium">Sin trabajos</p>
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
