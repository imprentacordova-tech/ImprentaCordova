
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getTrabajos, getClientes, updateTrabajoStatus } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado } from '../types';
import { CordovaLogo, SearchIcon, CheckCircleIcon, ClockIcon, PrinterIcon, PaletteIcon, BoxIcon, ArrowRightIcon, DollarIcon, UploadIcon, Loader2Icon, MessageCircle, Send, X, MapPinIcon } from '../components/Icons';
import { formatDate, formatCurrency } from '../utils';
import { useToast } from '../contexts/ToastContext';

// Mapeo de estados a pasos numéricos para la barra de progreso
const getStepStatus = (estado: TrabajoEstado) => {
    switch (estado) {
        case TrabajoEstado.PENDIENTE: return 1;
        case TrabajoEstado.EN_DISENO: return 2;
        case TrabajoEstado.PROCESO: return 3;
        case TrabajoEstado.VITRINA: return 4;
        case TrabajoEstado.ENTREGADO: return 5;
        default: return 0;
    }
};

const steps = [
    { id: 1, label: 'Recibido', icon: ClockIcon },
    { id: 2, label: 'Diseño', icon: PaletteIcon },
    { id: 3, label: 'Producción', icon: PrinterIcon },
    { id: 4, label: 'En Vitrina', icon: BoxIcon },
    { id: 5, label: 'Entregado', icon: CheckCircleIcon },
];

// Función para obtener estimación de tiempo dinámica
const getStatusEstimate = (estado: TrabajoEstado) => {
    switch (estado) {
        case TrabajoEstado.PENDIENTE:
            return "Revisión inicial en curso (1-4 horas)";
        case TrabajoEstado.EN_DISENO:
            return "Tiempo estimado: 24-48 horas para muestra";
        case TrabajoEstado.PROCESO:
            return "Tiempo estimado: 24-48 horas para finalizar";
        case TrabajoEstado.VITRINA:
            return "¡Listo para retirar hoy mismo!";
        case TrabajoEstado.ENTREGADO:
            return "Proceso finalizado exitosamente";
        default:
            return "";
    }
};

