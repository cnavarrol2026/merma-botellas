function sheetDefByName_(sheetName) {
  const defs = Object.keys(SHEETS).map(function (key) { return SHEETS[key]; });
  return defs.find(function (def) { return def.name === sheetName; });
}

function getSheet_(sheetName) {
  const sheet = getWorkbook_().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('No existe la hoja requerida: ' + sheetName);
  }
  return sheet;
}

function ensureSheet_(def) {
  const workbook = getWorkbook_();
  const sheet = workbook.getSheetByName(def.name) || workbook.insertSheet(def.name);
  const currentHeaders = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), def.headers.length)).getValues()[0]
    : [];

  const needsHeaders = def.headers.some(function (header, index) {
    return currentHeaders[index] !== header;
  });

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function readRows_(sheetName) {
  const sheet = getSheet_(sheetName);
  const def = sheetDefByName_(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  const values = sheet.getRange(2, 1, lastRow - 1, def.headers.length).getValues();
  return values.map(function (row, index) {
    const record = { _row: index + 2 };
    def.headers.forEach(function (header, colIndex) {
      record[header] = row[colIndex];
    });
    return record;
  });
}

function appendRecord_(sheetName, record) {
  const sheet = getSheet_(sheetName);
  const def = sheetDefByName_(sheetName);
  const row = def.headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(record, header) ? record[header] : '';
  });
  sheet.appendRow(row);
  return record;
}

function appendRecords_(sheetName, records) {
  if (!records.length) {
    return;
  }
  const sheet = getSheet_(sheetName);
  const def = sheetDefByName_(sheetName);
  const rows = records.map(function (record) {
    return def.headers.map(function (header) {
      return Object.prototype.hasOwnProperty.call(record, header) ? record[header] : '';
    });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, def.headers.length).setValues(rows);
}

function updateRecordByRow_(sheetName, rowNumber, patch) {
  const sheet = getSheet_(sheetName);
  const def = sheetDefByName_(sheetName);
  const current = sheet.getRange(rowNumber, 1, 1, def.headers.length).getValues()[0];
  const next = def.headers.map(function (header, index) {
    return Object.prototype.hasOwnProperty.call(patch, header) ? patch[header] : current[index];
  });
  sheet.getRange(rowNumber, 1, 1, def.headers.length).setValues([next]);
}

function clearDataRows_(sheetName) {
  const sheet = getSheet_(sheetName);
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow > 1 && lastColumn > 0) {
    sheet.getRange(2, 1, lastRow - 1, lastColumn).clearContent();
  }
}

function findByField_(sheetName, fieldName, value) {
  return readRows_(sheetName).filter(function (row) {
    return String(row[fieldName]) === String(value);
  });
}

function addAudit_(action, entity, id, motivo, detalle) {
  appendRecord_(SHEETS.AUDITORIA.name, {
    ID_AUDITORIA: createId_('AUD'),
    FECHA_HORA: now_(),
    ACCION: action,
    ENTIDAD: entity,
    ID_ENTIDAD: id || '',
    CORREO: currentEmail_(),
    MOTIVO: motivo || '',
    DETALLE: detalle ? JSON.stringify(detalle) : ''
  });
}
