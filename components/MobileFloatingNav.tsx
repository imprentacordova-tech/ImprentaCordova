
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    DashboardIcon, 
    AddIcon, 
    KdsIcon, 
    ClientsIcon,
    InventoryIcon
} from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

export const MobileFloatingNav: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: DashboardIcon, label: 'Resumen' },
        { path: '/produccion', icon: KdsIcon, label: 'Talleres' },
        { path: '/nuevo', icon: AddIcon, label: 'Crear', primary: true },
        { path: '/retiros', icon: InventoryIcon, label: 'Vitrina' },
        { path: '/clientes', icon: ClientsIcon, label: 'Clientes' },
    ];

    return (
        <div className="fixed bottom-8 left-0 right-0 z-50 lg:hidden flex justify-center px-6">
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                className="bg-white/95 dark:bg-[#0c1324]/80 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 rounded-[2.5rem] p-2 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] flex items-center justify-between w-full max-w-sm relative overflow-visible"
            >
                {/* Visual Accent Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-liquid-gold/20 via-transparent to-liquid-gold/20 rounded-[2.6rem] blur-xl opacity-20 pointer-events-none"></div>
                
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    
                    if (item.primary) {
                        return (
                            <NavLink 
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                                    relative -top-8 w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500
                                    ${isActive 
                                        ? 'bg-liquid-gold text-brand-dark shadow-[0_15px_30px_rgba(212,175,55,0.4)] scale-110' 
                                        : 'bg-brand-dark dark:bg-liquid-gold text-liquid-gold dark:text-brand-dark shadow-xl scale-100'
                                    }
                                `}
                            >
                                <motion.div
                                    whileTap={{ scale: 0.85 }}
                                    className="flex items-center justify-center relative"
                                >
                                    <item.icon className={`w-8 h-8 ${isActive ? 'animate-pulse' : ''}`} />
                                    {/* Pulse effect */}
                                    {!isActive && (
                                        <div className="absolute inset-0 rounded-full bg-liquid-gold/30 animate-ping opacity-20"></div>
                                    )}
                                </motion.div>
                            </NavLink>
                        );
                    }

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center justify-center flex-1 py-2 relative"
                        >
                            <motion.div
                                whileTap={{ scale: 0.8 }}
                                className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? 'text-liquid-gold scale-110' : 'text-slate-400 dark:text-slate-500 opacity-60 hover:opacity-100'}`}
                            >
                                <div className="relative">
                                    <item.icon className="w-5 h-5" />
                                    {isActive && (
                                        <motion.div 
                                            layoutId="active-nav-glow"
                                            className="absolute inset-0 bg-liquid-gold/20 blur-md rounded-full scale-150 -z-10"
                                        />
                                    )}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${isActive ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
                                
                                {isActive && (
                                    <motion.div 
                                        layoutId="nav-pill"
                                        className="absolute -bottom-1 w-1 h-1 bg-liquid-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,1)]"
                                    />
                                )}
                            </motion.div>
                        </NavLink>
                    );
                })}
            </motion.div>
        </div>
    );
};
