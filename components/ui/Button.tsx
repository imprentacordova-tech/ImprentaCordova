import React from 'react';

type ButtonVariant = 'primary' | 'gold' | 'ghost' | 'danger' | 'ghost-danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue text-white hover:bg-brand-blue-dark shadow-blue-glow-sm hover:shadow-blue-glow',
  gold: 'bg-gradient-to-r from-liquid-gold via-gold-bright to-liquid-gold text-obsidian hover:scale-[1.02] shadow-gold-glow-soft hover:shadow-gold-glow',
  ghost: 'bg-white/5 text-slate-300 border border-white/10 hover:border-liquid-gold/30 hover:bg-liquid-gold/5 hover:text-white',
  danger: 'bg-brand-red/10 text-brand-red border border-brand-red/20 hover:bg-brand-red/20',
  'ghost-danger': 'bg-transparent text-slate-400 hover:text-brand-red hover:bg-brand-red/5',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[10px]',
  md: 'px-5 py-2.5 text-[11px]',
  lg: 'px-8 py-4 text-[12px]',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  children,
  className = '',
  disabled,
  ...props
}) => (
  <button
    className={`
      inline-flex items-center justify-center gap-2 rounded-xl font-black uppercase tracking-[0.15em]
      transition-all duration-300 active:scale-[0.97]
      disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
      ${variantClasses[variant]} ${sizeClasses[size]} ${className}
    `}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
    ) : icon ? (
      <span className="shrink-0">{icon}</span>
    ) : null}
    {children}
  </button>
);
