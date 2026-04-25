
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircleIcon, ArrowRightIcon, BoxIcon, 
    LayersIcon, HashIcon, ScissorsIcon, 
    ChevronDownIcon, InfoIcon, SparklesIcon,
    ClipboardIcon, FileTextIcon, MonitorIcon,
    CpuIcon, ShieldCheckIcon
} from '../Icons';

interface ProductConfiguratorProps {
    product: any;
    onComplete: (config: any) => void;
    onCancel: () => void;
    regimen?: string;
}

const ProductConfigurator: React.FC<ProductConfiguratorProps> = ({ product, onComplete, onCancel, regimen }) => {
    // Basic Specs
    const [cantidad, setCantidad] = useState(1);
    
    // SRI Contingency Check
    const isContingencyLimit = (regimen === 'General' || regimen === 'Rimpe Emprendedor') && product.esSRI;
    
    useEffect(() => {
        if (isContingencyLimit && cantidad > 25) {
            setCantidad(25);
        }
    }, [cantidad, isContingencyLimit]);

    const [tamano, setTamano] = useState('1/4 Oficio');
    const [tipoPapel, setTipoPapel] = useState('Bond 75g');
    const [copias, setCopias] = useState('Original y 1 Copia');
    const [hojasPorTalonario, setHojasPorTalonario] = useState(50);
    
    // Industrial Features
    const [numerado, setNumerado] = useState(false);
    const [desde, setDesde] = useState('0001');
    const [hasta, setHasta] = useState('0050');
    const [perforado, setPerforado] = useState(false);
    
    // SRI specific (if applicable)
    const [sriAutorizacion, setSriAutorizacion] = useState('');
    const [sriVence, setSriVence] = useState('');

    // Additional Industrial Specs
    const [acabado, setAcabado] = useState('Ninguno');
    const [tintas, setTintas] = useState('Full Color');
    const [orientacion, setOrientacion] = useState('Vertical');

    const acabados = ['Ninguno', 'Laminado Mate', 'Laminado Brillo', 'Barniz UV', 'Troquelado', 'Engomado'];
    const tintasOpciones = ['1 Color', '2 Colores', 'Full Color', 'Pantone / Especial'];
    const unitPrice = product.precio || 0;
    const [total, setTotal] = useState(unitPrice);

    // Dynamic Price Engine
    useEffect(() => {
        // Base calculation
        let base = unitPrice * cantidad;
        
        // Handling fixed pricing for small quantities if needed
        if (cantidad < 1) base = unitPrice;

        // Industrial adjustments
        if (numerado) base += (2.50 * Math.ceil(cantidad / 5)); // Scaled by blocks of 5
        if (perforado) base += (1.00 * Math.ceil(cantidad / 5));
        
        // Acabado adjustments
        if (acabado !== 'Ninguno') base += (5.00 * Math.ceil(cantidad / 10));
        
        // Tinta multiplier
        const tintaMult = tintas.includes('1 Color') ? 0.9 : tintas.includes('Full Color') ? 1.2 : 1.5;
        base *= tintaMult;

        // Complexity multiplier for copies
        const copyMultiplier = copias.includes('3 Copias') ? 1.5 : copias.includes('2 Copias') ? 1.3 : copias.includes('1 Copia') ? 1.15 : 1;
        base *= copyMultiplier;

        setTotal(base);
    }, [cantidad, unitPrice, numerado, perforado, copias, acabado, tintas]);

    const tamanos = ['1/8 Oficio', '1/4 Oficio', '1/2 Oficio', 'Oficio', 'A4', 'A3', 'Tarjeta', 'Personalizado'];
    const papeles = ['Bond 75g', 'Couché 150g', 'Couché 300g', 'Químico', 'Adhesivo', 'Lino', 'Cartulina'];

    const handleConfirm = () => {
        onComplete({
            ...product,
            cantidad,
            especificaciones: {
                tamano,
                tipoPapel,
                copias,
                hojasPorTalonario,
                numerado: numerado ? `Del ${desde} al ${hasta}` : 'No',
                perforado: perforado ? 'Sí' : 'No',
                acabado,
                tintas,
                orientacion,
                sri: product.esSRI ? { autorizacion: sriAutorizacion, vencimiento: sriVence } : null
            },
            precioFinal: total
        });
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050505] border border-liquid-gold/20 rounded-[3rem] p-10 relative overflow-hidden shadow-gold-glow-sm"
        >
            {/* Cinematic Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-liquid-gold/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-1 bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent" />
            
            {/* Elite Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="w-12 h-[1px] bg-liquid-gold/40"></span>
                        <p className="text-[9px] font-black text-liquid-gold uppercase tracking-[0.6em] italic">Industrial Manifest Protocol</p>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                        {product.nombre}
                        {product.esSRI && <ShieldCheckIcon className="w-6 h-6 text-brand-red animate-pulse" />}
                    </h3>
                </div>
                <button 
                    onClick={onCancel}
                    className="group flex items-center gap-3 px-6 py-3 rounded-xl border border-white/5 hover:border-white/20 transition-all"
                >
                    <span className="text-[9px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest transition-colors">Abortar & Volver</span>
                    <BoxIcon className="w-4 h-4 text-slate-600 group-hover:text-liquid-gold" />
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-10">
                {/* Specification Matrix */}
                <div className="xl:col-span-8 space-y-6 md:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Primary Quantity & Size */}
                        <div className="space-y-6 md:space-y-8 bg-white/[0.02] p-6 md:p-8 rounded-[2rem] border border-white/5 group/box hover:border-liquid-gold/20 transition-colors">
                            <h4 className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3 group-hover/box:text-liquid-gold transition-colors">
                                <LayersIcon className="w-4 h-4" /> Dimensiones & Volumen
                            </h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Unidades</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={cantidad}
                                            onChange={(e) => setCantidad(Number(e.target.value))}
                                            className={`w-full bg-black/60 border ${isContingencyLimit && cantidad >= 25 ? 'border-brand-red/50' : 'border-white/10'} rounded-2xl p-5 text-white font-black text-2xl outline-none focus:border-liquid-gold/50 transition-all shadow-inner`}
                                        />
                                        {isContingencyLimit && (
                                            <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-2">
                                                <div className="h-[1px] flex-1 bg-brand-red/20"></div>
                                                <span className="text-[7px] font-black text-brand-red uppercase tracking-widest whitespace-nowrap">Límite SRI Contingencia: 25 Hojas</span>
                                                <div className="h-[1px] flex-1 bg-brand-red/20"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Formato</label>
                                    <select 
                                        value={tamano}
                                        onChange={(e) => setTamano(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white font-bold text-xs outline-none focus:border-liquid-gold/50 transition-all appearance-none cursor-pointer"
                                    >
                                        {tamanos.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                {['Vertical', 'Horizontal'].map(o => (
                                    <button 
                                        key={o} onClick={() => setOrientacion(o)}
                                        className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${orientacion === o ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                    >
                                        {o}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Material & Duplication */}
                        <div className="space-y-6 md:space-y-8 bg-white/[0.02] p-6 md:p-8 rounded-[2rem] border border-white/5 group/box hover:border-liquid-gold/20 transition-colors">
                            <h4 className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3 group-hover/box:text-liquid-gold transition-colors">
                                <FileTextIcon className="w-4 h-4" /> Material & Copias
                            </h4>
                            <div className="space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    {papeles.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setTipoPapel(p)}
                                            className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase transition-all border ${
                                                tipoPapel === p 
                                                ? 'bg-liquid-gold text-black border-liquid-gold shadow-gold-glow-sm' 
                                                : 'bg-black/40 text-slate-500 border-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                                <select 
                                    value={copias}
                                    onChange={(e) => setCopias(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white font-bold text-xs outline-none focus:border-liquid-gold/50 transition-all cursor-pointer"
                                >
                                    <option value="Original Solo">Original Solo</option>
                                    <option value="Original y 1 Copia">Original + 1 Copia (Duplicado)</option>
                                    <option value="Original y 2 Copias">Original + 2 Copias (Triplicado)</option>
                                    <option value="Original y 3 Copias">Original + 3 Copias (Cuadriplicado)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Industrial Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div className="bg-white/[0.01] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 space-y-4 md:space-y-6">
                            <h4 className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                                <SparklesIcon className="w-4 h-4 text-liquid-gold" /> Acabado Elite
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {acabados.map(a => (
                                    <button 
                                        key={a} onClick={() => setAcabado(a)}
                                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${acabado === a ? 'bg-liquid-gold text-black border-liquid-gold shadow-gold-glow-sm' : 'bg-black/40 border-white/5 text-slate-600 hover:text-white'}`}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/[0.01] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 space-y-4 md:space-y-6">
                            <h4 className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                                <MonitorIcon className="w-4 h-4 text-liquid-gold" /> Cromatismo
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {tintasOpciones.map(t => (
                                    <button 
                                        key={t} onClick={() => setTintas(t)}
                                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${tintas === t ? 'bg-white text-black border-white shadow-luxury' : 'bg-black/40 border-white/5 text-slate-600 hover:text-white'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Mechanical Processes */}
                    <div className="bg-black/40 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/5 space-y-6 md:space-y-8">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h4 className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                                <CpuIcon className="w-4 h-4 text-liquid-gold" /> Procesos Mecánicos
                            </h4>
                            <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
                                <button 
                                    onClick={() => setNumerado(!numerado)}
                                    className={`flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 rounded-xl border text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${
                                        numerado ? 'bg-liquid-gold text-black border-liquid-gold shadow-gold-glow-sm' : 'bg-black/40 border-white/5 text-slate-500'
                                    }`}
                                >
                                    Numeración
                                </button>
                                <button 
                                    onClick={() => setPerforado(!perforado)}
                                    className={`flex-1 sm:flex-none px-4 py-2 md:px-6 md:py-3 rounded-xl border text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${
                                        perforado ? 'bg-liquid-gold text-black border-liquid-gold shadow-gold-glow-sm' : 'bg-black/40 border-white/5 text-slate-500'
                                    }`}
                                >
                                    Perforado
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {(numerado || product.esSRI) && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-black/60 rounded-[2rem] border border-white/5 shadow-inner"
                                >
                                    {numerado && (
                                        <>
                                            <div className="space-y-3">
                                                <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-4">Secuencia Inicio</label>
                                                <input type="text" value={desde} onChange={e => setDesde(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-black text-center text-sm outline-none focus:border-liquid-gold/40" placeholder="0001" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-4">Secuencia Fin</label>
                                                <input type="text" value={hasta} onChange={e => setHasta(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-black text-center text-sm outline-none focus:border-liquid-gold/40" placeholder="1000" />
                                            </div>
                                        </>
                                    )}
                                    {product.esSRI && (
                                        <div className="space-y-3 col-span-1">
                                            <label className="text-[8px] font-black text-brand-red uppercase tracking-widest ml-4">Aut. SRI (10 Dígitos)</label>
                                            <input type="text" value={sriAutorizacion} onChange={e => setSriAutorizacion(e.target.value)} className="w-full bg-brand-red/5 border border-brand-red/20 rounded-xl p-4 text-white font-black text-center text-sm outline-none focus:border-brand-red/50" placeholder="0000000000" />
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest ml-4">Hojas por Talonario</label>
                                        <div className="flex items-center gap-2">
                                            {[25, 50, 100].map(h => (
                                                <button key={h} onClick={() => setHojasPorTalonario(h)} className={`flex-1 py-4 rounded-xl text-[10px] font-black border transition-all ${hojasPorTalonario === h ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-slate-500'}`}>{h}</button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Concierge Summary & Action */}
                <div className="xl:col-span-4 flex flex-col h-full mt-4 xl:mt-0">
                    <div className="flex-grow p-6 md:p-10 bg-gradient-to-b from-liquid-gold/15 to-transparent rounded-[2.5rem] md:rounded-[4rem] border border-liquid-gold/30 flex flex-col relative group overflow-hidden shadow-gold-glow-strong">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-20 transition-all duration-1000 scale-150">
                            <MonitorIcon className="w-32 h-32 md:w-48 md:h-48 text-liquid-gold" />
                        </div>

                        <div className="relative z-10 space-y-8 md:space-y-12">
                            <div className="space-y-2">
                                <p className="text-[9px] md:text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] italic leading-none">Matriz de Ejecución</p>
                                <div className="h-[1px] w-12 md:w-16 bg-liquid-gold/40"></div>
                            </div>

                            <div className="space-y-6 md:space-y-8">
                                <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest italic">
                                    <span>Valor Base:</span>
                                    <span className="text-white">${(unitPrice * cantidad).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest italic">
                                    <span>Factor Industrial:</span>
                                    <span className="text-emerald-500">+${(total - (unitPrice * cantidad)).toFixed(2)}</span>
                                </div>
                                <div className="pt-6 md:pt-10 border-t border-white/10">
                                    <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4 md:mb-6 italic">Inversión Final Proyectada</p>
                                    <div className="flex flex-wrap items-baseline gap-2 md:gap-4">
                                        <span className="text-sm md:text-xl font-black text-liquid-gold italic">USD</span>
                                        <span className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-gold italic">
                                            ${total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 md:space-y-6 pt-6 md:pt-14">
                                <button
                                    onClick={handleConfirm}
                                    className="w-full py-6 md:py-8 bg-liquid-gold rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center gap-4 md:gap-6 text-black font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px] md:text-[12px] shadow-gold-glow hover:scale-[1.03] active:scale-95 transition-all duration-700"
                                >
                                    Fijar Especificación <ArrowRightIcon className="w-5 h-5 md:w-6 h-6" />
                                </button>
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] md:tracking-[0.4em] italic">Protocolo de seguridad activo</p>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 bg-liquid-gold rounded-full animate-pulse"></div>
                                        <div className="w-1 h-1 bg-liquid-gold rounded-full animate-pulse delay-75"></div>
                                        <div className="w-1 h-1 bg-liquid-gold rounded-full animate-pulse delay-150"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Intel Badge */}
                    <div className="mt-8 flex items-center gap-6 px-8 py-6 bg-white/[0.03] border border-white/10 rounded-[2rem] italic group/intel">
                        <InfoIcon className="w-6 h-6 text-liquid-gold/40 group-hover/intel:scale-110 transition-transform" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-relaxed">
                            Los parámetros de <span className="text-liquid-gold">Maquinaria</span>, <span className="text-liquid-gold">Sustrato</span> y <span className="text-liquid-gold">Tiempos</span> se ajustan dinámicamente según el volumen.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductConfigurator;
