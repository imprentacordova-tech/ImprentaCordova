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
            filename: `Solicitud-SRI-${trabajo.orden}-${cliente?.ruc || cliente?.cedula}.pdf`,
            image: { type: 'jpeg' as const, quality: 1 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (dataLoading || isRetrying) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
            <div className="flex flex-col items-center gap-4">
                <Loader2Icon className="w-10 h-10 text-amber-500 animate-spin" />
                <span className="text-amber-500 font-mono text-xs uppercase tracking-widest animate-pulse">Cargando Solicitud SRI...</span>
            </div>
        </div>
    );

    if (error || !trabajo || !cliente) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-6 text-center">
            <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20 mb-8 max-w-md">
                <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="font-bold text-sm uppercase tracking-widest text-white mb-2">SOLICITUD NO ENCONTRADA</h2>
                <p className="text-slate-400 text-xs leading-relaxed">
                    {error || "El registro no está disponible en la base de datos."}
                </p>
            </div>
            <button 
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 bg-amber-500 rounded-xl text-xs font-black text-black uppercase tracking-widest hover:scale-105 transition-all"
            >
                Volver al Panel
            </button>
        </div>
    );

    const fechaHoy = new Date(trabajo.fechaEntrada || Date.now());
    const dia = fechaHoy.getDate().toString().padStart(2, '0');
    const mes = (fechaHoy.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaHoy.getFullYear().toString().slice(-2);
    const hora = fechaHoy.toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'});

    const fechaEntrega = trabajo.fechaEntrega ? new Date(trabajo.fechaEntrega) : new Date(Date.now() + 86400000);
    const horaEntrega = fechaEntrega.toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'});

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
            <div className="w-full h-full bg-white text-[#0f2b48] font-sans p-3 box-border flex flex-col justify-between select-none relative" style={{ height: '143mm' }}>
                
                {/* CABECERA OFICIAL AZUL MARINO */}
                <div className="border border-[#0e3150] rounded-t-md overflow-hidden">
                    <div className="bg-[#0e3150] text-white px-3 py-1.5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-white text-[#0e3150] font-black text-xs flex items-center justify-center border border-[#0e3150] shadow-sm">
                                IC
                            </div>
                            <div>
                                <h1 className="text-sm font-black tracking-wider uppercase leading-none m-0">IMPRENTA CORDOVA</h1>
                            </div>
                        </div>
                        <div className="text-right text-[7px] leading-tight text-slate-200">
                            <div>Direc.: {config.direccion} &nbsp; 📞 {config.telefono}</div>
                            <div>RUC: {config.ruc} • CODIGO AUT SRI: {config.autorizacion} &nbsp; ✉ Email: {config.email}</div>
                        </div>
                    </div>

                    {/* TÍTULO SOLICITUD */}
                    <div className="bg-white px-3 py-1 flex justify-between items-center border-t border-[#0e3150]">
                        <div className="text-[10.5px] font-black uppercase tracking-wider text-[#0e3150] flex items-center gap-2">
                            SOLICITUD DE AUTORIZACIÓN DE IMPRESIÓN <span className="text-[#0284c7] font-black">SRi</span>
                            {isOperator && <span className="text-[8px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-bold ml-2">COPIA TALLER</span>}
                        </div>
                        <div className="text-[9px] font-black text-[#0e3150]">
                            ORDEN N°: <span className="font-mono">{String(trabajo.orden || trabajo.id).padStart(8, '0')}</span>
                        </div>
                    </div>
                </div>

                {/* FORMULARIO DATOS DEL CLIENTE */}
                <div className="border-x border-b border-[#0e3150] p-2 text-[8px] flex flex-col gap-1">
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
                                    <span key={idx} className="w-3 h-3.5 border border-[#0e3150] bg-slate-50 flex items-center justify-center font-mono font-bold text-[8px] leading-none">
                                        {digit}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 flex-1">
                            <span className="font-bold">Clave:</span>
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
                            <span className="font-mono font-bold bg-slate-100 border border-[#0e3150] px-1.5 py-0.5 rounded-[2px]">{dia} | {mes} | {anio}</span>
                            <span className="font-mono text-[7px] text-slate-500 font-bold ml-1">[L][M][M][J][V][S]</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Hora y Entrega:</span>
                            <span className="border-b border-dotted border-slate-400 font-mono px-1">{horaEntrega}</span>
                            <span className="font-mono text-[7px] text-slate-500 font-bold">[L][M][M][J][V][S]</span>
                        </div>
                    </div>

                    {/* TELÉFONO Y CORREO */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                        <div className="flex items-center gap-1">
                            <span className="font-bold">Telef:</span>
                            <span className="text-[7px] text-slate-600">Aument.[ ] Cambiar[ ] Mismo[✓]</span>
                            <span className="border-b border-dotted border-slate-400 font-mono font-bold px-1">{cliente.telefono?.[0] || 'Dictado'}</span>
                        </div>
                        <div className="flex items-baseline gap-1 flex-1">
                            <span className="font-bold">Email:</span>
                            <span className="flex-1 border-b border-dotted border-slate-400 text-slate-600 truncate pl-1">{cliente.email || 'imprentacordova@gmail.com'}</span>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="font-bold whitespace-nowrap">Correo Electrónico:</span>
                        <span className="flex-1 border-b border-dotted border-slate-400 text-slate-700 truncate pl-1">{cliente.email || ''}</span>
                    </div>
                </div>

                {/* TABLA DE COMPROBANTES DETALLADOS */}
                <div className="border border-[#0e3150] rounded-md overflow-hidden mt-1">
                    <div className="bg-[#0e3150] text-white text-center font-black text-[7.5px] py-0.5 tracking-wider uppercase">
                        SOLICITO LA ELABORACIÓN DE LOS DOCUMENTOS DETALLADOS A CONTINUACIÓN:
                    </div>
                    <table className="w-full text-center text-[7.5px] border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-[#0e3150] border-b border-[#0e3150] font-bold">
                                <th className="py-0.5 px-1 border-r border-[#0e3150] w-[14%]">TAMAÑO</th>
                                <th className="py-0.5 px-2 border-r border-[#0e3150] text-left w-[36%]">TIPO DE DOCUMENTO</th>
                                <th className="py-0.5 px-1 border-r border-[#0e3150] w-[16%]">PAPEL<br/><span className="text-[6px]">(Químico | Bond)</span></th>
                                <th className="py-0.5 px-1 border-r border-[#0e3150] w-[9%]">ESTABLEC.</th>
                                <th className="py-0.5 px-1 border-r border-[#0e3150] w-[9%]">PTO. EMISIÓN</th>
                                <th className="py-0.5 px-1 border-r border-[#0e3150] w-[8%]">CANTIDAD</th>
                                <th className="py-0.5 px-1 w-[8%]">PRECIO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {/* NOTA DE VENTA */}
                            <tr className={docName.toLowerCase().includes('nota') ? 'font-bold bg-slate-50/50' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('nota') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left">Nota de Venta</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">
                                    {docName.toLowerCase().includes('nota') ? (isQuimico ? '( [✓] [ ] )' : '( [ ] [✓] )') : '( [ ] [ ] )'}
                                </td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('nota') ? (trabajo.establecimiento || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('nota') ? (trabajo.puntoEmision || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono font-bold">{docName.toLowerCase().includes('nota') ? docQty : ''}</td>
                                <td className="py-0.5 font-mono font-bold">{docName.toLowerCase().includes('nota') ? `$${totalVal.toFixed(2)}` : ''}</td>
                            </tr>

                            {/* GUÍA DE REMISIÓN */}
                            <tr className={docName.toLowerCase().includes('guía') ? 'font-bold bg-slate-50/50' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('guía') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left">Guía de Remisión</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">
                                    {docName.toLowerCase().includes('guía') ? (isQuimico ? '( [✓] [ ] )' : '( [ ] [✓] )') : '( [ ] [ ] )'}
                                </td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('guía') ? (trabajo.establecimiento || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('guía') ? (trabajo.puntoEmision || '001') : ''}</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono font-bold">{docName.toLowerCase().includes('guía') ? docQty : ''}</td>
                                <td className="py-0.5 font-mono font-bold">{docName.toLowerCase().includes('guía') ? `$${totalVal.toFixed(2)}` : ''}</td>
                            </tr>

                            {/* NOTA DE CRÉDITO */}
                            <tr className={docName.toLowerCase().includes('crédito') ? 'font-bold bg-slate-50/50' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('crédito') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left">Nota de Crédito</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">( [ ] [ ] )</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 font-mono"></td>
                            </tr>

                            {/* LIQUIDACIÓN DE COMPRAS */}
                            <tr className={docName.toLowerCase().includes('liquid') ? 'font-bold bg-slate-50/50' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('liquid') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left text-[6.5px]">Liquidación de Compras o Prestación de Servicios</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">( [ ] [ ] )</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 font-mono"></td>
                            </tr>

                            {/* RECIBOS */}
                            <tr className={docName.toLowerCase().includes('recibo') ? 'font-bold bg-slate-50/50' : ''}>
                                <td className="py-0.5 border-r border-slate-300 font-mono">{docName.toLowerCase().includes('recibo') ? docSize : ''}</td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left font-black">RECIBOS</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">( [ ] [ ] )</td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono"></td>
                                <td className="py-0.5 font-mono"></td>
                            </tr>

                            {/* FILA EXTRA */}
                            <tr>
                                <td className="py-0.5 border-r border-slate-300"></td>
                                <td className="py-0.5 px-2 border-r border-slate-300 text-left"></td>
                                <td className="py-0.5 border-r border-slate-300 font-mono text-[7px]">( [ ] [ ] )</td>
                                <td className="py-0.5 border-r border-slate-300"></td>
                                <td className="py-0.5 border-r border-slate-300"></td>
                                <td className="py-0.5 border-r border-slate-300"></td>
                                <td className="py-0.5"></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div className="p-1 text-[7px] flex items-baseline gap-1 border-t border-slate-300">
                        <span className="font-bold">Detalles adicionales:</span>
                        <span className="border-b border-dotted border-slate-400 flex-1 truncate">{trabajo.detalle || 'Ninguno'}</span>
                    </div>
                </div>

                {/* AVISO IMPORTANTE */}
                <div className="bg-[#0e3150] text-white text-center rounded py-1 px-2 mt-1">
                    <div className="font-black text-[7.5px] uppercase tracking-wider">
                        NOTA IMPORTANTE: SIN RECIBO PIERDE EL DERECHO A RETIRAR SU TRABAJO Y SU DINERO
                    </div>
                    <div className="text-[6px] text-slate-300 font-medium leading-tight mt-0.5">
                        PASADO EL MES DE NO HABER RETIRADO SUS DOCUMENTOS (FACTURAS, RETENCIONES, GUÍAS, ETC) NO NOS HACEMOS RESPONSABLES DE SU ABONO Y TODO RECLAMO QUEDA ANULADO.
                    </div>
                </div>

                {/* DECLARACIÓN LEGAL, QR Y FIRMA */}
                <div className="grid grid-cols-12 gap-2 text-[7px] text-slate-700 mt-1 items-center">
                    <div className="col-span-6 leading-tight">
                        <p>Declaro que los datos proporcionados en esta solicitud son exactos y verdaderos, por lo que asumo la responsabilidad sobre su presentación.</p>
                        <p className="font-bold text-[6.5px] mt-0.5">Nota: En caso de que el trámite sea realizado por un tercero deberá adjuntar poder especial o general.</p>
                    </div>
                    <div className="col-span-2 flex flex-col items-center justify-center">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`https://www.imprentacordova.net/tracking?orden=${trabajo.orden || trabajo.id}`)}`} 
                            alt="QR Tracking" 
                            className="w-10 h-10 border border-slate-300 rounded p-[1px] bg-white shadow-xs"
                        />
                        <span className="text-[5.5px] font-black text-[#0e3150] mt-0.5 uppercase tracking-tighter">Rastrear Orden</span>
                    </div>
                    <div className="col-span-4 text-center">
                        <div className="border-b border-dotted border-slate-500 w-full mb-1"></div>
                        <div className="font-black text-[7.5px] text-[#0e3150] uppercase">Firma del Solicitante</div>
                        <div className="text-[6.5px] text-slate-500 truncate">Razón social / Nombres: {cliente.nombre}</div>
                        <div className="text-[6.5px] text-slate-500">C.I.: {cliente.ruc || cliente.cedula}</div>
                    </div>
                </div>

                {/* BARRA FINANCIERA INFERIOR AZUL */}
                <div className="bg-[#0e3150] text-white rounded-md p-1 flex justify-between items-center gap-2 mt-1">
                    <div className="flex-1 bg-white text-[#0e3150] rounded px-2 py-0.5 flex justify-between items-center font-bold text-[8.5px]">
                        <span>Valor $</span>
                        <span className="font-mono text-[9.5px]">{totalVal.toFixed(2)}</span>
                    </div>
                    <div className="flex-1 bg-white text-[#0e3150] rounded px-2 py-0.5 flex justify-between items-center font-bold text-[8.5px]">
                        <span>Abona $</span>
                        <span className="font-mono text-[9.5px] text-emerald-700">{abonoVal.toFixed(2)}</span>
                    </div>
                    <div className="flex-1 bg-[#f8fafc] text-[#0e3150] border border-white/40 rounded px-2 py-0.5 flex justify-between items-center font-black text-[8.5px]">
                        <span className="text-[#2563eb]">Saldo $</span>
                        <span className="font-mono text-[10.5px] text-[#2563eb]">{saldoVal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-[#0a0a0b] min-h-screen py-10 flex flex-col items-center overflow-y-auto font-sans relative">
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
                    box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8);
                }
            `}</style>

            {/* BARRA SUPERIOR DE CONTROL */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 no-print px-8 py-4 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl relative z-50">
                <div className="flex gap-4">
                    <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/60 font-bold text-xs uppercase tracking-wider hover:text-white transition-all">
                        <HomeIcon className="w-4 h-4" /> Dashboard
                    </button>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/60 font-bold text-xs uppercase tracking-wider hover:text-white transition-all">
                        <ArrowLeftIcon className="w-4 h-4" /> Volver
                    </button>
                </div>
                
                <div className="flex gap-4 items-center">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mr-2">
                        {format === 'a5' ? '📄 Doble Solicitud (2x A5 en Hoja A4)' : '📄 Hoja Única'}
                    </span>
                    
                    <button onClick={handleDownloadPdf} className="bg-white/10 hover:bg-white/15 border border-white/15 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white transition-all flex items-center gap-2">
                        <ArrowDownTrayIcon className="w-4 h-4 text-amber-400" /> Exportar PDF
                    </button>
                    
                    <button onClick={() => window.print()} className="bg-amber-500 text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg hover:bg-amber-400 flex items-center gap-2 hover:scale-105 transition-all">
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
