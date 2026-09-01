# Manifiesto de Diseño: Imprenta Córdova — Sistema "Marino & Oro"

> **PARA FUTUROS AGENTES: LEE ESTO COMPLETO ANTES DE TOCAR UNA SOLA LÍNEA DE CÓDIGO.**

Este documento establece las reglas de la interfaz de gestión "Córdova Systems". Todo agente, modelo de IA o desarrollador humano DEBE adherirse a estos principios.

**Implementación de referencia:** [`pages/PanelInterno.tsx`](pages/PanelInterno.tsx) (ruta `#/panel-interno`) es la traducción fiel del diseño maestro `Panel-Interno.dc.html` (proyecto Claude Design *"Obsidian & Gold proyecto"*, id `5a75a291-67a0-4d75-b96a-9a31f7019042`). Cualquier duda de estilo se resuelve mirando ese archivo.

---

## 0. Reglas Críticas Inquebrantables

> [!CAUTION]
> **NUNCA hacer lo siguiente:**
> 1. **NUNCA** usar fondos negros / `obsidian` / `bg-brand-dark` en vistas internas. **El tema es CLARO.** Fondo base `#F7F9FF`, superficies `#FFFFFF`. Lo único oscuro permitido son *tarjetas de acento puntuales* en marino `#0A1140` (bloques tipo "Urgentes hoy", "Saldo en caja", "Resultado").
> 2. **NUNCA** escribir texto en inglés en la interfaz. TODO en **Español Latino (Ecuador)**.
> 3. **NUNCA** usar el oro `#FFC61A` para texto corrido ni para botones de acción. El oro es acento de **marca**: KPIs, puntos de estado, badges, el botón "Nueva Orden" del sidebar. El color de **acción primaria** es el azul marino `#16309B`.
> 4. **NUNCA** usar `rounded-full` / `border-radius:99px` en contenedores o cards grandes. Cards e inputs: `10–16px`. El radio completo (`99px`) es solo para puntos, chips, píldoras de estado y avatares.
> 5. **NUNCA** eliminar ni simplificar el hook `useOrder.ts` ni la captura de `tempClient` (cédula, teléfono, nombre).
> 6. **NUNCA** modificar los documentos de impresión (`NotaDeVenta`, `ReciboAbono`, `OrdenProduccion`, `SolicitudImpresion`, `ReciboEpson`) — esos SÍ van en papel blanco puro.
> 7. **NUNCA** proponer módulos de "Libros" o "Editoriales". La imprenta NO fabrica libros.

---

## 1. Stack Técnico

| Componente | Tecnología |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5 |
| **Estilos** | Tokens del sistema (ver §2). Estilos inline o Tailwind; el diseño maestro usa estilos inline. |
| **Router** | react-router-dom (HashRouter) |
| **Backend** | Supabase (PostgreSQL) + Google Apps Script (cloud sync) |
| **Hosting** | Vercel (auto-deploy desde `main`) |
| **Fuentes** | Outfit (display), Inter (body), JetBrains Mono (mono) — Google Fonts |

> [!NOTE]
> **Migración en curso.** `tailwind.config.js` todavía trae los tokens del tema oscuro anterior (`obsidian`, `liquid-gold #D4AF37`, etc.) y varias páginas siguen renderizando en oscuro. Se migra **página por página** al sistema claro de este manifiesto, tomando `PanelInterno.tsx` como patrón. Al migrar una página, no romper las demás.

---

## 2. Sistema de Diseño: "Marino & Oro"

### 2.1 Paleta de Marca (del LOGO)

El logo es la **C** azul con la **I** roja de contorno amarillo. Sus colores puros:

| Color | HEX crudo del logo | Uso en marca |
|---|---|---|
| Azul Córdova | `#000088` | Identidad, la "C" |
| Rojo Córdova | `#E00000` | Identidad, la "I" — urgencia / alertas |
| Amarillo Córdova | `#F0F810` | Contorno de la "I" — acento dorado |
| Blanco hueso | `#F8F8F8` | Contorno del logo, fondos |

### 2.2 Tokens de Interfaz (aplicados)

Los colores crudos se **templan** para pantalla. Estos son los valores que se usan en el código:

