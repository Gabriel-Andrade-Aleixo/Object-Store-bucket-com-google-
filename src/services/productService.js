/**
 * Serviço de regras de negócio para produtos e imagens.
 *
 * Orquestra validações de entrada, normalização de nomes, upload de imagens e
 * manutenção da imagem principal associada a cada produto.
 */
const productModel = require('../models/productModel');
const imageModel = require('../models/imageModel');
const storageService = require('./storageService');

const lowercaseConnectors = new Set([
  'a', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas',
  'no', 'nos', 'o', 'os', 'para', 'por',
]);

/**
 * Cria uma instância de erro de aplicação com status HTTP associado.
 *
 * @param {string} message - Mensagem amigável para o usuário.
 * @param {number} [status=400] - Status HTTP da falha.
 * @returns {Error & { status: number }} Erro padronizado.
 */
function appError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * Valida e converte o valor de preço para decimal com duas casas.
 *
 * @param {string|number|undefined} value - Valor informado pelo formulário.
 * @returns {string} Valor em formato decimal com duas casas.
 */
function parsePrice(value) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw appError('Informe um preço válido, com no máximo duas casas decimais.');
  return Number(normalized).toFixed(2);
}

/**
 * Normaliza o nome do produto para uma apresentação consistente.
 *
 * @param {string|undefined} value - Nome digitado pelo usuário.
 * @returns {string} Nome com capitalização padronizada.
 */
function normalizeProductName(value) {
  const normalized = String(value ?? '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR');

  return normalized.split(' ').map((word, index) => {
    if (index > 0 && lowercaseConnectors.has(word)) return word;

    return word.split('-').map((part) => {
      if (/^\d+[a-z]+$/iu.test(part)) return part.toLocaleUpperCase('pt-BR');
      return part
        ? part.charAt(0).toLocaleUpperCase('pt-BR') + part.slice(1)
        : part;
    }).join('-');
  }).join(' ');
}

/**
 * Cria um produto com validação de nome, descrição e preço.
 *
 * @param {{ name: string, description: string, price: string|number }} input - Dados do formulário.
 * @returns {Promise<object>} Produto persistido.
 */
async function createProduct(input) {
  const name = normalizeProductName(input.name);
  const description = String(input.description ?? '').trim();
  if (name.length < 2 || name.length > 120) throw appError('O nome deve ter entre 2 e 120 caracteres.');
  if (description.length < 5 || description.length > 2000) throw appError('A descrição deve ter entre 5 e 2000 caracteres.');
  return productModel.create({ name, description, price: parsePrice(input.price) });
}

/**
 * Lista todos os produtos cadastrados.
 *
 * @returns {Promise<Array<object>>} Produtos disponíveis.
 */
async function listProducts() { return productModel.findAll(); }

/**
 * Reprocessa os nomes cadastrados para garantir a padronização de exibição.
 *
 * @returns {Promise<number>} Quantidade de produtos atualizados.
 */
async function normalizeStoredProductNames() {
  const products = await productModel.findAll();
  let updated = 0;
  for (const product of products) {
    const normalizedName = normalizeProductName(product.name);
    if (normalizedName && normalizedName !== product.name) {
      await productModel.updateName(product.id, normalizedName);
      updated += 1;
    }
  }
  return updated;
}

/**
 * Recupera um produto e suas imagens associadas.
 *
 * @param {string} productId - Identificador do produto.
 * @returns {Promise<object>} Produto com a lista de imagens.
 */
async function getProduct(productId) {
  const product = await productModel.findById(productId);
  if (!product) throw appError('Produto não encontrado.', 404);
  return { ...product, images: await imageModel.findByProduct(productId) };
}

/**
 * Faz upload de uma ou mais imagens para o bucket e registra os metadados.
 *
 * @param {string} productId - Identificador do produto.
 * @param {Array<{ buffer: Buffer, originalname: string, mimetype: string }>} files - Arquivos enviados.
 * @param {boolean} [makeFirstPrimary=false] - Indica se a primeira imagem deve ser a principal.
 * @returns {Promise<Array<object>>} Imagens cadastradas.
 */
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

/**
 * Define uma imagem como principal do produto.
 *
 * @param {string} productId - Identificador do produto.
 * @param {string} imageId - Identificador da imagem.
 * @returns {Promise<void>}
 */
async function setPrimaryImage(productId, imageId) {
  await getProduct(productId);
  if (!(await imageModel.setPrimary(productId, imageId))) throw appError('Imagem não encontrada para este produto.', 404);
}

/**
 * Remove uma imagem do produto e do bucket, ajustando a imagem principal.
 *
 * @param {string} productId - Identificador do produto.
 * @param {string} imageId - Identificador da imagem.
 * @returns {Promise<void>}
 */
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

/**
 * Recupera uma imagem específica vinculada ao produto.
 *
 * @param {string} productId - Identificador do produto.
 * @param {string} imageId - Identificador da imagem.
 * @returns {Promise<object>} Imagem solicitada.
 */
async function getImage(productId, imageId) {
  await getProduct(productId);
  const image = await imageModel.findById(imageId);
  if (!image || image.product_id !== productId) throw appError('Imagem não encontrada para este produto.', 404);
  return image;
}

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  uploadImages,
  setPrimaryImage,
  deleteImage,
  getImage,
  parsePrice,
  normalizeProductName,
  normalizeStoredProductNames,
};
