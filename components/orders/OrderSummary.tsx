import React, { useState } from 'react';
import { Cliente, Regimen } from '../../types';
import { formatCurrency } from '../../utils';
import { 
    TrashIcon, CheckCircleIcon, Loader2Icon, WalletIcon, 
    ShieldCheckIcon, KeyIcon, ArrowRightIcon, 
    ClockIcon, SparklesIcon, UserPlusIcon, CheckBadgeIcon,
    ChevronRightIcon, InfoIcon, AlertTriangleIcon
} from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { type CartItem } from '../../hooks/useOrder';

export interface OrderItem {
    nombre: string;
    cantidad: number;
    precioFinal: number;
    descripcion?: string;
    especificaciones?: any;
}

interface OrderSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems?: [string, CartItem][];
    items?: OrderItem[];
    orderTotal?: number;
    total?: number;
    client: Cliente | null;
    tempClient?: { nombre: string, telefono: string, cedula?: string, regimen?: Regimen };
    setTempClient?: (data: { nombre: string, telefono: string, cedula?: string, regimen?: Regimen }) => void;
    abono: number;
    setAbono: (val: number) => void;
    prioridad?: 'Normal' | 'Urgente';
    setPrioridad?: (val: 'Normal' | 'Urgente') => void;
    tiempoEntrega?: '24h' | '48h';
    setTiempoEntrega?: (val: '24h' | '48h') => void;
    onUpdateQuantity?: (id: string, qty: number) => void;
    onUpdateNotes?: (id: string, notes: string) => void;
    onUpdatePrice?: (id: string, price: number) => void;
    onRemoveItem?: (id: string) => void;
    onSaveItem?: (id: string) => void;
    onFinalize?: () => void;
    onDeploy?: () => void;
    isLoading: boolean;
    sriData: any;
    setSriData: (data: any) => void;
    imprimirClave: boolean;
    setImprimirClave: (val: boolean) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ 
    cartItems = [], items = [], orderTotal, total, client, tempClient, setTempClient, abono, setAbono, 
    prioridad = 'Normal', setPrioridad,
    tiempoEntrega = '48h', setTiempoEntrega,
    onRemoveItem, onFinalize, onDeploy, isLoading,
    sriData, setSriData, imprimirClave, setImprimirClave
}) => {
    const [showClave, setShowClave] = useState(false);
    const finalTotal = total ?? orderTotal ?? 0;
    const saldo = Math.max(0, finalTotal - abono);

    const displayItems = items.length > 0 
        ? items.map((it, idx) => ({ id: idx.toString(), nombre: it.nombre, cantidad: it.cantidad, precio: it.precioFinal, specs: it.especificaciones }))
        : cartItems.map(([id, it]) => ({ id, nombre: it.producto.nombre, cantidad: it.cantidad, precio: it.producto.precio + (it.surcharge || 0), specs: undefined }));

    const handleFinalize = onDeploy || onFinalize || (() => {});

    const suggestAbono = (percent: number) => {
        const val = percent === 1 ? finalTotal : Math.ceil(finalTotal * percent);
        setAbono(val);
        if ('vibrate' in navigator) navigator.vibrate(15);
    };

    return (
        <div className="flex flex-col min-h-full bg-white relative font-sans rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <header className="p-6 md:p-8 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
                <div>
                    <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest block">Paso 5 — Resumen de Pago</span>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        Confirmación de la Orden
                    </h2>
                </div>

                {setPrioridad && (
                    <button 
                        type="button"
                        onClick={() => setPrioridad(prioridad === 'Normal' ? 'Urgente' : 'Normal')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 border ${
                            prioridad === 'Urgente' 
                                ? 'bg-red-50 border-red-200 text-red-700 shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${prioridad === 'Urgente' ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span>Prioridad: {prioridad}</span>
                    </button>
                )}
            </header>

            {/* Cuerpo de Datos */}
            <div className="p-6 md:p-8 space-y-8 flex-1">
                {displayItems.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                        <WalletIcon className="w-12 h-12 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold uppercase tracking-wider">No se han agregado productos a la orden</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Lista de Items */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                Detalle de Productos ({displayItems.length})
                            </label>

                            {displayItems.map((item) => (
                                <div 
                                    key={item.id}
                                    className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                                >
                                    <div className="space-y-1">
                                        <h4 className="text-base font-black text-slate-900 uppercase">{item.nombre}</h4>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                            <span>Cant: <strong>{item.cantidad}</strong></span>
                                            {item.specs?.tamano && <span>• Tamaño: {item.specs.tamano}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                        <div className="text-right">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Subtotal</span>
                                            <span className="text-lg font-black text-slate-900">{formatCurrency(item.precio)}</span>
                                        </div>
                                        {onRemoveItem && (
                                            <button onClick={() => onRemoveItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-500">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cliente */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                Datos del Cliente
                            </label>
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                {client ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-black shrink-0">
                                            <CheckBadgeIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-slate-900 uppercase">{client.nombre}</h4>
                                            <div className="text-[11px] font-mono text-slate-500">
                                                RUC/CI: {client.cedula || client.ruc} • Tel: {client.telefono}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Nombre / Razón Social</label>
                                            <input 
                                                type="text" value={tempClient?.nombre || ''}
                                                onChange={e => setTempClient?.({ ...tempClient!, nombre: e.target.value.toUpperCase() })}
                                                placeholder="Ingresa nombre..."
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-bold outline-none focus:border-brand-blue"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Teléfono WhatsApp</label>
                                            <input 
                                                type="tel" value={tempClient?.telefono || ''}
                                                onChange={e => setTempClient?.({ ...tempClient!, telefono: e.target.value })}
                                                placeholder="09..."
                                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-mono outline-none focus:border-brand-blue"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cronograma de Entrega */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                Tiempo Estimado de Entrega
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: '24h', label: 'Express (24 Horas)', sub: 'Entrega prioritaria', icon: SparklesIcon },
                                    { id: '48h', label: 'Estándar (48 Horas)', sub: 'Producción regular', icon: ClockIcon }
                                ].map(opt => (
                                    <button 
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setTiempoEntrega?.(opt.id as any)}
                                        className={`p-4 rounded-xl border text-left transition-all ${
                                            tiempoEntrega === opt.id 
                                                ? 'bg-brand-blue/5 border-brand-blue text-brand-blue ring-2 ring-brand-blue/10' 
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <div className="text-[12px] font-black uppercase">{opt.label}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{opt.sub}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clave SRI si existe */}
                        {sriData && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                        Clave / Autorización SRI
                                    </label>
                                    <button 
                                        type="button"
                                        onClick={() => setImprimirClave(!imprimirClave)}
                                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                                            imprimirClave ? 'bg-brand-blue text-white border-brand-blue' : 'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}
                                    >
                                        {imprimirClave ? 'Imprimir Clave en Recibo' : 'No Imprimir Clave'}
                                    </button>
                                </div>
                                <input 
                                    type="text"
                                    value={sriData?.claveAcceso || ''}
                                    onChange={e => setSriData({ ...sriData, claveAcceso: e.target.value })}
                                    placeholder="Clave de acceso..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-[12px] font-bold text-slate-900 outline-none focus:border-brand-blue"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer de Registro de Pago */}
            <div className="p-6 md:p-8 bg-slate-900 text-white border-t border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total de la Orden</span>
                        <div className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                            {formatCurrency(finalTotal)}
                        </div>
                        <div className="text-[11px] font-bold text-emerald-400 mt-1">
                            Saldo Restante: {formatCurrency(saldo)}
                        </div>
                    </div>

                    <div className="space-y-2 w-full sm:w-72">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            Abono Inicial (USD)
                        </label>
                        <div className="relative">
                            <input 
                                type="number"
                                value={abono || ''}
                                onChange={e => setAbono(parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xl font-black text-white font-mono outline-none focus:border-brand-blue"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <button type="button" onClick={() => suggestAbono(0.5)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-[9px] font-bold uppercase">50%</button>
                                <button type="button" onClick={() => suggestAbono(1)} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-[9px] font-bold uppercase">100%</button>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={isLoading || displayItems.length === 0}
                    className="w-full py-4 bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 text-white rounded-xl text-[12px] font-black uppercase tracking-wider shadow-blue-glow-sm transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2Icon className="w-4 h-4 animate-spin" /> Procesando Orden...
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="w-4 h-4" /> Crear y Registrar Orden de Producción
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default OrderSummary;
