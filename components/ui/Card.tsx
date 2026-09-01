import React from 'react';
import { C } from '../panelTheme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'flat' | 'accent';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  style = {},
  onClick,
}) => {
  const [hover, setHover] = React.useState(false);

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      boxShadow: '0 4px 14px -6px rgba(10, 17, 64, 0.05)',
    },
    highlight: {
      background: C.surface,
      border: `1px solid ${C.royal}`,
      boxShadow: '0 8px 24px -8px rgba(22, 48, 155, 0.12)',
    },
    flat: {
      background: C.surfaceAlt,
      border: `1px solid ${C.border}`,
    },
    accent: {
      background: C.ink,
      color: '#FFFFFF',
      border: 'none',
      boxShadow: '0 8px 24px -8px rgba(10, 17, 64, 0.3)',
    },
  };

  const dynamicStyle: React.CSSProperties = {
    borderRadius: 16,
    padding: '18px 20px',
    transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
    cursor: onClick ? 'pointer' : 'default',
    transform: hover && onClick ? 'translateY(-2px)' : 'none',
    ...variantStyles[variant],
    ...style,
  };

  return (
    <div
      style={dynamicStyle}
      className={className}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </div>
  );
};
