
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, DocumentIcon, ArrowRightIcon, CheckCircleIcon, PrinterIcon, BoxIcon, SearchIcon, CloseIcon, InfoIcon, RulerIcon } from '../components/Icons';
import { formatCurrency } from '../utils';

// --- BASE DE DATOS MAESTRA ECUADOR 2025 ---

const GUIA_PAPELES_ECUADOR = [
    {
        categoria: "Papeles Comerciales",
        items: [
            { codigo: "B-00X", nombre: "Bond", gramajes: "56, 75, 90g", formato: "61x86 cm / 70x100 cm", uso: "Membretes, Facturas, Libros" },
            { codigo: "C-00X", nombre: "Couché Brillante", gramajes: "115, 150, 200, 300g", formato: "70x100 cm", uso: "Volantes, Revistas, Afiches" },
            { codigo: "CM-00X", nombre: "Couché Mate", gramajes: "150, 200, 300g", formato: "70x100 cm", uso: "Tarjetas, Carpetas elegantes" },
            { codigo: "Q-00X", nombre: "Químico (Autocopia)", gramajes: "50-55g", formato: "61x86 cm", uso: "Facturación (Original CB, Copia CFB/CF)" },
            { codigo: "P-007", nombre: "Periódico", gramajes: "45-48g", formato: "69x89 cm", uso: "Volantes económicos, Diarios" }
        ]
    },
    {
        categoria: "Cartulinas y Especiales",
        items: [
            { codigo: "CT-001", nombre: "Bristol", gramajes: "150, 180g", formato: "50x65 cm", uso: "Fichas, Tarjetas básicas" },
            { codigo: "CT-004", nombre: "Hilo / Lino", gramajes: "180, 220g", formato: "65x90 cm", uso: "Tarjetas sociales, Diplomas" },
            { codigo: "CT-013", nombre: "Maule / Esmaltada", gramajes: "250-400g", formato: "70x100 cm", uso: "Cajas, Empaques (Reverso café/gris)" },
            { codigo: "CT-012", nombre: "Triplex / Sulfatada", gramajes: "300g", formato: "70x100 cm", uso: "Cajas cosméticos, Alimentos" },
            { codigo: "PE-004", nombre: "Kraft", gramajes: "80, 120, 200g", formato: "70x100 cm", uso: "Bolsas, Etiquetas ecológicas" },
            { codigo: "PE-001", nombre: "Adhesivo", gramajes: "80g (Papel) / PVC", formato: "70x100 cm", uso: "Etiquetas, Stickers" }
        ]
    }
];

// Precios Referenciales Resma (Aproximados Mercado Local)
const PRECIOS_RESMA: Record<string, number> = {
    'Bond 75g (61x86)': 32.00,
    'Bond 75g (70x100)': 45.00,
    'Bond 90g (61x86)': 38.00,
    'Bond 115g (61x86)': 48.00,
    'Couché 115g (70x100)': 55.00,
    'Couché 150g (70x100)': 72.00,
    'Couché 200g (70x100)': 95.00,
    'Couché 300g (70x100)': 140.00,
    'Químico CB (61x86)': 42.00,
    'Químico CFB (61x86)': 45.00,
    'Químico CF (61x86)': 40.00,
    'Adhesivo Papel (70x100)': 120.00,
    'Adhesivo PVC (70x100)': 280.00,
    'Bristol 150g (50x65)': 18.00,
    'Kraft 120g (70x100)': 45.00,
    'Opalina 200g (70x100)': 85.00,
    'Hilo 220g (65x90)': 90.00
};

const COSTOS_PRODUCCION = {
    TINTA_CMYK_CM2: 0.0000008, // Costo por cm2 cobertura media
    TINTA_NEGRO_CM2: 0.0000004,
    QUEMADO_PLACA_GTO: 3.50, // Placa GTO 46/52
    QUEMADO_PLACA_ROLAND: 6.00, // Placa formato mayor
    ARRANQUE_MAQUINA: 15.00, // Costo fijo por tiraje
    CORTE_GUILLOTINA: 2.00,
    MILLAR_IMPRESION: 8.00 // Costo operativo por cada 1000 tiros
};

