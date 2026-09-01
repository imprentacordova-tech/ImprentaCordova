import React from 'react';
import { C, MONO } from '../panelTheme';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
  isMono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, isMono, className = '', style = {}, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {label && (
          <label style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: error ? C.dangerText : C.faint,
          }}>
            {label}
          </label>
        )}
        <div style={{ position: 'relative', width: '100%' }}>
          {icon && (
            <span style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: focused ? C.royal : C.faint,
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              transition: 'color 0.2s',
            }}>
              {icon}
            </span>
          )}
          <input
            ref={ref}
            style={{
              width: '100%',
              padding: `11px 14px 11px ${icon ? '42px' : '14px'}`,
              background: focused ? '#FFFFFF' : C.bg,
              border: `1px solid ${error ? C.danger : focused ? C.royal : C.borderStrong}`,
              borderRadius: 10,
              fontSize: 13.5,
              color: C.ink,
              outline: 'none',
              fontFamily: isMono ? MONO : 'inherit',
              transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
              boxShadow: focused ? '0 0 0 3px rgba(22,48,155,0.08)' : 'none',
              ...style,
            }}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={className}
            {...props}
          />
        </div>
        {error && (
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: C.dangerText }}>
            {error}
          </p>
        )}
        {hint && !error && (
          <p style={{ margin: 0, fontSize: 11, color: C.faint }}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
