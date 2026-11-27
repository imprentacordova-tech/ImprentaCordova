import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/activityLogService';
import { Trabajo, Cliente, TrabajoEstado, User } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, estadoCfg, dot, estadoPill, PANEL_KEYFRAMES, PageLoaderLite } from '../components/panelTheme';
import { ModalDespachoEntrega } from '../components/orders/ModalDespachoEntrega';
import { mensajeDeError } from '../utils';

const ESTADOS: TrabajoEstado[] = [TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO, TrabajoEstado.PROCESO, TrabajoEstado.VITRINA, TrabajoEstado.ENTREGADO];

const TrabajoDetallePage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { trabajos, clientes, loading, updateTrabajoStatus } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [despachoAbierto, setDespachoAbierto] = useState(false);
    const [errorEstado, setErrorEstado] = useState<string | null>(null);

    useEffect(() => {
        if (!trabajoId || loading) return;
        const current = trabajos.find(t => t.id === trabajoId);
        if (current) {
            setTrabajo(current);
            setCliente(clientes.find(c => c.id === current.clienteId) || null);
        }
    }, [trabajoId, trabajos, clientes, loading]);

    const handleStatusChange = async (newStatus: TrabajoEstado) => {
        if (!trabajo) return;
        /*
         * Entregar pasa por el despacho (cobro del saldo, receptor, foto), igual que en
         * Retiros. Antes se cambiaba el estado directo: la orden salía de "por cobrar" sin
         * que nadie cobrara y la caja la contaba como cobrada.
         */
        if (newStatus === TrabajoEstado.ENTREGADO) { setDespachoAbierto(true); return; }
        setErrorEstado(null);
        try {
            await updateTrabajoStatus(trabajo.id, newStatus, currentUser.nombre);
            logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CAMBIO_ESTADO', `Estado → ${newStatus}`, 'TrabajoDetalle').catch(() => {});
        } catch (err) {
            setErrorEstado(`No se pudo cambiar el estado: ${mensajeDeError(err) || 'error de conexión'}.`);
        }
    };

    if (loading) return <PageLoaderLite />;
    if (!trabajo) return <div style={{ ...S.page }}><p style={{ textAlign: 'center', color: C.muted, padding: 40 }}>Trabajo no encontrado.</p></div>;

    const cfg = estadoCfg(trabajo.estado);

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title={`Orden #${String(trabajo.orden).padStart(4, '0')} · Imprenta Córdova`} />
            <div style={{ ...S.wrap, maxWidth: 1100 }}>

                <div style={{ ...S.card, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <button style={S.softBtn} onClick={() => navigate(-1)}>← Regresar</button>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {trabajo.esSRI
                            ? <button style={S.primaryBtn} onClick={() => navigate(`/solicitud-impresion/${trabajo.id}`)}>Solicitud SRI</button>
                            : <button style={S.primaryBtn} onClick={() => navigate(`/orden-produccion/${trabajo.id}`)}>Orden de taller</button>}
                        <button style={S.outlineBtn} onClick={() => window.open(`/#/recibo-abono/${trabajo.id}`, '_blank')}>Ticket 80mm</button>
                        <button style={S.outlineBtn} onClick={() => window.open(`/#/recibo-epson/${trabajo.id}`, '_blank')}>🧾 Recibo Comercial (1/4 Oficio)</button>
                        <button style={{ ...S.primaryBtn, background: '#1B6E3E' }} onClick={() => navigate('/facturacion')}>Factura SRI</button>
                        <button style={{ ...S.primaryBtn, background: '#0f2b48' }} onClick={() => window.open(`/#/nota-de-venta/${trabajo.id}`, '_blank')}>📑 Nota de Venta (Medio Oficio)</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, alignItems: 'start' }}>
                    <div style={{ gridColumn: 'span 2', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ ...S.card, padding: '22px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                                <div>
                                    <p style={S.eyebrow}>Especificación de obra</p>
                                    <h1 style={{ ...S.h1, fontSize: 34 }}>#{String(trabajo.orden).padStart(4, '0')}</h1>
                                </div>
                                <span style={estadoPill(cfg)}><span style={dot(cfg.dot, 6)} />{cfg.label}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 16, padding: '18px 0', margin: '18px 0', borderTop: `1px solid ${C.divider}`, borderBottom: `1px solid ${C.divider}` }}>
                                {[
                                    { l: 'Valor total', v: formatCurrency(trabajo.total), c: C.ink },
                                    { l: 'Abono inicial', v: formatCurrency(trabajo.abono), c: C.success },
                                    { l: 'Saldo pendiente', v: formatCurrency(trabajo.saldo), c: trabajo.saldo > 0 ? '#B91C1C' : C.faint },
                                    { l: 'Tiraje', v: `${trabajo.cantidad} u.`, c: C.ink },
                                ].map(x => (
                                    <div key={x.l}>
                                        <div style={S.colHead}>{x.l}</div>
                                        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, letterSpacing: '-.03em', color: x.c, marginTop: 4 }}>{x.v}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={S.colHead}>Detalle técnico</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: C.ink, marginTop: 6 }}>{trabajo.tipo}</div>
                            <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{(trabajo.subtipo || '').split('|')[0]}</div>
                        </div>

                        {trabajo.esSRI && (
                            <div style={{ ...S.accentCard, padding: '20px 22px' }}>
                                <div style={{ ...S.colHead, color: '#93A0C8' }}>Validación técnica SRI</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginTop: 14 }}>
                                    <div>
                                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#93A0C8' }}>Punto de emisión</div>
                                        <div style={{ fontFamily: MONO, fontSize: 16, marginTop: 4 }}>{trabajo.establecimiento || '001'} — {trabajo.puntoEmision || '001'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#93A0C8' }}>Clave de acceso</div>
                                        <div style={{ fontFamily: MONO, fontSize: 12, marginTop: 4, color: '#7FD3A6', wordBreak: 'break-all' }}>{trabajo.claveAcceso || 'Pendiente'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#93A0C8' }}>Actividad económica</div>
                                        <div style={{ fontSize: 12, marginTop: 4, color: '#C2CAE6' }}>{trabajo.actividadSeleccionada || 'Actividad general'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ ...S.card, padding: '20px 22px' }}>
                            <div style={{ ...S.fieldLabel, marginBottom: 14 }}>Trazabilidad</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {(trabajo.historial || []).map((log, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                        <span style={{ ...dot(estadoCfg(log.estado as TrabajoEstado).dot, 8), marginTop: 5 }} />
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{estadoCfg(log.estado as TrabajoEstado).label}</div>
                                            <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{formatDate(log.fecha)} · {log.usuario}</div>
                                        </div>
                                    </div>
                                ))}
                                {(trabajo.historial || []).length === 0 && <div style={{ fontSize: 12.5, color: C.muted }}>Sin registros de trazabilidad.</div>}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ ...S.card, padding: '20px 22px' }}>
                            <div style={{ ...S.fieldLabel, marginBottom: 12 }}>Cliente</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink }}>{cliente?.nombre || trabajo.titular || 'Cliente no registrado'}</div>
                            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 8, fontFamily: MONO }}>{cliente?.ruc || cliente?.cedula || '—'}</div>
                            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{cliente?.direccion || 'Pasaje, El Oro'}</div>
                            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{cliente?.regimen || ''}</div>
                            <button style={{ ...S.softBtn, width: '100%', marginTop: 14, justifyContent: 'center' }} onClick={() => navigate('/clientes')}>Abrir directorio</button>
                        </div>

                        <div style={{ ...S.card, padding: '20px 22px' }}>
                            <div style={{ ...S.fieldLabel, marginBottom: 12 }}>Cambiar estado</div>
                            {errorEstado && <div role="alert" style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 12 }}>{errorEstado}</div>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {ESTADOS.map(status => {
                                    const on = trabajo.estado === status;
                                    const c = estadoCfg(status);
                                    return (
                                        <button key={status} disabled={on} onClick={() => handleStatusChange(status)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, cursor: on ? 'default' : 'pointer',
                                                fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, textAlign: 'left',
                                                border: `1px solid ${on ? c.border : C.border}`, background: on ? c.bg : '#fff', color: on ? c.color : C.body,
                                            }}>
                                            <span style={dot(c.dot, 6)} />{c.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {despachoAbierto && (
                <ModalDespachoEntrega
                    isOpen={despachoAbierto}
                    onClose={() => setDespachoAbierto(false)}
                    trabajo={trabajo}
                    cliente={cliente}
                    currentUser={currentUser}
                    onEntregaExitosa={(t) => setTrabajo(t)}
                />
            )}
        </div>
    );
};

export default TrabajoDetallePage;
