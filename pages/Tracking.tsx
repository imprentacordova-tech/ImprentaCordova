
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado } from '../types';
import { formatCurrency } from '../utils';
import { 
    SearchIcon, CordovaLogo, ArrowLeftIcon, ClockIcon, CheckCircleIcon, 
    PrinterIcon, PaletteIcon, BoxIcon, MessageCircleIcon, MapPinIcon, Loader2Icon, ShieldCheckIcon
} from '../components/Icons';

const statusSteps = [
    { label: 'Recibido', value: TrabajoEstado.PENDIENTE, icon: ClockIcon, color: 'bg-yellow-500' },
    { label: 'Diseño', value: TrabajoEstado.EN_DISENO, icon: PaletteIcon, color: 'bg-indigo-500' },
    { label: 'En Taller', value: TrabajoEstado.PROCESO, icon: PrinterIcon, color: 'bg-blue-600' },
    { label: 'Terminado', value: TrabajoEstado.VITRINA, icon: CheckCircleIcon, color: 'bg-green-500' },
    { label: 'Entregado', value: TrabajoEstado.ENTREGADO, icon: BoxIcon, color: 'bg-slate-400' }
];

const TrackingPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [foundJobs, setFoundJobs] = useState<Trabajo[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanQuery = searchQuery.trim();
        if (!cleanQuery) return;
        setSearching(true);
        setError('');
        
        try {
            await new Promise(r => setTimeout(r, 1200));
            const [trabajos, clientes] = await Promise.all([getTrabajos(), getClientes()]);
            
            let matches = trabajos.filter(t => String(t.orden) === cleanQuery);
            if (matches.length === 0) {
                const matchedClients = clientes.filter(c => c.telefono.some(tel => tel.includes(cleanQuery)));
                const clientIds = matchedClients.map(c => c.id);
                matches = trabajos.filter(t => clientIds.includes(t.clienteId) && t.estado !== TrabajoEstado.ENTREGADO);
            }

            if (matches.length > 0) {
                setFoundJobs(matches.sort((a, b) => b.orden - a.orden));
            } else {
                setError('No encontramos pedidos activos con ese dato. Verifica tu # de orden o celular.');
                setFoundJobs([]);
            }
        } catch (err) {
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-brand-blue selection:text-white">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 py-4 px-6 sticky top-0 z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <CordovaLogo className="h-8 w-auto" />
                        <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Rastreo <span className="text-brand-red">Córdova</span></span>
                    </Link>
                    <Link to="/" className="text-[10px] font-black text-slate-400 hover:text-brand-blue flex items-center gap-2 transition-colors uppercase tracking-widest">
                        <ArrowLeftIcon className="w-3 h-3" /> Volver al Inicio
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-6 py-16 max-w-4xl min-h-screen text-center lg:text-left">
                <div className="mb-12 animate-fade-in-up">
                    <div className="w-20 h-20 bg-brand-blue/10 rounded-[2rem] flex items-center justify-center mx-auto lg:mx-0 mb-6 border border-brand-blue/20 shadow-inner">
                        <ClockIcon className="w-10 h-10 text-brand-blue" />
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter leading-none italic">
                        ¿DÓNDE ESTÁ MI <span className="text-brand-red">PEDIDO?</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md leading-relaxed">Consulta el progreso de tus trabajos en tiempo real desde nuestro taller en Pasaje.</p>
                </div>

                <form onSubmit={handleSearch} className="relative max-w-2xl mb-20 animate-fade-in-up delay-150">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue to-blue-400 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Introduce tu # de Orden o Celular..." 
                            className="relative w-full pl-8 pr-44 py-7 bg-white dark:bg-slate-900 border-none rounded-[2.2rem] shadow-2xl text-xl font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all dark:text-white"
                        />
                        <button 
                            type="submit"
                            disabled={searching}
                            className="absolute right-3 top-3 bottom-3 bg-brand-blue text-white px-10 rounded-[1.8rem] font-black text-[10px] tracking-[0.2em] hover:bg-brand-red transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center uppercase"
                        >
                            {searching ? <Loader2Icon className="w-5 h-5 animate-spin"/> : 'Buscar'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 mb-8 text-center animate-bounce-in font-black text-sm uppercase tracking-widest">
                        {error}
                    </div>
                )}

                <div className="space-y-12 pb-24">
                    {foundJobs.map(job => {
                        const currentStepIdx = statusSteps.findIndex(s => s.value === job.estado);
                        return (
                            <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[4rem] shadow-3xl border border-slate-100 dark:border-white/5 overflow-hidden animate-fade-in-up">
                                <div className="p-12 border-b dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col md:flex-row justify-between items-center gap-8">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-blue text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                            <ShieldCheckIcon className="w-3 h-3"/> Orden Confirmada
                                        </div>
                                        <h2 className="text-4xl font-black text-brand-navy dark:text-white leading-none tracking-tighter">#{job.orden} — {job.subtipo}</h2>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Registrado el {new Date(job.fechaEntrada).toLocaleDateString()}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-inner border dark:border-white/5 text-center min-w-[220px]">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Estado de Producción</p>
                                        <p className={`text-xl font-black uppercase ${job.estado === TrabajoEstado.VITRINA ? 'text-green-500 animate-pulse' : 'text-brand-blue dark:text-blue-400'}`}>
                                            {job.estado}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-12 lg:p-20">
                                    {/* VISUAL TIMELINE PREMIUM */}
                                    <div className="relative pb-24">
                                        <div className="absolute top-[35px] left-0 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-brand-blue to-brand-red transition-all duration-[2s] ease-out shadow-[0_0_15px_rgba(11,66,167,0.5)]" 
                                                style={{ width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%` }}
                                            ></div>
                                        </div>

                                        <div className="relative flex justify-between">
                                            {statusSteps.map((step, idx) => {
                                                const isCompleted = idx <= currentStepIdx;
                                                const isActive = idx === currentStepIdx;
                                                const Icon = step.icon;
                                                return (
                                                    <div key={step.value} className="flex flex-col items-center">
                                                        <div className={`w-18 h-18 lg:w-20 lg:h-20 rounded-[1.8rem] flex items-center justify-center z-10 border-4 transition-all duration-700 ${isCompleted ? 'bg-white dark:bg-slate-900 border-brand-blue shadow-2xl scale-125' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-200 dark:text-slate-600'}`}>
                                                            <Icon className={`w-7 h-7 lg:w-8 lg:h-8 ${isCompleted ? 'text-brand-blue' : ''} ${isActive ? 'animate-pulse' : ''}`} />
                                                        </div>
                                                        <span className={`mt-8 text-[10px] font-black uppercase tracking-[0.15em] transition-colors duration-700 ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-12 pt-12 border-t dark:border-white/5">
                                        <div className="space-y-6">
                                            <h3 className="text-xs font-black text-brand-blue uppercase tracking-[0.3em] flex items-center gap-3">
                                                <div className="w-2 h-2 bg-brand-red rounded-full"></div> Resumen Operativo
                                            </h3>
                                            <div className="grid grid-cols-2 gap-y-6">
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Inversión</span>
                                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(job.total)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cantidad</span>
                                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{job.cantidad} Uds</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Abonado</span>
                                                    <span className="text-lg font-black text-green-600">{formatCurrency(job.abono)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pendiente</span>
                                                    <span className="text-lg font-black text-brand-red">{formatCurrency(job.saldo)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-brand-blue/5 rounded-[3rem] p-10 border border-brand-blue/10 flex flex-col items-center justify-center text-center">
                                            <MessageCircleIcon className="w-12 h-12 text-brand-blue mb-6"/>
                                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-6 italic leading-relaxed">"Si tienes dudas sobre el diseño o necesitas un cambio urgente, escríbenos directamente."</p>
                                            <a 
                                                href={`https://wa.me/593993083943?text=Hola,%20quisiera%20consultar%20sobre%20mi%20orden%20Nro%20${job.orden}`} 
                                                target="_blank"
                                                className="w-full py-5 bg-brand-blue hover:bg-slate-950 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-3"
                                            >
                                                Soporte en WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default TrackingPage;
