
import React, { useState, useEffect, useMemo } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto, bulkCreateProductos } from '../services/mockApi';
import { Producto } from '../types';
import { BoxIcon, Cog8ToothIcon, CloseIcon, PencilIcon, TrashIcon, PhotoIcon, SparklesIcon, TableIcon, CheckCircleIcon, ArrowRightIcon, AddIcon, SearchIcon, Loader2Icon } from '../components/Icons';
import { formatCurrency } from '../utils';

const SIZES = ["1/8 Oficio", "1/4 Oficio", "1/2 Oficio", "Oficio"];
const QUANTITIES = [
    { label: "25hx2", val: 0.25 },
    { label: "50hx2", val: 0.5 },
    { label: "1 Block (100hx2)", val: 1 },
    { label: "2 Blocks", val: 2 },
    { label: "3 Blocks", val: 3 },
    { label: "4 Blocks", val: 4 },
    { label: "5 Blocks", val: 5 },
    { label: "6 Blocks", val: 6 },
    { label: "7 Blocks", val: 7 },
    { label: "8 Blocks", val: 8 },
    { label: "10 Blocks", val: 10 },
    { label: "15 Blocks", val: 15 },
    { label: "20 Blocks", val: 20 },
    { label: "50 Blocks", val: 50 },
    { label: "100 Blocks", val: 100 }
];

const ProductManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Producto | Producto[]) => void;
    productToEdit: Producto | null;
}> = ({ isOpen, onClose, onSave, productToEdit }) => {
    const [mode, setMode] = useState<'SINGLE' | 'MATRIX'>('SINGLE');
    const [baseProduct, setBaseProduct] = useState<Partial<Producto>>({ nombre: '', categoria: 'SRI', esSRI: true, precio: 0 });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    
    // Matrix States
    const [selectedSizes, setSelectedSizes] = useState<string[]>(["1/4 Oficio"]);
    const [selectedQtys, setSelectedQtys] = useState<string[]>(["1 Block (100hx2)"]);
    const [generatedPreview, setGeneratedPreview] = useState<Producto[]>([]);

    useEffect(() => {
        if (productToEdit) {
            setBaseProduct(productToEdit);
            setImagePreview(productToEdit.imagenUrl || null);
            setMode('SINGLE');
        } else {
            setBaseProduct({ nombre: '', descripcion: '', precio: 0, categoria: 'SRI', esSRI: true });
            setImagePreview(null);
            setMode('SINGLE');
        }
    }, [productToEdit, isOpen]);

    // Generador de variaciones en tiempo real
    useEffect(() => {
        if (mode === 'MATRIX' && baseProduct.nombre) {
            const matrix: Producto[] = [];
            selectedSizes.forEach(size => {
                selectedQtys.forEach(qty => {
                    const qtyObj = QUANTITIES.find(q => q.label === qty);
                    const multiplier = qtyObj ? qtyObj.val : 1;
                    const estimatedPrice = (baseProduct.precio || 15) * multiplier;

                    matrix.push({
                        id: `preview-${size}-${qty}`,
                        nombre: `${baseProduct.nombre} (${size} - ${qty})`,
                        descripcion: baseProduct.descripcion || `Talonario en tamaño ${size}, presentación de ${qty}.`,
                        precio: estimatedPrice,
                        categoria: baseProduct.categoria || 'SRI',
                        esSRI: baseProduct.esSRI,
                        imagenUrl: imagePreview || undefined
                    });
                });
            });
            setGeneratedPreview(matrix);
        }
    }, [mode, baseProduct, selectedSizes, selectedQtys, imagePreview]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'SINGLE') {
            onSave(baseProduct as Producto);
        } else {
            onSave(generatedPreview);
        }
    };

    const handlePriceChangeInPreview = (id: string, newPrice: number) => {
        setGeneratedPreview(prev => prev.map(p => p.id === id ? { ...p, precio: newPrice } : p));
    };

    const toggleSize = (size: string) => {
        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    };

    const toggleQty = (qty: string) => {
        setSelectedQtys(prev => prev.includes(qty) ? prev.filter(q => q !== qty) : [...prev, qty]);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-3xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                
                {/* Header Dinámico */}
                <div className="flex justify-between items-center p-8 border-b dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-blue p-3 rounded-2xl text-white shadow-lg">
                            {mode === 'SINGLE' ? <BoxIcon className="w-6 h-6"/> : <TableIcon className="w-6 h-6"/>}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                {productToEdit ? 'Editar Producto' : mode === 'SINGLE' ? 'Nuevo Producto Único' : 'Generador de Matriz Pro'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {mode === 'SINGLE' ? 'Creación de un solo ítem en catálogo' : 'Generación automática de múltiples variaciones'}
                            </p>
                        </div>
                    </div>
                    
                    {!productToEdit && (
                        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm">
                            <button onClick={() => setMode('SINGLE')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'SINGLE' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Simple</button>
                            <button onClick={() => setMode('MATRIX')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'MATRIX' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Matriz</button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto custom-scrollbar">
                    <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                        
                        {/* Panel de Configuración Base (Izquierda) */}
                        <div className="lg:col-span-5 space-y-8">
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-brand-blue uppercase tracking-[0.3em] flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4" /> Información Base
                                </h3>
                                
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre del Producto Base</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. NOTAS DE VENTA" 
                                        value={baseProduct.nombre} 
                                        onChange={e => setBaseProduct({...baseProduct, nombre: e.target.value.toUpperCase()})}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-2xl font-black text-lg focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all uppercase"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoría</label>
                                        <select 
                                            value={baseProduct.categoria} 
                                            onChange={e => setBaseProduct({...baseProduct, categoria: e.target.value})}
                                            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none"
                                        >
                                            <option value="SRI">SRI (Talonarios)</option>
                                            <option value="PUBLICIDAD">PUBLICIDAD</option>
                                            <option value="OFICINA">OFICINA</option>
                                            <option value="OTROS">OTROS</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Precio Base (Unit.)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={baseProduct.precio} 
                                            onChange={e => setBaseProduct({...baseProduct, precio: parseFloat(e.target.value)})}
                                            className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-xl font-bold text-brand-blue outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">¿Es un producto SRI?</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={baseProduct.esSRI} onChange={e => setBaseProduct({...baseProduct, esSRI: e.target.checked})} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-blue"></div>
                                    </label>
                                </div>
                            </div>

                            {mode === 'MATRIX' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-brand-red uppercase tracking-[0.3em]">Seleccionar Tamaños</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {SIZES.map(size => (
                                                <button 
                                                    key={size}
                                                    type="button"
                                                    onClick={() => toggleSize(size)}
                                                    className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedSizes.includes(size) ? 'bg-brand-blue border-brand-blue text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-gray-700 text-slate-400 hover:border-brand-blue/30'}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-brand-red uppercase tracking-[0.3em]">Cantidades / Presentación</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {QUANTITIES.map(qty => (
                                                <button 
                                                    key={qty.label}
                                                    type="button"
                                                    onClick={() => toggleQty(qty.label)}
                                                    className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all border ${selectedQtys.includes(qty.label) ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-200'}`}
                                                >
                                                    {qty.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Panel de Vista Previa / Resultados (Derecha) */}
                        <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950/50 rounded-[3rem] p-8 border border-slate-100 dark:border-white/5 shadow-inner flex flex-col min-h-[400px]">
                            {mode === 'SINGLE' ? (
                                <div className="space-y-6 flex flex-col items-center justify-center h-full text-center">
                                    <PhotoIcon className="w-20 h-20 text-slate-200 mb-4" />
                                    <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest">Vista Previa</h4>
                                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700">
                                         <p className="text-[10px] font-black text-brand-blue uppercase mb-2">{baseProduct.categoria}</p>
                                         <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase leading-tight mb-4">{baseProduct.nombre || 'NOMBRE DEL PRODUCTO'}</h3>
                                         <p className="text-4xl font-black text-slate-900 dark:text-white mb-6">{formatCurrency(baseProduct.precio || 0)}</p>
                                         <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                             <div className="w-1/3 h-full bg-brand-red"></div>
                                         </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Lote de Variaciones ({generatedPreview.length})</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Edite los precios finales antes de procesar</p>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"><SparklesIcon className="w-6 h-6 text-yellow-400 animate-pulse" /></div>
                                    </div>

                                    <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                        {generatedPreview.map(p => (
                                            <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex justify-between items-center group transition-all hover:shadow-md">
                                                <div className="flex-grow">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight truncate w-64">{p.nombre}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold text-slate-400">$</span>
                                                    <input 
                                                        type="number" 
                                                        value={p.precio} 
                                                        onChange={e => handlePriceChangeInPreview(p.id, parseFloat(e.target.value))}
                                                        className="w-20 p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm font-black text-brand-blue text-right focus:ring-2 focus:ring-brand-blue/30 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {generatedPreview.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                                                <TableIcon className="w-20 h-20" />
                                                <p className="font-black uppercase tracking-widest text-sm">Selecciona opciones para generar la matriz</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {/* Footer del Modal */}
                <div className="p-8 border-t dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                    <button onClick={onClose} className="px-8 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors">Cancelar</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={!baseProduct.nombre || (mode === 'MATRIX' && generatedPreview.length === 0)}
                        className="min-w-[250px] px-12 py-4 bg-brand-red text-white font-black rounded-2xl shadow-2xl hover:bg-slate-950 transition-all transform active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs disabled:opacity-50 disabled:grayscale"
                    >
                        {mode === 'SINGLE' ? (
                            <>Guardar Producto <CheckCircleIcon className="w-5 h-5"/></>
                        ) : (
                            <>Crear {generatedPreview.length} Variaciones <SparklesIcon className="w-5 h-5"/></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProductDetailModal: React.FC<{
    producto: Producto;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ producto, onClose, onEdit, onDelete }) => {
    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-3xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row border border-white/10" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-1/2">
                    {producto.imagenUrl ? (
                        <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-64 md:h-full object-cover" />
                    ) : (
                        <div className="w-full h-64 md:h-full bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
                            <BoxIcon className="h-24 w-24 text-slate-200 dark:text-slate-800" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Sin Imagen Referencial</p>
                        </div>
                    )}
                </div>
                <div className="w-full md:w-1/2 flex flex-col p-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">{producto.categoria}</span>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight mt-3">{producto.nombre}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all text-slate-400">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-400 font-medium mb-10 leading-relaxed italic">"{producto.descripcion || 'Sin descripción disponible.'}"</p>
                    
                    <div className="mt-auto space-y-8">
                        <div className="flex justify-between items-end border-b dark:border-gray-700 pb-6">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión Final</span>
                            <p className="text-5xl font-black text-brand-blue tracking-tighter">{formatCurrency(producto.precio)}</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-brand-blue transition-all uppercase tracking-widest text-[10px]">
                                <PencilIcon className="h-4 w-4"/> Editar
                            </button>
                            <button onClick={onDelete} className="p-4 bg-red-50 text-brand-red rounded-2xl hover:bg-brand-red hover:text-white transition-all shadow-md">
                                <TrashIcon className="h-6 h-6"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductCard: React.FC<{
    producto: Producto;
    onViewDetails: () => void;
}> = ({ producto, onViewDetails }) => {
    return (
        <div onClick={onViewDetails} className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 border border-slate-50 dark:border-white/5">
            <div className="h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BoxIcon className="h-16 w-16 text-slate-200 dark:text-slate-700" />
                    </div>
                )}
                <div className="absolute inset-0 bg-brand-blue/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {producto.esSRI && (
                    <span className="absolute top-4 left-4 bg-brand-red text-white text-[8px] font-black px-2 py-1 rounded-md shadow-lg tracking-widest uppercase">SRI</span>
                )}
            </div>
            <div className="p-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{producto.categoria}</p>
                <h3 className="font-black text-slate-900 dark:text-white uppercase leading-tight truncate mb-4 group-hover:text-brand-blue transition-colors">{producto.nombre}</h3>
                <div className="flex justify-between items-center pt-4 border-t dark:border-gray-800">
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(producto.precio)}</p>
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-brand-blue group-hover:text-white transition-all shadow-inner">
                        <ArrowRightIcon className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4" onClick={onCancel}>
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-3xl w-full max-w-sm border border-white/10" onClick={e => e.stopPropagation()}>
             <div className="p-10 text-center">
                 <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <TrashIcon className="h-10 w-10 text-brand-red" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Eliminar Ítem</h3>
                 <p className="mt-4 text-sm text-slate-500 font-medium leading-relaxed">¿Estás seguro de eliminar este producto del catálogo?</p>
            </div>
             <div className="bg-gray-50 dark:bg-slate-900/50 p-6 flex justify-center gap-4 rounded-b-[2.5rem]">
                 <button onClick={onCancel} className="px-6 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest">No, cancelar</button>
                 <button onClick={onConfirm} className="px-8 py-3 bg-brand-red text-white font-black rounded-xl shadow-xl hover:bg-red-700 transition-all uppercase text-[10px] tracking-widest">Sí, eliminar</button>
            </div>
        </div>
    </div>
);


const ProductosPage: React.FC = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
    const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
    const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<Producto | null>(null);

    const fetchProductos = async () => {
        setLoading(true);
        const data = await getProductos();
        setProductos(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    const categories = useMemo(() => ['Todas', ...new Set(productos.map(p => p.categoria))], [productos]);
    const filteredProductos = useMemo(() => {
        return productos.filter(p => {
            const matchesCategory = categoryFilter === 'Todas' || p.categoria === categoryFilter;
            const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        }).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [productos, searchTerm, categoryFilter]);

    const handleSave = async (product: Producto | Producto[]) => {
        if (Array.isArray(product)) {
            await bulkCreateProductos(product);
        } else {
            if (product.id && !product.id.startsWith('preview')) {
                await updateProducto(product.id, product);
            } else {
                await createProducto(product);
            }
        }
        await fetchProductos();
        handleCloseMgmtModal();
    };
    
    const handleDeleteConfirm = async () => {
        if (productToDelete) {
            await deleteProducto(productToDelete.id);
            await fetchProductos();
            setProductToDelete(null);
            setViewingProduct(null);
        }
    };

    const handleOpenMgmtModal = () => setIsMgmtModalOpen(true);
    const handleCloseMgmtModal = () => {
        setIsMgmtModalOpen(false);
        setProductToEdit(null);
    };

    const handleEdit = (product: Producto) => {
        setProductToEdit(product);
        setViewingProduct(null);
        handleOpenMgmtModal();
    };
    
    const handleDeleteRequest = (product: Producto) => {
        setProductToDelete(product);
    };

    return (
        <div className="space-y-10 pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Catálogo <span className="text-brand-red">Maestro</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Gestión de servicios y productos terminados</p>
                </div>
                <button onClick={handleOpenMgmtModal} className="w-full md:w-auto px-10 py-5 bg-brand-blue text-white font-black rounded-2xl shadow-3xl shadow-blue-900/20 hover:bg-slate-950 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px]">
                    <AddIcon className="h-5 w-5"/> + Crear Nuevo Producto
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-white/5 flex flex-col md:flex-row gap-6">
                <div className="flex-grow relative group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar en el catálogo..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all dark:text-white"
                    />
                </div>
                <div className="md:w-64 relative group">
                    <TableIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <select 
                        value={categoryFilter} 
                        onChange={e => setCategoryFilter(e.target.value)} 
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all dark:text-white appearance-none cursor-pointer"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>
            
            {loading ? (
                <div className="py-20 text-center space-y-4">
                    <Loader2Icon className="animate-spin h-10 w-10 text-brand-blue mx-auto" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando catálogo...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {filteredProductos.map(p => (
                        <ProductCard key={p.id} producto={p} onViewDetails={() => setViewingProduct(p)} />
                    ))}
                    {filteredProductos.length === 0 && (
                        <div className="col-span-full py-32 text-center opacity-30 flex flex-col items-center">
                            <BoxIcon className="w-20 h-20 mb-4" />
                            <p className="font-black uppercase tracking-widest">No hay resultados para tu búsqueda</p>
                        </div>
                    )}
                </div>
            )}
            
            <ProductManagementModal isOpen={isMgmtModalOpen} onClose={handleCloseMgmtModal} onSave={handleSave} productToEdit={productToEdit} />
            {productToDelete && <ConfirmationModal onConfirm={handleDeleteConfirm} onCancel={() => setProductToDelete(null)} />}
            {viewingProduct && (
                <ProductDetailModal 
                    producto={viewingProduct}
                    onClose={() => setViewingProduct(null)}
                    onEdit={() => handleEdit(viewingProduct)}
                    onDelete={() => handleDeleteRequest(viewingProduct)}
                />
            )}
        </div>
    );
};

export default ProductosPage;
