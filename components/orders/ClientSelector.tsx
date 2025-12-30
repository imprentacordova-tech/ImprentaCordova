
import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Regimen } from '../../types';
import { createCliente, getMasterActividades } from '../../services/mockApi';
import { useData } from '../../contexts/DataContext';
import { extractClientFromImage } from '../../services/geminiService';
import { 
    SearchIcon, UserPlusIcon, ShieldCheckIcon, CloseIcon, Loader2Icon, 
    CheckCircleIcon, SparklesIcon, AddIcon, ArrowRightIcon, PhoneIcon, 
    UploadIcon, DocumentTextIcon, LayersIcon
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
        <input 
            id={name} 
            name={name} 
            value={value} 
            onChange={onChange} 
            className={`w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm ${isHighlighted ? 'ring-2 ring-brand-blue/30 border-brand-blue bg-blue-50/50 dark:bg-brand-blue/10' : 'border-gray-200 dark:border-gray-700'}`} 
            {...props} 
        />
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
        direccion: 'Pasaje, El Oro', regimen: Regimen.GENERAL 
    });
    const [actividades, setActividades] = useState<string[]>([]);
    const [currentActividad, setCurrentActividad] = useState('');
    const [masterActividades, setMasterActividades] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    const [isScanning, setIsScanning] = useState(false);
    const [highlightFields, setHighlightFields] = useState<string[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setNewClienteData({ 
                nombre: initialName || '', nombreComercial: '', cedulaRuc: initialCedulaRuc || '', 
                email: '', direccion: 'Pasaje, El Oro', regimen: Regimen.GENERAL 
            });
            setActividades([]);
            setSaveSuccess(false);
            getMasterActividades().then(setMasterActividades);
        }
    }, [isOpen, initialName, initialCedulaRuc]);

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
            }
            setIsScanning(false);
        };
        reader.readAsDataURL(file);
    };

    const applyExtractedData = (data: any) => {
        const fields = ['nombre', 'cedulaRuc', 'direccion'];
        setHighlightFields(fields);
        setNewClienteData(prev => ({
            ...prev,
            nombre: data.nombre || prev.nombre,
            cedulaRuc: data.ruc || prev.cedulaRuc,
            direccion: data.direccion || prev.direccion,
            regimen: data.regimen?.toLowerCase().includes('popular') ? Regimen.NEGOCIO_POPULAR : Regimen.GENERAL
        }));

        if (data.actividades) {
            // Limpieza inteligente de actividades separadas por comas, puntos o saltos
            const cleaned = data.actividades.split(/[,\n•.;]/)
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const newCliente = await createCliente({ 
            ...newClienteData,
            actividades: actividades.join('|'),
            cedula: newClienteData.cedulaRuc,
            ruc: newClienteData.cedulaRuc.length === 13 ? newClienteData.cedulaRuc : undefined,
            telefono: ['0990000000'] // Por defecto si no se escanea
        });
        setSaveSuccess(true);
        setTimeout(() => onClientCreated(newCliente), 800);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[70] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-3xl w-full max-w-4xl overflow-hidden border border-white/10 flex flex-col max-h-[95vh]">
                
                <div className="flex justify-between items-center p-6 border-b dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50">
                    <div>
                        <h2 className="text-xl font-black text-brand-blue dark:text-white uppercase tracking-tighter">REGISTRO DE CONTRIBUYENTE</h2>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Imprenta Córdova - Extractor Inteligente</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full"><CloseIcon className="w-5 h-5 text-gray-400" /></button>
                </div>
                
                <div className="flex-grow p-8 space-y-8 overflow-y-auto custom-scrollbar">
                    
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isScanning}
                        className={`w-full flex flex-col items-center justify-center gap-3 py-8 rounded-[2rem] border-2 border-dashed transition-all ${isScanning ? 'border-brand-blue bg-blue-50/20' : 'border-slate-200 dark:border-gray-700 bg-slate-50/50 hover:bg-white'}`}
                    >
                        {isScanning ? <Loader2Icon className="w-10 h-10 text-brand-blue animate-spin" /> : <UploadIcon className="w-10 h-10 text-brand-blue" />}
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{isScanning ? "IA Analizando Documento..." : "Escanear Certificado RUC"}</span>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                    </button>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Razón Social" name="nombre" value={newClienteData.nombre} onChange={e => setNewClienteData({...newClienteData, nombre: e.target.value.toUpperCase()})} required isHighlighted={highlightFields.includes('nombre')} />
                            <InputField label="RUC / Cédula" name="cedulaRuc" value={newClienteData.cedulaRuc} onChange={e => setNewClienteData({...newClienteData, cedulaRuc: e.target.value})} maxLength={13} required isHighlighted={highlightFields.includes('cedulaRuc')} />
                        </div>

                        {/* RÉGIMEN */}
                        <div className="flex gap-3">
                            {[Regimen.GENERAL, Regimen.EMPRENDEDOR, Regimen.NEGOCIO_POPULAR].map((reg) => (
                                <button
                                    key={reg}
                                    type="button"
                                    onClick={() => setNewClienteData(prev => ({ ...prev, regimen: reg }))}
                                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${newClienteData.regimen === reg ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-md' : 'border-transparent bg-slate-50 text-slate-400'}`}
                                >
                                    {reg}
                                </button>
                            ))}
                        </div>

                        {/* ACTIVIDADES COMO ETIQUETAS (COLECCIÓN) */}
                        <div className="bg-slate-900 rounded-[2rem] p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-brand-red uppercase tracking-[0.3em] flex items-center gap-2">
                                    <LayersIcon className="w-4 h-4"/> Actividades Económicas Detectadas
                                </h3>
                                <span className="text-[8px] font-bold text-white/40 uppercase">Presione Enter para añadir manualmente</span>
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-white/5 rounded-2xl border border-white/10">
                                {actividades.map((a, i) => (
                                    <span key={i} className="bg-brand-blue text-white text-[9px] font-black px-3 py-2 rounded-lg flex items-center gap-2 animate-fade-in group">
                                        {a}
                                        <button type="button" onClick={() => setActividades(actividades.filter((_, idx) => idx !== i))} className="hover:text-brand-red font-bold text-lg leading-none">&times;</button>
                                    </span>
                                ))}
                                <input 
                                    type="text" 
                                    value={currentActividad} 
                                    onChange={e => setCurrentActividad(e.target.value)} 
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addActividad(currentActividad))}
                                    placeholder="Escribe actividad..."
                                    className="bg-transparent border-none outline-none text-white text-[11px] font-bold flex-grow min-w-[150px]"
                                />
                            </div>

                            {/* Sugerencias de la base maestra */}
                            <div className="space-y-3">
                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Colección Global (Sugerencias):</p>
                                <div className="flex flex-wrap gap-2">
                                    {masterActividades.filter(ma => !actividades.includes(ma)).slice(0, 10).map(ma => (
                                        <button 
                                            key={ma} 
                                            type="button" 
                                            onClick={() => addActividad(ma)}
                                            className="px-3 py-1.5 rounded-full border border-white/10 text-[8px] font-black text-white/60 hover:bg-white/10 hover:text-white transition-all uppercase"
                                        >
                                            + {ma}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <InputField label="Dirección Tributaria" name="direccion" value={newClienteData.direccion} onChange={e => setNewClienteData({...newClienteData, direccion: e.target.value.toUpperCase()})} isHighlighted={highlightFields.includes('direccion')} />

                        <div className="flex justify-end pt-8 gap-4 border-t dark:border-gray-800">
                            <button type="button" onClick={onClose} className="px-8 py-4 text-slate-400 font-bold uppercase text-[10px]">Cancelar</button>
                            <button type="submit" disabled={isSaving || saveSuccess} className={`min-w-[200px] px-12 py-4 text-white font-black rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 uppercase text-xs ${saveSuccess ? 'bg-green-500' : 'bg-brand-red hover:bg-slate-950'}`}>
                                {isSaving ? <Loader2Icon className="animate-spin w-5 h-5"/> : saveSuccess ? <CheckCircleIcon className="w-5 h-5"/> : "Confirmar Datos"}
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
                        className="w-full pl-16 pr-8 py-6 border-none rounded-[2.5rem] bg-white dark:bg-gray-800 text-xl font-bold shadow-2xl focus:ring-4 focus:ring-brand-blue/10 transition-all dark:text-white placeholder:text-slate-300" 
                    />
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex-shrink-0 w-24 h-24 bg-brand-red text-white rounded-[2rem] shadow-xl flex flex-col items-center justify-center gap-1 hover:scale-105 transition-all">
                    <UserPlusIcon className="w-8 h-8" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Nuevo</span>
                </button>
            </div>

            {searchTerm.length > 1 && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-3xl overflow-hidden border border-slate-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700 animate-slide-in-up">
                    {filteredClients.map((c) => (
                        <div key={c.id} onClick={() => onSelectClient(c)} className="p-8 cursor-pointer hover:bg-slate-50 flex justify-between items-center transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-brand-blue text-white flex items-center justify-center font-black text-2xl group-hover:scale-110 transition-all shadow-xl">
                                    {c.nombre.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 dark:text-white text-xl tracking-tighter uppercase leading-tight">{c.nombre}</p>
                                    <p className="text-sm text-gray-500 font-bold flex items-center gap-2">
                                        <ShieldCheckIcon className="w-4 h-4 text-green-500"/> {c.cedula} | <span className="text-brand-blue uppercase text-[10px] font-black tracking-widest">{c.regimen}</span>
                                    </p>
                                </div>
                            </div>
                            <ArrowRightIcon className="w-6 h-6 text-gray-300 group-hover:text-brand-red transition-all" />
                        </div>
                    ))}
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
