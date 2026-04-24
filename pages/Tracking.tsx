import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trabajo, TrabajoEstado } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { 
    SearchIcon, ClockIcon, CheckCircleIcon, 
    PrinterIcon, PaletteIcon, BoxIcon, MessageCircleIcon, MapPinIcon, 
    Loader2Icon, ShieldCheckIcon, EyeIcon, CheckBadgeIcon,
    SparklesIcon, MicIcon, XIcon, InfoIcon, ArrowDownTrayIcon, WalletIcon,
    ArrowRightIcon, BoltIcon, ActivityIcon, CpuIcon, GlobeAltIcon
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
    { label: 'Recibido',  value: TrabajoEstado.PENDIENTE,  icon: ClockIcon         },
    { label: 'Diseño',    value: TrabajoEstado.EN_DISENO,  icon: PaletteIcon       },
    { label: 'Producción', value: TrabajoEstado.PROCESO,   icon: PrinterIcon       },
    { label: 'Listo para Retiro', value: TrabajoEstado.VITRINA, icon: CheckCircleIcon },
    { label: 'Entregado', value: TrabajoEstado.ENTREGADO,  icon: BoxIcon           },
];

const TrackingPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [foundJobs, setFoundJobs] = useState<Trabajo[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState('Esperando...');
    const [liveSession, setLiveSession] = useState<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef(0);
    const micStreamRef = useRef<MediaStream | null>(null);

    // Auto-search from URL param (QR Code)
    useEffect(() => {
        const q = searchParams.get('q');
        if (q) {
            setSearchQuery(q);
            (async () => {
                setSearching(true);
                setError('');
                try {
                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
                    
                    if (isUUID) {
                        const { data, error } = await supabase.from('trabajos').select('*').eq('id', q);
                        if (!error && data && data.length > 0) {
                            setFoundJobs(data as Trabajo[]);
                            setSelectedJobId(data[0].id);
                            setSearchQuery("");
                        } else {
                            setError('No se encontró el pedido solicitado.');
                        }
                    } else {
                        console.warn("Rastreo automático solo vía ID único.");
                    }
                } catch(e) {
                    console.error(e);
                } finally {
                    setSearching(false);
                }
            })();
        }
    }, [searchParams]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const cleanQuery = searchQuery.trim();
        if (!cleanQuery) return;
        setSearching(true);
        setError('');
        setFoundJobs([]);
        
        try {
            if (isUUID) {
                const { data: orderMatches } = await supabase
                    .from('trabajos').select('*').eq('id', cleanQuery);
                if (orderMatches && orderMatches.length > 0) {
                    setFoundJobs(orderMatches as any);
                    setSelectedJobId(orderMatches[0].id);
                    setSearching(false);
                    return;
                }
            }

            if (!isUUID) {
                const { data: matchedClients } = await supabase
                    .from('clientes').select('id')
                    .or(`nombre.ilike.%${cleanQuery}%,cedula.eq.${cleanQuery},ruc.eq.${cleanQuery}`);
                
                if (matchedClients && matchedClients.length > 0) {
                    const clientIds = matchedClients.map(c => c.id);
                    const { data: clientJobs } = await supabase
                        .from('trabajos').select('*')
                        .in('cliente_id', clientIds).order('orden', { ascending: false });
                    if (clientJobs && clientJobs.length > 0) {
                        setFoundJobs(clientJobs as any);
                        setSelectedJobId(clientJobs[0].id);
                    } else {
                        setError('El cliente no tiene pedidos registrados.');
                    }
                } else {
                    setError('No encontramos pedidos ni clientes con ese dato.');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión con la base de datos.');
        } finally {
            setSearching(false);
        }
    };

    const handleAprobarArte = async (trabajoId: string) => {
        if (!window.confirm("¿Confirma que el diseño es correcto y desea enviarlo a impresión?")) return;
        try {
            const { error } = await supabase.from('trabajos')
                .update({ arte_aprobado: true }).eq('id', trabajoId).select().single();
            if (error) throw error;
            setFoundJobs(prev => prev.map(j => j.id === trabajoId ? { ...j, arte_aprobado: true } : j));
            alert("✅ Arte aprobado. El taller ha sido notificado.");
        } catch (e) { alert("Error al aprobar arte."); }
    };

    const handleGeneratePaymentLink = (job: Trabajo) => {
        const message = `*SOLICITUD DE PAGO / COBRO*\n--------------------------------\n🧾 *Orden:* #${job.orden}\n📝 *Detalle:* ${job.subtipo}\n💰 *Saldo Pendiente:* ${formatCurrency(job.saldo)}\n\n*DATOS BANCARIOS:*\n🏦 Banco Pichincha\n💳 Cta. Ahorro: 123-4567890\n👤 Imprenta Córdova\n🆔 RUC: 0702065319001\n\n📎 *Por favor adjunte su comprobante aquí para procesar su retiro.*`;
        window.open(`https://wa.me/593993083943?text=${encodeURIComponent(message)}`, '_blank');
    };

    const startVoiceTracking = async () => {
        if (!foundJobs.length) {
            alert("Primero busca tu pedido para que la IA tenga contexto.");
            return;
        }
        setIsVoiceActive(true);
        setVoiceStatus("Iniciando Córdova Voice...");
        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = outputCtx;
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;
            const jobContext = foundJobs.map(j => `Orden #${j.orden}: ${j.subtipo}, estado actual: ${j.estado}, saldo: ${formatCurrency(j.saldo)}`).join('; ');
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
                    onerror: () => setVoiceStatus("Error de conexión"),
                    onclose: () => stopVoiceTracking()
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: { parts: [{ text: `Eres el asistente de voz de Imprenta Córdova Pasaje. Responde de forma breve y amable. Los pedidos actuales del cliente son: ${jobContext}. El cliente está en Pasaje, El Oro. Habla español de Ecuador.` }] }
                }
            });
            setLiveSession(await sessionPromise);
        } catch (e) {
            console.error(e);
            stopVoiceTracking();
        }
    };

    const stopVoiceTracking = () => {
        setIsVoiceActive(false);
        micStreamRef.current?.getTracks().forEach(t => t.stop());
        liveSession?.close();
    };

    return (
        <div className="min-h-screen bg-brand-dark font-sans pb-60 relative overflow-x-hidden">
            <SEO 
                title="Rastreo Satelital de Producción | Imprenta Córdova"
                description="Consulte el estado de su orden en tiempo real con nuestra interfaz de rastreo satelital Obsidian & Gold."
            />

            <Navbar />

            {/* Background elements */}
            <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-liquid-gold/[0.03] blur-[150px] rounded-full pointer-events-none -z-10 animate-pulse" />
            <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-brand-red/[0.02] blur-[180px] rounded-full pointer-events-none -z-10" />
            <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none -z-10" />

            <main className="relative z-10 container mx-auto px-6 pt-40 pb-16 max-w-6xl">

                {/* ── CINEMATIC HERO ── */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-24 text-center"
                >
                    <div className="inline-flex items-center gap-4 px-6 py-2 bg-white/[0.03] border border-white/10 rounded-full mb-10 shadow-inner">
                        <GlobeAltIcon className="w-5 h-5 text-gold-bright animate-spin-slow" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Sistema de Rastreo en Tiempo Real</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[11rem] font-black text-white mb-4 sm:mb-8 uppercase tracking-tighter leading-[0.8] italic group">
                        MI <br/>
                        <span className="text-white/20 not-italic font-editorial font-normal">PEDIDO</span>
                    </h1>
                    <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium tracking-tight">
                        Consulte el estado exacto de su trabajo. Ingrese su cédula para visualizar sus órdenes activas.
                    </p>
                </motion.div>

                {/* ── PREMIUM SEARCH ── */}
                <motion.form 
                    onSubmit={handleSearch}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="relative max-w-3xl mx-auto mb-32"
                >
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-liquid-gold/40 via-transparent to-liquid-gold/10 rounded-[3rem] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-1000 blur-xl pointer-events-none" />
                        
                        <div className="relative flex flex-col md:flex-row items-stretch bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-luxury transition-all duration-700">
                            <div className="pl-6 md:pl-10 pr-4 md:pr-6 flex items-center shrink-0">
                                <SearchIcon className="w-6 h-6 md:w-7 md:h-7 text-slate-700 group-focus-within:text-glow-gold transition-colors" />
                            </div>
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="CÉDULA O RUC..." 
                                className="flex-1 py-6 md:py-10 pr-6 md:pr-10 bg-transparent text-white text-lg sm:text-xl md:text-2xl font-black placeholder:text-slate-600 outline-none uppercase tracking-widest italic"
                            />
                            <div className="p-2 md:p-4 w-full md:w-auto">
                                <button 
                                    type="submit"
                                    disabled={searching}
                                    className="w-full md:w-auto h-full px-8 py-5 md:px-16 md:py-8 bg-gold-bright text-brand-dark rounded-[2.2rem] font-black text-xs tracking-[0.4em] uppercase hover:bg-white hover:shadow-gold-glow-strong transition-all duration-700 flex items-center justify-center gap-4 shadow-luxury active:scale-95 disabled:opacity-40"
                                >
                                    {searching ? <Loader2Icon className="w-6 h-6 animate-spin"/> : <>Sincronizar</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.form>

                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-rose-500/5 border border-rose-500/20 text-rose-500 px-12 py-8 rounded-[2.5rem] mb-16 text-sm font-black flex items-center gap-6 backdrop-blur-xl italic uppercase tracking-widest justify-center"
                        >
                            <InfoIcon className="w-6 h-6 shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── JOB SELECTOR (Console Style) ── */}
                {foundJobs.length > 1 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16"
                    >
                        <div className="flex items-center gap-4 mb-6 px-4">
                            <div className="w-2 h-2 bg-liquid-gold rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Multi-Order Detection Link</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar px-4 -mx-4">
                            {foundJobs.map((job) => (
                                <button
                                    key={job.id}
                                    onClick={() => setSelectedJobId(job.id)}
                                    className={`shrink-0 px-8 py-5 rounded-[2rem] border-2 transition-all duration-700 flex flex-col gap-1 items-start min-w-[240px] relative overflow-hidden group/item ${
                                        selectedJobId === job.id 
                                            ? 'bg-liquid-gold border-liquid-gold text-brand-dark shadow-gold-glow' 
                                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/30'
                                    }`}
                                >
                                    {selectedJobId === job.id && (
                                        <motion.div layoutId="active-selector" className="absolute inset-0 bg-white/20 -z-10" />
                                    )}
                                    <div className="flex items-center justify-between w-full">
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${selectedJobId === job.id ? 'text-brand-dark/60' : 'text-slate-600'}`}>ID: {job.orden}</span>
                                        {job.estado === TrabajoEstado.VITRINA && <SparklesIcon className="w-3 h-3 animate-pulse" />}
                                    </div>
                                    <span className="text-sm font-black truncate w-full italic uppercase tracking-tighter">{job.subtipo}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── RESULTS ── */}
                <div className="space-y-16">
                    {foundJobs.filter(j => !selectedJobId || j.id === selectedJobId).map((job) => {
                        const currentStepIdx = statusSteps.findIndex(s => s.value === job.estado);
                        const isDesigning = job.estado === TrabajoEstado.EN_DISENO || job.estado === TrabajoEstado.PENDIENTE;
                        const isDelivered = job.estado === TrabajoEstado.ENTREGADO;
                        const isReady = job.estado === TrabajoEstado.VITRINA;
                        
                        // Fake complex hash for "premium complexity" feel
                        const satelliteHash = `SAT-LINK-XQ-${job.id.substring(0, 8).toUpperCase()}-${job.id.substring(24).toUpperCase()}-NODE-CORE`;
                        
                        return (
                            <motion.div 
                                key={job.id} 
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="bg-[#0a0a0a]/40 border border-white/5 rounded-[3.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl relative group"
                            >
                                {/* ── SATELLITE HASH OVERLAY (User requested long URLs/Complexity) ── */}
                                <div className="absolute top-4 right-12 hidden md:flex items-center gap-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <div className="w-1 h-1 bg-liquid-gold rounded-full animate-ping"></div>
                                    <span className="text-[7px] font-mono font-bold text-liquid-gold tracking-[0.3em] uppercase">{satelliteHash}</span>
                                </div>

                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent"></div>
                                
                                {/* ── CABECERA ── */}
                                <div className="p-8 sm:p-14 border-b border-white/5 bg-black/20 flex flex-col sm:flex-row justify-between items-center gap-8 relative z-10">
                                    <div className="flex items-center gap-8">
                                        <div className="w-20 h-20 bg-liquid-gold/10 rounded-[2rem] flex items-center justify-center border border-liquid-gold/20 shadow-inner group-hover:rotate-12 transition-transform duration-700">
                                            <CpuIcon className="w-10 h-10 text-liquid-gold"/>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-gold-bright uppercase tracking-[0.5em] italic">{job.tipo}</span>
                                                <div className="w-1.5 h-1.5 bg-white/10 rounded-full"></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">{formatDate(job.fecha)}</span>
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tighter italic uppercase leading-none">
                                                ORDEN <span className="text-white/20 not-italic">#</span>{String(job.orden).padStart(5, '0')}
                                            </h2>
                                        </div>
                                    </div>
                                    
                                    <div className={`px-10 py-5 rounded-2xl border text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-4 italic transition-all duration-1000 ${
                                        isReady  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-gold-glow' :
                                        isDelivered ? 'bg-slate-800/20 border-slate-700 text-slate-500' :
                                        'bg-liquid-gold/10 border-liquid-gold/30 text-liquid-gold animate-pulse'
                                    }`}>
                                        {isReady && <BoltIcon className="w-4 h-4 text-emerald-400" />}
                                        {isReady ? 'LISTO PARA RETIRO' : job.estado.toUpperCase()}
                                    </div>
                                </div>

                                {/* ── CONTENIDO ── */}
                                <div className="p-8 sm:p-14 lg:p-20 grid lg:grid-cols-2 gap-20 relative z-10">
                                    
                                    {/* COLUMNA IZQUIERDA */}
                                    <div className="space-y-14">
                                        {isDesigning && job.fotoOriginalUrl ? (
                                            <div className="space-y-10">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                                        <PaletteIcon className="w-4 h-4 text-liquid-gold" />
                                                    </div>
                                                    <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white italic">Protocolo de Diseño Visual</h3>
                                                </div>
                                                <div className="relative group/img aspect-square bg-black/60 rounded-[3rem] overflow-hidden border border-white/5 shadow-gold-glow-soft">
                                                    <img src={job.fotoOriginalUrl} className="w-full h-full object-contain p-8 group-hover/img:scale-110 transition-transform duration-[2s]" alt="Vista Previa" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-700 flex items-end justify-center pb-12">
                                                        <button 
                                                            onClick={() => window.open(job.fotoOriginalUrl, '_blank')}
                                                            className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                                                        >
                                                            <EyeIcon className="w-5 h-5"/> ANALIZAR ARTE
                                                        </button>
                                                    </div>
                                                </div>
                                                {!job.arte_aprobado ? (
                                                    <button 
                                                        onClick={() => handleAprobarArte(job.id)}
                                                        className="w-full py-8 bg-gold-gradient text-brand-dark rounded-[2.5rem] font-black text-[12px] tracking-[0.5em] uppercase hover:shadow-gold-glow-strong hover:scale-[1.02] transition-all duration-700 flex items-center justify-center gap-6 shadow-luxury"
                                                    >
                                                        <CheckBadgeIcon className="w-6 h-6" /> VALIDAR Y PROCEDER
                                                    </button>
                                                ) : (
                                                    <div className="py-8 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-[2.5rem] flex items-center justify-center gap-6 font-black text-[12px] uppercase tracking-[0.5em] italic shadow-glow-emerald">
                                                        <ShieldCheckIcon className="w-6 h-6 animate-pulse"/> PROTOCOLO APROBADO
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-10">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                                        <InfoIcon className="w-4 h-4 text-liquid-gold" />
                                                    </div>
                                                    <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white italic">Especificaciones de Manufactura</h3>
                                                </div>
                                                <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-inner">
                                                    <div className="flex justify-between items-center pb-8 border-b border-white/5">
                                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">SISTEMA / PRODUCTO</span>
                                                        <span className="text-lg font-black text-white italic tracking-tighter uppercase">{job.subtipo}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center pb-8 border-b border-white/5">
                                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">CARGA NOMINAL</span>
                                                        <span className="text-lg font-black text-white italic tracking-tighter uppercase">{job.cantidad} UNIDADES</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">VECTOR DE ESTADO</span>
                                                        <span className="text-lg font-black text-liquid-gold italic tracking-tighter uppercase">{job.estado}</span>
                                                    </div>
                                                </div>
                                                {isDelivered && (
                                                    <a href={`/#/nota-de-venta/${job.id}`} target="_blank" className="flex items-center justify-center gap-6 w-full py-8 bg-white/5 border border-white/10 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all duration-700 shadow-luxury italic group">
                                                        <ArrowDownTrayIcon className="w-6 h-6 group-hover:-translate-y-1 transition-transform"/> DESCARGAR CERTIFICADO
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* COLUMNA DERECHA */}
                                    <div className="space-y-14">
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-5">
                                                <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                                    <ActivityIcon className="w-4 h-4 text-liquid-gold animate-pulse" />
                                                </div>
                                                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white italic">Vector de Seguimiento</h3>
                                            </div>
                                            <div className="flex justify-between items-end gap-3 h-32 relative">
                                                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10"></div>
                                                {statusSteps.map((step, idx) => {
                                                    const isCompleted = idx <= currentStepIdx;
                                                    const isCurrent = idx === currentStepIdx;
                                                    const Icon = step.icon;
                                                    return (
                                                        <div key={step.value} className="flex-1 flex flex-col items-center gap-6 relative group/step">
                                                            <div className={`w-full h-2 rounded-full absolute -top-4 transition-all duration-[2s] ${isCompleted ? 'bg-liquid-gold shadow-gold-glow' : 'bg-white/5'}`} />
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-700 relative ${
                                                                isCurrent ? 'bg-white border-white text-black scale-125 shadow-gold-glow-strong z-20' :
                                                                isCompleted ? 'bg-liquid-gold/20 border-liquid-gold/40 text-liquid-gold z-10' : 'bg-black border-white/10 text-slate-800'
                                                            }`}>
                                                                <Icon className="w-6 h-6" />
                                                                {isCurrent && <div className="absolute -inset-2 bg-white/20 rounded-[1.5rem] animate-ping -z-10"></div>}
                                                            </div>
                                                            <span className={`text-[9px] font-black uppercase tracking-tighter text-center transition-colors duration-700 ${isCurrent ? 'text-white' : 'text-slate-600'}`}>{step.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-10">
                                            <div className="flex items-center gap-5">
                                                <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                                    <WalletIcon className="w-4 h-4 text-liquid-gold" />
                                                </div>
                                                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white italic">Balance del Portafolio</h3>
                                            </div>
                                            <div className={`p-12 rounded-[3rem] border-2 transition-all duration-1000 group/wallet relative overflow-hidden ${job.saldo > 0 ? 'bg-rose-500/[0.03] border-rose-500/20' : 'bg-emerald-500/[0.03] border-emerald-500/20'}`}>
                                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/wallet:scale-150 transition-transform duration-[3s]">
                                                    <GlobeAltIcon className="w-32 h-32 text-white" />
                                                </div>
                                                <div className="flex justify-between items-center relative z-10">
                                                    <div className="space-y-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${job.saldo > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                            {job.saldo > 0 ? 'CRÉDITO PENDIENTE' : 'LIQUIDACIÓN EXITOSA'}
                                                        </span>
                                                        <p className={`text-6xl sm:text-7xl font-black italic tracking-tighter leading-none ${job.saldo > 0 ? 'text-white' : 'text-emerald-400 shadow-glow-emerald'}`}>
                                                            {formatCurrency(job.saldo)}
                                                        </p>
                                                    </div>
                                                    {job.saldo > 0 && (
                                                        <button 
                                                            onClick={() => handleGeneratePaymentLink(job)}
                                                            className="w-20 h-20 bg-white text-black rounded-3xl flex items-center justify-center hover:bg-liquid-gold hover:scale-110 transition-all duration-700 active:scale-90 shadow-2xl group/btn"
                                                        >
                                                            <ArrowRightIcon className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                {/* ── FOOTER COORDINATES ── */}
                                <div className="px-12 py-8 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <MapPinIcon className="w-5 h-5 text-slate-700" />
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">Recoger en: Atelier Pasaje - Calle Colón e/ Sucre y Rocafuerte</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={() => window.open('https://maps.app.goo.gl/3Yc1Y4jM8R6v4jA87')} className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">MAPS</button>
                                        <button onClick={() => window.open('https://wa.me/593993083943')} className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors">WHATSAPP</button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>

            {/* ── CINEMATIC VOICE HUD ── */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-10">
                <motion.div 
                    layout
                    className={`bg-[#050505]/95 backdrop-blur-3xl rounded-[3rem] shadow-gold-glow-strong border transition-all duration-[1s] overflow-hidden ${
                        isVoiceActive ? 'border-liquid-gold/40 ring-4 ring-liquid-gold/5 p-8 scale-110' : 'border-white/10 p-2'
                    }`}
                >
                    <AnimatePresence mode="wait">
                        {isVoiceActive ? (
                            <motion.div 
                                key="active"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="flex items-center justify-between gap-8 px-2"
                            >
                                <div className="flex items-center gap-8 flex-1">
                                    <div className="flex gap-[6px] items-center h-14">
                                        {[0, 0.15, 0.08, 0.25, 0.05, 0.12, 0.2, 0.1, 0.3].map((delay, i) => (
                                            <div 
                                                key={i}
                                                className="w-1 bg-liquid-gold rounded-full"
                                                style={{ 
                                                    animation: `voice-pulse 1.2s ease-in-out ${delay}s infinite`,
                                                    boxShadow: '0 0 15px rgba(212,175,55,0.6)'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-1 min-w-0">
                                        <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.8em] mb-1 italic">Intelligence</span>
                                        <span className="text-[13px] font-black text-white uppercase tracking-[0.2em] truncate italic">{voiceStatus}...</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={stopVoiceTracking} 
                                    className="w-16 h-16 flex items-center justify-center bg-rose-600 text-white rounded-3xl hover:scale-110 hover:rotate-90 transition-all duration-700 active:scale-95 shadow-glow-rose"
                                >
                                    <XIcon className="w-7 h-7"/>
                                </button>
                            </motion.div>
                        ) : (
                            <motion.button 
                                key="inactive"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={startVoiceTracking}
                                className="w-full py-7 bg-white text-black rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.6em] flex items-center justify-center gap-6 hover:bg-liquid-gold transition-all duration-[1.5s] active:scale-[0.98] shadow-luxury group/v"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-liquid-gold blur-md rounded-full animate-pulse opacity-0 group-hover/v:opacity-40"></div>
                                    <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center relative z-10 group-hover/v:bg-black/20 transition-all duration-700">
                                        <MicIcon className="w-5 h-5 group-hover/v:scale-125 transition-transform" />
                                    </div>
                                </div>
                                INITIALIZE VOICE LINK
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <style>{`
                @keyframes voice-pulse {
                    0%, 100% { height: 12px; opacity: 0.3; }
                    50% { height: 48px; opacity: 1; }
                }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .text-glow-gold { text-shadow: 0 0 20px rgba(212,175,55,0.4); }
                .shadow-glow-rose { box-shadow: 0 0 30px rgba(225,29,72,0.3); }
                .shadow-glow-emerald { box-shadow: 0 0 30px rgba(16,185,129,0.3); }
            `}</style>
        </div>
    );
};

export default TrackingPage;
