class CarteiraController {
  constructor(carteiraService) {
    this.carteiraService = carteiraService;
  }

  criar = async (request, reply) => {
    const carteira = await this.carteiraService.criar(request.body, request.usuarioId);
    return reply.status(201).send(carteira);
  };

  listarTodas = async (request, reply) => {
    const carteiras = await this.carteiraService.listarTodas();
    return reply.status(200).send(carteiras);
  };

  buscarPorId = async (request, reply) => {
    const carteira = await this.carteiraService.buscarPorId(request.params.id);
    return reply.status(200).send(carteira);
  };

  listarMembros = async (request, reply) => {
    const membros = await this.carteiraService.listarMembros(request.params.id);
    return reply.status(200).send(membros);
  };

  listarSaldos = async (request, reply) => {
    const saldos = await this.carteiraService.listarSaldos(request.params.id);
    return reply.status(200).send(saldos);
  };

  adicionarMembro = async (request, reply) => {
    const membro = await this.carteiraService.adicionarMembro(
      request.params.id,
      request.usuarioId,
      request.body
    );
    return reply.status(201).send(membro);
  };

  atualizarPapelMembro = async (request, reply) => {
    const membro = await this.carteiraService.atualizarPapelMembro(
      request.params.id,
      request.usuarioId,
      request.params.usuarioAlvoId,
      request.body.papel
    );
    return reply.status(200).send(membro);
  };

  removerMembro = async (request, reply) => {
    await this.carteiraService.removerMembro(
      request.params.id,
      request.usuarioId,
      request.params.usuarioAlvoId
    );
    return reply.status(204).send();
  };

  transferirTitularidade = async (request, reply) => {
    const resultado = await this.carteiraService.transferirTitularidade(
      request.params.id,
      request.usuarioId,
      request.body.novoDonoId
    );
    return reply.status(200).send(resultado);
  };

  atualizarVisibilidade = async (request, reply) => {
    const carteira = await this.carteiraService.atualizarVisibilidade(
      request.params.id,
      request.usuarioId,
      request.body.visibilidade
    );
    return reply.status(200).send(carteira);
  };

  deletar = async (request, reply) => {
    await this.carteiraService.deletar(request.params.id, request.usuarioId);
    return reply.status(204).send();
  };
}

module.exports = CarteiraController;
