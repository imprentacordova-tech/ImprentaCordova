import React, { useState, useEffect } from 'react';
import { Producto } from '../types';
import { 
    BoxIcon, CloseIcon, PhotoIcon, 
    TableIcon, DocumentTextIcon, 
    LayersIcon, CloudArrowUpIcon,
    RulerIcon, ActivityIcon, ShieldCheckIcon,
    SparklesIcon, PaletteIcon, Cog8ToothIcon
} from './Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFile } from '../services/supabase';

const SIZES = ["1/8 Oficio", "1/4 Oficio", "1/2 Oficio", "Oficio"];
const PRESENTATIONS = [
    { id: 'HOJAS', label: 'Hojas Sueltas', icon: DocumentTextIcon },
    { id: 'BLOCK', label: 'En Blocks', icon: LayersIcon }
];
const COPIES = [
    { id: 1, label: 'Original', suffix: 'Único' },
    { id: 2, label: 'Original + 1 Copia', suffix: 'Duplicado' },
    { id: 3, label: 'Original + 2 Copias', suffix: 'Triplicado' }
];
const QUANTITIES = [
    { label: "25 h", val: 0.25 },
    { label: "50 h", val: 0.5 },
    { label: "100 h", val: 1 },
    { label: "250 h", val: 2.5 },
    { label: "500 h", val: 5 },
    { label: "1000 h", val: 10 }
];

