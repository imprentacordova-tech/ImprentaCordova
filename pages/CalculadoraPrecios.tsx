
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, CheckCircleIcon, CloseIcon, InfoIcon, FileText, Sparkles, RulerIcon, Cog8ToothIcon, ShieldCheckIcon, MonitorIcon, TableIcon, DollarIcon, SaveIcon, PrinterIcon, WrenchScrewdriverIcon, ExclamationTriangleIcon, ArrowRightIcon, BoxIcon, PhotoIcon, StarIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

// --- TIPOS Y ESTADOS ---

type Mode = 'OFFSET' | 'DIGITAL' | 'PUBLICIDAD' | 'SUBLIMACION' | 'CONFIG';

// --- 1. CONFIGURACIÓN DE COSTOS (PERSONALIZADA ECUADOR) ---
interface CostConfig {
    // Materia Prima (Papeles - Offset)
    COSTO_RESMA_QUIMICO_ORIG: number;
    COSTO_RESMA_QUIMICO_COPIA: number;
    COSTO_RESMA_BOND: number;
    COSTO_PLIEGO_COUCHE_300: number;
    COSTO_PLIEGO_ADHESIVO: number;
    
    // Pre-Prensa Offset
    COSTO_DISENO_SRI: number;
    COSTO_PLACA_POLIESTER: number;
    COSTO_PLACA_CTP: number;
    
    // Impresión Offset
    COSTO_ARRANQUE: number;
    COSTO_MILLAR_IMPRESION: number;
    
    // Digital
    CLICK_DIGITAL_A3: number;
    CLICK_DIGITAL_BN: number;
    
    // Gran Formato (Publicidad)
    COSTO_M2_LONA: number;
    COSTO_M2_VINIL: number;
    COSTO_TINTA_M2: number; // Costo tinta por m2
    COSTO_ESTRUCTURA_ROLLUP: number;

    // Sublimación
    COSTO_TAZA: number;
    COSTO_GORRA: number;
    COSTO_CAMISETA: number;
    COSTO_INSUMOS_SUB: number; // Costo hoja + tinta + luz por unidad

    // Acabados Generales
    COSTO_NUMERACION: number;
    COSTO_BLOCK_ENCOLADO: number;
    COSTO_CORTE: number;
    
    // Rentabilidad
    MARGEN_GANANCIA: number;
}

const DEFAULT_COSTS: CostConfig = {
    // Offset
    COSTO_RESMA_QUIMICO_ORIG: 47.00,
    COSTO_RESMA_QUIMICO_COPIA: 46.00,
    COSTO_RESMA_BOND: 4.50,
    COSTO_PLIEGO_COUCHE_300: 0.51,
    COSTO_PLIEGO_ADHESIVO: 1.10,
    COSTO_DISENO_SRI: 5.00,
    COSTO_PLACA_POLIESTER: 3.00,
    COSTO_PLACA_CTP: 6.00,
    COSTO_ARRANQUE: 10.00,
    COSTO_MILLAR_IMPRESION: 4.00,
    COSTO_NUMERACION: 4.00,
    COSTO_BLOCK_ENCOLADO: 0.15,
    COSTO_CORTE: 1.50,
    
    // Digital
    CLICK_DIGITAL_A3: 0.40,
    CLICK_DIGITAL_BN: 0.10,

    // Publicidad
    COSTO_M2_LONA: 1.80,
    COSTO_M2_VINIL: 2.50,
    COSTO_TINTA_M2: 1.50,
    COSTO_ESTRUCTURA_ROLLUP: 22.00,

    // Sublimación
    COSTO_TAZA: 1.10,
    COSTO_GORRA: 1.50,
    COSTO_CAMISETA: 3.50,
    COSTO_INSUMOS_SUB: 0.40,
    
    MARGEN_GANANCIA: 0.40 
};

// --- 2. MODELO DE PAPELES (FUENTE) ---
interface SourcePaper {
    id: string;
    nombre: string;
    tipo: 'RESMA' | 'PLIEGO';
    ancho: number;
    alto: number;
    costoBaseKey: keyof CostConfig;
}

