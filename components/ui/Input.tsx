import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, className = '', ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-obsidian-card border rounded-xl px-4 py-3 text-sm text-slate-200
            placeholder:text-slate-600 outline-none transition-all duration-200
            focus:border-liquid-gold/40 focus:ring-1 focus:ring-liquid-gold/20
            ${error ? 'border-brand-red/40' : 'border-white/[0.06]'}
            ${icon ? 'pl-10' : ''} ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] font-bold text-brand-red">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[10px] text-slate-600">{hint}</p>
      )}
    </div>
  )
);

Input.displayName = 'Input';
