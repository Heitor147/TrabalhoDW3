class TaxaController {
  constructor(taxaService) {
    this.taxaService = taxaService;
  }

  criar = async (request, reply) => {
    const taxa = await this.taxaService.criar(request.body);
    return reply.status(201).send(taxa);
  };

  listarTodas = async (request, reply) => {
    const taxas = await this.taxaService.listarTodas();
    return reply.status(200).send(taxas);
  };

  obterTaxaAtual = async (request, reply) => {
    const { origemId, destinoId } = request.params;
    const taxa = await this.taxaService.obterTaxaAtual(Number(origemId), Number(destinoId));
    return reply.status(200).send(taxa);
  };
}

module.exports = TaxaController;
