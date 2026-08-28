import React, { useState, useEffect } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';

/**
 * Cabecera pública — fiel a los diseños `Publica-B-*` (Claude Design).
 * Misma paleta azul/blanco del panel interno "Marino & Oro".
 */

const C = { ink: '#0A1140', royal: '#16309B', royalHover: '#0F2280', border: '#E9ECF5', body: '#3C4763', soft: '#F2F4FA', chip: '#EEF1FC' };
const WA = 'https://wa.me/593993083943?text=Hola%2C+me+gustar%C3%ADa+cotizar+un+trabajo.';

const LINKS = [
    { name: 'Catálogo', to: '/vitrina' },
    { name: 'Documentos SRI', to: '/' },
    { name: 'Rastrear', to: '/tracking' },
];

function isBusinessHoursNow(): boolean {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset();
    const ecOffset = -5 * 60;
    const ecNow = new Date(now.getTime() + (ecOffset - (-utcOffset)) * 60000);
    const day = ecNow.getDay();
    const hour = ecNow.getHours();
    if (day === 0) return false;
    if (day === 6) return hour >= 8 && hour < 14;
    return hour >= 8 && hour < 18;
}

const PublicNavbar: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [abierto, setAbierto] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setAbierto(isBusinessHoursNow());
        const t = setInterval(() => setAbierto(isBusinessHoursNow()), 60000);
        return () => clearInterval(t);
    }, []);
    useEffect(() => { setOpen(false); }, [location.pathname]);

    return (
        <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 clamp(16px,3vw,44px)', minHeight: 74, display: 'flex', alignItems: 'center', gap: 'clamp(12px,2vw,36px)', flexWrap: 'wrap' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                    <img src="/LOGO.png" alt="Imprenta Córdova" style={{ height: 32, width: 'auto' }} />
                    <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16.5, fontWeight: 700, letterSpacing: '-.02em', color: C.ink }}>Imprenta Córdova</span>
                </Link>

                <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 2, flex: 1, flexWrap: 'wrap' }}>
                    {LINKS.map(l => (
                        <NavLink key={l.to} to={l.to} end={l.to === '/'}
                            style={({ isActive }) => ({
                                padding: '9px 14px', fontSize: 14, borderRadius: 8, textDecoration: 'none',
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? C.royal : C.body,
                                background: isActive ? C.chip : 'transparent',
                            })}>
                            {l.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="hidden md:flex" style={{ alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', background: abierto ? '#F2F7F2' : C.soft, border: `1px solid ${abierto ? '#D8E8DC' : C.border}`, borderRadius: 99 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: abierto ? '#1B8A4B' : '#A6AFC8', animation: abierto ? 'pn-blink 2.4s ease-in-out infinite' : 'none' }} />
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: abierto ? '#1B6E3E' : '#6B7590' }}>{abierto ? 'Taller abierto' : 'Taller cerrado'}</span>
                    </span>
                    <a href={WA} target="_blank" rel="noopener noreferrer" style={{ padding: '11px 19px', background: C.royal, color: '#fff', borderRadius: 10, fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}>Cotizar</a>
                </div>

                <button className="md:hidden" onClick={() => setOpen(o => !o)}
                    style={{ marginLeft: 'auto', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.soft, border: `1px solid ${C.border}`, borderRadius: 10, cursor: 'pointer' }}
                    aria-label="Menú">
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3.5, width: 16 }}>
                        <span style={{ height: 2, background: C.ink, borderRadius: 2 }} />
                        <span style={{ height: 2, background: C.ink, borderRadius: 2 }} />
                        <span style={{ height: 2, background: C.ink, borderRadius: 2 }} />
                    </span>
                </button>
            </div>

            {open && (
                <div className="md:hidden" style={{ borderTop: `1px solid ${C.border}`, padding: '10px 16px 16px', display: 'flex', flexDirection: 'column', gap: 4, background: '#fff' }}>
                    {LINKS.map(l => (
                        <NavLink key={l.to} to={l.to} end={l.to === '/'}
                            style={({ isActive }) => ({ padding: '11px 12px', borderRadius: 9, fontSize: 14.5, fontWeight: 600, textDecoration: 'none', color: isActive ? C.royal : C.body, background: isActive ? C.chip : 'transparent' })}>
                            {l.name}
                        </NavLink>
                    ))}
                    <a href={WA} target="_blank" rel="noopener noreferrer" style={{ marginTop: 6, padding: 13, textAlign: 'center', background: C.royal, color: '#fff', borderRadius: 11, fontSize: 14.5, fontWeight: 600, textDecoration: 'none' }}>Cotizar por WhatsApp</a>
                </div>
            )}
            <style>{'@keyframes pn-blink{0%,100%{opacity:1}50%{opacity:.2}}'}</style>
        </header>
    );
};

export default PublicNavbar;
