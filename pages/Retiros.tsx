import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Trabajo, TrabajoEstado, User } from '../types';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../utils';
import { BottomSheet } from '../components/BottomSheet';
import PhotoCapture from '../components/orders/PhotoCapture';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { SEO } from '../components/SEO';
import { notifyOrderReadyForPickupEmail, notifyOrderDeliveredEmail } from '../services/emailNotificationService';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

const diasEn = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const RetirosPage: React.FC = () => {
    const auth = useAuth();
    const outletContext = useOutletContext<{ currentUser?: User }>() || {};
    const currentUser = outletContext.currentUser || auth.user;
    const { trabajos, clientes, loading, registerRetiro, uploadFile } = useData();
    const [selected, setSelected] = useState<Trabajo | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [retiroPhoto, setRetiroPhoto] = useState<File | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const { width, height } = useWindowSize();

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase().trim();
        const nombreDe = new Map(clientes.map(c => [c.id, c.nombre.toLowerCase()]));
        return (trabajos ?? [])
            .filter(t => t.estado === TrabajoEstado.VITRINA)
            .filter(t => q === '' || String(t.orden).includes(q) || (nombreDe.get(t.clienteId) || '').includes(q) || (t.subtipo || '').toLowerCase().includes(q));
    }, [trabajos, clientes, searchTerm]);

    const totals = useMemo(() => ({
        count: filtered.length,
        totalSaldo: filtered.reduce((a, t) => a + (t.saldo || 0), 0),
    }), [filtered]);

    const handleConfirmRetiro = async (pagoFinal: number) => {
        if (!selected || isProcessing) return;
        setIsProcessing(true);
        try {
            let photoUrl = '';
            if (retiroPhoto) photoUrl = await uploadFile(retiroPhoto, 'trabajos', `${selected.id}/retiro_${Date.now()}`);
            await registerRetiro(selected.id, pagoFinal, currentUser.nombre, photoUrl);

            const cliente = clientes.find(c => c.id === selected.clienteId);
            if (cliente?.email) {
                notifyOrderDeliveredEmail({
                    clienteNombre: cliente.nombre,
                    clienteEmail: cliente.email,
                    ordenNumero: selected.orden || selected.id,
                    servicioNombre: selected.subtipo || selected.tipo || 'Impresión de Documentos',
                    montoTotal: selected.total || 0,
                    montoAbono: selected.abono || 0,
                    montoSaldo: pagoFinal,
                    fechaRetiro: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                }).catch(e => console.error('Error email de retiro:', e));
            }
            setIsSuccess(true);
            setIsProcessing(false);
            setSelected(null);
        } catch (error) {
            console.error('Error al registrar despacho:', error);
            alert('Error al procesar el despacho. Intente de nuevo.');
            setIsProcessing(false);
        }
    };

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
        const saldoMsg = t.saldo > 0 ? `Saldo pendiente: ${formatCurrency(t.saldo)}.` : 'Su pedido se encuentra pagado.';
        const message = `Hola ${cliente.nombre}, Imprenta Córdova le informa que su pedido #${t.orden} (${t.subtipo || t.tipo}) está listo para retirar. ${saldoMsg}`;
        window.open(generateWhatsAppLink(cliente.telefono[0], message), '_blank');
    };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Despacho y Entregas · Imprenta Córdova" />
            <div style={S.wrap}>

                {/* Cabecera */}
                <div>
                    <p style={S.eyebrow}>Operaciones</p>
                    <h1 style={S.h1}>Despacho y Entregas</h1>
                    <p style={S.lead}>Trabajos listos esperando retiro. Cobre el saldo y marque la entrega.</p>
                </div>

                {/* Resumen + búsqueda */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ ...S.card, borderRadius: 14, padding: '14px 18px', minWidth: 170 }}>
                        <div style={S.colHead}>Por entregar</div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, letterSpacing: '-.04em', color: C.ink, marginTop: 6 }}>{totals.count}</div>
                    </div>
                    <div style={{ ...S.card, borderRadius: 14, padding: '14px 18px', minWidth: 170 }}>
                        <div style={S.colHead}>Saldo por cobrar</div>
                        <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600, letterSpacing: '-.04em', color: C.success, marginTop: 6 }}>{formatCurrency(totals.totalSaldo)}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', ...S.card, borderRadius: 14 }}>
                        <span style={{ color: C.faint, fontSize: 13 }}>⌕</span>
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar por cliente, N° de orden o producto…"
                            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.ink, fontFamily: 'inherit' }}
                        />
                    </div>
                </div>

                {/* Lista */}
                {loading ? (
                    <div style={{ padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando vitrina…</div>
                ) : filtered.length === 0 ? (
                    <div style={{ ...S.card, padding: 48, textAlign: 'center' }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Vitrina de entregas vacía</p>
                        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>No hay órdenes pendientes de retiro.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map(t => {
                            const cli = clientes.find(c => c.id === t.clienteId);
                            const dias = diasEn(t.fechaEntrada);
                            const pagado = t.saldo <= 0;
                            return (
                                <div key={t.id} style={{ ...S.card, padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, alignItems: 'center' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 12, fontFamily: MONO, color: C.faint }}>#{String(t.orden).padStart(4, '0')}</span>
                                            <span style={{ padding: '4px 9px', borderRadius: 99, fontSize: 11.5, fontWeight: 700, ...(pagado ? { background: '#F2F7F2', color: C.success } : { background: '#FFFBEB', color: '#7A5A00' }) }}>
                                                {pagado ? 'Pagado' : formatCurrency(t.saldo)}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginTop: 6 }}>{cli ? cli.nombre : t.titular}</div>
                                        <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{t.subtipo || t.detalle || t.tipo || 'Trabajo listo'}</div>
                                    </div>
                                    <div>
                                        <div style={S.colHead}>Listo desde</div>
                                        <div style={{ fontSize: 14, color: C.ink, marginTop: 4 }}>
                                            {formatDate(t.fechaEntrada)}{dias > 10 ? ` · hace ${dias} d` : ''}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={S.colHead}>Monto total</div>
                                        <div style={{ fontSize: 14, color: C.ink, marginTop: 4, fontFamily: MONO }}>{formatCurrency(t.total)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button style={S.softBtn} onClick={() => notifyClient(t)}>Avisar</button>
                                        <button style={S.primaryBtn} onClick={() => { setSelected(t); setRetiroPhoto(null); setShowCamera(false); }}>Entregar y cobrar</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Confirmación */}
            <BottomSheet isOpen={!!selected} onClose={() => setSelected(null)} title="Confirmar entrega y cobro">
                {selected && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '4px 0 24px' }}>
                        <div style={{ background: '#FEF2F2', border: '1px solid #FBD5D5', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                            <span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase', color: '#B91C1C' }}>Saldo a cobrar hoy</span>
                            <span style={{ display: 'block', fontFamily: DISPLAY, fontSize: 34, fontWeight: 700, letterSpacing: '-.04em', color: '#B91C1C', marginTop: 4 }}>{formatCurrency(selected.saldo)}</span>
                        </div>
                        <div style={{ background: C.chipBlue, border: `1px solid ${C.borderStrong}`, borderRadius: 12, padding: 14, fontSize: 12.5, color: C.body, lineHeight: 1.6 }}>
                            Al confirmar, la orden pasa a estado <strong>Entregado</strong> y se genera el recibo o comprobante final.
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Foto de respaldo (opcional)</span>
                                <button style={{ ...S.softBtn, padding: '6px 10px', fontSize: 11.5 }} onClick={() => setShowCamera(v => !v)}>
                                    {showCamera ? 'Cerrar cámara' : 'Tomar foto'}
                                </button>
                            </div>
                            {showCamera && (
                                <div style={{ aspectRatio: '16 / 9', width: '100%', background: C.softGray, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                                    <PhotoCapture onImageCaptured={(file) => setRetiroPhoto(file)} />
                                </div>
                            )}
                            {retiroPhoto && !showCamera && (
                                <p style={{ fontSize: 12, color: C.success, marginTop: 6 }}>Foto lista para adjuntar.</p>
                            )}
                        </div>

                        <button
                            onClick={() => handleConfirmRetiro(selected.saldo)}
                            disabled={isProcessing}
                            style={{ ...S.primaryBtn, width: '100%', justifyContent: 'center', padding: 14, fontSize: 14, opacity: isProcessing ? 0.5 : 1 }}
                        >
                            {isProcessing ? 'Procesando entrega…' : 'Confirmar entrega y registrar pago'}
                        </button>
                        <button style={{ ...S.softBtn, alignSelf: 'center', background: 'transparent' }} onClick={() => setSelected(null)}>Cancelar</button>
                    </div>
                )}
            </BottomSheet>

            {isSuccess && (
                <Confetti width={width} height={height} recycle={false} numberOfPieces={300} onConfettiComplete={() => setIsSuccess(false)} />
            )}
        </div>
    );
};

export default RetirosPage;
