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
import { CommercialFlow } from '../components/orders/CommercialFlow';
import SriSolicitudStep from '../components/orders/SriSolicitudStep';
import OrderSummary from '../components/orders/OrderSummary';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';
import { calcularPedido, round2 } from '../services/orderPricing';

const NuevoPedidoPage: React.FC = () => {
    const outletCtx = useOutletContext<{ currentUser?: User }>();
    const { user: authUser } = useAuth();
    const currentUser = outletCtx?.currentUser || authUser || ({ nombre: 'Pedro Cordova', rol: 'Administrador' } as unknown as User);
    const { refreshData, addTrabajo, addCliente, clientes } = useData();
    const navigate = useNavigate();
    const location = useLocation();

    const [step, setStep] = useState(1);
    const [missionCategory, setMissionCategory] = useState<'SRI' | 'COMERCIAL' | null>(null);
    const [, setOrderMode] = useState<'CATALOG' | 'EXPRESS' | null>(null);
    const [loading, setLoading] = useState(false);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [tempClient, setTempClient] = useState<any>({ nombre: '', telefono: '', cedula: '', regimen: 'General' });
    const [servicio, setServicio] = useState<any>(null);
    const [precio, setPrecio] = useState(0);
    const [abono, setAbono] = useState(0);
    const [prioridad, setPrioridad] = useState<'Normal' | 'Urgente'>('Normal');
    const [imageFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [createdTrabajoId, setCreatedTrabajoId] = useState<string | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [isAddingItem, setIsAddingItem] = useState(false);

    const [isSriOrder, setIsSriOrder] = useState(false);
    const [sriMode, setSriMode] = useState<'NUEVO' | 'RENOVACION'>('RENOVACION');
    const [sriClave, setSriClave] = useState('');
    const [sriActividad, setSriActividad] = useState('');
    const [sriEstablecimiento, setSriEstablecimiento] = useState('001');
    const [sriPuntoEmision, setSriPuntoEmision] = useState('001');
    const [imprimirClave, setImprimirClave] = useState(false);
    const [sriAutoFillBanner, setSriAutoFillBanner] = useState<any>(null);

    /* Importación de una solicitud del SRI (URL `?mode=sri` o el banner de la extensión).
       Vive en el ámbito del componente: el botón "Importar (1 clic)" también la invoca. */
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
        const renovacion = payload.renovacion === 'SÍ' || payload.esRenovacion === true;

        setMissionCategory('SRI');
        setIsSriOrder(true);
        setOrderMode('CATALOG');
        setSriActividad(activity);
        setSriMode(renovacion ? 'RENOVACION' : 'NUEVO');

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
            especificaciones: {
                tamano: docSize,
                paginas: blocks,
                sri: { vencimiento: payload.caducidad || '' }
            }
        };

        setItems([sriItem]);
        setPrecio(totalVal);
        setAbono(abonoVal);
        setStep(4);
    };

    useEffect(() => {
        document.body.style.overflow = 'auto';

        // 1. Parse URL Parameters
        const params = new URLSearchParams(location.search);
        if (params.get('mode') === 'sri') applySriPayload(Object.fromEntries(params.entries()));

        // 2. PostMessage listener seguro
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search, clientes]);

    /**
     * Aritmética de la orden en un solo lugar (`services/orderPricing.ts`):
     * recargo por urgencia, IVA condicional — los preimpresos SRI no gravan — y saldo.
     * Los precios de línea ya vienen calculados por la calculadora existente.
     */
    const desglose = useMemo(
        () => calcularPedido(
            items.map(it => ({ precioLinea: it.precioFinal || 0, grava: !isSriOrder })),
            { urgente: prioridad === 'Urgente', abono },
        ),
        [items, isSriOrder, prioridad, abono],
    );

    /* Un abono nunca puede superar el total vigente: al quitar un ítem o desactivar
       la urgencia el total baja, y el abono debe bajar con él. */
    useEffect(() => {
        if (abono > desglose.total) setAbono(desglose.total);
    }, [desglose.total, abono]);

    const canAdvance = () => {
        if (step === 1) return !!missionCategory;
        if (missionCategory === 'SRI') {
            if (step === 2) return !!cliente;
            if (step === 3) return !!sriActividad;
            if (step === 4) return items.length > 0;
            if (step === 5) return true;
        } else if (missionCategory === 'COMERCIAL') {
            if (step === 2) return items.length > 0;
            if (step === 3) return !!cliente;
            if (step === 4) return desglose.total > 0;
        }
        return false;
    };

    const handleCreateOrder = async () => {
        const finalItems = [...items];
        if (finalItems.length === 0) { setError('Debe agregar al menos un ítem al pedido.'); return; }

        /* Cada ítem se guarda con su total real (recargo por urgencia + IVA si grava) y el
           abono se reparte en orden hasta agotarse, para que ningún saldo quede negativo. */
        const desgloseItems = finalItems.map(item => calcularPedido(
            [{ precioLinea: item.precioFinal || 0, grava: !isSriOrder }],
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
                        || await addCliente({ nombre: (tempClient.nombre || 'CONSUMIDOR FINAL').toUpperCase(), cedula: cleanCed || '9999999999', telefono: tempClient.telefono ? [tempClient.telefono] : [], regimen: tempClient.regimen || 'General', direccion: 'Local' });
                } else {
                    finalCliente = clientes.find(c => c.cedula === '9999999999')
                        || await addCliente({ nombre: 'CONSUMIDOR FINAL', cedula: '9999999999', regimen: 'General', direccion: 'Local' });
                }
            }
            if (!finalCliente) throw new Error('No se pudo establecer un cliente para el pedido.');

            const results = await Promise.all(finalItems.map(async (item, index) => addTrabajo({
                titular: finalCliente!.nombre,
                clienteId: finalCliente!.id ? finalCliente!.id : undefined,
                servicio: item.nombre || 'Servicio General',
                detalle: isSriOrder ? `${item.cantidad || 1}x ${item.nombre || 'DOCUMENTO SRI'} (${item.especificaciones?.tamano || 'ESTÁNDAR'})` : `${item.descripcion || ''}`,
                cantidad: item.cantidad || 1,
                precio: desgloseItems[index].total,
                abono: abonos[index],
                saldo: round2(desgloseItems[index].total - abonos[index]),
                prioridad,
                estado: TrabajoEstado.PENDIENTE,
                fechaEntrada: new Date().toISOString(),
                responsable: userName,
                origen: 'Local',
                esSRI: isSriOrder,
                establecimiento: isSriOrder ? sriEstablecimiento : undefined,
                puntoEmision: isSriOrder ? sriPuntoEmision : undefined,
                tamano: item.especificaciones?.tamano || undefined,
                estadoClave: isSriOrder ? (sriClave ? 'LISTA' : 'PENDIENTE') : 'LISTA',
                claveAcceso: isSriOrder ? sriClave : undefined,
                esRenovacion: isSriOrder ? (sriMode === 'RENOVACION') : undefined,
                actividadSeleccionada: isSriOrder ? sriActividad : null,
                imprimirClave: isSriOrder ? imprimirClave : false,
                numeracion: item.especificaciones?.numerado,
                autorizacion_sri: item.especificaciones?.sri?.autorizacion,
                fechaVencimiento: item.especificaciones?.sri?.vencimiento,
            } as any, userName, imageFile)));

            logActivity(userName, userRol, 'CREAR_ORDEN', `Pedido (${finalItems.length} ítems) para ${finalCliente.nombre}`, 'Ventas').catch(() => {});
            refreshData().catch(() => {});
            setCreatedTrabajoId(results[0].id);
            setStep(6);
            setTimeout(() => window.open(isSriOrder ? `/#/solicitud-impresion/${results[0].id}?format=a5` : `/#/recibo-epson/${results[0].id}`, '_blank'), 800);
        } catch (err: any) {
            console.error('[NuevoPedido] Error al crear orden:', err);
            setError(err.message || 'Error al procesar la orden.');
        } finally {
            setLoading(false);
        }
    };

    const steps = missionCategory === 'SRI'
        ? ['Categoría', 'Cliente', 'Datos SRI', 'Servicios', 'Pago', 'Confirmado']
        : ['Categoría', 'Catálogo', 'Cliente', 'Pago', 'Confirmado'];

    const handleSelectCategory = (category: 'SRI' | 'COMERCIAL') => {
        setMissionCategory(category);
        setIsSriOrder(category === 'SRI');
        setOrderMode('CATALOG');
        setStep(2);
    };

    const showSidebar = missionCategory && step < 5;

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Nueva Orden · Imprenta Córdova" />
            <div style={{ ...S.wrap }}>

                <div>
                    <p style={S.eyebrow}>Operaciones</p>
                    <h1 style={S.h1}>Nueva Orden</h1>
                    <p style={S.lead}>Producto primero, cliente al final. La meta son 30 segundos por orden.</p>
                </div>

                {sriAutoFillBanner && (
                    <div style={{ ...S.accentCard, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ ...S.colHead, color: '#93A0C8' }}>Solicitud SRI detectada</div>
                            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                                RUC {sriAutoFillBanner.ruc || sriAutoFillBanner.clientRuc} · {sriAutoFillBanner.name || sriAutoFillBanner.clientName} ({sriAutoFillBanner.blocks || 100} comprobantes)
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ ...S.primaryBtn, background: '#1B6E3E' }} onClick={() => { applySriPayload(sriAutoFillBanner); setSriAutoFillBanner(null); }}>Importar (1 clic)</button>
                            <button style={S.softBtn} onClick={() => setSriAutoFillBanner(null)}>Descartar</button>
                        </div>
                    </div>
                )}

                {/* Stepper */}
                <div style={{ ...S.card, padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {steps.map((label, i) => {
                        const id = i + 1;
                        const active = step === id;
                        const past = step > id;
                        return (
                            <button key={label} type="button" disabled={!past} onClick={() => past && setStep(id)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 12px', borderRadius: 10, border: 'none',
                                    fontSize: 11.5, fontWeight: 700, cursor: past ? 'pointer' : 'default', fontFamily: 'inherit',
                                    ...(active ? { background: C.royal, color: '#fff' } : past ? { background: C.chipBlue, color: C.royal } : { background: 'transparent', color: C.faint }),
                                }}>
                                <span style={{ fontFamily: MONO }}>{id}</span> {label}
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: showSidebar ? 'minmax(0,1fr) minmax(0,320px)' : '1fr', gap: 16, alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                        <AnimatePresence mode="wait">

                            {step === 1 && (
                                <motion.div key="s1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} style={{ ...S.card, padding: '28px 24px' }}>
                                    <h2 style={{ ...S.h2, fontSize: 18, textAlign: 'center' }}>Selecciona el tipo de orden</h2>
                                    <p style={{ ...S.lead, textAlign: 'center' }}>Elige el flujo de trabajo para configurar el pedido.</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginTop: 20 }}>
                                        <button onClick={() => handleSelectCategory('SRI')} style={{ textAlign: 'left', padding: 20, borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${C.border}`, background: '#fff' }}>
                                            <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, color: C.ink }}>Facturación SRI</div>
                                            <p style={{ margin: '6px 0 0', fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>Documentos fiscales autorizados: facturas, notas de venta, retenciones, guías.</p>
                                            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.royal }}>Iniciar flujo SRI →</div>
                                        </button>
                                        <button onClick={() => handleSelectCategory('COMERCIAL')} style={{ textAlign: 'left', padding: 20, borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${C.border}`, background: '#fff' }}>
                                            <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, color: C.ink }}>Trabajos comerciales</div>
                                            <p style={{ margin: '6px 0 0', fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>Publicidad, gigantografía, sellos, tarjetas, merchandising y diseño.</p>
                                            <div style={{ marginTop: 12, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6D28D9' }}>Iniciar flujo comercial →</div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && missionCategory === 'SRI' && (
                                <motion.div key="s2sri" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} style={{ ...S.card, padding: 20 }}>
                                    <h2 style={{ ...S.h2, fontSize: 16, marginBottom: 14 }}>Seleccionar o registrar cliente SRI</h2>
                                    <ClientSelector onSelect={c => { setCliente(c); if (c) { setSriEstablecimiento(c.establecimientoPredeterminado || '001'); setSriPuntoEmision(c.puntoEmisionPredeterminado || '001'); setSriActividad(c.actividades || ''); setStep(3); } }} onCancel={() => setStep(1)} hideQuickButtons />
                                </motion.div>
                            )}

                            {step === 2 && missionCategory === 'COMERCIAL' && (
                                <motion.div key="s2com" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <CommercialFlow onComplete={async data => {
                                        setLoading(true);
                                        const fc = clientes.find(c => c.id === data.clienteId) || (await addCliente({ nombre: data.clienteNombre.toUpperCase(), cedula: '9999999999', regimen: 'General', direccion: 'Local' }));
                                        setCliente(fc);
                                        setItems([{ nombre: data.trabajo.tipo, cantidad: data.trabajo.cantidad, precioFinal: data.trabajo.total, especificaciones: { tamano: data.trabajo.tamano } }]);
                                        setPrecio(data.trabajo.total);
                                        setAbono(data.trabajo.abono || 0);
                                        setStep(5);
                                        setLoading(false);
                                    }} onCancel={() => setStep(1)} />
                                </motion.div>
                            )}

                            {step === 3 && missionCategory === 'SRI' && cliente && (
                                <motion.div key="s3sri" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} style={{ ...S.card, padding: 20 }}>
                                    <SriSolicitudStep cliente={cliente} initialData={{ actividad: sriActividad, modo: sriMode, clave: sriClave, establecimiento: sriEstablecimiento, puntoEmision: sriPuntoEmision }}
                                        onBack={() => setStep(2)} onComplete={d => { setSriActividad(d.actividad); setSriMode(d.modo); setSriClave(d.clave); setSriEstablecimiento(d.establecimiento); setSriPuntoEmision(d.puntoEmision); setStep(4); }} />
                                </motion.div>
                            )}

                            {step === 4 && missionCategory === 'SRI' && (
                                <motion.div key="s4sri" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} style={{ ...S.card, padding: 20 }}>
                                    {(isAddingItem || items.length === 0) ? (
                                        !servicio
                                            ? <ServiceSelector onSelect={setServicio} regimen={cliente?.regimen} forcedCategory="SRI" />
                                            : <ProductConfigurator product={servicio} regimen={cliente?.regimen} onCancel={() => setServicio(null)} onComplete={c => { setItems(p => [...p, c]); setPrecio(p => p + c.precioFinal); setServicio(null); setIsAddingItem(false); }} />
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {items.map((item, idx) => (
                                                <div key={idx} style={{ ...S.card, background: C.bg, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                                    <div>
                                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{item.nombre}</div>
                                                        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{item.cantidad} u. · {item.especificaciones?.tamano || 'Estándar'}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <span style={{ fontFamily: MONO, fontWeight: 600, color: C.ink }}>{formatCurrency(item.precioFinal)}</span>
                                                        <button style={{ ...S.softBtn, padding: '4px 8px', fontSize: 11, background: '#FEF2F2', color: '#B91C1C' }}
                                                            onClick={() => { setItems(p => p.filter((_, i) => i !== idx)); setPrecio(p => p - item.precioFinal); }}>Quitar</button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button style={{ ...S.outlineBtn, justifyContent: 'center', borderStyle: 'dashed' }} onClick={() => setIsAddingItem(true)}>Agregar otro ítem</button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 5 && (
                                <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {error && (
                                        <div style={{ padding: 14, background: '#FEF2F2', border: '1px solid #FBD5D5', borderRadius: 12, color: '#B91C1C', fontSize: 12.5, fontWeight: 600 }}>{error}</div>
                                    )}
                                    <OrderSummary isOpen items={items} total={desglose.total} desglose={desglose} abono={abono} setAbono={setAbono} client={cliente}
                                        prioridad={prioridad} setPrioridad={setPrioridad}
                                        tempClient={tempClient} setTempClient={setTempClient} onDeploy={handleCreateOrder} isLoading={loading}
                                        sriData={{ claveAcceso: sriClave, estadoClave: sriClave ? 'LISTA' : 'PENDIENTE' }} setSriData={d => setSriClave(d.claveAcceso)}
                                        imprimirClave={imprimirClave} setImprimirClave={setImprimirClave} onClose={() => setStep(step - 1)} />
                                </motion.div>
                            )}

                            {step === 6 && (
                                <motion.div key="s6" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} style={{ ...S.card, padding: '40px 24px', textAlign: 'center' }}>
                                    <div style={{ ...S.colHead, color: C.success }}>Orden creada correctamente</div>
                                    <h2 style={{ ...S.h1, fontSize: 24, marginTop: 6 }}>Orden #{createdTrabajoId?.substring(0, 8)}</h2>
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
                                        <button style={S.softBtn} onClick={() => navigate('/dashboard')}>Ir al panel</button>
                                        <button style={S.primaryBtn} onClick={() => window.location.reload()}>Nueva orden</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {step < 5 && step > 1 && (
                            <div style={{ ...S.card, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button style={S.softBtn} onClick={() => setStep(p => p - 1)}>← Atrás</button>
                                {canAdvance() && <button style={S.primaryBtn} onClick={() => setStep(p => p + 1)}>Siguiente →</button>}
                            </div>
                        )}
                    </div>

                    {showSidebar && (
                        <div style={{ ...S.card, padding: 18, position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <h3 style={{ ...S.h2, fontSize: 15 }}>Resumen de la orden</h3>
                            <div style={{ fontSize: 12.5, color: C.muted }}>
                                {missionCategory === 'SRI' ? 'Facturación fiscal SRI' : missionCategory === 'COMERCIAL' ? 'Trabajo comercial' : 'Sin selección'}
                            </div>
                            <div style={{ ...S.card, background: C.bg, padding: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span style={S.colHead}>Total</span>
                                    <span style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, color: C.royal }}>{formatCurrency(precio)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.rowLine}` }}>
                                    <span style={{ color: C.muted }}>Abono</span><span style={{ color: C.success, fontFamily: MONO }}>{formatCurrency(abono)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                                    <span style={{ color: C.muted }}>Saldo</span><span style={{ color: C.ink, fontFamily: MONO }}>{formatCurrency(precio - abono)}</span>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div style={{ ...S.card, background: C.bg, padding: 12 }}>
                                    <div style={S.colHead}>Ítems</div>
                                    <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink, marginTop: 4 }}>{items.length}</div>
                                </div>
                                <div style={{ ...S.card, background: C.bg, padding: 12 }}>
                                    <div style={S.colHead}>Prioridad</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: prioridad === 'Urgente' ? C.danger : C.ink, marginTop: 4 }}>{prioridad}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NuevoPedidoPage;
