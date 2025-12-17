
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, CheckCircleIcon, CloseIcon, InfoIcon, FileText, Sparkles, RulerIcon, Cog8ToothIcon, ShieldCheckIcon, MonitorIcon, TableIcon, DollarIcon, SaveIcon, PrinterIcon, WrenchScrewdriverIcon, ExclamationTriangleIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

// --- TIPOS Y ESTADOS ---

type Mode = 'OFFSET' | 'DIGITAL' | 'CONFIG'; // Simplificado para enfoque Offset vs Digital

// --- 1. CONFIGURACIÓN BASE (MANUAL) ---
interface CostConfig {
    // Papeles (Costo por unidad de pliego)
    PLIEGO_QUIMICO: number; 
    PLIEGO_BOND: number;    
    PLIEGO_COUCHE: number;  
    PLIEGO_ADHESIVO: number;
    PLIEGO_CARTULINA: number;
    
    // Insumos Offset
    PLACA_CTP: number; // Costo por unidad (chapa)
    ARRANQUE_MAQUINA: number; // Costo fijo por puesta a punto
    IMPRESION_MILLAR_OFFSET: number; // Costo variable por millar
    
    // Insumos Digital
    IMPRESION_DIGITAL_A3: number; // Click color
    IMPRESION_DIGITAL_BN: number;
    
    // Acabados
    NUMERACION_MILLAR: number;
    ENCOLADO_BLOCK: number;
    CORTE_REFILE: number;
    
    // Factores
    FACTOR_RIESGO: number; // 0.05 = 5%
    MARGEN_GANANCIA: number; // 0.40 = 40%
}

const DEFAULT_COSTS: CostConfig = {
    PLIEGO_QUIMICO: 0.15,
    PLIEGO_BOND: 0.12,
    PLIEGO_COUCHE: 0.40,
    PLIEGO_ADHESIVO: 0.80,
    PLIEGO_CARTULINA: 0.50,
    PLACA_CTP: 6.00, // Precio por chapa individual
    ARRANQUE_MAQUINA: 15.00,
    IMPRESION_MILLAR_OFFSET: 5.00, // Adicional después del arranque
    IMPRESION_DIGITAL_A3: 0.40,
    IMPRESION_DIGITAL_BN: 0.10,
    NUMERACION_MILLAR: 5.00,
    ENCOLADO_BLOCK: 0.25,
    CORTE_REFILE: 2.00,
    FACTOR_RIESGO: 0.10, // 10% merma/riesgo
    MARGEN_GANANCIA: 0.50 // 50% margen
};

// --- 2. BASE DE DATOS PAPELES ---
interface PaperType {
    id: string;
    nombre: string;
    gramajes: string;
    usos: string;
    width: number;
    height: number;
}

const PAPERS_DB: PaperType[] = [
    { id: 'BOND_STD', nombre: 'Bond Estándar', gramajes: '75g', usos: 'Hojas, Libros', width: 61, height: 86 },
    { id: 'QUIMICO', nombre: 'Químico (Autocopiativo)', gramajes: '55g', usos: 'Facturas', width: 61, height: 86 },
    { id: 'COUCHE_STD', nombre: 'Couché Estándar', gramajes: '115g, 150g', usos: 'Volantes', width: 70, height: 100 },
    { id: 'CARTULINA', nombre: 'Cartulina', gramajes: '200g+', usos: 'Tarjetas', width: 70, height: 100 },
    { id: 'ADHESIVO', nombre: 'Adhesivo', gramajes: '80g', usos: 'Etiquetas', width: 70, height: 100 },
];

