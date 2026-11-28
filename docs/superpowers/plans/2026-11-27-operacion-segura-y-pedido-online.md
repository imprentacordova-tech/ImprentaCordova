# Operación segura, extensión v3 y sitio público de primer nivel — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar Imprenta Córdova operando en producción sin agujeros de seguridad, con la extensión SRI registrando órdenes completas y sin duplicados, y con un sitio público pulido que convierta visitas en solicitudes.

**Architecture:** Tres fases que se publican por separado. (A) El backend de Render pasa a emitir **sesiones firmadas por operador** (HMAC, sin dependencias nuevas) y deja de aceptar la "API key pública" del bundle. (B) La extensión toma esa sesión desde la web por el puente que ya existe, deja de crear órdenes cuando la lanza Nueva Orden y manda todos los datos que ya lee del portal. (C) Pasada de diseño sobre el sitio público guiada por el skill `ui-ux-pro-max` y los datos reales del negocio.

**Tech Stack:** React 18 + TS + Vite + Tailwind + framer-motion (front), Express en Node ≥18 (backend `cordova-sri-backend/`), extensión Chrome MV3 (`sri-chrome-extension/Solicitador de documentos/Extension_Imprenta_Cordova/`), Supabase (Postgres + PostgREST), Vitest (front) y `node --test` (backend).

**Spec:** este plan argumenta desde la auditoría del 2026-11-27 (resumida en "Contexto") y `memory/produccion-estado.md`.

## Contexto (hallazgos que el plan corrige)

1. `VITE_RENDER_API_KEY` viaja en el bundle → cualquiera usa `/api/v1/emails/enviar` (relay de correo abierto), `/api/v1/trabajos/listar` (1000 órdenes con datos personales) y crea clientes/órdenes.
2. `authenticateApiKey` (facturas, `ordenes/sincronizar`) deja pasar todo si `API_KEY` no está seteada.
3. CORS por defecto apunta a `imprentacordova.com`, no `.net`; `render.yaml` no define `ALLOWED_ORIGINS`.
4. Login: el panel valida contra `users` con la clave anon (que en prod NO puede leer `users`) → hoy se entra por nombres fijos sin contraseña (`contexts/AuthContext.tsx:104-126`).
5. Extensión: crea el trabajo (content.js:1602) **y** devuelve datos a Nueva Orden → órdenes duplicadas; `establecimiento:'001'` fijo (content.js:764); no manda dirección/serie/numeración; `docNames` solo 0/1/5; `cordova_launch_payload` nunca se limpia; "aceptada" se avisa al cargar la página (content.js:1663) sin confirmar; `innerHTML` sin escapar; clave SRI de la imprenta en texto plano en `chrome.storage.local`; `confirm()` auto-aceptado; `vitrina-count` sin clave falla siempre.
6. Sitio público: dirección inconsistente (landing "Av. Las Palmeras y Calle 4ta" vs recibo "Colón entre Sucre y Rocafuerte"), cifras de marketing sin verificar, íconos emoji en el ticker, imágenes sin dimensiones.

## Global Constraints

- `npm run build` DEBE salir 0; además `npx tsc --noEmit`, `npx eslint . --max-warnings 101` y `npx vitest run` en verde antes de cada commit.
- Backend: sin dependencias nuevas (usar `node:crypto`); Node ≥18; tests con `node --test cordova-sri-backend/test/`.
- Nunca POST de prueba contra producción (`keilxgrrevfsvyxufecz`, `cordova-sri-api.onrender.com`). Verificación de prod solo con GET.
- Nunca imprimir ni commitear secretos (`SESSION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY`).
- `logActivity()` en toda acción de negocio nueva.
- Vocabulario de documentos: una sola fuente, `DOCUMENTOS_SRI` en `services/solicitudesWebService.ts` (factura `0`, nota de venta `1`, guía `5`); la extensión lleva un espejo y un test verifica que coinciden.
- Textos de UI en español rioplatense neutro como el resto del panel ("Revisá", "Escribí").
- Push a `origin/main` = deploy: solo con el OK explícito del usuario en el chat.

## Review Focus