const COSTOS_ACABADOS = {
    BARNIZ_UV: 0.02, // Unidad
    LAMINADO_MATE: 0.04, // Unidad A4
    TROQUELADO: 0.06, // Unidad
    ANILLADO: 0.15,
    NUMERACION: 0.015,
    ENCOLADO: 0.10 // Por block
};

// --- Componente Modal Guía Maestra ---
const ReferenceTableModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 bg-black/70 z-[60] flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 bg-brand-blue text-white rounded-t-2xl">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2"><DocumentIcon className="w-6 h-6"/> Tabla Maestra de Papeles Ecuador</h2>
                    <p className="text-blue-100 text-sm mt-1">Guía de referencia para imprentas (Proveedores: Papelesa, Vernaza, etc.)</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><CloseIcon className="w-6 h-6 text-white" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 flex-grow">
                {GUIA_PAPELES_ECUADOR.map((cat, idx) => (
                    <div key={idx} className="mb-8">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 px-2 border-l-4 border-brand-blue">{cat.categoria}</h3>
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Código</th>
                                        <th className="px-4 py-3">Papel</th>
                                        <th className="px-4 py-3">Gramajes (g/m²)</th>
                                        <th className="px-4 py-3">Formato Pliego</th>
                                        <th className="px-4 py-3">Uso Principal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {cat.items.map((item, i) => (
                                        <tr key={i} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.codigo}</td>
                                            <td className="px-4 py-3 font-bold text-gray-800 dark:text-white">{item.nombre}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.gramajes}</td>
                                            <td className="px-4 py-3 text-brand-blue font-medium">{item.formato}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.uso}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                        <h4 className="font-bold text-brand-blue mb-2">Guía de Cortes (Pliego 61x86 cm)</h4>
                        <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                            <li>• <strong>Tamaño A4:</strong> Salen 9 unidades (ajustado) u 8 con sangre.</li>
                            <li>• <strong>Tamaño Oficio:</strong> Salen 8-9 unidades.</li>
                            <li>• <strong>Tamaño A5:</strong> Salen 16-18 unidades.</li>
                            <li>• <strong>Uso:</strong> Ideal máquinas GTO 46/52.</li>
                        </ul>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-100 dark:border-orange-800">
                        <h4 className="font-bold text-orange-600 mb-2">Guía de Cortes (Pliego 70x100 cm)</h4>
                        <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                            <li>• <strong>Tamaño A4:</strong> Salen 9-10 unidades.</li>
                            <li>• <strong>Tamaño A3:</strong> Salen 4-5 unidades.</li>
                            <li>• <strong>Tabloide (12x18"):</strong> Salen 4 unidades cómodas.</li>
                            <li>• <strong>Uso:</strong> Estándar internacional y Couché.</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t dark:border-gray-700 text-right">
                <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors">Cerrar Guía</button>
            </div>
        </div>
    </div>
);

// --- Componente Principal ---

const CalculadoraPreciosPage: React.FC = () => {
    // --- Estados ---
    const [showGuide, setShowGuide] = useState(false);
    
    const [cantidad, setCantidad] = useState(1000);
    const [tipoPapel, setTipoPapel] = useState('Bond 75g');
    const [tamanoPliego, setTamanoPliego] = useState('61x86'); // Default Ecuador Bond
    
    // Medidas finales (cm)
    const [anchoFinal, setAnchoFinal] = useState(21.0); 
    const [altoFinal, setAltoFinal] = useState(29.7);
    
    // Impresión
    const [coloresFrente, setColoresFrente] = useState<'4' | '1' | '0'>('4');
    const [coloresDorso, setColoresDorso] = useState<'4' | '1' | '0'>('0');
    
    // Acabados
    const [acabados, setAcabados] = useState({
        barnizUV: false,
        laminadoMate: false,
        troquelado: false,
        anillado: false,
        numeracion: false,
        encolado: false
    });

    const [resultado, setResultado] = useState<any>(null);

    // Actualizar tamaño pliego sugerido al cambiar papel
    useEffect(() => {
        if (tipoPapel.includes('Couché') || tipoPapel.includes('Kraft') || tipoPapel.includes('Adhesivo')) {
            setTamanoPliego('70x100');
        } else if (tipoPapel.includes('Bond') || tipoPapel.includes('Químico')) {
            setTamanoPliego('61x86');
        } else if (tipoPapel.includes('Bristol')) {
            setTamanoPliego('50x65');
        } else if (tipoPapel.includes('Hilo')) {
            setTamanoPliego('65x90');
        }
    }, [tipoPapel]);

    useEffect(() => {
        calcular();
    }, [cantidad, tipoPapel, tamanoPliego, anchoFinal, altoFinal, coloresFrente, coloresDorso, acabados]);

    // --- Lógica de Cálculo ---
    const calcularCortes = (pliegoW: number, pliegoH: number, finalW: number, finalH: number) => {
        // Opción A: Vertical
        const cortesAV = Math.floor(pliegoW / finalW) * Math.floor(pliegoH / finalH);
        // Opción B: Girado
        const cortesAG = Math.floor(pliegoW / finalH) * Math.floor(pliegoH / finalW);
        // Opción Mixta simple (no optimizada nesting complejo, pero funcional)
        return Math.max(cortesAV, cortesAG, 1);
    };

    const calcular = () => {
        // 1. Definir dimensiones pliego
        const [pW, pH] = tamanoPliego.split('x').map(Number);
        
        // 2. Calcular cortes por pliego
        const cortes = calcularCortes(pW, pH, anchoFinal, altoFinal);
        
        // 3. Papel necesario (con merma 10% base + 2% por color)
        const mermaBase = 0.10;
        const mermaColor = (parseInt(coloresFrente) + parseInt(coloresDorso)) * 0.02;
        const totalMerma = mermaBase + mermaColor;
        
        const hojasFinalesRequeridas = cantidad;
        const pliegosTeoricos = hojasFinalesRequeridas / cortes;
        const pliegosReales = Math.ceil(pliegosTeoricos * (1 + totalMerma));
        const resmas = pliegosReales / 500;

        const keyPrecio = `${tipoPapel} (${tamanoPliego})`;
        const precioResma = PRECIOS_RESMA[keyPrecio] || 45.00; // Fallback
        const costoPapelTotal = resmas * precioResma;

        // 4. Costo Impresión (Tinta + Placas + Máquina)
        const areaCm2 = anchoFinal * altoFinal;
        const areaTotalTiraje = areaCm2 * cantidad;
        
        const costoTinta = (areaTotalTiraje * parseInt(coloresFrente) * COSTOS_PRODUCCION.TINTA_CMYK_CM2) +
                           (areaTotalTiraje * parseInt(coloresDorso) * COSTOS_PRODUCCION.TINTA_CMYK_CM2);
        
        const numPlacas = parseInt(coloresFrente) + parseInt(coloresDorso);
        const costoPlacas = numPlacas * COSTOS_PRODUCCION.QUEMADO_PLACA_GTO;
        const costoTiraje = COSTOS_PRODUCCION.ARRANQUE_MAQUINA + ((cantidad / 1000) * COSTOS_PRODUCCION.MILLAR_IMPRESION);
        
        const costoImpresionTotal = costoTinta + costoPlacas + costoTiraje + COSTOS_PRODUCCION.CORTE_GUILLOTINA;

        // 5. Acabados
        let costoAcabados = 0;
        if (acabados.barnizUV) costoAcabados += cantidad * COSTOS_ACABADOS.BARNIZ_UV;
        if (acabados.laminadoMate) costoAcabados += cantidad * COSTOS_ACABADOS.LAMINADO_MATE;
        if (acabados.troquelado) costoAcabados += cantidad * COSTOS_ACABADOS.TROQUELADO + 20; // + Troquel
        if (acabados.anillado) costoAcabados += cantidad * COSTOS_ACABADOS.ANILLADO;
        if (acabados.numeracion) costoAcabados += cantidad * COSTOS_ACABADOS.NUMERACION;
        if (acabados.encolado) costoAcabados += (cantidad / 100) * COSTOS_ACABADOS.ENCOLADO; // Asumiendo blocks de 100

        // 6. Total
        const costoTotal = costoPapelTotal + costoImpresionTotal + costoAcabados;
        
        // Margen inteligente (mayor cantidad, menor margen)
        let margen = 0.50; // 50% base
        if (cantidad >= 1000) margen = 0.40;
        if (cantidad >= 5000) margen = 0.30;
        if (cantidad < 100) margen = 1.00; // Mínimo 100% en tirajes micro

        const precioVenta = costoTotal * (1 + margen);

        setResultado({
            cortes,
            pliegosReales,
            costoPapel: costoPapelTotal,
            costoImpresion: costoImpresionTotal,
            costoAcabados,
            costoTotal,
            precioVenta,
            unitario: precioVenta / cantidad,
            precioResmaRef: precioResma
        });
    };

    const toggleAcabado = (key: keyof typeof acabados) => setAcabados(p => ({ ...p, [key]: !p[key] }));

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-brand-blue p-2 rounded-lg text-white shadow-lg">
                        <CalculatorIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calculadora Offset Pro</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Optimizado para imprentas en Ecuador</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowGuide(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg font-bold hover:bg-yellow-200 transition-colors border border-yellow-200 dark:border-yellow-700"
                >
                    <DocumentIcon className="w-5 h-5"/> Ver Tabla Maestra
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* --- LEFT PANEL: INPUTS --- */}
                <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 overflow-y-auto border border-gray-200 dark:border-gray-700 custom-scrollbar">
                    
                    {/* SECCIÓN 1: PAPEL */}
                    <div className="mb-8 relative">
                        <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg w-fit">
                            <BoxIcon className="w-4 h-4"/> 1. Selección de Sustrato
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Papel y Gramaje</label>
                                <select value={tipoPapel} onChange={e => setTipoPapel(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue outline-none">
                                    <optgroup label="Bond & Offset">
                                        <option value="Bond 75g">Bond 75g (Estándar)</option>
                                        <option value="Bond 90g">Bond 90g (Premium)</option>
                                        <option value="Bond 115g">Bond 115g (Grueso)</option>
                                    </optgroup>
                                    <optgroup label="Couché (Estucado)">
                                        <option value="Couché 115g">Couché 115g (Volantes)</option>
                                        <option value="Couché 150g">Couché 150g (Trípticos)</option>
                                        <option value="Couché 200g">Couché 200g (Portadas)</option>
                                        <option value="Couché 300g">Couché 300g (Tarjetas)</option>
                                    </optgroup>
                                    <optgroup label="Autocopiante">
                                        <option value="Químico CB">Original (CB) Blanco</option>
                                        <option value="Químico CFB">Copia Intermedia (CFB)</option>
                                        <option value="Químico CF">Copia Final (CF)</option>
                                    </optgroup>
                                    <optgroup label="Especiales">
                                        <option value="Adhesivo Papel">Adhesivo Papel</option>
                                        <option value="Adhesivo PVC">Adhesivo PVC (Vinil)</option>
                                        <option value="Kraft 120g">Kraft 120g (Ecológico)</option>
                                        <option value="Bristol 150g">Cartulina Bristol</option>
                                        <option value="Hilo 220g">Cartulina Hilo</option>
                                        <option value="Opalina 200g">Cartulina Opalina</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex justify-between">
                                    <span>Tamaño de Pliego (Compra)</span>
                                    <span className="text-xs text-gray-400 font-normal">Estándar Ecuador</span>
                                </label>
                                <select value={tamanoPliego} onChange={e => setTamanoPliego(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue outline-none bg-gray-50 dark:bg-gray-800">
                                    <option value="61x86">61 x 86 cm (Bond/Químico)</option>
                                    <option value="70x100">70 x 100 cm (Couché/Kraft)</option>
                                    <option value="65x90">65 x 90 cm (Hilo/Opalina)</option>
                                    <option value="50x65">50 x 65 cm (Bristol)</option>
                                    <option value="69x89">69 x 89 cm (Periódico)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: FORMATO */}
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg w-fit">
                            <RulerIcon className="w-4 h-4"/> 2. Formato y Cantidad
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ancho (cm)</label>
                                <input type="number" value={anchoFinal} onChange={e => setAnchoFinal(parseFloat(e.target.value) || 0)} step="0.1" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-center" />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alto (cm)</label>
                                <input type="number" value={altoFinal} onChange={e => setAltoFinal(parseFloat(e.target.value) || 0)} step="0.1" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 font-mono text-center" />
                            </div>
                            <div className="col-span-2 flex gap-2">
                                <button onClick={() => { setAnchoFinal(21); setAltoFinal(29.7); }} className="flex-1 text-xs bg-white border border-gray-300 text-gray-700 px-1 py-2 rounded hover:bg-gray-100 transition-colors">A4</button>
                                <button onClick={() => { setAnchoFinal(14.8); setAltoFinal(21); }} className="flex-1 text-xs bg-white border border-gray-300 text-gray-700 px-1 py-2 rounded hover:bg-gray-100 transition-colors">A5</button>
                                <button onClick={() => { setAnchoFinal(10.5); setAltoFinal(14.8); }} className="flex-1 text-xs bg-white border border-gray-300 text-gray-700 px-1 py-2 rounded hover:bg-gray-100 transition-colors">A6</button>
                                <button onClick={() => { setAnchoFinal(9); setAltoFinal(5.5); }} className="flex-1 text-xs bg-white border border-gray-300 text-gray-700 px-1 py-2 rounded hover:bg-gray-100 transition-colors">Tarj.</button>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cantidad a Producir</label>
                            <input type="number" value={cantidad} onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono font-black text-xl focus:ring-2 focus:ring-brand-blue outline-none" />
                        </div>
                    </div>

                    {/* SECCIÓN 3: IMPRESIÓN Y ACABADOS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-4 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg w-fit">
                                <PrinterIcon className="w-4 h-4"/> 3. Tintas
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                                    <span className="block text-xs font-bold mb-2 text-gray-500 uppercase">Frente (Tiro)</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setColoresFrente('4')} className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${coloresFrente === '4' ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Full Color</button>
                                        <button onClick={() => setColoresFrente('1')} className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${coloresFrente === '1' ? 'bg-gray-800 text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Negro</button>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                                    <span className="block text-xs font-bold mb-2 text-gray-500 uppercase">Reverso (Retiro)</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setColoresDorso('4')} className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${coloresDorso === '4' ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Full Color</button>
                                        <button onClick={() => setColoresDorso('1')} className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${coloresDorso === '1' ? 'bg-gray-800 text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Negro</button>
                                        <button onClick={() => setColoresDorso('0')} className={`flex-1 py-2 rounded text-xs font-bold border transition-all ${coloresDorso === '0' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>Sin Imp.</button>
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
                                    <label key={key} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all select-none hover:shadow-sm ${acabados[key as keyof typeof acabados] ? 'border-brand-blue bg-blue-50 dark:bg-blue-900/30 ring-1 ring-brand-blue' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
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
                            <span>Tamaño: {anchoFinal}x{altoFinal}cm</span>
                            <span>Cant: {cantidad}</span>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-grow space-y-6 overflow-y-auto">
                        {/* Visualizador de Cortes */}
                        <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-xl border border-gray-700 border-dashed">
                            <p className="text-xs text-gray-400 uppercase mb-2">Aprovechamiento de Pliego</p>
                            <div className="text-3xl font-black text-brand-blue">{resultado?.cortes || 0} <span className="text-sm font-normal text-white">unidades / pliego</span></div>
                            <p className="text-xs text-gray-500 mt-1">{tamanoPliego} cm</p>
                        </div>

                        {resultado && (
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">Papel ({resultado.pliegosReales} pliegos)</span>
                                    <span className="font-mono">{formatCurrency(resultado.costoPapel)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">Imprenta & Tinta</span>
                                    <span className="font-mono">{formatCurrency(resultado.costoImpresion)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                    <span className="text-gray-400">Acabados</span>
                                    <span className="font-mono">{formatCurrency(resultado.costoAcabados)}</span>
                                </div>
                                
                                <div className="pt-2">
                                    <div className="flex justify-between text-yellow-500 font-bold mb-1 uppercase text-xs tracking-wider">
                                        <span>Costo Producción</span>
                                        <span>{formatCurrency(resultado.costoTotal)}</span>
                                    </div>
                                    <div className="text-[10px] text-right text-gray-500">
                                        Unitario costo: {formatCurrency(resultado.costoTotal / cantidad)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-brand-blue">
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
                            Aplicar al Pedido
                        </button>
                    </div>
                </div>
            </div>

            {showGuide && <ReferenceTableModal onClose={() => setShowGuide(false)} />}
        </div>
    );
};

export default CalculadoraPreciosPage;
