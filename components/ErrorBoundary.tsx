import React, { ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
    ExclamationTriangleIcon, ArrowPathIcon,
    ClipboardIcon, CheckCircleIcon,
} from './Icons';
import { C, DISPLAY, MONO, S } from './panelTheme';

interface Props {
    children?: ReactNode;
    fallback?: (error: Error, reset: () => void) => ReactNode;
    showStack?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
    copied: boolean;
    recovering: boolean;
}

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
        <div style={{
            minHeight: '100vh',
            background: C.bg,
            color: C.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Inter',system-ui,sans-serif",
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                style={{
                    width: '100%',
                    maxWidth: 540,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 20,
                    boxShadow: '0 24px 60px -15px rgba(10,17,64,.15)',
                    padding: '32px clamp(20px, 4vw, 36px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                }}
            >
                {/* Brand / Logo + Warning */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg viewBox="0 0 34 34" style={{ width: 32, height: 32 }} aria-hidden="true">
                            <path d="M29.1 10A14 14 0 1 0 29.1 24" fill="none" stroke={C.royal} strokeWidth="6.2" strokeLinecap="round" />
                            <path d="M10.6 10.4h9v2.9h-3v7.4h3v2.9h-9v-2.9h3v-7.4h-3z" fill="#E70101" stroke={C.gold} strokeWidth="1.7" strokeLinejoin="round" />
                        </svg>
                        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
                            <span style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, color: C.ink }}>
                                CÓRDOVA<span style={{ color: C.gold }}>.</span>
                            </span>
                            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.24em', textTransform: 'uppercase', color: C.faint }}>
                                Control de Resiliencia
                            </span>
                        </span>
                    </div>
                    <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: C.dangerBg,
                        border: `1px solid ${C.dangerBorder}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: C.dangerText,
                    }}>
                        <ExclamationTriangleIcon className="w-5 h-5" />
                    </div>
                </div>

                {/* Main Message */}
                <div>
                    <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: C.dangerText }}>
                        Incidencia de Ejecución
                    </span>
                    <h1 style={{ ...S.h1, fontSize: 24, marginTop: 4 }}>
                        Algo no salió como se esperaba
                    </h1>
                    <p style={{ ...S.lead, fontSize: 13, marginTop: 6 }}>
                        <b>Tranquilidad:</b> Ninguna orden ni abono registrado en Supabase se ha perdido. Puedes recargar para continuar con la sesión.
                    </p>
                </div>

                {/* Diagnostic Details */}
                <div style={{
                    padding: '14px 16px',
                    background: C.surfaceAlt,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.muted }}>
                            {error.name || 'Error en tiempo de ejecución'}
                        </span>
                        <button
                            type="button"
                            onClick={onCopy}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '4px 8px',
                                background: '#FFFFFF',
                                border: `1px solid ${C.borderStrong}`,
                                borderRadius: 6,
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: C.royal,
                                cursor: 'pointer',
                            }}
                        >
                            {copied ? <><CheckCircleIcon className="w-3 h-3" /> Copiado</> : <><ClipboardIcon className="w-3 h-3" /> Copiar Diagnóstico</>}
                        </button>
                    </div>
                    <p style={{
                        margin: 0,
                        fontFamily: MONO,
                        fontSize: 12,
                        color: C.dangerText,
                        wordBreak: 'break-all',
                        lineHeight: 1.5,
                    }}>
                        {error.message || 'Error no especificado en el componente.'}
                    </p>

                    {isDev && showStack && error.stack && (
                        <details style={{ marginTop: 6 }}>
                            <summary style={{ fontSize: 10, fontWeight: 700, color: C.faint, cursor: 'pointer' }}>
                                Ver Stack Trace (Desarrollo)
                            </summary>
                            <pre style={{
                                marginTop: 6,
                                padding: 8,
                                background: '#FFFFFF',
                                border: `1px solid ${C.border}`,
                                borderRadius: 6,
                                fontSize: 10,
                                fontFamily: MONO,
                                color: C.muted,
                                maxHeight: 120,
                                overflowY: 'auto',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                            }}>
                                {error.stack}
                            </pre>
                        </details>
                    )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={onHome}
                        style={{ ...S.softBtn, padding: '10px 16px' }}
                    >
                        Ir al Inicio
                    </button>
                    <button
                        type="button"
                        onClick={onReload}
                        disabled={recovering}
                        style={{ ...S.primaryBtn, padding: '10px 18px' }}
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${recovering ? 'animate-spin' : ''}`} />
                        {recovering ? 'Recargando…' : 'Recargar Pantalla'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, copied: false, recovering: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, copied: false, recovering: false };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Capturado:', error, errorInfo);
    }

    handleReload = () => {
        this.setState({ recovering: true });
        setTimeout(() => window.location.reload(), 200);
    };

    handleHome = () => {
        window.location.href = '/#/dashboard';
    };

    handleCopy = () => {
        const text = `Imprenta Cordova Error:\n${this.state.error?.name}: ${this.state.error?.message}\n${this.state.error?.stack || ''}`;
        navigator.clipboard.writeText(text);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
    };

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback(this.state.error, () => this.setState({ hasError: false, error: null }));
            }
            return (
                <ErrorScreen
                    error={this.state.error}
                    showStack={this.props.showStack ?? true}
                    onReload={this.handleReload}
                    onHome={this.handleHome}
                    onCopy={this.handleCopy}
                    copied={this.state.copied}
                    recovering={this.state.recovering}
                />
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
