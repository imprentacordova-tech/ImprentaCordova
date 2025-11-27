import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getConfig, saveConfig, NotaDeVentaConfig } from '../services/configService';
import { getSriKeys, addSriKey, deleteSriKey } from '../services/mockApi';
import { Cog8ToothIcon, CheckCircleIcon, ShieldCheckIcon, AddIcon, TrashIcon, ArrowDownTrayIcon } from '../components/Icons';

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
    const [sriKeys, setSriKeys] = useState<string[]>([]);
    const [newSriKey, setNewSriKey] = useState('');
    const location = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            const keys = await getSriKeys();
            setSriKeys(keys);
        };
        fetchData();

        if (location.hash) {
            const id = location.hash.substring(1); // remove #
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
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

    const handleAddKey = async () => {
        if (newSriKey.trim() && !sriKeys.includes(newSriKey.trim())) {
            const updatedKeys = await addSriKey(newSriKey.trim());
            setSriKeys(updatedKeys);
            setNewSriKey('');
        }
    };

    const handleDeleteKey = async (keyToDelete: string) => {
        const updatedKeys = await deleteSriKey(keyToDelete);
        setSriKeys(updatedKeys);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.split('\n');
            
            // Expresión regular para detectar RUCs o Claves (10 a 49 dígitos)
            const keyPattern = /^\d{10,49}$/;
            
            const currentKeysSet = new Set(sriKeys);
            const newKeysFound: string[] = [];

            // Detect if it's a Chrome Export by checking header
            const isChromeExport = lines[0].includes('name,url,username,password');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Skip header
                if (i === 0 && line.includes('name,url')) continue;
                
                // CSV Parser simple logic
                const parts = line.split(',');
                
                if (isChromeExport && parts.length >= 3) {
                    // In Chrome CSV: name(0), url(1), username(2), password(3)
                    // We only care about username if it looks like a RUC
                    const username = parts[2]?.trim();
                    const url = parts[1]?.trim();

                    // Optional: Filter only SRI related URLs if needed, but checking regex is safer
                    if (username && keyPattern.test(username)) {
                         if (!currentKeysSet.has(username) && !newKeysFound.includes(username)) {
                            newKeysFound.push(username);
                        }
                    }
                } else {
                    // Fallback for simple text files
                    for (const part of parts) {
                        const cleanPart = part.trim().replace(/['"]/g, '');
                        if (keyPattern.test(cleanPart)) {
                            if (!currentKeysSet.has(cleanPart) && !newKeysFound.includes(cleanPart)) {
                                newKeysFound.push(cleanPart);
                            }
                        }
                    }
                }
            }

            if (newKeysFound.length > 0) {
                // Process in chunks to avoid UI freezing
                const chunk = newKeysFound; 
                for (const key of chunk) {
                   await addSriKey(key);
                }
                
                const updatedKeys = await getSriKeys();
                setSriKeys(updatedKeys);
                alert(`Se han importado ${newKeysFound.length} claves/RUCs nuevas exitosamente desde el archivo.`);
            } else {
                alert("No se encontraron claves numéricas nuevas válidas (10-49 dígitos) en el archivo.");
            }

        } catch (error) {
            console.error("Error al importar:", error);
            alert("Hubo un error al leer el archivo.");
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
                {/* SRI Keys Config - Enhanced Design */}
                 <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 flex justify-between items-center">
                        <div className="flex items-center gap-3 text-white">
                            <ShieldCheckIcon className="h-6 w-6 text-green-400" />
                            <div>
                                <h2 className="text-xl font-bold">Base de Datos Claves SRI</h2>
                                <p className="text-xs text-gray-400 font-light">Gestión de autorizaciones para autocompletado inteligente</p>
                            </div>
                        </div>
                        <div className="bg-white/10 px-3 py-1 rounded-full text-xs text-white font-mono border border-white/20">
                            {sriKeys.length} Registros
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 items-stretch">
                            <div className="flex-grow relative">
                                <input 
                                    type="text" 
                                    value={newSriKey} 
                                    onChange={(e) => setNewSriKey(e.target.value.replace(/\D/g, ''))} 
                                    placeholder="Ingresar clave de acceso o autorización (10-49 dígitos)" 
                                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-brand-blue outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm shadow-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleAddKey} disabled={!newSriKey} className="px-6 py-2 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                    <AddIcon className="h-5 w-5" /> Añadir
                                </button>
                                
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.txt" className="hidden" />
                                <button onClick={handleImportClick} className="px-6 py-2 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-brand-blue hover:text-brand-blue transition-all shadow-sm flex items-center gap-2 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-white">
                                    <ArrowDownTrayIcon className="h-5 w-5" /> Importar CSV
                                </button>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Claves Registradas</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                {sriKeys.length > 0 ? (
                                    sriKeys.map((key) => (
                                        <div key={key} className="group flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-blue hover:shadow-md transition-all">
                                            <span className="font-mono text-xs font-bold text-gray-600 dark:text-gray-300 truncate mr-2 select-all">{key}</span>
                                            <button onClick={() => handleDeleteKey(key)} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8 flex flex-col items-center justify-center text-gray-400">
                                        <ShieldCheckIcon className="w-10 h-10 mb-2 opacity-20" />
                                        <p className="text-sm">No hay claves en la base de datos.</p>
                                    </div>
                                )}
                            </div>
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

                            <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                <h3 className="text-sm font-bold text-brand-blue uppercase tracking-wider mb-4 bg-blue-50 dark:bg-blue-900/20 inline-block px-3 py-1 rounded-md">Datos de Imprenta (Pie de Página)</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     <InputField label="Nombre Imprenta" name="imprentaNombre" value={config.imprentaNombre} onChange={handleChange} />
                                     <InputField label="RUC Imprenta" name="imprentaRuc" value={config.imprentaRuc} onChange={handleChange} />
                                     <InputField label="No. Autorización" name="imprentaAutorizacion" value={config.imprentaAutorizacion} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recibo de Abono Config */}
                    <div id="recibo-form" className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                         <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">Configuración de Recibo</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <InputField label="Código Interno / Autorización" name="reciboCodAuto" value={config.reciboCodAuto} onChange={handleChange} placeholder="Ej: 8634" />
                            <InputField label="Dirección Completa (Para Recibo)" name="emisorDireccionCompleta" value={config.emisorDireccionCompleta} onChange={handleChange} />
                            <InputField label="Email Contacto" name="emisorEmail" value={config.emisorEmail} onChange={handleChange} type="email" />
                            <InputField label="Teléfono Contacto" name="emisorTelefono" value={config.emisorTelefono} onChange={handleChange} />
                        </div>
                        <div>
                            <label htmlFor="reciboServicios" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lista de Servicios (Pie de Recibo)</label>
                            <textarea
                                id="reciboServicios"
                                name="reciboServicios"
                                value={config.reciboServicios}
                                onChange={handleChange}
                                rows={4}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                placeholder="Liste los servicios separados por punto y coma (;)"
                            />
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