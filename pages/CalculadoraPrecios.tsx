import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, CheckCircleIcon, CloseIcon, InfoIcon, ArrowLeftIcon, FileText, Sparkles, RulerIcon, Cog8ToothIcon, ShieldCheckIcon, MonitorIcon, TableIcon, ExclamationTriangleIcon, BookIcon, DollarIcon, ShoppingCartIcon, SaveIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

// --- TIPOS Y ESTADOS ---

type Mode = 'SMART' | 'MANUAL' | 'CONFIG';
type SmartCategory = 'FACTURACION' | 'PUBLICIDAD' | 'DIGITAL' | 'EDITORIAL';

// --- 1. CONFIGURACIÓN BASE (MANUAL) ---
interface CostConfig {
    // Papeles
    PLIEGO_QUIMICO: number; // 61x86
    PLIEGO_BOND: number;    // 61x86
    PLIEGO_COUCHE: number;  // 70x100
    PLIEGO_ADHESIVO: number;
    PLIEGO_CARTULINA: number;
    
    // Insumos Offset
    PLACA_CTP: number; // Juego x4
    IMPRESION_MILLAR_OFFSET: number;
    
    // Insumos Digital
    IMPRESION_DIGITAL_A3: number; // Click color
    IMPRESION_DIGITAL_BN: number;
    
    // Acabados
    NUMERACION_MILLAR: number;
    ENCOLADO_BLOCK: number;
    ACABADOS_BASICOS: number;
    
    // Factores
    FACTOR_RIESGO: number; // 0.05 = 5%
    MARGEN_GANANCIA: number; // 0.40 = 40%
}

const DEFAULT_COSTS: CostConfig = {
    PLIEGO_QUIMICO: 0.12,
    PLIEGO_BOND: 0.08,
    PLIEGO_COUCHE: 0.35,
    PLIEGO_ADHESIVO: 0.60,
    PLIEGO_CARTULINA: 0.45,
    PLACA_CTP: 22.00,
    IMPRESION_MILLAR_OFFSET: 15.00,
    IMPRESION_DIGITAL_A3: 0.40,
    IMPRESION_DIGITAL_BN: 0.10,
    NUMERACION_MILLAR: 5.00,
    ENCOLADO_BLOCK: 0.20,
    ACABADOS_BASICOS: 2.00,
    FACTOR_RIESGO: 0.05,
    MARGEN_GANANCIA: 0.40
};

// --- 2. BASE DE DATOS PAPELES ---
interface PaperType {
    id: string;
    nombre: string;
    gramajes: string;
    usos: string;
    tamanosPliego: { width: number; height: number; nombre: string }[];
}

const PAPERS_DB: PaperType[] = [
    {
        id: 'QUIMICO',
        nombre: 'Papel Químico (Autocopiativo)',
        gramajes: '50-55g',
        usos: 'Facturas, Notas de Venta, Roles',
        tamanosPliego: [{ width: 61, height: 86, nombre: 'Estándar (61x86)' }]
    },
    {
        id: 'BOND',
        nombre: 'Papel Bond',
        gramajes: '75g, 90g',
        usos: 'Hojas Membretadas, Libros, Volantes simples',
        tamanosPliego: [{ width: 61, height: 86, nombre: 'Estándar (61x86)' }, { width: 70, height: 100, nombre: 'Grande (70x100)' }]
    },
    {
        id: 'COUCHE',
        nombre: 'Couché (Brillante/Mate)',
        gramajes: '115g, 150g, 200g, 300g',
        usos: 'Volantes, Trípticos, Revistas, Tarjetas',
        tamanosPliego: [{ width: 70, height: 100, nombre: 'Estándar (70x100)' }, { width: 61, height: 86, nombre: 'Pequeño (61x86)' }]
    },
    {
        id: 'ADHESIVO',
        nombre: 'Papel Adhesivo',
        gramajes: '80g',
        usos: 'Etiquetas, Stickers',
        tamanosPliego: [{ width: 70, height: 100, nombre: 'Estándar (70x100)' }]
    },
    {
        id: 'CARTULINA',
        nombre: 'Cartulina (Bristol/Opalina)',
        gramajes: '180g, 220g',
        usos: 'Tarjetas, Diplomas, Carpetas',
        tamanosPliego: [{ width: 50, height: 70, nombre: 'Medio (50x70)' }, { width: 70, height: 100, nombre: 'Entero (70x100)' }]
    }
];

