
import React from 'react';
import { motion } from 'framer-motion';
import {
    PrinterIcon, ShieldCheckIcon, CalculatorIcon, SparklesIcon,
    LayersIcon, PaletteIcon, ArrowRightIcon, ReceiptIcon
} from './Icons';

// --- Service data -------------------------------------------------------------
const services = [
    {
        id: '1',
        index: '01',
        title: 'Gigantografías HD',
        subtitle: 'Gran Formato Roland',
        description:
            'Lonas, banners y vinilos con tecnología Roland High-Fidelity. Colores saturados que resisten sol, lluvia y el paso del tiempo.',
        icon: PrinterIcon,
        imageUrl: 'https://images.unsplash.com/photo-1520697517317-6767553cc51a?auto=format&fit=crop&q=80&w=800',
        accent: 'text-cyan-400',
        glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
        featured: true,
        cmyk: 'C'
    },
    {
        id: '2',
        index: '02',
        title: 'Imprenta Autorizada SRI',
        subtitle: 'Documentos con Validez Fiscal',
        description:
            'Facturas, Notas de Venta, Retenciones, Liquidaciones de compra y Guías de remisión. Autorizados y con numeración SRI.',
        icon: ShieldCheckIcon,
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
        accent: 'text-brand-blue',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
        featured: false,
        cmyk: 'M'
    },
    {
        id: '3',
        index: '03',
        title: 'Gestión Tributaria',
        subtitle: 'IVA · Renta · Anexos',
        description:
            'Declaraciones de IVA Mensual y Semestral, Impuesto a la Renta, Anexos Transaccionales, RUC y RISE. Tus cifras en orden.',
        icon: CalculatorIcon,
        imageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=800',
        accent: 'text-brand-blue',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
        featured: false,
        cmyk: 'Y'
    },
    {
        id: '4',
        index: '04',
        title: 'Material Publicitario',
        subtitle: 'Tarjetas · Volantes · Dípticos',
        description:
            'Desde tarjetas de presentación premium hasta folletos corporativos. Diseño estratégico para que tu marca cause primera impresión.',
        icon: PaletteIcon,
        imageUrl: 'https://images.unsplash.com/photo-1586075010683-2350bcbc085c?auto=format&fit=crop&q=80&w=800',
        accent: 'text-white',
        glow: 'shadow-[0_0_20px_rgba(255,255,255,0.1)]',
        featured: false,
        cmyk: 'K'
    },
    {
        id: '5',
        index: '05',
        title: 'Acabados Premium',
        subtitle: 'Troquelado · Barniz UV · Laminado',
        description:
            'Terminaciones que elevan cualquier pieza al nivel de obra de arte. Lacados mate, brillos selectivos y relieves táctiles.',
        icon: SparklesIcon,
        imageUrl: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=800',
        accent: 'text-brand-blue',
        glow: 'shadow-blue-glow-soft',
        featured: false,
    },
    {
        id: '6',
        index: '06',
        title: 'Sellos y Encuadernación',
        subtitle: 'Tesis · Archivos · Sellos Express',
        description:
            'Sellos automáticos y de madera al instante, empastados de tesis y encuadernación de archivos contables con acabados de lujo.',
        icon: LayersIcon,
        imageUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=800',
        accent: 'text-cyan-400',
        glow: 'shadow-[0_0_20px_rgba(34,211,238,0.2)]',
        featured: false,
    },
];

// --- Animation variants -------------------------------------------------------
const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as any } },
};

