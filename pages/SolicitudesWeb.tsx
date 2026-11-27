import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SEO } from '../components/SEO';
import { C, S, MONO, PANEL_KEYFRAMES } from '../components/panelTheme';
import { generateWhatsAppLink, mensajeDeError } from '../utils';
import { logActivity } from '../services/activityLogService';
import {
    solicitudesWebService, urlNuevaOrdenDesde, normalizarTelefono,
    type SolicitudWeb, type EstadoSolicitud,
} from '../services/solicitudesWebService';

/**
 * Bandeja de solicitudes hechas por clientes en /solicitar.
 * "Crear orden" abre Nueva Orden con todo precargado; al guardarla, la solicitud
 * queda CONVERTIDA y vinculada a la orden (ver NuevoPedido.tsx).
 */

const ESTADOS: Record<EstadoSolicitud, { label: string; color: string; bg: string; border: string }> = {
    NUEVA:      { label: 'Nueva',       color: C.goldTextStrong, bg: C.goldBg,    border: C.goldBorder },
    EN_PROCESO: { label: 'En proceso',  color: C.royal,          bg: C.chipBlue,  border: C.borderStrong },
    CONVERTIDA: { label: 'Convertida',  color: C.success,        bg: C.successBg, border: C.successBorder },
    DESCARTADA: { label: 'Descartada',  color: C.muted,          bg: C.softGray,  border: C.border },
};

type Filtro = 'PENDIENTES' | EstadoSolicitud | 'TODAS';
const FILTROS: { id: Filtro; label: string }[] = [
    { id: 'PENDIENTES', label: 'Por atender' },
    { id: 'CONVERTIDA', label: 'Convertidas' },
    { id: 'DESCARTADA', label: 'Descartadas' },
    { id: 'TODAS', label: 'Todas' },
];

const hace = (iso: string) => {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'recién';
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `hace ${h} h`;
    return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
};

