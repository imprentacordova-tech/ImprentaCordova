
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { CloseIcon, CameraIcon } from './Icons';

interface QRScannerModalProps {
    onClose: () => void;
    onScan: (decodedText: string) => void;
    title?: string;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose, onScan, title = "Escanear Código QR" }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startScanner = async () => {
            try {
                const scanner = new Html5Qrcode("reader");
                scannerRef.current = scanner;

                const config = { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
                };

                await scanner.start(
                    { facingMode: "environment" }, 
                    config,
                    (decodedText) => {
                        onScan(decodedText);
                        handleClose();
                    },
                    (errorMessage) => {
                        // Ignore standard scanning errors to avoid log spam
                    }
                );
            } catch (err) {
                console.error("Error starting scanner:", err);
                setError("No se pudo acceder a la cámara. Verifique los permisos.");
            }
        };

        // Small delay to ensure DOM is ready
        setTimeout(startScanner, 100);

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
                scannerRef.current.clear();
            }
        };
    }, []);

    const handleClose = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (err) {
                console.error("Error stopping scanner", err);
            }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col justify-center items-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl overflow-hidden relative shadow-2xl">
                <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <CameraIcon className="w-5 h-5 text-brand-blue" />
                        {title}
                    </h3>
                    <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="bg-black relative min-h-[300px] flex items-center justify-center">
                    <div id="reader" className="w-full h-full"></div>
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white bg-black/80">
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                <div className="p-4 text-center bg-gray-50 dark:bg-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-300">Apunte la cámara hacia el código QR del documento o producto.</p>
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
