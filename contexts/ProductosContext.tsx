import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Producto } from '../types';
import { supabase } from '../services/supabase';
import { MASTER_CATALOG } from '../services/catalogData';

interface ProductosContextType {
  productos: Producto[];
  loading: boolean;
  fetchProductos: () => Promise<void>;
  addProducto: (p: Partial<Producto>) => Promise<Producto>;
  updateProducto: (id: string, p: Partial<Producto>) => Promise<void>;
  deleteProducto: (id: string) => Promise<void>;
  seedCatalog: () => Promise<void>;
}

const ProductosContext = createContext<ProductosContextType | undefined>(undefined);

interface ProductoRow {
  id: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  categoria?: string;
  es_sri?: boolean;
  imagen_url?: string;
  specs?: string[];
  unit?: string;
  is_popular?: boolean;
  visible_publico?: boolean;
  requiere_diseno?: boolean;
  maneja_inventario?: boolean;
  es_activo?: boolean;
  codigo_interno?: string;
  tags?: string[];
  configuracion_habilitada?: Producto['configuracionHabilitada'];
}

type ProductoPayload = Omit<ProductoRow, 'id'>;

/**
 * La tabla `productos` tiene estas columnas (ver SCHEMA_COMPLETO.sql +
 * supabase/migrations/20261108_productos_gestion_avanzada.sql). Antes de esa
 * migración, `addProducto`/`updateProducto` mandaban el objeto `Producto`
 * camelCase tal cual a Supabase, que respondía "column not found" para
 * esSRI/imagenUrl/isPopular (es_sri/imagen_url/is_popular) y para los campos
 * de gestión avanzada (no tenían columna alguna), y el guardado fallaba en
 * silencio (el catch de Productos.tsx solo loguea).
 *
 * `configCalculadora`/`configuracionBase` (types.ts) no se mapean: eran de
 * `PriceCalculatorDisplay.tsx`, que ya no existe, y nada vivo los usa.
 */
export const mapProductoToDB = (p: Partial<Producto>): ProductoPayload => ({
  nombre: p.nombre,
  descripcion: p.descripcion,
  precio: p.precio,
  categoria: p.categoria,
  es_sri: p.esSRI,
  imagen_url: p.imagenUrl,
  specs: p.specs,
  unit: p.unit,
  is_popular: p.isPopular,
  visible_publico: p.visiblePublico,
  requiere_diseno: p.requiereDiseno,
  maneja_inventario: p.manejaInventario,
  es_activo: p.esActivo,
  codigo_interno: p.codigoInterno,
  tags: p.tags,
  configuracion_habilitada: p.configuracionHabilitada,
});

/**
 * Inserta/actualiza con reintento: si la migración de columnas nuevas
 * (20261108_productos_gestion_avanzada.sql) todavía no corrió en esta base,
 * Supabase devuelve "Could not find the 'X' column" — se quita esa clave del
 * payload y se reintenta, igual que hace `TrabajosContext` con `trabajos`.
 * Así el código puede desplegarse ANTES de correr la migración sin romper
 * el guardado (los campos nuevos quedan sin persistir hasta que se corra).
 */
const ejecutarConReintento = async <T,>(
  payload: ProductoPayload,
  ejecutar: (payload: ProductoPayload) => Promise<{ data: T | null; error: { message?: string } | null }>,
): Promise<{ data: T | null; error: { message?: string } | null }> => {
  const intentoPayload: ProductoPayload = { ...payload };
  for (let intento = 0; intento < 10; intento++) {
    const res = await ejecutar(intentoPayload);
    if (!res.error) return res;
    const msg = res.error.message || '';
    const match = msg.match(/Could not find the '([^']+)' column/i) || msg.match(/column "([^"]+)" of relation/i);
    if (match && match[1] && match[1] in intentoPayload) {
      console.warn(`[ProductosContext] Columna '${match[1]}' no existe en 'productos'. Se omite y se reintenta (¿falta correr la migración?).`);
      delete (intentoPayload as Record<string, unknown>)[match[1]];
      continue;
    }
    return res;
  }
  return ejecutar(intentoPayload);
};

