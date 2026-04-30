
import React from 'react';
import { motion } from 'framer-motion';
import { 
    PaletteIcon, CpuIcon, PrinterIcon, ShieldCheckIcon, 
    TruckIcon, LayersIcon, CheckBadgeIcon, ZapIcon 
} from './Icons';

const steps = [
    {
        id: '01',
        title: 'Ingeniería de Diseño',
        desc: 'Conceptualización técnica y optimización de archivos para alta resolución.',
        icon: PaletteIcon,
        tech: 'VECTOR_ALIGNED',
        color: 'text-brand-red'
    },
    {
        id: '02',
        title: 'Calibración Roland',
        desc: 'Sincronización de perfiles ICC y alineación micrométrica de cabezales.',
        icon: CpuIcon,
        tech: '1440_DPI_PRECISION',
        color: 'text-brand-red'
    },
    {
        id: '03',
        title: 'Producción Elite',
        desc: 'Impresión industrial con tintas eco-solventes de máxima durabilidad.',
        icon: PrinterIcon,
        tech: 'ECO_SOL_GEN2',
        color: 'text-brand-red'
    },
    {
        id: '04',
        title: 'Control de Calidad',
        desc: 'Inspección óptica y verificación de acabados según estándar Córdova.',
        icon: ShieldCheckIcon,
        tech: 'OPTIC_VERIFIED',
        color: 'text-brand-red'
    }
];

export const ProductionWorkflow: React.FC = () => {
    return (
        <section className="py-32 relative overflow-hidden bg-brand-blue/30">
            {/* Grid background */}
            <div className="absolute inset-0 bg-architect-grid opacity-20 pointer-events-none" />
            
            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
                    <div className="max-w-2xl">
                        <span className="text-brand-red font-black text-[10px] uppercase tracking-[0.5em] mb-6 block italic">Protocolo de Manufactura</span>
                        <h2 className="text-4xl md:text-6xl lg:text-8xl font-display font-black text-white uppercase tracking-[-0.04em] leading-none italic">
                            PRECISIÓN EN <br/> <span className="text-shimmer-gold">CADA ETAPA</span>
                        </h2>
                    </div>
                    <div className="hidden lg:block text-right space-y-2 border-r-2 border-brand-red/20 pr-8">
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em]">SYSTEM_STATUS: NOMINAL</p>
                        <p className="text-[10px] font-mono text-brand-red/60 uppercase tracking-[0.4em]">ACTIVE_WORKFLOW: CORDOVA_V4</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                    {/* Connecting Line (Horizontal on desktop) */}
                    <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-brand-red/20 to-transparent hidden lg:block -translate-y-1/2" />
                    
                    {steps.map((step, idx) => (
                        <motion.div 
                            key={step.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                            className="group relative"
                        >
                            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] hover:border-brand-red/30 transition-all duration-700 relative overflow-hidden h-full flex flex-col">
                                <div className="absolute top-0 right-0 p-8 font-mono text-[10px] text-brand-red/20 tracking-widest font-black group-hover:text-brand-red/40 transition-colors">
                                    {step.id}
                                </div>
                                
                                <div className="w-20 h-20 bg-brand-red/5 border border-brand-red/20 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-brand-red/10 group-hover:border-brand-red/40 transition-all duration-700 shadow-red-glow-soft">
                                    <step.icon className={`w-10 h-10 ${step.color}`} />
                                </div>

                                <h3 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter mb-4 group-hover:text-brand-red transition-colors leading-none">
                                    {step.title}
                                </h3>
                                
                                <p className="text-slate-500 text-sm font-medium italic leading-relaxed mb-8 flex-grow">
                                    {step.desc}
                                </p>

                                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{step.tech}</span>
                                    <ZapIcon className="w-4 h-4 text-brand-red/30 group-hover:text-brand-red group-hover:scale-125 transition-all" />
                                </div>

                                {/* Animated background element */}
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-red/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