// --- COMPONENTE VISUALIZADOR DE PLIEGO MEJORADO ---
const PliegoVisualizer: React.FC<{
    sheetW: number;
    sheetH: number;
    cutW: number;
    cutH: number;
    cuts: number;
    rotated: boolean;
    margin: number; // Pinza
}> = ({ sheetW, sheetH, cutW, cutH, cuts, rotated, margin }) => {
    // Escala para dibujar en pantalla (px por cm)
    const scale = 4; 
    
    // Dimensiones visuales
    const svgW = sheetW * scale;
    const svgH = sheetH * scale;

    // Área imprimible (restar pinza)
    const printableY = margin * scale;

    // Calcular grid
    const effCutW = rotated ? cutH : cutW;
    const effCutH = rotated ? cutW : cutH;
    
    // Recalcular lógica visual exacta
    const cols = Math.floor(sheetW / effCutW);
    const rows = Math.floor((sheetH - margin) / effCutH);
    
    const items = [];
    let count = 0;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (count >= cuts) break;
            const x = c * effCutW * scale;
            const y = printableY + (r * effCutH * scale);
            
            items.push(
                <g key={`${r}-${c}`}>
                    <rect
                        x={x}
                        y={y}
                        width={effCutW * scale}
                        height={effCutH * scale}
                        fill="#dbeafe" // blue-100
                        stroke="#2563eb" // blue-600
                        strokeWidth="1"
                        className="transition-all duration-300 hover:fill-blue-200"
                    />
                    {/* Solo mostrar medidas en el primero para no saturar */}
                    {r === 0 && c === 0 && (
                        <text x={x + 5} y={y + 15} fontSize="10" fill="#1e40af" fontWeight="bold">
                            {effCutW}x{effCutH}
                        </text>
                    )}
                    <text x={x + (effCutW*scale)/2} y={y + (effCutH*scale)/2} fontSize="12" fill="#2563eb" textAnchor="middle" dy=".3em" opacity="0.5">
                        {count + 1}
                    </text>
                </g>
            );
            count++;
        }
    }

    const usedAreaCm = cuts * (cutW * cutH);
    const totalAreaCm = sheetW * sheetH;
    const efficiency = (usedAreaCm / totalAreaCm) * 100;

    return (
        <div className="flex flex-col items-center select-none">
            <div className="bg-gray-800 text-white text-[10px] px-2 py-1 rounded mb-2 font-mono">
                PLIEGO: {sheetW}cm x {sheetH}cm
            </div>
            
            <div className="relative bg-gray-200 shadow-xl border-4 border-white overflow-hidden transition-all duration-500 ease-in-out" style={{ width: svgW + 8, height: svgH + 8 }}>
                <svg width={svgW} height={svgH} className="bg-gray-300 block m-[2px]">
                    {/* Fondo Merma */}
                    <rect x="0" y="0" width="100%" height="100%" fill="#e5e7eb" />
                    
                    {/* Zona de Pinza (Gripper) */}
                    <rect x="0" y="0" width="100%" height={margin * scale} fill="url(#diagonalHatch)" stroke="none" />
                    <defs>
                        <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="0" y2="10" style={{stroke:'#fca5a5', strokeWidth:2}} />
                        </pattern>
                    </defs>
                    <text x="5" y={(margin * scale) - 5} fontSize="10" fill="#991b1b" fontWeight="bold" letterSpacing="1">
                        ZONA PINZA ({margin}cm) - NO IMPRIMIBLE
                    </text>

                    {/* Cortes */}
                    {items}
                </svg>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 w-full text-sm">
                <div className="bg-blue-50 p-2 rounded border border-blue-200 text-center">
                    <span className="block text-xs text-blue-500 font-bold uppercase">Bajadas (Cortes)</span>
                    <span className="text-xl font-black text-blue-700">{cuts} u.</span>
                </div>
                <div className="bg-gray-50 p-2 rounded border border-gray-200 text-center">
                    <span className="block text-xs text-gray-500 font-bold uppercase">Eficiencia Papel</span>
                    <span className={`text-xl font-black ${efficiency > 80 ? 'text-green-600' : efficiency > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {efficiency.toFixed(1)}%
                    </span>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE TABLA MAESTRA ---
const MasterTableModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TableIcon className="w-6 h-6 text-brand-blue" />
                        Tabla Maestra de Papeles
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Papel / Material</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gramajes</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Formato Pliego</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usos Recomendados</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            {PAPERS_DB.map((paper) => (
                                <tr key={paper.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                    <td className="px-6 py-4 font-bold text-brand-blue">{paper.nombre}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{paper.gramajes}</td>
                                    <td className="px-6 py-4 font-mono text-gray-800 dark:text-gray-200">{paper.width} x {paper.height} cm</td>
                                    <td className="px-6 py-4 text-gray-500 italic">{paper.usos}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- CALCULADORA OFFSET ---
const OffsetCalculator: React.FC<{ costs: CostConfig }> = ({ costs }) => {
    // Inputs
    const [paperId, setPaperId] = useState('COUCHE_STD');
    const [finalW, setFinalW] = useState(10);
    const [finalH, setFinalH] = useState(15);
    const [quantity, setQuantity] = useState(1000);
    const [colorsFront, setColorsFront] = useState(4); // CMYK
    const [colorsBack, setColorsBack] = useState(0); // 0 = 1 lado
    const [parts, setParts] = useState(1); // Juegos (solo quimico)
    const [finishing, setFinishing] = useState({ numerado: false, encolado: false, perforado: false });
    
    // Calculations
    const result = useMemo(() => {
        const paper = PAPERS_DB.find(p => p.id === paperId) || PAPERS_DB[0];
        
        // 1. Cálculo de Cortes (Best Fit)
        const margin = 1.5; // Pinza
        const printableH = paper.height - margin;
        
        // Opción A: Normal
        const colsA = Math.floor(paper.width / finalW);
        const rowsA = Math.floor(printableH / finalH);
        const cutsA = colsA * rowsA;

        // Opción B: Rotado
        const colsB = Math.floor(paper.width / finalH);
        const rowsB = Math.floor(printableH / finalW);
        const cutsB = colsB * rowsB;

        const bestCuts = Math.max(cutsA, cutsB);
        const isRotated = cutsB > cutsA;
        
        if (bestCuts === 0) return null;

        // 2. Cálculo de Papel Requerido
        const totalUnidades = quantity * parts; // Si son facturas, son juegos
        const pliegosNetos = totalUnidades / bestCuts;
        const merma = Math.ceil(pliegosNetos * costs.FACTOR_RIESGO) + 10; // Merma base + 10 hojas arranque
        const pliegosTotales = Math.ceil(pliegosNetos + merma);
        
        let precioPliego = 0;
        switch(paper.id) {
            case 'QUIMICO': precioPliego = costs.PLIEGO_QUIMICO; break;
            case 'BOND_STD': precioPliego = costs.PLIEGO_BOND; break;
            case 'COUCHE_STD': precioPliego = costs.PLIEGO_COUCHE; break;
            case 'ADHESIVO': precioPliego = costs.PLIEGO_ADHESIVO; break;
            case 'CARTULINA': precioPliego = costs.PLIEGO_CARTULINA; break;
        }
        const costoPapel = pliegosTotales * precioPliego;

        // 3. Cálculo de Impresión (Offset)
        const numPlacas = colorsFront + colorsBack;
        const costoPlacas = numPlacas * costs.PLACA_CTP;
        
        const millaresReales = Math.ceil(quantity / 1000);
        
        const tirosTotales = millaresReales * (colorsFront + colorsBack);
        const costoImpresion = costs.ARRANQUE_MAQUINA + (tirosTotales * costs.IMPRESION_MILLAR_OFFSET);

        // 4. Acabados
        let costoAcabados = costs.CORTE_REFILE;
        if (finishing.numerado) costoAcabados += (millaresReales * costs.NUMERACION_MILLAR);
        if (finishing.encolado) costoAcabados += ((quantity / 100) * costs.ENCOLADO_BLOCK); // Asumiendo blocks de 100
        
        // 5. Totales
        const costoProduccion = costoPapel + costoPlacas + costoImpresion + costoAcabados;
        const utilidad = costoProduccion * (costs.MARGEN_GANANCIA / (1 - costs.MARGEN_GANANCIA));
        const pvp = costoProduccion + utilidad;

        return {
            paper,
            bestCuts,
            isRotated,
            pliegosTotales,
            costoPapel,
            costoPlacas,
            costoImpresion,
            costoAcabados,
            costoProduccion,
            pvp,
            unitario: pvp / quantity
        };

    }, [paperId, finalW, finalH, quantity, colorsFront, colorsBack, parts, finishing, costs]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Panel */}
            <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="bg-brand-blue/10 p-2 rounded-lg text-brand-blue">
                        <PrinterIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Especificaciones Offset</h2>
                        <p className="text-xs text-gray-500">Configura tu trabajo de imprenta</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Material */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">1. Material</label>
                        <select value={paperId} onChange={e => setPaperId(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-blue outline-none transition-all">
                            {PAPERS_DB.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.width}x{p.height})</option>)}
                        </select>
                    </div>

                    {/* Tamaño y Cantidad */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">2. Tamaño Final (cm)</label>
                            <div className="flex items-center gap-2">
                                <input type="number" value={finalW} onChange={e => setFinalW(parseFloat(e.target.value))} className="w-full p-2 text-center border rounded-lg dark:bg-gray-700 font-mono" placeholder="Ancho" />
                                <span className="text-gray-400">x</span>
                                <input type="number" value={finalH} onChange={e => setFinalH(parseFloat(e.target.value))} className="w-full p-2 text-center border rounded-lg dark:bg-gray-700 font-mono" placeholder="Alto" />
                            </div>
                            <div className="flex gap-1 mt-2 justify-center">
                                <button onClick={() => {setFinalW(21); setFinalH(29.7)}} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200">A4</button>
                                <button onClick={() => {setFinalW(14.8); setFinalH(21)}} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200">A5</button>
                                <button onClick={() => {setFinalW(10.5); setFinalH(14.8)}} className="text-[10px] px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200">A6</button>
                            </div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">3. Cantidad</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 font-bold text-brand-blue" />
                            {paperId === 'QUIMICO' && (
                                <div className="mt-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Partes (Copias)</label>
                                    <select value={parts} onChange={e => setParts(parseInt(e.target.value))} className="w-full p-1 text-sm border rounded">
                                        <option value={1}>Solo Original</option>
                                        <option value={2}>Original + 1 Copia</option>
                                        <option value={3}>Original + 2 Copias</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Colores */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-3">4. Impresión (Tintas)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-gray-500 block mb-1">Frente</span>
                                <select value={colorsFront} onChange={e => setColorsFront(parseInt(e.target.value))} className="w-full p-2 rounded border text-sm">
                                    <option value={1}>1 Color (Negro/Spot)</option>
                                    <option value={2}>2 Colores</option>
                                    <option value={4}>Full Color (CMYK)</option>
                                </select>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block mb-1">Reverso</span>
                                <select value={colorsBack} onChange={e => setColorsBack(parseInt(e.target.value))} className="w-full p-2 rounded border text-sm">
                                    <option value={0}>Sin impresión (Blanco)</option>
                                    <option value={1}>1 Color</option>
                                    <option value={4}>Full Color</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Acabados */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">5. Acabados</label>
                        <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none px-3 py-1.5 border rounded-full hover:bg-gray-50 transition-colors">
                                <input type="checkbox" checked={finishing.numerado} onChange={e => setFinishing({...finishing, numerado: e.target.checked})} className="rounded text-brand-blue" />
                                Numeración
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none px-3 py-1.5 border rounded-full hover:bg-gray-50 transition-colors">
                                <input type="checkbox" checked={finishing.encolado} onChange={e => setFinishing({...finishing, encolado: e.target.checked})} className="rounded text-brand-blue" />
                                Encolado (Block)
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none px-3 py-1.5 border rounded-full hover:bg-gray-50 transition-colors">
                                <input type="checkbox" checked={finishing.perforado} onChange={e => setFinishing({...finishing, perforado: e.target.checked})} className="rounded text-brand-blue" />
                                Perforado
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-7 space-y-6">
                {result ? (
                    <>
                        {/* Visualizer */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 w-full border-b pb-2">Distribución en Pliego</h3>
                            <PliegoVisualizer 
                                sheetW={result.paper.width}
                                sheetH={result.paper.height}
                                cutW={finalW}
                                cutH={finalH}
                                cuts={result.bestCuts}
                                rotated={result.isRotated}
                                margin={1.5}
                            />
                        </div>

                        {/* Cost Breakdown */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Costo Total Producción</p>
                                    <h2 className="text-3xl font-black text-white">{formatCurrency(result.costoProduccion)}</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Precio Venta Sugerido</p>
                                    <h2 className="text-4xl font-black text-green-400">{formatCurrency(result.pvp)}</h2>
                                    <p className="text-xs text-gray-400 mt-1 font-mono">Unitario: {formatCurrency(result.unitario)}</p>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                                    <span className="text-gray-500">Papel ({result.pliegosTotales} pliegos)</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(result.costoPapel)}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                                    <span className="text-gray-500">Placas CTP</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(result.costoPlacas)}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                                    <span className="text-gray-500">Impresión Offset</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(result.costoImpresion)}</span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-gray-200 pb-1">
                                    <span className="text-gray-500">Acabados</span>
                                    <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(result.costoAcabados)}</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300">
                        <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">El tamaño de corte es mayor al pliego.</p>
                        <p className="text-sm text-gray-400">Verifica las medidas ingresadas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- CALCULADORA DIGITAL (NUEVA IMPLEMENTACIÓN) ---
const DigitalCalculator: React.FC<{ costs: CostConfig }> = ({ costs }) => {
    // Inputs
    const [format, setFormat] = useState<'A4' | 'A3' | 'SRA3'>('A3');
    const [paperType, setPaperType] = useState('COUCHE_150');
    const [colorMode, setColorMode] = useState<'COLOR' | 'BW'>('COLOR');
    const [sides, setSides] = useState<1 | 2>(1);
    const [quantity, setQuantity] = useState(10);

    const calculation = useMemo(() => {
        // Factors
        let clickCost = colorMode === 'COLOR' ? costs.IMPRESION_DIGITAL_A3 : costs.IMPRESION_DIGITAL_BN;
        
        // A4 is roughly half the cost of A3 in terms of master clicks, typically charged as A3/2 or separate counter
        // Simplifying logic based on print shop standards (A3 click is master)
        if (format === 'A4') clickCost = clickCost * 0.6; // Slightly more than half due to handling
        
        // Paper Cost Factors (Relative to config baselines)
        let sheetCost = 0;
        switch (paperType) {
            case 'BOND': sheetCost = costs.PLIEGO_BOND / 4; break; // A3 is ~1/4 of pliego 61x86 roughly
            case 'COUCHE_115': sheetCost = costs.PLIEGO_COUCHE / 4; break;
            case 'COUCHE_300': sheetCost = (costs.PLIEGO_COUCHE * 1.5) / 4; break;
            case 'ADHESIVO': sheetCost = costs.PLIEGO_ADHESIVO / 4; break;
            default: sheetCost = 0.10;
        }

        // Calculation
        const totalClicks = quantity * sides;
        const totalPaper = quantity; // 1 sheet per unit regardless of sides
        
        const productionCost = (totalClicks * clickCost) + (totalPaper * sheetCost);
        const margin = costs.MARGEN_GANANCIA; // e.g., 0.5
        const pvp = productionCost * (1 + margin);
        
        return {
            unitCost: productionCost / quantity,
            totalCost: productionCost,
            unitPvp: pvp / quantity,
            totalPvp: pvp
        };
    }, [format, paperType, colorMode, sides, quantity, costs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            {/* Controls */}
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

            {/* Results */}
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
                        <div className="flex justify-between items-center text-xs text-purple-300 italic pt-2">
                            <span>* Incluye papel y corte básico</span>
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
                    <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl mb-8 max-w-md">
                        <button onClick={() => setMode('OFFSET')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'OFFSET' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <PrinterIcon className="w-4 h-4"/> Offset / Imprenta
                        </button>
                        <button onClick={() => setMode('DIGITAL')} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'DIGITAL' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <Sparkles className="w-4 h-4"/> Digital / Rápido
                        </button>
                    </div>
                )}

                {/* Content Area */}
                {mode === 'OFFSET' && <OffsetCalculator costs={costs} />}
                
                {mode === 'DIGITAL' && <DigitalCalculator costs={costs} />}

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
