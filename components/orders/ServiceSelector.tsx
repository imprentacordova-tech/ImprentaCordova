
import React, { useState, useMemo, useEffect } from 'react';
import { 
    SearchIcon, ShieldCheckIcon, 
    CheckCircleIcon, SparklesIcon,
    BoxIcon, LayersIcon
} from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Regimen } from '../../types';
import { useData, CATEGORY_EMOJIS } from '../../contexts/DataContext';

interface ServiceSelectorProps {
    onSelect: (servicio: any) => void;
    selectedId?: string;
    regimen?: string;
    forcedCategory?: string;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onSelect, selectedId, regimen, forcedCategory }) => {
    const { productos } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>(forcedCategory || 'Todas');
    const [manualRegimen, setManualRegimen] = useState<string | null>(null);

    useEffect(() => {
        if (regimen) setManualRegimen(null);
    }, [regimen]);

    useEffect(() => {
        if (activeCategory !== 'SRI') setManualRegimen(null);
    }, [activeCategory]);

    const effectiveRegimen = regimen || manualRegimen;

    const categories = useMemo(() => {
        const cats = new Set(productos.map(p => p.categoria || 'General'));
        const list = Array.from(cats);
        if (productos.some(p => p.esSRI) && !cats.has('SRI')) {
            list.push('SRI');
        }
        return ['Todas', ...list.sort()];
    }, [productos]);

    const filtered = useMemo(() => {
        return productos.filter(p => {
            if (p.esActivo === false) return false;
            const matchesSearch = (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'Todas' 
                ? true 
                : (activeCategory === 'SRI' ? p.esSRI : (p.categoria || 'General') === activeCategory);
            
            if (activeCategory === 'SRI' || p.esSRI) {
                if (activeCategory === 'SRI' && !p.esSRI) return false;
                if (effectiveRegimen) {
                    const name = (p.nombre || '').toUpperCase();
                    const isPopular = effectiveRegimen === Regimen.NEGOCIO_POPULAR;
                    const isEmprendedor = effectiveRegimen === Regimen.EMPRENDEDOR;
                    const cleanName = name.replace(/\(.*\)/, '').trim(); 
                    
                    const docsPopular = ['FACTURA', 'NOTA DE VENTA', 'LIQUIDACION DE COMPRA', 'NOTAS DE CREDITO', 'NOTAS DE DEBITO', 'GUIAS DE REMISION', 'BOLETOS', 'ENTRADAS', 'FACTURERO', 'COMPROBANTE', 'RETENCION'];
                    const docsGeneral = ['FACTURA', 'LIQUIDACION DE COMPRA', 'NOTAS DE CREDITO', 'NOTAS DE DEBITO', 'GUIAS DE REMISION', 'ACTA ENTREGA', 'FACTURERO', 'COMPROBANTE', 'RETENCION'];

                    const allowedDocs = isPopular ? docsPopular : docsGeneral;
                    if (!allowedDocs.some(doc => cleanName.includes(doc) || name.includes(doc))) return false;

                    if (isPopular) {
                        if (name.includes('(GENERAL)') || name.includes('(EMPRENDEDOR)')) return false;
                    } else {
                        if (name.includes('(RIMPE NEGOCIO POPULAR)') || name.includes('NOTA DE VENTA')) return false;
                    }
                }
            }
            return matchesSearch && matchesCategory;
        });
    }, [productos, searchTerm, activeCategory, effectiveRegimen]);

    const finalFiltered = useMemo(() => {
        if (activeCategory === 'SRI' && filtered.length === 0 && !searchTerm) {
            return productos.filter(p => p.esSRI && p.esActivo !== false);
        }
        return filtered;
    }, [filtered, activeCategory, productos, searchTerm]);

    const scrollRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeCategory, searchTerm]);

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* --- CABECERA TÁCTICA --- */}
            <div className="glass-panel-obsidian p-8 md:p-12 rounded-[3.5rem] border-white/5 relative overflow-hidden group tactical-border">
                <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/5 via-transparent to-transparent opacity-30" />
                
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10">
                    <div className="flex-1 max-w-2xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-liquid-gold shadow-gold-glow animate-pulse" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] italic">CATÁLOGO_INDUSTRIAL_ALFA</p>
                        </div>
                        <div className="relative group">
                            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-700 group-focus-within:text-liquid-gold group-focus-within:scale-110 transition-all" />
                            <input 
                                type="text" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                placeholder="IDENTIFICAR VECTOR DE PRODUCCIÓN..." 
                                className="w-full pl-16 pr-8 py-7 bg-black/60 border border-white/10 rounded-3xl text-xl font-black text-white focus:border-liquid-gold/40 transition-all placeholder:text-slate-900 uppercase tracking-widest italic" 
                            />
                        </div>
                    </div>

                    {!forcedCategory && (
                        <div className="flex-shrink-0 space-y-4">
                            <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest ml-4 italic">Segmentación_Filtro</p>
                            <div className="flex gap-2 p-1.5 bg-black/40 rounded-[2rem] border border-white/5 overflow-x-auto no-scrollbar max-w-full">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`relative px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap z-10 ${
                                            activeCategory === cat ? 'text-black' : 'text-slate-500 hover:text-white'
                                        }`}
                                    >
                                        {activeCategory === cat && (
                                            <motion.div layoutId="activeCat" className="absolute inset-0 bg-liquid-gold rounded-2xl -z-10 shadow-gold-glow-sm" />
                                        )}
                                        <span className="flex items-center gap-3">
                                            <span className="text-lg">{(CATEGORY_EMOJIS as any)[cat] || '📦'}</span> {cat}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RÉGIMEN SELECTOR */}
                {(activeCategory === 'SRI' || forcedCategory === 'SRI') && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 pt-10 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <p className="text-[10px] text-liquid-gold font-black uppercase tracking-widest italic flex items-center gap-3">
                                <ShieldCheckIcon className="w-4 h-4"/> Sincronización de Régimen Fiscal
                            </p>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                                {effectiveRegimen ? `VECTOR ACTIVO: ${effectiveRegimen.toUpperCase()}` : 'SELECCIONE PROTOCOLO PARA VALIDACIÓN DINÁMICA'}
                            </p>
                        </div>
                        <div className="flex gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                            {[Regimen.GENERAL, Regimen.EMPRENDEDOR, Regimen.NEGOCIO_POPULAR].map((reg) => (
                                <button
                                    key={reg}
                                    onClick={() => setManualRegimen(reg)}
                                    className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        effectiveRegimen === reg ? 'bg-liquid-gold text-black shadow-gold-glow-sm italic' : 'text-slate-600 hover:text-slate-400'
                                    }`}
                                >
                                    {reg}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* --- GRID DE RESULTADOS --- */}
            <div ref={scrollRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 md:gap-10">
                <AnimatePresence mode="popLayout">
                    {finalFiltered.map((p, idx) => (
                        <motion.button
                            layout key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
                            whileHover={{ y: -10, transition: { duration: 0.4 } }}
                            onClick={() => onSelect(p)}
                            className={`group relative flex flex-col h-[320px] md:h-[380px] rounded-[3rem] overflow-hidden border-2 transition-all duration-700 bg-black/60 backdrop-blur-3xl ${
                                selectedId === p.id ? 'border-liquid-gold shadow-gold-glow-strong' : 'border-white/5 hover:border-white/20'
                            }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            
                            {/* Visual Asset Container */}
                            <div className="relative h-1/2 overflow-hidden bg-slate-950">
                                {p.imagenUrl ? (
                                    <img src={p.imagenUrl} alt={p.nombre} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                                        <LayersIcon className="w-24 h-24 text-white" />
                                    </div>
                                )}
                                
                                {p.esSRI && (
                                    <div className="absolute top-6 left-6 bg-liquid-gold text-black text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-gold-glow-sm z-20 italic">
                                        <ShieldCheckIcon className="w-3.5 h-3.5" /> SRI_ACTIVE
                                    </div>
                                )}

                                <div className="absolute top-6 right-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 z-20 group-hover:border-liquid-gold/50 transition-all">
                                    <span className="text-base font-black text-white italic tracking-tighter tabular-nums">${(p.precio || 0).toFixed(2)}</span>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            </div>

                            {/* Data Panel */}
                            <div className="p-8 md:p-10 flex flex-col flex-1 relative z-10 justify-between">
                                <div className="space-y-3">
                                    <h4 className={`text-lg md:text-xl font-black uppercase tracking-tighter leading-none italic transition-colors ${
                                        selectedId === p.id ? 'text-liquid-gold' : 'text-slate-100 group-hover:text-white'
                                    }`}>{p.nombre}</h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                                            {(CATEGORY_EMOJIS as any)[p.categoria] || '📦'}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{p.categoria || 'GENERAL'}</span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center mt-6">
                                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic group-hover:text-liquid-gold/40 transition-colors">ESTADO: OPERACIONAL</span>
                                    {selectedId === p.id ? (
                                        <div className="w-8 h-8 rounded-full bg-liquid-gold flex items-center justify-center shadow-gold-glow animate-pulse">
                                            <CheckCircleIcon className="w-5 h-5 text-black" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-800 group-hover:border-liquid-gold/40 group-hover:text-liquid-gold transition-all">
                                            <SparklesIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>
                
                {/* FALLBACK TÁCTICO */}
                {searchTerm && finalFiltered.length === 0 && (
                    <motion.button 
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        onClick={() => onSelect({ id: 'custom', nombre: searchTerm, categoria: 'Manual', precio: 0 })}
                        className="col-span-full h-[300px] rounded-[3.5rem] border-2 border-dashed border-liquid-gold/20 bg-liquid-gold/5 flex flex-col items-center justify-center gap-6 group hover:border-liquid-gold/50 transition-all relative overflow-hidden"
                    >
                        <SparklesIcon className="w-16 h-16 text-liquid-gold/20 group-hover:text-liquid-gold group-hover:rotate-12 transition-all duration-700" />
                        <div className="text-center space-y-2">
                            <p className="text-2xl font-black text-white uppercase italic tracking-tighter">Vector Desconocido</p>
                            <p className="text-[10px] text-liquid-gold/60 font-black uppercase tracking-[0.4em] italic">INICIAR PROCESO DE DISEÑO PERSONALIZADO PARA "{searchTerm}"</p>
                        </div>
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default ServiceSelector;
