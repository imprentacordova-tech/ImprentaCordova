
import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { ContactFormState } from '../types';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormState>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section id="contact" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm text-orange-600 font-bold tracking-wide uppercase">Estamos en Pasaje</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-blue-900 sm:text-4xl">
            Visítanos o Escríbenos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Contact Info & Map */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-blue-900 mb-6 border-b border-slate-100 pb-4">Imprenta Córdova</h3>
              
              <div className="space-y-6">
                <div className="flex items-start group">
                  <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <MapPin className="h-6 w-6 text-blue-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-500 uppercase">Dirección</p>
                    <p className="mt-1 text-slate-900 font-medium">Colón e/ Sucre y Rocafuerte</p>
                    <p className="text-slate-600">Pasaje, El Oro, Ecuador</p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0 p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-500 uppercase">WhatsApp / Celular</p>
                    <p className="mt-1 text-slate-900 font-medium">099 308 3943</p>
                    <a href="https://wa.me/593993083943" target="_blank" rel="noreferrer" className="text-sm text-green-600 hover:underline">
                      Enviar mensaje directo
                    </a>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0 p-3 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                    <Mail className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-500 uppercase">Email</p>
                    <p className="mt-1 text-slate-900 font-medium">imprentacordova@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start group">
                  <div className="flex-shrink-0 p-3 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                    <Clock className="h-6 w-6 text-slate-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-bold text-slate-500 uppercase">Atención</p>
                    <p className="mt-1 text-slate-900">Lunes a Sábado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Map Embed with Specific Coordinates */}
            <div className="h-80 bg-slate-200 rounded-2xl overflow-hidden relative group border-2 border-white shadow-lg hover:shadow-xl transition-shadow">
                <iframe 
                    title="Ubicación Imprenta Córdova"
                    src="https://maps.google.com/maps?q=-3.3281355388981613,-79.80962191989809&hl=es&z=18&output=embed"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full transition-all duration-700"
                ></iframe>
                
                {/* Floating Badge */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-md border border-slate-200 flex items-center pointer-events-none animate-fade-in">
                    <div className="bg-brand-red p-1.5 rounded-full mr-3 shadow-sm">
                        <MapPin className="text-white w-3 h-3" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-xs uppercase leading-tight">Imprenta Córdova</p>
                        <p className="text-[10px] text-slate-500">Pasaje, El Oro</p>
                    </div>
                </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 lg:p-10 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 via-blue-600 to-orange-500"></div>
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Solicitar Proforma</h3>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-10 rounded-xl text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-bold text-xl mb-2">¡Mensaje Enviado!</p>
                <p>Gracias por escribir a Imprenta Córdova. Te responderemos al 099 308 3943 o por correo.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1">Nombre o Empresa</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-slate-300 bg-slate-50 focus:bg-white shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 border transition-all"
                    placeholder="Ej. Comercial López"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                    <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-slate-300 bg-slate-50 focus:bg-white shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 border transition-all"
                        placeholder="correo@ejemplo.com"
                    />
                    </div>
                    <div>
                    <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-1">Celular</label>
                    <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-slate-300 bg-slate-50 focus:bg-white shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 border transition-all"
                        placeholder="099..."
                    />
                    </div>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-1">¿Qué necesitas imprimir?</label>
                  <textarea
                    name="message"
                    id="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-slate-300 bg-slate-50 focus:bg-white shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 border transition-all"
                    placeholder="Describe tu pedido: Cantidad, material, tamaño..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-lg text-base font-bold text-white bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all transform hover:-translate-y-0.5"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Enviar Solicitud
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
