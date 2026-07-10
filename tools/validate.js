const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function listFiles(dir, ext) {
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(ext))
    .map((file) => path.join(dir, file));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseGs() {
  const files = ['Code.gs'].map((file) => path.join(root, file)).concat(listFiles(srcDir, '.gs'));
  const source = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  new Function(source);
  return files.length;
}

function parseClient() {
  const html = read('src/Client.html');
  const js = html.replace(/^<script>\s*/, '').replace(/\s*<\/script>\s*$/, '');
  new Function(js);
}

function validateManifest() {
  const manifest = JSON.parse(read('appsscript.json'));
  assert(manifest.runtimeVersion === 'V8', 'appsscript.json debe usar runtimeVersion V8.');
  assert(manifest.webapp && manifest.webapp.access === 'DOMAIN', 'Web App debe quedar restringida a DOMAIN.');
}

function validateClaspIgnore() {
  const ignore = read('.claspignore');
  ['!appsscript.json', '!Code.gs', '!src/', '!src/**/*.gs', '!src/**/*.html'].forEach((line) => {
    assert(ignore.includes(line), '.claspignore no incluye ' + line);
  });
}

function validateRequiredFiles() {
  [
    'README.md',
    'docs/PLAN_MAESTRO.md',
    'docs/PLAN_PRUEBAS.md',
    'docs/DESPLIEGUE_APPS_SCRIPT.md',
    'src/Config.gs',
    'src/Controller.gs',
    'src/Index.html',
    'src/Client.html',
    'src/Styles.html'
  ].forEach((file) => {
    assert(fs.existsSync(path.join(root, file)), 'Falta archivo requerido: ' + file);
  });
}

function validateNoUnsupportedPushFiles() {
  const claspIgnore = read('.claspignore');
  assert(claspIgnore.startsWith('**'), '.claspignore debe ignorar todo por defecto.');
}

function main() {
  validateRequiredFiles();
  const gsCount = parseGs();
  parseClient();
  validateManifest();
  validateClaspIgnore();
  validateNoUnsupportedPushFiles();
  console.log(`Validation OK: ${gsCount} Apps Script files + client JS`);
}

main();