const SOURCE_PAPERS: SourcePaper[] = [
    { id: 'QUIMICO', nombre: 'Papel Químico (Autocopiativo)', tipo: 'RESMA', ancho: 21.6, alto: 33, costoBaseKey: 'COSTO_RESMA_QUIMICO_ORIG' },
    { id: 'BOND', nombre: 'Papel Bond 75g', tipo: 'RESMA', ancho: 21.6, alto: 33, costoBaseKey: 'COSTO_RESMA_BOND' },
    { id: 'COUCHE_300', nombre: 'Couché 300g (Glosy)', tipo: 'PLIEGO', ancho: 90, alto: 130, costoBaseKey: 'COSTO_PLIEGO_COUCHE_300' },
    { id: 'ADHESIVO', nombre: 'Adhesivo Brillante', tipo: 'PLIEGO', ancho: 70, alto: 100, costoBaseKey: 'COSTO_PLIEGO_ADHESIVO' },
];

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
    
    return (
        <div className="w-full py-4 grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">ENTRADA</div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{sourceName}</h4>
                <p className="text-xs text-gray-500 mt-1">{sourceSize}</p>
                <p className="text-xs font-mono text-brand-blue mt-2 font-bold">{formatCurrency(materialCost)}</p>
             </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <div className="absolute top-2 right-2 bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">PRE-PRENSA</div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Placas / Diseño</h4>
                <p className="text-xs text-gray-500 mt-1">Matriz & Ajustes</p>
                <p className="text-xs font-mono text-brand-blue mt-2 font-bold">{formatCurrency(prePressCost)}</p>
             </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <div className="absolute top-2 right-2 bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded">PROCESO</div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Impresión</h4>
                <p className="text-xs text-gray-500 mt-1">Tiraje & Tinta</p>
                <p className="text-xs font-mono text-brand-blue mt-2 font-bold">{formatCurrency(printCost)}</p>
             </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
                <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded">SALIDA</div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">Producto Final</h4>
                <p className="text-xs text-gray-500 mt-1">{cutSize}</p>
                <p className="text-xs text-gray-500">{cutsPerUnit} cortes / un.</p>
             </div>
        </div>
    );
};

