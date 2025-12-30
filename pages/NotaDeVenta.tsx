
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente } from '../types';
import { formatCurrency } from '../utils';
import { 
    PrinterIcon, ArrowLeftIcon, CordovaLogo, 
    ShieldCheckIcon, Loader2Icon, MapPinIcon, 
    PhoneIcon, WhatsAppIcon, ReceiptIcon, CheckBadgeIcon
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

    if (loading || !trabajo || !cliente || !config) return (
        <div className="flex h-screen items-center justify-center bg-slate-100">
            <Loader2Icon className="animate-spin h-10 w-10 text-brand-blue" />
        </div>
    );

    const secuencial = String(trabajo.orden).padStart(9, '0');

    return (
        <div className="bg-slate-400 min-h-screen py-10 flex flex-col items-center overflow-y-auto">
            <style>{`
                @media print {
                    @page { size: A5; margin: 0; }
                    body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #nota-maestra-premium { 
                        border: none !important; 
                        box-shadow: none !important; 
                        width: 148mm !important; 
                        height: 210mm !important; 
                        padding: 10mm !important; 
                    }
                }
            `}</style>

            <div className="w-full max-w-[148mm] flex justify-between mb-6 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white font-black text-xs uppercase tracking-widest hover:text-slate-200">
                    <ArrowLeftIcon className="w-4 h-4"/> Volver
                </button>
                <button onClick={() => window.print()} className="bg-white text-brand-blue px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-slate-50 transition-all">
                    <PrinterIcon className="w-5 h-5"/> Imprimir Nota Premium
                </button>
            </div>

            {/* DISEÑO MAESTRO A5 VERTICAL */}
            <div id="nota-maestra-premium" className="bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative flex flex-col box-border border-t-[10px] border-brand-red overflow-hidden" style={{ width: '148mm', height: '210mm', padding: '12mm', fontFamily: 'Arial, sans-serif' }}>
                
                {/* MARCA DE AGUA DE EXCELENCIA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none">
                    <CordovaLogo className="w-3/4 h-auto grayscale" />
                </div>

                {/* CABECERA PROFESIONAL */}
                <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-1.5 bg-brand-blue rounded-lg shadow-lg">
                                <CordovaLogo className="h-10 w-auto brightness-0 invert" />
                            </div>
                            <div className="leading-none">
                                <h1 className="text-xl font-black text-brand-blue tracking-tighter uppercase">IMPRENTA CÓRDOVA</h1>
                                <p className="text-[7px] font-bold text-slate-400 tracking-[0.2em] mt-0.5">PASAJÉ - EL ORO - ECUADOR</p>
                            </div>
                        </div>
                        <div className="text-[8px] font-bold text-slate-700 space-y-0.5 uppercase">
                            <p className="text-brand-red font-black text-[9px] mb-1">{config.emisorRazonSocial}</p>
                            <p className="flex items-center gap-1"><MapPinIcon className="w-2.5 h-2.5"/> {config.emisorDireccionMatriz}</p>
                            <p className="flex items-center gap-1"><WhatsAppIcon className="w-2.5 h-2.5 text-green-500"/> {config.emisorTelefono} | {config.emisorEmail}</p>
                            <p className="mt-2 pt-1 border-t border-slate-100 text-brand-blue font-black">{config.emisorTipoContribuyente}</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="border-2 border-slate-900 rounded-2xl p-4 bg-slate-50 shadow-inner">
                            <p className="text-[10px] font-black text-slate-900 mb-1">R.U.C. {config.emisorRuc}</p>
                            <div className="bg-slate-900 text-white text-[10px] font-black py-1.5 px-4 mb-2 rounded-lg tracking-widest">NOTA DE VENTA</div>
                            <p className="text-[8px] font-bold text-slate-400 mb-1">SERIE: {config.emisorEstablecimiento}-{config.emisorPuntoEmision}</p>
                            <p className="text-2xl font-mono font-black text-brand-red tracking-tighter leading-none">{secuencial}</p>
                        </div>
                        <p className="text-[7px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Aut. SRI: {config.autorizacionSRI}</p>
                    </div>
                </div>

                {/* BLOQUE CLIENTE ELEGANTE */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 relative z-10 grid grid-cols-12 gap-y-3 text-[10px] font-bold text-slate-900">
                    <div className="col-span-12 flex items-center gap-4 border-b border-white pb-3">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Señor(es):</span>
                        <span className="text-sm font-black uppercase text-brand-blue flex-grow">{cliente.nombre}</span>
                    </div>
                    <div className="col-span-7 flex items-center gap-3">
                        <span className="text-[8px] font-black text-slate-400 uppercase">RUC/C.I.:</span>
                        <span className="font-mono text-xs">{cliente.ruc || cliente.cedula}</span>
                    </div>
                    <div className="col-span-5 flex items-center justify-end gap-3">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Fecha Emisión:</span>
                        <span>{new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="col-span-12 flex items-center gap-3">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Dirección:</span>
                        <span className="uppercase">{cliente.direccion || 'Pasaje'}</span>
                    </div>
                </div>

                {/* TABLA DE PRODUCTOS (ORDENADA) */}
                <div className="flex-grow relative z-10">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em]">
                                <th className="p-3 text-center rounded-tl-xl w-[12%]">Cant.</th>
                                <th className="p-3 text-left w-[58%]">Descripción Detallada</th>
                                <th className="p-3 text-center w-[15%]">P. Unit</th>
                                <th className="p-3 text-center rounded-tr-xl w-[15%]">V. Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-[10px] font-bold text-slate-700">
                            <tr className="border-b border-slate-100">
                                <td className="p-5 text-center text-lg font-black text-slate-300">{trabajo.cantidad}</td>
                                <td className="p-5 uppercase text-slate-900 font-black leading-snug">{trabajo.subtipo}</td>
                                <td className="p-5 text-center">{formatCurrency(trabajo.total / trabajo.cantidad)}</td>
                                <td className="p-5 text-center font-black text-slate-900">{formatCurrency(trabajo.total)}</td>
                            </tr>
                            {/* Relleno para mantener estética */}
                            {[...Array(5)].map((_, i) => (
                                <tr key={i} className="h-10 border-b border-slate-50 opacity-20"><td></td><td></td><td></td><td></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PIE DE NOTA: LIQUIDACIÓN FINAL */}
                <div className="mt-8 relative z-10">
                    <div className="grid grid-cols-12 items-end">
                        <div className="col-span-7 pr-8">
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 mb-4">
                                <CheckBadgeIcon className="w-8 h-8 text-brand-blue" />
                                <div className="text-[8px] font-bold text-brand-blue leading-tight uppercase">
                                    Documento entregado conforme. <br/>
                                    Garantía de calidad Córdova activa. <br/>
                                    Gracias por su confianza.
                                </div>
                            </div>
                            <div className="flex gap-10 mt-10">
                                <div className="flex-1 text-center pt-2 border-t-2 border-slate-200">
                                    <p className="text-[9px] font-black text-slate-900 uppercase">Firma Autorizada</p>
                                    <p className="text-[7px] text-slate-400 uppercase">Córdova Vision</p>
                                </div>
                                <div className="flex-1 text-center pt-2 border-t-2 border-slate-200">
                                    <p className="text-[9px] font-black text-slate-900 uppercase">Recibí Conforme</p>
                                    <p className="text-[7px] text-slate-400 uppercase">Firma Cliente</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-5">
                            <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl">
                                <div className="space-y-2 border-b border-white/10 pb-3 mb-3">
                                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Total Venta</span>
                                        <span>{formatCurrency(trabajo.total)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                        <span>Abonos Previos</span>
                                        <span>{formatCurrency(trabajo.total - trabajo.saldo)}</span>
                                    </div>
                                    {trabajo.saldo > 0 && (
                                        <div className="flex justify-between items-center text-[9px] font-black text-brand-red uppercase tracking-widest">
                                            <span>Cobro en Entrega</span>
                                            <span>{formatCurrency(trabajo.saldo)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">VALOR TOTAL</span>
                                    <span className="text-2xl font-black text-white tracking-tighter">{formatCurrency(trabajo.total)}</span>
                                </div>
                                <div className="mt-3 text-center bg-white/10 py-1 rounded-lg">
                                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.3em]">CANCÉLADO / ENTREGADO</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-between items-center opacity-40">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">EXCELENCIA EN CADA IMPRESIÓN • CÓRDOVA Vision 2025</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase">Original: Emisor / Copia: Adquirente</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotaDeVentaPage;
