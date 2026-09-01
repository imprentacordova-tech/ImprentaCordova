import React from 'react';
import { C } from '../panelTheme';

export type BadgeVariant = 'status' | 'role' | 'count' | 'gold' | 'blue' | 'red' | 'emerald' | 'purple' | 'gray';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  status: { background: C.softGray, color: C.body, border: `1px solid ${C.border}` },
  role: { background: C.chipBlue, color: C.royal, border: `1px solid ${C.borderStrong}` },
  count: { background: C.goldBg, color: C.goldTextStrong, border: `1px solid ${C.goldBorder}` },
  gold: { background: C.goldBg, color: C.goldTextStrong, border: `1px solid ${C.goldBorder}` },
  blue: { background: C.chipBlue, color: C.royal, border: `1px solid #D7DDF0` },
  red: { background: C.dangerBg, color: C.dangerText, border: `1px solid ${C.dangerBorder}` },
  emerald: { background: C.successBg, color: C.successStrong, border: `1px solid ${C.successBorder}` },
  purple: { background: C.violetBg, color: C.violet, border: `1px solid #DDD3FE` },
  gray: { background: C.softGray, color: C.muted, border: `1px solid ${C.border}` },
};

const statusMap: Record<string, React.CSSProperties> = {
  'Pendiente':  { background: C.goldBg, color: C.goldTextStrong, border: `1px solid ${C.goldBorder}` },
  'En Diseño':  { background: C.violetBg, color: C.violet, border: `1px solid #DDD3FE` },
  'En Prensa':  { background: C.chipBlue, color: C.royal, border: `1px solid #D7DDF0` },
  'En Proceso': { background: C.chipBlue, color: C.royal, border: `1px solid #D7DDF0` },
  'Listo':      { background: C.successBg, color: C.successStrong, border: `1px solid ${C.successBorder}` },
  'Vitrina':    { background: C.successBg, color: C.successStrong, border: `1px solid ${C.successBorder}` },
  'Entregado':  { background: C.softGray, color: C.muted, border: `1px solid ${C.border}` },
  'LISTA':      { background: C.successBg, color: C.successStrong, border: `1px solid ${C.successBorder}` },
  'ERROR':      { background: C.dangerBg, color: C.dangerText, border: `1px solid ${C.dangerBorder}` },
  'Admin':      { background: C.goldBg, color: C.goldTextStrong, border: `1px solid ${C.goldBorder}` },
  'root':       { background: C.dangerBg, color: C.dangerText, border: `1px solid ${C.dangerBorder}` },
  'Operador':   { background: C.chipBlue, color: C.royal, border: `1px solid #D7DDF0` },
  'Diseñador':  { background: C.violetBg, color: C.violet, border: `1px solid #DDD3FE` },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'status',
  children,
  pulse,
  className = '',
  style = {},
}) => {
  const label = typeof children === 'string' ? children.trim() : '';
  const resolvedStyle = statusMap[label] || variantStyles[variant];

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1.2,
        fontFamily: 'inherit',
        ...resolvedStyle,
        ...style,
      }}
    >
      {pulse && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 99,
            background: 'currentColor',
            animation: 'pi-blink 2s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </span>
  );
};
