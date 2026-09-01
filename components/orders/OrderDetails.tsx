import React, { useMemo, useRef } from 'react';
import { C, S, MONO, DISPLAY } from '../panelTheme';
import { RECARGO_URGENCIA } from '../../services/orderPricing';

/**
 * Paso 2 de Nueva Orden — "Detalles de Fabricación"
 * Concentra todas las especificaciones técnicas del ítem (tamaño, tipo de papel, cantidad,
 * numeración SRI, fecha de entrega y notas de taller) liberando el Paso 1 de ruido visual.
 */

type OpcionEntrega = 'hoy' | 'manana' | 'dos-dias' | 'exacta';

const OPCIONES_ENTREGA: { id: OpcionEntrega; label: string }[] = [
    { id: 'hoy', label: 'Hoy 17:00' },
    { id: 'manana', label: 'Mañana' },
    { id: 'dos-dias', label: 'En 2 días' },
    { id: 'exacta', label: 'Fecha exacta' },
];

const TAMANOS_CORTE = ['1/4 Oficio', '1/2 Oficio', 'Carta / A4', '1/8 Oficio', 'Personalizado'];
const TIPOS_PAPEL = ['Químico Autocopia (2c)', 'Químico (3c)', 'Bond 75g', 'Couché 300g', 'Adhesivo'];

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
    padding: '8px 12px',
    borderRadius: 9,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
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

    const updateItemSpec = (index: number, key: string, val: any) => {
        if (!setItems) return;
        setItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            return {
                ...item,
                especificaciones: {
                    ...(item.especificaciones || {}),
                    [key]: val,
                },
            };
        }));
    };

    const updateItemQty = (index: number, delta: number) => {
        if (!setItems) return;
        setItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const currentQty = item.cantidad || 1;
            const newQty = Math.max(1, currentQty + delta);
            const unitPrice = item.precioUnitario || ((item.precioFinal || 0) / currentQty);
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
            
            {/* Header del Paso 2 */}
            <div style={{ ...S.card, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                    <div>
                        <span style={S.eyebrow}>Paso 2 de 4</span>
                        <h2 style={{ ...S.h2, margin: '2px 0 0' }}>Detalles de Fabricación</h2>
                    </div>
                    {esSRI && (
                        <span style={{
                            padding: '4px 10px',
                            background: C.goldBg,
                            color: C.goldTextStrong,
                            border: `1px solid ${C.goldBorder}`,
                            borderRadius: 7,
                            fontSize: 11,
                            fontWeight: 700,
                        }}>
                            Comprobante SRI Autorizado
                        </span>
                    )}
                </div>
            </div>

            {/* Configuración de Ítems Seleccionados */}
            {items.length > 0 && (
                <div style={{ ...S.card, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ ...S.colHead, color: C.faint }}>Especificaciones por Ítem</div>
                    {items.map((item, idx) => {
                        const tamanoActual = item.especificaciones?.tamano || (item.esSRI ? '1/4 Oficio' : 'Carta / A4');
                        const papelActual = item.especificaciones?.papel || (item.esSRI ? 'Químico Autocopia (2c)' : 'Bond 75g');

                        return (
                            <div
                                key={idx}
                                style={{
                                    padding: '14px 16px',
                                    background: C.surfaceAlt,
                                    border: `1px solid ${C.border}`,
                                    borderRadius: 14,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 12,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            fontFamily: DISPLAY,
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: C.ink,
                                        }}>
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
                                        <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 600 }}>Talonarios / Unid:</span>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${C.borderStrong}`, borderRadius: 8, background: '#FFFFFF', overflow: 'hidden' }}>
                                            <button
                                                type="button"
                                                onClick={() => updateItemQty(idx, -1)}
                                                style={{ padding: '4px 9px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, color: C.ink }}
                                            >
                                                −
                                            </button>
                                            <span style={{ padding: '0 8px', fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.royal }}>
                                                {item.cantidad || 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => updateItemQty(idx, 1)}
                                                style={{ padding: '4px 9px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700, color: C.ink }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Selector de Tamaño */}
                                <div>
                                    <span style={{ ...S.fieldLabel, fontSize: 11, marginBottom: 6 }}>Tamaño de Corte:</span>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {TAMANOS_CORTE.map((tam) => (
                                            <button
                                                key={tam}
                                                type="button"
                                                onClick={() => updateItemSpec(idx, 'tamano', tam)}
                                                style={chip(tamanoActual === tam)}
                                            >
                                                {tam}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Selector de Papel */}
                                <div>
                                    <span style={{ ...S.fieldLabel, fontSize: 11, marginBottom: 6 }}>Sustrato / Papel:</span>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {TIPOS_PAPEL.map((pap) => (
                                            <button
                                                key={pap}
                                                type="button"
                                                onClick={() => updateItemSpec(idx, 'papel', pap)}
                                                style={chip(papelActual === pap)}
                                            >
                                                {pap}
                                            </button>
                                        ))}
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
                                {urgente ? 'Urgente · Prioridad inmediata' : 'Normal · Cola estándar'}
                            </span>
                            <span style={{ fontSize: 11.5, opacity: .75 }}>
                                {urgente ? `+${Math.round(RECARGO_URGENCIA * 100)}%` : 'sin recargo'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Campos SRI si aplica */}
                {esSRI && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.divider}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                        <label style={{ display: 'block' }}>
                            <span style={S.fieldLabel}>Numeración desde</span>
                            <input
                                value={numeracion}
                                onChange={e => setNumeracion?.(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                placeholder="Ej. 0000001"
                                inputMode="numeric"
                                style={{ ...S.input, fontFamily: MONO }}
                            />
                        </label>
                        <label style={{ display: 'block' }}>
                            <span style={S.fieldLabel}>Autorización SRI</span>
                            <input
                                value={autorizacionSri}
                                onChange={e => setAutorizacionSri?.(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="10 dígitos SRI"
                                inputMode="numeric"
                                style={{ ...S.input, fontFamily: MONO }}
                            />
                        </label>
                    </div>
                )}

                {/* Notas de taller */}
                <div style={{ marginTop: 14 }}>
                    <label style={{ display: 'block' }}>
                        <span style={S.fieldLabel}>Instrucciones de acabado / Notas</span>
                        <textarea
                            value={notas}
                            onChange={e => setNotas(e.target.value)}
                            rows={2}
                            placeholder="Ej. perforado lateral para archivador, cambiar numeración, tinta azul..."
                            style={{ ...S.input, resize: 'vertical', lineHeight: 1.5 }}
                        />
                    </label>
                </div>

                {/* Arte o Foto de Muestra Física */}
                {setArchivo && (
                    <div style={{
                        marginTop: 14, padding: '14px 16px', border: `1.5px dashed ${C.borderStrong}`, borderRadius: 12,
                        background: C.surfaceAlt, display: 'flex', flexDirection: 'column', gap: 10,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 34, height: 34, borderRadius: 8, background: C.chipBlue, color: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📷</span>
                                <div>
                                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.ink }}>Foto de Referencia / Muestra Física</span>
                                    <span style={{ display: 'block', fontSize: 11, color: C.faint }}>Foto del talonario anterior, boceto, sello o archivo de diseño (PDF, CDR, JPG)</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                {/* Input para Cámara Móvil */}
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

                                {/* Input para Explorador de Archivos */}
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

                        {/* Vista previa si ya hay archivo cargado */}
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
