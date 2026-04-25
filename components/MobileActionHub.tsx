
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from './BottomSheet';
import { 
    PlusIcon, UserPlusIcon, PrinterIcon, SolidBoxIcon, 
    BoltIcon, SparklesIcon, ChartBarIcon, SettingsIcon,
    ArrowRightIcon
} from './Icons';

interface ActionHubProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenCreateClient: () => void;
}

export const MobileActionHub: React.FC<ActionHubProps> = ({ isOpen, onClose, onOpenCreateClient }) => {
    const navigate = useNavigate();

    const handleAction = (path: string) => {
        navigate(path);
        onClose();
    };

    const actions = [
        {
            id: 'new-order',
            title: 'Nuevo Pedido',
            subtitle: 'Crear nuevo trabajo',
            icon: PlusIcon,
            color: 'bg-liquid-gold',
            textColor: 'text-black',
            onClick: () => handleAction('/nuevo')
        },
        {
            id: 'new-client',
            title: 'Registrar Cliente',
            subtitle: 'Listo para el SRI',
            icon: UserPlusIcon,
            color: 'bg-blue-500',
            textColor: 'text-white',
            onClick: () => {
                onOpenCreateClient();
                onClose();
            }
        },
        {
            id: 'kds',
            title: 'Producción KDS',
            subtitle: 'Monitorear taller',
            icon: PrinterIcon,
            color: 'bg-emerald-500',
            textColor: 'text-white',
            onClick: () => handleAction('/kds')
        },
        {
            id: 'vitrina',
            title: 'Vitrina Digital',
            subtitle: 'Estado de Inventario',
            icon: SolidBoxIcon,
            color: 'bg-purple-500',
            textColor: 'text-white',
            onClick: () => handleAction('/vitrina')
        }
    ];

    const secondaryActions = [
        { id: 'stats', label: 'Estadísticas', icon: ChartBarIcon, path: '/dashboard' },
        { id: 'settings', label: 'Ajustes', icon: SettingsIcon, path: '/ajustes' },
        { id: 'history', label: 'Historial', icon: BoltIcon, path: '/pedidos' },
    ];

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Centro de Operaciones">
            <div className="space-y-8">
                {/* Primary Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {actions.map((action) => (
                        <motion.button
                            key={action.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={action.onClick}
                            className="flex flex-col items-start p-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-[2rem] text-left group hover:border-liquid-gold/30 transition-all"
                        >
                            <div className={`w-12 h-12 ${action.color} ${action.textColor} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                                <action.icon className="w-6 h-6" />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                {action.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                {action.subtitle}
                            </p>
                        </motion.button>
                    ))}
                </div>

                {/* Secondary Actions List */}
                <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 mb-4">
                        Gestión del Sistema
                    </h5>
                    <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden divide-y divide-slate-200 dark:divide-white/5">
                        {secondaryActions.map((action) => (
                            <button
                                key={action.id}
                                onClick={() => handleAction(action.path)}
                                className="w-full flex items-center justify-between p-5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-liquid-gold transition-colors">
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                                        {action.label}
                                    </span>
                                </div>
                                <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Info / Tip */}
                <div className="p-6 bg-liquid-gold/5 border border-liquid-gold/10 rounded-[2rem] flex items-center gap-4">
                    <div className="w-10 h-10 bg-liquid-gold rounded-full flex items-center justify-center text-black shadow-gold-glow-sm">
                        <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[9px] text-liquid-gold font-black uppercase tracking-widest mb-1">Tip de Productividad</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Usa el Buscador Rápido (arriba) para encontrar pedidos por # de orden.</p>
                    </div>
                </div>
            </div>
        </BottomSheet>
    );
};
