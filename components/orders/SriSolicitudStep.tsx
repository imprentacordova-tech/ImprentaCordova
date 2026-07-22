import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FingerPrintIcon, 
    HashtagIcon, 
    KeyIcon, 
    MapPinIcon,
    ArrowRightIcon,
    SparklesIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    ShieldCheckIcon,
    Building2Icon,
    CheckCircleIcon,
    ChevronLeftIcon,
    Loader2Icon
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
    const [modo, setModo] = useState<'NUEVO' | 'RENOVACION'>(initialData.modo || 'RENOVACION');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [localActividades, setLocalActividades] = useState<string[]>(() => {
        if (cliente.fiscal_data?.actividades && cliente.fiscal_data.actividades.length > 0) {
            return cliente.fiscal_data.actividades.map(a => a.descripcion);
        }
        return cliente.actividades ? cliente.actividades.split('|').map(a => a.trim()).filter(a => a.length > 0) : [];
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
            console.error("Error al guardar actividades:", err);
        }
    };

    const handleAddManual = async () => {
        if (!newActInput.trim()) return;
        const formatted = newActInput.trim();
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
        }, 600);
    };

    const isFormValid = actividad && establecimiento.length === 3 && puntoEmision.length === 3 && clave;

    return (
        <div className="space-y-8">
            {/* Header del Cliente */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest">Contribuyente Seleccionado</span>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{cliente.nombre}</h2>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-500">
                            <span>RUC/CI: <strong>{cliente.ruc || cliente.cedula}</strong></span>
                            <span>•</span>
                            <span>Régimen: <strong className="text-brand-blue">{cliente.regimen || 'General'}</strong></span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-full text-[10px] font-bold">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                    <span>Datos SRI Verificados</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Columna Izquierda: Tipo de Trámite y Actividades */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Selector Modo de Trámite */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            Modo de Solicitud SRI
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setModo('RENOVACION')}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    modo === 'RENOVACION'
                                        ? 'bg-brand-blue/5 border-brand-blue text-brand-blue ring-2 ring-brand-blue/10'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <div className="text-[12px] font-black uppercase">Reimpresión / Renovación</div>
                                <div className="text-[10px] text-slate-400 mt-1">Siguiente talonario o actualización de datos</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setModo('NUEVO')}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                    modo === 'NUEVO'
                                        ? 'bg-brand-blue/5 border-brand-blue text-brand-blue ring-2 ring-brand-blue/10'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <div className="text-[12px] font-black uppercase">Primer Talonario</div>
                                <div className="text-[10px] text-slate-400 mt-1">Primera autorización de imprenta por el SRI</div>
                            </button>
                        </div>
                    </div>

                    {/* Actividades Económicas */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Actividad Económica a Imprimir
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsAdding(true)}
                                className="text-[10px] font-black text-brand-blue hover:underline flex items-center gap-1 uppercase"
                            >
                                <PlusIcon className="w-3.5 h-3.5" /> Agregar Actividad
                            </button>
                        </div>

                        {/* Modal/Input rápido para agregar */}
                        {isAdding && (
                            <div className="flex gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <input
                                    type="text"
                                    value={newActInput}
                                    onChange={e => setNewActInput(e.target.value)}
                                    placeholder="Escribe la actividad económica..."
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-medium outline-none focus:border-brand-blue"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddManual}
                                    className="px-4 py-2 bg-brand-blue text-white text-[10px] font-black uppercase rounded-lg hover:bg-brand-blue/90"
                                >
                                    Guardar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-3 py-2 text-slate-400 hover:text-slate-600 text-[10px]"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}

                        {/* Lista de actividades disponibles */}
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {localActividades.length === 0 ? (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 font-medium">
                                    No hay actividades asociadas. Haz clic en "Agregar Actividad" para ingresar la del comprobante.
                                </div>
                            ) : (
                                localActividades.map((act, idx) => {
                                    const isSelected = actividad === act;
                                    const isEditing = editingIdx === idx;

                                    if (isEditing) {
                                        return (
                                            <div key={idx} className="flex gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                                                <input
                                                    type="text"
                                                    value={editInput}
                                                    onChange={e => setEditInput(e.target.value)}
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleSaveEdit}
                                                    className="px-3 py-1.5 bg-brand-blue text-white text-[10px] font-bold rounded-lg"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setActividad(act)}
                                            className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-brand-blue/5 border-brand-blue text-brand-blue font-bold shadow-sm'
                                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 pr-2">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-brand-blue' : 'bg-slate-300'}`} />
                                                <span className="text-[12px] truncate">{act}</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setEditingIdx(idx); setEditInput(act); }}
                                                    className="p-1 text-slate-400 hover:text-slate-700"
                                                    title="Editar"
                                                >
                                                    <PencilIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteAct(idx, e)}
                                                    className="p-1 text-slate-400 hover:text-red-500"
                                                    title="Eliminar"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Establecimiento, Punto Emisión y Clave */}
                <div className="lg:col-span-5 space-y-6">

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            Parámetros del SRI
                        </label>

                        {/* Establecimiento & Punto Emisión */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                    Establecimiento
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        maxLength={3}
                                        value={establecimiento}
                                        onChange={e => setEstablecimiento(e.target.value.padStart(3, '0').slice(-3))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-center font-black text-slate-900 text-base outline-none focus:border-brand-blue"
                                        placeholder="001"
                                    />
                                </div>
                                <span className="text-[9px] text-slate-400 mt-0.5 block text-center">3 dígitos (Ej. 001)</span>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                    Punto de Emisión
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        maxLength={3}
                                        value={puntoEmision}
                                        onChange={e => setPuntoEmision(e.target.value.padStart(3, '0').slice(-3))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-center font-black text-slate-900 text-base outline-none focus:border-brand-blue"
                                        placeholder="001"
                                    />
                                </div>
                                <span className="text-[9px] text-slate-400 mt-0.5 block text-center">3 dígitos (Ej. 001)</span>
                            </div>
                        </div>

                        {/* Clave del SRI */}
                        <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                Clave / Código de Trámite SRI
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={clave}
                                    onChange={e => setClave(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 font-mono font-bold text-slate-900 text-sm outline-none focus:border-brand-blue"
                                    placeholder="Ingresa clave o código SRI..."
                                />
                                <KeyIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 block">Clave otorgada por el portal del SRI para autorizar impresión</span>
                        </div>
                    </div>

                    {/* Botones de Navegación */}
                    <div className="flex items-center justify-between gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase transition-all"
                        >
                            <ChevronLeftIcon className="w-4 h-4" /> Atrás
                        </button>

                        <button
                            type="button"
                            disabled={!isFormValid || isSubmitting}
                            onClick={handleSubmit}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-blue text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-brand-blue/90 disabled:opacity-40 transition-all shadow-blue-glow-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2Icon className="w-4 h-4 animate-spin" /> Procesando Trámite...
                                </>
                            ) : (
                                <>
                                    Continuar a Selección de Servicios <ArrowRightIcon className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default SriSolicitudStep;
