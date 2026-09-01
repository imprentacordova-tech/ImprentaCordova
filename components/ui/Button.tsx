import React from 'react';
import { C } from '../panelTheme';

export type ButtonVariant = 'primary' | 'gold' | 'ghost' | 'danger' | 'ghost-danger' | 'outline' | 'soft' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: C.royal,
    color: '#FFFFFF',
    border: 'none',
    boxShadow: '0 2px 8px -2px rgba(22,48,155,0.3)',
  },
  gold: {
    background: C.gold,
    color: C.ink,
    border: 'none',
    fontWeight: 700,
  },
  outline: {
    background: '#FFFFFF',
    color: C.royal,
    border: `1px solid ${C.borderStrong}`,
  },
  soft: {
    background: C.softGray,
    color: C.royal,
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: C.muted,
    border: 'none',
  },
  success: {
    background: C.successBg,
    color: C.successStrong,
    border: `1px solid ${C.successBorder}`,
  },
  danger: {
    background: C.dangerBg,
    color: C.dangerText,
    border: `1px solid ${C.dangerBorder}`,
  },
  'ghost-danger': {
    background: 'transparent',
    color: C.dangerText,
    border: 'none',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 11, borderRadius: 8 },
  md: { padding: '10px 18px', fontSize: 13, borderRadius: 10 },
  lg: { padding: '14px 24px', fontSize: 14, borderRadius: 12 },
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  children,
  className = '',
  style = {},
  disabled,
  ...props
}) => {
  const [hover, setHover] = React.useState(false);

  const dynamicStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'inherit',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
    transform: hover && !disabled && !loading ? 'translateY(-1px)' : 'none',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...(hover && !disabled && !loading && variant === 'primary' ? { background: C.royalHover } : {}),
    ...(hover && !disabled && !loading && variant === 'gold' ? { background: C.goldHover } : {}),
    ...(hover && !disabled && !loading && variant === 'outline' ? { borderColor: C.royal, background: C.surfaceAlt } : {}),
    ...(hover && !disabled && !loading && variant === 'soft' ? { background: C.chipBlue } : {}),
    ...style,
  };

  return (
    <button
      style={dynamicStyle}
      className={className}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      {loading ? (
        <span style={{
          width: 14,
          height: 14,
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: 99,
          animation: 'spin 0.8s linear infinite',
          display: 'inline-block',
        }} />
      ) : icon ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
