// @vitest-environment jsdom
/**
 * Pruebas del cliente del backend SRI (Render).
 * =============================================
 *
 * Este es el único punto por donde la app habla con el servidor privilegiado
 * (padrón del SRI, correo, IA). Lo que importa acá no es el camino felizmente
 * exitoso, sino los bordes: qué ve el usuario cuando Render está dormido
 * (cold start), cuando responde 502 con HTML en vez de JSON, o cuando la
 * conexión se corta a mitad. En todos esos casos la app debe recibir un
 * `BackendError` con status y un mensaje en español, nunca un `undefined`
 * silencioso que termine en pantalla blanca.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { backendFetch, BackendError, backendConfigurado, BACKEND_BASE_URL, loginBackend } from '../../services/backendApi';
import { sesion } from '../../services/sesion';

/** Respuesta mínima con la forma que usa `backendFetch`. */
const respuesta = (status: number, cuerpo: unknown, { json = true } = {}) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: json ? async () => cuerpo : async () => { throw new SyntaxError('no es JSON'); },
  }) as unknown as Response;

/**
 * Ejecuta la llamada esperando que FALLE y devuelve el error ya tipado.
 * Si la llamada sale bien, la prueba revienta acá: es justo lo que se verifica.
 */
const errorDe = (p: Promise<unknown>): Promise<BackendError> =>
  p.then(
    () => { throw new Error('se esperaba un BackendError y la llamada salió bien'); },
    (e) => e as BackendError,
  );

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('backendFetch — camino exitoso', () => {
  it('hace POST a la URL base + path y devuelve el JSON parseado', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { insertados: 500 }));

    const r = await backendFetch<{ insertados: number }>('/api/v1/padron/importar', { registros: [] });

    expect(r).toEqual({ insertados: 500 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${BACKEND_BASE_URL}/api/v1/padron/importar`);
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ registros: [] });
  });

  it('la URL base no queda con barra final (si no, el path armaría una barra doble)', () => {
    expect(BACKEND_BASE_URL.endsWith('/')).toBe(false);
  });

  it('manda la señal de AbortController para que el timeout pueda cortar de verdad', async () => {
    fetchMock.mockResolvedValue(respuesta(200, {}));
    await backendFetch('/ping', {});
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});

describe('backendFetch — errores del servidor', () => {
  it('un 4xx lanza BackendError con el status y el mensaje que manda el backend', async () => {
    fetchMock.mockResolvedValue(respuesta(409, { error: 'Ese RUC ya tiene una solicitud abierta' }));

    const err = await errorDe(backendFetch('/api/v1/solicitudes', {}));

    expect(err).toBeInstanceOf(BackendError);
    expect(err.status).toBe(409);
    expect(err.message).toBe('Ese RUC ya tiene una solicitud abierta');
  });

  it('conserva el campo detalle para que la UI pueda mostrar la causa fina', async () => {
    fetchMock.mockResolvedValue(respuesta(422, { error: 'Registro inválido', detalle: 'fila 37: RUC de 12 dígitos' }));

    const err = await errorDe(backendFetch('/api/v1/padron/importar', {}));

    expect(err.detalle).toBe('fila 37: RUC de 12 dígitos');
  });

  it('si el cuerpo no es JSON (HTML de error de Render) arma un mensaje con el status', async () => {
    // Render devuelve una página HTML cuando el servicio está reiniciando:
    // res.json() revienta y el servicio tiene que sobrevivir a eso.
    fetchMock.mockResolvedValue(respuesta(502, null, { json: false }));

    const err = await errorDe(backendFetch('/api/v1/ai/generate', {}));

    expect(err).toBeInstanceOf(BackendError);
    expect(err.status).toBe(502);
    expect(err.message).toBe('Error 502 del servidor');
  });
});

describe('backendFetch — red y timeout', () => {
  it('un timeout (AbortError) se traduce a status 408 y mensaje de "tardó demasiado"', async () => {
    fetchMock.mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError'));

    const err = await errorDe(backendFetch('/api/v1/ai/generate', {}, { timeoutMs: 10 }));

    expect(err).toBeInstanceOf(BackendError);
    expect(err.status).toBe(408);
    expect(err.message).toMatch(/tardó demasiado/i);
  });

  it('una caída de red se traduce a status 0 y mensaje de "no se pudo conectar"', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const err = await errorDe(backendFetch('/ping', {}));

    expect(err).toBeInstanceOf(BackendError);
    expect(err.status).toBe(0);
    expect(err.message).toMatch(/no se pudo conectar/i);
  });

  it('el temporizador se limpia siempre: ni el éxito ni el error dejan handles colgando', async () => {
    const clear = vi.spyOn(globalThis, 'clearTimeout');

    fetchMock.mockResolvedValue(respuesta(200, {}));
    await backendFetch('/ping', {});
    expect(clear).toHaveBeenCalledTimes(1);

    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await errorDe(backendFetch('/ping', {}));
    expect(clear).toHaveBeenCalledTimes(2);
  });
});

describe('sesión del operador', () => {
  // Antes se mandaba una `x-api-key` pública incrustada en el bundle: no protegía nada.
  // Ahora cada operador manda su token firmado por el backend.
  const tokenVigente = () => {
    const cuerpo = btoa(JSON.stringify({ sub: 'u1', nombre: 'Pedro', rol: 'Admin', exp: Math.floor(Date.now() / 1000) + 3600 }));
    return `${cuerpo}.firma`;
  };

  afterEach(() => sesion.limpiar());

  it('sin sesión no manda Authorization ni x-api-key, y backendConfigurado() es false', async () => {
    fetchMock.mockResolvedValue(respuesta(200, {}));
    await backendFetch('/ping', {});

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
    expect(headers['x-api-key']).toBeUndefined();
    expect(backendConfigurado()).toBe(false);
  });

  it('con sesión manda Authorization: Bearer <token>', async () => {
    const token = tokenVigente();
    sesion.guardar(token);
    fetchMock.mockResolvedValue(respuesta(200, {}));
    await backendFetch('/ping', {});

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${token}`);
    expect(backendConfigurado()).toBe(true);
  });

  it('un 401 con sesión avisa "cordova:sesion-vencida"', async () => {
    sesion.guardar(tokenVigente());
    const escucha = vi.fn();
    window.addEventListener('cordova:sesion-vencida', escucha);
    fetchMock.mockResolvedValue(respuesta(401, { error: 'Tu sesión venció.' }));

    const e = await errorDe(backendFetch('/api/v1/trabajos/listar', {}));
    window.removeEventListener('cordova:sesion-vencida', escucha);

    expect(e.status).toBe(401);
    expect(escucha).toHaveBeenCalledTimes(1);
  });

  it('un 401 SIN sesión (login de respaldo) no dispara el cierre de sesión', async () => {
    const escucha = vi.fn();
    window.addEventListener('cordova:sesion-vencida', escucha);
    fetchMock.mockResolvedValue(respuesta(401, { error: 'Iniciá sesión.' }));

    await errorDe(backendFetch('/api/v1/trabajos/listar', {}));
    window.removeEventListener('cordova:sesion-vencida', escucha);

    expect(escucha).not.toHaveBeenCalled();
  });
});

