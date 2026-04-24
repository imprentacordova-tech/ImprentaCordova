# 📘 MANUAL TÉCNICO COMPLETO — IMPRENTA CÓRDOVA
> **Última actualización:** 2026-04-24  
> **Autor:** Antigravity AI  
> **Versión:** 6.0 "Obsidian & Gold"

---

## 🎯 PROPÓSITO DEL SISTEMA

Sistema ERP administrativo completo para **Imprenta Córdova** (Pasaje, El Oro, Ecuador).  
Gestiona todo el ciclo de vida de una imprenta: desde la recepción de pedidos, diseño, producción, hasta la entrega y facturación.

**URL de Producción:** imprentacordova.net (Vercel)  
**URL de Desarrollo:** http://localhost:3000

---

## 🏗️ ARQUITECTURA GENERAL

```
FRONTEND (React + Vite)
  Estética: "Obsidian & Gold" (Dark)
  Estilización: TailwindCSS CDN
  Animaciones: Framer Motion

CONTEXTO GLOBAL (DataContext)
  Sincroniza: clientes, trabajos, productos, config desde Supabase a Estado React

BACKEND (Supabase)
  PostgreSQL: clientes, trabajos, productos, users, inventario, proveedores, app_config, financial_ledger, activity_log
  Auth: Tabla 'users' propia (no Supabase Auth)
```

---

## 📂 ESTRUCTURA DE ARCHIVOS

### Raíz
- App.tsx — Router principal (HashRouter), rutas públicas y protegidas
- index.tsx — Entry point, monta App
- index.html — HTML base, carga Tailwind CDN + html2pdf CDN + Google Fonts
- index.css — Estilos globales, clases .glass-card-luxury, .shadow-luxury, etc.
- types.ts — Interfaces TypeScript: Trabajo, Cliente, Producto, User, enums de estado
- constants.ts — Textos de UI reutilizables
- utils.ts — formatCurrency, formatDate, numeroALetras, generateWhatsAppLink
- vite.config.ts — Config de Vite
- .env.local — VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

### /contexts/
- DataContext.tsx — CORAZÓN DEL SISTEMA. Provider global que carga y sincroniza datos. Expone: clientes, trabajos, productos, config, loading, addCliente, addTrabajo, updateCliente, updateTrabajoStatus, registerRetiro, refreshData

### /services/
- supabase.ts — Cliente Supabase inicializado
- catalogData.ts — Catálogo maestro de 101 productos de imprenta
- activityLogService.ts — Registro de auditoría en Supabase
- financialLedgerService.ts — Libro diario financiero con hashes encadenados (ASYNC)
- geminiService.ts — Integración con Gemini AI

### /components/
- Icons.tsx — Todos los iconos SVG del sistema
- Layout.tsx — Layout admin con sidebar colapsable
- Navbar.tsx — Barra superior
- MobileFloatingNav.tsx — Nav flotante móvil
- ErrorBoundary.tsx — Captura errores de React
- SEO.tsx — Meta tags para SEO
- Hero.tsx, Services.tsx, Catalog.tsx, Contact.tsx, Footer.tsx — Landing pública
- AIHelper.tsx — Widget IA flotante

### /components/orders/
- ClientSelector.tsx — Step 1: Selector de cliente con búsqueda y modo express
- ServiceSelector.tsx — Step 2: Selector visual tipo McDonald's con categorías, imágenes, precios

### /pages/ — TODAS LAS PÁGINAS

#### Páginas Públicas (sin auth)
- VisualLanding.tsx (/) — Landing page premium
- Login.tsx (/login) — Login contra tabla users
- Tracking.tsx (/tracking) — Rastreo público de pedidos
- CalculadoraPrecios.tsx (/calculadora) — Calculadora interactiva

#### Páginas Protegidas (requieren auth)
- Dashboard.tsx (/dashboard) — KPIs, gráficos
- NuevoPedido.tsx (/nuevo) — Flujo multi-step 3 pasos
- KDS.tsx (/kds) — Tablero Kanban de producción
- Diseno.tsx (/diseno) — Cola de diseño
- Retiros.tsx (/retiros) — Vitrina de salidas
- Clientes.tsx (/clientes) — Directorio + IA marketing
- Trabajos.tsx (/trabajos) — Lista con filtros
- TrabajoDetalle.tsx (/trabajos/:trabajoId) — Detalle con timeline
- Productos.tsx (/productos) — CRUD catálogo
- Inventario.tsx (/inventario) — Almacén
- Proveedores.tsx (/proveedores) — Directorio proveedores
- Finanzas.tsx (/finanzas) — Dashboard financiero
- Cuentas.tsx (/cuentas) — Libro diario (Atelier Vault)
- GestionUsuarios.tsx (/usuarios) — Admin de usuarios
- RegistroActividad.tsx (/registro) — Log auditoría
- Configuracion.tsx (/configuracion) — Ajustes globales

