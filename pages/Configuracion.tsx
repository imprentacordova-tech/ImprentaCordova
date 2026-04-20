
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { User } from '../types';
import { 
    Cog8ToothIcon, CheckCircleIcon, ShieldCheckIcon, AddIcon, TrashIcon, 
    ArrowDownTrayIcon, KeyIcon, SearchIcon, Loader2Icon, GlobeAltIcon, 
    Copy, EyeIcon, EyeSlashIcon, LockClosedIcon, DocumentDuplicateIcon,
    DollarIcon, WrenchScrewdriverIcon, SparklesIcon, BoxIcon, ExclamationTriangleIcon,
    ArrowUpIcon, CloudIcon, CheckIcon, PrinterIcon, PhoneIcon
} from '../components/Icons';
import { SriCredential } from '../types';

const InputField: React.FC<{label: string, name: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, [key: string]: any}> = ({ label, name, value, onChange, ...props }) => (
    <div className="group/field">
        <label htmlFor={name} className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within/field:text-brand-blue transition-colors">{label}</label>
        <input
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl text-sm font-black text-white outline-none focus:ring-1 focus:ring-brand-blue/30 transition-all placeholder:text-slate-800 shadow-inner"
            {...props}
        />
    </div>
);

const DEFAULT_CONFIG = {
    emisorRazonSocial: 'IMPRENTA CORDOVA',
    emisorRuc: '1104212564001',
    emisorEstablecimiento: '001',
    emisorPuntoEmision: '001',
    secuencialInicio: 1,
    imprentaNombre: 'IMPRENTA CORDOVA',
    imprentaRuc: '1104212564001',
    imprentaAutorizacion: '1111',
    imprentaTelefono: '0987654321',
    googleScriptUrl: ''
};

const ConfiguracionPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { 
        config: cloudConfig, updateConfig, 
        sriCredentials, deleteSriCredential, bulkAddSriCredentials, 
        seedCatalog, syncing 
    } = useData();
    
    const [localConfig, setLocalConfig] = useState<any>(cloudConfig || DEFAULT_CONFIG);
    const [showSuccess, setShowSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync local state when cloud config arrives
    useEffect(() => {
        if (cloudConfig) setLocalConfig(cloudConfig);
    }, [cloudConfig]);

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateConfig(localConfig);
            logActivity(currentUser.nombre, currentUser.rol, 'CONFIG_ACTUALIZADA', 'Actualizó la configuración general del sistema en Supabase', 'Sistema');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            alert("Error al guardar en la nube.");
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
                await bulkAddSriCredentials(creds);
                alert(`Importación exitosa: ${creds.length} claves registradas en Supabase.`);
            }
        } catch (error) { alert("Error al procesar CSV."); } finally { setIsImporting(false); e.target.value = ''; }
    };

    const togglePasswordVisibility = (ruc: string) => {
        setVisiblePasswords(prev => {
            const next = new Set(prev);
            if (next.has(ruc)) next.delete(ruc);
            else next.add(ruc);
            return next;
        });
    };

    const filteredCredentials = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return (sriCredentials || []).filter(c => 
            c.ruc.includes(searchTerm) || 
            (c.origen || '').toLowerCase().includes(lower)
        ).slice(0, 50);
    }, [sriCredentials, searchTerm]);

    return (
        <div className="space-y-16 max-w-7xl mx-auto pb-40 animate-fade-in">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <div className="bg-white text-black p-6 rounded-[2rem] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                        <Cog8ToothIcon className="h-10 w-10"/>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                            Centro de <span className="text-slate-500">Control</span>
                        </h1>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Configuración Cloud • Imprenta Córdova v5.0</p>
                    </div>
                </div>
            </div>

            {/* GESTIÓN DE CATÁLOGO */}
            <div className="bg-white/5 rounded-[3rem] p-12 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-[100px] -ml-40 -mt-40 transition-transform group-hover:scale-110 duration-1000"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div className="flex items-center gap-10">
                        <div className="p-8 rounded-[2.5rem] bg-brand-gold text-black shadow-2xl transition-all duration-500">
                            <SparklesIcon className="w-14 h-14" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <h3 className="text-3xl font-black text-white uppercase tracking-tight">Catálogo Industrial</h3>
                                <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-brand-gold/10 text-brand-gold border border-brand-gold/20 shadow-lg">
                                    Supabase Master
                                </span>
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincroniza el catálogo institucional de servicios y productos en la nube</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <button 
                            onClick={async () => {
                                if (window.confirm("¿Deseas cargar el catálogo institucional de 100+ productos a Supabase?")) {
                                    try {
                                        await seedCatalog();
                                        logActivity(currentUser.nombre, currentUser.rol, 'CONFIG_ACTUALIZADA', 'Sincronizó catálogo institucional en la nube', 'Sistema');
                                        alert("✅ Catálogo Maestro Sincronizado Correctamente.");
                                    } catch (e) {
                                        alert("❌ Error al conectar con Supabase.");
                                    }
                                }
                            }} 
                            disabled={syncing} 
                            className="px-12 py-6 bg-brand-gold text-black font-black rounded-2xl shadow-[0_0_30px_rgba(255,191,0,0.3)] hover:bg-brand-gold/90 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-[10px]"
                        >
                            {syncing ? <Loader2Icon className="animate-spin w-5 h-5"/> : <CloudIcon className="w-5 h-5"/>}
                            Sincronizar 100+ Productos
                        </button>
                    </div>
                </div>
            </div>

            {/* Configuración de Negocio */}
            <form onSubmit={handleSaveGeneral} className="bg-white/5 p-16 rounded-[3.5rem] border border-white/10 space-y-16 backdrop-blur-xl">
                <div className="grid lg:grid-cols-2 gap-24">
                    {/* LADO IZQUIERDO: SRI EMISOR */}
                    <div className="space-y-10">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-6 border-b border-white/5 pb-8">
                            <div className="p-4 bg-rose-600 rounded-2xl text-white shadow-xl"><ShieldCheckIcon className="w-8 h-8" /></div>
                            Emisor Autorizado
                        </h2>
                        <InputField label="Razón Social Fiscal" name="emisorRazonSocial" value={localConfig.emisorRazonSocial} onChange={e => setLocalConfig({...localConfig, emisorRazonSocial: e.target.value})} />
                        <InputField label="Identificación R.U.C." name="emisorRuc" value={localConfig.emisorRuc} onChange={e => setLocalConfig({...localConfig, emisorRuc: e.target.value})} maxLength={13} />
                        <div className="grid grid-cols-2 gap-6">
                            <InputField label="Cód. Establecimiento" name="emisorEstablecimiento" value={localConfig.emisorEstablecimiento} onChange={e => setLocalConfig({...localConfig, emisorEstablecimiento: e.target.value})} maxLength={3} />
                            <InputField label="Pto. Emisión" name="emisorPuntoEmision" value={localConfig.emisorPuntoEmision} onChange={e => setLocalConfig({...localConfig, emisorPuntoEmision: e.target.value})} maxLength={3} />
                        </div>
                        <InputField label="Folio Maestro Global" type="number" name="secuencialInicio" value={localConfig.secuencialInicio} onChange={e => setLocalConfig({...localConfig, secuencialInicio: parseInt(e.target.value) || 1})} />
                    </div>

                    {/* LADO DERECHO: DATOS DE FABRICACIÓN (PIE DE IMPRENTA) */}
                    <div className="space-y-10">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-6 border-b border-white/5 pb-8">
                            <div className="p-4 bg-brand-blue rounded-2xl text-white shadow-xl"><PrinterIcon className="w-8 h-8" /></div>
                            Sello de Fabricación
                        </h2>
                        <div className="bg-black/40 p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-inner">
                            <InputField label="Fábrica Autorizada" name="imprentaNombre" value={localConfig.imprentaNombre} onChange={e => setLocalConfig({...localConfig, imprentaNombre: e.target.value})} />
                            <div className="grid grid-cols-2 gap-6">
                                <InputField label="R.U.C. Industrial" name="imprentaRuc" value={localConfig.imprentaRuc} onChange={e => setLocalConfig({...localConfig, imprentaRuc: e.target.value})} maxLength={13} />
                                <InputField label="Nº Autorización" name="imprentaAutorizacion" value={localConfig.imprentaAutorizacion} onChange={e => setLocalConfig({...localConfig, imprentaAutorizacion: e.target.value})} maxLength={4} />
                            </div>
                            <InputField label="Línea Directa de Contacto" name="imprentaTelefono" value={localConfig.imprentaTelefono} onChange={e => setLocalConfig({...localConfig, imprentaTelefono: e.target.value})} />
                        </div>
                        
                        <div className="p-8 bg-brand-blue/5 border border-brand-blue/10 rounded-[2rem]">
                             <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <CloudIcon className="w-4 h-4"/> Estado Perpetuo
                             </p>
                             <p className="text-xs font-bold text-slate-400">Los cambios se sincronizan en tiempo real con Supabase Cloud y afectan a todos los terminales.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex justify-between items-center">
                    <div className="min-h-[20px]">
                        {showSuccess && <span className="text-emerald-500 font-black text-[12px] animate-fade-in tracking-[0.2em] uppercase flex items-center gap-3"><CheckCircleIcon className="w-5 h-5 shadow-sm"/> Bóveda Cloud Sincronizada</span>}
                    </div>
                    <button type="submit" className="group relative px-16 py-6 bg-brand-blue text-white font-black rounded-2xl shadow-3xl hover:bg-slate-900 transition-all uppercase tracking-[0.3em] text-[10px] overflow-hidden">
                        <span className="relative z-10">Guardar en la Nube</span>
                    </button>
                </div>
            </form>

            {/* Bóveda SRI */}
            <div className="bg-white/5 rounded-[4rem] border border-white/10 overflow-hidden backdrop-blur-3xl">
                <div className="p-16 flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 relative bg-white/[0.02]">
                    <div className="flex items-center gap-10 relative z-10">
                        <div className="bg-emerald-500 text-black p-6 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                            <LockClosedIcon className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Bóveda Maestra <span className="text-slate-500">SRI</span></h2>
                            <span className="inline-block mt-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-lg animate-pulse">
                                {(sriCredentials || []).length} CLIENTES PROTEGIDOS
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                         <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
                         <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all flex items-center gap-4 uppercase tracking-[0.2em] text-[10px]">
                            {isImporting ? <Loader2Icon className="animate-spin w-4 h-4"/> : <ArrowDownTrayIcon className="w-4 h-4"/>}
                            Importar Claves CSV
                         </button>
                    </div>
                </div>
                <div className="p-16">
                    <div className="relative group mb-12">
                        <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                            <SearchIcon className="w-7 h-7 text-slate-600 group-focus-within:text-brand-blue transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="BUSCAR RUC O CONTRIBUYENTE..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full pl-24 pr-12 py-8 bg-black/40 border border-white/5 rounded-[2.5rem] text-xl font-black uppercase tracking-tight text-white placeholder:text-slate-800 focus:ring-1 focus:ring-brand-blue/30 transition-all outline-none shadow-inner"
                        />
                    </div>

                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar rounded-[2.5rem] border border-white/5 bg-black/20">
                         <table className="w-full text-left border-collapse overflow-hidden">
                            <thead className="bg-white/[0.03] sticky top-0 z-20 border-b border-white/10">
                                <tr className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">
                                    <th className="px-12 py-8 font-black">Contribuyente</th>
                                    <th className="px-12 py-8 font-black">Token Acceso</th>
                                    <th className="px-12 py-8 text-right font-black">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredCredentials.map(c => (
                                    <tr key={c.ruc} className="group/row hover:bg-white/[0.04] transition-all">
                                        <td className="px-12 py-10">
                                            <p className="text-white font-black uppercase text-lg tracking-tight mb-2 group-hover/row:text-brand-blue transition-colors">{c.origen || 'Cliente SRI'}</p>
                                            <p className="text-[11px] font-mono font-bold text-slate-500 tracking-widest flex items-center gap-3">
                                                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                                                RUC {c.ruc}
                                            </p>
                                        </td>
                                        <td className="px-12 py-10">
                                            <button 
                                                onClick={() => togglePasswordVisibility(c.ruc)} 
                                                className="px-8 py-4 bg-black/20 border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:border-white/10 transition-all flex items-center gap-6 shadow-inner group/pass"
                                            >
                                                {visiblePasswords.has(c.ruc) ? 
                                                    <span className="text-emerald-500 font-mono font-black text-lg tracking-widest">{c.password}</span> : 
                                                    <span className="text-slate-700 font-mono font-black text-lg tracking-widest uppercase">Encriptado</span>
                                                }
                                                {visiblePasswords.has(c.ruc) ? <EyeSlashIcon className="w-5 h-5 group-hover/pass:scale-110 transition-transform"/> : <EyeIcon className="w-5 h-5 group-hover/pass:scale-110 transition-transform"/>}
                                            </button>
                                        </td>
                                        <td className="px-12 py-10 text-right">
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm(`¿Seguro que deseas eliminar el acceso para ${c.ruc}?`)) {
                                                        deleteSriCredential(c.ruc);
                                                    }
                                                }} 
                                                className="p-4 bg-rose-500/5 text-rose-500/20 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-lg"
                                            >
                                                <TrashIcon className="w-6 h-6"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredCredentials.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-12 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 opacity-20">
                                                <ShieldCheckIcon className="w-20 h-20 text-slate-500" />
                                                <p className="text-sm font-black text-slate-500 uppercase tracking-[0.5em]">Bóveda Vacía</p>
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
    );
};

export default ConfiguracionPage;
