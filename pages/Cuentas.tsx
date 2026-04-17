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
    ArrowPathIcon,
    ClockIcon,
    ArrowDownTrayIcon,
    ScaleIcon,
    Loader2Icon
} from '../components/Icons';
import { formatCurrency, formatDate } from '../utils';

// --- MODAL DE REGISTRO MANUAL ---
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-brand-dark/95 border border-white/10 rounded-[2.5rem] shadow-luxury w-full max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-white/5">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Registrar Movimiento</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => setTipo('INGRESO')} className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${tipo === 'INGRESO' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-transparent text-slate-500'}`}>Ingreso</button>
                        <button type="button" onClick={() => setTipo('EGRESO')} className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${tipo === 'EGRESO' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-white/5 border-transparent text-slate-500'}`}>Egreso</button>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Monto ($)</label>
                        <input type="number" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} autoFocus className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-liquid-gold/50" placeholder="0.00" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Detalle / Concepto</label>
                        <textarea value={detalle} onChange={e => setDetalle(e.target.value)} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-liquid-gold/50 h-24" placeholder="EJ: PAGO DE LUZ, COMPRA DE PAPEL..." required />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/10">Cancelar</button>
                        <button type="submit" className="flex-1 py-4 bg-liquid-gold text-brand-dark font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-gold-glow hover:scale-105 transition-all">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const TYPE_COLORS: Record<TransactionType, { label: string; color: string; icon: any }> = {
    INGRESO: { label: 'Ingreso', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: ArrowTrendingUpIcon },
    EGRESO: { label: 'Gasto / Egreso', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: ArrowTrendingDownIcon },
};

