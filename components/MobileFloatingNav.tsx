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
                    className="bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2.2rem] p-2 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex items-center justify-between w-full max-w-sm relative overflow-hidden pointer-events-auto"
                >
                    {/* Elite Industrial Accents */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-liquid-gold/20 animate-scan pointer-events-none" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-liquid-gold/10 via-transparent to-liquid-gold/10 rounded-[2.3rem] blur-xl opacity-50 pointer-events-none"></div>
                    
                    {navItems.map((item) => {
                        const isCurrentActive = location.pathname === item.path;
                        
                        if (item.primary) {
                            return (
                                <div key={item.path} className="relative px-2">
                                    {/* Action Hub Button Refined */}
                                    <button 
                                        onClick={() => setIsHubOpen(true)}
                                        className={`
                                            relative -top-6 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 outline-none overflow-hidden
                                            ${isHubOpen 
                                                ? 'bg-liquid-gold text-black shadow-gold-glow scale-110 rotate-45' 
                                                : 'bg-[#1a2333] text-liquid-gold border border-liquid-gold/30 shadow-lg scale-100'
                                            }
                                        `}
                                    >
                                        {/* Internal Sheen for Primary Button */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full hover:animate-sheen pointer-events-none" />
                                        
                                        <motion.div
                                            whileTap={{ scale: 0.9 }}
                                            className={`flex items-center justify-center relative ${isHubOpen ? '-rotate-45' : ''}`}
                                        >
                                            <item.icon className="w-7 h-7" />
                                            {!isHubOpen && (
                                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-liquid-gold opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-liquid-gold"></span>
                                                </span>
                                            )}
                                        </motion.div>
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={(props) => `
                                    flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-500 relative group
                                    ${props.isActive ? 'text-liquid-gold bg-white/5 shadow-[inset_0_0_20px_rgba(212,175,55,0.1)]' : 'text-slate-500 hover:text-slate-300'}
                                `}
                            >
                                {(props) => (
                                    <>
                                        <item.icon className={`w-5 h-5 transition-all duration-500 ${props.isActive ? 'scale-110 drop-shadow-gold' : 'group-hover:scale-110'}`} />
                                        {props.isActive && (
                                            <motion.div 
                                                layoutId="nav-pill-mobile"
                                                className="absolute bottom-1.5 w-1 h-1 bg-liquid-gold rounded-full shadow-gold-glow"
                                            />
                                        )}
                                        {/* Subtle Hover Indicator */}
                                        {!props.isActive && (
                                            <div className="absolute bottom-1 w-0 h-[1px] bg-liquid-gold/50 group-hover:w-2 transition-all duration-300"></div>
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
