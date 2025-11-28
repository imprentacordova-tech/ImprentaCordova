
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, CheckCircleIcon, CloseIcon, InfoIcon, ArrowLeftIcon, FileText, Sparkles, RulerIcon, Cog8ToothIcon, ShieldCheckIcon, MonitorIcon, TableIcon, ExclamationTriangleIcon, BookIcon, DollarIcon, ShoppingCartIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

// --- TIPOS Y ESTADOS ---

type Mode = 'GUIDED' | 'MANUAL' | 'CONFIG';

// --- 1. CONFIGURACIÓN BASE (MANUAL) ---
interface CostConfig {
    PLIEGO_QUIMICO: number;
    PLIEGO_BOND: number;
    PLIEGO_COUCHE: number;
    PLIEGO_ADHESIVO: number;
    PLIEGO_CARTULINA: number;
    PLACA_CTP: number;
    IMPRESION_MILLAR_OFFSET: number;
    IMPRESION_DIGITAL_A3: number;
    NUMERACION_MILLAR: number;
    ACABADOS_BASICOS: number;
    FACTOR_RIESGO: number;
    MARGEN_GANANCIA: number;
}

const DEFAULT_COSTS: CostConfig = {
    PLIEGO_QUIMICO: 0.15,
    PLIEGO_BOND: 0.10,
    PLIEGO_COUCHE: 0.40,
    PLIEGO_ADHESIVO: 0.60,
    PLIEGO_CARTULINA: 0.45,
    PLACA_CTP: 22.00,
    IMPRESION_MILLAR_OFFSET: 15.00,
    IMPRESION_DIGITAL_A3: 0.35,
    NUMERACION_MILLAR: 5.00,
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

// --- PRESETS ---
const PRESETS = {
    FACTURACION: [
        { id: 'f1', nombre: '1 Block (50) - 1/4 Oficio', precio: 10.00, desc: 'Original y 1 Copia. Químico.' },
        { id: 'f2', nombre: '2 Blocks (100) - 1/4 Oficio', precio: 20.00, desc: 'Original y 1 Copia. Químico.' },
        { id: 'f3', nombre: '1 Block (50) - A5 / Medio Oficio', precio: 15.00, desc: 'Original y 1 Copia. Químico.' },
    ],
    PUBLICIDAD: [
        { id: 'p1', nombre: '1000 Volantes A6', precio: 30.00, desc: 'Couché 115g. Full color 1 lado.' },
        { id: 'p2', nombre: '1000 Volantes A5', precio: 60.00, desc: 'Couché 115g. Full color 1 lado.' },
    ],
    TARJETAS: [
        { id: 't1', nombre: '1000 Tarjetas Mate', precio: 35.00, desc: 'Couché 300g. Laminado Mate.' },
        { id: 't2', nombre: '100 Tarjetas Express', precio: 15.00, desc: 'Digital. Cartulina Couché.' },
    ]
};

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
    // Calculamos columnas y filas
    // El algoritmo simple asume cortes uniformes (grid)
    // Area imprimible
    const printableW = sheetW; // En el dibujo mostramos el pliego total, la pinza se marca visualmente
    const printableH = sheetH - margin; 

    // Dimensiones efectivas del corte según rotación
    const effCutW = rotated ? cutH : cutW;
    const effCutH = rotated ? cutW : cutH;

    const cols = Math.floor(sheetW / effCutW);
    const rows = Math.floor(printableH / effCutH);
    
    // Scale factor for SVG
    const scale = 4; 
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
                    y={(r * effCutH * scale) + (margin * scale)} // Offset by margin (pinza)
                    width={effCutW * scale}
                    height={effCutH * scale}
                    fill="#3b82f6"
                    fillOpacity="0.2"
                    stroke="#2563eb"
                    strokeWidth="1"
                />
            );
            // Text label for dimensions
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

    // Calcular eficiencia
    const usedArea = cuts * (cutW * cutH);
    const totalArea = sheetW * sheetH;
    const efficiency = (usedArea / totalArea) * 100;

    return (
        <div className="flex flex-col items-center">
            <div className="relative border-2 border-gray-800 bg-white shadow-lg mb-2" style={{ width: svgW, height: svgH }}>
                <svg width="100%" height="100%">
                    {/* Pinza Zone */}
                    <rect x="0" y="0" width="100%" height={margin * scale} fill="#fee2e2" />
                    <text x="5" y={(margin * scale) - 2} fontSize="10" fill="#991b1b">Pinza {margin}cm</text>
                    
                    {/* Cortes */}
                    {items}
                </svg>
                <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 -rotate-90 origin-left">
                    {sheetH} cm
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 text-xs text-gray-500">
                    {sheetW} cm
                </div>
            </div>
            
            <div className="flex gap-4 mt-6 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-200 border border-blue-500"></div>
                    <span>Producto ({efficiency.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-100 border border-red-200"></div>
                    <span>Pinza</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white border border-gray-300"></div>
                    <span>Merma ({(100 - efficiency).toFixed(1)}%)</span>
                </div>
            </div>
        </div>
    );
};

// --- MODAL DE TABLA MAESTRA ---
const MasterTableModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 bg-brand-blue text-white flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2"><TableIcon className="w-6 h-6"/> Tabla Maestra de Papeles Ecuador</h2>
                <button onClick={onClose}><CloseIcon className="w-6 h-6 text-white hover:text-red-200 transition-colors"/></button>
            </div>
            <div className="p-6 overflow-y-auto">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Papel</th>
                                <th className="px-6 py-3">Gramajes (g/m²)</th>
                                <th className="px-6 py-3">Pliegos Estándar</th>
                                <th className="px-6 py-3">Usos Recomendados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PAPERS_DB.map((p) => (
                                <tr key={p.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{p.nombre}</td>
                                    <td className="px-6 py-4">{p.gramajes}</td>
                                    <td className="px-6 py-4">
                                        {p.tamanosPliego.map((t, i) => (
                                            <div key={i} className="text-xs font-mono bg-blue-50 text-blue-700 inline-block px-2 py-1 rounded mr-1 mb-1">
                                                {t.width}x{t.height}
                                            </div>
                                        ))}
                                    </td>
                                    <td className="px-6 py-4">{p.usos}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                    <div>
                        <h4 className="font-bold text-brand-blue mb-2 uppercase">Tamaños de Corte Populares</h4>
                        <ul className="space-y-1 list-disc list-inside">
                            <li><strong>A4:</strong> 21 x 29.7 cm</li>
                            <li><strong>A5 (Medio Oficio aprox):</strong> 14.8 x 21 cm</li>
                            <li><strong>A6 (1/4 Oficio aprox):</strong> 10.5 x 14.8 cm</li>
                            <li><strong>Tarjeta:</strong> 9 x 5 cm o 8.5 x 5.5 cm</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-brand-blue mb-2 uppercase">Notas Técnicas</h4>
                        <p>Los tamaños de pliego pueden variar +/- 1cm según la marca (Papelesa, etc.). Siempre considere 1.5cm de pinza para máquinas offset grandes y 0.8cm para duplicadoras.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const CalculadoraPreciosPage: React.FC = () => {
    const [mode, setMode] = useState<Mode>('GUIDED');
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
        const saved = localStorage.getItem('imprenta_costos_v3');
        if (saved) setCosts(JSON.parse(saved));
    }, []);

    const selectedPaper = PAPERS_DB.find(p => p.id === selectedPaperId) || PAPERS_DB[0];
    const selectedSheet = selectedPaper.tamanosPliego[selectedSheetIndex] || selectedPaper.tamanosPliego[0];

    // --- CÁLCULO INGENIERÍA ---
    const quote = useMemo(() => {
        const margin = 1.5; // Pinza Offset
        const sheetW = selectedSheet.width;
        const sheetH = selectedSheet.height;
        
        // Área imprimible
        const printableW = sheetW; // La pinza se come espacio, asumimos se resta del alto para simplificar cálculo grid
        const printableH = sheetH - margin;

        // Opción A: Normal
        const colsA = Math.floor(printableW / finalWidth);
        const rowsA = Math.floor(printableH / finalHeight);
        const countA = colsA * rowsA;

        // Opción B: Rotado
        const colsB = Math.floor(printableW / finalHeight);
        const rowsB = Math.floor(printableH / finalWidth);
        const countB = colsB * rowsB;

        const bestCuts = Math.max(countA, countB);
        const isRotated = countB > countA;

        if (bestCuts === 0) return null;

        // 1. Papel
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

        // 2. Impresión
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

        // 3. Acabados
        let costoAcabadosAuto = costs.ACABADOS_BASICOS; 
        if (hasNumbering) {
            const millaresHojas = Math.ceil(totalHojas / 1000);
            costoAcabadosAuto += (millaresHojas * costs.NUMERACION_MILLAR);
        }
        const totalAcabados = costoAcabadosAuto + finishingCost;

        // 4. Totales
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
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cotizador Maestro</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sistema de Ingeniería de Costos V3.0</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowMasterTable(true)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                            <TableIcon className="w-4 h-4" /> Tabla Papeles
                        </button>
                        <button onClick={() => setMode(mode === 'CONFIG' ? 'GUIDED' : 'CONFIG')} className="text-gray-500 hover:text-brand-blue p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Cog8ToothIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>

                <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                    <button 
                        onClick={() => setMode('GUIDED')}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'GUIDED' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <Sparkles className="w-5 h-5"/> Catálogo Rápido
                    </button>
                    <button 
                        onClick={() => setMode('MANUAL')}
                        className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'MANUAL' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                        <CalculatorIcon className="w-5 h-5"/> Ingeniería (Manual)
                    </button>
                </div>

                {/* --- MODE: GUIDED --- */}
                {mode === 'GUIDED' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {/* Section: Facturación */}
                        <div className="col-span-full mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                            <h3 className="text-lg font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500"/> Facturación y Documentos
                            </h3>
                        </div>
                        {PRESETS.FACTURACION.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-brand-blue">{item.nombre}</h4>
                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">{formatCurrency(item.precio)}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{item.desc}</p>
                                <button className="w-full py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm rounded-lg group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                    Seleccionar
                                </button>
                            </div>
                        ))}

                        {/* Section: Publicidad */}
                        <div className="col-span-full mt-6 mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                            <h3 className="text-lg font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                <MonitorIcon className="w-5 h-5 text-orange-500"/> Publicidad
                            </h3>
                        </div>
                        {PRESETS.PUBLICIDAD.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-brand-blue">{item.nombre}</h4>
                                    <span className="bg-blue-100 text-brand-blue text-xs font-bold px-2 py-1 rounded-full">{formatCurrency(item.precio)}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{item.desc}</p>
                                <button className="w-full py-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-sm rounded-lg group-hover:bg-brand-blue group-hover:text-white transition-colors">
                                    Seleccionar
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- MODE: MANUAL --- */}
                {mode === 'MANUAL' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                        {/* Inputs Panel */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b pb-2">Especificaciones</h3>
                                
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
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 w-full text-left">Visualización de Cortes</h3>
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
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Precio Final Sugerido</p>
                                                <h2 className="text-5xl font-black tracking-tight">{formatCurrency(quote.venta)}</h2>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">+ IVA</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Costo Unitario</p>
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
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={val} 
                                            onChange={e => {
                                                const newCosts = { ...costs, [key]: parseFloat(e.target.value) };
                                                setCosts(newCosts);
                                                localStorage.setItem('imprenta_costos_v3', JSON.stringify(newCosts));
                                            }}
                                            className="w-full pl-6 p-2 border rounded-lg font-mono font-bold dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand-blue"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-right">
                            <button onClick={() => setMode('MANUAL')} className="bg-brand-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Guardar y Salir</button>
                        </div>
                    </div>
                )}
            </div>
            
            {showMasterTable && <MasterTableModal onClose={() => setShowMasterTable(false)} />}
        </div>
    );
};

export default CalculadoraPreciosPage;
