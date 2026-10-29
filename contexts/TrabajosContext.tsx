import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Trabajo, TrabajoEstado, StatusLog } from '../types';
import { supabase } from '../services/supabase';

/**
 * Mapeo de una fila de `trabajos` (snake_case) al tipo `Trabajo` (camelCase).
 *
 * ÚNICA FUENTE DE VERDAD. Estaba copiado dentro de `pages/SolicitudImpresion.tsx` y
 * `pages/NotaDeVenta.tsx`, y las copias se fueron desincronizando en silencio: cada campo
 * nuevo había que agregarlo en tres lugares y, si te olvidabas de uno, ese campo llegaba
 * `undefined` sin ningún error. Ya pasó con `tiempo_entrega_estimado` y `fecha_entrega`.
 *
 * Si agregás una columna, se agrega ACÁ y queda para todos.
 */
export const mapDBTrabajo = (t: any): Trabajo => ({
  ...t,
  clienteId: t.cliente_id,
  fechaEntrada: t.fecha_entrada,
  fechaEntrega: t.fecha_entrega,
  // Faltaba este mapeo: la columna es `tiempo_entrega_estimado` y el tipo declara
  // `tiempoEntregaEstimado`, así que el spread no lo cubría y la ficha de taller
  // (OrdenProduccion) lo leía siempre `undefined` -> asumía 48 h para todo.
  tiempoEntregaEstimado: t.tiempo_entrega_estimado,
  creadoPor: t.creado_por,
  actualizadoPor: t.actualizado_por,
  fotoOriginalUrl: t.foto_original_url,
  fotoEvidenciaUrl: t.foto_evidencia_url,
  estadoClave: t.estado_clave,
  imprimirClave: t.imprimir_clave,
  esRenovacion: t.es_renovacion,
  esSRI: t.es_sri === true || t.tipo?.toLowerCase() === 'sri' || t.subtipo?.toLowerCase()?.includes('sri') || false,
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
  // Modelo de impresión persistido: lo comparten el documento de impresión y la extensión.
  modeloImpresion: t.modelo_impresion,
  // Marcado del trámite (Aument./Cambiar./Mismo) que va impreso en la solicitud del SRI.
  tramiteSri: t.tramite_sri,
});

/**
 * Estado del canal de Supabase Realtime.
 *
 * El KDS depende de este canal para "reflejar órdenes frescas al instante"
 * (CONTINUITY_RULES.md). Antes el `.subscribe()` no tenía callback, así que si el canal
 * se caía el tablero quedaba congelado sin que nadie se enterara — el peor escenario
 * para una pantalla de taller: datos viejos con apariencia de vivos.
 */
export type RealtimeEstado = 'conectando' | 'conectado' | 'error';

interface TrabajosContextType {
  trabajos: Trabajo[];
  loading: boolean;
  fetchTrabajos: () => Promise<void>;
  /** Salud del canal en vivo, para que la UI pueda avisar cuando dejó de sincronizar. */
  realtimeEstado: RealtimeEstado;
  /** Timestamp del último dato recibido (fetch inicial o evento en vivo). */
  ultimaSync: number | null;
  addTrabajo: (data: Record<string, any>, user: string, imageFile?: File | null) => Promise<Trabajo>;
  updateTrabajoStatus: (id: string, status: TrabajoEstado, user: string) => Promise<void>;
  updateTrabajoPhoto: (id: string, url: string) => Promise<void>;
  updateTrabajoEvidencia: (id: string, url: string) => Promise<void>;
  registerRetiro: (id: string, pagoFinal: number, user: string, fotoRetiroUrl?: string, notasEntrega?: string) => Promise<Trabajo>;
  registrarAbono: (id: string, monto: number, user: string) => Promise<Trabajo>;
  aprobarArte: (id: string) => Promise<Trabajo>;
  getClientDebt: (clienteId: string) => number;
}

const TrabajosContext = createContext<TrabajosContextType | undefined>(undefined);

