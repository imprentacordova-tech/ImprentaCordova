import React from 'react';
import { FileText, Printer, Calculator, Book, Stamp, Ticket } from 'lucide-react';
import { ServiceItem } from '../types';

const services: ServiceItem[] = [
  {
    id: '1',
    title: 'Gigantografías HD',
    description: 'Impresión en gran formato con tecnología Roland. Lonas, banners y vinilos de alta definición y durabilidad.',
    iconName: 'Printer',
    imageUrl: 'https://images.unsplash.com/photo-1520697517317-6767553cc51a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '2',
    title: 'Imprenta Autorizada SRI',
    description: 'Facturas, Notas de Venta, Retenciones, Liquidaciones de compra y Guías de remisión.',
    iconName: 'FileText',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '3',
    title: 'Gestión Tributaria',
    description: 'Declaraciones de IVA (Mensual/Semestral), Impuesto a la Renta, Anexos, RUC y RISE.',
    iconName: 'Calculator',
    imageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '4',
    title: 'Juegos y Eventos',
    description: 'Tablas de Bingo, Rifas numeradas, Boletos y Tickets para tus eventos sociales.',
    iconName: 'Ticket',
    imageUrl: 'https://images.unsplash.com/photo-1533561052669-829984e9da82?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '5',
    title: 'Empastados y Tesis',
    description: 'Encuadernación profesional de libros, tesis de grado y archivos contables con acabados de lujo.',
    iconName: 'Book',
    imageUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '6',
    title: 'Sellos y Oficina',
    description: 'Sellos automáticos y de madera, personalizados al instante. Material de oficina en general.',
    iconName: 'Stamp',
    imageUrl: 'https://images.unsplash.com/photo-1620641974338-9cb5585b14f8?auto=format&fit=crop&q=80&w=400'
  }
];

const IconMap: Record<string, React.ElementType> = {
  Printer,
  FileText,
  Calculator,
  Ticket,
  Book,
  Stamp
};

const Services: React.FC = () => {
  return (
    <section id="services" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm md:text-base text-orange-600 font-bold tracking-wide uppercase">Nuestras Especialidades</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-blue-900 sm:text-4xl">
            Soluciones Gráficas & Tributarias
          </p>
          <p className="mt-4 max-w-2xl text-xl text-slate-600 mx-auto">
            En Imprenta Córdova no solo imprimimos, te ayudamos a cumplir con tus obligaciones y destacar tu marca.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = IconMap[service.iconName];
            return (
              <div key={service.id} className="bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 group hover:-translate-y-1">
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-blue-900/0 transition-all z-10" />
                  <img 
                    src={service.imageUrl} 
                    alt={service.title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg text-orange-600 mr-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-blue-900">{service.title}</h3>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{service.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;