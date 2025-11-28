import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { getTrabajos, getClientes, updateTrabajoStatus, updateTrabajoPhoto } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoEstado, User } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { DocumentIcon, CloseIcon, CameraIcon, ArrowUpIcon, ArrowDownIcon, ReceiptIcon, ClockIcon } from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';

interface KanbanCardProps {
  trabajo: Trabajo;
  cliente?: Cliente;
  isExpiringSoon: boolean;
  onCardDoubleClick: (trabajo: Trabajo) => void;
  onTakePhotoClick: (trabajo: Trabajo) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ trabajo, cliente, isExpiringSoon, onCardDoubleClick, onTakePhotoClick }) => {
    // A thick left border is used to highlight urgent jobs with a red color.
    // This provides a clear, modern visual indicator for status.
    const borderColor = isExpiringSoon ? 'border-brand-red' : 'border-brand-blue';

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData("trabajoId", trabajo.id);
            }}
            onDoubleClick={() => onCardDoubleClick(trabajo)}
            // The cursor is set to 'pointer' to indicate it's clickable, as requested.
            // Added animate-bounce-in for visual feedback when added or moved
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 cursor-pointer border-l-4 ${borderColor} transition-all duration-200 hover:shadow-xl hover:-translate-y-1 animate-bounce-in`}
        >
            <div className="flex justify-between items-start">
                <Link to={`/trabajos/${trabajo.id}`} className="font-bold text-lg text-gray-800 dark:text-white hover:text-brand-blue dark:hover:text-blue-400 transition-colors">
                    #{trabajo.orden}
                </Link>
                <DocumentIcon className="h-6 w-6 text-gray-400"/>
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mt-2 truncate">{trabajo.titular}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{trabajo.cantidad} x {trabajo.subtipo}</p>
            {cliente && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cliente.nombre}</p>}
            
            {trabajo.creadoPor && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Creado por: {trabajo.creadoPor}</p>}

            {/* The delivery date is displayed prominently on the card. */}
            {trabajo.fechaVencimiento && (
                <div className={`mt-2 flex items-center text-sm ${isExpiringSoon ? 'text-brand-red font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                    <ClockIcon className="h-4 w-4 mr-1.5" />
                    <span>Entrega: {formatDate(trabajo.fechaVencimiento)}</span>
                </div>
            )}

            <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm">
                 <div>
                    <span className="text-green-600 font-semibold">{formatCurrency(trabajo.total)}</span>
                    <span className="text-red-500 font-semibold ml-2">{formatCurrency(trabajo.saldo)}</span>
                </div>
                 <div className="flex items-center space-x-1">
                    {trabajo.estado === TrabajoEstado.ENTREGADO && (
                        <Link
                            to={`/nota-de-venta/${trabajo.id}`}
                            target="_blank"
                            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-600 transition-colors"
                            aria-label="Generar Nota de Venta"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ReceiptIcon className="h-5 w-5" />
                        </Link>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onTakePhotoClick(trabajo); }}
                        className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-blue transition-colors"
                        aria-label="Tomar foto del trabajo"
                    >
                        <CameraIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const isJobExpiringSoon = (trabajo: Trabajo): boolean => {
    if (!trabajo.fechaVencimiento) return false;
    const diff = new Date(trabajo.fechaVencimiento).getTime() - new Date().getTime();
    const daysLeft = diff / (1000 * 3600 * 24);
    return daysLeft < 15;
};

interface TrabajoDetalleModalProps {
    trabajo: Trabajo;
    cliente?: Cliente;
    onClose: () => void;
}

