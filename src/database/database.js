const { Pool } = require('pg');
const config = require('../config/config');

const pool = new Pool(config.postgres);

pool.on('error', (error) => {
  console.error('Erro inesperado na conexão PostgreSQL:', error.message);
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id UUID PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      object_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      public_url TEXT NOT NULL,
      content_type VARCHAR(100) NOT NULL,
      is_primary BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_product_images_product
      ON product_images(product_id);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_image_per_product
      ON product_images(product_id)
      WHERE is_primary = TRUE;
  `);
}

async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, query: (...args) => pool.query(...args), initDatabase, transaction };
