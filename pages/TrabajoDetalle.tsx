
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { 
    ArrowLeftIcon, ClockIcon, PaletteIcon, PrinterIcon, 
    CheckCircleIcon, BoxIcon, UserPlusIcon, PhoneIcon, 
    ReceiptIcon, ShieldCheckIcon, CalendarDaysIcon, 
    ExclamationTriangleIcon, Loader2Icon, WhatsAppIcon,
    DocumentTextIcon
} from '../components/Icons';

const statusSteps = [
    { label: 'Pendiente', value: TrabajoEstado.PENDIENTE, icon: ClockIcon, color: 'text-yellow-500', bg: 'bg-yellow-500' },
    { label: 'Diseño', value: TrabajoEstado.EN_DISENO, icon: PaletteIcon, color: 'text-indigo-500', bg: 'bg-indigo-500' },
    { label: 'Proceso', value: TrabajoEstado.PROCESO, icon: PrinterIcon, color: 'text-blue-600', bg: 'bg-blue-600' },
    { label: 'Vitrina', value: TrabajoEstado.VITRINA, icon: CheckCircleIcon, color: 'text-emerald-500', bg: 'bg-emerald-500' },
    { label: 'Entregado', value: TrabajoEstado.ENTREGADO, icon: BoxIcon, color: 'text-slate-400', bg: 'bg-slate-400' }
];

