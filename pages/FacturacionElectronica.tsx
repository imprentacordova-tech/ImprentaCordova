import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { FacturaElectronica, EstadoFacturaSri, FacturaDetalleItem, Trabajo } from '../types';
import { sriInvoiceService } from '../services/sriInvoiceService';
import { formatCurrency } from '../utils';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

const ESTADO_FAC: Record<EstadoFacturaSri, { bg: string; color: string; border: string; label: string }> = {
    AUTORIZADO: { bg: '#F2F7F2', color: '#1B6E3E', border: '#D8E8DC', label: 'Autorizado SRI' },
    PENDIENTE: { bg: '#FFFBEB', color: '#7A5A00', border: '#F4E3A8', label: 'Pendiente' },
    PROCESANDO: { bg: '#EEF1FC', color: '#16309B', border: '#D7DDF0', label: 'Procesando' },
    RECHAZADO: { bg: '#FEF2F2', color: '#B91C1C', border: '#FBD5D5', label: 'Rechazado' },
    ANULADO: { bg: '#F5F6FA', color: '#5B6480', border: '#E4E8F4', label: 'Anulado' },
    ERROR: { bg: '#FEF2F2', color: '#B91C1C', border: '#FBD5D5', label: 'Error de conexión' },
};
const facCfg = (e: EstadoFacturaSri) => ESTADO_FAC[e] || ESTADO_FAC.PENDIENTE;

const TABS: { id: 'historial' | 'emitir' | 'render'; label: string }[] = [
    { id: 'historial', label: 'Historial' },
    { id: 'emitir', label: 'Facturar orden' },
    { id: 'render', label: 'Conexión SRI' },
];

