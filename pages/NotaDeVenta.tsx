import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado, Regimen } from '../types';
import { formatCurrency, numeroALetras } from '../utils';
import { 
    PrinterIcon, ArrowDownTrayIcon, ArrowLeftIcon, Loader2Icon, 
    HomeIcon, AlertTriangleIcon, CheckCircleIcon, SparklesIcon, TrophyIcon, ArrowRightIcon,
    CloseIcon
} from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowSize } from 'react-use';
import { supabase } from '../services/supabase';
import { cargarHtml2Pdf } from '../services/pdfEngine';
import { mapDBTrabajo } from '../contexts/TrabajosContext';
import { 
    MODELOS, 
    GEO_NOTAVENTA160, 
    modeloDesdeQuery, 
    resolverModelo, 
    esSoloLlenado, 
    vaSobrePreimpreso, 
    type ModeloImpresion 
} from '../services/printModels';
import { CalibradorRegistro, useCalibracion } from '../components/print/CalibradorRegistro';

// El confeti solo aparece al cerrar una venta: no tiene por qué viajar en el chunk de la página.
const Confetti = React.lazy(() => import('react-confetti'));

const NotaDeVentaPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading, refreshData } = useData();

    // Mode resolution
    const modeParam = searchParams.get('mode');
    const [modelo, setModelo] = useState<ModeloImpresion>(() => 
        modeloDesdeQuery(modeParam, false, true)
    );
    const { calibracion, mover: moverRegistro, restablecer: restablecerRegistro, transform: transformCalibracionValue } = useCalibracion(modelo);
    const [mostrarGuiaFondo, setMostrarGuiaFondo] = useState(true);

    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isConsumidorFinal, setIsConsumidorFinal] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    const { width, height } = useWindowSize();
    const [isCelebrationVisible, setIsCelebrationVisible] = useState(false);

    const handleCerrar = () => {
        if (window.opener && window.history.length <= 1) {
            window.close();
        } else if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/dashboard');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCerrar();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Update model if URL changes
    useEffect(() => {
        if (modeParam) {
            setModelo(modeloDesdeQuery(modeParam, false, true));
        }
    }, [modeParam]);

    // Data fetching or fallback to direct URL query params
    useEffect(() => {
        // Fallback for direct mode without DB delay (e.g. from Chrome extension)
        if (trabajoId === 'directo' || searchParams.get('directo') === 'true') {
            const orderNum = parseInt(searchParams.get('orderNum') || '1583', 10);
            const ruc = searchParams.get('ruc') || '0702065319001';
            const name = searchParams.get('name') || 'CLIENTE MOSTRADOR';
            const doc = searchParams.get('doc') || 'Trabajo de Imprenta';
            const total = parseFloat(searchParams.get('total') || '25');
            const abono = parseFloat(searchParams.get('abono') || '25');
            const qty = parseInt(searchParams.get('qty') || searchParams.get('blocks') || '1', 10);
            const phone = searchParams.get('phone') || '';
            const address = searchParams.get('address') || 'Pasaje, El Oro';

            const dummyCliente: Cliente = {
                id: 'cli-directo',
                nombre: name,
                ruc: ruc,
                cedula: ruc,
                telefono: phone ? [phone] : [],
                direccion: address,
                email: searchParams.get('email') || '',
                creadoEn: new Date().toISOString(),
                regimen: Regimen.GENERAL,
            };

            const dummyTrabajo: Trabajo = {
                id: 'directo',
                orden: orderNum,
                clienteId: 'cli-directo',
                titular: name,
                tipo: doc,
                subtipo: searchParams.get('subtipo') || 'Confección gráfica',
                cantidad: qty,
                tamano: '1/4 Oficio',
                total: total,
                abono: abono,
                saldo: Math.max(0, total - abono),
                estado: TrabajoEstado.ENTREGADO,
                fechaEntrada: new Date().toISOString(),
                fechaEntrega: new Date().toISOString(),
                detalle: searchParams.get('detalles') || 'Nota de Venta oficial para liquidación de orden.',
                caduco: false,
                estadoClave: 'LISTA',
                imprimirClave: false,
            };

            setCliente(dummyCliente);
            setTrabajo(dummyTrabajo);
            return;
        }

        const fetchDirectly = async () => {
            if (!trabajoId) return;
            setIsRetrying(true);
            try {
                const { data: tData, error: tError } = await supabase
                    .from('trabajos')
                    .select('*')
                    .eq('id', trabajoId)
                    .single();
                
                if (tError) throw tError;
                if (tData) {
                    const mappedT = mapDBTrabajo(tData);
                    setTrabajo(mappedT);

                    const { data: cData, error: cError } = await supabase
                        .from('clientes')
                        .select('*')
                        .eq('id', mappedT.clienteId)
                        .single();
                    
                    if (!cError && cData) {
                        setCliente(cData);
                    }
                }
            } catch (err) {
                console.error("[NotaDeVenta] Error en fetch directo:", err);
                setError("No se pudo recuperar el documento desde la base de datos.");
            } finally {
                setIsRetrying(false);
            }
        };

        if (dataLoading) return;

        const currentTrabajo = trabajos.find(t => t.id === trabajoId);
        if (currentTrabajo) {
            setTrabajo(currentTrabajo);
            const foundCliente = clientes.find(c => c.id === currentTrabajo.clienteId) || null;
            if (foundCliente) {
                setCliente(foundCliente);
            } else {
                fetchDirectly();
            }
        } else {
            fetchDirectly();
        }

        // Trigger celebration if it's already delivered/finished
        if (currentTrabajo?.estado === TrabajoEstado.ENTREGADO || currentTrabajo?.saldo === 0) {
            const hasCelebrated = sessionStorage.getItem(`celebrated_${currentTrabajo.id}`);
            if (!hasCelebrated) {
                setIsCelebrationVisible(true);
                sessionStorage.setItem(`celebrated_${currentTrabajo.id}`, 'true');
            }
        }
    }, [trabajoId, searchParams, trabajos, clientes, dataLoading]);

    // Official data from physical photo: formatos/modelo nota de venta.jpeg
    const config = {
        emisorNombreComercial: 'IMPRENTA "CORDOVA"',
        emisorRazonSocial: 'Pedro Manuel Córdova Rodríguez',
        emisorRuc: '0702065319001',
        emisorEstablecimiento: '001',
        emisorPuntoEmision: '001',
        emisorDireccionMatriz: 'Colón e/ Sucre y Av. Rocafuerte, Pasaje - El Oro - Ecuador',
        emisorTelefono: '0993083943',
        emisorEmail: 'imprentacordova@gmail.com',
        autorizacionSRI: '1133208810',
        regimen: 'CONTRIBUYENTE NEGOCIO POPULAR RÉGIMEN RIMPE',
        slogan: 'El mejor servicio, al menor tiempo',
        actividad: 'ACTIVIDADES DE HOJAS IMPRESAS PARA CONFECCIONAR LIBROS, FOLLETOS, REVISTAS, CATÁLOGOS ETCÉTERA,',
        imprentaNombre: 'IMPRENTA "CORDOVA"',
        imprentaRuc: '0702065319001',
        imprentaAutorizacion: '8634',
        rangoAutorizado: 'Nº 000001301 al 000001600',
        fechaAutorizacion: '02/Enero/2026',
        fechaCaducidad: '02/Enero/2027',
    };

    const generatePDF = async () => {
        const element = document.getElementById('nota-venta-sheet');
        if (!element || !trabajo || !cliente) return;

        setIsGenerating(true);
        
        // Exact Medio Oficio size: 160 mm x 220 mm
        const opt = {
            margin: 0,
            filename: `NotaVenta-${String(trabajo.orden).padStart(6,'0')}-${cliente.nombre.split(' ')[0]}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { 
                scale: 2.5,
                useCORS: true, 
                letterRendering: true,
                scrollY: 0,
                logging: false
            },
            jsPDF: { 
                unit: 'mm', 
                format: [160, 220] as [number, number], 
                orientation: 'portrait' as const,
                compress: true
            }
        };

        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            const html2pdf = await cargarHtml2Pdf();
            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("Error generando PDF", error);
            alert("Hubo un error al generar el PDF. El sistema abrirá la ventana de impresión.");
            window.print();
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShareWhatsApp = () => {
        if (!trabajo || !cliente) return;
        const phone = cliente.telefono?.[0] ? cliente.telefono[0].replace(/\D/g, '') : '';
        const trackingUrl = `https://www.imprentacordova.net/tracking?orden=${trabajo.orden}`;
        const mensaje = encodeURIComponent(
            `*IMPRENTA CÓRDOVA — NOTA DE VENTA FISCAL*\n\n` +
            `Estimado(a) *${cliente.nombre}*:\n` +
            `Le compartimos la información de su Nota de Venta emitida:\n\n` +
            `📄 *Nota de Venta:* 001-001-${String(trabajo.orden).padStart(8, '0')}\n` +
            `📦 *Trabajo:* ${trabajo.tipo} ${trabajo.subtipo ? `(${trabajo.subtipo})` : ''}\n` +
            `🔢 *Cantidad:* ${trabajo.cantidad}\n` +
            `💵 *Total:* ${formatCurrency(trabajo.total)}\n` +
            `✅ *Estado:* Cancelado / Entregado\n\n` +
            `🔍 *Consulte o verifique su orden aquí:*\n${trackingUrl}\n\n` +
            `¡Gracias por confiar en Imprenta Córdova!`
        );
        window.open(`https://wa.me/${phone ? `593${phone.replace(/^0/, '')}` : ''}?text=${mensaje}`, '_blank');
    };

    if (dataLoading || (isRetrying && !trabajo)) return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 border-4 border-white/[0.06] border-t-brand-blue rounded-full animate-spin mb-6 shadow-sm"></div>
            <h2 className="text-xl font-black text-white uppercase tracking-[0.3em] mb-2">Cargando Nota de Venta</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Sincronizando registros fiscales...</p>
        </div>
    );

    if (!trabajo || !cliente) return (
        <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-center">
            <div className="p-8 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 mb-8 max-w-md shadow-2xl">
                <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Documento No Encontrado</h2>
                <p className="text-slate-400 font-bold text-xs leading-relaxed">
                    {error || "La orden solicitada no existe o no ha sido sincronizada en el sistema."}
                </p>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10 transition-all"
                >
                    Regresar
                </button>
                <button 
                    onClick={() => refreshData()}
                    className="px-8 py-3 bg-brand-blue rounded-xl text-xs font-bold text-white hover:bg-blue-600 transition-all shadow-lg"
                >
                    Reintentar
                </button>
            </div>
        </div>
    );

    const now = new Date();
    const diaStr = String(now.getDate()).padStart(2, '0');
    const mesStr = String(now.getMonth() + 1).padStart(2, '0');
    const anoStr = String(now.getFullYear());
    const fechaLarga = now.toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });

    const secuencial8 = String(trabajo.orden).padStart(8, '0');
    const clienteNombre = isConsumidorFinal ? 'CONSUMIDOR FINAL' : cliente.nombre.toUpperCase();
    const clienteId = isConsumidorFinal ? '9999999999999' : (cliente.ruc || cliente.cedula || '9999999999999');
    const clienteDir = isConsumidorFinal ? 'CIUDAD' : (cliente.direccion || 'Pasaje, El Oro').toUpperCase();

    const unitPrice = trabajo.cantidad > 0 ? (trabajo.total / trabajo.cantidad) : trabajo.total;
    const trackingQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`https://www.imprentacordova.net/tracking?orden=${trabajo.orden}`)}`;

    return (
        <div className="bg-slate-900 min-h-screen py-6 flex flex-col items-center justify-start overflow-y-auto font-sans">
            
            {/* CELEBRATION MODAL AL COMPLETAR */}
            <AnimatePresence>
                {isCelebrationVisible && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/95 backdrop-blur-2xl"
                    >
                        <React.Suspense fallback={null}><Confetti width={width} height={height} recycle={false} numberOfPieces={450} colors={['#3B82F6', '#1E293B', '#10B981', '#F59E0B']} /></React.Suspense>
                        
                        <motion.div 
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="max-w-xl w-full bg-slate-900 border border-white/10 p-10 rounded-[3rem] shadow-2xl text-center relative overflow-hidden"
                        >
                            <div className="w-24 h-24 bg-brand-blue rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30">
                                <TrophyIcon className="w-12 h-12 text-white" />
                            </div>

                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                                ¡TRANSACCIÓN CERRADA!
                            </h2>
                            <p className="text-slate-400 font-bold text-xs mb-8 max-w-sm mx-auto">
                                Pedido liquidado con éxito. Nota de Venta lista para entrega física o respaldo digital.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Orden Nº</p>
                                    <p className="text-xl font-black text-white">#{trabajo.orden}</p>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Total Liquidado</p>
                                    <p className="text-xl font-black text-emerald-400">{formatCurrency(trabajo.total)}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-center">
                                <button 
                                    onClick={() => setIsCelebrationVisible(false)}
                                    className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-bold text-xs text-white transition-all"
                                >
                                    Ver Comprobante
                                </button>
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="px-6 py-3 bg-brand-blue hover:bg-blue-600 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg"
                                >
                                    Ir al Dashboard <ArrowRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTÓN FLOTANTE RÁPIDO PARA CERRAR VISTA (SIEMPRE ACCESIBLE AL HACER SCROLL) */}
            <div className="fixed top-4 right-4 z-[999] no-print">
                <button
                    onClick={handleCerrar}
                    className="px-3.5 py-2 rounded-xl bg-[#0A1140]/90 hover:bg-red-600 text-white font-bold text-xs shadow-xl backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Cerrar vista de comprobante (Esc)"
                    aria-label="Cerrar vista de comprobante"
                >
                    <CloseIcon className="w-3.5 h-3.5" />
                    <span>Cerrar</span>
                    <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] bg-white/20 rounded font-mono">Esc</kbd>
                </button>
            </div>

            {/* TOP BAR / CONTROLES */}
            <div className="w-full max-w-[210mm] flex flex-wrap justify-between items-center mb-6 no-print px-6 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-md gap-3">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleCerrar} 
                        className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        title="Cerrar comprobante (Esc)"
                    >
                        <CloseIcon className="w-3.5 h-3.5" /> Cerrar
                    </button>
                    <button 
                        onClick={() => navigate('/dashboard')} 
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                        <HomeIcon className="w-3.5 h-3.5" /> Dashboard
                    </button>
                </div>

                {/* TABS DE LAS 3 VERSIONES */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
                    <button
                        onClick={() => setModelo('nota-sobre-preimpreso')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                            modelo === 'nota-sobre-preimpreso'
                                ? 'bg-[#0f2b48] text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Para imprimir sobre los blocks físicos ya existentes de la imprenta"
                    >
                        <span>📄</span>
                        <span>1. Sobre Preimpreso</span>
                        <span className="text-[10px] font-normal opacity-80 bg-white/20 px-1.5 py-0.2 rounded-full">Solo datos</span>
                    </button>
                    <button
                        onClick={() => setModelo('nota-arte-completo')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                            modelo === 'nota-arte-completo'
                                ? 'bg-[#0f2b48] text-white shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Formato clásico completo idéntico al offset para hoja en blanco"
                    >
                        <span>🏛️</span>
                        <span>2. Clásico Completo</span>
                        <span className="text-[10px] font-normal opacity-80 bg-white/20 px-1.5 py-0.2 rounded-full">Hoja blanca</span>
                    </button>
                    <button
                        onClick={() => setModelo('nota-moderna')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                            modelo === 'nota-moderna'
                                ? 'bg-gradient-to-r from-[#0f2b48] to-[#1e3a8a] text-[#FFC61A] shadow-sm border border-[#FFC61A]/40'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Evolución moderna ejecutiva con QR dinámico y estilo suizo"
                    >
                        <span>💎</span>
                        <span>3. Evolución Moderna</span>
                        <span className="text-[10px] font-extrabold text-[#FFC61A] bg-black/30 px-1.5 py-0.2 rounded-full">Con QR</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {/* Toggle Guía Fondo (solo en modo sobre preimpreso) */}
                    {modelo === 'nota-sobre-preimpreso' && (
                        <button
                            onClick={() => setMostrarGuiaFondo(!mostrarGuiaFondo)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                mostrarGuiaFondo 
                                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                            title="Muestra u oculta la foto del talonario de fondo en pantalla (no se imprime)"
                        >
                            👁️ Guía Fondo: {mostrarGuiaFondo ? 'ON' : 'OFF'}
                        </button>
                    )}

                    <button 
                        onClick={() => setIsConsumidorFinal(!isConsumidorFinal)} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            isConsumidorFinal 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                    >
                        {isConsumidorFinal ? 'Cliente Real' : 'Consumidor Final'}
                    </button>

                    <button
                        onClick={handleShareWhatsApp}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        title="Compartir comprobante por WhatsApp"
                    >
                        📱 WhatsApp
                    </button>

                    <button 
                        onClick={generatePDF} 
                        disabled={isGenerating}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2Icon className="w-3.5 h-3.5 animate-spin"/> : <ArrowDownTrayIcon className="w-3.5 h-3.5"/>}
                        PDF
                    </button>

                    <button 
                        onClick={() => window.print()} 
                        className="px-4 py-1.5 rounded-lg bg-[#0f2b48] hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                    >
                        <PrinterIcon className="w-3.5 h-3.5"/> Imprimir
                    </button>
                </div>
            </div>

            {/* PANEL DE CALIBRACIÓN DE REGISTRO MECÁNICO (no se imprime) */}
            <CalibradorRegistro
                modelo={modelo}
                nombreModelo={MODELOS[modelo]?.label || 'Nota de Venta'}
                calibracion={calibracion}
                onMover={moverRegistro}
                onRestablecer={restablecerRegistro}
                maxWidth="160mm"
            />

            {/* HOJA DE DOCUMENTO — MEDIO OFICIO (160 × 220 mm) */}
            <div
                id="nota-venta-sheet"
                data-modelo={modelo}
                className="bg-white relative shadow-2xl text-slate-900 overflow-hidden box-border"
                style={{
                    width: '160mm',
                    height: '220mm',
                    minWidth: '160mm',
                    minHeight: '220mm',
                    maxWidth: '160mm',
                    maxHeight: '220mm',
                    margin: '0 auto',
                    position: 'relative',
                    transform: transformCalibracionValue,
                }}
            >
                {/* ESTILOS DE IMPRESIÓN EMBEBIDOS */}
                <style>{`
                    @page {
                        size: 160mm 220mm;
                        margin: 0;
                    }
                    @media print {
                        body {
                            background: white !important;
                            padding: 0 !important;
                            margin: 0 !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                        #nota-venta-sheet {
                            width: 160mm !important;
                            height: 220mm !important;
                            box-shadow: none !important;
                            margin: 0 !important;
                        }
                        .guia-fondo-nota {
                            display: none !important;
                            opacity: 0 !important;
                            visibility: hidden !important;
                        }
                    }
                `}</style>

                {/* =========================================================================
                    VERSIÓN 1: SOBRE PREIMPRESO (SOLO VARIABLES SOBRE TALONARIOS FÍSICOS)
                   ========================================================================= */}
                {modelo === 'nota-sobre-preimpreso' && (
                    <div className="w-full h-full relative" style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}>
                        
                        {/* GUÍA DE FONDO (FOTO DEL TALONARIO PARA VER EL CALCE) */}
                        {mostrarGuiaFondo && (
                            <div 
                                className="guia-fondo-nota absolute inset-0 pointer-events-none z-0 overflow-hidden"
                                style={{
                                    backgroundImage: `url('/assets/formatos/modelo nota de venta.jpeg')`,
                                    backgroundSize: '100% 100%',
                                    backgroundRepeat: 'no-repeat',
                                    opacity: 0.35,
                                    filter: 'contrast(1.1)'
                                }}
                            />
                        )}

                        {/* FECHA: DÍA, MES, AÑO */}
                        <div 
                            className="absolute font-bold text-slate-900 text-[12px] tracking-widest text-center"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.fecha.diaX}%`, 
                                top: `${GEO_NOTAVENTA160.fecha.y}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '22px'
                            }}
                        >
                            {diaStr}
                        </div>
                        <div 
                            className="absolute font-bold text-slate-900 text-[12px] tracking-widest text-center"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.fecha.mesX}%`, 
                                top: `${GEO_NOTAVENTA160.fecha.y}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '22px'
                            }}
                        >
                            {mesStr}
                        </div>
                        <div 
                            className="absolute font-bold text-slate-900 text-[12px] tracking-widest text-center"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.fecha.anoX}%`, 
                                top: `${GEO_NOTAVENTA160.fecha.y}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '28px'
                            }}
                        >
                            {anoStr}
                        </div>

                        {/* LUGAR */}
                        <div 
                            className="absolute font-bold text-slate-900 text-[11px] uppercase tracking-wider"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.lugar.x}%`, 
                                top: `${GEO_NOTAVENTA160.lugar.y}%`,
                                transform: 'translateY(-50%)'
                            }}
                        >
                            Pasaje
                        </div>

                        {/* DATOS DEL CLIENTE */}
                        <div 
                            className="absolute font-black text-slate-900 text-[11.5px] uppercase tracking-wide truncate"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.cliente.srX}%`, 
                                top: `${GEO_NOTAVENTA160.cliente.srY}%`,
                                transform: 'translateY(-50%)',
                                maxWidth: '48%'
                            }}
                        >
                            {clienteNombre}
                        </div>
                        <div 
                            className="absolute font-bold text-slate-900 text-[11px] uppercase tracking-wide truncate"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.cliente.dirX}%`, 
                                top: `${GEO_NOTAVENTA160.cliente.dirY}%`,
                                transform: 'translateY(-50%)',
                                maxWidth: '46%'
                            }}
                        >
                            {clienteDir}
                        </div>
                        <div 
                            className="absolute font-mono font-bold text-slate-900 text-[12px] tracking-widest"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.cliente.rucCiX}%`, 
                                top: `${GEO_NOTAVENTA160.cliente.rucCiY}%`,
                                transform: 'translateY(-50%)'
                            }}
                        >
                            {clienteId}
                        </div>

                        {/* FILAS DE LA TABLA: FILA 1 */}
                        <div 
                            className="absolute font-bold text-slate-900 text-[12px] text-center"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.tabla.cantX}%`, 
                                top: `${GEO_NOTAVENTA160.tabla.startY}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {trabajo.cantidad}
                        </div>
                        <div 
                            className="absolute font-black text-slate-900 text-[11px] uppercase tracking-wide"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.tabla.descX}%`, 
                                top: `${GEO_NOTAVENTA160.tabla.startY}%`,
                                transform: 'translateY(-50%)',
                                maxWidth: '48%'
                            }}
                        >
                            {trabajo.tipo} {trabajo.subtipo ? `— ${trabajo.subtipo}` : ''}
                        </div>
                        <div 
                            className="absolute font-mono font-bold text-slate-900 text-[11.5px] text-right"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.tabla.pUnitX}%`, 
                                top: `${GEO_NOTAVENTA160.tabla.startY}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {unitPrice.toFixed(2)}
                        </div>
                        <div 
                            className="absolute font-mono font-black text-slate-900 text-[12px] text-right"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.tabla.totalX}%`, 
                                top: `${GEO_NOTAVENTA160.tabla.startY}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {trabajo.total.toFixed(2)}
                        </div>

                        {/* TOTAL A COBRAR $ */}
                        <div 
                            className="absolute font-mono font-black text-slate-900 text-[15px] tracking-wider text-right"
                            style={{ 
                                left: `${GEO_NOTAVENTA160.totalCobrar.x}%`, 
                                top: `${GEO_NOTAVENTA160.totalCobrar.y}%`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            ${trabajo.total.toFixed(2)}
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    VERSIÓN 2: CLÁSICO COMPLETO (REPRODUCCIÓN OFFSET TAL CUAL EL TALONARIO)
                   ========================================================================= */}
                {modelo === 'nota-arte-completo' && (
                    <div 
                        className="w-full h-full p-[6mm] flex flex-col justify-between box-border border-2 border-[#003399] relative"
                        style={{ fontFamily: "'Times New Roman', Times, serif" }}
                    >
                        {/* MARCA DE AGUA CENTRAL CON RODILLOS DE IMPRENTA */}
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-10 z-0">
                            <div className="w-52 h-52 border-8 border-[#003399] rounded-[2rem] flex items-center justify-center">
                                <span className="text-[120px] font-black text-[#003399]">IC</span>
                            </div>
                            <p className="text-[26px] italic font-bold text-[#003399] mt-2 tracking-widest">
                                Calidad de Impresión
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-col h-full justify-between">
                            
                            {/* BLOQUE SUPERIOR: CABECERA */}
                            <div>
                                <div className="flex justify-between items-start gap-2">
                                    
                                    {/* IZQUIERDA: LOGO + DATOS EMISOR */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-12 h-12 bg-[#003399] rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-sm">
                                                IC
                                            </div>
                                            <div>
                                                <h1 className="text-xl font-black text-[#003399] tracking-tight leading-none">
                                                    IMPRENTA "CORDOVA"
                                                </h1>
                                                <p className="text-[6.5px] font-bold text-slate-700 leading-tight mt-0.5">
                                                    {config.actividad}
                                                </p>
                                                <p className="text-[9px] italic text-[#003399] font-bold">
                                                    "{config.slogan}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-[#003399] text-white text-center py-0.5 px-2 rounded font-bold text-[10px] tracking-wide mb-1">
                                            {config.emisorRazonSocial}
                                        </div>

                                        <div className="text-[7.5px] bg-[#002266] text-white py-0.5 px-2 rounded flex justify-between items-center font-sans font-bold">
                                            <span>📍 {config.emisorDireccionMatriz.split(',')[0]}</span>
                                            <span>📞 {config.emisorTelefono}</span>
                                            <span>✉️ {config.emisorEmail}</span>
                                        </div>

                                        <div className="flex items-center justify-between mt-1 text-[8px] font-bold">
                                            <span className="bg-[#003399] text-white px-2 py-0.5 rounded-full text-[7px]">
                                                AUTORIZADOS POR EL SRI
                                            </span>
                                            <span className="text-slate-800">PASAJE - EL ORO - ECUADOR</span>
                                        </div>
                                        <p className="text-[7.5px] font-bold text-center text-[#003399] uppercase tracking-wider mt-0.5">
                                            "{config.regimen}"
                                        </p>
                                    </div>

                                    {/* DERECHA: RECUADRO FISCAL + FECHA */}
                                    <div className="w-[50mm] flex flex-col gap-1">
                                        <div className="border-2 border-[#003399] rounded-lg text-center overflow-hidden">
                                            <div className="text-[9.5px] font-bold py-0.5 bg-slate-50">
                                                R.U.C. {config.emisorRuc}
                                            </div>
                                            <div className="bg-[#003399] text-white font-black text-[12px] py-0.5 tracking-wider">
                                                NOTA DE VENTA
                                            </div>
                                            <div className="text-[8.5px] font-bold py-0.5 text-slate-700">
                                                SERIE: {config.emisorEstablecimiento}-{config.emisorPuntoEmision}
                                            </div>
                                            <div className="text-[13px] font-mono font-black text-red-600 tracking-widest py-0.5 border-t border-slate-200">
                                                N° {secuencial8}
                                            </div>
                                        </div>

                                        <div className="bg-[#003399] text-white text-center text-[7.5px] font-bold py-0.5 rounded">
                                            AUTORIZACIÓN S.R.I. N°. {config.autorizacionSRI}
                                        </div>

                                        {/* CUADRÍCULA FECHA */}
                                        <div className="border border-[#003399] rounded overflow-hidden">
                                            <div className="grid grid-cols-3 text-center bg-[#003399] text-white text-[7px] font-bold py-0.5">
                                                <span>DIA</span>
                                                <span className="border-x border-white/40">MES</span>
                                                <span>AÑO</span>
                                            </div>
                                            <div className="grid grid-cols-3 text-center text-[10px] font-mono font-bold py-1 bg-white">
                                                <span>{diaStr}</span>
                                                <span className="border-x border-slate-300">{mesStr}</span>
                                                <span>{anoStr}</span>
                                            </div>
                                            <div className="border-t border-[#003399] px-2 py-0.5 text-[7.5px] flex justify-between bg-slate-50">
                                                <span className="font-bold">LUGAR:</span>
                                                <span className="font-black text-slate-900">Pasaje</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RENGLONES DEL CLIENTE */}
                                <div className="mt-2 text-[9px] space-y-1">
                                    <div className="flex items-end">
                                        <span className="font-bold italic text-slate-900 w-14">Sr. (s):</span>
                                        <span className="flex-1 border-b border-dotted border-slate-800 font-bold px-1 uppercase text-slate-900">
                                            {clienteNombre}
                                        </span>
                                    </div>
                                    <div className="flex items-end">
                                        <span className="font-bold italic text-slate-900 w-14">Dirección:</span>
                                        <span className="flex-1 border-b border-dotted border-slate-800 font-bold px-1 uppercase text-slate-900 truncate">
                                            {clienteDir}
                                        </span>
                                    </div>
                                    <div className="flex items-end">
                                        <span className="font-bold italic text-slate-900 w-14">RUC:/CI. #:</span>
                                        <span className="flex-1 border-b border-dotted border-slate-800 font-mono font-bold px-1 text-slate-900">
                                            {clienteId}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* CUERPO: TABLA DE 16 RENGLONES */}
                            <div className="my-2 border border-[#003399] rounded overflow-hidden flex-1 flex flex-col justify-between">
                                <table className="w-full border-collapse text-[8.5px]">
                                    <thead>
                                        <tr className="bg-[#003399] text-white text-center font-bold">
                                            <th className="py-1 px-1 border-r border-white/40 w-[12%]">CANT.</th>
                                            <th className="py-1 px-2 border-r border-white/40 w-[58%]">D E S C R I P C I Ó N</th>
                                            <th className="py-1 px-1 border-r border-white/40 w-[15%]">P. UNITARIO</th>
                                            <th className="py-1 px-1 w-[15%]">PRECIO TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Fila 1 con datos reales */}
                                        <tr className="border-b border-[#003399]/40 font-bold">
                                            <td className="py-1 px-1 text-center border-r border-[#003399]/40">{trabajo.cantidad}</td>
                                            <td className="py-1 px-2 border-r border-[#003399]/40 uppercase font-sans text-[8px]">
                                                {trabajo.tipo} {trabajo.subtipo ? `— ${trabajo.subtipo}` : ''}
                                            </td>
                                            <td className="py-1 px-1 text-right border-r border-[#003399]/40 font-mono">{unitPrice.toFixed(2)}</td>
                                            <td className="py-1 px-1 text-right font-mono font-black text-slate-900">{trabajo.total.toFixed(2)}</td>
                                        </tr>
                                        {/* Filas 2 a 16 vacías para completar el block */}
                                        {[...Array(14)].map((_, i) => (
                                            <tr key={i} className="border-b border-[#003399]/20 h-[5.2mm]">
                                                <td className="border-r border-[#003399]/40">&nbsp;</td>
                                                <td className="border-r border-[#003399]/40">&nbsp;</td>
                                                <td className="border-r border-[#003399]/40">&nbsp;</td>
                                                <td>&nbsp;</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* PIE: IMPRENTA AUTORIZADA + TOTAL + FIRMAS */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-[6.5px] text-slate-700 leading-tight">
                                        <p className="font-bold text-[#003399]">
                                            IMPRENTA "CORDOVA" • DIERC.: COLÓN Y SUCRE E/ AV. ROCAFUERTE 📞 0993083943
                                        </p>
                                        <p>
                                            Pedro Manuel Córdova Rodríguez • RUC: 0702065319001 - Nº. Aut. {config.imprentaAutorizacion}
                                        </p>
                                        <p className="font-bold text-slate-900">
                                            {config.rangoAutorizado} - Fecha de Autorización: {config.fechaAutorizacion}
                                        </p>
                                    </div>

                                    {/* BOTÓN TOTAL A COBRAR */}
                                    <div className="flex items-center border-2 border-[#003399] rounded overflow-hidden">
                                        <div className="bg-[#003399] text-white font-black text-[9px] px-2 py-1 tracking-wider">
                                            TOTAL A COBRAR $
                                        </div>
                                        <div className="px-3 py-1 font-mono font-black text-[13px] text-slate-900 bg-white">
                                            ${trabajo.total.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                {/* FIRMAS */}
                                <div className="grid grid-cols-2 gap-8 text-center text-[7.5px] font-bold text-slate-700 pt-2 border-t border-slate-300">
                                    <div>
                                        <p className="border-b border-dotted border-slate-900 w-3/4 mx-auto mb-1">&nbsp;</p>
                                        <p>RECIBÍ CONFORME</p>
                                    </div>
                                    <div>
                                        <p className="border-b border-dotted border-slate-900 w-3/4 mx-auto mb-1">&nbsp;</p>
                                        <p>ENTREGUE CONFORME</p>
                                    </div>
                                </div>

                                <div className="text-center mt-1 text-[7px] font-bold text-[#003399]">
                                    Fecha de Caducidad: {config.fechaCaducidad}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* =========================================================================
                    VERSIÓN 3: EVOLUCIÓN MODERNA FULL PRO (SWISS MINIMALIST & QR DINÁMICO)
                   ========================================================================= */}
                {modelo === 'nota-moderna' && (
                    <div 
                        className="w-full h-full p-[8mm] flex flex-col justify-between box-border bg-white"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                        {/* HEADER MODERNO */}
                        <div>
                            <div className="flex justify-between items-start pb-4 border-b-2 border-[#0f2b48]">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-lg bg-[#0f2b48] text-white flex items-center justify-center font-black text-sm">
                                            IC
                                        </div>
                                        <div>
                                            <h1 className="text-base font-black text-[#0f2b48] tracking-tight uppercase leading-none">
                                                IMPRENTA CÓRDOVA
                                            </h1>
                                            <p className="text-[8px] font-extrabold text-amber-600 uppercase tracking-widest mt-0.5">
                                                {config.regimen}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-[7.5px] text-slate-600 space-y-0.5 font-medium">
                                        <p className="font-bold text-slate-900">{config.emisorRazonSocial} • RUC {config.emisorRuc}</p>
                                        <p>📍 {config.emisorDireccionMatriz}</p>
                                        <p>📞 {config.emisorTelefono} • ✉️ {config.emisorEmail}</p>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col items-end">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[8px] border border-emerald-200 uppercase tracking-wider mb-1">
                                        ✓ COMPROBANTE LIQUIDADO
                                    </span>
                                    <div className="bg-[#0f2b48] text-white px-3 py-1 rounded-lg text-right">
                                        <p className="text-[7px] text-slate-300 font-bold uppercase tracking-wider">NOTA DE VENTA</p>
                                        <p className="text-[13px] font-mono font-black tracking-widest leading-none">
                                            001-001-{secuencial8}
                                        </p>
                                    </div>
                                    <p className="text-[6.5px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                        AUT. SRI: {config.autorizacionSRI}
                                    </p>
                                </div>
                            </div>

                            {/* TARJETA DATOS CLIENTE */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 my-3 text-[8.5px]">
                                <div className="grid grid-cols-12 gap-y-1.5">
                                    <div className="col-span-2 text-slate-500 font-bold uppercase">Cliente:</div>
                                    <div className="col-span-10 font-black text-slate-900 uppercase truncate">{clienteNombre}</div>

                                    <div className="col-span-2 text-slate-500 font-bold uppercase">RUC / C.I.:</div>
                                    <div className="col-span-4 font-mono font-bold text-slate-900">{clienteId}</div>

                                    <div className="col-span-2 text-slate-500 font-bold uppercase text-right pr-2">Fecha:</div>
                                    <div className="col-span-4 font-bold text-slate-900">{fechaLarga}</div>

                                    <div className="col-span-2 text-slate-500 font-bold uppercase">Dirección:</div>
                                    <div className="col-span-10 text-slate-700 font-medium uppercase truncate">{clienteDir}</div>
                                </div>
                            </div>

                            {/* TABLA DE ÍTEMS */}
                            <table className="w-full text-left border-collapse text-[8.5px]">
                                <thead>
                                    <tr className="bg-[#0f2b48] text-white">
                                        <th className="py-2 px-2 font-bold w-[12%] text-center rounded-l-lg">CANT.</th>
                                        <th className="py-2 px-3 font-bold w-[58%]">DESCRIPCIÓN DEL SERVICIO GRÁFICO</th>
                                        <th className="py-2 px-2 font-bold w-[15%] text-right">P. UNIT</th>
                                        <th className="py-2 px-3 font-bold w-[15%] text-right rounded-r-lg">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-2.5 px-2 text-center font-bold text-slate-900 align-top">{trabajo.cantidad}</td>
                                        <td className="py-2.5 px-3 align-top">
                                            <p className="font-black text-slate-900 uppercase text-[9px]">{trabajo.tipo}</p>
                                            {trabajo.subtipo && (
                                                <p className="text-[7.5px] text-slate-500 font-medium mt-0.5">{trabajo.subtipo}</p>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-700 align-top">
                                            {formatCurrency(unitPrice)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 align-top">
                                            {formatCurrency(trabajo.total)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* RESUMEN FINANCIERO & QR */}
                        <div>
                            <div className="flex justify-between items-center py-3 border-y border-slate-200 my-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={trackingQrUrl} 
                                        alt="QR Tracking" 
                                        className="w-14 h-14 border border-slate-200 rounded-lg p-0.5 bg-white shadow-sm"
                                    />
                                    <div className="text-[7px] text-slate-500 leading-tight">
                                        <p className="font-extrabold text-[#0f2b48] uppercase tracking-wider">Validación Digital</p>
                                        <p>Escanee para consultar estado de producción y garantía de entrega en línea.</p>
                                        <p className="font-mono text-slate-400 mt-0.5">orden #{trabajo.orden}</p>
                                    </div>
                                </div>

                                {/* 3 TARJETAS KPI */}
                                <div className="flex gap-2 text-right">
                                    <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                                        <p className="text-[6.5px] font-bold text-slate-400 uppercase">Subtotal (0% IVA)</p>
                                        <p className="text-[11px] font-mono font-bold text-slate-800">{formatCurrency(trabajo.total)}</p>
                                    </div>
                                    <div className="bg-[#0f2b48] text-white px-4 py-1.5 rounded-lg shadow-sm">
                                        <p className="text-[6.5px] font-bold text-slate-300 uppercase tracking-wider">TOTAL A COBRAR</p>
                                        <p className="text-[14px] font-mono font-black">{formatCurrency(trabajo.total)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* TOTAL EN LETRAS */}
                            <div className="text-[7.5px] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 mb-3 flex items-center justify-between">
                                <span className="font-bold text-slate-500 uppercase">Son:</span>
                                <span className="font-extrabold text-slate-900 uppercase">{numeroALetras(trabajo.total)}</span>
                            </div>

                            {/* FIRMAS INSTITUCIONALES */}
                            <div className="grid grid-cols-2 gap-6 pt-3 text-center text-[7.5px]">
                                <div>
                                    <div className="border-b border-slate-300 w-3/4 mx-auto mb-1"></div>
                                    <p className="font-extrabold text-slate-900 uppercase">Pedro M. Córdova R.</p>
                                    <p className="text-slate-400 font-bold uppercase text-[6.5px]">Imprenta Córdova — Emisor</p>
                                </div>
                                <div>
                                    <div className="border-b border-slate-300 w-3/4 mx-auto mb-1"></div>
                                    <p className="font-extrabold text-slate-900 uppercase">{clienteNombre}</p>
                                    <p className="text-slate-400 font-bold uppercase text-[6.5px]">Recibí Conforme — Cliente</p>
                                </div>
                            </div>

                            {/* PIE LEGAL */}
                            <div className="text-center text-[6px] text-slate-400 font-medium pt-3 mt-2 border-t border-slate-100">
                                <p>
                                    {config.imprentaNombre} • RUC {config.imprentaRuc} • Aut. SRI {config.imprentaAutorizacion} • Válido para emisión hasta {config.fechaCaducidad}
                                </p>
                                <p className="font-bold text-slate-500 mt-0.5">
                                    Original: Adquirente / Copia: Emisor
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotaDeVentaPage;
