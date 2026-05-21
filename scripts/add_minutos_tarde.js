const { executeQuery, testConnection } = require('../config/database');

(async () => {
  try {
    await testConnection();
    const check = await executeQuery(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asistencias_control' AND COLUMN_NAME = 'minutos_tarde'
    `);
    if (check.length === 0) {
      await executeQuery('ALTER TABLE asistencias_control ADD COLUMN minutos_tarde INT NULL DEFAULT NULL AFTER comentario');
      console.log('Columna minutos_tarde agregada');
    } else {
      console.log('Columna minutos_tarde ya existe');
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
