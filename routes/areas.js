const express = require('express');
const router = express.Router();
const AreaController = require('../controllers/AreaController');
const { authenticateToken } = require('../middleware/auth');

// Rutas para áreas laborales (protegidas con autenticación)
router.get('/', authenticateToken, AreaController.getAllAreas);
router.get('/:id', authenticateToken, AreaController.getAreaById);
router.post('/', authenticateToken, AreaController.createArea);
router.put('/:id', authenticateToken, AreaController.updateArea);
router.delete('/:id', authenticateToken, AreaController.deleteArea);

module.exports = router;
