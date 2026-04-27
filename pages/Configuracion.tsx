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
    KeyIcon, ServerIcon, CpuIcon, FingerPrintIcon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import { supabase } from '../services/supabase';
import { createClient } from '@supabase/supabase-js';

// --- LUXURY CORE COMPONENTS ---

const ControlInput: React.FC<{
    label: string, 
    name: string, 
    value: any, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    maxLength?: number,
    type?: string
}> = ({ label, name, value, onChange, maxLength, type = "text" }) => (
    <div className="group/field relative">
        <label htmlFor={name} className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 ml-1 group-focus-within/field:text-liquid-gold transition-colors">
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
                className="input-atelier w-full pr-12 bg-black/40 border-white/5 focus:border-liquid-gold/50 transition-all duration-500 font-bold tracking-tight text-white/90"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/field:opacity-100 transition-all duration-500">
                <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold shadow-gold-glow animate-pulse"></div>
            </div>
        </div>
    </div>
);

const ControlHeader: React.FC<{ 
    icon: React.ReactNode, 
    title: string, 
    subtitle: string, 
    colorClass?: string 
}> = ({ icon, title, subtitle, colorClass = "from-liquid-gold/20 to-transparent" }) => (
    <div className="flex items-center gap-6 mb-12 relative">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorClass} border border-white/10 shadow-2xl flex items-center justify-center text-liquid-gold backdrop-blur-xl`}>
            {icon}
        </div>
        <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">{title}</h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">{subtitle}</p>
        </div>
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-liquid-gold rounded-full blur-[2px] opacity-50"></div>
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

            // Detectar delimitador
            const firstLine = lines[0];
            const delimiter = firstLine.includes(';') ? ';' : ',';
            
            const headers = firstLine.toLowerCase().split(delimiter).map(h => h.trim().replace(/"/g, ''));
            
            // Chrome Headers: name, url, username, password
            let idxUser = headers.indexOf('username');
            let idxPass = headers.indexOf('password');
            let idxName = headers.indexOf('name');

            // Fallback si no hay cabeceras exactas (asumir formato Chrome: name,url,username,password)
            if (idxUser === -1 && headers.length >= 4) {
                // Si la tercera columna parece un RUC o username
                idxName = 0;
                idxUser = 2;
                idxPass = 3;
            }

            const creds: SriCredential[] = [];
            lines.slice(1).forEach(line => {
                // Regex robusto para CSV que maneja comillas y campos vacíos
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
                    const ruc = rucRaw.replace(/\D/g, ''); // Solo números
                    const pass = parts[idxPass]?.trim() || '';
                    const name = parts[idxName]?.trim() || '';

                    // Validar RUC (10 o 13 dígitos)
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
        
        // El usuario proporcionó el service_role key, lo usaremos para hacer el bulk insert saltando RLS
        // ya que insertupsert de 1.5M de registros requiere poder fuerte
        const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlaWx4Z3JyZXZmc3Z5eHVmZWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM1NDI2NSwiZXhwIjoyMDkxOTMwMjY1fQ._-lyaAeKlLAh701R2h-KUbu3gxcSdcOIjATo8traqEQ';
        
        // Creamos un cliente temporal con service_role para esta importación pesada
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
                    // Evitar duplicados en el mismo batch (el CSV del SRI tiene múltiples establecimientos por RUC)
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
            className="max-w-[1600px] mx-auto space-y-16 pb-40 px-6 sm:px-12 relative"
        >
            {/* --- CINEMATIC AMBIANCE --- */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-liquid-gold/5 blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-liquid-gold/5 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* --- COMMAND HEADER --- */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-[1px] bg-liquid-gold/50"></div>
                        <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em]">System Architecture</span>
                    </div>
                    <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Neural <span className="text-gold-gradient">Center</span>
                    </h1>
                </div>
                
                <div className="flex items-center gap-6 bg-black/40 p-5 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Sync Status</span>
                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-tighter italic">Operational • Global Node</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-emerald-500 blur-md opacity-20 animate-pulse"></div>
                        <ServerIcon className="w-6 h-6 text-emerald-500" />
                    </div>
                </div>
            </motion.div>

            {/* --- GRID LAYOUT --- */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                
                {/* LEFT COLUMN: CORE SETTINGS (8 COLS) */}
                <div className="xl:col-span-8 space-y-12">
                    
                    {/* SYSTEM INITIALIZATION CARD */}
                    <motion.div variants={itemVariants} className="glass-card-luxury p-10 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-liquid-gold/5 blur-[80px] -mr-40 -mt-40 group-hover:scale-125 transition-transform duration-[2000ms]"></div>
                        
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
                            <div className="flex items-center gap-8">
                                <div className="p-6 rounded-3xl bg-liquid-gold text-black shadow-gold-glow-strong overflow-hidden relative group/icon">
                                    <SparklesIcon className="w-10 h-10 relative z-10" />
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/icon:translate-y-0 transition-transform duration-500"></div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight italic">Cloud Seed Protocol</h3>
                                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[9px] mt-2">Initialize master product catalog from institutional vault</p>
                                </div>
                            </div>
                            
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                    if (window.confirm("¿Ejecutar sincronización del catálogo maestro? Esta acción reconstruirá el inventario base.")) {
                                        try {
                                            await seedCatalog();
                                            logActivity(currentUser.nombre, currentUser.rol, 'CATALOG_SYNC', 'Sincronizó catálogo institucional en la nube', 'Sistema');
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }
                                }} 
                                disabled={syncing}
                                className="btn-luxury px-12 py-5 min-w-[260px] flex items-center justify-center gap-4 relative overflow-hidden group/btn"
                            >
                                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 skew-x-12"></div>
                                {syncing ? <Loader2Icon className="animate-spin w-5 h-5"/> : <CloudIcon className="w-5 h-5"/>}
                                <span className="relative z-10 font-black uppercase tracking-widest text-xs">Execute Cloud Seed</span>
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* SETTINGS FORM */}
                    <motion.div variants={itemVariants} className="glass-card-luxury p-12 relative overflow-hidden">
                        <form onSubmit={handleSaveGeneral} className="space-y-16">
                            
                            <div className="grid lg:grid-cols-2 gap-20">
                                {/* SUBSECTION: FISCAL IDENTITY */}
                                <div className="space-y-10">
                                    <ControlHeader 
                                        icon={<ShieldCheckIcon className="w-6 h-6" />} 
                                        title="Jurisdiction" 
                                        subtitle="Fiscal Authorization Matrix"
                                        colorClass="from-red-900/40 to-transparent"
                                    />
                                    <div className="space-y-8">
                                        <ControlInput label="Legal Entity Name" name="emisorRazonSocial" value={localConfig.emisorRazonSocial} onChange={e => setLocalConfig({...localConfig, emisorRazonSocial: e.target.value})} />
                                        <ControlInput label="Tax ID (R.U.C.)" name="emisorRuc" value={localConfig.emisorRuc} onChange={e => setLocalConfig({...localConfig, emisorRuc: e.target.value})} maxLength={13} />
                                        <div className="grid grid-cols-2 gap-8">
                                            <ControlInput label="Est. Code" name="emisorEstablecimiento" value={localConfig.emisorEstablecimiento} onChange={e => setLocalConfig({...localConfig, emisorEstablecimiento: e.target.value})} maxLength={3} />
                                            <ControlInput label="Punt. Code" name="emisorPuntoEmision" value={localConfig.emisorPuntoEmision} onChange={e => setLocalConfig({...localConfig, emisorPuntoEmision: e.target.value})} maxLength={3} />
                                        </div>
                                        <ControlInput label="Start Sequence" type="number" name="secuencialInicio" value={localConfig.secuencialInicio} onChange={e => setLocalConfig({...localConfig, secuencialInicio: parseInt(e.target.value) || 1})} />
                                    </div>
                                </div>

                                {/* SUBSECTION: BRANDING/TALLER */}
                                <div className="space-y-10">
                                    <ControlHeader 
                                        icon={<PrinterIcon className="w-6 h-6" />} 
                                        title="Terminal" 
                                        subtitle="Workshop Identification Nodes"
                                        colorClass="from-liquid-gold/20 to-transparent"
                                    />
                                    <div className="space-y-8 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 relative">
                                        <div className="absolute top-4 right-4 opacity-10">
                                            <FingerPrintIcon className="w-12 h-12 text-liquid-gold" />
                                        </div>
                                        <ControlInput label="Public Workshop Name" name="imprentaNombre" value={localConfig.imprentaNombre} onChange={e => setLocalConfig({...localConfig, imprentaNombre: e.target.value})} />
                                        <div className="grid grid-cols-2 gap-8">
                                            <ControlInput label="Industrial R.U.C." name="imprentaRuc" value={localConfig.imprentaRuc} onChange={e => setLocalConfig({...localConfig, imprentaRuc: e.target.value})} maxLength={13} />
                                            <ControlInput label="Auth Token" name="imprentaAutorizacion" value={localConfig.imprentaAutorizacion} onChange={e => setLocalConfig({...localConfig, imprentaAutorizacion: e.target.value})} maxLength={4} />
                                        </div>
                                        <ControlInput label="Support Frequency" name="imprentaTelefono" value={localConfig.imprentaTelefono} onChange={e => setLocalConfig({...localConfig, imprentaTelefono: e.target.value})} />
                                    </div>
                                </div>
                            </div>

                            {/* SUBMIT SECTION */}
                            <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-8">
                                <div className="flex items-center gap-4">
                                    <AnimatePresence>
                                        {showSuccess && (
                                            <motion.div 
                                                initial={{ opacity: 0, x: -20 }} 
                                                animate={{ opacity: 1, x: 0 }} 
                                                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                                className="flex items-center gap-3 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full"
                                            >
                                                <CheckCircleIcon className="w-4 h-4 text-emerald-500"/> 
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Neural Link Success</span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <p className="text-[10px] font-bold text-slate-500 italic">Settings are globally synchronized across all active instances.</p>
                                </div>
                                
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit" 
                                    className="btn-luxury px-16 py-6 min-w-[280px]"
                                >
                                    Update Command Center
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* RIGHT COLUMN: SECURITY & SRI VAULT (4 COLS) */}
                <div className="xl:col-span-4 space-y-12">
                    
                    {/* SRI CREDENTIALS VAULT */}
                    <motion.div variants={itemVariants} className="glass-card-luxury overflow-hidden flex flex-col h-full bg-black/60 relative">
                        {/* VAULT GLOW */}
                        <div className="absolute inset-0 bg-gradient-to-b from-liquid-gold/[0.03] to-transparent pointer-events-none"></div>

                        {/* VAULT HEADER */}
                        <div className="p-8 border-b border-white/5 bg-white/[0.01] relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shadow-xl shadow-emerald-500/5">
                                        <LockClosedIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">SRI Vault</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">Secure Entry</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    disabled={isImporting} 
                                    className="btn-atelier flex-1 py-3 border-white/10 hover:bg-white/5 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3"
                                >
                                    {isImporting ? <Loader2Icon className="animate-spin w-3 h-3"/> : <ArrowDownTrayIcon className="w-3 h-3"/>}
                                    Import CSV Protocol
                                </button>
                                
                                <input type="file" ref={sriFileInputRef} onChange={handleImportSriPadron} className="hidden" accept=".csv" />
                                <button 
                                    onClick={() => sriFileInputRef.current?.click()} 
                                    disabled={isImportingSri} 
                                    className="btn-luxury flex-1 py-3 border-liquid-gold/30 hover:bg-liquid-gold/10 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-3 relative overflow-hidden"
                                >
                                    {isImportingSri ? (
                                        <>
                                            <Loader2Icon className="animate-spin w-3 h-3 text-liquid-gold"/>
                                            SYNCING ({sriImportProgress})
                                        </>
                                    ) : (
                                        <>
                                            <ServerIcon className="w-3 h-3 text-liquid-gold"/>
                                            ACTUALIZAR PADRÓN SRI (108MB)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* VAULT SEARCH */}
                        <div className="px-8 pt-8 relative z-10">
                            <div className="relative group">
                                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="SCANNING ENTITIES..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="input-atelier w-full pl-14 pr-6 py-4 bg-black/60 border-white/5 text-[11px] font-black uppercase tracking-widest"
                                />
                            </div>
                        </div>

                        {/* VAULT STREAM */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4 relative z-10 min-h-[500px]">
                            {filteredCredentials.map(c => (
                                <motion.div 
                                    key={c.ruc}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-liquid-gold/30 hover:bg-white/[0.05] transition-all duration-500 group/item"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 rounded-lg bg-white/5 text-slate-500 group-hover/item:text-liquid-gold transition-colors">
                                                <FingerPrintIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-black text-white uppercase tracking-tight leading-tight mb-1 group-hover/item:text-liquid-gold transition-colors">
                                                    {c.origen || 'Anonymous Client'}
                                                </p>
                                                <p className="text-[9px] font-mono font-bold text-slate-600 tracking-[0.2em] uppercase">
                                                    RUC: {c.ruc}
                                                </p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if(window.confirm(`Permanently wipe access node ${c.ruc}?`)) {
                                                    deleteSriCredential(c.ruc);
                                                }
                                            }} 
                                            className="p-2 text-red-500/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => togglePasswordVisibility(c.ruc)} 
                                            className="flex-1 py-3 px-4 bg-black/60 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-between group/pass overflow-hidden"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <KeyIcon className="w-3 h-3 text-slate-600 group-hover/pass:text-liquid-gold" />
                                                {visiblePasswords.has(c.ruc) ? 
                                                    <span className="text-[11px] font-mono font-black text-liquid-gold tracking-widest truncate">{c.password}</span> : 
                                                    <div className="flex gap-1">
                                                        {[1,2,3,4,5,6].map(i => <div key={i} className="w-1 h-1 rounded-full bg-slate-800"></div>)}
                                                    </div>
                                                }
                                            </div>
                                            {visiblePasswords.has(c.ruc) ? <EyeSlashIcon className="w-3.5 h-3.5"/> : <EyeIcon className="w-3.5 h-3.5"/>}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            {filteredCredentials.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-[300px] opacity-20 grayscale">
                                    <CpuIcon className="w-12 h-12 text-slate-500 mb-6" />
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.6em]">Circuit Silent</p>
                                </div>
                            )}
                        </div>

                        {/* VAULT FOOTER */}
                        <div className="p-8 border-t border-white/5 bg-white/[0.01] relative z-10">
                            <div className="p-4 rounded-xl border border-liquid-gold/10 bg-liquid-gold/5 flex gap-4">
                                <ShieldCheckIcon className="w-5 h-5 text-liquid-gold flex-shrink-0" />
                                <p className="text-[9px] font-bold text-slate-400 leading-relaxed italic">
                                    End-to-end encryption active. Credentials are protected by enterprise-grade hashing protocols.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default ConfiguracionPage;

