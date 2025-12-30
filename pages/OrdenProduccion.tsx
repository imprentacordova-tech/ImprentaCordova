
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Cliente, Trabajo } from '../types';
import { 
    PrinterIcon, ArrowLeftIcon, CordovaLogo, 
    Loader2Icon, BoxIcon, ClockIcon, WrenchScrewdriverIcon,
    LayersIcon
} from '../components/Icons';
import { formatDate } from '../utils';

const OrdenProduccionPage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!trabajoId) return;
            setLoading(true);
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

    if (loading || !trabajo || !cliente) return <div className="flex h-screen items-center justify-center"><Loader2Icon className="animate-spin h-10 w-10 text-brand-blue" /></div>;

    return (
        <div className="bg-slate-100 min-h-screen py-10 flex flex-col items-center overflow-y-auto">
            <style>{`
                @media print {
                    @page { size: A5 landscape; margin: 5mm; }
                    body { background: white; }
                    .no-print { display: none !important; }
                    #orden-container { border: 2px solid #0B42A7 !important; box-shadow: none !important; width: 210mm !important; height: 148mm !important; }
                }
            `}</style>

            <div className="w-full max-w-[210mm] flex justify-between mb-6 no-print px-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 font-black text-xs uppercase tracking-widest"><ArrowLeftIcon className="w-4 h-4"/> Regresar</button>
                <button onClick={() => window.print()} className="bg-brand-blue text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-slate-900 transition-all">
                    <PrinterIcon className="w-5 h-5"/> Imprimir Hoja de Taller
                </button>
            </div>

            <div id="orden-container" className="bg-white shadow-2xl border-t-8 border-brand-blue p-8" style={{ width: '210mm', height: '148mm', position: 'relative' }}>
                {/* CABECERA */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <CordovaLogo className="h-16 w-auto" />
                        <div>
                            <h1 className="text-2xl font-black text-brand-blue leading-none">ORDEN DE PRODUCCIÓN</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hoja de Ruta Interna - Imprenta Córdova</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-brand-red font-mono">#{String(trabajo.orden).padStart(6, '0')}</div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registrado: {formatDate(trabajo.fechaEntrada)}</p>
                    </div>
                </div>

                {/* CUERPO TÉCNICO */}
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-7 space-y-6">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Datos del Cliente</h3>
                            <p className="text-xl font-black text-slate-900 uppercase">{cliente.nombre}</p>
                            <p className="text-sm font-bold text-slate-500 mt-1 italic">{cliente.telefono[0]}</p>
                        </div>

                        <div className="p-4 border-2 border-brand-blue/10 rounded-2xl">
                            <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-3 flex items-center gap-2">
                                <BoxIcon className="w-4 h-4"/> Descripción del Trabajo
                            </h3>
                            <p className="text-2xl font-black text-slate-800 leading-tight uppercase">{trabajo.subtipo}</p>
                            <div className="flex gap-8 mt-4">
                                <div><p className="text-[9px] font-bold text-slate-400 uppercase">Cantidad</p><p className="text-xl font-black">{trabajo.cantidad} Uds.</p></div>
                                <div><p className="text-[9px] font-bold text-slate-400 uppercase">Tamaño Ref.</p><p className="text-xl font-black">{trabajo.tamano || 'N/A'}</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-5 space-y-4">
                        <div className="bg-brand-blue text-white p-6 rounded-[2rem] shadow-xl">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Estado del Pedido</h3>
                            <div className="flex items-center gap-4">
                                <ClockIcon className="w-10 h-10 text-brand-red animate-pulse" />
                                <div>
                                    <p className="text-2xl font-black uppercase">{trabajo.estado}</p>
                                    <p className="text-[10px] font-bold text-blue-200 uppercase">Prioridad: {trabajo.prioridad || 'Normal'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-6 rounded-[2rem]">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-brand-red">Instrucciones Especiales</h3>
                            <p className="text-sm font-medium leading-relaxed italic">
                                {trabajo.prioridad === 'Urgente' ? 'ATENCIÓN: Entrega Prioritaria hoy mismo.' : 'Procesar según cola estándar de taller.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center opacity-30">
                    <p className="text-[10px] font-bold">Operador: {trabajo.creadoPor || 'Sistema'}</p>
                    <p className="text-[10px] font-bold tracking-widest">CÓRDOVA VISION ERP 2025</p>
                </div>
            </div>
        </div>
    );
};

export default OrdenProduccionPage;
