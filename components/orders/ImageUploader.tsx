
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
        <div className="max-w-2xl mx-auto w-full">
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
                        className={`relative aspect-video rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center gap-6 group overflow-hidden ${
                            isDragging 
                            ? 'border-brand-blue bg-brand-blue/5' 
                            : 'border-slate-100 bg-slate-50 hover:border-brand-blue/30 hover:bg-white'
                        }`}
                    >
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                            isDragging ? 'bg-brand-blue text-white scale-110' : 'bg-white text-slate-400 group-hover:scale-110 group-hover:bg-brand-blue group-hover:text-white'
                        }`}>
                            <CloudArrowUpIcon className="w-12 h-12" />
                        </div>

                        <div className="text-center relative z-10 px-6">
                            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Vincular Diseño Digital</h3>
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">O haz clic para explorar archivos</p>
                        </div>

                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={onFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />

                        <div className="absolute bottom-8 flex items-center gap-3 px-6 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
                            <SparklesIcon className="w-4 h-4 text-brand-blue" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">FORMATOS_VALORES: JPG, PNG, WEBP</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-video rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-xl group bg-white"
                    >
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className="w-full h-full object-cover transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                        
                        <div className="absolute top-8 left-8 right-8 flex justify-between items-start">
                            <div className="px-6 py-3 bg-brand-blue rounded-2xl flex items-center gap-3 shadow-lg">
                                <CheckCircleIcon className="w-5 h-5 text-white" />
                                <span className="text-[10px] font-black uppercase text-white tracking-[0.1em]">ACTIVO_EN_COLA</span>
                            </div>
                            <button
                                onClick={clearImage}
                                className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-all shadow-lg active:scale-90"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full px-12 text-center">
                            <p className="text-white font-black uppercase text-sm tracking-tight truncate drop-shadow-md mb-1">{currentImage?.name}</p>
                            <p className="text-white/80 font-black uppercase text-[10px] tracking-[0.4em]">
                                {Math.round((currentImage?.size || 0) / 1024)} KB_DATA
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ImageUploader;
