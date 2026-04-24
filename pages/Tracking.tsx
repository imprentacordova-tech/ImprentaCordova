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
    const [voiceStatus, setVoiceStatus] = useState('Standby...');
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
                msg: `${log.estado.toUpperCase()} BY_${log.usuario.toUpperCase()}`,
                type: 'process'
            }));
            setTerminalLogs([
                { time: 'INIT', msg: 'SECURE_UPLINK_SYNCED', type: 'system' },
                { time: 'AUTH', msg: `NODE_ID_${currentJob.orden}_ACTIVE`, type: 'security' },
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
        setSearching(true);
        setError('');
        try {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);
            if (isUUID) {
                const { data: orderMatches } = await supabase.from('trabajos').select('*').eq('id', cleanQuery);
                if (orderMatches && orderMatches.length > 0) {
                    setFoundJobs(orderMatches as any);
                    setSelectedJobId(orderMatches[0].id);
                    setSearching(false);
                    return;
                }
            }
            const { data: matchedClients } = await supabase.from('clientes').select('id').or(`nombre.ilike.%${cleanQuery}%,cedula.eq.${cleanQuery},ruc.eq.${cleanQuery}`);
            if (matchedClients && matchedClients.length > 0) {
                const clientIds = matchedClients.map(c => c.id);
                const { data: clientJobs } = await supabase.from('trabajos').select('*').in('cliente_id', clientIds).order('orden', { ascending: false });
                if (clientJobs && clientJobs.length > 0) {
                    setFoundJobs(clientJobs as any);
                    setSelectedJobId(clientJobs[0].id);
                } else setError('NO_RECORDS_FOR_CLIENT');
            } else if (!isUUID) setError('LINK_NOT_FOUND');
            else setError('ID_INVALID');
        } catch (err) { setError('LINK_FAILURE'); } finally { setSearching(false); }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearchLogic(searchQuery);
    };

    const handleAprobarArte = async (trabajoId: string) => {
        if (!window.confirm("¿Confirma que el diseño es correcto?")) return;
        try {
            const { error } = await supabase.from('trabajos').update({ arte_aprobado: true }).eq('id', trabajoId);
            if (error) throw error;
            setFoundJobs(prev => prev.map(j => j.id === trabajoId ? { ...j, arte_aprobado: true } : j));
        } catch (e) { alert("Error al aprobar."); }
    };

    const handleGeneratePaymentLink = (job: Trabajo) => {
        const message = `*ORDEN #${job.orden}*\nSaldo: ${formatCurrency(job.saldo)}\n\n*DATOS BANCARIOS:*\n🏦 Banco Pichincha\n💳 Cta: 123456789\n👤 Imprenta Córdova`;
        window.open(`https://wa.me/593993083943?text=${encodeURIComponent(message)}`, '_blank');
    };

    const startVoiceTracking = async () => {
        if (!foundJobs.length) return;
        setIsVoiceActive(true);
        setVoiceStatus("Linking...");
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
                        setVoiceStatus("Listening...");
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
                    onclose: () => stopVoiceTracking()
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: { parts: [{ text: `Asistente de Imprenta Córdova. Contexto: ${jobContext}. Sé breve y elegante.` }] }
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

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        setMousePos({ x: (clientX / window.innerWidth - 0.5) * 40, y: (clientY / window.innerHeight - 0.5) * 40 });
    };

    return (
        <div onMouseMove={handleMouseMove} className="h-screen bg-[#020202] text-slate-400 font-sans selection:bg-liquid-gold selection:text-black overflow-hidden flex flex-col relative">
            <SEO title="Elite Tracker | Imprenta Córdova" description="Panel de seguimiento de alta fidelidad para clientes exclusivos." />
            <Navbar />

            {/* Cinematic Layer */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.1),transparent_70%)]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)`, backgroundSize: '60px 60px' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.02),transparent_50%)] animate-pulse-slow" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col p-4 lg:p-6 gap-4 max-w-[1800px] mx-auto w-full overflow-hidden">
                {/* Search Bar HUD */}
                <div className="flex items-center justify-center">
                    <form onSubmit={handleSearch} className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-8 py-3 rounded-full backdrop-blur-2xl focus-within:border-liquid-gold/40 transition-all group w-full max-w-2xl shadow-2xl">
                        <SearchIcon className={`w-5 h-5 ${searching ? 'text-liquid-gold animate-spin' : 'text-slate-600'}`} />
                        <input 
                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="VINCULAR_ORDEN_POR_ID_O_CEDULA..."
                            className="bg-transparent border-none p-0 text-[10px] font-black text-white placeholder:text-slate-800 focus:ring-0 uppercase tracking-[0.4em] w-full italic"
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-slate-800 uppercase tracking-widest hidden sm:block">SECURE_LINK</span>
                            <div className="w-1.5 h-1.5 bg-liquid-gold rounded-full shadow-gold-glow animate-pulse" />
                        </div>
                    </form>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
                    {/* Main Console Hub */}
                    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                        {currentJob ? (
                            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                                {/* Visual Asset Console */}
                                <div className="col-span-12 lg:col-span-8 bg-white/[0.01] border border-white/5 rounded-[4rem] relative overflow-hidden flex flex-col group shadow-2xl">
                                    <div className="absolute top-8 left-10 flex items-center gap-4 z-20">
                                        <div className="bg-black/80 px-4 py-2 rounded-2xl border border-white/5 backdrop-blur-md">
                                            <span className="text-[10px] font-black text-white tracking-[0.4em] uppercase italic">#{String(currentJob.orden).padStart(6, '0')}</span>
                                        </div>
                                        <div className="h-[1px] w-20 bg-white/5" />
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.5em]">{currentJob.id}</span>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center p-12 relative">
                                        <AnimatePresence mode="wait">
                                            {currentJob.fotoOriginalUrl ? (
                                                <motion.div key={currentJob.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative max-h-full">
                                                    <img src={currentJob.fotoOriginalUrl} className="max-h-[50vh] object-contain rounded-[3rem] shadow-2xl relative z-10 border border-white/10" alt="Blueprint" />
                                                    <div className="absolute inset-0 bg-liquid-gold/5 blur-3xl -z-10 animate-pulse" />
                                                    {/* Scanning Effect */}
                                                    <div className="absolute inset-x-0 h-[2px] bg-liquid-gold/40 shadow-gold-glow z-20 top-0 animate-scan-y opacity-0 group-hover:opacity-100" />
                                                </motion.div>
                                            ) : (
                                                <div className="text-center space-y-4 opacity-20">
                                                    <div className="w-20 h-20 border-2 border-dashed border-slate-500 rounded-full mx-auto flex items-center justify-center">
                                                        <BoxIcon className="w-8 h-8" />
                                                    </div>
                                                    <p className="text-[9px] font-black uppercase tracking-[0.8em]">Awaiting_Asset_Uplink</p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Action Deck */}
                                    <div className="p-8 bg-black/40 backdrop-blur-xl border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-8">
                                            {statusSteps.map((step, idx) => {
                                                const stepIdx = statusSteps.findIndex(s => s.value === currentJob?.estado);
                                                const isCompleted = idx <= stepIdx;
                                                const isCurrent = currentJob?.estado === step.value;
                                                return (
                                                    <div key={step.value} className="flex flex-col items-center gap-2">
                                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-700 ${isCurrent ? 'bg-liquid-gold border-liquid-gold text-black shadow-gold-glow' : isCompleted ? 'bg-white/10 border-white/10 text-liquid-gold' : 'bg-transparent border-white/5 text-slate-800'}`}>
                                                            <step.icon className="w-5 h-5" />
                                                        </div>
                                                        <span className={`text-[7px] font-black uppercase tracking-widest ${isCurrent ? 'text-white' : 'text-slate-700'}`}>{step.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-4">
                                            {currentJob.estado === TrabajoEstado.EN_DISENO && !currentJob.arte_aprobado && (
                                                <motion.button 
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleAprobarArte(currentJob.id)}
                                                    className="bg-emerald-500 text-black px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] italic shadow-lg shadow-emerald-500/20"
                                                >
                                                    Aprobar_Arte
                                                </motion.button>
                                            )}
                                            {currentJob.saldo > 0 && (
                                                <motion.button 
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleGeneratePaymentLink(currentJob)}
                                                    className="bg-liquid-gold text-black px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] italic shadow-gold-glow"
                                                >
                                                    Pagar_Saldo
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Manifest & Terminal Console */}
                                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                                    {/* Product Manifest */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-8 backdrop-blur-2xl flex flex-col gap-6 shadow-2xl">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black text-liquid-gold uppercase tracking-[0.5em] italic">Protocol_Manifest</span>
                                                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{currentJob.subtipo}</h3>
                                            </div>
                                            <div className="bg-white/5 px-3 py-1 rounded-full text-[8px] font-mono text-slate-500">REV_01.26</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-black/40 rounded-[2rem] border border-white/5">
                                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block mb-1">Inversión</span>
                                                <div className="text-xl font-black text-white">{formatCurrency(currentJob.total)}</div>
                                            </div>
                                            <div className="p-4 bg-black/40 rounded-[2rem] border border-white/5">
                                                <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block mb-1">Saldo</span>
                                                <div className="text-xl font-black text-liquid-gold">{formatCurrency(currentJob.saldo)}</div>
                                            </div>
                                        </div>

                                        {parsedSpecs && (
                                            <div className="space-y-3">
                                                <span className="text-[7px] font-black text-slate-700 uppercase tracking-[0.4em] block mb-2 px-2">Industrial_Specs</span>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {[
                                                        { label: 'Sustrato', value: parsedSpecs.tipoPapel },
                                                        { label: 'Dimensión', value: parsedSpecs.tamano },
                                                        { label: 'Duplicados', value: parsedSpecs.copias },
                                                        { label: 'Folio', value: parsedSpecs.numerado }
                                                    ].map(spec => (
                                                        <div key={spec.label} className="flex items-center justify-between px-4 py-2 bg-white/[0.01] border border-white/5 rounded-2xl group hover:border-liquid-gold/20 transition-colors">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase">{spec.label}</span>
                                                            <span className="text-[9px] font-bold text-white uppercase italic tracking-widest">{spec.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="p-4 bg-liquid-gold/[0.02] border border-liquid-gold/10 rounded-3xl mt-2">
                                            <span className="text-[7px] font-black text-liquid-gold uppercase tracking-widest block mb-1">Memorandum</span>
                                            <p className="text-[9px] font-medium text-slate-400 italic leading-relaxed">{cleanDetalle}</p>
                                        </div>
                                    </div>

                                    {/* Real-time Telemetry Console */}
                                    <div className="flex-1 bg-black/60 border border-white/5 rounded-[3.5rem] p-6 flex flex-col min-h-0 shadow-2xl group/console">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <TerminalIcon className="w-4 h-4 text-liquid-gold animate-pulse" />
                                                <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] italic">Live_Telemetry</span>
                                            </div>
                                            <div className="text-[8px] font-mono text-slate-800">UPLINK_0.98</div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[9px] space-y-3 pr-2">
                                            {terminalLogs.map((log, i) => (
                                                <div key={i} className="flex gap-4 group/log">
                                                    <span className="text-slate-800 font-bold shrink-0">[{log.time}]</span>
                                                    <span className="text-slate-600 group-hover/log:text-white transition-colors uppercase tracking-widest">{log.msg}</span>
                                                </div>
                                            ))}
                                            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="text-liquid-gold font-bold uppercase tracking-widest pt-4 border-t border-white/5 italic">
                                                {`> STATUS: ${currentJob.estado.replace('_', ' ')}`}
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-12">
                                <div className="relative">
                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 60, ease: "linear" }} className="w-80 h-80 border border-white/5 rounded-full" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-32 h-32 bg-liquid-gold/10 rounded-full blur-[80px] animate-pulse" />
                                        <CpuIcon className="w-16 h-16 text-liquid-gold/20" />
                                    </div>
                                </div>
                                <div className="text-center space-y-3">
                                    <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">Initialize_Link</h2>
                                    <p className="text-[11px] text-slate-800 uppercase tracking-[1em] italic">Secure_Uplink_Pending_Authentication</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Voice Command Console */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
                <motion.div layout className={`rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] border backdrop-blur-3xl overflow-hidden transition-all duration-700 ${isVoiceActive ? 'bg-black/95 border-liquid-gold/50 p-8 w-[400px]' : 'bg-liquid-gold border-transparent p-4'}`}>
                    <AnimatePresence mode="wait">
                        {isVoiceActive ? (
                            <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-liquid-gold rounded-full shadow-gold-glow animate-ping" />
                                        <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.4em] italic">Voice_Link Active</span>
                                    </div>
                                    <button onClick={stopVoiceTracking} className="p-2 hover:bg-white/10 rounded-2xl transition-colors"><XIcon className="w-5 h-5 text-slate-600" /></button>
                                </div>
                                <div className="h-16 flex items-end justify-center gap-2.5 px-8">
                                    {[0.3, 0.7, 0.4, 0.9, 0.5, 1.0, 0.6, 0.8, 0.4, 0.6].map((d, i) => (
                                        <motion.div key={i} animate={{ height: [8, 56 * d, 8] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.05 }} className="w-2 bg-liquid-gold rounded-full" />
                                    ))}
                                </div>
                                <div className="text-[11px] font-mono text-white/50 italic text-center px-6 leading-relaxed uppercase tracking-wider">{voiceStatus}</div>
                            </motion.div>
                        ) : (
                            <motion.button 
                                key="inactive" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startVoiceTracking} 
                                className="text-black flex items-center gap-4 px-6 py-2"
                            >
                                <MicIcon className="w-6 h-6" />
                                {foundJobs.length > 0 && <span className="text-[11px] font-black uppercase tracking-[0.5em] italic">Command_Center</span>}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <style>{`
                @keyframes scan-y { 0% { transform: translateY(-100%); } 100% { transform: translateY(800%); } }
                .animate-scan-y { animation: scan-y 6s linear infinite; }
                .animate-pulse-slow { animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                * { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
            `}</style>
        </div>
    );
};


export default TrackingPage;

