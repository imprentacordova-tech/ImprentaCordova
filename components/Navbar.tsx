
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CordovaLogo, MenuIcon, CloseIcon, WhatsAppIcon,
    ArrowRightIcon, SparklesIcon, ShieldCheckIcon, PrinterIcon,
} from './Icons';

// ── Nav links ─────────────────────────────────────────────────────────────────
const navLinks = [
    { name: 'Inicio',        href: '#home'      },
    { name: 'Servicios',     href: '#services'  },
    { name: 'Catálogo',      href: '#catalog'   },
    { name: 'Asistente IA',  href: '#ai-helper' },
    { name: 'Rastreo',       href: '/tracking'  },
];

// ── Animated mobile link ───────────────────────────────────────────────────────
const MobileLink: React.FC<{
    href: string; name: string; index: number; onClick: () => void;
}> = ({ href, name, index, onClick }) => (
    <motion.a
        href={href}
        onClick={onClick}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="group flex items-center justify-between px-6 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/8 transition-all duration-300"
    >
        <span className="text-[12px] font-black uppercase tracking-[0.25em]">{name}</span>
        <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 text-liquid-gold transition-all duration-300" />
    </motion.a>
);

// ── Main Navbar ───────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
    const [isOpen,   setIsOpen]   = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [atTop,    setAtTop]    = useState(true);

    // Scroll detection
    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 20);
            setAtTop(y < 10);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Esc key closes drawer
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <>
            {/* ── Top announcement bar ── */}
            <div className="fixed top-0 inset-x-0 z-[60] h-9 bg-liquid-gold flex items-center justify-center">
                <div className="flex items-center gap-3 text-brand-dark">
                    <SparklesIcon className="w-3 h-3 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.5em]">
                        Imprenta Autorizada SRI · Pasaje, El Oro · +593 993 083 943
                    </span>
                    <SparklesIcon className="w-3 h-3 animate-pulse" />
                </div>
            </div>

            {/* ── Main nav ── */}
            <nav
                className={`fixed top-9 inset-x-0 z-50 transition-all duration-700 ${
                    scrolled
                        ? 'bg-brand-dark/90 backdrop-blur-3xl border-b border-white/8 shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
                        : 'bg-transparent border-b border-transparent'
                }`}
            >
                <div className="container mx-auto px-6 lg:px-10">
                    <div className="flex items-center justify-between h-20">

                        {/* ── Logo ── */}
                        <a
                            href="#home"
                            className="group flex items-center gap-4 shrink-0"
                            aria-label="Imprenta Córdova — Inicio"
                        >
                            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.06)] group-hover:shadow-[0_0_30px_rgba(212,175,55,0.25)] group-hover:scale-105 transition-all duration-500">
                                <CordovaLogo className="w-8 h-8" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="font-display font-black text-lg text-white tracking-tight">IMPRENTA</span>
                                <span className="font-display font-black text-[13px] text-liquid-gold tracking-[0.2em]">CÓRDOVA</span>
                            </div>
                        </a>

                        {/* ── Desktop links ── */}
                        <div className="hidden lg:flex items-center gap-1">
                            {navLinks.map(link => {
                                const isExternal = link.href.startsWith('/');
                                const Tag = isExternal ? 'a' : 'a';
                                return (
                                    <Tag
                                        key={link.name}
                                        href={link.href}
                                        className="group relative px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 hover:text-white transition-colors duration-300"
                                    >
                                        {link.name}
                                        {/* Underline on hover */}
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-0 bg-liquid-gold group-hover:w-3/4 transition-all duration-500 rounded-full" />
                                    </Tag>
                                );
                            })}
                        </div>

                        {/* ── Desktop CTAs ── */}
                        <div className="hidden lg:flex items-center gap-3">
                            <a
                                href="#sri"
                                className="group px-6 py-2.5 bg-white/[0.04] border border-white/10 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/8 hover:border-white/20 transition-all duration-300 flex items-center gap-2"
                            >
                                <ShieldCheckIcon className="w-3.5 h-3.5 text-brand-red" />
                                SRI
                            </a>
                            <a
                                href="https://wa.me/593993083943"
                                target="_blank"
                                rel="noreferrer"
                                className="group px-8 py-2.5 bg-liquid-gold text-brand-dark rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:shadow-gold-glow hover:scale-105 transition-all duration-300 flex items-center gap-2 active:scale-95"
                            >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                <span>Cotizar Ahora</span>
                                <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </a>
                        </div>

                        {/* ── Mobile hamburger ── */}
                        <button
                            onClick={() => setIsOpen(v => !v)}
                            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/8 text-white hover:bg-white/8 transition-all duration-300"
                            aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
                            aria-expanded={isOpen}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {isOpen ? (
                                    <motion.span key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <CloseIcon className="w-5 h-5" />
                                    </motion.span>
                                ) : (
                                    <motion.span key="open"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <MenuIcon className="w-5 h-5" />
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Mobile full-screen drawer ── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-md lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            key="panel"
                            initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
                            animate={{ clipPath: 'inset(0 0 0% 0)', opacity: 1 }}
                            exit={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed top-9 inset-x-0 z-[58] bg-brand-dark border-b border-white/8 shadow-2xl lg:hidden overflow-hidden"
                        >
                            {/* Gold line top */}
                            <div className="h-px bg-gradient-to-r from-transparent via-liquid-gold/40 to-transparent" />

                            <div className="container mx-auto px-6 pt-6 pb-10 space-y-2">
                                {/* Nav links */}
                                {navLinks.map((link, i) => (
                                    <MobileLink
                                        key={link.name}
                                        href={link.href}
                                        name={link.name}
                                        index={i}
                                        onClick={() => setIsOpen(false)}
                                    />
                                ))}

                                {/* Divider */}
                                <div className="h-px bg-white/5 my-4" />

                                {/* CTA buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: navLinks.length * 0.06 + 0.1, duration: 0.5 }}
                                    className="flex flex-col gap-3 pt-2"
                                >
                                    <a
                                        href="https://wa.me/593993083943"
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-4 bg-liquid-gold text-brand-dark rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white hover:shadow-gold-glow transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
                                    >
                                        <WhatsAppIcon className="w-5 h-5" />
                                        Cotizar por WhatsApp
                                    </a>
                                    <a
                                        href="#sri"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full py-4 bg-white/[0.04] border border-white/8 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white/8 transition-all duration-300 flex items-center justify-center gap-3"
                                    >
                                        <ShieldCheckIcon className="w-5 h-5 text-brand-red" />
                                        Documentos SRI
                                    </a>
                                </motion.div>

                                {/* Location pill */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: navLinks.length * 0.06 + 0.3, duration: 0.5 }}
                                    className="pt-6 flex items-center justify-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]"
                                >
                                    <PrinterIcon className="w-3 h-3 text-liquid-gold/40" />
                                    <span>Colón e/ Sucre · Pasaje, El Oro</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
