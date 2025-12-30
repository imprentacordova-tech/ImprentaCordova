
import React, { useState, useEffect, useMemo } from 'react';
// FIX: Added missing Loader2Icon to imports
import { BoxIcon, InventoryIcon, ExclamationTriangleIcon, AddIcon, PencilIcon, ArrowUpIcon, ArrowDownIcon, SearchIcon, TrashIcon, CloseIcon, ClockIcon, LayersIcon, Loader2Icon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { InventoryItem } from '../types';
import { getInventario, createInventarioItem, updateInventarioItem, deleteInventarioItem, setInventario as saveInventarioOrder } from '../services/mockApi';

type SortKey = keyof InventoryItem | 'valorTotal';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: 'blue' | 'green' | 'red' }> = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-brand-blue' },
        green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
        red: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-brand-red' },
    };
    const classes = colors[color];
    return (
        <div className={`p-8 rounded-[2.5rem] shadow-sm ${classes.bg} flex items-center gap-6 border border-white/10`}>
            <div className={`p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-xl`}>
                <Icon className={`h-8 w-8 ${classes.text}`} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
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
    const [inventario, setInventario] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [itemToEdit, setItemToEdit] = useState<Partial<InventoryItem> | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

    const fetchInventario = async () => {
        setLoading(true);
        const data = await getInventario();
        setInventario(data);
        setLoading(false);
    };

    useEffect(() => { fetchInventario(); }, []);

    const kpis = useMemo(() => {
        const valorTotal = inventario.reduce((sum, item) => sum + (item.cantidad * item.costoUnitario), 0);
        const bajoStock = inventario.filter(item => item.cantidad <= item.minimo).length;
        return { valorTotal, totalItems: inventario.length, bajoStock };
    }, [inventario]);

    const filtered = useMemo(() => 
        inventario.filter(i => i.item.toLowerCase().includes(searchTerm.toLowerCase())), 
    [inventario, searchTerm]);

    const handleSaveItem = async (item: Partial<InventoryItem>) => {
        if (item.id) await updateInventarioItem(item.id, item);
        else await createInventarioItem(item as any);
        setItemToEdit(null);
        await fetchInventario();
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Almacén de <span className="text-brand-blue">Insumos</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Control de stock y costos de materia prima</p>
                </div>
                <button onClick={() => setItemToEdit({})} className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-950 transition-all flex items-center gap-3">
                    <AddIcon className="w-5 h-5"/> AGREGAR INSUMO
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <KpiCard title="Capital en Stock" value={formatCurrency(kpis.valorTotal)} icon={BoxIcon} color="blue" />
                <KpiCard title="Tipos de Material" value={String(kpis.totalItems)} icon={LayersIcon} color="green" />
                <KpiCard title="Alertas de Stock" value={String(kpis.bajoStock)} icon={ExclamationTriangleIcon} color="red" />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
                <div className="p-8 border-b dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400"><SearchIcon className="w-5 h-5"/></div>
                        <input type="text" placeholder="Buscar material..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none font-bold text-lg dark:text-white w-full md:w-80" />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full">
                        <ClockIcon className="w-4 h-4"/>
                        <span className="text-[9px] font-black uppercase tracking-widest">Sincronizado con Producción</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950/50">
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                <th className="px-8 py-5">Material</th>
                                <th className="px-8 py-5">Stock Disponible</th>
                                <th className="px-8 py-5">Unidad</th>
                                <th className="px-8 py-5">Inversión</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="p-20 text-center"><Loader2Icon className="animate-spin w-10 h-10 mx-auto text-brand-blue" /></td></tr>
                            ) : filtered.map(item => {
                                const isLow = item.cantidad <= item.minimo;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group">
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-900 dark:text-white uppercase text-sm leading-none">{item.item}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">MIN: {item.minimo} {item.unidad}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xl font-black ${isLow ? 'text-brand-red' : 'text-slate-900 dark:text-white'}`}>{item.cantidad.toFixed(3)}</span>
                                                {isLow && <div className="px-2 py-0.5 bg-brand-red/10 text-brand-red text-[8px] font-black rounded uppercase tracking-tighter animate-pulse">Pedido Urgente</div>}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase">{item.unidad}</td>
                                        <td className="px-8 py-6">
                                            <p className="font-black text-slate-900 dark:text-white">{formatCurrency(item.cantidad * item.costoUnitario)}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{formatCurrency(item.costoUnitario)} / {item.unidad.slice(0,-1)}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setItemToEdit(item)} className="p-2 text-brand-blue hover:bg-blue-50 rounded-xl transition-all"><PencilIcon className="w-5 h-5"/></button>
                                                <button onClick={() => setItemToDelete(item)} className="p-2 text-brand-red hover:bg-red-50 rounded-xl transition-all"><TrashIcon className="w-5 h-5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PANEL DE KARDEX FUTURO */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Inteligencia de Consumo</h3>
                        <p className="text-slate-400 text-sm max-w-md">El sistema descuenta automáticamente el papel químico basándose en los cortes por pliego de cada orden recibida.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center min-w-[140px]">
                            <p className="text-[8px] font-black uppercase text-slate-500 mb-1">Último Descuento</p>
                            <p className="text-lg font-black text-brand-red">-0.125 <span className="text-[10px]">Resmas</span></p>
                        </div>
                    </div>
                </div>
            </div>

            <ItemFormModal isOpen={!!itemToEdit} onClose={() => setItemToEdit(null)} onSave={handleSaveItem} itemToEdit={itemToEdit} />
        </div>
    );
};

export default InventarioPage;
