import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SriCredential, Proveedor, TareaProveedor, User } from '../types';
import { supabase } from '../services/supabase';

interface ConfigContextType {
  config: any;
  loading: boolean;
  fetchConfig: () => Promise<void>;
  updateConfig: (data: any) => Promise<void>;
  sriCredentials: SriCredential[];
  upsertSriCredential: (cred: SriCredential) => Promise<void>;
  deleteSriCredential: (ruc: string) => Promise<void>;
  proveedores: Proveedor[];
  addProveedor: (p: Partial<Proveedor>) => Promise<void>;
  updateProveedor: (id: string, p: Partial<Proveedor>) => Promise<void>;
  deleteProveedor: (id: string) => Promise<void>;
  tareas: TareaProveedor[];
  createTarea: (t: Partial<TareaProveedor>) => Promise<void>;
  updateTarea: (id: string, t: Partial<TareaProveedor>) => Promise<void>;
  deleteTarea: (id: string) => Promise<void>;
  users: User[];
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sriCredentials, setSriCredentials] = useState<SriCredential[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [tareas, setTareas] = useState<TareaProveedor[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const fetchConfig = useCallback(async () => {
    try {
      const [configRes, sriRes, provRes, tareasRes, usersRes] = await Promise.all([
        supabase.from('app_config').select('data').eq('id', 1).maybeSingle(),
        supabase.from('sri_credentials').select('*').order('ruc'),
        supabase.from('proveedores').select('*').order('nombre'),
        supabase.from('tareas_proveedor').select('*'),
        supabase.from('users').select('*'),
      ]);
      if (configRes.data) setConfig(configRes.data.data);
      if (sriRes.data) setSriCredentials(sriRes.data);
      if (provRes.data) setProveedores(provRes.data as Proveedor[]);
      if (tareasRes.data) setTareas(tareasRes.data as TareaProveedor[]);
      if (usersRes.data) setUsers(usersRes.data);
    } catch (err) {
      console.error('[ConfigContext] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    const channels = [
      supabase.channel('db-config').on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, (payload) => {
        if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new?.id === 1) {
          setConfig(payload.new.data);
        }
      }).subscribe(),
      supabase.channel('db-sri').on('postgres_changes', { event: '*', schema: 'public', table: 'sri_credentials' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        if (eventType === 'INSERT') {
          setSriCredentials(prev => prev.some(s => s.ruc === newRecord.ruc) ? prev : [...prev, newRecord as SriCredential]);
        } else if (eventType === 'UPDATE') {
          setSriCredentials(prev => prev.map(s => s.ruc === newRecord.ruc ? newRecord as SriCredential : s));
        } else if (eventType === 'DELETE') {
          setSriCredentials(prev => prev.filter(s => s.ruc !== oldRecord.ruc));
        }
      }).subscribe(),
    ];
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [fetchConfig]);

  const updateConfig = async (data: any) => {
    const { error } = await supabase.from('app_config').upsert({ id: 1, data });
    if (error) throw error;
    setConfig(data);
  };

  const upsertSriCredential = async (cred: SriCredential) => {
    const { error } = await supabase.from('sri_credentials').upsert(cred);
    if (error) throw error;
  };

  const deleteSriCredential = async (ruc: string) => {
    const { error } = await supabase.from('sri_credentials').delete().eq('ruc', ruc);
    if (error) throw error;
  };

  const refreshAll = async () => {
    const [provRes, tareasRes] = await Promise.all([
      supabase.from('proveedores').select('*').order('nombre'),
      supabase.from('tareas_proveedor').select('*'),
    ]);
    if (provRes.data) setProveedores(provRes.data as Proveedor[]);
    if (tareasRes.data) setTareas(tareasRes.data as TareaProveedor[]);
  };

  const addProveedor = async (p: Partial<Proveedor>) => {
    const { error } = await supabase.from('proveedores').insert([p]);
    if (error) throw error;
    await refreshAll();
  };

  const updateProveedor = async (id: string, p: Partial<Proveedor>) => {
    const { error } = await supabase.from('proveedores').update(p).eq('id', id);
    if (error) throw error;
    await refreshAll();
  };

  const deleteProveedor = async (id: string) => {
    const { error } = await supabase.from('proveedores').delete().eq('id', id);
    if (error) throw error;
    await refreshAll();
  };

  const createTarea = async (t: Partial<TareaProveedor>) => {
    const dbData = {
      proveedor_id: t.proveedorId,
      titulo: t.titulo,
      tipo: t.tipo,
      descripcion: t.descripcion,
      fecha_vencimiento: t.fechaVencimiento,
      completada: t.completada ?? false,
    };
    const { error } = await supabase.from('tareas_proveedor').insert([dbData]);
    if (error) throw error;
    await refreshAll();
  };

  const updateTarea = async (id: string, t: Partial<TareaProveedor>) => {
    const dbData = {
      titulo: t.titulo,
      tipo: t.tipo,
      descripcion: t.descripcion,
      fecha_vencimiento: t.fechaVencimiento,
      completada: t.completada,
    };
    const { error } = await supabase.from('tareas_proveedor').update(dbData).eq('id', id);
    if (error) throw error;
    await refreshAll();
  };

  const deleteTarea = async (id: string) => {
    const { error } = await supabase.from('tareas_proveedor').delete().eq('id', id);
    if (error) throw error;
    await refreshAll();
  };

  return (
    <ConfigContext.Provider value={{
      config, loading, fetchConfig, updateConfig,
      sriCredentials, upsertSriCredential, deleteSriCredential,
      proveedores, addProveedor, updateProveedor, deleteProveedor,
      tareas, createTarea, updateTarea, deleteTarea,
      users,
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig debe usarse dentro de ConfigProvider');
  return ctx;
};
