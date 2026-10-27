/**
 * Model de gestão das imagens associadas aos produtos.
 *
 * Responsável por armazenar metadados das imagens, manter a imagem principal e
 * remover registros quando o arquivo for excluído do bucket.
 */
const { randomUUID } = require('node:crypto');
const db = require('../database/database');

/**
 * Converte uma linha do PostgreSQL em um objeto de imagem com flag booleana.
 *
 * @param {object|null} row - Registro retornado pela query.
 * @returns {object|null} Imagem normalizada.
 */
function mapImage(row) {
  return row ? { ...row, is_primary: Boolean(row.is_primary) } : null;
}

/**
 * Cria um registro de imagem vinculada a um produto.
 *
 * @param {{ productId: string, objectName: string, originalName: string, publicUrl: string, contentType: string }} imageData
 * @returns {Promise<object|null>} Imagem persistida.
 */
async function create({ productId, objectName, originalName, publicUrl, contentType }) {
  const { rows } = await db.query(`
    INSERT INTO product_images
      (id, product_id, object_name, original_name, public_url, content_type)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [randomUUID(), productId, objectName, originalName, publicUrl, contentType]);
  return mapImage(rows[0]);
}

/**
 * Busca uma imagem pelo identificador exclusivo.
 *
 * @param {string} id - Identificador da imagem.
 * @returns {Promise<object|null>} Imagem encontrada ou nula.
 */
async function findById(id) {
  const { rows } = await db.query('SELECT * FROM product_images WHERE id = $1', [id]);
  return mapImage(rows[0]);
}

/**
 * Lista todas as imagens do produto em ordem de prioridade da imagem principal.
 *
 * @param {string} productId - Identificador do produto.
 * @returns {Promise<Array<object>>} Lista das imagens.
 */
async function findByProduct(productId) {
  const { rows } = await db.query(`
    SELECT * FROM product_images
    WHERE product_id = $1
    ORDER BY is_primary DESC, created_at ASC
  `, [productId]);
  return rows.map(mapImage);
}

/**
 * Conta quantas imagens um produto possui.
 *
 * @param {string} productId - Identificador do produto.
 * @returns {Promise<number>} Quantidade total de imagens.
 */
async function countByProduct(productId) {
  const { rows } = await db.query('SELECT COUNT(*) AS total FROM product_images WHERE product_id = $1', [productId]);
  return Number(rows[0].total);
}

/**
 * Recupera a imagem principal atual do produto.
 *
 * @param {string} productId - Identificador do produto.
 * @returns {Promise<object|null>} Imagem principal ou nula.
 */
async function getPrimary(productId) {
  const { rows } = await db.query('SELECT * FROM product_images WHERE product_id = $1 AND is_primary = TRUE', [productId]);
  return mapImage(rows[0]);
}

/**
 * Define uma imagem específica como principal para o produto.
 *
 * @param {string} productId - Identificador do produto.
 * @param {string} imageId - Identificador da imagem.
 * @returns {Promise<boolean>} Verdadeiro quando a imagem foi atualizada com sucesso.
 */
async function setPrimary(productId, imageId) {
  return db.transaction(async (client) => {
    const found = await client.query('SELECT id FROM product_images WHERE id = $1 AND product_id = $2', [imageId, productId]);
    if (!found.rowCount) return false;
    await client.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = $1', [productId]);
    await client.query('UPDATE product_images SET is_primary = TRUE WHERE id = $1', [imageId]);
    return true;
  });
}

/**
 * Remove uma imagem do banco de dados.
 *
 * @param {string} id - Identificador da imagem.
 * @returns {Promise<boolean>} Verdadeiro quando o registro foi removido.
 */
async function remove(id) {
  const result = await db.query('DELETE FROM product_images WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = { create, findById, findByProduct, countByProduct, getPrimary, setPrimary, remove };
