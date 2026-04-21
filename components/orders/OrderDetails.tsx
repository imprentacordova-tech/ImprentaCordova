
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-liquid-gold/20 flex items-center justify-center">
                        <PencilSquareIcon className="w-4 h-4 text-liquid-gold" />
                    </div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Especificaciones Técnicas</h3>
                </div>
                <textarea
                    value={detalle}
                    onChange={e => setDetalle(e.target.value)}
                    placeholder="Describe los detalles del pedido (medidas, tipo de papel, acabados...)"
                    className="w-full h-48 bg-black/40 border border-white/5 rounded-3xl p-6 text-white text-lg placeholder:text-slate-700 focus:border-liquid-gold/30 focus:ring-1 focus:ring-liquid-gold/30 outline-none transition-all resize-none font-medium custom-scrollbar"
                />
            </div>

            <div className="space-y-8">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-liquid-gold/20 flex items-center justify-center">
                            <FlagIcon className="w-4 h-4 text-liquid-gold" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Prioridad del Trabajo</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {prioridades.map(p => (
                            <motion.button
                                key={p.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPrioridad(p.id)}
                                className={`py-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                                    prioridad === p.id 
                                    ? `${p.bg} ${p.border} shadow-lg ring-1 ring-white/10` 
                                    : 'bg-white/5 border-white/5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
                                }`}
                            >
                                <span className={`text-[9px] font-black uppercase tracking-widest ${p.color}`}>{p.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-3 mb-6">
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
                            className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white font-bold focus:border-liquid-gold/30 outline-none transition-all [color-scheme:dark]"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                            <ClockIcon className="w-5 h-5 text-liquid-gold" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-liquid-gold/10 to-transparent rounded-3xl border border-liquid-gold/10 relative overflow-hidden group">
                    <SparklesIcon className="absolute -right-2 -top-2 w-12 h-12 text-liquid-gold/5 rotate-12 transition-transform group-hover:rotate-45 duration-700" />
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest leading-relaxed">
                        Completa toda la información para asegurar que el equipo de producción tenga claros los requerimientos.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