describe('loginBackend', () => {
  it('devuelve token y usuario', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { token: 'a.b', user: { id: 'u1', nombre: 'Pedro', rol: 'Admin' } }));
    const r = await loginBackend('pedro', 'clave');
    expect(r.token).toBe('a.b');
    expect(r.user.nombre).toBe('Pedro');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ nombre: 'pedro', password: 'clave' });
  });

  it('servidor dormido (sin conexión) → mensaje de que está despertando', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const e = await errorDe(loginBackend('pedro', 'clave'));
    expect(e.status).toBe(0);
    expect(e.message).toBe('El servidor está despertando, reintentá en 30 s.');
  });

  it('Render arrancando (502/504) → también "despertando"', async () => {
    for (const st of [502, 504]) {
      fetchMock.mockResolvedValue(respuesta(st, {}));
      const e = await errorDe(loginBackend('pedro', 'clave'));
      expect(e.status).toBe(st);
      expect(e.message).toBe('El servidor está despertando, reintentá en 30 s.');
    }
  });

  it('clave incorrecta → el mensaje del servidor, status 401', async () => {
    fetchMock.mockResolvedValue(respuesta(401, { error: 'Usuario o contraseña incorrectos.' }));
    const e = await errorDe(loginBackend('pedro', 'mal'));
    expect(e.status).toBe(401);
    expect(e.message).toBe('Usuario o contraseña incorrectos.');
  });
});
