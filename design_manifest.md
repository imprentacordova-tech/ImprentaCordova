# Manifiesto de Diseño: Imprenta Córdova — Sistema "Obsidian & Gold"

> **PARA FUTUROS AGENTES: LEE ESTO COMPLETO ANTES DE TOCAR UNA SOLA LÍNEA DE CÓDIGO.**

Este documento establece las reglas fundamentales para el desarrollo de la interfaz de gestión "Córdova Systems" de Imprenta Córdova. Todo agente, modelo de IA, o desarrollador humano que trabaje en este proyecto DEBE adherirse a estos principios para mantener la coherencia y la excelencia.

---

## 0. Reglas Críticas Inquebrantables

> [!CAUTION]
> **NUNCA hacer lo siguiente:**
> 1. **NUNCA** usar clases `bg-white`, `bg-gray-*`, `dark:bg-gray-*`, ni `text-gray-900` en vistas INTERNAS. El tema es PERMANENTEMENTE OSCURO.
> 2. **NUNCA** escribir texto en inglés en la interfaz. TODO debe estar en **Español Latino** (Ecuador).
> 3. **NUNCA** usar `bg-brand-blue` como color principal de botones en vistas internas. El acento primario es `liquid-gold` (`#D4AF37`).
> 4. **NUNCA** introducir `rounded-full` en contenedores/cards grandes. Usar `rounded-2xl` o `rounded-[2.5rem]`.
> 5. **NUNCA** eliminar ni simplificar el hook `useOrder.ts` ni la captura de `tempClient` (cedula, telefono, nombre).
> 6. **NUNCA** modificar los archivos de documentos de impresión (NotaDeVenta, ReciboAbono, OrdenProduccion, SolicitudImpresion) — esos SÍ son claros para imprimir en papel.
> 7. **NUNCA** proponer el desarrollo de módulos de "Libros" o "Editoriales". La imprenta NO fabrica libros.

---

## 1. Stack Técnico

| Componente | Tecnología |
|---|---|
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5 |
| **Estilos** | TailwindCSS 3 + Custom Tokens |
| **Router** | react-router-dom (HashRouter) |
| **Backend** | Supabase (PostgreSQL) + Google Apps Script (cloud sync) |
| **Hosting** | Vercel (auto-deploy desde `main`) |
| **Fuentes** | Outfit (display), Inter (body), JetBrains Mono (mono) — via Google Fonts |

---

## 2. Sistema de Diseño: "Obsidian & Gold"

### Paleta de Colores (Obligatoria)

| Token Tailwind | HEX | Uso |
|---|---|---|
| `obsidian` / `brand-dark` | `#050810` | Fondo principal de toda la app |
| `obsidian-mid` / `surface-dark` | `#0a0f1e` | Superficies elevadas, sidebars |
| `obsidian-card` | `#0c1224` | Fondos de cards (`bg-obsidian-card`) |
| `liquid-gold` | `#D4AF37` | Acentos de lujo, botones primarios, gradientes |
| `gold-bright` | `#f2ca50` | Variante brillante del gold (gradientes) |
| `champagne` | `#F5E6C8` | Textos cálidos de soporte |
| `brand-blue` | `#0ea5e9` | Indicadores informativos, botones secundarios (acciones) |
| `brand-blue-dark` | `#0369a1` | Hover states de brand-blue |
| `brand-red` | `#E11D48` | SOLO para errores, alertas y estados urgentes |
| `luxury-slate` | `#191f31` | Bordes y fondos sutiles |
| `accent-blue` | `#bfcdff` | Textos informativos claros |
| Textos principales | `text-white` | Títulos y datos clave |
| Textos secundarios | `text-slate-500` | Labels, subtítulos, timestamps |
| Bordes | `border-white/[0.06]` | Separadores sutiles en cards |
| Fondos de cards | `bg-obsidian-card` | Cards oscuras con borde sutil |

### Clases Utilitarias del Proyecto

```
bg-obsidian-card      → bg-[#0c1224] — Cards oscuras con borde sutil (Tailwind color)
bg-architect-grid     → Grid pattern dorado sutil (60px, opacity 0.04)
bg-noise              → Grain overlay con SVG fractalNoise (opacity 0.03, mix-blend-overlay)
stats-bar             → Barra dorada sutil con bordes para métricas
text-gold-gradient    → Gradiente dorado animado (shimmer-sweep 6s)
section-eyebrow       → text-[10px] font-black uppercase tracking-[0.5em] text-liquid-gold
section-title         → text-4xl md:text-5xl font-black uppercase tracking-tighter
spotlight-card        → Card oscura con hover dorado y efecto de luz
btn-gold              → Botón primario dorado con shimmer sweep
btn-ghost             → Botón transparente con borde sutil y hover dorado
shadow-luxury         → Sombra negra profunda (0 25px 50px -12px rgba(0,0,0,0.7))
shadow-gold-glow      → Halo dorado sutil (para hover states)
shadow-gold-glow-soft → Halo dorado más sutil
shadow-gold-ultra     → Halo dorado intenso con inset highlight
shadow-blue-glow-sm   → Halo azul sutil para botones/actions
shadow-emerald-glow   → Halo verde para estados positivos
shadow-red-glow       → Halo rojo para estados de alerta
animate-scan          → Scanline animation (10s linear infinite)
animate-laser         → Laser sweep animation (3s ease-in-out infinite)
animate-shake         → Shake animation (0.5s ease-in-out)
custom-scrollbar      → Scrollbar dorado personalizado
no-scrollbar          → Oculta scrollbar completamente
```

