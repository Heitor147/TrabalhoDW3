const AppError = require('../../shared/errors/AppError');

class OperacaoService {
  constructor(operacaoRepository, carteiraService, taxaService) {
    this.operacaoRepository = operacaoRepository;
    this.carteiraService = carteiraService;
    this.taxaService = taxaService;
  }

  async _validarSaldoSuficiente(carteiraId, moedaOrigemId, valor) {
    const saldoAtual = await this.carteiraService.buscarSaldo(carteiraId, moedaOrigemId);

    // Regra de negócio: saldo insuficiente cancela a operação
    if (saldoAtual === null || Number(saldoAtual) < Number(valor)) {
      throw new AppError('Saldo insuficiente para realizar esta operação', 400);
    }
  }

  /**
   * Operador ou dono: cria e executa a operação diretamente (status 'confirmada').
   */
  async criarOperacaoDireta(carteiraId, usuarioId, { moedaOrigemId, moedaDestinoId, valor }) {
    if (!moedaOrigemId || !moedaDestinoId || !valor) {
      throw new AppError('Moeda de origem, destino e valor são obrigatórios', 400);
    }
    if (valor <= 0) {
      throw new AppError('O valor da operação deve ser maior que zero', 400);
    }
    if (moedaOrigemId === moedaDestinoId) {
      throw new AppError('Moeda de origem e destino não podem ser a mesma', 400);
    }

    // Regra de negócio: permissão por papel
    const papel = await this.carteiraService.obterPapelObrigatorio(usuarioId, carteiraId);
    if (papel !== 'operador' && papel !== 'dono') {
      throw new AppError('Apenas operadores ou o dono podem criar operações diretamente', 403);
    }

    await this._validarSaldoSuficiente(carteiraId, moedaOrigemId, valor);

    const { valor: taxaAtual } = await this.taxaService.obterTaxaAtual(moedaOrigemId, moedaDestinoId);
    const valorConvertido = Number(valor) * taxaAtual;

    const operacao = await this.operacaoRepository.criar({
      carteiraId, usuarioId, moedaOrigemId, moedaDestinoId,
      valor, taxaUtilizada: taxaAtual, status: 'confirmada'
    });

    return this.operacaoRepository.executarConversao({
      operacaoId: operacao.id,
      carteiraId,
      moedaOrigemId,
      moedaDestinoId,
      valorOrigem: valor,
      valorDestino: valorConvertido,
      novoStatus: 'confirmada',
      aprovadoPor: null
    });
  }

  /**
   * Comentador: cria uma sugestão, que fica pendente até aprovação.
   * Não mexe em saldo ainda.
   */
  async sugerirOperacao(carteiraId, usuarioId, { moedaOrigemId, moedaDestinoId, valor }) {
    if (!moedaOrigemId || !moedaDestinoId || !valor) {
      throw new AppError('Moeda de origem, destino e valor são obrigatórios', 400);
    }
    if (valor <= 0) {
      throw new AppError('O valor da operação deve ser maior que zero', 400);
    }

    // Regra de negócio: leitor não sugere, só comentador/operador/dono podem
    const papel = await this.carteiraService.obterPapelObrigatorio(usuarioId, carteiraId);
    if (papel === 'leitor') {
      throw new AppError('Leitores não podem sugerir operações', 403);
    }

    // Checagem antecipada de saldo, mesmo sendo sugestão, pra dar feedback já na criação
    await this._validarSaldoSuficiente(carteiraId, moedaOrigemId, valor);

    const { valor: taxaAtual } = await this.taxaService.obterTaxaAtual(moedaOrigemId, moedaDestinoId);

    return this.operacaoRepository.criar({
      carteiraId, usuarioId, moedaOrigemId, moedaDestinoId,
      valor, taxaUtilizada: taxaAtual, status: 'pendente'
    });
  }

