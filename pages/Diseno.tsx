import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Trabajo, TrabajoEstado, SupervisorAnalysis, User } from '../types';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyzeDesignWithSupervisor, extractSampleTextOCR, SampleOcrResult } from '../services/geminiService';
import { logActivity } from '../services/activityLogService';
import { generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';
import {
    SparklesIcon, WhatsAppIcon, ClipboardIcon, CheckCircleIcon,
    ExternalLinkIcon, ArrowRightIcon, EyeIcon, BoltIcon
} from '../components/Icons';

const ANALISIS_COLOR: Record<string, { bg: string; color: string; border: string }> = {
    VERDE: { bg: '#F2F7F2', color: '#1B6E3E', border: '#D8E8DC' },
    AMARILLO: { bg: '#FFFBEB', color: '#7A5A00', border: '#F4E3A8' },
    ROJO: { bg: '#FEF2F2', color: '#B91C1C', border: '#FBD5D5' },
};

const AI_TOOLBOX = [
    { name: 'Vectorizer.AI', desc: 'Vectorizar Logos JPG/PNG a SVG', url: 'https://vectorizer.ai/', badge: 'Vector' },
    { name: 'Upscayl (Free 4K)', desc: 'Escalar fotos a 300 DPI', url: 'https://upscayl.org/', badge: '300 DPI' },
    { name: 'Clipdrop / RemoveBG', desc: 'Quitar fondo en 1 clic', url: 'https://clipdrop.co/remove-background', badge: 'Recorte' },
    { name: 'Ideogram AI', desc: 'Generar tipografía y marcas', url: 'https://ideogram.ai/', badge: 'Arte IA' },
];

const DisenoPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { trabajos, clientes, loading, updateTrabajoStatus } = useData();
    const [selectedJob, setSelectedJob] = useState<Trabajo | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [extractingOcr, setExtractingOcr] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<SupervisorAnalysis | null>(null);
    const [ocrResult, setOcrResult] = useState<SampleOcrResult | null>(null);
    const [copiedOcr, setCopiedOcr] = useState(false);

    useEffect(() => {
        setAiAnalysis(null);
        setOcrResult(null);
        setCopiedOcr(false);
    }, [selectedJob]);

    const pendingJobs = trabajos
        .filter(t => t.estado === TrabajoEstado.PENDIENTE || t.estado === TrabajoEstado.EN_DISENO)
        .sort((a, b) => new Date(a.fechaEntrada).getTime() - new Date(b.fechaEntrada).getTime());

    const getCliente = (id?: string) => clientes.find(c => c.id === id);
    const nombreDe = (id?: string) => getCliente(id)?.nombre || 'Consumidor Final';

    const runSupervisorAI = async () => {
        if (!selectedJob?.fotoOriginalUrl) return;
        setAnalyzing(true);
        try {
            const result = await analyzeDesignWithSupervisor(selectedJob.fotoOriginalUrl, selectedJob.subtipo);
            setAiAnalysis(result);
            logActivity(currentUser.nombre, currentUser.rol || 'Diseñador', 'ARTE_APROBADO', `Análisis técnico orden #${selectedJob.orden}`, 'Diseño');
        } catch (e) { console.error('Análisis IA falló', e); }
        finally { setAnalyzing(false); }
    };

    const runOcrExtractor = async () => {
        if (!selectedJob?.fotoOriginalUrl) return;
        setExtractingOcr(true);
        try {
            const result = await extractSampleTextOCR(selectedJob.fotoOriginalUrl);
            setOcrResult(result);
        } catch (e) {
            console.error('Error extrayendo OCR:', e);
        } finally {
            setExtractingOcr(false);
        }
    };

    const copyOcrToClipboard = () => {
        if (!ocrResult) return;
        const text = `--- DATOS EXTRAÍDOS PARA COREDRAW / ILLUSTRATOR ---
EMPRESA / NOMBRE: ${ocrResult.razonSocial || ''}
RUC / C.I.: ${ocrResult.ruc || ''}
DIRECCIÓN: ${ocrResult.direccion || ''}
TELÉFONOS: ${ocrResult.telefonos || ''}
ACTIVIDAD / SLOGAN: ${ocrResult.actividadComercial || ''}
${ocrResult.advertenciaSri ? `LEYENDA SRI: ${ocrResult.advertenciaSri}` : ''}
${ocrResult.textosDetectados?.length ? `\nTEXTOS SECUNDARIOS:\n${ocrResult.textosDetectados.join('\n')}` : ''}
---------------------------------------------------`;
        navigator.clipboard.writeText(text);
        setCopiedOcr(true);
        setTimeout(() => setCopiedOcr(false), 2500);
    };

    const handleSendWhatsAppApproval = () => {
        if (!selectedJob) return;
        const cli = getCliente(selectedJob.clienteId);
        const phone = cli?.telefono?.[0] || '';
        const trackingUrl = `${window.location.origin}/#/tracking?q=${selectedJob.id}`;
        const msg = `🎨 *BOCETO DE DISEÑO LISTO - IMPRENTA CÓRDOVA*\n\n` +
            `Estimado/a *${cli?.nombre || 'Cliente'}*,\n` +
            `Le saludamos de Imprenta Córdova. El diseño para su orden *#${selectedJob.orden}* (${selectedJob.subtipo || selectedJob.tipo}) está listo para su revisión.\n\n` +
            `🔍 *Revise su diseño y estado aquí:* ${trackingUrl}\n\n` +
            `Por favor respóndanos con su confirmación *[APROBADO]* para iniciar la impresión, o indíquenos si requiere algún cambio.\n\n` +
            `_Imprenta Córdova · Pasaje, El Oro_`;

        if (phone) {
            window.open(generateWhatsAppLink(phone, msg), '_blank');
        } else {
            alert('El cliente no tiene un teléfono registrado para WhatsApp.');
        }
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
            <SEO title="Diseño Gráfico & Asistente IA · Imprenta Córdova" />
            <div style={S.wrap}>
                
                {/* Cabecera Principal */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Taller & Preprensa</p>
                        <h1 style={S.h1}>Diseño Gráfico & Copiloto IA</h1>
                        <p style={S.lead}>Control de diagramación, extracción OCR de muestras físicas y validación técnica previa a prensa.</p>
                    </div>
                </div>

                {/* Hub de Herramientas IA Gratuitas para el Diseñador */}
                <div style={{ ...S.card, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', background: '#FFFFFF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 32, height: 32, borderRadius: 8, background: C.goldBg, color: C.goldTextStrong, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</span>
                        <div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Caja de Herramientas IA Gratuitas (Lanzador Directo)</span>
                            <span style={{ fontSize: 11, color: C.faint, display: 'block' }}>Utilidades recomendadas para vectorizar y escalar arte antes de importar a CorelDRAW</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {AI_TOOLBOX.map((tool) => (
                            <a
                                key={tool.name}
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                    background: C.surfaceAlt,
                                    border: `1px solid ${C.border}`,
                                    textDecoration: 'none',
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    color: C.royal,
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <span>{tool.name}</span>
                                <span style={{ fontSize: 9.5, padding: '2px 5px', borderRadius: 4, background: C.chipBlue, color: C.royal }}>{tool.badge}</span>
                                <ExternalLinkIcon className="w-3 h-3 text-slate-400" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Grid Principal: Cola vs Área de Trabajo */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,300px) 1fr', gap: 16, alignItems: 'start' }}>

                    {/* Cola de Trabajos */}
                    <div style={{ ...S.card, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ ...S.h2, fontSize: 15 }}>Cola de diseño</h2>
                            <span style={{ fontSize: 12, fontFamily: MONO, color: C.royal, fontWeight: 700 }}>{pendingJobs.length} pendientes</span>
                        </div>
                        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 620, overflowY: 'auto' }}>
                            {loading ? (
                                <div style={{ padding: 24, textAlign: 'center', color: C.faint, fontSize: 12 }}>Cargando cola…</div>
                            ) : pendingJobs.length === 0 ? (
                                <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 12.5 }}>Sin órdenes en diseño.</div>
                            ) : pendingJobs.map(job => {
                                const on = selectedJob?.id === job.id;
                                const hasPhoto = !!job.fotoOriginalUrl;

                                return (
                                    <button
                                        key={job.id}
                                        onClick={() => setSelectedJob(job)}
                                        style={{
                                            textAlign: 'left', padding: '12px 14px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                                            border: `1px solid ${on ? C.royal : C.border}`, background: on ? C.chipBlue : '#FFFFFF',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 700, color: on ? C.royal : C.faint }}>
                                                ORD-{String(job.orden).padStart(4, '0')}
                                            </span>
                                            {hasPhoto && (
                                                <span style={{ fontSize: 9.5, padding: '2px 5px', borderRadius: 5, background: C.goldBg, color: C.goldTextStrong, fontWeight: 800 }}>
                                                    📷 Muestra
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {nombreDe(job.clienteId)}
                                        </div>
                                        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {job.subtipo || job.tipo}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Área de Trabajo y Asistente */}
                    <div style={{ ...S.card, overflow: 'hidden', minWidth: 0 }}>
                        {!selectedJob ? (
                            <div style={{ padding: 64, textAlign: 'center', color: C.muted }}>
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: C.chipBlue, color: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>
                                    🎨
                                </div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Módulo de Preprensa y Diseño</p>
                                <p style={{ fontSize: 13, marginTop: 4 }}>Selecciona una orden de la cola izquierda para ver su muestra física y extraer datos con IA.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                
                                {/* Barra Superior de la Orden */}
                                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.divider}`, display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={{ ...S.h2, fontSize: 18 }}>Orden #{String(selectedJob.orden).padStart(4, '0')}</h2>
                                        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: C.faint }}>
                                            {selectedJob.subtipo || selectedJob.tipo} · {nombreDe(selectedJob.clienteId)}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        <button
                                            style={{ ...S.softBtn, background: '#1B6E3E', color: '#FFFFFF', padding: '8px 14px' }}
                                            onClick={handleSendWhatsAppApproval}
                                        >
                                            <WhatsAppIcon className="w-4 h-4 text-white" /> Enviar a WhatsApp
                                        </button>
                                        <button style={S.outlineBtn} onClick={sendToPrint}>Enviar a Producción →</button>
                                        <button style={S.primaryBtn} onClick={sendToVitrina}>Salto a Vitrina</button>
                                    </div>
                                </div>

                                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
                                    
                                    {/* Muestra Física / Arte de Referencia */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={S.colHead}>Muestra Física / Archivo de Cliente</span>
                                            {selectedJob.fotoOriginalUrl && (
                                                <button
                                                    type="button"
                                                    onClick={runOcrExtractor}
                                                    disabled={extractingOcr}
                                                    style={{ ...S.softBtn, background: C.goldBg, color: C.goldTextStrong, padding: '5px 10px', fontSize: 11, fontWeight: 800 }}
                                                >
                                                    <SparklesIcon className="w-3.5 h-3.5" />
                                                    {extractingOcr ? 'Extrayendo Datos…' : '⚡ Extraer Textos (OCR IA)'}
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ minHeight: 280, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                            {selectedJob.fotoOriginalUrl ? (
                                                <img
                                                    src={selectedJob.fotoOriginalUrl}
                                                    alt="Muestra física"
                                                    style={{ maxWidth: '100%', maxHeight: 340, objectFit: 'contain', padding: 8 }}
                                                />
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: 24, color: C.faint }}>
                                                    <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>📷</span>
                                                    <span style={{ fontSize: 12.5 }}>Sin foto ni archivo adjunto en la orden.</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Observaciones del Mostrador */}
                                        {selectedJob.observaciones && (
                                            <div style={{ padding: '10px 14px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                                                <span style={{ fontSize: 10, fontWeight: 800, color: C.faint, textTransform: 'uppercase', letterSpacing: '.12em' }}>Instrucciones de Mostrador:</span>
                                                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>
                                                    {selectedJob.observaciones}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Panel de Extracción OCR & Supervisor IA */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={S.colHead}>Copiloto de Preprensa (Gemini IA)</span>
                                            <button
                                                style={S.softBtn}
                                                disabled={analyzing || !selectedJob.fotoOriginalUrl}
                                                onClick={runSupervisorAI}
                                            >
                                                {analyzing ? 'Validando…' : 'Validar Calidad IA'}
                                            </button>
                                        </div>

                                        {/* Resultado del OCR */}
                                        {ocrResult && (
                                            <div style={{
                                                padding: 14, background: '#FFFFFF', border: `1.5px solid ${C.royal}`,
                                                borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 8,
                                                boxShadow: '0 8px 20px -6px rgba(10,17,64,0.08)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: 11, fontWeight: 800, color: C.royal, textTransform: 'uppercase', letterSpacing: '.12em' }}>
                                                        ✓ Datos Extraídos para CorelDRAW
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={copyOcrToClipboard}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                                            padding: '4px 9px', background: copiedOcr ? C.successBg : C.chipBlue,
                                                            color: copiedOcr ? C.success : C.royal, border: `1px solid ${copiedOcr ? C.successBorder : C.borderStrong}`,
                                                            borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer'
                                                        }}
                                                    >
                                                        {copiedOcr ? <><CheckCircleIcon className="w-3 h-3" /> Copiado</> : <><ClipboardIcon className="w-3 h-3" /> Copiar Todo</>}
                                                    </button>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
                                                    <div>
                                                        <span style={{ color: C.faint, fontWeight: 600 }}>Razón Social:</span>
                                                        <div style={{ fontWeight: 700, color: C.ink }}>{ocrResult.razonSocial || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: C.faint, fontWeight: 600 }}>RUC:</span>
                                                        <div style={{ fontFamily: MONO, fontWeight: 700, color: C.royal }}>{ocrResult.ruc || '—'}</div>
                                                    </div>
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <span style={{ color: C.faint, fontWeight: 600 }}>Dirección:</span>
                                                        <div style={{ color: C.body }}>{ocrResult.direccion || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: C.faint, fontWeight: 600 }}>Teléfonos:</span>
                                                        <div style={{ fontFamily: MONO, color: C.ink }}>{ocrResult.telefonos || '—'}</div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: C.faint, fontWeight: 600 }}>Actividad:</span>
                                                        <div style={{ color: C.body }}>{ocrResult.actividadComercial || '—'}</div>
                                                    </div>
                                                </div>

                                                {ocrResult.advertenciaSri && (
                                                    <div style={{ padding: '6px 10px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 6, fontSize: 11, color: C.goldTextStrong, fontWeight: 600 }}>
                                                        ⚖️ {ocrResult.advertenciaSri}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Informe de Calidad / Validación */}
                                        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, minHeight: 180 }}>
                                            {analyzing ? (
                                                <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 12, fontWeight: 700, color: C.royal, textTransform: 'uppercase', letterSpacing: '.16em' }}>
                                                    Analizando resolución y márgenes de impresión…
                                                </p>
                                            ) : aiAnalysis ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={S.colHead}>Dictamen Técnico</span>
                                                        <span style={{ padding: '3px 9px', borderRadius: 7, fontSize: 10.5, fontWeight: 800, ...(ANALISIS_COLOR[aiAnalysis.estado] || ANALISIS_COLOR.AMARILLO) }}>
                                                            {aiAnalysis.estado}
                                                        </span>
                                                    </div>
                                                    <p style={{ fontSize: 12.5, color: C.body, lineHeight: 1.5, borderLeft: `3px solid ${C.royal}`, paddingLeft: 10, margin: 0 }}>
                                                        “{aiAnalysis.resumen}”
                                                    </p>
                                                    {aiAnalysis.detalles.map((d, i) => (
                                                        <div key={i} style={{ ...S.card, padding: 10 }}>
                                                            <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: C.royal }}>{d.tipo}</div>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginTop: 2 }}>{d.descripcion}</div>
                                                            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{d.sugerencia}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted }}>
                                                    <p style={{ fontSize: 12.5, margin: 0 }}>Pulsa <b>"⚡ Extraer Textos (OCR IA)"</b> para copiar los datos de la muestra, o <b>"Validar Calidad IA"</b> para revisar resolución y márgenes.</p>
                                                </div>
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
