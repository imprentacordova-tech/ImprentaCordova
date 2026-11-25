import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, Regimen } from '../types';
import {
    PrinterIcon, ArrowLeftIcon, ArrowDownTrayIcon,
    WhatsAppIcon, Loader2Icon,
    CordovaLogo, CloseIcon
} from '../components/Icons';
import { cargarHtml2Pdf } from '../services/pdfEngine';
import { supabase } from '../services/supabase';
import { mapDBTrabajo } from '../contexts/TrabajosContext';
import { mapDBCliente } from '../contexts/ClientesContext';
import { 
    MODELOS, 
    GEO_COMERCIAL160, 
    resolverModelo, 
    type ModeloImpresion 
} from '../services/printModels';
import { CalibradorRegistro, useCalibracion } from '../components/print/CalibradorRegistro';

// ── UTILERÍAS MONETARIAS Y NÚMEROS A LETRAS (ECUADOR) ────────────────────────
const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export const numeroALetras = (monto: number): string => {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE'];
    const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const centenas = ['', 'CIEN', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    const num = Math.floor(Math.abs(monto));
    const centavos = Math.round((Math.abs(monto) - num) * 100);
    const centavosStr = String(centavos).padStart(2, '0') + '/100 DÓLARES';

    if (num === 0) return `CERO CON ${centavosStr}`;

    const convertirGrupo = (n: number): string => {
        let output = '';
        const c = Math.floor(n / 100);
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (c > 0) {
            if (c === 1 && (d > 0 || u > 0)) output += 'CIENTO ';
            else output += centenas[c] + ' ';
        }

        const du = n % 100;
        if (du >= 10 && du <= 20) {
            output += especiales[du - 10] + ' ';
        } else if (du > 20 && du < 30) {
            output += 'VEINTI' + unidades[u] + ' ';
        } else {
            if (d > 0) output += decenas[d] + (u > 0 ? ' Y ' : ' ');
            if (u > 0) output += unidades[u] + ' ';
        }

        return output.trim();
    };

    let letras = '';
    const miles = Math.floor(num / 1000);
    const resto = num % 1000;

    if (miles > 0) {
        if (miles === 1) letras += 'MIL ';
        else letras += convertirGrupo(miles) + ' MIL ';
    }
    if (resto > 0) {
        letras += convertirGrupo(resto) + ' ';
    }

    return `${letras.trim()} CON ${centavosStr}`;
};

const generateWhatsAppLink = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('593') ? cleanPhone : `593${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * ReciboEpson / ReciboComercial — Sistema Oficial de Comprobantes de Trabajo NO SRI
 * Soporta los 3 modelos para 1/4 de Oficio (160 × 110 mm) y la versión Continua Epson.
 */
const ReciboEpson: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading } = useData();

    // Estado reactivo del modelo seleccionado
    const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const [modelo, setModelo] = useState<ModeloImpresion>(() => {
        const mode = queryParams.get('mode');
        if (mode === 'epson-continuo') return 'comercial-recibo';
        return resolverModelo(null, mode, false);
    });

    // Sub-modo especial para epson continuo
    const [esModoContinuo, setEsModoContinuo] = useState<boolean>(() => {
        return queryParams.get('mode') === 'epson-continuo';
    });

    // Sub-modo de continuo: 'matricial' (alto contraste / cinta) o 'ecotank' (color / láser)
    const [subModoContinuo, setSubModoContinuo] = useState<'matricial' | 'ecotank'>('matricial');
    // Tipo de copias en continuo: 'doble' (Cliente + Taller) | 'cliente' (2x Cliente) | 'taller' (2x Taller)
    const [copiasContinuo, setCopiasContinuo] = useState<'doble' | 'cliente' | 'taller'>('doble');
    // Tractor feed perforaciones laterales visuales
    const [mostrarTractorFeed, setMostrarTractorFeed] = useState<boolean>(true);

    const { calibracion, mover: moverRegistro, restablecer: restablecerRegistro, transform: transformCalibracionValue } = useCalibracion(modelo);

    // Control de guía visual de fondo (marca de agua del talonario preimpreso)
    const [mostrarGuiaVisual, setMostrarGuiaVisual] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isConsumidorFinal, setIsConsumidorFinal] = useState<boolean>(false);

    // Trabajo y cliente cargados desde BD o por URL (fallback directo)
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    /** Buscando la orden directo en la base (no estaba en la lista cargada). */
    const [buscandoEnBase, setBuscandoEnBase] = useState(false);

    useEffect(() => {
        // 1. Caso directo por parámetros URL (extensión de Chrome: /recibo-epson/directo?...).
        //    Antes también entraba acá cualquier id que no estuviera en la lista cargada,
        //    y se imprimía un recibo INVENTADO (#000001, CONSUMIDOR FINAL, $0.00) sin aviso.
        if (trabajoId === 'directo') {
            const rawTotal = parseFloat(queryParams.get('total') || '0') || 0;
            const rawAbono = parseFloat(queryParams.get('abono') || '0') || 0;
            const rawSaldo = parseFloat(queryParams.get('saldo') || '0') || Math.max(0, rawTotal - rawAbono);
            const rawQty = parseInt(queryParams.get('qty') || queryParams.get('cantidad') || '100', 10) || 100;
            const orderNum = parseInt(queryParams.get('orderNum') || queryParams.get('orden') || '1', 10) || 1;

            const mockTrabajo: Trabajo = {
                id: 'directo',
                orden: orderNum,
                clienteId: 'cliente-directo',
                tipo: queryParams.get('doc') || queryParams.get('tipo') || 'Trabajo Comercial General',
                subtipo: queryParams.get('subtipo') || queryParams.get('material') || 'Impresión / Acabados',
                cantidad: rawQty,
                tamano: queryParams.get('tamano') || queryParams.get('docSize') || '1/4 Oficio',
                total: rawTotal,
                abono: rawAbono,
                saldo: rawSaldo,
                estado: 'PENDIENTE' as any,
                fechaEntrada: new Date().toISOString(),
                fechaEntrega: queryParams.get('entrega') || new Date(Date.now() + 86400000).toISOString(),
                prioridad: 'Normal',
                esSRI: false,
                observaciones: queryParams.get('detalle') || queryParams.get('notes') || '',
                creadoPor: 'Operador Taller',
                responsable: 'Imprenta Córdova',
                titular: (queryParams.get('name') || queryParams.get('titular') || 'CONSUMIDOR FINAL').toUpperCase(),
                caduco: false,
                estadoClave: 'LISTA',
                imprimirClave: false,
            };

            const mockCliente: Cliente = {
                id: 'cliente-directo',
                nombre: (queryParams.get('name') || queryParams.get('titular') || 'CONSUMIDOR FINAL').toUpperCase(),
                cedula: queryParams.get('ruc') || queryParams.get('cedula') || '9999999999999',
                ruc: queryParams.get('ruc') || queryParams.get('cedula') || '9999999999999',
                telefono: [queryParams.get('phone') || queryParams.get('telefono') || '0993083943'],
                email: queryParams.get('email') || '',
                direccion: queryParams.get('direccion') || 'Pasaje, El Oro',
                creadoEn: new Date().toISOString(),
                regimen: Regimen.GENERAL,
            };

            setTrabajo(mockTrabajo);
            setCliente(mockCliente);
            return;
        }

        // 2. Carga estándar desde DataContext
        if (!trabajoId || dataLoading) return;
        let cancelado = false;
        const buscarCliente = async (clienteId: string) => {
            const { data } = await supabase.from('clientes').select('*').eq('id', clienteId).maybeSingle();
            if (!cancelado && data) setCliente(mapDBCliente(data));
        };
        const aplicar = (t: Trabajo) => {
            setTrabajo(t);
            const cli = clientes.find(c => c.id === t.clienteId);
            if (cli) setCliente(cli);
            else if (t.clienteId) buscarCliente(t.clienteId).catch(() => {});
            if (t.modeloImpresion && !queryParams.get('mode')) {
                setModelo(resolverModelo(t.modeloImpresion, null, false));
            }
        };

        const current = trabajos.find(t => t.id === trabajoId);
        if (current) {
            aplicar(current);
        } else {
            // No está en la lista cargada (la consulta general trae hasta 1000 órdenes, o
            // falló la carga): se busca por id antes de dar la orden por inexistente.
            setBuscandoEnBase(true);
            supabase.from('trabajos').select('*').eq('id', trabajoId).maybeSingle()
                .then(({ data }) => { if (!cancelado && data) aplicar(mapDBTrabajo(data)); })
                .then(() => { if (!cancelado) setBuscandoEnBase(false); },
                      () => { if (!cancelado) setBuscandoEnBase(false); });
        }
        return () => { cancelado = true; };
    }, [trabajoId, trabajos, clientes, dataLoading, queryParams]);

    const config = {
        nombre: cloudConfig?.imprentaNombre || 'IMPRENTA CÓRDOVA',
        ruc: cloudConfig?.emisorRuc || cloudConfig?.imprentaRuc || '0702065319001',
        autorizacionSri: '8634',
        direccion: 'Colón entre Sucre y Rocafuerte • Pasaje - El Oro - Ecuador',
        telefono: cloudConfig?.imprentaTelefono || '0993083943',
        email: cloudConfig?.imprentaEmail || 'imprentacordova@gmail.com',
    };

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

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        const element = document.getElementById('comercial-print-canvas');
        if (!element || !trabajo) return;
        setIsGenerating(true);
        try {
            const isContinuo = esModoContinuo;
            const pdfFormat: [number, number] = isContinuo ? [216, 165] : [160, 110];
            const html2pdf = await cargarHtml2Pdf();
            await html2pdf().set({
                margin: 0,
                filename: `Recibo-Comercial-${String(trabajo.orden).padStart(6, '0')}.pdf`,
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: { scale: 3, useCORS: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: pdfFormat, orientation: 'landscape' }
            }).from(element).save();
        } catch (err) {
            console.error("Error generando PDF comercial:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleWhatsApp = () => {
        if (!trabajo || !cliente) return;
        const trackingUrl = `${window.location.origin}/#/tracking?q=${trabajo.id}`;
        const titular = isConsumidorFinal ? 'CONSUMIDOR FINAL' : cliente.nombre;
        const msg = `🧾 *COMPROBANTE DE TRABAJO COMERCIAL - IMPRENTA CÓRDOVA*\n\n` +
            `Estimado/a *${titular}*,\n` +
            `Su orden de trabajo *#${trabajo.orden}* está registrada:\n\n` +
            `📦 *Trabajo:* ${trabajo.tipo} (${trabajo.cantidad} u.)\n` +
            `💰 *Total:* ${formatCurrency(trabajo.total)}\n` +
            `💵 *Abono:* ${formatCurrency(trabajo.abono)}\n` +
            `📉 *Saldo:* ${formatCurrency(trabajo.saldo)}\n\n` +
            `🔍 *Rastree su orden aquí:* ${trackingUrl}\n\n` +
            `Direc: Colón e/. Sucre y Rocafuerte • Tel: ${config.telefono}`;
        const phone = cliente.telefono?.[0] || '';
        if (phone) window.open(generateWhatsAppLink(phone, msg), '_blank');
        else alert("El cliente no tiene número de teléfono registrado.");
    };

    if (dataLoading) {
        return (
            <div className="h-screen bg-slate-900 flex flex-col items-center justify-center gap-3 text-white">
                <Loader2Icon className="w-8 h-8 animate-spin text-amber-400" />
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Cargando comprobante comercial...</span>
            </div>
        );
    }

    if ((!trabajo || !cliente) && (dataLoading || buscandoEnBase)) {
        return (
            <div className="h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-white">
                <div className="text-sm font-bold opacity-80">Cargando la orden…</div>
            </div>
        );
    }

    if (!trabajo || !cliente) {
        return (
            <div className="h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-white">
                <div className="text-xl font-black">404_ORDEN_NO_ENCONTRADA</div>
                <button onClick={() => navigate(-1)} className="px-5 py-2 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700">
                    ← Regresar
                </button>
            </div>
        );
    }

    const fecha = new Date(trabajo.fechaEntrada);
    const trackingUrl = `${window.location.origin}/#/tracking?q=${trabajo.id}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;
    const ordenStr = String(trabajo.orden).padStart(6, '0');
    const sumaEnLetras = numeroALetras(trabajo.total);
    const titularFinal = isConsumidorFinal ? 'CONSUMIDOR FINAL' : cliente.nombre;
    const rucFinal = isConsumidorFinal ? '9999999999999' : (cliente.ruc || cliente.cedula || '9999999999');

    // Desglose de especificaciones
    let specs: any = null;
    const detalleStr = trabajo.observaciones || trabajo.subtipo || '';
    try {
        const specMatch = detalleStr.match(/\|\s*(?:ESPECIFICACIONES|SPECS):\s*(.+)/i);
        if (specMatch && specMatch[1]) specs = JSON.parse(specMatch[1]);
    } catch {
        // Observaciones escritas a mano: si el JSON no parsea, se imprime el texto crudo.
    }

    const cleanDetail = detalleStr.split(/\|\s*(?:ESPECIFICACIONES|SPECS):/i)[0].trim();

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center py-6 print:p-0 print:bg-white text-slate-900 font-sans">
            {/* CSS de Impresión Física */}
            <style>{`
                @media print {
                    @page { 
                        size: ${esModoContinuo ? '216mm 165mm landscape' : '160mm 110mm landscape'}; 
                        margin: 0; 
                    }
                    body { 
                        margin: 0 !important; 
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important; 
                        print-color-adjust: exact !important; 
                        background: #ffffff !important; 
                    }
                    .no-print { display: none !important; }
                    .guia-fondo-comercial { display: none !important; }
                    #comercial-print-canvas { 
                        box-shadow: none !important; 
                        margin: 0 !important; 
                        border: none !important;
                        width: ${esModoContinuo ? '216mm' : '160mm'} !important;
                        height: ${esModoContinuo ? '165mm' : '110mm'} !important;
                        page-break-after: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
                .recibo-font-serif { font-family: 'Times New Roman', Georgia, serif; }
                .recibo-font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
                .perforation-line { border-top: 1.5px dashed #94a3b8; position: relative; }
                .perforation-line::after {
                    content: '✂️ CORTAR AQUÍ • COPIA IMPRENTA / TALLER';
                    position: absolute;
                    top: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    padding: 0 10px;
                    font-size: 6.5px;
                    font-weight: 800;
                    color: #64748b;
                    letter-spacing: 0.1em;
                }
            `}</style>

            {/* Botón flotante accesible de cierre rápido */}
            <button
                onClick={handleCerrar}
                className="no-print fixed top-4 right-4 z-[999] flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xl shadow-red-500/30 transition-all active:scale-95 border border-red-500 cursor-pointer"
                title="Cerrar vista de impresión (Esc)"
            >
                <CloseIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Cerrar (Esc)</span>
            </button>

            {/* BARRA SUPERIOR DE HERRAMIENTAS Y SELECTOR DE LOS 4 MODELOS */}
            <header className="no-print w-full max-w-5xl mb-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleCerrar} 
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600"
                            title="Regresar"
                        >
                            <ArrowLeftIcon className="w-5 h-5"/>
                        </button>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comprobante de Trabajo Comercial</span>
                            <h2 className="text-sm font-black text-slate-900 leading-tight">
                                Orden #{ordenStr} &bull; {titularFinal}
                            </h2>
                        </div>
                    </div>

                    {/* Acciones principales */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {modelo === 'comercial-sobre-preimpreso' && !esModoContinuo && (
                            <button
                                onClick={() => setMostrarGuiaVisual(prev => !prev)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                                    mostrarGuiaVisual 
                                        ? 'bg-amber-50 text-amber-800 border-amber-300' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                                title="Mostrar / ocultar la marca de agua del talonario físico en pantalla"
                            >
                                👁️ Guía Fondo: <strong>{mostrarGuiaVisual ? 'ON' : 'OFF'}</strong>
                            </button>
                        )}

                        <button 
                            onClick={() => setIsConsumidorFinal(!isConsumidorFinal)} 
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${
                                isConsumidorFinal 
                                    ? 'bg-[#0f2b48] text-white border-[#0f2b48]' 
                                    : 'bg-transparent text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {isConsumidorFinal ? 'Restaurar Cliente' : 'Consumidor Final'}
                        </button>

                        <button 
                            onClick={handleWhatsApp} 
                            className="flex items-center gap-1.5 bg-[#1B6E3E] hover:bg-[#155C33] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                            <WhatsAppIcon className="w-3.5 h-3.5"/> WhatsApp
                        </button>

                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={isGenerating}
                            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
                        >
                            <ArrowDownTrayIcon className="w-3.5 h-3.5"/> {isGenerating ? 'Generando...' : 'PDF'}
                        </button>

                        <button 
                            onClick={handlePrint} 
                            className="flex items-center gap-1.5 bg-[#0f2b48] text-white hover:bg-[#1e40af] px-4 py-1.5 rounded-xl text-xs font-black transition-all shadow-sm"
                        >
                            <PrinterIcon className="w-4 h-4"/> Imprimir
                        </button>

                        <button 
                            onClick={handleCerrar} 
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all"
                            title="Cerrar comprobante (Esc)"
                        >
                            <CloseIcon className="w-3.5 h-3.5" /> Cerrar
                        </button>
                    </div>
                </div>

                {/* SEGMENTED TABS: SELECTOR DE LOS 4 MODELOS COMERCIALES */}
                <div className="bg-slate-100 p-1.5 rounded-xl flex items-center gap-1.5 overflow-x-auto border border-slate-200">
                    <button
                        onClick={() => { setModelo('comercial-sobre-preimpreso'); setEsModoContinuo(false); }}
                        className={`flex-1 min-w-[200px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            modelo === 'comercial-sobre-preimpreso' && !esModoContinuo
                                ? 'bg-white text-[#0f2b48] shadow-sm font-black' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span className="flex items-center gap-1.5">📦 1. Sobre Preimpreso</span>
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">Solo datos • Talonario 160×110</span>
                    </button>

                    <button
                        onClick={() => { setModelo('comercial-arte-completo'); setEsModoContinuo(false); }}
                        className={`flex-1 min-w-[200px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            modelo === 'comercial-arte-completo' && !esModoContinuo
                                ? 'bg-white text-[#0f2b48] shadow-sm font-black' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span className="flex items-center gap-1.5">📄 2. Clásico Completo</span>
                        <span className="text-[10px] font-medium text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">Hoja blanca • Arte 1/4 Oficio</span>
                    </button>

                    <button
                        onClick={() => { setModelo('comercial-moderno'); setEsModoContinuo(false); }}
                        className={`flex-1 min-w-[200px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            modelo === 'comercial-moderno' && !esModoContinuo
                                ? 'bg-white text-[#0f2b48] shadow-sm font-black' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span className="flex items-center gap-1.5">✨ 3. Evolución Moderna</span>
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">Con QR • Talonario Pro</span>
                    </button>

                    <button
                        onClick={() => { setEsModoContinuo(true); }}
                        className={`flex-1 min-w-[200px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            esModoContinuo
                                ? 'bg-white text-[#0f2b48] shadow-sm font-black' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span className="flex items-center gap-1.5">🖨️ 4. Continuo Epson</span>
                        <span className="text-[10px] font-medium text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-full">Matricial • Doble A5 (216×165)</span>
                    </button>
                </div>

                {/* SUB-BARRA DE CONTROL ESPECIALIZADO PARA PAPEL CONTINUO EPSON */}
                {esModoContinuo && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between gap-3 flex-wrap">
                        {/* Selector de Tecnología de Impresión */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Tecnología:
                            </span>
                            <div className="bg-white border border-slate-200 p-0.5 rounded-lg flex gap-1 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => setSubModoContinuo('matricial')}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        subModoContinuo === 'matricial' 
                                            ? 'bg-slate-900 text-white shadow-xs font-black' 
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                    title="Modo Matricial (Epson LX-300 / FX-890): trazos negros de alto contraste, sin fondos que desgasten la cinta"
                                >
                                    <span>📠 Matricial (Cinta)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSubModoContinuo('ecotank')}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        subModoContinuo === 'ecotank' 
                                            ? 'bg-[#0f2b48] text-white shadow-xs font-black' 
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                    title="Modo Tinta Continua (EcoTank / Láser / Pro): diseño gráfico a color"
                                >
                                    <span>🎨 Color (EcoTank)</span>
                                </button>
                            </div>
                        </div>

                        {/* Selector de Copias 2-Up */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                Copias:
                            </span>
                            <div className="bg-white border border-slate-200 p-0.5 rounded-lg flex gap-1 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => setCopiasContinuo('doble')}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                                        copiasContinuo === 'doble' 
                                            ? 'bg-blue-600 text-white shadow-xs' 
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                    title="Imprime Original para el cliente (arriba) y Copia de producción para taller (abajo)"
                                >
                                    ✂️ 2-Up (Cliente + Taller)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCopiasContinuo('cliente')}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                                        copiasContinuo === 'cliente' 
                                            ? 'bg-blue-600 text-white shadow-xs' 
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                    title="2 copias para el cliente / archivo de entrega"
                                >
                                    👤 2x Cliente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCopiasContinuo('taller')}
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                                        copiasContinuo === 'taller' 
                                            ? 'bg-blue-600 text-white shadow-xs' 
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                    title="2 copias internas para taller y prensas"
                                >
                                    🏭 2x Taller
                                </button>
                            </div>
                        </div>

                        {/* Visualizador de Agujeros de Arrastre Tractor Feed */}
                        <button
                            type="button"
                            onClick={() => setMostrarTractorFeed(prev => !prev)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                mostrarTractorFeed
                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                            title="Muestra en pantalla los orificios perforados laterales del papel continuo de arrastre"
                        >
                            <span>⚙️ Tractor Feed:</span>
                            <strong className="text-[10px]">{mostrarTractorFeed ? 'ON' : 'OFF'}</strong>
                        </button>
                    </div>
                )}
            </header>

            {/* PANEL DE CALIBRACIÓN DE REGISTRO MECÁNICO (no se imprime) */}
            <CalibradorRegistro
                modelo={modelo}
                nombreModelo={esModoContinuo ? 'Continuo Epson (Doble A5)' : (MODELOS[modelo]?.label || 'Recibo Comercial')}
                calibracion={calibracion}
                onMover={moverRegistro}
                onRestablecer={restablecerRegistro}
                maxWidth={esModoContinuo ? '216mm' : '160mm'}
            />

            {/* LIENZO DE IMPRESIÓN (CANVAS) */}
            <main className="flex justify-center items-start w-full overflow-auto py-2">
                {/* TRACTOR FEED VISUAL IZQUIERDO (Papel Continuo Matricial de Arrastre) */}
                {esModoContinuo && mostrarTractorFeed && (
                    <div 
                        className="hidden md:flex flex-col justify-around items-center w-[12.5mm] h-[165mm] bg-[#f8fafc] border-y border-l border-slate-300 border-dashed py-2 select-none pointer-events-none no-print shadow-xs"
                        title="Perforaciones de arrastre tractor feed (papel continuo de 9.5 pulgadas)"
                    >
                        {Array.from({ length: 13 }).map((_, i) => (
                            <div key={`tl-${i}`} className="w-[4.2mm] h-[4.2mm] rounded-full border border-slate-400 bg-white shadow-inner flex items-center justify-center text-[5px] text-slate-400">
                                •
                            </div>
                        ))}
                    </div>
                )}

                <div 
                    id="comercial-print-canvas"
                    className="bg-white shadow-2xl relative"
                    style={{
                        width: esModoContinuo ? '216mm' : '160mm',
                        height: esModoContinuo ? '165mm' : '110mm',
                        boxSizing: 'border-box',
                        transform: transformCalibracionValue,
                    }}
                >
                    {esModoContinuo ? (
                        /* MODO 4: EPSON CONTINUO POTENCIADO (2-UP A5 / DOBLE 216 × 165 mm) */
                        <RenderContinuoEpson 
                            trabajo={trabajo} 
                            cliente={cliente} 
                            config={config} 
                            ordenStr={ordenStr} 
                            fecha={fecha} 
                            qrSrc={qrSrc} 
                            isConsumidorFinal={isConsumidorFinal} 
                            titularFinal={titularFinal}
                            rucFinal={rucFinal}
                            sumaEnLetras={sumaEnLetras}
                            cleanDetail={cleanDetail} 
                            specs={specs} 
                            subModo={subModoContinuo}
                            copias={copiasContinuo}
                        />
                    ) : modelo === 'comercial-sobre-preimpreso' ? (
                        /* MODO 1: SOBRE PREIMPRESO (1/4 OFICIO - 160 × 110 mm) */
                        <RenderSobrePreimpreso 
                            trabajo={trabajo} 
                            cliente={cliente} 
                            ordenStr={ordenStr} 
                            fecha={fecha} 
                            sumaEnLetras={sumaEnLetras} 
                            titularFinal={titularFinal} 
                            mostrarGuiaVisual={mostrarGuiaVisual} 
                            cleanDetail={cleanDetail} 
                        />
                    ) : modelo === 'comercial-arte-completo' ? (
                        /* MODO 2: CLÁSICO COMPLETO (1/4 OFICIO - 160 × 110 mm) */
                        <RenderClasicoCompleto 
                            trabajo={trabajo} 
                            cliente={cliente} 
                            config={config} 
                            ordenStr={ordenStr} 
                            fecha={fecha} 
                            sumaEnLetras={sumaEnLetras} 
                            titularFinal={titularFinal} 
                            cleanDetail={cleanDetail} 
                            specs={specs} 
                        />
                    ) : (
                        /* MODO 3: EVOLUCIÓN MODERNA FULL PRO (1/4 OFICIO - 160 × 110 mm) */
                        <RenderModernoPro 
                            trabajo={trabajo} 
                            cliente={cliente} 
                            config={config} 
                            ordenStr={ordenStr} 
                            fecha={fecha} 
                            qrSrc={qrSrc} 
                            titularFinal={titularFinal} 
                            rucFinal={rucFinal} 
                            cleanDetail={cleanDetail} 
                            specs={specs} 
                        />
                    )}
                </div>

                {/* TRACTOR FEED VISUAL DERECHO (Papel Continuo Matricial de Arrastre) */}
                {esModoContinuo && mostrarTractorFeed && (
                    <div 
                        className="hidden md:flex flex-col justify-around items-center w-[12.5mm] h-[165mm] bg-[#f8fafc] border-y border-r border-slate-300 border-dashed py-2 select-none pointer-events-none no-print shadow-xs"
                        title="Perforaciones de arrastre tractor feed (papel continuo de 9.5 pulgadas)"
                    >
                        {Array.from({ length: 13 }).map((_, i) => (
                            <div key={`tr-${i}`} className="w-[4.2mm] h-[4.2mm] rounded-full border border-slate-400 bg-white shadow-inner flex items-center justify-center text-[5px] text-slate-400">
                                •
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

/* ============================================================================
 * 1. COMPONENTE: SOBRE PREIMPRESO (1/4 DE OFICIO 160 × 110 mm)
 * Imprime SOLO los datos variables para calzar sobre el talonario físico existente.
 * En pantalla muestra la guía visual para que el operador verifique la alineación.
 * ============================================================================ */
interface RenderProps {
    trabajo: Trabajo;
    cliente: Cliente;
    ordenStr: string;
    fecha: Date;
    sumaEnLetras: string;
    titularFinal: string;
    mostrarGuiaVisual: boolean;
    cleanDetail: string;
}

const RenderSobrePreimpreso: React.FC<RenderProps> = ({
    trabajo,
    cliente,
    ordenStr,
    fecha,
    sumaEnLetras,
    titularFinal,
    mostrarGuiaVisual,
    cleanDetail,
}) => {
    const geo = GEO_COMERCIAL160;
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = String(fecha.getFullYear()).slice(-2);
    const telefono = cliente.telefono?.[0] || '';

    return (
        <div className="w-[160mm] h-[110mm] relative overflow-hidden bg-white text-black recibo-font-serif">
            {/* GUÍA DE FONDO (MARCA DE AGUA DEL TALONARIO PREIMPRESO FÍSICO) */}
            {mostrarGuiaVisual && (
                <div 
                    className="guia-fondo-comercial absolute inset-0 pointer-events-none select-none z-0"
                    style={{ opacity: 0.28 }}
                >
                    {/* Marco exterior tenue */}
                    <div className="absolute inset-[3mm] border border-blue-900/40 rounded-lg"></div>
                    
                    {/* Cabecera preimpresa */}
                    <div className="absolute left-[5mm] top-[4mm] text-[8px] font-bold text-blue-950/50">
                        [LOGO IC] IMPRENTA CORDOVA &bull; SRI COD. AUTO: 8634 &bull; RUC: 0702065319001
                    </div>

                    {/* Casillas DÍA / MES / AÑO */}
                    <div 
                        className="absolute flex border border-blue-900/40 text-[7px] text-center"
                        style={{ top: `${geo.fecha.y - 4}%`, left: '74%', width: '22%', height: '12%' }}
                    >
                        <div className="flex-1 border-r border-blue-900/40">DÍA</div>
                        <div className="flex-1 border-r border-blue-900/40">MES</div>
                        <div className="flex-1">AÑO</div>
                    </div>

                    {/* Placa RECIBO */}
                    <div 
                        className="absolute border border-blue-900/40 text-[9px] font-black text-center"
                        style={{ top: `${geo.orden.y - 3.5}%`, left: '38%', width: '38%', height: '6%' }}
                    >
                        RECIBO &bull; N°
                    </div>

                    {/* Columna de publicidad lateral */}
                    <div 
                        className="absolute border border-blue-900/30 rounded p-1 text-[5px] text-blue-950/40 leading-tight"
                        style={{ top: '28%', left: '3mm', width: '23%', height: '66%' }}
                    >
                        REALIZAMOS: DOCUMENTOS AUTORIZADOS POR EL SRI, FACTURAS, NOTAS DE VENTA, TARJETAS, VOLANTES, SELLOS, GIGANTOGRAFÍAS...
                    </div>

                    {/* Renglones punteados/continuos tradicionales */}
                    <div className="absolute text-[8.5px] italic font-bold text-blue-950/40" style={{ top: `${geo.lineas.clienteY}%`, left: '27%' }}>Recibí de (la ) Sr. _____________________________________________</div>
                    <div className="absolute text-[8.5px] italic font-bold text-blue-950/40" style={{ top: `${geo.lineas.sumaY}%`, left: '27%' }}>La suma de: ____________________________________________________</div>
                    <div className="absolute text-[8.5px] italic font-bold text-blue-950/40" style={{ top: `${geo.lineas.conceptoY}%`, left: '27%' }}>Por concepto de: _______________________________________________</div>
                    <div className="absolute text-[8.5px] italic font-bold text-blue-950/40" style={{ top: `${geo.lineas.detalleY}%`, left: '27%' }}>_______________________________________________________________</div>
                    <div className="absolute text-[8.5px] italic font-bold text-blue-950/40" style={{ top: `${geo.lineas.valorY}%`, left: '27%' }}>Valor $ ___________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Saldo $ ____________</div>
                    <div className="absolute text-[8.5px] italic font-bold text-blue-950/40" style={{ top: `${geo.lineas.telefonoY}%`, left: '27%' }}>Teléfono: _________________</div>
                    <div className="absolute text-[7.5px] font-bold text-blue-950/40" style={{ top: `${geo.lineas.firmaY}%`, left: '72%' }}>Recibí Conforme</div>
                </div>
            )}

            {/* CAPA DE DATOS VARIABLES EXACTOS (SE IMPRIME EN EL TALONARIO OFFSET) */}
            <div className="absolute inset-0 z-10 text-[9.5px] font-bold leading-none select-text">
                {/* 1. Fecha: DÍA | MES | AÑO */}
                <div className="absolute recibo-font-mono text-[9px]" style={{ top: `${geo.fecha.y}%`, left: `${geo.fecha.diaX}%`, transform: 'translateX(-50%)' }}>
                    {dia}
                </div>
                <div className="absolute recibo-font-mono text-[9px]" style={{ top: `${geo.fecha.y}%`, left: `${geo.fecha.mesX}%`, transform: 'translateX(-50%)' }}>
                    {mes}
                </div>
                <div className="absolute recibo-font-mono text-[9px]" style={{ top: `${geo.fecha.y}%`, left: `${geo.fecha.anoX}%`, transform: 'translateX(-50%)' }}>
                    {anio}
                </div>

                {/* 2. Orden N° */}
                <div className="absolute recibo-font-mono text-[11px] font-black text-red-600" style={{ top: `${geo.orden.y}%`, left: `${geo.orden.x}%` }}>
                    #{ordenStr}
                </div>

                {/* 3. Cliente */}
                <div className="absolute text-[10px] font-black uppercase truncate max-w-[95mm]" style={{ top: `${geo.lineas.clienteY}%`, left: `${geo.lineas.clienteX}%` }}>
                    {titularFinal}
                </div>

                {/* 4. Suma en letras */}
                <div className="absolute text-[8px] font-bold uppercase truncate max-w-[100mm]" style={{ top: `${geo.lineas.sumaY}%`, left: `${geo.lineas.sumaX}%` }}>
                    {sumaEnLetras}
                </div>

                {/* 5. Concepto de trabajo */}
                <div className="absolute text-[9.5px] font-black uppercase truncate max-w-[95mm]" style={{ top: `${geo.lineas.conceptoY}%`, left: `${geo.lineas.conceptoX}%` }}>
                    {trabajo.cantidad} {trabajo.tipo} {trabajo.tamano ? `(${trabajo.tamano})` : ''}
                </div>

                {/* 6. Línea adicional / especificaciones */}
                <div className="absolute text-[8px] font-bold truncate max-w-[105mm]" style={{ top: `${geo.lineas.detalleY}%`, left: `${geo.lineas.detalleX}%` }}>
                    {cleanDetail || `Material: ${trabajo.subtipo || 'Estándar'} • Prioridad: ${trabajo.prioridad}`}
                </div>

                {/* 7. Valor Total y Saldo */}
                <div className="absolute recibo-font-mono text-[10.5px] font-black" style={{ top: `${geo.lineas.valorY}%`, left: `${geo.lineas.valorX}%` }}>
                    ${(trabajo.total || 0).toFixed(2)}
                </div>
                <div className="absolute recibo-font-mono text-[10.5px] font-black text-red-700" style={{ top: `${geo.lineas.saldoY}%`, left: `${geo.lineas.saldoX}%` }}>
                    ${(trabajo.saldo || 0).toFixed(2)}
                </div>

                {/* 8. Teléfono */}
                <div className="absolute recibo-font-mono text-[9px] font-bold" style={{ top: `${geo.lineas.telefonoY}%`, left: `${geo.lineas.telefonoX}%` }}>
                    {telefono || 'S/N'}
                </div>

                {/* 9. Identificador de taller */}
                <div className="absolute left-[4mm] bottom-[2mm] text-[5.5px] text-slate-400 font-mono">
                    LLENADO FÍSICO 1/4 OFICIO &bull; IMPRENTA CÓRDOVA
                </div>
            </div>
        </div>
    );
};

/* ============================================================================
 * 2. COMPONENTE: CLÁSICO COMPLETO (1/4 DE OFICIO 160 × 110 mm)
 * Reproduce el diseño clásico oficial de '1 cuarto de oficio recibo comercial.jpeg'
 * con arte, textos, cabecera y campos sobre papel blanco.
 * ============================================================================ */
interface ClasicoProps {
    trabajo: Trabajo;
    cliente: Cliente;
    config: any;
    ordenStr: string;
    fecha: Date;
    sumaEnLetras: string;
    titularFinal: string;
    cleanDetail: string;
    specs: any;
}

const RenderClasicoCompleto: React.FC<ClasicoProps> = ({
    trabajo,
    cliente,
    config,
    ordenStr,
    fecha,
    sumaEnLetras,
    titularFinal,
    cleanDetail,
}) => {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = String(fecha.getFullYear()).slice(-2);
    const telefono = cliente.telefono?.[0] || '';

    return (
        <div className="w-[160mm] h-[110mm] relative p-[3mm] box-border bg-white text-black recibo-font-serif flex flex-col justify-between border-2 border-black rounded-lg">
            {/* CABECERA CLÁSICA */}
            <div className="flex justify-between items-start border-b border-black pb-1">
                {/* Logotipo y datos de emisor */}
                <div className="flex items-center gap-2">
                    <div className="w-[11mm] h-[11mm] bg-black text-white flex items-center justify-center font-black text-[13px] rounded-sm font-sans tracking-tight">
                        IC
                    </div>
                    <div className="leading-tight">
                        <h1 className="text-[13px] font-black tracking-tight text-black uppercase font-sans">
                            IMPRENTA CORDOVA
                        </h1>
                        <p className="text-[6.5px] font-bold text-black font-sans uppercase">
                            SRI COD. AUTO: {config.autorizacionSri} &bull; RUC: {config.ruc}
                        </p>
                        <p className="text-[6px] font-medium text-black">
                            {config.direccion}
                        </p>
                        <p className="text-[6px] font-bold text-black font-sans">
                            ✉ {config.email} &bull; 📞 {config.telefono}
                        </p>
                    </div>
                </div>

                {/* Casillero DÍA / MES / AÑO */}
                <div className="flex flex-col border border-black text-center font-sans">
                    <div className="bg-black text-white text-[6.5px] font-black px-3 py-0.5 uppercase tracking-widest">
                        FECHA
                    </div>
                    <div className="flex border-t border-black text-[7px] font-bold">
                        <div className="px-2 py-0.5 border-r border-black">DÍA</div>
                        <div className="px-2 py-0.5 border-r border-black">MES</div>
                        <div className="px-2 py-0.5">AÑO</div>
                    </div>
                    <div className="flex border-t border-black font-mono text-[9px] font-black">
                        <div className="px-2 py-0.5 border-r border-black">{dia}</div>
                        <div className="px-2 py-0.5 border-r border-black">{mes}</div>
                        <div className="px-2 py-0.5">{anio}</div>
                    </div>
                </div>
            </div>

            {/* CUERPO DEL RECIBO: COLUMNA DE PUBLICIDAD + RENGLONES DE LLENADO */}
            <div className="flex-1 flex gap-2 pt-1.5 pb-1">
                {/* Columna Izquierda: Publicidad Tradicional en Recuadro */}
                <div className="w-[33mm] border border-black rounded p-1 flex flex-col justify-between text-[5px] leading-tight text-justify font-serif">
                    <div>
                        <div className="font-bold text-center border-b border-black pb-0.5 mb-1 text-[6px]">
                            REALIZAMOS:
                        </div>
                        <p className="uppercase font-semibold">
                            DOCUMENTOS AUTORIZADOS POR EL SRI; FACTURAS, NOTAS DE VENTA, ETC.
                        </p>
                        <p className="uppercase mt-1 font-semibold">
                            TARJETAS PARA TODO COMPROMISO SOCIAL, VOLANTES, RECIBOS, RIFAS, TABLAS DE BINGO, SELLOS, GIGANTOGRAFÍAS, DIPLOMAS, CALENDARIOS, ANILLADOS.
                        </p>
                    </div>
                    <div className="border-t border-black pt-0.5 font-bold text-[5.5px] text-center">
                        ADEMÁS: DECLARACIONES TRIBUTARIAS SRI
                    </div>
                </div>

                {/* Zona Derecha: Placa RECIBO + 7 Renglones */}
                <div className="flex-1 flex flex-col justify-between">
                    {/* Placa central RECIBO */}
                    <div className="flex justify-between items-center bg-black text-white px-3 py-1 rounded-sm">
                        <span className="text-[11px] font-black tracking-widest font-sans uppercase">RECIBO</span>
                        <span className="font-mono text-[12px] font-black tracking-wider text-amber-300">N° #{ordenStr}</span>
                    </div>

                    {/* Renglón 1: Recibí de */}
                    <div className="flex items-baseline text-[8.5px] border-b border-black pb-0.5">
                        <span className="font-bold italic min-w-[70px]">Recibí de (la ) Sr.:</span>
                        <span className="flex-1 font-black uppercase pl-2 text-[9.5px] truncate font-sans">{titularFinal}</span>
                    </div>

                    {/* Renglón 2: La suma de */}
                    <div className="flex items-baseline text-[8.5px] border-b border-black pb-0.5">
                        <span className="font-bold italic min-w-[55px]">La suma de:</span>
                        <span className="flex-1 font-bold pl-1 text-[8px] uppercase truncate">{sumaEnLetras}</span>
                    </div>

                    {/* Renglón 3: Por concepto de */}
                    <div className="flex items-baseline text-[8.5px] border-b border-black pb-0.5">
                        <span className="font-bold italic min-w-[75px]">Por concepto de:</span>
                        <span className="flex-1 font-black pl-1 text-[9px] uppercase truncate font-sans">
                            {trabajo.cantidad} {trabajo.tipo} {trabajo.tamano ? `(${trabajo.tamano})` : ''}
                        </span>
                    </div>

                    {/* Renglón 4: Detalle técnico adicional */}
                    <div className="flex items-baseline text-[8px] border-b border-black pb-0.5">
                        <span className="flex-1 pl-1 text-[8px] font-medium text-slate-800 truncate">
                            {cleanDetail || `Material: ${trabajo.subtipo || 'Químico / Couche'} • Entrega en 24h`}
                        </span>
                    </div>

                    {/* Renglón 5: Valor $ y Saldo $ */}
                    <div className="flex justify-between items-baseline text-[8.5px] pt-0.5">
                        <div className="flex items-baseline border-b border-black pb-0.5 flex-1 mr-4">
                            <span className="font-bold italic">Valor $</span>
                            <span className="font-mono font-black text-[11px] pl-2">${(trabajo.total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-baseline border-b border-black pb-0.5 flex-1">
                            <span className="font-bold italic">Saldo $</span>
                            <span className="font-mono font-black text-[11px] pl-2 text-red-700">${(trabajo.saldo || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Renglón 6: Teléfono y Firma */}
                    <div className="flex justify-between items-end pt-1">
                        <div className="flex items-baseline text-[8px] border-b border-black pb-0.5 w-[50%]">
                            <span className="font-bold italic">Teléfono:</span>
                            <span className="font-mono font-bold pl-2">{telefono || 'S/N'}</span>
                        </div>
                        <div className="w-[42%] text-center">
                            <div className="border-b border-black border-dashed mb-0.5"></div>
                            <span className="text-[7px] font-bold uppercase">Recibí Conforme</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* PIE INSTITUCIONAL */}
            <div className="flex justify-between items-center text-[5.5px] font-sans border-t border-black pt-0.5 text-slate-600">
                <span>NOTA: CONSERVE ESTE RECIBO PARA EL RETIRO DE SU TRABAJO.</span>
                <span className="font-bold">IMPRENTA CÓRDOVA &bull; PASAJE - EL ORO</span>
            </div>
        </div>
    );
};

/* ============================================================================
 * 3. COMPONENTE: EVOLUCIÓN MODERNA FULL PRO (1/4 DE OFICIO 160 × 110 mm)
 * Diseño de vanguardia: minimalista, suizo, elegante, con QR dinámico de tracking,
 * desglose editorial limpio y tarjetas financieras tipo KPI.
 * ============================================================================ */
interface ModernoProps {
    trabajo: Trabajo;
    cliente: Cliente;
    config: any;
    ordenStr: string;
    fecha: Date;
    qrSrc: string;
    titularFinal: string;
    rucFinal: string;
    cleanDetail: string;
    specs: any;
}

const RenderModernoPro: React.FC<ModernoProps> = ({
    trabajo,
    cliente,
    config,
    ordenStr,
    fecha,
    qrSrc,
    titularFinal,
    rucFinal,
    cleanDetail,
    specs,
}) => {
    const telefono = cliente.telefono?.[0] || '';
    const fechaEntrega = trabajo.fechaEntrega 
        ? new Date(trabajo.fechaEntrega).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
        : '24 Horas';

    return (
        <div className="w-[160mm] h-[110mm] relative p-[4mm] box-border bg-white text-slate-900 font-sans flex flex-col justify-between border border-slate-300 rounded-xl overflow-hidden shadow-sm">
            {/* CABECERA ATELIER: MONOGRAMA + BRANDING + BADGE DE ORDEN */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-[9mm] h-[9mm] rounded-lg bg-[#0f2b48] text-white flex items-center justify-center font-black text-[12px] tracking-tight shadow-sm">
                        IC
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[12px] font-black tracking-tight text-[#0f2b48] uppercase leading-none">
                                {config.nombre}
                            </h1>
                            <span className="text-[6.5px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-black tracking-widest uppercase">
                                PRO WORKSHOP
                            </span>
                        </div>
                        <p className="text-[6.5px] font-bold text-slate-500 tracking-wider uppercase mt-0.5">
                            AUT. SRI {config.autorizacionSri} &bull; RUC {config.ruc} &bull; {config.direccion}
                        </p>
                    </div>
                </div>

                {/* Badge de Orden y Fecha */}
                <div className="flex flex-col items-end">
                    <div className="bg-[#0f2b48] text-white px-2.5 py-1 rounded-lg flex items-center gap-2 shadow-sm">
                        <span className="text-[6px] font-bold uppercase tracking-widest text-slate-300">ORDEN</span>
                        <span className="font-mono text-[12px] font-black text-amber-300">#{ordenStr}</span>
                    </div>
                    <span className="text-[6.5px] font-bold text-slate-400 mt-0.5 font-mono">
                        {fecha.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* SECCIÓN DEL CLIENTE: CHIPS LIMPIOS */}
            <div className="grid grid-cols-12 gap-2 my-1 bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                <div className="col-span-6">
                    <span className="text-[5.5px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">CLIENTE / TITULAR</span>
                    <p className="text-[9.5px] font-black text-[#0f2b48] uppercase truncate">{titularFinal}</p>
                </div>
                <div className="col-span-3">
                    <span className="text-[5.5px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">RUC / CÉDULA</span>
                    <p className="text-[9px] font-mono font-bold text-slate-700">{rucFinal}</p>
                </div>
                <div className="col-span-3">
                    <span className="text-[5.5px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">TELÉFONO / WHATSAPP</span>
                    <p className="text-[9px] font-mono font-bold text-slate-700">{telefono || 'S/N'}</p>
                </div>
            </div>

            {/* DETALLE TÉCNICO Y MATRIX INDUSTRIAL */}
            <div className="flex-1 border border-slate-200 rounded-lg p-2 flex flex-col justify-between my-0.5">
                <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                        <span className="text-[6px] font-black uppercase tracking-widest text-slate-400 block">DESCRIPCIÓN DEL TRABAJO</span>
                        <p className="text-[10px] font-black text-[#0f2b48] uppercase truncate leading-tight">
                            {trabajo.cantidad} {trabajo.tipo}
                        </p>
                        <p className="text-[7.5px] text-slate-600 mt-0.5 leading-snug truncate">
                            {cleanDetail || 'Trabajo técnico procesado según requerimientos del cliente.'}
                        </p>
                    </div>

                    {/* Badges de Manufactura */}
                    <div className="flex gap-1.5 flex-wrap">
                        <div className="bg-slate-100 px-2 py-0.5 rounded text-[6.5px] font-bold text-slate-700">
                            Tam: {trabajo.tamano || '1/4 Oficio'}
                        </div>
                        <div className="bg-slate-100 px-2 py-0.5 rounded text-[6.5px] font-bold text-slate-700">
                            Mat: {trabajo.subtipo || specs?.tipoPapel || 'Estándar'}
                        </div>
                        <div className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[6.5px] font-black uppercase">
                            Entrega: {fechaEntrega}
                        </div>
                    </div>
                </div>

                {/* TARJETAS FINANCIERAS TIPO KPI (TOTAL / ABONO / SALDO) + QR DE RASTREO */}
                <div className="flex items-center justify-between gap-2 mt-1 pt-1.5 border-t border-slate-100">
                    {/* 3 Tarjetas KPI */}
                    <div className="flex-1 grid grid-cols-3 gap-1.5">
                        <div className="bg-slate-50 border border-slate-200 rounded-md p-1">
                            <span className="text-[5.5px] font-black uppercase tracking-widest text-slate-500 block">TOTAL VALOR</span>
                            <span className="text-[11px] font-mono font-black text-[#0f2b48]">${(trabajo.total || 0).toFixed(2)}</span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-1">
                            <span className="text-[5.5px] font-black uppercase tracking-widest text-emerald-700 block">ABONADO</span>
                            <span className="text-[11px] font-mono font-black text-emerald-800">${(trabajo.abono || 0).toFixed(2)}</span>
                        </div>
                        <div className={`rounded-md p-1 border ${
                            (trabajo.saldo || 0) > 0 
                                ? 'bg-amber-50 border-amber-300 text-amber-900' 
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                            <span className="text-[5.5px] font-black uppercase tracking-widest block">SALDO PENDIENTE</span>
                            <span className="text-[11px] font-mono font-black">${(trabajo.saldo || 0).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* QR Dinámico de Seguimiento */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                        <img src={qrSrc} alt="QR" className="w-[7mm] h-[7mm] rounded bg-white p-0.5 border border-slate-200" />
                        <div className="text-[5px] font-black text-slate-500 leading-tight uppercase">
                            RASTREO EN VIVO<br/>
                            <span className="text-[#0f2b48]">imprentacordova.net</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN INFERIOR: FIRMAS Y CLÁUSULA */}
            <div className="flex justify-between items-end pt-1">
                <div className="text-[5.5px] text-slate-500 max-w-[85mm] leading-tight">
                    * Conserve este comprobante para retirar su trabajo. Garantía de taller por defectos de manufactura dentro de las 48h posteriores a la entrega.
                </div>

                <div className="flex gap-4">
                    <div className="text-center w-[28mm]">
                        <div className="border-b border-slate-300 w-full mb-0.5"></div>
                        <span className="text-[5.5px] font-black uppercase text-slate-500">Taller / Emisor</span>
                    </div>
                    <div className="text-center w-[28mm]">
                        <div className="border-b border-slate-400 w-full mb-0.5"></div>
                        <span className="text-[5.5px] font-black uppercase text-slate-700">Recibí Conforme</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ============================================================================
 * 4. COMPONENTE: EPSON CONTINUO (A5 DOBLE - 216 × 165 mm)
 * Mantiene el diseño continuo 2-up para impresoras matriciales si se necesita.
 * ============================================================================ */
interface ContinuoProps {
    trabajo: Trabajo;
    cliente: Cliente;
    config: any;
    ordenStr: string;
    fecha: Date;
    qrSrc: string;
    isConsumidorFinal: boolean;
    titularFinal: string;
    rucFinal: string;
    sumaEnLetras: string;
    cleanDetail: string;
    specs: any;
    subModo: 'matricial' | 'ecotank';
    copias: 'doble' | 'cliente' | 'taller';
}

const RenderContinuoEpson: React.FC<ContinuoProps> = ({
    trabajo,
    cliente,
    config,
    ordenStr,
    fecha,
    qrSrc,
    isConsumidorFinal,
    titularFinal,
    rucFinal,
    sumaEnLetras,
    cleanDetail,
    specs,
    subModo,
    copias,
}) => {
    let dtRetiro: Date;
    if (trabajo.fechaEntrega) {
        dtRetiro = new Date(trabajo.fechaEntrega);
    } else {
        dtRetiro = new Date(trabajo.fechaEntrada);
        dtRetiro.setHours(dtRetiro.getHours() + (trabajo.tiempoEntregaEstimado === '24h' ? 24 : 48));
    }
    const fechaEntregaStr = `${dtRetiro.toLocaleDateString('es-EC', { 
        weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' 
    })} (${trabajo.tiempoEntregaEstimado === '24h' ? '24h Express' : 'Tarde'})`;

    let topType: 'CLIENTE' | 'OPERADOR' = 'CLIENTE';
    let bottomType: 'CLIENTE' | 'OPERADOR' | 'DUPLICADO_CLIENTE' | 'ARCHIVO' = 'OPERADOR';

    if (copias === 'cliente') {
        topType = 'CLIENTE';
        bottomType = 'DUPLICADO_CLIENTE';
    } else if (copias === 'taller') {
        topType = 'OPERADOR';
        bottomType = 'ARCHIVO';
    }

    return (
        <div className="w-[216mm] h-[165mm] flex flex-col justify-between p-0 bg-white box-border select-text">
            {/* BLOQUE SUPERIOR (Mitad 1 de 2: 78mm) */}
            <div className="w-[216mm] h-[79mm] flex flex-col p-[3mm] box-border overflow-hidden">
                <ReceiptBlockContinuo 
                    type={topType}
                    subModo={subModo}
                    trabajo={trabajo} 
                    cliente={cliente} 
                    config={config} 
                    ordenStr={ordenStr} 
                    fecha={fecha} 
                    fechaEntregaStr={fechaEntregaStr}
                    qrSrc={qrSrc} 
                    isConsumidorFinal={isConsumidorFinal} 
                    titularFinal={titularFinal}
                    rucFinal={rucFinal}
                    sumaEnLetras={sumaEnLetras}
                    cleanDetail={cleanDetail} 
                    specs={specs} 
                />
            </div>
            
            {/* LÍNEA DE PERFORACIÓN CENTRAL DE CORTE / DESPRENDIMIENTO (3mm) */}
            <div className="perforation-line w-[216mm] h-[3mm] flex items-center justify-center relative overflow-hidden select-none">
                <div className="w-full border-t border-dashed border-slate-600 print:border-black"></div>
                <span className="no-print absolute bg-white px-2.5 py-0 text-[6.5px] font-black text-slate-600 uppercase tracking-widest border border-slate-300 rounded-full shadow-2xs">
                    ✂️ DESPRENDER AQUÍ &bull; COPIA TALLER / CAJA
                </span>
            </div>
            
            {/* BLOQUE INFERIOR (Mitad 2 de 2: 78mm) */}
            <div className="w-[216mm] h-[79mm] flex flex-col p-[3mm] box-border overflow-hidden">
                <ReceiptBlockContinuo 
                    type={bottomType}
                    subModo={subModo}
                    trabajo={trabajo} 
                    cliente={cliente} 
                    config={config} 
                    ordenStr={ordenStr} 
                    fecha={fecha} 
                    fechaEntregaStr={fechaEntregaStr}
                    qrSrc={qrSrc} 
                    isConsumidorFinal={isConsumidorFinal} 
                    titularFinal={titularFinal}
                    rucFinal={rucFinal}
                    sumaEnLetras={sumaEnLetras}
                    cleanDetail={cleanDetail} 
                    specs={specs} 
                />
            </div>
        </div>
    );
};

interface ReceiptBlockProps {
    type: 'CLIENTE' | 'OPERADOR' | 'DUPLICADO_CLIENTE' | 'ARCHIVO';
    subModo: 'matricial' | 'ecotank';
    trabajo: Trabajo;
    cliente: Cliente;
    config: any;
    ordenStr: string;
    fecha: Date;
    fechaEntregaStr: string;
    qrSrc: string;
    isConsumidorFinal: boolean;
    titularFinal: string;
    rucFinal: string;
    sumaEnLetras: string;
    cleanDetail: string;
    specs: any;
}

const ReceiptBlockContinuo: React.FC<ReceiptBlockProps> = ({ 
    type, 
    subModo,
    trabajo, 
    cliente, 
    config, 
    ordenStr, 
    fecha, 
    fechaEntregaStr,
    qrSrc,
    titularFinal,
    rucFinal,
    sumaEnLetras,
    cleanDetail, 
    specs 
}) => {
    const isOperator = type === 'OPERADOR' || type === 'ARCHIVO';

    let badgeText = 'ORIGINAL CLIENTE • COMPROBANTE DE RETIRO';
    if (type === 'DUPLICADO_CLIENTE') badgeText = 'DUPLICADO CLIENTE • ARCHIVO';
    else if (type === 'OPERADOR') badgeText = 'COPIA TALLER • ORDEN DE PRODUCCIÓN';
    else if (type === 'ARCHIVO') badgeText = 'COPIA CAJA • ARCHIVO CONTABLE';

    // ────────────────────────────────────────────────────────────────────────
    // SUB-MODO 1: MATRICIAL (Epson LX-300 / FX-890 / Cinta de Impacto)
    // 100% fondos blancos puros, trazos negros nítidos, sin consumo innecesario de cinta
    // ────────────────────────────────────────────────────────────────────────
    if (subModo === 'matricial') {
        return (
            <div className="w-full h-full p-2 bg-white text-black recibo-font-mono flex flex-col justify-between border border-black box-border select-text">
                {/* FILA 1: CABECERA MATRICIAL (ESC/P COMPACTA) */}
                <div className="flex justify-between items-start border-b border-black pb-1">
                    <div className="flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-black tracking-tight uppercase leading-none font-mono">
                                {config.nombre || 'IMPRENTA CÓRDOVA'}
                            </span>
                            <span className="text-[7px] border border-black px-1 font-bold">RUC: {config.ruc}</span>
                            <span className="text-[7px] border border-black px-1 font-bold">AUT. SRI: {config.autorizacionSri}</span>
                        </div>
                        <div className="text-[6.5px] uppercase font-bold text-black mt-0.5">
                            {config.direccion} &bull; TEL: {config.telefono}
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                        <div className="border-2 border-black px-2 py-0.5 bg-white text-black font-mono font-black text-[13px] tracking-widest leading-none">
                            ORDEN: #{ordenStr}
                        </div>
                        <span className="text-[6.5px] font-black uppercase tracking-wider block mt-0.5 border border-black px-1">
                            *** {badgeText} ***
                        </span>
                    </div>
                </div>

                {/* FILA 2: DATOS DE CLIENTE, FECHAS Y RESPONSABLE */}
                <div className="grid grid-cols-12 gap-1 border-b border-black py-1 text-[7.5px] font-mono leading-tight">
                    <div className="col-span-7 border-r border-black pr-1.5 flex flex-col justify-between">
                        <div>
                            <span className="font-bold">CLIENTE:</span> <strong className="text-[8.5px] uppercase">{titularFinal}</strong>
                        </div>
                        <div className="flex gap-3 mt-0.5">
                            <span><span className="font-bold">RUC/CI:</span> {rucFinal}</span>
                            <span><span className="font-bold">TEL:</span> {cliente.telefono?.[0] || 'S/N'}</span>
                        </div>
                        <div className="truncate mt-0.5">
                            <span className="font-bold">DIR:</span> {cliente.direccion || 'Pasaje, El Oro'}
                        </div>
                    </div>

                    <div className="col-span-5 pl-1.5 flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                            <span><span className="font-bold">INGRESO:</span> {fecha.toLocaleDateString('es-EC')}</span>
                            <span className="border border-black px-1 text-[6.5px] font-black">
                                [{trabajo.prioridad?.toUpperCase() || 'NORMAL'}]
                            </span>
                        </div>
                        <div className="border border-black p-0.5 mt-0.5 flex justify-between items-center bg-white">
                            <span className="font-black text-[6.5px] uppercase">ENTREGA:</span>
                            <strong className="font-black text-[7.5px] uppercase">{fechaEntregaStr}</strong>
                        </div>
                    </div>
                </div>

                {/* FILA 3: ESPECIFICACIONES TÉCNICAS Y MANUFACTURA */}
                <div className="border-b border-black py-1 flex flex-col justify-between text-[7.5px] font-mono flex-1">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                            <span className="font-bold">TRABAJO:</span>{' '}
                            <strong className="text-[9px] uppercase font-black">{trabajo.cantidad} {trabajo.tipo}</strong>
                        </div>
                        <div className="flex gap-2">
                            <span className="border border-black px-1 text-[7px]"><span className="font-bold">MED:</span> {trabajo.tamano || '1/4 Oficio'}</span>
                            <span className="border border-black px-1 text-[7px]"><span className="font-bold">PAPEL:</span> {trabajo.subtipo || specs?.tipoPapel || 'Estándar'}</span>
                        </div>
                    </div>
                    <div className="text-[7px] mt-0.5 truncate">
                        <span className="font-bold">DETALLES / ACABADOS:</span> {cleanDetail || 'Trabajo comercial realizado según orden aprobada.'}
                    </div>
                </div>

                {/* FILA 4: DESGLOSE FINANCIERO TIPO REGISTRO CAJA */}
                <div className="grid grid-cols-12 gap-1 items-center border-b border-black py-1 font-mono">
                    <div className="col-span-7 flex flex-col justify-center pr-1">
                        <div className="text-[6.5px] uppercase leading-tight font-bold">
                            SON: <span>{sumaEnLetras}</span>
                        </div>
                    </div>

                    <div className="col-span-5 grid grid-cols-3 gap-1 text-center">
                        <div className="border border-black p-0.5">
                            <span className="text-[5.5px] block font-bold">TOTAL</span>
                            <strong className="text-[9px]">${(trabajo.total || 0).toFixed(2)}</strong>
                        </div>
                        <div className="border border-black p-0.5">
                            <span className="text-[5.5px] block font-bold">ABONO</span>
                            <strong className="text-[9px]">${(trabajo.abono || 0).toFixed(2)}</strong>
                        </div>
                        <div className="border-2 border-black p-0.5 bg-white font-black">
                            <span className="text-[5.5px] block font-black">SALDO</span>
                            <strong className="text-[10px]">${(trabajo.saldo || 0).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>

                {/* FILA 5: PIE CON RASTREO QR, TÉRMINOS Y FIRMAS */}
                <div className="flex justify-between items-end pt-1 text-[6.5px] font-mono leading-tight">
                    <div className="flex items-center gap-1.5 max-w-[105mm]">
                        <img src={qrSrc} alt="QR" className="w-[7.5mm] h-[7.5mm] border border-black p-[0.5mm]" />
                        <div>
                            <span className="font-bold">Rastreo: imprentacordova.net</span><br />
                            <span className="text-[5.5px]">* Conserve este comprobante para retirar. Reclamos máx. 48h.</span>
                        </div>
                    </div>

                    <div className="flex gap-4 text-center">
                        <div className="w-[30mm]">
                            <div className="border-b border-black w-full mb-0.5"></div>
                            <span className="text-[6px] uppercase font-bold">{isOperator ? 'TALLER / PRENSA' : 'EMISOR AUTORIZADO'}</span>
                        </div>
                        <div className="w-[30mm]">
                            <div className="border-b border-black w-full mb-0.5"></div>
                            <span className="text-[6px] uppercase font-bold">RECIBÍ CONFORME</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ────────────────────────────────────────────────────────────────────────
    // SUB-MODO 2: COLOR PRO (Epson EcoTank / Tinta Continua / Láser)
    // Alta calidad visual, azul Córdova, tarjetas KPI y logo en vector
    // ────────────────────────────────────────────────────────────────────────
    return (
        <div className={`w-full h-full p-2.5 rounded-xl border ${isOperator ? 'bg-slate-50/70 border-slate-300' : 'bg-white border-slate-200'} shadow-xs flex flex-col justify-between box-border select-text font-sans`}>
            {/* Header section */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-1 mb-1">
                <div className="flex items-center gap-2">
                    <CordovaLogo className="w-8 h-8" />
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[12px] font-black text-slate-900 tracking-tight uppercase leading-none">{config.nombre}</h1>
                            <span className="text-[6.5px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold uppercase">
                                PRO 2-UP
                            </span>
                        </div>
                        <p className="text-[6.5px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            RUC {config.ruc} &bull; AUT. SRI {config.autorizacionSri} &bull; {config.direccion}
                        </p>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end">
                    <div className={`px-2.5 py-0.5 rounded-md flex items-center gap-1.5 ${isOperator ? 'bg-slate-800' : 'bg-[#0f2b48]'} text-white shadow-xs`}>
                        <span className="text-[6px] font-black uppercase tracking-wider text-slate-300">ORDEN</span>
                        <span className="text-[13px] font-mono font-black text-amber-300 leading-none">#{ordenStr}</span>
                    </div>
                    <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                        {badgeText}
                    </span>
                </div>
            </div>

            {/* Main Data Grid */}
            <div className="grid grid-cols-12 gap-2 bg-slate-50 border border-slate-200/80 rounded-lg p-1.5 text-[8px]">
                <div className="col-span-7 flex flex-col justify-between">
                    <div>
                        <span className="text-[5.5px] font-black text-slate-400 uppercase tracking-widest block mb-0.2">Cliente / Titular</span>
                        <p className="text-[9px] font-black text-slate-900 uppercase leading-tight truncate">{titularFinal}</p>
                    </div>
                    <div className="flex gap-3 text-[7px] font-mono text-slate-600 mt-0.5">
                        <span>RUC/CI: <strong>{rucFinal}</strong></span>
                        <span>TEL: <strong>{cliente.telefono?.[0] || 'S/N'}</strong></span>
                    </div>
                </div>

                <div className="col-span-5 flex flex-col justify-between">
                    <div className="flex justify-between items-center text-[7px]">
                        <span className="text-slate-500">Ingreso: <strong>{fecha.toLocaleDateString('es-EC')}</strong></span>
                        <span className="bg-slate-200/80 px-1 py-0.2 rounded text-[6px] font-black uppercase text-slate-700">
                            {trabajo.prioridad}
                        </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 mt-0.5 flex justify-between items-center">
                        <span className="text-[6px] font-black text-blue-900 uppercase">Entrega:</span>
                        <strong className="text-[7.5px] text-blue-900 font-black">{fechaEntregaStr}</strong>
                    </div>
                </div>
            </div>

            {/* Industrial Detail & Mechanicals */}
            <div className="flex-1 border border-slate-200 rounded-lg p-1.5 flex flex-col justify-between my-0.5">
                <div className="flex justify-between items-start">
                    <div className="flex-1 mr-2">
                        <span className="text-[6px] font-black uppercase tracking-widest text-slate-400 block">TRABAJO Y ACABADOS</span>
                        <p className="text-[9px] font-black text-slate-900 uppercase truncate leading-tight">
                            {trabajo.cantidad} {trabajo.tipo}
                        </p>
                        <p className="text-[7px] text-slate-600 mt-0.5 leading-snug truncate">
                            {cleanDetail || 'Trabajo comercial realizado según requerimientos técnicos.'}
                        </p>
                    </div>

                    <div className="flex gap-1 flex-wrap">
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded text-[6.5px] font-bold text-slate-700">
                            Tam: {trabajo.tamano || '1/4 Oficio'}
                        </span>
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded text-[6.5px] font-bold text-slate-700">
                            Papel: {trabajo.subtipo || specs?.tipoPapel || 'Estándar'}
                        </span>
                    </div>
                </div>

                {/* Financial KPIs */}
                <div className="grid grid-cols-12 gap-1.5 items-center mt-1 pt-1 border-t border-slate-100">
                    <div className="col-span-6 text-[6px] text-slate-600 leading-tight">
                        <span className="font-bold">SON:</span> {sumaEnLetras}
                    </div>

                    <div className="col-span-6 grid grid-cols-3 gap-1 text-center">
                        <div className="bg-slate-50 border border-slate-200 rounded p-0.5">
                            <span className="text-[5px] font-black uppercase text-slate-500 block">TOTAL</span>
                            <span className="text-[9.5px] font-mono font-black text-slate-900">${(trabajo.total || 0).toFixed(2)}</span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-0.5">
                            <span className="text-[5px] font-black uppercase text-emerald-700 block">ABONO</span>
                            <span className="text-[9.5px] font-mono font-black text-emerald-800">${(trabajo.abono || 0).toFixed(2)}</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-300 rounded p-0.5">
                            <span className="text-[5px] font-black uppercase text-amber-800 block">SALDO</span>
                            <span className="text-[10px] font-mono font-black text-amber-950">${(trabajo.saldo || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signatures & Footer */}
            <div className="flex justify-between items-end pt-0.5 text-[6px] text-slate-500">
                <div className="flex items-center gap-1.5 max-w-[105mm]">
                    <img src={qrSrc} alt="QR" className="w-[6.5mm] h-[6.5mm] rounded bg-white p-0.2 border border-slate-200" />
                    <span className="text-[5.5px] leading-tight">
                        * Conserve este comprobante para retirar. Reclamos máx. 48h. Rastreo: imprentacordova.net
                    </span>
                </div>

                <div className="flex gap-3 text-center">
                    <div className="w-[28mm]">
                        <div className="border-b border-slate-300 w-full mb-0.5"></div>
                        <span className="text-[5.5px] font-black uppercase text-slate-500">{isOperator ? 'Taller / Prensa' : 'Emisor / Taller'}</span>
                    </div>
                    <div className="w-[28mm]">
                        <div className="border-b border-slate-400 w-full mb-0.5"></div>
                        <span className="text-[5.5px] font-black uppercase text-slate-700">Recibí Conforme</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReciboEpson;
