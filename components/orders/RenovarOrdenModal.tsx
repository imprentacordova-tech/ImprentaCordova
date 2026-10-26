import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { logActivity } from '../../services/activityLogService';
import { round2 } from '../../services/orderPricing';
import { Cliente, Trabajo, TrabajoEstado } from '../../types';
import { formatCurrency } from '../../utils';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../panelTheme';
import { puedeEmitirNotaDeVenta, validarDocumento } from '../../services/regimenRules';

/**
 * Renovación de una orden — el flujo "buscar → clonar → imprimir".
 *
 * Contexto de negocio (agent_instructions.md): la mitad de las ventas de la imprenta son
 * renovaciones, y "registrar un pedido en más de 30 segundos significa perder dinero".
 * Por eso esto NO abre el asistente de 5 pasos: es una sola pantalla con todo precargado
 * desde la orden anterior, pensada para confirmar y mandar a imprimir.
 *
 * Reglas del proyecto que respeta:
 *   - Marca `esRenovacion: true` (el campo existía en el tipo y en la BD, pero ningún
 *     escritor lo seteaba: la landing ya anunciaba "Archivo del arte para renovaciones"
 *     sin que hubiera feature detrás).
 *   - Guarda legal: si el régimen del cliente NO es RIMPE Negocio Popular, este documento
 *     no puede renovarse como Nota de Venta. La misma regla que aplica ProductGrid.
 *   - Registra auditoría con logActivity (obligatorio en CONTINUITY_RULES).
 */

interface RenovarOrdenModalProps {
    trabajo: Trabajo;
    cliente: Cliente | null;
    usuario: string;
    rol: string;
    onClose: () => void;
}

