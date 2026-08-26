import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { InventoryItem } from '../types';
import { supabase } from '../services/supabase';

interface InventarioContextType {
  inventario: InventoryItem[];
  loading: boolean;
  fetchInventario: () => Promise<void>;
  addItem: (item: any) => Promise<void>;
  updateItem: (id: string, item: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const InventarioContext = createContext<InventarioContextType | undefined>(undefined);

export const InventarioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventario, setInventario] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventario = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('inventario').select('*').order('item');
      if (error) throw error;
      if (data) setInventario(data);
    } catch (err) {
      console.error('[InventarioContext] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventario();
    const channel = supabase
      .channel('db-inventario')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        if (eventType === 'INSERT') {
          setInventario(prev => prev.some(i => i.id === newRecord.id) ? prev : [...prev, newRecord as InventoryItem]);
        } else if (eventType === 'UPDATE') {
          setInventario(prev => prev.map(i => i.id === newRecord.id ? newRecord as InventoryItem : i));
        } else if (eventType === 'DELETE') {
          setInventario(prev => prev.filter(i => i.id !== oldRecord.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchInventario]);

  const addItem = async (item: any) => {
    const { error } = await supabase.from('inventario').insert([item]);
    if (error) throw error;
    await fetchInventario();
  };

  const updateItem = async (id: string, item: any) => {
    const { error } = await supabase.from('inventario').update(item).eq('id', id);
    if (error) throw error;
    await fetchInventario();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('inventario').delete().eq('id', id);
    if (error) throw error;
    await fetchInventario();
  };

  return (
    <InventarioContext.Provider value={{ inventario, loading, fetchInventario, addItem, updateItem, deleteItem }}>
      {children}
    </InventarioContext.Provider>
  );
};

export const useInventario = () => {
  const ctx = useContext(InventarioContext);
  if (!ctx) throw new Error('useInventario debe usarse dentro de InventarioProvider');
  return ctx;
};
