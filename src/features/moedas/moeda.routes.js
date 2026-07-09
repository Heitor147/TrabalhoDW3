const MoedaRepository = require('./moeda.repository');
const MoedaService = require('./moeda.service');
const MoedaController = require('./moeda.controller');
const pool = require('../../shared/database/pool');

const moedaRepository = new MoedaRepository(pool);
const moedaService = new MoedaService(moedaRepository);
const moedaController = new MoedaController(moedaService);

const moedaSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    codigo: { type: 'string', example: 'USD' },
    nome: { type: 'string', example: 'Dólar Americano' }
  }
};

const erroSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    message: { type: 'string' }
  }
};

async function moedaRoutes(fastify) {
  fastify.post('/moedas', {
    schema: {
      tags: ['Moedas'],
      summary: 'Cria uma nova moeda',
      body: {
        type: 'object',
        required: ['codigo', 'nome'],
        properties: {
          codigo: { type: 'string', example: 'USD' },
          nome: { type: 'string', example: 'Dólar Americano' }
        }
      },
      response: {
        201: moedaSchema,
        409: erroSchema
      }
    }
  }, moedaController.criar);

  fastify.get('/moedas', {
    schema: {
      tags: ['Moedas'],
      summary: 'Lista todas as moedas cadastradas',
      response: {
        200: { type: 'array', items: moedaSchema }
      }
    }
  }, moedaController.listarTodas);

  fastify.get('/moedas/:id', {
    schema: {
      tags: ['Moedas'],
      summary: 'Busca uma moeda pelo ID',
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      },
      response: {
        200: moedaSchema,
        404: erroSchema
      }
    }
  }, moedaController.buscarPorId);

  fastify.patch('/moedas/:id', {
    schema: {
      tags: ['Moedas'],
      summary: 'Atualiza uma moeda existente',
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      },
      body: {
        type: 'object',
        properties: {
          codigo: { type: 'string' },
          nome: { type: 'string' }
        }
      },
      response: {
        200: moedaSchema,
        404: erroSchema,
        409: erroSchema
      }
    }
  }, moedaController.atualizar);

  fastify.delete('/moedas/:id', {
    schema: {
      tags: ['Moedas'],
      summary: 'Remove uma moeda (se não estiver em uso em nenhuma carteira)',
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } }
      },
      response: {
        204: { type: 'null' },
        404: erroSchema,
        409: erroSchema
      }
    }
  }, moedaController.deletar);
}

module.exports = moedaRoutes;
