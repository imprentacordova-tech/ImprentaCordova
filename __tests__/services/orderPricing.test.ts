import { describe, it, expect } from 'vitest';
import {
    IVA_RATE, RECARGO_URGENCIA, escalaVolumen, descuentoVolumen,
    calcularPedido, calcularLinea, atajosAbono, round2,
} from '../../services/orderPricing';

describe('escalas por volumen (handoff §State Management)', () => {
    it('no descuenta bajo 200 unidades', () => {
        expect(escalaVolumen(1)).toBe(1);
        expect(escalaVolumen(199)).toBe(1);
        expect(descuentoVolumen(199)).toBe(0);
    });

    it('descuenta 8% desde 200 y 15% desde 500', () => {
        expect(escalaVolumen(200)).toBe(0.92);
        expect(escalaVolumen(499)).toBe(0.92);
        expect(escalaVolumen(500)).toBe(0.85);
        expect(escalaVolumen(1000)).toBe(0.85);
        expect(descuentoVolumen(200)).toBe(8);
        expect(descuentoVolumen(500)).toBe(15);
    });
});

describe('IVA condicional', () => {
    it('no grava los preimpresos SRI', () => {
        const d = calcularPedido([{ precioLinea: 100, grava: false }]);
        expect(d.iva).toBe(0);
        expect(d.total).toBe(100);
        expect(d.gravaIva).toBe(false);
    });

    it('grava el trabajo comercial al 15%', () => {
        const d = calcularPedido([{ precioLinea: 100 }]);
        expect(d.iva).toBe(round2(100 * IVA_RATE));
        expect(d.total).toBe(115);
        expect(d.gravaIva).toBe(true);
    });

    it('mezcla líneas que gravan y que no gravan en la misma orden', () => {
        const d = calcularPedido([
            { precioLinea: 100, grava: false }, // notas de venta SRI
            { precioLinea: 100 },               // tarjetas comerciales
        ]);
        expect(d.subtotal).toBe(200);
        expect(d.iva).toBe(15);
        expect(d.total).toBe(215);
    });
});

describe('recargo por urgencia', () => {
    it('suma 15% sobre subtotal y diseño, y el IVA lo alcanza', () => {
        const d = calcularPedido([{ precioLinea: 100, diseno: 8 }], { urgente: true });
        expect(d.recargo).toBe(round2(108 * RECARGO_URGENCIA));
        expect(d.base).toBe(round2(108 * (1 + RECARGO_URGENCIA)));
        expect(d.iva).toBe(round2(d.base * IVA_RATE));
        expect(d.urgente).toBe(true);
    });

    it('no recarga nada cuando la orden no es urgente', () => {
        const d = calcularPedido([{ precioLinea: 100 }], { urgente: false });
        expect(d.recargo).toBe(0);
    });
});

describe('abono y saldo', () => {
    it('nunca acepta un abono mayor al total', () => {
        const d = calcularPedido([{ precioLinea: 100, grava: false }], { abono: 500 });
        expect(d.abono).toBe(100);
        expect(d.saldo).toBe(0);
    });

    it('ignora abonos negativos', () => {
        const d = calcularPedido([{ precioLinea: 100, grava: false }], { abono: -20 });
        expect(d.abono).toBe(0);
        expect(d.saldo).toBe(100);
    });

    it('el saldo cierra exactamente contra el total', () => {
        const d = calcularPedido([{ precioLinea: 48.37 }], { abono: 20 });
        expect(round2(d.abono + d.saldo)).toBe(d.total);
    });
});

describe('calcularLinea (flujos rápidos, sin calculadora)', () => {
    it('aplica la escala al unitario antes de multiplicar', () => {
        const d = calcularLinea(0.48, 500, { grava: false });
        expect(d.escala).toBe(0.85);
        expect(d.unitario).toBe(0.41);
        expect(d.subtotal).toBe(round2(0.41 * 500));
        expect(d.iva).toBe(0);
    });

    it('permite desactivar la escala para ítems ya cotizados', () => {
        const d = calcularLinea(0.48, 500, { grava: false, aplicarEscala: false });
        expect(d.escala).toBe(1);
        expect(d.unitario).toBe(0.48);
    });
});

describe('atajos de abono', () => {
    it('ofrece sin abono / 50% / total / +$10 sin pasarse del total', () => {
        const a = atajosAbono(100, 95);
        expect(a.ninguno).toBe(0);
        expect(a.mitad).toBe(50);
        expect(a.total).toBe(100);
        expect(a.masDiez).toBe(100);
    });
});
