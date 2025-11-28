
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, DocumentIcon, ArrowRightIcon, CheckCircleIcon, PrinterIcon, BoxIcon, CloseIcon, RulerIcon, InfoIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

// --- TIPOS DE DATOS ---
interface PaperType {
    id: string;
    nombre: string;
    ancho: number; // cm
    alto: number; // cm
    gramajes: number[];
    categoria: 'Comercial' | 'Cartulina' | 'Especial';
    precioResmaBase: number; // Precio base estimado para el cálculo
}

// --- BASE DE DATOS MAESTRA (FUSIONADA Y MEJORADA) ---
const PAPERS_DB: PaperType[] = [
    // Papeles Comerciales
    { id: 'bond_61x86', nombre: 'Bond (Pliego Estándar)', ancho: 61, alto: 86, gramajes: [60, 75, 90], categoria: 'Comercial', precioResmaBase: 32.00 },
    { id: 'bond_70x100', nombre: 'Bond (Pliego Grande)', ancho: 70, alto: 100, gramajes: [75, 90, 120], categoria: 'Comercial', precioResmaBase: 45.00 },
    { id: 'couche_70x100', nombre: 'Couché (Brillante/Mate)', ancho: 70, alto: 100, gramajes: [115, 150, 200, 250, 300], categoria: 'Comercial', precioResmaBase: 55.00 },
    { id: 'periodico_69x89', nombre: 'Papel Periódico', ancho: 69, alto: 89, gramajes: [45, 48], categoria: 'Comercial', precioResmaBase: 15.00 },
    { id: 'quimico_61x86', nombre: 'Químico (Autocopia)', ancho: 61, alto: 86, gramajes: [50, 55], categoria: 'Comercial', precioResmaBase: 42.00 },
    
    // Cartulinas
    { id: 'bristol_50x65', nombre: 'Cartulina Bristol', ancho: 50, alto: 65, gramajes: [150], categoria: 'Cartulina', precioResmaBase: 18.00 },
    { id: 'hilo_65x90', nombre: 'Cartulina Hilo', ancho: 65, alto: 90, gramajes: [180, 220], categoria: 'Cartulina', precioResmaBase: 90.00 },
    { id: 'opalina_70x100', nombre: 'Cartulina Opalina', ancho: 70, alto: 100, gramajes: [180, 200, 220], categoria: 'Cartulina', precioResmaBase: 85.00 },
    { id: 'maule_70x100', nombre: 'Maule / Esmaltada', ancho: 70, alto: 100, gramajes: [250, 300, 350], categoria: 'Cartulina', precioResmaBase: 60.00 },
    
    // Especiales
    { id: 'adhesivo_70x100', nombre: 'Papel Adhesivo', ancho: 70, alto: 100, gramajes: [80], categoria: 'Especial', precioResmaBase: 120.00 },
    { id: 'kraft_70x100', nombre: 'Papel Kraft', ancho: 70, alto: 100, gramajes: [80, 120], categoria: 'Especial', precioResmaBase: 45.00 },
];

const COSTOS_PRODUCCION = {
    TINTA_CMYK_CM2: 0.0000008, 
    TINTA_NEGRO_CM2: 0.0000004,
    QUEMADO_PLACA: 4.50, // Promedio GTO/Roland
    ARRANQUE_MAQUINA: 15.00,
    MILLAR_IMPRESION: 8.00, 
    CORTE_GUILLOTINA: 2.00,
    ARMADO_BLOCK: 0.15 // Por block
};

const COSTOS_ACABADOS = {
    BARNIZ_UV: 0.02, 
    LAMINADO: 0.04, 
    TROQUELADO_BASE: 25.00, // Costo del troquel físico
    TROQUELADO_UNIT: 0.01,
    ANILLADO: 0.15,
    NUMERACION: 0.015,
};

