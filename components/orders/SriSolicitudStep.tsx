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
    ShieldCheckIcon
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

    // Manejo de Actividades Locales para edición y acumulación
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
        onComplete({
            actividad,
            establecimiento,
            puntoEmision,
            clave,
            modo
        });
    };

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative pb-8 border-b border-white/10">
                <div className="absolute top-0 left-0 w-32 h-1 bg-brand-red shadow-red-glow" />
                <div>
                    <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-2">
                        Protocolo <span className="text-brand-red">SRI</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
                        Sistema de Validación de Autorización Fiscal
                    </p>
                </div>
                <div className="bg-brand-red/5 border border-brand-red/20 px-8 py-4 rounded-3xl flex items-center gap-6 backdrop-blur-xl relative group overflow-hidden">
                    <div className="absolute inset-0 bg-brand-red/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="w-12 h-12 bg-brand-red/20 rounded-2xl flex items-center justify-center text-brand-red border border-brand-red/20 shadow-red-glow-strong">
                        <FingerPrintIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[9px] text-brand-red/60 font-black uppercase tracking-widest mb-1">Registro Único</p>
                        <p className="text-white font-black italic tracking-tight uppercase text-sm leading-none">{cliente.nombre}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Columna Izquierda: Actividad y Modo */}
                <div className="space-y-10">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between ml-2">
                            <label className="flex items-center gap-3 text-[11px] text-slate-400 font-black uppercase tracking-[0.4em]">
                                <SparklesIcon className="w-4 h-4 text-brand-red animate-pulse" />
                                Actividad Económica
                            </label>
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="text-[10px] bg-white/5 hover:bg-brand-red px-4 py-1.5 rounded-full text-white font-black uppercase tracking-tighter transition-all flex items-center gap-2 border border-white/10 hover:border-brand-red shadow-lg"
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
                                        className="p-6 bg-brand-red/10 border-2 border-brand-red rounded-3xl space-y-4 shadow-red-glow"
                                    >
                                        <textarea 
                                            autoFocus
                                            value={newActInput}
                                            onChange={(e) => setNewActInput(e.target.value)}
                                            placeholder="REGISTRO DE NUEVA ACTIVIDAD ECONÓMICA..."
                                            className="w-full bg-black/60 border border-brand-red/20 rounded-2xl p-4 text-white text-[12px] font-bold uppercase min-h-[100px] focus:ring-0 focus:border-brand-red placeholder:text-brand-red/30"
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handleAddManual}
                                                className="flex-1 bg-white text-black py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all active:scale-95 shadow-xl"
                                            >
                                                Confirmar en Registro
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
                                                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white text-[12px] font-bold uppercase min-h-[100px] focus:ring-0 focus:border-brand-red"
                                                />
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={handleSaveEdit}
                                                        className="flex-1 bg-brand-red text-white py-3 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-red-glow"
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
                                                        ? 'bg-brand-red/10 border-brand-red text-white shadow-red-glow-strong' 
                                                        : 'bg-white/[0.03] border-white/5 text-slate-500 hover:border-white/20 hover:bg-white/[0.05]'
                                                    }`}
                                                >
                                                    {actividad === acc && (
                                                        <motion.div 
                                                            layoutId="glow" 
                                                            className="absolute inset-0 bg-gradient-to-r from-brand-red/10 via-transparent to-brand-red/10 pointer-events-none" 
                                                        />
                                                    )}
                                                    <div className="flex flex-col gap-1 relative z-10">
                                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Item #{idx + 1}</span>
                                                        <span className="text-[12px] font-black uppercase italic tracking-tight leading-relaxed pr-16 group-hover:text-white transition-colors">
                                                            {acc}
                                                        </span>
                                                    </div>
                                                    {actividad === acc && (
                                                        <div className="relative z-10 w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center text-white shadow-lg">
                                                            <CheckBadgeIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </button>
                                                
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingIdx(idx);
                                                            setEditInput(acc);
                                                        }}
                                                        className="w-10 h-10 bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-brand-red hover:border-brand-red transition-all shadow-xl flex items-center justify-center"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteAct(idx, e)}
                                                        className="w-10 h-10 bg-black/80 backdrop-blur-md text-white rounded-xl border border-white/10 hover:bg-red-600 transition-all shadow-xl flex items-center justify-center"
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
                                <div className="p-10 bg-brand-red/5 border-2 border-dashed border-brand-red/20 rounded-[2.5rem] text-center flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center text-brand-red/40 animate-pulse">
                                        <ExclamationTriangleIcon className="w-8 h-8" />
                                    </div>
                                    <p className="text-[11px] text-brand-red font-black uppercase tracking-widest max-w-[200px]">
                                        Sin registros detectados. Inyecte una actividad para continuar.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] ml-2">Protocolo de Trámite</label>
                        <div className="flex bg-black/60 p-2.5 rounded-[2.5rem] border border-white/10 gap-3 shadow-inner">
                            {(['NUEVO', 'RENOVACION'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setModo(m)}
                                    className={`flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 relative overflow-hidden ${
                                        modo === m ? 'text-white' : 'text-slate-600 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {modo === m && (
                                        <motion.div 
                                            layoutId="modeGlow" 
                                            className="absolute inset-0 bg-brand-red shadow-red-glow-strong" 
                                        />
                                    )}
                                    <span className="relative z-10">{m === 'NUEVO' ? 'Primer Talonario' : 'Renovación SRI'}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Datos Técnicos */}
                <div className="bg-white/[0.01] border border-white/10 rounded-[4rem] p-12 space-y-12 relative overflow-hidden backdrop-blur-2xl shadow-luxury">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 blur-[100px] pointer-events-none" />
                    
                    <div className="grid grid-cols-2 gap-10 relative z-10">
                        <div className="space-y-6">
                            <label className="flex items-center gap-3 text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] ml-2">
                                <MapPinIcon className="w-4 h-4 text-brand-red" /> Establecimiento
                            </label>
                            <div className="relative group">
                                <input 
                                    type="text"
                                    value={establecimiento}
                                    onChange={(e) => setEstablecimiento(e.target.value)}
                                    maxLength={3}
                                    className="w-full bg-black/60 border-2 border-white/5 rounded-3xl p-6 text-white font-black text-center text-4xl tracking-[0.8em] focus:border-brand-red focus:bg-brand-red/5 transition-all duration-500 shadow-2xl focus:shadow-red-glow"
                                    placeholder="001"
                                />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-brand-red/20 group-focus-within:w-24 group-focus-within:bg-brand-red transition-all" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <label className="flex items-center gap-3 text-[11px] text-slate-400 font-black uppercase tracking-[0.4em] ml-2">
                                <HashtagIcon className="w-4 h-4 text-brand-red" /> Punto Emisión
                            </label>
                            <div className="relative group">
                                <input 
                                    type="text"
                                    value={puntoEmision}
                                    onChange={(e) => setPuntoEmision(e.target.value)}
                                    maxLength={3}
                                    className="w-full bg-black/60 border-2 border-white/5 rounded-3xl p-6 text-white font-black text-center text-4xl tracking-[0.8em] focus:border-brand-red focus:bg-brand-red/5 transition-all duration-500 shadow-2xl focus:shadow-red-glow"
                                    placeholder="001"
                                />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-brand-red/20 group-focus-within:w-24 group-focus-within:bg-brand-red transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between ml-2">
                            <label className="flex items-center gap-3 text-[11px] text-slate-400 font-black uppercase tracking-[0.4em]">
                                <KeyIcon className="w-4 h-4 text-brand-red" /> Credencial SRI
                            </label>
                            <span className="text-[9px] font-black text-brand-red/40 uppercase tracking-widest italic">Protocolo Encriptado</span>
                        </div>
                        <div className="relative group">
                            <input 
                                type="password"
                                value={clave}
                                onChange={(e) => setClave(e.target.value)}
                                className="w-full bg-black/60 border-2 border-white/5 rounded-3xl p-6 text-white font-mono text-xl tracking-[1em] focus:border-brand-red focus:bg-brand-red/5 transition-all duration-500 shadow-2xl focus:shadow-red-glow"
                                placeholder="••••••••"
                            />
                            <div className="absolute top-1/2 right-6 -translate-y-1/2 w-8 h-8 bg-brand-red/10 rounded-lg flex items-center justify-center text-brand-red/40 group-focus-within:text-brand-red transition-colors">
                                <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-600 font-bold uppercase italic tracking-wider px-2">Los datos de acceso se almacenan bajo cifrado militar para procesos automatizados.</p>
                    </div>

                    <div className="pt-8 relative z-10">
                        <button 
                            onClick={handleContinue}
                            disabled={!actividad}
                            className={`w-full py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-[11px] flex items-center justify-center gap-6 transition-all duration-700 shadow-2xl group active:scale-95 italic ${
                                actividad 
                                ? 'bg-white text-black hover:bg-brand-red hover:text-white hover:shadow-red-glow-strong' 
                                : 'bg-white/5 text-slate-700 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            Proceder al Catálogo <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                        </button>
                    </div>

                    {/* Industrial pattern background */}
                    <div className="absolute bottom-0 right-0 w-48 h-48 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <button 
                    onClick={onBack}
                    className="flex items-center gap-3 text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] hover:text-white transition-all duration-500 group"
                >
                    <span className="group-hover:-translate-x-2 transition-transform">←</span> Retroceder al Módulo de Identidad
                </button>
            </div>
        </div>
    );
};

export default SriSolicitudStep;

