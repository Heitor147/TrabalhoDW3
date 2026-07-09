const TaxaRepository = require('./taxa.repository');
const TaxaService = require('./taxa.service');
const TaxaController = require('./taxa.controller');
const pool = require('../../shared/database/pool');

const taxaRepository = new TaxaRepository(pool);
const taxaService = new TaxaService(taxaRepository);
const taxaController = new TaxaController(taxaService);

const erroSchema = {
  type: 'object',
  properties: { statusCode: { type: 'integer' }, message: { type: 'string' } }
};

async function taxaRoutes(fastify) {
  fastify.post('/taxas', {
    schema: {
      tags: ['Taxas de Câmbio'],
      summary: 'Registra uma nova taxa de câmbio (cria um novo ponto no histórico)',
      body: {
        type: 'object',
        required: ['moedaOrigemId', 'moedaDestinoId', 'valor'],
        properties: {
          moedaOrigemId: { type: 'integer', example: 1 },
          moedaDestinoId: { type: 'integer', example: 2 },
          valor: { type: 'number', example: 0.62 }
        }
      },
      response: { 201: { type: 'object' }, 400: erroSchema }
    }
  }, taxaController.criar);

  fastify.get('/taxas', {
    schema: {
      tags: ['Taxas de Câmbio'],
      summary: 'Lista o histórico completo de taxas (JOIN com moedas)',
      response: { 200: { type: 'array' } }
    }
  }, taxaController.listarTodas);

  fastify.get('/taxas/atual/:origemId/:destinoId', {
    schema: {
      tags: ['Taxas de Câmbio'],
      summary: 'Retorna a taxa vigente mais recente entre duas moedas (inverte matematicamente se necessário)',
      params: {
        type: 'object',
        properties: {
          origemId: { type: 'integer' },
          destinoId: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            valor: { type: 'number' },
            invertida: { type: 'boolean' },
            dataReferencia: { type: 'string' }
          }
        },
        404: erroSchema
      }
    }
  }, taxaController.obterTaxaAtual);
}

module.exports = taxaRoutes;
