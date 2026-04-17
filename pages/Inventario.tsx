
import React, { useState, useEffect, useMemo } from 'react';
// FIX: Added missing Loader2Icon to imports
import { BoxIcon, InventoryIcon, ExclamationTriangleIcon, AddIcon, PencilIcon, ArrowUpIcon, ArrowDownIcon, SearchIcon, TrashIcon, CloseIcon, ClockIcon, LayersIcon, Loader2Icon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { InventoryItem } from '../types';
import { useData } from '../contexts/DataContext';

type SortKey = keyof InventoryItem | 'valorTotal';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: 'blue' | 'green' | 'red' }> = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: { bg: 'bg-brand-blue/10', text: 'text-brand-blue', border: 'border-brand-blue/30' },
        green: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
        red: { bg: 'bg-brand-red/10', text: 'text-brand-red', border: 'border-brand-red/30' },
    };
    const classes = colors[color];
    return (
        <div className={`p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border ${classes.border} flex items-center gap-6 group hover:translate-y-[-4px] transition-all duration-500`}>
            <div className={`p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl group-hover:scale-110 transition-transform`}>
                <Icon className={`h-8 w-8 ${classes.text}`} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
                <p className="text-3xl font-black text-white leading-none tracking-tighter">{value}</p>
            </div>
        </div>
    );
};

const ItemFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (item: Partial<InventoryItem>) => void; itemToEdit: Partial<InventoryItem> | null }> = ({ isOpen, onClose, onSave, itemToEdit }) => {
    const [formData, setFormData] = useState<Partial<InventoryItem>>({});
    useEffect(() => { setFormData(itemToEdit || { item: '', cantidad: 0, unidad: 'Resmas', costoUnitario: 0, minimo: 1 }); }, [itemToEdit]);
    if (!isOpen) return null;
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData({ ...formData, [name]: type === 'number' ? parseFloat(value) : value });
    };
    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-3xl w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-8 border-b dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-black uppercase tracking-tighter">{formData.id ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-400" /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Material</label>
                        <input name="item" value={formData.item || ''} onChange={handleChange} required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-brand-blue" placeholder="EJ: PAPEL QUIMICO ORIGINAL" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cantidad Stock</label>
                            <input name="cantidad" type="number" step="0.001" value={formData.cantidad || ''} onChange={handleChange} required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-brand-blue" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unidad</label>
                            <select name="unidad" value={formData.unidad || 'Resmas'} onChange={handleChange as any} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-brand-blue appearance-none">
                                <option value="Resmas">Resmas (500h)</option>
                                <option value="Pliegos">Pliegos</option>
                                <option value="Metros">Metros</option>
                                <option value="Unidades">Unidades</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Costo Unit.</label>
                            <input name="costoUnitario" type="number" step="0.01" value={formData.costoUnitario || ''} onChange={handleChange} required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-brand-blue" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Stock Mínimo</label>
                            <input name="minimo" type="number" step="0.1" value={formData.minimo || ''} onChange={handleChange} required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl font-bold focus:ring-2 focus:ring-brand-blue" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-4 text-slate-400 font-bold uppercase text-[10px]">Cancelar</button>
                        <button type="submit" className="px-10 py-4 bg-brand-blue text-white font-black rounded-2xl shadow-xl hover:bg-slate-950 transition-all uppercase text-[10px] tracking-widest">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const InventarioPage: React.FC = () => {
    const { inventario, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [itemToEdit, setItemToEdit] = useState<Partial<InventoryItem> | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

    const kpis = useMemo(() => {
        const valorTotal = inventario.reduce((sum, item) => sum + (item.cantidad * item.costoUnitario), 0);
        const bajoStock = inventario.filter(item => item.cantidad <= item.minimo).length;
        return { valorTotal, totalItems: inventario.length, bajoStock };
    }, [inventario]);

    const filtered = useMemo(() => 
        inventario.filter(i => i.item.toLowerCase().includes(searchTerm.toLowerCase())), 
    [inventario, searchTerm]);

    const handleSaveItem = async (item: Partial<InventoryItem>) => {
        if (item.id) await updateInventoryItem(item.id, item);
        else await addInventoryItem(item as any);
        setItemToEdit(null);
    };

    return (
        <div className="space-y-12 animate-fade-in relative pb-24">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/5 rounded-full blur-[120px] -mr-64 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-liquid-gold/5 rounded-full blur-[100px] -ml-40 -mb-20"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                    <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">
                        Almacén de <span className="text-liquid-gold">Insumos</span>
                    </h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                        <BoxIcon className="w-3 h-3 text-liquid-gold" />
                        Control de Existencias & Materia Prima Premium
                    </p>
                </div>
                <button 
                    onClick={() => setItemToEdit({})} 
                    className="group relative px-8 py-5 bg-white text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl overflow-hidden transition-all hover:pr-12"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <AddIcon className="w-5 h-5" /> AGREGAR NUEVO MATERIAL
                    </span>
                    <div className="absolute right-0 top-0 h-full w-0 bg-liquid-gold group-hover:w-10 transition-all flex items-center justify-center">
                        <ArrowUpIcon className="w-4 h-4 text-slate-950" />
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <KpiCard title="Capital en Stock" value={formatCurrency(kpis.valorTotal)} icon={BoxIcon} color="blue" />
                <KpiCard title="Tipos de Material" value={String(kpis.totalItems)} icon={LayersIcon} color="green" />
                <KpiCard title="Alertas de Stock" value={String(kpis.bajoStock)} icon={ExclamationTriangleIcon} color="red" />
            </div>

            <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 overflow-hidden relative z-10 shadow-2xl">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.02]">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="relative w-full">
                            <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-liquid-gold" />
                            <input 
                                type="text" 
                                placeholder="BUSCAR MATERIALES..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                className="bg-transparent border-none outline-none font-black text-lg text-white w-full pl-10 uppercase tracking-tight placeholder:text-slate-600" 
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Enlace de Inventario Activo</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.03]">
                            <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                                <th className="px-10 py-6">Insumo</th>
                                <th className="px-10 py-6">Existencia</th>
                                <th className="px-10 py-6">Unidad de Medida</th>
                                <th className="px-10 py-6">Valorización</th>
                                <th className="px-10 py-6 text-right">Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="p-32 text-center"><Loader2Icon className="animate-spin w-12 h-12 mx-auto text-liquid-gold opacity-50" /></td></tr>
                            ) : filtered.map(item => {
                                const isLow = item.cantidad <= item.minimo;
                                return (
                                    <tr key={item.id} className="hover:bg-white/[0.03] transition-all group">
                                        <td className="px-10 py-8">
                                            <p className="font-black text-white uppercase text-sm tracking-tight group-hover:text-liquid-gold transition-colors">{item.item}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1.5 tracking-widest">Punto Crítico: {item.minimo} {item.unidad}</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <span className={`text-2xl font-black ${isLow ? 'text-brand-red animate-pulse' : 'text-white'}`}>
                                                    {item.cantidad.toFixed(3)}
                                                </span>
                                                {isLow && (
                                                    <span className="px-3 py-1 bg-brand-red/20 text-brand-red text-[8px] font-black rounded-lg border border-brand-red/30 uppercase tracking-tighter">
                                                        Solicitar Reabastecimiento
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black rounded-lg uppercase border border-white/5">
                                                {item.unidad}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-black text-white text-lg tracking-tighter">{formatCurrency(item.cantidad * item.costoUnitario)}</p>
                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">COSTO: {formatCurrency(item.costoUnitario)} / {item.unidad.slice(0,-1)}</p>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <button onClick={() => setItemToEdit(item)} className="p-3 text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
                                                    <PencilIcon className="w-5 h-5"/>
                                                </button>
                                                <button onClick={() => setItemToDelete(item)} className="p-3 text-brand-red bg-brand-red/10 hover:bg-brand-red/20 border border-brand-red/20 rounded-2xl transition-all">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Smart Inventory Insights */}
            <div className="group bg-gradient-to-br from-slate-900 via-slate-950 to-black rounded-[3.5rem] p-12 text-white border border-white/5 relative overflow-hidden shadow-3xl">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[120px] -mr-96 -mt-96 group-hover:bg-brand-blue/10 transition-colors duration-700"></div>
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-8">
                        <div className="p-6 bg-slate-800 rounded-[2rem] border border-white/10 shadow-2xl">
                            <LayersIcon className="w-12 h-12 text-liquid-gold" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 italic">Algoritmo de <span className="text-liquid-gold">Consumo</span></h3>
                            <p className="text-slate-500 text-sm max-w-xl font-medium leading-relaxed">
                                Sincronización inteligente en tiempo real. El sistema calcula automáticamente el decremento de insumos basado en los esquemas de imposición y tirajes de cada orden de producción.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-6 w-full lg:w-auto">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] text-center min-w-[200px] group-hover:border-brand-red/30 transition-all">
                            <p className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Último Egreso Automático</p>
                            <p className="text-3xl font-black text-brand-red tracking-tighter">-0.125 <span className="text-xs">Resmas</span></p>
                            <p className="text-[8px] font-bold text-slate-600 mt-2 uppercase">Papel Químico Original</p>
                        </div>
                    </div>
                </div>
            </div>

            <ItemFormModal isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} onSave={handleSaveItem} itemToEdit={itemToEdit} />
        </div>
    );
};

export default InventarioPage;
