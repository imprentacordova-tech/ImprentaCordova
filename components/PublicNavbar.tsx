import React, { useState, useEffect } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WhatsAppIcon, Menu, X, ArrowRight } from './Icons';

const LINKS = [
    { name: 'Inicio', to: '/' },
    { name: 'Catálogo & Precios', to: '/vitrina' },
    { name: 'Rastrear Pedido', to: '/tracking' },
];

function isBusinessHoursNow(): boolean {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset();
    const ecOffset = -5 * 60;
    const ecNow = new Date(now.getTime() + (ecOffset - (-utcOffset)) * 60000);
    const day = ecNow.getDay();
    const hour = ecNow.getHours();
    if (day === 0) return false;
    if (day === 6) return hour >= 8 && hour < 14;
    return hour >= 8 && hour < 18;
}

const PublicNavbar: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [abierto, setAbierto] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setAbierto(isBusinessHoursNow());
        const t = setInterval(() => setAbierto(isBusinessHoursNow()), 60000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    return (
        <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-hairline transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
                
                {/* Brand Logo */}
                <Link to="/" className="flex items-center gap-3.5 group">
                    <div className="relative">
                        <img
                            src="/LOGO.png"
                            alt="Imprenta Córdova"
                            className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-heading font-extrabold text-lg sm:text-xl text-ink tracking-tight leading-none">
                            Imprenta <span className="text-brand-blue">Córdova</span>
                        </span>
                        <span className="text-[10px] font-mono tracking-widest uppercase font-semibold text-gold-deep mt-1">
                            SRI Autorizado · Machala
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex items-center gap-1.5 bg-soft p-1.5 rounded-full border border-hairline">
                    {LINKS.map(l => {
                        const isActive = location.pathname === l.to;
                        return (
                            <NavLink
                                key={l.to}
                                to={l.to}
                                end={l.to === '/'}
                                className={`relative px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                                    isActive ? 'text-white' : 'text-body hover:text-ink'
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="publicNavActivePill"
                                        className="absolute inset-0 bg-brand-blue rounded-full shadow-md shadow-brand-blue/25"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{l.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Right Quick Actions */}
                <div className="hidden md:flex items-center gap-3">
                    {/* Live Taller Status */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                        abierto
                            ? 'bg-success/5 border-success/25 text-success'
                            : 'bg-soft border-hairline text-body'
                    }`}>
                        <span className="relative flex h-2 w-2">
                            {abierto && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-dot opacity-75" />
                            )}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${
                                abierto ? 'bg-success-dot' : 'bg-ghost'
                            }`} />
                        </span>
                        <span>{abierto ? 'Taller en Línea' : 'Cerrado ahora'}</span>
                    </div>

                    {/* WhatsApp Action Button */}
                    <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        href="https://wa.me/593993083943?text=Hola%20Imprenta%20C%C3%B3rdova%2C%20quisiera%20cotizar%20un%20trabajo%20de%20impresi%C3%B3n."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-blue to-royal-dark hover:from-royal hover:to-ink text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md shadow-brand-blue/20 transition-all"
                    >
                        <WhatsAppIcon className="w-4 h-4 text-onink-success" />
                        <span>Cotizar Ahora</span>
                    </motion.a>
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden items-center gap-2">
                    <button
                        onClick={() => setOpen(!open)}
                        className="w-11 h-11 flex items-center justify-center rounded-2xl bg-soft border border-hairline text-ink active:scale-95 transition-all"
                        aria-label="Menú principal"
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown with Framer Motion */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        className="md:hidden border-t border-hairline bg-white/95 backdrop-blur-2xl px-5 py-5 space-y-2 shadow-2xl"
                    >
                        <div className="flex items-center justify-between pb-3 mb-2 border-b border-hairline">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted">
                                Navegación
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                abierto ? 'bg-success-dot/15 text-success' : 'bg-soft text-body'
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${abierto ? 'bg-success-dot' : 'bg-ghost'}`} />
                                {abierto ? 'Abierto en Machala' : 'Cerrado temporalmente'}
                            </span>
                        </div>

                        {LINKS.map(l => {
                            const isActive = location.pathname === l.to;
                            return (
                                <Link
                                    key={l.to}
                                    to={l.to}
                                    className={`flex items-center justify-between p-3.5 rounded-2xl font-bold text-sm transition-all ${
                                        isActive
                                            ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/20'
                                            : 'bg-paper text-body hover:bg-soft'
                                    }`}
                                >
                                    <span>{l.name}</span>
                                    <ArrowRight className={`w-4 h-4 ${isActive ? 'text-gold' : 'text-faint'}`} />
                                </Link>
                            );
                        })}

                        <div className="pt-3">
                            <a
                                href="https://wa.me/593993083943?text=Hola%20Imprenta%20C%C3%B3rdova%2C%20quisiera%20cotizar%20un%20trabajo%20de%20impresi%C3%B3n."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-success-dot hover:bg-success text-white font-bold text-sm rounded-2xl shadow-lg shadow-success-dot/25 transition-all"
                            >
                                <WhatsAppIcon className="w-5 h-5" />
                                <span>Escribir al Taller por WhatsApp</span>
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default PublicNavbar;
