
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CordovaLogo, MenuIcon, CloseIcon, WhatsAppIcon,
    ArrowRightIcon, SparklesIcon, ShieldCheckIcon, PrinterIcon,
} from './Icons';

// ── Enlaces de Navegación ──────────────────────────────────────────────────────
const navLinks = [
    { name: 'Inicio',        href: '#/'            },
    { name: 'Documentos SRI', href: '#/sri'         },
    { name: 'Imprenta Córdova', href: '#/imprenta'    },
    { name: 'Rastreo',       href: '#/tracking'    },
    { name: 'Administración', href: '#/login'       },
];

// ── Enlace Móvil Animado ───────────────────────────────────────────────────────
const MobileLink: React.FC<{
    href: string; name: string; index: number; onClick: () => void;
}> = ({ href, name, index, onClick }) => (
    <motion.a
        href={href}
        onClick={onClick}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        className="group flex items-center justify-between px-6 py-5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300"
    >
    <span className="text-[12px] font-black uppercase tracking-[0.2em] italic">{name}</span>
    <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-liquid-gold" />
    </motion.a>
);

// ── Navbar Principal ─────────────────────────────────────────────────────────
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
            {/* ── Barra Superior de Marca (Cinta de Seguridad Industrial) ── */}
            <div className="fixed top-0 inset-x-0 z-[60] h-10 bg-black flex items-center justify-center overflow-hidden px-6 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-printing-blue/20 via-transparent to-printing-blue/20 opacity-50" />
                <div className="flex items-center gap-8 text-white/50 relative z-10">
                    <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-printing-cyan animate-pulse shadow-[0_0_8px_#00aeef]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-printing-magenta animate-pulse delay-75 shadow-[0_0_8px_#be123c]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-printing-yellow animate-pulse delay-150 shadow-[0_0_8px_#f59e0b]" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300 italic">
                        IMPRENTA CÓRDOVA AUTORIZADA SRI · <span className="text-gold-gradient font-black">ESTÁNDAR ELITE</span>
                    </span>
                    <div className="hidden md:flex items-center gap-2 text-[8px] font-mono text-printing-blue/60 uppercase tracking-widest">
                        <div className="w-1 h-1 bg-printing-blue/40 rounded-full" />
                        SYSTEM_ACTIVE: 100%
                    </div>
                </div>
            </div>

            {/* ── Navegación Principal ── */}
            <nav
                className={`fixed top-10 inset-x-0 z-50 transition-all duration-700 ${
                    scrolled
                        ? 'bg-brand-dark/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl py-2'
                        : 'bg-transparent py-4'
                }`}
            >
                <div className="container mx-auto px-6 lg:px-10">
                    <div className="flex items-center justify-between h-16">

                        {/* ── Logotipo ── */}
                        <a
                            href="/"
                            className="group flex items-center gap-4 shrink-0 transition-transform hover:scale-105"
                            aria-label="Imprenta Córdova — Inicio"
                        >
                            <div className="w-10 h-10 bg-brand-dark border border-liquid-gold/30 rounded-xl flex items-center justify-center shadow-gold-glow group-hover:border-liquid-gold transition-all text-liquid-gold">
                                <CordovaLogo className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="font-display font-black text-xl italic text-white tracking-[-0.04em]">IMPRENTA CÓRDOVA</span>
                                <span className="font-display font-black text-[9px] text-liquid-gold tracking-[0.6em] uppercase opacity-70">Excelencia Gráfica</span>
                            </div>
                        </a>

                        {/* ── Enlaces Escritorio ── */}
                        <div className="hidden lg:flex items-center gap-4">
                            {navLinks.map(link => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="group relative px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all duration-500 italic"
                                >
                                    <span className="relative z-10">{link.name}</span>
                                    <motion.span 
                                        className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-printing-blue to-transparent w-0 group-hover:w-full transition-all duration-700"
                                    />
                                </a>
                            ))}
                        </div>

                        {/* ── CTAs Escritorio ── */}
                        <div className="hidden lg:flex items-center gap-6">
                            <a
                                href="https://wa.me/593993083943"
                                target="_blank"
                                rel="noreferrer"
                                className="group px-10 py-3.5 bg-white text-printing-dark rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-printing-blue hover:text-white shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_40px_rgba(0,71,171,0.3)] transition-all duration-700 flex items-center gap-4 active:scale-95 italic border border-white/10"
                            >
                                <WhatsAppIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                <span>CANAL ELITE</span>
                            </a>
                        </div>

                        {/* ── Hamburguesa Móvil ── */}
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

            {/* ── Menú Desplegable Móvil ── */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-xl lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
                            className="fixed top-10 inset-x-0 z-[58] bg-brand-dark border-b border-white/10 shadow-2xl lg:hidden overflow-hidden rounded-b-[3rem]"
                        >
                            <div className="container mx-auto px-6 py-12 space-y-2">
                                {navLinks.map((link, i) => (
                                    <MobileLink key={link.name} href={link.href} name={link.name} index={i} onClick={() => setIsOpen(false)} />
                                ))}
                                <div className="h-px bg-white/5 my-8" />
                                <a
                                    href="https://wa.me/593993083943"
                                    className="w-full py-6 bg-liquid-gold text-brand-dark rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-gold-glow/20 italic"
                                >
                                    <WhatsAppIcon className="w-5 h-5" />
                                    WhatsApp Elite
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
