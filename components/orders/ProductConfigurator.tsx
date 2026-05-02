
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowRightIcon, BoxIcon, 
    LayersIcon, FileTextIcon,
    SparklesIcon, MonitorIcon, CpuIcon,
    CloseIcon, ShieldCheckIcon, BoltIcon,
    ChevronRightIcon
} from '../Icons';

interface ProductConfiguratorProps {
    product: any;
    onComplete: (config: any) => void;
    onCancel: () => void;
    regimen?: string;
}

// --- SUB-COMPONENT: PRICE HUD ---
const PriceHUD: React.FC<{ label: string; value: number; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div className={`p-8 rounded-[2.5rem] border transition-all duration-700 ${highlight ? 'bg-brand-blue/5 border-brand-blue/40 shadow-blue-glow-soft' : 'bg-slate-50 border-slate-100'}`}>
        <p className={`text-[10px] font-black uppercase tracking-[0.5em] mb-3 ${highlight ? 'text-brand-blue' : 'text-slate-400'}`}>{label}</p>
        <div className="flex items-baseline gap-2">
            <span className={`text-sm font-black ${highlight ? 'text-brand-blue' : 'text-slate-300'}`}>$</span>
            <motion.span 
                key={value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-4xl font-black tracking-tighter ${highlight ? 'text-slate-900' : 'text-slate-400'}`}
            >
                {value.toFixed(2)}
            </motion.span>
        </div>
    </div>
);

// --- SUB-COMPONENT: TACTICAL SELECTOR ---
const TacticalSelector: React.FC<{ 
    options: string[]; 
    selected: string; 
    onChange: (val: string) => void; 
    label: string;
    icon: any;
}> = ({ options, selected, onChange, label, icon: Icon }) => (
    <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 px-2">
            <Icon className="w-4 h-4 text-brand-blue" />
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">{label}</label>
        </div>
        <div className="flex flex-wrap gap-3 px-2">
            {options.map(opt => (
                <motion.button
                    key={opt}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onChange(opt)}
                    className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                        selected === opt 
                        ? 'bg-brand-blue text-white border-brand-blue shadow-blue-glow' 
                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-brand-blue/20 hover:text-brand-blue'
                    }`}
                >
                    {opt}
                </motion.button>
            ))}
        </div>
    </div>
);

