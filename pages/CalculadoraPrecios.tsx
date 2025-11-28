
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, DocumentIcon, ArrowRightIcon, CheckCircleIcon, PrinterIcon, BoxIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

// --- Constantes de Costos (Ecuador 2025) ---

// Estructura Jerárquica de Papeles: Tipo -> Gramaje -> Precio por Resma (500 pliegos estándar)
const CATALOGO_PAPELES: Record<string, Record<string, number>> = {
    'Bond': {
        '65g (Económico)': 11.50,
        '75g (Estándar)': 12.50,
        '90g (Premium)': 14.50,
        '120g (Certificados)': 19.00
    },
    'Couché Brillo': {
        '115g (Volantes)': 22.00,
        '150g (Trípticos)': 28.00,
        '200g (Portadas)': 36.00,
        '250g (Semi-rígido)': 42.00,
        '300g (Tarjetas)': 48.00
    },
    'Couché Mate': {
        '150g (Elegante)': 30.00,
        '200g (Portadas)': 38.00,
        '300g (Tarjetas)': 52.00
    },
    'Químico (Autocopiante)': {
        '55g (Original CB)': 18.00,
        '53g (Copia CFB)': 19.00,
        '50g (Final CF)': 17.00
    },
    'Periódico': {
        '45g (Económico)': 8.50
    },
    'Cartulina Bristol': {
        '180g (Colores)': 16.00
    },
    'Papel Fotográfico': {
        '135g Glossy (Adhesivo)': 45.00,
        '180g Glossy': 38.00,
        '200g Glossy': 42.00,
        '230g Glossy (Doble Cara)': 58.00,
        '260g Glossy (Grueso)': 65.00
    },
    'Adhesivos': {
        'Papel Adhesivo Brillo': 48.00,
        'Papel Adhesivo Mate': 52.00,
        'Vinil PVC (Blanco)': 110.00,
        'Vinil PVC (Transparente)': 125.00
    }
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
    NUMERACION: 0.01,
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
    desperdicioPapel: number;
}

