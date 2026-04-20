
import React, { useState, useEffect, useMemo } from 'react';
import { CalculatorIcon, CheckCircleIcon, CloseIcon, InfoIcon, FileText, Sparkles, RulerIcon, Cog8ToothIcon, ShieldCheckIcon, MonitorIcon, TableIcon, DollarIcon, SaveIcon, PrinterIcon, WrenchScrewdriverIcon, ExclamationTriangleIcon, ArrowRightIcon, BoxIcon, Loader2Icon } from '../components/Icons';
import { formatCurrency } from '../utils';
import { supabase } from '../services/supabase';
import { logActivity } from '../services/activityLogService';
import { useOutletContext } from 'react-router-dom';

// --- TIPOS Y ESTADOS ---

type Mode = 'OFFSET' | 'DIGITAL' | 'CONFIG';

// --- 1. CONFIGURACIÓN DE COSTOS (PERSONALIZADA ECUADOR) ---
interface CostConfig {
    // Materia Prima (Papeles)
    COSTO_RESMA_QUIMICO_ORIG: number; // Paquete 500h Oficio
    COSTO_RESMA_QUIMICO_COPIA: number; // Paquete 500h Oficio
    COSTO_RESMA_BOND: number;         // Paquete 500h Oficio
    COSTO_PLIEGO_COUCHE_300: number;  // Precio por unidad (de paquete de 100)
    COSTO_PLIEGO_ADHESIVO: number;    // Precio por unidad
    
    // Pre-Prensa
    COSTO_DISENO_SRI: number;         // Costo fijo servicio
    COSTO_PLACA_POLIESTER: number;    // Costo por placa (master)
    COSTO_PLACA_CTP: number;          // Costo por chapa metalica
    
    // Impresión
    COSTO_ARRANQUE: number;           // Puesta a punto
    COSTO_MILLAR_IMPRESION: number;   // Mano de obra x 1000
    
    // Digital
    CLICK_DIGITAL_A3: number;
    CLICK_DIGITAL_BN: number;
    
    // Acabados
    COSTO_NUMERACION: number;         // Por millar
    COSTO_BLOCK_ENCOLADO: number;     // Por unidad de block
    COSTO_CORTE: number;              // Fijo
    
    // Rentabilidad
    MARGEN_GANANCIA: number;          // 0.30 - 1.00
}

const DEFAULT_COSTS: CostConfig = {
    // Datos del usuario (Actualizados según prompt)
    COSTO_RESMA_QUIMICO_ORIG: 47.00,
    COSTO_RESMA_QUIMICO_COPIA: 46.00,
    COSTO_RESMA_BOND: 4.50,
    COSTO_PLIEGO_COUCHE_300: 0.51, // $51 el paquete de 100 pliegos
    COSTO_PLIEGO_ADHESIVO: 1.10,
    
    COSTO_DISENO_SRI: 5.00,
    COSTO_PLACA_POLIESTER: 3.00,
    COSTO_PLACA_CTP: 6.00,
    
    COSTO_ARRANQUE: 10.00,
    COSTO_MILLAR_IMPRESION: 4.00,
    
    CLICK_DIGITAL_A3: 0.40,
    CLICK_DIGITAL_BN: 0.10,
    
    COSTO_NUMERACION: 4.00,
    COSTO_BLOCK_ENCOLADO: 0.15,
    COSTO_CORTE: 1.50,
    
    MARGEN_GANANCIA: 0.40 // 40% ganancia neta objetivo
};

// --- 2. MODELO DE PAPELES (FUENTE) ---
interface SourcePaper {
    id: string;
    nombre: string;
    tipo: 'RESMA' | 'PLIEGO';
    ancho: number;
    alto: number;
    costoBaseKey: keyof CostConfig;
}

const SOURCE_PAPERS: SourcePaper[] = [
    { id: 'QUIMICO', nombre: 'Papel Químico (Autocopiativo)', tipo: 'RESMA', ancho: 21.6, alto: 33, costoBaseKey: 'COSTO_RESMA_QUIMICO_ORIG' },
    { id: 'BOND', nombre: 'Papel Bond 75g', tipo: 'RESMA', ancho: 21.6, alto: 33, costoBaseKey: 'COSTO_RESMA_BOND' },
    { id: 'COUCHE_300', nombre: 'Couché 300g (Glosy)', tipo: 'PLIEGO', ancho: 90, alto: 130, costoBaseKey: 'COSTO_PLIEGO_COUCHE_300' },
    { id: 'ADHESIVO', nombre: 'Adhesivo Brillante', tipo: 'PLIEGO', ancho: 70, alto: 100, costoBaseKey: 'COSTO_PLIEGO_ADHESIVO' },
];

