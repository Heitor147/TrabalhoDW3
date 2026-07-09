const AppError = require('./AppError');

function errorHandler(error, request, reply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      message: error.message
    });
  }

  // Erros de validação do schema do Fastify
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      message: 'Dados inválidos: ' + error.message
    });
  }

  // Erro não previsto: loga no servidor, mas não expõe detalhe interno pro cliente
  request.log.error(error);
  return reply.status(500).send({
    statusCode: 500,
    message: 'Erro interno do servidor'
  });
}

module.exports = errorHandler;
