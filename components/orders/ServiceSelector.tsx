
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
    forcedCategory?: string;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onSelect, selectedId, regimen, forcedCategory }) => {
    const { productos } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>(forcedCategory || 'Todas');
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
            if (activeCategory === 'SRI') {
                // Si estamos en categoría SRI, solo mostrar productos marcados como esSRI
                if (!p.esSRI) return false;

                if (effectiveRegimen) {
                    const name = (p.nombre || '').toUpperCase();
                    const isPopular = effectiveRegimen === Regimen.NEGOCIO_POPULAR;

                    // LISTA ESTRICTA RIMPE NEGOCIO POPULAR (Sincronizada con base legal SRI)
                    const docsPopular = [
                        'FACTURA', 
                        'NOTA DE VENTA', 
                        'LIQUIDACION DE COMPRA DE BIENES MUEBLES USADOS',
                        'NOTAS DE CREDITO', 
                        'NOTAS DE DEBITO', 
                        'GUIAS DE REMISION', 
                        'BOLETOS O ENTRADAS A ESPECTACULOS PUBLICOS', 
                        'LIQUIDACION DE COMPRA DE VEHICULOS USADOS',
                        'ACTA DE ENTREGA - RECEPCION DE VEHICULOS USADOS', 
                        'LIQUIDACION DE COMPRA DE BIENES O PRESTACION DE SERVICIOS',
                        'FACTURERO', 'COMPROBANTE'
                    ];

                    // LISTA ESTRICTA REGIMEN GENERAL / EMPRENDEDOR (Sincronizada con base legal SRI)
                    const docsGeneral = [
                        'FACTURA', 
                        'LIQUIDACION DE COMPRA DE BIENES O PRESTACION DE SERVICIOS',
                        'NOTAS DE DEBITO', 
                        'GUIAS DE REMISION', 
                        'ACTA ENTREGA - RECEPCIÓN DE BOTELLAS PLASTICAS NO RETORNABLES DE PET',
                        'LIQUIDACION DE COMPRA DE BIENES MUEBLES USADOS', 
                        'LIQUIDACION DE COMPRA DE VEHICULOS USADOS',
                        'ACTA DE ENTREGA - RECEPCION DE VEHICULOS USADOS', 
                        'FACTURERO', 'COMPROBANTE'
                    ];

                    const allowedDocs = isPopular ? docsPopular : docsGeneral;
                    
                    // Verificamos si el nombre del producto contiene alguna de las frases permitidas
                    const isBaseTypeAllowed = allowedDocs.some(doc => name.includes(doc));
                    if (!isBaseTypeAllowed) return false;

                    // Filtro secundario: Asegurar que el tag del nombre coincida con el régimen
                    if (isPopular) {
                        if (name.includes('(GENERAL)') || name.includes('(REGIMEN GENERAL')) return false;
                    } else {
                        if (name.includes('(RIMPE)') || name.includes('(RIMPE NEGOCIO POPULAR')) return false;
                        if (name.includes('NOTA DE VENTA')) return false; // Nota de venta prohibida en General
                    }
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
        <div className="space-y-10 animate-fade-in">
            {/* --- CABECERA DE FILTROS --- */}
            <div className="space-y-4 md:space-y-8 bg-white/[0.02] p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] scale-100 md:scale-150 rotate-12 transition-transform group-hover:scale-[1.7] hidden md:block"><SearchIcon className="w-64 h-64 text-liquid-gold" /></div>
                
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-10 relative z-10">
                    <div className="space-y-3 md:space-y-4 flex-grow max-w-2xl">
                        <p className="text-[8px] md:text-[10px] font-black text-liquid-gold uppercase tracking-[0.3em] md:tracking-[0.6em] italic animate-pulse">Inteligencia de Productos</p>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-liquid-gold/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                            <SearchIcon className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-slate-500 group-focus-within:text-liquid-gold group-focus-within:scale-110 transition-all" />
                            <input 
                                type="text" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                placeholder="BUSCAR PROTOCOLO..." 
                                className="w-full pl-12 md:pl-16 pr-6 md:pr-8 py-4.5 md:py-7 bg-black/60 border border-white/5 rounded-xl md:rounded-3xl text-sm md:text-xl font-black text-white focus:bg-black/80 focus:ring-1 focus:ring-liquid-gold/40 transition-all placeholder:text-slate-800 uppercase tracking-widest relative z-10" 
                            />
                        </div>
                    </div>

                    {!forcedCategory && (
                    <div className="space-y-3 md:space-y-4 flex-shrink-0">
                        <label className="text-[8px] md:text-[10px] text-slate-700 font-black uppercase tracking-widest ml-2 md:ml-4 italic">Segmentación</label>
                        <div className="relative flex gap-1.5 p-1 bg-black/40 rounded-xl md:rounded-[1.5rem] border border-white/5 overflow-x-auto no-scrollbar max-w-full">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`relative px-4 md:px-6 py-3 md:py-3.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap z-10 ${
                                        activeCategory === cat 
                                            ? 'text-black' 
                                            : 'text-slate-500 hover:text-white'
                                    }`}
                                >
                                    {activeCategory === cat && (
                                        <motion.div 
                                            layoutId="activeCat"
                                            className="absolute inset-0 bg-liquid-gold rounded-lg md:rounded-xl -z-10 shadow-gold-glow-sm"
                                        />
                                    )}
                                    <span className="flex items-center gap-2 md:gap-2">
                                        <span className="text-xs md:text-base">{(CATEGORY_EMOJIS as any)[cat] || '📦'}</span> {cat}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    )}
                </div>

                {/* --- SELECTOR DE RÉGIMEN PARA SRI --- */}
                {(activeCategory === 'SRI' || forcedCategory === 'SRI') && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="pt-5 md:pt-6 border-t border-white/5 space-y-4 md:space-y-6"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 md:gap-6">
                            <div className="space-y-1 md:space-y-2">
                                <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest italic flex items-center gap-2">
                                    <ShieldCheckIcon className="w-3 h-3 md:w-3 md:h-3 text-liquid-gold"/> Protocolo de Régimen
                                </p>
                                <p className="text-[7px] md:text-[9px] text-slate-700 font-bold uppercase tracking-widest max-w-md">
                                    {effectiveRegimen 
                                        ? `Aplicando filtros para ${effectiveRegimen.toUpperCase()}`
                                        : 'Seleccione un régimen para optimizar el catálogo.'}
                                </p>
                            </div>

                            <div className="flex gap-2 md:gap-3 bg-black/40 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                                {[Regimen.GENERAL, Regimen.EMPRENDEDOR, Regimen.NEGOCIO_POPULAR].map((reg) => (
                                    <button
                                        key={reg}
                                        onClick={() => setManualRegimen(reg)}
                                        className={`px-4 md:px-5 py-3 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                            effectiveRegimen === reg 
                                                ? 'bg-liquid-gold text-black shadow-gold-glow-sm' 
                                                : 'text-slate-600 hover:text-slate-400'
                                        }`}
                                    >
                                        {reg}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* --- GRID DE PRODUCTOS --- */}
            <div 
                ref={scrollRef}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 max-h-[1000px] overflow-y-auto pr-2 md:pr-4 custom-scrollbar pb-20"
            >
                <AnimatePresence mode="popLayout">
                    {filtered.map((p) => {
                        const isSelected = selectedId === p.id;
                        return (
                            <motion.button
                                layout
                                key={p.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -8, transition: { duration: 0.4 } }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelect(p)}
                                className={`group relative flex flex-col h-[240px] md:h-[320px] rounded-2xl md:rounded-[2rem] overflow-hidden border transition-all duration-700 bg-black/40 backdrop-blur-xl ${
                                    isSelected ? 'border-liquid-gold shadow-gold-glow-strong' : 'border-white/5 hover:border-white/20'
                                }`}
                            >
                                {/* Glass Reflection Effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.03] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                {/* Miniatura / Icono */}
                                <div className="relative h-44 overflow-hidden bg-slate-950">
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
                                        <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-liquid-gold text-black text-[7px] md:text-[9px] font-black px-2 md:px-3 py-1 rounded-lg md:rounded-xl uppercase tracking-[0.15em] md:tracking-[0.2em] flex items-center gap-1.5 md:gap-2 shadow-gold-glow-sm z-20">
                                            <ShieldCheckIcon className="w-2.5 h-2.5 md:w-3 md:h-3" /> SRI
                                        </div>
                                    )}

                                    {/* Precio Flotante */}
                                    <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-black/60 backdrop-blur-md px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border border-white/10 z-20 transition-all group-hover:scale-110 group-hover:border-liquid-gold/40">
                                        <span className="text-[10px] md:text-xs font-black text-white italic tracking-tighter">${(p.precio || 0).toFixed(2)}</span>
                                    </div>

                                    {/* Check de selección */}
                                    {isSelected && (
                                        <motion.div 
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="absolute bottom-4 right-4 bg-liquid-gold rounded-full p-1.5 shadow-gold-glow z-30"
                                        >
                                            <CheckCircleIcon className="w-5 h-5 text-black" />
                                        </motion.div>
                                    )}

                                    {/* Overlay gradiente */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                                </div>

                                {/* Info del producto */}
                                <div className={`p-4 md:p-6 flex flex-col flex-1 relative z-10 ${isSelected ? 'bg-liquid-gold/[0.03]' : ''}`}>
                                    <h4 className={`text-xs md:text-[13px] font-black uppercase tracking-tight leading-[1.1] mb-2 md:mb-3 line-clamp-2 transition-colors ${
                                        isSelected ? 'text-liquid-gold' : 'text-slate-200 group-hover:text-white'
                                    }`}>{p.nombre || 'SERVICIO SIN NOMBRE'}</h4>
                                    
                                    <div className="mt-auto flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px]">
                                                {(CATEGORY_EMOJIS as any)[p.categoria] || '📦'}
                                            </div>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                                {p.categoria || 'General'}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <motion.div 
                                                initial={{ scale: 0, x: 20 }} animate={{ scale: 1, x: 0 }}
                                                className="bg-liquid-gold text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-gold-glow"
                                            >
                                                Activo
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
                
                {/* Fallback para servicio personalizado */}
                {searchTerm && filtered.length === 0 && (
                    <motion.button 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onSelect({ id: 'custom', nombre: searchTerm, categoria: 'Personalizado', precio: 0 })}
                        className="col-span-full p-8 md:p-16 rounded-2xl md:rounded-[3rem] border-2 border-dashed border-liquid-gold/20 bg-liquid-gold/5 text-center group flex flex-col items-center justify-center min-h-[240px] md:min-h-[300px] hover:border-liquid-gold/50 transition-all relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <SparklesIcon className="w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 text-liquid-gold/30 group-hover:text-liquid-gold group-hover:rotate-12 transition-all duration-500" />
                        <p className="text-lg md:text-xl font-black text-white uppercase tracking-[0.2em] md:tracking-[0.4em] leading-relaxed mb-2">
                            Protocolo No Encontrado
                        </p>
                        <p className="text-xs text-liquid-gold/60 font-bold uppercase tracking-widest">
                            Toca para iniciar diseño de "{searchTerm}" desde cero
                        </p>
                        <div className="mt-8 px-8 py-3 bg-white/5 rounded-full border border-white/10 group-hover:bg-liquid-gold group-hover:text-black transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest">Generar Especificación Única</span>
                        </div>
                    </motion.button>
                )}
            </div>
        </div>
    );
};

export default ServiceSelector;
