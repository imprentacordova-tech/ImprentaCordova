
import React, { useState, useEffect } from 'react';
import { CalculatorIcon, DocumentIcon, ArrowRightIcon, CheckCircleIcon, PrinterIcon, BoxIcon, ExclamationTriangleIcon, ArrowDownIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

// --- Constantes de Costos (Ecuador 2025) ---

// Tamaños de Pliego Estándar en el mercado local
const FORMATOS_PLIEGO = [
    { name: 'Estándar (61 x 86 cm)', w: 61, h: 86 },
    { name: 'Grande (70 x 100 cm)', w: 70, h: 100 },
    { name: 'Gigante (79 x 112 cm)', w: 79, h: 112 },
    { name: 'Medio Pliego (43 x 61 cm)', w: 43, h: 61 },
    { name: 'Oficio (33 x 21.5 cm)', w: 33, h: 21.5 }, // Para impresión digital directa
    { name: 'A3+ (32 x 48 cm)', w: 32, h: 48 },
    { name: 'A4 (21 x 29.7 cm)', w: 21, h: 29.7 }
];

// Estructura Jerárquica de Papeles: Tipo -> Gramaje -> Precio por Resma (500 pliegos del tamaño seleccionado)
// Nota: Los precios base asumen tamaño 61x86 o 70x100 según el tipo común. 
// En una app real, esto podría ser más dinámico, aquí usamos un promedio referencial.
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
        '230g Glossy (Doble Cara)': 58.00
    },
    'Adhesivos': {
        'Papel Adhesivo Brillo': 48.00,
        'Papel Adhesivo Mate': 52.00,
        'Vinil PVC': 110.00
    }
};

const COSTOS_TINTA = {
    PRECIO_LITRO_OFFSET_CMYK: 85.00,
    PRECIO_LITRO_OFFSET_NEGRO: 45.00,
    RENDIMIENTO_OFFSET_CMYK: 50000, // cm2 por litro
    RENDIMIENTO_OFFSET_NEGRO: 100000, // cm2 por litro
    FACTOR_COBERTURA: 0.002, // ml/cm2 promedio
    COSTO_MINIMO_ARRANQUE: 5.00 // Placas, limpieza, etc.
};

const COSTOS_ACABADOS = {
    BARNIZ_UV: 0.015, // por unidad
    LAMINADO_MATE: 0.03, // por unidad A4 aprox
    TROQUELADO: 0.05, // base
    ANILLADO: 0.35,
    ENCUADERNACION: 0.50,
    DOBLEZ: 0.005, 
    NUMERACION: 0.01,
    ENGOMADO: 0.10 // Por block
};

interface CalculoResult {
    costoPapel: number;
    costoTinta: number;
    costoAcabados: number;
    costoTotal: number;
    precioSugerido: number;
    precioUnitario: number;
    // Datos técnicos
    hojasReales: number; // Pliegos totales a comprar
    cortesPorPliego: number; // Rendimiento por pliego
    desperdicioPorcentaje: number;
    resmasTotales: number;
    orientacionOptima: 'Normal' | 'Rotada';
}

