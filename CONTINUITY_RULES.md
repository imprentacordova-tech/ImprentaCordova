# MANIFIESTO DE CONTINUIDAD TÉCNICA - IMPRENTA CÓRDOVA
**Reglas Inquebrantables para Futuros Agentes de Inteligencia Artificial**

Este documento ha sido generado para asegurar el cumplimiento estricto y la continuidad del proyecto "Imprenta Córdova" sin importar interrupciones en la sesión o falta de contexto (tokens). Como ente IA a cargo del proyecto, debes **leer y acatar inmediatamente este archivo antes de modificar código**.

---

## 1. DISEÑO: "OBSIDIAN & GOLD" (SISTEMA ATELIER)
Todas las vistas del sistema administrativo deben regirse ÚNICA Y EXCLUSIVAMENTE por este patrón de diseño de hiper-lujo:
*   **Fondos Base:** Siempre obscuros. Usar la clase base que invoca a `#020617` (`bg-brand-dark`), mezclada con capas semitransparentes mediante `bg-white/5` o `bg-black/20`. NUNCA utilices un fondo blanco absoluto para el Dashboard, solo en módulos de impresión (Nota de Venta, Orden de Producción).
*   **Colores de Acento (Liquid Gold):** Elementos destacados, números clave, KPIs y botones primarios usan `text-liquid-gold` o gradientes predefinidos como `bg-liquid-gold`.
*   **Tipografía de Alta Gama:** Uso de fuente cursiva `italic` en titulares y el tracking separado para subtítulos (e.g., `uppercase tracking-[0.3em] font-black`).
*   **Estilo "Glassmorphism" (Cristalería Mágica):** Todos los contenedores usan `backdrop-blur-xl`, `border border-white/5`, y la sombra predefinida `shadow-luxury`.
*   **Efectos Ambientales:** Agregar divs de luz desenfocada: `bg-liquid-gold/5 blur-[80px]`.

---

## 2. SEGURIDAD BLOCKCHAIN: EL REGISTRO DE ACTIVIDADES
Tal y como lo requirió el administrador humano, el sistema cuenta con un **Registro De Auditoría "Tipo Blockchain"** (`RegistroActividad.tsx` & `activityLogService.ts`).

*   **PILARES DE AUDITORÍA:** 
    Es absolutamente OBLIGATORIO que CUALQUIER ACCIÓN (Crear, Editar, Eliminar, Cambiar de Estado), en CUALQUIER MODULO, llame de forma asíncrona a `logActivity()` para que quede registrado su hash en el "ledger".
*   **EJEMPLO DE APLICACIÓN EN UNA VISTA:**
    ```typescript
    import { logActivity } from '../services/activityLogService';
    import { useOutletContext } from 'react-router-dom';
    import { User } from '../types';

    // Para obtener el usuario activo global del Layout/Context
    const { currentUser } = useOutletContext<{ currentUser: User }>();

    // Durante el evento (onSubmit, onClick etc.)
    await logActivity(
        currentUser.id, 
        'ACCION_TIPO', // Ej. EDITAR_ORDEN, CREAR_CLIENTE
        'NombreDeModulo', // Ej. TrabajoDetalle
        itemId, 
        `Descripción de la modificación para auditoría humana.`
    );
    ```
*   **REGLA DE PURGA (90 DÍAS):** 
    El equipo ya implementó la purga automática trimestral. No requieres configurarla de nuevo. Funciona en cada refresco accediendo a `purgeOldEntries()` del service. No la toques.

---

## 3. RENDIMIENTO Y BUILD (NO ROMPER EL BALANCE)
El proyecto ha sido estabilizado y particionado en el `vite.config.ts` utilizando dependencias en `manualChunks` para evitar problemas de sobrecarga y tiempos largos de respuesta.
*   El comando `npm run build` debe culminar con código `0` de salida de manera obligatoria. NO modifiques configuraciones de caché en GitHub o Vercel sin permiso directo.
*   Cualquier ícono que insertes debe provenir y estar correctamente instanciado dentro de `src/components/Icons.tsx` mediante SVGs puros tipo HeroIcons para ahorrar carga de red de librerías costosas.

---

