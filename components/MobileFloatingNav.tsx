import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    DashboardIcon,
    SparklesIcon,
    MonitorIcon,
    ClientsIcon,
    WalletIcon,
    ActivityIcon,
    CloseIcon,
    ArrowRightIcon,
    RocketLaunchIcon,
    CircleStackIcon,
    CalculatorIcon,
    ReceiptIcon
} from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
    path: string;
    icon: React.ElementType;
    label: string;
    primary?: boolean;
}

// ─── Quick Action Hub ─────────────────────────────────────────────────────────
const ActionHub: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const navigate = useNavigate();

    const actions = [
        { label: 'Nueva Orden',         icon: SparklesIcon,     path: '/nuevo',        accent: 'bg-brand-blue text-white' },
        { label: 'Facturar SRI',        icon: ReceiptIcon,      path: '/facturacion',  accent: 'bg-emerald-600 text-white' },
        { label: 'Despacho',           icon: RocketLaunchIcon,  path: '/retiros',      accent: 'bg-slate-900 text-white' },
        { label: 'Taller KDS',         icon: MonitorIcon,       path: '/kds',          accent: 'bg-purple-600 text-white' },
        { label: 'Inventario',         icon: CircleStackIcon,   path: '/inventario',   accent: 'bg-emerald-600 text-white' },
        { label: 'Cuentas',            icon: WalletIcon,        path: '/cuentas',      accent: 'bg-rose-500 text-white' },
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-end"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="w-full bg-white rounded-t-3xl p-6 pb-safe"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Handle bar */}
                    <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-6" />

                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-wider">Acciones rápidas</h3>
                        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {actions.map((action, idx) => (
                            <motion.button
                                key={action.path}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.04 }}
                                onClick={() => { navigate(action.path); onClose(); }}
                                className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 active:scale-95 transition-all"
                            >
                                <div className={`w-10 h-10 rounded-xl ${action.accent} flex items-center justify-center`}>
                                    <action.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black text-slate-700 text-center leading-tight">
                                    {action.label}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest justify-center">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            Sistema Imprenta Córdova — En línea
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const MobileFloatingNav: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isHubOpen, setIsHubOpen] = useState(false);

    const navItems: NavItem[] = [
        { path: '/dashboard',  icon: DashboardIcon, label: 'Inicio' },
        { path: '/trabajos',   icon: ActivityIcon,  label: 'Órdenes' },
        { path: '__hub__',     icon: SparklesIcon,  label: 'Acciones', primary: true },
        { path: '/cuentas',    icon: WalletIcon,    label: 'Cobrar' },
        { path: '/clientes',   icon: ClientsIcon,   label: 'Clientes' },
    ];

    return (
        <>
            {/* Floating Nav Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden flex justify-center px-5 pb-5 pointer-events-none">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.2 }}
                    className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-[22px] px-2 py-2 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.15)] flex items-center justify-between w-full max-w-[360px] pointer-events-auto"
                >
                    {navItems.map(item => {
                        if (item.primary) {
                            return (
                                <button
                                    key="hub"
                                    onClick={() => setIsHubOpen(true)}
                                    className="relative -mt-7 w-14 h-14 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-blue-glow-sm active:scale-95 transition-all"
                                >
                                    <motion.div
                                        animate={isHubOpen ? { rotate: 45 } : { rotate: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <item.icon className="w-6 h-6" />
                                    </motion.div>
                                    {/* Pulse ring */}
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-40" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-blue" />
                                    </span>
                                </button>
                            );
                        }

                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300 min-w-[52px] ${
                                    isActive ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                                <span className={`text-[8px] font-black uppercase tracking-wider mt-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-dot"
                                        className="absolute bottom-2 w-1 h-1 bg-brand-blue rounded-full"
                                    />
                                )}
                            </NavLink>
                        );
                    })}
                </motion.div>
            </div>

            {/* Action Hub Sheet */}
            <AnimatePresence>
                {isHubOpen && <ActionHub onClose={() => setIsHubOpen(false)} />}
            </AnimatePresence>
        </>
    );
};
