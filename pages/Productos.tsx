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
import { ProductManagementModal } from '../components/ProductManagementModal';

// --- PRECISION LIGHT COMPONENTS ---

const ProductCard: React.FC<{
    producto: Producto;
    onViewDetails: () => void;
    onEdit: () => void;
}> = ({ producto, onViewDetails, onEdit }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            className="bg-obsidian-card rounded-[2.5rem] border border-white/[0.06] shadow-sm overflow-hidden group transition-all"
        >
            <div className="h-48 bg-white/[0.08] relative overflow-hidden cursor-pointer" onClick={onViewDetails}>
                {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <BoxIcon className="h-16 w-16 text-slate-200" />
                    </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                    {producto.esSRI && (
                        <span className="bg-brand-blue text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg shadow-brand-blue/20 tracking-widest uppercase">SRI</span>
                    )}
                    {producto.visiblePublico === false && (
                        <span className="bg-slate-900 text-white text-[8px] font-black px-3 py-1 rounded-full tracking-widest uppercase">Privado</span>
                    )}
                </div>
            </div>
            
            <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <span className="text-[9px] font-black text-brand-blue uppercase tracking-[0.3em] mb-1 block">{producto.categoria}</span>
                        <h3 className="text-lg font-black text-white uppercase leading-none tracking-tight line-clamp-1">{producto.nombre}</h3>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-white/[0.06] mt-2">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PVP Sugerido</p>
                        <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(producto.precio)}</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="p-3 bg-white/[0.04] hover:bg-brand-blue/5 text-slate-400 hover:text-brand-blue border border-white/[0.06] hover:border-brand-blue/20 rounded-xl transition-all"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={onViewDetails}
                            className="p-3 bg-brand-blue text-white rounded-xl shadow-lg shadow-brand-blue/20 active:scale-90 transition-all"
                        >
                            <ArrowRightIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ProductosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { 
        productos, loading, createProducto, updateProducto, 
        deleteProducto, bulkCreateProductos, refreshData, seedCatalog 
    } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
    const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false);
    const [mgmtModalMode, setMgmtModalMode] = useState<'SINGLE' | 'MATRIX'>('SINGLE');
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
            refreshData();
        } catch (error) { console.error(error); }
    };

    const handleSeed = async () => {
        if (window.confirm('¿Desea sincronizar el catálogo maestro? Esto agregará los productos predeterminados.')) {
            await seedCatalog();
            refreshData();
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar este activo? Esta acción no se puede deshacer.')) {
            try {
                await deleteProducto(id);
                setViewingProduct(null);
                refreshData();
                logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_ELIMINADO', `Eliminó el producto ID: ${id}`, 'Catálogo');
            } catch (error) {
                console.error(error);
                alert("Error al eliminar el producto");
            }
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 pb-40 pt-6 px-6 sm:px-12 relative animate-fade-in">
            {/* --- HEADER --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 border-b border-white/[0.06] pb-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-brand-blue" />
                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">Catálogo Maestro</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
                        Catálogo de Productos <span className="text-brand-blue font-bold">• Servicios</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/calculadora')}
                        className="px-8 py-5 bg-obsidian-card text-slate-300 hover:text-brand-blue border border-white/[0.06] rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3 shadow-sm"
                    >
                        <RulerIcon className="w-5 h-5" />
                        Calculadora
                    </button>
                    <button 
                        onClick={() => { setProductToEdit(null); setMgmtModalMode('MATRIX'); setIsMgmtModalOpen(true); }}
                        className="px-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-lg"
                    >
                        <TableIcon className="w-5 h-5 text-brand-blue" />
                        Matriz de Precios
                    </button>
                    <button 
                        onClick={() => { setProductToEdit(null); setMgmtModalMode('SINGLE'); setIsMgmtModalOpen(true); }}
                        className="px-10 py-5 bg-brand-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center gap-4"
                    >
                        <AddIcon className="w-5 h-5" />
                        Nuevo Activo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* --- SIDEBAR --- */}
                <aside className="lg:col-span-3 space-y-10">
                    <div className="bg-obsidian-card p-8 rounded-[2.5rem] border border-white/[0.06] shadow-sm space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">Categorías</h3>
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between group border ${
                                            categoryFilter === cat 
                                                ? 'bg-brand-blue/5 text-brand-blue border-brand-blue/20' 
                                                : 'hover:bg-white/[0.04] text-slate-400 border-transparent'
                                        }`}
                                    >
                                        <span className="font-black text-[10px] uppercase tracking-widest">{cat === 'Todas' ? 'Todo el Sistema' : cat}</span>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                                            categoryFilter === cat ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'                                             : 'bg-white/[0.08] text-slate-400'
                                        }`}>
                                            {cat === 'Todas' ? productos.length : productos.filter(p => p.categoria === cat).length}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/[0.06]">
                            <div className="bg-white/[0.04] p-6 rounded-3xl border border-white/[0.06] space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <ActivityIcon className="w-5 h-5 text-brand-blue" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Sincronización</span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Sincroniza el catálogo maestro con los valores predeterminados de fábrica.</p>
                                <button 
                                    onClick={handleSeed}
                                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-obsidian-card hover:bg-brand-blue text-slate-300 hover:text-white border border-white/[0.06] hover:border-brand-blue transition-all group font-black text-[9px] uppercase tracking-widest shadow-sm"
                                >
                                    <SparklesIcon className="w-4 h-4 text-brand-blue group-hover:text-white transition-colors" />
                                    Sincronizar Maestro
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <main className="lg:col-span-9 space-y-10">
                    <div className="bg-obsidian-card p-6 rounded-[2.5rem] border border-white/[0.06] shadow-sm flex items-center gap-6 relative">
                        <SearchIcon className="absolute left-12 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input 
                            type="text" placeholder="RASTREAR ACTIVO POR NOMBRE O SKU..." value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            className="w-full pl-16 pr-8 py-5 bg-white/[0.04] border border-white/[0.06] rounded-3xl text-[10px] font-black uppercase tracking-widest focus:bg-obsidian-card focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/5 outline-none transition-all"
                        />
                    </div>

                    {loading ? (
                        <div className="py-40 flex flex-col items-center justify-center">
                            <Loader2Icon className="w-12 h-12 text-brand-blue animate-spin mb-6" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Indexando Activos...</p>
                        </div>
                    ) : filteredProductos.length === 0 ? (
                        <div className="py-40 bg-obsidian-card rounded-[3rem] border border-white/[0.06] border-dashed flex flex-col items-center justify-center text-slate-300">
                            <BoxIcon className="w-20 h-20 mb-6 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em]">No se encontraron activos</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredProductos.map((prod) => (
                                <ProductCard 
                                    key={prod.id} 
                                    producto={prod} 
                                    onViewDetails={() => setViewingProduct(prod)} 
                                    onEdit={() => { setProductToEdit(prod); setIsMgmtModalOpen(true); }}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <ProductManagementModal 
                isOpen={isMgmtModalOpen} 
                onClose={() => setIsMgmtModalOpen(false)} 
                onSave={handleSave} 
                productToEdit={productToEdit} 
                defaultMode={mgmtModalMode}
            />
            
            <AnimatePresence>
                {viewingProduct && (
                    <div className="fixed inset-0 z-[100] flex justify-center items-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setViewingProduct(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-obsidian-card w-full max-w-5xl rounded-[3rem] overflow-hidden flex flex-col md:flex-row relative z-10 border border-white/[0.06] shadow-2xl">
                            <div className="md:w-1/2 bg-white/[0.08] relative group overflow-hidden">
                                {viewingProduct.imagenUrl ? (
                                    <img src={viewingProduct.imagenUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BoxIcon className="w-40 h-40 text-slate-200" />
                                    </div>
                                )}
                                <div className="absolute top-8 right-8">
                                    {viewingProduct.esSRI && <span className="bg-brand-blue text-white text-[10px] font-black px-5 py-2 rounded-full shadow-xl shadow-brand-blue/20 tracking-[0.2em] uppercase">SRI ELITE</span>}
                                </div>
                            </div>
                            <div className="md:w-1/2 p-12 md:p-20 flex flex-col justify-center">
                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.6em] mb-6 block">{viewingProduct.categoria}</span>
                                <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none mb-8">{viewingProduct.nombre}</h1>
                                <p className="text-slate-400 text-lg leading-relaxed border-l-4 border-white/[0.06] pl-8 mb-12 italic">{viewingProduct.descripcion || 'Especificación técnica de alta gama disponible en el centro de producción.'}</p>
                                
                                <div className="flex items-center justify-between pt-12 border-t border-white/[0.06]">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor Comercial</p>
                                        <p className="text-3xl font-black text-white tracking-tight">{formatCurrency(viewingProduct.precio || 0)}</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button 
                                            onClick={() => {
                                                const prod = viewingProduct;
                                                setViewingProduct(null);
                                                setProductToEdit(prod);
                                                setIsMgmtModalOpen(true);
                                            }}
                                            className="px-8 py-4 bg-brand-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all flex items-center gap-3"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                            Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(viewingProduct.id)}
                                            className="px-8 py-4 bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white border border-brand-red/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => setViewingProduct(null)} className="absolute top-10 right-10 p-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 rounded-2xl transition-all"><CloseIcon className="w-6 h-6" /></button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductosPage;