export const ProductosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const mapProduct = (p: ProductoRow): Producto => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: p.precio,
    categoria: p.categoria,
    esSRI: p.es_sri ?? false,
    imagenUrl: p.imagen_url,
    specs: p.specs,
    unit: p.unit,
    isPopular: p.is_popular ?? false,
    visiblePublico: p.visible_publico ?? true,
    requiereDiseno: p.requiere_diseno ?? false,
    manejaInventario: p.maneja_inventario ?? false,
    esActivo: p.es_activo ?? true,
    codigoInterno: p.codigo_interno,
    tags: p.tags,
    configuracionHabilitada: p.configuracion_habilitada,
  });

  const fetchProductos = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('productos').select('*').order('nombre');
      if (error) throw error;
      if (data) {
        setProductos(data.map(mapProduct));
        if (data.length === 0) {
          seedCatalog();
        }
      }
    } catch (err) {
      console.error('[ProductosContext] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const addProducto = async (p: Partial<Producto>) => {
    const { data, error } = await ejecutarConReintento<ProductoRow>(
      mapProductoToDB(p),
      async (payload) => await supabase.from('productos').insert([payload]).select().single(),
    );
    if (error) throw error;
    const mapped = mapProduct(data as ProductoRow);
    setProductos(prev => [mapped, ...prev]);
    return mapped;
  };

  const updateProducto = async (id: string, p: Partial<Producto>) => {
    const { error } = await ejecutarConReintento(
      mapProductoToDB(p),
      async (payload) => await supabase.from('productos').update(payload).eq('id', id),
    );
    if (error) throw error;
    setProductos(prev => prev.map(prod => prod.id === id ? { ...prod, ...p } : prod));
  };

  const deleteProducto = async (id: string) => {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) throw error;
    setProductos(prev => prev.filter(p => p.id !== id));
  };

  const seedCatalog = async () => {
    try {
      // La tabla `productos` no tiene UNIQUE sobre `nombre`, así que un
      // `upsert(onConflict: 'nombre')` fallaba en silencio. Hacemos el
      // "upsert" a mano: insertamos los que faltan y actualizamos por `id`
      // los que ya existen. Así el catálogo maestro siempre aterriza.
      const { data: existentes, error: errExistentes } = await supabase
        .from('productos')
        .select('id, nombre');
      if (errExistentes) throw errExistentes;

      const idPorNombre = new Map<string, string>(
        (existentes || []).map((p) => [p.nombre, p.id]),
      );

      const aInsertar: ProductoPayload[] = [];
      const aActualizar: Array<{ id: string; cambios: ProductoPayload }> = [];

      for (const p of MASTER_CATALOG) {
        const payload = {
          nombre: p.nombre,
          descripcion: p.descripcion ?? null,
          precio: p.precio ?? 0,
          categoria: p.categoria,
          es_sri: p.esSRI ?? false,
          imagen_url: p.imagenUrl ?? null,
          specs: p.specs ?? [],
          unit: p.unit ?? null,
          is_popular: p.isPopular ?? false,
        };
        const id = idPorNombre.get(p.nombre as string);
        if (id) aActualizar.push({ id, cambios: payload });
        else aInsertar.push(payload);
      }

      if (aInsertar.length > 0) {
        const { error } = await supabase.from('productos').insert(aInsertar);
        if (error) throw error;
      }
      for (const { id, cambios } of aActualizar) {
        const { error } = await supabase.from('productos').update(cambios).eq('id', id);
        if (error) throw error;
      }

      setTimeout(() => fetchProductos(), 500);
    } catch (err) {
      console.error('[ProductosContext] Seed error:', err);
    }
  };

  return (
    <ProductosContext.Provider value={{ productos, loading, fetchProductos, addProducto, updateProducto, deleteProducto, seedCatalog }}>
      {children}
    </ProductosContext.Provider>
  );
};

export const useProductos = () => {
  const ctx = useContext(ProductosContext);
  if (!ctx) throw new Error('useProductos debe usarse dentro de ProductosProvider');
  return ctx;
};
