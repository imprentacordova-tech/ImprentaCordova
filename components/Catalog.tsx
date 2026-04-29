
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, CheckCircle, Star, Filter, HeartIcon, SparklesIcon, ArrowRightIcon } from './Icons';
import { Producto as Product, ProductCategory } from '../types';

const products: Product[] = [
  {
    id: 'sri-f1',
    nombre: 'Facturas SRI (50 Juegos)',
    categoria: 'Oficina',
    precio: 13.00,
    unit: 'block',
    descripcion: 'Documentos autorizados por el SRI. Tamaño 1/4 Oficio, Original y 1 Copia.',
    specs: ['Papel Químico', 'Original/Copia', 'Numeradas', 'Autorización SRI'],
    imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: 'sri-f2',
    nombre: 'Facturas SRI (100 Juegos)',
    categoria: 'Oficina',
    precio: 18.00,
    unit: 'block',
    descripcion: 'Documentos autorizados por el SRI. Tamaño 1/4 Oficio, Original y 1 Copia.',
    specs: ['Papel Químico', 'Original/Copia', 'Numeradas', 'Autorización SRI'],
    imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: 'sri-nv1',
    nombre: 'Notas de Venta (Negocio Popular)',
    categoria: 'Oficina',
    precio: 10.00,
    unit: 'block',
    descripcion: 'Talonarios para contribuyentes RIMPE Negocio Popular. Original en Bond.',
    specs: ['Papel Bond 75g', 'Original solamente', 'Numeradas', 'Tamaño 1/4 Oficio'],
    imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: 'sri-r1',
    nombre: 'Retenciones SRI',
    categoria: 'Oficina',
    precio: 18.00,
    unit: 'block',
    descripcion: 'Comprobantes de retención autorizados. Original y Copia.',
    specs: ['Papel Químico', 'Formato Legal', 'Numeración Secuencial'],
    imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '2',
    nombre: 'Gigantografía Publicitaria',
    categoria: 'Gran Formato',
    precio: 10.00,
    unit: 'm²',
    descripcion: 'Impresión de alta resolución en lona resistente para exteriores.',
    specs: ['Calidad Fotográfica', 'Resistente al agua/sol', 'Incluye ojales', 'Diseño incluido'],
    imagenUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: '5',
    nombre: 'Volantes Publicitarios',
    categoria: 'Publicidad',
    precio: 30.00,
    unit: 'x 1000',
    descripcion: 'Flyers full color para promocionar tu negocio masivamente.',
    specs: ['Papel Couché Brillante', 'Tamaño A5 o A6', 'Impresión 1 o 2 lados', 'Diseño de alto impacto'],
    imagenUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: '6',
    nombre: 'Sellos Automáticos',
    categoria: 'Oficina',
    precio: 15.00,
    unit: 'unidad',
    descripcion: 'Sellos de caucho auto-entintables. Marcas Trodat o Shiny.',
    specs: ['Trodat/Shiny', 'Varios tamaños', 'Tinta azul/negra', 'Entrega rápida'],
    imagenUrl: 'https://images.unsplash.com/photo-1563200055-e7eb77b8b200?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '7',
    nombre: 'Tarjetas de Presentación',
    categoria: 'Tarjetas',
    precio: 35.00,
    unit: 'x 1000',
    descripcion: 'La mejor carta de presentación para tu empresa.',
    specs: ['Cartulina Couché 300g', 'Laminado Mate/Brillo', 'Impresión Doble Lado', 'Diseño Gratuito'],
    imagenUrl: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80&w=400'
  }
];

const categories: ProductCategory[] = ['Todos', 'Favoritos', 'Oficina', 'Gran Formato', 'Merch', 'Publicidad', 'Tarjetas', 'Sublimación', 'Etiquetas'];