const CalculadoraPreciosPage: React.FC = () => {
    // --- Estados del Formulario ---
    const [tipoTrabajo, setTipoTrabajo] = useState<'general' | 'sri'>('general');
    const [cantidad, setCantidad] = useState(1000); // Cantidad de "Juegos" o "Unidades Finales"
    const [partes, setPartes] = useState(1); // 1 = Volante, 2 = Original+Copia, etc.
    
    // Configuración Papel
    const [tipoPapel, setTipoPapel] = useState('Bond');
    const [gramaje, setGramaje] = useState('75g (Estándar)');
    const [pliegoSeleccionado, setPliegoSeleccionado] = useState(FORMATOS_PLIEGO[0]); // 61x86 default
    
    // Tamaño Final
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
        numeracion: false,
        engomado: false
    });

    // Resultado
    const [resultado, setResultado] = useState<CalculoResult | null>(null);

    // Efecto para actualizar gramaje por defecto
    useEffect(() => {
        const opcionesGramaje = Object.keys(CATALOGO_PAPELES[tipoPapel]);
        if (!opcionesGramaje.includes(gramaje)) {
            setGramaje(opcionesGramaje[0]);
        }
        // Sugerir pliego según papel (lógica simple)
        if (tipoPapel.includes('Couché') || tipoPapel.includes('Fotográfico')) {
            setPliegoSeleccionado(FORMATOS_PLIEGO.find(p => p.w === 70) || FORMATOS_PLIEGO[1]);
        } else {
            setPliegoSeleccionado(FORMATOS_PLIEGO.find(p => p.w === 61) || FORMATOS_PLIEGO[0]);
        }
    }, [tipoPapel]);

    // --- Lógica de Cálculo Mejorada (Best Fit) ---
    useEffect(() => {
        calcularPresupuesto();
    }, [cantidad, partes, tipoPapel, gramaje, pliegoSeleccionado, anchoFinal, altoFinal, coloresFrente, coloresDorso, acabados, tipoTrabajo]);

    const calcularCortesOptimos = (sheetW: number, sheetH: number, cutW: number, cutH: number) => {
        // Validación básica
        if (cutW <= 0 || cutH <= 0 || sheetW <= 0 || sheetH <= 0) return { count: 0, rotation: 'Normal' as const };
        if (cutW > Math.max(sheetW, sheetH) || cutH > Math.max(sheetW, sheetH)) return { count: 0, rotation: 'Normal' as const };

        // 1. Orientación Normal
        const colsNormal = Math.floor(sheetW / cutW);
        const rowsNormal = Math.floor(sheetH / cutH);
        const totalNormal = colsNormal * rowsNormal;

        // 2. Orientación Rotada (Girando el arte 90 grados)
        const colsRotated = Math.floor(sheetW / cutH);
        const rowsRotated = Math.floor(sheetH / cutW);
        const totalRotated = colsRotated * rowsRotated;

        // Combinación Mixta (Algoritmo simple de guillotina - a veces sobran franjas donde caben rotados)
        // Por simplicidad en la UI, nos quedamos con el MAX de Normal vs Rotado, que cubre el 95% de casos de imprenta rápida.
        
        if (totalRotated > totalNormal) {
            return { count: totalRotated, rotation: 'Rotada' as const };
        }
        return { count: totalNormal, rotation: 'Normal' as const };
    };

    const calcularPresupuesto = () => {
        // --- 1. Papel ---
        const { count: cortesPorPliego, rotation } = calcularCortesOptimos(pliegoSeleccionado.w, pliegoSeleccionado.h, anchoFinal, altoFinal);
        
        if (cortesPorPliego === 0) {
            setResultado(null); // No cabe
            return;
        }

        // Total de piezas necesarias = Cantidad Juegos * Partes por Juego
        // Ej: 1000 facturas (original y copia) = 2000 hojas finales
        const piezasTotales = cantidad * partes;
        
        // Pliegos necesarios teóricos
        const pliegosTeoricos = piezasTotales / cortesPorPliego;
        
        // Factor de desperdicio (Maculatura)
        // Entre más corto el tiraje, mayor impacto del desperdicio de puesta a punto
        let porcentajeDesperdicio = 0.05; // 5% base
        if (cantidad < 100) porcentajeDesperdicio = 0.15; // 15% para pruebas en tirajes mini
        else if (cantidad < 1000) porcentajeDesperdicio = 0.10;

        const pliegosReales = Math.ceil(pliegosTeoricos * (1 + porcentajeDesperdicio));
        
        const precioResma = CATALOGO_PAPELES[tipoPapel][gramaje] || 0;
        // Ajuste de precio resma según tamaño de pliego (Proporcional al estándar 61x86 o 70x100)
        // Simplificación: Asumimos el precio de lista es para el pliego seleccionado para no complicar en exceso
        const costoPapelTotal = (pliegosReales / 500) * precioResma;

        // --- 2. Tinta e Impresión ---
        const areaTotalCm2 = anchoFinal * altoFinal * piezasTotales;
        
        let costoTinta = COSTOS_TINTA.COSTO_MINIMO_ARRANQUE; // Base de arranque
        
        const calcInkCost = (modo: string) => {
            if (modo === '4') return (areaTotalCm2 * 4 * COSTOS_TINTA.FACTOR_COBERTURA * COSTOS_TINTA.PRECIO_LITRO_OFFSET_CMYK) / COSTOS_TINTA.RENDIMIENTO_OFFSET_CMYK;
            if (modo === '1') return (areaTotalCm2 * 1 * COSTOS_TINTA.FACTOR_COBERTURA * COSTOS_TINTA.PRECIO_LITRO_OFFSET_NEGRO) / COSTOS_TINTA.RENDIMIENTO_OFFSET_NEGRO;
            return 0;
        };

        costoTinta += calcInkCost(coloresFrente) + calcInkCost(coloresDorso);

        // --- 3. Acabados ---
        let costoAcabadosTotal = 0;
        // Estos costos se basan en la cantidad de "juegos" finales, no piezas sueltas (generalmente)
        if (acabados.barnizUV) costoAcabadosTotal += Math.max(cantidad * COSTOS_ACABADOS.BARNIZ_UV, 5.00); 
        if (acabados.laminadoMate) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.LAMINADO_MATE;
        if (acabados.troquelado) costoAcabadosTotal += Math.max(cantidad * COSTOS_ACABADOS.TROQUELADO, 10.00); 
        if (acabados.anillado) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.ANILLADO;
        if (acabados.doblez) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.DOBLEZ * partes; // Se dobla cada hoja
        if (acabados.numeracion) costoAcabadosTotal += cantidad * COSTOS_ACABADOS.NUMERACION * partes; // Se numera cada hoja
        if (acabados.engomado) costoAcabadosTotal += (cantidad / 100) * COSTOS_ACABADOS.ENGOMADO; // Aprox por block de 100

        // --- 4. Totales y Margen ---
        const costoTotalProduccion = costoPapelTotal + costoTinta + costoAcabadosTotal;
        
        // Margen dinámico: Menos cantidad = mayor margen porcentual
        let margen = tipoTrabajo === 'sri' ? 0.35 : 0.55; 
        if (cantidad < 100) margen += 0.50; // Margen muy alto para unitarios
        else if (cantidad < 500) margen += 0.20;

        const precioSugeridoTotal = costoTotalProduccion * (1 + margen);

        // Cálculo de área utilizada vs área disponible para métrica de desperdicio
        const areaPliego = pliegoSeleccionado.w * pliegoSeleccionado.h;
        const areaUtilizadaPorCorte = (anchoFinal * altoFinal) * cortesPorPliego;
        const porcentajeUsoPliego = (areaUtilizadaPorCorte / areaPliego) * 100;

        setResultado({
            costoPapel: costoPapelTotal,
            costoTinta: costoTinta,
            costoAcabados: costoAcabadosTotal,
            costoTotal: costoTotalProduccion,
            precioSugerido: precioSugeridoTotal,
            precioUnitario: precioSugeridoTotal / cantidad,
            hojasReales: pliegosReales,
            cortesPorPliego: cortesPorPliego,
            desperdicioPorcentaje: 100 - porcentajeUsoPliego,
            resmasTotales: parseFloat((pliegosReales / 500).toFixed(2)),
            orientacionOptima: rotation
        });
    };

    const toggleAcabado = (key: keyof typeof acabados) => {
        setAcabados(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="flex flex-col h-full pb-6">
            <div className="flex items-center gap-3 mb-6 flex-shrink-0">
                <div className="bg-brand-blue p-2 rounded-lg text-white">
                    <CalculatorIcon className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculadora Inteligente</h1>
                    <p className="text-sm text-gray-500">Optimización de cortes y costos de producción</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Panel Izquierdo - Inputs */}
                <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 overflow-y-auto border border-gray-200 dark:border-gray-700 custom-scrollbar">
                    
                    {/* Sección 1: Definición del Trabajo */}
                    <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                        <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BoxIcon className="w-4 h-4"/> 1. Definición del Trabajo
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Cantidad (Juegos)</label>
                                <input type="number" value={cantidad} onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-bold text-lg focus:ring-2 focus:ring-brand-blue" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Partes por Juego</label>
                                <div className="flex items-center">
                                    <button onClick={() => setPartes(Math.max(1, partes - 1))} className="bg-white dark:bg-gray-700 border px-3 py-2 rounded-l-lg hover:bg-gray-100">-</button>
                                    <input type="number" value={partes} onChange={e => setPartes(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-2 border-t border-b text-center font-bold dark:bg-gray-700 dark:border-gray-600" />
                                    <button onClick={() => setPartes(partes + 1)} className="bg-white dark:bg-gray-700 border px-3 py-2 rounded-r-lg hover:bg-gray-100">+</button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">Ej: Factura (Original+Copia) = 2 partes</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Tipo</label>
                                <select value={tipoTrabajo} onChange={e => setTipoTrabajo(e.target.value as any)} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-white">
                                    <option value="general">Publicitario / Comercial</option>
                                    <option value="sri">Documentos SRI</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Papel y Formato */}
                    <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2">
                            <DocumentIcon className="w-4 h-4"/> 2. Papel y Corte
                        </h3>
                        
                        {/* Selector de Papel */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material</label>
                                <select value={tipoPapel} onChange={e => setTipoPapel(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue">
                                    {Object.keys(CATALOGO_PAPELES).map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gramaje</label>
                                <select value={gramaje} onChange={e => setGramaje(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue">
                                    {Object.keys(CATALOGO_PAPELES[tipoPapel]).map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Dimensiones */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pliego de Compra</label>
                                <select 
                                    value={pliegoSeleccionado.name} 
                                    onChange={e => setPliegoSeleccionado(FORMATOS_PLIEGO.find(p => p.name === e.target.value) || FORMATOS_PLIEGO[0])} 
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm font-mono"
                                >
                                    {FORMATOS_PLIEGO.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tamaño Final del Corte (cm)</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" value={anchoFinal} onChange={e => setAnchoFinal(parseFloat(e.target.value) || 0)} step="0.1" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-center" placeholder="Ancho" />
                                    <span className="text-gray-400">x</span>
                                    <input type="number" value={altoFinal} onChange={e => setAltoFinal(parseFloat(e.target.value) || 0)} step="0.1" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-center" placeholder="Alto" />
                                </div>
                                <div className="flex gap-2 mt-2 justify-end">
                                    <button onClick={() => { setAnchoFinal(21); setAltoFinal(29.7); }} className="text-[10px] bg-white border px-2 py-1 rounded hover:bg-gray-50">A4</button>
                                    <button onClick={() => { setAnchoFinal(14.8); setAltoFinal(21); }} className="text-[10px] bg-white border px-2 py-1 rounded hover:bg-gray-50">A5</button>
                                    <button onClick={() => { setAnchoFinal(10.5); setAltoFinal(14.8); }} className="text-[10px] bg-white border px-2 py-1 rounded hover:bg-gray-50">A6</button>
                                    <button onClick={() => { setAnchoFinal(9); setAltoFinal(5.5); }} className="text-[10px] bg-white border px-2 py-1 rounded hover:bg-gray-50">Tarjeta</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 3: Impresión y Acabados */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><PrinterIcon className="w-4 h-4"/> Tintas</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Frente (Tiro)</span>
                                    <select value={coloresFrente} onChange={e => setColoresFrente(e.target.value as any)} className="p-1 border rounded text-sm bg-white dark:bg-gray-700">
                                        <option value="4">Full Color (4)</option>
                                        <option value="1">Negro (1)</option>
                                        <option value="0">Ninguno (0)</option>
                                    </select>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Dorso (Retiro)</span>
                                    <select value={coloresDorso} onChange={e => setColoresDorso(e.target.value as any)} className="p-1 border rounded text-sm bg-white dark:bg-gray-700">
                                        <option value="4">Full Color (4)</option>
                                        <option value="1">Negro (1)</option>
                                        <option value="0">Ninguno (0)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><CheckCircleIcon className="w-4 h-4"/> Acabados</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(acabados).map((key) => (
                                    <label key={key} className={`flex items-center p-1.5 rounded cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${acabados[key as keyof typeof acabados] ? 'text-brand-blue font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                        <input type="checkbox" checked={acabados[key as keyof typeof acabados]} onChange={() => toggleAcabado(key as keyof typeof acabados)} className="mr-2 h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" />
                                        <span className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho - Resumen Visual */}
                <div className="lg:w-96 flex-shrink-0 bg-gray-900 text-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-800">
                    <div className="p-6 border-b border-gray-700 bg-gray-950">
                        <h2 className="text-lg font-bold text-white mb-1">Análisis de Producción</h2>
                        <p className="text-xs text-gray-400">Datos técnicos y financieros</p>
                    </div>
                    
                    <div className="p-6 flex-grow space-y-6 overflow-y-auto">
                        
                        {/* Visualizador de Pliego */}
                        <div className="relative w-full aspect-[3/4] bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center p-4">
                            {resultado ? (
                                <div className="text-center w-full h-full flex flex-col justify-between">
                                    <div className="text-[10px] text-gray-400 font-mono w-full text-center border-b border-gray-700 pb-1">{pliegoSeleccionado.w} cm</div>
                                    <div className="flex-grow flex items-center justify-center relative">
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-gray-400 font-mono whitespace-nowrap -ml-4">{pliegoSeleccionado.h} cm</div>
                                        
                                        {/* Representación Abstracta de Cortes */}
                                        <div className="grid gap-0.5 p-2 bg-blue-900/30 rounded border border-blue-500/30" style={{ 
                                            gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(resultado.cortesPorPliego))}, 1fr)`,
                                            width: '80%', 
                                            height: '80%' 
                                        }}>
                                            {Array.from({ length: Math.min(resultado.cortesPorPliego, 20) }).map((_, i) => (
                                                <div key={i} className="bg-blue-500/20 border border-blue-500/50 rounded-sm"></div>
                                            ))}
                                            {resultado.cortesPorPliego > 20 && <div className="flex items-center justify-center text-[10px] text-blue-300">+</div>}
                                        </div>
                                    </div>
                                    <div className="bg-gray-900/80 absolute inset-0 flex flex-col items-center justify-center backdrop-blur-[1px] opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                        <span className="text-3xl font-black text-white">{resultado.cortesPorPliego}</span>
                                        <span className="text-xs uppercase font-bold tracking-wider">Unidades / Pliego</span>
                                        <span className="text-[10px] text-green-400 mt-1">Orientación {resultado.orientacionOptima}</span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-gray-600 text-sm">Configura las medidas para ver el resultado</span>
                            )}
                        </div>

                        {resultado && (
                            <div className="space-y-4">
                                {/* Métricas de Eficiencia */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Pliegos Totales</p>
                                        <p className="text-xl font-mono text-white">{resultado.hojasReales}</p>
                                        <p className="text-[9px] text-gray-500">{resultado.resmasTotales} resmas</p>
                                    </div>
                                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Desperdicio</p>
                                        <p className={`text-xl font-mono ${resultado.desperdicioPorcentaje > 15 ? 'text-red-400' : 'text-green-400'}`}>
                                            {resultado.desperdicioPorcentaje.toFixed(1)}%
                                        </p>
                                        <p className="text-[9px] text-gray-500">Papel no utilizable</p>
                                    </div>
                                </div>

                                {/* Desglose de Costos */}
                                <div className="bg-gray-800 rounded-lg p-4 text-xs space-y-2 border border-gray-700">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Papel</span>
                                        <span className="font-mono">{formatCurrency(resultado.costoPapel)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Tinta / Impresión</span>
                                        <span className="font-mono">{formatCurrency(resultado.costoTinta)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Acabados</span>
                                        <span className="font-mono">{formatCurrency(resultado.costoAcabados)}</span>
                                    </div>
                                    <div className="border-t border-gray-600 pt-2 mt-2 flex justify-between font-bold text-yellow-400">
                                        <span>Costo Producción</span>
                                        <span>{formatCurrency(resultado.costoTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-brand-blue">
                        <div className="text-center">
                            <p className="text-xs text-blue-200 uppercase tracking-widest mb-1 font-bold">Precio Sugerido Venta</p>
                            <p className="text-4xl font-black text-white tracking-tight">{resultado ? formatCurrency(resultado.precioSugerido) : '$0.00'}</p>
                            <div className="flex justify-center gap-4 mt-2">
                                <span className="text-xs bg-white/20 px-2 py-1 rounded text-white font-medium">
                                    {resultado ? `${formatCurrency(resultado.precioUnitario)} c/u` : '-'}
                                </span>
                                <span className="text-xs bg-white/20 px-2 py-1 rounded text-white font-medium">
                                    {partes > 1 ? `${partes} partes` : 'Simple'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculadoraPreciosPage;