const RenovarOrdenModal: React.FC<RenovarOrdenModalProps> = ({ trabajo, cliente, usuario, rol, onClose }) => {
    const { addTrabajo } = useData();

    const [cantidad, setCantidad] = useState<number>(trabajo.cantidad || 1);
    const [total, setTotal] = useState<number>(trabajo.total || 0);
    const [abono, setAbono] = useState<number>(0);
    const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>(trabajo.prioridad || 'Normal');
    const [plazo, setPlazo] = useState<'24h' | '48h'>(trabajo.tiempoEntregaEstimado || '48h');
    const [numeracion, setNumeracion] = useState<string>(trabajo.numeracion || '');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const regimen = cliente?.regimen;

    /** Las reglas de régimen viven en services/regimenRules.ts (con tests propios). */
    const validacion = validarDocumento({
        regimen,
        tipo: trabajo.tipo,
        esSRI: trabajo.esSRI,
        cantidad,
    });
    const bloqueoLegal = !validacion.permitido;

    const saldo = useMemo(() => round2(Math.max(0, total - abono)), [total, abono]);

    const entrega = useMemo(() => {
        const d = new Date();
        d.setHours(d.getHours() + (plazo === '24h' ? 24 : 48));
        return d;
    }, [plazo]);

    const confirmar = async () => {
        if (bloqueoLegal) return;
        if (!cliente?.id && !trabajo.clienteId) {
            setError('Esta orden no tiene un cliente asociado; no se puede renovar automáticamente.');
            return;
        }

        setGuardando(true);
        setError(null);
        try {
            const nuevo = await addTrabajo({
                clienteId: trabajo.clienteId,
                titular: trabajo.titular,
                tipo: trabajo.tipo,
                subtipo: trabajo.subtipo,
                detalle: trabajo.detalle,
                cantidad,
                total,
                abono,
                saldo,
                estado: TrabajoEstado.PENDIENTE,
                prioridad,
                origen: 'Interno',
                esRenovacion: true,
                esSRI: trabajo.esSRI,
                establecimiento: trabajo.establecimiento,
                puntoEmision: trabajo.puntoEmision,
                actividadSeleccionada: trabajo.actividadSeleccionada,
                tamano: trabajo.tamano,
                numeracion: numeracion || undefined,
                imprimirClave: trabajo.imprimirClave,
                estadoClave: 'PENDIENTE',
                tiempoEntregaEstimado: plazo,
                fechaEntrega: entrega.toISOString(),
            }, usuario);

            await logActivity(
                usuario, rol, 'RENOVACION_ORDEN',
                `Renovó ${trabajo.tipo || 'trabajo'} de ${trabajo.titular} (origen #${String(trabajo.orden).padStart(4, '0')})`,
                'Órdenes'
            ).catch(() => {});

            onClose();
            window.open(
                trabajo.esSRI ? `/#/solicitud-impresion/${nuevo.id}?format=a5` : `/#/recibo-epson/${nuevo.id}`,
                '_blank'
            );
        } catch (err) {
            console.error('[Renovar] Error creando la renovación:', err);
            setError('No se pudo crear la renovación. Revisá la conexión e intentá de nuevo.');
        } finally {
            setGuardando(false);
        }
    };

    const campo: React.CSSProperties = { ...S.input, padding: '9px 11px', fontSize: 13 };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Renovar orden"
            style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
            <style>{PANEL_KEYFRAMES}</style>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: C.scrim, backdropFilter: 'blur(2px)', animation: 'pi-fade-in .25s ease both' }} />

            <div style={{
                position: 'relative', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto',
                background: C.surface, borderRadius: 18, border: `1px solid ${C.border}`,
                boxShadow: '0 24px 60px rgba(10,17,64,.22)', animation: 'pi-rise .35s cubic-bezier(.2,.8,.2,1) both',
            }}>
                {/* Cabecera */}
                <div style={{ padding: '18px 22px', background: C.ink, borderRadius: '18px 18px 0 0', color: C.onInk }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: C.onInkFaint }}>Renovación</p>
                    <h2 style={{ margin: '5px 0 0', fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, letterSpacing: '-.03em' }}>
                        Renovar orden <span style={{ fontFamily: MONO, color: C.gold }}>#{String(trabajo.orden).padStart(4, '0')}</span>
                    </h2>
                    <p style={{ margin: '6px 0 0', fontSize: 12.5, color: C.onInkSoft }}>
                        Se crea una orden nueva con los mismos datos. Revisá el precio y confirmá.
                    </p>
                </div>

                <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Cliente + régimen */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 14px', background: C.surfaceAlt, border: `1px solid ${C.divider}`, borderRadius: 12 }}>
                        <span style={{ flex: 1, minWidth: 160 }}>
                            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.ink }}>{cliente?.nombre || trabajo.titular}</span>
                            <span style={{ display: 'block', fontFamily: MONO, fontSize: 11.5, color: C.faint, marginTop: 2 }}>{cliente?.ruc || cliente?.cedula || 'sin RUC'}</span>
                        </span>
                        <span style={{
                            padding: '5px 11px', borderRadius: 99, fontSize: 11.5, fontWeight: 700,
                            ...(puedeEmitirNotaDeVenta(regimen)
                                ? { background: C.goldBg, color: C.goldText, border: `1px solid ${C.goldBorder}` }
                                : { background: C.chipBlue, color: C.royal, border: `1px solid ${C.borderStrong}` }),
                        }}>
                            {regimen || 'Régimen sin definir'}
                        </span>
                    </div>

                    {/* Guarda legal: reglas de régimen del SRI */}
                    {bloqueoLegal && (
                        <div style={{ padding: '13px 15px', background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: 12 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.dangerText }}>No se puede renovar este documento</p>
                            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: C.dangerText, lineHeight: 1.55 }}>
                                {validacion.motivo}
                            </p>
                        </div>
                    )}

                    {validacion.advertencia && (
                        <div style={{ padding: '13px 15px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 12 }}>
                            <p style={{ margin: 0, fontSize: 12.5, color: C.goldText, lineHeight: 1.55 }}>
                                <strong>Atención:</strong> {validacion.advertencia}
                            </p>
                        </div>
                    )}

                    {/* Documento heredado */}
                    <div>
                        <span style={S.fieldLabel}>Documento a renovar</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '11px 13px', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{trabajo.tipo || 'Trabajo general'}</span>
                            {trabajo.tamano && <span style={{ fontSize: 12, color: C.muted }}>· {trabajo.tamano}</span>}
                            {trabajo.esSRI && <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, fontWeight: 700, background: C.chipBlue, color: C.royal }}>SRI</span>}
                        </div>
                        {trabajo.subtipo && <p style={{ margin: '7px 0 0', fontSize: 12, color: C.faint, lineHeight: 1.5 }}>{trabajo.subtipo}</p>}
                    </div>

                    {/* Formulario: una sola pantalla */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 13 }}>
                        <label>
                            <span style={S.fieldLabel}>Cantidad</span>
                            <input type="number" min={1} value={cantidad} onChange={e => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))} style={campo} />
                        </label>
                        <label>
                            <span style={S.fieldLabel}>Precio total ($)</span>
                            <input type="number" min={0} step="0.01" value={total} onChange={e => setTotal(parseFloat(e.target.value) || 0)} style={campo} />
                        </label>
                        <label>
                            <span style={S.fieldLabel}>Abono inicial ($)</span>
                            <input type="number" min={0} step="0.01" value={abono} onChange={e => setAbono(parseFloat(e.target.value) || 0)} style={campo} />
                        </label>
                        <label>
                            <span style={S.fieldLabel}>Plazo de entrega</span>
                            <select value={plazo} onChange={e => setPlazo(e.target.value as '24h' | '48h')} style={{ ...campo, cursor: 'pointer' }}>
                                <option value="24h">24 horas</option>
                                <option value="48h">48 horas</option>
                            </select>
                        </label>
                        <label>
                            <span style={S.fieldLabel}>Prioridad</span>
                            <select value={prioridad} onChange={e => setPrioridad(e.target.value as 'Normal' | 'Urgente')} style={{ ...campo, cursor: 'pointer' }}>
                                <option value="Normal">Normal</option>
                                <option value="Urgente">Urgente</option>
                            </select>
                        </label>
                        <label>
                            <span style={S.fieldLabel}>Numeración</span>
                            <input value={numeracion} onChange={e => setNumeracion(e.target.value)} placeholder="001-001-000000123" style={campo} />
                        </label>
                    </div>

                    {/* Resumen */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 15px', background: C.surfaceAlt, border: `1px solid ${C.divider}`, borderRadius: 12 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint }}>Saldo pendiente</span>
                        <span style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700, color: saldo > 0 ? C.ink : C.success }}>{formatCurrency(saldo)}</span>
                    </div>

                    <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
                        Entrega estimada: <strong style={{ color: C.ink }}>{entrega.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
                    </p>

                    {error && <p style={{ margin: 0, fontSize: 12.5, color: C.dangerText }}>{error}</p>}
                </div>

                {/* Pie */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '15px 22px', borderTop: `1px solid ${C.divider}`, background: C.surfaceAlt, borderRadius: '0 0 18px 18px' }}>
                    <button onClick={onClose} style={S.outlineBtn} disabled={guardando}>Cancelar</button>
                    <button
                        onClick={confirmar}
                        disabled={guardando || bloqueoLegal}
                        style={{
                            ...S.primaryBtn,
                            background: bloqueoLegal ? C.ghost : C.royal,
                            cursor: bloqueoLegal ? 'not-allowed' : 'pointer',
                            opacity: guardando ? .7 : 1,
                        }}
                    >
                        {guardando ? 'Creando…' : 'Crear renovación e imprimir'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RenovarOrdenModal;
