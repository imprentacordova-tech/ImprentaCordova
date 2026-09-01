import React, { useMemo, useRef } from 'react';
import { C, S, MONO } from '../panelTheme';
import { RECARGO_URGENCIA } from '../../services/orderPricing';

/**
 * Paso 2 de Nueva Orden — "Detalles" del handoff (`Panel-Interno.dc.html`).
 *
 * Entrega con cuatro atajos, interruptor binario de urgencia (+15%), numeración y
 * autorización solo cuando el trabajo es SRI, notas para el taller y zona de arte.
 *
 * La prioridad es binaria a propósito: `Trabajo.prioridad` en `types.ts` es
 * `'Normal' | 'Urgente'`, y el recargo del motor de precios se dispara con `Urgente`.
 */

type OpcionEntrega = 'hoy' | 'manana' | 'dos-dias' | 'exacta';

const OPCIONES: { id: OpcionEntrega; label: string }[] = [
    { id: 'hoy', label: 'Hoy 17:00' },
    { id: 'manana', label: 'Mañana' },
    { id: 'dos-dias', label: 'En 2 días' },
    { id: 'exacta', label: 'Fecha exacta' },
];

/** Fecha que representa cada atajo; `exacta` la elige el usuario. */
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

/** Qué atajo corresponde a la fecha guardada, para que el chip activo sobreviva a un remontaje. */
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
    /** Notas para el taller — se guardan en `Trabajo.observaciones`. */
    notas: string;
    setNotas: (val: string) => void;
    prioridad: 'Normal' | 'Urgente';
    setPrioridad: (val: 'Normal' | 'Urgente') => void;
    /** Fecha de entrega en ISO. */
    fechaEntrega: string;
    setFechaEntrega: (val: string) => void;
    /** Los preimpresos SRI piden numeración inicial y número de autorización. */
    esSRI?: boolean;
    numeracion?: string;
    setNumeracion?: (val: string) => void;
    autorizacionSri?: string;
    setAutorizacionSri?: (val: string) => void;
    /** Arte del cliente; opcional — si no se pasa, la zona de adjunto no se muestra. */
    archivo?: File | null;
    setArchivo?: (file: File | null) => void;
}

const chip = (activo: boolean): React.CSSProperties => ({
    padding: '9px 13px', borderRadius: 10, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    ...(activo
        ? { background: C.royal, color: '#fff', border: `1px solid ${C.royal}` }
        : { background: C.surface, color: C.body, border: `1px solid ${C.borderStrong}` }),
});

const OrderDetails: React.FC<OrderDetailsProps> = ({
    notas, setNotas,
    prioridad, setPrioridad,
    fechaEntrega, setFechaEntrega,
    esSRI = false,
    numeracion = '', setNumeracion,
    autorizacionSri = '', setAutorizacionSri,
    archivo, setArchivo,
}) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const opcion = useMemo(() => opcionDeFecha(fechaEntrega), [fechaEntrega]);
    const urgente = prioridad === 'Urgente';

    const elegirOpcion = (id: OpcionEntrega) => {
        if (id === 'exacta') {
            /* Al pedir fecha exacta se conserva la que ya había; solo se abre el campo. */
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

    return (
        <div style={{ ...S.card, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
                <h2 style={S.h2}>2 · Detalles</h2>
                {esSRI && (
                    <span style={{ padding: '4px 10px', background: C.chipBlue, color: C.royal, borderRadius: 7, fontSize: 11, fontWeight: 700 }}>Preimpreso SRI</span>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12 }}>
                <div>
                    <span style={S.fieldLabel}>Fecha de entrega</span>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                        {OPCIONES.map(o => (
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
                    <span style={S.fieldLabel}>Prioridad</span>
                    <button
                        type="button"
                        onClick={() => setPrioridad(urgente ? 'Normal' : 'Urgente')}
                        aria-pressed={urgente}
                        style={{
                            width: '100%', minHeight: 46, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
                            borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .25s',
                            ...(urgente
                                ? { background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, color: C.dangerText }
                                : { background: C.surface, border: `1px solid ${C.borderStrong}`, color: C.body }),
                        }}
                    >
                        <span style={{ width: 9, height: 9, borderRadius: 99, flexShrink: 0, background: urgente ? C.danger : C.borderStrong }} />
                        <span style={{ flex: 1, textAlign: 'left', fontSize: 13, fontWeight: 600 }}>
                            {urgente ? 'Urgente · prioridad en taller' : 'Normal · cola estándar'}
                        </span>
                        <span style={{ fontSize: 11.5, opacity: .75 }}>
                            {urgente ? `+${Math.round(RECARGO_URGENCIA * 100)}%` : 'sin recargo'}
                        </span>
                    </button>
                </div>
            </div>

            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                {esSRI && (
                    <>
                        <label style={{ display: 'block' }}>
                            <span style={S.fieldLabel}>Numeración desde</span>
                            <input
                                value={numeracion}
                                onChange={e => setNumeracion?.(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                placeholder="4901"
                                inputMode="numeric"
                                style={{ ...S.input, fontFamily: MONO }}
                            />
                        </label>
                        <label style={{ display: 'block' }}>
                            <span style={S.fieldLabel}>Autorización SRI</span>
                            <input
                                value={autorizacionSri}
                                onChange={e => setAutorizacionSri?.(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="1234567890"
                                inputMode="numeric"
                                style={{ ...S.input, fontFamily: MONO }}
                            />
                        </label>
                    </>
                )}
                <label style={{ display: 'block', gridColumn: '1 / -1' }}>
                    <span style={S.fieldLabel}>Notas para el taller</span>
                    <textarea
                        value={notas}
                        onChange={e => setNotas(e.target.value)}
                        rows={3}
                        placeholder="Ej. mismo diseño del talonario anterior, cambiar solo numeración"
                        style={{ ...S.input, resize: 'vertical', lineHeight: 1.6 }}
                    />
                </label>
            </div>

            {setArchivo && (
                <div style={{
                    marginTop: 14, padding: '15px 16px', border: `1.5px dashed ${C.borderStrong}`, borderRadius: 12,
                    background: C.surfaceAlt, display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap',
                }}>
                    <span style={{ width: 38, height: 38, borderRadius: 10, background: C.chipBlue, color: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>⤒</span>
                    <span style={{ flex: 1, minWidth: 180 }}>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.ink }}>Arte del cliente</span>
                        <span style={{ display: 'block', fontSize: 11.5, color: C.faint, marginTop: 2 }}>PDF, AI, CDR o JPG · máx. 40 MB</span>
                    </span>
                    <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {archivo && (
                            <span style={{ padding: '6px 11px', background: C.surface, border: `1px solid ${C.borderStrong}`, borderRadius: 8, fontSize: 11.5, color: C.body, fontFamily: MONO }}>
                                {archivo.name}
                            </span>
                        )}
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
                        <button type="button" onClick={() => fileRef.current?.click()} style={{ ...S.softBtn, background: C.chipBlue }}>
                            {archivo ? 'Cambiar archivo' : 'Buscar archivo'}
                        </button>
                    </span>
                </div>
            )}
        </div>
    );
};

export default OrderDetails;
