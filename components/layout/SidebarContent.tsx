/**
 * Contenido del sidebar del panel interno — Imprenta Córdova
 * ==========================================================
 *
 * Es el MISMO sidebar para escritorio (columna fija) y para celular (drawer):
 * `isMobile` cambia densidad, accesos rápidos y área táctil.
 *
 * Por qué vive acá y no dentro de `Layout`:
 * estaba declarado como función DENTRO del componente `Layout`, así que React
 * veía un tipo de componente nuevo en cada render del shell y desmontaba y
 * volvía a montar todo el menú — se perdían los grupos colapsados, el scroll
 * de la lista y se reiniciaba la animación de la píldora activa cada vez que
 * cambiaba un badge de órdenes. Como componente de módulo, el menú conserva su
 * estado y solo se repinta lo que cambió.
 *
 * Es presentacional: recibe lo que muestra y avisa hacia arriba con callbacks.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    CloseIcon, CordovaLogo, SparklesIcon, FileTextIcon, WalletIcon, LogoutIcon,
} from '../Icons';
import { C } from '../panelTheme';
import { NavGroup, RoleBadge } from './NavPieces';
import type { NavGroupModel } from './navModel';

interface SidebarContentProps {
    /** Nombre y rol del usuario en sesión (pie del sidebar). */
    user: { nombre: string; rol: string };
    /** Iniciales ya calculadas para el avatar. */
    userInitials: string;
    navGroups: NavGroupModel[];
    badges: Record<string, number>;
    /** Abre el modal de arqueo de caja (vive en el Layout). */
    onAbrirArqueo: () => void;
    onLogout: () => void;
    /** En celular cierra el drawer después de navegar. */
    onNavClick?: () => void;
    isMobile?: boolean;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
    user, userInitials, navGroups, badges, onAbrirArqueo, onLogout, onNavClick, isMobile,
}) => {
    const navigate = useNavigate();
    const [nuevaHover, setNuevaHover] = useState(false);
    const [logoutHover, setLogoutHover] = useState(false);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.ink, color: '#fff', position: 'relative' }}>
            {/* Header de Marca */}
            <div style={{
                padding: isMobile ? '16px 16px 14px' : '20px 18px 16px',
                borderBottom: '1px solid rgba(255,255,255,.09)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
            }}>
                <Link to="/" onClick={() => onNavClick?.()} style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', minWidth: 0 }}>
                    <CordovaLogo className="w-[34px] h-[34px] object-contain shrink-0" style={{ background: '#fff', borderRadius: 8, padding: 2 }} />
                    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: '-.03em', color: '#fff' }}>
                            CÓRDOVA<span style={{ color: C.gold }}>.</span>
                        </span>
                        <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.24em', textTransform: 'uppercase', color: '#8A99C7', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ width: 5, height: 5, borderRadius: 99, background: '#10B981', display: 'inline-block' }} />
                            {isMobile ? 'Gestión Interna · Zaruma' : 'Centro de Producción'}
                        </span>
                    </span>
                </Link>

                {/* Botón cerrar integrado y táctil para celulares */}
                {isMobile && (
                    <button
                        type="button"
                        onClick={() => onNavClick?.()}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: 'rgba(255,255,255,.08)',
                            border: '1px solid rgba(255,255,255,.14)',
                            color: '#E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            WebkitTapHighlightColor: 'transparent',
                        }}
                        aria-label="Cerrar menú de gestión"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Accesos rápidos táctiles */}
            <div style={{ padding: isMobile ? '12px 14px 10px' : '14px 14px 10px' }}>
                {isMobile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                        <button
                            type="button"
                            onClick={() => { navigate('/nuevo'); onNavClick?.(); }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 8px',
                                background: C.gold, color: C.ink, border: 'none', borderRadius: 11,
                                fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 14px -3px rgba(255,198,26,.65)',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <SparklesIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Nueva Orden</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { navigate('/nuevo?cat=sri&es_sri=true'); onNavClick?.(); }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '11px 8px',
                                background: 'rgba(255,198,26,.12)', color: C.gold, border: '1px solid rgba(255,198,26,.35)',
                                borderRadius: 11, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <FileTextIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>SRI Fiscal</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => { navigate('/nuevo'); onNavClick?.(); }}
                        onMouseEnter={() => setNuevaHover(true)}
                        onMouseLeave={() => setNuevaHover(false)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 12,
                            background: nuevaHover ? '#F0B400' : C.gold, color: C.ink, border: 'none', borderRadius: 11,
                            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        <SparklesIcon className="w-3.5 h-3.5" />
                        Nueva Orden
                    </button>
                )}
            </div>

            {/* Lista navegable de módulos internos */}
            <nav
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehavior: 'contain',
                    touchAction: 'pan-y',
                    padding: isMobile ? '4px 12px 16px' : '4px 10px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? 12 : 16
                }}
            >
                {navGroups.map(group => (
                    <NavGroup key={group.id} group={group} badges={badges} onNavClick={onNavClick} isMobile={isMobile} />
                ))}
            </nav>

            {/* Footer de Usuario & Turno Activo */}
            <div style={{
                padding: isMobile ? '12px 14px calc(14px + env(safe-area-inset-bottom, 12px))' : '12px 14px 16px',
                borderTop: '1px solid rgba(255,255,255,.09)',
                background: isMobile ? 'rgba(7,11,38,.98)' : 'transparent',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '6px 4px' }}>
                    <span style={{
                        width: 36, height: 36, borderRadius: 10, background: 'rgba(255,198,26,.14)', border: '1px solid rgba(255,198,26,.32)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: C.gold,
                    }}>{userInitials}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nombre}</span>
                        <RoleBadge rol={user.rol} />
                    </span>
                </div>

                {isMobile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                        <button
                            type="button"
                            onClick={() => {
                                onAbrirArqueo();
                                onNavClick?.();
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 8px',
                                borderRadius: 10, fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                background: 'rgba(255,255,255,.07)',
                                color: '#E0E7FF',
                                border: '1px solid rgba(255,255,255,.12)',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <WalletIcon className="w-3.5 h-3.5 shrink-0" style={{ color: C.gold }} />
                            <span>Arqueo</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onLogout();
                                onNavClick?.();
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 8px',
                                borderRadius: 10, fontSize: 11, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                background: 'rgba(231,1,1,.12)',
                                color: '#FF8080',
                                border: '1px solid rgba(231,1,1,.28)',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            <LogoutIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Salir</span>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onLogout}
                        onMouseEnter={() => setLogoutHover(true)}
                        onMouseLeave={() => setLogoutHover(false)}
                        style={{
                            width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 10,
                            borderRadius: 10, fontSize: 10, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase',
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .3s',
                            background: logoutHover ? 'rgba(231,1,1,.1)' : 'transparent',
                            color: logoutHover ? '#FF6B6B' : '#7E8CBE',
                            border: `1px solid ${logoutHover ? 'rgba(231,1,1,.25)' : 'transparent'}`,
                        }}
                    >
                        <LogoutIcon className="w-3.5 h-3.5" />
                        Cerrar Sesión
                    </button>
                )}
            </div>
        </div>
    );
};
