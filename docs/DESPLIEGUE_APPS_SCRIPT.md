# Despliegue Apps Script paso a paso

## 1. Crear recursos nuevos

1. Crear un Google Sheets nuevo para esta app.
2. Copiar el ID de la hoja desde la URL.
3. Crear un proyecto Apps Script nuevo.
4. Copiar el `scriptId` del proyecto Apps Script.

## 2. Configurar el proyecto local

1. Copiar `.clasp.example.json` a `.clasp.json`.
2. Reemplazar `REEMPLAZAR_CON_SCRIPT_ID_NUEVO` por el `scriptId`.
3. Si el Apps Script esta vinculado al Google Sheets creado con `clasp create
   --type sheets`, dejar `SPREADSHEET_ID` vacio. Si se usa un proyecto
   independiente, completar `SPREADSHEET_ID` con el ID de la hoja.

## 3. Subir con clasp

Antes de subir, validar:

```powershell
npm run validate
```

```powershell
clasp push
```

Si PowerShell bloquea shims, usar:

```powershell
clasp.cmd push
```

## 4. Preparar hojas

1. Abrir Apps Script.
2. Ejecutar `runSetupWorkbook()`.
3. Aceptar permisos.
4. Confirmar que se crearon estas hojas:
   `CONFIGURACION`, `CATALOGO_BOTELLAS`, `REGISTROS_BOTELLAS`,
   `DETALLE_PRODUCCION`, `LISTA_TEMPORAL`, `AUDITORIA`.

## 5. Publicar Web App

1. Ir a Implementar > Nueva implementacion.
2. Tipo: Aplicacion web.
3. Ejecutar como: usuario que implementa.
4. Acceso: usuarios del dominio corporativo.
5. Copiar URL de despliegue.

## 6. Smoke test inicial

1. Abrir la Web App.
2. Ir a Configuracion y verificar hojas base.
3. Crear una botella en Catalogo.
4. Volver a Registro.
5. Bloquear botella.
6. Agregar una linea temporal.
7. Guardar con Zona 1 mayor o igual que Zona 5.
8. Confirmar que Dashboard y Reporte muestran el registro.
9. Abrir el registro desde Reporte.
10. Modificar con motivo.
11. Eliminar con motivo.
12. Restaurar desde Ver eliminados.
