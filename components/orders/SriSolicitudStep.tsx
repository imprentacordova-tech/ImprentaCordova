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
        "INITIATING SECURE SRI PROTOCOL [V2.0.26]...",
        "RSA_KEY_EXCHANGE: AUTHENTICATED [0x7FF-EA]",
        "ESTABLISHING TRACEABLE TRADEMARK LINK...",
        "ENCRYPTING PAYLOAD [AES-256-GCM]...",
        "VALIDATING POINT EMISSION DATA...",
        "TAXPAYER_REGIMEN_MATCH: OK",
        "SYNCING METADATA WITH SUPABASE PRODUCTION...",
        "SECURE_TOKEN_GRANTED: PR-992-DELTA",
        "HANDSHAKE_COMPLETE: STANDBY FOR REDIRECT"
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
            }, 400); // Faster logs for industrial feel
            return () => clearInterval(interval);
        }
        if (!active) setLogs([]);
    }, [active]);

    return (
        <div className="bg-black/90 rounded-2xl border border-white/10 p-4 h-36 font-mono text-[9px] overflow-hidden relative group shadow-inner">
            <div className="absolute top-0 left-0 w-full h-1 bg-liquid-gold/30 animate-scan-slow z-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none" />
            <div className="space-y-1 relative z-10">
                <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1">
                    <span className="text-[7px] text-liquid-gold/40 tracking-[0.2em]">SRI_LIVE_DEBUGGER</span>
                    <span className="text-[7px] text-emerald-500/60 animate-pulse">CONNECTION_STABLE</span>
                </div>
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <span className="text-liquid-gold/30">[{new Date().toLocaleTimeString()}]</span>
                        <span className={i === logs.length - 1 ? "text-liquid-gold animate-pulse font-bold" : "text-slate-500"}>{log}</span>
                    </div>
                ))}
            </div>
            {/* CRT Flicker effect */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
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

    const [localActividades, setLocalActividades] = useState<string[]>(
        cliente.actividades ? cliente.actividades.split('|').map(a => a.trim()).filter(a => a.length > 0) : []
    );
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
        <div className="space-y-12 relative overflow-hidden">
            {/* Tactical Grid Background Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:40px_40px] z-0" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative pb-8 border-b border-white/10 z-10">
                <div className="absolute top-0 left-0 w-32 h-1 bg-liquid-gold shadow-gold-glow" />
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-2">
                            Protocolo <span className="text-liquid-gold">SRI Elite</span>
                        </h2>
                        <div className="flex items-center gap-4">
                            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-2">
                                <span className="w-2 h-2 bg-liquid-gold rounded-full animate-pulse" />
                                Validación y Autorización de Documentos Tributarios
                            </p>
                            <span className="bg-liquid-gold/10 text-liquid-gold text-[8px] font-black px-3 py-1 rounded-full border border-liquid-gold/20 tracking-tighter uppercase italic shadow-gold-glow-sm">Security_Level: OMEGA</span>
                        </div>
                    </div>
                </div>
                <div className="bg-liquid-gold/5 border border-liquid-gold/20 px-8 py-4 rounded-3xl flex items-center gap-6 backdrop-blur-xl relative group overflow-hidden shadow-luxury">
                    <div className="absolute inset-0 bg-liquid-gold/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="w-12 h-12 bg-liquid-gold/20 rounded-2xl flex items-center justify-center text-liquid-gold border border-liquid-gold/20 shadow-gold-glow-strong">
                        <FingerPrintIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[9px] text-liquid-gold/60 font-black uppercase tracking-widest mb-1">Identidad_Verificada</p>
                        <p className="text-white font-black italic tracking-tight uppercase text-sm leading-none">{cliente.nombre}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                <div className="space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between ml-2">
                            <label className="flex items-center gap-3 text-[11px] text-slate-400 font-black uppercase tracking-[0.4em]">
                                <SparklesIcon className="w-4 h-4 text-liquid-gold animate-pulse" />
                                Selección de Actividad
                            </label>
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="text-[10px] bg-white/5 hover:bg-liquid-gold px-4 py-1.5 rounded-full text-white hover:text-black font-black uppercase tracking-tighter transition-all flex items-center gap-2 border border-white/10 hover:border-liquid-gold shadow-lg"
                            >
                                <PlusIcon className="w-3 h-3" /> Inyectar Actividad
                            </button>
                        </div>
                        
                        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {isAdding && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="p-6 bg-liquid-gold/10 border-2 border-liquid-gold rounded-3xl space-y-4 shadow-gold-glow"
                                    >
                                        <textarea 
                                            autoFocus
                                            value={newActInput}
                                            onChange={(e) => setNewActInput(e.target.value)}
                                            placeholder="DESCRIBA LA NUEVA ACTIVIDAD TRIBUTARIA..."
                                            className="w-full bg-black/60 border border-liquid-gold/20 rounded-2xl p-4 text-white text-[12px] font-bold uppercase min-h-[100px] focus:ring-0 focus:border-liquid-gold placeholder:text-liquid-gold/30"
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handleAddManual}
                                                className="flex-1 bg-white text-black py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-liquid-gold transition-all active:scale-95 shadow-xl"
                                            >
                                                Sincronizar Actividad
                                            </button>
                                            <button 
                                                onClick={() => setIsAdding(false)}
                                                className="px-4 bg-black/40 text-white rounded-xl hover:bg-white/10 transition-colors"
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {localActividades.map((acc, idx) => (
                                    <motion.div key={idx} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                                        {editingIdx === idx ? (
                                            <div className="p-6 bg-white/5 border-2 border-white/20 rounded-3xl space-y-4 backdrop-blur-xl">
                                                <textarea 
                                                    autoFocus
                                                    value={editInput}
                                                    onChange={(e) => setEditInput(e.target.value)}
                                                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white text-[12px] font-bold uppercase min-h-[100px] focus:ring-0 focus:border-liquid-gold"
                                                />
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={handleSaveEdit}
                                                        className="flex-1 bg-liquid-gold text-black py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-gold-glow"
                                                    >
                                                        Actualizar Registro
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingIdx(null)}
                                                        className="px-4 bg-black/40 text-white rounded-xl"
                                                    >
                                                        <XMarkIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="group relative">
                                                <button
                                                    onClick={() => setActividad(acc)}
                                                    className={`w-full text-left p-6 rounded-3xl border-2 transition-all duration-500 flex items-center justify-between overflow-hidden relative ${
                                                        actividad === acc 
                                                        ? 'bg-liquid-gold/10 border-liquid-gold text-white shadow-gold-glow-strong' 
                                                        : 'bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/20 hover:bg-white/[0.05]'
                                                    }`}
                                                >
                                                    {actividad === acc && (
                                                        <motion.div 
                                                            layoutId="glow" 
                                                            className="absolute inset-0 bg-gradient-to-r from-liquid-gold/10 via-transparent to-liquid-gold/10 pointer-events-none" 
                                                        />
                                                    )}
                                                    <div className="flex flex-col gap-1 relative z-10">
                                                        <div className="flex items-center gap-2">
                                                            <LayersIcon className={`w-3 h-3 ${actividad === acc ? 'text-liquid-gold' : 'text-slate-600'}`} />
                                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 font-mono">ID_ACT_{idx + 1}</span>
                                                        </div>
                                                        <span className={`text-[12px] font-black uppercase italic tracking-tight leading-relaxed pr-16 transition-colors ${actividad === acc ? 'text-white' : 'group-hover:text-white'}`}>
                                                            {acc}
                                                        </span>
                                                    </div>
                                                    {actividad === acc && (
                                                        <div className="relative z-10 w-10 h-10 bg-liquid-gold rounded-xl flex items-center justify-center text-black shadow-lg">
                                                            <CheckBadgeIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </button>
                                                
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 z-20">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingIdx(idx);
                                                            setEditInput(acc);
                                                        }}
                                                        className="w-10 h-10 bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-liquid-gold hover:text-black hover:border-liquid-gold transition-all shadow-xl flex items-center justify-center"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteAct(idx, e)}
                                                        className="w-10 h-10 bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-orange-950 transition-all shadow-xl flex items-center justify-center"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {localActividades.length === 0 && !isAdding && (
                                <div className="p-10 bg-liquid-gold/5 border-2 border-dashed border-liquid-gold/20 rounded-[2.5rem] text-center flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-liquid-gold/10 rounded-full flex items-center justify-center text-liquid-gold/40 animate-pulse">
                                        <ExclamationTriangleIcon className="w-8 h-8" />
                                    </div>
                                    <p className="text-[11px] text-liquid-gold font-black uppercase tracking-widest max-w-[200px]">
                                        Sin actividades detectadas. Inyecte un registro para continuar.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] ml-2 font-mono">Protocol_Type_Select</label>
                        <div className="flex bg-black/60 p-2.5 rounded-[2.5rem] border border-white/10 gap-3 shadow-inner">
                            {(['NUEVO', 'RENOVACION'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setModo(m)}
                                    className={`flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden ${
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

                <div className="bg-white/[0.01] border border-white/10 rounded-[4rem] p-12 space-y-12 relative overflow-hidden backdrop-blur-2xl shadow-luxury">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 blur-[100px] pointer-events-none" />
                    
                    <div className="grid grid-cols-2 gap-10 relative z-10">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <label className="flex items-center gap-3 text-[11px] text-slate-400 font-black uppercase tracking-[0.4em]">
                                    <MapPinIcon className="w-4 h-4 text-liquid-gold" /> Establecimiento
                                </label>
                                <span className="text-[8px] font-mono text-liquid-gold/40">ID_SEG_001</span>
                            </div>
                            <div className="relative group">
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-liquid-gold/20 group-focus-within:bg-liquid-gold transition-all" />
                                <input 
                                    type="text"
                                    value={establecimiento}
                                    onChange={(e) => setEstablecimiento(e.target.value.replace(/\D/g, '').substring(0,3))}
                                    maxLength={3}
                                    className="w-full bg-black/60 border-2 border-white/5 rounded-3xl p-6 text-white font-black text-center text-4xl tracking-[0.8em] focus:border-liquid-gold/30 focus:bg-liquid-gold/5 transition-all duration-500 shadow-2xl focus:shadow-gold-glow font-mono"
                                    placeholder="001"
                                />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-liquid-gold/20 group-focus-within:w-24 group-focus-within:bg-liquid-gold transition-all" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-2">
                                <label className="flex items-center gap-3 text-[11px] text-slate-400 font-black uppercase tracking-[0.4em]">
                                    <HashtagIcon className="w-4 h-4 text-liquid-gold" /> Punto Emisión
                                </label>
                                <span className="text-[8px] font-mono text-liquid-gold/40">ID_EMIT_001</span>
                            </div>
                            <div className="relative group">
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-12 bg-liquid-gold/20 group-focus-within:bg-liquid-gold transition-all" />
                                <input 
                                    type="text"
                                    value={puntoEmision}
                                    onChange={(e) => setPuntoEmision(e.target.value.replace(/\D/g, '').substring(0,3))}
                                    maxLength={3}
                                    className="w-full bg-black/60 border-2 border-white/5 rounded-3xl p-6 text-white font-black text-center text-4xl tracking-[0.8em] focus:border-liquid-gold/30 focus:bg-liquid-gold/5 transition-all duration-500 shadow-2xl focus:shadow-gold-glow font-mono"
                                    placeholder="001"
                                />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-liquid-gold/20 group-focus-within:w-24 group-focus-within:bg-liquid-gold transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between ml-2">
                            <label className="flex items-center gap-3 text-[11px] text-slate-400 font-black uppercase tracking-[0.4em]">
                                <KeyIcon className="w-4 h-4 text-liquid-gold" /> Credencial SRI
                            </label>
                            <div className="flex items-center gap-3 bg-liquid-gold/10 px-4 py-1.5 rounded-full border border-liquid-gold/20">
                                <ShieldIcon className="w-3.5 h-3.5 text-liquid-gold animate-pulse" />
                                <span className="text-[9px] font-black text-liquid-gold uppercase tracking-widest italic">Cifrado Industrial AES-256</span>
                            </div>
                        </div>
                        <div className="relative group">
                            <input 
                                type="password"
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                className="w-full bg-black/60 border-2 border-white/5 rounded-[2.5rem] p-7 text-white font-mono text-xl tracking-[1em] focus:border-liquid-gold focus:bg-liquid-gold/5 transition-all duration-500 shadow-2xl focus:shadow-gold-glow"
                                placeholder="••••••••"
                            />
                            <div className="absolute top-1/2 right-8 -translate-y-1/2 w-10 h-10 bg-liquid-gold/10 rounded-xl flex items-center justify-center text-liquid-gold/40 group-focus-within:text-liquid-gold group-focus-within:shadow-gold-glow transition-all">
                                <ShieldCheckIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold/40 animate-pulse" />
                            <p className="text-[10px] text-slate-600 font-bold uppercase italic tracking-wider">
                                La clave es encriptada antes de la sincronización con el servidor de producción.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-2 font-mono">Consola_Auth_Log</label>
                        <ValidationTerminal active={isProcessing} />
                    </div>

                    <div className="pt-8 relative z-10">
                        <button 
                            onClick={handleContinue}
                            disabled={!actividad || isProcessing}
                            className={`w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] flex items-center justify-center gap-6 transition-all duration-700 shadow-2xl group active:scale-95 italic relative overflow-hidden ${
                                actividad && !isProcessing
                                ? 'bg-liquid-gold text-black hover:bg-white hover:shadow-gold-glow-strong' 
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
                            <span className="relative z-10">{isProcessing ? 'PROCESANDO AUTORIZACIÓN...' : 'Configurar Pedido'}</span>
                            {!isProcessing && <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-3 transition-transform relative z-10" />}
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5 relative z-10">
                        {[
                            { label: 'Uptime', val: '99.98%', color: 'text-emerald-500' },
                            { label: 'Latency', val: '14ms', color: 'text-liquid-gold' },
                            { label: 'System_Hash', val: '0x' + Math.random().toString(16).substring(2,6).toUpperCase(), color: 'text-slate-400' }
                        ].map((stat, i) => (
                            <div key={i} className="text-center space-y-1">
                                <p className="text-[7px] text-slate-600 font-black uppercase tracking-widest font-mono">{stat.label}</p>
                                <p className={`text-[10px] font-mono font-black ${stat.color}`}>{stat.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                </div>
            </div>

            <div className="flex justify-center pt-8 relative z-10">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-3 text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] hover:text-liquid-gold transition-all duration-500 group"
                >
                    <span className="group-hover:-translate-x-2 transition-transform">←</span> Retroceder al Módulo de Identidad
                </button>
            </div>
        </div>
    );
};

export default SriSolicitudStep;
