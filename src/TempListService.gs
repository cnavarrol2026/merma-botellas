function getConfigValue_(key) {
  const row = readRows_(SHEETS.CONFIGURACION.name).find(function (item) {
    return item.CLAVE === key;
  });
  return row ? row.VALOR : '';
}

function setConfigValue_(key, value) {
  const row = readRows_(SHEETS.CONFIGURACION.name).find(function (item) {
    return item.CLAVE === key;
  });
  if (!row) {
    throw new Error('No existe configuración: ' + key);
  }
  updateRecordByRow_(SHEETS.CONFIGURACION.name, row._row, {
    VALOR: value,
    FECHA_MODIFICACION: now_(),
    CORREO_MODIFICACION: currentEmail_()
  });
}

function getConfigValueFromRows_(rows, key) {
  const row = rows.find(function (item) {
    return item.CLAVE === key;
  });
  return row ? row.VALOR : '';
}

function getTempState() {
  ensureSheet_(SHEETS.LISTA_TEMPORAL_QUIEBRES);
  const items = readRows_(SHEETS.LISTA_TEMPORAL.name);
  const quiebres = readRows_(SHEETS.LISTA_TEMPORAL_QUIEBRES.name);
  const configRows = readRows_(SHEETS.CONFIGURACION.name);
  const zona5 = items.reduce(function (sum, row) {
    return sum + Number(row.TOTAL_BOTELLAS || 0);
  }, 0);
  const totalQuebradas = quiebres.reduce(function (sum, row) {
    return sum + Number(row.CANTIDAD_BOTELLAS || 0);
  }, 0);
  return {
    bloqueo: {
      codigo: getConfigValueFromRows_(configRows, APP_CONFIG.CONFIG_KEYS.BOTELLA_BLOQUEADA),
      descripcion: getConfigValueFromRows_(configRows, APP_CONFIG.CONFIG_KEYS.DESCRIPCION_BLOQUEADA),
      fecha: getConfigValueFromRows_(configRows, APP_CONFIG.CONFIG_KEYS.BLOQUEO_FECHA),
      correo: getConfigValueFromRows_(configRows, APP_CONFIG.CONFIG_KEYS.BLOQUEO_CORREO)
    },
    formatos: getFormatosPermitidos_(configRows),
    zona5: zona5,
    totalQuebradas: totalQuebradas,
    items: items.map(function (row) {
      return {
        id: row.ID_TEMPORAL,
        codigoBotella: row.CODIGO_BOTELLA,
        descripcionBotella: row.DESCRIPCION_BOTELLA,
        codigoProduccion: row.CODIGO_PRODUCCION,
        formato: Number(row.FORMATO),
        cantidadCajas: Number(row.CANTIDAD_CAJAS),
        totalBotellas: Number(row.TOTAL_BOTELLAS)
      };
    }),
    quiebres: quiebres.map(function (row) {
      return {
        id: row.ID_QUIEBRE_TEMPORAL,
        codigoBotella: row.CODIGO_BOTELLA,
        descripcionBotella: row.DESCRIPCION_BOTELLA,
        cantidadBotellas: Number(row.CANTIDAD_BOTELLAS)
      };
    })
  };
}

function getCurrentTempBottle_(lineRows, breakRows) {
  const rows = (lineRows || []).concat(breakRows || []);
  return rows.length ? rows[0].CODIGO_BOTELLA : '';
}

function startTempBottle(codigoBotella) {
  return withDocumentLock_(function () {
    const botella = findBotellaActiva_(codigoBotella);
    const current = getConfigValue_(APP_CONFIG.CONFIG_KEYS.BOTELLA_BLOQUEADA);
    if (current && current !== botella.CODIGO_BOTELLA) {
      throw new Error('Ya existe una merma activa para la botella ' + current + '.');
    }
    setConfigValue_(APP_CONFIG.CONFIG_KEYS.BOTELLA_BLOQUEADA, botella.CODIGO_BOTELLA);
    setConfigValue_(APP_CONFIG.CONFIG_KEYS.DESCRIPCION_BLOQUEADA, botella.DESCRIPCION_BOTELLA);
    setConfigValue_(APP_CONFIG.CONFIG_KEYS.BLOQUEO_FECHA, now_());
    setConfigValue_(APP_CONFIG.CONFIG_KEYS.BLOQUEO_CORREO, currentEmail_());
    return getTempState();
  });
}

