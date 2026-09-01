import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { uploadFile } from '../../services/supabase';
import { logActivity } from '../../services/activityLogService';
import { Cliente, StatusLog, Trabajo, TrabajoEstado } from '../../types';
import { formatCurrency, generateWhatsAppLink } from '../../utils';
import { C, S, MONO, DISPLAY, estadoCfg, PANEL_KEYFRAMES } from '../panelTheme';

/**
 * Cajón lateral de detalle de orden — `Panel-Interno.dc.html` del handoff de diseño.
 * Se abre desde cualquier fila de la tabla de órdenes: cabecera marino, tres métricas,
 * cuatro pestañas (Resumen · Pagos · Archivos · Bitácora) y pie fijo con "Pasar a …".
 */

/** Orden canónico del flujo de producción (design_manifest.md §2.3). */
export const FLUJO: TrabajoEstado[] = [
    TrabajoEstado.PENDIENTE,
    TrabajoEstado.EN_DISENO,
    TrabajoEstado.PROCESO,
    TrabajoEstado.VITRINA,
    TrabajoEstado.ENTREGADO,
];

/** Quién es responsable de cada etapa, para la línea de tiempo del Resumen. */
const ETAPA_AREA: Record<TrabajoEstado, string> = {
    [TrabajoEstado.PENDIENTE]: 'Recepción',
    [TrabajoEstado.EN_DISENO]: 'Diseño gráfico',
    [TrabajoEstado.PROCESO]: 'Prensa',
    [TrabajoEstado.VITRINA]: 'Acabados',
    [TrabajoEstado.ENTREGADO]: 'Despacho',
};

type Tab = 'resumen' | 'pagos' | 'archivos' | 'bitacora';

const TABS: [Tab, string][] = [
    ['resumen', 'Resumen'], ['pagos', 'Pagos'], ['archivos', 'Archivos'], ['bitacora', 'Bitácora'],
];

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Depósito'];

const fmtHora = (iso?: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const iniciales = (nombre: string) =>
    nombre.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '—';

const extDe = (url: string) => (url.split('?')[0].split('.').pop() || 'ARC').slice(0, 4).toUpperCase();

const colorExt = (ext: string): { background: string; color: string } => {
    if (ext === 'PDF') return { background: C.dangerBg, color: C.dangerText };
    if (ext === 'CDR' || ext === 'AI') return { background: C.violetBg, color: C.violet };
    return { background: C.chipBlue, color: C.royal };
};

/* ---------- piezas reutilizadas dentro del cajón ---------- */

const Bloque: React.FC<{ titulo: string; extra?: React.ReactNode; children: React.ReactNode; sinPadding?: boolean }> =
    ({ titulo, extra, children, sinPadding }) => (
        <div style={{ ...S.card, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: sinPadding ? '14px 18px' : '16px 18px 0',
                borderBottom: sinPadding ? `1px solid ${C.divider}` : 'none',
            }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: C.faint }}>{titulo}</span>
                {extra}
            </div>
            <div style={sinPadding ? undefined : { padding: '12px 18px 16px' }}>{children}</div>
        </div>
    );

const Metrica: React.FC<{ label: string; valor: string; color: string; fondo: string }> = ({ label, valor, color, fondo }) => (
    <div style={{ padding: '11px 13px', borderRadius: 11, background: fondo }}>
        <span style={{ display: 'block', fontSize: 9.5, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: C.onInkFaint }}>{label}</span>
        <span style={{ display: 'block', marginTop: 4, fontFamily: MONO, fontSize: 16, color }}>{valor}</span>
    </div>
);

const Vacio: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={{ margin: 0, fontSize: 12.5, color: C.muted }}>{children}</p>
);

/* ---------- cajón ---------- */

interface OrderDrawerProps {
    trabajo: Trabajo;
    cliente?: Cliente | null;
    usuario: string;
    rol?: string;
    onClose: () => void;
}

