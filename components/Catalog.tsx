
import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, CheckCircle, Star, Filter, HeartIcon } from './Icons';
// Fix: Updated import to use 'Producto' as 'Product' alias
import { Producto as Product, ProductCategory } from '../types';

const products: Product[] = [
  {
    id: '1',
    nombre: 'Facturas / Notas de Venta',
    categoria: 'Oficina',
    precio: 18.00,
    unit: 'block',
    descripcion: 'Documentos autorizados por el SRI. Disponibles en químico o bond.',
    specs: ['Autorización SRI', 'Original y Copia(s)', 'Numeradas', 'Diseño estándar o personalizado'],
    imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400',
    isPopular: true
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
    id: '3',
    nombre: 'Tablas de Bingo',
    categoria: 'Merch',
    precio: 0.10,
    unit: 'unidad',
    descripcion: 'Tablas para bingos bailables o solidarios. Números claros y legibles.',
    specs: ['Papel Bond o Cartulina', 'Impresión B/N o Color', 'Series variadas', 'Diseño personalizado'],
    imagenUrl: 'https://images.unsplash.com/photo-1516132006923-e97e23c20242?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '4',
    nombre: 'Rifas Numeradas',
    categoria: 'Merch',
    precio: 35.00,
    unit: 'millar',
    descripcion: 'Boletos para sorteos con talón desglosable y numeración secuencial.',
    specs: ['Numeración Variable', 'Línea de corte', 'Papel Bond Color', 'Engomados'],
    imagenUrl: 'https://images.unsplash.com/photo-1541560052-77ec1bbc09f7?auto=format&fit=crop&q=80&w=400'
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
    descripcion: 'Sellos de caucho auto-entintables. Ideales para profesionales.',
    specs: ['Marcas Trodat/Shiny', 'Varios tamaños', 'Tinta azul/negra', 'Entrega rápida'],
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
  },
  {
    id: '8',
    nombre: 'Roll Up Banner',
    categoria: 'Gran Formato',
    precio: 65.00,
    unit: 'unidad',
    descripcion: 'Exhibidor portátil de aluminio elegante para ferias y oficinas.',
    specs: ['80x200 cm', 'Estructura Aluminio', 'Lona fotográfica', 'Incluye bolso'],
    imagenUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '9',
    nombre: 'Empastados de Tesis',
    categoria: 'Oficina',
    precio: 25.00,
    unit: 'unidad',
    descripcion: 'Empastado de lujo con letras doradas para trabajos de grado.',
    specs: ['Tapa dura', 'Grabado en Pan de Oro', 'Colores variados', 'Acabado profesional'],
    imagenUrl: 'https://images.unsplash.com/photo-1519682577862-22b62b24e491?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '10',
    nombre: 'Taza Personalizada',
    categoria: 'Sublimación',
    precio: 6.00,
    unit: 'unidad',
    descripcion: 'Taza de cerámica blanca sublimada con tu diseño o foto.',
    specs: ['Cerámica AAA', 'Resistente a microondas', 'Impresión Full Color', 'Caja individual'],
    imagenUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: '11',
    nombre: 'Gorra Tipo Camionero',
    categoria: 'Sublimación',
    precio: 7.00,
    unit: 'unidad',
    descripcion: 'Gorra con malla trasera y frente acolchado personalizado.',
    specs: ['Varios colores', 'Estampado Sublimación/Vinil', 'Talla ajustable', 'Entrega rápida'],
    imagenUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '12',
    nombre: 'Camiseta Estampada',
    categoria: 'Sublimación',
    precio: 12.00,
    unit: 'unidad',
    descripcion: 'Camisetas personalizadas para eventos, empresas o uso diario.',
    specs: ['Telas Algodón/Poliéster', 'Técnica DTF o Sublimación', 'Tallas S-XL', 'Diseño a medida'],
    imagenUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: '13',
    nombre: 'Etiquetas Adhesivas',
    categoria: 'Etiquetas',
    precio: 15.00,
    unit: 'x 100',
    descripcion: 'Stickers troquelados para productos, frascos o packaging.',
    specs: ['Vinil resistente al agua', 'Corte personalizado', 'Full Color', 'Entrega en pliego'],
    imagenUrl: 'https://images.unsplash.com/photo-1616406432452-07bc5921752d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '14',
    nombre: 'Credencial PVC',
    categoria: 'Oficina',
    precio: 3.50,
    unit: 'unidad',
    descripcion: 'Identificación plástica duradera tipo tarjeta de crédito.',
    specs: ['Material PVC rígido', 'Impresión ambas caras', 'Incluye cordón', 'Alta durabilidad'],
    imagenUrl: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '15',
    nombre: 'Carpeta Corporativa',
    categoria: 'Oficina',
    precio: 1.50,
    unit: 'unidad',
    descripcion: 'Carpeta de presentación con bolsillo interno para documentos.',
    specs: ['Cartulina Couché 300g', 'Bolsillo troquelado', 'Laminado opcional', 'Ideal para cotizaciones'],
    imagenUrl: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '16',
    nombre: 'Jarro Mágico',
    categoria: 'Sublimación',
    precio: 8.00,
    unit: 'unidad',
    descripcion: 'Taza negra que revela tu foto al poner agua caliente. ¡Sorprendente!',
    specs: ['Cerámica Termosensible', 'Negro a Color', 'Caja Individual', 'Diseño Personalizado'],
    imagenUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=400',
    isPopular: true
  },
  {
    id: '17',
    nombre: 'Tomatodo Deportivo',
    categoria: 'Sublimación',
    precio: 9.00,
    unit: 'unidad',
    descripcion: 'Botella de aluminio con gancho, ideal para escuelas y deporte.',
    specs: ['600ml / 750ml', 'Aluminio inoxidable', 'Tapa rosca segura', 'Full Color'],
    imagenUrl: 'https://images.unsplash.com/photo-1602143407151-01114195bc51?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '18',
    nombre: 'Menú Plastificado',
    categoria: 'Publicidad',
    precio: 3.50,
    unit: 'unidad',
    descripcion: 'Carta para restaurante rígida, lavable y de alta durabilidad.',
    specs: ['Tamaño A4 o A3', 'Laminado Grueso (175 mic)', 'Bordes Redondeados', 'Resistente al agua'],
    imagenUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '19',
    nombre: 'Señalética Sintra',
    categoria: 'Gran Formato',
    precio: 5.00,
    unit: 'unidad',
    descripcion: 'Letreros rígidos para seguridad, baños u oficinas.',
    specs: ['Base Sintra 3mm', 'Vinil Laminado', 'Medida A4/A3', 'Incluye cinta doble faz'],
    imagenUrl: 'https://images.unsplash.com/photo-1574359411659-15573a21bc2c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '20',
    nombre: 'Llaveros Personalizados',
    categoria: 'Merch',
    precio: 45.00,
    unit: 'ciento',
    descripcion: 'Recuerdos económicos para campañas o eventos.',
    specs: ['Acrílico o Metal', 'Impresión ambos lados', 'Pedido mínimo 50', 'Formas variadas'],
    imagenUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&q=80&w=400'
  }
];

