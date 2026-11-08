import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { formatCurrency } from '../utils';
import { InventoryItem, User } from '../types';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

const UNIDADES = ['Resmas', 'Pliegos', 'Metros', 'Unidades', 'Kilos'];

const InventoryModal: React.FC<{ item: Partial<InventoryItem> | null; onClose: () => void; onSave: (i: Partial<InventoryItem>) => void }> = ({ item, onClose, onSave }) => {
    const { proveedores } = useData();
    const [f, setF] = useState<Partial<InventoryItem>>({});
    useEffect(() => { setF(item || { item: '', cantidad: 0, unidad: 'Resmas', costoUnitario: 0, minimo: 1 }); }, [item]);
    if (!item) return null;
    const low = f.cantidad !== undefined && f.minimo !== undefined && f.cantidad <= f.minimo;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
            <form onSubmit={e => { e.preventDefault(); onSave(f); }} style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, ...S.card, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.divider}`, background: C.surfaceAlt }}>
                    <h2 style={{ ...S.h2, fontSize: 17 }}>{f.id ? 'Editar insumo' : 'Registrar insumo'}</h2>
                </div>
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Nombre del material</span>
                        <input value={f.item || ''} onChange={e => setF({ ...f, item: e.target.value })} required style={S.input} /></label>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Proveedor</span>
                        <select value={f.proveedorId || ''} onChange={e => setF({ ...f, proveedorId: e.target.value })} style={{ ...S.input, cursor: 'pointer' }}>
                            <option value="">— Sin proveedor —</option>
                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select></label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Cantidad actual</span>
                            <input type="number" step="0.001" value={f.cantidad ?? ''} onChange={e => setF({ ...f, cantidad: parseFloat(e.target.value) })} required style={{ ...S.input, fontFamily: MONO }} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Unidad</span>
                            <select value={f.unidad || 'Resmas'} onChange={e => setF({ ...f, unidad: e.target.value })} style={{ ...S.input, cursor: 'pointer' }}>
                                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select></label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Costo unitario</span>
                            <input type="number" step="0.01" value={f.costoUnitario ?? ''} onChange={e => setF({ ...f, costoUnitario: parseFloat(e.target.value) })} required style={{ ...S.input, fontFamily: MONO }} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Stock mínimo</span>
                            <input type="number" step="0.1" value={f.minimo ?? ''} onChange={e => setF({ ...f, minimo: parseFloat(e.target.value) })} required
                                style={{ ...S.input, fontFamily: MONO, ...(low ? { background: '#FEF2F2', borderColor: '#FBD5D5' } : {}) }} /></label>
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={S.softBtn}>Cancelar</button>
                        <button type="submit" style={S.primaryBtn}>Guardar</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const InventarioPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { inventario, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [itemToEdit, setItemToEdit] = useState<Partial<InventoryItem> | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    const kpis = useMemo(() => ({
        valorTotal: inventario.reduce((s, i) => s + i.cantidad * i.costoUnitario, 0),
        totalItems: inventario.length,
        bajoStock: inventario.filter(i => i.cantidad <= i.minimo).length,
    }), [inventario]);

    const filtered = useMemo(() => inventario.filter(i => i.item.toLowerCase().includes(searchTerm.toLowerCase())), [inventario, searchTerm]);

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            complete: async (results) => {
                try {
                    for (const row of results.data as Record<string, string>[]) {
                        const itemStr = row['ITEM'] || row['item'] || row['Descripción'];
                        if (!itemStr) continue;
                        await addInventoryItem({
                            item: itemStr,
                            cantidad: parseFloat(row['CANTIDAD'] || row['cantidad'] || row['Existencias']) || 0,
                            minimo: parseFloat(row['MINIMO'] || row['minimo'] || row['Límite']) || 1,
                            costoUnitario: parseFloat(row['COSTO'] || row['costo'] || row['Inversión']) || 0,
                            unidad: row['UNIDAD'] || row['unidad'] || 'Unidades',
                        });
                    }
                    logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', 'Importó inventario en bloque', 'Insumos');
                } catch (err) { console.error('Error importando CSV', err); }
                finally { setIsImporting(false); if (fileRef.current) fileRef.current.value = ''; }
            },
            error: (err) => { console.error('Error CSV', err); setIsImporting(false); },
        });
    };

    const handleSave = async (item: Partial<InventoryItem>) => {
        if (item.id) {
            await updateInventoryItem(item.id, item);
            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Actualizó: ${item.item}`, 'Insumos');
        } else {
            await addInventoryItem(item);
            logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Registró: ${item.item}`, 'Insumos');
        }
        if (item.cantidad !== undefined && item.minimo !== undefined && item.cantidad <= item.minimo) {
            logActivity(currentUser.nombre, currentUser.rol, 'ALERTA_STOCK', `Stock crítico de ${item.item}`, 'Insumos');
        }
        setItemToEdit(null);
    };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Bodega de Insumos · Imprenta Córdova" />
            <div style={S.wrap}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Taller</p>
                        <h1 style={S.h1}>Bodega de Insumos</h1>
                    </div>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                        <input type="file" accept=".csv" style={{ display: 'none' }} ref={fileRef} onChange={handleImportCSV} />
                        <button style={S.outlineBtn} disabled={isImporting} onClick={() => fileRef.current?.click()}>{isImporting ? 'Importando…' : 'Importar CSV'}</button>
                        <button style={S.primaryBtn} onClick={() => setItemToEdit({})}>Registrar insumo</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,150px),1fr))', gap: 14 }}>
                    {[
                        { l: 'Inversión en almacén', v: formatCurrency(kpis.valorTotal), c: C.royal },
                        { l: 'Materiales registrados', v: String(kpis.totalItems), c: C.ink },
                        { l: 'Alertas de reposición', v: String(kpis.bajoStock), c: kpis.bajoStock > 0 ? C.danger : C.successDot },
                    ].map(k => (
                        <div key={k.l} style={{ ...S.card, borderRadius: 14, padding: '17px 19px' }}>
                            <div style={S.colHead}>{k.l}</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', color: k.c, marginTop: 8, lineHeight: 1 }}>{k.v}</div>
                        </div>
                    ))}
                </div>

                <div style={{ ...S.card, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Identificar material o referencia…"
                        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13.5, color: C.ink, fontFamily: 'inherit' }} />
                </div>

                <div style={{ ...S.card, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando bodega…</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center' }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Bodega vacía</p>
                            <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>No hay materiales registrados.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <div style={{ minWidth: 720 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr .8fr 1fr .7fr .7fr auto', padding: '11px 20px', background: C.surfaceAlt, borderBottom: `1px solid ${C.divider}` }}>
                                    <span style={S.colHead}>Material</span>
                                    <span style={S.colHead}>Estado</span>
                                    <span style={S.colHead}>Existencias</span>
                                    <span style={{ ...S.colHead, textAlign: 'right' }}>Costo unit.</span>
                                    <span style={{ ...S.colHead, textAlign: 'right' }}>Valoración</span>
                                    <span style={S.colHead} />
                                </div>
                                {filtered.map(i => {
                                    const low = i.cantidad <= i.minimo;
                                    const w = Math.min(100, Math.round((i.cantidad / Math.max(1, i.minimo * 2)) * 100));
                                    return (
                                        <div key={i.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr .8fr 1fr .7fr .7fr auto', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${C.rowLine}` }}>
                                            <span>
                                                <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.ink }}>{i.item}</span>
                                                <span style={{ display: 'block', fontSize: 11.5, color: C.faint, marginTop: 2 }}>mínimo {i.minimo} {i.unidad}</span>
                                            </span>
                                            <span>
                                                <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, ...(low ? { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FBD5D5' } : { background: '#F2F7F2', color: C.success, border: '1px solid #D8E8DC' }) }}>
                                                    {low ? 'Stock bajo' : 'Nominal'}
                                                </span>
                                            </span>
                                            <span>
                                                <span style={{ display: 'block', fontSize: 12.5, color: C.ink, fontFamily: MONO }}>{i.cantidad.toFixed(2)} {i.unidad.toLowerCase()}</span>
                                                <span style={{ display: 'block', height: 5, background: C.softGray, borderRadius: 99, overflow: 'hidden', marginTop: 5, maxWidth: 130 }}>
                                                    <span style={{ display: 'block', height: '100%', borderRadius: 99, background: low ? C.danger : C.successDot, width: `${w}%` }} />
                                                </span>
                                            </span>
                                            <span style={{ textAlign: 'right', fontSize: 12.5, fontFamily: MONO, color: C.muted }}>{formatCurrency(i.costoUnitario)}</span>
                                            <span style={{ textAlign: 'right', fontSize: 12.5, fontFamily: MONO, color: C.ink }}>{formatCurrency(i.cantidad * i.costoUnitario)}</span>
                                            <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <button style={{ ...S.softBtn, padding: '6px 10px', fontSize: 11.5 }} onClick={() => setItemToEdit(i)}>Editar</button>
                                                <button
                                                    style={{ ...S.softBtn, padding: '6px 10px', fontSize: 11.5, background: '#FEF2F2', color: '#B91C1C' }}
                                                    onClick={() => { if (window.confirm(`¿Eliminar "${i.item}"?`)) { deleteInventoryItem(i.id); logActivity(currentUser.nombre, currentUser.rol, 'INVENTARIO_MODIFICADO', `Retiró: ${i.item}`, 'Insumos'); } }}
                                                >Quitar</button>
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <InventoryModal item={itemToEdit} onClose={() => setItemToEdit(null)} onSave={handleSave} />
        </div>
    );
};

export default InventarioPage;
