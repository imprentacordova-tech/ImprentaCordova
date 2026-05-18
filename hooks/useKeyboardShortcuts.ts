import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignorar si el usuario está escribiendo en un input, textarea o select
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            // Usamos Alt + tecla para navegación rápida (o Ctrl + tecla)
            // Alt + N: Nueva Orden
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                navigate('/nuevo');
            }
            // Alt + D: Dashboard
            else if (e.altKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                navigate('/dashboard');
            }
            // Alt + C: Clientes
            else if (e.altKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                navigate('/clientes');
            }
            // Alt + I: Inventario
            else if (e.altKey && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                navigate('/inventario');
            }
            // Alt + R: Retiros / Entregas
            else if (e.altKey && e.key.toLowerCase() === 'r') {
                e.preventDefault();
                navigate('/retiros');
            }
            // Alt + T: Trabajos / Misiones Activas
            else if (e.altKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                navigate('/trabajos');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);
};
