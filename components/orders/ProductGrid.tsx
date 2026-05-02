
import React, { useState, useMemo, useEffect } from 'react';
import { Producto, TrabajoTipo, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';
import { 
    SearchIcon, ShieldCheckIcon, AddIcon, 
    SparklesIcon, BoxIcon, ExclamationTriangleIcon, 
    CordovaLogo
} from '../Icons';

interface ProductGridProps {
    onProductAction: (action: 'add', product: Producto & { surcharge?: number, surchargeLabel?: string }) => void;
    productsInCart: Map<string, any>;
    jobType: TrabajoTipo;
    clientRegimen?: Regimen;
    onSetJobType: (type: TrabajoTipo) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ onProductAction, jobType, clientRegimen, onSetJobType }) => {
    const { productos, config } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBaseName, setSelectedBaseName] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedQty, setSelectedQty] = useState<string | null>(null);
    
    const [perforar, setPerforar] = useState(false);

    useEffect(() => {
        setSelectedSize(null);
        setSelectedQty(null);
        setPerforar(false);
    }, [selectedBaseName, jobType]);

    const baseProducts = useMemo(() => {
        const map = new Map<string, {
            name: string;
            categoria: string;
            esSRI: boolean;
            sizes: Set<string>;
            items: Producto[];
        }>();

        productos.forEach(p => {
            let baseName = p.nombre;
            let size = 'Único';
            
            if (p.nombre.includes(' (')) {
                const parts = p.nombre.split(' (');
                baseName = parts[0];
                const variantPart = parts[1].replace(')', '');
                
                const sizeMatch = variantPart.match(/^(.*?) -/);
                if (sizeMatch) {
                    size = sizeMatch[1];
                } else {
                    size = variantPart;
                }
            }

            const isNotaVenta = p.nombre.toUpperCase().includes('NOTA DE VENTA') || p.nombre.toUpperCase().includes('NOTAS DE VENTA');

            if (jobType === TrabajoTipo.SRI && clientRegimen) {
                if (clientRegimen === Regimen.NEGOCIO_POPULAR && !isNotaVenta) return;
                if (clientRegimen !== Regimen.NEGOCIO_POPULAR && isNotaVenta) return;
            }

            if (!map.has(baseName)) {
                map.set(baseName, {
                    name: baseName,
                    categoria: p.categoria || 'General',
                    esSRI: !!p.esSRI,
                    sizes: new Set(),
                    items: []
                });
            }
            const group = map.get(baseName)!;
            group.sizes.add(size);
            group.items.push(p);
        });

        return Array.from(map.values()).filter(g => {
            const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 g.categoria.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = (jobType === TrabajoTipo.SRI ? g.esSRI : !g.esSRI);
            return matchesSearch && matchesType;
        });
    }, [productos, jobType, searchTerm, clientRegimen]);

    const currentGroup = useMemo(() => 
        baseProducts.find(g => g.name === selectedBaseName), 
    [baseProducts, selectedBaseName]);

    const availableQuantities = useMemo(() => {
        if (!currentGroup || !selectedSize) return [];
        
        let items = currentGroup.items.filter(p => {
            if (selectedSize === 'Único') return !p.nombre.includes(' (');
            return p.nombre.includes(`(${selectedSize}`);
        });

        if (jobType === TrabajoTipo.SRI && clientRegimen !== Regimen.NEGOCIO_POPULAR && currentGroup.name.toUpperCase().includes('FACTURA')) {
             const contingencyItems = items.filter(p => p.nombre.includes('25H') || p.nombre.includes('50H'));
             if (contingencyItems.length > 0) items = contingencyItems;
        }

        return items.map(p => {
            let label = 'Estándar';
            if (p.nombre.includes(' - ')) {
                const qMatch = p.nombre.match(/- (.*?)\)$/);
                label = qMatch ? qMatch[1] : 'Fijo';
            } else if (p.nombre.includes(' (')) {
                const parts = p.nombre.split(' (');
                label = parts[1].replace(')', '');
            }
            
            return { label, product: p };
        });
    }, [currentGroup, selectedSize, jobType, clientRegimen]);

    const selectedProductObject = useMemo(() => {
        if (!selectedQty) return null;
        return availableQuantities.find(q => q.label === selectedQty)?.product || null;
    }, [availableQuantities, selectedQty]);

    const currentPrice = useMemo(() => {
        if (!selectedProductObject) return 0;
        return selectedProductObject.precio + (perforar ? (config?.costoPerforado || 0.5) : 0);
    }, [selectedProductObject, perforar, config]);

    return (
        <div className="flex flex-col h-full animate-fade-in gap-6 md:gap-10">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                <div className="flex items-center w-full lg:w-auto">
                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border-2 border-slate-100 w-full lg:w-auto">
                        <button onClick={() => onSetJobType(TrabajoTipo.SRI)} className={`flex-1 lg:flex-none px-6 md:px-10 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jobType === TrabajoTipo.SRI ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}>Talonarios SRI</button>
                        <button onClick={() => onSetJobType(TrabajoTipo.GENERAL)} className={`flex-1 lg:flex-none px-6 md:px-10 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jobType === TrabajoTipo.GENERAL ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-slate-900'}`}>Papelería General</button>
                    </div>
                </div>
                <div className="relative w-full lg:max-w-md group">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-brand-blue transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="IDENTIFICAR VECTOR PRODUCTIVO..." 
                        className="w-full pl-16 pr-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-900 placeholder:text-slate-300 focus:border-brand-blue/30 outline-none transition-all uppercase tracking-widest" 
                    />
                </div>
            </div>

            <div className="flex-grow overflow-hidden flex flex-col lg:flex-row gap-6 md:gap-10">
                <div className="w-full lg:w-[320px] xl:w-[380px] lg:overflow-y-auto space-y-3 pr-0 lg:pr-4 custom-scrollbar flex flex-col max-h-[400px] lg:max-h-none">
                    <button 
                        onClick={() => onProductAction('add', { id: `custom-${Date.now()}`, nombre: 'Ítem Personalizado', categoria: 'Varios', precio: 1.00, descripcion: 'Especifique en notas', esSRI: jobType === TrabajoTipo.SRI })}
                        className="w-full text-left p-6 rounded-[2rem] border-2 border-dashed border-brand-blue/30 bg-brand-blue/[0.02] transition-all relative group overflow-hidden hover:border-brand-blue/60 shadow-sm"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="p-3 rounded-xl transition-all bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue group-hover:text-white group-hover:scale-110">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-xs font-black uppercase truncate leading-tight mb-1 text-slate-900 group-hover:text-brand-blue transition-colors">Nuevo Ítem Manual</h3>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">VECTOR_DINÁMICO · VARIABLE</p>
                            </div>
                        </div>
                    </button>

                    <div className="space-y-3 overflow-y-auto lg:overflow-visible flex-grow lg:flex-none">
                        {baseProducts.map(group => (
                            <button 
                                key={group.name} 
                                onClick={() => setSelectedBaseName(group.name)} 
                                className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all relative group overflow-hidden ${selectedBaseName === group.name ? 'bg-white border-brand-blue shadow-md translate-x-2' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`p-3 rounded-xl transition-all ${selectedBaseName === group.name ? 'bg-brand-blue text-white shadow-sm' : 'bg-white text-slate-300 group-hover:text-brand-blue'}`}>
                                        {group.esSRI ? <ShieldCheckIcon className="w-6 h-6" /> : <BoxIcon className="w-6 h-6" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`text-xs font-black uppercase truncate leading-tight mb-1 ${selectedBaseName === group.name ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900'}`}>{group.name}</h3>
                                        <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${selectedBaseName === group.name ? 'text-brand-blue/60' : 'text-slate-400'}`}>{group.categoria}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {baseProducts.length === 0 && (
                        <div className="p-12 text-center bg-slate-50 rounded-[3rem] border-2 border-slate-100 border-dashed">
                            <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-4 text-slate-200"/>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">SIN_RESULTADOS</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-sm p-8 md:p-12 overflow-y-auto custom-scrollbar relative">
                    {selectedBaseName ? (
                        <div className="space-y-10 md:space-y-14 animate-fade-in relative z-10">
                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full bg-brand-blue shadow-blue-glow animate-pulse"></div> 01_FORMATO_Y_DIMENSIÓN
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {Array.from(currentGroup?.sizes || []).map(size => (
                                        <button 
                                            key={size} 
                                            onClick={() => { setSelectedSize(size); setSelectedQty(null); }} 
                                            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${selectedSize === size ? 'bg-brand-blue text-white border-brand-blue shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-200'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedSize && (
                                <div className="space-y-6 animate-slide-in-up">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-brand-blue shadow-blue-glow animate-pulse"></div> 02_CONFIGURACIÓN_VOLUMEN
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {availableQuantities.map(q => (
                                            <button 
                                                key={q.label} 
                                                onClick={() => setSelectedQty(q.label)} 
                                                className={`p-6 rounded-3xl text-[10px] font-black uppercase transition-all border-2 text-center flex flex-col items-center gap-3 ${selectedQty === q.label ? 'bg-slate-50 border-brand-blue text-brand-blue shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                <span className="opacity-40 text-[7px] tracking-[0.3em] leading-none">SELECCIONAR</span>
                                                {q.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedQty && (
                                <div className="space-y-10 pt-10 border-t-2 border-slate-100 animate-fade-in">
                                    <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-10 bg-slate-50 rounded-[3rem] border-2 border-slate-100 gap-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/[0.03] rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                        <div className="relative z-10 w-full md:w-auto text-center md:text-left">
                                            <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em] block mb-3">COTIZACIÓN_ESTIMADA</span>
                                            <div className="flex items-baseline justify-center md:justify-start gap-3">
                                                <span className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter tabular-nums">{formatCurrency(currentPrice)}</span>
                                                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">+ IVA</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
                                            <button 
                                                onClick={() => setPerforar(!perforar)} 
                                                className={`w-full sm:w-auto px-8 py-4 rounded-2xl border-2 flex items-center justify-center gap-4 transition-all font-black text-[10px] uppercase tracking-widest ${perforar ? 'bg-brand-blue text-white border-brand-blue shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-900 hover:border-slate-200'}`}
                                            >
                                                <SparklesIcon className="w-5 h-5"/> 
                                                PERFORADO
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (!selectedProductObject) return;
                                                    onProductAction('add', { 
                                                        ...selectedProductObject, 
                                                        surcharge: perforar ? (config?.costoPerforado || 0.5) : 0, 
                                                        surchargeLabel: perforar ? "+ Perforado" : "" 
                                                    });
                                                    setSelectedQty(null);
                                                }} 
                                                className="w-full sm:w-auto px-12 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-brand-blue transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"
                                            >
                                                AÑADIR <AddIcon className="w-6 h-6"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                            <div className="relative">
                                <div className="absolute inset-0 bg-brand-blue/20 rounded-full blur-3xl animate-pulse scale-150"></div>
                                <CordovaLogo className="w-32 h-32 md:w-48 md:h-48 text-slate-100 relative z-10" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300">PROTOCOLO_PRESIÓN_ALFA</p>
                                <p className="text-xl font-black text-slate-200 uppercase tracking-tighter">Seleccione un Vector de Producción</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;
