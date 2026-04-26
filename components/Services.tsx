
import React from 'react';
import { motion } from 'framer-motion';
import {
    PrinterIcon, ShieldCheckIcon, CalculatorIcon, SparklesIcon,
    LayersIcon, PaletteIcon, ArrowRightIcon, ReceiptIcon
} from './Icons';

// â”€â”€ Service data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const services = [
    {
        id: '1',
        index: '01',
        title: 'GigantografÃ­as HD',
        subtitle: 'Gran Formato Roland',
        description:
            'Lonas, banners y vinilos con tecnologÃ­a Roland High-Fidelity. Colores saturados que resisten sol, lluvia y el paso del tiempo.',
        icon: PrinterIcon,
        imageUrl: 'https://images.unsplash.com/photo-1520697517317-6767553cc51a?auto=format&fit=crop&q=80&w=800',
        accent: 'text-liquid-gold',
        glow: 'shadow-gold-glow',
        featured: true,
    },
    {
        id: '2',
        index: '02',
        title: 'Imprenta Autorizada SRI',
        subtitle: 'Documentos con Validez Fiscal',
        description:
            'Facturas, Notas de Venta, Retenciones, Liquidaciones de compra y GuÃ­as de remisiÃ³n. Autorizados y con numeraciÃ³n SRI.',
        icon: ShieldCheckIcon,
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800',
        accent: 'text-brand-red',
        glow: 'shadow-[0_0_20px_rgba(225,29,72,0.3)]',
        featured: false,
    },
    {
        id: '3',
        index: '03',
        title: 'GestiÃ³n Tributaria',
        subtitle: 'IVA Â· Renta Â· Anexos',
        description:
            'Declaraciones de IVA Mensual y Semestral, Impuesto a la Renta, Anexos Transaccionales, RUC y RISE. Tus cifras en orden.',
        icon: CalculatorIcon,
        imageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=800',
        accent: 'text-blue-400',
        glow: 'shadow-[0_0_20px_rgba(96,165,250,0.2)]',
        featured: false,
    },
    {
        id: '4',
        index: '04',
        title: 'Material Publicitario',
        subtitle: 'Tarjetas Â· Volantes Â· DÃ­pticos',
        description:
            'Desde tarjetas de presentaciÃ³n premium hasta folletos corporativos. DiseÃ±o estratÃ©gico para que tu marca cause primera impresiÃ³n.',
        icon: PaletteIcon,
        imageUrl: 'https://images.unsplash.com/photo-1586075010683-2350bcbc085c?auto=format&fit=crop&q=80&w=800',
        accent: 'text-purple-400',
        glow: 'shadow-[0_0_20px_rgba(167,139,250,0.2)]',
        featured: false,
    },
    {
        id: '5',
        index: '05',
        title: 'Acabados Premium',
        subtitle: 'Troquelado Â· Barniz UV Â· Laminado',
        description:
            'Terminaciones que elevan cualquier pieza al nivel de obra de arte. Lacados mate, brillos selectivos y relieves tÃ¡ctiles.',
        icon: SparklesIcon,
        imageUrl: 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=800',
        accent: 'text-liquid-gold',
        glow: 'shadow-gold-glow',
        featured: false,
    },
    {
        id: '6',
        index: '06',
        title: 'Sellos y EncuadernaciÃ³n',
        subtitle: 'Tesis Â· Archivos Â· Sellos Express',
        description:
            'Sellos automÃ¡ticos y de madera al instante, empastados de tesis y encuadernaciÃ³n de archivos contables con acabados de lujo.',
        icon: LayersIcon,
        imageUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=800',
        accent: 'text-emerald-400',
        glow: 'shadow-[0_0_20px_rgba(52,211,153,0.2)]',
        featured: false,
    },
];

// â”€â”€ Animation variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as any } },
};

