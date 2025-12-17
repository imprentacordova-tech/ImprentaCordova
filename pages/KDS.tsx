
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { getTrabajos, getClientes, updateTrabajoStatus, updateTrabajoPhoto } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoEstado, User } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { DocumentIcon, CloseIcon, CameraIcon, ReceiptIcon, ClockIcon, PhotoIcon, SearchIcon, MenuIcon } from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';
import { useToast } from '../contexts/ToastContext';
import QRScannerModal from '../components/QRScannerModal';

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
    critical: { border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600', label: 'Urgente' },
    warning: { border: 'border-l-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600', label: 'Próximo' },
    safe: { border: 'border-l-green-500', bg: 'bg-white dark:bg-gray-800', text: 'text-gray-500', label: 'A tiempo' },
};

// --- COMPONENTS ---

interface KanbanCardProps {
  trabajo: Trabajo;
  cliente?: Cliente;
  onCardClick: (trabajo: Trabajo) => void;
  onTakePhotoClick: (trabajo: Trabajo) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ trabajo, cliente, onCardClick, onTakePhotoClick }) => {
    const targetDate = trabajo.fechaEntrega || trabajo.fechaVencimiento;
    const urgency = getUrgencyLevel(targetDate);
    const style = urgencyConfig[urgency];
    
    // Calculate progress if dates exist
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
            onClick={() => onCardClick(trabajo)}
            className={`
                relative group bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-3 cursor-grab active:cursor-grabbing 
                border-l-4 ${style.border} border-t border-r border-b border-gray-100 dark:border-gray-700
                transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 hover:border-gray-300 dark:hover:border-gray-600
                overflow-hidden select-none touch-manipulation
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
                            {targetDate && (
                                <span className={`flex items-center gap-1 ${style.text}`}>
                                    <ClockIcon className="w-3 h-3" />
                                    {formatDate(targetDate)}
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
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {trabajo.estado === TrabajoEstado.ENTREGADO ? (
                            <Link to={`/nota-de-venta/${trabajo.id}`} target="_blank" className="p-1.5 hover:bg-green-100 rounded-full text-green-600 transition-colors" title="Ver Nota" onClick={e => e.stopPropagation()}>
                                <ReceiptIcon className="w-4 h-4" />
                            </Link>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); onTakePhotoClick(trabajo); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors" title="Adjuntar Foto">
                                <CameraIcon className="w-4 h-4" />
                            </button>
                        )}
                        <button className="md:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400">
                            <MenuIcon className="w-4 h-4" />
                        </button>
                    </div>
                    
                    {/* Financial Status */}
                    <div className="text-right">
                        {trabajo.saldo > 0 ? (
                            <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                                Pend: {formatCurrency(trabajo.saldo)}
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ReceiptIcon className="w-3 h-3" /> Pagado
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Progress Bar (Visual Indicator of Time Elapsed) */}
            {targetDate && (
                <div className="absolute bottom-0 left-0 h-1 bg-gray-100 dark:bg-gray-700 w-full">
                    <div 
                        className={`h-full ${urgency === 'critical' ? 'bg-red-500' : urgency === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} 
                        style={{ width: `${getProgress()}%` }}
                    ></div>
                </div>
            )}
        </div>
    );
};

// --- MODALS ---

