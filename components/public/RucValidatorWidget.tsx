import React, { useState } from 'react';
import { sriLookupService, SriRucData } from '../../services/sriLookupService';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheckIcon, AlertTriangleIcon, Loader2Icon, WhatsAppIcon } from '../Icons';
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
            // Simulamos pequeña latencia táctica para que se sienta el procesamiento del motor
            await new Promise(resolve => setTimeout(resolve, 1000));
            const data = await sriLookupService.lookupByRuc(cleanRuc);
            
            if (data) {
                setResult(data);
            } else {
                setError('RUC no encontrado en el padrón local de El Oro. Ingrese sus datos manualmente o consulte por WhatsApp.');
            }
        } catch (err) {
            console.error(err);
            setError('Error al consultar el registro. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const getRegimenRules = (regimenStr?: string) => {
        const raw = (regimenStr || '').toUpperCase();
        if (raw.includes('POPULAR') || raw.includes('RIMPE-NEGOCIO POPULAR')) {
            return {
                name: 'RIMPE - NEGOCIO POPULAR',
                allowed: 'Autorizado para impresión de Notas de Venta físicas (Simplificadas).',
                prohibited: 'No emite facturas de forma habitual.',
                badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            };
        } else if (raw.includes('EMPRENDEDOR')) {
            return {
                name: 'RIMPE - EMPRENDEDOR',
                allowed: 'Autorizado para Facturas físicas (Límite: 25 comprobantes anuales por reglamento).',
                prohibited: 'PROHIBIDO imprimir Notas de Venta.',
                badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            };
        }
        return {
            name: 'RÉGIMEN GENERAL',
            allowed: 'Autorizado para Facturas físicas (Límite: 25 comprobantes anuales por reglamento).',
            prohibited: 'PROHIBIDO imprimir Notas de Venta.',
            badgeColor: 'bg-amber-500/10 text-liquid-gold border-liquid-gold/20'
        };
    };

    const rules = result ? getRegimenRules(result.regimen) : null;

    return (
        <div className="w-full max-w-3xl mx-auto bg-white/5 backdrop-blur-xl border border-white/5 p-8 md:p-12 rounded-[2.5rem] shadow-luxury relative overflow-hidden group">
            {/* Ambient gold glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-liquid-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-liquid-gold/10 transition-colors duration-500" />
            
            <div className="space-y-8 relative z-10">
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                    <div className="w-12 h-12 rounded-xl bg-liquid-gold/10 border border-liquid-gold/20 flex items-center justify-center text-liquid-gold shadow-gold-glow">
                        <ShieldCheckIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight italic">Validador de Régimen SRI</h3>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Padron Local Prov. El Oro</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Número de RUC Contribuyente</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            maxLength={13}
                            value={ruc}
                            onChange={e => setRuc(e.target.value.replace(/\D/g, ''))}
                            placeholder="Ej. 0702065319001"
                            className="flex-1 bg-black/40 border border-white/10 focus:border-liquid-gold/40 rounded-2xl px-6 py-5 text-white font-mono font-bold text-lg outline-none focus:ring-4 focus:ring-liquid-gold/5 transition-all placeholder:text-slate-600 shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={loading || !ruc}
                            className="px-10 py-5 bg-liquid-gold text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-gold-glow hover:bg-white transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3 shrink-0"
                        >
                            {loading ? (
                                <>
                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                'Validar Régimen'
                            )}
                        </button>
                    </div>
                </form>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-brand-red/10 border border-brand-red/20 p-6 rounded-2xl flex items-start gap-4"
                        >
                            <AlertTriangleIcon className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                            <p className="text-[11px] text-red-400 font-bold uppercase tracking-wider leading-relaxed">{error}</p>
                        </motion.div>
                    )}

                    {result && rules && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] space-y-6"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                                <div className="space-y-1">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Razón Social</span>
                                    <h4 className="text-xl font-black text-white uppercase tracking-tight">{result.razon_social}</h4>
                                </div>
                                <span className={`px-4 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${rules.badgeColor}`}>
                                    {rules.name}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] text-slate-300 font-bold uppercase tracking-wider leading-relaxed">
                                <div className="space-y-2 p-4 bg-black/25 rounded-2xl border border-white/5">
                                    <span className="text-[8px] font-black text-emerald-400 tracking-widest block">✔️ DOCUMENTOS PERMITIDOS</span>
                                    <p className="text-white">{rules.allowed}</p>
                                </div>
                                <div className="space-y-2 p-4 bg-black/25 rounded-2xl border border-white/5">
                                    <span className="text-[8px] font-black text-rose-400 tracking-widest block">❌ RESTRICCIONES</span>
                                    <p className="text-white/80">{rules.prohibited}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-white/5">
                                <div className="text-left">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Ubicación y Actividad</span>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight truncate max-w-sm">
                                        {result.canton} / {result.parroquia} &mdash; {result.actividad_economica}
                                    </p>
                                </div>

                                <a
                                    href={generateWhatsAppLink("593993083943", `Hola, validé mi RUC (${result.ruc}) como ${rules.name} en su web. Deseo cotizar la impresión de mis documentos.`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg"
                                >
                                    <WhatsAppIcon className="w-4 h-4" /> Cotizar Talonario
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