// â”€â”€ Featured card (large) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const FeaturedCard: React.FC<typeof services[0]> = ({ title, subtitle, description, icon: Icon, imageUrl, accent, glow }) => (
    <motion.div
        variants={itemVariants}
        className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 hover:border-liquid-gold/20 transition-all duration-1000 shadow-luxury hover:-translate-y-2 min-h-[520px] flex flex-col justify-end cursor-default"
    >
        {/* Background image */}
        <div className="absolute inset-0 z-0">
            <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover opacity-25 mix-blend-luminosity group-hover:opacity-40 group-hover:scale-105 transition-all duration-[2s] ease-out"
            />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/70 to-transparent z-10 pointer-events-none" />
        {/* Gold glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/0 to-liquid-gold/0 group-hover:from-liquid-gold/5 group-hover:to-transparent transition-all duration-1000 z-10 pointer-events-none" />

        <div className="relative z-20 p-10 lg:p-14 space-y-6">
            {/* Icon + badge */}
            <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:${glow} transition-all duration-500`}>
                    <Icon className={`w-7 h-7 ${accent}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-[0.5em] ${accent} opacity-70`}>{subtitle}</span>
            </div>

            <div>
                <h3 className="text-4xl lg:text-5xl font-display font-black text-white tracking-tighter leading-none mb-4">
                    {title}
                </h3>
                <p className="text-slate-400 text-base font-light leading-relaxed max-w-md">
                    {description}
                </p>
            </div>

            {/* CTA */}
            <div className="pt-2 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 group-hover:text-liquid-gold transition-colors duration-500">
                <span>Solicitar CotizaciÃ³n</span>
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </motion.div>
);

// â”€â”€ Compact card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CompactCard: React.FC<typeof services[0] & { delay?: number }> = ({
    index, title, subtitle, description, icon: Icon, imageUrl, accent, glow, delay = 0,
}) => (
    <motion.div
        variants={itemVariants}
        className="group relative overflow-hidden rounded-[2rem] border border-white/5 hover:border-white/15 transition-all duration-700 shadow-luxury hover:-translate-y-2 flex flex-col"
    >
        {/* Image */}
        <div className="relative h-44 overflow-hidden shrink-0">
            <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover opacity-20 mix-blend-luminosity group-hover:opacity-35 group-hover:scale-110 transition-all duration-[2s] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-dark/90 pointer-events-none" />
            {/* Index number */}
            <span className="absolute top-5 left-6 text-5xl font-display font-black text-white/5 group-hover:text-liquid-gold/10 transition-colors duration-700 leading-none">
                {index}
            </span>
            {/* Icon */}
            <div className={`absolute bottom-5 right-5 w-11 h-11 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center group-hover:${glow} group-hover:border-white/20 transition-all duration-500`}>
                <Icon className={`w-5 h-5 ${accent}`} />
            </div>
        </div>

        {/* Body */}
        <div className="p-8 flex-grow flex flex-col gap-3 bg-brand-dark border-t border-white/5">
            <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${accent} opacity-60`}>{subtitle}</p>
            <h3 className="text-2xl font-display font-black text-white tracking-tighter leading-tight group-hover:text-liquid-gold transition-colors duration-500">
                {title}
            </h3>
            <p className="text-slate-500 text-sm font-light leading-relaxed flex-grow">
                {description}
            </p>
            <div className="pt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-700 group-hover:text-liquid-gold transition-colors duration-500 border-t border-white/5 mt-2">
                <span>Ver detalle</span>
                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </motion.div>
);

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Services: React.FC = () => {
    const [featured, ...rest] = services;

    return (
        <section id="services" className="py-32 lg:py-40 bg-brand-dark relative overflow-hidden">
            {/* Ambient background orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-liquid-gold/3 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-brand-red/3 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 lg:px-10 relative z-10">

                {/* â”€â”€ Section header â”€â”€ */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="mb-20 lg:mb-28 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-l-2 border-liquid-gold pl-10"
                >
                    <div className="space-y-5">
                        <p className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.5em]">
                            Servicios Especializados
                        </p>
                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white leading-[0.85] tracking-tighter uppercase">
                            ARTE{' '}
                            <br />
                            <span className="text-white/15">INDUSTRIAL</span>
                        </h2>
                    </div>
                    <p className="text-slate-500 max-w-sm text-base font-light leading-relaxed italic pb-2 lg:text-right">
                        Desde la primera impresiÃ³n hasta el acabado final, cada detalle es una declaraciÃ³n de intenciÃ³n hacia la excelencia.
                    </p>
                </motion.div>

                {/* â”€â”€ Bento grid â”€â”€ */}
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

                {/* â”€â”€ Bottom CTA strip â”€â”€ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                    className="mt-20 pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8"
                >
                    <div className="text-center md:text-left space-y-2">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Â¿Tienes un proyecto en mente?</p>
                        <p className="text-2xl font-display font-black text-white tracking-tight">
                            CuÃ©ntanos y lo hacemos realidad.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                        <a
                            href="https://wa.me/593993083943"
                            target="_blank"
                            rel="noreferrer"
                            className="group px-10 py-4 bg-liquid-gold text-brand-dark rounded-full font-black text-[10px] uppercase tracking-[0.25em] hover:bg-white hover:shadow-gold-glow hover:scale-105 transition-all duration-300 flex items-center gap-3 active:scale-95"
                        >
                            <ReceiptIcon className="w-4 h-4" />
                            Solicitar CotizaciÃ³n
                            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a
                            href="#sri"
                            className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-full font-black text-[10px] uppercase tracking-[0.25em] hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex items-center gap-3"
                        >
                            <ShieldCheckIcon className="w-4 h-4 text-brand-red" />
                            Documentos SRI
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Services;