import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title = "Imprenta Córdova | Servicios de Impresión y Encuadernación", 
  description = "Imprenta Córdova ofrece servicios de impresión, diseño y elaboración de material publicitario y papelería. Calidad, rapidez y atención personalizada en cada trabajo.", 
  keywords = "Imprenta, Córdova, impresión digital, encuadernación, papelería, diseño gráfico, empastes, gigantografías, facturas, comprobantes físicos",
  image = "/LOGO.png",
  url = "https://www.imprentacordova.net"
}) => {
  return (
    <Helmet>
      {/* Etiqueta Título */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${url}${image}`} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${url}${image}`} />

      {/* Otras Etiquetas Esenciales */}
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
    </Helmet>
  );
};