const ProgressBar: React.FC<{ currentStatus: TrabajoEstado }> = ({ currentStatus }) => {
    const currentStep = getStepStatus(currentStatus);
    const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

    return (
        <div className="w-full py-6">
            <div className="relative">
                {/* Línea de fondo */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 rounded-full -translate-y-1/2 z-0"></div>
                
                {/* Línea de progreso animada */}
                <div 
                    className="absolute top-1/2 left-0 h-1 bg-brand-blue rounded-full -translate-y-1/2 z-0 transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                ></div>

                {/* Pasos */}
                <div className="relative z-10 flex justify-between">
                    {steps.map((step) => {
                        const isCompleted = step.id <= currentStep;
                        const isCurrent = step.id === currentStep;

                        return (
                            <div key={step.id} className="flex flex-col items-center group">
                                <div 
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-white
                                        ${isCompleted ? 'border-brand-blue text-brand-blue' : 'border-gray-300 text-gray-400'}
                                        ${isCurrent ? 'ring-4 ring-blue-100 scale-110 shadow-lg' : ''}
                                        ${step.id < currentStep ? 'bg-brand-blue text-white border-brand-blue' : ''}
                                    `}
                                >
                                    <step.icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                                </div>
                                <span className={`
                                    mt-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300 text-center
                                    ${isCompleted || isCurrent ? 'text-brand-blue' : 'text-gray-400'}
                                `}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const TrackingPage: React.FC = () => {
    const { addToast } = useToast();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [results, setResults] = useState<{ trabajo: Trabajo; cliente: Cliente }[]>([]);
    
    // Estados para la carga de comprobantes
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [jobsInReview, setJobsInReview] = useState<Set<string>>(new Set());

    // Estados para aprobación de arte
    const [feedbackJobId, setFeedbackJobId] = useState<string | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [approvingId, setApprovingId] = useState<string | null>(null);
    
    // URL Params for QR Scanning auto-load
    const [searchParams] = useSearchParams();

    // Cargar datos al montar para tenerlos listos (optimización para demo)
    const [allData, setAllData] = useState<{ trabajos: Trabajo[]; clientes: Cliente[] } | null>(null);

    // Initial Load & Auto Search
    useEffect(() => {
        const loadAndSearch = async () => {
            setLoading(true);
            const [t, c] = await Promise.all([getTrabajos(), getClientes()]);
            setAllData({ trabajos: t, clientes: c });
            setLoading(false);

            // Check for ID in URL
            const urlId = searchParams.get('id');
            if (urlId) {
                setQuery(urlId);
                performSearch(urlId, { trabajos: t, clientes: c });
            }
        };
        loadAndSearch();
    }, []);

    const performSearch = (termRaw: string, data: { trabajos: Trabajo[]; clientes: Cliente[] }) => {
        setLoading(true);
        setHasSearched(true);
        const term = termRaw.trim().toLowerCase();
        
        setTimeout(() => {
            let foundTrabajos: Trabajo[] = [];

            // 1. Buscar por ID Exacto (Link QR) o Orden Exacta
            const jobById = data.trabajos.find(t => t.id === term);
            const orderByNumber = data.trabajos.find(t => String(t.orden) === term);
            
            if (jobById) {
                foundTrabajos.push(jobById);
            } else if (orderByNumber) {
                foundTrabajos.push(orderByNumber);
            } else {
                // 2. Buscar por Cliente (RUC/Cedula)
                const clientFound = data.clientes.find(c => c.cedula === term || c.ruc === term);
                if (clientFound) {
                    // Traer últimos 5 trabajos de este cliente
                    foundTrabajos = data.trabajos
                        .filter(t => t.clienteId === clientFound.id)
                        .sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime())
                        .slice(0, 5);
                }
            }

            // Mapear resultado final
            const finalResults = foundTrabajos.map(t => ({
                trabajo: t,
                cliente: data.clientes.find(c => c.id === t.clienteId)!
            })).filter(r => r.cliente); // Safety filter

            setResults(finalResults);
            setLoading(false);
        }, 600);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !allData) return;
        performSearch(query, allData);
    };

    // --- LÓGICA DE APROBACIÓN DE ARTE ---

    const handleApproveDesign = async (trabajo: Trabajo) => {
        if (!confirm("¿Confirmas que el diseño está correcto y autorizas la impresión?")) return;
        
        setApprovingId(trabajo.id);
        
        // Simular llamada API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
            // Actualizar estado real (Mock API)
            await updateTrabajoStatus(trabajo.id, TrabajoEstado.PROCESO, "Cliente Web");
            
            // Actualizar estado local visualmente
            setResults(prev => prev.map(item => {
                if (item.trabajo.id === trabajo.id) {
                    return { ...item, trabajo: { ...item.trabajo, estado: TrabajoEstado.PROCESO } };
                }
                return item;
            }));
            
            addToast("¡Diseño aprobado! Tu pedido ha pasado a producción.", "success");
        } catch (error) {
            addToast("Error al aprobar diseño. Intenta nuevamente.", "error");
        } finally {
            setApprovingId(null);
        }
    };

    const handleSendChanges = (trabajo: Trabajo) => {
        if (!feedbackText.trim()) return;
        
        // Número de la imprenta (Hardcoded o desde config)
        const phone = "593993083943"; 
        const message = `Hola Imprenta Córdova. Sobre la orden #${trabajo.orden} (${trabajo.subtipo}), necesito los siguientes cambios en el diseño:\n\n${feedbackText}`;
        
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        
        setFeedbackJobId(null);
        setFeedbackText('');
        addToast("Abriendo WhatsApp para enviar cambios...", "info");
    };

    // --- LÓGICA DE PAGO ---

    const handlePaymentUpload = async (e: React.ChangeEvent<HTMLInputElement>, jobId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingId(jobId);

        // Simular subida a servidor
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Actualizar estado local visualmente (Mock update)
        setJobsInReview(prev => {
            const newSet = new Set(prev);
            newSet.add(jobId);
            return newSet;
        });
        
        setUploadingId(null);
        addToast("Comprobante subido exitosamente. Pago en revisión.", "success");
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
            {/* Header Simple */}
            <div className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 group">
                        <CordovaLogo className="h-8 w-auto" />
                        <span className="text-xl font-black text-brand-blue tracking-tighter uppercase">Rastreo de Pedidos</span>
                    </Link>
                    <Link to="/" className="text-sm font-bold text-gray-500 hover:text-brand-blue flex items-center gap-1">
                        Volver al inicio <ArrowRightIcon className="w-4 h-4"/>
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-grow container mx-auto px-4 py-12 max-w-3xl">
                
                <div className="text-center mb-10 space-y-4">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900">¿Dónde está mi pedido?</h1>
                    <p className="text-gray-500 text-lg">Ingresa tu número de orden o identificación para ver el estado en tiempo real.</p>
                </div>

                {/* Search Box */}
                <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-16 group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <SearchIcon className="h-6 w-6 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="block w-full pl-14 pr-32 py-5 bg-white border-2 border-gray-200 rounded-full text-lg shadow-lg placeholder-gray-400 focus:outline-none focus:border-brand-blue focus:ring-4 focus:ring-blue-100 transition-all"
                        placeholder="Ej: 1045 o 1722..."
                        autoFocus={!query} // Don't autofocus if loading from QR
                    />
                    <button 
                        type="submit" 
                        disabled={!query}
                        className="absolute right-2 top-2 bottom-2 bg-brand-blue text-white px-6 rounded-full font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Buscando...' : 'Consultar'}
                    </button>
                </form>

                {/* Results Area */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                        <div className="w-16 h-16 border-4 border-blue-100 border-t-brand-blue rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">Buscando información...</p>
                    </div>
                ) : hasSearched && results.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center animate-fade-in">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <SearchIcon className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No encontramos resultados</h3>
                        <p className="text-gray-500">Verifica que el número de orden o la cédula estén escritos correctamente.</p>
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in-up">
                        {results.map(({ trabajo, cliente }) => (
                            <div key={trabajo.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                {/* Card Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Orden #{trabajo.orden}</p>
                                        <h3 className="text-lg font-bold text-brand-blue">{trabajo.subtipo}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cliente</p>
                                        <p className="font-medium text-gray-900">{cliente.nombre}</p>
                                    </div>
                                </div>

                                {/* Status & Progress */}
                                <div className="p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Estado Actual</p>
                                            <div className="flex flex-col">
                                                <p className={`text-3xl font-black ${
                                                    trabajo.estado === TrabajoEstado.VITRINA ? 'text-green-500' : 
                                                    trabajo.estado === TrabajoEstado.ENTREGADO ? 'text-gray-400' : 'text-brand-blue'
                                                }`}>
                                                    {trabajo.estado}
                                                </p>
                                                {/* ESTIMACIÓN DINÁMICA */}
                                                <p className="text-sm font-bold text-blue-600 mt-1 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-lg w-fit">
                                                    <ClockIcon className="w-4 h-4" />
                                                    {getStatusEstimate(trabajo.estado)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right hidden md:block">
                                            <p className="text-sm text-gray-500">Fecha Pedido</p>
                                            <p className="font-bold text-gray-900">{formatDate(trabajo.fechaEntrada)}</p>
                                        </div>
                                    </div>

                                    <ProgressBar currentStatus={trabajo.estado} />

                                    {/* --- ZONA DE APROBACIÓN DE ARTE --- */}
                                    {trabajo.estado === TrabajoEstado.EN_DISENO && (trabajo.diseno?.archivoUrl || trabajo.fotoOriginalUrl) && (
                                        <div className="mt-8 bg-purple-50 border border-purple-100 rounded-2xl p-6 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-400"></div>
                                            
                                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                                {/* Visual Preview */}
                                                <div className="w-full md:w-1/3 bg-white p-2 rounded-xl shadow-sm border border-purple-100">
                                                    <img 
                                                        src={trabajo.diseno?.archivoUrl || trabajo.fotoOriginalUrl} 
                                                        alt="Arte a aprobar" 
                                                        className="w-full h-auto rounded-lg max-h-64 object-contain mx-auto"
                                                    />
                                                    <p className="text-[10px] text-center text-gray-400 mt-2 uppercase font-bold tracking-wider">Vista Previa</p>
                                                </div>

                                                {/* Actions */}
                                                <div className="w-full md:w-2/3">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <PaletteIcon className="w-5 h-5 text-purple-600" />
                                                        <h4 className="font-bold text-lg text-purple-900">Revisión de Diseño</h4>
                                                    </div>
                                                    
                                                    {!feedbackJobId || feedbackJobId !== trabajo.id ? (
                                                        <div className="space-y-3">
                                                            <p className="text-sm text-purple-800 mb-4 leading-relaxed">
                                                                Por favor revisa cuidadosamente la ortografía, teléfonos y datos. 
                                                                Una vez aprobado, pasará directamente a impresión.
                                                            </p>
                                                            <div className="flex flex-col sm:flex-row gap-3">
                                                                <button 
                                                                    onClick={() => handleApproveDesign(trabajo)}
                                                                    disabled={!!approvingId}
                                                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                                                >
                                                                    {approvingId === trabajo.id ? (
                                                                        <Loader2Icon className="w-5 h-5 animate-spin"/>
                                                                    ) : (
                                                                        <CheckCircleIcon className="w-5 h-5"/>
                                                                    )}
                                                                    {approvingId === trabajo.id ? 'Procesando...' : 'Aprobar Diseño'}
                                                                </button>
                                                                
                                                                <button 
                                                                    onClick={() => { setFeedbackJobId(trabajo.id); setFeedbackText(''); }}
                                                                    className="flex-1 bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                                                >
                                                                    Solicitar Cambios
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="animate-fade-in bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <label className="text-xs font-bold text-purple-900 uppercase">Describe los cambios:</label>
                                                                <button onClick={() => setFeedbackJobId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
                                                            </div>
                                                            <textarea 
                                                                value={feedbackText}
                                                                onChange={(e) => setFeedbackText(e.target.value)}
                                                                className="w-full p-3 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none mb-3 bg-purple-50/30"
                                                                rows={3}
                                                                placeholder="Ej: Agrandar el teléfono, cambiar fondo a azul..."
                                                                autoFocus
                                                            ></textarea>
                                                            <button 
                                                                onClick={() => handleSendChanges(trabajo)}
                                                                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                                            >
                                                                <MessageCircle className="w-4 h-4" />
                                                                Enviar al Diseñador (WhatsApp)
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- VITRINA CONTEXT (Map & Info) --- */}
                                    {trabajo.estado === TrabajoEstado.VITRINA && (
                                        <div className="mt-8 space-y-6">
                                            <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-r-xl flex items-center gap-4 shadow-sm animate-pulse-slow">
                                                <div className="bg-white p-2 rounded-full shadow-sm">
                                                    <CheckCircleIcon className="w-8 h-8 text-green-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-green-900 text-lg">¡Pedido Listo para Retirar!</h4>
                                                    <p className="text-green-800 text-sm">
                                                        Tu orden está en vitrina. Te esperamos en nuestro local.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Mapa */}
                                                <div className="h-64 bg-gray-200 rounded-xl overflow-hidden shadow-md border border-gray-200 relative group">
                                                    <iframe 
                                                        title="Ubicación Imprenta Córdova"
                                                        src="https://maps.google.com/maps?q=-3.3281355388981613,-79.80962191989809&hl=es&z=17&output=embed"
                                                        width="100%" 
                                                        height="100%" 
                                                        style={{ border: 0 }} 
                                                        allowFullScreen={true} 
                                                        loading="lazy" 
                                                        referrerPolicy="no-referrer-when-downgrade"
                                                        className="w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                                                    ></iframe>
                                                    <a 
                                                        href="https://maps.google.com/?q=-3.3281355,-79.8096219" 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="absolute bottom-3 left-3 bg-white/90 backdrop-blur text-blue-700 text-xs font-bold px-3 py-2 rounded-lg shadow-md hover:bg-white flex items-center gap-2"
                                                    >
                                                        <MapPinIcon className="w-4 h-4 text-red-500" /> Ver en Google Maps
                                                    </a>
                                                </div>

                                                {/* Horarios e Info */}
                                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col justify-center shadow-sm">
                                                    <h5 className="font-bold text-brand-blue mb-4 flex items-center gap-2">
                                                        <ClockIcon className="w-5 h-5" /> Horario de Atención
                                                    </h5>
                                                    <ul className="space-y-3 text-sm text-gray-700 mb-6">
                                                        <li className="flex justify-between border-b border-blue-200 pb-1">
                                                            <span>Lunes a Viernes</span>
                                                            <span className="font-bold">08:30 - 18:30</span>
                                                        </li>
                                                        <li className="flex justify-between border-b border-blue-200 pb-1">
                                                            <span>Sábados</span>
                                                            <span className="font-bold">09:00 - 13:00</span>
                                                        </li>
                                                        <li className="flex justify-between text-gray-400">
                                                            <span>Domingos</span>
                                                            <span>Cerrado</span>
                                                        </li>
                                                    </ul>
                                                    <div className="mt-auto bg-white p-3 rounded-lg border border-blue-100 text-center">
                                                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Dirección</p>
                                                        <p className="text-gray-800 font-medium text-sm">Colón e/ Sucre y Rocafuerte.<br/>Pasaje, El Oro.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Section (Solo si hay saldo pendiente) */}
                                    {trabajo.saldo > 0 && (
                                        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-orange-50/50 p-4 rounded-xl border-orange-100 border">
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                                                    <DollarIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">Saldo Pendiente</p>
                                                    <p className="text-xl font-black text-orange-600">{formatCurrency(trabajo.saldo)}</p>
                                                </div>
                                            </div>

                                            {jobsInReview.has(trabajo.id) ? (
                                                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-5 py-3 rounded-xl font-bold text-sm shadow-sm w-full sm:w-auto justify-center">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                    <span>Pago en Revisión</span>
                                                </div>
                                            ) : (
                                                <label className={`
                                                    relative flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-orange-200 text-orange-700 font-bold rounded-xl shadow-sm cursor-pointer transition-all hover:bg-orange-100 hover:border-orange-300 active:scale-95 w-full sm:w-auto
                                                    ${uploadingId === trabajo.id ? 'opacity-70 pointer-events-none' : ''}
                                                `}>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*,application/pdf" 
                                                        className="hidden" 
                                                        onChange={(e) => handlePaymentUpload(e, trabajo.id)}
                                                        disabled={uploadingId === trabajo.id}
                                                    />
                                                    {uploadingId === trabajo.id ? (
                                                        <Loader2Icon className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <UploadIcon className="w-5 h-5" />
                                                    )}
                                                    <span>{uploadingId === trabajo.id ? 'Subiendo...' : 'Subir Comprobante'}</span>
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <footer className="bg-white border-t border-gray-200 py-8 text-center">
                <p className="text-gray-400 text-sm">&copy; 2025 Imprenta Córdova. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default TrackingPage;
