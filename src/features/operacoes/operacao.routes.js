const OperacaoRepository = require('./operacao.repository');
const OperacaoService = require('./operacao.service');
const OperacaoController = require('./operacao.controller');
const pool = require('../../shared/database/pool');
const autenticar = require('../../shared/middlewares/autenticar');

// Precisa dos Services de outras features, montados aqui via DI também
const CarteiraRepository = require('../carteiras/carteira.repository');
const CarteiraService = require('../carteiras/carteira.service');
const TaxaRepository = require('../taxas/taxa.repository');
const TaxaService = require('../taxas/taxa.service');

const operacaoRepository = new OperacaoRepository(pool);
const carteiraRepository = new CarteiraRepository(pool);
const carteiraService = new CarteiraService(carteiraRepository);
const taxaRepository = new TaxaRepository(pool);
const taxaService = new TaxaService(taxaRepository);

const operacaoService = new OperacaoService(operacaoRepository, carteiraService, taxaService);
const operacaoController = new OperacaoController(operacaoService);

const erroSchema = {
  type: 'object',
  properties: { statusCode: { type: 'integer' }, message: { type: 'string' } }
};

const operacaoBodySchema = {
  type: 'object',
  required: ['moedaOrigemId', 'moedaDestinoId', 'valor'],
  properties: {
    moedaOrigemId: { type: 'integer', example: 1 },
    moedaDestinoId: { type: 'integer', example: 2 },
    valor: { type: 'number', example: 100 }
  }
};

async function operacaoRoutes(fastify) {
  fastify.addHook('onRequest', autenticar);

  fastify.post('/carteiras/:carteiraId/operacoes', {
    schema: {
      tags: ['Operações'],
      summary: 'Cria e executa uma operação diretamente (apenas operador ou dono)',
      params: { type: 'object', properties: { carteiraId: { type: 'integer' } } },
      body: operacaoBodySchema,
      response: { 201: { type: 'object' }, 400: erroSchema, 403: erroSchema }
    }
  }, operacaoController.criarDireta);

  fastify.post('/carteiras/:carteiraId/operacoes/sugestoes', {
    schema: {
      tags: ['Operações'],
      summary: 'Cria uma sugestão de operação (comentador, operador ou dono)',
      params: { type: 'object', properties: { carteiraId: { type: 'integer' } } },
      body: operacaoBodySchema,
      response: { 201: { type: 'object' }, 400: erroSchema, 403: erroSchema }
    }
  }, operacaoController.sugerir);

  fastify.patch('/operacoes/:id/aprovar', {
    schema: {
      tags: ['Operações'],
      summary: 'Aprova uma sugestão pendente, executando a conversão automaticamente',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: { 200: { type: 'object' }, 403: erroSchema, 409: erroSchema }
    }
  }, operacaoController.aprovar);

  fastify.patch('/operacoes/:id/rejeitar', {
    schema: {
      tags: ['Operações'],
      summary: 'Rejeita uma sugestão pendente (não afeta saldo)',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: { 200: { type: 'object' }, 403: erroSchema, 409: erroSchema }
    }
  }, operacaoController.rejeitar);

  fastify.get('/operacoes/:id', {
    schema: {
      tags: ['Operações'],
      summary: 'Busca uma operação detalhada (JOIN com usuário, carteira e moedas)',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: { 200: { type: 'object' }, 404: erroSchema }
    }
  }, operacaoController.buscarDetalhada);

  fastify.get('/carteiras/:carteiraId/operacoes', {
    schema: {
      tags: ['Operações'],
      summary: 'Lista o histórico de operações de uma carteira',
      params: { type: 'object', properties: { carteiraId: { type: 'integer' } } },
      response: { 200: { type: 'array' }, 403: erroSchema }
    }
  }, operacaoController.listarPorCarteira);

  fastify.get('/operacoes/:id/comparar-taxa-atual', {
    schema: {
      tags: ['Operações'],
      summary: 'Compara a taxa congelada da operação com a taxa vigente atual',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: {
        200: {
          type: 'object',
          properties: {
            taxaUtilizadaNaOperacao: { type: 'number' },
            taxaAtual: { type: 'number' },
            variacaoPercentual: { type: 'number' },
            valorConvertidoNaEpoca: { type: 'number' },
            valorConvertidoComTaxaAtual: { type: 'number' }
          }
        },
        404: erroSchema
      }
    }
  }, operacaoController.compararComTaxaAtual);

  fastify.delete('/operacoes/:id', {
    schema: {
      tags: ['Operações'],
      summary: 'Exclui uma operação pendente ou rejeitada',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: { 204: { type: 'null' }, 403: erroSchema, 409: erroSchema }
    }
  }, operacaoController.deletar);
}

module.exports = operacaoRoutes;
