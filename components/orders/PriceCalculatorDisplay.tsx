
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Calculator as CalculatorIcon, Sparkles as SparklesIcon, CheckCircle as CheckCircleIcon,
    ArrowRight as ArrowRightIcon, Zap as BoltIcon, Rocket as RocketLaunchIcon, 
    FlaskConical as BeakerIcon, Copy as DocumentIcon,
    Database as CircleStackIcon, Cpu as CpuIcon, Settings as Cog8ToothIcon, AlertTriangle as ExclamationTriangleIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { SOURCE_PAPERS, DEFAULT_COSTS } from '../../constants';
import { CostConfig, Proveedor, InventoryItem } from '../../types';
import { useData } from '../../contexts/DataContext';

interface PriceCalculatorDisplayProps {
    onSelectPrice: (price: number) => void;
}

const PriceCalculatorDisplay: React.FC<PriceCalculatorDisplayProps> = ({ onSelectPrice }) => {
    const { proveedores, inventario } = useData();
    const [mode, setMode] = useState<'MANUAL' | 'OFFSET' | 'DIGITAL'>('MANUAL');
    const [costs, setCosts] = useState<CostConfig>(DEFAULT_COSTS);
    const [loading, setLoading] = useState(true);

    // --- MANUAL MODE STATE ---
    const [manualAmount, setManualAmount] = useState<string>('');
    const [manualQuantity, setManualQuantity] = useState<string>('1');

    // --- OFFSET MODE STATE ---
    const [offPaperId, setOffPaperId] = useState('QUIMICO');
    const [offQty, setOffQty] = useState(10); // En blocks si es quimico, unidades si es resto
    const [offParts, setOffParts] = useState(2);
    const [offColors, setOffColors] = useState(1);
    const [offHjsBlock, setOffHjsBlock] = useState(100);

    // --- DIGITAL MODE STATE ---
    const [digQty, setDigQty] = useState(10);
    const [digPaper, setDigPaper] = useState('COUCHE_150');
    const [digSides, setDigSides] = useState(1);

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                const { data } = await supabase.from('app_config').select('data').eq('id', 1).single();
                if (data?.data) {
                    setCosts({ ...DEFAULT_COSTS, ...data.data });
                }
            } catch (err) {
                console.warn('[PriceCalculatorDisplay] Using default costs');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const calculateOffset = useMemo(() => {
        const paper = SOURCE_PAPERS.find(p => p.id === offPaperId) || SOURCE_PAPERS[0];
        // Simplified logic for the widget
        let costPapel = 0;
        const cutsPerUnit = 4; // Default A5/1/4 Oficio simplified
        
        if (offPaperId === 'QUIMICO') {
            const totalJuegos = offQty * offHjsBlock;
            const bajadas = Math.ceil(totalJuegos / cutsPerUnit);
            const costoHojaOriginal = costs.COSTO_RESMA_QUIMICO_ORIG / 500;
            const costoHojaCopia = costs.COSTO_RESMA_QUIMICO_COPIA / 500;
            costPapel = (bajadas * costoHojaOriginal) + (bajadas * (offParts - 1) * costoHojaCopia);
        } else {
            const bajadas = Math.ceil(offQty / cutsPerUnit);
            const costKey = paper.costoBaseKey as keyof CostConfig;
            const baseVal = typeof costs[costKey] === 'number' ? (costs[costKey] as number) : 0;
            costPapel = bajadas * (paper.tipo === 'RESMA' ? baseVal / 500 : baseVal);
        }

        const costPre = (offColors * costs.COSTO_PLACA_POLIESTER) + costs.COSTO_DISENO_SRI;
        const costImp = costs.COSTO_ARRANQUE + (Math.ceil(offQty/1000) * costs.COSTO_MILLAR_IMPRESION);
        const total = (costPapel + costPre + costImp + costs.COSTO_CORTE) * (1 + costs.MARGEN_GANANCIA);
        
        return Math.max(total, offPaperId === 'QUIMICO' ? 15 : 5);
    }, [offPaperId, offQty, offParts, offColors, offHjsBlock, costs]);

    const [showBreakdown, setShowBreakdown] = useState(false);

    const breakdown = useMemo(() => {
        if (mode === 'MANUAL') return null;
        
        if (mode === 'OFFSET') {
            const paper = SOURCE_PAPERS.find(p => p.id === offPaperId) || SOURCE_PAPERS[0];
            let costPapel = 0;
            const cutsPerUnit = 4;
            
            if (offPaperId === 'QUIMICO') {
                const totalJuegos = offQty * offHjsBlock;
                const bajadas = Math.ceil(totalJuegos / cutsPerUnit);
                const costoHojaOriginal = costs.COSTO_RESMA_QUIMICO_ORIG / 500;
                const costoHojaCopia = costs.COSTO_RESMA_QUIMICO_COPIA / 500;
                costPapel = (bajadas * costoHojaOriginal) + (bajadas * (offParts - 1) * costoHojaCopia);
            } else {
                const bajadas = Math.ceil(offQty / cutsPerUnit);
                const costKey = paper.costoBaseKey as keyof CostConfig;
                const baseVal = typeof costs[costKey] === 'number' ? (costs[costKey] as number) : 0;
                costPapel = bajadas * (paper.tipo === 'RESMA' ? baseVal / 500 : baseVal);
            }

            const costPre = (offColors * costs.COSTO_PLACA_POLIESTER) + costs.COSTO_DISENO_SRI;
            const costImp = costs.COSTO_ARRANQUE + (Math.ceil(offQty/1000) * costs.COSTO_MILLAR_IMPRESION);
            const subtotal = costPapel + costPre + costImp + costs.COSTO_CORTE;
            const utility = subtotal * costs.MARGEN_GANANCIA;
            
            return {
                material: costPapel,
                prepress: costPre,
                press: costImp + costs.COSTO_CORTE,
                utility: utility,
                total: subtotal + utility
            };
        } else {
            let clickCost = costs.CLICK_DIGITAL_A3;
            let sheetCost = 0;
            switch (digPaper) {
                case 'BOND_75': sheetCost = costs.COSTO_RESMA_BOND / 500; break;
                case 'COUCHE_150': sheetCost = costs.COSTO_PLIEGO_COUCHE_150 / 4; break;
                case 'COUCHE_300': sheetCost = costs.COSTO_PLIEGO_COUCHE_300 / 4; break;
                case 'ADHESIVO': sheetCost = costs.COSTO_PLIEGO_ADHESIVO / 4; break;
            }
            const costPress = digQty * digSides * clickCost;
            const costMaterial = digQty * sheetCost;
            const subtotal = costPress + costMaterial;
            const utility = subtotal * costs.MARGEN_GANANCIA;

            return {
                material: costMaterial,
                prepress: 0,
                press: costPress,
                utility: utility,
                total: subtotal + utility
            };
        }
    }, [mode, offPaperId, offQty, offParts, offColors, offHjsBlock, digQty, digPaper, digSides, costs]);

    const finalPrice = mode === 'MANUAL' 
        ? (parseFloat(manualAmount) || 0) * (parseInt(manualQuantity) || 1)
        : breakdown?.total || 0;

    const currentPaper = SOURCE_PAPERS.find(p => p.id === offPaperId);
    const supplierId = currentPaper ? costs.proveedoresPredeterminados?.[currentPaper.costoBaseKey] : null;
    const isLowStock = supplierId ? inventario.some(i => i.proveedorId === supplierId && i.cantidad <= i.minimo) : false;
    const supplierName = supplierId ? proveedores.find(p => p.id === supplierId)?.nombre : null;

    return (
        <div className="space-y-6">
            {isLowStock && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4 mb-4"
                >
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black">
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.8em] italic">Alerta de Insumo</p>
                        <p className="text-[10px] text-slate-300 font-medium">Stock crítico en material asignado a <span className="text-white font-bold">{supplierName || 'Proveedor'}</span>.</p>
                    </div>
                </motion.div>
            )}

            <div className="flex items-center justify-between mb-2 px-2">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] italic">Herramienta de Costos</p>
                <button 
                    onClick={() => window.open('/#/calculadora', '_blank')}
                    className="text-[9px] font-black text-liquid-gold hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors group"
                >
                    Hub Avanzado <RocketLaunchIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                {(['MANUAL', 'OFFSET', 'DIGITAL'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'text-slate-500 hover:text-white'}`}
                    >
                        {m === 'MANUAL' ? 'Manual' : m === 'OFFSET' ? 'Offset Ind.' : 'Digital HD'}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {mode === 'MANUAL' && (
                    <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest italic ml-2">Precio Unitario</label>
                            <input type="number" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-liquid-gold/30 text-xs" placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest italic ml-2">Cantidad Total</label>
                            <input type="number" value={manualQuantity} onChange={e => setManualQuantity(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-liquid-gold/30 text-xs" placeholder="1" />
                        </div>
                    </motion.div>
                )}

                {mode === 'OFFSET' && (
                    <motion.div key="offset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        <select value={offPaperId} onChange={e => setOffPaperId(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white text-[10px] font-black uppercase tracking-widest outline-none italic">
                            {SOURCE_PAPERS.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest italic ml-2">Volumen</label>
                                <input type="number" value={offQty} onChange={e => setOffQty(parseInt(e.target.value))} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none text-center" placeholder="Cant" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest italic ml-2">Configuración</label>
                                {offPaperId === 'QUIMICO' ? (
                                    <select value={offParts} onChange={e => setOffParts(parseInt(e.target.value))} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white text-[10px] font-black uppercase outline-none">
                                        <option value={2}>Duplicado</option>
                                        <option value={3}>Triplicado</option>
                                    </select>
                                ) : (
                                    <select value={offColors} onChange={e => setOffColors(parseInt(e.target.value))} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white text-[10px] font-black uppercase outline-none">
                                        <option value={1}>1 Color</option>
                                        <option value={2}>2 Colores</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {mode === 'DIGITAL' && (
                    <motion.div key="digital" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        <select value={digPaper} onChange={e => setDigPaper(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white text-[10px] font-black uppercase tracking-widest outline-none italic">
                            <option value="BOND_75">BOND 75G (RESMA)</option>
                            <option value="COUCHE_150">COUCHÉ 150G (PLIEGO)</option>
                            <option value="COUCHE_300">COUCHÉ 300G (PLIEGO)</option>
                            <option value="ADHESIVO">ADHESIVO GLOSSY</option>
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest italic ml-2">Copias A3</label>
                                <input type="number" value={digQty} onChange={e => setDigQty(parseInt(e.target.value))} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none text-center" placeholder="Cant" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest italic ml-2">Impresión</label>
                                <select value={digSides} onChange={e => setDigSides(parseInt(e.target.value) as any)} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white text-[10px] font-black uppercase outline-none">
                                    <option value={1}>Sólo Frente</option>
                                    <option value={2}>Frente y Retira</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {mode !== 'MANUAL' && breakdown && (
                <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 space-y-3">
                    <button 
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-500 hover:text-liquid-gold transition-colors"
                    >
                        <span>Desglose Industrial</span>
                        <span>{showBreakdown ? 'Ocultar' : 'Ver Detalles'}</span>
                    </button>
                    
                    <AnimatePresence>
                        {showBreakdown && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-2 pt-2 border-t border-white/5"
                            >
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500 font-medium">Suministros y Papel</span>
                                    <span className="text-white font-bold">${breakdown.material.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500 font-medium">Pre-prensa y Matriz</span>
                                    <span className="text-white font-bold">${breakdown.prepress.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500 font-medium">Operación de Prensa</span>
                                    <span className="text-white font-bold">${breakdown.press.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-liquid-gold/60 font-medium">Utilidad Estratégica</span>
                                    <span className="text-liquid-gold font-bold">${breakdown.utility.toFixed(2)}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                    <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">Inversión Final Sugerida</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter shadow-gold-glow-sm">${finalPrice.toFixed(2)}</p>
                </div>
                <button
                    onClick={() => onSelectPrice(finalPrice)}
                    className="px-8 py-4 bg-liquid-gold text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-gold-glow active:scale-95"
                >
                    Asignar Presupuesto <ArrowRightIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default PriceCalculatorDisplay;
