
import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export const TelemetryNav: React.FC = () => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [scrollPercentage, setScrollPercentage] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = Math.round((winScroll / height) * 100);
            setScrollPercentage(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[150] pointer-events-none px-6 pb-6 hidden md:block">
            <div className="container mx-auto max-w-6xl flex justify-between items-end">
                {/* Left Telemetry */}
                <div className="bg-brand-blue/40 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 flex flex-col gap-2 font-mono text-[8px] text-slate-500 tracking-[0.5em] uppercase">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                        <span>STREAM_DEPTH: {scrollPercentage}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <span>RENDER_ENGINE: CORDOVA_V4</span>
                    </div>
                </div>

                {/* Center Progress Bar */}
                <div className="flex-grow max-w-xs mx-12 mb-2">
                    <div className="relative h-[2px] bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-brand-red shadow-red-glow"
                            style={{ scaleX, transformOrigin: "0%" }}
                        />
                    </div>
                    <div className="mt-2 flex justify-between text-[6px] font-mono text-white/20 tracking-widest uppercase">
                        <span>INIT_POINT</span>
                        <span>END_PHASE</span>
                    </div>
                </div>

                {/* Right Telemetry */}
                <div className="bg-brand-blue/40 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 flex flex-col gap-2 font-mono text-[8px] text-slate-500 tracking-[0.5em] uppercase text-right">
                    <div className="flex items-center justify-end gap-3">
                        <span>SYS_AUTH: SRI_LEGAL</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shadow-emerald-glow" />
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        <span>LOC: PASAJE_EC</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-red/30" />
                    </div>
                </div>
            </div>
        </div>
    );
};
