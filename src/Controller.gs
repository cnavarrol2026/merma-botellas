function doGet() {
  return HtmlService
    .createTemplateFromFile('src/Index')
    .evaluate()
    .setTitle('Merma de Botellas')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function apiBootstrap() {
  try {
    return ok_({
      empresa: APP_CONFIG.EMPRESA_NOMBRE,
      pollingMs: APP_CONFIG.POLLING_MS,
      botellas: listBotellas(false),
      catalogoCompleto: listBotellas(true),
      temp: getTempState(),
      dashboard: getDashboardData({})
    });
  } catch (error) {
    return fail_(error);
  }
}

function apiSetupWorkbook() {
  try {
    return ok_(setupWorkbook());
  } catch (error) {
    return fail_(error);
  }
}

function apiSaveBotella(payload) {
  try {
    return ok_(saveBotella(payload || {}));
  } catch (error) {
    return fail_(error);
  }
}

function apiSetBotellaEstado(codigo, estado) {
  try {
    return ok_(setBotellaEstado(codigo, estado));
  } catch (error) {
    return fail_(error);
  }
}

function apiSaveFormatos(formatos) {
  try {
    return ok_(saveFormatos(formatos || []));
  } catch (error) {
    return fail_(error);
  }
}

function apiStartTempBottle(codigoBotella) {
  try {
    return ok_(startTempBottle(codigoBotella));
  } catch (error) {
    return fail_(error);
  }
}

function apiGetTempState() {
  try {
    return ok_(getTempState());
  } catch (error) {
    return fail_(error);
  }
}

function apiAddTempLine(payload) {
  try {
    return ok_(addTempLine(payload || {}));
  } catch (error) {
    return fail_(error);
  }
}

function apiUpdateTempLine(idTemporal, payload) {
  try {
    return ok_(updateTempLine(idTemporal, payload || {}));
  } catch (error) {
    return fail_(error);
  }
}

function apiDeleteTempLine(idTemporal) {
  try {
    return ok_(deleteTempLine(idTemporal));
  } catch (error) {
    return fail_(error);
  }
}

function apiCancelTempList() {
  try {
    return ok_(cancelTempList());
  } catch (error) {
    return fail_(error);
  }
}

function apiSaveRegistro(payload) {
  try {
    return ok_(saveRegistroFromTemp(payload || {}));
  } catch (error) {
    return fail_(error);
  }
}

function apiGetRegistro(idRegistro) {
  try {
    return ok_(getRegistroById(idRegistro));
  } catch (error) {
    return fail_(error);
  }
}

function apiGetReport(filters) {
  try {
    return ok_(getReportData(filters || {}));
  } catch (error) {
    return fail_(error);
  }
}

function apiGetDashboard(filters) {
  try {
    return ok_(getDashboardData(filters || {}));
  } catch (error) {
    return fail_(error);
  }
}

function apiGetDeletedRecords() {
  try {
    return ok_(getDeletedRecords());
  } catch (error) {
    return fail_(error);
  }
}

function apiDeleteRegistro(idRegistro, motivo) {
  try {
    return ok_(deleteRegistro(idRegistro, motivo));
  } catch (error) {
    return fail_(error);
  }
}

function apiRestoreRegistro(idRegistro, motivo) {
  try {
    return ok_(restoreRegistro(idRegistro, motivo));
  } catch (error) {
    return fail_(error);
  }
}

function apiUpdateRegistro(payload) {
  try {
    return ok_(updateRegistro(payload || {}));
  } catch (error) {
    return fail_(error);
  }
}
