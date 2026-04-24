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
    { label: 'En Taller', value: TrabajoEstado.PROCESO,    icon: PrinterIcon       },
    { label: 'Terminado', value: TrabajoEstado.VITRINA,    icon: CheckCircleIcon   },
    { label: 'Entregado', value: TrabajoEstado.ENTREGADO,  icon: BoxIcon           },
];

const TrackingPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [foundJobs, setFoundJobs] = useState<Trabajo[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    
    // MAESTRO FEATURE: Voice Tracking States
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
                    let query = supabase.from('trabajos').select('*').order('fecha_entrada', { ascending: false });
                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
                    if (isUUID) {
                        query = query.eq('id', q);
                    } else if (/^\d+$/.test(q)) {
                        query = query.eq('orden', parseInt(q));
                    } else {
                        query = query.eq('id', 'invalid-query'); // No results if it's neither
                    }
                    const { data: matches, error: sbError } = await query;
                    if (sbError) throw sbError;
                    if (matches && matches.length > 0) {
                        setFoundJobs(matches as any);
                    } else {
                        setError('Orden no encontrada. Verifique el número de comprobante.');
                    }
                } catch(e) {
                    console.error(e);
                    setError('Error al rastrear. Intente nuevamente.');
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
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);
            if (isUUID) {
                const { data: orderMatches } = await supabase
                    .from('trabajos').select('*').eq('id', cleanQuery);
                if (orderMatches && orderMatches.length > 0) {
                    setFoundJobs(orderMatches as any);
                    setSearching(false);
                    return;
                }
            }

            // Only allow CEDULA/RUC searches, explicitly avoiding order numbers.
            // If they type a number, we treat it as CEDULA/RUC.
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
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Cordova Vision Link Active</span>
                    </div>
                    <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[11rem] font-black text-white mb-4 sm:mb-8 uppercase tracking-tighter leading-[0.8] italic group">
                        LIVE <br/>
                        <span className="text-white/20 not-italic font-editorial font-normal">TRACKING</span>
                    </h1>
                    <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-medium tracking-tight">
                        Interfaz síncrona de monitoreo industrial. Ingrese su firma de pedido para inicializar el protocolo de rastreo.
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

                {/* ── RESULTS ── */}
                <div className="space-y-20">
                    {foundJobs.map((job, jobIdx) => {
                        const currentStepIdx = statusSteps.findIndex(s => s.value === job.estado);
                        const isDesigning = job.estado === TrabajoEstado.EN_DISENO || job.estado === TrabajoEstado.PENDIENTE;
                        const isDelivered = job.estado === TrabajoEstado.ENTREGADO;
                        const isReady = job.estado === TrabajoEstado.VITRINA;
                        
                        return (
                            <motion.div 
                                key={job.id} 
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, delay: jobIdx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                                className="bg-white/[0.01] border border-white/5 rounded-[4rem] overflow-hidden backdrop-blur-3xl shadow-luxury relative group"
                            >
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/20 to-transparent"></div>
                                <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>

                                {/* ── CABECERA H-FI ── */}
                                <div className="p-6 sm:p-12 lg:p-20 border-b border-white/5 bg-black/40 flex flex-col xl:flex-row justify-between items-center gap-8 xl:gap-14 relative z-10">
                                    <div className="flex items-center gap-10">
                                        <div className="w-24 h-24 bg-white/[0.03] border-2 border-white/5 rounded-[2.5rem] flex items-center justify-center shadow-inner group-hover:border-gold-bright/40 transition-all duration-1000">
                                            <CpuIcon className="w-12 h-12 text-gold-bright/30 group-hover:text-gold-bright group-hover:animate-pulse transition-all duration-700"/>
                                        </div>
                                        <div className="space-y-2 text-center xl:text-left">
                                            <div className="flex items-center justify-center xl:justify-start gap-4">
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] italic">Artifact Signature</span>
                                                <div className="w-1.5 h-1.5 bg-gold-bright rounded-full shadow-gold-glow-sm"></div>
                                                <span className="text-[10px] font-black text-gold-bright/60 uppercase tracking-[0.5em] italic">{job.tipo.toUpperCase()}</span>
                                            </div>
                                            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-none italic uppercase">
                                                #{String(job.orden).padStart(5, '0')}
                                            </h2>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6 flex-wrap justify-center">
                                        {isDelivered && (
                                            <a 
                                                href={`/#/nota-de-venta/${job.id}`} 
                                                target="_blank" 
                                                className="flex items-center gap-5 px-10 py-6 bg-white/5 border border-white/10 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all duration-700 shadow-luxury italic hover:scale-105 active:scale-95"
                                            >
                                                <ArrowDownTrayIcon className="w-5 h-5"/> Export Certificate
                                            </a>
                                        )}
                                        <div className={`px-12 py-6 rounded-3xl border text-[12px] font-black uppercase tracking-[0.4em] flex items-center gap-4 italic transition-all duration-1000 ${
                                            isReady  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-glow-emerald' :
                                            isDelivered ? 'bg-slate-800/10 border-slate-700 text-slate-500' :
                                            'bg-liquid-gold/10 border-liquid-gold/30 text-liquid-gold'
                                        }`}>
                                            {isReady && <SparklesIcon className="w-5 h-5 animate-pulse" />}
                                            {isReady ? 'Ready for Dispatch' : job.estado.toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                {/* ── VISUAL PROOFING ── */}
                                {isDesigning && job.fotoOriginalUrl && (
                                    <div className="p-6 sm:p-12 lg:p-20 bg-liquid-gold/[0.01] border-b border-white/5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-liquid-gold/[0.02] blur-[150px] -mr-40 -mt-40 pointer-events-none" />
                                        
                                        <div className="flex flex-col lg:flex-row gap-20 items-center relative z-10">
                                            <motion.div 
                                                whileHover={{ scale: 1.02 }}
                                                className="relative w-full lg:w-3/5 aspect-video bg-black/60 rounded-[3rem] overflow-hidden border-2 border-white/5 group/img shadow-2xl transition-all duration-1000 group-hover/img:border-liquid-gold/20"
                                            >
                                                <img 
                                                    src={job.fotoOriginalUrl} 
                                                    className="w-full h-full object-contain p-10 group-hover/img:scale-110 transition-transform duration-[2s] opacity-80 group-hover/img:opacity-100 grayscale-[0.5] group-hover/img:grayscale-0" 
                                                    alt="Vista Previa" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                    <EyeIcon className="w-4 h-4 text-liquid-gold" />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Inspection Deck</span>
                                                </div>
                                            </motion.div>
                                            <div className="flex-1 space-y-10">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-liquid-gold/20 rounded-2xl border border-liquid-gold/30">
                                                            <CheckBadgeIcon className="w-8 h-8 text-liquid-gold shadow-gold-glow-sm" />
                                                        </div>
                                                        <h3 className="text-[13px] font-black uppercase tracking-[0.5em] text-white italic">Neural Proofing Protocol</h3>
                                                    </div>
                                                    <p className="text-lg text-slate-500 font-medium leading-relaxed italic">
                                                        Hemos procesado el prototipo digital de su orden. El sistema requiere autorización del nodo titular para proceder a la materialización industrial.
                                                    </p>
                                                </div>
                                                {!job.arte_aprobado ? (
                                                    <button 
                                                        onClick={() => handleAprobarArte(job.id)}
                                                        className="group/auth w-full py-8 bg-white text-black rounded-[2.5rem] font-black text-[12px] tracking-[0.5em] uppercase hover:bg-liquid-gold hover:shadow-gold-glow-strong transition-all duration-1000 flex items-center justify-center gap-6 active:scale-95 relative overflow-hidden"
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/auth:translate-x-full transition-transform duration-[1.5s]"></div>
                                                        <ShieldCheckIcon className="w-7 h-7 group-hover/auth:scale-125 transition-transform duration-700" />
                                                        AUTHORIZE PRODUCTION
                                                    </button>
                                                ) : (
                                                    <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-[2.5rem] flex items-center justify-center gap-6 font-black text-[12px] uppercase tracking-[0.6em] italic shadow-glow-emerald">
                                                        <CheckCircleIcon className="w-7 h-7"/> PROTOCOL AUTHORIZED BY CLIENT
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── TRAJECTORY MATRIX ── */}
                                <div className="p-6 sm:p-12 lg:p-24 relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row items-center justify-between mb-16 sm:mb-24 gap-6">
                                        <div className="flex items-center gap-4 sm:gap-6">
                                            <ActivityIcon className="w-6 h-6 sm:w-8 sm:h-8 text-liquid-gold/40 animate-pulse" />
                                            <p className="text-[10px] sm:text-[12px] font-black text-slate-600 uppercase tracking-[0.8em] italic text-center sm:text-left">Flow Trajectory Matrix</p>
                                        </div>
                                        <span className="text-[9px] sm:text-[11px] font-black text-liquid-gold uppercase tracking-[0.4em] italic bg-white/5 px-6 py-2 rounded-full border border-white/10 outline-gold-glow-soft">
                                            {Math.round((currentStepIdx / (statusSteps.length - 1)) * 100)}% SYNCHRONIZED
                                        </span>
                                    </div>
                                    
                                    <div className="relative mb-16 sm:mb-24 px-4 sm:px-10 overflow-x-auto pb-6 custom-scrollbar">
                                        <div className="min-w-[500px] relative">
                                            {/* Cinematic Track */}
                                            <div className="absolute top-[30px] sm:top-[40px] left-10 sm:left-20 right-10 sm:right-20 h-[2px] bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%` }}
                                                transition={{ duration: 2.5, ease: "circOut" }}
                                                className="h-full bg-gold-bright shadow-gold-glow-strong"
                                            />
                                        </div>
                                        {/* Node Units */}
                                        <div className="relative flex justify-between">
                                            {statusSteps.map((step, idx) => {
                                                const isCompleted = idx <= currentStepIdx;
                                                const isCurrent = idx === currentStepIdx;
                                                const Icon = step.icon;
                                                return (
                                                    <div key={step.value} className="flex flex-col items-center gap-8 group/node">
                                                        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center z-10 border-2 transition-all duration-1000 ${
                                                            isCurrent
                                                                ? 'bg-white text-black border-white shadow-gold-glow-strong scale-125'
                                                                : isCompleted
                                                                ? 'bg-white/10 border-white/20 text-white scale-110'
                                                                : 'bg-black/80 border-white/5 text-slate-800 opacity-20'
                                                        }`}>
                                                            <Icon className={`w-8 h-8 transition-all duration-700 ${isCurrent ? 'animate-pulse scale-110' : ''}`} />
                                                        </div>
                                                        <div className="flex flex-col items-center space-y-2">
                                                            <span className={`text-[10px] font-black uppercase tracking-[0.4em] text-center transition-all duration-700 ${
                                                                isCurrent ? 'text-white' :
                                                                isCompleted ? 'text-slate-500' : 'text-slate-900'
                                                            }`}>
                                                                {step.label}
                                                            </span>
                                                            {isCurrent && (
                                                                <motion.div 
                                                                    layoutId="active-node-indicator"
                                                                    className="w-1.5 h-1.5 bg-gold-bright rounded-full shadow-gold-glow"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* ── FINANCIAL FLUX ── */}
                                    <div className="grid lg:grid-cols-12 gap-10 sm:gap-16 pt-12 sm:pt-20 border-t border-white/5 items-stretch">
                                        <div className="lg:col-span-7 space-y-12">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-[2px] bg-white/10"></div>
                                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] italic leading-none">Fiscal Intelligence Unit</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                                                <div className="p-6 sm:p-10 bg-white/[0.02] border border-white/5 rounded-[2rem] sm:rounded-[3rem] shadow-inner group/val hover:bg-white/[0.04] transition-all">
                                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] block mb-2 sm:mb-4 italic group-hover/val:text-gold-bright transition-colors">Gross Valuation</span>
                                                    <span className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter truncate font-epilogue">{formatCurrency(job.total)}</span>
                                                </div>
                                                <div className="p-6 sm:p-10 bg-white/[0.02] border border-white/5 rounded-[2rem] sm:rounded-[3rem] shadow-inner group/val hover:bg-white/[0.04] transition-all">
                                                    <span className="text-[9px] sm:text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] block mb-2 sm:mb-4 italic group-hover/val:text-emerald-500 transition-colors">Flux Injected</span>
                                                    <span className="text-3xl sm:text-5xl font-black text-emerald-500 italic tracking-tighter truncate font-epilogue">{formatCurrency(job.abono)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className={`p-8 sm:p-10 lg:p-14 rounded-[2.5rem] sm:rounded-[3.5rem] border-2 relative overflow-hidden group/saldo h-fit transition-all duration-1000 ${job.saldo > 0 ? 'bg-rose-500/[0.03] border-rose-500/20 shadow-glow-rose/10' : 'bg-emerald-500/[0.03] border-emerald-500/20 shadow-glow-emerald/10'}`}>
                                                <div className={`absolute top-0 right-0 p-8 sm:p-12 opacity-[0.02] group-hover/saldo:opacity-10 transition-all duration-1000 scale-125 ${job.saldo > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    <WalletIcon className="w-32 h-32 sm:w-40 sm:h-40" />
                                                </div>
                                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-10">
                                                    <div className="space-y-2 sm:space-y-4 text-center md:text-left">
                                                        <span className={`text-[10px] sm:text-[12px] font-black uppercase tracking-[0.8em] block mb-1 sm:mb-2 italic ${job.saldo > 0 ? 'text-rose-500' : 'text-emerald-500 animate-pulse'}`}>
                                                            {job.saldo > 0 ? 'Residual Credit' : 'Balance Finalized'}
                                                        </span>
                                                        <span className={`text-5xl sm:text-7xl lg:text-8xl font-black italic tracking-tighter text-glow truncate font-epilogue ${job.saldo > 0 ? 'text-white' : 'text-emerald-400'}`}>
                                                            {formatCurrency(job.saldo)}
                                                        </span>
                                                    </div>
                                                    {job.saldo > 0 && (
                                                        <button 
                                                            onClick={() => handleGeneratePaymentLink(job)}
                                                            className="px-16 py-8 bg-white text-black rounded-[2rem] font-black text-[12px] uppercase tracking-[0.6em] flex items-center justify-center gap-5 hover:bg-gold-bright transition-all duration-[1.5s] shadow-luxury active:scale-95 group/pay italic"
                                                        >
                                                            INJECT ASSET <ArrowRightIcon className="w-6 h-6 group-hover/pay:translate-x-3 transition-transform" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lg:col-span-5 flex flex-col gap-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-[2px] bg-white/10"></div>
                                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.6em] italic leading-none">Extraction Point</p>
                                            </div>
                                            <div className="flex-1 bg-black/40 border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden flex flex-col justify-between group/loc hover:border-liquid-gold/30 transition-all duration-1000 shadow-2xl">
                                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover/loc:opacity-10 transition-all duration-1000 scale-150">
                                                    <MapPinIcon className="w-48 h-48 text-liquid-gold" />
                                                </div>
                                                
                                                <div className="space-y-8 relative z-10">
                                                    <div className="w-20 h-20 bg-white/[0.03] border-2 border-white/5 rounded-[2rem] flex items-center justify-center group-hover/loc:border-liquid-gold/40 transition-all duration-1000">
                                                        <MapPinIcon className="w-10 h-10 text-liquid-gold animate-bounce-slow"/>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <h4 className="text-4xl font-black text-white uppercase tracking-tighter italic">ATELIER PASAJE</h4>
                                                        <p className="text-lg text-slate-500 font-medium leading-relaxed italic uppercase tracking-tight">
                                                            Calle Colón e/ Sucre y Rocafuerte.<br/>Sect: 07-01-05 • Oro.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-14 space-y-5 relative z-10">
                                                    <button 
                                                        onClick={() => window.open('https://wa.me/593993083943')} 
                                                        className="w-full py-6 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.5em] hover:bg-emerald-500 hover:text-white transition-all duration-700 flex items-center justify-center gap-4 italic shadow-inner"
                                                    >
                                                        <MessageCircleIcon className="w-6 h-6"/> TERMINAL UPLINK
                                                    </button>
                                                    <button 
                                                        onClick={() => window.open('https://maps.app.goo.gl/3Yc1Y4jM8R6v4jA87')}
                                                        className="w-full py-6 bg-white/5 border-2 border-white/5 text-slate-800 hover:text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.5em] hover:bg-white/10 transition-all duration-700 flex items-center justify-center gap-4 italic"
                                                    >
                                                        <MapPinIcon className="w-5 h-5"/> COORDINATES
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
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
