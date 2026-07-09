const AppError = require('../../shared/errors/AppError');

class TaxaService {
  constructor(taxaRepository) {
    this.taxaRepository = taxaRepository;
  }

  async criar({ moedaOrigemId, moedaDestinoId, valor }) {
    if (!moedaOrigemId || !moedaDestinoId || !valor) {
      throw new AppError('Moeda de origem, destino e valor são obrigatórios', 400);
    }
    if (moedaOrigemId === moedaDestinoId) {
      throw new AppError('Moeda de origem e destino não podem ser a mesma', 400);
    }
    if (valor <= 0) {
      throw new AppError('O valor da taxa deve ser maior que zero', 400);
    }
    return this.taxaRepository.criar({ moedaOrigemId, moedaDestinoId, valor });
  }

  async listarTodas() {
    return this.taxaRepository.listarTodas();
  }

  // Retorna { valor, invertida } — invertida indica se o valor veio de 1/taxa_inversa
  async obterTaxaAtual(moedaOrigemId, moedaDestinoId) {
    const direta = await this.taxaRepository.buscarMaisRecenteDireta(moedaOrigemId, moedaDestinoId);
    if (direta) {
      return { valor: Number(direta.valor), invertida: false, dataReferencia: direta.data_referencia };
    }

    const inversa = await this.taxaRepository.buscarMaisRecenteInversa(moedaOrigemId, moedaDestinoId);
    if (inversa) {
      return {
        valor: 1 / Number(inversa.valor),
        invertida: true,
        dataReferencia: inversa.data_referencia
      };
    }

    throw new AppError('Não há taxa de câmbio cadastrada para este par de moedas', 404);
  }
}

module.exports = TaxaService;
