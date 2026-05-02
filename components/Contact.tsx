
import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <section id="contact" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-200/50 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] text-brand-blue font-black tracking-[0.4em] uppercase mb-4"
          >
            Sede Central Pasaje
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-black tracking-[-0.04em] text-slate-900"
          >
            CONECTA CON LA <span className="text-brand-blue">ÉLITE</span> GRÁFICA
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Info Side */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-100 p-8 rounded-3xl group hover:border-brand-blue/30 transition-all duration-500 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 mb-8 tracking-[0.2em] uppercase">Mesa de Control</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-brand-blue shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                    <p className="text-slate-900 font-bold text-lg leading-tight">Colón e/ Sucre y Rocafuerte</p>
                    <p className="text-slate-500 text-sm">Pasaje, El Oro, Ecuador</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-brand-blue/5 rounded-2xl flex items-center justify-center border border-brand-blue/10 text-brand-blue shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Línea Directa</p>
                    <p className="text-slate-900 font-bold text-lg leading-tight">099 308 3943</p>
                    <a href="https://wa.me/593993083943" target="_blank" rel="noreferrer" className="text-xs text-brand-blue font-black uppercase tracking-wider hover:text-slate-900 transition-colors flex items-center gap-1 mt-2">
                      WhatsApp Business <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-400 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Oficial</p>
                    <p className="text-slate-900 font-bold text-lg break-all">imprentacordova@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Map */}
            <div className="h-64 rounded-3xl overflow-hidden border border-slate-100 relative group grayscale hover:grayscale-0 transition-all duration-700 shadow-sm">
                <iframe 
                    title="Ubicación IMPRENTA CÓRDOVA"
                    src="https://maps.google.com/maps?q=-3.3281355388981613,-79.80962191989809&hl=es&z=18&output=embed"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                ></iframe>
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/80 backdrop-blur-md border border-slate-100 rounded-lg pointer-events-none">
                  <p className="text-[8px] font-black text-brand-blue tracking-widest uppercase">PUNTO DE DESPACHO</p>
                </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-100 p-8 lg:p-12 rounded-[2.5rem] relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <Send className="w-32 h-32 text-slate-900" />
              </div>
              
              <h3 className="text-2xl font-display font-black text-slate-900 tracking-[-0.04em] mb-8">SOLICITAR <span className="text-brand-blue">COTIZACIÓN</span> INDUSTRIAL</h3>
              
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 text-center"
                >
                  <div className="w-20 h-20 bg-brand-blue/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-blue/10">
                      <Send className="w-10 h-10 text-brand-blue" />
                  </div>
                  <p className="font-display font-black text-2xl text-slate-900 mb-2 tracking-tighter">PROTOCOLO ENVIADO</p>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">Procesaremos su requerimiento bajo los estándares de IMPRENTA CÓRDOVA. Espere nuestra respuesta.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Nombre o Empresa</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 placeholder:text-slate-300 focus:border-brand-blue/50 focus:bg-white transition-all outline-none font-bold"
                        placeholder="EJ: CORPORACIÓN X"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Canal de Contacto</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 placeholder:text-slate-300 focus:border-brand-blue/50 focus:bg-white transition-all outline-none font-bold"
                        placeholder="EMAIL O TELÉFONO"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Especificaciones Técnicas</label>
                    <textarea
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 placeholder:text-slate-300 focus:border-brand-blue/50 focus:bg-white transition-all outline-none font-bold resize-none"
                      placeholder="DESCRIBA SU PEDIDO: CANTIDAD, MATERIAL, TAMAÑO..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="group w-full py-5 bg-brand-blue text-white rounded-2xl font-display font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-3"
                  >
                    <span>TRANSMITIR REQUERIMIENTO</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
