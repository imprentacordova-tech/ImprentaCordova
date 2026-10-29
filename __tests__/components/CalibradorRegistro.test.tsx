// @vitest-environment jsdom
// Este archivo usa `renderHook` y `localStorage`, así que necesita DOM. El default del
// proyecto es `node` (ver vitest.config.ts); el docblock de la línea 1 lo cambia sólo acá.
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCalibracion } from '../../components/print/CalibradorRegistro';
import { claveCalibracion, cargarCalibracion } from '../../services/registroImpresion';

describe('useCalibracion hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inicia en cero si no hay datos guardados', () => {
    const { result } = renderHook(() => useCalibracion('nota-sobre-preimpreso'));
    expect(result.current.esCero).toBe(true);
    expect(result.current.calibracion).toEqual({ xMm: 0, yMm: 0 });
    expect(result.current.transform).toBe('none');
  });

  it('permite desplazar en X e Y y persiste en localStorage', () => {
    const { result } = renderHook(() => useCalibracion('nota-sobre-preimpreso'));

    act(() => {
      result.current.mover(1.0, -0.5);
    });

    expect(result.current.esCero).toBe(false);
    expect(result.current.calibracion).toEqual({ xMm: 1.0, yMm: -0.5 });
    expect(result.current.transform).toBe('translate(1mm, -0.5mm)');

    // Verificar persistencia en localStorage
    const guardado = cargarCalibracion('nota-sobre-preimpreso');
    expect(guardado).toEqual({ xMm: 1.0, yMm: -0.5 });
  });

  it('restablece a cero y limpia persistencia', () => {
    const { result } = renderHook(() => useCalibracion('nota-sobre-preimpreso'));

    act(() => {
      result.current.mover(2.0, 3.0);
    });
    expect(result.current.esCero).toBe(false);

    act(() => {
      result.current.restablecer();
    });

    expect(result.current.esCero).toBe(true);
    expect(result.current.calibracion).toEqual({ xMm: 0, yMm: 0 });
    expect(result.current.transform).toBe('none');

    const guardado = cargarCalibracion('nota-sobre-preimpreso');
    expect(guardado).toEqual({ xMm: 0, yMm: 0 });
  });

  it('separa calibraciones de modelos distintos', () => {
    const hookNota = renderHook(() => useCalibracion('nota-sobre-preimpreso'));
    const hookRecibo = renderHook(() => useCalibracion('comercial-sobre-preimpreso'));

    act(() => {
      hookNota.result.current.mover(1.5, 0);
    });

    expect(hookNota.result.current.calibracion.xMm).toBe(1.5);
    expect(hookRecibo.result.current.calibracion.xMm).toBe(0);
  });
});
