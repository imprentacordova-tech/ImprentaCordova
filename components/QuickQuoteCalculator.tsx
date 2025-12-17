
import React, { useState, useEffect } from 'react';
import { Calculator, MessageCircle, Check, Printer, layers, Map as MapIcon, CreditCard, FileText, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../utils';

// Definición de Productos Simplificados para el Cliente
const PRODUCTS = [
  {
    id: 'tarjetas',
    name: 'Tarjetas',
    icon: CreditCard,
    basePrice: 35, // Precio base por millar
    unit: 'unidades',
    quantities: [
      { label: '100 (Digital)', value: 100, multiplier: 0.5 }, // ~$17.50
      { label: '1000 (Offset)', value: 1000, multiplier: 1 },  // ~$35.00
    ],
    finishes: [
      { id: 'brillante', name: 'Brillante UV', priceMod: 0 },
      { id: 'mate', name: 'Mate', priceMod: 10 }, // +$10
      { id: 'mate_uv', name: 'Mate + UV Local', priceMod: 15 } // +$15
    ]
  },
  {
    id: 'volantes',
    name: 'Volantes A6',
    icon: FileText,
    basePrice: 30, // Precio base por millar
    unit: 'unidades',
    quantities: [
      { label: '1000', value: 1000, multiplier: 1 },
      { label: '5000', value: 5000, multiplier: 3.5 }, // Descuento por volumen
    ],
    finishes: [
      { id: 'couche_115', name: 'Couché 115g', priceMod: 0 },
      { id: 'couche_150', name: 'Couché 150g', priceMod: 10 }
    ]
  },
  {
    id: 'lona',
    name: 'Lona / Banner',
    icon: ImageIcon,
    basePrice: 10, // Precio por m2
    unit: 'metros²',
    quantities: [
      { label: '2x1 m (2m²)', value: 2, multiplier: 2 },
      { label: '3x2 m (6m²)', value: 6, multiplier: 6 },
      { label: '4x3 m (12m²)', value: 12, multiplier: 11 }, // Ligero descuento
    ],
    finishes: [
      { id: 'ojales', name: 'Con Ojales', priceMod: 0 },
      { id: 'bolsillo', name: 'Con Bolsillo', priceMod: 2 },
      { id: 'roll_up', name: 'Estructura Roll Up', priceMod: 55 }
    ]
  }
];

const QuickQuoteCalculator: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [selectedQty, setSelectedQty] = useState(PRODUCTS[0].quantities[1]);
  const [selectedFinish, setSelectedFinish] = useState(PRODUCTS[0].finishes[0]);
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  // Recalcular cuando cambian las selecciones
  useEffect(() => {
    // Asegurar que las selecciones sean válidas para el producto actual
    if (!selectedProduct.quantities.find(q => q.value === selectedQty.value)) {
        setSelectedQty(selectedProduct.quantities[0]);
    }
    if (!selectedProduct.finishes.find(f => f.id === selectedFinish.id)) {
        setSelectedFinish(selectedProduct.finishes[0]);
    }
  }, [selectedProduct]);

  useEffect(() => {
    // Lógica de cálculo simple
    const base = selectedProduct.basePrice * selectedQty.multiplier;
    const finish = selectedFinish.priceMod;
    
    // Ajuste lógico: si es lona, el acabado se suma; si es tarjeta, el acabado es por el lote
    let total = 0;
    if (selectedProduct.id === 'lona') {
       // Para lona, el precio base ya incluye m2, el acabado (roll up) es fijo o por unidad
       total = base + finish;
    } else {
       total = base + finish;
    }
    
    setEstimatedPrice(total);
  }, [selectedProduct, selectedQty, selectedFinish]);

  const getWhatsAppLink = () => {
    const phone = "593993083943";
    const message = `Hola Imprenta Córdova 🖨️. Me interesa esta cotización del sitio web:
    
📦 *Producto:* ${selectedProduct.name}
🔢 *Cantidad:* ${selectedQty.label}
✨ *Acabado:* ${selectedFinish.name}
💰 *Rango Estimado:* $${(estimatedPrice * 0.95).toFixed(2)} - $${(estimatedPrice * 1.05).toFixed(2)}

¿Me confirman el precio final y tiempo de entrega?`;
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      {/* Header */}
      <div className="bg-slate-900 p-6 text-white text-center">
        <div className="inline-flex items-center justify-center p-3 bg-brand-blue rounded-full mb-3 shadow-lg shadow-blue-900/50">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-2xl font-black tracking-tight">Cotizador Express</h3>
        <p className="text-blue-200 text-sm">Obtén un estimado en segundos</p>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        
        {/* 1. Seleccionar Producto */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. ¿Qué necesitas?</label>
          <div className="grid grid-cols-3 gap-3">
            {PRODUCTS.map((product) => {
              const Icon = product.icon;
              const isSelected = selectedProduct.id === product.id;
              return (
                <button
                  key={product.id}
                  onClick={() => {
                      setSelectedProduct(product);
                      setSelectedQty(product.quantities[0]);
                      setSelectedFinish(product.finishes[0]);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 ${
                    isSelected 
                      ? 'border-brand-blue bg-blue-50 text-brand-blue ring-2 ring-blue-200 ring-offset-1' 
                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-brand-blue' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold">{product.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Configuración */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Cantidad</label>
                <div className="space-y-2">
                    {selectedProduct.quantities.map((qty) => (
                        <button
                            key={qty.value}
                            onClick={() => setSelectedQty(qty)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                                selectedQty.value === qty.value
                                ? 'border-brand-blue bg-blue-50/50 text-brand-blue font-bold shadow-sm'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            <span>{qty.label}</span>
                            {selectedQty.value === qty.value && <Check className="w-4 h-4" />}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. Detalles / Acabado</label>
                <div className="space-y-2">
                    {selectedProduct.finishes.map((finish) => (
                        <button
                            key={finish.id}
                            onClick={() => setSelectedFinish(finish)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
                                selectedFinish.id === finish.id
                                ? 'border-brand-blue bg-blue-50/50 text-brand-blue font-bold shadow-sm'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                            <span>{finish.name}</span>
                            {selectedFinish.id === finish.id && <Check className="w-4 h-4" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Resultado y CTA */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Rango Estimado</p>
                    <p className="text-xs text-slate-500">*Precio final puede variar</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black text-slate-900">
                        ${(estimatedPrice * 0.95).toFixed(0)} - ${(estimatedPrice * 1.05).toFixed(0)}
                    </span>
                    <span className="text-sm font-bold text-slate-400 ml-1">USD</span>
                </div>
            </div>

            <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all transform hover:-translate-y-1 active:scale-95"
            >
                <MessageCircle className="w-5 h-5" />
                Confirmar Oferta por WhatsApp
            </a>
        </div>

      </div>
    </div>
  );
};

export default QuickQuoteCalculator;
