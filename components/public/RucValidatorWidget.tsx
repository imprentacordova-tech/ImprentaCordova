import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sriLookupService, SriRucData } from '../../services/sriLookupService';
import { generateWhatsAppLink } from '../../utils';
import { WhatsAppIcon, ShieldCheck, Search, CheckCircle, AlertTriangle, Sparkles, Building2, FileCheck2 } from '../Icons';

function reglasDeRegimen(regimenStr?: string) {
    const raw = (regimenStr || '').toUpperCase();
    if (raw.includes('POPULAR')) {
        return {
            nombre: 'RIMPE Negocio Popular',
            comprobante: 'Nota de Venta Simplificada',
            producto: 'Talonario de Notas de Venta (100 juegos)',
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            desc: 'Autorizado a emitir notas de venta sin desglose de IVA.'
        };
    }
    if (raw.includes('EMPRENDEDOR')) {
        return {
            nombre: 'RIMPE Emprendedor',
            comprobante: 'Facturas Físicas & Retenciones',
            producto: 'Talonario de Facturas Autorizadas (Original + Copias)',
            badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
            desc: 'Emite facturas con tarifa IVA correspondiente.'
        };
    }
    return {
        nombre: 'Régimen General',
        comprobante: 'Facturas Físicas Autorizadas',
        producto: 'Talonario de Facturas con Copia Autocopiativa',
        badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        desc: 'Sujeto pasivo con obligación de facturación y retención.'
    };
}

export const RucValidatorWidget: React.FC = () => {
    const [ruc, setRuc] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SriRucData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const clean = ruc.trim().replace(/\D/g, '');
        if (clean.length < 10) {
            setError('Ingresa un RUC de 13 dígitos o cédula de 10 dígitos.');
            setResult(null);
            return;
        }
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await sriLookupService.lookupByRuc(clean);
            if (data) {
                setResult(data);
            } else {
                setError('No encontramos ese número en el padrón local de El Oro. Escríbenos por WhatsApp y lo verificamos en el sistema central.');
            }
        } catch (err) {
            console.error(err);
            setError('No pudimos consultar el padrón en este momento. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const reglas = result ? reglasDeRegimen(result.regimen) : null;
    const activo = (result?.estado_contribuyente || '').toUpperCase().includes('ACTIVO');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden"
        >
            {/* Iluminación de fondo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 rounded-full blur-3xl pointer-events-none" />

            {/* Cabecera */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-800 relative z-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-heading font-bold text-base text-white">
                            Consulta Rápida de RUC
                        </h4>
                        <p className="text-[11px] text-slate-400">Padrón de Contribuyentes SRI · El Oro</p>
                    </div>
                </div>
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    SRI 001-001
                </span>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSearch} className="mt-5 flex gap-2 relative z-10">
                <div className="relative flex-1">
                    <input
                        value={ruc}
                        onChange={e => setRuc(e.target.value.replace(/\D/g, '').slice(0, 13))}
                        placeholder="Ej: 0701234567001 o cédula"
                        inputMode="numeric"
                        className="w-full pl-4 pr-10 py-3.5 bg-slate-800/80 border border-slate-700 rounded-xl font-mono text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                    />
                    {ruc && (
                        <button
                            type="button"
                            onClick={() => setRuc('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-400/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                    {loading ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                            <span>Buscando...</span>
                        </>
                    ) : (
                        <>
                            <Search className="w-3.5 h-3.5" />
                            <span>Validar</span>
                        </>
                    )}
                </motion.button>
            </form>

            {/* Mensaje de Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5"
                    >
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>{error}</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Resultado con Framer Motion */}
            <AnimatePresence>
                {result && reglas && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="mt-5 pt-5 border-t border-slate-800 space-y-3.5"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                                RUC: <strong className="text-white">{result.ruc}</strong>
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                activo ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                                {activo ? '✓ Contribuyente Activo' : '⚠ Inactivo'}
                            </span>
                        </div>

                        {/* Razón Social */}
                        <div className="bg-slate-800/90 p-3.5 rounded-xl border border-slate-700/80">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Razón Social / Nombre</span>
                            <span className="font-heading font-bold text-sm text-amber-300 block leading-tight">
                                {result.razon_social}
                            </span>
                        </div>

                        {/* Régimen Detectado */}
                        <div className={`p-3.5 rounded-xl border ${reglas.badgeColor} bg-opacity-20`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    {reglas.nombre}
                                </span>
                                <span className="text-[10px] font-mono text-slate-300">Recomendado</span>
                            </div>
                            <p className="text-[11px] text-slate-300 mt-1">
                                Comprobante Legal: <strong className="text-white">{reglas.comprobante}</strong>
                            </p>
                        </div>

                        {/* Botón Acción WhatsApp */}
                        <motion.a
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            href={generateWhatsAppLink('593993083943', `Hola Imprenta Córdova, acabo de validar mi RUC ${result.ruc} (${result.razon_social}) bajo el régimen ${reglas.nombre}. Deseo encargar la impresión de mis documentos autorizados.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                        >
                            <WhatsAppIcon className="w-4 h-4" />
                            <span>Imprimir Talonario para mi RUC</span>
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>

            {!result && !error && (
                <div className="mt-4 text-center py-2 text-[11px] text-slate-500">
                    💡 La consulta no consume saldo ni genera obligaciones tributarias.
                </div>
            )}
        </motion.div>
    );
};

export default RucValidatorWidget;
