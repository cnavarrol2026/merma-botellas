function saveRegistroFromTemp(payload) {
  return withDocumentLock_(function () {
    const temp = getTempState();
    if (!temp.items.length) {
      throw new Error('Agrega al menos una linea de produccion.');
    }
    const codigoBotella = temp.items[0].codigoBotella;
    const descripcionBotella = temp.items[0].descripcionBotella;
    const totals = calculateRegistroTotals_(payload.zona1, temp.zona5);
    const idRegistro = createId_('REG');
    const fecha = now_();
    const correo = currentEmail_();

    appendRecord_(SHEETS.REGISTROS_BOTELLAS.name, {
      ID_REGISTRO: idRegistro,
      FECHA_HORA: fecha,
      CODIGO_BOTELLA: codigoBotella,
      DESCRIPCION_BOTELLA: descripcionBotella,
      ZONA_1: totals.ZONA_1,
      ZONA_5: totals.ZONA_5,
      MERMA: totals.MERMA,
      PORCENTAJE_MERMA: totals.PORCENTAJE_MERMA,
      ESTADO: APP_CONFIG.ESTADOS.ACTIVO,
      CORREO_CREACION: correo,
      FECHA_MODIFICACION: '',
      CORREO_MODIFICACION: '',
      MOTIVO_MODIFICACION: '',
      FECHA_ELIMINACION: '',
      CORREO_ELIMINACION: '',
      MOTIVO_ELIMINACION: '',
      FECHA_RESTAURACION: '',
      CORREO_RESTAURACION: '',
      MOTIVO_RESTAURACION: ''
    });

    appendRecords_(SHEETS.DETALLE_PRODUCCION.name, temp.items.map(function (item) {
      return {
        ID_DETALLE: createId_('DET'),
        ID_REGISTRO: idRegistro,
        CODIGO_PRODUCCION: item.codigoProduccion,
        FORMATO: item.formato,
        CANTIDAD_CAJAS: item.cantidadCajas,
        TOTAL_BOTELLAS: item.totalBotellas,
        ESTADO: APP_CONFIG.ESTADOS.ACTIVO,
        FECHA_CREACION: fecha,
        CORREO_CREACION: correo,
        FECHA_MODIFICACION: '',
        CORREO_MODIFICACION: '',
        MOTIVO_MODIFICACION: '',
        FECHA_ELIMINACION: '',
        CORREO_ELIMINACION: '',
        MOTIVO_ELIMINACION: '',
        FECHA_RESTAURACION: '',
        CORREO_RESTAURACION: '',
        MOTIVO_RESTAURACION: ''
      };
    }));

    clearTempList_(APP_CONFIG.ACCIONES.CREAR, 'Registro guardado');
    addAudit_(APP_CONFIG.ACCIONES.CREAR, 'REGISTROS_BOTELLAS', idRegistro, '', totals);
    return getRegistroById(idRegistro);
  });
}

function getRegistroById(idRegistro) {
  const id = normalizeText_(idRegistro);
  const registro = readRows_(SHEETS.REGISTROS_BOTELLAS.name).find(function (row) {
    return row.ID_REGISTRO === id;
  });
  if (!registro) {
    throw new Error('No existe el registro: ' + id);
  }
  const detalles = readRows_(SHEETS.DETALLE_PRODUCCION.name).filter(function (row) {
    return row.ID_REGISTRO === id;
  });
  return { registro: registro, detalles: detalles };
}

function deleteRegistro(idRegistro, motivo) {
  return withDocumentLock_(function () {
    const cleanMotivo = assertMotivo_(motivo);
    const found = getRegistroById(idRegistro);
    const fecha = now_();
    const correo = currentEmail_();
    updateRecordByRow_(SHEETS.REGISTROS_BOTELLAS.name, found.registro._row, {
      ESTADO: APP_CONFIG.ESTADOS.ELIMINADO,
      FECHA_ELIMINACION: fecha,
      CORREO_ELIMINACION: correo,
      MOTIVO_ELIMINACION: cleanMotivo
    });
    found.detalles.forEach(function (detalle) {
      updateRecordByRow_(SHEETS.DETALLE_PRODUCCION.name, detalle._row, {
        ESTADO: APP_CONFIG.ESTADOS.ELIMINADO,
        FECHA_ELIMINACION: fecha,
        CORREO_ELIMINACION: correo,
        MOTIVO_ELIMINACION: cleanMotivo
      });
    });
    addAudit_(APP_CONFIG.ACCIONES.ELIMINAR, 'REGISTROS_BOTELLAS', idRegistro, cleanMotivo, {});
    return getRegistroById(idRegistro);
  });
}

function restoreRegistro(idRegistro, motivo) {
  return withDocumentLock_(function () {
    const cleanMotivo = assertMotivo_(motivo);
    const found = getRegistroById(idRegistro);
    const fecha = now_();
    const correo = currentEmail_();
    updateRecordByRow_(SHEETS.REGISTROS_BOTELLAS.name, found.registro._row, {
      ESTADO: APP_CONFIG.ESTADOS.ACTIVO,
      FECHA_RESTAURACION: fecha,
      CORREO_RESTAURACION: correo,
      MOTIVO_RESTAURACION: cleanMotivo
    });
    found.detalles.forEach(function (detalle) {
      updateRecordByRow_(SHEETS.DETALLE_PRODUCCION.name, detalle._row, {
        ESTADO: APP_CONFIG.ESTADOS.ACTIVO,
        FECHA_RESTAURACION: fecha,
        CORREO_RESTAURACION: correo,
        MOTIVO_RESTAURACION: cleanMotivo
      });
    });
    addAudit_(APP_CONFIG.ACCIONES.RESTAURAR, 'REGISTROS_BOTELLAS', idRegistro, cleanMotivo, {});
    return getRegistroById(idRegistro);
  });
}

