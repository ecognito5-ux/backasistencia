// Script para agregar columna 'correo' a super_admin
const { executeQuery, testConnection } = require('../config/database');

const addCorreoColumn = async () => {
    try {
        console.log('Conectando a la base de datos...');
        const connected = await testConnection();
        
        if (!connected) {
            console.error('No se pudo conectar a la base de datos');
            process.exit(1);
        }

        const check = await executeQuery(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'super_admin' 
            AND COLUMN_NAME = 'correo'
        `);

        if (check.length === 0) {
            await executeQuery(`
                ALTER TABLE super_admin 
                ADD COLUMN correo VARCHAR(255) NULL AFTER nombre_completo
            `);
            console.log('✅ Columna "correo" agregada a super_admin');
        } else {
            console.log('ℹ️  La columna "correo" ya existe en super_admin');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

addCorreoColumn();
