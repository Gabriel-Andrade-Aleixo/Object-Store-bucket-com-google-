const healthService = require('../services/healthService');

/**
 * Retorna o estado da aplicação e suas verificações em JSON.
 * Usa HTTP 200 quando os serviços verificados estão disponíveis e HTTP 503
 * quando alguma verificação indica indisponibilidade.
 */
async function check(_request, response) {
  const health = await healthService.checkHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;

  response.status(statusCode).json(health);
}

module.exports = { check };