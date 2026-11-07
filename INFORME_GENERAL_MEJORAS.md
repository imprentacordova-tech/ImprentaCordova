# INFORME GENERAL DE MEJORAS — Imprenta Córdova

**Fecha:** 28 de octubre de 2026
**Alcance:** Sistema de gestión interna + presencia web + extensión Chrome SRI
**Método:** revisión real del código, ejecución de build / tests / type-check y lectura de los conectores.

---

## 0. Resumen ejecutivo

El proyecto está **maduro y en gran medida funcional**. La arquitectura (React 18 + Vite + TypeScript + Supabase + backend Express en Render) es correcta y el negocio ya está modelado con sensatez: hay un flujo unificado de pedidos, distinción explícita entre comprobantes SRI y trabajos comerciales, despacho con cobro rápido, tracking, inventario y auditoría.

Se verificó en esta sesión:

| Verificación | Resultado | Detalle |
|---|---|---|
| `npm run build` | ✅ **EXIT 0** | Regla inquebrantable cumplida. |
| Tests (`vitest`) | ✅ **144/144** | Tras corregir el pool de workers (antes no arrancaban en Windows). |
| `npx tsc --noEmit` | ⚠️ **Errores previos** | ~25 errores de tipos en 5 archivos (documentos de impresión y `Dashboard`). **No rompen el build**, pero conviene limpiarlos. |
| Git | ✅ limpio, rama `main` | Remote: `github.com/imprentacordova-tech/ImprentaCordova`. |
| Conectores | 5/6 operativos | Cloudflare **no está usado** (opcional, gratis). |

**Lo más importante:** el sistema ya distingue "Comprobante Autorizado SRI (Tax)" de "Trabajo Comercial" en el flujo de Nueva Orden, y los documentos de impresión (Solicitud SRI, Recibo, Nota de Venta, etc.) están modelados con medidas reales confirmadas por el dueño. El grueso del trabajo restante es **pulido visual, completar el catálogo comercial y cerrar la deuda técnica de tipos**.

---

## 1. Conectores: estado real y recomendación

| Conector | Rol | Estado | Plan gratuito | Recomendación |
|---|---|---|---|---|
| **Supabase** | PostgreSQL + Storage + Realtime | ✅ Configurado (`VITE_SUPABASE_URL` / `ANON_KEY`) | 500 MB DB, 1 GB storage, 50 000 MAU | Mantener. Es la mejor opción gratuita para este stack. |
| **Git (GitHub)** | Control de versiones | ✅ Repo activo en `main` | Ilimitado (privado) | Mantener. |
| **Vercel** | Hosting frontend (PWA) | ✅ Auto-deploy desde `main` | Hobby gratuito | Mantener. Los muchos previews (`all_deployments.txt`) sugieren limpiar deployments viejos para no confundir. |
| **Render** | Backend SRI + firma + email | ✅ `cordova-sri-api.onrender.com` | Gratuito (el servicio **duerme a los ~15 min sin tráfico**) | ✅ Resuelto: `.github/workflows/keep-warm.yml` pinguea `/ping` cada 10 min (2026-11-07). Si el tráfico real crece, subir al plan de $7/mes sigue siendo la opción de fondo. |
| **Resend** | Correo transaccional | ✅ Vía backend (`RESEND_API_KEY` solo en Render) | 100 correos/día, 3000/mes | Mantener. Clave **nunca** en el frontend (ya está bien resuelto). |
| **Cloudflare** | DNS / CDN / SSL / WAF | ❌ **No está en el código** | Gratuito | **Recomendado añadir** delante del dominio `imprentacordova.net`: CDN + SSL + protección DDoS + caché estática, sin costo. No requiere tocar código: solo apuntar el DNS. |
| **Google Gemini** | IA / OCR de RUC / análisis de arte | ✅ Vía backend (`/api/v1/ai/generate`) | Gratuito (cuota) | Mantener. Ya **no** se empaqueta el SDK ni la clave en el navegador. |

> **Aviso de deriva de configuración:** `.env.example` todavía lista `VITE_GEMINI_API_KEY` como variable del frontend, pero el código ya **no** la lee desde el navegador (todo pasa por el backend). Esa línea debe **eliminarse** del ejemplo para no inducir a filtrar la clave. Igual revisar que en Vercel no exista esa variable `VITE_*` vieja.

