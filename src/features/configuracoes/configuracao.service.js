const AppError = require('../../shared/errors/AppError');

class ConfiguracaoService {
  constructor(configuracaoRepository) {
    this.configuracaoRepository = configuracaoRepository;
  }

  async criar(usuarioId, { moedaPadraoId, idioma }) {
    // Regra de negócio: 1:1 — usuário não pode ter duas configurações
    const existente = await this.configuracaoRepository.buscarPorUsuarioId(usuarioId);
    if (existente) {
      throw new AppError('Este usuário já possui uma configuração cadastrada', 409);
    }
    return this.configuracaoRepository.criar({ usuarioId, moedaPadraoId, idioma });
  }

  async buscarPorUsuarioId(usuarioId) {
    const configuracao = await this.configuracaoRepository.buscarPorUsuarioId(usuarioId);
    if (!configuracao) {
      throw new AppError('Configuração não encontrada para este usuário', 404);
    }
    return configuracao;
  }

  async atualizar(usuarioId, { moedaPadraoId, idioma }) {
    await this.buscarPorUsuarioId(usuarioId);
    return this.configuracaoRepository.atualizar(usuarioId, { moedaPadraoId, idioma });
  }
}

module.exports = ConfiguracaoService;
