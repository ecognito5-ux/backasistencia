const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const AsistenciaControlController = require('../controllers/AsistenciaControlController');

router.get('/reporte-encargado', authenticateToken, AsistenciaControlController.reporteEncargado);
router.get('/', authenticateToken, AsistenciaControlController.listAsistencias);
router.post('/', authenticateToken, AsistenciaControlController.marcarAsistencia);
router.patch('/:id/comentario', authenticateToken, AsistenciaControlController.actualizarComentario);

module.exports = router;
