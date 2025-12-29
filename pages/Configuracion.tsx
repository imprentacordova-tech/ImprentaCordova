
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getConfig, saveConfig, NotaDeVentaConfig } from '../services/configService';
import { getSriCredentials, addSriCredential, bulkAddSriCredentials, deleteSriCredential } from '../services/mockApi';
import { Cog8ToothIcon, CheckCircleIcon, ShieldCheckIcon, AddIcon, TrashIcon, ArrowDownTrayIcon, KeyIcon, SearchIcon, Loader2Icon, ArrowLeftIcon, ArrowRightIcon, GlobeAltIcon } from '../components/Icons';
import { SriCredential } from '../types';

const InputField: React.FC<{label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, [key: string]: any}> = ({ label, name, value, onChange, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
        <input
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all dark:text-white font-bold text-sm"
            {...props}
        />
    </div>
);

const ConfiguracionPage: React.FC = () => {
    const [config, setConfig] = useState<NotaDeVentaConfig>(getConfig());
    const [showSuccess, setShowSuccess] = useState(false);
    const [sriCredentials, setSriCredentials] = useState<SriCredential[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [newRuc, setNewRuc] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getSriCredentials().then(setSriCredentials);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault();
        saveConfig(config);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    // ... (Métodos de claves SRI se mantienen igual) ...

    const handleAddManual = async () => {
        if (newRuc.trim() && newPassword.trim()) {
            const updated = await addSriCredential({ ruc: newRuc.trim(), password: newPassword.trim(), origen: 'Manual' });
            setSriCredentials(updated);
            setNewRuc(''); setNewPassword('');
        }
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/).slice(1);
            const creds: SriCredential[] = [];
            lines.forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 4) {
                    const url = parts[1]?.toLowerCase() || '';
                    if (url.includes('sri.gob.ec') || url.includes('ecuafact')) {
                        creds.push({ ruc: parts[2].replace(/"/g, ''), password: parts[3].replace(/"/g, ''), origen: 'Importado' });
                    }
                }
            });
            if (creds.length > 0) {
                const updated = await bulkAddSriCredentials(creds);
                setSriCredentials(updated);
                alert(`Importadas ${creds.length} claves SRI.`);
            }
        } catch (error) { alert("Error al leer el CSV."); }
        finally { setIsImporting(false); e.target.value = ''; }
    };

    const filteredCredentials = useMemo(() => {
        return sriCredentials.filter(c => c.ruc.includes(searchTerm));
    }, [sriCredentials, searchTerm]);

    return (
        <div className="space-y-10 max-w-5xl mx-auto pb-20 animate-fade-in">
            <div className="flex items-center gap-6">
                <div className="bg-brand-blue p-4 rounded-[2rem] text-white shadow-xl">
                    <Cog8ToothIcon className="h-10 w-10"/>
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Configuración Maestra</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 opacity-60">Gestión de la nube y parámetros del taller</p>
                </div>
            </div>

            {/* Panel de Nube / Google Sincronización */}
            <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border border-slate-100">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 mb-6">
                    <GlobeAltIcon className="w-6 h-6 text-brand-blue" /> Sincronización en la Nube
                </h2>
                <div className="space-y-4">
                    <InputField 
                        label="URL del Google Script (API)" 
                        name="googleScriptUrl" 
                        value={config.googleScriptUrl} 
                        onChange={handleChange} 
                        placeholder="https://script.google.com/macros/s/.../exec"
                    />
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-700 font-medium">
                        Esta URL conecta la aplicación con tus hojas de cálculo de Google Sheets y tu carpeta de Google Drive. No la modifiques a menos que hayas actualizado tu Script de Google.
                    </div>
                </div>
            </div>

            {/* Panel de Claves SRI */}
            <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="bg-slate-900 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-500/20 p-3 rounded-2xl"><KeyIcon className="w-6 h-6 text-green-400" /></div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Base de Datos de Claves</h2>
                            <p className="text-xs text-slate-400">Las claves se guardan en la pestaña "Seguridad" de tu Google Sheet.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-white/10 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white hover:text-slate-900 transition-all">
                            {isImporting ? <Loader2Icon className="animate-spin w-4 h-4" /> : <ArrowDownTrayIcon className="w-4 h-4" />} IMPORTAR CSV CHROME
                        </button>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 shadow-sm items-end mb-8">
                        <div className="md:col-span-4"><InputField label="RUC / Usuario SRI" name="ruc" value={newRuc} onChange={e => setNewRuc(e.target.value.replace(/\D/g, ''))} placeholder="17..." /></div>
                        <div className="md:col-span-5"><InputField label="Contraseña del Portal" name="pass" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" /></div>
                        <div className="md:col-span-3">
                            <button onClick={handleAddManual} className="w-full py-3.5 bg-brand-blue text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-950 transition-all flex justify-center items-center gap-2 shadow-lg">
                                <AddIcon className="w-4 h-4"/> Añadir Registro
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" placeholder="Filtrar por RUC..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-brand-blue/5 font-bold" />
                    </div>
                </div>
            </div>

            <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <ShieldCheckIcon className="w-6 h-6 text-brand-blue" /> Datos del Taller (Emisor)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputField label="Nombre Comercial" name="emisorNombreComercial" value={config.emisorNombreComercial} onChange={handleChange} />
                    <InputField label="RUC de la Imprenta" name="emisorRuc" value={config.emisorRuc} onChange={handleChange} />
                    <InputField label="Número de Autorización SRI" name="autorizacionSRI" value={config.autorizacionSRI} onChange={handleChange} />
                    <InputField label="Dirección Matriz" name="emisorDireccionMatriz" value={config.emisorDireccionMatriz} onChange={handleChange} />
                </div>
                <div className="pt-6 border-t flex justify-between items-center">
                    {showSuccess && <span className="text-green-500 font-black text-xs animate-fade-in">✓ CONFIGURACIÓN GUARDADA</span>}
                    <button type="submit" className="px-12 py-4 bg-brand-red text-white font-black rounded-2xl shadow-xl hover:bg-slate-950 transition-all uppercase tracking-widest text-[10px]">Guardar Cambios</button>
                </div>
            </form>
        </div>
    );
};

export default ConfiguracionPage;
