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

# ── Google Gemini AI (Obtén tu clave gratis en aistudio.google.com) ──
VITE_GEMINI_API_KEY=AIzaSyTuClaveDeGeminiAqui
```

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
     * `VITE_GEMINI_API_KEY`
   * Haz clic en **Deploy**.

---

## 🛡️ PASO 4: Desplegar el Microservicio SRI en Render.com

1. En **[Render.com](https://dashboard.render.com)**, haz clic en **New +** -> **Web Service**.
2. Conecta el repositorio de GitHub y selecciona la carpeta `cordova-sri-backend`.
3. Render detectará automáticamente `render.yaml`:
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
4. Configura las variables de entorno en Render:
   * `SRI_AMBIENTE`: `1` (Pruebas) o `2` (Producción).
   * `SUPABASE_URL`: `https://TU_PROYECTO.supabase.co`
   * `SUPABASE_SERVICE_ROLE_KEY`: Tu clave `service_role` de Supabase.
   * `FIRMA_P12_BASE64` (Opcional para pruebas): Tu archivo de firma digital `.p12` en base64.
   * `FIRMA_PASSWORD` (Opcional): Clave del certificado digital.
5. Copia la URL que te entregue Render y colócala en tu frontend (`VITE_RENDER_SRI_API_URL`).

---

## 🧩 PASO 5: Instalar la Extensión de Chrome para el SRI

1. Abre Google Chrome en la computadora de la imprenta.
2. Escribe en la barra de direcciones: `chrome://extensions/`
3. Activa la casilla **Modo de desarrollador** (arriba a la derecha).
4. Haz clic en el botón **Cargar descomprimida**.
5. Selecciona la carpeta:
   `c:\Programacion\Paginas Web\ImprentaCordova.Net\ImprentaCordova\sri-chrome-extension\Solicitador de documentos\Extension_Imprenta_Cordova`
6. ¡Listo! La extensión quedará anclada en Chrome para autocompletar trámites del SRI bajo el código **8634** de Imprenta Córdova.

---

## 🚦 PASO 6: Prueba de Ciclo Operativo Completo

1. **Recepción / Mostrador (`/nuevo`):** Registra un nuevo pedido usando un cliente rápido o subiendo foto de RUC con OCR IA.
2. **Taller (`/kds`):** Comprueba que la orden aparece en tiempo real con sonido de campanilla y muévela a *"En Prensa"* y *"Listo para Retiro"*.
3. **Público (`/tracking`):** Busca la orden por su número o RUC, verifica el visor de estado y la aprobación de arte.
4. **Entrega (`/retiros`):** Registra el pago del saldo restante y marca el pedido como *"Entregado"*.
5. **Caja & Auditoría (`/finanzas`):** Verifica que el ingreso se haya registrado en el libro diario inmutable.
