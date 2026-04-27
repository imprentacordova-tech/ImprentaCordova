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
    XMarkIcon
} from './Icons';
import { Cliente } from '../types';
import { useData } from '../contexts/DataContext';

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                        Solicitud de Autorización
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                        Configuración de Protocolo SRI (Oficial)
                    </p>
                </div>
                <div className="bg-brand-red/10 border border-brand-red/20 px-6 py-3 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-red/20 rounded-xl flex items-center justify-center text-brand-red">
                        <FingerPrintIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] text-brand-red/60 font-black uppercase tracking-widest">Contribuyente</p>
                        <p className="text-white font-black italic tracking-tight uppercase text-xs">{cliente.nombre}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Columna Izquierda: Actividad y Modo */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between ml-2">
                            <label className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">
                                <SparklesIcon className="w-3 h-3 text-brand-red" />
                                Actividad Económica
                            </label>
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="text-[9px] bg-white/5 hover:bg-brand-red px-3 py-1 rounded-full text-white font-black uppercase tracking-tighter transition-all flex items-center gap-1"
                            >
                                <PlusIcon className="w-3 h-3" /> Añadir Manual
                            </button>
                        </div>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {isAdding && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-4 bg-brand-red/20 border-2 border-brand-red rounded-2xl space-y-3"
                                    >
                                        <textarea 
                                            autoFocus
                                            value={newActInput}
                                            onChange={(e) => setNewActInput(e.target.value)}
                                            placeholder="Ej: • A01270201 - CULTIVO DE CACAO"
                                            className="w-full bg-black/40 border-none rounded-xl p-3 text-white text-[11px] font-bold uppercase min-h-[80px] focus:ring-0"
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleAddManual}
                                                className="flex-1 bg-white text-black py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-brand-red hover:text-white transition-all"
                                            >
                                                Guardar en Registro
                                            </button>
                                            <button 
                                                onClick={() => setIsAdding(false)}
                                                className="p-2 bg-black/40 text-white rounded-lg hover:bg-white/10"
                                            >
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {localActividades.map((acc, idx) => (
                                    <motion.div key={idx} layout>
                                        {editingIdx === idx ? (
                                            <div className="p-4 bg-white/10 border-2 border-white/20 rounded-2xl space-y-3">
                                                <textarea 
                                                    autoFocus
                                                    value={editInput}
                                                    onChange={(e) => setEditInput(e.target.value)}
                                                    className="w-full bg-black/40 border-none rounded-xl p-3 text-white text-[11px] font-bold uppercase min-h-[80px] focus:ring-0"
                                                />
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={handleSaveEdit}
                                                        className="flex-1 bg-brand-red text-white py-2 rounded-lg font-black text-[10px] uppercase tracking-widest"
                                                    >
                                                        Actualizar
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingIdx(null)}
                                                        className="p-2 bg-black/40 text-white rounded-lg"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="group relative">
                                                <button
                                                    onClick={() => setActividad(acc)}
                                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                                                        actividad === acc 
                                                        ? 'bg-brand-red/10 border-brand-red text-white shadow-luxury-red' 
                                                        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                                                    }`}
                                                >
                                                    <span className="text-[11px] font-black uppercase italic tracking-tight leading-relaxed pr-12">
                                                        {acc}
                                                    </span>
                                                    {actividad === acc && <CheckBadgeIcon className="w-5 h-5 text-brand-red flex-shrink-0" />}
                                                </button>
                                                
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingIdx(idx);
                                                            setEditInput(acc);
                                                        }}
                                                        className="p-2 bg-black/60 text-white rounded-lg hover:bg-brand-red transition-colors"
                                                    >
                                                        <PencilIcon className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDeleteAct(idx, e)}
                                                        className="p-2 bg-black/60 text-white rounded-lg hover:bg-red-600 transition-colors"
                                                    >
                                                        <TrashIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {localActividades.length === 0 && !isAdding && (
                                <div className="p-6 bg-brand-red/5 border border-dashed border-brand-red/20 rounded-2xl text-center">
                                    <p className="text-[10px] text-brand-red font-black uppercase tracking-widest">
                                        No se detectaron actividades. Use "Añadir Manual" para registrar la actividad del RUC.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">Tipo de Trámite</label>
                        <div className="flex bg-black/40 p-2 rounded-[2rem] border border-white/5 gap-2">
                            {(['NUEVO', 'RENOVACION'] as const).map(m => (
                                <button
                                    key={m}
                                    onClick={() => setModo(m)}
                                    className={`flex-1 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        modo === m ? 'bg-brand-red text-white shadow-luxury-red' : 'text-slate-600 hover:text-white'
                                    }`}
                                >
                                    {m === 'NUEVO' ? 'Primer Talonario' : 'Renovación SRI'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Datos Técnicos */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-10">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">
                                <MapPinIcon className="w-3 h-3" /> Estab.
                            </label>
                            <input 
                                type="text"
                                value={establecimiento}
                                onChange={(e) => setEstablecimiento(e.target.value)}
                                maxLength={3}
                                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-white font-black text-center text-2xl tracking-[0.5em] focus:border-brand-red transition-all"
                                placeholder="001"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">
                                <HashtagIcon className="w-3 h-3" /> Pto. Emisión
                            </label>
                            <input 
                                type="text"
                                value={puntoEmision}
                                onChange={(e) => setPuntoEmision(e.target.value)}
                                maxLength={3}
                                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-white font-black text-center text-2xl tracking-[0.5em] focus:border-brand-red transition-all"
                                placeholder="001"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-2">
                            <KeyIcon className="w-3 h-3" /> Clave de Acceso SRI (Si tiene)
                        </label>
                        <input 
                            type="password"
                            value={clave}
                            onChange={(e) => setClave(e.target.value)}
                            className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-white font-mono text-lg tracking-widest focus:border-brand-red transition-all"
                            placeholder="********"
                        />
                        <p className="text-[9px] text-slate-600 font-bold uppercase italic">La clave se guardará encriptada para agilizar trámites futuros.</p>
                    </div>

                    <div className="pt-6">
                        <button 
                            onClick={handleContinue}
                            disabled={!actividad}
                            className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 transition-all shadow-luxury group active:scale-95 ${
                                actividad 
                                ? 'bg-white text-black hover:bg-brand-red hover:text-white' 
                                : 'bg-white/10 text-slate-600 cursor-not-allowed'
                            }`}
                        >
                            Continuar a Productos <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <button 
                    onClick={onBack}
                    className="text-[10px] text-slate-600 font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                    ← Volver a Selección de Cliente
                </button>
            </div>
        </div>
    );
};

export default SriSolicitudStep;