// --- Featured card (large) ----------------------------------------------------
const FeaturedCard: React.FC<typeof services[0]> = ({ title, subtitle, description, icon: Icon, imageUrl, accent, glow, cmyk }) => (
    <motion.div
        variants={itemVariants}
        className="group relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white hover:border-brand-blue/20 transition-all duration-1000 shadow-sm hover:shadow-xl hover:-translate-y-2 min-h-[520px] flex flex-col justify-end cursor-default"
    >
        {/* CMYK Ribbon */}
        {cmyk && (
            <div className="absolute top-0 right-10 flex gap-1 z-30">
                <div className={`w-1 h-12 ${cmyk === 'C' ? 'bg-cyan-500' : cmyk === 'M' ? 'bg-brand-blue' : cmyk === 'Y' ? 'bg-yellow-400' : 'bg-slate-200'} opacity-30 group-hover:opacity-100 transition-opacity`} />
            </div>
        )}

        {/* Background image */}
        <div className="absolute inset-0 z-0">
            <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover opacity-[0.08] mix-blend-multiply group-hover:opacity-[0.12] group-hover:scale-105 transition-all duration-[2s] ease-out"
            />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-10 pointer-events-none" />
        {/* Blue glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/0 to-brand-blue/0 group-hover:from-brand-blue/5 group-hover:to-transparent transition-all duration-1000 z-10 pointer-events-none" />

        <div className="relative z-20 p-10 lg:p-14 space-y-6">
            {/* Icon + badge */}
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:shadow-blue-glow-soft transition-all duration-500`}>
                    <Icon className={`w-7 h-7 ${accent}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.5em] ${accent} opacity-70`}>{subtitle}</span>
            </div>

            <div>
                <h3 className="text-4xl lg:text-5xl font-display font-black text-slate-900 tracking-[-0.04em] leading-none mb-4">
                    {title}
                </h3>
                <p className="text-slate-500 text-base font-light leading-relaxed max-w-md uppercase tracking-tight">
                    {description}
                </p>
            </div>

            {/* CTA */}
            <div className="pt-2 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 group-hover:text-brand-blue transition-colors duration-500">
                <span>Solicitar Cotización</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </motion.div>
);

// --- Compact card -------------------------------------------------------------
const CompactCard: React.FC<typeof services[0] & { delay?: number }> = ({
    index, title, subtitle, description, icon: Icon, imageUrl, accent, glow, cmyk, delay = 0,
}) => (
    <motion.div
        variants={itemVariants}
        className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white hover:border-brand-blue/10 transition-all duration-700 shadow-sm hover:shadow-md hover:-translate-y-2 flex flex-col"
    >
        {/* CMYK Accent line */}
        {cmyk && (
            <div className={`absolute top-0 left-0 w-full h-[2px] ${cmyk === 'C' ? 'bg-cyan-500' : cmyk === 'M' ? 'bg-brand-blue' : cmyk === 'Y' ? 'bg-yellow-400' : 'bg-slate-200'} z-30 opacity-30 group-hover:opacity-100 transition-opacity`} />
        )}

        {/* Image */}
        <div className="relative h-44 overflow-hidden shrink-0 bg-slate-50">
            <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover opacity-[0.05] mix-blend-multiply group-hover:opacity-[0.1] group-hover:scale-110 transition-all duration-[2s] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 pointer-events-none" />
            {/* Index number */}
            <span className="absolute top-5 left-6 text-5xl font-display font-black text-slate-100 group-hover:text-brand-blue/5 transition-colors duration-700 leading-none">
                {index}
            </span>
            {/* Icon */}
            <div className={`absolute bottom-5 right-5 w-11 h-11 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:shadow-blue-glow-soft transition-all duration-500`}>
                <Icon className={`w-5 h-5 ${accent}`} />
            </div>
        </div>

        {/* Body */}
        <div className="p-8 flex-grow flex flex-col gap-3 bg-white border-t border-slate-50">
            <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${accent} opacity-60`}>{subtitle}</p>
            <h3 className="text-2xl font-display font-black text-slate-900 tracking-[-0.04em] leading-tight group-hover:text-brand-blue transition-colors duration-500">
                {title}
            </h3>
            <p className="text-slate-500 text-sm font-light leading-relaxed flex-grow uppercase tracking-tight">
                {description}
            </p>
            <div className="pt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-blue transition-colors duration-500 border-t border-slate-50 mt-2">
                <span>Ver detalle</span>
                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </motion.div>
);

// --- Main component -----------------------------------------------------------
const Services: React.FC = () => {
    const [featured, ...rest] = services;

    return (
        <section id="services" className="py-32 lg:py-40 bg-white relative overflow-hidden">
            {/* Ambient background orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-brand-blue/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-slate-100 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 lg:px-10 relative z-10">

                {/* --- Section header --- */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-20 lg:mb-28 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-l-2 border-brand-blue pl-10"
                >
                    <div className="space-y-5">
                        <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.6em]">
                            PRECISIÓN INDUSTRIAL_V5.0
                        </p>
                        <h2 className="text-5xl md:text-7xl lg:text-[8rem] font-display font-black text-slate-900 leading-[0.8] tracking-[-0.04em] uppercase">
                            CÓRDOVA{' '}
                            <br />
                            <span className="text-brand-blue">IMPRESIÓN</span>
                        </h2>
                    </div>
                    <p className="text-slate-500 max-w-sm text-base font-light leading-relaxed pb-2 lg:text-right uppercase tracking-wider opacity-60">
                        Soberanía visual a través de ingeniería gráfica de vanguardia.
                    </p>
                </motion.div>

                {/* --- Bento grid --- */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                >
                    {/* Featured card spans full width on mobile, 1 col on lg */}
                    <div className="md:col-span-2 lg:col-span-1 lg:row-span-2">
                        <FeaturedCard {...featured} />
                    </div>

                    {/* 5 compact cards */}
                    {rest.map((service) => (
                        <CompactCard key={service.id} {...service} />
                    ))}
                </motion.div>

                {/* --- Bottom CTA strip --- */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                    className="mt-20 pt-16 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8"
                >
                    <div className="text-center md:text-left space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">¿Tienes un proyecto en mente?</p>
                        <p className="text-2xl font-display font-black text-slate-900 tracking-tight">
                            Cuéntanos y lo hacemos realidad.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                        <a
                            href="https://wa.me/593993083943"
                            target="_blank"
                            rel="noreferrer"
                            className="group px-10 py-4 bg-brand-blue text-white rounded-full font-black text-[10px] uppercase tracking-[0.25em] hover:bg-slate-900 hover:shadow-blue-glow-soft hover:scale-105 transition-all duration-300 flex items-center gap-3 active:scale-95"
                        >
                            <ReceiptIcon className="w-4 h-4" />
                            Solicitar Cotización
                            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a
                            href="#sri"
                            className="px-10 py-4 bg-slate-50 border border-slate-100 text-slate-900 rounded-full font-black text-[10px] uppercase tracking-[0.25em] hover:bg-slate-100 transition-all duration-300 flex items-center gap-3"
                        >
                            <ShieldCheckIcon className="w-4 h-4 text-brand-blue" />
                            Trámites SRI
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Services;