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
 * Ingreso al panel interno — Sistema "Marino & Oro" (tema claro).
 * Basado en la especificación entregada en Ingreso.dc.html.
 */

const OPERADORES_RAPIDOS = [
  { nombre: 'Pedro', rol: 'Administración' },
  { nombre: 'Dante', rol: 'Taller / Prensa' },
  { nombre: 'Mayra', rol: 'Recepción' },
  { nombre: 'Aleida', rol: 'Diseño' },
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await login(key.trim(), password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'No reconocemos ese usuario o clave. Revisa los datos.');
      }
    } catch (err) {
      console.error('[Login] Error de conexión:', err);
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarOperador = (nombre: string) => {
    setKey(nombre);
    setError('');
    const inputClave = document.getElementById('clave') as HTMLInputElement;
    if (inputClave) inputClave.focus();
  };

  const campo = (activo: boolean): React.CSSProperties => ({
    ...S.input,
    paddingLeft: 42,
    background: activo ? '#FFFFFF' : C.bg,
    borderColor: activo ? C.royal : C.borderStrong,
    boxShadow: activo ? '0 0 0 3px rgba(22,48,155,0.08)' : 'none',
    transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
  });

  const LogoVectorial = ({ size = 32 }: { size?: number }) => (
    <svg viewBox="0 0 34 34" style={{ width: size, height: size, display: 'block', flexShrink: 0 }} aria-hidden="true">
      <path d="M29.1 10A14 14 0 1 0 29.1 24" fill="none" stroke={C.royal} strokeWidth="6.2" strokeLinecap="round" />
      <path d="M10.6 10.4h9v2.9h-3v7.4h3v2.9h-9v-2.9h3v-7.4h-3z" fill="#E70101" stroke={C.gold} strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.ink,
      fontFamily: "'Inter',system-ui,sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px clamp(16px, 3vw, 40px)',
    }}>
      <style>{PANEL_KEYFRAMES}</style>
      <SEO title="Ingresar · Imprenta Córdova" />

      <div style={{ width: '100%', maxWidth: 1040, animation: 'pi-rise .6s cubic-bezier(.2,.8,.2,1) both' }}>
        
        {/* Cabecera Superior */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <LogoVectorial size={34} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, letterSpacing: '-.03em', color: C.ink }}>
                CÓRDOVA<span style={{ color: C.gold }}>.</span>
              </span>
              <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.3em', textTransform: 'uppercase', color: C.faint, marginTop: 2 }}>
                Centro de producción
              </span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 13px', background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 99 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: C.successDot, animation: 'pi-blink 2.2s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.body }}>Taller abierto · 08:00 a 18:00</span>
            </span>
            <Link to="/" style={{ fontSize: 12.5, fontWeight: 600, color: C.royal, textDecoration: 'none' }}>
              Sitio público →
            </Link>
          </div>
        </div>

        {/* Tarjeta Principal de 2 Columnas */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          boxShadow: '0 24px 60px -20px rgba(10,17,64,.12)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}>

          {/* Columna Izquierda: Formulario */}
          <div style={{ padding: 'clamp(28px, 4vw, 44px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={S.eyebrow}>Acceso al sistema</p>
            <h1 style={{ ...S.h1, fontSize: 28, marginTop: 4 }}>Iniciar sesión</h1>
            <p style={{ ...S.lead, fontSize: 13 }}>
              Usa el nombre con el que estás registrado. La clave solo se pide a los usuarios que la tienen activada.
            </p>

            {/* Chips de Selección Rápida */}
            <div style={{ marginTop: 18 }}>
              <span style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.faint, marginBottom: 8 }}>
                Operadores frecuentes
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {OPERADORES_RAPIDOS.map((op) => (
                  <button
                    key={op.nombre}
                    type="button"
                    onClick={() => seleccionarOperador(op.nombre)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 8,
                      border: `1px solid ${key.toLowerCase() === op.nombre.toLowerCase() ? C.royal : C.borderStrong}`,
                      background: key.toLowerCase() === op.nombre.toLowerCase() ? C.chipBlue : C.surfaceAlt,
                      color: key.toLowerCase() === op.nombre.toLowerCase() ? C.royal : C.body,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {op.nombre}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLogin} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <label htmlFor="clave" style={{ ...S.fieldLabel, marginBottom: 0 }}>Contraseña</label>
                  <Link to="/recuperar-acceso" style={{ fontSize: 11, color: C.royal, fontWeight: 600, textDecoration: 'none' }}>
                    ¿Olvidaste tu clave?
                  </Link>
                </div>
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
                    style={{
                      position: 'absolute',
                      right: 6,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: C.faint,
                    }}
                  >
                    {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 14px',
                    background: C.dangerBg,
                    border: `1px solid ${C.dangerBorder}`,
                    borderRadius: 11,
                  }}
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
                  width: '100%',
                  justifyContent: 'center',
                  padding: '13px 18px',
                  borderRadius: 11,
                  fontSize: 13.5,
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
          </div>

          {/* Columna Derecha: Contexto y Garantías Operativas */}
          <div style={{
            background: C.surfaceAlt,
            borderLeft: `1px solid ${C.border}`,
            padding: 'clamp(28px, 4vw, 44px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 24,
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', background: C.goldBg, border: `1px solid ${C.goldBorder}`, borderRadius: 99, marginBottom: 14 }}>
                <ShieldCheckIcon className="w-3.5 h-3.5" style={{ color: C.goldTextStrong }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: C.goldTextStrong }}>Establecimiento Gráfico Autorizado SRI</span>
              </div>
              
              <h2 style={{ ...S.h2, fontSize: 19 }}>Control Total de Producción</h2>
              <p style={{ ...S.lead, fontSize: 13, marginTop: 6 }}>
                Ambiente de trabajo sincronizado en tiempo real con Supabase y respaldo local.
              </p>

              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: C.chipBlue, color: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                    1
                  </span>
                  <div>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.ink }}>Órdenes de Producción Unificadas</span>
                    <span style={{ display: 'block', fontSize: 12, color: C.muted, marginTop: 2 }}>
                      Preimpresos del SRI y trabajos comerciales en la misma ficha técnica.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: C.chipBlue, color: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                    2
                  </span>
                  <div>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.ink }}>Monitor de Taller (KDS)</span>
                    <span style={{ display: 'block', fontSize: 12, color: C.muted, marginTop: 2 }}>
                      Diseño, prensa y acabados sincronizados en vivo con alertas sonoras.
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: C.chipBlue, color: C.royal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                    3
                  </span>
                  <div>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.ink }}>Arqueo de Caja y Facturación SRI</span>
                    <span style={{ display: 'block', fontSize: 12, color: C.muted, marginTop: 2 }}>
                      Control inmutable de abonos, saldos y comprobantes electrónicos.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '14px 16px',
              background: '#FFFFFF',
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <span style={{ fontSize: 11.5, color: C.muted }}>
                ¿Problemas de acceso?
              </span>
              <Link to="/recuperar-acceso" style={{ fontSize: 12, fontWeight: 700, color: C.royal, textDecoration: 'none' }}>
                Contactar Administrador →
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Login;
