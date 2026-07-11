function getWorkbook_() {
  if (APP_CONFIG.SPREADSHEET_ID && APP_CONFIG.SPREADSHEET_ID.indexOf('REEMPLAZAR_') !== 0) {
    return SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('Configura APP_CONFIG.SPREADSHEET_ID o usa un proyecto vinculado a Google Sheets.');
  }
  return active;
}

function now_() {
  return new Date();
}

function currentEmail_() {
  return Session.getActiveUser().getEmail() || 'correo-no-disponible';
}

function createId_(prefix) {
  return prefix + '-' + Utilities.getUuid();
}

function normalizeText_(value) {
  return String(value || '').trim();
}

function parseJsonArray_(value, fallback) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function withDocumentLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function ok_(data) {
  return { ok: true, data: serializeForClient_(data || null) };
}

function fail_(error) {
  return {
    ok: false,
    error: error && error.message ? error.message : String(error)
  };
}

function serializeForClient_(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(function (item) {
      return serializeForClient_(item);
    });
  }
  if (value && typeof value === 'object') {
    const clean = {};
    Object.keys(value).forEach(function (key) {
      clean[key] = serializeForClient_(value[key]);
    });
    return clean;
  }
  return value;
}
