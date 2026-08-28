import React, { useState, useEffect, useMemo } from 'react';
import {
    logTransaction, getFinancialLedger, getLedgerBalance, purgeOldTransactions,
    FinancialEntry, TransactionType,
} from '../services/financialLedgerService';
import { formatCurrency, formatDate } from '../utils';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/activityLogService';
import { User } from '../types';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

const ITEMS_PER_PAGE = 30;

// ── Modal de nueva operación ────────────────────────────────────────────────
const TransactionFormModal: React.FC<{
    onClose: () => void;
    onSave: (tipo: TransactionType, monto: number, detalle: string) => void;
}> = ({ onClose, onSave }) => {
    const [tipo, setTipo] = useState<TransactionType>('INGRESO');
    const [monto, setMonto] = useState('');
    const [detalle, setDetalle] = useState('');

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const m = parseFloat(monto);
        if (isNaN(m) || m <= 0 || !detalle.trim()) return;
        onSave(tipo, m, detalle.trim());
        onClose();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
            <form onSubmit={submit} style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, ...S.card, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surfaceAlt }}>
                    <h2 style={{ ...S.h2, fontSize: 17 }}>Nueva operación</h2>
                    <button type="button" onClick={onClose} style={{ ...S.softBtn, padding: '6px 10px' }}>Cerrar</button>
                </div>
                <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {(['INGRESO', 'EGRESO'] as TransactionType[]).map(v => {
                            const on = tipo === v;
                            const ing = v === 'INGRESO';
                            return (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setTipo(v)}
                                    style={{
                                        padding: '12px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                        border: `1px solid ${on ? (ing ? '#D8E8DC' : '#FBD5D5') : C.borderStrong}`,
                                        background: on ? (ing ? '#F2F7F2' : '#FEF2F2') : '#fff',
                                        color: on ? (ing ? C.success : '#B91C1C') : C.faint,
                                    }}
                                >{ing ? 'Ingreso' : 'Egreso'}</button>
                            );
                        })}
                    </div>
                    <label style={{ display: 'block' }}>
                        <span style={S.fieldLabel}>Monto</span>
                        <input type="number" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" autoFocus required
                            style={{ ...S.input, fontFamily: MONO, fontSize: 18 }} />
                    </label>
                    <label style={{ display: 'block' }}>
                        <span style={S.fieldLabel}>Detalle</span>
                        <textarea value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Motivo de la transacción…" required
                            style={{ ...S.input, height: 90, resize: 'none' }} />
                    </label>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={S.softBtn}>Cancelar</button>
                        <button type="submit" style={S.primaryBtn}>Registrar operación</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const CuentasPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const [ledger, setLedger] = useState<FinancialEntry[]>([]);
    const [balance, setBalance] = useState({ ingresos: 0, egresos: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('');
    const [page, setPage] = useState(0);
    const [showForm, setShowForm] = useState(false);

    const refreshData = async () => {
        setLoading(true);
        await purgeOldTransactions();
        const data = await getFinancialLedger();
        setLedger([...data].reverse());
        setBalance(await getLedgerBalance());
        setLoading(false);
    };
    useEffect(() => { refreshData(); }, []);

    const filtered = useMemo(() => {
        let r = ledger;
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            r = r.filter(e => e.detalle.toLowerCase().includes(q) || e.usuario.toLowerCase().includes(q) || e.hash.includes(q));
        }
        if (filterType) r = r.filter(e => e.tipo === filterType);
        return r;
    }, [ledger, searchTerm, filterType]);

    const paginated = useMemo(() => filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE), [filtered, page]);
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    const handleAdd = (tipo: TransactionType, monto: number, detalle: string) => {
        logTransaction(tipo, monto, detalle, currentUser.nombre);
        logActivity(currentUser.nombre, currentUser.rol, 'FINANZAS_MODIFICADA', `Registró ${tipo.toLowerCase()} manual: ${detalle}`, 'Finanzas');
        refreshData();
    };

    const handleExportCSV = () => {
        const header = 'Fecha,Hora,Tipo,Monto,Detalle,Usuario,Firma\n';
        const rows = filtered.map(e => `${new Date(e.timestamp).toLocaleDateString('es-EC')},${new Date(e.timestamp).toLocaleTimeString('es-EC')},${e.tipo},${e.monto},"${e.detalle}",${e.usuario},${e.hash}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `cartera_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const kpis = [
        { l: 'Ingresos', v: formatCurrency(balance.ingresos), c: C.success },
        { l: 'Egresos', v: formatCurrency(balance.egresos), c: '#B91C1C' },
        { l: 'Balance neto', v: formatCurrency(balance.total), c: balance.total >= 0 ? C.royal : '#B91C1C' },
    ];

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Cuentas por Cobrar · Imprenta Córdova" />
            <div style={S.wrap}>

                {/* Cabecera */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Finanzas</p>
                        <h1 style={S.h1}>Cuentas por Cobrar</h1>
                    </div>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                        <button style={S.outlineBtn} onClick={handleExportCSV}>Exportar historial</button>
                        <button style={S.primaryBtn} onClick={() => setShowForm(true)}>Nueva operación</button>
                    </div>
                </div>

                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>
                    {kpis.map(k => (
                        <div key={k.l} style={{ ...S.card, borderRadius: 14, padding: '17px 19px' }}>
                            <div style={S.colHead}>{k.l}</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', color: k.c, marginTop: 8, lineHeight: 1 }}>{k.v}</div>
                        </div>
                    ))}
                    <div style={{ ...S.accentCard, borderRadius: 14, padding: '17px 19px' }}>
                        <div style={{ ...S.colHead, color: '#93A0C8' }}>Movimientos</div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 600, letterSpacing: '-.04em', marginTop: 8, lineHeight: 1 }}>{ledger.length}</div>
                    </div>
                </div>

                {/* Controles + lista */}
                <div style={{ ...S.card, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <h2 style={S.h2}>Movimientos</h2>
                        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 13px', background: C.softGray, border: `1px solid ${C.border}`, borderRadius: 9, minWidth: 220 }}>
                                <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                                <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0); }} placeholder="Buscar transacción o usuario…"
                                    style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: C.ink, fontFamily: 'inherit' }} />
                            </div>
                            <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }}
                                style={{ ...S.input, width: 'auto', padding: '9px 13px', fontSize: 12.5, cursor: 'pointer' }}>
                                <option value="">Todos</option>
                                <option value="INGRESO">Ingresos</option>
                                <option value="EGRESO">Egresos</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando cartera…</div>
                    ) : paginated.length === 0 ? (
                        <div style={{ padding: 48, textAlign: 'center' }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Historial vacío</p>
                            <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>No hay movimientos en la ventana actual.</p>
                        </div>
                    ) : paginated.map(e => {
                        const ing = e.tipo === 'INGRESO';
                        return (
                            <div key={e.id} style={{ padding: '14px 20px', borderBottom: `1px solid ${C.rowLine}`, display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 14, alignItems: 'center' }}>
                                <span style={{ padding: '3px 9px', borderRadius: 7, fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', ...(ing ? { background: '#F2F7F2', color: C.success } : { background: '#FEF2F2', color: '#B91C1C' }) }}>
                                    {ing ? 'INGRESO' : 'EGRESO'}
                                </span>
                                <span style={{ minWidth: 0 }}>
                                    <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.detalle}</span>
                                    <span style={{ display: 'block', fontSize: 11, color: C.ghost, fontFamily: MONO, marginTop: 2 }}>firma {e.hash} · {e.usuario.split(' ')[0]}</span>
                                </span>
                                <span style={{ fontSize: 12, color: C.faint, fontFamily: MONO }}>
                                    {formatDate(e.timestamp)} {new Date(e.timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span style={{ fontSize: 14, fontFamily: MONO, fontWeight: 600, color: ing ? C.success : '#B91C1C', whiteSpace: 'nowrap' }}>
                                    {ing ? '+ ' : '− '}{formatCurrency(e.monto)}
                                </span>
                            </div>
                        );
                    })}

                    {totalPages > 1 && (
                        <div style={{ padding: '14px 20px', background: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12.5, color: C.muted }}>Página {page + 1} de {totalPages}</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button disabled={page === 0} onClick={() => { setPage(p => p - 1); window.scrollTo(0, 0); }}
                                    style={{ ...S.outlineBtn, padding: '8px 15px', fontSize: 12.5, opacity: page === 0 ? 0.4 : 1 }}>Anterior</button>
                                <button disabled={page >= totalPages - 1} onClick={() => { setPage(p => p + 1); window.scrollTo(0, 0); }}
                                    style={{ ...S.outlineBtn, padding: '8px 15px', fontSize: 12.5, opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Siguiente</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showForm && <TransactionFormModal onClose={() => setShowForm(false)} onSave={handleAdd} />}
        </div>
    );
};

export default CuentasPage;
