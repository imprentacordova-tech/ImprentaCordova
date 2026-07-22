import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import {
    CordovaLogo, MenuIcon, CloseIcon, WhatsAppIcon,
    ShieldCheckIcon, HomeIcon, ActivityIcon, BoxIcon
} from './Icons';

const publicNavLinks = [
    { name: 'Inicio',    href: '/',         icon: HomeIcon },
    { name: 'Catálogo',  href: '/vitrina',  icon: BoxIcon },
    { name: 'Rastreo',   href: '/tracking', icon: ActivityIcon },
];

/** Returns true if within business hours: Mon-Fri 8-18, Sat 8-14 (EC time) */
function isBusinessHoursNow(): boolean {
    const now = new Date();
    // UTC-5 (Ecuador)
    const utcOffset = now.getTimezoneOffset();
    const ecOffset = -5 * 60;
    const ecNow = new Date(now.getTime() + (ecOffset - (-utcOffset)) * 60000);
    const day = ecNow.getDay(); // 0=Sun, 6=Sat
    const hour = ecNow.getHours();
    if (day === 0) return false;
    if (day === 6) return hour >= 8 && hour < 14;
    return hour >= 8 && hour < 18;
}

const TICKER_ITEMS = [
    '✦ IMPRENTA CÓRDOVA · Machala, El Oro',
    '✦ SRI AUTORIZADO · Reg. Especial 001-001',
    '✦ Facturas · Notas de Venta · Talonarios · Sellos',
    '✦ Retiro en tienda o Envío a domicilio',
    '✦ Diseño gráfico incluido en pedidos',
    '✦ +2,400 trabajos entregados con éxito',
];

const PublicNavbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isOpen24, setIsOpen24] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setIsOpen24(isBusinessHoursNow());
        const timer = setInterval(() => setIsOpen24(isBusinessHoursNow()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on route change
    useEffect(() => { setIsOpen(false); }, [location.pathname]);

    const tickerContent = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicate for seamless loop

    return (
        <>
            {/* ── TOP ANNOUNCEMENT BAR ── */}
            <div className="top-announcement-bar fixed top-0 inset-x-0 z-[160] h-9 flex items-center overflow-hidden">
                <div className="flex items-center gap-0 animate-ticker whitespace-nowrap">
                    {tickerContent.map((item, i) => (
                        <span
                            key={i}
                            className="text-[9px] font-black uppercase tracking-[0.35em] text-liquid-gold/70 px-10 shrink-0"
                        >
                            {item}
                        </span>
                    ))}
                </div>
                {/* Right status pill */}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10">
                    <span className={`w-1.5 h-1.5 rounded-full ${isOpen24 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${isOpen24 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {isOpen24 ? 'ABIERTO' : 'CERRADO'}
                    </span>
                </div>
            </div>

            {/* ── MAIN NAV ── */}
            <nav
                className={`fixed top-9 inset-x-0 z-[150] transition-all duration-700 ${
                    scrolled
                        ? 'bg-[#050810]/90 backdrop-blur-3xl border-b border-white/5 py-3 shadow-[0_4px_40px_rgba(0,0,0,0.6)]'
                        : 'bg-transparent py-6'
                }`}
            >
                <div className="container mx-auto px-6 lg:px-14">
                    <div className="flex items-center justify-between h-14">

                        {/* ── BRAND MARK ── */}
                        <Link to="/" className="group flex items-center gap-4 shrink-0">
                            <div className="relative">
                                <CordovaLogo className="h-8 w-auto brightness-0 invert group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute -inset-3 bg-liquid-gold/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            </div>
                            <div className="flex flex-col leading-none gap-0.5">
                                <span className="font-black text-lg text-white tracking-tighter uppercase leading-none">
                                    CÓRDOVA<span className="text-liquid-gold">.</span>
                                </span>
                                <span className="font-mono text-[7px] text-slate-500 tracking-[0.4em] uppercase leading-none">
                                    Atelier Gráfico · EST. 2009
                                </span>
                            </div>
                        </Link>

                        {/* ── DESKTOP LINKS ── */}
                        <div className="hidden lg:flex items-center gap-1">
                            {publicNavLinks.map(link => {
                                const isActive = location.pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        className={`group relative px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-400 rounded-xl ${
                                            isActive ? 'text-liquid-gold' : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        <span className="relative z-10">{link.name}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="publicNavActive"
                                                className="absolute inset-0 bg-liquid-gold/8 rounded-xl border border-liquid-gold/15"
                                            />
                                        )}
                                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-px bg-liquid-gold/60 transition-all duration-400 group-hover:w-4 opacity-0 group-hover:opacity-100" />
                                    </Link>
                                );
                            })}
                        </div>

                        {/* ── ACTION CLUSTER ── */}
                        <div className="flex items-center gap-3">
                            <Link
                                to="/login"
                                className="hidden md:flex items-center gap-2.5 px-5 py-2.5 bg-white/[0.04] border border-white/8 text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-[0.25em] hover:bg-white/8 hover:text-white hover:border-liquid-gold/20 transition-all duration-300"
                            >
                                <ShieldCheckIcon className="w-3.5 h-3.5 text-liquid-gold/70" />
                                Panel
                            </Link>

                            <a
                                href="https://wa.me/593993083943?text=Hola%2C+visité+su+web+y+me+gustaría+cotizar+un+trabajo."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-gold !py-2.5 !px-6 !rounded-xl !text-[9px] shadow-gold-glow"
                            >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                Cotizar
                            </a>

                            <button
                                id="mobile-menu-btn"
                                onClick={() => setIsOpen(true)}
                                className="p-2.5 bg-white/[0.04] border border-white/8 rounded-xl text-slate-300 hover:text-white hover:border-white/20 transition-all lg:hidden"
                                aria-label="Abrir menú"
                            >
                                <MenuIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── MOBILE MENU OVERLAY ── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-0 z-[300] flex flex-col bg-[#050810]/98 backdrop-blur-3xl border-l border-white/5 text-white p-8"
                    >
                        {/* Close row */}
                        <div className="flex justify-between items-center mb-16">
                            <div className="flex flex-col leading-none gap-0.5">
                                <span className="font-black text-xl text-white tracking-tighter uppercase">
                                    CÓRDOVA<span className="text-liquid-gold">.</span>
                                </span>
                                <span className="font-mono text-[7px] text-slate-500 tracking-[0.4em] uppercase">
                                    Atelier Gráfico
                                </span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-liquid-gold/20 transition-all"
                                aria-label="Cerrar menú"
                            >
                                <CloseIcon className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Nav links */}
                        <div className="flex-1 space-y-2">
                            {publicNavLinks.map((link, idx) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.07 }}
                                >
                                    <Link
                                        to={link.href}
                                        className="group flex items-center justify-between py-5 border-b border-white/5 text-3xl font-black text-white uppercase hover:text-liquid-gold transition-colors"
                                    >
                                        <span>{link.name}</span>
                                        <span className="text-liquid-gold/30 text-base font-mono">0{idx + 1}</span>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* Bottom actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="space-y-3 pt-8 border-t border-white/5"
                        >
                            <a
                                href="https://wa.me/593993083943?text=Hola%2C+me+gustaría+cotizar+un+trabajo."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-3 py-5 bg-liquid-gold text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-gold-glow"
                            >
                                <WhatsAppIcon className="w-5 h-5" /> Cotizar por WhatsApp
                            </a>
                            <Link
                                to="/login"
                                className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-liquid-gold/20 transition-all"
                            >
                                <ShieldCheckIcon className="w-4 h-4 text-liquid-gold/60" /> Acceso Operador
                            </Link>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PublicNavbar;
