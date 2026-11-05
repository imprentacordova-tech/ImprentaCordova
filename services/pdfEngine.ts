/**
 * Carga diferida del motor de PDF (html2pdf.js + jsPDF + html2canvas).
 * ====================================================================
 *
 * `html2pdf.js` arrastra `jspdf` y `html2canvas`: ~900 kB sin comprimir.
 * Tres páginas lo importaban de forma estática (NotaDeVenta, ReciboEpson,
 * SolicitudImpresion), así que Rollup lo metía en el chunk COMPARTIDO de esas
 * tres páginas y se descargaba al abrir cualquiera de ellas — incluso cuando
 * el usuario solo iba a imprimir con Ctrl+P y nunca pedía el PDF.
 *
 * Con esta carga perezosa el motor baja la primera vez que alguien pulsa
 * "Descargar PDF" y queda en caché del módulo para las siguientes.
 */

// `html2pdf.js` no trae tipos: el default export es la fábrica.
type Html2PdfFactory = () => any;

let promesa: Promise<Html2PdfFactory> | null = null;

/**
 * Devuelve la fábrica `html2pdf()`. La primera llamada descarga el chunk;
 * las siguientes reutilizan la misma promesa.
 */
export function cargarHtml2Pdf(): Promise<Html2PdfFactory> {
  if (!promesa) {
    promesa = import('html2pdf.js')
      .then((mod) => ((mod as any).default ?? mod) as Html2PdfFactory)
      .catch((err) => {
        // Si falla la red, se limpia la caché para que el siguiente intento reintente.
        promesa = null;
        throw err;
      });
  }
  return promesa;
}
