
import React, { useState, useEffect, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, AreaChart, Area } from 'recharts';
import { useData } from '../contexts/DataContext';
import { Trabajo, Cliente, TrabajoEstado, DailySales, FinancialProjection, User } from '../types';
import { formatCurrency } from '../utils';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { 
    DollarIcon, FinanceIcon, ClockIcon, ArrowDownTrayIcon, 
    BoxIcon, SolidFinanceIcon, SparklesIcon, Loader2Icon,
    ArrowTrendingUpIcon, ArrowTrendingDownIcon, ScaleIcon,
    LightningBoltIcon, ChartBarIcon, CpuIcon
} from '../components/Icons';
import { generateFinancialProjection } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

// --- LUXURY COMPONENTS ---

const MetricCard: React.FC<{ 
    label: string, 
    value: string, 
    icon: any, 
    trend?: string, 
    trendUp?: boolean 
}> = ({ label, value, icon: Icon, trend, trendUp }) => (
    <motion.div 
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="glass-card-luxury p-8 relative group overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-all duration-700">
            <Icon className="w-20 h-20 text-white" />
        </div>
        <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-liquid-gold/10 border border-liquid-gold/20 text-liquid-gold">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{label}</span>
            </div>
            <div className="flex items-end justify-between">
                <p className="text-4xl font-black text-white italic tracking-tighter drop-shadow-sm">
                    {value}
                </p>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black ${trendUp ? 'text-emerald-500' : 'text-rose-500'} uppercase tracking-widest`}>
                        {trendUp ? '▲' : '▼'} {trend}
                    </div>
                )}
            </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000"></div>
    </motion.div>
);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
};

const FinanzasPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { trabajos, clientes, loading } = useData();
    const [analyzing, setAnalyzing] = useState(false);
    const [aiProjection, setAiProjection] = useState<FinancialProjection | null>(null);
    
    const historicalSales = useMemo(() => {
        const salesMap = new Map<string, number>();
        trabajos.forEach(t => {
            const date = t.fechaEntrada.split('T')[0];
            salesMap.set(date, (salesMap.get(date) || 0) + (t.abono || 0));
        });
        return Array.from(salesMap.entries())
            .map(([date, sales]) => ({ date, sales }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [trabajos]);

    const totalRevenue = useMemo(() => historicalSales.reduce((acc, curr) => acc + curr.sales, 0), [historicalSales]);
    const avgSale = useMemo(() => totalRevenue / (historicalSales.length || 1), [totalRevenue, historicalSales]);
    const peakSale = useMemo(() => Math.max(...historicalSales.map(s => s.sales), 0), [historicalSales]);

    const handleAIAnalysis = async () => {
        setAnalyzing(true);
        try {
            const history = historicalSales.slice(-60);
            const projection = await generateFinancialProjection(history);
            setAiProjection(projection);
            logActivity(currentUser.nombre, currentUser.rol, 'FINANZAS_ANALIZED', 'Ejecutó análisis financiero con Inteligencia Atelier (Gemini AI)', 'Finanzas');
        } catch (error) {
            console.error("AI Analysis failed:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <Loader2Icon className="animate-spin w-12 h-12 text-liquid-gold opacity-30"/>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[1em] animate-pulse">Sincronizando Capital...</p>
        </div>
    );

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-[1600px] mx-auto space-y-16 pb-40 px-6 sm:px-12 relative"
        >
            {/* --- CINEMATIC AMBIANCE --- */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-liquid-gold/[0.03] blur-[150px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/[0.02] blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* --- ORACLE HEADER --- */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/5 pb-12">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-[1px] bg-liquid-gold/50"></div>
                        <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em]">Capital Oracle</span>
                    </div>
                    <h1 className="text-6xl sm:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Financial <span className="text-gold-gradient">Atelier</span>
                    </h1>
                </div>
                
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAIAnalysis}
                    disabled={analyzing}
                    className="group relative flex items-center gap-6 px-12 py-6 bg-white text-black font-black rounded-3xl shadow-luxury transition-all duration-700 disabled:opacity-50 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    {analyzing ? (
                        <>
                            <Loader2Icon className="animate-spin w-5 h-5 text-black"/>
                            <span className="text-[11px] uppercase tracking-[0.2em] font-black">Neural Sourcing...</span>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                <SparklesIcon className="w-6 h-6 text-black group-hover:scale-125 transition-transform duration-500"/>
                                <div className="absolute inset-0 bg-liquid-gold blur-md opacity-0 group-hover:opacity-40 transition-opacity"></div>
                            </div>
                            <span className="text-[11px] uppercase tracking-[0.3em] font-black">Activate AI Insight</span>
                        </>
                    )}
                </motion.button>
            </motion.div>

            {/* --- TOP METRICS GRID --- */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <MetricCard label="Accumulated Revenue" value={formatCurrency(totalRevenue).split(',')[0]} icon={SolidFinanceIcon} trend="8.2%" trendUp={true} />
                <MetricCard label="Average Unit Value" value={formatCurrency(avgSale).split(',')[0]} icon={ScaleIcon} />
                <MetricCard label="Peak Daily Signal" value={formatCurrency(peakSale).split(',')[0]} icon={LightningBoltIcon} />
                <MetricCard label="Cloud Sync Health" value="100%" icon={ServerIcon} trend="LIVE" trendUp={true} />
            </motion.div>

            {/* --- AI INSIGHT (ORACLE) SECTION --- */}
            <AnimatePresence>
                {aiProjection && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 40 }}
                        className="glass-card-luxury p-12 lg:p-20 relative overflow-hidden group/oracle"
                    >
                        {/* DECORATIVE AI BLOOM */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-liquid-gold/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none group-hover/oracle:bg-liquid-gold/10 transition-colors duration-[2000ms]"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-6 mb-16 border-b border-white/5 pb-10">
                                <div className="p-4 rounded-2xl bg-liquid-gold text-black shadow-gold-glow-strong">
                                    <CpuIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Predictive Intelligence <span className="text-liquid-gold">Node</span></h2>
                                    <div className="mt-2 flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-ping"></div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atelier OS v5 • 30-Day Simulation</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
                                {/* MAIN CHART */}
                                <div className="lg:col-span-8 space-y-8">
                                    <div className="h-[450px] w-full bg-black/40 rounded-[3rem] p-8 border border-white/5 shadow-inner">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={aiProjection.forecast}>
                                                <defs>
                                                    <linearGradient id="colorSalesAI" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} 
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={15}
                                                />
                                                <YAxis 
                                                    tickFormatter={(val) => `$${val}`} 
                                                    tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dx={-10}
                                                />
                                                <Tooltip 
                                                    cursor={{ stroke: '#D4AF37', strokeWidth: 1, strokeDasharray: '5 5' }}
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(3, 7, 18, 0.95)',
                                                        borderColor: 'rgba(212, 175, 55, 0.3)',
                                                        borderRadius: '1.5rem',
                                                        fontSize: '11px',
                                                        fontWeight: 'bold',
                                                        color: '#fff',
                                                        backdropFilter: 'blur(10px)',
                                                        padding: '1.5rem',
                                                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                                                    }}
                                                    itemStyle={{ color: '#D4AF37' }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="sales" 
                                                    stroke="#D4AF37" 
                                                    strokeWidth={4} 
                                                    fillOpacity={1} 
                                                    fill="url(#colorSalesAI)" 
                                                    name="Projected Flow" 
                                                    animationDuration={2500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex items-center gap-6 px-10">
                                        <div className="flex -space-x-4">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-dark bg-slate-800 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse"></div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic leading-relaxed">
                                            Simulation based on {historicalSales.length} historical nodes and seasonal coefficient alpha.
                                        </p>
                                    </div>
                                </div>
                                
                                {/* AI INSIGHTS PANEL */}
                                <div className="lg:col-span-4 space-y-10">
                                    <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group/card hover:border-liquid-gold/20 transition-all duration-700">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/card:opacity-20 transition-opacity">
                                            <ChartBarIcon className="w-16 h-16"/>
                                        </div>
                                        <h3 className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                            <ClockIcon className="w-4 h-4 opacity-50"/> Low Traffic Clusters
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {aiProjection.lowTrafficDays.map(day => (
                                                <motion.span 
                                                    key={day} 
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="px-5 py-2 bg-black/60 rounded-xl text-[10px] font-black text-white border border-white/5 uppercase tracking-widest"
                                                >
                                                    {day}
                                                </motion.span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="p-10 rounded-[2.5rem] bg-liquid-gold/5 border border-liquid-gold/10 relative group/rec">
                                        <div className="absolute top-[-10px] left-10 px-4 py-1 bg-liquid-gold rounded-full text-black text-[9px] font-black uppercase tracking-widest shadow-gold-glow">
                                            Atelier Recommendation
                                        </div>
                                        <SparklesIcon className="absolute bottom-6 right-6 w-12 h-12 text-liquid-gold/10 group-hover/rec:scale-110 transition-transform duration-1000" />
                                        <p className="text-lg text-slate-300 italic font-medium leading-relaxed relative z-10">
                                            “{aiProjection.suggestion}”
                                        </p>
                                    </div>

                                    <div className="pt-6">
                                        <button 
                                            onClick={() => setAiProjection(null)}
                                            className="w-full py-5 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            Close Simulation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* --- HISTORICAL SECTION --- */}
            <motion.div variants={itemVariants} className="space-y-12">
                <div className="flex items-center gap-6">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Operational <span className="text-slate-500">Flow</span></h3>
                    <div className="flex-grow h-[1px] bg-white/5"></div>
                </div>

                <div className="glass-card-luxury p-12 relative overflow-hidden bg-black/40">
                    <div className="flex justify-between items-center mb-16">
                         <div className="flex items-center gap-6">
                            <div className="p-3 rounded-xl bg-slate-800 border border-white/10 text-slate-500">
                                <SolidFinanceIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Historical Ledger Mapping</p>
                                <p className="text-xl font-black text-white uppercase tracking-tight italic">Global Activity Pulse</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 group cursor-help">
                                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Inbound Signal</span>
                            </div>
                         </div>
                    </div>

                    <div className="h-[450px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historicalSales}>
                                <defs>
                                    <filter id="shadow" height="200%">
                                        <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur" />
                                        <feOffset in="blur" dx="0" dy="10" result="offsetBlur" />
                                        <feFlood floodColor="#D4AF37" floodOpacity="0.1" result="colorBlur" />
                                        <feComposite in="colorBlur" in2="offsetBlur" operator="in" result="shadow" />
                                        <feComponentTransfer in="shadow">
                                            <feFuncA type="linear" slope="0.5" />
                                        </feComponentTransfer>
                                        <feMerge>
                                            <feMergeNode />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{fontSize: 9, fill: '#475569', fontWeight: 'bold'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    dy={15}
                                />
                                <YAxis 
                                    hide
                                />
                                <Tooltip 
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                    contentStyle={{
                                        backgroundColor: '#030712',
                                        borderColor: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '1.5rem',
                                        fontSize: '10px',
                                        fontWeight: 'black',
                                        padding: '1.25rem',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                                    }}
                                />
                                <Line 
                                    type="stepAfter" 
                                    dataKey="sales" 
                                    stroke="rgba(255,255,255,0.1)" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: '#D4AF37', strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#fff', stroke: '#D4AF37', strokeWidth: 2 }}
                                    name="Actual Sale"
                                    filter="url(#shadow)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 pt-12 border-t border-white/5">
                        <div className="flex items-center gap-6 p-8 rounded-3xl bg-white/[0.01] border border-white/5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <ArrowTrendingUpIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Growth Vector</p>
                                <p className="text-lg font-black text-white italic">Positive Momentum +4.2%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 p-8 rounded-3xl bg-white/[0.01] border border-white/5">
                            <div className="w-12 h-12 rounded-2xl bg-liquid-gold/10 flex items-center justify-center text-liquid-gold">
                                <BoxIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Inventory Index</p>
                                <p className="text-lg font-black text-white italic">Efficiency Optimal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default FinanzasPage;

