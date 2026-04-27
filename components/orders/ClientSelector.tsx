
import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { extractDataFromSriPdf } from '../../services/pdfExtraction';
import { sriLookupService } from '../../services/sriLookupService';
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
    <div className="group space-y-2">
        <label htmlFor={name} className={`block text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${error ? 'text-brand-red' : isHighlighted ? 'text-liquid-gold' : 'text-slate-500 group-focus-within:text-liquid-gold'}`}>
            {label} {required && <span className="text-brand-red opacity-50">*</span>} {isHighlighted && "✨"}
        </label>
        <input
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full px-5 py-3.5 bg-white/5 border rounded-2xl text-white font-bold text-sm outline-none transition-all
                ${error
                    ? 'border-brand-red/50 bg-brand-red/5 focus:ring-1 focus:ring-brand-red text-white'
                    : isHighlighted
                        ? 'border-liquid-gold/50 bg-liquid-gold/5 focus:ring-1 focus:ring-liquid-gold'
                        : 'border-white/5 focus:border-white/20 focus:bg-white/10'
                }`}
            {...props}
        />
        {error && <p className="text-[9px] text-brand-red font-black mt-1 uppercase tracking-widest bg-brand-red/10 px-3 py-1 rounded-lg inline-block">{error}</p>}
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
        numEstablecimientosOpen: 1
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
                numEstablecimientosOpen: 1
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

        setNewClienteData(prev => ({
            ...prev,
            nombre: data.nombre || prev.nombre,
            cedulaRuc: data.ruc || prev.cedulaRuc,
            direccion: data.direccion || prev.direccion,
            regimen: regimenFinal,
            email: data.email || prev.email,
            numEstablecimientosOpen: data.numEstablecimientos || 1,
            establecimientoPredeterminado: data.establecimientoPrincipal || '001'
        }));

        if (data.telefono) {
            const rawPhones = data.telefono.split(/[,;]/);
            const cleanPhones = rawPhones.map((p: string) => p.replace(/\D/g, '')).filter((p: string) => p.length >= 7);
            setTelefonos(prev => Array.from(new Set([...prev, ...cleanPhones])));
        }

        // Dividimos por saltos de línea (del PDF), por el separador de la DB (|) o por viñetas (•)
        const cleaned = data.actividades.split(/[|\n•]/)
            .map((a: string) => a.trim().toUpperCase())
            .filter((a: string) => a.length > 4)
            .map((a: string) => a.replace(/^\.*|[\.*]$/g, '').trim()); // Quitar puntos al inicio/final

        // Unimos con las que ya estaban en el formulario (acumulación)
        setActividades(prev => {
            const combined = [...prev, ...cleaned];
            // Filtramos duplicados manteniendo el orden
            return combined.filter((item, index) => combined.indexOf(item) === index);
        });
    }
    setTimeout(() => setHighlightFields([]), 3000);
};

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
    if (mode === 'SRI' && !newClienteData.cedulaRuc) {
        setRucError('El RUC es obligatorio para clientes SRI');
        return;
    }

    // Valor por defecto para CI en modo Express si no se llena
    const finalId = newClienteData.cedulaRuc || '9999999999';

    setIsSaving(true);
    try {
        const newCliente = await addCliente({
            ...newClienteData,
            cedula: finalId, // Asegurar que siempre viaje algo
            ruc: mode === 'SRI' ? newClienteData.cedulaRuc : undefined,
            actividades: actividades.join(' • '),
            telefono: telefonos.length > 0 ? telefonos : (currentTelefono ? [currentTelefono] : ['0990000000']),
            // Limpiar datos SRI si es modo express
            regimen: mode === 'EXPRESS' ? Regimen.GENERAL : newClienteData.regimen,
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
                            <div className={`w-1.5 h-1.5 rounded-full ${mode === 'EXPRESS' ? 'bg-liquid-gold' : 'bg-brand-red'} animate-pulse`}></div>
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
                            className={`flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 transition-all ${mode === 'SRI' ? 'bg-brand-red text-white shadow-red-glow' : 'text-slate-500 hover:text-white'}`}
                        >
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-red animate-pulse"></div>
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
                            className={`w-full group relative flex flex-col items-center justify-center gap-3 py-8 rounded-[2.5rem] border-2 border-dashed transition-all overflow-hidden ${isScanning ? 'border-liquid-gold bg-liquid-gold/5' : 'border-white/5 bg-white/2 hover:border-white/20 hover:bg-white/5'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {isScanning ? <Loader2Icon className="w-8 h-8 text-liquid-gold animate-spin" /> : <UploadIcon className="w-8 h-8 text-liquid-gold opacity-50 group-hover:opacity-100 transition-all" />}
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

                        <div className="group space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-focus-within:text-liquid-gold transition-colors">
                                Teléfono / Whatsapp {mode === 'EXPRESS' && <span className="text-brand-red opacity-50">*</span>}
                            </label>
                            <div className={`flex flex-wrap gap-2 p-3.5 bg-white/5 border rounded-2xl transition-all ${highlightFields.includes('telefono') ? 'border-liquid-gold/50 bg-liquid-gold/5 shadow-gold-glow-soft' : 'border-white/5 group-focus-within:border-white/20 group-focus-within:bg-white/10'}`}>
                                {telefonos.map((t, idx) => (
                                    <span key={idx} className="bg-liquid-gold text-brand-dark px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-luxury animate-scale-in">
                                        <PhoneIcon className="w-3 h-3" /> {t}
                                        <button type="button" className="opacity-60 hover:opacity-100" onClick={() => setTelefonos(telefonos.filter((_, i) => i !== idx))}>&times;</button>
                                    </span>
                                ))}
                                <input
                                    type="tel"
                                    placeholder="Añadir teléfono..."
                                    value={currentTelefono}
                                    onChange={e => setCurrentTelefono(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTelefono(currentTelefono))}
                                    onBlur={() => currentTelefono && addTelefono(currentTelefono)}
                                    className="bg-transparent border-none outline-none text-sm font-bold text-white flex-grow min-w-[150px] placeholder:text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Campos Específicos SRI */}
                    {mode === 'SRI' ? (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="RUC (13 Dígitos)"
                                    name="cedulaRuc"
                                    value={newClienteData.cedulaRuc}
                                    onChange={e => setNewClienteData({ ...newClienteData, cedulaRuc: e.target.value })}
                                    maxLength={13}
                                    required
                                    isHighlighted={highlightFields.includes('cedulaRuc')}
                                    error={rucError}
                                    placeholder="0101234567001"
                                />
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
                                                    <button type="button" className="text-brand-red opacity-60 hover:opacity-100 font-black text-xs" onClick={() => setActividades(actividades.filter((_, idx) => idx !== i))}>&times;</button>
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
                    className="flex-[2] py-4 px-8 rounded-2xl bg-brand-red text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 shadow-xl shadow-red-900/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale active:scale-[0.98]"
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
            <div className={`absolute inset-y-0 left-0 w-1 ${isSri ? 'bg-brand-red' : 'bg-liquid-gold'} transition-opacity ${selectedId === client.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
            <div className="flex items-center gap-5 relative z-10">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${isSri ? 'bg-brand-red/20 text-brand-red' : 'bg-liquid-gold/20 text-liquid-gold'}`}>
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
    hideQuickButtons?: boolean;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelect, selectedId, onSkip, hideQuickButtons }) => {
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
                    className="w-full bg-brand-red/5 border-2 border-brand-red/20 p-8 rounded-[2.5rem] flex items-center justify-between gap-6 group hover:bg-brand-red/10 hover:border-brand-red/40 transition-all shadow-red-glow-soft relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 blur-[50px] -mr-16 -mt-16 group-hover:bg-brand-red/20 transition-all"></div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="p-4 bg-brand-red text-white rounded-2xl shadow-red-glow group-hover:scale-110 transition-transform">
                            <UserPlusIcon className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-brand-red uppercase tracking-[0.5em] mb-1 italic">Protocolo de Alta Oficial</p>
                            <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Inscribir como Nuevo Contribuyente SRI</h4>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sincronización instantánea con padrón El Oro y PDF</p>
                        </div>
                    </div>
                    <ArrowRightIcon className="w-8 h-8 text-brand-red/30 group-hover:text-brand-red group-hover:translate-x-2 transition-all relative z-10" />
                </button>

                <div className="relative group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por Nombre, Cédula o RUC..."
                        className="w-full pl-16 pr-14 py-6 bg-white/5 border border-white/5 rounded-[2.5rem] text-xl font-black text-white focus:bg-white/10 focus:ring-1 focus:ring-liquid-gold/30 transition-all placeholder:text-slate-700 uppercase tracking-tight"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>

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
            </div>
                )}
        </div>

            {
        searchTerm.length > 1 && (
            <div className="bg-brand-dark/40 backdrop-blur-3xl rounded-[2.5rem] shadow-luxury border border-white/5 overflow-hidden animate-slide-in-up divide-y divide-white/5">
                {filteredClients.map((c) => (
                    <div key={c.id} onClick={() => onSelect(c)} className={`p-5 cursor-pointer hover:bg-white/5 flex justify-between items-center transition-all group relative overflow-hidden ${selectedId === c.id ? 'bg-liquid-gold/10' : ''}`}>
                        <div className={`absolute inset-y-0 left-0 w-1 bg-liquid-gold transition-opacity ${selectedId === c.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                        <div className="flex items-center gap-5 relative z-10">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${c.regimen === Regimen.NEGOCIO_POPULAR ? 'bg-orange-500/20 text-orange-400' : 'bg-liquid-gold/20 text-liquid-gold'}`}>
                                {(c.nombre || '?').charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-white text-base tracking-tight uppercase leading-tight mb-1.5 truncate">{c.nombre || 'SIN NOMBRE'}</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <IdentificationIcon className="w-3 h-3 opacity-40" /> {c.cedula || c.ruc}
                                    </p>
                                    {c.ruc && (
                                        <div className="flex gap-1.5 items-center">
                                            <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 tracking-tighter uppercase">RUC OFICIAL</span>
                                            {useData().sriCredentials.some(s => s.ruc === c.ruc) && (
                                                <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 border border-green-500/20 tracking-tighter uppercase flex items-center gap-1">
                                                    <ShieldCheckIcon className="w-2 h-2" /> CLAVE ENCONTRADA ✅
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-slate-600 group-hover:text-liquid-gold transition-all group-hover:translate-x-1" />
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
                            className={`${hideQuickButtons ? 'bg-brand-red text-white px-8 py-3 rounded-xl shadow-red-glow' : 'text-liquid-gold border-b border-liquid-gold/30 pb-1'} text-[9px] font-black uppercase tracking-widest transition-all`}
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
