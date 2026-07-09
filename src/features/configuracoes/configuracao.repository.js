class ConfiguracaoRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async criar({ usuarioId, moedaPadraoId, idioma }) {
    const result = await this.pool.query(
      `INSERT INTO configuracoes (usuario_id, moeda_padrao_id, idioma)
       VALUES ($1, $2, COALESCE($3, 'pt-BR')) RETURNING *`,
      [usuarioId, moedaPadraoId, idioma]
    );
    return result.rows[0];
  }

  async buscarPorUsuarioId(usuarioId) {
    const result = await this.pool.query(
      `SELECT * FROM configuracoes WHERE usuario_id = $1`,
      [usuarioId]
    );
    return result.rows[0] || null;
  }

  async atualizar(usuarioId, { moedaPadraoId, idioma }) {
    const result = await this.pool.query(
      `UPDATE configuracoes SET moeda_padrao_id = $1, idioma = $2 WHERE usuario_id = $3
       RETURNING *`,
      [moedaPadraoId, idioma, usuarioId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ConfiguracaoRepository;
