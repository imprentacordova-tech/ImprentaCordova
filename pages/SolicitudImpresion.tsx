
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo, Regimen, TrabajoTipo } from '../types';
import { PrinterIcon, MapPinIcon, PhoneIcon, ClockIcon, BuildingStorefrontIcon, CalendarDaysIcon, CheckBadgeIcon, CordovaLogo, ArrowDownTrayIcon, ArrowLeftIcon, ShieldCheckIcon, DocumentTextIcon, ExclamationTriangleIcon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

declare const html2pdf: any;

const SolicitudImpresionPage: React.FC = () => {
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

    const handleDownloadPdf = () => {
        const element = document.getElementById('solicitud-sri-layout');
        if (!element || !trabajo) return;
        html2pdf().from(element).set({ margin: 0, filename: `SRI-SOLICITUD-${trabajo.orden}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' } }).save();
    };

    if (loading || !config || !trabajo || !cliente) return <div className="p-20 text-center animate-pulse uppercase tracking-widest font-black text-brand-blue">Sincronizando con SRI...</div>;

    const inicial = "0000001";
    const final = String(trabajo.cantidad).padStart(7, '0');

    return (
        <div className="bg-slate-100 min-h-screen py-12 flex flex-col items-center">
            <div className="w-full max-w-[148mm] flex justify-between mb-8 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-brand-blue"><ArrowLeftIcon className="w-4 h-4" /> Volver</button>
                <div className="flex gap-3">
                    <button onClick={handleDownloadPdf} className="bg-white border px-5 py-2 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-50">PDF</button>
                    <button onClick={() => window.print()} className="bg-brand-blue text-white px-8 py-2 rounded-xl font-black text-xs shadow-xl flex items-center gap-2"><PrinterIcon className="w-4 h-4"/> IMPRIMIR SOLICITUD</button>
                </div>
            </div>

            {/* Documento A5 que replica la captura del SRI del usuario */}
            <div id="solicitud-sri-layout" className="bg-white shadow-2xl border border-slate-300" style={{ width: '148mm', height: '210mm', padding: '10mm' }}>
                <div className="bg-brand-navy p-3 text-center mb-6">
                    <h2 className="text-white text-xs font-black uppercase tracking-widest">Confirmación de la Solicitud de Impresión</h2>
                </div>

                <div className="space-y-4 px-2">
                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <span className="font-black text-slate-500 uppercase">RUC:</span>
                        <span className="col-span-2 font-mono font-bold">{cliente.ruc || cliente.cedula}</span>
                        
                        <span className="font-black text-slate-500 uppercase">Razón Social:</span>
                        <span className="col-span-2 font-bold uppercase">{cliente.nombre}</span>

                        <span className="font-black text-slate-500 uppercase">Establecimiento:</span>
                        <span className="col-span-2 font-mono">{trabajo.establecimiento || '001'}</span>

                        <span className="font-black text-slate-500 uppercase">Nombre Comercial:</span>
                        <span className="col-span-2 italic">{cliente.nombreComercial || '-'}</span>

                        <span className="font-black text-slate-500 uppercase">Fecha Caducidad:</span>
                        <span className="col-span-2 font-bold">{config.fechaCaducidad}</span>
                    </div>

                    <div className="pt-6">
                        <p className="text-[9px] text-slate-600 mb-4 leading-tight italic">
                            Las secuencias solicitadas son las siguientes, si la información es correcta presione "Siguiente" para continuar...
                        </p>

                        <table className="w-full border-collapse border border-slate-300 text-[10px]">
                            <thead className="bg-brand-navy text-white text-[8px] uppercase tracking-wider">
                                <tr>
                                    <th className="border border-slate-300 p-2">Serie</th>
                                    <th className="border border-slate-300 p-2">Tipo de Documento</th>
                                    <th className="border border-slate-300 p-2">Inicial</th>
                                    <th className="border border-slate-300 p-2">#Final</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="text-center font-bold">
                                    <td className="border border-slate-300 p-3">{trabajo.establecimiento || '001'}-{trabajo.puntoEmision || '001'}</td>
                                    <td className="border border-slate-300 p-3 uppercase text-brand-blue">{trabajo.subtipo.includes(',') ? 'VARIOS' : trabajo.subtipo}</td>
                                    <td className="border border-slate-300 p-3 font-mono">{inicial}</td>
                                    <td className="border border-slate-300 p-3 font-mono">{final}</td>
                                </tr>
                                {/* Filas de relleno para diseño */}
                                {[...Array(3)].map((_, i) => (
                                    <tr key={i} className="bg-slate-50">
                                        <td className="border border-slate-300 p-3 h-10"></td>
                                        <td className="border border-slate-300 p-3"></td>
                                        <td className="border border-slate-300 p-3"></td>
                                        <td className="border border-slate-300 p-3"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-slate-100 p-3 rounded-lg mt-8 border border-slate-200">
                        <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest text-center">
                            Recuerde que durante el proceso, puede salir sin guardar ninguna información...
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-10 mt-auto pt-20">
                        <div className="text-center">
                            <div className="border-t border-slate-400 mb-2"></div>
                            <p className="text-[8px] font-black uppercase">{cliente.nombre}</p>
                            <p className="text-[7px] text-slate-400 uppercase">Firma del Contribuyente</p>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-slate-400 mb-2"></div>
                            <p className="text-[8px] font-black uppercase">Imprenta Córdova</p>
                            <p className="text-[7px] text-slate-400 uppercase">Responsable Técnico</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
