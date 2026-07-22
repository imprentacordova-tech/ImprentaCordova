import React, { useState, useMemo, useEffect } from 'react';
import { 
    SearchIcon, ShieldCheckIcon, 
    CheckCircleIcon, SparklesIcon,
    BoxIcon, LayersIcon, PlusIcon, ChevronRightIcon
} from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Regimen } from '../../types';
import { useData, CATEGORY_EMOJIS } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';

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
        <div className="space-y-6 pb-6">
            {/* ── BÚSQUEDA Y SELECCIÓN DE CATEGORÍAS ───────────────────────── */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative flex-1 w-full">
                        <SearchIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            placeholder="Buscar producto o servicio gráfico..." 
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-900 focus:border-brand-blue outline-none transition-all placeholder:text-slate-400" 
                        />
                    </div>
                </div>

                {/* Pill categories scroll */}
                {!forcedCategory && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {categories.map(cat => {
                            const isSelected = activeCategory === cat;
                            const emoji = (CATEGORY_EMOJIS as any)[cat] || '📦';
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all border ${
                                        isSelected
                                            ? 'bg-brand-blue text-white border-brand-blue shadow-blue-glow-sm'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <span>{emoji}</span>
                                    <span>{cat}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── GRID DE PRODUCTOS DEL CATÁLOGO ─────────────────────────── */}
            <div ref={scrollRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                    {finalFiltered.map((p) => {
                        const isSelected = selectedId === p.id;
                        return (
                            <motion.div
                                layout
                                key={p.id}
                                onClick={() => onSelect(p)}
                                className={`group bg-white rounded-2xl border-2 p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
                                    isSelected
                                        ? 'border-brand-blue bg-brand-blue/5'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shrink-0">
                                            {(CATEGORY_EMOJIS as any)[p.categoria] || '📦'}
                                        </div>
                                        {p.esSRI ? (
                                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue border border-brand-blue/20 uppercase">
                                                SRI Fiscal
                                            </span>
                                        ) : (
                                            <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                                                {p.categoria || 'General'}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase leading-snug group-hover:text-brand-blue transition-colors">
                                            {p.nombre}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                                            {p.descripcion || 'Producto o servicio de imprenta'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                                    <div>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Precio Base</span>
                                        <span className="text-base font-black text-slate-900">{formatCurrency(p.precio || 0)}</span>
                                    </div>

                                    <button
                                        type="button"
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                                            isSelected
                                                ? 'bg-brand-blue text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-700 group-hover:bg-brand-blue group-hover:text-white'
                                        }`}
                                    >
                                        <span>Seleccionar</span>
                                        <ChevronRightIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Fallback cuando no hay resultados */}
                {searchTerm && finalFiltered.length === 0 && (
                    <div 
                        onClick={() => onSelect({ id: 'custom', nombre: searchTerm, categoria: 'Manual', precio: 0 })}
                        className="col-span-full bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand-blue text-center cursor-pointer space-y-3 transition-all"
                    >
                        <SparklesIcon className="w-8 h-8 text-brand-blue mx-auto" />
                        <h3 className="text-sm font-black text-slate-900 uppercase">Crear Ítem Personalizado</h3>
                        <p className="text-[11px] text-slate-500">
                            Ingresar "{searchTerm}" como producto personalizado para esta orden.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceSelector;
