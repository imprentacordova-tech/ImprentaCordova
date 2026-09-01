import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SEO } from '../components/SEO';
import {
  UsersIcon, LockIcon, EyeIcon, EyeSlashIcon, ArrowLeftIcon,
  Loader2Icon, ExclamationTriangleIcon, ShieldCheckIcon,
} from '../components/Icons';
import { C, S, MONO, DISPLAY, PANEL_KEYFRAMES } from '../components/panelTheme';

/**
 * Ingreso al panel interno — Sistema "Marino & Oro" (design_manifest.md §2).
 *
 * La pantalla es el espejo del shell interno: la franja marino de la izquierda repite
 * el lockup y el tono del sidebar de `components/Layout.tsx`, y el formulario vive en
 * superficie clara. Es la única superficie oscura de la vista; el botón de acción va
 * en azul `royal`, nunca en oro (regla crítica §0.3 del manifiesto).
 */

const PUNTOS = [
  { titulo: 'Órdenes de producción', detalle: 'Del pedido al despacho, con la trazabilidad en una sola ficha.' },
  { titulo: 'Monitor de taller', detalle: 'Diseño, prensa y acabados avanzando en el mismo tablero.' },
  { titulo: 'Caja y cuentas por cobrar', detalle: 'Abonos, saldos y facturación SRI al día.' },
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [key, setKey] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focus, setFocus] = useState<'usuario' | 'clave' | null>(null);

  /* Mismo reloj de la cabecera del panel: se refresca cada 30 s. */
  const [hora, setHora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setHora(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(key, password);
      if (result.success) navigate('/dashboard');
      else setError(result.error || 'No reconocemos ese usuario. Revisa el nombre.');
    } catch (err) {
      console.error('[Login] Error de conexión:', err);
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const campo = (activo: boolean): React.CSSProperties => ({
    ...S.input,
    paddingLeft: 42,
    background: C.surface,
    borderColor: activo ? C.royal : C.borderStrong,
  });

  const marca = (sobreMarino: boolean) => (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
      <img
        src="/LOGO.png"
        alt="Imprenta Córdova"
        style={{ width: 34, height: 34, objectFit: 'contain', background: C.surface, borderRadius: 7, padding: 2 }}
      />
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 700, letterSpacing: '-.03em', color: sobreMarino ? C.onInk : C.ink }}>
          CÓRDOVA<span style={{ color: C.gold }}>.</span>
        </span>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: sobreMarino ? '#7E8CBE' : C.faint, marginTop: 2 }}>
          Centro de Producción
        </span>
      </span>
    </Link>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: C.bg, color: C.ink, fontFamily: "'Inter',system-ui,sans-serif" }}>
      <style>{PANEL_KEYFRAMES}</style>
      <SEO title="Ingresar · Imprenta Córdova" />

      {/* Franja marino — espejo del sidebar del panel */}
      <aside
        className="hidden lg:flex"
        style={{
          width: '44%', maxWidth: 560, background: C.ink, color: C.onInk,
          flexDirection: 'column', justifyContent: 'space-between', padding: '28px 40px 32px',
        }}
      >
        {marca(true)}

        <div style={{ animation: 'pi-rise .6s cubic-bezier(.2,.8,.2,1) both' }}>
          <p style={{ ...S.eyebrow, color: C.gold }}>Panel interno</p>
          <h1 style={{ margin: '10px 0 0', fontFamily: DISPLAY, fontSize: 38, fontWeight: 600, letterSpacing: '-.038em', color: C.onInk, lineHeight: 1.1 }}>
            El taller, en una sola pantalla
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 14, color: C.onInkMuted, lineHeight: 1.65, maxWidth: 400 }}>
            Ingresa con tu usuario para retomar las órdenes del día.
          </p>

          <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
            {PUNTOS.map(p => (
              <div key={p.titulo} style={{ display: 'flex', gap: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: C.gold, flexShrink: 0, marginTop: 6 }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.onInk }}>{p.titulo}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: C.onInkFaint, marginTop: 2, lineHeight: 1.55 }}>{p.detalle}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: C.onInkLayer, border: `1px solid ${C.onInkBorder}` }}>
            <ShieldCheckIcon className="w-3.5 h-3.5" style={{ color: C.gold }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: C.onInkSoft }}>Establecimiento gráfico autorizado · SRI 001-001</span>
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', color: C.onInkFaint }}>
            {hora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </aside>

      {/* Formulario */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(24px,5vw,56px)' }}>
        <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', animation: 'pi-rise .6s cubic-bezier(.2,.8,.2,1) both' }}>

          {/* En celular la franja marino no se muestra: la marca vive aquí */}
          <div className="lg:hidden" style={{ marginBottom: 26 }}>{marca(false)}</div>

          <p style={S.eyebrow}>Acceso al sistema</p>
          <h1 style={S.h1}>Iniciar sesión</h1>
          <p style={S.lead}>Usa el nombre con el que estás registrado en el taller.</p>

          <form onSubmit={handleLogin} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="usuario" style={S.fieldLabel}>Usuario</label>
              <div style={{ position: 'relative' }}>
                <UsersIcon
                  className="w-4 h-4"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focus === 'usuario' ? C.royal : C.faint, pointerEvents: 'none' }}
                />
                <input
                  id="usuario"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  onFocus={() => setFocus('usuario')}
                  onBlur={() => setFocus(null)}
                  placeholder="Ej. Pedro"
                  style={campo(focus === 'usuario')}
                />
              </div>
            </div>

            <div>
              <label htmlFor="clave" style={S.fieldLabel}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <LockIcon
                  className="w-4 h-4"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focus === 'clave' ? C.royal : C.faint, pointerEvents: 'none' }}
                />
                <input
                  id="clave"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocus('clave')}
                  onBlur={() => setFocus(null)}
                  placeholder="Solo si tu usuario la exige"
                  style={{ ...campo(focus === 'clave'), paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', color: C.faint }}
                >
                  {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: 11 }}
              >
                <ExclamationTriangleIcon className="w-4 h-4" style={{ color: C.danger, flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: C.dangerText }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !key.trim()}
              style={{
                ...S.primaryBtn,
                width: '100%', justifyContent: 'center', padding: '13px 18px', borderRadius: 11, fontSize: 13.5,
                marginTop: 4,
                ...(loading || !key.trim() ? { background: C.softGray, color: C.faint, cursor: 'not-allowed' } : {}),
              }}
            >
              {loading ? (
                <>
                  <Loader2Icon className="w-4 h-4" style={{ animation: 'spin 1s linear infinite' }} />
                  Verificando…
                </>
              ) : 'Entrar al panel'}
            </button>
          </form>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: C.royal, textDecoration: 'none' }}>
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              Volver al sitio público
            </Link>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: 99, background: C.successDot }} />
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: C.faint }}>Sistema en línea</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
