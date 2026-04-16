
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { User } from '../types';
import { getUsers } from '../services/mockApi';
import { CordovaLogo, UsersIcon, ArrowRightIcon, ShieldCheckIcon, ArrowLeftIcon, Loader2Icon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '../components/Icons';

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
      await new Promise(resolve => setTimeout(resolve, 1500)); // Delay más largo para sensación de "desbloqueo"

      const users = await getUsers();
      const validUser = users.find(u => u.nombre.toLowerCase() === key.toLowerCase() && u.estado === 'Activo');

      if (validUser) {
        if (validUser.requirePassword) {
            if (validUser.password === password) {
                onLoginSuccess(validUser, remember);
                navigate('/dashboard');
            } else {
                setError("Acceso denegado: Signature mismatch");
                setLoading(false);
            }
        } else {
            onLoginSuccess(validUser, remember);
            navigate('/dashboard');
        }
      } else {
        setError("Identidad no reconocida en el sistema");
        setKey('');
        setPassword('');
        setLoading(false);
      }
    } catch (err) {
      setError("Error de conexión con la base de datos");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark relative overflow-hidden font-sans selection:bg-liquid-gold selection:text-brand-dark">
        {/* Cinematic Background Elements */}
        <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay opacity-20 grayscale"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-liquid-gold/30 to-transparent"></div>
            
            {/* Moving Light Blobs */}
            <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-liquid-gold/5 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-brand-dark/50 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-xl px-6 lg:px-0 animate-fade-in-up">
            <div className="bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[4rem] p-12 lg:p-20 shadow-luxury transition-all duration-700 hover:border-liquid-gold/20">
                
                {/* Brand / Title */}
                <div className="text-center mb-16 space-y-6">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-brand-dark border border-white/5 mb-6 group-hover:border-liquid-gold/40 transition-all shadow-xl">
                        <CordovaLogo className="h-12 w-12 object-contain" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase italic">
                            CÓRDOVA <span className="text-gold-gradient">SYSTEMS</span>
                        </h1>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">
                            Acceso seguro al panel operativo
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-10">
                    <div className="space-y-8">
                        {/* Key Identification */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-6 italic">Identificación</label>
                            <div className="relative group">
                                <UsersIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                                <input
                                    type="text"
                                    required
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="input-atelier w-full pl-16 pr-6 py-6"
                                    placeholder="Nombre del operador"
                                />
                            </div>
                        </div>

                        {/* Security Signature */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-6 italic">Contraseña</label>
                            <div className="relative group">
                                <ShieldCheckIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-atelier w-full pl-16 pr-20 py-6"
                                    placeholder="••••••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-liquid-gold transition-colors"
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Errors */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-3xl flex items-center gap-4 animate-shake">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                            <p className="text-xs text-red-200 font-bold uppercase tracking-wider">{error}</p>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        type="submit"
                        disabled={loading || !key}
                        className="group relative w-full flex items-center justify-center gap-4 py-8 bg-white text-brand-dark rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] overflow-hidden transition-all duration-700 hover:bg-liquid-gold hover:shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center gap-3">
                                <Loader2Icon className="animate-spin h-5 w-5" />
                                <span>Verificando Autenticidad...</span>
                            </div>
                        ) : (
                            <>
                                <span className="relative z-10">Ingresar al Sistema</span>
                                <ArrowRightIcon className="relative z-10 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Exterior Link */}
                <div className="mt-12 text-center">
                    <Link 
                        to="/" 
                        className="text-[9px] font-black text-slate-500 hover:text-liquid-gold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group"
                    >
                        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                        Regresar a la Galería Pública
                    </Link>
                </div>
            </div>

            {/* Terminal Footprint */}
            <div className="mt-12 flex justify-between px-10 items-center animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.5em]">Terminal Secura: {new Date().getHours()}:{new Date().getMinutes()}</span>
                </div>
                <div className="h-[1px] w-20 bg-white/10"></div>
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.5em]">v2.5 Atelier Engine</span>
            </div>
        </div>
    </div>
  );
};

export default Login;