// --- CALCULADORA OFFSET ---
const OffsetCalculator: React.FC<{ costs: CostConfig }> = ({ costs }) => {
    // Inputs
    const [paperId, setPaperId] = useState('QUIMICO');
    
    // Tamaños Predefinidos para selección rápida
    const [selectedSizePreset, setSelectedSizePreset] = useState('1/4_OFICIO');
    const [finalW, setFinalW] = useState(10.5);
    const [finalH, setFinalH] = useState(14.8);
    
    const [quantity, setQuantity] = useState(100); // Blocks o Unidades
    const [cantidadHojasBlock, setCantidadHojasBlock] = useState(100); // 100, 50, 25
    const [colorsFront, setColorsFront] = useState(1); 
    const [colorsBack, setColorsBack] = useState(0);
    const [parts, setParts] = useState(2); // 1 Original + 1 Copia
    const [hasDesign, setHasDesign] = useState(false); // Ya tiene diseño?
    const [requiresSRI, setRequiresSRI] = useState(true);

    // Manejo de tamaños predefinidos
    const handlePresetChange = (val: string) => {
        setSelectedSizePreset(val);
        const currentPaper = SOURCE_PAPERS.find(p => p.id === paperId);
        
        if (currentPaper?.tipo === 'RESMA') {
            // Base Oficio (21.6 x 33)
            switch(val) {
                case 'OFICIO': setFinalW(21.6); setFinalH(33); break;
                case '1/2_OFICIO': setFinalW(21.6); setFinalH(16.5); break;
                case '1/4_OFICIO': setFinalW(10.8); setFinalH(16.5); break; // Aprox notas venta
                case '1/8_OFICIO': setFinalW(10.8); setFinalH(8.25); break;
            }
        } else {
            // Base Pliego o A4 Standard
            switch(val) {
                case 'A3': setFinalW(29.7); setFinalH(42); break;
                case 'A4': setFinalW(21); setFinalH(29.7); break;
                case 'A5': setFinalW(14.8); setFinalH(21); break;
                case 'A6': setFinalW(10.5); setFinalH(14.8); break;
            }
        }
    };

    // --- MOTOR DE CÁLCULO ---
    const result = useMemo(() => {
        const paper = SOURCE_PAPERS.find(p => p.id === paperId) || SOURCE_PAPERS[0];
        
        const marginY = 1.0; 
        const marginX = 0.5;
        const usableW = paper.ancho - marginX;
        const usableH = paper.alto - marginY;

        const colsA = Math.floor(usableW / finalW);
        const rowsA = Math.floor(usableH / finalH);
        const cutsA = colsA * rowsA;

        const colsB = Math.floor(usableW / finalH);
        const rowsB = Math.floor(usableH / finalW);
        const cutsB = colsB * rowsB;

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
            
            const costoTotalOrig = totalBajadasConMerma * costoHojaOriginal;
            const costoTotalCopia = totalBajadasConMerma * (parts - 1) * costoHojaCopia;
            
            costPapelTotal = costoTotalOrig + costoTotalCopia;
            totalSheetsNeeded = totalBajadasConMerma * parts; 

        } else if (paper.tipo === 'RESMA') {
            const totalUnidades = quantity; 
            const bajadas = Math.ceil(totalUnidades / cutsPerUnit);
            const merma = Math.ceil(bajadas * 0.10) + 30;
            const totalHojas = bajadas + merma;
            
            const costoHoja = costs[paper.costoBaseKey] / 500;
            costPapelTotal = totalHojas * costoHoja;
            totalSheetsNeeded = totalHojas;

        } else {
            const totalUnidades = quantity;
            const bajadas = Math.ceil(totalUnidades / cutsPerUnit);
            const merma = Math.ceil(bajadas * 0.10) + 5;
            const totalPliegos = bajadas + merma;
            
            costPapelTotal = totalPliegos * costs[paper.costoBaseKey];
            totalSheetsNeeded = totalPliegos;
        }

        let costPrePrensa = 0;
        if (!hasDesign) {
            costPrePrensa += requiresSRI ? costs.COSTO_DISENO_SRI : 5.00;
        }
        
        const numPlacas = colorsFront + colorsBack;
        const costoPlacaUnit = (quantity > 2000 || paper.id === 'COUCHE_300') ? costs.COSTO_PLACA_CTP : costs.COSTO_PLACA_POLIESTER;
        
        const costPlacas = numPlacas * costoPlacaUnit;
        costPrePrensa += costPlacas;

        const millares = Math.ceil(totalSheetsNeeded / 1000);
        const tiros = millares * (colorsFront + colorsBack); 
        const costImpresion = costs.COSTO_ARRANQUE + (tiros * costs.COSTO_MILLAR_IMPRESION);

        let costAcabados = costs.COSTO_CORTE; 
        if (paper.id === 'QUIMICO') {
            costAcabados += (quantity * costs.COSTO_BLOCK_ENCOLADO); 
            costAcabados += (millares * costs.COSTO_NUMERACION); 
        }

        const costoTotalProduccion = costPapelTotal + costPrePrensa + costImpresion + costAcabados;
        const utilidadEsperada = costoTotalProduccion * costs.MARGEN_GANANCIA;
        let pvp = costoTotalProduccion + utilidadEsperada;
        
        if (paper.id === 'QUIMICO' && quantity === 1 && pvp < 15) pvp = 15;

        return {
            paper,
            cutsPerUnit,
            costPapelTotal,
            costPrePrensa,
            costImpresion,
            costAcabados,
            costoTotalProduccion,
            pvp,
            unitario: pvp / quantity
        };

    }, [paperId, finalW, finalH, quantity, colorsFront, colorsBack, parts, costs, hasDesign, requiresSRI, cantidadHojasBlock]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Input Panel */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="bg-brand-blue p-2 rounded-lg text-white">
                            <WrenchScrewdriverIcon className="w-5 h-5" />
                        </div>
                        <h2 className="font-bold text-gray-900 dark:text-white">Configurar Trabajo</h2>
                    </div>

                    <div className="space-y-5">
                        {/* Tipo de Papel */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Material (Fuente)</label>
                            <select value={paperId} onChange={e => {setPaperId(e.target.value); handlePresetChange('1/4_OFICIO')}} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue">
                                {SOURCE_PAPERS.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.ancho}x{p.alto}cm)</option>)}
                            </select>
                        </div>

                        {/* Tamaño de Corte */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tamaño Final (Corte)</label>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                {SOURCE_PAPERS.find(p=>p.id===paperId)?.tipo === 'RESMA' ? (
                                    <>
                                        <button onClick={() => handlePresetChange('OFICIO')} className={`px-2 py-1 text-xs border rounded ${selectedSizePreset==='OFICIO' ? 'bg-brand-blue text-white' : ''}`}>Oficio</button>
                                        <button onClick={() => handlePresetChange('1/2_OFICIO')} className={`px-2 py-1 text-xs border rounded ${selectedSizePreset==='1/2_OFICIO' ? 'bg-brand-blue text-white' : ''}`}>1/2 Of.</button>
                                        <button onClick={() => handlePresetChange('1/4_OFICIO')} className={`px-2 py-1 text-xs border rounded ${selectedSizePreset==='1/4_OFICIO' ? 'bg-brand-blue text-white' : ''}`}>1/4 Of.</button>
                                        <button onClick={() => handlePresetChange('1/8_OFICIO')} className={`px-2 py-1 text-xs border rounded ${selectedSizePreset==='1/8_OFICIO' ? 'bg-brand-blue text-white' : ''}`}>1/8 Of.</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handlePresetChange('A3')} className={`px-2 py-1 text-xs border rounded ${selectedSizePreset==='A3' ? 'bg-brand-blue text-white' : ''}`}>A3</button>
                                        <button onClick={() => handlePresetChange('A4')} className={`px-2 py-1 text-xs border rounded ${selectedSizePreset==='A4' ? 'bg-brand-blue text-white' : ''}`}>A4</button>
                                        <button onClick={() => handlePresetChange('A5')} className={`px-2 py-1 text-xs border rounded ${selectedSizePreset==='A5' ? 'bg-brand-blue text-white' : ''}`}>A5</button>
                                        <button onClick={() => handlePresetChange('A6')} className={`px-2 py-1 text-xs border rounded ${selectedSizePreset==='A6' ? 'bg-brand-blue text-white' : ''}`}>A6</button>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input type="number" value={finalW} onChange={e => setFinalW(parseFloat(e.target.value))} className="w-full p-2 pl-6 border rounded-lg text-sm bg-gray-50" />
                                    <span className="absolute left-2 top-2 text-xs text-gray-400">W</span>
                                </div>
                                <span className="text-gray-400">x</span>
                                <div className="relative flex-1">
                                    <input type="number" value={finalH} onChange={e => setFinalH(parseFloat(e.target.value))} className="w-full p-2 pl-6 border rounded-lg text-sm bg-gray-50" />
                                    <span className="absolute left-2 top-2 text-xs text-gray-400">H</span>
                                </div>
                                <span className="text-xs text-gray-500">cm</span>
                            </div>
                        </div>

                        {/* Cantidad */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cantidad ({paperId === 'QUIMICO' ? 'Blocks' : 'Unidades'})</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full p-2.5 font-bold text-brand-blue border border-brand-blue/30 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none" />
                            </div>
                            {paperId === 'QUIMICO' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Hojas/Block</label>
                                    <select value={cantidadHojasBlock} onChange={e => setCantidadHojasBlock(parseInt(e.target.value))} className="w-full p-2.5 border rounded-xl text-sm">
                                        <option value={100}>100 (Estándar)</option>
                                        <option value={50}>50 (Medio)</option>
                                        <option value={25}>25 (Mini)</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Tintas */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tintas (Colores)</label>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <span className="text-[10px] text-gray-400 block mb-1">Frente</span>
                                    <input type="number" min={1} max={4} value={colorsFront} onChange={e => setColorsFront(parseInt(e.target.value))} className="w-full p-1.5 border rounded text-center text-sm" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[10px] text-gray-400 block mb-1">Reverso</span>
                                    <input type="number" min={0} max={4} value={colorsBack} onChange={e => setColorsBack(parseInt(e.target.value))} className="w-full p-1.5 border rounded text-center text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Opciones Extra */}
                        <div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
                                <input type="checkbox" checked={hasDesign} onChange={e => setHasDesign(e.target.checked)} className="rounded text-brand-blue" />
                                Cliente entrega diseño listo
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={requiresSRI} onChange={e => setRequiresSRI(e.target.checked)} disabled={paperId !== 'QUIMICO'} className="rounded text-brand-blue disabled:opacity-50" />
                                Requiere Autorización SRI
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-8 space-y-6">
                {result ? (
                    <>
                        <ProductionPipeline 
                            sourceName={result.paper.nombre}
                            sourceType={result.paper.tipo}
                            sourceSize={`${result.paper.ancho}x${result.paper.alto} cm`}
                            cutSize={`${finalW}x${finalH} cm`}
                            cutsPerUnit={result.cutsPerUnit}
                            prePressCost={result.costPrePrensa}
                            materialCost={result.costPapelTotal}
                            printCost={result.costImpresion}
                        />

                        {/* Final Price Big Card */}
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden text-white p-8 flex flex-col md:flex-row items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Costo de Producción</p>
                                <p className="text-2xl font-bold text-gray-300">{formatCurrency(result.costoTotalProduccion)}</p>
                                <p className="text-xs text-gray-500 mt-2">* Incluye materiales, mano de obra y desgaste</p>
                            </div>
                            
                            <div className="h-16 w-px bg-gray-700 hidden md:block"></div>

                            <div className="text-center md:text-right mt-6 md:mt-0">
                                <p className="text-sm font-bold text-green-400 uppercase tracking-widest mb-1">Precio de Venta Sugerido</p>
                                <div className="flex items-baseline gap-2 justify-center md:justify-end">
                                    <span className="text-5xl font-black tracking-tighter text-white">{formatCurrency(result.pvp)}</span>
                                    <span className="text-lg text-gray-400 font-medium">+ IVA</span>
                                </div>
                                <div className="mt-2 inline-block bg-white/10 px-3 py-1 rounded-full text-xs font-mono">
                                    Unitario: {formatCurrency(result.unitario)}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300">
                        <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">El tamaño de corte es mayor al material base.</p>
                        <p className="text-sm text-gray-400">Verifica las medidas ingresadas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- CALCULADORA DIGITAL ---
const DigitalCalculator: React.FC<{ costs: CostConfig }> = ({ costs }) => {
    // Inputs
    const [format, setFormat] = useState<'A4' | 'A3' | 'SRA3'>('A3');
    const [paperType, setPaperType] = useState('COUCHE_150');
    const [colorMode, setColorMode] = useState<'COLOR' | 'BW'>('COLOR');
    const [sides, setSides] = useState<1 | 2>(1);
    const [quantity, setQuantity] = useState(10);

    const calculation = useMemo(() => {
        // Factors
        let clickCost = colorMode === 'COLOR' ? costs.CLICK_DIGITAL_A3 : costs.CLICK_DIGITAL_BN;
        if (format === 'A4') clickCost = clickCost * 0.6; 
        
        // Paper Cost Factors
        let sheetCost = 0;
        switch (paperType) {
            case 'BOND': sheetCost = costs.COSTO_RESMA_BOND / 500; break; 
            case 'COUCHE_115': sheetCost = (costs.COSTO_PLIEGO_COUCHE_300 / 4) * 0.8; break; 
            case 'COUCHE_300': sheetCost = costs.COSTO_PLIEGO_COUCHE_300 / 4; break; 
            case 'ADHESIVO': sheetCost = costs.COSTO_PLIEGO_ADHESIVO / 4; break;
            default: sheetCost = 0.10;
        }

        const totalClicks = quantity * sides;
        const totalPaper = quantity; 
        
        const productionCost = (totalClicks * clickCost) + (totalPaper * sheetCost);
        const pvp = productionCost * (1 + costs.MARGEN_GANANCIA);
        
        return {
            unitCost: productionCost / quantity,
            totalCost: productionCost,
            unitPvp: pvp / quantity,
            totalPvp: pvp
        };
    }, [format, paperType, colorMode, sides, quantity, costs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-purple-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6 border-b border-purple-100 dark:border-gray-700 pb-4">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Impresión Digital</h2>
                        <p className="text-xs text-gray-500">Láser / Inkjet de Alta Producción</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Formato</label>
                        <div className="flex gap-2">
                            {['A4', 'A3', 'SRA3'].map((f) => (
                                <button 
                                    key={f} 
                                    onClick={() => setFormat(f as any)} 
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${format === f ? 'bg-purple-600 text-white border-purple-600 shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Papel</label>
                            <select value={paperType} onChange={e => setPaperType(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="BOND">Bond 75g</option>
                                <option value="COUCHE_115">Couché 115g</option>
                                <option value="COUCHE_300">Couché 300g</option>
                                <option value="ADHESIVO">Adhesivo Papel</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cantidad</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold text-purple-700 outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Color</label>
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button onClick={() => setColorMode('COLOR')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${colorMode === 'COLOR' ? 'bg-white shadow text-purple-700' : 'text-gray-500'}`}>Color</button>
                                <button onClick={() => setColorMode('BW')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${colorMode === 'BW' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>B/N</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Caras</label>
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button onClick={() => setSides(1)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sides === 1 ? 'bg-white shadow text-purple-700' : 'text-gray-500'}`}>1 Lado</button>
                                <button onClick={() => setSides(2)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sides === 2 ? 'bg-white shadow text-purple-700' : 'text-gray-500'}`}>2 Lados</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-purple-700 to-indigo-800 rounded-2xl shadow-xl text-white p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                
                <div>
                    <h3 className="text-purple-200 font-bold uppercase tracking-wider text-sm mb-6">Cotización Estimada</h3>
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center border-b border-white/20 pb-2">
                            <span className="text-sm text-purple-100">Costo Unitario</span>
                            <span className="font-mono">{formatCurrency(calculation.unitPvp)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/20 pb-2">
                            <span className="text-sm text-purple-100">Cantidad</span>
                            <span className="font-mono">{quantity}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="text-xs uppercase font-bold text-purple-300 mb-1">Total a Cobrar</p>
                    <div className="text-5xl font-black tracking-tight flex items-baseline gap-2">
                        {formatCurrency(calculation.totalPvp)}
                        <span className="text-lg font-normal text-purple-300">+ IVA</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CALCULADORA PUBLICIDAD (GRAN FORMATO) ---
const AdvertisingCalculator: React.FC<{ costs: CostConfig }> = ({ costs }) => {
    const [material, setMaterial] = useState<'LONA' | 'VINIL'>('LONA');
    const [width, setWidth] = useState(1); // Metros
    const [height, setHeight] = useState(1); // Metros
    const [quantity, setQuantity] = useState(1);
    const [finishing, setFinishing] = useState<'NINGUNO' | 'OJALES' | 'ROLLUP'>('NINGUNO');

    const result = useMemo(() => {
        const area = width * height;
        const totalArea = area * quantity;
        
        let materialCostM2 = material === 'LONA' ? costs.COSTO_M2_LONA : costs.COSTO_M2_VINIL;
        const inkCost = costs.COSTO_TINTA_M2 * totalArea;
        const baseCost = (materialCostM2 * totalArea) + inkCost;
        
        let finishingCost = 0;
        if (finishing === 'ROLLUP') {
            finishingCost = costs.COSTO_ESTRUCTURA_ROLLUP * quantity;
        } else if (finishing === 'OJALES') {
            // Estimado ojales: cada 50cm
            const perimeter = (width + height) * 2;
            const ojalesCount = Math.ceil(perimeter / 0.5) * quantity;
            finishingCost = ojalesCount * 0.10; // $0.10 por ojal aprox
        }

        const productionCost = baseCost + finishingCost;
        const pvp = productionCost * (1 + costs.MARGEN_GANANCIA);

        return { totalArea, productionCost, pvp, unitPvp: pvp / quantity };
    }, [material, width, height, quantity, finishing, costs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-blue-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6 border-b border-blue-100 dark:border-gray-700 pb-4">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <PhotoIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gran Formato</h2>
                        <p className="text-xs text-gray-500">Gigantografías y Señalética</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Material</label>
                            <select value={material} onChange={e => setMaterial(e.target.value as any)} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none">
                                <option value="LONA">Lona Front</option>
                                <option value="VINIL">Vinil Adhesivo</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cantidad</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value)))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold outline-none" />
                        </div>
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Ancho (m)</label>
                            <input type="number" step="0.1" value={width} onChange={e => setWidth(parseFloat(e.target.value))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold outline-none" />
                        </div>
                        <span className="text-gray-400 mt-6">x</span>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Alto (m)</label>
                            <input type="number" step="0.1" value={height} onChange={e => setHeight(parseFloat(e.target.value))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Acabado</label>
                        <div className="flex gap-2">
                            {['NINGUNO', 'OJALES', 'ROLLUP'].map((f) => (
                                <button 
                                    key={f} 
                                    onClick={() => setFinishing(f as any)} 
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${finishing === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-blue-700 to-cyan-800 rounded-2xl shadow-xl text-white p-8 flex flex-col justify-between">
                <div>
                    <h3 className="text-blue-200 font-bold uppercase tracking-wider text-sm mb-6">Detalle</h3>
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center border-b border-white/20 pb-2">
                            <span className="text-sm text-blue-100">Área Total</span>
                            <span className="font-mono">{result.totalArea.toFixed(2)} m²</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/20 pb-2">
                            <span className="text-sm text-blue-100">Precio Unitario</span>
                            <span className="font-mono">{formatCurrency(result.unitPvp)}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <p className="text-xs uppercase font-bold text-blue-300 mb-1">Total a Cobrar</p>
                    <div className="text-5xl font-black tracking-tight flex items-baseline gap-2">
                        {formatCurrency(result.pvp)}
                        <span className="text-lg font-normal text-blue-300">+ IVA</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CALCULADORA SUBLIMACION ---
const SublimationCalculator: React.FC<{ costs: CostConfig }> = ({ costs }) => {
    const [productType, setProductType] = useState<'TAZA' | 'GORRA' | 'CAMISETA'>('TAZA');
    const [quantity, setQuantity] = useState(1);

    const result = useMemo(() => {
        let baseCost = 0;
        switch (productType) {
            case 'TAZA': baseCost = costs.COSTO_TAZA; break;
            case 'GORRA': baseCost = costs.COSTO_GORRA; break;
            case 'CAMISETA': baseCost = costs.COSTO_CAMISETA; break;
        }
        
        const productionCost = (baseCost + costs.COSTO_INSUMOS_SUB) * quantity;
        const pvp = productionCost * (1 + costs.MARGEN_GANANCIA);
        
        return { productionCost, pvp, unitPvp: pvp / quantity };
    }, [productType, quantity, costs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-orange-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6 border-b border-orange-100 dark:border-gray-700 pb-4">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                        <StarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sublimación</h2>
                        <p className="text-xs text-gray-500">Artículos Promocionales</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Producto</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['TAZA', 'GORRA', 'CAMISETA'].map((p) => (
                                <button 
                                    key={p} 
                                    onClick={() => setProductType(p as any)} 
                                    className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-2 ${productType === p ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                                >
                                    <BoxIcon className="w-5 h-5"/>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cantidad</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value)))} className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl shadow-xl text-white p-8 flex flex-col justify-between">
                <div>
                    <h3 className="text-orange-200 font-bold uppercase tracking-wider text-sm mb-6">Cotización</h3>
                    <div className="flex justify-between items-center border-b border-white/20 pb-2">
                        <span className="text-sm text-orange-100">Costo Unitario</span>
                        <span className="font-mono">{formatCurrency(result.unitPvp)}</span>
                    </div>
                </div>
                <div>
                    <p className="text-xs uppercase font-bold text-orange-300 mb-1">Total a Cobrar</p>
                    <div className="text-5xl font-black tracking-tight flex items-baseline gap-2">
                        {formatCurrency(result.pvp)}
                        <span className="text-lg font-normal text-orange-300">+ IVA</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MasterTableModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tabla Maestra de Papeles</h2>
                    <button onClick={onClose}><CloseIcon className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Código</th>
                                <th className="px-6 py-3">Nombre</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Formato</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SOURCE_PAPERS.map((paper) => (
                                <tr key={paper.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-mono font-medium text-gray-900 dark:text-white">{paper.id}</td>
                                    <td className="px-6 py-4">{paper.nombre}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${paper.tipo === 'RESMA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{paper.tipo}</span></td>
                                    <td className="px-6 py-4">{paper.ancho} x {paper.alto} cm</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
const CalculadoraPreciosPage: React.FC = () => {
    const [mode, setMode] = useState<Mode>('OFFSET');
    const [costs, setCosts] = useState<CostConfig>(DEFAULT_COSTS);
    const [showMasterTable, setShowMasterTable] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('imprenta_costos_config');
        if (saved) setCosts(JSON.parse(saved));
    }, []);

    const handleSaveConfig = (newCosts: CostConfig) => {
        setCosts(newCosts);
        localStorage.setItem('imprenta_costos_config', JSON.stringify(newCosts));
        setMode('OFFSET');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-4 sm:p-8 font-sans pb-24">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            <span className="bg-brand-blue text-white p-2 rounded-xl"><CalculatorIcon className="w-8 h-8"/></span>
                            Cotizador Maestro
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-14">Calculadora de producción gráfica profesional</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button onClick={() => setShowMasterTable(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                            <TableIcon className="w-4 h-4"/> Tabla Papeles
                        </button>
                        <button 
                            onClick={() => setMode(mode === 'CONFIG' ? 'OFFSET' : 'CONFIG')} 
                            className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg transition-all shadow-sm border ${mode === 'CONFIG' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'}`}
                        >
                            <Cog8ToothIcon className={`w-4 h-4 ${mode === 'CONFIG' ? 'animate-spin-slow' : ''}`}/> Configuración
                        </button>
                    </div>
                </div>

                {/* Mode Selector (Tabs) */}
                {mode !== 'CONFIG' && (
                    <div className="flex overflow-x-auto p-1 bg-gray-200 dark:bg-gray-800 rounded-xl mb-8 max-w-2xl gap-1">
                        <button onClick={() => setMode('OFFSET')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'OFFSET' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <PrinterIcon className="w-4 h-4"/> Offset
                        </button>
                        <button onClick={() => setMode('DIGITAL')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'DIGITAL' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <Sparkles className="w-4 h-4"/> Digital
                        </button>
                        <button onClick={() => setMode('PUBLICIDAD')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'PUBLICIDAD' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <PhotoIcon className="w-4 h-4"/> Publicidad
                        </button>
                        <button onClick={() => setMode('SUBLIMACION')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${mode === 'SUBLIMACION' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <StarIcon className="w-4 h-4"/> Sublimación
                        </button>
                    </div>
                )}

                {/* Content Area */}
                {mode === 'OFFSET' && <OffsetCalculator costs={costs} />}
                
                {mode === 'DIGITAL' && <DigitalCalculator costs={costs} />}

                {mode === 'PUBLICIDAD' && <AdvertisingCalculator costs={costs} />}

                {mode === 'SUBLIMACION' && <SublimationCalculator costs={costs} />}

                {/* Configuration Panel */}
                {mode === 'CONFIG' && (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-4xl mx-auto animate-fade-in">
                        <div className="flex items-center gap-3 mb-8 border-b pb-4 dark:border-gray-700">
                            <div className="bg-green-100 p-2 rounded-full"><DollarIcon className="w-6 h-6 text-green-600"/></div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Base de Costos</h2>
                                <p className="text-xs text-gray-500">Ajusta los precios de materia prima y producción.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(costs).map(([key, val]) => (
                                <div key={key} className="group">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider group-focus-within:text-brand-blue transition-colors">
                                        {key.replace(/_/g, ' ')}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={val} 
                                            onChange={e => setCosts({...costs, [key]: parseFloat(e.target.value) || 0})}
                                            className="w-full pl-7 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-mono font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-brand-blue outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button onClick={() => handleSaveConfig(costs)} className="flex items-center gap-2 bg-brand-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:-translate-y-1">
                                <SaveIcon className="w-5 h-5"/> Guardar Cambios
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showMasterTable && <MasterTableModal onClose={() => setShowMasterTable(false)} />}
        </div>
    );
};

export default CalculadoraPreciosPage;
