import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, User } from '../types';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/activityLogService';
import { SEO } from '../components/SEO';
import { C, S, MONO, PANEL_KEYFRAMES } from '../components/panelTheme';

const ProduccionPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { trabajos, clientes, loading, updateTrabajoStatus, updateTrabajoEvidencia } = useData();
    const [selectedJob, setSelectedJob] = useState<Trabajo | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const pendingJobs = (trabajos ?? [])
        .filter(t => t.estado === TrabajoEstado.PROCESO)
        .sort((a, b) => new Date(a.fechaEntrada).getTime() - new Date(b.fechaEntrada).getTime());

    const nombreDe = (id: string) => clientes.find(c => c.id === id)?.nombre || 'Cliente';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedJob) return;
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                await updateTrabajoEvidencia(selectedJob.id, base64);
                setSelectedJob({ ...selectedJob, fotoEvidenciaUrl: base64 });
                logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'FOTO_CAPTURADA', `Evidencia para orden #${selectedJob.orden}`, 'Producción');
            };
            reader.readAsDataURL(file);
        } catch (err) { console.error('Error subiendo evidencia', err); }
        finally { setUploading(false); }
    };

    const handleSendToVitrina = async () => {
        if (!selectedJob) return;
        try {
            await updateTrabajoStatus(selectedJob.id, TrabajoEstado.VITRINA, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CAMBIO_ESTADO', `Orden #${selectedJob.orden} a vitrina`, 'Producción');
            setSelectedJob(null);
        } catch { alert('Error al procesar la orden.'); }
    };

    const Preview: React.FC<{ src?: string; label: string }> = ({ src, label }) => (
        <div>
            <div style={{ ...S.fieldLabel, marginBottom: 8 }}>{label}</div>
            <div
                onClick={() => !src && fileRef.current?.click()}
                style={{ minHeight: 240, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: src ? 'default' : 'pointer' }}
            >
                {src
                    ? <img src={src} alt={label} style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', padding: 12 }} />
                    : <span style={{ color: C.ghost, fontSize: 12.5 }}>Sin archivo · toque para adjuntar</span>}
            </div>
        </div>
    );

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Flujo de Producción · Imprenta Córdova" />
            <div style={S.wrap}>
                <div>
                    <p style={S.eyebrow}>Taller</p>
                    <h1 style={S.h1}>Flujo de Producción</h1>
                    <p style={S.lead}>Órdenes en prensa. Adjunte la evidencia y finalice para pasar a vitrina.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,320px) 1fr', gap: 16, alignItems: 'start' }}>
                    <div style={{ ...S.card, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ ...S.h2, fontSize: 15 }}>En prensa</h2>
                            <span style={{ fontSize: 12, fontFamily: MONO, color: C.royal }}>{pendingJobs.length}</span>
                        </div>
                        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 560, overflowY: 'auto' }}>
                            {loading ? (
                                <div style={{ padding: 24, textAlign: 'center', color: C.faint, fontSize: 12 }}>Cargando…</div>
                            ) : pendingJobs.length === 0 ? (
                                <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 12.5 }}>Sin órdenes en prensa.</div>
                            ) : pendingJobs.map(job => {
                                const on = selectedJob?.id === job.id;
                                return (
                                    <button key={job.id} onClick={() => setSelectedJob(job)}
                                        style={{ textAlign: 'left', padding: '11px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${on ? C.royal : C.border}`, background: on ? C.chipBlue : '#fff' }}>
                                        <div style={{ fontSize: 12, fontFamily: MONO, color: on ? C.royal : C.faint }}>ORD-{String(job.orden).padStart(4, '0')}</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombreDe(job.clienteId)}</div>
                                        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.subtipo || job.tipo}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ ...S.card, overflow: 'hidden', minWidth: 0 }}>
                        {!selectedJob ? (
                            <div style={{ padding: 64, textAlign: 'center', color: C.muted }}>
                                <p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Centro de manufactura</p>
                                <p style={{ fontSize: 12.5, marginTop: 4 }}>Selecciona una orden para operar.</p>
                            </div>
                        ) : (
                            <div>
                                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.divider}`, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={S.h2}>Orden #{String(selectedJob.orden).padStart(4, '0')}</h2>
                                        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: C.faint }}>{nombreDe(selectedJob.clienteId)} · {selectedJob.subtipo || selectedJob.tipo}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                                        <input type="file" ref={fileRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                                        <button style={S.outlineBtn} disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Subiendo…' : 'Anexar evidencia'}</button>
                                        <button style={S.primaryBtn} onClick={handleSendToVitrina}>Finalizar y pasar a vitrina</button>
                                    </div>
                                </div>
                                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
                                    <Preview src={selectedJob.fotoOriginalUrl} label="Diseño / arte matriz" />
                                    <Preview src={selectedJob.fotoEvidenciaUrl} label="Evidencia de producción" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProduccionPage;
