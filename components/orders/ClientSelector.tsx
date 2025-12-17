
import React, { useState, useEffect } from 'react';
import { Cliente, Regimen } from '../../types';
import { createCliente } from '../../services/mockApi';
import { useData } from '../../contexts/DataContext';
import { SearchIcon, UserPlusIcon, ShieldCheckIcon, CloseIcon, Loader2Icon, CheckCircleIcon, StarIcon, DollarIcon } from '../Icons';
import { formatCurrency } from '../../utils';

// Helper para Inputs
const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div className="group">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors group-focus-within:text-brand-blue">{label}</label>
        <input id={name} name={name} value={value} onChange={onChange} className="w-full p-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm" {...props} />
    </div>
);

// Modal Interno de Creación
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
            nombre: newClienteData.nombre, 
            cedula: newClienteData.cedulaRuc, 
            ruc: newClienteData.cedulaRuc.length === 13 ? newClienteData.cedulaRuc : undefined, 
            telefono: finalTelefonos.length > 0 ? finalTelefonos : ['9999999999'],
            email: newClienteData.email || undefined, 
            regimen: newClienteData.regimen,
            nombreComercial: newClienteData.nombreComercial || undefined,
            direccion: newClienteData.direccion || undefined,
            notas: newClienteData.notas || undefined
        });
        
        setSaveSuccess(true);
        setTimeout(() => onClientCreated(newCliente), 800);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4 animate-fade-in" onClick={e => e.stopPropagation()}>
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
                            <input type="tel" value={currentTelefono} onChange={e => setCurrentTelefono(e.target.value)} onKeyDown={handleTelefonoKeyDown} placeholder="Escribir y Enter..." className="bg-transparent outline-none flex-grow min-w-[100px] text-sm" />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 gap-3 border-t dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
                        <button type="submit" disabled={isSaving || saveSuccess} className={`px-6 py-2 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 ${saveSuccess ? 'bg-green-500' : 'bg-brand-blue hover:bg-blue-800'}`}>
                            {isSaving ? <Loader2Icon className="animate-spin w-5 h-5"/> : saveSuccess ? <CheckCircleIcon className="w-5 h-5"/> : "Guardar"}
                        </button>
                    </div>
                </form>
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
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Buscar por cédula, RUC o nombre..." 
                    className="w-full pl-12 p-4 border border-gray-200 dark:border-gray-700 rounded-2xl dark:bg-gray-800 text-lg shadow-sm focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all" 
                    autoFocus
                />
            </div>

            {searchTerm.length > 1 && (
                <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredClients.length > 0 ? (
                        filteredClients.map((c) => {
                            const ltv = getClientLtv(c.id);
                            const isVip = ltv > 500;

                            return (
                                <div 
                                    key={c.id} 
                                    onClick={() => onSelectClient(c)}
                                    className="p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 flex justify-between items-center transition-colors group relative overflow-hidden"
                                >
                                    {isVip && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>}
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="h-10 w-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">
                                                {c.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            {isVip && <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5"><StarIcon className="w-3 h-3 text-yellow-900 fill-current" /></div>}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900 dark:text-white leading-tight">{c.nombre}</p>
                                                {isVip && <span className="text-[10px] bg-yellow-100 text-yellow-800 border border-yellow-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">VIP 🌟</span>}
                                            </div>
                                            <p className="text-sm text-gray-500 flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3"/> {c.cedula}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${c.regimen === Regimen.NEGOCIO_POPULAR ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                            {c.regimen}
                                        </span>
                                        {ltv > 0 && (
                                            <span className="text-[10px] text-green-600 font-semibold flex items-center gap-0.5">
                                                <DollarIcon className="w-3 h-3"/> Hist: {formatCurrency(ltv)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-6 text-center">
                            <p className="text-gray-500 mb-4">No se encontraron clientes.</p>
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
                initialName={!/^\d+$/.test(searchTerm) ? searchTerm : ''}
                initialCedulaRuc={/^\d+$/.test(searchTerm) ? searchTerm : ''}
            />
        </div>
    );
};

export default ClientSelector;
