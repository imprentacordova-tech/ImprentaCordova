import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente } from '../types';
import { 
    PrinterIcon, ArrowLeftIcon, ArrowDownTrayIcon, 
    WhatsAppIcon, Loader2Icon, FileTextIcon,
    ShieldCheckIcon, CheckCircleIcon, CordovaLogo
} from '../components/Icons';
// Declaración para TypeScript ya que html2pdf se carga vía CDN en index.html
declare const html2pdf: any;


// --- UTILS & LOGOS ---
const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const generateWhatsAppLink = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('593') ? cleanPhone : `593${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
};



/**
 * ReciboEpson — Comprobante de trabajo diseñado para impresora Epson de tinta/impacto
 * Formato: Medio Oficio (8.5" x 6.5" / 216mm x 165mm) - DOBLE COPIA
 * Estilo: Elite Concierge, minimalista y funcional.
 */
const ReciboEpson: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!trabajoId || dataLoading) return;
        const current = trabajos.find(t => t.id === trabajoId);
        if (current) {
            setTrabajo(current);
            setCliente(clientes.find(c => c.id === current.clienteId) || null);
        }
    }, [trabajoId, trabajos, clientes, dataLoading]);

    const config = {
        nombre: cloudConfig?.imprentaNombre || 'IMPRENTA CÓRDOVA',
        ruc: cloudConfig?.emisorRuc || cloudConfig?.imprentaRuc || '0702065319001',
        direccion: 'Colón y Sucre, Pasaje, El Oro',
        telefono: cloudConfig?.imprentaTelefono || '0993083943',
    };

    const handlePrint = () => window.print();

    const handleDownloadPDF = async () => {
        const element = document.getElementById('recibo-epson-canvas');
        if (!element || !trabajo) return;
        setIsGenerating(true);
        try {
            await html2pdf().set({
                margin: 0,
                filename: `Elite-Recibo-${String(trabajo.orden).padStart(6, '0')}.pdf`,
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: { scale: 3, useCORS: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: [216, 165], orientation: 'landscape' }
            }).from(element).save();
        } catch (err) {
            console.error("Error generando PDF:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleWhatsApp = () => {
        if (!trabajo || !cliente) return;
        const trackingUrl = `${window.location.origin}/#/tracking?q=${trabajo.id}`;
        const msg = `*ELITE_PROTOCOL - COMPROBANTE*\n\n` +
            `Estimado/a *${cliente.nombre}*,\n` +
            `Su orden *#${trabajo.orden}* está en sistema.\n\n` +
            `📦 ${trabajo.subtipo}\n` +
            `💰 Saldo Pendiente: ${formatCurrency(trabajo.saldo)}\n\n` +
            `🔍 Rastreo en Tiempo Real: ${trackingUrl}\n\n` +
            `Imprenta Córdova - Excelencia Industrial.`;
        const phone = cliente.telefono?.[0] || '';
        if (phone) window.open(generateWhatsAppLink(phone, msg), '_blank');
        else alert("Cliente sin contacto.");
    };

    if (dataLoading) return <div className="h-screen bg-slate-900 flex items-center justify-center"><Loader2Icon className="animate-spin text-gold-500" /></div>;
    if (!trabajo || !cliente) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">404_DATA_NOT_FOUND</div>;

    const fecha = new Date(trabajo.fechaEntrada);
    const trackingUrl = `${window.location.origin}/#/tracking?q=${trabajo.id}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;
    const ordenStr = String(trabajo.orden).padStart(6, '0');

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 print:p-0 print:bg-white">
            <style>{`
                @media print {
                    @page { size: 216mm 165mm; margin: 0; }
                    body { margin: 0; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #recibo-epson-canvas { box-shadow: none !important; transform: none !important; }
                }
                .recibo-font { font-family: 'Inter', 'Segoe UI', sans-serif; }
                .gold-border { border: 1px solid #D4AF37; }
                .perforation { border-top: 2px dashed #e2e8f0; position: relative; }
                .perforation::after {
                    content: '✂️ CORTE PARA SEPARAR COPIAS';
                    position: absolute;
                    top: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: white;
                    padding: 0 12px;
                    font-size: 7px;
                    font-weight: 900;
                    color: #94a3b8;
                    letter-spacing: 0.1em;
                }
            `}</style>

            {/* Toolbar */}
            <div className="no-print mb-8 flex gap-4 bg-white p-4 rounded-3xl shadow-xl border border-slate-200">
                <button onClick={() => navigate(-1)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all"><ArrowLeftIcon className="w-5 h-5 text-slate-600"/></button>
                <button onClick={handleWhatsApp} className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-green-600 transition-all"><WhatsAppIcon className="w-4 h-4"/> WhatsApp</button>
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all"><ArrowDownTrayIcon className="w-4 h-4"/> PDF</button>
                <button onClick={handlePrint} className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-amber-600 transition-all shadow-gold-glow"><PrinterIcon className="w-4 h-4"/> Imprimir</button>
            </div>

            {/* Canvas: 216mm x 165mm (Landscape approach for double copy on vertical sheet) */}
            {/* If the user has "hojas perforadas por la mitad", and it's medio oficio, then it's 2 parts. */}
            <div 
                id="recibo-epson-canvas"
                className="bg-white shadow-2xl overflow-hidden recibo-font flex flex-col"
                style={{ width: '216mm', height: '165mm', padding: '0' }}
            >
                <div className="flex-1 flex flex-col p-[6mm]">
                    <ReceiptBlock type="CLIENTE" trabajo={trabajo} cliente={cliente} config={config} ordenStr={ordenStr} fecha={fecha} qrSrc={qrSrc} />
                </div>
                
                <div className="perforation"></div>
                
                <div className="flex-1 flex flex-col p-[6mm]">
                    <ReceiptBlock type="OPERADOR" trabajo={trabajo} cliente={cliente} config={config} ordenStr={ordenStr} fecha={fecha} qrSrc={qrSrc} />
                </div>
            </div>
        </div>
    );
};

const ReceiptBlock = ({ type, trabajo, cliente, config, ordenStr, fecha, qrSrc }: any) => {
    let specs: any = null;
    const detalleStr = trabajo.detalle || '';
    try {
        if (detalleStr.includes('| SPECS: ')) {
            specs = JSON.parse(detalleStr.split('| SPECS: ')[1]);
        }
    } catch(e) {}

    const cleanDetail = detalleStr.split('| SPECS:')[0];
    const isOperator = type === 'OPERADOR';

    return (
        <div className={`flex-1 flex flex-col gap-2 relative ${isOperator ? 'bg-slate-50/40' : ''} border border-slate-100 rounded-3xl p-4 shadow-sm`}>
            {/* Watermark Copy Indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] font-black text-[80px] -rotate-12 select-none pointer-events-none uppercase tracking-[0.2em] text-slate-900">
                {isOperator ? 'PRODUCCIÓN' : 'CLIENTE'}
            </div>

            {/* Header section */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-3">
                    <CordovaLogo className="w-10 h-10" />
                    <div>
                        <h1 className="text-[14px] font-black text-slate-900 tracking-tighter uppercase leading-none">{config.nombre}</h1>
                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{config.ruc} • {config.direccion}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`px-4 py-1.5 rounded-xl flex flex-col items-end ${isOperator ? 'bg-slate-800' : 'bg-black'} text-white`}>
                        <span className="text-[6px] font-black uppercase tracking-[0.3em] opacity-50">ORDEN_CONTROL</span>
                        <span className="text-[18px] font-black tracking-tighter leading-none">#{ordenStr}</span>
                    </div>
                    <p className="text-[6px] font-black text-slate-400 mt-1 uppercase tracking-widest italic">{isOperator ? 'COPIA OPERADOR' : 'ORIGINAL CLIENTE'}</p>
                </div>
            </div>

            {/* Main Data Grid */}
            <div className="grid grid-cols-12 gap-3">
                {/* Remitente */}
                <div className="col-span-4 space-y-2">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest block mb-1">Entidad_Cliente</span>
                        <p className="text-[10px] font-black text-slate-900 uppercase leading-tight line-clamp-1">{cliente.nombre}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">Cédula / RUC</span>
                            <p className="text-[9px] font-bold text-slate-900 truncate">{cliente.cedula || cliente.ruc || '9999999999'}</p>
                        </div>
                    </div>
                </div>

                {/* Industrial Specifications Matrix */}
                <div className="col-span-8 grid grid-cols-4 gap-2">
                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm col-span-2">
                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">TIPO DE TRABAJO</span>
                        <p className="text-[9px] font-black text-slate-900 uppercase truncate">{trabajo.tipo}</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">CANTIDAD</span>
                        <p className="text-[11px] font-black text-slate-900 uppercase">{trabajo.cantidad} UNID.</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">TAMAÑO</span>
                        <p className="text-[9px] font-black text-slate-900 uppercase truncate">{specs?.tamano || 'N/A'}</p>
                    </div>
                    
                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">TIPO DE PAPEL</span>
                        <p className="text-[8px] font-black text-slate-900 uppercase truncate">{specs?.tipoPapel || 'BOND'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">TINTAS / COLOR</span>
                        <p className="text-[8px] font-black text-slate-900 uppercase truncate">{specs?.tintas || 'F. COLOR'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">COPIAS</span>
                        <p className="text-[8px] font-black text-slate-900 uppercase truncate">{specs?.copias?.replace('Original y ', '') || 'S/N'}</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <span className="text-[5px] font-black text-slate-400 uppercase tracking-widest block">ENTREGA</span>
                        <p className="text-[8px] font-black text-brand-red uppercase truncate">{trabajo.prioridad}</p>
                    </div>
                </div>
            </div>

            {/* Industrial Detail & Mechanicals */}
            <div className="flex-1 grid grid-cols-12 gap-3 mt-1">
                <div className="col-span-8 bg-white p-3 rounded-2xl border border-slate-100 flex flex-col shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                        <FileTextIcon className="w-12 h-12" />
                    </div>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em]">TEXTO Y ESPECIFICACIONES</span>
                        {specs?.numerado !== 'No' && (
                            <span className="text-[7px] font-black text-white uppercase bg-slate-900 px-2 py-0.5 rounded-md">
                                NUMERADO: {specs?.numerado}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-800 leading-tight flex-1 italic">
                        {cleanDetail || 'TRABAJO SEGÚN ARTE FINAL APROBADO POR EL CLIENTE.'}
                    </p>
                    
                    <div className="mt-2 grid grid-cols-3 gap-2 border-t border-slate-50 pt-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 border rounded-sm ${specs?.perforado === 'Sí' ? 'bg-black' : 'border-slate-300'}`}></div>
                            <span className="text-[6px] font-black text-slate-600 uppercase">Perforado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 border rounded-sm ${specs?.acabado !== 'Ninguno' ? 'bg-black' : 'border-slate-300'}`}></div>
                            <span className="text-[6px] font-black text-slate-600 uppercase">{specs?.acabado || 'Acabado'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-slate-300 rounded-sm"></div>
                            <span className="text-[6px] font-black text-slate-600 uppercase">Troquel</span>
                        </div>
                    </div>
                </div>

                <div className={`col-span-4 rounded-2xl p-4 text-white flex flex-col justify-between shadow-lg ${isOperator ? 'bg-slate-800' : 'bg-slate-950'}`}>
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center opacity-70">
                            <span className="text-[6px] font-black uppercase tracking-widest italic">VALOR TOTAL</span>
                            <span className="text-[9px] font-black">{formatCurrency(trabajo.precio)}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400">
                            <span className="text-[6px] font-black uppercase tracking-widest italic">ABONO</span>
                            <span className="text-[9px] font-black">-{formatCurrency(trabajo.abono)}</span>
                        </div>
                        <div className="h-[0.5px] bg-white/10 my-1"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest mb-0.5 italic">SALDO PENDIENTE</span>
                            <span className="text-[20px] font-black text-amber-400 tracking-tighter leading-none">${trabajo.saldo.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 bg-white/5 p-1.5 rounded-xl border border-white/5">
                        <img src={qrSrc} alt="QR" className="w-8 h-8 bg-white p-0.5 rounded-lg" />
                        <div className="text-[5px] font-black text-white/40 uppercase tracking-tighter leading-none text-right italic">
                            RASTREO_VIRTUAL<br/>ELITE_CORE_v4.0
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Signature Matrix */}
            <div className="flex justify-between items-end mt-2 px-2">
                <div className="text-center w-28">
                    <div className="h-[0.5px] bg-slate-300 w-full mb-1"></div>
                    <p className="text-[5px] font-black text-slate-400 uppercase tracking-widest italic">Responsable: {trabajo.responsable}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-[6px] font-black text-slate-300 tracking-[0.4em] uppercase italic">Imprenta Córdova</p>
                    <div className="text-[5px] font-black bg-slate-100 text-slate-500 px-3 py-0.5 rounded-full uppercase tracking-widest">{fecha.toLocaleDateString()}</div>
                </div>
                <div className="text-center w-28">
                    <div className="h-[0.5px] bg-slate-300 w-full mb-1"></div>
                    <p className="text-[5px] font-black text-slate-400 uppercase tracking-widest italic">Recibí Conforme</p>
                </div>
            </div>
        </div>
    );
};

export default ReciboEpson;