const CuentasPage: React.FC = () => {
    const [ledger, setLedger] = useState<FinancialEntry[]>([]);
    const [balance, setBalance] = useState(getLedgerBalance());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [page, setPage] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const ITEMS_PER_PAGE = 50;

    const refreshData = () => {
        setLoading(true);
        purgeOldTransactions(); // Auto-purge on load
        const data = getFinancialLedger();
        setLedger([...data].reverse()); // Newest first
        setBalance(getLedgerBalance());
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

    const paginated = useMemo(() => {
        const start = page * ITEMS_PER_PAGE;
        return filtered.slice(start, start + ITEMS_PER_PAGE);
    }, [filtered, page]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    const handleAddTransaction = (tipo: TransactionType, monto: number, detalle: string) => {
        logTransaction(tipo, monto, detalle, 'PEDRO'); // Asumiendo 'PEDRO' por ahora
        refreshData();
    };

    const handleExportCSV = () => {
        const header = 'Fecha,Hora,Tipo,Monto,Detalle,Usuario,Hash\n';
        const rows = filtered.map(e => {
            const d = new Date(e.timestamp);
            return `${d.toLocaleDateString()},${d.toLocaleTimeString()},${e.tipo},${e.monto},"${e.detalle}",${e.usuario},${e.hash}`;
        }).join('\n');
        
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `libro_diario_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="p-8 lg:p-12 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[3rem] shadow-luxury relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-liquid-gold/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
                
                <div className="flex flex-wrap justify-between items-end gap-8 relative z-10">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3 italic">Libro Diario Inmutable</p>
                        <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">
                            Gestión de <span className="text-gold-gradient italic">Cuentas</span>
                        </h1>
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Integridad Hashed • Ciclo: 90 días</p>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <ShieldCheckIcon className="w-3 h-3 text-emerald-400" />
                                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Blockchain Verified</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={() => setShowForm(true)} 
                            className="flex items-center gap-3 px-8 py-5 bg-liquid-gold text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-gold-glow hover:scale-105 transition-all duration-300"
                        >
                            <PlusIcon className="w-4 h-4" /> Nuevo Movimiento
                        </button>
                        <button 
                            onClick={handleExportCSV} 
                            className="flex items-center gap-2 px-6 py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all duration-300"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" /> Exportar CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Financial Status KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-500/5 backdrop-blur-xl border border-emerald-500/10 rounded-3xl p-8 shadow-luxury group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all"></div>
                    <div className="flex items-center gap-3 mb-4">
                         <div className="p-2 bg-emerald-500/20 rounded-xl"><ArrowTrendingUpIcon className="w-5 h-5 text-emerald-400" /></div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Ingresos Totales (90d)</p>
                    </div>
                    <p className="text-4xl font-black text-emerald-400 tracking-tighter italic">{formatCurrency(balance.ingresos)}</p>
                </div>

                <div className="bg-rose-500/5 backdrop-blur-xl border border-rose-500/10 rounded-3xl p-8 shadow-luxury group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-rose-500/10 transition-all"></div>
                    <div className="flex items-center gap-3 mb-4">
                         <div className="p-2 bg-rose-500/20 rounded-xl"><ArrowTrendingDownIcon className="w-5 h-5 text-rose-400" /></div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Egresos Totales (90d)</p>
                    </div>
                    <p className="text-4xl font-black text-rose-400 tracking-tighter italic">{formatCurrency(balance.egresos)}</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-luxury group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-liquid-gold/10 transition-all"></div>
                    <div className="flex items-center gap-3 mb-4">
                         <div className="p-2 bg-liquid-gold/20 rounded-xl"><ScaleIcon className="w-5 h-5 text-liquid-gold" /></div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Balance Neto (Caja)</p>
                    </div>
                    <p className={`text-4xl font-black tracking-tighter italic ${balance.total >= 0 ? 'text-white' : 'text-rose-400'}`}>
                        {formatCurrency(balance.total)}
                    </p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-grow max-w-xl">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="BUSCAR MOVIMIENTO (DETALLE, USUARIO, HASH)..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-14 pr-8 py-5 bg-white/5 border-2 border-white/5 focus:border-liquid-gold/30 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest placeholder:text-slate-600 outline-none focus:bg-white/10 transition-all duration-500" 
                    />
                </div>
                <select 
                    value={filterType} 
                    onChange={e => { setFilterType(e.target.value); setPage(0); }}
                    className="px-8 py-5 bg-white/5 border-2 border-white/5 rounded-2xl text-[11px] font-black text-white uppercase tracking-wider outline-none focus:border-liquid-gold/30 transition-all cursor-pointer appearance-none"
                >
                    <option value="" className="bg-brand-dark">Todos los Tipos</option>
                    <option value="INGRESO" className="bg-brand-dark">Solo Ingresos</option>
                    <option value="EGRESO" className="bg-brand-dark">Solo Egresos</option>
                </select>
            </div>

            {/* Transaction Timeline */}
            <div className="space-y-4">
                {loading ? (
                    <div className="py-20 text-center"><Loader2Icon className="animate-spin w-12 h-12 text-liquid-gold mx-auto" /></div>
                ) : paginated.length > 0 ? paginated.map((entry, idx) => {
                    const meta = TYPE_COLORS[entry.tipo];
                    const date = new Date(entry.timestamp);

                    return (
                        <div key={entry.id} className="group bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-liquid-gold/20 rounded-[1.5rem] p-6 transition-all duration-500 flex items-center gap-6">
                            {/* Visual Chain Link */}
                            <div className="hidden md:flex flex-col items-center gap-2 min-w-[50px]">
                                <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold/40 group-hover:bg-liquid-gold shadow-gold-glow transition-all"></div>
                                {idx < paginated.length - 1 && <div className="w-[1px] h-8 bg-white/5"></div>}
                            </div>

                            {/* Date/Time */}
                            <div className="min-w-[120px] hidden lg:block">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{formatDate(entry.timestamp)}</p>
                                <p className="text-sm font-black text-white mt-1.5 italic opacity-80">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>

                            {/* Status Icon */}
                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${meta.color}`}>
                                <meta.icon className="w-6 h-6" />
                            </div>

                            {/* Details */}
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${meta.color}`}>
                                        {meta.label}
                                    </span>
                                    {entry.referenciaId && (
                                        <span className="text-[8px] font-bold text-slate-500 uppercase">Ref: #{entry.referenciaId.slice(-6)}</span>
                                    )}
                                </div>
                                <h4 className="text-sm font-bold text-white truncate uppercase tracking-tight italic">{entry.detalle}</h4>
                                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">Audit Trail: {entry.usuario} • {entry.hash.substring(0, 16)}...</p>
                            </div>

                            {/* Amount */}
                            <div className="text-right min-w-[120px]">
                                <p className={`text-2xl font-black italic tracking-tighter ${entry.tipo === 'INGRESO' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {entry.tipo === 'INGRESO' ? '+' : '-'}{formatCurrency(entry.monto)}
                                </p>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-32 bg-white/5 backdrop-blur-xl rounded-[4rem] border-2 border-dashed border-white/5 text-center flex flex-col items-center">
                        <ShieldCheckIcon className="w-24 h-24 text-slate-800 mb-8" />
                        <h3 className="text-2xl font-black text-slate-500 uppercase tracking-tighter opacity-20">Bóveda Vacía</h3>
                        <p className="text-slate-600 text-[10px] font-black uppercase mt-3 tracking-[0.2em]">No se han detectado movimientos registrados.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 pt-10">
                    <button 
                        disabled={page === 0} 
                        onClick={() => { setPage(p => p - 1); window.scrollTo(0,0); }} 
                        className="px-8 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest disabled:opacity-30 hover:bg-white/10 transition-all"
                    >
                        Anterior
                    </button>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">{page + 1} / {totalPages}</span>
                    <button 
                        disabled={page >= totalPages - 1} 
                        onClick={() => { setPage(p => p + 1); window.scrollTo(0,0); }} 
                        className="px-8 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest disabled:opacity-30 hover:bg-white/10 transition-all"
                    >
                        Siguiente
                    </button>
                </div>
            )}

            {/* Manual Entry Modal */}
            {showForm && (
                <TransactionFormModal 
                    onClose={() => setShowForm(false)} 
                    onSave={handleAddTransaction} 
                />
            )}
        </div>
    );
};

export default CuentasPage;
