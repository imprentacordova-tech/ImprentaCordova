/**
 * Reglas puras del login de operadores (sin red ni Express) — ver test/loginRules.test.js.
 */
const crypto = require('node:crypto');

const iguales = (a, b) => {
    const x = Buffer.from(String(a));
    const y = Buffer.from(String(b));
    return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/**
 * @param {{id,nombre,rol,estado,password,require_password}|null} u fila de `users`
 * @returns {{ok:true,user:{id,nombre,rol}} | {ok:false,motivo:'NO_EXISTE'|'INACTIVO'|'CLAVE'|'ADMIN_SIN_CLAVE'}}
 */
function evaluarLogin(u, passwordIngresada) {
    if (!u) return { ok: false, motivo: 'NO_EXISTE' };
    if (u.estado !== 'Activo') return { ok: false, motivo: 'INACTIVO' };
    const esAdmin = String(u.rol || '').toLowerCase() === 'admin' || String(u.rol || '').toLowerCase() === 'root';
    if (!u.require_password) {
        // Un Admin sin contraseña es la puerta abierta de hoy: no se le emite sesión.
        if (esAdmin) return { ok: false, motivo: 'ADMIN_SIN_CLAVE' };
    } else if (!u.password || !iguales(u.password, passwordIngresada || '')) {
        return { ok: false, motivo: 'CLAVE' };
    }
    return { ok: true, user: { id: u.id, nombre: u.nombre, rol: u.rol } };
}

/** Intentos fallidos por clave (ip|nombre) en una ventana deslizante. En memoria: se reinicia con el proceso. */
class LimitadorIntentos {
    constructor(maximo = 5, ventanaMs = 10 * 60 * 1000) {
        this.maximo = maximo;
        this.ventanaMs = ventanaMs;
        this.fallos = new Map();
    }
    _recientes(clave, ahora) {
        const lista = (this.fallos.get(clave) || []).filter(t => ahora - t <= this.ventanaMs);
        if (lista.length) this.fallos.set(clave, lista); else this.fallos.delete(clave);
        return lista;
    }
    bloqueado(clave, ahora = Date.now()) {
        return this._recientes(clave, ahora).length >= this.maximo;
    }
    fallo(clave, ahora = Date.now()) {
        this.fallos.set(clave, [...this._recientes(clave, ahora), ahora]);
    }
    exito(clave) {
        this.fallos.delete(clave);
    }
}

module.exports = { evaluarLogin, LimitadorIntentos };
