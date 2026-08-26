import React from 'react';

type BadgeVariant = 'status' | 'role' | 'count' | 'gold' | 'blue' | 'red' | 'emerald' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  status: 'bg-white/5 border-white/10 text-slate-400',
  role: 'border-white/10',
  count: 'bg-liquid-gold/10 border-liquid-gold/20 text-liquid-gold',
  gold: 'bg-liquid-gold/10 border-liquid-gold/20 text-liquid-gold',
  blue: 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue',
  red: 'bg-brand-red/10 border-brand-red/20 text-brand-red',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
};

const statusColors: Record<string, string> = {
  'Pendiente':           'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'En Diseño':           'bg-purple-500/10 border-purple-500/20 text-purple-400',
  'En Proceso':          'bg-brand-blue/10 border-brand-blue/20 text-brand-blue',
  'Vitrina':             'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'Entregado':           'bg-slate-500/10 border-slate-500/20 text-slate-400',
  'LISTA':               'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  'PENDIENTE':           'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'ERROR':               'bg-brand-red/10 border-brand-red/20 text-brand-red',
  'Admin':               'bg-amber-500/10 border-amber-500/20 text-amber-400',
  'root':                'bg-brand-red/10 border-brand-red/20 text-brand-red',
  'Operador':            'bg-brand-blue/10 border-brand-blue/20 text-brand-blue',
  'Diseñador':           'bg-purple-500/10 border-purple-500/20 text-purple-400',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'status', children, pulse, className = '' }) => {
  const label = typeof children === 'string' ? children : '';
  const dynamicColor = statusColors[label] || '';
  const baseColor = dynamicColor || variantClasses[variant];

  return (
    <span className={`
      inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider
      px-2 py-0.5 rounded-full border ${baseColor} ${className}
    `}>
      {pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {children}
    </span>
  );
};
