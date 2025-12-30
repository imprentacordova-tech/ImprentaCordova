
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo } from '../types';
import { 
    PrinterIcon, ArrowLeftIcon, CordovaLogo, 
    Loader2Icon, BoxIcon, ClockIcon, 
    LayersIcon, ShieldCheckIcon, MapPinIcon, PhoneIcon,
    WhatsAppIcon, ReceiptIcon, CheckBadgeIcon,
    UsersIcon
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
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <Loader2Icon className="animate-spin h-10 w-10 text-brand-blue" />
        </div>
    );

    // URL para el rastreo QR
    const trackingUrl = `${window.location.origin}/#/tracking?order=${trabajo.orden}`;
    const qrSource = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;

    return (
        <div className="bg-slate-300 min-h-screen py-10 flex flex-col items-center overflow-y-auto">
            <style>{`
                @media print {
                    @page { size: A5 landscape; margin: 0; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #orden-premium-horizontal { 
                        border: none !important; 
                        box-shadow: none !important; 
                        width: 210mm !important; 
                        height: 148mm !important; 
                        padding: 10mm !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-[210mm] flex justify-between mb-6 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase tracking-widest hover:text-brand-blue transition-colors">
                    <ArrowLeftIcon className="w-4 h-4"/> Regresar
                </button>
                <button onClick={() => window.print()} className="bg-brand-blue text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-slate-950 transition-all">
                    <PrinterIcon className="w-5 h-5"/> Imprimir Orden A5
                </button>
            </div>

            {/* DOCUMENTO HÍBRIDO A5 LANDSCAPE MINIMALISTA */}
            <div id="orden-premium-horizontal" className="bg-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-slate-200 relative overflow-hidden flex flex-col" style={{ width: '210mm', height: '148mm', padding: '12mm', fontFamily: 'Inter, Arial, sans-serif' }}>
                
                {/* LÍNEA DE MARCA SUPERIOR */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-blue via-brand-red to-brand-blue opacity-80"></div>

                {/* CABECERA: BRANDING + QR */}
                <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-5">
                        <div className="p-2 bg-slate-950 rounded-2xl">
                            <CordovaLogo className="h-12 w-auto brightness-0 invert" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tighter uppercase">IMPRENTA CÓRDOVA</h1>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1.5 italic">Excelencia Gráfica & Digital</p>
                        </div>
                    </div>

                    <div className="flex gap-6 items-center">
                        <div className="text-right">
                            <span className="text-[9px] font-black text-brand-red uppercase tracking-[0.2em] block mb-1">Orden de Trabajo</span>
                            <span className="text-3xl font-mono font-black text-slate-900 tracking-tighter">#{String(trabajo.orden).padStart(6, '0')}</span>
                        </div>
                        <div className="h-16 w-px bg-slate-100 mx-2"></div>
                        <div className="flex flex-col items-center">
                            <img src={qrSource} alt="QR Tracking" className="w-16 h-16 border p-1 rounded-lg" />
                            <span className="text-[6px] font-black text-slate-400 uppercase mt-1">Rastreo Móvil</span>
                        </div>
                    </div>
                </div>

                {/* CUERPO PRINCIPAL: GRID 3 COLUMNAS */}
                <div className="grid grid-cols-12 gap-10 flex-grow">
                    
                    {/* COL 1: CLIENTE Y TIEMPOS */}
                    <div className="col-span-4 space-y-6 border-r border-slate-50 pr-6">
                        <div>
                            {/* Fixed missing UsersIcon import */}
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <UsersIcon className="w-3.5 h-3.5" /> Adquirente
                            </h3>
                            <p className="text-sm font-black text-slate-900 uppercase leading-tight">{cliente.nombre}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-1">{cliente.ruc || cliente.cedula}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Ingreso</span>
                                <span className="text-[10px] font-bold text-slate-700">{new Date(trabajo.fechaEntrada).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black text-brand-red uppercase">Retiro Est.</span>
                                <span className="text-[10px] font-black text-brand-red uppercase">
                                    {new Date(new Date(trabajo.fechaEntrada).getTime() + 86400000).toLocaleDateString('es-EC', {weekday: 'short', day: '2-digit'})}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* COL 2: DETALLES TÉCNICOS (EL CORAZÓN) */}
                    <div className="col-span-5 space-y-6">
                        <div>
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <LayersIcon className="w-3.5 h-3.5" /> Especificación de Producción
                            </h3>
                            <p className="text-xl font-black text-slate-900 uppercase leading-snug tracking-tight mb-4">
                                {trabajo.subtipo}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-brand-blue/5 p-3 rounded-xl border border-brand-blue/10">
                                    <span className="text-[8px] font-black text-brand-blue uppercase block mb-1">Cantidad</span>
                                    <span className="text-2xl font-black text-brand-blue">{trabajo.cantidad} <small className="text-xs opacity-50">Uds.</small></span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Formato</span>
                                    <span className="text-lg font-black text-slate-700 uppercase">{trabajo.tamano || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        
                        {trabajo.prioridad === 'Urgente' && (
                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100 animate-pulse">
                                <ShieldCheckIcon className="w-5 h-5 text-brand-red" />
                                <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">Atención Prioritaria</span>
                            </div>
                        )}
                    </div>

                    {/* COL 3: FINANZAS Y LIQUIDACIÓN */}
                    <div className="col-span-3 flex flex-col h-full">
                        <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl flex-grow flex flex-col justify-center">
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-4 block">Resumen de Cuenta</span>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-bold opacity-70">
                                    <span>Total</span>
                                    <span>{formatCurrency(trabajo.total)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-emerald-400">
                                    <span>Abono</span>
                                    <span>{formatCurrency(trabajo.abono)}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase">Saldo</span>
                                    <span className="text-2xl font-black tracking-tighter">{formatCurrency(trabajo.saldo)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PIE DE PÁGINA: FIRMAS Y TERMINOS */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-end">
                    <div className="flex gap-12">
                        <div className="text-center w-36">
                            <div className="h-0.5 bg-slate-200 mb-2"></div>
                            <span className="text-[8px] font-black text-slate-400 uppercase">Autorizado</span>
                        </div>
                        <div className="text-center w-36">
                            <div className="h-0.5 bg-slate-200 mb-2"></div>
                            <span className="text-[8px] font-black text-slate-400 uppercase">Recibí Conforme</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-4 text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><MapPinIcon className="w-2 h-2"/> {config.emisorDireccionMatriz}</span>
                            <span className="flex items-center gap-1"><WhatsAppIcon className="w-2 h-2 text-green-500"/> {config.emisorTelefono}</span>
                        </div>
                        <p className="text-[7px] font-black text-slate-200 uppercase tracking-[0.4em]">Córdova Vision Master Edition v2.0</p>
                    </div>
                </div>

                {/* ELEMENTO DECORATIVO DE SELLO */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center opacity-50 rotate-12">
                    <div className="text-center">
                        <CheckBadgeIcon className="w-10 h-10 text-slate-200 mx-auto" />
                        <span className="text-[8px] font-black text-slate-200 uppercase">Calidad Controlada</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrdenProduccionPage;
