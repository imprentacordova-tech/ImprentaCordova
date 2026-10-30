import React, { useMemo, useRef } from 'react';
import { C, S, MONO, DISPLAY } from '../panelTheme';
import { RECARGO_URGENCIA } from '../../services/orderPricing';
import { ProductVisual } from '../ProductVisual';
import { DetalleCampos } from './DetalleCampos';
import { perfilDe, calcularDelta, resumenPerfil } from '../../services/detalleProducto';

/**
 * Paso 2 de Nueva Orden — "Especificaciones y Calculadora Dinámica"
 * Concentra el cálculo técnico de tamaños, copias químicas, tipo de diseño y papel
 * recalculando el valor unitario y total en tiempo real con total transparencia.
 */

type OpcionEntrega = 'hoy' | 'manana' | 'dos-dias' | 'exacta';

const OPCIONES_ENTREGA: { id: OpcionEntrega; label: string }[] = [
    { id: 'hoy', label: 'Hoy 17:00' },
    { id: 'manana', label: 'Mañana' },
    { id: 'dos-dias', label: 'En 2 días' },
    { id: 'exacta', label: 'Fecha exacta' },
];

export const OPCIONES_TAMANO = [
    { label: '1/4 Oficio', delta: 0, tag: 'Estándar' },
    { label: '1/2 Oficio', delta: 4, tag: '+$4.00/u' },
    { label: 'Carta / A4', delta: 7, tag: '+$7.00/u' },
    { label: '1/8 Oficio', delta: -2, tag: '-$2.00/u' },
    { label: 'Personalizado', delta: 0, tag: 'Manual' },
];

export const OPCIONES_COPIAS = [
    { label: 'Original (50 hojas)', delta: -1.5, tag: '1 copia (-$1.50)' },
    { label: 'Original + 1 Copia (Duplicado 100h)', delta: 0, tag: 'Estándar (2c)' },
    { label: 'Original + 2 Copias (Triplicado 150h)', delta: 3.5, tag: '3 copias (+$3.50)' },
    { label: 'Original + 3 Copias (Cuadruplicado 200h)', delta: 7, tag: '4 copias (+$7.00)' },
];

export const OPCIONES_DISENO = [
    { label: 'Sin Diseño (Arte provisto / Repetición)', delta: 0, tag: 'Incluido' },
    { label: 'Diagramación Rápida / Muestra Física', delta: 3, tag: '+$3.00' },
    { label: 'Diseño Creativo & Vectorización', delta: 8, tag: '+$8.00' },
];

export const OPCIONES_PAPEL = [
    { label: 'Químico Autocopia', delta: 0 },
    { label: 'Bond 75g', delta: 0 },
    { label: 'Couché 300g (Brillante/Mate)', delta: 2 },
    { label: 'Adhesivo / Vinil', delta: 3 },
];

