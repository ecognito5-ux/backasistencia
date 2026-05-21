const express = require('express');
const router = express.Router();
const PersonalAreaController = require('../controllers/PersonalAreaController');
const { authenticateToken, requireArea } = require('../middleware/auth');

// Ruta de login (SIN autenticación)
router.post('/login', PersonalAreaController.loginPersonalArea);

// Mi perfil (solo personal de área)
router.get('/me', authenticateToken, requireArea, PersonalAreaController.getMe);
router.put('/me', authenticateToken, requireArea, PersonalAreaController.updateMe);

// Rutas para personal de área (protegidas con autenticación)
router.get('/', authenticateToken, PersonalAreaController.getAllPersonalArea);
router.get('/area/:areaId', authenticateToken, PersonalAreaController.getPersonalByArea);
router.get('/:id', authenticateToken, PersonalAreaController.getPersonalAreaById);
router.post('/', authenticateToken, PersonalAreaController.createPersonalArea);
router.put('/:id', authenticateToken, PersonalAreaController.updatePersonalArea);
router.delete('/:id', authenticateToken, PersonalAreaController.deletePersonalArea);

module.exports = router;
