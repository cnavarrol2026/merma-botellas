function listBotellas(includeInactive) {
  const rows = readRows_(SHEETS.CATALOGO_BOTELLAS.name);
  return rows
    .filter(function (row) {
      return includeInactive || row.ESTADO === APP_CONFIG.ESTADOS.ACTIVO;
    })
    .map(function (row) {
      return {
        codigo: row.CODIGO_BOTELLA,
        descripcion: row.DESCRIPCION_BOTELLA,
        estado: row.ESTADO
      };
    });
}

function findBotellaActiva_(codigo) {
  const cleanCodigo = normalizeText_(codigo);
  const row = readRows_(SHEETS.CATALOGO_BOTELLAS.name).find(function (item) {
    return item.CODIGO_BOTELLA === cleanCodigo && item.ESTADO === APP_CONFIG.ESTADOS.ACTIVO;
  });
  if (!row) {
    throw new Error('La botella no existe o esta inactiva: ' + cleanCodigo);
  }
  return row;
}

function saveBotella(payload) {
  return withDocumentLock_(function () {
    assertRequired_(payload.codigo, 'Codigo de botella');
    assertRequired_(payload.descripcion, 'Descripcion de botella');
    const codigo = normalizeText_(payload.codigo);
    const descripcion = normalizeText_(payload.descripcion);
    const rows = readRows_(SHEETS.CATALOGO_BOTELLAS.name);
    const existing = rows.find(function (row) { return row.CODIGO_BOTELLA === codigo; });

    if (existing) {
      updateRecordByRow_(SHEETS.CATALOGO_BOTELLAS.name, existing._row, {
        DESCRIPCION_BOTELLA: descripcion,
        ESTADO: payload.estado || existing.ESTADO || APP_CONFIG.ESTADOS.ACTIVO,
        FECHA_MODIFICACION: now_(),
        CORREO_MODIFICACION: currentEmail_()
      });
      addAudit_(APP_CONFIG.ACCIONES.MODIFICAR, 'CATALOGO_BOTELLAS', codigo, '', payload);
    } else {
      appendRecord_(SHEETS.CATALOGO_BOTELLAS.name, {
        CODIGO_BOTELLA: codigo,
        DESCRIPCION_BOTELLA: descripcion,
        ESTADO: APP_CONFIG.ESTADOS.ACTIVO,
        FECHA_CREACION: now_(),
        CORREO_CREACION: currentEmail_(),
        FECHA_MODIFICACION: '',
        CORREO_MODIFICACION: ''
      });
      addAudit_(APP_CONFIG.ACCIONES.CREAR, 'CATALOGO_BOTELLAS', codigo, '', payload);
    }

    return listBotellas(true);
  });
}

function setBotellaEstado(codigo, estado) {
  return withDocumentLock_(function () {
    const cleanCodigo = normalizeText_(codigo);
    const cleanEstado = normalizeText_(estado);
    if ([APP_CONFIG.ESTADOS.ACTIVO, APP_CONFIG.ESTADOS.INACTIVO].indexOf(cleanEstado) === -1) {
      throw new Error('Estado de botella no permitido.');
    }
    const row = readRows_(SHEETS.CATALOGO_BOTELLAS.name).find(function (item) {
      return item.CODIGO_BOTELLA === cleanCodigo;
    });
    if (!row) {
      throw new Error('No existe la botella: ' + cleanCodigo);
    }
    updateRecordByRow_(SHEETS.CATALOGO_BOTELLAS.name, row._row, {
      ESTADO: cleanEstado,
      FECHA_MODIFICACION: now_(),
      CORREO_MODIFICACION: currentEmail_()
    });
    addAudit_(APP_CONFIG.ACCIONES.MODIFICAR, 'CATALOGO_BOTELLAS', cleanCodigo, '', { estado: cleanEstado });
    return listBotellas(true);
  });
}
