import React, { useState, useMemo } from 'react';
import { Producto, User } from '../types';
import { formatCurrency } from '../utils';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/activityLogService';
import { useData, CATEGORY_EMOJIS } from '../contexts/DataContext';
import { ProductManagementModal } from '../components/ProductManagementModal';
import { ProductVisual } from '../components/ProductVisual';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

/**
 * Catálogo de Productos — gestión del catálogo maestro.
 * Layout minimalista: buscador dominante, categorías a la izquierda y una grilla
 * de fichas con ilustración dinámica, precio y edición en un clic.
 */
const ProductosPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { productos, loading, createProducto, updateProducto, deleteProducto, bulkCreateProductos, refreshData, seedCatalog } = useData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
    const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false);
    const [mgmtModalMode, setMgmtModalMode] = useState<'SINGLE' | 'MATRIX'>('SINGLE');
    const [viewing, setViewing] = useState<Producto | null>(null);
    const [seeding, setSeeding] = useState(false);

    const categories = useMemo(() => {
        const set = new Set(productos.map(p => p.categoria).filter(Boolean));
        return ['Todas', ...Array.from(set).sort()];
    }, [productos]);

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return productos
            .filter(p => {
                if (categoryFilter !== 'Todas' && p.categoria !== categoryFilter) return false;
                if (!q) return true;
                const heno = [p.nombre, p.categoria, p.descripcion, ...(p.specs || [])]
                    .filter(Boolean).join(' ').toLowerCase();
                return heno.includes(q);
            })
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    }, [productos, searchTerm, categoryFilter]);

    const handleSave = async (product: Producto | Producto[]) => {
        try {
            if (Array.isArray(product)) {
                await bulkCreateProductos(product);
                logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_CREADO', `Generó ${product.length} productos por matriz`, 'Catálogo');
            } else if (product.id && !product.id.startsWith('preview')) {
                await updateProducto(product.id, product);
                logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_MODIFICADO', `Modificó: ${product.nombre}`, 'Catálogo');
            } else {
                const { id: _id, ...clean } = product;
                await createProducto(clean);
                logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_CREADO', `Creó: ${product.nombre}`, 'Catálogo');
            }
            setIsMgmtModalOpen(false);
            setProductToEdit(null);
            refreshData();
        } catch (err) { console.error(err); }
    };

    const handleSeed = async () => {
        if (!window.confirm('¿Restaurar el catálogo maestro? Se agregarán los productos que falten y se actualizarán los que ya existen con sus precios de referencia.')) return;
        setSeeding(true);
        try {
            await seedCatalog();
            refreshData();
        } finally {
            setSeeding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Eliminar este producto? No se puede deshacer.')) return;
        try {
            await deleteProducto(id);
            setViewing(null);
            refreshData();
            logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_ELIMINADO', `Eliminó producto ${id}`, 'Catálogo');
        } catch (err) { console.error(err); alert('Error al eliminar el producto'); }
    };

    const abrirNuevo = () => { setProductToEdit(null); setMgmtModalMode('SINGLE'); setIsMgmtModalOpen(true); };
    const abrirEdicion = (p: Producto) => { setProductToEdit(p); setMgmtModalMode('SINGLE'); setIsMgmtModalOpen(true); };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Catálogo de Productos · Imprenta Córdova" />
            <div style={S.wrap}>

                {/* Cabecera */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Gestión · Catálogo</p>
                        <h1 style={S.h1}>Catálogo de Productos</h1>
                        <p style={S.lead}>Documentos tributarios SRI y trabajos comerciales. Editá precios, fotos y descripciones desde cada ficha.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                        <button style={S.outlineBtn} onClick={() => navigate('/calculadora')}>Cotizador</button>
                        <button style={S.outlineBtn} onClick={() => { setProductToEdit(null); setMgmtModalMode('MATRIX'); setIsMgmtModalOpen(true); }}>Matriz de precios</button>
                        <button style={S.primaryBtn} onClick={abrirNuevo}>+ Nuevo producto</button>
                    </div>
                </div>

                {/* Buscador dominante */}
                <div style={{ ...S.card, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: C.faint, fontSize: 15 }}>⌕</span>
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nombre, categoría, descripción o especificación…"
                        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13.5, color: C.ink, fontFamily: 'inherit' }}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.faint, fontSize: 16, lineHeight: 1 }} title="Limpiar">×</button>
                    )}
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.faint, whiteSpace: 'nowrap' }}>
                        {filtered.length} / {productos.length}
                    </span>
                </div>

                {/* Categorías + Grilla */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,210px) 1fr', gap: 16, alignItems: 'start' }}>
                    <aside style={{ ...S.card, padding: 12, display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 16 }}>
                        <div style={{ ...S.fieldLabel, marginBottom: 6, paddingLeft: 4 }}>Categorías</div>
                        {categories.map(cat => {
                            const on = categoryFilter === cat;
                            const n = cat === 'Todas' ? productos.length : productos.filter(p => p.categoria === cat).length;
                            const emoji = (CATEGORY_EMOJIS as any)[cat] || '📦';
                            return (
                                <button key={cat} onClick={() => setCategoryFilter(cat)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                                        padding: '8px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                                        fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, textAlign: 'left',
                                        background: on ? C.chipBlue : 'transparent', color: on ? C.royal : C.body,
                                    }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                                        <span>{emoji}</span>
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat === 'Todas' ? 'Todo el catálogo' : cat}</span>
                                    </span>
                                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: on ? C.royal : C.faint }}>{n}</span>
                                </button>
                            );
                        })}
                        <button
                            style={{ ...S.softBtn, width: '100%', marginTop: 12, justifyContent: 'center', opacity: seeding ? 0.6 : 1 }}
                            onClick={handleSeed}
                            disabled={seeding}
                        >
                            {seeding ? 'Restaurando…' : '↻ Restaurar maestro'}
                        </button>
                    </aside>

                    <section style={{ minWidth: 0 }}>
                        {loading ? (
                            <div style={{ ...S.card, padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando catálogo…</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ ...S.card, padding: 48, textAlign: 'center' }}>
                                <div style={{ fontSize: 30 }}>🔎</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginTop: 8 }}>Sin resultados</div>
                                <div style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>
                                    {searchTerm ? `No hay productos que coincidan con “${searchTerm}”.` : 'No hay productos en esta categoría.'}
                                </div>
                                {searchTerm && (
                                    <button style={{ ...S.softBtn, marginTop: 12 }} onClick={() => setSearchTerm('')}>Limpiar búsqueda</button>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                                {filtered.map(prod => (
                                    <div key={prod.id} style={{ ...S.card, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow .2s' }}>
                                        <div
                                            onClick={() => setViewing(prod)}
                                            style={{ height: 140, background: prod.esSRI ? '#FFFCF2' : '#F7F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                                        >
                                            {prod.imagenUrl
                                                ? <img src={prod.imagenUrl} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <ProductVisual nombre={prod.nombre} categoria={prod.categoria} esSRI={prod.esSRI} width={160} />}
                                            {prod.esSRI && (
                                                <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: C.gold, color: C.ink }}>
                                                    🏛️ SRI
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
                                            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.royal }}>
                                                {(CATEGORY_EMOJIS as any)[prod.categoria] || '📦'} {prod.categoria}
                                            </div>
                                            <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>
                                                {prod.nombre}
                                            </div>
                                            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {prod.descripcion || 'Sin descripción registrada.'}
                                            </div>
                                            <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${C.rowLine}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: C.ink }}>
                                                    {formatCurrency(prod.precio || 0)}
                                                </span>
                                                <button style={{ ...S.softBtn, padding: '6px 10px', fontSize: 11.5 }} onClick={() => abrirEdicion(prod)}>Editar</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <ProductManagementModal isOpen={isMgmtModalOpen} onClose={() => setIsMgmtModalOpen(false)} onSave={handleSave} productToEdit={productToEdit} defaultMode={mgmtModalMode} />

            {viewing && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={() => setViewing(null)} />
                    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 640, ...S.card, overflow: 'hidden' }}>
                        <div style={{ height: 210, background: viewing.esSRI ? '#FFFCF2' : '#F7F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {viewing.imagenUrl
                                ? <img src={viewing.imagenUrl} alt={viewing.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <ProductVisual nombre={viewing.nombre} categoria={viewing.categoria} esSRI={viewing.esSRI} width={210} />}
                        </div>
                        <div style={{ padding: 22 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.royal }}>{viewing.categoria}</span>
                                {viewing.esSRI && <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: C.goldBg, color: C.goldTextStrong, border: `1px solid ${C.goldBorder}` }}>🏛️ AUTORIZADO SRI · SIN IVA</span>}
                            </div>
                            <h2 style={{ ...S.h1, fontSize: 24, marginTop: 6 }}>{viewing.nombre}</h2>
                            <p style={{ fontSize: 13.5, color: C.body, marginTop: 10, lineHeight: 1.6 }}>{viewing.descripcion || 'Sin descripción registrada.'}</p>
                            {viewing.specs && viewing.specs.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                                    {viewing.specs.map((sp, i) => (
                                        <span key={i} style={{ fontSize: 11, fontWeight: 600, color: C.body, background: C.softGray, border: `1px solid ${C.border}`, borderRadius: 99, padding: '3px 9px' }}>{sp}</span>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.divider}` }}>
                                <span style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, color: C.royal }}>{formatCurrency(viewing.precio || 0)}</span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button style={{ ...S.softBtn, background: '#FEF2F2', color: '#B91C1C' }} onClick={() => handleDelete(viewing.id)}>Eliminar</button>
                                    <button style={S.softBtn} onClick={() => setViewing(null)}>Cerrar</button>
                                    <button style={S.primaryBtn} onClick={() => { const p = viewing; setViewing(null); abrirEdicion(p); }}>Editar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductosPage;
