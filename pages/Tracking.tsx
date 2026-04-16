
import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getTrabajos, getClientes, aprobarArte } from '../services/mockApi';
import { Trabajo, Cliente, TrabajoEstado } from '../types';
import { formatCurrency } from '../utils';
import { 
    SearchIcon, CordovaLogo, ArrowLeftIcon, ClockIcon, CheckCircleIcon, 
    PrinterIcon, PaletteIcon, BoxIcon, MessageCircleIcon, MapPinIcon, 
    Loader2Icon, ShieldCheckIcon, PhoneIcon, EyeIcon, CheckBadgeIcon,
    SparklesIcon, MicIcon, XIcon, InfoIcon, ArrowDownTrayIcon, WalletIcon
} from '../components/Icons';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

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
    { label: 'Recibido', value: TrabajoEstado.PENDIENTE, icon: ClockIcon, color: 'bg-yellow-500' },
    { label: 'Diseño', value: TrabajoEstado.EN_DISENO, icon: PaletteIcon, color: 'bg-indigo-500' },
    { label: 'En Taller', value: TrabajoEstado.PROCESO, icon: PrinterIcon, color: 'bg-blue-600' },
    { label: 'Terminado', value: TrabajoEstado.VITRINA, icon: CheckCircleIcon, color: 'bg-green-500' },
    { label: 'Entregado', value: TrabajoEstado.ENTREGADO, icon: BoxIcon, color: 'bg-slate-400' }
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
                    const { data: matches, error: sbError } = await supabase
                        .from('trabajos')
                        .select('*')
                        .eq('orden', parseInt(q))
                        .order('fecha_entrada', { ascending: false });

                    if (sbError) throw sbError;
                    
                    if (matches && matches.length > 0) {
                        setFoundJobs(matches as any);
                    } else {
                        setError('Orden no encontrada. Verifique el número.');
                    }
                } catch(e) {
                    console.error(e);
                    setError('Error al rastrear.');
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
        
        try {
            // 1. Intentar buscar por número de orden (numérico)
            const isOrderNumber = /^\d+$/.test(cleanQuery);
            if (isOrderNumber) {
                const { data: orderMatches } = await supabase
                    .from('trabajos')
                    .select('*')
                    .eq('orden', parseInt(cleanQuery));
                
                if (orderMatches && orderMatches.length > 0) {
                    setFoundJobs(orderMatches as any);
                    setSearching(false);
                    return;
                }
            }

            // 2. Si no es orden, buscar clientes por nombre o cédula/ruc
            const { data: matchedClients } = await supabase
                .from('clientes')
                .select('id')
                .or(`nombre.ilike.%${cleanQuery}%,cedula.eq.${cleanQuery},ruc.eq.${cleanQuery}`);
            
            if (matchedClients && matchedClients.length > 0) {
                const clientIds = matchedClients.map(c => c.id);
                const { data: clientJobs } = await supabase
                    .from('trabajos')
                    .select('*')
                    .in('cliente_id', clientIds)
                    .order('orden', { ascending: false });
                
                if (clientJobs && clientJobs.length > 0) {
                    setFoundJobs(clientJobs as any);
                } else {
                    setError('El cliente no tiene pedidos registrados.');
                    setFoundJobs([]);
                }
            } else {
                setError('No encontramos pedidos ni clientes con ese dato.');
                setFoundJobs([]);
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión con la base de datos.');
        } finally {
            setSearching(false);
        }
    };


    // MAESTRO FEATURE: Web Proofing
    const handleAprobarArte = async (trabajoId: string) => {
        if (!window.confirm("¿Confirma que el diseño es correcto y desea enviarlo a impresión?")) return;
        try {
            const updated = await aprobarArte(trabajoId);
            setFoundJobs(prev => prev.map(j => j.id === trabajoId ? updated : j));
            alert("✅ Arte aprobado. El taller ha sido notificado.");
        } catch (e) { alert("Error al aprobar arte."); }
    };

    // GENERAR LINK DE COBRO (NUEVO REQUERIMIENTO)
    const handleGeneratePaymentLink = (job: Trabajo) => {
        const message = `*SOLICITUD DE PAGO / COBRO*
--------------------------------
🧾 *Orden:* #${job.orden}
📝 *Detalle:* ${job.subtipo}
💰 *Saldo Pendiente:* ${formatCurrency(job.saldo)}

*DATOS BANCARIOS:*
🏦 Banco Pichincha
💳 Cta. Ahorro: 123-4567890
👤 Imprenta Córdova
🆔 RUC: 0702065319001

📎 *Por favor adjunte su comprobante aquí para procesar su retiro.*`;

        const url = `https://wa.me/593993083943?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // MAESTRO FEATURE: Voice AI Control
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
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
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
                    systemInstruction: `Eres el asistente de voz de Imprenta Córdova Pasaje. Responde de forma breve y amable. Los pedidos actuales del cliente son: ${jobContext}. El cliente está en Pasaje, El Oro. Habla español de Ecuador.`
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-brand-blue selection:text-white pb-32">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 py-4 px-6 sticky top-0 z-50">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <CordovaLogo className="h-8 w-auto" />
                        <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Rastreo <span className="text-brand-red">Córdova</span></span>
                    </Link>
                    <Link to="/" className="text-[10px] font-black text-slate-400 hover:text-brand-blue flex items-center gap-2 transition-colors uppercase tracking-widest">
                        <ArrowLeftIcon className="w-3 h-3" /> Inicio
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-6 py-16 max-w-4xl min-h-screen">
                <div className="mb-12 text-center lg:text-left animate-fade-in-up">
                    <div className="w-20 h-20 bg-brand-blue/10 rounded-[2.5rem] flex items-center justify-center mx-auto lg:mx-0 mb-6 border border-brand-blue/20">
                        <ClockIcon className="w-10 h-10 text-brand-blue" />
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter leading-none italic">
                        CÓRDOVA <span className="text-brand-red">VISION</span> TRACKING
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md leading-relaxed">Sigue tu pedido en vivo o pregúntale a nuestra IA por voz.</p>
                </div>

                <form onSubmit={handleSearch} className="relative max-w-2xl mb-20 animate-fade-in-up delay-150">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue to-purple-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Introduce tu # de Orden o Celular..." 
                            className="relative w-full pl-8 pr-44 py-8 bg-white dark:bg-slate-900 border-none rounded-[2.5rem] shadow-2xl text-xl font-bold focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all dark:text-white"
                        />
                        <button 
                            type="submit"
                            disabled={searching}
                            className="absolute right-3 top-3 bottom-3 bg-brand-blue text-white px-12 rounded-[2.2rem] font-black text-xs tracking-widest hover:bg-slate-950 transition-all flex items-center justify-center uppercase"
                        >
                            {searching ? <Loader2Icon className="w-5 h-5 animate-spin"/> : 'Rastrear'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 text-red-600 p-8 rounded-[3rem] border border-red-100 mb-8 text-center animate-bounce-in font-black text-sm uppercase">
                        {error}
                    </div>
                )}

                <div className="space-y-16">
                    {foundJobs.map(job => {
                        const currentStepIdx = statusSteps.findIndex(s => s.value === job.estado);
                        const isDesigning = job.estado === TrabajoEstado.EN_DISENO || job.estado === TrabajoEstado.PENDIENTE;
                        const isDelivered = job.estado === TrabajoEstado.ENTREGADO;
                        
                        return (
                            <div key={job.id} className="bg-white dark:bg-slate-900 rounded-[4rem] shadow-4xl border border-slate-100 dark:border-white/5 overflow-hidden animate-fade-in-up">
                                {/* CABECERA DE ORDEN */}
                                <div className="p-10 lg:p-12 border-b dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col md:flex-row justify-between items-center gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-brand-blue rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-blue/20">
                                            <BoxIcon className="w-8 h-8"/>
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black text-brand-navy dark:text-white tracking-tighter leading-none">#{job.orden}</h2>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{job.subtipo}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        {isDelivered && (
                                            <a href={`/#/nota-de-venta/${job.id}`} target="_blank" className="bg-emerald-500 text-white px-6 py-4 rounded-[1.8rem] shadow-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all">
                                                <ArrowDownTrayIcon className="w-4 h-4"/> Ver Nota de Venta
                                            </a>
                                        )}
                                        <div className="bg-white dark:bg-slate-800 px-8 py-4 rounded-[1.8rem] shadow-inner border dark:border-white/5 text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                                            <p className={`text-xl font-black uppercase ${job.estado === TrabajoEstado.VITRINA ? 'text-green-500 animate-pulse' : 'text-brand-blue'}`}>
                                                {job.estado}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* MAESTRO FEATURE: WEB PROOFING UI */}
                                {isDesigning && job.fotoOriginalUrl && (
                                    <div className="p-10 lg:p-12 bg-indigo-50/50 dark:bg-indigo-900/10 border-b dark:border-white/5 animate-fade-in">
                                        <div className="flex flex-col lg:flex-row gap-10 items-center">
                                            <div className="relative w-full lg:w-1/2 aspect-video bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white group">
                                                <img src={job.fotoOriginalUrl} className="w-full h-full object-contain" alt="Diseño Preview" />
                                                <div className="absolute inset-0 bg-brand-blue/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <EyeIcon className="w-12 h-12 text-white drop-shadow-xl" />
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <SparklesIcon className="w-6 h-6 text-indigo-600 animate-pulse" />
                                                    <h3 className="text-xl font-black uppercase tracking-tighter text-indigo-900 dark:text-indigo-400">Validación de Diseño</h3>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">"Tu diseño ha sido procesado por el equipo Córdova. Por favor revisa los textos y colores antes de enviarlo a las máquinas."</p>
                                                
                                                {!job.arteAprobado ? (
                                                    <button 
                                                        onClick={() => handleAprobarArte(job.id)}
                                                        className="w-full py-5 bg-brand-red text-white font-black rounded-2xl shadow-xl shadow-red-900/20 hover:scale-105 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                                                    >
                                                        <CheckBadgeIcon className="w-6 h-6" /> Confirmar y Aprobar Diseño
                                                    </button>
                                                ) : (
                                                    <div className="p-4 bg-green-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest">
                                                        <CheckCircleIcon className="w-6 h-6"/> Arte Aprobado por Cliente
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* VISUAL TIMELINE */}
                                <div className="p-12 lg:p-20">
                                    <div className="relative pb-24">
                                        <div className="absolute top-[35px] left-0 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                                            <div className="h-full bg-brand-blue transition-all duration-[2s] ease-out shadow-[0_0_20px_rgba(11,66,167,0.4)]" style={{ width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%` }}></div>
                                        </div>
                                        <div className="relative flex justify-between">
                                            {statusSteps.map((step, idx) => {
                                                const isCompleted = idx <= currentStepIdx;
                                                const Icon = step.icon;
                                                return (
                                                    <div key={step.value} className="flex flex-col items-center">
                                                        <div className={`w-18 h-18 lg:w-20 lg:h-20 rounded-[2rem] flex items-center justify-center z-10 border-4 transition-all duration-700 ${isCompleted ? 'bg-white dark:bg-slate-900 border-brand-blue shadow-2xl scale-125' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-200 dark:text-slate-600'}`}>
                                                            <Icon className={`w-7 h-7 lg:w-8 lg:h-8 ${isCompleted ? 'text-brand-blue' : ''}`} />
                                                        </div>
                                                        <span className={`mt-8 text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-12 pt-12 border-t dark:border-white/5">
                                        <div className="space-y-8">
                                            <h3 className="text-xs font-black text-brand-blue uppercase tracking-widest flex items-center gap-3">Resumen de Cuenta</h3>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div><span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Total</span><span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(job.total)}</span></div>
                                                <div><span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Abono</span><span className="text-3xl font-black text-emerald-500">{formatCurrency(job.abono)}</span></div>
                                                <div className="col-span-2 p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30">
                                                    <span className="text-[10px] font-black text-brand-red uppercase block mb-1">Saldo a Pagar en Local</span>
                                                    <span className="text-4xl font-black text-brand-red">{formatCurrency(job.saldo)}</span>
                                                    
                                                    {/* BOTÓN GENERAR LINK DE COBRO */}
                                                    {job.saldo > 0 && (
                                                        <button 
                                                            onClick={() => handleGeneratePaymentLink(job)}
                                                            className="mt-4 w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-blue dark:hover:bg-slate-200 transition-colors shadow-lg"
                                                        >
                                                            <WalletIcon className="w-4 h-4" /> Generar Link de Cobro
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-950 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col justify-center items-center text-center">
                                            <div className="absolute top-0 right-0 p-8 opacity-10"><CordovaLogo className="w-32 h-32 brightness-0 invert"/></div>
                                            <div className="p-5 bg-white/10 rounded-3xl mb-6"><MapPinIcon className="w-10 h-10 text-brand-red"/></div>
                                            <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Visítanos en Pasaje</h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Calle Colón entre Sucre y Rocafuerte.<br/>Diagonal al parque central.</p>
                                            <button onClick={() => window.open('https://wa.me/593993083943')} className="mt-8 w-full py-4 bg-brand-blue rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-white hover:text-brand-blue transition-all">Soporte Express</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* MAESTRO FEATURE: FLOATING VOICE ASSISTANT */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6">
                <div className={`bg-slate-950 rounded-full shadow-4xl border border-white/10 transition-all duration-500 overflow-hidden ${isVoiceActive ? 'p-4' : 'p-2'}`}>
                    {isVoiceActive ? (
                        <div className="flex items-center justify-between px-6">
                            <div className="flex items-center gap-4">
                                <div className="flex gap-1 items-center">
                                    <div className="w-1.5 h-6 bg-brand-red rounded-full animate-[voice-pulse_1s_infinite_0s]"></div>
                                    <div className="w-1.5 h-10 bg-brand-blue rounded-full animate-[voice-pulse_1s_infinite_0.2s]"></div>
                                    <div className="w-1.5 h-8 bg-indigo-500 rounded-full animate-[voice-pulse_1s_infinite_0.4s]"></div>
                                </div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{voiceStatus}</span>
                            </div>
                            <button onClick={stopVoiceTracking} className="p-3 bg-white/10 rounded-full hover:bg-brand-red transition-colors"><XIcon className="w-5 h-5 text-white"/></button>
                        </div>
                    ) : (
                        <button 
                            onClick={startVoiceTracking}
                            className="w-full py-5 bg-brand-blue text-white rounded-full font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-slate-900 transition-all active:scale-95 group shadow-2xl"
                        >
                            <MicIcon className="w-5 h-5 group-hover:animate-pulse" /> Córdova Voice Assist
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes voice-pulse {
                    0%, 100% { height: 10px; }
                    50% { height: 30px; }
                }
            `}</style>
        </div>
    );
};

export default TrackingPage;
