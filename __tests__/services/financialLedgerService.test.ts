/**
 * Pruebas del libro diario financiero.
 * ====================================
 *
 * Acá se registra plata que entra y sale de la imprenta, así que las reglas que
 * importan son tres:
 *
 *   1. La traducción entre el idioma de la base (`income` / `expense`) y el de
 *      la app (`INGRESO` / `EGRESO`) tiene que ser exacta en los dos sentidos.
 *      Un signo invertido acá es un arqueo de caja que no cuadra.
 *   2. Un fallo de red NO puede hacer desaparecer un movimiento: tiene que
 *      quedar encolado en `localStorage` para reintentarlo después.
 *   3. Una consulta que falla devuelve vacío/cero, nunca lanza: estas funciones
 *      alimentan pantallas (Finanzas, Cuentas) que no deben quedar en blanco.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/** Doble de Supabase: cadena encadenable con resultados configurables por prueba. */
const { supabaseFalso, estado } = vi.hoisted(() => {
  const estado = {
    lista: { data: [] as any[], error: null as any },   // resultado de .limit() (listados)
    ultimo: { data: null as any, error: null as any },  // resultado de .single()
    insercion: { error: null as any },
    rpc: { data: null as any, error: null as any },
    insertados: [] as any[],
    tablas: [] as string[],
  };

  const cadena: any = {
    select: () => cadena,
    order: () => cadena,
    limit: () => cadena,
    single: async () => estado.ultimo,
    insert: async (filas: any[]) => { estado.insertados.push(...filas); return estado.insercion; },
    // Thenable: `await ...limit(n)` resuelve el listado.
    then: (ok: any, mal: any) => Promise.resolve(estado.lista).then(ok, mal),
  };

  const supabaseFalso = {
    from: (tabla: string) => { estado.tablas.push(tabla); return cadena; },
    rpc: async () => estado.rpc,
  };

  return { supabaseFalso, estado };
});

vi.mock('../../services/supabase', () => ({ supabase: supabaseFalso }));

import {
  getFinancialLedger,
  logTransaction,
  getLedgerBalance,
} from '../../services/financialLedgerService';

const CLAVE_PENDIENTES = 'cordova_pending_ledger';