**¿Hay alguno gratuito?** Sí: Supabase, Vercel, Render, Resend, Cloudflare y Gemini **todos tienen plan gratuito**. El único que conviene vigilar es Render (cold-start) y, si el volumen de correo crece, Resend.

---

## 2. Flujo de Nueva Orden (Nuevo Pedido)

**Estado:** muy bueno. Es el módulo mejor resuelto del sistema.

### Lo que ya está bien (confirmado en `pages/NuevoPedido.tsx`)
- Asistente de 4 pasos + confirmación, con teclado (`Alt + ← →`), progreso animado y renovación express de mostrador.
- **Enmarcado dual explícito** en el Paso 1:
  - 🏛️ **Comprobantes Autorizados SRI (Tax)** → emite *Solicitud de Autorización de Impresión* (Sin IVA), requiere RUC y secuencia auditada.
  - 💼 **Papelería Comercial & Publicidad** → emite *Recibo de Taller* (+15% IVA), sin trámite fiscal.
- Motor de precios único (`services/orderPricing.ts`) con IVA condicional (SRI no grava), recargo de urgencia y escala por volumen.
- Persistencia de `modeloImpresion` y `tramiteSri` en la orden (la extensión y el documento de impresión hablan el mismo idioma).

### Recomendaciones (P1)
1. **Unificar los dos catálogos del Paso 1.** Hoy conviven `CATALOGO_RAPIDO` (10 ítems hardcodeados) y el `ServiceSelector` ("Catálogo Completo"). Idealmente ambos deberían beber del **mismo** `MASTER_CATALOG` / `productos` de Supabase para no mantener dos listas de precios a mano.
2. **Migrar `ServiceSelector` al tema claro "Marino & Oro".** Es de las pocas piezas que aún usa clases Tailwind oscuras (`brand-blue`, `slate`). Rompe la armonía visual dentro del flujo.
3. **Añadir la visual dinámica del talonario** en el Paso 1 (ver §5), de modo que al elegir "2 blocks" se vean 2 cuadernos.

---

## 3. Despacho (`pages/Retiros.tsx` + `ModalDespachoEntrega`)

**Estado:** completo y bien diseñado. Tiene:
- Buscador express por **N° de orden / QR / RUC / teléfono**.
- Adelantamiento de orden de Proceso → Vitrina para entrega en mostrador.
- 4 métricas en vivo (en vitrina, saldo por cobrar, rezagados >48 h, retirados hoy).
- Notificación por **WhatsApp y correo (Resend)** al estar "Listo".
- Modal de despacho con caja rápida y registro de receptor (commit `2c1e2aa`).

### Recomendaciones (P1/P2)
1. **Escáner de QR real** (cámara) además del ingreso manual por PIN — para el flujo de mostrador "cliente llega con ticket".
2. **Rezagados con acción de un clic** ya existe; se puede añadir un recordatorio automático (WhatsApp) programado a las 48 h.
3. Confirmar que el `ModalDespachoEntrega` cierra la orden en `ENTREGADO` y dispara el correo de confirmación (ya implementado) y que **todo movimiento queda en `historial`** (regla de auditoría).

---

## 4. Distinción SRI vs Comercial — aclaración de negocio

Esta es la regla que el dueño pidió dejar **bien clara**:

| | **Pedido SRI / Doc SRI** | **Trabajo Comercial** |
|---|---|---|
| Qué es | Comprobante tributario autorizado (Factura, Nota de Venta RIMPE, Liquidación, Guía, Retención, etc.) | Tarjetería, volantes, bingo, rifas, sellos, gigantografía, empastados, etc. |
| Requiere | **Clave de cuenta SRI** para la solicitud online + llenar el formulario | Nada ante el SRI |
| Documento que emite | **Solicitud de Autorización de Impresión** (A5 / medio oficio) | **Recibo de caja / ticket de taller** |
| IVA | **Exento** | **+15%** |
| Copia al cliente | Sí — se imprime copia de la solicitud | Sí — recibo en doble copia |
| Registro | Se registra en el sistema web para **generar y rastrear** el trabajo (con secuencia y autorización) | Se registra igual, sin campos fiscales |

> **La extensión de Chrome** (`sri-chrome-extension/`) hace exactamente ese puente: **llena la solicitud de preimpresos en el portal del SRI** desde el navegador y **registra la orden de vuelta** en el sistema vía backend. Es la pieza "pro económica" del flujo: el operador no digita dos veces.

