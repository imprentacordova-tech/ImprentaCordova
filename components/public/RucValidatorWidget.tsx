import React, { useState } from 'react';
import { sriLookupService, SriRucData } from '../../services/sriLookupService';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheckIcon, AlertTriangleIcon, Loader2Icon, WhatsAppIcon, CheckCircleIcon, FileTextIcon } from '../Icons';
import { generateWhatsAppLink } from '../../utils';

export const RucValidatorWidget: React.FC = () => {
    const [ruc, setRuc] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SriRucData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanRuc = ruc.trim().replace(/\D/g, '');
        
        if (cleanRuc.length < 13) {
            setError('El RUC debe contener exactamente 13 dígitos numéricos.');
            setResult(null);
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Latencia táctica simulada para feedback del motor
            await new Promise(resolve => setTimeout(resolve, 800));
            const data = await sriLookupService.lookupByRuc(cleanRuc);
            
            if (data) {
                setResult(data);
            } else {
                setError('RUC no localizado en el padrón local de El Oro. Ingrese sus datos o consulte directamente por WhatsApp.');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión al consultar el padrón. Por favor intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const getRegimenRules = (regimenStr?: string) => {
        const raw = (regimenStr || '').toUpperCase();
        if (raw.includes('POPULAR') || raw.includes('RIMPE-NEGOCIO POPULAR')) {
            return {
                name: 'RIMPE - NEGOCIO POPULAR',
                allowed: 'Notas de Venta Físicas Aprobadas por SRI (Simplificadas).',
                prohibited: 'No emite Facturas con desglose de IVA salvo casos especiales.',
                badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-emerald-glow-sm',
                recommendedProduct: 'Talonario de Notas de Venta (100 Hojas autocopiativas)'
            };
        } else if (raw.includes('EMPRENDEDOR')) {
            return {
                name: 'RIMPE - EMPRENDEDOR',
                allowed: 'Facturas Físicas Autorizadas (Máx. 25 comprobantes según normativa).',
                prohibited: 'Prohibido emitir Notas de Venta de Régimen Popular.',
                badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25 shadow-blue-glow-sm',
                recommendedProduct: 'Talonarios de Factura Autorizada SRI'
            };
        }
        return {
            name: 'RÉGIMEN GENERAL',
            allowed: 'Facturas Físicas Autorizadas SRI (Comprobante Fiscal Completo).',
            prohibited: 'Prohibido uso de impresos de Negocio Popular.',
            badgeColor: 'bg-amber-500/10 text-liquid-gold border-liquid-gold/30 shadow-gold-glow-soft',
            recommendedProduct: 'Talonarios de Facturas con Copia Autocopiativa'
        };
    };

    const rules = result ? getRegimenRules(result.regimen) : null;

    return (
        <div className="w-full bg-gradient-to-b from-[#0A0F1E]/90 to-[#050810]/95 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-luxury relative overflow-hidden group">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/5 blur-[100px] pointer-events-none group-hover:bg-liquid-gold/10 transition-colors duration-700" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-blue/5 blur-[100px] pointer-events-none" />

            <div className="space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center text-liquid-gold shadow-gold-glow shrink-0">
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight font-display">
                                Consulter de Régimen SRI
                            </h3>
                            <p className="text-[9px] text-liquid-gold/70 font-mono font-black uppercase tracking-[0.35em] mt-1">
                                Padrón Tributario Machala · El Oro · Ecuador
                            </p>
                        </div>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">
                        SRI Verificado 2026
                    </span>
                </div>

                {/* Form */}
                <form onSubmit={handleSearch} className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">
                        Ingrese Número de RUC Contribuyente (13 dígitos)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                maxLength={13}
                                value={ruc}
                                onChange={e => setRuc(e.target.value.replace(/\D/g, ''))}
                                placeholder="Ej. 0702065319001"
                                className="w-full bg-black/50 border border-white/10 focus:border-liquid-gold/60 rounded-2xl px-6 py-5 text-white font-mono font-bold text-lg outline-none focus:ring-4 focus:ring-liquid-gold/10 transition-all placeholder:text-slate-600 shadow-inner"
                            />
                            {ruc.length === 13 && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                                    13 DÍGITOS
                                </span>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading || ruc.length < 13}
                            className="px-10 py-5 bg-liquid-gold text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-gold-glow hover:bg-white transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3 shrink-0"
                        >
                            {loading ? (
                                <>
                                    <Loader2Icon className="w-4 h-4 animate-spin text-slate-950" />
                                    <span>Verificando...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheckIcon className="w-4 h-4" />
                                    <span>Validar Régimen</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Response / Error */}
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl flex items-start gap-4"
                        >
                            <AlertTriangleIcon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <h5 className="text-xs font-black text-rose-300 uppercase tracking-wider mb-1">Aviso de Búsqueda</h5>
                                <p className="text-[11px] text-rose-400/90 font-medium leading-relaxed">{error}</p>
                            </div>
                        </motion.div>
                    )}

                    {result && rules && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/[0.02] border border-white/10 p-8 rounded-[2rem] space-y-6"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Razón Social Contribuyente</span>
                                    <h4 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight font-display">{result.razon_social}</h4>
                                    <p className="text-xs font-mono text-liquid-gold/80">RUC: {result.ruc}</p>
                                </div>
                                <span className={`px-5 py-2.5 border rounded-2xl text-[10px] font-black uppercase tracking-widest ${rules.badgeColor}`}>
                                    {rules.name}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2 p-5 bg-black/40 rounded-2xl border border-emerald-500/20">
                                    <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                                        <CheckCircleIcon className="w-4 h-4 shrink-0" />
                                        <span>Documentos Permitidos</span>
                                    </div>
                                    <p className="text-xs text-slate-200 font-medium leading-relaxed">{rules.allowed}</p>
                                </div>

                                <div className="space-y-2 p-5 bg-black/40 rounded-2xl border border-rose-500/20">
                                    <div className="flex items-center gap-2 text-rose-400 text-[9px] font-black uppercase tracking-widest">
                                        <AlertTriangleIcon className="w-4 h-4 shrink-0" />
                                        <span>Restricciones Normativas</span>
                                    </div>
                                    <p className="text-xs text-slate-300 font-medium leading-relaxed">{rules.prohibited}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-white/5">
                                <div className="text-left space-y-1">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Ubicación y Actividad Registrada</span>
                                    <p className="text-[10px] text-slate-300 font-bold uppercase leading-tight truncate max-w-md">
                                        {result.canton} / {result.parroquia} &mdash; {result.actividad_economica}
                                    </p>
                                </div>

                                <a
                                    href={generateWhatsAppLink("593993083943", `Hola, validé mi RUC (${result.ruc}) como ${rules.name} en su sitio web. Deseo cotizar ${rules.recommendedProduct}.`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg"
                                >
                                    <WhatsAppIcon className="w-4 h-4" /> Cotizar Talonario SRI
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

