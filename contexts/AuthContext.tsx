import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { loginBackend, BackendError, despertarBackend } from '../services/backendApi';
import { sesion, debeUsarRespaldo, respaldoHabilitado, compartirSesionConExtension, escucharPuenteExtension } from '../services/sesion';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (nombre: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'cordova_session';

function deserializeSession(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.nombre) return parsed as User;
    return null;
  } catch {
    return null;
  }
}

function serializeSession(user: User): string {
  return JSON.stringify({
    id: user.id,
    nombre: user.nombre,
    rol: user.rol,
    estado: user.estado,
    avatar: user.avatar,
    ultimoAcceso: user.ultimoAcceso,
  });
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => deserializeSession(localStorage.getItem(SESSION_KEY)));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const localUser = deserializeSession(localStorage.getItem(SESSION_KEY));
        if (localUser) {
          setUser(localUser);
        }
        // Intentar leer sesión Supabase si existe, pero no bloquear
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && localUser && localUser.id === session.user.id) {
          setUser(localUser);
        }
      } catch (err) {
        console.warn('[Auth] Error restaurando sesión:', err);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Solo escuchar desconexión explícita si se inició sesión por Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !localStorage.getItem(SESSION_KEY)) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si la extensión se carga con el panel ya abierto, se le pasa la sesión vigente.
  useEffect(() => escucharPuenteExtension(() => user?.nombre), [user?.nombre]);

  const login = useCallback(async (nombre: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // 1) Login validado por el servidor (único camino con contraseña real y sesión firmada).
    despertarBackend(0);
    try {
      const r = await loginBackend(nombre.trim(), password);
      sesion.guardar(r.token);
      const u: User = {
        id: r.user.id,
        nombre: r.user.nombre,
        rol: r.user.rol as User['rol'],
        estado: 'Activo',
        ultimoAcceso: new Date().toISOString(),
      };
      setUser(u);
      localStorage.setItem(SESSION_KEY, serializeSession(u));
      // La extensión toma la sesión por el puente (bridge.js) para no usar claves propias.
      compartirSesionConExtension(r.token, u.nombre);
      return { success: true };
    } catch (err) {
      const status = err instanceof BackendError ? err.status : 0;
      if (!debeUsarRespaldo(status, respaldoHabilitado())) {
        return { success: false, error: err instanceof Error ? err.message : 'No se pudo iniciar sesión.' };
      }
      console.warn('[Auth] Servidor sin login disponible; se usa el acceso de respaldo.');
    }

    // 2) Respaldo (hasta el corte, ver plan Fase D): sin sesión de servidor.
    try {
      // Query Supabase users table for the user
      const { data: validUser, error: sbError } = await supabase
        .from('users')
        .select('*')
        .ilike('nombre', nombre)
        .eq('estado', 'Activo')
        .maybeSingle();

      if (sbError) {
        console.warn('[Auth] Supabase query error:', sbError.message);
      }

      let matchedUser: User | null = null;

      if (validUser) {
        // User found in database
        if (validUser.require_password && validUser.password !== password) {
          return { success: false, error: 'Contraseña incorrecta' };
        }
        matchedUser = {
          id: validUser.id,
          nombre: validUser.nombre,
          rol: validUser.rol,
          estado: validUser.estado,
          avatar: validUser.avatar,
          ultimoAcceso: new Date().toISOString(),
        };
      } else {
        // Fallback for legacy hardcoded users
        const keyUpper = nombre.trim().toUpperCase();
        const hardcodedUsers: Record<string, { rol: User['rol']; id: string }> = {
          'PEDRO': { rol: 'Admin', id: 'usr-pedro' },
          'DANTE': { rol: 'Admin', id: 'usr-dante' },
          'ADMIN': { rol: 'Admin', id: 'usr-admin' },
          'ROOT': { rol: 'Admin', id: 'usr-root' },
          'ALEIDA': { rol: 'Operador', id: 'usr-aleida' },
          'ROBERTO': { rol: 'Operador', id: 'usr-roberto' },
          'DANIEL': { rol: 'Operador', id: 'usr-daniel' },
        };

        const legacy = hardcodedUsers[keyUpper];
        if (legacy) {
          matchedUser = {
            id: legacy.id,
            nombre: nombre.trim(),
            rol: legacy.rol,
            estado: 'Activo',
            ultimoAcceso: new Date().toISOString(),
          };
        }
      }

      if (!matchedUser) {
        return { success: false, error: 'IDENTIDAD NO RECONOCIDA' };
      }

      // Persist session
      setUser(matchedUser);
      localStorage.setItem(SESSION_KEY, serializeSession(matchedUser));

      // Try to sync with Supabase Auth (non-blocking)
      try {
        const email = `${matchedUser.nombre.toLowerCase().replace(/\s+/g, '.')}@imprentacordova.com`;
        await supabase.auth.signInWithPassword({ email, password: password || matchedUser.id });
      } catch {
        // Supabase Auth not configured for this user — local session is enough
      }

      return { success: true };
    } catch (err) {
      console.error('[Auth] Login error:', err);
      return { success: false, error: 'Error de conexión' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore Supabase errors on logout
    }
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    sesion.limpiar();
    compartirSesionConExtension(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.rol === 'Admin' || (user?.rol as string) === 'root',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
