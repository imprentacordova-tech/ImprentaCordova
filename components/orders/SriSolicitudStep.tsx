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
    ShieldIcon,
    CpuIcon,
    Building2Icon,
    BoltIcon,
    RocketLaunchIcon,
    ArrowPathIcon
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
        "INITIATING_SECURE_SRI_PROTOCOL [V5.1.0]...",
        "RSA_KEY_EXCHANGE: AUTHENTICATED [0x7FF-EA]",
        "ESTABLISHING_TRACEABLE_TRADEMARK_LINK...",
        "ENCRYPTING_PAYLOAD [AES-256-GCM]...",
        "VALIDATING_POINT_EMISSION_DATA...",
        "TAXPAYER_REGIMEN_MATCH: OK",
        "SYNCING_METADATA_WITH_SUPABASE_PRODUCTION...",
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
        <div className="bg-black/80 backdrop-blur-3xl rounded-[2rem] border border-white/10 p-8 h-48 font-mono text-[10px] overflow-hidden relative group shadow-2xl tactical-border">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-liquid-gold/40 animate-shimmer z-20" />
            <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" />
            
            <div className="space-y-2 relative z-10">
                <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-3">
                    <span className="text-[10px] text-liquid-gold font-black tracking-[0.5em] italic">SRI_LIVE_TELEMETRY</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-gold-glow" />
                        <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">LINK_STABLE</span>
                    </div>
                </div>
                <div className="space-y-1.5 overflow-y-auto max-h-24 custom-scrollbar">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-4 duration-300">
                            <span className="text-liquid-gold/30 font-black">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                            <span className={i === logs.length - 1 ? "text-liquid-gold italic font-black" : "text-slate-500 font-bold"}>{log}</span>
                        </div>
                    ))}
                </div>
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [localActividades, setLocalActividades] = useState<string[]>(() => {
        if (cliente.fiscal_data?.actividades && cliente.fiscal_data.actividades.length > 0) {
            return cliente.fiscal_data.actividades.map(a => a.descripcion);
        }
        return cliente.actividades ? cliente.actividades.split('|').map(a => a.trim()).filter(a => a.length > 0) : [];
    });

    const [availableEstablecimientos] = useState<{codigo: string, nombre: string, direccion: string}[]>(() => {
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

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            onComplete({
                actividad,
                establecimiento,
                puntoEmision,
                clave,
                modo
            });
        }, 3200);
    };

    const isFormValid = actividad && establecimiento.length === 3 && puntoEmision.length === 3 && clave;

    return (
        <div className="space-y-10 md:space-y-14 relative overflow-hidden px-1 md:px-0">
            {/* Tactical Grid Background Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:40px_40px] z-0" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10 relative pb-10 md:pb-14 border-b border-white/10 z-10">
                <div className="absolute top-0 left-0 w-32 md:w-48 h-[2px] bg-liquid-gold shadow-gold-glow animate-pulse" />
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="min-w-0 space-y-2">
                        <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none truncate">
                            Protocolo <span className="text-gold-gradient">Elite SRI</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-gold-glow" />
                            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[9px] md:text-[11px] italic">
                                VALIDACIÓN_TRIBUTARIA_SÍNCRONA
                            </p>
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-auto glass-panel-obsidian border border-white/10 px-8 md:px-12 py-6 md:py-8 rounded-[2.5rem] flex items-center gap-6 md:gap-10 relative group overflow-hidden shadow-2xl tactical-border">
                    <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/10 via-transparent to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-liquid-gold text-black rounded-2xl flex items-center justify-center shadow-gold-glow flex-shrink-0 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        <FingerPrintIcon className="w-6 h-6 md:w-8 md:h-8 relative z-10" />
                    </div>
                    <div className="min-w-0 space-y-1">
                        <p className="text-[10px] md:text-[12px] text-liquid-gold font-black uppercase tracking-[0.4em] italic mb-1">OPERADOR_VERIFIED</p>
                        <p className="text-white font-black italic tracking-tighter uppercase text-xl md:text-3xl leading-none truncate">{cliente.nombre}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-16 relative z-10">
                {/* Left Column: Activity Management */}
                <div className="space-y-10 md:space-y-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 md:gap-10">
                        <label className="flex items-center gap-4 text-[12px] md:text-[14px] text-slate-400 font-black uppercase tracking-[0.4em] italic">
                            <SparklesIcon className="w-6 h-6 text-liquid-gold animate-pulse" />
                            Vector de Actividad
                        </label>
                        <button 
                            onClick={() => setIsAdding(true)}
                            className="w-full sm:w-auto text-[11px] md:text-[13px] bg-white/5 hover:bg-liquid-gold px-8 py-4 md:py-5 rounded-[2rem] text-white hover:text-black font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 border border-white/10 hover:border-liquid-gold shadow-2xl active:scale-95 italic"
                        >
                            <PlusIcon className="w-5 h-5" /> INYECTAR_REGISTRO
                        </button>
                    </div>
                    
                    <div className="space-y-4 md:space-y-6 max-h-[400px] md:max-h-[600px] overflow-y-auto pr-4 md:pr-8 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {isAdding && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -40, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="p-10 md:p-14 bg-liquid-gold/10 border-2 border-liquid-gold rounded-[3rem] md:rounded-[4rem] space-y-8 shadow-gold-glow tactical-border"
                                >
                                    <textarea 
                                        autoFocus
                                        value={newActInput}
                                        onChange={(e) => setNewActInput(e.target.value)}
                                        placeholder="DESCRIBA LA ACTIVIDAD TRIBUTARIA SEGÚN RUC..."
                                        className="w-full bg-black/60 border border-liquid-gold/40 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 text-white text-base md:text-xl font-black uppercase min-h-[150px] md:min-h-[200px] focus:ring-0 focus:border-liquid-gold placeholder:text-liquid-gold/20 italic"
                                    />
                                    <div className="flex gap-4 md:gap-6">
                                        <button 
                                            onClick={handleAddManual}
                                            className="flex-1 bg-white text-black py-6 md:py-8 rounded-[2rem] font-black text-[12px] md:text-[15px] uppercase tracking-[0.3em] hover:bg-liquid-gold transition-all active:scale-95 shadow-2xl italic"
                                        >
                                            AUTORIZAR_SINCRONIZACIÓN
                                        </button>
                                        <button 
                                            onClick={() => setIsAdding(false)}
                                            className="px-8 md:px-10 bg-black/60 text-white rounded-[2rem] hover:bg-white/10 transition-all border border-white/10"
                                        >
                                            <XMarkIcon className="w-8 h-8" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {localActividades.map((acc, idx) => (
                                <motion.div key={idx} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                                    {editingIdx === idx ? (
                                        <div className="p-10 md:p-14 glass-panel-obsidian border-2 border-white/20 rounded-[3rem] md:rounded-[4rem] space-y-8 backdrop-blur-3xl tactical-border shadow-2xl">
                                            <textarea 
                                                autoFocus
                                                value={editInput}
                                                onChange={(e) => setEditInput(e.target.value)}
                                                className="w-full bg-black/80 border border-white/20 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 text-white text-base md:text-xl font-black uppercase min-h-[150px] md:min-h-[200px] focus:ring-0 focus:border-liquid-gold italic"
                                            />
                                            <div className="flex gap-4 md:gap-6">
                                                <button 
                                                    onClick={handleSaveEdit}
                                                    className="flex-1 bg-liquid-gold text-black py-6 md:py-8 rounded-[2rem] font-black text-[12px] md:text-[15px] uppercase tracking-[0.3em] shadow-gold-glow active:scale-95 italic"
                                                >
                                                    SOBRESCRIBIR_REGISTRO
                                                </button>
                                                <button 
                                                    onClick={() => setEditingIdx(null)}
                                                    className="px-8 md:px-10 bg-black/60 text-white rounded-[2rem] hover:bg-white/10 border border-white/10 transition-all"
                                                >
                                                    <XMarkIcon className="w-8 h-8" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="group relative">
                                            <button
                                                onClick={() => setActividad(acc)}
                                                className={`w-full text-left p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border transition-all duration-700 flex items-center justify-between overflow-hidden relative ${
                                                    actividad === acc 
                                                    ? 'bg-liquid-gold/10 border-liquid-gold/60 text-white shadow-gold-glow' 
                                                    : 'bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/20 hover:bg-white/[0.06]'
                                                }`}
                                            >
                                                {actividad === acc && (
                                                    <motion.div 
                                                        layoutId="glow" 
                                                        className="absolute inset-0 bg-gradient-to-r from-liquid-gold/10 via-transparent to-liquid-gold/10 pointer-events-none" 
                                                    />
                                                )}
                                                <div className="flex flex-col gap-3 relative z-10 min-w-0 w-full">
                                                    <div className="flex items-center gap-3">
                                                        <LayersIcon className={`w-4 h-4 ${actividad === acc ? 'text-liquid-gold shadow-gold-glow' : 'text-slate-700'}`} />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40 font-mono italic">NODE_REG_{idx + 1}</span>
                                                    </div>
                                                    <span className={`text-base md:text-xl font-black uppercase italic tracking-tight leading-tight pr-20 transition-all duration-500 ${actividad === acc ? 'text-white' : 'group-hover:text-white'}`}>
                                                        {acc}
                                                    </span>
                                                </div>
                                                {actividad === acc && (
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 md:w-20 md:h-20 bg-liquid-gold rounded-[1.5rem] flex items-center justify-center text-black shadow-gold-glow flex-shrink-0 z-10 animate-scale-in">
                                                        <CheckBadgeIcon className="w-8 h-8 md:w-12 md:h-12" />
                                                    </div>
                                                )}
                                            </button>
                                            
                                            <div className="absolute right-8 md:right-12 top-1/2 -translate-y-1/2 flex items-center gap-4 md:gap-6 opacity-0 group-hover:opacity-100 transition-all translate-x-10 group-hover:translate-x-0 z-20">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingIdx(idx);
                                                        setEditInput(acc);
                                                    }}
                                                    className="w-12 h-12 md:w-16 md:h-16 glass-panel-obsidian text-white rounded-2xl border border-white/10 hover:bg-liquid-gold hover:text-black hover:border-liquid-gold transition-all shadow-2xl flex items-center justify-center"
                                                >
                                                    <PencilIcon className="w-6 h-6 md:w-8 md:h-8" />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteAct(idx, e)}
                                                    className="w-12 h-12 md:w-16 md:h-16 glass-panel-obsidian text-rose-500 rounded-2xl border border-rose-500/10 hover:bg-rose-600 hover:text-white transition-all shadow-2xl flex items-center justify-center"
                                                >
                                                    <TrashIcon className="w-6 h-6 md:w-8 md:h-8" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {localActividades.length === 0 && !isAdding && (
                            <div className="p-16 md:p-24 bg-liquid-gold/5 border-2 border-dashed border-liquid-gold/20 rounded-[3rem] md:rounded-[4rem] text-center flex flex-col items-center gap-8">
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-liquid-gold/10 rounded-full flex items-center justify-center text-liquid-gold/40 animate-pulse border border-liquid-gold/20 shadow-gold-glow-soft">
                                    <ExclamationTriangleIcon className="w-12 h-12 md:w-16 md:h-16" />
                                </div>
                                <p className="text-[12px] md:text-[16px] text-liquid-gold font-black uppercase tracking-[0.4em] max-w-sm italic leading-relaxed">
                                    PROTOCOL_PENDING: Inyecte registro de actividad para habilitar despliegue.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Execution Parameters */}
                <div className="space-y-10 md:space-y-14">
                    {/* Execution Mode */}
                    <div className="space-y-8">
                        <label className="flex items-center gap-4 text-[12px] md:text-[14px] text-slate-400 font-black uppercase tracking-[0.4em] italic">
                            <CpuIcon className="w-6 h-6 text-liquid-gold animate-pulse" />
                            Modo de Ejecución
                        </label>
                        <div className="grid grid-cols-2 p-3 bg-black/60 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-2xl tactical-border">
                            <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none" />
                            {['NUEVO', 'RENOVACION'].map((m) => (
                                <button
                                    key={m}
                                    onClick={() => setModo(m as 'NUEVO' | 'RENOVACION')}
                                    className={`relative z-10 py-6 md:py-8 rounded-[2rem] text-[12px] md:text-[15px] font-black uppercase tracking-[0.4em] transition-all duration-700 italic ${
                                        modo === m 
                                        ? 'text-black shadow-gold-glow' 
                                        : 'text-slate-500 hover:text-white'
                                    }`}
                                >
                                    {modo === m && (
                                        <motion.div 
                                            layoutId="mode-bg"
                                            className="absolute inset-0 bg-liquid-gold rounded-[2rem] -z-10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    {m === 'NUEVO' ? 'Primer Talonario' : 'Renovación SRI'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SRI Credentials */}
                    <div className="glass-panel-obsidian border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 space-y-10 md:space-y-12 relative overflow-hidden shadow-2xl tactical-border">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-liquid-gold/[0.03] blur-[120px] pointer-events-none" />
                        
                        <div className="grid grid-cols-2 gap-8 md:gap-12 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[11px] md:text-[13px] text-liquid-gold font-black uppercase tracking-[0.4em] ml-2 italic">Establecimiento</label>
                                <div className="relative group/input">
                                    <MapPinIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-liquid-gold/40 group-focus-within/input:text-liquid-gold transition-colors" />
                                    <select 
                                        value={establecimiento}
                                        onChange={(e) => setEstablecimiento(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-[2rem] py-6 md:py-8 pl-16 pr-8 text-white font-black text-xl md:text-3xl focus:border-liquid-gold focus:ring-0 transition-all uppercase tracking-widest italic appearance-none outline-none cursor-pointer text-center"
                                    >
                                        {availableEstablecimientos.map(e => (
                                            <option key={e.codigo} value={e.codigo} className="bg-slate-900 text-white italic">{e.codigo}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[11px] md:text-[13px] text-liquid-gold font-black uppercase tracking-[0.4em] ml-2 italic">Punto de Emisión</label>
                                <div className="relative group/input">
                                    <BoltIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-liquid-gold/40 group-focus-within/input:text-liquid-gold transition-colors" />
                                    <input 
                                        type="text"
                                        value={puntoEmision}
                                        onChange={(e) => setPuntoEmision(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        placeholder="001"
                                        className="w-full bg-black/60 border border-white/10 rounded-[2rem] py-6 md:py-8 pl-16 pr-8 text-white font-black text-xl md:text-3xl placeholder:text-white/10 focus:border-liquid-gold focus:ring-0 transition-all uppercase tracking-widest italic text-center"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <label className="text-[11px] md:text-[13px] text-liquid-gold font-black uppercase tracking-[0.4em] ml-2 italic">Clave de Acceso SRI</label>
                            <div className="relative group/pass">
                                <KeyIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-liquid-gold/40 group-focus-within/pass:text-liquid-gold transition-colors" />
                                <input 
                                    type="password"
                                    value={clave}
                                    onChange={(e) => setClave(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/80 border border-white/10 rounded-[2rem] py-6 md:py-8 pl-16 pr-8 text-white font-black text-xl md:text-3xl placeholder:text-white/10 focus:border-liquid-gold focus:ring-0 transition-all tracking-[0.6em] md:tracking-[0.8em] italic"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/[0.02] rounded-xl border border-white/5 flex items-center justify-center text-white/10 group-focus-within/pass:text-liquid-gold group-focus-within/pass:border-liquid-gold/30 transition-all">
                                    <ShieldCheckIcon className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <ValidationTerminal active={isSubmitting || !!(actividad && establecimiento && puntoEmision && clave)} />

                        <div className="pt-6">
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormValid || isSubmitting}
                                className={`w-full group relative overflow-hidden rounded-[2.5rem] py-10 md:py-12 flex items-center justify-center gap-6 transition-all duration-700 shadow-2xl active:scale-[0.98] ${
                                    !isFormValid 
                                    ? 'bg-white/5 text-slate-700 cursor-not-allowed border border-white/5' 
                                    : 'bg-liquid-gold text-black shadow-gold-glow hover:scale-[1.01]'
                                }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                
                                {isSubmitting ? (
                                    <>
                                        <ArrowPathIcon className="w-8 h-8 md:w-10 md:h-10 animate-spin" />
                                        <span className="text-xl md:text-3xl font-black uppercase tracking-[0.5em] italic">DEPLOYING_PROTOCOL...</span>
                                    </>
                                ) : (
                                    <>
                                        <RocketLaunchIcon className={`w-8 h-8 md:w-10 md:h-10 transition-transform duration-500 ${isFormValid ? 'group-hover:-translate-y-2 group-hover:translate-x-2' : ''}`} />
                                        <span className="text-xl md:text-3xl font-black uppercase tracking-[0.5em] italic">Desplegar Protocolo</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back Navigation */}
            <div className="flex justify-center pt-10 md:pt-16 pb-10 border-t border-white/10">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-4 text-[12px] md:text-[15px] text-slate-600 font-black uppercase tracking-[0.4em] hover:text-liquid-gold transition-all duration-500 group active:scale-95 italic"
                >
                    <span className="group-hover:-translate-x-4 transition-transform">←</span> RETORNAR_A_IDENTIDAD
                </button>
            </div>
        </div>
    );
};

export default SriSolicitudStep;
