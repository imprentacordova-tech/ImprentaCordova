import { describe, it, expect } from 'vitest';

describe('Regimen enum', () => {
  it('should have correct values', async () => {
    const { Regimen } = await import('../types');
    expect(Regimen.NEGOCIO_POPULAR).toBe('Rimpe Negocio Popular');
    expect(Regimen.EMPRENDEDOR).toBe('Rimpe Emprendedor');
    expect(Regimen.GENERAL).toBe('General');
  });
});

describe('TrabajoEstado enum', () => {
  it('should have correct workflow states', async () => {
    const { TrabajoEstado } = await import('../types');
    expect(TrabajoEstado.PENDIENTE).toBe('Pendiente');
    expect(TrabajoEstado.EN_DISENO).toBe('En Diseño');
    expect(TrabajoEstado.PROCESO).toBe('En Proceso');
    expect(TrabajoEstado.VITRINA).toBe('Vitrina');
    expect(TrabajoEstado.ENTREGADO).toBe('Entregado');
  });
});

describe('TrabajoTipo enum', () => {
  it('should have SRI and GENERAL types', async () => {
    const { TrabajoTipo } = await import('../types');
    expect(TrabajoTipo.SRI).toBe('sri');
    expect(TrabajoTipo.GENERAL).toBe('general');
  });
});
