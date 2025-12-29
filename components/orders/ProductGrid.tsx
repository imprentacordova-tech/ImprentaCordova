
import React, { useState, useMemo } from 'react';
import { Producto, TrabajoTipo, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';
import { 
    SearchIcon, DocumentIcon, ShieldCheckIcon, AddIcon, 
    CloseIcon, RulerIcon, TableIcon, SparklesIcon, ChevronRightIcon 
} from '../Icons';

interface ProductGridProps {
    onProductAction: (action: 'add', product: Producto) => void;
    productsInCart: Map<string, any>;
    jobType: TrabajoTipo;
    clientRegimen?: Regimen;
    onSetJobType: (type: TrabajoTipo) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ onProductAction, productsInCart, jobType, clientRegimen, onSetJobType }) => {
    const { productos } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBaseProduct, setSelectedBaseProduct] = useState<string | null>(null);

    // --- LÓGICA DE AGRUPACIÓN PREMIUM ---
    // Agrupamos por nombre base (ej: "Facturas SRI") y extraemos atributos
    const groupedProducts = useMemo(() => {
        const map = new Map<string, {
            name: string;
            categoria: string;
            esSRI: boolean;
            sizes: Set<string>;
            quantities: Set<string>;
            items: Producto[];
        }>();

        productos.forEach(p => {
            // Esperamos formato: "Nombre Base (Tamaño - Cantidad)"
            const match = p.nombre.match(/^(.*?) \((.*?) - (.*?)\)$/);
            const baseName = match ? match[1] : p.nombre;
            const size = match ? match[2] : 'Único';
            const qty = match ? match[3] : 'Estándar';

            if (!map.has(baseName)) {
                map.set(baseName, {
                    name: baseName,
                    categoria: p.categoria,
                    esSRI: !!p.esSRI,
                    sizes: new Set(),
                    quantities: new Set(),
                    items: []
                });
            }
            const group = map.get(baseName)!;
            group.sizes.add(size);
            group.quantities.add(qty);
            group.items.push(p);
        });

        return Array.from(map.values()).filter(g => 
            (jobType === TrabajoTipo.SRI ? g.esSRI : !g.esSRI) &&
            g.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [productos, jobType, searchTerm]);

    return (
        <div className="flex flex-col h-full animate-fade-in gap-6">
            {/* Header de Filtros Minimalista */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[2rem] border border-slate-100 dark:border-white/5">
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                    <button 
                        onClick={() => { onSetJobType(TrabajoTipo.SRI); setSelectedBaseProduct(null); }}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jobType === TrabajoTipo.SRI ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Talonarios SRI
                    </button>
                    <button 
                        onClick={() => { onSetJobType(TrabajoTipo.GENERAL); setSelectedBaseProduct(null); }}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jobType === TrabajoTipo.GENERAL ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Publicidad & Otros
                    </button>
                </div>
                
                <div className="relative flex-grow max-w-xs">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Filtrar servicios..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-2xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
                    />
                </div>
            </div>

            <div className="flex-grow overflow-hidden flex gap-6">
                {/* Lista de Productos Base (Izquierda) */}
                <div className="w-1/3 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {groupedProducts.map(group => {
                        const isSelected = selectedBaseProduct === group.name;
                        // Validación de Régimen para UX preventivo
                        const isBlocked = clientRegimen === Regimen.NEGOCIO_POPULAR && group.name.toLowerCase().includes('factura');

                        return (
                            <button
                                key={group.name}
                                onClick={() => !isBlocked && setSelectedBaseProduct(group.name)}
                                className={`w-full text-left p-5 rounded-[1.8rem] border-2 transition-all group relative overflow-hidden ${
                                    isSelected 
                                    ? 'bg-brand-blue border-brand-blue shadow-xl shadow-blue-900/20 translate-x-2' 
                                    : isBlocked 
                                    ? 'bg-slate-50 border-transparent opacity-40 cursor-not-allowed grayscale' 
                                    : 'bg-white dark:bg-slate-800 border-slate-50 dark:border-white/5 hover:border-brand-blue/30 shadow-sm'
                                }`}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl transition-colors ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                            {group.esSRI ? <ShieldCheckIcon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-brand-red'}`} /> : <DocumentIcon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />}
                                        </div>
                                        <div>
                                            <h3 className={`text-xs font-black uppercase tracking-tight leading-none mb-1 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                {group.name}
                                            </h3>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                                {group.categoria}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRightIcon className={`w-4 h-4 transition-transform ${isSelected ? 'text-white rotate-90' : 'text-slate-300 group-hover:translate-x-1'}`} />
                                </div>
                                {isBlocked && (
                                    <div className="absolute top-2 right-2 bg-slate-900 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        No permitido para Popular
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Configurador de Variaciones (Derecha) */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-inner p-8 overflow-y-auto custom-scrollbar">
                    {selectedBaseProduct ? (
                        <div className="space-y-10 animate-fade-in">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-brand-blue dark:text-white uppercase tracking-tighter italic">
                                        Configuración de <span className="text-brand-red">{selectedBaseProduct}</span>
                                    </h2>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Seleccione las especificaciones técnicas</p>
                                </div>
                                <SparklesIcon className="w-6 h-6 text-yellow-400 animate-pulse" />
                            </div>

                            {/* Selector de Tamaño */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <RulerIcon className="w-4 h-4" /> 1. Dimensiones (Formato)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {Array.from(groupedProducts.find(g => g.name === selectedBaseProduct)!.sizes).map(size => (
                                        <div key={size} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-transparent text-center">
                                            <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase">{size}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Selector de Cantidad / Precio Directo */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <TableIcon className="w-4 h-4" /> 2. Volumen de Impresión
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {groupedProducts.find(g => g.name === selectedBaseProduct)!.items.map(item => {
                                        // Extraer solo la cantidad del nombre para mostrarla limpia
                                        const qty = item.nombre.match(/- (.*?)\)/)?.[1] || 'Estándar';
                                        const inCart = productsInCart.get(item.id);

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => onProductAction('add', item)}
                                                className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all transform active:scale-[0.98] ${
                                                    inCart 
                                                    ? 'bg-brand-blue/5 border-brand-blue' 
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-gray-700 hover:border-brand-blue/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${inCart ? 'bg-brand-blue text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                                        {inCart ? inCart.cantidad : '+'}
                                                    </div>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase">{qty}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Precio Profesional</p>
                                                    <p className="text-lg font-black text-brand-blue">{formatCurrency(item.precio)}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-6 border-t dark:border-gray-700 flex items-center gap-4 text-slate-400">
                                <ShieldCheckIcon className="w-5 h-5 flex-shrink-0" />
                                <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                                    Los precios incluyen papel químico autocopiativo de alta sensibilidad y numeración secuencial garantizada por la normativa vigente del SRI Pasaje.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-[2.5rem] flex items-center justify-center mb-6">
                                <DocumentIcon className="w-12 h-12 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Seleccione un Producto</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Elija un servicio de la lista izquierda para configurar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;
