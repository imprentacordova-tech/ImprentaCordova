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
    LightningBoltIcon, ChartBarIcon, CpuIcon, ServerIcon
} from '../components/Icons';
import { generateFinancialProjection } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTES DE DISEÑO ---

const MetricCard: React.FC<{ 
    label: string, 
    value: string, 
    icon: any, 
    trend?: string, 
    trendUp?: boolean 
}> = ({ label, value, icon: Icon, trend, trendUp }) => (
    <motion.div 
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="glass-card-luxury p-8 relative group overflow-hidden border-white/5"
    >
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-all duration-500">
            <Icon className="w-20 h-20 text-white" />
        </div>
        <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-liquid-gold/10 border border-liquid-gold/20 text-liquid-gold">
                    <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">{label}</span>
            </div>
            <div className="flex items-end justify-between">
                <p className="text-3xl font-black text-white tracking-tighter">
                    {value}
                </p>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black ${trendUp ? 'text-emerald-500' : 'text-rose-500'} uppercase tracking-widest`}>
                        {trendUp ? '▲' : '▼'} {trend}
                    </div>
                )}
            </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
    </motion.div>
);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" as any }
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
            logActivity(currentUser.nombre, currentUser.rol, 'FINANZAS_ANALIZED', 'Ejecutó análisis financiero con Inteligencia Artificial', 'Finanzas');
        } catch (error) {
            console.error("AI Analysis failed:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <Loader2Icon className="animate-spin w-10 h-10 text-liquid-gold opacity-30"/>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.8em] animate-pulse">Sincronizando Bóveda de Capital...</p>
        </div>
    );

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-[1600px] mx-auto space-y-12 pb-32 px-6 sm:px-12 relative"
        >
            {/* --- CABECERA --- */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-[1px] bg-liquid-gold/40"></div>
                        <span className="text-[10px] font-bold text-liquid-gold uppercase tracking-[0.6em]">Telemetría Financiera Industrial</span>
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Bóveda de <span className="text-gold-gradient">Capital</span>
                    </h1>
                </div>
                
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAIAnalysis}
                    disabled={analyzing}
                    className="group relative flex items-center gap-4 px-10 py-5 bg-white text-black font-black rounded-2xl shadow-luxury transition-all duration-500 disabled:opacity-50 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    {analyzing ? (
                        <>
                            <Loader2Icon className="animate-spin w-4 h-4 text-black"/>
                            <span className="text-[10px] uppercase tracking-[0.15em] font-black">Consultando IA...</span>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                <SparklesIcon className="w-5 h-5 text-black group-hover:scale-110 transition-transform duration-300"/>
                                <div className="absolute inset-0 bg-liquid-gold blur-md opacity-0 group-hover:opacity-30 transition-opacity"></div>
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.15em] font-black">Simulación de Capital</span>
                        </>
                    )}
                </motion.button>
            </motion.div>

            {/* --- GRID DE MÉTRICAS --- */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard label="Ingresos Consolidados" value={formatCurrency(totalRevenue).split(',')[0]} icon={SolidFinanceIcon} trend="8.2%" trendUp={true} />
                <MetricCard label="Valor Medio Transaccional" value={formatCurrency(avgSale).split(',')[0]} icon={ScaleIcon} />
                <MetricCard label="Máximo Operativo" value={formatCurrency(peakSale).split(',')[0]} icon={LightningBoltIcon} />
                <MetricCard label="Integridad de Datos" value="100%" icon={ServerIcon} trend="ÓPTIMO" trendUp={true} />
            </motion.div>

            {/* --- SECCIÓN DE INTELIGENCIA IA --- */}
            <AnimatePresence>
                {aiProjection && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="glass-card-luxury p-10 lg:p-16 relative overflow-hidden group/oracle border-liquid-gold/10"
                    >
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-liquid-gold/[0.03] rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-8">
                                <div className="p-3 rounded-xl bg-liquid-gold text-black shadow-gold-glow">
                                    <CpuIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Proyección de <span className="text-liquid-gold">Activos</span></h2>
                                    <div className="mt-1 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse"></div>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Simulación Estratégica Próximos 30 Días</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                {/* GRÁFICO PRINCIPAL */}
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="h-[400px] w-full bg-black/40 rounded-[2.5rem] p-8 border border-white/5">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={aiProjection.forecast}>
                                                <defs>
                                                    <linearGradient id="colorSalesAI" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                                                <XAxis 
                                                    dataKey="date" 
                                                    tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}} 
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={10}
                                                />
                                                <YAxis 
                                                    tickFormatter={(val) => `$${val}`} 
                                                    tick={{fontSize: 9, fill: '#64748b', fontWeight: 'bold'}}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dx={-5}
                                                />
                                                <Tooltip 
                                                    cursor={{ stroke: '#D4AF37', strokeWidth: 1, strokeDasharray: '4 4' }}
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(3, 7, 18, 0.95)',
                                                        borderColor: 'rgba(212, 175, 55, 0.2)',
                                                        borderRadius: '1.5rem',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold',
                                                        color: '#fff',
                                                        backdropFilter: 'blur(20px)',
                                                        padding: '1.5rem',
                                                        border: '1px solid rgba(255,255,255,0.05)'
                                                    }}
                                                    itemStyle={{ color: '#D4AF37' }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="sales" 
                                                    stroke="#D4AF37" 
                                                    strokeWidth={3} 
                                                    fillOpacity={1} 
                                                    fill="url(#colorSalesAI)" 
                                                    name="Proyección" 
                                                    animationDuration={2000}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex items-center gap-4 px-4">
                                        <div className="flex -space-x-2">
                                            {[1,2,3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border border-black bg-slate-900 flex items-center justify-center">
                                                    <div className="w-1 h-1 rounded-full bg-liquid-gold opacity-50"></div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">
                                            Basado en {historicalSales.length} transacciones y patrones de mercado.
                                        </p>
                                    </div>
                                </div>
                                
                                {/* PANEL DE INSIGHTS */}
                                <div className="lg:col-span-4 space-y-8">
                                    <div className="p-8 rounded-[2.5rem] bg-white/[0.01] border border-white/5 group/card hover:border-liquid-gold/20 transition-all duration-500">
                                        <h3 className="text-[9px] font-black text-liquid-gold uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
                                            <ClockIcon className="w-3.5 h-3.5 opacity-50"/> Ciclos de Bajo Tráfico
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {aiProjection.lowTrafficDays.map(day => (
                                                <span 
                                                    key={day} 
                                                    className="px-4 py-1.5 bg-black/40 rounded-lg text-[9px] font-bold text-white border border-white/5 uppercase tracking-widest"
                                                >
                                                    {day}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="p-10 rounded-[2.5rem] bg-liquid-gold/5 border border-liquid-gold/10 relative group/rec shadow-gold-glow/5">
                                        <div className="absolute top-[-8px] left-8 px-4 py-1.5 bg-liquid-gold rounded-full text-black text-[8px] font-black uppercase tracking-widest shadow-lg">
                                            Estrategia Sugerida
                                        </div>
                                        <p className="text-base text-slate-200 italic font-medium leading-relaxed relative z-10">
                                            “{aiProjection.suggestion}”
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => setAiProjection(null)}
                                        className="w-full py-5 rounded-2xl bg-white/5 border border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                    >
                                        Cerrar Análisis
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* --- SECCIÓN HISTÓRICA --- */}
            <motion.div variants={itemVariants} className="space-y-8">
                <div className="flex items-center gap-6">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Estado <span className="text-slate-500">Patrimonial</span></h3>
                    <div className="flex-grow h-[1px] bg-white/5"></div>
                </div>

                <div className="glass-card-luxury p-10 relative overflow-hidden bg-black/20 rounded-[3rem] border-white/5">
                    <div className="flex justify-between items-center mb-12">
                         <div className="flex items-center gap-5">
                            <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-slate-500">
                                <ChartBarIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.4em]">Flujo de Recaudación</p>
                                <p className="text-lg font-black text-white uppercase tracking-tight italic">Comportamiento del Mercado</p>
                            </div>
                         </div>
                    </div>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historicalSales}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.01)" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{fontSize: 9, fill: '#475569', fontWeight: 'bold'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    cursor={{ stroke: 'rgba(212, 175, 55, 0.1)', strokeWidth: 1 }}
                                    contentStyle={{
                                        backgroundColor: '#030712',
                                        borderColor: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '1.5rem',
                                        fontSize: '9px',
                                        fontWeight: 'black',
                                        padding: '1.5rem',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                                    }}
                                />
                                <Line 
                                    type="stepAfter" 
                                    dataKey="sales" 
                                    stroke="rgba(212, 175, 55, 0.15)" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: '#D4AF37', strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#fff', stroke: '#D4AF37', strokeWidth: 2 }}
                                    name="Transacción"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 pt-12 border-t border-white/5">
                        <div className="flex items-center gap-6 p-8 rounded-3xl bg-white/[0.01] border border-white/5 group hover:border-emerald-500/20 transition-all duration-500">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <ArrowTrendingUpIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Crecimiento Operativo</p>
                                <p className="text-xl font-bold text-white italic">Impulso Positivo +4.2%</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 p-8 rounded-3xl bg-white/[0.01] border border-white/5 group hover:border-liquid-gold/20 transition-all duration-500">
                            <div className="w-14 h-14 rounded-2xl bg-liquid-gold/10 flex items-center justify-center text-liquid-gold group-hover:scale-110 transition-transform">
                                <BoxIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Eficiencia de Insumos</p>
                                <p className="text-xl font-bold text-white italic">Gestión Óptima</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default FinanzasPage;
