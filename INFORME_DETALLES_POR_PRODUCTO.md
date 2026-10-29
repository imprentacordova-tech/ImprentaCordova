# INFORME — Detalles de producto por tipo

## El paso "Detalles" no cuadra con sellos ni con la mayoría de comerciales

**Fecha:** 29 de octubre de 2026
**Ámbito:** `pages/NuevoPedido.tsx` (Paso 2) + `components/orders/OrderDetails.tsx`
**Petición:** que los detalles cuadren con el objeto que se vende. Un **sello** no tiene hojas, ni papel químico, ni clave del SRI.

---

## 0. Resumen ejecutivo

El paso 2 de Nueva Orden ("Medidas & Copias") es, en realidad, un **asistente de talonario/SRI**. Muestra los mismos cuatro bloques —**Tamaño de corte**, **Copias químicas**, **Diseño** y **Sustrato/Papel**— para **cualquier** producto del catálogo.

Eso funciona para un comprobante autorizado, pero es absurdo para un sello, una tarjeta, una lona, un empastado o un llavero. En un sello, el operador termina eligiendo "1/4 de oficio", "papel químico" o "bond 75g", y el sistema suma deltas de precio por esos conceptos. Además, la vista previa dice "**Talonarios**" y "**X hojas c/u**", y la foto de muestra invita a "fotografiar el talonario viejo".

**La causa:** existe un único esquema de especificaciones (`tamano`, `copias`, `diseno`, `papel`, `esSRI`) y el paso 2 lo aplica a todo. No hay un "perfil de detalle" por tipo de producto.

**La solución:** definir un **perfil de detalle por categoría** (SRI/Talonario, Sello, Tarjetas, Publicidad, Etiquetas, Packaging, Gran Formato, Merch, Empastado, Combos) y que el paso 2 renderice **solo los campos del perfil** y aplique **solo sus modificadores de precio**.

---

## 1. Qué muestra hoy el Paso 2 (evidencia)

En `components/orders/OrderDetails.tsx`, por **cada ítem** del pedido:

| # | Campo | ¿Cuándo se muestra? | Línea |
|---|---|---|---|
| — | Stepper **"Talonarios / Cantidad"** | Siempre | 326 |
| 1 | **Tamaño de Corte / Formato** (1/4 Oficio · 1/2 Oficio · Carta/A4 · 1/8 Oficio · Personalizado) | Siempre | 357–373 |
| 2 | **Nº de Copias Químicas / Hojas por Talonario** | Solo si `item.esSRI` | 376 |
| 3 | **Servicio de Diseño & Preprensa** | Siempre | 395–411 |
| 4 | **Sustrato / Papel Base** (Químico Autocopia · Bond 75g · Couché 300g · Adhesivo/Vinil) | Siempre | 413–428 |
| — | Vista previa: **"N Talonarios"**, **"📖 X hojas c/u"**, **"📐 tamaño"**, **"📜 papel"** | Siempre | 457–505 |
| — | **"Hojas totales taller: X hojas"** | Siempre | 518–521 |
| — | **Cálculo dinámico: Base + Formato + Copias + Diseño + Papel** | Siempre | 540–544 |
| — | **Numeración inicial** y **Nro. Autorización SRI** | Solo si la **orden** tiene algún ítem SRI (`hasSriItem`) | 606–628 |
| — | Foto de muestra: *"Fotografía el talonario viejo…"* | Siempre | 651–657 |

> El texto de cada ítem siempre dice "**Talonarios / Cantidad**", y la ficha de muestra habla de "**talonario viejo**" aunque el producto sea un sello o una tarjeta.

### 1.1 ¿De dónde sale el esquema?

En `pages/NuevoPedido.tsx`, `handleSelectQuickProduct()` arma **el mismo objeto** para todo producto:

```ts
especificaciones: {
  tamano:  esSRI ? '1/4 Oficio' : 'Carta / A4',
  copias:  esSRI ? 'Original + 1 Copia (Duplicado 100h)' : 'Original (50 hojas)',
  diseno:  'Sin Diseño (Arte provisto / Repetición)',
  papel:   esSRI ? 'Químico Autocopia' : 'Bond 75g',
  esSRI,
}
```

Es decir: un sello comercial entra con `papel: 'Bond 75g'` y `tamano: 'Carta / A4'` **aunque no tenga ni papel ni ese tamaño**.

---

## 2. El caso "Sello" (concreto)

