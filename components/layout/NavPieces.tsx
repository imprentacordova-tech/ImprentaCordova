/**
 * Piezas del menú lateral — Imprenta Córdova
 * ==========================================
 *
 * `RoleBadge`, `NavItem` y `NavGroup`: los tres componentes presentacionales que
 * arma el sidebar del panel interno. Salieron de `components/Layout.tsx` sin
 * cambios de comportamiento, solo para que el shell deje de ser un archivo de
 * 956 líneas donde convivían el modelo de navegación, las tres piezas visuales
 * y el layout en sí.
 *
 * Los tres están memoizados: el sidebar se vuelve a renderizar cada vez que
 * cambian las órdenes (los badges), y sin `memo` se repintaba toda la lista.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PuzzlePieceIcon, ChevronDownIcon, ChevronRightIcon } from '../Icons';
import { C, MONO } from '../panelTheme';
import { ATAJOS, RUTA_CTA, type NavItemModel, type NavGroupModel } from './navModel';

const ROLE_STYLE: Record<string, React.CSSProperties> = {
    'Admin':     { background: 'rgba(255,198,26,.1)', color: C.gold, borderColor: 'rgba(255,198,26,.3)' },
    'root':      { background: 'rgba(231,1,1,.1)', color: '#FF6B6B', borderColor: 'rgba(231,1,1,.25)' },
    'Operador':  { background: 'rgba(43,98,255,.12)', color: '#9DB4FF', borderColor: 'rgba(43,98,255,.25)' },
    'Diseñador': { background: 'rgba(139,92,246,.14)', color: '#C4B0FF', borderColor: 'rgba(139,92,246,.3)' },
};

export const RoleBadge: React.FC<{ rol: string }> = React.memo(({ rol }) => (
    <span
        style={{
            display: 'inline-block', marginTop: 3, padding: '2px 7px', borderRadius: 99, border: '1px solid transparent',
            fontSize: 7.5, fontWeight: 800, letterSpacing: '.24em', textTransform: 'uppercase',
            ...(ROLE_STYLE[rol] ?? { background: 'rgba(255,255,255,.06)', color: '#9AA6CE', borderColor: 'rgba(255,255,255,.12)' }),
        }}
    >
        {rol}
    </span>
));

export const NavItem: React.FC<{
    item: NavItemModel;
    badges: Record<string, number>;
    onClick?: () => void;
    isMobile?: boolean;
}> = React.memo(({ item, badges, onClick, isMobile }) => {
    const [hover, setHover] = useState(false);
    const badgeCount = item.badge ? (typeof item.badge === 'number' ? item.badge : badges[item.badge]) : 0;
    const isDownload = item.path.endsWith('.zip');

    const rowBase: React.CSSProperties = {
        width: '100%', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 11,
        padding: isMobile ? '10px 12px' : '9px 12px',
        minHeight: isMobile ? 48 : 38,
        borderRadius: 11, cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all .2s',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
    };

    if (isDownload) {
        return (
            <a
                href={item.path}
                download
                onClick={onClick}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{ ...rowBase, color: '#7FD3A6', background: hover ? 'rgba(27,110,62,.16)' : 'rgba(27,110,62,.08)' }}
            >
                <div style={{
                    width: isMobile ? 32 : 24, height: isMobile ? 32 : 24,
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(27,110,62,.2)', flexShrink: 0
                }}>
                    <PuzzlePieceIcon className={isMobile ? "w-4 h-4" : "w-[15px] h-[15px]"} />
                </div>
                <span style={{ flex: 1, fontSize: isMobile ? 13 : 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                <span style={{ flexShrink: 0, padding: isMobile ? '2px 8px' : '1px 7px', borderRadius: 99, fontSize: 9.5, fontWeight: 800, background: 'rgba(127,211,166,.18)', color: '#7FD3A6' }}>
                    {item.badge || 'ZIP'}
                </span>
            </a>
        );
    }

    const atajo = ATAJOS[item.path];
    const esCTA = item.path === RUTA_CTA;

    return (
        <NavLink
            to={item.path}
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={({ isActive }) => ({
                ...rowBase,
                position: 'relative',
                overflow: 'hidden',
                ...(esCTA
                    ? {
                        background: C.gold, color: C.ink, fontWeight: 700,
                        boxShadow: isActive ? '0 0 0 2px rgba(255,198,26,.45)' : '0 6px 16px -10px rgba(255,198,26,.9)',
                    }
                    : { background: isActive ? (isMobile ? 'rgba(255,198,26,.14)' : 'rgba(255,198,26,.12)') : (hover ? 'rgba(255,255,255,.05)' : 'transparent'), color: isActive ? C.gold : '#C2CAE6' }),
            })}
        >
            {({ isActive }) => (
                <>
                    {isActive && !esCTA && (
                        <motion.div
                            layoutId={isMobile ? "sidebarMobileActivePill" : "sidebarActivePill"}
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: isMobile ? 'rgba(255,198,26,.14)' : 'rgba(255,198,26,.12)',
                                borderLeft: '3px solid #FFC61A',
                                borderRadius: 10,
                                zIndex: 0,
                            }}
                        />
                    )}
                    {/* Contenedor de ícono nítido y ergonómico */}
                    <span style={{
                        position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: isMobile ? 32 : 22, height: isMobile ? 32 : 22,
                        borderRadius: isMobile ? 8 : 6,
                        background: esCTA ? 'transparent' : (isActive ? 'rgba(255,198,26,.18)' : (isMobile ? 'rgba(255,255,255,.05)' : 'transparent')),
                        color: esCTA ? C.ink : isActive ? C.gold : (isMobile ? '#A8B3D8' : '#8E9AC4'),
                        flexShrink: 0
                    }}>
                        <item.icon className={isMobile ? "w-[17px] h-[17px] shrink-0" : "w-[15px] h-[15px] shrink-0"} />
                    </span>
                    <span style={{
                        position: 'relative', zIndex: 1, flex: 1,
                        fontSize: isMobile ? 13 : 12,
                        fontWeight: esCTA ? 800 : (isActive ? 700 : 600),
                        letterSpacing: '.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                        {item.label}
                    </span>
                    {badgeCount > 0 ? (
                        <span style={{
                            position: 'relative', zIndex: 1, flexShrink: 0, padding: isMobile ? '2px 8px' : '1px 7px', borderRadius: 99,
                            fontSize: isMobile ? 10.5 : 9.5, fontWeight: 800,
                            ...(esCTA
                                ? { background: 'rgba(10,17,64,.16)', color: C.ink }
                                : isActive ? { background: 'rgba(255,198,26,.26)', color: C.gold } : { background: 'rgba(255,255,255,.1)', color: '#CBD5E1' }),
                        }}>
                            {badgeCount}
                        </span>
                    ) : (
                        isMobile && !esCTA && (
                            <ChevronRightIcon
                                className="w-3.5 h-3.5 shrink-0"
                                style={{
                                    position: 'relative', zIndex: 1,
                                    color: isActive ? C.gold : 'rgba(255,255,255,.2)',
                                    opacity: isActive ? 1 : 0.6
                                }}
                            />
                        )
                    )}
                    {/* Atajo de teclado sólo en computadoras de escritorio */}
                    {!isMobile && atajo && (
                        <span
                            title={`Atajo: Alt + ${atajo}`}
                            style={{
                                position: 'relative', zIndex: 1, flexShrink: 0, padding: '1px 5px', borderRadius: 5, fontFamily: MONO, fontSize: 9,
                                fontWeight: 700, letterSpacing: '.04em',
                                border: `1px solid ${esCTA ? 'rgba(10,17,64,.22)' : 'rgba(255,255,255,.14)'}`,
                                background: esCTA ? 'rgba(255,255,255,.28)' : 'transparent',
                                color: esCTA ? 'rgba(10,17,64,.75)' : isActive ? C.gold : '#6E7A9E',
                            }}
                        >⌥{atajo}</span>
                    )}
                </>
            )}
        </NavLink>
    );
});

