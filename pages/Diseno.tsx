import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado, SupervisorAnalysis, User } from '../types';
import { PaletteIcon, SparklesIcon, Loader2Icon, PrinterIcon, EyeIcon } from '../components/Icons';
import { useOutletContext } from 'react-router-dom';
import { analyzeDesignWithSupervisor } from '../services/geminiService';
import { logActivity } from '../services/activityLogService';

const DisenoPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, loading, updateTrabajoStatus } = useData();
    const [selectedJob, setSelectedJob] = useState<Trabajo | null>(null);
    
    // AI States
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<SupervisorAnalysis | null>(null);

    useEffect(() => {
        setAiAnalysis(null);
    }, [selectedJob]);

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
        
        logActivity(currentUser.nombre, currentUser.rol || 'Diseñador', 'ARTE_APROBADO', `Análisis IA completado para orden #${selectedJob.orden}. Diagnóstico: ${result?.estado}`, 'Diseño');
        setAnalyzing(false);
    };

    const handleSendToPrint = async () => {
        if (!selectedJob) return;
        
        if (!aiAnalysis && !window.confirm("¿El Supervisor IA no ha validado este diseño. ¿Enviar a impresión de todas formas?")) {
            return;
        }

        try {
            await updateTrabajoStatus(selectedJob.id, TrabajoEstado.PROCESO, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Diseñador', 'CAMBIO_ESTADO', `Orden #${selectedJob.orden} enviada a producción. validado_por_ia: ${!!aiAnalysis}`, 'Diseño');
            alert(`✅ Orden #${selectedJob.orden} enviada a Taller correctamente.`);
            setSelectedJob(null);
        } catch (error) {
            alert("Error al mover el trabajo a producción.");
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-8 animate-fade-in pb-10">
            {/* Left Queue */}
            <div className="w-full lg:w-1/4 flex flex-col bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-luxury border border-white/5 overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-brand-dark/30">
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <PaletteIcon className="w-6 h-6 text-liquid-gold" />
                        Cola Diseño
                    </h2>
                    <span className="bg-brand-red/20 border border-brand-red/30 px-3 py-1 rounded-lg text-brand-red font-black text-[9px] uppercase tracking-widest">{pendingJobs.length} Pendientes</span>
                </div>
                <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {loading ? (
                         <div className="text-center py-10 opacity-50">
                             <div className="w-8 h-8 border-4 border-liquid-gold/30 border-t-liquid-gold rounded-full animate-spin mx-auto mb-3"></div>
                         </div>
                    ) : pendingJobs.map(job => (
                        <div key={job.id} onClick={() => setSelectedJob(job)} className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 group ${selectedJob?.id === job.id ? 'bg-liquid-gold/5 border border-liquid-gold/50 shadow-gold-glow scale-105' : 'bg-brand-dark/50 border border-white/5 hover:border-liquid-gold/30 hover:-translate-y-1'}`}>
                            <div className="flex justify-between items-end mb-2">
                                <p className={`font-black text-lg uppercase tracking-wider ${selectedJob?.id === job.id ? 'text-liquid-gold' : 'text-slate-300 group-hover:text-white'}`}>#{job.orden}</p>
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">PRIORIDAD NORMAL</span>
                            </div>
                            <h3 className="font-bold text-sm text-white truncate uppercase mb-1">{getClientName(job.clienteId)}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{job.subtipo}</p>
                        </div>
                    ))}
                    {!loading && pendingJobs.length === 0 && (
                        <div className="p-10 text-center flex flex-col items-center opacity-50">
                            <CheckBadgeIcon className="w-12 h-12 text-slate-500 mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-relaxed">No hay trabajos en la cola de diseño.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Workspace */}
            <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl rounded-[2.5rem] shadow-luxury border border-white/5 overflow-hidden">
                {selectedJob ? (
                    <div className="flex flex-col h-full animate-fade-in">
                        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-brand-dark/30">
                            <div>
                                <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Orden <span className="text-liquid-gold">#{selectedJob.orden}</span></h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{selectedJob.subtipo} • {getClientName(selectedJob.clienteId)}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 w-full md:w-auto">
                                <button 
                                    onClick={handleRunAI}
                                    disabled={analyzing || !selectedJob.fotoOriginalUrl}
                                    className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-white/5 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 hover:border-liquid-gold/50 transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {analyzing ? <Loader2Icon className="animate-spin w-5 h-5 text-liquid-gold"/> : <SparklesIcon className="w-5 h-5 text-liquid-gold group-hover:scale-110 transition-transform"/>}
                                    <span>Análisis IA</span>
                                </button>
                                <button 
                                    onClick={handleSendToPrint}
                                    className="flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] border border-emerald-400/50 rounded-2xl hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                >
                                    <PrinterIcon className="w-5 h-5"/> Enviar Taller
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow p-8 overflow-y-auto grid grid-cols-1 xl:grid-cols-12 gap-8 custom-scrollbar">
                            {/* Visual Reference */}
                            <div className="xl:col-span-7 flex flex-col h-full min-h-[400px]">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Referencia Visual</h3>
                                <div className="flex-grow bg-brand-dark/80 rounded-[2rem] overflow-hidden border border-white/10 flex items-center justify-center relative group p-4 shadow-inner">
                                    {selectedJob.fotoOriginalUrl ? (
                                        <div className="w-full h-full rounded-2xl overflow-hidden relative">
                                            <img src={selectedJob.fotoOriginalUrl} className="w-full h-full object-contain" alt="Arte" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent pointer-events-none"></div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-500 flex flex-col items-center">
                                            <EyeIcon className="w-16 h-16 mb-4 opacity-20"/>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sin referencia provista</p>
                                        </div>
                                    )}
                                    {analyzing && (
                                        <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center rounded-[2rem] z-10">
                                            <div className="w-full h-1 bg-liquid-gold shadow-gold-glow absolute top-0 animate-[scan_2s_infinite]"></div>
                                            <div className="text-center text-white">
                                                <Loader2Icon className="animate-spin w-12 h-12 text-liquid-gold mx-auto mb-6"/>
                                                <p className="font-black text-sm tracking-[0.3em] uppercase text-liquid-gold">Procesando Arte...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Analysis Panel */}
                            <div className="xl:col-span-5 flex flex-col h-full">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4 text-liquid-gold"/> Diagnóstico Supervisor
                                </h3>
                                {aiAnalysis ? (
                                    <div className="flex-grow bg-brand-dark/50 border border-white/10 rounded-[2rem] p-8 shadow-luxury flex flex-col relative overflow-hidden animate-slide-up">
                                        {/* Status Line Indicator */}
                                        <div className="absolute top-0 left-0 w-full h-2" style={{backgroundColor: aiAnalysis.estado === 'VERDE' ? '#10b981' : aiAnalysis.estado === 'AMARILLO' ? '#f59e0b' : '#ef4444'}}></div>
                                        
                                        <div className="flex justify-between items-center mb-8 pt-2">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Reporte IA</h3>
                                            <span className="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border" style={{
                                                backgroundColor: aiAnalysis.estado === 'VERDE' ? 'rgba(16,185,129,0.1)' : aiAnalysis.estado === 'AMARILLO' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: aiAnalysis.estado === 'VERDE' ? '#34d399' : aiAnalysis.estado === 'AMARILLO' ? '#fbbf24' : '#f87171',
                                                borderColor: aiAnalysis.estado === 'VERDE' ? 'rgba(16,185,129,0.2)' : aiAnalysis.estado === 'AMARILLO' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'
                                            }}>
                                                ESTADO {aiAnalysis.estado}
                                            </span>
                                        </div>
                                        
                                        <p className="text-slate-300 text-sm font-bold mb-8 italic leading-relaxed p-6 bg-white/5 rounded-2xl border border-white/5 border-l-4 border-l-liquid-gold">
                                            "{aiAnalysis.resumen}"
                                        </p>
                                        
                                        <div className="overflow-y-auto space-y-4 custom-scrollbar pr-2 flex-grow">
                                            {aiAnalysis.detalles.map((det, i) => (
                                                <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-liquid-gold/20 transition-colors">
                                                    <p className="text-[9px] font-black text-liquid-gold uppercase tracking-[0.2em] mb-2">{det.tipo}</p>
                                                    <p className="text-sm font-bold text-white uppercase mb-3 leading-snug">{det.descripcion}</p>
                                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{det.sugerencia}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 bg-brand-dark/30 rounded-[2rem] border border-dashed border-white/10 opacity-70">
                                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                            <SparklesIcon className="w-10 h-10 text-liquid-gold" />
                                        </div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-widest">Supervisor IA en Reposo</h3>
                                        <p className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mt-4 max-w-xs leading-relaxed">
                                            Haz clic superior para inyectar diagnóstico profesional al diseño actual.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 bg-brand-dark/20">
                        <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/5">
                            <PaletteIcon className="w-12 h-12 text-liquid-gold" />
                        </div>
                        <p className="text-lg font-black text-white uppercase tracking-[0.3em]">Cola en Espera</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">Selecciona un requerimiento</p>
                    </div>
                )}
            </div>
            
            {/* Componente ficticio para satisfacer dependencia de CheckBadgeIcon dentro del file */}
            <span className="hidden">
                {(() => {
                    const CheckBadgeIcon = () => <svg/>; return null;
                })()}
            </span>
        </div>
    );
};

// Extrayendo localmente el SVG ya que vimos que no estaba en el import, para prevenir errores
function CheckBadgeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
  );
}

export default DisenoPage;
