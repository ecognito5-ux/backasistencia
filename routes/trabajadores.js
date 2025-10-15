const express = require('express');
const router = express.Router();
const TrabajadorController = require('../controllers/TrabajadorController');
const { authenticateToken } = require('../middleware/auth');

// Ruta de login (sin autenticación)
router.post('/login', TrabajadorController.loginTrabajador);

// Rutas para trabajadores (protegidas con autenticación)
router.get('/', authenticateToken, TrabajadorController.getAllTrabajadores);
router.get('/area/:areaId', authenticateToken, TrabajadorController.getTrabajadoresByArea);
router.get('/personal-area/:personalAreaId', authenticateToken, TrabajadorController.getTrabajadoresByPersonalArea);
router.post('/', authenticateToken, TrabajadorController.createTrabajador);
router.put('/change-password', authenticateToken, TrabajadorController.changePassword);
router.put('/:id', authenticateToken, TrabajadorController.updateTrabajador);
router.delete('/:id', authenticateToken, TrabajadorController.deleteTrabajador);

module.exports = router;