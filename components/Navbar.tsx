
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CordovaLogo, MenuIcon, CloseIcon, WhatsAppIcon,
    ArrowRightIcon, SparklesIcon, ShieldCheckIcon, PrinterIcon,
} from './Icons';

// ── Nav links ─────────────────────────────────────────────────────────────────
const navLinks = [
    { name: 'Inicio',        href: '/#home'      },
    { name: 'Servicios',     href: '/#services'  },
    { name: 'Catálogo',      href: '/#catalog'   },
    { name: 'Rastreo',       href: '/tracking'  },
];

// ── Animated mobile link ───────────────────────────────────────────────────────
const MobileLink: React.FC<{
    href: string; name: string; index: number; onClick: () => void;
}> = ({ href, name, index, onClick }) => (
    <motion.a
        href={href}
        onClick={onClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        className="group flex items-center justify-between px-6 py-5 rounded-2xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
    >
    <span className="text-[12px] font-black uppercase tracking-[0.2em]">{name}</span>
    <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
    </motion.a>
);

// ── Main Navbar ───────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
    const [isOpen,   setIsOpen]   = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* ── Top brand bar ── */}
            <div className="fixed top-0 inset-x-0 z-[60] h-10 bg-slate-900 flex items-center justify-center overflow-hidden px-6">
                <div className="flex items-center gap-6 text-white/40">
                    <span className="text-[8px] font-black uppercase tracking-[0.6em] italic">
                        Imprenta Autorizada SRI · <span className="text-yellow-400">PASSAJE, EL ORO</span> · EST. 1990
                    </span>
                </div>
            </div>

            {/* ── Main nav ── */}
            <nav
                className={`fixed top-10 inset-x-0 z-50 transition-all duration-500 ${
                    scrolled
                        ? 'bg-white/80 backdrop-blur-2xl border-b border-slate-100 shadow-xl py-2'
                        : 'bg-white/40 backdrop-blur-md border-b border-transparent py-4'
                }`}
            >
                <div className="container mx-auto px-6 lg:px-10">
                    <div className="flex items-center justify-between h-16">

                        {/* ── Logo ── */}
                        <a
                            href="/"
                            className="group flex items-center gap-4 shrink-0 transition-transform hover:scale-105"
                            aria-label="Imprenta Córdova — Inicio"
                        >
                            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/20 transition-all">
                                <CordovaLogo className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="font-display font-black text-lg italic text-slate-900 tracking-tighter">CORDOVA</span>
                                <span className="font-display font-black text-[9px] text-blue-600 tracking-[0.4em] uppercase">Atelier</span>
                            </div>
                        </a>

                        {/* ── Desktop links ── */}
                        <div className="hidden lg:flex items-center gap-2">
                            {navLinks.map(link => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="group relative px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-600 transition-colors"
                                >
                                    {link.name}
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-blue-600 group-hover:w-4 transition-all duration-300 rounded-full" />
                                </a>
                            ))}
                        </div>

                        {/* ── Desktop CTAs ── */}
                        <div className="hidden lg:flex items-center gap-4">
                            <a
                                href="https://wa.me/593993083943"
                                target="_blank"
                                rel="noreferrer"
                                className="group px-8 py-3 bg-blue-600 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-3 active:scale-95"
                            >
                                <WhatsAppIcon className="w-4 h-4" />
                                <span>Atelier Direct</span>
                            </a>
                        </div>

                        {/* ── Mobile hamburger ── */}
                        <button
                            onClick={() => setIsOpen(v => !v)}
                            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-900 hover:bg-white transition-all"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                {isOpen ? (
                                    <motion.span key="close" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><CloseIcon className="w-5 h-5" /></motion.span>
                                ) : (
                                    <motion.span key="open" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><MenuIcon className="w-5 h-5" /></motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Mobile Drawer ── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[55] bg-slate-900/60 backdrop-blur-md lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
                            className="fixed top-10 inset-x-0 z-[58] bg-white border-b border-slate-100 shadow-2xl lg:hidden overflow-hidden rounded-b-[2rem]"
                        >
                            <div className="container mx-auto px-6 py-10 space-y-2">
                                {navLinks.map((link, i) => (
                                    <MobileLink key={link.name} href={link.href} name={link.name} index={i} onClick={() => setIsOpen(false)} />
                                ))}
                                <div className="h-px bg-slate-100 my-6" />
                                <a
                                    href="https://wa.me/593993083943"
                                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 shadow-xl"
                                >
                                    <WhatsAppIcon className="w-5 h-5" />
                                    Atelier Direct
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
