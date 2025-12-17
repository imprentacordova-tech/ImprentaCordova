
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente } from '../types';
import { formatCurrency } from '../utils';
import { ArrowDownTrayIcon, PrinterIcon } from '../components/Icons';
import { getConfig, NotaDeVentaConfig } from '../services/configService';
import QRCode from 'qrcode'; // Library for generation

// Declare html2pdf for TypeScript
declare const html2pdf: any;

const NotaDeVentaPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [config, setConfig] = useState<NotaDeVentaConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState('');

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
                
                // Generate QR Code with tracking link
                try {
                    const trackingUrl = `${window.location.origin}/#/tracking?id=${currentTrabajo.id}`;
                    const url = await QRCode.toDataURL(trackingUrl, { width: 100, margin: 0 });
                    setQrDataUrl(url);
                } catch (err) {
                    console.error("QR Gen Error", err);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [trabajoId]);
    
    const handleGeneratePdf = () => {
        if (!trabajo) return;
        const element = document.getElementById('nota-de-venta-imprimible');
        const opt = {
          margin:       0,
          filename:     `NotaDeVenta-${trabajo.orden}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
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
        fechaAutorizacion: new Date(config.fechaAutorizacion).toLocaleDateString('es-EC', { timeZone: 'UTC' }),
        fechaCaducidad: new Date(config.fechaCaducidad).toLocaleDateString('es-EC', { timeZone: 'UTC' }),
        telefono: config.emisorTelefono,
        email: config.emisorEmail
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
                    @page { size: A5; margin: 0; }
                    body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    body * { visibility: hidden; }
                    #nota-de-venta-imprimible, #nota-de-venta-imprimible * { visibility: visible; }
                    #nota-de-venta-imprimible { 
                        position: absolute; left: 0; top: 0; 
                        width: 148mm !important; height: 210mm !important; 
                        margin: 0; padding: 10mm !important; 
                        border: none; box-shadow: none; box-sizing: border-box;
                    }
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

                {/* A5 Container optimized */}
                <div id="nota-de-venta-imprimible" className="bg-white p-6 shadow-xl border border-gray-200" style={{width: '148mm', minHeight: '210mm', padding: '10mm', fontFamily: 'Arial, sans-serif'}}>
                    <div className="border border-gray-800 p-3 h-full flex flex-col rounded-sm relative">
                        
                        {/* Top Section: Issuer & SRI Box */}
                        <div className="flex justify-between gap-3 mb-3">
                            {/* Left: Issuer Info */}
                            <div className="w-3/5 pt-1">
                                <div className="text-left mb-2">
                                    <h1 className="font-black text-lg text-gray-900 uppercase tracking-tight leading-none mb-1">{issuer.nombreComercial}</h1>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase leading-tight">{issuer.razonSocial}</p>
                                </div>
                                <div className="text-[8px] space-y-0.5 text-gray-600 leading-tight">
                                    <p className="font-bold text-brand-blue text-[9px] uppercase">{issuer.tipoContribuyente}</p>
                                    <p><strong>Matriz:</strong> {issuer.direccionMatriz}</p>
                                    {issuer.direccionSucursal && <p><strong>Sucursal:</strong> {issuer.direccionSucursal}</p>}
                                    <p><strong>Tel:</strong> {config.emisorTelefono} <strong>Email:</strong> {config.emisorEmail}</p>
                                </div>
                            </div>

                            {/* Right: SRI Info Box */}
                            <div className="w-2/5">
                                <div className="border border-gray-800 rounded-md p-2 bg-gray-50/50">
                                    <p className="text-xs font-bold text-gray-800">R.U.C. {issuer.ruc}</p>
                                    <div className="bg-brand-blue text-white text-center text-xs font-bold py-1 my-1 rounded-sm shadow-sm">
                                        NOTA DE VENTA
                                    </div>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-[9px] font-bold text-gray-500">No.</span>
                                        <span className="font-mono text-base font-bold text-red-600">{issuer.notaNro}</span>
                                    </div>
                                    <div className="text-[8px] text-gray-500 border-t border-gray-300 pt-1 mt-1 leading-tight">
                                        <p><strong>AUT. SRI:</strong> {issuer.autorizacionSRI}</p>
                                        <p><strong>FECHA AUT.:</strong> {issuer.fechaAutorizacion}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Client Section */}
                        <div className="bg-gray-100 rounded-md p-2 mb-2 border border-gray-200">
                            <div className="flex flex-wrap gap-y-1 text-[10px]">
                                <div className="w-2/3">
                                    <span className="font-bold text-gray-500 mr-2 text-[9px]">CLIENTE:</span>
                                    <span className="font-bold text-gray-900 uppercase">{cliente.nombre}</span>
                                </div>
                                <div className="w-1/3 text-right">
                                    <span className="font-bold text-gray-500 mr-2 text-[9px]">RUC/CI:</span>
                                    <span className="font-mono text-gray-900">{cliente.ruc || cliente.cedula}</span>
                                </div>
                                <div className="w-2/3">
                                    <span className="font-bold text-gray-500 mr-2 text-[9px]">DIR:</span>
                                    <span className="text-gray-900 uppercase text-[9px]">{cliente.direccion || 'Ciudad'}</span>
                                </div>
                                <div className="w-1/3 text-right">
                                    <span className="font-bold text-gray-500 mr-2 text-[9px]">FECHA:</span>
                                    <span className="font-mono text-gray-900">{emissionDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Table Section */}
                        <div className="flex-grow">
                            <table className="w-full border-collapse text-[10px]">
                                <thead>
                                    <tr className="bg-brand-blue text-white">
                                        <th className="border border-brand-blue py-1 w-[10%] font-bold">CANT.</th>
                                        <th className="border border-brand-blue py-1 w-[60%] font-bold text-left px-2">DESCRIPCIÓN</th>
                                        <th className="border border-brand-blue py-1 w-[15%] font-bold text-right px-1">P. UNIT.</th>
                                        <th className="border border-brand-blue py-1 w-[15%] font-bold text-right px-1">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800">
                                    <tr>
                                        <td className="border-x border-gray-300 py-1 text-center align-top font-bold">{trabajo.cantidad}</td>
                                        <td className="border-x border-gray-300 py-1 px-2 align-top uppercase leading-tight">{trabajo.subtipo}</td>
                                        <td className="border-x border-gray-300 py-1 text-right px-2 align-top">{formatCurrency(unitPrice).replace('$','')}</td>
                                        <td className="border-x border-gray-300 py-1 text-right px-2 align-top font-bold">{formatCurrency(trabajo.total).replace('$','')}</td>
                                    </tr>
                                    {/* Fillers to maintain height */}
                                    {[...Array(10)].map((_, i) => (
                                         <tr key={i}><td className="border-x border-gray-300 h-5"></td><td className="border-x border-gray-300"></td><td className="border-x border-gray-300"></td><td className="border-x border-gray-300"></td></tr>
                                    ))}
                                    <tr className="border-t border-gray-300">
                                        <td colSpan={2} className="p-1 align-bottom">
                                             <div className="text-[8px] text-gray-500 border border-gray-200 rounded p-1">
                                                <span className="font-bold">FORMA DE PAGO:</span> Efectivo [ x ] &nbsp; Dinero Elec. [ &nbsp; ] &nbsp; Tarjeta [ &nbsp; ] &nbsp; Otros [ &nbsp; ]
                                             </div>
                                        </td>
                                        <td className="border border-gray-300 p-1 font-bold bg-gray-100 text-right pr-2 text-[9px]">TOTAL $</td>
                                        <td className="border border-gray-300 p-1 font-bold text-right pr-2 text-xs">{formatCurrency(trabajo.total).replace('$','')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Section */}
                        <div className="mt-2 pt-2 border-t border-gray-800 flex items-end justify-between text-[9px] text-gray-600 px-1">
                            <div className="w-5/12 leading-tight">
                                <p className="font-bold text-gray-800">{printer.nombre}</p>
                                <p>RUC: {printer.ruc} • Aut. {printer.autorizacion}</p>
                                <p className="mt-0.5">Válido hasta: <span className="font-bold text-gray-900">{fechaCaducidad}</span></p>
                            </div>
                            
                            {/* QR Code Placement */}
                            <div className="w-2/12 flex justify-center">
                                {qrDataUrl && <img src={qrDataUrl} alt="QR Rastreo" className="w-16 h-16 object-contain" />}
                            </div>

                            <div className="w-5/12 flex gap-4 justify-end">
                                <div className="text-center w-24">
                                    <div className="border-t border-gray-400 mb-1"></div>
                                    <span className="font-bold text-gray-500 uppercase text-[8px]">Firma Autorizada</span>
                                </div>
                                <div className="text-center w-24">
                                    <div className="border-t border-gray-400 mb-1"></div>
                                    <span className="font-bold text-gray-500 uppercase text-[8px]">Recibí Conforme</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center text-[7px] text-gray-400 mt-1">
                            Original: Adquirente / Copia: Emisor
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NotaDeVentaPage;
