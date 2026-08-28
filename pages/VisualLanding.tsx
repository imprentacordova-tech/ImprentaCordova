import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';
import { RucValidatorWidget } from '../components/public/RucValidatorWidget';

/**
 * Home pública — fiel a `Publica-B-Vitrina.dc.html` (Claude Design),
 * con el layout de celular de `Publica-B-Movil.dc.html` (barra de acción
 * inferior, tarjetas apiladas, cifras en 2 columnas).
 * Mismo sistema azul/blanco del panel interno.
 */

const C = {
    ink: '#0A1140', royal: '#16309B', royalHover: '#0F2280', border: '#E4E8F4', borderStrong: '#D7DDF0',
    divider: '#EEF0F8', body: '#3C4763', muted: '#5B6480', faint: '#8A93AE', bg: '#F7F9FF',
    chip: '#EEF1FC', soft: '#F2F4FA', gold: '#FFC61A',
};
const DISPLAY = "'Outfit',sans-serif";
const MONO = "'JetBrains Mono',monospace";
const WA = (msg: string) => generateWhatsAppLink('593993083943', msg);
const IMG = (n: string) => `/images/landing/${n}`;

const TICKER = [
    'SRI autorizado 001-001', 'Diseño incluido', 'Entrega en 24 horas',
    'Envíos a todo El Oro', 'Machala desde 2009',
];

const FACTS = [
    { value: '2 400+', label: 'Trabajos entregados' },
    { value: '24 h', label: 'Entrega estándar' },
    { value: '800+', label: 'Empresas atendidas' },
    { value: '99 %', label: 'Entrega a tiempo' },
];

type Item = { cat: string; img: string; tag: string; label: string; desc: string; eta: string };
const ITEMS: Item[] = [
    { cat: 'SRI', img: 'talonarios.png', tag: 'SRI', label: 'Facturas impresas', desc: 'Régimen General y RIMPE-Emprendedor, numeración secuencial en papel químico.', eta: '24 h' },
    { cat: 'SRI', img: 'talonarios.png', tag: 'SRI', label: 'Notas de venta', desc: 'Formato simplificado aprobado para RIMPE Negocio Popular.', eta: '24 h' },
    { cat: 'SRI', img: 'printer_gold.png', tag: 'Autocopiativo', label: 'Talonarios y recibos', desc: 'Guías de remisión, retenciones, vales y recibos de caja con copias.', eta: '24–48 h' },
    { cat: 'Comercial', img: 'business_cards.png', tag: 'Offset', label: 'Tarjetas de presentación', desc: 'Couché 300 g con laminado soft touch o brillo UV selectivo.', eta: '48 h' },
    { cat: 'Comercial', img: 'branding.png', tag: 'Papelería', label: 'Branding impreso', desc: 'Carpetas corporativas, hojas membretadas, sobres y afiches.', eta: '48–72 h' },
    { cat: 'Gran formato', img: 'gigantografia.png', tag: '1440 dpi', label: 'Gigantografía HD', desc: 'Lona eco-solvente para rótulos, banners y vallas de exterior.', eta: '24 h' },
];
const CATS = ['Todo', 'SRI', 'Comercial', 'Gran formato'];

const FINISHES = [
    { id: 'quimico', name: 'Papel químico autocopiativo', tag: 'Especialidad SRI', desc: 'Copia instantánea sin papel carbón. Original blanco, copia amarilla y copia rosa con trazo nítido.', swatch: 'linear-gradient(135deg,#FFFDF2 0%,#FFF3C4 48%,#FFE0E6 100%)' },
    { id: 'seda', name: 'Laminado soft touch', tag: 'Textura velvet', desc: 'Acabado suave antirrayaduras que da presencia ejecutiva a tarjetas y carpetas corporativas.', swatch: 'linear-gradient(135deg,#111A52 0%,#0A1140 60%,#1B2A70 100%)' },
    { id: 'uv', name: 'Brillo UV selectivo', tag: 'Contraste alto', desc: 'Realce brillante sobre logotipos y detalles, en contraste con la base mate del papel.', swatch: 'linear-gradient(135deg,#E9EEFB 0%,#C9D3F0 55%,#16309B 100%)' },
    { id: 'sello', name: 'Caucho polímero láser', tag: 'Nitidez micrométrica', desc: 'Grabado micro-definido para sellos con textos pequeños, logos y firmas escaneadas.', swatch: 'linear-gradient(135deg,#2A2F45 0%,#4A5470 55%,#E70101 100%)' },
];

