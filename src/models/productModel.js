const { randomUUID } = require('node:crypto');
const db = require('../database/database');

function mapProduct(row) {
  if (!row) return null;
  return { ...row, price: Number(row.price), image_count: Number(row.image_count || 0) };
}

async function create({ name, description, price }) {
  const id = randomUUID();
  const { rows } = await db.query(`
    INSERT INTO products (id, name, description, price)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [id, name, description, price]);
  return mapProduct(rows[0]);
}

async function findAll() {
  const { rows } = await db.query(`
    SELECT p.*, i.id AS primary_image_id, i.public_url AS primary_image_url,
           i.original_name AS primary_image_name,
           (SELECT COUNT(*) FROM product_images x WHERE x.product_id = p.id) AS image_count
    FROM products p
    LEFT JOIN product_images i ON i.product_id = p.id AND i.is_primary = TRUE
    ORDER BY p.created_at DESC
  `);
  return rows.map(mapProduct);
}

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
  return mapProduct(rows[0]);
}

async function findByName(name) {
  const { rows } = await db.query('SELECT * FROM products WHERE name = $1', [name]);
  return mapProduct(rows[0]);
}

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
