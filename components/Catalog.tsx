
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
    <section id="catalog" className="py-32 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-blue/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-200/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20">
            <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-brand-blue shadow-sm">
                    <SparklesIcon className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em]">Archivo de Activos Gráficos</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-display font-black text-slate-900 tracking-[-0.04em] uppercase leading-none">
                    CATÁLOGO <br /> <span className="text-slate-200 not-italic font-editorial font-normal">ELITE</span>
                </h2>
            </div>
            <p className="text-slate-500 max-w-sm text-base font-light leading-relaxed border-l border-slate-200 pl-6">
                Explora nuestra selección de servicios industriales y soluciones fiscales autorizadas. Precisión técnica en cada pieza.
            </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col xl:flex-row justify-between items-center mb-16 gap-8 bg-slate-50 border border-slate-200 p-4 rounded-[2.5rem]">
          
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                  selectedCategory === cat 
                    ? 'bg-brand-blue text-white shadow-blue-glow-sm scale-105' 
                    : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat === 'Favoritos' ? <span className="flex items-center gap-2"><HeartIcon className="w-3 h-3"/> Favoritos</span> : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full xl:w-96">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="BUSCAR EN LA BÓVEDA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-14 pr-6 py-4 border-slate-200 rounded-full leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-transparent transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
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
                    className="group relative bg-white border border-slate-100 rounded-[2.5rem] hover:border-brand-blue/30 transition-all duration-700 flex flex-col h-full overflow-hidden shadow-sm hover:shadow-xl"
                  >
                    {/* Header Image */}
                    <div className="h-64 bg-slate-100 overflow-hidden relative">
                      <img 
                        src={product.imagenUrl} 
                        alt={product.nombre} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-[2s] ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
                      
                      {/* Floating Actions */}
                      <div className="absolute top-6 right-6 z-10 flex flex-col gap-3">
                        <button 
                            onClick={(e) => toggleFavorite(e, product.id)}
                            className="bg-white/80 backdrop-blur-md p-2.5 rounded-full border border-slate-200 shadow-lg hover:scale-110 transition-transform group/heart"
                        >
                            <HeartIcon className={`w-4 h-4 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400 group-hover/heart:text-red-400'}`} />
                        </button>
                        {product.isPopular && (
                          <div className="bg-brand-blue text-white text-[8px] font-black px-4 py-1.5 rounded-full shadow-blue-glow-sm flex items-center gap-1.5 uppercase tracking-widest">
                              <Star className="w-3 h-3 fill-current" />
                              Destacado
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-6 left-6">
                        <span className="text-[9px] font-black text-brand-blue bg-white/90 border border-brand-blue/20 px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-[0.2em]">
                          {product.categoria}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 flex-1 flex flex-col gap-4">
                      <h3 className="text-2xl font-display font-black text-slate-900 tracking-[-0.04em] leading-tight uppercase group-hover:text-brand-blue transition-colors">
                        {product.nombre}
                      </h3>
                      <p className="text-slate-500 text-sm font-light leading-relaxed flex-grow">
                        {product.descripcion}
                      </p>
                      
                      <div className="space-y-2 py-4 border-y border-slate-50">
                        {product.specs?.slice(0, 3).map((spec, idx) => (
                          <div key={idx} className="flex items-center text-[10px] text-slate-600 font-bold uppercase tracking-wide">
                            <CheckCircle className="w-3 h-3 text-brand-blue mr-3 flex-shrink-0" />
                            <span>{spec}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Inversión Referencial</p>
                          <p className="text-2xl font-black text-slate-900 tracking-tighter">
                            ${product.precio.toFixed(2)} 
                            <span className="text-[10px] font-bold text-slate-400 ml-2">/ {product.unit}</span>
                          </p>
                        </div>
                        <a 
                          href={`https://wa.me/593993083943?text=Hola,%20me%20interesa%20cotizar%20${encodeURIComponent(product.nombre)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-900 hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all duration-500 group/btn"
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
                className="col-span-full flex flex-col items-center justify-center py-24 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200"
              >
                <div className="p-6 bg-white rounded-full mb-6 shadow-sm">
                  <Filter className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                    {selectedCategory === 'Favoritos' ? 'Bóveda Vacía' : 'Sin Coincidencias'}
                </h3>
                <p className="text-slate-500 mt-2 mb-8 font-light">
                    {selectedCategory === 'Favoritos' ? 'Marca activos con el corazón para guardarlos.' : 'Ajusta los filtros de búsqueda.'}
                </p>
                <button 
                  onClick={() => {setSearchTerm(''); setSelectedCategory('Todos');}}
                  className="px-8 py-3 bg-white border border-slate-200 text-brand-blue font-black text-[10px] uppercase tracking-[0.3em] rounded-full hover:bg-slate-50 transition-all shadow-sm"
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
