import React, { useState, useMemo, useEffect } from 'react';
import { Producto, TrabajoTipo, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';
import { getConfig } from '../../services/configService';
import { 
    SearchIcon, DocumentIcon, ShieldCheckIcon, AddIcon, 
    RulerIcon, SparklesIcon, CheckCircleIcon, LayersIcon, 
    FileStackIcon, BoxIcon, ChevronRightIcon, MonitorIcon
} from '../Icons';

interface ProductGridProps {
    onProductAction: (action: 'add', product: Producto & { surcharge?: number, surchargeLabel?: string }) => void;
    productsInCart: Map<string, any>;
    jobType: TrabajoTipo;
    clientRegimen?: Regimen;
    onSetJobType: (type: TrabajoTipo) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ onProductAction, productsInCart, jobType, clientRegimen, onSetJobType }) => {
    const { productos } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBaseName, setSelectedBaseName] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedQty, setSelectedQty] = useState<string | null>(null);
    
    const [perforar, setPerforar] = useState(false);
    const config = getConfig();

    // Resetear niveles inferiores al cambiar el superior
    useEffect(() => {
        setSelectedSize(null);
        setSelectedQty(null);
        setPerforar(false);
    }, [selectedBaseName, jobType]);

    // Lógica de Agrupamiento Pro
    const baseProducts = useMemo(() => {
        const map = new Map<string, {
            name: string;
            categoria: string;
            esSRI: boolean;
            sizes: Set<string>;
            items: Producto[];
        }>();

        productos.forEach(p => {
            // Regex para extraer el nombre base ignorando el paréntesis de variaciones
            const match = p.nombre.match(/^(.*?) \((.*?) - (.*?)\)$/);
            const baseName = match ? match[1] : p.nombre;
            const size = match ? match[2] : 'Estándar';

            if (!map.has(baseName)) {
                map.set(baseName, {
                    name: baseName,
                    categoria: p.categoria,
                    esSRI: !!p.esSRI,
                    sizes: new Set(),
                    items: []
                });
            }
            const group = map.get(baseName)!;
            group.sizes.add(size);
            group.items.push(p);
        });

        return Array.from(map.values()).filter(g => 
            (jobType === TrabajoTipo.SRI ? g.esSRI : !g.esSRI) &&
            g.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [productos, jobType, searchTerm]);

    const currentGroup = useMemo(() => 
        baseProducts.find(g => g.name === selectedBaseName), 
    [baseProducts, selectedBaseName]);

    const availableQuantities = useMemo(() => {
        if (!currentGroup || !selectedSize) return [];
        return currentGroup.items
            .filter(p => p.nombre.includes(`(${selectedSize} -`))
            .map(p => {
                const qMatch = p.nombre.match(/- (.*?)\)$/);
                return { label: qMatch ? qMatch[1] : 'Fijo', product: p };
            });
    }, [currentGroup, selectedSize]);

    // PRODUCTO FINAL DETECTADO
    const selectedProductObject = useMemo(() => {
        if (!selectedQty) return null;
        return availableQuantities.find(q => q.label === selectedQty)?.product || null;
    }, [availableQuantities, selectedQty]);

    const currentPrice = useMemo(() => {
        if (!selectedProductObject) return 0;
        return selectedProductObject.precio + (perforar ? config.costoPerforado : 0);
    }, [selectedProductObject, perforar]);

    const handleFinalAdd = () => {
        if (!selectedProductObject) return;
        onProductAction('add', { 
            ...selectedProductObject, 
            surcharge: perforar ? config.costoPerforado : 0, 
            surchargeLabel: perforar ? "+ Perforado" : "" 
        });
        // Feedback visual
        setSelectedQty(null);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in gap-4">
            {/* Header / Buscador */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-100 dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-white/5">
                <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner border border-slate-100 dark:border-gray-700">
                    <button onClick={() => onSetJobType(TrabajoTipo.SRI)} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jobType === TrabajoTipo.SRI ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400'}`}>Talonarios SRI</button>
                    <button onClick={() => onSetJobType(TrabajoTipo.GENERAL)} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jobType === TrabajoTipo.GENERAL ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400'}`}>General</button>
                </div>
                <div className="relative flex-grow max-w-xs">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar servicio..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-2xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-brand-blue/20 outline-none" />
                </div>
            </div>

            {/* Grid Triple Cascada */}
            <div className="flex-grow overflow-hidden flex flex-col md:flex-row gap-4">
                {/* 1. Servicios Base */}
                <div className="w-full md:w-1/3 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                    {baseProducts.map(group => (
                        <button 
                            key={group.name} 
                            onClick={() => setSelectedBaseName(group.name)} 
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all group ${selectedBaseName === group.name ? 'bg-brand-blue border-brand-blue shadow-lg translate-x-1' : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl transition-colors ${selectedBaseName === group.name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-brand-blue'}`}>
                                    {group.esSRI ? <ShieldCheckIcon className="w-5 h-5" /> : <BoxIcon className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className={`text-[10px] font-black uppercase truncate leading-none mb-1 ${selectedBaseName === group.name ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{group.name}</h3>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${selectedBaseName === group.name ? 'text-blue-200' : 'text-slate-400'}`}>{group.categoria}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* 2. Variaciones (Tamaño y Cantidad) */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-inner p-8 overflow-y-auto custom-scrollbar">
                    {selectedBaseName ? (
                        <div className="space-y-8 animate-fade-in">
                            {/* Selector de Tamaño */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <RulerIcon className="w-4 h-4 text-brand-blue" /> 1. DEFINA TAMAÑO
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(currentGroup?.sizes || []).map(size => (
                                        <button 
                                            key={size} 
                                            onClick={() => { setSelectedSize(size); setSelectedQty(null); }} 
                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${selectedSize === size ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400 hover:border-slate-200'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Selector de Cantidad / Tipo */}
                            {selectedSize && (
                                <div className="space-y-4 animate-slide-in-up">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <LayersIcon className="w-4 h-4 text-brand-red" /> 2. DEFINA CANTIDAD / TIPO
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {availableQuantities.map(q => (
                                            <button 
                                                key={q.label} 
                                                onClick={() => setSelectedQty(q.label)} 
                                                className={`p-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 text-center flex flex-col items-center gap-1 ${selectedQty === q.label ? 'bg-brand-blue border-brand-blue text-white shadow-xl scale-105' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-gray-700 text-slate-500 hover:border-brand-blue/30'}`}
                                            >
                                                <span className="opacity-60 text-[8px]">Opciones:</span>
                                                {q.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resumen de Precio y Acción */}
                            {selectedQty && (
                                <div className="space-y-6 pt-8 border-t dark:border-gray-700 animate-fade-in">
                                    <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 shadow-sm gap-4">
                                        <div>
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Inversión Final Sugerida</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-black text-brand-blue tracking-tighter">{formatCurrency(currentPrice)}</span>
                                                <span className="text-xs font-bold text-blue-400">+ IVA</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setPerforar(!perforar)} 
                                                className={`px-4 py-3 rounded-xl border-2 flex items-center gap-2 transition-all ${perforar ? 'bg-amber-400 border-amber-400 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100'}`}
                                            >
                                                <SparklesIcon className="w-4 h-4"/> 
                                                <span className="text-[9px] font-black uppercase">Perforar</span>
                                            </button>
                                            <button 
                                                onClick={handleFinalAdd} 
                                                className="px-8 py-4 bg-brand-red text-white font-black rounded-2xl shadow-xl hover:bg-slate-950 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                                            >
                                                Añadir <AddIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                            <MonitorIcon className="w-20 h-20 text-slate-300" />
                            <p className="text-xs font-black uppercase tracking-[0.3em]">Selecciona un servicio a la izquierda</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;