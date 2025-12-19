
import React, { useState, useEffect } from 'react';
import { Cliente, Regimen } from '../../types';
import { createCliente } from '../../services/mockApi';
import { useData } from '../../contexts/DataContext';
import { SearchIcon, UserPlusIcon, ShieldCheckIcon, CloseIcon, Loader2Icon, CheckCircleIcon, ClipboardIcon, SparklesIcon } from '../Icons';

// Helper para Inputs
const InputField: React.FC<{ label: string; name: string; value: any; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; [key: string]: any; }> = ({ label, name, value, onChange, ...props }) => (
    <div className="group">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors group-focus-within:text-brand-blue">{label}</label>
        <input id={name} name={name} value={value} onChange={onChange} className="w-full p-2.5 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm" {...props} />
    </div>
);

/**
 * Función de procesamiento de texto (RegEx) para certificados SRI
 * Extrae datos de forma determinística sin IA
 */
const parseSRICertificate = (text: string) => {
    const data: any = {};
    
    // 1. Extraer RUC (Patrón de 13 dígitos)
    const rucMatch = text.match(/\d{13}/);
    if (rucMatch) data.cedulaRuc = rucMatch[0];

    // 2. Extraer Nombres
    // Busca el patrón entre "Apellidos y nombres" y "Número RUC" o similar
    const nameRegex = /(?:Apellidos y nombres|Apellidos y Nombres)\s+([\s\S]*?)(?=\s+Número RUC|\s+Estado|\s+\d{10})/;
    const nameMatch = text.match(nameRegex);
    if (nameMatch && nameMatch[1]) {
        data.nombre = nameMatch[1].trim().replace(/\n/g, ' ');
    } else {
        // Fallback: Si el texto viene de OCR directo donde el nombre está cerca del RUC
        const fallbackNameRegex = /([A-Z\s]{10,})(?=\s+\d{13})/;
        const fallbackMatch = text.match(fallbackNameRegex);
        if (fallbackMatch) data.nombre = fallbackMatch[1].trim();
    }

    // 3. Extraer Celular
    const telMatch = text.match(/(?:Celular:|Celular)\s*(\d{10})/);
    if (telMatch) data.telefono = telMatch[1];

    // 4. Determinar Régimen
    if (text.toUpperCase().includes('POPULAR')) data.regimen = Regimen.NEGOCIO_POPULAR;
    else if (text.toUpperCase().includes('EMPRENDEDOR')) data.regimen = Regimen.EMPRENDEDOR;
    else if (text.toUpperCase().includes('GENERAL')) data.regimen = Regimen.GENERAL;

    // 5. Dirección (Domicilio tributario)
    const dirRegex = /(?:Provincia:)\s+([\s\S]*?)(?=\s+Medios de contacto|\s+Actividades económicas)/;
    const dirMatch = text.match(dirRegex);
    if (dirMatch) data.direccion = dirMatch[1].trim().replace(/\n/g, ' ');

    // 6. Actividades (para Notas)
    const actRegex = /(?:Actividades económicas:?)\s+([\s\S]*?)(?=\s+Establecimientos|\s+Obligaciones)/;
    const actMatch = text.match(actRegex);
    if (actMatch) data.notas = "Actividades SRI: " + actMatch[1].trim().replace(/\n/g, ' ');

    return data;
};

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
    
    // Estado para extractor rápido
    const [showExtractor, setShowExtractor] = useState(false);
    const [rawText, setRawText] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNewClienteData({ 
                nombre: initialName || '', nombreComercial: '', cedulaRuc: initialCedulaRuc || '', 
                email: '', direccion: 'Pasaje, El Oro', notas: '', regimen: Regimen.GENERAL 
            });
            setTelefonos([]);
            setCurrentTelefono('');
            setSaveSuccess(false);
            setShowExtractor(false);
            setRawText('');
        }
    }, [isOpen, initialName, initialCedulaRuc]);

    if (!isOpen) return null;

    const handleApplyExtraction = () => {
        const extracted = parseSRICertificate(rawText);
        setNewClienteData(prev => ({
            ...prev,
            nombre: extracted.nombre || prev.nombre,
            cedulaRuc: extracted.cedulaRuc || prev.cedulaRuc,
            regimen: extracted.regimen || prev.regimen,
            direccion: extracted.direccion || prev.direccion,
            notas: extracted.notas || prev.notas
        }));
        if (extracted.telefono && !telefonos.includes(extracted.telefono)) {
            setTelefonos(prev => [...prev, extracted.telefono]);
        }
        setShowExtractor(false);
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
                
                {/* Herramienta de Extracción Rápida */}
                <div className="px-6 pt-4">
                    <button 
                        type="button"
                        onClick={() => setShowExtractor(!showExtractor)}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border-2 border-dashed transition-all ${showExtractor ? 'bg-blue-50 border-brand-blue text-brand-blue' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                    >
                        <ClipboardIcon className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-widest">
                            {showExtractor ? 'Cerrar Extractor' : 'Auto-completar desde Certificado SRI'}
                        </span>
                    </button>

                    {showExtractor && (
                        <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 animate-bounce-in">
                            <label className="block text-[10px] font-black text-brand-blue uppercase mb-2">Pega aquí el texto copiado del PDF/OCR:</label>
                            <textarea 
                                value={rawText}
                                onChange={e => setRawText(e.target.value)}
                                className="w-full h-32 p-3 text-xs border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-blue mb-3 bg-white dark:bg-gray-800"
                                placeholder="Pega el contenido del certificado aquí..."
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setRawText('')} className="text-xs font-bold text-gray-500 hover:text-gray-700 px-3 py-1">Limpiar</button>
                                <button type="button" onClick={handleApplyExtraction} className="bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-1">
                                    Extraer Datos
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nombres" name="nombre" value={newClienteData.nombre} onChange={handleChange} required />
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
                            <input type="tel" value={currentTelefono} onChange={e => setCurrentTelefono(e.target.value)} onKeyDown={handleTelefonoKeyDown} placeholder="Añadir tel..." className="bg-transparent outline-none flex-grow min-w-[100px] text-sm" />
                        </div>
                    </div>
                    
                    <InputField label="Dirección" name="direccion" value={newClienteData.direccion} onChange={handleChange} />

                    <div>
                        <label className="block text-sm font-medium dark:text-gray-300 mb-1">Régimen</label>
                        <select name="regimen" value={newClienteData.regimen} onChange={handleChange} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue">
                            <option value={Regimen.GENERAL}>Régimen General</option>
                            <option value={Regimen.EMPRENDEDOR}>Rimpe Emprendedor</option>
                            <option value={Regimen.NEGOCIO_POPULAR}>Rimpe Negocio Popular</option>
                        </select>
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
    const { clientes } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Simple filter
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
                        filteredClients.map((c) => (
                            <div 
                                key={c.id} 
                                onClick={() => onSelectClient(c)}
                                className="p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 flex justify-between items-center transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">
                                        {c.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white leading-tight">{c.nombre}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3"/> {c.cedula}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${c.regimen === Regimen.NEGOCIO_POPULAR ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    {c.regimen}
                                </span>
                            </div>
                        ))
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
