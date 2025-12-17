
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { updateTrabajoStatus, updateTrabajoPhoto } from '../services/mockApi';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo, TrabajoEstado, User } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { DocumentIcon, CloseIcon, CameraIcon, ReceiptIcon, ClockIcon, PhotoIcon, SearchIcon, MenuIcon, CheckCircleIcon } from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';
import { useToast } from '../contexts/ToastContext';
import QRScannerModal from '../components/QRScannerModal';

// --- HELPERS ---

type UrgencyLevel = 'critical' | 'warning' | 'safe';

const getUrgencyLevel = (dateStr?: string): UrgencyLevel => {
    if (!dateStr) return 'safe';
    const now = new Date().getTime();
    const target = new Date(dateStr).getTime();
    const diffHours = (target - now) / (1000 * 3600);

    if (diffHours < 24) return 'critical';
    if (diffHours < 72) return 'warning';
    return 'safe';
};

const urgencyConfig = {
    critical: { color: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-500', shadow: 'shadow-rose-500/20' },
    warning: { color: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500', shadow: 'shadow-amber-500/20' },
    safe: { color: 'bg-emerald-500', text: 'text-slate-500', border: 'border-emerald-500', shadow: 'shadow-emerald-500/20' },
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
    
    // Calculate progress visually
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
                e.currentTarget.classList.add('opacity-50', 'scale-95', 'rotate-2');
            }}
            onDragEnd={(e) => {
                e.currentTarget.classList.remove('opacity-50', 'scale-95', 'rotate-2');
            }}
            onClick={() => onCardClick(trabajo)}
            className={`
                relative group bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-4 cursor-grab active:cursor-grabbing 
                border border-gray-100 dark:border-gray-700
                transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 hover:z-10
                overflow-hidden select-none touch-manipulation
            `}
        >
            {/* Urgency Indicator Bar (Top) */}
            <div className={`h-1 w-full ${urgency === 'critical' ? 'bg-rose-500 animate-pulse' : urgency === 'warning' ? 'bg-amber-500' : 'bg-transparent'}`}></div>

            <div className="p-5">
                {/* Header: ID & Actions */}
                <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded-md tracking-wider">
                        #{String(trabajo.orden).padStart(4, '0')}
                    </span>
                    
                    {/* Hover Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                         {trabajo.estado !== TrabajoEstado.ENTREGADO && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onTakePhotoClick(trabajo); }} 
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-brand-blue transition-colors"
                                title="Adjuntar Foto"
                            >
                                <CameraIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex gap-4">
                    <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-1 truncate">
                            {cliente?.nombre || 'Cliente Desconocido'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                            {trabajo.subtipo}
                        </p>
                        
                        <div className="flex items-center flex-wrap gap-2">
                            <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-brand-blue px-2.5 py-1 rounded-lg">
                                {trabajo.cantidad} uds
                            </span>
                            {targetDate && (
                                <span className={`flex items-center gap-1 text-xs font-medium ${style.text} bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded-lg`}>
                                    <ClockIcon className="w-3 h-3" />
                                    {new Date(targetDate).toLocaleDateString('es-EC', {day: '2-digit', month: 'short'})}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Thumbnail Preview */}
                    {trabajo.fotoOriginalUrl && (
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 relative group/img">
                            <img 
                                src={trabajo.fotoOriginalUrl} 
                                alt="Referencia" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" 
                            />
                        </div>
                    )}
                </div>

                {/* Footer: Financial & Progress */}
                <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/50 flex justify-between items-center">
                    <div>
                        {trabajo.saldo > 0 ? (
                            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                                Pendiente: {formatCurrency(trabajo.saldo)}
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3" /> Pagado
                            </span>
                        )}
                    </div>
                    
                    {/* Mini Progress Bar */}
                    {targetDate && (
                        <div className="w-16 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${style.color} transition-all duration-1000`} 
                                style={{ width: `${getProgress()}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MODALS ---

const TrabajoDetalleModal: React.FC<{ trabajo: Trabajo; cliente?: Cliente; onClose: () => void; onStatusChange: (status: TrabajoEstado) => void }> = ({ trabajo, cliente, onClose, onStatusChange }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex justify-end animate-fade-in" onClick={onClose}>
        {/* Slide-over Panel */}
        <div 
            className="w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-2xl overflow-y-auto flex flex-col animate-slide-in-right" 
            onClick={e => e.stopPropagation()}
        >
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex justify-between items-start sticky top-0 z-10 shadow-md">
                <div>
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-widest bg-white/10 px-2 py-1 rounded">Orden #{trabajo.orden}</span>
                    <h2 className="text-2xl font-black mt-3 leading-tight">{cliente?.nombre}</h2>
                    <p className="text-sm text-slate-400 mt-1">{cliente?.ruc || cliente?.cedula}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                    <CloseIcon className="w-5 h-5 text-white"/>
                </button>
            </div>

            <div className="p-6 space-y-8 flex-grow">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Trabajo</p>
                        <p className="font-bold text-gray-800 dark:text-white text-lg">{trabajo.subtipo}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Cantidad</p>
                        <p className="font-bold text-gray-800 dark:text-white text-lg">{trabajo.cantidad}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Saldo</p>
                        <p className={`font-bold text-lg ${trabajo.saldo > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {formatCurrency(trabajo.saldo)}
                        </p>
                    </div>
                </div>

                {/* Workflow Actions */}
                <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                        Flujo de Trabajo
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {KANBAN_COLUMNS.filter(c => c !== TrabajoEstado.ENTREGADO).map(status => (
                            <button
                                key={status}
                                onClick={() => onStatusChange(status)}
                                disabled={status === trabajo.estado}
                                className={`
                                    w-full py-3 px-4 rounded-xl font-bold text-sm text-left flex items-center justify-between transition-all
                                    ${status === trabajo.estado 
                                        ? 'bg-brand-blue text-white ring-2 ring-brand-blue ring-offset-2 dark:ring-offset-gray-800' 
                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-brand-blue hover:text-brand-blue'}
                                `}
                            >
                                <span>{status}</span>
                                {status === trabajo.estado && <CheckCircleIcon className="w-5 h-5"/>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                        Notas de Producción
                    </h3>
                    <textarea 
                        className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-brand-blue outline-none resize-none" 
                        rows={4} 
                        placeholder="Instrucciones especiales para el taller..."
                    ></textarea>
                </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky bottom-0">
                <Link to={`/nota-de-venta/${trabajo.id}`} target="_blank" className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 font-black uppercase tracking-wider rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 shadow-sm">
                    <DocumentIcon className="w-5 h-5"/> Ver Hoja de Ruta
                </Link>
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
        <div className="fixed inset-0 bg-black z-[70] flex flex-col justify-center items-center p-4">
            <div className="relative w-full max-w-lg aspect-[3/4] bg-gray-900 rounded-3xl overflow-hidden mb-8 shadow-2xl border border-gray-800">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-[3px] border-white/20 m-8 rounded-2xl pointer-events-none"></div>
            </div>
            <div className="flex gap-8 items-center">
                <button onClick={onClose} className="w-14 h-14 rounded-full bg-gray-800 text-white flex items-center justify-center border border-gray-700 hover:bg-gray-700 transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <button onClick={capture} className="w-24 h-24 bg-white rounded-full border-4 border-gray-300 shadow-xl active:scale-90 transition-transform flex items-center justify-center">
                    <div className="w-20 h-20 bg-white rounded-full border-2 border-black"></div>
                </button>
            </div>
            <p className="text-gray-400 mt-6 text-sm font-medium tracking-wide">Adjuntando foto a: {trabajo.subtipo}</p>
        </div>
    );
};

// --- MAIN PAGE ---

type FilterTag = 'Todos' | 'Urgentes' | 'Diseño' | 'Impresión';

const KDSPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, updateTrabajoStatus: updateStatus } = useData(); 
    const { addToast } = useToast();
    
    const [filterTerm, setFilterTerm] = useState('');
    const [activeTag, setActiveTag] = useState<FilterTag>('Todos');
    const [draggedOverColumn, setDraggedOverColumn] = useState<TrabajoEstado | null>(null);
    
    // Modal States
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [cameraTarget, setCameraTarget] = useState<Trabajo | null>(null);
    const [showScanner, setShowScanner] = useState(false);

    // Filter Logic
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

    const columns = useMemo(() => {
        const cols: Record<string, Trabajo[]> = {};
        KANBAN_COLUMNS.forEach(col => {
            if (col !== TrabajoEstado.ENTREGADO) { 
                cols[col] = filteredTrabajos.filter(t => t.estado === col);
            }
        });
        return cols;
    }, [filteredTrabajos]);

    const handleUpdateJobStatus = async (id: string, newStatus: TrabajoEstado) => {
        await updateStatus(id, newStatus, currentUser.nombre);
        addToast(`Orden movida a ${newStatus}`, 'success');
    };

    const handleDrop = async (e: React.DragEvent, newStatus: TrabajoEstado) => {
        e.preventDefault();
        setDraggedOverColumn(null);
        const id = e.dataTransfer.getData("trabajoId");
        if (!id) return;
        handleUpdateJobStatus(id, newStatus);
    };

    const handlePhotoSave = async (data: string) => {
        if (!cameraTarget) return;
        await updateTrabajoPhoto(cameraTarget.id, data);
        setCameraTarget(null);
        addToast('Foto de prueba guardada', 'success');
    };

    const handleScanResult = (decodedText: string) => {
        let idToSearch = decodedText;
        try {
            const url = new URL(decodedText);
            const idParam = url.searchParams.get('id') || url.hash.split('?id=')[1];
            if (idParam) idToSearch = idParam;
        } catch (e) {}

        const foundJob = trabajos.find(t => t.id === idToSearch || String(t.orden) === idToSearch);
        
        if (foundJob) {
            setSelectedTrabajo(foundJob);
            addToast(`Orden #${foundJob.orden} cargada`, 'success');
        } else {
            addToast('Código QR no reconocido en el sistema', 'error');
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-gray-100 dark:bg-gray-900 font-sans">
            {/* --- HEADER --- */}
            <div className="flex-shrink-0 px-6 py-5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 flex flex-col xl:flex-row justify-between items-center gap-4 shadow-sm">
                
                <div className="flex items-center gap-6 w-full xl:w-auto">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="text-brand-blue">KDS</span> CONTROL
                    </h1>
                    
                    {/* Search Pill */}
                    <div className="relative flex-grow max-w-md group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
                        <input 
                            type="text" 
                            value={filterTerm}
                            onChange={e => setFilterTerm(e.target.value)}
                            placeholder="Buscar orden, cliente..." 
                            className="w-full pl-12 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-600 border focus:border-brand-blue rounded-full transition-all text-sm font-medium shadow-inner focus:shadow-lg"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto scrollbar-hide pb-1 xl:pb-0">
                    <button 
                        onClick={() => setShowScanner(true)}
                        className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        <div className="w-5 h-5 flex items-center justify-center border-2 border-white/30 rounded-sm">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        Escanear
                    </button>
                    
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

                    {(['Todos', 'Urgentes', 'Diseño', 'Impresión'] as FilterTag[]).map(tag => (
                        <button
                            key={tag}
                            onClick={() => setActiveTag(tag)}
                            className={`
                                px-5 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap
                                ${activeTag === tag 
                                    ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/30 scale-105' 
                                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-50'}
                            `}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- BOARD --- */}
            <div className="flex-grow overflow-x-auto overflow-y-hidden p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                <div className="flex h-full gap-6 min-w-[1200px]">
                    {Object.keys(columns).map((status) => {
                        const colStatus = status as TrabajoEstado;
                        const isDragOver = draggedOverColumn === colStatus;
                        
                        return (
                            <div 
                                key={status}
                                className={`
                                    flex-1 min-w-[300px] flex flex-col rounded-3xl transition-all duration-300
                                    ${isDragOver ? 'bg-blue-50/80 ring-4 ring-brand-blue/30 scale-[1.02]' : 'bg-gray-100/80 dark:bg-gray-900/50 backdrop-blur-sm border border-white/50 dark:border-gray-700'}
                                `}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnter={() => setDraggedOverColumn(colStatus)}
                                onDrop={(e) => handleDrop(e, colStatus)}
                            >
                                {/* Column Header */}
                                <div className="p-5 flex justify-between items-center">
                                    <h3 className="font-black text-gray-700 dark:text-white uppercase tracking-wider text-sm flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full shadow-sm ${
                                            status === 'Pendiente' ? 'bg-yellow-400' :
                                            status === 'En Diseño' ? 'bg-purple-400' :
                                            status === 'En Proceso' ? 'bg-blue-500' : 'bg-emerald-500'
                                        }`}></div>
                                        {status}
                                    </h3>
                                    <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-black text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700">
                                        {columns[status].length}
                                    </span>
                                </div>

                                {/* Cards Container */}
                                <div className="flex-grow overflow-y-auto px-4 pb-4 custom-scrollbar space-y-4">
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
                                        <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300/50 rounded-2xl opacity-50">
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Sin tareas</p>
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
                        handleUpdateJobStatus(selectedTrabajo.id, status);
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
