
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { User } from '../types';
import { getUsers } from '../services/mockApi';
import { CordovaLogo, UsersIcon, ArrowRightIcon, ShieldCheckIcon, ArrowLeftIcon, Loader2Icon, EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from '../components/Icons';

interface LoginProps {
  onLoginSuccess: (user: User, remember: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
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
    
    // Simulate slight network delay for better UX feel
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = await getUsers();
    const validUser = users.find(u => u.nombre.toLowerCase() === key.toLowerCase() && u.estado === 'Activo');

    if (validUser) {
      if (validUser.requirePassword) {
          if (validUser.password === password) {
              onLoginSuccess(validUser, remember);
          } else {
              setError("Contraseña incorrecta");
              setLoading(false);
          }
      } else {
          // No password required for this user
          onLoginSuccess(validUser, remember);
      }
    } else {
      setError("Usuario no encontrado o inactivo");
      setKey('');
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900 font-sans selection:bg-brand-blue selection:text-white">
        {/* --- LEFT COLUMN: FORM --- */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 xl:p-24 relative">
            
            <div className="w-full max-w-sm mx-auto space-y-8">
                {/* Header */}
                <div className="text-center lg:text-left">
                    <div className="inline-block p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 mb-6">
                        <CordovaLogo className="h-10 w-10 object-contain" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                        Bienvenido
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                        Ingresa tus credenciales para acceder al panel de control de <span className="font-semibold text-brand-blue">{APP_NAME}</span>.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                    
                    <div className="space-y-5">
                        {/* Username */}
                        <div className="group">
                            <label htmlFor="username" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors group-focus-within:text-brand-blue">
                                Usuario
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <UsersIcon className="h-5 w-5 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm"
                                    placeholder=""
                                    autoFocus
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="group">
                            <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 transition-colors group-focus-within:text-brand-blue">
                                Contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <ShieldCheckIcon className="h-5 w-5 text-slate-400 group-focus-within:text-brand-blue transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm"
                                    placeholder="••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Options & Error */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer group">
                                <div className="relative">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-brand-blue"></div>
                                </div>
                                <span className="ml-3 text-sm text-slate-600 dark:text-slate-400 font-medium group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                                    Recordarme
                                </span>
                            </label>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-center animate-bounce-in">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                                <p className="text-sm text-red-600 dark:text-red-300 font-semibold">
                                    {error}
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !key}
                        className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-base font-bold text-white bg-brand-blue hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${loading ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                        {loading ? (
                            <>
                                <Loader2Icon className="animate-spin h-5 w-5 mr-2" />
                                Iniciando sesión...
                            </>
                        ) : (
                            <>
                                Ingresar
                                <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer Link */}
                <div className="text-center lg:text-left mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-blue transition-colors group"
                    >
                        <ArrowLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                        Volver a la Tienda
                    </Link>
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: VISUAL --- */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-slate-900">
            <div className="absolute inset-0 z-0">
                <img 
                    src="https://images.unsplash.com/photo-1562564055-71e051d33c19?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                    alt="Offset Printing Press" 
                    className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
            </div>
            {/* Artistic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue via-blue-900 to-slate-900 opacity-90 mix-blend-multiply"></div>
            
            {/* Decorative Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-brand-blue/30 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

            {/* Text Overlay */}
            <div className="absolute bottom-0 left-0 p-16 z-10 w-full">
                <div className="h-1 w-20 bg-brand-red mb-6 rounded-full"></div>
                <h2 className="text-4xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
                    Excelencia en cada impresión.
                </h2>
                <p className="text-lg text-blue-100 font-light max-w-lg leading-relaxed mb-8">
                    Gestiona tu producción, clientes y finanzas con la tecnología más avanzada del mercado gráfico.
                </p>
                <div className="flex items-center gap-4 text-sm font-bold text-white/60 uppercase tracking-widest">
                    <span>Producción</span>
                    <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                    <span>Diseño</span>
                    <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                    <span>Logística</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;
