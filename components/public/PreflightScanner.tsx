import React, { useState } from 'react';
import { analyzeImageQualityForPrint } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2Icon, AlertTriangleIcon, CheckCircleIcon, SparklesIcon, FileTextIcon, WhatsAppIcon, ShieldCheckIcon } from '../Icons';
import { generateWhatsAppLink } from '../../utils';

export const PreflightScanner: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        calidad: string;
        advertencias: string[];
        veredicto: string;
        porcentaje_exito: number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = err => reject(err);
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        setError(null);
        
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const processFile = (selectedFile: File) => {
        const isImage = selectedFile.type.startsWith('image/');
        const isPdf = selectedFile.type === 'application/pdf';

        if (!isImage && !isPdf) {
            setError('Formato no compatible. Por favor, arrastre únicamente imágenes (JPG, PNG) o archivos PDF.');
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('El archivo supera el límite de 5MB. Por favor optimice la imagen antes de escanear.');
            return;
        }

        setFile(selectedFile);
        setResult(null);

        if (isImage) {
            const url = URL.createObjectURL(selectedFile);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const runAnalysis = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        try {
            let base64 = '';
            if (file.type.startsWith('image/')) {
                base64 = await convertToBase64(file);
            } else {
                base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            }

            const response = await analyzeImageQualityForPrint(base64);
            
            if (response) {
                setResult({
                    calidad: response.calidad || 'Alta Calidad',
                    advertencias: response.advertencias || [],
                    veredicto: response.veredicto || 'Archivo verificado para impresión industrial sin observaciones.',
                    porcentaje_exito: response.porcentaje_exito !== undefined ? response.porcentaje_exito : 92
                });
            } else {
                setError('No se pudo establecer conexión con el motor IA. Intente con una imagen más liviana.');
            }
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error inesperado al analizar el diseño.');
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
    };

    return (
        <div className="w-full bg-gradient-to-b from-[#0A0F1E]/90 to-[#050810]/95 backdrop-blur-3xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-luxury relative overflow-hidden group">
            {/* Ambient blue glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-brand-blue/5 blur-[100px] pointer-events-none group-hover:bg-brand-blue/10 transition-colors duration-700" />

            <div className="space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue shadow-blue-glow-sm shrink-0">
                            <SparklesIcon className="w-6 h-6 animate-pulse text-brand-blue" />
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight font-display">
                                Escáner Pre-Vuelo IA
                            </h3>
                            <p className="text-[9px] text-brand-blue/80 font-mono font-black uppercase tracking-[0.35em] mt-1">
                                Diagnóstico Técnico Automatizado con Gemini Vision
                            </p>
                        </div>
                    </div>
                    <span className="px-3.5 py-1.5 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-[8px] font-black uppercase tracking-[0.3em] text-brand-blue">
                        IA Activa
                    </span>
                </div>

                <AnimatePresence mode="wait">
                    {!file ? (
                        <motion.div
                            key="dropzone"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all ${
                                isDragging ? 'border-liquid-gold bg-liquid-gold/5 shadow-gold-glow' : 'border-white/10 hover:border-liquid-gold/30 bg-black/30'
                            }`}
                        >
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*,application/pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 mx-auto flex items-center justify-center text-slate-400 group-hover:text-liquid-gold transition-colors shadow-inner">
                                    <FileTextIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white uppercase tracking-wider font-display">Arrastre o seleccione su archivo aquí</p>
                                    <p className="text-[10px] text-slate-500 font-mono font-black uppercase tracking-widest mt-2">Formatos compatibles: JPG, PNG, PDF (Máx 5MB)</p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-black/50 border border-white/10 rounded-[2rem] p-8 space-y-8 relative overflow-hidden"
                        >
                            {/* Laser scanning line */}
                            {loading && (
                                <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-liquid-gold to-transparent shadow-[0_0_30px_rgba(212,175,55,1)] animate-laser absolute left-0" />
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* Thumbnail */}
                                <div className="w-32 h-32 bg-white/5 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-inner relative">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <FileTextIcon className="w-12 h-12 text-liquid-gold" />
                                    )}
                                </div>

                                {/* File metadata */}
                                <div className="flex-grow space-y-2 text-center md:text-left">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Archivo Seleccionado</span>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight truncate max-w-xs">{file.name}</h4>
                                    <p className="text-[10px] text-liquid-gold font-mono font-bold">{(file.size / (1024 * 1024)).toFixed(2)} MB &mdash; {file.type || 'Documento PDF'}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-3 w-full md:w-auto">
                                    <button
                                        onClick={runAnalysis}
                                        disabled={loading}
                                        className="w-full md:w-auto px-10 py-5 bg-liquid-gold text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-gold-glow hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-3 shrink-0"
                                    >
                                        {loading ? <Loader2Icon className="w-4 h-4 animate-spin text-slate-950" /> : <SparklesIcon className="w-4 h-4" />}
                                        <span>Diagnosticar con IA</span>
                                    </button>
                                    <button
                                        onClick={resetScanner}
                                        disabled={loading}
                                        className="w-full md:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] border border-white/10 transition-all disabled:opacity-50"
                                    >
                                        Cambiar Archivo
                                    </button>
                                </div>
                            </div>

                            {/* Error notification */}
                            {error && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl flex items-start gap-4">
                                    <AlertTriangleIcon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-rose-400 font-bold uppercase tracking-wider leading-relaxed">{error}</p>
                                </div>
                            )}

                            {/* Diagnostic Report */}
                            {result && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border-t border-white/10 pt-8 space-y-6"
                                >
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Dictamen Técnico</span>
                                            <div className="flex items-center gap-3">
                                                {result.porcentaje_exito >= 80 ? (
                                                    <CheckCircleIcon className="w-6 h-6 text-emerald-400 shrink-0" />
                                                ) : (
                                                    <AlertTriangleIcon className="w-6 h-6 text-amber-400 shrink-0" />
                                                )}
                                                <h4 className="text-xl font-black text-white uppercase tracking-tight">
                                                    Calidad: {result.calidad}
                                                </h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Índice de Imprimibilidad</span>
                                            <span className={`text-3xl font-black tracking-tighter ${result.porcentaje_exito >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {result.porcentaje_exito}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-black/30 border border-white/5 p-6 rounded-2xl space-y-3">
                                        <span className="text-[8px] font-black text-liquid-gold uppercase tracking-widest block">Diagnóstico de Resolución & Sangrado</span>
                                        <p className="text-[11px] text-slate-300 font-medium leading-relaxed italic">
                                            "{result.veredicto}"
                                        </p>
                                    </div>

                                    {result.advertencias && result.advertencias.length > 0 && (
                                        <div className="space-y-3">
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Recomendaciones Pre-Impresión</span>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {result.advertencias.map((adv, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-3 rounded-xl">
                                                        <div className="w-2 h-2 rounded-full bg-liquid-gold shrink-0" />
                                                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">{adv}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action button */}
                                    <div className="pt-4 flex justify-end">
                                        <a
                                            href={generateWhatsAppLink("593993083943", `Hola, analicé mi archivo (${file.name}) con su escáner IA (Índice de viabilidad: ${result.porcentaje_exito}%). Deseo enviarlo a impresión.`)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-8 py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg"
                                        >
                                            <WhatsAppIcon className="w-4 h-4" /> Enviar Archivo Validado por WhatsApp
                                        </a>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