**Recomendación:** añadir en el Paso 1 una línea de ayuda contextual que recuerde: *"SRI = requiere clave de cuenta SRI para solicitud online; Comercial = no requiere trámite"*. El enmarcado ya lo dice, pero un tooltip refuerza la decisión rápida.

---

## 5. Imágenes dinámicas de productos (nuevo)

Se implementó un componente vectorial **`components/ProductVisual.tsx`** que dibuja los productos **sin depender de URLs externas** (nunca se rompe por imgur caído):

- **Talonario = cuaderno con "pasta café"** (cubierta marrón `#7C4A2A`), con el **taco de hojas central que crece según las hojas** (`más hojas → intermedio más grueso`).
- **N blocks → N cuadernos** uno al lado del otro (con contador `+N` si son muchos).
- Píldora dorada **"SRI · TAX"** en comprobantes autorizados, "BLOCK ENCOLADO" en comerciales.
- Deriva automáticamente blocks/hojas desde el nombre (`"Facturero A5 3x Blocs (50x2)"` → 3 cuadernos, 50 hojas).
- Productos no-talonario reciben una tarjeta genérica con la inicial de la categoría (nadie queda "Sin imagen").

**Dónde se conectó:**
- `components/orders/ServiceSelector.tsx` — tarjetas del catálogo completo.
- `pages/Productos.tsx` — grilla y vista previa del modal (reemplaza "Sin imagen").

**Recomendación (P1):** conectarlo también al `CATALOGO_RAPIDO` del Paso 1 de Nueva Orden, y pasarle la **cantidad/blocks reales** que se están configurando en el Paso 2 para que la ilustración refleje el pedido en vivo.

---

## 6. Catálogo comercial (completado)

Se añadieron al `MASTER_CATALOG` (`services/catalogData.ts`) los productos que faltaban y que el dueño pidió:

- **Cartones de Bingo (Tablas 5x5)** — comercial.
- **Rifas / Boletos de Rifa (Numerados)** — comercial.
- **Empastado de Libros / Tesis (Tapa Dura)** — comercial.

> **Nota importante:** el manifiesto de diseño prohíbe un *módulo* de "Libros/Editoriales" (la imprenta **no edita** libros). El **empastado** es distinto: es un *servicio de acabado* (encuadernar una tesis/libro ya impreso), que sí es legítimo para una imprenta. Quedó catalogado con esa aclaración en su descripción.

---

## 7. Gestión interna (back-office)

| Módulo | Estado | Observación |
|---|---|---|
| Dashboard | ✅ | Métricas, KPIs. |
| Trabajos / Órdenes | ✅ | Listado + cajón de detalle (`OrderDrawer`) + `TrabajoDetalle`. |
| KDS (Taller) | ✅ | Monitor de producción. |
| Inventario | ✅ | Con alerta de stock bajo (papel químico crítico). |
| Proveedores | ✅ | Con tareas. |
| Finanzas / Cuentas / Facturación SRI | ✅ | Caja, cuentas por cobrar, facturación electrónica. |
| Clientes | ✅ | Con `fiscal_data` y establecimientos. |
| Auditoría | ✅ | `logActivity()` + `localStorage` + auto-purga 3 meses. |
| Usuarios / Configuración | ✅ | Roles Admin/Operador/Diseñador. |

**Hallazgos a reforzar (P2):**
- Persistencia local (`localStorage`) como respaldo offline: confirmar que está activa en todos los contextos críticos (Trabajos, Clientes, Inventario) para la "estabilidad de hierro" que pide Pedro.
- Supabase Realtime está cableado en varios contextos; verificar que KDS y Despacho reflejen cambios al instante sin recargar.

---

## 8. UI/UX — minimalista, animado, armonioso

**Estado:** hay **dos sistemas de tema coexistiendo**:

1. **"Marino & Oro"** (claro, tokens en `components/panelTheme.ts`) — usado por PanelInterno, NuevoPedido, Retiros, Productos, etc. Es el objetivo final.
2. **Tema oscuro legado** (`obsidian`, `liquid-gold`, `brand-blue` en `tailwind.config.js`) — aún visible en `ServiceSelector`, `Catalog`, `Services`, `Hero`, landing y varias páginas.

La migración es **página por página** (según el propio manifiesto). Lo que falta por migrar rompe la armonía:

