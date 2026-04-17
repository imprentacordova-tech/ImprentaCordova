# Instrucciones para Agentes de IA (Córdova Systems)

> **ATENCIÓN AGENTE**: Estás operando en un sistema de misión crítica para un negocio real con alto tráfico (50+ transacciones diarias). Tu comportamiento debe priorizar la **estabilidad**, **velocidad** y **coherencia visual**.

## 1. Reglas de Comportamiento Técnico

- **No asumas, verifica**: Antes de modificar `useOrder.ts` o `mockApi.ts`, lee el código completo. Estos archivos contienen validaciones legales del SRI (Ecuador) que no deben romperse.
- **Zero-Touch Automation**: El usuario valora que el sistema "piense" por él. 
    - Ejemplo: Si el cliente es "Negocio Popular", el sistema debe sugerir automáticamente "Nota de Venta".
    - Ejemplo: Los abonos deben registrarse en el Libro Diario sin intervención manual.
- **Latencia UX**: Evita añadir animaciones pesadas o procesos de carga que bloqueen la interfaz durante más de 500ms. El dueño (Pedro) atiende clientes en fila y no puede esperar.

## 2. Enfoque en el Producto

- **Prioridad #1: Renovaciones**: La mitad del trabajo es repetir lo que se hizo el año pasado. Cualquier feature que facilite "buscar -> clonar -> imprimir" es prioridad máxima.
- **Prioridad #2: Notas de Venta**: Asegúrate de que el inventario de papel químico se descuente correctamente. Una "Nota de Venta" no es un PDF cualquiera, es un documento legal que afecta el stock.
- **Prohibido**: No gastes tokens ni tiempo en proponer módulos de edición de libros, revistas de gran volumen o catálogos editoriales. No es el nicho de mercado.

## 3. Identidad del Usuario (Pedro Córdova)

- El usuario principal es **Pedro**, un experto en artes gráficas con décadas de experiencia. 
- Valora la **claridad sobre la ornamentación**. 
- Todo debe estar en **Español de Ecuador**. (Ej: usar "Caja" en lugar de "Cash Desk", "Abono" en lugar de "Deposit").

## 4. Estilos (Shadow & Gold)

- Debes usar exclusivamente el sistema de diseño definido en [design_manifest.md](file:///c:/Users/Santiago/Documents/Visual%20Code%20Antigraviti/01_Proyectos_Principales/Imprentacordova.net/design_manifest.md).
- Si creas una página nueva, usa `glass-card-luxury` y `text-gold-gradient`.

---
*Si no sigues estas reglas, el sistema perderá la confianza del usuario y la eficiencia de la imprenta se verá comprometida.*
