import React, { useState } from 'react';
import { sriLookupService, SriRucData } from '../../services/sriLookupService';
import { generateWhatsAppLink } from '../../utils';

/**
 * Tarjeta "Consulta de RUC" — fiel a `Publica-B-Vitrina.dc.html` (Claude Design).
 * Conserva la consulta real al padrón SRI de El Oro (`sriLookupService`).
 */

const C = {
    ink: '#0A1140', royal: '#16309B', border: '#E4E8F4', borderStrong: '#D7DDF0',
    divider: '#EEF0F8', body: '#3C4763', muted: '#5B6480', faint: '#8A93AE', bg: '#F7F9FF',
};
const DISPLAY = "'Outfit',sans-serif";
const MONO = "'JetBrains Mono',monospace";

function reglasDeRegimen(regimenStr?: string) {
    const raw = (regimenStr || '').toUpperCase();
    if (raw.includes('POPULAR')) {
        return { nombre: 'RIMPE Negocio Popular', comprobante: 'Nota de venta', producto: 'Talonario de notas de venta (100 juegos)' };
    }
    if (raw.includes('EMPRENDEDOR')) {
        return { nombre: 'RIMPE Emprendedor', comprobante: 'Factura', producto: 'Talonario de facturas autorizadas' };
    }
    return { nombre: 'Régimen General', comprobante: 'Factura', producto: 'Talonario de facturas con copia autocopiativa' };
}

export const RucValidatorWidget: React.FC = () => {
    const [ruc, setRuc] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SriRucData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const clean = ruc.trim().replace(/\D/g, '');
        if (clean.length < 10) {
            setError('Ingrese un RUC de 13 dígitos o una cédula de 10.');
            setResult(null);
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await sriLookupService.lookupByRuc(clean);
            if (data) setResult(data);
            else setError('No encontramos ese número en el padrón local de El Oro. Escríbanos por WhatsApp y lo verificamos.');
        } catch (err) {
            console.error(err);
            setError('No pudimos consultar el padrón en este momento. Intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const reglas = result ? reglasDeRegimen(result.regimen) : null;
    const activo = (result?.estado_contribuyente || '').toUpperCase().includes('ACTIVO');

    const rows = result && reglas ? [
        { k: 'Razón social', v: result.razon_social },
        { k: 'Régimen', v: reglas.nombre },
        { k: 'Estado', v: result.estado_contribuyente || '—' },
        { k: 'Comprobante autorizado', v: reglas.comprobante },
    ] : [
        { k: 'Razón social', v: '—' },
        { k: 'Régimen', v: '—' },
        { k: 'Estado', v: '—' },
        { k: 'Comprobante autorizado', v: '—' },
    ];

    return (
        <div style={{ background: '#fff', borderRadius: 18, padding: '30px 32px', color: C.ink, boxShadow: '0 40px 80px -40px rgba(0,0,0,.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 18, borderBottom: `1px solid ${C.divider}` }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700 }}>Consulta de RUC</div>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.faint }}>padrón SRI</span>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <input
                    value={ruc}
                    onChange={e => setRuc(e.target.value.replace(/\D/g, '').slice(0, 13))}
                    placeholder="0701234567001"
                    inputMode="numeric"
                    style={{ flex: 1, minWidth: 0, padding: '14px 16px', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 11, fontSize: 14.5, fontFamily: MONO, color: C.ink, outline: 'none' }}
                />
                <button type="submit" disabled={loading}
                    style={{ padding: '14px 20px', background: C.royal, color: '#fff', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1 }}>
                    {loading ? 'Consultando…' : 'Consultar'}
                </button>
            </form>

            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 1, background: C.divider, border: `1px solid ${C.divider}`, borderRadius: 12, overflow: 'hidden' }}>
                {rows.map(r => (
                    <div key={r.k} style={{ background: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <span style={{ fontSize: 12.5, color: C.muted, flexShrink: 0 }}>{r.k}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: r.v === '—' ? C.faint : C.ink, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.v}</span>
                    </div>
                ))}
            </div>

            {error && (
                <div style={{ marginTop: 18, padding: '14px 16px', background: '#FFFBEB', border: '1px solid #F4E3A8', borderRadius: 11, fontSize: 13, lineHeight: 1.6, color: '#7A5A00' }}>
                    {error}
                </div>
            )}

            {result && reglas && (
                <>
                    <div style={{
                        marginTop: 18, padding: '14px 16px', borderRadius: 11, fontSize: 13, lineHeight: 1.6,
                        ...(activo
                            ? { background: '#F2F7F2', border: '1px solid #D8E8DC', color: '#1B6E3E' }
                            : { background: '#FEF2F2', border: '1px solid #FBD5D5', color: '#B91C1C' }),
                    }}>
                        {activo
                            ? `Contribuyente activo. Puede imprimir ${reglas.comprobante.toLowerCase()}.`
                            : 'El contribuyente no figura activo en el padrón. Consúltenos antes de imprimir.'}
                    </div>
                    <a
                        href={generateWhatsAppLink('593993083943', `Hola, validé mi RUC ${result.ruc} (${reglas.nombre}) en su web. Quiero cotizar: ${reglas.producto}.`)}
                        target="_blank" rel="noreferrer"
                        style={{ display: 'block', marginTop: 12, textAlign: 'center', padding: 12, background: C.royal, color: '#fff', borderRadius: 11, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                    >
                        Cotizar por WhatsApp
                    </a>
                </>
            )}
        </div>
    );
};

export default RucValidatorWidget;
