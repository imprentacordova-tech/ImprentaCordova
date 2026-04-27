import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const format = queryParams.get('format') || 'a4'; // 'a4' o 'a5'
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
                    .page-container {
                        width: 210mm;
                        min-height: 297mm;
                        background: white;
                        margin: 0 auto;
                        position: relative;
                        box-sizing: border-box;
                    }
                    /* Ocultar bordes de la vista web en impresión */
                    .web-shadow { box-shadow: none !important; }
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

    // Función principal para renderizar el formulario (ya sea la mitad A5 o la A4 completa)
    const renderFormulario = (variant: 'cliente' | 'imprenta' | 'full') => {
        // Configuraciones de color dinámicas según la variante
        const isClient = variant === 'cliente';
        
        const headerBg = isClient ? 'bg-amber-100' : 'bg-[#1f2124]';
        const headerBorder = isClient ? 'border-amber-600' : 'border-[#1f2124]';
        const headerText = isClient ? 'text-amber-900' : 'text-white';
        const accentText = isClient ? 'text-amber-700' : 'text-brand-blue';
        const subtitleBg = isClient ? 'bg-amber-50' : 'bg-gray-200';
        const tableHeaderBg = isClient ? 'bg-amber-600' : 'bg-[#1f2124]';
        const tableBorder = isClient ? 'border-amber-600' : 'border-[#1f2124]';
        const cintaBg = isClient ? 'bg-amber-700' : 'bg-[#1f2124]';
        const totalBg = isClient ? 'bg-amber-800' : 'bg-[#1f2124]';
        const checkboxActive = isClient ? 'bg-amber-100 text-amber-900' : 'bg-sky-50 text-black';
        
        // Ajustes de tamaño si es A5 (Doble)
        const isA5 = format === 'a5';
        const paddingClass = isA5 ? 'p-3' : 'p-6';
        const mainTextSize = isA5 ? 'text-[10px]' : 'text-xs';
        const titleSize = isA5 ? 'text-2xl' : 'text-4xl';
        const subtitleSize = isA5 ? 'text-sm' : 'text-xl';
        const tableTextSize = isA5 ? 'text-[9px]' : 'text-xs';
        const cintaTextSize = isA5 ? 'text-[8px]' : 'text-[10px]';

        return (
            <div className={`relative flex flex-col box-border text-black ${paddingClass} h-full ${variant === 'imprenta' ? 'border-t-2 border-dashed border-gray-400 mt-2 pt-4' : ''}`}>
                
                {/* 1. HEADER */}
                <div className={`${headerBg} ${headerText} rounded-t-xl overflow-hidden border-2 ${headerBorder} flex flex-col shadow-inner`}>
                    <div className={`flex justify-between items-center px-4 py-1 ${isClient ? 'bg-amber-200' : 'bg-[#1a1c1e]'}`}>
                        <h1 className={`${titleSize} font-black italic tracking-tighter w-full text-center`} style={{ fontFamily: 'Impact, sans-serif' }}>
                            <span className={`${headerText} ${isA5?'text-3xl':'text-5xl'} mr-2`}>I</span>IMPRENTA CORDOVA
                        </h1>
                    </div>
                    <div className={`px-4 ${isA5?'py-1':'py-2'} text-center border-t ${isClient ? 'border-amber-900/20' : 'border-white/20'}`}>
                        <div className={`flex justify-center flex-wrap gap-x-2 ${isA5?'text-[9px]':'text-[11px]'} font-bold`}>
                            <span>Direc.: {config.emisorDireccionMatriz || 'Colón e/ Sucre y Av. Rocafuerte'}</span>
                            <span className="flex items-center gap-1 mx-2"><PrinterIcon className="w-3 h-3"/> {config.emisorTelefono || '0993083943 • 0962585172'}</span>
                        </div>
                        <div className={`flex justify-center flex-wrap gap-x-4 mt-0.5 ${isA5?'text-[9px]':'text-[11px]'} items-center`}>
                            <span className={`font-bold underline decoration-${isClient?'amber-900':'white'}/50 underline-offset-2`}>RUC: {config.emisorRuc || '0702065319001'}</span>
                            <span>•</span>
                            <span className="font-bold">CODIGO AUT SRI: {config.imprentaAutorizacion || '8634'}</span>
                            <span>•</span>
                            <span className={`flex items-center gap-1 ${isA5?'text-[8px]':'text-[10px]'}`}>Email: {config.emisorEmail || 'imprentacordova@gmail.com'}</span>
                        </div>
                    </div>
                </div>

                {/* 2. TÍTULO SECUNDARIO */}
                <div className={`${subtitleBg} border-x-2 border-b-2 ${headerBorder} text-center ${isA5?'py-1':'py-2'} px-2 relative z-10 flex items-center justify-center gap-4`} style={{ backgroundImage: 'radial-gradient(#999 1px, transparent 1px)', backgroundSize: '4px 4px' }}>
                    <h2 className={`${subtitleSize} font-black text-black uppercase tracking-widest bg-white/95 inline-block px-6 ${isA5?'py-0':'py-0.5'} rounded shadow-sm border border-slate-300`}>
                        Solicitud de Autorización de Impresión SRI
                    </h2>
                    {isContingencyLimit && (
                        <div className="bg-brand-red text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter shadow-lg border-2 border-white animate-pulse">
                            Límite Contingencia: 25H
                        </div>
                    )}
                </div>
                
                <div className="absolute right-4 top-2 bg-white/90 rounded border-2 border-black px-2 py-0.5 font-black text-[10px] uppercase shadow-md z-20 transform rotate-3">
                    {isClient ? 'Copia CLIENTE' : variant === 'imprenta' ? 'Copia IMPRENTA' : 'ORIGINAL'}
                </div>

                {/* 3. DATOS DEL CLIENTE */}
                <div className={`${isA5?'mt-2':'mt-6'} px-1 space-y-${isA5?'2':'4'} ${mainTextSize} font-bold font-sans text-black`}>
                    <div className="flex items-end border-b-2 border-black border-dashed pb-0.5">
                        <span className={`whitespace-nowrap italic mr-2 ${isA5?'text-[11px]':'text-[13px]'}`}>Apellidos y Nombres:</span>
                        <span className={`flex-grow font-black uppercase ${isA5?'text-xs':'text-sm'}`}>{cliente.nombre}</span>
                    </div>
                    <div className="flex items-end border-b-2 border-black border-dashed pb-0.5">
                        <span className={`whitespace-nowrap italic mr-2 ${isA5?'text-[11px]':'text-[13px]'}`}>Razón Social:</span>
                        <span className={`flex-grow font-black uppercase ${isA5?'text-xs':'text-sm'}`}>{cliente.nombreComercial || cliente.nombre}</span>
                    </div>
                    <div className="flex items-end border-b-2 border-black border-dashed pb-0.5">
                        <span className={`whitespace-nowrap italic mr-2 ${isA5?'text-[11px]':'text-[13px]'}`}>Actividad Ec.:</span>
                        <span className={`flex-grow font-black uppercase ${isA5?'text-xs':'text-sm'}`}>{cliente.actividades || trabajo.actividadSeleccionada || 'SEGÚN RUC'}</span>
                        {isRimpe && <span className={`ml-2 bg-black text-white ${isA5?'text-[7px]':'text-[8px]'} font-black px-2 py-0.5 rounded uppercase tracking-wider`}>RIMPE N.P.</span>}
                    </div>
                    
                    {cliente.regimen === Regimen.NEGOCIO_POPULAR && (
                        <div className="flex items-end border-b-2 border-black border-dashed pb-0.5 pt-0.5">
                            <span className={`whitespace-nowrap italic mr-2 ${isA5?'text-[11px]':'text-[13px]'}`}>Cumplimiento Tributario:</span>
                            <div className="flex items-center gap-2 flex-grow">
                                <div className={`${isA5?'w-3 h-3 text-[8px]':'w-4 h-4 text-[10px]'} border-2 border-black flex items-center justify-center font-black pb-0.5 bg-white`}>x</div>
                                <span className={`font-black ${isA5?'text-xs':'text-sm'} uppercase`}>Al día: verificado {dia}/{mes}/{anio}</span>
                            </div>
                        </div>
                    )}
                    
                    {/* FILA DE RUC */}
                    <div className={`flex items-end pb-0.5 ${isA5?'pt-1':'pt-2'}`}>
                        <span className={`whitespace-nowrap italic mr-4 font-black ${isA5?'text-[12px]':'text-[15px]'}`}>RUC:</span>
                        <div className={`flex border-2 border-black ${isA5?'h-6':'h-8'} shadow-sm`}>
                            {RucArray.map((digit, i) => (
                                <div key={i} className={`${isA5?'w-4':'w-6'} flex items-center justify-center font-bold ${isA5?'text-xs':'text-sm'} ${i !== 0 ? 'border-l-2 border-black' : ''}`}>
                                    {digit}
                                </div>
                            ))}
                        </div>
                        <span className={`whitespace-nowrap italic ml-6 mr-2 font-black ${isA5?'text-[12px]':'text-[15px]'}`}>Clave:</span>
                        <div className={`flex-grow border-b-2 border-black border-dashed pb-0.5 px-2 flex items-center justify-center font-black ${isA5?'text-xs':'text-sm'} relative`}>
                            {hasSriKey ? (
                                <span className="text-emerald-600 flex items-center gap-1">
                                    ENCONTRADA <span className="text-[10px]">✅</span>
                                </span>
                            ) : (
                                <span>{trabajo.estadoClave === 'LISTA' ? '************' : 'PENDIENTE'}</span>
                            )}
                        </div>
                    </div>

                    {/* FILA DE FECHAS */}
                    <div className={`flex items-center justify-between ${isA5?'pt-1':'pt-3'} ${isA5?'text-[11px]':'text-[13px]'}`}>
                        <div className="flex items-center">
                            <span className="italic whitespace-nowrap mr-2">Hora:</span>
                            <span className="font-black border-b-2 border-black border-dashed px-2 py-0.5">{hora}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="italic whitespace-nowrap">Fecha:</span>
                            <div className={`flex border-2 border-black font-black ${isA5?'text-xs':'text-sm'} shadow-sm bg-white`}>
                                <div className={`px-2 ${isA5?'py-0.5':'py-1'} border-r-2 border-black relative`}><span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] bg-white px-1">DÍA</span>{dia}</div>
                                <div className={`px-2 ${isA5?'py-0.5':'py-1'} border-r-2 border-black relative`}><span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] bg-white px-1">MES</span>{mes}</div>
                                <div className={`px-2 ${isA5?'py-0.5':'py-1'} relative`}><span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[7px] bg-white px-1">AÑO</span>{anio}</div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <span className="italic whitespace-nowrap border-b-2 border-black border-dashed flex-grow px-1 py-0.5">Entrega: </span>
                            <div className={`flex ${headerBg} ${headerText} text-[9px] font-bold p-0.5 gap-px rounded shadow-sm`}>
                                {['L','M','M','J','V','S'].map((d, i) => {
                                    const deliveryDay = trabajo.fechaEntrega ? new Date(trabajo.fechaEntrega).getDay() : -1;
                                    const isTarget = (deliveryDay === (i + 1));
                                    return (
                                        <div key={i} className={`w-4 h-4 flex items-center justify-center rounded-sm transition-all ${isTarget ? 'bg-white text-black font-black scale-110 shadow-lg' : 'opacity-50'}`}>
                                            {d}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* TELEFONOS */}
                    <div className={`flex items-end border-b-2 border-black border-dashed pb-0.5 ${isA5?'pt-1':'pt-3'}`}>
                        <span className={`whitespace-nowrap italic ${isA5?'text-[11px]':'text-[13px]'}`}>Telef:</span>
                        <div className={`flex items-center gap-2 mx-2 ${isA5?'text-[9px]':'text-[11px]'}`}>
                            <span>Mismo</span><div className="w-3 h-3 border border-black flex items-center justify-center font-black pb-0.5 shadow-sm">x</div>
                        </div>
                        <span className={`flex-grow font-black ${isA5?'text-xs':'text-sm'} text-center`}>{cliente.telefono.join('  •  ')}</span>
                    </div>
                </div>

                {/* 4. TABLA PRINCIPAL DE SOLICITUD */}
                <div className={`${isA5?'mt-2':'mt-6'} flex-grow border-4 ${tableBorder} rounded-xl overflow-hidden flex flex-col shadow-sm`}>
                    <div className={`${tableHeaderBg} text-white text-center ${isA5?'py-1':'py-2.5'} font-black ${isA5?'text-xs':'text-sm'} uppercase tracking-widest shadow-inner`}>
                        SOLICITO LA ELABORACIÓN DE LOS DOCUMENTOS:
                    </div>
                    <table className={`w-full text-center ${tableTextSize} font-bold text-black border-collapse flex-grow bg-white`}>
                        <thead>
                            <tr className={`border-b-4 ${tableBorder}`}>
                                <th className={`py-1 border-r-2 border-black w-[12%]`} rowSpan={2}>TAMAÑO</th>
                                <th className={`py-1 px-1 border-r-2 border-black w-[35%]`} rowSpan={2}>TIPO DE DOCUMENTO</th>
                                <th className="py-0 px-0 relative w-[13%] border-r-2 border-black" rowSpan={2}>
                                    <div className="py-0.5">PAPEL</div>
                                </th>
                                <th className="py-1 text-[8px] border-r-2 border-black w-[10%]" rowSpan={2}>ESTAB.</th>
                                <th className="py-1 text-[8px] border-r-2 border-black w-[10%]" rowSpan={2}>PUNTO E.</th>
                                <th className="py-1 border-r-2 border-black w-[10%]" rowSpan={2}>CANT.</th>
                                <th className="py-1 w-[10%]" rowSpan={2}>PRECIO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mappedItems.map((item, idx) => (
                                <tr key={idx} className={`border-b border-black ${item.isChecked ? checkboxActive : ''}`}>
                                    <td className={`py-0.5 border-r border-black font-bold text-[9px] uppercase ${item.isChecked?'':'text-transparent'}`}>{item.isChecked ? trabajo.tamano : '-'}</td>
                                    <td className={`text-left pl-2 uppercase ${isA5?'text-[10px]':'text-[12px]'} ${isA5?'h-6':'h-8'} border-r border-black font-black tracking-wide relative`}>
                                        {item.isChecked && <div className={`absolute left-0 top-0 bottom-0 w-1 ${isClient?'bg-amber-600':'bg-[#1f2124]'}`}></div>}
                                        {item.tipo}
                                    </td>
                                    <td className="p-0 align-middle border-r border-black">
                                        <div className="flex h-full w-full justify-center gap-2">
                                            {item.isChecked && <div className="w-3 h-3 border border-black bg-white flex items-center justify-center font-black pb-0.5">x</div>}
                                        </div>
                                    </td>
                                    <td className="py-0.5 font-mono border-r border-black">{item.isChecked?item.estab:''}</td>
                                    <td className="py-0.5 font-mono border-r border-black">{item.isChecked?item.punto:''}</td>
                                    <td className={`py-0.5 ${isA5?'text-sm':'text-xl'} font-black border-r border-black`}>{item.isChecked?item.cant:''}</td>
                                    <td className="py-0.5 font-mono font-bold">${item.isChecked ? item.precio : ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 5. CINTA DE REGLAS */}
                <div className={`${isA5?'mt-2':'mt-4'} ${cintaBg} text-white ${isA5?'p-1.5':'p-3'} border-2 border-black ${cintaTextSize} font-bold flex`}>
                    <div className="w-[30%] px-2 text-lg font-black uppercase tracking-widest flex items-center leading-none border-r border-dashed border-white/30">
                        IMPORTANTE:
                    </div>
                    <div className="w-[70%] pl-3 flex flex-col justify-center">
                        <p className="mb-0.5 leading-tight">PASADO EL MES NO NOS HACEMOS RESPONSABLES. SIN RECIBO PIERDE DERECHO A RETIRAR EL TRABAJO.</p>
                    </div>
                </div>

                {/* 6. PIE Y FIRMAS */}
                <div className={`${isA5?'mt-2':'mt-3'} flex border-2 border-black text-[9px] text-black relative bg-white ${isA5?'h-20':'h-32'}`}>
                    {/* Legal Declare */}
                    <div className="w-[45%] p-2 border-r-2 border-black flex flex-col justify-between">
                        <p className="italic leading-tight text-justify">
                            Declaro que los datos son exactos, asumo la responsabilidad. En caso de terceros, adjuntar poder especial.
                        </p>
                    </div>
                    {/* Firma */}
                    <div className="w-[55%] flex flex-col justify-end p-2">
                        <div className="border-t border-black border-dashed mx-auto w-[80%] pt-0.5 text-center font-black italic mb-1">
                            Firma del Solicitante
                        </div>
                    </div>
                </div>

                {/* 7. BARRA TOTALES */}
                <div className={`${isA5?'mt-2':'mt-3'} ${totalBg} text-white rounded-b-xl px-4 ${isA5?'py-2':'py-4'} flex justify-between font-black uppercase ${isA5?'text-sm':'text-xl'} border-2 border-black shadow-inner items-center`}>
                    <div className="flex items-center gap-2">
                        <span>Valor</span> 
                        <div className="bg-white text-black px-2 shadow-inner min-w-[60px] text-center rounded">{formatCurrency(trabajo.total).replace('$','')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Abona</span> 
                        <div className="bg-white text-black px-2 shadow-inner min-w-[60px] text-center rounded">{formatCurrency(trabajo.abono).replace('$','')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Saldo</span> 
                        <div className="bg-white text-black px-2 shadow-inner min-w-[60px] text-center rounded ring-1 ring-white/50">{formatCurrency(trabajo.saldo).replace('$','')}</div>
                    </div>
                </div>

            </div>
        );
    };

    return (
        <div className="bg-slate-300 min-h-screen py-12 flex flex-col items-center overflow-y-auto font-sans">
            {/* ... */}
            {/* Ocultado el CSS global del render principal anterior porque se inyectó arriba */}

            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 no-print px-6 py-4 bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase tracking-widest hover:text-brand-blue transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
                    <ArrowLeftIcon className="w-4 h-4" /> Volver
                </button>
                <div className="flex gap-3">
                    <div className="bg-brand-blue/10 text-brand-blue font-bold px-4 py-2 rounded-xl text-xs uppercase flex items-center border border-brand-blue/20">
                        MODO: {format === 'a5' ? 'DOBLE (A5)' : 'COMPLETO (A4)'}
                    </div>
                    <button onClick={handleDownloadPdf} className="bg-white border-2 border-slate-200 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:border-brand-blue/30 transition-all flex items-center gap-2 shadow-sm text-slate-700">
                        <ArrowDownTrayIcon className="w-4 h-4" /> Descargar PDF
                    </button>
                    <button onClick={() => window.print()} className="bg-[#1f2124] text-white px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-black/30 flex items-center gap-2 hover:bg-black transition-all">
                        <PrinterIcon className="w-4 h-4"/> Imprimir Hoja
                    </button>
                </div>
            </div>

            {/* CONTENEDOR PRINCIPAL A4 */}
            <div id="documento-maestro-sri" className="page-container web-shadow shadow-2xl rounded">
                {format === 'a5' ? (
                    <div className="flex flex-col h-[297mm]">
                        {/* MITAD SUPERIOR: CLIENTE */}
                        <div className="h-[148.5mm] overflow-hidden">
                            {renderFormulario('cliente')}
                        </div>
                        {/* LÍNEA DE CORTE */}
                        <div className="w-full h-0 border-t-2 border-dashed border-gray-400 my-0 relative z-50">
                            <span className="absolute left-4 -top-3 bg-white px-2 text-[10px] text-gray-500 font-mono">✂ Línea de corte / Perforado</span>
                        </div>
                        {/* MITAD INFERIOR: IMPRENTA */}
                        <div className="h-[148.5mm] overflow-hidden">
                            {renderFormulario('imprenta')}
                        </div>
                    </div>
                ) : (
                    <div className="h-[297mm]">
                        {renderFormulario('full')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
