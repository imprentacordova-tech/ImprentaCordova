const test = require('node:test');
const assert = require('node:assert/strict');
const { firmarSesion, verificarSesion } = require('../auth');

const SECRETO = 'secreto-de-prueba-con-largo-suficiente-123';
const PAYLOAD = { sub: 'usr-1', nombre: 'Pedro', rol: 'Admin' };

test('firma y verifica ida y vuelta', () => {
    const token = firmarSesion(PAYLOAD, SECRETO);
    const s = verificarSesion(token, SECRETO);
    assert.equal(s.sub, 'usr-1');
    assert.equal(s.nombre, 'Pedro');
    assert.equal(s.rol, 'Admin');
    assert.ok(s.exp > Date.now() / 1000);
});

test('rechaza firma alterada', () => {
    const token = firmarSesion(PAYLOAD, SECRETO);
    const [cuerpo, firma] = token.split('.');
    const otro = Buffer.from(JSON.stringify({ ...PAYLOAD, rol: 'Admin', sub: 'usr-2', exp: 9999999999 })).toString('base64url');
    assert.equal(verificarSesion(`${otro}.${firma}`, SECRETO), null);
    const ultima = firma.slice(-1) === 'A' ? 'B' : 'A';
    assert.equal(verificarSesion(`${cuerpo}.${firma.slice(0, -1)}${ultima}`, SECRETO), null);
});

test('rechaza token vencido', () => {
    const token = firmarSesion(PAYLOAD, SECRETO, 60);
    const { exp } = verificarSesion(token, SECRETO);
    assert.equal(verificarSesion(token, SECRETO, exp * 1000 + 1), null);
});

test('rechaza secreto distinto', () => {
    const token = firmarSesion(PAYLOAD, SECRETO);
    assert.equal(verificarSesion(token, 'otro-secreto-distinto-de-largo-suficiente'), null);
});

test('no lanza con basura o firma de otra longitud', () => {
    assert.equal(verificarSesion('', SECRETO), null);
    assert.equal(verificarSesion('abc', SECRETO), null);
    assert.equal(verificarSesion('abc.def', SECRETO), null);
    assert.equal(verificarSesion(undefined, SECRETO), null);
});
