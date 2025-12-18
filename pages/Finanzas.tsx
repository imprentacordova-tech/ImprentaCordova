
import React, { useState, useEffect, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, AreaChart, Area } from 'recharts';
import { getTrabajos, getClientes } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado, DailySales, FinancialProjection } from '../types';
import { formatCurrency } from '../utils';
import { DollarIcon, FinanceIcon, ClockIcon, ArrowDownTrayIcon, BoxIcon, SolidFinanceIcon, SparklesIcon, Loader2Icon } from '../components/Icons';
import { generateFinancialProjection } from '../services/geminiService';

const FinanzasPage: React.FC = () => {
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiProjection, setAiProjection] = useState<FinancialProjection | null>(null);
    
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [tData, cData] = await Promise.all([getTrabajos(), getClientes()]);
            setTrabajos(tData);
            setClientes(cData);
            setLoading(false);
        };
        fetchData();
    }, []);

    const historicalSales = useMemo(() => {
        const salesMap = new Map<string, number>();
        trabajos.forEach(t => {
            const date = t.fechaEntrada.split('T')[0];
            salesMap.set(date, (salesMap.get(date) || 0) + t.abono);
        });
        return Array.from(salesMap.entries())
            .map(([date, sales]) => ({ date, sales }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [trabajos]);

    const handleAIAnalysis = async () => {
        setAnalyzing(true);
        // Enviamos los últimos 60 días de datos para mayor precisión
        const history = historicalSales.slice(-60);
        const projection = await generateFinancialProjection(history);
        setAiProjection(projection);
        setAnalyzing(false);
    };

    if (loading) return <div className="p-10 text-center"><Loader2Icon className="animate-spin inline mr-2"/> Cargando...</div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">Finanzas & Proyecciones</h1>
                <button 
                    onClick={handleAIAnalysis}
                    disabled={analyzing}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-black rounded-xl shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                    {analyzing ? <Loader2Icon className="animate-spin w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
                    ANALIZAR CON INTELIGENCIA ARTIFICIAL
                </button>
            </div>

            {/* AI Insight Section */}
            {aiProjection && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-purple-200 dark:border-purple-900 shadow-2xl animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <SparklesIcon className="w-32 h-32 text-purple-500" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-purple-600 mb-6 flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6"/>
                        Predicción del Cerebro Córdova (Próximos 30 días)
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={aiProjection.forecast}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="date" tick={{fontSize: 10}} />
                                    <YAxis tickFormatter={(val) => `$${val}`} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="sales" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorSales)" name="Venta Proyectada" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-100">
                                <h3 className="text-sm font-bold text-purple-700 uppercase mb-2">Días de baja demanda</h3>
                                <div className="flex flex-wrap gap-2">
                                    {aiProjection.lowTrafficDays.map(day => (
                                        <span key={day} className="px-3 py-1 bg-white dark:bg-purple-800 rounded-full text-xs font-bold text-purple-600 dark:text-purple-200">
                                            {day}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100">
                                <h3 className="text-sm font-bold text-indigo-700 uppercase mb-2">Estrategia Recomendada</h3>
                                <p className="text-sm text-indigo-900 dark:text-indigo-200 italic leading-relaxed">
                                    "{aiProjection.suggestion}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rest of traditional stats (Historical) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ventas Totales</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(historicalSales.reduce((s, d) => s + d.sales, 0))}
                    </p>
                </div>
                {/* ... other traditional cards */}
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold mb-6">Historial Real de Ventas</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalSales}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="sales" stroke="#0B42A7" strokeWidth={3} dot={false} name="Venta Real" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default FinanzasPage;
