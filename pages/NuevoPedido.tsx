import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { useData, CATEGORY_EMOJIS } from '../contexts/DataContext';
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
import { perfilDe, especificacionesPorDefecto, calcularDelta, hojasPorTalonario } from '../services/detalleProducto';
import { sugerirSiguienteNumeracion } from '../services/tallerBoard';
import { ProductVisual, esProductoTalonario } from '../components/ProductVisual';

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

/**
 * Catálogo de respaldo: solo se usa mientras `productos` (Supabase) todavía no cargó.
 * El catálogo real es la tabla `productos` (semilla = services/catalogData.ts).
 */
const CATALOGO_FALLBACK: any[] = [
  { id: 'f1', nombre: 'NOTA DE VENTA (RIMPE NEGOCIO POPULAR)', categoria: 'Documentos SRI', precio: 13, esSRI: true, descripcion: 'Talonario 100 hojas, 1/4 de oficio, duplicado.' },
  { id: 'f2', nombre: 'FACTURA (REGIMEN GENERAL)', categoria: 'Documentos SRI', precio: 15, esSRI: true, descripcion: 'Factura autorizada 100 hojas, 1/4 de oficio.' },
  { id: 'f3', nombre: 'LIQUIDACION DE COMPRA (RIMPE)', categoria: 'Documentos SRI', precio: 15, esSRI: true, descripcion: 'Liquidación de compra de bienes o servicios.' },
  { id: 'f4', nombre: 'GUIAS DE REMISION', categoria: 'Documentos SRI', precio: 12, esSRI: true, descripcion: 'Guías de remisión en talonario autorizado.' },
  { id: 'f5', nombre: 'Talonario 2 Blocks (200 hojas)', categoria: 'Documentos SRI', precio: 20, esSRI: true, descripcion: 'Dos blocks encolados de 100 hojas.' },
  { id: 'f6', nombre: 'Tarjetas de Presentación x1000', categoria: 'Tarjetas', precio: 28, esSRI: false, descripcion: 'Mil tarjetas full color couché 300g.' },
  { id: 'f7', nombre: 'Volantes Publicitarios x1000', categoria: 'Publicidad', precio: 22, esSRI: false, descripcion: 'Mil volantes full color couché 150g.' },
  { id: 'f8', nombre: 'Sello Automático', categoria: 'Oficina', precio: 35, esSRI: false, descripcion: 'Sello automático profesional.' },
  { id: 'f9', nombre: 'Gigantografía / Lona Banner (m2)', categoria: 'Gran Formato', precio: 12, esSRI: false, descripcion: 'Impresión en lona banner por m2.' },
];