export const TrabajosProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeEstado, setRealtimeEstado] = useState<RealtimeEstado>('conectando');
  const [ultimaSync, setUltimaSync] = useState<number | null>(null);

  const fetchTrabajos = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('trabajos').select('*').order('fecha_entrada', { ascending: false });
      if (error) throw error;
      if (data) {
        setTrabajos(data.map(mapDBTrabajo));
        setUltimaSync(Date.now());
      }
    } catch (err) {
      console.error('[TrabajosContext] Error fetching:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrabajos();

    const playNewOrderChime = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (e) {}
    };

    const channel = supabase
      .channel('db-trabajos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trabajos' }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        if (eventType === 'INSERT') {
          const mapped = mapDBTrabajo(newRecord);
          setTrabajos(prev => prev.some(t => t.id === mapped.id) ? prev : [mapped, ...prev]);
          playNewOrderChime();
        } else if (eventType === 'UPDATE') {
          const mapped = mapDBTrabajo(newRecord);
          setTrabajos(prev => prev.map(t => t.id === mapped.id ? mapped : t));
        } else if (eventType === 'DELETE') {
          setTrabajos(prev => prev.filter(t => t.id !== oldRecord.id));
        }
        setUltimaSync(Date.now());
      })
      // Sin este callback, un canal caído era indistinguible de "no hay novedades":
      // el tablero quedaba mostrando datos viejos como si estuvieran vivos.
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeEstado('conectado');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') setRealtimeEstado('error');
        else setRealtimeEstado('conectando');
      });

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
      // El tipo solo admite 'Web' | 'Interno'. Antes se escribía el valor crudo del
      // llamador (NuevoPedido mandaba 'Local'), así que la BD quedaba con un origen
      // fuera del dominio y cualquier filtro por 'Interno' se saltaba esas órdenes.
      origen: trabajoData.origen === 'Web' ? 'Web' : 'Interno',
      // `tiempoEntregaEstimado` ('24h' | '48h') lo enviaba useOrder desde el paso de
      // logística, pero nunca se persistía: la ficha de taller (OrdenProduccion) lo
      // leía `undefined` y calculaba 48 h siempre, ignorando lo que eligió el operador.
      tiempo_entrega_estimado: trabajoData.tiempoEntregaEstimado === '24h' ? '24h' : trabajoData.tiempoEntregaEstimado === '48h' ? '48h' : null,
      // Estos cuatro se enviaban desde useOrder/NuevoPedido y se descartaban en silencio
      // porque no estaban en este objeto. Todos existen como columnas en `trabajos`:
      //   fecha_entrega  -> la columna "Entrega" de la lista salía siempre "—" y la ficha
      //                     de taller no tenía fecha real que mostrar.
      //   detalle        -> el desglose completo del pedido.
      //   observaciones  -> las notas de taller que el operador escribe en el paso final.
      //   responsable    -> quién tomó el pedido (se perdía el dato de autoría).
      // Un valor `undefined` se omite al serializar, así que no ensucian el insert.
      fecha_entrega: trabajoData.fechaEntrega,
      detalle: trabajoData.detalle,
      observaciones: trabajoData.observaciones,
      responsable: trabajoData.responsable,
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
      // Modelo de impresión: si no llega, la columna queda en NULL y `resolverModelo()` aplica
      // el default de la familia. Se omite cuando es undefined (este objeto filtra abajo).
      modelo_impresion: trabajoData.modeloImpresion,
      // Marcado del trámite SRI (Aument./Cambiar./Mismo). Igual: NULL = default.
      tramite_sri: trabajoData.tramiteSri,
    };

    Object.entries(sriFields).forEach(([k, v]) => { if (v !== undefined) dbData[k] = v; });

    let insertData: any = null;
    let insertError: any = null;
    let payload: Record<string, any> = { ...dbData };
    let attempts = 0;
    const columnasFaltantes: string[] = [];

    // Bucle auto-recuperable: si la base no tiene una columna opcional, la quita y reintenta.
    // Cubre el caso de una migración pendiente (p. ej. `tramite_sri` / `modelo_impresion`)
    // sin tumbar la orden: se guarda todo lo demás y se avisa qué columna faltó.
    while (attempts < 12) {
      attempts++;
      const res = await supabase.from('trabajos').insert([payload]).select().single();
      if (!res.error) {
        insertData = res.data;
        insertError = null;
        break;
      }

      insertError = res.error;
      const msg = res.error.message || '';

      const match = msg.match(/Could not find the '([^']+)' column/i) ||
                    msg.match(/column "([^"]+)" of relation/i) ||
                    msg.match(/column '([^']+)' does not exist/i);

      if (match && match[1] && match[1] in payload) {
        const missingCol = match[1];
        columnasFaltantes.push(missingCol);
        console.warn(`[TrabajosContext] Columna '${missingCol}' no existe en 'trabajos'. Se omite y se reintenta (migración pendiente).`);
        delete payload[missingCol];
      } else {
        break;
      }
    }

    if (insertError || !insertData) {
      console.error('[TrabajosContext] Error inserting trabajo:', insertError);
      const msgErr = insertError?.message || '';
      const esColumnaFaltante = /Could not find the '.+' column|column .+ does not exist/i.test(msgErr);
      if (esColumnaFaltante) {
        throw new Error(
          `La base de datos no tiene la columna ${columnasFaltantes.join(', ') || 'requerida'} en 'trabajos'. ` +
          `Corré la migración supabase/migrations/20261029_trabajos_columnas_sincronizadas.sql en Supabase (SQL Editor) y reintentá.`,
        );
      }
      throw insertError || new Error('No se pudo crear la orden en Supabase');
    }

    const data = insertData;

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
    const actual = trabajos.find(t => t.id === id);
    const historial: StatusLog[] = [
      ...(actual?.historial ?? []),
      { estado: status, fecha: new Date().toISOString(), usuario: user },
    ];
    
    let res = await supabase.from('trabajos').update({ estado: status, actualizado_por: user, historial }).eq('id', id);
    if (res.error && res.error.message?.includes('historial')) {
      // Fallback si la columna historial no existe en la tabla
      res = await supabase.from('trabajos').update({ estado: status, actualizado_por: user }).eq('id', id);
    }
    if (res.error) throw res.error;
    setTrabajos(prev => prev.map(t => t.id === id ? { ...t, estado: status, actualizadoPor: user, historial } : t));
  };

  /** Abono parcial: mueve abono/saldo sin tocar el estado de producción. */
  const registrarAbono = async (id: string, monto: number, user: string): Promise<Trabajo> => {
    const actual = trabajos.find(t => t.id === id);
    if (!actual) throw new Error('Orden no encontrada');
    const aplicado = Math.min(Math.max(monto, 0), actual.saldo || 0);
    const abono = (actual.abono || 0) + aplicado;
    const saldo = Math.max((actual.saldo || 0) - aplicado, 0);

    const { data, error } = await supabase.from('trabajos')
      .update({ abono, saldo, actualizado_por: user }).eq('id', id).select().single();
    if (error) throw error;
    const mapped = mapDBTrabajo(data);
    setTrabajos(prev => prev.map(t => t.id === id ? mapped : t));
    return mapped;
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

  const registerRetiro = async (id: string, pagoFinal: number, user: string, fotoRetiroUrl?: string, notasEntrega?: string): Promise<Trabajo> => {
    const actual = trabajos.find(t => t.id === id);
    const updateData: Record<string, any> = {
      saldo: 0,
      estado: TrabajoEstado.ENTREGADO,
      actualizado_por: user,
      fecha_entrega: new Date().toISOString(),
    };
    if (fotoRetiroUrl) updateData.foto_retiro_url = fotoRetiroUrl;
    if (notasEntrega && actual) {
      const prevObs = actual.observaciones ? `${actual.observaciones}\n` : '';
      updateData.observaciones = `${prevObs}[Despacho ${new Date().toLocaleDateString('es-EC')}]: ${notasEntrega}`.slice(0, 1000);
    }

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
      updateTrabajoPhoto, updateTrabajoEvidencia, registerRetiro, registrarAbono, aprobarArte, getClientDebt,
      realtimeEstado, ultimaSync,
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
