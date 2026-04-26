import React, { useState, useMemo, useEffect } from 'react';
import { Producto, User } from '../types';
import { 
    BoxIcon, CloseIcon, PencilIcon, TrashIcon, PhotoIcon, 
    SparklesIcon, TableIcon, CheckCircleIcon, ArrowRightIcon, 
    AddIcon, SearchIcon, Loader2Icon, DocumentTextIcon, 
    LayersIcon, FileStackIcon, ShieldCheckIcon, RulerIcon,
    ActivityIcon, CloudArrowUpIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { useData } from '../contexts/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFile } from '../services/supabase';

// --- DATA CONSTANTS ---

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

// --- COMPONENTS ---

const ProductManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Producto | Producto[]) => void;
    productToEdit: Producto | null;
}> = ({ isOpen, onClose, onSave, productToEdit }) => {
    const [mode, setMode] = useState<'SINGLE' | 'MATRIX'>('SINGLE');
    const [baseProduct, setBaseProduct] = useState<Partial<Producto>>({ nombre: '', categoria: 'General', esSRI: false, precio: 0, imagenUrl: '', specs: [] });
    const [selectedSizes, setSelectedSizes] = useState<string[]>(["1/4 Oficio"]);
    const [selectedPresentations, setSelectedPresentations] = useState<string[]>(["BLOCK"]);
    const [selectedCopies, setSelectedCopies] = useState<number[]>([2]);
    const [selectedQtys, setSelectedQtys] = useState<string[]>(["50 h"]);
    const [extraCopyPrice, setExtraCopyPrice] = useState(2.50); 
    const [generatedPreview, setGeneratedPreview] = useState<Producto[]>([]);

    useEffect(() => {
        if (productToEdit) {
            setBaseProduct(productToEdit);
            setMode('SINGLE');
        } else {
            setBaseProduct({ nombre: '', descripcion: '', precio: 0, categoria: 'General', esSRI: false, imagenUrl: '', specs: [] });
            setMode('SINGLE');
        }
    }, [productToEdit, isOpen]);

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
                            let calculatedPrice = (baseProduct.precio || 0) * multiplier;
                            if (copyCount > 2) calculatedPrice += (extraCopyPrice * (copyCount - 2));
                            const fullName = `${baseProduct.nombre} (${size} - ${presInfo?.label} x ${qtyLabel} - ${copyInfo?.suffix})`;
                            matrix.push({
                                id: `preview-${size}-${pres}-${copyCount}-${qtyLabel}`,
                                nombre: fullName.toUpperCase(),
                                descripcion: baseProduct.descripcion || `${baseProduct.nombre} en tamaño ${size}, ${presInfo?.label} con ${copyInfo?.label}.`,
                                precio: calculatedPrice,
                                categoria: baseProduct.categoria || 'General',
                                esSRI: baseProduct.esSRI,
                                imagenUrl: baseProduct.imagenUrl,
                                specs: [size, presInfo?.label || '', qtyLabel, copyInfo?.suffix || ''].filter(Boolean) as string[],
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
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={onClose} />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass-card-luxury w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative z-10">
                    <div className="flex justify-between items-center p-10 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-liquid-gold rounded-2xl text-black shadow-gold-glow"><TableIcon className="w-8 h-8"/></div>
                            <div>
                                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Product Creation <span className="text-liquid-gold text-4xl">Studio</span></h1>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">Advanced Matrix Generation Protocol</p>
                            </div>
                        </div>
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                            <button onClick={() => setMode('SINGLE')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'SINGLE' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-white'}`}>Unitary</button>
                            <button onClick={() => setMode('MATRIX')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'MATRIX' ? 'bg-liquid-gold text-black shadow-xl' : 'text-slate-500 hover:text-white'}`}>Matrix</button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-hidden flex">
                        <div className="w-1/3 p-10 overflow-y-auto border-r border-white/5 space-y-12 custom-scrollbar bg-white/[0.01]">
                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] block">Base Definition</label>
                                <input type="text" placeholder="CONCEPT NAME" value={baseProduct.nombre} onChange={e => setBaseProduct({...baseProduct, nombre: e.target.value.toUpperCase()})} className="input-atelier w-full text-lg uppercase" />
                                <textarea placeholder="SPECIFICATIONS & NOTES" value={baseProduct.descripcion} onChange={e => setBaseProduct({...baseProduct, descripcion: e.target.value})} className="input-atelier w-full h-32 text-[10px] uppercase tracking-widest leading-loose" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Base Rate ($)</label>
                                    <input type="number" value={baseProduct.precio} onChange={e => setBaseProduct({...baseProduct, precio: parseFloat(e.target.value)})} className="input-atelier w-full" />
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-white/5">
                                <label className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] block flex items-center gap-2"><PhotoIcon className="w-4 h-4"/> Visual Identity</label>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <input 
                                            type="text" 
                                            placeholder="IMAGE URL (E.G. HTTPS://...)" 
                                            value={baseProduct.imagenUrl} 
                                            onChange={e => setBaseProduct({...baseProduct, imagenUrl: e.target.value})} 
                                            className="input-atelier flex-grow text-[10px]" 
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => document.getElementById('product-image-upload')?.click()}
                                            className="p-4 bg-white/5 hover:bg-liquid-gold text-slate-500 hover:text-black rounded-xl border border-white/5 transition-all"
                                            title="Upload Image"
                                        >
                                            <CloudArrowUpIcon className="w-5 h-5" />
                                        </button>
                                        <input 
                                            id="product-image-upload"
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    try {
                                                        const file = e.target.files[0];
                                                        const url = await uploadFile(file, 'catalog', `prod_${Date.now()}`);
                                                        setBaseProduct({...baseProduct, imagenUrl: url});
                                                    } catch (err) {
                                                        console.error("Upload failed", err);
                                                        alert("Error al subir imagen");
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    {baseProduct.imagenUrl && (
                                        <div className="h-32 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                                            <img src={baseProduct.imagenUrl} className="w-full h-full object-cover opacity-60" alt="Preview" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-white/5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block flex items-center gap-2"><RulerIcon className="w-4 h-4"/> Technical Specs</label>
                                <input 
                                    type="text" 
                                    placeholder="SPECS (COMMA SEPARATED)" 
                                    value={baseProduct.specs?.join(', ')} 
                                    onChange={e => setBaseProduct({...baseProduct, specs: e.target.value.split(',').map(s => s.trim())})} 
                                    className="input-atelier w-full text-[10px]" 
                                />
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Core Category</label>
                                <select 
                                    value={baseProduct.categoria} 
                                    onChange={e => setBaseProduct({...baseProduct, categoria: e.target.value})}
                                    className="input-atelier w-full appearance-none text-[10px] font-black uppercase tracking-widest"
                                >
                                    <option value="General">GENERAL</option>
                                    <option value="SRI">SRI OFFICIAL</option>
                                    <option value="Publicidad">PUBLICIDAD</option>
                                    <option value="Tarjetas">TARJETAS</option>
                                    <option value="Gran Formato">GRAN FORMATO</option>
                                    <option value="Sublimación">SUBLIMACIÓN</option>
                                </select>
                            </div>

                            {mode === 'MATRIX' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pt-10 border-t border-white/5">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3"><RulerIcon className="w-4 h-4 text-liquid-gold"/> Dimensions</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {SIZES.map(s => <button key={s} onClick={() => toggleItem(selectedSizes, setSelectedSizes, s)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all border ${selectedSizes.includes(s) ? 'bg-white border-white text-black' : 'bg-white/5 border-white/5 text-slate-500'}`}>{s}</button>)}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3"><LayersIcon className="w-4 h-4 text-liquid-gold"/> Formats</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {PRESENTATIONS.map(p => <button key={p.id} onClick={() => toggleItem(selectedPresentations, setSelectedPresentations, p.id)} className={`flex items-center justify-center gap-3 p-4 rounded-xl text-[9px] font-black uppercase transition-all border ${selectedPresentations.includes(p.id) ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow-sm' : 'bg-white/5 border-white/5 text-slate-500'}`}><p.icon className="w-4 h-4" /> {p.label}</button>)}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scales</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {QUANTITIES.map(q => <button key={q.label} onClick={() => toggleItem(selectedQtys, setSelectedQtys, q.label)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border ${selectedQtys.includes(q.label) ? 'bg-liquid-gold/20 text-liquid-gold border-liquid-gold/30' : 'bg-white/5 border-white/5 text-slate-500'}`}>{q.label}</button>)}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="flex-1 bg-black/40 p-10 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Instance <span className="text-liquid-gold">Stream</span> [{generatedPreview.length}]</h3>
                                <ActivityIcon className="w-5 h-5 text-liquid-gold/50 animate-pulse" />
                            </div>
                            <div className="flex-grow overflow-y-auto space-y-3 pr-4 custom-scrollbar">
                                {generatedPreview.map((p, idx) => (
                                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.01 }} key={p.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/[0.06] hover:border-liquid-gold/20 transition-all">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 group-hover:text-liquid-gold"><BoxIcon className="w-5 h-5"/></div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-tight truncate group-hover:text-liquid-gold transition-colors">{p.nombre}</p>
                                        </div>
                                        <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                                            <span className="text-[10px] font-black text-liquid-gold">$</span>
                                            <input type="number" value={p.precio} onChange={e => setGeneratedPreview(prev => prev.map(prevP => prevP.id === p.id ? { ...prevP, precio: parseFloat(e.target.value) } : prevP))} className="w-16 bg-transparent text-right font-black text-white outline-none" />
                                        </div>
                                    </motion.div>
                                ))}
                                {generatedPreview.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-10 text-[10px] font-black uppercase tracking-[0.5em] italic">System Idle</div>}
                            </div>
                        </div>
                    </div>

                    <div className="p-10 border-t border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <button onClick={onClose} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Terminate Process</button>
                        <button onClick={() => onSave(mode === 'SINGLE' ? (baseProduct as Producto) : generatedPreview)} className="btn-luxury px-20">
                            {mode === 'SINGLE' ? 'Materialize Concept' : `Initialize ${generatedPreview.length} Units`}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const ProductCard: React.FC<{
    producto: Producto;
    onViewDetails: () => void;
}> = ({ producto, onViewDetails }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -10 }}
            onClick={onViewDetails} 
            className="group glass-card-luxury overflow-hidden cursor-pointer"
        >
            <div className="h-56 bg-black/60 relative overflow-hidden">
                {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover transition-all duration-[2000ms] group-hover:scale-125 grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-950 to-black">
                        <BoxIcon className="h-20 w-20 text-slate-800 group-hover:text-liquid-gold/20 transition-colors" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-80"></div>
                {producto.esSRI && <span className="absolute top-6 left-6 bg-liquid-gold text-black text-[8px] font-black px-4 py-1.5 rounded-full shadow-gold-glow tracking-widest uppercase border border-white/10">SRI ELITE</span>}
            </div>
            <div className="p-8">
                <span className="text-[8px] font-black text-liquid-gold uppercase tracking-[0.6em] mb-4 block opacity-50 group-hover:opacity-100 transition-all">{producto.categoria}</span>
                <h3 className="text-lg font-black text-white uppercase leading-none tracking-tighter truncate group-hover:text-liquid-gold transition-colors italic mb-6">{producto.nombre}</h3>
                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <p className="text-2xl font-black text-white tracking-widest italic">{formatCurrency(producto.precio)}</p>
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:bg-liquid-gold group-hover:border-liquid-gold group-hover:text-black group-hover:scale-110">
                        <ArrowRightIcon className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ProductosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { productos, loading, createProducto, updateProducto, deleteProducto, bulkCreateProductos } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
    const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<Producto | null>(null);

    const categories = useMemo(() => ['Todas', ...new Set(productos.map(p => p.categoria))], [productos]);
    const filteredProductos = useMemo(() => {
        return productos.filter(p => {
            const matchesCategory = categoryFilter === 'Todas' || p.categoria === categoryFilter;
            const matchesSearch = (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        }).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    }, [productos, searchTerm, categoryFilter]);

    const handleSave = async (product: Producto | Producto[]) => {
        try {
            if (Array.isArray(product)) {
                await bulkCreateProductos(product);
                logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_CREADO', `Generó ${product.length} productos mediante matriz`, 'Catálogo');
            } else {
                if (product.id && !product.id.startsWith('preview')) {
                    await updateProducto(product.id, product);
                    logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_MODIFICADO', `Modificó el producto: ${product.nombre}`, 'Catálogo');
                } else {
                    const { id, ...cleanProduct } = product as any;
                    await createProducto(cleanProduct);
                    logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_CREADO', `Creó un nuevo producto: ${product.nombre}`, 'Catálogo');
                }
            }
            setIsMgmtModalOpen(false);
            setProductToEdit(null);
        } catch (error) { console.error(error); }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-20 pb-40 px-6 relative">
            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none"></div>

            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 relative z-10">
                <div className="space-y-6">
                    <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="text-7xl sm:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Master <span className="text-gold-gradient drop-shadow-gold italic">Catalog</span>
                    </motion.h1>

                    <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.8em] flex items-center gap-4">
                        <span className="w-16 h-[1px] bg-liquid-gold/30"></span> Specimen Repository Alpha
                    </p>
                </div>
                <button 
                    onClick={() => { setProductToEdit(null); setIsMgmtModalOpen(true); }} 
                    className="btn-luxury px-12 py-6 text-sm flex items-center gap-4 group"
                >
                    <AddIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                    <span>Expand Collection</span>
                </button>
            </div>

            {/* --- CONTROLS --- */}
            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="relative group flex-grow">
                    <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                    <input 
                        type="text" placeholder="QUERY ARCHIVE..." value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="input-atelier w-full pl-20 text-xs font-black uppercase tracking-[0.3em]"
                    />
                </div>
                <select 
                    value={categoryFilter} 
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="input-atelier md:w-80 appearance-none text-xs font-black uppercase tracking-widest cursor-pointer"
                >
                    {categories.map(cat => <option key={cat} value={cat} className="bg-brand-dark">{cat.toUpperCase()}</option>)}
                </select>
            </div>

            {/* --- GRID --- */}
            {loading ? (
                <div className="py-40 text-center"><div className="w-16 h-16 border-4 border-liquid-gold/20 border-t-liquid-gold rounded-full animate-spin mx-auto"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                    {filteredProductos.map(p => <ProductCard key={p.id} producto={p} onViewDetails={() => setViewingProduct(p)} />)}
                    {filteredProductos.length === 0 && <div className="col-span-full py-40 text-center opacity-10 uppercase font-black tracking-widest italic grayscale">Repository Offline</div>}
                </div>
            )}

            <ProductManagementModal isOpen={isMgmtModalOpen} onClose={() => setIsMgmtModalOpen(false)} onSave={handleSave} productToEdit={productToEdit} />

            <AnimatePresence>
                {viewingProduct && (
                    <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setViewingProduct(null)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card-luxury w-full max-w-4xl overflow-hidden flex relative z-10 border border-white/10">
                            <div className="w-1/2 bg-black/60 relative">
                                {viewingProduct.imagenUrl ? <img src={viewingProduct.imagenUrl} className="w-full h-full object-cover grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-1000" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><BoxIcon className="w-40 h-40" /></div>}
                                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent"></div>
                            </div>
                            <div className="w-1/2 p-16 space-y-10 flex flex-col justify-center">
                                <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em] border border-liquid-gold/20 px-6 py-2 rounded-full inline-block">{viewingProduct.categoria}</span>
                                <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{viewingProduct.nombre}</h1>
                                <p className="text-slate-400 text-lg leading-relaxed border-l-2 border-liquid-gold/30 pl-8 italic">{viewingProduct.descripcion || 'Premium selection from the Cordova Master Archive.'}</p>
                                <div className="pt-10 border-t border-white/5 items-end flex justify-between">
                                    <p className="text-6xl font-black text-white tracking-widest italic">{formatCurrency(viewingProduct.precio)}</p>
                                    <div className="flex gap-4">
                                        <button onClick={() => { setProductToEdit(viewingProduct); setViewingProduct(null); setIsMgmtModalOpen(true); }} className="p-5 bg-white/5 hover:bg-white text-slate-500 hover:text-black rounded-2xl transition-all"><PencilIcon className="w-6 h-6"/></button>
                                        <button onClick={() => { deleteProducto(viewingProduct.id); setViewingProduct(null); }} className="p-5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"><TrashIcon className="w-6 h-6"/></button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductosPage;
