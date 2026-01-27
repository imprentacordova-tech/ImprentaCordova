
import React, { useState, useEffect, useRef } from 'react';
import { getTrabajos, getClientes, updateTrabajoStatus } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, SupervisorAnalysis, User } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { PaletteIcon, MonitorIcon, ClockIcon, CheckCircleIcon, ArrowRightIcon, EyeIcon, UploadIcon, SparklesIcon, Loader2Icon, ExclamationTriangleIcon, PrinterIcon } from '../components/Icons';
import { useOutletContext } from 'react-router-dom';
import { analyzeDesignWithSupervisor } from '../services/geminiService';

const DisenoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [selectedJob, setSelectedJob] = useState<Trabajo | null>(null);
    const [loading, setLoading] = useState(true);
    
    // AI States
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<SupervisorAnalysis | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const [jobsData, clientsData] = await Promise.all([getTrabajos(), getClientes()]);
        setTrabajos(jobsData);
        setClientes(clientsData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        setAiAnalysis(null);
    }, [selectedJob]);

    useEffect(() => {
        fetchData();
    }, []);

    const pendingJobs = trabajos.filter(t => 
        t.estado === TrabajoEstado.PENDIENTE || 
        t.estado === TrabajoEstado.EN_DISENO
    ).sort((a, b) => new Date(a.fechaEntrada).getTime() - new Date(b.fechaEntrada).getTime());

    const getClientName = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Desconocido';

    const handleRunAI = async () => {
        if (!selectedJob?.fotoOriginalUrl) return;
        setAnalyzing(true);
        const result = await analyzeDesignWithSupervisor(selectedJob.fotoOriginalUrl, selectedJob.subtipo);
        setAiAnalysis(result);
        setAnalyzing(false);
    };

    const handleSendToPrint = async () => {
        if (!selectedJob) return;
        
        // Validación opcional: ¿Requiere análisis previo?
        if (!aiAnalysis && !window.confirm("El Supervisor IA no ha validado este diseño. ¿Enviar a impresión de todas formas?")) {
            return;
        }

        try {
            await updateTrabajoStatus(selectedJob.id, TrabajoEstado.PROCESO, currentUser.nombre);
            // Feedback visual y limpieza
            alert(`✅ Orden #${selectedJob.orden} enviada a Taller correctamente.`);
            setSelectedJob(null);
            fetchData();
        } catch (error) {
            alert("Error al mover el trabajo a producción.");
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden animate-fade-in">
            {/* Left Queue */}
            <div className="w-1/4 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2"><PaletteIcon className="w-5 h-5" /> Diseño</h2>
                    <span className="bg-brand-red px-2 py-0.5 rounded text-xs">{pendingJobs.length}</span>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {pendingJobs.map(job => (
                        <div key={job.id} onClick={() => setSelectedJob(job)} className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedJob?.id === job.id ? 'bg-blue-50 border-brand-blue ring-1' : 'bg-white border-slate-100 hover:border-blue-200'}`}>
                            <p className="font-black text-slate-800">#{job.orden}</p>
                            <h3 className="font-bold text-brand-blue truncate">{getClientName(job.clienteId)}</h3>
                            <p className="text-xs text-slate-500 line-clamp-1">{job.subtipo}</p>
                        </div>
                    ))}
                    {pendingJobs.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">No hay trabajos pendientes de diseño.</div>
                    )}
                </div>
            </div>

            {/* Workspace */}
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 overflow-hidden">
                {selectedJob ? (
                    <div className="flex flex-col h-full">
                        <div className="p-6 bg-white dark:bg-gray-800 border-b flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white">Orden #{selectedJob.orden}</h1>
                                <p className="text-slate-500 text-sm">{selectedJob.subtipo}</p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={handleRunAI}
                                    disabled={analyzing || !selectedJob.fotoOriginalUrl}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                                >
                                    {analyzing ? <Loader2Icon className="animate-spin w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
                                    SUPERVISOR MAESTRO (IA)
                                </button>
                                <button 
                                    onClick={handleSendToPrint}
                                    className="px-6 py-2.5 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-800 transition-all flex items-center gap-2"
                                >
                                    <PrinterIcon className="w-5 h-5"/> ENVIAR A IMPRESIÓN
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8 custom-scrollbar">
                            {/* Visual Reference */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="aspect-[4/3] bg-slate-200 rounded-3xl overflow-hidden shadow-inner border-4 border-white flex items-center justify-center relative group">
                                    {selectedJob.fotoOriginalUrl ? (
                                        <img src={selectedJob.fotoOriginalUrl} className="max-w-full max-h-full object-contain" alt="Arte" />
                                    ) : (
                                        <div className="text-center text-slate-400">
                                            <EyeIcon className="w-16 h-16 mx-auto mb-2 opacity-20"/>
                                            <p>Sin referencia visual</p>
                                        </div>
                                    )}
                                    {analyzing && (
                                        <div className="absolute inset-0 bg-purple-600/20 backdrop-blur-sm flex items-center justify-center">
                                            <div className="w-full h-1 bg-white absolute top-0 animate-[scan_2s_infinite]"></div>
                                            <div className="text-center text-white">
                                                <Loader2Icon className="animate-spin w-10 h-10 mx-auto mb-4"/>
                                                <p className="font-black tracking-widest uppercase text-xl">Escaneando Arte...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Analysis Panel */}
                            <div className="lg:col-span-5 space-y-6">
                                {aiAnalysis ? (
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border-t-8 animate-slide-in-up" style={{borderColor: aiAnalysis.estado === 'VERDE' ? '#10b981' : aiAnalysis.estado === 'AMARILLO' ? '#f59e0b' : '#ef4444'}}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Diagnóstico del Supervisor</h3>
                                            <span className={`px-4 py-1 rounded-full text-xs font-black ${aiAnalysis.estado === 'VERDE' ? 'bg-green-100 text-green-700' : aiAnalysis.estado === 'AMARILLO' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {aiAnalysis.estado}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 font-medium mb-6 italic leading-relaxed">
                                            "{aiAnalysis.resumen}"
                                        </p>
                                        <div className="space-y-4">
                                            {aiAnalysis.detalles.map((det, i) => (
                                                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border-l-4 border-brand-blue">
                                                    <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">{det.tipo}</p>
                                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{det.descripcion}</p>
                                                    <p className="text-xs text-slate-500">{det.sugerencia}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6">
                                            <SparklesIcon className="w-10 h-10 text-purple-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-400">Control de Calidad IA</h3>
                                        <p className="text-slate-400 text-sm mt-2">Haz clic en el botón superior para realizar un diagnóstico profesional del diseño.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <PaletteIcon className="w-24 h-24 mb-4" />
                        <p className="text-xl font-bold uppercase tracking-widest">Selecciona una orden para comenzar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DisenoPage;
