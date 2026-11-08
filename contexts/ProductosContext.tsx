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
}

type ProductoPayload = Omit<ProductoRow, 'id'>;

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
    const { data, error } = await supabase.from('productos').insert([p]).select().single();
    if (error) throw error;
    const mapped = mapProduct(data);
    setProductos(prev => [mapped, ...prev]);
    return mapped;
  };

  const updateProducto = async (id: string, p: Partial<Producto>) => {
    const { error } = await supabase.from('productos').update(p).eq('id', id);
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
