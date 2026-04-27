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
    const { 
        productos, loading, createProducto, updateProducto, 
        deleteProducto, bulkCreateProductos, refreshData, seedCatalog 
    } = useData();
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
      <div className="flex flex-col h-screen bg-[#0a0a0b] text-white">
        {/* Header Estilo Industrial Elite */}
        <header className="p-6 border-b border-white/5 bg-black/40 backdrop-blur-xl flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a050] to-[#8a6d29] flex items-center justify-center shadow-lg shadow-[#c9a050]/20">
              <BoxIcon className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent uppercase italic">
                Bóveda de Activos <span className="text-liquid-gold">Gráficos</span>
              </h1>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">
                Logística de Especificaciones Industriales
              </p>
            </div>
          </div>
  
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/calculadora')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-liquid-gold"
            >
              <RulerIcon className="w-4 h-4" />
              Acceder a Calculadora
            </button>
            <button 
              onClick={() => { setProductToEdit(null); setMgmtModalMode('SINGLE'); setIsMgmtModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest"
            >
              <AddIcon className="w-4 h-4 text-liquid-gold" />
              Registrar Activo
            </button>
            <button 
              onClick={() => { setProductToEdit(null); setMgmtModalMode('MATRIX'); setIsMgmtModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient hover:brightness-110 text-black rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-gold-glow-sm"
            >
              <TableIcon className="w-4 h-4" />
              Núcleo de Generación
            </button>
          </div>
        </header>
  
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar de Categorías - Estilo ERP Premium */}
          <aside className="w-80 border-r border-white/5 bg-black/40 p-8 flex flex-col gap-10 overflow-y-auto shrink-0">
            <div>
              <h3 className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] mb-6">
                Directorio de Activos
              </h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between group border ${
                      categoryFilter === cat 
                        ? 'bg-gradient-to-br from-[#c9a050]/20 to-transparent text-[#c9a050] border-[#c9a050]/30' 
                        : 'hover:bg-white/5 text-white/40 border-transparent'
                    }`}
                  >
                    <span className="font-bold text-[11px] uppercase tracking-widest">{cat === 'Todas' ? 'Sistema Integral' : cat}</span>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                      categoryFilter === cat ? 'bg-[#c9a050] text-black' : 'bg-white/5 text-white/20 group-hover:text-white/40'
                    }`}>
                      {cat === 'Todas' ? productos.length : productos.filter(p => p.categoria === cat).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
  
            <div className="mt-auto p-6 rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#c9a050]/10 blur-3xl -mr-12 -mt-12"></div>
              <div className="flex items-center gap-3 mb-4">
                <ActivityIcon className="w-5 h-5 text-[#c9a050]" />
                <span className="text-[11px] font-black uppercase tracking-widest">Sincronización</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-white/30 uppercase tracking-tighter">SKUs Registrados</span>
                  <span className="font-mono text-[#c9a050]">{productos.length}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-white/30 uppercase tracking-tighter">Estado Base de Datos</span>
                  <span className="text-green-500 uppercase">Online</span>
                </div>
                
                <button 
                    onClick={handleSeed}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-liquid-gold/10 border border-white/5 hover:border-liquid-gold/30 transition-all group"
                >
                    <SparklesIcon className="w-3.5 h-3.5 text-liquid-gold group-hover:scale-125 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-liquid-gold">Sincronizar Maestro</span>
                </button>

                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-gradient-to-r from-[#c9a050] to-[#8a6d29] w-full rounded-full shadow-[0_0_15px_#c9a05033]" />
                </div>
              </div>
            </div>
          </aside>
  
          {/* Main Content Area */}
          <main className="flex-1 flex flex-col bg-[#050505] overflow-hidden">
            {/* Sub-Header con Búsqueda */}
            <div className="p-6 border-b border-white/5 bg-black/20 flex gap-6 items-center shrink-0">
              <div className="relative flex-1 group">
                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/10 group-focus-within:text-[#c9a050] transition-colors" />
                <input 
                  type="text"
                  placeholder="CONSULTAR ARCHIVO POR NOMBRE O SKU..."
                  className="w-full bg-white/[0.02] border border-white/10 rounded-2xl py-4 pl-16 pr-6 focus:outline-none focus:border-[#c9a050]/40 focus:ring-1 focus:ring-[#c9a050]/10 transition-all text-[11px] font-black uppercase tracking-[0.2em]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
  
            {/* Grid de Productos Elite */}
            <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-white/5">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-2 border-[#c9a050]/20 border-t-[#c9a050] rounded-full animate-spin"></div>
                </div>
              ) : filteredProductos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/10">
                  <BoxIcon className="w-20 h-20 mb-6 opacity-5" />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">No se encontraron activos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
                  {filteredProductos.map((prod) => (
                    <div 
                      key={prod.id}
                      onClick={() => setViewingProduct(prod)}
                      className="group relative bg-[#0d0d0f] border border-white/5 rounded-3xl p-8 hover:border-[#c9a050]/40 transition-all duration-700 cursor-pointer overflow-hidden shadow-2xl hover:shadow-[#c9a050]/5"
                    >
                        {/* Efecto de Luz Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a050]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                      <div className="flex justify-between items-start mb-8 relative z-10">
                        <span className="px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#c9a050] border border-[#c9a050]/10">
                          {prod.categoria}
                        </span>
                        <div className="flex gap-2">
                          {/* Botón de Ver Detalle - Siempre visible para claridad */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setViewingProduct(prod); }}
                            className="p-2.5 bg-white/5 rounded-xl text-white/40 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                            title="Ver Detalle"
                          >
                            <SearchIcon className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Botón de Editar - Siempre visible */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setProductToEdit(prod); setIsMgmtModalOpen(true); }}
                            className="p-2.5 bg-[#c9a050]/10 rounded-xl text-[#c9a050] hover:bg-[#c9a050] hover:text-black transition-all border border-[#c9a050]/20"
                            title="Editar Producto"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
  
                      <h3 className="font-black text-lg mb-2 group-hover:text-[#c9a050] transition-colors uppercase tracking-tight leading-none italic">
                        {prod.nombre}
                      </h3>
                      <p className="text-white/30 text-[11px] line-clamp-2 min-h-[2.5rem] leading-relaxed mb-8 italic">
                        {prod.descripcion || 'Repositorio industrial alpha - Especificación protegida.'}
                      </p>
  
                      <div className="flex justify-between items-end pt-8 border-t border-white/5 relative z-10">
                        <div>
                          <p className="text-[9px] text-white/10 font-black uppercase tracking-widest mb-1">Costo Base</p>
                          <p className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-left italic">
                            <span className="text-[#c9a050] text-sm mr-1">$</span>
                            {prod.precio.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                            prod.esActivo !== false 
                              ? 'bg-[#c9a050]/5 border-[#c9a050]/10 text-[#c9a050]' 
                              : 'bg-red-500/5 border-red-500/10 text-red-500'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${prod.esActivo !== false ? 'bg-[#c9a050] animate-pulse' : 'bg-red-500'}`} />
                            <span className="text-[9px] font-black uppercase tracking-tighter">
                              {prod.esActivo !== false ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          {prod.visiblePublico === false && (
                            <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-white/30">
                              <span className="text-[8px] font-black uppercase tracking-tighter">Privado</span>
                            </div>
                          )}
                        </div>
                      </div>
  
                      {/* SRI Indicator */}
                      {prod.esSRI && (
                        <div className="absolute top-8 right-8 bg-[#c9a050] text-black text-[8px] font-black px-3 py-1 rounded-sm shadow-xl shadow-[#c9a050]/20 rotate-12">
                          SRI
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                <div className="fixed inset-0 z-50 flex justify-center items-center p-6">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setViewingProduct(null)} />
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#0d0d0f] w-full max-w-5xl rounded-[3rem] overflow-hidden flex relative z-10 border border-white/10 shadow-[0_0_100px_rgba(201,160,80,0.1)]">
                        <div className="w-1/2 bg-black/40 relative group overflow-hidden">
                            {viewingProduct.imagenUrl ? <img src={viewingProduct.imagenUrl} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[2s]" /> : <div className="w-full h-full flex items-center justify-center opacity-5"><BoxIcon className="w-60 h-60" /></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent"></div>
                        </div>
                        <div className="w-1/2 p-20 flex flex-col justify-center">
                            <span className="text-[10px] font-black text-[#c9a050] uppercase tracking-[0.8em] mb-10 block">{viewingProduct.categoria}</span>
                            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-none mb-10">{viewingProduct.nombre}</h1>
                            <p className="text-white/40 text-xl leading-relaxed border-l-2 border-[#c9a050]/20 pl-10 italic mb-12">{viewingProduct.descripcion || 'Especificación técnica de alta gama disponible en el centro de producción alpha.'}</p>
                            <div className="flex items-center justify-between pt-12 border-t border-white/5">
                                <div className="flex flex-col items-end gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] mb-2">Valor Comercial</p>
                                        <p className="text-7xl font-black text-white tracking-tighter italic"><span className="text-[#c9a050] text-3xl">$</span>{(viewingProduct.precio || 0).toFixed(2)}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => {
                                                const prod = viewingProduct;
                                                setViewingProduct(null);
                                                setProductToEdit(prod);
                                                setIsMgmtModalOpen(true);
                                            }}
                                            className="px-8 py-4 bg-[#c9a050]/10 hover:bg-[#c9a050] text-[#c9a050] hover:text-black rounded-2xl transition-all duration-500 border border-[#c9a050]/20 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                            Editar Producto
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(viewingProduct.id)}
                                            className="px-8 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all duration-500 border border-red-500/20 flex items-center gap-3 font-black text-[10px] uppercase tracking-widest"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            Eliminar
                                        </button>
                                        <button onClick={() => setViewingProduct(null)} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all">
                                            <CloseIcon className="w-6 h-6" />
                                        </button>
                                    </div>
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
