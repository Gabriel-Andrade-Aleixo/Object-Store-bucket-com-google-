const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

/**
 * Verifica se a aplicação e o PostgreSQL estão disponíveis.
 */
router.get('/', healthController.check);

module.exports = router;
