import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';
import { 
    WrenchScrewdriverIcon, PrinterIcon, SparklesIcon, 
    TableIcon, SettingsIcon, 
    ChevronRightIcon, ExclamationTriangleIcon,
    DollarIcon, ArrowRightIcon,
    ClockIcon, ShieldCheckIcon, CpuIcon, RocketLaunchIcon,
    BeakerIcon, DocumentIcon,
    CircleStackIcon,
    LayoutDashboardIcon,
    ScanIcon,
    ZapIcon,
    BoxIcon,
    LayersIcon,
    CloseIcon
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { logActivity } from '../services/activityLogService';
import { SOURCE_PAPERS, DEFAULT_COSTS } from '../constants';
import { CostConfig, Proveedor, InventoryItem, Producto } from '../types';
import { useData } from '../contexts/DataContext';

// --- ANIMATION VARIANTS (Elite Optimized) ---
const fadeInUp = {
    initial: { opacity: 0, y: 40, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.12
        }
    }
};

// --- TYPES ---
type Mode = 'OFFSET' | 'DIGITAL' | 'CONFIG' | 'HUB';

// --- ATMOSPHERIC EFFECTS ---
const Scanline = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <div className="w-full h-[1px] bg-liquid-gold/20 animate-scan shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
    </div>
);

