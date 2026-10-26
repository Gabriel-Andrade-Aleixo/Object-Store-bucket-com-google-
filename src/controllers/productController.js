const productService = require('../services/productService');

async function list(_request, response) {
  response.render('products/index', { products: await productService.listProducts() });
}
function newForm(_request, response) { response.render('products/new', { values: {}, error: null }); }
async function create(request, response) {
  try {
    const product = await productService.createProduct(request.body);
    response.redirect(`/products/${product.id}?ok=Produto cadastrado com sucesso.`);
  } catch (error) {
    if (error.status === 400) return response.status(400).render('products/new', { values: request.body, error: error.message });
    throw error;
  }
}
async function detail(request, response) {
  response.render('products/show', { product: await productService.getProduct(request.params.productId), ok: request.query.ok || null });
}
module.exports = { list, newForm, create, detail };
