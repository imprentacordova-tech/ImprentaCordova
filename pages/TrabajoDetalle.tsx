
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes, updateTrabajoStatus } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, TrabajoTipo } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { 
    ArrowLeftIcon, ReceiptIcon, DocumentTextIcon, LayersIcon, 
    Loader2Icon, CheckCircleIcon, BoxIcon, UsersIcon, 
    ShieldCheckIcon, CalendarDaysIcon, PrinterIcon,
    ArrowDownTrayIcon, KeyIcon, LockClosedIcon, MapPinIcon
} from '../components/Icons';

const TrabajoDetallePage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
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
        fetch();
    }, [trabajoId]);

    const handleStatusChange = async (newStatus: TrabajoEstado) => {
        if (!trabajo) return;
        const updated = await updateTrabajoStatus(trabajo.id, newStatus, 'Admin');
        setTrabajo(updated);
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2Icon className="animate-spin h-10 w-10 text-brand-blue" /></div>;
    if (!trabajo || !cliente) return <div className="p-10 text-center text-slate-500">Trabajo no encontrado.</div>;

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
            {/* Header / Actions Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-brand-blue font-bold uppercase text-xs tracking-widest transition-all">
                    <ArrowLeftIcon className="w-4 h-4"/> Volver
                </button>
                <div className="flex flex-wrap gap-2">
                    {trabajo.tipo === TrabajoTipo.SRI ? (
                        <button onClick={() => navigate(`/solicitud-impresion/${trabajo.id}`)} className="px-5 py-2.5 bg-brand-blue text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4" /> Solicitud SRI
                        </button>
                    ) : (
                        <button onClick={() => navigate(`/orden-produccion/${trabajo.id}`)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-brand-blue transition-all flex items-center gap-2">
                            <LayersIcon className="w-4 h-4" /> Orden de Taller
                        </button>
                    )}

                    <button onClick={() => window.open(`/#/recibo-abono/${trabajo.id}`, '_blank')} className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                        <ReceiptIcon className="w-4 h-4 text-brand-blue" /> Recibo Abono
                    </button>

                    {(trabajo.estado === TrabajoEstado.VITRINA || trabajo.estado === TrabajoEstado.ENTREGADO) && (
                        <button onClick={() => navigate(`/nota-de-venta/${trabajo.id}`)} className="px-5 py-2.5 bg-brand-red text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl hover:bg-red-800 transition-all flex items-center gap-2">
                            <PrinterIcon className="w-4 h-4" /> Nota de Retiro
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* COLUMNA PRINCIPAL */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* CARD PRINCIPAL DE TRABAJO */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block">Orden de Producción</span>
                                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">#{String(trabajo.orden).padStart(6, '0')}</h1>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ${trabajo.estado === TrabajoEstado.ENTREGADO ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {trabajo.estado}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-slate-50 dark:border-white/5">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p><p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(trabajo.total)}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Abono</p><p className="text-xl font-black text-emerald-500">{formatCurrency(trabajo.abono)}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo</p><p className="text-xl font-black text-brand-red">{formatCurrency(trabajo.saldo)}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cantidad</p><p className="text-xl font-black text-slate-900 dark:text-white">{trabajo.cantidad} Uds.</p></div>
                        </div>

                        <div className="mt-8 space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BoxIcon className="w-4 h-4"/> Descripción del Pedido</h3>
                            <p className="text-lg font-bold text-slate-700 dark:text-slate-300 leading-relaxed uppercase">{trabajo.subtipo}</p>
                        </div>
                    </div>

                    {/* BLOQUE TÉCNICO SRI (SOLIDIFICACIÓN) */}
                    {trabajo.tipo === TrabajoTipo.SRI && (
                        <div className="bg-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5 animate-slide-in-up">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheckIcon className="w-32 h-32" /></div>
                            <div className="relative z-10">
                                <h3 className="text-brand-red font-black text-[10px] uppercase tracking-[0.4em] mb-8">Validación Técnica SRI</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Punto de Emisión</p>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/10 p-2 rounded-lg text-brand-red font-mono text-xl font-black">{trabajo.establecimiento || '001'}</div>
                                            <div className="h-px w-4 bg-white/20"></div>
                                            <div className="bg-white/10 p-2 rounded-lg text-brand-red font-mono text-xl font-black">{trabajo.puntoEmision || '001'}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Clave de Acceso / Contraseña</p>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center group">
                                            <span className="font-mono text-emerald-400 font-bold tracking-widest uppercase">{trabajo.claveAcceso || 'PENDIENTE'}</span>
                                            <KeyIcon className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Actividad Económica</p>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase leading-tight">{trabajo.actividadSeleccionada || 'ACTIVIDAD GENERAL'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timeline / Status Logs */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-sm border border-slate-100 dark:border-white/5">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Historial de Estados</h3>
                        <div className="space-y-6">
                            {(trabajo.historial || []).map((log, i) => (
                                <div key={i} className="flex gap-6 relative">
                                    {i !== (trabajo.historial || []).length - 1 && <div className="absolute left-4 top-8 bottom-[-24px] w-0.5 bg-slate-100 dark:bg-white/5"></div>}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${i === (trabajo.historial || []).length - 1 ? 'bg-brand-blue text-white' : 'bg-slate-50 dark:bg-white/5 text-slate-400'}`}>
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white uppercase text-xs">{log.estado}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{formatDate(log.fecha)} — Por {log.usuario}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMNA LATERAL */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Contributor (Client) Summary Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><UsersIcon className="w-20 h-20" /></div>
                        <h3 className="text-[10px] font-black text-brand-red uppercase tracking-[0.3em] mb-6">Datos del Cliente</h3>
                        <div className="space-y-4">
                            <p className="text-xl font-black uppercase leading-tight tracking-tight">{cliente.nombre}</p>
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4 text-brand-blue"/> {cliente.ruc || cliente.cedula}</p>
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-brand-blue"/> {cliente.direccion || 'Pasaje, El Oro'}</p>
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-2"><CalendarDaysIcon className="w-4 h-4 text-brand-blue"/> {cliente.regimen}</p>
                            </div>
                            <button onClick={() => navigate(`/clientes`)} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all mt-4">Ver Directorio</button>
                        </div>
                    </div>

                    {/* Manual Status Overrides */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-white/5">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Acción de Taller</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {[TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO, TrabajoEstado.PROCESO, TrabajoEstado.VITRINA, TrabajoEstado.ENTREGADO].map(status => (
                                <button 
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    disabled={trabajo.estado === status}
                                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${trabajo.estado === status ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-default' : 'bg-white dark:bg-slate-800 border-transparent hover:border-brand-blue text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {status === TrabajoEstado.VITRINA ? 'Mover a Vitrina' : status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrabajoDetallePage;
