
import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Regimen } from '../../types';
import { createCliente } from '../../services/mockApi';
import { useData } from '../../contexts/DataContext';
import { extractClientFromImage } from '../../services/geminiService';
import { 
    SearchIcon, UserPlusIcon, ShieldCheckIcon, CloseIcon, Loader2Icon, 
    CheckCircleIcon, BuildingStorefrontIcon, SparklesIcon, 
    AddIcon, ArrowRightIcon, PhoneIcon, CameraIcon, UploadIcon,
    ExclamationTriangleIcon, DocumentTextIcon, ReceiptIcon,
    // Added InfoIcon to the imports to resolve the error on line 309
    InfoIcon
} from '../Icons';

const InputField: React.FC<{ 
    label: string; 
    name: string; 
    value: any; 
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; 
    isHighlighted?: boolean; 
    [key: string]: any; 
}> = ({ label, name, value, onChange, isHighlighted, ...props }) => (
    <div className="group">
        <label htmlFor={name} className={`block text-[10px] font-black uppercase tracking-widest mb-1 transition-colors ${isHighlighted ? 'text-brand-blue' : 'text-gray-400 group-focus-within:text-brand-blue'}`}>
            {label} {isHighlighted && "✨"}
        </label>
        {props.as === 'textarea' ? (
            <textarea 
                id={name} 
                name={name} 
                value={value} 
                onChange={onChange} 
                className={`w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all shadow-sm resize-none ${isHighlighted ? 'ring-4 ring-yellow-400 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30' : 'border-gray-200'}`} 
                {...props} 
            />
        ) : (
            <input 
                id={name} 
                name={name} 
                value={value} 
                onChange={onChange} 
                className={`w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all shadow-sm ${isHighlighted ? 'ring-4 ring-yellow-400 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30' : 'border-gray-200'}`} 
                {...props} 
            />
        )}
    </div>
);

