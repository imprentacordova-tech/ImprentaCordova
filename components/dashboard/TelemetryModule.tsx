import React, { useMemo } from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, 
    XAxis, YAxis, Tooltip, BarChart, Bar, Cell 
} from 'recharts';
import { Trabajo, TrabajoEstado } from '../../types';
import { ActivityEntry } from '../../services/activityLogService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- PRODUCTION PULSE ---
export const ProductionPulse: React.FC<{ trabajos: Trabajo[] }> = ({ trabajos }) => {
    const data = useMemo(() => {
        // Group jobs by day for the last 7 days
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return format(d, 'yyyy-MM-dd');
        });

        return last7Days.map(date => {
            const count = trabajos.filter(t => t.fechaEntrada && t.fechaEntrada.startsWith(date)).length;
            return {
                name: format(new Date(date + 'T00:00:00'), 'EEE', { locale: es }).toUpperCase(),
                jobs: count
            };
        });
    }, [trabajos]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Flujo de Producción</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">Live Pulse</span>
            </div>
            <div className="flex-grow min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#475569', fontSize: 8, fontWeight: 900 }} 
                        />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ color: '#d4af37', fontSize: '10px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#fff', fontSize: '10px', marginBottom: '4px' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="jobs" 
                            stroke="#d4af37" 
                            fillOpacity={1} 
                            fill="url(#colorJobs)" 
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- AREA LOAD ---
export const AreaLoad: React.FC<{ trabajos: Trabajo[] }> = ({ trabajos }) => {
    const data = useMemo(() => {
        const stats = [
            { name: 'DISEÑO', jobs: trabajos.filter(t => t.estado === TrabajoEstado.EN_DISENO).length, color: '#3b82f6' },
            { name: 'PRENSA', jobs: trabajos.filter(t => t.estado === TrabajoEstado.PROCESO).length, color: '#d4af37' },
            { name: 'VITRINA', jobs: trabajos.filter(t => t.estado === TrabajoEstado.VITRINA).length, color: '#f59e0b' },
            { name: 'PEND.', jobs: trabajos.filter(t => t.estado === TrabajoEstado.PENDIENTE).length, color: '#ef4444' }
        ];
        return stats;
    }, [trabajos]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carga por Estación</span>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Optimización</span>
            </div>
            <div className="flex-grow min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#475569', fontSize: 8, fontWeight: 900 }} 
                        />
                        <YAxis hide />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#fff', fontSize: '10px' }}
                        />
                        <Bar dataKey="jobs" radius={[10, 10, 10, 10]} barSize={20}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- LIVE LOGS ---
export const LiveLogs: React.FC<{ logs: ActivityEntry[] }> = ({ logs }) => {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registro de Actividad (NÚCLEO)</span>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-75"></div>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 styled-scrollbar space-y-3 font-mono text-[9px]">
                {logs.length === 0 ? (
                    <div className="text-slate-700 italic">Esperando datos de telemetría...</div>
                ) : logs.slice(0, 15).map((log, i) => (
                    <div key={log.id || i} className="flex gap-3 items-start group border-l border-white/5 pl-3 hover:border-liquid-gold/40 transition-colors">
                        <span className="text-slate-600 shrink-0">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-liquid-gold font-bold uppercase">{log.usuario.split(' ')[0]}</span>
                                <span className="text-[7px] bg-white/5 px-1.5 py-0.5 rounded text-slate-500">{log.accion}</span>
                            </div>
                            <p className="text-slate-400 group-hover:text-slate-200 transition-colors">{log.detalle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
