// Script para agregar columna 'correo' a las tablas personal_area y personal_trabajador
const { executeQuery, testConnection } = require('../config/database');

const addCorreoColumn = async () => {
    try {
        console.log('Conectando a la base de datos...');
        const connected = await testConnection();
        
        if (!connected) {
            console.error('No se pudo conectar a la base de datos');
            process.exit(1);
        }

        console.log('\n📧 Agregando columna "correo" a las tablas...\n');

        // Verificar si la columna ya existe en personal_area
        try {
            const checkPersonalArea = await executeQuery(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'personal_area' 
                AND COLUMN_NAME = 'correo'
            `);

            if (checkPersonalArea.length === 0) {
                await executeQuery(`
                    ALTER TABLE personal_area 
                    ADD COLUMN correo VARCHAR(255) NULL AFTER nombre_completo
                `);
                console.log('✅ Columna "correo" agregada a personal_area');
            } else {
                console.log('ℹ️  La columna "correo" ya existe en personal_area');
            }
        } catch (error) {
            console.error('Error modificando personal_area:', error.message);
        }

        // Verificar si la columna ya existe en personal_trabajador
        try {
            const checkPersonalTrabajador = await executeQuery(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'personal_trabajador' 
                AND COLUMN_NAME = 'correo'
            `);

            if (checkPersonalTrabajador.length === 0) {
                await executeQuery(`
                    ALTER TABLE personal_trabajador 
                    ADD COLUMN correo VARCHAR(255) NULL AFTER nombre_completo
                `);
                console.log('✅ Columna "correo" agregada a personal_trabajador');
            } else {
                console.log('ℹ️  La columna "correo" ya existe en personal_trabajador');
            }
        } catch (error) {
            console.error('Error modificando personal_trabajador:', error.message);
        }

        console.log('\n🎉 Proceso completado');
        process.exit(0);
    } catch (error) {
        console.error('Error general:', error);
        process.exit(1);
    }
};

addCorreoColumn();
