# Auditoría del sitio público — noviembre 2026

Fuente de reglas: skill `ui-ux-pro-max` (guías `ux`, prioridades 1–8). La paleta y la
tipografía **no** se cambian: Marino & Oro es decisión tomada (ver `design_manifest.md`);
del skill se toman reglas de accesibilidad, rendimiento e interacción.

Archivos auditados: `pages/VisualLanding.tsx`, `pages/SolicitarOnline.tsx`,
`pages/Tracking.tsx`, `pages/Vitrina.tsx`, `components/PublicNavbar.tsx`,
`components/public/CotizadorRapido.tsx`, `components/public/RucValidatorWidget.tsx`.

| # | Regla (skill) | Severidad | Hallazgo | Dónde | Arreglo |
|---|---|---|---|---|---|
| 1 | Performance · imágenes livianas (WebP/AVIF) | Alta | Las 6 fotos de la portada son PNG de 1024×1024 y **650–950 KB cada una** (≈4,4 MB en total). En 4G de El Oro la portada tarda varios segundos. | `public/images/landing/*.png` | Convertir a WebP (calidad 78) y servir esas. |
| 2 | Performance · reservar espacio (CLS < 0,1) y lazy loading | Alta | `<img>` sin `width`/`height` ni `loading`: la página "salta" al cargar y baja todo de entrada. | `VisualLanding.tsx:426,458,489,600,995`, `Vitrina.tsx:329,428`, `Tracking.tsx:480`, `PublicNavbar.tsx:60` | `width`/`height` reales + `loading="lazy"` + `decoding="async"`; la foto principal del hero con `fetchPriority="high"`. |
| 3 | Style · SVG en vez de emoji como ícono | Media | El ticker superior usa emoji (⭐ ⚡ 🎨 🚚 📍) como íconos: se ven distinto en cada teléfono y el lector de pantalla los lee en voz alta. | `VisualLanding.tsx:18-22, 833`; `RucValidatorWidget.tsx:216`; `CotizadorRapido.tsx:266` | Íconos Lucide (`Star`, `Zap`, `Palette`, `Truck`, `MapPin`) con `aria-hidden`. |
| 4 | Accessibility · foco visible | Alta | No hay estilo de foco propio: depende del navegador y sobre fondos marino casi no se ve. | `index.css` | `:focus-visible` global con anillo royal de 2 px y separación de 2 px. |
| 5 | Typography · texto < 12 px | Media | 31 usos de `text-[9–11px]`; la mayoría son etiquetas/chips (aceptable), pero algunos son texto de lectura. | `RucValidatorWidget.tsx` (8), `VisualLanding.tsx` (7), `Tracking.tsx` (6) | Subir a 12 px los textos de lectura; dejar chips/etiquetas. |
| 6 | Contenido · consistencia | Alta | Dirección distinta entre la web ("Av. Las Palmeras y Calle 4ta") y el recibo impreso ("Colón entre Sucre y Rocafuerte"). Cifras de marketing ("2 400+", "800+", "99 %") sin fuente. | `VisualLanding.tsx` | **Bloqueado por el dueño** (Task C3). |
| 7 | Animation · reduced motion | — | Ya cumplido: `MotionConfig reducedMotion="user"` en landing y `/solicitar`. | — | — |
| 8 | Forms · error cerca del campo | Baja | `/solicitar` muestra el error debajo del paso, no junto al campo. Aceptable para 3–5 campos por paso. | `SolicitarOnline.tsx` | Sin cambio por ahora. |

## Verificación (Task C2)

- Peso de imágenes antes/después.
- Recorrido en el navegador a 375 px y 1280 px.
- Test estático: toda `<img>` de páginas públicas lleva `width`, `height` y `loading`.
