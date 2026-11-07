import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils';
import { logActivity } from '../services/activityLogService';
import { SOURCE_PAPERS, DEFAULT_COSTS } from '../constants';
import { CostConfig, Proveedor, InventoryItem, Producto } from '../types';
import { useData } from '../contexts/DataContext';
import { ProductManagementModal } from '../components/ProductManagementModal';
import { SEO } from '../components/SEO';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

type Mode = 'OFFSET' | 'DIGITAL' | 'CONFIG' | 'HUB';

// ── Card de desglose de costo ──────────────────────────────────────────────
const Breakdown: React.FC<{ rows: { k: string; v: string; hint?: string }[]; costo: number; pvp: number; unitario: number }> = ({ rows, costo, pvp, unitario }) => (
    <div style={{ ...S.card, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.divider}` }}>
            <h2 style={{ ...S.h2, fontSize: 16 }}>Desglose del costo</h2>
        </div>
        {rows.map(r => (
            <div key={r.k} style={{ padding: '13px 20px', borderBottom: `1px solid ${C.rowLine}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <span style={{ fontSize: 13.5, color: C.body }}>{r.k}{r.hint ? <span style={{ color: C.faint, fontSize: 11.5 }}> · {r.hint}</span> : null}</span>
                <span style={{ fontSize: 13, fontFamily: MONO, color: C.ink }}>{r.v}</span>
            </div>
        ))}
        <div style={{ padding: '14px 20px', background: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Costo operativo</span>
            <span style={{ fontSize: 15, fontFamily: MONO, color: C.ink }}>{formatCurrency(costo)}</span>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.divider}` }}>
            <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Valor por unidad</span>
            <span style={{ fontSize: 14, fontFamily: MONO, color: C.body }}>{formatCurrency(unitario)}</span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${C.divider}` }}>
            <span style={{ ...S.fieldLabel, marginBottom: 0 }}>Precio sugerido</span>
            <span style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: C.royal }}>{formatCurrency(pvp)}</span>
        </div>
    </div>
);

