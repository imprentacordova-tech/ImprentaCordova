
import React, { useState } from 'react';
import { 
    CalculatorIcon, SparklesIcon, CheckCircleIcon,
    ArrowRightIcon, BoltIcon
} from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceCalculatorDisplayProps {
    onSelectPrice: (price: number) => void;
}

const PriceCalculatorDisplay: React.FC<PriceCalculatorDisplayProps> = ({ onSelectPrice }) => {
    const [amount, setAmount] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('1');

    const presets = [
        { label: 'Volante A6', price: 0.05 },
        { label: 'Tarjeta Personal', price: 0.12 },
        { label: 'Afiche A3', price: 1.50 },
        { label: 'Grosor Banner', price: 8.50 }
    ];

    const calculateTotal = () => {
        const p = parseFloat(amount) || 0;
        const q = parseInt(quantity) || 1;
        return (p * q).toFixed(2);
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 italic">Costo Unitario</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-liquid-gold font-bold">$</span>
                        <input 
                            type="number" 
                            step="0.01"
                            value={amount} 
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-8 pr-4 text-white font-bold outline-none focus:border-liquid-gold/30 transition-all text-sm"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 italic">Cantidad</label>
                    <input 
                        type="number" 
                        value={quantity} 
                        onChange={e => setQuantity(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-white font-bold outline-none focus:border-liquid-gold/30 transition-all text-sm"
                        placeholder="1"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {presets.map((p, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setAmount(p.price.toString());
                            setQuantity('100');
                        }}
                        className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase text-slate-400 hover:border-liquid-gold/30 hover:text-white transition-all"
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="p-6 bg-gradient-to-br from-liquid-gold/10 to-transparent rounded-[2rem] border border-liquid-gold/10 flex items-center justify-between group">
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Computado</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter group-hover:text-liquid-gold transition-colors">${calculateTotal()}</p>
                </div>
                <button
                    onClick={() => onSelectPrice(parseFloat(calculateTotal()))}
                    className="w-12 h-12 bg-liquid-gold rounded-2xl flex items-center justify-center text-black shadow-gold-glow hover:scale-110 active:scale-95 transition-all"
                >
                    <ArrowRightIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-2xl">
                <BoltIcon className="w-4 h-4 text-liquid-gold opacity-50" />
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 leading-tight">Usa el módulo completo de calculadora para cotizaciones complejas.</p>
            </div>
        </div>
    );
};

export default PriceCalculatorDisplay;
