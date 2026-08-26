import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Trabajo, TrabajoEstado } from '../types';
import { supabase } from '../services/supabase';

const mapDBTrabajo = (t: any): Trabajo => ({
  ...t,
  clienteId: t.cliente_id,
  fechaEntrada: t.fecha_entrada,
  fechaEntrega: t.fecha_entrega,
  creadoPor: t.creado_por,
  actualizadoPor: t.actualizado_por,
  fotoOriginalUrl: t.foto_original_url,
  fotoEvidenciaUrl: t.foto_evidencia_url,
  estadoClave: t.estado_clave,
  imprimirClave: t.imprimir_clave,
  esRenovacion: t.es_renovacion,
  esSRI: t.es_sri === true || t.tipo?.toLowerCase() === 'sri',
  tamano: t.tamano,
  establecimiento: t.establecimiento,
  puntoEmision: t.punto_emision,
  fechaVencimiento: t.fecha_vencimiento,
  actividadSeleccionada: t.actividad_seleccionada,
  claveAcceso: t.clave_acceso,
  arteAprobado: t.arte_aprobado,
  fotoRetiroUrl: t.foto_retiro_url,
  autorizacion_sri: t.autorizacion_sri,
  numeracion: t.numeracion,
});

interface TrabajosContextType {
  trabajos: Trabajo[];
  loading: boolean;
  fetchTrabajos: () => Promise<void>;
  addTrabajo: (data: Record<string, any>, user: string, imageFile?: File | null) => Promise<Trabajo>;
  updateTrabajoStatus: (id: string, status: TrabajoEstado, user: string) => Promise<void>;
  updateTrabajoPhoto: (id: string, url: string) => Promise<void>;
  updateTrabajoEvidencia: (id: string, url: string) => Promise<void>;
  registerRetiro: (id: string, pagoFinal: number, user: string, fotoRetiroUrl?: string) => Promise<Trabajo>;
  aprobarArte: (id: string) => Promise<Trabajo>;
  getClientDebt: (clienteId: string) => number;
}

const TrabajosContext = createContext<TrabajosContextType | undefined>(undefined);

