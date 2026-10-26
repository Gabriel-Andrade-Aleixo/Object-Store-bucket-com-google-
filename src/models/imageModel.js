const { randomUUID } = require('node:crypto');
const db = require('../database/database');

function mapImage(row) {
  return row ? { ...row, is_primary: Boolean(row.is_primary) } : null;
}

async function create({ productId, objectName, originalName, publicUrl, contentType }) {
  const { rows } = await db.query(`
    INSERT INTO product_images
      (id, product_id, object_name, original_name, public_url, content_type)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [randomUUID(), productId, objectName, originalName, publicUrl, contentType]);
  return mapImage(rows[0]);
}

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM product_images WHERE id = $1', [id]);
  return mapImage(rows[0]);
}

async function findByProduct(productId) {
  const { rows } = await db.query(`
    SELECT * FROM product_images
    WHERE product_id = $1
    ORDER BY is_primary DESC, created_at ASC
  `, [productId]);
  return rows.map(mapImage);
}

async function countByProduct(productId) {
  const { rows } = await db.query('SELECT COUNT(*) AS total FROM product_images WHERE product_id = $1', [productId]);
  return Number(rows[0].total);
}

async function getPrimary(productId) {
  const { rows } = await db.query('SELECT * FROM product_images WHERE product_id = $1 AND is_primary = TRUE', [productId]);
  return mapImage(rows[0]);
}

async function setPrimary(productId, imageId) {
  return db.transaction(async (client) => {
    const found = await client.query('SELECT id FROM product_images WHERE id = $1 AND product_id = $2', [imageId, productId]);
    if (!found.rowCount) return false;
    await client.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = $1', [productId]);
    await client.query('UPDATE product_images SET is_primary = TRUE WHERE id = $1', [imageId]);
    return true;
  });
}

async function remove(id) {
  const result = await db.query('DELETE FROM product_images WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = { create, findById, findByProduct, countByProduct, getPrimary, setPrimary, remove };
