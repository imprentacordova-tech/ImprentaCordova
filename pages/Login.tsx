
import React, { useState, useEffect } from 'react';
import { APP_NAME, UI_TEXT } from '../constants';
import { User } from '../types';
import { getUsers } from '../services/mockApi';
import { CordovaLogo, UsersIcon, CheckCircleIcon, ArrowRightIcon, ShieldCheckIcon } from '../components/Icons';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [key, setKey] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
      const savedUser = localStorage.getItem('rememberedUser');
      if (savedUser) {
          setKey(savedUser);
          setRememberMe(true);
      }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate slight network delay for better UX feel
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = await getUsers();
    const validUser = users.find(u => u.nombre.toLowerCase() === key.toLowerCase() && u.estado === 'Activo');

    if (validUser) {
      if (validUser.requirePassword) {
          if (validUser.password === password) {
              if (rememberMe) localStorage.setItem('rememberedUser', key);
              else localStorage.removeItem('rememberedUser');
              onLoginSuccess(validUser);
          } else {
              setError("Contraseña incorrecta");
              setLoading(false);
          }
      } else {
          // No password required for this user
          if (rememberMe) localStorage.setItem('rememberedUser', key);
          else localStorage.removeItem('rememberedUser');
          onLoginSuccess(validUser);
      }
    } else {
      setError("Usuario no encontrado o inactivo");
      setKey('');
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden font-sans">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1562564055-71e051d33c19?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                alt="Imprenta Background" 
                className="w-full h-full object-cover opacity-20 filter blur-sm scale-105 animate-pulse-slow"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/90 via-slate-900/95 to-slate-900/90"></div>
        </div>
        
        {/* Content */}
        <div className="w-full max-w-md p-6 z-10 relative">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 animate-slide-in-up">
                
                {/* Header */}
                <div className="p-8 pb-6 text-center">
                    <div className="bg-white p-4 rounded-2xl shadow-lg inline-block mb-6 transform hover:scale-105 transition-transform duration-300">
                        <CordovaLogo className="h-16 w-16 text-brand-blue" />
                    </div>
                    
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-md">
                        {APP_NAME}
                    </h1>
                    <p className="text-blue-200 text-sm font-medium tracking-wide uppercase opacity-80">
                        Sistema de Gestión Interna
                    </p>
                </div>

                <div className="px-8 pb-10">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label htmlFor="username" className="block text-xs font-bold text-white uppercase tracking-wider ml-1 opacity-90">
                                Usuario
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UsersIcon className="h-5 w-5 text-blue-300 group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent focus:bg-slate-800 transition-all duration-300 shadow-inner"
                                    placeholder="Ej. Pedro"
                                    autoFocus
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-xs font-bold text-white uppercase tracking-wider ml-1 opacity-90">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <ShieldCheckIcon className="h-5 w-5 text-blue-300 group-focus-within:text-white transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent focus:bg-slate-800 transition-all duration-300 shadow-inner"
                                    placeholder="••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 rounded bg-slate-800/50 border-slate-600 cursor-pointer"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-xs text-blue-200 cursor-pointer select-none">
                                Recordarme en este dispositivo
                            </label>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center animate-fade-in backdrop-blur-sm">
                                <div className="bg-red-500 rounded-full p-1 mr-3 flex-shrink-0">
                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <p className="text-sm text-red-200 font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !key}
                            className={`w-full group relative flex justify-center py-4 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-blue transition-all duration-300 uppercase tracking-widest shadow-lg shadow-blue-900/50 overflow-hidden ${loading ? 'cursor-wait opacity-90' : 'hover:-translate-y-1 hover:shadow-xl'}`}
                        >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verificando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Acceder al Sistema <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </span>
                            )}
                        </button>
                    </form>
                </div>
                
                {/* Footer */}
                <div className="px-8 py-5 bg-slate-950/30 border-t border-white/5 text-center backdrop-blur-sm">
                    <p className="text-xs text-slate-400 font-medium">
                        &copy; 2025 Imprenta Córdova v3.0
                    </p>
                </div>
            </div>
            
            <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
                 <a href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-medium opacity-70 hover:opacity-100 group">
                    <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Volver a la Tienda Virtual
                </a>
            </div>
        </div>
    </div>
  );
};

export default Login;
