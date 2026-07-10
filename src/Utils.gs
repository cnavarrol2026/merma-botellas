function getWorkbook_() {
  if (!APP_CONFIG.SPREADSHEET_ID || APP_CONFIG.SPREADSHEET_ID.indexOf('REEMPLAZAR_') === 0) {
    throw new Error('Configura APP_CONFIG.SPREADSHEET_ID antes de usar la aplicacion.');
  }
  return SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
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
  return { ok: true, data: data || null };
}

function fail_(error) {
  return {
    ok: false,
    error: error && error.message ? error.message : String(error)
  };
}