function addTempLine(payload) {
  return withDocumentLock_(function () {
    ensureSheet_(SHEETS.LISTA_TEMPORAL_QUIEBRES);
    const botella = findBotellaActiva_(payload.codigoBotella);
    const rows = readRows_(SHEETS.LISTA_TEMPORAL.name);
    const breakRows = readRows_(SHEETS.LISTA_TEMPORAL_QUIEBRES.name);
    const currentBottle = getCurrentTempBottle_(rows, breakRows);
    if (currentBottle && currentBottle !== botella.CODIGO_BOTELLA) {
      throw new Error('La lista temporal en curso pertenece a la botella ' + currentBottle + '. Guarda o cancela antes de usar otra botella.');
    }
    assertRequired_(payload.codigoProduccion, 'Código de producción');
    const codigoProduccion = normalizeText_(payload.codigoProduccion);
    const duplicate = rows.some(function (row) {
      return row.CODIGO_PRODUCCION === codigoProduccion;
    });
    if (duplicate) {
      throw new Error('El código de producción ya existe en la lista temporal.');
    }
    const total = calculateLineTotal_(payload.formato, payload.cantidadCajas);
    appendRecord_(SHEETS.LISTA_TEMPORAL.name, {
      ID_TEMPORAL: createId_('TMP'),
      CODIGO_BOTELLA: botella.CODIGO_BOTELLA,
      DESCRIPCION_BOTELLA: botella.DESCRIPCION_BOTELLA,
      CODIGO_PRODUCCION: codigoProduccion,
      FORMATO: Number(payload.formato),
      CANTIDAD_CAJAS: Number(payload.cantidadCajas),
      TOTAL_BOTELLAS: total,
      FECHA_CREACION: now_(),
      CORREO_CREACION: currentEmail_(),
      FECHA_MODIFICACION: '',
      CORREO_MODIFICACION: ''
    });
    return getTempState();
  });
}

function updateTempLine(idTemporal, payload) {
  return withDocumentLock_(function () {
    ensureSheet_(SHEETS.LISTA_TEMPORAL_QUIEBRES);
    assertRequired_(payload.codigoProduccion, 'Código de producción');
    const id = normalizeText_(idTemporal);
    const codigoProduccion = normalizeText_(payload.codigoProduccion);
    const rows = readRows_(SHEETS.LISTA_TEMPORAL.name);
    const target = rows.find(function (row) { return row.ID_TEMPORAL === id; });
    if (!target) {
      throw new Error('No existe la línea temporal.');
    }
    const botella = findBotellaActiva_(payload.codigoBotella || target.CODIGO_BOTELLA);
    const duplicate = rows.some(function (row) {
      return row.ID_TEMPORAL !== id && row.CODIGO_PRODUCCION === codigoProduccion;
    });
    if (duplicate) {
      throw new Error('El código de producción ya existe en la lista temporal.');
    }
    const fecha = now_();
    const correo = currentEmail_();
    rows.forEach(function (row) {
      updateRecordByRow_(SHEETS.LISTA_TEMPORAL.name, row._row, {
        CODIGO_BOTELLA: botella.CODIGO_BOTELLA,
        DESCRIPCION_BOTELLA: botella.DESCRIPCION_BOTELLA,
        FECHA_MODIFICACION: fecha,
        CORREO_MODIFICACION: correo
      });
    });
    readRows_(SHEETS.LISTA_TEMPORAL_QUIEBRES.name).forEach(function (row) {
      updateRecordByRow_(SHEETS.LISTA_TEMPORAL_QUIEBRES.name, row._row, {
        CODIGO_BOTELLA: botella.CODIGO_BOTELLA,
        DESCRIPCION_BOTELLA: botella.DESCRIPCION_BOTELLA
      });
    });
    updateRecordByRow_(SHEETS.LISTA_TEMPORAL.name, target._row, {
      CODIGO_BOTELLA: botella.CODIGO_BOTELLA,
      DESCRIPCION_BOTELLA: botella.DESCRIPCION_BOTELLA,
      CODIGO_PRODUCCION: codigoProduccion,
      FORMATO: Number(payload.formato),
      CANTIDAD_CAJAS: Number(payload.cantidadCajas),
      TOTAL_BOTELLAS: calculateLineTotal_(payload.formato, payload.cantidadCajas),
      FECHA_MODIFICACION: fecha,
      CORREO_MODIFICACION: correo
    });
    return getTempState();
  });
}

