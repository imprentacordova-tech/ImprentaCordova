
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
          filename:     `SolicitudSRI-Orden-${trabajo.orden}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (loading || !config || !trabajo || !cliente) return <div className="p-20 text-center font-black text-brand-blue animate-pulse uppercase tracking-[0.3em]">Preparando Orden de Producción...</div>;

    // Lógica de numeración (Simulada si no existe en el objeto)
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
                        padding: 10mm !important;
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

            {/* CONTENEDOR A5 */}
            <div id="solicitud-impresion-content" className="bg-white shadow-2xl relative overflow-hidden flex flex-col border border-slate-300" style={{ width: '148mm', height: '210mm', padding: '10mm' }}>
                
                {/* Decoración de seguridad superior */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue"></div>

                <div className="relative z-10 h-full flex flex-col">
                    {/* Encabezado Maestro */}
                    <div className="flex justify-between items-start mb-6 border-b-2 border-slate-100 pb-4">
                        <div className="w-2/3">
                            <div className="flex items-center gap-3 mb-2">
                                <CordovaLogo className="h-10 w-auto" />
                                <div>
                                    <h1 className="text-xl font-black text-brand-blue tracking-tighter leading-none">IMPRENTA CÓRDOVA</h1>
                                    <p className="text-[8px] text-brand-red font-black uppercase tracking-[0.2em] mt-0.5">Autorizada por el SRI #1234</p>
                                </div>
                            </div>
                            <div className="text-[7.5px] text-slate-500 space-y-0.5 font-bold uppercase">
                                <p className="flex items-center gap-1"><MapPinIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorDireccionCompleta}</p>
                                <p className="flex items-center gap-1"><PhoneIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorTelefono} | {config.emisorEmail}</p>
                            </div>
                        </div>
                        <div className="w-1/3 flex flex-col items-end">
                            <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-center shadow-lg border border-slate-700 min-w-[120px]">
                                <span className="text-[7px] font-black uppercase tracking-widest block mb-0.5 opacity-60">Orden de Producción</span>
                                <span className="font-mono text-lg font-black">{String(trabajo.orden).padStart(6, '0')}</span>
                            </div>
                            <p className="text-[8px] font-black text-slate-400 mt-2 uppercase">Fecha: {formatDateTime(trabajo.fechaEntrada)}</p>
                        </div>
                    </div>

                    {/* Ficha Técnica del Contribuyente */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6 relative">
                         <div className="absolute -top-3 left-6 bg-brand-blue text-white text-[8px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-md">
                            Datos del Contribuyente
                        </div>
                        
                        <div className="grid grid-cols-12 gap-y-4 gap-x-6 text-[10px] mt-2">
                            <div className="col-span-8">
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Razón Social</p>
                                <p className="font-black text-slate-900 uppercase text-xs leading-tight">{cliente.nombre}</p>
                                {cliente.nombreComercial && (
                                    <p className="text-[8px] text-brand-blue font-bold flex items-center gap-1 mt-1 italic"><BuildingStorefrontIcon className="w-3 h-3"/> {cliente.nombreComercial}</p>
                                )}
                            </div>
                            <div className="col-span-4 text-right">
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">RUC / C.I.</p>
                                <p className="font-mono font-black text-slate-900 text-sm bg-white border border-slate-200 px-2 py-1 rounded-md inline-block">{cliente.ruc || cliente.cedula}</p>
                            </div>
                            
                            <div className="col-span-12">
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Dirección del Establecimiento</p>
                                <p className="font-bold text-slate-700 leading-tight bg-white p-2.5 rounded-lg border border-slate-100 italic">"{cliente.direccion}"</p>
                            </div>

                            <div className="col-span-4">
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Punto Emisión</p>
                                <div className="flex gap-1 font-mono text-xs font-black text-brand-red bg-red-50 p-2 rounded-lg justify-center border border-red-100">
                                    <span>{trabajo.establecimiento || '001'}</span>
                                    <span>-</span>
                                    <span>{trabajo.puntoEmision || '001'}</span>
                                </div>
                            </div>
                            <div className="col-span-8">
                                <p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">Régimen Fiscal</p>
                                <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                    <ShieldCheckIcon className="w-4 h-4 text-brand-blue" />
                                    <span className="font-black text-brand-blue uppercase text-[9px]">{cliente.regimen}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detalle de Impresión Autorizada */}
                    <div className="mb-6 flex-grow">
                         <div className="flex items-center gap-2 mb-3">
                            <DocumentTextIcon className="w-4 h-4 text-slate-400" />
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Especificaciones de Producción</h3>
                        </div>
                        
                        <table className="w-full text-[10px] border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white uppercase text-[8px] tracking-[0.15em]">
                                    <th className="py-2.5 px-4 text-left rounded-tl-xl w-1/2">Descripción del Producto</th>
                                    <th className="py-2.5 px-2 text-center w-1/4">Numeración</th>
                                    <th className="py-2.5 px-4 text-right rounded-tr-xl w-1/4">Inversión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 border-x border-b border-slate-100 rounded-b-xl">
                                <tr className="font-bold text-slate-700 bg-white">
                                    <td className="py-5 px-4">
                                        <p className="text-brand-blue uppercase font-black text-xs leading-none mb-1">{trabajo.subtipo}</p>
                                        <div className="flex gap-4 mt-2">
                                            <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">Cant: {trabajo.cantidad}</span>
                                            <span className="text-[8px] bg-slate-100 px-2 py-0.5 rounded uppercase tracking-tighter">Tamaño: {trabajo.tamano === 'Varios' ? '1/4 Oficio' : trabajo.tamano}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-2 text-center align-middle">
                                        <div className="space-y-1">
                                            <p className="font-mono text-[9px] font-black text-slate-900">DE: {desdeNum}</p>
                                            <p className="font-mono text-[9px] font-black text-slate-900">A: {hastaNum}</p>
                                        </div>
                                    </td>
                                    <td className="py-5 px-4 text-right align-middle">
                                        <p className="text-lg font-black text-slate-900 leading-none">{formatCurrency(trabajo.total)}</p>
                                        <p className="text-[7px] text-slate-400 uppercase font-bold mt-1">Abono: {formatCurrency(trabajo.abono)}</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                            <div className="p-2 border border-slate-100 rounded-xl">
                                <p className="text-[6px] font-black text-slate-400 uppercase mb-1">Papel</p>
                                <p className="text-[8px] font-bold text-slate-800">Químico Autocopiativo</p>
                            </div>
                            <div className="p-2 border border-slate-100 rounded-xl">
                                <p className="text-[6px] font-black text-slate-400 uppercase mb-1">Tintas</p>
                                <p className="text-[8px] font-bold text-slate-800">1 Color (Negro/Azul)</p>
                            </div>
                            <div className="p-2 border border-slate-100 rounded-xl">
                                <p className="text-[6px] font-black text-slate-400 uppercase mb-1">Acabado</p>
                                <p className="text-[8px] font-bold text-slate-800">Engomado / Perforado</p>
                            </div>
                        </div>
                    </div>

                    {/* Términos y Condiciones */}
                    <div className="bg-slate-900/5 p-4 rounded-xl mb-6 border-l-4 border-brand-red">
                        <div className="flex items-center gap-2 mb-1.5">
                            <ExclamationTriangleIcon className="w-3 h-3 text-brand-red" />
                            <h4 className="text-[8px] font-black text-slate-900 uppercase">Cláusulas de Responsabilidad</h4>
                        </div>
                        <ul className="text-[7px] text-slate-600 space-y-1 font-medium leading-tight">
                            <li>• El cliente declara que los datos de RUC, Establecimiento y Punto de Emisión son verídicos.</li>
                            <li>• La imprenta no se responsabiliza por errores en datos proporcionados por el cliente una vez aprobada el arte.</li>
                            <li>• El tiempo estimado de entrega es de 24 a 48 horas laborables tras la autorización del SRI.</li>
                            <li>• Los trabajos no retirados después de 60 días serán reciclados sin derecho a devolución de abono.</li>
                        </ul>
                    </div>

                    {/* Firmas de Responsabilidad */}
                    <div className="grid grid-cols-2 gap-12 mt-auto pb-6">
                        <div className="text-center">
                            <div className="border-t border-slate-300 w-full mb-2"></div>
                            <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest truncate">{cliente.nombre}</p>
                            <p className="text-[7px] text-slate-400 uppercase font-bold">Firma Autorizada Cliente</p>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-slate-300 w-full mb-2"></div>
                            <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest">ÁREA TÉCNICA CÓRDOVA</p>
                            <p className="text-[7px] text-slate-400 uppercase font-bold">Control de Calidad Imprenta</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 text-center">
                        <p className="text-[6px] text-slate-300 uppercase tracking-[0.4em]">SISTEMA MAESTRO DE PRODUCCIÓN v2.5 — IMPRENTA CÓRDOVA — PASAJE EL ORO</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