// --- COMPONENTE VISUAL STEP ---
const VisualStep: React.FC<{
    title: string;
    image: string;
    subtitle: string;
    detail: string;
    cost?: number;
    isLast?: boolean;
}> = ({ title, image, subtitle, detail, cost, isLast }) => (
    <div className="flex-1 relative group w-full md:w-auto">
        {!isLast && (
            <div className="hidden md:block absolute top-[60px] -right-6 w-12 h-px bg-white/10 z-0"></div>
        )}
        
        <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/5 overflow-hidden hover:border-brand-blue/30 transition-all duration-700 h-full flex flex-col group/step shadow-2xl">
            {/* Image Area */}
            <div className="h-32 w-full relative overflow-hidden bg-black">
                <img src={image} alt={title} className="w-full h-full object-cover opacity-40 grayscale group-hover/step:grayscale-0 group-hover/step:opacity-80 transition-all duration-1000 scale-110 group-hover/step:scale-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-end p-5">
                    <span className="text-white font-black text-[9px] uppercase tracking-[0.4em] flex items-center gap-3">
                        <span className="bg-brand-blue w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-[0_0_20px_rgba(59,130,246,0.5)]">{title.split('.')[0]}</span>
                        {title.split('. ')[1]}
                    </span>
                </div>
            </div>
            
            {/* Content Area */}
            <div className="p-5 flex flex-col flex-grow bg-white/[0.02]">
                <h4 className="font-black text-white text-[11px] uppercase tracking-widest mb-2 leading-tight italic">{subtitle}</h4>
                <p className="text-[10px] text-slate-500 font-medium mb-4 flex-grow leading-relaxed">{detail}</p>
                {cost !== undefined && (
                    <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-auto">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Insumo</span>
                        <span className="font-black text-xs text-brand-blue tracking-widest">{formatCurrency(cost)}</span>
                    </div>
                )}
            </div>
        </div>
        
        {!isLast && (
            <div className="md:hidden flex justify-center py-4">
                <ArrowRightIcon className="w-6 h-6 text-white/10 transform rotate-90" />
            </div>
        )}
    </div>
);

// --- COMPONENTE VISUAL DE PROCESO (PIPELINE) ---
const ProductionPipeline: React.FC<{ 
    sourceName: string; 
    sourceType: string;
    sourceSize: string;
    cutSize: string;
    cutsPerUnit: number;
    prePressCost: number;
    materialCost: number;
    printCost: number;
}> = ({ sourceName, sourceType, sourceSize, cutSize, cutsPerUnit, prePressCost, materialCost, printCost }) => {
    
    // URLs de imágenes visuales para cada paso
    const images = {
        input: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=400", // Resma de papel
        prepress: "https://images.unsplash.com/photo-1626785774573-4b7993143a2d?auto=format&fit=crop&q=80&w=400", // Placas/Diseño
        print: "https://i.imgur.com/AUvl1wF.png", // Máquina Offset (Roland)
        finish: "https://i.imgur.com/cKqbnJj.jpeg" // Producto Terminado (Papelería)
    };

    return (
        <div className="w-full py-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <VisualStep 
                    title="1. Entrada" 
                    image={images.input} 
                    subtitle={sourceName} 
                    detail={`${sourceType === 'RESMA' ? 'Resma (500h)' : 'Pliego'} • ${sourceSize}`}
                    cost={materialCost}
                />
                <VisualStep 
                    title="2. Pre-Prensa" 
                    image={images.prepress} 
                    subtitle="Diseño & Placas" 
                    detail="Autorización SRI + Placa Poliéster/CTP"
                    cost={prePressCost}
                />
                <VisualStep 
                    title="3. Ejecución" 
                    image={images.print} 
                    subtitle="Impresión Offset" 
                    detail="Tiraje en máquina + Puesta a punto"
                    cost={printCost}
                />
                <VisualStep 
                    title="4. Salida" 
                    image={images.finish} 
                    subtitle="Producto Final" 
                    detail={`Formato ${cutSize} (${cutsPerUnit} cortes p/${sourceType === 'RESMA' ? 'hoja' : 'pliego'})`}
                    isLast
                />
            </div>
        </div>
    );
};

