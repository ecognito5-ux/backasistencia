const express = require('express');
const router = express.Router();
const PersonalAreaController = require('../controllers/PersonalAreaController');
const { authenticateToken } = require('../middleware/auth');

// Ruta de login (SIN autenticación)
router.post('/login', PersonalAreaController.loginPersonalArea);

// Rutas para personal de área (protegidas con autenticación)
router.get('/', authenticateToken, PersonalAreaController.getAllPersonalArea);
router.get('/area/:areaId', authenticateToken, PersonalAreaController.getPersonalByArea);
router.get('/:id', authenticateToken, PersonalAreaController.getPersonalAreaById);
router.post('/', authenticateToken, PersonalAreaController.createPersonalArea);
router.put('/:id', authenticateToken, PersonalAreaController.updatePersonalArea);
router.delete('/:id', authenticateToken, PersonalAreaController.deletePersonalArea);

module.exports = router;
