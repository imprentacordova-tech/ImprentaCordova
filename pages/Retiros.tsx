
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getTrabajos, getClientes, registerRetiro } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, User } from '../types';
import { formatCurrency } from '../utils';
import { SearchIcon, CloseIcon, DocumentCheckIcon, PrinterIcon, ArrowDownTrayIcon, MapPinIcon, PhoneIcon, EnvelopeIcon, DollarIcon, ExclamationTriangleIcon } from '../components/Icons';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

// Declare html2pdf for TypeScript
declare const html2pdf: any;


// New Comprobante Preview Modal
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
          filename:     `Comprobante-Entrega-${trabajo.orden}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
          jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (!config) {
        return <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"><p className="text-white">Cargando configuración...</p></div>;
    }

    const issuer = {
        nombreComercial: config.emisorNombreComercial,
        razonSocial: config.emisorRazonSocial,
        tipoContribuyente: config.emisorTipoContribuyente,
        direccionMatriz: config.emisorDireccionMatriz,
        direccionSucursal: config.emisorDireccionSucursal,
        // Added missing properties required by the template
        direccion: config.emisorDireccionCompleta,
        telefono: config.emisorTelefono,
        email: config.emisorEmail,
        ruc: config.emisorRuc,
        notaNro: `${config.numeracionPrefijo}${String(trabajo.orden).padStart(9, '0').slice(-9)}`,
        autorizacionSRI: config.autorizacionSRI,
        fechaAutorizacion: new Date(config.fechaAutorizacion).toLocaleDateString('es-EC', { timeZone: 'UTC' })
    };
    
    const unitPrice = trabajo.cantidad > 0 ? trabajo.total / trabajo.cantidad : 0;
    const emissionDate = new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-gray-100 dark:bg-gray-900 w-full max-w-4xl h-[95vh] rounded-xl shadow-2xl flex flex-col">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-t-xl flex justify-between items-center border-b dark:border-gray-700 flex-shrink-0 no-print">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">Vista Previa</h3>
                    <div className="flex items-center gap-3">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            <PrinterIcon className="h-5 w-5" /> Imprimir
                        </button>
                        <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                           <ArrowDownTrayIcon className="h-5 w-5" /> Descargar PDF
                        </button>
                        <button onClick={onClose}>
                            <CloseIcon className="w-8 h-8 p-1 text-gray-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" />
                        </button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-4 font-sans flex justify-center bg-gray-200 dark:bg-gray-900">
                    <div id="comprobante-preview-content" className="bg-white shadow-2xl relative flex flex-col" style={{ width: '148mm', minHeight: '210mm', padding: '15mm' }}>
                         
                         {/* Decorative Top Bar */}
                         <div className="absolute top-0 left-0 w-full h-2 bg-brand-blue"></div>

                         {/* Header */}
                         <div className="flex justify-between items-start mb-10">
                            <div className="w-7/12">
                                <h1 className="text-2xl font-black text-brand-blue uppercase tracking-tight mb-2">{issuer.nombreComercial}</h1>
                                <div className="text-[10px] text-gray-500 space-y-1 font-medium">
                                    <p className="text-gray-800 font-bold uppercase">{issuer.razonSocial}</p>
                                    <p className="flex items-center gap-1"><MapPinIcon className="w-3 h-3 text-brand-red"/> {issuer.direccion}</p>
                                    <p className="flex items-center gap-1"><PhoneIcon className="w-3 h-3 text-brand-red"/> {issuer.telefono}</p>
                                    <p className="flex items-center gap-1"><EnvelopeIcon className="w-3 h-3 text-brand-red"/> {issuer.email}</p>
                                </div>
                            </div>
                            <div className="w-5/12 text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Comprobante de Entrega</p>
                                <p className="text-3xl font-mono font-bold text-red-600">#{String(trabajo.orden).padStart(6, '0')}</p>
                                <p className="text-[10px] text-gray-400 mt-1 font-medium">RUC: {issuer.ruc}</p>
                                <p className="text-[10px] text-gray-800 mt-2 font-bold">{emissionDate}</p>
                            </div>
                         </div>

                         {/* Separator */}
                         <div className="border-b border-gray-100 mb-8"></div>

                         {/* Client & Job Info */}
                         <div className="grid grid-cols-2 gap-8 mb-10">
                            <div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cliente</h3>
                                <p className="font-bold text-gray-900 text-sm uppercase mb-1">{cliente.nombre}</p>
                                <p className="text-xs text-gray-600 mb-1"><span className="font-medium text-gray-400">ID:</span> {cliente.ruc || cliente.cedula}</p>
                                {cliente.telefono.length > 0 && <p className="text-xs text-gray-600"><span className="font-medium text-gray-400">Tel:</span> {cliente.telefono[0]}</p>}
                            </div>
                            <div className="text-right">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Detalles del Trabajo</h3>
                                <p className="font-bold text-gray-900 text-sm uppercase mb-1">{trabajo.subtipo}</p>
                                <p className="text-xs text-gray-600"><span className="font-medium text-gray-400">Titular:</span> {trabajo.titular}</p>
                            </div>
                         </div>

                         {/* Items Table */}
                         <div className="mb-8 flex-grow">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                                        <th className="py-3 px-4 font-bold text-left w-[15%] rounded-l-lg">Cant.</th>
                                        <th className="py-3 px-4 font-bold text-left w-[55%]">Descripción</th>
                                        <th className="py-3 px-4 font-bold text-right w-[15%]">P. Unit</th>
                                        <th className="py-3 px-4 font-bold text-right w-[15%] rounded-r-lg">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800">
                                    <tr className="border-b border-gray-100">
                                        <td className="py-4 px-4 font-medium">{trabajo.cantidad}</td>
                                        <td className="py-4 px-4 uppercase font-medium">{trabajo.subtipo}</td>
                                        <td className="py-4 px-4 text-right">{formatCurrency(unitPrice)}</td>
                                        <td className="py-4 px-4 text-right font-bold">{formatCurrency(trabajo.total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                         </div>

                         {/* Totals Section */}
                         <div className="flex justify-end mb-16">
                             <div className="w-1/2 space-y-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Total del Trabajo</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(trabajo.total)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Total Abonado</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(trabajo.abono - pagoFinal)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-brand-blue py-2 border-t border-b border-gray-100 my-2 bg-blue-50 px-2 rounded">
                                    <span>Pago Final Recibido</span>
                                    <span>{formatCurrency(pagoFinal)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <span>Saldo Pendiente</span>
                                    <span>{formatCurrency(trabajo.saldo)}</span>
                                </div>
                             </div>
                         </div>

                         {/* Footer Signatures */}
                         <div className="mt-auto">
                            <div className="grid grid-cols-2 gap-12 mb-8">
                                <div className="text-center">
                                    <div className="border-t border-gray-300 w-3/4 mx-auto mb-2"></div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Entregado Por</p>
                                    <p className="text-xs font-medium text-gray-800 mt-1">{usuario}</p>
                                </div>
                                <div className="text-center">
                                    <div className="border-t border-gray-300 w-3/4 mx-auto mb-2"></div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Recibido Conforme</p>
                                    <p className="text-xs font-medium text-gray-800 mt-1">{cliente.nombre}</p>
                                </div>
                            </div>
                            <p className="text-[8px] text-gray-400 text-center italic">
                                Documento generado automáticamente por Sistema Imprenta Córdova. Comprobante de uso interno.
                            </p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Modal for confirming withdrawal
const RetiroModal: React.FC<{
    trabajo: Trabajo;
    cliente: Cliente;
    onClose: () => void;
    onConfirm: (pagoFinal: number) => void;
}> = ({ trabajo, cliente, onClose, onConfirm }) => {
    const [pagoFinal, setPagoFinal] = useState(trabajo.saldo);
    const [error, setError] = useState('');

    const handleConfirm = () => {
        // Ensure validation allows full payment
        if (trabajo.saldo > 0 && (pagoFinal <= 0 || pagoFinal > trabajo.saldo)) {
            setError(`El pago debe ser mayor que 0 y no mayor al saldo de ${formatCurrency(trabajo.saldo)}.`);
            return;
        }
        setError('');
        onConfirm(pagoFinal);
    };

    const handleQuickAmount = (amount: number | 'total') => {
        if (amount === 'total') {
            setPagoFinal(trabajo.saldo);
        } else {
            setPagoFinal(amount);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Confirmar Retiro de Trabajo</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <div className="p-6 space-y-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        Vas a marcar el trabajo <strong className="text-gray-900 dark:text-white">#{trabajo.orden}</strong> de <strong className="text-gray-900 dark:text-white">{cliente.nombre}</strong> como ENTREGADO.
                    </p>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2 border border-gray-100 dark:border-gray-600">
                        <div className="flex justify-between text-sm"><span>Total del Trabajo:</span><span className="font-semibold">{formatCurrency(trabajo.total)}</span></div>
                        <div className="flex justify-between text-sm"><span>Abonado previamente:</span><span className="font-semibold">{formatCurrency(trabajo.abono)}</span></div>
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2 flex justify-between items-center">
                            <span className="font-bold text-brand-red">Saldo a Pagar:</span>
                            <span className="font-extrabold text-xl text-brand-red">{formatCurrency(trabajo.saldo)}</span>
                        </div>
                    </div>

                    {trabajo.saldo > 0 && (
                        <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Caja Rápida</p>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <button onClick={() => handleQuickAmount('total')} className="col-span-2 py-2 bg-green-100 text-green-800 font-bold rounded-lg hover:bg-green-200 transition-colors border border-green-200">
                                    Saldo Total
                                </button>
                                {[5, 10, 20].map(amt => (
                                    amt <= trabajo.saldo && (
                                        <button key={amt} onClick={() => handleQuickAmount(amt)} className="py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors border border-gray-200">
                                            ${amt}
                                        </button>
                                    )
                                ))}
                            </div>

                            <label htmlFor="pagoFinal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto Recibido</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input
                                    type="number"
                                    id="pagoFinal"
                                    value={pagoFinal}
                                    onChange={e => setPagoFinal(parseFloat(e.target.value) || 0)}
                                    className="block w-full pl-8 p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 font-bold text-lg focus:ring-2 focus:ring-brand-blue outline-none"
                                    step="0.01"
                                    min="0.01"
                                    max={trabajo.saldo}
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><ExclamationTriangleIcon className="w-4 h-4"/> {error}</p>}
                        </div>
                    )}
                </div>
                <div className="flex justify-end pt-4 gap-3 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button onClick={handleConfirm} className="flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all transform active:scale-95">
                        <DocumentCheckIcon className="h-5 w-5" />
                        Confirmar Entrega
                    </button>
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

    return (
        <>
            <style>{`
                @media print {
                    @page { size: A5; margin: 0; }
                    body { margin: 0; }
                    body * { visibility: hidden; }
                    #comprobante-preview-content, #comprobante-preview-content * { visibility: visible; }
                    #comprobante-preview-content { position: absolute; left: 0; top: 0; width: 100%; height: auto; margin: 0; padding: 0; border: none; box-shadow: none; }
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
                                return (
                                     <li key={trabajo.id} className="p-5 hover:bg-blue-50 dark:hover:bg-gray-700/50 flex flex-wrap justify-between items-center gap-4 transition-colors group">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="bg-brand-blue text-white text-xs font-bold px-2 py-0.5 rounded">#{trabajo.orden}</span>
                                                <p className="font-bold text-gray-900 dark:text-white text-lg">{cliente?.nombre}</p>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{trabajo.subtipo}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-6">
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
                                            <button onClick={() => setSelectedTrabajo(trabajo)} className="px-5 py-2.5 bg-white border-2 border-brand-blue text-brand-blue font-bold rounded-lg hover:bg-brand-blue hover:text-white transition-all shadow-sm">
                                                Entregar
                                            </button>
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