export const ProductManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Producto | Producto[]) => void;
    productToEdit: Producto | null;
    defaultMode?: 'SINGLE' | 'MATRIX';
}> = ({ isOpen, onClose, onSave, productToEdit, defaultMode = 'SINGLE' }) => {
    const [mode, setMode] = useState<'SINGLE' | 'MATRIX'>(defaultMode);
    const [baseProduct, setBaseProduct] = useState<Partial<Producto>>({ 
        nombre: '', 
        categoria: 'General', 
        esSRI: false, 
        precio: 0, 
        imagenUrl: '', 
        specs: [],
        visiblePublico: true,
        requiereDiseno: false,
        manejaInventario: false,
        esActivo: true,
        codigoInterno: '',
        tags: [],
        configuracionHabilitada: {
            dimensiones: true,
            volumen: true,
            material: true,
            acabados: true,
            cromatismo: true,
            procesosMecanicos: true
        }
    });
    const [selectedSizes, setSelectedSizes] = useState<string[]>(["1/4 Oficio"]);
    const [selectedPresentations, setSelectedPresentations] = useState<string[]>(["BLOCK"]);
    const [selectedCopies, setSelectedCopies] = useState<number[]>([2]);
    const [selectedQtys, setSelectedQtys] = useState<string[]>(["50 h"]);
    const [extraCopyPrice, setExtraCopyPrice] = useState(2.50); 
    const [generatedPreview, setGeneratedPreview] = useState<Producto[]>([]);

    useEffect(() => {
        if (productToEdit) {
            setBaseProduct({
                ...productToEdit,
                visiblePublico: productToEdit.visiblePublico ?? true,
                requiereDiseno: productToEdit.requiereDiseno ?? false,
                manejaInventario: productToEdit.manejaInventario ?? false,
                esActivo: productToEdit.esActivo ?? true,
                codigoInterno: productToEdit.codigoInterno ?? '',
                tags: productToEdit.tags ?? [],
                configuracionHabilitada: productToEdit.configuracionHabilitada ?? {
                    dimensiones: true,
                    volumen: true,
                    material: true,
                    acabados: true,
                    cromatismo: true,
                    procesosMecanicos: true
                }
            });
            setMode('SINGLE');
        } else {
            setBaseProduct({ 
                nombre: '', 
                descripcion: '', 
                precio: 0, 
                categoria: 'General', 
                esSRI: false, 
                imagenUrl: '', 
                specs: [],
                visiblePublico: true,
                requiereDiseno: false,
                manejaInventario: false,
                esActivo: true,
                codigoInterno: '',
                tags: [],
                configuracionHabilitada: {
                    dimensiones: true,
                    volumen: true,
                    material: true,
                    acabados: true,
                    cromatismo: true,
                    procesosMecanicos: true
                }
            });
            setMode(defaultMode);
        }
    }, [productToEdit, isOpen, defaultMode]);

    useEffect(() => {
        if (mode === 'MATRIX' && baseProduct.nombre) {
            const matrix: Producto[] = [];
            selectedSizes.forEach(size => {
                selectedPresentations.forEach(pres => {
                    selectedCopies.forEach(copyCount => {
                        selectedQtys.forEach(qtyLabel => {
                            const qtyObj = QUANTITIES.find(q => q.label === qtyLabel);
                            const multiplier = qtyObj ? qtyObj.val : 1;
                            const presInfo = PRESENTATIONS.find(p => p.id === pres);
                            const copyInfo = COPIES.find(c => c.id === copyCount);
                            let calculatedPrice = (baseProduct.precio || 0) * multiplier;
                            if (copyCount > 2) calculatedPrice += (extraCopyPrice * (copyCount - 2));
                            const fullName = `${baseProduct.nombre} (${size} - ${presInfo?.label} x ${qtyLabel} - ${copyInfo?.suffix})`;
                            matrix.push({
                                id: `preview-${size}-${pres}-${copyCount}-${qtyLabel}`,
                                nombre: fullName.toUpperCase(),
                                descripcion: baseProduct.descripcion || `${baseProduct.nombre} en tamaño ${size}, ${presInfo?.label} con ${copyInfo?.label}.`,
                                precio: calculatedPrice,
                                categoria: baseProduct.categoria || 'General',
                                esSRI: baseProduct.esSRI,
                                imagenUrl: baseProduct.imagenUrl,
                                specs: [size, presInfo?.label || '', qtyLabel, copyInfo?.suffix || ''].filter(Boolean) as string[],
                                visiblePublico: baseProduct.visiblePublico,
                                requiereDiseno: baseProduct.requiereDiseno,
                                manejaInventario: baseProduct.manejaInventario,
                                esActivo: baseProduct.esActivo,
                                codigoInterno: `${baseProduct.codigoInterno || 'MAT'}-${size[0]}${pres[0]}${copyCount}`,
                                tags: baseProduct.tags
                            });
                        });
                    });
                });
            });
            setGeneratedPreview(matrix);
        }
    }, [mode, baseProduct, selectedSizes, selectedPresentations, selectedCopies, selectedQtys, extraCopyPrice]);

    if (!isOpen) return null;

    const toggleItem = (list: any[], setList: any, item: any) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose} />
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass-panel-light w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden relative z-10 rounded-[2.5rem]">
                    <div className="flex justify-between items-center p-10 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-brand-blue rounded-2xl text-white shadow-blue-glow"><TableIcon className="w-8 h-8"/></div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Estudio de Creación <span className="text-brand-blue text-4xl">Maestro</span></h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Protocolo de Generación de Matriz Avanzada</p>
                            </div>
                        </div>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                            <button onClick={() => setMode('SINGLE')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'SINGLE' ? 'bg-white text-brand-blue shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Unitario</button>
                            <button onClick={() => setMode('MATRIX')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'MATRIX' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>Matriz</button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-hidden flex">
                        <div className="w-1/3 p-10 overflow-y-auto border-r border-slate-100 space-y-12 custom-scrollbar bg-white">
                            <div className="space-y-6">
                                <label className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em] block">Definición Base</label>
                                <input type="text" placeholder="NOMBRE DEL CONCEPTO" value={baseProduct.nombre} onChange={e => setBaseProduct({...baseProduct, nombre: e.target.value.toUpperCase()})} className="elite-input w-full text-lg uppercase" />
                                <textarea placeholder="ESPECIFICACIONES Y NOTAS TÉCNICAS" value={baseProduct.descripcion} onChange={e => setBaseProduct({...baseProduct, descripcion: e.target.value})} className="elite-input w-full h-32 text-[10px] uppercase tracking-widest leading-loose" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tarifa Base ($)</label>
                                    <input type="number" value={baseProduct.precio} onChange={e => setBaseProduct({...baseProduct, precio: parseFloat(e.target.value)})} className="elite-input w-full" />
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <label className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em] block flex items-center gap-2"><PhotoIcon className="w-4 h-4"/> Identidad Visual</label>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <input 
                                            type="text" 
                                            placeholder="URL DE IMAGEN (EJ. HTTPS://...)" 
                                            value={baseProduct.imagenUrl} 
                                            onChange={e => setBaseProduct({...baseProduct, imagenUrl: e.target.value})} 
                                            className="elite-input flex-grow text-[10px]" 
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => document.getElementById('product-image-upload')?.click()}
                                            className="p-4 bg-slate-50 hover:bg-brand-blue text-slate-400 hover:text-white rounded-xl border border-slate-100 transition-all"
                                            title="Subir Imagen"
                                        >
                                            <CloudArrowUpIcon className="w-5 h-5" />
                                        </button>
                                        <input 
                                            id="product-image-upload"
                                            type="file" 
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    try {
                                                        const file = e.target.files[0];
                                                        const url = await uploadFile(file, 'catalog', `prod_${Date.now()}`);
                                                        setBaseProduct({...baseProduct, imagenUrl: url});
                                                    } catch (err) {
                                                        console.error("Upload failed", err);
                                                        alert("Error al subir imagen");
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    {baseProduct.imagenUrl && (
                                        <div className="h-32 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                                            <img src={baseProduct.imagenUrl} className="w-full h-full object-cover opacity-60" alt="Vista Previa" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block flex items-center gap-2"><RulerIcon className="w-4 h-4"/> Atributos Técnicos</label>
                                <input 
                                    type="text" 
                                    placeholder="ESPECIFICACIONES (SEPARADAS POR COMA)" 
                                    value={baseProduct.specs?.join(', ')} 
                                    onChange={e => setBaseProduct({...baseProduct, specs: e.target.value.split(',').map(s => s.trim())})} 
                                    className="elite-input w-full text-[10px]" 
                                />
                            </div>

                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Core Category</label>
                                <select 
                                    value={baseProduct.categoria} 
                                    onChange={e => setBaseProduct({...baseProduct, categoria: e.target.value})}
                                    className="elite-input w-full appearance-none text-[10px] font-black uppercase tracking-widest"
                                >
                                    <option value="General">GENERAL</option>
                                    <option value="SRI">SRI OFFICIAL</option>
                                    <option value="Publicidad">PUBLICIDAD</option>
                                    <option value="Tarjetas">TARJETAS</option>
                                    <option value="Gran Formato">GRAN FORMATO</option>
                                    <option value="Sublimación">SUBLIMACIÓN</option>
                                </select>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <label className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em] block flex items-center gap-2"><ShieldCheckIcon className="w-4 h-4"/> Parámetros Internos</label>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${baseProduct.visiblePublico ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`}></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Visible en Web Pública</span>
                                        </div>
                                        <button 
                                            onClick={() => setBaseProduct({...baseProduct, visiblePublico: !baseProduct.visiblePublico})}
                                            className={`w-10 h-5 rounded-full relative transition-all ${baseProduct.visiblePublico ? 'bg-brand-blue' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${baseProduct.visiblePublico ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${baseProduct.esActivo ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-red-200'}`}></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Estado del Activo (Venta)</span>
                                        </div>
                                        <button 
                                            onClick={() => setBaseProduct({...baseProduct, esActivo: !baseProduct.esActivo})}
                                            className={`w-10 h-5 rounded-full relative transition-all ${baseProduct.esActivo ? 'bg-emerald-500' : 'bg-red-500'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${baseProduct.esActivo ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${baseProduct.requiereDiseno ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-300'}`}></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Requiere Diseño Personalizado</span>
                                        </div>
                                        <button 
                                            onClick={() => setBaseProduct({...baseProduct, requiereDiseno: !baseProduct.requiereDiseno})}
                                            className={`w-10 h-5 rounded-full relative transition-all ${baseProduct.requiereDiseno ? 'bg-blue-500' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${baseProduct.requiereDiseno ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${baseProduct.manejaInventario ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-slate-300'}`}></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Control de Inventario</span>
                                        </div>
                                        <button 
                                            onClick={() => setBaseProduct({...baseProduct, manejaInventario: !baseProduct.manejaInventario})}
                                            className={`w-10 h-5 rounded-full relative transition-all ${baseProduct.manejaInventario ? 'bg-purple-500' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${baseProduct.manejaInventario ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Código Interno / SKU</label>
                                    <input 
                                        type="text" 
                                        placeholder="EJ: OF-1001-A" 
                                        value={baseProduct.codigoInterno} 
                                        onChange={e => setBaseProduct({...baseProduct, codigoInterno: e.target.value.toUpperCase()})}
                                        className="elite-input w-full text-[10px]"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Tags de Búsqueda (Comas)</label>
                                    <input 
                                        type="text" 
                                        placeholder="EJ: PREMIUM, MATE, RAPIDO" 
                                        value={baseProduct.tags?.join(', ')} 
                                        onChange={e => setBaseProduct({...baseProduct, tags: e.target.value.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)})}
                                        className="elite-input w-full text-[10px]"
                                    />
                                </div>

                                <div className="space-y-8 pt-10 border-t border-slate-100 bg-slate-50/30 p-8 rounded-[2rem]">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-1.5 h-10 bg-brand-blue rounded-full shadow-blue-glow"></div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em]">Protocolo de Ingeniería</h4>
                                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Módulos habilitados en configurador industrial</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { id: 'dimensiones', label: 'Matriz de Dimensiones', icon: RulerIcon },
                                            { id: 'volumen', label: 'Cálculo de Volumen', icon: ActivityIcon },
                                            { id: 'material', label: 'Sustratos y Copias', icon: LayersIcon },
                                            { id: 'acabados', label: 'Acabados de Élite', icon: SparklesIcon },
                                            { id: 'cromatismo', label: 'Gama de Color', icon: PaletteIcon },
                                            { id: 'procesosMecanicos', label: 'Procesos Mecánicos', icon: Cog8ToothIcon }
                                        ].map(mod => (
                                            <div key={mod.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 group hover:border-brand-blue/20 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <mod.icon className={`w-4 h-4 ${(baseProduct.configuracionHabilitada as any)?.[mod.id] ? 'text-brand-blue' : 'text-slate-300'}`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${(baseProduct.configuracionHabilitada as any)?.[mod.id] ? 'text-slate-900' : 'text-slate-400'}`}>{mod.label}</span>
                                                </div>
                                                <button 
                                                    onClick={() => setBaseProduct({
                                                        ...baseProduct, 
                                                        configuracionHabilitada: {
                                                            ...baseProduct.configuracionHabilitada,
                                                            [mod.id]: !(baseProduct.configuracionHabilitada as any)?.[mod.id]
                                                        }
                                                    })}
                                                    className={`w-10 h-5 rounded-full relative transition-all ${(baseProduct.configuracionHabilitada as any)?.[mod.id] ? 'bg-brand-blue shadow-blue-glow-sm' : 'bg-slate-100'}`}
                                                >
                                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${(baseProduct.configuracionHabilitada as any)?.[mod.id] ? 'right-1' : 'left-1'}`}></div>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                </div>
                                              {mode === 'MATRIX' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pt-10 border-t border-slate-100">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><RulerIcon className="w-4 h-4 text-brand-blue"/> Dimensions</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {SIZES.map(s => <button key={s} onClick={() => toggleItem(selectedSizes, setSelectedSizes, s)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all border ${selectedSizes.includes(s) ? 'bg-brand-blue border-brand-blue text-white shadow-blue-glow-sm' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>{s}</button>)}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><LayersIcon className="w-4 h-4 text-brand-blue"/> Formats</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {PRESENTATIONS.map(p => <button key={p.id} onClick={() => toggleItem(selectedPresentations, setSelectedPresentations, p.id)} className={`flex items-center justify-center gap-3 p-4 rounded-xl text-[9px] font-black uppercase transition-all border ${selectedPresentations.includes(p.id) ? 'bg-brand-blue border-brand-blue text-white shadow-blue-glow-sm' : 'bg-slate-50 border-slate-100 text-slate-500'}`}><p.icon className="w-4 h-4" /> {p.label}</button>)}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scales</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {QUANTITIES.map(q => <button key={q.label} onClick={() => toggleItem(selectedQtys, setSelectedQtys, q.label)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border ${selectedQtys.includes(q.label) ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>{q.label}</button>)}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="flex-1 bg-slate-50/50 p-10 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Flujo de <span className="text-brand-blue">Instancias</span> [{generatedPreview.length}]</h3>
                                <ActivityIcon className="w-5 h-5 text-brand-blue/50 animate-pulse" />
                            </div>
                            <div className="flex-grow overflow-y-auto space-y-3 pr-4 custom-scrollbar">
                                {generatedPreview.map((p, idx) => (
                                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.01 }} key={p.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center group hover:bg-slate-50 hover:border-brand-blue/20 transition-all">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-brand-blue"><BoxIcon className="w-5 h-5"/></div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-brand-blue transition-colors">{p.nombre}</p>
                                        </div>
                                        <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                                            <span className="text-[10px] font-black text-brand-blue">$</span>
                                            <input type="number" value={p.precio} onChange={e => setGeneratedPreview(prev => prev.map(prevP => prevP.id === p.id ? { ...prevP, precio: parseFloat(e.target.value) } : prevP))} className="w-16 bg-transparent text-right font-black text-slate-900 outline-none" />
                                        </div>
                                    </motion.div>
                                ))}
                                {generatedPreview.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-10 text-[10px] font-black uppercase tracking-[0.5em]">Sistema en Espera</div>}
                            </div>
                        </div>
                    </div>

                    <div className="p-10 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <button onClick={onClose} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Abortar Proceso</button>
                        <button onClick={() => onSave(mode === 'SINGLE' ? (baseProduct as Producto) : generatedPreview)} className="px-20 py-5 bg-brand-blue text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-blue-glow hover:scale-[1.02] active:scale-95 transition-all">
                            {mode === 'SINGLE' ? 'Materializar Concepto' : `Inicializar ${generatedPreview.length} Unidades`}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