// --- CALCULADORA OFFSET ---
const OffsetCalculator: React.FC<{ costs: CostConfig }> = ({ costs }) => {
    // Inputs
    const [paperId, setPaperId] = useState('QUIMICO');
    
    // Tamaños Predefinidos para selección rápida
    const [selectedSizePreset, setSelectedSizePreset] = useState('1/4_OFICIO');
    const [finalW, setFinalW] = useState(10.5);
    const [finalH, setFinalH] = useState(14.8);
    
    const [quantity, setQuantity] = useState(100); // Blocks o Unidades
    const [cantidadHojasBlock, setCantidadHojasBlock] = useState(100); // 100, 50, 25
    const [colorsFront, setColorsFront] = useState(1); 
    const [colorsBack, setColorsBack] = useState(0);
    const [parts, setParts] = useState(2); // 1 Original + 1 Copia
    const [hasDesign, setHasDesign] = useState(false); // Ya tiene diseño?
    const [requiresSRI, setRequiresSRI] = useState(true);

    // Manejo de tamaños predefinidos
    const handlePresetChange = (val: string) => {
        setSelectedSizePreset(val);
        const currentPaper = SOURCE_PAPERS.find(p => p.id === paperId);
        
        if (currentPaper?.tipo === 'RESMA') {
            // Base Oficio (21.6 x 33)
            switch(val) {
                case 'OFICIO': setFinalW(21.6); setFinalH(33); break;
                case '1/2_OFICIO': setFinalW(21.6); setFinalH(16.5); break;
                case '1/4_OFICIO': setFinalW(10.8); setFinalH(16.5); break; // Aprox notas venta
                case '1/8_OFICIO': setFinalW(10.8); setFinalH(8.25); break;
            }
        } else {
            // Base Pliego o A4 Standard
            switch(val) {
                case 'A3': setFinalW(29.7); setFinalH(42); break;
                case 'A4': setFinalW(21); setFinalH(29.7); break;
                case 'A5': setFinalW(14.8); setFinalH(21); break;
                case 'A6': setFinalW(10.5); setFinalH(14.8); break;
            }
        }
    };

    // --- MOTOR DE CÁLCULO ---
    const result = useMemo(() => {
        const paper = SOURCE_PAPERS.find(p => p.id === paperId) || SOURCE_PAPERS[0];
        
        // 1. Cálculo de Cortes (Imposición)
        // Margen técnico de pinza y refile
        const marginY = 1.0; 
        const marginX = 0.5;
        
        const usableW = paper.ancho - marginX;
        const usableH = paper.alto - marginY;

        // Opción A: Normal
        const colsA = Math.floor(usableW / finalW);
        const rowsA = Math.floor(usableH / finalH);
        const cutsA = colsA * rowsA;

        // Opción B: Rotado
        const colsB = Math.floor(usableW / finalH);
        const rowsB = Math.floor(usableH / finalW);
        const cutsB = colsB * rowsB;

        const cutsPerUnit = Math.max(cutsA, cutsB);
        
        if (cutsPerUnit === 0) return null;

        // 2. Cálculo de Material (Papel)
        let totalSheetsNeeded = 0;
        let costPapelTotal = 0;

        if (paper.id === 'QUIMICO') {
            // Lógica Especial: Resmas separadas (Original + Copias)
            // blocks * hojas_por_block = total juegos
            const totalJuegos = quantity * cantidadHojasBlock; 
            const bajadasNecesarias = Math.ceil(totalJuegos / cutsPerUnit);
            
            // Merma (10% + 20 hojas base para arranque)
            const merma = Math.ceil(bajadasNecesarias * 0.10) + 20; 
            const totalBajadasConMerma = bajadasNecesarias + merma;

            // Precio por hoja individual (sacado del precio de resma de 500)
            const costoHojaOriginal = costs.COSTO_RESMA_QUIMICO_ORIG / 500;
            const costoHojaCopia = costs.COSTO_RESMA_QUIMICO_COPIA / 500;
            
            // Costo Material = (Hojas Orig * Costo) + (Hojas Copia * Num Copias * Costo)
            const costoTotalOrig = totalBajadasConMerma * costoHojaOriginal;
            const costoTotalCopia = totalBajadasConMerma * (parts - 1) * costoHojaCopia;
            
            costPapelTotal = costoTotalOrig + costoTotalCopia;
            totalSheetsNeeded = totalBajadasConMerma * parts; // Total hojas físicas pasadas por máquina

        } else if (paper.tipo === 'RESMA') {
            // Bond, etc. Venta por millar o resma
            const totalUnidades = quantity; // Volantes
            const bajadas = Math.ceil(totalUnidades / cutsPerUnit);
            const merma = Math.ceil(bajadas * 0.10) + 30;
            const totalHojas = bajadas + merma;
            
            const costoHoja = costs[paper.costoBaseKey] / 500;
            costPapelTotal = totalHojas * costoHoja;
            totalSheetsNeeded = totalHojas;

        } else {
            // Pliego (Couché, Adhesivo)
            const totalUnidades = quantity;
            const bajadas = Math.ceil(totalUnidades / cutsPerUnit);
            const merma = Math.ceil(bajadas * 0.10) + 5; // Menos merma en pliego grande proporcionalmente
            const totalPliegos = bajadas + merma;
            
            // CORRECCION: El usuario dijo "$51 el paquete de 100". Entonces unitario es 0.51.
            costPapelTotal = totalPliegos * costs[paper.costoBaseKey];
            totalSheetsNeeded = totalPliegos;
        }

        // 3. Pre-Prensa
        let costPrePrensa = 0;
        if (!hasDesign) {
            costPrePrensa += requiresSRI ? costs.COSTO_DISENO_SRI : 5.00; // Diseño básico
        }
        
        // Placas: Poliester para tirajes cortos (< 2000), CTP para largos o alta calidad
        // Lógica simple: Si es químico o bond corto tiraje -> Poliester.
        const numPlacas = colorsFront + colorsBack;
        const costoPlacaUnit = (quantity > 2000 || paper.id === 'COUCHE_300') ? costs.COSTO_PLACA_CTP : costs.COSTO_PLACA_POLIESTER;
        
        const costPlacas = numPlacas * costoPlacaUnit;
        costPrePrensa += costPlacas;

        // 4. Impresión
        const millares = Math.ceil(totalSheetsNeeded / 1000);
        const tiros = millares * (colorsFront + colorsBack); // Aproximación simple de tiros
        // En offset pequeño, se cobra a veces por "quemado" o "arranque" mas millar.
        // Aquí simplificamos: Arranque + (Millares * Costo)
        const costImpresion = costs.COSTO_ARRANQUE + (tiros * costs.COSTO_MILLAR_IMPRESION);

        // 5. Acabados
        let costAcabados = costs.COSTO_CORTE; // Siempre hay refile
        if (paper.id === 'QUIMICO') {
            costAcabados += (quantity * costs.COSTO_BLOCK_ENCOLADO); // Encolado de blocks
            costAcabados += (millares * costs.COSTO_NUMERACION); // Numeración
        }

        // 6. Totales
        const costoTotalProduccion = costPapelTotal + costPrePrensa + costImpresion + costAcabados;
        const utilidadEsperada = costoTotalProduccion * costs.MARGEN_GANANCIA;
        // Ajuste de mercado: Si es muy bajo, subir al mínimo.
        let pvp = costoTotalProduccion + utilidadEsperada;
        
        // Regla de mínimos (ej. un ciento de facturas no baja de $15-$18)
        if (paper.id === 'QUIMICO' && quantity === 1 && pvp < 15) pvp = 15;

        return {
            paper,
            cutsPerUnit,
            costPapelTotal,
            costPrePrensa,
            costImpresion,
            costAcabados,
            costoTotalProduccion,
            pvp,
            unitario: pvp / quantity
        };

    }, [paperId, finalW, finalH, quantity, colorsFront, colorsBack, parts, costs, hasDesign, requiresSRI, cantidadHojasBlock]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Panel */}
            <div className="lg:col-span-4 space-y-8">
                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
                    
                    <div className="flex items-center gap-5 mb-10 pb-6 border-b border-white/5 relative z-10">
                        <div className="bg-brand-blue/20 p-3 rounded-full border border-brand-blue/30 shadow-[0_0_30px_rgba(59,130,246,0.2)] text-brand-blue">
                            <WrenchScrewdriverIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-black text-white text-lg uppercase tracking-tighter italic">Machine Config</h2>
                            <p className="text-[10px] text-brand-blue font-black uppercase tracking-[0.2em]">Parámetros de Producción</p>
                        </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                        {/* Tipo de Papel */}
                        <div className="group/field">
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-[0.3em] group-focus-within/field:text-brand-blue transition-colors">Material Base</label>
                            <div className="relative">
                                <select 
                                    value={paperId} 
                                    onChange={e => {setPaperId(e.target.value); handlePresetChange('1/4_OFICIO')}} 
                                    className="w-full p-5 bg-black/40 border-none rounded-2xl text-[13px] font-bold text-white outline-none focus:ring-1 focus:ring-brand-blue/30 transition-all appearance-none cursor-pointer"
                                >
                                    {SOURCE_PAPERS.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.nombre.toUpperCase()}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                                    <ArrowRightIcon className="w-4 h-4 rotate-90" />
                                </div>
                            </div>
                        </div>

                        {/* Tamaño de Corte */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Corte de Salida (Blueprint)</label>
                            <div className="grid grid-cols-4 gap-2">
                                {SOURCE_PAPERS.find(p=>p.id===paperId)?.tipo === 'RESMA' ? (
                                    <>
                                        {['OFICIO', '1/2_OFICIO', '1/4_OFICIO', '1/8_OFICIO'].map(p => (
                                            <button key={p} onClick={() => handlePresetChange(p)} className={`px-2 py-3 text-[9px] font-black uppercase tracking-widest border rounded-xl transition-all ${selectedSizePreset===p ? 'bg-brand-blue text-white shadow-xl shadow-blue-900/30 border-brand-blue' : 'bg-black/20 text-slate-500 border-white/5 hover:border-white/20'}`}>{p.replace('_OFICIO', '')}</button>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {['A3', 'A4', 'A5', 'A6'].map(p => (
                                            <button key={p} onClick={() => handlePresetChange(p)} className={`px-2 py-3 text-[9px] font-black uppercase tracking-widest border rounded-xl transition-all ${selectedSizePreset===p ? 'bg-brand-blue text-white shadow-xl shadow-blue-900/30 border-brand-blue' : 'bg-black/20 text-slate-500 border-white/5 hover:border-white/20'}`}>{p}</button>
                                        ))}
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <input type="number" value={finalW} onChange={e => setFinalW(parseFloat(e.target.value))} className="w-full p-5 bg-black/40 border-none rounded-2xl text-[13px] font-bold text-white text-center" />
                                    <span className="absolute left-4 top-1 text-[8px] font-black text-slate-600 uppercase">Width</span>
                                </div>
                                <span className="text-slate-700 font-bold">×</span>
                                <div className="relative flex-1">
                                    <input type="number" value={finalH} onChange={e => setFinalH(parseFloat(e.target.value))} className="w-full p-5 bg-black/40 border-none rounded-2xl text-[13px] font-bold text-white text-center" />
                                    <span className="absolute left-4 top-1 text-[8px] font-black text-slate-600 uppercase">Height</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">mm</span>
                            </div>
                        </div>

                        {/* Cantidad y Hojas */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-[0.3em]">Units</label>
                                <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="w-full p-5 bg-black/40 border-none rounded-2xl text-lg font-black text-brand-blue outline-none border-b-2 border-brand-blue/30" />
                            </div>
                            {paperId === 'QUIMICO' && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-[0.3em]">Shts/Block</label>
                                    <select value={cantidadHojasBlock} onChange={e => setCantidadHojasBlock(parseInt(e.target.value))} className="w-full p-5 bg-black/40 border-none rounded-2xl text-[13px] font-bold text-white outline-none appearance-none cursor-pointer">
                                        <option value={100} className="bg-slate-900">100 STD</option>
                                        <option value={50} className="bg-slate-900">50 MID</option>
                                        <option value={25} className="bg-slate-900">25 MIN</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Tintas */}
                        <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-4 tracking-[0.3em]">Cromatic Dynamics</label>
                            <div className="flex gap-6">
                                <div className="flex-1">
                                    <span className="text-[9px] font-black text-slate-600 uppercase block mb-2 tracking-widest">Anverso</span>
                                    <input type="number" min={1} max={4} value={colorsFront} onChange={e => setColorsFront(parseInt(e.target.value))} className="w-full p-3 bg-black/40 border-none rounded-xl text-center text-sm font-black text-white" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-[9px] font-black text-slate-600 uppercase block mb-2 tracking-widest">Reverso</span>
                                    <input type="number" min={0} max={4} value={colorsBack} onChange={e => setColorsBack(parseInt(e.target.value))} className="w-full p-3 bg-black/40 border-none rounded-xl text-center text-sm font-black text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Opciones Extra */}
                        <div className="space-y-4 pt-4">
                            <label className="flex items-center gap-4 cursor-pointer group/label">
                                <div className="relative">
                                    <input type="checkbox" checked={hasDesign} onChange={e => setHasDesign(e.target.checked)} className="peer hidden" />
                                    <div className="w-10 h-6 bg-slate-800 rounded-full peer-checked:bg-brand-blue transition-all"></div>
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover/label:text-white transition-colors">Diseño Suministrado</span>
                            </label>
                            <label className="flex items-center gap-4 cursor-pointer group/label opacity-50 has-[:disabled]:opacity-20 transition-all">
                                <div className="relative">
                                    <input type="checkbox" checked={requiresSRI} onChange={e => setRequiresSRI(e.target.checked)} disabled={paperId !== 'QUIMICO'} className="peer hidden" />
                                    <div className="w-10 h-6 bg-slate-800 rounded-full peer-checked:bg-brand-blue transition-all"></div>
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                                </div>
                                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest group-hover/label:text-white transition-colors">Integración SRI</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-8 space-y-6">
                {result ? (
                    <>
                        {/* Visual Process Pipeline */}
                        <ProductionPipeline 
                            sourceName={result.paper.nombre}
                            sourceType={result.paper.tipo}
                            sourceSize={`${result.paper.ancho}x${result.paper.alto} cm`}
                            cutSize={`${finalW}x${finalH} cm`}
                            cutsPerUnit={result.cutsPerUnit}
                            prePressCost={result.costPrePrensa}
                            materialCost={result.costPapelTotal}
                            printCost={result.costImpresion}
                        />

                        {/* Cost Breakdown Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Papel + Merma</p>
                                <p className="text-2xl font-black text-white">{formatCurrency(result.costPapelTotal)}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Pre-Prensa</p>
                                <p className="text-2xl font-black text-white">{formatCurrency(result.costPrePrensa)}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Impresión</p>
                                <p className="text-2xl font-black text-white">{formatCurrency(result.costImpresion)}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Acabados</p>
                                <p className="text-2xl font-black text-white">{formatCurrency(result.costAcabados)}</p>
                            </div>
                        </div>

                        {/* Final Price Big Card */}
                        <div className="relative rounded-[2rem] overflow-hidden border border-white/10 bg-black shadow-2xl p-10 flex flex-col md:flex-row items-center justify-between group">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/10 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Costo de Producción</p>
                                <p className="text-3xl font-black text-slate-300">{formatCurrency(result.costoTotalProduccion)}</p>
                                <p className="text-[10px] text-slate-600 mt-4 uppercase tracking-wider">* Valor estimado de materiales y procesos</p>
                            </div>
                            
                            <div className="h-20 w-px bg-white/10 hidden md:block mx-10"></div>

                            <div className="text-center md:text-right mt-8 md:mt-0 relative z-10">
                                <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Precio de Venta Sugerido</p>
                                <div className="flex items-baseline gap-3 justify-center md:justify-end">
                                    <span className="text-7xl font-black tracking-tighter text-white">{formatCurrency(result.pvp)}</span>
                                    <span className="text-xl text-slate-500 font-medium tracking-tight">+ IVA</span>
                                </div>
                                <div className="mt-4 inline-block bg-white/5 border border-white/10 px-5 py-2 rounded-full text-xs font-black tracking-widest text-slate-400 uppercase">
                                    Unitario: <span className="text-white">{formatCurrency(result.unitario)}</span>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300">
                        <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">El tamaño de corte es mayor al material base.</p>
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
        let clickCost = colorMode === 'COLOR' ? costs.CLICK_DIGITAL_A3 : costs.CLICK_DIGITAL_BN;
        
        // A4 is roughly half the cost of A3 in terms of master clicks, typically charged as A3/2 or separate counter
        if (format === 'A4') clickCost = clickCost * 0.6; 
        
        // Paper Cost Factors
        let sheetCost = 0;
        switch (paperType) {
            case 'BOND': sheetCost = costs.COSTO_RESMA_BOND / 500; break; 
            case 'COUCHE_115': sheetCost = (costs.COSTO_PLIEGO_COUCHE_300 / 4) * 0.8; break; // Estimado vs 300g
            case 'COUCHE_300': sheetCost = costs.COSTO_PLIEGO_COUCHE_300 / 4; break; // 1 pliego = 4 A3 aprox
            case 'ADHESIVO': sheetCost = costs.COSTO_PLIEGO_ADHESIVO / 4; break;
            default: sheetCost = 0.10;
        }

        // Calculation
        const totalClicks = quantity * sides;
        const totalPaper = quantity; 
        
        const productionCost = (totalClicks * clickCost) + (totalPaper * sheetCost);
        const pvp = productionCost * (1 + costs.MARGEN_GANANCIA);
        
        return {
            unitCost: productionCost / quantity,
            totalCost: productionCost,
            unitPvp: pvp / quantity,
            totalPvp: pvp
        };
    }, [format, paperType, colorMode, sides, quantity, costs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in">
            {/* Controls */}
            <div className="bg-white/5 border border-white/10 p-10 rounded-3xl backdrop-blur-xl">
                <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
                    <div className="bg-amber-500/10 p-4 rounded-2xl text-amber-500">
                        <Sparkles className="w-8 h-8 md:w-10 md:h-10 transition-transform group-hover:scale-110" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Impresión Digital</h2>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Precision Editorial Atelier</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Formato de Salida</label>
                        <div className="flex gap-2 p-1.5 bg-black/40 rounded-2xl">
                            {['A4', 'A3', 'SRA3'].map((f) => (
                                <button 
                                    key={f} 
                                    onClick={() => setFormat(f as any)} 
                                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${format === f ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tipo deSustrato</label>
                            <select value={paperType} onChange={e => setPaperType(e.target.value)} className="w-full p-4 bg-black/40 border-none rounded-2xl text-sm font-black text-white outline-none focus:ring-1 focus:ring-amber-500/50 appearance-none">
                                <option value="BOND">Bond 75g (Atelier)</option>
                                <option value="COUCHE_115">Couché 115g Premium</option>
                                <option value="COUCHE_300">Couché 300g Luxury</option>
                                <option value="ADHESIVO">Adhesivo Fotográfico</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Cantidad</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))} className="w-full p-4 bg-black/40 border-none rounded-2xl text-lg font-black text-amber-500 outline-none focus:ring-1 focus:ring-amber-500/50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Modo de Color</label>
                            <div className="flex bg-black/40 rounded-2xl p-1.5">
                                <button onClick={() => setColorMode('COLOR')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${colorMode === 'COLOR' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Color</button>
                                <button onClick={() => setColorMode('BW')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${colorMode === 'BW' ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Escala Grises</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Configuración Caras</label>
                            <div className="flex bg-black/40 rounded-2xl p-1.5">
                                <button onClick={() => setSides(1)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${sides === 1 ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Sencillo</button>
                                <button onClick={() => setSides(2)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${sides === 2 ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>Retira</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-black border border-white/10 shadow-3xl p-12 flex flex-col justify-between group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[80px] -translate-y-1/2 translate-x-1/2 transition-transform duration-1000 group-hover:scale-110"></div>
                
                <div className="relative z-10">
                    <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em] mb-10">Cotización Atelier Digital</h3>
                    
                    <div className="space-y-6 mb-10">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Valor Unitario</span>
                            <span className="text-xl font-black text-white">{formatCurrency(calculation.unitPvp)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Tiraje Inmediato</span>
                            <span className="text-xl font-black text-white">{quantity}</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Total Consolidado</p>
                    <div className="flex items-baseline gap-4">
                        <span className="text-7xl font-black tracking-tighter text-white">{formatCurrency(calculation.totalPvp)}</span>
                        <span className="text-xl text-slate-500 font-medium tracking-tight">+ IVA</span>
                    </div>
                    <div className="mt-8 text-[10px] font-black text-slate-600 uppercase tracking-widest italic">
                        * Entrega estimada en 24-48 horas laborables
                    </div>
                </div>
            </div>
        </div>
    );
};

const MasterTableModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
            <div className="bg-black border border-white/10 rounded-[2.5rem] shadow-3xl w-full max-w-4xl max-h-[85vh] flex flex-col relative animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-10 border-b border-white/5">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Catálogo de Sustratos</h2>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Especificaciones Técnicas Atelier</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all group">
                        <CloseIcon className="w-6 h-6 transition-transform group-hover:rotate-90" />
                    </button>
                </div>
                <div className="p-10 overflow-y-auto">
                    <div className="grid gap-4">
                        {SOURCE_PAPERS.map((paper) => (
                            <div key={paper.id} className="group bg-white/5 border border-white/10 hover:border-brand-blue/30 p-6 rounded-2xl flex items-center justify-between transition-all hover:bg-white/[0.07]">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-xl bg-black flex items-center justify-center border border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        {paper.id}
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black uppercase tracking-widest">{paper.nombre}</h4>
                                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{paper.ancho} x {paper.alto} cm • Gramaje Atelier</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-10">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase ${paper.tipo === 'RESMA' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {paper.tipo}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-10 border-t border-white/5 flex justify-end">
                    <button onClick={onClose} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Cerrar Catálogo</button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
const CalculadoraPreciosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: any }>();
    const [mode, setMode] = useState<Mode>('OFFSET');
    const [costs, setCosts] = useState<CostConfig>(DEFAULT_COSTS);
    const [showMasterTable, setShowMasterTable] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('app_config')
                    .select('data')
                    .eq('id', 1)
                    .single();
                
                if (data && data.data) {
                    // Combinar defaults con los valores de la DB para asegurar que todos los campos existan
                    const dbCosts = data.data;
                    const mergedCosts = { ...DEFAULT_COSTS };
                    
                    // Solo sobreescribir si el campo existe en la interfaz CostConfig
                    Object.keys(DEFAULT_COSTS).forEach(key => {
                        if (dbCosts[key] !== undefined) {
                            (mergedCosts as any)[key] = dbCosts[key];
                        }
                    });
                    
                    setCosts(mergedCosts);
                }
            } catch (err) {
                console.warn('[Calculadora] No se pudo cargar config de Supabase, usando defaults:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const handleSaveConfig = async (newCosts: CostConfig) => {
        setLoading(true);
        try {
            // Obtener config actual para no borrar otros campos (como SRI data)
            const { data: currentConfig } = await supabase
                .from('app_config')
                .select('data')
                .eq('id', 1)
                .single();

            const updatedData = {
                ...(currentConfig?.data || {}),
                ...newCosts
            };

            const { error } = await supabase
                .from('app_config')
                .update({ data: updatedData, updated_at: new Date().toISOString() })
                .eq('id', 1);

            if (error) throw error;

            setCosts(newCosts);
            await logActivity(
                currentUser?.nombre || 'Admin',
                currentUser?.rol || 'Administrador',
                'CAMBIO_CONFIG',
                'Actualización de parámetros de costos industriales',
                'Producción'
            );
            setMode('OFFSET');
        } catch (err) {
            console.error('[Calculadora] Error al guardar config:', err);
            alert('Error al guardar la configuración en la nube');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-4 sm:p-10 font-sans pb-32">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <div className="relative">
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-brand-blue"></div>
                        <h1 className="text-4xl font-black text-white tracking-tight">
                            Ingeniería de Costos
                        </h1>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Precision Print Engine • Atelier v4.0</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <button onClick={() => setShowMasterTable(true)} className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all">
                            <TableIcon className="w-4 h-4 text-brand-blue"/> Catálogo Sustratos
                        </button>
                        <button 
                            onClick={() => setMode(mode === 'CONFIG' ? 'OFFSET' : 'CONFIG')} 
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${mode === 'CONFIG' ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                        >
                            <Cog8ToothIcon className={`w-4 h-4 ${mode === 'CONFIG' ? 'animate-spin-slow' : ''}`}/> Configuración
                        </button>
                    </div>
                </div>

                {/* Mode Selector (Tabs) */}
                {mode !== 'CONFIG' && (
                    <div className="flex p-2 bg-black/40 border border-white/5 rounded-2xl mb-16 max-w-sm">
                        <button onClick={() => setMode('OFFSET')} className={`flex-1 py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${mode === 'OFFSET' ? 'bg-brand-blue text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            <PrinterIcon className="w-4 h-4"/> Offset
                        </button>
                        <button onClick={() => setMode('DIGITAL')} className={`flex-1 py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${mode === 'DIGITAL' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                            <Sparkles className="w-4 h-4"/> Digital
                        </button>
                    </div>
                )}

                {/* Content Area */}
                {mode === 'OFFSET' && <OffsetCalculator costs={costs} />}
                {mode === 'DIGITAL' && <DigitalCalculator costs={costs} />}
                
                {/* Configuration Panel */}
                {mode === 'CONFIG' && (
                    <div className="bg-white/5 border border-white/10 p-12 rounded-[2.5rem] shadow-3xl max-w-5xl mx-auto animate-fade-in backdrop-blur-xl">
                        <div className="flex items-center gap-6 mb-12 border-b border-white/5 pb-8">
                            <div className="bg-emerald-500/10 p-4 rounded-2xl"><DollarIcon className="w-8 h-8 text-emerald-500"/></div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Base de Costos Industriales</h2>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Ajuste de parámetros fijos y mermas de producción</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Object.entries(costs).map(([key, val]) => (
                                <div key={key} className="group bg-black/40 p-6 rounded-2xl border border-white/5 hover:border-brand-blue/30 transition-all">
                                    <label className="block text-[9px] font-black text-slate-500 uppercase mb-3 tracking-[0.2em] group-focus-within:text-brand-blue transition-colors">
                                        {key.replace(/_/g, ' ')}
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-black text-lg">$</span>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={val} 
                                            onChange={e => setCosts({...costs, [key]: parseFloat(e.target.value) || 0})}
                                            className="w-full pl-10 pr-4 py-3 bg-transparent border-none rounded-xl font-black text-xl text-white focus:ring-0 outline-none transition-all placeholder:text-slate-800"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-16 pt-10 border-t border-white/10 flex justify-end">
                            <button onClick={() => handleSaveConfig(costs)} className="group relative flex items-center gap-3 bg-white text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] overflow-hidden transition-all hover:pr-14">
                                <span className="relative z-10">Sincronizar Costos</span>
                                <SaveIcon className="w-5 h-5 absolute right-8 opacity-0 group-hover:opacity-100 transition-all"/>
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
