const { executeQuery } = require('../config/database');
(async () => {
  await executeQuery("UPDATE super_admin SET correo = 'reviewiasit@gmail.com' WHERE id = 1");
  console.log('Correo del admin actualizado');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
