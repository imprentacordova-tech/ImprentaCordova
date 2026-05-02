
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cliente, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { extractDataFromSriPdf } from '../../services/pdfExtraction';
import { sriLookupService, SriRucData } from '../../services/sriLookupService';
import { logActivity } from '../../services/activityLogService';
import { validarIdentificacionEC } from '../../utils';
import {
    SearchIcon, UserPlusIcon, ShieldCheckIcon, CloseIcon, Loader2Icon,
    CheckCircleIcon, SparklesIcon, AddIcon, ArrowRightIcon, PhoneIcon,
    UploadIcon, DocumentTextIcon, LayersIcon, ExclamationTriangleIcon,
    BoltIcon, IdentificationIcon
} from '../Icons';

const InputField: React.FC<{
    label: string;
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    isHighlighted?: boolean;
    error?: string;
    required?: boolean;
    [key: string]: any;
}> = ({ label, name, value, onChange, isHighlighted, error, required, ...props }) => (
    <div className="relative group">
        <input
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className={`peer w-full bg-slate-50 border p-6 pt-10 pb-4 rounded-[1.5rem] text-slate-900 font-bold text-lg focus:ring-4 transition-all uppercase placeholder-transparent
                ${error
                    ? 'border-rose-500/40 focus:ring-rose-500/10 focus:border-rose-500/60'
                    : isHighlighted
                        ? 'border-brand-blue/50 focus:ring-brand-blue/10 focus:border-brand-blue/70 shadow-sm'
                        : 'border-slate-200 focus:ring-brand-blue/10 focus:border-brand-blue/40'
                }`}
            placeholder={label}
            {...props}
        />
        <label htmlFor={name} className={`absolute left-8 top-3.5 text-[10px] font-black uppercase tracking-[0.5em] transition-all peer-placeholder-shown:top-7 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-3.5 peer-focus:text-[10px] pointer-events-none ${error ? 'text-rose-500' : isHighlighted ? 'text-brand-blue' : 'text-slate-500 peer-focus:text-brand-blue'}`}>
            {label} {required && <span className="text-rose-500/50">*</span>} {isHighlighted && "⚡"}
        </label>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
        </div>
        {error && <p className="text-[10px] text-rose-500 font-black mt-2 uppercase tracking-widest bg-rose-50 px-4 py-1.5 rounded-xl inline-block absolute -bottom-7 left-6 z-20 shadow-lg border border-rose-100">{error}</p>}
    </div>
);

type ClientMode = 'EXPRESS' | 'SRI';

