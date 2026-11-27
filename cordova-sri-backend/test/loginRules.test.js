const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluarLogin, LimitadorIntentos } = require('../loginRules');

const usuario = (extra = {}) => ({
    id: 'usr-1', nombre: 'Pedro', rol: 'Admin', estado: 'Activo', password: 'clave123', require_password: true, ...extra,
});

test('usuario activo con clave correcta entra', () => {
    const r = evaluarLogin(usuario(), 'clave123');
    assert.equal(r.ok, true);
    assert.deepEqual(r.user, { id: 'usr-1', nombre: 'Pedro', rol: 'Admin' });
});

test('clave incorrecta → CLAVE', () => {
    assert.deepEqual(evaluarLogin(usuario(), 'otra'), { ok: false, motivo: 'CLAVE' });
});

test('usuario inactivo → INACTIVO', () => {
    assert.deepEqual(evaluarLogin(usuario({ estado: 'Inactivo' }), 'clave123'), { ok: false, motivo: 'INACTIVO' });
});

test('usuario inexistente → NO_EXISTE', () => {
    assert.deepEqual(evaluarLogin(null, 'x'), { ok: false, motivo: 'NO_EXISTE' });
});

test('Admin sin contraseña configurada → ADMIN_SIN_CLAVE', () => {
    assert.deepEqual(evaluarLogin(usuario({ require_password: false, password: null }), ''), { ok: false, motivo: 'ADMIN_SIN_CLAVE' });
});

test('Operador sin contraseña configurada entra', () => {
    const r = evaluarLogin(usuario({ rol: 'Operador', require_password: false, password: null }), '');
    assert.equal(r.ok, true);
});

test('clave vacía nunca coincide con una clave vacía guardada si se exige contraseña', () => {
    assert.deepEqual(evaluarLogin(usuario({ password: '' }), ''), { ok: false, motivo: 'CLAVE' });
});

test('limitador: bloquea al 6.º intento fallido en 10 minutos y libera después', () => {
    const lim = new LimitadorIntentos(5, 10 * 60 * 1000);
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) {
        assert.equal(lim.bloqueado('ip|pedro', t0), false);
        lim.fallo('ip|pedro', t0);
    }
    assert.equal(lim.bloqueado('ip|pedro', t0 + 1000), true);
    assert.equal(lim.bloqueado('ip|pedro', t0 + 10 * 60 * 1000 + 1), false);
});

test('limitador: un login correcto reinicia el contador', () => {
    const lim = new LimitadorIntentos(5, 600000);
    for (let i = 0; i < 5; i++) lim.fallo('k', 0);
    lim.exito('k');
    assert.equal(lim.bloqueado('k', 1), false);
});
