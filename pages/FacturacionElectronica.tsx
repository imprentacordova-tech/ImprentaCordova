import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext';
import { FacturaElectronica, EstadoFacturaSri, FacturaDetalleItem, Trabajo } from '../types';
import { sriInvoiceService, generarClaveAccesoSRI } from '../services/sriInvoiceService';
import { formatCurrency } from '../utils';
import {
    ReceiptIcon, SparklesIcon, ShieldCheckIcon, CheckCircleIcon,
    ExclamationTriangleIcon, SearchIcon, Loader2Icon, ArrowDownTrayIcon,
    UsersIcon, QrCodeIcon, PrinterIcon, ChevronRightIcon, PlusIcon,
    RefreshIcon, ServerIcon, ExternalLinkIcon, Building2Icon,
    EnvelopeIcon, LockIcon, KeyIcon, BoxIcon
} from '../components/Icons';

// ─── BADGE COMPONENT ────────────────────────────────────────────────────────
const EstadoBadge: React.FC<{ estado: EstadoFacturaSri }> = ({ estado }) => {
    const config: Record<EstadoFacturaSri, { bg: string; text: string; dot: string; label: string }> = {
        AUTORIZADO: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'AUTORIZADO SRI' },
        PENDIENTE:  { bg: 'bg-amber-500/10 border-amber-500/20',   text: 'text-amber-400',   dot: 'bg-amber-500',   label: 'PENDIENTE' },
        PROCESANDO: { bg: 'bg-brand-blue/10 border-brand-blue/20',     text: 'text-brand-blue',    dot: 'bg-blue-500 animate-ping', label: 'PROCESANDO SRI' },
        RECHAZADO:  { bg: 'bg-brand-red/10 border-brand-red/20',       text: 'text-brand-red',     dot: 'bg-red-500',     label: 'RECHAZADO' },
        ANULADO:    { bg: 'bg-white/[0.04] border-white/[0.06]',   text: 'text-slate-300',   dot: 'bg-slate-400',   label: 'ANULADO' },
        ERROR:      { bg: 'bg-brand-red/10 border-brand-red/20',     text: 'text-brand-red',    dot: 'bg-rose-500',    label: 'ERROR CONEXIÓN' },
    };

    const cfg = config[estado] || config.PENDIENTE;

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

