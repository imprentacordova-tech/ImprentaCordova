import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useData } from '../../contexts/DataContext';
import { C, DISPLAY, MONO, S } from '../panelTheme';
import { formatCurrency } from '../../utils';
import { DollarIcon, CheckCircleIcon } from '../Icons';

interface ModalArqueoCajaProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

export const ModalArqueoCaja: React.FC<ModalArqueoCajaProps> = ({
  isOpen,
  onClose,
  userName,
}) => {
  const { trabajos } = useData();
  const [efectivoContado, setEfectivoContado] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [guardado, setGuardado] = useState(false);

  // Calcular cobros del día / turno actual
  const hoyStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const resumenTurno = useMemo(() => {
    const ordenesHoy = (trabajos || []).filter(t => (t.fechaEntrada || '').startsWith(hoyStr));
    const totalAbonado = ordenesHoy.reduce((acc, t) => acc + (t.abono || 0), 0);
    const totalFacturado = ordenesHoy.reduce((acc, t) => acc + (t.precio || 0), 0);
    const totalSaldo = ordenesHoy.reduce((acc, t) => acc + (t.saldo || 0), 0);

    return {
      cantidadOrdenes: ordenesHoy.length,
      totalAbonado,
      totalFacturado,
      totalSaldo,
    };
  }, [trabajos, hoyStr]);

  const valorContado = parseFloat(efectivoContado) || 0;
  const diferencia = valorContado - resumenTurno.totalAbonado;

  const handleCerrarCaja = () => {
    setGuardado(true);
    setTimeout(() => {
      setGuardado(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Arqueo y Cuadre de Caja de Turno"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Cabecera de Turno */}
        <div style={{
          padding: '12px 16px',
          background: C.surfaceAlt,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.faint, letterSpacing: '.1em', textTransform: 'uppercase' }}>
              Operador de Turno
            </span>
            <div style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: C.ink }}>
              {userName}
            </div>
          </div>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: C.successBg,
            border: `1px solid ${C.successBorder}`,
            color: C.successStrong,
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 700,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: C.successDot }} />
            Turno Activo Hoy
          </span>
        </div>

        {/* Métricas del Turno */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ padding: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12 }}>
            <span style={S.colHead}>Abonos Recibidos</span>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.royal, marginTop: 4 }}>
              {formatCurrency(resumenTurno.totalAbonado)}
            </div>
            <span style={{ fontSize: 11, color: C.faint }}>{resumenTurno.cantidadOrdenes} órdenes hoy</span>
          </div>

          <div style={{ padding: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12 }}>
            <span style={S.colHead}>Total Facturado</span>
            <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.ink, marginTop: 4 }}>
              {formatCurrency(resumenTurno.totalFacturado)}
            </div>
            <span style={{ fontSize: 11, color: C.faint }}>Saldo por cobrar: {formatCurrency(resumenTurno.totalSaldo)}</span>
          </div>
        </div>

        {/* Input de Efectivo Físico */}
        <div>
          <label style={S.fieldLabel}>Efectivo Físico en Gaveta ($)</label>
          <div style={{ position: 'relative' }}>
            <DollarIcon className="w-4 h-4" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.royal }} />
            <input
              type="number"
              step="0.01"
              value={efectivoContado}
              onChange={(e) => setEfectivoContado(e.target.value)}
              placeholder="0.00"
              style={{
                ...S.input,
                paddingLeft: 38,
                fontFamily: MONO,
                fontSize: 16,
                fontWeight: 700,
                color: C.ink,
              }}
            />
          </div>
        </div>

        {/* Cálculo de Diferencia */}
        {efectivoContado !== '' && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: Math.abs(diferencia) < 0.01 ? C.successBg : diferencia > 0 ? C.goldBg : C.dangerBg,
            border: `1px solid ${Math.abs(diferencia) < 0.01 ? C.successBorder : diferencia > 0 ? C.goldBorder : C.dangerBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: Math.abs(diferencia) < 0.01 ? C.successStrong : diferencia > 0 ? C.goldTextStrong : C.dangerText }}>
              {Math.abs(diferencia) < 0.01
                ? '✓ Caja Cuadrada Perfecta'
                : diferencia > 0
                ? `Sobrante en caja (+${formatCurrency(diferencia)})`
                : `Faltante en caja (${formatCurrency(diferencia)})`}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700 }}>
              {formatCurrency(diferencia)}
            </span>
          </div>
        )}

        {/* Observaciones */}
        <div>
          <label style={S.fieldLabel}>Observaciones de Cierre</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            placeholder="Ej. Billetes de $20 retirados para depósito, monedas contadas..."
            style={{ ...S.input, resize: 'none' }}
          />
        </div>

        {/* Botón de Confirmación */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={S.softBtn}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCerrarCaja}
            disabled={guardado}
            style={{
              ...S.primaryBtn,
              background: guardado ? C.success : C.royal,
            }}
          >
            {guardado ? (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                Caja Registrada
              </>
            ) : (
              'Confirmar Cierre de Turno'
            )}
          </button>
        </div>

      </div>
    </Modal>
  );
};
