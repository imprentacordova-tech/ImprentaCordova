
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getConfig, saveConfig, NotaDeVentaConfig } from '../services/configService';
import { getSriCredentials, addSriCredential, bulkAddSriCredentials, deleteSriCredential, seed50Products, hydrateFromCloud, forcePushAllToCloud, testCloudConnection } from '../services/mockApi';
import { 
    Cog8ToothIcon, CheckCircleIcon, ShieldCheckIcon, AddIcon, TrashIcon, 
    ArrowDownTrayIcon, KeyIcon, SearchIcon, Loader2Icon, GlobeAltIcon, 
    Copy, EyeIcon, EyeSlashIcon, LockClosedIcon, DocumentDuplicateIcon,
    DollarIcon, WrenchScrewdriverIcon, SparklesIcon, BoxIcon, ExclamationTriangleIcon,
    ArrowUpIcon, CloudIcon, CheckIcon
} from '../components/Icons';
import { SriCredential } from '../types';

const InputField: React.FC<{label: string, name: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, [key: string]: any}> = ({ label, name, value, onChange, ...props }) => (
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
    const [isSeeding, setIsSeeding] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [cloudStatus, setCloudStatus] = useState<'IDLE' | 'SYNCING' | 'ERROR' | 'CONNECTED'>('IDLE');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getSriCredentials().then(setSriCredentials);
        if (config.googleScriptUrl.includes('macros')) setCloudStatus('CONNECTED');
    }, []);

    const handleSaveGeneral = (e: React.FormEvent) => {
        e.preventDefault();
        saveConfig(config);
        setShowSuccess(true);
        if (config.googleScriptUrl.includes('macros')) setCloudStatus('CONNECTED');
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleTestConn = async () => {
        // Forzamos guardado primero para usar la URL actual del input
        saveConfig(config);
        setIsTesting(true);
        const result = await testCloudConnection(config.googleScriptUrl);
        setIsTesting(false);
        
        if (result.success) {
            alert(result.message);
            setCloudStatus('CONNECTED');
        } else {
            alert("❌ FALLO DE CONEXIÓN:\n\n" + result.message);
            setCloudStatus('ERROR');
        }
    };

    const handleSyncNow = async () => {
        setCloudStatus('SYNCING');
        const success = await hydrateFromCloud();
        setCloudStatus(success ? 'CONNECTED' : 'ERROR');
        if (success) {
            alert("✅ ¡Sincronización Exitosa! Los datos se han descargado de la nube.");
            window.location.reload();
        } else {
            alert("❌ ERROR DE DESCARGA.\n\nVerifica que tu script de Google tenga permisos 'Anyone' y que hayas usado el botón 'Probar Conexión' para diagnosticar.");
        }
    };

    const handlePushAll = async () => {
        if (!window.confirm("¿Deseas subir todos los datos locales a Google Sheets ahora mismo?")) return;
        setIsPushing(true);
        await forcePushAllToCloud();
        setIsPushing(false);
        alert("✅ Respaldo enviado a la nube correctamente.");
    };

    const handleSeed = async () => {
        if (!window.confirm("Esto inyectará 50 productos reales de imprenta. ¿Continuar?")) return;
        setIsSeeding(true);
        await seed50Products();
        setIsSeeding(false);
        alert("✅ 50 Productos inyectados localmente.\n\nUsa 'Subir a Nube' para respaldarlos.");
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
                alert(`Importación exitosa: ${creds.length} claves.`);
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

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-32 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="bg-brand-blue p-5 rounded-[2.5rem] text-white shadow-2xl">
                        <Cog8ToothIcon className="h-10 w-10"/>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Centro de <span className="text-brand-red">Control</span></h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 opacity-60">Sincronización Maestra Pedro Córdova</p>
                    </div>
                </div>
            </div>

            {/* PANEL DE NUBE DIAGNÓSTICO */}
            <div className="bg-slate-900 rounded-[3rem] p-10 shadow-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex items-center gap-8">
                        <div className={`p-6 rounded-[2rem] shadow-2xl ${cloudStatus === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400' : cloudStatus === 'ERROR' ? 'bg-rose-500/20 text-rose-400' : 'bg-brand-blue/20 text-brand-blue'}`}>
                            <GlobeAltIcon className={`w-12 h-12 ${cloudStatus === 'SYNCING' ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Cerebro Online</h3>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${cloudStatus === 'CONNECTED' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                    {cloudStatus === 'CONNECTED' ? 'Enlace Activo' : cloudStatus === 'SYNCING' ? 'Sincronizando...' : 'Error de Enlace'}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm max-w-md">Utiliza **Probar Conexión** para diagnosticar bloqueos del navegador o falta de permisos en Google Sheets.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <button onClick={handleTestConn} disabled={isTesting} className="px-6 py-4 bg-brand-blue text-white font-black rounded-xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]">
                            {isTesting ? <Loader2Icon className="animate-spin w-4 h-4"/> : <ShieldCheckIcon className="w-4 h-4"/>}
                            Probar Conexión
                        </button>
                        <button onClick={handlePushAll} disabled={isPushing} className="px-6 py-4 bg-emerald-500 text-white font-black rounded-xl shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]">
                            {isPushing ? <Loader2Icon className="animate-spin w-4 h-4"/> : <ArrowUpIcon className="w-4 h-4"/>}
                            Subir a Nube
                        </button>
                        <button onClick={handleSyncNow} disabled={cloudStatus === 'SYNCING'} className="px-6 py-4 bg-white text-slate-900 font-black rounded-xl shadow-xl hover:bg-brand-blue hover:text-white transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px]">
                            {cloudStatus === 'SYNCING' ? <Loader2Icon className="animate-spin w-4 h-4"/> : <ArrowDownTrayIcon className="w-4 h-4"/>}
                            Descargar
                        </button>
                    </div>
                </div>
            </div>

            {/* Bóveda SRI */}
            <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="p-10 flex flex-col lg:flex-row justify-between items-center gap-8 border-b dark:border-white/5 relative">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="bg-emerald-500 p-4 rounded-3xl shadow-lg shadow-emerald-900/40 text-white">
                            <LockClosedIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Bóveda Maestra SRI</h2>
                            <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">
                                {sriCredentials.length} CONTRIBUYENTES PROTEGIDOS EN LA NUBE
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-4 relative z-10">
                        <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
                        <button onClick={() => fileInputRef.current?.click()} className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-brand-red hover:text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-sm">
                            {isImporting ? <Loader2Icon className="animate-spin w-5 h-5" /> : <ArrowDownTrayIcon className="w-5 h-5" />} 
                            Importar Claves CSV
                        </button>
                    </div>
                </div>

                <div className="p-10">
                    <div className="relative group mb-8">
                        <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                        <input type="text" placeholder="BUSCAR POR RUC O NOMBRE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white focus:ring-4 focus:ring-brand-blue/10 transition-all outline-none" />
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar rounded-2xl border border-slate-100 dark:border-white/10">
                         <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-20 border-b dark:border-white/10">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                    <th className="px-8 py-4">RUC / Contribuyente</th>
                                    <th className="px-8 py-4">Clave</th>
                                    <th className="px-8 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-white/5">
                                {filteredCredentials.map(c => (
                                    <tr key={c.ruc} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all">
                                        <td className="px-8 py-4">
                                            <p className="text-slate-900 dark:text-white font-black uppercase text-sm truncate">{c.origen || 'SRI Client'}</p>
                                            <p className="text-xs font-mono font-bold text-slate-500">{c.ruc}</p>
                                        </td>
                                        <td className="px-8 py-4">
                                            <button onClick={() => togglePasswordVisibility(c.ruc)} className="text-slate-400 hover:text-brand-blue flex items-center gap-2">
                                                {visiblePasswords.has(c.ruc) ? <span className="text-emerald-500 font-mono font-bold">{c.password}</span> : '••••••••'}
                                                {visiblePasswords.has(c.ruc) ? <EyeSlashIcon className="w-4 h-4"/> : <EyeIcon className="w-4 h-4"/>}
                                            </button>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <button onClick={() => deleteSriCredential(c.ruc).then(getSriCredentials).then(setSriCredentials)} className="text-slate-400 hover:text-rose-500 transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Configuración de Negocio */}
            <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5 space-y-10">
                
                <div className="grid lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                            <div className="p-2 bg-brand-red rounded-xl text-white shadow-lg"><ShieldCheckIcon className="w-6 h-6" /></div>
                            Parámetros SRI
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Establecimiento" name="emisorEstablecimiento" value={config.emisorEstablecimiento} onChange={e => setConfig({...config, emisorEstablecimiento: e.target.value})} maxLength={3} />
                            <InputField label="Punto de Emisión" name="emisorPuntoEmision" value={config.emisorPuntoEmision} onChange={e => setConfig({...config, emisorPuntoEmision: e.target.value})} maxLength={3} />
                        </div>
                        <InputField label="Próximo Secuencial" type="number" name="secuencialInicio" value={config.secuencialInicio} onChange={e => setConfig({...config, secuencialInicio: parseInt(e.target.value) || 1})} />
                        
                        <div className="space-y-2">
                             <InputField label="URL Google Apps Script (Sincronización Nube)" name="googleScriptUrl" value={config.googleScriptUrl} onChange={e => setConfig({...config, googleScriptUrl: e.target.value})} />
                             <p className="text-[9px] font-black text-slate-400 uppercase mt-2">Asegúrate de que la URL termine en <b>/exec</b></p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                            <div className="p-2 bg-brand-blue rounded-xl text-white shadow-lg"><DollarIcon className="w-6 h-6" /></div>
                            Servicios Adicionales
                        </h2>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                            <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Recargo por Perforación (Talonarios)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-blue-400">$</span>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={config.costoPerforado} 
                                    onChange={e => setConfig({...config, costoPerforado: parseFloat(e.target.value)})}
                                    className="w-full pl-10 pr-4 py-4 bg-white dark:bg-gray-700 border-none rounded-2xl shadow-inner font-black text-xl text-brand-blue outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t dark:border-gray-700 flex justify-between items-center">
                    {showSuccess && <span className="text-emerald-500 font-black text-[11px] animate-fade-in tracking-widest uppercase">✓ Configuración Guardada</span>}
                    <button type="submit" className="px-12 py-5 bg-brand-blue text-white font-black rounded-2xl shadow-xl hover:bg-slate-950 transition-all uppercase tracking-widest text-xs">Guardar Cambios Maestros</button>
                </div>
            </form>
        </div>
    );
};

export default ConfiguracionPage;
