
import React, { useState, useEffect } from 'react';
import { getTrabajos, getClientes, updateTrabajoStatus } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { PaletteIcon, MonitorIcon, ClockIcon, CheckCircleIcon, ArrowRightIcon, EyeIcon, UploadIcon } from '../components/Icons';
import { useOutletContext } from 'react-router-dom';
import { User } from '../types';

const DisenoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [selectedJob, setSelectedJob] = useState<Trabajo | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const [jobsData, clientsData] = await Promise.all([getTrabajos(), getClientes()]);
        setTrabajos(jobsData);
        setClientes(clientsData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const pendingJobs = trabajos.filter(t => 
        t.estado === TrabajoEstado.PENDIENTE || 
        t.estado === TrabajoEstado.EN_DISENO
    ).sort((a, b) => new Date(a.fechaEntrada).getTime() - new Date(b.fechaEntrada).getTime());

    const getClientName = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Desconocido';

    const handleStatusChange = async (newStatus: TrabajoEstado) => {
        if (!selectedJob) return;
        await updateTrabajoStatus(selectedJob.id, newStatus, currentUser.nombre);
        
        // Optimistic UI update
        const updatedJob = { ...selectedJob, estado: newStatus, actualizadoPor: currentUser.nombre };
        setTrabajos(prev => prev.map(t => t.id === selectedJob.id ? updatedJob : t));
        setSelectedJob(updatedJob);
        
        if (newStatus === TrabajoEstado.PROCESO) {
            setSelectedJob(null); // Clear selection if moved to Production
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = status === TrabajoEstado.EN_DISENO 
            ? "bg-purple-100 text-purple-800 border-purple-200" 
            : "bg-yellow-100 text-yellow-800 border-yellow-200";
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${colors}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden">
            {/* Left Panel: Request Queue */}
            <div className="w-1/3 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="font-bold text-gray-700 dark:text-white flex items-center gap-2">
                        <PaletteIcon className="w-5 h-5 text-brand-blue" />
                        Cola de Diseño
                    </h2>
                    <span className="bg-brand-blue text-white text-xs font-bold px-2 py-1 rounded-full">{pendingJobs.length}</span>
                </div>
                
                <div className="flex-grow overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <p className="text-center p-4 text-gray-500">Cargando...</p>
                    ) : pendingJobs.length === 0 ? (
                        <div className="text-center p-8 text-gray-400">
                            <MonitorIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>No hay solicitudes pendientes.</p>
                        </div>
                    ) : (
                        pendingJobs.map(job => (
                            <div 
                                key={job.id} 
                                onClick={() => setSelectedJob(job)}
                                className={`p-4 rounded-xl cursor-pointer border transition-all hover:shadow-md ${
                                    selectedJob?.id === job.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-brand-blue ring-1 ring-brand-blue' 
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-800 dark:text-gray-200">#{job.orden}</span>
                                    <StatusBadge status={job.estado} />
                                </div>
                                <h3 className="font-semibold text-brand-blue truncate">{getClientName(job.clienteId)}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{job.subtipo}</p>
                                <div className="mt-2 flex justify-between items-center text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3"/> {formatDate(job.fechaEntrada)}</span>
                                    {job.prioridad && <span className="text-red-500 font-bold">URGENTE</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Workspace */}
            <div className="w-2/3 flex flex-col bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-inner overflow-hidden relative">
                {selectedJob ? (
                    <>
                        {/* Header */}
                        <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start shadow-sm z-10">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                                    Orden #{selectedJob.orden} <span className="text-gray-400 font-normal text-lg">| {getClientName(selectedJob.clienteId)}</span>
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedJob.subtipo}</p>
                            </div>
                            <div className="flex gap-3">
                                {selectedJob.estado === TrabajoEstado.PENDIENTE && (
                                    <button 
                                        onClick={() => handleStatusChange(TrabajoEstado.EN_DISENO)}
                                        className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all hover:-translate-y-0.5"
                                    >
                                        <MonitorIcon className="w-5 h-5" /> Iniciar Diseño
                                    </button>
                                )}
                                {selectedJob.estado === TrabajoEstado.EN_DISENO && (
                                    <button 
                                        onClick={() => handleStatusChange(TrabajoEstado.PROCESO)}
                                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-all hover:-translate-y-0.5"
                                    >
                                        <CheckCircleIcon className="w-5 h-5" /> Enviar a Producción
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Workspace Content */}
                        <div className="flex-grow p-6 overflow-y-auto flex flex-col gap-6">
                            
                            {/* Original File / Reference Viewer */}
                            <div className="flex-grow bg-gray-200 dark:bg-gray-950 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center relative group min-h-[400px]">
                                {selectedJob.fotoOriginalUrl ? (
                                    <img 
                                        src={selectedJob.fotoOriginalUrl} 
                                        alt="Referencia Original" 
                                        className="max-w-full max-h-full object-contain shadow-2xl"
                                    />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <EyeIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Sin archivo de referencia visual</p>
                                        <p className="text-sm">El cliente no proporcionó una foto original.</p>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md">
                                    Referencia Original
                                </div>
                            </div>

                            {/* Job Details Grid */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tamaño Final</p>
                                    <p className="font-mono font-bold text-gray-800 dark:text-white">{selectedJob.tamano}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Cantidad</p>
                                    <p className="font-mono font-bold text-gray-800 dark:text-white">{selectedJob.cantidad} uds.</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tipo</p>
                                    <p className="font-mono font-bold text-brand-blue">{selectedJob.tipo.toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Design Actions (Mock) */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
                                    <UploadIcon className="w-5 h-5 text-gray-400"/> Archivos de Diseño
                                </h3>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer">
                                    <p className="text-sm text-gray-500">Arrastra aquí el arte final o haz clic para subir (.PDF, .AI, .PSD)</p>
                                </div>
                            </div>

                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12 text-center">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <PaletteIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Mesa de Diseño</h2>
                        <p className="max-w-md">Selecciona un trabajo de la cola izquierda para ver los detalles, la muestra original y comenzar a trabajar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DisenoPage;
