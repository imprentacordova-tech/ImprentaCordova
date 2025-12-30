
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoTipo, Regimen } from '../types';
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

    const fechaPedidoConHora = new Date(trabajo.fechaEntrada).toLocaleString('es-EC', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    const dtRetiro = new Date(trabajo.fechaEntrada);
    // Ajuste dinámico según tiempo estimado
    const hoursToAdd = trabajo.tiempoEntregaEstimado === '24h' ? 24 : 48;
    dtRetiro.setHours(dtRetiro.getHours() + hoursToAdd);
    
    const diaSemana = dtRetiro.toLocaleDateString('es-EC', { weekday: 'long' });
    const diaMes = dtRetiro.getDate();
    const fechaRetiroFormateada = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaMes} (Tarde)`;

    const parseProductDetails = (subtipo: string) => {
        return subtipo.split(', ').map(s => {
            const qtyMatch = s.match(/^(\d+)x/);
            const numBlocks = qtyMatch ? qtyMatch[1] : "1";
            const sizeMatch = s.match(/(1\/\d+ OFICIO|OFICIO|A\d+)/i);
            const size = sizeMatch ? sizeMatch[0] : "1/4 Oficio";
            const nameMatch = s.match(/x (.*?) \(/);
            const docName = nameMatch ? nameMatch[1] : "Documento SRI";
            const sheetsMatch = s.match(/(\d+H)/i);
            const copiesMatch = s.match(/(DUPLICADO|TRIPLICADO|ÚNICO)/i);
            let detailedQty = sheetsMatch ? sheetsMatch[0].toLowerCase() : "100h";
            if (copiesMatch) {
                const multiplier = copiesMatch[0].toUpperCase() === 'DUPLICADO' ? '2' : (copiesMatch[0].toUpperCase() === 'TRIPLICADO' ? '3' : '1');
                if (multiplier !== '1') detailedQty += ` x ${multiplier}`;
            }
            detailedQty += ` (${numBlocks} block)`;
            return { size, docName, detailedQty };
        });
    };

    const parsedItems = parseProductDetails(trabajo.subtipo);

    // QR para seguimiento web
    const trackingUrl = `${window.location.origin}/#/tracking?order=${trabajo.orden}`;
    const qrSource = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;

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
                    <ArrowLeftIcon className="w-4 h-4" /> Volver
                </button>
                <div className="flex gap-3">
                    <button onClick={handleDownloadPdf} className="bg-white border-2 border-slate-300 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <ArrowDownTrayIcon className="w-5 h-5" /> PDF
                    </button>
                    <button onClick={() => window.print()} className="bg-brand-blue text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-slate-950 transition-all">
                        <PrinterIcon className="w-5 h-5"/> Imprimir
                    </button>
                </div>
            </div>

            <div id="documento-maestro-sri" className="bg-white shadow-2xl relative flex flex-col box-border border border-slate-400" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', fontFamily: 'Arial, sans-serif' }}>
                
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

                <div className="grid grid-cols-12 gap-x-8 gap-y-4 mb-8 text-[11px]">
                    <div className="col-span-8 space-y-4">
                        <div className="border-b border-gray-300 pb-1">
                            <span className="font-black text-gray-400 uppercase text-[9px] block">Contribuyente:</span>
                            <span className="font-bold text-slate-900 uppercase text-sm">{cliente.nombre}</span>
                        </div>
                        <div className="border-b border-gray-300 pb-1">
                            <span className="font-black text-gray-400 uppercase text-[9px] block">Régimen:</span>
                            <span className="font-black text-brand-red uppercase text-xs">{cliente.regimen}</span>
                        </div>
                        <div className="border-b border-gray-300 pb-1">
                            <span className="font-black text-gray-400 uppercase text-[9px] block">Actividad Económica:</span>
                            <span className="font-bold text-slate-900 uppercase">{trabajo.actividadSeleccionada || cliente.actividades || '-'}</span>
                        </div>
                        <div className="border-b border-gray-300 pb-1">
                            <span className="font-black text-gray-400 uppercase text-[9px] block">Teléfono(s) del Cliente:</span>
                            <span className="font-bold text-slate-900 uppercase tracking-widest">{cliente.telefono.join(' • ') || '-'}</span>
                        </div>
                    </div>
                    <div className="col-span-4 space-y-3">
                        <div className="bg-slate-100 p-3 rounded-2xl border-2 border-slate-200">
                            <span className="font-black text-gray-500 uppercase text-[9px] block mb-1">RUC:</span>
                            <span className="font-mono text-xl font-black text-brand-blue tracking-widest">
                                {cliente.ruc || cliente.cedula}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="border-b border-gray-300 pb-1">
                                <span className="font-black text-gray-400 uppercase text-[9px] block">Fecha Pedido:</span>
                                <span className="font-bold text-[10px]">{fechaPedidoConHora}</span>
                            </div>
                            <div className="border-b border-gray-300 pb-1 text-right">
                                <span className="font-black text-gray-400 uppercase text-[9px] block">Orden Nº:</span>
                                <span className="font-black text-brand-red text-lg">#{trabajo.orden}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 overflow-hidden rounded-2xl border-2 border-brand-blue">
                    <div className="bg-brand-blue text-white p-3 text-center text-[10px] font-black uppercase tracking-[0.2em]">
                        SOLICITO LA ELABORACIÓN DE LOS SIGUIENTES DOCUMENTOS:
                    </div>
                    <table className="w-full text-center border-collapse">
                        <thead className="bg-slate-50 text-[9px] font-black text-brand-blue uppercase border-b-2 border-brand-blue">
                            <tr>
                                <th className="p-3 border-r border-brand-blue/20">TAMAÑO</th>
                                <th className="p-3 border-r border-brand-blue/20">DOCUMENTO</th>
                                <th className="p-3 border-r border-brand-blue/20">DETALLE / CANTIDAD</th>
                                <th className="p-3 border-r border-brand-blue/20">ESTAB.</th>
                                <th className="p-3 border-r border-brand-blue/20">PTO. EMIS.</th>
                                <th className="p-3">P.V.P</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] font-bold">
                            {parsedItems.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="p-4 border-r border-gray-100 uppercase">{item.size}</td>
                                    <td className="p-4 border-r border-gray-100 uppercase text-brand-blue">{item.docName}</td>
                                    <td className="p-4 border-r border-gray-100 uppercase text-slate-500 font-black">{item.detailedQty}</td>
                                    <td className="p-4 border-r border-gray-100 font-mono text-xl text-brand-red">{trabajo.establecimiento || '001'}</td>
                                    <td className="p-4 border-r border-gray-100 font-mono text-xl text-brand-red">{trabajo.puntoEmision || '001'}</td>
                                    <td className="p-4 text-brand-blue text-xl font-black">{formatCurrency(trabajo.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-12 gap-6 mb-8">
                    <div className="col-span-12 bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-3xl">
                        <h3 className="text-[10px] font-black uppercase text-brand-blue tracking-widest mb-3">AUTODECLARACIÓN DE RESPONSABILIDAD</h3>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
                            El contribuyente declara que la información proporcionada (RUC, Régimen, Actividades y Direcciones) es verídica y corresponde a su registro actualizado en el SRI. Imprenta Córdova actúa únicamente como emisor autorizado basado en estos datos.
                        </p>
                    </div>
                </div>

                <div className="mt-auto space-y-8">
                    {/* BLOQUE DE COMPROMISO MAESTRO CON MARCO ROJO Y QR */}
                    <div className="border-[6px] border-brand-red rounded-[2.5rem] p-8 flex justify-between items-center bg-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                            <CordovaLogo className="w-40 h-40" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-1">Compromiso de Entrega</span>
                                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{fechaRetiroFormateada}</h3>
                            </div>
                            <div className="bg-brand-red text-white inline-block px-8 py-3 rounded-2xl font-black text-xl tracking-tighter uppercase shadow-2xl">
                                LISTO PARA RETIRAR EN LOCAL
                            </div>
                        </div>
                        <div className="relative z-10 flex flex-col items-center gap-2 border-l-2 border-slate-100 pl-8 ml-8">
                             <div className="bg-white p-2 border-2 border-slate-100 rounded-2xl shadow-sm">
                                <img src={qrSource} alt="QR Tracking" className="w-24 h-24" />
                             </div>
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rastrea tu pedido</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-20 pt-4 mb-8">
                        <div className="flex-1 text-center border-t-2 border-slate-400 pt-4">
                            <p className="text-[10px] font-black text-slate-900 uppercase">Firma del Solicitante</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">C.I.: {cliente.cedula}</p>
                        </div>
                        <div className="flex-1 text-center border-t-2 border-slate-400 pt-4">
                            <p className="text-[10px] font-black text-slate-900 uppercase">Sello de Autorización</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">SISTEMA CÓRDOVA VISION v2.0</p>
                        </div>
                    </div>

                    <div className="bg-slate-950 text-white rounded-[2rem] p-6 flex justify-between items-center shadow-xl">
                        <div className="text-center px-4">
                            <span className="text-[9px] font-black text-emerald-500 uppercase block mb-1">Abonado</span>
                            <span className="text-xl font-black text-emerald-400 tracking-tighter">{formatCurrency(trabajo.abono)}</span>
                        </div>
                        <div className="h-10 w-px bg-white/10"></div>
                        <div className="text-center px-4 flex-grow">
                             <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 opacity-50">Nro. Orden</span>
                             <span className="text-2xl font-black text-white tracking-tighter">#{trabajo.orden}</span>
                        </div>
                        <div className="h-10 w-px bg-white/10"></div>
                        <div className="text-center px-4">
                            <span className="text-[9px] font-black text-brand-red uppercase block mb-1">Saldo a Pagar</span>
                            <span className="text-4xl font-black text-brand-red tracking-tighter">{formatCurrency(trabajo.saldo)}</span>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-between items-center opacity-30">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">CÓRDOVA STUDIO 2025 • PASAJE EL ORO</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">CONTROL TÉCNICO DE EMISIÓN SRI</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
