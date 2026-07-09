class ConfiguracaoController {
  constructor(configuracaoService) {
    this.configuracaoService = configuracaoService;
  }

  criar = async (request, reply) => {
    const configuracao = await this.configuracaoService.criar(request.usuarioId, request.body);
    return reply.status(201).send(configuracao);
  };

  buscarMinha = async (request, reply) => {
    const configuracao = await this.configuracaoService.buscarPorUsuarioId(request.usuarioId);
    return reply.status(200).send(configuracao);
  };

  atualizar = async (request, reply) => {
    const configuracao = await this.configuracaoService.atualizar(request.usuarioId, request.body);
    return reply.status(200).send(configuracao);
  };
}

module.exports = ConfiguracaoController;