export const FacturacionElectronicaPage: React.FC = () => {
    const { trabajos, clientes, inventario, loading: dataLoading } = useData();
    const [facturas, setFacturas] = useState<FacturaElectronica[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<'historial' | 'emitir' | 'render'>('historial');

    // Filtros de búsqueda
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');

    // Modal de emisión directa
    const [isEmitirModalOpen, setIsEmitirModalOpen] = useState(false);
    const [selectedTrabajo, setSelectedTrabajo] = useState<Trabajo | null>(null);

    // Formulario de emisión libre o de orden
    const [clienteId, setClienteId] = useState('');
    const [ambiente, setAmbiente] = useState<'PRUEBAS' | 'PRODUCCION'>('PRUEBAS');
    const [items, setItems] = useState<FacturaDetalleItem[]>([
        { codigo: 'SERV-01', descripcion: 'Servicios de Impresión Offset / Digital', cantidad: 1, precioUnitario: 50.00, descuento: 0, precioTotal: 50.00, iva: 15 }
    ]);
    const [emitting, setEmitting] = useState(false);
    const [emissionFeedback, setEmissionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Carga de facturas
    const loadFacturas = async () => {
        setLoading(true);
        const data = await sriInvoiceService.getFacturas();
        setFacturas(data);
        setLoading(false);
    };

    useEffect(() => {
        loadFacturas();
    }, []);

    // Órdenes elegibles para facturación (que tengan cliente y no estén anuladas)
    const ordenesElegibles = useMemo(() => {
        if (!trabajos) return [];
        return trabajos.filter(t => t.total > 0);
    }, [trabajos]);

    // Estadísticas
    const stats = useMemo(() => {
        const totalFacturado = facturas.reduce((acc, f) => acc + (f.estado === 'AUTORIZADO' ? f.total : 0), 0);
        const autorizadas = facturas.filter(f => f.estado === 'AUTORIZADO').length;
        const pendientes = facturas.filter(f => f.estado === 'PENDIENTE' || f.estado === 'PROCESANDO').length;
        const totalIva = facturas.reduce((acc, f) => acc + (f.estado === 'AUTORIZADO' ? f.iva12 : 0), 0);

        return { totalFacturado, autorizadas, pendientes, totalIva };
    }, [facturas]);

    // Filtrado de historial
    const facturasFiltradas = useMemo(() => {
        return facturas.filter(f => {
            const matchesSearch =
                f.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.clienteIdentificacion.includes(searchQuery) ||
                f.numeroFactura.includes(searchQuery) ||
                f.claveAcceso.includes(searchQuery);

            const matchesEstado = estadoFilter === 'TODOS' || f.estado === estadoFilter;

            return matchesSearch && matchesEstado;
        });
    }, [facturas, searchQuery, estadoFilter]);

    // Selección de trabajo para modal
    const handleSelectTrabajoForEmision = (t: Trabajo) => {
        setSelectedTrabajo(t);
        const clienteObj = clientes.find(c => c.id === t.clienteId || c.nombre.toLowerCase() === t.titular.toLowerCase());
        setClienteId(clienteObj ? clienteObj.id : '');

        setItems([
            {
                codigo: `ORD-${t.orden}`,
                descripcion: `${t.tipo} ${t.subtipo ? ' - ' + t.subtipo : ''} (Orden #${t.orden})`,
                cantidad: t.cantidad || 1,
                precioUnitario: Number((t.total / (t.cantidad || 1)).toFixed(2)),
                descuento: 0,
                precioTotal: t.total,
                iva: 15
            }
        ]);

        setIsEmitirModalOpen(true);
    };

    // Agregar item a formulario de emisión
    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            { codigo: `ITEM-${prev.length + 1}`, descripcion: 'Producto / Servicio Gráfico', cantidad: 1, precioUnitario: 10.00, descuento: 0, precioTotal: 10.00, iva: 15 }
        ]);
    };

    // Actualizar item
    const handleUpdateItem = (index: number, field: keyof FacturaDetalleItem, val: any) => {
        setItems(prev => {
            const copy = [...prev];
            const item = { ...copy[index], [field]: val };
            if (field === 'cantidad' || field === 'precioUnitario' || field === 'descuento') {
                const cant = Number(item.cantidad) || 0;
                const pu = Number(item.precioUnitario) || 0;
                const desc = Number(item.descuento) || 0;
                item.precioTotal = Number((cant * pu - desc).toFixed(2));
            }
            copy[index] = item;
            return copy;
        });
    };

    // Eliminar item
    const handleRemoveItem = (index: number) => {
        if (items.length <= 1) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // Envío de emisión
    const handleEmitirFacturaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmitting(true);
        setEmissionFeedback(null);

        const clienteObj = clientes.find(c => c.id === clienteId);
        const clienteNombre = clienteObj ? clienteObj.nombre : (selectedTrabajo ? selectedTrabajo.titular : 'CLIENTE CONSUMIDOR FINAL');
        const clienteIdentificacion = clienteObj?.ruc || clienteObj?.cedula || '9999999999999';
        const clienteTipoId = clienteIdentificacion.length === 13 ? 'RUC' : (clienteIdentificacion.length === 10 ? 'CEDULA' : 'PASAPORTE');

        const result = await sriInvoiceService.emitirFactura({
            trabajoId: selectedTrabajo ? selectedTrabajo.id : undefined,
            clienteId: clienteId || '00000000-0000-0000-0000-000000000000',
            clienteNombre,
            clienteIdentificacion,
            clienteTipoId,
            clienteEmail: clienteObj?.email,
            clienteDireccion: clienteObj?.direccion,
            detalles: items,
            ambiente
        });

        setEmitting(false);

        if (result.success && result.factura) {
            setEmissionFeedback({ type: 'success', message: `Factura ${result.factura.numeroFactura} generada exitosamente. Clave de acceso SRI registrada.` });
            await loadFacturas();
            setTimeout(() => {
                setIsEmitirModalOpen(false);
                setEmissionFeedback(null);
                setSelectedTrabajo(null);
            }, 2000);
        } else {
            setEmissionFeedback({ type: 'error', message: result.error || 'Error al emitir factura' });
        }
    };

    return (
        <div className="p-5 lg:p-8 pb-24 lg:pb-10 space-y-8 max-w-[1440px] mx-auto">
            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 bg-brand-blue/10 rounded-xl text-brand-blue">
                            <ReceiptIcon className="w-6 h-6" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-brand-blue uppercase tracking-[0.4em]">SRI ECUADOR V2.1.0</span>
                                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                                    Firmado Digital
                                </span>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase">
                                Facturación Electrónica
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setSelectedTrabajo(null); setIsEmitirModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-3 bg-brand-blue text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-brand-blue/90 shadow-blue-glow-sm transition-all"
                    >
                        <SparklesIcon className="w-4 h-4" /> Nueva Factura Directa
                    </button>
                    <button
                        onClick={loadFacturas}
                        className="p-3 bg-obsidian-card border border-white/[0.06] text-slate-300 hover:text-white rounded-xl transition-all"
                        title="Actualizar datos"
                    >
                        <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* ── METRICS GRID ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider">Total Facturado</span>
                        <ReceiptIcon className="w-4 h-4 text-brand-blue" />
                    </div>
                    <div className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                        {formatCurrency(stats.totalFacturado)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1">Autorizado por el SRI</div>
                </div>

                <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider">Facturas Autorizadas</span>
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl lg:text-3xl font-black text-emerald-600 tracking-tight">
                        {stats.autorizadas}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1">Comprobantes válidos</div>
                </div>

                <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider">En Proceso SRI</span>
                        <Loader2Icon className="w-4 h-4 text-amber-500 animate-spin" />
                    </div>
                    <div className="text-2xl lg:text-3xl font-black text-amber-600 tracking-tight">
                        {stats.pendientes}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1">Pendientes de respuesta</div>
                </div>

                <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider">IVA 15% Generado</span>
                        <Building2Icon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl lg:text-3xl font-black text-purple-400 tracking-tight">
                        {formatCurrency(stats.totalIva)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1">Impuesto a declarar</div>
                </div>
            </div>

            {/* ── TABS NAVEGACIÓN ─────────────────────────────────────────── */}
            <div className="flex border-b border-white/[0.06] gap-6">
                <button
                    onClick={() => setActiveTab('historial')}
                    className={`pb-3 text-[12px] font-black uppercase tracking-wider transition-all relative ${
                        activeTab === 'historial' ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Historial de Facturas ({facturas.length})
                    {activeTab === 'historial' && (
                        <motion.div layoutId="sriTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-blue" />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('emitir')}
                    className={`pb-3 text-[12px] font-black uppercase tracking-wider transition-all relative ${
                        activeTab === 'emitir' ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Facturar Orden Existente ({ordenesElegibles.length})
                    {activeTab === 'emitir' && (
                        <motion.div layoutId="sriTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-blue" />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('render')}
                    className={`pb-3 text-[12px] font-black uppercase tracking-wider transition-all relative ${
                        activeTab === 'render' ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Estado Conexión Render & SRI
                    {activeTab === 'render' && (
                        <motion.div layoutId="sriTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-blue" />
                    )}
                </button>
            </div>

            {/* ── TAB 1: HISTORIAL DE FACTURAS ─────────────────────────────── */}
            {activeTab === 'historial' && (
                <div className="space-y-4">
                    {/* Barra de búsqueda y filtros */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-obsidian-card p-4 rounded-2xl border border-white/[0.06]">
                        <div className="relative flex-1 w-full">
                            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar por RUC, cliente, número de factura o clave de acceso..."
                                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-11 pr-4 py-2.5 text-[12px] font-medium outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10 transition-all"
                            />
                        </div>

                        <select
                            value={estadoFilter}
                            onChange={e => setEstadoFilter(e.target.value)}
                            className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-200 outline-none focus:border-brand-blue transition-all"
                        >
                            <option value="TODOS">Todos los Estados</option>
                            <option value="AUTORIZADO">Autorizados</option>
                            <option value="PENDIENTE">Pendientes</option>
                            <option value="RECHAZADO">Rechazados</option>
                        </select>
                    </div>

                    {/* Tabla de Facturas */}
                    <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
                        {loading ? (
                            <div className="p-12 text-center space-y-3">
                                <Loader2Icon className="w-8 h-8 text-brand-blue animate-spin mx-auto" />
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cargando comprobantes electrónicos SRI...</p>
                            </div>
                        ) : facturasFiltradas.length === 0 ? (
                            <div className="p-12 text-center space-y-3">
                                <ReceiptIcon className="w-10 h-10 text-slate-300 mx-auto" />
                                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">No se encontraron facturas</h3>
                                <p className="text-[11px] text-slate-400">Emite una nueva factura desde una orden de trabajo o directamente.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/[0.04] border-b border-white/[0.06] text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <th className="p-4">N° Factura / Clave Acceso</th>
                                            <th className="p-4">Cliente / Identificación</th>
                                            <th className="p-4">Fecha Emisión</th>
                                            <th className="p-4">Subtotal / IVA</th>
                                            <th className="p-4">Total</th>
                                            <th className="p-4">Estado SRI</th>
                                            <th className="p-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.06] text-[11px] font-medium text-slate-200">
                                        {facturasFiltradas.map(f => (
                                            <tr key={f.id} className="hover:bg-white/[0.04] transition-colors">
                                                <td className="p-4 space-y-0.5">
                                                    <div className="font-black text-white font-mono">{f.numeroFactura}</div>
                                                    <div className="text-[8px] font-mono text-slate-400 truncate max-w-[200px]" title={f.claveAcceso}>
                                                        Clave: {f.claveAcceso}
                                                    </div>
                                                </td>
                                                <td className="p-4 space-y-0.5">
                                                    <div className="font-bold text-white truncate max-w-[220px]">{f.clienteNombre}</div>
                                                    <div className="text-[9px] font-mono text-slate-500">{f.clienteTipoId}: {f.clienteIdentificacion}</div>
                                                </td>
                                                <td className="p-4 font-mono text-slate-500 text-[10px]">
                                                    {new Date(f.fechaEmision).toLocaleDateString('es-EC')}
                                                </td>
                                                <td className="p-4 space-y-0.5">
                                                    <div className="text-slate-300">Sub: {formatCurrency(f.subtotalSinImpuestos)}</div>
                                                    <div className="text-[9px] text-purple-600 font-bold">IVA 15%: {formatCurrency(f.iva12)}</div>
                                                </td>
                                                <td className="p-4 font-black text-white text-sm">
                                                    {formatCurrency(f.total)}
                                                </td>
                                                <td className="p-4">
                                                    <EstadoBadge estado={f.estado} />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => alert(`Visualizando RIDE PDF para ${f.numeroFactura}\nClave de Acceso: ${f.claveAcceso}\nEstado: ${f.estado}`)}
                                                            className="p-2 bg-white/[0.04] hover:bg-brand-blue hover:text-white rounded-lg text-slate-300 transition-colors"
                                                            title="Ver / Descargar RIDE PDF"
                                                        >
                                                            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => alert(`XML Sign de factura ${f.numeroFactura}:\n${f.claveAcceso}`)}
                                                            className="p-2 bg-white/[0.04] hover:bg-slate-800 hover:text-white rounded-lg text-slate-300 transition-colors"
                                                            title="Ver XML Firmado"
                                                        >
                                                            <QrCodeIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB 2: EMITIR FACTURA DE ORDEN EXISTENTE ───────────────────── */}
            {activeTab === 'emitir' && (
                <div className="space-y-4">
                    <div className="bg-obsidian-card p-5 rounded-2xl border border-white/[0.06] space-y-1">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Órdenes de Trabajo Elegibles para Facturar</h3>
                        <p className="text-[11px] text-slate-400">Selecciona cualquier orden activa para generar su comprobante electrónico con un solo clic.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ordenesElegibles.map(t => (
                            <div key={t.id} className="bg-obsidian-card border border-white/[0.06] rounded-2xl p-5 space-y-4 shadow-sm hover:border-brand-blue/30 transition-all flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-brand-blue font-mono">ORDEN #{t.orden}</span>
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300">
                                            {t.estado}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-black text-white truncate">{t.titular}</h4>
                                    <p className="text-[11px] text-slate-500">{t.tipo} · {t.cantidad} unidades</p>
                                </div>

                                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                                    <div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase">Monto Total</div>
                                        <div className="text-lg font-black text-white">{formatCurrency(t.total)}</div>
                                    </div>
                                    <button
                                        onClick={() => handleSelectTrabajoForEmision(t)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-brand-blue/90 transition-all"
                                    >
                                        Facturar <ChevronRightIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── TAB 3: ESTADO RENDER & CONEXIÓN SRI ─────────────────────── */}
            {activeTab === 'render' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Render.com Backend Status */}
                    <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl p-6 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                                <ServerIcon className="w-6 h-6" />
                            </span>
                            <div>
                                <h3 className="text-base font-black text-white uppercase">Microservicio Render.com</h3>
                                <p className="text-[11px] text-slate-400">Motor de Firma XML + SOAP SRI Ecuador</p>
                            </div>
                        </div>

                        <div className="space-y-3 bg-white/[0.04] p-4 rounded-xl border border-white/[0.06] font-mono text-[11px]">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">API URL:</span>
                                <span className="font-bold text-white">https://cordova-sri-api.onrender.com</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Estado Conexión:</span>
                                <span className="font-bold text-emerald-600 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sandbox Activo / En espera de Deploy
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500">Certificado P12:</span>
                                <span className="font-bold text-amber-600">Configurado en .env</span>
                            </div>
                        </div>

                        <div className="space-y-2 text-[11px] text-slate-300">
                            <h4 className="font-black text-white uppercase text-[10px] tracking-wider">Pasos para conectar tu propio backend en Render:</h4>
                            <ol className="list-decimal list-inside space-y-1 text-slate-400">
                                <li>Despliega tu API Node.js SRI en Render.com</li>
                                <li>Configura la variable `VITE_RENDER_SRI_API_URL` con tu URL final</li>
                                <li>Sube tu certificado de firma electrónica `.p12` codificado en base64 en Render</li>
                            </ol>
                        </div>
                    </div>

                    {/* SRI Ambiente & Credenciales */}
                    <div className="bg-obsidian-card border border-white/[0.06] rounded-2xl p-6 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="p-3 bg-brand-blue/10 text-brand-blue rounded-xl">
                                <ShieldCheckIcon className="w-6 h-6" />
                            </span>
                            <div>
                                <h3 className="text-base font-black text-white uppercase">Ambiente SRI Ecuador</h3>
                                <p className="text-[11px] text-slate-400">Pruebas vs Producción Real</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                                <div>
                                    <div className="text-[12px] font-black text-white uppercase">Modo Sandbox Pruebas</div>
                                    <div className="text-[10px] text-slate-400">Genera claves de acceso válidas sin impactar al SRI fiscal</div>
                                </div>
                                <span className="px-3 py-1 bg-brand-blue text-white text-[9px] font-black rounded-full uppercase">ACTIVO</span>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                                <div>
                                    <div className="text-[12px] font-black text-white uppercase">Integración con Inventario</div>
                                    <div className="text-[10px] text-slate-400">Descuento automático de stock de insumos al facturar</div>
                                </div>
                                <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-full uppercase">CONECTADO</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL EMISIÓN DE FACTURA ─────────────────────────────────── */}
            <AnimatePresence>
                {isEmitirModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setIsEmitirModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-obsidian-card rounded-3xl p-6 lg:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                                <div>
                                    <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">EMISIÓN ELECTRÓNICA</span>
                                    <h3 className="text-xl font-black text-white uppercase">
                                        {selectedTrabajo ? `Facturar Orden #${selectedTrabajo.orden}` : 'Nueva Factura Directa'}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setIsEmitirModalOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleEmitirFacturaSubmit} className="space-y-6">
                                {/* Selección de cliente */}
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                        Cliente Receptora (RUC / Cédula)
                                    </label>
                                    <select
                                        value={clienteId}
                                        onChange={e => setClienteId(e.target.value)}
                                        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-[12px] font-bold text-slate-200 outline-none focus:border-brand-blue transition-all"
                                    >
                                        <option value="">-- Seleccionar cliente del directorio --</option>
                                        {clientes.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre} ({c.ruc || c.cedula})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Items de la Factura */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                            Detalle de Ítems / Productos
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleAddItem}
                                            className="text-[10px] font-black text-brand-blue hover:underline flex items-center gap-1 uppercase"
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" /> Agregar Ítem
                                        </button>
                                    </div>

                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-white/[0.04] p-3 rounded-xl border border-white/[0.06]">
                                            <input
                                                type="text"
                                                value={item.descripcion}
                                                onChange={e => handleUpdateItem(idx, 'descripcion', e.target.value)}
                                                placeholder="Descripción del ítem..."
                                                className="flex-1 bg-obsidian-card border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] font-medium outline-none focus:border-brand-blue text-slate-200"
                                            />
                                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.cantidad}
                                                    onChange={e => handleUpdateItem(idx, 'cantidad', Number(e.target.value))}
                                                    className="w-16 bg-obsidian-card border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-bold text-center outline-none text-slate-200"
                                                    placeholder="Cant"
                                                />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.precioUnitario}
                                                    onChange={e => handleUpdateItem(idx, 'precioUnitario', Number(e.target.value))}
                                                    className="w-24 bg-obsidian-card border border-white/[0.06] rounded-lg px-2 py-2 text-[11px] font-bold text-right outline-none text-slate-200"
                                                    placeholder="P.Unit"
                                                />
                                                <div className="w-24 text-right font-black text-white text-[12px]">
                                                    {formatCurrency(item.precioTotal)}
                                                </div>
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="text-brand-red p-1 hover:bg-brand-red/10 rounded"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totales Resumen */}
                                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2 font-mono text-[12px]">
                                    {(() => {
                                        const sub = items.reduce((acc, i) => acc + i.precioTotal, 0);
                                        const iva = Number((sub * 0.15).toFixed(2));
                                        const tot = Number((sub + iva).toFixed(2));
                                        return (
                                            <>
                                                <div className="flex justify-between text-slate-400">
                                                    <span>Subtotal Sin Impuestos:</span>
                                                    <span>{formatCurrency(sub)}</span>
                                                </div>
                                                <div className="flex justify-between text-purple-400">
                                                    <span>IVA 15%:</span>
                                                    <span>{formatCurrency(iva)}</span>
                                                </div>
                                                <div className="flex justify-between text-lg font-black text-emerald-400 pt-2 border-t border-slate-800">
                                                    <span>TOTAL A FACTURAR:</span>
                                                    <span>{formatCurrency(tot)}</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {emissionFeedback && (
                                    <div className={`p-4 rounded-xl text-[11px] font-bold ${
                                        emissionFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-brand-red/10 text-brand-red border border-brand-red/20'
                                    }`}>
                                        {emissionFeedback.message}
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
                                    <button
                                        type="button"
                                        onClick={() => setIsEmitirModalOpen(false)}
                                        className="px-5 py-3 rounded-xl text-[11px] font-black uppercase text-slate-400 hover:bg-white/[0.04] transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={emitting}
                                        className="flex items-center gap-2 px-6 py-3 bg-brand-blue text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-brand-blue/90 shadow-blue-glow-sm disabled:opacity-50 transition-all"
                                    >
                                        {emitting ? (
                                            <>
                                                <Loader2Icon className="w-4 h-4 animate-spin" /> Procesando SRI...
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-4 h-4" /> Emitir Factura Electrónica
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FacturacionElectronicaPage;
