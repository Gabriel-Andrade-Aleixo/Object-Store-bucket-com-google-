const test = require('node:test');
const assert = require('node:assert/strict');
const healthService = require('../src/services/healthService');
const healthController = require('../src/controllers/healthController');
const healthRoutes = require('../src/routes/healthRoutes');

test('registra GET / na rota de saúde', () => {
  const route = healthRoutes.stack.find((layer) => layer.route?.path === '/');

  assert.ok(route);
  assert.equal(route.route.methods.get, true);
});

test('retorna 200 para aplicação saudável e 503 para indisponível', async (context) => {
  const originalCheckHealth = healthService.checkHealth;
  context.after(() => { healthService.checkHealth = originalCheckHealth; });

  let statusCode;
  let responseBody;
  const response = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  healthService.checkHealth = async () => ({ status: 'healthy', checks: { database: 'up' } });
  await healthController.check({}, response);
  assert.equal(statusCode, 200);
  assert.equal(responseBody.checks.database, 'up');

  healthService.checkHealth = async () => ({ status: 'unhealthy', checks: { database: 'down' } });
  await healthController.check({}, response);
  assert.equal(statusCode, 503);
  assert.equal(responseBody.checks.database, 'down');
});
