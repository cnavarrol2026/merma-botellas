function setupWorkbook() {
  return withDocumentLock_(function () {
    Object.keys(SHEETS).forEach(function (key) {
      ensureSheet_(SHEETS[key]);
    });
    seedConfiguracion_();
    return 'Workbook configurado correctamente.';
  });
}

function seedConfiguracion_() {
  const existing = readRows_(SHEETS.CONFIGURACION.name);
  const keys = existing.map(function (row) { return row.CLAVE; });
  const seeds = [
    {
      CLAVE: APP_CONFIG.CONFIG_KEYS.FORMATOS,
      VALOR: JSON.stringify([1, 6, 8, 12, 24]),
      DESCRIPCION: 'Formatos permitidos para cajas de botellas'
    },
    {
      CLAVE: APP_CONFIG.CONFIG_KEYS.BOTELLA_BLOQUEADA,
      VALOR: '',
      DESCRIPCION: 'Codigo de botella bloqueado por merma activa'
    },
    {
      CLAVE: APP_CONFIG.CONFIG_KEYS.DESCRIPCION_BLOQUEADA,
      VALOR: '',
      DESCRIPCION: 'Descripcion de botella bloqueada por merma activa'
    },
    {
      CLAVE: APP_CONFIG.CONFIG_KEYS.BLOQUEO_FECHA,
      VALOR: '',
      DESCRIPCION: 'Fecha del bloqueo activo'
    },
    {
      CLAVE: APP_CONFIG.CONFIG_KEYS.BLOQUEO_CORREO,
      VALOR: '',
      DESCRIPCION: 'Correo que inicio el bloqueo activo'
    }
  ];

  seeds.forEach(function (seed) {
    if (keys.indexOf(seed.CLAVE) === -1) {
      appendRecord_(SHEETS.CONFIGURACION.name, Object.assign(seed, {
        FECHA_MODIFICACION: now_(),
        CORREO_MODIFICACION: currentEmail_()
      }));
    }
  });
}
