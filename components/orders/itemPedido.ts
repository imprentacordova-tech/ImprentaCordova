import type { Producto } from '../../types';

/**
 * Tipos compartidos del flujo de Nueva Orden (pages/NuevoPedido.tsx y components/orders/*).
 *
 * Los ítems nacen en cuatro lugares distintos (producto rápido del Paso 1, configurador
 * manual, renovación express y el payload que devuelve la extensión del SRI), y cada uno
 * guarda en `especificaciones` cosas un poco distintas: los perfiles de detalle
 * (services/detalleProducto.ts) guardan texto, pero el configurador agrega
 * `hojasPorTalonario` (número) y el flujo SRI un bloque `sri` con autorización/vencimiento.
 */

/** Bloque SRI que algunos flujos guardan dentro de las especificaciones. */
export interface EspecificacionSri {
    autorizacion?: string;
    vencimiento?: string;
    establecimiento?: string;
    puntoEmision?: string;
}

export type ValorEspecificacion = string | number | boolean | EspecificacionSri | null | undefined;

export interface EspecificacionesItem {
    tamano?: string;
    copias?: string;
    papel?: string;
    numerado?: string;
    sri?: boolean | EspecificacionSri | null;
    [clave: string]: ValorEspecificacion;
}

export interface ItemPedido {
    id?: string;
    nombre: string;
    categoria?: string;
    descripcion?: string;
    /** Bloques / talonarios / unidades, según el producto. */
    cantidad: number;
    /** Precio unitario antes de los recargos del perfil de detalle. */
    precioBase?: number;
    precioUnitario?: number;
    /** Total de la línea: es lo que suma el desglose (services/orderPricing.ts). */
    precioFinal?: number;
    subtotal?: number;
    esSRI?: boolean;
    especificaciones?: EspecificacionesItem;
}

/** Producto elegido en el catálogo (o uno manual tecleado en la búsqueda). */
export type ServicioElegido = Partial<Producto> & { nombre: string; precio: number };

/**
 * Los campos que edita el perfil de detalle son todos de texto; los extras (bloque `sri`,
 * `hojasPorTalonario`) no se editan en esas fichas, así que se leen como texto.
 */
export const camposTexto = (specs?: EspecificacionesItem): Record<string, string> =>
    (specs || {}) as Record<string, string>;

/** El bloque SRI sólo si es un objeto (algunos flujos guardan `sri: true`). */
export const bloqueSri = (specs?: EspecificacionesItem): EspecificacionSri | undefined =>
    specs?.sri && typeof specs.sri === 'object' ? specs.sri : undefined;
