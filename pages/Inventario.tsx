import React, { useState, useEffect, useMemo } from 'react';
import { 
    BoxIcon, InventoryIcon, ExclamationTriangleIcon, AddIcon, PencilIcon, 
    SearchIcon, TrashIcon, CloseIcon, Loader2Icon, ActivityIcon, TrendingDownIcon,
    CubeIcon, TruckIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { InventoryItem, User } from '../types';
import { useData } from '../contexts/DataContext';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTES DE DISEÑO PREMIUM ---

const MetricCard: React.FC<{ 
    label: string, 
    value: string | number, 
    icon: any, 
    colorClass?: string 
}> = ({ label, value, icon: Icon, colorClass = "text-liquid-gold" }) => (
    <motion.div 
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="glass-card-luxury p-8 relative group overflow-hidden border-white/5"
    >
        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-5 transition-all duration-700">
            <Icon className="w-20 h-20 text-white" />
        </div>
        <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">{label}</span>
            </div>
            <p className={`text-4xl font-black tracking-tighter ${colorClass}`}>
                {value}
            </p>
        </div>
    </motion.div>
);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" }
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.98, opacity: 0 }}
                    className="glass-card-luxury w-full max-w-xl overflow-hidden relative z-10 border border-white/10 shadow-2xl rounded-[2rem]" 
                >
                    <div className="p-8 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Gestión de <span className="text-liquid-gold">Bodega</span></h2>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Control de Insumos y Materia Prima</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"><CloseIcon className="w-5 h-5"/></button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción del Insumo</label>
                            <input 
                                type="text" name="item" value={formData.item || ''} 
                                onChange={e => setFormData({...formData, item: e.target.value})} 
                                required className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-xl font-bold text-white italic focus:border-liquid-gold/50 outline-none transition-all" 
                                placeholder="Ej: Papel Couché 150g Brillante..." 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Existencia Actual</label>
                                <input 
                                    type="number" step="0.001" name="cantidad" value={formData.cantidad || ''} 
                                    onChange={e => setFormData({...formData, cantidad: parseFloat(e.target.value)})} 
                                    required className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-xl font-bold text-white focus:border-liquid-gold/50 outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidad de Medida</label>
                                <select 
                                    name="unidad" value={formData.unidad || 'Resmas'} 
                                    onChange={e => setFormData({...formData, unidad: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm font-bold text-white uppercase focus:border-liquid-gold/50 outline-none transition-all cursor-pointer"
                                >
                                    <option value="Resmas">Resmas</option>
                                    <option value="Pliegos">Pliegos</option>
                                    <option value="Metros">Metros</option>
                                    <option value="Unidades">Unidades</option>
                                    <option value="Kilos">Kilos</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                            <div className="space-y-3">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Costo Unitario ($)</label>
                                <input 
                                    type="number" step="0.01" name="costoUnitario" value={formData.costoUnitario || ''} 
                                    onChange={e => setFormData({...formData, costoUnitario: parseFloat(e.target.value)})} 
                                    required className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-xl font-bold text-white focus:border-liquid-gold/50 outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[9px] font-black text-rose-500/70 uppercase tracking-widest ml-1">Stock Mínimo (Alerta)</label>
                                <input 
                                    type="number" step="0.1" name="minimo" value={formData.minimo || ''} 
                                    onChange={e => setFormData({...formData, minimo: parseFloat(e.target.value)})} 
                                    required className="w-full bg-black/40 border border-rose-500/20 rounded-2xl py-5 px-6 text-xl font-bold text-rose-400 focus:border-rose-500/50 outline-none transition-all" 
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button type="button" onClick={onClose} className="flex-1 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" className="flex-[2] bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-liquid-gold transition-all active:scale-95">
                                Guardar en Bodega
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
            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Actualizó stock/detalles de: ${item.item}`, 'Inventario');
        } else {
            await addInventoryItem(item as any);
            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Registró nuevo insumo: ${item.item}`, 'Inventario');
        }
        setItemToEdit(null);
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-[1400px] mx-auto space-y-12 pb-20 px-4 sm:px-8"
        >
            {/* --- CABECERA --- */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-[1px] bg-liquid-gold/40"></div>
                        <span className="text-[10px] font-bold text-liquid-gold uppercase tracking-[0.6em]">Control de Existencias</span>
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Gestión de <span className="text-gold-gradient">Insumos</span>
                    </h1>
                </div>
                
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setItemToEdit({})} 
                    className="flex items-center gap-4 px-10 py-5 bg-white text-black font-black rounded-2xl shadow-lg uppercase text-[10px] tracking-widest group"
                >
                    <AddIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Registrar Insumo</span>
                </motion.button>
            </motion.div>

            {/* --- MÉTRICAS --- */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard label="Valoración en Bodega" value={formatCurrency(kpis.valorTotal).split(',')[0]} icon={InventoryIcon} colorClass="text-liquid-gold" />
                <MetricCard label="Ítems en Inventario" value={kpis.totalItems} icon={BoxIcon} colorClass="text-white" />
                <MetricCard label="Alertas de Stock" value={kpis.bajoStock} icon={ExclamationTriangleIcon} colorClass={kpis.bajoStock > 0 ? "text-rose-500 animate-pulse" : "text-emerald-500"} />
            </motion.div>

            {/* --- FILTROS --- */}
            <motion.div variants={itemVariants} className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                </div>
                <input 
                    type="text" 
                    placeholder="BUSCAR INSUMO O REFERENCIA..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-6 pl-16 pr-6 text-[11px] font-bold uppercase tracking-widest text-white placeholder:text-slate-600 focus:border-liquid-gold/30 outline-none transition-all"
                />
            </motion.div>

            {/* --- LISTADO DE INSUMOS --- */}
            <motion.div variants={itemVariants} className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-6 border border-white/5 border-dashed rounded-[2rem]">
                            <Loader2Icon className="w-12 h-12 text-liquid-gold/20 animate-spin" />
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic animate-pulse">Consultando base de datos...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {filtered.map((item, idx) => {
                                const isLow = item.cantidad <= item.minimo;
                                const progress = Math.min(100, (item.cantidad / (item.minimo * 3)) * 100);
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        key={item.id} 
                                        className={`group relative glass-card-luxury p-8 flex flex-col gap-8 border ${isLow ? 'border-rose-500/20' : 'border-white/5'} hover:border-liquid-gold/30 transition-all duration-300 rounded-[2rem] overflow-hidden`}
                                    >
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${isLow ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                                                        {isLow ? 'Stock Crítico' : 'Nivel Óptimo'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic">{item.unidad}</span>
                                                </div>
                                                <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter group-hover:text-liquid-gold transition-colors truncate max-w-md">{item.item}</h4>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setItemToEdit(item)} className="p-3 bg-white/5 hover:bg-white text-slate-400 hover:text-black rounded-xl transition-all border border-white/5">
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm("¿Confirmar eliminación de activo?")) {
                                                            deleteInventoryItem(item.id);
                                                            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Eliminó el insumo: ${item.item}`, 'Inventario');
                                                        }
                                                    }} 
                                                    className="p-3 bg-rose-500/5 hover:bg-rose-500 text-rose-500/50 hover:text-white rounded-xl transition-all border border-rose-500/10"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 relative z-10">
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Existencias</p>
                                                <div className="flex items-end gap-2 text-white">
                                                    <span className={`text-4xl font-black italic tracking-tighter ${isLow ? 'text-rose-500' : 'text-white'}`}>{item.cantidad.toFixed(2)}</span>
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase pb-1.5 italic">{item.unidad}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1 }}
                                                        className={`h-full ${isLow ? 'bg-rose-500' : 'bg-liquid-gold'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2 text-right">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Valorización</p>
                                                <p className="text-3xl font-black text-white italic tracking-tighter">{formatCurrency(item.cantidad * item.costoUnitario).split(',')[0]}<span className="text-sm opacity-30">.00</span></p>
                                                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">Costo: {formatCurrency(item.costoUnitario)}</p>
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
                            className="py-40 glass-card-luxury text-center flex flex-col items-center justify-center border-dashed border-white/5 rounded-[2rem]"
                        >
                            <BoxIcon className="w-20 h-20 text-slate-900 mb-6" />
                            <h3 className="text-2xl font-black text-slate-700 uppercase tracking-[0.3em] italic">Bodega Vacía</h3>
                            <p className="text-slate-800 text-[10px] font-bold uppercase mt-4 tracking-[0.5em] italic">No se detectaron registros de insumos</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* --- INSIGHTS --- */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card-luxury p-10 overflow-hidden group relative rounded-[2rem]">
                    <div className="absolute top-0 right-0 p-10 opacity-5 translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform duration-1000">
                        <TruckIcon className="w-48 h-48 text-liquid-gold" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-liquid-gold/10 rounded-xl border border-liquid-gold/20">
                                <TrendingDownIcon className="w-6 h-6 text-liquid-gold" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Análisis de <span className="text-gold-gradient">Suministros</span></h3>
                        </div>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-md uppercase tracking-widest">
                            Análisis de consumo en tiempo real integrado con los esquemas de producción para proyectar ciclos de reabastecimiento.
                        </p>
                        <div className="flex items-center gap-8">
                            <div>
                                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mb-1">Última Salida</p>
                                <p className="text-xl font-black text-white italic">-0.125 <span className="text-[10px] text-slate-600">RESMAS</span></p>
                            </div>
                            <div className="w-[1px] h-8 bg-white/5"></div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-widest mb-1">Eficiencia</p>
                                <p className="text-xl font-black text-emerald-500 italic">+4.2%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-950 p-10 rounded-[2rem] border border-white/5 relative group overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[80px] -translate-y-1/4 translate-x-1/4"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-center gap-4 text-[10px] font-bold text-liquid-gold uppercase tracking-widest">
                            <ActivityIcon className="w-5 h-5 animate-pulse" />
                            <span>Estado de Bodega</span>
                        </div>
                        
                        <div className="space-y-4 pt-8">
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Prioridad de Compra</p>
                                    <p className="text-2xl font-black text-white uppercase italic tracking-tighter">Nivel <span className="text-rose-500">Alto</span></p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Items en Tránsito</p>
                                    <p className="text-xl font-black text-white italic">12 <span className="text-[10px] opacity-30 ml-1">SKU</span></p>
                                </div>
                                <div className="flex-1 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Capacidad Usada</p>
                                    <p className="text-xl font-black text-white italic">88%</p>
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
