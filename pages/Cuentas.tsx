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
    UserIcon,
    SettingsIcon
} from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// --- PRECISION LIGHT COMPONENTS ---

const MetricCard: React.FC<{ 
    label: string, 
    value: string, 
    icon: any, 
    colorClass?: string 
}> = ({ label, value, icon: Icon, colorClass = "text-brand-blue" }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-all duration-700">
            <Icon className="w-24 h-24 text-slate-900" />
        </div>
        <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{label}</span>
            </div>
            <p className={`text-5xl font-black tracking-tighter ${colorClass} leading-none`}>
                {value}
            </p>
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
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" as any }
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-xl overflow-hidden relative z-10 border border-slate-200 shadow-2xl rounded-[3rem]" 
                >
                    <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nueva <span className="text-brand-blue">Operación</span></h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">LOG DE TRANSACCIÓN MANUAL</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white hover:bg-slate-50 text-slate-400 border border-slate-200 rounded-xl transition-all"><CloseIcon className="w-5 h-5"/></button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-10">
                        <div className="grid grid-cols-2 gap-6">
                            <button type="button" onClick={() => setTipo('INGRESO')} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border transition-all ${tipo === 'INGRESO' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                Ingreso
                            </button>
                            <button type="button" onClick={() => setTipo('EGRESO')} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] border transition-all ${tipo === 'EGRESO' ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                Egreso
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Monto de la Operación</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 text-2xl font-black">$</span>
                                <input 
                                    type="number" step="0.01" value={monto} 
                                    onChange={e => setMonto(e.target.value)} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-6 pl-12 pr-6 text-3xl font-black text-slate-900 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all" 
                                    placeholder="0.00" autoFocus required 
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Detalle Auditivo</label>
                            <textarea 
                                value={detalle} onChange={e => setDetalle(e.target.value)} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all h-32 resize-none" 
                                placeholder="Especifique el motivo de la transacción..." required 
                            />
                        </div>

                        <div className="flex gap-6 pt-4">
                            <button type="button" onClick={onClose} className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-900 transition-colors">Cancelar</button>
                            <button type="submit" className="flex-[2] bg-brand-blue text-white py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all active:scale-95">
                                Registrar Operación
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
        link.download = `ledger_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-[1600px] mx-auto space-y-16 pb-40 pt-6 px-6 sm:px-12 relative animate-fade-in"
        >
            {/* --- LEDGER HEADER --- */}
            <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-slate-200 pb-16">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue shadow-[0_0_8px_rgba(14,165,233,0.5)] animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Control de Activos</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 tracking-[-0.04em] uppercase leading-none">
                        Bóveda <span className="text-brand-blue">Financiera</span>
                    </h1>
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <motion.button 
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExportCSV} 
                        className="px-10 py-5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all font-black uppercase text-[10px] tracking-widest flex items-center gap-4 shadow-sm"
                    >
                        <ArchiveIcon className="w-4 h-4 text-slate-400" /> 
                        Exportar Historial
                    </motion.button>
                    
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowForm(true)} 
                        className="flex items-center gap-4 px-12 py-5 bg-brand-blue text-white font-black rounded-2xl shadow-xl shadow-brand-blue/20 uppercase text-[10px] tracking-widest hover:bg-brand-blue/90 transition-all"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Registrar Movimiento
                    </motion.button>
                </div>
            </motion.div>

            {/* --- CORE KPIS --- */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <MetricCard label="Flujo de Ingresos" value={formatCurrency(balance.ingresos).split(',')[0]} icon={ArrowTrendingUpIcon} colorClass="text-emerald-500" />
                <MetricCard label="Egresos Totales" value={formatCurrency(balance.egresos).split(',')[0]} icon={ArrowTrendingDownIcon} colorClass="text-rose-500" />
                <MetricCard label="Balance Neto" value={formatCurrency(balance.total).split(',')[0]} icon={ScaleIcon} colorClass={balance.total >= 0 ? "text-brand-blue" : "text-rose-500"} />
            </motion.div>

            {/* --- MONITORING CONTROLS --- */}
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-6">
                <div className="relative flex-grow group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="BUSCAR TRANSACCIÓN O USUARIO..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-16 pr-6 text-[11px] font-black uppercase tracking-widest text-slate-900 placeholder:text-slate-300 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all shadow-sm"
                    />
                </div>
                
                <div className="relative lg:w-72">
                    <select 
                        value={filterType} 
                        onChange={e => { setFilterType(e.target.value); setPage(0); }}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-5 px-8 text-[10px] font-black uppercase tracking-widest text-slate-600 appearance-none cursor-pointer focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all shadow-sm"
                    >
                        <option value="">Protocolo: Todos</option>
                        <option value="INGRESO">Tipo: Ingresos</option>
                        <option value="EGRESO">Tipo: Egresos</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 text-xs">▼</div>
                </div>
            </motion.div>

            {/* --- LEDGER STREAM --- */}
            <motion.div variants={itemVariants} className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-6">
                            <Loader2Icon className="w-12 h-12 text-brand-blue animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Analizando integridad de la bóveda...</p>
                        </div>
                    ) : paginated.length > 0 ? (
                        <div className="space-y-4">
                            {paginated.map((entry, idx) => {
                                const isIngreso = entry.tipo === 'INGRESO';
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={entry.id} 
                                        className="group bg-white p-8 flex flex-col lg:flex-row items-center gap-8 border border-slate-200 rounded-[2.5rem] hover:border-brand-blue/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="flex items-center gap-8 min-w-[200px]">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${isIngreso ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'} group-hover:scale-110`}>
                                                {isIngreso ? <ArrowTrendingUpIcon className="w-7 h-7" /> : <ArrowTrendingDownIcon className="w-7 h-7" />}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[13px] font-black text-slate-900 tracking-tighter">{formatDate(entry.timestamp)}</p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>

                                        <div className="flex-grow min-w-0 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${isIngreso ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {isIngreso ? 'INGRESO_ACTIVO' : 'EGRESO_CAPITAL'}
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                                    <FingerPrintIcon className="w-3 h-3 text-slate-300" />
                                                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">#{entry.id.substring(0, 8)}</span>
                                                </div>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate leading-none">{entry.detalle}</h4>
                                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest truncate max-w-md">SIG: {entry.hash}</p>
                                        </div>

                                        <div className="text-right min-w-[220px] space-y-2">
                                            <p className={`text-4xl font-black tracking-tighter ${isIngreso ? 'text-emerald-500' : 'text-rose-500'} leading-none`}>
                                                {isIngreso ? '+$' : '-$'}{formatCurrency(entry.monto).replace('$', '').split(',')[0]}
                                                <span className="text-lg opacity-30 ml-1">.00</span>
                                            </p>
                                            <div className="flex items-center justify-end gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                <UserIcon className="w-3.5 h-3.5 text-slate-300" />
                                                AUTH BY_{entry.usuario.split(' ')[0]}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="py-40 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 text-center flex flex-col items-center justify-center"
                        >
                            <ShieldCheckIcon className="w-20 h-20 text-slate-100 mb-6" />
                            <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest italic">Historial Vacío</h3>
                            <p className="text-slate-400 text-[9px] font-black uppercase mt-4 tracking-widest">No se detectan señales financieras en la ventana actual.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* --- PAGINATION --- */}
            {totalPages > 1 && (
                <motion.div variants={itemVariants} className="flex justify-center items-center gap-12 pt-8">
                    <button 
                        disabled={page === 0} 
                        onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }} 
                        className="px-10 py-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Anterior
                    </button>
                    
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[12px] font-black text-slate-900 bg-slate-100 px-5 py-2 rounded-xl flex items-center gap-2">
                            <span className="text-brand-blue">{page + 1}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-400">{totalPages}</span>
                        </span>
                    </div>

                    <button 
                        disabled={page >= totalPages - 1} 
                        onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }} 
                        className="px-10 py-4 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Siguiente
                    </button>
                </motion.div>
            )}

            {showForm && <TransactionFormModal onClose={() => setShowForm(false)} onSave={handleAddTransaction} />}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
            `}</style>
        </motion.div>
    );
};

export default CuentasPage;
