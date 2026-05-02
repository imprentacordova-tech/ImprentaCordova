import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trabajo, TrabajoEstado } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { 
    SearchIcon, ClockIcon, 
    PrinterIcon, PaletteIcon, BoxIcon, MessageCircleIcon, MapPinIcon, 
    Loader2Icon, EyeIcon, CheckBadgeIcon, CordovaLogo,
    MicIcon, XIcon, ArrowRightIcon, BoltIcon, ActivityIcon, CpuIcon, GlobeAltIcon,
    LayersIcon, CreditCardIcon, ShieldCheckIcon, TerminalIcon, ZapIcon, HashIcon,
    SparklesIcon, QrCodeIcon, HeadphonesIcon, WhatsAppIcon, ChevronRightIcon,
    InfoIcon, FileTextIcon, MonitorIcon, HomeIcon, FingerPrintIcon
} from '../components/Icons';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { supabase } from '../services/supabase';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';

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
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
        
        const numericQuery = cleanQuery.replace(/[-\s]/g, '');
        
        setSearching(true);
        setError('');
        setFoundJobs([]);
        
        try {
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
                    setError('NO SE ENCONTRARON TRABAJOS');
                }
            } else {
                setError('IDENTIFICACIÓN NO RECONOCIDA');
            }
        } catch (err) { 
            console.error(err);
            setError('FALLO EN LA TELEMETRÍA DE RED'); 
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
        const message = `*ORDEN #${job.orden}*\nSaldo: ${formatCurrency(job.saldo)}\n\n*SOLICITUD DE LIQUIDACIÓN:*`;
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
                        scriptProcessor.onaudioprocess = (e: any) => {
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
                        const base64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
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
        <div className="min-h-screen bg-brand-light font-sans selection:bg-brand-blue selection:text-white overflow-x-hidden relative flex flex-col">
            <SEO title="Precision Tracking | Imprenta Córdova" description="Rastreador de alta fidelidad para proyectos industriales y comerciales." />
            
            <PublicNavbar />
            
            {/* --- FONDO MINIMALISTA --- */}
            <div className="fixed inset-0 bg-architect-grid opacity-[0.03] pointer-events-none z-0" />
            <div className="fixed inset-0 bg-gradient-to-b from-white via-brand-light to-white pointer-events-none z-0" />
            <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.02] bg-noise mix-blend-overlay" />
            
            {/* --- PARTÍCULAS AZULES --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -100, 0],
                            x: [0, Math.random() * 40 - 20, 0],
                            opacity: [0.1, 0.3, 0.1],
                            scale: [1, 1.3, 1]
                        }}
                        transition={{
                            duration: 12 + Math.random() * 8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5
                        }}
                        className="absolute w-1 h-1 bg-brand-blue rounded-full blur-[1px]"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>

            {/* --- ESCÁNER DE PRECISIÓN --- */}
            <div 
                className="fixed w-[300px] h-[300px] pointer-events-none z-[110] border-[0.5px] border-brand-blue/10 rounded-full hidden lg:block transition-transform duration-700 ease-out"
                style={{ 
                    left: mousePosition.x - 150,
                    top: mousePosition.y - 150,
                    background: 'radial-gradient(circle, rgba(14,165,233,0.03) 0%, transparent 70%)',
                }}
            >
                <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-brand-blue/20 animate-scan-slow" />
                <div className="absolute top-0 left-1/2 w-[0.5px] h-full bg-brand-blue/20 animate-scan-slow" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col pt-32 p-4 lg:p-12 gap-12 max-w-[1600px] mx-auto w-full pb-32">
                
                {/* Header */}
                <div className="text-center space-y-6 max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-4 px-6 py-2 bg-brand-blue/5 border border-brand-blue/10 rounded-full">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-pulse shadow-blue-glow" />
                            <div className="w-1.5 h-1.5 bg-brand-blue/40 rounded-full animate-pulse delay-75" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.6em] text-brand-blue">CORDOVA_NODE_ACTIVE</span>
                    </motion.div>
                    <h1 className="text-5xl lg:text-8xl font-black tracking-tighter text-slate-900 uppercase leading-none">
                        TRACKING_<span className="text-brand-blue shadow-blue-glow-soft">SYSTEM</span>
                    </h1>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col items-center gap-6">
                    <motion.form 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onSubmit={handleSearch} 
                        className="flex items-center gap-6 bg-white border border-slate-200 px-8 py-5 rounded-[2.5rem] focus-within:border-brand-blue/40 focus-within:ring-8 focus-within:ring-brand-blue/5 transition-all group w-full max-w-3xl shadow-xl relative overflow-hidden"
                    >
                        <SearchIcon className={`w-6 h-6 ${searching ? 'text-brand-blue animate-spin' : 'text-slate-400 group-focus-within:text-brand-blue'} transition-colors`} />
                        <input 
                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="ORDEN, CÉDULA O RUC..."
                            className="bg-transparent border-none p-0 text-base font-bold text-slate-900 placeholder:text-slate-300 focus:ring-0 uppercase tracking-widest w-full"
                        />
                        <button type="submit" className="bg-brand-blue text-white px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all duration-500 shadow-lg active:scale-95">Consultar</button>
                    </motion.form>
                    
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-rose-500 text-[10px] font-bold uppercase tracking-[0.4em] bg-rose-50 px-6 py-2 rounded-full border border-rose-100">
                            {error}
                        </motion.div>
                    )}
                </div>

                <div className="flex-1 flex flex-col gap-12">
                    <AnimatePresence mode="wait">
                        {currentJob ? (
                            <motion.div 
                                key={currentJob.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                className="grid grid-cols-12 gap-8 lg:gap-12"
                            >
                                {/* Visual Asset Console */}
                                <div className="col-span-12 lg:col-span-7 bg-white border border-slate-200 rounded-[3rem] overflow-hidden flex flex-col group shadow-2xl relative">
                                    <div className="absolute top-10 left-10 flex items-center gap-4 z-20">
                                        <div className="bg-brand-blue/5 border border-brand-blue/10 px-5 py-2.5 rounded-2xl text-brand-blue shadow-sm backdrop-blur-md">
                                            <span className="text-[10px] font-black tracking-widest uppercase">ORDEN_{String(currentJob.orden).padStart(6, '0')}</span>
                                        </div>
                                        <div className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                                            {currentJob.estado.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center p-12 lg:p-20 bg-slate-50 min-h-[500px] relative overflow-hidden group">
                                        <div className="absolute inset-0 animate-scan-y bg-gradient-to-b from-transparent via-brand-blue/5 to-transparent h-40 -top-40 z-20 pointer-events-none" />
                                        
                                        <div className="absolute bottom-10 left-10 z-20 opacity-30 group-hover:opacity-60 transition-opacity duration-1000">
                                            <div className="space-y-2 font-mono text-[8px] uppercase tracking-widest text-slate-400 border-l border-brand-blue/30 pl-6">
                                                <p>TECH_SPEC: HIGH_FIDELITY</p>
                                                <p>COLOR_SPACE: PRO_CMYK</p>
                                            </div>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {currentJob.fotoOriginalUrl ? (
                                                <motion.div key={currentJob.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                                                    <img src={currentJob.fotoOriginalUrl} className="max-h-[50vh] object-contain rounded-2xl shadow-2xl relative z-10 border border-white" alt="Job View" />
                                                    <div className="absolute -inset-10 bg-brand-blue/5 blur-[80px] -z-10 group-hover:bg-brand-blue/10 transition-colors duration-1000" />
                                                </motion.div>
                                            ) : (
                                                <div className="text-center space-y-6 opacity-30 group-hover:opacity-50 transition-opacity duration-1000">
                                                    <div className="w-32 h-32 border border-dashed border-slate-300 rounded-[2.5rem] mx-auto flex items-center justify-center">
                                                        <MonitorIcon className="w-12 h-12 text-slate-400" />
                                                    </div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.8em] text-slate-400">WAITING_FOR_ASSETS</p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Status Stepper */}
                                    <div className="p-10 bg-white border-t border-slate-100 flex flex-col xl:flex-row items-center justify-between gap-10">
                                        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar w-full xl:w-auto pb-4 xl:pb-0">
                                            {statusSteps.map((step, idx) => {
                                                const stepIdx = statusSteps.findIndex(s => s.value === currentJob?.estado);
                                                const isCompleted = idx <= stepIdx;
                                                const isCurrent = currentJob?.estado === step.value;
                                                return (
                                                    <div key={step.value} className="flex flex-col items-center gap-3 shrink-0">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-700 ${isCurrent ? 'bg-brand-blue border-brand-blue text-white shadow-blue-glow scale-110' : isCompleted ? 'bg-brand-blue/5 border-brand-blue/20 text-brand-blue' : 'bg-transparent border-slate-100 text-slate-300'}`}>
                                                            <step.icon className="w-6 h-6" />
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isCurrent ? 'text-brand-blue' : 'text-slate-400'}`}>{step.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-4 w-full xl:w-auto">
                                            {currentJob.estado === TrabajoEstado.EN_DISENO && !currentJob.arteAprobado && (
                                                <motion.button 
                                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleAprobarArte(currentJob.id)}
                                                    className="flex-1 xl:flex-none bg-emerald-500 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10"
                                                >
                                                    Aprobar Arte
                                                </motion.button>
                                            )}
                                            <motion.button 
                                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                onClick={() => handleGeneratePaymentLink(currentJob)}
                                                className="flex-1 xl:flex-none bg-slate-900 text-white px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-blue transition-all shadow-xl"
                                            >
                                                Soporte Directo
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>

                                {/* Manifest & Console */}
                                <div className="col-span-12 lg:col-span-5 flex flex-col gap-8 lg:gap-12">
                                    {/* Product Manifest */}
                                    <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl flex flex-col gap-8 relative overflow-hidden group/manifest">
                                        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/[0.03] via-transparent to-transparent opacity-0 group-hover/manifest:opacity-100 transition-opacity duration-1000" />
                                        
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">MANIFEST_SPEC</span>
                                                    {currentJob.esSRI && (
                                                        <span className="bg-brand-blue/10 text-brand-blue text-[8px] font-black px-3 py-1 rounded-lg border border-brand-blue/20">VALID_SRI</span>
                                                    )}
                                                </div>
                                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{currentJob.subtipo}</h3>
                                            </div>
                                            <div className="bg-slate-50 px-4 py-2 rounded-xl text-[8px] font-mono text-slate-400 font-bold uppercase tracking-widest">SECURE_LINK</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 relative z-10">
                                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group/stat hover:border-brand-blue/20 transition-all duration-500">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Presupuesto</span>
                                                <div className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(currentJob.total)}</div>
                                            </div>
                                            <div className="p-6 bg-brand-blue/5 rounded-3xl border border-brand-blue/10 group/stat hover:border-brand-blue/30 transition-all duration-500">
                                                <span className="text-[9px] font-bold text-brand-blue/60 uppercase tracking-widest block mb-2">Saldo Pendiente</span>
                                                <div className="text-2xl font-black text-brand-blue tracking-tighter">{formatCurrency(currentJob.saldo)}</div>
                                            </div>
                                        </div>

                                        {parsedSpecs && (
                                            <div className="space-y-4 relative z-10">
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] block mb-1 px-2">TECHNICAL_MATRIX</span>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {[
                                                        { label: 'Sustrato', value: parsedSpecs.tipoPapel, icon: LayersIcon },
                                                        { label: 'Formato', value: parsedSpecs.tamano, icon: MapPinIcon },
                                                        { label: 'Volumen', value: parsedSpecs.copias, icon: HashIcon },
                                                        ...(currentJob.esSRI ? [
                                                            { label: 'Establecimiento', value: currentJob.establecimiento, icon: GlobeAltIcon },
                                                            { label: 'Trámite', value: currentJob.actividadSeleccionada, icon: ShieldCheckIcon }
                                                        ] : [])
                                                    ].filter(s => s.value).map(spec => (
                                                        <div key={spec.label} className="flex items-center justify-between px-6 py-4 bg-slate-50/50 rounded-2xl group hover:bg-white hover:border-brand-blue/20 border border-slate-100 transition-all duration-500">
                                                            <div className="flex items-center gap-4">
                                                                <spec.icon className="w-4 h-4 text-slate-400 group-hover:text-brand-blue transition-colors" />
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-slate-600">{spec.label}</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{spec.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl relative z-10 group-hover/manifest:bg-white group-hover/manifest:border-brand-blue/10 transition-all duration-700">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-3">PRODUCTION_NOTES</span>
                                            <p className="text-sm font-medium text-slate-500 leading-relaxed uppercase tracking-wide">{cleanDetalle || "ANALYZING_JOB_PARAMETERS..."}</p>
                                        </div>
                                    </div>

                                    {/* Telemetry Console */}
                                    <div className="flex-1 bg-slate-900 rounded-[3rem] p-10 flex flex-col min-h-[350px] shadow-2xl relative overflow-hidden group/console">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 blur-[80px] rounded-full opacity-0 group-hover/console:opacity-100 transition-opacity duration-[2s]" />
                                        
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <ActivityIcon className="w-5 h-5 text-brand-blue animate-pulse shadow-blue-glow" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TELEMETRY_ENGINE_V4</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse shadow-blue-glow" />
                                                <div className="w-2 h-2 rounded-full bg-brand-blue/30 animate-pulse delay-75" />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[11px] space-y-4 pr-4 relative z-10">
                                            {terminalLogs.map((log, i) => (
                                                <div key={i} className="flex gap-4 group/log hover:translate-x-2 transition-transform duration-500">
                                                    <span className="text-slate-700 font-bold shrink-0">[{log.time}]</span>
                                                    <span className="text-slate-400 group-hover/log:text-white transition-colors uppercase tracking-widest">{log.msg}</span>
                                                </div>
                                            ))}
                                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 3 }} className="text-brand-blue font-black uppercase tracking-widest pt-6 border-t border-white/5">
                                                {`> STATUS_NODE: ${currentJob.estado.toUpperCase()}`}
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex-1 flex flex-col items-center justify-center py-32"
                            >
                                <div className="relative mb-16 group">
                                    <motion.div 
                                        animate={{ rotate: 360 }} 
                                        transition={{ repeat: Infinity, duration: 60, ease: "linear" }} 
                                        className="w-80 h-80 border border-dashed border-slate-200 rounded-full" 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-48 h-48 bg-brand-blue/5 rounded-full blur-[100px] animate-pulse" />
                                        <GlobeAltIcon className="w-20 h-20 text-brand-blue/20 group-hover:text-brand-blue/40 transition-colors duration-1000" />
                                    </div>
                                    
                                    <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }} className="absolute inset-0">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-brand-blue rounded-full shadow-blue-glow" />
                                    </motion.div>
                                </div>
                                <div className="text-center space-y-6">
                                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">A_LA_ESPERA</h2>
                                    <p className="text-[11px] text-slate-400 uppercase tracking-[1em] pl-6 font-bold">Ingrese_parámetros_de_búsqueda</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Voice Command Console */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]">
                <motion.div 
                    layout 
                    className={`rounded-[3rem] shadow-2xl border transition-all duration-700 ease-in-out ${isVoiceActive ? 'bg-slate-900 border-brand-blue/30 p-10 w-[95vw] md:w-[500px]' : 'bg-brand-blue border-transparent p-6'}`}
                >
                    <AnimatePresence mode="wait">
                        {isVoiceActive ? (
                            <motion.div key="active" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2.5 h-2.5 bg-brand-blue rounded-full shadow-blue-glow animate-ping" />
                                        <span className="text-[11px] font-black text-brand-blue uppercase tracking-widest">GEMINI_VOICE_ACTIVE</span>
                                    </div>
                                    <button onClick={stopVoiceTracking} className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-xl transition-all group">
                                        <XIcon className="w-5 h-5 text-white group-hover:text-rose-500 transition-colors" />
                                    </button>
                                </div>
                                <div className="h-20 flex items-end justify-center gap-3 px-10">
                                    {[0.4, 0.8, 0.5, 1.1, 0.6, 0.9, 0.4, 0.7].map((d, i) => (
                                        <motion.div key={i} animate={{ height: [12, 70 * d, 12] }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }} className="w-2.5 bg-brand-blue rounded-full shadow-blue-glow-soft" />
                                    ))}
                                </div>
                                <div className="text-[11px] font-bold text-slate-500 text-center px-8 leading-relaxed uppercase tracking-widest">{voiceStatus}</div>
                            </motion.div>
                        ) : (
                            <motion.button 
                                key="inactive" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startVoiceTracking} 
                                className="text-white flex items-center gap-4 px-6"
                            >
                                <HeadphonesIcon className="w-6 h-6" />
                                {foundJobs.length > 0 && <span className="text-[11px] font-black uppercase tracking-widest">ASISTENTE IA</span>}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <style>{`
                @keyframes scan-y { 0% { transform: translateY(-100%); } 100% { transform: translateY(600%); } }
                .animate-scan-y { animation: scan-y 8s linear infinite; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .shadow-blue-glow { box-shadow: 0 0 30px rgba(14,165,233,0.3); }
                .shadow-blue-glow-soft { box-shadow: 0 0 15px rgba(14,165,233,0.1); }
                * { transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
                .bg-noise { background-image: url('https://grainy-gradients.vercel.app/noise.svg'); }
            `}</style>
        </div>
    );
};

export default TrackingPage;
