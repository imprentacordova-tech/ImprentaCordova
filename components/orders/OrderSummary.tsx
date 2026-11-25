import React, { useState } from 'react';
import { Cliente, Regimen } from '../../types';
import { formatCurrency } from '../../utils';
import { 
    TrashIcon, CheckCircleIcon, Loader2Icon, WalletIcon, 
    KeyIcon, ClockIcon, SparklesIcon, CheckBadgeIcon
} from '../Icons';
import { type CartItem } from '../../hooks/useOrder';
import { useData } from '../../contexts/DataContext';
import { sriLookupService } from '../../services/sriLookupService';
import { atajosAbono, type DesglosePedido } from '../../services/orderPricing';
import { C, S, MONO, DISPLAY } from '../panelTheme';
import { ProductVisual } from '../ProductVisual';
import { calcularHojas } from './OrderDetails';
import { camposTexto, type ItemPedido } from './itemPedido';

/** Alias histórico: los ítems del resumen son los mismos de Nueva Orden. */
export type OrderItem = ItemPedido;

/** Lo que el resumen necesita de la clave del SRI (ver `useOrder` y NuevoPedido). */
export interface SriDataResumen {
    claveAcceso?: string;
    estadoClave?: 'LISTA' | 'PENDIENTE' | 'ERROR';
    [clave: string]: unknown;
}

