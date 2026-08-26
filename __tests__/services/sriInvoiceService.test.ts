import { describe, it, expect } from 'vitest';
import { calcularModulo11, generarClaveAccesoSRI } from '../../services/sriInvoiceService';

describe('calcularModulo11', () => {
  it('should return a single digit 0-10', () => {
    const cadena = '07038192840010100010000000112345678901234567';
    const result = calcularModulo11(cadena);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('should be deterministic for the same input', () => {
    const cadena = '07038192840010100010000000112345678901234567';
    const a = calcularModulo11(cadena);
    const b = calcularModulo11(cadena);
    expect(a).toBe(b);
  });

  it('should produce different results for different inputs', () => {
    const a = calcularModulo11('07038192840010100010000000112345678901234567');
    const b = calcularModulo11('07038192840010100010000000112345678901234568');
    expect(a).not.toBe(b);
  });
});

describe('generarClaveAccesoSRI', () => {
  it('should return a 49-digit string', () => {
    const clave = generarClaveAccesoSRI({
      fechaEmision: new Date(2025, 7, 26),
      rucEmisor: '0703819284001',
      ambiente: '1',
      establecimiento: '001',
      puntoEmision: '001',
      secuencial: '000000001',
    });
    expect(clave).toHaveLength(49);
    expect(clave).toMatch(/^\d+$/);
  });

  it('should use default values when not provided', () => {
    const clave = generarClaveAccesoSRI({
      fechaEmision: new Date(2025, 7, 26),
    });
    expect(clave).toHaveLength(49);
    expect(clave).toContain('0703819284001');
  });

  it('should be deterministic for the same input', () => {
    const opts = {
      fechaEmision: new Date(2025, 7, 26),
      rucEmisor: '0703819284001',
      ambiente: '1' as const,
      establecimiento: '001',
      puntoEmision: '001',
      secuencial: '000000001',
    };
    const a = generarClaveAccesoSRI(opts);
    const b = generarClaveAccesoSRI(opts);
    expect(a).toBe(b);
  });

  it('should change with different secuencial', () => {
    const base = {
      fechaEmision: new Date(2025, 7, 26),
      rucEmisor: '0703819284001',
      ambiente: '1' as const,
      establecimiento: '001',
      puntoEmision: '001',
    };
    const clave1 = generarClaveAccesoSRI({ ...base, secuencial: '000000001' });
    const clave2 = generarClaveAccesoSRI({ ...base, secuencial: '000000002' });
    expect(clave1).not.toBe(clave2);
  });
});
