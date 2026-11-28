import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import { generateWhatsAppLink, mensajeDeError } from '../utils';
import { sriLookupService } from '../services/sriLookupService';
import { MASTER_CATALOG } from '../services/catalogData';
import {
    solicitudesWebService, validarSolicitud, soloDigitos,
    DOCUMENTOS_SRI, CANTIDADES, COPIAS, TAMANOS, TRAMITES, ENTREGAS,
    mensajeWhatsAppSolicitud,
    type SolicitudWebInput, type TramiteSolicitud,
} from '../services/solicitudesWebService';
import { WhatsAppIcon, Check, ArrowRight, ShieldCheck, Sparkles, Loader2Icon, Search, FileText, Clock } from '../components/Icons';

const WA_TALLER = '593993083943';
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Precio de referencia del talonario con esa cantidad de hojas (catálogo semilla). */
const precioReferencia = (hojas: number): number | undefined =>
    MASTER_CATALOG.find(p => p.esSRI && p.nombre?.includes(`(${hojas} hojas)`))?.precio;

const PASOS = ['Tu RUC', 'Tu pedido', 'Contacto'];

const inicial: SolicitudWebInput = {
    ruc: '', razonSocial: '', nombreComercial: '', telefono: '', email: '', direccion: '', actividad: '', regimen: '',
    documento: 'Factura', cantidad: 100, copias: COPIAS[0], tamano: TAMANOS[0],
    establecimiento: '001', puntoEmision: '001', tramite: 'NUEVO', entrega: ENTREGAS[0], notas: '', aceptaDatos: false,
};

const campo = 'w-full px-4 py-3 bg-white border border-hairline-strong rounded-xl text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-royal focus:border-royal transition';
const etiqueta = 'block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5';

