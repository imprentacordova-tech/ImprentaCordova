
import React, { useState, useEffect, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, Area, ComposedChart } from 'recharts';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, TrabajoTipo, FinancialProjection, DailySales } from '../types';
import { formatCurrency } from '../utils';
import { DollarIcon, FinanceIcon, ClockIcon, ArrowDownTrayIcon, BoxIcon, SolidFinanceIcon, SparklesIcon, Loader2Icon } from '../components/Icons';
import { generateFinancialProjection } from '../services/geminiService';
import { useToast } from '../contexts/ToastContext';

// KPI Card Component
interface KpiCardProps {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'green' | 'blue' | 'red' | 'purple';
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, variant }) => {
    const variants = {
        green: { bg: 'bg-green-100 dark:bg-green-900/50', iconContainer: 'bg-white', iconColor: 'text-green-600' },
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', iconContainer: 'bg-white', iconColor: 'text-brand-blue' },
        red: { bg: 'bg-red-100 dark:bg-red-900/50', iconContainer: 'bg-white', iconColor: 'text-brand-red' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', iconContainer: 'bg-white', iconColor: 'text-purple-600' },
    };
    const style = variants[variant];

    return (
        <div className={`p-5 rounded-xl shadow-sm ${style.bg}`}>
            <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${style.iconContainer}`}>
                    <Icon className={`h-6 w-6 ${style.iconColor}`} />
                </div>
                <div>
                    <p className={`text-sm font-medium text-gray-700 dark:text-gray-300`}>{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
            </div>
        </div>
    );
};

const SolidKpiCard: React.FC<{
    title: string;
    metric: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'blue' | 'green' | 'purple' | 'red' | 'gray' | 'orange';
}> = ({ title, metric, icon: Icon, variant }) => {
    const variants = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        purple: 'from-purple-500 to-purple-600',
        red: 'from-red-500 to-red-600',
        gray: 'from-gray-500 to-gray-600',
        orange: 'from-orange-400 to-orange-500',
    };

    const style = variants[variant];

    return (
        <div className={`p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br ${style} text-white`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-4xl font-bold">{metric}</p>
                    <p className="text-sm text-white/80 mt-1">{title}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                    <Icon className="h-7 w-7 text-white" />
                </div>
            </div>
        </div>
    );
};

// Helper to format date to YYYY-MM-DD for input
const toISODateString = (date: Date) => {
    return date.toISOString().split('T')[0];
};

const FinanzasPage: React.FC = () => {
    const { addToast } = useToast();
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    
    // AI Projection State
    const [projection, setProjection] = useState<FinancialProjection | null>(null);
    const [isProjecting, setIsProjecting] = useState(false);

    const getStartOfMonth = () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    };

    const [startDate, setStartDate] = useState(toISODateString(getStartOfMonth()));
    const [endDate, setEndDate] = useState(toISODateString(new Date()));

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [trabajosData, clientesData] = await Promise.all([getTrabajos(), getClientes()]);
            setTrabajos(trabajosData);
            setClientes(clientesData);
            setLoading(false);
        };
        fetchData();
    }, []);

    // 90-day history for AI Context
    const dailySalesHistory = useMemo(() => {
        const history: DailySales[] = [];
        const today = new Date();
        const startHistory = new Date();
        startHistory.setDate(today.getDate() - 90);

        const salesMap = new Map<string, number>();
        
        // Init map with 0
        for (let d = new Date(startHistory); d <= today; d.setDate(d.getDate() + 1)) {
            salesMap.set(toISODateString(d), 0);
        }

        trabajos.forEach(t => {
            const entryDate = new Date(t.fechaEntrada);
            if (entryDate >= startHistory && entryDate <= today) {
                const dateStr = toISODateString(entryDate);
                if (salesMap.has(dateStr)) {
                    salesMap.set(dateStr, salesMap.get(dateStr)! + t.total); // Using total, not just abono, for sales projection
                }
            }
        });

        // Convert map to sorted array
        Array.from(salesMap.entries())
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .forEach(([date, sales]) => history.push({ date, sales }));

        return history;
    }, [trabajos]);

    // Data for the Chart (last 30 days + projection if available)
    const combinedChartData = useMemo(() => {
        // 1. Get last 30 days of actual data
        const chartData: any[] = [];
        const today = new Date();
        const startDisplay = new Date();
        startDisplay.setDate(today.getDate() - 30);

        // Filter history for display
        const recentHistory = dailySalesHistory.filter(d => new Date(d.date) >= startDisplay);
        
        recentHistory.forEach(d => {
            chartData.push({
                name: new Date(d.date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }),
                dateISO: d.date,
                Ventas: d.sales,
                Proyeccion: null
            });
        });

        // 2. Append Projection if available
        if (projection) {
            // Add a connection point (last actual data point as start of projection)
            if (chartData.length > 0) {
                const lastPoint = chartData[chartData.length - 1];
                // Update last point to have projection start point same as actual to connect lines
                lastPoint.Proyeccion = lastPoint.Ventas;
            }

            projection.forecast.forEach(d => {
                chartData.push({
                    name: new Date(d.date).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }),
                    dateISO: d.date,
                    Ventas: null,
                    Proyeccion: d.sales
                });
            });
        }

        return chartData;
    }, [dailySalesHistory, projection]);
    
    const handleGenerateProjection = async () => {
        setIsProjecting(true);
        const result = await generateFinancialProjection(dailySalesHistory);
        if (result) {
            setProjection(result);
            addToast("Proyección generada con éxito", "success");
        } else {
            addToast("No se pudo generar la proyección. Intenta luego.", "error");
        }
        setIsProjecting(false);
    };

    const ticketPromedio = useMemo(() => {
        if (trabajos.length === 0) return 0;
        const totalIngresos = trabajos.reduce((sum, t) => sum + t.total, 0);
        return totalIngresos / trabajos.length;
    }, [trabajos]);

    const financialData = useMemo(() => {
        if (loading) return null;

        const [startY, startM, startD] = startDate.split('-').map(Number);
        const start = new Date(startY, startM - 1, startD, 0, 0, 0, 0);
        
        const [endY, endM, endD] = endDate.split('-').map(Number);
        const end = new Date(endY, endM - 1, endD, 23, 59, 59, 999);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const ingresosMes = trabajos
            .filter(t => new Date(t.fechaEntrada) >= startOfMonth)
            .reduce((sum, t) => sum + t.total, 0);

        const filteredTrabajos = trabajos.filter(t => {
            const fechaEntrada = new Date(t.fechaEntrada);
            return fechaEntrada >= start && fechaEntrada <= end;
        });

        const ingresosPeriodo = filteredTrabajos.reduce((sum, t) => sum + t.abono, 0);

        const saldosPendientes = trabajos
            .filter(t => t.saldo > 0)
            .reduce((sum, t) => sum + t.saldo, 0);
            
        const ingresosPorTipo = filteredTrabajos.reduce((acc, t) => {
            if (t.tipo === TrabajoTipo.SRI) {
                acc.sri += t.total;
            } else {
                acc.general += t.total;
            }
            return acc;
        }, { sri: 0, general: 0 });

        const ingresosPorTipoData = [
            { name: 'General', Ingresos: ingresosPorTipo.general },
            { name: 'SRI', Ingresos: ingresosPorTipo.sri },
        ];
        
        const distribucionEstado = filteredTrabajos.reduce((acc, t) => {
            acc[t.estado] = (acc[t.estado] || 0) + 1;
            return acc;
        }, {} as Record<TrabajoEstado, number>);
        
        const distribucionEstadoData = Object.entries(distribucionEstado).map(([name, value]) => ({ name, value }));

        const clienteIngresos = new Map<string, number>();
        filteredTrabajos.forEach(t => {
            clienteIngresos.set(t.clienteId, (clienteIngresos.get(t.clienteId) || 0) + t.total);
        });

        const topClientes = Array.from(clienteIngresos.entries())
            .map(([clienteId, total]) => ({
                clienteId,
                nombre: clientes.find(c => c.id === clienteId)?.nombre || 'Desconocido',
                total
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        const trabajosPeriodo = [...filteredTrabajos]
            .sort((a, b) => new Date(b.fechaEntrada).getTime() - new Date(a.fechaEntrada).getTime());
        
        return {
            ingresosPeriodo,
            ingresosMes,
            saldosPendientes,
            pedidosPeriodo: filteredTrabajos.length,
            ingresosPorTipoData,
            distribucionEstadoData,
            topClientes,
            trabajosPeriodo
        };
    }, [trabajos, clientes, loading, startDate, endDate]);

    if (loading || !financialData) {
        return <div className="text-center py-10">Cargando datos financieros...</div>;
    }
    
    const PIE_COLORS = {
      [TrabajoEstado.PENDIENTE]: '#0B42A7',
      [TrabajoEstado.PROCESO]: '#F59E0B',
      [TrabajoEstado.VITRINA]: '#10B981',
      [TrabajoEstado.ENTREGADO]: '#D90000',
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reportes</h1>
                 <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="start-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">Desde:</label>
                        <input
                            type="date"
                            id="start-date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-1.5 text-sm border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                         <label htmlFor="end-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">Hasta:</label>
                        <input
                            type="date"
                            id="end-date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-1.5 text-sm border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        <span>Exportar CSV</span>
                    </button>
                 </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <SolidKpiCard title="Ingresos del Mes" metric={formatCurrency(financialData.ingresosMes)} icon={SolidFinanceIcon} variant="purple" />
                <KpiCard title="Ingresos del Periodo" value={formatCurrency(financialData.ingresosPeriodo)} icon={DollarIcon} variant="green" />
                <KpiCard title="Pedidos en Periodo" value={String(financialData.pedidosPeriodo)} icon={BoxIcon} variant="blue" />
                <KpiCard title="Ticket Promedio (Total)" value={formatCurrency(ticketPromedio)} icon={FinanceIcon} variant="purple" />
                <KpiCard title="Saldos Pendientes (Total)" value={formatCurrency(financialData.saldosPendientes)} icon={ClockIcon} variant="red" />
            </div>

            {/* --- AI PROJECTION CHART SECTION --- */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Tendencia & Proyección
                            {projection && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase font-bold border border-purple-200">AI Powered</span>}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Análisis histórico y predicción de ventas futuras.</p>
                    </div>
                    <button 
                        onClick={handleGenerateProjection} 
                        disabled={isProjecting}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95 ${isProjecting ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-purple-500/30'}`}
                    >
                        {isProjecting ? <Loader2Icon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4 text-yellow-300"/>}
                        {projection ? 'Regenerar Proyección' : 'Generar Proyección IA'}
                    </button>
                </div>

                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={combinedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0B42A7" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#0B42A7" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorProyeccion" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip 
                                formatter={(value: number, name: string) => [formatCurrency(value), name]} 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend iconType="circle" />
                            
                            {/* Actual Sales */}
                            <Area type="monotone" dataKey="Ventas" stroke="#0B42A7" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" name="Ventas Reales" activeDot={{ r: 6 }} />
                            
                            {/* Projected Sales */}
                            {projection && (
                                <Line 
                                    type="monotone" 
                                    dataKey="Proyeccion" 
                                    stroke="#9333ea" 
                                    strokeWidth={3} 
                                    strokeDasharray="5 5" 
                                    dot={{ r: 3, fill: '#9333ea' }} 
                                    name="Proyección IA"
                                    animationDuration={1500}
                                />
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* AI Insight Card */}
                {projection && (
                    <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 p-4 rounded-xl flex items-start gap-4 animate-fade-in">
                        <div className="bg-purple-200 dark:bg-purple-800 p-2 rounded-lg text-purple-700 dark:text-purple-200">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-purple-900 dark:text-white mb-1">Estrategia Sugerida</h4>
                            <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed italic">"{projection.suggestion}"</p>
                            <div className="mt-2 flex gap-2">
                                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Días Bajos:</span>
                                {projection.lowTrafficDays.map(day => (
                                    <span key={day} className="text-xs bg-white dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-700 font-medium">
                                        {day}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Ingresos por Tipo (Periodo)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={financialData.ingresosPorTipoData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                            <YAxis tickFormatter={(value) => formatCurrency(value as number)} tick={{ fill: 'currentColor', fontSize: 12 }} />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar dataKey="Ingresos" fill="#0B42A7" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold mb-4">Distribución de Trabajos (Periodo)</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={financialData.distribucionEstadoData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {financialData.distribucionEstadoData.map((entry) => (
                                    <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[entry.name as TrabajoEstado] || '#8884d8'} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} trabajos`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold mb-4">Top 5 Clientes por Ingresos (Periodo)</h3>
                {financialData.topClientes.length > 0 ? (
                    <ul className="space-y-3">
                        {financialData.topClientes.map((cliente, index) => (
                            <li key={cliente.clienteId} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div className="flex items-center">
                                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-brand-blue text-white font-bold mr-4">{index + 1}</span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{cliente.nombre}</span>
                                </div>
                                <span className="font-bold text-brand-blue">{formatCurrency(cliente.total)}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No hay datos de clientes para el período seleccionado.</p>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <h3 className="text-lg font-semibold p-6">Transacciones del Periodo</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                         <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                {['ORDEN', 'CLIENTE', 'TIPO', 'TOTAL', 'ABONO', 'SALDO', 'ESTADO'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                         <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                             {financialData.trabajosPeriodo.length > 0 ? (
                                financialData.trabajosPeriodo.map(trabajo => (
                                    <tr key={trabajo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{trabajo.orden}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{clientes.find(c => c.id === trabajo.clienteId)?.nombre || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{trabajo.tipo.toUpperCase()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(trabajo.total)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">{formatCurrency(trabajo.abono)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">{formatCurrency(trabajo.saldo)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                trabajo.estado === TrabajoEstado.ENTREGADO ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                                {trabajo.estado}
                                            </span>
                                        </td>
                                    </tr>
                                 ))
                             ) : (
                                <tr>
                                    <td colSpan={7} className="text-center text-gray-500 dark:text-gray-400 py-8">No se encontraron transacciones en el período seleccionado.</td>
                                </tr>
                             )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinanzasPage;
