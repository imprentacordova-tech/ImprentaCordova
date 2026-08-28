import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trabajo, TrabajoEstado } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';

/**
 * Rastreo público de pedidos — fiel a `Publica-B-Tracking.dc.html` (Claude Design).
 * Tema azul/blanco. Conserva la búsqueda real en Supabase (orden / RUC / id),
 * aprobación de arte y enlace de liquidación por WhatsApp.
 */

const C = {
    ink: '#0A1140', royal: '#16309B', royalHover: '#0F2280', border: '#E4E8F4', borderStrong: '#D7DDF0',
    divider: '#EEF0F8', rowLine: '#F2F4FA', body: '#3C4763', muted: '#5B6480', faint: '#8A93AE',
    bg: '#F7F9FF', chip: '#EEF1FC', soft: '#F2F4FA', success: '#1B6E3E', gold: '#FFC61A',
};
const DISPLAY = "'Outfit',sans-serif";
const MONO = "'JetBrains Mono',monospace";
const WA_NUM = '593993083943';

const ESTADO_LABEL: Record<TrabajoEstado, string> = {
    [TrabajoEstado.PENDIENTE]: 'Pendiente',
    [TrabajoEstado.EN_DISENO]: 'En diseño',
    [TrabajoEstado.PROCESO]: 'En prensa',
    [TrabajoEstado.VITRINA]: 'Listo para retiro',
    [TrabajoEstado.ENTREGADO]: 'Entregado',
};

const STAGES: { estado: TrabajoEstado; label: string; detail: string }[] = [
    { estado: TrabajoEstado.PENDIENTE, label: 'Orden recibida', detail: 'Registrada y validada en el taller' },
    { estado: TrabajoEstado.EN_DISENO, label: 'Diseño y prueba', detail: 'Diagramación y prueba digital para su aprobación' },
    { estado: TrabajoEstado.PROCESO, label: 'En prensa', detail: 'Impresión, numeración y control de color' },
    { estado: TrabajoEstado.VITRINA, label: 'Listo para retiro', detail: 'Guillotinado, empaque y aviso por WhatsApp' },
    { estado: TrabajoEstado.ENTREGADO, label: 'Entregado', detail: 'Trabajo retirado y saldo liquidado' },
];
const ORDER = STAGES.map(s => s.estado);

const TrackingPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [foundJobs, setFoundJobs] = useState<Trabajo[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    const currentJob = useMemo(() => foundJobs.find(j => j.id === selectedJobId) || foundJobs[0], [foundJobs, selectedJobId]);

    const doSearch = async (query: string) => {
        const clean = query.trim();
        if (!clean) return;
        const numeric = clean.replace(/[-\s]/g, '');
        setSearching(true);
        setError('');
        setFoundJobs([]);
        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
            const isOrderNum = /^\d+$/.test(numeric) && numeric.length < 10;

            if (isUUID) {
                const { data } = await supabase.from('trabajos').select('*').eq('id', clean);
                if (data?.length) { setFoundJobs(data as any); setSelectedJobId(data[0].id); setSearching(false); return; }
            }
            if (isOrderNum || /ord/i.test(clean)) {
                const n = parseInt(numeric.replace(/\D/g, ''), 10);
                if (n) {
                    const { data } = await supabase.from('trabajos').select('*').eq('orden', n);
                    if (data?.length) { setFoundJobs(data as any); setSelectedJobId(data[0].id); setSearching(false); return; }
                }
            }
            const { data: clients } = await supabase.from('clientes').select('id')
                .or(`nombre.ilike.%${clean}%,cedula.eq.${numeric},ruc.eq.${numeric}`);
            if (clients?.length) {
                const ids = clients.map(c => c.id);
                const { data: jobs } = await supabase.from('trabajos').select('*').in('cliente_id', ids).order('orden', { ascending: false });
                if (jobs?.length) { setFoundJobs(jobs as any); setSelectedJobId(jobs[0].id); }
                else setError('No encontramos trabajos con esa identificación.');
            } else {
                setError('No reconocemos ese número de orden ni identificación.');
            }
        } catch (err) {
            console.error(err);
            setError('No pudimos conectar. Intente de nuevo en un momento.');
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const q = searchParams.get('q');
        if (q) { setSearchQuery(q); doSearch(q); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleAprobarArte = async (trabajoId: string) => {
        if (!window.confirm('¿Confirma que el diseño está correcto para impresión?')) return;
        try {
            const { error } = await supabase.from('trabajos').update({ arte_aprobado: true }).eq('id', trabajoId);
            if (error) throw error;
            setFoundJobs(prev => prev.map(j => j.id === trabajoId ? { ...j, arteAprobado: true } : j));
        } catch { alert('No se pudo registrar la aprobación.'); }
    };

    const waLink = (msg: string) => `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`;

    const idx = currentJob ? ORDER.indexOf(currentJob.estado) : -1;

    return (
        <div style={{ background: '#fff', color: C.ink, fontFamily: "'Inter',system-ui,sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SEO title="Rastrear pedido · Imprenta Córdova" description="Consulte el estado de su trabajo con el número de orden o su RUC." />
            <PublicNavbar />

            <section style={{ borderBottom: `1px solid ${C.divider}`, background: 'linear-gradient(180deg,#F7F9FF,#fff)' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(40px,5vw,64px) clamp(16px,3vw,44px) clamp(32px,4vw,48px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.faint }}>
                        <a href="/" style={{ color: C.faint, textDecoration: 'none' }}>Inicio</a><span>/</span><span style={{ color: C.body }}>Rastrear pedido</span>
                    </div>
                    <h1 style={{ margin: '14px 0 0', fontFamily: DISPLAY, fontSize: 'clamp(32px,3.6vw,46px)', fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1.08, color: C.ink }}>¿En qué va su trabajo?</h1>
                    <p style={{ margin: '12px 0 24px', maxWidth: '54ch', fontSize: 16.5, lineHeight: 1.65, color: '#4A5470' }}>
                        Ingrese el número de orden que recibió por WhatsApp, o su RUC si es una renovación.
                    </p>
                    <form onSubmit={e => { e.preventDefault(); doSearch(searchQuery); }} style={{ display: 'flex', gap: 10, maxWidth: '30rem', flexWrap: 'wrap' }}>
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ORD-4821 o 0701234567001"
                            style={{ flex: 1, minWidth: 220, padding: '15px 17px', background: '#fff', border: `1px solid ${C.borderStrong}`, borderRadius: 12, fontSize: 15, color: C.ink, outline: 'none', fontFamily: MONO }} />
                        <button type="submit" disabled={searching}
                            style={{ padding: '15px 26px', background: C.royal, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: searching ? 0.6 : 1 }}>
                            {searching ? 'Buscando…' : 'Consultar'}
                        </button>
                    </form>
                    {error && <p style={{ margin: '14px 0 0', fontSize: 14, color: '#B91C1C', fontWeight: 600 }}>{error}</p>}
                </div>
            </section>

            <section style={{ flex: 1, maxWidth: 1320, margin: '0 auto', width: '100%', padding: 'clamp(32px,4vw,52px) clamp(16px,3vw,44px) clamp(56px,7vw,88px)' }}>
                {!currentJob ? (
                    <div style={{ padding: '56px 24px', textAlign: 'center', border: `1px dashed ${C.borderStrong}`, borderRadius: 18, color: C.muted }}>
                        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: C.ink }}>Consulte una orden</div>
                        <p style={{ margin: '8px 0 0', fontSize: 14.5 }}>Escriba arriba su número de orden o RUC para ver el avance.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 24, alignItems: 'start' }}>

                        {/* Timeline */}
                        <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
                            <div style={{ padding: '22px 26px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint }}>Orden</div>
                                    <div style={{ fontFamily: MONO, fontSize: 20, color: C.ink, marginTop: 5 }}>ORD-{String(currentJob.orden).padStart(4, '0')}</div>
                                    <div style={{ fontSize: 13.5, color: C.muted, marginTop: 5 }}>{currentJob.titular} · recibida {formatDate(currentJob.fechaEntrada)}</div>
                                </div>
                                <span style={{ padding: '8px 14px', background: C.chip, color: C.royal, borderRadius: 99, fontSize: 13, fontWeight: 700 }}>{ESTADO_LABEL[currentJob.estado]}</span>
                            </div>

                            <div style={{ padding: '24px 26px 8px' }}>
                                {STAGES.map((s, i) => {
                                    const done = i < idx;
                                    const current = i === idx;
                                    const last = i === STAGES.length - 1;
                                    return (
                                        <div key={s.estado} style={{ display: 'grid', gridTemplateColumns: '22px 1fr auto', gap: 16, alignItems: 'start' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                                                <span style={{
                                                    width: 12, height: 12, borderRadius: 99, flexShrink: 0, marginTop: 4,
                                                    ...(done ? { background: C.royal } : current ? { background: C.gold, boxShadow: '0 0 0 4px rgba(255,198,26,.28)' } : { background: '#fff', border: `1.5px solid ${C.borderStrong}` }),
                                                }} />
                                                {!last && <span style={{ flex: 1, width: 2, background: done ? C.royal : C.border, margin: '4px 0' }} />}
                                            </div>
                                            <div style={{ paddingBottom: 22 }}>
                                                <div style={{ fontSize: 15, fontWeight: 600, color: done ? C.ink : current ? C.royal : C.faint }}>{s.label}</div>
                                                <div style={{ fontSize: 13, lineHeight: 1.6, color: C.muted, marginTop: 3 }}>{s.detail}</div>
                                            </div>
                                            <div style={{ fontSize: 12, color: C.faint, fontFamily: MONO, paddingTop: 2 }}>{current ? 'ahora' : done ? '✓' : '—'}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {currentJob.estado === TrabajoEstado.EN_DISENO && !currentJob.arteAprobado && (
                                <div style={{ padding: '16px 26px', background: '#FFFBEB', borderTop: `1px solid #F4E3A8`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 13.5, color: '#7A5A00' }}>Su prueba digital está lista. Apruébela para que entre a prensa.</span>
                                    <button onClick={() => handleAprobarArte(currentJob.id)} style={{ padding: '10px 16px', background: C.royal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Aprobar diseño</button>
                                </div>
                            )}

                            <div style={{ padding: '18px 26px', background: C.bg, borderTop: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 13.5, color: '#4A5470' }}>Le avisamos por WhatsApp cuando esté listo para retirar.</span>
                                <a href={waLink(`Hola, quiero preguntar por la orden ORD-${String(currentJob.orden).padStart(4, '0')}.`)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, fontWeight: 600, color: C.royal, textDecoration: 'none' }}>Preguntar por esta orden →</a>
                            </div>
                        </div>

                        {/* Columna derecha */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
                                <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.divider}` }}>
                                    <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint }}>Detalle del trabajo</div>
                                </div>
                                <div style={{ padding: '15px 24px', borderBottom: `1px solid ${C.rowLine}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                                    <span>
                                        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: C.ink }}>{currentJob.tipo}</span>
                                        <span style={{ display: 'block', fontSize: 12.5, color: C.muted, marginTop: 3 }}>{currentJob.subtipo || `${currentJob.cantidad} unidades`}</span>
                                    </span>
                                    <span style={{ fontSize: 14, fontFamily: MONO, color: C.ink, whiteSpace: 'nowrap' }}>{formatCurrency(currentJob.total)}</span>
                                </div>
                                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg }}>
                                    <span style={{ fontSize: 11.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint }}>Abono recibido</span>
                                    <span style={{ fontSize: 14, fontFamily: MONO, color: C.success }}>{formatCurrency(currentJob.abono)}</span>
                                </div>
                                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.divider}` }}>
                                    <span style={{ fontSize: 11.5, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint }}>Saldo al retirar</span>
                                    <span style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: C.royal }}>{formatCurrency(currentJob.saldo)}</span>
                                </div>
                                {currentJob.saldo > 0 && (
                                    <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.divider}` }}>
                                        <a href={waLink(`*ORDEN ORD-${String(currentJob.orden).padStart(4, '0')}*\nSaldo por liquidar: ${formatCurrency(currentJob.saldo)}`)} target="_blank" rel="noopener noreferrer"
                                            style={{ display: 'block', textAlign: 'center', padding: 12, background: C.soft, color: C.royal, borderRadius: 10, fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>
                                            Coordinar pago por WhatsApp
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, padding: '22px 24px' }}>
                                <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint }}>Retiro en el taller</div>
                                <div style={{ fontSize: 14.5, lineHeight: 1.7, color: C.body, marginTop: 10 }}>Av. Las Palmeras y Calle 4ta<br />Machala · El Oro</div>
                                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.rowLine}`, display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13.5, color: C.muted }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lun – Vie</span><span style={{ color: C.ink, fontWeight: 600 }}>8:00 – 18:00</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Sábado</span><span style={{ color: C.ink, fontWeight: 600 }}>8:00 – 14:00</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Domingo</span><span>Cerrado</span></div>
                                </div>
                                <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                                    <a href={waLink('Hola, quiero coordinar el retiro de mi pedido.')} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 130, textAlign: 'center', padding: 12, background: C.royal, color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>WhatsApp</a>
                                    <a href={`tel:+${WA_NUM}`} style={{ flex: 1, minWidth: 130, textAlign: 'center', padding: 12, background: C.soft, color: C.royal, borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Llamar</a>
                                </div>
                            </div>

                            {foundJobs.length > 1 && (
                                <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, padding: '22px 24px' }}>
                                    <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint }}>Sus pedidos</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
                                        {foundJobs.map(j => (
                                            <button key={j.id} onClick={() => setSelectedJobId(j.id)}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '12px 0', borderTop: `1px solid ${C.rowLine}`, background: 'transparent', border: 'none', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: C.rowLine, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
                                                <span>
                                                    <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: j.id === currentJob.id ? C.royal : C.ink }}>{j.subtipo || j.tipo}</span>
                                                    <span style={{ display: 'block', fontSize: 12, color: C.faint, fontFamily: MONO, marginTop: 2 }}>ORD-{String(j.orden).padStart(4, '0')} · {ESTADO_LABEL[j.estado]}</span>
                                                </span>
                                                <span style={{ flexShrink: 0, fontSize: 12.5, color: C.royal, fontWeight: 600 }}>Ver →</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            <footer style={{ background: '#fff', borderTop: `1px solid #E9ECF5` }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: '32px clamp(16px,3vw,44px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src="/LOGO.png" alt="" style={{ height: 28, width: 'auto' }} />
                        <span style={{ fontSize: 13.5, color: C.muted }}>© 2026 Imprenta Córdova · SRI 001-001 · Machala</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <a href="/" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Inicio</a>
                        <a href="/vitrina" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Catálogo</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TrackingPage;
