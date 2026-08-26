import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Cliente, Regimen } from '../types';
import { supabase } from '../services/supabase';

const mapDBCliente = (c: any): Cliente => {
  const dbRegimen = c.regimen || c.regime || '';
  const raw = dbRegimen.toString().toUpperCase();
  let normalizedRegimen = Regimen.GENERAL;
  if (raw === 'RIMPE' || raw.includes('POPULAR') || raw.includes('NEGOCIO POPULAR')) {
    normalizedRegimen = Regimen.NEGOCIO_POPULAR;
  } else if (raw === 'EMPRENDEDOR' || raw.includes('EMPRENDEDOR')) {
    normalizedRegimen = Regimen.EMPRENDEDOR;
  } else if (raw === 'GENERAL') {
    normalizedRegimen = Regimen.GENERAL;
  }
  return {
    id: c.id,
    cedula: c.cedula,
    ruc: c.ruc,
    nombre: c.nombre,
    nombreComercial: c.nombre_comercial,
    actividades: c.actividades,
    direccion: c.direccion,
    notas: c.notas,
    telefono: c.telefono || [],
    email: c.email,
    creadoEn: c.creado_en,
    regimen: normalizedRegimen as Regimen,
    establecimientoPredeterminado: c.establecimiento_predeterminado,
    puntoEmisionPredeterminado: c.punto_emision_predeterminado,
    numEstablecimientosOpen: c.num_establecimientos_open,
    fiscal_data: c.fiscal_data || {},
  };
};

const mapClienteToDB = (c: any) => {
  const base: Record<string, any> = {
    cedula: c.cedula,
    ruc: c.ruc,
    nombre: c.nombre,
    nombre_comercial: c.nombreComercial,
    actividades: c.actividades,
    direccion: c.direccion,
    notas: c.notas,
    telefono: c.telefono,
    email: c.email,
    regimen: c.regimen,
    establecimiento_predeterminado: c.establecimientoPredeterminado,
    punto_emision_predeterminado: c.puntoEmisionPredeterminado,
    num_establecimientos_open: c.numEstablecimientosOpen,
  };
  if (c.fiscal_data && Object.keys(c.fiscal_data).length > 0) {
    base.fiscal_data = c.fiscal_data;
  }
  return base;
};

interface ClientesContextType {
  clientes: Cliente[];
  loading: boolean;
  fetchClientes: () => Promise<void>;
  addCliente: (data: any) => Promise<Cliente>;
  updateCliente: (id: string, data: any) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;
}

const ClientesContext = createContext<ClientesContextType | undefined>(undefined);

export const ClientesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientes = useCallback(async () => {
    try {
      let { data, error } = await supabase.from('clientes').select('*').order('creado_en', { ascending: false });
      if (error && error.message.includes('fiscal_data')) {
        const { data: fallback } = await supabase.from('clientes')
          .select('id, cedula, ruc, nombre, nombre_comercial, actividades, direccion, notas, telefono, email, creado_en, regimen, establecimiento_predeterminado, punto_emision_predeterminado, num_establecimientos_open')
          .order('creado_en', { ascending: false });
        data = fallback;
      }
      if (data) setClientes(data.map(mapDBCliente));
    } catch (err) {
      console.error('[ClientesContext] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
    const channel = supabase
      .channel('db-clientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        if (eventType === 'INSERT') {
          const mapped = mapDBCliente(newRecord);
          setClientes(prev => prev.some(c => c.id === mapped.id) ? prev : [mapped, ...prev]);
        } else if (eventType === 'UPDATE') {
          const mapped = mapDBCliente(newRecord);
          setClientes(prev => prev.map(c => c.id === mapped.id ? mapped : c));
        } else if (eventType === 'DELETE') {
          setClientes(prev => prev.filter(c => c.id !== oldRecord.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchClientes]);

  const addCliente = async (clienteData: any): Promise<Cliente> => {
    const dbReadyData = mapClienteToDB(clienteData);
    let { data, error } = await supabase.from('clientes').insert([dbReadyData]).select().single();
    if (error && error.message.includes('fiscal_data')) {
      const { fiscal_data, ...safeData } = dbReadyData;
      const retry = await supabase.from('clientes').insert([safeData]).select().single();
      data = retry.data;
      error = retry.error;
    }
    if (error) throw error;
    const mapped = mapDBCliente(data);
    setClientes(prev => [mapped, ...prev]);
    return mapped;
  };

  const updateCliente = async (id: string, data: any) => {
    const dbReadyData = mapClienteToDB(data);
    const { error } = await supabase.from('clientes').update(dbReadyData).eq('id', id);
    if (error) throw error;
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const deleteCliente = async (id: string) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
    setClientes(prev => prev.filter(c => c.id !== id));
  };

  return (
    <ClientesContext.Provider value={{ clientes, loading, fetchClientes, addCliente, updateCliente, deleteCliente }}>
      {children}
    </ClientesContext.Provider>
  );
};

export const useClientes = () => {
  const ctx = useContext(ClientesContext);
  if (!ctx) throw new Error('useClientes debe usarse dentro de ClientesProvider');
  return ctx;
};
