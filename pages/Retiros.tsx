
import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado, User } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { 
    SearchIcon, CloseIcon, DocumentCheckIcon, PrinterIcon, ArrowDownTrayIcon, 
    ShieldCheckIcon, WhatsAppIcon, Loader2Icon, ArrowRightIcon, BoxIcon, 
    ExclamationTriangleIcon, CordovaLogo, CheckCircleIcon, ClockIcon
} from '../components/Icons';

const RetirosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();
    const { trabajos, clientes, loading, registerRetiro } = useData();
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const filtered = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        // Optimización: Crear un mapa de búsqueda para acceso O(1)
        const clientMap = new Map(clientes.map(c => [c.id, c.nombre.toLowerCase()]));
        
        return trabajos
            .filter(t => t.estado === TrabajoEstado.VITRINA)
            .filter(t => {
                const clientName = clientMap.get(t.clienteId) || '';
                return searchTerm === '' || 
                       String(t.orden).includes(lower) || 
                       clientName.includes(lower);
            });
    }, [trabajos, clientes, searchTerm]);
        if (!selectedTrabajo || isProcessing) return;
        setIsProcessing(true);
        try {
            const updated = await registerRetiro(selectedTrabajo.id, pagoFinal, currentUser.nombre);
            // Automatización: Redirigir inmediatamente al comprobante PDF
            navigate(`/nota-de-venta/${updated.id}`);
        } catch (error) {
            console.error("Error al registrar retiro:", error);
            alert("Error al procesar el retiro. Intente de nuevo.");
            setIsProcessing(false);
        }
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
            <div className="flex flex-wrap justify-between items-end gap-4 p-6 lg:p-8 bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] lg:rounded-[3rem] shadow-luxury relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 font-inter italic">Despacho</p>
                    <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter leading-tight">Vitrina de <span className="text-gold-gradient italic">Salidas</span></h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Gestión de entregas y arqueo de caja</p>
                </div>
                <div className="relative z-10 w-full sm:w-80">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" placeholder="BUSCAR POR ORDEN O CLIENTE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white/5 border-2 border-white/5 focus:border-liquid-gold/30 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest placeholder:text-slate-600 outline-none focus:bg-white/10 transition-all duration-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center"><Loader2Icon className="animate-spin w-10 h-10 text-liquid-gold mx-auto" /></div>
                ) : filtered.length > 0 ? filtered.map(t => {
                    const c = clientes.find(cl => cl.id === t.clienteId);
                    const days = getDaysInVitrina(t.fechaEntrada); // Usamos fechaEntrada como proxy si no hay fecha de paso a vitrina
                    const isOld = days > 15;

                    return (
                        <div key={t.id} className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-luxury border border-white/5 hover:-translate-y-2 hover:border-liquid-gold/20 transition-all duration-500 flex flex-col justify-between group relative">
                            {isOld && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500/80 text-white text-[8px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg animate-pulse z-20">
                                    ¡Abandonado ({days} días)!
                                </div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); notifyClient(t); }} className="absolute top-6 right-6 p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 hover:border-emerald-500 shadow-sm z-10" title="Avisar por WhatsApp">
                                <WhatsAppIcon className="w-5 h-5" />
                            </button>
                            <div>
                                <div className="flex justify-between mb-6">
                                    <span className="text-[10px] font-black text-slate-500 bg-white/5 px-3 py-1 rounded-lg border border-white/5">ORDEN #{t.orden}</span>
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                        <ClockIcon className="w-3 h-3"/> {days}d
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-white uppercase truncate pr-8 tracking-tight leading-tight">{c?.nombre}</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase mt-1 leading-relaxed line-clamp-2">{t.subtipo}</p>
                                <div className="mt-8 p-6 bg-black/30 rounded-2xl flex flex-col gap-2 border border-white/5">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase"><span>Total:</span> <span className="text-white">{formatCurrency(t.total)}</span></div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-emerald-400 uppercase"><span>Abono:</span> <span>{formatCurrency(t.abono)}</span></div>
                                    <div className="h-px bg-white/5 my-1"></div>
                                    <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-500 uppercase">Saldo:</span><span className="text-2xl font-black text-red-400">{formatCurrency(t.saldo)}</span></div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTrabajo(t)} className="mt-8 w-full py-5 bg-liquid-gold text-brand-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-gold-glow hover:bg-white transition-all duration-500 flex items-center justify-center gap-3 group-hover:scale-[1.02]">
                                Procesar Entrega <ArrowRightIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-32 bg-white/5 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-white/5 text-center flex flex-col items-center">
                        <BoxIcon className="w-20 h-20 text-slate-700 mb-6" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Vitrina Vacía</h3>
                        <p className="text-slate-600 text-xs font-bold uppercase mt-2">No hay trabajos listos para retiro en este momento.</p>
                    </div>
                )}
            </div>

            {selectedTrabajo && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex justify-center items-center p-4 animate-fade-in" onClick={() => setSelectedTrabajo(null)}>
                    <div className="bg-brand-dark/95 backdrop-blur-xl rounded-[2.5rem] shadow-luxury w-full max-w-lg overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                         <div className="bg-red-500/10 p-8 flex justify-between items-center border-b border-red-500/20">
                            <div><h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Confirmar Cobro</h2><p className="text-red-400 text-[10px] font-black mt-1 uppercase tracking-[0.2em]">Orden #{selectedTrabajo.orden}</p></div>
                            <button onClick={() => setSelectedTrabajo(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><CloseIcon className="w-5 h-5 text-slate-400"/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="p-6 bg-red-500/10 rounded-2xl text-center border border-red-500/20">
                                <span className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-[0.2em]">SALDO A CANCELAR HOY</span>
                                <span className="text-5xl font-black text-red-400 tracking-tighter">{formatCurrency(selectedTrabajo.saldo)}</span>
                            </div>
                            <div className="bg-liquid-gold/10 p-4 rounded-2xl flex items-center gap-3 border border-liquid-gold/20">
                                <ExclamationTriangleIcon className="w-5 h-5 text-liquid-gold shrink-0"/><p className="text-[10px] font-bold text-liquid-gold/80 uppercase leading-tight">Al confirmar, el sistema generará automáticamente la Nota de Venta PDF.</p>
                            </div>
                            <button onClick={() => handleConfirmRetiro(selectedTrabajo.saldo)} className="w-full py-6 bg-liquid-gold text-brand-dark font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-gold-glow hover:bg-white transition-all duration-500 flex items-center justify-center gap-3">
                                <DocumentCheckIcon className="w-6 h-6"/> REGISTRAR Y GENERAR PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RetirosPage;