| Token | HEX | Uso |
|---|---|---|
| `ink` | `#0A1140` | Títulos, sidebar, tarjetas de acento oscuras |
| `royal` (primario) | `#16309B` | Botones de acción, enlaces, estado "En Prensa" |
| `royal-hover` | `#0F2280` | Hover de botón primario |
| `gold` (acento marca) | `#FFC61A` | KPIs, puntos, badges, botón "Nueva Orden" del sidebar |
| `gold-hover` | `#F0B400` | Hover del botón oro |
| `danger` | `#E70101` | Urgente, errores, "Sin avisar" |
| `bg` | `#F7F9FF` | Fondo de la aplicación |
| `surface` | `#FFFFFF` | Cards, header, sidebar de contenido |
| `surface-alt` | `#FAFBFF` | Cabeceras de tabla, pies de card |
| `border` | `#E4E8F4` | Borde estándar de cards |
| `border-strong` | `#D7DDF0` | Bordes de inputs y botones secundarios |
| `divider` | `#EEF0F8` / `#F2F4FA` | Líneas internas y separadores de fila |
| `chip-blue` | `#EEF1FC` | Fondo de chips/badges azules, hover suave |
| `soft-gray` | `#F2F4FA` | Fondo de botones "suaves" |

**Familias auxiliares y capa sobre marino** (añadidas en `panelTheme.ts` para el cajón de detalle; usarlas en vez de hex sueltos):

| Grupo | Tokens |
|---|---|
| Ámbar | `goldBg #FFFBEB` · `goldBorder #F4E3A8` · `goldText #7A5A00` · `goldTextStrong #B45309` |
| Verde | `successBg #F2F7F2` · `successBorder #D8E8DC` · `successStrong #155C33` |
| Rojo | `dangerBg #FDEEEE` · `dangerText #B91C1C` |
| Violeta | `violet #6D28D9` · `violetBg #F5F3FF` |
| Sobre marino | `onInk #FFFFFF` · `onInkSoft #C2CAE6` · `onInkMuted #9AA6CE` · `onInkFaint #8E9AC4` · `onInkSuccess #7BE0A6` · `onInkDanger #FF9B9B` · `onInkLayer` · `onInkBorder` · `onInkGoldLayer` · `onInkDangerLayer` · `scrim` |

**Texto:**

| Nivel | HEX |
|---|---|
| Fuerte (títulos, datos clave) | `#0A1140` |
| Cuerpo | `#3C4763` |
| Atenuado (descripciones) | `#6B7590` |
| Tenue (labels, timestamps) | `#8A93AE` |
| Fantasma (firmas, placeholders) | `#A6AFC8` |

### 2.3 Semáforo de Producción (estados)

Cada estado tiene: **texto / fondo / borde / punto**.

| Estado | texto | fondo | borde | punto |
|---|---|---|---|---|
| Pendiente | `#B45309` | `#FFFBEB` | `#F4E3A8` | `#FFC61A` |
| En Diseño | `#6D28D9` | `#F5F3FF` | `#DDD3FE` | `#8B5CF6` |
| En Prensa | `#16309B` | `#EEF1FC` | `#D7DDF0` | `#16309B` |
| Listo | `#1B6E3E` | `#F2F7F2` | `#D8E8DC` | `#1B8A4B` |
| Entregado | `#5B6480` | `#F5F6FA` | `#E4E8F4` | `#A6AFC8` |

**Finanzas:** ingreso `#1B6E3E`, egreso `#B91C1C`. **Stock bajo:** `#B91C1C` sobre `#FEF2F2` / borde `#FBD5D5`.

### 2.4 Tipografía

- **Display (`Outfit`)**: títulos y cifras grandes. `font-weight:600`, `letter-spacing:-.035em` (títulos) / `-.04em` (cifras).
- **Body (`Inter`)**: todo el texto de interfaz.
- **Mono (`JetBrains Mono`)**: N° de orden, montos, horas, hashes de auditoría, atajos de teclado.

