const express = require('express');
const router = express.Router();
const PersonalController = require('../controllers/PersonalController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, PersonalController.list);
router.get('/:id', authenticateToken, PersonalController.getById);
router.post('/', authenticateToken, PersonalController.create);
router.put('/:id', authenticateToken, PersonalController.update);
router.delete('/:id', authenticateToken, PersonalController.remove);

module.exports = router;