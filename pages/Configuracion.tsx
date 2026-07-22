import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { User, SriCredential } from '../types';
import { 
    CheckCircleIcon, ShieldCheckIcon, TrashIcon, 
    ArrowDownTrayIcon, SearchIcon, Loader2Icon,
    EyeIcon, EyeSlashIcon, LockClosedIcon, 
    SparklesIcon, CloudIcon, PrinterIcon,
    KeyIcon, ServerIcon, CpuIcon, FingerPrintIcon,
    ActivityIcon, SettingsIcon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

// --- PRECISION LIGHT COMPONENTS ---

const ControlInput: React.FC<{
    label: string, 
    name: string, 
    value: any, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    maxLength?: number,
    type?: string
}> = ({ label, name, value, onChange, maxLength, type = "text" }) => (
    <div className="group/field relative">
        <label htmlFor={name} className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 ml-1 group-focus-within/field:text-brand-blue transition-colors">
            {label}
        </label>
        <div className="relative">
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                maxLength={maxLength}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all duration-300 font-bold tracking-tight text-slate-900 placeholder:text-slate-300"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/field:opacity-100 transition-all duration-500">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue shadow-[0_0_8px_rgba(14,165,233,0.5)] animate-pulse"></div>
            </div>
        </div>
    </div>
);

const ControlHeader: React.FC<{ 
    icon: React.ReactNode, 
    title: string, 
    subtitle: string, 
    colorClass?: string 
}> = ({ icon, title, subtitle, colorClass = "bg-brand-blue/10" }) => (
    <div className="flex items-center gap-6 mb-12 relative">
        <div className={`p-4 rounded-2xl ${colorClass} border border-slate-100 shadow-sm flex items-center justify-center text-brand-blue`}>
            {icon}
        </div>
        <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{title}</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">{subtitle}</p>
        </div>
    </div>
);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" as any }
    }
};