const categories: ProductCategory[] = ['Todos', 'Favoritos', 'Oficina', 'Gran Formato', 'Merch', 'Publicidad', 'Tarjetas', 'Sublimación', 'Etiquetas'];

const Catalog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // Load favorites from local storage on component mount
    const savedFavorites = localStorage.getItem('imprenta_favorites');
    if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); // Prevent opening product details or other actions
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
    /* Fix: Updated field names to match 'Producto' interface */
    const matchesCategory = selectedCategory === 'Todos' || 
                            (selectedCategory === 'Favoritos' ? favorites.includes(product.id) : product.categoria === selectedCategory);
    const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
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
            Desde gigantografías hasta sellos. Revisa nuestros precios referenciales y marca tus favoritos.
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
                {cat === 'Favoritos' ? <span className="flex items-center gap-1"><HeartIcon className="w-3 h-3"/> Favoritos</span> : cat}
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
            filteredProducts.map((product) => {
              const isFavorite = favorites.includes(product.id);
              return (
              <div key={product.id} className="group relative bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col h-full overflow-hidden">
                
                {/* Badges Container */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                    {/* Favorite Button */}
                    <button 
                        onClick={(e) => toggleFavorite(e, product.id)}
                        className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:scale-110 transition-transform group/heart"
                        aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                    >
                        <HeartIcon className={`w-5 h-5 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-slate-400 group-hover/heart:text-red-400'}`} />
                    </button>

                    {/* Popular Badge */}
                    {product.isPopular && (
                    <div className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center shadow-lg uppercase tracking-wider">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Destacado
                    </div>
                    )}
                </div>

                {/* Image */}
                <div className="h-56 bg-slate-100 overflow-hidden relative">
                  {/* Fix: Updated field name to 'imagenUrl' and 'nombre' */}
                  <img 
                    src={product.imagenUrl} 
                    alt={product.nombre} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute bottom-3 left-4">
                    {/* Fix: Updated field name to 'categoria' */}
                    <span className="text-white text-xs font-bold bg-black/30 px-2 py-1 rounded backdrop-blur-sm border border-white/20 uppercase tracking-wide">
                      {product.categoria}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Fix: Updated field names to 'nombre' and 'descripcion' */}
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-900 transition-colors">{product.nombre}</h3>
                  <p className="text-slate-600 text-sm mb-4 flex-grow leading-relaxed">{product.descripcion}</p>
                  
                  {/* Specs */}
                  <div className="mb-6 space-y-1.5">
                    {product.specs?.slice(0, 3).map((spec, idx) => (
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
                      {/* Fix: Updated field name to 'precio' */}
                      <p className="text-lg font-bold text-blue-900">
                        ${product.precio.toFixed(2)} 
                        <span className="text-xs font-normal text-slate-500 ml-1">/ {product.unit}</span>
                      </p>
                    </div>
                    {/* Fix: Updated field name to 'nombre' */}
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
