
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo, Regimen, TrabajoTipo } from '../types';
import { 
    PrinterIcon, MapPinIcon, PhoneIcon, ClockIcon, 
    BuildingStorefrontIcon, CalendarDaysIcon, CheckBadgeIcon, 
    CordovaLogo, ArrowDownTrayIcon, ArrowLeftIcon, 
    ShieldCheckIcon, DocumentTextIcon, ExclamationTriangleIcon,
    BoxIcon, ReceiptIcon, Loader2Icon, EnvelopeIcon, KeyIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

declare const html2pdf: any;

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
            setConfig(getConfig());
            const [trabajosData, clientesData] = await Promise.all([getTrabajos(), getClientes()]);
            const currentTrabajo = trabajosData.find(t => t.id === trabajoId);
            if (currentTrabajo) {
                setTrabajo(currentTrabajo);
                setCliente(clientesData.find(c => c.id === currentTrabajo.clienteId) || null);
            }
            setLoading(false);
        };
        fetchData();
    }, [trabajoId]);

    const handleDownloadPdf = () => {
        const element = document.getElementById('documento-maestro-layout');
        if (!element || !trabajo) return;
        const opt = {
            margin: 0,
            filename: `Orden-${trabajo.orden}-${cliente?.nombre}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (loading || !config || !trabajo || !cliente) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <Loader2Icon className="w-10 h-10 text-brand-blue animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Generando Documento de Orden...</p>
            </div>
        </div>
    );

    // Validación estricta para determinar si es un trabajo que requiere datos del SRI
    const isSRI = trabajo.tipo === TrabajoTipo.SRI || String(trabajo.tipo).toLowerCase() === 'sri';
    const isQuimico = trabajo.subtipo.toLowerCase().includes('químico') || trabajo.subtipo.toLowerCase().includes('quimico');

    return (
        <div className="bg-slate-200 min-h-screen py-12 flex flex-col items-center overflow-y-auto">
            <style>{`
                @media print {
                    @page { size: A5; margin: 0; }
                    body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #documento-maestro-layout { 
                        box-shadow: none !important; 
                        border: none !important;
                        width: 100% !important;
                        height: 100vh !important;
                        margin: 0 !important;
                        padding: 8mm !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-[148mm] flex justify-between mb-8 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:text-brand-blue transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" /> Volver al Taller
                </button>
                <div className="flex gap-3">
                    <button onClick={handleDownloadPdf} className="bg-white border-2 border-slate-300 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                        <ArrowDownTrayIcon className="w-4 h-4" /> PDF
                    </button>
                    <button onClick={() => window.print()} className="bg-brand-blue text-white px-8 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-brand-navy transition-all">
                        <PrinterIcon className="w-4 h-4"/> Imprimir Orden
                    </button>
                </div>
            </div>

            <div id="documento-maestro-layout" className="bg-white shadow-2xl border border-slate-300 relative flex flex-col" style={{ width: '148mm', minHeight: '210mm', padding: '10mm' }}>
                
                {/* ENCABEZADO */}
                <div className="flex justify-between items-start border-b-4 border-brand-blue pb-4 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-blue p-2 rounded-2xl shadow-lg">
                            <CordovaLogo className="h-12 w-auto object-contain brightness-0 invert" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-brand-blue tracking-tighter leading-none">IMPRENTA <span className="text-brand-red">CÓRDOVA</span></h1>
                            <div className="text-[7px] font-bold text-slate-500 uppercase mt-1 leading-tight">
                                <p className="flex items-center gap-1"><MapPinIcon className="w-2 h-2 text-brand-red"/> {config.emisorDireccionCompleta}</p>
                                <p className="flex items-center gap-3">
                                    <span className="flex items-center gap-1"><PhoneIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorTelefono}</span>
                                    <span className="flex items-center gap-1"><EnvelopeIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorEmail}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-brand-blue text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mb-1 shadow-md">ORDEN DE PRODUCCIÓN</div>
                        <p className="text-xs font-black text-slate-400 tracking-widest uppercase">Nro. Control</p>
                        <p className="text-2xl font-mono font-black text-brand-red leading-none">#{String(trabajo.orden).padStart(6, '0')}</p>
                    </div>
                </div>

                {/* FICHA TÉCNICA */}
                <div className={`grid grid-cols-12 gap-y-3 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 ${!isSRI ? 'items-center' : ''}`}>
                    <div className="col-span-8">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Razón Social</span>
                        <span className="text-xs font-black text-slate-900 uppercase leading-none">{cliente.nombre}</span>
                    </div>
                    <div className="col-span-4 text-right border-l border-slate-200 pl-4">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">RUC / C.I.</span>
                        <span className="text-xs font-mono font-bold text-slate-900">{cliente.ruc || cliente.cedula}</span>
                    </div>

                    {/* ESTA SECCIÓN SOLO APARECE PARA TRABAJOS SRI */}
                    {isSRI && (
                        <div className="col-span-12 border-t border-slate-200 pt-2 flex justify-between items-end animate-fade-in">
                            <div className="flex-1">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1">GESTIÓN SEGURIDAD SRI</span>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${trabajo.estadoClave === 'LISTA' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                        <span className="text-[8px] font-black uppercase text-slate-600">CLAVE: {trabajo.estadoClave}</span>
                                    </div>
                                    <div className="bg-white px-3 py-1 rounded-md border border-slate-200 min-w-[120px]">
                                        <span className="text-[9px] font-mono font-bold text-brand-blue uppercase">
                                            {trabajo.imprimirClave ? trabajo.claveAcceso : "********* (PROTEGIDA)"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Estab - P.Emi</span>
                                <span className="text-xs font-mono font-black text-brand-blue">{trabajo.establecimiento || '001'} - {trabajo.puntoEmision || '001'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* DETALLE */}
                <div className="mb-6 flex-grow">
                    <h3 className="text-[8px] font-black text-brand-blue uppercase tracking-[0.3em] mb-3 flex items-center gap-2">DETALLE DE ELABORACIÓN</h3>
                    <table className="w-full text-[9px] border-collapse">
                        <thead>
                            <tr className="bg-brand-blue text-white uppercase text-[7px] tracking-widest">
                                <th className="p-2 border border-brand-blue w-[10%]">Cant</th>
                                <th className="p-2 border border-brand-blue text-left w-[40%]">Documento / Servicio</th>
                                <th className="p-2 border border-brand-blue w-[15%] text-center">Papel</th>
                                <th className="p-2 border border-brand-blue w-[15%] text-center">Tamaño</th>
                                <th className="p-2 border border-brand-blue w-[20%] text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-800">
                            <tr className="font-bold">
                                <td className="p-3 border border-slate-200 text-center text-lg">{trabajo.cantidad}</td>
                                <td className="p-3 border border-slate-200 uppercase leading-tight">{trabajo.subtipo}</td>
                                <td className="p-3 border border-slate-200 text-center uppercase text-[8px]">{isQuimico ? 'Químico' : 'Bond'}</td>
                                <td className="p-3 border border-slate-200 text-center uppercase text-[8px]">{trabajo.tamano}</td>
                                <td className="p-3 border border-slate-200 text-right text-base font-black text-brand-blue">{formatCurrency(trabajo.total)}</td>
                            </tr>
                            {[...Array(4)].map((_, i) => (
                                <tr key={i}><td className="p-3 border border-slate-100"></td><td className="p-3 border border-slate-100"></td><td className="p-3 border border-slate-100"></td><td className="p-3 border border-slate-100"></td><td className="p-3 border border-slate-100"></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PIE DE PÁGINA */}
                <div className="mt-auto">
                    <div className="bg-brand-red/5 border-2 border-brand-red/20 rounded-2xl p-4 mb-6">
                        <h4 className="text-[9px] font-black text-brand-red uppercase tracking-widest mb-1">NOTA IMPORTANTE:</h4>
                        <p className="text-[7.5px] font-bold text-slate-600 uppercase tracking-tight leading-tight">
                            PASADO EL MES DE NO HABER RETIRADO SUS TRABAJOS NO NOS HACEMOS RESPONSABLES. SIN RECIBO PIERDE DERECHO A RETIRAR SU TRABAJO Y DINERO.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-8 text-center pt-8">
                        <div>
                            <div className="border-t-2 border-slate-800 w-full mb-1"></div>
                            <p className="text-[8px] font-black uppercase text-slate-900">Firma del Solicitante</p>
                        </div>
                        <div>
                            <div className="border-t-2 border-slate-800 w-full mb-1"></div>
                            <p className="text-[8px] font-black uppercase text-slate-900">Recibí Conforme</p>
                        </div>
                    </div>

                    <div className="border-t-2 border-dashed border-slate-300 pt-6 mt-4 grid grid-cols-3 gap-3">
                        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex flex-col items-center">
                            <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Valor $</span>
                            <span className="text-xl font-black text-slate-900 leading-none">{formatCurrency(trabajo.total)}</span>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl border border-brand-blue/20 flex flex-col items-center">
                            <span className="text-[8px] font-black text-brand-blue uppercase mb-1">Abona $</span>
                            <span className="text-xl font-black text-brand-blue leading-none">{formatCurrency(trabajo.abono)}</span>
                        </div>
                        <div className="bg-brand-red p-3 rounded-xl flex flex-col items-center shadow-lg shadow-red-900/10">
                            <span className="text-[8px] font-black text-white/80 uppercase mb-1">Saldo $</span>
                            <span className="text-xl font-black text-white leading-none">{formatCurrency(trabajo.saldo)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