const TrabajoDetalleModal: React.FC<TrabajoDetalleModalProps> = ({ trabajo, cliente, onClose }) => {
    const [currentAbono, setCurrentAbono] = useState(trabajo.abono);

    const handleAbonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value <= trabajo.total && value >= 0) {
            setCurrentAbono(value);
        } else if (e.target.value === '') {
            setCurrentAbono(0);
        }
    }

    const handleSave = () => {
        // En una aplicación real, aquí se llamaría a la API para guardar los cambios.
        // Por ejemplo: await updateTrabajoDetails(trabajo.id, { abono: currentAbono, notas: ... });
        console.log(`Guardando nuevo abono: ${currentAbono} para el trabajo #${trabajo.orden}`);
        onClose();
    }

    const saldoActual = trabajo.total - currentAbono;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 id="modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                        Detalle del Trabajo #{trabajo.orden}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Cerrar modal">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div><span className="font-semibold text-gray-500 dark:text-gray-400">Cliente: </span>{cliente?.nombre}</div>
                        <div><span className="font-semibold text-gray-500 dark:text-gray-400">Titular: </span>{trabajo.titular}</div>
                        <div><span className="font-semibold text-gray-500 dark:text-gray-400">Producto: </span>{trabajo.subtipo}</div>
                        <div><span className="font-semibold text-gray-500 dark:text-gray-400">Cantidad: </span>{trabajo.cantidad}</div>
                        <div><span className="font-semibold text-gray-500 dark:text-gray-400">Fecha Entrada: </span>{formatDate(trabajo.fechaEntrada)}</div>
                         {trabajo.fechaVencimiento && (
                            <div>
                               <span className="font-semibold text-gray-500 dark:text-gray-400">Vencimiento SRI: </span>
                               <span className={isJobExpiringSoon(trabajo) ? 'text-red-500 font-bold' : ''}>
                                   {formatDate(trabajo.fechaVencimiento)}
                               </span>
                           </div>
                        )}
                        {trabajo.creadoPor && <div><span className="font-semibold text-gray-500 dark:text-gray-400">Creado por: </span>{trabajo.creadoPor}</div>}
                        {trabajo.actualizadoPor && <div><span className="font-semibold text-gray-500 dark:text-gray-400">Actualizado por: </span>{trabajo.actualizadoPor}</div>}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-4">
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold text-gray-800 dark:text-white">Total:</span>
                            <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(trabajo.total)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <label htmlFor="abono-modal" className="font-semibold text-gray-600 dark:text-gray-300">Abono:</label>
                            <input
                                id="abono-modal"
                                type="number"
                                value={currentAbono}
                                onChange={handleAbonoChange}
                                className="w-32 p-2 text-right font-semibold border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 focus:ring-brand-blue focus:border-brand-blue"
                            />
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                        <div className="flex justify-between items-center text-xl text-brand-red">
                            <span className="font-bold">Saldo Pendiente:</span>
                            <span className="font-extrabold">{formatCurrency(saldoActual)}</span>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="notas-modal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas Internas:</label>
                        <textarea
                            id="notas-modal"
                            rows={3}
                            placeholder="Añadir notas sobre el trabajo..."
                            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-brand-blue focus:border-brand-blue"
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-end items-center p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl mt-auto">
                    <button onClick={onClose} className="px-4 py-2 mr-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg shadow-md hover:bg-blue-800 transition-colors">
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

interface CameraModalProps {
    trabajo: Trabajo;
    onClose: () => void;
    onCapture: (photoDataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ trabajo, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mediaStream: MediaStream;
        const startCamera = async () => {
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("No se pudo acceder a la cámara. Verifique los permisos en su navegador.");
            }
        };

