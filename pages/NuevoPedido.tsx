import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { logActivity } from '../services/activityLogService';
import { Cliente, User, TrabajoEstado } from '../types';
import ClientSelector from '../components/orders/ClientSelector';
import ServiceSelector from '../components/orders/ServiceSelector';
import ProductConfigurator from '../components/orders/ProductConfigurator';
import OrderSummary from '../components/orders/OrderSummary';
import OrderDetails from '../components/orders/OrderDetails';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';
import { calcularPedido, round2 } from '../services/orderPricing';

/**
 * Nueva Orden Unificada — Sistema "Marino & Oro"
 * Flujo lineal de 4 pasos para mostrador:
 * 1. Producto / Catálogo -> 2. Detalles (SRI integrado) -> 3. Cliente -> 4. Pago y Resumen
 */

const STEP_CONFIG = [
    { id: 1, label: '1 · Producto Base', subtitle: '¿Qué va a imprimir?', icon: '📦' },
    { id: 2, label: '2 · Medidas & Copias', subtitle: 'Calculadora dinámica', icon: '📏' },
    { id: 3, label: '3 · Datos de Cliente', subtitle: 'RUC / Razón Social', icon: '👤' },
    { id: 4, label: '4 · Pago & Despacho', subtitle: 'Anticipo y liquidación', icon: '💳' },
];

const CATEGORIAS_CATALOGO = ['Todos', 'Comprobantes SRI', 'Papelería Comercial', 'Publicidad & Sellos'] as const;

const CATALOGO_RAPIDO = [
  { id: '1', nombre: 'Nota de Venta', cat: 'Comprobantes SRI', tag: 'SRI', precio: 13, esSRI: true },
  { id: '2', nombre: 'Factura Autorizada', cat: 'Comprobantes SRI', tag: 'SRI', precio: 15, esSRI: true },
  { id: '3', nombre: 'Liquidación de Compra', cat: 'Comprobantes SRI', tag: 'SRI', precio: 15, esSRI: true },
  { id: '4', nombre: 'Guía de Remisión', cat: 'Comprobantes SRI', tag: 'SRI', precio: 16, esSRI: true },
  { id: '5', nombre: '1.000 Tarjetas de Presentación', cat: 'Publicidad & Sellos', tag: 'Comercial', precio: 28, esSRI: false },
  { id: '6', nombre: '1.000 Volantes Publicitarios', cat: 'Publicidad & Sellos', tag: 'Comercial', precio: 22, esSRI: false },
  { id: '7', nombre: 'Sello Automático Trodat', cat: 'Publicidad & Sellos', tag: 'Comercial', precio: 16, esSRI: false },
  { id: '8', nombre: 'Talonario de Recibos de Caja', cat: 'Papelería Comercial', tag: 'Comercial', precio: 12, esSRI: false },
  { id: '9', nombre: 'Hojas Membretadas (Millar)', cat: 'Papelería Comercial', tag: 'Comercial', precio: 35, esSRI: false },
  { id: '10', nombre: 'Gigantografía / Lona Banner', cat: 'Publicidad & Sellos', tag: 'Comercial', precio: 12, esSRI: false },
];

