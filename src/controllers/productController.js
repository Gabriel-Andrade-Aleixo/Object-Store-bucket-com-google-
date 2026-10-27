/**
 * Controlador responsável pelas rotas relacionadas a produtos.
 */
const productService = require('../services/productService');

/**
 * Exibe a listagem completa de produtos cadastrados.
 *
 * @param {import('express').Request} _request
 * @param {import('express').Response} response
 * @returns {Promise<void>}
 */
async function list(_request, response) {
  response.render('products/index', { products: await productService.listProducts() });
}

/**
 * Renderiza o formulário de cadastro de produto.
 *
 * @param {import('express').Request} _request
 * @param {import('express').Response} response
 * @returns {void}
 */
function newForm(_request, response) { response.render('products/new', { values: {}, error: null }); }

/**
 * Cria um novo produto e redireciona para a página detalhada em caso de sucesso.
 *
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 * @returns {Promise<void>}
 */
async function create(request, response) {
  try {
    const product = await productService.createProduct(request.body);
    response.redirect(`/products/${product.id}?ok=Produto cadastrado com sucesso.`);
  } catch (error) {
    if (error.status === 400) return response.status(400).render('products/new', { values: request.body, error: error.message });
    throw error;
  }
}

/**
 * Exibe os detalhes de um produto específico e a mensagem de sucesso do fluxo.
 *
 * @param {import('express').Request} request
 * @param {import('express').Response} response
 * @returns {Promise<void>}
 */
async function detail(request, response) {
  response.render('products/show', { product: await productService.getProduct(request.params.productId), ok: request.query.ok || null });
}
module.exports = { list, newForm, create, detail };
