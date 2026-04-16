# Manifiesto de Diseño: Imprenta Cordova (The Luxury Standard)

Este documento establece las reglas fundamentales para el desarrollo de la interfaz "Atelier" de Imprenta Cordova. Todo agente o desarrollador que trabaje en este proyecto debe adherirse a estos principios para mantener la coherencia y la excelencia.

## 1. Jerarquía de Acción (Workflow Priority)

> [!IMPORTANT]
> **Prioridad: Velocidad sobre Burocracia.**
> El flujo de trabajo debe permitir la captura rápida del pedido. El orden de importancia es:
> 1.  **Producto**: Selección intuitiva del servicio y variantes.
> 2.  **Detalles**: Ajustes de cantidad, acabado y abono.
> 3.  **Cliente**: Identificación del sujeto (puede ser al final).

## 2. Tokens Visuales y Estética

- **Paleta de Colores**:
    - `Brand Dark`: `#020617` (Fondo principal, profundidad).
    - `Brand Red`: `#E11D48` (Acciones de urgencia, errores, botones SRI).
    - `Liquid Gold`: `#D4AF37` (Acentos de lujo, branding, indicadores de calidad).
    - `Brand Blue`: `#3B82F6` (Acciones informativas, flujos generales).
- **Glassmorphism**:
    - Usar `glass-atelier` para contenedores principales.
    - Usar `glass-card-luxury` para elementos interactivos en grids.
- **Tipografía**:
    - Títulos: `Outfit` o `font-display` en Black/Extrabold con `tracking-tighter`.
    - Etiquetas: `text-[10px]` o `text-xs` en Uppercase con `tracking-[0.2em]`.

## 3. Principio de Respiración Visual (Spacing)

- **Evitar la Compresión**: En PC, los contenedores deben tener al menos `p-8` o `p-12`.
- **Márgenes**: Usar `gap-6` o `gap-8` entre componentes grandes.
- **Espacio en Blanco**: El espacio vacío no es "desperdicio", es "lujo". Permite al ojo humano descansar y enfocarse en la acción actual.

## 4. Micro-interacciones (Feedback)

- **Hover**: Todo elemento clicable debe reaccionar con un cambio suave (`duration-500` o `700`) de borde o brillo (`shadow-gold-glow`).
- **Estados**:
    - En progreso: `animate-pulse` o `Loader2Icon` rotativo.
    - Éxito: `CheckCircleIcon` en `text-green-500`.
- **Transiciones**: Usar Framer Motion para entradas suaves (`animate-fade-in`, `animate-slide-in-up`).

## 5. Diseño Responsivo Inteligente

- **PC**: Layout de 2 o 3 columnas. Barra lateral de resumen siempre visible si el espacio lo permite.
- **Móvil**: Layout vertical rígido. Barra de resumen colapsable o flotante para no obstruir la selección.

## 6. Reglas de Negocio y Estructura de Datos (Core Order Flow)

> [!WARNING]
> **Para futuros agentes/desarrolladores**: Esta es la sección y el flujo más usado en todo el sistema. ¡Tener precaución al modificar el context y los hooks!

- **El Hook Central (`useOrder.ts`)**: 
  - Maneja la vida del pedido en tiempo real mediante `tempClient`, `cartItems` (Map), y `sriData`.
  - **Identidad Express**: Si no hay un `selectedCliente` de la base de datos, el flujo **debe capturar** la "Identidad Express" en la variable `tempClient` ({ nombre, telefono, cedula }). Esta función es vital para automatizar el alta directa y generar notificaciones de WhatsApp. NUNCA eliminar o ignorar la recolección de `cedula` y `telefono` en el cliente temp.
- **Personalización Granular (`CartItem`)**:
  - Cada ítem permite sobreescritura de precio mediante `customPrice`.
  - Cada ítem permite notas de producción específicas mediante `notas`.
  - Al ejecutar `saveItemAsProduct`, las notas se inyectan en la descripción, y el precio custom es preservado como base. NUNCA sobreescribir este estado en re-renders.
- **Enrutamiento Inteligente**: Tras finalizar `finalizeOrder`, si es un trabajo SRI `TrabajoTipo.SRI`, redirigir a `/solicitud-impresion`. Si es trabajo general, redirigir a `/recibo-abono`.
- **Globalización**: El lenguaje oficial mandatario es **Español Latino**. Textos en inglés hardcodeados están prohibidos por normativa de diseño.

---
*Este manifiesto es la base de la excelencia para ImprentaCordova.net y sus futuras expansiones.*
