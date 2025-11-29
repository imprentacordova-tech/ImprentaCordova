
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getConfig, saveConfig, NotaDeVentaConfig } from '../services/configService';
import { getSriCredentials, addSriCredential, deleteSriCredential } from '../services/mockApi';
import { Cog8ToothIcon, CheckCircleIcon, ShieldCheckIcon, AddIcon, TrashIcon, ArrowDownTrayIcon, KeyIcon } from '../components/Icons';
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
    
    // Manual Add State
    const [newRuc, setNewRuc] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
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

        try {
            const text = await file.text();
            const lines = text.split('\n');
            let importedCount = 0;
            
            // Chrome CSV: name,url,username,password
            // Edge/Other might vary, but typically follow similar structure.
            // We will look for "sri.gob.ec" in the URL column.

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Simple parsing (robust CSV parsing would use a library, but this suffices for standard exports)
                const parts = line.split(',');
                
                if (parts.length >= 4) {
                    const url = parts[1] || '';
                    const username = parts[2] || '';
                    const password = parts[3] || '';

                    if (url.includes('sri.gob.ec') && username && password) {
                        await addSriCredential({
                            ruc: username.trim(),
                            password: password.trim().replace(/\r/g, ''), // Remove CR
                            origen: 'Importado CSV'
                        });
                        importedCount++;
                    }
                }
            }

            if (importedCount > 0) {
                const updatedCreds = await getSriCredentials();
                setSriCredentials(updatedCreds);
                alert(`Se han importado ${importedCount} credenciales del SRI correctamente.`);
            } else {
                alert("No se encontraron contraseñas para 'sri.gob.ec' en el archivo.");
            }

        } catch (error) {
            console.error("Error al importar:", error);
            alert("Error al leer el archivo. Asegúrate de que sea un CSV válido.");
        }
        
        if (e.target) e.target.value = '';
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-10">
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
                {/* SRI Credentials - New Design */}
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="bg-gray-900 p-6 flex justify-between items-center">
                        <div className="flex items-center gap-3 text-white">
                            <ShieldCheckIcon className="h-6 w-6 text-green-400" />
                            <div>
                                <h2 className="text-xl font-bold">Base de Datos Claves SRI</h2>
                                <p className="text-xs text-gray-400 font-light">Gestión de autorizaciones para autocompletado inteligente</p>
                            </div>
                        </div>
                        <div className="bg-white/10 px-3 py-1 rounded-full text-xs text-white font-mono border border-white/20">
                            {sriCredentials.length} Registros
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        {/* Add / Import Section */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-end">
                             <div className="flex-grow w-full md:w-auto">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">RUC / Usuario</label>
                                <input 
                                    type="text" 
                                    value={newRuc} 
                                    onChange={(e) => setNewRuc(e.target.value.replace(/\D/g, ''))} 
                                    placeholder="10-13 dígitos" 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div className="flex-grow w-full md:w-auto">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Contraseña</label>
                                <input 
                                    type="text" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    placeholder="Clave SRI" 
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <button onClick={handleAddManualCredential} disabled={!newRuc || !newPassword} className="px-4 py-2 bg-brand-blue text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm h-[38px]">
                                <AddIcon className="h-4 w-4" /> Añadir
                            </button>
                            
                            <div className="w-px h-10 bg-gray-300 dark:bg-gray-600 mx-2 hidden md:block"></div>
                            
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.txt" className="hidden" />
                            <button onClick={handleImportClick} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:border-brand-blue hover:text-brand-blue transition-all shadow-sm flex items-center gap-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 h-[38px]">
                                <ArrowDownTrayIcon className="h-4 w-4" /> Importar CSV
                            </button>
                        </div>

                        {/* List Section */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RUC / Usuario</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contraseña</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Origen</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {sriCredentials.length > 0 ? (
                                        sriCredentials.map((cred) => (
                                            <tr key={cred.ruc} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-700 dark:text-gray-200">{cred.ruc}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">•••••••</span>
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-500">{cred.password?.substring(0,3)}...</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">{cred.origen || 'Manual'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => handleDeleteCredential(cred.ruc)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No hay credenciales registradas.</p>
                                                <p className="text-xs mt-1">Importa un CSV de Chrome o añade manualmente.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Nota de Venta Config */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">Configuración de Nota de Venta</h2>
                        
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
                    
                    <div className="sticky bottom-4 flex justify-end">
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-2 pr-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                            {showSuccess && (
                                <span className="text-green-600 flex items-center gap-2 font-bold animate-fade-in px-2">
                                    <CheckCircleIcon className="h-6 w-6"/> Guardado
                                </span>
                            )}
                            <button type="submit" className="px-8 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-800 transition-all transform active:scale-95 flex items-center gap-2">
                                <ArrowDownTrayIcon className="h-5 w-5" /> Guardar Todo
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConfiguracionPage;
