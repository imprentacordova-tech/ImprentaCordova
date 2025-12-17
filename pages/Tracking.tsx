
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado } from '../types';
import { CordovaLogo, SearchIcon, CheckCircleIcon, ClockIcon, PrinterIcon, PaletteIcon, BoxIcon, ArrowRightIcon } from '../components/Icons';
import { formatDate } from '../utils';

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
                                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                        ${isCompleted ? 'bg-brand-blue border-brand-blue text-white' : 'bg-white border-gray-300 text-gray-400'}
                                        ${isCurrent ? 'ring-4 ring-blue-100 scale-110' : ''}
                                    `}
                                >
                                    <step.icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                                </div>
                                <span className={`
                                    mt-3 text-xs font-bold uppercase tracking-wider transition-colors duration-300
                                    ${isCompleted ? 'text-brand-blue' : 'text-gray-400'}
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
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [results, setResults] = useState<{ trabajo: Trabajo; cliente: Cliente }[]>([]);
    
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
                                    <div className="flex justify-between items-center mb-8">
                                        <div>
                                            <p className="text-sm text-gray-500">Estado Actual</p>
                                            <p className={`text-2xl font-black ${
                                                trabajo.estado === TrabajoEstado.VITRINA ? 'text-green-500' : 
                                                trabajo.estado === TrabajoEstado.ENTREGADO ? 'text-gray-400' : 'text-brand-blue'
                                            }`}>
                                                {trabajo.estado}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Fecha Pedido</p>
                                            <p className="font-bold text-gray-900">{formatDate(trabajo.fechaEntrada)}</p>
                                        </div>
                                    </div>

                                    <ProgressBar currentStatus={trabajo.estado} />

                                    {trabajo.estado === TrabajoEstado.VITRINA && (
                                        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-4">
                                            <CheckCircleIcon className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-green-800">¡Listo para retirar!</h4>
                                                <p className="text-sm text-green-700 mt-1">
                                                    Tu trabajo está terminado. Puedes pasar por nuestro local en <strong>Colón e/ Sucre y Rocafuerte</strong>.
                                                    {trabajo.saldo > 0 && <span className="block mt-1 font-bold">Saldo pendiente: ${trabajo.saldo.toFixed(2)}</span>}
                                                </p>
                                            </div>
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
