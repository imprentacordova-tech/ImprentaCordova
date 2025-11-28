
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
    NUMERACION_MILLAR: number; // Precio por millar de numeración
    ACABADOS_BASICOS: number; // Corte, empaquetado
    FACTOR_RIESGO: number;
    MARGEN_GANANCIA: number;
}

const DEFAULT_COSTS: CostConfig = {
    PLIEGO_QUIMICO: 0.15, // Ajustado a realidad Ecuador
    PLIEGO_BOND: 0.10,
    PLIEGO_COUCHE: 0.40,
    PLIEGO_ADHESIVO: 0.60,
    PLIEGO_CARTULINA: 0.45,
    PLACA_CTP: 20.00, // Ajustado
    IMPRESION_MILLAR_OFFSET: 12.00,
    IMPRESION_DIGITAL_A3: 0.35,
    NUMERACION_MILLAR: 5.00, // $5 el millar de numeración
    ACABADOS_BASICOS: 2.00,
    FACTOR_RIESGO: 0.05,
    MARGEN_GANANCIA: 0.35 // 35% de margen base
};

// --- 2. BASE DE DATOS PAPELES (MANUAL) ---
interface PaperType {
    id: string;
    nombre: string;
    tamanosPliego: { width: number; height: number; nombre: string }[];
}

const PAPERS_DB: PaperType[] = [
    {
        id: 'QUIMICO',
        nombre: 'Papel Químico (Autocopiativo)',
        tamanosPliego: [{ width: 61, height: 86, nombre: 'Estándar (61x86)' }]
    },
    {
        id: 'BOND',
        nombre: 'Papel Bond',
        tamanosPliego: [{ width: 61, height: 86, nombre: 'Estándar (61x86)' }, { width: 70, height: 100, nombre: 'Grande (70x100)' }]
    },
    {
        id: 'COUCHE',
        nombre: 'Couché (Brillante/Mate)',
        tamanosPliego: [{ width: 70, height: 100, nombre: 'Estándar (70x100)' }, { width: 61, height: 86, nombre: 'Pequeño (61x86)' }]
    }
];

// --- 3. BASE DE DATOS CATALOGO RÁPIDO (PRESETS) ---
const PRESETS = {
    FACTURACION: [
        { id: 'f1', nombre: '1 Block (50 juegos) - 1/4 Oficio', precio: 10.00, desc: 'Original y 1 Copia. Tamaño 10.5x14.8cm.' },
        { id: 'f2', nombre: '2 Blocks (100 juegos) - 1/4 Oficio', precio: 20.00, desc: 'Original y 1 Copia. Tamaño 10.5x14.8cm.' },
        { id: 'f3', nombre: '1 Block (50 juegos) - Medio Oficio', precio: 15.00, desc: 'Original y 1 Copia. Tamaño 14.8x21cm.' },
        { id: 'f4', nombre: '10 Blocks (500 juegos) - 1/4 Oficio', precio: 80.00, desc: 'Producción Offset. Numerados.' },
    ],
    PUBLICIDAD: [
        { id: 'p1', nombre: '1000 Volantes A6 (10x14cm)', precio: 30.00, desc: 'Couché 115g. Full color un lado.' },
        { id: 'p2', nombre: '1000 Volantes A5 (14x21cm)', precio: 60.00, desc: 'Couché 115g. Full color un lado.' },
        { id: 'p3', nombre: '1000 Trípticos A4', precio: 120.00, desc: 'Couché 150g. Full color ambos lados. Doblados.' },
        { id: 'p4', nombre: '100 Afiches A3', precio: 45.00, desc: 'Couché 150g. Impresión Digital.' },
    ],
    TARJETAS: [
        { id: 't1', nombre: '1000 Tarjetas Presentación Mate', precio: 35.00, desc: 'Couché 300g. Laminado Mate ambos lados.' },
        { id: 't2', nombre: '1000 Tarjetas Mate + UV', precio: 45.00, desc: 'Laminado Mate + Brillo UV localizado.' },
        { id: 't3', nombre: '100 Tarjetas Digitales Express', precio: 15.00, desc: 'Cartulina Couché. Sin laminar. Entrega inmediata.' },
    ]
};

