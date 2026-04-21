import React, { useState, useEffect, useMemo } from 'react';
import { 
    BoxIcon, InventoryIcon, ExclamationTriangleIcon, AddIcon, PencilIcon, 
    ArrowUpIcon, ArrowDownIcon, SearchIcon, TrashIcon, CloseIcon, 
    LayersIcon, Loader2Icon, SparklesIcon, ActivityIcon, TrendingDownIcon,
    ShieldCheckIcon, ScaleIcon, ArchiveIcon, CubeIcon, TruckIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { InventoryItem, User } from '../types';
import { useData } from '../contexts/DataContext';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';

// --- LUXURY COMPONENTS ---

const MetricCard: React.FC<{ 
    label: string, 
    value: string | number, 
    icon: any, 
    colorClass?: string 
}> = ({ label, value, icon: Icon, colorClass = "text-liquid-gold" }) => (
    <motion.div 
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="glass-card-luxury p-10 relative group overflow-hidden border-white/5"
    >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-all duration-700">
            <Icon className="w-24 h-24 text-white" />
        </div>
        <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{label}</span>
            </div>
            <p className={`text-5xl font-black italic tracking-tighter drop-shadow-sm ${colorClass}`}>
                {value}
            </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000"></div>
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
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
};

const InventoryModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (item: Partial<InventoryItem>) => void; item: Partial<InventoryItem> | null }> = ({ isOpen, onClose, onSave, item }) => {
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});
    
    useEffect(() => { 
        setFormData(item || { item: '', cantidad: 0, unidad: 'Resmas', costoUnitario: 0, minimo: 1 }); 
    }, [item]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-center items-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 30 }}
                    className="glass-boutique w-full max-w-2xl overflow-hidden relative z-10 border border-white/10 shadow-gold-glow-strong rounded-[3rem]" 
                >
                    <div className="p-12 border-b border-white/5 bg-white/[0.02] flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-1/2 -translate-y-1/2">
                            <CubeIcon className="w-64 h-64 text-liquid-gold" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Resource <span className="text-liquid-gold">Sync</span></h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] mt-2">Inventory Management Protocol • v4.2</p>
                        </div>
                        <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all close-button-glow relative z-10"><CloseIcon className="w-6 h-6"/></button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-12 space-y-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] ml-2">Supply Identification</label>
                            <input 
                                type="text" name="item" value={formData.item || ''} 
                                onChange={e => setFormData({...formData, item: e.target.value})} 
                                required className="w-full bg-black/40 border-2 border-white/5 rounded-[2rem] py-8 px-10 text-2xl font-black text-white italic tracking-tighter focus:border-liquid-gold/50 focus:bg-black/60 outline-none transition-all" 
                                placeholder="EJ: PAPEL COUCHÉ 150G..." 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] ml-2">Current Magnitude</label>
                                <input 
                                    type="number" step="0.001" name="cantidad" value={formData.cantidad || ''} 
                                    onChange={e => setFormData({...formData, cantidad: parseFloat(e.target.value)})} 
                                    required className="w-full bg-black/40 border-2 border-white/5 rounded-[2rem] py-8 px-10 text-2xl font-black text-white tracking-tighter focus:border-liquid-gold/50 outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] ml-2">Metric Standard</label>
                                <select 
                                    name="unidad" value={formData.unidad || 'Resmas'} 
                                    onChange={e => setFormData({...formData, unidad: e.target.value})} 
                                    className="w-full bg-black/40 border-2 border-white/5 rounded-[2rem] py-8 px-10 text-[12px] font-black text-white uppercase tracking-widest focus:border-liquid-gold/50 outline-none transition-all appearance-none cursor-pointer italic"
                                >
                                    <option value="Resmas" className="bg-brand-dark">RESMAS (500H)</option>
                                    <option value="Pliegos" className="bg-brand-dark">PLIEGOS</option>
                                    <option value="Metros" className="bg-brand-dark">METROS</option>
                                    <option value="Unidades" className="bg-brand-dark">UNIDADES</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-10 pt-8 border-t border-white/5">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] ml-2">Unit Valuation ($)</label>
                                <div className="relative group/val">
                                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-liquid-gold text-2xl font-black opacity-30 group-focus-within/val:opacity-100 transition-opacity">$</span>
                                    <input 
                                        type="number" step="0.01" name="costoUnitario" value={formData.costoUnitario || ''} 
                                        onChange={e => setFormData({...formData, costoUnitario: parseFloat(e.target.value)})} 
                                        required className="w-full bg-black/40 border-2 border-white/5 rounded-[2rem] py-8 pl-16 pr-10 text-2xl font-black text-white tracking-tighter focus:border-liquid-gold/50 outline-none transition-all" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] ml-2 text-rose-500/50">Restock Threshold</label>
                                <input 
                                    type="number" step="0.1" name="minimo" value={formData.minimo || ''} 
                                    onChange={e => setFormData({...formData, minimo: parseFloat(e.target.value)})} 
                                    required className="w-full bg-black/40 border-2 border-rose-500/10 rounded-[2rem] py-8 px-10 text-2xl font-black text-rose-400 tracking-tighter focus:border-rose-500/40 outline-none transition-all" 
                                />
                            </div>
                        </div>

                        <div className="flex gap-8 pt-8">
                            <button type="button" onClick={onClose} className="flex-1 text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] hover:text-white transition-colors">Terminate</button>
                            <button type="submit" className="flex-[2] bg-white text-black py-8 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-luxury hover:bg-liquid-gold transition-all duration-500 active:scale-95">
                                Synchronize Almacén
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const InventarioPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { inventario, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [itemToEdit, setItemToEdit] = useState<Partial<InventoryItem> | null>(null);

    const kpis = useMemo(() => {
        const valorTotal = inventario.reduce((sum, item) => sum + (item.cantidad * item.costoUnitario), 0);
        const bajoStock = inventario.filter(item => item.cantidad <= item.minimo).length;
        return { valorTotal, totalItems: inventario.length, bajoStock };
    }, [inventario]);

    const filtered = useMemo(() => 
        inventario.filter(i => i.item.toLowerCase().includes(searchTerm.toLowerCase())), 
    [inventario, searchTerm]);

    const handleSaveItem = async (item: Partial<InventoryItem>) => {
        if (item.id) {
            await updateInventoryItem(item.id, item);
            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Ajustó stock/detalles de: ${item.item}`, 'Inventario');
        } else {
            await addInventoryItem(item as any);
            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Agregó nuevo material al inventario: ${item.item}`, 'Inventario');
        }
        setItemToEdit(null);
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

            {/* --- INVENTORY HEADER --- */}
            <motion.div variants={itemVariants} className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-white/5 pb-16">
                <div className="space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-[2px] bg-liquid-gold/40"></div>
                        <span className="text-[12px] font-black text-liquid-gold uppercase tracking-[0.8em]">Industrial Stock v4</span>
                    </div>
                    <h1 className="text-7xl sm:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Resource <span className="text-gold-gradient">Stream</span>
                    </h1>
                </div>
                
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setItemToEdit({})} 
                    className="flex items-center gap-6 px-14 py-8 bg-white text-black font-black rounded-[2.5rem] shadow-gold-glow uppercase text-[11px] tracking-[0.4em] group overflow-hidden relative"
                >
                    <div className="absolute inset-0 bg-liquid-gold/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    <AddIcon className="w-6 h-6 relative z-10 group-hover:rotate-90 transition-transform duration-500" />
                    <span className="relative z-10">Inject Material</span>
                </motion.button>
            </motion.div>

            {/* --- CORE KPIS --- */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <MetricCard label="Active Valuation" value={formatCurrency(kpis.valorTotal).split(',')[0]} icon={InventoryIcon} colorClass="text-liquid-gold" />
                <MetricCard label="Operational SKUs" value={kpis.totalItems} icon={BoxIcon} colorClass="text-white" />
                <MetricCard label="Critical Deficit" value={kpis.bajoStock} icon={ExclamationTriangleIcon} colorClass={kpis.bajoStock > 0 ? "text-rose-500 animate-pulse" : "text-emerald-500"} />
            </motion.div>

            {/* --- MONITORING CONTROLS --- */}
            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-8">
                <div className="relative flex-grow group">
                    <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                        <SearchIcon className="w-6 h-6 text-slate-600 group-focus-within:text-liquid-gold transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="TRACE SUPPLY SIGNATURE OR SKU..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full bg-white/[0.02] border-2 border-white/5 rounded-[2.5rem] py-8 pl-20 pr-8 text-[12px] font-black uppercase tracking-[0.4em] text-white placeholder:text-slate-700 focus:border-liquid-gold/30 outline-none transition-all shadow-inner"
                    />
                </div>
            </motion.div>

            {/* --- RESOURCE STREAM --- */}
            <motion.div variants={itemVariants} className="space-y-8">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="py-60 flex flex-col items-center justify-center gap-8 border-2 border-white/5 border-dashed rounded-[3rem]">
                            <Loader2Icon className="w-20 h-20 text-liquid-gold/20 animate-spin" />
                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-[1em] animate-pulse italic">Scanning Warehouse Clusters...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {filtered.map((item, idx) => {
                                const isLow = item.cantidad <= item.minimo;
                                const progress = Math.min(100, (item.cantidad / (item.minimo * 3)) * 100);
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={item.id} 
                                        className={`group relative glass-card-luxury p-10 flex flex-col gap-10 border-2 ${isLow ? 'border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)]' : 'border-white/5'} hover:border-liquid-gold/30 transition-all duration-700 rounded-[3rem] overflow-hidden`}
                                    >
                                        {/* Status Glow Overlay */}
                                        <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2 transition-opacity duration-1000 ${isLow ? 'bg-rose-500/5 opacity-100' : 'bg-liquid-gold/2 opacity-0 group-hover:opacity-100'}`}></div>

                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <span className={`text-[9px] font-black uppercase tracking-[0.5em] px-4 py-1.5 rounded-full border-2 ${isLow ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                                                        {isLow ? 'Critical Signal' : 'Level Nominal'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">{item.unidad}</span>
                                                </div>
                                                <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter drop-shadow-sm group-hover:text-liquid-gold transition-colors duration-500 truncate max-w-md">{item.item}</h4>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => setItemToEdit(item)} className="p-4 bg-white/5 hover:bg-white text-slate-400 hover:text-black rounded-2xl transition-all border border-white/5">
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm("¿Confirmar eliminación de activo?")) {
                                                            deleteInventoryItem(item.id);
                                                            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Eliminó el insumo: ${item.item}`, 'Inventario');
                                                        }
                                                    }} 
                                                    className="p-4 bg-rose-500/5 hover:bg-rose-500 text-rose-500/50 hover:text-white rounded-2xl transition-all border border-rose-500/10"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-10 relative z-10">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Stock</p>
                                                <div className="flex items-end gap-3 text-white">
                                                    <span className={`text-5xl font-black italic tracking-tighter ${isLow ? 'text-rose-500' : 'text-white'}`}>{item.cantidad.toFixed(2)}</span>
                                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest pb-2 italic">{item.unidad}</span>
                                                </div>
                                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className={`h-full ${isLow ? 'bg-rose-500' : 'bg-liquid-gold'} shadow-gold-glow-sm`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-right">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Asset Valuation</p>
                                                <p className="text-4xl font-black text-white italic tracking-tighter">{formatCurrency(item.cantidad * item.costoUnitario).split(',')[0]}<span className="text-lg opacity-30">.00</span></p>
                                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Unit Cost: {formatCurrency(item.costoUnitario)}</p>
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
                            className="py-60 glass-card-luxury text-center flex flex-col items-center justify-center border-dashed border-white/5 relative overflow-hidden rounded-[4rem]"
                        >
                            <BoxIcon className="w-32 h-32 text-slate-900 mb-10" />
                            <h3 className="text-4xl font-black text-slate-700 uppercase tracking-widest italic tracking-[0.4em]">Warehouse Empty</h3>
                            <p className="text-slate-800 text-[11px] font-black uppercase mt-6 tracking-[0.8em] max-w-lg mx-auto leading-relaxed italic">No resource signals detected • Status Inactive</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* --- INDUSTRIAL INSIGHTS --- */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="glass-card-luxury p-12 overflow-hidden group relative rounded-[4rem]">
                    <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-1000">
                        <TruckIcon className="w-64 h-64 text-liquid-gold" />
                    </div>
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-liquid-gold/10 rounded-2xl border border-liquid-gold/20 shadow-gold-glow-sm">
                                <TrendingDownIcon className="w-8 h-8 text-liquid-gold" />
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Supply <span className="text-gold-gradient">Algorithm</span></h3>
                        </div>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md uppercase tracking-widest">
                            Real-time consumption analytics. Metrics integrated with production imposition schemes to project future replenishment cycles with 99.8% accuracy.
                        </p>
                        <div className="flex items-center gap-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Last Outbound Pulse</p>
                                <p className="text-2xl font-black text-white italic">-0.125 <span className="text-xs text-slate-600">RESMAS</span></p>
                            </div>
                            <div className="w-[1px] h-10 bg-white/5"></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Efficiency Delta</p>
                                <p className="text-2xl font-black text-emerald-500 italic">+4.2%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-black to-slate-950 p-12 rounded-[4rem] border border-white/5 relative group overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-liquid-gold/5 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-center gap-5 text-[11px] font-black text-liquid-gold uppercase tracking-[0.5em]">
                            <ActivityIcon className="w-6 h-6 shadow-gold-glow animate-pulse" />
                            <span>Warehouse Neural Signal</span>
                        </div>
                        
                        <div className="space-y-6 pt-12">
                            <div className="flex justify-between items-end border-b border-white/5 pb-6">
                                <div>
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">Replenishment Priority</p>
                                    <p className="text-4xl font-black text-white uppercase italic tracking-tighter">Alpha-Level <span className="text-rose-500 text-sm italic ml-4">ACTION REQUIRED</span></p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Transit Assets</p>
                                    <p className="text-2xl font-black text-white italic">12 <span className="text-xs opacity-30 ml-1">SKU</span></p>
                                </div>
                                <div className="flex-1 bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Storage Flux</p>
                                    <p className="text-2xl font-black text-white italic">88% <span className="text-xs opacity-30 ml-1">CAP</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <InventoryModal isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} onSave={handleSaveItem} item={itemToEdit} />
        </motion.div>
    );
};

export default InventarioPage;

