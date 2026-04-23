
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
    WrenchScrewdriverIcon, PrinterIcon, SparklesIcon, 
    TableCellsIcon as TableIcon, Cog8ToothIcon, 
    ChevronRightIcon, ExclamationTriangleIcon,
    CurrencyDollarIcon as DollarIcon, ArrowRightIcon,
    ClockIcon, ShieldCheckIcon, CpuIcon, RocketLaunchIcon,
    BeakerIcon, DocumentDuplicateIcon as DocumentIcon,
    CircleStackIcon
} from '@heroicons/react/24/solid';
import { CloseIcon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { logActivity } from '../services/activityLogService';
import { SOURCE_PAPERS, DEFAULT_COSTS } from '../constants';
import { CostConfig } from '../types';

// --- ANIMATION VARIANTS ---
const fadeInUp = {
    initial: { opacity: 0, y: 30, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.08
        }
    }
};

// --- TYPES ---
type Mode = 'OFFSET' | 'DIGITAL' | 'CONFIG';

// --- COMPONENTE VISUAL STEP ---
const VisualStep: React.FC<{
    title: string;
    image: string;
    subtitle: string;
    detail: string;
    cost?: number;
    isLast?: boolean;
}> = ({ title, image, subtitle, detail, cost, isLast }) => (
    <motion.div 
        variants={fadeInUp}
        className="flex-1 relative group w-full lg:w-auto"
    >
        {!isLast && (
            <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-[1px] bg-white/10 z-0"></div>
        )}
        
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[3rem] border border-white/10 overflow-hidden hover:border-liquid-gold/30 transition-all duration-700 h-full flex flex-col group/step shadow-2xl relative">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            {/* Image Area */}
            <div className="h-44 w-full relative overflow-hidden bg-black/40">
                <img src={image} alt={title} className="w-full h-full object-cover opacity-10 grayscale group-hover/step:grayscale-0 group-hover/step:opacity-40 transition-all duration-1000 scale-125 group-hover/step:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent flex items-end p-8">
                    <span className="text-white font-black text-[10px] uppercase tracking-[0.4em] flex items-center gap-4">
                        <span className="bg-liquid-gold w-9 h-9 rounded-full flex items-center justify-center text-[13px] text-black shadow-gold-glow-sm font-black">{title.split('.')[0]}</span>
                        {title.split('. ')[1]}
                    </span>
                </div>
            </div>
            
            {/* Content Area */}
            <div className="p-10 flex flex-col flex-grow bg-white/[0.01]">
                <h4 className="font-bold text-white text-xl mb-4 leading-none italic group-hover/step:text-liquid-gold transition-colors tracking-tighter uppercase">{subtitle}</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-8 flex-grow leading-relaxed italic">{detail}</p>
                {cost !== undefined && (
                    <div className="flex justify-between items-center border-t border-white/5 pt-8 mt-auto">
                        <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Valorización Técnica</span>
                        <span className="font-black text-lg text-white tracking-tighter group-hover/step:text-liquid-gold transition-colors italic">{formatCurrency(cost)}</span>
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

// --- COMPONENTE VISUAL DE PROCESO (PIPELINE) ---
const ProductionPipeline: React.FC<{ 
    sourceName: string; 
    sourceType: string;
    sourceSize: string;
    cutSize: string;
    cutsPerUnit: number;
    prePressCost: number;
    materialCost: number;
    printCost: number;
}> = ({ sourceName, sourceType, sourceSize, cutSize, cutsPerUnit, prePressCost, materialCost, printCost }) => {
    
    const images = {
        input: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=600",
        prepress: "https://images.unsplash.com/photo-1626785774573-4b7993143a2d?auto=format&fit=crop&q=80&w=600",
        print: "https://images.unsplash.com/photo-1619551734325-81372338c237?auto=format&fit=crop&q=80&w=600",
        finish: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600"
    };

    return (
        <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="w-full"
        >
            <div className="flex flex-col lg:flex-row gap-8 justify-between">
                <VisualStep 
                    title="1. Sustrato" 
                    image={images.input} 
                    subtitle={sourceName} 
                    detail={`${sourceType} • MATRIZ FÍSICA • ${sourceSize}`}
                    cost={materialCost}
                />
                <VisualStep 
                    title="2. Pre-Impresión" 
                    image={images.prepress} 
                    subtitle="Profiling Offset" 
                    detail="INSUMO TÉCNICO • CTP / POLIÉSTER"
                    cost={prePressCost}
                />
                <VisualStep 
                    title="3. Ejecución" 
                    image={images.print} 
                    subtitle="Chasis Mecánico" 
                    detail="TIRAJE INDUSTRIAL • CALIBRACIÓN"
                    cost={printCost}
                />
                <VisualStep 
                    title="4. Arquitectura" 
                    image={images.finish} 
                    subtitle="Acabado Final" 
                    detail={`${cutSize} (${cutsPerUnit} IMPS/HOJA)`}
                    isLast
                />
            </div>
        </motion.div>
    );
};

// --- CALCULADORA OFFSET ---
const OffsetCalculator: React.FC<{ costs: CostConfig }> = ({ costs }) => {
    const [paperId, setPaperId] = useState('QUIMICO');
    const [selectedSizePreset, setSelectedSizePreset] = useState('1/4_OFICIO');
    const [finalW, setFinalW] = useState(10.5);
    const [finalH, setFinalH] = useState(14.8);
    const [quantity, setQuantity] = useState(100);
    const [cantidadHojasBlock, setCantidadHojasBlock] = useState(100);
    const [colorsFront, setColorsFront] = useState(1); 
    const [colorsBack, setColorsBack] = useState(0);
    const [parts, setParts] = useState(2);
    const [hasDesign, setHasDesign] = useState(false);
    const [requiresSRI, setRequiresSRI] = useState(true);

    const handlePresetChange = (val: string) => {
        setSelectedSizePreset(val);
        const currentPaper = SOURCE_PAPERS.find(p => p.id === paperId);
        if (currentPaper?.tipo === 'RESMA') {
            switch(val) {
                case 'OFICIO': setFinalW(21.6); setFinalH(33); break;
                case '1/2_OFICIO': setFinalW(21.6); setFinalH(16.5); break;
                case '1/4_OFICIO': setFinalW(10.8); setFinalH(16.5); break;
                case '1/8_OFICIO': setFinalW(10.8); setFinalH(8.25); break;
            }
        } else {
            switch(val) {
                case 'A3': setFinalW(29.7); setFinalH(42); break;
                case 'A4': setFinalW(21); setFinalH(29.7); break;
                case 'A5': setFinalW(14.8); setFinalH(21); break;
                case 'A6': setFinalW(10.5); setFinalH(14.8); break;
            }
        }
    };

    const result = useMemo(() => {
        const paper = SOURCE_PAPERS.find(p => p.id === paperId) || SOURCE_PAPERS[0];
        const marginY = 1.0; 
        const marginX = 0.5;
        const usableW = paper.ancho - marginX;
        const usableH = paper.alto - marginY;
        const cutsA = Math.floor(usableW / (finalW/10)) * Math.floor(usableH / (finalH/10));
        const cutsB = Math.floor(usableW / (finalH/10)) * Math.floor(usableH / (finalW/10));
        const cutsPerUnit = Math.max(cutsA, cutsB);
        if (cutsPerUnit === 0) return null;

        let totalSheetsNeeded = 0;
        let costPapelTotal = 0;

        if (paper.id === 'QUIMICO') {
            const totalJuegos = quantity * cantidadHojasBlock; 
            const bajadasNecesarias = Math.ceil(totalJuegos / cutsPerUnit);
            const merma = Math.ceil(bajadasNecesarias * 0.10) + 20; 
            const totalBajadasConMerma = bajadasNecesarias + merma;
            const costoHojaOriginal = costs.COSTO_RESMA_QUIMICO_ORIG / 500;
            const costoHojaCopia = costs.COSTO_RESMA_QUIMICO_COPIA / 500;
            costPapelTotal = (totalBajadasConMerma * costoHojaOriginal) + (totalBajadasConMerma * (parts - 1) * costoHojaCopia);
            totalSheetsNeeded = totalBajadasConMerma * parts;
        } else if (paper.tipo === 'RESMA') {
            const bajadas = Math.ceil(quantity / cutsPerUnit);
            const merma = Math.ceil(bajadas * 0.10) + 30;
            const totalHojas = bajadas + merma;
            costPapelTotal = totalHojas * (costs[paper.costoBaseKey as keyof CostConfig] / 500);
            totalSheetsNeeded = totalHojas;
        } else {
            const bajadas = Math.ceil(quantity / cutsPerUnit);
            const merma = Math.ceil(bajadas * 0.10) + 5;
            const totalPliegos = bajadas + merma;
            costPapelTotal = totalPliegos * costs[paper.costoBaseKey as keyof CostConfig];
            totalSheetsNeeded = totalPliegos;
        }

        let costPrePrensa = 0;
        if (!hasDesign) costPrePrensa += requiresSRI ? costs.COSTO_DISENO_SRI : 5.00;
        const numPlacas = colorsFront + colorsBack;
        const costingPlaca = (quantity > 2000 || paper.id === 'COUCHE_300') ? costs.COSTO_PLACA_CTP : costs.COSTO_PLACA_POLIESTER;
        costPrePrensa += (numPlacas * costingPlaca);

        const millares = Math.ceil(totalSheetsNeeded / 1000);
        const tiros = millares * (colorsFront + colorsBack);
        const costImpresion = costs.COSTO_ARRANQUE + (tiros * costs.COSTO_MILLAR_IMPRESION);

        let costAcabados = costs.COSTO_CORTE;
        if (paper.id === 'QUIMICO') {
            costAcabados += (quantity * costs.COSTO_BLOCK_ENCOLADO) + (millares * costs.COSTO_NUMERACION);
        }

        const costoTotalProduccion = costPapelTotal + costPrePrensa + costImpresion + costAcabados;
        let pvp = costoTotalProduccion * (1 + costs.MARGEN_GANANCIA);
        if (paper.id === 'QUIMICO' && quantity === 1 && pvp < 15) pvp = 15;

        return { paper, cutsPerUnit, costPapelTotal, costPrePrensa, costImpresion, costAcabados, costoTotalProduccion, pvp, unitario: pvp / quantity };
    }, [paperId, finalW, finalH, quantity, colorsFront, colorsBack, parts, costs, hasDesign, requiresSRI, cantidadHojasBlock]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Panel de Entradas */}
            <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="lg:col-span-4 space-y-10"
            >
                <div className="glass-card-luxury p-12 relative overflow-hidden group shadow-3xl rounded-[3.5rem] border border-white/10">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-liquid-gold/5 rounded-full blur-[90px] -mr-24 -mt-24 group-hover:bg-liquid-gold/15 transition-all duration-1000" />
                    
                    <div className="flex items-center gap-8 mb-16 pb-12 border-b border-white/5 relative z-10">
                        <div className="bg-liquid-gold/10 p-5 rounded-2xl border border-liquid-gold/20 shadow-gold-glow-soft text-liquid-gold">
                            <CpuIcon className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="font-bold text-white text-3xl tracking-tighter italic uppercase">Núcleo <span className="text-liquid-gold">Técnico</span></h2>
                            <p className="text-[10px] text-liquid-gold/40 font-black uppercase tracking-[0.5em]">Parámetros de Ingeniería</p>
                        </div>
                    </div>

                    <div className="space-y-12 relative z-10">
                        {/* Sustrato */}
                        <div className="space-y-5">
                            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2 italic">Sustrato Físico</label>
                            <div className="relative group">
                                <select 
                                    value={paperId} 
                                    onChange={e => {setPaperId(e.target.value); handlePresetChange('1/4_OFICIO')}} 
                                    className="w-full p-6 bg-black/60 border-2 border-white/5 rounded-3xl text-sm font-black text-white outline-none focus:border-liquid-gold/40 transition-all appearance-none cursor-pointer group-hover:bg-black/80 tracking-widest uppercase italic"
                                >
                                    {SOURCE_PAPERS.map(p => <option key={p.id} value={p.id} className="bg-slate-950">{p.nombre.toUpperCase()}</option>)}
                                </select>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-700">
                                    <ChevronRightIcon className="w-5 h-5 rotate-90" />
                                </div>
                            </div>
                        </div>

                        {/* Dimensiones */}
                        <div className="space-y-6">
                            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2 italic">Geometría del Artefacto</label>
                            <div className="grid grid-cols-2 gap-4">
                                {SOURCE_PAPERS.find(p=>p.id===paperId)?.tipo === 'RESMA' ? (
                                    ['OFICIO', '1/2_OFICIO', '1/4_OFICIO', '1/8_OFICIO'].map(p => (
                                        <button key={p} onClick={() => handlePresetChange(p)} className={`py-5 text-[10px] font-black uppercase tracking-widest border-2 rounded-2xl transition-all duration-700 ${selectedSizePreset===p ? 'bg-white text-black border-white shadow-luxury scale-105' : 'bg-white/[0.02] text-slate-600 border-white/5 hover:border-white/20'}`}>{p.replace('_OFICIO', '')}</button>
                                    ))
                                ) : (
                                    ['A3', 'A4', 'A5', 'A6'].map(p => (
                                        <button key={p} onClick={() => handlePresetChange(p)} className={`py-5 text-[10px] font-black uppercase tracking-widest border-2 rounded-2xl transition-all duration-700 ${selectedSizePreset===p ? 'bg-white text-black border-white shadow-luxury scale-105' : 'bg-white/[0.02] text-slate-600 border-white/5 hover:border-white/20'}`}>{p}</button>
                                    ))
                                )}
                            </div>
                            <div className="flex items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/5">
                                <div className="relative flex-1">
                                    <input type="number" value={finalW} onChange={e => setFinalW(parseFloat(e.target.value))} className="w-full h-14 bg-transparent border-none text-center text-white font-black text-xl outline-none" />
                                    <span className="absolute left-4 top-1 text-[9px] font-black text-slate-700 uppercase">Ancho</span>
                                </div>
                                <div className="w-[1px] h-10 bg-white/5" />
                                <div className="relative flex-1">
                                    <input type="number" value={finalH} onChange={e => setFinalH(parseFloat(e.target.value))} className="w-full h-14 bg-transparent border-none text-center text-white font-black text-xl outline-none" />
                                    <span className="absolute left-4 top-1 text-[9px] font-black text-slate-700 uppercase">Alto</span>
                                </div>
                                <span className="pr-4 text-[10px] font-black text-slate-800 italic">mm</span>
                            </div>
                        </div>

                        {/* Volumen de Producción */}
                        <div className="space-y-5">
                            <label className="block text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] ml-2 italic">Escala de Producción</label>
                            <div className="flex gap-4">
                                <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="flex-1 p-7 bg-black/60 border-2 border-white/5 rounded-3xl text-4xl font-black text-liquid-gold outline-none focus:border-liquid-gold/40 transition-all text-center placeholder:text-slate-900 shadow-inner" placeholder="0" />
                                {paperId === 'QUIMICO' && (
                                    <select value={cantidadHojasBlock} onChange={e => setCantidadHojasBlock(parseInt(e.target.value))} className="w-1/3 bg-black/60 border-2 border-white/5 rounded-3xl text-[11px] font-black text-white p-2 outline-none appearance-none text-center cursor-pointer uppercase italic">
                                        <option value={100}>100 HJS</option>
                                        <option value={50}>50 HJS</option>
                                        <option value={25}>25 HJS</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Acabados Rápidos */}
                        <div className="pt-10 space-y-6 border-t border-white/5">
                            <label className="flex items-center gap-6 cursor-pointer group/toggle">
                                <div className="relative">
                                    <input type="checkbox" checked={hasDesign} onChange={e => setHasDesign(e.target.checked)} className="peer hidden" />
                                    <div className="w-14 h-8 bg-white/5 rounded-full border-2 border-white/5 peer-checked:bg-liquid-gold peer-checked:border-liquid-gold transition-all duration-700 shadow-inner" />
                                    <div className="absolute left-1.5 top-1.5 w-5 h-5 bg-slate-700 rounded-full transition-all duration-700 peer-checked:translate-x-6 peer-checked:bg-black peer-checked:shadow-luxury" />
                                </div>
                                <span className="text-[11px] font-black text-slate-700 group-hover/toggle:text-white transition-colors uppercase tracking-[0.3em] italic">Arte Digital Finalizado</span>
                            </label>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Panel de Resultados */}
            <div className="lg:col-span-8 space-y-12">
                {result ? (
                    <>
                        <ProductionPipeline 
                            sourceName={result.paper.nombre}
                            sourceType={result.paper.tipo}
                            sourceSize={`${result.paper.ancho}x${result.paper.alto} cm`}
                            cutSize={`${finalW}x${finalH} mm`}
                            cutsPerUnit={result.cutsPerUnit}
                            prePressCost={result.costPrePrensa}
                            materialCost={result.costPapelTotal}
                            printCost={result.costImpresion}
                        />

                        {/* Métricas Financieras */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Logística de Sustratos', val: result.costPapelTotal, icon: CircleStackIcon },
                                { label: 'Pre-Impresión Taller', val: result.costPrePrensa, icon: BeakerIcon },
                                { label: 'Tiraje Industrial', val: result.costImpresion, icon: RocketLaunchIcon },
                                { label: 'Acabados de Atelier', val: result.costAcabados, icon: DocumentIcon }
                            ].map((item, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem] backdrop-blur-3xl hover:bg-white/[0.05] hover:border-liquid-gold/20 transition-all cursor-crosshair group/metric shadow-xl"
                                >
                                    <item.icon className="w-5 h-5 text-slate-700 mb-8 group-hover/metric:text-liquid-gold transition-colors duration-500" />
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4 italic leading-tight">{item.label}</p>
                                    <p className="text-2xl font-black text-white tracking-tighter italic">{formatCurrency(item.val)}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Card Maestro de PVP */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className="relative rounded-[4.5rem] overflow-hidden bg-slate-950/80 border border-white/10 shadow-gold-glow-strong p-16 flex flex-col md:flex-row items-center justify-between group"
                        >
                            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-liquid-gold/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-liquid-gold/5 blur-[120px] pointer-events-none"></div>
                            
                            <div className="relative z-10 w-full md:w-auto space-y-12">
                                <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-white/5 rounded-full border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-liquid-gold animate-pulse shadow-gold-glow"></div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Matriz de Rendimiento Atelier</span>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] mb-4 italic">Costo Operativo Líquido</p>
                                    <p className="text-5xl font-black text-white tracking-tighter italic opacity-40 decoration-liquid-gold/20 underline underline-offset-8 decoration-1">{formatCurrency(result.costoTotalProduccion)}</p>
                                </div>
                                <p className="text-[10px] text-slate-800 uppercase tracking-[0.4em] italic font-black max-w-[220px] leading-relaxed">Sincronización estructural para optimización de recursos industriales</p>
                            </div>
                            
                            <div className="h-72 w-[1px] bg-gradient-to-b from-transparent via-white/5 to-transparent hidden md:block mx-20" />

                            <div className="text-center md:text-right mt-20 md:mt-0 relative z-10 w-full md:w-auto">
                                <div className="space-y-4 mb-12">
                                    <p className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.8em] mb-6 italic ml-auto max-w-fit">Valor de Mercado Sugerido</p>
                                    <div className="flex items-baseline gap-8 justify-center md:justify-end">
                                        <motion.span 
                                            key={result.pvp}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-9xl font-black text-white tracking-tighter italic drop-shadow-[0_0_40px_rgba(212,175,55,0.4)]"
                                        >
                                            {formatCurrency(result.pvp)}
                                        </motion.span>
                                        <span className="text-4xl text-slate-800 font-black tracking-tighter italic opacity-40 uppercase">+ IVA</span>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-8 items-center justify-end">
                                    <div className="px-10 py-5 bg-black/60 border border-white/5 rounded-3xl text-[11px] font-black tracking-[0.4em] text-slate-500 uppercase italic shadow-inner">
                                        Costo Unitario: <span className="text-white ml-4 font-black">{formatCurrency(result.unitario)}</span>
                                    </div>
                                    <button className="px-16 py-8 bg-white text-black rounded-[2.8rem] font-black text-[13px] uppercase tracking-[0.6em] shadow-luxury transition-all hover:bg-liquid-gold hover:scale-105 active:scale-95 flex items-center gap-5 group/btn overflow-hidden">
                                        <SparklesIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                        Inicializar Protocolo
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                ) : (
                    <div className="h-full min-h-[550px] flex flex-col items-center justify-center bg-white/[0.01] rounded-[4rem] border-2 border-dashed border-rose-500/10 p-24 text-center group">
                        <div className="w-36 h-36 bg-rose-500/5 rounded-full flex items-center justify-center mb-14 border border-rose-500/10 shadow-glow-rose group-hover:scale-110 transition-transform duration-1000">
                            <ExclamationTriangleIcon className="w-16 h-16 text-rose-500/40" />
                        </div>
                        <h4 className="text-4xl font-bold text-white mb-8 italic tracking-tighter uppercase">Restricción Geométrica Detectada</h4>
                        <p className="text-slate-700 font-black max-w-sm uppercase text-[12px] tracking-[0.5em] leading-loose italic">El formato declarado excede las fronteras físicas de la matriz seleccionada. Re-calibre las coordenadas espaciales.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- CALCULADORA DIGITAL ---
const DigitalCalculator: React.FC<{ costs: CostConfig }> = ({ costs }) => {
    const [format, setFormat] = useState<'A4' | 'A3' | 'SRA3'>('A3');
    const [paperType, setPaperType] = useState('COUCHE_150');
    const [colorMode, setColorMode] = useState<'COLOR' | 'BW'>('COLOR');
    const [sides, setSides] = useState<1 | 2>(1);
    const [quantity, setQuantity] = useState(10);

    const calculation = useMemo(() => {
        let clickCost = colorMode === 'COLOR' ? costs.CLICK_DIGITAL_A3 : costs.CLICK_DIGITAL_BN;
        if (format === 'A4') clickCost = clickCost * 0.6; 
        
        let sheetCost = 0;
        switch (paperType) {
            case 'BOND': sheetCost = costs.COSTO_RESMA_BOND / 500; break; 
            case 'COUCHE_115': sheetCost = (costs.COSTO_PLIEGO_COUCHE_300 / 4) * 0.8; break;
            case 'COUCHE_300': sheetCost = costs.COSTO_PLIEGO_COUCHE_300 / 4; break;
            case 'ADHESIVO': sheetCost = costs.COSTO_PLIEGO_ADHESIVO / 4; break;
            default: sheetCost = 0.10;
        }

        const productionCost = ((quantity * sides) * clickCost) + (quantity * sheetCost);
        const pvp = productionCost * (1 + costs.MARGEN_GANANCIA);
        
        return { unitCost: productionCost / quantity, totalCost: productionCost, unitPvp: pvp / quantity, totalPvp: pvp };
    }, [format, paperType, colorMode, sides, quantity, costs]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Controles */}
            <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card-luxury p-14 rounded-[3.5rem] border border-white/10 shadow-3xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-72 h-72 bg-liquid-gold/5 blur-[110px] -mr-36 -mt-36"></div>
                
                <div className="flex items-center gap-8 mb-16 border-b border-white/5 pb-12 relative z-10">
                    <div className="bg-liquid-gold/10 p-5 rounded-2xl border border-liquid-gold/20 shadow-gold-glow-soft text-liquid-gold">
                        <RocketLaunchIcon className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="font-bold text-white text-4xl tracking-tighter italic uppercase">Flujo <span className="text-liquid-gold">Digital</span></h2>
                        <p className="text-[11px] text-liquid-gold/40 font-black uppercase tracking-[0.5em]">Rendimiento On-Demand</p>
                    </div>
                </div>

                <div className="space-y-16 relative z-10">
                    <div className="space-y-6">
                        <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] ml-2 italic">Magnitud del Formato</label>
                        <div className="flex gap-4 p-2.5 bg-black/60 rounded-[2.8rem] border-2 border-white/5 shadow-inner">
                            {['A4', 'A3', 'SRA3'].map((f) => (
                                <button key={f} onClick={() => setFormat(f as any)} className={`flex-1 py-5 rounded-[2.2rem] text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-700 italic ${format === f ? 'bg-white text-black shadow-luxury scale-105' : 'text-slate-600 hover:text-white'}`}>{f}</button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] ml-2 italic">Tipo de Sustrato</label>
                            <select value={paperType} onChange={e => setPaperType(e.target.value)} className="w-full p-6 bg-black/60 border-2 border-white/5 rounded-3xl text-[12px] font-black text-white outline-none focus:border-liquid-gold/50 appearance-none cursor-pointer tracking-widest uppercase italic shadow-inner">
                                <option value="BOND" className="bg-slate-950">Bond 75g Estandar</option>
                                <option value="COUCHE_115" className="bg-slate-950">Couché 115g Pro</option>
                                <option value="COUCHE_300" className="bg-slate-950">Couché 300g Heavy</option>
                                <option value="ADHESIVO" className="bg-slate-950">Adhesivo Glossy</option>
                            </select>
                        </div>
                        <div className="space-y-6">
                            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] ml-2 italic">Iteración de Tiraje</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-6 bg-black/60 border-2 border-white/5 rounded-3xl text-3xl font-black text-liquid-gold outline-none text-center focus:border-liquid-gold/40 transition-all placeholder:text-slate-900 shadow-inner" />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] ml-2 italic">Modalidad Electrostática</label>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex bg-black/60 rounded-[2.2rem] p-2.5 border-2 border-white/5 shadow-inner">
                                <button onClick={() => setColorMode('COLOR')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all italic ${colorMode === 'COLOR' ? 'bg-white text-black' : 'text-slate-600 hover:text-white'}`}>Chroma Full</button>
                                <button onClick={() => setColorMode('BW')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all italic ${colorMode === 'BW' ? 'bg-white text-black' : 'text-slate-600 hover:text-white'}`}>Monocromo</button>
                            </div>
                            <div className="flex bg-black/60 rounded-[2.2rem] p-2.5 border-2 border-white/5 shadow-inner">
                                <button onClick={() => setSides(1)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all italic ${sides === 1 ? 'bg-white text-black' : 'text-slate-600 hover:text-white'}`}>Simplex</button>
                                <button onClick={() => setSides(2)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all italic ${sides === 2 ? 'bg-white text-black' : 'text-slate-600 hover:text-white'}`}>Duplex Pro</button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Resultados */}
            <motion.div 
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative rounded-[4rem] overflow-hidden bg-slate-950/50 border border-white/10 shadow-gold-glow p-16 flex flex-col justify-between group"
            >
                <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-liquid-gold/5 blur-[130px] -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-[4s]" />
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-24">
                        <div className="space-y-4">
                            <h3 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">Declaración <br/> <span className="text-gold-gradient text-6xl">Consolidada</span></h3>
                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] italic mt-8">Protocolo de Calibración Láser v4.1</p>
                        </div>
                        <CpuIcon className="w-14 h-14 text-liquid-gold/10 animate-pulse" />
                    </div>
                    
                    <div className="space-y-8 mb-24">
                        <div className="flex justify-between items-center bg-white/[0.01] p-10 rounded-[3rem] border border-white/5 shadow-inner group/val hover:border-white/10 transition-all">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none">Valuación Unitaria</span>
                            <span className="text-4xl font-black text-white italic group-hover:text-liquid-gold transition-colors">{formatCurrency(calculation.unitPvp)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/[0.01] p-10 rounded-[3rem] border border-white/5 shadow-inner group/val hover:border-white/10 transition-all">
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none">Iteración de Tiraje</span>
                            <span className="text-4xl font-black text-white italic">{quantity} <span className="text-xl text-slate-800 tracking-tighter ml-4 font-black opacity-40">UNIDADES</span></span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 pt-16 border-t border-white/5">
                    <p className="text-[12px] font-black text-liquid-gold/30 uppercase tracking-[0.8em] mb-8 italic ml-auto max-w-fit">Subtotal Industrial Neto</p>
                    <div className="flex items-baseline gap-8 justify-end">
                        <motion.span 
                            key={calculation.totalPvp}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-9xl font-black text-white tracking-tighter italic drop-shadow-[0_0_40px_rgba(255,255,255,0.08)]"
                        >
                            {formatCurrency(calculation.totalPvp)}
                        </motion.span>
                        <span className="text-4xl text-slate-800 font-black tracking-widest uppercase opacity-40 italic">+ TAX</span>
                    </div>
                    <div className="mt-20 flex items-center justify-between">
                         <div className="flex items-center gap-5 text-emerald-500/50 font-black text-[11px] uppercase tracking-[0.6em] italic">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow"></div>
                            Flujo de Prioridad Establecido
                         </div>
                         <button className="flex items-center gap-5 text-liquid-gold font-black text-[13px] uppercase tracking-[0.5em] hover:translate-x-6 transition-all duration-700 group/link">
                            Ejecutar Despacho <ArrowRightIcon className="w-6 h-6 group-hover:animate-bounce-x" />
                         </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const MasterTableModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[200] flex justify-center items-center p-8">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 bg-black/98 backdrop-blur-3xl" 
                onClick={onClose} 
            />
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-slate-950 border border-white/10 rounded-[4.5rem] shadow-gold-glow-strong w-full max-w-5xl max-h-[90vh] flex flex-col relative z-20 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-16 border-b border-white/5 relative overflow-hidden bg-white/[0.01]">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent"></div>
                    <div className="relative z-10">
                        <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">Catálogo de <span className="text-liquid-gold">Sustratos</span></h2>
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] mt-5 italic">Especificación de Matriz Técnica • Atelier Core</p>
                    </div>
                    <button onClick={onClose} className="w-16 h-16 flex items-center justify-center rounded-[2rem] bg-white/5 text-slate-600 hover:text-white hover:bg-white/10 transition-all group border border-white/5 relative z-10">
                        <CloseIcon className="w-6 h-6 transition-transform group-hover:rotate-90" />
                    </button>
                </div>
                
                <div className="p-16 overflow-y-auto custom-scrollbar flex-grow bg-noise/5">
                    <div className="grid gap-8">
                        {SOURCE_PAPERS.map((paper, i) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={paper.id} 
                                className="group bg-white/[0.01] border border-white/5 hover:border-liquid-gold/30 p-10 rounded-[2.5rem] flex items-center justify-between transition-all duration-700 hover:bg-black shadow-inner"
                            >
                                <div className="flex items-center gap-12">
                                    <div className="w-24 h-24 rounded-3xl bg-black flex flex-col items-center justify-center border-2 border-white/5 text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] group-hover:border-liquid-gold/20 transition-colors">
                                        <DocumentIcon className="w-8 h-8 mb-2 opacity-10" />
                                        {paper.id.split('_')[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black text-2xl tracking-tighter uppercase italic group-hover:text-liquid-gold transition-colors">{paper.nombre}</h4>
                                        <p className="text-[10px] text-slate-700 mt-4 uppercase tracking-[0.4em] italic font-black leading-none">
                                            {paper.ancho} x {paper.alto} cm • Sustrato Industrial Calibrado
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-16">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-2 italic">Procesamiento</p>
                                        <span className="text-[11px] font-black text-white tracking-[0.5em] uppercase italic group-hover:text-white transition-colors">{paper.tipo}</span>
                                    </div>
                                    <div className="w-[1px] h-12 bg-white/5"></div>
                                    <span className="bg-liquid-gold/5 text-liquid-gold px-7 py-2.5 rounded-full text-[9px] font-black tracking-[0.6em] uppercase border border-liquid-gold/10 shadow-gold-glow-sm">SGN-ACTIVO</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
                
                <div className="p-16 border-t border-white/5 flex justify-end bg-white/[0.01]">
                    <button onClick={onClose} className="px-16 py-8 bg-white text-black rounded-[2.8rem] font-black text-[12px] uppercase tracking-[0.6em] hover:bg-liquid-gold transition-all shadow-luxury active:scale-95">Desactivar Catálogo</button>
                </div>
            </motion.div>
        </div>
    );
};

// --- MAIN PAGE ---
const CalculadoraPreciosPage: React.FC = () => {
    const context = useOutletContext<{ currentUser: any }>();
    const currentUser = context?.currentUser;
    
    const [mode, setMode] = useState<Mode>('OFFSET');
    const [costs, setCosts] = useState<CostConfig>(DEFAULT_COSTS);
    const [showMasterTable, setShowMasterTable] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('app_config')
                    .select('data')
                    .eq('id', 1)
                    .single();
                
                if (data && data.data) {
                    const dbCosts = data.data;
                    const mergedCosts = { ...DEFAULT_COSTS };
                    
                    Object.keys(DEFAULT_COSTS).forEach(key => {
                        if (dbCosts[key] !== undefined) {
                            (mergedCosts as any)[key] = dbCosts[key];
                        }
                    });
                    
                    setCosts(mergedCosts);
                }
            } catch (err) {
                console.warn('[Calculadora] No se pudo cargar config de Supabase, usando defaults:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const handleSaveConfig = async (newCosts: CostConfig) => {
        setLoading(true);
        try {
            const { data: currentConfig } = await supabase
                .from('app_config')
                .select('data')
                .eq('id', 1)
                .single();

            const updatedData = {
                ...(currentConfig?.data || {}),
                ...newCosts
            };

            const { error } = await supabase
                .from('app_config')
                .update({ data: updatedData, updated_at: new Date().toISOString() })
                .eq('id', 1);

            if (error) throw error;

            setCosts(newCosts);
            await logActivity(
                currentUser?.nombre || 'Admin',
                currentUser?.rol || 'Administrador',
                'CAMBIO_CONFIG',
                'Actualización de parámetros de costos industriales',
                'Producción'
            );
            setMode('OFFSET');
        } catch (err) {
            console.error('[Calculadora] Error al guardar config:', err);
            alert('Error al guardar la configuración en la nube');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 sm:p-14 relative overflow-hidden flex flex-col bg-[#050505]">
            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none"></div>
            
            {/* Fondo Cinematográfico */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-liquid-gold/[0.03] blur-[160px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-white/[0.01] blur-[150px]"></div>
            </div>

            <div className="max-w-[1600px] mx-auto w-full flex-grow flex flex-col pt-10">
                {/* Cabecera */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-20 relative z-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-[2px] bg-liquid-gold/40"></div>
                            <span className="text-[12px] font-black text-liquid-gold uppercase tracking-[0.8em]">Precision Print Engine v4.1</span>
                        </div>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-7xl lg:text-9xl font-black text-white tracking-tighter uppercase italic leading-none"
                        >
                            Ingeniería de <span className="text-gold-gradient">Costos</span>
                        </motion.h1>
                    </div>
                    
                    <div className="flex gap-8">
                        <button onClick={() => setShowMasterTable(true)} className="group flex items-center gap-5 px-12 py-7 bg-white/[0.02] border-2 border-white/5 text-white font-black text-[11px] uppercase tracking-[0.5em] rounded-[2rem] hover:bg-white/[0.05] hover:border-liquid-gold/20 transition-all shadow-luxury">
                            <TableIcon className="w-5 h-5 text-liquid-gold/30 group-hover:text-liquid-gold transition-colors"/> Catálogo de Matriz
                        </button>
                        <button 
                            onClick={() => setMode(mode === 'CONFIG' ? 'OFFSET' : 'CONFIG')} 
                            className={`group flex items-center gap-5 px-12 py-7 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.5em] transition-all border-2 shadow-luxury ${mode === 'CONFIG' ? 'bg-white text-black border-white scale-105' : 'bg-white/[0.02] text-white border-white/5 hover:border-white/10'}`}
                        >
                            <Cog8ToothIcon className={`w-5 h-5 ${mode === 'CONFIG' ? 'animate-spin-slow' : 'text-slate-700'}`}/> Calibración
                        </button>
                    </div>
                </div>

                {/* Selector de Modo (Tabs) */}
                {mode !== 'CONFIG' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex p-2.5 bg-black/60 border-2 border-white/5 rounded-[3rem] mb-20 max-w-md shadow-3xl relative z-10"
                    >
                        <button onClick={() => setMode('OFFSET')} className={`flex-1 py-5 px-12 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-5 italic ${mode === 'OFFSET' ? 'bg-white text-black shadow-luxury scale-105' : 'text-slate-700 hover:text-white'}`}>
                            <PrinterIcon className="w-5 h-5"/> Offset
                        </button>
                        <button onClick={() => setMode('DIGITAL')} className={`flex-1 py-5 px-12 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.5em] transition-all flex items-center justify-center gap-5 italic ${mode === 'DIGITAL' ? 'bg-white text-black shadow-luxury scale-105' : 'text-slate-700 hover:text-white'}`}>
                            <RocketLaunchIcon className="w-5 h-5"/> Digital
                        </button>
                    </motion.div>
                )}

                {/* Área de Contenido */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6 }}
                        className="relative z-10 pb-32"
                    >
                        {mode === 'OFFSET' && <OffsetCalculator costs={costs} />}
                        {mode === 'DIGITAL' && <DigitalCalculator costs={costs} />}
                        {mode === 'CONFIG' && (
                            <motion.div 
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-card-luxury p-16 rounded-[4rem] border border-white/10 shadow-3xl"
                            >
                                <div className="flex justify-between items-center mb-16 pb-12 border-b border-white/5">
                                    <div className="space-y-2">
                                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Calibración de <span className="text-liquid-gold">Costos Bases</span></h2>
                                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-[0.6em] italic">Protocolo de Ajuste Financiero Maestro</p>
                                    </div>
                                    <div className="flex gap-6">
                                        <button onClick={() => setMode('OFFSET')} className="px-10 py-5 text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
                                        <button onClick={() => handleSaveConfig(costs)} className="px-12 py-5 bg-liquid-gold text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-gold-glow">Guardar Matriz</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {Object.entries(costs).map(([key, val]) => (
                                        <div key={key} className="space-y-4">
                                            <label className="block text-[9px] font-black text-slate-700 uppercase tracking-widest ml-1">{key.replace(/_/g, ' ')}</label>
                                            <input 
                                                type="number" step="0.0001" 
                                                value={val} 
                                                onChange={e => setCosts({...costs, [key]: parseFloat(e.target.value)})}
                                                className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-black text-lg outline-none focus:border-liquid-gold/30 transition-all shadow-inner"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {showMasterTable && <MasterTableModal onClose={() => setShowMasterTable(false)} />}
        </div>
    );
};

export default CalculadoraPreciosPage;
