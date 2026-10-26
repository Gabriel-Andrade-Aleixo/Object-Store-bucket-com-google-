const express = require('express');
const storageController = require('../controllers/storageController');
const router = express.Router();
router.get('/objects', storageController.list);
module.exports = router;
