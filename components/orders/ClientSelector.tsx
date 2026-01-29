
import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Regimen } from '../../types';
import { createCliente, getMasterActividades } from '../../services/mockApi';
import { useData } from '../../contexts/DataContext';
import { extractClientFromImage } from '../../services/geminiService';
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
    <div className="group">
        <label htmlFor={name} className={`block text-[10px] font-black uppercase tracking-widest mb-1 transition-colors ${error ? 'text-red-500' : isHighlighted ? 'text-brand-blue' : 'text-gray-400 group-focus-within:text-brand-blue'}`}>
            {label} {required && <span className="text-red-400">*</span>} {isHighlighted && "✨"}
        </label>
        <input 
            id={name} 
            name={name} 
            value={value} 
            onChange={onChange} 
            className={`w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:border-transparent transition-all shadow-sm font-medium text-sm
                ${error 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500 text-red-900' 
                    : isHighlighted 
                        ? 'ring-2 ring-brand-blue/30 border-brand-blue bg-blue-50/50 dark:bg-brand-blue/10 focus:ring-brand-blue' 
                        : 'border-gray-200 dark:border-gray-700 focus:ring-brand-blue'
                }`} 
            {...props} 
        />
        {error && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-wider">{error}</p>}
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
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            const data = await extractClientFromImage(base64);
            if (data) {
                applyExtractedData(data);
                setMode('SRI'); // Auto-switch to SRI mode if scanning
            }
            setIsScanning(false);
        };
        reader.readAsDataURL(file);
    };

    const applyExtractedData = (data: any) => {
        const fields = ['nombre', 'cedulaRuc', 'direccion', 'regimen', 'telefono'];
        setHighlightFields(fields);
        
        let regimenFinal = Regimen.GENERAL;
        if (data.regimen?.toUpperCase().includes('POPULAR')) regimenFinal = Regimen.NEGOCIO_POPULAR;
        else if (data.regimen?.toUpperCase().includes('EMPRENDEDOR')) regimenFinal = Regimen.EMPRENDEDOR;

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
        const newCliente = await createCliente({ 
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
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-3xl w-full max-w-4xl overflow-hidden border border-white/10 flex flex-col max-h-[95vh]">
                
                {/* Header con Switcher */}
                <div className="flex flex-col p-6 border-b dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50 gap-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-black text-brand-blue dark:text-white uppercase tracking-tighter">
                                {mode === 'EXPRESS' ? 'CLIENTE RÁPIDO' : 'CONTRIBUYENTE SRI'}
                            </h2>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">
                                {mode === 'EXPRESS' ? 'Datos básicos para trabajos generales' : 'Registro completo para documentos autorizados'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full"><CloseIcon className="w-5 h-5 text-gray-400" /></button>
                    </div>

                    <div className="bg-gray-200 dark:bg-gray-800 p-1 rounded-xl flex font-bold text-xs">
                        <button 
                            onClick={() => setMode('EXPRESS')}
                            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'EXPRESS' ? 'bg-white dark:bg-slate-700 shadow text-brand-blue' : 'text-gray-500'}`}
                        >
                            <BoltIcon className="w-4 h-4"/> Express (Normal)
                        </button>
                        <button 
                            onClick={() => setMode('SRI')}
                            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'SRI' ? 'bg-white dark:bg-slate-700 shadow text-brand-red' : 'text-gray-500'}`}
                        >
                            <ShieldCheckIcon className="w-4 h-4"/> Facturación SRI
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    
                    {/* Botón Scanner solo visible en modo SRI */}
                    {mode === 'SRI' && (
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isScanning}
                            className={`w-full flex flex-col items-center justify-center gap-3 py-6 rounded-[2rem] border-2 border-dashed transition-all animate-fade-in ${isScanning ? 'border-brand-blue bg-blue-50/20' : 'border-slate-200 dark:border-gray-700 bg-slate-50/50 hover:bg-white'}`}
                        >
                            {isScanning ? <Loader2Icon className="w-8 h-8 text-brand-blue animate-spin" /> : <UploadIcon className="w-8 h-8 text-brand-blue" />}
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isScanning ? "IA Analizando Documento..." : "Auto-completar con PDF/Foto del RUC"}</span>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                        </button>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Campos Comunes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField 
                                label="Nombre / Razón Social" 
                                name="nombre" 
                                value={newClienteData.nombre} 
                                onChange={e => setNewClienteData({...newClienteData, nombre: e.target.value.toUpperCase()})} 
                                required 
                                isHighlighted={highlightFields.includes('nombre')} 
                                placeholder={mode === 'EXPRESS' ? "Ej: Juan Pérez" : "Razón Social completa"}
                            />
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                                    Teléfono / Celular {mode === 'EXPRESS' && <span className="text-red-400">*</span>}
                                </label>
                                <div className={`flex flex-wrap gap-2 p-3 border rounded-xl bg-white dark:bg-slate-800 ${highlightFields.includes('telefono') ? 'border-brand-blue ring-1 ring-brand-blue/30' : 'border-gray-200 dark:border-gray-700'}`}>
                                    {telefonos.map((t, idx) => (
                                        <span key={idx} className="bg-blue-50 text-brand-blue px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                                            {t} <button type="button" onClick={() => setTelefonos(telefonos.filter((_, i) => i !== idx))}>&times;</button>
                                        </span>
                                    ))}
                                    <input 
                                        type="tel" 
                                        placeholder="Ingresar número..." 
                                        value={currentTelefono} 
                                        onChange={e => setCurrentTelefono(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTelefono(currentTelefono))}
                                        onBlur={() => currentTelefono && addTelefono(currentTelefono)}
                                        className="bg-transparent border-none outline-none text-sm font-bold w-full min-w-[120px]"
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

                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-gray-700 space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Datos Tributarios Avanzados</h3>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {[Regimen.GENERAL, Regimen.EMPRENDEDOR, Regimen.NEGOCIO_POPULAR].map((reg) => (
                                            <button
                                                key={reg}
                                                type="button"
                                                onClick={() => setNewClienteData(prev => ({ ...prev, regimen: reg }))}
                                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${newClienteData.regimen === reg ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-sm' : 'border-slate-200 bg-white text-slate-400'}`}
                                            >
                                                {reg}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <InputField label="Dirección Matriz" name="direccion" value={newClienteData.direccion} onChange={e => setNewClienteData({...newClienteData, direccion: e.target.value.toUpperCase()})} isHighlighted={highlightFields.includes('direccion')} />
                                        <InputField label="Estab. (001)" name="establecimientoPredeterminado" value={newClienteData.establecimientoPredeterminado} onChange={e => setNewClienteData({...newClienteData, establecimientoPredeterminado: e.target.value})} maxLength={3} />
                                        <InputField label="Pto. Emisión (001)" name="puntoEmisionPredeterminado" value={newClienteData.puntoEmisionPredeterminado} onChange={e => setNewClienteData({...newClienteData, puntoEmisionPredeterminado: e.target.value})} maxLength={3} />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Actividades Económicas</label>
                                        <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                            {actividades.map((a, i) => (
                                                <span key={i} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                                    {a} <button type="button" onClick={() => setActividades(actividades.filter((_, idx) => idx !== i))}>&times;</button>
                                                </span>
                                            ))}
                                            <input 
                                                type="text" 
                                                value={currentActividad} 
                                                onChange={e => setCurrentActividad(e.target.value)} 
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addActividad(currentActividad))}
                                                placeholder="Añadir actividad..."
                                                className="bg-transparent border-none outline-none text-xs flex-grow"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                <InputField 
                                    label="Cédula (Opcional)" 
                                    name="cedulaRuc" 
                                    value={newClienteData.cedulaRuc} 
                                    onChange={e => setNewClienteData({...newClienteData, cedulaRuc: e.target.value})} 
                                    maxLength={10} 
                                    placeholder="Solo si necesita factura simple"
                                />
                                <InputField 
                                    label="Nota Adicional" 
                                    name="direccion" 
                                    value={newClienteData.direccion} 
                                    onChange={e => setNewClienteData({...newClienteData, direccion: e.target.value})} 
                                    placeholder="Referencia, detalle..."
                                />
                            </div>
                        )}

                        <div className="flex justify-end pt-8 gap-4 border-t dark:border-gray-800">
                            <button type="button" onClick={onClose} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                            <button type="submit" disabled={isSaving || saveSuccess || !!rucError} className={`min-w-[240px] px-8 py-4 text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 uppercase text-xs ${saveSuccess ? 'bg-green-500' : mode === 'SRI' ? 'bg-brand-red hover:bg-red-800' : 'bg-brand-blue hover:bg-blue-800'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {isSaving ? <Loader2Icon className="animate-spin w-5 h-5"/> : saveSuccess ? <CheckCircleIcon className="w-5 h-5"/> : mode === 'SRI' ? "Guardar Contribuyente SRI" : "Crear Cliente Rápido"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

interface ClientSelectorProps { onSelectClient: (cliente: Cliente) => void; }

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelectClient }) => {
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
        <div className="animate-fade-in w-full max-w-3xl mx-auto space-y-4">
            <div className="flex gap-4 items-stretch">
                <div className="relative group flex-grow">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300 group-focus-within:text-brand-blue transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Buscar Cliente..." 
                        className="w-full pl-16 pr-8 h-full min-h-[4rem] border-none rounded-[1.5rem] bg-white dark:bg-gray-800 text-xl font-bold shadow-xl focus:ring-4 focus:ring-brand-blue/10 transition-all dark:text-white placeholder:text-slate-300" 
                    />
                </div>
                
                <div className="flex flex-col gap-2 flex-shrink-0">
                    <button 
                        onClick={() => handleOpenCreate('EXPRESS')} 
                        className="bg-brand-blue text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 transition-all hover:bg-blue-700"
                        title="Para volantes, tarjetas, gigantografías..."
                    >
                        <BoltIcon className="w-5 h-5" />
                        <div className="text-left leading-none">
                            <span className="block text-[8px] font-bold opacity-80 uppercase">Nuevo</span>
                            <span className="block text-xs font-black uppercase">Express</span>
                        </div>
                    </button>
                    
                    <button 
                        onClick={() => handleOpenCreate('SRI')} 
                        className="bg-brand-red text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 transition-all hover:bg-red-700"
                        title="Para Facturas y Notas de Venta autorizadas"
                    >
                        <ShieldCheckIcon className="w-5 h-5" />
                        <div className="text-left leading-none">
                            <span className="block text-[8px] font-bold opacity-80 uppercase">Nuevo</span>
                            <span className="block text-xs font-black uppercase">SRI / RUC</span>
                        </div>
                    </button>
                </div>
            </div>

            {searchTerm.length > 1 && (
                <div className="mt-4 bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700 animate-slide-in-up z-20 relative">
                    {filteredClients.map((c) => (
                        <div key={c.id} onClick={() => onSelectClient(c)} className="p-6 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 flex justify-between items-center transition-all group">
                            <div className="flex items-center gap-5">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-xl shadow-sm ${c.regimen === Regimen.NEGOCIO_POPULAR ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-brand-blue'}`}>
                                    {c.nombre.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase leading-none mb-1">{c.nombre}</p>
                                    <p className="text-xs text-slate-500 font-bold flex items-center gap-2 uppercase">
                                        <IdentificationIcon className="w-3 h-3"/> {c.cedula || c.ruc} 
                                        {c.ruc && <span className="bg-slate-100 px-1.5 rounded text-[8px] tracking-wider border border-slate-200">RUC</span>}
                                    </p>
                                </div>
                            </div>
                            <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-brand-blue transition-all group-hover:translate-x-1" />
                        </div>
                    ))}
                    {filteredClients.length === 0 && (
                        <div className="p-8 text-center text-slate-400">
                            <p className="text-sm font-bold">No encontrado.</p>
                            <button onClick={() => handleOpenCreate('EXPRESS')} className="mt-2 text-brand-blue hover:underline text-xs font-black uppercase tracking-widest">Crear como Nuevo Cliente</button>
                        </div>
                    )}
                </div>
            )}

            <CreateClientModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onClientCreated={(c) => { setIsCreateModalOpen(false); onSelectClient(c); }}
                initialName={!/^\d+$/.test(searchTerm) ? searchTerm : ''}
                initialCedulaRuc={/^\d+$/.test(searchTerm) ? searchTerm : ''}
                initialMode={createMode}
            />
        </div>
    );
};

export default ClientSelector;
