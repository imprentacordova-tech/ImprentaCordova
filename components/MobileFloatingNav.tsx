import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, SparklesIcon, MonitorIcon, WalletIcon, ActivityIcon } from './Icons';

/**
 * Barra inferior de navegación para celular — fiel a `Panel-Movil-Tablet.dc.html`
 * (Claude Design). Cinco accesos planos, pegada abajo, tema Marino & Oro.
 * Solo visible < lg; en escritorio manda el sidebar del Layout.
 */

const C = { royal: '#16309B', faint: '#8A93AE', chip: '#EEF1FC', border: '#E4E8F4' };

const TABS: { path: string; label: string; icon: React.ElementType }[] = [
    { path: '/dashboard', label: 'Panel', icon: DashboardIcon },
    { path: '/nuevo', label: 'Nueva', icon: SparklesIcon },
    { path: '/kds', label: 'Taller', icon: MonitorIcon },
    { path: '/trabajos', label: 'Órdenes', icon: ActivityIcon },
    { path: '/cuentas', label: 'Cobrar', icon: WalletIcon },
];

export const MobileFloatingNav: React.FC = () => (
    <nav
        className="lg:hidden"
        style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100,
            display: 'flex', gap: 4, padding: '7px 8px calc(8px + env(safe-area-inset-bottom))',
            background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(14px)',
            borderTop: `1px solid ${C.border}`,
        }}
    >
        {TABS.map(t => (
            <NavLink
                key={t.path}
                to={t.path}
                style={({ isActive }) => ({
                    flex: 1, minWidth: 0, minHeight: 50,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    borderRadius: 11, textDecoration: 'none',
                    background: isActive ? C.chip : 'transparent',
                    color: isActive ? C.royal : C.faint,
                })}
            >
                {({ isActive }) => (
                    <>
                        <t.icon className="w-[17px] h-[17px]" style={{ color: isActive ? C.royal : C.faint }} />
                        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.02em' }}>{t.label}</span>
                    </>
                )}
            </NavLink>
        ))}
    </nav>
);

export default MobileFloatingNav;
