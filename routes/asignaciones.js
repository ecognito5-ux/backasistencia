const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const AsignacionControlController = require('../controllers/AsignacionControlController');

// Todas protegidas por token
router.get('/', authenticateToken, AsignacionControlController.listAsignaciones);
router.post('/', authenticateToken, AsignacionControlController.createAsignacion);
router.put('/:id', authenticateToken, AsignacionControlController.updateAsignacion);
router.delete('/:id', authenticateToken, AsignacionControlController.deleteAsignacion);

module.exports = router;


