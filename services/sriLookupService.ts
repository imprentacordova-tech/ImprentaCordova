
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
 * Permite buscar datos de RUCs basados en el padrón local (CSV importado a Supabase)
 */
export const sriLookupService = {
  /**
   * Busca un RUC en el padrón de El Oro
   */
  async lookupByRuc(ruc: string): Promise<SriRucData | null> {
    if (!ruc || ruc.length < 10) return null;
    
    try {
      const { data, error } = await supabase
        .from('sri_padron_el_oro')
        .select('*')
        .eq('ruc', ruc)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        console.error('[SRI Lookup] Error querying padrón:', error);
        return null;
      }
      
      return data as SriRucData;
    } catch (err) {
      console.error('[SRI Lookup] Exception:', err);
      return null;
    }
  },

  /**
   * Busca coincidencias parciales por nombre (Sugerencias)
   */
  async searchByName(query: string): Promise<SriRucData[]> {
    if (!query || query.length < 4) return [];
    
    try {
      const { data, error } = await supabase
        .from('sri_padron_el_oro')
        .select('*')
        .ilike('razon_social', `%${query}%`)
        .limit(10);
        
      if (error) {
        console.error('[SRI Lookup] Error searching by name:', error);
        return [];
      }
      
      return data as SriRucData[];
    } catch (err) {
      console.error('[SRI Lookup] Exception:', err);
      return [];
    }
  }
};