1. **Backend caído o dormido (Render gratis) al iniciar sesión** → el login debe decir "El servidor está despertando, reintentá en 30 s", no "contraseña incorrecta". Test en Task A4.
2. **Sesión vencida a mitad del turno** (token de 12 h) → la llamada al backend devuelve 401 y el panel manda a /login conservando la ruta, sin perder lo tipeado en Nueva Orden (borrador). Test en Task A4.
3. **Operador sin contraseña cargada** (`require_password=false`) → el backend NO emite sesión para roles Admin sin contraseña; los Operadores sí, con aviso. Test en Task A2.
4. **Extensión vieja (v2.4.2) instalada después del deploy** → el backend responde 426 "Actualizá la extensión" en vez de 401 mudo. Test en Task A3.
5. **Solicitud del SRI con establecimiento distinto de 001** → la orden guarda el código real. Test en Task B3.

---

## Fase A — Seguridad del backend y login real

### Task A1: Módulo de sesiones firmadas

**Files:**
- Create: `cordova-sri-backend/auth.js`
- Test: `cordova-sri-backend/test/auth.test.js`
- Modify: `cordova-sri-backend/package.json` (script `"test": "node --test test/"`)

**Interfaces:**
- Produces: `firmarSesion(payload: {sub: string, nombre: string, rol: string}, secreto: string, ttlSeg = 43200): string` (formato `base64url(json).base64url(hmacSHA256)`, incluye `exp`), `verificarSesion(token: string, secreto: string, ahora = Date.now()): {sub, nombre, rol, exp} | null`.

- [ ] **Step 1: Tests** — `firma y verifica ida y vuelta`; `rechaza firma alterada` (cambiar 1 char del payload → `null`); `rechaza vencido` (`ahora = exp*1000 + 1` → `null`); `rechaza secreto distinto`; `compara en tiempo constante` (usa `crypto.timingSafeEqual`, test: longitud distinta → `null` sin lanzar).
- [ ] **Step 2:** `cd cordova-sri-backend && npm test` → FAIL (módulo no existe).
- [ ] **Step 3:** Implementar `auth.js` con `node:crypto` (`createHmac('sha256')`, `timingSafeEqual`).
- [ ] **Step 4:** `npm test` → PASS (5 tests).
- [ ] **Step 5:** Commit `backend: sesiones firmadas con HMAC`.

### Task A2: `POST /api/v1/auth/login`

**Files:**
- Modify: `cordova-sri-backend/index.js` (nuevo endpoint junto a `/ping`, línea ~157)
- Create: `cordova-sri-backend/loginRules.js` (lógica pura) · Test: `cordova-sri-backend/test/loginRules.test.js`

