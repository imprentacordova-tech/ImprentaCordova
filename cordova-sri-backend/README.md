# 🚀 Microservicio Backend Facturación Electrónica SRI — Imprenta Córdova

Este repositorio contiene el backend Node.js + Express optimizado para ser desplegado en **Render.com** en 1 clic.

## 📋 Requisitos
- Node.js >= 18
- Cuenta en Render.com (Plan gratuito)

## 📁 Archivos Incluidos
- `index.js` — Servidor Express con endpoints `/ping`, `/api/v1/facturas/emitir` y `/api/v1/facturas/:clave/estado`
- `package.json` — Dependencias (`express`, `cors`, `node-forge`, `fast-xml-parser`, `axios`)
- `render.yaml` — Blueprint para despliegue automático en Render

## 🛠️ Instrucciones para publicar en Render.com

### 1. Inicializar Repositorio Git y Subir a GitHub
Ejecuta los siguientes comandos dentro de esta carpeta (`cordova-sri-backend`):

```bash
git init
git add .
git commit -m "feat: inicializar microservicio SRI para Render.com"
git branch -M main
git remote add origin https://github.com/imprentacordova-tech/cordova-sri-backend.git
git push -u origin main
```

*(Recuerda crear primero el repositorio `cordova-sri-backend` en tu cuenta de GitHub).*

### 2. Desplegar en Render.com
1. Ingresa a **[Render.com Dashboard](https://dashboard.render.com)**.
2. Haz clic en **New +** -> **Web Service**.
3. Selecciona **Build and deploy from a Git repository** y elige `cordova-sri-backend`.
4. Render leerá automáticamente la configuración de `render.yaml`:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Haz clic en **Create Web Service**.

### 3. Configurar la URL en el Frontend
Una vez desplegado, Render te dará una URL (ejemplo: `https://cordova-sri-backend.onrender.com`).

Añade esa URL en las variables de entorno de Vercel / `.env.local` de la App Principal:
```env
VITE_RENDER_SRI_API_URL=https://cordova-sri-backend.onrender.com
```