const CalculadoraPreciosPage: React.FC = () => {
    const [mode, setMode] = useState<Mode>('GUIDED');
    const [costs, setCosts] = useState<CostConfig>(DEFAULT_COSTS);

    // --- ESTADOS MANUALES ---
    const [selectedPaperId, setSelectedPaperId] = useState<string>('QUIMICO');
    const [selectedSheetSize, setSelectedSheetSize] = useState<string>('61x86');
    const [finalWidth, setFinalWidth] = useState<number>(10.5);
    const [finalHeight, setFinalHeight] = useState<number>(14.8);
    const [quantity, setQuantity] = useState<number>(100); // Juegos o Unidades
    const [parts, setParts] = useState<number>(2); // 1 Orig + 1 Copia = 2
    const [sides, setSides] = useState<number>(1);
    const [colors, setColors] = useState<number>(1);
    
    // Acabados Manuales
    const [hasNumbering, setHasNumbering] = useState(false);
    const [finishingCost, setFinishingCost] = useState<number>(0); // Costo extra manual

    useEffect(() => {
        const saved = localStorage.getItem('imprenta_costos_v3');
        if (saved) setCosts(JSON.parse(saved));
    }, []);

    const handleUpdateCost = (key: keyof CostConfig, val: number) => {
        const newCosts = { ...costs, [key]: val };
        setCosts(newCosts);
        localStorage.setItem('imprenta_costos_v3', JSON.stringify(newCosts));
    };

    // --- CÁLCULO INGENIERÍA (MANUAL) ---
    const quote = useMemo(() => {
        const paper = PAPERS_DB.find(p => p.id === selectedPaperId);
        if (!paper) return null;

        const [sheetW, sheetH] = selectedSheetSize.split('x').map(Number);
        
        // Algoritmo de Corte (Pinza 1.5cm)
        const printableW = sheetW - 1.5; 
        const printableH = sheetH - 1.5; 

        const fitA = Math.floor(printableW / finalWidth) * Math.floor(printableH / finalHeight);
        const fitB = Math.floor(printableW / finalHeight) * Math.floor(printableH / finalWidth); // Rotado
        const cortesPorPliego = Math.max(fitA, fitB);

        if (cortesPorPliego === 0) return null;

        // 1. Papel
        // Si es químico: Cantidad (Juegos) * Partes = Hojas Totales
        // Si es bond/couché (Parts=1): Cantidad = Hojas Totales
        const totalHojas = quantity * (selectedPaperId === 'QUIMICO' ? parts : 1);
        const pliegosNetos = Math.ceil(totalHojas / cortesPorPliego);
        
        // Merma (Configurable mentalmente: 10% offset, 5% digital)
        const esDigital = quantity <= 500 && selectedPaperId !== 'QUIMICO'; // Regla simple
        const pctMerma = esDigital ? 0.05 : 0.15;
        const pliegosTotales = Math.ceil(pliegosNetos * (1 + pctMerma));

        // Costo Papel
        let precioPliego = 0;
        switch (selectedPaperId) {
            case 'QUIMICO': precioPliego = costs.PLIEGO_QUIMICO; break;
            case 'BOND': precioPliego = costs.PLIEGO_BOND; break;
            case 'COUCHE': precioPliego = costs.PLIEGO_COUCHE; break;
            default: precioPliego = 0.10;
        }
        const costoPapel = pliegosTotales * precioPliego;

        // 2. Impresión & Placas
        let costoMaquinaria = 0;
        let costoPrePrensa = 0;

        if (esDigital) {
            // Costo por bajada A3+
            // Cuantos caben en A3 (32x48)?
            const enA3 = Math.max(
                Math.floor(31 / finalWidth) * Math.floor(47 / finalHeight),
                Math.floor(31 / finalHeight) * Math.floor(47 / finalWidth)
            ) || 1;
            const bajadasDigital = Math.ceil(totalHojas / enA3);
            costoMaquinaria = bajadasDigital * costs.IMPRESION_DIGITAL_A3 * sides;
        } else {
            // Offset
            costoPrePrensa = costs.PLACA_CTP * colors * sides;
            const millares = Math.max(1, Math.ceil(totalHojas / 1000));
            costoMaquinaria = millares * costs.IMPRESION_MILLAR_OFFSET * colors * sides;
        }

        // 3. Acabados
        let costoAcabadosAuto = costs.ACABADOS_BASICOS; // Corte y empaque
        if (hasNumbering) {
            // Costo numeración por millar de hojas
            const millaresHojas = Math.ceil(totalHojas / 1000);
            costoAcabadosAuto += (millaresHojas * costs.NUMERACION_MILLAR);
        }
        const totalAcabados = costoAcabadosAuto + finishingCost; // Sumar manual

        // 4. Totales
        const subtotal = costoPapel + costoPrePrensa + costoMaquinaria + totalAcabados;
        const totalConRiesgo = subtotal * (1 + costs.FACTOR_RIESGO);
        const precioVenta = totalConRiesgo / (1 - costs.MARGEN_GANANCIA);

        return {
            pliegosTotales,
            cortesPorPliego,
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

    }, [costs, selectedPaperId, selectedSheetSize, finalWidth, finalHeight, quantity, parts, sides, colors, hasNumbering, finishingCost]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-4 font-sans pb-20 animate-fade-in">
            {/* Header / Mode Switcher */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Cotizador Imprenta</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Seleccione el modo de trabajo</p>
                    </div>
                    <button onClick={() => setMode(mode === 'CONFIG' ? 'GUIDED' : 'CONFIG')} className="text-gray-500 hover:text-brand-blue">
                        <Cog8ToothIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
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
            </div>

            <div className="max-w-5xl mx-auto">
                {/* --- MODE: GUIDED (CATÁLOGO) --- */}
                {mode === 'GUIDED' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {/* Section: Facturación */}
                        <div className="col-span-full mb-2">
                            <h3 className="text-lg font-bold text-gray-700 dark:text-white flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                                <FileText className="w-5 h-5 text-blue-500"/> Facturación y Documentos
                            </h3>
                        </div>
                        {PRESETS.FACTURACION.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group">
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
                        <div className="col-span-full mt-6 mb-2">
                            <h3 className="text-lg font-bold text-gray-700 dark:text-white flex items-center gap-2 border-b pb-2 dark:border-gray-700">
                                <MonitorIcon className="w-5 h-5 text-orange-500"/> Publicidad
                            </h3>
                        </div>
                        {PRESETS.PUBLICIDAD.map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group">
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

                {/* --- MODE: MANUAL (INGENIERÍA) --- */}
                {mode === 'MANUAL' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
                        {/* Inputs Panel */}
                        <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 h-fit">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Parámetros del Trabajo</h3>
                            
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Material / Papel</label>
                                    <select value={selectedPaperId} onChange={e => setSelectedPaperId(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm font-medium focus:ring-2 focus:ring-brand-blue">
                                        {PAPERS_DB.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Ancho Final (cm)</label>
                                        <input type="number" value={finalWidth} onChange={e => setFinalWidth(parseFloat(e.target.value))} className="w-full p-3 border rounded-xl font-bold text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Alto Final (cm)</label>
                                        <input type="number" value={finalHeight} onChange={e => setFinalHeight(parseFloat(e.target.value))} className="w-full p-3 border rounded-xl font-bold text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => { setFinalWidth(10.5); setFinalHeight(14.8); }} className="text-[10px] bg-blue-50 text-brand-blue px-3 py-1 rounded-full hover:bg-blue-100">1/4 Oficio</button>
                                    <button onClick={() => { setFinalWidth(14.8); setFinalHeight(21); }} className="text-[10px] bg-blue-50 text-brand-blue px-3 py-1 rounded-full hover:bg-blue-100">A5</button>
                                    <button onClick={() => { setFinalWidth(21); setFinalHeight(29.7); }} className="text-[10px] bg-blue-50 text-brand-blue px-3 py-1 rounded-full hover:bg-blue-100">A4</button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Cantidad (Juegos)</label>
                                        <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full p-3 border rounded-xl font-bold text-gray-900 dark:text-white dark:bg-gray-700" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5">Partes (Copias)</label>
                                        <input type="number" min={1} value={parts} onChange={e => setParts(parseInt(e.target.value))} disabled={selectedPaperId !== 'QUIMICO'} className="w-full p-3 border rounded-xl font-bold text-gray-900 dark:text-white dark:bg-gray-700 disabled:opacity-50" />
                                    </div>
                                </div>

                                {/* Acabados Manuales */}
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <label className="block text-xs font-bold text-gray-500 mb-3">Acabados y Extras</label>
                                    <div className="flex items-center gap-3 mb-3">
                                        <input type="checkbox" checked={hasNumbering} onChange={e => setHasNumbering(e.target.checked)} className="w-5 h-5 text-brand-blue rounded border-gray-300 focus:ring-brand-blue" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Incluir Numeración</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Costo Acabados Extra ($)</label>
                                        <input type="number" value={finishingCost} onChange={e => setFinishingCost(parseFloat(e.target.value) || 0)} placeholder="Ej: Troquelado, Encolado" className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Result Panel */}
                        <div className="lg:col-span-7">
                            {quote ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
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
                                        {/* Technical Summary */}
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

                                        {/* Cost Breakdown */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                                <span className="text-gray-600 dark:text-gray-400 text-sm">Papel / Material</span>
                                                <span className="font-bold text-gray-800 dark:text-white font-mono">{formatCurrency(quote.costos.papel)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                                                <span className="text-gray-600 dark:text-gray-400 text-sm">Impresión / CTP / Tinta</span>
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
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                                    <ExclamationTriangleIcon className="w-12 h-12 mb-4 opacity-20"/>
                                    <p>Ajusta las medidas para calcular.</p>
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
                                            onChange={e => handleUpdateCost(key as keyof CostConfig, parseFloat(e.target.value))}
                                            className="w-full pl-6 p-2 border rounded-lg font-mono font-bold dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
        </div>
    );
};

export default CalculadoraPreciosPage;
