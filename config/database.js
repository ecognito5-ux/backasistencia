const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// DB_* en .env local; en Railway también acepta MYSQLHOST, MYSQLUSER, etc.
const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    user: process.env.DB_USER || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Validación simple para ayudar en despliegues
if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
    console.warn('⚠️  Faltan variables de base de datos (DB_* o MYSQL* en Railway).');
}

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Promisificar para usar async/await
const promisePool = pool.promise();

// Función para probar la conexión
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Conexión a MySQL establecida correctamente');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a MySQL:', error.message);
        return false;
    }
};

// Función para ejecutar queries
const executeQuery = async (query, params = []) => {
    try {
        const [results] = await promisePool.execute(query, params);
        return results;
    } catch (error) {
        console.error('Error ejecutando query:', error);
        throw error;
    }
};

module.exports = {
    pool,
    promisePool,
    testConnection,
    executeQuery
};