// --- COMPONENTE VISUALIZADOR DE PLIEGO ---
const PliegoVisualizer: React.FC<{
    sheetW: number;
    sheetH: number;
    cutW: number;
    cutH: number;
    cuts: number;
    rotated: boolean;
    margin: number;
}> = ({ sheetW, sheetH, cutW, cutH, cuts, rotated, margin }) => {
    const printableW = sheetW;
    const printableH = sheetH - margin; 

    const effCutW = rotated ? cutH : cutW;
    const effCutH = rotated ? cutW : cutH;

    const cols = Math.floor(sheetW / effCutW);
    const rows = Math.floor(printableH / effCutH);
    
    const scale = 3; 
    const svgW = sheetW * scale;
    const svgH = sheetH * scale;

    const items = [];
    let count = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (count >= cuts) break;
            items.push(
                <rect
                    key={`${r}-${c}`}
                    x={c * effCutW * scale}
                    y={(r * effCutH * scale) + (margin * scale)} 
                    width={effCutW * scale}
                    height={effCutH * scale}
                    fill="#3b82f6"
                    fillOpacity="0.2"
                    stroke="#2563eb"
                    strokeWidth="1"
                />
            );
            if (r===0 && c===0) {
                 items.push(
                    <text key="label" x={(c * effCutW * scale) + 5} y={(r * effCutH * scale) + (margin * scale) + 15} fontSize="10" fill="#1e40af">
                        {effCutW}x{effCutH}
                    </text>
                 )
            }
            count++;
        }
    }

    const usedArea = cuts * (cutW * cutH);
    const totalArea = sheetW * sheetH;
    const efficiency = (usedArea / totalArea) * 100;

    return (
        <div className="flex flex-col items-center">
            <div className="relative border-2 border-gray-800 bg-white shadow-lg mb-2" style={{ width: svgW, height: svgH }}>
                <svg width="100%" height="100%">
                    <rect x="0" y="0" width="100%" height={margin * scale} fill="#fee2e2" />
                    <text x="5" y={(margin * scale) - 2} fontSize="10" fill="#991b1b">Pinza {margin}cm</text>
                    {items}
                </svg>
                <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-[10px] text-gray-500 -rotate-90 origin-left font-mono">
                    {sheetH}cm
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4 text-[10px] text-gray-500 font-mono">
                    {sheetW}cm
                </div>
            </div>
            
            <div className="flex gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-200 border border-blue-500"></div>
                    <span>Uso ({efficiency.toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white border border-gray-300"></div>
                    <span>Merma ({(100 - efficiency).toFixed(0)}%)</span>
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
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Papel / Material</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gramajes Comunes</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usos Frecuentes</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Formatos de Pliego</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                {PAPERS_DB.map((paper) => (
                                    <tr key={paper.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{paper.nombre}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{paper.gramajes}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{paper.usos}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {paper.tamanosPliego.map((size, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                                        {size.nombre}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                        Cerrar Tabla
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SMART CALCULATOR LOGIC ---
const SmartCalculator: React.FC<{ costs: CostConfig }> = ({ costs }) => {
    const [category, setCategory] = useState<SmartCategory>('FACTURACION');
    
    // Estados Facturación
    const [factBlocks, setFactBlocks] = useState(10);
    const [factSize, setFactSize] = useState('1/4 OFICIO'); // Carta, A5, 1/4
    const [factCopies, setFactCopies] = useState(1); // 1 copia (original + 1)

    // Estados Publicidad
    const [pubQty, setPubQty] = useState(1000);
    const [pubSize, setPubSize] = useState('A6'); // A4, A5, A6
    const [pubSides, setPubSides] = useState(1);

    // Estados Digital
    const [digQty, setDigQty] = useState(50);
    const [digSize, setDigSize] = useState('A4');
    const [digType, setDigType] = useState('COLOR');

    const result = useMemo(() => {
        let papelTotal = 0;
        let costoPapel = 0;
        let costoPrep = 0;
        let costoImp = 0;
        let costoAcab = 0;
        let detalle = '';
        let pliegoInfo = '';

        if (category === 'FACTURACION') {
            // Lógica Facturación (Bond/Químico 61x86)
            // Juegos: 100 hojas por block. Si es Orig+1 copia = 50 juegos por block.
            const juegosPorBlock = 50; // Standard
            const totalJuegos = factBlocks * juegosPorBlock;
            
            // Bajadas por pliego 61x86
            let bajadas = 36; // 1/4 Oficio
            if (factSize === 'MEDIO OFICIO' || factSize === 'A5') bajadas = 18;
            if (factSize === 'CARTA' || factSize === 'A4') bajadas = 9;

            // Papel Original (CB) + Copias (CFB/CF)
            const hojasOriginal = totalJuegos;
            const hojasCopia = totalJuegos * factCopies;
            
            const pliegosOriginal = Math.ceil((hojasOriginal / bajadas) * 1.10); // 10% merma
            const pliegosCopia = Math.ceil((hojasCopia / bajadas) * 1.10);
            
            papelTotal = pliegosOriginal + pliegosCopia;
            costoPapel = papelTotal * costs.PLIEGO_QUIMICO;

            // Impresión: Se cobra millar offset aunque sea menos (mínimo) o digital si es muy poco
            // Para facturación numerada, suele ser offset por la numeración
            const millares = Math.max(1, Math.ceil((totalJuegos * (1 + factCopies)) / 1000));
            costoImp = millares * costs.IMPRESION_MILLAR_OFFSET; // 1 color generalmente
            costoPrep = costs.PLACA_CTP; // 1 placa si es 1 color

            // Acabados
            costoAcab = (factBlocks * costs.ENCOLADO_BLOCK) + (millares * costs.NUMERACION_MILLAR);

            detalle = `${factBlocks} Blocks de ${factSize} (50 juegos c/u). Orig + ${factCopies} Copia.`;
            pliegoInfo = `Pliego 61x86cm: Salen ${bajadas} unds. Consumo: ${papelTotal} pliegos.`;

        } else if (category === 'PUBLICIDAD') {
            // Lógica Publicidad (Couché 70x100)
            let bajadas = 40; // A6
            if (pubSize === 'A5') bajadas = 20;
            if (pubSize === 'A4') bajadas = 10;

            const pliegosNetos = Math.ceil(pubQty / bajadas);
            const pliegosReales = Math.ceil(pliegosNetos * 1.10); // 10% merma
            
            costoPapel = pliegosReales * costs.PLIEGO_COUCHE;
            
            // Offset vs Digital Logic
            if (pubQty < 500) {
                // Digital Logic shortcut
                costoPrep = 0;
                // Asumimos que en digital A3 caben varios
                const cabenEnA3 = Math.floor(bajadas / 4); // Approx conversion 70x100 to A3
                const clicks = Math.ceil(pubQty / (cabenEnA3 || 1)) * pubSides;
                costoImp = clicks * costs.IMPRESION_DIGITAL_A3;
            } else {
                // Offset Logic
                costoPrep = costs.PLACA_CTP * pubSides * 4; // CMYK * Lados
                const millares = Math.ceil(pubQty / 1000);
                costoImp = millares * costs.IMPRESION_MILLAR_OFFSET * pubSides * 4; // Full color
            }
            
            costoAcab = costs.ACABADOS_BASICOS; // Corte
            detalle = `${pubQty} Volantes ${pubSize} en Couché. ${pubSides === 1 ? '1 Lado' : '2 Lados'}.`;
            pliegoInfo = `Pliego 70x100cm: Salen ${bajadas} unds. Consumo: ${pliegosReales} pliegos.`;

        } else if (category === 'DIGITAL') {
            // Lógica Digital Simple
            costoPrep = 2.00; // Diseño básico / Bajada archivo
            const precioClick = digType === 'COLOR' ? costs.IMPRESION_DIGITAL_A3 : costs.IMPRESION_DIGITAL_BN;
            costoImp = digQty * precioClick;
            costoPapel = digQty * (digType === 'COLOR' ? 0.10 : 0.05); // Papel extra cortado
            detalle = `${digQty} Impresiones Digitales ${digSize} - ${digType}`;
            pliegoInfo = 'Impresión bajo demanda (Láser).';
        }

        const subtotal = costoPapel + costoPrep + costoImp + costoAcab;
        const seguro = subtotal * costs.FACTOR_RIESGO;
        const costoTotal = subtotal + seguro;
        const utilidadEsperada = costoTotal * (costs.MARGEN_GANANCIA / (1 - costs.MARGEN_GANANCIA)); // Markup logic
        const precioVenta = costoTotal + utilidadEsperada;

        return {
            detalle,
            pliegoInfo,
            costos: {
                materiaPrima: costoPapel,
                prePrensa: costoPrep,
                impresion: costoImp,
                acabados: costoAcab,
                subtotal: subtotal,
                seguro: seguro,
                total: costoTotal
            },
            venta: {
                total: precioVenta,
                unitario: precioVenta / (category === 'FACTURACION' ? factBlocks : (category === 'DIGITAL' ? digQty : pubQty))
            }
        };

    }, [category, costs, factBlocks, factSize, factCopies, pubQty, pubSize, pubSides, digQty, digSize, digType]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Left Column: Menu & Inputs */}
            <div className="lg:col-span-5 space-y-6">
                
                {/* Menu */}
                <div className="grid grid-cols-3 gap-2">
                    <button 
                        onClick={() => setCategory('FACTURACION')}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${category === 'FACTURACION' ? 'border-brand-blue bg-blue-50 dark:bg-blue-900/30 text-brand-blue' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:border-blue-300'}`}
                    >
                        <FileText className="w-6 h-6"/>
                        <span className="text-[10px] font-bold uppercase">Facturación</span>
                    </button>
                    <button 
                        onClick={() => setCategory('PUBLICIDAD')}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${category === 'PUBLICIDAD' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-600' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:border-orange-300'}`}
                    >
                        <MonitorIcon className="w-6 h-6"/>
                        <span className="text-[10px] font-bold uppercase">Publicidad</span>
                    </button>
                    <button 
                        onClick={() => setCategory('DIGITAL')}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${category === 'DIGITAL' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-600' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:border-purple-300'}`}
                    >
                        <Sparkles className="w-6 h-6"/>
                        <span className="text-[10px] font-bold uppercase">Digital</span>
                    </button>
                </div>

                {/* Form based on Category */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Parámetros</h3>
                    
                    {category === 'FACTURACION' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Cantidad (Blocks)</label>
                                <input type="number" value={factBlocks} onChange={e => setFactBlocks(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Tamaño</label>
                                    <select value={factSize} onChange={e => setFactSize(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="1/4 OFICIO">1/4 Oficio</option>
                                        <option value="MEDIO OFICIO">Medio Oficio</option>
                                        <option value="CARTA">Carta</option>
                                        <option value="A4">A4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Copias</label>
                                    <select value={factCopies} onChange={e => setFactCopies(parseInt(e.target.value))} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value={0}>Solo Original</option>
                                        <option value={1}>1 Copia</option>
                                        <option value={2}>2 Copias</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {category === 'PUBLICIDAD' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Cantidad (Unidades)</label>
                                <input type="number" value={pubQty} onChange={e => setPubQty(Math.max(100, parseInt(e.target.value) || 0))} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Tamaño</label>
                                    <select value={pubSize} onChange={e => setPubSize(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="A6">A6 (10x15cm)</option>
                                        <option value="A5">A5 (15x21cm)</option>
                                        <option value="A4">A4 (21x30cm)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Impresión</label>
                                    <select value={pubSides} onChange={e => setPubSides(parseInt(e.target.value))} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value={1}>1 Lado (4/0)</option>
                                        <option value={2}>2 Lados (4/4)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {category === 'DIGITAL' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Cantidad</label>
                                <input type="number" value={digQty} onChange={e => setDigQty(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Tamaño</label>
                                    <select value={digSize} onChange={e => setDigSize(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="A4">A4</option>
                                        <option value="A3">A3</option>
                                        <option value="SRA3">Super A3</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Color</label>
                                    <select value={digType} onChange={e => setDigType(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <option value="COLOR">Full Color</option>
                                        <option value="BN">Blanco y Negro</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Quote Result */}
            <div className="lg:col-span-7">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                    <div className="bg-gray-900 p-6 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-bold text-blue-200">Cotización Estimada</h2>
                                <p className="text-2xl font-black mt-1 leading-tight">{result.detalle}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 font-bold uppercase">Precio Unitario</p>
                                <p className="text-xl font-mono text-green-400 font-bold">{formatCurrency(result.venta.unitario)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex-grow flex flex-col">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 mb-6">
                            <h4 className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <InfoIcon className="w-4 h-4"/> Análisis Técnico
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{result.pliegoInfo}</p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
                                <span>Materia Prima (Papel/Placas)</span>
                                <span>{formatCurrency(result.costos.materiaPrima + result.costos.prePrensa)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
                                <span>Maquinaria / Impresión</span>
                                <span>{formatCurrency(result.costos.impresion)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 border-b border-dashed border-gray-200 dark:border-gray-700 pb-2">
                                <span>Acabados y Mano de Obra</span>
                                <span>{formatCurrency(result.costos.acabados)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-500 pb-2 italic">
                                <span className="flex items-center gap-1"><ShieldCheckIcon className="w-3 h-3"/> Seguro Riesgo ({costs.FACTOR_RIESGO * 100}%)</span>
                                <span>{formatCurrency(result.costos.seguro)}</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Costo Real Producción</span>
                                <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{formatCurrency(result.costos.total)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-900 rounded-xl">
                                <span className="text-lg font-black text-gray-900 dark:text-white uppercase">Precio Venta Final</span>
                                <span className="text-3xl font-black text-brand-blue">{formatCurrency(result.venta.total)}</span>
                            </div>
                            <p className="text-center text-[10px] text-gray-400 mt-2 uppercase tracking-wide">Incluye Margen {costs.MARGEN_GANANCIA * 100}% + IVA (Referencial)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalculadoraPreciosPage: React.FC = () => {
    const [mode, setMode] = useState<Mode>('SMART');
    const [costs, setCosts] = useState<CostConfig>(DEFAULT_COSTS);
    const [showMasterTable, setShowMasterTable] = useState(false);

    // --- ESTADOS MANUALES ---
    const [selectedPaperId, setSelectedPaperId] = useState<string>('QUIMICO');
    const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
    const [finalWidth, setFinalWidth] = useState<number>(10.5);
    const [finalHeight, setFinalHeight] = useState<number>(14.8);
    const [quantity, setQuantity] = useState<number>(100); 
    const [parts, setParts] = useState<number>(2);
    const [sides, setSides] = useState<number>(1);
    const [colors, setColors] = useState<number>(1);
    const [hasNumbering, setHasNumbering] = useState(false);
    const [finishingCost, setFinishingCost] = useState<number>(0);

    useEffect(() => {
        const saved = localStorage.getItem('imprenta_costos_v2');
        if (saved) setCosts(JSON.parse(saved));
    }, []);

    const selectedPaper = PAPERS_DB.find(p => p.id === selectedPaperId) || PAPERS_DB[0];
    const selectedSheet = selectedPaper.tamanosPliego[selectedSheetIndex] || selectedPaper.tamanosPliego[0];

    // --- CÁLCULO INGENIERÍA (MANUAL) ---
    const quote = useMemo(() => {
        const margin = 1.5; // Pinza Offset
        const sheetW = selectedSheet.width;
        const sheetH = selectedSheet.height;
        const printableW = sheetW; 
        const printableH = sheetH - margin;

        const colsA = Math.floor(printableW / finalWidth);
        const rowsA = Math.floor(printableH / finalHeight);
        const countA = colsA * rowsA;

        const colsB = Math.floor(printableW / finalHeight);
        const rowsB = Math.floor(printableH / finalWidth);
        const countB = colsB * rowsB;

        const bestCuts = Math.max(countA, countB);
        const isRotated = countB > countA;

        if (bestCuts === 0) return null;

        const totalHojas = quantity * (selectedPaperId === 'QUIMICO' ? parts : 1);
        const pliegosNetos = Math.ceil(totalHojas / bestCuts);
        
        const esDigital = quantity <= 500 && selectedPaperId !== 'QUIMICO'; 
        const pctMerma = esDigital ? 0.05 : 0.15;
        const pliegosTotales = Math.ceil(pliegosNetos * (1 + pctMerma));

        let precioPliego = 0;
        switch (selectedPaperId) {
            case 'QUIMICO': precioPliego = costs.PLIEGO_QUIMICO; break;
            case 'BOND': precioPliego = costs.PLIEGO_BOND; break;
            case 'COUCHE': precioPliego = costs.PLIEGO_COUCHE; break;
            case 'ADHESIVO': precioPliego = costs.PLIEGO_ADHESIVO; break;
            case 'CARTULINA': precioPliego = costs.PLIEGO_CARTULINA; break;
            default: precioPliego = 0.10;
        }
        const costoPapel = pliegosTotales * precioPliego;

        let costoMaquinaria = 0;
        let costoPrePrensa = 0;

        if (esDigital) {
            const enA3 = Math.max(
                Math.floor(31 / finalWidth) * Math.floor(47 / finalHeight),
                Math.floor(31 / finalHeight) * Math.floor(47 / finalWidth)
            ) || 1;
            const bajadasDigital = Math.ceil(totalHojas / enA3);
            costoMaquinaria = bajadasDigital * costs.IMPRESION_DIGITAL_A3 * sides;
        } else {
            costoPrePrensa = costs.PLACA_CTP * colors * sides;
            const millares = Math.max(1, Math.ceil(totalHojas / 1000));
            costoMaquinaria = millares * costs.IMPRESION_MILLAR_OFFSET * colors * sides;
        }

        let costoAcabadosAuto = costs.ACABADOS_BASICOS; 
        if (hasNumbering) {
            const millaresHojas = Math.ceil(totalHojas / 1000);
            costoAcabadosAuto += (millaresHojas * costs.NUMERACION_MILLAR);
        }
        const totalAcabados = costoAcabadosAuto + finishingCost;

        const subtotal = costoPapel + costoPrePrensa + costoMaquinaria + totalAcabados;
        const totalConRiesgo = subtotal * (1 + costs.FACTOR_RIESGO);
        const precioVenta = totalConRiesgo / (1 - costs.MARGEN_GANANCIA);

        return {
            pliegosTotales,
            cortesPorPliego: bestCuts,
            isRotated,
            esDigital,
            costos: {
                papel: costoPapel,
                maquina: costoMaquinaria + costoPrePrensa,
                acabados: totalAcabados,
                total: totalConRiesgo
            },
            venta: precioVenta,
            unitario: precioVenta / quantity
        };

    }, [costs, selectedPaperId, selectedSheet, finalWidth, finalHeight, quantity, parts, sides, colors, hasNumbering, finishingCost]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-4 font-sans pb-20 animate-fade-in">
            {/* Header / Mode Switcher */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cotizador Maestro Ecuador</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">V2.0 - Gestión de Riesgos & Costos Reales</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowMasterTable(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                            <TableIcon className="w-4 h-4" /> Tabla Papeles
                        </button>
                        <button 
                            onClick={() => setMode(mode === 'CONFIG' ? 'SMART' : 'CONFIG')} 
                            className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg border transition-colors shadow-sm ${mode === 'CONFIG' ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-brand-blue hover:text-brand-blue'}`}
                        >
                            <Cog8ToothIcon className="w-4 h-4"/> Configuración
                        </button>
                    </div>
                </div>

                {mode !== 'CONFIG' && (
                    <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                        <button 
                            onClick={() => setMode('SMART')}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'SMART' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <Sparkles className="w-5 h-5"/> Asistente Inteligente
                        </button>
                        <button 
                            onClick={() => setMode('MANUAL')}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'MANUAL' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <CalculatorIcon className="w-5 h-5"/> Ingeniería (Manual)
                        </button>
                    </div>
                )}

                {/* --- MODE: SMART (WIZARD) --- */}
                {mode === 'SMART' && <SmartCalculator costs={costs} />}

                {/* --- MODE: MANUAL --- */}
                {mode === 'MANUAL' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                        {/* Inputs Panel */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2">Especificaciones Técnicas</h3>
                                
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Material / Papel</label>
                                            <select value={selectedPaperId} onChange={e => {setSelectedPaperId(e.target.value); setSelectedSheetIndex(0);}} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm font-medium focus:ring-2 focus:ring-brand-blue">
                                                {PAPERS_DB.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Tamaño de Pliego</label>
                                            <select value={selectedSheetIndex} onChange={e => setSelectedSheetIndex(parseInt(e.target.value))} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm font-medium focus:ring-2 focus:ring-brand-blue">
                                                {selectedPaper.tamanosPliego.map((t, i) => <option key={i} value={i}>{t.nombre}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Ancho Final (cm)</label>
                                            <input type="number" value={finalWidth} onChange={e => setFinalWidth(parseFloat(e.target.value))} className="w-full p-3 border rounded-xl font-bold text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-blue" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Alto Final (cm)</label>
                                            <input type="number" value={finalHeight} onChange={e => setFinalHeight(parseFloat(e.target.value))} className="w-full p-3 border rounded-xl font-bold text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-blue" />
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        <button onClick={() => { setFinalWidth(10.5); setFinalHeight(14.8); }} className="text-[10px] bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">1/4 Oficio</button>
                                        <button onClick={() => { setFinalWidth(14.8); setFinalHeight(21); }} className="text-[10px] bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">A5</button>
                                        <button onClick={() => { setFinalWidth(21); setFinalHeight(29.7); }} className="text-[10px] bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">A4</button>
                                        <button onClick={() => { setFinalWidth(9); setFinalHeight(5); }} className="text-[10px] bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors">Tarjeta</button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Cantidad</label>
                                            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full p-3 border rounded-xl font-bold text-gray-900 dark:text-white dark:bg-gray-700 focus:ring-2 focus:ring-brand-blue" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Partes (Copias)</label>
                                            <input type="number" min={1} value={parts} onChange={e => setParts(parseInt(e.target.value))} disabled={selectedPaperId !== 'QUIMICO'} className="w-full p-3 border rounded-xl font-bold text-gray-900 dark:text-white dark:bg-gray-700 disabled:opacity-50 disabled:bg-gray-100" />
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                                        <label className="block text-xs font-bold text-gray-500 mb-3">Extras</label>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={hasNumbering} onChange={e => setHasNumbering(e.target.checked)} className="w-5 h-5 text-brand-blue rounded border-gray-300 focus:ring-brand-blue" />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">Numeración</span>
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-700 dark:text-gray-300 w-1/2">Acabados Extra ($)</span>
                                                <input type="number" value={finishingCost} onChange={e => setFinishingCost(parseFloat(e.target.value) || 0)} className="w-1/2 p-1.5 text-right border rounded bg-white dark:bg-gray-600 dark:border-gray-500 text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visualizer & Results */}
                        <div className="lg:col-span-7 space-y-6">
                            {quote ? (
                                <>
                                    {/* VISUALIZER CARD */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center justify-center min-h-[300px]">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 w-full text-left">Diagrama de Corte</h3>
                                        <PliegoVisualizer 
                                            sheetW={selectedSheet.width}
                                            sheetH={selectedSheet.height}
                                            cutW={finalWidth}
                                            cutH={finalHeight}
                                            cuts={quote.cortesPorPliego}
                                            rotated={quote.isRotated}
                                            margin={1.5}
                                        />
                                    </div>

                                    {/* RESULTS CARD */}
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Precio Sugerido</p>
                                                <h2 className="text-5xl font-black tracking-tight">{formatCurrency(quote.venta)}</h2>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">+ IVA</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Unitario</p>
                                                <p className="text-xl font-bold text-green-400 font-mono">{formatCurrency(quote.unitario)}</p>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <div className="flex gap-4 mb-6 text-sm">
                                                <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-medium flex items-center gap-2">
                                                    <RulerIcon className="w-4 h-4"/>
                                                    {quote.cortesPorPliego} Cortes / Pliego
                                                </div>
                                                <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-100 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-medium flex items-center gap-2">
                                                    <FileText className="w-4 h-4"/>
                                                    {quote.pliegosTotales} Pliegos Totales
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                                    <span className="text-gray-600 dark:text-gray-400 text-sm">Papel / Material</span>
                                                    <span className="font-bold text-gray-800 dark:text-white font-mono">{formatCurrency(quote.costos.papel)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                                    <span className="text-gray-600 dark:text-gray-400 text-sm">Impresión {quote.esDigital ? '(Digital)' : '(Offset)'}</span>
                                                    <span className="font-bold text-gray-800 dark:text-white font-mono">{formatCurrency(quote.costos.maquina)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                                    <span className="text-gray-600 dark:text-gray-400 text-sm">Acabados (Num, Corte, Extras)</span>
                                                    <span className="font-bold text-gray-800 dark:text-white font-mono">{formatCurrency(quote.costos.acabados)}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-3 bg-gray-50 dark:bg-gray-700/50 -mx-6 px-6 mt-2">
                                                    <span className="text-gray-900 dark:text-white font-black text-sm uppercase">Costo Producción</span>
                                                    <span className="font-black text-gray-900 dark:text-white font-mono text-lg">{formatCurrency(quote.costos.total)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800">
                                    <ExclamationTriangleIcon className="w-16 h-16 mb-4 opacity-20"/>
                                    <p className="font-medium">Las medidas de corte son mayores al pliego.</p>
                                    <p className="text-sm mt-2">Ajusta el tamaño final.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- MODE: CONFIG --- */}
                {mode === 'CONFIG' && (
                    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl animate-fade-in">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white"><DollarIcon className="w-6 h-6 text-green-500"/> Configuración de Costos Base</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            {Object.entries(costs).map(([key, val]) => (
                                <div key={key}>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{key.replace(/_/g, ' ')}</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                        <input 
                                            type="number" 
                                            step={key.includes('FACTOR') || key.includes('MARGEN') ? "0.01" : "0.01"} 
                                            value={val} 
                                            onChange={e => {
                                                const newCosts = { ...costs, [key]: parseFloat(e.target.value) };
                                                setCosts(newCosts);
                                                localStorage.setItem('imprenta_costos_v2', JSON.stringify(newCosts));
                                            }}
                                            className="w-full pl-6 p-2 border rounded-lg font-mono font-bold dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-blue"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-right">
                            <button onClick={() => setMode('SMART')} className="flex items-center gap-2 bg-brand-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors ml-auto">
                                <SaveIcon className="w-5 h-5"/> Guardar y Volver
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