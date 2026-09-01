import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo } from '../types';
import { 
    PrinterIcon, ArrowDownTrayIcon, ArrowLeftIcon, 
    Loader2Icon, HomeIcon, AlertTriangleIcon
} from '../components/Icons';
import { supabase } from '../services/supabase';
import html2pdf from 'html2pdf.js';

const mapDBTrabajo = (t: any): Trabajo => ({
    ...t,
    clienteId: t.cliente_id,
    fechaEntrada: t.fecha_entrada,
    fechaEntrega: t.fecha_entrega,
    creadoPor: t.creado_por,
    actualizadoPor: t.actualizado_por,
    fotoOriginalUrl: t.foto_original_url,
    fotoEvidenciaUrl: t.foto_evidencia_url,
    estadoClave: t.estado_clave,
    imprimirClave: t.imprimir_clave,
    esRenovacion: t.es_renovacion,
    esSRI: t.es_sri === true || t.tipo?.toLowerCase() === 'sri',
    tamano: t.tamano,
    establecimiento: t.establecimiento,
    puntoEmision: t.punto_emision,
    fechaVencimiento: t.fecha_vencimiento,
    actividadSeleccionada: t.actividad_seleccionada,
    claveAcceso: t.clave_acceso,
    arteAprobado: t.arte_aprobado,
    fotoRetiroUrl: t.foto_retiro_url,
    autorizacion_sri: t.autorizacion_sri,
    numeracion: t.numeracion
});

const SolicitudImpresionPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const format = queryParams.get('format') || 'a5'; 
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

    useEffect(() => {
        if (!trabajoId) return;

        const fetchDirectly = async () => {
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
                console.error("[SolicitudImpresion] Error en fetch directo:", err);
                setError("Documento no encontrado en la base de datos.");
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
    }, [trabajoId, trabajos, clientes, dataLoading]);

    const config = {
        direccion: cloudConfig?.direccion || 'Colón e/. Sucre y Av. Rocafuerte',
        telefono: cloudConfig?.imprentaTelefono || '0993083943 • 0962585172',
        ruc: cloudConfig?.emisorRuc || cloudConfig?.imprentaRuc || '0702065319001',
        autorizacion: cloudConfig?.imprentaAutorizacion || '8634',
        email: 'imprentacordova@gmail.com',
    };

    const handleDownloadPdf = () => {
        const element = document.getElementById('documento-maestro-sri');
        if (!element || !trabajo) return;
        const opt = {
            margin: 0,
            filename: `Solicitud-SRI-${trabajo.orden || trabajo.id}-${cliente?.ruc || cliente?.cedula}.pdf`,
            image: { type: 'jpeg' as const, quality: 1 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };
        html2pdf().from(element).set(opt).save();
    };

    const handleShareWhatsApp = () => {
        if (!cliente || !trabajo) return;
        const phone = (cliente.telefono?.[0] || '').replace(/\D/g, '');
        const trackingUrl = `https://www.imprentacordova.net/tracking?orden=${trabajo.orden || trabajo.id}`;
        const msg = `*IMPRENTA CÓRDOVA · SOLICITUD DE IMPRESIÓN SRI*\n\n` +
            `Estimado/a *${cliente.nombre}*,\n` +
            `Hemos registrado su Solicitud de Autorización de Impresión del SRI:\n` +
            `📄 *Documento:* ${trabajo.tipo || 'Comprobante SRI'}\n` +
            `🔢 *Orden N°:* ${String(trabajo.orden || trabajo.id).padStart(6, '0')}\n` +
            `💵 *Total:* $${Number(trabajo.total || 0).toFixed(2)} | *Abono:* $${Number(trabajo.abono || 0).toFixed(2)} | *Saldo:* $${Number(trabajo.saldo || 0).toFixed(2)}\n\n` +
            `🔍 *Rastree el estado de su orden en vivo aquí:*\n${trackingUrl}\n\n` +
            `📍 Colón e/. Sucre y Av. Rocafuerte · Machala, El Oro`;

        if (phone) {
            window.open(`https://wa.me/593${phone.startsWith('0') ? phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            navigator.clipboard.writeText(msg);
            setCopiedWhatsApp(true);
            setTimeout(() => setCopiedWhatsApp(false), 2500);
        }
    };

    if (dataLoading || isRetrying) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0A1140]">
            <div className="flex flex-col items-center gap-4">
                <Loader2Icon className="w-10 h-10 text-[#FFC61A] animate-spin" />
                <span className="text-[#FFC61A] font-mono text-xs uppercase tracking-widest animate-pulse font-bold">Cargando Solicitud SRI Oficial...</span>
            </div>
        </div>
    );

    if (error || !trabajo || !cliente) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FF] p-6 text-center">
            <div className="p-8 rounded-3xl bg-red-50 border border-red-200 mb-8 max-w-md">
                <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="font-bold text-sm uppercase tracking-widest text-[#0A1140] mb-2">SOLICITUD NO ENCONTRADA</h2>
                <p className="text-slate-600 text-xs leading-relaxed">
                    {error || "El registro no está disponible en la base de datos."}
                </p>
            </div>
            <button 
                onClick={() => navigate('/nuevo-pedido')}
                className="px-8 py-3 bg-[#16309B] rounded-xl text-xs font-black text-white uppercase tracking-widest hover:bg-[#0F2280] transition-all shadow-md"
            >
                Volver a Nueva Orden
            </button>
        </div>
    );

    const fechaHoy = new Date(trabajo.fechaEntrada || Date.now());
    const dia = fechaHoy.getDate().toString().padStart(2, '0');
    const mes = (fechaHoy.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaHoy.getFullYear().toString().slice(-2);
    const hora = fechaHoy.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

    const fechaEntrega = trabajo.fechaEntrega ? new Date(trabajo.fechaEntrega) : new Date(Date.now() + 86400000);
    const horaEntrega = fechaEntrega.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

    const rawSubtipo = trabajo.subtipo || '';
    const docSize = trabajo.tamano || '1/4 Oficio';
    const isQuimico = !rawSubtipo.toLowerCase().includes('bond');

    const totalVal = parseFloat(String(trabajo.total || 0)) || 13.00;
    const abonoVal = parseFloat(String(trabajo.abono || 0)) || 0.00;
    const saldoVal = Math.max(0, totalVal - abonoVal);

    const docName = trabajo.tipo || 'Nota de Venta';
    const docQty = trabajo.cantidad ? (trabajo.cantidad > 10 ? trabajo.cantidad : (trabajo.cantidad * 100)) : 100;

    const rucRaw = (cliente.ruc || cliente.cedula || '0700000000001').padStart(13, '0');
    const rucArray = rucRaw.split('').slice(0, 13);
    while (rucArray.length < 13) rucArray.push('');

    const renderTicketA5 = (variant: 'cliente' | 'imprenta') => {
        const isOperator = variant === 'imprenta';
        
        return (
            <div className="w-full h-full bg-white text-[#0A1140] font-sans p-3 box-border flex flex-col justify-between select-none relative" style={{ height: '143mm' }}>
                
                {/* CABECERA OFICIAL AZUL MARINO */}
                <div className="border border-[#0A1140] rounded-t-md overflow-hidden">
                    <div className="bg-[#0A1140] text-white px-3 py-1.5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-[#FFC61A] text-[#0A1140] font-black text-xs flex items-center justify-center border border-[#0A1140] shadow-sm">
                                IC
                            </div>
                            <div>
                                <h1 className="text-sm font-black tracking-wider uppercase leading-none m-0 font-['Outfit']">IMPRENTA CORDOVA</h1>
                            </div>
                        </div>
                        <div className="text-right text-[7px] leading-tight text-slate-200">
                            <div>Direc.: {config.direccion} &nbsp; 📞 {config.telefono}</div>
                            <div>RUC: <span className="font-mono font-bold text-[#FFC61A]">{config.ruc}</span> • AUT. SRI: <span className="font-mono font-bold">{config.autorizacion}</span></div>
                        </div>
                    </div>

                    {/* TÍTULO SOLICITUD */}
                    <div className="bg-white px-3 py-1 flex justify-between items-center border-t border-[#0A1140]">
                        <div className="text-[10.5px] font-black uppercase tracking-wider text-[#0A1140] flex items-center gap-2">
                            SOLICITUD DE AUTORIZACIÓN DE IMPRESIÓN <span className="bg-[#16309B] text-white px-1.5 py-0.2 rounded font-black text-[9px]">SRI</span>
                            {isOperator && <span className="text-[8px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold ml-2">COPIA IMPRENTA / TALLER</span>}
                        </div>
                        <div className="text-[9px] font-black text-[#0A1140]">
                            ORDEN N°: <span className="font-mono font-bold text-[#16309B]">{String(trabajo.orden || trabajo.id).padStart(8, '0')}</span>
                        </div>
                    </div>
                </div>

                {/* FORMULARIO DATOS DEL CLIENTE */}
                <div className="border-x border-b border-[#0A1140] p-2 text-[8px] flex flex-col gap-1">
                    <div className="flex items-baseline gap-1">
                        <span className="font-bold whitespace-nowrap">Apellidos y Nombres:</span>
                        <span className="flex-1 border-b border-dotted border-slate-400 font-bold uppercase text-[8.5px] truncate pl-1">{cliente.nombre}</span>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="font-bold whitespace-nowrap">Razón Social:</span>
                        <span className="flex-1 border-b border-dotted border-slate-400 font-semibold uppercase truncate pl-1">{cliente.nombreComercial || cliente.nombre}</span>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="font-bold whitespace-nowrap">Actividad Ec.:</span>
                        <span className="flex-1 border-b border-dotted border-slate-400 font-semibold uppercase truncate pl-1">{trabajo.actividadSeleccionada || cliente.actividades || 'Comercio / Servicios General'}</span>
                    </div>

                    {/* RUC 13 CASILLAS Y CLAVE */}
                    <div className="flex items-center gap-3 pt-0.5">
                        <div className="flex items-center gap-1">
                            <span className="font-bold">RUC:</span>
                            <div className="flex gap-[1px]">
                                {rucArray.map((digit, idx) => (
                                    <span key={idx} className="w-3 h-3.5 border border-[#0A1140] bg-slate-50 flex items-center justify-center font-mono font-bold text-[8px] leading-none">
                                        {digit}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 flex-1">
                            <span className="font-bold">Clave / Estab.:</span>
                            <span className="flex-1 border-b border-dotted border-slate-400 font-mono font-bold text-center">{trabajo.establecimiento || '001'}</span>
                        </div>
                    </div>

                    {/* FECHA, HORAS Y DÍAS */}
                    <div className="flex items-center justify-between text-[7.5px] pt-0.5">
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Hora:</span>
                            <span className="border-b border-dotted border-slate-400 font-mono px-1">{hora}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Fecha:</span>
                            <span className="font-mono font-bold bg-slate-100 border border-[#0A1140] px-1.5 py-0.5 rounded-[2px]">{dia} | {mes} | {anio}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Entrega:</span>
                            <span className="border-b border-dotted border-slate-400 font-mono px-1 font-bold text-[#16309B]">{horaEntrega}</span>
                        </div>
                    </div>

                    {/* TELÉFONO Y CORREO */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Telef:</span>
                            <span className="text-[7px] text-slate-600">Aument.[ ] Mismo[✓]</span>
                            <span className="border-b border-dotted border-slate-400 font-mono font-bold px-1">{cliente.telefono?.[0] || 'Dictado'}</span>
                        </div>
                        <div className="flex items-baseline gap-1 flex-1">
                            <span className="font-bold">Email:</span>
                            <span className="flex-1 border-b border-dotted border-slate-400 text-slate-600 truncate pl-1">{cliente.email || 'imprentacordova@gmail.com'}</span>
                        </div>
                    </div>
                </div>

                {/* TABLA DE COMPROBANTES DETALLADOS */}
                <div className="border border-[#0A1140] rounded-md overflow-hidden mt-1">
                    <div className="bg-[#0A1140] text-white text-center font-black text-[7.5px] py-0.5 tracking-wider uppercase">
                        SOLICITO LA ELABORACIÓN DE LOS DOCUMENTOS DETALLADOS A CONTINUACIÓN:
                    </div>
                    <table className="w-full text-center text-[7.5px] border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-[#0A1140] border-b border-[#0A1140] font-bold">
                                <th className="py-0.5 px-1 border-r border-[#0A1140] w-[14%]">TAMAÑO</th>
                                <th className="py-0.5 px-2 border-r border-[#0A1140] text-left w-[36%]">TIPO DE DOCUMENTO</th>
                                <th className="py-0.5 px-1 border-r border-[#0A1140] w-[16%]">PAPEL<br/><span className="text-[6px]">(Químico | Bond)</span></th>
                                <th className="py-0.5 px-1 border-r border-[#0A1140] w-[9%]">ESTABLEC.</th>
                                <th className="py-0.5 px-1 border-r border-[#0A1140] w-[9%]">PTO. EMISIÓN</th>
                                <th className="py-0.5 px-1 border-r border-[#0A1140] w-[8%]">CANTIDAD</th>
                                <th className="py-0.5 px-1 w-[8%]">PRECIO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {/* NOTA DE VENTA */}
                            <tr className={docName.toLowerCase().includes('nota') ? 'font-bold bg-amber-50/40' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('nota') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left font-bold">Nota de Venta</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">
                                    {docName.toLowerCase().includes('nota') ? (isQuimico ? '( [✓] [ ] )' : '( [ ] [✓] )') : '( [ ] [ ] )'}
                                </td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('nota') ? (trabajo.establecimiento || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('nota') ? (trabajo.puntoEmision || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono font-bold">{docName.toLowerCase().includes('nota') ? docQty : ''}</td>
                                <td className="py-0.5 font-mono font-bold">{docName.toLowerCase().includes('nota') ? `$${totalVal.toFixed(2)}` : ''}</td>
                            </tr>

                            {/* FACTURA */}
                            <tr className={docName.toLowerCase().includes('factura') ? 'font-bold bg-amber-50/40' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('factura') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left font-bold">Factura Autorizada</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">
                                    {docName.toLowerCase().includes('factura') ? (isQuimico ? '( [✓] [ ] )' : '( [ ] [✓] )') : '( [ ] [ ] )'}
                                </td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('factura') ? (trabajo.establecimiento || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('factura') ? (trabajo.puntoEmision || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono font-bold">{docName.toLowerCase().includes('factura') ? docQty : ''}</td>
                                <td className="py-0.5 font-mono font-bold">{docName.toLowerCase().includes('factura') ? `$${totalVal.toFixed(2)}` : ''}</td>
                            </tr>

                            {/* GUÍA DE REMISIÓN */}
                            <tr className={docName.toLowerCase().includes('guía') ? 'font-bold bg-amber-50/40' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('guía') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left font-bold">Guía de Remisión</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">
                                    {docName.toLowerCase().includes('guía') ? (isQuimico ? '( [✓] [ ] )' : '( [ ] [✓] )') : '( [ ] [ ] )'}
                                </td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('guía') ? (trabajo.establecimiento || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('guía') ? (trabajo.puntoEmision || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono font-bold">{docName.toLowerCase().includes('guía') ? docQty : ''}</td>
                                <td className="py-0.5 font-mono font-bold">{docName.toLowerCase().includes('guía') ? `$${totalVal.toFixed(2)}` : ''}</td>
                            </tr>

                            {/* LIQUIDACIÓN DE COMPRAS */}
                            <tr className={docName.toLowerCase().includes('liquid') ? 'font-bold bg-amber-50/40' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('liquid') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left text-[6.5px]">Liquidación de Compras</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">( [ ] [ ] )</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 font-mono"></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div className="p-1 text-[7px] flex items-baseline gap-1 border-t border-slate-300 bg-slate-50">
                        <span className="font-bold">Detalles / Numeración:</span>
                        <span className="border-b border-dotted border-slate-400 flex-1 truncate font-mono">{trabajo.numeracion || trabajo.detalle || '0000001 - 0000100'}</span>
                    </div>
                </div>

                {/* AVISO IMPORTANTE */}
                <div className="bg-[#0A1140] text-white text-center rounded py-1 px-2 mt-1">
                    <div className="font-black text-[7.5px] uppercase tracking-wider text-[#FFC61A]">
                        NOTA IMPORTANTE: SIN ESTE COMPROBANTE NO SE ENTREGA EL TRABAJO
                    </div>
                    <div className="text-[6px] text-slate-300 font-medium leading-tight mt-0.5">
                        PASADO EL MES DE NO HABER RETIRADO SUS COMPROBANTES FÍSICOS NO NOS HACEMOS RESPONSABLES DE SU ABONO.
                    </div>
                </div>

                {/* DECLARACIÓN LEGAL, QR Y FIRMA */}
                <div className="grid grid-cols-12 gap-2 text-[7px] text-slate-700 mt-1 items-center">
                    <div className="col-span-6 leading-tight">
                        <p className="font-medium">Declaro que los datos proporcionados en esta solicitud son exactos y verdaderos, asumiendo total responsabilidad sobre su presentación.</p>
                    </div>
                    <div className="col-span-2 flex flex-col items-center justify-center">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://www.imprentacordova.net/tracking?orden=${trabajo.orden || trabajo.id}`)}`} 
                            alt="QR Tracking" 
                            className="w-10 h-10 border border-slate-300 rounded p-[1px] bg-white shadow-xs"
                        />
                        <span className="text-[5.5px] font-black text-[#0A1140] mt-0.5 uppercase tracking-tighter">Rastrear en Línea</span>
                    </div>
                    <div className="col-span-4 text-center">
                        <div className="border-b border-dotted border-slate-500 w-full mb-1"></div>
                        <div className="font-black text-[7.5px] text-[#0A1140] uppercase">Firma del Solicitante</div>
                        <div className="text-[6.5px] text-slate-600 truncate font-bold">{cliente.nombre}</div>
                        <div className="text-[6.5px] text-slate-500 font-mono">C.I./RUC: {cliente.ruc || cliente.cedula}</div>
                    </div>
                </div>

                {/* BARRA FINANCIERA INFERIOR AZUL */}
                <div className="bg-[#0A1140] text-white rounded-md p-1 flex justify-between items-center gap-2 mt-1">
                    <div className="flex-1 bg-white text-[#0A1140] rounded px-2 py-0.5 flex justify-between items-center font-bold text-[8.5px]">
                        <span>Total $</span>
                        <span className="font-mono text-[9.5px]">{totalVal.toFixed(2)}</span>
                    </div>
                    <div className="flex-1 bg-white text-[#0A1140] rounded px-2 py-0.5 flex justify-between items-center font-bold text-[8.5px]">
                        <span>Abono $</span>
                        <span className="font-mono text-[9.5px] text-emerald-700 font-black">{abonoVal.toFixed(2)}</span>
                    </div>
                    <div className="flex-1 bg-[#EEF1FC] text-[#16309B] border border-white/40 rounded px-2 py-0.5 flex justify-between items-center font-black text-[8.5px]">
                        <span>Saldo $</span>
                        <span className="font-mono text-[10.5px] text-[#16309B]">{saldoVal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#F7F9FF] min-h-screen py-8 flex flex-col items-center overflow-y-auto font-sans relative">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; }
                    .page-container { 
                        box-shadow: none !important; 
                        margin: 0 !important;
                        padding: 0 !important;
                        border: none !important;
                        width: 210mm !important;
                        height: 297mm !important;
                    }
                }
                .page-container {
                    width: 210mm;
                    height: 297mm;
                    background: white;
                    position: relative;
                    box-sizing: border-box;
                }
                .web-shadow {
                    box-shadow: 0 10px 30px -10px rgba(10,17,64,0.15);
                }
            `}</style>

            {/* BARRA SUPERIOR DE CONTROL PREMIUM */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 no-print px-6 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm relative z-50 flex-wrap gap-4">
                <div className="flex gap-3 items-center">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-600 font-bold text-xs hover:text-[#16309B] transition-all">
                        <HomeIcon className="w-4 h-4" /> Dashboard
                    </button>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 font-bold text-xs hover:text-[#16309B] transition-all">
                        <ArrowLeftIcon className="w-4 h-4" /> Volver
                    </button>
                </div>
                
                <div className="flex gap-2.5 items-center flex-wrap">
                    <button 
                        onClick={handleShareWhatsApp} 
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
                    >
                        <span>{copiedWhatsApp ? '✓' : '📱'}</span>
                        <span>{copiedWhatsApp ? 'Copiado' : 'WhatsApp'}</span>
                    </button>

                    <button 
                        onClick={handleDownloadPdf} 
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" /> PDF 300DPI
                    </button>
                    
                    <button 
                        onClick={() => window.print()} 
                        className="bg-[#16309B] text-white hover:bg-[#0F2280] px-5 py-2 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all"
                    >
                        <PrinterIcon className="w-4 h-4"/> Imprimir Solicitud
                    </button>
                </div>
            </div>

            {/* CONTENEDOR EXACTO A4 (2x A5 CON CORTE INDUSTRIAL) */}
            <div id="documento-maestro-sri" className="page-container web-shadow rounded-sm relative z-10 flex flex-col justify-between p-2">
                {/* COPIA 1: ORIGINAL CLIENTE (A5 SUPERIOR) */}
                <div className="h-[143mm] overflow-hidden">
                    {renderTicketA5('cliente')}
                </div>

                {/* LÍNEA DE CORTE CENTRAL INDUSTRIAL */}
                <div className="w-full flex items-center justify-center my-1 relative z-20">
                    <div className="w-full border-t border-dashed border-slate-400"></div>
                    <div className="absolute bg-white px-4 py-0.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 border border-slate-300 rounded-full shadow-sm">
                        <span>✂</span> CORTAR AQUÍ (COPIA IMPRENTA / TALLER)
                    </div>
                </div>

                {/* COPIA 2: COPIA TALLER (A5 INFERIOR) */}
                <div className="h-[143mm] overflow-hidden">
                    {renderTicketA5('imprenta')}
                </div>
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
