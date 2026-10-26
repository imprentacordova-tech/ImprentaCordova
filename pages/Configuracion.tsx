import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { User, SriCredential } from '../types';
import Papa from 'papaparse';
import { backendFetch } from '../services/backendApi';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

const DEFAULT_CONFIG = {
    emisorRazonSocial: 'IMPRENTA CÓRDOVA', emisorRuc: '1104212564001',
    emisorEstablecimiento: '001', emisorPuntoEmision: '001', secuencialInicio: 1,
    imprentaNombre: 'IMPRENTA CÓRDOVA', imprentaRuc: '1104212564001',
    imprentaAutorizacion: '1111', imprentaTelefono: '0987654321', googleScriptUrl: '',
};

const Field: React.FC<{ label: string; value: any; onChange: (v: string) => void; maxLength?: number; type?: string }> = ({ label, value, onChange, maxLength, type = 'text' }) => (
    <label style={{ display: 'block' }}>
        <span style={S.fieldLabel}>{label}</span>
        <input type={type} value={value ?? ''} maxLength={maxLength} onChange={e => onChange(e.target.value)} style={S.input} />
    </label>
);

const ConfiguracionPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { config: cloudConfig, updateConfig, sriCredentials, deleteSriCredential, bulkAddSriCredentials, seedCatalog, syncing } = useData();

    const [localConfig, setLocalConfig] = useState<any>(cloudConfig || DEFAULT_CONFIG);
    const [showSuccess, setShowSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [isImportingSri, setIsImportingSri] = useState(false);
    const [sriImportProgress, setSriImportProgress] = useState(0);

    const fileRef = useRef<HTMLInputElement>(null);
    const sriFileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (cloudConfig) setLocalConfig(cloudConfig); }, [cloudConfig]);

    const flash = () => { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); };
    const set = (k: string, v: any) => setLocalConfig((c: any) => ({ ...c, [k]: v }));

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateConfig(localConfig);
            logActivity(currentUser.nombre, currentUser.rol, 'CONFIG_ACTUALIZADA', 'Actualizó la configuración general', 'Sistema');
            flash();
        } catch (err) { console.error('Error al guardar config:', err); }
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length < 2) return;
            const delimiter = lines[0].includes(';') ? ';' : ',';
            const headers = lines[0].toLowerCase().split(delimiter).map(h => h.trim().replace(/"/g, ''));
            let idxUser = headers.indexOf('username');
            let idxPass = headers.indexOf('password');
            let idxName = headers.indexOf('name');
            if (idxUser === -1 && headers.length >= 4) { idxName = 0; idxUser = 2; idxPass = 3; }

            const creds: SriCredential[] = [];
            lines.slice(1).forEach(line => {
                const parts: string[] = [];
                let cur = '', inQ = false;
                for (const ch of line) {
                    if (ch === '"') inQ = !inQ;
                    else if (ch === delimiter && !inQ) { parts.push(cur); cur = ''; }
                    else cur += ch;
                }
                parts.push(cur);
                if (parts.length > Math.max(idxUser, idxPass)) {
                    const raw = parts[idxUser]?.trim() || '';
                    const m13 = raw.match(/\b\d{13}\b/); const m10 = raw.match(/\b\d{10}\b/);
                    const ruc = m13 ? m13[0] : (m10 ? m10[0] : raw.replace(/\D/g, ''));
                    const pass = parts[idxPass]?.trim() || '';
                    const name = parts[idxName]?.trim() || '';
                    if ((ruc.length === 10 || ruc.length === 13) && pass) {
                        creds.push({ ruc, password: pass, origen: name || 'Importado CSV', updatedAt: new Date().toISOString() });
                    }
                }
            });
            if (creds.length > 0) {
                await bulkAddSriCredentials(creds);
                logActivity(currentUser.nombre, currentUser.rol, 'CREDENTIALS_IMPORT', `Importó ${creds.length} credenciales SRI`, 'Seguridad');
                flash();
            }
        } catch (err) { console.error('Error importando CSV:', err); }
        finally { setIsImporting(false); e.target.value = ''; }
    };

    const handleImportSriPadron = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImportingSri(true);
        setSriImportProgress(0);

        // SEGURIDAD: la service_role vive SOLO en el backend (Render).
        // El cliente parsea el CSV en streaming para dar progreso y envía lotes;
        // nunca ve la clave. Antes esta función instanciaba createClient() con la
        // service_role hardcodeada, que terminaba publicada en el bundle de Vercel.
        const TAMANO_LOTE = 500;
        let batch: any[] = [];
        let totalProcessed = 0;
        let totalImportados = 0;
        let lotesFallidos = 0;

        const enviarLote = async (lote: any[]) => {
            if (lote.length === 0) return;
            try {
                const r = await backendFetch<{ insertados: number }>(
                    '/api/v1/padron/importar',
                    { registros: lote },
                    { timeoutMs: 60000, etiqueta: 'Padrón' }
                );
                totalImportados += r.insertados ?? 0;
            } catch (err) {
                lotesFallidos++;
                console.error('Error importando lote del padrón:', err);
            }
        };

        Papa.parse(file, {
            header: true, skipEmptyLines: true,
            step: async (row, parser) => {
                parser.pause();
                const d: any = row.data;
                const ruc = d['NUMERO_RUC']?.trim();
                const razon = d['RAZON_SOCIAL']?.trim();
                if (ruc && razon && !batch.some(i => i.ruc === ruc)) {
                    batch.push({
                        ruc, razon_social: razon,
                        estado_contribuyente: d['ESTADO_CONTRIBUYENTE']?.trim() || null,
                        tipo_persona: d['TIPO_CONTRIBUYENTE']?.trim() || null,
                        provincia: d['DESCRIPCION_PROVINCIA_EST']?.trim() || null,
                        canton: d['DESCRIPCION_CANTON_EST']?.trim() || null,
                        parroquia: d['DESCRIPCION_PARROQUIA_EST']?.trim() || null,
                        actividad_economica: d['ACTIVIDAD_ECONOMICA']?.trim() || null,
                    });
                }
                totalProcessed++;
                if (batch.length >= TAMANO_LOTE) {
                    const lote = batch;
                    batch = [];
                    await enviarLote(lote);
                    setSriImportProgress(totalProcessed);
                }
                parser.resume();
            },
            complete: async () => {
                await enviarLote(batch);
                await logActivity(
                    currentUser.nombre, currentUser.rol, 'SRI_PADRON_IMPORT',
                    `Importó padrón SRI (${totalImportados} registros${lotesFallidos ? `, ${lotesFallidos} lote(s) fallidos` : ''})`,
                    'Sistema'
                );
                setIsImportingSri(false);
                flash();
                if (e.target) e.target.value = '';
            },
            error: (err) => { console.error('Error parsing padrón:', err); setIsImportingSri(false); },
        });
    };

    const toggleVisible = (ruc: string) => setVisiblePasswords(prev => {
        const n = new Set(prev);
        n.has(ruc) ? n.delete(ruc) : n.add(ruc);
        return n;
    });

    const filteredCreds = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return (sriCredentials || []).filter(c => c.ruc.includes(searchTerm) || (c.origen || '').toLowerCase().includes(q)).slice(0, 50);
    }, [sriCredentials, searchTerm]);

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Configuración General · Imprenta Córdova" />
            <div style={S.wrap}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Sistema</p>
                        <h1 style={S.h1}>Configuración General</h1>
                    </div>
                    {showSuccess && (
                        <span style={{ padding: '7px 13px', background: '#F2F7F2', color: C.success, border: '1px solid #D8E8DC', borderRadius: 9, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>Guardado</span>
                    )}
                </div>

                {/* Extensión */}
                <div style={{ ...S.accentCard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ ...S.colHead, color: '#93A0C8' }}>Herramienta oficial · Chrome v2.1</div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, letterSpacing: '-.03em', marginTop: 4 }}>Extensión SRI Solicitador Córdova</div>
                        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#93A0C8', maxWidth: 520, lineHeight: 1.6 }}>
                            Automatiza comprobantes SRI, formatos de impresión A4 y auto-registro sincronizado con la plataforma.
                        </p>
                    </div>
                    <a href="/extension-cordova.zip" download="extension-cordova.zip" style={{ ...S.primaryBtn, background: '#1B6E3E', textDecoration: 'none', flexShrink: 0 }}>Descargar (.ZIP)</a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, alignItems: 'start' }}>

                    {/* Formulario general */}
                    <div style={{ gridColumn: 'span 2', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ ...S.card, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                            <div>
                                <h2 style={{ ...S.h2, fontSize: 16 }}>Catálogo maestro</h2>
                                <p style={{ margin: '3px 0 0', fontSize: 12.5, color: C.muted }}>Sincroniza los productos predeterminados.</p>
                            </div>
                            <button style={S.outlineBtn} disabled={syncing}
                                onClick={async () => {
                                    if (window.confirm('¿Sincronizar el catálogo maestro?')) {
                                        try { await seedCatalog(); logActivity(currentUser.nombre, currentUser.rol, 'CATALOG_SYNC', 'Sincronizó catálogo', 'Sistema'); } catch (err) { console.error(err); }
                                    }
                                }}>{syncing ? 'Sincronizando…' : 'Restaurar catálogo'}</button>
                        </div>

                        <form onSubmit={handleSaveGeneral} style={{ ...S.card, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <h2 style={{ ...S.h2, fontSize: 16 }}>Identidad fiscal</h2>
                                    <Field label="Razón social" value={localConfig.emisorRazonSocial} onChange={v => set('emisorRazonSocial', v)} />
                                    <Field label="RUC emisor" value={localConfig.emisorRuc} onChange={v => set('emisorRuc', v)} maxLength={13} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <Field label="Establecimiento" value={localConfig.emisorEstablecimiento} onChange={v => set('emisorEstablecimiento', v)} maxLength={3} />
                                        <Field label="Punto emisión" value={localConfig.emisorPuntoEmision} onChange={v => set('emisorPuntoEmision', v)} maxLength={3} />
                                    </div>
                                    <Field label="Secuencial inicio" type="number" value={localConfig.secuencialInicio} onChange={v => set('secuencialInicio', parseInt(v) || 1)} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <h2 style={{ ...S.h2, fontSize: 16 }}>Perfil de imprenta</h2>
                                    <Field label="Nombre comercial" value={localConfig.imprentaNombre} onChange={v => set('imprentaNombre', v)} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <Field label="RUC taller" value={localConfig.imprentaRuc} onChange={v => set('imprentaRuc', v)} maxLength={13} />
                                        <Field label="Autorización" value={localConfig.imprentaAutorizacion} onChange={v => set('imprentaAutorizacion', v)} maxLength={4} />
                                    </div>
                                    <Field label="Teléfono de contacto" value={localConfig.imprentaTelefono} onChange={v => set('imprentaTelefono', v)} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: `1px solid ${C.divider}` }}>
                                <button type="submit" style={S.primaryBtn}>Guardar cambios</button>
                            </div>
                        </form>
                    </div>

                    {/* Bóveda SRI */}
                    <div style={{ ...S.card, overflow: 'hidden', minWidth: 0 }}>
                        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.divider}` }}>
                            <h2 style={{ ...S.h2, fontSize: 16 }}>Claves SRI</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                                <input type="file" ref={fileRef} onChange={handleImportCSV} style={{ display: 'none' }} accept=".csv" />
                                <button style={S.outlineBtn} disabled={isImporting} onClick={() => fileRef.current?.click()}>{isImporting ? 'Importando…' : 'Importar claves (Chrome)'}</button>
                                <input type="file" ref={sriFileRef} onChange={handleImportSriPadron} style={{ display: 'none' }} accept=".csv" />
                                <button style={S.primaryBtn} disabled={isImportingSri} onClick={() => sriFileRef.current?.click()}>
                                    {isImportingSri ? `Procesando (${sriImportProgress})` : 'Actualizar padrón SRI'}
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.divider}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 10 }}>
                                <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar RUC o cliente…"
                                    style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: C.ink, fontFamily: 'inherit' }} />
                            </div>
                        </div>
                        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 460, overflowY: 'auto' }}>
                            {filteredCreds.map(c => (
                                <div key={c.ruc} style={{ ...S.card, background: C.bg, padding: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.origen || 'Cliente anónimo'}</div>
                                            <div style={{ fontSize: 11, fontFamily: MONO, color: C.faint, marginTop: 2 }}>{c.ruc}</div>
                                        </div>
                                        <button style={{ ...S.softBtn, padding: '4px 8px', fontSize: 11, background: '#FEF2F2', color: '#B91C1C' }}
                                            onClick={() => { if (window.confirm(`¿Eliminar credencial ${c.ruc}?`)) deleteSriCredential(c.ruc); }}>Quitar</button>
                                    </div>
                                    <button style={{ ...S.softBtn, width: '100%', marginTop: 8, justifyContent: 'space-between', background: '#fff', border: `1px solid ${C.border}` }}
                                        onClick={() => toggleVisible(c.ruc)}>
                                        <span style={{ fontFamily: MONO, fontSize: 12 }}>{visiblePasswords.has(c.ruc) ? c.password : '••••••••'}</span>
                                        <span style={{ fontSize: 11, color: C.faint }}>{visiblePasswords.has(c.ruc) ? 'ocultar' : 'ver'}</span>
                                    </button>
                                </div>
                            ))}
                            {filteredCreds.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: C.muted, fontSize: 12.5 }}>Sin credenciales.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionPage;
