
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo, TrabajoTipo } from '../types';
import { 
    PrinterIcon, ArrowDownTrayIcon, ArrowLeftIcon, 
    CordovaLogo, Loader2Icon, ShieldCheckIcon, DocumentTextIcon,
    ExclamationTriangleIcon, CheckIcon
} from '../components/Icons';
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
        const element = document.getElementById('documento-oficial-sri');
        if (!element || !trabajo) return;
        const opt = {
            margin: 0,
            filename: `Solicitud-SRI-${trabajo.orden}-${cliente?.nombre}.pdf`,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    };

    if (loading || !config || !trabajo || !cliente) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2Icon className="w-10 h-10 text-brand-blue animate-spin" />
        </div>
    );

    const isSRI = trabajo.tipo === TrabajoTipo.SRI;
    const fechaHoy = new Date().toLocaleDateString('es-EC');

    return (
        <div className="bg-slate-200 min-h-screen py-12 flex flex-col items-center overflow-y-auto">
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; background: white; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    #documento-oficial-sri { 
                        box-shadow: none !important; 
                        border: none !important;
                        width: 210mm !important;
                        height: 297mm !important;
                        padding: 15mm !important;
                    }
                }
            `}</style>

            <div className="w-full max-w-[210mm] flex justify-between mb-8 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 font-black text-xs uppercase tracking-widest hover:text-brand-blue transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" /> Volver
                </button>
                <div className="flex gap-3">
                    <button onClick={handleDownloadPdf} className="bg-white border-2 border-slate-300 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <ArrowDownTrayIcon className="w-5 h-5" /> Exportar PDF
                    </button>
                    <button onClick={() => window.print()} className="bg-brand-blue text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-slate-950 transition-all">
                        <PrinterIcon className="w-5 h-5"/> Imprimir Solicitud
                    </button>
                </div>
            </div>

            {/* FORMATO ANEXO 1 - SOLICITUD DE AUTORIZACIONES */}
            <div id="documento-oficial-sri" className="bg-white shadow-2xl border border-slate-300 relative flex flex-col box-border" style={{ width: '210mm', minHeight: '297mm', padding: '20mm', fontFamily: 'Arial, sans-serif' }}>
                
                {/* CABECERA OFICIAL */}
                <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 mb-8">
                    <div className="flex items-center gap-5">
                        <div className="bg-brand-blue p-3 rounded-2xl shadow-lg">
                            <CordovaLogo className="h-16 w-auto brightness-0 invert" />
                        </div>
                        <div>
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Archivo para Establecimientos Gráficos</h2>
                            <h1 className="text-2xl font-black text-brand-blue tracking-tighter leading-none">ANEXO 1 - SOLICITUD DE AUTORIZACIONES</h1>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="inline-block px-3 py-1 bg-brand-red text-white text-[9px] font-black rounded uppercase tracking-widest mb-2">ORIGINAL</div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Orden Interna: <span className="text-slate-900 font-black">#{trabajo.orden}</span></p>
                    </div>
                </div>

                {/* DATOS DEL CONTRIBUYENTE (BLOQUE 1) */}
                <div className="space-y-4 mb-10">
                    <div className="grid grid-cols-12 border border-gray-300">
                        <div className="col-span-12 bg-gray-100 p-2 border-b border-gray-300">
                            <span className="text-[10px] font-black uppercase">1. Información del Contribuyente</span>
                        </div>
                        <div className="col-span-12 p-4 grid grid-cols-2 gap-8">
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Apellidos y Nombres / Razón Social</p>
                                <p className="text-sm font-bold uppercase text-slate-900">{cliente.nombre}</p>
                            </div>
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">R.U.C. (Registro Único de Contribuyentes)</p>
                                <p className="text-sm font-mono font-black text-brand-blue">{cliente.ruc || cliente.cedula}</p>
                            </div>
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Fecha de Solicitud</p>
                                <p className="text-sm font-bold uppercase">{fechaHoy}</p>
                            </div>
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Teléfono de Contacto</p>
                                <p className="text-sm font-bold">{cliente.telefono[0]}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DETALLE DE DOCUMENTOS (TABLA SOLICITADA) */}
                <div className="border border-gray-300 mb-10">
                    <div className="bg-gray-100 p-2 border-b border-gray-300">
                        <span className="text-[10px] font-black uppercase">2. Detalle de Documentos Solicitados</span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-300">
                            <tr className="text-[9px] font-black text-gray-600 uppercase">
                                <th className="p-3 border-r">Tipo de Documento</th>
                                <th className="p-3 border-r text-center">Establecimiento</th>
                                <th className="p-3 border-r text-center">Punto Emisión</th>
                                <th className="p-3 text-center">Cantidad</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs">
                            <tr className="border-b">
                                <td className="p-3 border-r font-bold uppercase text-brand-blue">{trabajo.subtipo}</td>
                                <td className="p-3 border-r text-center font-mono font-bold text-lg">{trabajo.establecimiento || '001'}</td>
                                <td className="p-3 border-r text-center font-mono font-bold text-lg">{trabajo.puntoEmision || '001'}</td>
                                <td className="p-3 text-center font-black text-lg">{trabajo.cantidad}</td>
                            </tr>
                            {[...Array(2)].map((_, i) => (
                                <tr key={i} className="border-b h-10">
                                    <td className="p-3 border-r"></td><td className="p-3 border-r"></td><td className="p-3 border-r"></td><td className="p-3"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* OPCIONES ADICIONALES */}
                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="border border-gray-300 p-4 rounded-xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-3">¿Desea categoría negociable?</p>
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-slate-300 rounded flex items-center justify-center text-white"><CheckIcon className="w-3 h-3 text-slate-300"/></div><span className="text-xs font-bold">SI</span></div>
                            <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-brand-blue bg-brand-blue rounded flex items-center justify-center text-white"><CheckIcon className="w-3 h-3"/></div><span className="text-xs font-bold">NO</span></div>
                        </div>
                    </div>
                    <div className="border border-gray-300 p-4 rounded-xl">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-3">Régimen Detectado</p>
                        <span className="text-xs font-black bg-blue-50 text-brand-blue px-3 py-1 rounded-full uppercase tracking-widest">{cliente.regimen}</span>
                    </div>
                </div>

                {/* DIRECCIÓN Y OTROS */}
                <div className="border border-gray-300 p-4 mb-10 bg-slate-50/50">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Dirección a imprimir en el documento</p>
                    <p className="text-sm font-bold uppercase text-slate-800 leading-tight">{cliente.direccion || 'C. Principal y C. Secundaria, Pasaje - El Oro'}</p>
                </div>

                {/* DECLARACIÓN Y FIRMAS */}
                <div className="mt-auto space-y-12">
                    <div className="p-4 border-2 border-brand-blue/10 bg-blue-50/30 rounded-2xl text-[10px] leading-relaxed text-gray-600">
                        <p className="font-bold mb-1">DECLARACIÓN DE RESPONSABILIDAD:</p>
                        Declaro que los datos proporcionados en esta solicitud son exactos y verdaderos, por lo que asumo la responsabilidad legal sobre su veracidad. Autorizo a <b>IMPRENTA CÓRDOVA</b> para que gestione ante el SRI la autorización de impresión correspondiente.
                    </div>

                    <div className="grid grid-cols-2 gap-20 pt-16">
                        <div className="text-center border-t border-slate-400 pt-3">
                            <p className="text-[9px] font-black text-slate-900 uppercase">Firma del Contribuyente</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">C.I. {cliente.cedula}</p>
                        </div>
                        <div className="text-center border-t border-slate-400 pt-3">
                            <p className="text-[9px] font-black text-slate-900 uppercase">Recibido por Imprenta</p>
                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Autorización SRI: {config.imprentaAutorizacion}</p>
                        </div>
                    </div>
                </div>

                {/* PIE DE PÁGINA */}
                <div className="absolute bottom-10 left-0 w-full px-[20mm] flex justify-between items-center opacity-40">
                    <p className="text-[8px] font-bold text-gray-400">Generado por Córdova E.R.P. 2025 - Sistema Maestro de Pasaje</p>
                    <p className="text-[8px] font-bold text-gray-400">Página 1 de 1</p>
                </div>
            </div>
        </div>
    );
};

export default SolicitudImpresionPage;
