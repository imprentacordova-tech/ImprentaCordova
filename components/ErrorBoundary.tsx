
import React, { ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
    ExclamationTriangleIcon, ArrowPathIcon, ArrowRightIcon,
    ClipboardIcon, CheckCircleIcon, CordovaLogo,
} from './Icons';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
    children?: ReactNode;
    /** Render personalizado cuando hay error — reemplaza la pantalla de fallback */
    fallback?: (error: Error, reset: () => void) => ReactNode;
    /** Si true, muestra el stack trace en desarrollo */
    showStack?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
    copied: boolean;
    recovering: boolean;
}

// ── Fallback UI ───────────────────────────────────────────────────────────────
const ErrorScreen: React.FC<{
    error: Error;
    showStack: boolean;
    onReload: () => void;
    onHome: () => void;
    onCopy: () => void;
    copied: boolean;
    recovering: boolean;
}> = ({ error, showStack, onReload, onHome, onCopy, copied, recovering }) => {
    const isDev = import.meta.env.DEV;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-dark relative overflow-hidden p-6">

            {/* ── Ambient orbs ── */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-brand-red/8 blur-[160px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-liquid-gold/4 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-40 pointer-events-none" />

            {/* ── Card ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-lg"
            >
                {/* Gold top accent */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-red/60 to-transparent rounded-t-[2.5rem]" />

                <div className="bg-white/[0.04] border border-white/8 rounded-[2.5rem] overflow-hidden backdrop-blur-2xl shadow-luxury p-10 space-y-8">

                    {/* Logo + icon */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                                <CordovaLogo className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em]">Sistema Atelier</p>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Imprenta Córdova</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-5 h-5 text-brand-red" />
                        </div>
                    </div>

                    {/* Copy */}
                    <div className="space-y-4">
                        <div>
                            <p className="text-[9px] font-black text-brand-red uppercase tracking-[0.5em] mb-3">Error del Sistema</p>
                            <h1 className="text-3xl font-display font-black text-white tracking-tight leading-tight">
                                Algo salió<br />
                                <span className="text-white/20">de control.</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 text-sm font-light leading-relaxed">
                            El sistema ha encontrado un error inesperado. Tu trabajo está guardado en Supabase — puedes recargar y continuar sin perder datos.
                        </p>
                    </div>

                    {/* Error info pill */}
                    <div className="p-5 bg-black/30 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                                {error.name || 'RuntimeError'}
                            </span>
                            <button
                                onClick={onCopy}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8 text-slate-600 hover:text-white hover:border-white/15 transition-all text-[9px] font-black uppercase tracking-[0.2em]"
                                title="Copiar error al portapapeles"
                            >
                                {copied
                                    ? <><CheckCircleIcon className="w-3 h-3 text-emerald-400" /> Copiado</>
                                    : <><ClipboardIcon className="w-3 h-3" /> Copiar</>
                                }
                            </button>
                        </div>
                        <p className="text-red-400/80 text-xs font-mono leading-relaxed break-all">
                            {error.message || 'Error desconocido. Consulta la consola para más detalles.'}
                        </p>

                        {/* Stack trace — solo en desarrollo */}
                        {isDev && showStack && error.stack && (
                            <details className="group">
                                <summary className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] cursor-pointer hover:text-slate-500 transition-colors mt-2 select-none">
                                    Stack Trace (dev)
                                </summary>
                                <pre className="mt-3 text-[10px] text-slate-600 font-mono whitespace-pre-wrap break-all leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                    {error.stack}
                                </pre>
                            </details>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onReload}
                            disabled={recovering}
                            className="group flex-1 flex items-center justify-center gap-2.5 py-4 bg-liquid-gold text-brand-dark rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] hover:bg-white hover:shadow-gold-glow hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 disabled:cursor-wait active:scale-95"
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${recovering ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            {recovering ? 'Recargando…' : 'Recargar Sistema'}
                        </button>
                        <button
                            onClick={onHome}
                            className="group flex-1 flex items-center justify-center gap-2.5 py-4 bg-white/[0.04] border border-white/8 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] hover:bg-white/8 hover:border-white/15 transition-all duration-300 active:scale-95"
                        >
                            Ir al Inicio
                            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>

                    {/* Info footer */}
                    <p className="text-center text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">
                        Tus datos están seguros · Supabase Cloud · Cifrado E2E
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

// ── ErrorBoundary class ───────────────────────────────────────────────────────
export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError:   false,
        error:      null,
        copied:     false,
        recovering: false,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, info: ErrorInfo) {
        // Log estructurado para debugging
        console.group('%c[ErrorBoundary] Error capturado', 'color:#D4AF37;font-weight:bold');
        console.error('Error:',    error);
        console.error('Stack:',    error.stack);
        console.error('Component:', info.componentStack);
        console.groupEnd();
    }

    private handleReload = () => {
        this.setState({ recovering: true });
        setTimeout(() => window.location.reload(), 600);
    };

    private handleHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    private handleCopy = async () => {
        if (!this.state.error) return;
        const text = [
            `Error: ${this.state.error.name}`,
            `Message: ${this.state.error.message}`,
            `Stack: ${this.state.error.stack ?? 'N/A'}`,
            `Time: ${new Date().toISOString()}`,
        ].join('\n');
        try {
            await navigator.clipboard.writeText(text);
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2500);
        } catch {
            // Clipboard no disponible (contexto inseguro)
            console.warn('[ErrorBoundary] No se pudo copiar al portapapeles');
        }
    };

    public render(): ReactNode {
        const { hasError, error, copied, recovering } = this.state;
        const { children, fallback, showStack = true } = this.props;

        if (hasError && error) {
            // Render personalizado si se provee
            if (fallback) return fallback(error, this.handleReload);

            return (
                <ErrorScreen
                    error={error}
                    showStack={showStack}
                    onReload={this.handleReload}
                    onHome={this.handleHome}
                    onCopy={this.handleCopy}
                    copied={copied}
                    recovering={recovering}
                />
            );
        }

        return children;
    }
}
