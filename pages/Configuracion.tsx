
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getConfig, saveConfig, NotaDeVentaConfig } from '../services/configService';
import { getSriCredentials, addSriCredential, bulkAddSriCredentials, deleteSriCredential } from '../services/mockApi';
import { Cog8ToothIcon, CheckCircleIcon, ShieldCheckIcon, AddIcon, TrashIcon, ArrowDownTrayIcon, KeyIcon, SearchIcon, Loader2Icon, ArrowLeftIcon, ArrowRightIcon, GlobeAltIcon, Copy } from '../components/Icons';
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
    
    // Manual entry states
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

    const handleAddManual = async () => {
        if (newRuc.trim() && newPassword.trim()) {
            const updated = await addSriCredential({ ruc: newRuc.trim(), password: newPassword.trim(), origen: 'Manual' });
            setSriCredentials(updated);
            setNewRuc(''); 
            setNewPassword('');
        }
    };

    const handleDeleteKey = async (ruc: string) => {
        if (confirm(`¿Eliminar la clave del RUC ${ruc}?`)) {
            const updated = await deleteSriCredential(ruc);
            setSriCredentials(updated);
        }
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/);
            const headers = lines[0].toLowerCase().split(',');
            
            // Detectar indices de columnas (name, url, username, password)
            const idxUser = headers.indexOf('username');
            const idxPass = headers.indexOf('password');
            const idxName = headers.indexOf('name');

            const creds: SriCredential[] = [];
            lines.slice(1).forEach(line => {
                // Manejar comas dentro de comillas
                const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (parts && parts.length >= 4) {
                    const rucRaw = parts[idxUser]?.replace(/"/g, '') || '';
                    // El RUC suele ser el username. Limpiamos solo números.
                    const ruc = rucRaw.replace(/\D/g, '');
                    const pass = parts[idxPass]?.replace(/"/g, '') || '';
                    const name = parts[idxName]?.replace(/"/g, '') || '';

                    if (ruc.length >= 10 && pass) {
                        creds.push({ 
                            ruc, 
                            password: pass, 
                            origen: `Importado (${name})`,
                            updatedAt: new Date().toISOString()
                        });
                    }
                }
            });

            if (creds.length > 0) {
                const updated = await bulkAddSriCredentials(creds);
                setSriCredentials(updated);
                alert(`¡Éxito! Se han procesado ${creds.length} registros de seguridad.`);
            } else {
                alert("No se encontraron registros válidos. Verifica el formato del CSV.");
            }
        } catch (error) { 
            console.error(error);
            alert("Error crítico al leer el archivo."); 
        } finally { 
            setIsImporting(false); 
            e.target.value = ''; 
        }
    };

    const filteredCredentials = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return sriCredentials.filter(c => 
            c.ruc.includes(searchTerm) || 
            (c.origen || '').toLowerCase().includes(lower)
        );
    }, [sriCredentials, searchTerm]);

    const [copiedRuc, setCopiedRuc] = useState<string | null>(null);
    const copyToClipboard = (val: string, ruc: string) => {
        navigator.clipboard.writeText(val);
        setCopiedRuc(ruc);
        setTimeout(() => setCopiedRuc(null), 2000);
    };

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-32 animate-fade-in">
            <div className="flex items-center gap-6">
                <div className="bg-brand-blue p-5 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20">
                    <Cog8ToothIcon className="h-10 w-10"/>
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Cerebro de <span className="text-brand-red">Configuración</span></h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 opacity-60">Control total del taller y seguridad SRI</p>
                </div>
            </div>

            {/* SECCIÓN DE CLAVES SRI - LA MÁS IMPORTANTE */}
            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-3xl border border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="bg-slate-950 p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="bg-emerald-500 p-4 rounded-3xl shadow-lg shadow-emerald-900/40">
                            <KeyIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Bóveda de Seguridad SRI</h2>
                            <p className="text-emerald-400/60 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Base de datos maestra: {sriCredentials.length} registros</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 relative z-10 w-full lg:w-auto">
                        <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isImporting} 
                            className="flex-1 lg:flex-none bg-white/5 hover:bg-white text-white hover:text-slate-950 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            {isImporting ? <Loader2Icon className="animate-spin w-5 h-5" /> : <ArrowDownTrayIcon className="w-5 h-5" />} 
                            Importar CSV Chrome
                        </button>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    {/* Buscador y Añadir */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-end">
                        <div className="xl:col-span-5 relative">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Buscar en la Bóveda</label>
                            <SearchIcon className="absolute left-4 bottom-4 w-5 h-5 text-slate-300" />
                            <input 
                                type="text" 
                                placeholder="RUC, Cédula o Nombre..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="w-full pl-12 p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-4 focus:ring-brand-blue/10 font-bold text-slate-900 dark:text-white" 
                            />
                        </div>
                        <div className="xl:col-span-3">
                            <InputField label="Nuevo RUC" name="ruc" value={newRuc} onChange={e => setNewRuc(e.target.value.replace(/\D/g, ''))} placeholder="17..." />
                        </div>
                        <div className="xl:col-span-3">
                            <InputField label="Contraseña" name="pass" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <div className="xl:col-span-1">
                            <button onClick={handleAddManual} className="w-full h-[48px] bg-brand-blue text-white rounded-xl hover:bg-slate-950 transition-all flex justify-center items-center shadow-lg">
                                <AddIcon className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>

                    {/* Tabla de Resultados */}
                    <div className="rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-inner">
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-5 text-left">Identificación / RUC</th>
                                        <th className="px-8 py-5 text-left">Clave del Portal</th>
                                        <th className="px-8 py-5 text-left">Origen / Cliente</th>
                                        <th className="px-8 py-5 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {filteredCredentials.length > 0 ? filteredCredentials.map(c => (
                                        <tr key={c.ruc} className="hover:bg-blue-50/50 dark:hover:bg-white/5 transition-all group">
                                            <td className="px-8 py-5 font-mono text-sm font-bold text-slate-900 dark:text-white">{c.ruc}</td>
                                            <td className="px-8 py-5 font-mono text-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-brand-blue dark:text-blue-300">••••••••</span>
                                                    <button 
                                                        onClick={() => copyToClipboard(c.password || '', c.ruc)}
                                                        className={`p-2 rounded-lg transition-all ${copiedRuc === c.ruc ? 'bg-green-500 text-white' : 'text-slate-300 hover:text-brand-blue hover:bg-white dark:hover:bg-slate-700 shadow-sm opacity-0 group-hover:opacity-100'}`}
                                                    >
                                                        {copiedRuc === c.ruc ? <CheckCircleIcon className="w-4 h-4"/> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight line-clamp-1">{c.origen || 'Carga Manual'}</span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button onClick={() => handleDeleteKey(c.ruc)} className="p-3 text-slate-200 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="p-20 text-center">
                                                <div className="opacity-20 flex flex-col items-center">
                                                    <KeyIcon className="w-20 h-20 mb-4" />
                                                    <p className="font-black uppercase tracking-widest">Sin coincidencias en la bóveda</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Configuración General Sigue Igual */}
            <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border border-slate-100">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3 mb-6">
                        <GlobeAltIcon className="w-6 h-6 text-brand-blue" /> Cloud API Endpoint
                    </h2>
                    <InputField 
                        label="URL del Google Script (API)" 
                        name="googleScriptUrl" 
                        value={config.googleScriptUrl} 
                        onChange={handleChange} 
                        placeholder="https://script.google.com/macros/s/.../exec"
                    />
                </div>

                <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <ShieldCheckIcon className="w-6 h-6 text-brand-blue" /> Datos del Taller
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Nombre Comercial" name="emisorNombreComercial" value={config.emisorNombreComercial} onChange={handleChange} />
                        <InputField label="RUC Empresa" name="emisorRuc" value={config.emisorRuc} onChange={handleChange} />
                    </div>
                    <div className="pt-4 border-t flex justify-between items-center">
                        {showSuccess && <span className="text-emerald-500 font-black text-[10px] animate-fade-in">✓ CONFIGURACIÓN ACTUALIZADA</span>}
                        <button type="submit" className="px-10 py-4 bg-brand-red text-white font-black rounded-2xl shadow-xl hover:bg-slate-950 transition-all uppercase tracking-widest text-[10px]">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConfiguracionPage;