#### Páginas de Impresión (sin layout)
- NotaDeVenta.tsx (/nota-de-venta/:trabajoId) — A5, nota de venta formal
- SolicitudImpresion.tsx (/solicitud-impresion/:trabajoId) — A4, solicitud SRI
- OrdenProduccion.tsx (/orden-produccion/:trabajoId) — A4, orden de taller
- ReciboAbono.tsx (/recibo-abono/:trabajoId) — 80mm ticket térmico / A6
- ReciboEpson.tsx (/recibo-epson/:trabajoId) — 140x216mm, recibo a color Epson

---

## 🔄 FLUJO "NUEVO PEDIDO" (NuevoPedido.tsx)

Step 1: IDENTIDAD DEL CLIENTE
- Buscar cliente existente por nombre/RUC
- Crear cliente express (solo nombre + teléfono)
- O continuar sin cliente (se pide nombre rápido en Step 3)

Step 2: ARQUITECTURA DEL SERVICIO
- Toggle "MODO SRI" (activa campos tributarios)
- Selector visual de productos (ServiceSelector.tsx)
  - Pestañas por categoría con emoji + conteo
  - Buscador en tiempo real
  - Grilla de cards con imágenes, precios, badge SRI
  - Opción de servicio personalizado
- Textarea "Memorándum del Proyecto" (opcional)
- Si SRI: Campos clave de acceso, actividad económica

Step 3: CALIBRACIÓN FINANCIERA
- Precio total (pre-llenado del producto)
- Cantidad / tiraje
- Abono (pago parcial o total)
- Si no hay cliente: campo "Nombre rápido"
- Botón "REGISTRAR Y GENERAR PDF"
  - Crea cliente express si no existe
  - Crea trabajo en Supabase via addTrabajo()
  - Navega al recibo correspondiente

---

## 🔗 MAPEO DB a UI (CRÍTICO)

La base de datos Supabase usa snake_case. La UI usa camelCase.
DataContext.tsx aplica mappers al cargar los datos.

### Tabla clientes
- created_at -> creadoEn

### Tabla trabajos
- cliente_id -> clienteId
- fecha_entrada -> fechaEntrada
- created_by -> creadoPor
- clave_acceso -> claveAcceso
- actividad_seleccionada -> actividadSeleccionada
- punto_emision -> puntoEmision

### Tabla productos
- es_sri -> esSRI
- imagen_url -> imagenUrl
- is_popular -> isPopular

### Tabla financial_ledger
- created_at -> timestamp
- type (income/expense) -> tipo (INGRESO/EGRESO)
- amount -> monto
- description -> detalle
- user_name -> usuario

---

## 🗄️ TABLAS SUPABASE

Principales:
- clientes (id, nombre, email, telefono, ruc, cedula, regimen, created_at)
- trabajos (id, orden SERIAL, cliente_id, titular, tipo, subtipo, cantidad, total, abono, saldo, estado, origen, created_by, fecha_entrada, clave_acceso, actividad_seleccionada, establecimiento, punto_emision, historial JSONB)
- productos (id, nombre, descripcion, precio, categoria, es_sri, imagen_url, specs, unit, is_popular)

Soporte:
- users (id, nombre, rol, password, activo, created_at)
- inventario (id, item, cantidad, unidad, costoUnitario, minimo, creado_en)
- proveedores (id, nombre, categoria, telefono, email, created_at)
- app_config (key, value) — Configuración global
- financial_ledger (id, type, amount, description, user_name, reference_id, hash, date, created_at)
- activity_log (id, user_id, user_role, action, details, module, created_at)

---

## 🎨 SISTEMA DE DISEÑO "OBSIDIAN & GOLD"

