import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
    ChevronRightIcon, WhatsAppIcon, PaletteIcon, 
    ShieldCheckIcon, ClockIcon, CheckCircleIcon,
    FileTextIcon, SearchIcon, LayoutIcon, ActivityIcon,
    LayersIcon, HandRaisedIcon, StarIcon, CheckBadgeIcon
} from '../components/Icons';
import { generateWhatsAppLink } from '../utils';
import { SEO } from '../components/SEO';
import Navbar from '../components/Navbar';

const VisualLanding: React.FC = () => {
    const { scrollY } = useScroll();
    const [simData, setSimData] = useState({ product: 'Facturero SRI (100 hojas)', qty: '1 Unidad', finish: 'Color Estándar' });
    
    // Parallax & Scroll Animations
    const yHero = useTransform(scrollY, [0, 500], [0, -100]);

    const handleSimConsult = () => {
        const message = `Hola Imprenta Córdova! Usé el simulador de la web y quiero cotizar: \n- Producto: ${simData.product}\n- Cantidad: ${simData.qty}\n- Acabado: ${simData.finish}`;
        window.open(generateWhatsAppLink(message), '_blank');
    };

    return (
        <div className="min-h-screen bg-white text-[#001f3f] font-sans selection:bg-[#0055ff] selection:text-white overflow-x-hidden">
            <SEO 
                title="Imprenta Córdova | Soluciones SRI y Artes Gráficas Premium"
                description="Imprenta autorizada por el SRI en Ecuador. Especialistas en talonarios, facturas y branding empresarial de alta gama."
            />
            <Navbar />

            {/* 1. HERO PRO - OPTIMIZADO MÓVIL */}
            <section className="relative min-h-screen lg:h-screen flex flex-col lg:flex-row overflow-hidden border-b border-gray-100">
                
                {/* Lado Izquierdo: DOCUMENTOS SRI */}
                <motion.div 
                    className="flex-1 relative group cursor-pointer border-b lg:border-b-0 lg:border-r border-gray-100 overflow-hidden pt-24 lg:pt-0"
                >
                    <div className="absolute inset-0 bg-[#0055ff]/[0.02] group-hover:bg-[#0055ff]/[0.05] transition-colors duration-700" />
                    <div className="relative h-full flex flex-col items-center justify-center p-6 lg:p-12 text-center z-10">
                        <motion.div style={{ y: yHero }} className="mb-6 lg:mb-8">
                            <img 
                                src="/premium_sri_stack_realistic_1777155585044.png" 
                                alt="Talonarios SRI" 
                                className="w-64 lg:w-96 h-auto drop-shadow-[0_35px_60px_rgba(0,85,255,0.15)] transform group-hover:scale-110 transition-transform duration-1000"
                            />
                        </motion.div>
                        <h1 className="text-4xl lg:text-7xl font-black mb-4 lg:mb-6 tracking-tighter leading-none italic uppercase">
                            SOLUCIONES <br/> <span className="text-[#0055ff]">SRI.</span>
                        </h1>
                        <p className="text-gray-500 max-w-xs lg:max-w-sm mb-8 lg:mb-10 text-sm lg:text-base font-medium leading-relaxed">
                            Imprenta autorizada para documentos tributarios con validez legal inmediata.
                        </p>
                        <a 
                            href={generateWhatsAppLink("Hola, necesito solicitar talonarios autorizados por el SRI.")}
                            className="bg-[#0055ff] text-white px-8 lg:px-10 py-4 lg:py-5 rounded-full font-black uppercase tracking-widest text-[10px] lg:text-xs flex items-center gap-3 hover:bg-[#0033aa] transition-all shadow-2xl shadow-blue-100 hover:scale-105"
                        >
                            Solicitar Talonarios SRI <ChevronRightIcon className="w-5 h-5" />
                        </a>
                    </div>
                </motion.div>

                {/* Lado Derecho: IMPRENTA GENERAL */}
                <motion.div 
                    className="flex-1 relative group cursor-pointer overflow-hidden pb-12 lg:pb-0"
                >
                    <div className="absolute inset-0 bg-[#e11d48]/[0.02] group-hover:bg-[#e11d48]/[0.05] transition-colors duration-700" />
                    <div className="relative h-full flex flex-col items-center justify-center p-6 lg:p-12 text-center z-10">
                        <motion.div style={{ y: yHero }} className="mb-6 lg:mb-8">
                            <img 
                                src="/branding_premium_imprenta_1777154630939.png" 
                                alt="Imprenta General" 
                                className="w-64 lg:w-96 h-auto drop-shadow-[0_35px_60px_rgba(225,29,72,0.1)] transform group-hover:scale-110 transition-transform duration-1000"
                            />
                        </motion.div>
                        <h2 className="text-4xl lg:text-7xl font-black mb-4 lg:mb-6 tracking-tighter leading-none italic uppercase">
                            ARTES <br/> <span className="text-[#e11d48]">GRÁFICAS.</span>
                        </h2>
                        <p className="text-gray-500 max-w-xs lg:max-w-sm mb-8 lg:mb-10 text-sm lg:text-base font-medium leading-relaxed">
                            Diseño y branding empresarial. Tarjetas, volantes y publicidad de alto impacto.
                        </p>
                        <a 
                            href="#catalogo"
                            className="bg-[#001f3f] text-white px-8 lg:px-10 py-4 lg:py-5 rounded-full font-black uppercase tracking-widest text-[10px] lg:text-xs flex items-center gap-3 hover:bg-black transition-all shadow-2xl shadow-gray-200 hover:scale-105"
                        >
                            Ver Catálogo General <LayoutIcon className="w-5 h-5" />
                        </a>
                    </div>
                </motion.div>

                {/* VS Indicator (Desktop only) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden lg:block">
                    <div className="w-16 h-16 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-2xl font-black text-gray-200 italic text-xl">
                        VS
                    </div>
                </div>
            </section>

            {/* 2. SECCIÓN INTERACTIVA - "¿QUÉ NECESITAS HOY?" */}
            <section id="catalogo" className="py-20 lg:py-32 bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16 lg:mb-20 space-y-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#0055ff]">Elige tu flujo</span>
                        <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-[#001f3f] italic uppercase">¿QUÉ NECESITAS HOY?</h2>
                        <div className="w-20 h-2 bg-[#ffcc00] mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {/* SRI Card */}
                        <motion.div 
                            whileHover={{ y: -10 }}
                            className="bg-white p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-10 items-center lg:items-start group"
                        >
                            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#0055ff]/10 rounded-2xl lg:rounded-[2rem] flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
                                <ShieldCheckIcon className="w-8 h-8 lg:w-10 lg:h-10 text-[#0055ff]" />
                            </div>
                            <div className="text-center lg:text-left">
                                <h3 className="text-2xl lg:text-3xl font-black mb-4 uppercase italic">Documentos SRI</h3>
                                <ul className="space-y-3 mb-8 text-gray-500 font-bold text-sm lg:text-base">
                                    <li className="flex items-center gap-3 lg:justify-start justify-center"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Talonarios de Facturas</li>
                                    <li className="flex items-center gap-3 lg:justify-start justify-center"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Notas de Venta SRI</li>
                                    <li className="flex items-center gap-3 lg:justify-start justify-center"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Guías de Remisión</li>
                                </ul>
                                <a href={generateWhatsAppLink("Deseo iniciar un trámite para documentos SRI.")} className="text-[#0055ff] font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:translate-x-2 transition-transform justify-center lg:justify-start">
                                    Iniciar Trámite <ChevronRightIcon className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>

                        {/* Imprenta Card */}
                        <motion.div 
                            whileHover={{ y: -10 }}
                            className="bg-white p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-10 items-center lg:items-start group"
                        >
                            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#e11d48]/10 rounded-2xl lg:rounded-[2rem] flex items-center justify-center shrink-0 group-hover:-rotate-12 transition-transform">
                                <PaletteIcon className="w-8 h-8 lg:w-10 lg:h-10 text-[#e11d48]" />
                            </div>
                            <div className="text-center lg:text-left">
                                <h3 className="text-2xl lg:text-3xl font-black mb-4 uppercase italic">Imprenta General</h3>
                                <ul className="space-y-3 mb-8 text-gray-500 font-bold text-sm lg:text-base">
                                    <li className="flex items-center gap-3 lg:justify-start justify-center"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Tarjetas de Lujo</li>
                                    <li className="flex items-center gap-3 lg:justify-start justify-center"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Volantes & Flyers</li>
                                    <li className="flex items-center gap-3 lg:justify-start justify-center"><CheckCircleIcon className="w-4 h-4 text-green-500" /> Sellos & Branding</li>
                                </ul>
                                <a href={generateWhatsAppLink("Quiero ver el catálogo de imprenta general.")} className="text-[#e11d48] font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:translate-x-2 transition-transform justify-center lg:justify-start">
                                    Explorar Catálogo <ChevronRightIcon className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. SECCIÓN VISUAL - STORYTELLING */}
            <section className="py-20 lg:py-32 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                    <div className="flex-1 relative w-full">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1 }}
                            className="relative z-10"
                        >
                            <img 
                                src="/sri_talonario_ecuador_premium_1777154472827.png" 
                                alt="Detalle Papel Químico" 
                                className="rounded-[2rem] lg:rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] border-4 lg:border-8 border-white transform hover:rotate-1 transition-transform duration-700 w-full"
                            />
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 5 }}
                                className="absolute -top-6 -right-6 lg:-top-10 lg:-right-10 bg-white p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-2xl border border-gray-50 z-20"
                            >
                                <div className="flex items-center gap-3 lg:gap-4">
                                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-50 rounded-full flex items-center justify-center">
                                        <StarIcon className="w-4 h-4 lg:w-5 lg:h-5 text-[#ffcc00]" />
                                    </div>
                                    <div>
                                        <p className="text-[8px] lg:text-[10px] font-black text-gray-300 uppercase tracking-widest">Calidad Superior</p>
                                        <p className="text-xs lg:text-base font-bold text-[#001f3f]">Papel Químico 60g</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                    <div className="flex-1 space-y-6 lg:space-y-8 text-center lg:text-left">
                        <h2 className="text-4xl lg:text-6xl font-black tracking-tighter leading-[0.9] text-[#001f3f] italic uppercase">
                            EL PODER DE <br/> <span className="text-[#0055ff]">LO BIEN IMPRESO.</span>
                        </h2>
                        <p className="text-lg lg:text-xl text-gray-500 font-medium leading-relaxed">
                            No solo imprimimos papel, construimos la imagen de tu empresa. Usamos tintas de alta densidad y papel químico de transferencia perfecta para que cada copia sea nítida.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 text-left">
                            <div className="space-y-1">
                                <h4 className="text-lg lg:text-xl font-bold border-l-4 border-[#ffcc00] pl-4 italic">Papel Químico</h4>
                                <p className="text-gray-400 text-xs lg:text-sm font-medium">Copia impecable sin carbón.</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-lg lg:text-xl font-bold border-l-4 border-[#e11d48] pl-4 italic">Acabado Élite</h4>
                                <p className="text-gray-400 text-xs lg:text-sm font-medium">Encolado reforzado y duradero.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. PROCESO PASO A PASO (OPTIMIZADO MÓVIL) */}
            <section className="py-20 lg:py-32 bg-[#001f3f] text-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-16 lg:gap-20">
                        {/* SRI Process */}
                        <div className="flex-1 space-y-8 lg:space-y-12">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/10" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#0055ff]">FLUJO DOCUMENTOS SRI</span>
                            </div>
                            <div className="space-y-8 lg:space-y-10">
                                {[
                                    { icon: <FileTextIcon />, t: "Envías PDF RUC", d: "Subes tus datos o autorización SRI." },
                                    { icon: <SearchIcon />, t: "Validamos Datos", d: "Revisamos vigencia y detalles técnicos." },
                                    { icon: <LayoutIcon />, t: "Diseñamos Arte", d: "Preparamos el diseño para tu aprobación." },
                                    { icon: <CheckCircleIcon />, t: "Producción & Entrega", d: "Impresión premium y envío a tu local." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 lg:gap-6 items-start group">
                                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/5 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-[#0055ff] transition-colors">
                                            {React.cloneElement(step.icon as React.ReactElement, { className: "w-5 h-5 lg:w-6 lg:h-6" })}
                                        </div>
                                        <div>
                                            <h4 className="text-base lg:text-lg font-bold mb-1 italic uppercase">{step.t}</h4>
                                            <p className="text-white/40 text-xs lg:text-sm font-medium leading-tight">{step.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* General Process */}
                        <div className="flex-1 space-y-8 lg:space-y-12">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-white/10" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#e11d48]">FLUJO IMPRENTA GENERAL</span>
                            </div>
                            <div className="space-y-8 lg:space-y-10">
                                {[
                                    { icon: <PaletteIcon />, t: "Eliges Producto", d: "Seleccionas tarjetas, sellos o banners." },
                                    { icon: <LayersIcon />, t: "Personalizamos", d: "Ajustamos diseño a tu identidad." },
                                    { icon: <ActivityIcon />, t: "Producción Alta Gama", d: "Uso de materiales premium y acabados." },
                                    { icon: <WhatsAppIcon />, t: "Entrega Final", d: "Recibes tu material listo para usar." }
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-4 lg:gap-6 items-start group">
                                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/5 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-[#e11d48] transition-colors">
                                            {React.cloneElement(step.icon as React.ReactElement, { className: "w-5 h-5 lg:w-6 lg:h-6" })}
                                        </div>
                                        <div>
                                            <h4 className="text-base lg:text-lg font-bold mb-1 italic uppercase">{step.t}</h4>
                                            <p className="text-white/40 text-xs lg:text-sm font-medium leading-tight">{step.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. SIMULADOR RÁPIDO (FUNCIONAL) */}
            <section className="py-20 lg:py-32 bg-white">
                <div className="max-w-4xl mx-auto px-6 lg:px-8 bg-gray-50 rounded-[2.5rem] lg:rounded-[4rem] p-8 lg:p-16 shadow-xl border border-gray-100">
                    <div className="text-center mb-10 lg:mb-12 space-y-2">
                        <h2 className="text-3xl lg:text-4xl font-black italic uppercase tracking-tighter text-[#001f3f]">SIMULADOR DE PEDIDO</h2>
                        <p className="text-gray-400 font-bold uppercase text-[9px] lg:text-[10px] tracking-widest">Configura tu impresión en segundos</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-10 lg:mb-12">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#0055ff]">Tipo de Trabajo</label>
                            <select 
                                value={simData.product}
                                onChange={(e) => setSimData({...simData, product: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3 lg:py-4 font-bold focus:ring-2 focus:ring-[#0055ff] outline-none text-sm lg:text-base"
                            >
                                <option>Facturero SRI (100 hojas)</option>
                                <option>Nota de Venta (50 hojas)</option>
                                <option>Tarjetas Premium (100u)</option>
                                <option>Sellos Automáticos</option>
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[#0055ff]">Cantidad</label>
                            <select 
                                value={simData.qty}
                                onChange={(e) => setSimData({...simData, qty: e.target.value})}
                                className="w-full bg-white border border-gray-200 rounded-xl lg:rounded-2xl px-5 lg:px-6 py-3 lg:py-4 font-bold focus:ring-2 focus:ring-[#0055ff] outline-none text-sm lg:text-base"
                            >
                                <option>1 Unidad</option>
                                <option>5 Unidades</option>
                                <option>10 Unidades (Dcto.)</option>
                                <option>+20 Unidades (Mayorista)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-[#001f3f] p-8 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8 text-white">
                        <div className="flex items-center gap-4 lg:gap-6">
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-[#0055ff] rounded-xl lg:rounded-2xl flex items-center justify-center">
                                <ClockIcon className="w-6 h-6 lg:w-8 lg:h-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#0055ff] uppercase tracking-widest">Estado</p>
                                <p className="text-lg lg:text-xl font-bold italic">Listo para Cotizar</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleSimConsult}
                            className="w-full md:w-auto bg-white text-[#001f3f] px-10 lg:px-12 py-4 lg:py-5 rounded-full font-black uppercase tracking-widest text-[10px] lg:text-xs hover:scale-105 transition-all shadow-2xl"
                        >
                            Consultar Precio <ChevronRightIcon className="w-4 h-4 ml-2 inline" />
                        </button>
                    </div>
                </div>
            </section>

            {/* 6. CTA FINAL & WHATSAPP (TOTALMENTE FUNCIONAL) */}
            <section className="py-20 lg:py-32 text-center bg-gradient-to-b from-white to-gray-50">
                <div className="max-w-4xl mx-auto px-6 lg:px-8 space-y-8 lg:space-y-10">
                    <h2 className="text-5xl lg:text-8xl font-black tracking-tighter leading-none italic uppercase text-[#001f3f]">
                        ¿LISTO PARA <br/> <span className="text-[#0055ff]">IMPACTAR?</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 lg:gap-6">
                        <a 
                            href={generateWhatsAppLink("¡Hola! Quiero cotizar un proyecto de impresión de alta gama.")}
                            className="bg-[#25D366] text-white px-10 lg:px-12 py-5 lg:py-6 rounded-full font-black uppercase tracking-widest text-[10px] lg:text-xs flex items-center justify-center gap-3 lg:gap-4 hover:scale-105 transition-all shadow-2xl shadow-green-100"
                        >
                            <WhatsAppIcon className="w-5 h-5 lg:w-6 lg:h-6" /> Chatear con un experto
                        </a>
                        <button className="bg-white text-[#001f3f] border-2 border-gray-200 px-10 lg:px-12 py-5 lg:py-6 rounded-full font-black uppercase tracking-widest text-[10px] lg:text-xs hover:bg-gray-50 transition-all">
                            Subir RUC para SRI
                        </button>
                    </div>
                    <p className="text-gray-400 font-bold uppercase text-[8px] lg:text-[9px] tracking-[0.5em]">Entregas a nivel nacional • Calidad certificada</p>
                </div>
            </section>

            {/* Global Floating WhatsApp */}
            <motion.a 
                href={generateWhatsAppLink("Hola Imprenta Córdova!")}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 bg-[#25D366] text-white p-4 lg:p-5 rounded-full shadow-2xl flex items-center justify-center"
            >
                <WhatsAppIcon className="w-6 h-6 lg:w-8 lg:h-8" />
            </motion.a>

        </div>
    );
};

export default VisualLanding;
