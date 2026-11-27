/**
 * Middlewares de sesión: reemplazan a requireApiKey/authenticateApiKey, cuya "clave"
 * viajaba en el bundle público y por lo tanto no protegía nada.
 */
const { verificarSesion } = require('./auth');

/** @param {() => string|undefined} getSecreto se lee en cada request (permite rotar sin reiniciar tests). */
const crearRequireSession = (getSecreto) => (req, res, next) => {
    const secreto = getSecreto();
    if (!secreto || secreto.length < 32) {
        return res.status(503).json({ error: 'El inicio de sesión no está configurado en el servidor.' });
    }
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (!token && req.headers['x-api-key']) {
        return res.status(426).json({ error: 'Actualizá la extensión de Córdova (v3) e iniciá sesión en el panel.' });
    }
    if (!token) return res.status(401).json({ error: 'Iniciá sesión para continuar.' });
    const sesion = verificarSesion(token, secreto);
    if (!sesion) return res.status(401).json({ error: 'Tu sesión venció. Volvé a iniciar sesión.' });
    req.operador = { sub: sesion.sub, nombre: sesion.nombre, rol: sesion.rol };
    return next();
};

const requireAdmin = (req, res, next) => {
    const rol = String(req.operador?.rol || '').toLowerCase();
    if (rol === 'admin' || rol === 'root') return next();
    return res.status(403).json({ error: 'Solo un administrador puede hacer esto.' });
};

module.exports = { crearRequireSession, requireAdmin };
