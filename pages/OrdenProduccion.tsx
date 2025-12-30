
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo } from '../types';
import { 
    PrinterIcon, ArrowLeftIcon, CordovaLogo, 
    Loader2Icon, BoxIcon, ClockIcon, WrenchScrewdriverIcon,
    LayersIcon, ShieldCheckIcon, MapPinIcon, PhoneIcon,
    WhatsAppIcon, ReceiptIcon
} from '../components/Icons';
import { formatDate, formatCurrency } from '../utils';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

const OrdenProduccionPage: React.FC = () => {
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
        <div className="flex h-screen items-center justify-center">
            <Loader2Icon className="animate-spin h-10 w-10 text-brand-blue" />
        </div>
    );

    return (
        <div className="bg-slate-200 min-h-screen py-10 flex flex-col items-center overflow-y-auto">
            <style>{`
                @media print {
                    @page { size: A5 landscape; margin: 0; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #orden-maestra-container { 
                        border: none !important; 
                        box-shadow: none !important; 
                        width: 210mm !important; 
                        height: 148mm !important; 
                        padding: 8mm !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-[210mm] flex justify-between mb-6 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase tracking-widest hover:text-brand-blue transition-colors">
                    <ArrowLeftIcon className="w-4 h-4"/> Regresar
                </button>
                <button onClick={() => window.print()} className="bg-brand-blue text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-slate-950 transition-all">
                    <PrinterIcon className="w-5 h-5"/> Imprimir Orden y Recibo
                </button>
            </div>

            {/* DOCUMENTO HÍBRIDO A5 LANDSCAPE */}
            <div id="orden-maestra-container" className="bg-white shadow-2xl border-t-[12px] border-brand-blue p-10 relative overflow-hidden flex flex-col" style={{ width: '210mm', height: '148mm', fontFamily: 'Arial, sans-serif' }}>
                
                {/* MARCA DE AGUA */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <CordovaLogo className="w-1/2 h-auto grayscale" />
                </div>

                {/* CABECERA: DATOS IMPRENTA + NÚMERO */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-2 bg-brand-blue rounded-2xl shadow-lg">
                            <CordovaLogo className="h-16 w-auto brightness-0 invert" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-brand-blue leading-none tracking-tighter uppercase">IMPRENTA CÓRDOVA</h1>
                            <div className="mt-2 space-y-0.5 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                <p className="flex items-center gap-1"><MapPinIcon className="w-3 h-3 text-brand-red"/> {config.emisorDireccionCompleta}</p>
                                <p className="flex items-center gap-1">
                                    <PhoneIcon className="w-3 h-3 text-brand-red"/> {config.emisorTelefono} • 096 258 5172
                                    <WhatsAppIcon className="w-3 h-3 text-green-500 ml-2"/> Soporte WhatsApp
                                </p>
                                <p className="text-brand-blue font-black">RUC: {config.emisorRuc}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="bg-slate-900 text-white px-6 py-2 rounded-xl inline-block mb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Orden de Trabajo</p>
                            <p className="text-2xl font-mono font-black tracking-tighter">#{String(trabajo.orden).padStart(6, '0')}</p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Emisión: {new Date(trabajo.fechaEntrada).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* CUERPO CENTRAL: CLIENTE Y DETALLES */}
                <div className="grid grid-cols-12 gap-8 mb-6 relative z-10">
                    <div className="col-span-7 space-y-5">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Datos del Adquirente</h3>
                            <p className="text-lg font-black text-slate-900 uppercase leading-none">{cliente.nombre}</p>
                            <div className="flex gap-4 mt-2 text-[10px] font-bold text-slate-600">
                                <span>RUC/CI: {cliente.ruc || cliente.cedula}</span>
                                <span>TEL: {cliente.telefono[0]}</span>
                            </div>
                        </div>

                        <div className="p-5 border-2 border-brand-blue/10 rounded-[2rem] bg-white">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[9px] font-black text-brand-blue uppercase tracking-widest flex items-center gap-2">
                                    <LayersIcon className="w-4 h-4"/> Especificaciones del Pedido
                                </h3>
                                {trabajo.prioridad === 'Urgente' && (
                                    <span className="bg-brand-red text-white text-[8px] font-black px-2 py-0.5 rounded-md animate-pulse">URGENTE</span>
                                )}
                            </div>
                            <p className="text-xl font-black text-slate-800 leading-tight uppercase mb-4">{trabajo.subtipo}</p>
                            <div className="flex gap-10">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Cantidad</p>
                                    <p className="text-xl font-black text-brand-blue">{trabajo.cantidad} <span className="text-[10px] opacity-50">Uds.</span></p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Formato Ref.</p>
                                    <p className="text-xl font-black text-slate-700">{trabajo.tamano || 'Estándar'}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Promesa</p>
                                    <p className="text-lg font-black text-brand-red uppercase">{trabajo.prioridad === 'Urgente' ? 'Hoy mismo' : 'Normal'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BLOQUE FINANCIERO / RECIBO */}
                    <div className="col-span-5">
                        <div className="bg-brand-blue text-white rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><ReceiptIcon className="w-20 h-20" /></div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Liquidación de Pago</h3>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs font-bold opacity-80 uppercase">Inversión Total</span>
                                    <span className="text-lg font-black">{formatCurrency(trabajo.total)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-2 text-emerald-300">
                                    <span className="text-xs font-bold uppercase">Abono Realizado</span>
                                    <span className="text-lg font-black">{formatCurrency(trabajo.abono)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-xs font-black uppercase tracking-widest">Saldo Pendiente</span>
                                    <span className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
                                        {formatCurrency(trabajo.saldo)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="flex gap-3">
                                <ShieldCheckIcon className="w-5 h-5 text-amber-600 shrink-0" />
                                <p className="text-[8px] font-bold text-amber-800 uppercase leading-tight">
                                    Documento indispensable para retiro de material. Pasados 30 días de custodia no se acepta reclamos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PIE DE PÁGINA: FIRMAS Y SELLO */}
                <div className="mt-auto flex justify-between items-end border-t border-slate-100 pt-6 relative z-10">
                    <div className="flex gap-16">
                        <div className="text-center w-40 border-t-2 border-slate-300 pt-2">
                            <p className="text-[9px] font-black text-slate-800 uppercase">Firma Cliente</p>
                            <p className="text-[7px] font-bold text-slate-400 mt-1 uppercase">Acepto Condiciones</p>
                        </div>
                        <div className="text-center w-40 border-t-2 border-slate-300 pt-2">
                            <p className="text-[9px] font-black text-slate-800 uppercase">Sello y Firma</p>
                            <p className="text-[7px] font-bold text-slate-400 mt-1 uppercase">Imprenta Córdova</p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Córdova Vision ERP 2025</p>
                        <p className="text-[8px] font-bold text-slate-400">Original Imprenta / Copia Cliente</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrdenProduccionPage;