const TrabajoDetallePage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const navigate = useNavigate();
    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!trabajoId) return;
            setLoading(true);
            try {
                const [jobs, clients] = await Promise.all([getTrabajos(), getClientes()]);
                const foundJob = jobs.find(t => t.id === trabajoId);
                if (foundJob) {
                    setTrabajo(foundJob);
                    setCliente(clients.find(c => c.id === foundJob.clienteId) || null);
                }
            } catch (e) {
                console.error("Error cargando detalle:", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [trabajoId]);

    const currentStepIdx = useMemo(() => {
        if (!trabajo) return 0;
        return statusSteps.findIndex(s => s.value === trabajo.estado);
    }, [trabajo]);

    const progressPercentage = useMemo(() => {
        return (currentStepIdx / (statusSteps.length - 1)) * 100;
    }, [currentStepIdx]);

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2Icon className="w-10 h-10 text-brand-blue animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Consultando Base de Datos...</p>
        </div>
    );

    if (!trabajo || !cliente) return (
        <div className="p-12 text-center bg-white rounded-[2.5rem] shadow-xl border border-slate-100">
            <ExclamationTriangleIcon className="w-16 h-16 text-brand-red mx-auto mb-4" />
            <h2 className="text-2xl font-black uppercase">Orden no encontrada</h2>
            <Link to="/trabajos" className="mt-6 inline-block text-brand-blue font-bold uppercase text-xs tracking-widest underline">Volver al listado</Link>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header / Back Navigation */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-slate-400 hover:text-brand-blue transition-all group">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5 group-hover:-translate-x-1 transition-transform">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Volver al Taller</span>
                </button>
                <div className="flex gap-3">
                    <button onClick={() => window.open(`/#/recibo-abono/${trabajo.id}`, '_blank')} className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                        <ReceiptIcon className="w-4 h-4 text-brand-blue" /> Recibo
                    </button>
                    {trabajo.tipo === 'sri' && (
                        <button onClick={() => navigate(`/solicitud-impresion/${trabajo.id}`)} className="px-6 py-3 bg-brand-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-950 transition-all flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4" /> Solicitud SRI
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: JOB INFO CARD */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-xl border border-slate-50 dark:border-white/5 relative overflow-hidden">
                        {/* Status Label Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                <div>
                                    <span className="inline-block px-3 py-1 bg-brand-red text-white text-[9px] font-black rounded-lg uppercase tracking-widest mb-4">ORDEN #{trabajo.orden}</span>
                                    <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white leading-none tracking-tighter uppercase">{trabajo.subtipo}</h1>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Registro</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white uppercase">{formatDate(trabajo.fechaEntrada)}</p>
                                </div>
                            </div>

                            {/* PROGRESS TRACKER MAESTRO */}
                            <div className="pt-10 pb-6">
                                <div className="relative">
                                    {/* Line Container */}
                                    <div className="absolute top-[34px] left-0 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                        <div 
                                            className="h-full bg-gradient-to-r from-brand-blue to-brand-red transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(11,66,167,0.3)]" 
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>

                                    {/* Steps Icons */}
                                    <div className="relative flex justify-between">
                                        {statusSteps.map((step, idx) => {
                                            const isCompleted = idx <= currentStepIdx;
                                            const isActive = idx === currentStepIdx;
                                            const Icon = step.icon;
                                            return (
                                                <div key={step.value} className="flex flex-col items-center">
                                                    <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-[1.8rem] flex items-center justify-center z-10 border-4 transition-all duration-700 ${isCompleted ? 'bg-white dark:bg-slate-900 border-brand-blue shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-300 dark:text-slate-700'}`}>
                                                        <Icon className={`w-6 h-6 lg:w-8 lg:h-8 ${isCompleted ? step.color : ''} ${isActive ? 'animate-pulse' : ''}`} />
                                                    </div>
                                                    <span className={`mt-4 text-[9px] font-black uppercase tracking-[0.15em] text-center max-w-[80px] leading-tight transition-colors duration-500 ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Technical Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t dark:border-white/5">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cantidad</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{trabajo.cantidad} Uds.</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Inversión Total</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(trabajo.total)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tamaño Ref.</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">{trabajo.tamano}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Prioridad</p>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${trabajo.prioridad === 'Urgente' ? 'bg-brand-red text-white' : 'bg-blue-50 text-brand-blue'}`}>
                                        {trabajo.prioridad || 'Normal'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PHOTOS / ARTWORK PREVIEW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-50 dark:border-white/5">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                <PrinterIcon className="w-4 h-4 text-brand-blue" /> Arte / Diseño de Referencia
                            </h3>
                            <div className="aspect-video bg-slate-50 dark:bg-slate-800 rounded-3xl overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                {trabajo.fotoOriginalUrl ? (
                                    <img src={trabajo.fotoOriginalUrl} className="w-full h-full object-cover" alt="Arte" />
                                ) : (
                                    <div className="text-center">
                                        <PaletteIcon className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin archivo adjunto</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-950 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheckIcon className="w-32 h-32" /></div>
                            <div className="relative z-10">
                                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Estado Financiero</h3>
                                <p className="text-4xl font-black tracking-tighter mb-1">{formatCurrency(trabajo.saldo)}</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Saldo Pendiente de Cobro</p>
                            </div>
                            <div className="relative z-10 mt-10 p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Abonado</span>
                                <span className="text-lg font-black text-emerald-400">{formatCurrency(trabajo.abono)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: CLIENT & ACTIONS */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Client Profile */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-50 dark:border-white/5">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-900/20">
                                {cliente.nombre.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase leading-tight">{cliente.nombre}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{cliente.regimen}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400"><UserPlusIcon className="w-4 h-4"/></div>
                                <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">RUC / Cédula</p><p className="text-sm font-bold text-slate-900 dark:text-white font-mono">{cliente.ruc || cliente.cedula}</p></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400"><PhoneIcon className="w-4 h-4"/></div>
                                <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Contacto Principal</p><p className="text-sm font-bold text-slate-900 dark:text-white">{cliente.telefono[0]}</p></div>
                            </div>
                        </div>

                        <div className="mt-10 grid grid-cols-2 gap-3">
                            <a 
                                href={`https://wa.me/593${cliente.telefono[0].replace(/\D/g, '').substring(cliente.telefono[0].length - 9)}?text=Hola%20${cliente.nombre},%20tu%20trabajo%20de%20${trabajo.subtipo}%20está%20en%20estado%20${trabajo.estado}`}
                                target="_blank"
                                className="flex-1 flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-3xl transition-all gap-2 group"
                            >
                                <WhatsAppIcon className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform"/>
                                <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">WhatsApp</span>
                            </a>
                            <button className="flex-1 flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-3xl transition-all gap-2 group">
                                <PhoneIcon className="w-6 h-6 text-brand-blue group-hover:scale-110 transition-transform"/>
                                <span className="text-[8px] font-black text-brand-blue uppercase tracking-widest">Llamar</span>
                            </button>
                        </div>
                    </div>

                    {/* Operational Log */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4" /> Historial de Movimientos
                        </h3>
                        <div className="space-y-6">
                            {(trabajo.historial || []).slice().reverse().map((log, i) => (
                                <div key={i} className="flex gap-4 relative group">
                                    {i !== (trabajo.historial?.length || 0) - 1 && (
                                        <div className="absolute left-[13px] top-8 w-0.5 h-6 bg-slate-200 dark:bg-slate-800"></div>
                                    )}
                                    <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex-shrink-0 z-10 group-hover:border-brand-blue transition-colors"></div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none">{log.estado}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Por {log.usuario} • {formatDate(log.fecha)}</p>
                                    </div>
                                </div>
                            ))}
                            {(!trabajo.historial || trabajo.historial.length === 0) && (
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center py-4 italic">No se registran cambios.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrabajoDetallePage;