const DEFAULT_CONFIG = {
    emisorRazonSocial: 'IMPRENTA CÓRDOVA',
    emisorRuc: '1104212564001',
    emisorEstablecimiento: '001',
    emisorPuntoEmision: '001',
    secuencialInicio: 1,
    imprentaNombre: 'IMPRENTA CÓRDOVA',
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
    const [isImportingSri, setIsImportingSri] = useState(false);
    const [sriImportProgress, setSriImportProgress] = useState(0);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sriFileInputRef = useRef<HTMLInputElement>(null);

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
            console.error("Error saving config:", error);
        }
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length < 2) return;

            const firstLine = lines[0];
            const delimiter = firstLine.includes(';') ? ';' : ',';
            const headers = firstLine.toLowerCase().split(delimiter).map(h => h.trim().replace(/"/g, ''));
            
            let idxUser = headers.indexOf('username');
            let idxPass = headers.indexOf('password');
            let idxName = headers.indexOf('name');

            if (idxUser === -1 && headers.length >= 4) {
                idxName = 0; idxUser = 2; idxPass = 3;
            }

            const creds: SriCredential[] = [];
            lines.slice(1).forEach(line => {
                const parts: string[] = [];
                let current = "";
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') inQuotes = !inQuotes;
                    else if (char === delimiter && !inQuotes) {
                        parts.push(current);
                        current = "";
                    } else {
                        current += char;
                    }
                }
                parts.push(current);

                if (parts.length > Math.max(idxUser, idxPass)) {
                    const rucRaw = parts[idxUser]?.trim() || '';
                    const match13 = rucRaw.match(/\b\d{13}\b/);
                    const match10 = rucRaw.match(/\b\d{10}\b/);
                    const ruc = match13 ? match13[0] : (match10 ? match10[0] : rucRaw.replace(/\D/g, ''));
                    const pass = parts[idxPass]?.trim() || '';
                    const name = parts[idxName]?.trim() || '';

                    if ((ruc.length === 10 || ruc.length === 13) && pass) {
                        creds.push({ 
                            ruc, 
                            password: pass, 
                            origen: name || 'Importado CSV', 
                            updatedAt: new Date().toISOString() 
                        });
                    }
                }
            });

            if (creds.length > 0) {
                await bulkAddSriCredentials(creds);
                logActivity(currentUser.nombre, currentUser.rol, 'CREDENTIALS_IMPORT', `Importó exitosamente ${creds.length} credenciales SRI`, 'Seguridad');
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (error) { 
            console.error("Error importing CSV:", error);
        } finally { 
            setIsImporting(false); 
            e.target.value = ''; 
        }
    };

    const handleImportSriPadron = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsImportingSri(true);
        setSriImportProgress(0);
        
        const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlaWx4Z3JyZXZmc3Z5eHVmZWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM1NDI2NSwiZXhwIjoyMDkxOTMwMjY1fQ._-lyaAeKlLAh701R2h-KUbu3gxcSdcOIjATo8traqEQ';
        const supaAdmin = createClient(import.meta.env.VITE_SUPABASE_URL, SERVICE_ROLE_KEY);

        let batch: any[] = [];
        let totalProcessed = 0;
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            step: async function(row, parser) {
                parser.pause();
                const data: any = row.data;
                const ruc = data['NUMERO_RUC']?.trim();
                const razon = data['RAZON_SOCIAL']?.trim();
                if (ruc && razon) {
                    if (!batch.some(item => item.ruc === ruc)) {
                        batch.push({
                            ruc: ruc,
                            razon_social: razon,
                            estado_contribuyente: data['ESTADO_CONTRIBUYENTE']?.trim() || null,
                            tipo_persona: data['TIPO_CONTRIBUYENTE']?.trim() || null,
                            provincia: data['DESCRIPCION_PROVINCIA_EST']?.trim() || null,
                            canton: data['DESCRIPCION_CANTON_EST']?.trim() || null,
                            parroquia: data['DESCRIPCION_PARROQUIA_EST']?.trim() || null,
                            actividad_economica: data['ACTIVIDAD_ECONOMICA']?.trim() || null
                        });
                    }
                }
                totalProcessed++;
                if (batch.length >= 1000) {
                    const { error } = await supaAdmin.from('sri_padron_el_oro').upsert(batch, { onConflict: 'ruc' });
                    if(error) console.error("Error upserting SRI chunk:", error);
                    batch = [];
                    setSriImportProgress(totalProcessed);
                }
                parser.resume();
            },
            complete: async function() {
                if (batch.length > 0) {
                    await supaAdmin.from('sri_padron_el_oro').upsert(batch, { onConflict: 'ruc' });
                }
                logActivity(currentUser.nombre, currentUser.rol, 'SRI_PADRON_IMPORT', `Importó padrón SRI con ${totalProcessed} registros`, 'Sistema');
                setIsImportingSri(false);
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
                if(e.target) e.target.value = '';
            },
            error: function(error) {
                console.error("Error parsing SRI CSV:", error);
                setIsImportingSri(false);
            }
        });
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
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-[1600px] mx-auto space-y-16 pb-40 pt-6 px-6 sm:px-12 relative animate-fade-in"
        >
            {/* --- COMMAND HEADER --- */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-slate-200 pb-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-brand-blue" />
                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Centro de Mando & Parámetros</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                        Configuración del Sistema <span className="text-brand-blue font-bold">• Ajustes</span>
                    </h1>
                </div>
                
                <div className="flex items-center gap-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status del Servidor</span>
                        <span className="text-[11px] font-black text-emerald-500 uppercase tracking-tighter">OPERACIONAL • CLOUD READY</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center relative">
                        <ServerIcon className="w-6 h-6" />
                    </div>
                </div>
            </motion.div>

            {/* --- GRID LAYOUT --- */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                
                {/* LEFT COLUMN: CORE SETTINGS (8 COLS) */}
                <div className="xl:col-span-8 space-y-12">
                    
                    {/* SYSTEM INITIALIZATION CARD */}
                    <motion.div variants={itemVariants} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                            <div className="flex items-center gap-8">
                                <div className="p-6 rounded-3xl bg-slate-50 text-brand-blue border border-slate-100 flex items-center justify-center shadow-sm">
                                    <SparklesIcon className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Catálogo Maestro</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[9px] mt-2">Sincronización de productos predeterminados</p>
                                </div>
                            </div>
                            
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                    if (window.confirm("¿Ejecutar sincronización del catálogo maestro?")) {
                                        try {
                                            await seedCatalog();
                                            logActivity(currentUser.nombre, currentUser.rol, 'CATALOG_SYNC', 'Sincronizó catálogo institucional', 'Sistema');
                                        } catch (e) { console.error(e); }
                                    }
                                }} 
                                disabled={syncing}
                                className="px-12 py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-4 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            >
                                {syncing ? <Loader2Icon className="animate-spin w-4 h-4 text-brand-blue"/> : <CloudIcon className="w-4 h-4 text-brand-blue"/>}
                                Restaurar Catálogo
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* SETTINGS FORM */}
                    <motion.div variants={itemVariants} className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm">
                        <form onSubmit={handleSaveGeneral} className="space-y-16">
                            
                            <div className="grid lg:grid-cols-2 gap-20">
                                {/* SUBSECTION: FISCAL IDENTITY */}
                                <div className="space-y-10">
                                    <ControlHeader 
                                        icon={<ShieldCheckIcon className="w-6 h-6" />} 
                                        title="Identidad Fiscal" 
                                        subtitle="DATOS LEGALES DEL EMISOR"
                                        colorClass="bg-brand-blue/5"
                                    />
                                    <div className="space-y-8">
                                        <ControlInput label="Razón Social" name="emisorRazonSocial" value={localConfig.emisorRazonSocial} onChange={e => setLocalConfig({...localConfig, emisorRazonSocial: e.target.value})} />
                                        <ControlInput label="RUC Emisor" name="emisorRuc" value={localConfig.emisorRuc} onChange={e => setLocalConfig({...localConfig, emisorRuc: e.target.value})} maxLength={13} />
                                        <div className="grid grid-cols-2 gap-8">
                                            <ControlInput label="Establecimiento" name="emisorEstablecimiento" value={localConfig.emisorEstablecimiento} onChange={e => setLocalConfig({...localConfig, emisorEstablecimiento: e.target.value})} maxLength={3} />
                                            <ControlInput label="Punto Emisión" name="emisorPuntoEmision" value={localConfig.emisorPuntoEmision} onChange={e => setLocalConfig({...localConfig, emisorPuntoEmision: e.target.value})} maxLength={3} />
                                        </div>
                                        <ControlInput label="Secuencial Inicio" type="number" name="secuencialInicio" value={localConfig.secuencialInicio} onChange={e => setLocalConfig({...localConfig, secuencialInicio: parseInt(e.target.value) || 1})} />
                                    </div>
                                </div>

                                {/* SUBSECTION: BRANDING/TALLER */}
                                <div className="space-y-10">
                                    <ControlHeader 
                                        icon={<PrinterIcon className="w-6 h-6" />} 
                                        title="Perfil de Imprenta" 
                                        subtitle="IDENTIFICACIÓN DE TALLER"
                                        colorClass="bg-emerald-50 text-emerald-500"
                                    />
                                    <div className="space-y-8 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
                                        <ControlInput label="Nombre Comercial" name="imprentaNombre" value={localConfig.imprentaNombre} onChange={e => setLocalConfig({...localConfig, imprentaNombre: e.target.value})} />
                                        <div className="grid grid-cols-2 gap-8">
                                            <ControlInput label="RUC Taller" name="imprentaRuc" value={localConfig.imprentaRuc} onChange={e => setLocalConfig({...localConfig, imprentaRuc: e.target.value})} maxLength={13} />
                                            <ControlInput label="Autorización" name="imprentaAutorizacion" value={localConfig.imprentaAutorizacion} onChange={e => setLocalConfig({...localConfig, imprentaAutorizacion: e.target.value})} maxLength={4} />
                                        </div>
                                        <ControlInput label="Teléfono de Contacto" name="imprentaTelefono" value={localConfig.imprentaTelefono} onChange={e => setLocalConfig({...localConfig, imprentaTelefono: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* SUBMIT SECTION */}
                            <div className="pt-12 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-8">
                                <div className="flex items-center gap-4">
                                    <AnimatePresence>
                                        {showSuccess && (
                                            <motion.div 
                                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} 
                                                exit={{ opacity: 0 }}
                                                className="flex items-center gap-3 px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100"
                                            >
                                                <CheckCircleIcon className="w-4 h-4"/> 
                                                <span className="text-[10px] font-black uppercase tracking-widest">Sincronizado</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Consola de Administración de Parámetros Globales</p>
                                </div>
                                
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit" 
                                    className="px-16 py-6 bg-brand-blue text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all"
                                >
                                    Guardar Cambios
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* RIGHT COLUMN: SECURITY & SRI VAULT (4 COLS) */}
                <div className="xl:col-span-4 space-y-12">
                    
                    {/* SRI CREDENTIALS VAULT */}
                    <motion.div variants={itemVariants} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                        
                        {/* VAULT HEADER */}
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-brand-blue shadow-sm">
                                        <LockClosedIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Bóveda SRI</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CIFRADO ACTIVO</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mb-4">
                                <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    disabled={isImporting} 
                                    className="w-full py-4 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
                                >
                                    {isImporting ? <Loader2Icon className="animate-spin w-4 h-4 text-brand-blue"/> : <ArrowDownTrayIcon className="w-4 h-4 text-brand-blue"/>}
                                    Importar Claves (Chrome)
                                </button>
                                
                                <input type="file" ref={sriFileInputRef} onChange={handleImportSriPadron} className="hidden" accept=".csv" />
                                <button 
                                    onClick={() => sriFileInputRef.current?.click()} 
                                    disabled={isImportingSri} 
                                    className="w-full py-4 bg-brand-blue text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-brand-blue/10 active:scale-95 transition-all"
                                >
                                    {isImportingSri ? (
                                        <>
                                            <Loader2Icon className="animate-spin w-4 h-4"/>
                                            Procesando ({sriImportProgress})
                                        </>
                                    ) : (
                                        <>
                                            <ServerIcon className="w-4 h-4"/>
                                            Actualizar Padrón (108MB)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* VAULT SEARCH */}
                        <div className="px-8 pt-6">
                            <div className="relative group">
                                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="BUSCAR RUC O CLIENTE..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* VAULT STREAM */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4 min-h-[400px]">
                            {filteredCredentials.map(c => (
                                <motion.div 
                                    key={c.ruc} layout
                                    className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-blue/30 hover:bg-white hover:shadow-lg transition-all duration-300 group/item"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 rounded-lg bg-white border border-slate-100 text-slate-400 group-hover/item:text-brand-blue">
                                                <FingerPrintIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight leading-tight mb-1">
                                                    {c.origen || 'Cliente Anónimo'}
                                                </p>
                                                <p className="text-[9px] font-mono font-bold text-slate-400 tracking-widest">
                                                    {c.ruc}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { if(window.confirm(`¿Eliminar nodo ${c.ruc}?`)) deleteSriCredential(c.ruc); }} 
                                            className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                                        >
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                    
                                    <button 
                                        onClick={() => togglePasswordVisibility(c.ruc)} 
                                        className="w-full py-3 px-4 bg-white border border-slate-100 rounded-xl text-slate-600 flex items-center justify-between group/pass"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <KeyIcon className="w-3 h-3 text-slate-300 group-hover/pass:text-brand-blue" />
                                            {visiblePasswords.has(c.ruc) ? 
                                                <span className="text-[11px] font-mono font-black text-brand-blue tracking-widest truncate">{c.password}</span> : 
                                                <div className="flex gap-1">
                                                    {[1,2,3,4,5,6].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>)}
                                                </div>
                                            }
                                        </div>
                                        {visiblePasswords.has(c.ruc) ? <EyeSlashIcon className="w-4 h-4 text-slate-300"/> : <EyeIcon className="w-4 h-4 text-slate-300"/>}
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        {/* VAULT FOOTER */}
                        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                            <div className="p-5 rounded-2xl border border-brand-blue/10 bg-brand-blue/5 flex gap-4 items-center">
                                <ShieldCheckIcon className="w-5 h-5 text-brand-blue flex-shrink-0" />
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                    AES-256 ENCRYPTION ENABLED
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
            `}</style>
        </motion.div>
    );
};

export default ConfiguracionPage;
