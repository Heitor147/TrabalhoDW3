class OperacaoController {
  constructor(operacaoService) {
    this.operacaoService = operacaoService;
  }

  criarDireta = async (request, reply) => {
    const operacao = await this.operacaoService.criarOperacaoDireta(
      request.params.carteiraId,
      request.usuarioId,
      request.body
    );
    return reply.status(201).send(operacao);
  };

  sugerir = async (request, reply) => {
    const sugestao = await this.operacaoService.sugerirOperacao(
      request.params.carteiraId,
      request.usuarioId,
      request.body
    );
    return reply.status(201).send(sugestao);
  };

  aprovar = async (request, reply) => {
    const operacao = await this.operacaoService.aprovarSugestao(request.params.id, request.usuarioId);
    return reply.status(200).send(operacao);
  };

  rejeitar = async (request, reply) => {
    const operacao = await this.operacaoService.rejeitarSugestao(request.params.id, request.usuarioId);
    return reply.status(200).send(operacao);
  };

  buscarDetalhada = async (request, reply) => {
    const operacao = await this.operacaoService.buscarDetalhada(request.params.id);
    return reply.status(200).send(operacao);
  };

  listarPorCarteira = async (request, reply) => {
    const operacoes = await this.operacaoService.listarPorCarteira(
      request.params.carteiraId,
      request.usuarioId
    );
    return reply.status(200).send(operacoes);
  };

  compararComTaxaAtual = async (request, reply) => {
    const comparacao = await this.operacaoService.compararComTaxaAtual(request.params.id);
    return reply.status(200).send(comparacao);
  };

  deletar = async (request, reply) => {
    await this.operacaoService.deletar(request.params.id, request.usuarioId);
    return reply.status(204).send();
  };
}

module.exports = OperacaoController;
