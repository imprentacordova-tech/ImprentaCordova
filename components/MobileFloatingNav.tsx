
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    DashboardIcon, 
    AddIcon, 
    KdsIcon, 
    ClientsIcon,
    Cog8ToothIcon 
} from './Icons';

export const MobileFloatingNav: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', icon: DashboardIcon, label: 'Panel' },
        { path: '/kds', icon: KdsIcon, label: 'Producción' },
        { path: '/nuevo', icon: AddIcon, label: 'Nueva', primary: true },
        { path: '/clientes', icon: ClientsIcon, label: 'Clientes' },
        { path: '/configuracion', icon: Cog8ToothIcon, label: 'Ajustes' },
    ];

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 lg:hidden w-[90%] max-w-md">
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 shadow-2xl flex items-center justify-between relative overflow-hidden group">
                {/* Ambient glow background */}
                <div className="absolute inset-0 bg-gradient-to-t from-liquid-gold/5 to-transparent pointer-events-none"></div>
                
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    
                    if (item.primary) {
                        return (
                            <NavLink 
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                                    relative -top-4 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500
                                    ${isActive 
                                        ? 'bg-liquid-gold text-black shadow-gold-glow scale-110' 
                                        : 'bg-white text-black hover:bg-liquid-gold shadow-luxury'
                                    }
                                `}
                            >
                                <item.icon className="w-8 h-8" />
                            </NavLink>
                        );
                    }

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1.5 px-4 py-2 transition-all duration-500 ${isActive ? 'text-liquid-gold' : 'text-slate-500'}`}
                        >
                            <item.icon className={`w-6 h-6 transition-all ${isActive ? 'scale-110 shadow-gold-glow-sm' : 'opacity-60'}`} />
                            <span className="text-[8px] font-black uppercase tracking-tighter italic">{item.label}</span>
                            {isActive && (
                                <div className="w-1 h-1 bg-liquid-gold rounded-full shadow-gold-glow animate-pulse"></div>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};
