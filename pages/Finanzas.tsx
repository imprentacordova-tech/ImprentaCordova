
import React, { useState, useEffect, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, AreaChart, Area } from 'recharts';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado, DailySales, FinancialProjection, User } from '../types';
import { formatCurrency } from '../utils';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { DollarIcon, FinanceIcon, ClockIcon, ArrowDownTrayIcon, BoxIcon, SolidFinanceIcon, SparklesIcon, Loader2Icon } from '../components/Icons';
import { generateFinancialProjection } from '../services/geminiService';

const FinanzasPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, loading } = useData();
    const [analyzing, setAnalyzing] = useState(false);
    const [aiProjection, setAiProjection] = useState<FinancialProjection | null>(null);
    
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

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
        logActivity(currentUser.nombre, currentUser.rol, 'FINANZAS_MODIFICADA', 'Ejecutó análisis financiero con Inteligencia Atelier (Gemini AI)', 'Finanzas');
        setAnalyzing(false);
    };

    if (loading) return <div className="p-10 text-center"><Loader2Icon className="animate-spin inline mr-2"/> Cargando...</div>;

    return (
        <div className="space-y-10 pb-24 animate-fade-in relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-liquid-gold/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                        Atelier <span className="text-gold-gradient">Finanzas</span>
                    </h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2 ml-1">Análisis de Capital & Proyecciones IA</p>
                </div>
                
                <button 
                    onClick={handleAIAnalysis}
                    disabled={analyzing}
                    className="group relative flex items-center gap-4 px-10 py-5 bg-white text-brand-dark font-black rounded-2xl shadow-luxury hover:bg-liquid-gold transition-all duration-700 disabled:opacity-50 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    {analyzing ? (
                        <>
                            <Loader2Icon className="animate-spin w-5 h-5 text-brand-dark"/>
                            <span className="text-[10px] uppercase tracking-[0.2em]">Sincronizando Cerebro...</span>
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 text-brand-dark group-hover:scale-125 transition-transform"/>
                            <span className="text-[10px] uppercase tracking-[0.2em]">Activar Inteligencia Atelier</span>
                        </>
                    )}
                </button>
            </div>

            {/* AI Insight Section */}
            {aiProjection && (
                <div className="glass-atelier rounded-[3.5rem] p-12 lg:p-16 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                        <SparklesIcon className="w-64 h-64 text-liquid-gold" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-2 h-2 rounded-full bg-liquid-gold shadow-gold-glow animate-pulse"></div>
                            <h2 className="text-sm font-black text-liquid-gold uppercase tracking-[0.5em]">
                                Proyecciones Estratégicas (30 Días)
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-8 h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={aiProjection.forecast}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#E5C48B" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#E5C48B" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{fontSize: 9, fill: '#64748b'}} 
                                            axisLine={{stroke: 'rgba(255,255,255,0.05)'}}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            tickFormatter={(val) => `$${val}`} 
                                            tick={{fontSize: 9, fill: '#64748b'}}
                                            axisLine={{stroke: 'rgba(255,255,255,0.05)'}}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: '#030712',
                                                borderColor: 'rgba(229, 196, 139, 0.2)',
                                                borderRadius: '1rem',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ color: '#E5C48B' }}
                                        />
                                        <Area type="monotone" dataKey="sales" stroke="#E5C48B" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name="Venta Proyectada" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="lg:col-span-4 space-y-8">
                                <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/5 group-hover:border-liquid-gold/20 transition-all duration-700">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                        <ClockIcon className="w-4 h-4 text-liquid-gold/50"/> Días de calma proyectados
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {aiProjection.lowTrafficDays.map(day => (
                                            <span key={day} className="px-4 py-2 bg-brand-dark rounded-xl text-[10px] font-black text-liquid-gold border border-white/5">
                                                {day.toUpperCase()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="bg-brand-dark/50 p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-liquid-gold/5 w-24 h-24 rounded-full blur-2xl -mr-12 -mt-12"></div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Recomendación Maestra</h3>
                                    <p className="text-base text-slate-300 italic leading-relaxed font-medium">
                                        “{aiProjection.suggestion}”
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Financial Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/5 group hover:border-liquid-gold/30 transition-all duration-700">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Ventas Históricas</p>
                    <p className="text-4xl font-black text-white italic tracking-tighter">
                        {formatCurrency(historicalSales.reduce((s, d) => s + d.sales, 0)).split(',')[0]}
                        <span className="text-lg text-liquid-gold/50 opacity-50">,00</span>
                    </p>
                </div>
            </div>
            
            {/* Real Data Chart */}
            <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[3.5rem] border border-white/5">
                <div className="flex justify-between items-center mb-12">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Tracking Real de Operaciones</h3>
                     <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center">
                        <SolidFinanceIcon className="w-4 h-4 text-slate-600" />
                     </div>
                </div>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalSales}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                            <XAxis 
                                dataKey="date" 
                                tick={{fontSize: 9, fill: '#475569'}} 
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis 
                                hide
                            />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: '#030712',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '1rem',
                                    fontSize: '11px',
                                    fontWeight: 'bold'
                                }}
                            />
                            <Line type="monotone" dataKey="sales" stroke="#64748b" strokeWidth={2} dot={false} name="Venta Real" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default FinanzasPage;
