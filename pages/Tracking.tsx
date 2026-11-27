import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trabajo, TrabajoEstado } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { supabase } from '../services/supabase';
import { mapDBTrabajo } from '../contexts/TrabajosContext';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import {
    WhatsAppIcon, Sparkles, Check, ArrowRight, Clock, Search,
    CheckCircle, AlertTriangle, Phone,
    Package, RefreshCw
} from '../components/Icons';

const WA_NUM = '593993083943';

const ESTADO_CONFIG: Record<TrabajoEstado, { label: string; badge: string; aura: string; desc: string }> = {
    [TrabajoEstado.PENDIENTE]: {
        label: 'Orden Recibida',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        aura: 'from-amber-400/20',
        desc: 'Tu trabajo está registrado y en cola para verificación técnica.'
    },
    [TrabajoEstado.EN_DISENO]: {
        label: 'En Diseño & Diagramación',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        aura: 'from-blue-500/20',
        desc: 'El diseñador está preparando el arte y la prueba digital.'
    },
    [TrabajoEstado.PROCESO]: {
        label: 'En Prensa Offset / Producción',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        aura: 'from-indigo-500/20',
        desc: 'En máquinas de impresión, numeración correlativa y secado.'
    },
    [TrabajoEstado.VITRINA]: {
        label: 'Listo para Retiro en Taller',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        aura: 'from-emerald-500/20',
        desc: '¡Tu pedido está terminado, empaquetado y listo para entregar!'
    },
    [TrabajoEstado.ENTREGADO]: {
        label: 'Entregado con Éxito',
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
        aura: 'from-slate-400/20',
        desc: 'Trabajo retirado y saldo liquidado a satisfacción.'
    },
};

const STAGES: { estado: TrabajoEstado; label: string; detail: string }[] = [
    { estado: TrabajoEstado.PENDIENTE, label: 'Orden registrada', detail: 'Ingreso al sistema e inspección de especificaciones.' },
    { estado: TrabajoEstado.EN_DISENO, label: 'Diseño & Prueba Digital', detail: 'Diagramación de artes y validación en padrón SRI.' },
    { estado: TrabajoEstado.PROCESO, label: 'En Prensa & Numeración', detail: 'Impresión offset / digital, foliado y encuadernación.' },
    { estado: TrabajoEstado.VITRINA, label: 'Guillotinado & Listo', detail: 'Corte de precisión, empaque protector y aviso al cliente.' },
    { estado: TrabajoEstado.ENTREGADO, label: 'Retirado / Despachado', detail: 'Entrega final y comprobante de liquidación.' },
];
const ORDER = STAGES.map(s => s.estado);

