
import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { 
    SearchIcon, BoxIcon, ShieldCheckIcon, 
    ArrowRightIcon, CheckCircleIcon, SparklesIcon 
} from '../Icons';
import { motion } from 'framer-motion';

interface ServiceSelectorProps {
    onSelect: (servicio: any) => void;
    selectedId?: string;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onSelect, selectedId }) => {
    const { productos } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = productos.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="relative group">
                <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-liquid-gold transition-colors" />
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Filtrar por nombre de servicio..."
                    className="w-full pl-14 pr-6 py-5 bg-black/40 border border-white/5 rounded-2xl text-lg font-bold text-white focus:ring-1 focus:ring-liquid-gold/30 outline-none transition-all placeholder:text-slate-700"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                {filtered.map(p => (
                    <motion.button
                        key={p.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(p)}
                        className={`p-6 rounded-[2rem] border transition-all text-left flex items-center justify-between group relative overflow-hidden ${
                            selectedId === p.id 
                            ? 'bg-liquid-gold/20 border-liquid-gold shadow-gold-glow' 
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                        }`}
                    >
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                                selectedId === p.id ? 'bg-liquid-gold text-black' : 'bg-white/5 text-slate-500'
                            }`}>
                                {p.esSRI ? <ShieldCheckIcon className="w-6 h-6" /> : <BoxIcon className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className={`text-[12px] font-black uppercase tracking-tight leading-tight mb-1 ${
                                    selectedId === p.id ? 'text-white' : 'text-slate-300'
                                }`}>{p.nombre}</h4>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">{p.categoria || 'Papelería'}</span>
                            </div>
                        </div>
                        {selectedId === p.id && <CheckCircleIcon className="w-6 h-6 text-liquid-gold" />}
                    </motion.button>
                ))}
                
                {searchTerm && filtered.length === 0 && (
                    <button 
                        onClick={() => onSelect({ id: 'custom', nombre: searchTerm, categoria: 'Personalizado' })}
                        className="col-span-full p-8 rounded-[2rem] border border-dashed border-liquid-gold/50 bg-liquid-gold/5 text-center group"
                    >
                        <SparklesIcon className="w-10 h-10 mx-auto mb-4 text-liquid-gold/50 group-hover:text-liquid-gold transition-colors" />
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Definir "{searchTerm}" como servicio a medida</p>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ServiceSelector;
