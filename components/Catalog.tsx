
import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, CheckCircle, Star, Filter, HeartIcon } from './Icons';
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
    <section id="catalog" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-sm md:text-base text-orange-600 font-bold tracking-wide uppercase">Catálogo de Productos</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-blue-900 sm:text-4xl">
            Todo lo que necesitas imprimir
          </p>
          <p className="mt-4 max-w-2xl text-base text-slate-500 mx-auto">
            Desde gigantografías hasta talonarios autorizados por el SRI. Revisa nuestros precios referenciales.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === cat 
                    ? 'bg-blue-900 text-white shadow-md transform scale-105' 
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat === 'Favoritos' ? <span className="flex items-center gap-1"><HeartIcon className="w-3 h-3"/> Favoritos</span> : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar (ej. Facturas, Lona...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const isFavorite = favorites.includes(product.id);
              return (
              <div key={product.id} className="group relative bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col h-full overflow-hidden">
                
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                    <button 
                        onClick={(e) => toggleFavorite(e, product.id)}
                        className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:scale-110 transition-transform group/heart"
                    >
                        <HeartIcon className={`w-5 h-5 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400 group-hover/heart:text-red-400'}`} />
                    </button>

                    {product.isPopular && (
                    <div className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center shadow-lg uppercase tracking-wider">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Destacado
                    </div>
                    )}
                </div>

                <div className="h-56 bg-slate-100 overflow-hidden relative">
                  <img 
                    src={product.imagenUrl} 
                    alt={product.nombre} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute bottom-3 left-4">
                    <span className="text-white text-xs font-bold bg-black/30 px-2 py-1 rounded backdrop-blur-sm border border-white/20 uppercase tracking-wide">
                      {product.categoria}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-900 transition-colors">{product.nombre}</h3>
                  <p className="text-slate-600 text-sm mb-4 flex-grow leading-relaxed">{product.descripcion}</p>
                  
                  <div className="mb-6 space-y-1.5">
                    {product.specs?.slice(0, 3).map((spec, idx) => (
                      <div key={idx} className="flex items-start text-xs text-slate-500">
                        <CheckCircle className="w-3.5 h-3.5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase">Precio Estimado</p>
                      <p className="text-lg font-bold text-blue-900">
                        ${product.precio.toFixed(2)} 
                        <span className="text-xs font-normal text-slate-500 ml-1">/ {product.unit}</span>
                      </p>
                    </div>
                    <a 
                      href={`https://wa.me/593993083943?text=Hola,%20me%20interesa%20cotizar%20${encodeURIComponent(product.nombre)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-orange-500 hover:text-white text-sm font-bold rounded-lg transition-all duration-300"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Pedir
                    </a>
                  </div>
                </div>
              </div>
            )})
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <Filter className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                  {selectedCategory === 'Favoritos' ? 'Aún no tienes favoritos' : 'No encontramos ese producto'}
              </h3>
              <p className="text-slate-500 mb-4">
                  {selectedCategory === 'Favoritos' ? 'Marca productos con el corazón para verlos aquí.' : 'Intenta con otra categoría o término de búsqueda.'}
              </p>
              <button 
                onClick={() => {setSearchTerm(''); setSelectedCategory('Todos');}}
                className="text-orange-600 hover:text-orange-700 font-bold text-sm underline decoration-2 underline-offset-2"
              >
                Ver todos los productos
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Catalog;
