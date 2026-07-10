function parseDateFilter_(value, endOfDay) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

function getReportData(filters) {
  const safeFilters = filters || {};
  const desde = parseDateFilter_(safeFilters.desde, false);
  const hasta = parseDateFilter_(safeFilters.hasta || safeFilters.desde, true);
  const codigo = normalizeText_(safeFilters.codigoBotella);
  const rows = readRows_(SHEETS.REGISTROS_BOTELLAS.name).filter(function (row) {
    if (row.ESTADO === APP_CONFIG.ESTADOS.ELIMINADO) {
      return false;
    }
    const fecha = new Date(row.FECHA_HORA);
    if (desde && fecha < desde) {
      return false;
    }
    if (hasta && fecha > hasta) {
      return false;
    }
    return !codigo || row.CODIGO_BOTELLA === codigo;
  });
  return buildReportSummary_(rows);
}

function getDashboardData(filters) {
  const today = Utilities.formatDate(now_(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return getReportData(filters && (filters.desde || filters.hasta) ? filters : { desde: today, hasta: today });
}

function getDeletedRecords() {
  return readRows_(SHEETS.REGISTROS_BOTELLAS.name)
    .filter(function (row) { return row.ESTADO === APP_CONFIG.ESTADOS.ELIMINADO; })
    .sort(function (a, b) { return new Date(b.FECHA_ELIMINACION) - new Date(a.FECHA_ELIMINACION); });
}

function buildReportSummary_(rows) {
  const totals = rows.reduce(function (acc, row) {
    acc.zona1 += Number(row.ZONA_1 || 0);
    acc.zona5 += Number(row.ZONA_5 || 0);
    acc.merma += Number(row.MERMA || 0);
    return acc;
  }, { zona1: 0, zona5: 0, merma: 0 });
  totals.porcentajeMerma = totals.zona1 === 0 ? 0 : (totals.merma / totals.zona1) * 100;
  totals.cantidadRegistros = rows.length;

  const grouped = {};
  rows.forEach(function (row) {
    const key = row.CODIGO_BOTELLA;
    if (!grouped[key]) {
      grouped[key] = {
        codigoBotella: row.CODIGO_BOTELLA,
        descripcionBotella: row.DESCRIPCION_BOTELLA,
        zona1: 0,
        zona5: 0,
        merma: 0,
        cantidadRegistros: 0
      };
    }
    grouped[key].zona1 += Number(row.ZONA_1 || 0);
    grouped[key].zona5 += Number(row.ZONA_5 || 0);
    grouped[key].merma += Number(row.MERMA || 0);
    grouped[key].cantidadRegistros += 1;
  });

  return {
    totals: totals,
    rows: rows,
    grouped: Object.keys(grouped).map(function (key) {
      const item = grouped[key];
      item.porcentajeMerma = item.zona1 === 0 ? 0 : (item.merma / item.zona1) * 100;
      return item;
    })
  };
}
