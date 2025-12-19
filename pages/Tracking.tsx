
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado } from '../types';
/* Fix: Added missing import for formatCurrency */
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
            // Delay artificial para "sensación de búsqueda real"
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

            <main className="container mx-auto px-6 py-16 max-w-4xl min-h-screen">
                <div className="text-center mb-12 animate-fade-in-up">
                    <div className="w-20 h-20 bg-brand-blue/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                        <ClockIcon className="w-10 h-10 text-brand-blue" />
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter leading-none">Estado de mi Pedido</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md mx-auto leading-relaxed">Consulta el progreso de tus trabajos en tiempo real desde el taller.</p>
                </div>

                <form onSubmit={handleSearch} className="relative max-w-lg mx-auto mb-20 animate-fade-in-up delay-150">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue to-blue-400 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Nro de Orden o Celular..." 
                            className="relative w-full pl-8 pr-40 py-6 bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-2xl text-xl font-bold focus:ring-2 focus:ring-brand-blue outline-none transition-all dark:text-white"
                        />
                        <button 
                            type="submit"
                            disabled={searching}
                            className="absolute right-3 top-3 bottom-3 bg-brand-blue text-white px-10 rounded-[1.5rem] font-black text-xs tracking-widest hover:bg-blue-800 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center uppercase"
                        >
                            {searching ? <Loader2Icon className="w-5 h-5 animate-spin"/> : 'Buscar'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 p-6 rounded-[2rem] border border-red-100 dark:border-red-900/30 mb-8 text-center animate-bounce-in font-bold">
                        {error}
                    </div>
                )}

                <div className="space-y-12">
                    {foundJobs.map(job => {
                        const currentStepIdx = statusSteps.findIndex(s => s.value === job.estado);
                        return (
                            <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in-up">
                                <div className="p-10 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                                            <ShieldCheckIcon className="w-3 h-3"/> Orden Verificada
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-none">#{job.orden} — {job.subtipo}</h2>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl shadow-sm border dark:border-slate-700">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Estado Actual</p>
                                        <p className={`text-sm font-black uppercase ${job.estado === TrabajoEstado.VITRINA ? 'text-green-500' : 'text-brand-blue dark:text-blue-400'}`}>
                                            {job.estado}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-10">
                                    {/* VISUAL TIMELINE */}
                                    <div className="relative pt-10 pb-16">
                                        <div className="absolute top-[82px] left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-brand-blue transition-all duration-[1.5s] ease-out" 
                                                style={{ width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%` }}
                                            ></div>
                                        </div>

                                        <div className="relative flex justify-between">
                                            {statusSteps.map((step, idx) => {
                                                const isCompleted = idx <= currentStepIdx;
                                                const isActive = idx === currentStepIdx;
                                                const Icon = step.icon;
                                                return (
                                                    <div key={step.value} className="flex flex-col items-center group">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center z-10 border-4 transition-all duration-500 ${isCompleted ? 'bg-white dark:bg-slate-900 border-brand-blue shadow-xl scale-110' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-300 dark:text-slate-600'}`}>
                                                            <Icon className={`w-6 h-6 ${isCompleted ? 'text-brand-blue' : ''} ${isActive ? 'animate-pulse' : ''}`} />
                                                        </div>
                                                        <span className={`mt-4 text-[10px] font-black uppercase tracking-wider transition-colors duration-500 ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8 pt-10 border-t dark:border-slate-800">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <ClockIcon className="w-4 h-4"/> Detalles del Trabajo
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-medium">Fecha de Ingreso</span>
                                                    <span className="font-bold">{new Date(job.fechaEntrada).toLocaleDateString('es-EC')}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-medium">Cantidad</span>
                                                    <span className="font-bold">{job.cantidad} unidades</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-medium">Inversión</span>
                                                    <span className="font-black text-brand-blue dark:text-blue-400">{formatCurrency(job.total)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-3xl p-6 border dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                            <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">¿Tienes alguna duda?</p>
                                            <a 
                                                href={`https://wa.me/593993083943?text=Hola,%20quisiera%20consultar%20sobre%20mi%20orden%20Nro%20${job.orden}`} 
                                                target="_blank"
                                                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-green-900/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <MessageCircleIcon className="w-5 h-5"/> Contactar Taller
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-24 text-center">
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-6">Visítanos en Pasaje</p>
                    <div className="flex flex-wrap justify-center gap-6">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-bold">
                            <MapPinIcon className="w-5 h-5 text-brand-red"/> Colón e/ Sucre y Rocafuerte
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm font-bold">
                            <ClockIcon className="w-5 h-5 text-brand-blue"/> Lun - Sáb: 08:30 - 18:30
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TrackingPage;
