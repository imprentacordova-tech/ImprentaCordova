import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon } from '../Icons';
import { C, DISPLAY } from '../panelTheme';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeWidths: Record<string, number> = {
  sm: 400,
  md: 540,
  lg: 720,
  xl: 960,
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: C.scrim,
              backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: sizeWidths[size],
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              boxShadow: '0 24px 60px -12px rgba(10, 17, 64, 0.28)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
            }}
          >
            {title && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: `1px solid ${C.border}`,
                background: C.surfaceAlt,
              }}>
                <h3 style={{
                  margin: 0,
                  fontFamily: DISPLAY,
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.ink,
                  letterSpacing: '-0.02em',
                }}>
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: C.muted,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.softGray;
                    e.currentTarget.style.color = C.ink;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = C.muted;
                  }}
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
