import React, { useState, useMemo, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Cliente, Trabajo, TrabajoEstado, User } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { formatCurrency, formatDate } from '../utils';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '../components/BottomSheet';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, ESTADO, estadoCfg, dot, estadoPill, PANEL_KEYFRAMES } from '../components/panelTheme';

const COLS = KANBAN_COLUMNS.filter(s => s !== TrabajoEstado.ENTREGADO);
const FLOW: TrabajoEstado[] = [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO, TrabajoEstado.PROCESO, TrabajoEstado.VITRINA, TrabajoEstado.ENTREGADO];

const esUrgente = (t: Trabajo): boolean => {
    if (t.prioridad === 'Urgente') return true;
    const target = t.fechaEntrega || t.fechaVencimiento;
    if (!target) return false;
    const diff = (new Date(target).getTime() - Date.now()) / 86400000;
    return diff < 1;
};

const tiempoEnEtapa = (t: Trabajo): string => {
    const base = t.updated_at || t.fechaEntrada;
    if (!base) return '—';
    const diff = Date.now() - new Date(base).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h} h ${m} m` : `${m} m`;
};

const FILTROS = ['Vista general', 'Prioridad crítica', 'En diseño', 'Producción activa'] as const;

// ── Tarjeta ─────────────────────────────────────────────────────────────────
const Card: React.FC<{
    t: Trabajo;
    cliente?: Cliente;
    onOpen: () => void;
    onAdvance: () => void;
}> = ({ t, cliente, onOpen, onAdvance }) => {
    const cfg = estadoCfg(t.estado);
    const urg = esUrgente(t);
    const next = FLOW[FLOW.indexOf(t.estado) + 1];
    const [hover, setHover] = useState(false);
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            draggable
            onDragStart={(e: any) => { if (e.dataTransfer) e.dataTransfer.setData('trabajoId', t.id); }}
            onClick={onOpen}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                border: `1px solid ${C.border}`, borderLeft: `3px solid ${cfg.dot}`, borderRadius: 11,
                padding: '12px 13px', cursor: 'pointer', background: C.surface, transition: 'all .2s',
                boxShadow: hover ? '0 12px 22px -18px rgba(10,17,64,.5)' : 'none',
                transform: hover ? 'translateY(-2px)' : 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 11.5, fontFamily: MONO, color: C.faint }}>ORD-{String(t.orden).padStart(4, '0')}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: urg ? C.danger : C.faint }}>{urg ? 'urgente' : tiempoEnEtapa(t)}</span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, marginTop: 6 }}>{cliente?.nombre || 'Consumidor Final'}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>
                {t.tipo}{t.subtipo ? ` · ${(t.subtipo || '').split('|')[0]}` : ''} · {t.cantidad} u.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 9, paddingTop: 9, borderTop: `1px solid ${C.rowLine}` }}>
                <span style={{ fontSize: 11, color: t.saldo > 0 ? C.ink : C.success, fontFamily: MONO }}>
                    {t.saldo > 0 ? formatCurrency(t.saldo) : 'pagado'}
                </span>
                {next && (
                    <button
                        onClick={(e) => { e.stopPropagation(); if (navigator.vibrate) navigator.vibrate(20); onAdvance(); }}
                        style={{ ...S.softBtn, padding: '6px 10px', fontSize: 11.5 }}
                    >
                        Avanzar → {estadoCfg(next).label}
                    </button>
                )}
            </div>
        </motion.div>
    );
};

const KDSPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { trabajos, clientes, updateTrabajoStatus } = useData();
    const navigate = useNavigate();

    const [filterTerm, setFilterTerm] = useState('');
    const [activeTag, setActiveTag] = useState<string>('Vista general');
    const [draggedOver, setDraggedOver] = useState<TrabajoEstado | null>(null);
    const [mobileTab, setMobileTab] = useState<TrabajoEstado>(TrabajoEstado.PENDIENTE);
    const [selected, setSelected] = useState<Trabajo | null>(null);

    const filtered = useMemo(() => {
        let f = (trabajos ?? []).filter(t => t.estado !== TrabajoEstado.ENTREGADO);
        if (filterTerm) {
            const q = filterTerm.toLowerCase();
            f = f.filter(t =>
                (t.subtipo || '').toLowerCase().includes(q) ||
                String(t.orden).includes(q) ||
                (clientes.find(c => c.id === t.clienteId)?.nombre || '').toLowerCase().includes(q),
            );
        }
        if (activeTag === 'Prioridad crítica') f = f.filter(esUrgente);
        else if (activeTag === 'En diseño') f = f.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado));
        else if (activeTag === 'Producción activa') f = f.filter(t => [TrabajoEstado.PROCESO, TrabajoEstado.VITRINA].includes(t.estado));
        return f;
    }, [trabajos, filterTerm, activeTag, clientes]);

    const columns = useMemo(() => {
        const cols = {} as Record<TrabajoEstado, Trabajo[]>;
        COLS.forEach(c => { cols[c] = filtered.filter(t => t.estado === c); });
        return cols;
    }, [filtered]);

    const advance = useCallback(async (id: string, newStatus: TrabajoEstado) => {
        if (!currentUser) return;
        try {
            await updateTrabajoStatus(id, newStatus, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CAMBIO_ESTADO', `Orden ${id} → ${newStatus}`, 'Producción');
        } catch (err) { console.error('Error al cambiar estado:', err); }
    }, [updateTrabajoStatus, currentUser]);

    const onDrop = useCallback(async (e: React.DragEvent, newStatus: TrabajoEstado) => {
        e.preventDefault();
        setDraggedOver(null);
        const id = e.dataTransfer.getData('trabajoId');
        if (id) await advance(id, newStatus);
    }, [advance]);

    const stats = [
        { label: 'Órdenes en taller', value: String(filtered.length), color: C.royal },
        { label: 'Prioridad crítica', value: String(filtered.filter(esUrgente).length), color: C.danger },
        { label: 'Valor en taller', value: formatCurrency(filtered.reduce((a, t) => a + t.total, 0)), color: C.ink },
    ];

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Monitor de Taller · Imprenta Córdova" description="Tablero de producción en tiempo real." />
            <div style={{ ...S.wrap, gap: 18 }}>

                {/* Cabecera */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Taller</p>
                        <h1 style={S.h1}>Monitor de Taller</h1>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 15px', ...S.card, borderRadius: 10 }}>
                        <span style={{ ...dot(C.successDot, 7), animation: 'pi-blink 2s ease-in-out infinite' }} />
                        <span style={{ fontSize: 12, color: C.body }}>Toque una tarjeta para ver el detalle · arrástrela para cambiar de estado</span>
                    </div>
                </div>

                {/* Stats + filtros */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {stats.map(s => (
                        <div key={s.label} style={{ ...S.card, borderRadius: 14, padding: '14px 18px', minWidth: 190, flex: 1 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint }}>{s.label}</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, letterSpacing: '-.04em', color: s.color, marginTop: 6 }}>{s.value}</div>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {FILTROS.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveTag(f)}
                            style={{
                                padding: '7px 13px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                ...(activeTag === f ? { background: C.royal, color: '#fff', border: `1px solid ${C.royal}` } : { background: '#fff', color: C.body, border: `1px solid ${C.borderStrong}` }),
                            }}
                        >{f}</button>
                    ))}
                    <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 9, padding: '7px 13px', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 99 }}>
                        <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                        <input
                            value={filterTerm}
                            onChange={e => setFilterTerm(e.target.value)}
                            placeholder="Rastrear orden o cliente…"
                            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: C.ink, fontFamily: 'inherit' }}
                        />
                    </div>
                </div>

                {/* Selector móvil */}
                <div className="lg:hidden" style={{ display: 'flex', gap: 4, background: C.softGray, padding: 4, borderRadius: 12, overflowX: 'auto' }}>
                    {COLS.map(status => {
                        const on = mobileTab === status;
                        return (
                            <button
                                key={status}
                                onClick={() => setMobileTab(status)}
                                style={{
                                    flex: '1 0 auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 9, border: 'none',
                                    fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                                    background: on ? '#fff' : 'transparent', color: on ? C.royal : C.faint,
                                }}
                            >
                                {estadoCfg(status).label}
                                <span style={{ fontFamily: MONO, fontSize: 10 }}>{columns[status]?.length || 0}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tablero */}
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 14, alignItems: 'start' }}>
                        {COLS.map(status => {
                            const cfg = estadoCfg(status);
                            const cards = columns[status] || [];
                            const visibleMobile = mobileTab === status;
                            return (
                                <div
                                    key={status}
                                    className={visibleMobile ? '' : 'hidden lg:block'}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnter={() => setDraggedOver(status)}
                                    onDrop={(e) => onDrop(e, status)}
                                    style={{
                                        ...S.card, overflow: 'hidden',
                                        outline: draggedOver === status ? `2px solid ${C.royal}` : 'none',
                                    }}
                                >
                                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: cfg.bg }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: cfg.color }}>
                                            <span style={dot(cfg.dot)} />{cfg.label}
                                        </span>
                                        <span style={{ fontSize: 12, fontFamily: MONO, color: cfg.color }}>{cards.length}</span>
                                    </div>
                                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 120 }}>
                                        <AnimatePresence>
                                            {cards.map(t => (
                                                <Card
                                                    key={t.id}
                                                    t={t}
                                                    cliente={clientes.find(c => c.id === t.clienteId)}
                                                    onOpen={() => setSelected(t)}
                                                    onAdvance={() => { const n = FLOW[FLOW.indexOf(t.estado) + 1]; if (n) advance(t.id, n); }}
                                                />
                                            ))}
                                        </AnimatePresence>
                                        {cards.length === 0 && (
                                            <div style={{ padding: '32px 8px', textAlign: 'center', color: C.ghost, fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.14em' }}>
                                                Sin trabajos
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Detalle */}
            <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title={`ORD-${selected ? String(selected.orden).padStart(4, '0') : ''}`}>
                {selected && (() => {
                    const cli = clientes.find(c => c.id === selected.clienteId);
                    const cfg = estadoCfg(selected.estado);
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '4px 0 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <span style={{ width: 52, height: 52, borderRadius: 14, background: C.chipBlue, color: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: 22 }}>
                                    {(cli?.nombre || 'C').charAt(0).toUpperCase()}
                                </span>
                                <div>
                                    <h3 style={{ ...S.h2, fontSize: 20 }}>{cli?.nombre || 'Consumidor Final'}</h3>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                                        <span style={estadoPill(cfg)}><span style={dot(cfg.dot, 6)} />{cfg.label}</span>
                                        {selected.esSRI && <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, background: C.chipBlue, color: C.royal }}>SRI</span>}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                                <div style={{ ...S.card, padding: '14px 16px' }}>
                                    <div style={S.colHead}>Servicio</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 4 }}>{selected.subtipo || selected.tipo}</div>
                                </div>
                                <div style={{ ...S.card, padding: '14px 16px' }}>
                                    <div style={S.colHead}>Cantidad</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 4 }}>{selected.cantidad} unidades</div>
                                </div>
                                {selected.tamano && (
                                    <div style={{ ...S.card, padding: '14px 16px' }}>
                                        <div style={S.colHead}>Formato</div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 4 }}>{selected.tamano}</div>
                                    </div>
                                )}
                                {(selected.fechaEntrega || selected.fechaVencimiento) && (
                                    <div style={{ ...S.card, padding: '14px 16px' }}>
                                        <div style={S.colHead}>Entrega</div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 4 }}>{formatDate((selected.fechaEntrega || selected.fechaVencimiento)!)}</div>
                                    </div>
                                )}
                            </div>

                            <div style={{ ...S.accentCard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: '#93A0C8' }}>Saldo pendiente</span>
                                <span style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, letterSpacing: '-.04em', color: selected.saldo > 0 ? C.gold : '#7FD3A6' }}>
                                    {formatCurrency(selected.saldo)}
                                </span>
                            </div>

                            <div>
                                <div style={{ ...S.fieldLabel, marginBottom: 8 }}>Especificaciones</div>
                                <div style={{ ...S.card, padding: 16, fontSize: 13.5, color: C.body, lineHeight: 1.6, minHeight: 90 }}>
                                    {selected.observaciones || 'Sin especificaciones técnicas adicionales.'}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
                                {selected.esSRI && (
                                    <button style={S.outlineBtn} onClick={() => { const id = selected.id; setSelected(null); navigate(`/solicitud-impresion/${id}`); }}>
                                        Imprimir solicitud A4
                                    </button>
                                )}
                                {cli?.telefono?.[0] && (
                                    <button
                                        style={{ ...S.primaryBtn, background: '#1B6E3E' }}
                                        onClick={() => {
                                            const tel = cli.telefono[0];
                                            const msg = `Hola ${cli.nombre}, le escribimos de Imprenta Córdova sobre su orden ORD-${String(selected.orden).padStart(4, '0')}.`;
                                            window.open(`https://wa.me/593${tel.slice(-9)}?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                    >
                                        Avisar por WhatsApp
                                    </button>
                                )}
                                <button style={S.softBtn} onClick={() => setSelected(null)}>Cerrar</button>
                            </div>
                        </div>
                    );
                })()}
            </BottomSheet>
        </div>
    );
};

export default KDSPage;