function updateRegistro(payload) {
  return withDocumentLock_(function () {
    const cleanMotivo = assertMotivo_(payload.motivo);
    const found = getRegistroById(payload.idRegistro);
    const botella = findBotellaActiva_(payload.codigoBotella || found.registro.CODIGO_BOTELLA);
    const fecha = now_();
    const correo = currentEmail_();
    const submittedDetails = payload.detalles || [];
    if (!submittedDetails.length) {
      throw new Error('El registro debe mantener al menos una linea de detalle activa.');
    }

    const normalizedDetails = submittedDetails.map(function (item) {
      assertRequired_(item.codigoProduccion, 'Codigo de produccion');
      return {
        idDetalle: normalizeText_(item.idDetalle),
        codigoProduccion: normalizeText_(item.codigoProduccion),
        formato: assertFormatoPermitido_(item.formato),
        cantidadCajas: assertIntegerAtLeastZero_(item.cantidadCajas, 'Cantidad de cajas'),
        totalBotellas: calculateLineTotal_(item.formato, item.cantidadCajas)
      };
    });

    const codes = {};
    normalizedDetails.forEach(function (item) {
      if (codes[item.codigoProduccion]) {
        throw new Error('No se puede repetir codigo de produccion en el detalle.');
      }
      codes[item.codigoProduccion] = true;
    });

    const zona5 = normalizedDetails.reduce(function (sum, item) {
      return sum + item.totalBotellas;
    }, 0);
    const totals = calculateRegistroTotals_(payload.zona1, zona5);

    updateRecordByRow_(SHEETS.REGISTROS_BOTELLAS.name, found.registro._row, {
      CODIGO_BOTELLA: botella.CODIGO_BOTELLA,
      DESCRIPCION_BOTELLA: botella.DESCRIPCION_BOTELLA,
      ZONA_1: totals.ZONA_1,
      ZONA_5: totals.ZONA_5,
      MERMA: totals.MERMA,
      PORCENTAJE_MERMA: totals.PORCENTAJE_MERMA,
      FECHA_MODIFICACION: fecha,
      CORREO_MODIFICACION: correo,
      MOTIVO_MODIFICACION: cleanMotivo
    });

    const existingById = {};
    found.detalles.forEach(function (detalle) {
      existingById[detalle.ID_DETALLE] = detalle;
    });

    const activeIds = {};
    const newDetails = [];
    normalizedDetails.forEach(function (item) {
      if (item.idDetalle && existingById[item.idDetalle]) {
        activeIds[item.idDetalle] = true;
        updateRecordByRow_(SHEETS.DETALLE_PRODUCCION.name, existingById[item.idDetalle]._row, {
          CODIGO_PRODUCCION: item.codigoProduccion,
          FORMATO: item.formato,
          CANTIDAD_CAJAS: item.cantidadCajas,
          TOTAL_BOTELLAS: item.totalBotellas,
          ESTADO: APP_CONFIG.ESTADOS.ACTIVO,
          FECHA_MODIFICACION: fecha,
          CORREO_MODIFICACION: correo,
          MOTIVO_MODIFICACION: cleanMotivo
        });
      } else {
        newDetails.push({
          ID_DETALLE: createId_('DET'),
          ID_REGISTRO: found.registro.ID_REGISTRO,
          CODIGO_PRODUCCION: item.codigoProduccion,
          FORMATO: item.formato,
          CANTIDAD_CAJAS: item.cantidadCajas,
          TOTAL_BOTELLAS: item.totalBotellas,
          ESTADO: APP_CONFIG.ESTADOS.ACTIVO,
          FECHA_CREACION: fecha,
          CORREO_CREACION: correo,
          FECHA_MODIFICACION: '',
          CORREO_MODIFICACION: '',
          MOTIVO_MODIFICACION: '',
          FECHA_ELIMINACION: '',
          CORREO_ELIMINACION: '',
          MOTIVO_ELIMINACION: '',
          FECHA_RESTAURACION: '',
          CORREO_RESTAURACION: '',
          MOTIVO_RESTAURACION: ''
        });
      }
    });

    appendRecords_(SHEETS.DETALLE_PRODUCCION.name, newDetails);
    found.detalles.forEach(function (detalle) {
      if (!activeIds[detalle.ID_DETALLE] && detalle.ESTADO !== APP_CONFIG.ESTADOS.ELIMINADO) {
        updateRecordByRow_(SHEETS.DETALLE_PRODUCCION.name, detalle._row, {
          ESTADO: APP_CONFIG.ESTADOS.ELIMINADO,
          FECHA_ELIMINACION: fecha,
          CORREO_ELIMINACION: correo,
          MOTIVO_ELIMINACION: cleanMotivo
        });
      }
    });

    addAudit_(APP_CONFIG.ACCIONES.MODIFICAR, 'REGISTROS_BOTELLAS', found.registro.ID_REGISTRO, cleanMotivo, totals);
    return getRegistroById(found.registro.ID_REGISTRO);
  });
}
