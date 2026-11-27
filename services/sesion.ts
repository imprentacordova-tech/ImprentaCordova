/**
 * Sesión del operador emitida por el backend (`POST /api/v1/auth/login`).
 *
 * El token lo firma el servidor; acá solo se guarda y se lee su `exp` para no mandar
 * uno vencido. La firma la valida el backend en cada llamada. Vive en localStorage
 * (dura 12 h, sobrevive a recargar la pestaña) bajo `cordova_token`.
 */

const CLAVE_TOKEN = 'cordova_token';
const CLAVE_BORRADOR = 'cordova_borrador_nueva_orden';

const leerExp = (token: string): number | null => {
    try {
        const [cuerpo] = token.split('.');
        if (!cuerpo) return null;
        const json = JSON.parse(atob(cuerpo.replace(/-/g, '+').replace(/_/g, '/')));
        return typeof json?.exp === 'number' ? json.exp : null;
    } catch {
        return null;
    }
};

export const sesion = {
    guardar(token: string): void {
        localStorage.setItem(CLAVE_TOKEN, token);
    },
    /** Token vigente o null (si venció, se borra). */
    token(): string | null {
        const t = localStorage.getItem(CLAVE_TOKEN);
        if (!t) return null;
        if (sesion.vencida(t)) {
            localStorage.removeItem(CLAVE_TOKEN);
            return null;
        }
        return t;
    },
    limpiar(): void {
        localStorage.removeItem(CLAVE_TOKEN);
    },
    /** Lee `exp` sin verificar la firma (eso lo hace el servidor). Basura = vencido. */
    vencida(token: string, ahora = Date.now()): boolean {
        const exp = token ? leerExp(token) : null;
        return exp === null || exp * 1000 <= ahora;
    },
};

/** Borrador de Nueva Orden: se guarda si la sesión vence a mitad del pedido. Se consume una sola vez. */
export const guardarBorrador = (datos: unknown): void => {
    try { sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(datos)); } catch { /* cuota llena: se pierde el borrador */ }
};

export const leerBorrador = <T = unknown>(): T | null => {
    const raw = sessionStorage.getItem(CLAVE_BORRADOR);
    if (!raw) return null;
    sessionStorage.removeItem(CLAVE_BORRADOR);
    try { return JSON.parse(raw) as T; } catch { return null; }
};

/**
 * ¿Se permite el login de respaldo (nombres fijos, Supabase anon)? Solo cuando el
 * servidor NO pudo decidir (dormido, caído, sin SESSION_SECRET) y el respaldo está
 * habilitado (`VITE_LOGIN_LEGACY` distinto de 'false'). Si el servidor rechazó las
 * credenciales (401/403/429), nunca: si no, el respaldo saltearía la contraseña.
 */
export const debeUsarRespaldo = (status: number, respaldoHabilitado: boolean): boolean =>
    respaldoHabilitado && ![401, 403, 429].includes(status);

export const respaldoHabilitado = (): boolean => import.meta.env.VITE_LOGIN_LEGACY !== 'false';

/** Ruta a la que volver tras el login: solo rutas internas (evita redirecciones a otros sitios). */
export const rutaDeVuelta = (volver: string | null | undefined): string => {
    if (!volver || !volver.startsWith('/') || volver.startsWith('//') || volver.startsWith('/\\') || volver.startsWith('/login')) {
        return '/dashboard';
    }
    return volver;
};