export const CreateClientModal: React.FC<{
    isOpen: boolean; 
    onClose: () => void; 
    onClientCreated: (client: Cliente) => void; 
    initialName?: string; 
    initialCedulaRuc?: string;
}> = ({ isOpen, onClose, onClientCreated, initialName, initialCedulaRuc }) => {
    const [newClienteData, setNewClienteData] = useState({ 
        nombre: '', nombreComercial: '', cedulaRuc: '', email: '', 
        direccion: 'Pasaje, El Oro', actividades: '', regimen: Regimen.GENERAL 
    });
    const [telefonos, setTelefonos] = useState<string[]>([]);
    const [currentTelefono, setCurrentTelefono] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    // AI Scanner States
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scanPreview, setScanPreview] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<any>(null);
    const [highlightFields, setHighlightFields] = useState<string[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setNewClienteData({ 
                nombre: initialName || '', nombreComercial: '', cedulaRuc: initialCedulaRuc || '', 
                email: '', direccion: 'Pasaje, El Oro', actividades: '', regimen: Regimen.GENERAL 
            });
            setTelefonos([]);
            setSaveSuccess(false);
            setExtractedData(null);
            setScanPreview(null);
            setHighlightFields([]);
            setScanError(null);
        }
    }, [isOpen, initialName, initialCedulaRuc]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 8 * 1024 * 1024) {
            setScanError("El archivo es muy pesado (máx 8MB).");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            setScanPreview(base64);
            setIsScanning(true);
            setScanError(null);
            
            try {
                const data = await extractClientFromImage(base64);
                if (data && data.nombre) {
                    setExtractedData(data);
                } else {
                    setScanError("No se detectaron datos válidos. Intenta con una imagen más nítida.");
                }
            } catch (err) {
                setScanError("Error al procesar con IA.");
            } finally {
                setIsScanning(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const applyExtractedData = () => {
        if (!extractedData) return;

        const fields: string[] = [];
        if (extractedData.nombre) fields.push('nombre');
        if (extractedData.ruc) fields.push('cedulaRuc');
        if (extractedData.direccion) fields.push('direccion');
        if (extractedData.actividades) fields.push('actividades');
        if (extractedData.email) fields.push('email');
        
        setHighlightFields(fields);
        
        setNewClienteData(prev => ({
            ...prev,
            nombre: extractedData.nombre || prev.nombre,
            cedulaRuc: extractedData.ruc || prev.cedulaRuc,
            direccion: extractedData.direccion || prev.direccion,
            actividades: extractedData.actividades || prev.actividades,
            email: extractedData.email || prev.email,
            regimen: extractedData.regimen?.toLowerCase().includes('popular') ? Regimen.NEGOCIO_POPULAR :
                     extractedData.regimen?.toLowerCase().includes('emprendedor') ? Regimen.EMPRENDEDOR : Regimen.GENERAL
        }));

        if (extractedData.telefono) {
            const cleanTel = extractedData.telefono.replace(/\D/g, '');
            if (cleanTel.length >= 7 && !telefonos.includes(cleanTel)) {
                setTelefonos(prev => [...prev, cleanTel]);
            }
        }

        setExtractedData(null);
        setScanPreview(null);
        setTimeout(() => setHighlightFields([]), 3000);
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setNewClienteData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAddTel = () => {
        const val = currentTelefono.trim().replace(/\D/g, '');
        if (val.length >= 7 && !telefonos.includes(val)) {
            setTelefonos([...telefonos, val]);
            setCurrentTelefono('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const finalTelefonos = [...telefonos];
        if (currentTelefono.length >= 7) finalTelefonos.push(currentTelefono);

        const newCliente = await createCliente({ 
            ...newClienteData,
            cedula: newClienteData.cedulaRuc,
            ruc: newClienteData.cedulaRuc.length === 13 ? newClienteData.cedulaRuc : undefined,
            telefono: finalTelefonos.length > 0 ? finalTelefonos : ['0990000000'],
            creadoEn: new Date().toISOString()
        });
        
        setSaveSuccess(true);
        setTimeout(() => onClientCreated(newCliente), 800);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-3xl w-full max-w-2xl overflow-hidden border border-white/10 flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-black text-brand-blue dark:text-white flex items-center gap-3 tracking-tighter uppercase">
                            <UserPlusIcon className="h-6 w-6 text-brand-red" /> Nuevo Registro
                        </h2>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Sincronización Automática con Taller</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all"><CloseIcon className="w-5 h-5 text-gray-400" /></button>
                </div>
                
                <div className="flex-grow p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Panel de Escaneo IA */}
                    {!scanPreview ? (
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full flex items-center justify-center gap-4 py-8 rounded-[2rem] border-2 border-dashed transition-all group shadow-sm ${scanError ? 'border-red-400 bg-red-50 text-red-600' : 'border-brand-blue/20 bg-blue-50/30 text-brand-blue hover:bg-brand-blue hover:text-white'}`}
                        >
                            <UploadIcon className="w-8 h-8 group-hover:scale-125 transition-transform" />
                            <div className="text-left">
                                <span className="text-xs font-black uppercase tracking-[0.2em] block leading-none mb-1">
                                    {scanError ? "Error: " + scanError : "Cargar RUC (PDF/Foto)"}
                                </span>
                                <span className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Detecta el régimen automáticamente</span>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                        </button>
                    ) : (
                        <div className="bg-slate-900 rounded-[2rem] p-5 animate-slide-in-up border border-blue-500/30 relative">
                            {isScanning && (
                                <div className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-[2rem]">
                                    <div className="w-full h-1 bg-blue-400 absolute top-0 animate-scan shadow-[0_0_15px_rgba(96,165,250,1)]"></div>
                                    <Loader2Icon className="w-10 h-10 text-blue-400 animate-spin mb-3" />
                                    <p className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Consultando SRI...</p>
                                </div>
                            )}

                            {extractedData && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/50 p-5 rounded-2xl border border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Contribuyente</p>
                                            <p className="text-xs font-black text-white uppercase">{extractedData.nombre || '???'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Régimen SRI</p>
                                            <p className="text-xs font-bold text-yellow-400 uppercase">{extractedData.regimen || 'General'}</p>
                                        </div>
                                        <div className="col-span-full pt-3">
                                            <button 
                                                type="button" 
                                                onClick={applyExtractedData}
                                                className="w-full py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" /> Autocompletar con IA
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {!extractedData && !isScanning && (
                                <div className="h-32 flex items-center justify-center">
                                     <img src={scanPreview} className="max-h-full rounded-lg opacity-20 grayscale" />
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputField 
                                label="Razón Social" 
                                name="nombre" 
                                value={newClienteData.nombre} 
                                onChange={handleChange} 
                                required 
                                isHighlighted={highlightFields.includes('nombre')}
                            />
                            <InputField 
                                label="RUC / Cédula" 
                                name="cedulaRuc" 
                                value={newClienteData.cedulaRuc} 
                                onChange={handleChange} 
                                maxLength={13} 
                                required 
                                isHighlighted={highlightFields.includes('cedulaRuc')}
                            />
                        </div>

                        {/* SECTOR CRÍTICO: RÉGIMEN */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Régimen Fiscal del Cliente</label>
                                <ShieldCheckIcon className="w-4 h-4 text-brand-blue" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: Regimen.GENERAL, label: 'General', icon: DocumentTextIcon, color: 'blue' },
                                    { id: Regimen.EMPRENDEDOR, label: 'Emprendedor', icon: DocumentTextIcon, color: 'indigo' },
                                    { id: Regimen.NEGOCIO_POPULAR, label: 'Popular', icon: ReceiptIcon, color: 'orange' }
                                ].map((reg) => (
                                    <button
                                        key={reg.id}
                                        type="button"
                                        onClick={() => setNewClienteData(prev => ({ ...prev, regimen: reg.id }))}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${newClienteData.regimen === reg.id ? `bg-${reg.color}-50 dark:bg-${reg.color}-900/20 border-${reg.color}-500 shadow-md` : 'bg-white dark:bg-gray-700 border-transparent hover:border-slate-200'}`}
                                    >
                                        <reg.icon className={`w-5 h-5 ${newClienteData.regimen === reg.id ? `text-${reg.color}-600` : 'text-slate-300'}`} />
                                        <span className={`text-[10px] font-black uppercase ${newClienteData.regimen === reg.id ? `text-${reg.color}-700 dark:text-${reg.color}-300` : 'text-slate-500'}`}>{reg.label}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {/* Información de ayuda basada en el régimen */}
                            <div className={`p-3 rounded-xl text-[10px] font-bold border flex gap-3 items-center ${newClienteData.regimen === Regimen.NEGOCIO_POPULAR ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                <InfoIcon className="w-4 h-4 flex-shrink-0" />
                                <p>
                                    {newClienteData.regimen === Regimen.NEGOCIO_POPULAR 
                                        ? "ESTE CLIENTE SOLO EMITE NOTAS DE VENTA. No olvide configurar el talonario con 0% IVA."
                                        : "ESTE CLIENTE REQUIERE FACTURAS ELECTRÓNICAS O FÍSICAS CON DESGLOSE DE IVA."}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <InputField 
                                label="Dirección Impresa" 
                                name="direccion" 
                                value={newClienteData.direccion} 
                                onChange={handleChange} 
                                isHighlighted={highlightFields.includes('direccion')}
                            />
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Teléfono Principal</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="tel" 
                                        value={currentTelefono} 
                                        onChange={e => setCurrentTelefono(e.target.value.replace(/\D/g, ''))} 
                                        placeholder="099..." 
                                        className="flex-grow p-3 border border-gray-200 rounded-xl dark:bg-gray-700 focus:ring-2 focus:ring-brand-red outline-none text-xs" 
                                        maxLength={10} 
                                    />
                                    <button type="button" onClick={handleAddTel} className="bg-slate-100 dark:bg-gray-800 p-3 rounded-xl hover:bg-brand-blue hover:text-white transition-all">
                                        <AddIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {telefonos.map((t, i) => (
                                        <span key={i} className="bg-blue-50 dark:bg-blue-900/30 text-brand-blue text-[9px] font-black px-2 py-1 rounded-full border border-blue-100/50 flex items-center gap-1">
                                            <PhoneIcon className="w-3 h-3"/> {t} 
                                            <button type="button" onClick={() => setTelefonos(telefonos.filter((_, idx) => idx !== i))} className="hover:text-red-500 font-black ml-1">&times;</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 gap-3 border-t dark:border-gray-800">
                            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cerrar</button>
                            <button 
                                type="submit" 
                                disabled={isSaving || saveSuccess} 
                                className={`px-10 py-4 text-white font-black rounded-xl shadow-xl transition-all transform active:scale-95 flex items-center gap-2 uppercase tracking-[0.2em] text-[10px] ${saveSuccess ? 'bg-green-500' : 'bg-brand-red hover:bg-slate-950'}`}
                            >
                                {isSaving ? <Loader2Icon className="animate-spin w-4 h-4"/> : saveSuccess ? <CheckCircleIcon className="w-4 h-4"/> : "Guardar Cliente"}
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
    
    const filteredClients = searchTerm.length > 1 
        ? clientes.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || c.cedula.includes(searchTerm) || (c.ruc && c.ruc.includes(searchTerm))).slice(0, 5)
        : [];

    return (
        <div className="animate-fade-in w-full max-w-2xl mx-auto space-y-4">
            <div className="flex gap-3">
                <div className="relative group flex-grow">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300 group-focus-within:text-brand-red transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Buscar por nombre o RUC..." 
                        className="w-full pl-16 pr-8 py-6 border-none rounded-[2.5rem] bg-white dark:bg-gray-800 text-xl font-bold shadow-2xl shadow-slate-200/50 dark:shadow-none focus:ring-4 focus:ring-brand-blue/10 transition-all dark:text-white placeholder:text-slate-300" 
                    />
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    title="Nuevo Cliente"
                    className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-auto bg-brand-red text-white rounded-[2rem] shadow-xl shadow-red-900/20 flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all transform active:scale-95 group"
                >
                    <UserPlusIcon className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                    <span className="hidden sm:block text-[9px] font-black uppercase tracking-widest">Nuevo</span>
                </button>
            </div>

            {searchTerm.length > 1 && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-3xl overflow-hidden border border-slate-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700 animate-slide-in-up">
                    {filteredClients.length > 0 ? (
                        filteredClients.map((c) => (
                            <div 
                                key={c.id} 
                                onClick={() => onSelectClient(c)}
                                className="p-8 cursor-pointer hover:bg-slate-50 dark:hover:bg-blue-400/5 flex justify-between items-center transition-all group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-2xl bg-brand-blue text-white flex items-center justify-center font-black text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all shadow-xl">
                                        {c.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white text-xl tracking-tighter uppercase leading-tight">{c.nombreComercial || c.nombre}</p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <p className="text-sm text-gray-500 font-bold flex items-center gap-2">
                                                <ShieldCheckIcon className="w-4 h-4 text-green-500"/> {c.cedula}
                                            </p>
                                            <span className="text-gray-300">|</span> 
                                            <span className="text-brand-blue dark:text-blue-400 uppercase text-[10px] font-black tracking-widest">{c.regimen}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-brand-red group-hover:border-brand-red transition-all">
                                    <ArrowRightIcon className="w-5 h-5 text-gray-300 group-hover:text-white transition-all" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-16 text-center">
                            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <SearchIcon className="w-10 h-10 text-slate-300"/>
                            </div>
                            <p className="text-slate-400 font-black mb-8 uppercase tracking-[0.2em] text-sm">Cliente no registrado en el taller</p>
                            <button 
                                onClick={() => setIsCreateModalOpen(true)} 
                                className="inline-flex items-center gap-4 px-12 py-5 bg-brand-red text-white font-black rounded-2xl shadow-3xl shadow-red-900/20 hover:scale-105 transition-all transform active:scale-95 uppercase tracking-widest text-xs"
                            >
                                <UserPlusIcon className="h-5 w-5 text-white"/> REGISTRAR NUEVO CLIENTE
                            </button>
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
            />
        </div>
    );
};

export default ClientSelector;
