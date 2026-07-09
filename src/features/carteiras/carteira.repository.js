class CarteiraRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async criar({ nome, visibilidade }) {
    const result = await this.pool.query(
      `INSERT INTO carteiras (nome, visibilidade) VALUES ($1, COALESCE($2, 'privada'))
       RETURNING *`,
      [nome, visibilidade]
    );
    return result.rows[0];
  }

  async buscarPorId(id) {
    const result = await this.pool.query(`SELECT * FROM carteiras WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async listarTodas() {
    const result = await this.pool.query(`SELECT * FROM carteiras ORDER BY id`);
    return result.rows;
  }

  async atualizarVisibilidade(id, visibilidade) {
    const result = await this.pool.query(
      `UPDATE carteiras SET visibilidade = $1 WHERE id = $2 RETURNING *`,
      [visibilidade, id]
    );
    return result.rows[0] || null;
  }

  async deletar(id) {
    const result = await this.pool.query(`DELETE FROM carteiras WHERE id = $1 RETURNING id`, [id]);
    return result.rows[0] || null;
  }

  // ---------- Membros (pivô usuario_carteiras) ----------

  async adicionarMembro({ usuarioId, carteiraId, papel }) {
    const result = await this.pool.query(
      `INSERT INTO usuario_carteiras (usuario_id, carteira_id, papel)
       VALUES ($1, $2, $3) RETURNING *`,
      [usuarioId, carteiraId, papel]
    );
    return result.rows[0];
  }

  async buscarPapel(usuarioId, carteiraId) {
    const result = await this.pool.query(
      `SELECT papel FROM usuario_carteiras WHERE usuario_id = $1 AND carteira_id = $2`,
      [usuarioId, carteiraId]
    );
    return result.rows[0]?.papel || null;
  }

  async buscarDono(carteiraId) {
    const result = await this.pool.query(
      `SELECT usuario_id FROM usuario_carteiras WHERE carteira_id = $1 AND papel = 'dono'`,
      [carteiraId]
    );
    return result.rows[0]?.usuario_id || null;
  }

  async listarMembros(carteiraId) {
    const result = await this.pool.query(
      `SELECT uc.usuario_id, uc.papel, u.nome, u.email
       FROM usuario_carteiras uc
       INNER JOIN usuarios u ON u.id = uc.usuario_id
       WHERE uc.carteira_id = $1
       ORDER BY uc.papel`,
      [carteiraId]
    );
    return result.rows;
  }

  async atualizarPapel(usuarioId, carteiraId, papel) {
    const result = await this.pool.query(
      `UPDATE usuario_carteiras SET papel = $1 WHERE usuario_id = $2 AND carteira_id = $3
       RETURNING *`,
      [papel, usuarioId, carteiraId]
    );
    return result.rows[0] || null;
  }

  async removerMembro(usuarioId, carteiraId) {
    const result = await this.pool.query(
      `DELETE FROM usuario_carteiras WHERE usuario_id = $1 AND carteira_id = $2 RETURNING *`,
      [usuarioId, carteiraId]
    );
    return result.rows[0] || null;
  }

  // Transfere titularidade: rebaixa o dono atual pra operador e promove o novo, atomicamente
  async transferirTitularidade(carteiraId, donoAtualId, novoDonoId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE usuario_carteiras SET papel = 'operador' WHERE usuario_id = $1 AND carteira_id = $2`,
        [donoAtualId, carteiraId]
      );
      await client.query(
        `UPDATE usuario_carteiras SET papel = 'dono' WHERE usuario_id = $1 AND carteira_id = $2`,
        [novoDonoId, carteiraId]
      );
      await client.query('COMMIT');
    } catch (erro) {
      await client.query('ROLLBACK');
      throw erro;
    } finally {
      client.release();
    }
  }

  // ---------- Saldos (pivô carteira_moedas) ----------

  async listarSaldos(carteiraId) {
    const result = await this.pool.query(
      `SELECT cm.moeda_id, m.codigo, m.nome, cm.saldo
       FROM carteira_moedas cm
       INNER JOIN moedas m ON m.id = cm.moeda_id
       WHERE cm.carteira_id = $1
       ORDER BY m.codigo`,
      [carteiraId]
    );
    return result.rows;
  }

  async buscarSaldo(carteiraId, moedaId) {
    const result = await this.pool.query(
      `SELECT saldo FROM carteira_moedas WHERE carteira_id = $1 AND moeda_id = $2`,
      [carteiraId, moedaId]
    );
    return result.rows[0]?.saldo ?? null; // null = carteira ainda não tem essa moeda
  }
}

module.exports = CarteiraRepository;
