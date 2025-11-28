
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, DocumentIcon, ArrowRightIcon, CheckCircleIcon, PrinterIcon, BoxIcon, CloseIcon, RulerIcon, InfoIcon, ArrowLeftIcon, FileText, Sparkles, Clock } from '../components/Icons';
import { formatCurrency } from '../utils';

// --- CONSTANTES Y PRECIOS ECUADOR 2025 ---
const PRECIOS_BASE = {
    // Papeles (Costo por Resma/Paquete)
    PAPEL_QUIMICO_RESMA: 55.00, // 61x86
    PAPEL_BOND_RESMA: 32.00,    // 61x86
    PAPEL_COUCHE_PQ_100: 35.00, // 70x100 (Paquete 100 hojas 150g) -> Resma teórica equiv para calculo: $175
    PAPEL_DIGITAL_A3: 0.12,     // Por hoja suelta 300g

    // Producción Offset
    PLACA_CTP: 22.00,           // Juego x4 o Unidad según imprenta, asumimos unidad x color o juego CMYK. Prompt dice: Juego x4 = $22?? Muy barato, usualmente $6 c/u. Usaremos $25 el juego o $7 unidad.
    // Ajuste al prompt del usuario: "Placa CTP (Juego x4 CMYK): $22.00" -> Ok, usaremos sus valores.
    PLACA_CTP_SET: 22.00, 
    ARRANQUE_MAQUINA: 15.00,
    IMPRESION_MILLAR: 12.00,    // Por color/lado
    
    // Producción Digital
    CLICK_COLOR_A3: 0.25,
    CLICK_BN_A3: 0.10,

    // Acabados
    NUMERACION_MILLAR: 5.00,
    ENCOLADO_BLOCK: 0.20,
    CORTE_GUILLOTINA_GEN: 2.00,
};

const FORMATOS_PLIEGO = {
    BOND_QUIMICO: { w: 61, h: 86, pinza: 1.5, nombre: '61x86 cm (Bond/Químico)' },
    COUCHE: { w: 70, h: 100, pinza: 1.5, nombre: '70x100 cm (Couché/Cartulina)' },
    DIGITAL: { w: 32, h: 48, pinza: 0.5, nombre: 'A3+ Digital (32x48 cm)' }
};

const TAMANOS_CORTES = {
    OFICIO: { w: 21.5, h: 33, label: 'Oficio (21.5x33)' },
    A4: { w: 21, h: 29.7, label: 'A4 (21x29.7)' },
    A5: { w: 14.8, h: 21, label: 'A5 / Medio Oficio (14.8x21)' },
    A6: { w: 10.5, h: 14.8, label: 'A6 / Cuarto Oficio (10.5x14.8)' },
    TARJETA: { w: 9, h: 5.5, label: 'Tarjeta (9x5.5)' },
    DL: { w: 10, h: 21, label: 'DL / Cheque (10x21)' }
};

type Mode = 'MENU' | 'FACTURACION' | 'PUBLICIDAD' | 'DIGITAL';

