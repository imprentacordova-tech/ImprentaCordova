import React, { useState, useMemo } from 'react';
import { SEO } from '../components/SEO';
import PublicNavbar from '../components/PublicNavbar';

/**
 * Catálogo público — fiel a `Publica-B-Vitrina-Catalogo.dc.html` (Claude Design).
 * Tema azul/blanco, mismo sistema que el panel interno.
 */

const C = {
    ink: '#0A1140', royal: '#16309B', royalHover: '#0F2280', border: '#E4E8F4', borderStrong: '#D7DDF0',
    divider: '#EEF0F8', body: '#3C4763', muted: '#5B6480', faint: '#8A93AE', bg: '#F7F9FF', chip: '#EEF1FC', soft: '#F2F4FA',
};
const DISPLAY = "'Outfit',sans-serif";
const MONO = "'JetBrains Mono',monospace";
const WA = 'https://wa.me/593993083943?text=Hola%2C+quiero+cotizar%3A+';
const IMG = (n: string) => `/images/landing/${n}`;

type Item = {
    cat: string; img: string; tag: string; label: string; desc: string; eta: string; fast?: boolean;
    specs: { k: string; v: string }[];
};

const ITEMS: Item[] = [
    { cat: 'SRI', img: 'talonarios.png', tag: 'SRI', label: 'Facturas impresas', desc: 'Régimen General y RIMPE-Emprendedor con numeración secuencial autorizada.', eta: '24 h', fast: true, specs: [{ k: 'Mínimo', v: '100 juegos' }, { k: 'Papel', v: 'Químico 3 copias' }] },
    { cat: 'SRI', img: 'talonarios.png', tag: 'SRI', label: 'Notas de venta', desc: 'Formato simplificado aprobado para RIMPE Negocio Popular.', eta: '24 h', fast: true, specs: [{ k: 'Mínimo', v: '100 juegos' }, { k: 'Papel', v: 'Químico 2 copias' }] },
    { cat: 'SRI', img: 'printer_gold.png', tag: 'Autocopiativo', label: 'Guías de remisión', desc: 'Traslado de mercadería con original y copias autocopiativas.', eta: '24–48 h', specs: [{ k: 'Mínimo', v: '50 juegos' }, { k: 'Formato', v: 'A5 / media carta' }] },
    { cat: 'SRI', img: 'printer_gold.png', tag: 'Autocopiativo', label: 'Comprobantes de retención', desc: 'Numeración correlativa bajo normativa vigente del SRI.', eta: '24–48 h', specs: [{ k: 'Mínimo', v: '50 juegos' }, { k: 'Copias', v: 'Original + 2' }] },
    { cat: 'Comercial', img: 'business_cards.png', tag: 'Offset', label: 'Tarjetas de presentación', desc: 'Couché 300 g con laminado soft touch o brillo UV selectivo.', eta: '48 h', specs: [{ k: 'Mínimo', v: '100 unidades' }, { k: 'Acabado', v: 'Soft touch / UV' }] },
    { cat: 'Comercial', img: 'branding.png', tag: 'Papelería', label: 'Carpetas y hojas membretadas', desc: 'Papelería corporativa completa: carpetas, sobres y hojas A4.', eta: '48–72 h', specs: [{ k: 'Mínimo', v: '50 unidades' }, { k: 'Papel', v: 'Bond 90 g / cartulina' }] },
    { cat: 'Comercial', img: 'branding.png', tag: 'Troquel', label: 'Etiquetas adhesivas', desc: 'En hojas o rollo, con troquel personalizado para su envase.', eta: '48 h', specs: [{ k: 'Mínimo', v: '1 pliego' }, { k: 'Material', v: 'Adhesivo brillante' }] },
    { cat: 'Sellos', img: 'printer_gold.png', tag: 'Trodat', label: 'Sello automático', desc: 'Caucho polímero láser con tinta reponible, entrega el mismo día.', eta: 'Mismo día', fast: true, specs: [{ k: 'Mínimo', v: '1 unidad' }, { k: 'Modelos', v: 'Trodat / Shiny' }] },
    { cat: 'Gran formato', img: 'gigantografia.png', tag: '1440 dpi', label: 'Gigantografía HD', desc: 'Lona eco-solvente para rótulos, banners y vallas de exterior.', eta: '24 h', fast: true, specs: [{ k: 'Mínimo', v: '1 m²' }, { k: 'Material', v: 'Lona 13 oz' }] },
];

