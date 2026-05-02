import React, { useState, useEffect, useMemo } from 'react';
import { 
    logTransaction, 
    getFinancialLedger, 
    getLedgerBalance, 
    purgeOldTransactions, 
    FinancialEntry, 
    TransactionType 
} from '../services/financialLedgerService';
import { 
    BanknotesIcon, 
    ArrowTrendingUpIcon, 
    ArrowTrendingDownIcon, 
    CalendarIcon, 
    MagnifyingGlassIcon as SearchIcon, 
    ShieldCheckIcon,
    PlusIcon,
    ArrowDownTrayIcon,
    ScaleIcon,
    Loader2Icon,
    SparklesIcon,
    CloseIcon,
    LockIcon,
    FingerPrintIcon,
    ArchiveIcon,
    UserIcon
} from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// --- LUXURY COMPONENTS ---

const MetricCard: React.FC<{ 
    label: string, 
    value: string, 
    icon: any, 
    colorClass?: string 
}> = ({ label, value, icon: Icon, colorClass = "text-liquid-gold" }) => (
    <motion.div 
        whileHover={{ y: -10, scale: 1.02 }}
        className="glass-card-luxury p-12 relative group overflow-hidden border-white/5 shadow-2xl"
    >
        <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-10 transition-all duration-1000 rotate-12 group-hover:rotate-0">
            <Icon className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${colorClass.replace('text', 'shadow')}-glow-sm`}>
                        <Icon className={`w-6 h-6 ${colorClass}`} />
                    </div>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] italic">{label}</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-liquid-gold animate-pulse opacity-20" />
            </div>
            <div className="space-y-1">
                <p className={`text-6xl font-black italic tracking-tighter drop-shadow-2xl ${colorClass} leading-none`}>
                    {value}
                </p>
                <div className="h-[2px] w-full bg-white/5 relative overflow-hidden mt-4">
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className={`absolute inset-0 bg-gradient-to-r from-transparent via-${colorClass.split('-')[1]}-500/20 to-transparent`}
                    />
                </div>
            </div>
        </div>
    </motion.div>
);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" as any }
    }
};

const TransactionFormModal: React.FC<{
    onClose: () => void;
    onSave: (tipo: TransactionType, monto: number, detalle: string) => void;
}> = ({ onClose, onSave }) => {
    const [tipo, setTipo] = useState<TransactionType>('INGRESO');
    const [monto, setMonto] = useState('');
    const [detalle, setDetalle] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const m = parseFloat(monto);
        if (isNaN(m) || m <= 0 || !detalle) return;
        onSave(tipo, m, detalle);
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-center items-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 30 }}
                    className="glass-boutique w-full max-w-xl overflow-hidden relative z-10 border border-white/10 shadow-gold-glow-strong rounded-[3rem]" 
                >
                    <div className="p-12 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-1/2 -translate-y-1/2">
                            <BanknotesIcon className="w-64 h-64 text-liquid-gold" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Secure <span className="text-liquid-gold">Entry</span></h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] mt-2">Financial Protocol Alpha • v6.0</p>
                        </div>
                        <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all relative z-10 close-button-glow"><CloseIcon className="w-6 h-6"/></button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-12 space-y-12">
                        <div className="grid grid-cols-2 gap-8">
                            <button type="button" onClick={() => setTipo('INGRESO')} className={`group relative py-7 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] border-2 transition-all overflow-hidden ${tipo === 'INGRESO' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/5 text-slate-600 hover:border-white/10'}`}>
                                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                Inbound Flow
                            </button>
                            <button type="button" onClick={() => setTipo('EGRESO')} className={`group relative py-7 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] border-2 transition-all overflow-hidden ${tipo === 'EGRESO' ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.1)]' : 'bg-white/5 border-white/5 text-slate-600 hover:border-white/10'}`}>
                                <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                Outbound Burn
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] ml-2">Operation Magnitude</label>
                            <div className="relative group/magnidude">
                                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-liquid-gold text-2xl font-black opacity-30 group-focus-within/magnidude:opacity-100 transition-opacity">$</span>
                                <input 
                                    type="number" step="0.01" value={monto} 
                                    onChange={e => setMonto(e.target.value)} 
                                    className="w-full bg-black/40 border-2 border-white/5 rounded-[2rem] py-8 pl-18 pr-8 text-3xl font-black text-white italic tracking-tighter focus:border-liquid-gold/50 focus:bg-black/60 outline-none transition-all" 
                                    placeholder="0.00" autoFocus required 
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] ml-2">Audit Description</label>
                            <textarea 
                                value={detalle} onChange={e => setDetalle(e.target.value)} 
                                className="w-full bg-black/40 border-2 border-white/5 rounded-[2.5rem] p-8 text-sm font-medium text-white placeholder:text-slate-700 focus:border-liquid-gold/50 focus:bg-black/60 outline-none transition-all h-40 resize-none" 
                                placeholder="TYPE TRANSACTION PURPOSE..." required 
                            />
                        </div>

                        <div className="flex gap-8 pt-6">
                            <button type="button" onClick={onClose} className="flex-1 text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] hover:text-white transition-colors">Terminate</button>
                            <button type="submit" className="flex-[2] bg-white text-black py-7 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-luxury hover:bg-liquid-gold transition-all duration-500 active:scale-95">
                                Validate Lifecycle
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const CuentasPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const [ledger, setLedger] = useState<FinancialEntry[]>([]);
    const [balance, setBalance] = useState({ ingresos: 0, egresos: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [page, setPage] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const ITEMS_PER_PAGE = 30;

    const refreshData = async () => {
        setLoading(true);
        await purgeOldTransactions();
        const data = await getFinancialLedger();
        setLedger([...data].reverse());
        const bal = await getLedgerBalance();
        setBalance(bal);
        setLoading(false);
    };

    useEffect(() => { refreshData(); }, []);

    const filtered = useMemo(() => {
        let result = ledger;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(e => 
                e.detalle.toLowerCase().includes(lower) || 
                e.usuario.toLowerCase().includes(lower) ||
                e.hash.includes(lower)
            );
        }
        if (filterType) {
            result = result.filter(e => e.tipo === filterType);
        }
        return result;
    }, [ledger, searchTerm, filterType]);

    const paginated = useMemo(() => filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE), [filtered, page]);
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    const handleAddTransaction = (tipo: TransactionType, monto: number, detalle: string) => {
        logTransaction(tipo, monto, detalle, currentUser.nombre);
        logActivity(currentUser.nombre, currentUser.rol, 'FINANZAS_MODIFICADA', `Registró ${tipo.toLowerCase()} manual: ${detalle}`, 'Finanzas');
        refreshData();
    };

    const handleExportCSV = () => {
        const header = 'Fecha,Hora,Tipo,Monto,Detalle,Usuario,Hash\n';
        const rows = filtered.map(e => `${new Date(e.timestamp).toLocaleDateString()},${new Date(e.timestamp).toLocaleTimeString()},${e.tipo},${e.monto},"${e.detalle}",${e.usuario},${e.hash}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `archive_ledger_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-[1600px] mx-auto space-y-16 pb-40 px-6 sm:px-12 relative"
        >
            {/* --- CINEMATIC AMBIANCE --- */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-liquid-gold/[0.02] blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-slate-500/[0.02] blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            </div>

            {/* --- LEDGER HEADER --- */}
            <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-white/5 pb-16">
                <div className="space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-[2px] bg-liquid-gold/40"></div>
                        <span className="text-[12px] font-black text-liquid-gold uppercase tracking-[0.8em]">Secure Ledger v6</span>
                    </div>
                    <h1 className="text-7xl sm:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Atelier <span className="text-gold-gradient">Vault</span>
                    </h1>
                </div>
                
                <div className="flex flex-wrap gap-6">
                    <motion.button 
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExportCSV} 
                        className="px-12 py-7 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-[2rem] text-slate-500 hover:text-white transition-all font-black uppercase text-[11px] tracking-[0.4em] flex items-center gap-6 group"
                    >
                        <ArchiveIcon className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                        Archive Output
                    </motion.button>
                    
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowForm(true)} 
                        className="flex items-center gap-6 px-14 py-7 bg-white text-black font-black rounded-[2rem] shadow-gold-glow uppercase text-[11px] tracking-[0.4em] group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-liquid-gold/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                        <PlusIcon className="w-6 h-6 relative z-10" />
                        <span className="relative z-10">Log Pulse</span>
                    </motion.button>
                </div>
            </motion.div>

            {/* --- CORE KPIS --- */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <MetricCard label="Liquidity Signal" value={formatCurrency(balance.ingresos).split(',')[0]} icon={ArrowTrendingUpIcon} colorClass="text-emerald-500" />
                <MetricCard label="Operational Burn" value={formatCurrency(balance.egresos).split(',')[0]} icon={ArrowTrendingDownIcon} colorClass="text-rose-500" />
                <MetricCard label="Global Integrity" value={formatCurrency(balance.total).split(',')[0]} icon={ScaleIcon} colorClass={balance.total >= 0 ? "text-white" : "text-rose-500"} />
            </motion.div>

            {/* --- MONITORING CONTROLS --- */}
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-8">
                <div className="relative flex-grow group">
                    <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                        <SearchIcon className="w-6 h-6 text-slate-600 group-focus-within:text-liquid-gold transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="TRACE HASH OR OPERATION SIGNATURE..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full bg-white/[0.02] border-2 border-white/5 rounded-[2.5rem] py-8 pl-20 pr-8 text-[12px] font-black uppercase tracking-[0.4em] text-white placeholder:text-slate-700 focus:border-liquid-gold/30 outline-none transition-all shadow-inner"
                    />
                </div>
                
                <div className="relative lg:w-80 group">
                    <select 
                        value={filterType} 
                        onChange={e => { setFilterType(e.target.value); setPage(0); }}
                        className="w-full bg-white/[0.02] border-2 border-white/5 rounded-[2.5rem] py-8 px-10 text-[11px] font-black uppercase tracking-[0.3em] text-white appearance-none cursor-pointer focus:border-liquid-gold/30 outline-none transition-all italic"
                    >
                        <option value="" className="bg-brand-dark">Protocol: All</option>
                        <option value="INGRESO" className="bg-brand-dark text-emerald-500 italic">Signal: Inbound</option>
                        <option value="EGRESO" className="bg-brand-dark text-rose-500 italic">Signal: Outbound</option>
                    </select>
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">▼</div>
                </div>
            </motion.div>

            {/* --- LEDGER STREAM --- */}
            <motion.div variants={itemVariants} className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="py-60 flex flex-col items-center justify-center gap-8">
                            <Loader2Icon className="w-20 h-20 text-liquid-gold/20 animate-spin" />
                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-[1em] animate-pulse italic">Scanning Ledger Integrity...</p>
                        </div>
                    ) : paginated.length > 0 ? (
                        <div className="space-y-6">
                            {paginated.map((entry, idx) => {
                                const isIngreso = entry.tipo === 'INGRESO';
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={entry.id} 
                                        className="group glass-card-luxury p-10 flex flex-col lg:flex-row items-center gap-10 border-white/5 hover:border-liquid-gold/20 transition-all duration-700 hover:shadow-gold-glow-sm relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-architect-grid opacity-5 pointer-events-none" />
                                        <div className="absolute left-0 top-0 w-[2px] h-full bg-gradient-to-b from-transparent via-liquid-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        
                                        <div className="flex items-center gap-10 min-w-[220px] relative z-10">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-700 ${isIngreso ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} border shadow-inner group-hover:scale-110`}>
                                                {isIngreso ? <ArrowTrendingUpIcon className="w-8 h-8" /> : <ArrowTrendingDownIcon className="w-8 h-8" />}
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-[14px] font-black text-white italic tracking-tighter leading-none">{formatDate(entry.timestamp)}</p>
                                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>

                                        <div className="flex-grow min-w-0 space-y-5 relative z-10">
                                            <div className="flex items-center gap-5">
                                                <div className={`text-[9px] font-black uppercase tracking-[0.5em] px-5 py-2 rounded-xl border-2 italic ${isIngreso ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-500 border-rose-500/30'} shadow-lg shadow-black/50`}>
                                                    {isIngreso ? 'ASSET_INJECTION' : 'CAPITAL_BURN'}
                                                </div>
                                                <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                                                    <FingerPrintIcon className="w-3.5 h-3.5 text-liquid-gold opacity-40" />
                                                    <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">#{entry.id.substring(0, 10).toUpperCase()}</span>
                                                </div>
                                            </div>
                                            <h4 className="text-3xl font-black text-white uppercase tracking-tight italic group-hover:text-liquid-gold transition-colors duration-500 truncate leading-none">{entry.detalle}</h4>
                                            <div className="flex items-center gap-4">
                                                <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold/20 animate-pulse" />
                                                <p className="text-[9px] font-bold text-slate-800 uppercase tracking-[0.4em] leading-none truncate max-w-sm group-hover:text-slate-600 transition-colors">SIG: {entry.hash}</p>
                                            </div>
                                        </div>

                                        <div className="text-right min-w-[280px] space-y-3 relative z-10">
                                            <div className="flex flex-col items-end">
                                                <p className={`text-6xl font-black italic tracking-tighter ${isIngreso ? 'text-emerald-500' : 'text-rose-500'} drop-shadow-2xl leading-none`}>
                                                    {isIngreso ? '+$' : '-$'}{formatCurrency(entry.monto).replace('$', '').split(',')[0]}
                                                    <span className="text-2xl opacity-20 ml-1">.00</span>
                                                </p>
                                                <div className="h-[2px] w-24 bg-gradient-to-l from-white/10 to-transparent mt-2" />
                                            </div>
                                            <div className="flex items-center justify-end gap-3 text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] italic group-hover:text-white transition-colors duration-500">
                                                <UserIcon className="w-4 h-4 opacity-40 group-hover:text-liquid-gold transition-colors" />
                                                AUTH BY_{entry.usuario.split(' ')[0]}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-60 glass-card-luxury text-center flex flex-col items-center justify-center border-dashed border-white/5 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-liquid-gold opacity-[0.01]"></div>
                            <ShieldCheckIcon className="w-32 h-32 text-slate-900 mb-10" />
                            <h3 className="text-4xl font-black text-slate-700 uppercase tracking-widest italic">Static Ledger</h3>
                            <p className="text-slate-800 text-[11px] font-black uppercase mt-6 tracking-[0.8em] max-w-lg mx-auto leading-relaxed">No financial signals detected in current temporal window • Status Normal</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* --- PAGINATION PROTOCOL --- */}
            {totalPages > 1 && (
                <motion.div variants={itemVariants} className="flex justify-center items-center gap-16 pt-12">
                    <motion.button 
                        whileHover={{ x: -10 }}
                        disabled={page === 0} 
                        onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }} 
                        className="px-12 py-5 bg-white/5 border border-white/5 rounded-[2rem] text-[11px] font-black text-white uppercase tracking-[0.5em] disabled:opacity-20 hover:bg-white/10 transition-all font-black"
                    >
                        Previous Signal
                    </motion.button>
                    
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[14px] font-black text-white italic tracking-tighter bg-liquid-gold/20 px-6 py-2 rounded-xl flex items-center gap-3">
                            <span className="text-liquid-gold">{page + 1}</span>
                            <span className="text-white/20">/</span>
                            <span className="text-slate-500">{totalPages}</span>
                        </span>
                        <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">Index Position</p>
                    </div>

                    <motion.button 
                        whileHover={{ x: 10 }}
                        disabled={page >= totalPages - 1} 
                        onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }} 
                        className="px-12 py-5 bg-white/5 border border-white/5 rounded-[2rem] text-[11px] font-black text-white uppercase tracking-[0.5em] disabled:opacity-20 hover:bg-white/10 transition-all font-black"
                    >
                        Next Signal
                    </motion.button>
                </motion.div>
            )}

            {showForm && <TransactionFormModal onClose={() => setShowForm(false)} onSave={handleAddTransaction} />}
        </motion.div>
    );
};

export default CuentasPage;
