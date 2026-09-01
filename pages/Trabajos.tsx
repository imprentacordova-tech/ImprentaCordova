import React, { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { TrabajoEstado, User } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { SEO } from '../components/SEO';
import { C, S, MONO, estadoCfg, dot, estadoPill, PANEL_KEYFRAMES } from '../components/panelTheme';
import OrderDrawer from '../components/orders/OrderDrawer';

const ESTADO_TABS: (TrabajoEstado | 'Todos')[] = [
    'Todos', TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO, TrabajoEstado.PROCESO, TrabajoEstado.VITRINA, TrabajoEstado.ENTREGADO,
];

const TrabajosPage: React.FC = () => {
    const { trabajos, clientes, loading } = useData();
    const navigate = useNavigate();
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const [openOrderId, setOpenOrderId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState<'Todos' | 'SRI' | 'GENERAL'>('Todos');
    const [estadoFilter, setEstadoFilter] = useState<TrabajoEstado | 'Todos'>('Todos');

    const counts = useMemo(() => {
        const c: Record<string, number> = { Todos: (trabajos ?? []).length };
        (trabajos ?? []).forEach(t => { c[t.estado] = (c[t.estado] || 0) + 1; });
        return c;
    }, [trabajos]);

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase().trim();
        return (trabajos ?? []).filter(t => {
            const cli = clientes.find(c => c.id === t.clienteId);
            const nombre = (cli ? cli.nombre : t.titular).toLowerCase();
            const searchMatch = q === '' || nombre.includes(q) || String(t.orden).includes(q) ||
                (t.tipo || '').toLowerCase().includes(q) || (t.subtipo || '').toLowerCase().includes(q);
            const tipoMatch = tipoFilter === 'Todos' || (tipoFilter === 'SRI' ? !!t.esSRI : !t.esSRI);
            const estadoMatch = estadoFilter === 'Todos' || t.estado === estadoFilter;
            return searchMatch && tipoMatch && estadoMatch;
        });
    }, [trabajos, clientes, searchTerm, tipoFilter, estadoFilter]);

    /* El cajón lee siempre de la lista viva: al avanzar el estado se refleja en la fila y en el cajón. */
    const openTrabajo = useMemo(
        () => (trabajos ?? []).find(t => t.id === openOrderId) || null,
        [trabajos, openOrderId],
    );

    const gridCols = '.9fr 1.4fr .7fr .9fr .7fr .7fr .8fr';

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Órdenes de Producción · Imprenta Córdova" />
            <div style={S.wrap}>

                {/* Cabecera */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Operaciones</p>
                        <h1 style={S.h1}>Órdenes de Producción</h1>
                    </div>
                    <button style={S.primaryBtn} onClick={() => navigate('/nuevo')}>Nueva Orden</button>
                </div>

                {/* Búsqueda + tipo */}
                <div style={{ ...S.card, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 10 }}>
                        <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar por cliente, N° orden, producto o tipo…"
                            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.ink, fontFamily: 'inherit' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 4, background: C.softGray, padding: 4, borderRadius: 10 }}>
                        {(['Todos', 'SRI', 'GENERAL'] as const).map(v => (
                            <button
                                key={v}
                                onClick={() => setTipoFilter(v)}
                                style={{
                                    padding: '8px 14px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                    background: tipoFilter === v ? '#fff' : 'transparent', color: tipoFilter === v ? C.royal : C.faint,
                                }}
                            >{v === 'GENERAL' ? 'Comercial' : v === 'SRI' ? 'SRI Fiscal' : 'Todos'}</button>
                        ))}
                    </div>
                </div>

                {/* Tabs de estado */}
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {ESTADO_TABS.map(tab => {
                        const on = estadoFilter === tab;
                        const label = tab === 'Todos' ? 'Todas' : estadoCfg(tab as TrabajoEstado).label;
                        const n = counts[tab as string] || 0;
                        return (
                            <button
                                key={tab}
                                onClick={() => setEstadoFilter(tab)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 99,
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                    ...(on ? { background: C.royal, color: '#fff', border: `1px solid ${C.royal}` } : { background: '#fff', color: C.body, border: `1px solid ${C.borderStrong}` }),
                                }}
                            >
                                {tab !== 'Todos' && <span style={dot(estadoCfg(tab as TrabajoEstado).dot, 6)} />}
                                {label}
                                <span style={{ fontFamily: MONO, fontSize: 10.5, opacity: on ? 0.85 : 0.6 }}>{n}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tabla */}
                <div style={{ ...S.card, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando órdenes…</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center' }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>No se encontraron órdenes</p>
                            <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Cambia el filtro de búsqueda o de estado.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <div style={{ minWidth: 820 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: gridCols, padding: '11px 20px', background: C.surfaceAlt, borderBottom: `1px solid ${C.divider}` }}>
                                    <span style={S.colHead}>N° orden</span>
                                    <span style={S.colHead}>Cliente / producto</span>
                                    <span style={S.colHead}>Tipo</span>
                                    <span style={S.colHead}>Estado</span>
                                    <span style={{ ...S.colHead, textAlign: 'right' }}>Abono</span>
                                    <span style={{ ...S.colHead, textAlign: 'right' }}>Saldo</span>
                                    <span style={{ ...S.colHead, textAlign: 'right' }}>Entrega</span>
                                </div>
                                {filtered.map(t => {
                                    const cli = clientes.find(c => c.id === t.clienteId);
                                    const cfg = estadoCfg(t.estado);
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => setOpenOrderId(t.id)}
                                            style={{ display: 'grid', gridTemplateColumns: gridCols, alignItems: 'center', padding: '13px 20px', borderBottom: `1px solid ${C.rowLine}`, cursor: 'pointer' }}
                                        >
                                            <span style={{ fontSize: 12.5, fontFamily: MONO, color: C.ink }}>#{String(t.orden).padStart(4, '0')}</span>
                                            <span style={{ minWidth: 0 }}>
                                                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cli ? cli.nombre : t.titular}</span>
                                                <span style={{ display: 'block', fontSize: 11.5, color: C.faint, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subtipo || t.detalle || t.tipo || 'Trabajo general'}</span>
                                            </span>
                                            <span><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, ...(t.esSRI ? { background: C.chipBlue, color: C.royal } : { background: '#FFFBEB', color: '#7A5A00' }) }}>{t.esSRI ? 'SRI' : 'Comercial'}</span></span>
                                            <span><span style={estadoPill(cfg)}><span style={dot(cfg.dot, 6)} />{cfg.label}</span></span>
                                            <span style={{ textAlign: 'right', fontSize: 12.5, color: C.muted }}>{t.abono > 0 ? formatCurrency(t.abono) : '—'}</span>
                                            <span style={{ textAlign: 'right', fontSize: 12.5, fontFamily: MONO, color: t.saldo > 0 ? C.ink : C.faint }}>{formatCurrency(t.saldo)}</span>
                                            <span style={{ textAlign: 'right', fontSize: 12, color: C.muted }}>{t.fechaEntrega ? formatDate(t.fechaEntrega) : '—'}</span>
                                        </div>
                                    );
                                })}
                                <div style={{ padding: '14px 20px', background: C.surfaceAlt, fontSize: 12.5, color: C.muted }}>
                                    Mostrando {filtered.length} de {(trabajos ?? []).length} órdenes
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {openTrabajo && (
                <OrderDrawer
                    trabajo={openTrabajo}
                    cliente={clientes.find(c => c.id === openTrabajo.clienteId) || null}
                    usuario={currentUser?.nombre || 'Sistema'}
                    rol={currentUser?.rol || 'Operador'}
                    onClose={() => setOpenOrderId(null)}
                />
            )}
        </div>
    );
};

export default TrabajosPage;
