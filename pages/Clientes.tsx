import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/activityLogService';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo, Regimen } from '../types';
import { formatCurrency, formatDate, validarIdentificacionEC } from '../utils';
import { generateMarketingPromotion } from '../services/geminiService';
import { sriLookupService } from '../services/sriLookupService';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

// ── Modal de promoción con IA ──────────────────────────────────────────────
const MarketingIAModal: React.FC<{ cliente: Cliente; trabajos: Trabajo[]; onClose: () => void }> = ({ cliente, trabajos, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        (async () => {
            const productos = trabajos.filter(t => t.clienteId === cliente.id).map(j => j.subtipo).slice(0, 3);
            setMessage(await generateMarketingPromotion(cliente.nombre, productos));
            setLoading(false);
        })();
    }, [cliente, trabajos]);

    const handleWhatsApp = () => {
        const tel = (cliente.telefono[0] || '').replace(/\D/g, '');
        window.open(`https://wa.me/593${tel.slice(-9)}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, ...S.card, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.divider}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ ...S.h2, fontSize: 17 }}>Mensaje de reenganche</h2>
                    <button onClick={onClose} style={{ ...S.softBtn, padding: '6px 10px' }}>Cerrar</button>
                </div>
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {loading ? (
                        <p style={{ padding: '32px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.2em' }}>Generando propuesta…</p>
                    ) : (
                        <>
                            <div style={{ ...S.card, background: C.bg, padding: 18, fontSize: 14, color: C.body, lineHeight: 1.6 }}>“{message}”</div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <button style={{ ...S.primaryBtn, background: '#1B6E3E', flex: 1, justifyContent: 'center' }} onClick={handleWhatsApp}>Enviar por WhatsApp</button>
                                <button style={{ ...S.outlineBtn, flex: 1, justifyContent: 'center' }} onClick={() => { navigator.clipboard.writeText(message); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                                    {copied ? 'Copiado' : 'Copiar texto'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Formulario de cliente ──────────────────────────────────────────────────
const ClientFormModal: React.FC<{ open: boolean; onClose: () => void; onSave: (c: Partial<Cliente>) => void; clientToEdit: Partial<Cliente> }> = ({ open, onClose, onSave, clientToEdit }) => {
    const [f, setF] = useState<Partial<Cliente>>({});
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [idError, setIdError] = useState('');

    useEffect(() => { if (clientToEdit) { setF(clientToEdit); setIdError(''); } }, [clientToEdit]);

    const lookup = async (id: string) => {
        if (id.length < 10) return;
        if (!validarIdentificacionEC(id)) { setIdError('Identificación inválida'); return; }
        setIdError('');
        setIsLookingUp(true);
        try {
            const data = await sriLookupService.lookupByRuc(id);
            if (data) setF(prev => ({ ...prev, nombre: data.razon_social, direccion: data.direccion || prev.direccion, regimen: (data.regimen as Regimen) || prev.regimen }));
        } catch (e) { console.error('Lookup error', e); }
        finally { setIsLookingUp(false); }
    };

    if (!open) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
            <form onSubmit={e => { e.preventDefault(); onSave(f); }} style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, ...S.card, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.divider}`, background: C.surfaceAlt }}>
                    <h2 style={{ ...S.h2, fontSize: 17 }}>{f.id ? 'Editar cliente' : 'Registrar cliente'}</h2>
                </div>
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>
                    <label style={{ display: 'block' }}>
                        <span style={S.fieldLabel}>Cédula / RUC</span>
                        <div style={{ position: 'relative' }}>
                            <input value={f.id || ''} onChange={e => { const v = e.target.value; setF({ ...f, id: v }); if (v.length >= 10) lookup(v); }}
                                style={{ ...S.input, fontFamily: MONO, ...(idError ? { borderColor: '#FBD5D5', background: '#FEF2F2' } : {}) }} />
                            {isLookingUp && <span style={{ position: 'absolute', right: 12, top: 12, fontSize: 11, color: C.royal }}>…</span>}
                        </div>
                        {idError && <span style={{ fontSize: 11, color: '#B91C1C', marginTop: 4, display: 'block' }}>{idError}</span>}
                    </label>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Nombre / razón social</span>
                        <input value={f.nombre || ''} onChange={e => setF({ ...f, nombre: e.target.value })} style={S.input} required /></label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Teléfono</span>
                            <input value={f.telefono?.[0] || ''} onChange={e => setF({ ...f, telefono: [e.target.value] })} style={S.input} /></label>
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Correo</span>
                            <input type="email" value={f.email || ''} onChange={e => setF({ ...f, email: e.target.value })} style={S.input} /></label>
                    </div>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Régimen</span>
                        <select value={f.regimen || Regimen.NEGOCIO_POPULAR} onChange={e => setF({ ...f, regimen: e.target.value as Regimen })} style={{ ...S.input, cursor: 'pointer' }}>
                            {Object.values(Regimen).map(r => <option key={r} value={r}>{r}</option>)}
                        </select></label>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                        <button type="button" onClick={onClose} style={S.softBtn}>Cancelar</button>
                        <button type="submit" style={S.primaryBtn}>{f.id ? 'Actualizar' : 'Registrar'}</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const ClientesPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: any }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { clientes, trabajos, loading, addCliente, updateCliente } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Partial<Cliente>>({});
    const [marketingClient, setMarketingClient] = useState<Cliente | null>(null);

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.id.includes(q)).sort((a, b) => b.id.localeCompare(a.id));
    }, [clientes, searchTerm]);

    const handleSave = async (c: Partial<Cliente>) => {
        if (clientes.find(x => x.id === c.id)) {
            await updateCliente(c.id!, c);
            logActivity(currentUser.nombre, currentUser.rol, 'EDITAR_CLIENTE', `Actualizado: ${c.nombre}`, 'Entidades');
        } else {
            await addCliente(c as Cliente);
            logActivity(currentUser.nombre, currentUser.rol, 'CREAR_CLIENTE', `Registrado: ${c.nombre}`, 'Entidades');
        }
        setIsFormOpen(false);
    };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Directorio de Clientes · Imprenta Córdova" />
            <div style={S.wrap}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Entidades</p>
                        <h1 style={S.h1}>Directorio de Clientes</h1>
                    </div>
                    <button style={S.primaryBtn} onClick={() => { setClientToEdit({}); setIsFormOpen(true); }}>Registrar cliente</button>
                </div>

                <div style={{ ...S.card, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nombre, RUC o cédula…"
                        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13.5, color: C.ink, fontFamily: 'inherit' }} />
                </div>

                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando clientes…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ ...S.card, padding: 48, textAlign: 'center' }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Sin clientes</p>
                        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>Registra el primer cliente para comenzar.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
                        {filtered.map(c => {
                            const jobs = trabajos.filter(t => t.clienteId === c.id);
                            const last = [...jobs].sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime())[0];
                            return (
                                <div key={c.id} style={{ ...S.card, padding: '18px 20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>{c.nombre}</div>
                                            <div style={{ fontSize: 12, fontFamily: MONO, color: C.faint, marginTop: 3 }}>{c.id}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            <button style={{ ...S.softBtn, padding: '6px 10px', fontSize: 11.5 }} onClick={() => setMarketingClient(c)}>Promo IA</button>
                                            <button style={{ ...S.softBtn, padding: '6px 10px', fontSize: 11.5 }} onClick={() => { setClientToEdit(c); setIsFormOpen(true); }}>Editar</button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 12.5, color: C.body, marginTop: 10 }}>{c.regimen}</div>
                                    <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{(c.telefono || []).join(' · ') || 'Sin teléfono'}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.rowLine}` }}>
                                        <span style={{ fontSize: 12, color: C.faint }}>
                                            {last ? `${last.subtipo || last.tipo} · ${formatDate(last.fechaEntrada)}` : `${jobs.length} órdenes`}
                                        </span>
                                        {last && <span style={{ fontSize: 13, fontFamily: MONO, fontWeight: 600, color: C.royal }}>{formatCurrency(last.total)}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ClientFormModal open={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSave} clientToEdit={clientToEdit} />
            {marketingClient && <MarketingIAModal cliente={marketingClient} trabajos={trabajos} onClose={() => setMarketingClient(null)} />}
        </div>
    );
};

export default ClientesPage;
