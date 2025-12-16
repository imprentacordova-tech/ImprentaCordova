
import React, { useState, useMemo } from 'react';
import { Producto, TrabajoTipo, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';
import { SearchIcon, DocumentIcon, ShieldCheckIcon, FolderIcon, AddIcon, CloseIcon } from '../Icons';

interface ProductGridProps {
    onProductAction: (action: 'add', product: Producto) => void;
    productsInCart: Map<string, any>;
    jobType: TrabajoTipo;
    clientRegimen?: Regimen;
    onSetJobType: (type: TrabajoTipo) => void;
}

// Interfaces Locales
interface ProductVariation { id: string; variationName: string; price: number; producto: Producto; }
interface ProductGroup { groupName: string; categoria: string; esSRI: boolean; variations: ProductVariation[]; isGroup: true; imagenUrl?: string; }
type DisplayableProduct = ProductGroup | (Producto & { isGroup?: false });

const ProductGroupModal: React.FC<{ group: ProductGroup | null; onClose: () => void; onAddProduct: (product: Producto) => void; }> = ({ group, onClose, onAddProduct }) => {
    if (!group) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FolderIcon className="w-5 h-5 text-brand-blue"/> {group.groupName}
                    </h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
                </div>
                <ul className="p-2 max-h-96 overflow-y-auto">
                    {group.variations.map(v => (
                        <li key={v.id} onClick={() => { onAddProduct(v.producto); onClose(); }} className="flex justify-between items-center p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg cursor-pointer transition-colors group">
                            <span className="font-medium text-gray-700 dark:text-gray-200 group-hover:text-brand-blue">{v.variationName}</span>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(v.price)}</span>
                                <button className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:bg-brand-blue group-hover:text-white transition-colors"><AddIcon className="w-4 h-4"/></button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const ProductGrid: React.FC<ProductGridProps> = ({ onProductAction, productsInCart, jobType, clientRegimen, onSetJobType }) => {
    const { productos } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [viewingGroup, setViewingGroup] = useState<ProductGroup | null>(null);

    // 1. Agrupar Productos
    const productGroupsAndItems = useMemo((): DisplayableProduct[] => {
        const groups = new Map<string, ProductGroup>();
        const singleItems: DisplayableProduct[] = [];
        const regex = /^(.*?) \((.*?)\)$/; // Detecta "Nombre (Variante)"
        
        for (const p of productos) {
            const match = p.nombre.match(regex);
            if (match) {
                const [, groupName, variationName] = match;
                const key = `${groupName}-${p.esSRI}`;
                if (!groups.has(key)) groups.set(key, { groupName, categoria: p.categoria, esSRI: !!p.esSRI, variations: [], isGroup: true, imagenUrl: p.imagenUrl });
                groups.get(key)!.variations.push({ id: p.id, variationName, price: p.precio, producto: p });
            } else {
                singleItems.push(p);
            }
        }
        return [...groups.values(), ...singleItems];
    }, [productos]);

    const categories = useMemo(() => ['Todas', ...new Set(productGroupsAndItems.filter(p => (jobType === TrabajoTipo.SRI ? p.esSRI : !p.esSRI)).map(p => p.categoria))], [productGroupsAndItems, jobType]);

    // 2. Filtrado Inteligente
    const filteredItems = useMemo(() => {
        let items = productGroupsAndItems.filter(p =>
            (jobType === TrabajoTipo.SRI ? !!p.esSRI : !p.esSRI) &&
            (selectedCategory === 'Todas' || p.categoria === selectedCategory) &&
            ('groupName' in p ? p.groupName : p.nombre).toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Lógica de Bloqueo por Régimen
        if (jobType === TrabajoTipo.SRI && clientRegimen) {
            items = items.map(item => {
                let currentItem: any = { ...item }; // Clone shallow
                const name = 'groupName' in item ? item.groupName : item.nombre;
                const isFactura = name.toLowerCase().includes('factura');
                const isNotaVenta = name.toLowerCase().includes('nota de venta');

                // Negocio Popular NO puede emitir facturas
                if (clientRegimen === Regimen.NEGOCIO_POPULAR && isFactura) {
                    currentItem.blocked = true; 
                    currentItem.reason = "Negocio Popular no emite Facturas";
                }
                // General/Emprendedor NO emite Notas de Venta (usualmente)
                if (clientRegimen !== Regimen.NEGOCIO_POPULAR && isNotaVenta) {
                    currentItem.blocked = true;
                    currentItem.reason = "Este régimen usa Facturas";
                }
                return currentItem;
            });
        }
        return items;
    }, [productGroupsAndItems, jobType, selectedCategory, searchTerm, clientRegimen]);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-grow relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar producto..." className="w-full pl-10 p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div className="flex-shrink-0 grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg h-fit self-start">
                    <button onClick={() => onSetJobType(TrabajoTipo.GENERAL)} className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${jobType === TrabajoTipo.GENERAL ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}><DocumentIcon className="w-4 h-4"/> General</button>
                    <button onClick={() => onSetJobType(TrabajoTipo.SRI)} className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${jobType === TrabajoTipo.SRI ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}><ShieldCheckIcon className="w-4 h-4"/> SRI</button>
                </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4 pb-2 border-b dark:border-gray-700 overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-brand-blue text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-grow overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-24 pr-2">
                {filteredItems.map((item: any) => {
                    const isGroup = 'groupName' in item;
                    const name = isGroup ? item.groupName : item.nombre;
                    const price = isGroup && item.variations[0] ? item.variations[0].price : item.precio;
                    const qty = !isGroup ? productsInCart.get(item.id)?.cantidad : 0; // Simple check
                    
                    return (
                        <div 
                            key={isGroup ? item.groupName : item.id}
                            onClick={() => !item.blocked && (isGroup ? setViewingGroup(item) : onProductAction('add', item))}
                            className={`relative bg-white dark:bg-gray-800 p-4 rounded-xl border-2 transition-all cursor-pointer group flex flex-col h-full 
                                ${qty > 0 ? 'border-brand-blue bg-blue-50/50' : 'border-transparent hover:border-brand-blue/30 hover:shadow-lg'}
                                ${item.blocked ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                            `}
                        >
                            {qty > 0 && <span className="absolute top-2 right-2 bg-brand-blue text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md z-10">{qty}</span>}
                            {item.blocked && <div className="absolute inset-0 z-20 flex items-center justify-center"><span className="bg-black/70 text-white text-[10px] px-2 py-1 rounded font-bold">{item.reason}</span></div>}
                            
                            <div className="mb-3 self-center p-3 bg-gray-50 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform">
                                {isGroup ? <FolderIcon className="w-8 h-8 text-brand-blue"/> : <DocumentIcon className="w-8 h-8 text-gray-400"/>}
                            </div>
                            
                            <div className="text-center mt-auto">
                                <h3 className="font-bold text-gray-800 dark:text-white text-sm leading-tight mb-1 line-clamp-2">{name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.categoria}</p>
                                <p className="text-brand-blue font-bold bg-blue-50 dark:bg-blue-900/30 inline-block px-2 py-0.5 rounded text-sm">
                                    {isGroup ? 'Ver opciones' : formatCurrency(price)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <ProductGroupModal group={viewingGroup} onClose={() => setViewingGroup(null)} onAddProduct={(p) => onProductAction('add', p)} />
        </div>
    );
};

export default ProductGrid;
