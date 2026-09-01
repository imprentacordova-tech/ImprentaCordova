import React from 'react';
import { TrabajoEstado } from '../types';

/**
 * Tokens compartidos del Sistema "Marino & Oro" (tema claro).
 * Ver design_manifest.md §2. Referencia visual: pages/PanelInterno.tsx.
 */

export const C = {
    bg: '#F7F9FF',
    ink: '#0A1140',
    royal: '#16309B',
    royalHover: '#0F2280',
    gold: '#FFC61A',
    goldHover: '#F0B400',
    danger: '#E70101',
    success: '#1B6E3E',
    successDot: '#1B8A4B',
    surface: '#FFFFFF',
    surfaceAlt: '#FAFBFF',
    border: '#E4E8F4',
    borderStrong: '#D7DDF0',
    divider: '#EEF0F8',
    rowLine: '#F2F4FA',
    softGray: '#F2F4FA',
    chipBlue: '#EEF1FC',
    body: '#3C4763',
    muted: '#6B7590',
    faint: '#8A93AE',
    ghost: '#A6AFC8',

    /* Familia ámbar (alertas suaves, saldos, notas de taller) */
    goldBg: '#FFFBEB',
    goldBorder: '#F4E3A8',
    goldText: '#7A5A00',
    goldTextStrong: '#B45309',

    /* Familia verde (confirmación, WhatsApp, ingresos) */
    successBg: '#F2F7F2',
    successBorder: '#D8E8DC',
    successStrong: '#155C33',

    /* Familia roja (errores, egresos) */
    dangerBg: '#FDEEEE',
    dangerBorder: '#F3C6C6',
    dangerText: '#B91C1C',

    /* Familia violeta (estado "En Diseño") */
    violet: '#6D28D9',
    violetBg: '#F5F3FF',

    /* Texto y superficies SOBRE marino `ink` (cabecera del cajón, franjas SRI) */
    onInk: '#FFFFFF',
    onInkSoft: '#C2CAE6',
    onInkMuted: '#9AA6CE',
    onInkFaint: '#8E9AC4',
    onInkSuccess: '#7BE0A6',
    onInkDanger: '#FF9B9B',
    onInkLayer: 'rgba(255,255,255,.06)',
    onInkLayerHover: 'rgba(255,255,255,.14)',
    onInkBorder: 'rgba(255,255,255,.16)',
    onInkGoldLayer: 'rgba(255,198,26,.14)',
    onInkDangerLayer: 'rgba(231,1,1,.18)',
    scrim: 'rgba(10,17,64,.44)',
} as const;

export const MONO = "'JetBrains Mono',monospace";
export const DISPLAY = "'Outfit',sans-serif";

export type EstadoCfg = { label: string; color: string; bg: string; border: string; dot: string };

export const ESTADO: Record<TrabajoEstado, EstadoCfg> = {
    [TrabajoEstado.PENDIENTE]: { label: 'Pendiente', color: '#B45309', bg: '#FFFBEB', border: '#F4E3A8', dot: '#FFC61A' },
    [TrabajoEstado.EN_DISENO]: { label: 'En Diseño', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD3FE', dot: '#8B5CF6' },
    [TrabajoEstado.PROCESO]:   { label: 'En Prensa', color: '#16309B', bg: '#EEF1FC', border: '#D7DDF0', dot: '#16309B' },
    [TrabajoEstado.VITRINA]:   { label: 'Listo',     color: '#1B6E3E', bg: '#F2F7F2', border: '#D8E8DC', dot: '#1B8A4B' },
    [TrabajoEstado.ENTREGADO]: { label: 'Entregado', color: '#5B6480', bg: '#F5F6FA', border: '#E4E8F4', dot: '#A6AFC8' },
};

export const estadoCfg = (e: TrabajoEstado): EstadoCfg => ESTADO[e] ?? ESTADO[TrabajoEstado.PENDIENTE];

export const dot = (bg: string, size = 8): React.CSSProperties => ({
    width: size, height: size, borderRadius: 99, background: bg, flexShrink: 0, display: 'inline-block',
});

export const estadoPill = (e: EstadoCfg): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 99,
    fontSize: 11.5, fontWeight: 600, background: e.bg, border: `1px solid ${e.border}`, color: e.color,
});

export const S = {
    page: { padding: 'clamp(18px,2.2vw,30px) clamp(16px,2.4vw,32px) 96px', minHeight: '100%' } as React.CSSProperties,
    wrap: { maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, animation: 'pi-rise .6s cubic-bezier(.2,.8,.2,1) both' } as React.CSSProperties,
    eyebrow: { margin: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: '.32em', textTransform: 'uppercase', color: C.faint } as React.CSSProperties,
    h1: { margin: '5px 0 0', fontFamily: DISPLAY, fontSize: 27, fontWeight: 600, letterSpacing: '-.035em', color: C.ink } as React.CSSProperties,
    h2: { margin: 0, fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, letterSpacing: '-.03em', color: C.ink } as React.CSSProperties,
    lead: { margin: '6px 0 0', fontSize: 13.5, color: C.muted } as React.CSSProperties,
    card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16 } as React.CSSProperties,
    colHead: { fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint } as React.CSSProperties,
    fieldLabel: { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: C.faint, marginBottom: 6 } as React.CSSProperties,
    input: { width: '100%', padding: '12px 14px', background: C.bg, border: `1px solid ${C.borderStrong}`, borderRadius: 10, fontSize: 13.5, color: C.ink, outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
    primaryBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: C.royal, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
    outlineBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: '#fff', color: C.royal, border: `1px solid ${C.borderStrong}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
    softBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: C.softGray, color: C.royal, border: 'none', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
    accentCard: { background: C.ink, borderRadius: 16, padding: '18px 20px', color: '#fff' } as React.CSSProperties,
};

/** keyframes usados por las vistas (`pi-rise`, `pi-blink`, `spin`, `pi-slide-in`, `pi-fade-in`) */
export const PANEL_KEYFRAMES =
    '@keyframes pi-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}' +
    '@keyframes pi-blink{0%,100%{opacity:1}50%{opacity:.2}}' +
    '@keyframes spin{to{transform:rotate(360deg)}}' +
    '@keyframes pi-slide-in{from{opacity:.4;transform:translateX(46px)}to{opacity:1;transform:translateX(0)}}' +
    '@keyframes pi-fade-in{from{opacity:0}to{opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;transition-duration:.01ms!important}}';

export const PageLoaderLite: React.FC<{ label?: string }> = ({ label = 'Cargando datos…' }) =>
    React.createElement(
        'div',
        { style: { minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement(
            'div',
            { style: { textAlign: 'center' } },
            React.createElement('style', null, PANEL_KEYFRAMES),
            React.createElement('div', {
                style: { width: 40, height: 40, border: '2px solid #D7DDF0', borderTopColor: C.royal, borderRadius: 99, animation: 'spin 1s linear infinite', margin: '0 auto' },
            }),
            React.createElement('p', {
                style: { marginTop: 14, fontSize: 11, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '.2em' },
            }, label),
        ),
    );