export const NavGroup: React.FC<{
    group: NavGroupModel;
    badges: Record<string, number>;
    onNavClick?: () => void;
    isMobile?: boolean;
}> = React.memo(({ group, badges, onNavClick, isMobile }) => {
    const location = useLocation();
    const isGroupActive = group.items.some(i => location.pathname === i.path);
    const [open, setOpen] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem(`nav-group-${group.id}`);
        if (saved !== null) setOpen(saved === 'true');
    }, [group.id]);

    const toggle = useCallback(() => {
        const next = !open;
        setOpen(next);
        localStorage.setItem(`nav-group-${group.id}`, String(next));
    }, [open, group.id]);

    return (
        <div style={isMobile ? {
            background: 'rgba(255,255,255,.025)',
            border: '1px solid rgba(255,255,255,.05)',
            borderRadius: 14,
            padding: '5px 6px 7px',
        } : undefined}>
            <button
                onClick={toggle}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: isMobile ? '7px 10px 8px' : '5px 12px 7px',
                    minHeight: isMobile ? 36 : undefined,
                    background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: isGroupActive ? C.gold : '#5C6892',
                        transition: 'background 0.2s',
                    }} />
                    <span style={{
                        fontSize: isMobile ? 10 : 9, fontWeight: 800, letterSpacing: '.28em', textTransform: 'uppercase',
                        color: isGroupActive ? C.gold : '#7B88B2',
                    }}>
                        {group.title}
                    </span>
                </div>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? '' : '-rotate-90'}`} style={{ color: isGroupActive ? C.gold : '#5C6892' }} />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: isMobile ? 4 : 2 }}
                    >
                        {group.items.map(item => (
                            <NavItem key={item.path} item={item} badges={badges} onClick={onNavClick} isMobile={isMobile} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
