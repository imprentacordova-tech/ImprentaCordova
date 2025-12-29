
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getTrabajos, getClientes, registerRetiro } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, User } from '../types';
import { formatCurrency } from '../utils';
// Added Loader2Icon, ArrowRightIcon, and BoxIcon to the imports
import { 
    SearchIcon, CloseIcon, DocumentCheckIcon, PrinterIcon, ArrowDownTrayIcon, 
    MapPinIcon, PhoneIcon, EnvelopeIcon, DollarIcon, ExclamationTriangleIcon, 
    ClockIcon, UserPlusIcon, CalendarDaysIcon, CordovaLogo, ShieldCheckIcon,
    Loader2Icon, ArrowRightIcon, BoxIcon
} from '../components/Icons';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

// Declare html2pdf for TypeScript
declare const html2pdf: any;

const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// --- MODAL DE VISTA PREVIA DEL COMPROBANTE ---
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
          margin:       0,
          filename:     `NotaVenta-${trabajo.orden}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
          jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (!config) return null;

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
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[95vh] rounded-[3rem] shadow-3xl flex flex-col overflow-hidden border border-white/10">
                <div className="p-8 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50 border-b dark:border-gray-800 no-print">
                    <div>
                        <h3 className="text-2xl font-black text-brand-blue dark:text-white uppercase tracking-tighter flex items-center gap-3">
                            <ShieldCheckIcon className="w-7 h-7 text-emerald-500"/>
                            Entrega Confirmada
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Comprobante de Caja Generado</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="flex items-center gap-3 px-6 py-3 bg-brand-blue text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-950 transition-all shadow-xl">
                            <PrinterIcon className="h-4 w-4" /> Imprimir
                        </button>
                        <button onClick={handleDownloadPdf} className="flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all">
                           <ArrowDownTrayIcon className="h-4 w-4" /> PDF
                        </button>
                        <button onClick={onClose} className="p-3 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all text-slate-400">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto p-12 bg-slate-200/50 dark:bg-slate-950 flex justify-center custom-scrollbar">
                    {/* Contenedor A5 */}
                    <div id="comprobante-preview-content" className="bg-white shadow-2xl relative flex flex-col box-border" style={{ width: '148mm', minHeight: '210mm', padding: '10mm' }}>
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                             <CordovaLogo className="w-64 h-64 grayscale" />
                         </div>
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
                                    <p className="leading-tight">{issuer.direccionMatriz}</p>
                                    <p className="flex items-center gap-1">Tel: {issuer.telefono} | {issuer.email}</p>
                                </div>
                            </div>
                            <div className="w-5/12">
                                <div className="border-2 border-brand-blue rounded-xl p-3 bg-blue-50/30 text-center">
                                    <p className="text-[10px] font-black text-gray-700">R.U.C. {issuer.ruc}</p>
                                    <div className="bg-brand-blue text-white text-xs font-black py-1.5 my-2 rounded-lg tracking-widest uppercase shadow-md">NOTA DE VENTA</div>
                                    <div className="font-mono text-xl font-black text-red-600 leading-none mb-1">{issuer.notaNro}</div>
                                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">AUT. SRI: {issuer.autorizacionSRI}</p>
                                </div>
                            </div>
                         </div>
                         <div className="border border-slate-100 rounded-2xl p-4 mb-6 bg-slate-50 relative z-10 grid grid-cols-12 gap-y-3">
                            <div className="col-span-8">
                                <span className="text-gray-400 font-black uppercase text-[7px] tracking-widest block mb-1">Señor(es)</span>
                                <span className="font-black text-slate-900 text-xs uppercase">{cliente.nombre}</span>
                            </div>
                            <div className="col-span-4 text-right">
                                <span className="text-gray-400 font-black uppercase text-[7px] tracking-widest block mb-1">RUC / C.I.</span>
                                <span className="font-mono font-bold text-slate-900">{cliente.ruc || cliente.cedula}</span>
                            </div>
                            <div className="col-span-8">
                                <span className="text-gray-400 font-black uppercase text-[7px] tracking-widest block mb-1">Fecha de Entrega</span>
                                <span className="font-bold text-slate-800 uppercase text-[10px]">{emissionDate}</span>
                            </div>
                            <div className="col-span-4 text-right">
                                <span className="text-gray-400 font-black uppercase text-[7px] tracking-widest block mb-1">Dirección</span>
                                <span className="font-bold text-slate-800 uppercase text-[10px] truncate">{cliente.direccion || 'Pasaje'}</span>
                            </div>
                         </div>
                         <div className="flex-grow mb-6 relative z-10">
                            <table className="w-full text-[10px] border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 text-white uppercase text-[8px] tracking-widest">
                                        <th className="py-2 px-3 text-center rounded-tl-xl w-[10%]">Cant</th>
                                        <th className="py-2 px-3 text-left w-[65%]">Descripción del Servicio</th>
                                        <th className="py-2 px-3 text-right w-[12%]">Unit</th>
                                        <th className="py-2 px-3 text-right rounded-tr-xl w-[13%]">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-slate-800 divide-y divide-slate-100 border-x border-slate-100">
                                    <tr>
                                        <td className="py-4 px-3 text-center font-black align-top">{trabajo.cantidad}</td>
                                        <td className="py-4 px-3 align-top">
                                            <p className="font-black uppercase text-[11px] mb-1">{trabajo.subtipo}</p>
                                            <p className="text-[8px] text-slate-400 italic">Servicio Gráfico Profesional - Orden #{trabajo.orden}</p>
                                        </td>
                                        <td className="py-4 px-3 text-right align-top font-bold">{formatCurrency(unitPrice)}</td>
                                        <td className="py-4 px-3 text-right font-black align-top text-brand-blue">{formatCurrency(trabajo.total)}</td>
                                    </tr>
                                    {[...Array(5)].map((_, i) => (
                                        <tr key={i}><td className="py-4"></td><td></td><td></td><td></td></tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                         <div className="relative z-10 mt-auto">
                             <div className="flex gap-6 items-end">
                                 <div className="w-7/12">
                                     <div className="bg-slate-50 rounded-2xl p-4 text-[7px] text-slate-400 leading-relaxed border border-slate-100">
                                         <p className="font-black text-slate-600 mb-1 uppercase tracking-widest">Condiciones:</p>
                                         <p>Documento de control interno para Régimen RIMPE. No transferible. Garantía de impresión de 30 días contra defectos de fabricación.</p>
                                     </div>
                                 </div>
                                 <div className="w-5/12 space-y-2">
                                     <div className="flex justify-between px-3 py-2 bg-slate-50 rounded-xl">
                                         <span className="text-[9px] font-black text-slate-500 uppercase">Subtotal</span>
                                         <span className="font-bold text-slate-900">{formatCurrency(trabajo.total)}</span>
                                     </div>
                                     <div className="flex justify-between px-3 py-3 bg-brand-blue text-white rounded-xl shadow-lg">
                                         <span className="text-[9px] font-black uppercase tracking-widest">Total Pagado</span>
                                         <span className="text-sm font-black tracking-tighter">{formatCurrency(trabajo.total)}</span>
                                     </div>
                                 </div>
                             </div>
                             <div className="grid grid-cols-2 gap-12 mt-12 mb-4">
                                <div className="text-center">
                                    <div className="border-t-2 border-slate-900 w-full mb-1"></div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-900">Firma Autorizada</p>
                                </div>
                                <div className="text-center">
                                    <div className="border-t-2 border-slate-900 w-full mb-1"></div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-900">Recibí Conforme</p>
                                </div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODAL DE RETIRO ---
const RetiroModal: React.FC<{
    trabajo: Trabajo;
    cliente: Cliente;
    onClose: () => void;
    onConfirm: (pagoFinal: number) => void;
}> = ({ trabajo, cliente, onClose, onConfirm }) => {
    const saldoPendiente = trabajo.saldo;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-3xl w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                 <div className="bg-brand-blue p-8 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Confirmar Entrega</h2>
                        <p className="text-blue-200 text-[10px] mt-2 uppercase tracking-[0.3em] font-black">Orden de Producción #{trabajo.orden}</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all"><CloseIcon className="w-6 h-6 text-white" /></button>
                </div>

                <div className="p-10 space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-2xl text-brand-blue shadow-inner">{cliente.nombre.charAt(0)}</div>
                        <div>
                            <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase leading-tight tracking-tight">{cliente.nombre}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{trabajo.subtipo}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-gray-700">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Abonado</span>
                            <span className="text-xl font-black text-emerald-500">{formatCurrency(trabajo.abono)}</span>
                        </div>
                        <div className={`p-5 rounded-3xl border ${saldoPendiente > 0 ? 'bg-red-50 border-red-100 dark:bg-red-900/20' : 'bg-green-50 border-green-100'}`}>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Por Cobrar</span>
                            <span className={`text-xl font-black ${saldoPendiente > 0 ? 'text-brand-red' : 'text-emerald-500'}`}>{formatCurrency(saldoPendiente)}</span>
                        </div>
                    </div>

                    {saldoPendiente > 0 && (
                        <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-800 flex items-start gap-4">
                            <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-bold leading-relaxed uppercase tracking-tight">
                                POLÍTICA: El trabajo solo se entrega tras cancelar el 100%. Por favor, realice el cobro del saldo antes de entregar.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-6 border-t dark:border-gray-800">
                        <button 
                            onClick={() => onConfirm(saldoPendiente)} 
                            className="w-full py-5 bg-brand-red text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-slate-950 transition-all flex items-center justify-center gap-4"
                        >
                            <DocumentCheckIcon className="w-5 h-5" /> {saldoPendiente > 0 ? `Cobrar y Entregar` : 'Entregar Ahora'}
                        </button>
                        <button onClick={onClose} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Volver a Vitrina</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RetirosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
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
             setComprobanteData({ trabajo: updatedTrabajo, cliente, pagoFinal, usuario: currentUser.nombre });
        }
        setSelectedTrabajo(null);
    };
    
    const handleClosePreview = async () => {
        setComprobanteData(null);
        await fetchData();
    };

    return (
        <div className="space-y-10 pb-20 animate-fade-in">
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

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Vitrina de <span className="text-brand-red">Entregas</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Control de caja y salida de producto terminado</p>
                </div>
                <div className="relative w-full md:w-96">
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                        type="text"
                        placeholder="Buscar por #Orden o Cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-xl text-sm font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center"><Loader2Icon className="animate-spin w-10 h-10 text-brand-blue mx-auto" /></div>
                ) : trabajosEnVitrina.length > 0 ? (
                    trabajosEnVitrina.map(trabajo => {
                        const cliente = clientes.find(c => c.id === trabajo.clienteId);
                        const isHighRisk = trabajo.saldo > (trabajo.total * 0.5);
                        return (
                            <div key={trabajo.id} className="group bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-xl border border-slate-50 dark:border-white/5 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="font-black text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full uppercase tracking-widest border dark:border-gray-700">Orden #{trabajo.orden}</span>
                                        {isHighRisk && <div className="w-2 h-2 rounded-full bg-brand-red animate-ping" title="Saldo Elevado"></div>}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight mb-2 truncate" title={cliente?.nombre}>{cliente?.nombre}</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest line-clamp-2 min-h-[32px]">{trabajo.subtipo}</p>
                                    
                                    <div className="mt-8 space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Total Inversión</span>
                                            <span className="text-slate-900 dark:text-white">{formatCurrency(trabajo.total)}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</span>
                                            <span className={`text-xl font-black ${trabajo.saldo > 0 ? 'text-brand-red' : 'text-emerald-500'}`}>{formatCurrency(trabajo.saldo)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setSelectedTrabajo(trabajo)} 
                                    className="mt-8 w-full py-4 bg-brand-blue text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-slate-950 transition-all flex items-center justify-center gap-3"
                                >
                                    Procesar Entrega <ArrowRightIcon className="w-4 h-4"/>
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-32 bg-white dark:bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-gray-800 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6"><BoxIcon className="w-10 h-10 text-slate-300" /></div>
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter italic">Vitrina Vacía</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">No hay trabajos listos para entrega en este momento</p>
                    </div>
                )}
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
        </div>
    );
};

export default RetirosPage;
