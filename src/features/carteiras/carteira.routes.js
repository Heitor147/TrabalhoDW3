const CarteiraRepository = require('./carteira.repository');
const CarteiraService = require('./carteira.service');
const CarteiraController = require('./carteira.controller');
const pool = require('../../shared/database/pool');
const autenticar = require('../../shared/middlewares/autenticar');

const carteiraRepository = new CarteiraRepository(pool);
const carteiraService = new CarteiraService(carteiraRepository);
const carteiraController = new CarteiraController(carteiraService);

const carteiraSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nome: { type: 'string' },
    visibilidade: { type: 'string' },
    criado_em: { type: 'string' }
  }
};

const erroSchema = {
  type: 'object',
  properties: { statusCode: { type: 'integer' }, message: { type: 'string' } }
};

async function carteiraRoutes(fastify) {
  fastify.addHook('onRequest', autenticar); // todas as rotas de carteira exigem login

  fastify.post('/carteiras', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Cria uma nova carteira (o criador vira dono automaticamente)',
      body: {
        type: 'object',
        required: ['nome'],
        properties: {
          nome: { type: 'string', example: 'Carteira Viagem' },
          visibilidade: { type: 'string', example: 'privada' }
        }
      },
      response: { 201: carteiraSchema, 400: erroSchema }
    }
  }, carteiraController.criar);

  fastify.get('/carteiras', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Lista todas as carteiras',
      response: { 200: { type: 'array', items: carteiraSchema } }
    }
  }, carteiraController.listarTodas);

  fastify.get('/carteiras/:id', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Busca uma carteira pelo ID',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: { 200: carteiraSchema, 404: erroSchema }
    }
  }, carteiraController.buscarPorId);

  fastify.get('/carteiras/:id/membros', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Lista os membros da carteira e seus papéis',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: { 200: { type: 'array' }, 404: erroSchema }
    }
  }, carteiraController.listarMembros);

  fastify.get('/carteiras/:id/saldos', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Lista os saldos por moeda da carteira (JOIN com moedas)',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: { 200: { type: 'array' }, 404: erroSchema }
    }
  }, carteiraController.listarSaldos);

  fastify.post('/carteiras/:id/membros', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Adiciona um membro à carteira (apenas o dono pode)',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      body: {
        type: 'object',
        required: ['usuarioId', 'papel'],
        properties: {
          usuarioId: { type: 'integer' },
          papel: { type: 'string', example: 'operador' }
        }
      },
      response: { 201: { type: 'object' }, 403: erroSchema, 409: erroSchema }
    }
  }, carteiraController.adicionarMembro);

  fastify.patch('/carteiras/:id/membros/:usuarioAlvoId', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Altera o papel de um membro (apenas o dono pode)',
      params: {
        type: 'object',
        properties: { id: { type: 'integer' }, usuarioAlvoId: { type: 'integer' } }
      },
      body: {
        type: 'object',
        required: ['papel'],
        properties: { papel: { type: 'string', example: 'comentador' } }
      },
      response: { 200: { type: 'object' }, 403: erroSchema, 404: erroSchema }
    }
  }, carteiraController.atualizarPapelMembro);

  fastify.delete('/carteiras/:id/membros/:usuarioAlvoId', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Remove um membro da carteira (apenas o dono pode)',
      params: {
        type: 'object',
        properties: { id: { type: 'integer' }, usuarioAlvoId: { type: 'integer' } }
      },
      response: { 204: { type: 'null' }, 403: erroSchema, 409: erroSchema }
    }
  }, carteiraController.removerMembro);

  fastify.post('/carteiras/:id/transferir-titularidade', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Transfere a titularidade (dono) da carteira para outro membro',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      body: {
        type: 'object',
        required: ['novoDonoId'],
        properties: { novoDonoId: { type: 'integer' } }
      },
      response: { 200: { type: 'object' }, 403: erroSchema, 404: erroSchema }
    }
  }, carteiraController.transferirTitularidade);

  fastify.patch('/carteiras/:id/visibilidade', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Altera a visibilidade da carteira (apenas o dono pode)',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      body: {
        type: 'object',
        required: ['visibilidade'],
        properties: { visibilidade: { type: 'string', example: 'publica' } }
      },
      response: { 200: carteiraSchema, 403: erroSchema }
    }
  }, carteiraController.atualizarVisibilidade);

  fastify.delete('/carteiras/:id', {
    schema: {
      tags: ['Carteiras'],
      summary: 'Exclui a carteira (apenas o dono pode)',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: { 204: { type: 'null' }, 403: erroSchema }
    }
  }, carteiraController.deletar);
}

module.exports = carteiraRoutes;
