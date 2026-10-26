const path = require('node:path');
const dotenv = require('dotenv');

const projectRoot = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true });

module.exports = {
  projectRoot,
  port: Number(process.env.PORT || 8080),
  bucketName: process.env.BUCKET_NAME || 'fatec-2026-grupo-c',
  bucketLocation: 'us-central1',
  bucketStorageClass: 'STANDARD',
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(projectRoot, 'sa-grupo-c-key.json'),
  postgres: {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || 'mensageria_object_store',
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD || undefined,
    max: 10,
    idleTimeoutMillis: 30000,
  },
  maxFileSize: 10 * 1024 * 1024,
  maxFilesPerUpload: 10,
};
