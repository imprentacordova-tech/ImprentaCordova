# 📘 GUÍA OPERATIVA - ImprentaCordova.net

Este documento contiene las reglas de oro y la configuración crítica para que cualquier agente de IA o desarrollador mantenga la continuidad del proyecto.

---

## 🚀 Infraestructura
- **Repositorio Oficial (GitHub)**: `https://github.com/imprentacordova-tech/ImprentaCordova`
- **Despliegue (Vercel)**: `https://vercel.com/imprenta-cordovas-projects/imprentacordova`
- **Flujo de Trabajo**: Cualquier `push` a la rama `main` dispara un despliegue automático en Vercel.

## 🛠️ Reglas de Desarrollo
1. **Sincronización**: Antes de empezar cualquier tarea, asegúrate de estar en `main` y con los últimos cambios (`git pull origin main`).
2. **Archivos Prohibidos**: No subir archivos `.rar`, `.env.local` o carpetas de compilación (`dist`, `node_modules`). El `.gitignore` ya está configurado para esto.
3. **Tecnologías Core**: 
    - React 18.3.1 (Vite)
    - Tailwind CSS para el diseño.
    - Lucide-React para iconografía premium.
    - Recharts para analítica y dashboards.

## 🔐 Autenticación y GIT
- Para realizar `push`, se debe configurar el repositorio con un Personal Access Token (PAT).
- Si experimentas problemas de "unrelated histories" o conflictos masivos al intentar sincronizar, usa la técnica de `git reset --soft origin/main` para alinear el historial sin perder cambios locales.

## 📍 Estado Actual
- El sistema cuenta con módulos de: **Dashboard, Clientes, Inventario, Pedidos, Finanzas, KDS y Tracking.**
- Se está priorizando la modernización estética y la automatización de procesos internos.

---
*Nota para el Agente: Esta guía debe actualizarse si cambian las rutas de infraestructura o las reglas críticas de negocio.*
