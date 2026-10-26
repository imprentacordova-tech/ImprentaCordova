import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Cliente, Trabajo, TrabajoEstado, User } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../utils';
import { logActivity } from '../services/activityLogService';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomSheet } from '../components/BottomSheet';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, ESTADO, estadoCfg, dot, estadoPill, PANEL_KEYFRAMES } from '../components/panelTheme';
/**
 * La lógica del tablero (urgencia, tiempo en etapa, frescura y orden de columnas) vive en
 * `services/tallerBoard.ts`: son funciones puras y ahí sí se pueden testear.
 * Todas reciben `ahora` como parámetro, así el reloj de React mantiene los tiempos vivos.
 */
import { compararParaTaller, esUrgente, hace, tiempoEnEtapa, calcularSla, CHECKLIST_POR_FASE, type ChecklistItem } from '../services/tallerBoard';

const COLS = KANBAN_COLUMNS.filter(s => s !== TrabajoEstado.ENTREGADO);
const FLOW: TrabajoEstado[] = [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO, TrabajoEstado.PROCESO, TrabajoEstado.VITRINA, TrabajoEstado.ENTREGADO];

const FILTROS = ['Vista general', 'Prioridad crítica', '⚠️ En riesgo / Vencidos', 'En diseño', 'Producción activa'] as const;