export const TrackingPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [foundJobs, setFoundJobs] = useState<Trabajo[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [aprobando, setAprobando] = useState(false);

    const currentJob = useMemo(() => foundJobs.find(j => j.id === selectedJobId) || foundJobs[0], [foundJobs, selectedJobId]);

    const doSearch = async (query: string) => {
        const clean = query.trim();
        if (!clean) return;
        const numeric = clean.replace(/[-\s]/g, '');
        setSearching(true);
        setError('');
        setFoundJobs([]);
        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
            const isOrderNum = /^\d+$/.test(numeric) && numeric.length < 10;

            if (isUUID) {
                const { data } = await supabase.from('trabajos').select('*').eq('id', clean);
                if (data?.length) { setFoundJobs(data.map(mapDBTrabajo)); setSelectedJobId(data[0].id); setSearching(false); return; }
            }
            if (isOrderNum || /ord/i.test(clean)) {
                const n = parseInt(numeric.replace(/\D/g, ''), 10);
                if (n) {
                    const { data } = await supabase.from('trabajos').select('*').eq('orden', n);
                    if (data?.length) { setFoundJobs(data.map(mapDBTrabajo)); setSelectedJobId(data[0].id); setSearching(false); return; }
                }
            }
            /*
             * Solo cédula/RUC EXACTOS. Antes también buscaba `nombre ILIKE %texto%`: escribir
             * "a" listaba las órdenes (titular y montos) de todos los clientes, y una coma o
             * un paréntesis rompía el filtro `.or()`.
             */
            if (isOrderNum) {
                setError(`No encontramos la orden N° ${numeric.replace(/\D/g, '')}. Revisá el número en tu mensaje de WhatsApp.`);
                return;
            }
            if (!/^\d{10,13}$/.test(numeric)) {
                setError('Ingresá tu número de orden o tu cédula/RUC completo (10 o 13 dígitos).');
                return;
            }
            const { data: clients } = await supabase.from('clientes').select('id')
                .or(`cedula.eq.${numeric},ruc.eq.${numeric}`);
            if (clients?.length) {
                const ids = clients.map(c => c.id);
                const { data: jobs } = await supabase.from('trabajos').select('*').in('cliente_id', ids).order('orden', { ascending: false });
                if (jobs?.length) { setFoundJobs(jobs.map(mapDBTrabajo)); setSelectedJobId(jobs[0].id); }
                else setError('No encontramos órdenes activas asociadas a esa identificación.');
            } else {
                setError('No encontramos ninguna orden con ese número o RUC. Revisa tu mensaje de WhatsApp.');
            }
        } catch (err) {
            console.error(err);
            setError('Hubo una intermitencia de conexión. Inténtalo de nuevo en unos momentos.');
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        // `orden` = links viejos de WhatsApp/QR.
        const q = searchParams.get('q') || searchParams.get('orden');
        if (q) { setSearchQuery(q); doSearch(q); }
         
    }, [searchParams]);

    const handleAprobarArte = async (trabajoId: string) => {
        if (!window.confirm('¿Confirmas que el diseño y la numeración están aprobados para entrar a prensa?')) return;
        setAprobando(true);
        try {
            const { error: dbError } = await supabase.from('trabajos').update({ arte_aprobado: true }).eq('id', trabajoId);
            if (dbError) throw dbError;
            setFoundJobs(prev => prev.map(j => j.id === trabajoId ? { ...j, arteAprobado: true, arte_aprobado: true } : j));
        } catch {
            alert('No se pudo registrar la aprobación en este momento.');
        } finally {
            setAprobando(false);
        }
    };

    const waLink = (msg: string) => `https://wa.me/${WA_NUM}?text=${encodeURIComponent(msg)}`;
    const stageIndex = currentJob ? ORDER.indexOf(currentJob.estado) : -1;
    const config = currentJob ? (ESTADO_CONFIG[currentJob.estado] || ESTADO_CONFIG[TrabajoEstado.PENDIENTE]) : null;

    return (
        <div className="bg-slate-50/70 min-h-screen text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950 flex flex-col justify-between">
            <SEO
                title="Rastrear Pedido en Tiempo Real · Imprenta Córdova"
                description="Consulta el estado de avance de tu orden de impresión con tu número de pedido o RUC. Actualización en tiempo real desde el taller."
            />
            <PublicNavbar />

            {/* Cabecera & Buscador */}
            <section className="bg-gradient-to-b from-blue-50/50 via-white to-slate-50/70 border-b border-slate-200/80 py-12 sm:py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumbs */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-3"
                    >
                        <a href="/" className="hover:text-brand-blue">Inicio</a>
                        <span>/</span>
                        <span className="text-slate-700">Rastrear Pedido</span>
                    </motion.div>

                    <div className="text-center sm:text-left">
                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-blue bg-blue-100/60 px-3 py-1 rounded-full border border-blue-200/70">
                            Transparencia de Producción
                        </span>
                        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mt-3">
                            ¿En qué fase se encuentra tu trabajo?
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-xl">
                            Ingresa el número de orden que te enviamos por WhatsApp (ej: ORD-4821) o tu RUC para conocer el estado exacto en prensa.
                        </p>

                        {/* Formulario de Búsqueda con Framer Motion */}
                        <form
                            onSubmit={e => { e.preventDefault(); doSearch(searchQuery); }}
                            className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl"
                        >
                            <div className="relative flex-1">
                                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Ej: ORD-4821 o 0701234567001"
                                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue shadow-sm"
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={searching}
                                className="px-7 py-3.5 bg-brand-blue hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md shadow-brand-blue/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {searching ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        <span>Consultando...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Consultar Estado</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl max-w-xl flex items-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.p>
                        )}
                    </div>
                </div>
            </section>

            {/* Contenido Principal de Resultados */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1 w-full">
                {!currentJob ? (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center max-w-2xl mx-auto shadow-sm"
                    >
                        <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-brand-blue mx-auto mb-4">
                            <Package className="w-8 h-8" />
                        </div>
                        <h3 className="font-heading font-bold text-xl text-slate-900">
                            Consulta tu Orden de Trabajo
                        </h3>
                        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                            Escribe en el buscador tu número de orden (como figura en tu recibo de abono) o tu identificación para ver el progreso en vivo.
                        </p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentJob.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="space-y-8"
                        >
                            {/* Selector de pedidos si hay varios */}
                            {foundJobs.length > 1 && (
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 overflow-x-auto">
                                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap pl-1">
                                        Tus pedidos ({foundJobs.length}):
                                    </span>
                                    {foundJobs.map(j => {
                                        const isSelected = j.id === currentJob.id;
                                        return (
                                            <button
                                                key={j.id}
                                                onClick={() => setSelectedJobId(j.id)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-brand-blue text-white shadow-sm'
                                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                <span>ORD-{String(j.orden).padStart(4, '0')}</span>
                                                <span className="text-[10px] opacity-75">· {j.tipo}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Hero Card del Pedido Actual */}
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                                {/* Cabecera de la Orden */}
                                <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-amber-400 font-extrabold text-lg sm:text-xl">
                                                ORD-{String(currentJob.orden).padStart(4, '0')}
                                            </span>
                                            <span className="text-xs text-slate-400">· Recibido el {formatDate(currentJob.fechaEntrada)}</span>
                                        </div>
                                        <h2 className="font-heading font-extrabold text-2xl text-white mt-1">
                                            {currentJob.titular}
                                        </h2>
                                        <p className="text-xs text-blue-200 mt-1">
                                            {currentJob.tipo} {currentJob.subtipo ? `· ${currentJob.subtipo}` : ''} ({currentJob.cantidad} unidades/juegos)
                                        </p>
                                    </div>

                                    {/* Badge de Estado */}
                                    {config && (
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${config.badge}`}>
                                                {config.label}
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                {config.desc}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Alerta de Aprobación de Arte si aplica */}
                                {currentJob.estado === TrabajoEstado.EN_DISENO && !currentJob.arteAprobado && (
                                    <div className="p-5 bg-amber-500/10 border-b border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-xs sm:text-sm text-amber-900">
                                                    Tu prueba digital está lista para aprobación
                                                </h4>
                                                <p className="text-xs text-amber-700 mt-0.5">
                                                    Revisa que los textos, numeraciones y RUC estén correctos para enviar a prensa.
                                                </p>
                                            </div>
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleAprobarArte(currentJob.id)}
                                            disabled={aprobando}
                                            className="w-full sm:w-auto px-5 py-2.5 bg-brand-blue hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                        >
                                            <Check className="w-4 h-4 text-emerald-400" />
                                            <span>{aprobando ? 'Aprobando...' : 'Aprobar Diseño para Impresión'}</span>
                                        </motion.button>
                                    </div>
                                )}

                                {currentJob.arteAprobado && (
                                    <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-xs font-bold text-emerald-800">
                                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        <span>Arte digital verificado y aprobado por el cliente.</span>
                                    </div>
                                )}

                                {/* Stepper de Etapas con Framer Motion */}
                                <div className="p-6 sm:p-8">
                                    <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-slate-400 mb-6">
                                        Línea de Producción en Vivo
                                    </h3>

                                    <div className="space-y-6">
                                        {STAGES.map((s, idx) => {
                                            const isDone = idx < stageIndex;
                                            const isCurrent = idx === stageIndex;

                                            return (
                                                <div key={s.estado} className="flex items-start gap-4 sm:gap-6 relative">
                                                    {/* Línea conectora */}
                                                    {idx < STAGES.length - 1 && (
                                                        <div className={`absolute left-4 top-8 -bottom-6 w-0.5 ${
                                                            isDone ? 'bg-brand-blue' : 'bg-slate-200'
                                                        }`} />
                                                    )}

                                                    {/* Punto indicador */}
                                                    <div className="relative z-10 flex-shrink-0">
                                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                                            isDone
                                                                ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/30'
                                                                : isCurrent
                                                                ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 font-extrabold'
                                                                : 'bg-white border-2 border-slate-300 text-slate-400'
                                                        }`}>
                                                            {isDone ? '✓' : idx + 1}
                                                        </span>
                                                    </div>

                                                    {/* Detalles de la etapa */}
                                                    <div className="flex-1 pb-2">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className={`text-sm sm:text-base font-bold ${
                                                                isDone ? 'text-slate-900' : isCurrent ? 'text-brand-blue font-extrabold' : 'text-slate-400'
                                                            }`}>
                                                                {s.label}
                                                            </h4>
                                                            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                                                isCurrent ? 'bg-amber-100 text-amber-800' : isDone ? 'text-emerald-700' : 'text-slate-400'
                                                            }`}>
                                                                {isCurrent ? 'En Proceso' : isDone ? 'Completado' : 'Pendiente'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                            {s.detail}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Bento Financiero & Resumen de Liquidación */}
                                <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Total */}
                                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                            <span className="text-[11px] font-mono uppercase font-bold text-slate-400 block">Total del Trabajo</span>
                                            <span className="font-heading font-extrabold text-xl text-slate-900 mt-1 block">
                                                {formatCurrency(currentJob.total)}
                                            </span>
                                        </div>

                                        {/* Abono Recibido */}
                                        <div className="bg-white p-4 rounded-2xl border border-slate-200">
                                            <span className="text-[11px] font-mono uppercase font-bold text-slate-400 block">Abono Recibido</span>
                                            <span className="font-heading font-extrabold text-xl text-emerald-600 mt-1 block">
                                                {formatCurrency(currentJob.abono)}
                                            </span>
                                        </div>

                                        {/* Saldo Pendiente */}
                                        <div className={`p-4 rounded-2xl border ${
                                            currentJob.saldo > 0
                                                ? 'bg-amber-500/10 border-amber-500/30'
                                                : 'bg-emerald-500/10 border-emerald-500/30'
                                        }`}>
                                            <span className="text-[11px] font-mono uppercase font-bold text-slate-600 block">Saldo al Retirar</span>
                                            <span className={`font-heading font-extrabold text-2xl mt-1 block ${
                                                currentJob.saldo > 0 ? 'text-brand-blue' : 'text-emerald-700'
                                            }`}>
                                                {formatCurrency(currentJob.saldo)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Acciones de WhatsApp y Retiro */}
                                    <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span>Te avisamos por WhatsApp cuando el trabajo esté empaquetado.</span>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <a
                                                href={waLink(`Hola Imprenta Córdova, deseo consultar sobre mi orden ORD-${String(currentJob.orden).padStart(4, '0')} (${currentJob.titular}).`)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all"
                                            >
                                                <WhatsAppIcon className="w-4 h-4" />
                                                <span>Consultar por WhatsApp</span>
                                            </a>
                                            <a
                                                href="tel:+593993083943"
                                                className="inline-flex items-center justify-center p-2.5 bg-white border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 transition-all"
                                                aria-label="Llamar"
                                            >
                                                <Phone className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                        <img src="/LOGO.png" alt="Imprenta Córdova" width={225} height={225} loading="lazy" className="h-7 w-auto" />
                        <span>© 2026 Imprenta Córdova · SRI 001-001 · Machala</span>
                    </div>
                    <div className="flex gap-4 font-semibold">
                        <a href="/" className="hover:text-brand-blue">Inicio</a>
                        <a href="/vitrina" className="hover:text-brand-blue">Catálogo</a>
                        <a href="tel:+593993083943" className="hover:text-brand-blue">+593 99 308 3943</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TrackingPage;
