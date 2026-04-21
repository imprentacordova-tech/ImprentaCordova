
import React from 'react';
import { motion } from 'framer-motion';
import {
    CordovaLogo, WhatsAppIcon, InstagramIcon, FacebookIcon,
    MapPinIcon, ClockIcon, PhoneIcon, EnvelopeIcon,
    ShieldCheckIcon, PrinterIcon, ArrowRightIcon, SparklesIcon,
} from './Icons';

// ── Link groups ──────────────────────────────────────────────────────────────
const links = {
    servicios: [
        { label: 'Gigantografías HD', href: '#services' },
        { label: 'Imprenta Autorizada SRI', href: '#sri' },
        { label: 'Gestión Tributaria', href: '#sri' },
        { label: 'Material Publicitario', href: '#services' },
        { label: 'Acabados Premium', href: '#services' },
        { label: 'Sellos y Encuadernación', href: '#services' },
    ],
    legal: [
        { label: 'Política de Privacidad', href: '#' },
        { label: 'Términos de Servicio', href: '#' },
        { label: 'Accesibilidad', href: '#' },
        { label: 'Mapa del Sitio', href: '#' },
    ],
};

const social = [
    {
        icon: WhatsAppIcon,
        label: 'WhatsApp',
        href: 'https://wa.me/593993083943',
        color: 'hover:text-[#25D366] hover:border-[#25D366]/30 hover:bg-[#25D366]/10',
    },
    {
        icon: InstagramIcon,
        label: 'Instagram',
        href: 'https://instagram.com/imprentacordova',
        color: 'hover:text-pink-400 hover:border-pink-400/30 hover:bg-pink-400/10',
    },
    {
        icon: FacebookIcon,
        label: 'Facebook',
        href: 'https://facebook.com/imprentacordova',
        color: 'hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/10',
    },
];

const schedule = [
    { day: 'Lun – Vie', hours: '08:00 – 19:00' },
    { day: 'Sábado',    hours: '08:00 – 14:00' },
    { day: 'Domingo',   hours: 'Cerrado' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
const FooterLink: React.FC<{ href: string; label: string }> = ({ href, label }) => (
    <li>
        <a
            href={href}
            className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors duration-300 text-[11px] font-bold uppercase tracking-widest py-1"
        >
            <ArrowRightIcon className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-liquid-gold shrink-0" />
            {label}
        </a>
    </li>
);

const ColumnTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h4 className="text-[9px] font-black text-liquid-gold uppercase tracking-[0.5em] mb-8">{children}</h4>
);

// ── Main Footer ───────────────────────────────────────────────────────────────
const Footer: React.FC = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="relative bg-brand-dark border-t border-white/5 overflow-hidden">

            {/* Ambient glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-liquid-gold/4 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />

            {/* ── CTA Banner ── */}
            <div className="border-b border-white/5 bg-white/[0.015]">
                <div className="container mx-auto px-6 lg:px-10 py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col lg:flex-row items-center justify-between gap-10"
                    >
                        <div className="text-center lg:text-left space-y-4">
                            <div className="inline-flex items-center gap-2 text-liquid-gold">
                                <SparklesIcon className="w-4 h-4 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.5em]">Atención Inmediata · Pasaje, El Oro</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter leading-none">
                                ¿Listo para imprimir?
                            </h2>
                            <p className="text-slate-500 max-w-md font-light">
                                Contáctanos por WhatsApp y recibe tu cotización en minutos. Sin formularios, sin esperas.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                            <a
                                href="https://wa.me/593993083943"
                                target="_blank"
                                rel="noreferrer"
                                className="group px-10 py-5 bg-liquid-gold text-brand-dark rounded-full font-black text-[10px] uppercase tracking-[0.25em] hover:bg-white hover:shadow-gold-glow hover:scale-105 transition-all duration-300 flex items-center gap-3 active:scale-95"
                            >
                                <WhatsAppIcon className="w-5 h-5" />
                                <span>Escribir Ahora</span>
                                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a
                                href="tel:+593993083943"
                                className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-full font-black text-[10px] uppercase tracking-[0.25em] hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-3"
                            >
                                <PhoneIcon className="w-4 h-4 text-liquid-gold" />
                                <span>Llamar</span>
                            </a>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Main grid ── */}
            <div className="container mx-auto px-6 lg:px-10 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-14 lg:gap-8">

                    {/* Brand col */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.06)] shrink-0">
                                <CordovaLogo className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="font-display font-black text-xl text-white tracking-tight leading-none">IMPRENTA</h3>
                                <h3 className="font-display font-black text-xl text-liquid-gold tracking-tight leading-none">CÓRDOVA</h3>
                            </div>
                        </div>

                        <p className="text-slate-500 leading-relaxed text-sm font-light max-w-sm">
                            Más de 15 años transformando ideas en obras maestras gráficas. Tecnología Roland, gestión autorizada SRI y el cuidado artesanal de siempre.
                        </p>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-3">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/8 rounded-full backdrop-blur-md">
                                <ShieldCheckIcon className="w-3.5 h-3.5 text-liquid-gold" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SRI Autorizado</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/8 rounded-full backdrop-blur-md">
                                <PrinterIcon className="w-3.5 h-3.5 text-liquid-gold" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Roland Certified</span>
                            </div>
                        </div>

                        {/* Social */}
                        <div className="flex gap-3">
                            {social.map(({ icon: Icon, label, href, color }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={label}
                                    className={`w-11 h-11 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/8 text-slate-500 transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 ${color}`}
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Servicios col */}
                    <div className="lg:col-span-3 lg:col-start-6">
                        <ColumnTitle>Servicios</ColumnTitle>
                        <ul className="space-y-1">
                            {links.servicios.map(l => <FooterLink key={l.label} {...l} />)}
                        </ul>
                    </div>

                    {/* Contacto col */}
                    <div className="lg:col-span-3 lg:col-start-10 space-y-8">
                        <div>
                            <ColumnTitle>Contacto</ColumnTitle>
                            <ul className="space-y-5">
                                <li className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <MapPinIcon className="w-3.5 h-3.5 text-liquid-gold" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Dirección</p>
                                        <p className="text-slate-300 text-sm font-light leading-snug">Calle Colón e/ Sucre<br />Diagonal al Parque Central<br />Pasaje · El Oro, Ecuador</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <PhoneIcon className="w-3.5 h-3.5 text-liquid-gold" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Teléfono</p>
                                        <a href="tel:+593993083943" className="text-slate-300 text-sm font-light hover:text-white transition-colors">+593 993 083 943</a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-xl bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <ClockIcon className="w-3.5 h-3.5 text-liquid-gold" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2">Horario de Atención</p>
                                        <div className="space-y-1.5">
                                            {schedule.map(({ day, hours }) => (
                                                <div key={day} className="flex items-center justify-between gap-6 text-[11px]">
                                                    <span className="text-slate-500 font-bold">{day}</span>
                                                    <span className={`font-black tracking-wider ${hours === 'Cerrado' ? 'text-slate-700' : 'text-slate-300'}`}>{hours}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Bottom bar ── */}
            <div className="border-t border-white/5">
                <div className="container mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">
                        &copy; {year} Imprenta Córdova · Archivo de Excelencia · Pasaje, Ecuador
                    </p>
                    <div className="flex gap-8">
                        {links.legal.map(l => (
                            <a key={l.label} href={l.href} className="text-[9px] font-black text-slate-700 uppercase tracking-widest hover:text-slate-400 transition-colors">
                                {l.label}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;