function addTempBreak(payload) {
  return withDocumentLock_(function () {
    ensureSheet_(SHEETS.LISTA_TEMPORAL_QUIEBRES);
    const botella = findBotellaActiva_(payload.codigoBotella);
    const rows = readRows_(SHEETS.LISTA_TEMPORAL.name);
    const breakRows = readRows_(SHEETS.LISTA_TEMPORAL_QUIEBRES.name);
    const currentBottle = getCurrentTempBottle_(rows, breakRows);
    if (currentBottle && currentBottle !== botella.CODIGO_BOTELLA) {
      throw new Error('La lista temporal en curso pertenece a la botella ' + currentBottle + '. Guarda o cancela antes de usar otra botella.');
    }
    const cantidad = assertIntegerAtLeastZero_(payload.cantidadBotellas, 'Botellas quebradas');
    if (cantidad <= 0) {
      throw new Error('Botellas quebradas debe ser mayor que cero.');
    }
    appendRecord_(SHEETS.LISTA_TEMPORAL_QUIEBRES.name, {
      ID_QUIEBRE_TEMPORAL: createId_('QBT'),
      CODIGO_BOTELLA: botella.CODIGO_BOTELLA,
      DESCRIPCION_BOTELLA: botella.DESCRIPCION_BOTELLA,
      CANTIDAD_BOTELLAS: cantidad,
      FECHA_CREACION: now_(),
      CORREO_CREACION: currentEmail_()
    });
    return getTempState();
  });
}

function deleteTempBreak(idQuiebreTemporal) {
  return withDocumentLock_(function () {
    ensureSheet_(SHEETS.LISTA_TEMPORAL_QUIEBRES);
    const id = normalizeText_(idQuiebreTemporal);
    const rows = readRows_(SHEETS.LISTA_TEMPORAL_QUIEBRES.name);
    const remaining = rows.filter(function (row) { return row.ID_QUIEBRE_TEMPORAL !== id; });
    if (remaining.length === rows.length) {
      throw new Error('No existe el quiebre temporal.');
    }
    clearDataRows_(SHEETS.LISTA_TEMPORAL_QUIEBRES.name);
    appendRecords_(SHEETS.LISTA_TEMPORAL_QUIEBRES.name, remaining);
    return getTempState();
  });
}

function deleteTempLine(idTemporal) {
  return withDocumentLock_(function () {
    ensureSheet_(SHEETS.LISTA_TEMPORAL_QUIEBRES);
    const id = normalizeText_(idTemporal);
    const rows = readRows_(SHEETS.LISTA_TEMPORAL.name);
    const remaining = rows.filter(function (row) { return row.ID_TEMPORAL !== id; });
    if (remaining.length === rows.length) {
      throw new Error('No existe la línea temporal.');
    }
    clearDataRows_(SHEETS.LISTA_TEMPORAL.name);
    appendRecords_(SHEETS.LISTA_TEMPORAL.name, remaining);
    return getTempState();
  });
}

function clearTempList_(auditAction, motivo) {
  clearDataRows_(SHEETS.LISTA_TEMPORAL.name);
  ensureSheet_(SHEETS.LISTA_TEMPORAL_QUIEBRES);
  clearDataRows_(SHEETS.LISTA_TEMPORAL_QUIEBRES.name);
  setConfigValue_(APP_CONFIG.CONFIG_KEYS.BOTELLA_BLOQUEADA, '');
  setConfigValue_(APP_CONFIG.CONFIG_KEYS.DESCRIPCION_BLOQUEADA, '');
  setConfigValue_(APP_CONFIG.CONFIG_KEYS.BLOQUEO_FECHA, '');
  setConfigValue_(APP_CONFIG.CONFIG_KEYS.BLOQUEO_CORREO, '');
  addAudit_(auditAction || APP_CONFIG.ACCIONES.CANCELAR, 'LISTA_TEMPORAL', '', motivo || '', {});
}

function cancelTempList() {
  return withDocumentLock_(function () {
    clearTempList_(APP_CONFIG.ACCIONES.CANCELAR, 'Cancelación de merma en curso');
    return getTempState();
  });
}
