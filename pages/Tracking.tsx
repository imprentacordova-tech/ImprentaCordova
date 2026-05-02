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
        <div className="min-h-screen bg-brand-dark font-sans selection:bg-liquid-gold selection:text-brand-dark overflow-x-hidden relative flex flex-col">
            <SEO title="Elite Tracking | Imprenta Córdova" description="Rastreador holográfico de alta precisión para proyectos industriales." />
            
            <PublicNavbar />
            
            {/* --- FONDO ELITE --- */}
            <div className="fixed inset-0 bg-architect-grid opacity-[0.05] pointer-events-none z-0" />
            <div className="fixed inset-0 bg-obsidian-liquid pointer-events-none z-0" />
            <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />
            
            {/* --- PARTÍCULAS ORO --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -100, 0],
                            x: [0, Math.random() * 40 - 20, 0],
                            opacity: [0.05, 0.15, 0.05],
                            scale: [1, 1.3, 1]
                        }}
                        transition={{
                            duration: 12 + Math.random() * 8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: Math.random() * 5
                        }}
                        className="absolute w-1 h-1 bg-liquid-gold rounded-full blur-[1px]"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`
                        }}
                    />
                ))}
            </div>

            {/* --- ESCÁNER DINÁMICO --- */}
            <div 
                className="fixed w-[300px] h-[300px] pointer-events-none z-[110] border-[0.5px] border-liquid-gold/10 rounded-full hidden lg:block transition-transform duration-700 ease-out"
                style={{ 
                    left: mousePosition.x - 150,
                    top: mousePosition.y - 150,
                    background: 'radial-gradient(circle, rgba(212,175,55,0.02) 0%, transparent 70%)',
                }}
            >
                <div className="absolute top-1/2 left-0 w-full h-[0.5px] bg-liquid-gold/20 animate-scan-slow" />
                <div className="absolute top-0 left-1/2 w-[0.5px] h-full bg-liquid-gold/20 animate-scan-slow" />
            </div>

            {/* --- NAVEGACIÓN --- */}
            <div className="fixed top-8 left-0 right-0 z-[150] px-6">
                <motion.nav 
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="container mx-auto max-w-5xl bg-brand-dark/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] py-5 px-10 shadow-2xl flex justify-between items-center relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/5 via-transparent to-liquid-gold/5 opacity-30" />
                    
                    <Link to="/" className="flex items-center gap-6 group relative z-10">
                        <div className="relative">
                            <CordovaLogo className="h-10 w-auto brightness-0 invert group-hover:scale-110 transition-all duration-1000" />
                            <div className="absolute -inset-2 bg-liquid-gold/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-xl font-black text-white tracking-tighter italic">CÓRDOVA<span className="text-liquid-gold">.</span></span>
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.6em] italic">Tracking Node</span>
                        </div>
                    </Link>
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <Link to="/" className="p-4 bg-white/5 rounded-2xl border border-white/5 text-slate-400 hover:text-white transition-all">
                            <HomeIcon className="w-6 h-6" />
                        </Link>
                        <Link to="/login" className="px-8 py-4 bg-liquid-gold text-brand-dark rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-gold-glow italic">
                            Elite Access
                        </Link>
                    </div>
                </motion.nav>
            </div>

            <div className="relative z-10 flex-1 flex flex-col pt-48 p-4 lg:p-12 gap-12 max-w-[1600px] mx-auto w-full pb-32">
                
                {/* Header */}
                <div className="text-center space-y-8 max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-5 px-8 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
                        <div className="flex gap-2">
                            <div className="w-1.5 h-1.5 bg-liquid-gold rounded-full animate-pulse shadow-gold-glow" />
                            <div className="w-1.5 h-1.5 bg-liquid-gold/40 rounded-full animate-pulse delay-75" />
                            <div className="w-1.5 h-1.5 bg-liquid-gold/20 rounded-full animate-pulse delay-150" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-400 italic">CORDOVA_INDUSTRIAL_TRACKER</span>
                    </motion.div>
                    <h1 className="text-6xl lg:text-9xl font-black tracking-tighter text-white uppercase italic leading-none">
                        VÍNCULO_DE_<span className="text-liquid-gold not-italic shadow-gold-glow-soft">PRODUCCIÓN</span>
                    </h1>
                </div>

                {/* Search Bar */}
                <div className="flex flex-col items-center gap-8">
                    <motion.form 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onSubmit={handleSearch} 
                        className="flex items-center gap-8 bg-white/5 border border-white/10 px-10 py-7 rounded-[3rem] focus-within:border-liquid-gold/30 focus-within:ring-4 focus-within:ring-liquid-gold/5 transition-all group w-full max-w-4xl shadow-2xl backdrop-blur-3xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-liquid-gold/[0.02] via-transparent to-transparent pointer-events-none" />
                        <SearchIcon className={`w-8 h-8 ${searching ? 'text-liquid-gold animate-spin' : 'text-slate-500 group-focus-within:text-liquid-gold'} transition-colors`} />
                        <input 
                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="ORDEN, CÉDULA O RUC..."
                            className="bg-transparent border-none p-0 text-lg font-black text-white placeholder:text-slate-700 focus:ring-0 uppercase tracking-[0.4em] w-full italic"
                        />
                        <button type="submit" className="bg-white text-brand-dark px-12 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-liquid-gold transition-all duration-700 shadow-xl active:scale-95 italic">Vincular</button>
                    </motion.form>
                    
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-rose-500 text-[11px] font-black uppercase tracking-[0.5em] bg-rose-500/5 px-8 py-3 rounded-full border border-rose-500/20 backdrop-blur-md italic">
                            {error}
                        </motion.div>
                    )}
                </div>

                <div className="flex-1 flex flex-col gap-14">
                    <AnimatePresence mode="wait">
                        {currentJob ? (
                            <motion.div 
                                key={currentJob.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -40 }}
                                className="grid grid-cols-12 gap-12"
                            >
                                {/* Visual Asset Console */}
                                <div className="col-span-12 lg:col-span-7 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] overflow-hidden flex flex-col group shadow-2xl relative">
                                    <div className="absolute top-12 left-12 flex items-center gap-6 z-20">
                                        <div className="bg-liquid-gold/10 border border-liquid-gold/30 px-6 py-3 rounded-2xl text-liquid-gold shadow-gold-glow-soft backdrop-blur-md">
                                            <span className="text-[11px] font-black tracking-[0.4em] uppercase italic">ORDEN_{String(currentJob.orden).padStart(6, '0')}</span>
                                        </div>
                                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-md italic">
                                            {currentJob.estado.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center p-20 bg-black/40 min-h-[550px] relative overflow-hidden group">
                                        <div className="absolute inset-0 animate-scan-y bg-gradient-to-b from-transparent via-liquid-gold/10 to-transparent h-40 -top-40 z-20 pointer-events-none" />
                                        
                                        <div className="absolute bottom-12 left-12 z-20 opacity-40 group-hover:opacity-80 transition-opacity duration-1000">
                                            <div className="space-y-3 font-mono text-[9px] uppercase tracking-[0.6em] text-slate-400 border-l-2 border-liquid-gold/30 pl-8">
                                                <p>RESOLUTION_TAG: 1440DPI</p>
                                                <p>CHROMATIC_PROFILE: CMYK_ELITE</p>
                                            </div>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {currentJob.fotoOriginalUrl ? (
                                                <motion.div key={currentJob.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                                                    <img src={currentJob.fotoOriginalUrl} className="max-h-[60vh] object-contain rounded-3xl shadow-3xl relative z-10 border border-white/5 grayscale group-hover:grayscale-0 transition-all duration-1000" alt="Blueprint" />
                                                    <div className="absolute -inset-16 bg-liquid-gold/5 blur-[120px] -z-10 group-hover:bg-liquid-gold/10 transition-colors duration-1000" />
                                                </motion.div>
                                            ) : (
                                                <div className="text-center space-y-8 opacity-20 group-hover:opacity-50 transition-opacity duration-1000">
                                                    <div className="w-40 h-40 border-2 border-dashed border-white/10 rounded-[4rem] mx-auto flex items-center justify-center">
                                                        <MonitorIcon className="w-16 h-16 text-white" />
                                                    </div>
                                                    <p className="text-[11px] font-black uppercase tracking-[1em] text-white italic">ESPERANDO_RECURSO_VISUAL</p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Action Deck */}
                                    <div className="p-12 bg-white/5 border-t border-white/10 flex flex-col xl:flex-row items-center justify-between gap-12">
                                        <div className="flex items-center gap-10 overflow-x-auto no-scrollbar w-full xl:w-auto pb-6 xl:pb-0">
                                            {statusSteps.map((step, idx) => {
                                                const stepIdx = statusSteps.findIndex(s => s.value === currentJob?.estado);
                                                const isCompleted = idx <= stepIdx;
                                                const isCurrent = currentJob?.estado === step.value;
                                                return (
                                                    <div key={step.value} className="flex flex-col items-center gap-4 shrink-0">
                                                        <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center border transition-all duration-1000 ${isCurrent ? 'bg-liquid-gold border-liquid-gold text-brand-dark shadow-gold-glow scale-115' : isCompleted ? 'bg-liquid-gold/10 border-liquid-gold/30 text-liquid-gold' : 'bg-transparent border-white/5 text-slate-700'}`}>
                                                            <step.icon className="w-8 h-8" />
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isCurrent ? 'text-liquid-gold' : 'text-slate-600'} italic`}>{step.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-6 w-full xl:w-auto">
                                            {currentJob.estado === TrabajoEstado.EN_DISENO && !currentJob.arteAprobado && (
                                                <motion.button 
                                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleAprobarArte(currentJob.id)}
                                                    className="flex-1 xl:flex-none bg-emerald-500 text-brand-dark px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-lg shadow-emerald-500/20 italic"
                                                >
                                                    Aprobar Arte
                                                </motion.button>
                                            )}
                                            <motion.button 
                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                onClick={() => handleGeneratePaymentLink(currentJob)}
                                                className="flex-1 xl:flex-none bg-white text-brand-dark px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-luxury italic hover:bg-liquid-gold transition-all"
                                            >
                                                Contactar HUB
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>

                                {/* Manifest & Console */}
                                <div className="col-span-12 lg:col-span-5 flex flex-col gap-12">
                                    {/* Product Manifest */}
                                    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 shadow-2xl flex flex-col gap-10 relative overflow-hidden group/manifest">
                                        <div className="absolute inset-0 bg-gradient-to-br from-liquid-gold/[0.05] via-transparent to-transparent opacity-0 group-hover/manifest:opacity-100 transition-opacity duration-1000" />
                                        
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[11px] font-black text-liquid-gold uppercase tracking-[0.6em] italic">MANIFEST_V4_ELITE</span>
                                                    {currentJob.esSRI && (
                                                        <span className="bg-liquid-gold/10 text-liquid-gold text-[9px] font-black px-4 py-1.5 rounded-xl border border-liquid-gold/30 animate-pulse">SRI_VERIFIED</span>
                                                    )}
                                                </div>
                                                <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{currentJob.subtipo}</h3>
                                            </div>
                                            <div className="bg-white/5 px-5 py-2.5 rounded-2xl text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest border border-white/5">HUB_LINK_SECURE</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 relative z-10">
                                            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 group/stat hover:border-liquid-gold/20 transition-all duration-700">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-3 italic">Total Inversión</span>
                                                <div className="text-4xl font-black text-white italic tracking-tighter">{formatCurrency(currentJob.total)}</div>
                                            </div>
                                            <div className="p-8 bg-liquid-gold/5 rounded-[2.5rem] border border-liquid-gold/10 group/stat hover:border-liquid-gold/40 transition-all duration-700">
                                                <span className="text-[10px] font-black text-liquid-gold/60 uppercase tracking-[0.4em] block mb-3 italic">Balance Activo</span>
                                                <div className="text-4xl font-black text-liquid-gold italic tracking-tighter shadow-gold-glow-soft">{formatCurrency(currentJob.saldo)}</div>
                                            </div>
                                        </div>

                                        {parsedSpecs && (
                                            <div className="space-y-6 relative z-10">
                                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.8em] block mb-2 px-4 italic">TECHNICAL_MATRIX</span>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {[
                                                        { label: 'Sustrato', value: parsedSpecs.tipoPapel, icon: LayersIcon },
                                                        { label: 'Formato', value: parsedSpecs.tamano, icon: MapPinIcon },
                                                        { label: 'Volumen', value: parsedSpecs.copias, icon: HashIcon },
                                                        ...(currentJob.esSRI ? [
                                                            { label: 'Establecimiento', value: currentJob.establecimiento, icon: GlobeAltIcon },
                                                            { label: 'Trámite', value: currentJob.actividadSeleccionada, icon: ShieldCheckIcon }
                                                        ] : [])
                                                    ].filter(s => s.value).map(spec => (
                                                        <div key={spec.label} className="flex items-center justify-between px-8 py-5 bg-white/5 rounded-2xl group hover:bg-white/10 hover:border-liquid-gold/30 border border-white/5 transition-all duration-700">
                                                            <div className="flex items-center gap-5">
                                                                <spec.icon className="w-5 h-5 text-slate-600 group-hover:text-liquid-gold transition-colors" />
                                                                <span className="text-[11px] font-black text-slate-600 uppercase group-hover:text-slate-300 italic">{spec.label}</span>
                                                            </div>
                                                            <span className="text-[11px] font-black text-white uppercase italic tracking-widest">{spec.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="p-10 bg-liquid-gold/5 border border-liquid-gold/10 rounded-[2.5rem] relative z-10 group-hover/manifest:bg-liquid-gold/10 transition-all duration-1000">
                                            <span className="text-[10px] font-black text-liquid-gold uppercase tracking-[0.6em] block mb-4 italic">ENGINEERING_NOTES</span>
                                            <p className="text-base font-medium text-slate-500 italic leading-relaxed uppercase tracking-wider">{cleanDetalle || "ANÁLISIS DE VECTORIZACIÓN EN CURSO..."}</p>
                                        </div>
                                    </div>

                                    {/* Telemetry Console */}
                                    <div className="flex-1 bg-black/50 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 flex flex-col min-h-[400px] shadow-2xl relative overflow-hidden group/console">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-liquid-gold/10 blur-[100px] rounded-full opacity-0 group-hover/console:opacity-100 transition-opacity duration-[2s]" />
                                        
                                        <div className="flex items-center justify-between mb-10 relative z-10">
                                            <div className="flex items-center gap-5">
                                                <ActivityIcon className="w-6 h-6 text-liquid-gold animate-pulse shadow-gold-glow-soft" />
                                                <span className="text-[12px] font-black text-slate-600 uppercase tracking-[0.8em] italic">TELEMETRY_ENGINE_V4</span>
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full bg-liquid-gold animate-pulse shadow-gold-glow" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-liquid-gold/40 animate-pulse delay-75" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-liquid-gold/10 animate-pulse delay-150" />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto no-scrollbar font-mono text-[12px] space-y-6 pr-6 relative z-10">
                                            {terminalLogs.map((log, i) => (
                                                <div key={i} className="flex gap-6 group/log hover:translate-x-3 transition-transform duration-700">
                                                    <span className="text-slate-800 font-black shrink-0">[{log.time}]</span>
                                                    <span className="text-slate-500 group-hover/log:text-white transition-colors uppercase tracking-[0.3em]">{log.msg}</span>
                                                </div>
                                            ))}
                                            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 3 }} className="text-liquid-gold font-black uppercase tracking-[0.6em] pt-8 border-t border-white/5 italic">
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
                                className="flex-1 flex flex-col items-center justify-center py-40"
                            >
                                <div className="relative mb-20 group">
                                    <motion.div 
                                        animate={{ rotate: 360 }} 
                                        transition={{ repeat: Infinity, duration: 60, ease: "linear" }} 
                                        className="w-96 h-96 border border-dashed border-white/10 rounded-full" 
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-64 h-64 bg-liquid-gold/5 rounded-full blur-[120px] animate-pulse" />
                                        <GlobeAltIcon className="w-24 h-24 text-liquid-gold/20 group-hover:text-liquid-gold/40 transition-colors duration-1000" />
                                    </div>
                                    
                                    <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 30, ease: "linear" }} className="absolute inset-0">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-liquid-gold rounded-full shadow-gold-glow" />
                                    </motion.div>
                                </div>
                                <div className="text-center space-y-8">
                                    <h2 className="text-7xl font-black text-white italic tracking-tighter uppercase leading-none">ESPERANDO_VÍNCULO</h2>
                                    <p className="text-[12px] text-slate-700 uppercase tracking-[1.5em] italic pl-10">Inicie_sincronización_de_orden</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Voice Command Console */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200]">
                <motion.div 
                    layout 
                    className={`rounded-[3.5rem] shadow-[0_50px_150px_rgba(0,0,0,0.8)] border transition-all duration-1000 ease-in-out ${isVoiceActive ? 'bg-brand-dark/95 backdrop-blur-3xl border-liquid-gold/30 p-12 w-[95vw] md:w-[600px]' : 'bg-liquid-gold border-transparent p-7'}`}
                >
                    <AnimatePresence mode="wait">
                        {isVoiceActive ? (
                            <motion.div key="active" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-3 h-3 bg-liquid-gold rounded-full shadow-gold-glow animate-ping" />
                                        <span className="text-[12px] font-black text-liquid-gold uppercase tracking-[0.6em] italic">NÚCLEO_GÉMINIS_ACTIVE</span>
                                    </div>
                                    <button onClick={stopVoiceTracking} className="p-4 bg-white/5 hover:bg-rose-500/20 rounded-2xl transition-all group">
                                        <XIcon className="w-6 h-6 text-white group-hover:text-rose-500 transition-colors" />
                                    </button>
                                </div>
                                <div className="h-24 flex items-end justify-center gap-4 px-12">
                                    {[0.5, 0.9, 0.6, 1.2, 0.7, 1.0, 0.5, 0.8, 0.6, 0.9].map((d, i) => (
                                        <motion.div key={i} animate={{ height: [15, 80 * d, 15] }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }} className="w-3 bg-liquid-gold rounded-full shadow-gold-glow-soft" />
                                    ))}
                                </div>
                                <div className="text-sm font-black text-slate-500 italic text-center px-10 leading-relaxed uppercase tracking-[0.3em]">{voiceStatus}</div>
                            </motion.div>
                        ) : (
                            <motion.button 
                                key="inactive" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }} onClick={startVoiceTracking} 
                                className="text-brand-dark flex items-center gap-6 px-8 py-3"
                            >
                                <HeadphonesIcon className="w-8 h-8" />
                                {foundJobs.length > 0 && <span className="text-[12px] font-black uppercase tracking-[0.8em] italic">IA_LINK</span>}
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
                .text-glow { text-shadow: 0 0 40px rgba(212,175,55,0.4); }
                .shadow-gold-glow { box-shadow: 0 0 50px rgba(212,175,55,0.4); }
                .shadow-gold-glow-soft { box-shadow: 0 0 25px rgba(212,175,55,0.15); }
                .shadow-3xl { box-shadow: 0 60px 120px -30px rgba(0,0,0,0.6); }
                * { transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
                .bg-noise { background-image: url('https://grainy-gradients.vercel.app/noise.svg'); }
            `}</style>
        </div>
    );
};

export default TrackingPage;