export const FacturacionElectronicaPage: React.FC = () => {
    const { trabajos, clientes } = useData();
    const [facturas, setFacturas] = useState<FacturaElectronica[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'historial' | 'emitir' | 'render'>('historial');
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('TODOS');
    const [isEmitirModalOpen, setIsEmitirModalOpen] = useState(false);
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [clienteId, setClienteId] = useState('');
    const [ambiente] = useState<'PRUEBAS' | 'PRODUCCION'>('PRUEBAS');
    const [items, setItems] = useState<FacturaDetalleItem[]>([
        { codigo: 'SERV-01', descripcion: 'Servicios de Impresión Offset / Digital', cantidad: 1, precioUnitario: 50, descuento: 0, precioTotal: 50, iva: 15 },
    ]);
    const [emitting, setEmitting] = useState(false);
    const [emissionFeedback, setEmissionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const loadFacturas = async () => {
        setLoading(true);
        setFacturas(await sriInvoiceService.getFacturas());
        setLoading(false);
    };
    useEffect(() => { loadFacturas(); }, []);

    const ordenesElegibles = useMemo(() => (trabajos ?? []).filter(t => t.total > 0), [trabajos]);

    const stats = useMemo(() => ({
        totalFacturado: facturas.reduce((a, f) => a + (f.estado === 'AUTORIZADO' ? f.total : 0), 0),
        autorizadas: facturas.filter(f => f.estado === 'AUTORIZADO').length,
        pendientes: facturas.filter(f => f.estado === 'PENDIENTE' || f.estado === 'PROCESANDO').length,
        totalIva: facturas.reduce((a, f) => a + (f.estado === 'AUTORIZADO' ? f.iva12 : 0), 0),
    }), [facturas]);

    const facturasFiltradas = useMemo(() => facturas.filter(f => {
        const q = searchQuery.toLowerCase();
        const s = f.clienteNombre.toLowerCase().includes(q) || f.clienteIdentificacion.includes(searchQuery) || f.numeroFactura.includes(searchQuery) || f.claveAcceso.includes(searchQuery);
        return s && (estadoFilter === 'TODOS' || f.estado === estadoFilter);
    }), [facturas, searchQuery, estadoFilter]);

    const selectTrabajo = (t: Trabajo) => {
        setSelectedTrabajo(t);
        const c = clientes.find(x => x.id === t.clienteId || x.nombre.toLowerCase() === t.titular.toLowerCase());
        setClienteId(c ? c.id : '');
        setItems([{ codigo: `ORD-${t.orden}`, descripcion: `${t.tipo}${t.subtipo ? ' - ' + t.subtipo : ''} (Orden #${t.orden})`, cantidad: t.cantidad || 1, precioUnitario: Number((t.total / (t.cantidad || 1)).toFixed(2)), descuento: 0, precioTotal: t.total, iva: 15 }]);
        setIsEmitirModalOpen(true);
    };

    const addItem = () => setItems(p => [...p, { codigo: `ITEM-${p.length + 1}`, descripcion: 'Producto / Servicio', cantidad: 1, precioUnitario: 10, descuento: 0, precioTotal: 10, iva: 15 }]);
    const updItem = (i: number, field: keyof FacturaDetalleItem, val: any) => setItems(p => {
        const copy = [...p];
        const item = { ...copy[i], [field]: val };
        if (field === 'cantidad' || field === 'precioUnitario' || field === 'descuento') {
            item.precioTotal = Number(((Number(item.cantidad) || 0) * (Number(item.precioUnitario) || 0) - (Number(item.descuento) || 0)).toFixed(2));
        }
        copy[i] = item;
        return copy;
    });
    const rmItem = (i: number) => { if (items.length > 1) setItems(p => p.filter((_, x) => x !== i)); };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmitting(true);
        setEmissionFeedback(null);
        const c = clientes.find(x => x.id === clienteId);
        const clienteNombre = c ? c.nombre : (selectedTrabajo ? selectedTrabajo.titular : 'CONSUMIDOR FINAL');
        const ident = c?.ruc || c?.cedula || '9999999999999';
        const tipoId = ident.length === 13 ? 'RUC' : ident.length === 10 ? 'CEDULA' : 'PASAPORTE';
        const result = await sriInvoiceService.emitirFactura({
            trabajoId: selectedTrabajo?.id, clienteId: clienteId || '00000000-0000-0000-0000-000000000000',
            clienteNombre, clienteIdentificacion: ident, clienteTipoId: tipoId,
            clienteEmail: c?.email, clienteDireccion: c?.direccion, detalles: items, ambiente,
        });
        setEmitting(false);
        if (result.success && result.factura) {
            setEmissionFeedback({ type: 'success', message: `Factura ${result.factura.numeroFactura} generada. Clave de acceso registrada.` });
            await loadFacturas();
            setTimeout(() => { setIsEmitirModalOpen(false); setEmissionFeedback(null); setSelectedTrabajo(null); }, 2000);
        } else {
            setEmissionFeedback({ type: 'error', message: result.error || 'Error al emitir factura' });
        }
    };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Facturación Electrónica SRI · Imprenta Córdova" />
            <div style={S.wrap}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Finanzas</p>
                        <h1 style={S.h1}>Facturación Electrónica SRI</h1>
                    </div>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                        <button style={S.outlineBtn} onClick={loadFacturas}>Actualizar</button>
                        <button style={S.primaryBtn} onClick={() => { setSelectedTrabajo(null); setIsEmitirModalOpen(true); }}>Nueva factura directa</button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,150px),1fr))', gap: 14 }}>
                    {[
                        { l: 'Total facturado', v: formatCurrency(stats.totalFacturado), c: C.royal },
                        { l: 'Autorizadas', v: String(stats.autorizadas), c: C.success },
                        { l: 'En proceso SRI', v: String(stats.pendientes), c: '#B45309' },
                        { l: 'IVA 15% generado', v: formatCurrency(stats.totalIva), c: '#6D28D9' },
                    ].map(k => (
                        <div key={k.l} style={{ ...S.card, borderRadius: 14, padding: '17px 19px' }}>
                            <div style={S.colHead}>{k.l}</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, letterSpacing: '-.04em', color: k.c, marginTop: 8, lineHeight: 1 }}>{k.v}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            style={{
                                padding: '8px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                ...(activeTab === t.id ? { background: C.royal, color: '#fff', border: `1px solid ${C.royal}` } : { background: '#fff', color: C.body, border: `1px solid ${C.borderStrong}` }),
                            }}>
                            {t.label}{t.id === 'historial' ? ` (${facturas.length})` : t.id === 'emitir' ? ` (${ordenesElegibles.length})` : ''}
                        </button>
                    ))}
                </div>

                {activeTab === 'historial' && (
                    <div style={{ ...S.card, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.divider}`, display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 10 }}>
                                <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar por RUC, cliente, N° o clave…"
                                    style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: C.ink, fontFamily: 'inherit' }} />
                            </div>
                            <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)} style={{ ...S.input, width: 'auto', padding: '9px 12px', fontSize: 12.5, cursor: 'pointer' }}>
                                <option value="TODOS">Todos los estados</option>
                                <option value="AUTORIZADO">Autorizados</option>
                                <option value="PENDIENTE">Pendientes</option>
                                <option value="RECHAZADO">Rechazados</option>
                            </select>
                        </div>
                        {loading ? (
                            <div style={{ padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando comprobantes…</div>
                        ) : facturasFiltradas.length === 0 ? (
                            <div style={{ padding: 48, textAlign: 'center' }}>
                                <p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>No se encontraron facturas</p>
                                <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Emite una factura desde una orden o directamente.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <div style={{ minWidth: 760 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.3fr .8fr .9fr .8fr .9fr', padding: '11px 20px', background: C.surfaceAlt, borderBottom: `1px solid ${C.divider}` }}>
                                        <span style={S.colHead}>N° / clave</span>
                                        <span style={S.colHead}>Cliente</span>
                                        <span style={S.colHead}>Emisión</span>
                                        <span style={{ ...S.colHead, textAlign: 'right' }}>Sub / IVA</span>
                                        <span style={{ ...S.colHead, textAlign: 'right' }}>Total</span>
                                        <span style={S.colHead}>Estado</span>
                                    </div>
                                    {facturasFiltradas.map(f => {
                                        const cfg = facCfg(f.estado);
                                        return (
                                            <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.3fr .8fr .9fr .8fr .9fr', alignItems: 'center', padding: '13px 20px', borderBottom: `1px solid ${C.rowLine}` }}>
                                                <span style={{ minWidth: 0 }}>
                                                    <span style={{ display: 'block', fontSize: 12.5, fontFamily: MONO, fontWeight: 600, color: C.ink }}>{f.numeroFactura}</span>
                                                    <span style={{ display: 'block', fontSize: 10, fontFamily: MONO, color: C.ghost, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.claveAcceso}</span>
                                                </span>
                                                <span style={{ minWidth: 0 }}>
                                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.clienteNombre}</span>
                                                    <span style={{ display: 'block', fontSize: 11, fontFamily: MONO, color: C.faint }}>{f.clienteTipoId}: {f.clienteIdentificacion}</span>
                                                </span>
                                                <span style={{ fontSize: 11.5, fontFamily: MONO, color: C.muted }}>{new Date(f.fechaEmision).toLocaleDateString('es-EC')}</span>
                                                <span style={{ textAlign: 'right', fontSize: 12, fontFamily: MONO, color: C.body }}>{formatCurrency(f.subtotalSinImpuestos)} / {formatCurrency(f.iva12)}</span>
                                                <span style={{ textAlign: 'right', fontSize: 13, fontFamily: MONO, fontWeight: 600, color: C.ink }}>{formatCurrency(f.total)}</span>
                                                <span><span style={{ padding: '4px 9px', borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span></span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'emitir' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
                        {ordenesElegibles.map(t => (
                            <div key={t.id} style={{ ...S.card, padding: '16px 18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 11.5, fontFamily: MONO, color: C.royal }}>ORDEN #{t.orden}</span>
                                    <span style={{ fontSize: 11, color: C.faint }}>{t.estado}</span>
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.titular}</div>
                                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{t.tipo} · {t.cantidad} u.</div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.rowLine}` }}>
                                    <span style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: C.ink }}>{formatCurrency(t.total)}</span>
                                    <button style={{ ...S.softBtn, padding: '6px 12px' }} onClick={() => selectTrabajo(t)}>Facturar →</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'render' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
                        <div style={{ ...S.card, padding: 20 }}>
                            <h2 style={{ ...S.h2, fontSize: 16 }}>Microservicio de firma</h2>
                            <p style={{ ...S.lead }}>Motor de firma XML + SOAP SRI Ecuador.</p>
                            <div style={{ ...S.card, background: C.bg, padding: 14, marginTop: 12, fontFamily: MONO, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.faint }}>API URL</span><span style={{ color: C.ink }}>cordova-sri-api.onrender.com</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.faint }}>Estado</span><span style={{ color: C.success }}>Sandbox activo</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.faint }}>Certificado P12</span><span style={{ color: '#B45309' }}>Configurado en .env</span></div>
                            </div>
                        </div>
                        <div style={{ ...S.card, padding: 20 }}>
                            <h2 style={{ ...S.h2, fontSize: 16 }}>Ambiente SRI</h2>
                            <p style={{ ...S.lead }}>Pruebas vs producción real.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                                <div style={{ ...S.card, background: C.bg, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 12.5, color: C.body }}>Modo sandbox de pruebas</span>
                                    <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: C.chipBlue, color: C.royal }}>Activo</span>
                                </div>
                                <div style={{ ...S.card, background: C.bg, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 12.5, color: C.body }}>Descuento de inventario al facturar</span>
                                    <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: '#F2F7F2', color: C.success }}>Conectado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isEmitirModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={() => setIsEmitirModalOpen(false)} />
                    <form onSubmit={submit} style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', ...S.card }}>
                        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.divider}`, background: C.surfaceAlt }}>
                            <h2 style={{ ...S.h2, fontSize: 17 }}>{selectedTrabajo ? `Facturar orden #${selectedTrabajo.orden}` : 'Nueva factura directa'}</h2>
                        </div>
                        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <label style={{ display: 'block' }}>
                                <span style={S.fieldLabel}>Cliente receptor</span>
                                <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                                    <option value="">— Consumidor final —</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.ruc || c.cedula})</option>)}
                                </select>
                            </label>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Detalle de ítems</span>
                                    <button type="button" style={{ ...S.softBtn, padding: '5px 9px', fontSize: 11 }} onClick={addItem}>+ Ítem</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {items.map((item, i) => (
                                        <div key={i} style={{ ...S.card, background: C.bg, padding: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                            <input value={item.descripcion} onChange={e => updItem(i, 'descripcion', e.target.value)} placeholder="Descripción…"
                                                style={{ ...S.input, flex: 1, minWidth: 160, padding: '8px 10px', fontSize: 12 }} />
                                            <input type="number" min="1" value={item.cantidad} onChange={e => updItem(i, 'cantidad', Number(e.target.value))}
                                                style={{ ...S.input, width: 60, padding: '8px 10px', fontSize: 12, fontFamily: MONO, textAlign: 'center' }} />
                                            <input type="number" step="0.01" value={item.precioUnitario} onChange={e => updItem(i, 'precioUnitario', Number(e.target.value))}
                                                style={{ ...S.input, width: 84, padding: '8px 10px', fontSize: 12, fontFamily: MONO, textAlign: 'right' }} />
                                            <span style={{ width: 80, textAlign: 'right', fontSize: 12.5, fontFamily: MONO, fontWeight: 600, color: C.ink }}>{formatCurrency(item.precioTotal)}</span>
                                            {items.length > 1 && <button type="button" style={{ ...S.softBtn, padding: '4px 8px', fontSize: 11, background: '#FEF2F2', color: '#B91C1C' }} onClick={() => rmItem(i)}>✕</button>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {(() => {
                                const sub = items.reduce((a, i) => a + i.precioTotal, 0);
                                const iva = Number((sub * 0.15).toFixed(2));
                                return (
                                    <div style={{ ...S.accentCard, fontFamily: MONO, fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#93A0C8' }}><span>Subtotal</span><span>{formatCurrency(sub)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#C4B0FF' }}><span>IVA 15%</span><span>{formatCurrency(iva)}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#7FD3A6', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,.12)' }}><span>Total</span><span>{formatCurrency(sub + iva)}</span></div>
                                    </div>
                                );
                            })()}
                            {emissionFeedback && (
                                <div style={{ padding: 12, borderRadius: 10, fontSize: 12.5, fontWeight: 600, ...(emissionFeedback.type === 'success' ? { background: '#F2F7F2', color: C.success } : { background: '#FEF2F2', color: '#B91C1C' }) }}>
                                    {emissionFeedback.message}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" style={S.softBtn} onClick={() => setIsEmitirModalOpen(false)}>Cancelar</button>
                                <button type="submit" style={S.primaryBtn} disabled={emitting}>{emitting ? 'Procesando SRI…' : 'Emitir factura'}</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default FacturacionElectronicaPage;
