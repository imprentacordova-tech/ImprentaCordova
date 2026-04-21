
import React, { useCallback, useState } from 'react';
import { 
    CloudArrowUpIcon, XMarkIcon, PhotoIcon, 
    SparklesIcon, CheckCircleIcon 
} from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploaderProps {
    onImageSelect: (file: File | null) => void;
    currentImage?: File | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, currentImage }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback((file: File) => {
        if (file && file.type.startsWith('image/')) {
            onImageSelect(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [onImageSelect]);

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const clearImage = () => {
        setPreview(null);
        onImageSelect(null);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
                {!preview ? (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={onDrop}
                        className={`relative aspect-video rounded-[3rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-6 group overflow-hidden ${
                            isDragging 
                            ? 'border-liquid-gold bg-liquid-gold/10' 
                            : 'border-white/10 bg-white/5 hover:border-liquid-gold/30 hover:bg-white/[0.07]'
                        }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-none" />
                        
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isDragging ? 'bg-liquid-gold text-black scale-110' : 'bg-white/5 text-slate-500 group-hover:scale-110 group-hover:bg-liquid-gold group-hover:text-black'
                        }`}>
                            <CloudArrowUpIcon className="w-10 h-10" />
                        </div>

                        <div className="text-center relative z-10 px-6">
                            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Arrastra el diseño aquí</h3>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest italic">O haz clic para explorar tus archivos</p>
                        </div>

                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={onFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />

                        <div className="absolute bottom-6 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
                            <SparklesIcon className="w-3 h-3 text-liquid-gold" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">JPG, PNG o WEBP (Máx 10MB)</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-video rounded-[3rem] overflow-hidden border border-liquid-gold/30 shadow-gold-glow group"
                    >
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                        
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                            <div className="px-4 py-2 bg-liquid-gold rounded-full flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-black" />
                                <span className="text-[10px] font-black uppercase text-black tracking-tight">Imagen Lista</span>
                            </div>
                            <button
                                onClick={clearImage}
                                className="w-10 h-10 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full px-12 text-center">
                            <p className="text-white font-black uppercase text-sm tracking-tighter truncate mb-1">{currentImage?.name}</p>
                            <p className="text-liquid-gold/60 font-black uppercase text-[9px] tracking-widest">
                                {Math.round((currentImage?.size || 0) / 1024)} KB
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ImageUploader;
