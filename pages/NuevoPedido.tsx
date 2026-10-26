import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { establecimientosAbiertos } from '../services/establecimientos';
import { MODELOS, modeloPorDefecto, modelosDe, TRAMITES_SRI, TRAMITE_POR_DEFECTO, type ModeloImpresion, type TramiteSri } from '../services/printModels';
import { sugerirSiguienteNumeracion } from '../services/tallerBoard';

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

/** Pasos reales del asistente. El paso 5 es la pantalla de confirmación, no un paso más. */
const TOTAL_PASOS = STEP_CONFIG.length;

/**
 * Transición del contenido según la dirección del viaje: al avanzar el paso entra desde
 * la derecha, al retroceder entra desde la izquierda. Con una animación simétrica el
 * operador no percibe si fue adelante o atrás, y en un flujo de mostrador esa pérdida de
 * orientación se siente como desorden.
 */
const animPaso = (dir: 'adelante' | 'atras') => ({
    initial: { opacity: 0, x: dir === 'adelante' ? 26 : -26 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: dir === 'adelante' ? -26 : 26 },
    transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
});

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
    const { refreshData, addTrabajo, addCliente, clientes, trabajos } = useData();
    const navigate = useNavigate();
    const location = useLocation();

    const [step, setStep] = useState(1);
    /** Dirección del último movimiento, para que la transición del paso tenga sentido. */
    const [direccion, setDireccion] = useState<'adelante' | 'atras'>('adelante');
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
    /**
     * Marcado del trámite para la solicitud del SRI. Arranca en MISMO, que es lo que el
     * documento imprimía siempre por el hardcodeo: ninguna orden cambia de comportamiento.
     */
    const [tramiteSri, setTramiteSri] = useState<TramiteSri>(TRAMITE_POR_DEFECTO);
    /**
     * Variante con la que se produce el talonario. Arranca en el default de la familia SRI,
     * que es `sri-sobre-preimpreso` porque hay stock de formularios ya impresos.
     */
    const [modeloImpresionSri, setModeloImpresionSri] = useState<ModeloImpresion>(() => modeloPorDefecto(true));
    const [imprimirClave, setImprimirClave] = useState(false);
    const [isAddingCustomItem, setIsAddingCustomItem] = useState(false);
    const [sriAutoFillBanner, setSriAutoFillBanner] = useState<any>(null);
    const [filtroCat, setFiltroCat] = useState<string>('Todos');

    // ¿La orden contiene al menos un producto con requerimientos SRI?
    const hasSriItem = useMemo(() => items.some(i => i.esSRI || i.especificaciones?.sri), [items]);

    // Detección de última orden del cliente para Renovación Express
    const ultimoTrabajoCliente = useMemo(() => {
        if (!cliente?.id) return null;
        return (trabajos ?? [])
            .filter(t => t.clienteId === cliente.id)
            .sort((a, b) => new Date(b.fechaEntrada || 0).getTime() - new Date(a.fechaEntrada || 0).getTime())[0] || null;
    }, [cliente, trabajos]);

    const renovacionSugerida = useMemo(() => {
        if (!ultimoTrabajoCliente) return null;
        const num = sugerirSiguienteNumeracion(ultimoTrabajoCliente.numeracion, ultimoTrabajoCliente.cantidad || 100);
        return {
            trabajo: ultimoTrabajoCliente,
            nuevaNumeracion: num.textoSugerido,
        };
    }, [ultimoTrabajoCliente]);

    const aplicarRenovacionExpress = () => {
        if (!renovacionSugerida) return;
        const t = renovacionSugerida.trabajo;
        const reorderItem = {
            id: `item-${Date.now()}`,
            nombre: t.subtipo || t.tipo,
            precioBase: t.total || 13,
            esSRI: !!t.esSRI,
            cantidad: t.cantidad || 100,
            subtotal: t.total || 13,
            especificaciones: {
                tamano: t.tamano || '1/4 Oficio',
                acabados: t.detalle || '',
                sri: !!t.esSRI,
                establecimiento: t.establecimiento || '001',
                puntoEmision: t.puntoEmision || '001',
                numeracion: renovacionSugerida.nuevaNumeracion,
            }
        };

        setItems([reorderItem]);
        setServicio({ nombre: t.subtipo || t.tipo, precio: t.total || 13, esSRI: !!t.esSRI });
        setNumeracionInicial(renovacionSugerida.nuevaNumeracion);
        if (t.establecimiento) setSriEstablecimiento(t.establecimiento);
        if (t.puntoEmision) setSriPuntoEmision(t.puntoEmision);
        if (t.actividadSeleccionada) setSriActividad(t.actividadSeleccionada);
        if (t.autorizacion_sri) setAutorizacionSriInput(t.autorizacion_sri);
        if (t.tramiteSri) setTramiteSri(t.tramiteSri as any);
        if (t.modeloImpresion) setModeloImpresionSri(t.modeloImpresion as any);
        setAbono(t.total ? Math.round(t.total * 0.5) : 0);
        setDireccion('adelante');
        setStep(4);
    };

    const applySriPayload = (payload: any) => {
        if (!payload) return;
        const ruc = payload.ruc || payload.clientRuc || '';
        const name = payload.name || payload.clientName || '';
        const phone = payload.phone || payload.clientPhone || '';
        const activity = payload.activity || 'Comercio / Servicios General';
        const docType = payload.docType || '1';
        const blocks = parseInt(payload.blocks || payload.comprobantes || payload.qty || '100', 10) || 100;
        const docSize = payload.docSize || payload.tamano || '1/4 Oficio';
        const totalVal = parseFloat(payload.total) || 13;
        const abonoVal = parseFloat(payload.abono) || 0;
        const estVal = payload.est || '001';
        const ptoVal = payload.pto || '001';
        const caducidadVal = payload.caducidad || '';
        const modeVal = payload.mode || 'sri-sobre-preimpreso';
        const tramiteVal = payload.tramite || 'MISMO';

        setSriActividad(activity);
        setSriEstablecimiento(estVal);
        setSriPuntoEmision(ptoVal);
        if (caducidadVal) setAutorizacionSriInput(caducidadVal);
        if (modeVal && (modeVal.startsWith('sri') || modeVal.startsWith('comercial') || modeVal.startsWith('nota'))) {
            setModeloImpresionSri(modeVal as any);
        }
        if (tramiteVal) setTramiteSri(tramiteVal as any);

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
        const docName = docNames[docType] || payload.doc || 'Nota de Venta';

        const sriItem = {
            id: `item-sri-${Date.now()}`,
            nombre: docName,
            cantidad: 1,
            precioUnitario: totalVal,
            precioFinal: totalVal,
            subtotal: totalVal,
            esSRI: true,
            especificaciones: {
                tamano: docSize,
                paginas: blocks,
                papel: 'Químico Autocopia (2c)',
                sri: { 
                    vencimiento: caducidadVal,
                    establecimiento: estVal,
                    puntoEmision: ptoVal,
                }
            }
        };

        setItems([sriItem]);
        setServicio({ nombre: docName, precio: totalVal, esSRI: true });
        setAbono(abonoVal);
        setSriAutoFillBanner({
            title: `📥 Datos precargados desde el SRI: ${name || ruc}`,
            desc: `${docName} (${blocks} comp.) · Est: ${estVal}-${ptoVal} · Total: $${totalVal.toFixed(2)} · Revise y confirme para registrar.`
        });
        setDireccion('adelante');
        setStep(4);
    };

    useEffect(() => {
        document.body.style.overflow = 'auto';

        const params = new URLSearchParams(location.search);
        const hasSriData = params.get('mode') === 'sri' || params.get('mode')?.startsWith('sri') || params.get('ruc') || params.get('name');
        if (hasSriData) {
            applySriPayload(Object.fromEntries(params.entries()));
        }

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

    /*
     * Establecimientos ABIERTOS que el cliente tiene registrados en su RUC. Los carga
     * ClientSelector al leer el certificado (foto o PDF) y quedan en su ficha.
     *
     * Se ofrecen como atajo en el paso 3, pero NO reemplazan al input de texto: hay clientes
     * que piden un local que todavía no está en el certificado, y algunos certificados
     * (hoy los que se leen mecánicamente del PDF) no traen la lista.
     */
    const establecimientosCliente = useMemo(
        () => establecimientosAbiertos(cliente?.fiscal_data?.establecimientos),
        [cliente],
    );

    const canAdvance = () => {
        if (step === 1) return items.length > 0;
        if (step === 2) return true;
        if (step === 3) {
            if (!cliente && !(tempClient?.nombre || tempClient?.cedula)) return false;
            /*
             * Con comprobantes SRI el establecimiento, el punto de emisión y la actividad
             * van IMPRESOS en la solicitud de autorización, así que no se puede avanzar sin
             * ellos. CONTINUITY_RULES.md §6: "se deben registrar estrictamente los
             * establecimientos abiertos, puntos de emisión, actividades y los números de
             * secuencia". En un trabajo comercial no aplica.
             */
            if (hasSriItem) {
                return !!(sriEstablecimiento.trim() && sriPuntoEmision.trim() && sriActividad.trim());
            }
            return true;
        }
        if (step === 4) return desglose.total > 0;
        return false;
    };

    /*
     * Dirección del viaje + scroll al inicio en cada cambio de paso.
     * Se deriva del propio `step`, así no hay que tocar ninguno de los setStep() del
     * archivo y ninguna ruta nueva puede olvidarse de avisar la dirección.
     */
    const pasoPrevio = useRef(step);
    useEffect(() => {
        if (step === pasoPrevio.current) return;
        setDireccion(step > pasoPrevio.current ? 'adelante' : 'atras');
        pasoPrevio.current = step;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    /*
     * Atajos de teclado del mostrador (agent_instructions.md: "en operaciones de
     * mostrador, el ratón es lento").
     *   Alt + →   avanza si el paso actual está completo
     *   Alt + ←   retrocede
     *   Alt + 1..4 salta a un paso ya habilitado (nunca hacia adelante: la regla del
     *              camino es que no se saltean pasos)
     * Nada se intercepta sin Alt, para no pelear con los campos de texto (RUC, precios).
     */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!e.altKey || e.ctrlKey || e.metaKey) return;

            if (e.key === 'ArrowRight') {
                if (step < TOTAL_PASOS && canAdvance()) { e.preventDefault(); setStep(s => s + 1); }
                return;
            }
            if (e.key === 'ArrowLeft') {
                if (step > 1) { e.preventDefault(); setStep(s => s - 1); }
                return;
            }

            const destino = Number(e.key);
            if (Number.isInteger(destino) && destino >= 1 && destino <= TOTAL_PASOS && destino < step) {
                e.preventDefault();
                setStep(destino);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // Las dependencias cubren todo lo que lee canAdvance().
    }, [step, cliente, tempClient, items.length, desglose.total, hasSriItem, sriEstablecimiento, sriPuntoEmision, sriActividad]);

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
                // 'Interno' = pedido tomado en el mostrador. Antes decía 'Local', que
                // no existe en el tipo `'Web' | 'Interno'` y ensuciaba la columna.
                origen: 'Interno',
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
                // El modelo se persiste con la orden (no viaja en la URL) para que la
                // extensión de Chrome y el documento de impresión hablen de la misma variante.
                // OJO: el default de SRI es hoy `sri-pc` porque es la única implementada; cuando
                // `sri-sobre-preimpreso` esté lista, el default debe pasar a ESA, porque lo que
                // corresponde mientras haya stock de preimpresos es imprimir solo los datos.
                // El modelo elegido para SRI; para un comercial, el default de su familia.
                modeloImpresion: item.esSRI ? modeloImpresionSri : modeloPorDefecto(false),
                // Marcado del trámite que va impreso en la solicitud del SRI.
                tramiteSri: item.esSRI ? tramiteSri : undefined,
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

                {/* Camino de la orden — recorrido visible con nodos y conectores */}
                <div style={{ ...S.card, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.28em', textTransform: 'uppercase', color: C.faint }}>Camino de la orden</div>
                            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>
                                {step > TOTAL_PASOS
                                    ? 'Orden registrada correctamente'
                                    : <>Paso <strong style={{ color: C.ink }}>{step}</strong> de {TOTAL_PASOS} · {STEP_CONFIG[step - 1]?.subtitle}</>}
                            </div>
                            {/*
                              * Las dos ramas del camino producen documentos DISTINTOS: una orden con
                              * comprobantes SRI termina en una solicitud de autorización A5, y una
                              * comercial en un recibo. Que se vea desde el arranque evita que el
                              * operador descubra al final que no era el comprobante que esperaba.
                              */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '4px 10px',
                                borderRadius: 99, fontSize: 11, fontWeight: 700,
                                ...(hasSriItem
                                    ? { background: C.goldBg, color: C.goldText, border: `1px solid ${C.goldBorder}` }
                                    : { background: C.chipBlue, color: C.royal, border: `1px solid ${C.borderStrong}` }),
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: 99, flexShrink: 0, background: hasSriItem ? C.gold : C.royal }} />
                                {hasSriItem ? 'Comprobantes SRI → Solicitud de Impresión (A5)' : 'Trabajo comercial → Recibo de caja'}
                            </div>
                        </div>
                        <span style={{ fontSize: 11, color: C.faint }}>
                            <strong style={{ fontFamily: MONO, color: C.muted }}>Alt + ← →</strong> para moverte sin ratón
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
                        {STEP_CONFIG.map((cfg, i) => {
                            const activo = step === cfg.id;
                            const hecho = step > cfg.id;
                            const esUltimo = i === STEP_CONFIG.length - 1;
                            return (
                                <React.Fragment key={cfg.id}>
                                    <button
                                        type="button"
                                        disabled={!hecho}
                                        onClick={() => hecho && setStep(cfg.id)}
                                        title={hecho || activo ? cfg.subtitle : `Completá el paso ${step} para llegar acá`}
                                        style={{
                                            flex: '0 0 auto', width: 128, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                                            background: 'transparent', border: 'none', padding: 0, fontFamily: 'inherit',
                                            cursor: hecho ? 'pointer' : 'default',
                                        }}
                                    >
                                        <span style={{
                                            width: 34, height: 34, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 13, fontWeight: 800, fontFamily: MONO,
                                            transition: 'all .3s cubic-bezier(.2,.8,.2,1)',
                                            ...(activo
                                                ? { background: C.royal, color: '#fff', boxShadow: '0 0 0 5px rgba(22,48,155,.12)' }
                                                : hecho
                                                    ? { background: C.chipBlue, color: C.royal, border: `1px solid ${C.borderStrong}` }
                                                    : { background: C.surfaceAlt, color: C.ghost, border: `1px solid ${C.border}` }),
                                        }}>{hecho ? '✓' : cfg.icon}</span>
                                        <span style={{ textAlign: 'center', minWidth: 0 }}>
                                            {/* El label ya trae el número ("1 · Producto Base"); el nodo lo muestra. */}
                                            <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: activo ? C.ink : hecho ? C.body : C.faint, whiteSpace: 'nowrap' }}>
                                                {cfg.label.replace(/^\d+\s*·\s*/, '')}
                                            </span>
                                            <span style={{ display: 'block', fontSize: 10, color: C.ghost, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cfg.subtitle}</span>
                                        </span>
                                    </button>

                                    {!esUltimo && (
                                        <div style={{ flex: '1 1 22px', minWidth: 22, height: 34, display: 'flex', alignItems: 'center', padding: '0 6px' }}>
                                            <div style={{ position: 'relative', height: 2, width: '100%', background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                                                <div style={{
                                                    position: 'absolute', inset: 0, transformOrigin: 'left',
                                                    transform: `scaleX(${hecho ? 1 : 0})`,
                                                    background: `linear-gradient(90deg, ${C.royal}, ${C.gold})`,
                                                    transition: 'transform .45s cubic-bezier(.2,.8,.2,1)',
                                                }} />
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Progreso global. Antes era (step / 4) con 5 pasos reales: llegaba a 125 %. */}
                    <div style={{ height: 4, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                        <div
                            style={{
                                height: '100%',
                                width: `${Math.min(100, (step / TOTAL_PASOS) * 100)}%`,
                                background: `linear-gradient(90deg, ${C.royal} 0%, ${C.gold} 100%)`,
                                transition: 'width .45s cubic-bezier(.2,.8,.2,1)',
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
                                <motion.div key="s1" {...animPaso(direccion)} style={{ ...S.card, padding: 22 }}>
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
                                            
                                            {/* Barra de Renovación Express de Mostrador */}
                                            <div style={{ padding: '12px 16px', borderRadius: 12, background: C.surfaceAlt, border: `1px solid ${C.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                    <span style={{ fontSize: 18 }}>⚡</span>
                                                    <div>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>Renovación Express de Mostrador</span>
                                                        <span style={{ display: 'block', fontSize: 11, color: C.faint }}>¿El cliente ya ha impreso antes? Selecciónalo para auto-configurar en 1 clic.</span>
                                                    </div>
                                                </div>
                                                <select
                                                    value={cliente?.id || ''}
                                                    onChange={(e) => {
                                                        const found = clientes.find(c => c.id === e.target.value);
                                                        setCliente(found || null);
                                                        if (found) {
                                                            setSriEstablecimiento(found.establecimientoPredeterminado || '001');
                                                            setSriPuntoEmision(found.puntoEmisionPredeterminado || '001');
                                                            setSriActividad(found.actividades || '');
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.borderStrong}`,
                                                        background: '#fff', fontSize: 12, color: C.ink, fontFamily: 'inherit', maxWidth: 260
                                                    }}
                                                >
                                                    <option value="">-- Seleccionar cliente habitual --</option>
                                                    {clientes.map(c => (
                                                        <option key={c.id} value={c.id}>{c.nombre} ({c.ruc || c.cedula})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Banner de Renovación Rápida si hay pedido previo */}
                                            {renovacionSugerida && (
                                                <div style={{
                                                    padding: '16px 20px', borderRadius: 14, background: '#0A1140', color: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
                                                    border: '1px solid rgba(255,198,26,0.3)', boxShadow: '0 8px 24px -6px rgba(10,17,64,0.4)',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                        <span style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,198,26,0.2)', color: '#FFC61A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                                            ⚡
                                                        </span>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#FFC61A' }}>
                                                                    RENOVACIÓN DETECTADA
                                                                </span>
                                                                <span style={{ fontSize: 11, color: '#CAD5F5' }}>· Última orden #{renovacionSugerida.trabajo.orden}</span>
                                                            </div>
                                                            <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 3 }}>
                                                                {cliente?.nombre} · {renovacionSugerida.trabajo.tipo} {renovacionSugerida.trabajo.subtipo || ''}
                                                            </div>
                                                            <div style={{ fontSize: 12, color: '#CAD5F5', marginTop: 3 }}>
                                                                Tiraje: <strong>{renovacionSugerida.trabajo.cantidad} u.</strong> · Secuencia sugerida: <strong style={{ color: '#FFC61A' }}>{renovacionSugerida.nuevaNumeracion}</strong> · Total: <strong>{formatCurrency(renovacionSugerida.trabajo.total)}</strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={aplicarRenovacionExpress}
                                                        style={{
                                                            padding: '11px 20px', borderRadius: 11, background: '#FFC61A', color: '#0A1140',
                                                            border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                                            display: 'inline-flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(255,198,26,0.4)',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                    >
                                                        ⚡ Reordenar con 1 Clic (Ir a Pago)
                                                    </button>
                                                </div>
                                            )}
                                            
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
                                <motion.div key="s2" {...animPaso(direccion)}>
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
                                <motion.div key="s3" {...animPaso(direccion)} style={{ ...S.card, padding: 20 }}>
                                    <h2 style={{ ...S.h2, marginBottom: 14 }}>3 · Cliente</h2>
                                    <ClientSelector
                                        onSelect={(c) => {
                                            setCliente(c);
                                            if (c) {
                                                setSriEstablecimiento(c.establecimientoPredeterminado || '001');
                                                setSriPuntoEmision(c.puntoEmisionPredeterminado || '001');
                                                setSriActividad(c.actividades || '');
                                                /*
                                                 * Con comprobantes SRI el camino se detiene acá a propósito:
                                                 * los datos del talonario se autocompletan desde la ficha del
                                                 * cliente, pero el operador tiene que poder corregirlos para ESTA
                                                 * orden antes de que salgan impresos en la solicitud.
                                                 * En un trabajo comercial se avanza directo, como siempre.
                                                 */
                                                if (!hasSriItem) setStep(4);
                                            }
                                        }}
                                        onCancel={() => setStep(2)}
                                    />

                                    {renovacionSugerida && (
                                        <div style={{
                                            marginTop: 14, padding: '14px 18px', borderRadius: 12, background: '#0A1140', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
                                            border: '1px solid rgba(255,198,26,0.3)',
                                        }}>
                                            <div>
                                                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#FFC61A' }}>
                                                    ⚡ Renovación Express disponible
                                                </div>
                                                <div style={{ fontSize: 13, color: '#CAD5F5', marginTop: 2 }}>
                                                    Último pedido: #{renovacionSugerida.trabajo.orden} ({renovacionSugerida.trabajo.tipo}) · Siguiente secuencia: <strong style={{ color: '#FFC61A' }}>{renovacionSugerida.nuevaNumeracion}</strong>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={aplicarRenovacionExpress}
                                                style={{
                                                    padding: '9px 16px', borderRadius: 10, background: '#FFC61A', color: '#0A1140',
                                                    border: 'none', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                                }}
                                            >
                                                ⚡ Reordenar con 1 Clic
                                            </button>
                                        </div>
                                    )}

                                    {hasSriItem && cliente && (
                                        <div style={{ marginTop: 18, padding: '16px 18px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 14 }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                                <div>
                                                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.26em', textTransform: 'uppercase', color: C.goldText }}>Datos del talonario SRI</div>
                                                    <p style={{ margin: '5px 0 0', fontSize: 12.5, color: C.goldText, lineHeight: 1.5 }}>
                                                        Van impresos en la <strong>solicitud de autorización</strong>. Se cargaron desde la ficha de {cliente.nombre}; corregilos si esta orden va distinta.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSriEstablecimiento(cliente.establecimientoPredeterminado || '001');
                                                        setSriPuntoEmision(cliente.puntoEmisionPredeterminado || '001');
                                                        setSriActividad(cliente.actividades || '');
                                                    }}
                                                    style={{ ...S.softBtn, background: '#FFFFFF', flexShrink: 0 }}
                                                >
                                                    ↺ Restaurar del cliente
                                                </button>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 14 }}>
                                                <div>
                                                    <label style={{ display: 'block' }}>
                                                        <span style={S.fieldLabel}>Establecimiento</span>
                                                        <input
                                                            value={sriEstablecimiento}
                                                            onChange={e => setSriEstablecimiento(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                            placeholder="001"
                                                            maxLength={3}
                                                            style={{ ...S.input, padding: '9px 11px', fontFamily: MONO, letterSpacing: '.08em' }}
                                                        />
                                                    </label>

                                                    {/*
                                                      * Atajo: los establecimientos ABIERTOS del RUC del cliente.
                                                      * Sólo ABIERTOS a propósito: un código cerrado impreso en la
                                                      * solicitud de autorización es un documento rechazado en ventanilla.
                                                      * El input de arriba sigue libre para el local que no esté acá.
                                                      */}
                                                    {establecimientosCliente.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7, alignItems: 'center' }}>
                                                            <span style={{ fontSize: 10.5, color: C.goldText, fontWeight: 700 }}>Abiertos del RUC:</span>
                                                            {establecimientosCliente.map(est => {
                                                                const activo = sriEstablecimiento === est.codigo;
                                                                return (
                                                                    <button
                                                                        key={est.codigo}
                                                                        type="button"
                                                                        onClick={() => setSriEstablecimiento(est.codigo)}
                                                                        title={[est.nombre, est.direccion].filter(Boolean).join(' · ')}
                                                                        style={{
                                                                            ...S.softBtn, padding: '5px 10px', fontSize: 11, fontFamily: MONO,
                                                                            background: activo ? C.royal : '#FFFFFF',
                                                                            color: activo ? '#FFFFFF' : C.royal,
                                                                        }}
                                                                    >
                                                                        {est.codigo} · {est.tipo}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <label>
                                                    <span style={S.fieldLabel}>Punto de emisión</span>
                                                    <input
                                                        value={sriPuntoEmision}
                                                        onChange={e => setSriPuntoEmision(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                                        placeholder="001"
                                                        maxLength={3}
                                                        style={{ ...S.input, padding: '9px 11px', fontFamily: MONO, letterSpacing: '.08em' }}
                                                    />
                                                </label>
                                            </div>

                                            <label style={{ display: 'block', marginTop: 12 }}>
                                                <span style={S.fieldLabel}>Actividad económica</span>
                                                <input
                                                    value={sriActividad}
                                                    onChange={e => setSriActividad(e.target.value)}
                                                    placeholder="Comercio / Servicios General"
                                                    style={{ ...S.input, padding: '9px 11px' }}
                                                />
                                            </label>

                                            {/* Las actividades ya se leyeron del certificado de RUC del cliente
                                                (ClientSelector las guarda en fiscal_data.actividades). Ofrecerlas
                                                evita retipear un texto largo que además es legal. */}
                                            {(cliente.fiscal_data?.actividades?.length || 0) > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
                                                    <span style={{ fontSize: 10.5, color: C.goldText, fontWeight: 700 }}>Del RUC:</span>
                                                    {cliente.fiscal_data!.actividades!.slice(0, 4).map((a, i) => {
                                                        const activa = sriActividad === a.descripcion;
                                                        return (
                                                            <button
                                                                key={i}
                                                                type="button"
                                                                onClick={() => setSriActividad(a.descripcion)}
                                                                title={a.descripcion}
                                                                style={{
                                                                    ...S.softBtn, padding: '5px 10px', fontSize: 11,
                                                                    background: activa ? C.royal : '#FFFFFF',
                                                                    color: activa ? '#FFFFFF' : C.royal,
                                                                }}
                                                            >
                                                                {a.descripcion.length > 44 ? `${a.descripcion.slice(0, 44)}…` : a.descripcion}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/*
                                              * Marcado del trámite: va IMPRESO en la solicitud de autorización
                                              * y lo declara el operador. No se deduce de si la orden es una
                                              * renovación: una renovación puede ser "Mismo" o "Aument." según la
                                              * cantidad pedida, y "Cambiar" si el cliente modificó un dato.
                                              * Ver services/printModels.ts → marcadoTramite().
                                              */}
                                            <div style={{ marginTop: 14 }}>
                                                <span style={S.fieldLabel}>Trámite ante el SRI</span>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {TRAMITES_SRI.map(t => {
                                                        const activo = tramiteSri === t.id;
                                                        return (
                                                            <button
                                                                key={t.id}
                                                                type="button"
                                                                onClick={() => setTramiteSri(t.id)}
                                                                title={t.descripcion}
                                                                style={{
                                                                    ...S.softBtn, padding: '7px 13px', fontSize: 12,
                                                                    background: activo ? C.royal : '#FFFFFF',
                                                                    color: activo ? '#FFFFFF' : C.royal,
                                                                    border: `1px solid ${activo ? C.royal : C.borderStrong}`,
                                                                }}
                                                            >
                                                                {t.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <p style={{ margin: '6px 0 0', fontSize: 11, color: C.goldText }}>
                                                    {TRAMITES_SRI.find(t => t.id === tramiteSri)?.descripcion}
                                                </p>
                                            </div>

                                            {/*
                                              * Variante de producción del talonario. Las tres terminan en el
                                              * mismo formulario, pero se imprimen distinto: sólo los datos
                                              * sobre el preimpreso, el arte completo sobre hoja en blanco, o la
                                              * versión A4 para gestionar desde la computadora.
                                              * Ver services/printModels.ts.
                                              */}
                                            <div style={{ marginTop: 14 }}>
                                                <span style={S.fieldLabel}>Cómo se imprime</span>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {modelosDe('SRI').map(m => {
                                                        const activo = modeloImpresionSri === m.id;
                                                        return (
                                                            <button
                                                                key={m.id}
                                                                type="button"
                                                                onClick={() => setModeloImpresionSri(m.id)}
                                                                title={m.descripcion}
                                                                style={{
                                                                    display: 'block', textAlign: 'left', width: '100%',
                                                                    padding: '8px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                                                                    background: activo ? C.chipBlue : '#FFFFFF',
                                                                    border: `1px solid ${activo ? C.royal : C.borderStrong}`,
                                                                }}
                                                            >
                                                                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: activo ? C.royal : C.ink }}>
                                                                    {m.label}
                                                                    {m.id === modeloPorDefecto(true) && (
                                                                        <span style={{ marginLeft: 6, fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', color: C.goldText }}>SUGERIDO</span>
                                                                    )}
                                                                </span>
                                                                <span style={{ display: 'block', fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.45 }}>
                                                                    {m.descripcion}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <p style={{ margin: '6px 0 0', fontSize: 11, color: C.goldText }}>
                                                    Se imprime como <strong>{MODELOS[modeloImpresionSri].label}</strong> en {MODELOS[modeloImpresionSri].papel.nombre.toLowerCase()} ({MODELOS[modeloImpresionSri].papel.anchoMm} × {MODELOS[modeloImpresionSri].papel.altoMm} mm).
                                                </p>
                                            </div>

                                            <p style={{ margin: '10px 0 0', fontSize: 11.5, color: C.goldTextStrong }}>
                                                {sriEstablecimiento.trim() && sriPuntoEmision.trim() && sriActividad.trim()
                                                    ? '✓ Listo para continuar'
                                                    : 'Completá los tres datos para continuar: van impresos en el documento.'}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* PASO 4: Pago y Confirmación */}
                            {step === 4 && (
                                <motion.div key="s4" {...animPaso(direccion)}>
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
                                {desglose.recargo > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4 }}>
                                        <span style={{ color: C.dangerText }}>Urgencia (+15%)</span>
                                        <span style={{ color: C.dangerText, fontFamily: MONO }}>+{formatCurrency(desglose.recargo)}</span>
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
