
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, DocumentIcon, ArrowRightIcon, CheckCircleIcon, PrinterIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

// --- Constantes de Costos (Ecuador 2025) ---
const PRECIOS_RESMA: Record<string, number> = {
    '90g': 12.50,
    '120g': 18.00,
    '150g': 22.00,
    '200g': 28.50,
    '300g': 42.00,
};

const COSTOS_TINTA = {
    PRECIO_LITRO_OFFSET_CMYK: 85.00,
    PRECIO_LITRO_OFFSET_NEGRO: 45.00,
    RENDIMIENTO_OFFSET_CMYK: 50000, // cm2 por litro
    RENDIMIENTO_OFFSET_NEGRO: 100000, // cm2 por litro
    FACTOR_COBERTURA: 0.002, // ml/cm2 promedio
};

const COSTOS_ACABADOS = {
    BARNIZ_UV: 0.015, // por unidad (min 100)
    LAMINADO_MATE: 0.03, // por unidad A4 aprox
    TROQUELADO: 0.05, // base
    ANILLADO: 0.12,
    ENCUADERNACION: 0.20,
    DOBLEZ: 0.005, // por doblez
};

// Tamaños de Pliego Estándar (cm)
const PLIEGO_ANCHO = 61;
const PLIEGO_ALTO = 86;

interface CalculoResult {
    costoPapel: number;
    costoTinta: number;
    costoAcabados: number;
    costoTotal: number;
    precioSugerido: number;
    precioUnitario: number;
    hojasReales: number; // Hojas de pliego necesarias
    cortesPorPliego: number;
}