// ── Calculadora Offset ─────────────────────────────────────────────────────
const OffsetCalculator: React.FC<{
    costs: CostConfig; proveedores: Proveedor[]; inventario: InventoryItem[];
    onSave: (p: any) => void; onOrder: (p: any) => void;
}> = ({ costs, proveedores, onSave, onOrder }) => {
    const [paperId, setPaperId] = useState('QUIMICO');
    const [, setSelectedSizePreset] = useState('1/4_OFICIO');
    const [finalW, setFinalW] = useState(10.5);
    const [finalH, setFinalH] = useState(14.8);
    const [quantity, setQuantity] = useState(100);
    const [cantidadHojasBlock, setCantidadHojasBlock] = useState(100);
    const [colorsFront, setColorsFront] = useState(1);
    const [colorsBack, setColorsBack] = useState(0);
    const [parts, setParts] = useState(2);
    const [hasDesign, setHasDesign] = useState(false);
    const [requiresSRI, setRequiresSRI] = useState(true);

    const getProviderName = (key: string) => proveedores.find(p => p.id === costs.proveedoresPredeterminados?.[key])?.nombre;
    const handlePresetChange = (val: string) => {
        setSelectedSizePreset(val);
        const currentPaper = SOURCE_PAPERS.find(p => p.id === paperId);
        if (currentPaper?.tipo === 'RESMA') {
            switch (val) {
                case 'OFICIO': setFinalW(21.6); setFinalH(33); break;
                case '1/2_OFICIO': setFinalW(21.6); setFinalH(16.5); break;
                case '1/4_OFICIO': setFinalW(10.8); setFinalH(16.5); break;
                case '1/8_OFICIO': setFinalW(10.8); setFinalH(8.25); break;
            }
        } else {
            switch (val) {
                case 'A3': setFinalW(29.7); setFinalH(42); break;
                case 'A4': setFinalW(21); setFinalH(29.7); break;
                case 'A5': setFinalW(14.8); setFinalH(21); break;
                case 'A6': setFinalW(10.5); setFinalH(14.8); break;
            }
        }
    };

    const result = useMemo(() => {
        const paper = SOURCE_PAPERS.find(p => p.id === paperId) || SOURCE_PAPERS[0];
        const marginY = 1.0;
        const marginX = 0.5;
        const usableW = paper.ancho - marginX;
        const usableH = paper.alto - marginY;
        const cutsA = Math.floor(usableW / (finalW / 10)) * Math.floor(usableH / (finalH / 10));
        const cutsB = Math.floor(usableW / (finalH / 10)) * Math.floor(usableH / (finalW / 10));
        const cutsPerUnit = Math.max(cutsA, cutsB);
        if (cutsPerUnit === 0) return null;

        let totalSheetsNeeded = 0;
        let costPapelTotal = 0;

        if (paper.id === 'QUIMICO') {
            const totalJuegos = quantity * cantidadHojasBlock;
            const bajadasNecesarias = Math.ceil(totalJuegos / cutsPerUnit);
            const merma = Math.ceil(bajadasNecesarias * 0.10) + 20;
            const totalBajadasConMerma = bajadasNecesarias + merma;
            const costoHojaOriginal = costs.COSTO_RESMA_QUIMICO_ORIG / 500;
            const costoHojaCopia = costs.COSTO_RESMA_QUIMICO_COPIA / 500;
            costPapelTotal = (totalBajadasConMerma * costoHojaOriginal) + (totalBajadasConMerma * (parts - 1) * costoHojaCopia);
            totalSheetsNeeded = totalBajadasConMerma * parts;
        } else if (paper.tipo === 'RESMA') {
            const bajadas = Math.ceil(quantity / cutsPerUnit);
            const merma = Math.ceil(bajadas * 0.10) + 30;
            const totalHojas = bajadas + merma;
            costPapelTotal = totalHojas * ((costs[paper.costoBaseKey as keyof CostConfig] as number) / 500);
            totalSheetsNeeded = totalHojas;
        } else {
            const bajadas = Math.ceil(quantity / cutsPerUnit);
            const merma = Math.ceil(bajadas * 0.10) + 5;
            const totalPliegos = bajadas + merma;
            costPapelTotal = totalPliegos * (costs[paper.costoBaseKey as keyof CostConfig] as number);
            totalSheetsNeeded = totalPliegos;
        }

        let costPrePrensa = 0;
        if (!hasDesign) costPrePrensa += requiresSRI ? costs.COSTO_DISENO_SRI : 5.00;
        const numPlacas = colorsFront + colorsBack;
        const costingPlaca = (quantity > 2000 || paper.id === 'COUCHE_300') ? costs.COSTO_PLACA_CTP : costs.COSTO_PLACA_POLIESTER;
        costPrePrensa += (numPlacas * costingPlaca);

        const millares = Math.ceil(totalSheetsNeeded / 1000);
        const tiros = millares * (colorsFront + colorsBack);
        const costImpresion = costs.COSTO_ARRANQUE + (tiros * costs.COSTO_MILLAR_IMPRESION);

        let costAcabados = costs.COSTO_CORTE;
        if (paper.id === 'QUIMICO') {
            costAcabados += (quantity * costs.COSTO_BLOCK_ENCOLADO) + (millares * costs.COSTO_NUMERACION);
        }

        const costoTotalProduccion = costPapelTotal + costPrePrensa + costImpresion + costAcabados;
        let pvp = costoTotalProduccion * (1 + costs.MARGEN_GANANCIA);
        if (paper.id === 'QUIMICO' && quantity === 1 && pvp < 15) pvp = 15;

        const materialKey = paper.id === 'QUIMICO' ? 'COSTO_RESMA_QUIMICO_ORIG' : paper.costoBaseKey;
        const placaKey = (quantity > 2000 || paper.id === 'COUCHE_300') ? 'COSTO_PLACA_CTP' : 'COSTO_PLACA_POLIESTER';

        return { paper, cutsPerUnit, costPapelTotal, costPrePrensa, costImpresion, costAcabados, costoTotalProduccion, pvp, unitario: pvp / quantity, materialKey, placaKey };
    }, [paperId, finalW, finalH, quantity, colorsFront, colorsBack, parts, costs, hasDesign, requiresSRI, cantidadHojasBlock]);

    const toggleStyle = (on: boolean): React.CSSProperties => ({
        flex: 1, padding: '10px', borderRadius: 9, border: `1px solid ${on ? C.royal : C.borderStrong}`,
        background: on ? C.royal : '#fff', color: on ? '#fff' : C.body, fontSize: 11, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '.08em',
    });

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, alignItems: 'start' }}>
            <div style={{ ...S.card, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ ...S.h2, fontSize: 16 }}>Configuración offset</h2>
                <label style={{ display: 'block' }}>
                    <span style={S.fieldLabel}>Sustrato</span>
                    <select value={paperId} onChange={e => { setPaperId(e.target.value); handlePresetChange('1/4_OFICIO'); }} style={{ ...S.input, cursor: 'pointer' }}>
                        {SOURCE_PAPERS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Ancho (mm)</span>
                        <input type="number" value={finalW} onChange={e => setFinalW(parseFloat(e.target.value))} style={{ ...S.input, fontFamily: MONO }} /></label>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Alto (mm)</span>
                        <input type="number" value={finalH} onChange={e => setFinalH(parseFloat(e.target.value))} style={{ ...S.input, fontFamily: MONO }} /></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: paperId === 'QUIMICO' ? '2fr 1fr' : '1fr', gap: 12 }}>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Cantidad</span>
                        <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} style={{ ...S.input, fontFamily: MONO, fontSize: 18 }} /></label>
                    {paperId === 'QUIMICO' && (
                        <label style={{ display: 'block' }}><span style={S.fieldLabel}>Hojas/block</span>
                            <select value={cantidadHojasBlock} onChange={e => setCantidadHojasBlock(parseInt(e.target.value))} style={{ ...S.input, cursor: 'pointer' }}>
                                <option value={100}>100</option><option value={50}>50</option>
                            </select></label>
                    )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Partes</span>
                        <input type="number" value={parts} onChange={e => setParts(Math.max(1, parseInt(e.target.value)))} style={{ ...S.input, fontFamily: MONO }} /></label>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Tintas frente</span>
                        <input type="number" value={colorsFront} onChange={e => setColorsFront(Math.max(0, parseInt(e.target.value)))} style={{ ...S.input, fontFamily: MONO }} /></label>
                    <label style={{ display: 'block' }}><span style={S.fieldLabel}>Tintas dorso</span>
                        <input type="number" value={colorsBack} onChange={e => setColorsBack(Math.max(0, parseInt(e.target.value)))} style={{ ...S.input, fontFamily: MONO }} /></label>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setHasDesign(v => !v)} style={toggleStyle(hasDesign)}>{hasDesign ? 'Con arte' : 'Sin arte'}</button>
                    <button type="button" onClick={() => setRequiresSRI(v => !v)} style={toggleStyle(requiresSRI)}>{requiresSRI ? 'SRI' : 'Comercial'}</button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                {result ? (
                    <>
                        <Breakdown
                            costo={result.costoTotalProduccion} pvp={result.pvp} unitario={result.unitario}
                            rows={[
                                { k: 'Material · ' + result.paper.nombre, v: formatCurrency(result.costPapelTotal), hint: getProviderName(result.materialKey) },
                                { k: 'Pre-impresión (placas + arte)', v: formatCurrency(result.costPrePrensa), hint: getProviderName(result.placaKey) },
                                { k: 'Impresión offset', v: formatCurrency(result.costImpresion), hint: `${result.cutsPerUnit} imp./hoja` },
                                { k: 'Acabados', v: formatCurrency(result.costAcabados) },
                            ]}
                        />
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <button style={{ ...S.primaryBtn, flex: 1, justifyContent: 'center' }}
                                onClick={() => onSave({
                                    nombre: `${result.paper.nombre} - ${finalW}x${finalH}mm`, precio: result.pvp,
                                    specs: [`${finalW}x${finalH} mm`, `${quantity} unidades`, `${parts} partes`, result.paper.nombre, 'Offset industrial'],
                                    categoria: requiresSRI ? 'SRI' : 'General', esSRI: requiresSRI, visiblePublico: true,
                                    requiereDiseno: !hasDesign, manejaInventario: false, esActivo: true,
                                    configuracionHabilitada: { dimensiones: true, volumen: true, materiales: true, acabados: true, cromatismo: true, procesosMecanicos: true },
                                })}>Guardar en catálogo</button>
                            <button style={{ ...S.outlineBtn, flex: 1, justifyContent: 'center' }}
                                onClick={() => onOrder({ nombre: `${result.paper.nombre} - ${finalW}x${finalH}mm`, precio: result.pvp, specs: [`${finalW}x${finalH} mm`, `${quantity} un.`, `${parts} pts`] })}>Añadir a pedido</button>
                        </div>
                    </>
                ) : (
                    <div style={{ ...S.card, padding: 40, textAlign: 'center' }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>Dimensiones inválidas</p>
                        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>El tamaño final supera los límites físicos del pliego seleccionado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Calculadora Digital ────────────────────────────────────────────────────
const DigitalCalculator: React.FC<{
    costs: CostConfig; proveedores: Proveedor[]; inventario: InventoryItem[];
    onSave: (p: any) => void; onOrder: (p: any) => void;
}> = ({ costs, proveedores, onSave, onOrder }) => {
    const [format, setFormat] = useState<'A4' | 'A3' | 'SRA3'>('A3');
    const [paperType, setPaperType] = useState('COUCHE_150');
    const [colorMode, setColorMode] = useState<'COLOR' | 'BW'>('COLOR');
    const [sides, setSides] = useState<1 | 2>(1);
    const [quantity, setQuantity] = useState(10);

    const getProviderName = (key: string) => proveedores.find(p => p.id === costs.proveedoresPredeterminados?.[key])?.nombre;

    const calculation = useMemo(() => {
        let clickCost = colorMode === 'COLOR' ? costs.CLICK_DIGITAL_A3 : costs.CLICK_DIGITAL_BN;
        if (format === 'A4') clickCost = clickCost * 0.6;

        let sheetCost = 0;
        switch (paperType) {
            case 'BOND': sheetCost = costs.COSTO_RESMA_BOND / 500; break;
            case 'COUCHE_115': sheetCost = (costs.COSTO_PLIEGO_COUCHE_300 / 4) * 0.8; break;
            case 'COUCHE_300': sheetCost = costs.COSTO_PLIEGO_COUCHE_300 / 4; break;
            case 'ADHESIVO': sheetCost = costs.COSTO_PLIEGO_ADHESIVO / 4; break;
            default: sheetCost = 0.10;
        }

        const productionCost = ((quantity * sides) * clickCost) + (quantity * sheetCost);
        const pvp = productionCost * (1 + costs.MARGEN_GANANCIA);

        let sheetKey = '';
        switch (paperType) {
            case 'BOND': sheetKey = 'COSTO_RESMA_BOND'; break;
            case 'COUCHE_115': sheetKey = 'COSTO_PLIEGO_COUCHE_300'; break;
            case 'COUCHE_300': sheetKey = 'COSTO_PLIEGO_COUCHE_300'; break;
            case 'ADHESIVO': sheetKey = 'COSTO_PLIEGO_ADHESIVO'; break;
        }
        const clickKey = colorMode === 'COLOR' ? 'CLICK_DIGITAL_A3' : 'CLICK_DIGITAL_BN';

        return {
            unitCost: productionCost / quantity, totalCost: productionCost,
            unitPvp: pvp / quantity, totalPvp: pvp, sheetKey, clickKey,
            clickCost: (quantity * sides) * clickCost, materialCost: quantity * sheetCost,
        };
    }, [format, paperType, colorMode, sides, quantity, costs]);

    const seg = (on: boolean): React.CSSProperties => ({
        flex: 1, padding: '9px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer',
        fontFamily: 'inherit', background: on ? '#fff' : 'transparent', color: on ? C.royal : C.faint,
    });

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, alignItems: 'start' }}>
            <div style={{ ...S.card, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h2 style={{ ...S.h2, fontSize: 16 }}>Configuración digital</h2>
                <div>
                    <span style={S.fieldLabel}>Formato</span>
                    <div style={{ display: 'flex', gap: 4, background: C.softGray, padding: 4, borderRadius: 10 }}>
                        {(['A4', 'A3', 'SRA3'] as const).map(f => <button key={f} onClick={() => setFormat(f)} style={seg(format === f)}>{f}</button>)}
                    </div>
                </div>
                <label style={{ display: 'block' }}>
                    <span style={S.fieldLabel}>Sustrato</span>
                    <select value={paperType} onChange={e => setPaperType(e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                        <option value="BOND">Bond 75g estándar</option>
                        <option value="COUCHE_115">Couché 115g</option>
                        <option value="COUCHE_300">Couché 300g</option>
                        <option value="ADHESIVO">Adhesivo glossy</option>
                    </select>
                </label>
                <label style={{ display: 'block' }}><span style={S.fieldLabel}>Cantidad</span>
                    <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 0))} style={{ ...S.input, fontFamily: MONO, fontSize: 18 }} /></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                        <span style={S.fieldLabel}>Color</span>
                        <div style={{ display: 'flex', gap: 4, background: C.softGray, padding: 4, borderRadius: 10 }}>
                            <button onClick={() => setColorMode('COLOR')} style={seg(colorMode === 'COLOR')}>CMYK</button>
                            <button onClick={() => setColorMode('BW')} style={seg(colorMode === 'BW')}>B/N</button>
                        </div>
                    </div>
                    <div>
                        <span style={S.fieldLabel}>Caras</span>
                        <div style={{ display: 'flex', gap: 4, background: C.softGray, padding: 4, borderRadius: 10 }}>
                            <button onClick={() => setSides(1)} style={seg(sides === 1)}>1</button>
                            <button onClick={() => setSides(2)} style={seg(sides === 2)}>2</button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                <Breakdown
                    costo={calculation.totalCost} pvp={calculation.totalPvp} unitario={calculation.unitPvp}
                    rows={[
                        { k: `Material · ${paperType.replace('_', ' ')}`, v: formatCurrency(calculation.materialCost), hint: getProviderName(calculation.sheetKey) },
                        { k: `Clicks (${colorMode === 'COLOR' ? 'color' : 'B/N'}, ${sides} cara${sides === 2 ? 's' : ''})`, v: formatCurrency(calculation.clickCost), hint: getProviderName(calculation.clickKey) },
                    ]}
                />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button style={{ ...S.primaryBtn, flex: 1, justifyContent: 'center' }}
                        onClick={() => onSave({
                            nombre: `Digital ${paperType} ${format}`, precio: calculation.totalPvp,
                            specs: [format, paperType, `${quantity} unidades`, colorMode, sides === 1 ? '1 cara' : '2 caras'],
                            categoria: 'Digital', esSRI: false, visiblePublico: true, requiereDiseno: true, manejaInventario: false, esActivo: true,
                            configuracionHabilitada: { dimensiones: true, volumen: false, materiales: true, acabados: true, cromatismo: true, procesosMecanicos: false },
                        })}>Guardar en catálogo</button>
                    <button style={{ ...S.outlineBtn, flex: 1, justifyContent: 'center' }}
                        onClick={() => onOrder({ nombre: `Digital ${paperType} ${format}`, precio: calculation.totalPvp, specs: [format, `${quantity} un.`, colorMode] })}>Añadir a pedido</button>
                </div>
            </div>
        </div>
    );
};

// ── Tabla maestra ──────────────────────────────────────────────────────────
const MasterTableModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const matrices = [
        { name: 'Libretines de facturas', size: '1/4 Oficio', units: '100 hjs', parts: '2 partes', price: 15.50 },
        { name: 'Volantes publicitarios', size: 'A5', units: '1000 u.', parts: 'Full color', price: 45.00 },
        { name: 'Tarjetas de presentación', size: '9x5 cm', units: '1000 u.', parts: 'Couché 300g', price: 25.00 },
        { name: 'Afiches de eventos', size: 'A3', units: '100 u.', parts: 'Digital', price: 35.00 },
    ];
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,17,64,.45)', backdropFilter: 'blur(2px)' }} onClick={onClose} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 640, ...S.card, overflow: 'hidden' }}>
                <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.divider}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ ...S.h2, fontSize: 17 }}>Matriz de referencia</h2>
                    <button style={{ ...S.softBtn, padding: '6px 10px' }} onClick={onClose}>Cerrar</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: 520 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr .9fr', padding: '11px 20px', background: C.surfaceAlt, borderBottom: `1px solid ${C.divider}` }}>
                            <span style={S.colHead}>Trabajo</span><span style={S.colHead}>Tamaño</span><span style={S.colHead}>Escala</span><span style={S.colHead}>Config.</span><span style={{ ...S.colHead, textAlign: 'right' }}>Valor</span>
                        </div>
                        {matrices.map(m => (
                            <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr .9fr', alignItems: 'center', padding: '13px 20px', borderBottom: `1px solid ${C.rowLine}` }}>
                                <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{m.name}</span>
                                <span style={{ fontSize: 12, color: C.muted }}>{m.size}</span>
                                <span style={{ fontSize: 12, color: C.muted }}>{m.units}</span>
                                <span style={{ fontSize: 12, color: C.muted }}>{m.parts}</span>
                                <span style={{ textAlign: 'right', fontFamily: MONO, fontWeight: 600, color: C.royal }}>{formatCurrency(m.price)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ padding: '12px 20px', background: C.surfaceAlt, fontSize: 11.5, color: C.faint }}>
                    Valores referenciales sujetos a la fluctuación de insumos del mercado local.
                </div>
            </div>
        </div>
    );
};