const Catalog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('imprenta_favorites');
    if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    e.preventDefault();
    let updatedFavorites;
    if (favorites.includes(productId)) {
        updatedFavorites = favorites.filter(id => id !== productId);
    } else {
        updatedFavorites = [...favorites, productId];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('imprenta_favorites', JSON.stringify(updatedFavorites));
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || 
                            (selectedCategory === 'Favoritos' ? favorites.includes(product.id) : product.categoria === selectedCategory);
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="catalog" className="py-32 bg-brand-dark relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-liquid-gold/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-red/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20">
            <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-liquid-gold shadow-gold-glow-soft">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">Archivo de Activos Gráficos</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-display font-black text-white tracking-[-0.04em] uppercase italic leading-none">
                    CATÁLOGO <br /> <span className="text-white/20 not-italic font-editorial font-normal">ELITE</span>
                </h2>
            </div>
            <p className="text-slate-500 max-w-sm text-base font-light italic leading-relaxed border-l border-white/10 pl-6">
                Explora nuestra selección de servicios industriales y soluciones fiscales autorizadas. Precisión técnica en cada pieza.
            </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col xl:flex-row justify-between items-center mb-16 gap-8 bg-white/[0.02] border border-white/5 p-4 rounded-[2.5rem] backdrop-blur-xl">
          
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 italic ${
                  selectedCategory === cat 
                    ? 'bg-liquid-gold text-brand-dark shadow-gold-glow scale-105' 
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat === 'Favoritos' ? <span className="flex items-center gap-2"><HeartIcon className="w-3 h-3"/> Favoritos</span> : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full xl:w-96">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="BUSCAR EN LA BÓVEDA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-14 pr-6 py-4 border-white/10 rounded-full leading-5 bg-black/40 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-liquid-gold focus:border-transparent transition-all shadow-inner text-[10px] font-black uppercase tracking-widest"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, i) => {
                const isFavorite = favorites.includes(product.id);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    key={product.id} 
                    className="group relative bg-white/[0.01] border border-white/5 rounded-[2.5rem] hover:border-liquid-gold/20 transition-all duration-700 flex flex-col h-full overflow-hidden shadow-luxury"
                  >
                    {/* Header Image */}
                    <div className="h-64 bg-black/40 overflow-hidden relative">
                      <img 
                        src={product.imagenUrl} 
                        alt={product.nombre} 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[2s] ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent" />
                      
                      {/* Floating Actions */}
                      <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
                        <button 
                            onClick={(e) => toggleFavorite(e, product.id)}
                            className="bg-black/60 backdrop-blur-md p-2.5 rounded-full border border-white/10 shadow-xl hover:scale-110 transition-transform group/heart"
                        >
                            <HeartIcon className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400 group-hover/heart:text-red-400'}`} />
                        </button>
                        {product.isPopular && (
                          <div className="bg-liquid-gold text-brand-dark text-[8px] font-black px-4 py-1.5 rounded-full shadow-gold-glow flex items-center gap-1.5 uppercase tracking-widest italic">
                              <Star className="w-3 h-3 fill-current" />
                              Destacado
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-6 left-6">
                        <span className="text-[9px] font-black text-liquid-gold/80 bg-white/5 border border-white/10 px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-[0.2em] italic">
                          {product.categoria}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1 flex flex-col gap-4">
                      <h3 className="text-2xl font-display font-black text-white tracking-[-0.04em] leading-tight uppercase italic group-hover:text-liquid-gold transition-colors">
                        {product.nombre}
                      </h3>
                      <p className="text-slate-500 text-sm font-light italic leading-relaxed flex-grow">
                        {product.descripcion}
                      </p>
                      
                      <div className="space-y-2 py-4 border-y border-white/5">
                        {product.specs?.slice(0, 3).map((spec, idx) => (
                          <div key={idx} className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                            <CheckCircle className="w-3 h-3 text-liquid-gold mr-3 flex-shrink-0" />
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Inversión Referencial</p>
                          <p className="text-2xl font-black text-white italic tracking-tighter">
                            ${product.precio.toFixed(2)} 
                            <span className="text-[10px] font-bold text-slate-600 ml-2 not-italic">/ {product.unit}</span>
                          </p>
                        </div>
                        <a 
                          href={`https://wa.me/593993083943?text=Hola,%20me%20interesa%20cotizar%20${encodeURIComponent(product.nombre)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-liquid-gold hover:text-brand-dark hover:border-liquid-gold transition-all duration-500 group/btn"
                        >
                          <ArrowRightIcon className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-24 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/10"
              >
                <div className="p-6 bg-white/5 rounded-full mb-6">
                  <Filter className="h-10 w-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-widest italic">
                    {selectedCategory === 'Favoritos' ? 'Bóveda Vacía' : 'Sin Coincidencias'}
                </h3>
                <p className="text-slate-500 mt-2 mb-8 font-light italic">
                    {selectedCategory === 'Favoritos' ? 'Marca activos con el corazón para guardarlos.' : 'Ajusta los filtros de búsqueda.'}
                </p>
                <button 
                  onClick={() => {setSearchTerm(''); setSelectedCategory('Todos');}}
                  className="px-8 py-3 bg-white/5 border border-white/10 text-liquid-gold font-black text-[10px] uppercase tracking-[0.3em] rounded-full hover:bg-white/10 transition-all"
                >
                  Restablecer Protocolos
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default Catalog;
