const ConfiguracaoRepository = require('./configuracao.repository');
const ConfiguracaoService = require('./configuracao.service');
const ConfiguracaoController = require('./configuracao.controller');
const pool = require('../../shared/database/pool');
const autenticar = require('../../shared/middlewares/autenticar');

const configuracaoRepository = new ConfiguracaoRepository(pool);
const configuracaoService = new ConfiguracaoService(configuracaoRepository);
const configuracaoController = new ConfiguracaoController(configuracaoService);

const configuracaoSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    usuario_id: { type: 'integer' },
    moeda_padrao_id: { type: 'integer' },
    idioma: { type: 'string' }
  }
};

const erroSchema = {
  type: 'object',
  properties: { statusCode: { type: 'integer' }, message: { type: 'string' } }
};

async function configuracaoRoutes(fastify) {
  fastify.addHook('onRequest', autenticar);

  fastify.post('/configuracoes', {
    schema: {
      tags: ['Configurações'],
      summary: 'Cria a configuração do usuário autenticado (relação 1:1)',
      body: {
        type: 'object',
        properties: {
          moedaPadraoId: { type: 'integer', example: 1 },
          idioma: { type: 'string', example: 'pt-BR' }
        }
      },
      response: { 201: configuracaoSchema, 409: erroSchema }
    }
  }, configuracaoController.criar);

  fastify.get('/configuracoes/minha', {
    schema: {
      tags: ['Configurações'],
      summary: 'Busca a configuração do usuário autenticado',
      response: { 200: configuracaoSchema, 404: erroSchema }
    }
  }, configuracaoController.buscarMinha);

  fastify.patch('/configuracoes', {
    schema: {
      tags: ['Configurações'],
      summary: 'Atualiza a configuração do usuário autenticado',
      body: {
        type: 'object',
        properties: {
          moedaPadraoId: { type: 'integer' },
          idioma: { type: 'string' }
        }
      },
      response: { 200: configuracaoSchema, 404: erroSchema }
    }
  }, configuracaoController.atualizar);
}

module.exports = configuracaoRoutes;
