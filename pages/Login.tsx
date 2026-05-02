
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
    <div className="min-h-screen flex bg-brand-light relative overflow-hidden font-sans selection:bg-brand-blue/20 selection:text-brand-blue">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white skew-x-[-15deg] translate-x-1/4 z-0 border-l border-slate-100 hidden lg:block" />
        
        {/* LEFT COLUMN: FORM */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center relative z-10 px-6 md:px-16 lg:px-24">
            
            <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-full max-w-[480px] mx-auto"
            >
                {/* Header Content */}
                <div className="mb-12 space-y-6">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-200 mb-2 shadow-sm relative group"
                    >
                        <div className="absolute inset-0 bg-brand-blue/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CordovaLogo className="h-8 w-8 text-brand-blue relative z-10" />
                    </motion.div>
                    
                    <div className="space-y-3">
                        <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-[-0.04em] uppercase italic leading-none">
                            IMPRENTA <br/>
                            <span className="text-brand-blue not-italic font-editorial font-normal">CÓRDOVA</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="h-[1px] w-8 bg-brand-blue/20"></div>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">
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
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic transition-colors group-focus-within:text-brand-blue">ID de Operador</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors">
                                    <UsersIcon className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-brand-blue/40 rounded-2xl pl-16 pr-6 py-6 text-slate-900 font-medium focus:ring-4 focus:ring-brand-blue/5 transition-all placeholder:text-slate-300 outline-none shadow-sm"
                                    placeholder="Ingrese identificador..."
                                />
                            </div>
                        </div>

                        {/* Signature Input */}
                        <div className="space-y-3 group">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 italic transition-colors group-focus-within:text-brand-blue">Firma de Seguridad</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors">
                                    <LockIcon className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white border border-slate-200 focus:border-brand-blue/40 rounded-2xl pl-16 pr-20 py-6 text-slate-900 font-medium focus:ring-4 focus:ring-brand-blue/5 transition-all placeholder:text-slate-300 outline-none shadow-sm"
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors tap-none p-2"
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
                                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4 animate-shake mt-4">
                                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                        <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                    </div>
                                    <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">{error}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Section */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !key}
                            className="group relative w-full flex items-center justify-center gap-4 py-6 bg-brand-blue text-white rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.4em] overflow-hidden transition-all duration-500 hover:bg-slate-900 hover:shadow-xl hover:shadow-brand-blue/10 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed tap-none"
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
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                        </button>
                    </div>
                </form>

                {/* Footer Navigation */}
                <div className="mt-10 relative z-10">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-3 text-[9px] font-black text-slate-400 hover:text-brand-blue uppercase tracking-[0.2em] transition-all group italic"
                    >
                        <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
                        <span>Regresar a la Galería Pública</span>
                    </Link>
                </div>
                
                {/* System Logs Footer */}
                <div className="mt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em]">Núcleo Activo • IMPRENTA CÓRDOVA</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em]">v3.0 Precision Engine</span>
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-brand-blue" />
                    </div>
                </div>

            </motion.div>
        </div>

        {/* RIGHT COLUMN: VISUAL/CINEMATIC AMBIENCE */}
        <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-white">
            {/* Background Image - Luxury Print Texture */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586075010633-247fe3462947?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 grayscale"></div>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-l from-white via-white/50 to-transparent"></div>

            {/* Premium Centerpiece */}
            <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-20 z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-brand-blue/10 blur-[60px] rounded-full scale-150"></div>
                    <CordovaLogo className="w-32 h-32 md:w-48 md:h-48 text-brand-blue relative z-10" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    className="mt-12 max-w-lg"
                >
                    <h2 className="text-3xl font-display font-black text-slate-900 tracking-[-0.04em] uppercase italic mb-6">
                        GESTIÓN <span className="text-brand-blue">PREFERENCIAL</span>
                    </h2>
                    <p className="text-slate-500 font-medium leading-relaxed text-sm">
                        Plataforma de alta fidelidad para la gestión de artes gráficas. 
                        Eficiencia operativa bajo estándares de lujo y precisión técnica.
                    </p>
                </motion.div>
            </div>

            {/* Subtle floating labels/dots to reinforce the tech-minimalist look */}
            <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-brand-blue/20 animate-ping"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse"></div>
        </div>
    </div>
  );
};

export default Login;
