import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'flat';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, variant = 'default', className = '', onClick }) => {
  const baseClasses = 'rounded-2xl transition-all duration-300';
  const variantClasses = {
    default: 'bg-obsidian-card border border-white/[0.06] hover:border-liquid-gold/15',
    highlight: 'bg-obsidian-card border border-liquid-gold/20 shadow-gold-glow-soft',
    flat: 'bg-white/[0.03] border border-white/[0.04]',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
