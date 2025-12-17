
import React, { useState, useEffect, useRef } from 'react';
import { getTrabajos, getClientes, updateTrabajoStatus, updateTrabajoDiseno } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, ToneType } from '../types';
import { formatDate } from '../utils';
import { PaletteIcon, MonitorIcon, ClockIcon, CheckCircleIcon, EyeIcon, UploadIcon, SparklesIcon, CloseIcon, CopyIcon, Loader2Icon } from '../components/Icons';
import { useOutletContext } from 'react-router-dom';
import { User } from '../types';
import { generateMarketingCopy } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';

// --- AI MODAL COMPONENT ---
const AICreativeModal: React.FC<{
    job: Trabajo;
    clientName: string;
    onClose: () => void;
}> = ({ job, clientName, onClose }) => {
    const { addToast } = useToast();
    const [tone, setTone] = useState<string>(ToneType.PROFESSIONAL);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        const text = await generateMarketingCopy({
            businessName: clientName,
            productType: job.subtipo,
            tone: tone
        });
        setResult(text);
        setLoading(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        addToast("Texto copiado al portapapeles", "success");
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6 text-yellow-300" />
                        <h2 className="text-xl font-bold">Asistente Creativo</h2>
                    </div>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 hover:bg-white/20 rounded-full" /></button>
                </div>
                
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Contexto del Trabajo</p>
                        <p className="font-semibold text-gray-800 dark:text-white">{job.subtipo}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Cliente: {clientName}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tono del Mensaje</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(ToneType).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                                        tone === t 
                                        ? 'bg-purple-100 text-purple-700 border-purple-300' 
                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {result && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800 animate-fade-in relative">
                            <button onClick={handleCopy} className="absolute top-2 right-2 p-2 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-lg text-purple-700 transition-colors" title="Copiar">
                                <CopyIcon className="w-4 h-4"/>
                            </button>
                            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{result}</pre>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg hover:shadow-purple-500/30 disabled:opacity-70 disabled:cursor-not-allowed w-full justify-center"
                    >
                        {loading ? <Loader2Icon className="animate-spin w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                        {loading ? 'Generando Ideas...' : 'Generar Texto'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DisenoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { addToast } = useToast();
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [selectedJob, setSelectedJob] = useState<Trabajo | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAI, setShowAI] = useState(false);
    
    // File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        addToast(`Estado actualizado a: ${newStatus}`, "success");
        
        if (newStatus === TrabajoEstado.PROCESO) {
            setSelectedJob(null); // Clear selection if moved to Production
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedJob || !e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = async () => {
            const base64 = reader.result as string;
            // Update Mock API
            await updateTrabajoDiseno(selectedJob.id, { archivoUrl: base64 });
            
            // Optimistic Update
            const updatedDiseno = { ...selectedJob.diseno, archivoUrl: base64, estado: 'Requiere Diseño' };
            const updatedJob = { ...selectedJob, diseno: updatedDiseno } as Trabajo; // Cast needed as deep merge is tricky with types
            
            setTrabajos(prev => prev.map(t => t.id === selectedJob.id ? updatedJob : t));
            setSelectedJob(updatedJob);
            addToast("Archivo de diseño adjuntado", "success");
        };
        
        reader.readAsDataURL(file);
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
        <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden animate-fade-in">
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
                                <button 
                                    onClick={() => setShowAI(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-xl hover:bg-purple-200 transition-colors"
                                >
                                    <SparklesIcon className="w-5 h-5" /> IA Copy
                                </button>
                                
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
                            
                            <div className="flex gap-6 h-full min-h-[400px]">
                                {/* 1. Referencia Original */}
                                <div className="flex-1 flex flex-col">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Referencia Original</h4>
                                    <div className="flex-grow bg-gray-200 dark:bg-gray-950 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center relative group overflow-hidden">
                                        {selectedJob.fotoOriginalUrl ? (
                                            <img 
                                                src={selectedJob.fotoOriginalUrl} 
                                                alt="Referencia Original" 
                                                className="max-w-full max-h-full object-contain shadow-md"
                                            />
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <EyeIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Sin referencia visual</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Arte Final / Diseño */}
                                <div className="flex-1 flex flex-col">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Arte Final</h4>
                                    <div 
                                        className={`flex-grow rounded-xl border-2 border-dashed flex items-center justify-center relative group overflow-hidden transition-colors ${
                                            selectedJob.diseno?.archivoUrl ? 'bg-white border-brand-blue' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700/50 cursor-pointer'
                                        }`}
                                        onClick={() => !selectedJob.diseno?.archivoUrl && fileInputRef.current?.click()}
                                    >
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={handleFileUpload} 
                                            accept="image/*" 
                                            className="hidden" 
                                        />
                                        
                                        {selectedJob.diseno?.archivoUrl ? (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <img 
                                                    src={selectedJob.diseno.archivoUrl} 
                                                    alt="Arte Final" 
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                        className="bg-white text-gray-800 px-4 py-2 rounded-lg font-bold shadow-lg"
                                                    >
                                                        Cambiar Diseño
                                                    </button>
                                                </div>
                                                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">
                                                    Listo
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-gray-400 pointer-events-none">
                                                <UploadIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p className="font-medium text-gray-600 dark:text-gray-300">Subir Arte Final</p>
                                                <p className="text-xs">Click para adjuntar imagen (.jpg, .png)</p>
                                            </div>
                                        )}
                                    </div>
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

                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12 text-center">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                            <PaletteIcon className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-300 mb-2">Mesa de Diseño</h2>
                        <p className="max-w-md">Selecciona un trabajo de la cola izquierda para ver los detalles, generar textos con IA y subir los artes finales.</p>
                    </div>
                )}
            </div>

            {/* AI Assistant Modal */}
            {showAI && selectedJob && (
                <AICreativeModal 
                    job={selectedJob} 
                    clientName={getClientName(selectedJob.clienteId)} 
                    onClose={() => setShowAI(false)} 
                />
            )}
        </div>
    );
};

export default DisenoPage;
