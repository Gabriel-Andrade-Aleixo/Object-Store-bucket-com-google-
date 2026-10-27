const database = require('../database/database');

async function checkHealth() {
  let databaseStatus = 'up';

  try {
    await database.query('SELECT 1');
  } catch (error) {
    databaseStatus = 'down';
    console.error('Falha ao verificar a saúde do PostgreSQL:', error.message);
  }

  const healthy = databaseStatus === 'up';

  return {
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: databaseStatus,
    },
  };
}

module.exports = { checkHealth };
