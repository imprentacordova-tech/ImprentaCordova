import React, { useState, useEffect, useMemo } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../services/mockApi';
import { Producto } from '../types';
import { BoxIcon, Cog8ToothIcon, CloseIcon, PencilIcon, TrashIcon, PhotoIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

// Helper to read file as Base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


const ProductManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Producto) => void;
    productToEdit: Producto | null;
}> = ({ isOpen, onClose, onSave, productToEdit }) => {
    const [product, setProduct] = useState<Partial<Producto>>({});
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (productToEdit) {
            setProduct(productToEdit);
            setImagePreview(productToEdit.imagenUrl || null);
        } else {
            setProduct({
                nombre: '',
                descripcion: '',
                precio: 0,
                categoria: 'General',
                esSRI: false
            });
            setImagePreview(null);
        }
    }, [productToEdit, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
            setProduct({ ...product, [name]: e.target.checked });
        } else if (type === 'number') {
             setProduct({ ...product, [name]: parseFloat(value) });
        }
        else {
            setProduct({ ...product, [name]: value });
        }
    };
    
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await toBase64(file);
            setProduct({ ...product, imagenUrl: base64 });
            setImagePreview(base64);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(product as Producto);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagen del Producto</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Vista previa" className="mx-auto h-32 w-auto rounded-md object-contain" />
                                    ) : (
                                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    )}
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-brand-blue hover:text-blue-700 focus-within:outline-none">
                                            <span>Subir un archivo</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                        </label>
                                        <p className="pl-1">o arrastrar y soltar</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                                <input type="text" name="nombre" id="nombre" value={product.nombre || ''} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                                <input type="text" name="categoria" id="categoria" value={product.categoria || ''} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label htmlFor="precio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Precio</label>
                                <input type="number" name="precio" id="precio" value={product.precio || 0} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600" step="0.01" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                        <textarea name="descripcion" id="descripcion" rows={3} value={product.descripcion || ''} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </div>
                    <div className="flex items-center">
                        <input id="esSRI" name="esSRI" type="checkbox" checked={product.esSRI || false} onChange={handleChange} className="h-4 w-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue" />
                        <label htmlFor="esSRI" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">¿Es un producto autorizado por el SRI?</label>
                    </div>
                </form>
                <div className="flex justify-end items-center p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl mt-auto">
                    <button onClick={onClose} className="px-4 py-2 mr-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg shadow-md hover:bg-blue-800 transition-colors">Guardar Producto</button>
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-1/2">
                    {producto.imagenUrl ? (
                        <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-64 md:h-full object-cover rounded-t-xl md:rounded-l-xl md:rounded-tr-none" />
                    ) : (
                        <div className="w-full h-64 md:h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
                            <BoxIcon className="h-24 w-24 text-gray-300 dark:text-gray-500" />
                        </div>
                    )}
                </div>
                <div className="w-full md:w-1/2 flex flex-col p-6">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{producto.nombre}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 -mt-2 -mr-2">
                            <CloseIcon className="w-7 h-7" />
                        </button>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{producto.categoria}</p>
                        {producto.esSRI && <span className="text-xs font-bold text-white bg-blue-600 px-2 py-1 rounded-full">SRI</span>}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 flex-grow mb-4">{producto.descripcion}</p>
                    <div className="border-t dark:border-gray-700 pt-4 mt-auto">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500 dark:text-gray-400">Precio:</span>
                            <p className="text-3xl font-extrabold text-brand-blue">{formatCurrency(producto.precio)}</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                                <PencilIcon className="h-5 w-5"/>
                                Editar
                            </button>
                            <button onClick={onDelete} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-brand-red font-semibold rounded-lg hover:bg-red-200 transition-colors">
                                <TrashIcon className="h-5 w-5"/>
                                Eliminar
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
        <div onClick={onViewDetails} className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1">
            {producto.imagenUrl ? (
                <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-40 object-cover" />
            ) : (
                <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <BoxIcon className="h-16 w-16 text-gray-300 dark:text-gray-500" />
                </div>
            )}
            <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{producto.nombre}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{producto.categoria}</p>
                <div className="flex justify-between items-center mt-3">
                    <p className="text-xl font-extrabold text-brand-blue">{formatCurrency(producto.precio)}</p>
                    {producto.esSRI && <span className="text-xs font-bold text-white bg-blue-600 px-2 py-1 rounded-full">SRI</span>}
                </div>
            </div>
        </div>
    );
};

const ConfirmationModal: React.FC<{
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onCancel}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
             <div className="p-6 text-center">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirmar Eliminación</h3>
                 <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.</p>
            </div>
             <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                 <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancelar</button>
                 <button onClick={onConfirm} className="px-4 py-2 bg-brand-red text-white font-semibold rounded-lg hover:bg-red-700">Eliminar</button>
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
        });
    }, [productos, searchTerm, categoryFilter]);

    const handleSave = async (product: Producto) => {
        if (product.id) {
            await updateProducto(product.id, product);
        } else {
            await createProducto(product);
        }
        await fetchProductos();
        handleCloseMgmtModal();
        if (viewingProduct?.id === product.id) {
            setViewingProduct(product);
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (productToDelete) {
            await deleteProducto(productToDelete.id);
            await fetchProductos();
            setProductToDelete(null);
            if (viewingProduct?.id === productToDelete.id) {
                setViewingProduct(null);
            }
        }
    };

    const handleOpenMgmtModal = () => setIsMgmtModalOpen(true);
    const handleCloseMgmtModal = () => {
        setIsMgmtModalOpen(false);
        setProductToEdit(null);
    };

    const handleEdit = (product: Producto) => {
        setProductToEdit(product);
        setViewingProduct(null); // Close detail view if open
        handleOpenMgmtModal();
    };
    
    const handleDeleteRequest = (product: Producto) => {
        setProductToDelete(product);
        setViewingProduct(null); // Close detail view if open
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Catálogo de Productos</h1>
                <button onClick={handleOpenMgmtModal} className="flex items-center justify-center gap-2 bg-brand-blue text-white font-bold py-2 px-5 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                    <Cog8ToothIcon className="h-5 w-5"/>
                    <span>+ Nuevo Producto</span>
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
                <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="md:w-60 p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            
            {loading ? <p>Cargando productos...</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProductos.map(p => (
                        <ProductCard key={p.id} producto={p} onViewDetails={() => setViewingProduct(p)} />
                    ))}
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
