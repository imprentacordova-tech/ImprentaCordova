import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CordovaLogo, UsersIcon, ArrowRightIcon, ShieldCheckIcon, ArrowLeftIcon, Loader2Icon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, LockIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      const result = await login(key, password);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'IDENTIDAD NO RECONOCIDA');
      }
    } catch (err) {
      console.error(err);
      setError("FALLO CRITICO: ERROR DE CONEXION");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#020617] text-white relative overflow-hidden font-sans selection:bg-liquid-gold/20 selection:text-liquid-gold">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#0c1324]/40 backdrop-blur-md skew-x-[-15deg] translate-x-1/4 z-0 border-l border-white/5 hidden lg:block" />
        
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
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-2 shadow-luxury relative group"
                    >
                        <div className="absolute inset-0 bg-liquid-gold/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CordovaLogo className="h-8 w-8 relative z-10 invert brightness-0" />
                    </motion.div>
                    
                    <div className="space-y-3">
                        <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-[-0.04em] uppercase leading-none">
                            IMPRENTA<br/>
                            <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA7C11] bg-clip-text text-transparent font-black">CORDOVA</span>
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-[2px] bg-liquid-gold shadow-gold-glow"></div>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                                Precision Management Center
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Identity Form */}
                <form onSubmit={handleLogin} className="space-y-8 relative">
                    <div className="space-y-6">
                        {/* Operator Input */}
                        <div className="space-y-3 group">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-liquid-gold">ID de Operador</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-liquid-gold transition-colors">
                                    <UsersIcon className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 focus:border-liquid-gold/40 rounded-2xl pl-16 pr-6 py-6 text-white font-medium focus:ring-4 focus:ring-liquid-gold/5 transition-all placeholder:text-slate-600 outline-none shadow-luxury"
                                    placeholder="Ingrese identificador..."
                                />
                            </div>
                        </div>

                        {/* Signature Input */}
                        <div className="space-y-3 group">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2 transition-colors group-focus-within:text-liquid-gold">Firma de Seguridad</label>
                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-liquid-gold transition-colors">
                                    <LockIcon className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 focus:border-liquid-gold/40 rounded-2xl pl-16 pr-20 py-6 text-white font-medium focus:ring-4 focus:ring-liquid-gold/5 transition-all placeholder:text-slate-600 outline-none shadow-luxury"
                                    placeholder="Contrasena..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-liquid-gold transition-colors tap-none p-2"
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
                                <div className="bg-brand-red/10 border border-brand-red/20 p-4 rounded-2xl flex items-center gap-4 animate-shake mt-4">
                                    <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center flex-shrink-0">
                                        <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />
                                    </div>
                                    <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">{error}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Section */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !key}
                            className="group relative w-full flex items-center justify-center gap-4 py-6 bg-liquid-gold text-slate-950 rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.4em] overflow-hidden transition-all duration-500 hover:bg-white hover:shadow-xl hover:shadow-liquid-gold/10 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed tap-none shadow-gold-glow"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                    <span className="relative z-10">Verificando...</span>
                                </div>
                            ) : (
                                <>
                                    <span className="relative z-10">Iniciar Sesion</span>
                                    <ArrowRightIcon className="relative z-10 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                </>
                            )}
                            
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                        </button>
                    </div>
                </form>

                {/* Footer Navigation */}
                <div className="mt-10 relative z-10">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-3 text-[9px] font-black text-slate-500 hover:text-liquid-gold uppercase tracking-[0.2em] transition-all group"
                    >
                        <ArrowLeftIcon className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
                        <span>Regresar a la Galeria Publica</span>
                    </Link>
                </div>
                
                {/* System Logs Footer */}
                <div className="mt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-liquid-gold animate-pulse shadow-gold-glow" />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.4em]">Nucleo Activo - IMPRENTA CORDOVA</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.4em]">v3.0 Precision Engine</span>
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-liquid-gold" />
                    </div>
                </div>

            </motion.div>
        </div>

        {/* RIGHT COLUMN: VISUAL/CINEMATIC AMBIENCE */}
        <div className="hidden lg:block lg:w-[55%] relative overflow-hidden bg-[#0c1324]/30 border-l border-white/5">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586075010633-247fe3462947?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-5 grayscale invert"></div>
            <div className="absolute inset-0 bg-gradient-to-l from-[#020617] via-[#020617]/40 to-transparent"></div>

            <div className="absolute inset-0 flex items-center justify-center flex-col text-center p-20 z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-liquid-gold/5 blur-[80px] rounded-full scale-150"></div>
                    <CordovaLogo className="w-32 h-32 md:w-48 md:h-48 relative z-10 invert brightness-0" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    className="mt-12 max-w-lg"
                >
                    <h2 className="text-3xl font-display font-black text-white tracking-[-0.04em] uppercase mb-6">
                        GESTION <span className="text-liquid-gold">PREFERENCIAL</span>
                    </h2>
                    <p className="text-slate-400 font-medium leading-relaxed text-sm">
                        Plataforma de alta fidelidad para la gestion de artes graficas. 
                        Eficiencia operativa bajo estandares de lujo y precision tecnica.
                    </p>
                </motion.div>
            </div>

            <div className="absolute top-1/4 right-1/4 w-2 h-2 rounded-full bg-liquid-gold/20 animate-ping"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse"></div>
        </div>
    </div>
  );
};

export default Login;
