class MoedaRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async criar({ codigo, nome }) {
    const result = await this.pool.query(
      `INSERT INTO moedas (codigo, nome) VALUES ($1, $2) RETURNING *`,
      [codigo, nome]
    );
    return result.rows[0];
  }

  async listarTodas() {
    const result = await this.pool.query(`SELECT * FROM moedas ORDER BY codigo`);
    return result.rows;
  }

  async buscarPorId(id) {
    const result = await this.pool.query(`SELECT * FROM moedas WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async buscarPorCodigo(codigo) {
    const result = await this.pool.query(`SELECT * FROM moedas WHERE codigo = $1`, [codigo]);
    return result.rows[0] || null;
  }

  async atualizar(id, { codigo, nome }) {
    const result = await this.pool.query(
      `UPDATE moedas SET codigo = $1, nome = $2 WHERE id = $3 RETURNING *`,
      [codigo, nome, id]
    );
    return result.rows[0] || null;
  }

  async deletar(id) {
    const result = await this.pool.query(`DELETE FROM moedas WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0] || null;
  }

  async estaEmUsoEmCarteira(id) {
    const result = await this.pool.query(
      `SELECT 1 FROM carteira_moedas WHERE moeda_id = $1 LIMIT 1`,
      [id]
    );
    return result.rows.length > 0;
  }
}

module.exports = MoedaRepository;
