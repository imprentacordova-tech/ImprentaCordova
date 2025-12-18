
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado } from '../types';
import { 
    SearchIcon, CordovaLogo, ArrowLeftIcon, ClockIcon, CheckCircleIcon, 
    PrinterIcon, PaletteIcon, BoxIcon, MessageCircleIcon, UsersIcon, MapPinIcon 
} from '../components/Icons';

const statusSteps = [
    { label: 'Recibido', value: TrabajoEstado.PENDIENTE, icon: ClockIcon },
    { label: 'Diseño', value: TrabajoEstado.EN_DISENO, icon: PaletteIcon },
    { label: 'Producción', value: TrabajoEstado.PROCESO, icon: PrinterIcon },
    { label: 'Listo', value: TrabajoEstado.VITRINA, icon: CheckCircleIcon },
    { label: 'Entregado', value: TrabajoEstado.ENTREGADO, icon: BoxIcon }
];

const TrackingPage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [foundJobs, setFoundJobs] = useState<Trabajo[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery) return;
        setSearching(true);
        setError('');
        
        try {
            const [trabajos, clientes] = await Promise.all([getTrabajos(), getClientes()]);
            
            // Buscar por Orden directa o por teléfono de cliente
            let matches = trabajos.filter(t => String(t.orden) === searchQuery);
            
            if (matches.length === 0) {
                const matchedClients = clientes.filter(c => c.telefono.some(tel => tel.includes(searchQuery)));
                const clientIds = matchedClients.map(c => c.id);
                matches = trabajos.filter(t => clientIds.includes(t.clienteId) && t.estado !== TrabajoEstado.ENTREGADO);
            }

            if (matches.length > 0) {
                setFoundJobs(matches.sort((a, b) => b.orden - a.orden));
            } else {
                setError('No encontramos pedidos activos con ese dato. Verifica el # de orden o tu celular.');
                setFoundJobs([]);
            }
        } catch (err) {
            setError('Error al conectar con el servidor.');
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-brand-blue selection:text-white pb-20">
            <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <CordovaLogo className="h-8 w-auto" />
                        <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">Rastreo <span className="text-brand-red">Córdova</span></span>
                    </Link>
                    <Link to="/" className="text-xs font-bold text-slate-400 hover:text-brand-blue flex items-center gap-1 transition-colors">
                        <ArrowLeftIcon className="w-3 h-3" /> INICIO
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Estado de mi Pedido</h1>
                    <p className="text-slate-500">Ingresa tu número de orden o teléfono registrado.</p>
                </div>

                <form onSubmit={handleSearch} className="relative max-w-md mx-auto mb-16">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Ej: 1025 o 099308xxxx" 
                        className="w-full pl-6 pr-32 py-5 bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl text-xl font-bold focus:border-brand-blue outline-none transition-all"
                    />
                    <button 
                        type="submit"
                        disabled={searching}
                        className="absolute right-2 top-2 bottom-2 bg-brand-blue text-white px-8 rounded-[1.5rem] font-black text-sm hover:bg-blue-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                        {searching ? '...' : 'BUSCAR'}
                    </button>
                </form>

                {error && (
                    <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 mb-8 text-center animate-bounce-in">
                        {error}
                    </div>
                )}

                <div className="space-y-8 animate-fade-in">
                    {foundJobs.map(job => {
                        const currentStepIndex = statusSteps.findIndex(s => s.value === job.estado);
                        return (
                            <div key={job.id} className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden mb-12">
                                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-brand-blue tracking-[0.3em] uppercase mb-1">Orden de Trabajo</p>
                                        <h2 className="text-2xl font-black text-slate-900 leading-none">#{job.orden} — {job.subtipo}</h2>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${job.estado === TrabajoEstado.VITRINA ? 'bg-orange-500 text-white' : 'bg-brand-blue text-white'}`}>
                                            {job.estado}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-10">
                                    <div className="relative">
                                        {/* Progress Bar */}
                                        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-brand-blue transition-all duration-1000" 
                                                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                                            ></div>
                                        </div>

                                        {/* Steps */}
                                        <div className="relative flex justify-between">
                                            {statusSteps.map((step, idx) => {
                                                const isCompleted = idx <= currentStepIndex;
                                                const Icon = step.icon;
                                                return (
                                                    <div key={step.value} className="flex flex-col items-center">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 border-4 transition-all ${isCompleted ? 'bg-white border-brand-blue text-brand-blue shadow-lg scale-110' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <span className={`mt-3 text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {job.historial && (
                                        <div className="mt-12 pt-8 border-t border-slate-50">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                <ClockIcon className="w-4 h-4"/> Historial de Procesos
                                            </h3>
                                            <div className="space-y-4">
                                                {job.historial.slice().reverse().map((log, i) => (
                                                    <div key={i} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                                                            <span className="font-bold text-slate-700 uppercase tracking-tighter">{log.estado}</span>
                                                        </div>
                                                        <span className="text-xs font-medium text-slate-400">{new Date(log.fecha).toLocaleString('es-EC')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-20 text-center space-y-6">
                    <p className="text-slate-400 font-medium">¿Necesitas ayuda con tu pedido?</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="https://wa.me/593993083943" className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-all">
                            <MessageCircleIcon className="w-5 h-5"/> WHATSAPP DIRECTO
                        </a>
                        <div className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl">
                            <MapPinIcon className="w-5 h-5 text-brand-red"/> Pasaje, El Oro
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TrackingPage;
