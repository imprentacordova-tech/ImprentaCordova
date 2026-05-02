import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
    CordovaLogo, MenuIcon, CloseIcon, WhatsAppIcon,
    ArrowRightIcon, SparklesIcon, ShieldCheckIcon,
    HomeIcon, ActivityIcon, BoxIcon, WalletIcon
} from './Icons';

const publicNavLinks = [
    { name: 'Inicio',      href: '/',         icon: HomeIcon },
    { name: 'Catálogo',    href: '/vitrina',  icon: BoxIcon },
    { name: 'Rastreo',     href: '/tracking', icon: ShieldCheckIcon },
];

const PublicNavbar: React.FC = () => {
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
            <nav
                className={`fixed top-0 inset-x-0 z-[150] transition-all duration-700 ${
                    scrolled
                        ? 'bg-brand-dark/90 backdrop-blur-3xl border-b border-white/5 py-4'
                        : 'bg-transparent py-8'
                }`}
            >
                <div className="container mx-auto px-6 lg:px-14">
                    <div className="flex items-center justify-between h-16">

                        {/* Brand Unit */}
                        <Link
                            to="/"
                            className="group flex items-center gap-5 shrink-0 transition-transform hover:scale-105"
                        >
                            <div className="relative">
                                <CordovaLogo className="h-9 w-auto brightness-0 invert group-hover:scale-110 transition-all duration-1000" />
                                <div className="absolute -inset-3 bg-liquid-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="font-black text-xl italic text-white tracking-tighter uppercase">CÓRDOVA<span className="text-liquid-gold">.</span></span>
                                <span className="font-black text-[8px] text-slate-500 tracking-[0.4em] uppercase italic">Industrial Hub</span>
                            </div>
                        </Link>

                        {/* Desktop Links */}
                        <div className="hidden lg:flex items-center gap-4">
                            {publicNavLinks.map(link => {
                                const isActive = location.pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        className={`group relative px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 italic ${
                                            isActive ? 'text-liquid-gold' : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <span className="relative z-10">{link.name}</span>
                                        {isActive && (
                                            <motion.div 
                                                layoutId="publicNavGlow"
                                                className="absolute inset-0 bg-liquid-gold/5 rounded-xl border border-liquid-gold/10 shadow-gold-glow-soft"
                                            />
                                        )}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1.5px] bg-liquid-gold transition-all duration-500 group-hover:w-1/2 opacity-0 group-hover:opacity-100" />
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Action Nodes */}
                        <div className="flex items-center gap-5">
                            <Link 
                                to="/login" 
                                className="hidden md:flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:border-liquid-gold/30 transition-all italic"
                            >
                                <ShieldCheckIcon className="w-4 h-4 text-liquid-gold" /> VIP_ACCESS
                            </Link>
                            
                            <a 
                                href="https://wa.me/593993083943"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-8 py-3.5 bg-liquid-gold text-brand-dark rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-gold-glow italic"
                            >
                                <WhatsAppIcon className="w-4 h-4" /> CONTACTAR
                            </a>

                            <button
                                onClick={() => setIsOpen(true)}
                                className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-white lg:hidden"
                            >
                                <MenuIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-[200] bg-brand-dark/98 backdrop-blur-3xl p-8 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-12">
                            <CordovaLogo className="h-8 w-auto brightness-0 invert" />
                            <button onClick={() => setIsOpen(false)} className="p-4 bg-white/5 rounded-xl">
                                <CloseIcon className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-8">
                            {publicNavLinks.map(link => (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="block text-4xl font-black text-white uppercase italic hover:text-liquid-gold transition-colors"
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        <div className="space-y-4 pt-8 border-t border-white/10">
                            <Link
                                to="/login"
                                onClick={() => setIsOpen(false)}
                                className="w-full flex items-center justify-center gap-4 py-6 bg-white/5 border border-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest italic"
                            >
                                <ShieldCheckIcon className="w-5 h-5 text-liquid-gold" /> ACCESO_CLIENTE
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PublicNavbar;