const CATS = ['Todo', 'SRI', 'Comercial', 'Sellos', 'Gran formato'];
const ETAS = ['Cualquiera', 'Mismo día / 24 h', '48 h o más'];

const Vitrina: React.FC = () => {
    const [cat, setCat] = useState('Todo');
    const [eta, setEta] = useState('Cualquiera');
    const [query, setQuery] = useState('');

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        return ITEMS.filter(i => {
            if (cat !== 'Todo' && i.cat !== cat) return false;
            if (eta === 'Mismo día / 24 h' && !i.fast) return false;
            if (eta === '48 h o más' && i.fast) return false;
            if (q && !(i.label + ' ' + i.desc + ' ' + i.tag).toLowerCase().includes(q)) return false;
            return true;
        });
    }, [cat, eta, query]);

    return (
        <div style={{ background: '#fff', color: C.ink, fontFamily: "'Inter',system-ui,sans-serif", minHeight: '100vh' }}>
            <SEO title="Catálogo de impresión · Imprenta Córdova" description="Facturas, notas de venta, talonarios, sellos, tarjetas y gran formato. Diseño y prueba digital incluidos." />
            <PublicNavbar />

            <section style={{ borderBottom: `1px solid ${C.divider}`, background: 'linear-gradient(180deg,#F7F9FF,#fff)' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(40px,5vw,64px) clamp(16px,3vw,44px) clamp(28px,3vw,40px)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.faint }}>
                        <a href="/" style={{ color: C.faint, textDecoration: 'none' }}>Inicio</a><span>/</span><span style={{ color: C.body }}>Catálogo</span>
                    </div>
                    <h1 style={{ margin: '14px 0 0', fontFamily: DISPLAY, fontSize: 'clamp(32px,3.6vw,46px)', fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1.08, color: C.ink }}>Catálogo de impresión</h1>
                    <p style={{ margin: '12px 0 0', maxWidth: '52ch', fontSize: 16.5, lineHeight: 1.65, color: '#4A5470' }}>
                        {matches.length} {matches.length === 1 ? 'producto' : 'productos'} · diseño y prueba digital incluidos en todos los trabajos.
                    </p>
                </div>
            </section>

            <section style={{ maxWidth: 1320, margin: '0 auto', padding: 'clamp(28px,3vw,40px) clamp(16px,3vw,44px) clamp(56px,7vw,96px)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,280px) 1fr', gap: 28, alignItems: 'start' }}>

                    <aside className="hidden lg:block" style={{ position: 'sticky', top: 98 }}>
                        <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.divider}` }}>
                                <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint }}>Buscar</div>
                                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="talonario, sello, lona…"
                                    style={{ width: '100%', marginTop: 9, padding: '11px 13px', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 9, fontSize: 14, color: C.ink, outline: 'none', fontFamily: 'inherit' }} />
                            </div>
                            <div style={{ padding: '16px 18px' }}>
                                <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint, marginBottom: 10 }}>Categoría</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {CATS.map(c => {
                                        const on = cat === c;
                                        const n = c === 'Todo' ? ITEMS.length : ITEMS.filter(i => i.cat === c).length;
                                        return (
                                            <button key={c} onClick={() => setCat(c)}
                                                style={{
                                                    width: '100%', padding: '9px 11px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                                                    fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                                                    border: `1px solid ${on ? C.royal : 'transparent'}`, background: on ? C.chip : '#fff',
                                                    color: on ? C.ink : C.body, fontWeight: on ? 600 : 500,
                                                }}>
                                                <span>{c}</span>
                                                <span style={{ fontSize: 12, color: C.faint, fontFamily: MONO }}>{n}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div style={{ padding: '0 18px 18px' }}>
                                <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint, marginBottom: 10 }}>Entrega</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {ETAS.map(e => {
                                        const on = eta === e;
                                        return (
                                            <button key={e} onClick={() => setEta(e)}
                                                style={{
                                                    padding: '7px 12px', borderRadius: 99, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                                    ...(on ? { background: C.royal, color: '#fff', border: `1px solid ${C.royal}` } : { background: '#fff', color: C.body, border: `1px solid ${C.borderStrong}` }),
                                                }}>{e}</button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 14, padding: 18, background: C.ink, borderRadius: 14, color: '#fff' }}>
                            <div style={{ fontSize: 11.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#93A0C8' }}>¿No encuentra su formato?</div>
                            <p style={{ margin: '8px 0 14px', fontSize: 13.5, lineHeight: 1.65, color: '#C9D2EC' }}>Imprimimos casi cualquier documento comercial. Cuéntenos qué necesita.</p>
                            <a href={WA + 'un%20formato%20a%20medida'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: 11, background: '#fff', color: C.ink, borderRadius: 9, fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>Escribir por WhatsApp</a>
                        </div>
                    </aside>

                    <div style={{ minWidth: 0 }}>
                        {/* filtros compactos en celular */}
                        <div className="lg:hidden" style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 12, marginBottom: 4 }}>
                            {CATS.map(c => (
                                <button key={c} onClick={() => setCat(c)}
                                    style={{
                                        flexShrink: 0, padding: '7px 13px', borderRadius: 99, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                                        ...(cat === c ? { background: C.royal, color: '#fff', border: `1px solid ${C.royal}` } : { background: '#fff', color: C.body, border: `1px solid ${C.borderStrong}` }),
                                    }}>{c}</button>
                            ))}
                        </div>

                        {matches.length === 0 ? (
                            <div style={{ padding: '56px 24px', textAlign: 'center', border: `1px dashed ${C.borderStrong}`, borderRadius: 16, color: C.muted }}>
                                <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: C.ink }}>Sin resultados</div>
                                <p style={{ margin: '8px 0 0', fontSize: 14 }}>Pruebe otra categoría o escríbanos: imprimimos formatos a medida.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,268px),1fr))', gap: 20 }}>
                                {matches.map(it => (
                                    <div key={it.label + it.tag} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ height: 176, position: 'relative', overflow: 'hidden', background: `#F5F7FD url("${IMG(it.img)}") center/cover no-repeat` }}>
                                            <span style={{ position: 'absolute', top: 12, left: 12, padding: '5px 10px', background: 'rgba(255,255,255,.94)', borderRadius: 7, fontSize: 11, fontWeight: 700, color: C.royal }}>{it.tag}</span>
                                        </div>
                                        <div style={{ padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                            <div style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, letterSpacing: '-.025em', color: C.ink }}>{it.label}</div>
                                            <p style={{ margin: '7px 0 14px', fontSize: 13.5, lineHeight: 1.6, color: C.muted }}>{it.desc}</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
                                                {it.specs.map(sp => (
                                                    <div key={sp.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12.5 }}>
                                                        <span style={{ color: C.faint }}>{sp.k}</span>
                                                        <span style={{ color: C.ink, fontWeight: 600 }}>{sp.v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.divider}` }}>
                                                <span style={{ fontSize: 12.5, color: C.muted }}>Entrega {it.eta}</span>
                                                <a href={WA + encodeURIComponent(it.label)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: C.royal, textDecoration: 'none' }}>Cotizar →</a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section style={{ background: C.royal, color: '#fff', padding: 'clamp(56px,6vw,80px) 0' }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(16px,3vw,44px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 'clamp(28px,3vw,38px)', fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1.1 }}>Pida muestras físicas en el taller.</h2>
                        <p style={{ margin: '12px 0 0', fontSize: 16, color: '#C9D2EC' }}>Av. Las Palmeras y Calle 4ta · Machala · Lun–Vie 8–18h · Sáb 8–14h</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <a href={WA + 'muestras'} target="_blank" rel="noopener noreferrer" style={{ padding: '16px 26px', background: '#fff', color: C.ink, borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Escribir por WhatsApp</a>
                        <a href="/tracking" style={{ padding: '16px 24px', background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Rastrear mi pedido</a>
                    </div>
                </div>
            </section>

            <footer style={{ background: '#fff', borderTop: `1px solid #E9ECF5` }}>
                <div style={{ maxWidth: 1320, margin: '0 auto', padding: '44px clamp(16px,3vw,44px) 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src="/LOGO.png" alt="" style={{ height: 28, width: 'auto' }} />
                        <span style={{ fontSize: 13.5, color: C.muted }}>© 2026 Imprenta Córdova · SRI 001-001 · Machala</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <a href="/" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Inicio</a>
                        <a href="/tracking" style={{ fontSize: 13.5, color: C.body, textDecoration: 'none' }}>Rastrear</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Vitrina;
