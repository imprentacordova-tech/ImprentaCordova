
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { getTrabajos, getClientes, registerRetiro } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, User } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { 
    SearchIcon, CloseIcon, DocumentCheckIcon, PrinterIcon, ArrowDownTrayIcon, 
    ShieldCheckIcon, WhatsAppIcon, Loader2Icon, ArrowRightIcon, BoxIcon, 
    ExclamationTriangleIcon, CordovaLogo, CheckCircleIcon, ClockIcon
} from '../components/Icons';
import { getConfig, NotaDeVentaConfig } from '../services/configService';

const RetirosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();
    const [allTrabajos, setAllTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [lastDeliveredId, setLastDeliveredId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const [t, c] = await Promise.all([getTrabajos(), getClientes()]);
        setAllTrabajos(t);
        setClientes(c);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return allTrabajos.filter(t => t.estado === TrabajoEstado.VITRINA).filter(t => {
            const c = clientes.find(cl => cl.id === t.clienteId);
            return searchTerm === '' || String(t.orden).includes(lower) || c?.nombre.toLowerCase().includes(lower);
        });
    }, [allTrabajos, clientes, searchTerm]);

    const handleConfirmRetiro = async (pagoFinal: number) => {
        if (!selectedTrabajo) return;
        const updated = await registerRetiro(selectedTrabajo.id, pagoFinal, currentUser.nombre);
        setLastDeliveredId(updated.id);
        setSelectedTrabajo(null);
        fetchData();
    };

    const notifyClient = (trabajo: Trabajo) => {
        const cliente = clientes.find(c => c.id === trabajo.clienteId);
        if (!cliente || !cliente.telefono.length) {
            alert("El cliente no tiene teléfono registrado.");
            return;
        }
        
        const saldoMsg = trabajo.saldo > 0 ? `Saldo pendiente: ${formatCurrency(trabajo.saldo)}.` : "¡Su pedido está cancelado!";
        const message = `👋 Hola ${cliente.nombre}, Imprenta Córdova le informa que su pedido #${trabajo.orden} (${trabajo.subtipo}) está listo para ser retirado. 📍 ${saldoMsg} Visítenos en Colón y Sucre.`;
        
        window.open(generateWhatsAppLink(cliente.telefono[0], message), '_blank');
    };

    const getDaysInVitrina = (dateString: string) => {
        const diff = new Date().getTime() - new Date(dateString).getTime();
        return Math.floor(diff / (1000 * 3600 * 24));
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Vitrina de <span className="text-brand-red">Salidas</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de entregas y arqueo de caja</p>
                </div>
                <div className="relative w-80">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input type="text" placeholder="Buscar por orden o cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-xl text-sm font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all dark:text-white" />
                </div>
            </div>

            {/* AVISO DE ÚLTIMA ENTREGA */}
            {lastDeliveredId && (
                <div className="bg-emerald-500 text-white p-6 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 animate-bounce-in">
                    <div className="flex items-center gap-4">
                        <CheckCircleIcon className="w-10 h-10" />
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tighter">¡Entrega Registrada!</h3>
                            <p className="text-xs font-bold opacity-80 uppercase">El trabajo se ha movido al historial de entregados.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => navigate(`/nota-de-venta/${lastDeliveredId}`)} className="px-8 py-3 bg-white text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-950 hover:text-white transition-all">Imprimir Nota de Venta Premium</button>
                        <button onClick={() => setLastDeliveredId(null)} className="px-4 py-3 bg-white/20 rounded-xl hover:bg-white/30 transition-all"><CloseIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center"><Loader2Icon className="animate-spin w-10 h-10 text-brand-blue mx-auto" /></div>
                ) : filtered.length > 0 ? filtered.map(t => {
                    const c = clientes.find(cl => cl.id === t.clienteId);
                    const days = getDaysInVitrina(t.fechaEntrada); // Usamos fechaEntrada como proxy si no hay fecha de paso a vitrina
                    const isOld = days > 15;

                    return (
                        <div key={t.id} className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-xl border border-slate-100 dark:border-white/5 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between group relative">
                            {isOld && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg animate-pulse z-20">
                                    ¡Abandonado ({days} días)!
                                </div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); notifyClient(t); }} className="absolute top-6 right-6 p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-500 hover:text-white transition-all shadow-sm z-10" title="Avisar por WhatsApp">
                                <WhatsAppIcon className="w-5 h-5" />
                            </button>
                            <div>
                                <div className="flex justify-between mb-6">
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border">ORDEN #{t.orden}</span>
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                        <ClockIcon className="w-3 h-3"/> {days}d
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase truncate pr-8">{c?.nombre}</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase mt-1 leading-relaxed line-clamp-2">{t.subtipo}</p>
                                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase"><span>Total:</span> <span>{formatCurrency(t.total)}</span></div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-emerald-500 uppercase"><span>Abono:</span> <span>{formatCurrency(t.abono)}</span></div>
                                    <div className="h-px bg-slate-200 dark:bg-white/5 my-1"></div>
                                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Saldo:</span><span className="text-2xl font-black text-brand-red">{formatCurrency(t.saldo)}</span></div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTrabajo(t)} className="mt-8 w-full py-5 bg-brand-blue text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-slate-950 transition-all flex items-center justify-center gap-3 group-hover:scale-105">
                                Procesar Entrega <ArrowRightIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-32 bg-white dark:bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                        <BoxIcon className="w-20 h-20 text-slate-200 mb-6" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Vitrina Vacía</h3>
                        <p className="text-slate-300 text-xs font-bold uppercase mt-2">No hay trabajos listos para retiro en este momento.</p>
                    </div>
                )}
            </div>

            {selectedTrabajo && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={() => setSelectedTrabajo(null)}>
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-3xl w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                         <div className="bg-brand-red p-8 text-white flex justify-between items-center">
                            <div><h2 className="text-2xl font-black uppercase tracking-tighter italic">Confirmar Cobro</h2><p className="text-red-200 text-[10px] font-black mt-1">Orden #{selectedTrabajo.orden}</p></div>
                            <button onClick={() => setSelectedTrabajo(null)}><CloseIcon className="w-6 h-6"/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-3xl text-center border border-red-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">SALDO A CANCELAR HOY</span>
                                <span className="text-5xl font-black text-brand-red tracking-tighter">{formatCurrency(selectedTrabajo.saldo)}</span>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-2xl flex items-center gap-3 border border-amber-100">
                                <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 shrink-0"/><p className="text-[10px] font-bold text-amber-800 uppercase leading-tight">Al confirmar, el sistema registrará el pago completo y permitirá imprimir la Nota de Venta oficial.</p>
                            </div>
                            <button onClick={() => handleConfirmRetiro(selectedTrabajo.saldo)} className="w-full py-6 bg-brand-red text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-slate-950 transition-all flex items-center justify-center gap-3">
                                <DocumentCheckIcon className="w-6 h-6"/> REGISTRAR COBRO Y SALIDA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetirosPage;
