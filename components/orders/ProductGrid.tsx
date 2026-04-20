
import React, { useState, useMemo, useEffect } from 'react';
import { Producto, TrabajoTipo, Regimen } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';
import { 
    SearchIcon, ShieldCheckIcon, AddIcon, 
    RulerIcon, SparklesIcon, LayersIcon, 
    BoxIcon, MonitorIcon, ExclamationTriangleIcon, CordovaLogo
} from '../Icons';

interface ProductGridProps {
    onProductAction: (action: 'add', product: Producto & { surcharge?: number, surchargeLabel?: string }) => void;
    productsInCart: Map<string, any>;
    jobType: TrabajoTipo;
    clientRegimen?: Regimen;
    onSetJobType: (type: TrabajoTipo) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ onProductAction, productsInCart, jobType, clientRegimen, onSetJobType }) => {
    const { productos, config } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBaseName, setSelectedBaseName] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedQty, setSelectedQty] = useState<string | null>(null);
    
    const [perforar, setPerforar] = useState(false);
    // config is now provided by useData()

    useEffect(() => {
        setSelectedSize(null);
        setSelectedQty(null);
        setPerforar(false);
    }, [selectedBaseName, jobType]);

    // REGLA DE ORO SRI: Filtrado por Régimen
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
                    size = variantPart; // Use the whole part if no " - "
                }
            }

            // LÓGICA DE EXCLUSIÓN SRI ESTRICTA
            const isNotaVenta = p.nombre.toUpperCase().includes('NOTA DE VENTA') || p.nombre.toUpperCase().includes('NOTAS DE VENTA');
            const isFactura = p.nombre.toUpperCase().includes('FACTURA');

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

        // FILTRADO ADICIONAL NIVEL VARIANTE PARA GENERAL/EMPRENDEDOR (SRI)
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
    }, [selectedProductObject, perforar]);

    return (
        <div className="flex flex-col h-full animate-fade-in gap-8">
            <div className="flex flex-col xl:flex-row gap-6 items-center justify-between bg-brand-dark/40 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/5 shadow-luxury">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                        <button onClick={() => onSetJobType(TrabajoTipo.SRI)} className={`px-8 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jobType === TrabajoTipo.SRI ? 'bg-brand-red text-white shadow-red-glow' : 'text-slate-500 hover:text-white'}`}>Talonarios SRI</button>
                        <button onClick={() => onSetJobType(TrabajoTipo.GENERAL)} className={`px-8 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jobType === TrabajoTipo.GENERAL ? 'bg-liquid-gold text-brand-dark shadow-gold-glow' : 'text-slate-500 hover:text-white'}`}>Papelería General</button>
                    </div>
                </div>
                <div className="relative flex-grow max-w-sm">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filtrar catálogo de servicios..." className="w-full pl-12 pr-6 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-white placeholder-slate-600 focus:ring-1 focus:ring-liquid-gold/30 outline-none transition-all" />
                </div>
            </div>

            <div className="flex-grow overflow-hidden flex flex-col xl:flex-row gap-8">
                <div className="w-full xl:w-[320px] overflow-y-auto space-y-2.5 pr-3 custom-scrollbar">
                    {/* BOTÓN ITEM LIBRE */}
                    <button 
                        onClick={() => onProductAction('add', { id: `custom-${Date.now()}`, nombre: 'Ítem Personalizado', categoria: 'Varios', precio: 1.00, descripcion: 'Especifique en notas', esSRI: jobType === TrabajoTipo.SRI })}
                        className="w-full text-left p-5 rounded-[1.8rem] border transition-all relative group overflow-hidden bg-brand-dark/40 border-dashed border-liquid-gold/50 hover:border-liquid-gold shadow-[0_0_15px_-3px_rgba(212,175,55,0.1)]"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="p-2.5 rounded-xl transition-colors bg-liquid-gold/10 text-liquid-gold group-hover:bg-liquid-gold group-hover:text-brand-dark">
                                <SparklesIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-[11px] font-black uppercase truncate leading-tight mb-1.5 text-liquid-gold group-hover:text-white">Nuevo Ítem Libre</h3>
                                <p className="text-[8px] font-bold uppercase tracking-widest text-[#a69c8b]/70">Variable · Precio Dinámico</p>
                            </div>
                        </div>
                    </button>

                    {baseProducts.map(group => (
                        <button 
                            key={group.name} 
                            onClick={() => setSelectedBaseName(group.name)} 
                            className={`w-full text-left p-5 rounded-[1.8rem] border transition-all relative group overflow-hidden ${selectedBaseName === group.name ? 'bg-brand-dark/80 border-liquid-gold shadow-gold-glow-soft translate-x-2' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                        >
                            {selectedBaseName === group.name && <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/10 to-transparent pointer-events-none"></div>}
                            <div className="flex items-center gap-4 relative z-10">
                                <div className={`p-2.5 rounded-xl transition-colors ${selectedBaseName === group.name ? 'bg-liquid-gold text-brand-dark' : 'bg-white/5 text-slate-500 group-hover:text-liquid-gold'}`}>
                                    {group.esSRI ? <ShieldCheckIcon className="w-5 h-5" /> : <BoxIcon className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className={`text-[11px] font-black uppercase truncate leading-tight mb-1.5 ${selectedBaseName === group.name ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{group.name}</h3>
                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${selectedBaseName === group.name ? 'text-liquid-gold/60' : 'text-slate-600'}`}>{group.categoria}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                    {baseProducts.length === 0 && (
                        <div className="p-12 text-center bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed">
                            <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-4 text-slate-700"/>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No hay documentos para esta selección</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 bg-brand-dark/40 backdrop-blur-2xl rounded-[3.5rem] border border-white/5 shadow-inner p-10 overflow-y-auto custom-scrollbar relative">
                    {selectedBaseName ? (
                        <div className="space-y-10 animate-fade-in relative z-10">
                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse"></div> 1. FORMATO / TAMAÑO
                                </label>
                                <div className="flex flex-wrap gap-3">
                                    {Array.from(currentGroup?.sizes || []).map(size => (
                                        <button 
                                            key={size} 
                                            onClick={() => { setSelectedSize(size); setSelectedQty(null); }} 
                                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${selectedSize === size ? 'bg-white text-brand-dark border-white shadow-luxury' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:border-white/20'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedSize && (
                                <div className="space-y-6 animate-slide-in-up">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"></div> 2. CONFIGURACIÓN DE VARIACIÓN
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {availableQuantities.map(q => (
                                            <button 
                                                key={q.label} 
                                                onClick={() => setSelectedQty(q.label)} 
                                                className={`p-6 rounded-3xl text-[10px] font-black uppercase transition-all border text-center flex flex-col items-center gap-2 ${selectedQty === q.label ? 'bg-liquid-gold border-liquid-gold text-brand-dark shadow-gold-glow scale-[1.02]' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:bg-white/10'}`}
                                            >
                                                <span className="opacity-40 text-[7px] tracking-widest leading-none">SELECCIONAR</span>
                                                {q.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedQty && (
                                <div className="space-y-10 pt-10 border-t border-white/5 animate-fade-in">
                                    <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-brand-dark/60 rounded-[3rem] border border-white/10 shadow-luxury gap-8 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/5 via-transparent to-transparent pointer-events-none"></div>
                                        <div className="relative z-10 w-full md:w-auto text-center md:text-left">
                                            <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.3em] block mb-3 opacity-60">Inversión Base Sugerida</span>
                                            <div className="flex items-baseline justify-center md:justify-start gap-2">
                                                <span className="text-5xl font-black text-white tracking-tighter">{formatCurrency(currentPrice)}</span>
                                                <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">+ IVA</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full md:w-auto">
                                            <button 
                                                onClick={() => setPerforar(!perforar)} 
                                                className={`w-full sm:w-auto px-6 py-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${perforar ? 'bg-brand-red border-brand-red text-white shadow-red-glow' : 'bg-white/5 text-slate-500 border-white/10 hover:text-white'}`}
                                            >
                                                <SparklesIcon className="w-4 h-4"/> 
                                                <span className="text-[10px] font-black uppercase tracking-wider">Perforar</span>
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
                                                className="w-full sm:w-auto px-12 py-5 bg-white text-brand-dark font-black rounded-2xl shadow-luxury hover:bg-liquid-gold transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"
                                            >
                                                Añadir <AddIcon className="w-6 h-6"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-6">
                            <CordovaLogo className="w-32 h-32 text-white animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Imprenta Cordova <span className="text-liquid-gold">Modern</span></p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductGrid;
