import React, { useEffect, useRef, useState, useCallback } from 'react';
import { C } from '../panelTheme';

interface QrScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDetect: (texto: string) => void;
}

/**
 * QrScannerModal — Escáner de código QR por cámara, sin dependencias.
 * Usa la API nativa `BarcodeDetector` (Chrome / Edge / Android) y `getUserMedia`.
 * En navegadores sin soporte muestra una guía honesta en vez de fallar.
 */
const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onDetect }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [escaneando, setEscaneando] = useState(false);

    const detener = useCallback(() => {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        if (videoRef.current) videoRef.current.srcObject = null;
    }, []);

    useEffect(() => {
        if (!isOpen) { detener(); return; }
        setError(null);
        setEscaneando(false);

        const BarcodeDetectorCls = (window as any).BarcodeDetector;
        if (!BarcodeDetectorCls) {
            setError('Tu navegador no soporta el escáner por cámara (usá Chrome o Edge). Ingresá el N° de orden manualmente.');
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('No se pudo acceder a la cámara. Verificá permisos y que la página esté servida por HTTPS.');
            return;
        }

        const detector = new BarcodeDetectorCls({ formats: ['qr_code'] });
        let activo = true;

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                if (!activo) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => {});
                }
                setEscaneando(true);

                const escanear = async () => {
                    if (!activo || !videoRef.current) return;
                    try {
                        const codes = await detector.detect(videoRef.current);
                        if (codes && codes.length > 0) {
                            const texto = codes[0].rawValue;
                            if (texto) {
                                onDetect(texto);
                                return; // el padre cierra el modal
                            }
                        }
                    } catch {
                        // errores por frame (cámara ocupada, etc.) se ignoran
                    }
                    if (activo) rafRef.current = requestAnimationFrame(escanear);
                };
                rafRef.current = requestAnimationFrame(escanear);
            })
            .catch(() => {
                setError('No se pudo abrir la cámara. Revisá los permisos del navegador.');
            });

        return () => {
            activo = false;
            detener();
        };
    }, [isOpen, detener, onDetect]);

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ position: 'absolute', inset: 0, background: C.scrim, backdropFilter: 'blur(3px)' }} onClick={onClose} />
            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460, background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 24px 60px -20px rgba(10,17,64,.4)' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>📷 Escanear Código QR</div>
                    <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: C.faint, lineHeight: 1 }}>×</button>
                </div>

                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {error ? (
                        <div style={{ padding: 16, background: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: 10, color: C.dangerText, fontSize: 12.5, lineHeight: 1.5 }}>
                            {error}
                        </div>
                    ) : (
                        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '4 / 3' }}>
                            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline autoPlay />
                            {/* Marco de enfoque dorado */}
                            <div style={{ position: 'absolute', inset: '22% 14%', border: `2.5px solid ${C.gold}`, borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.28)' }} />
                        </div>
                    )}
                    {escaneando && !error && (
                        <div style={{ textAlign: 'center', fontSize: 12, color: C.muted }}>
                            Apuntá al código QR del ticket · la detección es automática.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QrScannerModal;