const Opcion: React.FC<{ activo: boolean; onClick: () => void; titulo: string; ayuda?: string }> = ({ activo, onClick, titulo, ayuda }) => (
    <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        aria-pressed={activo}
        className={`relative text-left p-3.5 rounded-xl border transition-colors ${activo ? 'bg-tint border-royal shadow-md' : 'bg-white border-hairline hover:border-hairline-strong'}`}
    >
        <span className="flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-ink">{titulo}</span>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${activo ? 'bg-royal text-white' : 'border border-hairline-strong'}`}>
                {activo && <Check className="w-3 h-3" />}
            </span>
        </span>
        {ayuda && <span className="block text-[11px] text-muted mt-0.5">{ayuda}</span>}
    </motion.button>
);

export const SolicitarOnline: React.FC = () => {
    const [paso, setPaso] = useState(0);
    const [dir, setDir] = useState(1);
    const [f, setF] = useState<SolicitudWebInput>(inicial);
    const [buscando, setBuscando] = useState(false);
    const [padronMsg, setPadronMsg] = useState<{ ok: boolean; texto: string } | null>(null);
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [codigo, setCodigo] = useState<string | null>(null);
    const [falloGuardado, setFalloGuardado] = useState(false);
    // Anti-spam: campo trampa invisible y tiempo mínimo en la página.
    const [trampa, setTrampa] = useState('');
    const montadoEn = useRef(Date.now());
    const ultimaBusqueda = useRef('');

    const set = <K extends keyof SolicitudWebInput>(k: K, v: SolicitudWebInput[K]) => { setF(prev => ({ ...prev, [k]: v })); setError(''); };

    // Autocompleta con el padrón del SRI (El Oro) al completar los 13 dígitos.
    useEffect(() => {
        const ruc = soloDigitos(f.ruc);
        if ((ruc.length !== 13 && ruc.length !== 10) || ruc === ultimaBusqueda.current) return;
        ultimaBusqueda.current = ruc;
        let vivo = true;
        setBuscando(true);
        setPadronMsg(null);
        sriLookupService.lookupByRuc(ruc).then(d => {
            if (!vivo) return;
            if (d) {
                setF(prev => ({
                    ...prev,
                    razonSocial: prev.razonSocial || d.razon_social || '',
                    direccion: prev.direccion || d.direccion || '',
                    actividad: prev.actividad || d.actividad_economica || '',
                    regimen: prev.regimen || d.regimen || '',
                    documento: /POPULAR/i.test(d.regimen || '') ? 'Nota de Venta' : prev.documento,
                }));
                setPadronMsg({ ok: true, texto: `Encontramos tu RUC en el padrón del SRI${d.estado_contribuyente ? ` · ${d.estado_contribuyente}` : ''}.` });
            } else {
                setPadronMsg({ ok: false, texto: 'No lo encontramos en nuestro padrón: completá los datos a mano.' });
            }
        }).finally(() => { if (vivo) setBuscando(false); });
        return () => { vivo = false; };
    }, [f.ruc]);

    const precio = useMemo(() => precioReferencia(f.cantidad), [f.cantidad]);

    const validarPaso = (p: number): string | null => {
        if (p === 0) {
            const ruc = soloDigitos(f.ruc);
            if (ruc.length !== 13 && ruc.length !== 10) return 'El RUC debe tener 13 dígitos (o 10 si es cédula).';
            if (f.razonSocial.trim().length < 2) return 'Escribí la razón social o tu nombre completo.';
        }
        if (p === 1 && !f.documento) return 'Elegí qué comprobante necesitás.';
        if (p === 2) return validarSolicitud(f);
        return null;
    };

    const ir = (n: number) => {
        if (n > paso) {
            const e = validarPaso(paso);
            if (e) { setError(e); return; }
        }
        setDir(n > paso ? 1 : -1);
        setError('');
        setPaso(n);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault();
        const problema = validarPaso(2);
        if (problema) { setError(problema); return; }
        if (trampa || Date.now() - montadoEn.current < 4000) { setError('Revisá los datos e intentá de nuevo.'); return; }
        setEnviando(true);
        setError('');
        try {
            const r = await solicitudesWebService.crear(f);
            setCodigo(r.codigo);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            // El detalle técnico (tabla faltante, red) queda en consola; el cliente ve una salida.
            console.error('[Solicitar] Error al enviar:', mensajeDeError(err));
            setError('No pudimos guardar tu solicitud en este momento. Enviala por WhatsApp con el botón de abajo: va con todos tus datos.');
            setFalloGuardado(true);
        } finally {
            setEnviando(false);
        }
    };

    const waConfirmacion = codigo ? generateWhatsAppLink(WA_TALLER,
        `Hola Imprenta Córdova, envié la solicitud ${codigo} (${f.documento}, ${f.cantidad} hojas) para el RUC ${soloDigitos(f.ruc)}. Les adjunto mi logo:`) : '';

    const variantes = {
        entra: (d: number) => ({ opacity: 0, x: d * 60 }),
        centro: { opacity: 1, x: 0 },
        sale: (d: number) => ({ opacity: 0, x: d * -60 }),
    };

    return (
        <MotionConfig reducedMotion="user">
            <div className="min-h-screen bg-paper text-body font-sans overflow-x-hidden">
                <SEO
                    title="Pedí tus facturas y notas de venta en línea · Imprenta Córdova"
                    description="Solicitá en línea la impresión de facturas, notas de venta y comprobantes autorizados por el SRI. Te confirmamos precio y prueba digital por WhatsApp."
                />
                <PublicNavbar />

                <div className="relative">
                    <motion.div
                        aria-hidden
                        className="absolute -top-10 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-gradient-to-b from-royal/20 via-gold/15 to-transparent rounded-full blur-3xl pointer-events-none"
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    <main className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-28">
                        <AnimatePresence mode="wait">
                            {codigo ? (
                                <motion.section
                                    key="listo"
                                    initial={{ opacity: 0, scale: 0.96, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: EASE }}
                                    className="bg-white rounded-3xl border border-hairline shadow-2xl p-8 sm:p-12 text-center"
                                >
                                    <motion.div
                                        initial={{ scale: 0, rotate: -90 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                                        className="mx-auto w-20 h-20 rounded-full bg-success-dot text-white flex items-center justify-center shadow-xl shadow-success-dot/30"
                                    >
                                        <Check className="w-10 h-10" />
                                    </motion.div>
                                    <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mt-6">¡Solicitud recibida!</h1>
                                    <p className="mt-3 text-body">Tu número de solicitud es</p>
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="mt-2 inline-block font-mono text-3xl font-black text-royal bg-tint px-5 py-2 rounded-2xl tracking-widest"
                                    >
                                        {codigo}
                                    </motion.p>
                                    <p className="mt-5 text-sm text-body max-w-md mx-auto leading-relaxed">
                                        En horario de atención te escribimos por WhatsApp al <strong className="text-ink">{f.telefono}</strong> con
                                        el precio final y la prueba digital para que la apruebes antes de imprimir.
                                    </p>
                                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                                        <a
                                            href={waConfirmacion}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center justify-center gap-2.5 px-7 py-4 bg-success-dot hover:bg-success text-white font-bold text-sm rounded-2xl shadow-lg transition-colors"
                                        >
                                            <WhatsAppIcon className="w-5 h-5" />
                                            Enviar mi logo por WhatsApp
                                        </a>
                                        <Link to="/" className="inline-flex items-center justify-center px-7 py-4 bg-white border border-hairline-strong text-ink font-bold text-sm rounded-2xl hover:bg-paper transition-colors">
                                            Volver al inicio
                                        </Link>
                                    </div>
                                </motion.section>
                            ) : (
                                <motion.div key="form" exit={{ opacity: 0, y: -20 }}>
                                    <motion.header
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, ease: EASE }}
                                        className="text-center"
                                    >
                                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-hairline-strong rounded-full text-xs font-bold text-ink shadow-sm">
                                            <ShieldCheck className="w-3.5 h-3.5 text-royal" /> Establecimiento gráfico autorizado por el SRI
                                        </span>
                                        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-ink tracking-tight mt-5 leading-tight">
                                            Pedí tus comprobantes <span className="text-transparent bg-clip-text bg-gradient-to-r from-royal to-gold-deep">en 2 minutos.</span>
                                        </h1>
                                        <p className="mt-3 text-body max-w-xl mx-auto">
                                            Completá tus datos y nosotros hacemos el trámite en el SRI. Te confirmamos el precio y la prueba digital por WhatsApp.
                                        </p>
                                    </motion.header>

                                    {/* Progreso */}
                                    <div className="mt-9 flex items-center gap-2" aria-label="Progreso">
                                        {PASOS.map((nombre, i) => (
                                            <React.Fragment key={nombre}>
                                                <button
                                                    type="button"
                                                    onClick={() => i < paso && ir(i)}
                                                    className={`flex items-center gap-2 ${i < paso ? 'cursor-pointer' : 'cursor-default'}`}
                                                    aria-current={i === paso ? 'step' : undefined}
                                                >
                                                    <motion.span
                                                        animate={{ scale: i === paso ? 1.12 : 1 }}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                                                            i < paso ? 'bg-success-dot text-white' : i === paso ? 'bg-royal text-white shadow-lg shadow-royal/30' : 'bg-white border border-hairline-strong text-faint'
                                                        }`}
                                                    >
                                                        {i < paso ? <Check className="w-4 h-4" /> : i + 1}
                                                    </motion.span>
                                                    <span className={`hidden sm:block text-xs font-bold ${i === paso ? 'text-ink' : 'text-faint'}`}>{nombre}</span>
                                                </button>
                                                {i < PASOS.length - 1 && (
                                                    <div className="flex-1 h-1 rounded-full bg-hairline overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-success-dot origin-left"
                                                            initial={false}
                                                            animate={{ scaleX: i < paso ? 1 : 0 }}
                                                            transition={{ duration: 0.5, ease: EASE }}
                                                        />
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    <form onSubmit={enviar} noValidate className="mt-6 bg-white rounded-3xl border border-hairline shadow-xl overflow-hidden">
                                        {/* Campo trampa: invisible para personas, los bots lo llenan. */}
                                        <input
                                            type="text" name="website" tabIndex={-1} autoComplete="off" value={trampa}
                                            onChange={e => setTrampa(e.target.value)} className="hidden" aria-hidden
                                        />
                                        <div className="p-6 sm:p-8 min-h-[380px]">
                                            <AnimatePresence mode="wait" custom={dir}>
                                                <motion.div
                                                    key={paso}
                                                    custom={dir}
                                                    variants={variantes}
                                                    initial="entra"
                                                    animate="centro"
                                                    exit="sale"
                                                    transition={{ duration: 0.35, ease: EASE }}
                                                    className="space-y-5"
                                                >
                                                    {paso === 0 && (
                                                        <>
                                                            <div>
                                                                <label htmlFor="ruc" className={etiqueta}>RUC o cédula</label>
                                                                <div className="relative">
                                                                    <input
                                                                        id="ruc" inputMode="numeric" autoComplete="off" maxLength={13} autoFocus
                                                                        value={f.ruc} onChange={e => set('ruc', soloDigitos(e.target.value))}
                                                                        placeholder="0700000000001" className={`${campo} font-mono text-lg tracking-widest pr-11`}
                                                                    />
                                                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint">
                                                                        {buscando ? <Loader2Icon className="w-5 h-5 animate-spin text-royal" /> : <Search className="w-5 h-5" />}
                                                                    </span>
                                                                </div>
                                                                <AnimatePresence>
                                                                    {padronMsg && (
                                                                        <motion.p
                                                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                                                            className={`text-xs font-semibold mt-2 ${padronMsg.ok ? 'text-success' : 'text-gold-ink'}`}
                                                                        >
                                                                            {padronMsg.ok ? '✓ ' : ''}{padronMsg.texto}
                                                                        </motion.p>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                            <div>
                                                                <label htmlFor="razon" className={etiqueta}>Razón social / Nombres completos</label>
                                                                <input id="razon" value={f.razonSocial} onChange={e => set('razonSocial', e.target.value)} className={campo} autoComplete="organization" />
                                                            </div>
                                                            <div className="grid sm:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label htmlFor="comercial" className={etiqueta}>Nombre comercial (opcional)</label>
                                                                    <input id="comercial" value={f.nombreComercial} onChange={e => set('nombreComercial', e.target.value)} className={campo} />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="actividad" className={etiqueta}>Actividad (opcional)</label>
                                                                    <input id="actividad" value={f.actividad} onChange={e => set('actividad', e.target.value)} className={campo} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label htmlFor="direccion" className={etiqueta}>Dirección del establecimiento</label>
                                                                <input id="direccion" value={f.direccion} onChange={e => set('direccion', e.target.value)} className={campo} autoComplete="street-address" />
                                                            </div>
                                                        </>
                                                    )}

                                                    {paso === 1 && (
                                                        <>
                                                            <div>
                                                                <span className={etiqueta}>¿Qué comprobante necesitás?</span>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                                    {DOCUMENTOS_SRI.map(d => (
                                                                        <Opcion key={d.id} activo={f.documento === d.nombre} onClick={() => set('documento', d.nombre)} titulo={d.nombre} ayuda={d.ayuda} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className={etiqueta}>Cantidad de hojas</span>
                                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                                    {CANTIDADES.map(c => (
                                                                        <Opcion key={c} activo={f.cantidad === c} onClick={() => set('cantidad', c)} titulo={`${c}`} ayuda={`${c / 100} block${c > 100 ? 's' : ''}`} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="grid sm:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label htmlFor="copias" className={etiqueta}>Copias</label>
                                                                    <select id="copias" value={f.copias} onChange={e => set('copias', e.target.value)} className={campo}>
                                                                        {COPIAS.map(c => <option key={c}>{c}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="tamano" className={etiqueta}>Tamaño</label>
                                                                    <select id="tamano" value={f.tamano} onChange={e => set('tamano', e.target.value)} className={campo}>
                                                                        {TAMANOS.map(t => <option key={t}>{t}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className={etiqueta}>Trámite</span>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                                    {TRAMITES.map(t => (
                                                                        <Opcion key={t.id} activo={f.tramite === t.id} onClick={() => set('tramite', t.id as TramiteSolicitud)} titulo={t.label} ayuda={t.ayuda} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label htmlFor="est" className={etiqueta}>Establecimiento</label>
                                                                    <input id="est" inputMode="numeric" maxLength={3} value={f.establecimiento} onChange={e => set('establecimiento', soloDigitos(e.target.value))} className={`${campo} font-mono`} />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="pto" className={etiqueta}>Punto de emisión</label>
                                                                    <input id="pto" inputMode="numeric" maxLength={3} value={f.puntoEmision} onChange={e => set('puntoEmision', soloDigitos(e.target.value))} className={`${campo} font-mono`} />
                                                                </div>
                                                            </div>
                                                            {precio !== undefined && (
                                                                <motion.div
                                                                    key={f.cantidad}
                                                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                                    className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-ink text-white"
                                                                >
                                                                    <div>
                                                                        <span className="text-[10px] font-mono uppercase tracking-widest text-gold font-bold">Precio de referencia</span>
                                                                        <p className="text-xs text-onink mt-0.5">{f.cantidad} hojas · 1/4 oficio. Te confirmamos el total por WhatsApp.</p>
                                                                    </div>
                                                                    <span className="font-heading text-3xl font-black text-gold">${precio.toFixed(2)}</span>
                                                                </motion.div>
                                                            )}
                                                        </>
                                                    )}

                                                    {paso === 2 && (
                                                        <>
                                                            <div className="grid sm:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label htmlFor="tel" className={etiqueta}>Celular (WhatsApp)</label>
                                                                    <input id="tel" inputMode="tel" autoComplete="tel" value={f.telefono} onChange={e => set('telefono', e.target.value)} placeholder="0991234567" className={`${campo} font-mono`} />
                                                                </div>
                                                                <div>
                                                                    <label htmlFor="email" className={etiqueta}>Correo (opcional)</label>
                                                                    <input id="email" type="email" autoComplete="email" value={f.email} onChange={e => set('email', e.target.value)} className={campo} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span className={etiqueta}>Entrega</span>
                                                                <div className="grid grid-cols-2 gap-2.5">
                                                                    {ENTREGAS.map(en => (
                                                                        <Opcion key={en} activo={f.entrega === en} onClick={() => set('entrega', en)} titulo={en} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label htmlFor="notas" className={etiqueta}>Indicaciones (opcional)</label>
                                                                <textarea id="notas" rows={3} maxLength={1000} value={f.notas} onChange={e => set('notas', e.target.value)} placeholder="Ej: con logo a color, numeración desde la 501…" className={`${campo} resize-none`} />
                                                            </div>

                                                            <div className="rounded-2xl border border-hairline bg-paper p-4 text-xs text-body space-y-1">
                                                                <p className="font-bold text-ink flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-royal" /> Resumen</p>
                                                                <p>{f.documento} · {f.cantidad} hojas · {f.copias} · {f.tamano}</p>
                                                                <p>{f.razonSocial || '—'} · RUC {soloDigitos(f.ruc) || '—'} · Est. {f.establecimiento}-{f.puntoEmision}</p>
                                                            </div>

                                                            <label className="flex items-start gap-3 cursor-pointer select-none">
                                                                <input type="checkbox" checked={f.aceptaDatos} onChange={e => set('aceptaDatos', e.target.checked)} className="mt-0.5 w-4 h-4 accent-royal" />
                                                                <span className="text-xs text-body leading-relaxed">
                                                                    Autorizo a Imprenta Córdova a usar estos datos para tramitar mi autorización de impresión ante el SRI y contactarme sobre este pedido.
                                                                    <strong className="text-ink"> Nunca te pediremos tu clave del SRI por este formulario.</strong>
                                                                </span>
                                                            </label>
                                                        </>
                                                    )}
                                                </motion.div>
                                            </AnimatePresence>

                                            <AnimatePresence>
                                                {error && (
                                                    <motion.p
                                                        role="alert"
                                                        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0, x: [0, -6, 6, -3, 0] }} exit={{ opacity: 0 }}
                                                        transition={{ x: { duration: 0.35 } }}
                                                        className="mt-5 text-sm font-semibold text-danger bg-danger/5 border border-danger/20 rounded-xl px-4 py-3"
                                                    >
                                                        {error}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                            {falloGuardado && (
                                                <a
                                                    href={generateWhatsAppLink(WA_TALLER, mensajeWhatsAppSolicitud(f))}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-3 inline-flex items-center justify-center gap-2.5 w-full min-h-[44px] px-6 py-3.5 bg-success-dot hover:bg-success text-white font-bold text-sm rounded-2xl shadow-lg transition-colors"
                                                >
                                                    <WhatsAppIcon className="w-5 h-5" />
                                                    Enviar mi solicitud por WhatsApp
                                                </a>
                                            )}
                                        </div>

                                        <div className="px-6 sm:px-8 py-5 bg-paper border-t border-hairline flex items-center justify-between gap-3">
                                            {paso > 0 ? (
                                                <button type="button" onClick={() => ir(paso - 1)} className="px-5 py-3 text-sm font-bold text-body hover:text-ink">
                                                    ← Atrás
                                                </button>
                                            ) : <span className="text-[11px] text-faint flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Toma 2 minutos</span>}

                                            {paso < PASOS.length - 1 ? (
                                                <motion.button
                                                    type="button" onClick={() => ir(paso + 1)}
                                                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-royal hover:bg-royal-dark text-white font-bold text-sm rounded-2xl shadow-lg shadow-royal/30 transition-colors"
                                                >
                                                    Continuar <ArrowRight className="w-4 h-4" />
                                                </motion.button>
                                            ) : (
                                                <motion.button
                                                    type="submit" disabled={enviando}
                                                    whileHover={{ scale: enviando ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}
                                                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-success-dot hover:bg-success disabled:opacity-60 text-white font-bold text-sm rounded-2xl shadow-lg shadow-success-dot/30 transition-colors"
                                                >
                                                    {enviando ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                    {enviando ? 'Enviando…' : 'Enviar solicitud'}
                                                </motion.button>
                                            )}
                                        </div>
                                    </form>

                                    <p className="mt-6 text-center text-xs text-muted">
                                        ¿Preferís hablar con alguien?{' '}
                                        <a href={generateWhatsAppLink(WA_TALLER, 'Hola Imprenta Córdova, quiero pedir mis comprobantes.')} target="_blank" rel="noreferrer" className="font-bold text-royal hover:underline">
                                            Escribinos por WhatsApp
                                        </a>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </MotionConfig>
    );
};

export default SolicitarOnline;
