class MoedaController {
  constructor(moedaService) {
    this.moedaService = moedaService;
  }

  criar = async (request, reply) => {
    const moeda = await this.moedaService.criar(request.body);
    return reply.status(201).send(moeda);
  };

  listarTodas = async (request, reply) => {
    const moedas = await this.moedaService.listarTodas();
    return reply.status(200).send(moedas);
  };

  buscarPorId = async (request, reply) => {
    const moeda = await this.moedaService.buscarPorId(request.params.id);
    return reply.status(200).send(moeda);
  };

  atualizar = async (request, reply) => {
    const moeda = await this.moedaService.atualizar(request.params.id, request.body);
    return reply.status(200).send(moeda);
  };

  deletar = async (request, reply) => {
    await this.moedaService.deletar(request.params.id);
    return reply.status(204).send();
  };
}

module.exports = MoedaController;
