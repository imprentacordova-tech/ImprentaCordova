
import React, { useState, useEffect, useMemo } from 'react';
import { 
    CalculatorIcon, SparklesIcon, CheckCircleIcon,
    ArrowRightIcon, BoltIcon, RocketLaunchIcon, 
    BeakerIcon, DocumentDuplicateIcon as DocumentIcon,
    CircleStackIcon, CpuIcon, Cog8ToothIcon, ExclamationTriangleIcon
} from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
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

    const calculateDigital = useMemo(() => {
        let clickCost = costs.CLICK_DIGITAL_A3;
        let sheetCost = 0;
        switch (digPaper) {
            case 'BOND_75': sheetCost = costs.COSTO_RESMA_BOND / 500; break;
            case 'COUCHE_150': sheetCost = costs.COSTO_PLIEGO_COUCHE_150 / 4; break;
            case 'COUCHE_300': sheetCost = costs.COSTO_PLIEGO_COUCHE_300 / 4; break;
            case 'ADHESIVO': sheetCost = costs.COSTO_PLIEGO_ADHESIVO / 4; break;
        }
        const prod = (digQty * digSides * clickCost) + (digQty * sheetCost);
        return prod * (1 + costs.MARGEN_GANANCIA);
    }, [digQty, digPaper, digSides, costs]);

    const finalPrice = mode === 'MANUAL' 
        ? (parseFloat(manualAmount) || 0) * (parseInt(manualQuantity) || 1)
        : mode === 'OFFSET' ? calculateOffset : calculateDigital;

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
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic">Alerta de Insumo</p>
                        <p className="text-[10px] text-slate-300 font-medium">Stock crítico en material asignado a <span className="text-white font-bold">{supplierName || 'Proveedor'}</span>.</p>
                    </div>
                </motion.div>
            )}

            <div className="flex gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                {(['MANUAL', 'OFFSET', 'DIGITAL'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'text-slate-500 hover:text-white'}`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {mode === 'MANUAL' && (
                    <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest italic ml-2">Unitario</label>
                            <input type="number" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-liquid-gold/30 text-xs" placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest italic ml-2">Cantidad</label>
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
                            <input type="number" value={offQty} onChange={e => setOffQty(parseInt(e.target.value))} className="bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none text-center" placeholder="Cant" />
                            {offPaperId === 'QUIMICO' ? (
                                <select value={offParts} onChange={e => setOffParts(parseInt(e.target.value))} className="bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white text-[10px] font-black uppercase outline-none">
                                    <option value={2}>Duplicado</option>
                                    <option value={3}>Triplicado</option>
                                </select>
                            ) : (
                                <select value={offColors} onChange={e => setOffColors(parseInt(e.target.value))} className="bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white text-[10px] font-black uppercase outline-none">
                                    <option value={1}>1 Color</option>
                                    <option value={2}>2 Colores</option>
                                </select>
                            )}
                        </div>
                    </motion.div>
                )}

                {mode === 'DIGITAL' && (
                    <motion.div key="digital" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        <select value={digPaper} onChange={e => setDigPaper(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white text-[10px] font-black uppercase tracking-widest outline-none italic">
                            <option value="BOND_75">BOND 75G</option>
                            <option value="COUCHE_150">COUCHÉ 150G</option>
                            <option value="COUCHE_300">COUCHÉ 300G</option>
                            <option value="ADHESIVO">ADHESIVO GLOSSY</option>
                        </select>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" value={digQty} onChange={e => setDigQty(parseInt(e.target.value))} className="bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white font-bold outline-none text-center" placeholder="Cant" />
                            <select value={digSides} onChange={e => setDigSides(parseInt(e.target.value) as any)} className="bg-black/60 border border-white/5 rounded-xl py-3 px-4 text-white text-[10px] font-black uppercase outline-none">
                                <option value={1}>Simplex</option>
                                <option value={2}>Duplex</option>
                            </select>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                    <p className="text-[7px] font-black text-slate-700 uppercase tracking-widest mb-1 italic">Presupuesto Sugerido</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter shadow-gold-glow-sm">${finalPrice.toFixed(2)}</p>
                </div>
                <button
                    onClick={() => onSelectPrice(finalPrice)}
                    className="px-6 py-3 bg-liquid-gold text-black rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-gold-glow"
                >
                    Asignar <ArrowRightIcon className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

export default PriceCalculatorDisplay;