const ProductConfigurator: React.FC<ProductConfiguratorProps> = ({ product, onComplete, onCancel, regimen }) => {
    const [cantidad, setCantidad] = useState(1);
    const isContingencyLimit = (regimen?.toLowerCase().includes('general') || regimen?.toLowerCase().includes('emprendedor')) && product.esSRI;
    
    useEffect(() => {
        if (isContingencyLimit && cantidad > 25) setCantidad(25);
    }, [cantidad, isContingencyLimit]);

    const [tamano, setTamano] = useState('1/4 Oficio');
    const [tipoPapel, setTipoPapel] = useState('Bond 75g');
    const [copias, setCopias] = useState('Original Solo');
    const [hojasPorTalonario, setHojasPorTalonario] = useState(50);
    const [numerado, setNumerado] = useState(false);
    const [desde, setDesde] = useState('0001');
    const [hasta, setHasta] = useState('0050');
    const [perforado, setPerforado] = useState(false);
    const [sriAutorizacion, setSriAutorizacion] = useState('');
    const [sriVence, setSriVence] = useState(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString().split('T')[0];
    });
    const [acabado, setAcabado] = useState('Ninguno');
    const [tintas, setTintas] = useState('Full Color');
    const [orientacion, setOrientacion] = useState('Vertical');

    const tamanos = ['1/8 Oficio', '1/4 Oficio', '1/2 Oficio', 'Oficio', 'A4', 'A3', 'Tarjeta', 'Personalizado'];
    const papeles = ['Bond 75g', 'Couché 150g', 'Couché 300g', 'Químico', 'Adhesivo', 'Lino', 'Cartulina'];
    const copiasOpciones = ['Original Solo', 'Original y 1 Copia', 'Original y 2 Copias', 'Original y 3 Copias'];
    const acabados = ['Ninguno', 'Laminado Mate', 'Laminado Brillo', 'Barniz UV', 'Troquelado', 'Engomado'];
    const tintasOpciones = ['1 Color', '2 Colores', 'Full Color', 'Pantone / Especial'];

    useEffect(() => {
        if (numerado || product.esSRI) {
            const startNum = parseInt(desde) || 1;
            const totalSheets = cantidad * hojasPorTalonario;
            const endNum = startNum + totalSheets - 1;
            setHasta(endNum.toString().padStart(desde.length, '0'));
        }
    }, [desde, cantidad, hojasPorTalonario, numerado, product.esSRI]);

    const totalCalculated = useMemo(() => {
        const unitPrice = product.precio || 0;
        let base = unitPrice * cantidad;
        if (cantidad < 1) base = unitPrice;
        if (numerado) base += (2.50 * Math.ceil(cantidad / 5));
        if (perforado) base += (1.00 * Math.ceil(cantidad / 5));
        if (acabado !== 'Ninguno') base += (5.00 * Math.ceil(cantidad / 10));
        
        const tintaMult = tintas.includes('1 Color') ? 0.9 : tintas.includes('Full Color') ? 1.2 : 1.5;
        base *= tintaMult;
        const copyMultiplier = copias.includes('3 Copias') ? 1.5 : copias.includes('2 Copias') ? 1.3 : copias.includes('1 Copia') ? 1.15 : 1;
        base *= copyMultiplier;
        return base;
    }, [cantidad, product.precio, numerado, perforado, copias, acabado, tintas]);

    const handleConfirm = () => {
        onComplete({
            ...product,
            cantidad,
            especificaciones: {
                tamano, tipoPapel, copias, hojasPorTalonario,
                numerado: numerado ? `Del ${desde} al ${hasta}` : 'No',
                perforado: perforado ? 'Sí' : 'No',
                acabado, tintas, orientacion,
                sri: product.esSRI ? { autorizacion: sriAutorizacion, vencimiento: sriVence } : null
            },
            precioFinal: totalCalculated
        });
    };

    const modalContent = (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col md:flex-row overflow-hidden font-sans"
        >
            <div className="absolute inset-0 bg-slate-50/50 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-transparent to-transparent opacity-20 pointer-events-none" />
            
            {/* --- CONFIGURATION PANEL --- */}
            <div className="w-full md:w-[65%] h-full flex flex-col relative md:border-r border-slate-100 overflow-hidden z-10">
                <header className="p-10 md:p-16 flex justify-between items-start">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-brand-blue shadow-blue-glow animate-pulse" />
                                <div className="w-2 h-2 rounded-full bg-brand-blue/20" />
                                <div className="w-2 h-2 rounded-full bg-brand-blue/10" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">INDUSTRIAL_CONFIG_NODE_v4</span>
                        </div>
                        <h2 className="text-4xl md:text-7xl font-black text-slate-900 uppercase tracking-tighter leading-none">
                            CENTRO DE <span className="text-brand-blue">MANDO</span>
                        </h2>
                        <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 border border-brand-blue/20 rounded-2xl w-fit shadow-blue-glow-soft">
                            <BoxIcon className="w-5 h-5 text-brand-blue" />
                            <span className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{product?.nombre}</span>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-5 bg-slate-50 hover:bg-rose-50 rounded-[2rem] transition-all group/close border border-slate-100 hover:border-rose-200">
                        <CloseIcon className="w-8 h-8 text-slate-300 group-hover/close:text-rose-500" />
                    </button>
                </header>

                <main className="flex-grow overflow-y-auto px-10 md:px-16 pb-40 no-scrollbar space-y-20">
                    {/* VOLUMEN & FORMATO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div className="space-y-8 p-10 bg-slate-50 border border-slate-100 rounded-[3.5rem] relative overflow-hidden group shadow-luxury">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <BoltIcon className="w-16 h-16 text-brand-blue" />
                            </div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-6 block">Cuantificación_Carga</label>
                            <div className="flex items-center gap-10">
                                <div className="flex items-center bg-white rounded-[2.5rem] p-3 border border-slate-200 shadow-luxury group-focus-within:border-brand-blue/40 transition-all">
                                    <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-16 h-16 flex items-center justify-center text-4xl font-light text-slate-300 hover:text-brand-blue transition-all">−</button>
                                    <input type="number" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} className="w-24 bg-transparent text-center text-5xl font-black text-slate-900 outline-none [appearance:textfield] tracking-tighter" />
                                    <button onClick={() => setCantidad(cantidad + 1)} className="w-16 h-16 flex items-center justify-center text-4xl font-light text-slate-300 hover:text-brand-blue transition-all">+</button>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-brand-blue uppercase tracking-widest">UNIDADES</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Protocolo de Volumen</p>
                                </div>
                            </div>
                        </div>

                        <TacticalSelector label="Arquitectura_Formato" options={tamanos} selected={tamano} onChange={setTamano} icon={LayersIcon} />
                    </div>

                    {/* MATERIAL & CROMATISMO */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <TacticalSelector label="Sustrato_Industrial" options={papeles} selected={tipoPapel} onChange={setTipoPapel} icon={FileTextIcon} />
                        <TacticalSelector label="Capas_de_Réplica" options={copiasOpciones} selected={copias} onChange={setCopias} icon={LayersIcon} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <TacticalSelector label="Espectro_Cromático" options={tintasOpciones} selected={tintas} onChange={setTintas} icon={MonitorIcon} />
                        <TacticalSelector label="Tratamiento_Final" options={acabados} selected={acabado} onChange={setAcabado} icon={SparklesIcon} />
                    </div>

                    {/* PROCESOS MECÁNICOS */}
                    <section className="space-y-12">
                        <div className="flex items-center gap-4 border-b border-slate-100 pb-6 px-2">
                            <CpuIcon className="w-5 h-5 text-brand-blue" />
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Sistemas_Mecánicos_de_Precisión</label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { id: 'num', label: 'Secuenciación_Numérica', active: numerado, toggle: () => setNumerado(!numerado) },
                                { id: 'perf', label: 'Perforación_Tactical', active: perforado, toggle: () => setPerforado(!perforado) }
                            ].map(proc => (
                                <motion.button 
                                    key={proc.id}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                    onClick={proc.toggle}
                                    className={`p-10 rounded-[3rem] border-2 transition-all duration-700 text-left relative overflow-hidden group ${proc.active ? 'bg-brand-blue/5 border-brand-blue/40 shadow-blue-glow' : 'bg-slate-50 border-slate-100 hover:border-brand-blue/20'}`}
                                >
                                    <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity ${proc.active ? 'text-brand-blue opacity-20' : ''}`}>
                                        <CpuIcon className="w-16 h-16" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 block ${proc.active ? 'text-brand-blue' : 'text-slate-300'}`}>{proc.label}</span>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${proc.active ? 'bg-brand-blue animate-pulse shadow-blue-glow' : 'bg-slate-200'}`} />
                                        <span className={`text-2xl font-black tracking-tighter ${proc.active ? 'text-slate-900' : 'text-slate-300'}`}>{proc.active ? 'MÓDULO_OPERATIVO' : 'STANDBY'}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>

                        <AnimatePresence>
                            {(numerado || product.esSRI) && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                                    className="p-12 rounded-[4rem] bg-slate-50 border border-brand-blue/20 space-y-10 relative overflow-hidden shadow-luxury"
                                >
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-blue/40 to-transparent animate-shimmer" />
                                    
                                    <div className="flex items-center gap-4 mb-4">
                                        <ShieldCheckIcon className="w-6 h-6 text-brand-blue" />
                                        <span className="text-[11px] font-black text-brand-blue uppercase tracking-[0.4em]">Protocolos_SRI_y_Control</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        {numerado && (
                                            <>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vector_Inicial</label>
                                                    <input value={desde} onChange={e => setDesde(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-black text-3xl outline-none focus:border-brand-blue/40 transition-all font-mono tracking-tighter" placeholder="0001" />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Vector_Final (Calculado)</label>
                                                    <input value={hasta} readOnly className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-slate-400 font-black text-3xl outline-none font-mono tracking-tighter" />
                                                </div>
                                            </>
                                        )}
                                        {product.esSRI && (
                                            <>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-brand-blue/60 uppercase tracking-widest ml-2">Token_Autorización</label>
                                                    <input value={sriAutorizacion} onChange={e => setSriAutorizacion(e.target.value)} className="w-full bg-white border border-brand-blue/10 rounded-2xl px-6 py-4 text-slate-900 font-black text-xl outline-none focus:border-brand-blue transition-all font-mono" placeholder="NÚCLEO_AUTORIZA" />
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-brand-blue/60 uppercase tracking-widest ml-2">Expiración_Ciclo</label>
                                                    <input type="date" value={sriVence} onChange={e => setSriVence(e.target.value)} className="w-full bg-white border border-brand-blue/10 rounded-2xl px-6 py-4 text-slate-900 font-black text-xl outline-none focus:border-brand-blue transition-all [color-scheme:light]" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                </main>
            </div>

            {/* --- FINANCIAL HUD (SIDEBAR) --- */}
            <div className="w-full md:w-[35%] h-full bg-slate-50 border-l border-slate-100 p-12 md:p-20 flex flex-col justify-between relative overflow-hidden z-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.08),transparent_70%)]" />
                
                <div className="space-y-20 relative z-10">
                    <div className="space-y-4">
                        <p className="text-[11px] font-black text-brand-blue uppercase tracking-[0.6em]">TELEMETRÍA_VALUACIÓN_ALFA</p>
                        <h3 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">ESTADO <br/><span className="text-slate-300">FINANCIERO</span></h3>
                    </div>

                    <div className="space-y-8">
                        <PriceHUD label="Inversión_Base_Bruta" value={product.precio * cantidad} />
                        <PriceHUD label="Incrementos_Operativos" value={totalCalculated - (product.precio * cantidad)} />
                    </div>
                </div>

                <div className="space-y-16 relative z-10">
                    <div className="p-12 rounded-[4rem] bg-white border-2 border-brand-blue/20 shadow-blue-glow relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 via-transparent to-transparent opacity-50" />
                        <div className="absolute -top-full -left-full w-[300%] h-[300%] bg-brand-blue/[0.03] rotate-45 group-hover:translate-y-1/2 transition-transform duration-[2.5s] pointer-events-none" />
                        
                        <p className="text-[12px] font-black text-brand-blue uppercase tracking-[0.8em] mb-8 text-center">TOTAL_CONSOLIDADO</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-5xl font-black text-brand-blue/40">$</span>
                            <motion.span 
                                key={totalCalculated}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-9xl font-black text-slate-900 tracking-tighter tabular-nums leading-none"
                            >
                                {totalCalculated.toFixed(2)}
                            </motion.span>
                        </div>
                        
                        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center px-4">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">VALOR_IVA_INCLUIDO_15%</span>
                            <div className="flex gap-1">
                                {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-1 bg-brand-blue/30 rounded-full" />)}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -8 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConfirm}
                            className="w-full py-10 bg-brand-blue text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm shadow-blue-glow-strong flex items-center justify-center gap-8 group"
                        >
                            ENVIAR_AL_DESPLIEGUE 
                            <ArrowRightIcon className="w-8 h-8 group-hover:translate-x-4 transition-transform duration-500" />
                        </motion.button>
                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] text-center leading-relaxed">
                            ESTA ACCIÓN BLOQUEARÁ LOS VECTORES DE DISEÑO <br/>Y RESERVARÁ CAPACIDAD DE PRENSA.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    if (typeof document === 'undefined') return null;
    return ReactDOM.createPortal(modalContent, document.body);
};

export default ProductConfigurator;
