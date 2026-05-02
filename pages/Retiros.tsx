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
    TrophyIcon, HomeIcon
} from '../components/Icons';
import { BottomSheet } from '../components/BottomSheet';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCapture from '../components/orders/PhotoCapture';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

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
        const lower = searchTerm.toLowerCase();
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

    const totals = useMemo(() => {
        const jobs = filtered;
        return {
            count: jobs.length,
            totalSaldo: jobs.reduce((acc, t) => acc + (t.saldo || 0), 0)
        };
    }, [filtered]);

    return (
        <div className="space-y-12 animate-fade-in pb-20 pt-6">
            {/* --- CABECERA ELITE --- */}
            <div className="flex flex-col gap-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="flex items-center gap-10">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl transition-all group shadow-sm"
                        >
                            <HomeIcon className="w-6 h-6 text-slate-400 group-hover:text-brand-blue transition-colors" />
                        </button>
                        <div className="w-[1px] h-24 bg-gradient-to-b from-transparent via-brand-blue/40 to-transparent hidden md:block"></div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-5">
                                <div className="h-[2px] w-12 bg-brand-blue rounded-full shadow-blue-glow"></div>
                                <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.5em]">CENTRO DE DESPACHO ESTRATÉGICO</p>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                VITRINA <span className="text-blue-gradient">SISTEMA</span>
                            </h1>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-6 shadow-luxury min-w-[200px]">
                            <div className="p-3 bg-brand-blue/10 rounded-2xl">
                                <BoxIcon className="w-6 h-6 text-brand-blue" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">En Vitrina</p>
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">{totals.count}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex items-center gap-6 shadow-luxury min-w-[240px]">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <CreditCardIcon className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo Pendiente</p>
                                <p className="text-2xl font-black text-emerald-500 tracking-tighter">{formatCurrency(totals.totalSaldo)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative group max-w-2xl">
                    <div className="absolute inset-0 bg-brand-blue/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-blue/60 group-focus-within:text-brand-blue transition-colors" />
                    <input 
                        type="text" 
                        placeholder="IDENTIFICAR MANIFIESTO O CLIENTE..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-16 pr-8 py-7 bg-white border border-slate-200 focus:border-brand-blue/40 rounded-[2.5rem] text-[13px] font-black text-slate-900 uppercase tracking-[0.2em] placeholder:text-slate-300 outline-none focus:bg-slate-50 transition-all duration-700 shadow-sm group-hover:border-slate-300"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex gap-2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                        <div className="w-1 h-4 bg-brand-blue/40 animate-pulse" />
                        <div className="w-1 h-4 bg-brand-blue/20 animate-pulse delay-75" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center"><Loader2Icon className="animate-spin w-10 h-10 text-brand-blue mx-auto" /></div>
                ) : filtered.length > 0 ? filtered.map(t => {
                    const c = clientes.find(cl => cl.id === t.clienteId);
                    const days = getDaysInVitrina(t.fechaEntrada);
                    const isOld = days > 15;

                    return (
                            <div className="bg-white rounded-[3rem] p-10 shadow-luxury border border-slate-100 hover:border-brand-blue/30 transition-all duration-700 flex flex-col justify-between group relative overflow-hidden">
                                <div className="absolute inset-0 bg-architect-grid opacity-[0.03] pointer-events-none" />
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-1000 rotate-12">
                                    <BoxIcon className="w-32 h-32 text-slate-900" />
                                </div>

                            {isOld && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[9px] font-black px-6 py-1.5 rounded-full uppercase tracking-[0.3em] shadow-2xl animate-pulse z-20">
                                    ESTADO: CRÍTICO ({days}d)
                                </div>
                            )}

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Manifest_#{t.orden}</span>
                                        <div className="h-[2px] w-8 bg-brand-blue/40" />
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); notifyClient(t); }} 
                                        className="p-4 bg-emerald-500/10 text-emerald-400 rounded-[1.5rem] hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 hover:border-emerald-500 shadow-lg"
                                    >
                                        <WhatsAppIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none group-hover:text-brand-blue transition-colors duration-500">{c?.nombre}</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest line-clamp-1">{t.subtipo}</p>
                                    </div>
                                </div>

                                <div className="mt-10 p-8 bg-slate-50 rounded-[2rem] space-y-4 border border-slate-100 relative overflow-hidden group-hover:border-brand-blue/10 transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent pointer-events-none" />
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total_Asset</span>
                                        <span className="text-sm font-black text-slate-900">{formatCurrency(t.total)}</span>
                                    </div>
                                    <div className="flex justify-between items-center relative z-10">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abono_In</span>
                                        <span className="text-sm font-black text-emerald-600">{formatCurrency(t.abono)}</span>
                                    </div>
                                    <div className="h-px bg-slate-200/50" />
                                    <div className="flex justify-between items-end relative z-10">
                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Saldo_Pending</span>
                                        <span className="text-4xl font-black text-rose-500 tracking-tighter leading-none drop-shadow-sm">{formatCurrency(t.saldo)}</span>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedTrabajo(t)} 
                                className="mt-10 w-full py-6 bg-brand-blue hover:bg-brand-blue/90 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-[1.5rem] transition-all duration-700 flex items-center justify-center gap-4 shadow-blue-glow-sm"
                            >
                                EJECUTAR DESPACHO <ArrowRightIcon className="w-5 h-5"/>
                            </button>
                        </motion.div>
                    );
                }) : (
                    <div className="col-span-full py-32 bg-white/5 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-white/5 text-center flex flex-col items-center">
                        <BoxIcon className="w-20 h-20 text-slate-700 mb-6" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">Vitrina Vacía</h3>
                        <p className="text-slate-600 text-xs font-bold uppercase mt-2">No hay trabajos listos para retiro en este momento.</p>
                    </div>
                )}
            </div>

            <BottomSheet 
                isOpen={!!selectedTrabajo} 
                onClose={() => setSelectedTrabajo(null)}
                title="Confirmar Cobro"
            >
                {selectedTrabajo && (
                    <div className="space-y-6">
                        <div className="p-8 bg-rose-500/10 rounded-3xl text-center border border-rose-500/20 shadow-inner">
                            <span className="text-[10px] font-black text-slate-500 uppercase block mb-2 tracking-[0.2em]">SALDO A CANCELAR HOY</span>
                            <span className="text-6xl font-black text-rose-500 tracking-tighter drop-shadow-sm">{formatCurrency(selectedTrabajo.saldo)}</span>
                        </div>
                        
                        <div className="bg-brand-blue/10 p-6 rounded-2xl flex items-center gap-4 border border-brand-blue/20">
                            <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center shrink-0">
                                <CheckCircleIcon className="w-6 h-6 text-brand-blue"/>
                            </div>
                            <p className="text-[11px] font-bold text-brand-blue/90 uppercase leading-relaxed">
                                Al confirmar, el sistema registrará el pago y generará la Nota de Venta PDF automáticamente.
                            </p>
                        </div>

                        {/* Sección de Respaldo Visual */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Respaldo Visual (Opcional)</h4>
                                <button 
                                    onClick={() => setShowCamera(!showCamera)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${showCamera ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                >
                                    <CameraIcon className="w-3 h-3" />
                                    <span className="text-[9px] font-black uppercase tracking-wider">{showCamera ? 'CERRAR' : 'TOMAR FOTO'}</span>
                                </button>
                            </div>
                            
                            <AnimatePresence>
                                {showCamera && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="aspect-square max-h-[300px] w-full bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden">
                                            <PhotoCapture onImageCaptured={(file) => setRetiroPhoto(file)} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button 
                            onClick={() => handleConfirmRetiro(selectedTrabajo.saldo)} 
                            disabled={isProcessing}
                            className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-blue-glow flex items-center justify-center gap-3 transition-all duration-500 ${isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:scale-[1.02]'}`}
                        >
                            {isProcessing ? (
                                <><Loader2Icon className="animate-spin w-5 h-5" /> PROCESANDO...</>
                            ) : (
                                <><CheckCircleIcon className="w-5 h-5"/> COMPLETAR TRANSACCIÓN</>
                            )}
                        </button>
                        
                        <div className="text-center">
                            <button onClick={() => setSelectedTrabajo(null)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                Cancelar y Volver
                            </button>
                        </div>
                    </div>
                )}
            </BottomSheet>

            {/* Desktop Modal Optimization */}
            <AnimatePresence>
                {selectedTrabajo && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] hidden lg:flex justify-center items-center p-4" 
                        onClick={() => setSelectedTrabajo(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] shadow-luxury w-full max-w-xl overflow-hidden border border-slate-200" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="bg-slate-50 p-10 flex justify-between items-center border-b border-slate-200">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Confirmar Despacho</h2>
                                    <p className="text-brand-blue text-[11px] font-black mt-2 uppercase tracking-[0.3em]">Manifest_#{selectedTrabajo.orden}</p>
                                </div>
                                <button onClick={() => setSelectedTrabajo(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors">
                                    <XMarkIcon className="w-6 h-6 text-slate-400"/>
                                </button>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="p-10 bg-slate-50 rounded-[2.5rem] text-center border border-slate-100 shadow-inner">
                                    <span className="text-[11px] font-black text-slate-400 uppercase block mb-4 tracking-[0.4em]">SALDO_LIQUIDATION_VALUE</span>
                                    <span className="text-7xl font-black text-rose-500 tracking-tighter leading-none drop-shadow-sm">{formatCurrency(selectedTrabajo.saldo)}</span>
                                </div>
                                
                                <div className="bg-brand-blue/5 p-6 rounded-2xl flex items-center gap-5 border border-brand-blue/10">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-brand-blue shrink-0"/>
                                    <p className="text-[11px] font-bold text-slate-600 uppercase leading-relaxed tracking-wider">
                                        PROTOCOL: La confirmación generará un registro inmutable en el libro contable y emitirá el comprobante fiscal maestro.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Visual_Backup_Capture</h4>
                                        <button 
                                            onClick={() => setShowCamera(!showCamera)}
                                            className={`flex items-center gap-3 px-5 py-2 rounded-xl border transition-all ${showCamera ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                        >
                                            <CameraIcon className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{showCamera ? 'TERMINATE_CAPTURE' : 'ACTIVATE_CAMERA'}</span>
                                        </button>
                                    </div>
                                    
                                    <AnimatePresence>
                                        {showCamera && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="aspect-video w-full bg-slate-100 rounded-3xl border border-slate-200 overflow-hidden shadow-inner">
                                                    <PhotoCapture onImageCaptured={(file) => setRetiroPhoto(file)} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <button 
                                    onClick={() => handleConfirmRetiro(selectedTrabajo.saldo)} 
                                    disabled={isProcessing}
                                    className={`w-full py-7 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-blue-glow flex items-center justify-center gap-4 transition-all duration-700 ${isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-blue text-white hover:scale-[1.02]'}`}
                                >
                                    {isProcessing ? (
                                        <><Loader2Icon className="animate-spin w-6 h-6" /> EXECUTING_PROTOCOL...</>
                                    ) : (
                                        <><CheckCircleIcon className="w-6 h-6"/> CONFIRMAR LIQUIDACIÓN</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- OVERLAY DE ÉXITO ELITE --- */}
            <AnimatePresence>
                {isSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-white/98 backdrop-blur-3xl"
                    >
                        <Confetti width={width} height={height} recycle={false} numberOfPieces={800} colors={['#3B82F6', '#1E293B', '#10B981', '#64748B']} />
                        
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0, y: 100 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                            className="text-center space-y-12 max-w-2xl px-6"
                        >
                            <div className="relative">
                                <motion.div 
                                    animate={{ 
                                        scale: [1, 1.1, 1],
                                        boxShadow: [
                                            "0 0 40px rgba(59,130,246,0.1)",
                                            "0 0 100px rgba(59,130,246,0.3)",
                                            "0 0 40px rgba(59,130,246,0.1)"
                                        ]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="w-48 h-48 bg-brand-blue rounded-[3rem] mx-auto flex items-center justify-center shadow-blue-glow relative z-10"
                                >
                                    <TrophyIcon className="w-24 h-24 text-white" />
                                </motion.div>
                                <div className="absolute inset-0 bg-brand-blue/10 blur-[80px] -z-10 rounded-full" />
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                                    MISSION <span className="text-blue-gradient">COMPLETED</span>
                                </h2>
                                <div className="flex flex-col items-center gap-4">
                                    <p className="text-slate-400 font-black uppercase tracking-[0.6em] text-xs">
                                        Operational Flow Successfully Synchronized
                                    </p>
                                    <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-brand-blue/50 to-transparent" />
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-8">
                                <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 px-10 py-4 rounded-2xl shadow-emerald-500/5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                    <span className="text-emerald-400 font-black text-[11px] uppercase tracking-[0.3em]">Vault Records Updated_</span>
                                </div>
                                
                                <div className="flex flex-wrap justify-center gap-6">
                                    <button 
                                        onClick={() => {
                                            setIsSuccess(false);
                                            setSelectedTrabajo(null);
                                        }}
                                        className="px-12 py-6 bg-white border border-slate-200 hover:border-brand-blue/40 rounded-[2rem] text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] transition-all hover:scale-105 shadow-sm"
                                    >
                                        NEXT_DISPATCH
                                    </button>
                                    <button 
                                        onClick={() => navigate('/dashboard')}
                                        className="px-12 py-6 bg-brand-blue text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-blue-glow hover:scale-105 transition-all"
                                    >
                                        COMMAND_CENTER
                                    </button>
                                </div>

                                <motion.button 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.5 }}
                                    onClick={() => navigate(`/nota-de-venta/${selectedTrabajo?.id}`)}
                                    className="flex items-center gap-3 text-slate-400 hover:text-brand-blue font-mono text-[10px] uppercase tracking-[0.5em] transition-all duration-500 group"
                                >
                                    <PrinterIcon className="w-4 h-4 group-hover:text-brand-blue transition-colors" /> 
                                    [GENERATE_MASTER_RECORD]
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RetirosPage;