const CalculadoraPreciosPage: React.FC = () => {
    // --- Estados del Formulario ---
    const [tipoTrabajo, setTipoTrabajo] = useState<'general' | 'sri'>('general');
    const [cantidad, setCantidad] = useState(1000);
    
    // Papel
    const [tipoPapel, setTipoPapel] = useState('Bond');
    const [gramaje, setGramaje] = useState('75g (Estándar)');
    
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
        doblez: false,
        numeracion: false
    });

    // Resultado
    const [resultado, setResultado] = useState<CalculoResult | null>(null);

    // Efecto para actualizar el gramaje cuando cambia el tipo de papel
    useEffect(() => {
        const opcionesGramaje = Object.keys(CATALOGO_PAPELES[tipoPapel]);
        if (!opcionesGramaje.includes(gramaje)) {
            setGramaje(opcionesGramaje[0]);
        }
    }, [tipoPapel]);

    // --- Lógica de Cálculo ---
    useEffect(() => {
        calcularPresupuesto();
    }, [cantidad, tipoPapel, gramaje, anchoFinal, altoFinal, coloresFrente, coloresDorso, acabados, tipoTrabajo]);

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
        // Se añade un porcentaje de desperdicio según la cantidad (más cantidad, menos desperdicio relativo)
        const factorDesperdicio = cantidad < 1000 ? 1.10 : 1.05; 
        const pliegosNecesarios = Math.ceil((cantidad / cortes) * factorDesperdicio);
        
        const precioResma = CATALOGO_PAPELES[tipoPapel][gramaje] || 0;
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
        if (acabados.barnizUV) costoAcabadosTotal += Math.max(cantidad * COSTOS_ACABADOS.BARNIZ_UV, 5.00); // Mínimo $5
        if (acabados.laminadoMate) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.LAMINADO_MATE;
        if (acabados.troquelado) costoAcabadosTotal += Math.max(cantidad * COSTOS_ACABADOS.TROQUELADO, 10.00); // Mínimo $10
        if (acabados.anillado) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.ANILLADO;
        if (acabados.doblez) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.DOBLEZ;
        if (acabados.numeracion) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.NUMERACION;

        // 4. Totales y Margen
        const costoTotalProduccion = costoPapelTotal + costoTintaTotal + costoAcabadosTotal;
        
        // Margen dinámico: Menos cantidad = mayor margen porcentual para cubrir fijos
        let margen = tipoTrabajo === 'sri' ? 0.40 : 0.60; 
        if (cantidad < 500) margen += 0.20; // Extra margen para tirajes cortos

        const precioSugeridoTotal = costoTotalProduccion * (1 + margen);

        setResultado({
            costoPapel: costoPapelTotal,
            costoTinta: costoTintaTotal,
            costoAcabados: costoAcabadosTotal,
            costoTotal: costoTotalProduccion,
            precioSugerido: precioSugeridoTotal,
            precioUnitario: precioSugeridoTotal / cantidad,
            hojasReales: pliegosNecesarios,
            cortesPorPliego: cortes,
            desperdicioPapel: pliegosNecesarios - (cantidad / cortes)
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculadora Pro</h1>
                    <p className="text-sm text-gray-500">Estimación precisa de costos de producción</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Panel Izquierdo - Inputs */}
                <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 overflow-y-auto border border-gray-200 dark:border-gray-700 custom-scrollbar">
                    
                    {/* Sección 1: Configuración General */}
                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BoxIcon className="w-4 h-4"/> 1. Configuración General
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Trabajo</label>
                                <div className="flex bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <button onClick={() => setTipoTrabajo('general')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${tipoTrabajo === 'general' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>Publicitario</button>
                                    <button onClick={() => setTipoTrabajo('sri')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${tipoTrabajo === 'sri' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>SRI / Fiscal</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cantidad (Unidades)</label>
                                <input type="number" value={cantidad} onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono font-bold text-lg focus:ring-2 focus:ring-brand-blue outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Materiales */}
                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                            <DocumentIcon className="w-4 h-4"/> 2. Papel y Sustrato
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Papel</label>
                                <select value={tipoPapel} onChange={e => setTipoPapel(e.target.value)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue outline-none">
                                    {Object.keys(CATALOGO_PAPELES).map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gramaje / Variante</label>
                                <select value={gramaje} onChange={e => setGramaje(e.target.value)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue outline-none bg-white dark:bg-gray-800 font-medium">
                                    {Object.keys(CATALOGO_PAPELES[tipoPapel]).map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1 text-right">
                                    Costo ref: {formatCurrency(CATALOGO_PAPELES[tipoPapel][gramaje])} / resma
                                </p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ancho Final (cm)</label>
                                <input type="number" value={anchoFinal} onChange={e => setAnchoFinal(parseFloat(e.target.value) || 0)} step="0.1" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 font-mono" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alto Final (cm)</label>
                                <input type="number" value={altoFinal} onChange={e => setAltoFinal(parseFloat(e.target.value) || 0)} step="0.1" className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 font-mono" />
                            </div>
                            <div className="col-span-2 flex gap-2">
                                <button onClick={() => { setAnchoFinal(21); setAltoFinal(29.7); }} className="flex-1 text-xs bg-white border border-gray-300 text-gray-700 px-2 py-2 rounded hover:bg-gray-50 transition-colors">A4</button>
                                <button onClick={() => { setAnchoFinal(14.8); setAltoFinal(21); }} className="flex-1 text-xs bg-white border border-gray-300 text-gray-700 px-2 py-2 rounded hover:bg-gray-50 transition-colors">A5</button>
                                <button onClick={() => { setAnchoFinal(9); setAltoFinal(5.5); }} className="flex-1 text-xs bg-white border border-gray-300 text-gray-700 px-2 py-2 rounded hover:bg-gray-50 transition-colors">Tarjeta</button>
                            </div>
                        </div>
                    </div>

                    {/* Sección 3: Impresión */}
                    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                            <PrinterIcon className="w-4 h-4"/> 3. Tintas y Caras
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                                <span className="block text-xs font-bold mb-2 text-center text-gray-500 uppercase">Frente (Tiro)</span>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => setColoresFrente('4')} className={`px-3 py-2 rounded text-xs font-bold border transition-all ${coloresFrente === '4' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-gray-200 text-gray-400'}`}>Full Color (CMYK)</button>
                                    <button onClick={() => setColoresFrente('1')} className={`px-3 py-2 rounded text-xs font-bold border transition-all ${coloresFrente === '1' ? 'bg-gray-800 text-white border-black' : 'border-gray-200 text-gray-400'}`}>Solo Negro (K)</button>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
                                <span className="block text-xs font-bold mb-2 text-center text-gray-500 uppercase">Dorso (Retiro)</span>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => setColoresDorso('4')} className={`px-3 py-2 rounded text-xs font-bold border transition-all ${coloresDorso === '4' ? 'bg-cyan-50 border-cyan-500 text-cyan-700' : 'border-gray-200 text-gray-400'}`}>Full Color (CMYK)</button>
                                    <button onClick={() => setColoresDorso('1')} className={`px-3 py-2 rounded text-xs font-bold border transition-all ${coloresDorso === '1' ? 'bg-gray-800 text-white border-black' : 'border-gray-200 text-gray-400'}`}>Solo Negro (K)</button>
                                    <button onClick={() => setColoresDorso('0')} className={`px-3 py-2 rounded text-xs font-bold border transition-all ${coloresDorso === '0' ? 'bg-red-50 border-red-500 text-red-600' : 'border-gray-200 text-gray-400'}`}>Sin Impresión</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 4: Acabados */}
                    <div>
                        <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4"/> 4. Acabados Adicionales
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.keys(acabados).map((key) => (
                                <label key={key} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all select-none ${acabados[key as keyof typeof acabados] ? 'border-brand-blue bg-blue-50 dark:bg-blue-900/30 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                    <input type="checkbox" checked={acabados[key as keyof typeof acabados]} onChange={() => toggleAcabado(key as keyof typeof acabados)} className="h-4 w-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue" />
                                    <span className="ml-2 text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Panel Derecho - Resumen */}
                <div className="lg:w-96 flex-shrink-0 bg-gray-900 text-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-gray-700">
                        <h2 className="text-lg font-bold text-white mb-1">Cotización</h2>
                        <p className="text-xs text-gray-400">Cálculo basado en costos de material + producción.</p>
                    </div>
                    
                    <div className="p-6 flex-grow space-y-5 overflow-y-auto">
                        {/* Visualizer */}
                        <div className="flex justify-center mb-2">
                            <div className="relative border-2 border-dashed border-gray-600 bg-gray-800 w-32 h-44 shadow-lg flex flex-col items-center justify-center rounded-lg">
                                <div className="text-xs text-gray-400 text-center font-mono">
                                    {anchoFinal}cm x {altoFinal}cm
                                </div>
                                {resultado && (
                                    <div className="mt-2 bg-brand-blue text-white text-[10px] px-2 py-0.5 rounded font-bold">
                                        {resultado.cortesPorPliego} por pliego
                                    </div>
                                )}
                            </div>
                        </div>

                        {resultado && (
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                    <span className="text-gray-400">Papel ({resultado.hojasReales} pliegos)</span>
                                    <span className="font-mono">{formatCurrency(resultado.costoPapel)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                    <span className="text-gray-400">Tinta & Impresión</span>
                                    <span className="font-mono">{formatCurrency(resultado.costoTinta)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                    <span className="text-gray-400">Acabados</span>
                                    <span className="font-mono">{formatCurrency(resultado.costoAcabados)}</span>
                                </div>
                                
                                <div className="pt-2">
                                    <div className="flex justify-between text-yellow-400 font-bold mb-1">
                                        <span>Costo Producción</span>
                                        <span>{formatCurrency(resultado.costoTotal)}</span>
                                    </div>
                                    <div className="text-[10px] text-right text-gray-500">
                                        Unitario: {formatCurrency(resultado.costoTotal / cantidad)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-gray-800">
                        <div className="mb-4 text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Precio de Venta Sugerido</p>
                            <p className="text-4xl font-extrabold text-white tracking-tight">{resultado ? formatCurrency(resultado.precioSugerido) : '$0.00'}</p>
                            <p className="text-center text-sm font-medium text-brand-blue mt-1 bg-blue-900/30 inline-block px-3 py-1 rounded-full">
                                {resultado ? `${formatCurrency(resultado.precioUnitario)} c/u` : ''}
                            </p>
                        </div>
                        <button className="w-full py-3.5 bg-brand-blue text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                            <ArrowRightIcon className="h-5 w-5" />
                            Aplicar al Pedido
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculadoraPreciosPage;
