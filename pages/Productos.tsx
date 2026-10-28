import React, { useState, useMemo } from 'react';
import { Producto, User } from '../types';
import { formatCurrency } from '../utils';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/activityLogService';
import { useData } from '../contexts/DataContext';
import { ProductManagementModal } from '../components/ProductManagementModal';
import { ProductVisual } from '../components/ProductVisual';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

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

    const categories = useMemo(() => ['Todas', ...Array.from(new Set(productos.map(p => p.categoria)))], [productos]);
    const filtered = useMemo(() =>
        productos
            .filter(p => (categoryFilter === 'Todas' || p.categoria === categoryFilter) && (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')),
        [productos, searchTerm, categoryFilter]);

    const handleSave = async (product: Producto | Producto[]) => {
        try {
            if (Array.isArray(product)) {
                await bulkCreateProductos(product);
                logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_CREADO', `Generó ${product.length} productos por matriz`, 'Catálogo');
            } else if (product.id && !product.id.startsWith('preview')) {
                await updateProducto(product.id, product);
                logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_MODIFICADO', `Modificó: ${product.nombre}`, 'Catálogo');
            } else {
                const { id, ...clean } = product as any;
                await createProducto(clean);
                logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_CREADO', `Creó: ${product.nombre}`, 'Catálogo');
            }
            setIsMgmtModalOpen(false);
            setProductToEdit(null);
            refreshData();
        } catch (err) { console.error(err); }
    };

    const handleSeed = async () => {
        if (window.confirm('¿Sincronizar el catálogo maestro con los valores predeterminados?')) {
            await seedCatalog();
            refreshData();
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Eliminar este producto? No se puede deshacer.')) {
            try {
                await deleteProducto(id);
                setViewing(null);
                refreshData();
                logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_ELIMINADO', `Eliminó producto ${id}`, 'Catálogo');
            } catch (err) { console.error(err); alert('Error al eliminar el producto'); }
        }
    };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Catálogo de Productos · Imprenta Córdova" />
            <div style={S.wrap}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Gestión</p>
                        <h1 style={S.h1}>Catálogo de Productos</h1>
                    </div>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                        <button style={S.outlineBtn} onClick={() => navigate('/calculadora')}>Calculadora</button>
                        <button style={S.outlineBtn} onClick={() => { setProductToEdit(null); setMgmtModalMode('MATRIX'); setIsMgmtModalOpen(true); }}>Matriz de precios</button>
                        <button style={S.primaryBtn} onClick={() => { setProductToEdit(null); setMgmtModalMode('SINGLE'); setIsMgmtModalOpen(true); }}>Nuevo producto</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,240px) 1fr', gap: 16, alignItems: 'start' }}>
                    <div style={{ ...S.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ ...S.fieldLabel, marginBottom: 8 }}>Categorías</div>
                        {categories.map(cat => {
                            const on = categoryFilter === cat;
                            const n = cat === 'Todas' ? productos.length : productos.filter(p => p.categoria === cat).length;
                            return (
                                <button key={cat} onClick={() => setCategoryFilter(cat)}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, border: 'none',
                                        cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, textAlign: 'left',
                                        background: on ? C.chipBlue : 'transparent', color: on ? C.royal : C.body,
                                    }}>
                                    <span>{cat === 'Todas' ? 'Todo el catálogo' : cat}</span>
                                    <span style={{ fontFamily: MONO, fontSize: 11, color: on ? C.royal : C.faint }}>{n}</span>
                                </button>
                            );
                        })}
                        <button style={{ ...S.softBtn, width: '100%', marginTop: 10, justifyContent: 'center' }} onClick={handleSeed}>Sincronizar maestro</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                        <div style={{ ...S.card, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar producto por nombre…"
                                style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13.5, color: C.ink, fontFamily: 'inherit' }} />
                        </div>

                        {loading ? (
                            <div style={{ ...S.card, padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando catálogo…</div>
                        ) : filtered.length === 0 ? (
                            <div style={{ ...S.card, padding: 48, textAlign: 'center', color: C.muted, fontSize: 13 }}>No se encontraron productos.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
                                {filtered.map(prod => (
                                    <div key={prod.id} style={{ ...S.card, overflow: 'hidden' }}>
                                        <div onClick={() => setViewing(prod)} style={{ height: 140, background: C.softGray, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                                            {prod.imagenUrl
                                                ? <img src={prod.imagenUrl} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                : <ProductVisual nombre={prod.nombre} categoria={prod.categoria} esSRI={prod.esSRI} width={150} />}
                                        </div>
                                        <div style={{ padding: '14px 16px' }}>
                                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.royal }}>{prod.categoria}</div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.nombre}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.rowLine}` }}>
                                                <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: C.ink }}>{formatCurrency(prod.precio)}</span>
                                                <button style={{ ...S.softBtn, padding: '6px 10px', fontSize: 11.5 }} onClick={() => { setProductToEdit(prod); setIsMgmtModalOpen(true); }}>Editar</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ProductManagementModal isOpen={isMgmtModalOpen} onClose={() => setIsMgmtModalOpen(false)} onSave={handleSave} productToEdit={productToEdit} defaultMode={mgmtModalMode} />

            {viewing && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={() => setViewing(null)} />
                    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 640, ...S.card, overflow: 'hidden' }}>
                        <div style={{ height: 200, background: C.softGray, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {viewing.imagenUrl ? <img src={viewing.imagenUrl} alt={viewing.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ProductVisual nombre={viewing.nombre} categoria={viewing.categoria} esSRI={viewing.esSRI} width={200} />}
                        </div>
                        <div style={{ padding: 22 }}>
                            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.royal }}>{viewing.categoria}</div>
                            <h2 style={{ ...S.h1, fontSize: 24, marginTop: 6 }}>{viewing.nombre}</h2>
                            <p style={{ fontSize: 13.5, color: C.body, marginTop: 10, lineHeight: 1.6 }}>{viewing.descripcion || 'Sin descripción registrada.'}</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.divider}` }}>
                                <span style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, color: C.royal }}>{formatCurrency(viewing.precio || 0)}</span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button style={{ ...S.softBtn, background: '#FEF2F2', color: '#B91C1C' }} onClick={() => handleDelete(viewing.id)}>Eliminar</button>
                                    <button style={S.softBtn} onClick={() => setViewing(null)}>Cerrar</button>
                                    <button style={S.primaryBtn} onClick={() => { const p = viewing; setViewing(null); setProductToEdit(p); setIsMgmtModalOpen(true); }}>Editar</button>
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