Un sello del catálogo (`Oficina → Sello Seco`, `Sellos Automáticos`, `Sello Automático Trodat`) hoy recibe este formulario:

| Campo que aparece | ¿Tiene sentido en un sello? | Por qué no |
|---|---|---|
| Tamaño 1/4 Oficio, 1/2, Carta, 1/8, Personalizado | ❌ | Un sello mide en **milímetros** (p. ej. 38×14 mm, 47×18 mm). No se corta en oficio. |
| Copias Químicas / Hojas por Talonario | ⚠️ | Solo aparece si `esSRI`. Un sello no es SRI, así que no aparece… **pero** si la misma orden lleva un talonario + un sello, el bloque "hojas" se muestra y contamina la vista del sello. |
| Servicio de Diseño | ✅/⚠️ | Relevante, pero las opciones están pensadas para imprenta ("diagramación", "vectorización"); a un sello le pega "arte provisto / diseño". |
| Sustrato / Papel (Químico, Bond, Couché, Adhesivo) | ❌ | Un sello es **caucho/polímero sobre base de madera o metal**. No lleva papel. |
| "Talonarios / Cantidad" | ❌ | Un sello se cuenta en **unidades**, no en talonarios. |
| "📖 X hojas c/u" / "Hojas totales taller" | ❌ | No hay hojas. |
| "📜 papel" en la vista previa | ❌ | Idem. |
| Foto: *"Fotografía el talonario viejo"* | ❌ | En un sello lo que se fotografía es el **texto/sello anterior** o el arte. |

**Lo que un sello SÍ necesita preguntar:**

- **Tipo**: automático · seco (relieve) · fechador · de mano.
- **Medida** (mm): 38×14 · 47×18 · 52×35 · personalizada.
- **Color de tinta**: negro · azul · rojo · verde · bicolor.
- **Texto / líneas**: nombre, RUC, dirección, teléfono, logo.
- **Base**: madera · plástico · metal (para automáticos).
- **Diseño**: arte provisto · diseño nuevo.

> Y **nunca** debería pedir "clave del SRI": un sello comercial no es un comprobante autorizado.

---

## 3. Consecuencias del esquema único

1. **Confusión en mostrador** — el operador tiene que "ignorar" campos que no aplican. Sube el tiempo por pedido (el objetivo del sistema es < 30 s).
2. **Datos basura** — la orden guarda `papel: 'Bond 75g'` o `tamano: 'Carta / A4'` en un sello. Eso viaja a producción y al documento impreso.
3. **Precio mal calculado** — el "Cálculo dinámico" suma deltas de **Formato**, **Copias**, **Diseño** y **Papel** a *todos* los ítems. Un sello puede terminar con un sobreprecio por un papel que no existe.
4. **Vista previa incoherente** — la ilustración ya es correcta (el `ProductVisual` dibuja un sello, una tarjeta o una lona según el nombre), pero el texto de al lado dice "Talonarios" y "hojas".
5. **Documentos y taller** — la Orden de Producción y el KDS heredan esas especificaciones y el taller recibe instrucciones que no corresponden.

---

## 4. Propuesta: perfiles de detalle por categoría

### 4.1 La idea

Un **perfil** es un objeto de configuración que declara:
- qué campos mostrar,
- qué opciones tiene cada campo,
- qué delta de precio aplica cada opción,
- qué resumen/ilustración mostrar.

El paso 2 elige el perfil por `item.categoria` (con respaldo por `item.nombre`) y renderiza **solo** ese perfil.

### 4.2 Tabla de perfiles

