# Plan maestro - App Merma de Botellas

## 1. Resumen ejecutivo

Se desarrollara una aplicacion web empresarial nueva e independiente para
registrar mermas de botellas. La primera version cubre solo botellas, pero la
arquitectura queda preparada para incorporar vino y tapas sin reescribir la
base.

La solucion usa Google Apps Script, HTML Service, JavaScript, CSS y Google
Sheets como almacenamiento inicial. El backend de Apps Script sera la fuente de
verdad: recalcula totales, valida reglas criticas, protege concurrencia con
`LockService` y registra auditoria.

## 2. Confirmacion de aislamiento

Este proyecto no modifica, conecta, reutiliza directamente ni depende del
sistema actual. El repositorio remoto estaba vacio al iniciar la planificacion,
por lo que se crea una base nueva.

## 3. Riesgos, vacios y correcciones

- Concurrencia en lista temporal: usar `LockService` en cada escritura y
  polling liviano para refrescar a todos los usuarios.
- Bloqueo de botella: persistir bloqueo en `CONFIGURACION` para impedir cambiar
  botella mientras hay merma activa.
- Doble envio: validar token/estado en backend y deshabilitar botones en
  frontend durante guardado.
- Apps Script no es base transaccional real: agrupar operaciones bajo lock,
  validar antes de escribir y dejar auditoria clara.
- Correos corporativos: `Session.getActiveUser().getEmail()` depende del modo
  de despliegue; por eso el despliegue debe quedar restringido al dominio.
- PDF: generar resumen imprimible sin tabla completa para evitar archivos muy
  pesados.

## 4. Arquitectura recomendada

- `Controller.gs`: endpoints publicos llamados por frontend.
- `Config.gs`: nombres de hojas, columnas, estados y valores base.
- `Setup.gs`: creacion de hojas, cabeceras y configuracion inicial.
- `DataAccess.gs`: lectura/escritura por cabeceras, sin posiciones fijas.
- `BusinessRules.gs`: validaciones y calculos.
- `CatalogService.gs`: administracion de botellas.
- `TempListService.gs`: lista temporal compartida y bloqueo.
- `RegistroService.gs`: registro, modificacion, eliminacion y restauracion.
- `ReportService.gs`: dashboard, reporte y datos de PDF.
- `Index.html`, `Styles.html`, `Client.html`: interfaz responsive.

## 5. Modelo de datos final

Hojas iniciales:

- `CONFIGURACION`: `CLAVE`, `VALOR`, `DESCRIPCION`, `FECHA_MODIFICACION`,
  `CORREO_MODIFICACION`.
- `CATALOGO_BOTELLAS`: `CODIGO_BOTELLA`, `DESCRIPCION_BOTELLA`, `ESTADO`,
  `FECHA_CREACION`, `CORREO_CREACION`, `FECHA_MODIFICACION`,
  `CORREO_MODIFICACION`.
- `REGISTROS_BOTELLAS`: `ID_REGISTRO`, `FECHA_HORA`, `CODIGO_BOTELLA`,
  `DESCRIPCION_BOTELLA`, `ZONA_1`, `ZONA_5`, `MERMA`, `PORCENTAJE_MERMA`,
  `ESTADO`, `CORREO_CREACION`, `FECHA_MODIFICACION`, `CORREO_MODIFICACION`,
  `MOTIVO_MODIFICACION`, `FECHA_ELIMINACION`, `CORREO_ELIMINACION`,
  `MOTIVO_ELIMINACION`, `FECHA_RESTAURACION`, `CORREO_RESTAURACION`,
  `MOTIVO_RESTAURACION`.
- `DETALLE_PRODUCCION`: `ID_DETALLE`, `ID_REGISTRO`, `CODIGO_PRODUCCION`,
  `FORMATO`, `CANTIDAD_CAJAS`, `TOTAL_BOTELLAS`, `ESTADO`, `FECHA_CREACION`,
  `CORREO_CREACION`, `FECHA_MODIFICACION`, `CORREO_MODIFICACION`,
  `MOTIVO_MODIFICACION`, `FECHA_ELIMINACION`, `CORREO_ELIMINACION`,
  `MOTIVO_ELIMINACION`, `FECHA_RESTAURACION`, `CORREO_RESTAURACION`,
  `MOTIVO_RESTAURACION`.
- `LISTA_TEMPORAL`: `ID_TEMPORAL`, `CODIGO_BOTELLA`, `DESCRIPCION_BOTELLA`,
  `CODIGO_PRODUCCION`, `FORMATO`, `CANTIDAD_CAJAS`, `TOTAL_BOTELLAS`,
  `FECHA_CREACION`, `CORREO_CREACION`, `FECHA_MODIFICACION`,
  `CORREO_MODIFICACION`.
- `AUDITORIA`: `ID_AUDITORIA`, `FECHA_HORA`, `ACCION`, `ENTIDAD`,
  `ID_ENTIDAD`, `CORREO`, `MOTIVO`, `DETALLE`.

## 6. Reglas de negocio definitivas

- La aplicacion abre siempre en Registro.
- El codigo de botella debe existir y estar activo.
- Solo una botella puede estar en merma activa a la vez.
- El codigo de produccion es obligatorio y no puede repetirse en la lista
  temporal activa.
- `TOTAL_BOTELLAS = FORMATO * CANTIDAD_CAJAS`.
- `ZONA_5` es el total acumulado de lista temporal.
- `MERMA = ZONA_1 - ZONA_5`.
- `% MERMA = (ZONA_1 - ZONA_5) / ZONA_1 * 100`.
- No se permite guardar si `ZONA_5 > ZONA_1`.
- Se permite merma cero.
- Los numeros deben ser enteros mayores o iguales a cero.
- Modificar, eliminar o restaurar exige motivo.
- Eliminaciones son logicas; no se borran registros historicos.
- Dashboard y reportes excluyen registros eliminados.

## 7. Flujo de pantallas

- Registro: seleccion de botella, lista temporal, Zona 1, confirmacion final,
  guardar y cancelar.
- Dashboard: totales simples de hoy por defecto, con dia o rango.
- Reporte: filtros por dia/rango/codigo, tabla resumida y modal de eliminados.
- Catalogo: crear, editar, desactivar y reactivar botellas.
- Configuracion: formatos permitidos y parametros operativos.

## 8. Seguridad y acceso

La Web App debe desplegarse con acceso restringido al dominio corporativo. No se
implementan usuarios ni roles internos en v1. Cada accion relevante registra el
correo disponible desde la sesion Google.

## 9. Estrategia responsive y PDF

La interfaz usa layout fluido, tablas desplazables y controles grandes para
celular. El PDF se genera desde una vista imprimible del reporte, incluyendo
logo, empresa, periodo, totales y desglose por botella.

## 10. Fases

1. Auditoria y plan maestro.
2. Scaffold local Apps Script.
3. Configuracion base de Sheets.
4. Catalogo, formatos y configuracion.
5. Registro con lista temporal.
6. Guardado, cancelacion y bloqueo.
7. Dashboard y reporte.
8. Modificacion, eliminacion y restauracion.
9. PDF, responsive y pulido visual.
10. Pruebas funcionales, concurrencia y permisos.
11. Publicacion controlada.
12. Auditoria web-perf con URL desplegada.
