const AppError = require('../../shared/errors/AppError');

const PAPEIS_VALIDOS = ['dono', 'operador', 'comentador', 'leitor'];

class CarteiraService {
  constructor(carteiraRepository) {
    this.carteiraRepository = carteiraRepository;
  }

  async criar({ nome, visibilidade }, usuarioCriadorId) {
    if (!nome) {
      throw new AppError('Nome da carteira é obrigatório', 400);
    }

    const carteira = await this.carteiraRepository.criar({ nome, visibilidade });

    // Regra de negócio: quem cria a carteira vira dono automaticamente
    await this.carteiraRepository.adicionarMembro({
      usuarioId: usuarioCriadorId,
      carteiraId: carteira.id,
      papel: 'dono'
    });

    return carteira;
  }

  async buscarPorId(id) {
    const carteira = await this.carteiraRepository.buscarPorId(id);
    if (!carteira) {
      throw new AppError('Carteira não encontrada', 404);
    }
    return carteira;
  }

  async listarTodas() {
    return this.carteiraRepository.listarTodas();
  }

  async listarMembros(carteiraId) {
    await this.buscarPorId(carteiraId);
    return this.carteiraRepository.listarMembros(carteiraId);
  }

  async listarSaldos(carteiraId) {
    await this.buscarPorId(carteiraId);
    return this.carteiraRepository.listarSaldos(carteiraId);
  }

  // Usado por outras features (ex: operacoes) pra checar saldo sem acessar o repository diretamente
  async buscarSaldo(carteiraId, moedaId) {
    return this.carteiraRepository.buscarSaldo(carteiraId, moedaId);
  }

  // Busca o papel do usuário na carteira, lançando erro se ele não for membro.
  // Usado pelas outras features (ex: operacoes) para checar permissão.
  async obterPapelObrigatorio(usuarioId, carteiraId) {
    const papel = await this.carteiraRepository.buscarPapel(usuarioId, carteiraId);
    if (!papel) {
      throw new AppError('Usuário não tem acesso a esta carteira', 403);
    }
    return papel;
  }

  async adicionarMembro(carteiraId, solicitanteId, { usuarioId, papel }) {
    await this.buscarPorId(carteiraId);

    // Regra de negócio: só dono pode adicionar membros
    const papelSolicitante = await this.obterPapelObrigatorio(solicitanteId, carteiraId);
    if (papelSolicitante !== 'dono') {
      throw new AppError('Apenas o dono da carteira pode adicionar membros', 403);
    }

    if (!PAPEIS_VALIDOS.includes(papel)) {
      throw new AppError(`Papel inválido. Use um dos: ${PAPEIS_VALIDOS.join(', ')}`, 400);
    }

    // Regra de negócio: não pode adicionar outro membro já como 'dono' (dono único)
    if (papel === 'dono') {
      throw new AppError('Não é possível adicionar um segundo dono. Use a transferência de titularidade', 409);
    }

    const jaEhMembro = await this.carteiraRepository.buscarPapel(usuarioId, carteiraId);
    if (jaEhMembro) {
      throw new AppError('Este usuário já é membro da carteira', 409);
    }

    return this.carteiraRepository.adicionarMembro({ usuarioId, carteiraId, papel });
  }

  async atualizarPapelMembro(carteiraId, solicitanteId, usuarioAlvoId, novoPapel) {
    await this.buscarPorId(carteiraId);

    const papelSolicitante = await this.obterPapelObrigatorio(solicitanteId, carteiraId);
    if (papelSolicitante !== 'dono') {
      throw new AppError('Apenas o dono da carteira pode alterar papéis de membros', 403);
    }

    if (!PAPEIS_VALIDOS.includes(novoPapel)) {
      throw new AppError(`Papel inválido. Use um dos: ${PAPEIS_VALIDOS.join(', ')}`, 400);
    }

    // Regra de negócio: dono único — não dá pra "promover" alguém a dono por aqui
    if (novoPapel === 'dono') {
      throw new AppError('Use a rota de transferência de titularidade para trocar o dono', 409);
    }

    const alvoEhMembro = await this.carteiraRepository.buscarPapel(usuarioAlvoId, carteiraId);
    if (!alvoEhMembro) {
      throw new AppError('Usuário informado não é membro desta carteira', 404);
    }
    if (alvoEhMembro === 'dono') {
      throw new AppError('Não é possível alterar o papel do dono por esta rota', 409);
    }

    return this.carteiraRepository.atualizarPapel(usuarioAlvoId, carteiraId, novoPapel);
  }

  async removerMembro(carteiraId, solicitanteId, usuarioAlvoId) {
    await this.buscarPorId(carteiraId);

    const papelSolicitante = await this.obterPapelObrigatorio(solicitanteId, carteiraId);
    if (papelSolicitante !== 'dono') {
      throw new AppError('Apenas o dono da carteira pode remover membros', 403);
    }

    const papelAlvo = await this.carteiraRepository.buscarPapel(usuarioAlvoId, carteiraId);
    if (!papelAlvo) {
      throw new AppError('Usuário informado não é membro desta carteira', 404);
    }
    if (papelAlvo === 'dono') {
      throw new AppError('O dono não pode ser removido. Transfira a titularidade antes', 409);
    }

    return this.carteiraRepository.removerMembro(usuarioAlvoId, carteiraId);
  }

  async transferirTitularidade(carteiraId, solicitanteId, novoDonoId) {
    await this.buscarPorId(carteiraId);

    const papelSolicitante = await this.obterPapelObrigatorio(solicitanteId, carteiraId);
    if (papelSolicitante !== 'dono') {
      throw new AppError('Apenas o dono atual pode transferir a titularidade', 403);
    }

    if (solicitanteId === novoDonoId) {
      throw new AppError('Você já é o dono desta carteira', 409);
    }

    const papelNovoDono = await this.carteiraRepository.buscarPapel(novoDonoId, carteiraId);
    if (!papelNovoDono) {
      throw new AppError('O novo dono precisa já ser membro da carteira', 404);
    }

    await this.carteiraRepository.transferirTitularidade(carteiraId, solicitanteId, novoDonoId);
    return { mensagem: 'Titularidade transferida com sucesso' };
  }

  async atualizarVisibilidade(carteiraId, solicitanteId, visibilidade) {
    await this.buscarPorId(carteiraId);

    // Regra de negócio: só o dono pode mudar a visibilidade
    const papelSolicitante = await this.obterPapelObrigatorio(solicitanteId, carteiraId);
    if (papelSolicitante !== 'dono') {
      throw new AppError('Apenas o dono da carteira pode alterar a visibilidade', 403);
    }

    if (!['privada', 'publica'].includes(visibilidade)) {
      throw new AppError("Visibilidade deve ser 'privada' ou 'publica'", 400);
    }

    return this.carteiraRepository.atualizarVisibilidade(carteiraId, visibilidade);
  }

  async deletar(carteiraId, solicitanteId) {
    await this.buscarPorId(carteiraId);

    // Regra de negócio: só o dono pode deletar a carteira
    const papelSolicitante = await this.obterPapelObrigatorio(solicitanteId, carteiraId);
    if (papelSolicitante !== 'dono') {
      throw new AppError('Apenas o dono da carteira pode excluí-la', 403);
    }

    return this.carteiraRepository.deletar(carteiraId);
  }
}

module.exports = CarteiraService;
