
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    SearchIcon, BoxIcon, ShieldCheckIcon, 
    CheckCircleIcon, SparklesIcon, TagIcon
} from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Regimen } from '../../types';
import { useData, CATEGORY_EMOJIS } from '../../contexts/DataContext';

interface ServiceSelectorProps {
    onSelect: (servicio: any) => void;
    selectedId?: string;
    regimen?: string;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onSelect, selectedId, regimen }) => {
    const { productos } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('Todas');
    const [manualRegimen, setManualRegimen] = useState<string | null>(null);

    // Si cambia el régimen por prop, reseteamos el manual
    useEffect(() => {
        if (regimen) setManualRegimen(null);
    }, [regimen]);

    // Al cambiar de categoría, si no es SRI, reseteamos el régimen manual
    useEffect(() => {
        if (activeCategory !== 'SRI') setManualRegimen(null);
    }, [activeCategory]);

    const effectiveRegimen = regimen || manualRegimen;

    // Extraer categorías únicas
    const categories = useMemo(() => {
        const cats = new Set(productos.map(p => p.categoria || 'General'));
        return ['Todas', ...Array.from(cats)];
    }, [productos]);

    const filtered = useMemo(() => {
        return productos.filter(p => {
            // Filtrar solo productos activos
            if (p.esActivo === false) return false;

            const matchesSearch = (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (p.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'Todas' || (p.categoria || 'General') === activeCategory;
            
            // Inteligencia de Régimen Elite para categoría SRI:
            if (activeCategory === 'SRI' && effectiveRegimen) {
                const isPopular = effectiveRegimen === Regimen.NEGOCIO_POPULAR;
                const name = (p.nombre || '').toUpperCase();
                
                if (isPopular) {
                    // Para Negocio Popular: Solo lo que diga Rimpe o Negocio Popular
                    if (!(name.includes('RIMPE') || name.includes('NEGOCIO POPULAR'))) return false;
                } else {
                    // Para General/Emprendedor: 
                    // 1. NO mostrar nada que diga Negocio Popular o Rimpe
                    if (name.includes('NEGOCIO POPULAR') || name.includes('RIMPE')) return false;
                    // 2. NO mostrar Notas de Venta
                    if (name.includes('NOTA DE VENTA')) return false;
                }
            }

            return matchesSearch && matchesCategory;
        });
    }, [productos, searchTerm, activeCategory, effectiveRegimen]);

    // Conteo por categoría
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { 'Todas': productos.length };
        productos.forEach(p => {
            const cat = p.categoria || 'General';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        return counts;
    }, [productos]);

    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Scroll to top when category or search changes, and on mount
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeCategory, searchTerm]);

    // Force scroll top on mount to fix user reported issue
    useEffect(() => {
        const timer = setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = 0;
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="space-y-6">
            {/* Buscador */}
            <div className="relative group">
                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="SISTEMA DE BÚSQUEDA DE ACTIVOS INDUSTRIALES..."
                    className="w-full pl-13 pr-6 py-4 bg-black/50 border border-white/10 rounded-2xl text-sm font-bold text-white focus:ring-2 focus:ring-liquid-gold/30 outline-none transition-all placeholder:text-slate-500 uppercase tracking-tighter"
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-lg"
                    >×</button>
                )}
            </div>

            {/* Pestañas de Categorías - Estilo McDonald's */}
            <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
                {categories.map((cat) => {
                    return (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                                activeCategory === cat 
                                ? 'bg-liquid-gold text-black border-liquid-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]' 
                                : 'bg-white/[0.03] text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                            }`}
                        >
                            <span className="text-base">{CATEGORY_EMOJIS[cat] || '📦'}</span>
                            {cat}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                activeCategory === cat ? 'bg-black/20 text-black' : 'bg-white/5 text-slate-600'
                            }`}>{categoryCounts[cat] || 0}</span>
                        </button>
                    );
                })}
            </div>

            {/* Selector de Régimen (Modo Carpeta) si es SRI y no se conoce el régimen */}
            {activeCategory === 'SRI' && !effectiveRegimen && !searchTerm && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4"
                >
                    <button 
                        onClick={() => setManualRegimen(Regimen.NEGOCIO_POPULAR)}
                        className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-brand-red/50 hover:bg-brand-red/5 transition-all group text-left"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-brand-red/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ShieldCheckIcon className="w-6 h-6 text-brand-red" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">RIMPE Negocio Popular</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">Solo Notas de Venta y Documentos de Régimen Simplificado.</p>
                    </button>

                    <button 
                        onClick={() => setManualRegimen(Regimen.GENERAL)}
                        className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-liquid-gold/50 hover:bg-liquid-gold/5 transition-all group text-left"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-liquid-gold/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <SparklesIcon className="w-6 h-6 text-liquid-gold" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2">Régimen General / Emprendedor</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">Facturas, Notas de Crédito, Guías de Remisión y más.</p>
                    </button>
                </motion.div>
            )}

            {/* Cabecera de Carpeta Seleccionada */}
            {activeCategory === 'SRI' && effectiveRegimen && !searchTerm && (
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${effectiveRegimen === Regimen.NEGOCIO_POPULAR ? 'bg-brand-red' : 'bg-liquid-gold'}`} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            Bóveda: {effectiveRegimen === Regimen.NEGOCIO_POPULAR ? 'Negocio Popular' : 'General / Emprendedor'}
                        </span>
                    </div>
                    {!regimen && (
                        <button 
                            onClick={() => setManualRegimen(null)}
                            className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-tighter transition-colors"
                        >
                            ← Cambiar Régimen
                        </button>
                    )}
                </div>
            )}

            {/* Grilla de Productos - Estilo Menú Visual Compacto */}
            <div 
                ref={scrollRef}
                className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar p-1 transition-all ${
                    activeCategory === 'SRI' && !effectiveRegimen && !searchTerm ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
                }`}
            >
                <AnimatePresence mode="popLayout">
                    {filtered.map(p => {
                        const isSelected = selectedId === p.id;
                        return (
                            <motion.button
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                key={p.id}
                                onClick={() => onSelect(p)}
                                className={`relative rounded-2xl border transition-all text-left flex flex-col overflow-hidden group min-h-[160px] ${
                                    isSelected
                                    ? 'border-liquid-gold shadow-[0_0_25px_rgba(212,175,55,0.25)] ring-1 ring-liquid-gold/50' 
                                    : 'border-white/5 hover:border-white/20 bg-black/40'
                                }`}
                            >
                                {/* Imagen del producto - Compacta */}
                                <div className={`relative w-full h-20 overflow-hidden ${isSelected ? 'bg-liquid-gold/10' : 'bg-white/[0.02]'}`}>
                                    {p.imagenUrl ? (
                                        <img 
                                            src={p.imagenUrl} 
                                            alt={p.nombre}
                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-4xl opacity-20 group-hover:opacity-40 transition-opacity">
                                                {CATEGORY_EMOJIS[p.categoria] || '📦'}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Badge SRI */}
                                    {p.esSRI && (
                                        <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                                            <ShieldCheckIcon className="w-2.5 h-2.5" /> SRI
                                        </div>
                                    )}

                                    {/* Check de selección */}
                                    {isSelected && (
                                        <motion.div 
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="absolute top-2 right-2 bg-liquid-gold rounded-full p-1 shadow-lg"
                                        >
                                            <CheckCircleIcon className="w-4 h-4 text-black" />
                                        </motion.div>
                                    )}

                                    {/* Overlay gradiente */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                </div>

                                {/* Info del producto */}
                                <div className={`p-3 flex flex-col flex-1 ${isSelected ? 'bg-liquid-gold/[0.06]' : ''}`}>
                                    <h4 className={`text-[11px] font-black uppercase tracking-tight leading-tight mb-2 line-clamp-2 ${
                                        isSelected ? 'text-liquid-gold' : 'text-slate-200 group-hover:text-white'
                                    }`}>{p.nombre || 'SERVICIO SIN NOMBRE'}</h4>
                                    
                                    <div className="mt-auto flex items-end justify-between">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                            <TagIcon className="w-2.5 h-2.5 text-liquid-gold/40" />
                                            {p.categoria || 'General'}
                                        </span>
                                        <span className={`text-sm font-black tracking-tight ${
                                            isSelected ? 'text-liquid-gold' : 'text-white/70'
                                        }`}>
                                            ${(p.precio || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
                
                {/* Fallback para servicio personalizado */}
                {searchTerm && filtered.length === 0 && (
                    <motion.button 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => onSelect({ id: 'custom', nombre: searchTerm, categoria: 'Personalizado', precio: 0 })}
                        className="col-span-full p-8 rounded-2xl border border-dashed border-liquid-gold/40 bg-liquid-gold/5 text-center group flex flex-col items-center justify-center min-h-[150px] hover:border-liquid-gold/70 transition-all"
                    >
                        <SparklesIcon className="w-8 h-8 mb-3 text-liquid-gold/40 group-hover:text-liquid-gold transition-colors" />
                        <p className="text-xs font-black text-white uppercase tracking-widest leading-relaxed">
                            No se encontró "{searchTerm}"
                        </p>
                        <p className="text-[10px] text-liquid-gold/60 mt-1">Toca para crear como servicio personalizado</p>
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default ServiceSelector;
