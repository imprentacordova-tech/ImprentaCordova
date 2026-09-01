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

const STEP_LABELS = ['1. Producto', '2. Detalles', '3. Cliente', '4. Pago y Resumen'];

const CATALOGO_RAPIDO = [
  { id: '1', nombre: '100 Notas de Venta', cat: 'SRI', desc: '1/4 Oficio · 100 hojas', precio: 13, esSRI: true },
  { id: '2', nombre: '100 Facturas SRI', cat: 'SRI', desc: '1/4 Oficio · 2 copias', precio: 15, esSRI: true },
  { id: '3', nombre: '1.000 Tarjetas de Presentación', cat: 'Comercial', desc: 'Couche 300g · Mate + UV', precio: 28, esSRI: false },
  { id: '4', nombre: '1.000 Volantes 1/4 Oficio', cat: 'Comercial', desc: 'Bond 75g · Full color', precio: 22, esSRI: false },
  { id: '5', nombre: 'Sello Automático Trodat', cat: 'Comercial', desc: 'Texto + logo personalizado', precio: 16, esSRI: false },
  { id: '6', nombre: 'Talonario de Recibos', cat: 'Comercial', desc: '1/4 Oficio · Numerado', precio: 12, esSRI: false },
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
            nombre: `${docName} (${blocks} Hojas)`,
            cantidad: 1,
            precioFinal: totalVal,
            esSRI: true,
            especificaciones: {
                tamano: docSize,
                paginas: blocks,
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
            precioFinal: p.precio,
            esSRI: p.esSRI,
            descripcion: p.desc,
            especificaciones: { tamano: 'Estándar', esSRI: p.esSRI }
        };
        setItems(prev => [...prev, newItem]);
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

                {/* Banner de Detección SRI Extension */}
                {sriAutoFillBanner && (
                    <div style={{ ...S.accentCard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ ...S.colHead, color: '#93A0C8' }}>Solicitud SRI detectada por Extensión</div>
                            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                                RUC {sriAutoFillBanner.ruc || sriAutoFillBanner.clientRuc} · {sriAutoFillBanner.name || sriAutoFillBanner.clientName} ({sriAutoFillBanner.blocks || 100} hojas)
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ ...S.primaryBtn, background: '#1B6E3E' }} onClick={() => { applySriPayload(sriAutoFillBanner); setSriAutoFillBanner(null); }}>
                                Importar (1 clic)
                            </button>
                            <button style={S.softBtn} onClick={() => setSriAutoFillBanner(null)}>Descartar</button>
                        </div>
                    </div>
                )}

                {/* Stepper de 4 Pasos */}
                <div style={{ ...S.card, padding: '10px 14px', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {STEP_LABELS.map((label, i) => {
                        const id = i + 1;
                        const active = step === id;
                        const past = step > id;
                        return (
                            <button
                                key={label}
                                type="button"
                                disabled={!past && !active}
                                onClick={() => past && setStep(id)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '7px 12px',
                                    borderRadius: 9,
                                    border: 'none',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: past ? 'pointer' : 'default',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.2s',
                                    ...(active ? { background: C.royal, color: '#FFFFFF' } : past ? { background: C.chipBlue, color: C.royal } : { background: 'transparent', color: C.faint }),
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Contenido Principal y Sidebar de Resumen */}
                <div style={{ display: 'grid', gridTemplateColumns: step < 5 ? 'minmax(0,1fr) minmax(0,340px)' : '1fr', gap: 16, alignItems: 'start' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                        <AnimatePresence mode="wait">

                            {/* PASO 1: Catálogo y Productos */}
                            {step === 1 && (
                                <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ ...S.card, padding: 22 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                                        <div>
                                            <h2 style={S.h2}>1 · ¿Qué va a imprimir?</h2>
                                            <p style={{ ...S.lead, fontSize: 13 }}>Selecciona de los más solicitados o abre el catálogo general.</p>
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
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                                            {CATALOGO_RAPIDO.map((p) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => handleSelectQuickProduct(p)}
                                                    style={{
                                                        textAlign: 'left',
                                                        padding: 16,
                                                        borderRadius: 14,
                                                        border: `1px solid ${C.border}`,
                                                        background: C.surface,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = C.royal;
                                                        e.currentTarget.style.background = C.surfaceAlt;
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = C.border;
                                                        e.currentTarget.style.background = C.surface;
                                                    }}
                                                >
                                                    <div>
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
                                                                {p.cat}
                                                            </span>
                                                            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.royal }}>
                                                                ${p.precio.toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: C.ink, marginTop: 10 }}>
                                                            {p.nombre}
                                                        </div>
                                                        <p style={{ margin: '4px 0 0', fontSize: 12, color: C.muted }}>
                                                            {p.desc}
                                                        </p>
                                                    </div>
                                                    <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 700, color: C.royal }}>
                                                        Seleccionar →
                                                    </div>
                                                </button>
                                            ))}
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
                                                Continuar con {items.length} ítem(s) →
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* PASO 2: Detalles de la Orden */}
                            {step === 2 && (
                                <motion.div key="s2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                    <OrderDetails
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
                        <div style={{ ...S.card, padding: 20, position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
