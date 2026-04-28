
import React from 'react';
import { 
    PencilSquareIcon, FlagIcon, CalendarIcon,
    ClockIcon, SparklesIcon 
} from '../Icons';
import { motion } from 'framer-motion';

interface OrderDetailsProps {
    detalle: string;
    setDetalle: (val: string) => void;
    prioridad: string;
    setPrioridad: (val: string) => void;
    fechaEntrega: string;
    setFechaEntrega: (val: string) => void;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
    detalle, setDetalle,
    prioridad, setPrioridad,
    fechaEntrega, setFechaEntrega
}) => {
    const prioridades = [
        { id: 'baja', label: 'Baja', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-white/5' },
        { id: 'media', label: 'Media', color: 'text-liquid-gold', bg: 'bg-liquid-gold/10', border: 'border-liquid-gold/20' },
        { id: 'alta', label: 'Alta', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-liquid-gold/20 flex items-center justify-center">
                        <PencilSquareIcon className="w-4 h-4 text-liquid-gold" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Especificaciones Técnicas</h3>
                </div>
                <textarea
                    value={detalle}
                    onChange={e => setDetalle(e.target.value)}
                    placeholder="Describe los detalles del pedido (medidas, tipo de papel, acabados...)"
                    className="w-full h-32 md:h-48 bg-black/40 border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 text-base md:text-lg placeholder:text-slate-700 focus:border-liquid-gold/30 focus:ring-1 focus:ring-liquid-gold/30 outline-none transition-all resize-none font-medium custom-scrollbar"
                />
            </div>

            <div className="space-y-6 md:space-y-8">
                <div>
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                        <div className="w-8 h-8 rounded-lg bg-liquid-gold/20 flex items-center justify-center">
                            <FlagIcon className="w-4 h-4 text-liquid-gold" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Prioridad del Trabajo</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                        {prioridades.map(p => (
                            <motion.button
                                key={p.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setPrioridad(p.id)}
                                className={`py-3 md:py-4 rounded-xl md:rounded-2xl border transition-all flex flex-col items-center gap-1 md:gap-2 ${
                                    prioridad === p.id 
                                    ? `${p.bg} ${p.border} shadow-lg ring-1 ring-white/10` 
                                    : 'bg-white/5 border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                                }`}
                            >
                                <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${p.color}`}>{p.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                        <div className="w-8 h-8 rounded-lg bg-liquid-gold/20 flex items-center justify-center">
                            <CalendarIcon className="w-4 h-4 text-liquid-gold" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Fecha Estimada de Entrega</h3>
                    </div>
                    <div className="relative group">
                        <input
                            type="date"
                            value={fechaEntrega}
                            onChange={e => setFechaEntrega(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-5 text-sm md:text-base text-white font-bold focus:border-liquid-gold/30 outline-none transition-all [color-scheme:dark]"
                        />
                        <div className="absolute right-4 md:right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                            <ClockIcon className="w-4 h-4 md:w-5 md:h-5 text-liquid-gold" />
                        </div>
                    </div>
                </div>

                <div className="p-5 md:p-6 bg-gradient-to-br from-liquid-gold/10 to-transparent rounded-2xl md:rounded-3xl border border-liquid-gold/10 relative overflow-hidden group">
                    <SparklesIcon className="absolute -right-2 -top-2 w-10 h-10 md:w-12 md:h-12 text-liquid-gold/5 rotate-12 transition-transform group-hover:rotate-45 duration-700" />
                    <p className="text-[8px] md:text-[9px] text-slate-400 uppercase font-black tracking-widest leading-relaxed">
                        Completa toda la información para asegurar que el equipo de producción tenga claros los requerimientos.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
