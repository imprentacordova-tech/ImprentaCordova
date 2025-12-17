
import React, { useState, useMemo } from 'react';
import { Producto, TrabajoTipo, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';
import { SearchIcon, DocumentIcon, ShieldCheckIcon, FolderIcon, AddIcon, CloseIcon, BoxIcon, StarIcon } from '../Icons';

interface ProductGridProps {
    onProductAction: (action: 'add', product: Producto) => void;
    productsInCart: Map<string, any>;
    jobType: TrabajoTipo;
    clientRegimen?: Regimen;
    onSetJobType: (type: TrabajoTipo) => void;
}

interface ProductVariation { id: string; variationName: string; price: number; producto: Producto; }
interface ProductGroup { groupName: string; categoria: string; esSRI: boolean; variations: ProductVariation[]; isGroup: true; imagenUrl?: string; }
type DisplayableProduct = ProductGroup | (Producto & { isGroup?: false });

const ProductGroupModal: React.FC<{ group: ProductGroup | null; onClose: () => void; onAddProduct: (product: Producto) => void; }> = ({ group, onClose, onAddProduct }) => {
    if (!group) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="bg-brand-blue/10 p-2 rounded-xl text-brand-blue"><FolderIcon className="w-6 h-6"/></div>
                        {group.groupName}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                    <div className="space-y-2">
                        {group.variations.map(v => (
                            <div key={v.id} onClick={() => { onAddProduct(v.producto); onClose(); }} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-brand-blue hover:shadow-md transition-all group">
                                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-brand-blue text-sm">{v.variationName}</span>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-lg text-gray-900 dark:text-white">{formatCurrency(v.price)}</span>
                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                        <AddIcon className="w-5 h-5"/>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductGrid: React.FC<ProductGridProps> = ({ onProductAction, productsInCart, jobType, clientRegimen, onSetJobType }) => {
    const { productos } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todas');
    const [viewingGroup, setViewingGroup] = useState<ProductGroup | null>(null);

    const productGroupsAndItems = useMemo((): DisplayableProduct[] => {
        const groups = new Map<string, ProductGroup>();
        const singleItems: DisplayableProduct[] = [];
        const regex = /^(.*?) \((.*?)\)$/;
        
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

    const filteredItems = useMemo(() => {
        let items = productGroupsAndItems.filter(p =>
            (jobType === TrabajoTipo.SRI ? !!p.esSRI : !p.esSRI) &&
            (selectedCategory === 'Todas' || p.categoria === selectedCategory) &&
            ('groupName' in p ? p.groupName : p.nombre).toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (jobType === TrabajoTipo.SRI && clientRegimen) {
            items = items.map(item => {
                let currentItem: any = { ...item };
                const name = 'groupName' in item ? item.groupName : item.nombre;
                const nameLower = name.toLowerCase();
                
                const isFactura = nameLower.includes('factura');
                
                if (clientRegimen === Regimen.NEGOCIO_POPULAR && isFactura) {
                    currentItem.blocked = true; 
                    currentItem.reason = "Popular NO emite Facturas";
                } 
                return currentItem;
            });
        }
        return items;
    }, [productGroupsAndItems, jobType, selectedCategory, searchTerm, clientRegimen]);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header Controls */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
                
                {/* Search */}
                <div className="flex-grow relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Buscar productos..." 
                        className="w-full pl-12 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all font-medium" 
                    />
                </div>

                {/* Job Type Toggle */}
                <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex gap-1">
                    <button 
                        onClick={() => onSetJobType(TrabajoTipo.GENERAL)} 
                        className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${jobType === TrabajoTipo.GENERAL ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <DocumentIcon className="w-4 h-4"/> General
                    </button>
                    <button 
                        onClick={() => onSetJobType(TrabajoTipo.SRI)} 
                        className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${jobType === TrabajoTipo.SRI ? 'bg-white dark:bg-gray-700 text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ShieldCheckIcon className="w-4 h-4"/> SRI
                    </button>
                </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-6 pb-1">
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)} 
                        className={`
                            px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all border
                            ${selectedCategory === cat 
                                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400'}
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-grow overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pr-2 pb-24 content-start">
                {filteredItems.map((item: any) => {
                    const isGroup = 'groupName' in item;
                    const name = isGroup ? item.groupName : item.nombre;
                    const price = isGroup && item.variations[0] ? item.variations[0].price : item.precio;
                    const qty = !isGroup ? productsInCart.get(item.id)?.cantidad : 0; 
                    
                    return (
                        <div 
                            key={isGroup ? item.groupName : item.id}
                            onClick={() => !item.blocked && (isGroup ? setViewingGroup(item) : onProductAction('add', item))}
                            className={`
                                relative p-4 rounded-2xl border-2 transition-all cursor-pointer group flex flex-col h-full bg-white dark:bg-gray-800
                                ${qty > 0 ? 'border-brand-blue ring-2 ring-brand-blue/20' : 'border-transparent shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-100 dark:hover:border-gray-600'}
                                ${item.blocked ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                            `}
                        >
                            {/* Quantity Badge */}
                            {qty > 0 && (
                                <span className="absolute -top-2 -right-2 bg-brand-blue text-white text-xs font-black w-7 h-7 flex items-center justify-center rounded-full shadow-lg border-2 border-white z-10 animate-bounce-in">
                                    {qty}
                                </span>
                            )}

                            {/* Blocked Overlay */}
                            {item.blocked && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-black/60 rounded-2xl backdrop-blur-[1px]">
                                    <span className="bg-red-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-md uppercase tracking-wider">{item.reason}</span>
                                </div>
                            )}
                            
                            {/* Icon / Image Placeholder */}
                            <div className={`
                                mb-4 self-center p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110
                                ${isGroup ? 'bg-blue-50 text-brand-blue' : 'bg-gray-50 text-gray-400 dark:bg-gray-700 dark:text-gray-300'}
                            `}>
                                {isGroup ? <FolderIcon className="w-10 h-10"/> : <BoxIcon className="w-10 h-10"/>}
                            </div>
                            
                            <div className="text-center mt-auto">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-1 line-clamp-2">{name}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">{item.categoria}</p>
                                
                                {isGroup ? (
                                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                        Ver Opciones <AddIcon className="w-3 h-3"/>
                                    </div>
                                ) : (
                                    <p className="text-xl font-black text-brand-blue tracking-tight">
                                        {formatCurrency(price)}
                                    </p>
                                )}
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
