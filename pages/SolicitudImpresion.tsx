
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo } from '../types';
// Added CordovaLogo to the icons imports to fix the "Cannot find name 'CordovaLogo'" error
import { PrinterIcon, MapPinIcon, PhoneIcon, ClockIcon, BuildingStorefrontIcon, CalendarDaysIcon, CheckBadgeIcon, CordovaLogo } from '../components/Icons';
import { formatCurrency } from '../utils';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Por confirmar';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(date);
};

const SolicitudImpresionPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [config, setConfig] = useState<NotaDeVentaConfig | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!trabajoId) return;
            setLoading(true);
            const conf = getConfig();
            setConfig(conf);
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

    if (loading || !config || !trabajo || !cliente) return <div className="p-10 text-center font-bold text-brand-blue animate-pulse">Cargando Orden de Producción...</div>;

    // Lógica para determinar si es duplicado o triplicado basado en el nombre del producto
    const copiasInfo = trabajo.subtipo.toLowerCase().includes('copia') ? 'Original y Copia' : 'Original y 1 Copia (Papel Químico)';

    return (
        <div className="bg-slate-100 min-h-screen py-10 flex flex-col items-center font-sans">
            <style>{`
                @media print {
                    @page { size: A5; margin: 0; }
                    body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #solicitud-impresion-content { 
                        box-shadow: none !important; 
                        border: none !important;
                        width: 148mm !important;
                        height: 210mm !important;
                        margin: 0 !important;
                        padding: 8mm !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-[148mm] flex justify-between items-center mb-6 no-print px-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <CheckBadgeIcon className="w-4 h-4 text-green-500" /> Vista previa de Producción
                </p>
                <button onClick={() => window.print()} className="flex items-center gap-2 px-8 py-3 bg-brand-blue text-white font-black rounded-xl shadow-xl hover:bg-blue-800 transition-all transform active:scale-95 text-xs uppercase tracking-widest">
                    <PrinterIcon className="w-4 h-4" /> Imprimir Orden
                </button>
            </div>

            <div id="solicitud-impresion-content" className="bg-white shadow-2xl relative overflow-hidden flex flex-col border border-slate-200" style={{ width: '148mm', minHeight: '210mm', padding: '10mm' }}>
                
                {/* Decoración de borde lateral */}
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-brand-red"></div>

                <div className="relative z-10">
                    {/* Encabezado */}
                    <div className="flex justify-between items-start mb-6 border-b-2 border-slate-100 pb-4">
                        <div className="w-2/3">
                            <div className="flex items-center gap-3 mb-2">
                                <CordovaLogo className="h-10 w-auto" />
                                <div>
                                    <h1 className="text-xl font-black text-brand-blue tracking-tighter leading-none">IMPRENTA CÓRDOVA</h1>
                                    <p className="text-[8px] text-brand-red font-black uppercase tracking-widest">Orden de Producción SRI</p>
                                </div>
                            </div>
                            <div className="text-[8px] text-slate-500 space-y-0.5 font-bold">
                                <p className="flex items-center gap-1"><MapPinIcon className="w-2.5 h-2.5"/> {config.emisorDireccionCompleta}</p>
                                <p className="flex items-center gap-1"><PhoneIcon className="w-2.5 h-2.5"/> {config.emisorTelefono} | RUC: {config.emisorRuc}</p>
                            </div>
                        </div>
                        <div className="w-1/3 flex flex-col items-end">
                            <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-center shadow-lg border border-slate-700">
                                <span className="text-[7px] font-black uppercase tracking-widest block mb-0.5 opacity-60">Nro. Control</span>
                                <span className="font-mono text-lg font-black">{String(trabajo.orden).padStart(6, '0')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tiempos de la Orden */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm"><ClockIcon className="w-4 h-4 text-brand-blue" /></div>
                            <div>
                                <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Fecha/Hora Pedido</p>
                                <p className="text-[10px] font-bold text-blue-900">{formatDateTime(trabajo.fechaEntrada)}</p>
                            </div>
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm"><CalendarDaysIcon className="w-4 h-4 text-green-600" /></div>
                            <div>
                                <p className="text-[7px] font-black text-green-400 uppercase tracking-widest">Fecha/Hora Entrega</p>
                                <p className="text-[10px] font-bold text-blue-900">
                                    {trabajo.fechaEntrega ? formatDateTime(trabajo.fechaEntrega) : formatDateTime(new Date(new Date(trabajo.fechaEntrada).getTime() + 24 * 60 * 60 * 1000).toISOString())}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ficha del Cliente */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-6 relative">
                        <div className="absolute top-4 right-4 bg-brand-blue text-white text-[7px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                            {cliente.regimen}
                        </div>
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-200 pb-1 inline-block">Ficha del Contribuyente</h3>
                        <div className="grid grid-cols-12 gap-y-4 gap-x-6 text-[10px]">
                            <div className="col-span-8">
                                <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Razón Social</p>
                                <p className="font-black text-slate-900 uppercase text-xs leading-tight">{cliente.nombre}</p>
                                {cliente.nombreComercial && (
                                    <p className="text-[8px] text-brand-blue font-bold flex items-center gap-1 mt-1"><BuildingStorefrontIcon className="w-3 h-3"/> {cliente.nombreComercial}</p>
                                )}
                            </div>
                            <div className="col-span-4 text-right">
                                <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">RUC / C.I.</p>
                                <p className="font-mono font-black text-slate-900 text-xs">{cliente.ruc || cliente.cedula}</p>
                            </div>
                            <div className="col-span-12">
                                <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Dirección en Talonario</p>
                                <p className="font-bold text-slate-700 leading-tight bg-white p-2 rounded-lg border border-slate-100 italic">"{cliente.direccion}"</p>
                            </div>
                            <div className="col-span-6">
                                <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Teléfonos autorizados</p>
                                <p className="font-black text-slate-900">{cliente.telefono.join(' - ')}</p>
                            </div>
                            <div className="col-span-6 text-right">
                                <p className="text-[7px] font-bold text-slate-400 uppercase mb-0.5">Establecimiento / Punto</p>
                                <p className="font-mono font-black text-brand-red">{trabajo.establecimiento || '001'} - {trabajo.puntoEmision || '001'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Detalle Técnico de Impresión */}
                    <div className="mb-8">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Detalle de Producción</h3>
                        <table className="w-full text-[10px] border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white uppercase text-[8px] tracking-widest">
                                    <th className="py-2 px-3 text-left rounded-tl-xl">Cantidad/Tipo</th>
                                    <th className="py-2 px-2 text-center">Tamaño</th>
                                    <th className="py-2 px-2 text-center">Numeración</th>
                                    <th className="py-2 px-3 text-right rounded-tr-xl">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 border-x border-b border-slate-100 rounded-b-xl">
                                <tr className="font-bold text-slate-700 bg-white">
                                    <td className="py-4 px-3">
                                        <p className="text-brand-blue uppercase font-black">{trabajo.subtipo}</p>
                                        <p className="text-[8px] text-slate-400 font-medium italic mt-0.5">{copiasInfo}</p>
                                    </td>
                                    <td className="py-4 px-2 text-center">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">{trabajo.tamano === 'Varios' ? '1/4 Oficio' : trabajo.tamano}</span>
                                    </td>
                                    <td className="py-4 px-2 text-center">
                                        <p className="font-mono text-brand-red">0000001</p>
                                        <p className="text-[7px] opacity-40 uppercase">Secuencial</p>
                                    </td>
                                    <td className="py-4 px-3 text-right font-black text-slate-900">{formatCurrency(trabajo.total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Especificaciones de Acabado */}
                    <div className="grid grid-cols-3 gap-4 mb-10">
                        <div className="border border-slate-100 p-3 rounded-xl text-center">
                            <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Papel</p>
                            <p className="text-[9px] font-bold text-slate-800">Químico Autocopiativo</p>
                        </div>
                        <div className="border border-slate-100 p-3 rounded-xl text-center">
                            <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Tintas</p>
                            <p className="text-[9px] font-bold text-slate-800">1 Color (Negro/Azul)</p>
                        </div>
                        <div className="border border-slate-100 p-3 rounded-xl text-center">
                            <p className="text-[7px] font-black text-slate-400 uppercase mb-1">Acabado</p>
                            <p className="text-[9px] font-bold text-slate-800">Engomado / Perforado</p>
                        </div>
                    </div>

                    {/* Firmas de Responsabilidad */}
                    <div className="grid grid-cols-2 gap-12 mt-16">
                        <div className="text-center">
                            <div className="border-t border-slate-300 w-full mb-2"></div>
                            <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest">{cliente.nombre}</p>
                            <p className="text-[7px] text-slate-400 uppercase">Autorización del Cliente</p>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-slate-300 w-full mb-2"></div>
                            <p className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Operador de Turno</p>
                            <p className="text-[7px] text-slate-400 uppercase">Control de Calidad Imprenta</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-50 text-center">
                        <p className="text-[6px] text-slate-300 uppercase tracking-[0.4em]">Imprenta Córdova - Pasaje El Oro - Sistema Maestro de Producción v2.5</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
