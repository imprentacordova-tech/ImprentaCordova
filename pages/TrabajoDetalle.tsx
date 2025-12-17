
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useOutletContext } from 'react-router-dom';
import { getTrabajos, getClientes, updateTrabajoStatus, updateTrabajoDiseno, updateTrabajoPhoto, registerRetiro } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, User } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { 
    ArrowLeftIcon, PrinterIcon, CheckCircleIcon, ClockIcon, 
    DollarIcon, PhoneIcon, UserPlusIcon, DocumentIcon, 
    PhotoIcon, MapPinIcon, WhatsAppIcon, 
    TrashIcon, UploadIcon, PaletteIcon, WrenchScrewdriverIcon, 
    BoxIcon, ShieldCheckIcon, CalendarDaysIcon, Loader2Icon 
} from '../components/Icons';
import { useToast } from '../contexts/ToastContext';

// --- COMPONENTS ---

const StatusStepper: React.FC<{ currentStatus: TrabajoEstado }> = ({ currentStatus }) => {
    const steps = [
        { id: TrabajoEstado.PENDIENTE, label: 'Pendiente', icon: ClockIcon },
        { id: TrabajoEstado.EN_DISENO, label: 'Diseño', icon: PaletteIcon },
        { id: TrabajoEstado.PROCESO, label: 'Producción', icon: WrenchScrewdriverIcon },
        { id: TrabajoEstado.VITRINA, label: 'Vitrina', icon: BoxIcon },
        { id: TrabajoEstado.ENTREGADO, label: 'Entregado', icon: CheckCircleIcon },
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStatus);

    return (
        <div className="w-full py-4">
            <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full -z-0"></div>
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-blue rounded-full -z-0 transition-all duration-500"
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    
                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center group">
                            <div 
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300
                                    ${isCompleted 
                                        ? 'bg-brand-blue border-brand-blue text-white shadow-lg' 
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'}
                                    ${isCurrent ? 'ring-4 ring-blue-100 dark:ring-blue-900/30 scale-110' : ''}
                                `}
                            >
                                <step.icon className="w-4 h-4" />
                            </div>
                            <span className={`
                                absolute top-12 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors
                                ${isCompleted ? 'text-brand-blue' : 'text-gray-400'}
                            `}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PaymentModal: React.FC<{ 
    saldo: number; 
    onClose: () => void; 
    onConfirm: (amount: number) => void; 
}> = ({ saldo, onClose, onConfirm }) => {
    const [amount, setAmount] = useState(saldo);

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Registrar Abono</h3>
                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Monto a pagar ($)</label>
                    <input 
                        type="number" 
                        value={amount} 
                        onChange={e => setAmount(parseFloat(e.target.value))}
                        className="w-full text-3xl font-black text-brand-blue border-b-2 border-brand-blue bg-transparent outline-none py-2"
                        autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-2">Saldo pendiente actual: {formatCurrency(saldo)}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={() => onConfirm(amount)} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

const TrabajoDetallePage: React.FC = () => {
    const { trabajoId } = useParams<{ trabajoId: string }>();
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!trabajoId) return;
            setLoading(true);
            try {
                const [allTrabajos, allClientes] = await Promise.all([getTrabajos(), getClientes()]);
                const foundTrabajo = allTrabajos.find(t => t.id === trabajoId);
                
                if (foundTrabajo) {
                    setTrabajo(foundTrabajo);
                    const foundCliente = allClientes.find(c => c.id === foundTrabajo.clienteId);
                    setCliente(foundCliente || null);
                }
            } catch (error) {
                console.error("Error loading details:", error);
                addToast("Error cargando detalles del trabajo", "error");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [trabajoId]);

    const handleStatusUpdate = async (newStatus: TrabajoEstado) => {
        if (!trabajo) return;
        
        // Optimistic Update
        const updated = { ...trabajo, estado: newStatus, actualizadoPor: currentUser.nombre };
        setTrabajo(updated);
        
        try {
            await updateTrabajoStatus(trabajo.id, newStatus, currentUser.nombre);
            addToast(`Estado actualizado a: ${newStatus}`, "success");
        } catch (e) {
            addToast("Error al actualizar estado", "error");
        }
    };

    const handleAddPayment = async (amount: number) => {
        if (!trabajo) return;
        if (amount <= 0 || amount > trabajo.saldo) {
            addToast("Monto inválido", "error");
            return;
        }

        const newAbono = trabajo.abono + amount;
        const newSaldo = trabajo.saldo - amount;
        
        const updated = { ...trabajo, abono: newAbono, saldo: newSaldo };
        if (newSaldo === 0 && trabajo.estado === TrabajoEstado.VITRINA) {
            updated.estado = TrabajoEstado.ENTREGADO;
        }

        setTrabajo(updated);
        setShowPaymentModal(false);
        addToast(`Abono de ${formatCurrency(amount)} registrado`, "success");
    };

    const getWhatsAppLink = () => {
        if (!cliente || !trabajo) return '#';
        const phone = cliente.telefono[0]?.replace(/\D/g, '') || '';
        const link = `https://wa.me/593${phone.substring(1)}?text=Hola ${cliente.nombre}, le saludamos de Imprenta Córdova. Su pedido #${trabajo.orden} (${trabajo.subtipo}) se encuentra actualmente en estado: *${trabajo.estado}*. Saldo pendiente: ${formatCurrency(trabajo.saldo)}.`;
        return link;
    };

    if (loading) return <div className="p-12 text-center text-gray-500"><Loader2Icon className="w-8 h-8 animate-spin mx-auto mb-2"/>Cargando orden...</div>;
    if (!trabajo || !cliente) return <div className="p-12 text-center text-red-500">Orden no encontrada</div>;

    const saldoPendiente = trabajo.saldo > 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-fade-in">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        Orden #{String(trabajo.orden).padStart(4, '0')}
                        {trabajo.prioridad === 'Urgente' && <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full uppercase tracking-wide border border-red-200">Urgente</span>}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Creado el {formatDate(trabajo.fechaEntrada)} por {trabajo.creadoPor}</p>
                </div>
            </div>

            {/* Visual Status Stepper */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <StatusStepper currentStatus={trabajo.estado} />
                
                {/* Workflow Controls */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    {trabajo.estado === TrabajoEstado.PENDIENTE && (
                        <button onClick={() => handleStatusUpdate(TrabajoEstado.EN_DISENO)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-colors">
                            Iniciar Diseño
                        </button>
                    )}
                    {trabajo.estado === TrabajoEstado.EN_DISENO && (
                        <button onClick={() => handleStatusUpdate(TrabajoEstado.PROCESO)} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-colors">
                            Pasar a Producción
                        </button>
                    )}
                    {trabajo.estado === TrabajoEstado.PROCESO && (
                        <button onClick={() => handleStatusUpdate(TrabajoEstado.VITRINA)} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg shadow hover:bg-purple-700 transition-colors">
                            Terminar (A Vitrina)
                        </button>
                    )}
                    {trabajo.estado === TrabajoEstado.VITRINA && !saldoPendiente && (
                        <button onClick={() => handleStatusUpdate(TrabajoEstado.ENTREGADO)} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow hover:bg-green-700 transition-colors">
                            Marcar Entregado
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- COL 1: CONTEXTO CLIENTE & FINANZAS --- */}
                <div className="space-y-6">
                    {/* Cliente Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <UserPlusIcon className="w-4 h-4"/> Cliente
                        </h3>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                                {cliente.nombre.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white leading-tight">{cliente.nombre}</p>
                                <p className="text-xs text-gray-500 font-mono mt-1">{cliente.ruc || cliente.cedula}</p>
                            </div>
                        </div>
                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <PhoneIcon className="w-4 h-4 text-brand-blue" />
                                <span>{cliente.telefono.join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <MapPinIcon className="w-4 h-4 text-brand-blue" />
                                <span className="truncate">{cliente.direccion || 'Sin dirección'}</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                            <a 
                                href={getWhatsAppLink()} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex-1 py-2 bg-green-100 text-green-700 font-bold rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                            </a>
                        </div>
                    </div>

                    {/* Finance Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 ${saldoPendiente ? 'bg-red-100' : 'bg-green-100'} opacity-50`}></div>
                        
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                            <DollarIcon className="w-4 h-4"/> Finanzas
                        </h3>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-end">
                                <span className="text-sm text-gray-500">Total</span>
                                <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(trabajo.total)}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-sm text-gray-500">Abonado</span>
                                <span className="text-xl font-bold text-green-600">{formatCurrency(trabajo.abono)}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-end">
                                <span className="text-sm font-black text-gray-400 uppercase">Saldo</span>
                                <span className={`text-3xl font-black ${saldoPendiente ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(trabajo.saldo)}
                                </span>
                            </div>
                        </div>

                        {saldoPendiente && (
                            <button 
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full mt-6 py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 relative z-10"
                            >
                                <DollarIcon className="w-5 h-5"/> Registrar Pago
                            </button>
                        )}
                    </div>
                </div>

                {/* --- COL 2: DETALLES DE PRODUCCIÓN --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{trabajo.subtipo}</h3>
                                <p className="text-sm text-gray-500">Detalles de producción</p>
                            </div>
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-lg text-sm font-bold">
                                {trabajo.tipo === 'sri' ? 'Documento SRI' : 'Trabajo General'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Cantidad</p>
                                <p className="font-bold text-lg text-gray-800 dark:text-white">{trabajo.cantidad}</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Tamaño</p>
                                <p className="font-bold text-lg text-gray-800 dark:text-white">{trabajo.tamano || 'N/A'}</p>
                            </div>
                            {/* Placeholder specs if they existed in the model */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Material</p>
                                <p className="font-bold text-lg text-gray-800 dark:text-white">Estándar</p>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Entrega</p>
                                <p className="font-bold text-lg text-gray-800 dark:text-white">{trabajo.fechaEntrega ? new Date(trabajo.fechaEntrega).toLocaleDateString() : 'Por definir'}</p>
                            </div>
                        </div>

                        {/* Files Area */}
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                                <PhotoIcon className="w-4 h-4"/> Archivos & Artes
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {trabajo.fotoOriginalUrl ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 h-48 flex items-center justify-center">
                                        <img src={trabajo.fotoOriginalUrl} alt="Referencia" className="max-w-full max-h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <a href={trabajo.fotoOriginalUrl} target="_blank" rel="noreferrer" className="text-white font-bold underline">Ver Original</a>
                                        </div>
                                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">REFERENCIA</span>
                                    </div>
                                ) : (
                                    <div className="h-48 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400">
                                        <UploadIcon className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm">Sin referencia</p>
                                    </div>
                                )}

                                {trabajo.diseno?.archivoUrl ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-brand-blue bg-blue-50 h-48 flex items-center justify-center">
                                        <img src={trabajo.diseno.archivoUrl} alt="Arte Final" className="max-w-full max-h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Link to="/diseno" className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold">Editar en Diseño</Link>
                                        </div>
                                        <span className="absolute top-2 left-2 bg-brand-blue text-white text-[10px] px-2 py-1 rounded">ARTE FINAL</span>
                                    </div>
                                ) : (
                                    <Link to="/diseno" className="h-48 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center justify-center text-blue-500 hover:bg-blue-100 transition-colors cursor-pointer">
                                        <PaletteIcon className="w-8 h-8 mb-2" />
                                        <p className="font-bold">Subir Arte Final</p>
                                        <p className="text-xs opacity-70">Ir a mesa de diseño</p>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link to={`/nota-de-venta/${trabajo.id}`} target="_blank" className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-blue hover:text-brand-blue transition-all font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                            <DocumentIcon className="w-5 h-5"/> Hoja de Ruta / Orden
                        </Link>
                        {trabajo.abono > 0 && (
                            <Link to={`/recibo-abono/${trabajo.id}`} target="_blank" className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-blue hover:text-brand-blue transition-all font-bold text-gray-600 dark:text-gray-300 shadow-sm">
                                <PrinterIcon className="w-5 h-5"/> Recibo de Abono
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {showPaymentModal && trabajo && (
                <PaymentModal 
                    saldo={trabajo.saldo} 
                    onClose={() => setShowPaymentModal(false)} 
                    onConfirm={handleAddPayment} 
                />
            )}
        </div>
    );
};

export default TrabajoDetallePage;
