
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InfoIcon, CloseIcon } from '../components/Icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div 
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-slide-in-up min-w-[300px] max-w-sm backdrop-blur-md
                            ${toast.type === 'success' ? 'bg-white dark:bg-gray-800 border-green-500/50 text-green-700 dark:text-green-400' : ''}
                            ${toast.type === 'error' ? 'bg-white dark:bg-gray-800 border-red-500/50 text-red-700 dark:text-red-400' : ''}
                            ${toast.type === 'warning' ? 'bg-white dark:bg-gray-800 border-yellow-500/50 text-yellow-700 dark:text-yellow-400' : ''}
                            ${toast.type === 'info' ? 'bg-white dark:bg-gray-800 border-blue-500/50 text-blue-700 dark:text-blue-400' : ''}
                        `}
                    >
                        <div className="flex-shrink-0">
                            {toast.type === 'success' && <CheckCircleIcon className="w-6 h-6" />}
                            {toast.type === 'error' && <ExclamationTriangleIcon className="w-6 h-6" />}
                            {toast.type === 'warning' && <ExclamationTriangleIcon className="w-6 h-6" />}
                            {toast.type === 'info' && <InfoIcon className="w-6 h-6" />}
                        </div>
                        <div className="flex-grow text-sm font-medium">{toast.message}</div>
                        <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <CloseIcon className="w-4 h-4 opacity-50 hover:opacity-100" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe ser usado dentro de un ToastProvider');
    }
    return context;
};