- `components/orders/ServiceSelector.tsx` (usa Tailwind oscuro dentro del flujo claro).
- `components/Catalog.tsx`, `Services.tsx`, `Hero.tsx` y la landing pública.

**Recomendación (P1):** terminar la migración de esas piezas al sistema claro. La regla de oro: fondo `#F7F9FF`, superficies blancas, azul `#16309B` para acción, oro `#FFC61A` solo como acento de marca, español de Ecuador, sin `rounded-full` en cards grandes.

Las animaciones ya existen y son correctas (`framer-motion`, `rise`, `blink`, progreso animado, `prefers-reduced-motion` respetado). No hace falta más: falta **coherencia**, no más efectos.

---

## 9. Deuda técnica detectada (errores de tipos)

`npx tsc --noEmit` reporta ~25 errores **preexistentes** (no bloquean el build, pero indican deriva de tipos). Archivos afectados:

| Archivo | Naturaleza del error |
|---|---|
| `pages/Dashboard.tsx` | Variantes de `framer-motion` con `type: string` (debe ser el literal de la animación). |
| `pages/NotaDeVenta.tsx` | `fechaCreacion` no existe en `Trabajo`; `telefono` tipado `string` vs `string[]`; opciones de `html2pdf` con `format: number[]`. |
| `pages/ReciboEpson.tsx` | Objeto literal incompleto de `Trabajo`/`Cliente`; `ModeloImpresion` tipado como `string`. |
| `pages/SolicitudImpresion.tsx` | `ModeloImpresion` sin importar; `secuenciaInicio/Fin` no existen en `Trabajo`; estados como string. |
| `pages/Tracking.tsx` | Usa `arte_aprobado` (snake_case) en vez de `arteAprobado`. |

**Recomendación (P0/P1):** corregir estos tipos (son mecánicos y de bajo riesgo) y añadir `tsc --noEmit` al script de CI. Un proyecto "listo para producción" no debería tener type-drift acumulado.

**Corregido en esta sesión:**
- ✅ `sri-chrome-extension/.../popup/popup.js` tenía una llave `}` faltante (rompía el chequeo de tipos).
- ✅ `vitest.config.ts` usaba `pool: 'threads'` que colgaba los workers en Windows → ahora `forks` + `maxWorkers: 1`.

---

## 10. Plan de acción priorizado

### P0 — Antes de salir a producción
1. ✅ Build en verde (ya está).
2. ✅ Tests en verde (ya está, 171 en 13 archivos).
3. Quitar `VITE_GEMINI_API_KEY` de `.env.example` (deriva de seguridad/documentación).
4. Verificar que en Vercel **no** existan secretos viejos con prefijo `VITE_` (Resend / service_role / Gemini). La `GUIA_DESPLIEGUE` ya lo documenta: rotar lo que se filtró.

### P1 — Calidad y coherencia (alta prioridad)
5. Corregir los ~25 errores de tipos de `Dashboard`, `NotaDeVenta`, `ReciboEpson`, `SolicitudImpresion`, `Tracking`.
6. ✅ Landing pública migrada al tema "Marino & Oro" (`VisualLanding`, `PublicNavbar`, `CotizadorRapido`, `RucValidatorWidget`). Queda pendiente el resto de piezas oscuras (`ServiceSelector`, `Contact`, `Footer`, `Catalog`).
7. Unificar `CATALOGO_RAPIDO` y `ServiceSelector` a una sola fuente (`productos`/`MASTER_CATALOG`).
8. Conectar `ProductVisual` al Paso 1 (catálogo rápido) y al Paso 2 (cantidad/blocks en vivo).
9. ✅ Cloudflare documentado paso a paso en `GUIA_DESPLIEGUE_Y_OPERACION.md` → PASO 8 (solo DNS, plan Free; incluye el detalle de no perder los registros de Resend).

### P2 — Valor operativo (cuando P1 esté listo)
10. ✅ Escáner QR por cámara en Despacho (`components/orders/QrScannerModal.tsx`, Ronda 3).
11. ✅ Recordatorio automático a rezagados >48 h (`services/recordatorios.ts` + cron del backend + migración `20260915`).
12. ✅ Calentamiento del backend de Render: `.github/workflows/keep-warm.yml` pinguea `/ping` cada 10 min (2026-11-07).
13. Persistencia offline/localStorage: **no existe** en `TrabajosContext`, `ClientesContext` ni `InventarioContext` (solo `AuthContext` usa `localStorage`, para la sesión). No es una auditoría pendiente — es una feature a construir desde cero (cache + hidratación + merge al reconectar), decidido no abordar en esta sesión por su alcance.