### Tipografía

- **Títulos**: `font-display font-black text-3xl lg:text-4xl uppercase tracking-tighter`
- **Labels/Etiquetas**: `text-[10px] font-black uppercase tracking-[0.2em] text-slate-500` o `section-eyebrow`
- **Valores/Datos**: `font-black text-white` en tamaño proporcional al dato
- **Botones**: `text-[10px] font-black uppercase tracking-[0.2em]` (o `tracking-[0.3em]` en btn-gold/btn-ghost)
- **Mono (códigos/logs)**: `font-mono` (JetBrains Mono)

### Botones

| Tipo | Clase / Patrón |
|---|---|
| **Primario (Gold)** | `bg-liquid-gold text-obsidian font-black rounded-2xl shadow-gold-glow` — usar `btn-gold` paraCTAs de landing |
| **Primario (Blue)** | `bg-brand-blue text-white font-black rounded-xl shadow-blue-glow-sm` — acciones internas |
| **Secundario** | `bg-white/[0.04] text-white border border-white/[0.1] rounded-2xl hover:bg-liquid-gold/5` — usar `btn-ghost` en landing |
| **Peligro** | `bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl hover:bg-rose-500 hover:text-white` |
| **WhatsApp** | `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500` |

### Modales

Usar el componente `ui/Modal.tsx`:

```tsx
<Modal isOpen={open} onClose={close} title="Título" size="md">
  {/* contenido */}
</Modal>
```

Estilos internos del Modal:
- Overlay: `fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex justify-center items-center p-4`
- Container: `bg-obsidian-card border border-white/[0.06] rounded-2xl shadow-luxury overflow-hidden`
- Header: `p-6 border-b border-white/[0.06]`
- Body: `max-h-[70vh] overflow-y-auto custom-scrollbar`
- Footer: `p-6 bg-white/[0.03] flex justify-end border-t border-white/[0.06]`

---

## 3. Jerarquía de Acción (Workflow Priority)

> [!IMPORTANT]
> **Prioridad: Velocidad sobre Burocracia.**
> El flujo de NuevoPedido debe permitir la captura rápida del pedido. El orden es:
> 1. **Producto**: Selección intuitiva del servicio y variantes.
> 2. **Detalles**: Ajustes de cantidad, acabado y abono.
> 3. **Cliente**: Identificación del sujeto (puede ser al final).

---

## 4. Micro-interacciones (Feedback)

- **Hover**: Todo elemento clicable reacciona con `duration-500` + cambio de borde o brillo (`shadow-gold-glow`).
- **Cards**: `hover:-translate-y-2 hover:border-liquid-gold/20 transition-all duration-500`
- **Estados**:
  - En progreso: `animate-pulse` o `Loader2Icon` con `animate-spin text-liquid-gold`
  - Éxito: `CheckCircleIcon` en `text-emerald-400`
- **Entradas**: `animate-fade-in` para modales, `animate-slide-up` para contenido principal.

---

## 5. Diseño Responsivo

- **PC**: Layout 2-3 columnas. Sidebar siempre visible. Breakpoint principal: `lg:` (1024px).
- **Móvil**: Layout vertical. Sidebar colapsable. Barra de resumen flotante.
- **NO usar `xl:` como breakpoint crítico** — causa compresión en pantallas de 1366px.

---

## 6. Reglas de Negocio (Core Order Flow)

> [!WARNING]
> **Para futuros agentes**: El hook `useOrder.ts` y el contexto `DataContext.tsx` son el corazón del sistema. ¡Máxima precaución al modificar!

- **El Hook Central (`useOrder.ts`)**: 
  - Maneja `tempClient`, `cartItems` (Map), y `sriData`.
  - **Identidad Express**: Si no hay `selectedCliente`, capturar `tempClient` ({ nombre, telefono, cedula }). NUNCA eliminar.
- **Personalización (`CartItem`)**: `customPrice` + `notas` por ítem. NUNCA sobreescribir en re-renders.
- **Enrutamiento Post-Orden**: 
  - `TrabajoTipo.SRI` → `/solicitud-impresion`
  - `TrabajoTipo.GENERAL` → `/recibo-abono`

---

## 7. Contexto de Negocio (Métricas Críticas)

> [!IMPORTANT]
> **Alto Tráfico**: La imprenta recibe un promedio de **50 clientes diarios**. Cualquier funcionalidad nueva debe pasar la prueba del "clic mínimo". Si toma más de 30 segundos registrar una orden, el sistema ha fallado.

### Mix de Productos (Pareto)
- **30% Notas de Venta (SRI)**: El corazón administrativo. Requiere precisión legal (Régimen vs Documento) y descuento de inventario automático.
- **70% Imprenta Comercial**: Tarjetas de presentación, volantes, folletos, sobres. **NO SE HACEN LIBROS.**

