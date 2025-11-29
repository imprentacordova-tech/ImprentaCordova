
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getConfig, saveConfig, NotaDeVentaConfig } from '../services/configService';
import { getSriCredentials, addSriCredential, deleteSriCredential } from '../services/mockApi';
import { Cog8ToothIcon, CheckCircleIcon, ShieldCheckIcon, AddIcon, TrashIcon, ArrowDownTrayIcon, KeyIcon, SearchIcon, Loader2Icon } from '../components/Icons';
import { SriCredential } from '../types';

const InputField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, [key: string]: any}> = ({ label, name, value, onChange, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <input
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            {...props}
        />
    </div>
);

const ConfiguracionPage: React.FC = () => {
    const [config, setConfig] = useState<NotaDeVentaConfig>(getConfig());
    const [showSuccess, setShowSuccess] = useState(false);
    const [sriCredentials, setSriCredentials] = useState<SriCredential[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Manual Add State
    const [newRuc, setNewRuc] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            const creds = await getSriCredentials();
            setSriCredentials(creds);
        };
        fetchData();

        if (location.hash) {
            const id = location.hash.substring(1);
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [location]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveConfig(config);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleAddManualCredential = async () => {
        if (newRuc.trim() && newPassword.trim()) {
            const updatedCreds = await addSriCredential({
                ruc: newRuc.trim(),
                password: newPassword.trim(),
                origen: 'Manual'
            });
            setSriCredentials(updatedCreds);
            setNewRuc('');
            setNewPassword('');
        }
    };

    const handleDeleteCredential = async (ruc: string) => {
        const updatedCreds = await deleteSriCredential(ruc);
        setSriCredentials(updatedCreds);
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);

        try {
            const text = await file.text();
            const lines = text.split('\n');
            let importedCount = 0;
            
            // FORMATO CHROME: name,url,username,password,note
            // El objetivo es filtrar solo las que tienen URL del SRI
            
            for (let i = 1; i < lines.length; i++) { // Saltar header
                const line = lines[i].trim();
                if (!line) continue;

                // CSV parsing simple pero efectivo para el formato estándar de Chrome
                // Maneja comillas básicas si existen
                const parts = line.split(',');
                
                // En el CSV de Chrome:
                // index 0: name
                // index 1: url
                // index 2: username (RUC)
                // index 3: password
                
                if (parts.length >= 4) {
                    const url = parts[1] || '';
                    const username = parts[2] || '';
                    const password = parts[3] || '';

                    // Lógica de filtrado: Solo URLs que contengan sri.gob.ec
                    if (url.includes('sri.gob.ec') && username && password) {
                        // Limpieza de datos (eliminar comillas si existen, espacios)
                        const cleanRuc = username.replace(/["']/g, '').trim();
                        const cleanPass = password.replace(/["']/g, '').trim();

                        if (cleanRuc && cleanPass) {
                            await addSriCredential({
                                ruc: cleanRuc,
                                password: cleanPass,
                                origen: 'Chrome CSV'
                            });
                            importedCount++;
                        }
                    }
                }
            }

            const updatedCreds = await getSriCredentials();
            setSriCredentials(updatedCreds);
            alert(`✅ Éxito: Se importaron ${importedCount} claves del SRI.`);

        } catch (error) {
            console.error("Error al importar:", error);
            alert("Error al leer el archivo. Asegúrate de que sea el CSV exportado de Chrome.");
        } finally {
            setIsImporting(false);
            if (e.target) e.target.value = '';
        }
    };

    const filteredCredentials = sriCredentials.filter(c => 
        c.ruc.includes(searchTerm) || c.origen?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-10">
            <div className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="bg-brand-blue p-2 rounded-lg text-white">
                    <Cog8ToothIcon className="h-8 w-8"/>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración del Sistema</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Administra los parámetros generales y datos fiscales.</p>
                </div>
            </div>

            <div className="space-y-10">
                {/* SRI Credentials - New Design based on Screenshot */}
                 <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* Header Oscuro */}
                    <div className="bg-slate-900 p-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-500/20 p-2 rounded-full">
                                <ShieldCheckIcon className="h-6 w-6 text-green-400" />
                            </div>
                            <div className="text-white">
                                <h2 className="text-xl font-bold">Base de Datos Claves SRI</h2>
                                <p className="text-xs text-slate-400 font-light">Gestión de autorización para autocompletado inteligente en nuevos pedidos.</p>
                            </div>
                        </div>
                        <div className="bg-slate-800 px-4 py-1.5 rounded-full text-xs text-white font-mono border border-slate-700 shadow-sm">
                            {sriCredentials.length} Registros
                        </div>
                    </div>
                    
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
                        {/* Action Bar */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between mb-6">
                            
                            <div className="flex-grow w-full lg:w-auto flex flex-col sm:flex-row gap-3 items-end">
                                <div className="w-full sm:w-48">
                                    <input 
                                        type="text" 
                                        value={newRuc} 
                                        onChange={(e) => setNewRuc(e.target.value.replace(/\D/g, ''))} 
                                        placeholder="RUC (13 dígitos)" 
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none font-mono"
                                    />
                                </div>
                                <div className="w-full sm:w-48">
                                    <input 
                                        type="text" 
                                        value={newPassword} 
                                        onChange={(e) => setNewPassword(e.target.value)} 
                                        placeholder="Contraseña SRI" 
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue outline-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleAddManualCredential} 
                                    disabled={!newRuc || !newPassword} 
                                    className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                                >
                                    <AddIcon className="h-4 w-4" /> Añadir
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 pt-4 lg:pt-0 lg:pl-4">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.txt" className="hidden" />
                                <button 
                                    onClick={handleImportClick} 
                                    disabled={isImporting}
                                    className="w-full lg:w-auto px-5 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white font-bold text-sm rounded-lg hover:border-brand-blue hover:text-brand-blue transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    {isImporting ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
                                    Importar CSV
                                </button>
                            </div>
                        </div>

                        {/* Search & List */}
                        <div className="space-y-4">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                <input 
                                    type="text" 
                                    placeholder="Buscar clave registrada..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-blue outline-none dark:bg-gray-800 dark:border-gray-600"
                                />
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[400px] overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">RUC / Usuario</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contraseña</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Origen</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredCredentials.length > 0 ? (
                                            filteredCredentials.map((cred) => (
                                                <tr key={cred.ruc} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-mono font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                                        <KeyIcon className="w-4 h-4 text-gray-300 group-hover:text-brand-blue transition-colors" />
                                                        {cred.ruc}
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">
                                                        <div className="flex items-center gap-2 group/pass">
                                                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">••••••••</span>
                                                            <span className="opacity-0 group-hover/pass:opacity-100 transition-opacity text-xs text-blue-600 font-bold select-all cursor-text">{cred.password}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-xs text-gray-400">
                                                        <span className={`px-2 py-1 rounded-full ${cred.origen === 'Manual' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                                            {cred.origen || 'Manual'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                        <button onClick={() => handleDeleteCredential(cred.ruc)} className="text-gray-300 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full">
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                    <p className="text-sm">No se encontraron resultados.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Nota de Venta Config */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">Configuración de Documentos</h2>
                        
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider mb-4 bg-blue-50 dark:bg-blue-900/20 inline-block px-3 py-1 rounded-md">Datos del Emisor</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Nombre Comercial" name="emisorNombreComercial" value={config.emisorNombreComercial} onChange={handleChange} />
                                    <InputField label="Razón Social" name="emisorRazonSocial" value={config.emisorRazonSocial} onChange={handleChange} />
                                    <InputField label="RUC Emisor" name="emisorRuc" value={config.emisorRuc} onChange={handleChange} />
                                    <InputField label="Tipo Contribuyente" name="emisorTipoContribuyente" value={config.emisorTipoContribuyente} onChange={handleChange} />
                                    <InputField label="Dirección Matriz" name="emisorDireccionMatriz" value={config.emisorDireccionMatriz} onChange={handleChange} />
                                    <InputField label="Dirección Sucursal" name="emisorDireccionSucursal" value={config.emisorDireccionSucursal} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider mb-4 bg-blue-50 dark:bg-blue-900/20 inline-block px-3 py-1 rounded-md">Detalles del Documento</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Prefijo de Numeración" name="numeracionPrefijo" value={config.numeracionPrefijo} onChange={handleChange} placeholder="Ej: 002-001-" />
                                    <InputField label="Autorización SRI (10 dígitos)" name="autorizacionSRI" value={config.autorizacionSRI} onChange={handleChange} maxLength={10} />
                                    <InputField label="Fecha de Autorización" name="fechaAutorizacion" value={config.fechaAutorizacion} onChange={handleChange} type="date" />
                                    <InputField label="Fecha de Caducidad" name="fechaCaducidad" value={config.fechaCaducidad} onChange={handleChange} type="date" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="sticky bottom-4 flex justify-end z-20">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-2 pr-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                            {showSuccess && (
                                <span className="text-green-600 flex items-center gap-2 font-bold animate-fade-in px-2">
                                    <CheckCircleIcon className="h-6 w-6"/> Guardado
                                </span>
                            )}
                            <button type="submit" className="px-8 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-800 transition-all transform active:scale-95 flex items-center gap-2">
                                <ArrowDownTrayIcon className="h-5 w-5" /> Guardar Configuración
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConfiguracionPage;