  /**
   * Operador ou dono aprova uma sugestão: a operação é executada automaticamente
   * (debita/credita saldo) na mesma ação, de forma atômica.
   */
  async aprovarSugestao(operacaoId, aprovadorId) {
    const operacao = await this.operacaoRepository.buscarPorId(operacaoId);
    if (!operacao) {
      throw new AppError('Operação não encontrada', 404);
    }
    if (operacao.status !== 'pendente') {
      throw new AppError('Apenas sugestões pendentes podem ser aprovadas', 409);
    }

    // Regra de negócio: só operador ou dono aprovam
    const papel = await this.carteiraService.obterPapelObrigatorio(aprovadorId, operacao.carteira_id);
    if (papel !== 'operador' && papel !== 'dono') {
      throw new AppError('Apenas operadores ou o dono podem aprovar sugestões', 403);
    }

    // Revalida saldo no momento da aprovação (pode ter mudado desde a sugestão)
    await this._validarSaldoSuficiente(operacao.carteira_id, operacao.moeda_origem_id, operacao.valor);

    const valorConvertido = Number(operacao.valor) * Number(operacao.taxa_utilizada);

    return this.operacaoRepository.executarConversao({
      operacaoId: operacao.id,
      carteiraId: operacao.carteira_id,
      moedaOrigemId: operacao.moeda_origem_id,
      moedaDestinoId: operacao.moeda_destino_id,
      valorOrigem: operacao.valor,
      valorDestino: valorConvertido,
      novoStatus: 'aprovada',
      aprovadoPor: aprovadorId
    });
  }

  async rejeitarSugestao(operacaoId, aprovadorId) {
    const operacao = await this.operacaoRepository.buscarPorId(operacaoId);
    if (!operacao) {
      throw new AppError('Operação não encontrada', 404);
    }
    if (operacao.status !== 'pendente') {
      throw new AppError('Apenas sugestões pendentes podem ser rejeitadas', 409);
    }

    const papel = await this.carteiraService.obterPapelObrigatorio(aprovadorId, operacao.carteira_id);
    if (papel !== 'operador' && papel !== 'dono') {
      throw new AppError('Apenas operadores ou o dono podem rejeitar sugestões', 403);
    }

    return this.operacaoRepository.atualizarStatusSimples(operacaoId, 'rejeitada');
  }

  async buscarDetalhada(id) {
    const operacao = await this.operacaoRepository.buscarDetalhada(id);
    if (!operacao) {
      throw new AppError('Operação não encontrada', 404);
    }
    return operacao;
  }

  async listarPorCarteira(carteiraId, usuarioId) {
    // Regra de negócio: só quem tem papel na carteira pode ver o histórico dela
    await this.carteiraService.obterPapelObrigatorio(usuarioId, carteiraId);
    return this.operacaoRepository.listarPorCarteira(carteiraId);
  }

  /**
   * Feature "Comparar com Taxa Atual": pega a taxa congelada da operação
   * e compara com a taxa vigente agora, mostrando a variação percentual.
   */
  async compararComTaxaAtual(id) {
    const operacao = await this.buscarDetalhada(id);
    const { valor: taxaAtual } = await this.taxaService.obterTaxaAtual(
      operacao.moeda_origem_id,
      operacao.moeda_destino_id
    );

    const taxaOriginal = Number(operacao.taxa_utilizada);
    const variacaoPercentual = ((taxaAtual - taxaOriginal) / taxaOriginal) * 100;

    return {
      taxaUtilizadaNaOperacao: taxaOriginal,
      taxaAtual,
      variacaoPercentual: Number(variacaoPercentual.toFixed(4)),
      valorConvertidoNaEpoca: Number(operacao.valor) * taxaOriginal,
      valorConvertidoComTaxaAtual: Number(operacao.valor) * taxaAtual
    };
  }

  async deletar(id, usuarioId) {
    const operacao = await this.operacaoRepository.buscarPorId(id);
    if (!operacao) {
      throw new AppError('Operação não encontrada', 404);
    }

    const papel = await this.carteiraService.obterPapelObrigatorio(usuarioId, operacao.carteira_id);
    if (papel !== 'operador' && papel !== 'dono') {
      throw new AppError('Apenas operadores ou o dono podem excluir operações', 403);
    }

    // Regra de negócio adicional: não deletar operação já confirmada/aprovada,
    // pois isso desalinharia o saldo já creditado/debitado sem reverter a transação
    if (operacao.status === 'confirmada' || operacao.status === 'aprovada') {
      throw new AppError('Não é possível excluir uma operação já confirmada ou aprovada', 409);
    }

    return this.operacaoRepository.deletar(id);
  }
}

module.exports = OperacaoService;
