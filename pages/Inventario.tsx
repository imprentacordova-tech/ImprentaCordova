import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { 
    BoxIcon, InventoryIcon, ExclamationTriangleIcon, AddIcon, PencilIcon, 
    SearchIcon, TrashIcon, CloseIcon, Loader2Icon, ActivityIcon, TrendingDownIcon,
    CubeIcon, TruckIcon, ArrowDownTrayIcon, ShieldCheckIcon, SparklesIcon,
    ArrowRightIcon, HomeIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { InventoryItem, User } from '../types';
import { useData } from '../contexts/DataContext';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTES DE DISEÑO ---

const MetricCard: React.FC<{ 
    label: string, 
    value: string | number, 
    icon: any, 
    colorClass?: string,
    subValue?: string
}> = ({ label, value, icon: Icon, colorClass = "text-brand-blue", subValue }) => (
    <motion.div 
        whileHover={{ y: -5, transition: { duration: 0.3 } }}
        className="bg-obsidian-card p-8 relative group overflow-hidden border border-white/[0.06] rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300"
    >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-all duration-500 rotate-12 scale-150">
            <Icon className="w-24 h-24 text-white" />
        </div>
        <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 group-hover:border-brand-blue/30 transition-all duration-500">
                    <Icon className={`w-5 h-5 ${colorClass} group-hover:scale-110 transition-transform`} />
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">{label}</span>
                </div>
            </div>
            <div className="space-y-1">
                <p className={`text-4xl font-black tracking-tight leading-none ${colorClass}`}>
                    {value}
                </p>
                {subValue && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subValue}</p>
                )}
            </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-blue/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
    </motion.div>
);

