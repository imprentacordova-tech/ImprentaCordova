
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trabajo, TrabajoEstado } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { 
    SearchIcon, ClockIcon, 
    PrinterIcon, PaletteIcon, BoxIcon, MessageCircleIcon, MapPinIcon, 
    Loader2Icon, EyeIcon, CheckBadgeIcon,
    MicIcon, XIcon, ArrowRightIcon, BoltIcon, ActivityIcon, CpuIcon, GlobeAltIcon,
    LayersIcon, CreditCardIcon, ShieldCheckIcon, TerminalIcon, ZapIcon, HashIcon,
    SparklesIcon, QrCodeIcon, HeadphonesIcon
} from '../components/Icons';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';
import Navbar from '../components/Navbar';

// --- UTILS PARA LIVE API ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) { bytes[i] = binaryString.charCodeAt(i); }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) { channelData[i] = dataInt16[i * numChannels + channel] / 32768.0; }
  }
  return buffer;
}

const statusSteps = [
    { label: 'Ingreso',   value: TrabajoEstado.PENDIENTE,  icon: ClockIcon         },
    { label: 'Diseño',    value: TrabajoEstado.EN_DISENO,  icon: PaletteIcon       },
    { label: 'Producción', value: TrabajoEstado.PROCESO,   icon: PrinterIcon       },
    { label: 'Vitrina',   value: TrabajoEstado.VITRINA,   icon: CheckBadgeIcon    },
    { label: 'Entrega',   value: TrabajoEstado.ENTREGADO,  icon: BoxIcon           },
];

const TrackingPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [foundJobs, setFoundJobs] = useState<Trabajo[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('En espera...');
    const [liveSession, setLiveSession] = useState<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const micStreamRef = useRef<MediaStream | null>(null);

    const [terminalLogs, setTerminalLogs] = useState<{ time: string, msg: string, type: string }[]>([]);

    const currentJob = useMemo(() => foundJobs.find(j => j.id === selectedJobId) || foundJobs[0], [foundJobs, selectedJobId]);

    const parsedSpecs = useMemo(() => {
        if (!currentJob?.detalle) return null;
        const parts = currentJob.detalle.split('| SPECS: ');
        if (parts.length > 1) {
            try { return JSON.parse(parts[1]); } catch (e) { return null; }
        }
        return null;
    }, [currentJob]);

    const cleanDetalle = useMemo(() => {
        if (!currentJob?.detalle) return '';
        return currentJob.detalle.split('| SPECS: ')[0].trim();
    }, [currentJob]);

    useEffect(() => {
        if (currentJob) {
            const logs = (currentJob.historial || []).map(log => ({
                time: new Date(log.fecha).toLocaleTimeString().slice(0, 5),
                msg: `${log.estado.toUpperCase()} POR ${log.usuario.toUpperCase()}`,
                type: 'process'
            }));
            setTerminalLogs([
                { time: 'LINK', msg: 'CONEXIÓN SEGURA ESTABLECIDA', type: 'system' },
                { time: 'AUTH', msg: `ORDEN #${currentJob.orden} VERIFICADA`, type: 'security' },
                ...logs
            ]);
        }
    }, [selectedJobId, currentJob]);

    useEffect(() => {
        const q = searchParams.get('q');
        if (q) {
            setSearchQuery(q);
            handleSearchLogic(q);
        }
    }, [searchParams]);

    const handleSearchLogic = async (query: string) => {
        const cleanQuery = query.trim();
        if (!cleanQuery) return;
        
        // Limpiar para búsqueda de cédula/RUC (quitar guiones y espacios)
        const numericQuery = cleanQuery.replace(/[-\s]/g, '');
        
        setSearching(true);
        setError('');
        setFoundJobs([]);
        
        try {
            // 1. Intentar búsqueda por ID exacto (UUID) o Número de Orden
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);
            const isOrderNum = /^\d+$/.test(cleanQuery);

            if (isUUID) {
                const { data } = await supabase.from('trabajos').select('*').eq('id', cleanQuery);
                if (data && data.length > 0) {
                    setFoundJobs(data as any);
                    setSelectedJobId(data[0].id);
                    setSearching(false);
                    return;
                }
            }

            if (isOrderNum) {
                const { data } = await supabase.from('trabajos').select('*').eq('orden', parseInt(cleanQuery));
                if (data && data.length > 0) {
                    setFoundJobs(data as any);
                    setSelectedJobId(data[0].id);
                    setSearching(false);
                    return;
                }
            }

            // 2. Búsqueda por Cliente (Nombre, Cédula o RUC)
            const { data: matchedClients } = await supabase
                .from('clientes')
                .select('id')
                .or(`nombre.ilike.%${cleanQuery}%,cedula.eq.${numericQuery},ruc.eq.${numericQuery}`);

            if (matchedClients && matchedClients.length > 0) {
                const clientIds = matchedClients.map(c => c.id);
                const { data: clientJobs } = await supabase
                    .from('trabajos')
                    .select('*')
                    .in('cliente_id', clientIds)
                    .order('orden', { ascending: false });

                if (clientJobs && clientJobs.length > 0) {
                    setFoundJobs(clientJobs as any);
                    setSelectedJobId(clientJobs[0].id);
                } else {
                    setError('NO SE ENCONTRARON TRABAJOS PARA ESTE CLIENTE');
                }
            } else {
                setError('VÍNCULO O IDENTIFICACIÓN NO ENCONTRADA');
            }
        } catch (err) { 
            console.error(err);
            setError('FALLO EN LA CONEXIÓN CON EL SATÉLITE'); 
        } finally { 
            setSearching(false); 
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearchLogic(searchQuery);
    };

    const handleAprobarArte = async (trabajoId: string) => {
        if (!window.confirm("¿Confirma que el diseño es correcto para impresión?")) return;
        try {
            const { error } = await supabase.from('trabajos').update({ arte_aprobado: true }).eq('id', trabajoId);
            if (error) throw error;
            setFoundJobs(prev => prev.map(j => j.id === trabajoId ? { ...j, arteAprobado: true } : j));
        } catch (e) { alert("Error al aprobar."); }
    };

    const handleGeneratePaymentLink = (job: Trabajo) => {
        const message = `*ORDEN #${job.orden}*\nSaldo: ${formatCurrency(job.saldo)}\n\n*DATOS BANCARIOS:*\n🏦 Banco Pichincha\n💳 Cta: 123456789\n👤 Imprenta Córdova`;
        window.open(`https://wa.me/593993083943?text=${encodeURIComponent(message)}`, '_blank');
    };

    const startVoiceTracking = async () => {
        if (!foundJobs.length) return;
        setIsVoiceActive(true);
        setVoiceStatus("Vinculando...");
        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = outputCtx;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;
            const jobContext = foundJobs.map(j => `Orden #${j.orden}: ${j.subtipo}, estado: ${j.estado}`).join('; ');
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.0-flash-exp',
                callbacks: {
                    onopen: () => {
                        setVoiceStatus("Escuchando...");
                        const source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) { int16[i] = inputData[i] * 32768; }
                            const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64 = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        }
                    },
                    onclose: () => stopVoiceTracking(),
                    onerror: (e: any) => { console.error('[Voice] Error:', e); stopVoiceTracking(); }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: { parts: [{ text: `Asistente de Imprenta Córdova. Contexto: ${jobContext}. Sé breve, profesional y elegante.` }] }
                }
            });
            setLiveSession(await sessionPromise);
        } catch (e) { stopVoiceTracking(); }
    };

    const stopVoiceTracking = () => {
        setIsVoiceActive(false);
        micStreamRef.current?.getTracks().forEach(t => t.stop());
        liveSession?.close();
    };

    return (
        <div className="min-h-screen bg-brand-dark text-white font-sans selection:bg-gold-bright selection:text-brand-dark overflow-x-hidden flex flex-col relative">
            <SEO title="Rastreo Elite | Imprenta Córdova" description="Seguimiento de alta precisión para sus proyectos de impresión." />
            <Navbar />

            {/* Cinematic Background Layer */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-brand-dark">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gold-bright/5 rounded-full blur-[120px] opacity-60" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-dark rounded-full blur-[100px] opacity-40" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
            </div>

            <div className="relative z-10 flex-1 flex flex-col pt-32 p-4 lg:p-8 gap-8 max-w-[1600px] mx-auto w-full">
                
                {/* Header Section */}
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold-bright/5 border border-gold-bright/10 rounded-full">
                        <span className="w-1.5 h-1.5 bg-gold-bright rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-bright">SISTEMA DE TELEMETRÍA INDUSTRIAL</span>
                    </motion.div>
                    <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-white uppercase italic">
                        Control de <span className="text-gold-gradient">Producción</span>
                    </h1>
                </div>

                {/* Search Bar HUD */}
                <div className="flex flex-col items-center justify-center gap-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 lg:px-8 py-4 lg:py-5 rounded-[2rem] lg:rounded-[2.5rem] focus-within:border-gold-bright focus-within:ring-4 focus-within:ring-gold-bright/5 transition-all group w-full max-w-3xl shadow-2xl backdrop-blur-xl">
                        <SearchIcon className={`w-5 h-5 lg:w-6 h-6 ${searching ? 'text-gold-bright animate-spin' : 'text-slate-400'}`} />
                        <input 
                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="N° Orden, Cédula o RUC..."
                            className="bg-transparent border-none p-0 text-xs lg:text-sm font-bold text-white placeholder:text-slate-600 focus:ring-0 uppercase tracking-widest w-full"
                        />
                        <button type="submit" className="bg-gold-bright text-brand-dark px-4 lg:px-6 py-2 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors">Vincular</button>
                    </form>
                    
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[#e11d48] text-[10px] font-black uppercase tracking-widest bg-red-50 px-4 py-2 rounded-full border border-red-100">
                            {error}
                        </motion.div>
                    )}
                </div>

                {/* Multiple Results Selector (If many jobs found) */}
                <AnimatePresence>
                    {foundJobs.length > 1 && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="max-w-3xl mx-auto w-full bg-white/[0.03] p-4 rounded-3xl border border-white/5 flex gap-3 overflow-x-auto no-scrollbar backdrop-blur-md"
                        >
                            {foundJobs.map(job => (
                                <button
                                    key={job.id}
                                    onClick={() => setSelectedJobId(job.id)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedJobId === job.id ? 'bg-gold-bright text-brand-dark shadow-lg shadow-gold-bright/20' : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'}`}
                                >
                                    Orden #{job.orden}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
                    {/* Main Console Hub */}
                    <div className="flex-1 flex flex-col gap-8">
                        {currentJob ? (
                            <div className="grid grid-cols-12 gap-8">
                                {/* Visual Asset Console */}
                                <div className="col-span-12 lg:col-span-7 bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden flex flex-col group shadow-2xl relative backdrop-blur-3xl">
                                    <div className="absolute top-8 left-8 flex items-center gap-4 z-20">
                                        <div className="bg-gold-bright px-4 py-2 rounded-xl text-brand-dark shadow-lg">
                                            <span className="text-[10px] font-black tracking-widest uppercase italic">ORDEN: {String(currentJob.orden).padStart(6, '0')}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center p-12 bg-black/20 min-h-[400px] relative overflow-hidden">
                                        <div className="absolute inset-0 animate-scan-y bg-gradient-to-b from-transparent via-gold-bright/10 to-transparent h-20 -top-20 z-20 pointer-events-none" />
                                        <AnimatePresence mode="wait">
                                            {currentJob.fotoOriginalUrl ? (
                                                <motion.div key={currentJob.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                                                    <img src={currentJob.fotoOriginalUrl} className="max-h-[50vh] object-contain rounded-2xl shadow-2xl relative z-10 border-8 border-white/5 grayscale hover:grayscale-0 transition-all duration-700" alt="Blueprint" />
                                                    <div className="absolute inset-0 bg-gold-bright/10 blur-3xl -z-10" />
                                                </motion.div>
                                            ) : (
                                                <div className="text-center space-y-4 opacity-10">
                                                    <div className="w-24 h-24 border-2 border-dashed border-white/20 rounded-full mx-auto flex items-center justify-center">
                                                        <BoxIcon className="w-10 h-10 text-white" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Esperando Archivos...</p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Action Deck */}
                                    <div className="p-8 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar w-full sm:w-auto pb-4 sm:pb-0">
                                            {statusSteps.map((step, idx) => {
                                                const stepIdx = statusSteps.findIndex(s => s.value === currentJob?.estado);
                                                const isCompleted = idx <= stepIdx;
                                                const isCurrent = currentJob?.estado === step.value;
                                                return (
                                                    <div key={step.value} className="flex flex-col items-center gap-2 shrink-0">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${isCurrent ? 'bg-gold-bright border-gold-bright text-brand-dark shadow-xl shadow-gold-bright/20 scale-110' : isCompleted ? 'bg-gold-bright/10 border-gold-bright/20 text-gold-bright' : 'bg-transparent border-white/5 text-slate-600'}`}>
                                                            <step.icon className="w-5 h-5" />
                                                        </div>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${isCurrent ? 'text-gold-bright' : 'text-slate-600'}`}>{step.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-4 w-full sm:w-auto">
                                            {currentJob.estado === TrabajoEstado.EN_DISENO && !currentJob.arteAprobado && (
                                                <motion.button 
                                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleAprobarArte(currentJob.id)}
                                                    className="flex-1 sm:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 italic"
                                                >
                                                    Aprobar Manifiesto
                                                </motion.button>
                                            )}
                                            {currentJob.saldo > 0 && (
                                                <motion.button 
                                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleGeneratePaymentLink(currentJob)}
                                                    className="flex-1 sm:flex-none bg-gold-bright text-brand-dark px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gold-bright/20 italic"
                                                >
                                                    Liquidar Saldo
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Manifest & Terminal Console */}
                                <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
                                    {/* Product Manifest */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-8 shadow-xl flex flex-col gap-6 backdrop-blur-3xl">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-black text-gold-bright uppercase tracking-widest italic">Manifiesto Técnico</span>
                                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{currentJob.subtipo}</h3>
                                            </div>
                                            <div className="bg-white/5 px-3 py-1 rounded-full text-[8px] font-mono text-slate-500 font-bold uppercase tracking-widest">Protocolo v2.4</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-white/[0.03] rounded-3xl border border-white/5">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Capital Proyectado</span>
                                                <div className="text-2xl font-black text-white">{formatCurrency(currentJob.total)}</div>
                                            </div>
                                            <div className="p-5 bg-gold-bright/10 rounded-3xl border border-gold-bright/20">
                                                <span className="text-[8px] font-black text-gold-bright/60 uppercase tracking-widest block mb-1">Balance Pendiente</span>
                                                <div className="text-2xl font-black text-gold-bright">{formatCurrency(currentJob.saldo)}</div>
                                            </div>
                                        </div>

                                        {parsedSpecs && (
                                            <div className="space-y-3">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-2 italic">Análisis de Estructura</span>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {[
                                                        { label: 'Sustrato', value: parsedSpecs.tipoPapel, icon: LayersIcon },
                                                        { label: 'Formato', value: parsedSpecs.tamano, icon: MapPinIcon },
                                                        { label: 'Volumen', value: parsedSpecs.copias, icon: HashIcon },
                                                        { label: 'Secuencia', value: parsedSpecs.numerado, icon: QrCodeIcon }
                                                    ].map(spec => (
                                                        <div key={spec.label} className="flex items-center justify-between px-5 py-3 bg-white/[0.03] rounded-2xl group hover:bg-white/5 hover:border-gold-bright/20 border border-transparent transition-all">
                                                            <div className="flex items-center gap-3">
                                                                <spec.icon className="w-4 h-4 text-slate-600 group-hover:text-gold-bright transition-colors" />
                                                                <span className="text-[10px] font-black text-slate-500 uppercase group-hover:text-white italic">{spec.label}</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-white uppercase italic tracking-widest">{spec.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="p-6 bg-gold-bright/5 border border-gold-bright/10 rounded-3xl">
                                            <span className="text-[8px] font-black text-gold-bright uppercase tracking-widest block mb-2 italic">Comentario del Taller</span>
                                            <p className="text-[11px] font-medium text-slate-400 italic leading-relaxed uppercase tracking-wider">{cleanDetalle || "Procesando especificaciones adicionales..."}</p>
                                        </div>
                                    </div>

                                    {/* Real-time Telemetry Console */}
                                    <div className="flex-1 bg-black/40 border border-white/5 rounded-[3rem] p-8 flex flex-col min-h-[300px] shadow-2xl relative overflow-hidden group/console backdrop-blur-3xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-bright/10 blur-3xl rounded-full" />
                                        <div className="flex items-center justify-between mb-6 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <ActivityIcon className="w-4 h-4 text-gold-bright animate-pulse" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Telemetría en Tiempo Real</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[10px] space-y-4 pr-2 relative z-10">
                                            {terminalLogs.map((log, i) => (
                                                <div key={i} className="flex gap-4 group/log">
                                                    <span className="text-slate-700 font-bold shrink-0">[{log.time}]</span>
                                                    <span className="text-slate-300 group-hover/log:text-white transition-colors uppercase tracking-widest">{log.msg}</span>
                                                </div>
                                            ))}
                                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} className="text-gold-bright font-bold uppercase tracking-widest pt-4 border-t border-white/5 italic">
                                                {`> ESTATUS: ${currentJob.estado.replace('_', ' ')}`}
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-20">
                                <div className="relative mb-12">
                                    <motion.div 
                                        animate={{ rotate: 360 }} 
                                        transition={{ repeat: Infinity, duration: 20, ease: "linear" }} 
                                        className="w-64 h-64 border-2 border-dashed border-slate-200 rounded-full" 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-40 h-40 bg-gold-bright/5 rounded-full blur-3xl animate-pulse" />
                                        <GlobeAltIcon className="w-16 h-16 text-gold-bright/20" />
                                    </div>
                                </div>
                                <div className="text-center space-y-4">
                                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Esperando Enlace</h2>
                                    <p className="text-[11px] text-slate-600 uppercase tracking-[1em] italic pl-4">Ingrese_su_ID_para_vincular</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Voice Command Console */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
                <motion.div 
                    layout 
                    className={`rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] border transition-all duration-700 ${isVoiceActive ? 'bg-brand-dark border-gold-bright/30 p-8 w-[450px]' : 'bg-gold-bright border-transparent p-4'}`}
                >
                    <AnimatePresence mode="wait">
                        {isVoiceActive ? (
                            <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-gold-bright rounded-full shadow-lg shadow-gold-bright/50 animate-ping" />
                                        <span className="text-[10px] font-black text-gold-bright uppercase tracking-[0.4em] italic font-display">Núcleo de Inteligencia</span>
                                    </div>
                                    <button onClick={stopVoiceTracking} className="p-2 hover:bg-white/5 rounded-2xl transition-colors"><XIcon className="w-5 h-5 text-slate-600" /></button>
                                </div>
                                <div className="h-16 flex items-end justify-center gap-2.5 px-8">
                                    {[0.4, 0.8, 0.5, 1.0, 0.6, 0.9, 0.4, 0.7, 0.5, 0.8].map((d, i) => (
                                        <motion.div key={i} animate={{ height: [8, 56 * d, 8] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }} className="w-2 bg-gold-bright rounded-full" />
                                    ))}
                                </div>
                                <div className="text-[11px] font-bold text-slate-500 italic text-center px-6 leading-relaxed uppercase tracking-wider">{voiceStatus}</div>
                            </motion.div>
                        ) : (
                            <motion.button 
                                key="inactive" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startVoiceTracking} 
                                className="text-brand-dark flex items-center gap-4 px-6 py-2"
                            >
                                <HeadphonesIcon className="w-6 h-6" />
                                {foundJobs.length > 0 && <span className="text-[11px] font-black uppercase tracking-[0.5em] italic">Centro de Control</span>}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <style>{`
                @keyframes scan-y { 0% { transform: translateY(-100%); } 100% { transform: translateY(800%); } }
                .animate-scan-y { animation: scan-y 6s linear infinite; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                * { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
            `}</style>
        </div>
    );
};

export default TrackingPage;