// --- COMPONENTE VISUAL STEP ---
const VisualStep: React.FC<{
    title: string;
    image: string;
    subtitle: string;
    detail: string;
    cost?: number;
    isLast?: boolean;
    icon?: React.ReactNode;
}> = ({ title, image, subtitle, detail, cost, isLast, icon }) => (
    <motion.div 
        variants={fadeInUp}
        className="flex-1 relative group w-full lg:w-auto perspective-luxury"
    >
        {!isLast && (
            <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-[2px] bg-gradient-to-r from-white/10 to-transparent z-0"></div>
        )}
        
        <div className="glass-card-luxury group/step h-full flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
            <Scanline />
            
            {/* Image Area */}
            <div className="h-44 w-full relative overflow-hidden bg-black/60">
                <img 
                    src={image} 
                    alt={title} 
                    className="w-full h-full object-cover opacity-20 grayscale group-hover/step:grayscale-0 group-hover/step:opacity-60 transition-all duration-1000 scale-125 group-hover/step:scale-100" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-transparent flex items-end p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-liquid-gold flex items-center justify-center text-brand-dark shadow-gold-glow font-black text-sm">
                            {title.split('.')[0]}
                        </div>
                        <span className="text-white font-black text-[10px] uppercase tracking-[0.3em] italic">
                            {title.split('. ')[1]}
                        </span>
                    </div>
                </div>
                
                {/* Holographic Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-liquid-gold animate-pulse" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">LIVE_TELEMETRY</span>
                    </div>
                </div>
            </div>
            
            {/* Content Area */}
            <div className="p-8 flex flex-col flex-grow bg-white/[0.01] relative">
                <div className="flex items-center gap-3 mb-4">
                    {icon && <div className="text-liquid-gold opacity-40 group-hover/step:opacity-100 transition-opacity">{icon}</div>}
                    <h4 className="font-bold text-white text-lg leading-none italic group-hover/step:text-liquid-gold transition-colors tracking-tighter uppercase">{subtitle}</h4>
                </div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-8 flex-grow leading-relaxed italic">{detail}</p>
                
                {cost !== undefined && (
                    <div className="flex justify-between items-center border-t border-white/5 pt-6 mt-auto">
                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest italic">Valorización Neta</span>
                        <span className="font-black text-xl text-white tracking-tighter group-hover/step:text-liquid-gold transition-colors italic glow-text-sm">{formatCurrency(cost)}</span>
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
    materialProvider?: string;
    prepressProvider?: string;
    printProvider?: string;
    materialLowStock?: boolean;
    prepressLowStock?: boolean;
    printLowStock?: boolean;
    prepressTitle?: string;
    printTitle?: string;
    prepressDetail?: string;
    printDetail?: string;
}> = ({ 
    sourceName, sourceType, sourceSize, cutSize, cutsPerUnit, 
    prePressCost, materialCost, printCost, 
    materialProvider, prepressProvider, printProvider, 
    materialLowStock, prepressLowStock, printLowStock,
    prepressTitle = "Profiling Offset",
    printTitle = "Chasis Mecánico",
    prepressDetail,
    printDetail
}) => {
    
    const images = {
        input: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=600",
        prepress: "https://images.unsplash.com/photo-1626785774573-4b7993143a2d?auto=format&fit=crop&q=80&w=600",
        print: "https://images.unsplash.com/photo-1619551734325-81372338c237?auto=format&fit=crop&q=80&w=600",
        finish: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=600"
    };

    const defaultPrepressDetail = `INSUMO TÉCNICO • CTP / POLIÉSTER${prepressProvider ? ` • 👑 ${prepressProvider}` : ''}${prepressLowStock ? ' ⚠️ STOCK CRÍTICO' : ''}`;
    const defaultPrintDetail = `TIRAJE INDUSTRIAL • CALIBRACIÓN${printProvider ? ` • 👑 ${printProvider}` : ''}${printLowStock ? ' ⚠️ STOCK CRÍTICO' : ''}`;

    return (
        <motion.div 
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="w-full"
        >
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch">
                <VisualStep 
                    title="1. Sustrato" 
                    image={images.input} 
                    subtitle={sourceName} 
                    detail={`${sourceType} • MATRIZ FÍSICA • ${sourceSize}${materialProvider ? ` • 👑 ${materialProvider}` : ''}${materialLowStock ? ' ⚠️ STOCK CRÍTICO' : ''}`}
                    cost={materialCost}
                    icon={<BoxIcon className="w-4 h-4" />}
                />
                <VisualStep 
                    title="2. Pre-Impresión" 
                    image={images.prepress} 
                    subtitle={prepressTitle} 
                    detail={prepressDetail || defaultPrepressDetail}
                    cost={prePressCost}
                    icon={<LayersIcon className="w-4 h-4" />}
                />
                <VisualStep 
                    title="3. Ejecución" 
                    image={images.print} 
                    subtitle={printTitle} 
                    detail={printDetail || defaultPrintDetail}
                    cost={printCost}
                    icon={<ZapIcon className="w-4 h-4" />}
                />
                <VisualStep 
                    title="4. Arquitectura" 
                    image={images.finish} 
                    subtitle="Acabado Final" 
                    detail={`${cutSize} (${cutsPerUnit} IMPS/HOJA)`}
                    isLast
                    icon={<WrenchScrewdriverIcon className="w-4 h-4" />}
                />
            </div>
        </motion.div>
    );
};

// --- CALCULADORA OFFSET ---
const OffsetCalculator: React.FC<{ 
    costs: CostConfig; 
    proveedores: Proveedor[]; 
    inventario: InventoryItem[]; 
    onSave: (p: any) => void;
    onOrder: (p: any) => void;
}> = ({ costs, proveedores, inventario, onSave, onOrder }) => {
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

    const getProviderName = (key: string) => {
        const id = costs.proveedoresPredeterminados?.[key];
        return proveedores.find(p => p.id === id)?.nombre;
    };

    const isProviderLowStock = (key: string) => {
        const id = costs.proveedoresPredeterminados?.[key];
        if (!id) return false;
        return inventario.some(i => i.proveedorId === id && i.cantidad <= i.minimo);
    };

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
            costPapelTotal = totalHojas * ((costs[paper.costoBaseKey as keyof CostConfig] as number) / 500);
            totalSheetsNeeded = totalHojas;
        } else {
            const bajadas = Math.ceil(quantity / cutsPerUnit);
            const merma = Math.ceil(bajadas * 0.10) + 5;
            const totalPliegos = bajadas + merma;
            costPapelTotal = totalPliegos * (costs[paper.costoBaseKey as keyof CostConfig] as number);
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

        const materialKey = paper.id === 'QUIMICO' ? 'COSTO_RESMA_QUIMICO_ORIG' : paper.costoBaseKey;
        const placaKey = (quantity > 2000 || paper.id === 'COUCHE_300') ? 'COSTO_PLACA_CTP' : 'COSTO_PLACA_POLIESTER';

        return { paper, cutsPerUnit, costPapelTotal, costPrePrensa, costImpresion, costAcabados, costoTotalProduccion, pvp, unitario: pvp / quantity, materialKey, placaKey };
    }, [paperId, finalW, finalH, quantity, colorsFront, colorsBack, parts, costs, hasDesign, requiresSRI, cantidadHojasBlock]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-4 space-y-8"
            >
                <div className="glass-card-luxury p-10 relative overflow-hidden group shadow-3xl">
                    <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
                    <div className="flex items-center gap-6 mb-12 pb-10 border-b border-white/5">
                        <div className="bg-liquid-gold/10 p-4 rounded-2xl border border-liquid-gold/20 shadow-gold-glow-soft text-liquid-gold">
                            <CpuIcon className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="font-bold text-white text-2xl tracking-tight italic uppercase leading-none">Matriz <span className="text-liquid-gold">Offset</span></h2>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em]">Configuración de Manufactura</p>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                                <BoxIcon className="w-3 h-3 text-liquid-gold" /> Sustrato Base
                            </label>
                            <select 
                                value={paperId} 
                                onChange={e => {setPaperId(e.target.value); handlePresetChange('1/4_OFICIO')}} 
                                className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-sm font-black text-white outline-none focus:border-liquid-gold/50 transition-all cursor-pointer uppercase italic"
                            >
                                {SOURCE_PAPERS.map(p => <option key={p.id} value={p.id} className="bg-slate-950">{p.nombre.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Dimensiones Finales (mm)</label>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" value={finalW} onChange={e => setFinalW(parseFloat(e.target.value))} className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-black text-center text-xl outline-none" />
                                <input type="number" value={finalH} onChange={e => setFinalH(parseFloat(e.target.value))} className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-black text-center text-xl outline-none" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Volumen Solicitado</label>
                            <div className="flex gap-4">
                                <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="flex-1 p-6 bg-black/60 border border-white/10 rounded-2xl text-3xl font-black text-liquid-gold outline-none text-center shadow-inner" />
                                {paperId === 'QUIMICO' && (
                                    <select value={cantidadHojasBlock} onChange={e => setCantidadHojasBlock(parseInt(e.target.value))} className="w-1/3 bg-black/60 border border-white/10 rounded-2xl text-[10px] font-black text-white p-2 outline-none text-center cursor-pointer uppercase italic">
                                        <option value={100}>100 HJS</option>
                                        <option value={50}>50 HJS</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center block">Partes</label>
                                <input type="number" value={parts} onChange={e => setParts(Math.max(1, parseInt(e.target.value)))} className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-black text-center text-xl outline-none" />
                            </div>
                            <div className="pt-8">
                                <button onClick={() => setHasDesign(!hasDesign)} className={`w-full py-4 border rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${hasDesign ? 'bg-white text-black border-white' : 'bg-transparent border-white/5 text-slate-600'}`}>
                                    {hasDesign ? 'CON ARTE' : 'SIN ARTE'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

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
                            materialProvider={getProviderName(result.materialKey)}
                            prepressProvider={getProviderName(result.placaKey)}
                            printProvider={getProviderName('COSTO_MILLAR_IMPRESION')}
                            materialLowStock={isProviderLowStock(result.materialKey)}
                            prepressLowStock={isProviderLowStock(result.placaKey)}
                            printLowStock={isProviderLowStock('COSTO_MILLAR_IMPRESION')}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="glass-card-luxury p-10 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4 italic">Costo Operativo</span>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-black text-white italic tracking-tighter glow-text-sm">{formatCurrency(result.costoTotalProduccion)}</span>
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">NET_VAL</span>
                                </div>
                            </div>

                            <div className="glass-card-luxury p-10 relative overflow-hidden group border-liquid-gold/20">
                                <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
                                <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/5 blur-3xl -mr-16 -mt-16" />
                                <span className="text-[9px] font-black text-liquid-gold uppercase tracking-widest block mb-4 italic">PVP Sugerido Elite</span>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-4xl font-black text-liquid-gold italic tracking-tighter glow-text-sm">{formatCurrency(result.pvp)}</span>
                                    <span className="text-[10px] font-black text-liquid-gold/40 uppercase tracking-widest">USD</span>
                                </div>
                            </div>

                            <div className="glass-card-luxury p-10 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4 italic">Valor por Unidad</span>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-black text-white italic tracking-tighter glow-text-sm">{formatCurrency(result.unitario)}</span>
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">UNIT_VAL</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 mt-12">
                            <button 
                                onClick={() => onSave({
                                    nombre: `${result.paper.nombre} - ${finalW}x${finalH}mm`,
                                    precio: result.pvp,
                                    specs: [
                                        `${finalW}x${finalH} mm`,
                                        `${quantity} unidades`,
                                        `${parts} partes`,
                                        result.paper.nombre,
                                        `Offset Industrial`
                                    ],
                                    categoria: requiresSRI ? 'SRI' : 'General',
                                    esSRI: requiresSRI,
                                    visiblePublico: true,
                                    requiereDiseno: !hasDesign,
                                    manejaInventario: false,
                                    esActivo: true,
                                    configuracionHabilitada: { dimensiones: true, volumen: true, materiales: true, acabados: true, cromatismo: true, procesosMecanicos: true }
                                })}
                                className="flex-1 py-6 bg-liquid-gold text-brand-dark font-black text-[11px] uppercase tracking-[0.4em] italic rounded-2xl shadow-gold-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group/btn"
                            >
                                <CircleStackIcon className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                                Sincronizar Catálogo
                            </button>
                            <button 
                                onClick={() => onOrder({
                                    nombre: `${result.paper.nombre} - ${finalW}x${finalH}mm`,
                                    precio: result.pvp,
                                    specs: [`${finalW}x${finalH} mm`, `${quantity} un.`, `${parts} pts`]
                                })}
                                className="flex-1 py-6 bg-white/5 border border-white/10 text-white font-black text-[11px] uppercase tracking-[0.4em] italic rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 group/btn"
                            >
                                <RocketLaunchIcon className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                Vincular Pedido
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-white/[0.01] rounded-[3rem] border-2 border-dashed border-white/5 p-20 text-center">
                        <ExclamationTriangleIcon className="w-16 h-16 text-rose-500/20 mb-8" />
                        <h4 className="text-2xl font-bold text-white mb-4 italic tracking-tighter uppercase">Fallo Geométrico</h4>
                        <p className="text-slate-600 font-black max-w-sm uppercase text-[10px] tracking-widest leading-loose italic">Las dimensiones declaradas superan los límites físicos de la matriz seleccionada.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- CALCULADORA DIGITAL ---
const DigitalCalculator: React.FC<{ 
    costs: CostConfig; 
    proveedores: Proveedor[]; 
    inventario: InventoryItem[]; 
    onSave: (p: any) => void;
    onOrder: (p: any) => void;
}> = ({ costs, proveedores, inventario, onSave, onOrder }) => {
    const [format, setFormat] = useState<'A4' | 'A3' | 'SRA3'>('A3');
    const [paperType, setPaperType] = useState('COUCHE_150');
    const [colorMode, setColorMode] = useState<'COLOR' | 'BW'>('COLOR');
    const [sides, setSides] = useState<1 | 2>(1);
    const [quantity, setQuantity] = useState(10);

    const getProviderName = (key: string) => {
        const id = costs.proveedoresPredeterminados?.[key];
        return proveedores.find(p => p.id === id)?.nombre;
    };

    const isProviderLowStock = (key: string) => {
        const id = costs.proveedoresPredeterminados?.[key];
        if (!id) return false;
        return inventario.some(i => i.proveedorId === id && i.cantidad <= i.minimo);
    };

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
        
        let sheetKey = '';
        switch (paperType) {
            case 'BOND': sheetKey = 'COSTO_RESMA_BOND'; break; 
            case 'COUCHE_115': sheetKey = 'COSTO_PLIEGO_COUCHE_300'; break;
            case 'COUCHE_300': sheetKey = 'COSTO_PLIEGO_COUCHE_300'; break;
            case 'ADHESIVO': sheetKey = 'COSTO_PLIEGO_ADHESIVO'; break;
        }
        const clickKey = colorMode === 'COLOR' ? 'CLICK_DIGITAL_A3' : 'CLICK_DIGITAL_BN';

        return { 
            unitCost: productionCost / quantity, 
            totalCost: productionCost, 
            unitPvp: pvp / quantity, 
            totalPvp: pvp, 
            sheetKey, 
            clickKey,
            clickCost: (quantity * sides) * clickCost,
            materialCost: quantity * sheetCost
        };
    }, [format, paperType, colorMode, sides, quantity, costs]);

    const paperProvider = getProviderName(calculation.sheetKey);
    const clickProvider = getProviderName(calculation.clickKey);
    const paperLowStock = isProviderLowStock(calculation.sheetKey);
    const clickLowStock = isProviderLowStock(calculation.clickKey);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Controles */}
            <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-4 space-y-8"
            >
                <div className="glass-card-luxury p-10 relative overflow-hidden group shadow-3xl">
                    <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
                    <div className="flex items-center gap-6 mb-12 pb-10 border-b border-white/5">
                        <div className="bg-liquid-gold/10 p-4 rounded-2xl border border-liquid-gold/20 shadow-gold-glow-soft text-liquid-gold">
                            <RocketLaunchIcon className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="font-bold text-white text-2xl tracking-tight italic uppercase leading-none">Matriz <span className="text-liquid-gold">Digital</span></h2>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em]">Configuración On-Demand</p>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                                <LayersIcon className="w-3 h-3 text-liquid-gold" /> Formato de Salida
                            </label>
                            <div className="flex gap-3 p-2 bg-black/40 rounded-2xl border border-white/5">
                                {['A4', 'A3', 'SRA3'].map((f) => (
                                    <button 
                                        key={f} 
                                        onClick={() => setFormat(f as any)} 
                                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic ${format === f ? 'bg-white text-black shadow-luxury' : 'text-slate-600 hover:text-white'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Sustrato de Impresión</label>
                            <select 
                                value={paperType} 
                                onChange={e => setPaperType(e.target.value)} 
                                className="w-full p-5 bg-black/40 border border-white/10 rounded-2xl text-sm font-black text-white outline-none focus:border-liquid-gold/50 transition-all cursor-pointer uppercase italic shadow-inner"
                            >
                                <option value="BOND" className="bg-slate-950">Bond 75g Estandar</option>
                                <option value="COUCHE_115" className="bg-slate-950">Couché 115g Pro</option>
                                <option value="COUCHE_300" className="bg-slate-950">Couché 300g Heavy</option>
                                <option value="ADHESIVO" className="bg-slate-950">Adhesivo Glossy</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Volumen de Producción</label>
                            <input 
                                type="number" 
                                value={quantity} 
                                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))} 
                                className="w-full p-6 bg-black/60 border border-white/10 rounded-2xl text-3xl font-black text-liquid-gold outline-none text-center shadow-inner" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center block">Cromatismo</label>
                                <div className="flex bg-black/40 rounded-xl p-1.5 border border-white/5">
                                    <button onClick={() => setColorMode('COLOR')} className={`flex-1 py-3 text-[8px] font-black uppercase rounded-lg transition-all italic ${colorMode === 'COLOR' ? 'bg-white text-black' : 'text-slate-600 hover:text-white'}`}>CMYK</button>
                                    <button onClick={() => setColorMode('BW')} className={`flex-1 py-3 text-[8px] font-black uppercase rounded-lg transition-all italic ${colorMode === 'BW' ? 'bg-white text-black' : 'text-slate-600 hover:text-white'}`}>B/N</button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center block">Faces</label>
                                <div className="flex bg-black/40 rounded-xl p-1.5 border border-white/5">
                                    <button onClick={() => setSides(1)} className={`flex-1 py-3 text-[8px] font-black uppercase rounded-lg transition-all italic ${sides === 1 ? 'bg-white text-black' : 'text-slate-600 hover:text-white'}`}>1 Lado</button>
                                    <button onClick={() => setSides(2)} className={`flex-1 py-3 text-[8px] font-black uppercase rounded-lg transition-all italic ${sides === 2 ? 'bg-white text-black' : 'text-slate-600 hover:text-white'}`}>2 Lados</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Resultados */}
            <div className="lg:col-span-8 space-y-12">
                <ProductionPipeline 
                    sourceName={paperType.replace('_', ' ')}
                    sourceType="DIGITAL MEDIA"
                    sourceSize={format}
                    cutSize="Format Final"
                    cutsPerUnit={1}
                    prePressCost={0} // Digital often has no prepress cost per se in this model
                    materialCost={calculation.materialCost}
                    printCost={calculation.clickCost}
                    materialProvider={paperProvider}
                    prepressProvider="ALGORITMO_RIP"
                    printProvider={clickProvider}
                    materialLowStock={paperLowStock}
                    printLowStock={clickLowStock}
                    prepressTitle="Procesamiento RIP"
                    prepressDetail="RASTER IMAGE PROCESSOR • COLOR MANAGEMENT"
                    printTitle="Láser Electrostática"
                    printDetail="TRANSFERENCIA TÉRMICA • TONER HIGH YIELD"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-card-luxury p-10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4 italic">Costo Operativo</span>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-black text-white italic tracking-tighter glow-text-sm">{formatCurrency(calculation.totalCost)}</span>
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">NET_VAL</span>
                        </div>
                    </div>

                    <div className="glass-card-luxury p-10 relative overflow-hidden group border-liquid-gold/20">
                        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/5 blur-3xl -mr-16 -mt-16" />
                        <span className="text-[9px] font-black text-liquid-gold uppercase tracking-widest block mb-4 italic">PVP Sugerido Elite</span>
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-black text-liquid-gold italic tracking-tighter glow-text-sm">{formatCurrency(calculation.totalPvp)}</span>
                            <span className="text-[10px] font-black text-liquid-gold/40 uppercase tracking-widest">USD</span>
                        </div>
                    </div>

                    <div className="glass-card-luxury p-10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4 italic">Valor por Unidad</span>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-black text-white italic tracking-tighter glow-text-sm">{formatCurrency(calculation.unitPvp)}</span>
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">UNIT_VAL</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 mt-12">
                    <button 
                        onClick={() => onSave({
                            nombre: `Digital ${paperType} ${format}`, 
                            precio: calculation.totalPvp, 
                            specs: [
                                format,
                                paperType,
                                `${quantity} unidades`,
                                colorMode,
                                sides === 1 ? '1 cara' : '2 caras'
                            ],
                            categoria: 'Digital',
                            esSRI: false,
                            visiblePublico: true,
                            requiereDiseno: true,
                            manejaInventario: false,
                            esActivo: true,
                            configuracionHabilitada: { dimensiones: true, volumen: false, materiales: true, acabados: true, cromatismo: true, procesosMecanicos: false }
                        })}
                        className="flex-1 py-6 bg-liquid-gold text-brand-dark font-black text-[11px] uppercase tracking-[0.4em] italic rounded-2xl shadow-gold-glow hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group/btn"
                    >
                        <CircleStackIcon className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                        Sincronizar Catálogo
                    </button>
                    <button 
                        onClick={() => onOrder({
                            nombre: `Digital ${paperType} ${format}`, 
                            precio: calculation.totalPvp, 
                            specs: [format, `${quantity} un.`, colorMode]
                        })}
                        className="flex-1 py-6 bg-white/5 border border-white/10 text-white font-black text-[11px] uppercase tracking-[0.4em] italic rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 group/btn"
                    >
                        <RocketLaunchIcon className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        Vincular Pedido
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE TABLA MAESTRA ---
const MasterTableModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const matrices = [
        { name: 'Libretines Facturas', size: '1/4 Oficio', units: '100 hjs', parts: '2 part.', price: 15.50 },
        { name: 'Volantes Publicitarios', size: 'A5', units: '1000 un.', parts: 'Full Color', price: 45.00 },
        { name: 'Tarjetas de Presentación', size: '9x5cm', units: '1000 un.', parts: 'Couché 300g', price: 25.00 },
        { name: 'Afiches Eventos', size: 'A3', units: '100 un.', parts: 'Digital', price: 35.00 }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-black/90 backdrop-blur-xl">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl glass-card-luxury rounded-[4rem] border border-white/10 overflow-hidden shadow-gold-glow-strong"
            >
                <div className="p-12 border-b border-white/5 flex justify-between items-start bg-white/[0.02] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-liquid-gold/10 animate-scan pointer-events-none" />
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 bg-liquid-gold/10 rounded-[1.5rem] flex items-center justify-center text-liquid-gold shadow-inner border border-liquid-gold/20">
                            <CpuIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Matriz de <span className="text-liquid-gold">Referencia</span></h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] mt-2 italic">Valores de Mercado Pre-Calculados</p>
                        </div>
                    </div>
                    
                    <button onClick={onClose} className="p-5 bg-white/5 hover:bg-red-500/20 rounded-2xl text-slate-500 hover:text-red-500 transition-all border border-white/10 active:scale-95">
                        <CloseIcon />
                    </button>
                </div>
                
                <div className="p-12 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-[11px] font-black text-slate-700 uppercase tracking-widest">
                                <th className="pb-8 pl-4 italic">Artefacto</th>
                                <th className="pb-8 italic">Dimensión</th>
                                <th className="pb-8 italic">Escala</th>
                                <th className="pb-8 italic">Configuración</th>
                                <th className="pb-8 pr-4 text-right italic">Valor Base</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {matrices.map((m, i) => (
                                <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-10 pl-4 font-black text-white text-lg italic tracking-tight">{m.name}</td>
                                    <td className="py-10 text-[11px] font-black text-slate-500 uppercase tracking-widest">{m.size}</td>
                                    <td className="py-10 text-[11px] font-black text-slate-500 uppercase tracking-widest">{m.units}</td>
                                    <td className="py-10 text-[11px] font-black text-slate-500 uppercase tracking-widest italic">{m.parts}</td>
                                    <td className="py-10 pr-4 text-right font-black text-liquid-gold text-2xl italic tracking-tighter">{formatCurrency(m.price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-12 bg-white/[0.01] border-t border-white/5 text-center">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em] italic">Valores sujetos a fluctuación de insumos según mercado local</p>
                </div>
            </motion.div>
        </div>
    );
};

// --- MAIN PAGE ---
import { ProductManagementModal } from '../components/ProductManagementModal';

const CalculadoraPreciosPage: React.FC = () => {
    const context = useOutletContext<{ currentUser: any }>();
    const currentUser = context?.currentUser;
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryMode = searchParams.get('mode') as Mode;
    const [mode, setMode] = useState<Mode>(queryMode || 'HUB');

    useEffect(() => {
        if (queryMode && queryMode !== mode) {
            setMode(queryMode);
        }
    }, [queryMode]);

    const handleSetMode = (newMode: Mode) => {
        setMode(newMode);
        setSearchParams({ mode: newMode });
    };
    const [costs, setCosts] = useState<CostConfig>(DEFAULT_COSTS);
    const [showMasterTable, setShowMasterTable] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [productToSave, setProductToSave] = useState<Partial<Producto> | null>(null);
    const [loading, setLoading] = useState(true);
    const { proveedores, inventario, refreshData } = useData();

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

    const handleSaveToCatalog = (p: Partial<Producto>) => {
        setProductToSave(p);
        setShowSaveModal(true);
    };

    const handleAddToOrder = (p: any) => {
        try {
            // Transform calculator product to "item" format for NuevoPedido
            const newItem = {
                id: Math.random().toString(36).substr(2, 9),
                nombre: p.nombre,
                descripcion: p.specs.join(' | '),
                precioFinal: p.precio,
                especificaciones: {
                    ...p.configuracionHabilitada,
                    detalles_tecnicos: p.specs
                },
                product: p
            };

            const existingItems = JSON.parse(localStorage.getItem('pending_order_items') || '[]');
            localStorage.setItem('pending_order_items', JSON.stringify([...existingItems, newItem]));
            
            alert('Ítem agregado al manifiesto del pedido. Redirigiendo...');
            navigate('/pedidos/nuevo?action=resume');
        } catch (err) {
            console.error('Error adding to order:', err);
        }
    };

    const handleFinalSave = async (product: Producto | Producto[]) => {
        try {
            const products = Array.isArray(product) ? product : [product];
            const { error } = await supabase.from('productos').insert(
                products.map(p => ({
                    ...p,
                    id: undefined // Let DB generate ID
                }))
            );

            if (error) throw error;

            alert('Producto(s) guardado(s) exitosamente en el catálogo.');
            setShowSaveModal(false);
            refreshData();
            
            logActivity(
                currentUser?.nombre || 'Admin',
                currentUser?.rol || 'Administrador',
                'CREATE_PRODUCT',
                `Creado desde calculadora: ${Array.isArray(product) ? product.length + ' productos' : product.nombre}`,
                'Catálogo'
            );
        } catch (err) {
            console.error('Error saving to catalog:', err);
            alert('Error al guardar en el catálogo.');
        }
    };

    const SidebarItem = ({ id, label, icon: Icon, active }: { id: Mode | 'TABLE', label: string, icon: any, active: boolean }) => (
        <button
            onClick={() => {
                if (id === 'TABLE') setShowMasterTable(true);
                else handleSetMode(id);
            }}
            className={`w-full flex items-center gap-5 px-8 py-6 rounded-3xl transition-all duration-500 group relative ${
                active 
                ? 'bg-liquid-gold text-black shadow-gold-glow-sm' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
        >
            <Icon className={`w-5 h-5 ${active ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">{label}</span>
            {active && (
                <motion.div 
                    layoutId="sidebar-indicator"
                    className="absolute right-4 w-1.5 h-1.5 bg-black rounded-full"
                />
            )}
        </button>
    );

    return (
        <div className="min-h-screen relative overflow-hidden flex bg-[#050505]">
            <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none"></div>
            
            {/* Fondo Cinematográfico */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-liquid-gold/[0.03] blur-[160px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-white/[0.01] blur-[150px]"></div>
            </div>

            {/* Premium Sidebar Menu */}
            <aside className="w-80 border-r border-white/5 bg-black/40 backdrop-blur-3xl p-10 flex flex-col gap-12 sticky top-0 h-screen z-50">
                <div className="space-y-4">
                    <div className="flex items-center gap-4 px-4">
                        <div className="w-10 h-10 bg-liquid-gold rounded-xl flex items-center justify-center shadow-gold-glow">
                            <CpuIcon className="w-6 h-6 text-black" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-white font-black text-sm uppercase tracking-[-0.04em] italic leading-none text-nowrap">IMPRENTA CÓRDOVA</h3>
                            <div className="flex gap-1 items-center mt-1">
                                <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
                                <div className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                                <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                                <p className="text-liquid-gold/40 font-black text-[7px] uppercase tracking-widest italic ml-1">Core active</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />
                </div>

                <nav className="flex-grow space-y-4">
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-6 px-4">Protocolos</p>
                    <SidebarItem id="HUB" label="Dashboard" icon={LayoutDashboardIcon} active={mode === 'HUB'} />
                    <SidebarItem id="OFFSET" label="Industrial Offset" icon={PrinterIcon} active={mode === 'OFFSET'} />
                    <SidebarItem id="DIGITAL" label="Digital Boutique" icon={RocketLaunchIcon} active={mode === 'DIGITAL'} />
                    
                    <div className="pt-10">
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-6 px-4">Utilidades</p>
                        <SidebarItem id="TABLE" label="Matriz Maestra" icon={TableIcon} active={showMasterTable} />
                        <SidebarItem id="CONFIG" label="Calibración" icon={SettingsIcon} active={mode === 'CONFIG'} />
                    </div>
                </nav>

                <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                            <span className="text-[10px] font-black text-white italic">{currentUser?.nombre?.charAt(0) || 'A'}</span>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-white uppercase tracking-widest leading-none">{currentUser?.nombre || 'Operador'}</p>
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">{currentUser?.rol || 'Staff'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="flex-grow max-w-[1600px] mx-auto w-full p-8 sm:p-14 overflow-y-auto custom-scrollbar">
                {/* Cabecera Dinámica */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 mb-20 relative z-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-[2px] bg-liquid-gold/40"></div>
                            <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.8em] italic">
                                {mode === 'HUB' ? 'Ecosistema de Gestión' : 
                                 mode === 'OFFSET' ? 'Protocolo de Alto Volumen' : 
                                 mode === 'DIGITAL' ? 'Producción On-Demand' : 'Configuración de Núcleo'}
                            </span>
                        </div>
                        <motion.h1 
                            key={mode}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-6xl lg:text-8xl font-black text-white tracking-[-0.04em] uppercase italic leading-none"
                        >
                            {mode === 'HUB' ? 'ENGINEERING' : ''} 
                            <span className="text-gold-gradient">
                                {mode === 'HUB' ? ' HUB' : mode === 'OFFSET' ? 'INDUSTRIAL OFFSET' : mode === 'DIGITAL' ? 'DIGITAL BOUTIQUE' : 'CALIBRACIÓN MAESTRO'}
                            </span>
                        </motion.h1>
                    </div>

                    {mode !== 'HUB' && (
                        <div className="flex gap-4 p-2.5 bg-black/40 rounded-[2.8rem] border border-white/5 shadow-luxury">
                            <button onClick={() => setMode('OFFSET')} className={`py-4 px-8 rounded-full text-[9px] font-black uppercase tracking-[0.3em] transition-all italic ${mode === 'OFFSET' ? 'bg-white text-black' : 'text-slate-600 hover:text-white'}`}>Offset</button>
                            <button onClick={() => setMode('DIGITAL')} className={`py-4 px-8 rounded-full text-[9px] font-black uppercase tracking-[0.3em] transition-all italic ${mode === 'DIGITAL' ? 'bg-white text-black' : 'text-slate-600 hover:text-white'}`}>Digital</button>
                        </div>
                    )}
                </header>

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
                        {mode === 'HUB' && (
                            <div className="flex flex-col gap-16 relative z-10">
                                <div className="relative p-16 rounded-[4rem] bg-gradient-to-br from-liquid-gold/10 to-transparent border border-liquid-gold/20 overflow-hidden shadow-gold-glow-soft">
                                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-liquid-gold/5 blur-[120px] -mr-32 -mt-32"></div>
                                    <div className="relative z-10 max-w-2xl">
                                        <h2 className="text-6xl font-black text-white italic tracking-[-0.04em] uppercase leading-none mb-8">ECOSISTEMA DE <br/> <span className="text-liquid-gold">INGENIERÍA CÓRDOVA</span></h2>
                                        <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em] leading-loose italic">Calibración de algoritmos de producción para optimización de rentabilidad industrial y precisión de costos.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                    {[ 
                                        { id: 'OFFSET', title: 'Industrial Offset', desc: 'Producción de alto volumen, libros y formularios SRI.', icon: PrinterIcon, color: 'text-liquid-gold', tag: 'High Volume' },
                                        { id: 'DIGITAL', title: 'Digital Boutique', desc: 'Impresión rápida on-demand y tirajes personalizados.', icon: RocketLaunchIcon, color: 'text-white', tag: 'On-Demand' },
                                        { id: 'CONFIG', title: 'Sistema Maestro', desc: 'Calibración de costos operativos y proveedores.', icon: SettingsIcon, color: 'text-slate-500', tag: 'Core Config' }
                                    ].map(item => (
                                        <motion.button
                                            key={item.id}
                                            whileHover={{ y: -10, scale: 1.02 }}
                                            onClick={() => handleSetMode(item.id as Mode)}
                                            className="glass-card-luxury p-12 rounded-[4rem] border border-white/5 text-left group transition-all hover:border-liquid-gold/30 hover:bg-white/[0.03] flex flex-col h-full"
                                        >
                                            <div className="flex justify-between items-start mb-10">
                                                <div className={`w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center group-hover:bg-liquid-gold group-hover:text-black transition-all ${item.color}`}>
                                                    <item.icon className="w-10 h-10" />
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full text-slate-500">{item.tag}</span>
                                            </div>
                                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">{item.title}</h3>
                                            <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-loose flex-grow">{item.desc}</p>
                                            <div className="mt-10 flex items-center gap-4 text-liquid-gold opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-black uppercase tracking-widest">Inicializar Protocolo</span>
                                                <ChevronRightIcon className="w-4 h-4" />
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {mode === 'OFFSET' && (
                            <OffsetCalculator 
                                costs={costs} 
                                proveedores={proveedores} 
                                inventario={inventario} 
                                onSave={handleSaveToCatalog}
                                onOrder={handleAddToOrder}
                            />
                        )}
                        {mode === 'DIGITAL' && (
                            <DigitalCalculator 
                                costs={costs} 
                                proveedores={proveedores} 
                                inventario={inventario} 
                                onSave={handleSaveToCatalog}
                                onOrder={handleAddToOrder}
                            />
                        )}
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
                                        <button onClick={() => setMode('HUB')} className="px-10 py-5 text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
                                        <button onClick={() => handleSaveConfig(costs)} className="px-12 py-5 bg-liquid-gold text-black rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-gold-glow">Guardar Matriz</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {Object.entries(costs).filter(([key]) => key !== 'proveedoresPredeterminados').map(([key, val]) => (
                                        <div key={key} className="space-y-4">
                                            <label className="block text-[9px] font-black text-slate-700 uppercase tracking-widest ml-1">{key.replace(/_/g, ' ')}</label>
                                            <div className="space-y-2">
                                                <input 
                                                    type="number" step="0.0001" 
                                                    value={val as number} 
                                                    onChange={e => setCosts({...costs, [key]: parseFloat(e.target.value)})}
                                                    className="w-full p-5 bg-black/40 border border-white/5 rounded-2xl text-white font-black text-lg outline-none focus:border-liquid-gold/30 transition-all shadow-inner"
                                                />
                                                <select 
                                                    value={costs.proveedoresPredeterminados?.[key] || ''} 
                                                    onChange={e => setCosts({...costs, proveedoresPredeterminados: {...(costs.proveedoresPredeterminados || {}), [key]: e.target.value}})}
                                                    className="w-full p-3 bg-black/60 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none focus:border-liquid-gold/30 cursor-pointer"
                                                >
                                                    <option value="" className="bg-slate-900">SIN PROVEEDOR PREDETERMINADO</option>
                                                    {proveedores.map(p => (
                                                        <option key={p.id} value={p.id} className="bg-slate-900">👑 {p.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {showMasterTable && <MasterTableModal onClose={() => setShowMasterTable(false)} />}
            {showSaveModal && (
                <ProductManagementModal 
                    isOpen={showSaveModal} 
                    onClose={() => setShowSaveModal(false)} 
                    onSave={handleFinalSave} 
                    productToEdit={productToSave as Producto}
                    defaultMode="SINGLE"
                />
            )}
        </div>
    );
};

export default CalculadoraPreciosPage;

