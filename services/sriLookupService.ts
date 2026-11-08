
import { supabase } from './supabase';

export interface SriRucData {
  ruc: string;
  razon_social: string;
  estado_contribuyente: string;
  tipo_persona: string;
  provincia?: string;
  canton: string;
  parroquia: string;
  actividad_economica: string;
  direccion?: string;
  regimen?: string;
}

/**
 * Servicio de Interconexión SRI (Local Cache)
 * Permite buscar datos de RUCs y Cédulas basados en el padrón local de El Oro
 */
export const sriLookupService = {
  /**
   * Busca un RUC o Cédula en el padrón de El Oro
   */
  async lookupByRuc(rucRaw: string): Promise<SriRucData | null> {
    if (!rucRaw) return null;
    const cleanRuc = rucRaw.replace(/\D/g, '');
    if (cleanRuc.length < 10) return null;
    
    try {
      // Generar variantes para coincidir tanto Cédula (10 dígitos) como RUC (13 dígitos)
      const variants = cleanRuc.length === 10 
        ? [cleanRuc, `${cleanRuc}001`] 
        : [cleanRuc, cleanRuc.substring(0, 10)];

      const { data, error } = await supabase
        .from('sri_padron_el_oro')
        .select('*')
        .in('ruc', variants)
        .limit(1);
        
      if (error) {
        console.error('[SRI Lookup] Error querying padrón:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const item = data[0] as SriRucData;
        return {
          ...item,
          direccion: item.direccion || [item.parroquia, item.canton, item.provincia || 'EL ORO'].filter(Boolean).join(', ')
        };
      }
      return null;
    } catch (err) {
      console.error('[SRI Lookup] Exception:', err);
      return null;
    }
  },

  /**
   * Busca coincidencias parciales por nombre o Razón Social (Sugerencias)
   */
  async searchByName(query: string): Promise<SriRucData[]> {
    if (!query || query.trim().length < 3) return [];
    const q = query.trim().toUpperCase();
    
    try {
      const { data, error } = await supabase
        .from('sri_padron_el_oro')
        .select('*')
        .ilike('razon_social', `%${q}%`)
        .limit(12);
        
      if (error) {
        console.error('[SRI Lookup] Error searching by name:', error);
        return [];
      }
      
      return (data || []).map((item) => ({
        ...item,
        direccion: item.direccion || [item.parroquia, item.canton, item.provincia || 'EL ORO'].filter(Boolean).join(', ')
      })) as SriRucData[];
    } catch (err) {
      console.error('[SRI Lookup] Exception:', err);
      return [];
    }
  }
};

