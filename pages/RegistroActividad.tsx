import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActivityLog, getLogStats, purgeOldEntries, exportLogAsCSV, ActivityEntry, logActivity } from '../services/activityLogService';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

const ACCION_LABEL: Record<string, string> = {
    LOGIN: 'Inicio de sesión', LOGOUT: 'Cierre de sesión',
    CREAR_ORDEN: 'Orden creada', EDITAR_ORDEN: 'Orden editada',
    CAMBIO_ESTADO: 'Cambio de estado', RETIRO_PROCESADO: 'Entrega procesada',
    CREAR_CLIENTE: 'Cliente registrado', EDITAR_CLIENTE: 'Cliente editado',
    CREAR_USUARIO: 'Usuario creado', EDITAR_USUARIO: 'Usuario editado', TOGGLE_USUARIO: 'Acceso de usuario',
    CAMBIO_CONFIG: 'Ajuste de configuración', CONFIG_MODIFICADA: 'Ajuste de configuración',
    SYNC_CLOUD: 'Sincronización en la nube', SEED_CATALOGO: 'Catálogo cargado',
    EXPORTAR_PDF: 'Exportación', ENVIAR_WHATSAPP: 'Aviso por WhatsApp',
    ABONO_REGISTRADO: 'Abono registrado', ARTE_APROBADO: 'Arte aprobado', FOTO_CAPTURADA: 'Foto capturada',
    ACCESO_MODULO: 'Acceso a módulo', CREAR_PROVEEDOR: 'Proveedor creado', EDITAR_PROVEEDOR: 'Proveedor editado',
    BORRAR_PROVEEDOR: 'Proveedor eliminado', GESTION_PROVEEDOR: 'Gestión de proveedor',
    AGENDAR_TAREA: 'Tarea agendada', COMPLETAR_TAREA: 'Tarea completada', FINALIZADO_DIRECTO: 'Finalización directa',
    INVENTARIO_MODIFICADO: 'Inventario modificado', ALERTA_STOCK: 'Alerta de stock',
    FINANZAS_MODIFICADA: 'Movimiento financiero',
};
const label = (a: string) => ACCION_LABEL[a] || a.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
const ITEMS_PER_PAGE = 40;

const RegistroActividadPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: any }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const [log, setLog] = useState<ActivityEntry[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [page, setPage] = useState(0);

    const refresh = async () => {
        setLoading(true);
        try {
            await purgeOldEntries();
            setLog(await getActivityLog());
            setStats(await getLogStats());
        } catch (e) { console.error('[RegistroActividad]', e); }
        finally { setLoading(false); }
    };
    useEffect(() => { refresh(); }, []);

    const uniqueUsers = useMemo(() => [...new Set(log.map(e => e.usuario))].sort(), [log]);
    const uniqueActions = useMemo(() => [...new Set(log.map(e => e.accion))].sort(), [log]);

    const filtered = useMemo(() => {
        let r = log;
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            r = r.filter(e => e.detalle.toLowerCase().includes(q) || e.usuario.toLowerCase().includes(q) || e.hash.includes(q));
        }
        if (filterAction) r = r.filter(e => e.accion === filterAction);
        if (filterUser) r = r.filter(e => e.usuario === filterUser);
        return r;
    }, [log, searchTerm, filterAction, filterUser]);

    const paginated = useMemo(() => filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE), [filtered, page]);
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    const handleExportCSV = () => {
        const csv = exportLogAsCSV(log);
        logActivity(currentUser.nombre, currentUser.rol || 'Administrador', 'EXPORTAR_PDF', 'Exportación de auditoría a CSV', 'Auditoría');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Auditoría del Sistema · Imprenta Córdova" />
            <div style={S.wrap}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Sistema</p>
                        <h1 style={S.h1}>Auditoría del Sistema</h1>
                        <p style={S.lead}>Cada acción queda firmada. Los registros de más de 3 meses se purgan automáticamente.</p>
                    </div>
                    <button style={S.outlineBtn} onClick={handleExportCSV}>Exportar CSV</button>
                </div>

                {stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
                        {[
                            { l: 'Registros totales', v: stats.totalEntries },
                            { l: 'Actividad de hoy', v: stats.todayEntries },
                            { l: 'Usuarios distintos', v: stats.uniqueUsers },
                            { l: 'Memoria usada', v: `${stats.storageUsedKB} KB` },
                        ].map(k => (
                            <div key={k.l} style={{ ...S.card, borderRadius: 14, padding: '16px 18px' }}>
                                <div style={S.colHead}>{k.l}</div>
                                <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, letterSpacing: '-.04em', color: C.ink, marginTop: 6 }}>{k.v}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ ...S.card, borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                        <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0); }} placeholder="Buscar por detalle, usuario o firma…"
                            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.ink, fontFamily: 'inherit' }} />
                    </div>
                    <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(0); }} style={{ ...S.input, width: 'auto', padding: '8px 12px', fontSize: 12.5, cursor: 'pointer' }}>
                        <option value="">Todas las acciones</option>
                        {uniqueActions.map(a => <option key={a} value={a}>{label(a)}</option>)}
                    </select>
                    <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(0); }} style={{ ...S.input, width: 'auto', padding: '8px 12px', fontSize: 12.5, cursor: 'pointer' }}>
                        <option value="">Todos los usuarios</option>
                        {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>

                <div style={{ ...S.card, overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Sincronizando historial…</div>
                    ) : paginated.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center' }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Registro vacío</p>
                            <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>No hay registros en este segmento.</p>
                        </div>
                    ) : paginated.map(e => {
                        const d = new Date(e.timestamp);
                        return (
                            <div key={e.id} style={{ padding: '15px 20px', borderBottom: `1px solid ${C.rowLine}`, display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'center' }}>
                                <span style={{ minWidth: 0 }}>
                                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.ink }}>{e.detalle}</span>
                                    <span style={{ display: 'block', fontSize: 11, color: C.ghost, fontFamily: MONO, marginTop: 3 }}>
                                        {label(e.accion)} · firma {e.hash.substring(0, 10)} · {e.modulo}
                                    </span>
                                </span>
                                <span style={{ fontSize: 12.5, color: C.body }}>{e.usuario}</span>
                                <span style={{ fontSize: 12, color: C.faint, fontFamily: MONO, textAlign: 'right' }}>
                                    {d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })} {d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })}
                    {totalPages > 1 && (
                        <div style={{ padding: '14px 20px', background: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12.5, color: C.muted }}>Segmento {page + 1} de {totalPages}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ ...S.outlineBtn, padding: '8px 15px', fontSize: 12.5, opacity: page === 0 ? 0.4 : 1 }}>Anterior</button>
                                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ ...S.outlineBtn, padding: '8px 15px', fontSize: 12.5, opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Siguiente</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegistroActividadPage;
