import React, { useState, useEffect, useMemo } from 'react';
import { Proveedor, TareaProveedor, User } from '../types';
import { useData } from '../contexts/DataContext';
import { useOutletContext } from 'react-router-dom';
import { formatDate } from '../utils';
import { logActivity } from '../services/activityLogService';
import { SEO } from '../components/SEO';
import { C, S, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

const waLink = (phone: string) => {
    let p = (phone || '').replace(/\D/g, '');
    if (p.startsWith('09')) p = '593' + p.slice(1);
    else if (p.length === 9 && p.startsWith('9')) p = '593' + p;
    else if (p.length === 10 && p.startsWith('0')) p = '593' + p.slice(1);
    return `https://wa.me/${p}`;
};

const ProveedorFormModal: React.FC<{ open: boolean; onClose: () => void; onSave: (p: Partial<Proveedor>) => void; toEdit: Partial<Proveedor> | null }> = ({ open, onClose, onSave, toEdit }) => {
    const [f, setF] = useState<Partial<Proveedor>>({});
    useEffect(() => { setF(toEdit || { nombre: '', categoria: 'Papel y Cartulinas', tipo: 'Producto', contacto: '', telefono: '', estado: 'Activo' }); }, [toEdit, open]);
    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
            <form onSubmit={e => { e.preventDefault(); onSave(f); }} style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520, ...S.card, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.divider}`, background: C.surfaceAlt }}>
                    <h2 style={{ ...S.h2, fontSize: 17 }}>{f.id ? 'Editar proveedor' : 'Registrar proveedor'}</h2>
                </div>
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '72vh', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Nombre</span>
                            <input value={f.nombre || ''} onChange={e => setF({ ...f, nombre: e.target.value })} required style={S.input} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Categoría</span>
                            <input value={f.categoria || ''} onChange={e => setF({ ...f, categoria: e.target.value })} required style={S.input} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Contacto</span>
                            <input value={f.contacto || ''} onChange={e => setF({ ...f, contacto: e.target.value })} style={S.input} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Teléfono (WhatsApp)</span>
                            <input value={f.telefono || ''} onChange={e => setF({ ...f, telefono: e.target.value })} required style={S.input} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Tipo</span>
                            <select value={f.tipo || 'Producto'} onChange={e => setF({ ...f, tipo: e.target.value as any })} style={{ ...S.input, cursor: 'pointer' }}>
                                <option value="Producto">Suministro de producto</option>
                                <option value="Servicio">Prestación de servicio</option>
                            </select></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Estado</span>
                            <select value={f.estado || 'Activo'} onChange={e => setF({ ...f, estado: e.target.value as any })} style={{ ...S.input, cursor: 'pointer' }}>
                                <option value="Activo">Activo</option>
                                <option value="Inactivo">Inactivo</option>
                            </select></label>
                    </div>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Portafolio de productos</span>
                        <textarea value={f.productos || ''} onChange={e => setF({ ...f, productos: e.target.value })} rows={3} style={{ ...S.input, resize: 'none' }} /></label>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={S.softBtn}>Cancelar</button>
                        <button type="submit" style={S.primaryBtn}>Guardar</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const ProveedoresPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { proveedores, tareas, loading, addProveedor, updateProveedor, deleteProveedor, createTareaProveedor, updateTareaProveedor } = useData();

    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [agendaTab, setAgendaTab] = useState<'tareas' | 'mantenimiento'>('tareas');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [toEdit, setToEdit] = useState<Partial<Proveedor> | null>(null);
    const [viewing, setViewing] = useState<Proveedor | null>(null);
    const [newTarea, setNewTarea] = useState<Omit<TareaProveedor, 'id' | 'completada'>>({ proveedorId: '', titulo: '', tipo: 'General', descripcion: '', fechaVencimiento: '' });

    const kpis = useMemo(() => ({
        total: proveedores.length,
        pendientes: tareas.filter(t => !t.completada && t.tipo === 'General').length,
        mantenimientos: tareas.filter(t => !t.completada && t.tipo === 'Mantenimiento').length,
    }), [proveedores, tareas]);

    const categories = useMemo(() => ['Todos', ...Array.from(new Set(proveedores.map(p => p.categoria))).sort()], [proveedores]);

    const filteredProv = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return proveedores
            .filter(p => categoryFilter === 'Todos' || p.categoria === categoryFilter)
            .filter(p => p.nombre.toLowerCase().includes(q) || (p.contacto || '').toLowerCase().includes(q));
    }, [proveedores, searchTerm, categoryFilter]);

    const agendaItems = useMemo(() =>
        tareas
            .filter(t => agendaTab === 'tareas' ? t.tipo === 'General' : t.tipo === 'Mantenimiento')
            .sort((a, b) => (a.completada ? 1 : -1) || new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()),
        [tareas, agendaTab]);

    const nombreDe = (id: string) => proveedores.find(p => p.id === id)?.nombre || '—';

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Gestión de Proveedores · Imprenta Córdova" />
            <div style={S.wrap}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Entidades</p>
                        <h1 style={S.h1}>Gestión de Proveedores</h1>
                    </div>
                    <button style={S.primaryBtn} onClick={() => { setToEdit({}); setIsFormOpen(true); }}>Registrar proveedor</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                    {[
                        { l: 'Proveedores activos', v: kpis.total },
                        { l: 'Tareas pendientes', v: kpis.pendientes },
                        { l: 'Mantenimientos', v: kpis.mantenimientos },
                    ].map(k => (
                        <div key={k.l} style={{ ...S.card, borderRadius: 14, padding: '17px 19px' }}>
                            <div style={S.colHead}>{k.l}</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', color: C.ink, marginTop: 8, lineHeight: 1 }}>{k.v}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, alignItems: 'start' }}>

                    {/* Directorio */}
                    <div style={{ gridColumn: 'span 2', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ ...S.card, borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 9 }}>
                                <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar proveedor…"
                                    style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.ink, fontFamily: 'inherit' }} />
                            </div>
                            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ ...S.input, width: 'auto', padding: '8px 12px', fontSize: 12.5, cursor: 'pointer' }}>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {loading ? (
                            <div style={{ ...S.card, padding: 40, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando…</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
                                {filteredProv.map(p => (
                                    <div key={p.id} onClick={() => setViewing(p)} style={{ ...S.card, padding: '16px 18px', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                                            <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>{p.nombre}</span>
                                            <span style={{ width: 8, height: 8, borderRadius: 99, flexShrink: 0, marginTop: 5, background: p.estado === 'Activo' ? C.successDot : C.danger }} />
                                        </div>
                                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.royal, marginTop: 6 }}>{p.categoria}</div>
                                        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 8, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {p.productos || 'Sin portafolio registrado'}
                                        </div>
                                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.rowLine}` }}>
                                            <a href={waLink(p.telefono)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                                style={{ ...S.softBtn, background: '#F2F7F2', color: C.success, textDecoration: 'none' }}>WhatsApp</a>
                                        </div>
                                    </div>
                                ))}
                                {filteredProv.length === 0 && (
                                    <div style={{ ...S.card, padding: 40, textAlign: 'center', color: C.muted, fontSize: 13, gridColumn: '1 / -1' }}>Sin coincidencias.</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Agenda */}
                    <div style={{ ...S.card, overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.divider}` }}>
                            <h2 style={{ ...S.h2, fontSize: 16 }}>Agenda operativa</h2>
                        </div>
                        <form
                            onSubmit={async e => {
                                e.preventDefault();
                                if (!newTarea.proveedorId || !newTarea.titulo) return;
                                await createTareaProveedor(newTarea);
                                logActivity(currentUser.nombre, currentUser.rol, 'GESTION_PROVEEDOR', `Tarea: ${newTarea.titulo}`, 'Proveedores');
                                setNewTarea({ proveedorId: '', titulo: '', tipo: 'General', descripcion: '', fechaVencimiento: '' });
                            }}
                            style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: C.surfaceAlt, borderBottom: `1px solid ${C.divider}` }}
                        >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <select value={newTarea.proveedorId} onChange={e => setNewTarea({ ...newTarea, proveedorId: e.target.value })} required style={{ ...S.input, padding: '9px 11px', fontSize: 12, cursor: 'pointer' }}>
                                    <option value="">Proveedor…</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                                <select value={newTarea.tipo} onChange={e => setNewTarea({ ...newTarea, tipo: e.target.value as any })} style={{ ...S.input, padding: '9px 11px', fontSize: 12, cursor: 'pointer' }}>
                                    <option value="General">General</option>
                                    <option value="Mantenimiento">Mantenimiento</option>
                                </select>
                            </div>
                            <input value={newTarea.titulo} onChange={e => setNewTarea({ ...newTarea, titulo: e.target.value })} placeholder="Objetivo de la tarea…" required style={{ ...S.input, padding: '9px 11px', fontSize: 12.5 }} />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input type="date" value={newTarea.fechaVencimiento} onChange={e => setNewTarea({ ...newTarea, fechaVencimiento: e.target.value })} required style={{ ...S.input, flex: 1, padding: '9px 11px', fontSize: 12.5 }} />
                                <button type="submit" style={{ ...S.primaryBtn, padding: '9px 14px' }}>Añadir</button>
                            </div>
                        </form>
                        <div style={{ display: 'flex', borderBottom: `1px solid ${C.divider}` }}>
                            {(['tareas', 'mantenimiento'] as const).map(tab => (
                                <button key={tab} onClick={() => setAgendaTab(tab)}
                                    style={{ flex: 1, padding: '12px', border: 'none', background: agendaTab === tab ? C.chipBlue : 'transparent', color: agendaTab === tab ? C.royal : C.faint, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {tab === 'tareas' ? 'Tareas' : 'Mantenimiento'}
                                </button>
                            ))}
                        </div>
                        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                            {agendaItems.map(t => {
                                const vencida = new Date(t.fechaVencimiento) < new Date() && !t.completada;
                                return (
                                    <div key={t.id} style={{ display: 'flex', gap: 10, padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 10, opacity: t.completada ? 0.55 : 1 }}>
                                        <input type="checkbox" checked={t.completada} onChange={() => updateTareaProveedor(t.id, { completada: !t.completada })} style={{ marginTop: 2, cursor: 'pointer' }} />
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, textDecoration: t.completada ? 'line-through' : 'none' }}>{t.titulo}</div>
                                            <div style={{ display: 'flex', gap: 10, marginTop: 3, fontSize: 11, color: C.faint }}>
                                                <span>{nombreDe(t.proveedorId)}</span>
                                                <span style={{ color: vencida ? C.danger : C.faint }}>{formatDate(t.fechaVencimiento)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {agendaItems.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 12.5 }}>Sin eventos programados.</div>}
                        </div>
                    </div>
                </div>
            </div>

            <ProveedorFormModal open={isFormOpen} onClose={() => setIsFormOpen(false)} toEdit={toEdit}
                onSave={async data => { if (data.id) await updateProveedor(data.id, data); else await addProveedor(data as any); setIsFormOpen(false); }} />

            {viewing && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={() => setViewing(null)} />
                    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, ...S.card, overflow: 'hidden' }}>
                        <div style={{ padding: '20px 22px', borderBottom: `1px solid ${C.divider}`, background: C.surfaceAlt }}>
                            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.royal }}>{viewing.categoria}</p>
                            <h2 style={{ ...S.h2, fontSize: 22, marginTop: 4 }}>{viewing.nombre}</h2>
                        </div>
                        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ ...S.card, background: C.bg, padding: 14 }}>
                                <div style={S.colHead}>Contacto</div>
                                <div style={{ fontSize: 13.5, color: C.ink, marginTop: 4 }}>{viewing.contacto || '—'} · {viewing.telefono}</div>
                            </div>
                            <div style={{ ...S.card, background: C.bg, padding: 14 }}>
                                <div style={S.colHead}>Portafolio</div>
                                <div style={{ fontSize: 13, color: C.body, marginTop: 4, lineHeight: 1.6 }}>{viewing.productos || 'Sin portafolio registrado'}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
                                <button style={{ ...S.softBtn, background: 'transparent', color: '#B91C1C' }}
                                    onClick={() => { deleteProveedor(viewing.id); setViewing(null); }}>Eliminar</button>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button style={S.softBtn} onClick={() => setViewing(null)}>Cerrar</button>
                                    <button style={S.primaryBtn} onClick={() => { setToEdit(viewing); setViewing(null); setIsFormOpen(true); }}>Editar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProveedoresPage;
