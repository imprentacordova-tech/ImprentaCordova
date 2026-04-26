import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo, Regimen } from '../types';
import { 
    PrinterIcon, ArrowDownTrayIcon, ArrowLeftIcon, 
    Loader2Icon
} from '../components/Icons';
import { formatCurrency } from '../utils';

declare const html2pdf: any;

const SolicitudImpresionPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const { trabajos, clientes, sriCredentials, config: cloudConfig, loading: dataLoading } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);

    useEffect(() => {
        if (!trabajoId || dataLoading) return;
        const currentTrabajo = trabajos.find(t => t.id === trabajoId);
        if (currentTrabajo) {
            setTrabajo(currentTrabajo);
            setCliente(clientes.find(c => c.id === currentTrabajo.clienteId) || null);
        }
    }, [trabajoId, trabajos, clientes, dataLoading]);

    // Mapeo de config para la plantilla
    const config = {
        emisorDireccionMatriz: 'Colón e/ Sucre y Av. Rocafuerte',
        emisorTelefono: cloudConfig?.imprentaTelefono || '0993083943 • 0962585172',
        emisorRuc: cloudConfig?.emisorRuc || cloudConfig?.imprentaRuc || '0702065319001',
        imprentaAutorizacion: cloudConfig?.imprentaAutorizacion || '8634',
        emisorEmail: 'imprentacordova@gmail.com',
    };

    const handleDownloadPdf = () => {
        const element = document.getElementById('documento-maestro-sri');
        if (!element || !trabajo) return;
        const opt = {
            margin: 0,
            filename: `Solicitud-SRI-${trabajo.orden}-${cliente?.ruc || cliente?.cedula}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (dataLoading || !config || !trabajo || !cliente) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <Loader2Icon className="w-10 h-10 text-brand-blue animate-spin" />
        </div>
    );

    const fechaHoy = new Date();
    const dia = fechaHoy.getDate().toString().padStart(2, '0');
    const mes = (fechaHoy.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaHoy.getFullYear().toString();
    const hora = fechaHoy.toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit'});

    const subtipoOriginal = trabajo.subtipo.toLowerCase();
    
    // Parse workflow: "100x FACTURAS (1/4 OFICIO), 50x RETENCIONES"
    // Split by comma then find quantity and description
    const parsedJobItems = trabajo.subtipo.split(',').map(part => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(\d+)x\s+(.*)$/i);
        return {
            cantidad: match ? match[1] : trabajo.cantidad.toString(),
            descripcion: (match ? match[2] : trimmed).toLowerCase()
        };
    });

    const isRimpe = cliente.regimen === Regimen.NEGOCIO_POPULAR;

    const standardTypes = [
        { key: 'factura', label: 'Facturas' },
        { key: 'nota de venta', label: 'Nota de Venta' },
        { key: 'liquidacion de compra de bienes muebles', label: 'Liq. Compra Bienes Muebles Usados' },
        { key: 'credito', label: 'Notas de Crédito' },
        { key: 'debito', label: 'Notas de Débito' },
        { key: 'guia', label: 'Guías de Remisión' },
        { key: 'boleto', label: 'Boletos / Entradas Espectáculos' },
        { key: 'vehiculo', label: 'Liq. Compra Vehículos Usados' },
        { key: 'acta', label: 'Acta Entrega-Recepción Vehículos' },
        { key: 'servicios', label: 'Liq. Compra Bienes o Prest. Servicios' },
        { key: 'retencion', label: 'Comprobante de Retención' },
        { key: 'recibo', label: 'Recibos (No SRI)' }
    ];

    const hasSriKey = sriCredentials.some(c => c.ruc === cliente.ruc);
    const isContingencyLimit = (cliente.regimen === 'General' || cliente.regimen === 'Rimpe Emprendedor') && trabajo.esSRI;

    // Mapear el catálogo estándar con los items del trabajo
    const mappedItems = standardTypes.map(st => {
        const match = parsedJobItems.find(pj => pj.descripcion.includes(st.key));
        if (match) {
            return { 
                tipo: st.label, 
                cant: match.cantidad, 
                estab: trabajo.establecimiento || '001', 
                punto: trabajo.puntoEmision || '001', 
                isChecked: true,
                precio: (trabajo.total / (parsedJobItems.length || 1)).toFixed(2) // Estimación simple si hay múltiples
            };
        }
        return { tipo: st.label, cant: '', estab: '', punto: '', isChecked: false, precio: '' };
    });

    const RucArray = (cliente.ruc || cliente.cedula || '9999999999001').split('').slice(0, 13);
    while (RucArray.length < 13) RucArray.push('');

    return (
        <div className="bg-slate-300 min-h-screen py-12 flex flex-col items-center overflow-y-auto font-sans">
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; background: white; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    #documento-maestro-sri { 
                        box-shadow: none !important; 
                        border: none !important;
                        margin: 0 !important;
                        padding: 10mm 15mm !important;
                        width: 210mm !important;
                        min-height: 297mm !important;
                    }
                }
            `}</style>

            {/* BARRA SUPERIOR ELEGANTE (NO IMPRIMIBLE) */}
            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 no-print px-6 py-4 bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase tracking-widest hover:text-brand-blue transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
                    <ArrowLeftIcon className="w-4 h-4" /> Volver
                </button>
                <div className="flex gap-3">
                    <button onClick={handleDownloadPdf} className="bg-white border-2 border-slate-200 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:border-brand-blue/30 transition-all flex items-center gap-2 shadow-sm text-slate-700">
                        <ArrowDownTrayIcon className="w-4 h-4" /> Descargar PDF
                    </button>
                    <button onClick={() => window.print()} className="bg-[#1f2124] text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-black/30 flex items-center gap-2 hover:bg-black transition-all">
                        <PrinterIcon className="w-4 h-4"/> Imprimir A4
                    </button>
                </div>
            </div>

            {/* LIENZO A4 - REPLICA EXACTA DEL FORMULARIO ORIGINAL */}
            <div id="documento-maestro-sri" className="bg-white shadow-2xl relative flex flex-col box-border print:w-[210mm] print:h-[297mm] text-black" style={{ width: '210mm', minHeight: '297mm', padding: '15mm 15mm' }}>
                
                {/* 1. HEADER NEGRO IMPACTANTE */}
                <div className="bg-[#1f2124] text-white rounded-t-2xl overflow-hidden border-2 border-[#1f2124] flex flex-col shadow-inner">
                    <div className="flex justify-between items-center px-4 py-2 bg-[#1a1c1e]">
                        <h1 className="text-4xl font-black italic tracking-tighter w-full text-center" style={{ fontFamily: 'Impact, sans-serif' }}>
                            <span className="text-white text-5xl mr-2">I</span>IMPRENTA CORDOVA
                        </h1>
                    </div>
                    <div className="px-4 py-2 text-center border-t border-white/20">
                        <div className="flex justify-center flex-wrap gap-x-2 text-[11px] font-bold">
                            <span>Direc.: {config.emisorDireccionMatriz || 'Colón e/ Sucre y Av. Rocafuerte'}</span>
                            <span className="flex items-center gap-1 mx-2"><PrinterIcon className="w-3 h-3"/> {config.emisorTelefono || '0993083943 • 0962585172'}</span>
                        </div>
                        <div className="flex justify-center flex-wrap gap-x-4 mt-1 text-[11px] items-center">
                            <span className="font-bold underline decoration-white/50 underline-offset-2">RUC: {config.emisorRuc || '0702065319001'}</span>
                            <span>•</span>
                            <span className="font-bold">CODIGO AUT SRI: {config.imprentaAutorizacion || '8634'}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-[10px]">Email: {config.emisorEmail || 'imprentacordova@gmail.com'}</span>
                        </div>
                    </div>
                </div>

                {/* 2. TÍTULO SECUNDARIO RUGOSO */}
                <div className="bg-gray-200 border-x-2 border-b-2 border-[#1f2124] text-center py-2 px-2 relative z-10 flex items-center justify-center gap-4" style={{ backgroundImage: 'radial-gradient(#999 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
                    <h2 className="text-xl font-black text-black uppercase tracking-widest bg-white/95 inline-block px-6 py-0.5 rounded shadow-sm border border-slate-300">
                        Solicitud de Autorización de Impresión SRI
                    </h2>
                    {isContingencyLimit && (
                        <div className="bg-brand-red text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter shadow-lg border-2 border-white animate-pulse">
                            Límite Contingencia: 25H
                        </div>
                    )}
                </div>

                {/* 3. DATOS DEL CLIENTE - ESTILO LÍNEAS DE PUNTOS */}
                <div className="mt-6 px-1 space-y-4 text-xs font-bold font-sans text-black">
                    <div className="flex items-end border-b-2 border-black border-dashed pb-1">
                        <span className="whitespace-nowrap italic mr-2 text-[13px]">Apellidos y Nombres:</span>
                        <span className="flex-grow font-black uppercase text-sm">{cliente.nombre}</span>
                    </div>
                    <div className="flex items-end border-b-2 border-black border-dashed pb-1">
                        <span className="whitespace-nowrap italic mr-2 text-[13px]">Razón Social:</span>
                        <span className="flex-grow font-black uppercase text-sm">{cliente.nombreComercial || cliente.nombre}</span>
                    </div>
                    <div className="flex items-end border-b-2 border-black border-dashed pb-1">
                        <span className="whitespace-nowrap italic mr-2 text-[13px]">Actividad Ec.:</span>
                        <span className="flex-grow font-black uppercase text-sm">{cliente.actividades || trabajo.actividadSeleccionada || 'SEGÚN RUC'}</span>
                        {isRimpe && <span className="ml-2 bg-black text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">RIMPE N.P.</span>}
                    </div>
                    
                    {cliente.regimen === Regimen.NEGOCIO_POPULAR && (
                        <div className="flex items-end border-b-2 border-black border-dashed pb-1 pt-1">
                            <span className="whitespace-nowrap italic mr-2 text-[13px]">Cumplimiento Tributario:</span>
                            <div className="flex items-center gap-2 flex-grow">
                                <div className="w-4 h-4 border-2 border-black flex items-center justify-center font-black pb-0.5 text-[10px] bg-white">x</div>
                                <span className="font-black text-sm uppercase">Al día: verificado {dia}/{mes}/{anio}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* FILA DE RUC CON CAJITAS Y CLAVE */}
                    <div className="flex items-end pb-1 pt-2">
                        <span className="whitespace-nowrap italic mr-4 font-black text-[15px]">RUC:</span>
                        <div className="flex border-2 border-black h-8 shadow-sm">
                            {RucArray.map((digit, i) => (
                                <div key={i} className={`w-6 flex items-center justify-center font-bold text-sm ${i !== 0 ? 'border-l-2 border-black' : ''}`}>
                                    {digit}
                                </div>
                            ))}
                        </div>
                        <span className="whitespace-nowrap italic ml-10 mr-2 font-black text-[15px]">Clave:</span>
                        <div className="flex-grow border-b-2 border-black border-dashed pb-1 px-2 flex items-center justify-center font-black text-sm relative">
                            {hasSriKey ? (
                                <span className="text-emerald-600 flex items-center gap-1">
                                    CLAVE ENCONTRADA <span className="text-[10px]">✅</span>
                                </span>
                            ) : (
                                <span>{trabajo.estadoClave === 'LISTA' ? '************' : 'PENDIENTE'}</span>
                            )}
                        </div>
                    </div>

                    {/* FILA DE FECHAS Y HORAS */}
                    <div className="flex items-center justify-between pt-3 text-[13px]">
                        <div className="flex items-center">
                            <span className="italic whitespace-nowrap mr-2">Hora:</span>
                            <span className="font-black border-b-2 border-black border-dashed px-4 py-1">{hora}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="italic whitespace-nowrap">Fecha:</span>
                            <div className="flex border-2 border-black font-black text-sm shadow-sm bg-white">
                                <div className="px-3 py-1 border-r-2 border-black relative"><span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] bg-white px-1">DÍA</span>{dia}</div>
                                <div className="px-3 py-1 border-r-2 border-black relative"><span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] bg-white px-1">MES</span>{mes}</div>
                                <div className="px-3 py-1 relative"><span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] bg-white px-1">AÑO</span>{anio}</div>
                            </div>
                            {/* Días de la semana Checkboxes */}
                            <div className="flex bg-[#1f2124] text-white text-[10px] font-bold p-1 gap-px rounded ml-1 shadow-sm">
                                {['L','M','M','J','V','S'].map((d, i) => (
                                    <div key={i} className={`w-5 h-5 flex items-center justify-center rounded-sm ${d === 'M' && i===1 ? 'bg-white text-black' : ''}`}>{d}</div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="italic whitespace-nowrap border-b-2 border-black border-dashed flex-grow px-2 py-1">Hora y Entrega: </span>
                            <div className="flex bg-[#1f2124] text-white text-[10px] font-bold p-1 gap-px rounded shadow-sm">
                                {['L','M','M','J','V','S'].map((d, i) => {
                                    const deliveryDay = trabajo.fechaEntrega ? new Date(trabajo.fechaEntrega).getDay() : -1;
                                    // getDay() returns 0 for Sunday, 1 for Monday, etc.
                                    // Mapping: 1=L, 2=M, 3=M, 4=J, 5=V, 6=S
                                    const isTarget = (deliveryDay === (i + 1));
                                    return (
                                        <div key={i} className={`w-5 h-5 flex items-center justify-center rounded-sm transition-all ${isTarget ? 'bg-white text-black font-black scale-110 shadow-lg' : 'bg-white/10 text-white/30 border border-white/5'}`}>
                                            {d}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* TELEFONOS Y CORREO */}
                    <div className="flex items-end border-b-2 border-black border-dashed pb-1 pt-4">
                        <span className="whitespace-nowrap italic text-[13px]">Telef:</span>
                        <div className="flex items-center gap-3 mx-4 text-[11px]">
                            <span>Aument.</span><div className="w-4 h-4 border-2 border-black bg-white shadow-sm"></div>
                            <span>Cambiar</span><div className="w-4 h-4 border-2 border-black bg-white shadow-sm"></div>
                            <span>Mismo</span><div className="w-4 h-4 border-2 border-black flex items-center justify-center font-black pb-0.5 shadow-sm">x</div>
                        </div>
                        <span className="flex-grow font-black text-sm text-center">{cliente.telefono.join('  •  ')}</span>
                    </div>
                    <div className="flex items-end border-b-2 border-black border-dashed pb-1">
                        <span className="whitespace-nowrap italic mr-2 text-[13px]">Correo Electrónico:</span>
                        <span className="flex-grow font-black uppercase text-sm pl-2">{cliente.email}</span>
                    </div>
                </div>

                {/* 4. TABLA PRINCIPAL DE SOLICITUD */}
                <div className="mt-6 flex-grow border-4 border-[#1f2124] rounded-xl overflow-hidden flex flex-col shadow-sm">
                    <div className="bg-[#1f2124] text-white text-center py-2.5 font-black text-sm uppercase tracking-widest shadow-inner">
                        SOLICITO LA ELABORACIÓN DE LOS DOCUMENTOS DETALLADOS A CONTINUACIÓN:
                    </div>
                    <table className="w-full text-center text-xs font-bold text-black border-collapse flex-grow bg-white">
                        <thead>
                            <tr className="border-b-4 border-[#1f2124]">
                                <th className="py-2 border-r-2 border-black w-[12%]" rowSpan={2}>TAMAÑO</th>
                                <th className="py-2 px-2 border-r-2 border-black w-[35%]" rowSpan={2}>TIPO DE DOCUMENTO</th>
                                <th className="py-0 px-0 relative w-[13%] border-r-2 border-black" rowSpan={2}>
                                    <div className="py-1">PAPEL</div>
                                    <div className="flex text-[9px] mt-1 justify-center gap-0 border-t-2 border-black w-full pt-1 pb-1 uppercase font-black bg-gray-100">
                                        <span className="w-1/2 text-center">Químico</span>
                                        <span className="w-1/2 border-l-2 border-black text-center">Bond</span>
                                    </div>
                                </th>
                                <th className="py-2 text-[10px] border-r-2 border-black w-[10%]" rowSpan={2}>ESTABLEC.</th>
                                <th className="py-2 text-[10px] border-r-2 border-black w-[10%]" rowSpan={2}>PUNTO EMISIÓN</th>
                                <th className="py-2 border-r-2 border-black w-[10%]" rowSpan={2}>CANTIDAD</th>
                                <th className="py-2 w-[10%]" rowSpan={2}>PRECIO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mappedItems.map((item, idx) => (
                                <tr key={idx} className={`border-b-2 border-black ${item.isChecked ? 'bg-sky-50 print:bg-transparent' : ''}`}>
                                    <td className="py-1 border-r-2 border-black bg-gray-50/20 print:bg-transparent font-bold text-[10px] uppercase">{item.isChecked ? trabajo.tamano : ''}</td>
                                    <td className="text-center px-4 uppercase text-[12px] h-10 border-r-2 border-black font-black tracking-wide relative">
                                        {item.isChecked && <div className="absolute left-0 top-0 bottom-0 w-2 bg-brand-blue print:bg-black"></div>}
                                        {item.tipo}
                                    </td>
                                    <td className="p-0 align-middle border-r-2 border-black">
                                        <div className="flex h-full w-full justify-center gap-4 pt-1 pb-1">
                                            <div className="w-5 h-5 border-2 border-black bg-white flex items-center justify-center font-black pb-0.5">{item.isChecked ? 'x' : ''}</div>
                                            <div className="w-5 h-5 border-2 border-black bg-white"></div>
                                        </div>
                                    </td>
                                    <td className="py-2 font-mono text-base border-r-2 border-black bg-gray-50/50 print:bg-transparent">{item.estab}</td>
                                    <td className="py-2 font-mono text-base border-r-2 border-black bg-gray-50/50 print:bg-transparent">{item.punto}</td>
                                    <td className="py-2 text-xl font-black border-r-2 border-black bg-yellow-50/30 print:bg-transparent">{item.cant}</td>
                                    <td className="py-2 font-mono font-bold text-sm bg-gray-50/20 print:bg-transparent">{item.isChecked ? `$${item.precio}` : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-sm font-bold text-black pb-1 px-2 mb-2">
                    <span className="italic mr-2">Detalles adicionales:</span>
                    <div className="border-b-2 border-black border-dashed mt-6"></div>
                    <div className="border-b-2 border-black border-dashed mt-6"></div>
                </div>

                {/* 5. CINTA DE REGLAS ESTRICTAS / IMPORTANTE */}
                <div className="mt-4 bg-[#1f2124] text-white p-3 border-4 border-black text-[10px] font-bold flex">
                    <div className="w-[30%] px-4 text-2xl font-black uppercase tracking-widest flex items-center leading-none border-r-2 border-dashed border-white/30">
                        NOTA IMPORTANTE:
                    </div>
                    <div className="w-[70%] pl-6 flex flex-col justify-center">
                        <p className="mb-1 leading-snug">PASADO EL MES DE NO HABER RETIRADO SUS DOCUMENTOS (FACTURAS, RETENCIONES, GUÍAS, ETC) NO NOS HACEMOS RESPONSABLES DE SU ABONO Y TODO RECLAMO QUEDA ANULADO.</p>
                        <p className="text-sm uppercase font-black text-brand-red print:text-black mt-1">SIN RECIBO PIERDE EL DERECHO A RETIRAR SU TRABAJO Y SU DINERO</p>
                    </div>
                </div>

                {/* 6. PIE Y FIRMAS (CUADRO INFERIOR) */}
                <div className="mt-3 flex border-4 border-black text-xs text-black relative bg-white h-36">
                    {/* Legal Declare */}
                    <div className="w-[45%] p-4 border-r-4 border-black flex flex-col justify-between">
                        <p className="italic text-[11px] leading-relaxed text-justify">
                            Declaro que los datos proporcionados en esta solicitud son exactos y verdaderos, por lo que asumo la responsabilidad sobre su presentación.
                        </p>
                        <p className="text-[10px] font-bold text-justify">
                            Nota: En caso de que el trámite sea realizado por un tercero deberá adjuntar poder especial o general.
                        </p>
                    </div>
                    {/* Firma */}
                    <div className="w-[55%] flex flex-col justify-end p-4">
                        <div className="border-t-2 border-black border-dashed mx-auto w-[90%] pt-1 text-center font-black italic mb-3 text-sm">
                            Firma del Solicitante
                        </div>
                        <div className="space-y-3 mt-4 px-4 w-full">
                            <div className="flex items-end border-b-2 border-black border-dashed pb-0.5">
                                <span className="text-[10px] whitespace-nowrap italic mr-2">Razón social / Apellidos y nombre:</span>
                                <span className="flex-grow font-black text-[11px] uppercase text-center">{cliente.nombre}</span>
                            </div>
                            <div className="flex items-end border-b-2 border-black border-dashed pb-0.5">
                                <span className="text-[10px] whitespace-nowrap italic mr-2">C.I.:</span>
                                <span className="flex-grow font-black font-mono text-[12px] uppercase text-center">{cliente.cedula}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7. BARRA NEGRA TOTALES */}
                <div className="mt-3 bg-[#1f2124] text-white rounded-b-2xl px-8 py-4 flex justify-between font-black uppercase text-xl border-2 border-[#1f2124] shadow-inner items-center">
                    <div className="flex items-center gap-3">
                        <span className="tracking-widest">Valor $</span> 
                        <div className="bg-white text-black px-6 py-1 shadow-inner min-w-[100px] text-center rounded">{formatCurrency(trabajo.total).replace('$','')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="tracking-widest">Abona $</span> 
                        <div className="bg-white text-black px-6 py-1 shadow-inner min-w-[100px] text-center rounded">{formatCurrency(trabajo.abono).replace('$','')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="tracking-widest">Saldo $</span> 
                        <div className="bg-white text-black px-6 py-1 shadow-inner min-w-[100px] text-center rounded ring-2 ring-white/50">{formatCurrency(trabajo.saldo).replace('$','')}</div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
