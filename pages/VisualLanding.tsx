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

            {/* 1. HERO - CAPA DE INTEGRACIÓN VIDEO/UI (Play 10 Style) */}
            <header className="relative h-[110vh] flex items-center justify-center overflow-hidden bg-white">
                {/* Contenedor de Video con Máscaras de Gradiente Ultra-Smooth */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white z-10" />
                    
                    {/* Contenedor para Video_1_Header.webp */}
                    <motion.div 
                        style={{ y: useTransform(scrollY, [0, 1000], [0, 200]) }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        <div className="relative w-full h-full max-w-[1400px] flex items-center justify-center">
                            {/* Placeholder Visual - Será reemplazado por el video .webp */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
                                <LayersIcon className="w-[80%] h-[80%] text-[#001f3f]" />
                            </div>
                            
                            {/* Aquí irá el <video src="Video_1_Header.webp" ... /> */}
                            <motion.div 
                                animate={{ 
                                    scale: [1, 1.02, 1],
                                    rotate: [0, 0.5, 0]
                                }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="w-[90%] h-[80%] border-[2px] border-dashed border-gray-100 rounded-[6rem] flex flex-col items-center justify-center"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[2em] text-gray-200">Video_1_Header_Layer</span>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Contenido Hero Superior */}
                <div className="relative z-20 text-center space-y-12 max-w-7xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 100, filter: "blur(40px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-4"
                    >
                        <span className="text-[11px] font-black uppercase tracking-[1em] text-[#0055ff] block mb-8">Autorización SRI • Estándar Premium</span>
                        <h1 className="text-7xl md:text-9xl lg:text-[14rem] font-black leading-[0.75] tracking-tighter text-[#001f3f] italic uppercase select-none">
                            IMPRENTA <br/> 
                            <span className="text-[#0055ff] not-italic">CÓRDOVA.</span>
                        </h1>
                    </motion.div>

                    {/* BOTONES SORPRESA HERO */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-10 pt-16">
                        <motion.a
                            href={generateWhatsAppLink("Hola, necesito solicitar talonarios autorizados por el SRI.")}
                            initial={{ scale: 0, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 1.2 }}
                            whileHover={{ scale: 1.1, rotate: -1, boxShadow: "0px 30px 60px rgba(0, 85, 255, 0.25)" }}
                            className="bg-[#0055ff] text-white px-16 py-8 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl flex items-center gap-5 group"
                        >
                            Talonarios SRI <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </motion.a>

                        <motion.a
                            href="#catalogo"
                            initial={{ scale: 0, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 1.4 }}
                            whileHover={{ scale: 1.1, rotate: 1 }}
                            className="bg-[#001f3f] text-white px-16 py-8 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl flex items-center gap-5 group"
                        >
                            Ver Catálogo <LayoutIcon className="w-5 h-5 opacity-50 group-hover:rotate-12 transition-transform" />
                        </motion.a>
                    </div>
                </div>
            </header>

            {/* 2. SECCIÓN SRI - "EL TALONARIO FÍSICO" (Video 2) */}
            <section className="py-40 lg:py-64 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-32 items-center">
                        <div className="relative">
                            {/* Capa de Video 2: El Talonario Kraft */}
                            <motion.div 
                                initial={{ opacity: 0, rotateY: 30 }}
                                whileInView={{ opacity: 1, rotateY: 0 }}
                                transition={{ duration: 1.5 }}
                                className="aspect-[4/5] bg-gray-50 rounded-[4rem] lg:rounded-[6rem] overflow-hidden relative shadow-luxury border-[12px] border-white group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
                                
                                {/* Placeholder Video_2_SRI.webp */}
                                <div className="w-full h-full flex flex-col items-center justify-center italic text-gray-200 font-black text-[12px] tracking-[0.5em] p-20 text-center">
                                    <FileTextIcon className="w-20 h-20 mb-6 opacity-10" />
                                    [Video_2_SRI_Talonario_Kraft_Action]
                                </div>

                                {/* BOTÓN ACCIÓN SORPRESA (Aparece al llegar aquí) */}
                                <motion.div 
                                    initial={{ y: 200, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    viewport={{ amount: 0.8 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                    className="absolute bottom-16 left-12 right-12 z-20"
                                >
                                    <button className="w-full bg-[#ffcc00] text-[#001f3f] py-7 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:scale-105 transition-transform active:scale-95">
                                        Personalizar Mi Orden SRI
                                    </button>
                                </motion.div>
                            </motion.div>
                        </div>

                        <div className="space-y-16">
                            <div className="space-y-8">
                                <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#0055ff]">Calidad de Manufactura</span>
                                <h2 className="text-7xl lg:text-[10rem] font-black tracking-tighter text-[#001f3f] italic uppercase leading-[0.75]">
                                    PODER <br/> 
                                    <span className="text-[#0055ff]">TANGIBLE.</span>
                                </h2>
                            </div>
                            <p className="text-gray-400 font-medium text-2xl leading-relaxed max-w-xl">
                                No es solo un documento, es la seguridad de tu negocio. Papel químico de grado industrial con portadas reforzadas en papel Kraft y solapas de protección.
                            </p>
                            
                            {/* Micro-Features */}
                            <div className="flex flex-wrap gap-12 pt-8">
                                <div className="space-y-4">
                                    <h4 className="font-black text-[#001f3f] uppercase text-sm tracking-widest flex items-center gap-3">
                                        <div className="w-2 h-2 bg-[#ffcc00] rounded-full" /> Papel Químico 60g
                                    </h4>
                                    <p className="text-gray-400 text-sm font-medium">Transferencia impecable hasta la 3ra copia.</p>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="font-black text-[#001f3f] uppercase text-sm tracking-widest flex items-center gap-3">
                                        <div className="w-2 h-2 bg-[#0055ff] rounded-full" /> Numeración Láser
                                    </h4>
                                    <p className="text-gray-400 text-sm font-medium">Precisión absoluta y seguridad legal.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. CATÁLOGO GENERAL - "EL VORTICE CREATIVO" (Video 3) */}
            <section id="catalogo" className="py-40 lg:py-64 bg-gray-50/20 relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-32">
                        <div className="flex-1 space-y-16">
                            <div className="space-y-8">
                                <span className="text-[10px] font-black uppercase tracking-[0.8em] text-[#e11d48]">Artes Gráficas Modernas</span>
                                <h2 className="text-7xl lg:text-[10rem] font-black tracking-tighter text-[#001f3f] italic uppercase leading-[0.75]">
                                    TU MARCA <br/> 
                                    <span className="text-[#e11d48]">VIVA.</span>
                                </h2>
                            </div>
                            <p className="text-gray-400 font-medium text-2xl leading-relaxed">
                                Transformamos conceptos en realidades físicas. Tarjetas con barniz UV, volantes de alto gramaje y sellos que definen autoridad.
                            </p>
                            
                            {/* Grid de Categorías Dinámico */}
                            <div className="grid grid-cols-2 gap-8">
                                {[
                                    { t: 'Tarjetas Élite', c: '#e11d48' },
                                    { t: 'Volantes Pro', c: '#001f3f' },
                                    { t: 'Sellos Auto', c: '#ffcc00' },
                                    { t: 'Banners UV', c: '#0055ff' }
                                ].map((item, i) => (
                                    <motion.button
                                        key={item.t}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        whileHover={{ y: -10, scale: 1.05 }}
                                        className="p-10 bg-white rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center justify-center gap-4 group"
                                    >
                                        <div className="w-12 h-1 bg-gray-100 rounded-full group-hover:w-20 transition-all duration-500" style={{ backgroundColor: item.c }} />
                                        <span className="font-black text-[#001f3f] uppercase text-[12px] tracking-widest">{item.t}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 w-full relative">
                            {/* Contenedor Video 3: La Explosión de Tarjetas/Volantes */}
                            <motion.div 
                                initial={{ opacity: 0, x: 100 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1.5 }}
                                className="aspect-square bg-white rounded-[6rem] overflow-hidden relative shadow-luxury border-[12px] border-white"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#e11d48]/5 via-transparent to-transparent z-10" />
                                {/* Placeholder Video_3_General.webp */}
                                <div className="w-full h-full flex flex-col items-center justify-center italic text-gray-200 font-black text-[12px] tracking-[0.5em] p-20 text-center">
                                    <PaletteIcon className="w-20 h-20 mb-6 opacity-10" />
                                    [Video_3_Creative_Explosion_Action]
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. EVENTOS Y RIFAS - "VORTICE DE SEGURIDAD" (Video 4) */}
            <section className="py-40 lg:py-80 bg-[#001f3f] relative overflow-hidden">
                {/* Capa de Video 4 de Fondo - Suave y Abstracta */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        className="w-[200%] h-[200%] border-[100px] border-white/5 rounded-full absolute -top-[50%] -left-[50%]"
                    />
                </div>

                <div className="max-w-5xl mx-auto px-6 text-center relative z-10 space-y-20">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <span className="text-[11px] font-black uppercase tracking-[1em] text-blue-400">Numeración Láser & Seguridad</span>
                        <h2 className="text-8xl lg:text-[14rem] font-black tracking-tighter text-white italic uppercase leading-[0.75]">
                            RIFAS <br/> 
                            <span className="text-blue-500 not-italic">ÉLITE.</span>
                        </h2>
                    </motion.div>
                    
                    <p className="text-blue-100/60 font-medium text-3xl max-w-3xl mx-auto leading-tight">
                        Boletos inyectados con tecnología de seguridad. Numeración correlativa blindada para tus eventos más grandes.
                    </p>
                    
                    {/* BOTÓN SORPRESA DE CIERRE */}
                    <motion.button
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        whileHover={{ scale: 1.1, rotate: 2, boxShadow: "0px 0px 80px rgba(59, 130, 246, 0.4)" }}
                        className="bg-white text-[#001f3f] px-24 py-10 rounded-full font-black uppercase tracking-[0.4em] text-sm shadow-3xl"
                    >
                        Iniciar Cotización
                    </motion.button>
                </div>
            </section>

            {/* 5. SECCIÓN DE RASTREO RÁPIDO (FUNCIONALIDAD CORE) */}
            <section className="py-32 bg-white relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="bg-[#001f3f] rounded-[4rem] p-12 lg:p-24 flex flex-col lg:flex-row items-center gap-20 shadow-luxury overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
                        
                        <div className="flex-1 space-y-8 relative z-10">
                            <h3 className="text-5xl lg:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                                RASTREO <br/> <span className="text-blue-500">INTELIGENTE.</span>
                            </h3>
                            <p className="text-blue-100/40 font-medium text-xl leading-relaxed">
                                Transparencia total. Mira el estado de tu producción en tiempo real desde nuestro taller hasta tu puerta.
                            </p>
                            <div className="flex flex-wrap gap-6 pt-4">
                                <a href="#/tracking" className="bg-blue-600 text-white px-12 py-6 rounded-full font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-blue-500 transition-colors">
                                    Centro de Control
                                </a>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative z-10">
                            <div className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 font-mono text-[11px]">
                                <div className="flex gap-2 mb-8">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                </div>
                                <div className="space-y-4 text-blue-400/80">
                                    <p>{">"} CONECTANDO SISTEMA_CORDOVA_OS...</p>
                                    <p className="text-white/40">{">"} ESTADO: IMPRESIÓN_OFFSET_ACTIVA</p>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-4">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '85%' }}
                                            className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                        />
                                    </div>
                                    <p className="text-green-400 font-bold tracking-[0.3em] pt-4 animate-pulse uppercase">Progreso: 85% - Finalizando Acabados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Minimal Premium */}
            <footer className="py-20 text-center bg-white border-t border-gray-50">
                <div className="max-w-7xl mx-auto px-6 space-y-12">
                    <div className="flex justify-center gap-12">
                        <motion.a href={generateWhatsAppLink("Hola!")} whileHover={{ y: -5 }} className="text-[#001f3f] font-black uppercase text-[10px] tracking-widest">WhatsApp</motion.a>
                        <motion.a href="#/login" whileHover={{ y: -5 }} className="text-gray-300 font-black uppercase text-[10px] tracking-widest">Administración</motion.a>
                    </div>
                    <p className="text-gray-300 font-bold uppercase text-[9px] tracking-[0.8em]">Imprenta Córdova • Santo Domingo • Ecuador 2026</p>
                </div>
            </footer>

            {/* Floating WhatsApp Action */}
            <motion.a 
                href={generateWhatsAppLink("Hola Imprenta Córdova!")}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-10 right-10 z-50 bg-[#25D366] text-white p-6 rounded-full shadow-3xl flex items-center justify-center"
            >
                <WhatsAppIcon className="w-8 h-8" />
            </motion.a>

        </div>
    );
};

export default VisualLanding;