export const TrabajosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrabajos = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('trabajos').select('*').order('fecha_entrada', { ascending: false });
      if (error) throw error;
      if (data) setTrabajos(data.map(mapDBTrabajo));
    } catch (err) {
      console.error('[TrabajosContext] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrabajos();
    const channel = supabase
      .channel('db-trabajos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trabajos' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        if (eventType === 'INSERT') {
          const mapped = mapDBTrabajo(newRecord);
          setTrabajos(prev => prev.some(t => t.id === mapped.id) ? prev : [mapped, ...prev]);
        } else if (eventType === 'UPDATE') {
          const mapped = mapDBTrabajo(newRecord);
          setTrabajos(prev => prev.map(t => t.id === mapped.id ? mapped : t));
        } else if (eventType === 'DELETE') {
          setTrabajos(prev => prev.filter(t => t.id !== oldRecord.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTrabajos]);

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const fileName = `${path}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrl;
  };

  const addTrabajo = async (trabajoData: Record<string, any>, user: string, imageFile?: File | null): Promise<Trabajo> => {
    const dbData: Record<string, any> = {
      cliente_id: trabajoData.clienteId || trabajoData.cliente_id,
      titular: trabajoData.titular,
      tipo: trabajoData.tipo || trabajoData.servicio,
      subtipo: trabajoData.subtipo || trabajoData.detalle,
      cantidad: trabajoData.cantidad || 1,
      total: trabajoData.precio || trabajoData.total,
      abono: trabajoData.abono || 0,
      saldo: trabajoData.saldo || 0,
      estado: trabajoData.estado || TrabajoEstado.PENDIENTE,
      prioridad: trabajoData.prioridad || 'Normal',
      creado_por: user,
      origen: trabajoData.origen || 'Interno',
      fecha_entrada: trabajoData.fechaEntrada || new Date().toISOString(),
    };

    const sriFields: Record<string, any> = {
      es_sri: trabajoData.esSRI,
      establecimiento: trabajoData.establecimiento,
      punto_emision: trabajoData.puntoEmision,
      estado_clave: trabajoData.estadoClave,
      actividad_seleccionada: trabajoData.actividadSeleccionada,
      tamano: trabajoData.tamano,
      es_renovacion: trabajoData.esRenovacion,
      clave_acceso: trabajoData.claveAcceso,
      autorizacion_sri: trabajoData.autorizacion_sri,
      numeracion: trabajoData.numeracion,
      fecha_vencimiento: trabajoData.fechaVencimiento,
    };

    Object.entries(sriFields).forEach(([k, v]) => { if (v !== undefined) dbData[k] = v; });

    const { data, error } = await supabase.from('trabajos').insert([dbData]).select().single();
    if (error) throw error;

    if (imageFile) {
      try {
        const url = await uploadFile(imageFile, 'trabajos', `${data.id}/original_${Date.now()}`);
        await supabase.from('trabajos').update({ foto_original_url: url }).eq('id', data.id);
        data.foto_original_url = url;
      } catch (uploadErr) {
        console.error('[TrabajosContext] Error uploading image:', uploadErr);
      }
    }

    const mapped = mapDBTrabajo(data);
    setTrabajos(prev => [mapped, ...prev]);
    return mapped;
  };

  const updateTrabajoStatus = async (id: string, status: TrabajoEstado, user: string) => {
    const { error } = await supabase.from('trabajos').update({ estado: status, actualizado_por: user }).eq('id', id);
    if (error) throw error;
    setTrabajos(prev => prev.map(t => t.id === id ? { ...t, estado: status, actualizado_por: user } : t));
  };

  const updateTrabajoPhoto = async (id: string, url: string) => {
    const { error } = await supabase.from('trabajos').update({ foto_original_url: url }).eq('id', id);
    if (error) throw error;
    setTrabajos(prev => prev.map(t => t.id === id ? { ...t, fotoOriginalUrl: url } : t));
  };

  const updateTrabajoEvidencia = async (id: string, url: string) => {
    const { error } = await supabase.from('trabajos').update({ foto_evidencia_url: url }).eq('id', id);
    if (error) throw error;
  };

  const registerRetiro = async (id: string, pagoFinal: number, user: string, fotoRetiroUrl?: string): Promise<Trabajo> => {
    const updateData: Record<string, any> = {
      saldo: 0,
      estado: TrabajoEstado.ENTREGADO,
      actualizado_por: user,
    };
    if (fotoRetiroUrl) updateData.foto_retiro_url = fotoRetiroUrl;

    const { data, error } = await supabase.from('trabajos').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    const mapped = mapDBTrabajo(data);
    setTrabajos(prev => prev.map(t => t.id === id ? mapped : t));
    return mapped;
  };

  const aprobarArte = async (id: string): Promise<Trabajo> => {
    const { data, error } = await supabase.from('trabajos').update({ arte_aprobado: true }).eq('id', id).select().single();
    if (error) throw error;
    const mapped = mapDBTrabajo(data);
    setTrabajos(prev => prev.map(t => t.id === id ? mapped : t));
    return mapped;
  };

  const getClientDebt = (clienteId: string) => {
    return trabajos.filter(t => t.clienteId === clienteId).reduce((acc, t) => acc + (t.saldo || 0), 0);
  };

  return (
    <TrabajosContext.Provider value={{
      trabajos, loading, fetchTrabajos, addTrabajo, updateTrabajoStatus,
      updateTrabajoPhoto, updateTrabajoEvidencia, registerRetiro, aprobarArte, getClientDebt,
    }}>
      {children}
    </TrabajosContext.Provider>
  );
};

export const useTrabajos = () => {
  const ctx = useContext(TrabajosContext);
  if (!ctx) throw new Error('useTrabajos debe usarse dentro de TrabajosProvider');
  return ctx;
};
