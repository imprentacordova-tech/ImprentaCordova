
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
        { id: 'baja', label: 'Baja', color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' },
        { id: 'media', label: 'Media', color: 'text-brand-blue', bg: 'bg-brand-blue/10', border: 'border-brand-blue/20' },
        { id: 'alta', label: 'Alta', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-fade-in">
            <div className="space-y-6 md:space-y-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shadow-sm">
                        <PencilSquareIcon className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">FASE_ESPECIFICACIÓN</h3>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Detalles de Producción</p>
                    </div>
                </div>
                <div className="relative group">
                    <textarea
                        value={detalle}
                        onChange={e => setDetalle(e.target.value)}
                        placeholder="DESCRIBE LOS PARÁMETROS TÉCNICOS (MEDIDAS, MATERIAL, ACABADOS)..."
                        className="w-full h-40 md:h-64 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 md:p-8 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:border-brand-blue/30 focus:bg-white transition-all resize-none outline-none shadow-sm uppercase tracking-tight"
                    />
                    <div className="absolute bottom-6 right-6 opacity-20 group-focus-within:opacity-100 transition-opacity">
                        <SparklesIcon className="w-6 h-6 text-brand-blue" />
                    </div>
                </div>
            </div>

            <div className="space-y-8 md:space-y-12">
                <div>
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shadow-sm">
                            <FlagIcon className="w-5 h-5 text-brand-blue" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">NIVEL_CRITICIDAD</h3>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Prioridad del Vector</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        {prioridades.map(p => (
                            <motion.button
                                key={p.id}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setPrioridad(p.id)}
                                className={`py-4 md:py-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                                    prioridad === p.id 
                                    ? `${p.bg} ${p.border} shadow-md` 
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                }`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${prioridad === p.id ? p.color : 'text-slate-400'}`}>{p.label}</span>
                                {prioridad === p.id && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center shadow-sm">
                            <CalendarIcon className="w-5 h-5 text-brand-blue" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">CRONOGRAMA_ENTREGA</h3>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Fecha de Finalización</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <input
                            type="date"
                            value={fechaEntrega}
                            onChange={e => setFechaEntrega(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-[1.5rem] p-5 md:p-6 text-base md:text-lg text-slate-900 font-black focus:border-brand-blue/30 focus:bg-white outline-none transition-all uppercase tracking-widest shadow-sm"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-brand-blue transition-colors">
                            <ClockIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-brand-blue/10 transition-colors" />
                    <p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] leading-relaxed relative z-10">
                        VALIDE TODA LA INFORMACIÓN TÉCNICA PARA GARANTIZAR LA INTEGRIDAD DEL PROCESO PRODUCTIVO.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