// ── Página ─────────────────────────────────────────────────────────────────
const CalculadoraPreciosPage: React.FC = () => {
    const context = useOutletContext<{ currentUser?: any }>() || {};
    const currentUser = context?.currentUser;
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryMode = searchParams.get('mode') as Mode;
    const [mode, setMode] = useState<Mode>(queryMode || 'HUB');
    const [costs, setCosts] = useState<CostConfig>(DEFAULT_COSTS);
    const [showMasterTable, setShowMasterTable] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [productToSave, setProductToSave] = useState<Partial<Producto> | null>(null);
    const [loading, setLoading] = useState(true);
    const { proveedores, inventario, refreshData } = useData();

    useEffect(() => { if (queryMode && queryMode !== mode) setMode(queryMode); }, [queryMode]);
    const handleSetMode = (m: Mode) => { setMode(m); setSearchParams({ mode: m }); };

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const { data } = await supabase.from('app_config').select('data').eq('id', 1).single();
                if (data?.data) {
                    const dbCosts = data.data;
                    const merged = { ...DEFAULT_COSTS };
                    Object.keys(DEFAULT_COSTS).forEach(key => { if (dbCosts[key] !== undefined) (merged as any)[key] = dbCosts[key]; });
                    setCosts(merged);
                }
            } catch (err) { console.warn('[Calculadora] usando defaults:', err); }
            finally { setLoading(false); }
        })();
    }, []);

    const handleSaveConfig = async (newCosts: CostConfig) => {
        setLoading(true);
        try {
            const { data: currentConfig } = await supabase.from('app_config').select('data').eq('id', 1).single();
            const updatedData = { ...(currentConfig?.data || {}), ...newCosts };
            const { error } = await supabase.from('app_config').update({ data: updatedData, updated_at: new Date().toISOString() }).eq('id', 1);
            if (error) throw error;
            setCosts(newCosts);
            await logActivity(currentUser?.nombre || 'Admin', currentUser?.rol || 'Administrador', 'CAMBIO_CONFIG', 'Actualización de parámetros de costos', 'Producción');
            setMode('OFFSET');
        } catch (err) { console.error('[Calculadora] error al guardar:', err); alert('Error al guardar la configuración.'); }
        finally { setLoading(false); }
    };

    const handleSaveToCatalog = (p: Partial<Producto>) => { setProductToSave(p); setShowSaveModal(true); };

    const handleAddToOrder = (p: any) => {
        try {
            const newItem = {
                id: Math.random().toString(36).substr(2, 9),
                nombre: p.nombre, descripcion: p.specs.join(' | '), precioFinal: p.precio,
                especificaciones: { ...p.configuracionHabilitada, detalles_tecnicos: p.specs }, product: p,
            };
            const existing = JSON.parse(localStorage.getItem('pending_order_items') || '[]');
            localStorage.setItem('pending_order_items', JSON.stringify([...existing, newItem]));
            alert('Ítem agregado al pedido. Redirigiendo…');
            navigate('/nuevo?action=resume');
        } catch (err) { console.error('Error al añadir al pedido:', err); }
    };

    const handleFinalSave = async (product: Producto | Producto[]) => {
        try {
            const products = Array.isArray(product) ? product : [product];
            const { error } = await supabase.from('productos').insert(products.map(p => ({ ...p, id: undefined })));
            if (error) throw error;
            alert('Producto(s) guardado(s) en el catálogo.');
            setShowSaveModal(false);
            refreshData();
            logActivity(currentUser?.nombre || 'Admin', currentUser?.rol || 'Administrador', 'CREATE_PRODUCT', `Creado desde calculadora: ${Array.isArray(product) ? product.length + ' productos' : product.nombre}`, 'Catálogo');
        } catch (err) { console.error('Error al guardar en catálogo:', err); alert('Error al guardar en el catálogo.'); }
    };

    const tabs: { id: Mode; label: string }[] = [
        { id: 'HUB', label: 'Inicio' }, { id: 'OFFSET', label: 'Offset' }, { id: 'DIGITAL', label: 'Digital' }, { id: 'CONFIG', label: 'Calibración' },
    ];

    return (
        <div style={S.page}>
            <style>{PANEL_KEYFRAMES}</style>
            <SEO title="Calculadora de Precios · Imprenta Córdova" />
            <div style={S.wrap}>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                        <p style={S.eyebrow}>Finanzas</p>
                        <h1 style={S.h1}>Calculadora de Precios</h1>
                        <p style={S.lead}>Uso interno. El precio al cliente lo confirma quien atiende.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                        <button style={S.outlineBtn} onClick={() => setShowMasterTable(true)}>Matriz de referencia</button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => handleSetMode(t.id)}
                            style={{
                                padding: '8px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                ...(mode === t.id ? { background: C.royal, color: '#fff', border: `1px solid ${C.royal}` } : { background: '#fff', color: C.body, border: `1px solid ${C.borderStrong}` }),
                            }}>{t.label}</button>
                    ))}
                </div>

                {loading && mode === 'CONFIG' ? (
                    <div style={{ ...S.card, padding: 48, textAlign: 'center', color: C.faint, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.2em' }}>Cargando…</div>
                ) : mode === 'HUB' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
                        {[
                            { id: 'OFFSET' as Mode, title: 'Offset industrial', desc: 'Alto volumen, talonarios y documentos SRI.' },
                            { id: 'DIGITAL' as Mode, title: 'Digital', desc: 'Impresión rápida on-demand y tirajes cortos.' },
                            { id: 'CONFIG' as Mode, title: 'Calibración', desc: 'Costos operativos base y proveedores por insumo.' },
                        ].map(item => (
                            <button key={item.id} onClick={() => handleSetMode(item.id)}
                                style={{ textAlign: 'left', padding: 20, borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${C.border}`, background: '#fff' }}>
                                <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, color: C.ink }}>{item.title}</div>
                                <p style={{ margin: '6px 0 0', fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>{item.desc}</p>
                                <div style={{ marginTop: 12, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: C.royal }}>Abrir →</div>
                            </button>
                        ))}
                    </div>
                ) : mode === 'OFFSET' ? (
                    <OffsetCalculator costs={costs} proveedores={proveedores} inventario={inventario} onSave={handleSaveToCatalog} onOrder={handleAddToOrder} />
                ) : mode === 'DIGITAL' ? (
                    <DigitalCalculator costs={costs} proveedores={proveedores} inventario={inventario} onSave={handleSaveToCatalog} onOrder={handleAddToOrder} />
                ) : (
                    <div style={{ ...S.card, padding: '20px 22px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
                            <h2 style={S.h2}>Calibración de costos base</h2>
                            <div style={{ display: 'flex', gap: 9 }}>
                                <button style={S.softBtn} onClick={() => setMode('HUB')}>Cancelar</button>
                                <button style={S.primaryBtn} onClick={() => handleSaveConfig(costs)}>Guardar</button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
                            {Object.entries(costs).filter(([key]) => key !== 'proveedoresPredeterminados').map(([key, val]) => (
                                <div key={key}>
                                    <span style={{ ...S.fieldLabel, fontSize: 10 }}>{key.replace(/_/g, ' ').toLowerCase()}</span>
                                    <input type="number" step="0.0001" value={val as number} onChange={e => setCosts({ ...costs, [key]: parseFloat(e.target.value) })}
                                        style={{ ...S.input, fontFamily: MONO }} />
                                    <select value={costs.proveedoresPredeterminados?.[key] || ''} onChange={e => setCosts({ ...costs, proveedoresPredeterminados: { ...(costs.proveedoresPredeterminados || {}), [key]: e.target.value } })}
                                        style={{ ...S.input, marginTop: 6, padding: '8px 10px', fontSize: 11.5, cursor: 'pointer' }}>
                                        <option value="">Sin proveedor predeterminado</option>
                                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showMasterTable && <MasterTableModal onClose={() => setShowMasterTable(false)} />}
            {showSaveModal && (
                <ProductManagementModal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} onSave={handleFinalSave} productToEdit={productToSave as Producto} defaultMode="SINGLE" />
            )}
        </div>
    );
};

export default CalculadoraPreciosPage;