| Rol | Especificación |
|---|---|
| Eyebrow | `10.5px / 800 / uppercase / tracking .32em / #8A93AE` |
| H1 de vista | `Outfit 27px / 600 / -.035em / #0A1140` |
| H2 de card | `Outfit 16–17px / 600 / -.03em / #0A1140` |
| Cabecera de columna | `10px / 700 / uppercase / tracking .14em / #8A93AE` |
| Label de campo | `11px / 700 / uppercase / tracking .14em / #8A93AE` |
| KPI (valor) | `Outfit 30px / 600 / -.04em / #0A1140` |

### 2.5 Botones

| Tipo | Patrón |
|---|---|
| **Primario** | `bg #16309B · texto #fff · radius 10 · padding 11×18 · 13px/600` — hover `#0F2280` |
| **Secundario** | `bg #fff · texto #16309B · borde 1px #D7DDF0 · radius 10` — hover `border-color #16309B` |
| **Suave** | `bg #F2F4FA · texto #16309B · radius 9 · 12.5px/600` — hover `#EEF1FC` |
| **Oro (marca)** | `bg #FFC61A · texto #0A1140 · radius 11 · 13px/700` — hover `#F0B400`. Solo "Nueva Orden" del sidebar y CTAs de marca. |
| **Éxito / descarga** | `bg #1B6E3E · texto #fff` — hover `#155C33` |
| **Peligro** | `texto #FF6B6B · hover bg rgba(231,1,1,.1) · borde rgba(231,1,1,.25)` |

### 2.6 Cards y superficies

- **Card estándar:** `background:#fff; border:1px solid #E4E8F4; border-radius:14–16px`. Hover (si es clicable): `box-shadow:0 14px 28px -20px rgba(10,17,64,.4)`.
- **Card de tabla:** `border-radius:16px; overflow:hidden`; cabecera y pie en `#FAFBFF` con `border 1px #EEF0F8`; filas separadas por `1px #F2F4FA`, hover de fila `background:#F7F9FF`.
- **Tarjeta de acento (oscura):** `background:#0A1140; color:#fff; border-radius:16px`. Para métricas destacadas y bloques de urgencia.
- **Input:** `background:#F7F9FF; border:1px solid #D7DDF0; border-radius:10px; padding:12×14; 13.5px`. Campo monetario/sensible: fondo `#FFFBEB`, borde `#F4E3A8`.
- **Sidebar (`#0A1140`):** ítem activo → `background:rgba(255,198,26,.1); color:#FFC61A; box-shadow:inset 2px 0 0 #FFC61A`. Ítem inactivo `color:#C2CAE6`, hover `rgba(255,255,255,.04)`. Título de grupo activo en `#FFC61A`, inactivo `#5C6892`.

---

## 3. Jerarquía de Acción (Workflow Priority)

> [!IMPORTANT]
> **Prioridad: Velocidad sobre Burocracia.** El flujo de NuevoPedido es:
> 1. **Producto** — selección intuitiva del servicio y variante.
> 2. **Detalles** — cantidad, acabado, precio, abono.
> 3. **Cliente** — identificación (puede ir al final; "Identidad express").
>
> Si registrar una orden toma más de **30 segundos**, el sistema ha fallado.

---

## 4. Micro-interacciones (Feedback)

- **Entrada de contenido:** animación `rise` — `opacity 0→1` + `translateY(14px)→0`, `.6s cubic-bezier(.2,.8,.2,1)`.
- **Hover en cards/botones:** `transition .25s`. Cards de taller: `transform:translateY(-2px)` + sombra.
- **Puntos "vivos":** `blink 2s–2.4s ease-in-out infinite` (sistema en línea, urgentes, alertas).
- **Estados:** en progreso `animate-pulse`; éxito con verde `#1B6E3E`; error/urgente con rojo `#E70101`.

---

## 5. Diseño Responsivo

Breakpoints del diseño maestro: **1180 / 1024 / 780** (NO usar `xl:` como corte crítico).

| Ancho | Comportamiento |
|---|---|
| `> 1180px` | Layout completo 2–3 columnas, sidebar fijo. |
| `≤ 1180px` | Tablas con scroll horizontal propio; columnas `span 2` colapsan. |
| `≤ 1024px` | Sidebar pasa a *drawer* fijo con scrim; aparece botón hamburguesa. |
| `≤ 780px` | Header compacto sin buscador; barra de pestañas inferior fija (5 accesos); contenido con `padding-bottom` para la barra. |

---

## 6. Reglas de Negocio (Core Order Flow)

