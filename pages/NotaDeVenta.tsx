
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente } from '../types';
import { formatCurrency, numeroALetras } from '../utils';
import { 
    PrinterIcon, ArrowLeftIcon, CordovaLogo, 
    MapPinIcon, WhatsAppIcon, CheckBadgeIcon, 
    EnvelopeIcon, PhoneIcon
} from '../components/Icons';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

const NotaDeVentaPage: React.FC = () => {
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
            const [tData, cData] = await Promise.all([getTrabajos(), getClientes()]);
            const current = tData.find(t => t.id === trabajoId);
            if (current) {
                setTrabajo(current);
                setCliente(cData.find(c => c.id === current.clienteId) || null);
            }
            setLoading(false);
        };
        fetchData();
    }, [trabajoId]);

    if (loading || !trabajo || !cliente || !config) return null;

    const secuencial = String(trabajo.orden).padStart(9, '0');
    const fechaEmision = new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
    const totalEnLetras = numeroALetras(trabajo.total);

    return (
        <div className="bg-slate-800 min-h-screen py-8 flex flex-col items-center justify-start overflow-y-auto font-sans">
            <style>{`
                @media print {
                    @page { size: A5; margin: 0; }
                    body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #nota-venta-canvas { 
                        box-shadow: none !important; 
                        margin: 0 !important;
                        border-radius: 0 !important;
                        width: 148mm !important; 
                        height: 210mm !important; 
                        padding: 8mm !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-[148mm] flex justify-between mb-6 no-print px-4 md:px-0">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/70 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors">
                    <ArrowLeftIcon className="w-4 h-4"/> Volver
                </button>
                <button onClick={() => window.print()} className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2">
                    <PrinterIcon className="w-4 h-4"/> Imprimir
                </button>
            </div>

            {/* DOCUMENTO A5 */}
            <div id="nota-venta-canvas" className="bg-white relative flex flex-col box-border overflow-hidden shadow-2xl" 
                style={{ width: '148mm', height: '210mm', padding: '10mm', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                
                {/* FONDO / MARCA DE AGUA */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                    <CordovaLogo className="w-64 h-64 grayscale" />
                </div>

                {/* CABECERA */}
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <CordovaLogo className="h-8 w-auto" />
                            <div>
                                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Imprenta Córdova</h1>
                                <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">Excelencia Gráfica</p>
                            </div>
                        </div>
                        <div className="text-[7px] text-slate-500 space-y-0.5 mt-1 font-medium">
                            <p className="flex items-center gap-1"><MapPinIcon className="w-2 h-2"/> {config.emisorDireccionMatriz}</p>
                            <p className="flex items-center gap-1"><PhoneIcon className="w-2 h-2"/> {config.emisorTelefono}</p>
                            <p className="flex items-center gap-1"><EnvelopeIcon className="w-2 h-2"/> {config.emisorEmail}</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                            <p className="text-[8px] font-bold text-slate-500 uppercase">R.U.C. {config.emisorRuc}</p>
                            <h2 className="text-sm font-black text-brand-red uppercase my-0.5">Nota de Venta</h2>
                            <p className="text-[10px] font-mono text-slate-900 font-bold">N° {config.emisorEstablecimiento}-{config.emisorPuntoEmision}-{secuencial}</p>
                        </div>
                        <p className="text-[6px] text-slate-400 mt-1 uppercase font-bold tracking-wider">
                            AUT. SRI: {config.autorizacionSRI}
                        </p>
                        <p className="text-[6px] text-slate-400 uppercase font-bold tracking-wider">
                            {config.emisorTipoContribuyente}
                        </p>
                    </div>
                </div>

                {/* DATOS DEL CLIENTE */}
                <div className="bg-slate-50/50 rounded-lg p-3 mb-6 border border-slate-100 text-[9px]">
                    <div className="grid grid-cols-12 gap-y-2">
                        <div className="col-span-8">
                            <span className="text-slate-400 font-bold uppercase block text-[7px] tracking-wider">Cliente</span>
                            <span className="text-slate-900 font-bold uppercase text-xs block truncate pr-2">{cliente.nombre}</span>
                        </div>
                        <div className="col-span-4 text-right">
                            <span className="text-slate-400 font-bold uppercase block text-[7px] tracking-wider">RUC / CI</span>
                            <span className="text-slate-900 font-mono font-bold block">{cliente.ruc || cliente.cedula}</span>
                        </div>
                        <div className="col-span-8">
                            <span className="text-slate-400 font-bold uppercase block text-[7px] tracking-wider">Dirección</span>
                            <span className="text-slate-700 font-medium uppercase block truncate pr-2">{cliente.direccion || 'Ciudad'}</span>
                        </div>
                        <div className="col-span-4 text-right">
                            <span className="text-slate-400 font-bold uppercase block text-[7px] tracking-wider">Fecha Emisión</span>
                            <span className="text-slate-700 font-medium block">{fechaEmision}</span>
                        </div>
                    </div>
                </div>

                {/* TABLA DE DETALLES */}
                <div className="flex-grow">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-900">
                                <th className="py-1 text-[8px] font-black text-slate-900 uppercase w-[10%] text-center">Cant.</th>
                                <th className="py-1 text-[8px] font-black text-slate-900 uppercase w-[60%]">Descripción</th>
                                <th className="py-1 text-[8px] font-black text-slate-900 uppercase w-[15%] text-right">P. Unit</th>
                                <th className="py-1 text-[8px] font-black text-slate-900 uppercase w-[15%] text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-[9px] text-slate-700">
                            <tr className="border-b border-slate-100">
                                <td className="py-3 text-center font-bold">{trabajo.cantidad}</td>
                                <td className="py-3 uppercase font-medium leading-tight pr-2">
                                    {trabajo.subtipo}
                                </td>
                                <td className="py-3 text-right tabular-nums">{formatCurrency(trabajo.total / trabajo.cantidad)}</td>
                                <td className="py-3 text-right font-bold tabular-nums text-slate-900">{formatCurrency(trabajo.total)}</td>
                            </tr>
                            {/* Líneas vacías para llenar espacio */}
                            {[...Array(6)].map((_, i) => (
                                <tr key={i} className="border-b border-slate-50">
                                    <td className="py-3">&nbsp;</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PIE DE PÁGINA Y TOTALES */}
                <div className="mt-4">
                    <div className="flex justify-between items-end mb-6">
                        <div className="w-[60%] pr-4">
                            <div className="border-t border-slate-300 pt-1 mb-1">
                                <p className="text-[8px] text-slate-500 uppercase font-bold">Son:</p>
                                <p className="text-[9px] text-slate-900 font-medium italic leading-tight">{totalEnLetras}</p>
                            </div>
                            <div className="mt-4 flex gap-2 items-center text-[7px] text-slate-400 uppercase font-bold bg-slate-50 p-2 rounded">
                                <CheckBadgeIcon className="w-3 h-3 text-emerald-500"/>
                                <span>Garantía de Calidad Córdova</span>
                            </div>
                        </div>
                        
                        <div className="w-[40%] bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 mb-1">
                                <span>SUBTOTAL</span>
                                <span>{formatCurrency(trabajo.total)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 mb-2 border-b border-slate-200 pb-1">
                                <span>DESCUENTO</span>
                                <span>$0.00</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-black text-slate-900">
                                <span>TOTAL</span>
                                <span>{formatCurrency(trabajo.total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* FIRMAS */}
                    <div className="grid grid-cols-2 gap-8 mt-4">
                        <div className="text-center">
                            <div className="border-t border-slate-300 w-3/4 mx-auto mb-1"></div>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Firma Autorizada</p>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-slate-300 w-3/4 mx-auto mb-1"></div>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Recibí Conforme</p>
                        </div>
                    </div>

                    <div className="mt-4 text-center border-t border-slate-100 pt-2">
                        <p className="text-[6px] text-slate-400 uppercase tracking-[0.2em] font-bold">
                            Documento válido para su emisión hasta {config.fechaCaducidad} • Original: Adquirente / Copia: Emisor
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotaDeVentaPage;
