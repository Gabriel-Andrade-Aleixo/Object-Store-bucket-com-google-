/**
 * Serviço de integração com o Google Cloud Storage.
 *
 * Centraliza upload, listagem, exclusão e geração das URLs públicas dos objetos
 * armazenados no bucket do catálogo de produtos.
 */
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Storage } = require('@google-cloud/storage');
const config = require('../config/config');

const storage = new Storage({ keyFilename: config.credentialsPath });
const bucket = storage.bucket(config.bucketName);

/**
 * Gera um nome de arquivo seguro para o bucket, preservando extensão e removendo
 * caracteres especiais.
 *
 * @param {string} fileName - Nome original do arquivo enviado pelo usuário.
 * @returns {string} Nome sanitizado para armazenamento.
 */
function safeFileName(fileName) {
  const extension = path.extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const base = path.basename(fileName, path.extname(fileName))
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'imagem';
  return `${base}${extension}`;
}

/**
 * Cria a URL pública de acesso a um objeto do bucket.
 *
 * @param {string} objectName - Caminho do objeto no bucket.
 * @returns {string} URL pública do arquivo.
 */
function publicUrl(objectName) {
  return `https://storage.googleapis.com/${config.bucketName}/${objectName.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * Realiza o upload de uma imagem para o bucket em um caminho específico do produto.
 *
 * @param {{ productId: string, buffer: Buffer, originalName: string, contentType: string }} imageData
 * @returns {Promise<{ objectName: string, publicUrl: string }>} Dados do objeto armazenado.
 */
async function uploadImage({ productId, buffer, originalName, contentType }) {
  const objectName = `produtos/${productId}/${Date.now()}-${randomUUID()}-${safeFileName(originalName)}`;
  await bucket.file(objectName).save(buffer, {
    resumable: false,
    validation: 'crc32c',
    metadata: {
      contentType,
      cacheControl: 'public, max-age=3600',
      metadata: { productId, originalName },
    },
  });
  return { objectName, publicUrl: publicUrl(objectName) };
}

/**
 * Remove um objeto do bucket, ignorando erro quando o arquivo já não existe.
 *
 * @param {string} objectName - Nome do objeto no bucket.
 * @returns {Promise<void>}
 */
async function deleteObject(objectName) {
  await bucket.file(objectName).delete({ ignoreNotFound: true });
}

/**
 * Lista os objetos públicos de produtos disponíveis no bucket.
 *
 * @returns {Promise<Array<{ name: string, size: number, contentType: string, updated: string|null, publicUrl: string }>>}
 */
async function listObjects() {
  const [files] = await bucket.getFiles({ prefix: 'produtos/' });
  return files.filter((file) => !file.name.endsWith('/')).map((file) => ({
    name: file.name,
    size: Number(file.metadata.size || 0),
    contentType: file.metadata.contentType || 'application/octet-stream',
    updated: file.metadata.updated || null,
    publicUrl: publicUrl(file.name),
  })).sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
}

/**
 * Cria um stream de leitura para download do objeto armazenado.
 *
 * @param {string} objectName - Nome do objeto no bucket.
 * @returns {NodeJS.ReadableStream} Stream de leitura do arquivo.
 */
function createDownloadStream(objectName) {
  return bucket.file(objectName).createReadStream();
}

/**
 * Retorna metadados públicos do bucket para uso nas telas da aplicação.
 *
 * @returns {{ name: string, location: string, storageClass: string, publicBaseUrl: string }}
 */
function getBucketInfo() {
  // A service account da atividade administra objetos, mas não possui
  // storage.buckets.get.
  // Exibimos somente a configuração conhecida.
  return {
    name: config.bucketName,
    location: config.bucketLocation,
    storageClass: config.bucketStorageClass,
    publicBaseUrl: `https://storage.googleapis.com/${config.bucketName}/`,
  };
}

module.exports = { uploadImage, deleteObject, listObjects, createDownloadStream, getBucketInfo, publicUrl, safeFileName };
