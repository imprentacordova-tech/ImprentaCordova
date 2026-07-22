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
    Loader2Icon,
    DatabaseIcon,
    UploadIcon,
    SearchIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
    EyeIcon,
    EyeSlashIcon
} from '../Icons';
import { Cliente, SriCredential } from '../../types';
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
    const { updateCliente, sriCredentials, upsertSriCredential, bulkAddSriCredentials } = useData();
    
    // RUC limpio para búsqueda en Bóveda
    const cleanRuc = (cliente.ruc || cliente.cedula || '').replace(/\D/g, '');

    // Buscar clave preexistente en la Bóveda SRI
    const vaultCred = (sriCredentials || []).find(c => {
        const credRuc = (c.ruc || '').replace(/\D/g, '');
        return (cleanRuc && credRuc === cleanRuc) || c.ruc === cliente.ruc || c.ruc === cliente.cedula;
    });

    const [actividad, setActividad] = useState(initialData.actividad || '');
    const [establecimiento, setEstablecimiento] = useState(initialData.establecimiento || '001');
    const [puntoEmision, setPuntoEmision] = useState(initialData.puntoEmision || '001');
    const [clave, setClave] = useState(initialData.clave || vaultCred?.password || '');
    const [modo, setModo] = useState<'NUEVO' | 'RENOVACION'>(initialData.modo || 'RENOVACION');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bóveda & UI States
    const [showClave, setShowClave] = useState(false);
    const [saveToVault, setSaveToVault] = useState(true);
    const [showVaultModal, setShowVaultModal] = useState(false);
    const [vaultSearch, setVaultSearch] = useState('');
    const [isImportingCsv, setIsImportingCsv] = useState(false);
    const [importMessage, setImportMessage] = useState<string | null>(null);

    // Autocompletar clave si existe en la bóveda y aún no se ha ingresado una
    useEffect(() => {
        if (vaultCred?.password && !initialData.clave && !clave) {
            setClave(vaultCred.password);
        }
    }, [vaultCred, initialData.clave]);

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

    // Procesar importación CSV de contraseñas de Chrome
    const handleImportChromeCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImportingCsv(true);
        setImportMessage(null);
        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/);
            if (lines.length <= 1) return;

            const delimiter = lines[0].includes(';') ? ';' : ',';
            const headers = lines[0].toLowerCase().split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

            let idxUser = headers.indexOf('username');
            let idxPass = headers.indexOf('password');
            let idxName = headers.indexOf('name');

            if (idxUser === -1 && headers.length >= 4) {
                idxName = 0; idxUser = 2; idxPass = 3;
            }

            const creds: SriCredential[] = [];
            lines.slice(1).forEach(line => {
                if (!line.trim()) return;
                const parts: string[] = [];
                let current = "";
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') inQuotes = !inQuotes;
                    else if (char === delimiter && !inQuotes) {
                        parts.push(current);
                        current = "";
                    } else {
                        current += char;
                    }
                }
                parts.push(current);

                if (parts.length > Math.max(idxUser, idxPass)) {
                    const rucRaw = parts[idxUser]?.trim() || '';
                    const match13 = rucRaw.match(/\b\d{13}\b/);
                    const match10 = rucRaw.match(/\b\d{10}\b/);
                    const rucClean = match13 ? match13[0] : (match10 ? match10[0] : rucRaw.replace(/\D/g, ''));
                    const pass = parts[idxPass]?.trim() || '';
                    const name = parts[idxName]?.trim() || '';

                    if ((rucClean.length === 10 || rucClean.length === 13) && pass) {
                        creds.push({
                            ruc: rucClean,
                            password: pass,
                            origen: name || 'Chrome CSV',
                            updatedAt: new Date().toISOString()
                        });
                    }
                }
            });

            if (creds.length > 0) {
                await bulkAddSriCredentials(creds);
                setImportMessage(`✅ Exportación exitosa: ${creds.length} claves cargadas a la Bóveda SRI.`);
                const matching = creds.find(c => c.ruc === cleanRuc);
                if (matching?.password) {
                    setClave(matching.password);
                }
            } else {
                setImportMessage('⚠️ No se encontraron contraseñas válidas en el CSV. Formato requerido: username, password, name.');
            }
        } catch (err) {
            console.error('[SriSolicitudStep] Error al importar CSV:', err);
            setImportMessage('❌ Error al procesar el archivo CSV.');
        } finally {
            setIsImportingCsv(false);
            e.target.value = '';
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Si la clave ingresada no es vacía y saveToVault está activado, guardar en Supabase
            if (saveToVault && clave.trim() && cleanRuc) {
                await upsertSriCredential({
                    ruc: cleanRuc,
                    password: clave.trim(),
                    origen: 'Nueva Orden SRI',
                    updatedAt: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error("[SriSolicitudStep] Error al sincronizar con Bóveda SRI:", err);
        }

        setTimeout(() => {
            onComplete({
                actividad,
                establecimiento,
                puntoEmision,
                clave,
                modo
            });
        }, 400);
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

                        {/* SECCIÓN CLAVE SRI CONECTADA A LA BÓVEDA (CHROME CSV) */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                                    <KeyIcon className="w-3.5 h-3.5 text-brand-blue" />
                                    Clave / Código SRI
                                </label>

                                {vaultCred?.password ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                                        BÓVEDA SRI ✅ {vaultCred.origen ? `(${vaultCred.origen})` : ''}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                        <ExclamationTriangleIcon className="w-3 h-3 text-amber-600" />
                                        PENDIENTE EN BÓVEDA
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showClave ? "text" : "password"}
                                        value={clave}
                                        onChange={e => setClave(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-9 py-2.5 font-mono font-bold text-slate-900 text-sm outline-none focus:border-brand-blue shadow-sm"
                                        placeholder="Ingresa clave o código SRI..."
                                    />
                                    <KeyIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <button
                                        type="button"
                                        onClick={() => setShowClave(!showClave)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        title={showClave ? "Ocultar clave" : "Mostrar clave"}
                                    >
                                        {showClave ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowVaultModal(true)}
                                    className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
                                    title="Abrir Bóveda de Claves SRI e importar CSV Chrome"
                                >
                                    <DatabaseIcon className="w-4 h-4 text-amber-400" />
                                    <span>Bóveda CSV</span>
                                </button>
                            </div>

                            {/* Botón rápido si existe clave en Bóveda pero no está aplicada */}
                            {vaultCred?.password && clave !== vaultCred.password && (
                                <button
                                    type="button"
                                    onClick={() => setClave(vaultCred.password || '')}
                                    className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors"
                                >
                                    <KeyIcon className="w-3 h-3 text-emerald-600" />
                                    Usar clave registrada en Bóveda ({vaultCred.password.slice(0, 3)}*****)
                                </button>
                            )}

                            {/* Guardar en Bóveda checkbox */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                                <input
                                    type="checkbox"
                                    id="saveVaultCheck"
                                    checked={saveToVault}
                                    onChange={e => setSaveToVault(e.target.checked)}
                                    className="w-3.5 h-3.5 accent-brand-blue rounded cursor-pointer"
                                />
                                <label htmlFor="saveVaultCheck" className="text-[10px] font-semibold text-slate-500 cursor-pointer select-none">
                                    Sincronizar automáticamente con la Bóveda SRI en Supabase
                                </label>
                            </div>
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

            {/* MODAL DE BÓVEDA DE CLAVES SRI (CHROME CSV) */}
            <AnimatePresence>
                {showVaultModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            {/* Header */}
                            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 font-black">
                                        <DatabaseIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black uppercase tracking-wider text-white">
                                            Bóveda de Claves SRI (Chrome CSV)
                                        </h3>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            Gestor de Credenciales Fiscales e Importación de Claves
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowVaultModal(false)}
                                    className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                {/* Contribuyente actual */}
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Contribuyente Seleccionado</span>
                                        <span className="font-black text-slate-900">{cliente.nombre}</span>
                                        <span className="font-mono text-slate-500 ml-2">({cliente.ruc || cliente.cedula})</span>
                                    </div>
                                    {vaultCred?.password ? (
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                                            En Bóveda SRI ✅
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                                            No Registrado ⚠️
                                        </span>
                                    )}
                                </div>

                                {/* Importador de CSV Chrome */}
                                <div className="p-4 bg-brand-blue/5 border border-brand-blue/20 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2 text-brand-blue font-black text-[11px] uppercase">
                                            <UploadIcon className="w-4 h-4" /> Importar CSV de Chrome
                                        </div>
                                        <label className="cursor-pointer px-3 py-1.5 bg-brand-blue text-white rounded-lg text-[10px] font-black uppercase hover:bg-brand-blue/90 transition-all shadow-sm">
                                            {isImportingCsv ? 'Procesando...' : 'Seleccionar Archivo CSV'}
                                            <input
                                                type="file"
                                                accept=".csv"
                                                onChange={handleImportChromeCsv}
                                                disabled={isImportingCsv}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-slate-500">
                                        Selecciona el archivo CSV exportado desde Google Chrome (Contraseñas). Se vinculará el RUC (`username`) con la clave SRI (`password`).
                                    </p>
                                    {importMessage && (
                                        <div className="text-[11px] font-bold mt-1 text-slate-800 bg-white p-2 rounded border border-slate-200">
                                            {importMessage}
                                        </div>
                                    )}
                                </div>

                                {/* Buscador en Bóveda */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={vaultSearch}
                                        onChange={e => setVaultSearch(e.target.value)}
                                        placeholder="Buscar en la Bóveda por RUC, Cédula u Origen..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono outline-none focus:border-brand-blue"
                                    />
                                    <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                </div>

                                {/* Lista de Credenciales */}
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {(sriCredentials || [])
                                        .filter(c => {
                                            if (!vaultSearch.trim()) return true;
                                            const q = vaultSearch.toLowerCase();
                                            return c.ruc.toLowerCase().includes(q) || (c.origen || '').toLowerCase().includes(q) || (c.password || '').toLowerCase().includes(q);
                                        })
                                        .map((cred, idx) => {
                                            const isCurrent = (cred.ruc || '').replace(/\D/g, '') === cleanRuc;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                                                        isCurrent
                                                            ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                                                            : 'bg-white border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs font-black text-slate-900">{cred.ruc}</span>
                                                            {isCurrent && (
                                                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                                                    Cliente Actual
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                                            <span>Origen: <strong>{cred.origen || 'Manual'}</strong></span>
                                                            <span>•</span>
                                                            <span className="font-mono text-slate-600">Clave: {cred.password ? `${cred.password.slice(0, 4)}***` : 'N/A'}</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (cred.password) {
                                                                setClave(cred.password);
                                                                setShowVaultModal(false);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 bg-brand-blue text-white rounded-lg text-[10px] font-black uppercase hover:bg-brand-blue/90"
                                                    >
                                                        Usar Clave
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    {sriCredentials?.length === 0 && (
                                        <div className="p-6 text-center text-slate-400 text-xs font-medium">
                                            No hay claves almacenadas en la Bóveda SRI. Usa el botón "Seleccionar Archivo CSV" para importar tus claves de Chrome.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Modal */}
                            <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowVaultModal(false)}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-black uppercase"
                                >
                                    Cerrar Bóveda
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SriSolicitudStep;