interface OrderSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems?: [string, CartItem][];
    items?: OrderItem[];
    orderTotal?: number;
    total?: number;
    /** Desglose calculado en `services/orderPricing.ts` (urgencia, IVA condicional, saldo). */
    desglose?: DesglosePedido;
    client: Cliente | null;
    tempClient?: { nombre: string; telefono: string; cedula?: string; regimen?: Regimen };
    setTempClient?: (data: { nombre: string; telefono: string; cedula?: string; regimen?: Regimen }) => void;
    abono: number;
    setAbono: (val: number) => void;
    prioridad?: 'Normal' | 'Urgente';
    setPrioridad?: (val: 'Normal' | 'Urgente') => void;
    tiempoEntrega?: '24h' | '48h';
    setTiempoEntrega?: (val: '24h' | '48h') => void;
    onUpdateQuantity?: (id: string, qty: number) => void;
    onUpdateNotes?: (id: string, notes: string) => void;
    onUpdatePrice?: (id: string, price: number) => void;
    onRemoveItem?: (id: string) => void;
    onSaveItem?: (id: string) => void;
    onFinalize?: () => void;
    onDeploy?: () => void;
    isLoading: boolean;
    sriData: SriDataResumen | null;
    setSriData: (data: SriDataResumen) => void;
    imprimirClave: boolean;
    setImprimirClave: (val: boolean) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
    cartItems = [], items = [], orderTotal, total, desglose, client, tempClient, setTempClient, abono, setAbono, 
    prioridad = 'Normal', setPrioridad,
    tiempoEntrega = '48h', setTiempoEntrega,
    onRemoveItem, onFinalize, onDeploy, isLoading,
    sriData, setSriData, imprimirClave, setImprimirClave
}) => {
    const { sriCredentials, upsertSriCredential } = useData();
    const [isPadronSearching, setIsPadronSearching] = useState(false);
    const [padronMatched, setPadronMatched] = useState<string | null>(null);

    const finalTotal = desglose?.total ?? total ?? orderTotal ?? 0;
    const saldo = desglose?.saldo ?? Math.max(0, finalTotal - abono);

    // Búsqueda en Bóveda SRI por RUC de cliente
    const clientRucClean = (client?.ruc || client?.cedula || tempClient?.cedula || '').replace(/\D/g, '');
    const vaultCred = (sriCredentials || []).find(c => {
        const credRuc = (c.ruc || '').replace(/\D/g, '');
        return (clientRucClean && credRuc === clientRucClean) || c.ruc === client?.ruc || c.ruc === client?.cedula;
    });

    const handleRucChange = async (rucVal: string) => {
        const clean = rucVal.replace(/\D/g, '');
        setTempClient?.({ ...tempClient!, cedula: rucVal });
        
        if (clean.length === 10 || clean.length === 13) {
            setIsPadronSearching(true);
            try {
                const data = await sriLookupService.lookupByRuc(clean);
                if (data?.razon_social) {
                    setTempClient?.({
                        ...tempClient!,
                        cedula: rucVal,
                        nombre: data.razon_social,
                        regimen: (data.regimen as Regimen) || tempClient?.regimen || Regimen.GENERAL
                    });
                    setPadronMatched(data.razon_social);
                } else {
                    setPadronMatched(null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsPadronSearching(false);
            }
        } else {
            setPadronMatched(null);
        }
    };

    const displayItems = items.length > 0 
        ? items.map((it, idx) => ({
            id: idx.toString(),
            nombre: it.nombre,
            cantidad: it.cantidad,
            precio: it.precioFinal || 0,
            categoria: it.categoria,
            esSRI: !!(it.esSRI || it.especificaciones?.sri),
            specs: camposTexto(it.especificaciones),
        }))
        : cartItems.map(([id, it]) => ({
            id,
            nombre: it.producto.nombre,
            cantidad: it.cantidad,
            precio: it.producto.precio + (it.surcharge || 0),
            categoria: it.producto.categoria,
            esSRI: it.producto.esSRI,
            specs: undefined,
        }));

    const handleFinalize = onDeploy || onFinalize || (() => {});

    /* Atajos de abono: sin abono / 50% / total / +$10, siempre topados al total */
    const atajos = atajosAbono(finalTotal, abono);
    const aplicarAbono = (val: number) => {
        setAbono(val);
        if ('vibrate' in navigator) navigator.vibrate(15);
    };

    return (
        <div style={{
            ...S.card,
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
        }}>
            {/* Header del Paso 4 */}
            <header style={{
                padding: '18px 24px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                background: C.surfaceAlt,
            }}>
                <div>
                    <span style={S.eyebrow}>Paso 4 — Resumen y Confirmación de Pago</span>
                    <h2 style={{ ...S.h2, margin: '2px 0 0', fontSize: 19 }}>
                        Confirmación de la Orden
                    </h2>
                </div>

                {setPrioridad && (
                    <button 
                        type="button"
                        onClick={() => setPrioridad(prioridad === 'Normal' ? 'Urgente' : 'Normal')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 10,
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '.04em',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            ...(prioridad === 'Urgente'
                                ? { background: C.dangerBg, border: `1.5px solid ${C.dangerBorder}`, color: C.dangerText }
                                : { background: '#FFFFFF', border: `1px solid ${C.borderStrong}`, color: C.body })
                        }}
                    >
                        <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: 99,
                            background: prioridad === 'Urgente' ? C.danger : C.faint,
                        }} />
                        <span>Prioridad: {prioridad}</span>
                    </button>
                )}
            </header>

            {/* Cuerpo de Datos */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
                {displayItems.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: C.muted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                        <WalletIcon className="w-12 h-12 text-slate-300" />
                        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', margin: 0 }}>
                            No se han agregado productos a la orden
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Lista de Items con Ilustración Dinámica */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={S.colHead}>
                                    Detalle de Productos ({displayItems.length})
                                </span>
                                <span style={{ fontSize: 11, color: C.faint, fontWeight: 600 }}>
                                    Ilustración vectorial en vivo
                                </span>
                            </div>

                            {displayItems.map((item) => {
                                const hojas = calcularHojas(item.specs?.copias, item.esSRI);
                                const cant = item.cantidad || 1;

                                return (
                                    <div 
                                        key={item.id}
                                        style={{
                                            background: C.surfaceAlt,
                                            padding: '14px 16px',
                                            borderRadius: 14,
                                            border: `1px solid ${C.border}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 14,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 200, flex: 1 }}>
                                            {/* Thumbnail Dinámico */}
                                            <div style={{
                                                width: 58,
                                                height: 58,
                                                background: '#FFFFFF',
                                                border: `1px solid ${C.borderStrong}`,
                                                borderRadius: 10,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                                boxShadow: '0 1px 4px rgba(10, 17, 64, 0.04)',
                                            }}>
                                                <ProductVisual
                                                    nombre={item.nombre}
                                                    categoria={item.categoria}
                                                    esSRI={item.esSRI}
                                                    bloques={cant}
                                                    hojas={hojas}
                                                    width={52}
                                                />
                                            </div>

                                            {/* Detalles y Badges del Ítem */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                    <h4 style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>
                                                        {item.nombre}
                                                    </h4>
                                                    <span style={{
                                                        fontSize: 9.5,
                                                        fontWeight: 800,
                                                        padding: '1px 6px',
                                                        borderRadius: 4,
                                                        background: item.esSRI ? C.goldBg : C.chipBlue,
                                                        color: item.esSRI ? C.goldTextStrong : C.royal,
                                                    }}>
                                                        {item.esSRI ? 'SRI' : 'COMERCIAL'}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
                                                    <span style={{ fontWeight: 700, color: C.royal, background: C.chipBlue, padding: '1px 6px', borderRadius: 4 }}>
                                                        {cant} {cant === 1 ? 'block' : 'blocks'}
                                                    </span>
                                                    <span style={{ color: C.muted, fontWeight: 600 }}>• {hojas} hojas c/u</span>
                                                    {item.specs?.tamano && <span style={{ color: C.muted }}>• {item.specs.tamano}</span>}
                                                    {item.specs?.papel && <span style={{ color: C.faint }}>• {item.specs.papel}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ display: 'block', fontSize: 9.5, fontWeight: 700, color: C.faint, textTransform: 'uppercase' }}>Subtotal</span>
                                                <span style={{ fontFamily: MONO, fontSize: 17, fontWeight: 800, color: C.royal }}>
                                                    {formatCurrency(item.precio)}
                                                </span>
                                            </div>
                                            {onRemoveItem && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => onRemoveItem(item.id)} 
                                                    style={{ background: 'transparent', border: 'none', color: C.faint, cursor: 'pointer', padding: 6 }}
                                                    title="Eliminar producto"
                                                >
                                                    <TrashIcon className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Datos del Cliente */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={S.colHead}>Datos del Cliente</span>
                            <div style={{
                                background: C.surfaceAlt,
                                padding: '16px 18px',
                                borderRadius: 14,
                                border: `1px solid ${C.border}`,
                            }}>
                                {client ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{
                                            width: 42,
                                            height: 42,
                                            borderRadius: 10,
                                            background: C.chipBlue,
                                            color: C.royal,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <CheckBadgeIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>
                                                {client.nombre}
                                            </h4>
                                            <div style={{ fontSize: 11.5, fontFamily: MONO, color: C.muted, marginTop: 2 }}>
                                                RUC/CI: {client.cedula || client.ruc} • Tel: {client.telefono}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                            <div>
                                                <label style={{ ...S.fieldLabel, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <span>RUC / Cédula</span>
                                                    {padronMatched && (
                                                        <span style={{ fontSize: 9.5, fontWeight: 800, color: C.successStrong, background: C.successBg, padding: '1px 6px', borderRadius: 4 }}>
                                                            EL ORO 🏛️
                                                        </span>
                                                    )}
                                                </label>
                                                <div style={{ position: 'relative' }}>
                                                    <input 
                                                        type="text" 
                                                        value={tempClient?.cedula || ''}
                                                        onChange={e => handleRucChange(e.target.value)}
                                                        placeholder="RUC o Cédula..."
                                                        style={{ ...S.input, fontFamily: MONO }}
                                                    />
                                                    {isPadronSearching && (
                                                        <Loader2Icon className="w-3.5 h-3.5 text-brand-blue animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ ...S.fieldLabel, marginBottom: 4 }}>Nombre / Razón Social</label>
                                                <input 
                                                    type="text" 
                                                    value={tempClient?.nombre || ''}
                                                    onChange={e => setTempClient?.({ ...tempClient!, nombre: e.target.value.toUpperCase() })}
                                                    placeholder="Razón Social..."
                                                    style={S.input}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ ...S.fieldLabel, marginBottom: 4 }}>Teléfono</label>
                                                <input 
                                                    type="tel" 
                                                    value={tempClient?.telefono || ''}
                                                    onChange={e => setTempClient?.({ ...tempClient!, telefono: e.target.value })}
                                                    placeholder="09..."
                                                    style={{ ...S.input, fontFamily: MONO }}
                                                />
                                            </div>
                                        </div>
                                        {padronMatched && (
                                            <div style={{
                                                fontSize: 11.5,
                                                fontWeight: 600,
                                                color: C.successStrong,
                                                background: C.successBg,
                                                border: `1px solid ${C.successBorder}`,
                                                padding: '8px 12px',
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}>
                                                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>Registrado en Padrón de El Oro: <strong>{padronMatched}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cronograma de Entrega */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={S.colHead}>Tiempo Estimado de Entrega</span>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                {[
                                    { id: '24h' as const, label: 'Express (24 Horas)', sub: 'Entrega prioritaria', icon: SparklesIcon },
                                    { id: '48h' as const, label: 'Estándar (48 Horas)', sub: 'Producción regular', icon: ClockIcon }
                                ].map(opt => {
                                    const activo = tiempoEntrega === opt.id;
                                    return (
                                        <button 
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setTiempoEntrega?.(opt.id)}
                                            style={{
                                                padding: '14px 16px',
                                                borderRadius: 12,
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                transition: 'all 0.15s ease',
                                                ...(activo
                                                    ? { background: C.chipBlue, border: `2px solid ${C.royal}`, color: C.royal }
                                                    : { background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.body })
                                            }}
                                        >
                                            <div style={{ fontFamily: DISPLAY, fontSize: 13.5, fontWeight: 800 }}>{opt.label}</div>
                                            <div style={{ fontSize: 11, color: activo ? C.royal : C.muted, marginTop: 2 }}>{opt.sub}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Clave SRI si existe */}
                        {sriData && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                                background: C.surfaceAlt,
                                padding: '16px 18px',
                                borderRadius: 14,
                                border: `1px solid ${C.border}`,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={S.colHead}>Clave / Autorización SRI</span>
                                        {vaultCred?.password ? (
                                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: C.successBg, color: C.successStrong, border: `1px solid ${C.successBorder}` }}>
                                                BÓVEDA SRI ✅
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: C.goldBg, color: C.goldTextStrong, border: `1px solid ${C.goldBorder}` }}>
                                                PENDIENTE EN BÓVEDA
                                            </span>
                                        )}
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setImprimirClave(!imprimirClave)}
                                        style={{
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            fontSize: 10,
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            border: 'none',
                                            transition: 'all 0.15s',
                                            ...(imprimirClave
                                                ? { background: C.royal, color: '#FFFFFF' }
                                                : { background: C.surface, color: C.muted, border: `1px solid ${C.border}` })
                                        }}
                                    >
                                        {imprimirClave ? '✓ Imprimir en Recibo' : 'No Imprimir'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <input 
                                        type="text"
                                        value={sriData?.claveAcceso || ''}
                                        onChange={e => {
                                            const newKey = e.target.value;
                                            setSriData({ ...sriData, claveAcceso: newKey });
                                            if (newKey.trim() && clientRucClean) {
                                                upsertSriCredential({
                                                    ruc: clientRucClean,
                                                    password: newKey.trim(),
                                                    origen: 'Orden Resumen',
                                                    updatedAt: new Date().toISOString()
                                                });
                                            }
                                        }}
                                        placeholder="Clave de acceso SRI..."
                                        style={{ ...S.input, fontFamily: MONO, fontSize: 12 }}
                                    />
                                    {vaultCred?.password && (!sriData?.claveAcceso || sriData.claveAcceso !== vaultCred.password) && (
                                        <button
                                            type="button"
                                            onClick={() => setSriData({ ...sriData, claveAcceso: vaultCred.password })}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11, fontWeight: 700, color: C.successStrong, display: 'flex', alignItems: 'center', gap: 5 }}
                                        >
                                            <KeyIcon className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Usar clave guardada en Bóveda ({vaultCred.password.slice(0, 4)}*****)</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer de Registro de Pago & Abono en Marino & Oro */}
            <div style={{
                padding: '24px 28px',
                background: C.ink,
                color: '#FFFFFF',
                borderTop: `2px solid ${C.gold}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
            }}>
                {desglose && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#BAC2DE' }}>Subtotal Base</span>
                            <span style={{ fontFamily: MONO, color: '#FFFFFF' }}>{formatCurrency(desglose.subtotal)}</span>
                        </div>
                        {desglose.diseno > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#BAC2DE' }}>Diseño & Preprensa</span>
                                <span style={{ fontFamily: MONO, color: '#FFFFFF' }}>{formatCurrency(desglose.diseno)}</span>
                            </div>
                        )}
                        {desglose.recargo > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: C.gold }}>Recargo por urgencia (15%)</span>
                                <span style={{ fontFamily: MONO, color: C.gold, fontWeight: 700 }}>{formatCurrency(desglose.recargo)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                            <span style={{ color: '#BAC2DE' }}>IVA 15%</span>
                            <span style={{ fontFamily: MONO, color: desglose.gravaIva ? '#FFFFFF' : C.gold }}>
                                {desglose.gravaIva ? formatCurrency(desglose.iva) : 'Exento SRI (Ley Orgánica)'}
                            </span>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#BAC2DE' }}>
                            Total de la Orden
                        </span>
                        <div style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-.02em', marginTop: 2 }}>
                            {formatCurrency(finalTotal)}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: saldo > 0 ? C.gold : '#4ADE80', marginTop: 4 }}>
                            Saldo Pendiente: {formatCurrency(saldo)}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
                        <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: '#BAC2DE' }}>
                            Abono Inicial (USD)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="number"
                                value={abono || ''}
                                onChange={e => setAbono(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1.5px solid rgba(255,255,255,0.2)',
                                    borderRadius: 12,
                                    padding: '10px 14px',
                                    fontSize: 20,
                                    fontWeight: 900,
                                    color: '#FFFFFF',
                                    fontFamily: MONO,
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                            <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                                <button type="button" onClick={() => aplicarAbono(atajos.ninguno)} style={{ padding: '4px 7px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>$0</button>
                                <button type="button" onClick={() => aplicarAbono(atajos.mitad)} style={{ padding: '4px 7px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>50%</button>
                                <button type="button" onClick={() => aplicarAbono(atajos.masDiez)} style={{ padding: '4px 7px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>+$10</button>
                                <button type="button" onClick={() => aplicarAbono(atajos.total)} style={{ padding: '4px 8px', background: C.gold, border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 800, color: C.ink, cursor: 'pointer' }}>Total</button>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={isLoading || displayItems.length === 0}
                    style={{
                        ...S.primaryBtn,
                        padding: '14px 24px',
                        fontSize: 14,
                        fontWeight: 800,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        opacity: (isLoading || displayItems.length === 0) ? 0.6 : 1,
                        cursor: (isLoading || displayItems.length === 0) ? 'not-allowed' : 'pointer',
                    }}
                >
                    {isLoading ? (
                        <>
                            <Loader2Icon className="w-4 h-4 animate-spin" /> Procesando Orden...
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="w-5 h-5" /> Crear y Registrar Orden de Producción
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default OrderSummary;
