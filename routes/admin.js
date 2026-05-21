const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Autenticación
router.post('/login', AdminController.login);
router.get('/me', authenticateToken, AdminController.me);
router.put('/me', authenticateToken, requireAdmin, AdminController.updateMe);

// Tarea crítica: purgar datos (solo super admin)
router.post('/purge', authenticateToken, requireAdmin, AdminController.purge);

// CRUD super_admin (solo super admin autenticado)
router.get('/admins', authenticateToken, requireAdmin, AdminController.list);
router.get('/admins/:id', authenticateToken, requireAdmin, AdminController.getById);
router.post('/admins', authenticateToken, requireAdmin, AdminController.create);
router.put('/admins/:id', authenticateToken, requireAdmin, AdminController.update);
router.delete('/admins/:id', authenticateToken, requireAdmin, AdminController.remove);

module.exports = router;