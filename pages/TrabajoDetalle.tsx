
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { logActivity } from '../services/activityLogService';
import { Trabajo, Cliente, TrabajoEstado, TrabajoTipo, User } from '../types';
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
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, loading, updateTrabajoStatus } = useData();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);

    useEffect(() => {
        if (!trabajoId || loading) return;
        const current = trabajos.find(t => t.id === trabajoId);
        if (current) {
            setTrabajo(current);
            setCliente(clientes.find(c => c.id === current.clienteId) || null);
        }
    }, [trabajoId, trabajos, clientes, loading]);

    // Sincronizar cambio de estado local cuando el contexto se actualiza
    useEffect(() => {
        if (!trabajoId) return;
        const current = trabajos.find(t => t.id === trabajoId);
        if (current) setTrabajo(current);
    }, [trabajos, trabajoId]);

    const handleStatusChange = async (newStatus: TrabajoEstado) => {
        if (!trabajo) return;
        await updateTrabajoStatus(trabajo.id, newStatus, currentUser.nombre);
        await logActivity(currentUser.nombre, currentUser.rol || 'Operador', 'CAMBIO_ESTADO', `Estado cambiado manualmente a: ${newStatus}`, 'TrabajoDetalle');
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2Icon className="animate-spin h-10 w-10 text-brand-blue" /></div>;
    if (!trabajo || !cliente) return <div className="p-10 text-center text-slate-500">Trabajo no encontrado.</div>;

    return (
        <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
            {/* Header / Actions Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-black uppercase text-[10px] tracking-widest transition-all px-4 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 border border-slate-200">
                    <ArrowLeftIcon className="w-4 h-4"/> Regresar
                </button>
                <div className="flex flex-wrap gap-3">
                    {trabajo.esSRI ? (
                        <button onClick={() => navigate(`/solicitud-impresion/${trabajo.id}`)} className="px-6 py-3 bg-brand-blue text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-blue-glow-sm hover:bg-brand-blue/90 transition-all flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4" /> Solicitud SRI
                        </button>
                    ) : (
                        <button onClick={() => navigate(`/orden-produccion/${trabajo.id}`)} className="px-6 py-3 bg-brand-blue text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-blue-glow-sm hover:bg-brand-blue/90 transition-all flex items-center gap-2">
                            <LayersIcon className="w-4 h-4" /> Orden de Taller
                        </button>
                    )}

                    <button onClick={() => window.open(`/#/recibo-abono/${trabajo.id}`, '_blank')} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                        <ReceiptIcon className="w-4 h-4 text-slate-400" /> Ticket 80mm
                    </button>
                    <button onClick={() => window.open(`/#/recibo-epson/${trabajo.id}`, '_blank')} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                        <PrinterIcon className="w-4 h-4 text-brand-blue" /> Recibo Epson
                    </button>

                    {(trabajo.estado === TrabajoEstado.VITRINA || trabajo.estado === TrabajoEstado.ENTREGADO) && (
                        <button onClick={() => navigate(`/nota-de-venta/${trabajo.id}`)} className="px-6 py-3 bg-brand-red text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm hover:bg-rose-700 transition-all flex items-center gap-2">
                            <PrinterIcon className="w-4 h-4" /> Nota de Retiro
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* COLUMNA PRINCIPAL */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* CARD PRINCIPAL DE TRABAJO */}
                    <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 block font-inter">Especificación de Obra</span>
                                <h1 className="text-5xl font-black text-slate-900 tracking-tighter">#{String(trabajo.orden).padStart(6, '0')}</h1>
                            </div>
                            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] border ${trabajo.estado === TrabajoEstado.ENTREGADO ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-brand-blue/5 text-brand-blue border-brand-blue/20'}`}>
                                {trabajo.estado}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-10 border-y border-slate-100 relative z-10">
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Valor Total</p><p className="text-2xl font-black text-slate-900">{formatCurrency(trabajo.total)}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Abono Inicial</p><p className="text-2xl font-black text-emerald-600">{formatCurrency(trabajo.abono)}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Saldo Pendiente</p><p className="text-2xl font-black text-rose-500">{formatCurrency(trabajo.saldo)}</p></div>
                            <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tiraje</p><p className="text-2xl font-black text-slate-900">{trabajo.cantidad} Uds.</p></div>
                        </div>

                        <div className="mt-10 space-y-4 relative z-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><BoxIcon className="w-5 h-5 text-brand-blue"/> Detalle Técnico del Encargo</h3>
                            <div className="space-y-1">
                                <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">{trabajo.tipo}</p>
                                <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-tight">{(trabajo.subtipo || '').split('|')[0]}</p>
                            </div>
                        </div>
                    </div>

                    {/* BLOQUE TÉCNICO SRI (SOLIDIFICACIÓN) */}
                    {trabajo.esSRI && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheckIcon className="w-32 h-32" /></div>
                            <div className="relative z-10">
                                <h3 className="text-brand-blue font-black text-[10px] uppercase tracking-[0.4em] mb-8">Validación Técnica SRI</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Punto de Emisión</p>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/10 p-2 rounded-lg text-brand-blue font-mono text-xl font-black">{trabajo.establecimiento || '001'}</div>
                                            <div className="h-px w-4 bg-white/20"></div>
                                            <div className="bg-white/10 p-2 rounded-lg text-brand-blue font-mono text-xl font-black">{trabajo.puntoEmision || '001'}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Clave de Acceso</p>
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex justify-between items-center group">
                                            <span className="font-mono text-emerald-400 font-bold tracking-widest uppercase">{trabajo.claveAcceso || 'PENDIENTE'}</span>
                                            <KeyIcon className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
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
                    <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-200">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10">Registro de Trazabilidad</h3>
                        <div className="space-y-8">
                            {(trabajo.historial || []).map((log, i) => (
                                <div key={i} className="flex gap-6 relative group">
                                    {i !== (trabajo.historial || []).length - 1 && <div className="absolute left-6 top-8 bottom-[-32px] w-[2px] bg-slate-100"></div>}
                                    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${i === (trabajo.historial || []).length - 1 ? 'bg-brand-blue text-white shadow-blue-glow-sm scale-110' : 'bg-slate-50 border border-slate-200 text-slate-400'}`}>
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </div>
                                    <div className="pt-2">
                                        <p className="font-black text-slate-900 uppercase text-sm tracking-wide">{log.estado}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">{formatDate(log.fecha)} — Verificado por <span className="text-slate-700">{log.usuario}</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMNA LATERAL */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Contributor (Client) Summary Card */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-[60px] -mr-32 -mt-32 pointer-events-none transition-opacity group-hover:opacity-50"></div>
                        <div className="absolute top-0 right-0 p-6 opacity-10"><UsersIcon className="w-24 h-24 text-slate-900" /></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em] mb-8 font-inter">Información del Cliente</h3>
                            <div className="space-y-6">
                                <p className="text-3xl font-black text-slate-900 uppercase leading-tight tracking-tighter">{cliente.nombre}</p>
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-3"><ShieldCheckIcon className="w-5 h-5 text-brand-blue"/> <span className="tracking-widest">{cliente.ruc || cliente.cedula}</span></p>
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-3"><MapPinIcon className="w-5 h-5 text-brand-blue"/> <span className="tracking-wide uppercase">{cliente.direccion || 'Pasaje, El Oro'}</span></p>
                                    <p className="text-xs font-bold text-slate-500 flex items-center gap-3"><CalendarDaysIcon className="w-5 h-5 text-brand-blue"/> <span className="tracking-wide uppercase">{cliente.regimen}</span></p>
                                </div>
                                <button onClick={() => navigate(`/clientes`)} className="w-full py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-[10px] text-slate-900 font-black uppercase tracking-[0.3em] transition-all mt-8">Abrir Directorio</button>
                            </div>
                        </div>
                    </div>

                    {/* Manual Status Overrides */}
                    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-200">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Acciones de Taller</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {[TrabajoEstado.PENDIENTE, TrabajoEstado.EN_DISENO, TrabajoEstado.PROCESO, TrabajoEstado.VITRINA, TrabajoEstado.ENTREGADO].map(status => (
                                <button 
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    disabled={trabajo.estado === status}
                                    className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${trabajo.estado === status ? 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue cursor-default' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-200'}`}
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
