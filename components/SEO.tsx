
import React from 'react';
import { Helmet } from 'react-helmet-async';

// ── Constantes del negocio ────────────────────────────────────────────────────
const SITE_URL   = 'https://www.imprentacordova.net';
const BRAND_NAME = 'Imprenta Córdova';
const LOGO_URL   = `${SITE_URL}/LOGO.png`;
const OG_IMAGE   = `${SITE_URL}/og-image.png`;   // 1200×630 recomendado
const PHONE      = '+593993083943';
const LATITUDE   = '-3.3261';
const LONGITUDE  = '-79.9567';

const DEFAULT_TITLE =
    'Imprenta Córdova | Impresión HD, SRI y Diseño en Pasaje, El Oro';

const DEFAULT_DESCRIPTION =
    'Imprenta Córdova en Pasaje, El Oro — gigantografías Roland HD, imprenta autorizada SRI, gestión tributaria, material publicitario y empastados de lujo. Atención personalizada con más de 15 años de experiencia.';

const DEFAULT_KEYWORDS = [
    'imprenta Pasaje El Oro',
    'gigantografías Pasaje',
    'impresión Roland Ecuador',
    'imprenta autorizada SRI Ecuador',
    'facturas SRI Pasaje',
    'notas de venta SRI',
    'declaración IVA Ecuador',
    'gestión tributaria El Oro',
    'diseño gráfico Pasaje',
    'material publicitario Ecuador',
    'encuadernación tesis Pasaje',
    'sellos automáticos Ecuador',
    'impresión digital El Oro',
    'Imprenta Córdova',
].join(', ');

// ── Schema.org LocalBusiness ──────────────────────────────────────────────────
const LOCAL_BUSINESS_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#business`,
    name: BRAND_NAME,
    alternateName: 'Imprenta Cordova Pasaje',
    url: SITE_URL,
    logo: LOGO_URL,
    image: OG_IMAGE,
    telephone: PHONE,
    email: 'contacto@imprentacordova.net',
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer',
    description: DEFAULT_DESCRIPTION,
    address: {
        '@type': 'PostalAddress',
        streetAddress: 'Calle Colón e/ Sucre, Diagonal al Parque Central',
        addressLocality: 'Pasaje',
        addressRegion: 'El Oro',
        postalCode: '070102',
        addressCountry: 'EC',
    },
    geo: {
        '@type': 'GeoCoordinates',
        latitude: LATITUDE,
        longitude: LONGITUDE,
    },
    openingHoursSpecification: [
        {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '08:00',
            closes: '19:00',
        },
        {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Saturday',
            opens: '08:00',
            closes: '14:00',
        },
    ],
    sameAs: [
        'https://www.facebook.com/imprentacordova',
        'https://www.instagram.com/imprentacordova',
    ],
    hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Servicios de Imprenta Córdova',
        itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Gigantografías HD Roland' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Comprobantes Autorizados SRI' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Gestión Tributaria Ecuador' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Material Publicitario y Diseño' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Sellos Automáticos y de Madera' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Encuadernación y Empastados de Tesis' } },
        ],
    },
};

// ── Schema.org FAQPage ────────────────────────────────────────────────────────
const FAQ_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: '¿Cómo autorizar e imprimir comprobantes del SRI (Facturas y Notas de Venta) en Pasaje, El Oro?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'En Imprenta Córdova (Código Autorización SRI 8634, RUC 0702065319001) gestionamos tu autorización directamente en el portal del SRI. Elaboramos libretas y talonarios de Facturas, Notas de Venta RIMPE, Guías de Remisión y Retenciones en 24 a 48 horas.'
            }
        },
        {
            '@type': 'Question',
            name: '¿Hacen envíos de impresiones a domicilio en Pasaje, Machala y Ecuador?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Sí, entregamos a domicilio en Pasaje, Machala, Santa Rosa, Huaquillas, El Guabo, Piñas y realizamos envíos express por encomienda a todo el Ecuador.'
            }
        },
        {
            '@type': 'Question',
            name: '¿Qué productos gráficos elabora Imprenta Córdova?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Ofrecemos gigantografías HD, sellos automáticos Trodat / Shiny, talonarios autocopiativos, volantes, afiches, tarjetas de presentación, encuadernación de tesis y empastados de lujo.'
            }
        }
    ]
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface SEOProps {
    /** Título de la página. Se añade automáticamente "| Imprenta Córdova" si no lo lleva */
    title?: string;
    description?: string;
    keywords?: string;
    /** URL absoluta de la imagen Open Graph (1200×630) */
    image?: string;
    /** URL canónica de esta página */
    url?: string;
    /** Tipo de contenido Open Graph. Por defecto 'website' */
    ogType?: 'website' | 'article';
    /** Si false, omite el JSON-LD de LocalBusiness (para páginas internas de admin) */
    includeLocalBusiness?: boolean;
    /** Índice de motores de búsqueda. Por defecto true */
    robots?: boolean;
}

