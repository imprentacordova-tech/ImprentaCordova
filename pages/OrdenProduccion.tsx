
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Cliente, Trabajo } from '../types';
import { 
    PrinterIcon, ArrowLeftIcon, CordovaLogo, 
    Loader2Icon, BoxIcon, ClockIcon, 
    LayersIcon, ShieldCheckIcon, MapPinIcon, PhoneIcon,
    WhatsAppIcon, ReceiptIcon, CheckBadgeIcon,
    UsersIcon, CalendarDaysIcon, SparklesIcon
} from '../components/Icons';
import { formatDate, formatCurrency } from '../utils';

const OrdenProduccionPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const { trabajos, clientes, config: cloudConfig, loading: dataLoading } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);

    useEffect(() => {
        if (!trabajoId || dataLoading) return;
        const current = trabajos.find(t => t.id === trabajoId);
        if (current) {
            setTrabajo(current);
            setCliente(clientes.find(c => c.id === current.clienteId) || null);
        }
    }, [trabajoId, trabajos, clientes, dataLoading]);

    const config = cloudConfig ? {
        emisorDireccionMatriz: 'Colón y Sucre, Pasaje, El Oro',
    } : { emisorDireccionMatriz: 'Colón y Sucre, Pasaje' };

    if (dataLoading || !trabajo || !cliente) return (
        <div className="flex h-screen items-center justify-center bg-brand-dark">
            <Loader2Icon className="animate-spin h-10 w-10 text-brand-blue" />
        </div>
    );

    // QR para seguimiento web
    const trackingUrl = `${window.location.origin}/#/tracking?q=${trabajo.id}`;
    const qrSource = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;

    const dtRetiro = new Date(trabajo.fechaEntrada);
    const hoursToAdd = trabajo.tiempoEntregaEstimado === '24h' ? 24 : 48;
    dtRetiro.setHours(dtRetiro.getHours() + hoursToAdd);
    
    const diaSemana = dtRetiro.toLocaleDateString('es-EC', { weekday: 'long' });
    const diaMes = dtRetiro.getDate();
    const fechaRetiroFormateada = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaMes} (Tarde)`;

    return (
        <div className="bg-[#F7F9FF] min-h-screen py-8 flex flex-col items-center overflow-y-auto">
            <style>{`
                @media print {
                    @page { size: A5 landscape; margin: 0; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #orden-maestra-taller { 
                        border: none !important; 
                        box-shadow: none !important; 
                        width: 210mm !important; 
                        height: 148mm !important; 
                        padding: 8mm !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 no-print px-6 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 font-bold text-xs hover:text-blue-700 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4"/> Volver
                </button>
                <button onClick={() => window.print()} className="bg-[#16309B] text-white hover:bg-[#0F2280] px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all">
                    <PrinterIcon className="w-4 h-4"/> Imprimir Ficha de Taller
                </button>
            </div>

            {/* DISEÑO MAESTRO A5 HORIZONTAL */}
            <div id="orden-maestra-taller" className="bg-white shadow-2xl relative flex flex-col box-border border-l-[12px] border-brand-blue overflow-hidden" style={{ width: '210mm', height: '148mm', padding: '10mm', fontFamily: 'Arial, sans-serif' }}>
                
                {/* CABECERA TÉCNICA */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-blue p-2 rounded-xl">
                            <CordovaLogo className="h-12 w-auto brightness-0 invert" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-brand-blue leading-none tracking-tighter">ORDEN DE TALLER</h1>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Imprenta Córdova • Control Interno</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <span className="text-[10px] font-black text-brand-red uppercase tracking-widest block mb-1">Nro. Control</span>
                            <span className="text-4xl font-mono font-black text-slate-900 tracking-tighter">#{String(trabajo.orden).padStart(6, '0')}</span>
                        </div>
                    </div>
                </div>

                {/* GRID PRINCIPAL */}
                <div className="grid grid-cols-12 gap-8 flex-grow">
                    
                    {/* COLUMNA IZQUIERDA: CLIENTE Y FINANZAS */}
                    <div className="col-span-4 space-y-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-5"><UsersIcon className="w-12 h-12" /></div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cliente / Contribuyente</span>
                            <p className="text-sm font-black text-slate-900 uppercase leading-tight">{cliente.nombre}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-1">{cliente.ruc || cliente.cedula}</p>
                        </div>

                        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[9px] font-bold opacity-60 uppercase"><span>Total Orden</span> <span>{formatCurrency(trabajo.total)}</span></div>
                                <div className="flex justify-between text-[9px] font-bold text-emerald-400 uppercase"><span>Abono Caja</span> <span>{formatCurrency(trabajo.abono)}</span></div>
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">Saldo Pend.</span>
                                    <span className="text-3xl font-black text-brand-red tracking-tighter">{formatCurrency(trabajo.saldo)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA CENTRAL: ESPECIFICACIONES */}
                    <div className="col-span-5 space-y-4">
                        <div className="p-1 border-2 border-slate-100 rounded-2xl h-full flex flex-col">
                            <div className="bg-slate-50 p-2 rounded-t-xl text-[9px] font-black uppercase text-slate-400 text-center tracking-widest border-b">
                                Detalles de Fabricación
                            </div>
                            <div className="p-4 flex-grow space-y-4 flex flex-col">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase leading-none tracking-tighter">
                                        {trabajo.tipo || 'General'}
                                    </h2>
                                    <p className="text-sm font-bold text-slate-500 uppercase mt-1">
                                        {trabajo.subtipo}
                                    </p>
                                </div>

                                {trabajo.detalle && (
                                    <div className="flex-grow bg-slate-50 p-3 rounded-xl border border-slate-200">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Instrucciones / Detalles</span>
                                        <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-tight">{trabajo.detalle}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                                        <span className="text-[8px] font-black text-blue-400 uppercase block mb-1">Cantidad</span>
                                        <span className="text-2xl font-black text-brand-blue">{trabajo.cantidad}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col justify-center">
                                        <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Prioridad</span>
                                        <span className={`text-sm font-black uppercase ${trabajo.prioridad === 'Urgente' ? 'text-brand-red' : 'text-slate-900'}`}>{trabajo.prioridad || 'NORMAL'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: QR Y RETIRO */}
                    <div className="col-span-3 flex flex-col justify-between">
                         <div className="flex flex-col items-center p-4 bg-white border-2 border-slate-100 rounded-[2rem] shadow-sm">
                            <img src={qrSource} alt="QR Seguimiento" className="w-24 h-24 mb-2" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rastreo Producción</span>
                         </div>

                         {/* BLOQUE MARCO ROJO: COMPROMISO DE ENTREGA */}
                         <div className="border-[4px] border-brand-red rounded-[2rem] p-4 text-center bg-white shadow-lg animate-pulse-slow">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Listo Para Retiro</span>
                            <p className="text-xl font-black text-brand-red leading-none uppercase">{fechaRetiroFormateada}</p>
                            <div className="mt-2 bg-brand-red text-white text-[7px] font-black py-1 px-2 rounded-full uppercase tracking-widest inline-block">
                                Compromiso Córdova
                            </div>
                         </div>
                    </div>
                </div>

                {/* PIE DE ORDEN */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div className="flex gap-10">
                        <div className="text-center">
                            <div className="w-32 h-px bg-slate-300 mb-2"></div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recepción de Orden</span>
                        </div>
                        <div className="text-center">
                            <div className="w-32 h-px bg-slate-300 mb-2"></div>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Responsable Taller</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 opacity-40">
                         <div className="flex items-center gap-3 text-[8px] font-bold text-slate-500 uppercase">
                            <MapPinIcon className="w-2.5 h-2.5 text-brand-red"/> {config.emisorDireccionMatriz}
                         </div>
                         <p className="text-[8px] font-black text-brand-blue uppercase tracking-[0.4em]">Córdova Vision v2.0 • 2025</p>
                    </div>
                </div>

                {/* DECORATIVO INTERNO */}
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-brand-blue/5 rounded-full blur-xl"></div>
            </div>
        </div>
    );
};

export default OrdenProduccionPage;
