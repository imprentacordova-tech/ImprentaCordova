
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getTrabajos, getClientes, registerRetiro } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, User } from '../types';
import { formatCurrency } from '../utils';
import { SearchIcon, CloseIcon, DocumentCheckIcon, PrinterIcon, ArrowDownTrayIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, DollarIcon, ExclamationTriangleIcon, ClockIcon, UserPlusIcon, CalendarDaysIcon, CordovaLogo, WhatsAppIcon, CopyIcon } from '../components/Icons';
import { getConfig, NotaDeVentaConfig } from '../services/configService';
import { useToast } from '../contexts/ToastContext';

// Declare html2pdf for TypeScript
declare const html2pdf: any;

// --- Helper para formatear hora ---
const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// --- Helper para generar enlace de WhatsApp ---
const generateWhatsAppUrl = (cliente: Cliente, trabajo: Trabajo) => {
    // Fallback si no hay teléfono
    if (!cliente?.telefono || cliente.telefono.length === 0) return '#';
    
    let phone = cliente.telefono[0].replace(/\D/g, '');
    
    // Formato Ecuador 09 -> 5939
    if (phone.startsWith('09')) {
        phone = '593' + phone.substring(1);
    } else if (phone.startsWith('9') && phone.length === 9) {
        // Caso borde si guardaron sin el 0
        phone = '593' + phone;
    }

    const saldoTxt = formatCurrency(trabajo.saldo);
    // Coordenadas fijas de Imprenta Córdova
    const mapLink = "https://maps.google.com/?q=-3.3281355,-79.8096219"; 
    
    const message = `Hola ${cliente.nombre}, tu pedido #${trabajo.orden} (${trabajo.subtipo}) está listo para retirar en Imprenta Córdova. El saldo pendiente es ${saldoTxt}. Ubicación: ${mapLink}`;
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

// --- MODAL DE VISTA PREVIA DEL COMPROBANTE (NOTA DE VENTA A5) ---
const ComprobantePreviewModal: React.FC<{
    data: { trabajo: Trabajo; cliente: Cliente; pagoFinal: number; usuario: string; };
    onClose: () => void;
}> = ({ data, onClose }) => {
    const { trabajo, cliente, pagoFinal, usuario } = data;
    const [config, setConfig] = useState<NotaDeVentaConfig | null>(null);

    useEffect(() => {
        setConfig(getConfig());
    }, []);

    const handlePrint = () => window.print();

    const handleDownloadPdf = () => {
        const element = document.getElementById('comprobante-preview-content');
        if (!element) return;
        const opt = {
          margin:       0, // Sin margen para que el CSS controle el borde
          filename:     `NotaVenta-${trabajo.orden}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
          jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (!config) {
        return <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"><p className="text-white font-bold">Generando documento...</p></div>;
    }

    const issuer = {
        nombreComercial: config.emisorNombreComercial,
        razonSocial: config.emisorRazonSocial,
        tipoContribuyente: config.emisorTipoContribuyente,
        direccionMatriz: config.emisorDireccionMatriz,
        direccionSucursal: config.emisorDireccionSucursal,
        ruc: config.emisorRuc,
        notaNro: `${config.numeracionPrefijo}${String(trabajo.orden).padStart(9, '0').slice(-9)}`,
        autorizacionSRI: config.autorizacionSRI,
        fechaAutorizacion: new Date(config.fechaAutorizacion).toLocaleDateString('es-EC', { timeZone: 'UTC' }),
        fechaCaducidad: new Date(config.fechaCaducidad).toLocaleDateString('es-EC', { timeZone: 'UTC' }),
        telefono: config.emisorTelefono,
        email: config.emisorEmail
    };
    
    const unitPrice = trabajo.cantidad > 0 ? trabajo.total / trabajo.cantidad : 0;
    const emissionDate = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in backdrop-blur-sm">
            <div className="bg-gray-100 dark:bg-gray-900 w-full max-w-4xl h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                <div className="bg-white dark:bg-gray-800 p-4 flex justify-between items-center border-b dark:border-gray-700 flex-shrink-0 no-print">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <DocumentCheckIcon className="w-6 h-6 text-green-500"/>
                            Nota de Venta Generada
                        </h3>
                        <p className="text-xs text-gray-500">Listo para imprimir o descargar</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            <PrinterIcon className="h-5 w-5" /> Imprimir
                        </button>
                        <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                           <ArrowDownTrayIcon className="h-5 w-5" /> Descargar PDF
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto p-8 font-sans flex justify-center bg-gray-300 dark:bg-gray-900">
                    {/* A5 Container Wrapper */}
                    <div id="comprobante-preview-content" className="bg-white shadow-2xl relative flex flex-col box-border" style={{ width: '148mm', minHeight: '210mm', padding: '10mm', position: 'relative' }}>
                         
                         {/* Watermark Logo */}
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                             <CordovaLogo className="w-64 h-64 grayscale" />
                         </div>

                         {/* Header: Logo & SRI Box */}
                         <div className="flex justify-between gap-4 mb-6 relative z-10">
                            <div className="w-7/12 pt-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <CordovaLogo className="h-12 w-auto object-contain" />
                                    <div>
                                        <h1 className="text-xl font-black text-brand-blue uppercase tracking-tight leading-none">{issuer.nombreComercial}</h1>
                                        <p className="text-[9px] font-bold text-gray-600 uppercase">{issuer.razonSocial}</p>
                                    </div>
                                </div>
                                <div className="text-[8px] text-gray-500 space-y-0.5 mt-2">
                                    <p className="text-brand-blue font-bold uppercase">{issuer.tipoContribuyente}</p>
                                    <p className="flex items-start gap-1"><MapPinIcon className="w-2.5 h-2.5 mt-0.5 text-brand-red flex-shrink-0"/> <span className="leading-tight">{issuer.direccionMatriz}</span></p>
                                    {issuer.direccionSucursal && <p className="flex items-start gap-1"><MapPinIcon className="w-2.5 h-2.5 mt-0.5 text-brand-red flex-shrink-0"/> <span className="leading-tight">{issuer.direccionSucursal}</span></p>}
                                    <div className="flex gap-3 mt-1">
                                        <p className="flex items-center gap-1"><PhoneIcon className="w-2.5 h-2.5 text-brand-red"/> {issuer.telefono}</p>
                                        <p className="flex items-center gap-1"><EnvelopeIcon className="w-2.5 h-2.5 text-brand-red"/> {issuer.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="w-5/12">
                                <div className="border border-brand-blue rounded-lg p-3 bg-blue-50/30">
                                    <p className="text-xs font-bold text-gray-700">R.U.C. {issuer.ruc}</p>
                                    <div className="bg-brand-blue text-white text-center text-sm font-bold py-1 my-1 rounded shadow-sm">
                                        NOTA DE VENTA
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-gray-600 mb-1">
                                        <span>No.</span>
                                        <span className="font-mono text-base font-bold text-red-600">{issuer.notaNro}</span>
                                    </div>
                                    <div className="text-[8px] text-gray-500 leading-tight border-t border-blue-200 pt-1 mt-1">
                                        <p><strong>AUT. SRI:</strong> {issuer.autorizacionSRI}</p>
                                        <p className="mt-0.5"><strong>FECHA AUT.:</strong> {issuer.fechaAutorizacion}</p>
                                    </div>
                                </div>
                            </div>
                         </div>

                         {/* Client Section */}
                         <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50 relative z-10">
                            <div className="grid grid-cols-12 gap-y-2 text-[10px]">
                                <div className="col-span-8 flex flex-col">
                                    <span className="text-gray-400 font-bold uppercase text-[8px]">Cliente / Razón Social</span>
                                    <span className="font-bold text-gray-900 text-xs uppercase truncate pr-2">{cliente.nombre}</span>
                                </div>
                                <div className="col-span-4 flex flex-col text-right">
                                    <span className="text-gray-400 font-bold uppercase text-[8px]">RUC / CI</span>
                                    <span className="font-mono font-bold text-gray-900">{cliente.ruc || cliente.cedula}</span>
                                </div>
                                <div className="col-span-8 flex flex-col">
                                    <span className="text-gray-400 font-bold uppercase text-[8px]">Dirección</span>
                                    <span className="text-gray-800 truncate pr-2">{cliente.direccion || 'Ciudad'}</span>
                                </div>
                                <div className="col-span-4 flex flex-col text-right">
                                    <span className="text-gray-400 font-bold uppercase text-[8px]">Fecha de Emisión</span>
                                    <span className="font-bold text-gray-900">{emissionDate}</span>
                                </div>
                            </div>
                         </div>

                         {/* Table */}
                         <div className="flex-grow mb-4 relative z-10">
                            <table className="w-full text-[10px] border-collapse">
                                <thead>
                                    <tr className="bg-brand-blue text-white uppercase">
                                        <th className="py-1.5 px-2 text-center rounded-tl-md w-[10%]">Cant.</th>
                                        <th className="py-1.5 px-2 text-left w-[65%]">Descripción</th>
                                        <th className="py-1.5 px-2 text-right w-[12%]">P. Unit</th>
                                        <th className="py-1.5 px-2 text-right rounded-tr-md w-[13%]">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800">
                                    <tr className="border-b border-gray-100">
                                        <td className="py-2 px-2 text-center font-bold align-top">{trabajo.cantidad}</td>
                                        <td className="py-2 px-2 align-top">
                                            <p className="font-bold uppercase mb-0.5">{trabajo.subtipo}</p>
                                            <p className="text-[9px] text-gray-500 italic">Orden de Trabajo #{trabajo.orden}</p>
                                        </td>
                                        <td className="py-2 px-2 text-right align-top">{formatCurrency(unitPrice)}</td>
                                        <td className="py-2 px-2 text-right font-bold align-top">{formatCurrency(trabajo.total)}</td>
                                    </tr>
                                    {/* Empty rows filler for aesthetics */}
                                    {[...Array(6)].map((_, i) => (
                                        <tr key={i}><td className="py-2"></td><td></td><td></td><td></td></tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>

                         {/* Footer Totals & Signatures */}
                         <div className="relative z-10 mt-auto">
                             <div className="flex gap-4 items-end mb-6">
                                 {/* Notes / Payment Info */}
                                 <div className="w-7/12">
                                     <div className="bg-gray-100 rounded p-2 text-[8px] text-gray-500 leading-relaxed border border-gray-200">
                                         <p className="font-bold text-gray-700 mb-1">OBSERVACIONES:</p>
                                         <p>Pago realizado en su totalidad. Documento válido para crédito tributario en Negocios Populares.</p>
                                     </div>
                                 </div>
                                 
                                 {/* Totals Box */}
                                 <div className="w-5/12">
                                     <div className="border border-gray-300 rounded overflow-hidden text-[10px]">
                                         <div className="flex justify-between px-2 py-1 bg-gray-50 border-b border-gray-200">
                                             <span className="font-bold text-gray-600">SUBTOTAL</span>
                                             <span>{formatCurrency(trabajo.total)}</span>
                                         </div>
                                         <div className="flex justify-between px-2 py-1 bg-gray-50 border-b border-gray-200">
                                             <span className="font-bold text-gray-600">IVA 0%</span>
                                             <span>$0.00</span>
                                         </div>
                                         <div className="flex justify-between px-2 py-1.5 bg-brand-blue text-white font-bold">
                                             <span>VALOR TOTAL</span>
                                             <span>{formatCurrency(trabajo.total)}</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             {/* Signatures */}
                             <div className="grid grid-cols-2 gap-8 mt-4 pt-4 border-t border-gray-200">
                                <div className="text-center">
                                    <div className="h-10"></div>
                                    <div className="border-t border-gray-400 w-3/4 mx-auto mb-1"></div>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase">Firma Autorizada</p>
                                    <p className="text-[8px] text-gray-400">{config.imprentaNombre}</p>
                                </div>
                                <div className="text-center">
                                    <div className="h-10"></div>
                                    <div className="border-t border-gray-400 w-3/4 mx-auto mb-1"></div>
                                    <p className="text-[9px] font-bold text-gray-500 uppercase">Recibí Conforme</p>
                                    <p className="text-[8px] text-gray-400">{cliente.nombre}</p>
                                </div>
                             </div>
                             
                             <div className="mt-2 text-[8px] text-gray-400 text-center flex justify-between">
                                 <span>Válido hasta: {issuer.fechaCaducidad}</span>
                                 <span>Original: Adquirente / Copia: Emisor</span>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MODAL DE CONFIRMACIÓN DE RETIRO (LÓGICA ACTUALIZADA) ---
const RetiroModal: React.FC<{
    trabajo: Trabajo;
    cliente: Cliente;
    onClose: () => void;
    onConfirm: (pagoFinal: number) => void;
}> = ({ trabajo, cliente, onClose, onConfirm }) => {
    
    // El saldo a pagar es fijo (el saldo restante). No se permite edición.
    const saldoPendiente = trabajo.saldo;

    const handleConfirm = () => {
        onConfirm(saldoPendiente);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                 
                 {/* Header */}
                 <div className="bg-gradient-to-r from-brand-blue to-blue-800 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-bold">Confirmar Entrega</h2>
                        <p className="text-blue-200 text-xs mt-1 uppercase tracking-wide font-bold">Orden #{String(trabajo.orden).padStart(6,'0')}</p>
                    </div>
                    <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"><CloseIcon className="w-5 h-5 text-white" /></button>
                </div>

                <div className="p-6 space-y-6">
                    
                    {/* Job Metadata */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-600 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-brand-blue dark:text-blue-300">
                                <CalendarDaysIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Fecha de Pedido</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                    {new Date(trabajo.fechaEntrada).toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg text-purple-600 dark:text-purple-300">
                                <ClockIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Hora de Recepción</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                    {formatTime(trabajo.fechaEntrada)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 dark:bg-green-900/50 p-2 rounded-lg text-green-600 dark:text-green-300">
                                <UserPlusIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Atendido Por</p>
                                <p className="text-sm font-semibold text-gray-800 dark:text-white capitalize">
                                    {trabajo.creadoPor || 'Sistema'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 px-2">
                            <span>Costo Total:</span>
                            <span className="font-semibold">{formatCurrency(trabajo.total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 px-2">
                            <span>Abonado:</span>
                            <span className="font-semibold text-green-600">{formatCurrency(trabajo.abono)}</span>
                        </div>
                        
                        <div className={`p-5 rounded-xl border-2 flex justify-between items-center ${saldoPendiente > 0 ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900' : 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-900'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${saldoPendiente > 0 ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                                    <DollarIcon className="w-6 h-6" />
                                </div>
                                <span className={`font-bold text-sm uppercase tracking-wider ${saldoPendiente > 0 ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}`}>
                                    {saldoPendiente > 0 ? 'Saldo a Cobrar' : 'Trabajo Pagado'}
                                </span>
                            </div>
                            <span className={`text-2xl font-black ${saldoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(saldoPendiente)}
                            </span>
                        </div>

                        {saldoPendiente > 0 && (
                            <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-3 rounded-lg border border-orange-100">
                                <ExclamationTriangleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p className="font-medium">
                                    Política de la empresa: El saldo no es negociable. Debe cancelarse la totalidad para retirar el trabajo.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-5 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                        Cancelar
                    </button>
                    <button onClick={handleConfirm} className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all transform active:scale-95">
                        <DocumentCheckIcon className="h-5 w-5" />
                        {saldoPendiente > 0 ? 'Cobrar y Entregar' : 'Entregar Trabajo'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const RetirosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { addToast } = useToast();
    const [allTrabajos, setAllTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [comprobanteData, setComprobanteData] = useState<{ trabajo: Trabajo; cliente: Cliente; pagoFinal: number; usuario: string; } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const [trabajosData, clientesData] = await Promise.all([getTrabajos(), getClientes()]);
        setAllTrabajos(trabajosData);
        setClientes(clientesData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const trabajosEnVitrina = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return allTrabajos
            .filter(t => t.estado === TrabajoEstado.VITRINA)
            .filter(t => {
                const cliente = clientes.find(c => c.id === t.clienteId);
                return searchTerm === '' ||
                    String(t.orden).includes(lowercasedFilter) ||
                    t.subtipo.toLowerCase().includes(lowercasedFilter) ||
                    cliente?.nombre.toLowerCase().includes(lowercasedFilter);
            });
    }, [allTrabajos, clientes, searchTerm]);

    const handleConfirmRetiro = async (pagoFinal: number) => {
        if (!selectedTrabajo) return;

        const updatedTrabajo = await registerRetiro(selectedTrabajo.id, pagoFinal, currentUser.nombre);
        const cliente = clientes.find(c => c.id === selectedTrabajo.clienteId);

        if (cliente) {
             setComprobanteData({
                trabajo: updatedTrabajo,
                cliente,
                pagoFinal,
                usuario: currentUser.nombre
            });
        }
        
        setSelectedTrabajo(null);
    };
    
    const handleClosePreview = async () => {
        setComprobanteData(null);
        await fetchData(); // Refresh data from "API"
    };

    const handleCopyPaymentInfo = (trabajo: Trabajo, cliente: Cliente) => {
        const phone = "593993083943"; // Imprenta phone
        const waLink = `https://wa.me/${phone}`;
        
        const bankData = `🏦 *DATOS BANCARIOS*
Banco: Pichincha
Tipo: Corriente
Cuenta: 2100xxxxxx
Titular: Imprenta Córdova
RUC: 070xxxxxxx001`;

        const text = `Hola *${cliente.nombre}* 👋
Tu pedido *#${trabajo.orden}* (${trabajo.subtipo}) está listo para retirar.

💰 *Saldo Pendiente:* ${formatCurrency(trabajo.saldo)}

${bankData}

📸 Por favor envíe la foto del comprobante a este enlace: ${waLink}`;

        navigator.clipboard.writeText(text);
        addToast("Datos de cobro copiados al portapapeles", "success");
    };

    return (
        <>
            <style>{`
                @media print {
                    @page { size: A5; margin: 0; }
                    body { margin: 0; }
                    body * { visibility: hidden; }
                    #comprobante-preview-content, #comprobante-preview-content * { visibility: visible; }
                    #comprobante-preview-content { position: absolute; left: 0; top: 0; width: 100% !important; height: auto; margin: 0; padding: 0; border: none; box-shadow: none; }
                    .no-print { display: none !important; }
                }
            `}</style>
             <div className="space-y-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Retiro de Trabajos (Vitrina)</h1>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por #orden, cliente o producto..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-shadow"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <p className="p-12 text-center text-gray-500">Cargando trabajos en vitrina...</p>
                    ) : trabajosEnVitrina.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                           {trabajosEnVitrina.map(trabajo => {
                                const cliente = clientes.find(c => c.id === trabajo.clienteId);
                                const whatsappUrl = cliente ? generateWhatsAppUrl(cliente, trabajo) : '#';
                                
                                return (
                                     <li key={trabajo.id} className="p-5 hover:bg-blue-50 dark:hover:bg-gray-700/50 flex flex-col md:flex-row md:items-center gap-4 transition-colors group">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="bg-brand-blue text-white text-xs font-bold px-2 py-0.5 rounded">#{trabajo.orden}</span>
                                                <p className="font-bold text-gray-900 dark:text-white text-lg">{cliente?.nombre}</p>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{trabajo.subtipo}</p>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <CalendarDaysIcon className="w-3 h-3"/> {new Date(trabajo.fechaEntrada).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                                            <div className="text-right">
                                                {trabajo.saldo === 0 ? (
                                                    <p className="font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">Pagado</p>
                                                ) : (
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase font-bold">Pendiente</p>
                                                        <p className="font-black text-brand-red text-xl">{formatCurrency(trabajo.saldo)}</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {/* Botón WhatsApp */}
                                                <a 
                                                    href={whatsappUrl}
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-2.5 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-colors border border-green-200 flex items-center gap-2"
                                                    title="Notificar por WhatsApp"
                                                >
                                                    <WhatsAppIcon className="w-5 h-5" />
                                                    <span className="text-sm font-bold hidden lg:inline">Avisar</span>
                                                </a>

                                                {/* Botón Copiar Link Cobro (Solo si hay saldo) */}
                                                {trabajo.saldo > 0 && cliente && (
                                                    <button 
                                                        onClick={() => handleCopyPaymentInfo(trabajo, cliente)}
                                                        className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors border border-indigo-200 flex items-center gap-2"
                                                        title="Copiar datos de cobro"
                                                    >
                                                        <CopyIcon className="w-5 h-5" />
                                                        <span className="text-sm font-bold hidden lg:inline">Copiar Cobro</span>
                                                    </button>
                                                )}

                                                <button onClick={() => setSelectedTrabajo(trabajo)} className="px-5 py-2.5 bg-white border-2 border-brand-blue text-brand-blue font-bold rounded-lg hover:bg-brand-blue hover:text-white transition-all shadow-sm">
                                                    Entregar
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                           })}
                        </ul>
                    ) : (
                         <div className="p-12 text-center">
                             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                 <SearchIcon className="w-8 h-8 text-gray-400"/>
                             </div>
                             <p className="text-gray-500 font-medium">No hay trabajos en vitrina que coincidan con la búsqueda.</p>
                         </div>
                    )}
                </div>
            </div>

            {selectedTrabajo && clientes.find(c => c.id === selectedTrabajo.clienteId) && (
                <RetiroModal
                    trabajo={selectedTrabajo}
                    cliente={clientes.find(c => c.id === selectedTrabajo.clienteId)!}
                    onClose={() => setSelectedTrabajo(null)}
                    onConfirm={handleConfirmRetiro}
                />
            )}
            
            {comprobanteData && <ComprobantePreviewModal data={comprobanteData} onClose={handleClosePreview} />}
        </>
    );
};

export default RetirosPage;
