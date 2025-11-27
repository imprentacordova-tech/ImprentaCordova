import React, { useState } from 'react';
import { APP_NAME, UI_TEXT } from '../constants';
import { User } from '../types';
import { getUsers } from '../services/mockApi';
import { CordovaLogo, UsersIcon } from '../components/Icons';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate network delay for better UX feel
    await new Promise(resolve => setTimeout(resolve, 600));

    const users = await getUsers();
    const validUser = users.find(u => u.nombre.toLowerCase() === key.toLowerCase() && u.estado === 'Activo');

    if (validUser) {
      onLoginSuccess(validUser);
    } else {
      setError("Credenciales incorrectas o usuario inactivo.");
      setKey('');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden font-sans">
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/90 to-gray-950 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>
        
        {/* Content */}
        <div className="w-full max-w-md p-4 z-10 animate-slide-in-up">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-8 sm:p-10">
                    <div className="flex justify-center mb-6">
                        <div className="bg-gray-50 p-4 rounded-full shadow-inner border border-gray-100">
                            <CordovaLogo className="h-16 w-16 text-brand-blue" />
                        </div>
                    </div>
                    
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                            {APP_NAME}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                            {UI_TEXT.LOGIN_TITLE}
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="sr-only">Usuario</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UsersIcon className="h-5 w-5 text-gray-400 group-focus-within:text-brand-blue transition-colors" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:bg-white transition-all duration-200 sm:text-sm"
                                    placeholder="Ingrese su usuario"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r animate-fade-in">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700 font-bold">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-brand-blue hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-all duration-200 uppercase tracking-wider transform active:scale-95 ${loading ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Accediendo...
                                </span>
                            ) : UI_TEXT.LOGIN_BUTTON}
                        </button>
                    </form>
                </div>
                <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        Sistema de Gestión v2.5 &copy; 2025
                    </p>
                </div>
            </div>
            <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                 <a href="/" className="inline-flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors font-medium border-b border-transparent hover:border-white pb-0.5 opacity-70 hover:opacity-100">
                    <span>&larr;</span> Volver a la Tienda Virtual
                </a>
            </div>
        </div>
    </div>
  );
};

export default Login;