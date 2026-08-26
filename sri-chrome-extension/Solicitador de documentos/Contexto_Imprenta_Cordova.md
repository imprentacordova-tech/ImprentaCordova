# Contexto del Proyecto: Imprenta Cordova

Este documento almacena información clave sobre la empresa y los objetivos del sistema de automatización para futuras referencias.

## Información General
- **Nombre de la Imprenta:** Imprenta Cordova
- **RUC/Identificador (Referencia):** 0702065319001 (Código de Autorización: 8634)
- **Representante / Razón Social:** CORDOVA RODRIGUEZ PEDRO MANUEL

## Objetivos del Proyecto (Portal SRI)

El sistema de automatización interactúa con el portal del SRI y tiene **dos propósitos principales**:

### 1. Petición de Documentos (Solicitador)
- Automatizar el flujo en el portal del SRI cuando un contribuyente necesita solicitar la impresión de documentos tributarios (ej. Notas de Venta).
- Alertar si se detecta que el usuario no es "CORDOVA RODRIGUEZ PEDRO MANUEL" para sugerir hacer la solicitud rápidamente.
- Definir las cantidades, confirmar la validez (alertando si la caducidad es menor a 3 meses) y direccionar la solicitud específicamente a la **Imprenta Cordova** mediante su código de autorización (8634).

### 2. Aceptación de Solicitudes (Receptor / Proyecto en proceso)
- Cuando el portal detecta el RUC de la imprenta (0702065319001), no se debe activar el flujo de "petición".
- **Objetivo principal:** Llevar al usuario (Imprenta Cordova) rápidamente a la bandeja de "solicitudes enviadas por los contribuyentes" (solicitudes recibidas).
- **Meta:** Hacer fluido el proceso de aceptación hasta llegar al archivo **PDF** final que contiene toda la información necesaria para imprimir el talonario.

## Notas Adicionales
- Precios de referencia para Notificaciones/Alertas: 
  - 1 Block (100 hojas): $13.00
  - 1 Block (50 hojas): $10.00
  - 2 Blocks (200 hojas): $20.00
