function saveFormatos(formatos) {
  return withDocumentLock_(function () {
    const values = (formatos || []).map(function (value) {
      return assertIntegerAtLeastZero_(value, 'Formato');
    }).filter(function (value, index, array) {
      return value > 0 && array.indexOf(value) === index;
    }).sort(function (a, b) {
      return a - b;
    });
    if (!values.length) {
      throw new Error('Debe existir al menos un formato.');
    }
    setConfigValue_(APP_CONFIG.CONFIG_KEYS.FORMATOS, JSON.stringify(values));
    addAudit_(APP_CONFIG.ACCIONES.MODIFICAR, 'CONFIGURACION', APP_CONFIG.CONFIG_KEYS.FORMATOS, '', { formatos: values });
    return values;
  });
}
