import React, { useState, useMemo, useEffect } from 'react';
import { 
    SearchIcon, SparklesIcon, ChevronRightIcon
} from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Regimen } from '../../types';
import { useData, CATEGORY_EMOJIS } from '../../contexts/DataContext';
import { ProductVisual, esProductoTalonario } from '../ProductVisual';
import { C, S, DISPLAY } from '../panelTheme';
import { formatCurrency } from '../../utils';

interface ServiceSelectorProps {
    onSelect: (servicio: any) => void;
    selectedId?: string;
    regimen?: string;
    forcedCategory?: string;
}

/**
 * ServiceSelector — Catálogo completo de productos, en el tema claro "Marino & Oro".
 * Antes usaba clases Tailwind oscuras (brand-blue/slate) que rompían la armonía dentro
 * del flujo de Nueva Orden. Migrado a los tokens de `panelTheme.ts`.
 */
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>
            {/* ── BÚSQUEDA ───────────────────────────────────────────────── */}
            <div style={{ ...S.card, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.faint, display: 'flex' }}>
                        <SearchIcon className="w-4 h-4" />
                    </span>
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        placeholder="Buscar producto o servicio gráfico…" 
                        style={{
                            width: '100%',
                            padding: '12px 14px 12px 40px',
                            background: C.bg,
                            border: `1px solid ${searchTerm ? C.royal : C.borderStrong}`,
                            borderRadius: 10,
                            fontSize: 13.5,
                            color: C.ink,
                            outline: 'none',
                            fontFamily: 'inherit',
                            transition: 'border-color .2s',
                            boxShadow: searchTerm ? '0 0 0 3px rgba(22,48,155,0.08)' : 'none',
                        }}
                    />
                </div>

                {/* Píldoras de categoría */}
                {!forcedCategory && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 2, scrollbarWidth: 'thin' }}>
                        {categories.map(cat => {
                            const isSelected = activeCategory === cat;
                            const emoji = (CATEGORY_EMOJIS as any)[cat] || '📦';
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    style={{
                                        flex: '0 0 auto',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '7px 13px',
                                        borderRadius: 9,
                                        border: `1px solid ${isSelected ? C.royal : C.borderStrong}`,
                                        background: isSelected ? C.royal : C.surface,
                                        color: isSelected ? '#FFFFFF' : C.body,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        letterSpacing: '.03em',
                                        cursor: 'pointer',
                                        transition: 'all .15s ease',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <span>{emoji}</span>
                                    <span>{cat}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── GRID DE PRODUCTOS ─────────────────────────────────────── */}
            <div ref={scrollRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                <AnimatePresence mode="popLayout">
                    {finalFiltered.map((p) => {
                        const isSelected = selectedId === p.id;
                        const esTalonario = esProductoTalonario(p.nombre);
                        return (
                            <motion.div
                                layout
                                key={p.id}
                                onClick={() => onSelect(p)}
                                style={{
                                    background: p.esSRI ? '#FFFCF2' : C.surface,
                                    border: `1.5px solid ${isSelected ? C.royal : (p.esSRI ? C.goldBorder : C.border)}`,
                                    borderLeft: p.esSRI ? `5px solid ${C.gold}` : `5px solid ${C.royal}`,
                                    borderRadius: 14,
                                    padding: 16,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: 150,
                                    cursor: 'pointer',
                                    transition: 'all .25s cubic-bezier(.2,.8,.2,1)',
                                    boxShadow: '0 2px 4px rgba(10,17,64,0.02)',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = p.esSRI ? C.gold : C.royal;
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 10px 24px -8px rgba(10,17,64,0.14)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = p.esSRI ? C.goldBorder : C.border;
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(10,17,64,0.02)';
                                }}
                            >
                                {/* Ilustración del producto (talonarios) o inicial de categoría */}
                                {esTalonario && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#F7F3EC', padding: '8px 0', marginBottom: 12 }}>
                                        <ProductVisual nombre={p.nombre} categoria={p.categoria} esSRI={p.esSRI} width={120} />
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: p.esSRI ? C.goldBg : C.chipBlue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                                        {p.esSRI ? '🏛️' : ((CATEGORY_EMOJIS as any)[p.categoria] || '📦')}
                                    </div>
                                    {p.esSRI ? (
                                        <span style={{ fontSize: 8, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: C.goldBg, color: C.goldTextStrong, border: `1px solid ${C.goldBorder}`, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                                            SRI Fiscal
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: C.softGray, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                                            {p.categoria || 'General'}
                                        </span>
                                    )}
                                </div>

                                <div style={{ marginTop: 10 }}>
                                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, textTransform: 'uppercase', letterSpacing: '.02em', lineHeight: 1.3 }}>
                                        {p.nombre}
                                    </div>
                                    <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {p.descripcion || 'Producto o servicio de imprenta'}
                                    </div>
                                </div>

                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <span style={{ fontSize: 8.5, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.08em', display: 'block' }}>
                                            Precio Base
                                        </span>
                                        <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: C.ink }}>
                                            {formatCurrency(p.precio || 0)}
                                        </span>
                                    </div>
                                    <span
                                        style={{
                                            padding: '7px 12px',
                                            borderRadius: 8,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '.04em',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 5,
                                            background: isSelected ? C.royal : C.softGray,
                                            color: isSelected ? '#FFFFFF' : C.royal,
                                            transition: 'all .15s ease',
                                        }}
                                    >
                                        <span>Seleccionar</span>
                                        <ChevronRightIcon className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {/* Fallback cuando no hay resultados */}
                {searchTerm && finalFiltered.length === 0 && (
                    <div 
                        onClick={() => onSelect({ id: 'custom', nombre: searchTerm, categoria: 'Manual', precio: 0 })}
                        style={{
                            gridColumn: '1 / -1',
                            background: C.surface,
                            padding: 32,
                            borderRadius: 16,
                            border: `2px dashed ${C.borderStrong}`,
                            textAlign: 'center',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'border-color .2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = C.royal}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = C.borderStrong}
                    >
                        <SparklesIcon className="w-8 h-8" style={{ color: C.royal }} />
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                            Crear Ítem Personalizado
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                            Ingresar "{searchTerm}" como producto personalizado para esta orden.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceSelector;
