/**
 * Tests de las reglas de régimen tributario (SRI Ecuador).
 *
 * Estas reglas son de cumplimiento legal: si `validarDocumento` deja pasar una Nota de
 * Venta para un cliente de Régimen General, el sistema habilita que la imprenta emita un
 * documento no autorizado. Por eso están cubiertas explícitamente, incluyendo el plural
 * ('NOTAS DE VENTA'), que un `includes` ingenuo no detectaba.
 */

import { describe, it, expect } from 'vitest';
import { Regimen } from '../../types';
import {
  LIMITE_CONTINGENCIA,
  esDocumentoFactura,
  esDocumentoNotaDeVenta,
  normalizarRegimen,
  puedeEmitirNotaDeVenta,
  validarDocumento,
} from '../../services/regimenRules';

describe('puedeEmitirNotaDeVenta', () => {
  it('solo RIMPE Negocio Popular puede emitir Notas de Venta', () => {
    expect(puedeEmitirNotaDeVenta(Regimen.NEGOCIO_POPULAR)).toBe(true);
  });

  it('Régimen General y RIMPE Emprendedor NO pueden', () => {
    expect(puedeEmitirNotaDeVenta(Regimen.GENERAL)).toBe(false);
    expect(puedeEmitirNotaDeVenta(Regimen.EMPRENDEDOR)).toBe(false);
  });

  it('sin régimen definido NO se asume que pueda (falla seguro)', () => {
    expect(puedeEmitirNotaDeVenta(undefined)).toBe(false);
    expect(puedeEmitirNotaDeVenta(null)).toBe(false);
    expect(puedeEmitirNotaDeVenta('')).toBe(false);
  });
});

describe('esDocumentoNotaDeVenta', () => {
  it('detecta el singular tal como viene del catálogo', () => {
    expect(esDocumentoNotaDeVenta('NOTA DE VENTA (RIMPE NEGOCIO POPULAR)')).toBe(true);
    expect(esDocumentoNotaDeVenta('Nota de Venta')).toBe(true);
  });

  it('detecta el PLURAL (el caso que un includes ingenuo dejaba pasar)', () => {
    expect(esDocumentoNotaDeVenta('NOTAS DE VENTA')).toBe(true);
    expect(esDocumentoNotaDeVenta('Notas de venta')).toBe(true);
  });

  it('tolera espacios irregulares', () => {
    expect(esDocumentoNotaDeVenta('NOTA   DE    VENTA')).toBe(true);
  });

  it('no confunde otros documentos del catálogo SRI', () => {
    expect(esDocumentoNotaDeVenta('FACTURA (RIMPE NEGOCIO POPULAR)')).toBe(false);
    expect(esDocumentoNotaDeVenta('NOTAS DE CREDITO (RIMPE)')).toBe(false);
    expect(esDocumentoNotaDeVenta('GUIAS DE REMISION (RIMPE)')).toBe(false);
    expect(esDocumentoNotaDeVenta(undefined)).toBe(false);
  });
});

describe('esDocumentoFactura', () => {
  it('detecta factura en singular y plural sin confundir otros documentos', () => {
    expect(esDocumentoFactura('FACTURA (RIMPE NEGOCIO POPULAR)')).toBe(true);
    expect(esDocumentoFactura('FACTURAS SRI')).toBe(true);
    expect(esDocumentoFactura('NOTAS DE CREDITO')).toBe(false);
  });
});

describe('normalizarRegimen', () => {
  it('normaliza los valores que llegan de la BD y del PDF del SRI', () => {
    expect(normalizarRegimen('RIMPE Negocio Popular')).toBe(Regimen.NEGOCIO_POPULAR);
    expect(normalizarRegimen('CONTRIBUYENTE RÉGIMEN RIMPE-NEGOCIO POPULAR')).toBe(Regimen.NEGOCIO_POPULAR);
    expect(normalizarRegimen('Rimpe Emprendedor')).toBe(Regimen.EMPRENDEDOR);
    expect(normalizarRegimen('Régimen General')).toBe(Regimen.GENERAL);
  });

  it('cae en General cuando no hay dato (los requisitos son más estrictos)', () => {
    expect(normalizarRegimen('')).toBe(Regimen.GENERAL);
    expect(normalizarRegimen(undefined)).toBe(Regimen.GENERAL);
  });
});

describe('validarDocumento', () => {
  it('bloquea una Nota de Venta para Régimen General', () => {
    const r = validarDocumento({
      regimen: Regimen.GENERAL,
      tipo: 'NOTA DE VENTA (RIMPE NEGOCIO POPULAR)',
      esSRI: true,
      cantidad: 100,
    });
    expect(r.permitido).toBe(false);
    expect(r.motivo).toMatch(/no está autorizado a imprimir Notas de Venta/i);
  });

  it('bloquea una Nota de Venta en plural para RIMPE Emprendedor', () => {
    const r = validarDocumento({
      regimen: Regimen.EMPRENDEDOR,
      tipo: 'NOTAS DE VENTA',
      esSRI: true,
      cantidad: 50,
    });
    expect(r.permitido).toBe(false);
  });

  it('permite la Nota de Venta en RIMPE Negocio Popular y sin advertencias', () => {
    const r = validarDocumento({
      regimen: Regimen.NEGOCIO_POPULAR,
      tipo: 'NOTA DE VENTA',
      esSRI: true,
      cantidad: 500,
    });
    expect(r.permitido).toBe(true);
    expect(r.motivo).toBeUndefined();
    expect(r.advertencia).toBeUndefined();
  });

  it('avisa (sin bloquear) cuando se supera el tope de contingencia', () => {
    const r = validarDocumento({
      regimen: Regimen.GENERAL,
      tipo: 'FACTURA (RIMPE NEGOCIO POPULAR)',
      esSRI: true,
      cantidad: LIMITE_CONTINGENCIA + 1,
    });
    expect(r.permitido).toBe(true);
    expect(r.advertencia).toMatch(/tope de 25 hojas/i);
  });

  it('no avisa cuando la cantidad está dentro del tope de contingencia', () => {
    const r = validarDocumento({
      regimen: Regimen.GENERAL,
      tipo: 'FACTURA',
      esSRI: true,
      cantidad: LIMITE_CONTINGENCIA,
    });
    expect(r.permitido).toBe(true);
    expect(r.advertencia).toBeUndefined();
  });

  it('no aplica el tope a trabajos comerciales (no SRI)', () => {
    const r = validarDocumento({
      regimen: Regimen.GENERAL,
      tipo: 'Tarjetas de presentación',
      esSRI: false,
      cantidad: 1000,
    });
    expect(r.permitido).toBe(true);
    expect(r.advertencia).toBeUndefined();
  });

  it('bloquear tiene prioridad sobre advertir', () => {
    const r = validarDocumento({
      regimen: Regimen.GENERAL,
      tipo: 'NOTAS DE VENTA',
      esSRI: true,
      cantidad: 999,
    });
    expect(r.permitido).toBe(false);
    expect(r.advertencia).toBeUndefined();
  });
});
