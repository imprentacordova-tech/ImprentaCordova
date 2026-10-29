# Imprenta Córdova — Sistema de Gestión Gráfica

Ecosistema digital de **Imprenta Córdova** (Pasaje, El Oro, Ecuador): presencia web, ERP interno, pedidos de comprobantes autorizados por el SRI, producción, despacho, finanzas y automatización del portal del SRI mediante una extensión de Chrome.

> **Dos familias de trabajo:** los **Comprobantes Autorizados SRI** (Factura, Nota de Venta RIMPE, Liquidación, Guía…) requieren trámite ante el SRI y emiten una *Solicitud de Autorización de Impresión* (sin IVA). Los **Trabajos Comerciales** (tarjetas, volantes, bingo, rifas, empastados, sellos…) no requieren trámite y emiten *Recibo de Taller* (+15% IVA). El flujo de Nueva Orden distingue ambas desde el paso 1.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite 5 |
| Estilos | TailwindCSS + tema "Marino & Oro" (`components/panelTheme.ts`) |
| Animación | framer-motion |
| Base de datos | Supabase (PostgreSQL + Storage + Realtime) |
| Backend | Express en Render (`cordova-sri-backend/`) — facturación SRI, correo, IA |
| Correo | Resend (solo desde el backend) |
| IA | Google Gemini (solo desde el backend) |
| PWA | vite-plugin-pwa |
| Hosting | Vercel (auto-deploy desde `main`) |
| Extensión | Chrome MV3 (`sri-chrome-extension/`) |

---

## Requisitos

- **Node.js ≥ 18**
- npm (incluido con Node)

---

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
#    Copiá .env.example a .env.local y completá los valores.
#    (En Vercel se cargan en Project Settings → Environment Variables.)

# 3. Arrancar en desarrollo
npm run dev
```

### Variables de entorno (frontend)

| Variable | Para qué |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |
| `VITE_RENDER_SRI_API_URL` | URL del backend SRI (Render) |
| `VITE_RENDER_API_KEY` | Clave anti-abuso **pública**; debe coincidir con `API_KEY` del backend |
| `SRI_AMBIENTE` | `1` = pruebas, `2` = producción |

> ⚠️ **Nunca** pongas `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` ni `GEMINI_API_KEY` con prefijo `VITE_`: todo lo que empieza con `VITE_` se incrusta en el bundle público. Esas claves viven **solo** en Render.

### Variables del backend (Render)

`API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GEMINI_API_KEY` (y opcional `RESEND_FROM`).

---

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción — **debe salir con código 0** |
| `npm run preview` | Previsualizar el build local |
| `npm test` | Tests unitarios (vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Cobertura de tests |

Además, el chequeo de tipos no corre dentro del build:

```bash
npx tsc --noEmit
```

---

## Estructura

```
├── App.tsx                  # Rutas (HashRouter)
├── index.html               # SEO, OG, fuentes, loader de emergencia
├── index.tsx                # Punto de entrada
├── types.ts                 # Modelo de datos (Trabajo, Cliente, Producto…)
├── pages/                   # 30 páginas (Dashboard, NuevoPedido, Retiros, documentos…)
├── components/
│   ├── Layout.tsx           # Sidebar + navegación
│   ├── orders/              # Flujo de Nueva Orden (OrderDetails, OrderSummary, drawers…)
│   ├── ProductVisual.tsx    # Ilustración vectorial dinámica de productos
│   ├── print/               # Calibración de registro
│   └── ui/                  # Button, Input, Modal, Badge, Card
├── contexts/                # Auth, Data, Clientes, Productos, Trabajos, Inventario, Config
├── services/                # Supabase, precios, impresión, SRI, correo, IA, auditoría…
├── hooks/                   # Atajos de teclado, useOrder
├── __tests__/               # Tests (171)
├── supabase/                # SCHEMA_COMPLETO.sql + migraciones
├── cordova-sri-backend/     # Microservicio Express (Render)
├── sri-chrome-extension/    # Extensión Chrome MV3
└── public/                  # LOGO, extensión empaquetada, imágenes
```

---

## Backend (`cordova-sri-backend/`)

Microservicio Express que centraliza lo privilegiado: firma electrónica / conexión SRI, escrituras con `service_role`, envío de correo (Resend) y llamadas a IA (Gemini). El navegador **nunca** ve esas claves.

- Desplegado en Render: `https://cordova-sri-api.onrender.com`
- Guía paso a paso: [`cordova-sri-backend/README.md`](cordova-sri-backend/README.md)

---

## Extensión de Chrome (`sri-chrome-extension/`)

Automatiza la solicitud de preimpresos en el portal del SRI y registra la orden de vuelta en el sistema (vía backend).

1. Inyecta una barra de auto-login (Cliente manual o Imprenta).
2. Muestra un HUD con el avance de los 5 pasos.
3. En auto-piloto recorre el flujo de preimpresos y selecciona "Imprenta Córdova (8634)".
4. Al finalizar abre un cajón para registrar la orden, sincronizarla y emitir/ imprimir/ WhatsApp.

Se distribuye empaquetada (`public/extension-cordova.zip`), por eso **todo su código es público** y no contiene secretos.

---

## Despliegue

| Servicio | Plataforma | Notas |
|---|---|---|
| Frontend | **Vercel** | Deploy automático al hacer push a `main` |
| Backend | **Render** | Servicio gratuito (duerme sin tráfico: primer request lento) |
| Base de datos | **Supabase** | Correr `supabase/SCHEMA_COMPLETO.sql` y crear el bucket `trabajos` |
| DNS/CDN | **Cloudflare** (opcional, gratis) | Ver `GUIA_DESPLIEGUE_Y_OPERACION.md` PASO 8 |

Guía completa: [`GUIA_DESPLIEGUE_Y_OPERACION.md`](GUIA_DESPLIEGUE_Y_OPERACION.md)

---

## Documentación

| Documento | Contenido |
|---|---|
| [`design_manifest.md`](design_manifest.md) | Sistema de diseño "Marino & Oro" (reglas de UI) |
| [`GUIA_DESPLIEGUE_Y_OPERACION.md`](GUIA_DESPLIEGUE_Y_OPERACION.md) | Supabase, Vercel, Render, Cloudflare |
| [`GUIA_OPERATIVA.md`](GUIA_OPERATIVA.md) | Operación diaria |
| [`MANUAL_TECNICO.md`](MANUAL_TECNICO.md) | Manual técnico |
| [`INFORME_GENERAL_MEJORAS.md`](INFORME_GENERAL_MEJORAS.md) | Informe de mejoras y plan de acción |
| [`owner_guidelines.md`](owner_guidelines.md) | Visión del dueño (Pedro Córdova) |

---

## Verificación rápida

```bash
npm run build      # EXIT 0
npx tsc --noEmit   # 0 errores
npm test           # 171/171
```

---

*Imprenta Córdova © 2026 · Santiago Córdova*