---

## 11. Cambios realizados en esta sesión

### Ronda 1 (informe + verificación)
1. **`sri-chrome-extension/.../popup/popup.js`** — corregida llave `}` faltante en `loadClientConfig()` (desbloquea `tsc`).
2. **`vitest.config.ts`** — `pool: 'forks'` + `maxWorkers: 1` (los tests pasan de 11 errores de worker a **144/144 OK**).
3. **`components/ProductVisual.tsx`** — nuevo: ilustración SVG dinámica de talonario (cuaderno con pasta café, taco creciente, N blocks = N cuadernos) + genérico.
4. **`services/catalogData.ts`** — añadidos Bingo, Rifas y Empastado (comercial) al catálogo maestro.

### Ronda 2 (P0/P1 — "DALE CON TODO")
5. **`.env.example`** — eliminada `VITE_GEMINI_API_KEY` (deriva de seguridad; la clave ahora vive solo en el backend).
6. **Cero errores de tipos (`tsc --noEmit` → EXIT 0).** Se corrigieron los 28 errores en:
   - `Dashboard.tsx` — `Variants` de framer-motion tipados, icono `RefreshCwIcon`→`RefreshIcon`, comparación de rol.
   - `Layout.tsx` / `AuthContext.tsx` — comparación de rol `'Administrador'` (no existe; el canon es `'Admin'`).
   - `NotaDeVenta.tsx` — `telefono` a `string[]`, `fechaCreacion`→`fechaEntrada`, `detalles`→`detalle`, html2pdf `format` tipado, campos faltantes de `Trabajo`.
   - `ReciboEpson.tsx` — campos faltantes de `Trabajo`/`Cliente`, `fechaRegistro`→`creadoEn`, `setModelo` con `resolverModelo`, html2pdf tipado.
   - `SolicitudImpresion.tsx` — import de `ModeloImpresion`/`TrabajoEstado`/`Regimen`, `orden` numérico, estado enum, campos de `Cliente`/`Trabajo`.
   - `Tracking.tsx` — `arte_aprobado`→`arteAprobado` (camelCase).
   - `types.ts` — añadidos `secuenciaInicio?` / `secuenciaFin?` (rango de secuencia SRI, opcional).
7. **`components/orders/ServiceSelector.tsx`** — migrado por completo al tema claro "Marino & Oro" (ya no usa Tailwind oscuro `brand-blue`/`slate`).
8. **`pages/NuevoPedido.tsx`** — conectado `ProductVisual` a las tarjetas del catálogo rápido del Paso 1 (talonarios se ven como cuaderno).
9. **`pages/Productos.tsx`** — conectado `ProductVisual` a la grilla y al modal (reemplaza "Sin imagen").

**Verificación final (después de todo):**
- `npm run build` → **EXIT 0** ✅
- `vitest` → **144/144 tests** ✅
- `npx tsc --noEmit` → **0 errores** ✅

### Ronda 3 ("Subir la barra" — pulido premium)
10. **`components/ProductVisual.tsx` v2** — talonario elevado: lomo cosido, veta de cuero, marco dorado, abanico de hojas con sombra y filo, y **N cuadernos según blocks**. Además, ilustraciones por categoría (tarjetas, sellos, lonas, etiquetas, packaging, merch, publicidad) para que **todo** el catálogo se vea intencional, no solo los talonarios.
11. **`components/orders/QrScannerModal.tsx`** — escáner de código QR por cámara (API nativa `BarcodeDetector` + `getUserMedia`, sin dependencias) con marco de enfoque y guía de error honesta.
12. **`pages/Retiros.tsx`** — botón 📷 en el buscador express del Despacho; al detectar el QR extrae el N° de orden (URL, `orden=X` o dígitos) y ejecuta la búsqueda/adelanto en un clic.
13. **`components/ProductManagementModal.tsx`** — vista previa viva: sin foto muestra la ilustración dinámica del producto que se está editando (talonario → cuaderno).

