import { describe, it, expect } from 'vitest';
import { mensajeDeError } from '../utils';
import { bloqueSri, camposTexto } from '../components/orders/itemPedido';

describe('mensajeDeError', () => {
  it('lee el mensaje de un Error', () => {
    expect(mensajeDeError(new Error('falló'))).toBe('falló');
  });

  it('lee el mensaje de un error plano de Supabase (no es instancia de Error)', () => {
    expect(mensajeDeError({ message: 'duplicate key', code: '23505' })).toBe('duplicate key');
  });

  it('acepta un string tal cual', () => {
    expect(mensajeDeError('sin red')).toBe('sin red');
  });

  it('devuelve vacío cuando no hay mensaje legible', () => {
    expect(mensajeDeError(null)).toBe('');
    expect(mensajeDeError(undefined)).toBe('');
    expect(mensajeDeError({ message: 42 })).toBe('');
    expect(mensajeDeError(7)).toBe('');
  });
});

describe('itemPedido helpers', () => {
  it('bloqueSri sólo devuelve el bloque cuando es un objeto', () => {
    expect(bloqueSri({ sri: { vencimiento: '2027-01-01' } })).toEqual({ vencimiento: '2027-01-01' });
    expect(bloqueSri({ sri: true })).toBeUndefined();
    expect(bloqueSri({ sri: null })).toBeUndefined();
    expect(bloqueSri(undefined)).toBeUndefined();
  });

  it('camposTexto devuelve un objeto aunque no haya especificaciones', () => {
    expect(camposTexto(undefined)).toEqual({});
    expect(camposTexto({ copias: 'duplicado' }).copias).toBe('duplicado');
  });
});
