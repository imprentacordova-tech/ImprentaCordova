import { Producto, User } from '../types';
import { 
    BoxIcon, CloseIcon, PencilIcon, TrashIcon, PhotoIcon, 
    SparklesIcon, TableIcon, CheckCircleIcon, ArrowRightIcon, 
    AddIcon, SearchIcon, Loader2Icon, DocumentTextIcon, 
    LayersIcon, FileStackIcon, ShieldCheckIcon, RulerIcon 
} from '../components/Icons';
import { formatCurrency } from '../utils';
import { useOutletContext } from 'react-router-dom';
import { logActivity } from '../services/activityLogService';
import { useData } from '../contexts/DataContext';

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

const ProductManagementModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Producto | Producto[]) => void;
    productToEdit: Producto | null;
}> = ({ isOpen, onClose, onSave, productToEdit }) => {
    const [mode, setMode] = useState<'SINGLE' | 'MATRIX'>('SINGLE');
    const [baseProduct, setBaseProduct] = useState<Partial<Producto>>({ nombre: '', categoria: 'SRI', esSRI: true, precio: 0 });
    
    // Matrix States
    const [selectedSizes, setSelectedSizes] = useState<string[]>(["1/4 Oficio"]);
    const [selectedPresentations, setSelectedPresentations] = useState<string[]>(["BLOCK"]);
    const [selectedCopies, setSelectedCopies] = useState<number[]>([2]);
    const [selectedQtys, setSelectedQtys] = useState<string[]>(["50 h"]);
    const [extraCopyPrice, setExtraCopyPrice] = useState(2.50); // Lo que sube por cada copia extra
    
    const [generatedPreview, setGeneratedPreview] = useState<Producto[]>([]);

    useEffect(() => {
        if (productToEdit) {
            setBaseProduct(productToEdit);
            setMode('SINGLE');
        } else {
            setBaseProduct({ nombre: '', descripcion: '', precio: 15, categoria: 'SRI', esSRI: true });
            setMode('SINGLE');
        }
    }, [productToEdit, isOpen]);

    // Generador Pro de Variaciones
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
                            
                            // Lógica de precio: Base * cantidad + (precio de copias extras si copyCount > 2)
                            let calculatedPrice = (baseProduct.precio || 0) * multiplier;
                            if (copyCount > 2) {
                                calculatedPrice += (extraCopyPrice * (copyCount - 2));
                            }

                            const fullName = `${baseProduct.nombre} (${size} - ${presInfo?.label} x ${qtyLabel} - ${copyInfo?.suffix})`;

                            matrix.push({
                                id: `preview-${size}-${pres}-${copyCount}-${qtyLabel}`,
                                nombre: fullName.toUpperCase(),
                                descripcion: baseProduct.descripcion || `${baseProduct.nombre} en tamaño ${size}, ${presInfo?.label} con ${copyInfo?.label}.`,
                                precio: calculatedPrice,
                                categoria: baseProduct.categoria || 'SRI',
                                esSRI: baseProduct.esSRI,
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-900/40 backdrop-blur-xl rounded-[3rem] shadow-3xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
                
                <div className="flex justify-between items-center p-10 border-b border-white/5 bg-white/5">
                    <div className="flex items-center gap-6">
                        <div className="bg-gradient-to-br from-brand-blue to-indigo-900 p-4 rounded-2xl text-white shadow-2xl">
                            <TableIcon className="w-8 h-8"/>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
                                {mode === 'SINGLE' ? 'Configuración Elite' : 'Generador Matrix Pro'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ingeniería Documental Automática</p>
                        </div>
                    </div>
                    
                    {!productToEdit && (
                        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                            <button onClick={() => setMode('SINGLE')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'SINGLE' ? 'bg-white text-black shadow-2xl scale-105' : 'text-slate-500 hover:text-white'}`}>Unitario</button>
                            <button onClick={() => setMode('MATRIX')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mode === 'MATRIX' ? 'bg-liquid-gold text-black shadow-2xl scale-105' : 'text-slate-500 hover:text-white'}`}>Matrix</button>
                        </div>
                    )}
                </div>

                <div className="flex-grow overflow-hidden flex flex-col lg:flex-row">
                    {/* Panel de Configuración (Izquierda) */}
                    <div className="w-full lg:w-2/5 p-10 overflow-y-auto border-r border-white/5 space-y-10 custom-scrollbar">
                        <div className="space-y-8">
                            <h3 className="text-xs font-black text-brand-blue uppercase tracking-[0.4em] flex items-center gap-3">
                                <SparklesIcon className="w-5 h-5 text-liquid-gold"/> Arquitectura Base
                            </h3>
                            <input 
                                type="text" 
                                placeholder="NOMBRE DEL CONCEPTO (EJ. RECIBOS)" 
                                value={baseProduct.nombre} 
                                onChange={e => setBaseProduct({...baseProduct, nombre: e.target.value.toUpperCase()})}
                                className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] font-black text-2xl outline-none focus:ring-4 focus:ring-brand-blue/30 uppercase text-white placeholder-slate-600 transition-all"
                            />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-2">Inversión Base (100h)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-blue font-black">$</span>
                                        <input type="number" value={baseProduct.precio} onChange={e => setBaseProduct({...baseProduct, precio: parseFloat(e.target.value)})} className="w-full p-4 pl-8 bg-white/5 border border-white/10 rounded-2xl font-black text-white text-lg focus:border-brand-blue/50 outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block pl-2">Incremento x Copia</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-liquid-gold font-black">$</span>
                                        <input type="number" value={extraCopyPrice} onChange={e => setExtraCopyPrice(parseFloat(e.target.value))} className="w-full p-4 pl-8 bg-white/5 border border-white/10 rounded-2xl font-black text-white text-lg focus:border-liquid-gold/50 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {mode === 'MATRIX' && (
                            <div className="space-y-10 animate-fade-in">
                                {/* Tamaños */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><RulerIcon className="w-4 h-4 text-brand-blue"/> Dimensiones</h4>
                                    <div className="flex flex-wrap gap-3">
                                        {SIZES.map(s => (
                                            <button key={s} onClick={() => toggleItem(selectedSizes, setSelectedSizes, s)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${selectedSizes.includes(s) ? 'bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105' : 'bg-white/5 border-transparent text-slate-500 hover:text-white hover:bg-white/10'}`}>{s}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Presentación */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><LayersIcon className="w-4 h-4 text-brand-blue"/> Formato Visual</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {PRESENTATIONS.map(p => (
                                            <button key={p.id} onClick={() => toggleItem(selectedPresentations, setSelectedPresentations, p.id)} className={`flex items-center justify-center gap-3 p-4 rounded-2xl text-[10px] font-black uppercase transition-all border-2 ${selectedPresentations.includes(p.id) ? 'bg-brand-blue border-brand-blue text-white shadow-2xl scale-105' : 'bg-white/5 border-transparent text-slate-500 hover:text-white'}`}>
                                                <p.icon className="w-5 h-5" /> {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Copias */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3"><FileStackIcon className="w-4 h-4 text-brand-blue"/> Configuración de Juegos</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {COPIES.map(c => (
                                            <button key={c.id} onClick={() => toggleItem(selectedCopies, setSelectedCopies, c.id)} className={`flex items-center justify-between p-5 rounded-2xl text-[11px] font-black uppercase transition-all border-2 ${selectedCopies.includes(c.id) ? 'bg-liquid-gold border-liquid-gold text-black shadow-2xl scale-[1.02]' : 'bg-white/5 border-transparent text-slate-500 hover:text-white'}`}>
                                                <span>{c.label}</span>
                                                <span className={`text-[10px] tracking-widest ${selectedCopies.includes(c.id) ? 'text-black/60' : 'text-slate-600'}`}>{c.suffix}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Cantidades */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escalas de Tiraje</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {QUANTITIES.map(q => (
                                            <button key={q.label} onClick={() => toggleItem(selectedQtys, setSelectedQtys, q.label)} className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase transition-all border ${selectedQtys.includes(q.label) ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/20'}`}>{q.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Panel de Vista Previa (Derecha) */}
                    <div className="flex-1 bg-black/40 p-10 flex flex-col overflow-hidden relative">
                        <div className="absolute inset-0 bg-brand-blue/5 pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Preview de <span className="text-liquid-gold text-3xl">Colección</span> <span className="text-slate-500">[{generatedPreview.length}]</span></h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Generación sintética por matriz</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-2xl"><SparklesIcon className="w-8 h-8 text-liquid-gold animate-pulse" /></div>
                        </div>

                        <div className="flex-grow overflow-y-auto space-y-4 pr-4 custom-scrollbar relative z-10">
                            {generatedPreview.map(p => {
                                const isBlock = p.nombre.includes('BLOCK');
                                const isDuplicado = p.nombre.includes('DUPLICADO');
                                const isTriplicado = p.nombre.includes('TRIPLICADO');

                                return (
                                    <div key={p.id} className="bg-white/5 backdrop-blur-sm p-6 rounded-[2rem] border border-white/5 flex justify-between items-center group transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] hover:shadow-2xl">
                                        <div className="flex items-center gap-6 flex-grow min-w-0">
                                            <div className={`p-4 rounded-2xl transition-all duration-500 ${isBlock ? 'bg-brand-blue/20 text-brand-blue shadow-inner' : 'bg-liquid-gold/20 text-liquid-gold shadow-inner'}`}>
                                                {isBlock ? <LayersIcon className="w-6 h-6"/> : <DocumentTextIcon className="w-6 h-6"/>}
                                            </div>
                                            <div className="min-w-0 flex-grow">
                                                <p className="text-[11px] font-black text-white uppercase tracking-tight truncate pr-6 leading-tight">{p.nombre}</p>
                                                <div className="flex gap-3 mt-2">
                                                    {isDuplicado && <span className="text-[8px] font-black bg-brand-blue/30 text-brand-blue px-2 py-0.5 rounded uppercase tracking-widest">DUPLICADO</span>}
                                                    {isTriplicado && <span className="text-[8px] font-black bg-liquid-gold/30 text-yellow-500 px-2 py-0.5 rounded uppercase tracking-widest">TRIPLICADO</span>}
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">{p.categoria}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 pl-8 border-l border-white/10">
                                            <span className="text-xs font-black text-slate-600">$</span>
                                            <input 
                                                type="number" 
                                                value={p.precio} 
                                                onChange={e => setGeneratedPreview(prev => prev.map(prevP => prevP.id === p.id ? { ...prevP, precio: parseFloat(e.target.value) } : prevP))}
                                                className="w-24 p-3 bg-black/40 border border-white/5 rounded-xl text-md font-black text-brand-blue text-right focus:border-brand-blue/50 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            {generatedPreview.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-6">
                                    <BoxIcon className="w-32 h-32 mb-4 text-slate-500" />
                                    <p className="font-black uppercase tracking-[0.3em] text-[10px] max-w-xs leading-loose">Define los parámetros arquitectónicos para instanciar la matriz de productos</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-10 border-t border-white/5 flex justify-between items-center bg-white/5">
                    <button onClick={onClose} className="px-10 py-5 text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] hover:text-white transition-colors">Abortar</button>
                    <button 
                        onClick={() => onSave(mode === 'SINGLE' ? (baseProduct as Producto) : generatedPreview)}
                        disabled={!baseProduct.nombre || (mode === 'MATRIX' && generatedPreview.length === 0)}
                        className="min-w-[400px] px-12 py-6 bg-white text-black font-black rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:bg-liquid-gold hover:scale-105 transition-all transform active:scale-95 flex items-center justify-center gap-6 uppercase tracking-[0.3em] text-[10px] disabled:opacity-20"
                    >
                        {mode === 'SINGLE' ? 'Materializar Producto' : `Confirmar ${generatedPreview.length} Instancias`} <CheckCircleIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProductDetailModal: React.FC<{
    producto: Producto;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ producto, onClose, onEdit, onDelete }) => {
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[4rem] shadow-3xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row border border-white/10" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-1/2 relative">
                    {producto.imagenUrl ? (
                        <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-80 md:h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
                    ) : (
                        <div className="w-full h-80 md:h-full bg-black/40 flex flex-col items-center justify-center">
                            <BoxIcon className="h-40 w-40 text-slate-800 animate-pulse" />
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mt-8">Concepto Sin Visual</p>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
                    {producto.esSRI && <span className="absolute top-10 left-10 bg-brand-blue text-white text-[9px] font-black px-6 py-2 rounded-full shadow-2xl tracking-[0.2em] border border-white/20">AUTORIZACIÓN SRI ACTIVE</span>}
                </div>
                <div className="w-full md:w-1/2 flex flex-col p-16 relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div className="space-y-4">
                            <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em] bg-brand-blue/10 border border-brand-blue/20 px-5 py-2 rounded-full inline-block">{producto.categoria}</span>
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none italic">{producto.nombre}</h2>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-white">
                            <CloseIcon className="w-8 h-8" />
                        </button>
                    </div>
                    
                    <div className="mb-12 relative z-10">
                        <p className="text-slate-400 font-medium text-lg leading-relaxed border-l-2 border-brand-blue/30 pl-8 italic">
                            {producto.descripcion || 'Este espécimen tipográfico y estructural representa la excelencia en acabados de Imprenta Córdova.'}
                        </p>
                    </div>
                    
                    <div className="mt-auto space-y-12 relative z-10">
                        <div className="flex justify-between items-end border-b border-white/10 pb-10">
                            <div>
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Valor de Mercado</span>
                                <p className="text-10px font-bold text-slate-700 uppercase mt-1">Impuestos e insumos incluidos</p>
                            </div>
                            <p className="text-6xl font-black text-white tracking-tighter drop-shadow-2xl">{formatCurrency(producto.precio)}</p>
                        </div>
                        <div className="flex gap-6">
                            <button onClick={onEdit} className="flex-grow flex items-center justify-center gap-4 px-10 py-6 bg-white text-black font-black rounded-[2rem] shadow-2xl hover:bg-liquid-gold hover:scale-105 transition-all uppercase tracking-[0.3em] text-[10px]">
                                <PencilIcon className="h-5 w-5"/> Modificar
                            </button>
                            <button onClick={onDelete} className="p-6 bg-brand-red/10 text-brand-red border border-brand-red/20 rounded-[2rem] hover:bg-brand-red hover:text-white transition-all shadow-xl group">
                                <TrashIcon className="h-7 w-7 transition-transform group-hover:scale-125"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductCard: React.FC<{
    producto: Producto;
    onViewDetails: () => void;
}> = ({ producto, onViewDetails }) => {
    const isBlock = producto.nombre.includes('BLOCK');
    return (
        <div onClick={onViewDetails} className="group relative bg-white/5 backdrop-blur-md rounded-[2.5rem] shadow-2xl overflow-hidden hover:shadow-white/10 transition-all duration-700 cursor-pointer hover:-translate-y-4 border border-white/5 active:scale-95">
            <div className="h-56 bg-black relative overflow-hidden">
                {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt={producto.nombre} className="w-full h-full object-cover transition-all duration-[2000ms] group-hover:scale-125 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-black">
                        {isBlock ? <LayersIcon className="h-20 w-20 text-slate-800" /> : <DocumentTextIcon className="h-20 w-20 text-slate-800" />}
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                
                {producto.esSRI && (
                    <span className="absolute top-6 left-6 bg-brand-blue text-white text-[8px] font-black px-4 py-1.5 rounded-full shadow-2xl tracking-[0.2em] border border-white/10 uppercase">SRI ACTIVE</span>
                )}
                
                <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <button className="w-full py-3 bg-white text-black text-[9px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl">Inspeccionar</button>
                </div>
            </div>
            <div className="p-8">
                <p className="text-[9px] font-black text-brand-blue uppercase tracking-[0.4em] mb-3 opacity-60 group-hover:opacity-100 transition-opacity">{producto.categoria}</p>
                <h3 className="text-lg font-black text-white uppercase leading-none tracking-tighter truncate mb-6 group-hover:text-liquid-gold transition-colors italic">{producto.nombre}</h3>
                <div className="flex justify-between items-center pt-6 border-t border-white/5">
                    <p className="text-2xl font-black text-white tracking-widest">{formatCurrency(producto.precio)}</p>
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:bg-brand-blue group-hover:border-brand-blue group-hover:text-white transition-all transform group-hover:rotate-45">
                        <ArrowRightIcon className="w-5 h-5 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProductosPage: React.FC = () => {
    const { currentUser } = useOutletContext<{ currentUser: User }>();
    const { productos, loading, createProducto, updateProducto, deleteProducto, bulkCreateProductos } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [productToEdit, setProductToEdit] = useState<Producto | null>(null);
    const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
    const [isMgmtModalOpen, setIsMgmtModalOpen] = useState(false);
    const [viewingProduct, setViewingProduct] = useState<Producto | null>(null);

    const categories = useMemo(() => ['Todas', ...new Set(productos.map(p => p.categoria))], [productos]);
    const filteredProductos = useMemo(() => {
        return productos.filter(p => {
            const matchesCategory = categoryFilter === 'Todas' || p.categoria === categoryFilter;
            const matchesSearch = (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        }).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    }, [productos, searchTerm, categoryFilter]);

    const handleSave = async (product: Producto | Producto[]) => {
        try {
            if (Array.isArray(product)) {
                await bulkCreateProductos(product);
                logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_CREADO', `Generó ${product.length} productos mediante matriz`, 'Catálogo');
            } else {
                if (product.id && !product.id.startsWith('preview')) {
                    await updateProducto(product.id, product);
                    logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_MODIFICADO', `Modificó el producto: ${product.nombre}`, 'Catálogo');
                } else {
                    const { id, ...cleanProduct } = product as any;
                    await createProducto(cleanProduct);
                    logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_CREADO', `Creó un nuevo producto: ${product.nombre}`, 'Catálogo');
                }
            }
            setIsMgmtModalOpen(false);
            setProductToEdit(null);
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Error al guardar producto. Revisa la consola.");
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (productToDelete) {
            const name = productToDelete.nombre;
            await deleteProducto(productToDelete.id);
            logActivity(currentUser.nombre, currentUser.rol, 'PRODUCTO_MODIFICADO', `Eliminó el producto: ${name}`, 'Catálogo');
            setProductToDelete(null);
            setViewingProduct(null);
        }
    };

    return (
        <div className="space-y-16 pb-20 animate-fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-10">
                <div className="relative">
                    <div className="absolute -left-10 top-0 bottom-0 w-1 bg-brand-blue"></div>
                    <h1 className="text-6xl lg:text-8xl font-black text-white uppercase tracking-tighter italic leading-none">
                        Atelier <span className="text-slate-700 block lg:inline">Catalog</span>
                    </h1>
                    <p className="text-[11px] font-black text-brand-blue uppercase tracking-[0.6em] mt-6 flex items-center gap-4">
                        <span className="w-12 h-px bg-brand-blue/30"></span> Gestión de especímenes y matriz de impresión
                    </p>
                </div>
                <button 
                    onClick={() => { setProductToEdit(null); setIsMgmtModalOpen(true); }} 
                    className="group relative px-12 py-6 bg-white text-black font-black rounded-full overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:bg-liquid-gold transition-all flex items-center justify-center gap-6 uppercase tracking-[0.3em] text-[10px]"
                >
                    <div className="absolute inset-0 bg-brand-blue/10 transform -skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    <AddIcon className="h-6 w-6 relative z-10 transition-transform group-hover:rotate-90"/> 
                    <span className="relative z-10">Expandir Catálogo</span>
                </button>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/5 flex flex-col md:flex-row gap-8 shadow-inner">
                <div className="flex-grow relative group">
                    <SearchIcon className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500 group-focus-within:text-brand-blue transition-colors" />
                    <input 
                        type="text" 
                        placeholder="BUSCAR EN EL ARCHIVO..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        className="w-full pl-20 pr-10 py-6 bg-black/40 border-none rounded-[2rem] text-sm font-black tracking-widest focus:ring-1 focus:ring-brand-blue/30 outline-none transition-all text-white placeholder:text-slate-700 uppercase"
                    />
                </div>
                <div className="md:w-80 relative group">
                    <TableIcon className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500" />
                    <select 
                        value={categoryFilter} 
                        onChange={e => setCategoryFilter(e.target.value)} 
                        className="w-full pl-20 pr-10 py-6 bg-black/40 border-none rounded-[2rem] text-sm font-black tracking-[0.2em] focus:ring-1 focus:ring-brand-blue/30 outline-none transition-all text-white appearance-none cursor-pointer uppercase"
                    >
                        {categories.map(cat => <option key={cat} value={cat} className="bg-slate-900 border-none">{cat.toUpperCase()}</option>)}
                    </select>
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-white transition-colors">
                        <ArrowRightIcon className="w-4 h-4 rotate-90" />
                    </div>
                </div>
            </div>
            
            {loading ? (
                <div className="py-20 text-center space-y-4">
                    <Loader2Icon className="animate-spin h-10 w-10 text-brand-blue mx-auto" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando catálogo...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-12">
                    {filteredProductos.map(p => (
                        <ProductCard key={p.id} producto={p} onViewDetails={() => setViewingProduct(p)} />
                    ))}
                    {filteredProductos.length === 0 && (
                        <div className="col-span-full py-48 text-center opacity-20 flex flex-col items-center">
                            <BoxIcon className="w-32 h-32 mb-10 text-slate-500 animate-pulse" />
                            <p className="font-black uppercase tracking-[0.5em] text-sm">Archivo Vacío / Sin Coincidencias</p>
                        </div>
                    )}
                </div>
            )}
            
            <ProductManagementModal isOpen={isMgmtModalOpen} onClose={() => setIsMgmtModalOpen(false)} onSave={handleSave} productToEdit={productToEdit} />
            {productToDelete && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex justify-center items-center p-4">
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-[3rem] shadow-3xl w-full max-w-lg border border-white/10 p-16 text-center transform scale-110">
                        <div className="w-24 h-24 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-brand-red/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                            <TrashIcon className="h-10 w-10 text-brand-red animate-pulse" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Destrucción Confirmada</h3>
                        <p className="mt-6 text-slate-400 font-medium leading-relaxed px-4">
                            Estás a punto de desmaterializar a <span className="text-white font-bold">{productToDelete.nombre}</span> de los registros maestros. Esta acción es irreversible.
                        </p>
                        <div className="mt-14 flex flex-col gap-4">
                            <button onClick={handleDeleteConfirm} className="w-full py-6 bg-brand-red text-white font-black rounded-full shadow-2xl uppercase tracking-[0.3em] text-[10px] hover:scale-105 transition-all active:scale-95">
                                Confirmar Aniquilación
                            </button>
                            <button onClick={() => setProductToDelete(null)} className="w-full py-6 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] hover:text-white transition-colors">
                                Abortar Operación
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {viewingProduct && (
                <ProductDetailModal 
                    producto={viewingProduct}
                    onClose={() => setViewingProduct(null)}
                    onEdit={() => { setProductToEdit(viewingProduct); setViewingProduct(null); setIsMgmtModalOpen(true); }}
                    onDelete={() => { setProductToDelete(viewingProduct); setViewingProduct(null); }}
                />
            )}
        </div>
    );
};

export default ProductosPage;
