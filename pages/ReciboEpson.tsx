import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente } from '../types';
import { 
    PrinterIcon, ArrowLeftIcon, ArrowDownTrayIcon, 
    WhatsAppIcon, Loader2Icon, FileTextIcon,
    CordovaLogo
} from '../components/Icons';
import html2pdf from 'html2pdf.js';
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

    const { calibracion, mover: moverRegistro, restablecer: restablecerRegistro, transform: transformCalibracionValue } = useCalibracion(modelo);

    // Control de guía visual de fondo (marca de agua del talonario preimpreso)
    const [mostrarGuiaVisual, setMostrarGuiaVisual] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isConsumidorFinal, setIsConsumidorFinal] = useState<boolean>(false);

    // Trabajo y cliente cargados desde BD o por URL (fallback directo)
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);

    useEffect(() => {
        // 1. Caso directo por parámetros URL (Chrome extension o pre-guardado)
        if (trabajoId === 'directo' || (!dataLoading && trabajoId && !trabajos.some(t => t.id === trabajoId))) {
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
            };

            const mockCliente: Cliente = {
                id: 'cliente-directo',
                nombre: (queryParams.get('name') || queryParams.get('titular') || 'CONSUMIDOR FINAL').toUpperCase(),
                cedula: queryParams.get('ruc') || queryParams.get('cedula') || '9999999999999',
                ruc: queryParams.get('ruc') || queryParams.get('cedula') || '9999999999999',
                telefono: [queryParams.get('phone') || queryParams.get('telefono') || '0993083943'],
                email: queryParams.get('email') || '',
                direccion: queryParams.get('direccion') || 'Pasaje, El Oro',
                fechaRegistro: new Date().toISOString(),
            };

            setTrabajo(mockTrabajo);
            setCliente(mockCliente);
            return;
        }

        // 2. Carga estándar desde DataContext
        if (!trabajoId || dataLoading) return;
        const current = trabajos.find(t => t.id === trabajoId);
        if (current) {
            setTrabajo(current);
            setCliente(clientes.find(c => c.id === current.clienteId) || null);
            if (current.modeloImpresion && !queryParams.get('mode')) {
                setModelo(current.modeloImpresion);
            }
        }
    }, [trabajoId, trabajos, clientes, dataLoading, queryParams]);

    const config = {
        nombre: cloudConfig?.imprentaNombre || 'IMPRENTA CÓRDOVA',
        ruc: cloudConfig?.emisorRuc || cloudConfig?.imprentaRuc || '0702065319001',
        autorizacionSri: '8634',
        direccion: 'Colón entre Sucre y Rocafuerte • Pasaje - El Oro - Ecuador',
        telefono: cloudConfig?.imprentaTelefono || '0993083943',
        email: cloudConfig?.imprentaEmail || 'imprentacordova@gmail.com',
    };

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        const element = document.getElementById('comercial-print-canvas');
        if (!element || !trabajo) return;
        setIsGenerating(true);
        try {
            const isContinuo = esModoContinuo;
            const pdfFormat = isContinuo ? [216, 165] : [160, 110];
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
    } catch (e) {}

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

            {/* BARRA SUPERIOR DE HERRAMIENTAS Y SELECTOR DE LOS 3 MODELOS */}
            <header className="no-print w-full max-w-5xl mb-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => navigate(-1)} 
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
                    </div>
                </div>

                {/* SEGMENTED TABS: SELECTOR DE LOS 3 MODELOS COMERCIALES EN 1/4 OFICIO (160 × 110 mm) */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 overflow-x-auto">
                    <button
                        onClick={() => { setModelo('comercial-sobre-preimpreso'); setEsModoContinuo(false); }}
                        className={`flex-1 min-w-[180px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            modelo === 'comercial-sobre-preimpreso' && !esModoContinuo
                                ? 'bg-white text-[#0f2b48] shadow-sm font-black' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span>📦 1. Sobre Preimpreso</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">1/4 Oficio</span>
                    </button>

                    <button
                        onClick={() => { setModelo('comercial-arte-completo'); setEsModoContinuo(false); }}
                        className={`flex-1 min-w-[170px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            modelo === 'comercial-arte-completo' && !esModoContinuo
                                ? 'bg-white text-[#0f2b48] shadow-sm font-black' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span>📄 2. Clásico Completo</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">Oficial</span>
                    </button>

                    <button
                        onClick={() => { setModelo('comercial-moderno'); setEsModoContinuo(false); }}
                        className={`flex-1 min-w-[180px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            modelo === 'comercial-moderno' && !esModoContinuo
                                ? 'bg-white text-[#0f2b48] shadow-sm font-black' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span>✨ 3. Evolución Moderna</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Full Pro</span>
                    </button>

                    <button
                        onClick={() => { setEsModoContinuo(true); }}
                        className={`flex-1 min-w-[170px] py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            esModoContinuo
                                ? 'bg-white text-[#0f2b48] shadow-sm font-black' 
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <span>🖨️ Continuo Epson</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">Doble A5</span>
                    </button>
                </div>
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
            <main className="flex justify-center w-full overflow-auto py-2">
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
                        /* MODO 4: EPSON CONTINUO (2-UP A5) */
                        <RenderContinuoEpson 
                            trabajo={trabajo} 
                            cliente={cliente} 
                            config={config} 
                            ordenStr={ordenStr} 
                            fecha={fecha} 
                            qrSrc={qrSrc} 
                            isConsumidorFinal={isConsumidorFinal} 
                            cleanDetail={cleanDetail} 
                            specs={specs} 
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
    cleanDetail: string;
    specs: any;
}

const RenderContinuoEpson: React.FC<ContinuoProps> = ({
    trabajo,
    cliente,
    config,
    ordenStr,
    fecha,
    qrSrc,
    isConsumidorFinal,
    cleanDetail,
    specs,
}) => {
    return (
        <div className="w-[216mm] h-[165mm] flex flex-col justify-between p-0 bg-white">
            <div className="flex-1 flex flex-col p-[5mm]">
                <ReceiptBlockContinuo 
                    type="CLIENTE" 
                    trabajo={trabajo} 
                    cliente={cliente} 
                    config={config} 
                    ordenStr={ordenStr} 
                    fecha={fecha} 
                    qrSrc={qrSrc} 
                    isConsumidorFinal={isConsumidorFinal} 
                    cleanDetail={cleanDetail} 
                    specs={specs} 
                />
            </div>
            
            <div className="perforation-line"></div>
            
            <div className="flex-1 flex flex-col p-[5mm]">
                <ReceiptBlockContinuo 
                    type="OPERADOR" 
                    trabajo={trabajo} 
                    cliente={cliente} 
                    config={config} 
                    ordenStr={ordenStr} 
                    fecha={fecha} 
                    qrSrc={qrSrc} 
                    isConsumidorFinal={isConsumidorFinal} 
                    cleanDetail={cleanDetail} 
                    specs={specs} 
                />
            </div>
        </div>
    );
};

const ReceiptBlockContinuo = ({ type, trabajo, cliente, config, ordenStr, fecha, qrSrc, isConsumidorFinal, cleanDetail, specs }: any) => {
    const isOperator = type === 'OPERADOR';

    return (
        <div className={`flex-1 flex flex-col gap-1.5 relative ${isOperator ? 'bg-slate-50/50' : 'bg-white'} border border-slate-200 rounded-2xl p-3 shadow-sm`}>
            {/* Watermark Copy Indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] font-black text-[70px] -rotate-12 select-none pointer-events-none uppercase tracking-[0.2em] text-slate-900">
                {isOperator ? 'PRODUCCIÓN' : 'CLIENTE'}
            </div>

            {/* Header section */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-1.5 mb-1">
                <div className="flex items-center gap-2">
                    <CordovaLogo className="w-8 h-8" />
                    <div>
                        <h1 className="text-[12px] font-black text-slate-900 tracking-tighter uppercase leading-none">{config.nombre}</h1>
                        <p className="text-[6.5px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{config.ruc} &bull; {config.direccion}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`px-3 py-1 rounded-lg flex flex-col items-end ${isOperator ? 'bg-slate-800' : 'bg-black'} text-white`}>
                        <span className="text-[5.5px] font-black uppercase tracking-[0.3em] opacity-50">ORDEN_CONTROL</span>
                        <span className="text-[14px] font-black tracking-tighter leading-none">#{ordenStr}</span>
                    </div>
                    <p className="text-[5.5px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">{isOperator ? 'COPIA TALLER' : 'ORIGINAL CLIENTE'}</p>
                </div>
            </div>

            {/* Main Data Grid */}
            <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[5.5px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Cliente</span>
                    <p className="text-[9px] font-black text-slate-900 uppercase leading-tight truncate">{isConsumidorFinal ? 'CONSUMIDOR FINAL' : cliente.nombre}</p>
                    <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block mt-1">Cédula / RUC</span>
                    <p className="text-[8px] font-mono font-bold text-slate-700">{isConsumidorFinal ? '9999999999999' : (cliente.cedula || cliente.ruc || 'S/N')}</p>
                </div>

                <div className="col-span-8 grid grid-cols-4 gap-1.5">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100 col-span-2">
                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">TRABAJO</span>
                        <p className="text-[8.5px] font-black text-slate-900 uppercase truncate">{trabajo.tipo}</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">CANTIDAD</span>
                        <p className="text-[9px] font-black text-slate-900 uppercase">{trabajo.cantidad} u.</p>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">TAMAÑO</span>
                        <p className="text-[8px] font-black text-slate-900 uppercase truncate">{trabajo.tamano || '1/4 Oficio'}</p>
                    </div>
                </div>
            </div>

            {/* Industrial Detail & Mechanicals */}
            <div className="flex-1 grid grid-cols-12 gap-2 mt-0.5">
                <div className="col-span-8 bg-white p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <div>
                        <span className="text-[6px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-0.5">ESPECIFICACIONES</span>
                        <p className="text-[8.5px] font-bold text-slate-800 leading-tight">
                            {cleanDetail || 'Trabajo comercial realizado según arte aprobado por el cliente.'}
                        </p>
                    </div>
                    <div className="text-[6px] text-slate-400 font-mono">
                        Material: {trabajo.subtipo || 'Estándar'} &bull; Prioridad: {trabajo.prioridad}
                    </div>
                </div>

                <div className={`col-span-4 rounded-xl p-2.5 text-white flex flex-col justify-between ${isOperator ? 'bg-slate-800' : 'bg-slate-950'}`}>
                    <div className="space-y-0.5 text-[8px]">
                        <div className="flex justify-between items-center opacity-70">
                            <span>TOTAL:</span>
                            <span className="font-mono font-bold">${(trabajo.total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400">
                            <span>ABONO:</span>
                            <span className="font-mono font-bold">-${(trabajo.abono || 0).toFixed(2)}</span>
                        </div>
                        <div className="border-t border-white/10 pt-0.5 flex justify-between items-baseline font-black">
                            <span className="text-[6.5px] text-amber-300">SALDO:</span>
                            <span className="text-[13px] font-mono text-white leading-none">${(trabajo.saldo || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <img src={qrSrc} alt="QR" className="w-6 h-6 bg-white p-0.5 rounded" />
                        <span className="text-[5px] font-mono opacity-50 uppercase">Rastreo Web</span>
                    </div>
                </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end px-1 mt-0.5 text-[5.5px] text-slate-400 uppercase font-black">
                <span>Responsable: {trabajo.responsable || 'Taller'}</span>
                <span>{fecha.toLocaleDateString()}</span>
                <span>Recibí Conforme: {titularFinal}</span>
            </div>
        </div>
    );
};

export default ReciboEpson;
