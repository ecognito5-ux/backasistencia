const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Configuración de la base de datos (solo por .env)
// Requiere definir en el entorno: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Validación simple para ayudar en despliegues
['DB_HOST','DB_USER','DB_PASSWORD','DB_NAME'].forEach((k) => {
    if (!process.env[k]) {
        console.warn(`⚠️  Variable ${k} no está definida en el entorno (.env).`);
    }
});

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