const OrderDrawer: React.FC<OrderDrawerProps> = ({ trabajo, cliente, usuario, rol = 'Operador', onClose }) => {
    const navigate = useNavigate();
    const { updateTrabajoStatus, registrarAbono, updateTrabajoPhoto, aprobarArte } = useData();

    const [tab, setTab] = useState<Tab>('resumen');
    const [montoAbono, setMontoAbono] = useState('');
    const [metodo, setMetodo] = useState(METODOS_PAGO[0]);
    const [ocupado, setOcupado] = useState<string | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const cfg = estadoCfg(trabajo.estado);
    const idx = Math.max(FLUJO.indexOf(trabajo.estado), 0);
    const siguiente = idx < FLUJO.length - 1 ? FLUJO[idx + 1] : null;
    const urgente = trabajo.prioridad === 'Urgente';
    const nombreCliente = cliente?.nombre || trabajo.titular;
    const telefono = cliente?.telefono?.[0] || '';
    const orden = `#${String(trabajo.orden).padStart(4, '0')}`;

    /* El monto de abono se preselecciona con el saldo, como pide el handoff. */
    useEffect(() => { setMontoAbono(trabajo.saldo > 0 ? trabajo.saldo.toFixed(2) : ''); }, [trabajo.id, trabajo.saldo]);

    /* Esc cierra el cajón y el scroll del cuerpo queda bloqueado mientras está abierto. */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const previo = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previo; };
    }, [onClose]);

    const historial: StatusLog[] = useMemo(
        () => [...(trabajo.historial ?? [])].sort((a, b) => +new Date(a.fecha) - +new Date(b.fecha)),
        [trabajo.historial],
    );

    const timeline = useMemo(() => FLUJO.map((estado, i) => {
        const log = [...historial].reverse().find(h => h.estado === estado);
        return {
            estado,
            label: estadoCfg(estado).label,
            area: ETAPA_AREA[estado],
            quien: log?.usuario || (i <= idx ? trabajo.creadoPor || '—' : ''),
            hora: log ? fmtHora(log.fecha) : i === 0 ? fmtHora(trabajo.fechaEntrada) : '—',
            mark: i < idx ? '✓' : i === idx ? '●' : '',
        };
    }), [historial, idx, trabajo.creadoPor, trabajo.fechaEntrada]);

    const specs = useMemo(() => ([
        { k: 'Producto', v: trabajo.tipo || '—' },
        { k: 'Cantidad', v: trabajo.cantidad ? `${trabajo.cantidad} ${trabajo.esSRI ? 'juegos' : 'u.'}` : '—' },
        { k: 'Formato', v: trabajo.tamano || '—' },
        { k: 'Acabado', v: (trabajo.subtipo || '').split('|')[0] || '—' },
        { k: 'Numeración', v: trabajo.numeracion || (trabajo.esSRI ? 'Por definir' : 'No aplica') },
        { k: 'Entrega', v: trabajo.fechaEntrega ? fmtHora(trabajo.fechaEntrega) : '—' },
        { k: 'Vendedor', v: trabajo.creadoPor || '—' },
        { k: 'Responsable', v: trabajo.responsable || trabajo.actualizadoPor || '—' },
    ]), [trabajo]);

    const archivos = useMemo(() => ([
        { url: trabajo.fotoOriginalUrl, nombre: 'Arte original', meta: 'Archivo del cliente / diseño base' },
        { url: trabajo.fotoEvidenciaUrl, nombre: 'Evidencia de producción', meta: 'Registro del taller' },
        { url: trabajo.fotoRetiroUrl, nombre: 'Comprobante de retiro', meta: 'Firmado al entregar' },
    ].filter(f => !!f.url) as { url: string; nombre: string; meta: string }[]), [trabajo]);

    const bitacora = useMemo(() => {
        const filas = historial.map(h => ({
            texto: `Estado cambiado a ${estadoCfg(h.estado).label}`, hora: fmtHora(h.fecha), quien: h.usuario,
        }));
        if (trabajo.abono > 0) {
            filas.unshift({ texto: `Abono de ${formatCurrency(trabajo.abono)} registrado en caja`, hora: fmtHora(trabajo.fechaEntrada), quien: trabajo.creadoPor || '—' });
        }
        filas.unshift({ texto: `Orden ${orden} creada`, hora: fmtHora(trabajo.fechaEntrada), quien: trabajo.creadoPor || '—' });
        return filas.reverse();
    }, [historial, trabajo, orden]);

    /* ---------- acciones ---------- */

    const avanzar = async () => {
        if (!siguiente) return;
        setOcupado('estado'); setAviso(null);
        try {
            await updateTrabajoStatus(trabajo.id, siguiente, usuario);
            await logActivity(usuario, rol, 'CAMBIO_ESTADO', `${orden} → ${estadoCfg(siguiente).label}`, 'Órdenes');
        } catch { setAviso('No se pudo cambiar el estado.'); }
        finally { setOcupado(null); }
    };

    const cobrar = async () => {
        const monto = parseFloat(montoAbono.replace(',', '.'));
        if (!monto || monto <= 0) { setAviso('Ingresa un monto mayor a cero.'); return; }
        setOcupado('abono'); setAviso(null);
        try {
            await registrarAbono(trabajo.id, monto, usuario);
            await logActivity(usuario, rol, 'ABONO_REGISTRADO', `${orden} · ${formatCurrency(monto)} en ${metodo}`, 'Órdenes');
        } catch { setAviso('No se pudo registrar el abono.'); }
        finally { setOcupado(null); }
    };

    const subirArchivo = async (file?: File | null) => {
        if (!file) return;
        setOcupado('archivo'); setAviso(null);
        try {
            const url = await uploadFile(file, 'trabajos', `${trabajo.id}/arte_${Date.now()}`);
            await updateTrabajoPhoto(trabajo.id, url);
        } catch { setAviso('No se pudo subir el archivo.'); }
        finally { setOcupado(null); if (fileRef.current) fileRef.current.value = ''; }
    };

    const aprobar = async () => {
        setOcupado('arte'); setAviso(null);
        try {
            await aprobarArte(trabajo.id);
            await logActivity(usuario, rol, 'ARTE_APROBADO', `${orden} · prueba digital aprobada`, 'Órdenes');
        } catch { setAviso('No se pudo aprobar el arte.'); }
        finally { setOcupado(null); }
    };

    const abrirWhatsApp = () => {
        if (!telefono) return;
        window.open(generateWhatsAppLink(telefono, `Hola ${nombreCliente}, le escribimos de Imprenta Córdova sobre su orden ${orden}.`), '_blank');
    };

    const imprimirNota = () =>
        navigate(trabajo.esSRI ? `/solicitud-impresion/${trabajo.id}` : `/orden-produccion/${trabajo.id}`);

    /* ---------- estilos locales derivados de los tokens ---------- */

    const tabBtn = (activo: boolean): React.CSSProperties => ({
        padding: '13px 14px', border: 'none', background: 'transparent', fontFamily: 'inherit',
        fontSize: 13, fontWeight: 600, cursor: 'pointer',
        color: activo ? C.royal : C.faint,
        boxShadow: activo ? `inset 0 -2px 0 ${C.royal}` : 'none',
    });

    const chipOscuro: React.CSSProperties = {
        padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color,
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', justifyContent: 'flex-end' }} role="dialog" aria-modal="true" aria-label={`Detalle de la orden ${orden}`}>
            <style>{PANEL_KEYFRAMES}</style>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: C.scrim, backdropFilter: 'blur(2px)', animation: 'pi-fade-in .3s ease both' }} />

            <aside style={{
                position: 'relative', width: 'min(640px,100%)', height: '100%', background: C.bg,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '-30px 0 70px rgba(10,17,64,.26)',
                animation: 'pi-slide-in .36s cubic-bezier(.2,.8,.2,1) both',
            }}>

                {/* Cabecera marino */}
                <div style={{ padding: '18px 22px 16px', background: C.ink, color: C.onInk, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '-.01em' }}>{orden}</span>
                            <span style={chipOscuro}>{cfg.label}</span>
                            {urgente && (
                                <span style={{ padding: '3px 8px', borderRadius: 6, background: C.onInkDangerLayer, color: C.onInkDanger, fontSize: 10, fontWeight: 800, letterSpacing: '.1em' }}>URGENTE</span>
                            )}
                        </div>
                        <h2 style={{ margin: '8px 0 0', fontFamily: DISPLAY, fontSize: 21, fontWeight: 600, letterSpacing: '-.035em', color: C.onInk }}>{nombreCliente}</h2>
                        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.onInkMuted }}>
                            {[trabajo.tipo, trabajo.cantidad ? `${trabajo.cantidad} u.` : null].filter(Boolean).join(' · ') || 'Trabajo general'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar detalle"
                        style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, border: `1px solid ${C.onInkBorder}`, background: C.onInkLayer, color: C.onInkSoft, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
                    >✕</button>
                </div>

                {/* Tres métricas */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: C.ink, padding: '0 22px 18px', gap: 10 }}>
                    <Metrica label="Total" valor={formatCurrency(trabajo.total)} color={C.onInk} fondo={C.onInkLayer} />
                    <Metrica label="Abonado" valor={formatCurrency(trabajo.abono)} color={C.onInkSuccess} fondo={C.onInkLayer} />
                    <Metrica
                        label="Saldo"
                        valor={formatCurrency(trabajo.saldo)}
                        color={trabajo.saldo > 0 ? C.gold : C.onInkSuccess}
                        fondo={trabajo.saldo > 0 ? C.onInkGoldLayer : C.onInkLayer}
                    />
                </div>

                {/* Pestañas */}
                <div style={{ display: 'flex', gap: 4, padding: '0 16px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                    {TABS.map(([k, label]) => (
                        <button key={k} onClick={() => setTab(k)} style={tabBtn(tab === k)}>{label}</button>
                    ))}
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {aviso && (
                        <div style={{ padding: '11px 14px', borderRadius: 11, background: C.dangerBg, border: `1px solid ${C.goldBorder}`, color: C.dangerText, fontSize: 12.5 }}>{aviso}</div>
                    )}

                    {tab === 'resumen' && (
                        <>
                            <Bloque titulo="Avance de producción">
                                {timeline.map((s, i) => {
                                    const c = estadoCfg(s.estado);
                                    const hecho = i < idx, actual = i === idx;
                                    return (
                                        <div key={s.estado} style={{ display: 'flex', gap: 13 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
                                                <span style={{
                                                    width: 20, height: 20, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 10, fontWeight: 800, flexShrink: 0,
                                                    ...(hecho ? { background: C.successDot, color: C.onInk }
                                                        : actual ? { background: c.dot, color: C.onInk, boxShadow: `0 0 0 4px ${c.bg}` }
                                                            : { background: C.divider, color: C.ghost }),
                                                }}>{s.mark}</span>
                                                {i < timeline.length - 1 && (
                                                    <span style={{ flex: 1, width: 2, minHeight: 16, background: hecho ? C.successDot : C.divider }} />
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
                                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                                                    <span style={{ fontSize: 13.5, fontWeight: 600, color: i <= idx ? C.ink : C.ghost }}>{s.label}</span>
                                                    <span style={{ fontSize: 11.5, fontFamily: MONO, color: C.ghost }}>{s.hora}</span>
                                                </div>
                                                <span style={{ display: 'block', fontSize: 11.5, color: C.faint, marginTop: 2 }}>
                                                    {[s.area, s.quien].filter(Boolean).join(' · ')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </Bloque>

                            <Bloque titulo="Especificaciones">
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
                                    {specs.map(e => (
                                        <div key={e.k}>
                                            <span style={{ display: 'block', fontSize: 11, color: C.faint }}>{e.k}</span>
                                            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 3 }}>{e.v}</span>
                                        </div>
                                    ))}
                                </div>
                                {trabajo.observaciones && (
                                    <div style={{ marginTop: 14, padding: '12px 14px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 11 }}>
                                        <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.goldText }}>Nota del taller</span>
                                        <span style={{ display: 'block', fontSize: 13, color: C.goldText, marginTop: 4, lineHeight: 1.6 }}>{trabajo.observaciones}</span>
                                    </div>
                                )}
                            </Bloque>

                            <Bloque titulo="Cliente">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap' }}>
                                    <span style={{ width: 42, height: 42, borderRadius: 12, background: C.chipBlue, color: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontSize: 16, fontWeight: 700 }}>
                                        {iniciales(nombreCliente)}
                                    </span>
                                    <span style={{ flex: 1, minWidth: 170 }}>
                                        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: C.ink }}>{nombreCliente}</span>
                                        <span style={{ display: 'block', fontSize: 12, color: C.faint, marginTop: 2, fontFamily: MONO }}>
                                            {[cliente?.ruc || cliente?.cedula, telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                                        </span>
                                    </span>
                                    <span style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={abrirWhatsApp}
                                            disabled={!telefono}
                                            style={{ padding: '9px 13px', background: C.successBg, color: C.successStrong, border: `1px solid ${C.successBorder}`, borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: telefono ? 'pointer' : 'not-allowed', opacity: telefono ? 1 : .5, fontFamily: 'inherit' }}
                                        >WhatsApp</button>
                                        <a
                                            href={telefono ? `tel:${telefono}` : undefined}
                                            style={{ padding: '9px 13px', background: C.surface, color: C.body, border: `1px solid ${C.borderStrong}`, borderRadius: 9, fontSize: 12.5, fontWeight: 600, textDecoration: 'none', opacity: telefono ? 1 : .5, pointerEvents: telefono ? 'auto' : 'none' }}
                                        >Llamar</a>
                                    </span>
                                </div>
                            </Bloque>
                        </>
                    )}

                    {tab === 'pagos' && (
                        <>
                            <Bloque
                                titulo="Historial de pagos"
                                sinPadding
                                extra={<span style={{ fontSize: 11.5, color: C.faint }}>{trabajo.abono > 0 ? '1 abono registrado' : 'Sin abonos'}</span>}
                            >
                                {trabajo.abono > 0 ? (
                                    <div style={{ padding: '13px 18px', borderBottom: `1px solid ${C.rowLine}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                                        <span style={{ minWidth: 0 }}>
                                            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink }}>Abono acumulado</span>
                                            <span style={{ display: 'block', fontSize: 11.5, color: C.faint, marginTop: 2 }}>Desde {fmtHora(trabajo.fechaEntrada)} · recibió {trabajo.creadoPor || '—'}</span>
                                        </span>
                                        <span style={{ fontFamily: MONO, fontSize: 13.5, color: C.success, whiteSpace: 'nowrap' }}>{formatCurrency(trabajo.abono)}</span>
                                    </div>
                                ) : (
                                    <div style={{ padding: '16px 18px' }}><Vacio>Todavía no se registran abonos para esta orden.</Vacio></div>
                                )}
                                <div style={{ padding: '14px 18px', background: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 12.5, color: C.muted }}>Saldo pendiente</span>
                                    <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: trabajo.saldo > 0 ? C.goldTextStrong : C.success }}>{formatCurrency(trabajo.saldo)}</span>
                                </div>
                            </Bloque>

                            <Bloque titulo="Registrar abono">
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                    <label style={{ flex: 1, minWidth: 130 }}>
                                        <span style={{ display: 'block', fontSize: 11, color: C.faint, marginBottom: 6 }}>Monto</span>
                                        <input
                                            value={montoAbono}
                                            onChange={e => setMontoAbono(e.target.value)}
                                            inputMode="decimal"
                                            disabled={trabajo.saldo <= 0}
                                            style={{ ...S.input, background: C.goldBg, borderColor: C.goldBorder, fontFamily: MONO, fontSize: 14 }}
                                        />
                                    </label>
                                    <label style={{ flex: 1, minWidth: 130 }}>
                                        <span style={{ display: 'block', fontSize: 11, color: C.faint, marginBottom: 6 }}>Método</span>
                                        <select value={metodo} onChange={e => setMetodo(e.target.value)} style={{ ...S.input, fontSize: 14 }}>
                                            {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </label>
                                    <button
                                        onClick={cobrar}
                                        disabled={trabajo.saldo <= 0 || ocupado === 'abono'}
                                        style={{ padding: '12px 18px', background: C.success, color: C.onInk, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: trabajo.saldo > 0 ? 'pointer' : 'not-allowed', opacity: trabajo.saldo > 0 ? 1 : .5, fontFamily: 'inherit' }}
                                    >{ocupado === 'abono' ? 'Cobrando…' : 'Cobrar'}</button>
                                </div>
                                {trabajo.saldo <= 0 && <p style={{ margin: '10px 0 0', fontSize: 12, color: C.success }}>Orden cancelada en su totalidad.</p>}
                            </Bloque>

                            <Bloque titulo="Comprobante SRI">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <span style={{
                                        padding: '5px 11px', borderRadius: 99, fontSize: 11.5, fontWeight: 700,
                                        ...(trabajo.esSRI
                                            ? (trabajo.autorizacion_sri ? { background: C.successBg, color: C.success } : { background: C.goldBg, color: C.goldText })
                                            : { background: C.softGray, color: C.muted }),
                                    }}>
                                        {trabajo.esSRI ? (trabajo.autorizacion_sri ? 'Autorizado' : 'Pendiente') : 'No aplica'}
                                    </span>
                                    <span style={{ flex: 1, minWidth: 150, fontSize: 12.5, color: C.muted }}>
                                        {trabajo.esSRI
                                            ? (trabajo.autorizacion_sri
                                                ? `Autorización ${trabajo.autorizacion_sri}${trabajo.fechaVencimiento ? ` · vigente hasta ${fmtHora(trabajo.fechaVencimiento)}` : ''}`
                                                : 'Falta la autorización del SRI para esta orden de preimpresos.')
                                            : 'Trabajo comercial: se emite nota de venta interna.'}
                                    </span>
                                    <button onClick={() => navigate('/facturacion')} style={{ ...S.softBtn, background: C.chipBlue }}>Emitir factura</button>
                                </div>
                            </Bloque>
                        </>
                    )}

                    {tab === 'archivos' && (
                        <>
                            <Bloque titulo="Archivos de la orden" sinPadding>
                                {archivos.length === 0 ? (
                                    <div style={{ padding: '16px 18px' }}><Vacio>Esta orden todavía no tiene archivos adjuntos.</Vacio></div>
                                ) : archivos.map(f => {
                                    const ext = extDe(f.url);
                                    return (
                                        <div key={f.url} style={{ padding: '13px 18px', borderBottom: `1px solid ${C.rowLine}`, display: 'flex', alignItems: 'center', gap: 13 }}>
                                            <span style={{ width: 38, height: 38, flexShrink: 0, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, letterSpacing: '.04em', ...colorExt(ext) }}>{ext}</span>
                                            <span style={{ flex: 1, minWidth: 0 }}>
                                                <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nombre}</span>
                                                <span style={{ display: 'block', fontSize: 11.5, color: C.faint, marginTop: 2 }}>{f.meta}</span>
                                            </span>
                                            <a href={f.url} target="_blank" rel="noreferrer" style={{ padding: '7px 12px', background: C.surface, border: `1px solid ${C.borderStrong}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: C.royal, textDecoration: 'none' }}>Abrir</a>
                                        </div>
                                    );
                                })}
                                <div style={{ padding: '14px 18px', background: C.surfaceAlt }}>
                                    <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => subirArchivo(e.target.files?.[0])} />
                                    <button onClick={() => fileRef.current?.click()} disabled={ocupado === 'archivo'} style={{ ...S.softBtn, background: C.chipBlue }}>
                                        {ocupado === 'archivo' ? 'Subiendo…' : 'Subir nueva versión'}
                                    </button>
                                </div>
                            </Bloque>

                            <Bloque titulo="Prueba digital">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <span style={{
                                        padding: '5px 11px', borderRadius: 99, fontSize: 11.5, fontWeight: 700,
                                        ...(trabajo.arteAprobado ? { background: C.successBg, color: C.success } : { background: C.goldBg, color: C.goldText }),
                                    }}>{trabajo.arteAprobado ? 'Aprobada' : 'Pendiente'}</span>
                                    <span style={{ flex: 1, minWidth: 150, fontSize: 12.5, color: C.muted }}>
                                        {trabajo.arteAprobado ? 'El cliente aprobó el arte; la orden puede pasar a prensa.' : 'Falta enviar o confirmar la prueba digital con el cliente.'}
                                    </span>
                                    {trabajo.arteAprobado ? (
                                        <button onClick={abrirWhatsApp} disabled={!telefono} style={{ padding: '9px 14px', background: C.successBg, color: C.successStrong, border: `1px solid ${C.successBorder}`, borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: telefono ? 'pointer' : 'not-allowed', opacity: telefono ? 1 : .5, fontFamily: 'inherit' }}>Enviar por WhatsApp</button>
                                    ) : (
                                        <button onClick={aprobar} disabled={ocupado === 'arte'} style={{ ...S.softBtn, background: C.chipBlue }}>{ocupado === 'arte' ? 'Aprobando…' : 'Aprobar arte'}</button>
                                    )}
                                </div>
                            </Bloque>
                        </>
                    )}

                    {tab === 'bitacora' && (
                        <Bloque titulo="Bitácora de auditoría">
                            {bitacora.map((b, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 13 }}>
                                    <span style={{ width: 7, height: 7, marginTop: 6, borderRadius: 99, background: C.borderStrong, flexShrink: 0 }} />
                                    <span style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{ display: 'block', fontSize: 13, color: C.ink }}>{b.texto}</span>
                                        <span style={{ display: 'block', fontSize: 11, color: C.ghost, marginTop: 2, fontFamily: MONO }}>{b.hora} · {b.quien}</span>
                                    </span>
                                </div>
                            ))}
                        </Bloque>
                    )}
                </div>

                {/* Pie fijo */}
                <div style={{ padding: '14px 22px', background: C.surface, borderTop: `1px solid ${C.border}`, display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                    <button
                        onClick={avanzar}
                        disabled={!siguiente || ocupado === 'estado'}
                        style={{
                            flex: 1, minWidth: 180, padding: 13, background: siguiente ? C.royal : C.softGray, color: siguiente ? C.onInk : C.faint,
                            border: 'none', borderRadius: 11, fontSize: 13.5, fontWeight: 600, cursor: siguiente ? 'pointer' : 'default', fontFamily: 'inherit',
                        }}
                    >
                        {ocupado === 'estado' ? 'Actualizando…' : siguiente ? `Pasar a ${estadoCfg(siguiente).label}` : 'Orden cerrada'}
                    </button>
                    <button onClick={imprimirNota} style={{ padding: '13px 16px', background: C.softGray, color: C.royal, border: 'none', borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Imprimir nota</button>
                    <button onClick={() => navigate(`/trabajos/${trabajo.id}`)} style={{ padding: '13px 16px', background: C.surface, color: C.body, border: `1px solid ${C.borderStrong}`, borderRadius: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Editar</button>
                </div>
            </aside>
        </div>
    );
};

export default OrderDrawer;