const NuevoPedidoPage: React.FC = () => {
    const outletCtx = useOutletContext<{ currentUser?: User }>();
    const { user: authUser } = useAuth();
    const currentUser = outletCtx?.currentUser || authUser || ({ nombre: 'Pedro Cordova', rol: 'Administrador' } as unknown as User);
    const { refreshData, addTrabajo, addCliente, clientes, trabajos, productos } = useData();
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
    const [createdOrderSummary, setCreatedOrderSummary] = useState<any>(null);
    const [whatsAppCopied, setWhatsAppCopied] = useState(false);
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
    const [sriActividad, setSriActividad] = useState('Comercio / Servicios General');
    const [estadoAutorizacionSri, setEstadoAutorizacionSri] = useState<'ya_autorizado' | 'por_tramitar'>('ya_autorizado');
    const [sriAlDiaVerificado, setSriAlDiaVerificado] = useState(true);
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
    const [sriLaunchMsg, setSriLaunchMsg] = useState<string | null>(null);

    // ── Estado del puente con la extensión de Chrome ───────────────────────
    // `bridgeListo` dice si la extensión está instalada y escuchando. Antes no
    // se consultaba: si no estaba instalada, el botón igual decía "Abriendo el
    // SRI…" y no pasaba nada nunca.
    const [bridgeListo, setBridgeListo] = useState(false);
    // Lanzamiento en curso: su id sirve para descartar resultados de solicitudes
    // viejas que lleguen tarde, y su temporizador para dejar de esperar.
    const sriPedidoEnCurso = useRef<string | null>(null);
    const sriTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ¿La orden contiene al menos un producto con requerimientos SRI?
    const hasSriItem = useMemo(() => items.some(i => i.esSRI || i.especificaciones?.sri), [items]);

    // ── Catálogo del Paso 1 ──────────────────────────────────────────────
    // Se alimenta del catálogo real (Supabase). Si todavía no cargó, usa el
    // respaldo estático para que el mostrador nunca se quede sin productos.
    const catalogoPaso1 = useMemo(
        () => (productos && productos.length > 0 ? productos : CATALOGO_FALLBACK),
        [productos],
    );
    const categoriasPaso1 = useMemo(() => {
        const set = new Set(catalogoPaso1.map((p: any) => p.categoria).filter(Boolean));
        return ['Todos', 'Comprobantes SRI', ...Array.from(set).filter((c: any) => c !== 'Documentos SRI' && c !== 'SRI').sort()];
    }, [catalogoPaso1]);
    const productosFiltradosPaso1 = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return catalogoPaso1.filter((p: any) => {
            const cat = p.categoria || 'General';
            const matchCat = filtroCat === 'Todos'
                ? true
                : filtroCat === 'Comprobantes SRI'
                    ? !!p.esSRI
                    : cat === filtroCat;
            const matchQ = !q || [p.nombre, cat, p.descripcion, ...((p as any).specs || [])]
                .filter(Boolean).join(' ').toLowerCase().includes(q);
            return matchCat && matchQ;
        });
    }, [catalogoPaso1, filtroCat, busqueda]);

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
        const estVal = payload.est || payload.establecimiento || '001';
        const ptoVal = payload.pto || payload.puntoEmision || '001';
        const direccionVal = payload.direccion || payload.address || '';
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
                    direccion: direccionVal || undefined,
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
        if (params.get('es_sri') === 'true' || params.get('cat') === 'sri' || params.get('categoria') === 'sri') {
            setFiltroCat('Comprobantes SRI');
        }
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
            return !!(cliente || tempClient?.nombre || tempClient?.cedula);
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

    const handleSelectQuickProduct = (p: any) => {
        const esSRI = !!p.esSRI;
        const base = Number(p.precio) || 0;
        // Cada producto trae su PERFIL de detalle (SRI, sello, láser, gran formato…):
        // así un sello no hereda campos de talonario ni la clave del SRI.
        const perfil = perfilDe({ esSRI, categoria: p.categoria, nombre: p.nombre });
        const specs = especificacionesPorDefecto(perfil);
        const unit = Math.max(1, base + calcularDelta(perfil, specs));
        const newItem = {
            nombre: p.nombre,
            categoria: p.categoria,
            cantidad: 1,
            precioBase: base,
            precioUnitario: unit,
            precioFinal: unit,
            esSRI,
            especificaciones: specs,
        };
        // Se agrega al pedido (no reemplaza), para permitir órdenes multi-ítem.
        setItems(prev => [...prev, newItem]);
        setStep(2);
    };

    // ── Flujo inverso: lanzar la solicitud SRI desde el Paso 2 ──────────
    // La web le pide a la extensión que abra el SRI y haga la solicitud con el
    // documento y la cantidad ya configurados. Al terminar, la extensión devuelve
    // los datos y la orden se completa sola.
    // Cuánto esperamos a que termine la solicitud en el portal del SRI. Un
    // trámite real lleva un par de minutos (login, 6 pantallas, la búsqueda de
    // la imprenta), así que el corte tiene que ser generoso; lo que no puede
    // pasar es esperar para siempre sin decir nada.
    const ESPERA_SRI_MS = 4 * 60 * 1000;

    const handleLaunchSri = (item: any) => {
        const nombre = (item?.nombre || '').toUpperCase();
        const docType = nombre.includes('FACTURA') ? '0'
            : (nombre.includes('GUÍA') || nombre.includes('GUIA')) ? '5'
            : '1';
        // Los comprobantes que se le piden al SRI salen de la opción de copias
        // elegida en el Paso 2. Antes se leía `especificaciones.paginas`, una
        // clave que el perfil SRI NO genera (sus campos son tamano/copias/papel),
        // así que la solicitud se mandaba SIEMPRE por 100: un triplicado de 150
        // o un cuadruplicado de 200 se autorizaban por la cantidad equivocada y
        // había que rehacer el trámite.
        const blocks = hojasPorTalonario(item?.especificaciones);
        // Sin extensión no hay nada que lanzar: se dice ahora, no después de un
        // "⏳ Abriendo el SRI…" que no iba a cumplirse.
        if (!bridgeListo) {
            setSriLaunchMsg('No detectamos la extensión de Chrome. Instalala desde el menú Sistema → Descargar Extensión, activala y recargá esta página.');
            return;
        }

        const requestId = `sri-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const payload = {
            requestId,
            ruc: cliente?.ruc || tempClient?.cedula || '',
            name: cliente?.nombre || tempClient?.nombre || '',
            direccion: (cliente as any)?.direccion || tempClient?.direccion || '',
            docType,
            blocks,
            docSize: item?.especificaciones?.tamano || '1/4 Oficio',
            // El precio ya está calculado acá (precio del catálogo + los deltas
            // del Paso 2). Viaja con el lanzamiento para que la extensión NO
            // vuelva a cotizar por su cuenta: tenía su propia tabla y registraba
            // todo a precio de nota de venta de 1/4 oficio.
            precioUnitario: Number(item?.precioFinal ?? item?.precioUnitario) || 0,
        };
        try {
            window.postMessage({ type: 'CORDOVA_SRI_LAUNCH', payload }, window.location.origin);
            sriPedidoEnCurso.current = requestId;
            setSriLaunchMsg('⏳ Abriendo el SRI… cuando termine la solicitud, los datos se cargan solos. Podés seguir trabajando acá.');

            if (sriTimeout.current) clearTimeout(sriTimeout.current);
            sriTimeout.current = setTimeout(() => {
                // Se agotó la espera: puede que el trámite se haya cortado, que
                // el contribuyente no pueda emitir ese documento o que la pestaña
                // del SRI se haya cerrado. Lo importante es no dejar al operador
                // mirando un reloj que no avanza.
                if (sriPedidoEnCurso.current !== requestId) return;
                sriPedidoEnCurso.current = null;
                setSriLaunchMsg('⚠️ El SRI no devolvió la solicitud. Revisá la pestaña del portal: si quedó a medias, completala ahí y cargá los datos a mano, o volvé a intentarlo.');
            }, ESPERA_SRI_MS);
        } catch (e) {
            console.error('[NuevoPedido] No se pudo lanzar la solicitud SRI:', e);
            setSriLaunchMsg('No se pudo abrir el SRI. Verificá que la extensión esté instalada y activa.');
        }
    };

    // Detección de la extensión: se pregunta al montar y se escucha el anuncio.
    // El puente contesta el ping, así que no importa quién llegue primero.
    useEffect(() => {
        const onReady = (e: MessageEvent) => {
            if (e.source !== window || e.origin !== window.location.origin) return;
            if (!e.data || e.data.type !== 'CORDOVA_BRIDGE_READY') return;
            setBridgeListo(true);
        };
        window.addEventListener('message', onReady);
        try {
            window.postMessage({ type: 'CORDOVA_BRIDGE_PING' }, window.location.origin);
        } catch { /* sin puente, queda en false */ }
        return () => window.removeEventListener('message', onReady);
    }, []);

    // Al desmontar, no dejar vivo el temporizador de espera del SRI.
    useEffect(() => () => { if (sriTimeout.current) clearTimeout(sriTimeout.current); }, []);

    useEffect(() => {
        const onMessage = (e: MessageEvent) => {
            // Solo mensajes de esta misma página: con '*' cualquier iframe podía
            // inyectar un resultado falso y completar la orden con datos ajenos.
            if (e.source !== window || e.origin !== window.location.origin) return;
            if (!e.data || e.data.type !== 'CORDOVA_SRI_RESULT') return;
            const d = e.data.data || {};

            // Descartar resultados que no son del lanzamiento que esperamos.
            // `requestId` ausente = extensión vieja: se acepta por compatibilidad.
            if (d.requestId && sriPedidoEnCurso.current && d.requestId !== sriPedidoEnCurso.current) return;
            sriPedidoEnCurso.current = null;
            if (sriTimeout.current) { clearTimeout(sriTimeout.current); sriTimeout.current = null; }
            if (d.ruc || d.name) {
                setTempClient((prev: any) => ({
                    ...prev,
                    nombre: (d.name || prev.nombre || '').toUpperCase(),
                    cedula: d.ruc || prev.cedula,
                    direccion: d.direccion || prev.direccion,
                }));
            }
            if (d.establecimiento) setSriEstablecimiento(d.establecimiento);
            if (d.puntoEmision) setSriPuntoEmision(d.puntoEmision);
            if (d.caducidad) {
                setAutorizacionSriInput(d.caducidad);
                // Persistir la caducidad en el ítem SRI para que la orden la guarde.
                setItems(prev => prev.map((it: any) => it.esSRI ? {
                    ...it,
                    especificaciones: {
                        ...(it.especificaciones || {}),
                        sri: { ...((it.especificaciones || {}).sri || {}), vencimiento: d.caducidad },
                    },
                } : it));
            }
            if (d.numeracion) setNumeracionInicial(d.numeracion);
            if (d.caducidadAlerta && d.caducidadMeses) {
                setSriLaunchMsg(`✅ Solicitud SRI completada. ⚠️ Caducidad de ${d.caducidadMeses} meses (obligaciones pendientes).`);
            } else {
                setSriLaunchMsg('✅ Solicitud SRI completada: RUC, nombre, dirección y establecimiento cargados.');
            }
            setTimeout(() => setSriLaunchMsg(null), 10000);
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

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
                            direccion: tempClient.direccion || 'Local'
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
            
            const orderMeta = {
                id: results[0].id,
                orden: results[0].orden || results[0].id,
                clienteNombre: finalCliente.nombre,
                clienteRuc: finalCliente.ruc || finalCliente.cedula || '9999999999',
                clienteTelefono: finalCliente.telefono?.[0] || tempClient?.telefono || '',
                total: desglose.total,
                abono,
                saldo: desglose.saldo,
                esSRI: hasSriItem,
                items: [...items],
                fechaEntrega,
                prioridad,
                tramiteSri,
                sriEstablecimiento,
                sriPuntoEmision,
                sriActividad,
            };
            setCreatedOrderSummary(orderMeta);
            setCreatedTrabajoId(results[0].id);
            setStep(5);
            setTimeout(() => {
                try {
                    window.open(hasSriItem ? `/#/solicitud-impresion/${results[0].id}?format=a5` : `/#/recibo-epson/${results[0].id}`, '_blank');
                } catch {
                    // Si el navegador bloquea la ventana emergente, el operador tiene los botones grandes en el paso 5
                }
            }, 800);
        } catch (err: any) {
            console.error('[NuevoPedido] Error al crear orden:', err);
            setError(err.message || 'Error al procesar la orden.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendWhatsAppConfirmation = () => {
        if (!createdOrderSummary) return;
        const phone = (createdOrderSummary.clienteTelefono || '').replace(/\D/g, '');
        const idDisplay = createdOrderSummary.orden || createdOrderSummary.id?.substring(0, 8) || 'ORD';
        const trackingUrl = `https://www.imprentacordova.net/tracking?orden=${idDisplay}`;
        
        let msg = '';
        if (createdOrderSummary.esSRI) {
            msg = `*IMPRENTA CÓRDOVA · SOLICITUD SRI CONFIRMADA*\n\n` +
                `Estimado/a *${createdOrderSummary.clienteNombre}*,\n` +
                `Se ha registrado con éxito su solicitud de autorización de comprobantes SRI:\n` +
                `📄 *Comprobante:* ${createdOrderSummary.items?.[0]?.nombre || 'Talonarios SRI'}\n` +
                `🔢 *Orden N°:* ${idDisplay}\n` +
                `🏢 *Establ.:* ${createdOrderSummary.sriEstablecimiento || '001'} · *Pto. Emisión:* ${createdOrderSummary.sriPuntoEmision || '001'}\n` +
                `💵 *Total:* ${formatCurrency(createdOrderSummary.total)} | *Abono:* ${formatCurrency(createdOrderSummary.abono)} | *Saldo:* ${formatCurrency(createdOrderSummary.saldo)}\n` +
                `📅 *Entrega estimada:* ${new Date(createdOrderSummary.fechaEntrega).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}\n\n` +
                `🔍 *Rastree su orden en vivo:*\n${trackingUrl}\n\n` +
                `📍 Imprenta Córdova · Colón e/. Sucre y Av. Rocafuerte · Machala, El Oro`;
        } else {
            msg = `*IMPRENTA CÓRDOVA · RECIBO DE ORDEN DE TRABAJO*\n\n` +
                `Estimado/a *${createdOrderSummary.clienteNombre}*,\n` +
                `Su orden de trabajo comercial ha sido ingresada a producción:\n` +
                `📦 *Trabajo:* ${createdOrderSummary.items?.map((it: any) => `${it.cantidad || 1}x ${it.nombre}`).join(', ') || 'Trabajo General'}\n` +
                `🔢 *Orden N°:* ${idDisplay}\n` +
                `💵 *Total:* ${formatCurrency(createdOrderSummary.total)} | *Abono:* ${formatCurrency(createdOrderSummary.abono)} | *Saldo:* ${formatCurrency(createdOrderSummary.saldo)}\n` +
                `📅 *Entrega estimada:* ${new Date(createdOrderSummary.fechaEntrega).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}\n\n` +
                `🔍 *Rastree su orden en vivo:*\n${trackingUrl}\n\n` +
                `📍 Imprenta Córdova · Machala, El Oro`;
        }

        if (phone && phone.length >= 7) {
            const url = generateWhatsAppLink(phone, msg);
            window.open(url, '_blank');
        } else {
            navigator.clipboard.writeText(msg);
            setWhatsAppCopied(true);
            setTimeout(() => setWhatsAppCopied(false), 3000);
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
                              * Enmarcado explícito: Diferenciación legal entre Comprobantes SRI (Tax)
                              * y Trabajos Comerciales de imprenta.
                              */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '7px 14px',
                                borderRadius: 12, flexWrap: 'wrap',
                                ...(hasSriItem
                                    ? {
                                        background: 'linear-gradient(135deg, #0A1140 0%, #16309B 100%)',
                                        color: '#FFFFFF',
                                        border: '1.5px solid #FFC61A',
                                        boxShadow: '0 4px 14px -3px rgba(255,198,26,0.35)',
                                    }
                                    : {
                                        background: '#F0F4FF',
                                        color: C.ink,
                                        border: `1.5px solid ${C.borderStrong}`,
                                    }),
                            }}>
                                <span style={{
                                    fontSize: 16, width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: hasSriItem ? 'rgba(255,198,26,0.25)' : '#FFFFFF',
                                    border: hasSriItem ? '1px solid rgba(255,198,26,0.5)' : `1px solid ${C.border}`,
                                }}>
                                    {hasSriItem ? '🏛️' : '💼'}
                                </span>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <strong style={{ fontSize: 11.5, letterSpacing: '.06em', textTransform: 'uppercase', color: hasSriItem ? '#FFC61A' : C.royal }}>
                                            {hasSriItem ? 'Trámite Fiscal: Comprobante Autorizado SRI (Tax)' : 'Trabajo Comercial / Publicitario General'}
                                        </strong>
                                        <span style={{
                                            fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                                            background: hasSriItem ? '#FFC61A' : C.royal,
                                            color: hasSriItem ? '#0A1140' : '#FFFFFF',
                                        }}>
                                            {hasSriItem ? 'EXENTO IVA SRI' : '+15% IVA'}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: 11, color: hasSriItem ? '#CAD5F5' : C.muted, display: 'block', marginTop: 1 }}>
                                        {hasSriItem
                                            ? 'Emite: Solicitud Oficial de Autorización SRI (A5 / Medio Oficio) · Requiere RUC y secuencia legal'
                                            : 'Emite: Recibo de Caja y Ticket de Taller · Sin requerimientos fiscales'}
                                    </span>
                                </div>
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
                                                            setSriActividad(found.actividades || found.fiscal_data?.actividades?.[0]?.descripcion || 'Comercio / Servicios General');
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
                                            
                                            {/* Selector / Enmarcado Dual de Entrada: Comprobantes SRI (Tax) vs. Trabajos Comerciales */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                                                {/* Rama 1: Documentos Autorizados por el SRI */}
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => setFiltroCat(filtroCat === 'Comprobantes SRI' ? 'Todos' : 'Comprobantes SRI')}
                                                    style={{
                                                        padding: '16px 18px',
                                                        borderRadius: 14,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                                        background: filtroCat === 'Comprobantes SRI'
                                                            ? 'linear-gradient(135deg, #0A1140 0%, #16309B 100%)'
                                                            : '#FFFFFF',
                                                        border: `2px solid ${filtroCat === 'Comprobantes SRI' ? '#FFC61A' : '#E2E8F0'}`,
                                                        color: filtroCat === 'Comprobantes SRI' ? '#FFFFFF' : C.ink,
                                                        boxShadow: filtroCat === 'Comprobantes SRI' ? '0 8px 24px -6px rgba(10,17,64,0.35)' : '0 2px 8px rgba(10,17,64,0.03)',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                                        <span style={{ fontSize: 24 }}>🏛️</span>
                                                        <span style={{
                                                            fontSize: 10,
                                                            fontWeight: 900,
                                                            letterSpacing: '.12em',
                                                            textTransform: 'uppercase',
                                                            padding: '3px 8px',
                                                            borderRadius: 6,
                                                            background: filtroCat === 'Comprobantes SRI' ? '#FFC61A' : C.goldBg,
                                                            color: filtroCat === 'Comprobantes SRI' ? '#0A1140' : C.goldTextStrong,
                                                            border: `1px solid ${C.goldBorder}`,
                                                        }}>
                                                            DOCUMENTO TRIBUTARIO SRI (TAX)
                                                        </span>
                                                    </div>
                                                    <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 800 }}>
                                                        Comprobantes Autorizados SRI
                                                    </div>
                                                    <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.45, color: filtroCat === 'Comprobantes SRI' ? '#CAD5F5' : C.muted }}>
                                                        Facturas, Notas de Venta RIMPE, Liquidaciones y Guías. Requieren RUC y emiten <strong>Solicitud de Autorización de Impresión</strong> oficial (Sin IVA).
                                                    </div>
                                                    <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: filtroCat === 'Comprobantes SRI' ? 'rgba(255,255,255,0.18)' : '#F1F5F9' }}>
                                                            ✓ RUC 13 dígitos
                                                        </span>
                                                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: filtroCat === 'Comprobantes SRI' ? 'rgba(255,255,255,0.18)' : '#F1F5F9' }}>
                                                            ✓ Secuencia Auditada
                                                        </span>
                                                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: filtroCat === 'Comprobantes SRI' ? 'rgba(255,255,255,0.18)' : '#F1F5F9' }}>
                                                            ✓ Solicitud A5
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Rama 2: Trabajos Comerciales y Publicitarios */}
                                                <div
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => setFiltroCat(filtroCat === 'Papelería Comercial' ? 'Todos' : 'Papelería Comercial')}
                                                    style={{
                                                        padding: '16px 18px',
                                                        borderRadius: 14,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                                        background: filtroCat === 'Papelería Comercial' || filtroCat === 'Publicidad & Sellos'
                                                            ? 'linear-gradient(135deg, #1E293B 0%, #334155 100%)'
                                                            : '#FFFFFF',
                                                        border: `2px solid ${filtroCat === 'Papelería Comercial' || filtroCat === 'Publicidad & Sellos' ? C.royal : '#E2E8F0'}`,
                                                        color: filtroCat === 'Papelería Comercial' || filtroCat === 'Publicidad & Sellos' ? '#FFFFFF' : C.ink,
                                                        boxShadow: filtroCat === 'Papelería Comercial' || filtroCat === 'Publicidad & Sellos' ? '0 8px 24px -6px rgba(30,41,59,0.35)' : '0 2px 8px rgba(10,17,64,0.03)',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                                        <span style={{ fontSize: 24 }}>💼</span>
                                                        <span style={{
                                                            fontSize: 10,
                                                            fontWeight: 900,
                                                            letterSpacing: '.12em',
                                                            textTransform: 'uppercase',
                                                            padding: '3px 8px',
                                                            borderRadius: 6,
                                                            background: filtroCat === 'Papelería Comercial' || filtroCat === 'Publicidad & Sellos' ? '#60A5FA' : C.chipBlue,
                                                            color: filtroCat === 'Papelería Comercial' || filtroCat === 'Publicidad & Sellos' ? '#0F172A' : C.royal,
                                                            border: `1px solid ${C.borderStrong}`,
                                                        }}>
                                                            USO COMERCIAL Y PUBLICITARIO
                                                        </span>
                                                    </div>
                                                    <div style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 800 }}>
                                                        Papelería Comercial & Publicidad
                                                    </div>
                                                    <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.45, color: filtroCat === 'Papelería Comercial' || filtroCat === 'Publicidad & Sellos' ? '#E2E8F0' : C.muted }}>
                                                        Recibos de cobro, notas de pedido, comandas, volantes, tarjetas, lonas y sellos. No requieren trámite ante el SRI y emiten <strong>Recibo de Taller</strong> (+15% IVA).
                                                    </div>
                                                    <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: filtroCat === 'Papelería Comercial' || filtroCat === 'Publicidad & Sellos' ? 'rgba(255,255,255,0.18)' : '#F1F5F9' }}>
                                                            ✓ Consumidor Final o Cédula
                                                        </span>
                                                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: filtroCat === 'Papelería Comercial' || filtroCat === 'Publicidad & Sellos' ? 'rgba(255,255,255,0.18)' : '#F1F5F9' }}>
                                                            ✓ Sin Trámite Fiscal
                                                        </span>
                                                        <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: filtroCat === 'Papelería Comercial' || filtroCat === 'Publicidad & Sellos' ? 'rgba(255,255,255,0.18)' : '#F1F5F9' }}>
                                                            ✓ Recibo de Caja
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

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

                                            {/* Filtros de categoría — limpios y dinámicos */}
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {categoriasPaso1.map((cat: string) => {
                                                    const activo = filtroCat === cat;
                                                    const emoji = cat === 'Todos' ? '✨' : cat === 'Comprobantes SRI' ? '🏛️' : ((CATEGORY_EMOJIS as any)[cat] || '📦');
                                                    return (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => setFiltroCat(cat)}
                                                            style={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                                padding: '6px 12px', borderRadius: 99,
                                                                border: `1px solid ${activo ? C.royal : C.borderStrong}`,
                                                                background: activo ? C.royal : C.surface,
                                                                color: activo ? '#FFFFFF' : C.body,
                                                                fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                                                                transition: 'all .15s ease', fontFamily: 'inherit',
                                                            }}
                                                        >
                                                            <span>{emoji}</span>
                                                            <span>{cat}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Grilla de productos del catálogo real */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
                                                {productosFiltradosPaso1.map((p: any) => (
                                                    <button
                                                        key={p.id || p.nombre}
                                                        type="button"
                                                        onClick={() => handleSelectQuickProduct(p)}
                                                        style={{
                                                            textAlign: 'left',
                                                            padding: 14,
                                                            borderRadius: 14,
                                                            border: `1.5px solid ${p.esSRI ? C.goldBorder : C.border}`,
                                                            background: p.esSRI ? '#FFFCF2' : C.surface,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            minHeight: 150,
                                                            transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                                            boxShadow: '0 2px 4px rgba(10,17,64,0.02)',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = p.esSRI ? C.gold : C.royal;
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                            e.currentTarget.style.boxShadow = '0 10px 22px -8px rgba(10,17,64,0.14)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = p.esSRI ? C.goldBorder : C.border;
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(10,17,64,0.02)';
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: p.esSRI ? '#FFFCF2' : '#F7F3EC', padding: '8px 0', marginBottom: 10 }}>
                                                            <ProductVisual nombre={p.nombre} categoria={p.categoria} esSRI={p.esSRI} width={104} />
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                            <span style={{
                                                                fontSize: 9,
                                                                fontWeight: 800,
                                                                padding: '2px 7px',
                                                                borderRadius: 99,
                                                                background: p.esSRI ? C.goldBg : C.chipBlue,
                                                                color: p.esSRI ? C.goldTextStrong : C.royal,
                                                                border: `1px solid ${p.esSRI ? C.goldBorder : C.borderStrong}`,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '.04em',
                                                            }}>
                                                                {p.esSRI ? '🏛️ SRI' : '💼 Comercial'}
                                                            </span>
                                                            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: C.royal }}>
                                                                {formatCurrency(Number(p.precio) || 0)}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 8, lineHeight: 1.3 }}>
                                                            {p.nombre}
                                                        </div>
                                                        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            {p.descripcion || (p.esSRI ? 'Requiere RUC · Sin IVA' : 'Trabajo comercial · +15% IVA')}
                                                        </div>
                                                        <div style={{ marginTop: 'auto', paddingTop: 8, fontSize: 11.5, fontWeight: 700, color: p.esSRI ? C.goldTextStrong : C.royal }}>
                                                            Configurar detalles →
                                                        </div>
                                                    </button>
                                                ))}
                                                {productosFiltradosPaso1.length === 0 && (
                                                    <div style={{ gridColumn: '1 / -1', padding: 28, textAlign: 'center', color: C.muted, fontSize: 12.5, border: `1px dashed ${C.borderStrong}`, borderRadius: 14 }}>
                                                        No hay productos que coincidan con “{busqueda}”. Probá con otra palabra o revisá el Catálogo.
                                                    </div>
                                                )}
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
                                <motion.div key="s2" {...animPaso(direccion)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {sriLaunchMsg && (
                                        <div style={{ padding: '10px 14px', borderRadius: 10, background: C.goldBg, border: `1px solid ${C.goldBorder}`, color: C.goldTextStrong, fontSize: 12.5, fontWeight: 600 }}>
                                            {sriLaunchMsg}
                                        </div>
                                    )}
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
                                        onLaunchSri={handleLaunchSri}
                                    />
                                </motion.div>
                            )}

                            {/* PASO 3: Selección / Registro de Cliente */}
                            {step === 3 && (
                                <motion.div key="s3" {...animPaso(direccion)} style={{ ...S.card, padding: 20 }}>
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                            <h2 style={{ ...S.h2, margin: 0 }}>
                                                {hasSriItem ? '3 · Datos del Contribuyente para Solicitud SRI' : '3 · Datos del Cliente para Recibo y Despacho'}
                                            </h2>
                                            <span style={{
                                                fontSize: 10.5,
                                                fontWeight: 800,
                                                padding: '3px 8px',
                                                borderRadius: 6,
                                                background: hasSriItem ? C.goldBg : C.chipBlue,
                                                color: hasSriItem ? C.goldTextStrong : C.royal,
                                                border: `1px solid ${hasSriItem ? C.goldBorder : C.borderStrong}`,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4
                                            }}>
                                                <span>{hasSriItem ? '🏛️' : '💼'}</span>
                                                <span>{hasSriItem ? 'COMPROBANTE TRIBUTARIO SRI (TAX)' : 'TRABAJO COMERCIAL'}</span>
                                            </span>
                                        </div>
                                        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: C.muted, lineHeight: 1.45 }}>
                                            {hasSriItem
                                                ? 'Los datos de RUC, razón social, establecimiento y actividad van impresos en la Solicitud Oficial de Autorización del SRI. Deben coincidir con el certificado vigente del contribuyente.'
                                                : 'Registro del cliente para orden de taller, notificación por WhatsApp y recibo de caja de mostrador.'}
                                        </p>
                                    </div>
                                    <ClientSelector
                                        onSelect={(c) => {
                                            setCliente(c);
                                            if (c) {
                                                setSriEstablecimiento(c.establecimientoPredeterminado || '001');
                                                setSriPuntoEmision(c.puntoEmisionPredeterminado || '001');
                                                setSriActividad(c.actividades || c.fiscal_data?.actividades?.[0]?.descripcion || 'Comercio / Servicios General');
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
                                                        setSriActividad(cliente.actividades || cliente.fiscal_data?.actividades?.[0]?.descripcion || 'Comercio / Servicios General');
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
                                              * Formato de impresión: no saturamos el flujo de pedido.
                                              * El operador podrá elegir la variante específica (Sobre Preimpreso, Clásico,
                                              * Moderna o PC A4) en la barra superior al momento de imprimir.
                                              */}
                                            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: '#FFFFFF', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.ink }}>
                                                    <span style={{ fontSize: 16 }}>🖨️</span>
                                                    <div>
                                                        <span style={{ fontWeight: 700 }}>Impresión de Solicitud: {MODELOS[modeloImpresionSri]?.label || 'Sobre Preimpreso'}</span>
                                                        <span style={{ display: 'block', fontSize: 11, color: C.faint, marginTop: 1 }}>
                                                            Las opciones de formato se seleccionan directamente al momento de imprimir para no saturar el pedido.
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/*
                                              * Estado de la Autorización SRI / Sugerencia de Trámite.
                                              * Permite al operador declarar si la autorización ya fue emitida
                                              * o si está pendiente por tramitar ante el portal del SRI.
                                              */}
                                            <div style={{ marginTop: 14, padding: '14px 16px', background: '#FFFFFF', border: `1px solid ${C.goldBorder}`, borderRadius: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                                                    <span style={{ ...S.fieldLabel, margin: 0, fontSize: 11.5, fontWeight: 800, color: C.royal }}>
                                                        Estado del Trámite de Autorización SRI
                                                    </span>
                                                    <span style={{ fontSize: 10.5, color: C.faint }}>
                                                        ¿La solicitud ya fue autorizada en el SRI o está pendiente?
                                                    </span>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginBottom: 12 }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEstadoAutorizacionSri('ya_autorizado')}
                                                        style={{
                                                            padding: '10px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                                                            background: estadoAutorizacionSri === 'ya_autorizado' ? '#ECFDF5' : '#F8FAFC',
                                                            border: `1.5px solid ${estadoAutorizacionSri === 'ya_autorizado' ? '#10B981' : '#E2E8F0'}`,
                                                            color: estadoAutorizacionSri === 'ya_autorizado' ? '#065F46' : C.muted,
                                                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
                                                            textAlign: 'left'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                            <span>✓</span> Ya está autorizada en SRI
                                                        </span>
                                                        <span style={{ fontSize: 10.5, color: estadoAutorizacionSri === 'ya_autorizado' ? '#047857' : C.faint }}>
                                                            Tengo N° de autorización o secuencia previa
                                                        </span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setEstadoAutorizacionSri('por_tramitar')}
                                                        style={{
                                                            padding: '10px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
                                                            background: estadoAutorizacionSri === 'por_tramitar' ? '#FFFBEB' : '#F8FAFC',
                                                            border: `1.5px solid ${estadoAutorizacionSri === 'por_tramitar' ? '#F59E0B' : '#E2E8F0'}`,
                                                            color: estadoAutorizacionSri === 'por_tramitar' ? '#92400E' : C.muted,
                                                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
                                                            textAlign: 'left'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}>
                                                            <span>⏳</span> Por tramitar / Hacer solicitud
                                                        </span>
                                                        <span style={{ fontSize: 10.5, color: estadoAutorizacionSri === 'por_tramitar' ? '#B45309' : C.faint }}>
                                                            Generar solicitud para firma o ingresar a SRI
                                                        </span>
                                                    </button>
                                                </div>

                                                {estadoAutorizacionSri === 'ya_autorizado' ? (
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, padding: 10, background: '#F0FDF4', borderRadius: 9, border: '1px solid #BBF7D0' }}>
                                                        <div>
                                                            <span style={{ ...S.fieldLabel, fontSize: 10.5 }}>N° Autorización SRI (opcional)</span>
                                                            <input
                                                                value={autorizacionSriInput}
                                                                onChange={e => setAutorizacionSriInput(e.target.value.replace(/\D/g, '').slice(0, 37))}
                                                                placeholder="Ej: 1133445566 (10 o 37 dígitos)"
                                                                style={{ ...S.input, padding: '7px 10px', fontSize: 12, fontFamily: MONO, background: '#FFFFFF' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <span style={{ ...S.fieldLabel, fontSize: 10.5 }}>Secuencia Inicial (opcional)</span>
                                                            <input
                                                                value={numeracionInicial}
                                                                onChange={e => setNumeracionInicial(e.target.value)}
                                                                placeholder="Ej: 0000001 al 0000100"
                                                                style={{ ...S.input, padding: '7px 10px', fontSize: 12, fontFamily: MONO, background: '#FFFFFF' }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ padding: 12, background: '#FEF3C7', borderRadius: 9, border: '1px solid #FDE68A', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                                            <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                                                                👉 Puedes gestionar la solicitud en el portal SRI o imprimir el formulario para firma del cliente:
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                <a
                                                                    href="https://srienlinea.sri.gob.ec/sri-en-linea/inicio/NAT"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{
                                                                        padding: '6px 11px', borderRadius: 8, background: '#1E3A8A', color: '#FFFFFF',
                                                                        fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5
                                                                    }}
                                                                >
                                                                    🌐 Abrir SRI en Línea ↗
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const ruc = cliente?.ruc || cliente?.cedula || '';
                                                                        const nom = encodeURIComponent(cliente?.nombre || '');
                                                                        window.open(`/#/solicitud-impresion/directo?ruc=${ruc}&name=${nom}`, '_blank');
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 11px', borderRadius: 8, background: '#FFFFFF', color: '#1E3A8A',
                                                                        border: '1px solid #1E3A8A', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                                        display: 'inline-flex', alignItems: 'center', gap: 5
                                                                    }}
                                                                >
                                                                    📄 Ver Solicitud Física ↗
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginTop: 4 }}>
                                                            <label style={{ display: 'block' }}>
                                                                <span style={{ ...S.fieldLabel, fontSize: 10.5 }}>Clave SRI del cliente (opcional, para gestión)</span>
                                                                <input
                                                                    type="password"
                                                                    value={sriClave}
                                                                    onChange={e => setSriClave(e.target.value)}
                                                                    placeholder="Clave portal SRI"
                                                                    style={{ ...S.input, padding: '7px 10px', fontSize: 12, background: '#FFFFFF' }}
                                                                />
                                                            </label>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginTop: 18 }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={sriAlDiaVerificado}
                                                                    onChange={e => setSriAlDiaVerificado(e.target.checked)}
                                                                    style={{ width: 16, height: 16, accentColor: '#1E3A8A' }}
                                                                />
                                                                <span style={{ fontSize: 11.5, color: '#92400E', fontWeight: 600 }}>
                                                                    Cliente al día en declaraciones tributarias SRI
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* BOTÓN PROMINENTE DIRECTO A PASO 4 (PAGO) */}
                                            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 14, borderTop: `1px solid ${C.goldBorder}` }}>
                                                <span style={{ fontSize: 12, color: C.goldTextStrong, fontWeight: 700 }}>
                                                    ✓ Datos del talonario listos
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!sriEstablecimiento.trim()) setSriEstablecimiento('001');
                                                        if (!sriPuntoEmision.trim()) setSriPuntoEmision('001');
                                                        if (!sriActividad.trim()) setSriActividad('Comercio / Servicios General');
                                                        setStep(4);
                                                    }}
                                                    style={{
                                                        ...S.primaryBtn,
                                                        padding: '12px 24px',
                                                        fontSize: 13.5,
                                                        fontWeight: 800,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                        boxShadow: '0 4px 14px rgba(22,48,155,0.35)',
                                                    }}
                                                >
                                                    <span>Avanzar a Pago & Despacho (Paso 4)</span>
                                                    <span>→</span>
                                                </button>
                                            </div>
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
                                <motion.div key="s5" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 900, margin: '0 auto', width: '100%' }}>
                                    
                                    {/* Cabecera de Confirmación */}
                                    <div style={{
                                        ...S.card,
                                        padding: '32px 24px',
                                        textAlign: 'center',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        ...(hasSriItem
                                            ? { background: 'linear-gradient(135deg, #0A1140 0%, #16309B 100%)', color: '#FFFFFF', border: '2px solid #FFC61A' }
                                            : { background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', border: `1px solid ${C.borderStrong}` }),
                                    }}>
                                        <div style={{
                                            width: 58,
                                            height: 58,
                                            borderRadius: 99,
                                            background: hasSriItem ? '#FFC61A' : '#10B981',
                                            color: hasSriItem ? '#0A1140' : '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 28,
                                            fontWeight: 900,
                                            margin: '0 auto',
                                            boxShadow: hasSriItem ? '0 0 24px rgba(255,198,26,0.5)' : '0 0 24px rgba(16,185,129,0.5)',
                                        }}>
                                            ✓
                                        </div>

                                        <div style={{ marginTop: 14 }}>
                                            <span style={{
                                                fontSize: 11,
                                                fontWeight: 800,
                                                letterSpacing: '0.08em',
                                                textTransform: 'uppercase',
                                                padding: '4px 12px',
                                                borderRadius: 99,
                                                background: hasSriItem ? 'rgba(255,198,26,0.2)' : 'rgba(16,185,129,0.2)',
                                                color: hasSriItem ? '#FFC61A' : '#34D399',
                                                border: `1px solid ${hasSriItem ? 'rgba(255,198,26,0.5)' : 'rgba(16,185,129,0.5)'}`,
                                                display: 'inline-block',
                                            }}>
                                                {hasSriItem ? '🏛️ SOLICITUD DE AUTORIZACIÓN SRI REGISTRADA' : '💼 ORDEN DE TALLER REGISTRADA'}
                                            </span>
                                        </div>

                                        <h2 style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 900, color: '#FFFFFF', marginTop: 10, marginBottom: 4 }}>
                                            Orden #{createdOrderSummary?.orden || createdTrabajoId?.substring(0, 8).toUpperCase()}
                                        </h2>

                                        <p style={{ fontSize: 13.5, color: hasSriItem ? '#CAD5F5' : '#94A3B8', maxWidth: 560, margin: '6px auto 0', lineHeight: 1.5 }}>
                                            {hasSriItem
                                                ? 'La solicitud de autorización tributaria ha sido guardada en base de datos. Utilice los accesos rápidos para imprimir el documento oficial A5 o gestionar el trámite en el portal del SRI.'
                                                : 'La orden ha sido enviada al taller de impresión y acabado. Utilice los accesos rápidos para imprimir el recibo de caja Epson o la hoja de ruta técnica.'}
                                        </p>
                                    </div>

                                    {/* Panel de 2 Columnas: Datos del Pedido & Liquidación */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 16 }}>
                                        
                                        {/* Columna Izquierda: Datos del Cliente / Contribuyente */}
                                        <div style={{ ...S.card, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.rowLine}`, paddingBottom: 8 }}>
                                                <span style={{ ...S.colHead, fontSize: 11 }}>
                                                    {hasSriItem ? '🏛️ CONTRIBUYENTE SRI' : '👤 CLIENTE'}
                                                </span>
                                                <span style={{ fontSize: 11, fontFamily: MONO, color: C.faint }}>
                                                    Prioridad: <b style={{ color: createdOrderSummary?.prioridad === 'Urgente' ? C.danger : C.ink }}>{createdOrderSummary?.prioridad || 'Normal'}</b>
                                                </span>
                                            </div>

                                            <div>
                                                <div style={{ fontSize: 14.5, fontWeight: 800, color: C.ink }}>
                                                    {createdOrderSummary?.clienteNombre || cliente?.nombre || 'CONSUMIDOR FINAL'}
                                                </div>
                                                <div style={{ fontFamily: MONO, fontSize: 12, color: C.royal, fontWeight: 700, marginTop: 2 }}>
                                                    RUC/CI: {createdOrderSummary?.clienteRuc || cliente?.ruc || cliente?.cedula || '9999999999'}
                                                </div>
                                                {createdOrderSummary?.clienteTelefono && (
                                                    <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                                                        📞 {createdOrderSummary.clienteTelefono}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Ítems del Pedido */}
                                            <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <span style={{ fontSize: 10.5, fontWeight: 700, color: C.faint, textTransform: 'uppercase' }}>Ítems a Producir:</span>
                                                {(createdOrderSummary?.items || items).map((it: any, idx: number) => (
                                                    <div key={idx} style={{ padding: '6px 10px', background: C.surfaceAlt, borderRadius: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${C.border}` }}>
                                                        <span style={{ fontWeight: 600, color: C.ink }}>
                                                            {it.esSRI ? '🏛️ ' : '💼 '}{it.cantidad || 1}x {it.nombre}
                                                        </span>
                                                        <span style={{ fontFamily: MONO, fontWeight: 700, color: C.royal }}>
                                                            ${(it.precioFinal || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Si es SRI, mostrar datos de emisión */}
                                            {hasSriItem && (
                                                <div style={{ padding: '8px 12px', background: '#FFFDF0', border: `1px solid ${C.goldBorder}`, borderRadius: 10, fontSize: 11.5, color: C.ink, marginTop: 2 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Establecimiento: <b>{createdOrderSummary?.sriEstablecimiento || sriEstablecimiento || '001'}</b></span>
                                                        <span>Pto. Emisión: <b>{createdOrderSummary?.sriPuntoEmision || sriPuntoEmision || '001'}</b></span>
                                                    </div>
                                                    <div style={{ marginTop: 4 }}>
                                                        <span>Actividad: <b>{createdOrderSummary?.sriActividad || sriActividad || 'General'}</b></span>
                                                    </div>
                                                    <div style={{ marginTop: 4, color: C.goldTextStrong, fontWeight: 700 }}>
                                                        <span>Trámite: {createdOrderSummary?.tramiteSri || tramiteSri}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Columna Derecha: Liquidación Financiera */}
                                        <div style={{ ...S.card, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.rowLine}`, paddingBottom: 8 }}>
                                                    <span style={{ ...S.colHead, fontSize: 11 }}>💳 LIQUIDACIÓN DE PAGO</span>
                                                    <span style={{
                                                        fontSize: 10,
                                                        fontWeight: 800,
                                                        padding: '2px 8px',
                                                        borderRadius: 6,
                                                        ...((createdOrderSummary?.saldo ?? desglose.saldo) <= 0
                                                            ? { background: C.successBg, color: C.success, border: `1px solid ${C.successBorder}` }
                                                            : { background: C.dangerBg, color: C.dangerText, border: `1px solid ${C.dangerBorder}` }),
                                                    }}>
                                                        {(createdOrderSummary?.saldo ?? desglose.saldo) <= 0 ? '✓ TOTALMENTE CANCELADO' : '⏳ CON SALDO PENDIENTE'}
                                                    </span>
                                                </div>

                                                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                                                        <span style={{ color: C.muted }}>Total Orden:</span>
                                                        <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 800, color: C.ink }}>
                                                            {formatCurrency(createdOrderSummary?.total || desglose.total)}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                                                        <span style={{ color: C.muted }}>Anticipo / Abono Recibido:</span>
                                                        <span style={{ fontFamily: MONO, fontSize: 14.5, fontWeight: 700, color: C.successStrong }}>
                                                            {formatCurrency(createdOrderSummary?.abono || abono)}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, paddingTop: 7, borderTop: `1px solid ${C.rowLine}` }}>
                                                        <span style={{ fontWeight: 700, color: C.ink }}>Saldo por Cobrar:</span>
                                                        <span style={{
                                                            fontFamily: DISPLAY,
                                                            fontSize: 21,
                                                            fontWeight: 900,
                                                            color: (createdOrderSummary?.saldo ?? desglose.saldo) > 0 ? C.danger : C.successStrong,
                                                        }}>
                                                            {formatCurrency(createdOrderSummary?.saldo ?? desglose.saldo)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Fecha prometida de entrega */}
                                            <div style={{ padding: '8px 12px', background: C.surfaceAlt, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11.5 }}>
                                                <span style={{ color: C.muted }}>Promesa de Entrega:</span>
                                                <span style={{ fontWeight: 700, color: C.ink }}>
                                                    📅 {new Date(createdOrderSummary?.fechaEntrega || fechaEntrega).toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Centro de Acciones Inmediatas (Impresión & WhatsApp) */}
                                    <div style={{ ...S.card, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                                            <h3 style={{ ...S.h2, fontSize: 15, margin: 0 }}>Acciones Inmediatas de Mostrador</h3>
                                            <span style={{ fontSize: 11, color: C.muted }}>Haga clic para abrir o notificar</span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                                            {/* Acción Primaria: Impresión Oficial */}
                                            {hasSriItem ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(`/#/solicitud-impresion/${createdTrabajoId}?format=a5`, '_blank')}
                                                        style={{
                                                            padding: '12px 16px',
                                                            borderRadius: 12,
                                                            background: 'linear-gradient(135deg, #0A1140 0%, #16309B 100%)',
                                                            color: '#FFFFFF',
                                                            border: '1.5px solid #FFC61A',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            boxShadow: '0 4px 14px rgba(10,17,64,0.25)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 3,
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 800, color: '#FFC61A' }}>
                                                            <span>🖨️</span> Imprimir Solicitud SRI (A5)
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#CAD5F5' }}>
                                                            Formato oficial reglamentario A5 / Medio Oficio con casillas oficiales.
                                                        </div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(`/#/solicitud-impresion/${createdTrabajoId}?mode=sri-pc`, '_blank')}
                                                        style={{
                                                            padding: '12px 16px',
                                                            borderRadius: 12,
                                                            background: C.surfaceAlt,
                                                            color: C.ink,
                                                            border: `1px solid ${C.borderStrong}`,
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 3,
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: C.royal }}>
                                                            <span>💻</span> Formato PC (Hoja A4 Doble)
                                                        </div>
                                                        <div style={{ fontSize: 11, color: C.muted }}>
                                                            Imprime 2 tickets en una hoja A4 (Copia Cliente + Copia Taller) con corte.
                                                        </div>
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(`/#/recibo-epson/${createdTrabajoId}`, '_blank')}
                                                        style={{
                                                            padding: '12px 16px',
                                                            borderRadius: 12,
                                                            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                                                            color: '#FFFFFF',
                                                            border: '1.5px solid #38BDF8',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 3,
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 800, color: '#38BDF8' }}>
                                                            <span>🧾</span> Imprimir Recibo Epson / Ticket
                                                        </div>
                                                        <div style={{ fontSize: 11, color: '#94A3B8' }}>
                                                            Ticket térmico de 80mm con desglose, abono y saldo pendiente.
                                                        </div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(`/#/orden-produccion/${createdTrabajoId}`, '_blank')}
                                                        style={{
                                                            padding: '12px 16px',
                                                            borderRadius: 12,
                                                            background: C.surfaceAlt,
                                                            color: C.ink,
                                                            border: `1px solid ${C.borderStrong}`,
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 3,
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: C.royal }}>
                                                            <span>📋</span> Orden de Taller / Producción
                                                        </div>
                                                        <div style={{ fontSize: 11, color: C.muted }}>
                                                            Hoja técnica de trabajo para prensistas, guillotinado y empaque.
                                                        </div>
                                                    </button>
                                                </>
                                            )}

                                            {/* Notificación WhatsApp */}
                                            <button
                                                type="button"
                                                onClick={handleSendWhatsAppConfirmation}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderRadius: 12,
                                                    background: '#F0FDF4',
                                                    color: '#15803D',
                                                    border: '1.5px solid #86EFAC',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 3,
                                                    position: 'relative',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#166534' }}>
                                                    <span>📱</span> {whatsAppCopied ? '¡Texto Copiado!' : 'Notificar por WhatsApp'}
                                                </div>
                                                <div style={{ fontSize: 11, color: '#16A34A' }}>
                                                    {whatsAppCopied ? 'Pegalo en el chat con tu cliente.' : 'Envía mensaje con número de orden, saldo y rastreo en vivo.'}
                                                </div>
                                            </button>

                                            {/* Si es SRI: Abrir Portal SRI */}
                                            {hasSriItem && (
                                                <button
                                                    type="button"
                                                    onClick={() => window.open('https://srienlinea.sri.gob.ec/sri-en-linea/inicio/NAT', '_blank')}
                                                    style={{
                                                        padding: '12px 16px',
                                                        borderRadius: 12,
                                                        background: '#EFF6FF',
                                                        color: '#1E40AF',
                                                        border: '1.5px solid #93C5FD',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 3,
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#1D4ED8' }}>
                                                        <span>🌐</span> Abrir Portal SRI en Línea ↗
                                                    </div>
                                                    <div style={{ fontSize: 11, color: '#3B82F6' }}>
                                                        Acceso directo para autorizar preimpresos o consultar vigencias.
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botones de Navegación del Sistema */}
                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep(1);
                                                setItems([]);
                                                setCliente(null);
                                                setTempClient({ nombre: '', telefono: '', cedula: '', regimen: 'General' });
                                                setAbono(0);
                                                setCreatedTrabajoId(null);
                                                setCreatedOrderSummary(null);
                                            }}
                                            style={{ ...S.primaryBtn, padding: '11px 22px', fontSize: 13.5 }}
                                        >
                                            ➕ Crear Otra Orden
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/trabajos')}
                                            style={{ ...S.outlineBtn, padding: '11px 22px', fontSize: 13.5 }}
                                        >
                                            📋 Ver en Cola de Trabajos →
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/dashboard')}
                                            style={{ ...S.softBtn, padding: '11px 22px', fontSize: 13.5 }}
                                        >
                                            🏠 Ir al Panel Principal
                                        </button>
                                    </div>

                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Botones de Navegación Inferior */}
                        {step < 4 && step > 1 && (
                            <div style={{ ...S.card, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <button style={S.softBtn} onClick={() => setStep(p => p - 1)}>
                                    ← Volver al paso {step - 1}
                                </button>
                                <button
                                    style={{
                                        ...S.primaryBtn,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}
                                    onClick={() => {
                                        if (step === 3) {
                                            if (!cliente && !(tempClient?.nombre || tempClient?.cedula)) {
                                                alert('Por favor selecciona o registra un cliente para continuar al paso de Pago.');
                                                return;
                                            }
                                            if (!sriEstablecimiento.trim()) setSriEstablecimiento('001');
                                            if (!sriPuntoEmision.trim()) setSriPuntoEmision('001');
                                            if (!sriActividad.trim()) setSriActividad('Comercio / Servicios General');
                                            setStep(4);
                                            return;
                                        }
                                        if (canAdvance()) setStep(p => p + 1);
                                    }}
                                >
                                    <span>Continuar al paso {step + 1}</span>
                                    <span>→</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Resumen de la Orden */}
                    {step < 5 && (
                        <div className="w-full lg:sticky lg:top-[88px]" style={{ ...S.card, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                <h3 style={{ ...S.h2, fontSize: 16, margin: 0 }}>Resumen en Vivo</h3>
                                <span style={{
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    padding: '2px 7px',
                                    borderRadius: 6,
                                    background: hasSriItem ? C.goldBg : C.chipBlue,
                                    color: hasSriItem ? C.goldTextStrong : C.royal,
                                    border: `1px solid ${hasSriItem ? C.goldBorder : C.borderStrong}`,
                                }}>
                                    {hasSriItem ? '🏛️ SRI / TAX' : '💼 COMERCIAL'}
                                </span>
                            </div>

                            {/* Badge de Tipo de Trámite en Sidebar */}
                            <div style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                ...(hasSriItem
                                    ? { background: 'linear-gradient(135deg, #0A1140 0%, #16309B 100%)', color: '#FFFFFF', border: '1px solid #FFC61A' }
                                    : { background: C.surfaceAlt, color: C.ink, border: `1px solid ${C.borderStrong}` }),
                            }}>
                                <span style={{ fontSize: 16 }}>{hasSriItem ? '🏛️' : '💼'}</span>
                                <div style={{ fontSize: 11 }}>
                                    <strong style={{ display: 'block', color: hasSriItem ? '#FFC61A' : C.royal }}>
                                        {hasSriItem ? 'Comprobante Fiscal SRI' : 'Trabajo Comercial General'}
                                    </strong>
                                    <span style={{ fontSize: 10.5, color: hasSriItem ? '#CAD5F5' : C.muted }}>
                                        {hasSriItem ? 'Requiere RUC · Exento IVA' : 'Sin trámite fiscal · +15% IVA'}
                                    </span>
                                </div>
                            </div>

                            {/* Lista de Ítems */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                                {items.length === 0 ? (
                                    <p style={{ margin: 0, fontSize: 12.5, color: C.faint, fontStyle: 'italic' }}>
                                        No hay ítems seleccionados todavía.
                                    </p>
                                ) : (
                                    items.map((item, idx) => (
                                        <div key={idx} style={{ padding: '8px 10px', background: C.surfaceAlt, border: `1px solid ${item.esSRI ? C.goldBorder : C.border}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {item.esSRI ? '🏛️ ' : '💼 '}{item.nombre}
                                                </div>
                                                <div style={{ fontSize: 10.5, color: item.esSRI ? C.goldTextStrong : C.faint, fontWeight: item.esSRI ? 700 : 500, marginTop: 1 }}>
                                                    {item.cantidad || 1} u. {item.esSRI ? '· (Exento IVA SRI)' : '· (+15% IVA)'}
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

                            {/* Badge de Documento de Salida */}
                            <div style={{
                                padding: '9px 12px',
                                borderRadius: 9,
                                background: hasSriItem ? '#FFFDF0' : '#F8FAFC',
                                border: `1px solid ${hasSriItem ? C.goldBorder : C.borderStrong}`,
                                textAlign: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                color: hasSriItem ? C.goldTextStrong : C.royal,
                            }}>
                                <span>{hasSriItem ? '📄 Documento Oficial: Solicitud SRI (A5 / Medio Oficio)' : '🧾 Documento Oficial: Recibo de Caja & Taller'}</span>
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
