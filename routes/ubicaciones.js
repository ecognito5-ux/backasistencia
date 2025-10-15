const express = require('express');
const router = express.Router();
const UbicacionController = require('../controllers/UbicacionController');
const { authenticateToken } = require('../middleware/auth');

// Rutas para ubicaciones geográficas
router.get('/', authenticateToken, UbicacionController.getAllUbicaciones);
router.get('/:id', authenticateToken, UbicacionController.getUbicacionById);
router.post('/', authenticateToken, UbicacionController.createUbicacion);
router.put('/:id', authenticateToken, UbicacionController.updateUbicacion);
router.delete('/:id', authenticateToken, UbicacionController.deleteUbicacion);

module.exports = router;


