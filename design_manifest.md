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
| **Fuentes** | Outfit (display), Inter (body) — via Google Fonts |

---

## 2. Sistema de Diseño: "Obsidian & Gold"

### Paleta de Colores (Obligatoria)

| Token | HEX | Uso |
|---|---|---|
| `brand-dark` | `#020617` | Fondo principal de toda la app |
| `liquid-gold` | `#D4AF37` | Acentos de lujo, botones primarios, gradientes |
| `brand-red` | `#E11D48` | SOLO para errores, alertas y estados urgentes |
| `brand-blue` | `#3B82F6` | SOLO para indicadores informativos, estados de "sync" |
| Textos principales | `text-white` | Títulos y datos clave |
| Textos secundarios | `text-slate-500` | Labels, subtítulos, timestamps |
| Bordes | `border-white/5` | Separadores sutiles |
| Fondos de cards | `bg-white/5` + `backdrop-blur-xl` | Glassmorphism sobre fondo oscuro |

### Clases Utilitarias del Proyecto

```
glass-card-luxury    → bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2.5rem] shadow-luxury
shadow-luxury        → Sombra negra profunda con efecto 3D
shadow-gold-glow     → Halo dorado sutil (para hover states)
text-gold-gradient   → Gradiente dorado en texto (para títulos)
input-atelier        → Input oscuro con borde sutil y foco dorado
animate-fade-in      → Entrada suave con opacity
animate-slide-up     → Entrada desde abajo
```

### Tipografía

- **Títulos**: `font-black text-3xl lg:text-4xl uppercase tracking-tighter italic`
- **Labels/Etiquetas**: `text-[10px] font-black uppercase tracking-[0.2em] text-slate-500`
- **Valores/Datos**: `font-black text-white` en tamaño proporcional al dato
- **Botones**: `text-[10px] font-black uppercase tracking-[0.2em]`

### Botones

| Tipo | Clase |
|---|---|
| **Primario (Acción principal)** | `bg-liquid-gold text-brand-dark font-black rounded-2xl shadow-gold-glow hover:bg-white` |
| **Secundario** | `bg-white/10 text-white border border-white/10 rounded-2xl hover:bg-white/20` |
| **Peligro** | `bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white` |
| **WhatsApp** | `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500` |

### Modales

```tsx
// Overlay
className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex justify-center items-center p-4 animate-fade-in"
// Container
className="bg-brand-dark/95 backdrop-blur-xl rounded-[2.5rem] shadow-luxury w-full max-w-lg overflow-hidden border border-white/10"
// Header
className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5"
// Footer
className="p-6 bg-white/5 flex justify-end border-t border-white/5"
```

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

## 7. Estructura de Menú (Layout.tsx)

| Grupo | Ruta | Vista | Icono |
|---|---|---|---|
| **Principal** | `/dashboard` | Panel Principal | DashboardIcon |
| | `/` | Vista Pública | GlobeAltIcon |
| **Producción** | `/nuevo` | Nueva Orden | AddIcon |
| | `/diseno` | Diseño | PaletteIcon |
| | `/kds` | Taller (KDS) | KdsIcon |
| | `/retiros` | Entregas | ReceiptIcon |
| **Gestión** | `/clientes` | Clientes | ClientsIcon |
| | `/trabajos` | Historial | DocumentIcon |
| | `/productos` | Catálogo | BoxIcon |
| | `/inventario` | Inventario | SolidBoxIcon |
| **Sistema** *(Admin)* | `/finanzas` | Finanzas IA | FinanceIcon |
| | `/usuarios` | Usuarios | UsersIcon |
| | `/registro` | Registro de Actividad | ClockIcon |
| | `/configuracion` | Ajustes | Cog8ToothIcon |

---

## 8. Idioma

**Español Latino (Ecuador)** es el idioma ÚNICO de toda la interfaz interna. No se permiten:
- Labels en inglés ("Submit", "Cancel", "Search", "Identity Key", etc.)
- Palabras decorativas en inglés ("Vault Empty", "Atelier Monitor", etc.)
- Formatos de fecha anglosajones (usar `es-EC` siempre)

---

## 9. Archivos que NO se deben modificar estéticamente

Estos archivos son documentos de impresión y DEBEN mantener fondo blanco:
- `NotaDeVenta.tsx`
- `ReciboAbono.tsx`
- `OrdenProduccion.tsx`
- `SolicitudImpresion.tsx`

---

## 10. Sistema de Registro de Actividad (Activity Log)

El sistema incluye un módulo de auditoría tipo blockchain que registra TODAS las acciones de los usuarios:
- **Servicio**: `services/activityLogService.ts`
- **Almacenamiento**: `localStorage` bajo la clave `imprenta_activity_log`
- **Auto-purga**: Los registros de más de 3 meses se eliminan automáticamente al iniciar la app
- **Acciones rastreadas**: Login, Logout, Crear/Editar órdenes, Cambios de estado KDS, Retiros, Cambios de configuración, Gestión de usuarios

---

*Este manifiesto es la ley del proyecto. No es sugerencia — es obligación.*
