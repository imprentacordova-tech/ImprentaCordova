
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoTipo } from '../types';
import { 
    PrinterIcon, ArrowDownTrayIcon, ArrowLeftIcon, 
    CordovaLogo, Loader2Icon, ShieldCheckIcon, DocumentTextIcon,
    ExclamationTriangleIcon, CheckIcon, WhatsAppIcon, MapPinIcon,
    PhoneIcon, EnvelopeIcon, ClockIcon
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
            filename: `Solicitud-SRI-${trabajo.orden}-${cliente?.nombre}.pdf`,
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

    const fechaHoy = new Date(trabajo.fechaEntrada).toLocaleDateString('es-EC', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    // URL para el QR de rastreo
    const trackingUrl = `${window.location.origin}/#/tracking?order=${trabajo.orden}`;
    const qrCodeSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;

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
                        padding: 10mm !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-[210mm] flex justify-between mb-8 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase tracking-widest hover:text-brand-blue transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" /> Volver al Sistema
                </button>
                <div className="flex gap-3">
                    <button onClick={handleDownloadPdf} className="bg-white border-2 border-slate-300 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <ArrowDownTrayIcon className="w-5 h-5" /> Guardar PDF
                    </button>
                    <button onClick={() => window.print()} className="bg-brand-blue text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-slate-950 transition-all">
                        <PrinterIcon className="w-5 h-5"/> Imprimir Documento
                    </button>
                </div>
            </div>

            {/* DOCUMENTO MAESTRO FUSIONADO */}
            <div id="documento-maestro-sri" className="bg-white shadow-2xl relative flex flex-col box-border border border-slate-400" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', fontFamily: 'Arial, sans-serif' }}>
                
                {/* CABECERA CON PUBLICIDAD (Estilo Foto) */}
                <div className="border-4 border-brand-blue rounded-3xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-bl-full"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="bg-brand-blue p-3 rounded-2xl shadow-xl">
                                <CordovaLogo className="h-20 w-auto brightness-0 invert" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-brand-blue tracking-tighter leading-none mb-1">IMPRENTA CÓRDOVA</h1>
                                <div className="space-y-1 text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                                    <p className="flex items-center gap-2"><MapPinIcon className="w-3 h-3 text-brand-red"/> {config.emisorDireccionCompleta}</p>
                                    <p className="flex items-center gap-2">
                                        <PhoneIcon className="w-3 h-3 text-brand-red"/> {config.emisorTelefono} • 096 258 5172
                                        <WhatsAppIcon className="w-3 h-3 text-green-500 ml-2"/> WhatsApp Activo
                                    </p>
                                    <p className="flex items-center gap-2"><EnvelopeIcon className="w-3 h-3 text-brand-red"/> {config.emisorEmail}</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right border-l-2 border-brand-blue/20 pl-6">
                            <p className="text-[11px] font-black text-brand-blue uppercase">RUC: {config.emisorRuc}</p>
                            <p className="text-[11px] font-black text-brand-red uppercase mt-1">CÓDIGO AUT. SRI: {config.reciboCodAuto}</p>
                            <div className="mt-4 bg-brand-blue text-white py-2 px-4 rounded-xl font-black text-xs tracking-[0.2em]">
                                SOLICITUD DE AUTORIZACIÓN
                            </div>
                        </div>
                    </div>
                </div>

                {/* DATOS DEL CONTRIBUYENTE (BLOQUE SUPERIOR) */}
                <div className="grid grid-cols-12 gap-x-8 gap-y-4 mb-8 text-[11px]">
                    <div className="col-span-8 space-y-3">
                        <div className="border-b border-gray-300 pb-1">
                            <span className="font-black text-gray-400 uppercase text-[9px] block">Apellidos y Nombres:</span>
                            <span className="font-bold text-slate-900 uppercase text-sm">{cliente.nombre}</span>
                        </div>
                        <div className="border-b border-gray-300 pb-1">
                            <span className="font-black text-gray-400 uppercase text-[9px] block">Razón Social:</span>
                            <span className="font-bold text-slate-900 uppercase">{cliente.nombreComercial || '-'}</span>
                        </div>
                        <div className="border-b border-gray-300 pb-1">
                            <span className="font-black text-gray-400 uppercase text-[9px] block">Actividad Económica:</span>
                            <span className="font-bold text-slate-900 uppercase">{trabajo.actividadSeleccionada || cliente.actividades || '-'}</span>
                        </div>
                    </div>
                    <div className="col-span-4 space-y-3">
                        <div className="bg-slate-100 p-3 rounded-2xl border-2 border-slate-200">
                            <span className="font-black text-gray-500 uppercase text-[9px] block mb-1">RUC:</span>
                            <span className="font-mono text-xl font-black text-brand-blue tracking-widest">
                                {cliente.ruc || cliente.cedula}
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1 border-b border-gray-300 pb-1">
                                <span className="font-black text-gray-400 uppercase text-[9px] block">Fecha:</span>
                                <span className="font-bold">{fechaHoy}</span>
                            </div>
                            <div className="flex-1 border-b border-gray-300 pb-1 text-right">
                                <span className="font-black text-gray-400 uppercase text-[9px] block">Orden Nº:</span>
                                <span className="font-black text-brand-red text-lg">#{trabajo.orden}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABLA TÉCNICA (Basada en la imagen manual) */}
                <div className="mb-8 overflow-hidden rounded-2xl border-2 border-brand-blue">
                    <div className="bg-brand-blue text-white p-3 text-center text-[10px] font-black uppercase tracking-[0.2em]">
                        SOLICITO LA ELABORACIÓN DE LOS DOCUMENTOS DETALLADOS A CONTINUACIÓN:
                    </div>
                    <table className="w-full text-center border-collapse">
                        <thead className="bg-slate-50 text-[9px] font-black text-brand-blue uppercase border-b-2 border-brand-blue">
                            <tr>
                                <th className="p-3 border-r border-brand-blue/20">TAMAÑO</th>
                                <th className="p-3 border-r border-brand-blue/20">TIPO DE DOCUMENTO</th>
                                <th className="p-3 border-r border-brand-blue/20">PAPEL</th>
                                <th className="p-3 border-r border-brand-blue/20 text-[8px]">ESTABLEC.</th>
                                <th className="p-3 border-r border-brand-blue/20 text-[8px]">PUNTO EMIS.</th>
                                <th className="p-3 border-r border-brand-blue/20">CANTIDAD</th>
                                <th className="p-3">PRECIO</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] font-bold">
                            <tr className="border-b border-gray-100">
                                <td className="p-4 border-r border-gray-100 uppercase">{trabajo.tamano}</td>
                                <td className="p-4 border-r border-gray-100 uppercase text-brand-blue">{trabajo.subtipo}</td>
                                <td className="p-4 border-r border-gray-100 uppercase">QUÍMICO / BOND</td>
                                <td className="p-4 border-r border-gray-100 font-mono text-lg">{trabajo.establecimiento || '001'}</td>
                                <td className="p-4 border-r border-gray-100 font-mono text-lg">{trabajo.puntoEmision || '001'}</td>
                                <td className="p-4 border-r border-gray-100 font-black text-lg">{trabajo.cantidad}</td>
                                <td className="p-4 text-brand-red">{formatCurrency(trabajo.total)}</td>
                            </tr>
                            {[...Array(4)].map((_, i) => (
                                <tr key={i} className="border-b border-gray-50 h-10">
                                    <td className="border-r border-gray-50"></td><td className="border-r border-gray-50"></td>
                                    <td className="border-r border-gray-50"></td><td className="border-r border-gray-50"></td>
                                    <td className="border-r border-gray-50"></td><td className="border-r border-gray-50"></td>
                                    <td></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* BLOQUE DE RESTRICCIONES Y QR (Fusión Moderno/Manual) */}
                <div className="grid grid-cols-12 gap-8 mb-10">
                    <div className="col-span-8 bg-brand-blue text-white rounded-3xl p-6 relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><CordovaLogo className="w-32 h-32 brightness-0 invert" /></div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-tighter mb-4 flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" /> NOTA IMPORTANTE:
                            </h3>
                            <p className="text-[10px] font-bold leading-relaxed mb-4 uppercase">
                                PASADO EL MES DE NO HABER RETIRADO SUS DOCUMENTOS (FACTURAS, RETENCIONES, GUÍAS, ETC.) 
                                NO NOS HACEMOS RESPONSABLES DE SU ABONO Y TODO RECLAMO QUEDA ANULADO. 
                                <br/><span className="text-yellow-400 text-[11px]">SIN RECIBO PIERDE EL DERECHO A RETIRAR SU TRABAJO Y SU DINERO.</span>
                            </p>
                            <div className="border-t border-white/20 pt-4 mt-4">
                                <p className="text-[9px] italic opacity-80 leading-tight">
                                    Declaro que los datos proporcionados en esta solicitud son exactos y verdaderos, por lo que asumo la responsabilidad sobre su presentación legal ante el SRI.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-span-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-3xl text-center space-y-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Escanea para rastrear</p>
                        <img src={qrCodeSrc} alt="QR Seguimiento" className="w-32 h-32 shadow-sm" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-brand-blue uppercase">Estado en Vivo</p>
                            <p className="text-[8px] font-bold text-slate-400">Córdova Vision ERP</p>
                        </div>
                    </div>
                </div>

                {/* PIE DE PÁGINA FINANCIERO (RECIBO) */}
                <div className="mt-auto">
                    <div className="flex items-center gap-20 pt-16 mb-16">
                        <div className="flex-1 text-center border-t border-slate-400 pt-4">
                            <p className="text-[10px] font-black text-slate-900 uppercase">Firma del Solicitante</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">C.I.: {cliente.cedula}</p>
                        </div>
                        <div className="flex-1 text-center border-t border-slate-400 pt-4">
                            <p className="text-[10px] font-black text-slate-900 uppercase">Recibido por Imprenta</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Sello de Autorización</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-[2rem] p-8 flex flex-col sm:flex-row justify-between items-center gap-8 shadow-2xl">
                        <div className="flex-1 text-center border-r border-white/10 px-4">
                            <span className="text-[10px] font-black text-brand-red uppercase tracking-widest block mb-2">Valor Total</span>
                            <span className="text-3xl font-black tracking-tighter">{formatCurrency(trabajo.total)}</span>
                        </div>
                        <div className="flex-1 text-center border-r border-white/10 px-4">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Abona $</span>
                            <span className="text-3xl font-black tracking-tighter">{formatCurrency(trabajo.abono)}</span>
                        </div>
                        <div className="flex-1 text-center px-4">
                            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-2">Saldo $</span>
                            <span className="text-4xl font-black tracking-tighter text-yellow-400">{formatCurrency(trabajo.saldo)}</span>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between items-center opacity-40">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Generado por Córdova E.R.P. 2025 • Pasaje - El Oro</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Página 1 de 1</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
