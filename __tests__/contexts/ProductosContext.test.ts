/**
 * `mapProductoToDB` — contrato entre el tipo `Producto` (camelCase) y la
 * tabla `productos` (snake_case, ver SCHEMA_COMPLETO.sql +
 * supabase/migrations/20261108_productos_gestion_avanzada.sql).
 *
 * Antes `addProducto`/`updateProducto` mandaban el objeto `Producto` tal cual
 * a Supabase: con columnas que coinciden por nombre (nombre, descripcion,
 * precio, categoria, unit) no pasaba nada, pero `esSRI`/`imagenUrl`/
 * `isPopular` no existen como tales en la base (son `es_sri`/`imagen_url`/
 * `is_popular`), y los campos de gestión avanzada del catálogo
 * (visiblePublico, requiereDiseno, codigoInterno, tags, etc.) no tenían
 * columna alguna. Supabase respondía "column not found" y el guardado
 * fallaba en silencio — el catch de `pages/Productos.tsx` solo loguea.
 */
import { describe, it, expect } from 'vitest';
import { mapProductoToDB } from '../../contexts/ProductosContext';

describe('mapProductoToDB', () => {
  it('traduce los campos camelCase a las columnas reales de la tabla', () => {
    const resultado = mapProductoToDB({
      nombre: 'Tarjetas de presentación',
      esSRI: true,
      imagenUrl: 'https://ejemplo.com/foto.jpg',
      isPopular: true,
    });

    expect(resultado.es_sri).toBe(true);
    expect(resultado.imagen_url).toBe('https://ejemplo.com/foto.jpg');
    expect(resultado.is_popular).toBe(true);
  });

  it('traduce los campos de gestión avanzada a sus columnas (migración 20261108)', () => {
    const resultado = mapProductoToDB({
      nombre: 'Volantes',
      visiblePublico: false,
      requiereDiseno: true,
      manejaInventario: true,
      codigoInterno: 'VOL-001',
      tags: ['promo'],
      esActivo: false,
      configuracionHabilitada: { dimensiones: true },
    });

    expect(resultado.visible_publico).toBe(false);
    expect(resultado.requiere_diseno).toBe(true);
    expect(resultado.maneja_inventario).toBe(true);
    expect(resultado.codigo_interno).toBe('VOL-001');
    expect(resultado.tags).toEqual(['promo']);
    expect(resultado.es_activo).toBe(false);
    expect(resultado.configuracion_habilitada).toEqual({ dimensiones: true });
  });

  it('no inventa columnas para los campos muertos de PriceCalculatorDisplay (borrado)', () => {
    const resultado = mapProductoToDB({
      nombre: 'Sellos',
      precio: 5,
      configCalculadora: { foo: 'bar' },
      configuracionBase: { baz: 'qux' },
    });

    expect(resultado).not.toHaveProperty('configCalculadora');
    expect(resultado).not.toHaveProperty('configuracionBase');
    expect(resultado).not.toHaveProperty('config_calculadora');
    expect(resultado).not.toHaveProperty('configuracion_base');
  });
});