beforeEach(() => {
  estado.lista = { data: [], error: null };
  estado.ultimo = { data: null, error: null };
  estado.insercion = { error: null };
  estado.rpc = { data: null, error: null };
  estado.insertados = [];
  estado.tablas = [];
  localStorage.removeItem(CLAVE_PENDIENTES);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

describe('getFinancialLedger', () => {
  it('traduce income/expense al idioma de la app y normaliza los números', async () => {
    estado.lista = {
      data: [
        { id: '1', created_at: '2026-03-10T12:00:00.000Z', type: 'income', amount: '120.50', description: 'Abono orden 4821', user_name: 'Vero', reference_id: 't-1', hash: 'a1b2c3d4' },
        { id: '2', created_at: '2026-03-10T13:00:00.000Z', type: 'expense', amount: 45, description: 'Resma A4', user_name: 'Luis', reference_id: null, hash: 'ffff0000' },
      ],
      error: null,
    };

    const libro = await getFinancialLedger();

    expect(libro).toHaveLength(2);
    expect(libro[0]).toMatchObject({ tipo: 'INGRESO', monto: 120.5, detalle: 'Abono orden 4821', usuario: 'Vero', referenciaId: 't-1' });
    expect(libro[1]).toMatchObject({ tipo: 'EGRESO', monto: 45, usuario: 'Luis' });
    // `amount` llega como texto desde Postgres (numeric): tiene que salir number.
    expect(typeof libro[0].monto).toBe('number');
  });

  it('cualquier type distinto de income cuenta como EGRESO (no inventa un tercer estado)', async () => {
    estado.lista = { data: [{ id: '1', created_at: 'x', type: 'cualquiera', amount: 1, description: 'd' }], error: null };
    const [entrada] = await getFinancialLedger();
    expect(entrada.tipo).toBe('EGRESO');
  });

  it('rellena usuario y hash cuando la fila viene incompleta', async () => {
    estado.lista = { data: [{ id: '1', created_at: 'x', type: 'income', amount: 10, description: 'd', user_name: null, hash: null }], error: null };
    const [entrada] = await getFinancialLedger();
    expect(entrada.usuario).toBe('Sistema');
    expect(entrada.hash).toBe('00000000');
  });

  it('si la consulta falla devuelve lista vacía en vez de lanzar', async () => {
    estado.lista = { data: null, error: { message: 'JWT expired' } };
    await expect(getFinancialLedger()).resolves.toEqual([]);
  });

  it('lee siempre de la tabla financial_ledger', async () => {
    await getFinancialLedger();
    expect(estado.tablas).toContain('financial_ledger');
  });
});

describe('logTransaction', () => {
  it('guarda el movimiento con el vocabulario de la base y la fecha en YYYY-MM-DD', async () => {
    const ok = await logTransaction('EGRESO', 45.9, 'Resma A4', 'Luis', 'prov-3');

    expect(ok).toBe(true);
    expect(estado.insertados).toHaveLength(1);
    const fila = estado.insertados[0];
    expect(fila).toMatchObject({
      type: 'expense',
      amount: 45.9,
      description: 'Resma A4',
      user_name: 'Luis',
      reference_id: 'prov-3',
    });
    expect(fila.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(fila.hash).toMatch(/^[0-9a-f]{8,}$/);
  });

  it('un INGRESO se guarda como income', async () => {
    await logTransaction('INGRESO', 100, 'Abono', 'Vero');
    expect(estado.insertados[0].type).toBe('income');
  });

  it('encadena el hash: el mismo movimiento sobre otro hash previo da otro hash', async () => {
    // Es la única garantía de integridad del libro: si el hash no dependiera
    // del anterior, se podría borrar una fila del medio sin que se note.
    estado.ultimo = { data: { hash: 'aaaaaaaa' }, error: null };
    await logTransaction('INGRESO', 100, 'Abono', 'Vero');

    estado.ultimo = { data: { hash: 'bbbbbbbb' }, error: null };
    await logTransaction('INGRESO', 100, 'Abono', 'Vero');

    expect(estado.insertados[0].hash).not.toBe(estado.insertados[1].hash);
  });

  it('con el libro vacío arranca desde el hash cero', async () => {
    estado.ultimo = { data: null, error: null };
    await expect(logTransaction('INGRESO', 1, 'Primera', 'Vero')).resolves.toBe(true);
    expect(estado.insertados[0].hash).toBeTruthy();
  });

  it('si la inserción falla NO pierde el movimiento: lo encola en localStorage', async () => {
    estado.insercion = { error: { message: 'network error' } };

    const ok = await logTransaction('INGRESO', 250, 'Abono orden 5000', 'Vero', 't-9');

    expect(ok).toBe(false);
    const cola = JSON.parse(localStorage.getItem(CLAVE_PENDIENTES) || '[]');
    expect(cola).toHaveLength(1);
    expect(cola[0]).toMatchObject({ tipo: 'INGRESO', monto: 250, detalle: 'Abono orden 5000', usuario: 'Vero', referenciaId: 't-9', retries: 0 });
  });

  it('dos fallos seguidos dejan dos pendientes, no se sobreescriben', async () => {
    estado.insercion = { error: { message: 'network error' } };
    await logTransaction('INGRESO', 10, 'Uno', 'Vero');
    await logTransaction('EGRESO', 20, 'Dos', 'Luis');

    const cola = JSON.parse(localStorage.getItem(CLAVE_PENDIENTES) || '[]');
    expect(cola.map((e: any) => e.detalle)).toEqual(['Uno', 'Dos']);
  });
});

describe('getLedgerBalance', () => {
  it('normaliza a número lo que devuelve la función de Postgres', async () => {
    estado.rpc = { data: [{ ingresos: '1500.75', egresos: '300.25', total: '1200.50' }], error: null };

    await expect(getLedgerBalance()).resolves.toEqual({ ingresos: 1500.75, egresos: 300.25, total: 1200.5 });
  });

  it('si el RPC falla devuelve ceros (la pantalla de Finanzas no queda en blanco)', async () => {
    estado.rpc = { data: null, error: { message: 'function does not exist' } };
    await expect(getLedgerBalance()).resolves.toEqual({ ingresos: 0, egresos: 0, total: 0 });
  });

  it('si el RPC devuelve vacío también da ceros', async () => {
    estado.rpc = { data: [], error: null };
    await expect(getLedgerBalance()).resolves.toEqual({ ingresos: 0, egresos: 0, total: 0 });
  });
});
