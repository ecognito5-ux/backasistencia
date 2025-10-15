const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/AdminController');
const { authenticateToken } = require('../middleware/auth');

// Autenticación
router.post('/login', AdminController.login);
router.get('/me', authenticateToken, AdminController.me);

// CRUD super_admin (protegido)
router.get('/', authenticateToken, AdminController.list);
router.get('/:id', authenticateToken, AdminController.getById);
router.post('/', authenticateToken, AdminController.create);
router.put('/:id', authenticateToken, AdminController.update);
router.delete('/:id', authenticateToken, AdminController.remove);

module.exports = router;