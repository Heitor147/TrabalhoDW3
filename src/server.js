require('dotenv').config();
const fastify = require('fastify')({
  logger: true,
  ajv: {
    customOptions: {
      strict: false // permite a keyword "example" usada nos schemas do Swagger
    }
  }
});

const errorHandler = require('./shared/errors/errorHandler');

const moedaRoutes = require('./features/moedas/moeda.routes');
const usuarioRoutes = require('./features/usuarios/usuario.routes');
const configuracaoRoutes = require('./features/configuracoes/configuracao.routes');
const carteiraRoutes = require('./features/carteiras/carteira.routes');
const taxaRoutes = require('./features/taxas/taxa.routes');
const operacaoRoutes = require('./features/operacoes/operacao.routes');

async function build() {
  // --- Swagger / OpenAPI ---
  await fastify.register(require('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'API de Conversão de Moedas',
        description: 'Trabalho prático de DW3 — API RESTful para gestão de carteiras multi-moeda e conversões',
        version: '1.0.0'
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  });

  await fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs'
  });

  // --- Error Handler Global ---
  fastify.setErrorHandler(errorHandler);

  // --- Rotas ---
  await fastify.register(moedaRoutes);
  await fastify.register(usuarioRoutes);
  await fastify.register(configuracaoRoutes);
  await fastify.register(carteiraRoutes);
  await fastify.register(taxaRoutes);
  await fastify.register(operacaoRoutes);

  return fastify;
}

async function start() {
  try {
    const app = await build();
    const port = process.env.PORT || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Documentação Swagger em http://localhost:${port}/docs`);
  } catch (erro) {
    fastify.log.error(erro);
    process.exit(1);
  }
}

start();
