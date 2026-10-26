const productModel = require('../models/productModel');
const imageModel = require('../models/imageModel');
const storageService = require('./storageService');

function appError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parsePrice(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw appError('Informe um preço válido, com no máximo duas casas decimais.');
  return Number(normalized).toFixed(2);
}

async function createProduct(input) {
  const name = String(input.name ?? '').trim();
  const description = String(input.description ?? '').trim();
  if (name.length < 2 || name.length > 120) throw appError('O nome deve ter entre 2 e 120 caracteres.');
  if (description.length < 5 || description.length > 2000) throw appError('A descrição deve ter entre 5 e 2000 caracteres.');
  return productModel.create({ name, description, price: parsePrice(input.price) });
}

async function listProducts() { return productModel.findAll(); }

async function getProduct(productId) {
  const product = await productModel.findById(productId);
  if (!product) throw appError('Produto não encontrado.', 404);
  return { ...product, images: await imageModel.findByProduct(productId) };
}

async function uploadImages(productId, files, makeFirstPrimary = false) {
  await getProduct(productId);
  if (!files?.length) throw appError('Selecione pelo menos uma imagem.');
  const cloudObjects = [];
  const records = [];
  try {
    for (const file of files) {
      const cloudFile = await storageService.uploadImage({
        productId, buffer: file.buffer, originalName: file.originalname, contentType: file.mimetype,
      });
      cloudObjects.push(cloudFile.objectName);
      records.push(await imageModel.create({
        productId,
        objectName: cloudFile.objectName,
        originalName: file.originalname,
        publicUrl: cloudFile.publicUrl,
        contentType: file.mimetype,
      }));
    }
  } catch (error) {
    await Promise.allSettled(cloudObjects.map((name) => storageService.deleteObject(name)));
    await Promise.allSettled(records.map((image) => imageModel.remove(image.id)));
    throw error;
  }
  if (makeFirstPrimary || !(await imageModel.getPrimary(productId))) await imageModel.setPrimary(productId, records[0].id);
  return records;
}

async function setPrimaryImage(productId, imageId) {
  await getProduct(productId);
  if (!(await imageModel.setPrimary(productId, imageId))) throw appError('Imagem não encontrada para este produto.', 404);
}

async function deleteImage(productId, imageId) {
  await getProduct(productId);
  const image = await imageModel.findById(imageId);
  if (!image || image.product_id !== productId) throw appError('Imagem não encontrada para este produto.', 404);
  await storageService.deleteObject(image.object_name);
  await imageModel.remove(image.id);
  if (image.is_primary) {
    const [nextImage] = await imageModel.findByProduct(productId);
    if (nextImage) await imageModel.setPrimary(productId, nextImage.id);
  }
}

async function getImage(productId, imageId) {
  await getProduct(productId);
  const image = await imageModel.findById(imageId);
  if (!image || image.product_id !== productId) throw appError('Imagem não encontrada para este produto.', 404);
  return image;
}

module.exports = { createProduct, listProducts, getProduct, uploadImages, setPrimaryImage, deleteImage, getImage, parsePrice };
