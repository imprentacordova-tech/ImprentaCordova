const test = require('node:test');
const assert = require('node:assert/strict');
const { crearRequireSession, requireAdmin } = require('../sessionMiddleware');
const { firmarSesion } = require('../auth');

const SECRETO = 's'.repeat(40);

const resFalsa = () => {
    const r = { statusCode: 200, body: null };
    r.status = (c) => { r.statusCode = c; return r; };
    r.json = (b) => { r.body = b; return r; };
    return r;
};
const correr = (mw, headers) => {
    const req = { headers };
    const res = resFalsa();
    let siguio = false;
    mw(req, res, () => { siguio = true; });
    return { req, res, siguio };
};

test('token válido → next() y req.operador', () => {
    const token = firmarSesion({ sub: 'u1', nombre: 'Pedro', rol: 'Admin' }, SECRETO);
    const { req, siguio } = correr(crearRequireSession(() => SECRETO), { authorization: `Bearer ${token}` });
    assert.equal(siguio, true);
    assert.equal(req.operador.nombre, 'Pedro');
});

test('token vencido → 401', () => {
    const token = firmarSesion({ sub: 'u1', nombre: 'Pedro', rol: 'Admin' }, SECRETO, -10);
    const { res, siguio } = correr(crearRequireSession(() => SECRETO), { authorization: `Bearer ${token}` });
    assert.equal(siguio, false);
    assert.equal(res.statusCode, 401);
});

test('solo x-api-key (extensión vieja) → 426 pidiendo actualizar', () => {
    const { res, siguio } = correr(crearRequireSession(() => SECRETO), { 'x-api-key': 'lo-que-sea' });
    assert.equal(siguio, false);
    assert.equal(res.statusCode, 426);
    assert.match(res.body.error, /Actualizá la extensión/);
});

test('sin credenciales → 401', () => {
    const { res } = correr(crearRequireSession(() => SECRETO), {});
    assert.equal(res.statusCode, 401);
});

test('sin SESSION_SECRET configurado → 503', () => {
    const { res } = correr(crearRequireSession(() => undefined), { authorization: 'Bearer x.y' });
    assert.equal(res.statusCode, 503);
});

test('requireAdmin deja pasar Admin y frena Operador', () => {
    const admin = { operador: { rol: 'Admin' } };
    const oper = { operador: { rol: 'Operador' } };
    let ok = false;
    requireAdmin(admin, resFalsa(), () => { ok = true; });
    assert.equal(ok, true);
    const res = resFalsa();
    ok = false;
    requireAdmin(oper, res, () => { ok = true; });
    assert.equal(ok, false);
    assert.equal(res.statusCode, 403);
});

test('extensión v2 (sin Bearer, desde el SRI y sin X-Cordova-Ext) → 426', () => {
    const { res } = correr(crearRequireSession(() => SECRETO), { origin: 'https://srienlinea.sri.gob.ec' });
    assert.equal(res.statusCode, 426);
});

test('extensión v3 sin sesión (manda X-Cordova-Ext) → 401 pidiendo iniciar sesión', () => {
    const { res } = correr(crearRequireSession(() => SECRETO), { origin: 'https://srienlinea.sri.gob.ec', 'x-cordova-ext': '3' });
    assert.equal(res.statusCode, 401);
});
