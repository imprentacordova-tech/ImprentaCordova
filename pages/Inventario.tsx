
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
        className="glass-card-luxury p-8 relative group overflow-hidden border-white/5 shadow-2xl"
    >
        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-10 transition-all duration-700">
            <Icon className="w-20 h-20 text-white" />
        </div>
        <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:border-liquid-gold/20 transition-colors">
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                </div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">{label}</span>
            </div>
            <p className={`text-4xl font-black tracking-tighter ${colorClass}`}>
                {value}
            </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent"></div>
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
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
};

const InventoryModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (item: Partial<InventoryItem>) => void; item: Partial<InventoryItem> | null }> = ({ isOpen, onClose, onSave, item }) => {
    const { proveedores } = useData();
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});
    
    useEffect(() => { 
        setFormData(item || { item: '', cantidad: 0, unidad: 'Resmas', costoUnitario: 0, minimo: 1 }); 
    }, [item]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex justify-center items-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="glass-card-luxury w-full max-w-xl overflow-hidden relative z-10 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-[2.5rem]" 
                >
                    <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Control de <span className="text-liquid-gold">Insumos</span></h2>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ingreso al Almacén del Atelier</p>
                        </div>
                        <button onClick={onClose} className="p-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/5"><CloseIcon className="w-5 h-5"/></button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción del Material</label>
                                <input 
                                    type="text" name="item" value={formData.item || ''} 
                                    onChange={e => setFormData({...formData, item: e.target.value})} 
                                    required className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-xl font-bold text-white italic focus:border-liquid-gold/50 outline-none transition-all placeholder:text-slate-800" 
                                    placeholder="Ej: Papel Couché 150g..." 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Alianza Estratégica (Proveedor)</label>
                                <select 
                                    name="proveedorId" value={formData.proveedorId || ''} 
                                    onChange={e => setFormData({...formData, proveedorId: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm font-black text-white focus:border-liquid-gold/50 outline-none transition-all cursor-pointer uppercase italic"
                                >
                                    <option value="" className="bg-slate-900">SIN PROVEEDOR ASIGNADO</option>
                                    {proveedores.map(p => (
                                        <option key={p.id} value={p.id} className="bg-slate-900">👑 {p.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Existencias</label>
                                <input 
                                    type="number" step="0.001" name="cantidad" value={formData.cantidad || ''} 
                                    onChange={e => setFormData({...formData, cantidad: parseFloat(e.target.value)})} 
                                    required className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-xl font-bold text-white focus:border-liquid-gold/50 outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidad</label>
                                <select 
                                    name="unidad" value={formData.unidad || 'Resmas'} 
                                    onChange={e => setFormData({...formData, unidad: e.target.value})} 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm font-black text-white uppercase focus:border-liquid-gold/50 outline-none transition-all cursor-pointer"
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
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Inversión Unit ($)</label>
                                <input 
                                    type="number" step="0.01" name="costoUnitario" value={formData.costoUnitario || ''} 
                                    onChange={e => setFormData({...formData, costoUnitario: parseFloat(e.target.value)})} 
                                    required className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-xl font-bold text-white focus:border-liquid-gold/50 outline-none transition-all" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[9px] font-black text-rose-500/70 uppercase tracking-widest ml-1">Límite de Alerta</label>
                                <input 
                                    type="number" step="0.1" name="minimo" value={formData.minimo || ''} 
                                    onChange={e => setFormData({...formData, minimo: parseFloat(e.target.value)})} 
                                    required className="w-full bg-black/40 border border-rose-500/20 rounded-2xl py-5 px-6 text-xl font-bold text-rose-400 focus:border-rose-500/50 outline-none transition-all" 
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-8">
                            <button type="button" onClick={onClose} className="flex-1 py-5 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" className="flex-[2] bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-liquid-gold transition-all active:scale-95 shadow-xl shadow-white/5">
                                Registrar en Almacén
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
            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Actualizó existencias: ${item.item}`, 'Insumos');
        } else {
            await addInventoryItem(item as any);
            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Registró nuevo material: ${item.item}`, 'Insumos');
        }
        setItemToEdit(null);
    };

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-[1400px] mx-auto space-y-12 pb-32 px-6 sm:px-12"
        >
            {/* --- CABECERA --- */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-[1px] bg-liquid-gold/40"></div>
                        <span className="text-[10px] font-bold text-liquid-gold uppercase tracking-[0.6em]">Almacén de Atelier</span>
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Gestión de <span className="text-gold-gradient">Insumos</span>
                    </h1>
                </div>
                
                <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setItemToEdit({})} 
                    className="flex items-center gap-4 px-12 py-5 bg-white text-black font-black rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.1)] uppercase text-[10px] tracking-[0.2em] group"
                >
                    <AddIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    <span>Nuevo Registro</span>
                </motion.button>
            </motion.div>

            {/* --- MÉTRICAS --- */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard label="Inversión en Almacén" value={formatCurrency(kpis.valorTotal).split(',')[0]} icon={InventoryIcon} colorClass="text-liquid-gold" />
                <MetricCard label="Materias Primas" value={kpis.totalItems} icon={BoxIcon} colorClass="text-white" />
                <MetricCard label="Existencias Críticas" value={kpis.bajoStock} icon={ExclamationTriangleIcon} colorClass={kpis.bajoStock > 0 ? "text-rose-500 animate-pulse" : "text-emerald-500"} />
            </motion.div>

            {/* --- FILTROS --- */}
            <motion.div variants={itemVariants} className="relative group">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-slate-600 group-focus-within:text-liquid-gold transition-colors" />
                </div>
                <input 
                    type="text" 
                    placeholder="LOCALIZAR MATERIAL O REFERENCIA TÉCNICA..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full bg-white/[0.02] border border-white/10 rounded-[2rem] py-7 pl-16 pr-8 text-[11px] font-black uppercase tracking-[0.3em] text-white placeholder:text-slate-800 focus:border-liquid-gold/20 outline-none transition-all shadow-inner"
                />
            </motion.div>

            {/* --- LISTADO DE INSUMOS --- */}
            <motion.div variants={itemVariants} className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-6 border border-white/5 border-dashed rounded-[3rem]">
                            <Loader2Icon className="w-12 h-12 text-liquid-gold/20 animate-spin" />
                            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.8em] animate-pulse">Sincronizando Almacén...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {filtered.map((item, idx) => {
                                const isLow = item.cantidad <= item.minimo;
                                const progress = Math.min(100, (item.cantidad / (item.minimo * 3)) * 100);
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.02, ease: [0.22, 1, 0.36, 1] }}
                                        key={item.id} 
                                        className={`group relative glass-card-luxury p-10 flex flex-col gap-10 border ${isLow ? 'border-rose-500/20' : 'border-white/5'} hover:border-liquid-gold/20 transition-all duration-500 rounded-[2.5rem] overflow-hidden`}
                                    >
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border ${isLow ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                                                        {isLow ? 'Reposición Urgente' : 'Estado Saludable'}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{item.unidad}</span>
                                                    {item.proveedorId && (
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-liquid-gold/5 text-liquid-gold border border-liquid-gold/10">
                                                            👑 ASOCIADO
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter group-hover:text-liquid-gold transition-colors leading-tight">{item.item}</h4>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => setItemToEdit(item)} className="p-4 bg-white/5 hover:bg-white text-slate-400 hover:text-black rounded-2xl transition-all border border-white/5 shadow-lg">
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm("¿Confirmar retiro definitivo del activo?")) {
                                                            deleteInventoryItem(item.id);
                                                            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Retiró del almacén: ${item.item}`, 'Insumos');
                                                        }
                                                    }} 
                                                    className="p-4 bg-rose-500/5 hover:bg-rose-500 text-rose-500/40 hover:text-white rounded-2xl transition-all border border-rose-500/10 shadow-lg"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-10 relative z-10">
                                            <div className="space-y-4">
                                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Existencias Disponibles</p>
                                                <div className="flex items-end gap-3 text-white">
                                                    <span className={`text-5xl font-black italic tracking-tighter ${isLow ? 'text-rose-500' : 'text-white'}`}>{item.cantidad.toFixed(2)}</span>
                                                    <span className="text-[10px] font-black text-slate-700 uppercase pb-2 tracking-widest italic">{item.unidad}</span>
                                                </div>
                                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className={`h-full ${isLow ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-liquid-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-right flex flex-col justify-end">
                                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Valorización de Activo</p>
                                                <p className="text-4xl font-black text-white italic tracking-tighter">{formatCurrency(item.cantidad * item.costoUnitario).split(',')[0]}<span className="text-sm opacity-20 ml-1">.00</span></p>
                                                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.2em]">Costo Ref: {formatCurrency(item.costoUnitario)}</p>
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
                            className="py-40 glass-card-luxury text-center flex flex-col items-center justify-center border-dashed border-white/5 rounded-[3rem]"
                        >
                            <BoxIcon className="w-24 h-24 text-slate-900/50 mb-8" />
                            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-[0.4em] italic">Almacén Desierto</h3>
                            <p className="text-slate-900 text-[10px] font-black uppercase mt-6 tracking-[0.8em] italic opacity-50">No se detectaron registros de materias primas</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* --- INSIGHTS --- */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="glass-card-luxury p-12 overflow-hidden group relative rounded-[3rem] border-white/5">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] translate-x-1/4 -translate-y-1/4 group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-1000">
                        <TruckIcon className="w-64 h-64 text-liquid-gold" />
                    </div>
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-liquid-gold/10 rounded-2xl border border-liquid-gold/20 shadow-gold-glow/5">
                                <TrendingDownIcon className="w-7 h-7 text-liquid-gold" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Optimización de <span className="text-gold-gradient">Suministros</span></h3>
                        </div>
                        <p className="text-slate-500 text-[11px] font-bold leading-relaxed max-w-lg uppercase tracking-[0.2em]">
                            Analítica de consumo proyectada según órdenes activas para mitigar cuellos de botella en la producción.
                        </p>
                        <div className="flex items-center gap-12">
                            <div>
                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Último Egreso</p>
                                <p className="text-2xl font-black text-white italic">-0.125 <span className="text-[12px] text-slate-600 font-bold">RESMAS</span></p>
                            </div>
                            <div className="w-[1px] h-12 bg-white/5"></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Salud de Stock</p>
                                <p className="text-2xl font-black text-emerald-500 italic">+92%</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-950/50 p-12 rounded-[3rem] border border-white/5 relative group overflow-hidden shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div className="flex items-center gap-5 text-[10px] font-black text-liquid-gold uppercase tracking-[0.5em]">
                            <ActivityIcon className="w-6 h-6 animate-pulse" />
                            <span>Estado Operativo de Bodega</span>
                        </div>
                        
                        <div className="space-y-6 pt-10">
                            <div className="flex justify-between items-end border-b border-white/5 pb-6">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Prioridad de Reposición</p>
                                    <p className="text-3xl font-black text-white uppercase italic tracking-tighter">Nivel <span className="text-emerald-500">Normal</span></p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div className="bg-white/[0.01] p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Items en Tránsito</p>
                                    <p className="text-2xl font-black text-white italic">04 <span className="text-[12px] opacity-20 ml-1 font-bold">Lotes</span></p>
                                </div>
                                <div className="bg-white/[0.01] p-6 rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Ocupación Vol.</p>
                                    <p className="text-2xl font-black text-white italic">64%</p>
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
