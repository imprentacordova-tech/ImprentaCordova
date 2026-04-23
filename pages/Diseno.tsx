import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, SupervisorAnalysis, User } from '../types';
import { PaletteIcon, SparklesIcon, Loader2Icon, PrinterIcon, EyeIcon } from '../components/Icons';
import { useOutletContext } from 'react-router-dom';
import { analyzeDesignWithSupervisor } from '../services/geminiService';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';

const DisenoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, loading, updateTrabajoStatus } = useData();
    const [selectedJob, setSelectedJob] = useState<Trabajo | null>(null);
    
    // Estados de IA
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<SupervisorAnalysis | null>(null);

    useEffect(() => {
        setAiAnalysis(null);
    }, [selectedJob]);

    const pendingJobs = trabajos.filter(t => 
        t.estado === TrabajoEstado.PENDIENTE || 
        t.estado === TrabajoEstado.EN_DISENO
    ).sort((a, b) => new Date(a.fechaEntrada).getTime() - new Date(b.fechaEntrada).getTime());

    const getClientName = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Cliente Desconocido';

    const handleRunAI = async () => {
        if (!selectedJob?.fotoOriginalUrl) return;
        setAnalyzing(true);
        try {
            const result = await analyzeDesignWithSupervisor(selectedJob.fotoOriginalUrl, selectedJob.subtipo);
            setAiAnalysis(result);
            logActivity(currentUser.nombre, currentUser.rol || 'Diseñador', 'ARTE_APROBADO', `Análisis técnico completado para orden #${selectedJob.orden}`, 'Diseño');
        } catch (error) {
            console.error("AI Analysis failed", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSendToPrint = async () => {
        if (!selectedJob) return;
        
        if (!aiAnalysis && !window.confirm("El Supervisor IA no ha validado este diseño. ¿Enviar a producción de todas formas?")) {
            return;
        }

        try {
            await updateTrabajoStatus(selectedJob.id, TrabajoEstado.PROCESO, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Diseñador', 'CAMBIO_ESTADO', `Orden #${selectedJob.orden} enviada a producción`, 'Diseño');
            setSelectedJob(null);
        } catch (error) {
            alert("Error al procesar la orden.");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 pb-6 overflow-hidden">
            
            {/* --- COLA DE TRABAJOS --- */}
            <div className="w-full lg:w-[320px] flex flex-col bg-black/20 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <PaletteIcon className="w-4 h-4 text-liquid-gold" />
                        Cola de Diseño
                    </h2>
                    <span className="bg-liquid-gold/10 border border-liquid-gold/20 px-2.5 py-1 rounded-lg text-liquid-gold font-bold text-[9px] uppercase tracking-widest">{pendingJobs.length}</span>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loading ? (
                         <div className="flex justify-center py-10">
                             <Loader2Icon className="w-6 h-6 text-liquid-gold/40 animate-spin" />
                         </div>
                    ) : pendingJobs.map(job => (
                        <motion.div 
                            layoutId={job.id}
                            key={job.id} 
                            onClick={() => setSelectedJob(job)} 
                            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${selectedJob?.id === job.id ? 'bg-liquid-gold/5 border-liquid-gold/40' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <p className={`font-black text-sm uppercase tracking-tighter ${selectedJob?.id === job.id ? 'text-liquid-gold' : 'text-slate-400'}`}>ORD-{job.orden}</p>
                                <span className="text-[7px] font-bold uppercase tracking-widest text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">ESTÁNDAR</span>
                            </div>
                            <h3 className="font-bold text-xs text-white truncate uppercase">{getClientName(job.clienteId)}</h3>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate mt-1">{job.subtipo}</p>
                        </motion.div>
                    ))}
                    {!loading && pendingJobs.length === 0 && (
                        <div className="py-20 text-center opacity-30">
                            <p className="text-[10px] font-bold uppercase tracking-widest">Sin pendientes</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ÁREA DE TRABAJO --- */}
            <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden">
                {selectedJob ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        
                        {/* HEADER DE TRABAJO */}
                        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.01]">
                            <div>
                                <h1 className="text-xl font-black text-white uppercase tracking-tight">Orden <span className="text-liquid-gold">#{selectedJob.orden}</span></h1>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{selectedJob.subtipo} • {getClientName(selectedJob.clienteId)}</p>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleRunAI}
                                    disabled={analyzing || !selectedJob.fotoOriginalUrl}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 text-white font-bold text-[9px] uppercase tracking-widest rounded-xl hover:bg-white/10 border border-white/10 transition-all disabled:opacity-30"
                                >
                                    {analyzing ? <Loader2Icon className="animate-spin w-4 h-4 text-liquid-gold"/> : <SparklesIcon className="w-4 h-4 text-liquid-gold"/>}
                                    <span>Validación IA</span>
                                </button>
                                <button 
                                    onClick={handleSendToPrint}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-liquid-gold transition-all"
                                >
                                    <PrinterIcon className="w-4 h-4"/> Enviar a Producción
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow p-6 overflow-hidden flex flex-col xl:flex-row gap-6">
                            
                            {/* VISUALIZADOR DE ARTE */}
                            <div className="flex-1 flex flex-col overflow-hidden min-h-[300px]">
                                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Arte de Referencia</h3>
                                <div className="flex-grow bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
                                    {selectedJob.fotoOriginalUrl ? (
                                        <img src={selectedJob.fotoOriginalUrl} className="w-full h-full object-contain p-4" alt="Arte" />
                                    ) : (
                                        <div className="text-center opacity-20 flex flex-col items-center">
                                            <EyeIcon className="w-12 h-12 mb-3"/>
                                            <p className="text-[9px] font-bold uppercase tracking-widest">Sin archivo adjunto</p>
                                        </div>
                                    )}
                                    
                                    {analyzing && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                            <Loader2Icon className="animate-spin w-10 h-10 text-liquid-gold mb-4"/>
                                            <p className="font-black text-[10px] tracking-widest uppercase text-liquid-gold">Analizando Diseño...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* PANEL DE ANÁLISIS IA */}
                            <div className="w-full xl:w-[400px] flex flex-col overflow-hidden">
                                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <SparklesIcon className="w-3.5 h-3.5 text-liquid-gold"/> Informe del Supervisor IA
                                </h3>
                                
                                <div className="flex-grow bg-white/[0.02] border border-white/10 rounded-3xl p-6 overflow-y-auto custom-scrollbar flex flex-col">
                                    {aiAnalysis ? (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic">Resultado del Análisis</span>
                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                                                    aiAnalysis.estado === 'VERDE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                    aiAnalysis.estado === 'AMARILLO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                }`}>
                                                    ESTADO: {aiAnalysis.estado}
                                                </div>
                                            </div>
                                            
                                            <p className="text-white text-[13px] font-medium leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 border-l-2 border-l-liquid-gold italic">
                                                "{aiAnalysis.resumen}"
                                            </p>
                                            
                                            <div className="space-y-3">
                                                {aiAnalysis.detalles.map((det, i) => (
                                                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                                        <p className="text-[8px] font-black text-liquid-gold uppercase tracking-widest mb-1">{det.tipo}</p>
                                                        <p className="text-xs font-bold text-white uppercase mb-2 leading-tight">{det.descripcion}</p>
                                                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{det.sugerencia}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 opacity-40">
                                            <SparklesIcon className="w-8 h-8 text-liquid-gold mb-4" />
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Supervisor IA Disponible</h3>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-3 leading-relaxed">
                                                Inicie el análisis para validar la viabilidad técnica del diseño.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <PaletteIcon className="w-12 h-12 text-liquid-gold mb-6" />
                        <p className="text-sm font-black text-white uppercase tracking-[0.4em]">Módulo de Diseño</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Seleccione una orden para comenzar</p>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default DisenoPage;
