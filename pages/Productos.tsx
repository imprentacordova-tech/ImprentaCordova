
import React, { useState, useEffect, useMemo } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto, bulkCreateProductos } from '../services/mockApi';
import { Producto } from '../types';
import { 
    BoxIcon, CloseIcon, PencilIcon, TrashIcon, PhotoIcon, 
    SparklesIcon, TableIcon, CheckCircleIcon, ArrowRightIcon, 
    AddIcon, SearchIcon, Loader2Icon, DocumentTextIcon, 
    LayersIcon, FileStackIcon, ShieldCheckIcon, RulerIcon 
} from '../components/Icons';
import { formatCurrency } from '../utils';

const SIZES = ["1/8 Oficio", "1/4 Oficio", "1/2 Oficio", "Oficio"];
const PRESENTATIONS = [
    { id: 'HOJAS', label: 'Hojas Sueltas', icon: DocumentTextIcon },
    { id: 'BLOCK', label: 'En Blocks', icon: LayersIcon }
];
const COPIES = [
    { id: 1, label: 'Original', suffix: 'Único' },
    { id: 2, label: 'Original + 1 Copia', suffix: 'Duplicado' },
    { id: 3, label: 'Original + 2 Copias', suffix: 'Triplicado' }
];
const QUANTITIES = [
    { label: "25 h", val: 0.25 },
    { label: "50 h", val: 0.5 },
    { label: "100 h", val: 1 },
    { label: "250 h", val: 2.5 },
    { label: "500 h", val: 5 },
    { label: "1000 h", val: 10 }
];

const ProductManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Producto | Producto[]) => void;
    productToEdit: Producto | null;
}> = ({ isOpen, onClose, onSave, productToEdit }) => {
    const [mode, setMode] = useState<'SINGLE' | 'MATRIX'>('SINGLE');
    const [baseProduct, setBaseProduct] = useState<Partial<Producto>>({ nombre: '', categoria: 'SRI', esSRI: true, precio: 0 });
    
    // Matrix States
    const [selectedSizes, setSelectedSizes] = useState<string[]>(["1/4 Oficio"]);
    const [selectedPresentations, setSelectedPresentations] = useState<string[]>(["BLOCK"]);
    const [selectedCopies, setSelectedCopies] = useState<number[]>([2]);
    const [selectedQtys, setSelectedQtys] = useState<string[]>(["50 h"]);
    const [extraCopyPrice, setExtraCopyPrice] = useState(2.50); // Lo que sube por cada copia extra
    
    const [generatedPreview, setGeneratedPreview] = useState<Producto[]>([]);

    useEffect(() => {
        if (productToEdit) {
            setBaseProduct(productToEdit);
            setMode('SINGLE');
        } else {
            setBaseProduct({ nombre: '', descripcion: '', precio: 15, categoria: 'SRI', esSRI: true });
            setMode('SINGLE');
        }
    }, [productToEdit, isOpen]);

    // Generador Pro de Variaciones
    useEffect(() => {
        if (mode === 'MATRIX' && baseProduct.nombre) {
            const matrix: Producto[] = [];
            selectedSizes.forEach(size => {
                selectedPresentations.forEach(pres => {
                    selectedCopies.forEach(copyCount => {
                        selectedQtys.forEach(qtyLabel => {
                            const qtyObj = QUANTITIES.find(q => q.label === qtyLabel);
                            const multiplier = qtyObj ? qtyObj.val : 1;
                            const presInfo = PRESENTATIONS.find(p => p.id === pres);
                            const copyInfo = COPIES.find(c => c.id === copyCount);
                            
                            // Lógica de precio: Base * cantidad + (precio de copias extras si copyCount > 2)
                            let calculatedPrice = (baseProduct.precio || 0) * multiplier;
                            if (copyCount > 2) {
                                calculatedPrice += (extraCopyPrice * (copyCount - 2));
                            }

                            const fullName = `${baseProduct.nombre} (${size} - ${presInfo?.label} x ${qtyLabel} - ${copyInfo?.suffix})`;

                            matrix.push({
                                id: `preview-${size}-${pres}-${copyCount}-${qtyLabel}`,
                                nombre: fullName.toUpperCase(),
                                descripcion: baseProduct.descripcion || `${baseProduct.nombre} en tamaño ${size}, ${presInfo?.label} con ${copyInfo?.label}.`,
                                precio: calculatedPrice,
                                categoria: baseProduct.categoria || 'SRI',
                                esSRI: baseProduct.esSRI,
                            });
                        });
                    });
                });
            });
            setGeneratedPreview(matrix);
        }
    }, [mode, baseProduct, selectedSizes, selectedPresentations, selectedCopies, selectedQtys, extraCopyPrice]);

    if (!isOpen) return null;

    const toggleItem = (list: any[], setList: any, item: any) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-3xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                
                <div className="flex justify-between items-center p-8 border-b dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-blue p-3 rounded-2xl text-white shadow-lg">
                            <TableIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                {mode === 'SINGLE' ? 'Producto Individual' : 'Generador de Variaciones Pro'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración masiva de blocks, hojas y copias</p>
                        </div>
                    </div>
                    
                    {!productToEdit && (
                        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm">
                            <button onClick={() => setMode('SINGLE')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'SINGLE' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400'}`}>Simple</button>
                            <button onClick={() => setMode('MATRIX')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'MATRIX' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400'}`}>Matriz</button>
                        </div>
                    )}
                </div>

                <div className="flex-grow overflow-hidden flex flex-col lg:flex-row">
                    {/* Panel de Configuración (Izquierda) */}
                    <div className="w-full lg:w-2/5 p-8 overflow-y-auto border-r dark:border-gray-800 space-y-8 custom-scrollbar">
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-brand-blue uppercase tracking-[0.3em] flex items-center gap-2"><SparklesIcon className="w-4 h-4"/> Datos Base</h3>
                            <input 
                                type="text" 
                                placeholder="NOMBRE (EJ. RECIBOS)" 
                                value={baseProduct.nombre} 
                                onChange={e => setBaseProduct({...baseProduct, nombre: e.target.value.toUpperCase()})}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-gray-700 rounded-2xl font-black text-lg outline-none focus:ring-4 focus:ring-brand-blue/10 uppercase"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">P.V.P Base (100h)</label>
                                    <input type="number" value={baseProduct.precio} onChange={e => setBaseProduct({...baseProduct, precio: parseFloat(e.target.value)})} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl font-bold text-brand-blue" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Extra x Copia (Triplicados)</label>
                                    <input type="number" value={extraCopyPrice} onChange={e => setExtraCopyPrice(parseFloat(e.target.value))} className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl font-bold text-brand-red" />
                                </div>
                            </div>
                        </div>

                        {mode === 'MATRIX' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Tamaños */}
                                <div>
                                    {/* Added RulerIcon below which was missing from the imports */}
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><RulerIcon className="w-4 h-4"/> Tamaños</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {SIZES.map(s => (
                                            <button key={s} onClick={() => toggleItem(selectedSizes, setSelectedSizes, s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${selectedSizes.includes(s) ? 'bg-brand-blue border-brand-blue text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>{s}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Presentación */}
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><LayersIcon className="w-4 h-4"/> Presentación</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PRESENTATIONS.map(p => (
                                            <button key={p.id} onClick={() => toggleItem(selectedPresentations, setSelectedPresentations, p.id)} className={`flex items-center justify-center gap-2 p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${selectedPresentations.includes(p.id) ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                                                <p.icon className="w-4 h-4" /> {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Copias */}
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><FileStackIcon className="w-4 h-4"/> Juegos / Copias</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {COPIES.map(c => (
                                            <button key={c.id} onClick={() => toggleItem(selectedCopies, setSelectedCopies, c.id)} className={`flex items-center justify-between p-3 px-5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${selectedCopies.includes(c.id) ? 'bg-brand-red border-brand-red text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                                                <span>{c.label}</span>
                                                <span className={`opacity-60 ${selectedCopies.includes(c.id) ? 'text-white' : ''}`}>{c.suffix}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cantidades */}
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Cantidades Sugeridas</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {QUANTITIES.map(q => (
                                            <button key={q.label} onClick={() => toggleItem(selectedQtys, setSelectedQtys, q.label)} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all border ${selectedQtys.includes(q.label) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{q.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Panel de Vista Previa (Derecha) */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 p-8 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Lote de Variaciones ({generatedPreview.length})</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pre-visualización de nomenclatura y precios</p>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm"><SparklesIcon className="w-6 h-6 text-yellow-400 animate-pulse" /></div>
                        </div>

                        <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {generatedPreview.map(p => {
                                const isBlock = p.nombre.includes('BLOCK');
                                const isDuplicado = p.nombre.includes('DUPLICADO');
                                const isTriplicado = p.nombre.includes('TRIPLICADO');

                                return (
                                    <div key={p.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 flex justify-between items-center group transition-all hover:shadow-md">
                                        <div className="flex items-center gap-4 flex-grow min-w-0">
                                            <div className={`p-2 rounded-lg ${isBlock ? 'bg-indigo-50 text-indigo-500' : 'bg-blue-50 text-blue-500'}`}>
                                                {isBlock ? <LayersIcon className="w-5 h-5"/> : <DocumentTextIcon className="w-5 h-5"/>}
                                            </div>
                                            <div className="min-w-0 flex-grow">
                                                <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tight truncate pr-4">{p.nombre}</p>
                                                <div className="flex gap-2 mt-1">
                                                    {isDuplicado && <span className="text-[7px] font-black bg-blue-100 text-blue-600 px-1.5 rounded uppercase">x2</span>}
                                                    {isTriplicado && <span className="text-[7px] font-black bg-purple-100 text-purple-600 px-1.5 rounded uppercase">x3</span>}
                                                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{p.categoria}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-4 border-l dark:border-gray-800">
                                            <span className="text-xs font-bold text-slate-300">$</span>
                                            <input 
                                                type="number" 
                                                value={p.precio} 
                                                onChange={e => setGeneratedPreview(prev => prev.map(prevP => prevP.id === p.id ? { ...prevP, precio: parseFloat(e.target.value) } : prevP))}
                                                className="w-20 p-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-black text-brand-blue text-right focus:ring-2 focus:ring-brand-blue/30 outline-none"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {generatedPreview.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-4">
                                    <BoxIcon className="w-20 h-20 mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">Define opciones a la izquierda para generar la matriz</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                    <button onClick={onClose} className="px-8 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600">Cancelar</button>
                    <button 
                        onClick={() => onSave(mode === 'SINGLE' ? (baseProduct as Producto) : generatedPreview)}
                        disabled={!baseProduct.nombre || (mode === 'MATRIX' && generatedPreview.length === 0)}
                        className="min-w-[300px] px-12 py-4 bg-brand-red text-white font-black rounded-2xl shadow-2xl hover:bg-slate-950 transition-all transform active:scale-95 flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                    >
                        {mode === 'SINGLE' ? 'Guardar Producto' : `Procesar ${generatedPreview.length} Variaciones`} <CheckCircleIcon className="w-5 h-5"/>
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
                <div className="w-full md:w-1/2 relative">
                    {producto.imagenUrl ? (
                        <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-64 md:h-full object-cover" />
                    ) : (
                        <div className="w-full h-64 md:h-full bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center">
                            <BoxIcon className="h-24 w-24 text-slate-200 dark:text-slate-800" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">Sin Imagen Referencial</p>
                        </div>
                    )}
                    {producto.esSRI && <span className="absolute top-6 left-6 bg-brand-blue text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-xl">PRODUCTO AUTORIZADO SRI</span>}
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
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión Sugerida</span>
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
    const isBlock = producto.nombre.includes('BLOCK');
    return (
        <div onClick={onViewDetails} className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 border border-slate-50 dark:border-white/5">
            <div className="h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        {isBlock ? <LayersIcon className="h-16 w-16 text-slate-200 dark:text-slate-700" /> : <DocumentTextIcon className="h-16 w-16 text-slate-200 dark:text-slate-700" />}
                    </div>
                )}
                <div className="absolute inset-0 bg-brand-blue/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {producto.esSRI && (
                    <span className="absolute top-4 left-4 bg-brand-red text-white text-[8px] font-black px-2 py-1 rounded-md shadow-lg tracking-widest uppercase">SRI</span>
                )}
            </div>
            <div className="p-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{producto.categoria}</p>
                <h3 className="font-black text-slate-900 dark:text-white uppercase leading-tight truncate mb-4 group-hover:text-brand-blue transition-colors text-sm">{producto.nombre}</h3>
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
        setIsMgmtModalOpen(false);
        setProductToEdit(null);
    };
    
    const handleDeleteConfirm = async () => {
        if (productToDelete) {
            await deleteProducto(productToDelete.id);
            await fetchProductos();
            setProductToDelete(null);
            setViewingProduct(null);
        }
    };

    return (
        <div className="space-y-10 pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Catálogo <span className="text-brand-red">Maestro</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Gestión avanzada de productos y variaciones</p>
                </div>
                <button onClick={() => { setProductToEdit(null); setIsMgmtModalOpen(true); }} className="w-full md:w-auto px-10 py-5 bg-brand-blue text-white font-black rounded-2xl shadow-3xl shadow-blue-900/20 hover:bg-slate-950 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px]">
                    <AddIcon className="h-5 w-5"/> + Configurar Nuevo Producto
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-50 dark:border-white/5 flex flex-col md:flex-row gap-6">
                <div className="flex-grow relative group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre (ej. Recibos, Notas...)" 
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
            
            <ProductManagementModal isOpen={isMgmtModalOpen} onClose={() => setIsMgmtModalOpen(false)} onSave={handleSave} productToEdit={productToEdit} />
            {productToDelete && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[60] flex justify-center items-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-3xl w-full max-w-sm border border-white/10 p-10 text-center">
                        <TrashIcon className="h-10 w-10 text-brand-red mx-auto mb-6" />
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Eliminar Producto</h3>
                        <p className="mt-4 text-sm text-slate-500 font-medium leading-relaxed">¿Seguro que deseas eliminar este ítem del catálogo?</p>
                        <div className="mt-10 flex gap-4">
                            <button onClick={() => setProductToDelete(null)} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                            <button onClick={handleDeleteConfirm} className="flex-1 py-3 bg-brand-red text-white font-black rounded-xl shadow-xl uppercase text-[10px] tracking-widest">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            {viewingProduct && (
                <ProductDetailModal 
                    producto={viewingProduct}
                    onClose={() => setViewingProduct(null)}
                    onEdit={() => { setProductToEdit(viewingProduct); setViewingProduct(null); setIsMgmtModalOpen(true); }}
                    onDelete={() => { setProductToDelete(viewingProduct); setViewingProduct(null); }}
                />
            )}
        </div>
    );
};

export default ProductosPage;