const SRI_POINTS = [
    { label: 'Régimen y estado verificados', detail: 'Consulta directa al padrón antes de diagramar.' },
    { label: 'Secuencia correlativa garantizada', detail: 'Sin saltos ni duplicados en la numeración.' },
    { label: 'Prueba digital antes de prensa', detail: 'La aprueba usted por WhatsApp, no nosotros.' },
    { label: 'Archivo del arte para renovaciones', detail: 'Su próximo talonario se reimprime en minutos.' },
];

const TRACK = [
    { label: 'Orden recibida', time: '08:12', done: true },
    { label: 'RUC validado en el SRI', time: '08:20', done: true },
    { label: 'Prueba digital aprobada', time: '09:05', done: true },
    { label: 'En prensa · numeración 4801–4900', time: 'ahora', current: true },
    { label: 'Guillotinado y empaque', time: '—' },
    { label: 'Listo para retiro', time: '—' },
];

const KEYFRAMES = `
  @keyframes vl-rise { from { opacity:0; transform:translateY(26px); } to { opacity:1; transform:translateY(0); } }
  @keyframes vl-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
  @keyframes vl-marquee { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
  @keyframes vl-ink { 0% { transform:scale(.4); opacity:0; } 100% { transform:scale(1); opacity:1; } }
`;

const eyebrow: React.CSSProperties = { fontSize: 11.5, letterSpacing: '.2em', textTransform: 'uppercase', color: C.royal, fontWeight: 700 };
const h2: React.CSSProperties = { margin: '12px 0 0', fontFamily: DISPLAY, fontSize: 'clamp(28px,3.4vw,40px)', fontWeight: 600, letterSpacing: '-.035em', color: C.ink };

