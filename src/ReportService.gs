function parseDateFilter_(value, endOfDay) {
  if (!value) {
    return null;
  }
  const text = normalizeText_(value);
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const localMatch = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  const parts = isoMatch
    ? [Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])]
    : localMatch
      ? [Number(localMatch[3]), Number(localMatch[2]), Number(localMatch[1])]
      : null;
  const date = parts
    ? new Date(parts[0], parts[1] - 1, parts[2])
    : new Date(value);
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

function pad2_(value) {
  return String(value).padStart(2, '0');
}

function formatDateKey_(date) {
  return [
    date.getFullYear(),
    pad2_(date.getMonth() + 1),
    pad2_(date.getDate())
  ].join('-');
}

function getIsoWeekInfo_(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const weekYear = date.getFullYear();
  const firstThursday = new Date(weekYear, 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  const week = 1 + Math.round((date - firstThursday) / 604800000);
  return { year: weekYear, week: week };
}

function getIsoWeekRange_(year, week) {
  const cleanYear = Number(year || now_().getFullYear());
  const cleanWeek = Number(week);
  if (!Number.isInteger(cleanYear) || cleanYear < 2000 || cleanYear > 2100) {
    throw new Error('Año de semana inválido.');
  }
  if (!Number.isInteger(cleanWeek) || cleanWeek < 1 || cleanWeek > 53) {
    throw new Error('Número de semana inválido.');
  }
  const fourthJan = new Date(cleanYear, 0, 4);
  const monday = new Date(fourthJan);
  monday.setDate(fourthJan.getDate() - ((fourthJan.getDay() + 6) % 7) + ((cleanWeek - 1) * 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { desde: monday, hasta: sunday };
}

function resolveDateRangeFilters_(filters) {
  const safeFilters = filters || {};
  const weekFrom = normalizeText_(safeFilters.semanaDesde || safeFilters.semana);
  const weekTo = normalizeText_(safeFilters.semanaHasta || safeFilters.semana);
  if (weekFrom) {
    const fromRange = getIsoWeekRange_(safeFilters.semanaAnio, Number(weekFrom));
    const toRange = getIsoWeekRange_(safeFilters.semanaAnio, Number(weekTo || weekFrom));
    return { desde: fromRange.desde, hasta: toRange.hasta };
  }
  return {
    desde: parseDateFilter_(safeFilters.desde, false),
    hasta: parseDateFilter_(safeFilters.hasta || safeFilters.desde, true)
  };
}

function getReportData(filters) {
  const safeFilters = filters || {};
  const range = resolveDateRangeFilters_(safeFilters);
  const desde = range.desde;
  const hasta = range.hasta;
  const codigo = normalizeText_(safeFilters.codigoBotella);
  const rows = readRows_(SHEETS.REGISTROS_BOTELLAS.name).filter(function (row) {
    if (row.ESTADO === APP_CONFIG.ESTADOS.ELIMINADO) {
      return false;
    }
    const fecha = row.FECHA_HORA instanceof Date ? row.FECHA_HORA : new Date(row.FECHA_HORA);
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
  const hasFilters = filters && (filters.desde || filters.hasta || filters.semana || filters.semanaDesde || filters.semanaHasta);
  return getReportData(hasFilters ? filters : { desde: today, hasta: today });
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
  const byDate = {};
  const rowsWithWeek = rows.map(function (row) {
    const fecha = row.FECHA_HORA instanceof Date ? row.FECHA_HORA : new Date(row.FECHA_HORA);
    const weekInfo = getIsoWeekInfo_(fecha);
    return Object.assign({}, row, {
      SEMANA: weekInfo.week,
      SEMANA_ANIO: weekInfo.year
    });
  });
  rowsWithWeek.forEach(function (row) {
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

    const fecha = row.FECHA_HORA instanceof Date ? row.FECHA_HORA : new Date(row.FECHA_HORA);
    const dateKey = formatDateKey_(fecha);
    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        fecha: dateKey,
        zona1: 0,
        zona5: 0,
        merma: 0,
        cantidadRegistros: 0
      };
    }
    byDate[dateKey].zona1 += Number(row.ZONA_1 || 0);
    byDate[dateKey].zona5 += Number(row.ZONA_5 || 0);
    byDate[dateKey].merma += Number(row.MERMA || 0);
    byDate[dateKey].cantidadRegistros += 1;
  });

  return {
    totals: totals,
    rows: rowsWithWeek,
    grouped: Object.keys(grouped).map(function (key) {
      const item = grouped[key];
      item.porcentajeMerma = item.zona1 === 0 ? 0 : (item.merma / item.zona1) * 100;
      return item;
    }).sort(function (a, b) { return b.merma - a.merma; }),
    byDate: Object.keys(byDate).sort().map(function (key) {
      const item = byDate[key];
      item.porcentajeMerma = item.zona1 === 0 ? 0 : (item.merma / item.zona1) * 100;
      return item;
    })
  };
}
