
import React, { useState, useEffect, useRef } from 'react';
import { Cliente, Regimen } from '../../types';
import { createCliente } from '../../services/mockApi';
import { useData } from '../../contexts/DataContext';
import { SearchIcon, UserPlusIcon, ShieldCheckIcon, CloseIcon, Loader2Icon, ExclamationTriangleIcon, CheckCircleIcon } from '../Icons';

// Custom hook local para debounce
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// --- SUB-COMPONENT: InputField Reutilizable ---
const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div className="group">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors group-focus-within:text-brand-blue">{label}</label>
        <input id={name} name={name} value={value} onChange={onChange} className="w-full p-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm" {...props} />
    </div>
);

// --- SUB-COMPONENT: Modal de Creación ---
const CreateClientModal: React.FC<{
    isOpen: boolean; onClose: () => void; onClientCreated: (client: Cliente) => void; initialName?: string; initialCedulaRuc?: string;
}> = ({ isOpen, onClose, onClientCreated, initialName, initialCedulaRuc }) => {
    
    const [newClienteData, setNewClienteData] = useState({ 
        nombre: '', nombreComercial: '', cedulaRuc: '', email: '', 
        direccion: 'Pasaje, El Oro', notas: '', regimen: Regimen.GENERAL 
    });
    const [telefonos, setTelefonos] = useState<string[]>([]);
    const [currentTelefono, setCurrentTelefono] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNewClienteData({ 
                nombre: initialName || '', nombreComercial: '', cedulaRuc: initialCedulaRuc || '', 
                email: '', direccion: 'Pasaje, El Oro', notas: '', regimen: Regimen.GENERAL 
            });
            setTelefonos([]);
            setCurrentTelefono('');
            setSaveSuccess(false);
        }
    }, [isOpen, initialName, initialCedulaRuc]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setNewClienteData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleTelefonoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = currentTelefono.trim().replace(/\D/g, '');
            if (val.length === 10) {
                if (!telefonos.includes(val)) setTelefonos(prev => [...prev, val]);
                setCurrentTelefono('');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Add current typing phone if valid
        const finalTelefonos = [...telefonos];
        const val = currentTelefono.trim().replace(/\D/g, '');
        if (val.length === 10 && !finalTelefonos.includes(val)) finalTelefonos.push(val);

        if (!newClienteData.nombre || !newClienteData.cedulaRuc || finalTelefonos.length === 0) {
            setIsSaving(false); return; // Add validation UI later
        }

        const newCliente = await createCliente({ 
            nombre: newClienteData.nombre, 
            cedula: newClienteData.cedulaRuc, 
            ruc: newClienteData.cedulaRuc.length === 13 ? newClienteData.cedulaRuc : undefined, 
            telefono: finalTelefonos,
            email: newClienteData.email || undefined, 
            regimen: newClienteData.regimen,
            nombreComercial: newClienteData.nombreComercial || undefined,
            direccion: newClienteData.direccion || undefined,
            notas: newClienteData.notas || undefined
        });
        
        setSaveSuccess(true);
        setTimeout(() => onClientCreated(newCliente), 1000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 relative">
                <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <UserPlusIcon className="h-5 w-5 text-brand-blue" /> Crear Nuevo Cliente
                    </h2>
                    <button onClick={onClose}><CloseIcon className="w-5 h-5 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nombres" name="nombre" value={newClienteData.nombre} onChange={handleChange} required autoFocus />
                        <InputField label="Nombre Comercial" name="nombreComercial" value={newClienteData.nombreComercial} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Cédula / RUC</label>
                        <div className="relative group">
                            <input type="text" pattern="[0-9]*" maxLength={13} name="cedulaRuc" value={newClienteData.cedulaRuc} onChange={handleChange} required className="w-full p-2.5 pl-3 pr-10 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm" />
                            <ShieldCheckIcon className="absolute right-3 top-2.5 text-gray-400 group-focus-within:text-brand-blue h-5 w-5" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300">Teléfono(s)</label>
                        <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            {telefonos.map((t, i) => (
                                <span key={i} className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">{t} <button type="button" onClick={() => setTelefonos(prev => prev.filter((_, idx) => idx !== i))}>&times;</button></span>
                            ))}
                            <input type="tel" value={currentTelefono} onChange={e => setCurrentTelefono(e.target.value)} onKeyDown={handleTelefonoKeyDown} placeholder="099..." className="bg-transparent outline-none flex-grow min-w-[100px]" maxLength={10} />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-3 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={isSaving || saveSuccess} className={`px-6 py-2 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 ${saveSuccess ? 'bg-green-500' : 'bg-brand-blue hover:bg-blue-800'}`}>
                            {isSaving ? <Loader2Icon className="animate-spin w-5 h-5"/> : saveSuccess ? <CheckCircleIcon className="w-5 h-5"/> : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
interface ClientSelectorProps {
    onSelectClient: (cliente: Cliente) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onSelectClient }) => {
    const { clientes } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedTerm = useDebounce(searchTerm, 300);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const filteredClients = clientes.filter(c => {
        const lower = debouncedTerm.toLowerCase();
        return c.nombre.toLowerCase().includes(lower) || c.cedula.includes(lower) || (c.ruc && c.ruc.includes(lower));
    }).slice(0, 5); // Limit results

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') setActiveIndex(prev => (prev < filteredClients.length - 1 ? prev + 1 : prev));
        if (e.key === 'ArrowUp') setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        if (e.key === 'Enter') {
            if (activeIndex >= 0 && filteredClients[activeIndex]) onSelectClient(filteredClients[activeIndex]);
            else if (debouncedTerm && filteredClients.length === 0) setIsCreateModalOpen(true);
        }
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-4 text-center">Paso 1: Seleccionar Cliente</h2>
            <div className="relative max-w-2xl mx-auto">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    placeholder="Buscar por cédula, RUC o nombre..." 
                    className="w-full pl-12 p-4 border rounded-2xl dark:bg-gray-800 dark:border-gray-700 text-lg shadow-sm focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all" 
                    autoFocus
                />
            </div>

            {debouncedTerm && (
                <div className="mt-4 max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    {filteredClients.length > 0 ? (
                        filteredClients.map((c, idx) => (
                            <div 
                                key={c.id} 
                                onClick={() => onSelectClient(c)}
                                onMouseEnter={() => setActiveIndex(idx)}
                                className={`p-4 cursor-pointer flex justify-between items-center transition-colors ${activeIndex === idx ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold">
                                        {c.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{c.nombre}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3"/> {c.cedula}</p>
                                    </div>
                                </div>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">{c.regimen}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center">
                            <p className="text-gray-500 mb-4">No se encontraron resultados para "{searchTerm}"</p>
                            <button onClick={() => setIsCreateModalOpen(true)} className="inline-flex items-center gap-2 px-6 py-2 bg-brand-blue text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:-translate-y-1">
                                <UserPlusIcon className="h-5 w-5"/> Crear Nuevo Cliente
                            </button>
                        </div>
                    )}
                </div>
            )}

            <CreateClientModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onClientCreated={(c) => { setIsCreateModalOpen(false); onSelectClient(c); }}
                initialName={!/^\d+$/.test(debouncedTerm) ? debouncedTerm : ''}
                initialCedulaRuc={/^\d+$/.test(debouncedTerm) ? debouncedTerm : ''}
            />
        </div>
    );
};

export default ClientSelector;
