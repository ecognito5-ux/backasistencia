const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/RoleController');
const { authenticateToken } = require('../middleware/auth');

// Rutas para roles (protegidas con autenticación)
router.get('/', authenticateToken, RoleController.getAllRoles);
router.get('/area/:areaId', authenticateToken, RoleController.getRolesByArea);
router.get('/personal-area/:personalAreaId', authenticateToken, RoleController.getRolesByPersonalArea);
router.post('/', authenticateToken, RoleController.createRole);
router.put('/:id', authenticateToken, RoleController.updateRole);
router.delete('/:id', authenticateToken, RoleController.deleteRole);

module.exports = router;
