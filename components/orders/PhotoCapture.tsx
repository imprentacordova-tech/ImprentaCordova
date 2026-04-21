
import React, { useState, useCallback, useRef } from 'react';
import { 
    CameraIcon, CloudArrowUpIcon, XMarkIcon, 
    CheckCircleIcon, SparklesIcon, Loader2Icon 
} from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoCaptureProps {
    onImageCaptured: (file: File | null) => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onImageCaptured }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) return;
        
        setLoading(true);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
            onImageCaptured(file);
            setLoading(false);
        };
        reader.readAsDataURL(file);
    }, [onImageCaptured]);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const clear = () => {
        setPreview(null);
        onImageCaptured(null);
    };

    return (
        <div className="w-full h-full min-h-[350px]">
            <AnimatePresence mode="wait">
                {!preview ? (
                    <motion.div
                        key="uploader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center gap-8 p-10 cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:bg-liquid-gold group-hover:text-black shadow-inner">
                            <CameraIcon className="w-10 h-10 transition-transform group-hover:rotate-12" />
                        </div>
                        
                        <div className="text-center space-y-3">
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.4em] italic">Captura de Archivo</h3>
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest leading-relaxed max-w-[200px] mx-auto opacity-60">Sincroniza el diseño físico o digital de la misión.</p>
                        </div>

                        <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/5 opacity-40 group-hover:opacity-100 transition-opacity">
                            <CloudArrowUpIcon className="w-4 h-4 text-liquid-gold" />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Subir Documento</span>
                        </div>

                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={onFileSelect}
                            accept="image/*"
                            className="hidden"
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative h-full w-full rounded-[2.5rem] overflow-hidden border border-liquid-gold/30 shadow-gold-glow group"
                    >
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                        
                        <div className="absolute top-6 right-6 flex items-center gap-4">
                            <div className="px-4 py-2 bg-liquid-gold rounded-xl flex items-center gap-2 shadow-gold-glow">
                                <CheckCircleIcon className="w-4 h-4 text-black" />
                                <span className="text-[9px] font-black uppercase text-black tracking-widest">Registrada</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); clear(); }}
                                className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-red-500 transition-all"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="absolute bottom-8 left-0 right-0 px-10">
                            <div className="flex items-center gap-4 text-liquid-gold/60">
                                <SparklesIcon className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Imagen en Memoria</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-[2.5rem]">
                    <Loader2Icon className="w-12 h-12 text-liquid-gold animate-spin" />
                </div>
            )}
        </div>
    );
};

export default PhotoCapture;
