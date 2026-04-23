
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    DashboardIcon, 
    AddIcon, 
    KdsIcon, 
    ClientsIcon,
    Cog8ToothIcon,
    SparklesIcon
} from './Icons';
import { motion } from 'framer-motion';

export const MobileFloatingNav: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: DashboardIcon, label: 'Inicio' },
        { path: '/kds', icon: KdsIcon, label: 'Producción' },
        { path: '/nuevo', icon: AddIcon, label: 'Nueva', primary: true },
        { path: '/clientes', icon: ClientsIcon, label: 'Clientes' },
        { path: '/configuracion', icon: Cog8ToothIcon, label: 'Ajustes' },
    ];

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 lg:hidden flex justify-center px-4">
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between w-full max-w-md relative overflow-hidden"
            >
                {/* Ambient glow background */}
                <div className="absolute inset-0 bg-gradient-to-t from-liquid-gold/10 to-transparent pointer-events-none opacity-50"></div>
                
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    
                    if (item.primary) {
                        return (
                            <NavLink 
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                                    relative -top-6 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 transform
                                    ${isActive 
                                        ? 'bg-liquid-gold text-black shadow-[0_0_30px_rgba(212,175,55,0.4)] scale-110 rotate-0' 
                                        : 'bg-white text-black hover:bg-liquid-gold shadow-2xl scale-100 hover:scale-105'
                                    }
                                `}
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="flex items-center justify-center"
                                >
                                    <item.icon className={`w-8 h-8 ${isActive ? 'animate-pulse' : ''}`} />
                                    {isActive && (
                                        <motion.div 
                                            layoutId="primary-glow"
                                            className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"
                                        />
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
                                className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-liquid-gold scale-110' : 'text-slate-500 opacity-60'}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-[7px] font-black uppercase tracking-[0.2em] italic">{item.label}</span>
                                
                                {isActive && (
                                    <motion.div 
                                        layoutId="nav-dot"
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
