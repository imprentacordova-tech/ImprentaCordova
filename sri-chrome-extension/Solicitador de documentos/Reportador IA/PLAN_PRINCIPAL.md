# 🚀 Plan Principal: Reportador de Imprentas SRI (Elite)

Este documento detalla la hoja de ruta oficial para la automatización del proceso de reporte de autorizaciones de impresión en el portal del SRI.

---

## 🔑 Acceso Inicial
- **URL**: [SRI en Línea Login](https://srienlinea.sri.gob.ec/facturacion-internet/login.jspa)
- **Usuario**: `0702065319001`
- **RUC Imprenta**: `0702065319001` (IMPRENTA CORDOVA)

---

## 🛤️ Flujo de Navegación (10 Pasos)

1.  **Selección de Contribuyente**: Elegir la opción **"Imprenta"**.
    -   URL: `revisar-tipo-contribuyente.jspa`
2.  **Menú Principal**: Seleccionar **"Manejo de Autorizaciones para Documentos"**.
    -   URL: `seleccionar-tipo-contribuyente.jspa`
3.  **Selección de Establecimiento**: Elegir **"001 IMPRENTA CORDOVA"**.
    -   URL: `establecimientos-imprenta.jspa`
4.  **Sub-Menú**: Seleccionar **"Autorizaciones Pendientes de Reportar"**.
    -   URL: `menu-preimpresos.jspa`
5.  **Parámetros de Búsqueda**: 
    -   Marcar: **"Todas las autorizaciones"**.
    -   Acción: Clic en **"Buscar"** (`nextPage()`).
    -   URL: `pendientes-reportar-busqueda.jsp`
6.  **Listado de Clientes**: Clic en el primer registro de la columna `#` (`primeraCol`).
    -   URL: `pendientes-reportar-listado.jspa`
7.  **Reporte de Autorización (Detalle)**: 
    -   El sistema extrae automáticamente la secuencia (`fin - ini + 1`).
    -   Acción: Clic en **"Siguiente"** (`btnSiguiente`).
    -   URL: `reporte-autorizacion.jspa`
8.  **Información de Reporte (Confirmación)**: 
    -   Visualización del resumen del trabajo reportado.
    -   URL: `pendiente-reportar-informacion.jspa`
9.  **Retorno al Bucle**: 
    -   Clic en el link: **"Servicio de Rentas Internas"**.
    -   Objetivo: Regresar a la pantalla de búsqueda para procesar el siguiente cliente.
10. **Informe Final**:
    -   El asistente muestra el conteo total categorizado:
        -   **25 Hojas** (Talonario)
        -   **50 Hojas** (Talonario)
        -   **100 Hojas** (Talonario estándar)
        -   **200 Hojas** (Talonario doble/Block)
        -   **Otros** (Secuencias personalizadas)

---

## 💎 Diseño Elite (Sterling Slate)
- **Paleta**: Nocturna (Deep Slate #0b1326) con acentos Esmeralda (#4edea3).
- **Asistente**: Panel flotante con *glassmorphism* y desenfoque atmosférico.
- **Micro-animaciones**: Transiciones suaves y barras de progreso en tiempo real.

---

> [!IMPORTANT]
> Este plan es el núcleo lógico de la extensión **SRI Turbo Elite**. Cualquier cambio en la estructura del portal del SRI debe ser reflejado aquí para mantener la robustez de la automatización.