const CalculadoraPreciosPage: React.FC = () => {
    // --- Estados del Formulario ---
    const [tipoTrabajo, setTipoTrabajo] = useState<'general' | 'sri'>('general');
    const [cantidad, setCantidad] = useState(1000);
    
    // Papel
    const [papelGramaje, setPapelGramaje] = useState('120g');
    const [anchoFinal, setAnchoFinal] = useState(21.0); // A4 ancho por defecto
    const [altoFinal, setAltoFinal] = useState(29.7); // A4 alto por defecto
    
    // Impresión
    const [coloresFrente, setColoresFrente] = useState<'4' | '1' | '0'>('4');
    const [coloresDorso, setColoresDorso] = useState<'4' | '1' | '0'>('0');
    
    // Acabados
    const [acabados, setAcabados] = useState({
        barnizUV: false,
        laminadoMate: false,
        troquelado: false,
        anillado: false,
        doblez: false
    });

    // Resultado
    const [resultado, setResultado] = useState<CalculoResult | null>(null);

    // --- Lógica de Cálculo ---
    useEffect(() => {
        calcularPresupuesto();
    }, [cantidad, papelGramaje, anchoFinal, altoFinal, coloresFrente, coloresDorso, acabados, tipoTrabajo]);

    const calcularCortesPorPliego = (ancho: number, alto: number) => {
        // Cálculo simple de imposición (cuántos caben en el pliego estándar)
        // Opción A: Orientación vertical
        const cabenA_W = Math.floor(PLIEGO_ANCHO / ancho);
        const cabenA_H = Math.floor(PLIEGO_ALTO / alto);
        const totalA = cabenA_W * cabenA_H;

        // Opción B: Orientación horizontal (girado)
        const cabenB_W = Math.floor(PLIEGO_ANCHO / alto);
        const cabenB_H = Math.floor(PLIEGO_ALTO / ancho);
        const totalB = cabenB_W * cabenB_H;

        return Math.max(totalA, totalB, 1); // Mínimo 1 para evitar división por cero
    };

    const calcularPresupuesto = () => {
        // 1. Costo Papel
        const cortes = calcularCortesPorPliego(anchoFinal, altoFinal);
        // Cantidad de pliegos necesarios = Cantidad deseada / cortes por pliego
        // Se añade un 5% de desperdicio estándar
        const pliegosNecesarios = Math.ceil((cantidad / cortes) * 1.05);
        const precioResma = PRECIOS_RESMA[papelGramaje] || 0;
        const costoPapelTotal = (pliegosNecesarios / 500) * precioResma;

        // 2. Costo Tinta
        // Area total impresa = Ancho * Alto * Cantidad
        const areaTotalCm2 = anchoFinal * altoFinal * cantidad;
        
        // Frente
        let costoTintaFrente = 0;
        if (coloresFrente === '4') { // CMYK
             costoTintaFrente = (areaTotalCm2 * 4 * COSTOS_TINTA.FACTOR_COBERTURA * COSTOS_TINTA.PRECIO_LITRO_OFFSET_CMYK) / COSTOS_TINTA.RENDIMIENTO_OFFSET_CMYK;
        } else if (coloresFrente === '1') { // Negro
             costoTintaFrente = (areaTotalCm2 * 1 * COSTOS_TINTA.FACTOR_COBERTURA * COSTOS_TINTA.PRECIO_LITRO_OFFSET_NEGRO) / COSTOS_TINTA.RENDIMIENTO_OFFSET_NEGRO;
        }

        // Dorso
        let costoTintaDorso = 0;
        if (coloresDorso === '4') {
             costoTintaDorso = (areaTotalCm2 * 4 * COSTOS_TINTA.FACTOR_COBERTURA * COSTOS_TINTA.PRECIO_LITRO_OFFSET_CMYK) / COSTOS_TINTA.RENDIMIENTO_OFFSET_CMYK;
        } else if (coloresDorso === '1') {
             costoTintaDorso = (areaTotalCm2 * 1 * COSTOS_TINTA.FACTOR_COBERTURA * COSTOS_TINTA.PRECIO_LITRO_OFFSET_NEGRO) / COSTOS_TINTA.RENDIMIENTO_OFFSET_NEGRO;
        }

        const costoTintaTotal = costoTintaFrente + costoTintaDorso;

        // 3. Costo Acabados
        let costoAcabadosTotal = 0;
        if (acabados.barnizUV) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.BARNIZ_UV;
        if (acabados.laminadoMate) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.LAMINADO_MATE;
        if (acabados.troquelado) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.TROQUELADO;
        if (acabados.anillado) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.ANILLADO;
        if (acabados.doblez) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.DOBLEZ;

        // 4. Totales y Margen
        const costoTotalProduccion = costoPapelTotal + costoTintaTotal + costoAcabadosTotal;
        
        // Margen según tipo
        const margen = tipoTrabajo === 'sri' ? 0.40 : 0.60; // 40% SRI, 60% General
        const precioSugeridoTotal = costoTotalProduccion * (1 + margen);

        setResultado({
            costoPapel: costoPapelTotal,
            costoTinta: costoTintaTotal,
            costoAcabados: costoAcabadosTotal,
            costoTotal: costoTotalProduccion,
            precioSugerido: precioSugeridoTotal,
            precioUnitario: precioSugeridoTotal / cantidad,
            hojasReales: pliegosNecesarios,
            cortesPorPliego: cortes
        });
    };

    const toggleAcabado = (key: keyof typeof acabados) => {
        setAcabados(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-brand-blue p-2 rounded-lg text-white">
                    <CalculatorIcon className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculadora Profesional</h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Panel Izquierdo - Inputs */}
                <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 overflow-y-auto border border-gray-200 dark:border-gray-700">
                    
                    {/* Sección Tipo */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">1. Configuración General</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Trabajo</label>
                                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                    <button onClick={() => setTipoTrabajo('general')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${tipoTrabajo === 'general' ? 'bg-white dark:bg-gray-600 text-brand-blue shadow-sm' : 'text-gray-500'}`}>Publicitario</button>
                                    <button onClick={() => setTipoTrabajo('sri')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${tipoTrabajo === 'sri' ? 'bg-white dark:bg-gray-600 text-brand-blue shadow-sm' : 'text-gray-500'}`}>Documentos SRI</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cantidad</label>
                                <input type="number" value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 0)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 font-mono font-bold" />
                            </div>
                        </div>
                    </div>

                    {/* Sección Papel */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">2. Papel y Formato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gramaje</label>
                                <select value={papelGramaje} onChange={e => setPapelGramaje(e.target.value)} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                    {Object.keys(PRECIOS_RESMA).map(g => <option key={g} value={g}>{g} - {formatCurrency(PRECIOS_RESMA[g])}/resma</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ancho (cm)</label>
                                <input type="number" value={anchoFinal} onChange={e => setAnchoFinal(parseFloat(e.target.value) || 0)} step="0.1" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alto (cm)</label>
                                <input type="number" value={altoFinal} onChange={e => setAltoFinal(parseFloat(e.target.value) || 0)} step="0.1" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button onClick={() => { setAnchoFinal(21); setAltoFinal(29.7); }} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">A4</button>
                            <button onClick={() => { setAnchoFinal(14.8); setAltoFinal(21); }} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">A5</button>
                            <button onClick={() => { setAnchoFinal(10); setAltoFinal(15); }} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">1/4 Oficio Aprox</button>
                        </div>
                    </div>

                    {/* Sección Impresión */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">3. Tintas</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <span className="block text-sm font-bold mb-3 text-center">Frente (Tiro)</span>
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => setColoresFrente('4')} className={`px-3 py-1 rounded text-xs font-bold border ${coloresFrente === '4' ? 'bg-cyan-100 border-cyan-500 text-cyan-700' : 'border-gray-300'}`}>CMYK</button>
                                    <button onClick={() => setColoresFrente('1')} className={`px-3 py-1 rounded text-xs font-bold border ${coloresFrente === '1' ? 'bg-gray-800 text-white border-black' : 'border-gray-300'}`}>Negro</button>
                                    <button onClick={() => setColoresFrente('0')} className={`px-3 py-1 rounded text-xs font-bold border ${coloresFrente === '0' ? 'bg-red-100 border-red-500 text-red-700' : 'border-gray-300'}`}>N/A</button>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <span className="block text-sm font-bold mb-3 text-center">Dorso (Retiro)</span>
                                <div className="flex justify-center gap-2">
                                    <button onClick={() => setColoresDorso('4')} className={`px-3 py-1 rounded text-xs font-bold border ${coloresDorso === '4' ? 'bg-cyan-100 border-cyan-500 text-cyan-700' : 'border-gray-300'}`}>CMYK</button>
                                    <button onClick={() => setColoresDorso('1')} className={`px-3 py-1 rounded text-xs font-bold border ${coloresDorso === '1' ? 'bg-gray-800 text-white border-black' : 'border-gray-300'}`}>Negro</button>
                                    <button onClick={() => setColoresDorso('0')} className={`px-3 py-1 rounded text-xs font-bold border ${coloresDorso === '0' ? 'bg-red-100 border-red-500 text-red-700' : 'border-gray-300'}`}>N/A</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección Acabados */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">4. Acabados</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.keys(acabados).map((key) => (
                                <label key={key} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${acabados[key as keyof typeof acabados] ? 'border-brand-blue bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}>
                                    <input type="checkbox" checked={acabados[key as keyof typeof acabados]} onChange={() => toggleAcabado(key as keyof typeof acabados)} className="h-4 w-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue" />
                                    <span className="ml-2 text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Panel Derecho - Resumen */}
                <div className="lg:w-96 flex-shrink-0 bg-gray-50 dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Resumen de Costos</h2>
                        <p className="text-xs text-gray-500">Cálculo estimado basado en precios estándar.</p>
                    </div>
                    
                    <div className="p-6 flex-grow space-y-4 overflow-y-auto">
                        {/* Previsualización Mini */}
                        <div className="flex justify-center mb-6">
                            <div className="relative border-2 border-gray-300 bg-white w-32 h-44 shadow-sm flex items-center justify-center">
                                <div className="text-xs text-gray-400 text-center">
                                    {anchoFinal}cm<br/>x<br/>{altoFinal}cm
                                </div>
                                {resultado && (
                                    <div className="absolute top-0 right-0 bg-brand-blue text-white text-[10px] px-1 font-bold">
                                        {resultado.cortesPorPliego} up
                                    </div>
                                )}
                            </div>
                        </div>

                        {resultado && (
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Papel ({resultado.hojasReales} pliegos)</span>
                                    <span className="font-semibold">{formatCurrency(resultado.costoPapel)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Tinta</span>
                                    <span className="font-semibold">{formatCurrency(resultado.costoTinta)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Acabados</span>
                                    <span className="font-semibold">{formatCurrency(resultado.costoAcabados)}</span>
                                </div>
                                <div className="border-t border-gray-300 dark:border-gray-600 my-2"></div>
                                <div className="flex justify-between text-brand-red font-bold">
                                    <span>Costo Producción</span>
                                    <span>{formatCurrency(resultado.costoTotal)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl">
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">Precio de Venta Sugerido</p>
                            <p className="text-4xl font-extrabold text-center text-brand-blue tracking-tight">{resultado ? formatCurrency(resultado.precioSugerido) : '$0.00'}</p>
                            <p className="text-center text-xs font-medium text-gray-400 mt-1">
                                {resultado ? `${formatCurrency(resultado.precioUnitario)} c/u` : ''}
                            </p>
                        </div>
                        <button className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-800 transition-all flex items-center justify-center gap-2">
                            <ArrowRightIcon className="h-5 w-5" />
                            Agregar al Pedido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculadoraPreciosPage;
