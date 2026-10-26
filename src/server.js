const fs = require('node:fs');
const app = require('./app');
const config = require('./config/config');
const database = require('./database/database');

async function main() {
  if (!fs.existsSync(config.credentialsPath)) throw new Error(`Credencial não encontrada: ${config.credentialsPath}`);
  await database.initDatabase();
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