| Perfil | Se detecta por | Campos propios |
|---|---|---|
| **Talonario SRI** | `esSRI` | Tamaño (1/4 · 1/2 oficio) · Copias (original/duplicado/triplicado/cuadruplicado) · Papel químico · Numeración inicial · Autorización SRI · Trámite (Aumento/Cambio/Mismo) · Modelo de impresión · Clave de acceso |
| **Sello** | nombre contiene "sello" | Tipo (automático/seco/fechador) · Medida en mm · Color de tinta · Texto/líneas · Base · Diseño |
| **Tarjetas** | "tarjeta" | Cantidad (100/500/1000) · Material (couché 300g, PVC, soft-touch) · Acabado (mate/brillo/UV/foil) · Tamaño estándar 9×5 cm |
| **Publicidad** (volantes, dípticos, trípticos, afiches, revistas, carpetas) | "volante/díptico/tríptico/afiche/revista/carpeta" | Formato (A4/A3/A5) · Papel (couché 150/300) · Impresión (full color / 1 tinta) · Doblado · Cantidad |
| **Etiquetas** | "etiqueta" | Material (papel/vinil/transparente) · Forma (rectangular/circular/troquel) · Acabado · Cantidad |
| **Packaging** | "caja/bolsa" | Medida · Material · Acabado · Cantidad |
| **Gran Formato** | "lona/roll-up/vinil/letrero/backlight" | Medida (m²) · Material (lona 13oz / vinil) · Acabado (ojalillos, dobladillo) · Instalación (sí/no) |
| **Merch** | "jarro/bolígrafo/agenda/llavero/taza" | Técnica (láser/sublimación) · Color · Cantidad |
| **Empastado** | "empastado" | Tipo de tapa (dura/blanda) · Color · Tamaño · Nº de hojas |
| **Combos** | "combo" | Componentes fijos (solo lectura) |
| **Genérico** | resto | Cantidad · Detalle libre |

### 4.3 Perfil Sello (detallado)

```
Tipo:        [Automático] [Seco (relieve)] [Fechador] [De mano]
Medida:      [38×14 mm] [47×18 mm] [52×35 mm] [Personalizada]
Color tinta: [Negro] [Azul] [Rojo] [Verde] [Bicolor]
Texto:       (textarea)  Nombre / RUC / Dirección / Teléfono
Base:        [Madera] [Plástico] [Metal]
Diseño:      [Arte provisto] [Diseño nuevo (+$)]
```
- **Sin** tamaño de oficio, **sin** papel, **sin** copias, **sin** hojas, **sin** clave SRI.
- La ilustración (`ProductVisual`) ya dibuja un sello (`SelloArt`).

### 4.4 Perfil Talonario SRI (detallado)

```
Tamaño:       [1/4 Oficio] [1/2 Oficio]
Copias:       [Original 50h] [Duplicado 100h] [Triplicado 150h] [Cuadruplicado 200h]
Papel:        [Químico Autocopia]
Numeración:   (texto) 0000001 - 0000100
Autorización: (texto)
Trámite:      [Aumento] [Cambiar] [Mismo]
Modelo:       [Sobre preimpreso] [Clásico completo] [Evolución moderna] [PC A4]
Clave acceso: (texto, opcional)
```
- La ilustración ya dibuja el talonario con pasta café y N blocks.

---

## 5. Arquitectura de implementación

### 5.1 Modelo de datos

Hoy `item.especificaciones` es un objeto fijo (`tamano`, `copias`, `diseno`, `papel`). Pasa a ser un **mapa flexible**:

```ts
type DetalleItem = {
  perfil: 'sri' | 'sello' | 'tarjeta' | 'publicidad' | 'etiqueta'
        | 'packaging' | 'gran-formato' | 'merch' | 'empastado'
        | 'combo' | 'generico';
  valores: Record<string, string | number | boolean>;
};
```

`item.categoria` se guarda en el ítem (hoy `handleSelectQuickProduct` **no** lo incluye; conviene agregarlo para elegir el perfil sin adivinar por el nombre).

### 5.2 Selección de perfil

Un único módulo, p. ej. `services/detalleProducto.ts`:

```ts
export type PerfilDetalle = {
  id: string;
  etiqueta: string;
  campos: CampoDetalle[];
  resumen: (v: Record<string, any>) => string;
};

export const perfilDe = (item: { esSRI?: boolean; categoria?: string; nombre?: string }): PerfilDetalle => {
  if (item.esSRI) return PERFILES.sri;
  const t = `${item.nombre} ${item.categoria}`.toLowerCase();
  if (/sello/.test(t)) return PERFILES.sello;
  if (/tarjeta/.test(t)) return PERFILES.tarjeta;
  // … etc.
  return PERFILES.generico;
};
```

### 5.3 Renderizado

`OrderDetails` deja de tener los 4 bloques fijos y pasa a:
1. calcular `perfil = perfilDe(item)`,
2. renderizar `perfil.campos` (cada campo con sus opciones),
3. mostrar la vista previa con `ProductVisual` (ya resuelto),
4. mostrar el resumen según `perfil.resumen`.

### 5.4 Precios por perfil

Cada opción declara su delta y el perfil declara qué deltas aplican. Así un sello **no** suma "papel" ni "formato de oficio"; suma "tipo", "medida" y "color".

### 5.5 Lo que YA está resuelto