// ── Componente ────────────────────────────────────────────────────────────────
export const SEO: React.FC<SEOProps> = ({
    title              = DEFAULT_TITLE,
    description        = DEFAULT_DESCRIPTION,
    keywords           = DEFAULT_KEYWORDS,
    image              = OG_IMAGE,
    url                = SITE_URL,
    ogType             = 'website',
    includeLocalBusiness = true,
    robots             = true,
}) => {
    // Garantiza que el título siempre contenga la marca
    const fullTitle = title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;

    return (
        <Helmet>
            {/* ── Básicos ── */}
            <html lang="es-EC" />
            <title>{fullTitle}</title>
            <meta name="description"         content={description} />
            <meta name="keywords"            content={keywords} />
            <meta name="author"              content={BRAND_NAME} />
            <meta name="robots"              content={robots ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'} />
            <meta name="theme-color"         content="#f8fafc" />
            <meta name="color-scheme"        content="light" />
            <link rel="canonical"            href={url} />

            {/* ── Geo / Local SEO ── */}
            <meta name="geo.region"          content="EC-O" />
            <meta name="geo.placename"       content="Pasaje, El Oro, Ecuador" />
            <meta name="geo.position"        content={`${LATITUDE};${LONGITUDE}`} />
            <meta name="ICBM"                content={`${LATITUDE}, ${LONGITUDE}`} />

            {/* ── Open Graph ── */}
            <meta property="og:type"         content={ogType} />
            <meta property="og:site_name"    content={BRAND_NAME} />
            <meta property="og:locale"       content="es_EC" />
            <meta property="og:url"          content={url} />
            <meta property="og:title"        content={fullTitle} />
            <meta property="og:description"  content={description} />
            <meta property="og:image"        content={image} />
            <meta property="og:image:width"  content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt"    content={`${BRAND_NAME} — Impresión y Diseño en Pasaje`} />

            {/* ── Twitter / X Card ── */}
            <meta name="twitter:card"        content="summary_large_image" />
            <meta name="twitter:site"        content="@imprentacordova" />
            <meta name="twitter:url"         content={url} />
            <meta name="twitter:title"       content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image"       content={image} />
            <meta name="twitter:image:alt"   content={`${BRAND_NAME} — Impresión y Diseño en Pasaje`} />

            {/* ── Favicon ── */}
            <link rel="icon"             type="image/png" href="/favicon.png" />
            <link rel="shortcut icon"    type="image/x-icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" sizes="180x180"    href="/apple-touch-icon.png" />
            <link rel="manifest"                            href="/site.webmanifest" />

            {/* ── JSON-LD: LocalBusiness ── */}
            {includeLocalBusiness && (
                <>
                    <script type="application/ld+json">
                        {JSON.stringify(LOCAL_BUSINESS_SCHEMA, null, 0)}
                    </script>
                    <script type="application/ld+json">
                        {JSON.stringify(FAQ_SCHEMA, null, 0)}
                    </script>
                </>
            )}
        </Helmet>
    );
};

// ── Hook de conveniencia ──────────────────────────────────────────────────────
/**
 * Genera props SEO optimizadas para páginas de producto o servicio específico.
 * Uso: <SEO {...pageSEO('Gigantografías HD', 'Descripción breve', '/gigantografias')} />
 */
export function pageSEO(
    pageTitle: string,
    pageDescription: string,
    path: string,
    opts: Partial<SEOProps> = {}
): SEOProps {
    return {
        title: `${pageTitle} | ${BRAND_NAME}`,
        description: pageDescription,
        url: `${SITE_URL}${path}`,
        ...opts,
    };
}