**Interfaces:**
- Consumes: `firmarSesion` (A1).
- Produces: `evaluarLogin(usuarioDb: {id, nombre, rol, estado, password, require_password} | null, passwordIngresada: string): {ok: true, user} | {ok: false, motivo: 'NO_EXISTE'|'INACTIVO'|'CLAVE'|'ADMIN_SIN_CLAVE'}`. Endpoint responde `200 {token, user:{id,nombre,rol}}` o `401 {error}`; `503` si falta `SESSION_SECRET` o `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 1: Tests de `evaluarLogin`** — usuario activo con clave correcta → ok; clave incorrecta → `CLAVE`; `estado:'Inactivo'` → `INACTIVO`; `null` → `NO_EXISTE`; `rol:'Admin', require_password:false` → `ADMIN_SIN_CLAVE`; `rol:'Operador', require_password:false` → ok.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar `evaluarLogin`; el endpoint busca en `users` con service role (`supabaseAdminHeaders()`, `nombre=ilike.<nombre>`), aplica `evaluarLogin` y firma. Límite: 5 intentos fallidos por IP+nombre cada 10 min en un `Map` en memoria → `429`. Mensaje de error único para `NO_EXISTE`/`CLAVE` ("Usuario o contraseña incorrectos"). `logActivity` no existe en backend: registrar en `activity_log` vía REST con service role (acción `LOGIN`).
- [ ] **Step 4:** `npm test` → PASS; `node index.js` local + `curl -X POST localhost:3000/api/v1/auth/login` sin `SESSION_SECRET` → 503.
- [ ] **Step 5:** Commit `backend: login de operadores con sesión firmada`.

### Task A3: Proteger endpoints con sesión

**Files:**
- Modify: `cordova-sri-backend/index.js:67-105` (middlewares) y cada ruta listada abajo; `cordova-sri-backend/render.yaml`
- Test: `cordova-sri-backend/test/middleware.test.js`

**Interfaces:**
- Consumes: `verificarSesion` (A1).
- Produces: middleware `requireSession(req,res,next)` → lee `Authorization: Bearer <token>`, pone `req.operador = {sub,nombre,rol}`; sin token pero con `x-api-key` → `426 {error:'Actualizá la extensión de Córdova (v3).'}`; sin nada → `401`. Middleware `requireAdmin` (rol `Admin`).

- [ ] **Step 1: Tests** (mock de `req/res`): token válido → `next()`; token vencido → 401; solo `x-api-key` → 426; sin `SESSION_SECRET` → 503.
- [ ] **Step 2:** FAIL. **Step 3:** Implementar y reemplazar en rutas: `requireSession` en `facturas/emitir`, `facturas/:clave/estado`, `ordenes/sincronizar`, `notificar-email`, `emails/enviar`, `ai/generate`, `clientes/*`, `trabajos/crear|actualizar|listar`, `recordatorios/*`; `requireAdmin` en `padron/importar`. `trabajos/vitrina-count` queda **público** y devuelve solo `{count}`. Borrar `authenticateApiKey`/`requireApiKey`. `emails/enviar`: además exigir que `to` sea el email de un cliente existente (búsqueda REST) — si no, 400.
- [ ] **Step 4:** `npm test` → PASS. CORS: agregar `https://www.imprentacordova.net` y `https://imprentacordova.net` a `defaultOrigins`; en `render.yaml` declarar `ALLOWED_ORIGINS`, `SESSION_SECRET` (`sync: false`).
- [ ] **Step 5:** Commit `backend: endpoints protegidos por sesión, sin API key pública`.

### Task A4: Front — login contra el backend y token en cada llamada

**Files:**
- Modify: `contexts/AuthContext.tsx:74-149`, `services/backendApi.ts:17-70`, `pages/Login.tsx` (mensajes), `.env.example` (quitar `VITE_RENDER_API_KEY`)
- Create: `services/sesion.ts` · Test: `__tests__/services/sesion.test.ts`

**Interfaces:**
- Consumes: `POST /api/v1/auth/login` (A2).
- Produces: `sesion.guardar(token: string)`, `sesion.token(): string | null`, `sesion.limpiar()`, `sesion.vencida(token: string, ahora = Date.now()): boolean` (lee `exp` sin verificar firma). `backendApi` agrega `Authorization: Bearer` y ante 401 emite `window.dispatchEvent(new Event('cordova:sesion-vencida'))`.

- [ ] **Step 1: Tests** — `vencida` con exp pasado/futuro/token basura (→ true); `backendApi` ante 401 dispara `cordova:sesion-vencida` (mock `fetch`); `guardarBorrador(items, cliente)`/`leerBorrador()` en `services/sesion.ts` ida y vuelta por `sessionStorage`; login con backend que tira `TypeError` (dormido) → `error` = "El servidor está despertando, reintentá en 30 s".
- [ ] **Step 2:** FAIL. **Step 3:** `login()` llama primero a `despertarBackend()` y luego al endpoint; si OK guarda token + usuario. **Fallback de nombres fijos:** se mantiene SOLO detrás de `import.meta.env.VITE_LOGIN_LEGACY === 'true'` (default `false` en prod después del corte, ver Task D2). `Layout` escucha `cordova:sesion-vencida` → guarda borrador de Nueva Orden en `sessionStorage` (`cordova_borrador_nueva_orden`) y navega a `/login?volver=<ruta>`.
- [ ] **Step 4:** tsc + lint + vitest + build en verde.
- [ ] **Step 5:** Commit `panel: login validado por el backend y token de sesión`.

---

## Fase B — Extensión v3

Base: `EXT = sri-chrome-extension/Solicitador de documentos/Extension_Imprenta_Cordova/`.

### Task B1: Sesión desde la web en lugar de API key

**Files:** Modify `EXT/bridge.js`, `EXT/background.js`, `EXT/cordovaApi.js:37-58`, `contexts/AuthContext.tsx` (emitir), `EXT/popup.js` (estado "Conectado como X").

**Interfaces:**
- Consumes: `sesion.token()` (A4).
- Produces: mensaje web→extensión `{type:'CORDOVA_SESSION', token, nombre}` (enviado al iniciar sesión y en `CORDOVA_BRIDGE_READY`); `cordovaApi` guarda en `chrome.storage.session` (`cordova_session`) y manda `Authorization: Bearer`. Ante 401 → toast "Abrí el panel de Córdova para reconectar".

- [ ] **Step 1:** Test Vitest de la parte web: al hacer login se postea `CORDOVA_SESSION` con `targetOrigin = window.location.origin`.
- [ ] **Step 2–4:** Implementar; borrar `CORDOVA_API_KEY` y lectura de `cordova_api_key`. Verificación manual: cargar extensión desempaquetada, login en `localhost:3000`, popup muestra el nombre.
- [ ] **Step 5:** Commit.

### Task B2: Sin órdenes duplicadas

**Files:** Modify `EXT/content.js:701-781, 1569-1602`, `pages/NuevoPedido.tsx:543` (payload de lanzamiento).

**Interfaces:**
- Produces: el payload `CORDOVA_SRI_LAUNCH` lleva `origen:'nueva-orden'`; `registrarOrden` solo llama a `trabajos/crear` si el lanzamiento NO tiene `origen:'nueva-orden'`. Al terminar (éxito o cancelación) borra `cordova_launch_payload`, `cordova_origin_tab` y `cordova_launch_ts`.

- [ ] Test manual documentado (no hay harness de extensión): lanzar desde Nueva Orden → en `trabajos` aparece 1 sola fila; lanzar directo en el portal → 1 fila; segunda solicitud directa no hereda precio.
- [ ] Commit.

### Task B3: Datos completos y vocabulario compartido

**Files:** Create `EXT/docTypes.js` (espejo de `DOCUMENTOS_SRI`), Modify `EXT/content.js:722-764`, `EXT/manifest.json` (agregar `docTypes.js` antes de `content.js`), `pages/NuevoPedido.tsx:318` (usar `DOCUMENTOS_SRI`). Test: `__tests__/extension/docTypes.test.ts`.

**Interfaces:**
- Produces: `window.CORDOVA_DOC_TYPES: {codigo: string, nombre: string}[]`; el payload a `trabajos/crear` y a la web incluye `establecimiento` (= `codigoEst` leído), `puntoEmision`, `direccion`, `serie`, `numeracionDesde`, `numeracionHasta`, `fechaSolicitud`.

- [ ] **Step 1: Tests** — `docTypes.js` evaluado en un `vm` contiene exactamente los mismos nombres y códigos que `DOCUMENTOS_SRI`; `applySriPayload` con `est='002'` y `numeracionDesde='501'` deja `sriEstablecimiento='002'` y la numeración precargada (test sobre una función pura extraída `payloadAItemSri(payload, catalogo)` en `services/sriPayload.ts`).
- [ ] **Step 2–4:** Extraer `payloadAItemSri` de `NuevoPedido.applySriPayload` (líneas 271-353) a `services/sriPayload.ts`; implementar; verde.
- [ ] **Step 5:** Commit.

### Task B4: Aceptación confirmada y endurecimiento

**Files:** Modify `EXT/content.js:448-485, 884-1014, 1613, 1663-1674`, `EXT/overrides.js:40-44, 91-97`, `EXT/popup.js:551-565`, `EXT/parseoSri.js` (+ test en `__tests__/extension/parseoSri.test.ts`).

- [ ] **Step 1: Tests** — nueva `detectarAceptacion(htmlTexto: string): boolean` en `parseoSri.js`: true solo con el texto de confirmación del SRI (fixture tomado de la página real, guardado en `__tests__/extension/fixtures/aceptada.html`), false con la página recién cargada.
- [ ] **Step 2–4:** Avisar `aceptada` solo si `detectarAceptacion`; helper `esc()` y reemplazar todo `innerHTML` con datos leídos del SRI; quitar el auto-`confirm()` y el `new Function`; la clave SRI de la imprenta pasa a `chrome.storage.session` (se borra al cerrar Chrome) con aviso en el popup.
- [ ] **Step 5:** Commit.

### Task B5: Empaquetado y versión

**Files:** Create `scripts/empaquetar-extension.mjs`, Modify `package.json` (`"ext:zip"`), `EXT/manifest.json` (`version: "3.0.0"`), `components/layout/navModel.ts:111` (badge desde `manifest.json`), `pages/PanelInterno.tsx:76`.

- [ ] **Step 1:** Verificación: `tar -tf public/extension-cordova.zip` (bsdtar de Windows lee zip) lista `manifest.json` en la raíz y ninguna ruta con `\`.
- [ ] **Step 2–4:** Script que zipea `EXT/` → `public/extension-cordova.zip`; badge lee la versión importando el manifest.
- [ ] **Step 5:** Commit.

---

## Fase C — Sitio público de primer nivel (skill `ui-ux-pro-max`)

### Task C1: Sistema de diseño y auditoría

**Files:** Create `docs/design/auditoria-publica-2026-11.md`.

- [ ] Correr `python -I ~/.claude/skills/ui-ux-pro-max/scripts/search.py "print shop SRI tax documents trust local business" --design-system -p "Imprenta Cordova"` y `--domain ux` para landing/forms. Conservar la paleta Marino & Oro (decisión ya tomada, ver memoria `design-handoff-local`): del skill se toman reglas, no colores.
- [ ] Auditar `pages/VisualLanding.tsx`, `pages/SolicitarOnline.tsx`, `pages/Tracking.tsx`, `pages/Vitrina.tsx`, `components/PublicNavbar.tsx` contra el checklist (contraste 4.5:1, foco visible, objetivos ≥44 px, sin emoji como ícono, imágenes con `width/height` + `loading="lazy"` + WebP, CLS < 0.1). Salida: tabla hallazgo → archivo:línea → arreglo.
- [ ] Commit.

### Task C2: Correcciones de la auditoría

**Files:** los de C1 + `public/images/landing/*` (WebP).

- [ ] Aplicar cada hallazgo; ticker con íconos Lucide; `PublicNavbar` sin cortes de texto a 800 px; foco visible en todos los controles.
- [ ] Verificación: preview en 375 px y 1280 px, Lighthouse (Performance ≥ 90, Accessibility ≥ 95) en `vite preview`.
- [ ] Commit.

### Task C3: Contenido real del negocio

**Files:** `pages/VisualLanding.tsx` (`TICKER`, `FACTS`, dirección, footer), `components/SEO.tsx` (datos estructurados `LocalBusiness`).

- [ ] **Bloqueado por el dueño:** dirección correcta, cifras reales, 6–10 fotos de trabajos propios. Con eso: reemplazar y agregar JSON-LD `LocalBusiness` (nombre, dirección, teléfono `+593993083943`, horario Lun–Vie 8–18, Sáb 8–14).
- [ ] Commit.

---

## Fase D — Puesta en producción (pasos del dueño + corte)

### Task D1: Preparar producción (dueño)
- [ ] Correr `supabase/PRODUCCION_tablas_faltantes.sql` y `supabase/PRODUCCION_solicitudes_web.sql`.
- [ ] Render: `SESSION_SECRET` (≥ 32 bytes aleatorios), `ALLOWED_ORIGINS=https://www.imprentacordova.net,https://imprentacordova.net`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY`.
- [ ] **Antes de cargar `SESSION_SECRET`**, revisar la tabla `users` en Supabase: cada operador que hoy entra por nombre fijo (PEDRO, DANTE, ALEIDA, ROBERTO, DANIEL…) tiene que tener su fila con `estado='Activo'`, `rol` correcto y, si es Admin, `require_password=true` y `password` cargada. Si no, al activar el login del servidor queda afuera (el respaldo no se usa tras un 401).
- [ ] Cargar contraseña a cada Admin en `users` (Gestión de Usuarios).
- [ ] Verificar con GET: `curl -s https://cordova-sri-api.onrender.com/ping`.

### Task D2: Corte
- [ ] Push de Fase A con el OK del usuario → probar login real en `www.imprentacordova.net` con cada operador.
- [ ] Recién entonces `VITE_LOGIN_LEGACY=false` en Vercel y quitar `VITE_RENDER_API_KEY`; redeploy.
- [ ] Distribuir extensión v3 (Fases B) y desinstalar v2.4.2 en cada PC.
- [ ] Actualizar `memory/produccion-estado.md`.

## Fuera de este plan (siguiente)
- RLS real por usuario (requiere Supabase Auth o que todo el panel pase por el backend).
- Envío real de facturas al SRI (XML XAdES + SOAP).
- Avisos automáticos por WhatsApp (requiere WhatsApp Business API).
- Caja por fecha de pago (ledger por movimiento).
