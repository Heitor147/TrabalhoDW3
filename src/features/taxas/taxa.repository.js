class TaxaRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async criar({ moedaOrigemId, moedaDestinoId, valor }) {
    const result = await this.pool.query(
      `INSERT INTO taxas_cambio (moeda_origem_id, moeda_destino_id, valor)
       VALUES ($1, $2, $3) RETURNING *`,
      [moedaOrigemId, moedaDestinoId, valor]
    );
    return result.rows[0];
  }

  async listarTodas() {
    const result = await this.pool.query(
      `SELECT t.*, mo.codigo AS origem_codigo, md.codigo AS destino_codigo
       FROM taxas_cambio t
       INNER JOIN moedas mo ON mo.id = t.moeda_origem_id
       INNER JOIN moedas md ON md.id = t.moeda_destino_id
       ORDER BY t.data_referencia DESC`
    );
    return result.rows;
  }

  // Busca a taxa mais recente no sentido exato origem->destino
  async buscarMaisRecenteDireta(moedaOrigemId, moedaDestinoId) {
    const result = await this.pool.query(
      `SELECT * FROM taxas_cambio
       WHERE moeda_origem_id = $1 AND moeda_destino_id = $2
       ORDER BY data_referencia DESC LIMIT 1`,
      [moedaOrigemId, moedaDestinoId]
    );
    return result.rows[0] || null;
  }

  // Busca a taxa mais recente no sentido inverso destino->origem (pra inverter matematicamente)
  async buscarMaisRecenteInversa(moedaOrigemId, moedaDestinoId) {
    const result = await this.pool.query(
      `SELECT * FROM taxas_cambio
       WHERE moeda_origem_id = $2 AND moeda_destino_id = $1
       ORDER BY data_referencia DESC LIMIT 1`,
      [moedaOrigemId, moedaDestinoId]
    );
    return result.rows[0] || null;
  }
}

module.exports = TaxaRepository;
