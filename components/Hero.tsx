
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    SparklesIcon, ArrowRightIcon, MapPinIcon, ClockIcon,
    PrinterIcon, WhatsAppIcon, UploadIcon, Loader2Icon,
    CheckCircleIcon, CloseIcon
} from './Icons';
import { analyzeImageQualityForPrint } from '../services/geminiService';

// â”€â”€ Stat pill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Stat: React.FC<{ label: string; value: string; sub: string }> = ({ label, value, sub }) => (
    <div className="text-center group">
        <p className="text-[9px] font-black text-liquid-gold/60 uppercase tracking-[0.4em] mb-2 group-hover:text-liquid-gold transition-colors">{label}</p>
        <p className="text-3xl md:text-5xl font-display font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-700 inline-block">{value}</p>
        <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1">{sub}</p>
    </div>
);

// â”€â”€ Hero Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Hero: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);

    const handleFileTest = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsTesting(true);
        setTestResult(null);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            const result = await analyzeImageQualityForPrint(base64);
            setTestResult(result);
            setIsTesting(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <section id="home" className="relative min-h-screen flex items-center overflow-hidden bg-brand-dark">

            {/* â”€â”€ Cinematic background â”€â”€ */}
            <div className="absolute inset-0 z-0 mask-fade-b pointer-events-none">
                <img
                    src="https://images.unsplash.com/photo-1628126235206-5260b9ea6441?q=80&w=2574&auto=format&fit=crop"
                    alt=""
                    className="w-full h-full object-cover opacity-[0.12] mix-blend-luminosity animate-float"
                />
                {/* Gold orb */}
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-liquid-gold/5 blur-[160px] rounded-full animate-pulse pointer-events-none" />
                {/* Red accent */}
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-red/5 blur-[120px] rounded-full pointer-events-none" />
                {/* Noise texture */}
                <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-60 pointer-events-none" />
            </div>

            {/* â”€â”€ Content grid â”€â”€ */}
            <div className="container mx-auto px-6 lg:px-10 relative z-10 pt-28 pb-20">
                <div className="grid lg:grid-cols-12 gap-16 items-center">

                    {/* â”€â”€ LEFT: Copy â”€â”€ */}
                    <div className="lg:col-span-7 space-y-10 text-center lg:text-left">

                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="inline-flex items-center gap-3 px-5 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl text-liquid-gold shadow-gold-glow"
                        >
                            <SparklesIcon className="w-3.5 h-3.5 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.5em]">Alta Relojería Gráfica · Pasaje, El Oro</span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1.4, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
                            className="text-6xl md:text-[7.5rem] lg:text-[8rem] font-display font-black text-white leading-[0.85] tracking-tighter"
                        >
                            IMPRESIÓN{' '}
                            <br className="hidden md:block" />
                            <span className="font-editorial italic font-normal text-liquid-gold text-glow tracking-normal">
                                DE AUTOR.
                            </span>
                        </motion.h1>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.65 }}
                            transition={{ duration: 1.4, delay: 0.5 }}
                            className="text-lg md:text-2xl text-slate-300 font-light max-w-xl mx-auto lg:mx-0 leading-relaxed"
                        >
                            Transformamos visiones en piezas maestras con tecnología{' '}
                            <span className="text-white font-medium">Roland High-Fidelity</span>{' '}
                            y acabados dignos de exhibición.
                        </motion.p>

                        {/* Location pill row */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.7 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                                <MapPinIcon className="w-3.5 h-3.5 text-liquid-gold" />
                                <span className="text-[10px] font-bold text-slate-300 tracking-wide">Colón e/ Sucre · Diagonal al Parque</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                                <ClockIcon className="w-3.5 h-3.5 text-liquid-gold" />
                                <span className="text-[10px] font-bold text-slate-300 tracking-wide">Lun–Vie 08:00–19:00</span>
                            </div>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.85 }}
                            className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start pt-4"
                        >
                            <a
                                href="#sri"
                                className="px-10 py-5 bg-brand-red text-white rounded-full font-black text-[10px] uppercase tracking-[0.25em] hover:bg-red-700 hover:shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:scale-105 transition-all duration-300 active:scale-95"
                            >
                                Servicio S.R.I.
                            </a>
                            <a
                                href="https://wa.me/593993083943"
                                target="_blank"
                                rel="noreferrer"
                                className="group px-10 py-5 bg-white/5 border border-white/15 text-white rounded-full font-black text-[10px] uppercase tracking-[0.25em] hover:bg-liquid-gold hover:text-brand-dark hover:border-liquid-gold hover:shadow-gold-glow hover:scale-105 transition-all duration-300 flex items-center gap-3 active:scale-95"
                            >
                                <WhatsAppIcon className="w-4 h-4" />
                                <span>Concierge Privado</span>
                                <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </motion.div>

                        {/* Stats Row */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1.5, delay: 1.1 }}
                            className="grid grid-cols-4 gap-4 pt-12 mt-4 border-t border-white/5"
                        >
                            <Stat label="Innovación" value="TOP" sub="Nivel" />
                            <Stat label="Precisión" value="99%" sub="CMYK" />
                            <Stat label="Resolución" value="8K" sub="DPI" />
                            <Stat label="Clientes" value="50+" sub="Por Día" />
                        </motion.div>
                    </div>

                    {/* â”€â”€ RIGHT: Vision AI Card â”€â”€ */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                            className="relative group"
                        >
                            {/* Glow */}
                            <div className="absolute -inset-6 bg-liquid-gold/5 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                            <div className="relative bg-white/[0.04] border border-white/8 rounded-[2.5rem] overflow-hidden backdrop-blur-2xl shadow-luxury p-10 min-h-[480px] flex flex-col justify-center gap-10">
                                {/* Scan line animation when testing */}
                                {isTesting && (
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-liquid-gold/60 shadow-gold-glow animate-scan z-20" />
                                )}

                                {/* Card accent top border */}
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-liquid-gold/30 to-transparent" />

                                {isTesting ? (
                                    /* Loading state */
                                    <div className="text-center space-y-8 py-8">
                                        <div className="relative inline-block">
                                            <div className="absolute inset-0 bg-liquid-gold/15 blur-2xl rounded-full scale-150 animate-pulse" />
                                            <Loader2Icon className="w-16 h-16 animate-spin text-liquid-gold relative z-10 mx-auto" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-display font-black text-white uppercase tracking-widest italic">Analizando Calidad...</h3>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Procesando densidad de píxeles y gama cromática</p>
                                        </div>
                                    </div>
                                ) : testResult ? (
                                    /* Result state */
                                    <div className="animate-fade-in space-y-8">
                                        <div className="flex justify-between items-center">
                                            <div className="px-4 py-1.5 bg-liquid-gold/10 border border-liquid-gold/20 rounded-full text-liquid-gold text-[9px] font-black uppercase tracking-widest">
                                                Análisis Alpha-7
                                            </div>
                                            <button
                                                onClick={() => { setTestResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                                className="text-slate-600 hover:text-white transition-colors"
                                            >
                                                <CloseIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-4xl font-display font-black text-white leading-none tracking-tight">{testResult.veredicto}</h3>
                                            <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Observación del Atelier:</p>
                                                <p className="text-base font-medium text-slate-300 italic leading-relaxed">"{testResult.calidad}"</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-all"
                                        >
                                            Repetir Diagnóstico
                                        </button>
                                    </div>
                                ) : (
                                    /* Default state */
                                    <div className="space-y-10">
                                        {/* Header */}
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-liquid-gold/10 border border-liquid-gold/20 rounded-2xl flex items-center justify-center shadow-gold-glow animate-float shrink-0">
                                                <SparklesIcon className="w-6 h-6 text-liquid-gold" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-display font-black text-white leading-none tracking-tight">
                                                    VISION{' '}
                                                    <span className="font-editorial italic font-normal text-liquid-gold">A.I.</span>
                                                </h3>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">
                                                    Auditoría Algorítmica de Calidad de Impresión
                                                </p>
                                            </div>
                                        </div>

                                        {/* Drop zone */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="group/drop relative p-14 border border-white/8 rounded-[2rem] hover:border-liquid-gold/40 transition-all duration-700 cursor-pointer overflow-hidden bg-white/[0.01]"
                                        >
                                            {/* Hover gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/0 via-liquid-gold/4 to-liquid-gold/0 opacity-0 group-hover/drop:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                                            {/* Shimmer line */}
                                            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-liquid-gold/50 to-transparent transform -translate-x-full group-hover/drop:translate-x-full transition-transform duration-1000 pointer-events-none" />

                                            <div className="relative text-center space-y-5">
                                                <div className="w-14 h-14 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover/drop:bg-liquid-gold group-hover/drop:border-liquid-gold group-hover/drop:shadow-gold-glow transition-all duration-500">
                                                    <UploadIcon className="w-5 h-5 text-slate-500 group-hover/drop:text-brand-dark transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-display font-bold text-white mb-1">Importar Archivo Maestro</p>
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">JPG · PNG · WEBP</p>
                                                </div>
                                                <p className="text-xs text-slate-600 font-light">
                                                    La IA analiza la resolución, saturación y densidad de color de tu archivo antes de enviarlo a imprimir.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Trust indicator */}
                                        <div className="flex items-center justify-center gap-3 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                            <CheckCircleIcon className="w-4 h-4 text-liquid-gold/40" />
                                            <span>Diagnóstico impulsado por Gemini Pro Vision</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>

            {/* â”€â”€ Hidden file input â”€â”€ */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileTest}
            />
        </section>
    );
};

export default Hero;
