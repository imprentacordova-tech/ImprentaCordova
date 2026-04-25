# Manual de Instrucciones: Imprenta Córdova Elite System

Este manual detalla las reglas de negocio, estándares de diseño y flujos técnicos para el sistema de Imprenta Córdova. Cualquier IA que trabaje en este proyecto debe adherirse estrictamente a estas directrices.

## 1. Reglas de Régimen Tributario (SRI)

El sistema debe detectar y aplicar reglas basadas en el régimen del cliente.

### **Régimen: RIMPE Negocio Popular**
- **Documentos Permitidos:** Factura, Nota de Venta (Principal), Liquidación de Compra, Notas de Crédito/Débito, Guías de Remisión, etc.
- **Límites de Impresión:** **SIN LÍMITE DE 25 HOJAS.** Pueden imprimir talonarios completos.
- **Identificación en DB:** Columnas `regimen` o `regime`. Valores: "RIMPE", "POPULAR", "NEGOCIO POPULAR".

### **Régimen: General / Emprendedor**
- **Documentos Permitidos:** Factura (Electrónica obligatoria), Liquidación de Compra, etc. **NO NOTA DE VENTA.**
- **Límites de Impresión:** **ESTRICTAMENTE 25 UNIDADES (Hojas/Sets)** para documentos de contingencia (Facturas físicas solo por contingencia).
- **Identificación en DB:** Valores: "GENERAL", "EMPRENDEDOR".

---

## 2. Estética "Obsidian & Gold" (Luxury Industrial)

El diseño debe sentirse premium, industrial y de "élite".

- **Paleta de Colores:** 
  - Fondos: `#050505` (Obsidian), `#0a0a0a`.
  - Acentos: `#D4AF37` (Gold), `#C5A028`.
  - Bordes: `rgba(212, 175, 55, 0.1)` o `white/5`.
- **Efectos:** Glassmorphism, bordes dorados sutiles en hover, animaciones suaves con Framer Motion.
- **Tipografía:** Inter o Roboto (Modern Sans-serif).

---

## 3. Arquitectura Técnica y Datos

### **Contexto de Datos (`DataContext.tsx`)**
- Centraliza la lógica de mapeo entre Supabase y la UI.
- **Mapeo Robusto:** Siempre manejar inconsistencias de nombres en DB (`regime` vs `regimen`, `trade_name` vs `nombre_comercial`).
- **Emoji de Categorías:** Usar la constante exportada `CATEGORY_EMOJIS` para mantener consistencia visual.

### **Flujo de Pedidos (`NuevoPedido.tsx`)**
- Sigue un proceso de 5 pasos (Identity, Lobby, Specification, Capital, Deployment).
- El paso 3 (`ServiceSelector`) filtra productos dinámicamente según el régimen detectado en el paso 1.

---

## 4. Troubleshooting Comunes

- **ReferenceError (categoryEmoji):** No definir diccionarios de emojis localmente en componentes que se mapean en producción. Usar siempre `CATEGORY_EMOJIS` de `DataContext`.
- **Drift de Datos:** Al crear/actualizar clientes, asegurarse de enviar los datos a las columnas correctas de Supabase (verificar `mapClienteToDB`).

> [!IMPORTANT]
> El objetivo es una experiencia de usuario que "guíe" al operador, evitando errores legales (como imprimir Notas de Venta a un Régimen General).
