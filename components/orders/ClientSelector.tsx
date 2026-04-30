
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
            className={`peer w-full bg-white/[0.02] border p-4 pt-7 pb-3 rounded-2xl text-white font-black text-base focus:ring-2 transition-all uppercase italic placeholder-transparent
                ${error
                    ? 'border-rose-500/50 focus:ring-rose-500/30 focus:border-rose-500/50'
                    : isHighlighted
                        ? 'border-liquid-gold/50 focus:ring-liquid-gold/30 focus:border-liquid-gold/50'
                        : 'border-white/5 focus:ring-brand-red/30 focus:border-brand-red/50'
                }`}
            placeholder={label}
            {...props}
        />
        <label htmlFor={name} className={`absolute left-5 top-2.5 text-[8px] font-black uppercase tracking-[0.4em] italic transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-focus:top-2.5 peer-focus:text-[8px] pointer-events-none ${error ? 'text-rose-500' : isHighlighted ? 'text-liquid-gold' : 'text-slate-500 peer-focus:text-brand-red'}`}>
            {label} {required && <span className="text-rose-500/50">*</span>} {isHighlighted && "✨"}
        </label>
        {error && <p className="text-[8px] text-rose-500 font-black mt-1 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-lg inline-block absolute -bottom-5 left-4 z-20">{error}</p>}
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

    // Validación RUC solo en modo SRI
    useEffect(() => {
        const performLookup = async () => {
            if (mode === 'SRI' && newClienteData.cedulaRuc.length === 13) {
                const isValid = validarIdentificacionEC(newClienteData.cedulaRuc);
                if (isValid) {
                    setRucError('');
                    setIsScanning(true); // Reutilizamos el estado de scanning para el lookup
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
                // Posible Cédula
                const isValid = validarIdentificacionEC(newClienteData.cedulaRuc);
                setRucError(isValid ? '' : 'Cédula inválida');

                // Si es válida (10 dígitos), también intentamos buscar en el padrón por si acaso está registrado como RUC pero escribió la cédula
                if (isValid && newClienteData.cedulaRuc.length === 10) {
                    // Opcional: buscar ruc + '001'
                }
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
                setMode('SRI'); // Auto-switch to SRI mode if scanning
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
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
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

    // Validaciones según modo
    if (mode === 'SRI' && rucError) return;
    if (mode === 'SRI' && (!newClienteData.cedulaRuc || newClienteData.cedulaRuc === '9999999999' || newClienteData.cedulaRuc === '9999999999999')) {
        setRucError('El RUC o Cédula real es obligatorio para clientes SRI.');
        return;
    }

    // Valor por defecto para CI en modo Express si no se llena
    const finalId = newClienteData.cedulaRuc || '9999999999';

    setIsSaving(true);
    try {
        if (!newClienteData.cedulaRuc || newClienteData.cedulaRuc === '9999999999' || newClienteData.cedulaRuc === '9999999999999') {
            // No guardar en DB si no hay cédula real (Requerimiento 3)
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
            cedula: finalId, // Asegurar que siempre viaje algo
            ruc: mode === 'SRI' ? newClienteData.cedulaRuc : undefined,
            actividades: actividades.join(' • '),
            telefono: telefonos.length > 0 ? telefonos : (currentTelefono ? [currentTelefono] : ['0990000000']),
            // Limpiar datos SRI si es modo express
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
        <div className="absolute inset-0 bg-brand-dark/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

        <div className="bg-brand-dark w-full max-w-5xl h-full max-h-[90vh] rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

            {/* HEADER FIJO */}
            <div className="flex-shrink-0 flex flex-col p-5 md:p-8 pb-3 md:pb-4 gap-4 md:gap-6 relative z-30 border-b border-white/5 bg-brand-dark/95 backdrop-blur-xl">
                <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                        <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-tighter leading-none italic">
                            {mode === 'EXPRESS' ? 'IDENTIDAD EXPRESS' : 'PROTOCOLOS SRI (OFICIAL)'}
                        </h2>
                        <div className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${mode === 'EXPRESS' ? 'bg-liquid-gold' : 'bg-liquid-gold'} animate-pulse shadow-gold-glow-sm`}></div>
                            {mode === 'EXPRESS' ? 'Resumen para facturación simplificada' : 'Expediente industrial para tributación oficial'}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="p-3 md:p-4 bg-white/5 hover:bg-white/10 rounded-2xl md:rounded-3xl transition-all border border-white/5 group"
                        >
                            <CloseIcon className="w-5 h-5 md:w-6 md:h-6 text-slate-500 group-hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>

                {!isLocked && (
                    <div className="bg-white/5 p-1 rounded-[1.5rem] md:rounded-[1.8rem] flex font-black text-[9px] md:text-[10px] uppercase tracking-widest border border-white/5">
                        <button
                            type="button"
                            onClick={() => setMode('EXPRESS')}
                            className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 transition-all ${mode === 'EXPRESS' ? 'bg-white text-brand-dark shadow-luxury' : 'text-slate-500 hover:text-white'}`}
                        >
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-liquid-gold animate-pulse"></div>
                            Express
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('SRI')}
                            className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 transition-all ${mode === 'SRI' ? 'bg-liquid-gold text-black shadow-gold-glow' : 'text-slate-500 hover:text-white'}`}
                        >
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-black animate-pulse"></div>
                            Perfil SRI
                        </button>
                    </div>
                )}
            </div>

            {/* CONTENIDO SCROLLABLE */}
            <div className="flex-grow p-6 md:p-10 pt-4 md:pt-6 space-y-8 md:space-y-10 overflow-y-auto custom-scrollbar relative z-10">

                {/* Botón Scanner solo visible en modo SRI */}
                {mode === 'SRI' && (
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isScanning}
                            className={`w-full group relative flex flex-col items-center justify-center gap-2 md:gap-3 py-6 md:py-8 rounded-[2rem] md:rounded-[2.5rem] border-2 border-dashed transition-all overflow-hidden ${isScanning ? 'border-liquid-gold bg-liquid-gold/5' : 'border-white/5 bg-white/2 hover:border-white/20 hover:bg-white/5'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {isScanning ? <Loader2Icon className="w-6 h-6 md:w-8 md:h-8 text-liquid-gold animate-spin" /> : <UploadIcon className="w-6 h-6 md:w-8 md:h-8 text-liquid-gold opacity-50 group-hover:opacity-100 transition-all" />}
                            <div className="text-center relative z-10">
                                <span className="block text-[11px] font-black uppercase tracking-[0.4em]">
                                    {isScanning ? "IA Analizando estructura tributaria..." : "Sincronizar con Documento RUC (PDF)"}
                                </span>
                                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mt-1">Extrae automáticamente actividades y dirección</span>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                        </button>
                    </div>
                )}

                <form id="create-client-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Campos Comunes */}
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
                            <div className={`flex flex-wrap gap-2 p-4 pt-7 pb-3 bg-white/[0.02] rounded-2xl border transition-all ${highlightFields.includes('telefono') ? 'border-liquid-gold/50 bg-liquid-gold/5 shadow-gold-glow-soft' : 'border-white/5 group-focus-within:border-brand-red/50 group-focus-within:ring-2 group-focus-within:ring-brand-red/30'}`}>
                                <PhoneIcon className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 z-10 transition-colors ${highlightFields.includes('telefono') ? 'text-liquid-gold' : 'text-slate-600 group-focus-within:text-brand-red'}`} />
                                <div className="pl-8 flex flex-wrap gap-2 items-center w-full">
                                    {telefonos.map((t, idx) => (
                                        <span key={idx} className="bg-liquid-gold text-brand-dark px-2.5 py-1 rounded-xl text-[9px] font-black flex items-center gap-1.5 shadow-luxury animate-scale-in">
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
                                        className="bg-transparent border-none outline-none text-base font-black text-white flex-grow min-w-[120px] placeholder:text-slate-700 italic uppercase"
                                    />
                                </div>
                            </div>
                            <label htmlFor="telefono-input" className="absolute left-14 top-2.5 text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] italic pointer-events-none transition-colors group-focus-within:text-brand-red">
                                Teléfono / Whatsapp {mode === 'EXPRESS' && <span className="text-rose-500 opacity-50">*</span>}
                            </label>
                        </div>
                    </div>

                    {/* Campos Específicos SRI */}
                    {mode === 'SRI' ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-black/20 p-6 md:p-8 rounded-[3rem] border border-white/5 space-y-6 relative overflow-hidden md:col-span-2">
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-liquid-gold/10 rounded-full blur-3xl pointer-events-none" />
                                    {isScanning && (
                                        <div className="absolute top-0 left-0 w-full h-[2px] bg-liquid-gold/50 animate-scan-y z-40 overflow-hidden">
                                            <div className="w-1/3 h-full bg-liquid-gold shadow-[0_0_15px_#D4AF37] animate-pulse" />
                                        </div>
                                    )}
                                    <div className="relative group">
                                        <ShieldCheckIcon className={`absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 transition-all duration-500 ${newClienteData.cedulaRuc.length >= 10 && !rucError ? 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-110' : 'text-slate-600 group-focus-within:text-liquid-gold'}`} />
                                        <input 
                                            id="cedulaRuc"
                                            name="cedulaRuc"
                                            value={newClienteData.cedulaRuc} 
                                            onChange={e => setNewClienteData({ ...newClienteData, cedulaRuc: e.target.value.replace(/\D/g, '').slice(0, 13) })} 
                                            required 
                                            className="peer w-full bg-white/[0.02] border border-white/10 p-8 pt-10 pb-4 pl-20 rounded-[2rem] text-white font-black text-2xl focus:ring-2 focus:ring-liquid-gold/30 focus:border-liquid-gold/50 transition-all tracking-[0.2em] italic placeholder-transparent" 
                                            placeholder="RUC Oficial" 
                                        />
                                        <label htmlFor="cedulaRuc" className="absolute left-20 top-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic transition-all peer-placeholder-shown:top-8 peer-placeholder-shown:text-lg peer-placeholder-shown:text-slate-600 peer-focus:top-4 peer-focus:text-[10px] peer-focus:text-liquid-gold pointer-events-none">
                                            ID_Tributario (RUC Oficial)
                                        </label>
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                            {isScanning ? (
                                                <>
                                                    <p className="text-[9px] text-liquid-gold font-black uppercase tracking-[0.3em] animate-pulse hidden sm:block">EXTRAYENDO_DATA...</p>
                                                    <Loader2Icon className="w-5 h-5 text-liquid-gold animate-spin" />
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.3em] hidden sm:block">{newClienteData.cedulaRuc.length === 13 && !rucError ? 'RUC_VÁLIDO' : ''}</p>
                                                    <div className={`w-2 h-2 rounded-full ${newClienteData.cedulaRuc.length >= 10 && !rucError ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-700'} transition-all duration-500`} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {rucError && <p className="text-[9px] text-rose-500 font-black mt-1 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-lg inline-block">{rucError}</p>}
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

                            <div className="p-8 bg-white/2 rounded-[2.5rem] border border-white/5 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/5 blur-[80px] rounded-full pointer-events-none"></div>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-white/5 pb-4 flex items-center gap-3">
                                    <DocumentTextIcon className="w-4 h-4 text-liquid-gold opacity-50" /> Configuración Tributaria Imprenta
                                </h3>

                                <div className="flex flex-wrap gap-3">
                                    {[Regimen.GENERAL, Regimen.EMPRENDEDOR, Regimen.NEGOCIO_POPULAR].map((reg) => (
                                        <button
                                            key={reg}
                                            type="button"
                                            onClick={() => setNewClienteData(prev => ({ ...prev, regimen: reg }))}
                                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${newClienteData.regimen === reg ? 'border-liquid-gold bg-liquid-gold text-brand-dark shadow-gold-glow' : 'border-white/5 bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                                        >
                                            {reg}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <InputField label="Estab. Matriz" name="establecimientoPredeterminado" value={newClienteData.establecimientoPredeterminado} onChange={e => setNewClienteData({ ...newClienteData, establecimientoPredeterminado: e.target.value })} maxLength={3} placeholder="001" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <InputField label="Punto Emisión" name="puntoEmisionPredeterminado" value={newClienteData.puntoEmisionPredeterminado} onChange={e => setNewClienteData({ ...newClienteData, puntoEmisionPredeterminado: e.target.value })} maxLength={3} placeholder="001" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <InputField label="Total Estab." name="numEstablecimientosOpen" type="number" value={newClienteData.numEstablecimientosOpen} onChange={e => setNewClienteData({ ...newClienteData, numEstablecimientosOpen: parseInt(e.target.value) })} />
                                    </div>
                                </div>

                                <InputField label="Dirección Matriz (SRI)" name="direccion" value={newClienteData.direccion} onChange={e => setNewClienteData({ ...newClienteData, direccion: e.target.value.toUpperCase() })} isHighlighted={highlightFields.includes('direccion')} placeholder="CALLE, CIUDAD, PROVINCIA" />

                                <div className="group space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-focus-within:text-liquid-gold transition-colors italic">Actividades Económicas (Separadas por puntos)</label>
                                    <div className="flex flex-col gap-3 p-6 bg-white/5 rounded-2xl border border-white/5 group-focus-within:border-white/10 transition-all">
                                        <div className="flex flex-wrap gap-2">
                                            {actividades.map((a, i) => (
                                                <span key={i} className="bg-brand-dark/80 text-white text-[9px] font-bold px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10 shadow-luxury animate-scale-in">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold"></div>
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
                                                placeholder="Ej: CULTIVO DE CACAO (A01270201)..."
                                                className="bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white flex-grow placeholder:text-slate-700 outline-none focus:border-liquid-gold/30 transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => addActividad(currentActividad)}
                                                className="px-6 py-3 bg-liquid-gold text-brand-dark font-black text-[10px] uppercase rounded-xl hover:scale-105 active:scale-95 transition-all"
                                            >
                                                Añadir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                            <InputField
                                label="DNI / Cédula (Opcional)"
                                name="cedulaRuc"
                                value={newClienteData.cedulaRuc}
                                onChange={e => setNewClienteData({ ...newClienteData, cedulaRuc: e.target.value })}
                                maxLength={10}
                                placeholder="Requerido para comprobante simple"
                            />
                            <InputField
                                label="Nota / Referencia de Entrega"
                                name="direccion"
                                value={newClienteData.direccion}
                                onChange={e => setNewClienteData({ ...newClienteData, direccion: e.target.value })}
                                placeholder="Indicaciones especiales..."
                            />
                        </div>
                    )}
                </form>
            </div>

            {/* FOOTER ACCIONES - Aumentar z-index y padding para evitar solapamientos */}
            <div className="flex-shrink-0 p-6 md:p-8 bg-black/60 backdrop-blur-xl border-t border-white/5 flex flex-col md:flex-row gap-4 relative z-40">
                <button
                    onClick={onClose}
                    className="flex-1 py-4 px-8 rounded-2xl bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5 active:scale-95"
                >
                    Abortar Protocolo
                </button>
                <button
                    type="submit"
                    form="create-client-form"
                    disabled={isSaving || saveSuccess || (mode === 'SRI' && !!rucError)}
                    className="flex-[2] py-4 px-8 rounded-2xl bg-liquid-gold text-black font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] shadow-gold-glow transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale active:scale-[0.98]"
                >
                    {isSaving ? <Loader2Icon className="animate-spin w-5 h-5 md:w-6 md:h-6" /> : saveSuccess ? <CheckCircleIcon className="w-5 h-5 md:w-6 md:h-6" /> : mode === 'SRI' ? "Sincronizar Protocolo SRI" : "Autorizar Perfil Express"}
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
    const { sriCredentials } = useData();
    const hasKey = isSri && sriCredentials.some(s => s.ruc === client.ruc);
    
    return (
        <div 
            onClick={() => onSelect(client)} 
            className={`p-5 cursor-pointer hover:bg-white/5 flex justify-between items-center transition-all group relative overflow-hidden ${selectedId === client.id ? 'bg-liquid-gold/10' : ''}`}
        >
            <div className={`absolute inset-y-0 left-0 w-1 ${isSri ? 'bg-liquid-gold' : 'bg-liquid-gold/40'} transition-opacity ${selectedId === client.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
            <div className="flex items-center gap-5 relative z-10">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${isSri ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'bg-liquid-gold/20 text-liquid-gold'}`}>
                    {(client.nombre || '?').charAt(0)}
                </div>
                <div className="min-w-0">
                    <p className="font-black text-white text-base tracking-tight uppercase leading-tight mb-1.5 truncate">{client.nombre || 'SIN NOMBRE'}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                            <IdentificationIcon className="w-3 h-3 opacity-40"/> {client.cedula || client.ruc} 
                        </p>
                        {isSri && (
                            <div className="flex gap-1.5 items-center">
                                <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 tracking-tighter uppercase">RUC OFICIAL</span>
                                {hasKey && (
                                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 border border-green-500/20 tracking-tighter uppercase flex items-center gap-1">
                                        <ShieldCheckIcon className="w-2 h-2"/> CLAVE ENCONTRADA ✅
                                    </span>
                                )}
                            </div>
                        )}
                        {!isSri && (
                            <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-liquid-gold/10 text-liquid-gold/60 border border-liquid-gold/10 tracking-tighter uppercase">IDENTIDAD NATURAL</span>
                        )}
                    </div>
                </div>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-slate-600 group-hover:text-liquid-gold transition-all group-hover:translate-x-1" />
        </div>
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
                    // Si parece un RUC, buscar directo
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
                {/* Botón de Acción Principal Directo SRI */}
                <button
                    onClick={() => handleOpenCreate('SRI')}
                    className="w-full bg-liquid-gold/5 border-2 border-liquid-gold/20 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-between gap-4 md:gap-6 group hover:bg-liquid-gold/10 hover:border-liquid-gold/40 transition-all shadow-gold-glow-soft relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-liquid-gold/20 transition-all"></div>
                    <div className="flex items-center gap-4 md:gap-6 relative z-10">
                        <div className="p-3 md:p-4 bg-liquid-gold text-black rounded-xl md:rounded-2xl shadow-gold-glow group-hover:scale-110 transition-transform">
                            <UserPlusIcon className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div className="text-left">
                            <p className="text-[9px] md:text-[11px] font-black text-liquid-gold uppercase tracking-[0.4em] md:tracking-[0.5em] mb-1 italic">Protocolo de Alta Oficial</p>
                            <h4 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">Inscribir como SRI</h4>
                            <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 md:mt-1">Padrón El Oro y PDF</p>
                        </div>
                    </div>
                    <ArrowRightIcon className="w-6 h-6 md:w-8 md:h-8 text-liquid-gold/30 group-hover:text-liquid-gold group-hover:translate-x-2 transition-all relative z-10" />
                </button>

                <div className="relative group">
                    <div className="absolute inset-0 bg-liquid-gold/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                    
                    {/* Tactical Scanning Beam for Search Bar */}
                    <div className="absolute inset-y-0 left-0 w-16 flex items-center justify-center z-20">
                         <motion.div 
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-px h-10 bg-liquid-gold shadow-gold-glow"
                         />
                    </div>

                    <SearchIcon className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-liquid-gold group-focus-within:scale-110 transition-all z-20" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="BUSCAR CLIENTE O RUC..."
                        className="w-full pl-14 md:pl-16 pr-12 md:pr-14 py-4 md:py-6 bg-black/40 border border-white/5 rounded-[1.2rem] md:rounded-[1.5rem] text-sm md:text-lg font-black text-white focus:bg-black/60 focus:ring-1 focus:ring-liquid-gold/40 transition-all placeholder:text-slate-800 uppercase tracking-widest relative z-10"
                    />

                    {/* Biometric Data Streams (Visual Only) */}
                    <div className="absolute right-20 top-1/2 -translate-y-1/2 flex gap-1 items-end h-4 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity z-20">
                        {[0.4, 0.7, 0.5, 0.9, 0.3].map((h, i) => (
                            <motion.div 
                                key={i}
                                animate={{ height: [h*100 + '%', (1-h)*100 + '%', h*100 + '%'] }}
                                transition={{ duration: 1 + i*0.2, repeat: Infinity }}
                                className="w-1 bg-liquid-gold/40 rounded-full"
                            />
                        ))}
                    </div>

                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-20">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    )}
                    {isSearchingPadron && (
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden rounded-full z-20">
                            <motion.div 
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-full h-full bg-gradient-to-r from-transparent via-liquid-gold to-transparent"
                            />
                        </div>
                    )}
                </div>

                {!hideQuickButtons && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handleOpenCreate('EXPRESS')}
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 p-5 rounded-2xl flex items-center gap-4 transition-all group active:scale-95"
                        >
                            <div className="p-3 bg-liquid-gold text-brand-dark rounded-xl shadow-gold-glow">
                                <BoltIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Acceso Rápido</span>
                                <span className="block text-[11px] font-black uppercase text-white group-hover:text-liquid-gold transition-colors">Perfil Consumidor Final</span>
                            </div>
                        </button>

                        <button
                            onClick={onSkip}
                            className="flex-1 bg-white/2 hover:bg-white/5 border border-white/5 p-5 rounded-2xl flex items-center gap-4 transition-all group active:scale-95"
                        >
                            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all shadow-glow">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Omitir Identidad</span>
                                <span className="block text-[11px] font-black uppercase text-white group-hover:text-blue-400 transition-colors">Trabajo Anónimo</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {
        searchTerm.length > 1 && (
            <div className="bg-brand-dark/40 backdrop-blur-3xl rounded-[2.5rem] shadow-luxury border border-white/5 overflow-hidden animate-slide-in-up divide-y divide-white/5">
                {filteredClients.map((c) => (
                    <div key={c.id} onClick={() => onSelect(c)} className={`p-6 cursor-pointer hover:bg-white/[0.03] flex justify-between items-center transition-all group relative overflow-hidden ${selectedId === c.id ? 'bg-liquid-gold/10' : ''}`}>
                        <div className={`absolute inset-y-4 left-0 w-1 rounded-full ${c.ruc ? 'bg-liquid-gold' : 'bg-liquid-gold/40'} transition-all ${selectedId === c.id ? 'h-12 opacity-100' : 'h-4 opacity-0 group-hover:opacity-100 group-hover:h-8'}`}></div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl transition-transform group-hover:scale-105 ${c.ruc ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'bg-liquid-gold/10 text-liquid-gold border border-liquid-gold/20'}`}>
                                {(c.nombre || '?').charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-white text-lg tracking-tight uppercase leading-none mb-2 truncate group-hover:text-liquid-gold transition-colors">{c.nombre || 'SIN NOMBRE'}</p>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <IdentificationIcon className="w-3.5 h-3.5 opacity-50" /> {c.cedula || c.ruc}
                                    </span>
                                    {c.ruc ? (
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded bg-liquid-gold/10 text-liquid-gold border border-liquid-gold/20 uppercase tracking-widest italic">Contribuyente SRI</span>
                                    ) : (
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded bg-white/5 text-slate-600 border border-white/10 uppercase tracking-widest italic">Cliente Final</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <span className="text-[8px] font-black text-liquid-gold uppercase tracking-widest">Seleccionar</span>
                            <ArrowRightIcon className="w-5 h-5 text-liquid-gold" />
                        </div>
                    </div>
                ))}
                {filteredClients.length === 0 && padronResults.length > 0 && (
                    <div className="bg-liquid-gold/5">
                        <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2">
                            <SparklesIcon className="w-3 h-3 text-liquid-gold" />
                            <span className="text-[9px] font-black text-liquid-gold uppercase tracking-[0.2em]">Padrón Inteligente (El Oro) - ¿Es este el cliente?</span>
                        </div>
                        {padronResults.map((p) => (
                            <div
                                key={p.ruc}
                                onClick={() => {
                                    setCreateMode('SRI');
                                    setIsCreateModalOpen(true);
                                    setSearchTerm(p.ruc); // Esto disparará el lookup en el modal
                                }}
                                className="p-5 cursor-pointer hover:bg-white/5 flex justify-between items-center transition-all group"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="h-12 w-12 rounded-2xl bg-liquid-gold/10 text-liquid-gold flex items-center justify-center font-black text-lg border border-liquid-gold/20">
                                        {p.razon_social.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-base uppercase truncate max-w-[350px] italic">{p.razon_social}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{p.ruc}</p>
                                            <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5">{p.canton}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[8px] font-black text-liquid-gold uppercase tracking-widest">Inscripción Auto</p>
                                        <p className="text-[10px] font-black text-white uppercase italic">Sincronizar</p>
                                    </div>
                                    <div className="p-3 bg-liquid-gold text-brand-dark rounded-xl group-hover:scale-110 transition-transform">
                                        <SparklesIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredClients.length === 0 && padronResults.length === 0 && !isSearchingPadron && (
                    <div className="p-10 text-center space-y-4">
                        <ExclamationTriangleIcon className="w-10 h-10 mx-auto text-slate-700 opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sin coincidencias en base de datos</p>
                        <button
                            onClick={() => handleOpenCreate(hideQuickButtons ? 'SRI' : 'EXPRESS')}
                            className={`${hideQuickButtons ? 'bg-liquid-gold text-black px-8 py-3 rounded-xl shadow-gold-glow' : 'text-liquid-gold border-b border-liquid-gold/30 pb-1'} text-[9px] font-black uppercase tracking-widest transition-all`}
                        >
                            {hideQuickButtons ? 'Inscribir como Nuevo Contribuyente SRI' : 'Dar de alta como nuevo cliente'}
                        </button>
                    </div>
                )}

                {isSearchingPadron && (
                    <div className="p-10 text-center">
                        <Loader2Icon className="w-6 h-6 text-liquid-gold animate-spin mx-auto mb-3" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Consultando Padrón Inteligente...</p>
                    </div>
                )}
            </div>
        )
    }

            {onCancel && (
                <button onClick={onCancel} className="mt-8 text-slate-500 hover:text-white text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors w-full text-center py-4 active:scale-95 border-t border-white/5 pt-8">
                    Abandonar Proceso
                </button>
            )}

            <CreateClientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onClientCreated={(c) => { setIsCreateModalOpen(false); onSelect(c); }}
                initialName={!/^\d+$/.test(searchTerm) ? searchTerm.toUpperCase() : ''}
                initialCedulaRuc={/^\d+$/.test(searchTerm) ? searchTerm : ''}
                initialMode={hideQuickButtons ? 'SRI' : createMode}
                isLocked={hideQuickButtons}
            />
        </div >
    );
};

export default ClientSelector;
