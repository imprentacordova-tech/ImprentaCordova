# Guía del Dueño: El Enfoque de Pedro Córdova

Este documento define la filosofía de gestión y uso de la aplicación desde la perspectiva de **Pedro Córdova**, dueño y operador de la imprenta. Cualquier desarrollo debe alinearse con esta visión.

## 1. El Operador Práctico
Pedro no es solo un administrador; él opera máquinas, atiende clientes y diseña. 
- **La Herramienta es un Aliado, no un Obstáculo**: La aplicación debe ser lo suficientemente rápida como para usarse con una mano mientras se atiende una llamada o se revisa una prueba de impresión.
- **Estabilidad de Hierro**: Si el sistema se cae un lunes por la mañana con 5 personas en fila, es un desastre. El sistema debe ser robusto y tener redundancia (como el uso de `localStorage` para persistencia inmediata).

## 2. Los Pilares de Pedro

### A. El Cuadre de Caja (Confianza Financiera)
- El módulo de **Cuentas** es sagrado. El balance entre Ingresos (abonos y pagos completos) y Egresos (compras de material, servicios) debe ser transparente.
- "Cuentas claras, amistades largas": El sistema debe permitir ver exactamente cuánto entró en el día sin margen de error.

### B. El Rescate Histórico (Renovaciones)
- Pedro sabe que el 50% de sus clientes regresan por "lo mismo de siempre".
- La capacidad de buscar una orden de hace 6 meses, ver qué papel se usó y clonarla para una nueva autorización es la funcionalidad que más tiempo le ahorra.

### C. Control de Insumos
- El papel químico (para facturas y notas de venta) es el insumo más crítico. 
- Pedro necesita que el sistema le alerte si el stock está bajo (vía el módulo de Inventario) para no quedar mal con los pedidos del SRI.

## 3. Filosofía de Interfaz
- **Español de Imprenta**: Usar terminología técnica local (Ej: "Talonario", "Duplicado", "Papel Químico", "Encolado", "Numerado").
- **Minimalismo de Alto Contraste**: El tema oscuro con acentos dorados no es solo estética; permite leer los datos rápidamente bajo la luz fluorescente del taller sin cansar la vista.

## 4. Mensaje para el Futuro
> "La imprenta ha funcionado por años con archivos de Corel y carpetas. Este sistema digital es para que la información fluya más rápido, no para complicar el trabajo. Si algo se puede hacer con un solo botón, no le pongas dos." — *Pedro Córdova*