- **La ilustración es dinámica por categoría**: `components/ProductVisual.tsx` ya tiene `TalonarioArt`, `SelloArt`, `TarjetaArt`, `LonaArt`, `EtiquetaArt`, `CajaArt`, `MerchArt`, `PublicidadArt`. El problema es **solo el formulario**, no la imagen.
- **La persistencia ya distingue SRI**: `handleCreateOrder` solo guarda `numeracion`, `autorizacion_sri`, `claveAcceso` y `estadoClave` para `item.esSRI`. El problema es la **UI**, que muestra campos de más.

---

## 6. Plan por fases

| Fase | Qué | Riesgo |
|---|---|---|
| **1** | Crear `services/detalleProducto.ts` con los perfiles y sus campos/precios. | Bajo (módulo nuevo). |
| **2** | `OrderDetails` renderiza por perfil (reemplaza los 4 bloques fijos). | Medio (toca el paso 2). |
| **3** | `handleSelectQuickProduct` y `ProductConfigurator` guardan `perfil` + `categoria` en el ítem. | Bajo. |
| **4** | Ajustar el resumen (Paso 4/5), la Orden de Producción y el KDS para leer el resumen del perfil. | Medio. |
| **5** | Migración suave: los ítems viejos sin `perfil` se resuelven con `perfilDe(item)` (por `esSRI`/nombre). | Bajo. |

---

## 7. Impacto

- **Velocidad de mostrador**: menos campos irrelevantes → menos tiempo por pedido.
- **Precio correcto**: cada perfil suma solo lo que corresponde.
- **Producción sin ruido**: la orden de taller recibe la especificación real (medida de sello, color de tinta, tipo de tapa…).
- **Coherencia visual**: la ilustración y el formulario hablan del mismo objeto.

---

## 8. Anexo — Archivos y líneas relevantes

| Archivo | Qué contiene |
|---|---|
| `components/orders/OrderDetails.tsx` | Los 4 bloques fijos (tamaño, copias, diseño, papel), la vista previa "Talonarios/hojas" y el bloque SRI (líneas 357–628). |
| `pages/NuevoPedido.tsx` | `handleSelectQuickProduct()` arma el mismo esquema para todo producto (~línea 361). `hasSriItem` decide si se muestran numeración/autorización. |
| `components/ProductVisual.tsx` | Ilustraciones por categoría (sello, tarjeta, lona…). La imagen ya es correcta. |
| `components/orders/ProductConfigurator.tsx` | Configurador del "Catálogo Completo"; también usa el esquema de imprenta. |
| `services/catalogData.ts` | Categorías reales: Documentos SRI, Tarjetas, Publicidad, Etiquetas, Packaging, Gran Formato, Merch, Oficina, Combos. |

## 9. Estado: IMPLEMENTADO

- **`services/detalleProducto.ts`** — define los perfiles (`sri`, `sello`, `laser`, `granFormato`, `empastado`, `generico`), sus campos/opciones/deltas y `perfilDe(item)`.
- **`components/orders/DetalleCampos.tsx`** — renderiza los campos del perfil elegido.
- **`components/orders/OrderDetails.tsx`** — el Paso 2 ya no muestra los 4 bloques fijos: renderiza el **perfil del producto**. La unidad de cantidad, el resumen de la vista previa y el cálculo de precio salen del perfil.
- **`pages/NuevoPedido.tsx`** — `handleSelectQuickProduct` guarda `categoria` y las especificaciones por defecto del perfil.

**Resultado por tipo:**

| Producto | Lo que pide ahora |
|---|---|
| **Sello** | Tipo (automático/seco/fechador/mano), medida en **mm**, color de tinta, texto/líneas, diseño. **Sin** hojas, **sin** papel químico, **sin** clave SRI. |
| **Láser / Sublimación** (una sola impresión) | Diseño, color/tinta, papel/material, numeración, copias. |
| **Talonario SRI** | Tamaño de oficio, copias químicas, papel químico (y, a nivel de orden, numeración/autorización/clave). |
| **Gran formato** | Medida (m²), material, acabado. |
| **Empastado** | Tapa, color, tamaño. |

Verificado: `npm run build` → **EXIT 0** · `npx tsc --noEmit` → **0 errores** · `vitest` → **171/171**.

---

*Conclusión: el paso 2 ya no está "especializado en talonarios" para todo. Cada producto pregunta lo suyo y nada se mezcla.*
