
import React, { useState, useEffect, useCallback } from 'react';
import { Cliente, Regimen } from '../../types';
import { createCliente } from '../../services/mockApi';
import { useData } from '../../contexts/DataContext';
import { SearchIcon, UserPlusIcon, ShieldCheckIcon, CloseIcon, Loader2Icon, CheckCircleIcon, StarIcon, DollarIcon, PhoneIcon, MapPinIcon, UploadIcon, FileTextIcon } from '../Icons';
import { formatCurrency } from '../../utils';
import { parseSriPdf, ParsedSriData } from '../../utils/sriParser';
import { useToast } from '../../contexts/ToastContext';

// Helper para Inputs
const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div className="group">
        <label htmlFor={name} className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 transition-colors group-focus-within:text-brand-blue">{label}</label>
        <input id={name} name={name} value={value} onChange={onChange} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm font-medium" {...props} />
    </div>
);

// Modal Interno de Creación
const CreateClientModal: React.FC<{
    isOpen: boolean; onClose: () => void; onClientCreated: (client: Cliente) => void; initialName?: string; initialCedulaRuc?: string;
}> = ({ isOpen, onClose, onClientCreated, initialName, initialCedulaRuc }) => {
    const { addToast } = useToast();
    
    const [newClienteData, setNewClienteData] = useState({ 
        nombre: '', nombreComercial: '', cedulaRuc: '', email: '', 
        direccion: 'Pasaje, El Oro', notas: '', regimen: Regimen.GENERAL 
    });
    const [telefonos, setTelefonos] = useState<string[]>([]);
    const [currentTelefono, setCurrentTelefono] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNewClienteData({ 
                nombre: initialName || '', nombreComercial: '', cedulaRuc: initialCedulaRuc || '', 
                email: '', direccion: 'Pasaje, El Oro', notas: '', regimen: Regimen.GENERAL 
            });
            setTelefonos([]);
            setCurrentTelefono('');
            setSaveSuccess(false);
            setIsParsing(false);
        }
    }, [isOpen, initialName, initialCedulaRuc]);

    if (!isOpen) return null;

    // --- Drag & Drop Handlers ---
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                await processPdfFile(file);
            } else {
                addToast("Por favor sube solo archivos PDF del RUC.", "warning");
            }
        }
    }, []);

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processPdfFile(e.target.files[0]);
        }
    };

    const processPdfFile = async (file: File) => {
        setIsParsing(true);
        try {
            const data: ParsedSriData = await parseSriPdf(file);
            
            setNewClienteData(prev => ({
                ...prev,
                nombre: data.razonSocial.toUpperCase(),
                nombreComercial: data.nombreComercial?.toUpperCase() || '',
                cedulaRuc: data.ruc,
                email: data.email || prev.email,
                direccion: data.direccion.toUpperCase() || prev.direccion,
                regimen: data.regimen,
                notas: data.actividades.length > 0 
                    ? `ACTIVIDADES: ${data.actividades.join(' | ').substring(0, 200)}...`
                    : ''
            }));

            if (data.telefono) {
                if (!telefonos.includes(data.telefono)) {
                    setTelefonos(prev => [...prev, data.telefono!]);
                }
            }

            addToast("Datos extraídos del PDF correctamente", "success");
        } catch (error) {
            console.error("Error parsing PDF:", error);
            addToast("No se pudo leer el PDF. Asegúrate que sea un RUC digital válido.", "error");
        } finally {
            setIsParsing(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setNewClienteData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleTelefonoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = currentTelefono.trim().replace(/\D/g, '');
            if (val.length >= 7) {
                if (!telefonos.includes(val)) setTelefonos(prev => [...prev, val]);
                setCurrentTelefono('');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const finalTelefonos = [...telefonos];
        const val = currentTelefono.trim().replace(/\D/g, '');
        if (val.length >= 7 && !finalTelefonos.includes(val)) finalTelefonos.push(val);

        if (!newClienteData.nombre || !newClienteData.cedulaRuc) {
            setIsSaving(false); return;
        }

        const newCliente = await createCliente({ 
            nombre: newClienteData.nombre.toUpperCase(), 
            cedula: newClienteData.cedulaRuc, 
            ruc: newClienteData.cedulaRuc.length === 13 ? newClienteData.cedulaRuc : undefined, 
            telefono: finalTelefonos.length > 0 ? finalTelefonos : ['9999999999'],
            email: newClienteData.email || undefined, 
            regimen: newClienteData.regimen,
            nombreComercial: newClienteData.nombreComercial?.toUpperCase() || undefined,
            direccion: newClienteData.direccion?.toUpperCase() || undefined,
            notas: newClienteData.notas || undefined
        });
        
        setSaveSuccess(true);
        setTimeout(() => onClientCreated(newCliente), 800);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg transform transition-all scale-100 relative overflow-hidden flex flex-col max-h-[90vh]"
                onDragEnter={handleDrag} 
                onDragLeave={handleDrag} 
                onDragOver={handleDrag} 
                onDrop={handleDrop}
            >
                {/* Drag Overlay */}
                {dragActive && (
                    <div className="absolute inset-0 z-50 bg-brand-blue/90 flex flex-col items-center justify-center text-white animate-fade-in pointer-events-none">
                        <FileTextIcon className="w-20 h-20 mb-4 animate-bounce" />
                        <h3 className="text-2xl font-bold">Suelta el PDF del RUC aquí</h3>
                        <p className="opacity-80">Extracción automática de datos</p>
                    </div>
                )}

                <div className="bg-gradient-to-r from-brand-blue to-blue-700 p-6 flex justify-between items-center text-white shrink-0">
                    <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                        <UserPlusIcon className="h-6 w-6 text-blue-300" /> Nuevo Cliente
                    </h2>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"><CloseIcon className="w-5 h-5 text-white" /></button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* PDF Upload Area */}
                    <div className="mb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/30 text-center relative group transition-colors hover:border-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/10">
                        <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={handleFileInput} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center gap-2">
                            {isParsing ? (
                                <Loader2Icon className="w-8 h-8 text-brand-blue animate-spin" />
                            ) : (
                                <UploadIcon className="w-8 h-8 text-gray-400 group-hover:text-brand-blue transition-colors" />
                            )}
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                {isParsing ? 'Extrayendo datos...' : 'Arrastra el PDF del RUC aquí'}
                            </p>
                            <p className="text-xs text-gray-400">o haz clic para subir manualmente</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Nombre / Razón Social" name="nombre" value={newClienteData.nombre} onChange={handleChange} required autoFocus placeholder="Ej: JUAN PEREZ" />
                            <InputField label="Nombre Comercial" name="nombreComercial" value={newClienteData.nombreComercial} onChange={handleChange} placeholder="Ej: RESTAURANTE EL SABOR" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Identificación</label>
                            <div className="relative group">
                                <input type="text" pattern="[0-9]*" maxLength={13} name="cedulaRuc" value={newClienteData.cedulaRuc} onChange={handleChange} required className="w-full p-3 pl-4 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm font-mono text-lg font-bold tracking-wide" placeholder="070..." />
                                <ShieldCheckIcon className="absolute right-4 top-3.5 text-gray-400 group-focus-within:text-brand-blue h-5 w-5 transition-colors" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Contacto</label>
                            <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-blue transition-all">
                                {telefonos.map((t, i) => (
                                    <span key={i} className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-blue-200">{t} <button type="button" onClick={() => setTelefonos(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500">&times;</button></span>
                                ))}
                                <input type="tel" value={currentTelefono} onChange={e => setCurrentTelefono(e.target.value)} onKeyDown={handleTelefonoKeyDown} placeholder="Ingresar celular..." className="bg-transparent outline-none flex-grow min-w-[120px] text-sm py-1 px-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                             <InputField label="Dirección" name="direccion" value={newClienteData.direccion} onChange={handleChange} />
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Régimen</label>
                                <select className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue outline-none" name="regimen" value={newClienteData.regimen} onChange={handleChange as any}>
                                    <option value={Regimen.GENERAL}>General</option>
                                    <option value={Regimen.NEGOCIO_POPULAR}>Rimpe Negocio Popular</option>
                                    <option value={Regimen.EMPRENDEDOR}>Rimpe Emprendedor</option>
                                </select>
                             </div>
                        </div>
                        
                        <InputField label="Notas / Actividades" name="notas" value={newClienteData.notas} onChange={handleChange} as="textarea" rows={3} />

                        <div className="flex justify-end pt-2 gap-3 border-t border-gray-100 dark:border-gray-700 mt-4">
                            <button type="button" onClick={onClose} className="px-5 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
                            <button type="submit" disabled={isSaving || saveSuccess} className={`px-8 py-3 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center gap-2 ${saveSuccess ? 'bg-green-500 hover:bg-green-600' : 'bg-brand-blue hover:bg-blue-800'}`}>
                                {isSaving ? <Loader2Icon className="animate-spin w-5 h-5"/> : saveSuccess ? <CheckCircleIcon className="w-5 h-5"/> : "Guardar Cliente"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

interface ClientSelectorProps {
    onSelectClient: (cliente: Cliente) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelectClient }) => {
    const { clientes, trabajos } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Helper to calculate LTV dynamically
    const getClientLtv = (clientId: string) => {
        return trabajos
            .filter(t => t.clienteId === clientId)
            .reduce((sum, t) => sum + t.total, 0);
    };

    // Filter
    const filteredClients = searchTerm.length > 1 
        ? clientes.filter(c => 
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.cedula.includes(searchTerm) || 
            (c.ruc && c.ruc.includes(searchTerm))
          ).slice(0, 5)
        : [];

    return (
        <div className="animate-fade-in w-full max-w-2xl mx-auto">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <SearchIcon className="h-6 w-6 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
                </div>
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Buscar cliente por nombre o RUC..." 
                    className="w-full pl-14 p-5 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-xl font-medium shadow-sm focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-all placeholder-gray-300" 
                    autoFocus
                />
                {searchTerm.length > 1 && filteredClients.length === 0 && (
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="absolute right-3 top-3 bottom-3 px-6 bg-brand-blue text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-transform active:scale-95 flex items-center gap-2 animate-fade-in"
                    >
                        <UserPlusIcon className="w-5 h-5"/> Crear
                    </button>
                )}
            </div>

            {searchTerm.length > 1 && filteredClients.length > 0 && (
                <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700 animate-slide-in-up">
                    {filteredClients.map((c) => {
                        const ltv = getClientLtv(c.id);
                        const isVip = ltv > 500;

                        return (
                            <div 
                                key={c.id} 
                                onClick={() => onSelectClient(c)}
                                className="p-5 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700/50 flex justify-between items-center transition-all group relative overflow-hidden"
                            >
                                {isVip && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-yellow-300 to-yellow-500"></div>}
                                
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-md group-hover:scale-110 transition-transform
                                        ${isVip ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300'}
                                    `}>
                                        {c.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight group-hover:text-brand-blue transition-colors">{c.nombre}</p>
                                            {isVip && <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded"><ShieldCheckIcon className="w-3 h-3"/> {c.cedula}</span>
                                            {c.direccion && <span className="flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> {c.direccion}</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <span className={`inline-block text-[10px] font-black px-2 py-1 rounded border uppercase tracking-wider mb-1 ${c.regimen === Regimen.NEGOCIO_POPULAR ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-brand-blue border-blue-100'}`}>
                                        {c.regimen}
                                    </span>
                                    {ltv > 0 && (
                                        <p className="text-xs font-bold text-green-600 flex items-center justify-end gap-1">
                                            <DollarIcon className="w-3 h-3"/> {formatCurrency(ltv)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
