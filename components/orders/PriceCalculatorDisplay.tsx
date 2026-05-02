
import React, { useState, useEffect, useMemo } from 'react';
import { 
    CalculatorIcon, SparklesIcon,
    ArrowRightIcon, RocketLaunchIcon, 
    ExclamationTriangleIcon
} from '../../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { SOURCE_PAPERS, DEFAULT_COSTS } from '../../constants';
import { CostConfig } from '../../types';
import { useData } from '../../contexts/DataContext';

interface PriceCalculatorDisplayProps {
    onSelectPrice: (price: number) => void;
    currentPrice?: number;
}

const PriceCalculatorDisplay: React.FC<PriceCalculatorDisplayProps> = ({ onSelectPrice }) => {
    const { proveedores, inventario } = useData();
    const [mode, setMode] = useState<'MANUAL' | 'OFFSET' | 'DIGITAL'>('MANUAL');
    const [costs, setCosts] = useState<CostConfig>(DEFAULT_COSTS);
    const [loading, setLoading] = useState(true);

    const [manualAmount, setManualAmount] = useState<string>('');
    const [manualQuantity, setManualQuantity] = useState<string>('1');

    const [offPaperId, setOffPaperId] = useState('QUIMICO');
    const [offQty, setOffQty] = useState(10); 
    const [offParts, setOffParts] = useState(2);
    const [offColors, setOffColors] = useState(1);
    const [offHjsBlock, setOffHjsBlock] = useState(100);

    const [digQty, setDigQty] = useState(10);
    const [digPaper, setDigPaper] = useState('BOND_75');
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

    if (loading) return (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-300">
            <div className="w-10 h-10 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sincronizando_Costos</p>
        </div>
    );

    return (
        <div className="relative space-y-8 animate-fade-in">
            {isLowStock && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 flex items-center gap-5"
                >
                    <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em]">ALERTA_DE_SUMINISTRO</p>
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-tight">Stock crítico: <span className="text-red-700">{supplierName || 'Material Base'}</span></p>
                    </div>
                </motion.div>
            )}

            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-blue shadow-blue-glow animate-pulse" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">MÓDULO_DE_COTIZACIÓN_INDUSTRIAL</p>
                </div>
                <button 
                    onClick={() => window.open('/#/calculadora', '_blank')}
                    className="text-[10px] font-black text-brand-blue hover:text-slate-900 uppercase tracking-widest flex items-center gap-3 transition-all group bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 hover:border-brand-blue/30"
                >
                    HUB_AVANZADO <RocketLaunchIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="relative flex gap-2 p-2 bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-sm">
                {(['MANUAL', 'OFFSET', 'DIGITAL'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`relative flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all z-10 ${
                            mode === m ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-slate-900'
                        }`}
                    >
                        {m === 'MANUAL' ? 'Directo' : m === 'OFFSET' ? 'Industrial' : 'Digital'}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {mode === 'MANUAL' && (
                    <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Precio Unitario</label>
                            <input 
                                type="number" 
                                value={manualAmount} 
                                onChange={e => setManualAmount(e.target.value)} 
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-slate-900 font-black outline-none focus:border-brand-blue/30 focus:bg-white transition-all text-lg placeholder:text-slate-200" 
                                placeholder="0.00" 
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Cantidad Total</label>
                            <input 
                                type="number" 
                                value={manualQuantity} 
                                onChange={e => setManualQuantity(e.target.value)} 
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-slate-900 font-black outline-none focus:border-brand-blue/30 focus:bg-white transition-all text-lg placeholder:text-slate-200" 
                                placeholder="1" 
                            />
                        </div>
                    </motion.div>
                )}

                {mode === 'OFFSET' && (
                    <motion.div key="offset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Sustrato Industrial</label>
                            <select 
                                value={offPaperId} 
                                onChange={e => setOffPaperId(e.target.value)} 
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-slate-900 text-xs font-black uppercase tracking-widest outline-none focus:border-brand-blue/30 transition-all appearance-none cursor-pointer"
                            >
                                {SOURCE_PAPERS.map(p => <option key={p.id} value={p.id}>{p.nombre.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Volumen</label>
                                <input type="number" value={offQty} onChange={e => setOffQty(parseInt(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-slate-900 font-black outline-none focus:border-brand-blue/30 text-center text-lg" placeholder="Cant" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Configuración</label>
                                {offPaperId === 'QUIMICO' ? (
                                    <select value={offParts} onChange={e => setOffParts(parseInt(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-slate-900 text-xs font-black uppercase outline-none focus:border-brand-blue/30">
                                        <option value={2}>Duplicado</option>
                                        <option value={3}>Triplicado</option>
                                    </select>
                                ) : (
                                    <select value={offColors} onChange={e => setOffColors(parseInt(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-slate-900 text-xs font-black uppercase outline-none focus:border-brand-blue/30">
                                        <option value={1}>1 Color</option>
                                        <option value={2}>2 Colores</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {mode === 'DIGITAL' && (
                    <motion.div key="digital" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Sustrato Digital</label>
                            <select value={digPaper} onChange={e => setDigPaper(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-slate-900 text-xs font-black uppercase tracking-widest outline-none focus:border-brand-blue/30 appearance-none cursor-pointer">
                                <option value="BOND_75">BOND 75G (RESMA)</option>
                                <option value="COUCHE_150">COUCHÉ 150G (PLIEGO)</option>
                                <option value="COUCHE_300">COUCHÉ 300G (PLIEGO)</option>
                                <option value="ADHESIVO">ADHESIVO GLOSSY</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Copias A3+</label>
                                <input type="number" value={digQty} onChange={e => setDigQty(parseInt(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-slate-900 font-black outline-none focus:border-brand-blue/30 text-center text-lg" placeholder="Cant" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Lados_Impresión</label>
                                <select value={digSides} onChange={e => setDigSides(parseInt(e.target.value) as any)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 text-slate-900 text-xs font-black uppercase outline-none focus:border-brand-blue/30">
                                    <option value={1}>Sólo Frente</option>
                                    <option value={2}>Frente y Retira</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {mode !== 'MANUAL' && breakdown && (
                <div className="bg-slate-50 rounded-[2rem] border-2 border-slate-100 p-6 space-y-4">
                    <button 
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-blue transition-colors"
                    >
                        <span>DESGLOSE_ANALÍTICO_PRODUCCIÓN</span>
                        <div className="flex items-center gap-2">
                            <span>{showBreakdown ? 'OCULTAR' : 'VER_DETALLES'}</span>
                            <CalculatorIcon className={`w-4 h-4 transition-transform duration-500 ${showBreakdown ? 'rotate-180' : ''}`} />
                        </div>
                    </button>
                    
                    <AnimatePresence>
                        {showBreakdown && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden space-y-3 pt-4 border-t-2 border-slate-100"
                            >
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                                    <span className="text-slate-500">Materia Prima y Sustratos</span>
                                    <span className="text-slate-900">${breakdown.material.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                                    <span className="text-slate-500">Matrices y Pre-prensa</span>
                                    <span className="text-slate-900">${breakdown.prepress.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                                    <span className="text-slate-500">Operación Mecánica y Corte</span>
                                    <span className="text-slate-900">${breakdown.press.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest pt-2 border-t border-slate-100">
                                    <span className="text-brand-blue">MARGEN_OPERATIVO</span>
                                    <span className="text-brand-blue">${breakdown.utility.toFixed(2)}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <div className="pt-10 border-t-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mb-2">INVERSIÓN_ALFA_PROYECTADA</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-brand-blue">$</span>
                        <span className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter tabular-nums drop-shadow-sm">
                            {finalPrice.toFixed(2)}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => onSelectPrice(finalPrice)}
                    className="w-full md:w-auto px-12 py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-brand-blue transition-all shadow-xl hover:shadow-blue-glow-sm active:scale-95"
                >
                    ASIGNAR PRESUPUESTO <ArrowRightIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default PriceCalculatorDisplay;
