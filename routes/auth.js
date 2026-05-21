const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// Login unificado (correo/username + contraseña) - redirige según rol
router.post('/login', AuthController.unifiedLogin);

// Obtener configuración de Google (Client ID)
router.get('/google/config', AuthController.getGoogleConfig);

// Login con Google (auto-detecta rol por correo)
router.post('/google/login', AuthController.googleLogin);

module.exports = router;