### Colores Clave
- brand-dark: #0c1324 — Fondo principal
- liquid-gold: #D4AF37 — Acentos, botones, badges
- brand-red: #E11D48 — SRI badges, alertas
- brand-blue: #0A1E40 — Headers documentos impresos

### Clases CSS
- .glass-card-luxury — Cards con glassmorphism oscuro
- .shadow-luxury — Sombra profunda
- .shadow-gold-glow — Resplandor dorado
- .text-gold-gradient — Texto degradado dorado
- .animate-fade-in — Entrada con fade
- .animate-slide-up — Entrada con slide

### Tipografías
- Sans: Manrope (cuerpo)
- Display: Epilogue (títulos)
- Editorial: Outfit (decorativo)

---

## 🧩 ESTADOS DE UN TRABAJO

Pendiente -> En Diseño -> En Proceso -> Vitrina -> Entregado

- Pendiente: Recién ingresado
- En Diseño: Diseñador trabajando
- En Proceso: En producción/impresión
- Vitrina: Terminado, esperando retiro del cliente
- Entregado: Cliente retiró y pagó

---

## 📄 DOCUMENTOS IMPRIMIBLES

- Recibo de Caja (Ticket): Al ingresar pedido — 80mm térmico
- Recibo Epson: Al ingresar pedido — Media carta 140x216mm a color
- Orden de Producción: Para el taller — A4
- Solicitud SRI: Para pedidos tributarios — A4
- Nota de Venta: Al entregar pedido — A5 (equivale a factura)

### Flujo de documentos
INGRESO: Se entrega Recibo (Ticket o Epson). Si SRI: Solicitud. Para producción: Orden de Taller.
RETIRO: Retiros -> "REGISTRAR Y GENERAR PDF" -> Nota de Venta.

---

## ⚡ VARIABLES DE ENTORNO (.env.local)

VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

---

## 🚀 COMANDOS

npm install — Instalar dependencias
npm run dev — Servidor de desarrollo (localhost:3000)
npm run build — Build de producción
npx vercel --prod — Deploy a Vercel

---

## 🐛 BUGS CONOCIDOS Y RESUELTOS

1. useState not defined en Clientes — Faltaba import React hooks -> Añadido import
2. Catálogo vacío en Step 2 — Productos DB usan es_sri pero UI lee esSRI -> Mapper en DataContext
3. addCliente no definido en NuevoPedido — No se destructuraba de useData() -> Añadido
4. Continuar deshabilitado Step 2 — canAdvance exigía detalle obligatorio -> Hecho opcional
5. data is not iterable en Cuentas — getFinancialLedger es async, se llamaba sin await -> Hecho async
7. table clientes not found — Tabla no existía -> Ejecutar migración SQL
8. Bloqueo en Misión Desplegada — Fallaban las tablas `activity_log` y `financial_ledger` al crear pedido -> Implementado patrón "fire-and-forget" con try/catch en NuevoPedido.tsx para evitar que servicios secundarios bloqueen la creación del trabajo.
9. Botones de Recibo en Step 4 — Faltaba opción de imprimir Recibo Epson al terminar el pedido -> Agregados botones "Recibo Térmico", "Recibo Epson" y "Nueva Orden" en la pantalla de éxito.

---

## 📋 CHECKLIST PARA FUTUROS CAMBIOS

- Siempre mapear snake_case a camelCase al agregar nuevas tablas/campos
- Verificar imports de React hooks en cada página (useState, useEffect, useMemo)
- Funciones async de Supabase deben usarse con await, nunca sincrónas
- Nuevas rutas deben agregarse en App.tsx (import + Route)
- Nuevos iconos deben exportarse desde components/Icons.tsx
- html2pdf se carga via CDN en index.html línea 63 — NO es npm package
- Tailwind se carga via CDN en index.html línea 19 — configurado inline

---

## 🗺️ ROADMAP PENDIENTE

1. Auto-descarga de PDF al registrar pedido
2. Notificaciones push al cambiar estado
3. Gráficos financieros de tendencia mensual
4. Integración con SRI real
5. Sistema de abonos parciales múltiples
6. Progressive Web App (PWA)
7. Reportes automáticos por email

---

NOTA PARA FUTURAS IAs: Este manual es la fuente de verdad del proyecto.
Si algo no está claro, revisar DataContext.tsx (el corazón) y types.ts (los contratos).
Antes de editar, siempre verificar los mappers snake_case a camelCase.
