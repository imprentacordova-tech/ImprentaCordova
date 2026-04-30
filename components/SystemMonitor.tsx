
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ActivityIcon, CpuIcon, ZapIcon, ToolIcon, GlobeIcon, BarChartIcon } from './Icons';

export const SystemMonitor: React.FC = () => {
    const [stats, setStats] = useState({
        temp: 24.5,
        ink: 88,
        speed: 1240,
        uptime: '04:12:33',
        status: 'OPTIMAL'
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                temp: +(24 + Math.random() * 2).toFixed(1),
                ink: Math.max(0, prev.ink - (Math.random() > 0.9 ? 0.1 : 0)),
                speed: 1200 + Math.floor(Math.random() * 100)
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 relative overflow-hidden bg-brand-blue/30 border-y border-white/5">
            <div className="absolute inset-0 bg-architect-grid opacity-20" />
            
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    {/* Left side: Terminal Feed */}
                    <div className="w-full lg:w-1/3 space-y-6">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 font-mono text-[10px] space-y-4 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red/50 via-brand-red to-brand-red/50 animate-pulse" />
                            <div className="flex items-center gap-3 mb-6 text-brand-red font-black tracking-[0.3em]">
                                <ActivityIcon className="w-4 h-4 animate-pulse" />
                                LIVE_SYSTEM_LOGS_V4.0
                            </div>
                            <div className="space-y-2 text-slate-500 max-h-[200px] overflow-hidden animate-terminal-flicker">
                                <p className="text-brand-red/60">[SYS] CALIBRATING_ROLAND_PRECISION_AXIS...</p>
                                <p>[INF] SPECTROMETRY_SCAN_COMPLETE: DELTA_E=0.82</p>
                                <p>[INF] INK_VISCOSITY_LEVELS: NOMINAL</p>
                                <p className="text-brand-red/60">[WRN] TEMPERATURE_FLUX_DETECTED: ADJUSTING_COOLING</p>
                                <p>[INF] DATABASE_SYNC_SUCCESSFUL: SUPABASE_CLOUD</p>
                                <p>[INF] NEW_PROJECT_IN_QUEUE: #9942_GIGANTOGRAPHY</p>
                                <p className="text-emerald-500/60">[OK] SYSTEM_STABILITY_INDEX: 99.98%</p>
                            </div>
                            <div className="pt-6 border-t border-white/5 flex justify-between items-center text-slate-600">
                                <span>UPTIME: {stats.uptime}</span>
                                <span className="text-brand-red font-black">STATUS: {stats.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Large Gauge/Main Visual */}
                    <div className="w-full lg:w-1/3 flex flex-col items-center justify-center relative">
                        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                            {/* Rotating Rings */}
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-[0.5px] border-dashed border-brand-red/20 rounded-full"
                            />
                            <motion.div 
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-4 border-[0.5px] border-brand-red/40 rounded-full border-t-transparent border-b-transparent"
                            />
                            
                            <div className="text-center space-y-2 relative z-10">
                                <span className="text-[10px] font-black text-brand-red uppercase tracking-[0.5em] block animate-pulse">Efficiency</span>
                                <span className="text-6xl md:text-8xl font-display font-black text-white italic tracking-tighter">98<span className="text-brand-red">%</span></span>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-brand-red animate-ping" />
                                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-[0.3em]">Precision_Link: Stable</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right side: Stat Grid */}
                    <div className="w-full lg:w-1/3 grid grid-cols-2 gap-6">
                        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl space-y-4 hover:border-brand-red/30 transition-all group">
                            <CpuIcon className="w-6 h-6 text-brand-red group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Core Temp</p>
                                <p className="text-2xl font-display font-black text-white italic">{stats.temp}°C</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl space-y-4 hover:border-brand-red/30 transition-all group">
                            <ZapIcon className="w-6 h-6 text-brand-red group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Ink Reserve</p>
                                <p className="text-2xl font-display font-black text-white italic">{stats.ink.toFixed(1)}%</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl space-y-4 hover:border-brand-red/30 transition-all group">
                            <BarChartIcon className="w-6 h-6 text-brand-red group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Throughput</p>
                                <p className="text-2xl font-display font-black text-white italic">{stats.speed} m²/h</p>
                            </div>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 p-6 rounded-2xl space-y-4 hover:border-brand-red/30 transition-all group">
                            <GlobeIcon className="w-6 h-6 text-brand-red group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Network Latency</p>
                                <p className="text-2xl font-display font-black text-white italic">14ms</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom dimension lines */}
                <div className="mt-20 flex items-center gap-6 justify-center opacity-20">
                    <div className="h-[0.5px] w-24 bg-brand-red" />
                    <div className="flex gap-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-brand-red" />)}
                    </div>
                    <div className="h-[0.5px] w-24 bg-brand-red" />
                </div>
            </div>
        </section>
    );
};