const InputField: React.FC<{
    label: string;
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<any>) => void;
    type?: string;
    isHighlighted?: boolean;
    error?: string;
    required?: boolean;
    options?: {value: string, label: string}[];
    [key: string]: any;
}> = ({ label, name, value, onChange, type = 'text', isHighlighted, error, required, options, ...props }) => (
    <div className="relative group">
        {type === 'select' ? (
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                className={`peer w-full bg-white/[0.04] border p-6 pt-9 pb-4 rounded-2xl text-white font-bold text-lg focus:ring-4 transition-all outline-none appearance-none cursor-pointer
                    ${error
                        ? 'border-rose-200 focus:ring-rose-500/5 focus:border-rose-400'
                        : isHighlighted
                            ? 'border-brand-blue/20 focus:ring-brand-blue/5 focus:border-brand-blue/40'
                            : 'border-white/[0.06] focus:ring-brand-blue/5 focus:border-brand-blue/20'
                    }`}
                {...props}
            >
                {options?.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-white">{opt.label}</option>
                ))}
            </select>
        ) : (
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className={`peer w-full bg-white/[0.04] border p-6 pt-9 pb-4 rounded-2xl text-white font-bold text-lg focus:ring-4 transition-all placeholder-transparent outline-none
                    ${error
                        ? 'border-rose-200 focus:ring-rose-500/5 focus:border-rose-400'
                        : isHighlighted
                            ? 'border-brand-blue/20 focus:ring-brand-blue/5 focus:border-brand-blue/40'
                            : 'border-white/[0.06] focus:ring-brand-blue/5 focus:border-brand-blue/20'
                    }`}
                placeholder={label}
                {...props}
            />
        )}
        <label htmlFor={name} className={`absolute left-6 top-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 pointer-events-none
            ${(type === 'select' || value !== '') ? 'opacity-100 -translate-y-1' : 'peer-placeholder-shown:top-7 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-focus:top-4 peer-focus:text-[10px] peer-focus:opacity-100'}
            ${error ? 'text-rose-500' : isHighlighted ? 'text-brand-blue' : 'text-slate-500 peer-focus:text-brand-blue'}`}>
            {label} {required && <span className="text-rose-500/50">*</span>}
        </label>
        {error && <p className="text-[9px] text-rose-500 font-black mt-2 uppercase tracking-widest bg-rose-500/5 px-4 py-2 rounded-xl inline-block absolute -bottom-8 left-4 z-20 shadow-sm border border-rose-100">{error}</p>}
    </div>
);

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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 30 }}
                    className="bg-obsidian-card border border-white/[0.06] w-full max-w-xl overflow-hidden relative z-10 shadow-2xl rounded-[2.5rem]" 
                >
                    <div className="p-10 border-b border-white/[0.06] bg-white/[0.04] flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Gestión de <span className="text-brand-blue">Activos</span></h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">REGISTRO DE INVENTARIO ESTRATÉGICO</p>
                        </div>
                        <button onClick={onClose} className="p-4 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all group">
                            <CloseIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"/>
                        </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-8">
                            <InputField 
                                label="Nombre del Material" 
                                name="item" 
                                value={formData.item || ''} 
                                onChange={e => setFormData({...formData, item: e.target.value})} 
                                required 
                                isHighlighted
                            />
                            <InputField 
                                label="Proveedor Vinculado" 
                                name="proveedorId" 
                                type="select"
                                value={formData.proveedorId || ''} 
                                onChange={e => setFormData({...formData, proveedorId: e.target.value})} 
                                options={[
                                    { value: '', label: 'SELECCIONAR PROVEEDOR' },
                                    ...proveedores.map(p => ({ value: p.id, label: `${p.nombre}` }))
                                ]}
                            />

                            <div className="grid grid-cols-2 gap-6">
                                <InputField 
                                    label="Cantidad Actual" 
                                    name="cantidad" 
                                    type="number"
                                    step="0.001"
                                    value={formData.cantidad || ''} 
                                    onChange={e => setFormData({...formData, cantidad: parseFloat(e.target.value)})} 
                                    required 
                                />
                                <InputField 
                                    label="Unidad de Medida" 
                                    name="unidad" 
                                    type="select"
                                    value={formData.unidad || 'Resmas'} 
                                    onChange={e => setFormData({...formData, unidad: e.target.value})} 
                                    options={[
                                        { value: 'Resmas', label: 'Resmas' },
                                        { value: 'Pliegos', label: 'Pliegos' },
                                        { value: 'Metros', label: 'Metros' },
                                        { value: 'Unidades', label: 'Unidades' },
                                        { value: 'Kilos', label: 'Kilos' }
                                    ]}
                                />
                            </div>

                            <div className="p-6 bg-white/[0.04] border border-white/[0.06] rounded-2xl grid grid-cols-2 gap-6">
                                <InputField 
                                    label="Costo Unitario ($)" 
                                    name="costoUnitario" 
                                    type="number"
                                    step="0.01"
                                    value={formData.costoUnitario || ''} 
                                    onChange={e => setFormData({...formData, costoUnitario: parseFloat(e.target.value)})} 
                                    required 
                                />
                                <InputField 
                                    label="Stock Mínimo Alerta" 
                                    name="minimo" 
                                    type="number"
                                    step="0.1"
                                    value={formData.minimo || ''} 
                                    onChange={e => setFormData({...formData, minimo: parseFloat(e.target.value)})} 
                                    required 
                                    error={formData.cantidad !== undefined && formData.minimo !== undefined && formData.cantidad <= formData.minimo ? "STOCK BAJO" : undefined}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button type="button" onClick={onClose} className="flex-1 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all">Cancelar</button>
                            <button type="submit" className="flex-[2] bg-brand-blue text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all active:scale-95">
                                GUARDAR RECURSO
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
    const navigate = useNavigate();
    const { inventario, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [itemToEdit, setItemToEdit] = useState<Partial<InventoryItem> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async function(results) {
                try {
                    for (const row of results.data as any[]) {
                        const itemStr = row['ITEM'] || row['item'] || row['Descripción'];
                        if (!itemStr) continue;
                        
                        const cantidad = parseFloat(row['CANTIDAD'] || row['cantidad'] || row['Existencias']) || 0;
                        const minimo = parseFloat(row['MINIMO'] || row['minimo'] || row['Límite']) || 1;
                        const costo = parseFloat(row['COSTO'] || row['costo'] || row['Inversión']) || 0;
                        const unidad = row['UNIDAD'] || row['unidad'] || 'Unidades';
                        
                        await addInventoryItem({
                            item: itemStr,
                            cantidad: cantidad,
                            minimo: minimo,
                            costoUnitario: costo,
                            unidad: unidad,
                            fechaUltimaCompra: new Date().toISOString()
                        } as any);
                    }
                    logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Importó inventario en bloque`, 'Insumos');
                } catch (err) {
                    console.error("Error importando CSV de inventario", err);
                } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            },
            error: function(err) {
                console.error("Error parsing CSV", err);
                setIsImporting(false);
            }
        });
    };

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
        
        if (item.cantidad !== undefined && item.minimo !== undefined && item.cantidad <= item.minimo) {
            logActivity(currentUser.nombre, currentUser.rol, 'ALERTA_STOCK', `Stock crítico de ${item.item}: ${item.cantidad} ${item.unidad || 'Unidades'}`, 'Insumos');
        }
        
        setItemToEdit(null);
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-32 pt-8 animate-fade-in px-6 sm:px-12 min-h-screen">
            {/* --- CABECERA --- */}
            <div className="flex flex-col gap-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/[0.06] pb-10">
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-5 bg-obsidian-card border border-white/[0.06] rounded-2xl hover:border-brand-blue transition-all group shadow-sm"
                        >
                            <HomeIcon className="w-5 h-5 text-slate-400 group-hover:text-brand-blue transition-colors" />
                        </button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-blue" />
                                <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Gestión de Recursos & Insumos</p>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                                Control de Inventario <span className="text-brand-blue font-bold">• Insumos</span>
                            </h1>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
                        <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isImporting}
                            className="flex items-center justify-center gap-3 px-8 py-4 bg-obsidian-card border border-white/[0.06] text-slate-200 font-bold rounded-2xl shadow-sm uppercase text-[10px] tracking-widest group disabled:opacity-50 hover:bg-white/[0.04] transition-all"
                        >
                            {isImporting ? <Loader2Icon className="w-4 h-4 animate-spin text-brand-blue" /> : <ArrowDownTrayIcon className="w-4 h-4 text-brand-blue group-hover:-translate-y-0.5 transition-transform" />}
                            <span>IMPORTAR_CSV</span>
                        </button>
                        <button 
                            onClick={() => setItemToEdit({})} 
                            className="flex items-center justify-center gap-3 px-10 py-4 bg-brand-blue text-white font-bold rounded-2xl shadow-lg shadow-brand-blue/20 uppercase text-[10px] tracking-widest group hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <AddIcon className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            <span>VINCULAR_RECURSO</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard 
                        label="Inversión en Almacén" 
                        value={formatCurrency(kpis.valorTotal).split(',')[0]} 
                        icon={InventoryIcon} 
                        colorClass="text-brand-blue" 
                        subValue="VALOR TOTAL DE ACTIVOS"
                    />
                    <MetricCard 
                        label="Sustratos en Stock" 
                        value={kpis.totalItems} 
                        icon={BoxIcon} 
                        colorClass="text-slate-900" 
                        subValue="MATERIALES REGISTRADOS"
                    />
                    <MetricCard 
                        label="Alertas de Reposición" 
                        value={kpis.bajoStock} 
                        icon={ExclamationTriangleIcon} 
                        colorClass={kpis.bajoStock > 0 ? "text-rose-500 animate-pulse" : "text-emerald-500"} 
                        subValue={kpis.bajoStock > 0 ? "REQUIERE ATENCIÓN" : "NIVELES ÓPTIMOS"}
                    />
                </div>

                <div className="relative group max-w-2xl">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
                    <input 
                        type="text" 
                        placeholder="IDENTIFICAR MATERIAL O REFERENCIA..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-16 pr-6 py-6 bg-obsidian-card border border-white/[0.06] focus:border-brand-blue/40 rounded-2xl text-[12px] font-bold text-slate-200 uppercase tracking-widest placeholder:text-slate-300 outline-none shadow-sm transition-all"
                    />
                </div>
            </div>

            {/* --- LISTADO DE INSUMOS --- */}
            <div className="space-y-8">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-white/[0.06] rounded-[3rem] bg-obsidian-card/50">
                            <Loader2Icon className="w-12 h-12 text-brand-blue opacity-20 animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] animate-pulse">SINCRONIZANDO BÓVEDA...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {filtered.map((item, idx) => {
                                const isLow = item.cantidad <= item.minimo;
                                const progress = Math.min(100, (item.cantidad / (item.minimo * 3)) * 100);
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05, duration: 0.5 }}
                                        key={item.id} 
                                        className={`group relative bg-obsidian-card p-10 flex flex-col gap-10 border ${isLow ? 'border-rose-200 shadow-rose-100/50' : 'border-white/[0.06]'} hover:border-brand-blue/30 hover:shadow-xl transition-all duration-500 rounded-[2.5rem] overflow-hidden`}
                                    >
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${isLow ? 'bg-brand-red/10 text-brand-red border-brand-red/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                        {isLow ? 'STOCK_CRÍTICO' : 'OPERATIVO'}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/[0.06]">{item.unidad}</span>
                                                </div>
                                                <h4 className="text-3xl font-black text-white uppercase tracking-tight group-hover:text-brand-blue transition-colors">{item.item}</h4>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => setItemToEdit(item)} className="p-4 bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-brand-blue hover:bg-brand-blue/5 rounded-xl transition-all">
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm("¿CONFIRMAR ELIMINACIÓN DE ACTIVO?")) {
                                                            deleteInventoryItem(item.id);
                                                            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Retiró del almacén: ${item.item}`, 'Insumos');
                                                        }
                                                    }} 
                                                    className="p-4 bg-rose-50 border border-rose-100 text-rose-300 hover:text-rose-500 rounded-xl transition-all"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                            <div className="space-y-5">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">EXISTENCIAS EN BÓVEDA</p>
                                                <div className="flex items-end gap-3">
                                                    <span className={`text-2xl font-black tracking-tight leading-none ${isLow ? 'text-rose-500' : 'text-white group-hover:text-brand-blue transition-colors duration-300'}`}>{item.cantidad.toFixed(2)}</span>
                                                    <span className="text-xs font-bold text-slate-400 uppercase pb-1 tracking-widest">{item.unidad}</span>
                                                </div>
                                                <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.06]">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${progress}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className={`h-full rounded-full ${isLow ? 'bg-rose-500 shadow-sm' : 'bg-brand-blue shadow-sm'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-white/[0.04] p-6 rounded-[1.5rem] border border-white/[0.06] flex flex-col justify-between text-right">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VALORACIÓN_ESTIMADA</p>
                                                    <div className="h-[1px] w-full bg-slate-200/50 mt-3" />
                                                </div>
                                                <div className="pt-4">
                                                    <p className="text-4xl font-black text-white tracking-tight group-hover:text-brand-blue transition-colors">{formatCurrency(item.cantidad * item.costoUnitario).split(',')[0]}<span className="text-base opacity-20 ml-0.5 font-bold">.00</span></p>
                                                    <div className="flex justify-end items-center gap-2 mt-2">
                                                        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500 opacity-40" />
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Costo: {formatCurrency(item.costoUnitario)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-40 bg-obsidian-card border border-white/[0.06] border-dashed rounded-[3rem] text-center flex flex-col items-center justify-center">
                            <BoxIcon className="w-24 h-24 text-slate-100 mb-6" />
                            <h3 className="text-2xl font-black text-slate-200 uppercase tracking-widest">Bóveda Vacía</h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase mt-2 tracking-[0.4em]">NO SE HAN DETECTADO ACTIVOS REGISTRADOS</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- ANALYTICS HUD --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-obsidian-card p-12 rounded-[3rem] border border-white/[0.06] relative group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] translate-x-1/4 -translate-y-1/4 group-hover:scale-125 transition-all duration-1000 rotate-12">
                        <TruckIcon className="w-80 h-80 text-brand-blue" />
                    </div>
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
                                <TrendingDownIcon className="w-6 h-6 text-brand-blue" />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Análisis de <span className="text-brand-blue">Consumo</span></h3>
                        </div>
                        <p className="text-slate-400 text-[11px] font-bold leading-loose max-w-md uppercase tracking-widest">
                            Monitoreo preventivo de la cadena de suministro para evitar interrupciones en la fase de producción masiva.
                        </p>
                        <div className="flex items-center gap-16 pt-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ÚLTIMO EGRESO</p>
                                <p className="text-3xl font-black text-white tracking-tight">-0.125 <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Resmas</span></p>
                            </div>
                            <div className="w-[1px] h-12 bg-white/[0.06]"></div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SALUD_STOCK</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-3xl font-black text-emerald-500 tracking-tight">+92.4%</p>
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-obsidian-card p-12 rounded-[3rem] border border-white/[0.06] relative group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/[0.05] to-transparent"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between gap-10">
                        <div className="flex items-center gap-4 text-[11px] font-black text-brand-blue uppercase tracking-[0.5em]">
                            <ActivityIcon className="w-6 h-6 animate-pulse" />
                            <span>TELEMETRÍA_BODEGA</span>
                        </div>
                        
                        <div className="space-y-8">
                            <div className="flex justify-between items-end border-b border-white/[0.06] pb-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">PRIORIDAD REPOSICIÓN</p>
                                    <p className="text-4xl font-black text-white uppercase tracking-tight">NIVEL <span className="text-emerald-500">NOMINAL</span></p>
                                </div>
                                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <ShieldCheckIcon className="w-6 h-6 text-emerald-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white/[0.04] p-6 rounded-2xl border border-white/[0.06] hover:border-brand-blue/20 transition-all">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">LOTES_ACTIVOS</p>
                                    <div className="flex items-end gap-2">
                                        <p className="text-3xl font-black text-white tracking-tight">04</p>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pb-1">Protocolos</span>
                                    </div>
                                </div>
                                <div className="bg-white/[0.04] p-6 rounded-2xl border border-white/[0.06] hover:border-brand-blue/20 transition-all">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">ALMACENAMIENTO</p>
                                    <div className="flex items-end gap-3">
                                        <p className="text-3xl font-black text-white tracking-tight">64.2%</p>
                                        <div className="w-16 h-1 bg-white/[0.04] mb-3 rounded-full overflow-hidden">
                                            <div className="h-full bg-brand-blue w-[64%]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <InventoryModal isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} onSave={handleSaveItem} item={itemToEdit} />
        </div>
    );
};

export default InventarioPage;