> [!WARNING]
> `useOrder.ts` y `DataContext.tsx` son el corazón del sistema. Máxima precaución.

- **`useOrder.ts`** maneja `tempClient`, `cartItems` (Map) y `sriData`.
  - **Identidad Express:** sin `selectedCliente`, capturar `tempClient` `{ nombre, telefono, cedula }`. NUNCA eliminar.
- **`CartItem`:** `customPrice` + `notas` por ítem. NUNCA sobreescribir en re-renders.
- **Enrutamiento post-orden:** `TrabajoTipo.SRI` → `/solicitud-impresion`; `TrabajoTipo.GENERAL` → `/recibo-abono`.

### 6.1 Aritmética de la orden — `services/orderPricing.ts` (módulo ÚNICO)

> [!CAUTION]
> **NUNCA** reimplementar estos cálculos en una página, un componente o una variante móvil.
> El handoff exige un solo módulo compartido; duplicarlo por dispositivo es el error clásico.

Cadena canónica: `subtotal → diseño → recargo por urgencia → base → IVA condicional → total → abono → saldo`.

| Regla | Valor | Dónde vive |
|---|---|---|
| IVA | `15%`, **solo si la línea grava** — los preimpresos SRI (`esSRI`) **no gravan** | `IVA_RATE` |
| Recargo por urgencia | `+15%` sobre subtotal + diseño (`prioridad: 'Urgente'`) | `RECARGO_URGENCIA` |
| Escala por volumen | `≥200 → 8%`, `≥500 → 15%` | `escalaVolumen()` |
| Atajos de abono | sin abono / 50% / total / +$10, topados al total | `atajosAbono()` |
| Redondeo | a centavos, en cada paso | `round2()` |

**Reparto con la calculadora existente:** el **precio de línea** lo sigue calculando `CalculadoraPrecios` /
`PriceCalculatorDisplay` sobre `Producto.precio` + `configCalculadora` (materiales, acabados, escalas propias del
producto). `orderPricing.ts` **no** la reimplementa: recibe el total de línea ya calculado y resuelve solo lo que es
de la orden. `escalaVolumen()` se usa **únicamente** en flujos rápidos que cotizan directo desde `Producto.precio`
(express, celular de recepción); en ítems que vienen de la calculadora se pasa `aplicarEscala: false` o no se usa,
para no descontar dos veces.

Cubierto por `__tests__/services/orderPricing.test.ts` (13 casos). Si cambia una regla, cambia el test.

### 6.2 Cajón de detalle de orden — `components/orders/OrderDrawer.tsx`

Se abre desde cualquier fila de `pages/Trabajos.tsx` (`Esc` o el scrim lo cierran); `pages/TrabajoDetalle.tsx`
queda como vista profunda a la que lleva el botón "Editar". Cabecera marino, tres métricas
(Total / Abonado / Saldo — el saldo se tiñe de oro si es > 0), pestañas Resumen · Pagos · Archivos · Bitácora
y pie fijo con `Pasar a <siguiente estado>` sobre el orden de `FLUJO`.

- **Ningún dato del cajón es literal**: línea de tiempo y bitácora salen de `Trabajo.historial`; archivos, de
  `fotoOriginalUrl` / `fotoEvidenciaUrl` / `fotoRetiroUrl`; el SRI, de `autorizacion_sri`. Donde no hay dato va
  un estado vacío honesto, nunca un valor de muestra.
- `updateTrabajoStatus()` **escribe en `historial`** en cada cambio de estado — de ahí se alimenta el cajón.
- `registrarAbono(id, monto, user)` (TrabajosContext) mueve abono/saldo **sin** tocar el estado; `registerRetiro()`
  sigue siendo el que cierra la orden en `ENTREGADO`.

---

## 7. Contexto de Negocio (Métricas Críticas)

- **Alto tráfico:** ~50 clientes diarios. Prueba del "clic mínimo".
- **Mix de productos (Pareto):**
  - **30% Notas de Venta / documentos SRI:** precisión legal (Régimen vs Documento), descuento de inventario automático.
  - **70% Imprenta Comercial:** tarjetas, volantes, folletos, sobres, sellos, gigantografía. **NO SE HACEN LIBROS.**