// --- Componente Modal Guía Maestra ---
const ReferenceTableModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/70 z-[60] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 bg-brand-blue text-white rounded-t-2xl">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><DocumentIcon className="w-6 h-6"/> Tabla Maestra de Papeles</h2>
                    <p className="text-blue-100 text-sm mt-1">Formatos estándar disponibles en Ecuador</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><CloseIcon className="w-6 h-6 text-white" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 flex-grow">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Papel / Sustrato</th>
                                <th className="px-4 py-3">Medidas Pliego</th>
                                <th className="px-4 py-3">Gramajes Comunes</th>
                                <th className="px-4 py-3">Categoría</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {PAPERS_DB.map((paper, i) => (
                                <tr key={i} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                    <td className="px-4 py-3 font-bold text-gray-800 dark:text-white">{paper.nombre}</td>
                                    <td className="px-4 py-3 text-brand-blue font-mono">{paper.ancho} x {paper.alto} cm</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{paper.gramajes.join(', ')} g</td>
                                    <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-semibold">{paper.categoria}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="p-4 border-t dark:border-gray-700 text-right bg-white dark:bg-gray-800 rounded-b-2xl">
                <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors">Cerrar</button>
            </div>
        </div>
    </div>
);

// --- Componente Principal ---

const CalculadoraPreciosPage: React.FC = () => {
    const [showGuide, setShowGuide] = useState(false);
    
    // Inputs Principales
    const [selectedPaperId, setSelectedPaperId] = useState<string>('bond_61x86');
    const [selectedGramaje, setSelectedGramaje] = useState<number>(75);
    const [cantidadJuegos, setCantidadJuegos] = useState(1000);
    const [partes, setPartes] = useState(1); // 1 = Solo original, 2 = Orig+Copia, etc.
    
    // Dimensiones Finales
    const [anchoFinal, setAnchoFinal] = useState(21.0); 
    const [altoFinal, setAltoFinal] = useState(29.7);
    
    // Impresión
    const [coloresFrente, setColoresFrente] = useState<'4' | '1' | '0'>('4');
    const [coloresDorso, setColoresDorso] = useState<'4' | '1' | '0'>('0');
    
    // Acabados
    const [acabados, setAcabados] = useState({
        barnizUV: false,
        laminado: false,
        troquelado: false,
        anillado: false,
        numeracion: false,
        encolado: false
    });

    const [resultado, setResultado] = useState<any>(null);

    // Efecto para actualizar gramaje si cambia el papel
    useEffect(() => {
        const paper = PAPERS_DB.find(p => p.id === selectedPaperId);
        if (paper && !paper.gramajes.includes(selectedGramaje)) {
            setSelectedGramaje(paper.gramajes[0]);
        }
    }, [selectedPaperId]);

    // Cálculo Principal
    useEffect(() => {
        const paper = PAPERS_DB.find(p => p.id === selectedPaperId);
        if (!paper) return;

        // 1. Algoritmo de Cortes (Best Fit)
        // Intenta encajar vertical y horizontalmente para ver cuál rinde más
        const fitVertical = Math.floor(paper.ancho / anchoFinal) * Math.floor(paper.alto / altoFinal);
        const fitHorizontal = Math.floor(paper.ancho / altoFinal) * Math.floor(paper.alto / anchoFinal);
        
        // También considera si se puede mezclar (simple heuristic for generic fit)
        // Pero para imprenta offset, usualmente se define una dirección de fibra. 
        // Usaremos el máximo simple para esta versión.
        const cortesPorPliego = Math.max(fitVertical, fitHorizontal, 0);

        if (cortesPorPliego === 0) {
            setResultado(null);
            return;
        }

        // 2. Cálculo de Material
        const totalUnidadesRequeridas = cantidadJuegos * partes;
        const pliegosTeoricos = totalUnidadesRequeridas / cortesPorPliego;
        
        // Merma (Desperdicio)
        const mermaBase = 0.10; // 10% base (arranque, pruebas)
        const mermaColor = (parseInt(coloresFrente) + parseInt(coloresDorso)) * 0.015;
        const totalMerma = mermaBase + mermaColor;
        
        const pliegosReales = Math.ceil(pliegosTeoricos * (1 + totalMerma));
        const resmasNecesarias = pliegosReales / 500;

        // Ajuste de precio por gramaje (heurística simple: +10% por cada salto de gramaje desde base)
        const baseIndex = paper.gramajes.indexOf(paper.gramajes[0]);
        const currentIndex = paper.gramajes.indexOf(selectedGramaje);
        const factorGramaje = 1 + ((currentIndex - baseIndex) * 0.15);
        
        const precioResma = paper.precioResmaBase * factorGramaje;
        const costoPapelTotal = resmasNecesarias * precioResma;

        // 3. Costo Impresión
        const areaCm2 = anchoFinal * altoFinal;
        const tirajeTotal = cantidadJuegos; // Número de "pasadas" o juegos
        const areaTotalTiraje = areaCm2 * tirajeTotal * partes; 
        
        const costoTinta = (areaTotalTiraje * parseInt(coloresFrente) * COSTOS_PRODUCCION.TINTA_CMYK_CM2) +
                           (areaTotalTiraje * parseInt(coloresDorso) * COSTOS_PRODUCCION.TINTA_CMYK_CM2);
        
        const numPlacas = parseInt(coloresFrente) + parseInt(coloresDorso);
        const costoPlacas = numPlacas * COSTOS_PRODUCCION.QUEMADO_PLACA;
        
        // Costo máquina (millares)
        const millaresReales = Math.ceil(tirajeTotal / 1000);
        const costoTiraje = COSTOS_PRODUCCION.ARRANQUE_MAQUINA + (millaresReales * COSTOS_PRODUCCION.MILLAR_IMPRESION);
        
        const costoImpresionTotal = costoTinta + costoPlacas + costoTiraje + COSTOS_PRODUCCION.CORTE_GUILLOTINA;

        // 4. Costo Acabados
        let costoAcabados = 0;
        if (acabados.barnizUV) costoAcabados += totalUnidadesRequeridas * COSTOS_ACABADOS.BARNIZ_UV;
        if (acabados.laminado) costoAcabados += totalUnidadesRequeridas * COSTOS_ACABADOS.LAMINADO;
        if (acabados.troquelado) costoAcabados += COSTOS_ACABADOS.TROQUELADO_BASE + (totalUnidadesRequeridas * COSTOS_ACABADOS.TROQUELADO_UNIT);
        if (acabados.anillado) costoAcabados += cantidadJuegos * COSTOS_ACABADOS.ANILLADO;
        if (acabados.numeracion) costoAcabados += totalUnidadesRequeridas * COSTOS_ACABADOS.NUMERACION;
        if (acabados.encolado) costoAcabados += (totalUnidadesRequeridas / 100) * COSTOS_PRODUCCION.ARMADO_BLOCK;

        // 5. Totales
        const costoTotal = costoPapelTotal + costoImpresionTotal + costoAcabados;
        
        // Margen inteligente
        let margen = 0.60; 
        if (cantidadJuegos >= 1000) margen = 0.45;
        if (cantidadJuegos >= 5000) margen = 0.35;
        if (cantidadJuegos < 100) margen = 1.20; 

        const precioVenta = costoTotal * (1 + margen);

        setResultado({
            cortesPorPliego,
            pliegosReales,
            resmasNecesarias,
            costoPapel: costoPapelTotal,
            costoImpresion: costoImpresionTotal,
            costoAcabados,
            costoTotal,
            precioVenta,
            unitario: precioVenta / cantidadJuegos,
            totalUnidades: totalUnidadesRequeridas
        });

    }, [cantidadJuegos, partes, selectedPaperId, selectedGramaje, anchoFinal, altoFinal, coloresFrente, coloresDorso, acabados]);

    const toggleAcabado = (key: keyof typeof acabados) => setAcabados(p => ({ ...p, [key]: !p[key] }));

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-blue p-2 rounded-lg text-white shadow-lg">
                        <CalculatorIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculadora Técnica Offset</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Optimización de cortes y costos Ecuador</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowGuide(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg font-bold hover:bg-yellow-200 transition-colors border border-yellow-200 dark:border-yellow-700"
                >
                    <InfoIcon className="w-5 h-5"/> Ver Tabla Maestra
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* --- LEFT PANEL: INPUTS --- */}
                <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 overflow-y-auto border border-gray-200 dark:border-gray-700 custom-scrollbar">
                    
                    {/* SECCIÓN 1: PAPEL */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg w-fit">
                            <BoxIcon className="w-4 h-4"/> 1. Selección de Papel
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Papel y Formato</label>
                                <select value={selectedPaperId} onChange={e => setSelectedPaperId(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue outline-none">
                                    {PAPERS_DB.map(paper => (
                                        <option key={paper.id} value={paper.id}>
                                            {paper.nombre} - {paper.ancho}x{paper.alto}cm
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Gramaje (Espesor)</label>
                                <select value={selectedGramaje} onChange={e => setSelectedGramaje(Number(e.target.value))} className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue outline-none bg-gray-50 dark:bg-gray-800">
                                    {PAPERS_DB.find(p => p.id === selectedPaperId)?.gramajes.map(g => (
                                        <option key={g} value={g}>{g} g/m²</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: FORMATO Y CANTIDAD */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg w-fit">
                            <RulerIcon className="w-4 h-4"/> 2. Formato y Tiraje
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                            <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ancho Final (cm)</label>
                                    <input type="number" value={anchoFinal} onChange={e => setAnchoFinal(parseFloat(e.target.value) || 0)} step="0.1" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-center" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alto Final (cm)</label>
                                    <input type="number" value={altoFinal} onChange={e => setAltoFinal(parseFloat(e.target.value) || 0)} step="0.1" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-center" />
                                </div>
                                <div className="col-span-2 flex gap-2 justify-center">
                                    <button onClick={() => { setAnchoFinal(21); setAltoFinal(29.7); }} className="text-[10px] bg-white border border-gray-300 px-3 py-1 rounded hover:bg-blue-50">A4</button>
                                    <button onClick={() => { setAnchoFinal(14.8); setAltoFinal(21); }} className="text-[10px] bg-white border border-gray-300 px-3 py-1 rounded hover:bg-blue-50">A5</button>
                                    <button onClick={() => { setAnchoFinal(10.5); setAltoFinal(14.8); }} className="text-[10px] bg-white border border-gray-300 px-3 py-1 rounded hover:bg-blue-50">A6</button>
                                    <button onClick={() => { setAnchoFinal(9); setAltoFinal(5.5); }} className="text-[10px] bg-white border border-gray-300 px-3 py-1 rounded hover:bg-blue-50">Tarjeta</button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Cantidad (Juegos/Unidades)</label>
                                    <input type="number" value={cantidadJuegos} onChange={e => setCantidadJuegos(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono font-bold" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Partes (Orig + Copias)</label>
                                    <input type="number" value={partes} onChange={e => setPartes(Math.max(1, parseInt(e.target.value) || 1))} className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono font-bold" placeholder="1 = Solo original" />
                                    <p className="text-[10px] text-gray-400 mt-1">Ej: Factura (Orig+1Copia) = 2 partes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 3: IMPRESIÓN Y ACABADOS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg w-fit">
                                <PrinterIcon className="w-4 h-4"/> 3. Tintas
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-2 border rounded-lg">
                                    <span className="text-sm font-bold text-gray-600">Frente (Tiro)</span>
                                    <div className="flex gap-1">
                                        {['4', '1', '0'].map(opt => (
                                            <button key={opt} onClick={() => setColoresFrente(opt as any)} className={`px-3 py-1 rounded text-xs font-bold ${coloresFrente === opt ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                {opt === '4' ? 'Full' : opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-2 border rounded-lg">
                                    <span className="text-sm font-bold text-gray-600">Reverso (Retiro)</span>
                                    <div className="flex gap-1">
                                        {['4', '1', '0'].map(opt => (
                                            <button key={opt} onClick={() => setColoresDorso(opt as any)} className={`px-3 py-1 rounded text-xs font-bold ${coloresDorso === opt ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                {opt === '4' ? 'Full' : opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg w-fit">
                                <CheckCircleIcon className="w-4 h-4"/> 4. Acabados
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.keys(acabados).map((key) => (
                                    <label key={key} className={`flex items-center p-2 border rounded-lg cursor-pointer transition-all select-none hover:shadow-sm ${acabados[key as keyof typeof acabados] ? 'border-brand-blue bg-blue-50 dark:bg-blue-900/30 ring-1 ring-brand-blue' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                                        <input type="checkbox" checked={acabados[key as keyof typeof acabados]} onChange={() => toggleAcabado(key as keyof typeof acabados)} className="h-4 w-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue" />
                                        <span className="ml-2 text-xs font-bold uppercase text-gray-600 dark:text-gray-300">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT PANEL: RESULTS --- */}
                <div className="lg:w-96 flex-shrink-0 bg-gray-900 text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-800">
                    <div className="p-6 border-b border-gray-800 bg-gray-950">
                        <h2 className="text-xl font-bold text-white mb-1">Cotización</h2>
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>{cantidadJuegos} juegos ({partes} partes)</span>
                            <span>{anchoFinal}x{altoFinal}cm</span>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-grow space-y-6 overflow-y-auto">
                        {/* Visualizador de Cortes */}
                        <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-xl border border-gray-700 border-dashed relative overflow-hidden">
                            <div className="text-center z-10">
                                <p className="text-xs text-gray-400 uppercase mb-2">Aprovechamiento</p>
                                <div className="text-4xl font-black text-brand-blue leading-none">{resultado?.cortesPorPliego || 0}</div>
                                <p className="text-[10px] text-gray-400 uppercase mt-1">unidades / pliego</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 text-gray-700 opacity-20 transform rotate-12">
                                <BoxIcon className="w-24 h-24"/>
                            </div>
                        </div>

                        {resultado && (
                            <div className="space-y-3 text-sm">
                                <div className="bg-gray-800/50 p-3 rounded-lg">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-400">Total Piezas:</span>
                                        <span className="font-bold">{resultado.totalUnidades}</span>
                                    </div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-400">Pliegos Reales:</span>
                                        <span className="font-bold text-yellow-400">{resultado.pliegosReales}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                                        <span className="text-gray-400">Resmas Aprox:</span>
                                        <span className="font-mono">{resultado.resmasNecesarias.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-gray-800">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Papel</span>
                                        <span className="font-mono">{formatCurrency(resultado.costoPapel)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Impresión</span>
                                        <span className="font-mono">{formatCurrency(resultado.costoImpresion)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Acabados</span>
                                        <span className="font-mono">{formatCurrency(resultado.costoAcabados)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                        <span className="text-yellow-500 font-bold uppercase text-xs">Costo Producción</span>
                                        <span className="font-bold">{formatCurrency(resultado.costoTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-brand-blue relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="mb-4 text-center">
                                <p className="text-xs text-blue-200 uppercase tracking-widest mb-1 font-bold">Precio Sugerido Venta</p>
                                <p className="text-5xl font-black text-white tracking-tight leading-none">{resultado ? formatCurrency(resultado.precioVenta) : '$0.00'}</p>
                                <div className="flex justify-center gap-2 mt-2">
                                    <span className="text-center text-xs font-bold text-brand-blue bg-white px-3 py-1 rounded-full">
                                        {resultado ? `${formatCurrency(resultado.unitario)} c/u` : '-'}
                                    </span>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 transform active:scale-95 border border-gray-700">
                                <ArrowRightIcon className="h-5 w-5 text-green-400" />
                                Guardar Presupuesto
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showGuide && <ReferenceTableModal onClose={() => setShowGuide(false)} />}
        </div>
    );
};

export default CalculadoraPreciosPage;
