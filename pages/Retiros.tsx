import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Trabajo, TrabajoEstado, User } from '../types';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import { notifyOrderReadyForPickupEmail } from '../services/emailNotificationService';
// La definición de "rezagado" y el texto del recordatorio viven en services/recordatorios.ts
// porque el backend manda el mismo mensaje por correo, solo, cada día. Antes el 48 estaba
// escrito acá a mano y el texto se armaba en línea: dos copias que se podían separar.
import { esRezagadoDeRetiro, diasEnVitrina, mensajeRecordatorio } from '../services/recordatorios';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';
import ModalDespachoEntrega from '../components/orders/ModalDespachoEntrega';
import QrScannerModal from '../components/orders/QrScannerModal';

const horasEn = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3600000));
const diasEn = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

type FiltroVitrina = 'TODOS' | 'CON_SALDO' | 'PAGADOS' | 'REZAGADOS';

const RetirosPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { trabajos, clientes, loading, updateTrabajoStatus } = useData();

    // Modal de Despacho Pro
    const [selected, setSelected] = useState<Trabajo | null>(null);

    // Búsqueda y Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filtro, setFiltro] = useState<FiltroVitrina>('TODOS');
    const [expressPin, setExpressPin] = useState('');
    const [expressError, setExpressError] = useState<string | null>(null);
    const [foundNonVitrina, setFoundNonVitrina] = useState<Trabajo | null>(null);
    const [scannerOpen, setScannerOpen] = useState(false);

    // Búsqueda express por PIN / QR / Orden / Cédula / Teléfono
    const handleExpressLookup = (e?: React.FormEvent, pinOverride?: string) => {
        if (e) e.preventDefault();
        setExpressError(null);
        setFoundNonVitrina(null);

        let pin = (pinOverride ?? expressPin).trim().toLowerCase();
        // El QR del recibo trae el link de rastreo (…/#/tracking?q=<id u orden>).
        const desdeQr = pin.match(/[?&](?:q|orden)=([^&#\s]+)/);
        if (desdeQr) pin = decodeURIComponent(desdeQr[1]);
        pin = pin.replace(/^#|^ord-/, '');
        // "000123" (como sale impreso) = orden 123. Solo para el número: las cédulas empiezan con 0.
        const pinOrden = pin.replace(/^0+(?=\d)/, '');
        if (!pin) return;

        /*
         * Coincidencia EXACTA (número de orden, id completo, cédula/RUC; teléfono solo con
         * 7+ dígitos). Antes valía `endsWith` / `includes`: "12" abría la #112 o cualquier
         * orden cuyo UUID contuviera "12", y se podía cobrar y entregar la equivocada.
         */
        const coincide = (t: Trabajo, conTelefono: boolean) => {
            if (String(t.orden) === pinOrden || t.id.toLowerCase() === pin) return true;
            const cli = clientes.find(c => c.id === t.clienteId);
            if (!cli) return false;
            if (cli.ruc === pin || cli.cedula === pin) return true;
            return conTelefono && pin.length >= 7 && (cli.telefono || []).some(tel => tel.replace(/\D/g, '').endsWith(pin));
        };

        // 1. Buscar primero en vitrina
        const enVitrina = (trabajos ?? [])
            .filter(t => t.estado === TrabajoEstado.VITRINA)
            .filter(t => coincide(t, true));
        const porNumero = enVitrina.find(t => String(t.orden) === pinOrden || t.id.toLowerCase() === pin);
        if (!porNumero && enVitrina.length > 1) {
            setExpressError(`Ese cliente tiene ${enVitrina.length} órdenes en vitrina (#${enVitrina.map(t => t.orden).join(', #')}). Ingresá el número de orden.`);
            return;
        }
        const matchVitrina = porNumero || enVitrina[0];

        if (matchVitrina) {
            setSelected(matchVitrina);
            setExpressPin('');
            return;
        }

        // 2. ¿Existe en otro estado del flujo (Proceso, Diseño, Pendiente)?
        const otroEstado = (trabajos ?? []).find(t => coincide(t, false));

        if (otroEstado) {
            if (otroEstado.estado === TrabajoEstado.ENTREGADO) {
                setExpressError(`La orden #${otroEstado.orden} ya fue entregada y despachada anteriormente.`);
            } else {
                setFoundNonVitrina(otroEstado);
            }
        } else {
            setExpressError(`No se encontró ninguna orden con el código o número '${pin}'.`);
        }
    };

    // Extrae el identificador de orden desde el texto de un QR (URL, "orden=X", o el propio N°).
    const extraerOrden = (texto: string): string => {
        const limpio = (texto || '').trim();
        const mUrl = limpio.match(/[?&]orden=([^&\s]+)/i);
        if (mUrl) return mUrl[1];
        const mOrden = limpio.match(/orden[=:]\s*([0-9a-zA-Z-]+)/i);
        if (mOrden) return mOrden[1];
        const mPin = limpio.match(/(\d{3,})/);
        if (mPin) return mPin[1];
        return limpio;
    };

    // Detectado por la cámara: cierra el escáner y ejecuta la búsqueda express.
    const handleQrDetect = (texto: string) => {
        const pin = extraerOrden(texto);
        setScannerOpen(false);
        setExpressPin(pin);
        handleExpressLookup(undefined, pin);
    };

    // Adelantar orden de Proceso a Vitrina para entrega express en mostrador
    const handleAdelantarYEntregar = async (t: Trabajo) => {
        try {
            await updateTrabajoStatus(t.id, TrabajoEstado.VITRINA, currentUser.nombre || 'Operador');
            setSelected({ ...t, estado: TrabajoEstado.VITRINA });
            setFoundNonVitrina(null);
            setExpressPin('');
        } catch (err) {
            console.error('Error al adelantar orden:', err);
            alert('No se pudo adelantar el estado de la orden.');
        }
    };

    // Filtrado de trabajos en vitrina
    const vitrinaList = useMemo(() => {
        return (trabajos ?? []).filter(t => t.estado === TrabajoEstado.VITRINA);
    }, [trabajos]);

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase().trim();
        const nombreDe = new Map(clientes.map(c => [c.id, c.nombre.toLowerCase()]));

        return vitrinaList.filter(t => {
            // Filtro de texto
            const matchesQuery = q === '' ||
                String(t.orden).includes(q) ||
                (nombreDe.get(t.clienteId) || '').includes(q) ||
                (t.subtipo || '').toLowerCase().includes(q) ||
                (t.tipo || '').toLowerCase().includes(q);

            if (!matchesQuery) return false;

            // Filtro por pestañas
            if (filtro === 'CON_SALDO') return (t.saldo || 0) > 0;
            if (filtro === 'PAGADOS') return (t.saldo || 0) <= 0;
            if (filtro === 'REZAGADOS') return esRezagadoDeRetiro(t, Date.now());

            return true;
        });
    }, [vitrinaList, clientes, searchTerm, filtro]);

    // Métricas en vivo del módulo de Despacho
    const metrics = useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10);
        const entregadosHoy = (trabajos ?? []).filter(t => {
            if (t.estado !== TrabajoEstado.ENTREGADO) return false;
            const fEntrega = (t.fechaEntrega || t.updated_at || '')?.slice(0, 10);
            return fEntrega === todayStr;
        });

        const totalPorCobrar = vitrinaList.reduce((acc, t) => acc + (t.saldo || 0), 0);
        const rezagados = vitrinaList.filter(t => esRezagadoDeRetiro(t, Date.now())).length;
        const totalCobradoRetirosHoy = entregadosHoy.reduce((acc, t) => {
            // Cobrado al retirar = lo que faltaba menos lo que quedó a crédito.
            const liquidado = (t.total || 0) - (t.abono || 0) - (t.saldo || 0);
            return acc + (liquidado > 0 ? liquidado : 0);
        }, 0);

        return {
            enVitrina: vitrinaList.length,
            totalPorCobrar,
            rezagados,
            entregadosHoyCount: entregadosHoy.length,
            totalCobradoRetirosHoy,
        };
    }, [vitrinaList, trabajos]);

    // Avisar al cliente por WhatsApp que el trabajo está listo
    const notifyClient = (t: Trabajo) => {
        const cliente = clientes.find(c => c.id === t.clienteId);
        if (cliente?.email) {
            notifyOrderReadyForPickupEmail({
                clienteNombre: cliente.nombre,
                clienteEmail: cliente.email,
                ordenNumero: t.orden || t.id,
                servicioNombre: t.subtipo || t.tipo || 'Impresión de Documentos',
                montoTotal: t.total || 0,
                montoAbono: t.abono || 0,
                montoSaldo: t.saldo || 0,
            }).catch(e => console.error('Error email listo:', e));
        }

        if (!cliente?.telefono?.length) {
            alert('Notificación por correo enviada. El cliente no tiene teléfono registrado para WhatsApp.');
            return;
        }

        const message = mensajeRecordatorio(
            {
                clienteNombre: cliente.nombre,
                orden: t.orden,
                servicio: t.subtipo || t.tipo || 'Impresión de Documentos',
                saldo: t.saldo || 0,
            },
            diasEnVitrina(t, Date.now())
        );
        window.open(generateWhatsAppLink(cliente.telefono[0], message), '_blank');
    };

    // Cliente del trabajo seleccionado para el modal
    const selectedCliente = useMemo(() => {
        if (!selected) return null;
        return clientes.find(c => c.id === selected.clienteId) || null;
    }, [selected, clientes]);

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Despacho y Entregas · Imprenta Córdova" />
            <div style={S.wrap}>

                {/* Cabecera Principal */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Operaciones de Mostrador</p>
                        <h1 style={S.h1}>Despacho y Entregas Express</h1>
                        <p style={S.lead}>Control de vitrina, cobro rápido de saldos y emisión instantánea de comprobantes de retiro.</p>
                    </div>
                </div>

                {/* Buscador Express PIN / QR */}
                <form onSubmit={handleExpressLookup} style={{
                    padding: '16px 20px', borderRadius: 16, background: '#0A1140', color: '#fff',
                    border: '1px solid rgba(255,198,26,0.35)', boxShadow: '0 10px 25px -5px rgba(10,17,64,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,198,26,0.2)', color: '#FFC61A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                            ⚡
                        </span>
                        <div>
                            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#FFC61A' }}>
                                ESCÁNER QR · PIN DE ORDEN
                            </div>
                            <div style={{ fontSize: 13, color: '#CAD5F5', marginTop: 2 }}>
                                Ingrese el N° de orden, escanee el ticket QR o busque por RUC/teléfono
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, maxWidth: 380, minWidth: 260 }}>
                        <input
                            value={expressPin}
                            onChange={(e) => { setExpressPin(e.target.value); setExpressError(null); setFoundNonVitrina(null); }}
                            placeholder="N° orden (ej: 4821) o RUC/teléfono…"
                            style={{
                                flex: 1, padding: '11px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)',
                                background: 'rgba(255,255,255,0.09)', color: '#fff', fontSize: 13.5, outline: 'none',
                                fontFamily: MONO
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setScannerOpen(true)}
                            title="Escanear QR con la cámara"
                            style={{
                                padding: '11px 13px', borderRadius: 10, background: 'rgba(255,255,255,0.14)',
                                border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 16, cursor: 'pointer',
                                fontFamily: 'inherit', flexShrink: 0,
                            }}
                        >
                            📷
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '11px 20px', borderRadius: 10, background: '#FFC61A', color: '#0A1140',
                                border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6
                            }}
                        >
                            <span>🚀</span>
                            <span>Abrir Despacho</span>
                        </button>
                    </div>
                </form>

                {/* Alerta de Error */}
                {expressError && (
                    <div style={{ padding: '12px 18px', borderRadius: 12, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.dangerText, fontSize: 13 }}>
                        ⚠️ {expressError}
                    </div>
                )}

                {/* Alerta Proactiva: Orden encontrada en Taller/Proceso con botón para adelantar */}
                {foundNonVitrina && (
                    <div style={{
                        background: '#FFFBEB',
                        border: '1.5px solid #FCD34D',
                        borderRadius: 14,
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 26 }}>⚡</span>
                            <div>
                                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#92400E' }}>
                                    Orden #{foundNonVitrina.orden} encontrada en estado '{foundNonVitrina.estado}'
                                </div>
                                <div style={{ fontSize: 12.5, color: '#B45309', marginTop: 3 }}>
                                    Cliente: <strong>{foundNonVitrina.titular}</strong> · {foundNonVitrina.subtipo || foundNonVitrina.tipo} · Saldo: {formatCurrency(foundNonVitrina.saldo)}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#78350F', marginTop: 2 }}>
                                    ¿El cliente se encuentra físicamente en el local para retirar? Puedes avanzar la orden directamente a Vitrina.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={() => handleAdelantarYEntregar(foundNonVitrina)}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: 10,
                                    background: '#16A34A',
                                    color: '#fff',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                                }}
                            >
                                <span>⚡</span>
                                <span>Pasar a Vitrina y Entregar Ahora</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFoundNonVitrina(null)}
                                style={{ padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid #D97706', color: '#92400E', fontSize: 12.5, cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Cuatro Tarjetas Bento de Métricas en Vivo */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div style={{ ...S.card, borderRadius: 14, padding: '14px 18px', borderLeft: `4px solid ${C.royal}` }}>
                        <div style={S.colHead}>En Vitrina para Retiro</div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: '-.03em', color: C.ink, marginTop: 4 }}>
                            {metrics.enVitrina} <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>pedidos</span>
                        </div>
                    </div>

                    <div style={{ ...S.card, borderRadius: 14, padding: '14px 18px', borderLeft: `4px solid #16A34A` }}>
                        <div style={S.colHead}>Saldo Total por Cobrar</div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: '-.03em', color: '#15803D', marginTop: 4 }}>
                            {formatCurrency(metrics.totalPorCobrar)}
                        </div>
                    </div>

                    <div style={{ ...S.card, borderRadius: 14, padding: '14px 18px', borderLeft: `4px solid ${metrics.rezagados > 0 ? '#B45309' : C.borderStrong}` }}>
                        <div style={S.colHead}>Rezagados (&gt; 48h)</div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: '-.03em', color: metrics.rezagados > 0 ? '#B45309' : C.ink, marginTop: 4 }}>
                            {metrics.rezagados} <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>requieren llamada</span>
                        </div>
                        {/* El aviso automático lo manda el backend por correo a las 48 h y
                            después insiste cada 7 días. Se dice acá para que el operador
                            sepa que esos pedidos ya no dependen de que él abra la pantalla. */}
                        <div style={{ fontSize: 10.5, color: C.faint, marginTop: 5, fontWeight: 600 }}>
                            El sistema ya les recuerda por correo
                        </div>
                    </div>

                    <div style={{ ...S.card, borderRadius: 14, padding: '14px 18px', borderLeft: `4px solid #0F2B48` }}>
                        <div style={S.colHead}>Retirados Hoy</div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: '-.03em', color: C.ink, marginTop: 4 }}>
                            {metrics.entregadosHoyCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#16A34A' }}>+{formatCurrency(metrics.totalCobradoRetirosHoy)}</span>
                        </div>
                    </div>
                </div>

                {/* Barra de Filtros + Búsqueda por Texto */}
                <div style={{ ...S.card, borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    {/* Pestañas de Filtro */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                            { id: 'TODOS', label: `Todos (${vitrinaList.length})` },
                            { id: 'CON_SALDO', label: 'Con Saldo por Cobrar' },
                            { id: 'PAGADOS', label: 'Pagados ($0)' },
                            { id: 'REZAGADOS', label: `Rezagados > 48h (${metrics.rezagados})` },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setFiltro(tab.id as FiltroVitrina)}
                                style={{
                                    padding: '7px 13px',
                                    borderRadius: 9,
                                    border: 'none',
                                    fontSize: 12,
                                    fontWeight: filtro === tab.id ? 700 : 500,
                                    background: filtro === tab.id ? C.royal : C.softGray,
                                    color: filtro === tab.id ? '#FFFFFF' : C.body,
                                    cursor: 'pointer',
                                    transition: 'all .15s ease',
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Input de Búsqueda rápida */}
                    <div style={{ flex: 1, minWidth: 220, maxWidth: 340, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 10 }}>
                        <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Filtrar por cliente, orden o tipo…"
                            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: C.ink, fontFamily: 'inherit' }}
                        />
                    </div>
                </div>

                {/* Listado de Trabajos en Vitrina */}
                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>
                        Cargando vitrina de entregas…
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ ...S.card, padding: 48, textAlign: 'center' }}>
                        <span style={{ fontSize: 32 }}>📦</span>
                        <p style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 8 }}>No hay órdenes en vitrina con los filtros actuales</p>
                        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                            {searchTerm ? 'Intenta borrar el término de búsqueda.' : 'Todos los pedidos listos ya fueron despachados o no coinciden con este filtro.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map(t => {
                            const cli = clientes.find(c => c.id === t.clienteId);
                            const horas = horasEn(t.fechaEntrada);
                            const dias = diasEn(t.fechaEntrada);
                            const pagado = (t.saldo || 0) <= 0;
                            const esRezagado = esRezagadoDeRetiro(t, Date.now());

                            return (
                                <div
                                    key={t.id}
                                    style={{
                                        ...S.card,
                                        padding: '16px 20px',
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                                        gap: 16,
                                        alignItems: 'center',
                                        borderLeft: esRezagado ? '4px solid #D97706' : (pagado ? '4px solid #16A34A' : `4px solid ${C.royal}`),
                                    }}
                                >
                                    {/* Columna 1: Orden y Cliente */}
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 13, fontFamily: MONO, fontWeight: 700, color: C.ink }}>
                                                #{String(t.orden).padStart(4, '0')}
                                            </span>
                                            {t.esSRI && (
                                                <span style={{ fontSize: 9.5, fontWeight: 800, background: C.gold, color: C.ink, padding: '2px 6px', borderRadius: 5 }}>
                                                    SRI TAX
                                                </span>
                                            )}
                                            <span style={{
                                                padding: '3px 8px',
                                                borderRadius: 99,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                background: pagado ? '#DCFCE7' : '#FEF2F2',
                                                color: pagado ? '#166534' : '#B91C1C',
                                            }}>
                                                {pagado ? '✓ Totalmente Pagado' : `Saldo: ${formatCurrency(t.saldo)}`}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {cli ? cli.nombre : t.titular}
                                        </div>
                                        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>
                                            {t.subtipo || t.detalle || t.tipo || 'Trabajo listo'}
                                            {t.cantidad ? ` · ${t.cantidad} ${t.esSRI ? 'juegos' : 'u.'}` : ''}
                                        </div>
                                    </div>

                                    {/* Columna 2: Tiempo en Vitrina */}
                                    <div>
                                        <div style={S.colHead}>Listo en Vitrina</div>
                                        <div style={{ fontSize: 13.5, color: C.ink, marginTop: 4, fontWeight: 600 }}>
                                            {formatDate(t.fechaEntrada)}
                                        </div>
                                        <div style={{ fontSize: 11.5, color: esRezagado ? '#B45309' : C.faint, fontWeight: esRezagado ? 700 : 500, marginTop: 2 }}>
                                            {esRezagado ? `⚠️ Esperando retiro hace ${dias} días` : `Hace ${horas} horas`}
                                        </div>
                                    </div>

                                    {/* Columna 3: Montos Financieros */}
                                    <div>
                                        <div style={S.colHead}>Liquidación</div>
                                        <div style={{ fontSize: 13.5, color: C.ink, marginTop: 4, fontFamily: MONO }}>
                                            Total: <strong>{formatCurrency(t.total)}</strong>
                                        </div>
                                        <div style={{ fontSize: 12, color: pagado ? '#16A34A' : '#B91C1C', fontFamily: MONO, fontWeight: 700, marginTop: 2 }}>
                                            {pagado ? 'Saldo: $0.00' : `Por cobrar: ${formatCurrency(t.saldo)}`}
                                        </div>
                                    </div>

                                    {/* Columna 4: Botones de Acción */}
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={() => notifyClient(t)}
                                            style={{
                                                ...S.softBtn,
                                                padding: '10px 14px',
                                                fontSize: 12.5,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                            title="Enviar mensaje de WhatsApp informando que el pedido está listo para retiro"
                                        >
                                            <span>📱</span>
                                            <span>Avisar Retiro</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setSelected(t)}
                                            style={{
                                                ...S.primaryBtn,
                                                padding: '10px 16px',
                                                fontSize: 13,
                                                fontWeight: 700,
                                                background: pagado ? C.royal : '#16A34A',
                                                boxShadow: pagado ? 'none' : '0 4px 12px rgba(22,163,74,0.3)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}
                                        >
                                            <span>🚀</span>
                                            <span>{pagado ? 'Entregar Pedido' : `Entregar y Cobrar`}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Escáner QR por cámara */}
            <QrScannerModal
                isOpen={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onDetect={handleQrDetect}
            />

            {/* Modal de Despacho & Entrega Pro */}
            {selected && (
                <ModalDespachoEntrega
                    isOpen={!!selected}
                    onClose={() => setSelected(null)}
                    trabajo={selected}
                    cliente={selectedCliente}
                    currentUser={currentUser}
                    onEntregaExitosa={() => {
                        // Se actualiza en el DataContext automáticamente
                        setSelected(null);
                    }}
                />
            )}
        </div>
    );
};

export default RetirosPage;
