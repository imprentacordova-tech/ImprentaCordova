
import React, { useState, useMemo, useEffect } from 'react';
import { Producto, TrabajoTipo, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';
import { getConfig } from '../../services/configService';
import { 
    SearchIcon, DocumentIcon, ShieldCheckIcon, AddIcon, 
    CloseIcon, RulerIcon, TableIcon, SparklesIcon, ChevronRightIcon,
    ExclamationTriangleIcon, LayersIcon, FileStackIcon, CheckCircleIcon
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
    
    // Adicionales locales
    const [perforar, setPerforar] = useState(false);
    const [copiaExtra, setCopiaExtra] = useState(false);
    const config = getConfig();

    // Resetear sub-pasos al cambiar de producto base
    useEffect(() => {
        setSelectedSize(null);
        setSelectedQty(null);
        setPerforar(false);
        setCopiaExtra(false);
    }, [selectedBaseName]);

    // Agrupación Maestra
    const baseProducts = useMemo(() => {
        const map = new Map<string, {
            name: string;
            categoria: string;
            esSRI: boolean;
            sizes: Set<string>;
            items: Producto[];
        }>();

        productos.forEach(p => {
            const match = p.nombre.match(/^(.*?) \((.*?) - (.*?)\)$/);
            const baseName = match ? match[1] : p.nombre;
            const size = match ? match[2] : 'Único';

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
                return { label: qMatch ? qMatch[1] : 'Estándar', product: p };
            });
    }, [currentGroup, selectedSize]);

    const selectedProductObject = useMemo(() => {
        if (!selectedQty) return null;
        return availableQuantities.find(q => q.label === selectedQty)?.product || null;
    }, [availableQuantities, selectedQty]);

    const handleFinalAdd = () => {
        if (!selectedProductObject) return;
        
        let surcharge = 0;
        let surchargeLabel = "";
        
        if (perforar) {
            surcharge += config.costoPerforado;
            surchargeLabel += " + Perforado";
        }
        
        // Si Pedro quiere manejar el costo de copia extra aquí, se sumaría también. 
        // Por ahora implementamos el perforado solicitado.

        onProductAction('add', { 
            ...selectedProductObject, 
            surcharge, 
            surchargeLabel: surchargeLabel.trim() 
        });

        // Feedback visual y reset parcial
        setSelectedQty(null);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in gap-6">
            {/* Header / Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[2rem] border border-slate-100 dark:border-white/5">
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700">
                    <button 
                        onClick={() => { onSetJobType(TrabajoTipo.SRI); setSelectedBaseName(null); }}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jobType === TrabajoTipo.SRI ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400'}`}
                    >
                        Talonarios SRI
                    </button>
                    <button 
                        onClick={() => { onSetJobType(TrabajoTipo.GENERAL); setSelectedBaseName(null); }}
                        className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jobType === TrabajoTipo.GENERAL ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-400'}`}
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
                        placeholder="Buscar servicio..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none rounded-2xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
                    />
                </div>
            </div>

            <div className="flex-grow overflow-hidden flex gap-6">
                {/* Columna 1: Lista de Servicios Base */}
                <div className="w-1/3 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {baseProducts.map(group => {
                        const isSelected = selectedBaseName === group.name;
                        return (
                            <button
                                key={group.name}
                                onClick={() => setSelectedBaseName(group.name)}
                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all group ${
                                    isSelected 
                                    ? 'bg-brand-blue border-brand-blue shadow-lg translate-x-1' 
                                    : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-200'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                        {group.esSRI ? <ShieldCheckIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-brand-red'}`} /> : <DocumentIcon className="w-4 h-4 text-slate-400" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`text-[11px] font-black uppercase truncate leading-none mb-1 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                            {group.name}
                                        </h3>
                                        <p className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                                            {group.categoria}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Columna 2: Cascada de Opciones */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-inner p-8 overflow-y-auto custom-scrollbar">
                    {selectedBaseName && currentGroup ? (
                        <div className="space-y-8 animate-fade-in">
                            {/* PASO 1: TAMAÑO */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <RulerIcon className="w-4 h-4" /> 1. Seleccionar Tamaño
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(currentGroup.sizes).map(size => (
                                        <button 
                                            key={size} 
                                            onClick={() => setSelectedSize(size)}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${selectedSize === size ? 'bg-brand-blue border-brand-blue text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* PASO 2: CANTIDAD / HOJAS */}
                            {selectedSize && (
                                <div className="space-y-3 animate-fade-in">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <LayersIcon className="w-4 h-4" /> 2. Cantidad de Hojas / Blocks
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {availableQuantities.map(q => (
                                            <button 
                                                key={q.label} 
                                                onClick={() => setSelectedQty(q.label)}
                                                className={`p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 text-center ${selectedQty === q.label ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-gray-700 text-slate-500 hover:border-brand-blue/30'}`}
                                            >
                                                {q.label}
                                                <span className="block text-[8px] opacity-60 mt-1">{formatCurrency(q.product.price)}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PASO 3: EXTRAS / ADICIONALES */}
                            {selectedQty && (
                                <div className="space-y-6 pt-6 border-t dark:border-gray-700 animate-fade-in">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <SparklesIcon className="w-4 h-4" /> 3. Adicionales del Trabajo
                                    </label>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setPerforar(!perforar)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${perforar ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${perforar ? 'bg-amber-400 text-white' : 'bg-slate-200'}`}><CheckCircleIcon className="w-4 h-4"/></div>
                                                <span className="text-[10px] font-black uppercase">Perforar</span>
                                            </div>
                                            <span className="text-[9px] font-bold">+{formatCurrency(config.costoPerforado)}</span>
                                        </button>

                                        <button 
                                            onClick={() => setCopiaExtra(!copiaExtra)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${copiaExtra ? 'bg-blue-50 border-brand-blue text-brand-blue shadow-sm' : 'bg-slate-50 border-transparent text-slate-400'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${copiaExtra ? 'bg-brand-blue text-white' : 'bg-slate-200'}`}><FileStackIcon className="w-4 h-4"/></div>
                                                <span className="text-[10px] font-black uppercase">Copia Extra</span>
                                            </div>
                                            <span className="text-[9px] font-bold">Varía</span>
                                        </button>
                                    </div>

                                    {/* BOTÓN FINAL DE ACCIÓN */}
                                    <button 
                                        onClick={handleFinalAdd}
                                        className="w-full py-5 bg-brand-red text-white font-black rounded-2xl shadow-2xl hover:bg-slate-950 transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-xs transform active:scale-95"
                                    >
                                        Añadir al Carrito <AddIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-[2rem] flex items-center justify-center mb-6">
                                <TableIcon className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Selección Inteligente</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs">Elige un servicio a la izquierda para configurar su tamaño y cantidad en un instante.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;
