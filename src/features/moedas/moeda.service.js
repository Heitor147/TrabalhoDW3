const AppError = require('../../shared/errors/AppError');

class MoedaService {
  constructor(moedaRepository) {
    this.moedaRepository = moedaRepository;
  }

  async criar({ codigo, nome }) {
    if (!codigo || !nome) {
      throw new AppError('Código e nome da moeda são obrigatórios', 400);
    }

    const codigoNormalizado = codigo.toUpperCase();
    const existente = await this.moedaRepository.buscarPorCodigo(codigoNormalizado);

    if (existente) {
      throw new AppError(`Já existe uma moeda cadastrada com o código ${codigoNormalizado}`, 409);
    }

    return this.moedaRepository.criar({ codigo: codigoNormalizado, nome });
  }

  async listarTodas() {
    return this.moedaRepository.listarTodas();
  }

  async buscarPorId(id) {
    const moeda = await this.moedaRepository.buscarPorId(id);
    if (!moeda) {
      throw new AppError('Moeda não encontrada', 404);
    }
    return moeda;
  }

  async atualizar(id, { codigo, nome }) {
    await this.buscarPorId(id); // garante que existe, já lança 404 se não existir

    if (codigo) {
      const codigoNormalizado = codigo.toUpperCase();
      const existente = await this.moedaRepository.buscarPorCodigo(codigoNormalizado);
      if (existente && existente.id !== Number(id)) {
        throw new AppError(`Já existe uma moeda cadastrada com o código ${codigoNormalizado}`, 409);
      }
    }

    return this.moedaRepository.atualizar(id, { codigo: codigo?.toUpperCase(), nome });
  }

  async deletar(id) {
    await this.buscarPorId(id);

    // Regra de negócio: não deletar moeda vinculada a alguma carteira
    const emUso = await this.moedaRepository.estaEmUsoEmCarteira(id);
    if (emUso) {
      throw new AppError('Não é possível excluir uma moeda vinculada a uma ou mais carteiras', 409);
    }

    return this.moedaRepository.deletar(id);
  }
}

module.exports = MoedaService;
