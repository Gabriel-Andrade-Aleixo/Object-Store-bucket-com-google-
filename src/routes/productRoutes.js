const express = require('express');
const productController = require('../controllers/productController');
const imageController = require('../controllers/imageController');
const upload = require('../middleware/upload');
const config = require('../config/config');
const router = express.Router();

router.get('/', productController.list);
router.get('/new', productController.newForm);
router.post('/', productController.create);
router.get('/:productId', productController.detail);
router.post('/:productId/images', upload.array('images', config.maxFilesPerUpload), imageController.upload);
router.post('/:productId/images/:imageId/primary', imageController.setPrimary);
router.post('/:productId/images/:imageId/delete', imageController.remove);
router.get('/:productId/images/:imageId/download', imageController.download);
module.exports = router;
