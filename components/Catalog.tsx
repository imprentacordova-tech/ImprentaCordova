import React, { useState } from 'react';
import { Search, ShoppingCart, CheckCircle, Star, Filter } from 'lucide-react';
import { Product, ProductCategory } from '../types';

const products: Product[] = [
  {
    id: '1',
    name: 'Facturas / Notas de Venta',
    category: 'Oficina',
    price: 18.00,
    unit: 'block',
    description: 'Documentos autorizados por el SRI. Disponibles en químico o bond.',
    specs: ['Autorización SRI', 'Original y Copia(s)', 'Numeradas', 'Diseño estándar o personalizado'],
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: '2',
    name: 'Gigantografía Publicitaria',
    category: 'Gran Formato',
    price: 10.00,
    unit: 'm²',
    description: 'Impresión de alta resolución en lona resistente para exteriores.',
    specs: ['Calidad Fotográfica', 'Resistente al agua/sol', 'Incluye ojales', 'Diseño incluido'],
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: '3',
    name: 'Tablas de Bingo',
    category: 'Merch',
    price: 0.10,
    unit: 'unidad',
    description: 'Tablas para bingos bailables o solidarios. Números claros y legibles.',
    specs: ['Papel Bond o Cartulina', 'Impresión B/N o Color', 'Series variadas', 'Diseño personalizado'],
    imageUrl: 'https://images.unsplash.com/photo-1516132006923-e97e23c20242?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '4',
    name: 'Rifas Numeradas',
    category: 'Merch',
    price: 35.00,
    unit: 'millar',
    description: 'Boletos para sorteos con talón desglosable y numeración secuencial.',
    specs: ['Numeración Variable', 'Línea de corte', 'Papel Bond Color', 'Engomados'],
    imageUrl: 'https://images.unsplash.com/photo-1541560052-77ec1bbc09f7?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '5',
    name: 'Volantes Publicitarios',
    category: 'Publicidad',
    price: 30.00,
    unit: 'x 1000',
    description: 'Flyers full color para promocionar tu negocio masivamente.',
    specs: ['Papel Couché Brillante', 'Tamaño A5 o A6', 'Impresión 1 o 2 lados', 'Diseño de alto impacto'],
    imageUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: '6',
    name: 'Sellos Automáticos',
    category: 'Oficina',
    price: 15.00,
    unit: 'unidad',
    description: 'Sellos de caucho auto-entintables. Ideales para profesionales.',
    specs: ['Marcas Trodat/Shiny', 'Varios tamaños', 'Tinta azul/negra', 'Entrega rápida'],
    imageUrl: 'https://images.unsplash.com/photo-1563200055-e7eb77b8b200?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '7',
    name: 'Tarjetas de Presentación',
    category: 'Tarjetas',
    price: 35.00,
    unit: 'x 1000',
    description: 'La mejor carta de presentación para tu empresa.',
    specs: ['Cartulina Couché 300g', 'Laminado Mate/Brillo', 'Impresión Doble Lado', 'Diseño Gratuito'],
    imageUrl: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '8',
    name: 'Roll Up Banner',
    category: 'Gran Formato',
    price: 65.00,
    unit: 'unidad',
    description: 'Exhibidor portátil de aluminio elegante para ferias y oficinas.',
    specs: ['80x200 cm', 'Estructura Aluminio', 'Lona fotográfica', 'Incluye bolso'],
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '9',
    name: 'Empastados de Tesis',
    category: 'Oficina',
    price: 25.00,
    unit: 'unidad',
    description: 'Empastado de lujo con letras doradas para trabajos de grado.',
    specs: ['Tapa dura', 'Grabado en Pan de Oro', 'Colores variados', 'Acabado profesional'],
    imageUrl: 'https://images.unsplash.com/photo-1519682577862-22b62b24e491?auto=format&fit=crop&q=80&w=400'
  }
];

const categories: ProductCategory[] = ['Todos', 'Oficina', 'Gran Formato', 'Merch', 'Publicidad', 'Tarjetas'];

const Catalog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="catalog" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-sm md:text-base text-orange-600 font-bold tracking-wide uppercase">Catálogo de Productos</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-blue-900 sm:text-4xl">
            Todo lo que necesitas imprimir
          </p>
          <p className="mt-4 max-w-2xl text-base text-slate-500 mx-auto">
            Desde gigantografías hasta sellos. Revisa nuestros precios referenciales y solicita tu cotización hoy mismo.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          
          {/* Categories */}
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
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
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

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} className="group relative bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col h-full overflow-hidden">
                
                {/* Popular Badge */}
                {product.isPopular && (
                  <div className="absolute top-4 right-4 z-10 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center shadow-lg uppercase tracking-wider">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Destacado
                  </div>
                )}

                {/* Image */}
                <div className="h-56 bg-slate-100 overflow-hidden relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute bottom-3 left-4">
                    <span className="text-white text-xs font-bold bg-black/30 px-2 py-1 rounded backdrop-blur-sm border border-white/20 uppercase tracking-wide">
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-900 transition-colors">{product.name}</h3>
                  <p className="text-slate-600 text-sm mb-4 flex-grow leading-relaxed">{product.description}</p>
                  
                  {/* Specs */}
                  <div className="mb-6 space-y-1.5">
                    {product.specs.slice(0, 3).map((spec, idx) => (
                      <div key={idx} className="flex items-start text-xs text-slate-500">
                        <CheckCircle className="w-3.5 h-3.5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price & Action */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase">Precio Estimado</p>
                      <p className="text-lg font-bold text-blue-900">
                        ${product.price.toFixed(2)} 
                        <span className="text-xs font-normal text-slate-500 ml-1">/ {product.unit}</span>
                      </p>
                    </div>
                    <a 
                      href={`https://wa.me/593993083943?text=Hola,%20me%20interesa%20cotizar%20${encodeURIComponent(product.name)}`}
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
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <Filter className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No encontramos ese producto</h3>
              <p className="text-slate-500 mb-4">Intenta con otra categoría o término de búsqueda.</p>
              <button 
                onClick={() => {setSearchTerm(''); setSelectedCategory('Todos');}}
                className="text-orange-600 hover:text-orange-700 font-bold text-sm underline decoration-2 underline-offset-2"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Catalog;