const SolicitudesWeb: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const usuario = user?.nombre || 'Operador';
    const [lista, setLista] = useState<SolicitudWeb[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [filtro, setFiltro] = useState<Filtro>('PENDIENTES');
    const [ocupado, setOcupado] = useState<string | null>(null);

    const cargar = useCallback(async () => {
        try {
            setLista(await solicitudesWebService.listar());
            setError('');
        } catch (e) {
            setError(mensajeDeError(e));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
        const id = setInterval(() => { if (document.visibilityState === 'visible') cargar(); }, 60000);
        return () => clearInterval(id);
    }, [cargar]);

    const visibles = useMemo(() => lista.filter(s =>
        filtro === 'TODAS' ? true
            : filtro === 'PENDIENTES' ? (s.estado === 'NUEVA' || s.estado === 'EN_PROCESO')
                : s.estado === filtro), [lista, filtro]);

    const conteo = useMemo(() => ({
        PENDIENTES: lista.filter(s => s.estado === 'NUEVA' || s.estado === 'EN_PROCESO').length,
        CONVERTIDA: lista.filter(s => s.estado === 'CONVERTIDA').length,
        DESCARTADA: lista.filter(s => s.estado === 'DESCARTADA').length,
        TODAS: lista.length,
    } as Record<string, number>), [lista]);

    const cambiar = async (s: SolicitudWeb, estado: EstadoSolicitud) => {
        setOcupado(s.id);
        try {
            await solicitudesWebService.cambiarEstado(s.id, estado, usuario);
            logActivity(usuario, user?.rol || '', 'SOLICITUD_WEB', `${s.codigo} → ${estado} (${s.razonSocial})`, 'Solicitudes web').catch(() => {});
            setLista(prev => prev.map(x => x.id === s.id ? { ...x, estado, atendidoPor: usuario } : x));
        } catch (e) {
            setError(mensajeDeError(e));
        } finally {
            setOcupado(null);
        }
    };

    const crearOrden = async (s: SolicitudWeb) => {
        if (s.estado === 'NUEVA') await cambiar(s, 'EN_PROCESO');
        navigate(urlNuevaOrdenDesde(s));
    };

    const whatsapp = (s: SolicitudWeb) => {
        const tel = normalizarTelefono(s.telefono).replace(/^0/, '593');
        return generateWhatsAppLink(tel,
            `Hola ${s.razonSocial}, le saluda Imprenta Córdova. Recibimos su solicitud ${s.codigo} de ${s.documento} (${s.cantidad} hojas).`);
    };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Solicitudes web · Imprenta Córdova" />
            <div style={S.wrap}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Pedidos en línea</p>
                        <h1 style={S.h1}>Solicitudes web</h1>
                        <p style={S.lead}>Lo que piden los clientes desde imprentacordova.net/#/solicitar. Un clic y queda lista la orden.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" style={S.outlineBtn} onClick={() => { navigator.clipboard?.writeText('https://www.imprentacordova.net/#/solicitar'); }}>
                            Copiar link del formulario
                        </button>
                        <button type="button" style={S.softBtn} onClick={() => { setCargando(true); cargar(); }}>Actualizar</button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {FILTROS.map(f => {
                        const activo = filtro === f.id;
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setFiltro(f.id)}
                                style={{
                                    ...S.softBtn,
                                    background: activo ? C.ink : C.surface,
                                    color: activo ? '#fff' : C.body,
                                    border: `1px solid ${activo ? C.ink : C.border}`,
                                }}
                            >
                                {f.label}
                                <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.75 }}>{conteo[f.id] ?? 0}</span>
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <div role="alert" style={{ ...S.card, padding: '14px 18px', background: C.dangerBg, borderColor: C.dangerBorder, color: C.dangerText, fontSize: 13, fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                {cargando && lista.length === 0 ? (
                    <div style={{ ...S.card, padding: 40, textAlign: 'center', color: C.muted, fontSize: 13 }}>Cargando solicitudes…</div>
                ) : visibles.length === 0 ? (
                    <div style={{ ...S.card, padding: 40, textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.ink }}>No hay solicitudes en esta vista</p>
                        <p style={{ margin: '6px 0 0', fontSize: 13, color: C.muted }}>Compartí el link del formulario por WhatsApp o en tus redes.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 14 }}>
                        {visibles.map((s, i) => {
                            const est = ESTADOS[s.estado] || ESTADOS.NUEVA;
                            const pendiente = s.estado === 'NUEVA' || s.estado === 'EN_PROCESO';
                            return (
                                <article
                                    key={s.id}
                                    style={{ ...S.card, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, animation: `pi-rise .5s cubic-bezier(.2,.8,.2,1) ${Math.min(i, 8) * 40}ms both`, borderColor: s.estado === 'NUEVA' ? C.goldBorder : C.border }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: C.royal }}>{s.codigo}</span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 11, color: C.faint }}>{hace(s.createdAt)}</span>
                                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, color: est.color, background: est.bg, border: `1px solid ${est.border}` }}>{est.label}</span>
                                        </span>
                                    </div>
                                    <div>
                                        <h3 style={{ ...S.h2, fontSize: 15.5 }}>{s.razonSocial}</h3>
                                        <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted, fontFamily: MONO }}>RUC {s.ruc} · {s.telefono}</p>
                                        {s.nombreComercial && <p style={{ margin: '2px 0 0', fontSize: 12, color: C.body }}>{s.nombreComercial}</p>}
                                    </div>
                                    <div style={{ background: C.surfaceAlt, border: `1px solid ${C.divider}`, borderRadius: 12, padding: '10px 12px', fontSize: 12.5, color: C.body, lineHeight: 1.55 }}>
                                        <strong style={{ color: C.ink }}>{s.documento}</strong> · {s.cantidad} hojas · {s.copias || '—'} · {s.tamano || '—'}<br />
                                        Est. {s.establecimiento}-{s.puntoEmision}
                                        {s.tramite ? ` · ${s.tramite === 'NUEVO' ? 'Primera vez' : s.tramite === 'MISMO' ? 'Reimpresión igual' : s.tramite === 'CAMBIO' ? 'Con cambios' : 'Aumento'}` : ''}
                                        {s.entrega ? ` · ${s.entrega}` : ''}
                                        {s.direccion && <><br /><span style={{ color: C.muted }}>{s.direccion}</span></>}
                                        {s.notas && <><br /><em style={{ color: C.goldText }}>“{s.notas}”</em></>}
                                    </div>
                                    {s.atendidoPor && !pendiente && (
                                        <p style={{ margin: 0, fontSize: 11, color: C.faint }}>Atendida por {s.atendidoPor}</p>
                                    )}
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                                        {pendiente && (
                                            <button type="button" disabled={ocupado === s.id} onClick={() => crearOrden(s)} style={{ ...S.primaryBtn, flex: 1, justifyContent: 'center' }}>
                                                Crear orden →
                                            </button>
                                        )}
                                        {s.estado === 'CONVERTIDA' && s.trabajoId && (
                                            <button type="button" onClick={() => navigate(`/trabajos/${s.trabajoId}`)} style={{ ...S.primaryBtn, flex: 1, justifyContent: 'center' }}>
                                                Ver orden
                                            </button>
                                        )}
                                        <a href={whatsapp(s)} target="_blank" rel="noreferrer" style={{ ...S.outlineBtn, color: C.success, textDecoration: 'none' }}>WhatsApp</a>
                                        {pendiente && (
                                            <button
                                                type="button"
                                                disabled={ocupado === s.id}
                                                onClick={() => { if (window.confirm(`¿Descartar la solicitud ${s.codigo}?`)) cambiar(s, 'DESCARTADA'); }}
                                                style={{ ...S.softBtn, color: C.muted }}
                                            >
                                                Descartar
                                            </button>
                                        )}
                                        {s.estado === 'DESCARTADA' && (
                                            <button type="button" disabled={ocupado === s.id} onClick={() => cambiar(s, 'NUEVA')} style={S.softBtn}>Reabrir</button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SolicitudesWeb;
