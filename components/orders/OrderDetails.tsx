import React, { useMemo, useRef } from 'react';
import { C, S, MONO, DISPLAY } from '../panelTheme';
import { RECARGO_URGENCIA } from '../../services/orderPricing';

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

    const updateItemOption = (index: number, key: 'tamano' | 'copias' | 'diseno' | 'papel', val: string) => {
        if (!setItems) return;
        setItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const currentSpecs = item.especificaciones || {};
            const newSpecs = { ...currentSpecs, [key]: val };

            const base = item.precioBase ?? item.precioUnitario ?? 13;
            const deltaTam = OPCIONES_TAMANO.find(o => o.label === (newSpecs.tamano || '1/4 Oficio'))?.delta || 0;
            const deltaCop = item.esSRI ? (OPCIONES_COPIAS.find(o => o.label === (newSpecs.copias || 'Original + 1 Copia (Duplicado 100h)'))?.delta || 0) : 0;
            const deltaDis = OPCIONES_DISENO.find(o => o.label === (newSpecs.diseno || 'Sin Diseño (Arte provisto / Repetición)'))?.delta || 0;
            const deltaPap = OPCIONES_PAPEL.find(o => o.label === (newSpecs.papel || (item.esSRI ? 'Químico Autocopia' : 'Bond 75g')) )?.delta || 0;

            const newUnitPrice = Math.max(1, base + deltaTam + deltaCop + deltaDis + deltaPap);
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
                        const tamanoActual = item.especificaciones?.tamano || (item.esSRI ? '1/4 Oficio' : 'Carta / A4');
                        const copiasActual = item.especificaciones?.copias || (item.esSRI ? 'Original + 1 Copia (Duplicado 100h)' : 'Original (50 hojas)');
                        const disenoActual = item.especificaciones?.diseno || 'Sin Diseño (Arte provisto / Repetición)';
                        const papelActual = item.especificaciones?.papel || (item.esSRI ? 'Químico Autocopia' : 'Bond 75g');

                        const deltaTam = OPCIONES_TAMANO.find(o => o.label === tamanoActual)?.delta || 0;
                        const deltaCop = item.esSRI ? (OPCIONES_COPIAS.find(o => o.label === copiasActual)?.delta || 0) : 0;
                        const deltaDis = OPCIONES_DISENO.find(o => o.label === disenoActual)?.delta || 0;
                        const deltaPap = OPCIONES_PAPEL.find(o => o.label === papelActual)?.delta || 0;

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
                                    </div>

                                    {/* Stepper de Cantidad */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>Talonarios / Cantidad:</span>
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

                                {/* 1. Selector de Tamaño de Corte */}
                                <div>
                                    <span style={{ ...S.fieldLabel, fontSize: 11, marginBottom: 6 }}>1. Tamaño de Corte / Formato:</span>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {OPCIONES_TAMANO.map((tam) => (
                                            <button
                                                key={tam.label}
                                                type="button"
                                                onClick={() => updateItemOption(idx, 'tamano', tam.label)}
                                                style={chip(tamanoActual === tam.label)}
                                            >
                                                <span>{tam.label}</span>
                                                <span style={{ fontSize: 10, opacity: 0.8 }}>({tam.tag})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 2. Selector de Copias Químicas (para SRI / Talonarios) */}
                                {item.esSRI && (
                                    <div>
                                        <span style={{ ...S.fieldLabel, fontSize: 11, marginBottom: 6 }}>2. Número de Copias Químicas / Hojas por Talonario:</span>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {OPCIONES_COPIAS.map((cop) => (
                                                <button
                                                    key={cop.label}
                                                    type="button"
                                                    onClick={() => updateItemOption(idx, 'copias', cop.label)}
                                                    style={chip(copiasActual === cop.label)}
                                                >
                                                    <span>{cop.label}</span>
                                                    <span style={{ fontSize: 10, opacity: 0.8 }}>({cop.tag})</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Diseño & Diagramación */}
                                <div>
                                    <span style={{ ...S.fieldLabel, fontSize: 11, marginBottom: 6 }}>3. Servicio de Diseño & Preprensa:</span>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {OPCIONES_DISENO.map((dis) => (
                                            <button
                                                key={dis.label}
                                                type="button"
                                                onClick={() => updateItemOption(idx, 'diseno', dis.label)}
                                                style={chip(disenoActual === dis.label)}
                                            >
                                                <span>{dis.label}</span>
                                                <span style={{ fontSize: 10, opacity: 0.8 }}>({dis.tag})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Sustrato / Papel */}
                                <div>
                                    <span style={{ ...S.fieldLabel, fontSize: 11, marginBottom: 6 }}>4. Sustrato / Papel Base:</span>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {OPCIONES_PAPEL.map((pap) => (
                                            <button
                                                key={pap.label}
                                                type="button"
                                                onClick={() => updateItemOption(idx, 'papel', pap.label)}
                                                style={chip(papelActual === pap.label)}
                                            >
                                                <span>{pap.label}</span>
                                            </button>
                                        ))}
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
                                        {deltaTam !== 0 && ` + Formato (${deltaTam > 0 ? '+' : ''}$${deltaTam})`}
                                        {deltaCop !== 0 && ` + Copias (${deltaCop > 0 ? '+' : ''}$${deltaCop})`}
                                        {deltaDis !== 0 && ` + Diseño (+$${deltaDis})`}
                                        {deltaPap !== 0 && ` + Papel (+$${deltaPap})`}
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
