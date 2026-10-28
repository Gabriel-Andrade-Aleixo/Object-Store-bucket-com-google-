/**
 * Model de acesso aos produtos.
 *
 * Encapsula as operações de persistência e leitura dos registros de produtos,
 * incluindo a transformação de campos numéricos e a junção com a imagem principal.
 */
const { randomUUID } = require('node:crypto');
const db = require('../database/database');

/**
 * Converte uma linha do PostgreSQL em um objeto de produto com tipos JavaScript.
 *
 * @param {object|null} row - Registro retornado pela query.
 * @returns {object|null} Produto normalizado.
 */
function mapProduct(row) {
  if (!row) return null;
  return { ...row, price: Number(row.price), image_count: Number(row.image_count || 0) };
}

/**
 * Cria um novo produto no banco.
 *
 * @param {{ name: string, description: string, price: number|string }} product - Dados do produto.
 * @returns {Promise<object|null>} Produto criado.
 */
async function create({ name, description, price }) {
  const id = randomUUID();
  const { rows } = await db.query(`
    INSERT INTO products (id, name, description, price)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [id, name, description, price]);
  return mapProduct(rows[0]);
}

/**
 * Lista os produtos com informações da imagem principal e total de imagens.
 *
 * Quando um termo de pesquisa é informado, filtra por nome ou descrição sem
 * diferenciar maiúsculas de minúsculas. O termo é enviado como parâmetro do
 * PostgreSQL, e os caracteres curinga (% e _) são tratados como texto literal.
 *
 * @param {string} [search=''] - Termo de pesquisa opcional.
 * @returns {Promise<Array<object>>} Lista de produtos.
 */
async function findAll(search = '') {
  const params = [];
  let where = '';
  if (search) {
    params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
    where = 'WHERE p.name ILIKE $1 OR p.description ILIKE $1';
  }
  const { rows } = await db.query(`
    SELECT p.*, i.id AS primary_image_id, i.public_url AS primary_image_url,
           i.original_name AS primary_image_name,
           (SELECT COUNT(*) FROM product_images x WHERE x.product_id = p.id) AS image_count
    FROM products p
    LEFT JOIN product_images i ON i.product_id = p.id AND i.is_primary = TRUE
    ${where}
    ORDER BY p.created_at DESC
  `, params);
  return rows.map(mapProduct);
}

/**
 * Busca um produto pelo identificador.
 *
 * @param {string} id - Identificador do produto.
 * @returns {Promise<object|null>} Produto encontrado ou nulo.
 */
async function findById(id) {
  const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
  return mapProduct(rows[0]);
}

/**
 * Busca um produto pelo nome.
 *
 * @param {string} name - Nome do produto.
 * @returns {Promise<object|null>} Produto encontrado ou nulo.
 */
async function findByName(name) {
  const { rows } = await db.query('SELECT * FROM products WHERE name = $1', [name]);
  return mapProduct(rows[0]);
}

/**
 * Atualiza o nome de um produto e mantém o timestamp de alteração.
 *
 * @param {string} id - Identificador do produto.
 * @param {string} name - Novo nome normalizado.
 * @returns {Promise<object|null>} Produto atualizado.
 */
async function updateName(id, name) {
  const { rows } = await db.query(`
    UPDATE products
    SET name = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [id, name]);
  return mapProduct(rows[0]);
}

module.exports = { create, findAll, findById, findByName, updateName };
