import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    DashboardIcon, 
    AddIcon, 
    KdsIcon, 
    ClientsIcon,
    InventoryIcon,
} from './Icons';
import { motion } from 'framer-motion';
import { MobileActionHub } from './MobileActionHub';
import { CreateClientModal } from './orders/ClientSelector';

export const MobileFloatingNav: React.FC = () => {
    const location = useLocation();
    const [isHubOpen, setIsHubOpen] = useState(false);
    const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);

    const navItems = [
        { path: '/dashboard', icon: DashboardIcon, label: 'Inicio' },
        { path: '/kds', icon: KdsIcon, label: 'Taller' },
        { path: '/nuevo', icon: AddIcon, label: 'Hub', primary: true },
        { path: '/vitrina', icon: InventoryIcon, label: 'Vitrina' },
        { path: '/clientes', icon: ClientsIcon, label: 'Clientes' },
    ];

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden flex justify-center px-6 pb-safe mb-8 pointer-events-none">
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                    className="bg-white/90 dark:bg-[#0c1324]/90 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 rounded-[2.5rem] p-2 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] flex items-center justify-between w-full max-w-sm relative overflow-visible pointer-events-auto"
                >
                    {/* Visual Accent Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-liquid-gold/20 via-transparent to-liquid-gold/20 rounded-[2.6rem] blur-xl opacity-10 pointer-events-none"></div>
                    
                    {navItems.map((item) => {
                        const isCurrentActive = location.pathname === item.path;
                        
                        if (item.primary) {
                            return (
                                <button 
                                    key={item.path}
                                    onClick={() => setIsHubOpen(true)}
                                    className={`
                                        relative -top-8 w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 outline-none
                                        ${isHubOpen 
                                            ? 'bg-liquid-gold text-brand-dark shadow-[0_15px_30px_rgba(212,175,55,0.4)] scale-110 rotate-45' 
                                            : 'bg-brand-dark dark:bg-liquid-gold text-liquid-gold dark:text-brand-dark shadow-xl scale-100'
                                        }
                                    `}
                                >
                                    <motion.div
                                        whileTap={{ scale: 0.85 }}
                                        className={`flex items-center justify-center relative ${isHubOpen ? '-rotate-45' : ''}`}
                                    >
                                        <item.icon className="w-8 h-8" />
                                        {!isHubOpen && !isCurrentActive && (
                                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-liquid-gold opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-liquid-gold"></span>
                                            </span>
                                        )}
                                    </motion.div>
                                </button>
                            );
                        }

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={(props) => `
                                    flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 relative group
                                    ${props.isActive ? 'text-liquid-gold shadow-gold-glow-soft bg-liquid-gold/5' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}
                                `}
                            >
                                {(props) => (
                                    <>
                                        <item.icon className={`w-6 h-6 transition-transform duration-500 ${props.isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                        {props.isActive && (
                                            <motion.div 
                                                layoutId="nav-pill"
                                                className="absolute -bottom-1 w-1 h-1 bg-liquid-gold rounded-full shadow-gold-glow"
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </motion.div>
            </div>

            {/* Action Hub Sheet */}
            <MobileActionHub 
                isOpen={isHubOpen} 
                onClose={() => setIsHubOpen(false)} 
                onOpenCreateClient={() => setIsCreateClientOpen(true)}
            />

            {/* Global Create Client Modal */}
            <CreateClientModal 
                isOpen={isCreateClientOpen}
                onClose={() => setIsCreateClientOpen(false)}
                onClientCreated={(client) => {
                    setIsCreateClientOpen(false);
                }}
            />
        </>
    );
};
