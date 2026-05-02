import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, SupervisorAnalysis, User } from '../types';
import { PaletteIcon, SparklesIcon, Loader2Icon, PrinterIcon, EyeIcon, RocketLaunchIcon } from '../components/Icons';
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

    const handleSendToVitrina = async () => {
        if (!selectedJob) return;

        if (!window.confirm("¿Seguro que desea enviar DIRECTO A VITRINA? Esta acción salta el paso de producción.")) {
            return;
        }

        try {
            await updateTrabajoStatus(selectedJob.id, TrabajoEstado.VITRINA, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Diseñador', 'FINALIZADO_DIRECTO', `Orden #${selectedJob.orden} enviada directamente a vitrina`, 'Diseño');
            setSelectedJob(null);
        } catch (error) {
            alert("Error al finalizar la orden.");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 pb-6 overflow-hidden">
            
            {/* --- COLA DE TRABAJOS --- */}
            <div className="w-full lg:w-[320px] flex flex-col bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                        <PaletteIcon className="w-4 h-4 text-brand-blue" />
                        Cola de Diseño
                    </h2>
                    <span className="bg-brand-blue/10 border border-brand-blue/20 px-2.5 py-1 rounded-lg text-brand-blue font-bold text-[9px] uppercase tracking-widest">{pendingJobs.length}</span>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loading ? (
                         <div className="flex justify-center py-10">
                             <Loader2Icon className="w-6 h-6 text-brand-blue/40 animate-spin" />
                         </div>
                    ) : pendingJobs.map(job => (
                        <motion.div 
                            layoutId={job.id}
                            key={job.id} 
                            onClick={() => setSelectedJob(job)} 
                            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${selectedJob?.id === job.id ? 'bg-brand-blue/5 border-brand-blue/40 shadow-sm' : 'bg-white border-slate-100 hover:border-brand-blue/20 hover:bg-slate-50'}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <p className={`font-black text-sm uppercase tracking-tighter ${selectedJob?.id === job.id ? 'text-brand-blue' : 'text-slate-400'}`}>ORD-{job.orden}</p>
                                <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">ESTÁNDAR</span>
                            </div>
                            <h3 className="font-bold text-xs text-slate-900 truncate uppercase">{getClientName(job.clienteId)}</h3>
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
            <div className="flex-1 flex flex-col bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                {selectedJob ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        
                        {/* HEADER DE TRABAJO */}
                        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
                            <div>
                                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Orden <span className="text-brand-blue">#{selectedJob.orden}</span></h1>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{selectedJob.subtipo} • {getClientName(selectedJob.clienteId)}</p>
                            </div>
                            <div className="flex gap-4 items-center">
                                <motion.button 
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleRunAI}
                                    disabled={analyzing || !selectedJob.fotoOriginalUrl}
                                    className="group relative flex items-center gap-3 px-6 py-3.5 bg-slate-50 text-slate-900 font-black text-[9px] uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-100 border border-slate-200 transition-all disabled:opacity-30 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-brand-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {analyzing ? <Loader2Icon className="animate-spin w-5 h-5 text-brand-blue"/> : <SparklesIcon className="w-5 h-5 text-brand-blue group-hover:rotate-12 transition-transform"/>}
                                    <div className="flex flex-col items-start leading-none gap-1">
                                        <span>ANÁLISIS_IA</span>
                                        <span className="text-[6px] text-slate-400 font-bold tracking-widest">PROTOCOLO_V4</span>
                                    </div>
                                </motion.button>

                                <div className="h-10 w-px bg-slate-200 mx-2" />

                                <motion.button 
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={handleSendToPrint}
                                    className="group relative flex items-center gap-4 px-8 py-3.5 bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-100 border border-slate-200 transition-all overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-slate-200/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <PrinterIcon className="w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors"/>
                                    <div className="flex flex-col items-start leading-none gap-1">
                                        <span>ENVIAR A PRODUCCIÓN</span>
                                        <span className="text-[6px] text-slate-400 font-bold tracking-widest">COLA_INDUSTRIAL</span>
                                    </div>
                                </motion.button>

                                <motion.button 
                                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                                    onClick={handleSendToVitrina}
                                    className="group relative flex items-center gap-4 px-10 py-4 bg-brand-blue text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-2xl hover:bg-brand-blue/90 transition-all shadow-blue-glow-sm overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
                                    <RocketLaunchIcon className="w-6 h-6 animate-pulse"/>
                                    <div className="flex flex-col items-start leading-none gap-1">
                                        <span>SALTO A VITRINA</span>
                                        <span className="text-[7px] text-white/60 font-black tracking-widest">BYPASS_PROCESO</span>
                                    </div>
                                </motion.button>
                            </div>
                        </div>

                        <div className="flex-grow p-6 overflow-hidden flex flex-col xl:flex-row gap-6">
                            
                            {/* VISUALIZADOR DE ARTE */}
                            <div className="flex-1 flex flex-col overflow-hidden min-h-[300px]">
                                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Arte de Referencia</h3>
                                <div className="flex-grow bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-center relative overflow-hidden group shadow-inner">
                                    {selectedJob.fotoOriginalUrl ? (
                                        <img src={selectedJob.fotoOriginalUrl} className="w-full h-full object-contain p-4" alt="Arte" />
                                    ) : (
                                        <div className="text-center opacity-20 flex flex-col items-center">
                                            <EyeIcon className="w-12 h-12 mb-3 text-slate-400"/>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Sin archivo adjunto</p>
                                        </div>
                                    )}
                                    
                                    {analyzing && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                            <Loader2Icon className="animate-spin w-10 h-10 text-brand-blue mb-4"/>
                                            <p className="font-black text-[10px] tracking-widest uppercase text-brand-blue">Analizando Diseño...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* PANEL DE ANÁLISIS IA */}
                            <div className="w-full xl:w-[400px] flex flex-col overflow-hidden">
                                <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <SparklesIcon className="w-3.5 h-3.5 text-brand-blue"/> Informe del Supervisor IA
                                </h3>
                                
                                <div className="flex-grow bg-slate-50/50 border border-slate-200 rounded-3xl p-6 overflow-y-auto custom-scrollbar flex flex-col">
                                    {aiAnalysis ? (
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Resultado del Análisis</span>
                                                <div className={`px-2 py-0.5 rounded text-[8px] font-black border ${
                                                    aiAnalysis.estado === 'VERDE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                                                    aiAnalysis.estado === 'AMARILLO' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                                                }`}>
                                                    ESTADO: {aiAnalysis.estado}
                                                </div>
                                            </div>
                                            
                                            <p className="text-slate-700 text-[13px] font-medium leading-relaxed bg-white p-4 rounded-xl border border-slate-100 border-l-4 border-l-brand-blue shadow-sm">
                                                "{aiAnalysis.resumen}"
                                            </p>
                                            
                                            <div className="space-y-3">
                                                {aiAnalysis.detalles.map((det, i) => (
                                                    <div key={i} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                        <p className="text-[8px] font-black text-brand-blue uppercase tracking-widest mb-1">{det.tipo}</p>
                                                        <p className="text-xs font-bold text-slate-900 uppercase mb-2 leading-tight">{det.descripcion}</p>
                                                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{det.sugerencia}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 opacity-40">
                                            <SparklesIcon className="w-8 h-8 text-brand-blue mb-4" />
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Supervisor IA Disponible</h3>
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
                        <PaletteIcon className="w-12 h-12 text-brand-blue mb-6" />
                        <p className="text-sm font-black text-slate-900 uppercase tracking-[0.4em]">Módulo de Diseño</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Seleccione una orden para comenzar</p>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default DisenoPage;
