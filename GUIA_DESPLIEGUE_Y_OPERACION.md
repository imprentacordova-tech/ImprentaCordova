# 🚀 GUÍA DE DESPLIEGUE Y OPERACIÓN: IMPRENTA CÓRDOVA (100% EN VIVO)

Esta guía paso a paso te permite poner en marcha todo el ecosistema de **Imprenta Córdova** en menos de 10 minutos.

---

## 📋 Resumen de Componentes del Ecosistema

| Componente | Plataforma | Ubicación en el Proyecto |
| :--- | :--- | :--- |
| **Frontend Web App (PWA)** | Vercel / Netlify / Local | `ImprentaCordova/` |
| **Base de Datos & Realtime** | Supabase (PostgreSQL) | `ImprentaCordova/supabase/SCHEMA_COMPLETO.sql` |
| **Backend Facturación SRI** | Render.com (Node Express) | `ImprentaCordova/cordova-sri-backend/` |
| **Extensión Chrome SRI** | Google Chrome (Dev Mode) | `ImprentaCordova/sri-chrome-extension/` |

---

## ⚡ PASO 1: Aprovisionar Base de Datos Supabase (1 Clic)

1. Ingresa a tu panel de **[Supabase.com](https://supabase.com)** y crea un nuevo proyecto (o abre el existente).
2. En la barra lateral izquierda, haz clic en **SQL Editor**.
3. Abre el archivo [`SCHEMA_COMPLETO.sql`](file:///c:/Programacion/Paginas%20Web/ImprentaCordova.Net/ImprentaCordova/supabase/SCHEMA_COMPLETO.sql).
4. Copia todo el contenido del archivo, pégalo en el editor SQL de Supabase y presiona **RUN**.
5. Ve a **Storage** en Supabase y crea un Bucket público llamado `trabajos` (para fotos de órdenes y comprobantes).

---

## 🔑 PASO 2: Configurar Variables de Entorno del Frontend

Crea o edita tu archivo `.env` dentro de `ImprentaCordova/` con tus valores reales:

```env
# ── Supabase (Encuéntralo en Project Settings -> API) ──
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY_DE_SUPABASE

# ── Microservicio SRI (Render.com) ──
VITE_RENDER_SRI_API_URL=https://cordova-sri-api.onrender.com

# ── Barrera anti-abuso del backend ──
# DEBE COINCIDIR con la variable API_KEY que configures en Render.
# Es PÚBLICA A PROPÓSITO: viaja en el navegador. No es una credencial — es un filtro
# contra abuso, junto con CORS y el rate limiting.
VITE_RENDER_API_KEY=la-misma-clave-que-API_KEY-en-Render
```

> [!WARNING]
> **NO agregues `VITE_GEMINI_API_KEY` ni `VITE_RESEND_API_KEY`.**
> Todo lo que empieza con `VITE_` se **incrusta en el bundle público** que sirve Vercel:
> cualquiera lo lee con `Ctrl+U`. La IA y el envío de correo pasan por el backend, que es el
> único que conoce esas claves. Hay un test (`__tests__/security.secrets.test.ts`) que falla
> si alguien vuelve a meter un secreto por esa vía — si falla, **no lo desactives**: sacá el
> secreto y **ROTALO** en el proveedor.

---

## ☁️ PASO 3: Desplegar el Frontend en Vercel

1. Sube tu proyecto a GitHub:
   ```bash
   git add .
   git commit -m "feat: preparar imprenta cordova para produccion"
   git push origin main
   ```
2. En **[Vercel.com](https://vercel.com)**:
   * Haz clic en **Add New...** -> **Project**.
   * Importa tu repositorio.
   * En **Root Directory**, selecciona `ImprentaCordova`.
   * En **Environment Variables**, agrega:
     * `VITE_SUPABASE_URL`
     * `VITE_SUPABASE_ANON_KEY`
     * `VITE_RENDER_SRI_API_URL`
     * `VITE_RENDER_API_KEY` (la misma que `API_KEY` en Render)
   * Haz clic en **Deploy**.

> [!NOTE]
> `VITE_GEMINI_API_KEY` **ya no va acá**. La clave de IA vive solo en Render.

---

## 🛡️ PASO 4: Desplegar el Microservicio SRI en Render.com

1. En **[Render.com](https://dashboard.render.com)**, haz clic en **New +** -> **Web Service**.
2. Conecta el repositorio de GitHub y selecciona la carpeta `cordova-sri-backend`.
3. Render detectará automáticamente `render.yaml`:
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
4. Configura las variables de entorno en Render:
   * `API_KEY`: **OBLIGATORIA.** La misma clave que pusiste en `VITE_RENDER_API_KEY`. Si falta,
     los endpoints privilegiados (correo, IA, padrón, y los de clientes/trabajos de la
     extensión) responden **503 a propósito**: el backend falla cerrado en vez de quedar abierto.
   * `SRI_AMBIENTE`: `1` (Pruebas) o `2` (Producción).
   * `SUPABASE_URL`: `https://TU_PROYECTO.supabase.co`
   * `SUPABASE_SERVICE_ROLE_KEY`: Tu clave `service_role` de Supabase. **Solo vive acá.**
   * `RESEND_API_KEY`: Para el envío de correos. Ya no hay clave hardcodeada de respaldo.
   * `GEMINI_API_KEY`: Para la IA (OCR de RUC, análisis de artes, proyecciones).
   * `FIRMA_P12_BASE64` (Opcional para pruebas): Tu archivo de firma digital `.p12` en base64.
   * `FIRMA_PASSWORD` (Opcional): Clave del certificado digital.
5. Copia la URL que te entregue Render y colócala en tu frontend (`VITE_RENDER_SRI_API_URL`).

> [!IMPORTANT]
> **El backend se tiene que REDESPLEGAR.** Se le agregaron endpoints nuevos
> (`/api/v1/padron/importar`, `/api/v1/emails/enviar`, `/api/v1/ai/generate`,
> `/api/v1/clientes/*`, `/api/v1/trabajos/*`). Si desplegás solo el frontend, el correo,
> la IA y la importación del padrón devuelven 503.

---

## 🧩 PASO 5: Instalar la Extensión de Chrome para el SRI

1. Abre Google Chrome en la computadora de la imprenta.
2. Escribe en la barra de direcciones: `chrome://extensions/`
3. Activa la casilla **Modo de desarrollador** (arriba a la derecha).
4. Haz clic en el botón **Cargar descomprimida**.
5. Selecciona la carpeta:
   `c:\Programacion\Paginas Web\ImprentaCordova.Net\ImprentaCordova\sri-chrome-extension\Solicitador de documentos\Extension_Imprenta_Cordova`
6. ¡Listo! La extensión quedará anclada en Chrome para autocompletar trámites del SRI bajo el código **8634** de Imprenta Córdova.

> [!IMPORTANT]
> **Antes de empaquetar la extensión, configurá su clave de acceso.**
> Abrí `cordovaApi.js` y poné en `CORDOVA_API_KEY` **la misma clave** que `API_KEY` en Render y
> `VITE_RENDER_API_KEY` en Vercel. Las tres tienen que ser iguales.
>
> La extensión se distribuye **empaquetada**, así que todo su código es público y legible:
> por eso **no puede contener** la `service_role` de Supabase, ni la clave de Resend, ni la de
> Gemini. Todas esas operaciones pasan por el backend.

---

## 🚦 PASO 6: Prueba de Ciclo Operativo Completo

1. **Recepción / Mostrador (`/nuevo`):** Registra un nuevo pedido usando un cliente rápido o subiendo foto de RUC con OCR IA.
2. **Taller (`/kds`):** Comprueba que la orden aparece en tiempo real con sonido de campanilla y muévela a *"En Prensa"* y *"Listo para Retiro"*.
3. **Público (`/tracking`):** Busca la orden por su número o RUC, verifica el visor de estado y la aprobación de arte.
4. **Entrega (`/retiros`):** Registra el pago del saldo restante y marca el pedido como *"Entregado"*.
5. **Caja & Auditoría (`/finanzas`):** Verifica que el ingreso se haya registrado en el libro diario inmutable.

---

## 🔄 PASO 7: Migraciones de Base de Datos

Las migraciones viven en `ImprentaCordova/supabase/migrations/`. Se corren en Supabase →
**SQL Editor** → pegar → **RUN**, igual que el esquema inicial. Son aditivas y no rompen datos.

| Migración | Qué agrega |
| :--- | :--- |
| `20260914_modelo_impresion.sql` | La columna `modelo_impresion` en `trabajos`: con qué variante se produce cada orden. |
| `20260914_tramite_sri.sql` | La columna `tramite_sri`: cuál de las tres casillas (Aument. / Cambiar. / Mismo.) va marcada en la solicitud. Sin ella se imprime `MISMO`, que es el comportamiento anterior. |

> **Buena noticia:** `addTrabajo()` tiene un bucle que descarta columnas inexistentes, así que
> **el código se puede desplegar antes de correr la migración** sin romper nada. La columna
> queda vacía hasta que la corras y el sistema usa el modelo por defecto.

---

## 🔒 SEGURIDAD: Rotación de Claves (OBLIGATORIO antes de producción)

> [!CAUTION]
> **La `service_role` de Supabase y la clave de Resend estuvieron hardcodeadas y quedaron
> publicadas en el bundle de Vercel y en el historial de git.** Sacarlas del código **no
> deshace la filtración**: hasta que las rotes, siguen siendo válidas para cualquiera que las
> haya copiado.
>
> La `service_role` **saltea toda la Row Level Security**. Quien la tenga puede leer, escribir
> y borrar la base entera: clientes, RUCs, facturas, finanzas y las credenciales del SRI.

**Hacelo en este orden:**

1. **Supabase** → Settings → API → **Reset `service_role` key**.
2. **Resend** → API Keys → revocar la clave vieja y crear una nueva.
3. **Google** → crear/rotar la clave de Gemini si estuvo expuesta.
4. **Render** → Environment: cargar las claves NUEVAS (`API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `RESEND_API_KEY`, `GEMINI_API_KEY`) y **redesplegar**.
5. **Vercel** → Environment: `VITE_RENDER_API_KEY` con el mismo valor que `API_KEY`, y
   redesplegar el frontend.
6. **Extensión** → poner la misma clave en `CORDOVA_API_KEY` (`cordovaApi.js`) y reempaquetar.
7. **Git** → las claves viven en 4 commits (`2f9c7b5`, `49241c8`, `d7abe41`, `d9822bf`).
   Limpiar el historial con `git filter-repo`, o **asumir que son públicas para siempre** —
   en ese caso la rotación es la única defensa real.

**Verificación:** `__tests__/security.secrets.test.ts` escanea el código fuente, detecta
secretos leídos vía `import.meta.env.VITE_*`, y decodifica los JWT del bundle buscando un
claim `service_role`. Si falla, **no lo desactives**: sacá el secreto y ROTALO.

---

## ✅ Checklist antes de cada despliegue

```bash
npx tsc --noEmit    # exit 0 — el build NO chequea tipos, hay que correrlo aparte
npm test            # todos verdes
npm run build       # exit 0 — regla inquebrantable del proyecto
```

> Si `npm test` falla con **"Timeout waiting for worker to respond"**, no son los tests: son
> workers de vitest huérfanos ocupando los *named pipes*. Comprobalo con
> `npx vitest run --pool=threads` (usa hilos, no subprocesos). Se limpian reiniciando la máquina.