export const calcularHojas = (copiasStr?: string, esSri?: boolean): number => {
    if (!copiasStr) return esSri ? 100 : 50;
    if (/cuadruplicado|200\s*h/i.test(copiasStr)) return 200;
    if (/triplicado|150\s*h/i.test(copiasStr)) return 150;
    if (/duplicado|100\s*h/i.test(copiasStr)) return 100;
    if (/original\s*\(50|50\s*h/i.test(copiasStr)) return 50;
    return esSri ? 100 : 50;
};

const fechaDeOpcion = (id: OpcionEntrega): string => {
    const d = new Date();
    if (id === 'hoy') d.setHours(17, 0, 0, 0);
    else {
        d.setDate(d.getDate() + (id === 'manana' ? 1 : 2));
        d.setHours(17, 0, 0, 0);
    }
    return d.toISOString();
};

const aInputDate = (iso: string): string => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const opcionDeFecha = (iso: string): OpcionEntrega => {
    if (!iso) return 'manana';
    const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const objetivo = new Date(iso);
    if (isNaN(objetivo.getTime())) return 'manana';
    const hoy = new Date();
    const diff = Math.round((dia(objetivo) - dia(hoy)) / 86400000);
    if (diff === 0) return 'hoy';
    if (diff === 1) return 'manana';
    if (diff === 2) return 'dos-dias';
    return 'exacta';
};

export interface OrderDetailsProps {
    items?: any[];
    setItems?: React.Dispatch<React.SetStateAction<any[]>>;
    notas: string;
    setNotas: (val: string) => void;
    prioridad: 'Normal' | 'Urgente';
    setPrioridad: (val: 'Normal' | 'Urgente') => void;
    fechaEntrega: string;
    setFechaEntrega: (val: string) => void;
    esSRI?: boolean;
    numeracion?: string;
    setNumeracion?: (val: string) => void;
    autorizacionSri?: string;
    setAutorizacionSri?: (val: string) => void;
    archivo?: File | null;
    setArchivo?: (file: File | null) => void;
    /** Lanza la solicitud SRI para un ítem (flujo inverso: web → SRI → web). */
    onLaunchSri?: (item: any) => void;
}

const chip = (activo: boolean): React.CSSProperties => ({
    padding: '7px 12px',
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    ...(activo
        ? { background: C.royal, color: '#FFFFFF', border: `1px solid ${C.royal}` }
        : { background: C.surface, color: C.body, border: `1px solid ${C.borderStrong}` }),
});

export const OrderDetails: React.FC<OrderDetailsProps> = ({
    items = [],
    setItems,
    notas,
    setNotas,
    prioridad,
    setPrioridad,
    fechaEntrega,
    setFechaEntrega,
    esSRI = false,
    numeracion = '',
    setNumeracion,
    autorizacionSri = '',
    setAutorizacionSri,
    archivo,
    setArchivo,
    onLaunchSri,
}) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const opcion = useMemo(() => opcionDeFecha(fechaEntrega), [fechaEntrega]);
    const urgente = prioridad === 'Urgente';

    const elegirOpcion = (id: OpcionEntrega) => {
        if (id === 'exacta') {
            if (opcion !== 'exacta') {
                const d = new Date();
                d.setDate(d.getDate() + 3);
                d.setHours(17, 0, 0, 0);
                setFechaEntrega(d.toISOString());
            }
            return;
        }
        setFechaEntrega(fechaDeOpcion(id));
    };

    const cambiarFechaExacta = (valor: string) => {
        if (!valor) return;
        const d = new Date(`${valor}T17:00:00`);
        setFechaEntrega(d.toISOString());
    };

    const updateItemOption = (index: number, key: string, val: string) => {
        if (!setItems) return;
        setItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const perfil = perfilDe(item);
            const newSpecs = { ...(item.especificaciones || {}), [key]: val };
            const base = item.precioBase ?? item.precioUnitario ?? 13;
            const delta = calcularDelta(perfil, newSpecs);
            const newUnitPrice = Math.max(1, base + delta);
            const qty = item.cantidad || 1;
            return {
                ...item,
                precioBase: base,
                precioUnitario: newUnitPrice,
                precioFinal: Math.round(newUnitPrice * qty * 100) / 100,
                especificaciones: newSpecs,
            };
        }));
    };

    const updateItemQty = (index: number, delta: number) => {
        if (!setItems) return;
        setItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const currentQty = item.cantidad || 1;
            const newQty = Math.max(1, currentQty + delta);
            const unitPrice = item.precioUnitario || 13;
            return {
                ...item,
                cantidad: newQty,
                precioUnitario: unitPrice,
                precioFinal: Math.round(unitPrice * newQty * 100) / 100,
            };
        }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Header del Paso 2 con Enmarcado Contextual SRI / Tax vs Comercial */}
            <div style={{ ...S.card, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    <div>
                        <span style={S.eyebrow}>Paso 2 · Proceso de Fabricación</span>
                        <h2 style={{ ...S.h2, margin: '2px 0 0', fontSize: 18 }}>
                            {esSRI ? 'Especificaciones del Comprobante Fiscal SRI' : 'Especificaciones de Impresión Comercial'}
                        </h2>
                        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: C.faint }}>
                            {esSRI
                                ? 'Ajusta tamaño oficial, copias químicas reglamentarias y acabados. Exento de IVA legal para comprobantes SRI.'
                                : 'Configura formato, tipo de papel, diseño y sustrato para taller. Aplica +15% IVA comercial.'}
                        </p>
                    </div>
                    <span style={{
                        padding: '5px 12px',
                        background: esSRI ? C.goldBg : C.chipBlue,
                        color: esSRI ? C.goldTextStrong : C.royal,
                        border: `1.5px solid ${esSRI ? C.goldBorder : C.borderStrong}`,
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                    }}>
                        <span>{esSRI ? '🏛️' : '💼'}</span>
                        <span>{esSRI ? 'AUTORIZADO SRI / TAX' : 'PRODUCCIÓN COMERCIAL'}</span>
                    </span>
                </div>

                {/* Banner de Enmarcado Explicativo */}
                <div style={{
                    marginTop: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: esSRI ? 'linear-gradient(135deg, rgba(10,17,64,0.03) 0%, rgba(255,198,26,0.12) 100%)' : '#F8FAFC',
                    border: `1px solid ${esSRI ? C.goldBorder : C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{esSRI ? '⚖️' : '📐'}</span>
                        <div style={{ fontSize: 11.5 }}>
                            <strong style={{ color: esSRI ? C.goldTextStrong : C.royal }}>
                                {esSRI ? 'Normativa Legal del SRI Aplicable:' : 'Parámetros Libres de Taller:'}
                            </strong>
                            <span style={{ display: 'block', color: esSRI ? C.goldText : C.muted, marginTop: 1 }}>
                                {esSRI
                                    ? 'Se emitirá la Solicitud Oficial de Autorización A5/Medio Oficio. Los formatos 1/4 y 1/2 oficio usan copias químicas autocopia.'
                                    : 'No requiere validación del SRI. Puedes definir cualquier formato y papel para recibos, volantes o tarjetas.'}
                            </span>
                        </div>
                    </div>
                    <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: esSRI ? '#FFC61A' : C.royal,
                        color: esSRI ? '#0A1140' : '#FFFFFF',
                    }}>
                        {esSRI ? 'EXENTO IVA' : '+15% IVA'}
                    </span>
                </div>
            </div>

            {/* Configuración Dinámica de Ítems */}
            {items.length > 0 && (
                <div style={{ ...S.card, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ ...S.colHead, color: C.faint }}>Configurador de Producto por Ítem</div>
                    
                    {items.map((item, idx) => {
                        const perfil = perfilDe(item);
                        const hojasCalculadas = calcularHojas(item.especificaciones?.copias, item.esSRI);
                        const cantBloques = item.cantidad || 1;
                        const ajustes = perfil.campos
                            .filter(c => c.tipo === 'chips' && c.opciones)
                            .map(c => {
                                const val = item.especificaciones?.[c.key] ?? c.default;
                                const op = c.opciones!.find(o => o.valor === val);
                                return op?.delta ? { label: c.label.split(' ')[0], delta: op.delta } : null;
                            })
                            .filter(Boolean) as Array<{ label: string; delta: number }>;

                        return (
                            <div
                                key={idx}
                                style={{
                                    padding: '16px 18px',
                                    background: C.surfaceAlt,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 14,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 14,
                                }}
                            >
                                {/* Barra Superior del Ítem */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: C.ink }}>
                                            {item.nombre}
                                        </span>
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 800,
                                            padding: '2px 6px',
                                            borderRadius: 5,
                                            background: item.esSRI ? C.goldBg : C.chipBlue,
                                            color: item.esSRI ? C.goldTextStrong : C.royal,
                                        }}>
                                            {item.esSRI ? 'SRI' : 'COMERCIAL'}
                                        </span>
                                        {item.esSRI && onLaunchSri && (
                                            <button
                                                type="button"
                                                onClick={() => onLaunchSri(item)}
                                                title="Abrir el SRI y hacer la solicitud con este documento y cantidad"
                                                style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                                    padding: '5px 10px', borderRadius: 8,
                                                    background: C.gold, color: C.ink, border: 'none',
                                                    fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                                }}
                                            >
                                                🚀 Hacer solicitud en SRI
                                            </button>
                                        )}
                                    </div>

                                    {/* Stepper de Cantidad */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{perfil.unidadCantidad} / Cantidad:</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${C.borderStrong}`, borderRadius: 8, background: '#FFFFFF', overflow: 'hidden' }}>
                                            <button
                                                type="button"
                                                onClick={() => updateItemQty(idx, -1)}
                                                style={{ padding: '5px 11px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, color: C.ink, fontSize: 14 }}
                                            >
                                                −
                                            </button>
                                            <span style={{ padding: '0 10px', fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.royal }}>
                                                {item.cantidad || 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateItemQty(idx, 1)}
                                                style={{ padding: '5px 11px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, color: C.ink, fontSize: 14 }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Rejilla: Configuración Técnica (Izquierda) + Vista Previa Dinámica (Derecha) */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                                    gap: 16,
                                    alignItems: 'start',
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                            <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Detalles de {perfil.label}</span>
                                            <span style={{ fontSize: 10, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                                                {perfil.unidadCantidad}
                                            </span>
                                        </div>
                                        <DetalleCampos
                                            perfil={perfil}
                                            valores={item.especificaciones || {}}
                                            onChange={(key, val) => updateItemOption(idx, key, val)}
                                        />
                                    </div>

                                    {/* Panel Lateral: Ilustración Reactiva de Producto */}
                                    <div style={{
                                        background: '#FFFFFF',
                                        border: `1.5px solid ${C.borderStrong}`,
                                        borderRadius: 14,
                                        padding: '16px 14px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                        gap: 10,
                                        boxShadow: '0 2px 10px rgba(10, 17, 64, 0.04)',
                                    }}>
                                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.rowLine}`, paddingBottom: 8 }}>
                                            <span style={{ fontSize: 10.5, fontWeight: 800, color: C.faint, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                                                Vista Previa en Vivo
                                            </span>
                                            <span style={{
                                                fontSize: 10.5,
                                                fontWeight: 800,
                                                color: C.royal,
                                                background: C.chipBlue,
                                                padding: '2px 8px',
                                                borderRadius: 6,
                                            }}>
                                                {cantBloques} {perfil.unidadCantidad}
                                            </span>
                                        </div>

                                        <div style={{ padding: '8px 0', minHeight: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ProductVisual
                                                nombre={item.nombre}
                                                categoria={item.categoria}
                                                esSRI={item.esSRI}
                                                bloques={cantBloques}
                                                hojas={hojasCalculadas}
                                                width={135}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                                            {perfil.manejaHojas && (
                                                <span style={{
                                                    fontSize: 10.5,
                                                    fontWeight: 700,
                                                    padding: '3px 8px',
                                                    borderRadius: 6,
                                                    background: item.esSRI ? C.goldBg : C.chipBlue,
                                                    color: item.esSRI ? C.goldTextStrong : C.royal,
                                                    border: `1px solid ${item.esSRI ? C.goldBorder : C.border}`,
                                                }}>
                                                    📖 {hojasCalculadas} hojas c/u
                                                </span>
                                            )}
                                            {resumenPerfil(perfil, item.especificaciones || {}).map((r, i) => (
                                                <span key={i} style={{
                                                    fontSize: 10.5,
                                                    fontWeight: 600,
                                                    padding: '3px 8px',
                                                    borderRadius: 6,
                                                    background: C.surface,
                                                    color: C.ink,
                                                    border: `1px solid ${C.border}`,
                                                }}>
                                                    {r.icono} {r.texto}
                                                </span>
                                            ))}
                                        </div>

                                        {perfil.manejaHojas && (
                                            <div style={{
                                                fontSize: 11,
                                                color: C.faint,
                                                borderTop: `1px dashed ${C.rowLine}`,
                                                paddingTop: 8,
                                                width: '100%',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <span>Hojas totales taller:</span>
                                                <strong style={{ color: C.ink, fontFamily: MONO, fontSize: 12 }}>
                                                    {cantBloques * hojasCalculadas} hojas
                                                </strong>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Desglose Dinámico de Valores en Vivo */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    background: '#FFFFFF',
                                    border: `1.5px solid ${C.borderStrong}`,
                                    borderRadius: 10,
                                    flexWrap: 'wrap',
                                    gap: 10,
                                }}>
                                    <div style={{ fontSize: 12, color: C.muted }}>
                                        <span style={{ fontWeight: 700, color: C.ink }}>Cálculo dinámico: </span>
                                        Base ${item.precioBase || 13}
                                        {ajustes.map((a, i) => ` + ${a.label} (${a.delta > 0 ? '+' : ''}$${a.delta})`).join('')}
                                        {` = `}
                                        <span style={{ fontFamily: MONO, fontWeight: 700, color: C.royal }}>
                                            ${(item.precioUnitario || 13).toFixed(2)} c/u
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 11, color: C.faint, fontWeight: 600 }}>Subtotal Ítem:</span>
                                        <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 800, color: C.royal }}>
                                            ${(item.precioFinal || item.precioUnitario || 13).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Parámetros Operativos: Fecha & Urgencia */}
            <div style={{ ...S.card, padding: '18px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
                    <div>
                        <span style={S.fieldLabel}>Compromiso de entrega</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {OPCIONES_ENTREGA.map(o => (
                                <button key={o.id} type="button" onClick={() => elegirOpcion(o.id)} style={chip(opcion === o.id)}>{o.label}</button>
                            ))}
                        </div>
                        {opcion === 'exacta' && (
                            <input
                                type="date"
                                value={aInputDate(fechaEntrega)}
                                onChange={e => cambiarFechaExacta(e.target.value)}
                                style={{ ...S.input, marginTop: 8, fontFamily: MONO }}
                            />
                        )}
                    </div>

                    <div>
                        <span style={S.fieldLabel}>Prioridad en Taller</span>
                        <button
                            type="button"
                            onClick={() => setPrioridad(urgente ? 'Normal' : 'Urgente')}
                            aria-pressed={urgente}
                            style={{
                                width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
                                borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .25s',
                                ...(urgente
                                    ? { background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.dangerText }
                                    : { background: C.surface, border: `1px solid ${C.borderStrong}`, color: C.body }),
                            }}
                        >
                            <span style={{ width: 8, height: 8, borderRadius: 99, flexShrink: 0, background: urgente ? C.danger : C.borderStrong }} />
                            <span style={{ flex: 1, textAlign: 'left', fontSize: 12.5, fontWeight: 600 }}>
                                {urgente ? `Urgente (+${RECARGO_URGENCIA * 100}% express)` : 'Prioridad normal (cola de taller)'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Campos SRI */}
                {esSRI && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.divider}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                        <label style={{ display: 'block' }}>
                            <span style={S.fieldLabel}>Numeración inicial</span>
                            <input
                                type="text"
                                value={numeracion}
                                onChange={e => setNumeracion && setNumeracion(e.target.value)}
                                placeholder="Ej. 0000001 - 0000100"
                                style={{ ...S.input, fontFamily: MONO }}
                            />
                        </label>
                        <label style={{ display: 'block' }}>
                            <span style={S.fieldLabel}>Nro. Autorización SRI</span>
                            <input
                                type="text"
                                value={autorizacionSri}
                                onChange={e => setAutorizacionSri && setAutorizacionSri(e.target.value)}
                                placeholder="Ej. 1131456789"
                                style={{ ...S.input, fontFamily: MONO }}
                            />
                        </label>
                    </div>
                )}

                {/* Notas de taller */}
                <div style={{ marginTop: 14 }}>
                    <label style={{ display: 'block' }}>
                        <span style={S.fieldLabel}>Instrucciones de acabado / Notas de taller</span>
                        <textarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={2}
                            placeholder="Ej. perforado lateral para archivador, tintas especiales, cambiar numeración..."
                            style={{ ...S.input, resize: 'vertical', lineHeight: 1.5 }}
                        />
                    </label>
                </div>

                {/* Arte o Foto de Muestra Física con Cámara */}
                {setArchivo && (
                    <div style={{
                        marginTop: 14, padding: '14px 16px', border: `1.5px dashed ${C.borderStrong}`, borderRadius: 12,
                        background: C.surfaceAlt, display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 34, height: 34, borderRadius: 8, background: C.chipBlue, color: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📷</span>
                                <div>
                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.ink }}>Foto de Muestra Física / Archivo del Cliente</span>
                                    <span style={{ display: 'block', fontSize: 11, color: C.faint }}>Fotografía el talonario viejo con la cámara o sube un archivo (PDF, CDR, JPG)</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                <input
                                    id="camera-capture-input"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    style={{ display: 'none' }}
                                    onChange={e => {
                                        const f = e.target.files?.[0] || null;
                                        if (f) setArchivo(f);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('camera-capture-input')?.click()}
                                    style={{ ...S.primaryBtn, padding: '7px 12px', fontSize: 11.5 }}
                                >
                                    Tomar Foto (Cámara)
                                </button>

                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".pdf,.ai,.cdr,image/*"
                                    style={{ display: 'none' }}
                                    onChange={e => {
                                        const f = e.target.files?.[0] || null;
                                        if (f && f.size > 40 * 1024 * 1024) return;
                                        setArchivo(f);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    style={{ ...S.softBtn, background: C.chipBlue, padding: '7px 12px', fontSize: 11.5 }}
                                >
                                    {archivo ? 'Cambiar archivo' : 'Subir Archivo'}
                                </button>
                            </div>
                        </div>

                        {archivo && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 12px', background: '#FFFFFF', border: `1px solid ${C.borderStrong}`,
                                borderRadius: 8, marginTop: 4,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                    <span style={{ fontSize: 13 }}>📎</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: C.ink, fontFamily: MONO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {archivo.name} ({Math.round(archivo.size / 1024)} KB)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setArchivo(null)}
                                    style={{ background: 'transparent', border: 'none', color: C.dangerText, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetails;
