function assertRequired_(value, label) {
  if (normalizeText_(value) === '') {
    throw new Error(label + ' es obligatorio.');
  }
}

function assertIntegerAtLeastZero_(value, label) {
  const numberValue = parseIntegerInput_(value);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new Error(label + ' debe ser un número entero mayor o igual a cero.');
  }
  return numberValue;
}

function parseIntegerInput_(value) {
  if (typeof value === 'number') {
    return value;
  }
  const text = normalizeText_(value);
  if (text === '') {
    return NaN;
  }
  const clean = text.replace(/\./g, '').replace(/\s/g, '');
  if (!/^\d+$/.test(clean)) {
    return NaN;
  }
  return Number(clean);
}

function getFormatosPermitidos_(configRows) {
  const rows = configRows || readRows_(SHEETS.CONFIGURACION.name);
  const row = rows.find(function (item) {
    return item.CLAVE === APP_CONFIG.CONFIG_KEYS.FORMATOS;
  });
  return parseJsonArray_(row && row.VALOR, [1, 6, 8, 12, 24]).map(Number);
}

function assertFormatoPermitido_(formato) {
  const value = assertIntegerAtLeastZero_(formato, 'Formato');
  if (getFormatosPermitidos_().indexOf(value) === -1) {
    throw new Error('Formato no permitido: ' + value);
  }
  return value;
}

function calculateLineTotal_(formato, cantidadCajas) {
  const cleanFormato = assertFormatoPermitido_(formato);
  const cleanCajas = assertIntegerAtLeastZero_(cantidadCajas, 'Cantidad de cajas');
  return cleanFormato * cleanCajas;
}

function calculateRegistroTotals_(zona1, zona5, botellasQuebradas) {
  const cleanZona1 = assertIntegerAtLeastZero_(zona1, 'Zona 1');
  const cleanZona5 = assertIntegerAtLeastZero_(zona5, 'Zona 5');
  const cleanQuebradas = assertIntegerAtLeastZero_(botellasQuebradas || 0, 'Botellas quebradas');
  const baseCalculo = cleanZona1 + cleanQuebradas;
  if (cleanZona5 > baseCalculo) {
    throw new Error('Zona 5 no puede ser mayor que Zona 1 más botellas quebradas.');
  }
  const merma = baseCalculo - cleanZona5;
  const porcentaje = baseCalculo === 0 ? 0 : (merma / baseCalculo) * 100;
  return {
    ZONA_1: cleanZona1,
    ZONA_5: cleanZona5,
    BOTELLAS_QUEBRADAS: cleanQuebradas,
    MERMA: merma,
    PORCENTAJE_MERMA: porcentaje
  };
}

function assertMotivo_(motivo) {
  assertRequired_(motivo, 'Motivo');
  return normalizeText_(motivo);
}