### El Ciclo de Renovación (50% del Negocio)
La mitad de los clientes diarios son recurrentes que vienen a **renovar su talonario**. 
- **CorelDRAW**: El diseño "maestro" vive en archivos de Corel de años anteriores. 
- **Función de la App**: La app NO es para diseñar. Su función es permitir encontrar rápidamente el pedido anterior (Historial) para clonar los datos y autorizar la nueva impresión.

---

## 7. Estructura de Menú y Páginas (Layout.tsx)

| Grupo | Ruta | Vista | Archivo |
|---|---|---|---|
| **Principal** | `/dashboard` | Panel Principal | `Dashboard.tsx` |
| | `/` | Landing Pública | `VisualLanding.tsx` |
| | `/vitrina` | Vitrina Online | `Vitrina.tsx` |
| **Producción** | `/nuevo` | Nueva Orden | `NuevoPedido.tsx` |
| | `/diseno` | Diseño | `Diseno.tsx` |
| | `/kds` | Taller (KDS) | `KDS.tsx` |
| | `/retiros` | Entregas | `Retiros.tsx` |
| | `/produccion` | Flujo de Producción | `Produccion.tsx` |
| **Gestión** | `/clientes` | Clientes | `Clientes.tsx` |
| | `/trabajos` | Historial de Trabajos | `Trabajos.tsx` |
| | `/productos` | Catálogo de Productos | `Productos.tsx` |
| | `/inventario` | Inventario | `Inventario.tsx` |
| | `/proveedores` | Proveedores | `Proveedores.tsx` |
| | `/calculadora` | Calculadora de Precios | `CalculadoraPrecios.tsx` |
| **Sistema** *(Admin)* | `/finanzas` | Finanzas IA | `Finanzas.tsx` |
| | `/usuarios` | Gestión de Usuarios | `GestionUsuarios.tsx` |
| | `/cuentas` | Cuentas | `Cuentas.tsx` |
| | `/facturacion` | Facturación Electrónica | `FacturacionElectronica.tsx` |
| | `/registro` | Registro de Actividad | `RegistroActividad.tsx` |
| | `/configuracion` | Ajustes | `Configuracion.tsx` |
| **Documentos** | `/nota-venta/:id` | Nota de Venta (SRI) | `NotaDeVenta.tsx` |
| | `/recibo-abono/:id` | Recibo de Abono | `ReciboAbono.tsx` |
| | `/orden-produccion/:id` | Orden de Producción | `OrdenProduccion.tsx` |
| | `/solicitud-impresion/:id` | Solicitud de Impresión | `SolicitudImpresion.tsx` |
| | `/recibo-epson/:id` | Recibo Epson | `ReciboEpson.tsx` |
| **Público** | `/tracking` | Tracking de Pedido | `Tracking.tsx` |
| | `/login` | Login | `Login.tsx` |

---

## 8. Componentes UI Reutilizables (`components/ui/`)

| Componente | Archivo | Uso |
|---|---|---|
| **Button** | `ui/Button.tsx` | Botones con variantes: `primary` (blue), `gold`, `danger`, `ghost`, `outline` |
| **Input** | `ui/Input.tsx` | Inputs oscuros con label, error state, icon support |
| **Modal** | `ui/Modal.tsx` | Modales con overlay, header, body, footer. Sizes: `sm`, `md`, `lg`, `xl` |
| **Badge** | `ui/Badge.tsx` | Badges/etiquetas con variantes de color |
| **Card** | `ui/Card.tsx` | Cards con variantes: `default`, `elevated`, `interactive`, `highlight` (gold border) |

---

## 9. Idioma

**Español Latino (Ecuador)** es el idioma ÚNICO de toda la interfaz interna. No se permiten:
- Labels en inglés ("Submit", "Cancel", "Search", "Identity Key", etc.)
- Palabras decorativas en inglés ("Vault Empty", "Atelier Monitor", etc.)
- Formatos de fecha anglosajones (usar `es-EC` siempre)

---

## 10. Archivos que NO se deben modificar estéticamente

Estos archivos son documentos de impresión y DEBEN mantener fondo blanco:
- `NotaDeVenta.tsx`
- `ReciboAbono.tsx`
- `OrdenProduccion.tsx`
- `SolicitudImpresion.tsx`

---

## 11. Sistema de Registro de Actividad (Activity Log)

El sistema incluye un módulo de auditoría tipo blockchain que registra TODAS las acciones de los usuarios:
- **Servicio**: `services/activityLogService.ts`
- **Almacenamiento**: Nube (Supabase) con redundancia local en `localStorage` (Legado) bajo la clave `imprenta_activity_log`
- **Auto-purga**: Los registros de más de 3 meses se eliminan automáticamente al iniciar la app
- **Acciones rastreadas**: Login, Logout, Crear/Editar órdenes, Cambios de estado KDS, Retiros, Cambios de configuración, Gestión de usuarios

---

*Este manifiesto es la ley del proyecto. No es sugerencia — es obligación.*