const TrabajoDetalleModal: React.FC<{ trabajo: Trabajo; cliente?: Cliente; onClose: () => void; onStatusChange: (status: TrabajoEstado) => void }> = ({ trabajo, cliente, onClose, onStatusChange }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Orden #{trabajo.orden}</h2>
                <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500"/></button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xl shadow-lg">
                        {cliente?.nombre.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg dark:text-white">{cliente?.nombre}</h3>
                        <p className="text-gray-500 text-sm">{cliente?.ruc || cliente?.cedula}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                    <div className="col-span-2">
                        <p className="text-xs text-gray-500 uppercase font-bold">Producto</p>
                        <p className="font-medium dark:text-gray-200">{trabajo.subtipo}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Cantidad</p>
                        <p className="font-medium dark:text-gray-200">{trabajo.cantidad}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Estado</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {trabajo.estado}
                        </span>
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
                
                {/* Mobile Quick Moves */}
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Mover a:</p>
                    <div className="grid grid-cols-2 gap-2">
                        {KANBAN_COLUMNS.filter(c => c !== TrabajoEstado.ENTREGADO && c !== trabajo.estado).map(status => (
                            <button
                                key={status}
                                onClick={() => onStatusChange(status)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-brand-blue hover:text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Notas de Producción</label>
                    <textarea className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 resize-none text-sm dark:text-white" rows={3} placeholder="Instrucciones para taller..."></textarea>
                </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                <Link to={`/nota-de-venta/${trabajo.id}`} target="_blank" className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                    <DocumentIcon className="w-4 h-4"/> Nota
                </Link>
                <button onClick={onClose} className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-colors">Cerrar</button>
            </div>
        </div>
    </div>
);

const CameraModal: React.FC<{ trabajo: Trabajo; onClose: () => void; onCapture: (data: string) => void }> = ({ trabajo, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(() => {
        let currentStream: MediaStream | null = null;
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(s => {
            currentStream = s;
            if (videoRef.current) videoRef.current.srcObject = s;
        }).catch(console.error);
        
        return () => { 
            if (currentStream) {
                currentStream.getTracks().forEach(t => t.stop()); 
            }
        };
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
        <div className="fixed inset-0 bg-black z-[60] flex flex-col justify-center items-center p-4">
            <div className="relative w-full max-w-lg aspect-[3/4] bg-black rounded-2xl overflow-hidden mb-6 shadow-2xl">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-6">
                <button onClick={onClose} className="w-16 h-16 rounded-full bg-gray-800 text-white flex items-center justify-center border border-gray-700">
                    <CloseIcon className="w-8 h-8" />
                </button>
                <button onClick={capture} className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg active:scale-95 transition-transform flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full border-2 border-black"></div>
                </button>
            </div>
            <p className="text-white mt-4 text-sm opacity-70">Tomar foto de prueba de {trabajo.subtipo}</p>
        </div>
    );
};

// --- MAIN PAGE ---

type FilterTag = 'Todos' | 'Urgentes' | 'Diseño' | 'Impresión';

const KDSPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { addToast } = useToast();
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [filterTerm, setFilterTerm] = useState('');
    const [activeTag, setActiveTag] = useState<FilterTag>('Todos');
    const [draggedOverColumn, setDraggedOverColumn] = useState<TrabajoEstado | null>(null);
    
    // Modal States
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [cameraTarget, setCameraTarget] = useState<Trabajo | null>(null);
    const [showScanner, setShowScanner] = useState(false);

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

    // Update Helpers
    const updateJobStatus = async (id: string, newStatus: TrabajoEstado) => {
        // Optimistic Update
        setTrabajos(prev => prev.map(t => t.id === id ? { ...t, estado: newStatus, actualizadoPor: currentUser.nombre } : t));
        addToast(`Trabajo movido a ${newStatus}`, 'success');
        
        // API Call
        try {
            await updateTrabajoStatus(id, newStatus, currentUser.nombre);
        } catch (error) {
            addToast('Error al actualizar estado', 'error');
            // Revert changes could happen here if real API fails
        }
    };

    // Drag & Drop Handlers
    const handleDrop = async (e: React.DragEvent, newStatus: TrabajoEstado) => {
        e.preventDefault();
        setDraggedOverColumn(null);
        const id = e.dataTransfer.getData("trabajoId");
        if (!id) return;
        updateJobStatus(id, newStatus);
    };

    const handlePhotoSave = async (data: string) => {
        if (!cameraTarget) return;
        await updateTrabajoPhoto(cameraTarget.id, data);
        setTrabajos(prev => prev.map(t => t.id === cameraTarget.id ? { ...t, fotoOriginalUrl: data } : t));
        setCameraTarget(null);
        addToast('Foto adjuntada correctamente', 'success');
    };

    const handleScanResult = (decodedText: string) => {
        // Extract ID from URL if valid URL, otherwise check if text matches an ID or Order #
        let idToSearch = decodedText;
        try {
            const url = new URL(decodedText);
            const idParam = url.searchParams.get('id') || url.hash.split('?id=')[1];
            if (idParam) idToSearch = idParam;
        } catch (e) {
            // Not a URL, assume direct ID/Order#
        }

        const foundJob = trabajos.find(t => t.id === idToSearch || String(t.orden) === idToSearch);
        
        if (foundJob) {
            setSelectedTrabajo(foundJob);
            addToast(`Orden #${foundJob.orden} encontrada`, 'success');
        } else {
            addToast('Trabajo no encontrado', 'error');
        }
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
                        <button 
                            onClick={() => setShowScanner(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-200 transition-colors"
                        >
                            <div className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm">
                                <div className="w-2 h-2 bg-current rounded-full"></div>
                            </div>
                            Escanear QR
                        </button>
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
                                            onCardClick={setSelectedTrabajo}
                                            onTakePhotoClick={setCameraTarget}
                                        />
                                    ))}
                                    {columns[status].length === 0 && (
                                        <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl m-2 opacity-50 hover:opacity-100 transition-opacity">
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
                    onStatusChange={(status) => {
                        updateJobStatus(selectedTrabajo.id, status);
                        setSelectedTrabajo(null);
                    }} 
                />
            )}
            {cameraTarget && (
                <CameraModal 
                    trabajo={cameraTarget} 
                    onClose={() => setCameraTarget(null)} 
                    onCapture={handlePhotoSave} 
                />
            )}
            {showScanner && (
                <QRScannerModal 
                    onClose={() => setShowScanner(false)} 
                    onScan={handleScanResult} 
                    title="Escanear Hoja de Ruta"
                />
            )}
        </div>
    );
};

export default KDSPage;
