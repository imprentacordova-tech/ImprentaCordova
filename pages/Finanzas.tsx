import React, { useState, useMemo } from 'react';
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from 'recharts';
import { useData } from '../contexts/DataContext';
import { FinancialProjection, User } from '../types';
import { formatCurrency } from '../utils';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/activityLogService';
import { generateFinancialProjection } from '../services/geminiService';
import { SEO } from '../components/SEO';
import { C, S, DISPLAY, PANEL_KEYFRAMES, PageLoaderLite } from '../components/panelTheme';

const tooltipStyle: React.CSSProperties = {
    background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12,
    fontWeight: 600, color: C.ink, padding: '10px 14px', boxShadow: '0 14px 28px -18px rgba(10,17,64,.4)',
};

const FinanzasPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { trabajos, loading } = useData();
    const [analyzing, setAnalyzing] = useState(false);
    const [aiProjection, setAiProjection] = useState<FinancialProjection | null>(null);

    const historicalSales = useMemo(() => {
        const m = new Map<string, number>();
        (trabajos ?? []).forEach(t => {
            const d = (t.fechaEntrada || '').split('T')[0];
            if (d) m.set(d, (m.get(d) || 0) + (t.abono || 0));
        });
        return Array.from(m.entries()).map(([date, sales]) => ({ date, sales })).sort((a, b) => a.date.localeCompare(b.date));
    }, [trabajos]);

    const totalRevenue = useMemo(() => historicalSales.reduce((a, c) => a + c.sales, 0), [historicalSales]);
    const avgSale = useMemo(() => totalRevenue / (historicalSales.length || 1), [totalRevenue, historicalSales]);
    const peakSale = useMemo(() => Math.max(0, ...historicalSales.map(s => s.sales)), [historicalSales]);

    const handleAIAnalysis = async () => {
        setAnalyzing(true);
        try {
            const projection = await generateFinancialProjection(historicalSales.slice(-60));
            setAiProjection(projection);
            logActivity(currentUser.nombre, currentUser.rol, 'FINANZAS_ANALIZED', 'Análisis financiero con IA', 'Finanzas');
        } catch (e) { console.error('Análisis IA falló:', e); }
        finally { setAnalyzing(false); }
    };

    if (loading) return <PageLoaderLite label="Sincronizando finanzas…" />;

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Flujo de Caja · Imprenta Córdova" />
            <div style={S.wrap}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Finanzas</p>
                        <h1 style={S.h1}>Flujo de Caja</h1>
                        <p style={S.lead}>Recaudación histórica por abonos y proyección con inteligencia artificial.</p>
                    </div>
                    <button style={S.primaryBtn} disabled={analyzing} onClick={handleAIAnalysis}>{analyzing ? 'Consultando IA…' : 'Simulación IA'}</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,150px),1fr))', gap: 14 }}>
                    {[
                        { l: 'Ingresos consolidados', v: formatCurrency(totalRevenue), c: C.royal },
                        { l: 'Ticket promedio', v: formatCurrency(avgSale), c: C.ink },
                        { l: 'Máximo diario', v: formatCurrency(peakSale), c: C.success },
                        { l: 'Registros', v: String(historicalSales.length), c: C.faint },
                    ].map(k => (
                        <div key={k.l} style={{ ...S.card, borderRadius: 14, padding: '17px 19px' }}>
                            <div style={S.colHead}>{k.l}</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, letterSpacing: '-.04em', color: k.c, marginTop: 8, lineHeight: 1 }}>{k.v}</div>
                        </div>
                    ))}
                </div>

                {aiProjection && (
                    <div style={{ ...S.card, padding: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                            <h2 style={S.h2}>Proyección estratégica</h2>
                            <button style={S.softBtn} onClick={() => setAiProjection(null)}>Cerrar</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
                            <div style={{ gridColumn: 'span 2', minWidth: 0, height: 320, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={aiProjection.forecast}>
                                        <defs>
                                            <linearGradient id="fin-fill" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={C.royal} stopOpacity={0.18} />
                                                <stop offset="95%" stopColor={C.royal} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.rowLine} />
                                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} width={48} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Area type="monotone" dataKey="sales" stroke={C.royal} strokeWidth={3} fill="url(#fin-fill)" name="Proyección" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={{ ...S.card, background: C.bg, padding: 16 }}>
                                    <div style={S.colHead}>Días de bajo tráfico</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                        {aiProjection.lowTrafficDays.map(d => (
                                            <span key={d} style={{ padding: '4px 10px', background: '#fff', border: `1px solid ${C.borderStrong}`, borderRadius: 99, fontSize: 11.5, fontWeight: 600, color: C.body }}>{d}</span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ ...S.accentCard }}>
                                    <div style={{ ...S.colHead, color: '#93A0C8' }}>Recomendación</div>
                                    <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.6 }}>“{aiProjection.suggestion}”</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ ...S.card, padding: 20 }}>
                    <h2 style={{ ...S.h2, fontSize: 16, marginBottom: 14 }}>Flujo de recaudación</h2>
                    <div style={{ height: 340, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historicalSales}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.rowLine} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.faint }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Line type="stepAfter" dataKey="sales" stroke={C.royal} strokeWidth={3}
                                    dot={{ r: 3, fill: C.royal, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff', stroke: C.royal, strokeWidth: 2 }} name="Abonos" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanzasPage;
