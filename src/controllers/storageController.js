const storageService = require('../services/storageService');
async function list(_request, response) {
  const bucket = storageService.getBucketInfo();
  const objects = await storageService.listObjects();
  response.render('storage/index', { bucket, objects });
}
module.exports = { list };
