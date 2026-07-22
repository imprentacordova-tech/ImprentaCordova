import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowRightIcon, BoxIcon, 
    LayersIcon, FileTextIcon,
    SparklesIcon, MonitorIcon, CpuIcon,
    CloseIcon, ShieldCheckIcon, BoltIcon,
    ChevronRightIcon, CheckCircleIcon
} from '../Icons';
import { formatCurrency } from '../../utils';

interface ProductConfiguratorProps {
    product: any;
    onComplete: (config: any) => void;
    onCancel: () => void;
    regimen?: string;
}

const SelectorGrupo: React.FC<{ 
    options: string[]; 
    selected: string; 
    onChange: (val: string) => void; 
    label: string;
}> = ({ options, selected, onChange, label }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">{label}</label>
        <div className="flex flex-wrap gap-2">
            {options.map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase transition-all border ${
                        selected === opt 
                            ? 'bg-brand-blue text-white border-brand-blue shadow-sm' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                    {opt}
                </button>
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

    const tamanos = ['1/8 Oficio', '1/4 Oficio', '1/2 Oficio', 'Oficio', 'A4', 'A3', 'Tarjeta'];
    const papeles = ['Bond 75g', 'Couché 150g', 'Couché 300g', 'Químico', 'Adhesivo', 'Lino'];
    const copiasOpciones = ['Original Solo', 'Original + 1 Copia', 'Original + 2 Copias'];
    const acabados = ['Ninguno', 'Laminado Mate', 'Laminado Brillo', 'Barniz UV', 'Engomado'];
    const tintasOpciones = ['1 Color', '2 Colores', 'Full Color'];

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
        const copyMultiplier = copias.includes('2 Copias') ? 1.3 : copias.includes('1 Copia') ? 1.15 : 1;
        base *= copyMultiplier;
        return Number(base.toFixed(2));
    }, [cantidad, product.precio, numerado, perforado, copias, acabado, tintas]);

    const handleConfirm = () => {
        onComplete({
            ...product,
            cantidad,
            especificaciones: {
                tamano, tipoPapel, copias, hojasPorTalonario,
                numerado: numerado ? `Del ${desde} al ${hasta}` : 'No',
                perforado: perforado ? 'Sí' : 'No',
                acabado, tintas,
                sri: product.esSRI ? { autorizacion: sriAutorizacion, vencimiento: sriVence } : null
            },
            precioFinal: totalCalculated
        });
    };

    return (
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-black">
                        <BoxIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-brand-blue uppercase tracking-wider">Configurar Producto</span>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{product.nombre}</h2>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
                >
                    ✕
                </button>
            </div>

            {/* Formulario Configuración */}
            <div className="space-y-6">
                {/* Cantidad & Formato */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                            Cantidad / Volumen ({product.esSRI ? 'Talonarios' : 'Unidades'})
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                                <button 
                                    type="button" 
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    className="w-10 h-10 flex items-center justify-center text-lg font-bold text-slate-500 hover:bg-white rounded-lg transition-colors"
                                >
                                    −
                                </button>
                                <input 
                                    type="number" 
                                    value={cantidad} 
                                    onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                                    className="w-16 bg-transparent text-center text-lg font-black text-slate-900 outline-none font-mono"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setCantidad(cantidad + 1)}
                                    className="w-10 h-10 flex items-center justify-center text-lg font-bold text-slate-500 hover:bg-white rounded-lg transition-colors"
                                >
                                    +
                                </button>
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 uppercase">
                                {product.esSRI ? `${cantidad * 50} Hojas totales` : 'Unidades'}
                            </span>
                        </div>
                    </div>

                    <SelectorGrupo label="Tamaño / Formato" options={tamanos} selected={tamano} onChange={setTamano} />
                </div>

                {/* Papel & Copias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectorGrupo label="Tipo de Papel / Sustrato" options={papeles} selected={tipoPapel} onChange={setTipoPapel} />
                    <SelectorGrupo label="Réplicas / Copias" options={copiasOpciones} selected={copias} onChange={setCopias} />
                </div>

                {/* Tintas & Acabado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectorGrupo label="Impresión de Tintas" options={tintasOpciones} selected={tintas} onChange={setTintas} />
                    <SelectorGrupo label="Acabados Especiales" options={acabados} selected={acabado} onChange={setAcabado} />
                </div>

                {/* Opciones Adicionales (Numerado & Perforado) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Procesos de Imprenta</label>
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer text-[12px] font-bold text-slate-800">
                            <input 
                                type="checkbox" 
                                checked={numerado} 
                                onChange={e => setNumerado(e.target.checked)} 
                                className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue"
                            />
                            <span>Numerado Secuencial (+ $2.50)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-[12px] font-bold text-slate-800">
                            <input 
                                type="checkbox" 
                                checked={perforado} 
                                onChange={e => setPerforado(e.target.checked)} 
                                className="w-4 h-4 text-brand-blue rounded border-slate-300 focus:ring-brand-blue"
                            />
                            <span>Troquel / Perforado Sencillo (+ $1.00)</span>
                        </label>
                    </div>

                    {numerado && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Numerado Desde</label>
                                <input 
                                    type="text" 
                                    value={desde} 
                                    onChange={e => setDesde(e.target.value)} 
                                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-mono font-bold outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hasta (Calculado)</label>
                                <input 
                                    type="text" 
                                    value={hasta} 
                                    readOnly 
                                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-mono font-bold text-slate-600 outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer de Confirmación */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Precio Total Configurado</span>
                    <span className="text-2xl font-black text-slate-900">{formatCurrency(totalCalculated)}</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-black uppercase transition-all"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-brand-blue/90 shadow-blue-glow-sm transition-all"
                    >
                        <CheckCircleIcon className="w-4 h-4" /> Agregar a la Orden
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductConfigurator;