export const CreateClientModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onClientCreated: (client: Cliente) => void;
    initialName?: string;
    initialCedulaRuc?: string;
    initialMode?: ClientMode;
    isLocked?: boolean;
}> = ({ isOpen, onClose, onClientCreated, initialName, initialCedulaRuc, initialMode = 'EXPRESS', isLocked = false }) => {

    const [mode, setMode] = useState<ClientMode>(initialMode);

    const [newClienteData, setNewClienteData] = useState({
        nombre: '', nombreComercial: '', cedulaRuc: '', email: '',
        direccion: 'Pasaje, El Oro', regimen: Regimen.GENERAL,
        establecimientoPredeterminado: '001', puntoEmisionPredeterminado: '001',
        numEstablecimientosOpen: 1,
        fiscal_data: {} as any
    });

    const [telefonos, setTelefonos] = useState<string[]>([]);
    const [currentTelefono, setCurrentTelefono] = useState('');
    const [actividades, setActividades] = useState<string[]>([]);
    const [currentActividad, setCurrentActividad] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [isScanning, setIsScanning] = useState(false);
    const [highlightFields, setHighlightFields] = useState<string[]>([]);
    const [rucError, setRucError] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            setNewClienteData({
                nombre: initialName || '',
                nombreComercial: '',
                cedulaRuc: initialCedulaRuc || '',
                email: '',
                direccion: 'Pasaje, El Oro',
                regimen: Regimen.GENERAL,
                establecimientoPredeterminado: '001',
                puntoEmisionPredeterminado: '001',
                numEstablecimientosOpen: 1,
                fiscal_data: {}
            });
            setTelefonos([]);
            setActividades([]);
            setSaveSuccess(false);
            setRucError('');
        }
    }, [isOpen, initialName, initialCedulaRuc, initialMode]);

    useEffect(() => {
        const performLookup = async () => {
            if (mode === 'SRI' && newClienteData.cedulaRuc.length === 13) {
                const isValid = validarIdentificacionEC(newClienteData.cedulaRuc);
                if (isValid) {
                    setRucError('');
                    setIsScanning(true);
                    try {
                        const result = await sriLookupService.lookupByRuc(newClienteData.cedulaRuc);
                        if (result) {
                            applyExtractedData({
                                nombre: result.razon_social,
                                ruc: result.ruc,
                                direccion: result.direccion || `${result.parroquia}, ${result.canton}, ${result.provincia || 'EL ORO'}`,
                                regimen: result.regimen || Regimen.GENERAL,
                                actividades: result.actividad_economica
                            });
                        }
                    } catch (err) {
                        console.error("Error doing padron lookup:", err);
                        logActivity(
                            "Sistema",
                            "App",
                            "SRI_SCAN_FAILURE",
                            `Fallo búsqueda padrón SRI RUC ${newClienteData.cedulaRuc}: ${(err as Error).message || 'Error'}`,
                            "Clientes"
                        );
                    } finally {
                        setIsScanning(false);
                    }
                } else {
                    setRucError('Identificación inválida (Ecuador)');
                }
            } else if (mode === 'SRI' && newClienteData.cedulaRuc.length >= 10 && newClienteData.cedulaRuc.length < 13) {
                const isValid = validarIdentificacionEC(newClienteData.cedulaRuc);
                setRucError(isValid ? '' : 'Cédula inválida');
            } else {
                setRucError('');
            }
        };

        performLookup();
    }, [newClienteData.cedulaRuc, mode]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsScanning(true);
        try {
            const result = await extractDataFromSriPdf(file);
            if (result) {
                applyExtractedData({
                    nombre: result.apellidos_nombres,
                    ruc: result.ruc,
                    direccion: result.direccion,
                    regimen: result.regimen,
                    email: result.contacto?.email,
                    telefono: result.contacto?.celular,
                    numEstablecimientos: result.cantidad_establecimientos,
                    establecimientoPrincipal: '001',
                    actividades: result.actividad_economica
                });
                setMode('SRI');
            }
        } catch (error) {
            console.error("Error extracted SRI PDF:", error);
            setRucError("Error al leer el PDF. Asegúrese de que sea un certificado del SRI.");
            logActivity(
                "Sistema",
                "App",
                "SRI_SCAN_FAILURE",
                `Fallo al extraer PDF SRI: ${(error as Error).message || 'Error desconocido'}`,
                "Clientes"
            );
        } finally {
            setIsScanning(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const applyExtractedData = (data: any) => {
        const fields = ['nombre', 'cedulaRuc', 'direccion', 'regimen', 'telefono'];
        setHighlightFields(fields);

        let regimenFinal = Regimen.GENERAL;
        if (typeof data.regimen === 'string') {
            const raw = data.regimen.toUpperCase();
            if (raw.includes('POPULAR')) regimenFinal = Regimen.NEGOCIO_POPULAR;
            else if (raw.includes('EMPRENDEDOR')) regimenFinal = Regimen.EMPRENDEDOR;
            else if (raw.includes('GENERAL')) regimenFinal = Regimen.GENERAL;
            else regimenFinal = data.regimen as Regimen;
        } else if (data.regimen) {
            regimenFinal = data.regimen;
        }

        setNewClienteData({
            nombre: data.nombre || '',
            nombreComercial: data.nombreComercial || '',
            cedulaRuc: data.ruc || '',
            email: data.email || '',
            direccion: data.direccion || 'Pasaje, El Oro',
            regimen: regimenFinal,
            numEstablecimientosOpen: data.numEstablecimientos || 1,
            establecimientoPredeterminado: data.establecimientoPrincipal || '001',
            puntoEmisionPredeterminado: data.puntoEmisionPrincipal || '001',
            fiscal_data: {
                razon_social: data.nombre,
                nombre_comercial: data.nombreComercial || data.nombre,
                estado_contribuyente: 'ACTIVO',
                tipo_contribuyente: data.tipoPersona || 'PERSONA NATURAL',
                obligado_contabilidad: data.obligadoContabilidad || false,
                actividades: data.actividades ? data.actividades.split('|').map((a: string) => ({ descripcion: a.trim() })) : [],
                ultima_sincronizacion: new Date().toISOString()
            }
        });

        if (data.telefono) {
            const rawPhones = data.telefono.split(/[,;]/);
            const cleanPhones = rawPhones.map((p: string) => p.replace(/\D/g, '')).filter((p: string) => p.length >= 7);
            setTelefonos(Array.from(new Set([...cleanPhones])));
        } else {
            setTelefonos([]);
        }

        if (data.actividades) {
            const cleaned = data.actividades.split(/[|\n•]/)
                .map((a: string) => a.trim().toUpperCase())
                .filter((a: string) => a.length > 4)
                .map((a: string) => a.replace(/^\.*|[\.*]$/g, '').trim());
            setActividades(cleaned.filter((item: string, index: number, self: string[]) => self.indexOf(item) === index));
        } else {
            setActividades([]);
        }
        setTimeout(() => setHighlightFields([]), 3000);
    }

    const addActividad = (text: string) => {
        const val = text.toUpperCase().trim();
        if (val && !actividades.includes(val)) {
            setActividades([...actividades, val]);
            setCurrentActividad('');
        }
    };

    const addTelefono = (text: string) => {
        const val = text.replace(/\D/g, '');
        if (val.length >= 7 && !telefonos.includes(val)) {
            setTelefonos([...telefonos, val]);
            setCurrentTelefono('');
        }
    };

    const { addCliente } = useData();
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'SRI' && rucError) return;
        if (mode === 'SRI' && (!newClienteData.cedulaRuc || newClienteData.cedulaRuc === '9999999999' || newClienteData.cedulaRuc === '9999999999999')) {
            setRucError('El RUC o Cédula real es obligatorio para clientes SRI.');
            return;
        }

        const finalId = newClienteData.cedulaRuc || '9999999999';

        setIsSaving(true);
        try {
            if (!newClienteData.cedulaRuc || newClienteData.cedulaRuc === '9999999999' || newClienteData.cedulaRuc === '9999999999999') {
                const tempClient: Cliente = {
                    id: 'temporal_' + Date.now(),
                    nombre: newClienteData.nombre.toUpperCase(),
                    cedula: '9999999999',
                    ruc: undefined,
                    telefono: telefonos.length > 0 ? telefonos : (currentTelefono ? [currentTelefono] : []),
                    direccion: newClienteData.direccion,
                    email: newClienteData.email,
                    regimen: mode === 'EXPRESS' ? Regimen.GENERAL : newClienteData.regimen,
                    creadoEn: new Date().toISOString(),
                };
                setSaveSuccess(true);
                setTimeout(() => onClientCreated(tempClient), 800);
                return;
            }

            const newCliente = await addCliente({
                ...newClienteData,
                cedula: finalId,
                ruc: mode === 'SRI' ? newClienteData.cedulaRuc : undefined,
                actividades: actividades.join(' • '),
                telefono: telefonos.length > 0 ? telefonos : (currentTelefono ? [currentTelefono] : ['0990000000']),
                regimen: mode === 'EXPRESS' ? Regimen.GENERAL : newClienteData.regimen,
                fiscal_data: mode === 'SRI' ? {
                    ...newClienteData.fiscal_data,
                    razon_social: newClienteData.nombre,
                    nombre_comercial: newClienteData.nombreComercial || newClienteData.nombre,
                    actividades: actividades.map(a => ({ codigo: '', descripcion: a })),
                    ultima_sincronizacion: new Date().toISOString()
                } : undefined
            });
            setSaveSuccess(true);
            setTimeout(() => onClientCreated(newCliente), 800);
        } catch (err: any) {
            console.error("Error al registrar cliente:", err);
            setIsSaving(false);
            setRucError(err.message || 'Error en la conexión con la base de datos');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />

            <div className="bg-white w-full max-w-6xl h-full max-h-[92vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-slate-200">
                <div className="absolute top-0 left-0 w-full h-1 bg-brand-blue/20" />

                <div className="flex-shrink-0 flex flex-col p-10 md:p-14 pb-6 md:pb-8 gap-8 relative z-30 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
                    <div className="flex justify-between items-center gap-8">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                                <p className="text-[11px] font-black text-brand-blue uppercase tracking-[0.8em]">IDENT_VERIFICATION_v5</p>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-[-0.05em] leading-none">
                                {mode === 'EXPRESS' ? 'IDENTIDAD ' : 'PROTOCOLOS '}<span className="text-brand-blue">{mode === 'EXPRESS' ? 'EXPRESS' : 'SRI_OFICIAL'}</span>
                            </h2>
                            <p className="text-[10px] md:text-[12px] text-slate-500 font-bold uppercase tracking-[0.4em] opacity-80">
                                {mode === 'EXPRESS' ? 'Carga simplificada de activos de facturación' : 'Sincronización de expediente industrial con validación gubernamental'}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <button onClick={onClose} className="p-6 md:p-8 bg-slate-100 hover:bg-slate-200 rounded-[2rem] transition-all group">
                                <CloseIcon className="w-6 h-6 md:w-8 md:h-8 text-slate-500 group-hover:text-rose-500 transition-colors" />
                            </button>
                        </div>
                    </div>

                    {!isLocked && (
                        <div className="bg-slate-100 p-2 rounded-[2rem] flex font-black text-[11px] uppercase tracking-[0.3em] border border-slate-200 max-w-2xl">
                            <button
                                type="button"
                                onClick={() => setMode('EXPRESS')}
                                className={`flex-1 py-5 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all duration-300 ${mode === 'EXPRESS' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${mode === 'EXPRESS' ? 'bg-brand-blue' : 'bg-slate-300'}`} />
                                MODO_EXPRESS
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('SRI')}
                                className={`flex-1 py-5 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all duration-300 ${mode === 'SRI' ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${mode === 'SRI' ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
                                PERFIL_SRI_ALPHA
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-grow p-6 md:p-10 pt-4 md:pt-6 space-y-8 md:space-y-10 overflow-y-auto custom-scrollbar relative z-10 bg-slate-50/30">
                    {mode === 'SRI' && (
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isScanning}
                                className={`w-full group relative flex flex-col items-center justify-center gap-2 md:gap-3 py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed transition-all overflow-hidden ${isScanning ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-200 bg-white hover:border-brand-blue/30 hover:bg-slate-50'}`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                {isScanning ? <Loader2Icon className="w-6 h-6 md:w-8 md:h-8 text-brand-blue animate-spin" /> : <UploadIcon className="w-6 h-6 md:w-8 md:h-8 text-brand-blue opacity-50 group-hover:opacity-100 transition-all" />}
                                <div className="text-center relative z-10">
                                    <span className="block text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">
                                        {isScanning ? "IA Analizando estructura tributaria..." : "Sincronizar con Documento RUC (PDF)"}
                                    </span>
                                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mt-1">Extrae automáticamente actividades y dirección</span>
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                            </button>
                        </div>
                    )}

                    <form id="create-client-form" onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField
                                label="Nombre / Razón Social"
                                name="nombre"
                                value={newClienteData.nombre}
                                onChange={e => setNewClienteData({ ...newClienteData, nombre: e.target.value.toUpperCase() })}
                                required
                                isHighlighted={highlightFields.includes('nombre')}
                                placeholder={mode === 'EXPRESS' ? "Ej: JUAN PÉREZ" : "Especifique Razón Social completa"}
                            />

                            <div className="group space-y-2 relative md:col-span-1">
                                <div className={`flex flex-wrap gap-2 p-4 pt-7 pb-3 bg-white rounded-2xl border transition-all ${highlightFields.includes('telefono') ? 'border-brand-blue/50 bg-brand-blue/5 shadow-sm' : 'border-slate-200 group-focus-within:border-brand-blue/50 group-focus-within:ring-2 group-focus-within:ring-brand-blue/10'}`}>
                                    <PhoneIcon className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 transition-colors ${highlightFields.includes('telefono') ? 'text-brand-blue' : 'text-slate-400 group-focus-within:text-brand-blue'}`} />
                                    <div className="pl-8 flex flex-wrap gap-2 items-center w-full">
                                        {telefonos.map((t, idx) => (
                                            <span key={idx} className="bg-brand-blue text-white px-2.5 py-1 rounded-xl text-[9px] font-black flex items-center gap-1.5 shadow-sm animate-scale-in">
                                                <PhoneIcon className="w-2.5 h-2.5" /> {t}
                                                <button type="button" className="opacity-60 hover:opacity-100" onClick={() => setTelefonos(telefonos.filter((_, i) => i !== idx))}>&times;</button>
                                            </span>
                                        ))}
                                        <input
                                            id="telefono-input"
                                            type="tel"
                                            placeholder="Añadir teléfono..."
                                            value={currentTelefono}
                                            onChange={e => setCurrentTelefono(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTelefono(currentTelefono))}
                                            onBlur={() => currentTelefono && addTelefono(currentTelefono)}
                                            className="bg-transparent border-none outline-none text-base font-bold text-slate-900 flex-grow min-w-[120px] placeholder:text-slate-300 uppercase"
                                        />
                                    </div>
                                </div>
                                <label htmlFor="telefono-input" className="absolute left-14 top-2.5 text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] pointer-events-none transition-colors group-focus-within:text-brand-blue">
                                    Teléfono / Whatsapp {mode === 'EXPRESS' && <span className="text-rose-500 opacity-50">*</span>}
                                </label>
                            </div>
                        </div>

                        {mode === 'SRI' ? (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 space-y-6 relative overflow-hidden md:col-span-2 shadow-sm">
                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
                                        <div className="relative group">
                                            <ShieldCheckIcon className={`absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 transition-all duration-500 ${newClienteData.cedulaRuc.length >= 10 && !rucError ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] scale-110' : 'text-slate-300 group-focus-within:text-brand-blue'}`} />
                                            <input 
                                                id="cedulaRuc"
                                                name="cedulaRuc"
                                                value={newClienteData.cedulaRuc} 
                                                onChange={e => setNewClienteData({ ...newClienteData, cedulaRuc: e.target.value.replace(/\D/g, '').slice(0, 13) })} 
                                                required 
                                                className="peer w-full bg-slate-50 border border-slate-200 p-8 pt-10 pb-4 pl-20 rounded-[1.5rem] text-slate-900 font-bold text-2xl focus:ring-2 focus:ring-brand-blue/10 focus:border-brand-blue/50 transition-all tracking-[0.2em] placeholder-transparent" 
                                                placeholder="RUC Oficial" 
                                            />
                                            <label htmlFor="cedulaRuc" className="absolute left-20 top-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] transition-all peer-placeholder-shown:top-8 peer-placeholder-shown:text-lg peer-placeholder-shown:text-slate-400 peer-focus:top-4 peer-focus:text-[10px] peer-focus:text-brand-blue pointer-events-none">
                                                ID_Tributario (RUC Oficial)
                                            </label>
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                                {isScanning ? (
                                                    <Loader2Icon className="w-5 h-5 text-brand-blue animate-spin" />
                                                ) : (
                                                    <div className={`w-2 h-2 rounded-full ${newClienteData.cedulaRuc.length >= 10 && !rucError ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-200'} transition-all duration-500`} />
                                                )}
                                            </div>
                                        </div>
                                        {rucError && <p className="text-[9px] text-rose-500 font-black mt-1 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-lg inline-block border border-rose-100">{rucError}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <InputField
                                            label="Email de Facturación"
                                            name="email"
                                            type="email"
                                            value={newClienteData.email}
                                            onChange={e => setNewClienteData({ ...newClienteData, email: e.target.value })}
                                            isHighlighted={highlightFields.includes('email')}
                                            placeholder="correo@ejemplo.com"
                                        />
                                    </div>
                                </div>

                                <div className="p-8 bg-white rounded-[2rem] border border-slate-200 space-y-8 relative overflow-hidden shadow-sm">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-100 pb-4 flex items-center gap-3">
                                        <DocumentTextIcon className="w-4 h-4 text-brand-blue opacity-50" /> Configuración Tributaria Imprenta
                                    </h3>

                                    <div className="flex flex-wrap gap-3">
                                        {[Regimen.GENERAL, Regimen.EMPRENDEDOR, Regimen.NEGOCIO_POPULAR].map((reg) => (
                                            <button
                                                key={reg}
                                                type="button"
                                                onClick={() => setNewClienteData(prev => ({ ...prev, regimen: reg }))}
                                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newClienteData.regimen === reg ? 'border-brand-blue bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                                            >
                                                {reg}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <InputField label="Estab. Matriz" name="establecimientoPredeterminado" value={newClienteData.establecimientoPredeterminado} onChange={e => setNewClienteData({ ...newClienteData, establecimientoPredeterminado: e.target.value })} maxLength={3} placeholder="001" />
                                        <InputField label="Punto Emisión" name="puntoEmisionPredeterminado" value={newClienteData.puntoEmisionPredeterminado} onChange={e => setNewClienteData({ ...newClienteData, puntoEmisionPredeterminado: e.target.value })} maxLength={3} placeholder="001" />
                                        <InputField label="Total Estab." name="numEstablecimientosOpen" type="number" value={newClienteData.numEstablecimientosOpen} onChange={e => setNewClienteData({ ...newClienteData, numEstablecimientosOpen: parseInt(e.target.value) })} />
                                    </div>

                                    <InputField label="Dirección Matriz (SRI)" name="direccion" value={newClienteData.direccion} onChange={e => setNewClienteData({ ...newClienteData, direccion: e.target.value.toUpperCase() })} isHighlighted={highlightFields.includes('direccion')} placeholder="CALLE, CIUDAD, PROVINCIA" />

                                    <div className="group space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-focus-within:text-brand-blue transition-colors">Actividades Económicas</label>
                                        <div className="flex flex-col gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                            <div className="flex flex-wrap gap-2">
                                                {actividades.map((a, i) => (
                                                    <span key={i} className="bg-white text-slate-700 text-[9px] font-bold px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-200 shadow-sm animate-scale-in">
                                                        <span className="max-w-[300px] truncate">{a}</span>
                                                        <button type="button" className="text-rose-500 opacity-60 hover:opacity-100 font-black text-xs" onClick={() => setActividades(actividades.filter((_, idx) => idx !== i))}>&times;</button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <input
                                                    type="text"
                                                    value={currentActividad}
                                                    onChange={e => setCurrentActividad(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addActividad(currentActividad))}
                                                    placeholder="Añadir actividad..."
                                                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 flex-grow outline-none"
                                                />
                                                <button type="button" onClick={() => addActividad(currentActividad)} className="px-6 py-3 bg-brand-blue text-white font-black text-[10px] uppercase rounded-xl">Añadir</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                                <InputField label="DNI / Cédula (Opcional)" name="cedulaRuc" value={newClienteData.cedulaRuc} onChange={e => setNewClienteData({ ...newClienteData, cedulaRuc: e.target.value })} maxLength={10} placeholder="9999999999" />
                                <InputField label="Nota / Referencia" name="direccion" value={newClienteData.direccion} onChange={e => setNewClienteData({ ...newClienteData, direccion: e.target.value })} placeholder="Especifique dirección o notas..." />
                            </div>
                        )}
                    </form>
                </div>

                <div className="flex-shrink-0 p-10 md:p-14 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-6 relative z-40">
                    <button onClick={onClose} className="flex-1 py-6 px-10 rounded-[1.5rem] bg-slate-50 text-slate-400 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-slate-100 border border-slate-200">CANCELAR</button>
                    <button type="submit" form="create-client-form" disabled={isSaving || saveSuccess || (mode === 'SRI' && !!rucError)} className="flex-[2] py-6 px-10 rounded-[1.5rem] bg-brand-blue text-white font-black text-[12px] uppercase tracking-[0.3em] hover:bg-brand-blue-dark shadow-lg shadow-brand-blue/20 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                        {isSaving ? <Loader2Icon className="animate-spin w-6 h-6" /> : saveSuccess ? <CheckCircleIcon className="w-6 h-6" /> : "GUARDAR CLIENTE"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ClientItem: React.FC<{ 
    client: Cliente; 
    isSri: boolean; 
    selectedId?: string; 
    onSelect: (c: Cliente) => void 
}> = ({ client, isSri, selectedId, onSelect }) => {
    return (
        <motion.div 
            whileHover={{ x: 10 }}
            onClick={() => onSelect(client)} 
            className={`p-6 md:p-8 cursor-pointer hover:bg-slate-50 flex justify-between items-center transition-all group relative overflow-hidden rounded-[2rem] border border-transparent hover:border-brand-blue/10 ${selectedId === client.id ? 'bg-brand-blue/5 border-brand-blue/20' : ''}`}
        >
            <div className={`absolute inset-y-0 left-0 w-1.5 ${isSri ? 'bg-brand-blue' : 'bg-brand-blue/40'} transition-opacity ${selectedId === client.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            <div className="flex items-center gap-6 md:gap-8 relative z-10">
                <div className={`h-16 w-16 rounded-[1.2rem] flex items-center justify-center font-black text-2xl shadow-sm ${isSri ? 'bg-brand-blue text-white' : 'bg-slate-100 text-brand-blue border border-slate-200'}`}>
                    {(client.nombre || '?').charAt(0)}
                </div>
                <div className="min-w-0 space-y-2">
                    <p className="font-black text-slate-900 text-xl md:text-2xl tracking-tighter uppercase leading-none group-hover:text-brand-blue transition-colors truncate">{client.nombre || 'SIN NOMBRE'}</p>
                    <div className="flex items-center gap-4 flex-wrap">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                            <IdentificationIcon className="w-3.5 h-3.5 opacity-40"/> {client.cedula || client.ruc} 
                        </p>
                        {isSri ? (
                            <span className="text-[8px] font-black px-3 py-1 rounded-lg bg-brand-blue/10 text-brand-blue border border-brand-blue/20 tracking-widest uppercase">SRI_VERIFIED</span>
                        ) : (
                            <span className="text-[8px] font-black px-3 py-1 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 tracking-widest uppercase">V_NATURAL</span>
                        )}
                    </div>
                </div>
            </div>
            <ArrowRightIcon className="w-6 h-6 md:w-8 md:h-8 text-slate-300 group-hover:text-brand-blue transition-all" />
        </motion.div>
    );
};

interface ClientSelectorProps {
    onSelect: (cliente: Cliente | null) => void;
    selectedId?: string;
    onSkip?: () => void;
    onCancel?: () => void;
    hideQuickButtons?: boolean;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelect, selectedId, onSkip, onCancel, hideQuickButtons }) => {
    const { clientes } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createMode, setCreateMode] = useState<ClientMode>('EXPRESS');
    const [padronResults, setPadronResults] = useState<SriRucData[]>([]);
    const [isSearchingPadron, setIsSearchingPadron] = useState(false);

    const filteredClients = searchTerm.length > 1
        ? clientes.filter(c =>
            (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.cedula || '').includes(searchTerm) ||
            (c.ruc || '').includes(searchTerm)
        ).slice(0, 5)
        : [];

    useEffect(() => {
        const searchPadron = async () => {
            if (searchTerm.length >= 10) {
                setIsSearchingPadron(true);
                try {
                    let results: any[] = [];
                    if (searchTerm.length === 13 && /^\d+$/.test(searchTerm)) {
                        const direct = await sriLookupService.lookupByRuc(searchTerm);
                        if (direct) results = [direct];
                    } else if (searchTerm.length > 4) {
                        results = await sriLookupService.searchByName(searchTerm);
                    }
                    setPadronResults(results);
                } catch (err) {
                    console.error("Error searching padron:", err);
                } finally {
                    setIsSearchingPadron(false);
                }
            } else {
                setPadronResults([]);
            }
        };
        const timer = setTimeout(searchPadron, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filteredClients.length]);

    const handleOpenCreate = (mode: ClientMode) => {
        setCreateMode(mode);
        setIsCreateModalOpen(true);
    };

    return (
        <div className="animate-fade-in w-full space-y-8">
            <div className="flex flex-col gap-6">
                <button
                    onClick={() => handleOpenCreate('SRI')}
                    className="w-full bg-white border-2 border-slate-200 p-8 rounded-[2rem] flex items-center justify-between group hover:border-brand-blue/30 hover:bg-slate-50 transition-all shadow-sm"
                >
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-brand-blue text-white rounded-2xl shadow-lg shadow-brand-blue/20 group-hover:scale-110 transition-transform">
                            <UserPlusIcon className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-brand-blue uppercase tracking-[0.5em] mb-1">Protocolo de Alta Oficial</p>
                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Inscribir como SRI</h4>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Padrón El Oro y PDF</p>
                        </div>
                    </div>
                    <ArrowRightIcon className="w-8 h-8 text-slate-300 group-hover:text-brand-blue group-hover:translate-x-2 transition-all" />
                </button>

                <div className="relative group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-brand-blue transition-all z-20" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="BUSCAR CLIENTE O RUC..."
                        className="w-full pl-16 pr-14 py-6 bg-white border border-slate-200 rounded-[1.2rem] text-lg font-black text-slate-900 focus:bg-slate-50 focus:ring-1 focus:ring-brand-blue/40 transition-all placeholder:text-slate-300 uppercase tracking-widest relative z-10"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors z-20">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {!hideQuickButtons && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => handleOpenCreate('EXPRESS')} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-brand-blue transition-all group">
                            <AddIcon className="w-5 h-5 text-slate-300 group-hover:text-brand-blue" />
                            <span className="text-[10px] font-black uppercase tracking-widest">NUEVO_CLIENTE_EXPRESS</span>
                        </button>
                        {onSkip && (
                            <button onClick={onSkip} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 transition-all group">
                                <SparklesIcon className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest">CONTINUAR_SIN_IDENTIDAD</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {(filteredClients.length > 0 || padronResults.length > 0) ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                                <LayersIcon className="w-4 h-4 text-brand-blue opacity-50" /> Expedientes_Locales
                             </h3>
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{filteredClients.length} ENCONTRADOS</span>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                            {filteredClients.map(client => (
                                <ClientItem key={client.id} client={client} isSri={!!client.ruc} selectedId={selectedId} onSelect={onSelect} />
                            ))}
                        </div>

                        {padronResults.length > 0 && (
                             <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em] flex items-center gap-3">
                                        <SparklesIcon className="w-4 h-4 text-brand-blue animate-pulse" /> Padrón_Oficial_Alpha
                                    </h3>
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">NUBE_PROVINCIAL</span>
                                </div>
                                <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-[2rem] p-4 space-y-2">
                                    {padronResults.filter(p => !filteredClients.some(fc => fc.ruc === p.ruc)).map((p, i) => (
                                        <motion.div 
                                            key={i} 
                                            whileHover={{ scale: 1.01 }} 
                                            onClick={() => { setCreateMode('SRI'); setIsCreateModalOpen(true); setSearchTerm(p.ruc); }}
                                            className="p-6 bg-white border border-slate-200 rounded-[1.5rem] flex justify-between items-center group cursor-pointer hover:border-brand-blue/40 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue font-black">{p.razon_social.charAt(0)}</div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tighter group-hover:text-brand-blue transition-colors">{p.razon_social}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{p.ruc} • {p.canton}</p>
                                                </div>
                                            </div>
                                            <ArrowRightIcon className="w-5 h-5 text-slate-300 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
                                        </motion.div>
                                    ))}
                                </div>
                             </div>
                        )}
                    </motion.div>
                ) : searchTerm.length > 2 && !isSearchingPadron ? (
                    <div className="p-14 text-center space-y-6 bg-slate-50 border border-slate-200 border-dashed rounded-[3rem]">
                        <ExclamationTriangleIcon className="w-16 h-16 text-slate-200 mx-auto" />
                        <div className="space-y-2">
                            <p className="text-xl font-black text-slate-900 uppercase tracking-tighter">Sin Coincidencias Críticas</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">No se detectaron expedientes locales para "{searchTerm}"</p>
                        </div>
                        <button onClick={() => handleOpenCreate('SRI')} className="px-8 py-4 bg-brand-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:scale-105 transition-all">Iniciar Protocolo SRI</button>
                    </div>
                ) : null}
            </AnimatePresence>

            {isCreateModalOpen && (
                <CreateClientModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onClientCreated={(client) => { setIsCreateModalOpen(false); onSelect(client); }}
                    initialCedulaRuc={searchTerm.length >= 10 && /^\d+$/.test(searchTerm) ? searchTerm : undefined}
                    initialName={searchTerm.length > 2 && !/^\d+$/.test(searchTerm) ? searchTerm : undefined}
                    initialMode={createMode}
                />
            )}
        </div>
    );
};

export default ClientSelector;