const NuevoPedidoPage: React.FC = () => {
    const outletCtx = useOutletContext<{ currentUser?: User }>();
    const { user: authUser } = useAuth();
    const currentUser = outletCtx?.currentUser || authUser || ({ nombre: 'Pedro Cordova', rol: 'Administrador' } as unknown as User);
    const { refreshData, addTrabajo, addCliente, clientes } = useData();
    const navigate = useNavigate();
    const location = useLocation();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [tempClient, setTempClient] = useState<any>({ nombre: '', telefono: '', cedula: '', regimen: 'General' });
    const [servicio, setServicio] = useState<any>(null);
    const [abono, setAbono] = useState(0);
    const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>('Normal');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [createdTrabajoId, setCreatedTrabajoId] = useState<string | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [busqueda, setBusqueda] = useState('');

    // Detalles del pedido
    const [notasTaller, setNotasTaller] = useState('');
    const [fechaEntrega, setFechaEntrega] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(17, 0, 0, 0); return d.toISOString();
    });

    // Campos SRI
    const [numeracionInicial, setNumeracionInicial] = useState('');
    const [autorizacionSriInput, setAutorizacionSriInput] = useState('');
    const [sriEstablecimiento, setSriEstablecimiento] = useState('001');
    const [sriPuntoEmision, setSriPuntoEmision] = useState('001');
    const [sriClave, setSriClave] = useState('');
    const [sriActividad, setSriActividad] = useState('');
    const [imprimirClave, setImprimirClave] = useState(false);
    const [isAddingCustomItem, setIsAddingCustomItem] = useState(false);
    const [sriAutoFillBanner, setSriAutoFillBanner] = useState<any>(null);
    const [filtroCat, setFiltroCat] = useState<string>('Todos');

    // ¿La orden contiene al menos un producto con requerimientos SRI?
    const hasSriItem = useMemo(() => items.some(i => i.esSRI || i.especificaciones?.sri), [items]);

    const applySriPayload = (payload: any) => {
        if (!payload) return;
        const ruc = payload.ruc || payload.clientRuc || '';
        const name = payload.name || payload.clientName || '';
        const phone = payload.phone || payload.clientPhone || '';
        const activity = payload.activity || 'Comercio / Servicios General';
        const docType = payload.docType || '1';
        const blocks = parseInt(payload.blocks || payload.comprobantes || '100', 10) || 100;
        const docSize = payload.docSize || '1/4 Oficio';
        const totalVal = parseFloat(payload.total) || 13;
        const abonoVal = parseFloat(payload.abono) || 0;

        setSriActividad(activity);

        if (ruc || name) {
            const cleanRuc = ruc.replace(/\D/g, '');
            const found = clientes.find(c => (cleanRuc && (c.ruc === cleanRuc || c.cedula === cleanRuc)) || (name && c.nombre.toUpperCase().includes(name.toUpperCase())));
            if (found) {
                setCliente(found);
            } else {
                setTempClient({
                    nombre: (name || 'CLIENTE SRI').toUpperCase(),
                    cedula: cleanRuc || '0700000000001',
                    telefono: phone,
                    email: payload.email || undefined,
                    actividades: activity || undefined,
                    regimen: docType === '1' ? 'Rimpe Popular' : 'General'
                });
            }
        }

        const docNames: Record<string, string> = { '0': 'Factura', '1': 'Nota de Venta', '5': 'Guía de Remisión' };
        const docName = docNames[docType] || 'Nota de Venta';

        const sriItem = {
            nombre: docName,
            cantidad: 1,
            precioUnitario: totalVal,
            precioFinal: totalVal,
            esSRI: true,
            especificaciones: {
                tamano: docSize,
                paginas: blocks,
                papel: 'Químico Autocopia (2c)',
                sri: { vencimiento: payload.caducidad || '' }
            }
        };

        setItems([sriItem]);
        setAbono(abonoVal);
        setStep(2);
    };

    useEffect(() => {
        document.body.style.overflow = 'auto';

        const params = new URLSearchParams(location.search);
        if (params.get('mode') === 'sri') applySriPayload(Object.fromEntries(params.entries()));

        const handleMessage = (e: MessageEvent) => {
            if (e.origin && e.origin !== window.location.origin && !e.origin.includes('sri.gob.ec')) {
                return;
            }
            if (e.data && e.data.type === 'CORDOVA_SRI_ORDER_EVENT') {
                setSriAutoFillBanner(e.data.payload);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [location.search, clientes]);

    /**
     * Motor de precios unificado (orderPricing.ts):
     * Cada ítem indica si grava IVA o no. Los de SRI no gravan IVA.
     */
    const desglose = useMemo(
        () => calcularPedido(
            items.map(it => ({ precioLinea: it.precioFinal || 0, grava: !it.esSRI })),
            { urgente: prioridad === 'Urgente', abono },
        ),
        [items, prioridad, abono],
    );

    useEffect(() => {
        if (abono > desglose.total) setAbono(desglose.total);
    }, [desglose.total, abono]);

    const canAdvance = () => {
        if (step === 1) return items.length > 0;
        if (step === 2) return true;
        if (step === 3) return !!cliente || !!(tempClient?.nombre || tempClient?.cedula);
        if (step === 4) return desglose.total > 0;
        return false;
    };

    const handleSelectQuickProduct = (p: typeof CATALOGO_RAPIDO[0]) => {
        const newItem = {
            nombre: p.nombre,
            cantidad: 1,
            precioBase: p.precio,
            precioUnitario: p.precio,
            precioFinal: p.precio,
            esSRI: p.esSRI,
            especificaciones: {
                tamano: p.esSRI ? '1/4 Oficio' : 'Carta / A4',
                copias: p.esSRI ? 'Original + 1 Copia (Duplicado 100h)' : 'Original (50 hojas)',
                diseno: 'Sin Diseño (Arte provisto / Repetición)',
                papel: p.esSRI ? 'Químico Autocopia' : 'Bond 75g',
                esSRI: p.esSRI,
            }
        };
        setItems([newItem]);
        setStep(2);
    };

    const handleCreateOrder = async () => {
        if (items.length === 0) { setError('Debe agregar al menos un ítem al pedido.'); return; }

        const desgloseItems = items.map(item => calcularPedido(
            [{ precioLinea: item.precioFinal || 0, grava: !item.esSRI }],
            { urgente: prioridad === 'Urgente' },
        ));
        let porRepartir = Math.min(Math.max(abono, 0), desglose.total);
        const abonos = desgloseItems.map(d => {
            const aplicado = round2(Math.min(porRepartir, d.total));
            porRepartir = round2(porRepartir - aplicado);
            return aplicado;
        });

        setLoading(true);
        setError(null);
        try {
            const userName = currentUser?.nombre || 'Pedro Córdova';
            const userRol = currentUser?.rol || 'Administrador';
            let finalCliente = cliente;
            if (!finalCliente) {
                if (tempClient?.cedula || tempClient?.nombre) {
                    const cleanCed = (tempClient.cedula || '').replace(/\D/g, '');
                    finalCliente = clientes.find(c => c.cedula === cleanCed || c.ruc === cleanCed)
                        || await addCliente({
                            nombre: (tempClient.nombre || 'CONSUMIDOR FINAL').toUpperCase(),
                            cedula: cleanCed || '9999999999',
                            telefono: tempClient.telefono ? [tempClient.telefono] : [],
                            regimen: tempClient.regimen || 'General',
                            direccion: 'Local'
                        });
                } else {
                    finalCliente = clientes.find(c => c.cedula === '9999999999')
                        || await addCliente({ nombre: 'CONSUMIDOR FINAL', cedula: '9999999999', regimen: 'General', direccion: 'Local' });
                }
            }
            if (!finalCliente) throw new Error('No se pudo establecer un cliente para el pedido.');

            const results = await Promise.all(items.map(async (item, index) => addTrabajo({
                titular: finalCliente!.nombre,
                clienteId: finalCliente!.id ? finalCliente!.id : undefined,
                servicio: item.nombre || 'Servicio General',
                detalle: item.esSRI ? `${item.cantidad || 1}x ${item.nombre} (${item.especificaciones?.tamano || 'Estándar'})` : (item.descripcion || item.nombre),
                cantidad: item.cantidad || 1,
                precio: desgloseItems[index].total,
                abono: abonos[index],
                saldo: round2(desgloseItems[index].total - abonos[index]),
                prioridad,
                estado: TrabajoEstado.PENDIENTE,
                fechaEntrada: new Date().toISOString(),
                responsable: userName,
                origen: 'Local',
                esSRI: !!item.esSRI,
                establecimiento: item.esSRI ? sriEstablecimiento : undefined,
                puntoEmision: item.esSRI ? sriPuntoEmision : undefined,
                tamano: item.especificaciones?.tamano || undefined,
                estadoClave: item.esSRI ? (sriClave ? 'LISTA' : 'PENDIENTE') : 'LISTA',
                claveAcceso: item.esSRI ? sriClave : undefined,
                actividadSeleccionada: item.esSRI ? sriActividad : null,
                imprimirClave: item.esSRI ? imprimirClave : false,
                fechaEntrega,
                observaciones: notasTaller || undefined,
                numeracion: numeracionInicial || item.especificaciones?.numerado,
                autorizacion_sri: autorizacionSriInput || item.especificaciones?.sri?.autorizacion,
                fechaVencimiento: item.especificaciones?.sri?.vencimiento,
            } as any, userName, imageFile)));

            logActivity(userName, userRol, 'CREAR_ORDEN', `Pedido unificado (${items.length} ítems) para ${finalCliente.nombre}`, 'Ventas').catch(() => {});
            refreshData().catch(() => {});
            setCreatedTrabajoId(results[0].id);
            setStep(5);
            setTimeout(() => {
                window.open(hasSriItem ? `/#/solicitud-impresion/${results[0].id}?format=a5` : `/#/recibo-epson/${results[0].id}`, '_blank');
            }, 800);
        } catch (err: any) {
            console.error('[NuevoPedido] Error al crear orden:', err);
            setError(err.message || 'Error al procesar la orden.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Nueva Orden Unificada · Imprenta Córdova" />
            <div style={S.wrap}>

                {/* Cabecera de Página */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Operaciones · Flujo Unificado</p>
                        <h1 style={S.h1}>Nueva Orden</h1>
                        <p style={S.lead}>Un solo flujo para todo: preimpresos del SRI y trabajos comerciales en la misma orden.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            onClick={() => navigate('/calculadora')}
                            style={{ ...S.outlineBtn, padding: '9px 15px', fontSize: 12.5 }}
                        >
                            Cotizador de Pliegos →
                        </button>
                    </div>
                </div>

                {/* Banner de Detección SRI Extension — Tarjeta Inteligente */}
                {sriAutoFillBanner && (
                    <div style={{
                        background: 'linear-gradient(135deg, #0A1140 0%, #16309B 100%)',
                        border: '1.5px solid #FFC61A',
                        borderRadius: 16,
                        padding: '18px 22px',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                        boxShadow: '0 12px 32px -8px rgba(10,17,64,0.35)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 280 }}>
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: '#FFC61A',
                                color: '#0A1140',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 22,
                                fontWeight: 900,
                                flexShrink: 0,
                                boxShadow: '0 4px 12px rgba(255,198,26,0.3)',
                            }}>
                                ⚡
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 800,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        background: 'rgba(255,198,26,0.2)',
                                        color: '#FFC61A',
                                        border: '1px solid rgba(255,198,26,0.4)',
                                    }}>
                                        ● SRI Online Detectado
                                    </span>
                                    <span style={{ fontFamily: MONO, fontSize: 13, color: '#FFFFFF', fontWeight: 700 }}>
                                        RUC {sriAutoFillBanner.ruc || sriAutoFillBanner.clientRuc}
                                    </span>
                                </div>
                                <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
                                    {sriAutoFillBanner.name || sriAutoFillBanner.clientName || 'Contribuyente SRI'}
                                </div>
                                <div style={{ fontSize: 12, color: '#CAD5F5', marginTop: 2 }}>
                                    Solicitud: <b style={{ color: '#FFFFFF' }}>{sriAutoFillBanner.docType === '0' ? 'Factura' : sriAutoFillBanner.docType === '5' ? 'Guía de Remisión' : 'Nota de Venta'}</b> ({sriAutoFillBanner.blocks || 100} hojas) · Actividad: {sriAutoFillBanner.activity || 'General'}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={() => { applySriPayload(sriAutoFillBanner); setSriAutoFillBanner(null); }}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: 11,
                                    background: '#FFC61A',
                                    color: '#0A1140',
                                    border: 'none',
                                    fontSize: 13,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontFamily: 'inherit',
                                    boxShadow: '0 4px 14px rgba(255,198,26,0.4)',
                                    transition: 'transform 0.15s ease',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                ⚡ Autollenar Orden (1 Clic)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSriAutoFillBanner(null)}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 11,
                                    background: 'rgba(255,255,255,0.12)',
                                    color: '#FFFFFF',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Descartar
                            </button>
                        </div>
                    </div>
                )}

                {/* Camino / Proceso de Solicitud (Stepper Visual con Regla Inmutable) */}
                <div style={{ ...S.card, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'center' }}>
                        {STEP_CONFIG.map((cfg) => {
                            const active = step === cfg.id;
                            const past = step > cfg.id;
                            return (
                                <button
                                    key={cfg.id}
                                    type="button"
                                    disabled={!past && !active}
                                    onClick={() => past && setStep(cfg.id)}
                                    style={{
                                        flex: '1 0 auto',
                                        minWidth: 145,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 10,
                                        border: `1px solid ${active ? C.royal : past ? C.borderStrong : C.divider}`,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        whiteSpace: 'nowrap',
                                        cursor: past ? 'pointer' : 'default',
                                        fontFamily: 'inherit',
                                        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                        ...(active
                                            ? { background: C.royal, color: '#FFFFFF', boxShadow: '0 4px 12px rgba(22,48,155,0.2)' }
                                            : past
                                            ? { background: C.chipBlue, color: C.royal }
                                            : { background: C.surfaceAlt, color: C.faint }),
                                    }}
                                >
                                    <span style={{ fontSize: 13 }}>{past ? '✓' : cfg.icon}</span>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ lineHeight: 1.1 }}>{cfg.label}</div>
                                        <div style={{ fontSize: 10, opacity: active ? 0.85 : 0.6, fontWeight: 500 }}>{cfg.subtitle}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Barra de Progreso del Camino */}
                    <div style={{ height: 4, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${(step / 4) * 100}%`,
                                background: `linear-gradient(90deg, ${C.royal} 0%, ${C.gold} 100%)`,
                                transition: 'width 0.3s ease',
                            }}
                        />
                    </div>
                </div>

                {/* Contenido Principal y Sidebar de Resumen Responsivo */}
                <div className={`grid gap-4 items-start ${step < 5 ? 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]' : 'grid-cols-1'}`}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                        <AnimatePresence mode="wait">

                            {/* PASO 1: Catálogo y Productos */}
                            {step === 1 && (
                                <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ ...S.card, padding: 22 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                                        <div>
                                            <h2 style={S.h2}>1 · ¿Qué va a imprimir?</h2>
                                            <p style={{ ...S.lead, fontSize: 13 }}>Selecciona el producto principal o búscalo por nombre. Medidas y copias se configuran en el Paso 2.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingCustomItem(v => !v)}
                                            style={S.softBtn}
                                        >
                                            {isAddingCustomItem ? '← Volver a Rápidos' : 'Catálogo Completo'}
                                        </button>
                                    </div>

                                    {!isAddingCustomItem ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            
                                            {/* Barra de Búsqueda Inteligente */}
                                            <div style={{ position: 'relative', width: '100%' }}>
                                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.faint }}>
                                                    🔍
                                                </span>
                                                <input
                                                    type="text"
                                                    value={busqueda}
                                                    onChange={(e) => setBusqueda(e.target.value)}
                                                    placeholder="Buscar producto (ej: nota de venta, factura, volante, tarjeta, sello, lona...)"
                                                    style={{
                                                        width: '100%',
                                                        padding: '11px 14px 11px 40px',
                                                        borderRadius: 12,
                                                        border: `1px solid ${busqueda ? C.royal : C.borderStrong}`,
                                                        background: '#FFFFFF',
                                                        fontSize: 13,
                                                        fontFamily: 'inherit',
                                                        color: C.ink,
                                                        outline: 'none',
                                                        transition: 'border-color 0.2s',
                                                        boxShadow: busqueda ? '0 0 0 3px rgba(22,48,155,0.08)' : 'none',
                                                    }}
                                                />
                                                {busqueda && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setBusqueda('')}
                                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: C.faint, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>

                                            {/* Tabs de Filtro de Categoría */}
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {CATEGORIAS_CATALOGO.map((cat) => {
                                                    const activo = filtroCat === cat;
                                                    return (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => setFiltroCat(cat)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: 8,
                                                                border: `1px solid ${activo ? C.royal : C.borderStrong}`,
                                                                background: activo ? C.royal : C.surface,
                                                                color: activo ? '#FFFFFF' : C.body,
                                                                fontSize: 12,
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.15s ease',
                                                            }}
                                                        >
                                                            {cat}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Tarjetas Minimalistas de Producto */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                                {CATALOGO_RAPIDO
                                                    .filter(p => {
                                                        const matchCat = filtroCat === 'Todos' || p.cat === filtroCat;
                                                        const matchSearch = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.tag.toLowerCase().includes(busqueda.toLowerCase());
                                                        return matchCat && matchSearch;
                                                    })
                                                    .map((p) => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            onClick={() => handleSelectQuickProduct(p)}
                                                            style={{
                                                                textAlign: 'left',
                                                                padding: '16px 18px',
                                                                borderRadius: 14,
                                                                border: `1px solid ${C.border}`,
                                                                background: C.surface,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                justifyContent: 'space-between',
                                                                minHeight: 110,
                                                                transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                                                boxShadow: '0 2px 4px rgba(10,17,64,0.02)',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.borderColor = C.royal;
                                                                e.currentTarget.style.background = C.surfaceAlt;
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 8px 20px -6px rgba(10,17,64,0.08)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.borderColor = C.border;
                                                                e.currentTarget.style.background = C.surface;
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(10,17,64,0.02)';
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                                <span style={{
                                                                    fontSize: 10,
                                                                    fontWeight: 800,
                                                                    padding: '3px 7px',
                                                                    borderRadius: 6,
                                                                    background: p.esSRI ? C.goldBg : C.chipBlue,
                                                                    color: p.esSRI ? C.goldTextStrong : C.royal,
                                                                    border: `1px solid ${p.esSRI ? C.goldBorder : '#D7DDF0'}`,
                                                                }}>
                                                                    {p.tag}
                                                                </span>
                                                                <span style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 700, color: C.royal }}>
                                                                    ${p.precio.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 12 }}>
                                                                {p.nombre}
                                                            </div>
                                                            <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: C.royal, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                Configurar detalles →
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {!servicio ? (
                                                <ServiceSelector onSelect={setServicio} />
                                            ) : (
                                                <ProductConfigurator
                                                    product={servicio}
                                                    onCancel={() => setServicio(null)}
                                                    onComplete={(configItem) => {
                                                        setItems(prev => [...prev, configItem]);
                                                        setServicio(null);
                                                        setIsAddingCustomItem(false);
                                                        setStep(2);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {items.length > 0 && !isAddingCustomItem && (
                                        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.divider}`, display: 'flex', justifyContent: 'flex-end' }}>
                                            <button style={S.primaryBtn} onClick={() => setStep(2)}>
                                                Continuar a Medidas con {items.length} ítem(s) →
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* PASO 2: Detalles de la Orden */}
                            {step === 2 && (
                                <motion.div key="s2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                    <OrderDetails
                                        items={items}
                                        setItems={setItems}
                                        notas={notasTaller}
                                        setNotas={setNotasTaller}
                                        prioridad={prioridad}
                                        setPrioridad={setPrioridad}
                                        fechaEntrega={fechaEntrega}
                                        setFechaEntrega={setFechaEntrega}
                                        esSRI={hasSriItem}
                                        numeracion={numeracionInicial}
                                        setNumeracion={setNumeracionInicial}
                                        autorizacionSri={autorizacionSriInput}
                                        setAutorizacionSri={setAutorizacionSriInput}
                                        archivo={imageFile}
                                        setArchivo={setImageFile}
                                    />
                                </motion.div>
                            )}

                            {/* PASO 3: Selección / Registro de Cliente */}
                            {step === 3 && (
                                <motion.div key="s3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={{ ...S.card, padding: 20 }}>
                                    <h2 style={{ ...S.h2, marginBottom: 14 }}>3 · Cliente</h2>
                                    <ClientSelector
                                        onSelect={(c) => {
                                            setCliente(c);
                                            if (c) {
                                                setSriEstablecimiento(c.establecimientoPredeterminado || '001');
                                                setSriPuntoEmision(c.puntoEmisionPredeterminado || '001');
                                                setSriActividad(c.actividades || '');
                                                setStep(4);
                                            }
                                        }}
                                        onCancel={() => setStep(2)}
                                    />
                                </motion.div>
                            )}

                            {/* PASO 4: Pago y Confirmación */}
                            {step === 4 && (
                                <motion.div key="s4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    {error && (
                                        <div style={{ padding: 14, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: 12, color: C.dangerText, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
                                            {error}
                                        </div>
                                    )}
                                    <OrderSummary
                                        isOpen
                                        items={items}
                                        total={desglose.total}
                                        desglose={desglose}
                                        abono={abono}
                                        setAbono={setAbono}
                                        client={cliente}
                                        prioridad={prioridad}
                                        setPrioridad={setPrioridad}
                                        tempClient={tempClient}
                                        setTempClient={setTempClient}
                                        onDeploy={handleCreateOrder}
                                        isLoading={loading}
                                        sriData={{ claveAcceso: sriClave, estadoClave: sriClave ? 'LISTA' : 'PENDIENTE' }}
                                        setSriData={(d) => setSriClave(d.claveAcceso)}
                                        imprimirClave={imprimirClave}
                                        setImprimirClave={setImprimirClave}
                                        onClose={() => setStep(3)}
                                    />
                                </motion.div>
                            )}

                            {/* PASO 5: Confirmación de Éxito */}
                            {step === 5 && (
                                <motion.div key="s5" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ ...S.card, padding: '44px 28px', textAlign: 'center' }}>
                                    <div style={{ width: 52, height: 52, borderRadius: 99, background: C.successBg, border: `1px solid ${C.successBorder}`, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto' }}>
                                        ✓
                                    </div>
                                    <div style={{ ...S.colHead, color: C.success, marginTop: 14 }}>Orden guardada en taller</div>
                                    <h2 style={{ ...S.h1, fontSize: 26, marginTop: 6 }}>Orden #{createdTrabajoId?.substring(0, 8)}</h2>
                                    <p style={{ ...S.lead, fontSize: 14, maxWidth: 500, margin: '10px auto 0' }}>
                                        {hasSriItem
                                            ? 'Se ha generado la solicitud de autorización SRI en formato A5.'
                                            : 'Se ha enviado la orden de producción a taller y generado el recibo.'}
                                    </p>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
                                        <button style={S.softBtn} onClick={() => navigate('/dashboard')}>
                                            Ir al Panel Principal
                                        </button>
                                        <button style={S.primaryBtn} onClick={() => {
                                            setStep(1);
                                            setItems([]);
                                            setCliente(null);
                                            setAbono(0);
                                            setCreatedTrabajoId(null);
                                        }}>
                                            Crear Otra Orden
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Botones de Navegación Inferior */}
                        {step < 4 && step > 1 && (
                            <div style={{ ...S.card, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button style={S.softBtn} onClick={() => setStep(p => p - 1)}>
                                    ← Volver al paso {step - 1}
                                </button>
                                {canAdvance() && (
                                    <button style={S.primaryBtn} onClick={() => setStep(p => p + 1)}>
                                        Continuar al paso {step + 1} →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar Resumen de la Orden */}
                    {step < 5 && (
                        <div className="w-full lg:sticky lg:top-[88px]" style={{ ...S.card, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <h3 style={{ ...S.h2, fontSize: 16 }}>Resumen en Vivo</h3>

                            {/* Lista de Ítems */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                                {items.length === 0 ? (
                                    <p style={{ margin: 0, fontSize: 12.5, color: C.faint, fontStyle: 'italic' }}>
                                        No hay ítems seleccionados todavía.
                                    </p>
                                ) : (
                                    items.map((item, idx) => (
                                        <div key={idx} style={{ padding: '8px 10px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.nombre}
                                                </div>
                                                <div style={{ fontSize: 11, color: C.faint }}>
                                                    {item.cantidad || 1} u. {item.esSRI ? '· (Sin IVA SRI)' : '· (+15% IVA)'}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: C.royal }}>
                                                    ${(item.precioFinal || 0).toFixed(2)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                                                    style={{ background: 'transparent', border: 'none', color: C.dangerText, cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}
                                                    title="Eliminar"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Tarjeta de Aritmética */}
                            <div style={{ ...S.card, background: C.bg, padding: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span style={S.colHead}>Subtotal</span>
                                    <span style={{ fontFamily: MONO, fontSize: 13, color: C.body }}>
                                        {formatCurrency(desglose.subtotal)}
                                    </span>
                                </div>
                                {desglose.recargoUrgencia > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                                        <span style={{ color: C.dangerText }}>Urgencia (+15%)</span>
                                        <span style={{ color: C.dangerText, fontFamily: MONO }}>+{formatCurrency(desglose.recargoUrgencia)}</span>
                                    </div>
                                )}
                                {desglose.iva > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                                        <span style={{ color: C.muted }}>IVA (15%)</span>
                                        <span style={{ color: C.body, fontFamily: MONO }}>+{formatCurrency(desglose.iva)}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.rowLine}` }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Total Orden</span>
                                    <span style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 800, color: C.royal }}>
                                        {formatCurrency(desglose.total)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.rowLine}` }}>
                                    <span style={{ color: C.muted }}>Abono recibido</span>
                                    <span style={{ color: C.successStrong, fontFamily: MONO, fontWeight: 700 }}>{formatCurrency(abono)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                                    <span style={{ color: C.muted }}>Saldo pendiente</span>
                                    <span style={{ color: desglose.saldo > 0 ? C.dangerText : C.successStrong, fontFamily: MONO, fontWeight: 700 }}>
                                        {formatCurrency(desglose.saldo)}
                                    </span>
                                </div>
                            </div>

                            {/* Atajo rápido de entrega */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5, color: C.muted }}>
                                <span>Prioridad: <b style={{ color: prioridad === 'Urgente' ? C.danger : C.ink }}>{prioridad}</b></span>
                                <span>Entrega: <b>{new Date(fechaEntrega).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}</b></span>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default NuevoPedidoPage;
