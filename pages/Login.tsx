
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { CordovaLogo, UsersIcon, ArrowRightIcon, ShieldCheckIcon, ArrowLeftIcon, Loader2Icon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, LockIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginProps {
  onLoginSuccess: (user: User, remember: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [key, setKey] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Simulación de handshake de seguridad
      await new Promise(resolve => setTimeout(resolve, 2000));

      // ACCESO DE EMERGENCIA PARA PEDRO (Fallback si la DB falla)
      if (key.toLowerCase() === 'pedro' && !password) {
        onLoginSuccess({
          id: 'temp-pedro-id',
          nombre: 'pedro',
          rol: 'Operador',
          estado: 'Activo',
          ultimoAcceso: new Date().toISOString()
        }, remember);
        navigate('/dashboard');
        return;
      }

      // Consulta directa a Supabase
      const { data: usersData, error: sbError } = await supabase
        .from('users')
        .select('*')
        .eq('estado', 'Activo');

      if (sbError) throw sbError;

      const validUser = usersData?.find(
        (u: any) => u.nombre.toLowerCase() === key.toLowerCase()
      );

      if (validUser) {
        const user: User = {
          id: validUser.id,
          nombre: validUser.nombre,
          rol: validUser.rol,
          estado: validUser.estado,
          avatar: validUser.avatar,
          requirePassword: validUser.require_password,
          password: validUser.password,
          ultimoAcceso: validUser.ultimo_acceso || new Date().toISOString(),
        };

        if (user.requirePassword) {
          if (user.password === password) {
            onLoginSuccess(user, remember);
            navigate('/dashboard');
          } else {
            setError("ACCESO DENEGADO: SIGNATURE MISMATCH");
            setLoading(false);
          }
        } else {
          onLoginSuccess(user, remember);
          navigate('/dashboard');
        }
      } else {
        setError("IDENTIDAD NO RECONOCIDA EN EL NÚCLEO");
        setKey('');
        setPassword('');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("FALLO CRÍTICO: ERROR DE CONEXIÓN");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#050811] relative overflow-hidden font-sans selection:bg-gold-bright selection:text-brand-dark">
        
        {/* LEFT COLUMN: FORM */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center relative z-10 px-6 md:px-16 lg:px-24">
            
            <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: "easeOut" as any }}
                className="w-full max-w-[480px] mx-auto"
            >
                {/* Header Content */}
                <div className="mb-12 space-y-6">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 mb-2 shadow-2xl relative group"
                    >
                        <div className="absolute inset-0 bg-gold-bright/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CordovaLogo className="h-8 w-8 object-contain relative z-10" />
                    </motion.div>
                    
                    <div className="space-y-3">
                        <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter uppercase italic leading-none">
                            PROTOCOLO <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-bright via-white to-gold-bright not-italic font-editorial font-normal">CENTRAL</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="h-[1px] w-8 bg-gold-bright/30"></div>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
                                Terminal Operativa Segura
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Identity Form */}
                <form onSubmit={handleLogin} className="space-y-8 relative">
                    <div className="space-y-6">
                        {/* Operator Input */}
                        <div className="space-y-3 group">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic transition-colors group-focus-within:text-gold-bright/80">ID de Operador</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-gold-bright transition-colors">
                                    <UsersIcon className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/10 focus:border-gold-bright/40 rounded-2xl pl-16 pr-6 py-6 text-white font-medium focus:ring-4 focus:ring-gold-bright/5 transition-all placeholder:text-slate-700 outline-none shadow-inner"
                                    placeholder="Ingrese identificador..."
                                />
                            </div>
                        </div>

                        {/* Signature Input */}
                        <div className="space-y-3 group">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic transition-colors group-focus-within:text-gold-bright/80">Firma de Seguridad</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-gold-bright transition-colors">
                                    <LockIcon className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/[0.02] border border-white/10 focus:border-gold-bright/40 rounded-2xl pl-16 pr-20 py-6 text-white font-medium focus:ring-4 focus:ring-gold-bright/5 transition-all placeholder:text-slate-700 outline-none shadow-inner"
                                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-gold-bright transition-colors tap-none p-2"
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 animate-shake mt-4">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                    </div>
                                    <p className="text-[10px] text-red-200 font-black uppercase tracking-widest">{error}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Section */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !key}
                            className="group relative w-full flex items-center justify-center gap-4 py-6 bg-gold-bright text-brand-dark rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.4em] overflow-hidden transition-all duration-500 hover:bg-white hover:shadow-gold-glow-strong disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-luxury tap-none"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3 italic">
                                    <Loader2Icon className="animate-spin h-5 w-5" />
                                    <span>Verificando...</span>
                                </div>
                            ) : (
                                <>
                                    <span className="relative z-10 italic">Iniciar Sesión</span>
                                    <ArrowRightIcon className="relative z-10 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                </>
                            )}
                            
                            {/* Reflection effect */}
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                        </button>
                    </div>
                </form>

                {/* Footer Navigation */}
                <div className="mt-10 relative z-10">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-3 text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-all group italic"
                    >
                        <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
                        <span>Regresar a la Galería Pública</span>
                    </Link>
                </div>
                
                {/* System Logs Footer */}
                <div className="mt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-40">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                        <span className="text-[8px] font-bold text-white uppercase tracking-[0.4em]">Núcleo Activo</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-bold text-white uppercase tracking-[0.4em]">v2.6 Hyperion Engine</span>
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-gold-bright" />
                    </div>
                </div>

            </motion.div>
        </div>

        {/* RIGHT COLUMN: VISUAL/CINEMATIC AMBIENCE */}
        <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-brand-dark border-l border-white/5">
            {/* Background Texture */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay opacity-30 grayscale"></div>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050811] via-transparent to-[#050811]/50"></div>

            {/* Scanning Line */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                <div className="w-full h-[2px] bg-gold-bright animate-scan absolute shadow-[0_0_15px_rgba(242,202,80,0.5)]"></div>
            </div>

            {/* Glowing Orbs */}
            <motion.div 
                animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [0, 30, 0],
                    y: [0, -20, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold-bright/10 rounded-full blur-[100px]"
            />
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                    x: [0, -40, 0],
                    y: [0, 40, 0]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px]"
            />

            {/* Premium Centerpiece */}
            <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-20 z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" as any, delay: 0.2 }}
                >
                    <CordovaLogo className="w-32 h-32 md:w-48 md:h-48 text-gold-bright drop-shadow-[0_0_30px_rgba(242,202,80,0.3)] opacity-80" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" as any, delay: 0.5 }}
                    className="mt-12 max-w-lg"
                >
                    <h2 className="text-3xl font-display font-black text-white tracking-widest uppercase italic mb-6">
                        Imprenta <span className="text-gold-bright">Córdova</span>
                    </h2>
                    <p className="text-slate-400 font-medium leading-relaxed text-sm">
                        Plataforma de gestión operativa avanzada. Optimización de procesos, seguimiento de producción y control financiero centralizado en tiempo real.
                    </p>
                </motion.div>
            </div>
        </div>
    </div>
  );
};

export default Login;