const VisualLanding: React.FC = () => {
    const [filter, setFilter] = useState('Todo');
    const [finishId, setFinishId] = useState('quimico');
    const [orden, setOrden] = useState('');
    const navigate = useNavigate();

    const items = useMemo(() => ITEMS.filter(i => filter === 'Todo' || i.cat === filter), [filter]);
    const fin = FINISHES.find(f => f.id === finishId) || FINISHES[0];

    const buscarOrden = (e: React.FormEvent) => {
        e.preventDefault();
        const q = orden.trim();
        navigate(q ? `/tracking?q=${encodeURIComponent(q)}` : '/tracking');
    };

    return (
        <div style={{ background: '#fff', color: C.ink, fontFamily: "'Inter',system-ui,sans-serif", overflowX: 'hidden' }}>
            <style>{KEYFRAMES}</style>
            <SEO
                title="Imprenta Córdova · Impresión SRI autorizada en Machala"
                description="Facturas, notas de venta, talonarios y sellos con validez legal. Diseño incluido, prueba digital por WhatsApp y entrega en 24 horas."
            />

            {/* ── Ticker ─────────────────────────────────────────────── */}
            <div style={{ background: C.ink, color: '#fff', overflow: 'hidden' }}>
                <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'vl-marquee 38s linear infinite', padding: '9px 0' }}>
                    {[...TICKER, ...TICKER].map((t, i) => (
                        <span key={i} style={{ flexShrink: 0, padding: '0 24px', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#A9B5DC' }}>{t}</span>
                    ))}
                </div>
            </div>

            <PublicNavbar />

            {/* ── Hero ───────────────────────────────────────────────── */}
            <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#F7F9FF 0%,#fff 100%)', borderBottom: `1px solid #E9ECF5` }}>
                <div style={{ position: 'absolute', top: -160, left: '50%', width: 900, height: 900, marginLeft: -450, borderRadius: 99, background: 'radial-gradient(circle, rgba(22,48,155,.07) 0%, transparent 62%)', animation: 'vl-ink 2.6s cubic-bezier(.2,.8,.2,1) both', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', maxWidth: 1320, margin: '0 auto', padding: 'clamp(44px,6vw,76px) clamp(16px,3vw,44px) 34px', textAlign: 'center' }}>
                    <div style={{ animation: 'vl-rise .75s cubic-bezier(.2,.8,.2,1) both' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '7px 15px', background: '#fff', border: `1px solid ${C.borderStrong}`, borderRadius: 99, fontSize: 12.5, color: C.body }}>
                            <span style={{ fontFamily: MONO, fontSize: 11, color: C.royal, fontWeight: 700 }}>SRI 001-001</span>
                            <span style={{ width: 1, height: 12, background: '#DDE2F0' }} />
                            Establecimiento gráfico autorizado en Machala
                        </div>
                        <h1 style={{ margin: '26px auto 0', maxWidth: '20ch', fontFamily: DISPLAY, fontSize: 'clamp(34px,4.8vw,66px)', fontWeight: 600, lineHeight: 1.02, letterSpacing: '-.038em', color: C.ink }}>
                            Impresión seria para negocios que <span style={{ color: C.royal }}>no improvisan.</span>
                        </h1>
                        <p style={{ margin: '22px auto 0', maxWidth: '44ch', fontSize: 17.5, lineHeight: 1.65, color: '#4A5470' }}>
                            Facturas, notas de venta, talonarios y sellos con validez legal. Diseño incluido, prueba digital por WhatsApp y entrega en 24 horas.
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
                            <a href={WA('Hola, quiero cotizar la impresión de mis documentos. Mi RUC es:')} target="_blank" rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 28px', background: C.royal, color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none', boxShadow: '0 8px 22px -8px rgba(22,48,155,.55)' }}>
                                Enviar mi RUC por WhatsApp <span>→</span>
                            </a>
                            <Link to="/vitrina"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 24px', background: '#fff', color: C.royal, border: `1px solid ${C.borderStrong}`, borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                                Ver el catálogo
                            </Link>
                        </div>
                    </div>

                    {/* Tres piezas destacadas */}
                    <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,230px),1fr))', gap: 18, alignItems: 'end', animation: 'vl-rise .75s cubic-bezier(.2,.8,.2,1) both' }}>
                        <div style={{ borderRadius: '16px 16px 0 0', overflow: 'hidden', border: '1px solid #E1E6F5', borderBottom: 'none', background: '#fff', boxShadow: '0 30px 60px -34px rgba(10,17,64,.3)', animation: 'vl-float 7s ease-in-out infinite' }}>
                            <img src={IMG('business_cards.png')} alt="Tarjetas de presentación" style={{ width: '100%', height: 230, objectFit: 'cover', display: 'block' }} />
                            <div style={{ padding: '16px 18px', textAlign: 'left' }}>
                                <div style={{ fontFamily: DISPLAY, fontSize: 15.5, fontWeight: 600, color: C.ink }}>Tarjetas de presentación</div>
                                <div style={{ fontSize: 12, color: '#6B7590', marginTop: 3 }}>Couché 300 g · soft touch</div>
                            </div>
                        </div>

                        <div style={{ borderRadius: '18px 18px 0 0', overflow: 'hidden', border: `1px solid ${C.borderStrong}`, borderBottom: 'none', background: '#fff', boxShadow: '0 44px 80px -40px rgba(10,17,64,.4)' }}>
                            <img src={IMG('talonarios.png')} alt="Talonarios autocopiativos" style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block' }} />
                            <div style={{ padding: '20px 22px', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                                <div>
                                    <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink }}>Talonarios autocopiativos</div>
                                    <div style={{ fontSize: 12.5, color: '#6B7590', marginTop: 3 }}>Original + 2 copias · numeración secuencial</div>
                                </div>
                                <span style={{ flexShrink: 0, padding: '6px 11px', background: C.chip, color: C.royal, borderRadius: 8, fontSize: 11.5, fontWeight: 700 }}>Más pedido</span>
                            </div>
                        </div>

                        <div style={{ borderRadius: '16px 16px 0 0', overflow: 'hidden', border: '1px solid #E1E6F5', borderBottom: 'none', background: '#fff', boxShadow: '0 30px 60px -34px rgba(10,17,64,.3)', animation: 'vl-float 8.5s ease-in-out .8s infinite' }}>
                            <img src={IMG('gigantografia.png')} alt="Gigantografía HD" style={{ width: '100%', height: 230, objectFit: 'cover', display: 'block' }} />
                            <div style={{ padding: '16px 18px', textAlign: 'left' }}>
                                <div style={{ fontFamily: DISPLAY, fontSize: 15.5, fontWeight: 600, color: C.ink }}>Gigantografía HD</div>
                                <div style={{ fontSize: 12, color: '#6B7590', marginTop: 3 }}>Lona eco-solvente · 1440 dpi</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Cifras ─────────────────────────────────────────────── */}
            <section style={{ borderBottom: `1px solid #E9ECF5`, background: '#fff' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(16px,3vw,44px)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(50%,150px),1fr))' }}>
                        {FACTS.map((f, i) => (
                            <div key={f.label} style={{ padding: '34px 0', borderRight: i === FACTS.length - 1 ? 'none' : `1px solid ${C.divider}` }}>
                                <div style={{ fontFamily: DISPLAY, fontSize: 'clamp(24px,3vw,32px)', fontWeight: 600, letterSpacing: '-.035em', color: C.royal }}>{f.value}</div>
                                <div style={{ fontSize: 13, color: '#6B7590', marginTop: 4 }}>{f.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Catálogo ───────────────────────────────────────────── */}
            <section id="catalogo" style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(48px,7vw,96px) clamp(16px,3vw,44px)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 36, flexWrap: 'wrap' }}>
                    <div>
                        <div style={eyebrow}>Catálogo</div>
                        <h2 style={h2}>Lo que imprimimos.</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {CATS.map(c => {
                            const on = filter === c;
                            return (
                                <button key={c} onClick={() => setFilter(c)}
                                    style={{
                                        padding: '9px 16px', borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                        ...(on ? { background: C.royal, color: '#fff', border: `1px solid ${C.royal}` } : { background: '#fff', color: C.body, border: `1px solid ${C.borderStrong}` }),
                                    }}>{c}</button>
                            );
                        })}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 22 }}>
                    {items.map(it => (
                        <div key={it.label} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
                            <div style={{ height: 184, position: 'relative', overflow: 'hidden', background: `#F5F7FD url("${IMG(it.img)}") center/cover no-repeat` }}>
                                <span style={{ position: 'absolute', top: 12, left: 12, padding: '5px 10px', background: 'rgba(255,255,255,.94)', borderRadius: 7, fontSize: 11, fontWeight: 700, color: C.royal }}>{it.tag}</span>
                            </div>
                            <div style={{ padding: '20px 22px 22px' }}>
                                <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, letterSpacing: '-.025em', color: C.ink }}>{it.label}</div>
                                <p style={{ margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.65, color: C.muted }}>{it.desc}</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.divider}` }}>
                                    <span style={{ fontSize: 12.5, color: '#6B7590' }}>Entrega {it.eta}</span>
                                    <a href={WA(`Hola, quiero cotizar: ${it.label}.`)} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: C.royal, textDecoration: 'none' }}>Cotizar →</a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Documentos SRI ─────────────────────────────────────── */}
            <section id="sri" style={{ background: C.ink, color: '#fff', padding: 'clamp(56px,7vw,96px) 0' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(16px,3vw,44px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,330px),1fr))', gap: 'clamp(32px,5vw,72px)', alignItems: 'center' }}>
                    <div>
                        <div style={{ ...eyebrow, color: '#7E8CBE' }}>Documentos SRI</div>
                        <h2 style={{ margin: '14px 0 18px', fontFamily: DISPLAY, fontSize: 'clamp(28px,3.4vw,40px)', fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1.1 }}>
                            Su numeración, revisada antes de entrar a prensa.
                        </h2>
                        <p style={{ margin: '0 0 30px', fontSize: 16.5, lineHeight: 1.7, color: '#C9D2EC', maxWidth: '32rem' }}>
                            Validamos régimen, estado del contribuyente y secuencia autorizada en el padrón del SRI. Si algo no cuadra, se lo avisamos antes de imprimir.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {SRI_POINTS.map(p => (
                                <div key={p.label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 99, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: C.gold }}>✓</span>
                                    <span>
                                        <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{p.label}</span>
                                        <span style={{ display: 'block', fontSize: 13.5, color: '#A9B5DC', marginTop: 2 }}>{p.detail}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <RucValidatorWidget />
                </div>
            </section>

            {/* ── Acabados ───────────────────────────────────────────── */}
            <section id="acabados" style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(48px,7vw,96px) clamp(16px,3vw,44px)' }}>
                <div style={{ maxWidth: '34rem', marginBottom: 40 }}>
                    <div style={eyebrow}>Acabados</div>
                    <h2 style={h2}>Papel y tacto, elegidos a mano.</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 28, alignItems: 'start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {FINISHES.map(f => {
                            const on = finishId === f.id;
                            return (
                                <button key={f.id} onClick={() => setFinishId(f.id)}
                                    style={{
                                        width: '100%', padding: '15px 18px', borderRadius: 12, textAlign: 'left',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                                        cursor: 'pointer', color: C.ink, fontFamily: 'inherit', transition: 'all .3s',
                                        background: on ? C.chip : '#fff', border: `1px solid ${on ? C.royal : C.border}`,
                                    }}>
                                    <span>
                                        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600 }}>{f.name}</span>
                                        <span style={{ display: 'block', fontSize: 12, color: '#6B7590', marginTop: 2 }}>{f.tag}</span>
                                    </span>
                                    <span style={{ fontSize: 15, color: C.royal }}>→</span>
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ height: 280, background: fin.swatch }} />
                        <div style={{ padding: '28px 32px 32px' }}>
                            <div style={{ fontSize: 11.5, letterSpacing: '.18em', textTransform: 'uppercase', color: C.faint }}>{fin.tag}</div>
                            <h3 style={{ margin: '10px 0 12px', fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, letterSpacing: '-.03em', color: C.ink }}>{fin.name}</h3>
                            <p style={{ margin: '0 0 22px', fontSize: 15, lineHeight: 1.7, color: '#4A5470', maxWidth: '44rem' }}>{fin.desc}</p>
                            <a href={WA(`Hola, quiero pedir una muestra física de: ${fin.name}.`)} target="_blank" rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '12px 20px', background: C.soft, color: C.royal, borderRadius: 11, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                                Pedir muestra física en el taller →
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Rastreo ────────────────────────────────────────────── */}
            <section id="rastreo" style={{ background: C.bg, borderTop: `1px solid #E9ECF5`, borderBottom: `1px solid #E9ECF5`, padding: 'clamp(48px,6vw,80px) 0' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(16px,3vw,44px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 'clamp(28px,4vw,56px)', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: '0 0 12px', fontFamily: DISPLAY, fontSize: 'clamp(26px,3vw,32px)', fontWeight: 600, letterSpacing: '-.03em', color: C.ink }}>Rastree su pedido</h2>
                        <p style={{ margin: '0 0 22px', fontSize: 15.5, lineHeight: 1.7, color: '#4A5470' }}>
                            Con el número de orden que recibió por WhatsApp puede ver en qué etapa está su trabajo.
                        </p>
                        <form onSubmit={buscarOrden} style={{ display: 'flex', gap: 10, maxWidth: '26rem' }}>
                            <input value={orden} onChange={e => setOrden(e.target.value)} placeholder="ORD-4821"
                                style={{ flex: 1, minWidth: 0, padding: '14px 16px', background: '#fff', border: `1px solid ${C.borderStrong}`, borderRadius: 11, fontSize: 14.5, outline: 'none', fontFamily: MONO, color: C.ink }} />
                            <button type="submit" style={{ padding: '14px 22px', background: C.royal, color: '#fff', border: 'none', borderRadius: 11, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Buscar</button>
                        </form>
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #E1E6F5', borderRadius: 16, padding: '26px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <span style={{ fontFamily: MONO, fontSize: 13, color: C.ink }}>ORD-4821</span>
                            <span style={{ padding: '5px 11px', background: C.chip, color: C.royal, borderRadius: 7, fontSize: 11.5, fontWeight: 700 }}>En prensa</span>
                        </div>
                        <div>
                            {TRACK.map(t => (
                                <div key={t.label} style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 14, alignItems: 'center', padding: '11px 0', borderBottom: `1px solid ${C.soft}` }}>
                                    <span style={{
                                        width: 11, height: 11, borderRadius: 99, justifySelf: 'center',
                                        ...(t.done ? { background: C.royal } : t.current ? { background: C.gold, boxShadow: '0 0 0 4px rgba(255,198,26,.25)' } : { background: '#fff', border: `1.5px solid ${C.borderStrong}` }),
                                    }} />
                                    <span style={{ fontSize: 14, color: t.done ? C.ink : t.current ? C.royal : C.faint }}>{t.label}</span>
                                    <span style={{ fontSize: 12, color: C.faint, fontFamily: MONO }}>{t.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ────────────────────────────────────────────────── */}
            <section style={{ position: 'relative', overflow: 'hidden', background: C.royal, color: '#fff', padding: 'clamp(56px,6vw,88px) 0' }}>
                <div style={{ position: 'absolute', left: -140, bottom: -200, width: 560, height: 560, borderRadius: 99, background: 'radial-gradient(circle, rgba(255,255,255,.14) 0%, transparent 62%)' }} />
                <div style={{ position: 'relative', maxWidth: 1320, margin: '0 auto', padding: '0 clamp(16px,3vw,44px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 'clamp(28px,3.6vw,42px)', fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1.08 }}>Su talonario puede estar listo mañana.</h2>
                        <p style={{ margin: '14px 0 0', fontSize: 16.5, color: '#C9D2EC' }}>Av. Las Palmeras y Calle 4ta · Machala · Lun–Vie 8–18h · Sáb 8–14h</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <a href={WA('Hola, quiero encargar un trabajo de impresión.')} target="_blank" rel="noreferrer"
                            style={{ padding: '17px 28px', background: '#fff', color: C.ink, borderRadius: 12, fontSize: 15.5, fontWeight: 600, textDecoration: 'none' }}>Escribir por WhatsApp</a>
                        <a href="tel:+593993083943"
                            style={{ padding: '17px 26px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 12, fontSize: 15.5, fontWeight: 600, textDecoration: 'none' }}>Llamar al taller</a>
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────────── */}
            <footer style={{ background: '#fff' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: '52px clamp(16px,3vw,44px) 36px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))', gap: 40 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src="/LOGO.png" alt="" style={{ height: 30, width: 'auto' }} />
                            <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, color: C.ink }}>Imprenta Córdova</span>
                        </div>
                        <p style={{ margin: '16px 0 0', fontSize: 13.5, lineHeight: 1.7, color: '#6B7590', maxWidth: '22rem' }}>
                            Establecimiento gráfico autorizado por el SRI N° 001-001. Machala, El Oro — Ecuador.
                        </p>
                    </div>
                    <div>
                        <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint, marginBottom: 14 }}>Catálogo</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                            <Link to="/vitrina" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Facturas SRI</Link>
                            <Link to="/vitrina" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Talonarios</Link>
                            <Link to="/vitrina" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Sellos</Link>
                            <Link to="/vitrina" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Gigantografía</Link>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint, marginBottom: 14 }}>Servicio</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                            <Link to="/tracking" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Rastrear pedido</Link>
                            <a href="#sri" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Validar RUC</a>
                            <Link to="/login" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Acceso operador</Link>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint, marginBottom: 14 }}>Contacto</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13.5, color: C.body }}>
                            <a href="tel:+593993083943" style={{ color: C.body, textDecoration: 'none' }}>+593 99 308 3943</a>
                            <span>Av. Las Palmeras y Calle 4ta</span>
                        </div>
                    </div>
                </div>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: '18px clamp(16px,3vw,44px) 40px', borderTop: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: C.faint }}>© 2026 Imprenta Córdova.</span>
                    <span style={{ fontSize: 12, color: C.faint, fontFamily: MONO }}>SRI 001-001</span>
                </div>
            </footer>

            {/* ── Barra de acción en celular (Publica-B-Movil) ───────── */}
            <div className="md:hidden" style={{ height: 78 }} />
            <div className="md:hidden" style={{
                position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 90,
                padding: '12px 16px calc(16px + env(safe-area-inset-bottom))',
                background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(14px)', borderTop: `1px solid ${C.divider}`,
                display: 'flex', gap: 10,
            }}>
                <a href={WA('Hola, quiero cotizar la impresión de mis documentos. Mi RUC es:')} target="_blank" rel="noreferrer"
                    style={{ flex: 1, textAlign: 'center', padding: 15, background: C.royal, color: '#fff', borderRadius: 13, fontSize: 14.5, fontWeight: 600, textDecoration: 'none', minHeight: 48 }}>
                    Enviar mi RUC
                </a>
                <a href="tel:+593993083943"
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 52, minHeight: 48, background: C.soft, color: C.royal, borderRadius: 13, fontSize: 19, textDecoration: 'none' }}
                    aria-label="Llamar">☎</a>
            </div>
        </div>
    );
};

export default VisualLanding;
