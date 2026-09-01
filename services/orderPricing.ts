/**
 * Aritmética de una orden — módulo único compartido.
 *
 * El handoff de diseño (`README.md` §State Management) define la cadena:
 *   escala → unit → sub → recargo por urgencia → base → IVA condicional → total → abono → saldo
 * y exige explícitamente que esa lógica viva en UN solo módulo, no duplicada por
 * dispositivo (escritorio / celular de recepción / tablet).
 *
 * Reparto de responsabilidades con lo que ya existe en el codebase:
 * - El **precio de línea** lo calcula la calculadora existente (`CalculadoraPrecios` /
 *   `PriceCalculatorDisplay` sobre `Producto.precio` + `configCalculadora`). Ahí ya van
 *   los materiales, acabados y las escalas propias de cada producto. Este módulo NO
 *   la reimplementa: recibe el total de línea ya calculado.
 * - Lo que sí resuelve aquí, y en un solo lugar, es lo que es **de la orden**:
 *   recargo por urgencia, IVA condicional (los preimpresos SRI no gravan),
 *   y el reparto abono / saldo.
 * - `escalaVolumen()` queda expuesta para los flujos rápidos que cotizan directo desde
 *   `Producto.precio` sin pasar por la calculadora (express y celular de recepción).
 */

/** IVA vigente en Ecuador. */
export const IVA_RATE = 0.15;

/** Recargo del interruptor de urgencia (paso 2 de Nueva Orden). */
export const RECARGO_URGENCIA = 0.15;

/** Escalas por volumen del handoff: ≥200 → 8%, ≥500 → 15%. */
export const ESCALAS_VOLUMEN: { desde: number; escala: number }[] = [
    { desde: 500, escala: 0.85 },
    { desde: 200, escala: 0.92 },
];

/** Redondeo a centavos: evita que el saldo arrastre fracciones de centavo. */
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Factor de descuento por volumen. Solo para ítems cotizados directo desde
 * `Producto.precio`; los que vienen de la calculadora ya traen su propia escala.
 */
export const escalaVolumen = (cantidad: number): number =>
    ESCALAS_VOLUMEN.find(e => cantidad >= e.desde)?.escala ?? 1;

/** Porcentaje de descuento por volumen, para mostrarlo en el resumen. */
export const descuentoVolumen = (cantidad: number): number => round2((1 - escalaVolumen(cantidad)) * 100);

export interface LineaPedido {
    /** Total de la línea ya calculado (cantidad incluida). */
    precioLinea: number;
    /** `false` en preimpresos SRI: no gravan IVA. */
    grava?: boolean;
    /** Costo de diseño de la línea, si el producto lo requiere. */
    diseno?: number;
}

export interface DesglosePedido {
    /** Suma de las líneas antes de recargos e impuestos. */
    subtotal: number;
    /** Costo de diseño acumulado. */
    diseno: number;
    /** Recargo por urgencia (15% del subtotal + diseño). */
    recargo: number;
    /** Base imponible: subtotal + diseño + recargo. */
    base: number;
    /** IVA, solo sobre la porción que grava. */
    iva: number;
    /** Total a cobrar. */
    total: number;
    /** Abono efectivamente aplicado (nunca mayor al total ni negativo). */
    abono: number;
    /** Saldo pendiente. */
    saldo: number;
    /** `true` si al menos una línea grava IVA. */
    gravaIva: boolean;
    urgente: boolean;
}

export interface OpcionesPedido {
    urgente?: boolean;
    abono?: number;
}

/**
 * Cadena completa del handoff sobre un conjunto de líneas.
 * El recargo por urgencia se aplica a cada línea antes del IVA, de modo que
 * el IVA de una línea que grava también cubre su parte del recargo.
 */
export const calcularPedido = (lineas: LineaPedido[], opts: OpcionesPedido = {}): DesglosePedido => {
    const urgente = !!opts.urgente;
    const factor = urgente ? RECARGO_URGENCIA : 0;

    let subtotal = 0, diseno = 0, recargo = 0, base = 0, iva = 0;

    lineas.forEach(l => {
        const linea = Math.max(l.precioLinea || 0, 0);
        const dis = Math.max(l.diseno || 0, 0);
        const rec = (linea + dis) * factor;
        const baseLinea = linea + dis + rec;

        subtotal += linea;
        diseno += dis;
        recargo += rec;
        base += baseLinea;
        if (l.grava !== false) iva += baseLinea * IVA_RATE;
    });

    const total = round2(base + iva);
    const abono = round2(Math.min(Math.max(opts.abono || 0, 0), total));

    return {
        subtotal: round2(subtotal),
        diseno: round2(diseno),
        recargo: round2(recargo),
        base: round2(base),
        iva: round2(iva),
        total,
        abono,
        saldo: round2(total - abono),
        gravaIva: lineas.some(l => l.grava !== false),
        urgente,
    };
};

/** Atajo para una sola línea (celular de recepción, cotización rápida). */
export const calcularLinea = (
    precioUnitario: number,
    cantidad: number,
    opts: OpcionesPedido & { grava?: boolean; diseno?: number; aplicarEscala?: boolean } = {},
): DesglosePedido & { escala: number; unitario: number } => {
    const escala = opts.aplicarEscala === false ? 1 : escalaVolumen(cantidad);
    const unitario = round2(precioUnitario * escala);
    const desglose = calcularPedido(
        [{ precioLinea: unitario * cantidad, grava: opts.grava, diseno: opts.diseno }],
        opts,
    );
    return { ...desglose, escala, unitario };
};

/** Atajos de abono del handoff: sin abono / 50% / total / +$10. */
export const atajosAbono = (total: number, abonoActual = 0) => ({
    ninguno: 0,
    mitad: round2(total / 2),
    total: round2(total),
    masDiez: round2(Math.min(abonoActual + 10, total)),
});