// ── Tarjeta ─────────────────────────────────────────────────────────────────
const Card: React.FC<{
    t: Trabajo;
    cliente?: Cliente;
    ahora: number;
    onOpen: () => void;
    onAdvance: () => void;
}> = ({ t, cliente, ahora, onOpen, onAdvance }) => {
    const cfg = estadoCfg(t.estado);
    const sla = calcularSla(t, ahora);
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
                border: `1px solid ${sla.status === 'vencido' ? sla.border : C.border}`,
                borderLeft: `4px solid ${sla.status === 'vencido' ? sla.dot : cfg.dot}`,
                borderRadius: 11,
                padding: '12px 13px', cursor: 'pointer',
                background: sla.status === 'vencido' ? '#FFF5F5' : C.surface,
                transition: 'all .2s',
                boxShadow: hover ? '0 12px 22px -18px rgba(10,17,64,.5)' : 'none',
                transform: hover ? 'translateY(-2px)' : 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, fontFamily: MONO, color: C.faint }}>ORD-{String(t.orden).padStart(4, '0')}</span>
                {sla.status !== 'sin_fecha' ? (
                    <span style={{
                        padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        color: sla.color, background: sla.bg, border: `1px solid ${sla.border}`,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                        <span style={dot(sla.dot, 5)} />
                        {sla.label} · {sla.detalle}
                    </span>
                ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.faint }}>{tiempoEnEtapa(t, ahora)}</span>
                )}
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
    const { trabajos, clientes, updateTrabajoStatus, realtimeEstado, ultimaSync } = useData();
    const navigate = useNavigate();

    /* Reloj vivo: mantiene los "tiempo en etapa" honestos aunque no llegue ningún evento. */
    const [ahora, setAhora] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setAhora(Date.now()), 30000);
        return () => clearInterval(id);
    }, []);

    const [filterTerm, setFilterTerm] = useState('');
    const [activeTag, setActiveTag] = useState<string>('Vista general');
    const [draggedOver, setDraggedOver] = useState<TrabajoEstado | null>(null);
    const [mobileTab, setMobileTab] = useState<TrabajoEstado>(TrabajoEstado.PENDIENTE);
    const [selected, setSelected] = useState<Trabajo | null>(null);
    const [whatsappPrompt, setWhatsappPrompt] = useState<{ trabajo: Trabajo; cliente?: Cliente } | null>(null);
    const [checklistState, setChecklistState] = useState<Record<string, boolean>>({});

    // Cargar checklist de la orden seleccionada desde localStorage
    useEffect(() => {
        if (!selected) return;
        try {
            const raw = localStorage.getItem(`kds_chk_${selected.id}`);
            if (raw) setChecklistState(JSON.parse(raw));
            else setChecklistState({});
        } catch { setChecklistState({}); }
    }, [selected?.id]);

    const toggleCheckItem = (itemId: string) => {
        if (!selected) return;
        const next = { ...checklistState, [itemId]: !checklistState[itemId] };
        setChecklistState(next);
        try {
            localStorage.setItem(`kds_chk_${selected.id}`, JSON.stringify(next));
        } catch {}
    };

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
        if (activeTag === 'Prioridad crítica') f = f.filter(t => esUrgente(t, ahora));
        else if (activeTag === '⚠️ En riesgo / Vencidos') f = f.filter(t => ['vencido', 'alerta'].includes(calcularSla(t, ahora).status));
        else if (activeTag === 'En diseño') f = f.filter(t => [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO].includes(t.estado));
        else if (activeTag === 'Producción activa') f = f.filter(t => [TrabajoEstado.PROCESO, TrabajoEstado.VITRINA].includes(t.estado));
        return f;
    }, [trabajos, filterTerm, activeTag, clientes, ahora]);

    /**
     * Orden dentro de cada columna: primero lo urgente, después lo más atascado.
     *
     * Sin esto las tarjetas salían en el orden crudo de la tabla (fecha de entrada desc),
     * así que una orden urgente podía quedar enterrada debajo de veinte normales y una
     * orden frenada tres días no se distinguía de una recién creada. Eso es exactamente
     * el "atasco" que el taller no debe tener.
     */
    const columns = useMemo(() => {
        const cols = {} as Record<TrabajoEstado, Trabajo[]>;
        COLS.forEach(c => {
            cols[c] = filtered
                .filter(t => t.estado === c)
                .sort((a, b) => compararParaTaller(a, b, ahora));
        });
        return cols;
    }, [filtered, ahora]);

    const advance = useCallback(async (id: string, newStatus: TrabajoEstado) => {
        if (!currentUser) return;
        try {
            await updateTrabajoStatus(id, newStatus, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CAMBIO_ESTADO', `Orden ${id} → ${newStatus}`, 'Producción');

            // Disparador de notificación por WhatsApp si pasa a Vitrina
            if (newStatus === TrabajoEstado.VITRINA) {
                const target = (trabajos ?? []).find(t => t.id === id);
                const cli = target ? clientes.find(c => c.id === target.clienteId) : undefined;
                if (target && cli?.telefono?.length) {
                    setWhatsappPrompt({ trabajo: { ...target, estado: TrabajoEstado.VITRINA }, cliente: cli });
                }
            }
        } catch (err) { console.error('Error al cambiar estado:', err); }
    }, [updateTrabajoStatus, currentUser, trabajos, clientes]);

    const onDrop = useCallback(async (e: React.DragEvent, newStatus: TrabajoEstado) => {
        e.preventDefault();
        setDraggedOver(null);
        const id = e.dataTransfer.getData('trabajoId');
        if (id) await advance(id, newStatus);
    }, [advance]);

    const stats = [
        { label: 'Órdenes en taller', value: String(filtered.length), color: C.royal },
        { label: 'Prioridad crítica', value: String(filtered.filter(t => esUrgente(t, ahora)).length), color: C.danger },
        { label: 'Valor en taller', value: formatCurrency(filtered.reduce((a, t) => a + t.total, 0)), color: C.ink },
    ];

    /* Indicador real de frescura. Antes había un punto verde parpadeando siempre, sin
       relación con el estado del canal: si Realtime se caía, el taller seguía viendo
       "en vivo" sobre datos congelados. */
    const vivo = realtimeEstado === 'conectado';
    const caido = realtimeEstado === 'error';
    const estadoLive = {
        color: caido ? C.danger : vivo ? C.successDot : C.gold,
        texto: caido ? 'Sin tiempo real' : vivo ? 'En vivo' : 'Conectando…',
        nota: caido
            ? 'El tablero puede estar desactualizado. Recargá la página.'
            : `Datos ${hace(ultimaSync, ahora)}`,
    };

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div
                            title={estadoLive.nota}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', ...S.card, borderRadius: 10,
                                borderColor: caido ? C.dangerBorder : C.border,
                                background: caido ? C.dangerBg : C.surface,
                            }}
                        >
                            <span style={{ ...dot(estadoLive.color, 7), animation: vivo ? 'pi-blink 2s ease-in-out infinite' : 'none' }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: caido ? C.dangerText : C.body }}>{estadoLive.texto}</span>
                            <span style={{ fontSize: 11.5, color: caido ? C.dangerText : C.faint }}>· {estadoLive.nota}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 15px', ...S.card, borderRadius: 10 }}>
                            <span style={{ fontSize: 12, color: C.body }}>Toque una tarjeta para ver el detalle · arrástrela para cambiar de estado</span>
                        </div>
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
                    {/* tablet/escritorio: 4 columnas; celular: una por pestaña */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,210px),1fr))', gap: 14, alignItems: 'start' }}>
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
                                                    ahora={ahora}
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

                            {CHECKLIST_POR_FASE[selected.estado] && (
                                <div>
                                    <div style={{ ...S.fieldLabel, marginBottom: 8 }}>Control Operativo ({selected.estado})</div>
                                    <div style={{ ...S.card, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                                        {CHECKLIST_POR_FASE[selected.estado].map(chk => {
                                            const checked = !!checklistState[chk.id];
                                            return (
                                                <label key={chk.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: checked ? C.success : C.ink }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleCheckItem(chk.id)}
                                                        style={{ width: 16, height: 16, accentColor: C.royal, cursor: 'pointer' }}
                                                    />
                                                    <span style={{ textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.75 : 1 }}>
                                                        {chk.label}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

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
                                            window.open(generateWhatsAppLink(tel, msg), '_blank');
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

            {/* Prompt modal para notificación inmediata de WhatsApp al pasar a Vitrina */}
            {whatsappPrompt && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div onClick={() => setWhatsappPrompt(null)} style={{ position: 'absolute', inset: 0, background: C.scrim, backdropFilter: 'blur(2px)' }} />
                    <div style={{ position: 'relative', width: 'min(480px, 100%)', background: '#fff', borderRadius: 16, padding: '24px 26px', boxShadow: '0 25px 50px -12px rgba(10,17,64,.3)', zIndex: 1, border: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ width: 44, height: 44, borderRadius: 12, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                                📱
                            </span>
                            <div>
                                <h3 style={{ ...S.h2, fontSize: 18 }}>¡Orden #{String(whatsappPrompt.trabajo.orden).padStart(4, '0')} en Vitrina!</h3>
                                <p style={{ margin: 0, fontSize: 12, color: C.faint }}>Listo para entrega · Notificación directa</p>
                            </div>
                        </div>
                        <p style={{ fontSize: 13, color: C.body, marginTop: 14, lineHeight: 1.5 }}>
                            ¿Deseas enviar un WhatsApp a <strong>{whatsappPrompt.cliente?.nombre || whatsappPrompt.trabajo.titular}</strong> avisando que su pedido ya está listo para retirar?
                        </p>
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.divider}`, fontSize: 12, color: C.muted, marginTop: 10, fontStyle: 'italic' }}>
                            "Hola {whatsappPrompt.cliente?.nombre || whatsappPrompt.trabajo.titular}, Imprenta Córdova le informa que su pedido #{whatsappPrompt.trabajo.orden} está listo para retirar. {whatsappPrompt.trabajo.saldo > 0 ? `Saldo pendiente: ${formatCurrency(whatsappPrompt.trabajo.saldo)}.` : 'Su pedido se encuentra pagado.'}"
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                            <button style={S.softBtn} onClick={() => setWhatsappPrompt(null)}>Omitir</button>
                            <button
                                style={{ ...S.primaryBtn, background: '#16A34A', display: 'flex', alignItems: 'center', gap: 6 }}
                                onClick={() => {
                                    const tel = whatsappPrompt.cliente?.telefono?.[0] || '';
                                    const nom = whatsappPrompt.cliente?.nombre || whatsappPrompt.trabajo.titular;
                                    const msg = `Hola ${nom}, Imprenta Córdova le informa que su pedido #${whatsappPrompt.trabajo.orden} (${whatsappPrompt.trabajo.subtipo || whatsappPrompt.trabajo.tipo}) está listo para retirar en nuestro local. ${whatsappPrompt.trabajo.saldo > 0 ? `Saldo pendiente al retirar: ${formatCurrency(whatsappPrompt.trabajo.saldo)}.` : 'Su pedido se encuentra cancelado.'} Horario: Lunes a Viernes 08:30 a 18:30.`;
                                    window.open(generateWhatsAppLink(tel, msg), '_blank');
                                    setWhatsappPrompt(null);
                                }}
                            >
                                Enviar WhatsApp ahora
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KDSPage;
