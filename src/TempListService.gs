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
    throw new Error('No existe configuracion: ' + key);
  }
  updateRecordByRow_(SHEETS.CONFIGURACION.name, row._row, {
    VALOR: value,
    FECHA_MODIFICACION: now_(),
    CORREO_MODIFICACION: currentEmail_()
  });
}

function getTempState() {
  const items = readRows_(SHEETS.LISTA_TEMPORAL.name);
  const zona5 = items.reduce(function (sum, row) {
    return sum + Number(row.TOTAL_BOTELLAS || 0);
  }, 0);
  return {
    bloqueo: {
      codigo: getConfigValue_(APP_CONFIG.CONFIG_KEYS.BOTELLA_BLOQUEADA),
      descripcion: getConfigValue_(APP_CONFIG.CONFIG_KEYS.DESCRIPCION_BLOQUEADA),
      fecha: getConfigValue_(APP_CONFIG.CONFIG_KEYS.BLOQUEO_FECHA),
      correo: getConfigValue_(APP_CONFIG.CONFIG_KEYS.BLOQUEO_CORREO)
    },
    formatos: getFormatosPermitidos_(),
    zona5: zona5,
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
    })
  };
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
    const botella = findBotellaActiva_(payload.codigoBotella);
    const rows = readRows_(SHEETS.LISTA_TEMPORAL.name);
    const currentBottle = rows.length ? rows[0].CODIGO_BOTELLA : '';
    if (currentBottle && currentBottle !== botella.CODIGO_BOTELLA) {
      throw new Error('La lista temporal en curso pertenece a la botella ' + currentBottle + '. Guarda o cancela antes de usar otra botella.');
    }
    assertRequired_(payload.codigoProduccion, 'Codigo de produccion');
    const codigoProduccion = normalizeText_(payload.codigoProduccion);
    const duplicate = rows.some(function (row) {
      return row.CODIGO_PRODUCCION === codigoProduccion;
    });
    if (duplicate) {
      throw new Error('El codigo de produccion ya existe en la lista temporal.');
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
    assertRequired_(payload.codigoProduccion, 'Codigo de produccion');
    const id = normalizeText_(idTemporal);
    const codigoProduccion = normalizeText_(payload.codigoProduccion);
    const rows = readRows_(SHEETS.LISTA_TEMPORAL.name);
    const target = rows.find(function (row) { return row.ID_TEMPORAL === id; });
    if (!target) {
      throw new Error('No existe la linea temporal.');
    }
    const botella = findBotellaActiva_(payload.codigoBotella || target.CODIGO_BOTELLA);
    const duplicate = rows.some(function (row) {
      return row.ID_TEMPORAL !== id && row.CODIGO_PRODUCCION === codigoProduccion;
    });
    if (duplicate) {
      throw new Error('El codigo de produccion ya existe en la lista temporal.');
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

function deleteTempLine(idTemporal) {
  return withDocumentLock_(function () {
    const id = normalizeText_(idTemporal);
    const rows = readRows_(SHEETS.LISTA_TEMPORAL.name);
    const remaining = rows.filter(function (row) { return row.ID_TEMPORAL !== id; });
    if (remaining.length === rows.length) {
      throw new Error('No existe la linea temporal.');
    }
    clearDataRows_(SHEETS.LISTA_TEMPORAL.name);
    appendRecords_(SHEETS.LISTA_TEMPORAL.name, remaining);
    return getTempState();
  });
}

function clearTempList_(auditAction, motivo) {
  clearDataRows_(SHEETS.LISTA_TEMPORAL.name);
  setConfigValue_(APP_CONFIG.CONFIG_KEYS.BOTELLA_BLOQUEADA, '');
  setConfigValue_(APP_CONFIG.CONFIG_KEYS.DESCRIPCION_BLOQUEADA, '');
  setConfigValue_(APP_CONFIG.CONFIG_KEYS.BLOQUEO_FECHA, '');
  setConfigValue_(APP_CONFIG.CONFIG_KEYS.BLOQUEO_CORREO, '');
  addAudit_(auditAction || APP_CONFIG.ACCIONES.CANCELAR, 'LISTA_TEMPORAL', '', motivo || '', {});
}

function cancelTempList() {
  return withDocumentLock_(function () {
    clearTempList_(APP_CONFIG.ACCIONES.CANCELAR, 'Cancelacion de merma en curso');
    return getTempState();
  });
}
