/**
 * Ponto de entrada da aplicação.
 *
 * Valida credenciais, cria o schema inicial do banco, padroniza nomes antigos
 * de produtos e inicia o servidor HTTP.
 */
const fs = require('node:fs');
const app = require('./app');
const config = require('./config/config');
const database = require('./database/database');
const productService = require('./services/productService');

/**
 * Inicializa a aplicação e prepara o ambiente de execução.
 *
 * @returns {Promise<void>}
 */
async function main() {
  if (!fs.existsSync(config.credentialsPath)) throw new Error(`Credencial não encontrada: ${config.credentialsPath}`);
  if (!config.postgres.user) throw new Error('PGUSER não foi definido no arquivo .env.');
  await database.initDatabase();
  const normalizedProducts = await productService.normalizeStoredProductNames();
  if (normalizedProducts > 0) console.log(`Nomes padronizados: ${normalizedProducts}`);
  const server = app.listen(config.port, () => {
    console.log(`Catálogo disponível em http://localhost:${config.port}`);
    console.log(`PostgreSQL: ${config.postgres.host}:${config.postgres.port}/${config.postgres.database}`);
    console.log(`Bucket: ${config.bucketName}`);
  });
  const shutdown = () => server.close(async () => { await database.pool.end(); process.exit(0); });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Falha ao iniciar:', error.message);
  console.error('Confirme se o PostgreSQL está ativo e execute .\\configurar-banco.ps1.');
  process.exitCode = 1;
});
