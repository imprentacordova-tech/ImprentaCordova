
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './Icons';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
                    />
                    
                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0c1324] border-t border-slate-200 dark:border-white/10 rounded-t-[2.5rem] z-[101] lg:hidden max-h-[90vh] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.3)]"
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2">
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full" />
                        </div>
                        
                        {/* Header */}
                        <div className="px-8 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/5">
                            <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-widest italic">
                                {title}
                            </h3>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-white transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar pb-24">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
