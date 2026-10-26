const path = require('node:path');
const productService = require('../services/productService');
const storageService = require('../services/storageService');

async function upload(request, response) {
  await productService.uploadImages(request.params.productId, request.files, request.body.makeFirstPrimary === 'on');
  response.redirect(`/products/${request.params.productId}?ok=Imagens enviadas ao bucket.`);
}
async function setPrimary(request, response) {
  await productService.setPrimaryImage(request.params.productId, request.params.imageId);
  response.redirect(`/products/${request.params.productId}?ok=Imagem principal atualizada.`);
}
async function remove(request, response) {
  await productService.deleteImage(request.params.productId, request.params.imageId);
  response.redirect(`/products/${request.params.productId}?ok=Imagem apagada do bucket e do banco.`);
}
async function download(request, response, next) {
  const image = await productService.getImage(request.params.productId, request.params.imageId);
  response.attachment(path.basename(image.original_name));
  response.type(image.content_type);
  storageService.createDownloadStream(image.object_name).on('error', next).pipe(response);
}
module.exports = { upload, setPrimary, remove, download };
