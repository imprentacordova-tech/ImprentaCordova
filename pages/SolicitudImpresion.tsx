
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoTipo, Regimen } from '../types';
import { 
    PrinterIcon, ArrowDownTrayIcon, ArrowLeftIcon, 
    CordovaLogo, Loader2Icon, ShieldCheckIcon, DocumentTextIcon,
    ExclamationTriangleIcon, CheckIcon, WhatsAppIcon, MapPinIcon,
    PhoneIcon, EnvelopeIcon, ClockIcon, LayersIcon, CheckCircleIcon
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
        const element = document.getElementById('documento-maestro-sri');
        if (!element || !trabajo) return;
        const opt = {
            margin: 0,
            filename: `Solicitud-SRI-${trabajo.orden}-${cliente?.ruc}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (loading || !config || !trabajo || !cliente) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <Loader2Icon className="w-10 h-10 text-brand-blue animate-spin" />
        </div>
    );

    const fechaPedidoConHora = new Date(trabajo.fechaEntrada).toLocaleString('es-EC', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    const parsedItems = trabajo.subtipo.split(', ').map(s => {
        const qtyMatch = s.match(/^(\d+)x/);
        const numBlocks = qtyMatch ? qtyMatch[1] : "1";
        const nameMatch = s.match(/x (.*?)$/);
        const rawName = nameMatch ? nameMatch[1] : s;
        return { numBlocks, rawName };
    });

    return (
        <div className="bg-slate-300 min-h-screen py-12 flex flex-col items-center overflow-y-auto">
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #documento-maestro-sri { 
                        box-shadow: none !important; 
                        border: none !important;
                        width: 210mm !important;
                        min-height: 297mm !important;
                        padding: 15mm !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-[210mm] flex justify-between mb-8 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase tracking-widest hover:text-brand-blue transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" /> Volver
                </button>
                <div className="flex gap-3">
                    <button onClick={handleDownloadPdf} className="bg-white border-2 border-slate-300 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <ArrowDownTrayIcon className="w-5 h-5" /> PDF
                    </button>
                    <button onClick={() => window.print()} className="bg-brand-blue text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-slate-950 transition-all">
                        <PrinterIcon className="w-5 h-5"/> Imprimir Solicitud
                    </button>
                </div>
            </div>

            <div id="documento-maestro-sri" className="bg-white shadow-2xl relative flex flex-col box-border border border-slate-400" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', fontFamily: 'Arial, sans-serif' }}>
                
                {/* HEADERS */}
                <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-slate-100">
                    <div className="flex items-center gap-4">
                        <CordovaLogo className="h-16 w-auto object-contain" />
                        <div>
                            <h1 className="text-xl font-black text-brand-blue tracking-tighter leading-none">IMPRENTA CÓRDOVA</h1>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Autorización Gráfica SRI {config.imprentaAutorizacion}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-slate-100 px-4 py-2 rounded-lg inline-block">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Orden Interna</span>
                            <span className="text-2xl font-mono font-black text-brand-red">#{String(trabajo.orden).padStart(6, '0')}</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 mt-2">{fechaPedidoConHora}</p>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight border-b-4 border-brand-blue inline-block pb-1">Solicitud de Impresión de Comprobantes</h2>
                    <p className="text-[10px] text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
                        Declaro que la información proporcionada es verídica y autorizo a Imprenta Córdova a realizar la solicitud de autorización al SRI en mi nombre.
                    </p>
                </div>

                {/* DATOS DEL CONTRIBUYENTE (IMPORTANTÍSIMO) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 relative">
                    <div className="absolute top-0 left-6 -translate-y-1/2 bg-white px-3 py-1 border border-slate-200 rounded-full flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-brand-blue"/>
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Datos del Contribuyente</span>
                    </div>

                    <div className="grid grid-cols-12 gap-y-4 gap-x-8 text-xs">
                        <div className="col-span-8 border-b border-dashed border-slate-300 pb-2">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Razón Social / Nombres</span>
                            <span className="block font-bold text-slate-900 text-sm uppercase">{cliente.nombre}</span>
                        </div>
                        <div className="col-span-4 border-b border-dashed border-slate-300 pb-2">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">R.U.C.</span>
                            <span className="block font-mono font-black text-brand-blue text-lg tracking-widest">{cliente.ruc || cliente.cedula}</span>
                        </div>

                        <div className="col-span-12 border-b border-dashed border-slate-300 pb-2">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Actividad Económica (SRI)</span>
                            <div className="flex items-start gap-2">
                                <LayersIcon className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
                                <span className="block font-bold text-slate-900 uppercase leading-snug">{trabajo.actividadSeleccionada || cliente.actividades || "SEGÚN RUC"}</span>
                            </div>
                        </div>

                        <div className="col-span-6 border-b border-dashed border-slate-300 pb-2">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Régimen Tributario</span>
                            <span className="block font-bold text-slate-900 uppercase">{cliente.regimen}</span>
                        </div>
                        <div className="col-span-6 border-b border-dashed border-slate-300 pb-2">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Autorizado</span>
                            <span className="block font-bold text-slate-900 lowercase">{cliente.email || 'No registrado'}</span>
                        </div>
                    </div>
                </div>

                {/* DETALLE DEL PEDIDO SRI */}
                <div className="mb-8">
                    <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.2em] mb-4 pl-2">Detalle de Documentos a Autorizar</h3>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                                <th className="p-3 rounded-tl-lg">Cant.</th>
                                <th className="p-3">Descripción / Documento</th>
                                <th className="p-3">Establecimiento</th>
                                <th className="p-3 rounded-tr-lg">Punto Emisión</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-slate-700">
                            {parsedItems.map((item, i) => (
                                <tr key={i} className="border-b border-slate-200">
                                    <td className="p-4 text-center bg-slate-50 border-r border-slate-200 w-[10%]">{item.numBlocks}</td>
                                    <td className="p-4 uppercase w-[50%]">{item.rawName}</td>
                                    <td className="p-4 text-center font-mono text-brand-red text-lg w-[20%]">{trabajo.establecimiento || '001'}</td>
                                    <td className="p-4 text-center font-mono text-brand-red text-lg w-[20%]">{trabajo.puntoEmision || '001'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* CHECKLIST DE REQUISITOS (MEJORA MAESTRA) */}
                <div className="mb-8 border border-slate-200 rounded-2xl p-4 bg-slate-50">
                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Checklist de Requisitos (Uso Interno)</h3>
                    <div className="flex gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-slate-400 rounded flex items-center justify-center"></div>
                            <span className="text-[10px] font-bold text-slate-700 uppercase">Copia de Cédula</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-slate-400 rounded flex items-center justify-center"></div>
                            <span className="text-[10px] font-bold text-slate-700 uppercase">Copia de RUC</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-slate-400 rounded flex items-center justify-center">
                                {trabajo.estadoClave === 'LISTA' && <CheckIcon className="w-3 h-3 text-brand-blue"/>}
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 uppercase">Clave SRI ({trabajo.estadoClave === 'LISTA' ? 'Verificada' : 'Pendiente'})</span>
                        </div>
                    </div>
                </div>

                {/* FIRMAS */}
                <div className="mt-auto">
                    <div className="flex justify-between gap-12 mb-8">
                        <div className="w-1/2 border-t-2 border-slate-800 pt-3 text-center">
                            <p className="text-[10px] font-black text-slate-900 uppercase">Firma del Contribuyente</p>
                            <p className="text-[8px] text-slate-500 uppercase mt-1">C.I.: {cliente.cedula}</p>
                        </div>
                        <div className="w-1/2 border-t-2 border-slate-800 pt-3 text-center">
                            <p className="text-[10px] font-black text-slate-900 uppercase">Recepción Imprenta</p>
                            <p className="text-[8px] text-slate-500 uppercase mt-1">Fecha: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-[9px] text-amber-800 font-medium leading-relaxed">
                            <strong>IMPORTANTE:</strong> El cliente asume la responsabilidad de que la información de su RUC esté actualizada. La autorización tiene vigencia según normativa. Documentos no retirados en 90 días serán reciclados.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
