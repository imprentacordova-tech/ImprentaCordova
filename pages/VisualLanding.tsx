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
    const [simData, setSimData] = useState({ product: 'Facturero SRI (100 hojas)', qty: '1 Unidad', finish: 'Color EstÃ¡ndar' });
    
    const handleSimConsult = () => {
        const message = `Hola Imprenta CÃ³rdova! UsÃ© el simulador de la web y quiero cotizar: \n- Producto: ${simData.product}\n- Cantidad: ${simData.qty}\n- Acabado: ${simData.finish}`;
        window.open(generateWhatsAppLink("593988636437", message), '_blank');
    };

    return (
        <div className="min-h-screen bg-white text-[#001f3f] font-sans selection:bg-[#0055ff] selection:text-white overflow-x-hidden">
            <SEO 
                title="Imprenta CÃ³rdova | Soluciones SRI y Artes GrÃ¡ficas Premium"
                description="Imprenta autorizada por el SRI en Ecuador. Especialistas en talonarios, facturas y branding empresarial de alta gama."
            />
            <Navbar />

            {/* 1. HERO - CAPA DE INTEGRACIÃ“N VIDEO/UI (Play 10 Style) */}
            <header className="relative min-h-screen md:h-[110vh] flex items-center justify-center overflow-hidden bg-white pt-20 md:pt-0">
                {/* Contenedor de Video con MÃ¡scaras de Gradiente Ultra-Smooth */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white z-10" />
                    
                    <motion.div 
                        style={{ y: useTransform(scrollY, [0, 1000], [0, 200]) }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        <div className="relative w-full h-full max-w-[1400px] flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
                                <LayersIcon className="w-[80%] h-[80%] text-[#001f3f]" />
                            </div>
                            
                            {/* ESPACIO PARA VIDEO 1 */}
                            <motion.div 
                                animate={{ 
                                    scale: [1, 1.02, 1],
                                    rotate: [0, 0.5, 0]
                                }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                className="w-[90%] h-[60%] md:h-[80%] border-[2px] border-dashed border-gray-100 rounded-[3rem] md:rounded-[6rem] flex flex-col items-center justify-center"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[1.5em] md:tracking-[2em] text-gray-200">CinemÃ¡tica_Header</span>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>

                {/* Contenido Hero Superior */}
                <div className="relative z-20 text-center space-y-8 md:space-y-12 max-w-7xl px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 100, filter: "blur(40px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 1.8, ease: "easeOut" as any }}
                        className="space-y-4"
                    >
                        <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.8em] md:tracking-[1em] text-[#0055ff] block mb-4 md:mb-8">AutorizaciÃ³n SRI â€¢ EstÃ¡ndar Premium</span>
                        <h1 className="text-5xl md:text-9xl lg:text-[14rem] font-black leading-[0.85] md:leading-[0.75] tracking-tighter text-[#001f3f] italic uppercase select-none">
                            IMPRENTA <br/> 
                            <span className="text-[#0055ff] not-italic">CÃ“RDOVA.</span>
                        </h1>
                    </motion.div>

                    {/* BOTONES SORPRESA HERO */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-10 pt-8 md:pt-16">
                        <motion.a
                            href={generateWhatsAppLink("593988636437", "Hola, necesito solicitar talonarios autorizados por el SRI.")}
                            initial={{ scale: 0, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 1.2 }}
                            whileHover={{ scale: 1.05, y: -5, boxShadow: "0px 30px 60px rgba(0, 85, 255, 0.25)" }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto bg-[#0055ff] text-white px-10 md:px-16 py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] md:text-[12px] shadow-2xl flex items-center justify-center gap-5 group"
                        >
                            Talonarios SRI <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </motion.a>

                        <motion.a
                            href="#catalogo"
                            initial={{ scale: 0, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 1.4 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full sm:w-auto bg-[#001f3f] text-white px-10 md:px-16 py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] md:text-[12px] shadow-2xl flex items-center justify-center gap-5 group"
                        >
                            Ver CatÃ¡logo <LayoutIcon className="w-5 h-5 opacity-50 group-hover:rotate-12 transition-transform" />
                        </motion.a>
                    </div>
                </div>
            </header>

            {/* 2. SECCIÃ“N SRI - "EL TALONARIO FÃSICO" (Video 2) */}
            <section className="py-24 md:py-40 lg:py-64 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 md:gap-32 items-center">
                        <div className="relative">
                            {/* Capa de Video 2: El Talonario Kraft */}
                            <motion.div 
                                initial={{ opacity: 0, rotateY: 30, scale: 0.9 }}
                                whileInView={{ opacity: 1, rotateY: 0, scale: 1 }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="aspect-[4/5] bg-[#fdfaf6] rounded-[3rem] lg:rounded-[6rem] overflow-hidden relative shadow-luxury border-[8px] md:border-[12px] border-white group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
                                
                                <div className="w-full h-full flex flex-col items-center justify-center italic text-[#8b5e34]/20 font-black text-[12px] tracking-[0.5em] p-10 md:p-20 text-center">
                                    <FileTextIcon className="w-16 h-16 md:w-20 md:h-20 mb-6 opacity-20" />
                                    [Video_2_SRI_Kraft_Action]
                                    <p className="mt-4 text-[8px] uppercase tracking-widest text-[#8b5e34]/40">Visualizando: Talonario Kraft con Solapa</p>
                                </div>

                                {/* BOTÃ“N ACCIÃ“N SORPRESA */}
                                <motion.div 
                                    initial={{ y: 100, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    viewport={{ amount: 0.8 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
                                    className="absolute bottom-8 md:bottom-16 left-6 md:left-12 right-6 md:right-12 z-20"
                                >
                                    <button className="w-full bg-[#ffcc00] text-[#001f3f] py-5 md:py-7 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-2xl hover:bg-white transition-all active:scale-95">
                                        Personalizar Mi Orden SRI
                                    </button>
                                </motion.div>
                            </motion.div>
                        </div>

                        <div className="space-y-10 md:space-y-16">
                            <div className="space-y-6 md:space-y-8">
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.8em] text-[#0055ff]">Calidad de Manufactura</span>
                                <h2 className="text-5xl md:text-7xl lg:text-[10rem] font-black tracking-tighter text-[#001f3f] italic uppercase leading-[0.85] md:leading-[0.75]">
                                    PODER <br/> 
                                    <span className="text-[#0055ff]">TANGIBLE.</span>
                                </h2>
                            </div>
                            <p className="text-gray-400 font-medium text-lg md:text-2xl leading-relaxed max-w-xl">
                                No es solo un documento, es la seguridad de tu negocio. Bloques forrados en <span className="text-[#8b5e34] font-bold underline decoration-dotted">papel Kraft cafÃ©</span> reforzado y solapas de protecciÃ³n para resguardar cada copia.
                            </p>
                            
                            <div className="flex flex-wrap gap-8 md:gap-12 pt-4 md:pt-8">
                                <div className="space-y-2 md:space-y-4">
                                    <h4 className="font-black text-[#001f3f] uppercase text-xs md:text-sm tracking-widest flex items-center gap-3">
                                        <div className="w-2 h-2 bg-[#ffcc00] rounded-full" /> Papel QuÃ­mico 60g
                                    </h4>
                                    <p className="text-gray-400 text-[10px] md:text-sm font-medium">Transferencia impecable hasta la 3ra copia.</p>
                                </div>
                                <div className="space-y-2 md:space-y-4">
                                    <h4 className="font-black text-[#001f3f] uppercase text-xs md:text-sm tracking-widest flex items-center gap-3">
                                        <div className="w-2 h-2 bg-[#0055ff] rounded-full" /> Acabado Premium
                                    </h4>
                                    <p className="text-gray-400 text-[10px] md:text-sm font-medium">Portadas rÃ­gidas para uso industrial.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. CATÃLOGO GENERAL - "EL VORTICE CREATIVO" (Video 3) */}
            <section id="catalogo" className="py-24 md:py-40 lg:py-64 bg-gray-50/20 relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-16 md:gap-32">
                        <div className="flex-1 space-y-10 md:space-y-16">
                            <div className="space-y-6 md:space-y-8">
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.8em] text-[#e11d48]">Artes GrÃ¡ficas Modernas</span>
                                <h2 className="text-5xl md:text-7xl lg:text-[10rem] font-black tracking-tighter text-[#001f3f] italic uppercase leading-[0.85] md:leading-[0.75]">
                                    TU MARCA <br/> 
                                    <span className="text-[#e11d48]">VIVA.</span>
                                </h2>
                            </div>
                            <p className="text-gray-400 font-medium text-lg md:text-2xl leading-relaxed">
                                Transformamos conceptos en realidades fÃ­sicas. Desde <span className="text-[#e11d48] font-bold">tarjetas con barniz UV</span> hasta volantes y sellos automÃ¡ticos de alta precisiÃ³n.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 md:gap-8">
                                {[
                                    { t: 'Tarjetas Ã‰lite', c: '#e11d48', icon: StarIcon },
                                    { t: 'Volantes Pro', c: '#001f3f', icon: LayersIcon },
                                    { t: 'Sellos Auto', c: '#ffcc00', icon: CheckBadgeIcon },
                                    { t: 'Bingo & Rifas', c: '#0055ff', icon: ActivityIcon }
                                ].map((item, i) => (
                                    <motion.button
                                        key={item.t}
                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ 
                                            type: "spring", 
                                            stiffness: 300, 
                                            damping: 15,
                                            delay: i * 0.1 
                                        }}
                                        whileHover={{ y: -10, scale: 1.05, boxShadow: "0px 20px 40px rgba(0,0,0,0.05)" }}
                                        whileTap={{ scale: 0.95 }}
                                        className="p-6 md:p-10 bg-white rounded-2xl md:rounded-[3rem] shadow-xl border border-gray-100 flex flex-col items-center justify-center gap-4 group overflow-hidden relative"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: item.c }} />
                                        <item.icon className="w-6 h-6 md:w-8 md:h-8 text-gray-200 group-hover:text-gray-400 transition-colors" />
                                        <span className="font-black text-[#001f3f] uppercase text-[10px] md:text-[12px] tracking-widest text-center">{item.t}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 w-full relative">
                            <motion.div 
                                initial={{ opacity: 0, x: 100 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 1.5 }}
                                className="aspect-square bg-white rounded-[3rem] md:rounded-[6rem] overflow-hidden relative shadow-luxury border-[8px] md:border-[12px] border-white"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#e11d48]/5 via-transparent to-transparent z-10" />
                                <div className="w-full h-full flex flex-col items-center justify-center italic text-gray-200 font-black text-[10px] md:text-[12px] tracking-[0.5em] p-10 md:p-20 text-center">
                                    <PaletteIcon className="w-16 h-16 md:w-20 md:h-20 mb-6 opacity-10" />
                                    [Video_3_Creative_Vortex]
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. EVENTOS Y RIFAS - "VORTICE DE SEGURIDAD" (Video 4) */}
            <section className="py-24 md:py-40 lg:py-80 bg-[#001f3f] relative overflow-hidden">
                {/* Capa de Video 4 de Fondo - Suave y Abstracta */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        className="w-[200%] h-[200%] border-[50px] md:border-[100px] border-white/5 rounded-full absolute -top-[50%] -left-[50%]"
                    />
                </div>

                <div className="max-w-5xl mx-auto px-6 text-center relative z-10 space-y-12 md:space-y-20">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="space-y-4 md:space-y-8"
                    >
                        <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] md:tracking-[1em] text-blue-400">NumeraciÃ³n LÃ¡ser & Seguridad</span>
                        <h2 className="text-6xl md:text-8xl lg:text-[14rem] font-black tracking-tighter text-white italic uppercase leading-[0.85] md:leading-[0.75]">
                            RIFAS <br/> 
                            <span className="text-blue-500 not-italic">Ã‰LITE.</span>
                        </h2>
                    </motion.div>
                    
                    <p className="text-blue-100/60 font-medium text-xl md:text-3xl max-w-3xl mx-auto leading-tight italic">
                        "Boletos blindados con tecnologÃ­a de seguridad y numeraciÃ³n correlativa inyectada."
                    </p>
                    
                    {/* BOTÃ“N SORPRESA DE CIERRE */}
                    <motion.button
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        whileHover={{ scale: 1.1, rotate: 2, boxShadow: "0px 0px 80px rgba(59, 130, 246, 0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white text-[#001f3f] px-12 md:px-24 py-6 md:py-10 rounded-full font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px] md:text-sm shadow-3xl w-full sm:w-auto"
                    >
                        Iniciar CotizaciÃ³n
                    </motion.button>
                </div>
            </section>

            {/* 5. SECCIÃ“N DE RASTREO RÃPIDO (FUNCIONALIDAD CORE) */}
            <section className="py-24 md:py-32 bg-white relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="bg-[#001f3f] rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-24 flex flex-col lg:flex-row items-center gap-12 md:gap-20 shadow-luxury overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
                        
                        <div className="flex-1 space-y-6 md:space-y-8 relative z-10 text-center lg:text-left">
                            <h3 className="text-4xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                                RASTREO <br/> <span className="text-blue-500">INTELIGENTE.</span>
                            </h3>
                            <p className="text-blue-100/40 font-medium text-lg md:text-xl leading-relaxed">
                                Transparencia total. Monitorea cada etapa de tu pedido en tiempo real.
                            </p>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
                                <a href="#/tracking" className="bg-blue-600 text-white px-10 md:px-12 py-5 md:py-6 rounded-full font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-2xl hover:bg-blue-500 transition-colors">
                                    Centro de Control
                                </a>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative z-10">
                            <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 font-mono text-[9px] md:text-[11px]">
                                <div className="flex gap-2 mb-6 md:mb-8">
                                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500/50" />
                                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500/50" />
                                </div>
                                <div className="space-y-3 md:space-y-4 text-blue-400/80">
                                    <p className="flex items-center gap-2"><span className="text-white/20">01</span> {">"} CONECTANDO SISTEMA_CORDOVA_OS...</p>
                                    <p className="flex items-center gap-2"><span className="text-white/20">02</span> {">"} ESTADO: IMPRESIÃ“N_OFFSET_ACTIVA</p>
                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-4">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '85%' }}
                                            transition={{ duration: 2, ease: "easeOut" as any }}
                                            className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                        />
                                    </div>
                                    <p className="text-green-400 font-bold tracking-[0.2em] md:tracking-[0.3em] pt-4 animate-pulse uppercase text-[8px] md:text-[10px]">Progreso: 85% - Finalizando Acabados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Minimal Premium */}
            <footer className="py-12 md:py-20 text-center bg-white border-t border-gray-50">
                <div className="max-w-7xl mx-auto px-6 space-y-8 md:space-y-12">
                    <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                        <motion.a href={generateWhatsAppLink("593988636437", "Hola!")} whileHover={{ y: -5 }} className="text-[#001f3f] font-black uppercase text-[9px] md:text-[10px] tracking-widest">WhatsApp</motion.a>
                        <motion.a href="#/login" whileHover={{ y: -5 }} className="text-gray-300 font-black uppercase text-[9px] md:text-[10px] tracking-widest">AdministraciÃ³n</motion.a>
                        <motion.a href="#/tracking" whileHover={{ y: -5 }} className="text-gray-300 font-black uppercase text-[9px] md:text-[10px] tracking-widest">Rastreo</motion.a>
                    </div>
                    <p className="text-gray-300 font-bold uppercase text-[8px] md:text-[9px] tracking-[0.5em] md:tracking-[0.8em]">Imprenta CÃ³rdova â€¢ Santo Domingo â€¢ Ecuador 2026</p>
                </div>
            </footer>

            {/* Floating WhatsApp Action */}
            <motion.a 
                href={generateWhatsAppLink("593988636437", "Hola Imprenta CÃ³rdova!")}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 bg-[#25D366] text-white p-5 md:p-6 rounded-full shadow-3xl flex items-center justify-center"
            >
                <WhatsAppIcon className="w-6 h-6 md:w-8 md:h-8" />
            </motion.a>

        </div>
    );
};

export default VisualLanding;
