# 🛰 PROTOCOLO MAESTRO: IMPRENTA CÓRDOVA (ABRIL 2026)

Este documento centraliza la visión, reglas de diseño y estado técnico del proyecto para garantizar la continuidad absoluta del desarrollo.

## 💎 1. VISIÓN ESTÉTICA "PLAY 10"
*   **Concepto**: Lujo Cinematográfico Industrial.
*   **Paleta Principal**: 
    *   `Blanco Inmaculado` (#FFFFFF) para fondos de Landing.
    *   `Obsidian & Gold` (Negro profundo + Dorado/Azul) para el Dashboard interno.
    *   `Kraft & Tech`: El uso de texturas de papel real (café) mezcladas con interfaces de usuario de alta tecnología.
*   **Animaciones (Framer Motion)**:
    *   **Botones Sorpresa**: Deben aparecer con `type: "spring", stiffness: 200` al hacer scroll.
    *   **Micro-interacciones**: Todo botón o tarjeta debe reaccionar al `hover` con escalas sutiles y sombras profundas.
    *   **Efecto Película**: Tipografía masiva (`text-14rem`), tracking negativo y uso de itálicas para transmitir velocidad y precisión.

## 🛠 2. ESTADO TÉCNICO ACTUAL
*   **Core**: React + TypeScript + Vite.
*   **Enrutamiento**: `HashRouter` (Crucial para estabilidad en subdirectorios y Vercel).
*   **Base de Datos**: Supabase (Gestión de pedidos, clientes y tracking).
*   **Landing Page**: `VisualLanding.tsx` reconstruida al 100% con flujo dinámico de 5 secciones (Hero, SRI, Catálogo, Rifas, Tracking).
*   **Gestión Interna**: Restaurada tras corregir el `ReferenceError` en `Layout.tsx`.

## 📜 3. REGLAS DE ORO DE DESARROLLO
1.  **No Placeholders**: Nunca usar cuadros vacíos. Si falta un video, usar una composición de `motion.div` con gradientes y texto descriptivo hasta recibir el activo final.
2.  **Responsividad Absoluta**: Cada sección nueva debe ser testeada con `md:` y `lg:` para asegurar que los textos masivos no se rompan en móvil.
3.  **Importaciones Limpias**: Siempre verificar que `motion` y los iconos de `HeroIcons` o `CordovaIcons` estén presentes antes de usarlos.
4.  **Flujo de Usuario**: Separar siempre al cliente SRI (formal/empresarial) del cliente Imprenta General (creativo/rápido).

## 🚀 4. PENDIENTES CRÍTICOS (NEXT STEPS)
*   [ ] **Integrar Videos**: Sustituir contenedores temporales en `VisualLanding.tsx` por archivos `.webp` cuando el usuario los provea.
*   [ ] **Despliegue Vercel**: Ejecutar `npm run build` y subir a producción una vez validados los activos visuales.
*   [ ] **Sincronización de Inventario**: Conectar el motor de precios industrial con el stock real de proveedores en Supabase.

---
**Nota**: Este proyecto no es solo una web, es un "juguete de sorpresas" visual que debe asombrar al cliente de Imprenta Córdova en cada scroll.
