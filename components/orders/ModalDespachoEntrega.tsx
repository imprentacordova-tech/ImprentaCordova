import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Trabajo, Cliente, User } from '../../types';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../../utils';
import { useData } from '../../contexts/DataContext';
import { logActivity } from '../../services/activityLogService';
import { notifyOrderDeliveredEmail } from '../../services/emailNotificationService';
import PhotoCapture from './PhotoCapture';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../panelTheme';

export type MetodoPagoEntrega = 'Efectivo' | 'Deuna' | 'Transferencia' | 'Tarjeta' | 'Credito';

export interface ModalDespachoEntregaProps {
    isOpen: boolean;
    onClose: () => void;
    trabajo: Trabajo;
    cliente?: Cliente | null;
    currentUser: User | { nombre: string; rol?: string };
    onEntregaExitosa?: (trabajoActualizado: Trabajo) => void;
}

const DATOS_BANCARIOS = {
    banco: 'Banco Pichincha',
    tipo: 'Cuenta Corriente',
    numero: '2100234567',
    titular: 'Imprenta Córdova Cía. Ltda.',
    ruc: '0102030405001',
    correo: 'pagos@imprentacordova.net',
};

export const ModalDespachoEntrega: React.FC<ModalDespachoEntregaProps> = ({
    isOpen,
    onClose,
    trabajo,
    cliente,
    currentUser,
    onEntregaExitosa,
}) => {
    const { registerRetiro, uploadFile } = useData();
    const { width, height } = useWindowSize();

    // Pasos: 'cobro' (formulario de liquidación) o 'exito' (comprobante post-entrega)
    const [paso, setPaso] = useState<'cobro' | 'exito'>('cobro');

    // Estado financiero
    const saldoInicial = useMemo(() => Math.max(0, trabajo.saldo || 0), [trabajo]);
    const [montoCobrado, setMontoCobrado] = useState<number>(saldoInicial);
    const [metodoPago, setMetodoPago] = useState<MetodoPagoEntrega>('Efectivo');
    const [pagaCon, setPagaCon] = useState<string>('');
    const [comprobanteRef, setComprobanteRef] = useState<string>('');

    // Estado del receptor
    const clienteNombre = cliente?.nombre || trabajo.titular || 'Cliente';
    const clienteCedula = cliente?.cedula || cliente?.ruc || '';
    const [receptorTipo, setReceptorTipo] = useState<'titular' | 'tercero'>('titular');
    const [receptorNombre, setReceptorNombre] = useState<string>(clienteNombre);
    const [receptorCedula, setReceptorCedula] = useState<string>(clienteCedula);
    const [receptorRelacion, setReceptorRelacion] = useState<string>('');

    // Foto / Respaldo
    const [fotoRetiro, setFotoRetiro] = useState<File | null>(null);
    const [showCamera, setShowCamera] = useState<boolean>(false);

    // Estados de UI
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copiadoBanco, setCopiadoBanco] = useState<boolean>(false);
    const [deliveredJob, setDeliveredJob] = useState<Trabajo | null>(null);

    // Sincronizar cuando cambia el trabajo
    useEffect(() => {
        if (isOpen) {
            setPaso('cobro');
            setMontoCobrado(Math.max(0, trabajo.saldo || 0));
            setMetodoPago('Efectivo');
            setPagaCon('');
            setComprobanteRef('');
            setReceptorTipo('titular');
            setReceptorNombre(cliente?.nombre || trabajo.titular || 'Cliente');
            setReceptorCedula(cliente?.cedula || cliente?.ruc || '');
            setReceptorRelacion('');
            setFotoRetiro(null);
            setShowCamera(false);
            setIsProcessing(false);
            setErrorMsg(null);
            setCopiadoBanco(false);
            setDeliveredJob(null);
        }
    }, [isOpen, trabajo, cliente]);

    // Cuando conmuta entre titular y tercero
    const handleToggleReceptor = (tipo: 'titular' | 'tercero') => {
        setReceptorTipo(tipo);
        if (tipo === 'titular') {
            setReceptorNombre(clienteNombre);
            setReceptorCedula(clienteCedula);
            setReceptorRelacion('');
        } else {
            setReceptorNombre('');
            setReceptorCedula('');
            setReceptorRelacion('Mensajero / Familiar');
        }
    };

    // Cálculos de vuelto en efectivo
    const pagaConNum = useMemo(() => {
        const val = parseFloat(pagaCon.replace(',', '.'));
        return isNaN(val) ? 0 : val;
    }, [pagaCon]);

    const vueltoCalculado = useMemo(() => {
        if (metodoPago !== 'Efectivo' || pagaConNum <= 0) return 0;
        return Math.max(0, pagaConNum - montoCobrado);
    }, [metodoPago, pagaConNum, montoCobrado]);

    const faltaEfectivo = useMemo(() => {
        if (metodoPago !== 'Efectivo' || pagaConNum <= 0) return 0;
        return Math.max(0, montoCobrado - pagaConNum);
    }, [metodoPago, pagaConNum, montoCobrado]);

    // Copiar datos bancarios al portapapeles
    const handleCopiarDatosBancarios = () => {
        const texto = `*Datos para Transferencia - Imprenta Córdova*\n• Banco: ${DATOS_BANCARIOS.banco} (${DATOS_BANCARIOS.tipo})\n• Cta: ${DATOS_BANCARIOS.numero}\n• Titular: ${DATOS_BANCARIOS.titular}\n• RUC: ${DATOS_BANCARIOS.ruc}\n• Correo: ${DATOS_BANCARIOS.correo}`;
        navigator.clipboard?.writeText(texto).then(() => {
            setCopiadoBanco(true);
            setTimeout(() => setCopiadoBanco(false), 2500);
        });
    };

    // Procesar la entrega
    const handleConfirmarEntrega = async () => {
        if (isProcessing) return;
        setErrorMsg(null);

        if (!receptorNombre.trim()) {
            setErrorMsg('Por favor ingrese el nombre de la persona que retira el pedido.');
            return;
        }

        setIsProcessing(true);
        try {
            let photoUrl = '';
            if (fotoRetiro) {
                photoUrl = await uploadFile(fotoRetiro, 'trabajos', `${trabajo.id}/retiro_${Date.now()}`);
            }

            // Construir nota de entrega para trazabilidad
            const notas = [
                `Receptor: ${receptorNombre.trim()} ${receptorCedula ? `(CI: ${receptorCedula.trim()})` : ''}`,
                receptorRelacion ? `Parentesco/Cargo: ${receptorRelacion}` : null,
                `Cobro: ${formatCurrency(montoCobrado)} vía ${metodoPago}`,
                comprobanteRef ? `Ref: ${comprobanteRef.trim()}` : null,
            ].filter(Boolean).join(' · ');

            const updated = await registerRetiro(
                trabajo.id,
                montoCobrado,
                currentUser.nombre || 'Operador',
                photoUrl,
                notas
            );

            // Registro de auditoría
            await logActivity(
                currentUser.nombre || 'Operador',
                currentUser.rol || 'Operador',
                'RETIRO_PROCESADO',
                `Orden #${trabajo.orden} entregada a ${receptorNombre} (${metodoPago} ${formatCurrency(montoCobrado)})`,
                'Despacho'
            );

            // Notificación por correo si el cliente tiene email registrado
            if (cliente?.email) {
                notifyOrderDeliveredEmail({
                    clienteNombre: cliente.nombre,
                    clienteEmail: cliente.email,
                    ordenNumero: trabajo.orden || trabajo.id,
                    servicioNombre: trabajo.subtipo || trabajo.tipo || 'Impresión de Documentos',
                    montoTotal: trabajo.total || 0,
                    montoAbono: trabajo.abono || 0,
                    montoSaldo: montoCobrado,
                    fechaRetiro: new Date().toLocaleDateString('es-EC', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                    }),
                }).catch(e => console.error('Error enviando email de retiro:', e));
            }

            setDeliveredJob(updated);
            setPaso('exito');
            if (onEntregaExitosa) {
                onEntregaExitosa(updated);
            }
        } catch (err: any) {
            console.error('Error al registrar retiro:', err);
            setErrorMsg('Error al registrar la entrega. Verifique la conexión e intente de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Compartir comprobante por WhatsApp
    const handleEnviarWhatsApp = () => {
        const telefono = cliente?.telefono?.[0];
        if (!telefono) {
            alert('El cliente no tiene un teléfono registrado para WhatsApp.');
            return;
        }

        const msg = [
            `¡Hola *${clienteNombre}*! 👋`,
            `Le confirmamos que su pedido *#${trabajo.orden}* (${trabajo.tipo || 'Trabajo de Imprenta'}) ha sido *ENTREGADO EXITOSAMENTE* en nuestro local.`,
            ``,
            `📋 *Detalles de la Entrega:*`,
            `• Retirado por: ${receptorNombre} ${receptorCedula ? `(CI: ${receptorCedula})` : ''}`,
            `• Valor liquidado: ${formatCurrency(montoCobrado)} (${metodoPago})`,
            `• Fecha y hora: ${new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            ``,
            `¡Agradecemos mucho su preferencia y confianza en *Imprenta Córdova*! 🤝🖨️`,
            `_Cualquier consulta estamos siempre a su orden._`
        ].join('\n');

        window.open(generateWhatsAppLink(telefono, msg), '_blank');
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(12px, 3vw, 24px)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-despacho-title"
        >
            <style>{PANEL_KEYFRAMES}</style>

            {/* Fondo oscuro con desenfoque */}
            <div
                onClick={() => {
                    if (paso === 'exito') onClose();
                }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: C.scrim,
                    backdropFilter: 'blur(4px)',
                    animation: 'pi-fade-in .25s ease both',
                }}
            />

            {/* Modal Principal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: 640,
                    maxHeight: '92vh',
                    background: '#FFFFFF',
                    borderRadius: 20,
                    boxShadow: '0 25px 60px -15px rgba(10,17,64,0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: `1px solid ${C.border}`,
                    zIndex: 1,
                }}
            >
                {/* Cabecera Estilo Marino & Oro */}
                <div style={{ background: C.ink, padding: '16px 22px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: paso === 'exito' ? 'rgba(34,197,94,0.2)' : 'rgba(255,198,26,0.18)',
                            color: paso === 'exito' ? '#4ADE80' : C.gold,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            flexShrink: 0
                        }}>
                            {paso === 'exito' ? '✓' : '🚀'}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: C.gold }}>
                                    {paso === 'exito' ? 'DESPACHO COMPLETADO' : 'CAJA RÁPIDA · DESPACHO'}
                                </span>
                                <span style={{ fontFamily: MONO, fontSize: 13, color: '#fff', fontWeight: 700 }}>
                                    #{String(trabajo.orden).padStart(4, '0')}
                                </span>
                            </div>
                            <h2 id="modal-despacho-title" style={{ margin: '2px 0 0', fontFamily: DISPLAY, fontSize: 18, fontWeight: 700, color: '#fff' }}>
                                {paso === 'exito' ? '¡Orden Entregada con Éxito!' : 'Entregar y Cobrar Pedido'}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Cerrar ventana"
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            color: '#CAD5F5',
                            fontSize: 16,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Resumen Superior de Orden */}
                <div style={{ padding: '12px 22px', background: C.softGray, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {clienteNombre}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span>{trabajo.subtipo || trabajo.tipo || 'Trabajo General'}</span>
                            {trabajo.cantidad ? <span>· {trabajo.cantidad} {trabajo.esSRI ? 'juegos' : 'u.'}</span> : null}
                            {cliente?.telefono?.[0] ? <span style={{ fontFamily: MONO }}>· 📞 {cliente.telefono[0]}</span> : null}
                        </div>
                    </div>

                    {/* Badge de Estado Financiero */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.08em' }}>Total</div>
                            <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.ink }}>{formatCurrency(trabajo.total)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.08em' }}>Abonado</div>
                            <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.success }}>{formatCurrency(trabajo.abono)}</div>
                        </div>
                        <div style={{
                            padding: '6px 12px',
                            borderRadius: 10,
                            background: saldoInicial > 0 ? '#FEF2F2' : '#F0FDF4',
                            border: `1px solid ${saldoInicial > 0 ? '#FECACA' : '#BBF7D0'}`,
                            textAlign: 'right',
                        }}>
                            <div style={{ fontSize: 9.5, fontWeight: 800, color: saldoInicial > 0 ? '#B91C1C' : '#15803D', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                                {saldoInicial > 0 ? 'Saldo a Cobrar' : 'Pagado'}
                            </div>
                            <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: saldoInicial > 0 ? '#B91C1C' : '#15803D' }}>
                                {formatCurrency(saldoInicial)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenido con Scroll */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* ============================================================== */}
                    {/* PASO 1: FORMULARIO DE LIQUIDACIÓN Y RECEPTOR                   */}
                    {/* ============================================================== */}
                    {paso === 'cobro' && (
                        <>
                            {errorMsg && (
                                <div style={{ padding: '10px 14px', borderRadius: 10, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.dangerText, fontSize: 12.5 }}>
                                    ⚠️ {errorMsg}
                                </div>
                            )}

                            {/* SECCIÓN 1: PAGO Y COBRANZA (Si hay saldo) */}
                            {saldoInicial > 0 ? (
                                <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 15 }}>💳</span>
                                            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.ink }}>
                                                Método de Pago del Saldo
                                            </span>
                                        </div>
                                        <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 700, color: '#B91C1C' }}>
                                            Monto: {formatCurrency(montoCobrado)}
                                        </span>
                                    </div>

                                    {/* Selector de Métodos de Pago */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: 8, marginBottom: 14 }}>
                                        {(['Efectivo', 'Deuna', 'Transferencia', 'Tarjeta', 'Credito'] as MetodoPagoEntrega[]).map((m) => {
                                            const activo = metodoPago === m;
                                            const etiquetas: Record<MetodoPagoEntrega, { icon: string; label: string }> = {
                                                Efectivo: { icon: '💵', label: 'Efectivo' },
                                                Deuna: { icon: '📱', label: 'Deuna!' },
                                                Transferencia: { icon: '🏦', label: 'Transf.' },
                                                Tarjeta: { icon: '💳', label: 'Tarjeta' },
                                                Credito: { icon: '🤝', label: 'A Crédito' },
                                            };
                                            return (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => setMetodoPago(m)}
                                                    style={{
                                                        padding: '10px 8px',
                                                        borderRadius: 10,
                                                        border: `1.5px solid ${activo ? C.royal : C.border}`,
                                                        background: activo ? '#EEF2FF' : C.bg,
                                                        color: activo ? C.royal : C.body,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        cursor: 'pointer',
                                                        transition: 'all .15s ease',
                                                    }}
                                                >
                                                    <span style={{ fontSize: 18 }}>{etiquetas[m].icon}</span>
                                                    <span style={{ fontSize: 11.5, fontWeight: activo ? 800 : 600 }}>{etiquetas[m].label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Subsección: Calculadora de Efectivo y Vuelto */}
                                    {metodoPago === 'Efectivo' && (
                                        <div style={{ background: '#F8FAFC', border: `1px solid ${C.borderStrong}`, borderRadius: 12, padding: 14 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: C.faint, letterSpacing: '.08em' }}>
                                                    Calculadora de Vuelto
                                                </span>
                                                {/* Botones de billetes rápidos */}
                                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPagaCon(String(montoCobrado))}
                                                        style={{ padding: '3px 8px', borderRadius: 6, background: '#E2E8F0', border: 'none', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', color: C.ink }}
                                                    >
                                                        Exacto (${montoCobrado.toFixed(2)})
                                                    </button>
                                                    {[5, 10, 20, 50, 100].map(den => (
                                                        <button
                                                            key={den}
                                                            type="button"
                                                            onClick={() => setPagaCon(String(den))}
                                                            style={{ padding: '3px 8px', borderRadius: 6, background: '#FFFFFF', border: `1px solid ${C.borderStrong}`, fontSize: 10.5, fontWeight: 700, cursor: 'pointer', color: C.ink }}
                                                        >
                                                            ${den}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: 150 }}>
                                                    <label style={{ display: 'block', fontSize: 10.5, color: C.muted, marginBottom: 4 }}>
                                                        Cliente paga con ($)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        value={pagaCon}
                                                        onChange={(e) => setPagaCon(e.target.value)}
                                                        placeholder={`Ej: ${Math.ceil(montoCobrado / 5) * 5 || 20}`}
                                                        style={{ ...S.input, background: '#FFFFFF', fontFamily: MONO, fontSize: 15, fontWeight: 700, padding: '10px 12px' }}
                                                    />
                                                </div>

                                                {/* Indicador de Vuelto */}
                                                <div style={{
                                                    flex: 1.2,
                                                    minWidth: 180,
                                                    padding: '10px 14px',
                                                    borderRadius: 10,
                                                    background: pagaConNum >= montoCobrado && pagaConNum > 0 ? '#DCFCE7' : '#F1F5F9',
                                                    border: `1.5px solid ${pagaConNum >= montoCobrado && pagaConNum > 0 ? '#86EFAC' : '#CBD5E1'}`,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                }}>
                                                    <span style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.1em', color: pagaConNum >= montoCobrado && pagaConNum > 0 ? '#15803D' : C.muted }}>
                                                        {pagaConNum >= montoCobrado && pagaConNum > 0 ? '💵 Vuelto a Entregar' : 'Estado de Efectivo'}
                                                    </span>
                                                    <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: pagaConNum >= montoCobrado && pagaConNum > 0 ? '#15803D' : C.faint, marginTop: 2 }}>
                                                        {pagaConNum >= montoCobrado && pagaConNum > 0 ? formatCurrency(vueltoCalculado) : (faltaEfectivo > 0 ? `Faltan ${formatCurrency(faltaEfectivo)}` : 'Ingrese monto')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Subsección: Transferencia / Deuna con datos para copiar */}
                                    {(metodoPago === 'Transferencia' || metodoPago === 'Deuna') && (
                                        <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: 14 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                                                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0369A1', letterSpacing: '.08em' }}>
                                                    Datos Bancarios del Negocio
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={handleCopiarDatosBancarios}
                                                    style={{ padding: '4px 10px', borderRadius: 6, background: copiadoBanco ? '#16A34A' : '#0284C7', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    {copiadoBanco ? '✓ ¡Copiado!' : '📋 Copiar Datos Bancarios'}
                                                </button>
                                            </div>
                                            <p style={{ margin: '0 0 10px', fontSize: 11.5, color: '#0C4A6E', lineHeight: 1.4 }}>
                                                <strong>{DATOS_BANCARIOS.banco}</strong> · Cta. Corriente #{DATOS_BANCARIOS.numero} · RUC: {DATOS_BANCARIOS.ruc}
                                            </p>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                                                    N° de Comprobante / Referencia de Transferencia
                                                </label>
                                                <input
                                                    value={comprobanteRef}
                                                    onChange={e => setComprobanteRef(e.target.value)}
                                                    placeholder="Ej: Transf. #948210 / Lote Deuna"
                                                    style={{ ...S.input, background: '#FFFFFF', fontFamily: MONO, fontSize: 13, padding: '9px 12px' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Subsección: Tarjeta */}
                                    {metodoPago === 'Tarjeta' && (
                                        <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 12, padding: 12 }}>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B21A8', marginBottom: 4 }}>
                                                N° Voucher / Lote Datafast
                                            </label>
                                            <input
                                                value={comprobanteRef}
                                                onChange={e => setComprobanteRef(e.target.value)}
                                                placeholder="Ej: Lote 048 · Voucher 8271"
                                                style={{ ...S.input, background: '#FFFFFF', fontFamily: MONO, fontSize: 13, padding: '9px 12px' }}
                                            />
                                        </div>
                                    )}

                                    {/* Subsección: Crédito */}
                                    {metodoPago === 'Credito' && (
                                        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 12, fontSize: 12, color: '#92400E' }}>
                                            🤝 <strong>Entrega a Crédito Autorizada:</strong> El trabajo se marcará como entregado y el valor de <strong>{formatCurrency(montoCobrado)}</strong> se registrará en cuentas por cobrar pendientes del cliente.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 28 }}>✅</span>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#166534' }}>Orden Totalmente Cancelada</div>
                                        <div style={{ fontSize: 12, color: '#15803D' }}>No hay saldo pendiente. Listo para entrega física y firma de constancia.</div>
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN 2: RECEPTOR (¿Quién retira?) */}
                            <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 15 }}>👤</span>
                                        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.ink }}>
                                            Constancia de Retiro
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleReceptor('titular')}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 7,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                border: 'none',
                                                background: receptorTipo === 'titular' ? C.royal : C.softGray,
                                                color: receptorTipo === 'titular' ? '#fff' : C.body,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Titular
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleReceptor('tercero')}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 7,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                border: 'none',
                                                background: receptorTipo === 'tercero' ? C.royal : C.softGray,
                                                color: receptorTipo === 'tercero' ? '#fff' : C.body,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Tercero / Mensajero
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                                            Nombre de quien retira *
                                        </label>
                                        <input
                                            value={receptorNombre}
                                            onChange={e => setReceptorNombre(e.target.value)}
                                            placeholder="Nombre completo"
                                            style={{ ...S.input, fontSize: 13, padding: '9px 12px' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                                            Cédula / Identificación
                                        </label>
                                        <input
                                            value={receptorCedula}
                                            onChange={e => setReceptorCedula(e.target.value)}
                                            placeholder="C.I. o RUC"
                                            style={{ ...S.input, fontFamily: MONO, fontSize: 13, padding: '9px 12px' }}
                                        />
                                    </div>
                                    {receptorTipo === 'tercero' && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                                                Parentesco o Cargo (ej: Mensajero, Esposa, Empleado)
                                            </label>
                                            <input
                                                value={receptorRelacion}
                                                onChange={e => setReceptorRelacion(e.target.value)}
                                                placeholder="Ej: Mensajero Servientrega / Hermano"
                                                style={{ ...S.input, fontSize: 13, padding: '9px 12px' }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECCIÓN 3: FOTO DE RESPALDO (Opcional) */}
                            <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 14, padding: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showCamera || fotoRetiro ? 10 : 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 15 }}>📷</span>
                                        <span style={{ fontSize: 11.5, fontWeight: 700, color: C.body }}>
                                            Foto o Firma de Respaldo <span style={{ color: C.faint, fontWeight: 400 }}>(Opcional)</span>
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCamera(v => !v)}
                                        style={{ ...S.softBtn, padding: '5px 10px', fontSize: 11 }}
                                    >
                                        {showCamera ? 'Cerrar Cámara' : (fotoRetiro ? 'Cambiar Foto' : '+ Tomar Foto')}
                                    </button>
                                </div>

                                {showCamera && (
                                    <div style={{ aspectRatio: '16/9', width: '100%', background: C.softGray, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                                        <PhotoCapture onImageCaptured={(file) => { setFotoRetiro(file); setShowCamera(false); }} />
                                    </div>
                                )}

                                {fotoRetiro && !showCamera && (
                                    <div style={{ padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span>✓ Foto de respaldo lista para adjuntar</span>
                                        <button type="button" onClick={() => setFotoRetiro(null)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 11 }}>Eliminar</button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ============================================================== */}
                    {/* PASO 2: PANTALLA DE ÉXITO POST-ENTREGA                        */}
                    {/* ============================================================== */}
                    {paso === 'exito' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', padding: '10px 0' }}>
                            <Confetti width={width} height={height} recycle={false} numberOfPieces={280} />

                            <div style={{
                                width: 68,
                                height: 68,
                                borderRadius: '50%',
                                background: '#DCFCE7',
                                color: '#16A34A',
                                fontSize: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                border: '3px solid #86EFAC',
                            }}>
                                ✓
                            </div>

                            <div>
                                <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 22, fontWeight: 700, color: C.ink }}>
                                    ¡Despacho Registrado con Éxito!
                                </h3>
                                <p style={{ margin: '6px 0 0', fontSize: 13.5, color: C.muted }}>
                                    La orden <strong>#{trabajo.orden}</strong> pasó a estado <strong>Entregado</strong>.
                                </p>
                            </div>

                            {/* Resumen de la entrega */}
                            <div style={{ background: C.softGray, borderRadius: 14, padding: 14, textAlign: 'left', fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 6, border: `1px solid ${C.border}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: C.faint }}>Cliente Titular:</span>
                                    <strong style={{ color: C.ink }}>{clienteNombre}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: C.faint }}>Entregado a:</span>
                                    <strong style={{ color: C.ink }}>{receptorNombre} {receptorCedula ? `(CI: ${receptorCedula})` : ''}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: C.faint }}>Monto Cobrado Hoy:</span>
                                    <strong style={{ color: C.success }}>{formatCurrency(montoCobrado)} ({metodoPago})</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: C.faint }}>Operador de Despacho:</span>
                                    <strong style={{ color: C.ink }}>{currentUser.nombre || 'Operador'}</strong>
                                </div>
                            </div>

                            {/* Acciones Inmediatas Post-Entrega */}
                            <div style={{ marginTop: 6 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.12em', color: C.faint, marginBottom: 10 }}>
                                    Acciones Inmediatas
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                                    {/* Botón WhatsApp */}
                                    <button
                                        type="button"
                                        onClick={handleEnviarWhatsApp}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: 12,
                                            background: '#25D366',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: 700,
                                            fontSize: 13,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                                        }}
                                    >
                                        <span>📱</span>
                                        <span>Comprobante WhatsApp</span>
                                    </button>

                                    {/* Botón Recibo Epson */}
                                    <button
                                        type="button"
                                        onClick={() => window.open(`/#/recibo-epson/${trabajo.id}`, '_blank')}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: 12,
                                            background: C.royal,
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: 700,
                                            fontSize: 13,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span>🖨️</span>
                                        <span>Recibo Epson (1/4 Oficio)</span>
                                    </button>

                                    {/* Botón Nota de Venta RIMPE */}
                                    <button
                                        type="button"
                                        onClick={() => window.open(`/#/nota-de-venta/${trabajo.id}`, '_blank')}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: 12,
                                            background: '#0F2B48',
                                            color: '#fff',
                                            border: 'none',
                                            fontWeight: 700,
                                            fontSize: 13,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span>📑</span>
                                        <span>Nota de Venta RIMPE</span>
                                    </button>

                                    {/* Botón Solicitud SRI / Orden */}
                                    <button
                                        type="button"
                                        onClick={() => window.open(trabajo.esSRI ? `/#/solicitud-impresion/${trabajo.id}` : `/#/orden-produccion/${trabajo.id}`, '_blank')}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: 12,
                                            background: C.softGray,
                                            color: C.ink,
                                            border: `1px solid ${C.borderStrong}`,
                                            fontWeight: 700,
                                            fontSize: 13,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span>📄</span>
                                        <span>{trabajo.esSRI ? 'Solicitud SRI' : 'Orden Producción'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pie Fijo del Modal */}
                <div style={{ padding: '14px 22px', background: C.softGray, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                    {paso === 'cobro' ? (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isProcessing}
                                style={{ ...S.outlineBtn, padding: '11px 18px', fontSize: 13 }}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmarEntrega}
                                disabled={isProcessing}
                                style={{
                                    ...S.primaryBtn,
                                    padding: '12px 24px',
                                    fontSize: 13.5,
                                    fontWeight: 700,
                                    background: saldoInicial > 0 ? '#16A34A' : C.royal,
                                    opacity: isProcessing ? 0.6 : 1,
                                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                                    boxShadow: saldoInicial > 0 ? '0 4px 14px rgba(22,163,74,0.35)' : 'none',
                                }}
                            >
                                {isProcessing ? (
                                    <>⏳ Registrando Despacho…</>
                                ) : (
                                    <>
                                        <span>⚡</span>
                                        <span>
                                            {saldoInicial > 0
                                                ? `Confirmar Despacho y Cobrar ${formatCurrency(montoCobrado)}`
                                                : 'Confirmar Despacho (Pagado)'}
                                        </span>
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ ...S.primaryBtn, width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14 }}
                        >
                            ✓ Finalizar y Siguiente Pedido
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ModalDespachoEntrega;
