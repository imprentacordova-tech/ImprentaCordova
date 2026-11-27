/**
 * Sesiones firmadas de operadores (reemplazan a la "API key" pública del bundle).
 *
 * Formato: base64url(JSON del payload + exp) "." base64url(HMAC-SHA256).
 * Sin dependencias: solo node:crypto. El secreto vive en SESSION_SECRET (Render).
 */
const crypto = require('node:crypto');

const firmar = (cuerpo, secreto) => crypto.createHmac('sha256', secreto).update(cuerpo).digest('base64url');

/** @returns {string} token válido por `ttlSeg` segundos (12 h por defecto). */
function firmarSesion(payload, secreto, ttlSeg = 12 * 60 * 60) {
    const exp = Math.floor(Date.now() / 1000) + ttlSeg;
    const cuerpo = Buffer.from(JSON.stringify({ sub: payload.sub, nombre: payload.nombre, rol: payload.rol, exp })).toString('base64url');
    return `${cuerpo}.${firmar(cuerpo, secreto)}`;
}

/** @returns {{sub:string,nombre:string,rol:string,exp:number}|null} */
function verificarSesion(token, secreto, ahora = Date.now()) {
    if (typeof token !== 'string' || !secreto) return null;
    const partes = token.split('.');
    if (partes.length !== 2 || !partes[0] || !partes[1]) return null;
    const [cuerpo, firma] = partes;
    const esperada = Buffer.from(firmar(cuerpo, secreto));
    const recibida = Buffer.from(firma);
    if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) return null;
    let datos;
    try {
        datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
    } catch {
        return null;
    }
    if (!datos || typeof datos.exp !== 'number' || datos.exp * 1000 < ahora) return null;
    return datos;
}

module.exports = { firmarSesion, verificarSesion };
