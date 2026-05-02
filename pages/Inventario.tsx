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

// --- COMPONENTES DE DISEÑO ELITE ---

const MetricCard: React.FC<{ 
    label: string, 
    value: string | number, 
    icon: any, 
    colorClass?: string,
    subValue?: string
}> = ({ label, value, icon: Icon, colorClass = "text-liquid-gold", subValue }) => (
    <motion.div 
        whileHover={{ y: -5, transition: { duration: 0.4 } }}
        className="bg-white/[0.03] backdrop-blur-3xl p-10 relative group overflow-hidden border border-white/5 rounded-[3rem] shadow-2xl"
    >
        <div className="absolute inset-0 bg-architect-grid opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-10 transition-all duration-1000 rotate-12 scale-150">
            <Icon className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 group-hover:border-liquid-gold/30 transition-all duration-500 shadow-inner">
                    <Icon className={`w-5 h-5 ${colorClass} group-hover:scale-110 transition-transform`} />
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">{label}</span>
                    <div className="h-[1px] w-8 bg-liquid-gold/20 group-hover:w-16 transition-all duration-700" />
                </div>
            </div>
            <div className="space-y-1">
                <p className={`text-5xl font-black tracking-tighter italic leading-none ${colorClass}`}>
                    {value}
                </p>
                {subValue && (
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">{subValue}</p>
                )}
            </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-liquid-gold/10 to-transparent"></div>
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
                className={`peer w-full bg-white/[0.02] border p-6 pt-9 pb-4 rounded-[2rem] text-white font-black text-lg focus:ring-4 transition-all uppercase italic appearance-none cursor-pointer outline-none
                    ${error
                        ? 'border-rose-500/30 focus:ring-rose-500/10 focus:border-rose-500/50'
                        : isHighlighted
                            ? 'border-liquid-gold/30 focus:ring-liquid-gold/10 focus:border-liquid-gold/50'
                            : 'border-white/5 focus:ring-liquid-gold/5 focus:border-liquid-gold/20'
                    }`}
                {...props}
            >
                {options?.map(opt => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                ))}
            </select>
        ) : (
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className={`peer w-full bg-white/[0.02] border p-6 pt-9 pb-4 rounded-[2rem] text-white font-black text-lg focus:ring-4 transition-all uppercase italic placeholder-transparent outline-none
                    ${error
                        ? 'border-rose-500/30 focus:ring-rose-500/10 focus:border-rose-500/50'
                        : isHighlighted
                            ? 'border-liquid-gold/30 focus:ring-liquid-gold/10 focus:border-liquid-gold/50'
                            : 'border-white/5 focus:ring-liquid-gold/5 focus:border-liquid-gold/20'
                    }`}
                placeholder={label}
                {...props}
            />
        )}
        <label htmlFor={name} className={`absolute left-7 top-4 text-[10px] font-black uppercase tracking-[0.4em] italic transition-all duration-500 pointer-events-none
            ${(type === 'select' || value !== '') ? 'opacity-100 -translate-y-1' : 'peer-placeholder-shown:top-7 peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-600 peer-focus:top-4 peer-focus:text-[10px] peer-focus:opacity-100'}
            ${error ? 'text-rose-500' : isHighlighted ? 'text-liquid-gold' : 'text-slate-500 peer-focus:text-liquid-gold'}`}>
            {label} {required && <span className="text-rose-500/50">*</span>}
        </label>
        {error && <p className="text-[9px] text-rose-500 font-black mt-2 uppercase tracking-widest bg-rose-500/10 px-4 py-2 rounded-xl inline-block absolute -bottom-8 left-6 z-20 shadow-2xl backdrop-blur-md">{error}</p>}
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 50 }}
                    className="bg-brand-dark border border-white/10 w-full max-w-xl overflow-hidden relative z-10 shadow-luxury rounded-[3.5rem]" 
                >
                    <div className="p-12 border-b border-white/5 bg-white/[0.01] flex justify-between items-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-architect-grid opacity-[0.02] pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Vínculo de <span className="text-gold-gradient">Activos</span></h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-3 italic">Protocolo de Registro Industrial</p>
                        </div>
                        <button onClick={onClose} className="p-5 bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 rounded-2xl transition-all border border-white/5 group">
                            <CloseIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500"/>
                        </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-12 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-liquid-gold/[0.01] to-transparent pointer-events-none" />
                        
                        <div className="space-y-10 relative z-10">
                            <div className="grid grid-cols-1 gap-8">
                                <InputField 
                                    label="Descriptor del Material" 
                                    name="item" 
                                    value={formData.item || ''} 
                                    onChange={e => setFormData({...formData, item: e.target.value})} 
                                    required 
                                    isHighlighted
                                />
                                <InputField 
                                    label="Alianza de Suministro (Proveedor)" 
                                    name="proveedorId" 
                                    type="select"
                                    value={formData.proveedorId || ''} 
                                    onChange={e => setFormData({...formData, proveedorId: e.target.value})} 
                                    options={[
                                        { value: '', label: 'SISTEMA: SIN PROVEEDOR ASIGNADO' },
                                        ...proveedores.map(p => ({ value: p.id, label: `👑 VINCULAR: ${p.nombre}` }))
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <InputField 
                                    label="Carga Inicial" 
                                    name="cantidad" 
                                    type="number"
                                    step="0.001"
                                    value={formData.cantidad || ''} 
                                    onChange={e => setFormData({...formData, cantidad: parseFloat(e.target.value)})} 
                                    required 
                                />
                                <InputField 
                                    label="Unidad_SI" 
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

                            <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
                                <div className="grid grid-cols-2 gap-8">
                                    <InputField 
                                        label="Valuación Unit ($)" 
                                        name="costoUnitario" 
                                        type="number"
                                        step="0.01"
                                        value={formData.costoUnitario || ''} 
                                        onChange={e => setFormData({...formData, costoUnitario: parseFloat(e.target.value)})} 
                                        required 
                                    />
                                    <InputField 
                                        label="Alerta de Reposición" 
                                        name="minimo" 
                                        type="number"
                                        step="0.1"
                                        value={formData.minimo || ''} 
                                        onChange={e => setFormData({...formData, minimo: parseFloat(e.target.value)})} 
                                        required 
                                        error={formData.cantidad !== undefined && formData.minimo !== undefined && formData.cantidad <= formData.minimo ? "CRITICAL STOCK LEVEL" : undefined}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 pt-10 relative z-10">
                            <button type="button" onClick={onClose} className="flex-1 py-7 text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] hover:text-white transition-all italic">Abortar</button>
                            <button type="submit" className="flex-[2.5] bg-liquid-gold text-brand-dark py-7 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-gold-glow italic">
                                EJECUTAR VÍNCULO_DE_ACTIVO
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
        <div className="max-w-[1600px] mx-auto space-y-16 pb-32 pt-8 animate-fade-in px-4 sm:px-12">
            {/* --- CABECERA ELITE --- */}
            <div className="flex flex-col gap-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="flex items-center gap-10">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] transition-all group shadow-2xl backdrop-blur-xl"
                        >
                            <HomeIcon className="w-6 h-6 text-slate-500 group-hover:text-liquid-gold transition-colors" />
                        </button>
                        <div className="w-[1px] h-28 bg-gradient-to-b from-transparent via-liquid-gold/40 to-transparent hidden md:block"></div>
                        <div className="space-y-5">
                            <div className="flex items-center gap-6">
                                <div className="h-[2px] w-16 bg-liquid-gold rounded-full shadow-gold-glow"></div>
                                <p className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] italic">CONTROL DE LOGÍSTICA ESTRATÉGICA</p>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
                                BÓVEDA DE <span className="text-gold-gradient">ACTIVOS</span>
                            </h1>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-5">
                        <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isImporting}
                            className="flex items-center justify-center gap-5 px-12 py-6 bg-white/5 border border-white/10 text-white font-black rounded-[2rem] shadow-luxury uppercase text-[11px] tracking-[0.3em] group disabled:opacity-50 hover:bg-white/10 transition-all italic"
                        >
                            {isImporting ? <Loader2Icon className="w-6 h-6 animate-spin text-liquid-gold" /> : <ArrowDownTrayIcon className="w-6 h-6 text-liquid-gold group-hover:-translate-y-1 transition-transform duration-500" />}
                            <span>IMPORT_MANIFEST</span>
                        </button>
                        <button 
                            onClick={() => setItemToEdit({})} 
                            className="flex items-center justify-center gap-5 px-14 py-6 bg-liquid-gold text-brand-dark font-black rounded-[2rem] shadow-gold-glow uppercase text-[11px] tracking-[0.3em] group hover:scale-[1.05] transition-all duration-500 italic"
                        >
                            <AddIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            <span>VINCULAR_RECURSO</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <MetricCard 
                        label="Capital Inmovilizado_Asset" 
                        value={formatCurrency(kpis.valorTotal).split(',')[0]} 
                        icon={InventoryIcon} 
                        colorClass="text-liquid-gold" 
                        subValue="VALORACIÓN TOTAL DEL ALMACÉN"
                    />
                    <MetricCard 
                        label="Sustratos Operativos_SI" 
                        value={kpis.totalItems} 
                        icon={BoxIcon} 
                        colorClass="text-white" 
                        subValue="REFERENCIAS TÉCNICAS ACTIVAS"
                    />
                    <MetricCard 
                        label="Alertas de Reposición_RED" 
                        value={kpis.bajoStock} 
                        icon={ExclamationTriangleIcon} 
                        colorClass={kpis.bajoStock > 0 ? "text-rose-500 animate-pulse" : "text-emerald-400"} 
                        subValue={kpis.bajoStock > 0 ? "SISTEMA REQUIERE SUMINISTROS" : "CADENA DE MANDO ESTABLE"}
                    />
                </div>

                <div className="relative group max-w-4xl">
                    <div className="absolute inset-0 bg-liquid-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-7 h-7 text-liquid-gold/40 group-focus-within:text-liquid-gold transition-colors" />
                    <input 
                        type="text" 
                        placeholder="IDENTIFICAR MATERIAL O REFERENCIA TÉCNICA..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-20 pr-10 py-8 bg-white/[0.02] border border-white/10 focus:border-liquid-gold/40 rounded-[2.5rem] text-[14px] font-black text-white uppercase tracking-[0.3em] placeholder:text-slate-800 outline-none focus:bg-white/[0.05] transition-all duration-700 backdrop-blur-md shadow-inner italic"
                    />
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 flex gap-3 opacity-20 group-focus-within:opacity-100 transition-opacity">
                        <div className="w-1.5 h-6 bg-liquid-gold/40 animate-pulse" />
                        <div className="w-1.5 h-6 bg-liquid-gold/20 animate-pulse delay-75" />
                    </div>
                </div>
            </div>

            {/* --- LISTADO DE INSUMOS ELITE --- */}
            <div className="space-y-10">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="py-52 flex flex-col items-center justify-center gap-10 border border-white/5 border-dashed rounded-[4rem] bg-white/[0.01]">
                            <div className="relative">
                                <Loader2Icon className="w-16 h-16 text-liquid-gold animate-spin" />
                                <div className="absolute inset-0 blur-2xl bg-liquid-gold/20 animate-pulse" />
                            </div>
                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-[1em] animate-pulse italic">SYNCHRONIZING_VAULT_DATA...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                            {filtered.map((item, idx) => {
                                const isLow = item.cantidad <= item.minimo;
                                const progress = Math.min(100, (item.cantidad / (item.minimo * 3)) * 100);
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05, duration: 0.8 }}
                                        key={item.id} 
                                        className={`group relative bg-white/[0.02] backdrop-blur-3xl p-12 flex flex-col gap-12 border ${isLow ? 'border-rose-500/20 shadow-rose-500/5' : 'border-white/5'} hover:border-liquid-gold/30 transition-all duration-700 rounded-[3.5rem] overflow-hidden`}
                                    >
                                        <div className="absolute inset-0 bg-architect-grid opacity-[0.02] pointer-events-none" />
                                        
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`px-5 py-2 rounded-full border text-[9px] font-black uppercase tracking-[0.3em] italic ${isLow ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                        {isLow ? 'CRITICAL_STOCK_LEVEL' : 'OPERATIONAL_SAFE'}
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl italic">TYPE: {item.unidad}</span>
                                                </div>
                                                <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter group-hover:text-liquid-gold transition-all duration-500 leading-tight">{item.item}</h4>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => setItemToEdit(item)} className="p-5 bg-white/5 hover:bg-liquid-gold text-slate-500 hover:text-brand-dark rounded-2xl transition-all border border-white/5 group-hover:border-liquid-gold/20 shadow-2xl">
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm("¿CONFIRMAR PURGA DE ACTIVO? Esta acción es irreversible.")) {
                                                            deleteInventoryItem(item.id);
                                                            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Retiró del almacén: ${item.item}`, 'Insumos');
                                                        }
                                                    }} 
                                                    className="p-5 bg-rose-500/5 hover:bg-rose-500 text-rose-500/30 hover:text-white rounded-2xl transition-all border border-rose-500/10 shadow-2xl"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                            <div className="space-y-6">
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">QUANTITY_RESERVE</p>
                                                <div className="flex items-end gap-4 text-white">
                                                    <span className={`text-7xl font-black italic tracking-tighter leading-none ${isLow ? 'text-rose-500' : 'text-white group-hover:text-liquid-gold transition-colors duration-500'}`}>{item.cantidad.toFixed(2)}</span>
                                                    <span className="text-xs font-black text-slate-700 uppercase pb-2 tracking-[0.3em] italic">{item.unidad}</span>
                                                </div>
                                                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[2px]">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${progress}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 2, ease: "easeOut" }}
                                                        className={`h-full rounded-full ${isLow ? 'bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.6)]' : 'bg-liquid-gold shadow-gold-glow'}`}
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-black/20 p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group-hover:border-liquid-gold/10 transition-colors">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic text-right">LIQUID_VALUATION</p>
                                                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent to-white/10 mt-3" />
                                                </div>
                                                <div className="text-right pt-6">
                                                    <p className="text-5xl font-black text-white italic tracking-tighter group-hover:text-liquid-gold transition-colors">{formatCurrency(item.cantidad * item.costoUnitario).split(',')[0]}<span className="text-lg opacity-20 ml-1 font-bold">.00</span></p>
                                                    <div className="flex justify-end items-center gap-3 mt-4">
                                                        <ShieldCheckIcon className="w-4 h-4 text-emerald-500/40" />
                                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest italic">Unit_Cost: {formatCurrency(item.costoUnitario)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-60 bg-white/[0.01] backdrop-blur-xl border-4 border-dashed border-white/5 rounded-[5rem] text-center flex flex-col items-center justify-center">
                            <div className="relative mb-12">
                                <BoxIcon className="w-32 h-32 text-slate-900 group-hover:text-liquid-gold/10 transition-all duration-1000" />
                                <div className="absolute inset-0 blur-3xl bg-white/5 rounded-full" />
                            </div>
                            <h3 className="text-4xl font-black text-slate-800 uppercase tracking-[0.6em] italic">BÓVEDA_SILENCIOSA</h3>
                            <p className="text-slate-900 text-xs font-black uppercase mt-6 tracking-[1em] italic opacity-30">NO_ASSETS_DETECTED_IN_DATABASE</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* --- ANALYTICS HUD --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white/[0.02] backdrop-blur-3xl p-16 rounded-[4rem] border border-white/5 relative group overflow-hidden shadow-luxury">
                    <div className="absolute inset-0 bg-architect-grid opacity-[0.03] pointer-events-none" />
                    <div className="absolute top-0 right-0 p-16 opacity-0 group-hover:opacity-[0.06] translate-x-1/4 -translate-y-1/4 group-hover:scale-125 transition-all duration-1000 rotate-12">
                        <TruckIcon className="w-96 h-96 text-liquid-gold" />
                    </div>
                    <div className="relative z-10 space-y-10">
                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-liquid-gold/10 rounded-[1.5rem] border border-liquid-gold/20 shadow-gold-glow/10">
                                <TrendingDownIcon className="w-8 h-8 text-liquid-gold" />
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">OPTIMIZACIÓN_DE <span className="text-gold-gradient">SUMINISTROS</span></h3>
                        </div>
                        <p className="text-slate-500 text-[12px] font-black leading-loose max-w-xl uppercase tracking-[0.3em] italic opacity-80">
                            Protocolo de analítica predictiva analizando la curva de consumo operativo para mitigar cuellos de botella en la fase de producción masiva.
                        </p>
                        <div className="flex items-center gap-20 pt-8">
                            <div className="space-y-3">
                                <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] italic">ÚLTIMO_EGRESO</p>
                                <p className="text-4xl font-black text-white italic tracking-tighter">-0.125 <span className="text-[14px] text-slate-600 font-bold uppercase tracking-widest">Resmas</span></p>
                            </div>
                            <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                            <div className="space-y-3">
                                <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] italic">SALUD_CADENA</p>
                                <div className="flex items-center gap-4">
                                    <p className="text-4xl font-black text-emerald-500 italic tracking-tighter">+92.4%</p>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-brand-dark p-16 rounded-[4rem] border border-white/5 relative group overflow-hidden shadow-luxury">
                    <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    <div className="relative z-10 h-full flex flex-col justify-between gap-12">
                        <div className="flex items-center gap-6 text-[12px] font-black text-liquid-gold uppercase tracking-[0.6em] italic">
                            <div className="relative">
                                <ActivityIcon className="w-8 h-8 animate-pulse" />
                                <div className="absolute inset-0 blur-lg bg-liquid-gold/30 animate-ping" />
                            </div>
                            <span>TELEMETRÍA_OPERATIVA_BODEGA</span>
                        </div>
                        
                        <div className="space-y-10">
                            <div className="flex justify-between items-end border-b border-white/5 pb-10">
                                <div className="space-y-2">
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] italic">PRIORIDAD_REPOSICIÓN</p>
                                    <p className="text-5xl font-black text-white uppercase italic tracking-tighter">NIVEL <span className="text-emerald-500">NOMINAL</span></p>
                                </div>
                                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <ShieldCheckIcon className="w-8 h-8 text-emerald-400" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 hover:border-liquid-gold/20 transition-all duration-500">
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mb-4 italic">LOTES_EN_TRÁNSITO</p>
                                    <div className="flex items-end gap-3">
                                        <p className="text-4xl font-black text-white italic tracking-tighter">04</p>
                                        <span className="text-[12px] text-slate-700 font-black uppercase tracking-widest pb-1 italic">Protocolos</span>
                                    </div>
                                </div>
                                <div className="bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 hover:border-liquid-gold/20 transition-all duration-500">
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mb-4 italic">CAPACIDAD_CARGA</p>
                                    <div className="flex items-end gap-3">
                                        <p className="text-4xl font-black text-white italic tracking-tighter">64.2%</p>
                                        <div className="w-20 h-[2px] bg-white/10 mb-3 rounded-full overflow-hidden">
                                            <div className="h-full bg-liquid-gold w-[64%]" />
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
