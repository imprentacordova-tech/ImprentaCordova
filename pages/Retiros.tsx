import React, { useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado, User } from '../types';
import { formatCurrency, generateWhatsAppLink } from '../utils';
import { 
    SearchIcon, CloseIcon, DocumentCheckIcon, PrinterIcon, ArrowDownTrayIcon, 
    ShieldCheckIcon, WhatsAppIcon, Loader2Icon, ArrowRightIcon, BoxIcon, 
    ExclamationTriangleIcon, CordovaLogo, CheckCircleIcon, ClockIcon,
    CameraIcon, SparklesIcon, PhotoIcon, XMarkIcon, CreditCardIcon,
    HomeIcon, CheckBadgeIcon
} from '../components/Icons';
import { BottomSheet } from '../components/BottomSheet';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCapture from '../components/orders/PhotoCapture';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { SEO } from '../components/SEO';

const RetirosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const navigate = useNavigate();
    const { trabajos, clientes, loading, registerRetiro, uploadFile } = useData();
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [retiroPhoto, setRetiroPhoto] = useState<File | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const { width, height } = useWindowSize();

    const filtered = useMemo(() => {
        const lower = searchTerm.toLowerCase().trim();
        const clientMap = new Map(clientes.map(c => [c.id, c.nombre.toLowerCase()]));
        
        return trabajos
            .filter(t => t.estado === TrabajoEstado.VITRINA)
            .filter(t => {
                const clientName = clientMap.get(t.clienteId) || '';
                return lower === '' || 
                       String(t.orden).includes(lower) || 
                       clientName.includes(lower) ||
                       (t.subtipo || '').toLowerCase().includes(lower);
            });
    }, [trabajos, clientes, searchTerm]);

    const handleConfirmRetiro = async (pagoFinal: number) => {
        if (!selectedTrabajo || isProcessing) return;
        setIsProcessing(true);
        try {
            let photoUrl = '';
            if (retiroPhoto) {
                photoUrl = await uploadFile(retiroPhoto, 'trabajos', `${selectedTrabajo.id}/retiro_${Date.now()}`);
            }

            await registerRetiro(selectedTrabajo.id, pagoFinal, currentUser.nombre, photoUrl);
            
            setIsSuccess(true);
            setIsProcessing(false);
        } catch (error) {
            console.error("Error al registrar despacho:", error);
            alert("Error al procesar el despacho. Intente de nuevo.");
            setIsProcessing(false);
        }
    };

    const notifyClient = (trabajo: Trabajo) => {
        const cliente = clientes.find(c => c.id === trabajo.clienteId);
        if (!cliente || !cliente.telefono || !cliente.telefono.length) {
            alert("El cliente no tiene teléfono registrado.");
            return;
        }
        
        const saldoMsg = trabajo.saldo > 0 ? `Saldo pendiente: ${formatCurrency(trabajo.saldo)}.` : "Su pedido se encuentra pagado.";
        const message = `👋 Hola ${cliente.nombre}, Imprenta Córdova le informa que su pedido #${trabajo.orden} (${trabajo.subtipo || trabajo.tipo}) está listo para ser retirado en nuestra imprenta. 📍 ${saldoMsg}`;
        
        window.open(generateWhatsAppLink(cliente.telefono[0], message), '_blank');
    };

    const getDaysInVitrina = (dateString: string) => {
        const diff = new Date().getTime() - new Date(dateString).getTime();
        return Math.floor(diff / (1000 * 3600 * 24));
    };

    const totals = useMemo(() => {
        const jobs = filtered;
        return {
            count: jobs.length,
            totalSaldo: jobs.reduce((acc, t) => acc + (t.saldo || 0), 0)
        };
    }, [filtered]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 space-y-6 max-w-[1440px] mx-auto">
            <SEO title="Despacho y Entregas · Imprenta Córdova" />

            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            Control de Entregas ({totals.count} listos)
                        </span>
                    </div>
                    <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase mt-0.5">
                        Despacho y Vitrina
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-obsidian-card border border-white/[0.06] rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
                        <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-lg">
                            <BoxIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Por Entregar</span>
                            <span className="text-base font-black text-white">{totals.count} pedidos</span>
                        </div>
                    </div>

                    <div className="bg-obsidian-card border border-white/[0.06] rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                            <CreditCardIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Saldo por Cobrar</span>
                            <span className="text-base font-black text-emerald-600">{formatCurrency(totals.totalSaldo)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BARRA DE BÚSQUEDA ───────────────────────────────────────── */}
            <div className="relative max-w-xl">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                    type="text" 
                    placeholder="Buscar por cliente, N° de orden o producto..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-full bg-obsidian-card border border-white/[0.06] rounded-xl pl-11 pr-4 py-3 text-[12px] font-bold text-white outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all placeholder:text-slate-400 shadow-sm"
                />
            </div>

            {/* ── GRID DE TARJETAS DE DESPACHO ────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full py-16 text-center space-y-3">
                        <Loader2Icon className="animate-spin w-8 h-8 text-brand-blue mx-auto" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cargando productos en vitrina...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    filtered.map(t => {
                        const clienteObj = clientes.find(cl => cl.id === t.clienteId);
                        const days = getDaysInVitrina(t.fechaEntrada);
                        const isOld = days > 10;
                        const hasBalance = t.saldo > 0;

                        return (
                            <div 
                                key={t.id}
                                className="bg-obsidian-card rounded-2xl p-5 border border-white/[0.06] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                            >
                                {isOld && (
                                    <div className="absolute top-3 right-3 bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase">
                                        En vitrina hace {days}d
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-sm font-black text-white bg-white/[0.04] px-2 py-0.5 rounded">
                                            #{String(t.orden).padStart(4, '0')}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                            t.esSRI ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' : 'bg-white/[0.04] text-slate-300 border-white/[0.06]'
                                        }`}>
                                            {t.tipo}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-black text-white uppercase leading-snug">
                                            {clienteObj ? clienteObj.nombre : t.titular}
                                        </h3>
                                        <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                                            {t.subtipo || t.detalle || 'Trabajo listo para entrega'}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/[0.04] rounded-xl border border-white/[0.06] space-y-2">
                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="font-bold text-slate-500">Monto Total:</span>
                                        <span className="font-black text-white">{formatCurrency(t.total)}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-[11px]">
                                        <span className="font-bold text-slate-500">Abono Ingresado:</span>
                                        <span className="font-black text-emerald-600">{formatCurrency(t.abono)}</span>
                                    </div>

                                    <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center">
                                        <span className="text-[11px] font-black text-slate-200 uppercase">Saldo Pendiente:</span>
                                        <span className={`text-lg font-black ${hasBalance ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {formatCurrency(t.saldo)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => notifyClient(t)}
                                        className="p-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-500/20 transition-colors"
                                        title="Avisar al cliente por WhatsApp"
                                    >
                                        <WhatsAppIcon className="w-5 h-5" />
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setSelectedTrabajo(t)} 
                                        className="flex-1 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-blue-glow-sm flex items-center justify-center gap-2"
                                    >
                                        Entregar y Cobrar <ArrowRightIcon className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 bg-obsidian-card rounded-2xl border border-white/[0.06] text-center space-y-3">
                        <BoxIcon className="w-12 h-12 text-slate-300 mx-auto" />
                        <h3 className="text-sm font-black text-slate-200 uppercase">Vitrina de Entregas Vacía</h3>
                        <p className="text-[11px] text-slate-400">No hay órdenes pendientes de retiro en este momento.</p>
                    </div>
                )}
            </div>

            {/* ── MODAL BOTTOMSHEET CONFIRMACIÓN DE ENTREGA ──────────────── */}
            <BottomSheet 
                isOpen={!!selectedTrabajo} 
                onClose={() => setSelectedTrabajo(null)}
                title="Confirmar Entrega y Cobro de Trabajo"
            >
                {selectedTrabajo && (
                    <div className="space-y-6">
                        <div className="p-6 bg-brand-red/10 rounded-2xl text-center border border-brand-red/20 space-y-1">
                            <span className="text-[10px] font-black text-brand-red uppercase tracking-widest block">Saldo Pendiente a Cobrar Hoy</span>
                            <span className="text-4xl font-black text-brand-red tracking-tight">{formatCurrency(selectedTrabajo.saldo)}</span>
                        </div>
                        
                        <div className="bg-brand-blue/5 p-4 rounded-xl flex items-center gap-3 border border-brand-blue/20">
                            <CheckCircleIcon className="w-5 h-5 text-brand-blue shrink-0"/>
                            <p className="text-[11px] font-bold text-slate-200">
                                Al confirmar, la orden pasará a estado <strong>ENTREGADO</strong> y se generará el recibo o comprobante final.
                            </p>
                        </div>

                        {/* Captura de Foto Opcional */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Foto o Respaldo de Entrega (Opcional)</label>
                                <button 
                                    type="button"
                                    onClick={() => setShowCamera(!showCamera)}
                                    className="flex items-center gap-1 px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg text-[10px] font-bold text-slate-200 transition-colors"
                                >
                                    <CameraIcon className="w-3.5 h-3.5" />
                                    <span>{showCamera ? 'Cerrar Cámara' : 'Tomar Foto'}</span>
                                </button>
                            </div>
                            
                            {showCamera && (
                                <div className="aspect-video w-full bg-white/[0.04] rounded-2xl border border-white/[0.06] overflow-hidden">
                                    <PhotoCapture onImageCaptured={(file) => setRetiroPhoto(file)} />
                                </div>
                            )}
                        </div>

                        <button 
                            type="button"
                            onClick={() => handleConfirmRetiro(selectedTrabajo.saldo)} 
                            disabled={isProcessing}
                            className="w-full py-4 bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 text-white rounded-xl text-[12px] font-black uppercase tracking-wider shadow-blue-glow-sm transition-all flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2Icon className="animate-spin w-4 h-4" /> Procesando Entrega...
                                </>
                            ) : (
                                <>
                                    <CheckCircleIcon className="w-4 h-4"/> Confirmar Entrega y Registrar Pago
                                </>
                            )}
                        </button>
                        
                        <div className="text-center">
                            <button 
                                type="button" 
                                onClick={() => setSelectedTrabajo(null)} 
                                className="text-[11px] font-bold text-slate-400 hover:text-white uppercase"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </BottomSheet>

            {/* Confetti al completar retiro */}
            {isSuccess && (
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={300}
                    onConfettiComplete={() => setIsSuccess(false)}
                />
            )}
        </div>
    );
};

export default RetirosPage;
