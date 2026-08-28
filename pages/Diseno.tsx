import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, SupervisorAnalysis, User } from '../types';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyzeDesignWithSupervisor } from '../services/geminiService';
import { logActivity } from '../services/activityLogService';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

const ANALISIS_COLOR: Record<string, { bg: string; color: string; border: string }> = {
    VERDE: { bg: '#F2F7F2', color: '#1B6E3E', border: '#D8E8DC' },
    AMARILLO: { bg: '#FFFBEB', color: '#7A5A00', border: '#F4E3A8' },
    ROJO: { bg: '#FEF2F2', color: '#B91C1C', border: '#FBD5D5' },
};

const DisenoPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { trabajos, clientes, loading, updateTrabajoStatus } = useData();
    const [selectedJob, setSelectedJob] = useState<Trabajo | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<SupervisorAnalysis | null>(null);

    useEffect(() => { setAiAnalysis(null); }, [selectedJob]);

    const pendingJobs = trabajos
        .filter(t => t.estado === TrabajoEstado.PENDIENTE || t.estado === TrabajoEstado.EN_DISENO)
        .sort((a, b) => new Date(a.fechaEntrada).getTime() - new Date(b.fechaEntrada).getTime());

    const nombreDe = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Consumidor Final';

    const runAI = async () => {
        if (!selectedJob?.fotoOriginalUrl) return;
        setAnalyzing(true);
        try {
            const result = await analyzeDesignWithSupervisor(selectedJob.fotoOriginalUrl, selectedJob.subtipo);
            setAiAnalysis(result);
            logActivity(currentUser.nombre, currentUser.rol || 'Diseñador', 'ARTE_APROBADO', `Análisis técnico orden #${selectedJob.orden}`, 'Diseño');
        } catch (e) { console.error('Análisis IA falló', e); }
        finally { setAnalyzing(false); }
    };

    const sendToPrint = async () => {
        if (!selectedJob) return;
        if (!aiAnalysis && !window.confirm('El supervisor IA no validó este diseño. ¿Enviar a producción de todas formas?')) return;
        try {
            await updateTrabajoStatus(selectedJob.id, TrabajoEstado.PROCESO, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Diseñador', 'CAMBIO_ESTADO', `Orden #${selectedJob.orden} a producción`, 'Diseño');
            setSelectedJob(null);
        } catch { alert('Error al procesar la orden.'); }
    };

    const sendToVitrina = async () => {
        if (!selectedJob) return;
        if (!window.confirm('¿Enviar directo a vitrina? Se salta el paso de producción.')) return;
        try {
            await updateTrabajoStatus(selectedJob.id, TrabajoEstado.VITRINA, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Diseñador', 'FINALIZADO_DIRECTO', `Orden #${selectedJob.orden} a vitrina`, 'Diseño');
            setSelectedJob(null);
        } catch { alert('Error al finalizar la orden.'); }
    };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Diseño Gráfico · Imprenta Córdova" />
            <div style={S.wrap}>
                <div>
                    <p style={S.eyebrow}>Taller</p>
                    <h1 style={S.h1}>Diseño Gráfico</h1>
                    <p style={S.lead}>Cola de diagramación. El arte maestro vive en CorelDRAW; aquí se controla el avance.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,300px) 1fr', gap: 16, alignItems: 'start' }}>

                    {/* Cola */}
                    <div style={{ ...S.card, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ ...S.h2, fontSize: 15 }}>Cola de diseño</h2>
                            <span style={{ fontSize: 12, fontFamily: MONO, color: C.royal }}>{pendingJobs.length}</span>
                        </div>
                        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto' }}>
                            {loading ? (
                                <div style={{ padding: 24, textAlign: 'center', color: C.faint, fontSize: 12 }}>Cargando…</div>
                            ) : pendingJobs.length === 0 ? (
                                <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 12.5 }}>Sin pendientes.</div>
                            ) : pendingJobs.map(job => {
                                const on = selectedJob?.id === job.id;
                                return (
                                    <button key={job.id} onClick={() => setSelectedJob(job)}
                                        style={{
                                            textAlign: 'left', padding: '11px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                                            border: `1px solid ${on ? C.royal : C.border}`, background: on ? C.chipBlue : '#fff',
                                        }}>
                                        <div style={{ fontSize: 12, fontFamily: MONO, color: on ? C.royal : C.faint }}>ORD-{String(job.orden).padStart(4, '0')}</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreDe(job.clienteId)}</div>
                                        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.subtipo || job.tipo}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Área de trabajo */}
                    <div style={{ ...S.card, overflow: 'hidden', minWidth: 0 }}>
                        {!selectedJob ? (
                            <div style={{ padding: 64, textAlign: 'center', color: C.muted }}>
                                <p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Módulo de diseño</p>
                                <p style={{ fontSize: 12.5, marginTop: 4 }}>Selecciona una orden de la cola para comenzar.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.divider}`, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={S.h2}>Orden #{String(selectedJob.orden).padStart(4, '0')}</h2>
                                        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: C.faint }}>{selectedJob.subtipo || selectedJob.tipo} · {nombreDe(selectedJob.clienteId)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                                        <button style={S.softBtn} disabled={analyzing || !selectedJob.fotoOriginalUrl} onClick={runAI}>
                                            {analyzing ? 'Analizando…' : 'Análisis IA'}
                                        </button>
                                        <button style={S.outlineBtn} onClick={sendToPrint}>Enviar a producción</button>
                                        <button style={S.primaryBtn} onClick={sendToVitrina}>Salto a vitrina</button>
                                    </div>
                                </div>

                                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
                                    <div>
                                        <div style={{ ...S.fieldLabel, marginBottom: 8 }}>Arte de referencia</div>
                                        <div style={{ minHeight: 260, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {selectedJob.fotoOriginalUrl
                                                ? <img src={selectedJob.fotoOriginalUrl} alt="Arte" style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', padding: 12 }} />
                                                : <span style={{ color: C.ghost, fontSize: 12.5 }}>Sin archivo adjunto</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ ...S.fieldLabel, marginBottom: 8 }}>Informe del supervisor IA</div>
                                        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, minHeight: 260 }}>
                                            {analyzing ? (
                                                <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, fontWeight: 700, color: C.royal, textTransform: 'uppercase', letterSpacing: '.16em' }}>Analizando diseño…</p>
                                            ) : aiAnalysis ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={S.colHead}>Resultado</span>
                                                        <span style={{ padding: '3px 9px', borderRadius: 7, fontSize: 10.5, fontWeight: 800, ...(ANALISIS_COLOR[aiAnalysis.estado] || ANALISIS_COLOR.AMARILLO) }}>{aiAnalysis.estado}</span>
                                                    </div>
                                                    <p style={{ fontSize: 13, color: C.body, lineHeight: 1.6, borderLeft: `3px solid ${C.royal}`, paddingLeft: 12 }}>“{aiAnalysis.resumen}”</p>
                                                    {aiAnalysis.detalles.map((d, i) => (
                                                        <div key={i} style={{ ...S.card, padding: 12 }}>
                                                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: C.royal }}>{d.tipo}</div>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 4 }}>{d.descripcion}</div>
                                                            <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{d.sugerencia}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
                                                    Inicia el análisis para validar la viabilidad técnica del diseño.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisenoPage;
