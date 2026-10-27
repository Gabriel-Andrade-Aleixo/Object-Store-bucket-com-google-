/**
 * Controlador responsável pela página de gerenciamento do bucket.
 */
const storageService = require('../services/storageService');

/**
 * Lista os objetos armazenados no bucket e renderiza a página de armazenamento.
 *
 * @param {import('express').Request} _request
 * @param {import('express').Response} response
 * @returns {Promise<void>}
 */
async function list(_request, response) {
  const bucket = storageService.getBucketInfo();
  const objects = await storageService.listObjects();
  response.render('storage/index', { bucket, objects });
}

module.exports = { list };
