/**
 * Tests de la calibración de registro.
 *
 * Lo que se protege: que un valor corrupto o fuera de rango NUNCA deje el documento sin
 * abrir ni lo mande fuera de la hoja, y que el redondeo no acumule error al mover muchas veces.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CALIBRACION_CERO,
  LIMITE_MM,
  PASO_MM,
  borrarCalibracion,
  cargarCalibracion,
  claveCalibracion,
  describirCalibracion,
  esCalibracionCero,
  guardarCalibracion,
  limitarMm,
  moverCalibracion,
  redondearMm,
  transformCalibracion,
} from '../../services/registroImpresion';

beforeEach(() => {
  localStorage.clear();
});

describe('redondearMm', () => {
  it('redondea a una décima', () => {
    expect(redondearMm(1.24)).toBe(1.2);
    expect(redondearMm(1.25)).toBe(1.3);
  });

  it('no acumula error al sumar el paso muchas veces', () => {
    // Sin redondeo, 0.5 * 20 en coma flotante no da exactamente 10.
    let acumulado = 0;
    for (let i = 0; i < 20; i++) acumulado = redondearMm(acumulado + PASO_MM);
    expect(acumulado).toBe(10);
  });
});

describe('limitarMm', () => {
  it('recorta a los topes', () => {
    expect(limitarMm(999)).toBe(LIMITE_MM);
    expect(limitarMm(-999)).toBe(-LIMITE_MM);
  });

  it('un valor no numérico cae en 0 (no rompe el documento)', () => {
    expect(limitarMm(NaN)).toBe(0);
    // Infinity NO se recorta al tope: cae en 0. Recortarlo a 20 mm movería el contenido dos
    // centímetros fuera de la hoja — peor que dejarlo donde estaba. Ante un valor absurdo,
    // la respuesta segura es no mover nada.
    expect(limitarMm(Infinity)).toBe(0);
    expect(limitarMm(-Infinity)).toBe(0);
  });

  it('deja pasar los valores válidos', () => {
    expect(limitarMm(1.5)).toBe(1.5);
    expect(limitarMm(-2.3)).toBe(-2.3);
  });
});

describe('moverCalibracion', () => {
  it('desplaza en las dos direcciones', () => {
    expect(moverCalibracion(CALIBRACION_CERO, PASO_MM, 0)).toEqual({ xMm: 0.5, yMm: 0 });
    expect(moverCalibracion(CALIBRACION_CERO, -PASO_MM, 0)).toEqual({ xMm: -0.5, yMm: 0 });
    expect(moverCalibracion(CALIBRACION_CERO, 0, PASO_MM)).toEqual({ xMm: 0, yMm: 0.5 });
  });

  it('no se pasa de los topes aunque se insista', () => {
    let c = CALIBRACION_CERO;
    for (let i = 0; i < 200; i++) c = moverCalibracion(c, PASO_MM, PASO_MM);
    expect(c.xMm).toBe(LIMITE_MM);
    expect(c.yMm).toBe(LIMITE_MM);
  });
});

describe('esCalibracionCero / transformCalibracion', () => {
  it('en cero devuelve none, para no tocar el caso normal', () => {
    expect(esCalibracionCero(CALIBRACION_CERO)).toBe(true);
    expect(transformCalibracion(CALIBRACION_CERO)).toBe('none');
  });

  it('en mm reales, no en píxeles', () => {
    expect(transformCalibracion({ xMm: 1.5, yMm: -2 })).toBe('translate(1.5mm, -2mm)');
  });
});

describe('describirCalibracion', () => {
  it('muestra el signo explícito para saber hacia dónde se movió', () => {
    expect(describirCalibracion({ xMm: 1.5, yMm: -0.5 })).toBe('X +1.5 mm · Y -0.5 mm');
    expect(describirCalibracion(CALIBRACION_CERO)).toBe('X 0.0 mm · Y 0.0 mm');
  });
});

describe('persistencia por modelo', () => {
  it('cada modelo tiene su propia clave (el medio oficio y el recibo cargan distinto)', () => {
    expect(claveCalibracion('sri-sobre-preimpreso')).not.toBe(claveCalibracion('comercial-recibo'));
  });

  it('guarda y recupera', () => {
    guardarCalibracion('sri-sobre-preimpreso', { xMm: 1.5, yMm: -1 });
    expect(cargarCalibracion('sri-sobre-preimpreso')).toEqual({ xMm: 1.5, yMm: -1 });
  });

  it('un modelo sin calibrar arranca en cero', () => {
    expect(cargarCalibracion('comercial-recibo')).toEqual(CALIBRACION_CERO);
  });

  it('un JSON corrupto NO rompe: cae en cero', () => {
    localStorage.setItem(claveCalibracion('sri-pc'), '{esto no es json');
    expect(cargarCalibracion('sri-pc')).toEqual(CALIBRACION_CERO);
  });

  it('valores basura se sanean', () => {
    localStorage.setItem(claveCalibracion('sri-pc'), JSON.stringify({ xMm: 'abc', yMm: null }));
    expect(cargarCalibracion('sri-pc')).toEqual(CALIBRACION_CERO);
  });

  it('un valor fuera de rango se recorta al leerlo', () => {
    localStorage.setItem(claveCalibracion('sri-pc'), JSON.stringify({ xMm: 500, yMm: -500 }));
    expect(cargarCalibracion('sri-pc')).toEqual({ xMm: LIMITE_MM, yMm: -LIMITE_MM });
  });

  it('borrar deja el modelo en cero', () => {
    guardarCalibracion('sri-pc', { xMm: 2, yMm: 2 });
    borrarCalibracion('sri-pc');
    expect(cargarCalibracion('sri-pc')).toEqual(CALIBRACION_CERO);
  });
});