        startCamera();

        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/jpeg');
                onCapture(dataUrl);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Foto para Trabajo #{trabajo.orden}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {error ? (
                        <p className="text-center text-red-500">{error}</p>
                    ) : (
                        <div className="relative">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg bg-gray-900"></video>
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                    )}
                </div>

                <div className="flex justify-center p-5 border-t border-gray-200 dark:border-gray-700">
                    {!error && (
                         <button onClick={handleCapture} className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-lg shadow-md hover:bg-blue-800 transition-colors">
                            <CameraIcon className="w-6 h-6"/>
                            <span>Capturar Foto</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const KDSPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const [trabajos, setTrabajos] = useState<Record<TrabajoEstado, Trabajo[]>>({
        [TrabajoEstado.PENDIENTE]: [],
        [TrabajoEstado.PROCESO]: [],
        [TrabajoEstado.VITRINA]: [],
        [TrabajoEstado.ENTREGADO]: [],
    });
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [trabajoForPhoto, setTrabajoForPhoto] = useState<Trabajo | null>(null);
    const [filterTerm, setFilterTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<TrabajoEstado | 'Todos'>('Todos');
    const [sortConfig, setSortConfig] = useState<{ key: 'fechaEntrada' | 'fechaVencimiento'; direction: 'asc' | 'desc' }>({
        key: 'fechaEntrada',
        direction: 'asc',
    });
    const [draggedOverColumn, setDraggedOverColumn] = useState<TrabajoEstado | null>(null);
    const [vitrinaCurrentPage, setVitrinaCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        const fetchData = async () => {
            const [trabajosData, clientesData] = await Promise.all([getTrabajos(), getClientes()]);
            setClientes(clientesData);
            const groupedTrabajos = trabajosData.reduce((acc, trabajo) => {
                (acc[trabajo.estado] = acc[trabajo.estado] || []).push(trabajo);
                return acc;
            }, {} as Record<TrabajoEstado, Trabajo[]>);

            const initialColumns = KANBAN_COLUMNS.reduce((acc, col) => {
                acc[col] = groupedTrabajos[col] || [];
                return acc;
            }, {} as Record<TrabajoEstado, Trabajo[]>);

            setTrabajos(initialColumns);
        };
        fetchData();
    }, []);

    useEffect(() => {
        setVitrinaCurrentPage(1);
    }, [filterTerm, statusFilter]);
    
    const getClientById = (id: string) => clientes.find(c => c.id === id);
    
    const handleSort = (key: 'fechaEntrada' | 'fechaVencimiento') => {
        setSortConfig(prevConfig => {
            if (prevConfig.key === key) {
                return { key, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const processedTrabajos = useMemo(() => {
        const newProcessedTrabajos: Record<TrabajoEstado, Trabajo[]> = {
            [TrabajoEstado.PENDIENTE]: [],
            [TrabajoEstado.PROCESO]: [],
            [TrabajoEstado.VITRINA]: [],
            [TrabajoEstado.ENTREGADO]: [],
        };
        const lowercasedFilter = filterTerm.toLowerCase();
    
        for (const status of KANBAN_COLUMNS) {
            let columnTrabajos = [...(trabajos[status] || [])];

            if (lowercasedFilter) {
                columnTrabajos = columnTrabajos.filter(trabajo => {
                    const cliente = getClientById(trabajo.clienteId);
                    const matchesCliente = cliente?.nombre.toLowerCase().includes(lowercasedFilter);
                    const matchesSubtipo = trabajo.subtipo.toLowerCase().includes(lowercasedFilter);
                    const matchesOrden = String(trabajo.orden).includes(lowercasedFilter);
                    return matchesCliente || matchesSubtipo || matchesOrden;
                });
            }

            columnTrabajos.sort((a, b) => {
                let valA, valB;
    
                if (sortConfig.key === 'fechaVencimiento') {
                    if (!a.fechaVencimiento && !b.fechaVencimiento) return 0;
                    if (!a.fechaVencimiento) return 1;
                    if (!b.fechaVencimiento) return -1;
                    valA = new Date(a.fechaVencimiento).getTime();
                    valB = new Date(b.fechaVencimiento).getTime();
                } else {
                    valA = new Date(a.fechaEntrada).getTime();
                    valB = new Date(b.fechaEntrada).getTime();
                }
    
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            });
            newProcessedTrabajos[status] = columnTrabajos;
        }
        return newProcessedTrabajos;
    }, [trabajos, sortConfig, filterTerm, clientes]);

    const vitrinaJobs = processedTrabajos[TrabajoEstado.VITRINA] || [];
    const totalVitrinaPages = Math.ceil(vitrinaJobs.length / ITEMS_PER_PAGE);
    const paginatedVitrinaJobs = vitrinaJobs.slice(
        (vitrinaCurrentPage - 1) * ITEMS_PER_PAGE,
        vitrinaCurrentPage * ITEMS_PER_PAGE
    );

    const handleOpenModal = (trabajo: Trabajo) => {
        setSelectedTrabajo(trabajo);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTrabajo(null);
    };

    const handleTakePhotoClick = (trabajo: Trabajo) => {
        setTrabajoForPhoto(trabajo);
    };

    const handleCloseCameraModal = () => {
        setTrabajoForPhoto(null);
    };

    const handleCapturePhoto = async (photoDataUrl: string) => {
        if (!trabajoForPhoto) return;

        try {
            const updatedTrabajo = await updateTrabajoPhoto(trabajoForPhoto.id, photoDataUrl);
            const updatedTrabajos = { ...trabajos };
            const status = updatedTrabajo.estado;
            const index = updatedTrabajos[status].findIndex(t => t.id === updatedTrabajo.id);
            if (index > -1) {
                updatedTrabajos[status][index] = updatedTrabajo;
                setTrabajos(updatedTrabajos);
            }
        } catch (error) {
            console.error("Error saving photo:", error);
        } finally {
            handleCloseCameraModal();
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: TrabajoEstado) => {
        e.preventDefault();
        setDraggedOverColumn(null);
        const trabajoId = e.dataTransfer.getData("trabajoId");
        if (!trabajoId) return;

        let originalTrabajo: Trabajo | null = null;
        let oldStatus: TrabajoEstado | null = null;
        
        for (const status of KANBAN_COLUMNS) {
            const foundTrabajo = trabajos[status]?.find(t => t.id === trabajoId);
            if (foundTrabajo) {
                originalTrabajo = foundTrabajo;
                oldStatus = status;
                break;
            }
        }
        
        if (!originalTrabajo || !oldStatus || oldStatus === newStatus) {
            return;
        }

        const previousTrabajosState = trabajos;

        const newTrabajosState = {
            ...previousTrabajosState,
            [oldStatus]: previousTrabajosState[oldStatus].filter(t => t.id !== trabajoId),
            [newStatus]: [...previousTrabajosState[newStatus], { ...originalTrabajo, estado: newStatus, actualizadoPor: currentUser.nombre }]
        };
        setTrabajos(newTrabajosState);
        
        try {
            await updateTrabajoStatus(trabajoId, newStatus, currentUser.nombre);
        } catch (error) {
            console.error("Failed to update status, reverting change:", error);
            setTrabajos(previousTrabajosState); 
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, status: TrabajoEstado) => {
        e.preventDefault();
        setDraggedOverColumn(status);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDraggedOverColumn(null);
    };

    const displayedColumns = statusFilter === 'Todos'
        ? KANBAN_COLUMNS
        : KANBAN_COLUMNS.filter(col => col === statusFilter);


    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex flex-wrap items-center justify-between mb-4 px-1 gap-4">
                <div className="flex-grow min-w-[250px] flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por cliente, producto u orden..."
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                        className="w-full px-4 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-brand-blue focus:border-brand-blue"
                    />
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as TrabajoEstado | 'Todos')}
                            className="appearance-none w-full sm:w-48 px-4 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-brand-blue focus:border-brand-blue"
                        >
                            <option value="Todos">Todos los Estados</option>
                            {KANBAN_COLUMNS.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 hidden sm:inline">Ordenar:</span>
                    <button
                        onClick={() => handleSort('fechaEntrada')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                            sortConfig.key === 'fechaEntrada'
                                ? 'bg-brand-blue text-white shadow'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                    >
                        <span>Entrada</span>
                        {sortConfig.key === 'fechaEntrada' && (
                            sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                        )}
                    </button>
                    <button
                        onClick={() => handleSort('fechaVencimiento')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                            sortConfig.key === 'fechaVencimiento'
                                ? 'bg-brand-blue text-white shadow'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                    >
                        <span>Vencimiento</span>
                        {sortConfig.key === 'fechaVencimiento' && (
                            sortConfig.direction === 'asc' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-x-auto">
                <div className="flex space-x-4 min-w-max h-full pb-4">
                    {displayedColumns.map((status) => {
                        const isVitrina = status === TrabajoEstado.VITRINA;
                        const jobsToDisplay = isVitrina ? paginatedVitrinaJobs : processedTrabajos[status];
                        
                        return (
                            <div
                                key={status}
                                className={`w-80 rounded-lg flex flex-col transition-colors duration-200 ${
                                    draggedOverColumn === status
                                        ? 'bg-blue-100 dark:bg-blue-900/50'
                                        : 'bg-gray-100 dark:bg-gray-900'
                                }`}
                                onDrop={(e) => handleDrop(e, status)}
                                onDragOver={handleDragOver}
                                onDragEnter={(e) => handleDragEnter(e, status)}
                                onDragLeave={handleDragLeave}
                            >
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="font-bold text-lg text-gray-800 dark:text-white flex items-center">
                                        {status}
                                        <span className="ml-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">
                                            {processedTrabajos[status]?.length || 0}
                                        </span>
                                    </h2>
                                </div>
                                <div className="p-2 flex-1 overflow-y-auto">
                                    {jobsToDisplay?.map((trabajo) => (
                                        <KanbanCard
                                            key={trabajo.id}
                                            trabajo={trabajo}
                                            cliente={getClientById(trabajo.clienteId)}
                                            isExpiringSoon={isJobExpiringSoon(trabajo)}
                                            onCardDoubleClick={handleOpenModal}
                                            onTakePhotoClick={handleTakePhotoClick}
                                        />
                                    ))}
                                </div>
                                {isVitrina && totalVitrinaPages > 1 && (
                                    <div className="p-2 mt-auto border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                        <button
                                            onClick={() => setVitrinaCurrentPage(p => Math.max(p - 1, 1))}
                                            disabled={vitrinaCurrentPage === 1}
                                            className="px-3 py-1 rounded-md bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Anterior
                                        </button>
                                        <span>
                                            Página {vitrinaCurrentPage} de {totalVitrinaPages}
                                        </span>
                                        <button
                                            onClick={() => setVitrinaCurrentPage(p => Math.min(p + 1, totalVitrinaPages))}
                                            disabled={vitrinaCurrentPage >= totalVitrinaPages}
                                            className="px-3 py-1 rounded-md bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            {isModalOpen && selectedTrabajo && (
                <TrabajoDetalleModal 
                    trabajo={selectedTrabajo}
                    cliente={getClientById(selectedTrabajo.clienteId)}
                    onClose={handleCloseModal}
                />
            )}
            {trabajoForPhoto && (
                <CameraModal
                    trabajo={trabajoForPhoto}
                    onClose={handleCloseCameraModal}
                    onCapture={handleCapturePhoto}
                />
            )}
        </div>
    );
};

export default KDSPage;