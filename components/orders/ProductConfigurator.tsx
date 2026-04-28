
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowRightIcon, BoxIcon, 
    LayersIcon, FileTextIcon,
    SparklesIcon, MonitorIcon, CpuIcon
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
        let base = unitPrice * cantidad;
        if (cantidad < 1) base = unitPrice;

        if (numerado) base += (2.50 * Math.ceil(cantidad / 5));
        if (perforado) base += (1.00 * Math.ceil(cantidad / 5));
        if (acabado !== 'Ninguno') base += (5.00 * Math.ceil(cantidad / 10));
        
        const tintaMult = tintas.includes('1 Color') ? 0.9 : tintas.includes('Full Color') ? 1.2 : 1.5;
        base *= tintaMult;

        const copyMultiplier = copias.includes('3 Copias') ? 1.5 : copias.includes('2 Copias') ? 1.3 : copias.includes('1 Copia') ? 1.15 : 1;
        base *= copyMultiplier;

        setTotal(base);
    }, [cantidad, unitPrice, numerado, perforado, copias, acabado, tintas]);

    const tamanos = ['1/8 Oficio', '1/4 Oficio', '1/2 Oficio', 'Oficio', 'A4', 'A3', 'Tarjeta', 'Personalizado'];
    const papeles = ['Bond 75g', 'Couché 150g', 'Couché 300g', 'Químico', 'Adhesivo', 'Lino', 'Cartulina'];
    const copiasOpciones = ['Original Solo', 'Original y 1 Copia', 'Original y 2 Copias', 'Original y 3 Copias'];

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black flex overflow-hidden font-sans"
        >
            {/* Split Screen Minimalist Layout */}
            
            {/* LEFT: Configuration Hub (70% width) */}
            <div className="w-[70%] h-full flex flex-col relative">
                {/* Header inside left side */}
                <header className="px-16 py-12 flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Paso 02</p>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic">
                            Especificación del <span className="text-liquid-gold">Producto</span>
                        </h2>
                        <h3 className="text-xl font-bold text-slate-400 mt-2 uppercase tracking-tight">
                            {product.nombre}
                        </h3>
                    </div>
                    
                    <button 
                        onClick={onCancel}
                        className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-white/5 transition-all text-slate-500 hover:text-white group"
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Abortar</span>
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto px-16 pb-24 custom-scrollbar">
                    <div className="space-y-24 max-w-4xl">
                        
                        {/* DIMENSIONES */}
                        {(!product.configuracionHabilitada || product.configuracionHabilitada.dimensiones !== false) && (
                            <section className="space-y-10">
                                <div className="border-b border-white/10 pb-4">
                                    <h4 className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] flex items-center gap-3"><LayersIcon className="w-4 h-4" /> Dimensiones & Volumen</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Unidades</label>
                                        <input 
                                            type="number" 
                                            value={cantidad}
                                            onChange={(e) => setCantidad(Number(e.target.value))}
                                            className="w-full bg-transparent border-b-2 border-white/20 pb-4 text-white font-black text-6xl outline-none focus:border-liquid-gold transition-all"
                                        />
                                    </div>
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Orientación</label>
                                        <div className="flex gap-4">
                                            {['Vertical', 'Horizontal'].map(o => (
                                                <button 
                                                    key={o} onClick={() => setOrientacion(o)}
                                                    className={`py-4 px-8 rounded-full text-xs font-black uppercase tracking-widest transition-all ${orientacion === o ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
                                                >
                                                    {o}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Formato</label>
                                    <div className="flex flex-wrap gap-3">
                                        {tamanos.map(t => (
                                            <button 
                                                key={t} onClick={() => setTamano(t)}
                                                className={`py-3 px-6 rounded-full text-xs font-bold transition-all ${tamano === t ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'border border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* MATERIAL */}
                        {(!product.configuracionHabilitada || product.configuracionHabilitada.material !== false) && (
                            <section className="space-y-10">
                                <div className="border-b border-white/10 pb-4">
                                    <h4 className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] flex items-center gap-3"><FileTextIcon className="w-4 h-4" /> Material & Copias</h4>
                                </div>
                                <div className="space-y-6">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Sustrato Principal</label>
                                    <div className="flex flex-wrap gap-3">
                                        {papeles.map(p => (
                                            <button
                                                key={p} onClick={() => setTipoPapel(p)}
                                                className={`py-3 px-6 rounded-full text-xs font-bold transition-all ${tipoPapel === p ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'border border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Multiplicador de Capas (Talonarios)</label>
                                    <div className="flex flex-wrap gap-3">
                                        {copiasOpciones.map(c => (
                                            <button
                                                key={c} onClick={() => setCopias(c)}
                                                className={`py-3 px-6 rounded-full text-xs font-bold transition-all ${copias === c ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'border border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* ACABADO */}
                        {(!product.configuracionHabilitada || product.configuracionHabilitada.acabados !== false) && (
                            <section className="space-y-10">
                                <div className="border-b border-white/10 pb-4">
                                    <h4 className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] flex items-center gap-3"><SparklesIcon className="w-4 h-4" /> Acabado Elite</h4>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {acabados.map(a => (
                                        <button 
                                            key={a} onClick={() => setAcabado(a)}
                                            className={`py-3 px-6 rounded-full text-xs font-bold transition-all ${acabado === a ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'border border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* CROMATISMO */}
                        {(!product.configuracionHabilitada || product.configuracionHabilitada.cromatismo !== false) && (
                            <section className="space-y-10">
                                <div className="border-b border-white/10 pb-4">
                                    <h4 className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] flex items-center gap-3"><MonitorIcon className="w-4 h-4" /> Cromatismo</h4>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {tintasOpciones.map(t => (
                                        <button 
                                            key={t} onClick={() => setTintas(t)}
                                            className={`py-3 px-6 rounded-full text-xs font-bold transition-all ${tintas === t ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'border border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* PROCESOS MECANICOS */}
                        {(!product.configuracionHabilitada || product.configuracionHabilitada.procesosMecanicos !== false) && (
                            <section className="space-y-10">
                                <div className="border-b border-white/10 pb-4">
                                    <h4 className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] flex items-center gap-3"><CpuIcon className="w-4 h-4" /> Procesos Mecánicos</h4>
                                </div>
                                <div className="flex gap-6">
                                    <button 
                                        onClick={() => setNumerado(!numerado)}
                                        className={`flex-1 py-6 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all ${numerado ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        Numeración {numerado && '• Activo'}
                                    </button>
                                    <button 
                                        onClick={() => setPerforado(!perforado)}
                                        className={`flex-1 py-6 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all ${perforado ? 'bg-liquid-gold text-black shadow-gold-glow-sm' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        Perforado {perforado && '• Activo'}
                                    </button>
                                </div>
                                <AnimatePresence>
                                    {(numerado || product.esSRI) && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="grid grid-cols-2 gap-8 pt-4">
                                                {numerado && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Inicio</label>
                                                            <input type="text" value={desde} onChange={e => setDesde(e.target.value)} className="w-full bg-transparent border-b border-white/20 pb-2 text-white font-black text-xl outline-none focus:border-liquid-gold transition-all" placeholder="0001" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Fin</label>
                                                            <input type="text" value={hasta} onChange={e => setHasta(e.target.value)} className="w-full bg-transparent border-b border-white/20 pb-2 text-white font-black text-xl outline-none focus:border-liquid-gold transition-all" placeholder="1000" />
                                                        </div>
                                                    </>
                                                )}
                                                {product.esSRI && (
                                                    <div className="space-y-2 col-span-2">
                                                        <label className="text-[10px] font-bold text-liquid-gold uppercase tracking-[0.2em]">Autorización SRI</label>
                                                        <input type="text" value={sriAutorizacion} onChange={e => setSriAutorizacion(e.target.value)} className="w-full bg-transparent border-b border-liquid-gold/50 pb-2 text-white font-black text-xl outline-none focus:border-liquid-gold transition-all placeholder:text-slate-700" placeholder="Autorización de 10 o 37 dígitos" />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </section>
                        )}
                    </div>
                </main>
            </div>

            {/* RIGHT: Financial Summary (30% width) */}
            <div className="w-[30%] bg-brand-dark flex flex-col border-l border-white/5 relative">
                <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] right-[-20%] w-[150%] h-[50%] bg-liquid-gold/5 rounded-full blur-[150px]" />
                </div>
                
                <div className="flex-grow p-16 flex flex-col justify-center space-y-12 relative z-10">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Resumen Financiero</p>
                        <h3 className="text-3xl font-black text-white italic uppercase">Proyección</h3>
                    </div>

                    <div className="space-y-8">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Valor Base</span>
                            <span className="text-xl font-medium text-white">${(unitPrice * cantidad).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Factor Industrial</span>
                            <span className="text-xl font-medium text-liquid-gold">+${(total - (unitPrice * cantidad)).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="pt-8">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Inversión Final</p>
                        <div className="flex items-start gap-2">
                            <span className="text-2xl font-black text-liquid-gold pt-2">$</span>
                            <span className="text-8xl font-black text-white tracking-tighter leading-none">{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-10 relative z-10">
                    <button
                        onClick={handleConfirm}
                        className="w-full py-8 bg-liquid-gold text-black rounded-full font-black uppercase tracking-[0.3em] text-sm hover:scale-[1.02] shadow-gold-glow active:scale-95 transition-all duration-300 flex items-center justify-center gap-4 group"
                    >
                        Fijar Especificación <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductConfigurator;

