# Plan de pruebas

## Registro

- Guardar con Zona 1 mayor que Zona 5.
- Guardar con Zona 1 igual a Zona 5.
- Bloquear guardado con Zona 5 mayor que Zona 1.
- Impedir codigo de produccion duplicado.
- Cancelar merma y confirmar limpieza total.
- Simular doble clic en guardar.

## Concurrencia

- Abrir dos sesiones corporativas.
- Agregar una linea desde una sesion y verificar refresco en la otra.
- Editar/eliminar lineas simultaneas y verificar que no haya duplicados ni
  totales corruptos.

## Catalogo

- Crear botella activa.
- Editar descripcion.
- Desactivar y verificar que no aparezca en Registro.
- Reactivar y verificar disponibilidad.

## Reporte y dashboard

- Filtrar por hoy.
- Filtrar por rango.
- Filtrar por codigo de botella.
- Verificar exclusion de registros eliminados.
- Restaurar eliminado y verificar retorno a totales.

## Seguridad

- Confirmar despliegue restringido al dominio.
- Confirmar correo registrado en creacion, modificacion, eliminacion y
  restauracion.

## Performance posterior

Cuando exista URL desplegada:

- Medir FCP, LCP, TBT, CLS y Speed Index.
- Revisar solicitudes de red y recursos bloqueantes.
- Revisar snapshot de accesibilidad.
