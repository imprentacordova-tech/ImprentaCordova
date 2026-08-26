import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, User } from '../types';
import { 
    PrinterIcon, CheckCircleIcon, Loader2Icon, CameraIcon, 
    ImageIcon, ActivityIcon, HomeIcon, SparklesIcon,
    LayersIcon, ShieldCheckIcon, RocketLaunchIcon
} from '../components/Icons';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';

const ProduccionPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const navigate = useNavigate();
    const { trabajos, clientes, loading, updateTrabajoStatus, updateTrabajoEvidencia } = useData();
    const [selectedJob, setSelectedJob] = useState<Trabajo | null>(null);
    const [uploading, setUploading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const pendingJobs = trabajos.filter(t => 
        t.estado === TrabajoEstado.PROCESO
    ).sort((a, b) => new Date(a.fechaEntrada).getTime() - new Date(b.fechaEntrada).getTime());

    const getClientName = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Cliente Desconocido';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedJob) return;

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                await updateTrabajoEvidencia(selectedJob.id, base64data);
                setSelectedJob({ ...selectedJob, fotoEvidenciaUrl: base64data });
                logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'FOTO_CAPTURADA', `Evidencia de producción subida para orden #${selectedJob.orden}`, 'Producción');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Error uploading evidence", error);
        } finally {
            setUploading(false);
        }
    };

    const handleSendToVitrina = async () => {
        if (!selectedJob) return;

        try {
            await updateTrabajoStatus(selectedJob.id, TrabajoEstado.VITRINA, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CAMBIO_ESTADO', `Orden #${selectedJob.orden} movida a Vitrina`, 'Producción');
            setSelectedJob(null);
        } catch (error) {
            alert("Error al procesar la orden.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-120px)] gap-8 pb-10 pt-6 px-6 sm:px-12 animate-fade-in lg:overflow-hidden relative">
            <SEO title="Centro de Manufactura - Imprenta Córdova" description="Gestión de flujo de trabajo y control de calidad en tiempo real." />
            
            {/* Global Decorative Grid */}
            <div className="absolute inset-0 bg-architect-grid opacity-[0.03] pointer-events-none z-0" />

            {/* --- COLA DE MANUFACTURA --- */}
            <div className="w-full lg:w-[400px] flex flex-col bg-obsidian-card/80 backdrop-blur-xl rounded-[2.5rem] border border-white/[0.06] overflow-hidden shadow-sm relative z-10">
                <div className="p-8 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.04]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand-blue/10 rounded-2xl">
                            <LayersIcon className="w-5 h-5 text-brand-blue" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">
                                Flujo_Producción
                            </h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ÓRDENES EN CURSO</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse shadow-blue-glow" />
                        <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl font-black text-[10px]">{pendingJobs.length}</span>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {loading ? (
                         <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                             <Loader2Icon className="w-10 h-10 text-brand-blue animate-spin" />
                             <p className="text-[10px] font-black uppercase tracking-[0.4em]">SINCRONIZANDO...</p>
                         </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {pendingJobs.map((job, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    layoutId={job.id}
                                    key={job.id} 
                                    onClick={() => setSelectedJob(job)} 
                                    className={`group p-6 rounded-[2rem] cursor-pointer transition-all duration-300 border ${selectedJob?.id === job.id ? 'bg-brand-blue text-white border-brand-blue shadow-blue-glow' : 'bg-white/[0.04] border-white/[0.06] hover:border-brand-blue/30 hover:bg-obsidian-card hover:shadow-xl'}`}
                                >
                                    <div className="flex justify-between items-center mb-4">
                                        <p className={`font-black text-[11px] uppercase tracking-tighter ${selectedJob?.id === job.id ? 'text-white/70' : 'text-slate-400'}`}>MISSION_#{job.orden}</p>
                                        <div className="flex gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${selectedJob?.id === job.id ? 'bg-white shadow-[0_0_8px_#fff]' : 'bg-brand-blue shadow-blue-glow'} animate-pulse`} />
                                        </div>
                                    </div>
                                    <h3 className={`font-black text-lg truncate uppercase tracking-tighter ${selectedJob?.id === job.id ? 'text-white' : 'text-white group-hover:text-brand-blue'}`}>{getClientName(job.clienteId)}</h3>
                                    <div className="flex items-center gap-3 mt-4">
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border ${selectedJob?.id === job.id ? 'bg-white/10 border-white/20 text-white' : 'bg-obsidian-card border-white/[0.06] text-slate-400'}`}>{job.subtipo}</span>
                                        <div className={`w-1 h-1 rounded-full ${selectedJob?.id === job.id ? 'bg-white/30' : 'bg-slate-200'}`} />
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${selectedJob?.id === job.id ? 'text-white' : 'text-brand-blue'}`}>EN_PROCESO</span>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                    {!loading && pendingJobs.length === 0 && (
                        <div className="py-24 text-center flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-white/[0.04] rounded-full flex items-center justify-center border border-white/[0.06] shadow-inner">
                                <CheckCircleIcon className="w-10 h-10 text-emerald-200" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Cero Pendientes</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TODOS LOS SISTEMAS ESTÁN NOMINALES</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ÁREA DE TRABAJO --- */}
            <div className="flex-1 flex flex-col bg-obsidian-card/90 backdrop-blur-xl rounded-[2.5rem] border border-white/[0.06] overflow-hidden shadow-sm relative z-10">
                <AnimatePresence mode="wait">
                    {selectedJob ? (
                        <motion.div 
                            key={selectedJob.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col h-full overflow-hidden"
                        >
                            
                            {/* HEADER DE TRABAJO */}
                            <div className="p-12 border-b border-white/[0.06] flex flex-col xl:flex-row justify-between items-center gap-10 bg-white/[0.04]">
                                <div className="flex items-center gap-10">
                                    <div className="w-24 h-24 rounded-[2.5rem] bg-brand-blue text-white flex items-center justify-center shadow-blue-glow relative overflow-hidden group">
                                        <PrinterIcon className="w-10 h-10 relative z-10 group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-5">
                                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                                                Orden de Producción <span className="text-brand-blue font-bold">#{selectedJob.orden}</span>
                                            </h1>
                                            <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-blue/10 text-brand-blue border border-brand-blue/20">PRIORIDAD {selectedJob.prioridad || 'NORMAL'}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">{getClientName(selectedJob.clienteId)}</p>
                                            <div className="w-1 h-1 rounded-full bg-white/[0.06]" />
                                            <p className="text-[11px] font-bold text-brand-blue uppercase tracking-widest">{selectedJob.subtipo}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 w-full xl:w-auto">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex-1 xl:flex-none flex items-center justify-center gap-4 px-10 py-6 bg-obsidian-card text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:border-brand-blue/30 border border-white/[0.06] transition-all active:scale-95 shadow-sm"
                                    >
                                        {uploading ? <Loader2Icon className="animate-spin w-5 h-5 text-brand-blue"/> : <CameraIcon className="w-5 h-5 text-brand-blue"/>}
                                        <span>ANEXAR_EVIDENCIA</span>
                                    </button>
                                    <input 
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <button 
                                        onClick={handleSendToVitrina}
                                        className="flex-1 xl:flex-none flex items-center justify-center gap-5 px-14 py-6 bg-brand-blue text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl hover:bg-brand-blue/90 transition-all shadow-blue-glow active:scale-95 overflow-hidden relative group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                        <CheckCircleIcon className="w-6 h-6"/> FINALIZAR_MISION
                                    </button>
                                </div>
                            </div>

                            <div className="flex-grow p-12 overflow-hidden flex flex-col xl:flex-row gap-12">
                                
                                {/* ARTE ORIGINAL */}
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between mb-5 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-brand-blue" />
                                            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">DISEÑO_MATRIZ_V5</h3>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-50">REF_ID: {selectedJob.id.slice(0,8)}</span>
                                    </div>
                                    <div className="flex-grow bg-white/[0.04] rounded-[3rem] border border-white/[0.06] flex items-center justify-center relative overflow-hidden group shadow-inner">
                                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-architect-grid" />
                                        {selectedJob.fotoOriginalUrl ? (
                                            <motion.img 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                src={selectedJob.fotoOriginalUrl} 
                                                className="w-full h-full object-contain p-10 relative z-10 drop-shadow-2xl" 
                                                alt="Arte Aprobado" 
                                            />
                                        ) : (
                                            <div className="text-center opacity-30 flex flex-col items-center relative z-10">
                                                <ImageIcon className="w-20 h-20 mb-6 text-slate-300"/>
                                                <p className="text-[10px] font-black uppercase tracking-[0.5em]">NULL_SOURCE_FILE</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* PROTOCOLO DE VERIFICACIÓN */}
                                <div className="flex-1 flex flex-col overflow-hidden">
                                    <div className="flex items-center justify-between mb-5 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                                            <h3 className="text-[11px] font-black text-white uppercase tracking-widest">PROTOCOLO_DE_CALIDAD</h3>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/20" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue/20" />
                                        </div>
                                    </div>
                                    <div className="flex-grow bg-white/[0.04] rounded-[3rem] border border-white/[0.06] flex items-center justify-center relative overflow-hidden group shadow-inner">
                                        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-architect-grid" />
                                        {selectedJob.fotoEvidenciaUrl ? (
                                            <motion.img 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                src={selectedJob.fotoEvidenciaUrl} 
                                                className="w-full h-full object-contain p-10 relative z-10 drop-shadow-2xl" 
                                                alt="Evidencia Producción" 
                                            />
                                        ) : (
                                            <div className="text-center p-12 relative z-10 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                <div className="w-24 h-24 bg-obsidian-card rounded-[2.5rem] flex items-center justify-center shadow-xl mb-8 group-hover:scale-110 group-hover:shadow-blue-glow-sm transition-all duration-700 border border-white/[0.06] mx-auto">
                                                    <CameraIcon className="w-10 h-10 text-brand-blue opacity-50 group-hover:opacity-100 transition-all"/>
                                                </div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Vincular Evidencia</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-5 leading-relaxed max-w-[240px] mx-auto tracking-widest">
                                                    EL REGISTRO VISUAL ES MANDATORIO PARA EL CIERRE DE PROTOCOLO INDUSTRIAL.
                                                </p>
                                            </div>
                                        )}
                                        <div className="absolute bottom-8 right-8 z-20">
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-16 h-16 bg-obsidian-card text-brand-blue rounded-[1.5rem] shadow-2xl border border-white/[0.06] hover:scale-110 active:scale-95 transition-all flex items-center justify-center group/btn"
                                            >
                                                <CameraIcon className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                                                <div className="absolute inset-0 bg-brand-blue/5 rounded-[1.5rem] opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center gap-10"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-blue/10 blur-[100px] rounded-full scale-150 animate-pulse" />
                                <div className="relative w-32 h-32 bg-obsidian-card rounded-[3rem] border border-white/[0.06] shadow-xl flex items-center justify-center overflow-hidden group">
                                    <PrinterIcon className="w-14 h-14 text-slate-200 group-hover:text-brand-blue transition-colors duration-1000" />
                                    <div className="absolute inset-0 bg-architect-grid opacity-[0.05] pointer-events-none" />
                                </div>
                            </div>
                            <div className="text-center space-y-4">
                                <p className="text-2xl font-black text-white uppercase tracking-[0.4em]">Centro_Manufactura</p>
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.6em]">NODO_STANDBY: SELECCIONE UNA MISIÓN PARA OPERAR</p>
                                    <div className="flex gap-2.5 mt-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-bounce" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            `}</style>
        </div>
    );
};

export default ProduccionPage;

