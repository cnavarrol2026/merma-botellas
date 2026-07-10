# App Merma de Botellas

Proyecto nuevo e independiente para registrar, consultar, modificar, eliminar,
restaurar y reportar merma de botellas con Google Apps Script, HTML Service y
Google Sheets.

## Estado

Scaffold inicial local. La conexion real a Apps Script vive en `.clasp.json`,
archivo ignorado por Git para no publicar configuracion local.

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
5. Si el script esta vinculado a la hoja, dejar `SPREADSHEET_ID` vacio.
6. Ejecutar `runSetupWorkbook()` una vez para crear cabeceras y configuracion base.
7. Desplegar como Web App restringida al dominio corporativo.

Ver detalle en `docs/DESPLIEGUE_APPS_SCRIPT.md`.

## Validacion local

```powershell
npm run validate
```

La misma validacion se ejecuta en GitHub Actions para cada push a `main` y en
pull requests.

## Regla de aislamiento

Este repositorio no modifica, conecta ni depende del sistema actual. El sistema
existente solo puede usarse como referencia de negocio si se aprueba
explicitamente.
