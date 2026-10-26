const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Storage } = require('@google-cloud/storage');
const config = require('../config/config');

const storage = new Storage({ keyFilename: config.credentialsPath });
const bucket = storage.bucket(config.bucketName);

function safeFileName(fileName) {
  const extension = path.extname(fileName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const base = path.basename(fileName, path.extname(fileName))
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'imagem';
  return `${base}${extension}`;
}

function publicUrl(objectName) {
  return `https://storage.googleapis.com/${config.bucketName}/${objectName.split('/').map(encodeURIComponent).join('/')}`;
}

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

async function deleteObject(objectName) {
  await bucket.file(objectName).delete({ ignoreNotFound: true });
}

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

function createDownloadStream(objectName) {
  return bucket.file(objectName).createReadStream();
}

function getBucketInfo() {
  // A service account da atividade administra objetos, mas não possui
  // storage.buckets.get. Exibimos somente a configuração conhecida.
  return {
    name: config.bucketName,
    location: config.bucketLocation,
    storageClass: config.bucketStorageClass,
    publicBaseUrl: `https://storage.googleapis.com/${config.bucketName}/`,
  };
}

module.exports = { uploadImage, deleteObject, listObjects, createDownloadStream, getBucketInfo, publicUrl, safeFileName };
