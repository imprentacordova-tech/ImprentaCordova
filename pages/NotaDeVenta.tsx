
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente } from '../types';
import { formatCurrency } from '../utils';
import { ArrowDownTrayIcon, PrinterIcon, CordovaLogo, MapPinIcon, PhoneIcon, EnvelopeIcon } from '../components/Icons';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

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
            const cfg = getConfig();
            setConfig(cfg);
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
    
    const handlePrint = () => window.print();

    if (loading || !config || !trabajo || !cliente) {
        return <div className="text-center p-20">Generando documento oficial...</div>;
    }

    const secuencialFormateado = String(trabajo.orden).padStart(9, '0');
    const notaNro = `${config.emisorEstablecimiento}-${config.emisorPuntoEmision}-${secuencialFormateado}`;
    
    const unitPrice = trabajo.cantidad > 0 ? trabajo.total / trabajo.cantidad : 0;
    const emissionDate = new Date(trabajo.fechaEntrada).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' - ');
    const caducidadFormateada = new Date(config.fechaCaducidad).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' - ');

    return (
        <div className="bg-slate-200 min-h-screen py-12 flex flex-col items-center">
            <style>{`
                @media print {
                    @page { size: A5; margin: 0; }
                    body { margin: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #nota-print-container { 
                        box-shadow: none !important; 
                        border: none !important;
                        width: 148mm !important;
                        height: 210mm !important;
                        margin: 0 !important;
                        padding: 10mm !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                    }
                }
            `}</style>

            <div className="w-full max-w-[148mm] flex justify-between mb-8 no-print px-4">
                <h1 className="text-slate-800 font-black text-sm uppercase tracking-widest">Vista Previa SRI</h1>
                <button onClick={handlePrint} className="bg-brand-blue text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-brand-navy transition-all">
                    <PrinterIcon className="w-5 h-5"/> Imprimir Nota de Venta
                </button>
            </div>

            {/* FORMATO A5 (148mm x 210mm) */}
            <div id="nota-print-container" className="bg-white shadow-2xl relative flex flex-col box-border border border-gray-300" style={{ width: '148mm', height: '210mm', padding: '10mm', fontFamily: 'Arial, sans-serif' }}>
                
                {/* CABECERA (LOGO + EMISOR + RUC BOX) */}
                <div className="flex justify-between items-start gap-4 mb-4">
                    {/* INFO EMISOR */}
                    <div className="w-7/12">
                        <div className="flex items-center gap-3 mb-2">
                             <CordovaLogo className="h-14 w-auto object-contain" />
                             <div>
                                <h2 className="text-xl font-black text-brand-blue uppercase leading-none">{config.emisorNombreComercial}</h2>
                                <p className="text-[9px] font-bold text-gray-700 uppercase mt-1">{config.emisorRazonSocial}</p>
                             </div>
                        </div>
                        <div className="space-y-0.5 text-[8px] text-gray-600 uppercase font-medium">
                            <p className="font-black text-brand-red text-[9px]">{config.emisorTipoContribuyente}</p>
                            <p className="leading-tight">{config.emisorActividades}</p>
                            <div className="mt-2 border-t pt-1">
                                <p><strong>Matriz:</strong> {config.emisorDireccionMatriz}</p>
                                <p><strong>Sucursal:</strong> {config.emisorDireccionSucursal}</p>
                                <p><strong>Tel:</strong> {config.emisorTelefono} | <strong>Email:</strong> {config.emisorEmail}</p>
                            </div>
                        </div>
                    </div>

                    {/* RUC BOX OFICIAL */}
                    <div className="w-5/12">
                        <div className="border-2 border-gray-800 rounded-2xl p-3 text-center bg-gray-50/50">
                            <p className="text-[11px] font-black text-gray-900">R.U.C. {config.emisorRuc}</p>
                            <div className="bg-brand-blue text-white text-[10px] font-black py-1.5 my-2 rounded-lg tracking-widest shadow-sm">NOTA DE VENTA</div>
                            <div className="flex justify-between items-baseline mb-1 px-2">
                                <span className="text-[10px] font-bold text-gray-500">Nº</span>
                                <span className="font-mono text-lg font-black text-red-600 tracking-tighter">{notaNro}</span>
                            </div>
                            <div className="text-[8px] text-gray-500 border-t border-gray-200 pt-1 mt-1 leading-tight text-left pl-2">
                                <p><strong>AUT. SRI:</strong> {config.autorizacionSRI}</p>
                                <p><strong>FECHA AUTORIZACIÓN:</strong> {new Date(config.fechaAutorizacion).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DATOS CLIENTE */}
                <div className="border border-gray-400 rounded-xl p-3 mb-4 bg-white grid grid-cols-12 gap-y-1.5 text-[10px] font-medium text-gray-800">
                    <div className="col-span-8 flex gap-2">
                        <span className="font-black text-gray-500 uppercase text-[9px]">Sr(es):</span>
                        <span className="font-black uppercase truncate">{cliente.nombre}</span>
                    </div>
                    <div className="col-span-4 text-right flex justify-end gap-2">
                        <span className="font-black text-gray-500 uppercase text-[9px]">RUC/CI:</span>
                        <span className="font-mono font-bold">{cliente.ruc || cliente.cedula}</span>
                    </div>
                    <div className="col-span-8 flex gap-2">
                        <span className="font-black text-gray-500 uppercase text-[9px]">Dir:</span>
                        <span className="uppercase truncate">{cliente.direccion || 'Pasaje'}</span>
                    </div>
                    <div className="col-span-4 text-right flex justify-end gap-2">
                        <span className="font-black text-gray-500 uppercase text-[9px]">Fecha:</span>
                        <span className="font-mono">{emissionDate}</span>
                    </div>
                    <div className="col-span-12 flex gap-2">
                        <span className="font-black text-gray-500 uppercase text-[9px]">Guía Remisión:</span>
                        <span className="border-b border-gray-300 flex-grow h-3"></span>
                    </div>
                </div>

                {/* TABLA DE PRODUCTOS */}
                <div className="flex-grow">
                    <table className="w-full border-collapse border border-gray-800 text-[10px]">
                        <thead>
                            <tr className="bg-gray-100 uppercase text-[8px] font-black text-gray-700">
                                <th className="border border-gray-800 p-1.5 w-[12%]">Cant.</th>
                                <th className="border border-gray-800 p-1.5 text-left w-[60%]">Descripción</th>
                                <th className="border border-gray-800 p-1.5 w-[14%]">P. Unit.</th>
                                <th className="border border-gray-800 p-1.5 w-[14%]">V. Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="h-8">
                                <td className="border-x border-gray-800 text-center font-bold">{trabajo.cantidad}</td>
                                <td className="border-x border-gray-800 px-2 font-bold uppercase">{trabajo.subtipo}</td>
                                <td className="border-x border-gray-800 text-right pr-2">{formatCurrency(unitPrice).replace('$', '')}</td>
                                <td className="border-x border-gray-800 text-right pr-2 font-black">{formatCurrency(trabajo.total).replace('$', '')}</td>
                            </tr>
                            {/* Relleno de filas vacías para estética oficial */}
                            {[...Array(12)].map((_, i) => (
                                <tr key={i} className="h-6"><td className="border-x border-gray-800"></td><td className="border-x border-gray-800"></td><td className="border-x border-gray-800"></td><td className="border-x border-gray-800"></td></tr>
                            ))}
                            {/* TOTALES */}
                            <tr className="border-t border-gray-800">
                                <td colSpan={2} rowSpan={1} className="border border-gray-800 p-0 align-top">
                                     <div className="grid grid-cols-2 h-full text-[7px] font-black uppercase">
                                        <div className="p-1 border-r border-b border-gray-300">Forma de Pago</div>
                                        <div className="p-1 border-b border-gray-300">Valor</div>
                                        <div className="p-1 border-r border-gray-200">Efectivo</div>
                                        <div className="p-1 border-l border-gray-200 text-center">[ x ]</div>
                                        <div className="p-1 border-r border-gray-200">Dinero Electr.</div>
                                        <div className="p-1 border-l border-gray-200 text-center">[ &nbsp; ]</div>
                                        <div className="p-1 border-r border-gray-200">T. Débito/Créd.</div>
                                        <div className="p-1 border-l border-gray-200 text-center">[ &nbsp; ]</div>
                                        <div className="p-1 border-r border-gray-200">Otros</div>
                                        <div className="p-1 border-l border-gray-200 text-center">[ &nbsp; ]</div>
                                     </div>
                                </td>
                                <td className="border border-gray-800 bg-gray-100 font-black text-center text-[9px] h-full uppercase">Valor Total</td>
                                <td className="border border-gray-800 text-right pr-2 font-black text-lg bg-blue-50/30">{formatCurrency(trabajo.total).replace('$', '')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* PIE DE NOTA (IMPRENTA + CADUCIDAD) */}
                <div className="mt-4 grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-7 space-y-1">
                        <div className="border-t border-gray-400 p-2 text-center">
                            <p className="text-[8px] font-black uppercase text-gray-500">Firma Autorizada</p>
                        </div>
                        <div className="p-2 border border-gray-200 rounded-lg text-[7px] text-gray-500 leading-tight">
                            <p><strong>IMPRENTA:</strong> {config.imprentaNombre}</p>
                            <p>RUC: {config.imprentaRuc} | Autorización: {config.imprentaAutorizacion}</p>
                            <p className="mt-1 text-[8px] text-gray-900 font-black">VÁLIDO PARA SU EMISIÓN HASTA: {caducidadFormateada}</p>
                        </div>
                    </div>
                    <div className="col-span-5 text-center">
                         <div className="border-t border-gray-400 p-2">
                            <p className="text-[8px] font-black uppercase text-gray-500">Recibí Conforme (Adquirente)</p>
                        </div>
                        <p className="text-[7px] text-gray-400 font-bold uppercase mt-2 italic">Original: Adquirente / Copia: Emisor</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotaDeVentaPage;
