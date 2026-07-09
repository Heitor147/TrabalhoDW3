class OperacaoRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async criar({ carteiraId, usuarioId, moedaOrigemId, moedaDestinoId, valor, taxaUtilizada, status }) {
    const result = await this.pool.query(
      `INSERT INTO operacoes
        (carteira_id, usuario_id, moeda_origem_id, moeda_destino_id, valor, taxa_utilizada, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [carteiraId, usuarioId, moedaOrigemId, moedaDestinoId, valor, taxaUtilizada, status]
    );
    return result.rows[0];
  }

  async buscarPorId(id) {
    const result = await this.pool.query(`SELECT * FROM operacoes WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  // Consulta relacional (JOIN) pedida no enunciado: enriquece a operação com
  // dados do usuário, da carteira e das moedas envolvidas
  async buscarDetalhada(id) {
    const result = await this.pool.query(
      `SELECT
         o.*,
         u.nome AS usuario_nome,
         u.email AS usuario_email,
         c.nome AS carteira_nome,
         mo.codigo AS moeda_origem_codigo,
         md.codigo AS moeda_destino_codigo
       FROM operacoes o
       INNER JOIN usuarios u ON u.id = o.usuario_id
       INNER JOIN carteiras c ON c.id = o.carteira_id
       INNER JOIN moedas mo ON mo.id = o.moeda_origem_id
       INNER JOIN moedas md ON md.id = o.moeda_destino_id
       WHERE o.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async listarPorCarteira(carteiraId) {
    const result = await this.pool.query(
      `SELECT
         o.*,
         u.nome AS usuario_nome,
         mo.codigo AS moeda_origem_codigo,
         md.codigo AS moeda_destino_codigo
       FROM operacoes o
       INNER JOIN usuarios u ON u.id = o.usuario_id
       INNER JOIN moedas mo ON mo.id = o.moeda_origem_id
       INNER JOIN moedas md ON md.id = o.moeda_destino_id
       WHERE o.carteira_id = $1
       ORDER BY o.criado_em DESC`,
      [carteiraId]
    );
    return result.rows;
  }

  async atualizarStatusSimples(id, status) {
    const result = await this.pool.query(
      `UPDATE operacoes SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }

  async deletar(id) {
    const result = await this.pool.query(`DELETE FROM operacoes WHERE id = $1 RETURNING id`, [id]);
    return result.rows[0] || null;
  }

  /**
   * Executa a conversão de fato: debita origem, credita destino (via UPSERT),
   * e atualiza o status da operação — tudo dentro de uma única transação atômica.
   * Se qualquer passo falhar, tudo é revertido (ROLLBACK).
   */
  async executarConversao({ operacaoId, carteiraId, moedaOrigemId, moedaDestinoId, valorOrigem, valorDestino, novoStatus, aprovadoPor }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Debita da moeda de origem (a linha já existe, pois é impossível gastar o que não tem)
      await client.query(
        `UPDATE carteira_moedas SET saldo = saldo - $1
         WHERE carteira_id = $2 AND moeda_id = $3`,
        [valorOrigem, carteiraId, moedaOrigemId]
      );

      // Credita na moeda de destino via UPSERT: cria a linha com o valor se ainda não
      // existir, ou soma ao saldo já existente se já existir.
      await client.query(
        `INSERT INTO carteira_moedas (carteira_id, moeda_id, saldo)
         VALUES ($1, $2, $3)
         ON CONFLICT (carteira_id, moeda_id)
         DO UPDATE SET saldo = carteira_moedas.saldo + $3`,
        [carteiraId, moedaDestinoId, valorDestino]
      );

      const result = await client.query(
        `UPDATE operacoes SET status = $1, aprovado_por = $2 WHERE id = $3 RETURNING *`,
        [novoStatus, aprovadoPor, operacaoId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (erro) {
      await client.query('ROLLBACK');
      throw erro;
    } finally {
      client.release();
    }
  }
}

module.exports = OperacaoRepository;
