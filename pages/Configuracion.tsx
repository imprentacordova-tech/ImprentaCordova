
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getConfig, saveConfig, NotaDeVentaConfig } from '../services/configService';
import { getSriCredentials, addSriCredential, bulkAddSriCredentials, deleteSriCredential } from '../services/mockApi';
import { 
    Cog8ToothIcon, CheckCircleIcon, ShieldCheckIcon, AddIcon, TrashIcon, 
    ArrowDownTrayIcon, KeyIcon, SearchIcon, Loader2Icon, GlobeAltIcon, 
    Copy, EyeIcon, EyeSlashIcon, LockClosedIcon, DocumentDuplicateIcon 
} from '../components/Icons';
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
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getSriCredentials().then(setSriCredentials);
    }, []);

    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault();
        saveConfig(config);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const togglePasswordVisibility = (ruc: string) => {
        setVisiblePasswords(prev => {
            const next = new Set(prev);
            if (next.has(ruc)) next.delete(ruc);
            else next.add(ruc);
            return next;
        });
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/);
            const headers = lines[0].toLowerCase().split(',');
            const idxUser = headers.indexOf('username');
            const idxPass = headers.indexOf('password');
            const idxName = headers.indexOf('name');

            const creds: SriCredential[] = [];
            lines.slice(1).forEach(line => {
                const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (parts && parts.length >= 4) {
                    const rucRaw = parts[idxUser]?.replace(/"/g, '') || '';
                    const ruc = rucRaw.replace(/\D/g, '');
                    const pass = parts[idxPass]?.replace(/"/g, '') || '';
                    const name = parts[idxName]?.replace(/"/g, '') || '';
                    if (ruc.length >= 10 && pass) {
                        creds.push({ ruc, password: pass, origen: name, updatedAt: new Date().toISOString() });
                    }
                }
            });

            if (creds.length > 0) {
                const updated = await bulkAddSriCredentials(creds);
                setSriCredentials(updated);
                alert(`Importación exitosa: ${creds.length} claves sincronizadas.`);
            }
        } catch (error) { alert("Error al procesar CSV."); } finally { setIsImporting(false); e.target.value = ''; }
    };

    const filteredCredentials = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return sriCredentials.filter(c => 
            c.ruc.includes(searchTerm) || 
            (c.origen || '').toLowerCase().includes(lower)
        ).slice(0, 50);
    }, [sriCredentials, searchTerm]);

    const copyAndOpenSri = (val: string) => {
        navigator.clipboard.writeText(val);
        window.open('https://srienlinea.sri.gob.ec/auth/realms/Internet/protocol/openid-connect/auth?client_id=app-sri-en-linea-v2&redirect_uri=https%3A%2F%2Fsrienlinea.sri.gob.ec%2Fsri-en-linea%2F%2F%2F&response_type=code&scope=openid', '_blank');
    };

    const handleDeleteKey = async (ruc: string) => {
        if (window.confirm('¿Eliminar clave del sistema?')) {
            const updated = await deleteSriCredential(ruc);
            setSriCredentials(updated);
        }
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-32 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="bg-brand-blue p-5 rounded-[2.5rem] text-white shadow-2xl">
                        <Cog8ToothIcon className="h-10 w-10"/>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Centro de <span className="text-brand-red">Control</span></h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 opacity-60">Configuración global y bóveda de seguridad</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-950 rounded-[3.5rem] shadow-3xl border border-white/5 overflow-hidden">
                <div className="p-10 flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 relative">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="bg-emerald-500 p-4 rounded-3xl shadow-lg shadow-emerald-900/40">
                            <LockClosedIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Bóveda Maestra SRI</h2>
                            <span className="text-emerald-400 font-black uppercase text-[10px] tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">
                                {sriCredentials.length} CONTRIBUYENTES PROTEGIDOS
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 relative z-10">
                        <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
                        <button onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-950 hover:bg-brand-red hover:text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl">
                            {isImporting ? <Loader2Icon className="animate-spin w-5 h-5" /> : <ArrowDownTrayIcon className="w-5 h-5" />} 
                            Sincronizar Chrome CSV
                        </button>
                    </div>
                </div>

                <div className="p-10 space-y-8 bg-white/5 backdrop-blur-md">
                    <div className="relative group">
                        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-brand-blue transition-colors" />
                        <input 
                            type="text" 
                            placeholder="BUSCAR POR RUC O NOMBRE..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full pl-16 pr-8 py-5 bg-slate-900 border border-white/10 rounded-2xl text-lg font-black uppercase tracking-tight text-white focus:ring-4 focus:ring-brand-blue/20 transition-all outline-none" 
                        />
                    </div>

                    <div className="rounded-[2.5rem] border border-white/10 overflow-hidden bg-slate-900/50 shadow-inner">
                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-950 sticky top-0 z-20 border-b border-white/10">
                                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                        <th className="px-8 py-6">RUC / Contribuyente</th>
                                        <th className="px-8 py-6">Credencial Portal SRI</th>
                                        <th className="px-8 py-6 text-right">Acciones de Bóveda</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredCredentials.map(c => (
                                        <tr key={c.ruc} className="hover:bg-white/[0.03] transition-all group">
                                            <td className="px-8 py-5">
                                                <p className="text-white font-black uppercase tracking-tight text-sm truncate">{c.origen || 'SRI Client'}</p>
                                                <p className="text-xs font-mono font-bold text-slate-500">{c.ruc}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-grow bg-black/40 rounded-xl px-4 py-2 border border-white/5 font-mono text-sm min-w-[150px]">
                                                        {visiblePasswords.has(c.ruc) ? <span className="text-emerald-400">{c.password}</span> : <span className="text-slate-600">••••••••••••</span>}
                                                    </div>
                                                    <button onClick={() => togglePasswordVisibility(c.ruc)} className="text-slate-500 hover:text-white transition-colors">
                                                        {visiblePasswords.has(c.ruc) ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={() => copyAndOpenSri(c.password || '')} className="bg-brand-blue text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2 shadow-lg active:scale-95">
                                                        <GlobeAltIcon className="w-4 h-4"/> Portal SRI
                                                    </button>
                                                    <button onClick={() => handleDeleteKey(c.ruc)} className="p-2 text-slate-600 hover:text-brand-red transition-all"><TrashIcon className="w-5 h-5"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                        <div className="p-2 bg-brand-red rounded-xl text-white"><ShieldCheckIcon className="w-6 h-6" /></div>
                        Datos Matriz Imprenta
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Razón Social (Dueño)" name="emisorRazonSocial" value={config.emisorRazonSocial} onChange={e => setConfig({...config, emisorRazonSocial: e.target.value})} />
                        <InputField label="Nombre Comercial" name="emisorNombreComercial" value={config.emisorNombreComercial} onChange={e => setConfig({...config, emisorNombreComercial: e.target.value})} />
                        <InputField label="RUC Empresa" name="emisorRuc" value={config.emisorRuc} onChange={e => setConfig({...config, emisorRuc: e.target.value})} />
                        <InputField label="Cód. Autorización (Recibos)" name="reciboCodAuto" value={config.reciboCodAuto} onChange={e => setConfig({...config, reciboCodAuto: e.target.value})} />
                        <InputField label="Dirección Matriz" name="emisorDireccionMatriz" value={config.emisorDireccionMatriz} onChange={e => setConfig({...config, emisorDireccionMatriz: e.target.value})} />
                        <InputField label="Actividad Económica" name="emisorActividades" value={config.emisorActividades} onChange={e => setConfig({...config, emisorActividades: e.target.value})} />
                        <InputField label="Teléfono Matriz" name="emisorTelefono" value={config.emisorTelefono} onChange={e => setConfig({...config, emisorTelefono: e.target.value})} />
                        <InputField label="Email Contacto" name="emisorEmail" value={config.emisorEmail} onChange={e => setConfig({...config, emisorEmail: e.target.value})} />
                    </div>
                    <div className="pt-6 border-t flex justify-between items-center">
                        {showSuccess && <span className="text-emerald-500 font-black text-[10px] animate-fade-in tracking-widest">✓ DATOS ACTUALIZADOS</span>}
                        <button type="submit" className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-brand-blue transition-all uppercase tracking-widest text-[10px]">Guardar Matriz</button>
                    </div>
                </form>
                
                <div className="bg-gradient-to-br from-brand-blue to-brand-navy p-10 rounded-[3rem] shadow-2xl text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <GlobeAltIcon className="w-48 h-48" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4 leading-none">Cloud Backup<br/>Real-Time</h3>
                        <p className="text-blue-100/60 text-sm leading-relaxed max-w-xs font-medium">Todas tus órdenes y claves se sincronizan con la nube para acceso remoto seguro desde cualquier dispositivo.</p>
                    </div>
                    <button onClick={() => window.open(config.googleScriptUrl, '_blank')} className="w-full py-4 bg-white text-brand-blue font-black rounded-2xl shadow-xl hover:bg-slate-900 hover:text-white transition-all text-xs uppercase tracking-widest z-10">Nube Operativa</button>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionPage;
