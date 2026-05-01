import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FingerPrintIcon, 
    HashtagIcon, 
    KeyIcon, 
    MapPinIcon,
    ArrowRightIcon,
    CheckBadgeIcon,
    SparklesIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon,
    LayersIcon,
    ShieldIcon
} from '../Icons';
import { Cliente } from '../../types';
import { useData } from '../../contexts/DataContext';

interface SriSolicitudStepProps {
    cliente: Cliente;
    initialData: {
        actividad?: string;
        establecimiento?: string;
        puntoEmision?: string;
        clave?: string;
        modo?: 'NUEVO' | 'RENOVACION';
    };
    onComplete: (data: {
        actividad: string;
        establecimiento: string;
        puntoEmision: string;
        clave: string;
        modo: 'NUEVO' | 'RENOVACION';
    }) => void;
    onBack: () => void;
}

const ValidationTerminal = ({ active }: { active: boolean }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const messages = [
        "INITIATING SECURE SRI PROTOCOL [V5.1.0]...",
        "RSA_KEY_EXCHANGE: AUTHENTICATED [0x7FF-EA]",
        "ESTABLISHING TRACEABLE TRADEMARK LINK...",
        "ENCRYPTING PAYLOAD [AES-256-GCM]...",
        "VALIDATING POINT EMISSION DATA...",
        "TAXPAYER_REGIMEN_MATCH: OK",
        "SYNCING METADATA WITH SUPABASE PRODUCTION...",
        "SECURE_TOKEN_GRANTED: PR-992-DELTA",
        "HANDSHAKE_COMPLETE: STANDBY_DEPLOY"
    ];

    useEffect(() => {
        if (active && logs.length === 0) {
            let i = 0;
            const interval = setInterval(() => {
                if (i < messages.length) {
                    setLogs(prev => [...prev, messages[i]]);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 300);
            return () => clearInterval(interval);
        }
        if (!active) setLogs([]);
    }, [active]);

    return (
        <div className="bg-black/60 backdrop-blur-xl rounded-xl border border-white/5 p-3 h-24 font-mono text-[8px] overflow-hidden relative group shadow-inner">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-liquid-gold/20 animate-scan-slow z-20" />
            <div className="space-y-0.5 relative z-10">
                <div className="flex justify-between items-center mb-1 border-b border-white/5 pb-0.5">
                    <span className="text-[6px] text-liquid-gold/40 tracking-[0.2em]">SRI_LIVE_STREAM</span>
                    <div className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[6px] text-emerald-500/60 font-black uppercase">LINK_STABLE</span>
                    </div>
                </div>
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 items-center opacity-80">
                        <span className="text-liquid-gold/20">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                        <span className={i === logs.length - 1 ? "text-liquid-gold italic" : "text-slate-500"}>{log}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SriSolicitudStep: React.FC<SriSolicitudStepProps> = ({ 
    cliente, 
    initialData, 
    onComplete,
    onBack 
}) => {
    const { updateCliente } = useData();
    const [actividad, setActividad] = useState(initialData.actividad || '');
    const [establecimiento, setEstablecimiento] = useState(initialData.establecimiento || '001');
    const [puntoEmision, setPuntoEmision] = useState(initialData.puntoEmision || '001');
    const [clave, setClave] = useState(initialData.clave || '');
    const [modo, setModo] = useState<'NUEVO' | 'RENOVACION'>(initialData.modo || 'NUEVO');
    const [isProcessing, setIsProcessing] = useState(false);

    const [localActividades, setLocalActividades] = useState<string[]>(() => {
        // Priorizar actividades de fiscal_data (JSONB) si existen, sino usar el string anterior
        if (cliente.fiscal_data?.actividades && cliente.fiscal_data.actividades.length > 0) {
            return cliente.fiscal_data.actividades.map(a => a.descripcion);
        }
        return cliente.actividades ? cliente.actividades.split('|').map(a => a.trim()).filter(a => a.length > 0) : [];
    });

    const [availableEstablecimientos, setAvailableEstablecimientos] = useState<{codigo: string, nombre: string, direccion: string}[]>(() => {
        if (cliente.fiscal_data?.establecimientos && cliente.fiscal_data.establecimientos.length > 0) {
            return cliente.fiscal_data.establecimientos.map(e => ({
                codigo: e.codigo,
                nombre: e.nombre,
                direccion: e.direccion
            }));
        }
        return [{ codigo: '001', nombre: 'MATRIZ', direccion: cliente.direccion }];
    });

    const [isAdding, setIsAdding] = useState(false);
    const [newActInput, setNewActInput] = useState('');
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editInput, setEditInput] = useState('');

    useEffect(() => {
        if (!actividad && localActividades.length > 0) {
            setActividad(localActividades[0]);
        }
    }, [localActividades, actividad]);

    const persistActividades = async (newActs: string[]) => {
        try {
            await updateCliente(cliente.id, {
                ...cliente,
                actividades: newActs.join(' | ')
            });
        } catch (err) {
            console.error("Error persistiendo actividades:", err);
        }
    };

    const handleAddManual = async () => {
        if (!newActInput.trim()) return;
        const formatted = newActInput.startsWith('•') ? newActInput.trim() : `• ${newActInput.trim()}`;
        const updated = [...localActividades, formatted];
        setLocalActividades(updated);
        setActividad(formatted);
        setNewActInput('');
        setIsAdding(false);
        await persistActividades(updated);
    };

    const handleSaveEdit = async () => {
        if (editingIdx === null || !editInput.trim()) return;
        const updated = [...localActividades];
        updated[editingIdx] = editInput.trim();
        setLocalActividades(updated);
        setActividad(updated[editingIdx]);
        setEditingIdx(null);
        await persistActividades(updated);
    };

    const handleDeleteAct = async (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar esta actividad del registro del cliente?')) return;
        const updated = localActividades.filter((_, i) => i !== idx);
        setLocalActividades(updated);
        if (actividad === localActividades[idx]) {
            setActividad(updated[0] || '');
        }
        await persistActividades(updated);
    };

    const handleContinue = () => {
        setIsProcessing(true);
        setTimeout(() => {
            onComplete({
                actividad,
                establecimiento: establecimiento || '001',
                puntoEmision: puntoEmision || '001',
                clave,
                modo
            });
        }, 3800); // Sync with faster terminal
    };

    return (
        <div className="space-y-4 md:space-y-6 relative overflow-hidden px-1 md:px-0">
            {/* Tactical Grid Background Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:40px_40px] z-0" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 relative pb-4 md:pb-6 border-b border-white/5 z-10">
                <div className="absolute top-0 left-0 w-24 md:w-32 h-1 bg-liquid-gold shadow-gold-glow" />
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="min-w-0">
                        <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase mb-0.5 leading-none truncate">
                            Protocolo <span className="text-gold-gradient">Elite SRI</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-green-glow" />
                            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[7px] md:text-[8px]">
                                Validación Tributaria en Tiempo Real
                            </p>
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-auto bg-black/40 border border-white/5 px-3 md:px-4 py-2 md:py-3 rounded-xl md:rounded-2xl flex items-center gap-4 md:gap-5 backdrop-blur-2xl relative group overflow-hidden shadow-luxury">
                    <div className="absolute inset-0 bg-liquid-gold/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="w-7 h-7 md:w-9 md:h-9 bg-liquid-gold/10 rounded-lg flex items-center justify-center text-liquid-gold border border-liquid-gold/10 shadow-gold-glow-soft flex-shrink-0">
                        <FingerPrintIcon className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[6px] md:text-[8px] text-slate-500 font-black uppercase tracking-widest mb-0.5">CONTRIBUYENTE_AUTH</p>
                        <p className="text-white font-black italic tracking-tight uppercase text-[9px] md:text-xs leading-none truncate">{cliente.nombre}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 md:gap-10 relative z-10">
                <div className="space-y-6 md:space-y-8">
                    <div className="space-y-4 md:space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 ml-1">
                            <label className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">
                                <SparklesIcon className="w-4 h-4 text-liquid-gold animate-pulse" />
                                Actividad Económica
                            </label>
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="w-full sm:w-auto text-[8px] md:text-[10px] bg-white/5 hover:bg-liquid-gold px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-white hover:text-black font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-liquid-gold shadow-lg active:scale-95"
                            >
                                <PlusIcon className="w-3 h-3" /> Inyectar Registro
                            </button>
                        </div>
                        
                        <div className="space-y-3 md:space-y-4 max-h-[250px] md:max-h-[400px] overflow-y-auto pr-2 md:pr-4 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {isAdding && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="p-5 md:p-8 bg-liquid-gold/10 border-2 border-liquid-gold rounded-2xl md:rounded-[2rem] space-y-5 shadow-gold-glow"
                                    >
                                        <textarea 
                                            autoFocus
                                            value={newActInput}
                                            onChange={(e) => setNewActInput(e.target.value)}
                                            placeholder="DESCRIBA LA ACTIVIDAD TRIBUTARIA SEGÚN RUC..."
                                            className="w-full bg-black/60 border border-liquid-gold/20 rounded-xl md:rounded-2xl p-4 md:p-6 text-white text-xs md:text-base font-bold uppercase min-h-[100px] md:min-h-[140px] focus:ring-0 focus:border-liquid-gold placeholder:text-liquid-gold/30"
                                        />
                                        <div className="flex gap-3 md:gap-4">
                                            <button 
                                                onClick={handleAddManual}
                                                className="flex-1 bg-white text-black py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[13px] uppercase tracking-widest hover:bg-liquid-gold transition-all active:scale-95 shadow-xl"
                                            >
                                                Sincronizar Datos
                                            </button>
                                            <button 
                                                onClick={() => setIsAdding(false)}
                                                className="px-5 md:px-6 bg-black/40 text-white rounded-xl md:rounded-2xl hover:bg-white/10 transition-colors"
                                            >
                                                <XMarkIcon className="w-5 h-5 md:w-6 md:h-6" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {localActividades.map((acc, idx) => (
                                    <motion.div key={idx} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                                        {editingIdx === idx ? (
                                            <div className="p-5 md:p-8 bg-white/5 border-2 border-white/20 rounded-2xl md:rounded-[2rem] space-y-5 backdrop-blur-3xl">
                                                <textarea 
                                                    autoFocus
                                                    value={editInput}
                                                    onChange={(e) => setEditInput(e.target.value)}
                                                    className="w-full bg-black/60 border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 text-white text-xs md:text-base font-bold uppercase min-h-[100px] md:min-h-[140px] focus:ring-0 focus:border-liquid-gold"
                                                />
                                                <div className="flex gap-3 md:gap-4">
                                                    <button 
                                                        onClick={handleSaveEdit}
                                                        className="flex-1 bg-liquid-gold text-black py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-[13px] uppercase tracking-widest shadow-gold-glow active:scale-95"
                                                    >
                                                        Guardar Cambios
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingIdx(null)}
                                                        className="px-5 md:px-6 bg-black/40 text-white rounded-xl md:rounded-2xl hover:bg-white/10"
                                                    >
                                                        <XMarkIcon className="w-5 h-5 md:w-6 md:h-6" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="group relative">
                                                <button
                                                    onClick={() => setActividad(acc)}
                                                    className={`w-full text-left p-4 md:p-6 rounded-xl md:rounded-[1.5rem] border transition-all duration-500 flex items-center justify-between overflow-hidden relative ${
                                                        actividad === acc 
                                                        ? 'bg-liquid-gold/10 border-liquid-gold/50 text-white shadow-gold-glow-sm' 
                                                        : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-white/20 hover:bg-white/[0.05]'
                                                    }`}
                                                >
                                                    {actividad === acc && (
                                                        <motion.div 
                                                            layoutId="glow" 
                                                            className="absolute inset-0 bg-gradient-to-r from-liquid-gold/5 via-transparent to-liquid-gold/5 pointer-events-none" 
                                                        />
                                                    )}
                                                    <div className="flex flex-col gap-1.5 relative z-10 min-w-0 w-full">
                                                        <div className="flex items-center gap-2">
                                                            <LayersIcon className={`w-3 h-3 ${actividad === acc ? 'text-liquid-gold' : 'text-slate-600'}`} />
                                                            <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 font-mono">NODE_REG_{idx + 1}</span>
                                                        </div>
                                                        <span className={`text-[10px] md:text-[13px] font-black uppercase italic tracking-tight leading-tight pr-14 transition-colors ${actividad === acc ? 'text-white' : 'group-hover:text-white'}`}>
                                                            {acc}
                                                        </span>
                                                    </div>
                                                    {actividad === acc && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-liquid-gold rounded-lg flex items-center justify-center text-black shadow-lg flex-shrink-0 z-10">
                                                            <CheckBadgeIcon className="w-5 h-5 md:w-6 md:h-6" />
                                                        </div>
                                                    )}
                                                </button>
                                                
                                                <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 md:gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 z-20">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingIdx(idx);
                                                            setEditInput(acc);
                                                        }}
                                                        className="w-9 h-9 md:w-12 md:h-12 bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-liquid-gold hover:text-black hover:border-liquid-gold transition-all shadow-xl flex items-center justify-center"
                                                    >
                                                        <PencilIcon className="w-4 h-4 md:w-5 md:h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteAct(idx, e)}
                                                        className="w-9 h-9 md:w-12 md:h-12 bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-orange-950 transition-all shadow-xl flex items-center justify-center"
                                                    >
                                                        <TrashIcon className="w-4 h-4 md:w-5 md:h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {localActividades.length === 0 && !isAdding && (
                                <div className="p-10 md:p-16 bg-liquid-gold/5 border-2 border-dashed border-liquid-gold/20 rounded-2xl md:rounded-[3rem] text-center flex flex-col items-center gap-4 md:gap-6">
                                    <div className="w-16 h-16 md:w-24 md:h-24 bg-liquid-gold/10 rounded-full flex items-center justify-center text-liquid-gold/40 animate-pulse">
                                        <ExclamationTriangleIcon className="w-8 h-8 md:w-12 md:h-12" />
                                    </div>
                                    <p className="text-[10px] md:text-[13px] text-liquid-gold font-black uppercase tracking-[0.2em] max-w-[250px] italic">
                                        Sistema en espera: Inyecte registro de actividad para habilitar protocolo.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                        <label className="text-[9px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] ml-1 font-mono">Execution_Mode_Select</label>
                        <div className="flex bg-black/60 p-1.5 md:p-2 rounded-xl md:rounded-[2rem] border border-white/10 gap-2 md:gap-3 shadow-inner">
                            {(['NUEVO', 'RENOVACION'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setModo(m)}
                                    className={`flex-1 py-3 md:py-4 rounded-lg md:rounded-[1.5rem] text-[7px] md:text-[10px] font-black uppercase tracking-widest md:tracking-[0.2em] transition-all duration-500 relative overflow-hidden ${
                                        modo === m ? 'text-black' : 'text-slate-600 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {modo === m && (
                                        <motion.div 
                                            layoutId="modeGlow" 
                                            className="absolute inset-0 bg-liquid-gold shadow-gold-glow-strong" 
                                        />
                                    )}
                                    <span className="relative z-10">{m === 'NUEVO' ? 'Primer Talonario' : 'Renovación SRI'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 space-y-6 md:space-y-8 relative overflow-hidden shadow-2xl self-start">
                    {/* Industrial Scanners Background */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-liquid-gold/[0.03] blur-[120px] pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/[0.02] blur-[100px] pointer-events-none" />
                    
                    <div className="grid grid-cols-2 gap-4 md:gap-6 relative z-10">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold/40 animate-pulse" />
                                <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Establecimiento</span>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-liquid-gold/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                                <select 
                                    value={establecimiento}
                                    onChange={(e) => setEstablecimiento(e.target.value)}
                                    className="relative w-full bg-black/40 border border-white/5 group-focus-within/input:border-liquid-gold/40 rounded-xl md:rounded-2xl p-4 md:p-5 text-white font-black text-center text-xl md:text-3xl focus:bg-black/80 transition-all duration-500 shadow-inner font-mono appearance-none outline-none cursor-pointer tracking-tighter"
                                >
                                    {availableEstablecimientos.map(e => (
                                        <option key={e.codigo} value={e.codigo} className="bg-slate-900 text-white text-[10px] md:text-sm italic">
                                            {e.codigo}
                                        </option>
                                    ))}
                                    <option value="custom" className="bg-slate-900 text-white text-[10px] md:text-sm">+ OTRO</option>
                                </select>
                                <MapPinIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-liquid-gold/20 pointer-events-none group-focus-within/input:text-liquid-gold/60 transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold/40 animate-pulse" />
                                <span className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Punto Emisión</span>
                            </div>
                            <div className="relative group/input">
                                <div className="absolute inset-0 bg-liquid-gold/5 blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity rounded-2xl" />
                                <input 
                                    type="text"
                                    inputMode="numeric"
                                    value={puntoEmision}
                                    onChange={(e) => setPuntoEmision(e.target.value.replace(/\D/g, '').substring(0,3))}
                                    maxLength={3}
                                    className="relative w-full bg-black/40 border border-white/5 group-focus-within/input:border-liquid-gold/40 rounded-xl md:rounded-2xl p-4 md:p-5 text-white font-black text-center text-xl md:text-3xl tracking-[0.2em] focus:bg-black/80 transition-all duration-500 shadow-inner font-mono outline-none placeholder:text-slate-900"
                                    placeholder="001"
                                />
                                <HashtagIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-liquid-gold/20 pointer-events-none group-focus-within/input:text-liquid-gold/60 transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 relative z-10 pt-2">
                        <div className="flex items-center justify-between px-2">
                            <label className="flex items-center gap-3 text-[9px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest italic">
                                <KeyIcon className="w-4 h-4 md:w-5 md:h-5 text-liquid-gold" /> Credencial SRI
                            </label>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-liquid-gold/5 border border-liquid-gold/20 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                                <span className="text-[7px] md:text-[9px] text-liquid-gold font-black uppercase tracking-tighter">Encrypted_Link</span>
                            </div>
                        </div>
                        <div className="relative group/pass">
                            <div className="absolute -inset-1 bg-gradient-to-r from-liquid-gold/20 via-transparent to-liquid-gold/20 blur-2xl opacity-0 group-focus-within/pass:opacity-100 transition-opacity duration-1000" />
                            <input 
                                type="password"
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                className="relative w-full bg-black/80 border border-white/5 group-focus-within/pass:border-liquid-gold/50 rounded-xl md:rounded-2xl p-4 md:p-6 text-white font-mono text-lg md:text-2xl tracking-[0.6em] md:tracking-[0.8em] focus:bg-black transition-all duration-500 shadow-2xl outline-none placeholder:text-slate-900"
                                placeholder="••••••••"
                            />
                            <div className="absolute top-1/2 right-4 md:right-6 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white/[0.02] rounded-xl border border-white/5 flex items-center justify-center text-white/10 group-focus-within/pass:text-liquid-gold group-focus-within/pass:border-liquid-gold/30 transition-all duration-500">
                                <ShieldCheckIcon className="w-4 h-4 md:w-6 md:h-6" />
                            </div>
                            
                            {/* Scanning line animation */}
                            <motion.div 
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-[1px] bg-liquid-gold/30 blur-sm opacity-0 group-focus-within/pass:opacity-100 pointer-events-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-5 md:space-y-8 relative z-10">
                        <label className="text-[10px] md:text-[13px] text-slate-400 font-black uppercase tracking-[0.2em] md:tracking-[0.4em] ml-1 font-mono">Live_Data_Stream</label>
                        <ValidationTerminal active={isProcessing} />
                    </div>

                    <div className="pt-6 md:pt-10 relative z-10">
                        <button 
                            onClick={handleContinue}
                            disabled={!actividad || isProcessing}
                            className={`w-full py-5 md:py-7 rounded-xl md:rounded-[2rem] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px] md:text-[13px] flex items-center justify-center gap-4 md:gap-6 transition-all duration-700 shadow-2xl group active:scale-95 italic relative overflow-hidden ${
                                actividad && !isProcessing
                                ? 'bg-liquid-gold text-black hover:bg-white hover:shadow-gold-glow-sm' 
                                : 'bg-white/5 text-slate-700 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            {isProcessing && (
                                <motion.div 
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{ duration: 3.5, ease: "linear" }}
                                    className="absolute inset-0 bg-white/20"
                                />
                            )}
                            <span className="relative z-10">{isProcessing ? 'SINCRONIZANDO...' : 'Siguiente Módulo'}</span>
                            {!isProcessing && <ArrowRightIcon className="w-5 h-5 md:w-7 md:h-7 group-hover:translate-x-4 transition-transform relative z-10" />}
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 md:gap-6 pt-8 border-t border-white/5 relative z-10">
                        {[
                            { label: 'Uptime', val: '99.99%', color: 'text-emerald-500' },
                            { label: 'Latency', val: '08ms', color: 'text-liquid-gold' },
                            { label: 'Hash', val: '0x' + Math.random().toString(16).substring(2,6).toUpperCase(), color: 'text-slate-500' }
                        ].map((stat, i) => (
                            <div key={i} className="text-center space-y-1.5">
                                <p className="text-[7px] md:text-[8px] text-slate-600 font-black uppercase tracking-widest font-mono">{stat.label}</p>
                                <p className={`text-[9px] md:text-[12px] font-mono font-black ${stat.color}`}>{stat.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-0 right-0 w-64 h-64 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                </div>
            </div>

            <div className="flex justify-center pt-6 md:pt-10 relative z-10 pb-4">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-3 md:gap-4 text-[10px] md:text-[13px] text-slate-600 font-black uppercase tracking-[0.2em] md:tracking-[0.4em] hover:text-liquid-gold transition-all duration-500 group active:scale-95"
                >
                    <span className="group-hover:-translate-x-3 transition-transform text-lg">←</span> Retornar a Selección de Identidad
                </button>
            </div>
        </div>

    );
};

export default SriSolicitudStep;
