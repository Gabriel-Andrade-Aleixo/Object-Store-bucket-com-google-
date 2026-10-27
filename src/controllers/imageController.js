const path = require('node:path');
const productService = require('../services/productService');
const storageService = require('../services/storageService');

/**
 * Envia as imagens recebidas para o bucket e registra seus metadados.
 * Redireciona para o produto após a conclusão do upload.
 */
async function upload(request, response) {
  await productService.uploadImages(request.params.productId, request.files, request.body.makeFirstPrimary === 'on');
  response.redirect(`/products/${request.params.productId}?ok=Imagens enviadas ao bucket.`);
}

/**
 * Define uma imagem do produto como principal e redireciona para os detalhes.
 */
async function setPrimary(request, response) {
  await productService.setPrimaryImage(request.params.productId, request.params.imageId);
  response.redirect(`/products/${request.params.productId}?ok=Imagem principal atualizada.`);
}

/**
 * Remove a imagem do bucket e seus metadados, depois redireciona para o produto.
 */
async function remove(request, response) {
  await productService.deleteImage(request.params.productId, request.params.imageId);
  response.redirect(`/products/${request.params.productId}?ok=Imagem apagada do bucket e do banco.`);
}

/**
 * Envia a imagem do bucket como anexo para download.
 * Encaminha erros do stream ao middleware de erros do Express.
 */
async function download(request, response, next) {
  const image = await productService.getImage(request.params.productId, request.params.imageId);
  response.attachment(path.basename(image.original_name));
  response.type(image.content_type);
  storageService.createDownloadStream(image.object_name).on('error', next).pipe(response);
}
module.exports = { upload, setPrimary, remove, download };
