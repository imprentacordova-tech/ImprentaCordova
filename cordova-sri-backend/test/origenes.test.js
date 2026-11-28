const test = require('node:test');
const assert = require('node:assert/strict');
const { origenesPermitidos, ORIGENES_BASE } = require('../origenes');

test('ALLOWED_ORIGINS SUMA orígenes, no reemplaza: el SRI sigue permitido', () => {
    const lista = origenesPermitidos('https://www.imprentacordova.net,https://otro.ejemplo.com');
    assert.ok(lista.includes('https://srienlinea.sri.gob.ec'), 'la extensión hace fetch con Origin del SRI');
    assert.ok(lista.includes('https://otro.ejemplo.com'));
});

test('sin variable usa la base, sin duplicados ni vacíos', () => {
    assert.deepEqual(origenesPermitidos(undefined), ORIGENES_BASE);
    const lista = origenesPermitidos(' https://imprentacordova.net , ,');
    assert.equal(lista.filter((o) => o === 'https://imprentacordova.net').length, 1);
    assert.ok(!lista.includes(''));
});
