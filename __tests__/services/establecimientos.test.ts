/**
 * Tests de los establecimientos fiscales del RUC (CONTINUITY_RULES.md §6).
 *
 * Lo que se guarda acá se IMPRIME después en la solicitud de autorización del SRI, así que
 * el código tiene que quedar en 3 dígitos y el estado bien leído: un local cerrado ofrecido
 * como abierto termina en un documento rechazado en ventanilla, y el error se le atribuye al
 * cliente. Por eso el caso "INACTIVO" está cubierto explícitamente ('INACTIVO' contiene
 * 'ACTIV', que un `includes` ingenuo leía como abierto).
 */

import { describe, it, expect } from 'vitest';
import {
  ESTADO_ABIERTO,
  ESTADO_CERRADO,
  esEstablecimientoAbierto,
  establecimientoSugerido,
  establecimientosAbiertos,
  normalizarCodigoEstablecimiento,
  normalizarEstadoEstablecimiento,
  normalizarEstablecimientos,
} from '../../services/establecimientos';

describe('normalizarCodigoEstablecimiento', () => {
  it('completa a 3 dígitos, que es como va impreso', () => {
    expect(normalizarCodigoEstablecimiento('1')).toBe('001');
    expect(normalizarCodigoEstablecimiento('7')).toBe('007');
    expect(normalizarCodigoEstablecimiento('001')).toBe('001');
  });

  it('recorta cuando la fuente agrega dígitos de más', () => {
    expect(normalizarCodigoEstablecimiento('0001')).toBe('001');
    expect(normalizarCodigoEstablecimiento('Establecimiento 002')).toBe('002');
  });

  it('sin dígitos no hay código: la fila no se puede usar', () => {
    expect(normalizarCodigoEstablecimiento('MATRIZ')).toBe('');
    expect(normalizarCodigoEstablecimiento('')).toBe('');
    expect(normalizarCodigoEstablecimiento(null)).toBe('');
    expect(normalizarCodigoEstablecimiento(undefined)).toBe('');
  });
});

describe('normalizarEstadoEstablecimiento', () => {
  it('lee ABIERTO sin importar mayúsculas ni espacios', () => {
    expect(normalizarEstadoEstablecimiento('Abierto')).toBe(ESTADO_ABIERTO);
    expect(normalizarEstadoEstablecimiento('  abierto ')).toBe(ESTADO_ABIERTO);
  });

  it('lee CERRADO', () => {
    expect(normalizarEstadoEstablecimiento('CERRADO')).toBe(ESTADO_CERRADO);
    expect(normalizarEstadoEstablecimiento('cerrada')).toBe(ESTADO_CERRADO);
  });

  it('INACTIVO es CERRADO, no ABIERTO (contiene "ACTIV")', () => {
    expect(normalizarEstadoEstablecimiento('INACTIVO')).toBe(ESTADO_CERRADO);
    expect(normalizarEstadoEstablecimiento('SUSPENDIDO')).toBe(ESTADO_CERRADO);
  });

  it('un estado desconocido NO se asume abierto', () => {
    expect(normalizarEstadoEstablecimiento('')).toBe('');
    expect(normalizarEstadoEstablecimiento('NO REGISTRA')).toBe('NO REGISTRA');
    expect(esEstablecimientoAbierto({ codigo: '003', nombre: '', direccion: '', tipo: '', estado: '' })).toBe(false);
  });
});

describe('normalizarEstablecimientos', () => {
  it('deja la lista en la forma que declara el tipo Cliente', () => {
    const normalizados = normalizarEstablecimientos([
      { codigo: '2', nombre: 'Sucursal Centro', direccion: 'Bolívar y Sucre', tipo: 'SUCURSAL', estado: 'ABIERTO' },
      { codigo: '001', nombre: 'Matriz', direccion: 'Av. 25 de Junio', tipo: 'MATRIZ', estado: 'Abierto' },
    ]);

    expect(normalizados).toHaveLength(2);
    expect(normalizados[0]).toEqual({
      codigo: '001',
      nombre: 'Matriz',
      direccion: 'Av. 25 de Junio',
      tipo: 'MATRIZ',
      estado: ESTADO_ABIERTO,
    });
    expect(normalizados[1].codigo).toBe('002');
  });

  it('sin tipo usa la convención del SRI (001 matriz, el resto sucursal)', () => {
    const normalizados = normalizarEstablecimientos([
      { codigo: '001', estado: 'ABIERTO' },
      { codigo: '004', estado: 'ABIERTO' },
    ]);
    expect(normalizados[0].tipo).toBe('MATRIZ');
    expect(normalizados[1].tipo).toBe('SUCURSAL');
  });

  it('descarta filas sin código y códigos repetidos', () => {
    const normalizados = normalizarEstablecimientos([
      { codigo: '001', estado: 'ABIERTO' },
      { codigo: '1', estado: 'CERRADO' },
      { nombre: 'sin código', estado: 'ABIERTO' },
      null,
      'basura',
    ]);
    expect(normalizados).toHaveLength(1);
    expect(normalizados[0].codigo).toBe('001');
  });

  it('conserva los CERRADOS: que estén cerrados también es parte del dato', () => {
    const normalizados = normalizarEstablecimientos([
      { codigo: '001', estado: 'ABIERTO' },
      { codigo: '002', estado: 'CERRADO' },
    ]);
    expect(normalizados).toHaveLength(2);
    expect(establecimientosAbiertos(normalizados)).toHaveLength(1);
  });

  it('cualquier cosa que no sea un arreglo devuelve lista vacía', () => {
    expect(normalizarEstablecimientos(undefined)).toEqual([]);
    expect(normalizarEstablecimientos(null)).toEqual([]);
    expect(normalizarEstablecimientos('001|002')).toEqual([]);
    expect(normalizarEstablecimientos({ codigo: '001' })).toEqual([]);
  });
});

describe('establecimientosAbiertos', () => {
  it('sólo devuelve los ABIERTOS', () => {
    const lista = normalizarEstablecimientos([
      { codigo: '001', tipo: 'MATRIZ', estado: 'ABIERTO' },
      { codigo: '002', tipo: 'SUCURSAL', estado: 'CERRADO' },
      { codigo: '003', tipo: 'SUCURSAL', estado: 'ABIERTO' },
    ]);
    expect(establecimientosAbiertos(lista).map(e => e.codigo)).toEqual(['001', '003']);
  });

  it('con una ficha sin el campo no rompe', () => {
    expect(establecimientosAbiertos(undefined)).toEqual([]);
    expect(establecimientosAbiertos(null)).toEqual([]);
  });
});

describe('establecimientoSugerido', () => {
  it('prefiere la matriz', () => {
    const lista = normalizarEstablecimientos([
      { codigo: '002', estado: 'ABIERTO' },
      { codigo: '001', estado: 'ABIERTO' },
    ]);
    expect(establecimientoSugerido(lista)).toBe('001');
  });

  it('si la matriz está cerrada propone el primer local abierto', () => {
    const lista = normalizarEstablecimientos([
      { codigo: '001', estado: 'CERRADO' },
      { codigo: '004', estado: 'ABIERTO' },
    ]);
    expect(establecimientoSugerido(lista)).toBe('004');
  });

  it('sin ninguno abierto devuelve vacío para que quien llama decida el respaldo', () => {
    const lista = normalizarEstablecimientos([{ codigo: '001', estado: 'CERRADO' }]);
    expect(establecimientoSugerido(lista)).toBe('');
    expect(establecimientoSugerido([])).toBe('');
    expect(establecimientoSugerido(undefined)).toBe('');
  });
});