## 4. ESTADO ACTUAL Y CONTINUIDAD DE SESIONES (CHECKLIST CUBIERTA)
* [x] Rediseño a Dark Mode (Obsidian & Gold) completado (Proveedores, Gestión de Usuarios, Diseño, Finanzas, Trabajos).
* [x] El sistema de LOGS Blockchain implementado al 100%. Cubierto TrabajoDetalle y Vistas Core.
* [x] Migración total de mockApi a Supabase completada sin dependencias basura. Resolvimos problemas de inicialización cruzada en DataContext (Commit 65a7894).
* [x] Optimizaciones en Memoria completadas y Entorno Producción Vercel Estable.
* [x] Infatestructura SEO (Helmet) e inyección del \`LOGO.png\` global.

## 5. SIGUIENTES PASOS PARA EL PRÓXIMO AGENTE
* **Prioridad Inmediata (Módulo Taller/KDS):** Completar el \`Kitchen Display System (KDS)\` para el área de producción física de la imprenta. Es crítico que la interfaz del Taller sea libre de atascos y refleje órdenes frescas al instante (Supabase Realtime si es posible).
* **Mejoras del Catálogo SEO:** Asegúrate de que las rutas públicas donde el cliente hace tracking sigan la convención SEO con \`Helmet\`.

A partir de este punto, avanza a **Integraciones Nativas y Tests en Producción**, asume estabilidad total de estas capas. No pierdas el tiempo proponiendo lo que ya está en el archivo. ¡Sigue adelante, IA élite!

---

## 6. REGLAS DE NEGOCIO Y CRM: DOCUMENTOS SRI Y RÉGIMENES TRIBUTARIOS (INFORMACIÓN DE ORO)
El sistema debe clasificar a los clientes y habilitar los tipos de documentos a imprimir (PDFs y talonarios) basado en su Régimen del SRI (obtenido de su RUC en PDF). 

*   **Régimen 1: Rimpe Negocio Popular (Ventas hasta $20.000)**
    *   **ÚNICOS** autorizados para imprimir **"Notas de Venta"** físicas. (Caso de uso más común: clientes nuevos imprimen esto ~20 veces al día).
    *   **Servicio extra:** Se les puede realizar la declaración anual (costo $10, plazo mayo). Si declaran < $2500 no pagan impuesto; de $15000 a $20000 pagan $60.
    *   **Requisitos en sistema (Solicitud):** Deben contar con la clave del SRI o tener la solicitud online de cantidad de documentos ya hecha. En la Solicitud de Impresión, el sistema debe incluir un Checkbox de verificación: `[x] Al día: verificado [fecha]`.
    *   **Documentos físicos permitidos:** Factura, **NOTA DE VENTA**, Liquidación de compra de bienes muebles usados, Notas de crédito, Notas de débito, Guías de remisión, Boletos/Entradas a espectáculos, Liquidación de vehículos usados, Acta de recepción de vehículos, Liquidación de bienes/servicios.

*   **Régimen 2: General (Ventas > $20.000)**
    *   **Declaraciones:** Mensuales.
    *   **Facturas Físicas:** Máximo 25 facturas físicas permitidas al año (por la regla del 1% de electrónicos del año anterior).
    *   **PROHIBIDO:** No pueden mandar a hacer Notas de Venta.
    *   **Documentos físicos permitidos:** Factura (máx. 25h), Liquidación de bienes/servicios, Notas de débito, Guías de remisión, Acta de botellas PET, Liquidación de bienes muebles usados, Liquidación de vehículos usados, Acta recepción vehículos usados.

*   **Régimen 3: Rimpe Emprendedor (Ventas > $20.000)**
    *   **Declaraciones:** Semestrales (los primeros 2 años, luego pasan a Régimen General).
    *   **Facturas Físicas:** Máximo 25 facturas físicas permitidas al año.
    *   **PROHIBIDO:** No pueden mandar a hacer Notas de Venta.
    *   **Documentos físicos permitidos:** Factura (máx. 25h), Notas de débito, Guías de remisión, Liquidación de bienes/servicios, Acta de botellas PET, Liquidación de bienes muebles usados, Liquidación de vehículos usados, Acta recepción vehículos usados.

*   **Reglas CRM (Alta de Clientes SRI):**
    *   Al llenar los datos de un cliente nuevo basándose en su certificado RUC (PDF del SRI), se le debe asignar una etiqueta/badge discreta indicando que es cliente de "Impresión de Docs Autorizados SRI".
    *   Se deben registrar estrictamente los **establecimientos abiertos**, **puntos de emisión**, **actividades** y los **números de secuencia** que el cliente quiere que salgan en su talonario.
