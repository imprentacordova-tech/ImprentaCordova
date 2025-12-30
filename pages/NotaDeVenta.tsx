import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente } from '../types';
import { formatCurrency } from '../utils';
// Fixed: Added Loader2Icon to imports to resolve error on line 34
import { PrinterIcon, ArrowLeftIcon, CordovaLogo, ShieldCheckIcon, Loader2Icon } from '../components/Icons';
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

    if (loading || !trabajo || !cliente || !config) return <div className="flex h-screen items-center justify-center"><Loader2Icon className="animate-spin h-10 w-10 text-brand-blue" /></div>;

    const secuencial = String(trabajo.orden).padStart(9, '0');
    const fullNumero = `${config.emisorEstablecimiento}-${config.emisorPuntoEmision}-${secuencial}`;

    return (
        <div className="bg-slate-300 min-h-screen py-12 flex flex-col items-center overflow-y-auto">
            <style>{`
                @media print {
                    @page { size: A5; margin: 0; }
                    body { margin: 0; background: white; }
                    .no-print { display: none !important; }
                    #nota-maestra { border: none !important; box-shadow: none !important; width: 148mm !important; height: 210mm !important; padding: 10mm !important; }
                }
            `}</style>

            <div className="w-full max-w-[148mm] flex justify-between mb-8 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-widest"><ArrowLeftIcon className="w-4 h-4"/> Cerrar</button>
                <button onClick={() => window.print()} className="bg-brand-blue text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-slate-950 transition-all">
                    <PrinterIcon className="w-5 h-5"/> Imprimir Nota Maestra
                </button>
            </div>

            {/* DISEÑO MAESTRO A5 */}
            <div id="nota-maestra" className="bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative flex flex-col box-border border border-slate-400 overflow-hidden" style={{ width: '148mm', height: '210mm', padding: '12mm', fontFamily: 'Arial, sans-serif' }}>
                
                {/* WATERMARK LOGO */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <CordovaLogo className="w-4/5 h-auto grayscale" />
                </div>

                {/* CABECERA (DATOS DE PLANTA) */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="w-7/12">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2 bg-brand-blue rounded-xl">
                                <CordovaLogo className="h-14 w-auto brightness-0 invert" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-brand-blue leading-none tracking-tighter">IMPRENTA<br/>"CORDOVA"</h1>
                                <p className="text-[7px] font-bold text-slate-500 uppercase mt-1 italic leading-tight">"El mejor servicio, al menor tiempo"</p>
                            </div>
                        </div>
                        <div className="space-y-0.5 text-[8px] font-bold text-slate-700 uppercase">
                            <p className="text-brand-red font-black text-[9px] mb-1">Pedro Manuel Córdova Rodríguez</p>
                            <p>ACTIVIDADES DE HOJAS IMPRESAS PARA CONFECCIONAR LIBROS, FOLLETOS, ETC.</p>
                            <div className="pt-2 border-t mt-2">
                                <p><b>DIR:</b> COLÓN E/ SUCRE Y AV. ROCAFUERTE</p>
                                <p><b>CEL:</b> 099 308 3943 | PASAJE - EL ORO</p>
                                <p><b>EMAIL:</b> imprentacordova@gmail.com</p>
                                <p className="text-brand-blue font-black mt-1">"CONTRIBUYENTE NEGOCIO POPULAR RÉGIMEN RIMPE"</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-5/12">
                        <div className="border-[3px] border-brand-blue rounded-3xl p-4 text-center bg-blue-50/20 backdrop-blur-sm shadow-inner">
                            <p className="text-xs font-black text-brand-blue mb-1">R.U.C. 0702065319001</p>
                            <div className="bg-brand-blue text-white text-[11px] font-black py-2 my-2 rounded-xl tracking-[0.2em] shadow-lg">NOTA DE VENTA</div>
                            <p className="text-[8px] font-bold text-slate-400 mb-1">SERIE: 001-001</p>
                            <p className="text-xl font-mono font-black text-brand-red tracking-tight">{secuencial}</p>
                            <div className="mt-3 pt-3 border-t border-blue-100 text-[8px] text-left space-y-1">
                                <p><b>AUT. SRI:</b> {config.autorizacionSRI}</p>
                                <p><b>FECHA AUT:</b> {new Date(config.fechaAutorizacion).toLocaleDateString('es-EC')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DATOS CLIENTE */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 relative z-10 grid grid-cols-12 gap-y-2 text-[10px] font-bold text-slate-800">
                    <div className="col-span-12 flex items-baseline gap-2 border-b border-white pb-2 mb-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Sr(s):</span>
                        <span className="text-sm font-black uppercase text-brand-blue">{cliente.nombre}</span>
                    </div>
                    <div className="col-span-8 flex items-baseline gap-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase">RUC/CI:</span>
                        <span className="font-mono">{cliente.ruc || cliente.cedula}</span>
                    </div>
                    <div className="col-span-4 text-right flex items-baseline justify-end gap-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Fecha:</span>
                        <span>{new Date().toLocaleDateString('es-EC')}</span>
                    </div>
                    <div className="col-span-12 flex items-baseline gap-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Dirección:</span>
                        <span className="uppercase truncate">{cliente.direccion || 'Pasaje'}</span>
                    </div>
                </div>

                {/* TABLA PRINCIPAL */}
                <div className="flex-grow relative z-10">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-brand-blue text-white text-[9px] font-black uppercase tracking-widest">
                                <th className="p-3 text-center rounded-tl-xl w-[15%]">Cant.</th>
                                <th className="p-3 text-left w-[55%]">Descripción</th>
                                <th className="p-3 text-center w-[15%]">P. Unit.</th>
                                <th className="p-3 text-center rounded-tr-xl w-[15%]">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-[10px] font-bold">
                            <tr className="border-b border-slate-100">
                                <td className="p-4 text-center text-lg font-black text-slate-400">{trabajo.cantidad}</td>
                                <td className="p-4 uppercase text-brand-blue">{trabajo.subtipo}</td>
                                <td className="p-4 text-center">{formatCurrency(trabajo.total / trabajo.cantidad)}</td>
                                <td className="p-4 text-center font-black">{formatCurrency(trabajo.total)}</td>
                            </tr>
                            {/* Relleno estético */}
                            {[...Array(6)].map((_, i) => (
                                <tr key={i} className="h-10 border-b border-slate-50 opacity-20"><td></td><td></td><td></td><td></td></tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2} className="p-4">
                                     <div className="p-3 bg-slate-100 rounded-xl flex items-center gap-3">
                                        <ShieldCheckIcon className="w-5 h-5 text-emerald-500" />
                                        <p className="text-[7px] font-bold text-slate-500 leading-tight">DOCUMENTO VÁLIDO PARA RETIRO DE MATERIAL. GRACIAS POR CONFIAR EN LA CALIDAD DE IMPRENTA CÓRDOVA.</p>
                                     </div>
                                </td>
                                <td className="p-4 text-center font-black text-[9px] uppercase bg-slate-900 text-white rounded-bl-xl">Total a Cobrar</td>
                                <td className="p-4 text-center font-black text-2xl tracking-tighter bg-brand-red text-white rounded-br-xl shadow-xl">{formatCurrency(trabajo.total)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* PIE DE PÁGINA */}
                <div className="mt-8 grid grid-cols-2 gap-12 relative z-10">
                    <div className="text-center pt-4 border-t-2 border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Firma del Adquirente</p>
                        <p className="text-[7px] font-bold text-slate-300 mt-1 uppercase italic">Recibí Conforme</p>
                    </div>
                    <div className="text-center pt-4 border-t-2 border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Válido hasta:</p>
                        <p className="text-xs font-black text-brand-blue uppercase">{new Date(config.fechaCaducidad).toLocaleDateString('es-EC', { month: 'long', year: 'numeric', day: 'numeric' })}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotaDeVentaPage;