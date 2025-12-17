import React, { ErrorInfo, ReactNode } from "react";
import { ExclamationTriangleIcon, Loader2Icon, DashboardIcon } from "./Icons";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white p-6 text-center font-sans">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-blue via-brand-red to-orange-500"></div>
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">¡Ups! Algo salió mal.</h1>
            <p className="text-slate-500 dark:text-gray-400 mb-6 text-sm leading-relaxed">
              La aplicación ha encontrado un error inesperado. Por favor recarga la página.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-800 transition-all shadow-lg">
                <Loader2Icon className="w-4 h-4" /> Recargar
              </button>
              <button onClick={() => { window.location.href = '/'; }} className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                <DashboardIcon className="w-4 h-4" /> Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