// --- COMPONENTE PRINCIPAL ---
const CalculadoraPreciosPage: React.FC = () => {
    const [mode, setMode] = useState<Mode>('MENU');
    const [showTable, setShowTable] = useState(false);

    // Estado Inputs Genéricos
    const [cantidad, setCantidad] = useState(1000); // Blocks o Unidades
    const [tamanoName, setTamanoName] = useState('A4');
    const [medidas, setMedidas] = useState({ w: 21, h: 29.7 });
    
    // Inputs Facturación
    const [juegosPorBlock, setJuegosPorBlock] = useState(50); // 100 hojas total
    const [partes, setPartes] = useState(2); // 1 orig + 1 copia
    const [papelFact, setPapelFact] = useState<'QUIMICO' | 'BOND'>('QUIMICO');
    
    // Inputs Publicidad
    const [ladosImpresion, setLadosImpresion] = useState(1); // 1 tiro, 2 tiro/retiro
    
    // Resultado
    const [cotizacion, setCotizacion] = useState<any>(null);

    // --- ALGORITMO DE CORTE OPTIMIZADO ---
    const calcularCortes = (pliegoW: number, pliegoH: number, pinza: number, finalW: number, finalH: number) => {
        // Area útil
        const utilW = pliegoW; 
        const utilH = pliegoH - pinza; // Restamos pinza al alto (estándar GTO/Roland)

        // Opción A: Orientación normal
        const cortesA = Math.floor(utilW / finalW) * Math.floor(utilH / finalH);
        // Opción B: Orientación rotada
        const cortesB = Math.floor(utilW / finalH) * Math.floor(utilH / finalW);

        return Math.max(cortesA, cortesB, 0);
    };

    // --- MOTOR DE CÁLCULO ---
    useEffect(() => {
        if (mode === 'MENU') return;

        let resultado = {
            titulo: '',
            materiales: [] as string[],
            pliegoInfo: '',
            produccion: [] as { item: string, costo: number }[],
            totalProduccion: 0,
            sugerido: 0,
            unitario: 0,
            alertas: [] as string[]
        };

        if (mode === 'FACTURACION') {
            // Lógica Facturación (Blocks)
            const totalJuegos = cantidad * juegosPorBlock; // Total transacciones
            const hojasOriginal = totalJuegos;
            const hojasCopias = totalJuegos * (partes - 1);
            
            const pliego = FORMATOS_PLIEGO.BOND_QUIMICO;
            const cortes = calcularCortes(pliego.w, pliego.h, pliego.pinza, medidas.w, medidas.h);
            
            if (cortes === 0) { setCotizacion(null); return; }

            // Calculo Papel
            const pliegosOriginal = Math.ceil(hojasOriginal / cortes);
            const pliegosCopias = Math.ceil(hojasCopias / cortes);
            
            // Merma (10% sugerido prompt)
            const merma = 1.10;
            const pliegosCompraOrig = Math.ceil(pliegosOriginal * merma);
            const pliegosCompraCopy = Math.ceil(pliegosCopias * merma);

            const costoPapelUnit = papelFact === 'QUIMICO' ? (PRECIOS_BASE.PAPEL_QUIMICO_RESMA / 500) : (PRECIOS_BASE.PAPEL_BOND_RESMA / 500);
            const costoTotalPapel = (pliegosCompraOrig + pliegosCompraCopy) * costoPapelUnit;

            // Producción
            const costoNumeracion = (totalJuegos / 1000) * PRECIOS_BASE.NUMERACION_MILLAR;
            const costoEncolado = cantidad * PRECIOS_BASE.ENCOLADO_BLOCK;
            const costoPlacas = PRECIOS_BASE.ARRANQUE_MAQUINA; // Asumimos 1 color base o arranque mínimo
            const bajadas = Math.ceil(totalJuegos / 1000); // Millares a imprimir
            const costoImpresion = Math.max(bajadas * PRECIOS_BASE.IMPRESION_MILLAR, 15.00); // Mínimo $15

            resultado.titulo = `${cantidad} Blocks de ${juegosPorBlock} juegos (${papelFact})`;
            resultado.pliegoInfo = `Pliego ${pliego.nombre}. Salen ${cortes} bajadas.`;
            
            resultado.produccion.push({ item: `Papel (${pliegosCompraOrig + pliegosCompraCopy} pliegos inc. merma)`, costo: costoTotalPapel });
            resultado.produccion.push({ item: 'Pre-prensa & Maquinado', costo: costoPlacas });
            resultado.produccion.push({ item: `Impresión (${bajadas} millares)`, costo: costoImpresion });
            resultado.produccion.push({ item: 'Numeración y Acabados', costo: costoNumeracion + costoEncolado + PRECIOS_BASE.CORTE_GUILLOTINA_GEN });

        } else if (mode === 'PUBLICIDAD') {
            // Lógica Publicidad (Volantes)
            const pliego = FORMATOS_PLIEGO.COUCHE;
            const cortes = calcularCortes(pliego.w, pliego.h, pliego.pinza, medidas.w, medidas.h);
            
            if (cortes === 0) { setCotizacion(null); return; }

            const pliegosNetos = cantidad / cortes;
            const pliegosCompra = Math.ceil(pliegosNetos * 1.10); // 10% merma
            
            // Costo papel (Paquete 100 hojas $35 -> $0.35 hoja)
            const costoPliego = PRECIOS_BASE.PAPEL_COUCHE_PQ_100 / 100;
            const costoTotalPapel = pliegosCompra * costoPliego;

            // Producción Offset
            const numPlacas = ladosImpresion === 1 ? 4 : 8; // CMYK
            // Si es poco tiraje y cabe "vuelta de campana", se optimiza, pero usaremos lógica standard segura.
            const costoPlacas = PRECIOS_BASE.PLACA_CTP_SET * (ladosImpresion === 1 ? 1 : 2); 
            
            const millares = Math.ceil(cantidad / 1000);
            const costoImpresion = millares * PRECIOS_BASE.IMPRESION_MILLAR * (ladosImpresion === 1 ? 4 : 8); // 4 colores

            resultado.titulo = `${cantidad} Volantes Couché 150g`;
            resultado.pliegoInfo = `Pliego ${pliego.nombre}. Salen ${cortes} unidades.`;
            
            if (cantidad < 1000) resultado.alertas.push("⚠️ Cantidad baja para Offset. Considera Digital.");

            resultado.produccion.push({ item: `Papel Couché (${pliegosCompra} pliegos)`, costo: costoTotalPapel });
            resultado.produccion.push({ item: `Juego de Placas CTP (${ladosImpresion === 1 ? 'Tiro' : 'Tiro/Retiro'})`, costo: costoPlacas });
            resultado.produccion.push({ item: `Impresión Offset (${millares} millares)`, costo: Math.max(costoImpresion, PRECIOS_BASE.ARRANQUE_MAQUINA) });
            resultado.produccion.push({ item: 'Corte y Refile', costo: PRECIOS_BASE.CORTE_GUILLOTINA_GEN });

        } else if (mode === 'DIGITAL') {
            // Lógica Digital
            const pliego = FORMATOS_PLIEGO.DIGITAL;
            const cortes = calcularCortes(pliego.w, pliego.h, 0.5, medidas.w, medidas.h);
            
            if (cortes === 0) { setCotizacion(null); return; }

            const hojasA3 = Math.ceil(cantidad / cortes);
            
            const costoPapel = hojasA3 * PRECIOS_BASE.PAPEL_DIGITAL_A3;
            const costoClick = hojasA3 * PRECIOS_BASE.CLICK_COLOR_A3 * ladosImpresion;

            resultado.titulo = `${cantidad} Impresiones Digitales`;
            resultado.pliegoInfo = `Formato A3+ (${pliego.w}x${pliego.h}). Caben ${cortes} por hoja.`;

            resultado.produccion.push({ item: `Papel Digital (${hojasA3} hojas)`, costo: costoPapel });
            resultado.produccion.push({ item: `Clicks de Impresión (${ladosImpresion === 1 ? '1 lado' : '2 lados'})`, costo: costoClick });
            resultado.produccion.push({ item: 'Corte', costo: 1.00 });
        }

        // Totales Finales
        resultado.totalProduccion = resultado.produccion.reduce((sum, item) => sum + item.costo, 0);
        
        // Margen inteligente (Escala)
        let margen = 0.50; // 50% base
        if (mode === 'FACTURACION') margen = 0.40;
        if (mode === 'PUBLICIDAD' && cantidad >= 5000) margen = 0.30;
        if (mode === 'DIGITAL') margen = 1.0; // Digital suele tener más margen por inmediatez

        resultado.sugerido = resultado.totalProduccion * (1 + margen);
        resultado.unitario = resultado.sugerido / cantidad;

        setCotizacion(resultado);

    }, [mode, cantidad, medidas, juegosPorBlock, partes, papelFact, ladosImpresion]);

    // Handlers
    const handleTamanoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const key = e.target.value;
        setTamanoName(key);
        if (TAMANOS_CORTES[key as keyof typeof TAMANOS_CORTES]) {
            setMedidas({ 
                w: TAMANOS_CORTES[key as keyof typeof TAMANOS_CORTES].w, 
                h: TAMANOS_CORTES[key as keyof typeof TAMANOS_CORTES].h 
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans p-4 md:p-8">
            {mode === 'MENU' ? (
                <div className="max-w-5xl mx-auto animate-fade-in-up">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center p-3 bg-brand-blue rounded-2xl shadow-lg mb-4">
                            <CalculatorIcon className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                            Cotizador Maestro Ecuador
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Selecciona el tipo de producción para iniciar el cálculo experto.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Opción 1: Facturación */}
                        <button onClick={() => setMode('FACTURACION')} className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-1 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <FileText className="w-24 h-24 text-blue-600" />
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                                <FileText className="w-6 h-6 text-brand-blue" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Facturación y Control</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Ideal para Facturas, Notas de Venta, Recibos. Calcula blocks, juegos, papel químico y numeración.
                            </p>
                        </button>

                        {/* Opción 2: Publicidad */}
                        <button onClick={() => setMode('PUBLICIDAD')} className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-1 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Sparkles className="w-24 h-24 text-orange-500" />
                            </div>
                            <div className="bg-orange-100 dark:bg-orange-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                                <Sparkles className="w-6 h-6 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Publicidad Offset</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Volantes, Trípticos, Afiches. Cálculo de millares, placas CTP y optimización de pliego 70x100.
                            </p>
                        </button>

                        {/* Opción 3: Digital */}
                        <button onClick={() => setMode('DIGITAL')} className="group bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md hover:shadow-2xl border border-gray-200 dark:border-gray-700 transition-all hover:-translate-y-1 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <PrinterIcon className="w-24 h-24 text-purple-600" />
                            </div>
                            <div className="bg-purple-100 dark:bg-purple-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                                <PrinterIcon className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Digital Express</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Tarjetas urgentes, menús, diplomas. Costo por click A3+ y entrega inmediata.
                            </p>
                        </button>
                    </div>
                    
                    <div className="mt-12 text-center">
                        <button onClick={() => setShowTable(true)} className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-blue font-semibold transition-colors">
                            <InfoIcon className="w-5 h-5"/> Ver Tabla de Referencias de Papel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 animate-fade-in h-[calc(100vh-100px)]">
                    
                    {/* PANEL IZQUIERDO: INPUTS */}
                    <div className="w-full lg:w-1/3 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                            <button onClick={() => setMode('MENU')} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                                <ArrowLeftIcon className="w-6 h-6"/>
                            </button>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                                {mode === 'FACTURACION' ? 'Facturación' : mode === 'PUBLICIDAD' ? 'Publicidad' : 'Digital'}
                            </h2>
                        </div>
                        
                        <div className="p-6 space-y-6 flex-grow overflow-y-auto">
                            
                            {/* Inputs Comunes */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tamaño Final</label>
                                <select value={tamanoName} onChange={handleTamanoChange} className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 mb-3">
                                    {Object.entries(TAMANOS_CORTES).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                    <option value="CUSTOM">Personalizado...</option>
                                </select>
                                {tamanoName === 'CUSTOM' && (
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="Ancho" value={medidas.w} onChange={e => setMedidas({...medidas, w: parseFloat(e.target.value) || 0})} className="w-1/2 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                                        <input type="number" placeholder="Alto" value={medidas.h} onChange={e => setMedidas({...medidas, h: parseFloat(e.target.value) || 0})} className="w-1/2 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                                    </div>
                                )}
                            </div>

                            {/* Inputs Específicos FACTURACION */}
                            {mode === 'FACTURACION' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cantidad de Blocks</label>
                                        <input type="number" value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono text-lg"/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Juegos/Block</label>
                                            <input type="number" value={juegosPorBlock} onChange={e => setJuegosPorBlock(parseInt(e.target.value) || 0)} className="w-full p-2 border rounded-lg dark:bg-gray-700"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Partes (Orig+Copia)</label>
                                            <input type="number" value={partes} onChange={e => setPartes(parseInt(e.target.value) || 0)} className="w-full p-2 border rounded-lg dark:bg-gray-700"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Papel</label>
                                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                            <button onClick={() => setPapelFact('QUIMICO')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${papelFact === 'QUIMICO' ? 'bg-white shadow text-brand-blue' : 'text-gray-500'}`}>Químico</button>
                                            <button onClick={() => setPapelFact('BOND')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${papelFact === 'BOND' ? 'bg-white shadow text-brand-blue' : 'text-gray-500'}`}>Bond</button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Inputs Específicos PUBLICIDAD */}
                            {mode === 'PUBLICIDAD' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cantidad (Unidades)</label>
                                        <input type="number" value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono text-lg"/>
                                        <p className="text-xs text-gray-400 mt-1">Recomendado Offset: &gt; 1000 uds</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Caras de Impresión</label>
                                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                            <button onClick={() => setLadosImpresion(1)} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${ladosImpresion === 1 ? 'bg-white shadow text-brand-blue' : 'text-gray-500'}`}>Solo Frente (4/0)</button>
                                            <button onClick={() => setLadosImpresion(2)} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${ladosImpresion === 2 ? 'bg-white shadow text-brand-blue' : 'text-gray-500'}`}>Frente y Dorso (4/4)</button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Inputs Específicos DIGITAL */}
                            {mode === 'DIGITAL' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cantidad</label>
                                        <input type="number" value={cantidad} onChange={e => setCantidad(parseInt(e.target.value) || 0)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-mono text-lg"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Caras de Impresión</label>
                                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                            <button onClick={() => setLadosImpresion(1)} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${ladosImpresion === 1 ? 'bg-white shadow text-brand-blue' : 'text-gray-500'}`}>Un lado</button>
                                            <button onClick={() => setLadosImpresion(2)} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${ladosImpresion === 2 ? 'bg-white shadow text-brand-blue' : 'text-gray-500'}`}>Doble lado</button>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                    </div>

                    {/* PANEL DERECHO: HOJA DE COTIZACION */}
                    <div className="w-full lg:w-2/3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                        <div className="p-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                                        Cotización Oficial
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Cálculo basado en estándares de producción locales.</p>
                                </div>
                                <div className="bg-brand-blue text-white px-4 py-2 rounded-lg font-mono font-bold shadow-sm">
                                    {cotizacion ? formatCurrency(cotizacion.sugerido) : '$0.00'}
                                </div>
                            </div>
                        </div>

                        {cotizacion ? (
                            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
                                
                                {/* Header del Proyecto */}
                                <div className="flex items-center gap-4 pb-6 border-b border-dashed border-gray-300 dark:border-gray-700">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-brand-blue">
                                        <CheckCircleIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{cotizacion.titulo}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{cotizacion.pliegoInfo}</p>
                                    </div>
                                </div>

                                {/* Desglose de Costos */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estructura de Costos</h4>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 space-y-3">
                                        {cotizacion.produccion.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-300">{item.item}</span>
                                                <span className="font-mono font-bold text-gray-800 dark:text-white">{formatCurrency(item.costo)}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-gray-300 dark:border-gray-600 pt-3 mt-3 flex justify-between font-bold text-base">
                                            <span>Costo Total Producción</span>
                                            <span className="text-brand-blue">{formatCurrency(cotizacion.totalProduccion)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Alertas */}
                                {cotizacion.alertas.length > 0 && (
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                                        {cotizacion.alertas.map((alerta: string, i: number) => (
                                            <p key={i} className="text-sm text-yellow-700 font-medium flex gap-2">
                                                <span>⚠️</span> {alerta}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Precio Final */}
                                <div className="bg-brand-blue text-white rounded-xl p-6 shadow-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-blue-200 text-xs font-bold uppercase mb-1">Precio Sugerido Venta</p>
                                        <p className="text-4xl font-black tracking-tight">{formatCurrency(cotizacion.sugerido)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-blue-200 text-xs font-bold uppercase mb-1">Unitario</p>
                                        <p className="text-xl font-mono font-bold bg-white/10 px-3 py-1 rounded-lg">
                                            {formatCurrency(cotizacion.unitario)}
                                        </p>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-10">
                                <CalculatorIcon className="w-16 h-16 mb-4 opacity-20" />
                                <p>Configura los parámetros para calcular.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Tabla Maestra (Reutilizado del código anterior) */}
            {showTable && (
                <div className="fixed inset-0 bg-black/70 z-[60] flex justify-center items-center p-4 animate-fade-in" onClick={() => setShowTable(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 bg-brand-blue text-white rounded-t-2xl">
                            <h2 className="text-xl font-bold">Tabla Maestra de Papeles Ecuador</h2>
                            <button onClick={() => setShowTable(false)}><CloseIcon className="w-6 h-6"/></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            {/* Contenido estático de la tabla proporcionada anteriormente */}
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 dark:bg-gray-700 font-bold uppercase text-xs">
                                    <tr><th className="p-3">Papel</th><th className="p-3">Gramaje</th><th className="p-3">Pliego</th><th className="p-3">Uso</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr><td className="p-3">Bond</td><td className="p-3">75g</td><td className="p-3">61x86</td><td className="p-3">Facturas, Hojas</td></tr>
                                    <tr><td className="p-3">Químico</td><td className="p-3">55g</td><td className="p-3">61x86</td><td className="p-3">Copia Facturas</td></tr>
                                    <tr><td className="p-3">Couché</td><td className="p-3">150g</td><td className="p-3">70x100</td><td className="p-3">Volantes</td></tr>
                                    <tr><td className="p-3">Couché</td><td className="p-3">300g</td><td className="p-3">70x100</td><td className="p-3">Tarjetas</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalculadoraPreciosPage;
