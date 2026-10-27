import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CALIBRACION_CERO,
  PASO_MM,
  cargarCalibracion,
  describirCalibracion,
  esCalibracionCero,
  guardarCalibracion,
  moverCalibracion,
  transformCalibracion,
  type Calibracion,
} from '../../services/registroImpresion';

/**
 * Hook reutilizable para manejar la calibración de un modelo de impresión.
 * Mantiene la persistencia en localStorage y calcula el `transform` exacto en mm.
 */
export function useCalibracion(modelo: string) {
  const [calibracion, setCalibracion] = useState<Calibracion>(() => cargarCalibracion(modelo));

  useEffect(() => {
    setCalibracion(cargarCalibracion(modelo));
  }, [modelo]);

  const mover = useCallback((dxMm: number, dyMm: number) => {
    setCalibracion(prev => {
      const siguiente = moverCalibracion(prev, dxMm, dyMm);
      guardarCalibracion(modelo, siguiente);
      return siguiente;
    });
  }, [modelo]);

  const restablecer = useCallback(() => {
    setCalibracion(CALIBRACION_CERO);
    guardarCalibracion(modelo, CALIBRACION_CERO);
  }, [modelo]);

  return {
    calibracion,
    mover,
    restablecer,
    transform: transformCalibracion(calibracion),
    esCero: esCalibracionCero(calibracion),
    descripcion: describirCalibracion(calibracion),
  };
}

export interface CalibradorRegistroProps {
  modelo: string;
  nombreModelo?: string;
  calibracion: Calibracion;
  onMover: (dxMm: number, dyMm: number) => void;
  onRestablecer: () => void;
  maxWidth?: string;
  soloEnPreimpreso?: boolean;
}

const BTN_STYLE: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#FFFFFF',
  border: '1px solid #D7DDF0',
  color: '#0A1140',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: 'inherit',
  boxShadow: '0 1px 2px rgba(10,17,64,0.06)',
  transition: 'all 0.15s ease',
};

/**
 * Componente flotante/acoplado de Calibración de Registro.
 * Permite desplazar el contenido del documento en pasos de 0.5 mm (X e Y)
 * para compensar el arrastre mecánico de cualquier impresora física sobre
 * formularios preimpresos (1/2 oficio, 1/4 oficio, etc.).
 *
 * Clase `no-print` garantiza que NUNCA aparezca en papel ni en PDFs generados.
 */
export const CalibradorRegistro: React.FC<CalibradorRegistroProps> = ({
  modelo,
  nombreModelo,
  calibracion,
  onMover,
  onRestablecer,
  maxWidth = '160mm',
  soloEnPreimpreso = false,
}) => {
  const [colapsado, setColapsado] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const esCero = esCalibracionCero(calibracion);
  const descripcion = describirCalibracion(calibracion);

  // Soporte de navegación por teclado al tener foco en el panel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onMover(-PASO_MM, 0);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onMover(PASO_MM, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onMover(0, -PASO_MM);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onMover(0, PASO_MM);
    } else if (e.key === 'Home' || e.key === '0') {
      e.preventDefault();
      onRestablecer();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="no-print select-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      style={{
        width: '100%',
        maxWidth,
        margin: '0 auto 12px',
        padding: colapsado ? '8px 14px' : '10px 14px',
        background: esCero ? '#FFFFFF' : '#FFFBEB',
        border: `1px solid ${esCero ? '#E2E8F0' : '#FDE68A'}`,
        borderRadius: 12,
        boxShadow: '0 2px 8px -2px rgba(10,17,64,0.06)',
        transition: 'background 0.2s, border-color 0.2s',
      }}
      aria-label="Calibrador de registro de impresión"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        {/* Etiqueta y estado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: esCero ? '#94A3B8' : '#D97706',
              boxShadow: esCero ? 'none' : '0 0 0 2px rgba(217, 119, 6, 0.2)',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#64748B' }}>
                Registro Mecánico
              </span>
              {nombreModelo && (
                <span style={{ fontSize: 10.5, color: '#0F172A', fontWeight: 600 }}>
                  · {nombreModelo}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: esCero ? '#0F172A' : '#92400E', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
              {descripcion}
              {!esCero && <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 6, color: '#B45309' }}>[Desplazado]</span>}
            </div>
          </div>
        </div>

        {/* Controles interactivos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {!colapsado && (
            <>
              {/* Eje Horizontal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', padding: '2px 6px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginRight: 2 }}>X (mm)</span>
                <button
                  type="button"
                  onClick={() => onMover(-PASO_MM, 0)}
                  title={`Desplazar ${PASO_MM} mm hacia la izquierda`}
                  style={BTN_STYLE}
                  className="hover:bg-slate-100 active:scale-95"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => onMover(PASO_MM, 0)}
                  title={`Desplazar ${PASO_MM} mm hacia la derecha`}
                  style={BTN_STYLE}
                  className="hover:bg-slate-100 active:scale-95"
                >
                  →
                </button>
              </div>

              {/* Eje Vertical */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F8FAFC', padding: '2px 6px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginRight: 2 }}>Y (mm)</span>
                <button
                  type="button"
                  onClick={() => onMover(0, -PASO_MM)}
                  title={`Desplazar ${PASO_MM} mm hacia arriba`}
                  style={BTN_STYLE}
                  className="hover:bg-slate-100 active:scale-95"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => onMover(0, PASO_MM)}
                  title={`Desplazar ${PASO_MM} mm hacia abajo`}
                  style={BTN_STYLE}
                  className="hover:bg-slate-100 active:scale-95"
                >
                  ↓
                </button>
              </div>

              {/* Botón Restablecer */}
              <button
                type="button"
                onClick={onRestablecer}
                disabled={esCero}
                title="Restablecer calibración a 0 mm"
                style={{
                  padding: '5px 10px',
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  background: esCero ? '#F1F5F9' : '#FFFFFF',
                  border: `1px solid ${esCero ? '#E2E8F0' : '#CBD5E1'}`,
                  color: esCero ? '#94A3B8' : '#0F2B48',
                  cursor: esCero ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
                className={esCero ? '' : 'hover:bg-slate-50 active:scale-95'}
              >
                0 mm
              </button>
            </>
          )}

          {/* Toggle colapsar */}
          <button
            type="button"
            onClick={() => setColapsado(v => !v)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 10.5,
              fontWeight: 600,
              color: '#64748B',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            className="hover:text-slate-900"
          >
            {colapsado ? 'Ajustar ±' : 'Ocultar'}
          </button>
        </div>
      </div>
    </div>
  );
};
