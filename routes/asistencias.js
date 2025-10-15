const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const AsistenciaControlController = require('../controllers/AsistenciaControlController');

router.get('/', authenticateToken, AsistenciaControlController.listAsistencias);
router.post('/', authenticateToken, AsistenciaControlController.marcarAsistencia);

module.exports = router;


