const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS: permitir cualquier origen (solo desarrollo). Para prod, fija allowlist.
app.use(cors({ origin: true, credentials: true }));
// Header para Private Network Access (Chrome) y preflight OPTIONS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Private-Network', 'true');
    next();
});
// Manejo genérico de preflight sin usar patrón '*'
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin || '*';
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Private-Network', 'true');
        return res.sendStatus(204);
    }
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas básicas
app.get('/', (req, res) => {
    res.json({ 
        message: 'Servidor COSSMIL funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Rutas de la API
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Rutas API
const adminRoutes = require('./routes/admin');
const personalRoutes = require('./routes/personal');
const trabajadoresRoutes = require('./routes/trabajadores');
const areasRoutes = require('./routes/areas');
const personalAreaRoutes = require('./routes/personalArea');
const rolesRoutes = require('./routes/roles');
const ubicacionesRoutes = require('./routes/ubicaciones');
const asignacionesRoutes = require('./routes/asignaciones');
const asistenciasRoutes = require('./routes/asistencias');
app.use('/api/admin', adminRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/trabajadores', trabajadoresRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/personal-area', personalAreaRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/ubicaciones', ubicacionesRoutes);
app.use('/api/asignaciones', asignacionesRoutes);
app.use('/api/asistencias', asistenciasRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ 
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Iniciar servidor (exponer en todas las interfaces)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor COSSMIL ejecutándose en puerto ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;