import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, User } from '../types';
import { PrinterIcon, CheckCircleIcon, Loader2Icon, CameraIcon, ImageIcon } from '../components/Icons';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { motion } from 'framer-motion';

const ProduccionPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
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
            alert("Error al subir la imagen");
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
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-140px)] gap-6 pb-6 lg:overflow-hidden">
            
            {/* --- COLA DE MANUFACTURA --- */}
            <div className="w-full lg:w-[350px] flex flex-col bg-black/20 backdrop-blur-md rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
                            <div className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 italic">
                            Vector de Manufactura
                        </h2>
                    </div>
                    <span className="bg-liquid-gold/10 border border-liquid-gold/20 px-3 py-1.5 rounded-xl text-liquid-gold font-black text-[9px] uppercase tracking-widest italic">{pendingJobs.length}</span>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {loading ? (
                         <div className="flex justify-center py-10">
                             <Loader2Icon className="w-6 h-6 text-orange-500/40 animate-spin" />
                         </div>
                    ) : (
                        pendingJobs.map(job => (
                            <motion.div 
                                layoutId={job.id}
                                key={job.id} 
                                onClick={() => setSelectedJob(job)} 
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${selectedJob?.id === job.id ? 'bg-liquid-gold/5 border-liquid-gold/40' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <p className={`font-black text-sm uppercase tracking-tighter ${selectedJob?.id === job.id ? 'text-liquid-gold' : 'text-slate-400'}`}>PROTOCOLO-{job.orden}</p>
                                    <span className="text-[7px] font-bold uppercase tracking-widest text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">FASE_EJECUCIÓN</span>
                                </div>
                                <h3 className="font-bold text-xs text-white truncate uppercase">{getClientName(job.clienteId)}</h3>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate mt-1">{job.subtipo}</p>
                            </motion.div>
                        ))
                    )}
                    {!loading && pendingJobs.length === 0 && (
                        <div className="py-20 text-center opacity-30">
                            <p className="text-[10px] font-bold uppercase tracking-widest">Sin pendientes</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ÁREA DE TRABAJO --- */}
            <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-md rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
                {/* HUD Overlay Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none select-none">
                    <div className="text-[60px] font-black italic tracking-tighter leading-none">MK_VIII</div>
                </div>

                {selectedJob ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        
                        {/* HEADER DE TRABAJO */}
                        <div className="p-8 border-b border-white/5 flex flex-col xl:flex-row justify-between items-center gap-6 bg-white/[0.01] relative">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/10 to-transparent" />
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-liquid-gold text-black flex items-center justify-center shadow-gold-glow">
                                    <PrinterIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Protocolo <span className="text-liquid-gold">#{selectedJob.orden}</span></h1>
                                        <span className="px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest bg-white/5 text-slate-500 border border-white/10 italic">SYS_ACTIVE_NODE</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1 italic">Operación de Manufactura Industrial • {getClientName(selectedJob.clienteId)}</p>
                                </div>
                            </div>
                            <div className="flex gap-4 w-full xl:w-auto">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white/5 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[1.2rem] hover:bg-white/10 border border-white/10 transition-all hover:scale-105 italic"
                                >
                                    {uploading ? <Loader2Icon className="animate-spin w-4 h-4 text-liquid-gold"/> : <CameraIcon className="w-4 h-4 text-liquid-gold shadow-gold-glow"/>}
                                    <span>Registrar Despliegue</span>
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
                                    className="flex-1 xl:flex-none flex items-center justify-center gap-4 px-10 py-4 bg-liquid-gold text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-[1.2rem] hover:bg-white transition-all shadow-gold-glow hover:scale-105 active:scale-95 group relative overflow-hidden italic"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                    <CheckCircleIcon className="w-5 h-5"/> Validar Protocolo
                                </button>
                            </div>
                        </div>

                        <div className="flex-grow p-6 overflow-hidden flex flex-col xl:flex-row gap-6">
                            
                            {/* ARTE ORIGINAL */}
                            <div className="flex-1 flex flex-col overflow-hidden min-h-[300px]">
                                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Arte / Diseño Aprobado</h3>
                                <div className="flex-grow bg-black/40 rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
                                    {selectedJob.fotoOriginalUrl ? (
                                        <img src={selectedJob.fotoOriginalUrl} className="w-full h-full object-contain p-4" alt="Arte Aprobado" />
                                    ) : (
                                        <div className="text-center opacity-20 flex flex-col items-center">
                                            <ImageIcon className="w-12 h-12 mb-3"/>
                                            <p className="text-[9px] font-bold uppercase tracking-widest">Sin archivo original</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* PROTOCOLO DE VERIFICACIÓN */}
                            <div className="flex-1 flex flex-col overflow-hidden min-h-[300px]">
                                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <CameraIcon className="w-3.5 h-3.5 text-liquid-gold"/> Telemetría de Manufactura
                                </h3>
                                <div className="flex-grow bg-white/[0.02] rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
                                    {selectedJob.fotoEvidenciaUrl ? (
                                        <img src={selectedJob.fotoEvidenciaUrl} className="w-full h-full object-contain p-4" alt="Evidencia Producción" />
                                    ) : (
                                        <div className="text-center opacity-40 flex flex-col items-center p-6">
                                            <CameraIcon className="w-12 h-12 text-liquid-gold mb-4"/>
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Registrar estado físico final</h3>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-3 leading-relaxed">
                                                Para garantizar el control de calidad, es obligatorio o recomendado adjuntar evidencia.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <PrinterIcon className="w-12 h-12 text-liquid-gold mb-6" />
                        <p className="text-sm font-black text-white uppercase tracking-[0.4em]">Terminal de Manufactura</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2">Sincronice el estado visual de los activos en proceso</p>
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

export default ProduccionPage;
