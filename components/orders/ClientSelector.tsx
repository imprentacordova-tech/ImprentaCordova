
import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { extractDataFromSriPdf } from '../../services/pdfExtraction';
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
    initialMode?: ClientMode; // Nuevo prop para abrir directo en el modo deseado
}> = ({ isOpen, onClose, onClientCreated, initialName, initialCedulaRuc, initialMode = 'EXPRESS' }) => {
    
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
        if (mode === 'SRI' && newClienteData.cedulaRuc.length >= 10) {
            const isValid = validarIdentificacionEC(newClienteData.cedulaRuc);
            setRucError(isValid ? '' : 'Identificación inválida (Ecuador)');
        } else {
            setRucError('');
        }
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

        if (data.actividades) {
            const cleaned = data.actividades.split(/[|\n]/)
                .map((a: string) => a.trim().toUpperCase())
                .filter((a: string) => a.length > 4);
            setActividades(prev => Array.from(new Set([...prev, ...cleaned])));
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
                actividades: actividades.join('|'),
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
        <div className="fixed inset-0 bg-brand-dark/95 backdrop-blur-3xl z-[70] flex justify-center items-center p-4 animate-fade-in overflow-hidden">
            <div className="bg-brand-dark border border-white/5 rounded-[3.5rem] shadow-luxury w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] relative">
                
                {/* Header decorativo con gradiente */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-liquid-gold/5 to-transparent pointer-events-none"></div>

                {/* Header con Switcher */}
                <div className="flex flex-col p-10 gap-8 relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                                {mode === 'EXPRESS' ? 'REGISTRO DE CLIENTE RÁPIDO' : 'CONTRIBUYENTE SRI (OFICIAL)'}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${mode === 'EXPRESS' ? 'bg-liquid-gold' : 'bg-brand-red'} animate-pulse`}></div>
                                {mode === 'EXPRESS' ? 'Datos indispensables para facturación genérica' : 'Expediente completo para tributación oficial'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5">
                            <CloseIcon className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="bg-white/5 p-1.5 rounded-[1.8rem] flex font-black text-[10px] uppercase tracking-widest border border-white/5">
                        <button 
                            type="button"
                            onClick={() => setMode('EXPRESS')}
                            className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${mode === 'EXPRESS' ? 'bg-white text-brand-dark shadow-luxury' : 'text-slate-500 hover:text-white'}`}
                        >
                            <BoltIcon className="w-4 h-4"/> Express (Normal)
                        </button>
                        <button 
                            type="button"
                            onClick={() => setMode('SRI')}
                            className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${mode === 'SRI' ? 'bg-brand-red text-white shadow-red-glow' : 'text-slate-500 hover:text-white'}`}
                        >
                            <ShieldCheckIcon className="w-4 h-4"/> Perfil Tributario RUC
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow p-10 space-y-10 overflow-y-auto custom-scrollbar relative z-10 pb-40">
                    
                    {/* Botón Scanner solo visible en modo SRI */}
                    {mode === 'SRI' && (
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isScanning}
                            className={`w-full group relative flex flex-col items-center justify-center gap-3 py-10 rounded-[2.5rem] border-2 border-dashed transition-all overflow-hidden ${isScanning ? 'border-liquid-gold bg-liquid-gold/5' : 'border-white/5 bg-white/2 hover:border-white/20 hover:bg-white/5'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            {isScanning ? <Loader2Icon className="w-10 h-10 text-liquid-gold animate-spin" /> : <UploadIcon className="w-10 h-10 text-liquid-gold opacity-50 group-hover:opacity-100 transition-all" />}
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] relative z-10">
                                {isScanning ? "IA Analizando estructura tributaria..." : "Sincronizar con Documento RUC (PDF/Foto)"}
                            </span>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                        </button>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Campos Comunes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField 
                                label="Nombre / Razón Social" 
                                name="nombre" 
                                value={newClienteData.nombre} 
                                onChange={e => setNewClienteData({...newClienteData, nombre: e.target.value.toUpperCase()})} 
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
                                        <span key={idx} className="bg-liquid-gold text-brand-dark px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2 shadow-luxury">
                                            <PhoneIcon className="w-3 h-3"/> {t} 
                                            <button type="button" className="opacity-60 hover:opacity-100" onClick={() => setTelefonos(telefonos.filter((_, i) => i !== idx))}>&times;</button>
                                        </span>
                                    ))}
                                    <input 
                                        type="tel" 
                                        placeholder="Ingresar número..." 
                                        value={currentTelefono} 
                                        onChange={e => setCurrentTelefono(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTelefono(currentTelefono))}
                                        onBlur={() => currentTelefono && addTelefono(currentTelefono)}
                                        className="bg-transparent border-none outline-none text-sm font-bold text-white flex-grow min-w-[150px] placeholder:text-slate-600"
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
                                        onChange={e => setNewClienteData({...newClienteData, cedulaRuc: e.target.value})} 
                                        maxLength={13} 
                                        required 
                                        isHighlighted={highlightFields.includes('cedulaRuc')} 
                                        error={rucError}
                                    />
                                    <InputField 
                                        label="Email (Para Facturación)" 
                                        name="email" 
                                        type="email"
                                        value={newClienteData.email} 
                                        onChange={e => setNewClienteData({...newClienteData, email: e.target.value})} 
                                        isHighlighted={highlightFields.includes('email')} 
                                    />
                                </div>

                                <div className="p-8 bg-white/2 rounded-[2.5rem] border border-white/5 space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/5 blur-[80px] rounded-full pointer-events-none"></div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-white/5 pb-4 flex items-center gap-3">
                                        <DocumentTextIcon className="w-4 h-4 text-liquid-gold opacity-50"/> Inteligencia Tributaria Avanzada
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
                                        <InputField label="Matriz / Dirección" name="direccion" value={newClienteData.direccion} onChange={e => setNewClienteData({...newClienteData, direccion: e.target.value.toUpperCase()})} isHighlighted={highlightFields.includes('direccion')} />
                                        <InputField label="Estab. (P.E)" name="establecimientoPredeterminado" value={newClienteData.establecimientoPredeterminado} onChange={e => setNewClienteData({...newClienteData, establecimientoPredeterminado: e.target.value})} maxLength={3} />
                                        <InputField label="Punto Emisión" name="puntoEmisionPredeterminado" value={newClienteData.puntoEmisionPredeterminado} onChange={e => setNewClienteData({...newClienteData, puntoEmisionPredeterminado: e.target.value})} maxLength={3} />
                                    </div>

                                    <div className="group space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-focus-within:text-liquid-gold transition-colors">Actividades Económicas Habilitadas</label>
                                        <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 group-focus-within:border-white/10 transition-all">
                                            {actividades.map((a, i) => (
                                                <span key={i} className="bg-white/10 text-white text-[9px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/5">
                                                    {a} <button type="button" className="opacity-60 hover:opacity-100" onClick={() => setActividades(actividades.filter((_, idx) => idx !== i))}>&times;</button>
                                                </span>
                                            ))}
                                            <input 
                                                type="text" 
                                                value={currentActividad} 
                                                onChange={e => setCurrentActividad(e.target.value)} 
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addActividad(currentActividad))}
                                                placeholder="Añadir descriptor de actividad..."
                                                className="bg-transparent border-none outline-none text-xs font-bold text-white flex-grow placeholder:text-slate-700 min-w-[200px]"
                                            />
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
                                    onChange={e => setNewClienteData({...newClienteData, cedulaRuc: e.target.value})} 
                                    maxLength={10} 
                                    placeholder="Requerido para comprobante simple"
                                />
                                <InputField 
                                    label="Nota / Referencia de Entrega" 
                                    name="direccion" 
                                    value={newClienteData.direccion} 
                                    onChange={e => setNewClienteData({...newClienteData, direccion: e.target.value})} 
                                    placeholder="Indicaciones especiales..."
                                />
                            </div>
                        )}

                        {rucError && mode === 'EXPRESS' && (
                            <div className="bg-brand-red/10 border border-brand-red/20 p-4 rounded-2xl mb-4 text-center">
                                <p className="text-[10px] text-brand-red font-black uppercase tracking-widest">{rucError}</p>
                            </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-10 bg-brand-dark/80 backdrop-blur-xl border-t border-white/10 flex justify-end gap-6 z-20">
                            <button type="button" onClick={onClose} className="px-10 py-5 text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] hover:text-white transition-colors">Abortar</button>
                            <button type="submit" disabled={isSaving || saveSuccess || (mode === 'SRI' && !!rucError)} className={`min-w-[320px] px-10 py-5 text-brand-dark font-black rounded-2xl shadow-luxury transition-all flex items-center justify-center gap-4 uppercase text-xs tracking-[0.2em] ${saveSuccess ? 'bg-green-500 scale-[1.02]' : 'bg-white hover:bg-liquid-gold'} disabled:opacity-30 disabled:cursor-not-allowed`}>
                                {isSaving ? <Loader2Icon className="animate-spin w-6 h-6"/> : saveSuccess ? <CheckCircleIcon className="w-6 h-6"/> : mode === 'SRI' ? "Inscribir Contribuyente SRI" : "Habilitar Perfil Express"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
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
    
    const filteredClients = searchTerm.length > 1 
        ? clientes.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.cedula.includes(searchTerm) || (c.ruc && c.ruc.includes(searchTerm))).slice(0, 5)
        : [];

    const handleOpenCreate = (mode: ClientMode) => {
        setCreateMode(mode);
        setIsCreateModalOpen(true);
    };

    return (
        <div className="animate-fade-in w-full space-y-6">
            <div className="flex flex-col gap-4">
                <div className="relative group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="ID, Nombre o RUC..." 
                        className="w-full pl-14 pr-14 py-5 bg-white/5 border border-white/5 rounded-[2rem] text-lg font-black text-white focus:bg-white/10 focus:ring-1 focus:ring-liquid-gold/30 transition-all placeholder:text-slate-600 uppercase tracking-tight" 
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                            <CloseIcon className="w-5 h-5"/>
                        </button>
                    )}
                </div>
                
                {!hideQuickButtons && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button 
                            onClick={() => handleOpenCreate('EXPRESS')} 
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all group active:scale-95"
                        >
                            <div className="p-3 bg-liquid-gold text-brand-dark rounded-xl shadow-gold-glow">
                                <BoltIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Nuevo Perfil</span>
                                <span className="block text-[11px] font-black uppercase text-white group-hover:text-liquid-gold transition-colors">Express</span>
                            </div>
                        </button>
                        
                        <button 
                            onClick={() => handleOpenCreate('SRI')} 
                            className="flex-1 bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all group active:scale-95"
                        >
                            <div className="p-3 bg-brand-red text-white rounded-xl shadow-red-glow">
                                <ShieldCheckIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Registro</span>
                                <span className="block text-[11px] font-black uppercase text-white group-hover:text-brand-red transition-colors">Oficial SRI</span>
                            </div>
                        </button>

                        <button 
                            onClick={onSkip}
                            className="flex-1 bg-white/2 hover:bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-4 transition-all group active:scale-95"
                        >
                            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all shadow-glow">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Acceso Directo</span>
                                <span className="block text-[11px] font-black uppercase text-white group-hover:text-blue-400 transition-colors">Trabajos Generales</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {searchTerm.length > 1 && (
                <div className="bg-brand-dark/40 backdrop-blur-3xl rounded-[2.5rem] shadow-luxury border border-white/5 overflow-hidden animate-slide-in-up divide-y divide-white/5">
                    {filteredClients.map((c) => (
                        <div key={c.id} onClick={() => onSelect(c)} className={`p-5 cursor-pointer hover:bg-white/5 flex justify-between items-center transition-all group relative overflow-hidden ${selectedId === c.id ? 'bg-liquid-gold/10' : ''}`}>
                            <div className={`absolute inset-y-0 left-0 w-1 bg-liquid-gold transition-opacity ${selectedId === c.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}></div>
                            <div className="flex items-center gap-5 relative z-10">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${c.regimen === Regimen.NEGOCIO_POPULAR ? 'bg-orange-500/20 text-orange-400' : 'bg-liquid-gold/20 text-liquid-gold'}`}>
                                    {c.nombre.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-white text-base tracking-tight uppercase leading-tight mb-1.5 truncate">{c.nombre}</p>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                            <IdentificationIcon className="w-3 h-3 opacity-40"/> {c.cedula || c.ruc} 
                                        </p>
                                        {c.ruc && (
                                            <div className="flex gap-1.5 items-center">
                                                <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/5 tracking-tighter uppercase">RUC OFICIAL</span>
                                                {useData().sriCredentials.some(s => s.ruc === c.ruc) && (
                                                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 border border-green-500/20 tracking-tighter uppercase flex items-center gap-1">
                                                        <ShieldCheckIcon className="w-2 h-2"/> CLAVE ENCONTRADA ✅
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
                    {filteredClients.length === 0 && (
                        <div className="p-10 text-center space-y-4">
                            <ExclamationTriangleIcon className="w-10 h-10 mx-auto text-slate-700 opacity-50"/>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Sin coincidencias en base de datos</p>
                            <button onClick={() => handleOpenCreate('EXPRESS')} className="text-liquid-gold hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors border-b border-liquid-gold/30 pb-1">Dar de alta como nuevo cliente</button>
                        </div>
                    )}
                </div>
            )}

            <CreateClientModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onClientCreated={(c) => { setIsCreateModalOpen(false); onSelect(c); }}
                initialName={!/^\d+$/.test(searchTerm) ? searchTerm.toUpperCase() : ''}
                initialCedulaRuc={/^\d+$/.test(searchTerm) ? searchTerm : ''}
                initialMode={createMode}
            />
        </div>
    );
};

export default ClientSelector;
