# App Merma de Botellas

Proyecto nuevo e independiente para registrar, consultar, modificar, eliminar,
restaurar y reportar merma de botellas con Google Apps Script, HTML Service y
Google Sheets.

## Estado

Scaffold inicial local. No esta conectado a ningun proyecto Apps Script ni a una
hoja real todavia.

## Estructura

- `src/`: codigo Apps Script y HTML Service.
- `docs/PLAN_MAESTRO.md`: auditoria, arquitectura y fases.
- `docs/PLAN_PRUEBAS.md`: escenarios funcionales y tecnicos.
- `docs/DESPLIEGUE_APPS_SCRIPT.md`: guia operativa para publicar.
- `appsscript.json`: manifiesto base de Apps Script.
- `.clasp.example.json`: plantilla para conectar un proyecto Apps Script nuevo.
- `.claspignore`: evita subir documentacion y scripts auxiliares a Apps Script.
- `tools/validate.js`: validacion local de sintaxis y estructura.

## Primer uso

1. Crear un Google Sheets nuevo para almacenamiento.
2. Crear un proyecto Apps Script nuevo vinculado o independiente.
3. Copiar `.clasp.example.json` a `.clasp.json` y completar `scriptId`.
4. Ejecutar `clasp push` cuando `clasp` este autenticado.
5. En Apps Script, configurar `SPREADSHEET_ID` en `src/Config.gs`.
6. Ejecutar `setupWorkbook()` una vez para crear cabeceras y configuracion base.
7. Desplegar como Web App restringida al dominio corporativo.

Ver detalle en `docs/DESPLIEGUE_APPS_SCRIPT.md`.

## Validacion local

```powershell
npm run validate
```

## Regla de aislamiento

Este repositorio no modifica, conecta ni depende del sistema actual. El sistema
existente solo puede usarse como referencia de negocio si se aprueba
explicitamente.
