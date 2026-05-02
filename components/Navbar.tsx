import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
    CordovaLogo, MenuIcon, CloseIcon, WhatsAppIcon,
    ArrowRightIcon, SparklesIcon, ShieldCheckIcon, PrinterIcon,
    FingerPrintIcon, HomeIcon, ActivityIcon, BoxIcon, WalletIcon
} from './Icons';

// ── Enlaces de Navegación Maestro ──────────────────────────────────────────────
const navLinks = [
    { name: 'Dashboard',   href: '/dashboard', icon: HomeIcon },
    { name: 'Misiones',    href: '/trabajos',  icon: ActivityIcon },
    { name: 'Inventario',  href: '/inventario', icon: BoxIcon },
    { name: 'Finanzas',    href: '/cuentas',    icon: WalletIcon },
    { name: 'Rastreo',     href: '/tracking',   icon: ShieldCheckIcon },
];

// ── Navbar Principal Elite ───────────────────────────────────────────────────
const Navbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* ── Ticker de Telemetría (Cinta de Seguridad Industrial) ── */}
            <div className="fixed top-0 inset-x-0 z-[160] h-10 bg-brand-dark flex items-center justify-center overflow-hidden px-6 border-b border-white/5">
                <div className="absolute inset-0 bg-architect-grid opacity-[0.05] pointer-events-none" />
                <div className="flex items-center gap-10 text-white/40 relative z-10 whitespace-nowrap animate-marquee md:animate-none">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse shadow-gold-glow" />
                        <span className="text-[9px] font-black uppercase tracking-[0.5em] italic">
                            IMPRENTA CÓRDOVA <span className="mx-2 opacity-20">//</span> <span className="text-liquid-gold">ESTÁNDAR_ELITE_V4.2</span>
                        </span>
                    </div>
                    <div className="hidden lg:flex items-center gap-6 text-[8px] font-mono uppercase tracking-[0.4em]">
                        <span className="opacity-50">NODE: PASAJE_CENTRO</span>
                        <span className="text-emerald-500/60">STATUS: NOMINAL</span>
                        <span className="opacity-50">LAT: 3.3282° S, LONG: 79.8066° W</span>
                    </div>
                </div>
            </div>

            {/* ── Barra de Navegación Principal ── */}
            <nav
                className={`fixed top-10 inset-x-0 z-[150] transition-all duration-700 ${
                    scrolled
                        ? 'bg-brand-dark/95 backdrop-blur-3xl border-b border-white/10 shadow-2xl py-3'
                        : 'bg-transparent py-6'
                }`}
            >
                <div className="container mx-auto px-6 lg:px-14">
                    <div className="flex items-center justify-between h-20">

                        {/* ── Brand Unit ── */}
                        <Link
                            to="/"
                            className="group flex items-center gap-5 shrink-0 transition-transform hover:scale-105"
                        >
                            <div className="relative">
                                <CordovaLogo className="h-10 w-auto brightness-0 invert group-hover:scale-110 transition-all duration-1000" />
                                <div className="absolute -inset-3 bg-liquid-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="font-black text-2xl italic text-white tracking-tighter">CÓRDOVA<span className="text-liquid-gold opacity-50">.</span></span>
                                <span className="font-black text-[9px] text-slate-500 tracking-[0.5em] uppercase italic">Industrial Hub</span>
                            </div>
                        </Link>

                        {/* ── Desktop Command Links ── */}
                        <div className="hidden lg:flex items-center gap-2">
                            {navLinks.map(link => {
                                const isActive = location.pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        className={`group relative px-8 py-3 text-[10px] font-black uppercase tracking-[0.4em] transition-all duration-500 italic ${
                                            isActive ? 'text-liquid-gold' : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <span className="relative z-10">{link.name}</span>
                                        {isActive && (
                                            <motion.div 
                                                layoutId="navGlow"
                                                className="absolute inset-0 bg-liquid-gold/5 rounded-xl border border-liquid-gold/20 shadow-gold-glow-soft"
                                            />
                                        )}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-liquid-gold transition-all duration-500 group-hover:w-1/2 opacity-0 group-hover:opacity-100" />
                                    </Link>
                                );
                            })}
                        </div>

                        {/* ── Action Nodes ── */}
                        <div className="flex items-center gap-5">
                            <Link 
                                to="/nuevo-pedido" 
                                className="hidden md:flex items-center gap-4 px-10 py-5 bg-liquid-gold text-brand-dark rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:scale-[1.05] active:scale-95 transition-all shadow-gold-glow italic"
                            >
                                <SparklesIcon className="w-5 h-5" /> NUEVA_MISIÓN
                            </Link>

                            <button
                                onClick={() => setIsOpen(true)}
                                className="p-5 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:border-liquid-gold/30 transition-all active:scale-90 lg:hidden group"
                            >
                                <MenuIcon className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Menú Móvil Terminal Full-Screen ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[200] bg-brand-dark/98 backdrop-blur-3xl p-10 flex flex-col justify-between overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-architect-grid opacity-[0.05] pointer-events-none" />
                        
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-liquid-gold animate-pulse shadow-gold-glow" />
                                <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em] italic">ADMIN_TERMINAL_V4</span>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-6 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-rose-500 transition-colors"
                            >
                                <CloseIcon className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="space-y-10 relative z-10 mt-10">
                            {navLinks.map((link, idx) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 * idx }}
                                >
                                    <Link
                                        to={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className="group flex items-center justify-between text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic hover:text-liquid-gold transition-all"
                                    >
                                        <span>{link.name}</span>
                                        <ArrowRightIcon className="w-10 h-10 opacity-0 -translate-x-10 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-liquid-gold" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        <div className="pt-10 border-t border-white/10 relative z-10 space-y-10">
                            <Link
                                to="/nuevo-pedido"
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center justify-center gap-8 py-9 bg-liquid-gold text-brand-dark rounded-[2.5rem] text-[13px] font-black uppercase tracking-[0.5em] italic shadow-gold-glow active:scale-95"
                            >
                                <SparklesIcon className="w-8 h-8" /> NUEVA_MISIÓN_DIRECTA
                            </Link>
                            
                            <div className="flex justify-between items-center px-4">
                                <div className="flex items-center gap-3">
                                    <FingerPrintIcon className="w-5 h-5 text-slate-700" />
                                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">AUTH_CONFIRMED</span>
                                </div>
                                <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.4em] italic">V4.2.0_ELITE</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
