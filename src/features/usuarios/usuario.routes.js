const UsuarioRepository = require('./usuario.repository');
const UsuarioService = require('./usuario.service');
const UsuarioController = require('./usuario.controller');
const pool = require('../../shared/database/pool');

const usuarioRepository = new UsuarioRepository(pool);
const usuarioService = new UsuarioService(usuarioRepository);
const usuarioController = new UsuarioController(usuarioService);

const usuarioSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nome: { type: 'string' },
    email: { type: 'string' },
    criado_em: { type: 'string' }
  }
};

const erroSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'integer' },
    message: { type: 'string' }
  }
};

async function usuarioRoutes(fastify) {
  fastify.post('/usuarios', {
    schema: {
      tags: ['Usuários'],
      summary: 'Cadastra um novo usuário',
      body: {
        type: 'object',
        required: ['nome', 'email', 'senha'],
        properties: {
          nome: { type: 'string', example: 'Maria Silva' },
          email: { type: 'string', example: 'maria@email.com' },
          senha: { type: 'string', example: 'senha123' }
        }
      },
      response: {
        201: usuarioSchema,
        409: erroSchema
      }
    }
  }, usuarioController.cadastrar);

  fastify.post('/usuarios/login', {
    schema: {
      tags: ['Usuários'],
      summary: 'Realiza login e retorna um token JWT',
      body: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', example: 'maria@email.com' },
          senha: { type: 'string', example: 'senha123' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            usuario: usuarioSchema
          }
        },
        401: erroSchema
      }
    }
  }, usuarioController.login);

  fastify.get('/usuarios', {
    schema: {
      tags: ['Usuários'],
      summary: 'Lista todos os usuários',
      response: { 200: { type: 'array', items: usuarioSchema } }
    }
  }, usuarioController.listarTodos);

  fastify.get('/usuarios/:id', {
    schema: {
      tags: ['Usuários'],
      summary: 'Busca um usuário pelo ID',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: { 200: usuarioSchema, 404: erroSchema }
    }
  }, usuarioController.buscarPorId);

  fastify.patch('/usuarios/:id', {
    schema: {
      tags: ['Usuários'],
      summary: 'Atualiza dados de um usuário',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      body: {
        type: 'object',
        properties: {
          nome: { type: 'string' },
          email: { type: 'string' }
        }
      },
      response: { 200: usuarioSchema, 404: erroSchema }
    }
  }, usuarioController.atualizar);

  fastify.delete('/usuarios/:id', {
    schema: {
      tags: ['Usuários'],
      summary: 'Remove um usuário',
      params: { type: 'object', properties: { id: { type: 'integer' } } },
      response: { 204: { type: 'null' }, 404: erroSchema }
    }
  }, usuarioController.deletar);
}

module.exports = usuarioRoutes;