- **Ciclo de renovación (50% del negocio):** clientes recurrentes que **renuevan talonario**. El arte maestro vive en **CorelDRAW**. La app NO diseña: sirve para encontrar el pedido anterior y autorizar la nueva impresión.

---

## 8. Estructura de Menú y Páginas

Grupos del sidebar (según el diseño maestro):

| Grupo | Ítems (ruta) |
|---|---|
| **Operaciones** | Panel Principal `/dashboard` · Órdenes `/trabajos` · Nueva Orden `/nuevo` · Despacho `/retiros` |
| **Taller** | Monitor de Taller `/kds` · Diseño Gráfico `/diseno` · Bodega de Insumos `/inventario` |
| **Finanzas** | Cuentas por Cobrar `/cuentas` · Facturación SRI `/facturacion` · Flujo de Caja `/finanzas` · Calculadora `/calculadora` |
| **Entidades** | Clientes `/clientes` · Proveedores `/proveedores` |
| **Sistema** *(Admin)* | Usuarios `/usuarios` · Auditoría `/registro` · Configuración `/configuracion` · Descargar Extensión |

Otras rutas:

| Tipo | Ruta | Archivo |
|---|---|---|
| Producción extra | `/produccion` | `Produccion.tsx` |
| | `/productos` | `Productos.tsx` |
| Detalle | `/trabajos/:trabajoId` | `TrabajoDetalle.tsx` |
| **Documentos (papel blanco)** | `/nota-de-venta/:id` | `NotaDeVenta.tsx` |
| | `/recibo-abono/:id` | `ReciboAbono.tsx` |
| | `/orden-produccion/:id` | `OrdenProduccion.tsx` |
| | `/solicitud-impresion/:id` | `SolicitudImpresion.tsx` |
| | `/recibo-epson/:id` | `ReciboEpson.tsx` |
| **Público** | `/` landing · `/vitrina` · `/tracking` · `/login` · `/panel-interno` (prototipo del sistema) |

---

## 9. Componentes UI Reutilizables (`components/ui/`)

| Componente | Archivo | Uso |
|---|---|---|
| **Button** | `ui/Button.tsx` | Variantes: `primary` (azul), `gold`, `danger`, `ghost`, `outline` |
| **Input** | `ui/Input.tsx` | Inputs con label, estado de error, icono |
| **Modal** | `ui/Modal.tsx` | Overlay + header + body + footer. Sizes `sm`/`md`/`lg`/`xl` |
| **Badge** | `ui/Badge.tsx` | Etiquetas por color de estado (ver §2.3) |
| **Card** | `ui/Card.tsx` | Variantes: `default`, `elevated`, `interactive`, `highlight` |

> Al migrar estos componentes al tema claro, seguir §2.5 / §2.6. El Modal claro: overlay `rgba(10,17,64,.45)` + `backdrop-blur`; contenedor `#fff` + `border #E4E8F4` + `border-radius 16px`.

---

## 10. Idioma

**Español Latino (Ecuador)** es el idioma ÚNICO de la interfaz interna. No se permiten:
- Labels en inglés ("Submit", "Cancel", "Search"…).
- Palabras decorativas en inglés ("Vault Empty", "Atelier Monitor"…).
- Formatos de fecha anglosajones (usar `es-EC` siempre).

---

## 11. Archivos que NO se modifican estéticamente

Documentos de impresión — mantienen **fondo blanco puro** para papel:
- `NotaDeVenta.tsx` · `ReciboAbono.tsx` · `OrdenProduccion.tsx` · `SolicitudImpresion.tsx` · `ReciboEpson.tsx`

---

## 12. Sistema de Registro de Actividad (Activity Log)

Módulo de auditoría tipo cadena que registra TODAS las acciones:
- **Servicio:** `services/activityLogService.ts`
- **Almacenamiento:** Supabase + redundancia local en `localStorage` (`imprenta_activity_log`)
- **Auto-purga:** registros de más de 3 meses se eliminan al iniciar la app
- **Acciones rastreadas:** login/logout, crear/editar órdenes, cambios de estado KDS, retiros, cambios de configuración, gestión de usuarios

---

*Este manifiesto es la ley del proyecto. No es sugerencia — es obligación.*
