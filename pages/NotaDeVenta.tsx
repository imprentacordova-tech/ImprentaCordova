
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente } from '../types';
import { formatCurrency } from '../utils';
import { ArrowDownTrayIcon, PrinterIcon } from '../components/Icons';
import { getConfig, NotaDeVentaConfig } from '../services/configService';


// Declare html2pdf for TypeScript
declare const html2pdf: any;

const NotaDeVentaPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
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
                const currentCliente = clientesData.find(c => c.id === currentTrabajo.clienteId);
                setCliente(currentCliente || null);
            }
            setLoading(false);
        };
        fetchData();
    }, [trabajoId]);
    
    const handleGeneratePdf = () => {
        if (!trabajo) return;
        const element = document.getElementById('nota-de-venta-imprimible');
        const opt = {
          margin:       0.2,
          filename:     `NotaDeVenta-${trabajo.orden}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'in', format: 'a5', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading || !config) {
        return <div className="text-center p-10">Cargando nota de venta...</div>;
    }

    if (!trabajo || !cliente) {
        return <div className="text-center p-10 text-red-500">No se encontró el trabajo o el cliente.</div>;
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
        fechaAutorizacion: new Date(config.fechaAutorizacion).toLocaleDateString('es-EC', { timeZone: 'UTC' })
    };
    
    const printer = {
        nombre: config.imprentaNombre,
        ruc: config.imprentaRuc,
        autorizacion: config.imprentaAutorizacion
    };
    
    const fechaCaducidad = new Date(config.fechaCaducidad).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
    const unitPrice = trabajo.cantidad > 0 ? trabajo.total / trabajo.cantidad : 0;
    const emissionDate = new Date(trabajo.fechaEntrada).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' - ');

    return (
        <>
            <style>{`
                @media print {
                    @page { size: A5; margin: 0.5cm; }
                    body { margin: 0; }
                    body * { visibility: hidden; }
                    #nota-de-venta-imprimible, #nota-de-venta-imprimible * { visibility: visible; }
                    #nota-de-venta-imprimible { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; border: none; box-shadow: none; }
                    .no-print { display: none !important; }
                }
            `}</style>
            <div className="bg-gray-100 dark:bg-gray-900 p-4 sm:p-8 font-sans flex flex-col items-center">
                <div className="flex justify-end mb-4 no-print gap-4 w-full max-w-[148mm]">
                     <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        <PrinterIcon className="h-5 w-5" />
                        <span>Imprimir</span>
                    </button>
                    <button onClick={handleGeneratePdf} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 transition-colors">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        <span>Generar PDF</span>
                    </button>
                </div>

                <div id="nota-de-venta-imprimible" className="bg-white p-6 shadow-xl border border-gray-200" style={{width: '148mm', minHeight: '210mm', fontFamily: 'Arial, sans-serif'}}>
                    <div className="border border-gray-800 p-2 h-full flex flex-col rounded-sm">
                        
                        {/* Top Section: Issuer & SRI Box */}
                        <div className="flex justify-between gap-4 mb-4">
                            {/* Left: Issuer Info */}
                            <div className="w-3/5">
                                <div className="text-center mb-3">
                                    <h1 className="font-black text-xl text-gray-900 uppercase tracking-wide">{issuer.nombreComercial}</h1>
                                    <p className="text-sm font-bold text-gray-700">{issuer.razonSocial}</p>
                                </div>
                                <div className="text-[10px] space-y-1 text-gray-600">
                                    <p className="font-bold text-gray-800 text-[11px]">{issuer.tipoContribuyente}</p>
                                    <p><strong className="text-gray-800">Matriz:</strong> {issuer.direccionMatriz}</p>
                                    <p><strong className="text-gray-800">Sucursal:</strong> {issuer.direccionSucursal}</p>
                                </div>
                            </div>

                            {/* Right: SRI Info Box */}
                            <div className="w-2/5 border border-gray-800 rounded-lg p-3 flex flex-col justify-between bg-gray-50/50">
                                <div>
                                    <p className="text-sm font-bold">R.U.C. {issuer.ruc}</p>
                                    <div className="bg-brand-blue text-white text-center text-xs font-bold py-1 my-2 rounded-sm">
                                        NOTA DE VENTA
                                    </div>
                                    <p className="text-xs text-center mb-1 tracking-widest">RIMPE</p>
                                    <p className="text-sm font-mono text-center mb-2">No. {issuer.notaNro}</p>
                                </div>
                                <div className="text-[10px] text-gray-600">
                                    <p><strong>AUT. SRI:</strong> {issuer.autorizacionSRI}</p>
                                    <p><strong>FECHA AUT.:</strong> {issuer.fechaAutorizacion}</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Client Section */}
                        <div className="border-t border-b border-gray-800 py-2 mb-4 bg-gray-50/30 px-2">
                            <div className="flex justify-between mb-1">
                                <p className="text-xs w-2/3"><span className="font-bold">Señor(es):</span> {cliente.nombre}</p>
                                <p className="text-xs w-1/3 text-right"><span className="font-bold">RUC/CI:</span> {cliente.ruc || cliente.cedula}</p>
                            </div>
                            <div className="flex justify-between">
                                <p className="text-xs"><span className="font-bold">Fecha de Emisión:</span> {emissionDate}</p>
                                <p className="text-xs text-right"><span className="font-bold">Guía de Remisión:</span> ____________</p>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="flex-grow">
                            <table className="w-full border-collapse text-xs">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-800">
                                        <th className="border border-gray-400 py-1 w-[10%] font-bold">CANT.</th>
                                        <th className="border border-gray-400 py-1 w-[60%] font-bold text-left px-2">DESCRIPCIÓN</th>
                                        <th className="border border-gray-400 py-1 w-[15%] font-bold">P. UNIT.</th>
                                        <th className="border border-gray-400 py-1 w-[15%] font-bold">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border-x border-gray-400 py-2 text-center align-top font-medium">{trabajo.cantidad}</td>
                                        <td className="border-x border-gray-400 py-2 px-2 align-top uppercase">{trabajo.subtipo}</td>
                                        <td className="border-x border-gray-400 py-2 text-right px-2 align-top">{formatCurrency(unitPrice).replace('$','')}</td>
                                        <td className="border-x border-gray-400 py-2 text-right px-2 align-top font-bold">{formatCurrency(trabajo.total).replace('$','')}</td>
                                    </tr>
                                    {/* Fillers */}
                                    {[...Array(10)].map((_, i) => (
                                         <tr key={i}><td className="border-x border-gray-400 h-5"></td><td className="border-x border-gray-400"></td><td className="border-x border-gray-400"></td><td className="border-x border-gray-400"></td></tr>
                                    ))}
                                    <tr className="border-t border-gray-400">
                                        <td colSpan={2} rowSpan={2} className="align-top p-2">
                                            <div className="border border-gray-300 p-2 rounded text-[9px]">
                                                <p className="font-bold mb-1">FORMA DE PAGO</p>
                                                <div className="flex justify-between mb-1"><span>Efectivo</span><span>$ {formatCurrency(trabajo.total).replace('$','')}</span></div>
                                                <div className="flex justify-between mb-1"><span>Dinero Electrónico</span><span>_______</span></div>
                                                <div className="flex justify-between"><span>Tarjeta Crédito/Débito</span><span>_______</span></div>
                                            </div>
                                        </td>
                                        <td className="border border-gray-400 p-1 font-bold bg-gray-100 text-right pr-2">TOTAL $</td>
                                        <td className="border border-gray-400 p-1 font-bold text-right pr-2 text-sm">{formatCurrency(trabajo.total).replace('$','')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Section */}
                        <div className="mt-4 pt-2 border-t border-gray-800 flex items-end justify-between text-[9px] text-gray-600 px-2">
                            <div className="w-1/2">
                                <p className="font-bold text-gray-800">{printer.nombre}</p>
                                <p>RUC: {printer.ruc} • Aut. {printer.autorizacion}</p>
                                <p className="mt-1">Válido para su emisión hasta: <span className="font-bold">{fechaCaducidad}</span></p>
                            </div>
                            <div className="w-1/2 flex gap-4 justify-end">
                                <div className="text-center w-24 pt-4 border-t border-gray-400">Firma Autorizada</div>
                                <div className="text-center w-24 pt-4 border-t border-gray-400">Recibí Conforme</div>
                            </div>
                        </div>
                        
                        <div className="mt-2 text-center text-[9px] text-gray-400 italic">
                            Original: Adquirente / Copia: Emisor
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotaDeVentaPage;
