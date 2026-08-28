import React, { useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { TrabajoEstado, User } from '../types';
import { formatCurrency } from '../utils';

/**
 * Panel Principal — Sistema "Marino & Oro" (tema claro).
 * Vista fiel a la sección `isPanel` de `Panel-Interno.dc.html` (Claude Design),
 * cableada con datos reales de Supabase. Ver design_manifest.md §2.
 */

// ── Paleta ──────────────────────────────────────────────────────────────────
const C = {
    ink: '#0A1140', royal: '#16309B', royalHover: '#0F2280', gold: '#FFC61A',
    danger: '#E70101', border: '#E4E8F4', borderStrong: '#D7DDF0',
    divider: '#EEF0F8', rowLine: '#F2F4FA', surfaceAlt: '#FAFBFF',
    faint: '#8A93AE', muted: '#6B7590', body: '#3C4763',
};
const mono = "'JetBrains Mono',monospace";
const display = "'Outfit',sans-serif";

type EstadoCfg = { label: string; color: string; bg: string; border: string; dot: string };
const ESTADO: Record<TrabajoEstado, EstadoCfg> = {
    [TrabajoEstado.PENDIENTE]: { label: 'Pendiente', color: '#B45309', bg: '#FFFBEB', border: '#F4E3A8', dot: '#FFC61A' },
    [TrabajoEstado.EN_DISENO]: { label: 'En Diseño', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD3FE', dot: '#8B5CF6' },
    [TrabajoEstado.PROCESO]:   { label: 'En Prensa', color: '#16309B', bg: '#EEF1FC', border: '#D7DDF0', dot: '#16309B' },
    [TrabajoEstado.VITRINA]:   { label: 'Listo',     color: '#1B6E3E', bg: '#F2F7F2', border: '#D8E8DC', dot: '#1B8A4B' },
    [TrabajoEstado.ENTREGADO]: { label: 'Entregado', color: '#5B6480', bg: '#F5F6FA', border: '#E4E8F4', dot: '#A6AFC8' },
};

const S = {
    eyebrow: { margin: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '.32em', textTransform: 'uppercase', color: C.faint } as React.CSSProperties,
    h1: { margin: '5px 0 0', fontFamily: display, fontSize: 27, fontWeight: 600, letterSpacing: '-.035em', color: C.ink } as React.CSSProperties,
    h2: { margin: 0, fontFamily: display, fontSize: 17, fontWeight: 600, letterSpacing: '-.03em', color: C.ink } as React.CSSProperties,
    card: { background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16 } as React.CSSProperties,
    colHead: { fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint } as React.CSSProperties,
    primaryBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: C.royal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
    outlineBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: '#fff', color: C.royal, border: `1px solid ${C.borderStrong}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
    softBtn: { padding: '8px 14px', background: '#F2F4FA', color: C.royal, border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
};

const dot = (bg: string, size = 8): React.CSSProperties => ({ width: size, height: size, borderRadius: 99, background: bg, flexShrink: 0, display: 'inline-block' });
const pill = (e: EstadoCfg): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 99,
    fontSize: 11.5, fontWeight: 600, background: e.bg, border: `1px solid ${e.border}`, color: e.color,
});

const fmtEntrega = (iso?: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    const hoy = new Date();
    const sameDay = d.toDateString() === hoy.toDateString();
    if (sameDay) return `hoy ${d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
};

const DashboardPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { trabajos, clientes, loading } = useData();
    const navigate = useNavigate();

    const activos = useMemo(
        () => (trabajos ?? []).filter(t => t.estado !== TrabajoEstado.ENTREGADO),
        [trabajos],
    );

    const kpis = useMemo(() => {
        if (!trabajos || !clientes) return null;
        const today = new Date().toISOString().slice(0, 10);
        const entregadosHoy = trabajos.filter(t => t.estado === TrabajoEstado.ENTREGADO && (t.fechaEntrega ?? '').startsWith(today));
        const porCobrar = activos.filter(t => t.saldo > 0);
        const enProduccion = activos.filter(t => t.estado === TrabajoEstado.PROCESO || t.estado === TrabajoEstado.EN_DISENO);
        return {
            activos: activos.length,
            enProduccion: enProduccion.length,
            porCobrar: porCobrar.length,
            totalCobrar: porCobrar.reduce((s, t) => s + t.saldo, 0),
            entregadosHoy: entregadosHoy.length,
            urgentes: activos.filter(t => t.prioridad === 'Urgente').length,
            totalClientes: clientes.length,
        };
    }, [trabajos, clientes, activos]);

    const recentOrders = useMemo(
        () => [...activos]
            .sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime())
            .slice(0, 8),
        [activos],
    );

    const carga = useMemo(() => {
        const order = [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO, TrabajoEstado.PROCESO, TrabajoEstado.VITRINA];
        const counts = order.map(e => ({ e, n: activos.filter(t => t.estado === e).length }));
        const max = Math.max(1, ...counts.map(c => c.n));
        return { counts, max };
    }, [activos]);

    const urgentes = useMemo(
        () => activos.filter(t => t.prioridad === 'Urgente').slice(0, 3),
        [activos],
    );

    if (loading || !kpis) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '2px solid #D7DDF0', borderTopColor: C.royal, borderRadius: 99, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                    <p style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando datos…</p>
                </div>
            </div>
        );
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    const firstName = (currentUser?.nombre ?? 'Marcelo').split(' ')[0];

    const kpiCards = [
        { label: 'Órdenes activas', value: String(kpis.activos), hint: `${kpis.enProduccion} en producción`, color: C.royal },
        { label: 'Urgentes', value: String(kpis.urgentes), hint: 'con entrega prioritaria', color: C.danger },
        { label: 'Con saldo', value: String(kpis.porCobrar), hint: `${formatCurrency(kpis.totalCobrar)} por cobrar`, color: C.gold },
        { label: 'Entregados hoy', value: String(kpis.entregadosHoy), hint: 'trabajos completados', color: '#1B8A4B' },
        { label: 'Clientes', value: String(kpis.totalClientes), hint: 'en el directorio', color: '#A6AFC8' },
    ];

    return (
        <div style={{ padding: 'clamp(18px,2.2vw,30px) clamp(16px,2.4vw,32px) 96px' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pi-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
            <div style={{ maxWidth: 1440, margin: '0 auto', animation: 'pi-rise .6s cubic-bezier(.2,.8,.2,1) both', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>{greeting}, {firstName}</p>
                        <h1 style={S.h1}>Panel de Control</h1>
                    </div>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                        <button style={S.primaryBtn} onClick={() => navigate('/nuevo')}>Nueva Orden</button>
                        <button style={S.outlineBtn} onClick={() => navigate('/kds')}>Ver Taller</button>
                        <button style={S.outlineBtn} onClick={() => navigate('/cuentas')}>Cobrar</button>
                    </div>
                </div>

                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                    {kpiCards.map(k => (
                        <div key={k.label} style={{ ...S.card, borderRadius: 14, padding: '17px 19px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint }}>{k.label}</span>
                                <span style={dot(k.color)} />
                            </div>
                            <div style={{ fontFamily: display, fontSize: 30, fontWeight: 600, letterSpacing: '-.04em', color: C.ink, marginTop: 8, lineHeight: 1 }}>{k.value}</div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{k.hint}</div>
                        </div>
                    ))}
                </div>

                {/* Main grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, alignItems: 'start' }}>

                    {/* Órdenes recientes */}
                    <div style={{ gridColumn: 'span 2', minWidth: 0, ...S.card, overflow: 'hidden' }}>
                        <div style={{ padding: '17px 20px 14px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <div>
                                <h2 style={S.h2}>Órdenes recientes</h2>
                                <p style={{ margin: '3px 0 0', fontSize: 12, color: C.faint }}>{kpis.activos} trabajos en curso</p>
                            </div>
                            <button style={S.softBtn} onClick={() => navigate('/trabajos')}>Ver todas →</button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <div style={{ minWidth: 640 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr .9fr .8fr .8fr', padding: '10px 20px', background: C.surfaceAlt, borderBottom: `1px solid ${C.divider}` }}>
                                    <span style={S.colHead}>Orden</span>
                                    <span style={S.colHead}>Cliente / trabajo</span>
                                    <span style={S.colHead}>Estado</span>
                                    <span style={{ ...S.colHead, textAlign: 'right' }}>Saldo</span>
                                    <span style={{ ...S.colHead, textAlign: 'right' }}>Entrega</span>
                                </div>
                                {recentOrders.length === 0 ? (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: C.faint, fontSize: 13 }}>
                                        Sin órdenes activas.{' '}
                                        <button style={{ ...S.softBtn, marginLeft: 8 }} onClick={() => navigate('/nuevo')}>Crear primera orden</button>
                                    </div>
                                ) : recentOrders.map(t => {
                                    const cfg = ESTADO[t.estado] ?? ESTADO[TrabajoEstado.PENDIENTE];
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => navigate(`/trabajos/${t.id}`)}
                                            style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr .9fr .8fr .8fr', alignItems: 'center', padding: '13px 20px', borderBottom: `1px solid ${C.rowLine}`, cursor: 'pointer' }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                                <span style={dot(t.prioridad === 'Urgente' ? C.danger : C.borderStrong, 6)} />
                                                <span style={{ fontSize: 12.5, fontFamily: mono, color: C.ink }}>#{String(t.orden).padStart(4, '0')}</span>
                                            </span>
                                            <span style={{ minWidth: 0 }}>
                                                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titular}</span>
                                                <span style={{ display: 'block', fontSize: 11.5, color: C.faint, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.tipo}{t.subtipo ? ` · ${t.subtipo}` : ''}</span>
                                            </span>
                                            <span><span style={pill(cfg)}><span style={dot(cfg.dot, 6)} />{cfg.label}</span></span>
                                            <span style={{ textAlign: 'right', fontSize: 12.5, fontFamily: mono, color: t.saldo > 0 ? C.ink : C.faint }}>{formatCurrency(t.saldo)}</span>
                                            <span style={{ textAlign: 'right', fontSize: 12, color: C.muted }}>{fmtEntrega(t.fechaEntrega)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

                        {/* Carga por estado */}
                        <div style={{ ...S.card, padding: '18px 20px' }}>
                            <h2 style={{ ...S.h2, fontSize: 16, marginBottom: 14 }}>Carga por estado</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                                {carga.counts.map(({ e, n }) => {
                                    const cfg = ESTADO[e];
                                    return (
                                        <div key={e}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: C.body }}>
                                                    <span style={dot(cfg.dot)} />{cfg.label}
                                                </span>
                                                <span style={{ fontSize: 12, fontFamily: mono, color: C.ink }}>{n}</span>
                                            </div>
                                            <div style={{ height: 6, background: '#F2F4FA', borderRadius: 99, overflow: 'hidden' }}>
                                                <div style={{ height: '100%', borderRadius: 99, background: cfg.dot, width: `${Math.round((n / carga.max) * 100)}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Urgentes hoy */}
                        <div style={{ background: C.ink, borderRadius: 16, padding: '18px 20px', color: '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="animate-pulse" style={dot(C.danger, 7)} />
                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: '#93A0C8' }}>Urgentes hoy</span>
                            </div>
                            <div style={{ fontFamily: display, fontSize: 30, fontWeight: 600, letterSpacing: '-.04em', marginTop: 8, lineHeight: 1 }}>{kpis.urgentes}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
                                {urgentes.length === 0 ? (
                                    <div style={{ paddingTop: 9, borderTop: '1px solid rgba(255,255,255,.12)', fontSize: 12, color: '#93A0C8' }}>Sin urgencias pendientes.</div>
                                ) : urgentes.map(t => {
                                    const cfg = ESTADO[t.estado] ?? ESTADO[TrabajoEstado.PENDIENTE];
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => navigate(`/trabajos/${t.id}`)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 9, borderTop: '1px solid rgba(255,255,255,.12)', cursor: 'pointer' }}
                                        >
                                            <span style={{ minWidth: 0 }}>
                                                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titular}</span>
                                                <span style={{ display: 'block', fontSize: 11, color: '#93A0C8', fontFamily: mono, marginTop: 1 }}>#{String(t.orden).padStart(4, '0')} · {fmtEntrega(t.fechaEntrega)}</span>
                                            </span>
                                            <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: C.gold }}>{cfg.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Por cobrar */}
                        <div style={{ ...S.card, padding: '18px 20px' }}>
                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: C.faint }}>Por cobrar</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontFamily: display, fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', color: C.royal }}>{formatCurrency(kpis.totalCobrar)}</span>
                                <span style={{ fontSize: 12, color: C.faint }}>en {kpis.porCobrar} órdenes</span>
                            </div>
                            <button style={{ ...S.softBtn, width: '100%', marginTop: 14, padding: 11, borderRadius: 10, fontSize: 13 }} onClick={() => navigate('/cuentas')}>
                                Ir a cuentas por cobrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
