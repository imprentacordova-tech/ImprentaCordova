
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import { DataProvider } from './contexts/DataContext';

console.log("🚀 Iniciando Sistema Atelier - Imprenta Córdova...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ FATAL: No se encontró el elemento #root");
  throw new Error("No se pudo encontrar el elemento raíz para montar la aplicación.");
}

const root = createRoot(rootElement);

// Limpiar cargador de emergencia si existe
const emergencyLoader = document.getElementById('emergency-loader');
if (emergencyLoader) {
    console.log("✨ Removiendo cargador de emergencia...");
}

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <DataProvider>
          <App />
        </DataProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);

console.log("✅ Aplicación montada con éxito.");
