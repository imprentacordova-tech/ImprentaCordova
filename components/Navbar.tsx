
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
    { name: 'Imprenta',      href: '#/imprenta'    },
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
        className="group flex items-center justify-between px-6 py-5 rounded-2xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
    >
    <span className="text-[12px] font-black uppercase tracking-[0.2em]">{name}</span>
    <ArrowRightIcon className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-printing-blue" />
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
            {/* ── Barra Superior de Marca ── */}
            <div className="fixed top-0 inset-x-0 z-[60] h-10 bg-printing-dark flex items-center justify-center overflow-hidden px-6 border-b border-slate-800">
                <div className="flex items-center gap-6 text-white/50">
                    <span className="text-[8px] font-black uppercase tracking-[0.6em] italic">
                        Imprenta Autorizada SRI · <span className="text-printing-yellow font-bold">PASAJE, EL ORO</span>
                    </span>
                </div>
            </div>

            {/* ── Navegación Principal ── */}
            <nav
                className={`fixed top-10 inset-x-0 z-50 transition-all duration-500 ${
                    scrolled
                        ? 'bg-white/80 backdrop-blur-2xl border-b border-slate-200 shadow-xl py-2'
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
                            <div className="w-10 h-10 bg-printing-blue border border-printing-blue/20 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-printing-blue/20 transition-all text-white">
                                <CordovaLogo className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col leading-none">
                                <span className="font-display font-black text-xl italic text-printing-dark tracking-tighter">CÓRDOVA</span>
                                <span className="font-display font-black text-[9px] text-printing-blue tracking-[0.4em] uppercase">Atelier Gráfico</span>
                            </div>
                        </a>

                        {/* ── Enlaces Escritorio ── */}
                        <div className="hidden lg:flex items-center gap-2">
                            {navLinks.map(link => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="group relative px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-printing-blue transition-colors italic"
                                >
                                    {link.name}
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-printing-blue group-hover:w-4 transition-all duration-300 rounded-full" />
                                </a>
                            ))}
                        </div>

                        {/* ── CTAs Escritorio ── */}
                        <div className="hidden lg:flex items-center gap-4">
                            <a
                                href="https://wa.me/593993083943"
                                target="_blank"
                                rel="noreferrer"
                                className="group px-8 py-3 bg-printing-blue text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-printing-dark shadow-lg shadow-printing-blue/20 transition-all flex items-center gap-3 active:scale-95 italic"
                            >
                                <WhatsAppIcon className="w-4 h-4" />
                                <span>Canal de WhatsApp</span>
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
                            className="fixed inset-0 z-[55] bg-slate-900/60 backdrop-blur-md lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
                            className="fixed top-10 inset-x-0 z-[58] bg-white border-b border-slate-100 shadow-2xl lg:hidden overflow-hidden rounded-b-[3rem]"
                        >
                            <div className="container mx-auto px-6 py-12 space-y-2">
                                {navLinks.map((link, i) => (
                                    <MobileLink key={link.name} href={link.href} name={link.name} index={i} onClick={() => setIsOpen(false)} />
                                ))}
                                <div className="h-px bg-slate-100 my-8" />
                                <a
                                    href="https://wa.me/593993083943"
                                    className="w-full py-6 bg-printing-blue text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-printing-blue/20"
                                >
                                    <WhatsAppIcon className="w-5 h-5" />
                                    Enlace de WhatsApp
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
