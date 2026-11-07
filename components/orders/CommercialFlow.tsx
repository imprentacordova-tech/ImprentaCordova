import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircleIcon, PrinterIcon,
    BoltIcon, Loader2Icon, SearchIcon, ChevronRightIcon
} from '../Icons';
import { Producto, Trabajo, TrabajoEstado } from '../../types';
import { useData } from '../../contexts/DataContext';
import { formatCurrency } from '../../utils';

interface CommercialFlowProps {
    onComplete: (data: {
        trabajo: Partial<Trabajo>, 
        clienteNombre: string, 
        clienteTelefono: string,
        clienteId?: string
    }) => void;
    onCancel: () => void;
}

const CommercialProductCard: React.FC<{ p: Producto; isExpress: boolean; onSelect: () => void }> = ({ p, isExpress, onSelect }) => {
    return (
        <div
            onClick={onSelect}
            className={`group bg-white rounded-2xl border-2 p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
                isExpress ? 'border-blue-200 hover:border-blue-500' : 'border-slate-200 hover:border-brand-blue'
            }`}
        >
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-brand-blue text-lg shrink-0">
                        {isExpress ? <BoltIcon className="w-5 h-5 text-blue-600" /> : <PrinterIcon className="w-5 h-5 text-brand-blue" />}
                    </div>
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                        {p.categoria || 'General'}
                    </span>
                </div>

                <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase leading-snug group-hover:text-brand-blue transition-colors">
                        {p.nombre}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                        {p.descripcion || 'Producto publicitario o comercial'}
                    </p>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Precio Base</span>
                    <span className="text-base font-black text-slate-900">{formatCurrency(p.precio || 0)}</span>
                </div>

                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelect(); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                        isExpress
                            ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                            : 'bg-brand-blue text-white shadow-sm hover:bg-brand-blue/90'
                    }`}
                >
                    <span>Configurar</span>
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

export const CommercialFlow: React.FC<CommercialFlowProps> = ({ onComplete }) => {
    const { productos } = useData();

    const [step, setStep] = useState<1 | 2>(1); 
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('Todas');
    const [search, setSearch] = useState<string>('');

    // Configuración comercial
    const [cantidad, setCantidad] = useState<number>(100);
    const [tamano] = useState<string>('Estandar');
    const [acabado] = useState<string>('Ninguno');
    const [precioCustom] = useState<number>(0);

    // Cliente
    const [clienteNombre, setClienteNombre] = useState<string>('');
    const [clienteTelefono, setClienteTelefono] = useState<string>('');
    const [selectedClientId] = useState<string | undefined>(undefined);
    const [abono] = useState<number>(0);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Categorías comerciales
    const commercialCategories = useMemo(() => {
        const cats = new Set(productos.filter(p => !p.esSRI).map(p => p.categoria || 'General'));
        return ['Todas', ...Array.from(cats)];
    }, [productos]);

    // Filtrar solo productos NO SRI
    const commercialProducts = useMemo(() => {
        return productos.filter(p => {
            if (p.esSRI || p.esActivo === false) return false;
            const matchesSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === 'Todas' || (p.categoria || 'General') === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [productos, search, activeCategory]);

    // Calcular precio
    const precioFinal = useMemo(() => {
        if (precioCustom > 0) return precioCustom;
        if (!selectedProduct) return 0;
        let base = selectedProduct.precio * (cantidad / 100); 
        if (acabado !== 'Ninguno') base += (5 * (cantidad / 100));
        return base > 0 ? base : selectedProduct.precio;
    }, [selectedProduct, cantidad, acabado, precioCustom]);

    const handleConfirm = async (directProduct?: Producto) => {
        const product = directProduct || selectedProduct;
        if (!product) return;

        setIsSubmitting(true);
        try {
            const finalPrice = directProduct ? product.precio : precioFinal;
            const nuevoTrabajo: Partial<Trabajo> = {
                orden: Math.floor(100000 + Math.random() * 900000),
                clienteId: selectedClientId || 'cliente_express_comercial',
                titular: clienteNombre.trim() || 'Consumidor Final',
                tipo: product.nombre,
                subtipo: directProduct ? 'PEDIDO EXPRESS' : `${cantidad} x ${tamano} - ${acabado}`,
                cantidad: directProduct ? 1 : cantidad,
                tamano: directProduct ? 'Estándar' : tamano,
                estado: TrabajoEstado.PENDIENTE,
                fechaEntrada: new Date().toISOString(),
                fechaEntrega: new Date(Date.now() + 86400000 * 2).toISOString(),
                total: finalPrice,
                abono: directProduct ? finalPrice : abono,
                saldo: directProduct ? 0 : finalPrice - abono,
                prioridad: directProduct ? 'Urgente' : 'Normal',
                detalle: directProduct ? 'VENTA RÁPIDA DE MOSTRADOR' : `${cantidad} x ${tamano} - ${acabado}`,
                caduco: false,
                estadoClave: 'PENDIENTE',
                imprimirClave: false,
            };

            await onComplete({
                trabajo: nuevoTrabajo,
                clienteNombre: (clienteNombre.trim() || 'Consumidor Final'),
                clienteTelefono: clienteTelefono.trim(),
                clienteId: selectedClientId
            });
        } catch (error) {
            console.error("Error en flujo comercial:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                {/* PASO 1: SELECCION DE PRODUCTO */}
                {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        {/* Filtros y búsqueda */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="relative flex-1 w-full">
                                    <SearchIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input 
                                        type="text" 
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)} 
                                        placeholder="Buscar producto comercial..." 
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-brand-blue" 
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {commercialCategories.map(cat => (
                                    <button 
                                        key={cat} 
                                        type="button"
                                        onClick={() => setActiveCategory(cat)} 
                                        className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all border ${
                                            activeCategory === cat 
                                                ? 'bg-brand-blue text-white border-brand-blue shadow-blue-glow-sm' 
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid de Productos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {commercialProducts.map(p => (
                                <CommercialProductCard 
                                    key={p.id} 
                                    p={p} 
                                    isExpress={p.nombre.toLowerCase().includes('express')}
                                    onSelect={() => {
                                        setSelectedProduct(p);
                                        setStep(2);
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* PASO 2: CONFIGURACION Y CLIENTE */}
                {step === 2 && selectedProduct && (
                    <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest block">Paso 2 — Personalización</span>
                                <h3 className="text-xl font-black text-slate-900 uppercase">{selectedProduct.nombre}</h3>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setStep(1)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-700 transition-colors"
                            >
                                Cambiar Producto
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Cantidad</label>
                                    <input 
                                        type="number" 
                                        value={cantidad} 
                                        onChange={e => setCantidad(Number(e.target.value))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-sm font-bold outline-none focus:border-brand-blue"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Nombre / Razón Social Cliente</label>
                                    <input 
                                        type="text" 
                                        value={clienteNombre} 
                                        onChange={e => setClienteNombre(e.target.value.toUpperCase())}
                                        placeholder="Ej: Consumidor Final / Nombre Comercial"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-brand-blue"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Teléfono WhatsApp</label>
                                    <input 
                                        type="tel" 
                                        value={clienteTelefono} 
                                        onChange={e => setClienteTelefono(e.target.value)}
                                        placeholder="09..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-sm font-bold outline-none focus:border-brand-blue"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Resumen de Precio</span>
                                    <div className="text-3xl font-black text-slate-900">{formatCurrency(precioFinal)}</div>
                                    <div className="text-[11px] font-bold text-slate-500">
                                        Subtotal calculado para {cantidad} unidades
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleConfirm()}
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-blue-glow-sm transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                                    Confirmar e Ingresar Pedido
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CommercialFlow;