### Ronda 4 (Extensión SRI + Menús internos)
14. **Análisis de la extensión Chrome** (`sri-chrome-extension/`): se verificó que funciona de forma **nativa** — inyecta barra de auto-login, HUD con stepper de 5 pasos, auto-piloto que recorre el flujo de preimpresos del SRI (7 pasos) seleccionando "Imprenta Córdova (8634)", y un cajón final que registra la orden, la sincroniza a Supabase vía backend y abre web/impresión/WhatsApp. Todo pasa por el backend (service_role nunca en el paquete).
15. **Seguridad de la extensión** — eliminada la **clave SRI hardcodeada** (`GrafiCoR8634@`) que venía como default en `content.js`; ahora si no hay clave configurada muestra una guía en vez de autocompletar.
16. **Corrección menor** — mes `juno`→`junio` en `parseSRIDateToISO`.
17. **`public/extension-cordova.zip`** — reconstruido desde la fuente (de 952 KB a 128 KB, sin fotos de referencia) para que "Descargar Extensión" entregue la versión actual.
18. **Menús internos** (`Layout.tsx` + `MobileFloatingNav.tsx`):
    - Añadidos **`/productos` (Catálogo de Productos)** y **`/produccion` (Flujo de Producción)** al sidebar — estaban huérfanos (rutas existían pero no se podía llegar desde el menú).
    - Badge "Descargar Extensión" corregido `v2.1` → `v2.3`.

### Ronda 5 (Revisión final "listo para usar")
19. **`README.md`** — reemplazado el boilerplate de AI Studio por un README real del proyecto: stack, requisitos, variables de entorno (frontend y backend), scripts, estructura, despliegue y documentación.
20. **`.env.example`** — añadida `VITE_RENDER_API_KEY` (clave anti-abuso pública que el frontend ya leía y faltaba documentar).
21. **`public/og-image.png`** — creada la imagen Open Graph 1200×630 (faltaba: los enlaces compartidos no mostraban imagen). Script reproducible en `scripts/make_og.py`.
22. **`tsconfig.json`** — excluidos `**/*.timestamp-*.mjs` (archivos temporales de Vite que hacían fallar `tsc` de forma intermitente al correr junto al build) y eliminado el timestamp huérfano de la raíz.

**Verificación final:**
- `npm run build` → **EXIT 0** ✅ (incluye `dist/og-image.png` y `dist/extension-cordova.zip`)
- `vitest` → **171/171 tests** ✅
- `npx tsc --noEmit` → **0 errores** ✅

### Ronda 6 (Catálogo súper pro: documentos tributarios completos)
23. **`services/catalogData.ts`** — catálogo maestro completo: **30+ documentos tributarios SRI** organizados por régimen (RIMPE Negocio Popular, RIMPE Emprendedor, Régimen General), formatos por blocks, servicios electrónicos y todos los trabajos comerciales (tarjetas, publicidad, etiquetas, packaging, gran formato, merch, oficina, bingo/rifas, empastado, combos). Cada ficha trae descripción, especificaciones y **precio de referencia**.
24. **`contexts/ProductosContext.tsx`** — `seedCatalog` reescrito: la tabla `productos` no tiene UNIQUE en `nombre`, así que el `upsert(onConflict:'nombre')` fallaba en silencio. Ahora inserta los productos nuevos y actualiza los existentes por `id`, e incluye `specs`.
25. **`contexts/DataContext.tsx`** — emojis por categoría para todo el catálogo nuevo.
26. **`pages/Productos.tsx`** — rediseño súper pro/minimalista: buscador dominante (nombre/categoría/descripción/especificaciones), categorías con emoji y contador, fichas con ilustración dinámica + sello SRI + precio + edición, modal de detalle con especificaciones y botón "Restaurar maestro".
27. **`pages/NuevoPedido.tsx`** — el Paso 1 ya no usa una lista de 10 ítems hardcodeada: consume el catálogo real (`productos`), con respaldo estático si aún no cargó. Filtros de categoría dinámicos y limpios, búsqueda por nombre/categoría/descripción/especificación, fichas con ilustración y "Configurar detalles →" que agrega el ítem y pasa al Paso 2 (permite órdenes multi-ítem).
28. **`components/orders/ServiceSelector.tsx`** — se evita la pestaña duplicada "SRI" cuando el catálogo ya trae "Documentos SRI".

**Verificación Ronda 6:**
- `npm run build` → **EXIT 0** ✅
- `vitest` → **171/171 tests** ✅
- `npx tsc --noEmit` → **0 errores** ✅
