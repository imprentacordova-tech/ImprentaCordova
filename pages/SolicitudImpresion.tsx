
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo, Regimen } from '../types';
import { PrinterIcon, MapPinIcon, PhoneIcon, ClockIcon, BuildingStorefrontIcon, CalendarDaysIcon, CheckBadgeIcon, CordovaLogo, ArrowDownTrayIcon, ArrowLeftIcon, ShieldCheckIcon, DocumentTextIcon, ExclamationTriangleIcon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

// Declare html2pdf for TypeScript
declare const html2pdf: any;

const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Por confirmar';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

const SolicitudImpresionPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [config, setConfig] = useState<NotaDeVentaConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!trabajoId) return;
            setLoading(true);
            const conf = getConfig();
            setConfig(conf);
            const [trabajosData, clientesData] = await Promise.all([getTrabajos(), getClientes()]);
            const currentTrabajo = trabajosData.find(t => t.id === trabajoId);
            
            if (currentTrabajo) {
                setTrabajo(currentTrabajo);
                const currentCliente = clientesData.find(c => c.id === currentTrabajo.clienteId);
                setCliente(currentCliente || null);
            }
            setLoading(false);
        };
        fetchData();
    }, [trabajoId]);

    const handleDownloadPdf = () => {
        const element = document.getElementById('solicitud-impresion-content');
        if (!element || !trabajo) return;
        const opt = {
          margin:       0,
          filename:     `Solicitud_Impresion_SRI_Orden_${trabajo.orden}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (loading || !config || !trabajo || !cliente) return <div className="p-20 text-center font-black text-brand-blue animate-pulse uppercase tracking-[0.3em]">Preparando Orden de Producción...</div>;

    // Lógica de numeración (Basada en la cantidad solicitada)
    const desdeNum = "0000001";
    const hastaNum = String(trabajo.cantidad).padStart(7, '0');

    return (
        <div className="bg-slate-200 min-h-screen py-10 flex flex-col items-center font-sans selection:bg-brand-red selection:text-white">
            <style>{`
                @media print {
                    @page { size: A5; margin: 0; }
                    body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #solicitud-impresion-content { 
                        box-shadow: none !important; 
                        border: none !important;
                        width: 148mm !important;
                        height: 210mm !important;
                        margin: 0 !important;
                        padding: 8mm !important;
                    }
                }
            `}</style>

            {/* BARRA DE HERRAMIENTAS SUPERIOR */}
            <div className="w-full max-w-[148mm] flex justify-between items-center mb-8 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 font-bold hover:text-brand-blue transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" /> Volver
                </button>
                <div className="flex gap-3">
                    <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-black rounded-xl shadow-sm hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest">
                        <ArrowDownTrayIcon className="w-4 h-4" /> Descargar PDF
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-8 py-2.5 bg-brand-blue text-white font-black rounded-xl shadow-xl hover:bg-blue-800 transition-all transform active:scale-95 text-[10px] uppercase tracking-widest">
                        <PrinterIcon className="w-4 h-4" /> Imprimir Orden
                    </button>
                </div>
            </div>

            {/* CONTENEDOR A5 (Documento Legal SRI) */}
            <div id="solicitud-impresion-content" className="bg-white shadow-2xl relative overflow-hidden flex flex-col border border-slate-300" style={{ width: '148mm', height: '210mm', padding: '10mm' }}>
                
                {/* TÍTULO OFICIAL SEGÚN REGLAMENTO */}
                <div className="bg-slate-100 p-2 text-center border-b border-slate-300 mb-4">
                    <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.1em]">Solicitud de Impresión de Documentos Autorizados</h2>
                    <p className="text-[7px] text-slate-500 font-bold uppercase">(Art. 25 del Reglamento de Comprobantes de Venta, Retención y Documentos Complementarios)</p>
                </div>

                <div className="relative z-10 h-full flex flex-col">
                    {/* Encabezado Maestro de la Imprenta */}
                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                        <div className="w-2/3">
                            <div className="flex items-center gap-3 mb-2">
                                <CordovaLogo className="h-8 w-auto" />
                                <div>
                                    <h1 className="text-lg font-black text-brand-blue tracking-tighter leading-none">IMPRENTA CÓRDOVA</h1>
                                    <p className="text-[7px] text-brand-red font-black uppercase tracking-[0.2em] mt-0.5">Establecimiento Autorizado SRI #1234</p>
                                </div>
                            </div>
                            <div className="text-[7.5px] text-slate-500 space-y-0.5 font-bold uppercase">
                                <p className="flex items-center gap-1"><MapPinIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorDireccionCompleta}</p>
                                <p className="flex items-center gap-1"><PhoneIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorTelefono} | {config.emisorEmail}</p>
                            </div>
                        </div>
                        <div className="w-1/3 flex flex-col items-end">
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-center shadow-md border border-slate-700 min-w-[100px]">
                                <span className="text-[6px] font-black uppercase tracking-widest block mb-0.5 opacity-60">Orden No.</span>
                                <span className="font-mono text-base font-black">{String(trabajo.orden).padStart(6, '0')}</span>
                            </div>
                            <p className="text-[7px] font-black text-slate-400 mt-1 uppercase">Emisión: {formatDateTime(trabajo.fechaEntrada)}</p>
                        </div>
                    </div>

                    {/* Ficha Técnica del Contribuyente Solicitante */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 relative">
                         <div className="absolute -top-2.5 left-4 bg-brand-blue text-white text-[7px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                            Datos del Contribuyente Solicitante
                        </div>
                        
                        <div className="grid grid-cols-12 gap-y-3 gap-x-4 text-[9px] mt-1">
                            <div className="col-span-8">
                                <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">Nombres y Apellidos / Razón Social</p>
                                <p className="font-black text-slate-900 uppercase text-xs leading-tight">{cliente.nombre}</p>
                                {cliente.nombreComercial && (
                                    <p className="text-[7px] text-brand-blue font-bold flex items-center gap-1 mt-0.5 italic"><BuildingStorefrontIcon className="w-2.5 h-2.5"/> {cliente.nombreComercial}</p>
                                )}
                            </div>
                            <div className="col-span-4 text-right">
                                <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">RUC / C.I.</p>
                                <p className="font-mono font-black text-slate-900 text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded inline-block">{cliente.ruc || cliente.cedula}</p>
                            </div>
                            
                            <div className="col-span-12">
                                <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">Dirección del Establecimiento (Matriz/Sucursal)</p>
                                <p className="font-bold text-slate-700 leading-tight bg-white p-2 rounded-lg border border-slate-100 italic">"{cliente.direccion}"</p>
                            </div>

                            <div className="col-span-3">
                                <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">Estab. - P. Emisión</p>
                                <div className="flex gap-1 font-mono text-xs font-black text-brand-red bg-red-50 p-1.5 rounded-lg justify-center border border-red-100">
                                    <span>{trabajo.establecimiento || '001'}</span>
                                    <span>-</span>
                                    <span>{trabajo.puntoEmision || '001'}</span>
                                </div>
                            </div>
                            <div className="col-span-9">
                                <p className="text-[6px] font-black text-slate-400 uppercase mb-0.5">Régimen Tributario Aplicable</p>
                                <div className="flex items-center gap-2 bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                                    <ShieldCheckIcon className="w-3.5 h-3.5 text-brand-blue" />
                                    <span className="font-black text-brand-blue uppercase text-[8px]">{cliente.regimen}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Especificaciones de la Solicitud de Impresión */}
                    <div className="mb-4 flex-grow">
                         <div className="flex items-center gap-2 mb-2">
                            <DocumentTextIcon className="w-3.5 h-3.5 text-slate-400" />
                            <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Detalle de Documentos Autorizados a Imprimir</h3>
                        </div>
                        
                        <table className="w-full text-[9px] border-collapse border border-slate-200">
                            <thead>
                                <tr className="bg-slate-900 text-white uppercase text-[7px] tracking-[0.1em]">
                                    <th className="py-2 px-3 text-left w-1/2">Descripción del Documento</th>
                                    <th className="py-2 px-1 text-center w-1/4 border-x border-slate-700">Rango Secuencial</th>
                                    <th className="py-2 px-3 text-right w-1/4">Valor Solicitado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="font-bold text-slate-700 bg-white">
                                    <td className="py-4 px-3">
                                        <p className="text-brand-blue uppercase font-black text-xs leading-none mb-1">{trabajo.subtipo}</p>
                                        <div className="flex gap-3 mt-1.5 opacity-70">
                                            <span className="text-[7px] bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Cant: {trabajo.cantidad}</span>
                                            <span className="text-[7px] bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Tamaño: {trabajo.tamano === 'Varios' ? '1/4 Oficio' : trabajo.tamano}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-1 text-center align-middle border-x border-slate-100">
                                        <div className="space-y-0.5">
                                            <p className="font-mono text-[8px] font-black text-slate-900">DESDE: {desdeNum}</p>
                                            <p className="font-mono text-[8px] font-black text-slate-900">HASTA: {hastaNum}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-3 text-right align-middle">
                                        <p className="text-base font-black text-slate-900 leading-none">{formatCurrency(trabajo.total)}</p>
                                        <p className="text-[6px] text-slate-400 uppercase font-bold mt-1">Abonado: {formatCurrency(trabajo.abono)}</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div className="grid grid-cols-4 gap-2 mt-2 text-center">
                            <div className="p-1.5 border border-slate-100 rounded-lg">
                                <p className="text-[5px] font-black text-slate-400 uppercase mb-0.5">Sustrato</p>
                                <p className="text-[7px] font-bold text-slate-800">Químico/Bond</p>
                            </div>
                            <div className="p-1.5 border border-slate-100 rounded-lg">
                                <p className="text-[5px] font-black text-slate-400 uppercase mb-0.5">Tintas</p>
                                <p className="text-[7px] font-bold text-slate-800">1 Color</p>
                            </div>
                            <div className="p-1.5 border border-slate-100 rounded-lg">
                                <p className="text-[5px] font-black text-slate-400 uppercase mb-0.5">Acabado</p>
                                <p className="text-[7px] font-bold text-slate-800">Engomado</p>
                            </div>
                            <div className="p-1.5 border border-slate-100 rounded-lg">
                                <p className="text-[5px] font-black text-slate-400 uppercase mb-0.5">Tipo Trabajo</p>
                                <p className="text-[7px] font-bold text-brand-red">FÍSICO</p>
                            </div>
                        </div>
                    </div>

                    {/* DECLARACIÓN JURAMENTADA Y RESPONSABILIDAD */}
                    <div className="bg-slate-900/5 p-3 rounded-lg mb-6 border-l-4 border-brand-red">
                        <div className="flex items-center gap-2 mb-1">
                            <ExclamationTriangleIcon className="w-3 h-3 text-brand-red" />
                            <h4 className="text-[7px] font-black text-slate-900 uppercase">Declaración de Responsabilidad del Contribuyente</h4>
                        </div>
                        <p className="text-[6.5px] text-slate-600 font-medium leading-[1.3] text-justify">
                            El contribuyente abajo firmante solicita la impresión de los documentos detallados y declara bajo juramento que la información proporcionada (RUC, razón social, dirección, régimen) es verídica y coincide con la base de datos del Servicio de Rentas Internas. Autoriza a Imprenta Córdova para realizar la solicitud de autorización ante el SRI a su nombre. El tiempo de entrega rige a partir de la confirmación de dicha autorización.
                        </p>
                    </div>

                    {/* Espacio para Firmas (Obligatorio para Archivo de Imprenta) */}
                    <div className="grid grid-cols-2 gap-10 mt-auto pb-4 px-2">
                        <div className="text-center">
                            <div className="border-t border-slate-400 w-full mb-1"></div>
                            <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest truncate">{cliente.nombre}</p>
                            <p className="text-[6px] text-slate-400 uppercase font-bold">Firma del Contribuyente / Solicitante</p>
                            <p className="text-[5px] text-slate-300 mt-0.5">C.I.: __________________________</p>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-slate-400 w-full mb-1"></div>
                            <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest">RESPONSABLE TÉCNICO</p>
                            <p className="text-[6px] text-slate-400 uppercase font-bold">Firma y Sello Imprenta Córdova</p>
                            <p className="text-[5px] text-slate-300 mt-0.5">Recepción de Solicitud</p>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 text-center flex justify-between items-center px-2">
                        <p className="text-[5px] text-slate-300 uppercase tracking-[0.2em]">DOCUMENTO DE ARCHIVO OBLIGATORIO PARA LA IMPRENTA (REGLAMENTO C.V.)</p>
                        <p className="text-[5px] text-slate-400 font-mono">v2.5.2025</p>
                    </div>
                </div>
            </div>
            
            {/* Disclaimer inferior no imprimible */}
            <div className="mt-6 text-center text-slate-400 text-xs font-medium max-w-lg no-print">
                <p>Este documento es el respaldo físico que el SRI exige que la imprenta mantenga firmado por cada contribuyente para solicitudes de impresión física.</p>
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
